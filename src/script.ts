// Writes one reel's script: what the voice says and what the screen shows,
// beat by beat, plus the Instagram caption. Claude writes it; the checks
// below decide whether it is usable, and one failed check gets one rewrite.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { askJson } from "./claude.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const FORMATS = {
  fix: { kicker: "The 45-second fix", shape: "hook, then 2 to 4 numbered steps (kind step, n = 1, 2, 3...), optionally one point beat for the why and at most one clip beat, then the outro" },
  myth: { kicker: "Myth vs fact", shape: "hook, then 2 or 3 pairs of a myth beat followed by its fact beat, then the outro" },
} as const;
export type Format = keyof typeof FORMATS;

const Beat = z.object({
  kind: z.enum(["hook", "point", "step", "myth", "fact", "clip", "outro"]),
  say: z.string().describe("What the voice says. Spoken English, no symbols."),
  show: z.string().describe("What the screen shows: at most 9 words, the key phrase, with the 1 to 3 words that matter most wrapped in *asterisks*."),
  n: z.number().int().optional().describe("Step number, only on step beats."),
  clip: z.string().optional().describe("Clip id, only on a clip beat."),
});
const Draft = z.object({
  title: z.string().describe("Internal name for this reel, under 60 characters."),
  beats: z.array(Beat),
  caption: z.string().describe("The Instagram caption."),
  hashtags: z.array(z.string()),
});
export type Script = z.infer<typeof Draft> & { id: string; format: Format; kicker: string; topic: string };

export interface Topic { id: string; format: Format; topic: string; angle: string; clip?: string }

const BANNED = ["delve", "leverage", "unlock", "seamless", "robust", "elevate", "game-changer", "game changer", "cutting-edge", "in today's digital landscape", "navigate the complexities", "hey guys", "in this video", "buckle up", "let's dive"];
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Every problem with a script, in words a rewrite can act on. Empty means usable. */
export function problems(s: Script, clipIds: string[]): string[] {
  const out: string[] = [];
  const all = [s.title, s.caption, ...s.hashtags, ...s.beats.flatMap((b) => [b.say, b.show])].join("\n");
  if (/[–—]/.test(all)) out.push("Contains an em dash or en dash. Use a comma, colon or full stop.");
  for (const w of BANNED) if (all.toLowerCase().includes(w)) out.push(`Uses the banned phrase "${w}".`);
  const b = s.beats;
  if (b[0]?.kind !== "hook") out.push("The first beat must be the hook.");
  if (b[b.length - 1]?.kind !== "outro") out.push("The last beat must be the outro.");
  if (b.filter((x) => x.kind === "hook").length !== 1 || b.filter((x) => x.kind === "outro").length !== 1) out.push("Exactly one hook and one outro.");
  if (b.length < 4 || b.length > 9) out.push(`Has ${b.length} beats; use 4 to 9.`);
  const spoken = b.reduce((n, x) => n + words(x.say), 0);
  if (spoken < 70 || spoken > 125) out.push(`The voice says ${spoken} words in total; aim for 80 to 115 (30 to 45 seconds).`);
  if (words(b[0]?.say ?? "") > 18) out.push("The hook's say is over 18 words; the problem must land in the first 2 seconds.");
  for (const [i, x] of b.entries()) {
    if (words(x.say) > 32) out.push(`Beat ${i + 1} says ${words(x.say)} words; keep each beat under 32.`);
    if (words(x.show.replace(/\*/g, "")) > 9) out.push(`Beat ${i + 1}'s show text is over 9 words.`);
    if ((x.show.match(/\*/g) ?? []).length % 2) out.push(`Beat ${i + 1}'s show text has an unpaired asterisk.`);
    if (/[/&<>#@]|https?:/.test(x.say.replace("useflowra.com", ""))) out.push(`Beat ${i + 1}'s say has a symbol or link the voice would read out badly.`);
    if (x.kind === "outro" && /useflowra/i.test(x.show)) out.push("The outro's show text repeats the web address; the screen already shows it.");
    if (x.kind === "clip" && !clipIds.includes(x.clip ?? "")) out.push(`Beat ${i + 1} uses clip "${x.clip}", which does not exist.`);
  }
  if (s.format === "fix") {
    const steps = b.filter((x) => x.kind === "step");
    if (steps.length < 2 || steps.length > 4) out.push("A fix has 2 to 4 step beats.");
    if (steps.some((x, i) => x.n !== i + 1)) out.push("Step beats are numbered 1, 2, 3 in order.");
    if (b.some((x) => x.kind === "myth" || x.kind === "fact")) out.push("A fix has no myth or fact beats.");
  } else {
    const mid = b.slice(1, -1);
    if (mid.length < 4 || mid.length % 2 || mid.some((x, i) => x.kind !== (i % 2 ? "fact" : "myth"))) out.push("Between hook and outro, a myth reel alternates myth, fact, myth, fact (2 or 3 pairs), nothing else.");
  }
  if (b.filter((x) => x.kind === "clip").length > 1) out.push("At most one clip beat.");
  if (s.caption.length < 200 || s.caption.length > 1200) out.push(`The caption is ${s.caption.length} characters; use 200 to 1200.`);
  if (s.hashtags.length < 3 || s.hashtags.length > 6 || s.hashtags.some((h) => !/^#[a-z0-9]+$/.test(h))) out.push("Use 3 to 6 hashtags, each like #seo: a # then lowercase letters or digits.");
  return out;
}

function system(): string {
  const facts = readFileSync(path.join(ROOT, "facts/flowra.md"), "utf8");
  const voice = readFileSync(path.join(ROOT, "facts/voice.md"), "utf8");
  return [
    "You write short vertical videos (Instagram Reels) for Flowra, an SEO tool. A free local AI voice reads your `say` lines; the screen shows your `show` lines in big type with burned-in captions of the voice.",
    "",
    "WHO WATCHES: people who run content or SEO for a site, or for clients at an agency. They know Search Console. They scroll fast and distrust SEO fluff. Earn the next second, every second.",
    "",
    "HOW IT SHOULD SOUND: one knowledgeable person talking to one peer. Short spoken sentences. Contractions. Specific: name the report, the menu, the number, the setting (\"Search Console, Performance, then filter by page\"). One idea per beat. The hook states a problem the viewer has had, concretely, in the first sentence, never a greeting or a promise of what the video will do.",
    "",
    "HARD RULES:",
    "- Never the em dash or en dash characters anywhere. Use a comma, colon or full stop.",
    "- Be exact about how Google's tools behave. Say only what is true of them without exceptions (\"Search Console won't alert you when a page's clicks slip\" is true; \"Search Console never warns you\" is not, it sends some emails). Name menus and columns as they appear.",
    "- No invented statistics, studies, percentages, customers or results. A number is allowed only as a clearly framed example (\"say a page slips from position 4 to 11\") or a documented fact about how a Google tool works.",
    "- Claims about Flowra only from the facts below. Mention Flowra at most once before the outro, and only where it really saves a step. The outro may name Flowra once.",
    "- `say` is spoken aloud: no symbols, slashes, ampersands, hashtags or links. Write the site as useflowra.com (the voice says it properly).",
    "- `show` is at most 9 words: the key phrase of that beat, not a transcript of `say`. Wrap the 1 to 3 words that matter most in *asterisks*.",
    "- The outro says one clear next step: follow for one fix a week, or try the free SEO tools at useflowra.com. Its show text is under 8 words, reads as a sentence (\"Follow for *one fix a week*\"), and never contains the web address: the screen already shows it under the logo.",
    "- Total spoken words 80 to 115 (30 to 45 seconds). The hook's say is at most 18 words.",
    "- Caption: 200 to 1200 characters. First line is a hook that works without the video. Then the steps or facts in plain text, one per line. End with a question people can answer in a comment, or \"Save this for your next content audit.\" No hashtags inside the caption.",
    "- Hashtags: 3 to 6, specific to the topic (#seo, #contentmarketing, #googlesearchconsole), lowercase.",
    "",
    "THE PRODUCT FACTS (the only source for claims about Flowra):",
    facts,
    "",
    "THE HOUSE STYLE (written for articles; the spoken rules above win where they differ):",
    voice,
  ].join("\n");
}

export async function writeScript(topic: Topic): Promise<Script> {
  const catalog = JSON.parse(readFileSync(path.join(ROOT, "assets/clips.json"), "utf8")) as { clips: { id: string; shows: string; topics: string[] }[] };
  const fmt = FORMATS[topic.format];
  const clipIds = catalog.clips.map((c) => c.id);
  const clipLines = catalog.clips.map((c) => `- ${c.id}: ${c.shows} (topics: ${c.topics.join(", ")})`).join("\n");
  const prompt = [
    `Write the reel for this topic: ${topic.topic}`,
    `Angle: ${topic.angle}`,
    `Format: ${topic.format} ("${fmt.kicker}"). Shape: ${fmt.shape}.`,
    topic.clip ? `Use this product clip in one clip beat, where it shows the step it matches: ${topic.clip}.` : "Only add a clip beat if one of these real product clips shows exactly what a beat is about; otherwise none.",
    "Product clips (real screens from Flowra's demo site):",
    clipLines,
    "A clip beat's say describes what the viewer sees on that screen, and its show text names it.",
  ].join("\n");

  let draft = await askJson({ system: system(), prompt, schema: Draft, effort: "high" });
  let script: Script = { ...draft, id: topic.id, format: topic.format, kicker: fmt.kicker, topic: topic.topic };
  let issues = problems(script, clipIds);
  if (issues.length) {
    draft = await askJson({ system: system(), prompt: `${prompt}\n\nYour previous version:\n${JSON.stringify(draft, null, 1)}\n\nIt failed these checks. Fix every one and keep what was good:\n${issues.map((x) => `- ${x}`).join("\n")}`, schema: Draft, effort: "high" });
    script = { ...draft, id: topic.id, format: topic.format, kicker: fmt.kicker, topic: topic.topic };
    issues = problems(script, clipIds);
    if (issues.length) throw new Error(`The script for ${topic.id} still fails its checks: ${issues.join(" ")}`);
  }
  return script;
}
