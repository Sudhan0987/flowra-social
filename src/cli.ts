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
import { direct, finalTest, pickFormat, research, storyboard, writeStory, type Board, type Brief, type Story } from "./pipeline.ts";

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
  const format = (s as unknown as { format: string }).format;
  return [
    `*Flowra Social* · new reel draft: *${s.title}* (${Math.round(seconds)}s, story: ${format})`,
    "",
    "*Caption*",
    s.caption,
    "",
    s.hashtags.join(" "),
    "",
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
  if (!existsSync(f("storyboard.json"))) {
    console.log("3. Voice timing");
    audio(dir);
    console.log("4. Storyboard");
    const story = readJson<Story & Record<string, unknown>>(f("script.json"));
    const board = await storyboard(story, readJson(f("timeline.json")));
    writeJson(f("storyboard.json"), board);
    // the storyboard's sound effects join the script, and the cover frame is its pick
    const beats = story.beats.map((b, i) => ({ ...b, sfx: board.panels.filter((p) => p.beat === i).flatMap((p) => p.sfx.map((x) => ({ at: +(p.at + x.at).toFixed(2), kind: x.kind }))) }));
    writeJson(f("script.json"), { ...story, beats, posterAt: board.posterAt });
    audio(dir); // again, now with the effects mixed in
  }
  if (!existsSync(f("scene.html"))) {
    console.log("5-6. Director: animatic and animation");
    // a director that runs out of time while polishing has still written a
    // scene; the final test decides whether it is good enough
    await direct(id).catch((e: unknown) => {
      if (!existsSync(f("scene.html"))) throw e;
      console.log(`Director stopped early (${e instanceof Error ? e.message : e}); using the scene it wrote`);
    });
    if (!existsSync(f("scene.html"))) throw new Error(`The director did not write drafts/${id}/scene.html`);
  }
  console.log("7. Render");
  let r = await render(dir);
  console.log("8. Final test");
  let qa = await finalTest(id);
  if (!qa.pass) {
    console.log(`Final test failed, one more pass:\n${qa.problems.join("\n")}`);
    await direct(id, qa.problems.map((x) => `- ${x}`).join("\n")).catch((e: unknown) => console.log(`Fix pass stopped early (${e instanceof Error ? e.message : e})`));
    r = await render(dir);
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
