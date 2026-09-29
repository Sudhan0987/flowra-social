// The social agent's commands.
//
//   tsx src/cli.ts make [topic id]   script, voice, render and post the next reel
//   tsx src/cli.ts render <topic id> voice and render an existing script again
//   tsx src/cli.ts status            what has been made
//
// A draft lives in drafts/<id>/: script.json and timeline.json are kept in
// git; audio.wav, reel.mp4 and poster.jpg are build output (the workflow
// keeps the video as a run artifact and in Slack).

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { costSoFar } from "./claude.ts";
import { render } from "./render.ts";
import { writeScript, type Script, type Topic } from "./script.ts";
import { postDraft, say } from "./slack.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE = path.join(ROOT, "state/posts.json");

interface Post {
  id: string;
  status: "draft" | "approved" | "published" | "rejected" | "failed";
  topic: string;
  format: string;
  madeAt: string;
  seconds?: number;
  slack?: { channel: string; ts: string };
  reason?: string;
}
interface State { posts: Post[] }

const load = (): State => (existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { posts: [] });
const save = (s: State) => writeFileSync(STATE, JSON.stringify(s, null, 1) + "\n");
const topics = (): Topic[] => JSON.parse(readFileSync(path.join(ROOT, "calendar/topics.json"), "utf8")).topics;

function audio(dir: string): void {
  const py = process.env.PYTHON ?? "python3";
  execFileSync(py, [path.join(ROOT, "src/audio.py"), dir], { stdio: "inherit" });
}

function message(s: Script, seconds: number): string {
  return [
    `*Flowra Social* · new reel draft: *${s.title}* (${Math.round(seconds)}s, ${s.kicker.toLowerCase()})`,
    "",
    "*Caption*",
    s.caption,
    "",
    s.hashtags.join(" "),
    "",
    "React :white_check_mark: to approve it for Instagram, or :x: to drop it. Reply in the thread with changes and I'll redo it.",
  ].join("\n");
}

async function make(state: State, id?: string): Promise<void> {
  const done = new Set(state.posts.map((p) => p.id));
  const topic = id ? topics().find((t) => t.id === id) : topics().find((t) => !done.has(t.id));
  if (!topic) return void console.log(id ? `No topic "${id}" in calendar/topics.json.` : "Every topic in calendar/topics.json has a reel. Add topics.");
  const dir = path.join(ROOT, "drafts", topic.id);
  mkdirSync(dir, { recursive: true });
  console.log(`Writing ${topic.id}: ${topic.topic}`);
  const script = await writeScript(topic);
  writeFileSync(path.join(dir, "script.json"), JSON.stringify(script, null, 1) + "\n");
  audio(dir);
  const r = await render(dir);
  const slack = await postDraft(r.mp4, message(script, r.seconds));
  state.posts = state.posts.filter((p) => p.id !== topic.id);
  state.posts.push({ id: topic.id, status: "draft", topic: topic.topic, format: topic.format, madeAt: new Date().toISOString(), seconds: Math.round(r.seconds), slack });
  console.log(`Made ${topic.id}: ${r.mp4} (${r.seconds.toFixed(1)}s). Claude usage, API-equivalent: $${costSoFar().toFixed(2)}.`);
}

async function main(): Promise<void> {
  const [cmd, arg] = process.argv.slice(2);
  const state = load();
  try {
    if (cmd === "make") await make(state, arg);
    else if (cmd === "render" && arg) {
      const dir = path.join(ROOT, "drafts", arg);
      audio(dir);
      console.log((await render(dir)).mp4);
    } else if (cmd === "status") for (const p of state.posts) console.log(`${p.madeAt.slice(0, 10)}  ${p.status.padEnd(9)}  ${p.id}`);
    else throw new Error(`Unknown command "${cmd ?? ""}". Use make [id], render <id> or status.`);
  } finally {
    save(state);
  }
}

main().catch(async (e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(msg);
  await say(`:x: The reel run failed: ${msg.slice(0, 400)}`).catch(() => {});
  process.exit(1);
});
