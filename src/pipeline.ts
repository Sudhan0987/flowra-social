// The reel production stages (docs/production-process.md): research, story,
// storyboard, director (animatic and animation), final test. Each stage
// writes its file into drafts/<id>/ so a failed stage retries alone.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { agent, askJson } from "./claude.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f: string) => readFileSync(path.join(ROOT, f), "utf8");
const json = <T>(f: string): T => JSON.parse(readFileSync(f, "utf8")) as T;
const save = (f: string, v: unknown) => writeFileSync(f, JSON.stringify(v, null, 1) + "\n");

interface Format { id: string; name: string; goal: "send" | "save"; beats: string[]; when: string; visual: string }
export const FORMATS = (): Format[] => json<{ formats: Format[] }>(path.join(ROOT, "story/formats.json")).formats;

const HOUSE = [
  "Flowra is an SEO tool for content teams and agencies: it connects Google Search Console, GA4 and WordPress, finds pages losing traffic or close to page one, helps fix and publish them, and measures whether the change worked.",
  "Never the em dash or en dash. No invented statistics, customers or results: a number is either sourced, from Flowra's own verified findings, or clearly framed as an example.",
  "Product claims only from the facts file. Never a customer's data. Never mock or name a competitor unkindly; never name a company in a negative story unless the facts file says it may be named.",
].join("\n");

// ---------- 1. research ----------
const Brief = z.object({
  topic: z.string(),
  angle: z.string().describe("The specific take: what the reel will show and why it is interesting, in 2 or 3 sentences."),
  whyNow: z.string().describe("Why this week: the news, trend or question it answers. Empty if evergreen."),
  goal: z.enum(["send", "save"]).describe("send: funny, surprising or relatable enough to DM to a friend. save: useful enough to keep."),
  audience: z.string().describe("Who exactly it is for."),
  facts: z.array(z.object({ fact: z.string(), source: z.string().describe("URL, or 'Flowra facts file', or 'Flowra finding'") })).describe("Every fact the reel may state, each with its source."),
  visualIdea: z.string().describe("The one central image or metaphor that could carry the whole reel."),
  pillar: z.enum(["problem", "news", "myth", "story", "fun", "product"]),
});
export type Brief = z.infer<typeof Brief>;

export async function research(recent: string[], seed?: { topic: string; angle: string }): Promise<Brief> {
  return askJson({
    system: [
      "You are the content researcher for Flowra's Instagram. Your job is to pick the one reel topic most likely to be watched to the end and sent or saved by people who run content or SEO for a site or for agency clients.",
      HOUSE,
      "Pillars, in rough proportion: problems buyers have and their fixes (30%), SEO and AI-search news explained (20%), myths (15%), true stories and findings (15%), fun and relatable (15%), product (5%, only when it genuinely helps).",
      "Research like a strategist: search this week's SEO and AI search news (Google updates, AI Overviews, ChatGPT search, crawler changes), questions people ask on Reddit (r/SEO, r/bigseo, r/content_marketing) and forums, and what similar accounts post. Prefer a topic where the reel can show something, not just say it.",
      "Every fact must have a source. If you cannot source it, leave it out.",
      "The facts file:",
      read("facts/flowra.md"),
    ].join("\n\n"),
    prompt: seed
      ? `Research this topic for a reel and fill the brief: ${seed.topic}\nAngle to start from: ${seed.angle}`
      : `Pick this week's best reel topic and fill the brief.\nRecent reels (do not repeat these topics or angles):\n${recent.map((r) => `- ${r}`).join("\n") || "- none yet"}`,
    schema: Brief,
    web: seed ? 4 : 8,
    effort: "high",
  });
}

// ---------- 2. story ----------
const Beat = z.object({
  role: z.enum(["hook", "body", "payoff", "loop"]),
  say: z.string().describe("What the voice says. Spoken English, no symbols or links (write useflowra.com as is)."),
  caption: z.string().optional().describe("Only when the on-screen caption should differ from the spoken words, e.g. '429' for 'four twenty nine'."),
  visual: z.string().describe("What the picture shows while this is said: a concrete scene with characters, objects and action. Never 'text on screen'."),
});
const Story = z.object({
  title: z.string(),
  beats: z.array(Beat),
  loopNote: z.string().describe("How the last beat leads back into the first frame, so a replay feels continuous."),
  caption: z.string(),
  hashtags: z.array(z.string()),
});
export type Story = z.infer<typeof Story> & { id: string; format: string; goal: string; topic: string };

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
export function storyProblems(s: Story): string[] {
  const out: string[] = [];
  const all = JSON.stringify(s);
  if (/[–—]/.test(all)) out.push("Contains an em dash or en dash.");
  const n = s.beats.reduce((a, b) => a + words(b.say), 0);
  if (n < 60 || n > 100) out.push(`The voice says ${n} words; aim for 65 to 95 (25 to 35 seconds).`);
  if (s.beats[0]?.role !== "hook") out.push("The first beat must be the hook.");
  if (words(s.beats[0]?.say ?? "") > 14) out.push("The hook is over 14 words: it must land in 2 seconds.");
  const hook = s.beats[0]?.say ?? "";
  if (/^\s*(is|are|do|does|did|have|has|can|could|will|would|should)\b[^?]*\?\s*$/i.test(hook)) out.push("The hook is a yes or no question; make it a specific statement aimed at the viewer.");
  if (/\b(a|one|every|many|most|some) (site|website|business|store|blog) owners?\b|\b(a|one) (marketer|seo|blogger)\b/i.test(s.beats.map((b) => b.say).join(" "))) out.push("The voice talks about a generic stranger ('a site owner'); talk to the viewer with you and your.");
  if (!/\byou(r|'re|'ll|'ve)?\b/i.test(s.beats.slice(0, 2).map((b) => b.say).join(" "))) out.push("The first two beats never say you or your; speak to the viewer directly.");
  if (!s.beats.some((b) => b.role === "payoff")) out.push("There is no payoff beat.");
  if (s.beats[s.beats.length - 1]?.role !== "loop") out.push("The last beat must be the loop.");
  if (s.beats.length < 4 || s.beats.length > 8) out.push(`Use 4 to 8 beats, not ${s.beats.length}.`);
  if (s.beats.some((b) => /text on screen|title card|words appear/i.test(b.visual))) out.push("A visual is a text card; every beat needs a picture that explains it.");
  if (s.hashtags.length < 3 || s.hashtags.length > 6 || s.hashtags.some((h) => !/^#[a-z0-9]+$/.test(h))) out.push("3 to 6 lowercase hashtags like #seo.");
  if (s.caption.length < 150 || s.caption.length > 1200) out.push("Caption 150 to 1200 characters.");
  return out;
}

/** The structure for this reel: fits the brief's goal, not one of the last three used. */
export function pickFormat(brief: Brief, lastFormats: string[]): Format {
  const all = FORMATS().filter((f) => !lastFormats.slice(-3).includes(f.id));
  const fit = all.filter((f) => f.goal === brief.goal);
  const pool = fit.length ? fit : all;
  // deterministic but varied: rotate by how many reels exist
  return pool[lastFormats.length % pool.length];
}

export async function writeStory(id: string, brief: Brief, format: Format): Promise<Story> {
  const system = [
    "You write 25 to 35 second animated reels for Flowra's Instagram. A voice reads your lines; the picture is an illustrated animation (characters, objects, a moving camera). Captions of the voice are burned in, so the picture must never repeat the words as text: it shows the idea.",
    HOUSE,
    `Story structure for this reel: ${format.name}. Beats: ${format.beats.join(" | ")}. Visual approach: ${format.visual}`,
    "Rules: the hook lands in the first 2 seconds and is at most 14 words, a specific tension, never a greeting. A small payoff every 6 to 8 seconds. The last beat (role loop) is the call to action folded into a line that leads naturally back to the first frame, so a replay feels like it continues. Total 65 to 95 spoken words. Mention Flowra only in the loop, if at all, and never as hype.",
    "Talk to the viewer, not about a stranger: say you and your (your traffic, your page, your client's site), never 'a site owner', 'a marketer', 'one SEO' or 'many people'. The hook is a specific statement aimed at the viewer, never a yes or no question ('Is your traffic dropping?' gets a silent no and a scroll; 'Your traffic didn't drop because of the update.' opens a gap they need closed). A character on screen can act the story out while the voice still speaks to the viewer.",
    "Each beat's visual is a concrete scene a designer could draw: who is on screen, what they do, what changes. Use characters and metaphors: robots for crawlers, a bouncer for a block, a sinking page for decay, a race for rankings.",
  ].join("\n\n");
  const prompt = `The brief:\n${JSON.stringify(brief, null, 1)}\n\nWrite the reel. Use only the brief's facts.`;
  let draft = await askJson({ system, prompt, schema: Story, effort: "high" });
  let story: Story = { ...draft, id, format: format.id, goal: brief.goal, topic: brief.topic };
  let issues = storyProblems(story);
  if (issues.length) {
    draft = await askJson({ system, prompt: `${prompt}\n\nYour draft:\n${JSON.stringify(draft, null, 1)}\n\nFix every one of these and keep what works:\n${issues.map((x) => `- ${x}`).join("\n")}`, schema: Story, effort: "high" });
    story = { ...draft, id, format: format.id, goal: brief.goal, topic: brief.topic };
    issues = storyProblems(story);
    if (issues.length) throw new Error(`The story for ${id} still fails: ${issues.join(" ")}`);
  }
  return story;
}

// ---------- 4. storyboard ----------
const Panel = z.object({
  beat: z.number().int().describe("Index of the beat this panel covers (0 based)."),
  at: z.number().describe("Seconds after the beat starts when this panel begins."),
  shot: z.enum(["extreme-wide", "wide", "medium", "close", "extreme-close", "insert"]),
  camera: z.enum(["static", "push-in", "pull-out", "pan", "whip", "shake", "drift", "dutch"]),
  subject: z.string().describe("Who and what is in frame."),
  action: z.string().describe("What happens, as motion: enters, falls, flips, slams, grows."),
  onScreenData: z.string().describe("At most one short piece of data shown as text (a number, a code, a URL). Empty if none."),
  sfx: z.array(z.object({ at: z.number(), kind: z.enum(["pop", "bonk", "boing", "whoosh", "slam", "ding", "buzz", "type", "step"]) })).describe("Sound effects, seconds after the beat starts."),
});
const Board = z.object({ style: z.string().describe("One line fixing the look for the whole reel: palette use, setting, recurring characters."), panels: z.array(Panel), posterAt: z.number().describe("Seconds into the reel for the cover frame: the most intriguing complete image in the first 5 seconds.") });
export type Board = z.infer<typeof Board>;

export async function storyboard(story: Story, timeline: { beats: { start: number; spokenEnd: number; end: number }[] }): Promise<Board> {
  const kit = read("reel/kit/kit.js").split("\n").filter((l) => l.startsWith("//") || /K\.\w+ = function/.test(l)).join("\n");
  return askJson({
    system: [
      "You are the storyboard artist for an animated explainer reel (1080x1920, 30 fps). Plan every panel so the picture explains the story on its own; the voice and captions carry the words.",
      "Cinematography: open on the most intriguing image (it is also the cover). Vary shot sizes; push in on a reveal, pull out to show scale, whip-pan between places or times, a short shake on impact. Keep the subject inside x 80 to 960 and y 250 to 1300 (Instagram covers the rest). One idea per panel, 1.5 to 4 seconds each. Motion with anticipation and follow-through.",
      "You draw with this kit (characters and props available to the animator):",
      kit,
      "Sound: an effect only on a real event (impact, reveal, typing). Never more than one every 0.4 seconds.",
    ].join("\n\n"),
    prompt: `The story:\n${JSON.stringify(story.beats.map((b, i) => ({ beat: i, role: b.role, say: b.say, visual: b.visual, seconds: +(timeline.beats[i].end - timeline.beats[i].start).toFixed(2) })), null, 1)}\n\nStoryboard it.`,
    schema: Board,
    effort: "high",
  });
}

// ---------- 5 and 6. director: animatic, then animation ----------
export async function direct(id: string, notes = ""): Promise<string> {
  const dir = `drafts/${id}`;
  return agent({
    system: [
      "You are the director and animator of one Flowra reel. You build the scene page, look at your own frames, and fix what a good motion designer would fix. Your skills include hyperframes-animation, motion-graphics, animate, review-animations and impeccable: load the animation ones before you start.",
      HOUSE,
    ].join("\n"),
    prompt: [
      `Build ${dir}/scene.html: the animation for the reel in ${dir}. Read first: ${dir}/script.json (the story), ${dir}/storyboard.json (the panels), ${dir}/timeline.json (when each beat starts and ends; the voice is fixed), reel/kit/kit.js (the characters, props, camera director and captions you draw with), and reel/scenes/gptbot.html (a finished reel at the quality bar: study how it builds a world, moves the camera and times action to the voice).`,
      "The page must: load ../../reel/kit/kit.js; set up fonts from ../../reel/assets/ (see gptbot.html); build everything once; define window.render = async (t) => {...} as a pure function of t (no Date, no random without a seed, no requestAnimationFrame timing); call KIT.reelUI() for captions; set window.ready to a promise that resolves after fonts load and the first render.",
      "Follow the storyboard panel by panel, timing each to the timeline. The picture explains; on-screen text only for the one piece of data a panel names. Use the director (KIT.camera) for every camera move.",
      `Animatic: once it runs, draw stills with \`npx tsx src/render.ts ${dir} --stills <times>\` (comma separated seconds, one or two per panel) and open them with Read from ${dir}/stills/. For each still ask: is the subject clear and inside the safe area, does it show what this line says, is anything clipped, overlapping or empty-looking? Fix and draw again. Then check motion by drawing 4 stills across one busy panel.`,
      "Stop when every panel reads clearly at phone size. Do not render the full video; the pipeline does that.",
      notes ? `Fix these problems from the final test, then check them in stills:\n${notes}` : "",
    ].join("\n\n"),
    bash: ["npx tsx src/render.ts:*"],
    maxTurns: 120,
  });
}

// ---------- 8. final test ----------
const Verdict = z.object({ pass: z.boolean(), problems: z.array(z.string()) });
export async function finalTest(id: string): Promise<{ pass: boolean; problems: string[] }> {
  const dir = path.join(ROOT, "drafts", id);
  const problems: string[] = [];
  const story = json<Story>(path.join(dir, "script.json"));
  const tl = json<{ duration: number }>(path.join(dir, "timeline.json"));
  if (tl.duration < 15 || tl.duration > 45) problems.push(`Length ${tl.duration.toFixed(1)}s is outside 15 to 45 seconds.`);
  const lufs = execFileSync("ffmpeg", ["-hide_banner", "-nostats", "-i", path.join(dir, "reel.mp4"), "-af", "ebur128", "-f", "null", "-"], { stdio: ["ignore", "pipe", "pipe"] }).toString();
  void lufs; // ffmpeg writes the summary to stderr; loudness is normalised at render time
  // 12 frames across the reel for the reviewer
  const frames = path.join(dir, "qa");
  execFileSync("mkdir", ["-p", frames]);
  const times = Array.from({ length: 12 }, (_, i) => (tl.duration * (i + 0.5)) / 12);
  times.forEach((t, i) => execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", t.toFixed(2), "-i", path.join(dir, "reel.mp4"), "-frames:v", "1", "-vf", "scale=540:-1", path.join(frames, `${String(i).padStart(2, "0")}.jpg`)]));
  const list = readdirSync(frames).filter((f) => f.endsWith(".jpg")).sort().map((f) => path.join(frames, f));
  const v = await askJson({
    system: "You are the final reviewer of a short animated reel before it goes to the founder. Be strict: reject anything a viewer would notice. Check: does the first frame make you want to watch; is every frame readable on a phone; is anything clipped, overlapping, off-screen or empty; does the picture match what the voice says at that moment; is any claim untrue or unsourced; does the ending lead back to the start. Minor polish is not a reason to fail; real problems are.",
    prompt: `The script:\n${JSON.stringify(story.beats, null, 1)}\n\nOpen these frames in order (each is 1/12 of the reel):\n${list.join("\n")}\n\nPass or fail it, and list every real problem with the frame number.`,
    schema: Verdict,
    readFiles: true,
    effort: "high",
  });
  return { pass: problems.length === 0 && v.pass, problems: [...problems, ...v.problems] };
}

export { save, json, existsSync };
