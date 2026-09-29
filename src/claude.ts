// Copied from flowra-content-engine/src/claude.ts (keep the two in step).
// Every model call goes through Claude Code's command line (`claude -p`), so
// the social agent runs on a Claude subscription, not a paid API key.
//
// Auth: in GitHub Actions, the secret CLAUDE_CODE_OAUTH_TOKEN, made once with
// `claude setup-token` on a machine logged in to the subscription. Locally,
// whatever `claude` is already logged in with. ANTHROPIC_API_KEY is removed
// from the child's environment on purpose: if it were set, Claude Code would
// bill the API instead of using the subscription.

import { spawn } from "node:child_process";
import { z } from "zod";

// "opus" is the alias for the newest Opus on the account. Set CLAUDE_MODEL to
// "sonnet" if the subscription's Claude Code usage runs short.
export const MODEL = process.env.CLAUDE_MODEL ?? "opus";

type Effort = "low" | "medium" | "high" | "xhigh" | "max";

// Claude Code reports what the same work would cost on the API. On a
// subscription nothing is billed per call; it is logged as a measure of load.
let equivalent = 0;
export const costSoFar = () => equivalent;

export class StopError extends Error {}

interface CliResult {
  is_error: boolean;
  subtype: string;
  result?: string;
  structured_output?: unknown;
  total_cost_usd?: number;
  api_error_status?: number | null;
}

const TIMEOUT_MS = 25 * 60_000;

function runClaude(args: string[], input: string): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY; // never fall back to API billing
    const child = spawn("claude", ["-p", "--output-format", "json", "--no-session-persistence", "--setting-sources", "", "--model", MODEL, ...args], {
      env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), TIMEOUT_MS);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => reject(new StopError(`Could not start Claude Code (is it installed?): ${e.message}`)));
    child.on("close", (code) => {
      clearTimeout(timer);
      let parsed: CliResult;
      try {
        parsed = JSON.parse(out) as CliResult;
      } catch {
        return reject(new StopError(`Claude Code exited ${code} without a result. ${err.slice(-800)}`));
      }
      equivalent += parsed.total_cost_usd ?? 0;
      if (parsed.is_error || parsed.subtype !== "success") {
        const text = `${parsed.result ?? ""} ${err}`.slice(0, 800);
        const limited = /limit|quota|usage|429/i.test(text) || parsed.api_error_status === 429;
        return reject(new StopError(limited ? `The Claude subscription's usage limit was reached; the next run tries again. (${text.trim()})` : `Claude Code failed (${parsed.subtype}): ${text.trim()}`));
      }
      resolve(parsed);
    });
    child.stdin.end(input);
  });
}

/** zod's output declares draft 2020-12 via "$schema", which Claude Code's validator does not load; the schema itself is plain. */
export function jsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _drop, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

/** One task whose answer must match a schema (briefs, verdicts, edit lists). */
export async function askJson<T extends z.ZodType>(opts: { system: string; prompt: string; schema: T; effort?: Effort; readFiles?: boolean }): Promise<z.infer<T>> {
  // readFiles lets Claude open local files the prompt names (it is how it
  // looks at a screenshot); nothing else.
  const res = await runClaude(
    [
      "--system-prompt", opts.system,
      "--tools", opts.readFiles ? "Read" : "",
      ...(opts.readFiles ? ["--allowedTools", "Read"] : []),
      "--json-schema", JSON.stringify(jsonSchema(opts.schema)),
      "--effort", opts.effort ?? "high",
      "--max-turns", opts.readFiles ? "8" : "5",
    ],
    opts.prompt,
  );
  const checked = opts.schema.safeParse(res.structured_output);
  if (!checked.success) throw new StopError(`The answer did not match the expected format: ${checked.error.message.slice(0, 300)}`);
  return checked.data as z.infer<T>;
}
