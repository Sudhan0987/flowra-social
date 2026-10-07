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
import { writeScript, type Script, type Topic } from "./script.ts";
import { postDraft, say } from "./slack.ts";
import { HOUSE, finalTest, pickFormat, research, storyboard, writeStory, type Board, type Brief, type Story } from "./pipeline.ts";
import { directFloey } from "./studio.ts";
import type { Line } from "./scenecheck.ts";

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


/** brand/mascot/render-scene.mts: voices the lines, draws the frames, mixes the sound. */
function scene(page: string, name: string, extra: string[] = []): void {
  const dir = path.dirname(page);
  execFileSync("npx", ["tsx", path.join(ROOT, "brand/mascot/render-scene.mts"), page, name, `--out=${path.join(dir, "build")}`, ...extra], { stdio: "inherit", cwd: ROOT });
}

function renderReel(dir: string, posterAt: number): { mp4: string; seconds: number } {
  scene(path.join(dir, "scene.html"), "reel");
  const mp4 = path.join(dir, "reel.mp4");
  execFileSync("cp", [path.join(dir, "build", "reel.mp4"), mp4]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(posterAt ?? 1), "-i", mp4, "-frames:v", "1", "-q:v", "3", path.join(dir, "poster.jpg")]);
  const seconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString().trim());
  return { mp4, seconds };
}

function message(s: Script, seconds: number): string {
  const format = (s as unknown as { format: string }).format;
  return [
    `*Flowra Social* · new reel draft: *${s.title}* (${Math.round(seconds)}s, story: ${format})`,
    "",
    "*Caption*",
    s.caption,
    "",
    s.hashtags.join(" "),
    "",
    ...((s as unknown as { editorNotes?: string[] }).editorNotes?.length ? ["*The script editor still had these notes* (decide whether they matter):", ...(s as unknown as { editorNotes: string[] }).editorNotes.slice(0, 4).map((n) => `• ${n.slice(0, 300)}`), ""] : []),
    "React :white_check_mark: to approve it for Instagram, or :x: to drop it. Reply in the thread with changes and I'll redo it.",
  ].join("\n");
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const readJson = <T>(f: string): T => JSON.parse(readFileSync(f, "utf8")) as T;
const writeJson = (f: string, v: unknown) => writeFileSync(f, JSON.stringify(v, null, 1) + "\n");

/**
 * One reel through the whole studio process (docs/production-process.md).
 * Each stage's file is kept, so `make <id>` resumes a draft at the first
 * stage whose file is missing. A seed topic id from calendar/topics.json
 * steers the research instead of letting it pick.
 */
async function make(state: State, arg?: string): Promise<void> {
  const seed = arg ? topics().find((t) => t.id === arg) : undefined;
  const resume = arg && !seed && existsSync(path.join(ROOT, "drafts", arg)) ? arg : undefined;
  const recent = state.posts.map((p) => p.topic);
  const lastFormats = state.posts.map((p) => p.format);

  let id = resume ?? "";
  let brief: Brief;
  if (resume) brief = readJson(path.join(ROOT, "drafts", id, "brief.json"));
  else {
    console.log("1. Research");
    brief = await research(recent, seed ? { topic: seed.topic, angle: seed.angle } : undefined);
    id = `r${String(state.posts.length + 1).padStart(3, "0")}-${slug(brief.topic)}`;
    mkdirSync(path.join(ROOT, "drafts", id), { recursive: true });
    writeJson(path.join(ROOT, "drafts", id, "brief.json"), brief);
  }
  const dir = path.join(ROOT, "drafts", id);
  const f = (name: string) => path.join(dir, name);
  console.log(`Reel ${id}: ${brief.topic} (${brief.goal})`);

  if (!existsSync(f("script.json"))) {
    const format = pickFormat(brief, lastFormats);
    console.log(`2. Story, as "${format.name}"`);
    const story = await writeStory(id, brief, format);
    writeJson(f("script.json"), { ...story, template: `../drafts/${id}/scene.html` });
  }
  // Floey's lines, exactly as she will say them (the scene reads lines.js and never changes it)
  const story0 = readJson<Story>(f("script.json"));
  const lines: Line[] = story0.beats.map((x, i) => (x.caption ? [`${x.role}${i}`, x.say, x.emotion, x.caption] : [`${x.role}${i}`, x.say, x.emotion]) as Line);
  writeFileSync(f("lines.js"), `window.LINES = ${JSON.stringify(lines)};\n`);
  if (!existsSync(f("build/voice.json"))) {
    console.log("3. Floey's voice");
    writeFileSync(f("voice.html"), '<!doctype html><script src="lines.js"></script>');
    scene(f("voice.html"), "voice", ["--voice-only"]);
  }
  const voice = readJson<Record<string, number>>(f("build/voice.json"));
  const seconds = lines.map(([id]) => voice[id]);
  if (!existsSync(f("storyboard.json"))) {
    console.log("4. Storyboard");
    writeJson(f("storyboard.json"), await storyboard(story0, seconds));
  }
  const board = readJson<Board>(f("storyboard.json"));
  const priorLog = existsSync(f("director.json")) ? readJson<string[]>(f("director.json")) : [];
  if (!existsSync(f("scene.html"))) {
    console.log("5-6. Director: scene, code checks, contact-sheet review");
    const d = await directFloey(dir, HOUSE, { lines, story: story0, board, seconds: voice });
    priorLog.push(...d.log);
    writeJson(f("director.json"), priorLog);
  }
  // resuming a draft that failed its final test: fix what the test found before rendering again
  if (resume && existsSync(f("qa.json"))) {
    const prev = readJson<{ pass: boolean; problems: string[] }>(f("qa.json"));
    if (!prev.pass && prev.problems.length) {
      console.log("5-6. Director: correcting what the last final test found");
      const d = await directFloey(dir, HOUSE, { lines, story: story0, board, seconds: voice, notes: prev.problems.map((x) => `- ${x}`).join("\n") });
      priorLog.push(...d.log);
      writeJson(f("director.json"), priorLog);
    }
  }
  console.log("7. Render");
  let r = renderReel(dir, board.posterAt);
  console.log("8. Final test");
  let qa = await finalTest(id);
  if (!qa.pass) {
    console.log(`Final test failed, one more pass:\n${qa.problems.join("\n")}`);
    const d = await directFloey(dir, HOUSE, { lines, story: story0, board, seconds: voice, notes: qa.problems.map((x) => `- ${x}`).join("\n") });
    priorLog.push(...d.log);
    writeJson(f("director.json"), priorLog);
    r = renderReel(dir, board.posterAt);
    qa = await finalTest(id);
  }
  writeJson(f("qa.json"), qa);
  const story = readJson<Story & { format: string }>(f("script.json"));
  state.posts = state.posts.filter((p) => p.id !== id);
  if (!qa.pass) {
    state.posts.push({ id, status: "failed", topic: brief.topic, format: story.format, madeAt: new Date().toISOString(), seconds: Math.round(r.seconds), reason: qa.problems.join(" ").slice(0, 500) });
    await say(`:warning: The reel "${story.title}" didn't pass its final test twice, so it isn't posted:\n${qa.problems.map((x) => `• ${x}`).join("\n").slice(0, 1500)}`);
    return;
  }
  const slack = await postDraft(r.mp4, message(story as unknown as Script, r.seconds));
  state.posts.push({ id, status: "draft", topic: brief.topic, format: story.format, madeAt: new Date().toISOString(), seconds: Math.round(r.seconds), slack });
  console.log(`Made ${id}: ${r.mp4} (${r.seconds.toFixed(1)}s). Claude usage, API-equivalent: $${costSoFar().toFixed(2)}.`);
}

async function main(): Promise<void> {
  const [cmd, arg] = process.argv.slice(2);
  const state = load();
  try {
    if (cmd === "make") await make(state, arg);
    else if (cmd === "render" && arg) {
      const dir = path.join(ROOT, "drafts", arg);
      console.log(renderReel(dir, readJson<Board>(path.join(dir, "storyboard.json")).posterAt).mp4);
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
