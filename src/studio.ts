// The Floey director (stages 5 and 6 of docs/production-process.md).
//
// The old director was an open-ended agent that hand-wrote the animation and
// then looked at screenshots for up to 120 turns; every turn re-read the whole
// conversation, so one reel could use a whole Claude session. This one keeps
// Opus for every creative decision and removes the waste:
//
//   1. write: one call writes the scene from the approved studio parts
//      (brand/studio), with reel 000 as the worked example
//   2. code checks (src/scenecheck.ts): framing, text, timing; up to 2 fixes
//   3. look: the stills of every panel on ONE contact sheet, reviewed in a
//      fresh call against the storyboard and the founder's rules; up to 2
//      rounds of fixes, each re-checked in code
//
// Each call starts fresh, so the cost stays flat however many rounds run.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { agent, askJson } from "./claude.ts";
import { beatStarts, checkScene, loadMouths, type Line } from "./scenecheck.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8");

const Review = z.object({
  pass: z.boolean().describe("True only if every panel reads clearly at phone size and nothing below needs fixing."),
  fixes: z.array(z.string()).describe("Each a concrete change: which still, what is wrong, what to do. Empty when it passes."),
});

function studioBrief(): string {
  const propsDoc = read("brand/studio/props.js").split("\n").filter((l) => l.startsWith("//")).join("\n");
  return [
    "THE STUDIO (what you draw with; use these parts, they are approved):",
    read("brand/studio/README.md"),
    "brand/studio/props.js, its header:",
    propsDoc,
    "THE WORKED EXAMPLE: reel 000, approved by the founder. Match its craft: a world that is built once, a camera that moves with purpose, Floey acting every line (anticipation, follow-through, small behaviours between actions), sounds on every action, and an ending that loops to the opening shot.",
    read("reel/floey/template.html"),
  ].join("\n\n");
}

/** Stills of every panel on one sheet, numbered in order, for one look. */
function contactSheet(dir: string, scene: string, times: number[]): string {
  const out = path.join(dir, "build");
  execFileSync("npx", ["tsx", path.join(ROOT, "brand/mascot/render-scene.mts"), scene, "stills", `--out=${out}`, `--stills=${times.map((t) => t.toFixed(2)).join(",")}`], { stdio: ["ignore", "pipe", "inherit"], cwd: ROOT });
  return path.join(out, "stills.png");
}

export async function directFloey(dir: string, system: string, opts: { lines: Line[]; story: unknown; board: { panels: { beat: number; at: number }[] }; seconds: Record<string, number>; notes?: string }): Promise<{ scene: string; log: string[] }> {
  const scene = path.join(dir, "scene.html");
  const log: string[] = [];
  const mouths = loadMouths(path.join(dir, "build"));
  const brief = studioBrief();
  const base = [
    system,
    "You are the director and animator of one Flowra reel, told by Floey in her page-flower garden. You write the whole scene page in one go, at the founder's quality bar.",
    brief,
  ].join("\n\n");
  const context = [
    "The lines Floey speaks (window.LINES from lines.js, in this order; never change them):",
    JSON.stringify(opts.lines, null, 1),
    "How long each line takes to say, in seconds (the voice is fixed):",
    JSON.stringify(opts.seconds),
    "The story:",
    JSON.stringify(opts.story, null, 1),
    "The storyboard (panel.beat is the line index; panel.at is seconds after that line starts):",
    JSON.stringify(opts.board, null, 1),
  ].join("\n\n");

  // the scene is written straight to its file (a Write tool, a few turns at most):
  // returning a whole page inside a JSON answer was slow enough to time out
  const write = async (prompt: string) => {
    const before = existsSync(scene) ? readFileSync(scene, "utf8") : "";
    // everything it needs is in the prompt; a turn spent opening files is wasted
    const notes = await agent({
      system: base,
      prompt: `${prompt}\n\nEverything you need is above; do not open other files. Write the complete page to ${scene} with ONE Write call (the whole file at once), then reply with one or two sentences: the shots, and the moment you are proudest of.`,
      tools: ["Read", "Write", "Edit"],
      bash: [],
      maxTurns: 12,
      timeoutMs: 40 * 60_000,
    }).catch((e: unknown) => {
      // ran out of turns after writing: keep the page, the code checks decide
      if (existsSync(scene) && readFileSync(scene, "utf8") !== before) return `(stopped early: ${e instanceof Error ? e.message.slice(0, 120) : e})`;
      throw e;
    });
    if (!existsSync(scene) || readFileSync(scene, "utf8") === before) throw new Error("The director did not write the scene.");
    log.push(notes.trim());
  };
  const current = () => readFileSync(scene, "utf8");
  const fixInCode = async () => {
    for (let round = 0; round < 3; round++) {
      const problems = await checkScene(scene, opts.lines, mouths);
      if (!problems.length) return true;
      log.push(`checks (${round + 1}): ${problems.join(" | ")}`);
      if (round === 2) return false;
      await write(`${context}\n\nYour scene:\n${current()}\n\nThe automatic checks found these problems. Fix every one and change nothing else that works:\n${problems.map((p) => `- ${p}`).join("\n")}`);
    }
    return false;
  };

  if (!existsSync(scene) || !opts.notes) {
    await write(`${context}\n\nWrite drafts/<id>/scene.html for this reel. It sits two folders below the repo root (scripts load ../../brand/...), next to lines.js.${opts.notes ? `\n\nThe final test failed the last version for these reasons; fix them:\n${opts.notes}` : ""}`);
  } else {
    await write(`${context}\n\nYour scene:\n${current()}\n\nThe final test found these problems. Fix every one and keep everything that works:\n${opts.notes}`);
  }
  if (!(await fixInCode())) throw new Error(`The scene still fails its checks: ${log[log.length - 1]}`);

  // one look per round at every panel, in a fresh call each time
  const B = await beatStarts(scene, mouths), ids = opts.lines.map(([id]) => id);
  const times = [...new Set(opts.board.panels.map((p) => +((B[ids[p.beat]] ?? 0) + p.at + 0.6).toFixed(2)))].sort((a, b) => a - b).slice(0, 21);
  for (let round = 0; round < 2; round++) {
    const sheet = contactSheet(dir, scene, times);
    const v = await askJson({
      system: [system, "You are the art director reviewing one reel's animatic before it is rendered. Be strict about what a viewer on a phone would notice: is the subject clear, does each still show what that line says, is anything clipped, overlapping, empty-looking or off-model, does Floey act, is the garden alive. Say exactly what to change. Minor polish is not a fix."].join("\n\n"),
      prompt: `The stills, left to right and top to bottom, are at these seconds: ${times.join(", ")}. Open ${sheet} and compare each still with its storyboard panel.\n\n${context}`,
      schema: Review,
      readFiles: true,
      effort: "high",
    });
    log.push(`look (${round + 1}): ${v.pass ? "pass" : v.fixes.join(" | ")}`);
    if (v.pass || !v.fixes.length) break;
    await write(`${context}\n\nYour scene:\n${current()}\n\nThe art director looked at the stills and wants these changes. Make every one and keep everything that works:\n${v.fixes.map((x) => `- ${x}`).join("\n")}`);
    if (!(await fixInCode())) throw new Error(`The scene fails its checks after the review fixes: ${log[log.length - 1]}`);
  }
  return { scene, log };
}
