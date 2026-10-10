// What our own reels did, and what that teaches the next one.
//
// 1. For every published reel in state/posts.json, read its numbers:
//    Instagram (views, reach, saves, shares, average watch time...), the
//    Facebook Page (plays, average watch time) and YouTube (views, likes).
//    Read-only calls; a metric a platform refuses is left out, never guessed.
// 2. Join each reel's numbers with how it was made (hook, hook pattern,
//    story structure, pillar, goal, length) from drafts/<id>/, and keep a
//    dated snapshot so growth over time is visible: state/results.json.
// 3. Claude compares the reels and writes what worked, what did not and what
//    to try next (research/learnings.json). The researcher, the story writer,
//    the weekly listening and the hook library all read it, so each reel is
//    planned with the last ones' results in hand.
// 4. A short note goes to Slack #social.
//
// Run: npx tsx src/results.ts   (META_ACCESS_TOKEN; YT_* for YouTube; SLACK_BOT_TOKEN for the note)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { askJson } from "./claude.ts";
import { say } from "./slack.ts";
import { youtubeReady, ytGet } from "./youtube.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const G = "https://graph.facebook.com/v23.0";
const PAGE = "1322809910922605";
const readJson = <T>(f: string, fallback: T): T => (existsSync(path.join(ROOT, f)) ? (JSON.parse(readFileSync(path.join(ROOT, f), "utf8")) as T) : fallback);

interface Post { id: string; status: string; topic: string; format?: string; seconds?: number; idea?: string; published?: { at: string; instagram?: string; facebook?: string | boolean; youtube?: string } }
type Numbers = Record<string, number>;
export interface Snapshot { date: string; ageDays: number; instagram: Numbers; facebook: Numbers; youtube: Numbers }
export interface ReelResult {
  id: string; title: string; topic: string; postedAt: string; seconds: number;
  hook: string; hookPattern: string; format: string; pillar: string; goal: string; idea: string;
  latest: Snapshot; history: Snapshot[];
}

async function graph<T>(url: string): Promise<T | undefined> {
  const r = await fetch(url);
  const j = (await r.json()) as T & { error?: unknown };
  return j.error ? undefined : j;
}

/**
 * Asks for each metric on its own: Meta fails the whole request when one
 * metric name is not valid for that media type, and the valid names shift
 * between API versions.
 */
async function metrics(base: string, names: string[], token: string): Promise<Numbers> {
  const out: Numbers = {};
  for (const m of names) {
    const j = await graph<{ data: Array<{ name: string; values?: Array<{ value: unknown }>; total_value?: { value: unknown } }> }>(`${base}?metric=${m}&access_token=${token}`);
    const v = j?.data?.[0]?.values?.[0]?.value ?? j?.data?.[0]?.total_value?.value;
    if (typeof v === "number") out[m] = v;
    else if (v && typeof v === "object") for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (typeof n === "number") out[`${m}.${k}`] = n;
  }
  return out;
}

// follows and profile_visits are asked for but Instagram does not report them for Reels (10 Oct 2026)
const IG_METRICS = ["views", "reach", "saved", "shares", "likes", "comments", "total_interactions", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time", "follows", "profile_visits"];
/**
 * Every lifetime metric Facebook has for the video, in one call: asking for
 * named metrics returned nothing on 10 Oct 2026 (the names differ for reels).
 * Meta's error message is printed once (it never contains the token).
 */
let fbLogged = false;
async function fbInsights(video: string, token: string): Promise<Numbers> {
  const r = await fetch(`${G}/${video}/video_insights?access_token=${token}`);
  const j = (await r.json()) as { data?: Array<{ name: string; period?: string; values?: Array<{ value: unknown }> }>; error?: { message?: string } };
  if (j.error || !j.data) {
    if (!fbLogged) { fbLogged = true; console.log(`Facebook insights refused for ${video}: ${j.error?.message ?? r.status}`); }
    return {};
  }
  const out: Numbers = {};
  for (const d of j.data) {
    if (d.period && d.period !== "lifetime") continue;
    const v = d.values?.[0]?.value;
    if (typeof v === "number") out[d.name] = v;
    else if (v && typeof v === "object") for (const [k, n] of Object.entries(v as Record<string, unknown>)) if (typeof n === "number") out[`${d.name}.${k}`] = n;
  }
  return out;
}

/** How the reel was made, from its draft folder. Missing files leave blanks. */
function made(id: string): { title: string; hook: string; hookPattern: string; format: string; pillar: string; goal: string } {
  const dir = `drafts/${id}`;
  const s = readJson<{ title?: string; beats?: Array<{ say: string }>; hookPattern?: string; format?: string; goal?: string }>(`${dir}/script.json`, {});
  const b = readJson<{ pillar?: string; goal?: string }>(`${dir}/brief.json`, {});
  return { title: s.title ?? "", hook: s.beats?.[0]?.say ?? "", hookPattern: s.hookPattern ?? "", format: s.format ?? "", pillar: b.pillar ?? "", goal: s.goal ?? b.goal ?? "" };
}

/** Watch time as a share of the reel's length: the clearest sign of whether the hook and story held people. */
export function watchShare(r: Pick<ReelResult, "seconds" | "latest">): number | undefined {
  const ms = r.latest.instagram.ig_reels_avg_watch_time;
  if (!ms || !r.seconds) return undefined;
  return Math.round((ms / 1000 / r.seconds) * 100) / 100;
}

/** Adds today's snapshot, replacing one already taken today. */
export function addSnapshot(history: Snapshot[], snap: Snapshot): Snapshot[] {
  return [...history.filter((h) => h.date !== snap.date), snap].sort((a, b) => a.date.localeCompare(b.date));
}

async function collect(): Promise<ReelResult[]> {
  const token = process.env.META_ACCESS_TOKEN ?? "";
  if (!token) throw new Error("META_ACCESS_TOKEN is not set.");
  const pages = await graph<{ data: Array<{ id: string; access_token: string }> }>(`${G}/me/accounts?fields=id,access_token&access_token=${token}`);
  const pageToken = pages?.data.find((p) => p.id === PAGE)?.access_token ?? "";
  const posts = (readJson<{ posts: Post[] }>("state/posts.json", { posts: [] }).posts).filter((p) => p.status === "published" && p.published);
  const ytIds = posts.map((p) => p.published!.youtube).filter((x): x is string => Boolean(x));
  const yt = new Map<string, Numbers>();
  if (ytIds.length && youtubeReady()) {
    const v = await ytGet<{ items: Array<{ id: string; statistics: Record<string, string> }> }>("videos", { part: "statistics", id: ytIds.join(",") });
    for (const i of v.items) yt.set(i.id, Object.fromEntries(Object.entries(i.statistics).map(([k, n]) => [k, Number(n)])));
  }
  const old = new Map(readJson<{ reels: ReelResult[] }>("state/results.json", { reels: [] }).reels.map((r) => [r.id, r]));
  const today = new Date().toISOString().slice(0, 10);
  const out: ReelResult[] = [];
  for (const p of posts) {
    const pub = p.published!;
    const ig = pub.instagram ? await metrics(`${G}/${pub.instagram}/insights`, IG_METRICS, token) : {};
    const igMeta = pub.instagram ? await graph<{ timestamp?: string }>(`${G}/${pub.instagram}?fields=timestamp&access_token=${token}`) : undefined;
    const fb = typeof pub.facebook === "string" && pageToken ? await fbInsights(pub.facebook, pageToken) : {};
    const postedAt = igMeta?.timestamp ?? `${pub.at}T00:00:00Z`;
    const ageDays = Math.max(0, Math.round(((Date.now() - Date.parse(postedAt)) / 86400000) * 10) / 10);
    const snap: Snapshot = { date: today, ageDays, instagram: ig, facebook: fb, youtube: pub.youtube ? yt.get(pub.youtube) ?? {} : {} };
    const m = made(p.id);
    out.push({ id: p.id, ...m, title: m.title || p.topic, topic: p.topic, postedAt, seconds: p.seconds ?? 0, format: m.format || p.format || "", idea: p.idea ?? "", latest: snap, history: addSnapshot(old.get(p.id)?.history ?? [], snap) });
    console.log(`${p.id}: IG ${ig.views ?? "?"} views, ${ig.saved ?? "?"} saves | FB ${fb.blue_reels_play_count ?? "?"} plays | YT ${snap.youtube.viewCount ?? "-"} views`);
  }
  return out;
}

const Learnings = z.object({
  summary: z.string().describe("What our reels have taught us so far, in two or three plain sentences a non-technical founder understands. Say how sure we can be."),
  signals: z.array(z.object({
    finding: z.string().describe("One pattern in our results, e.g. 'Reels that open on a number were watched longer'."),
    evidence: z.string().describe("The reels and numbers behind it."),
    confidence: z.enum(["low", "medium", "high"]).describe("low with fewer than about 8 reels or one example; high only with a clear, repeated difference."),
  })),
  doMore: z.array(z.string()),
  doLess: z.array(z.string()),
  tryNext: z.array(z.object({ experiment: z.string().describe("One concrete change for the next reels."), why: z.string(), measure: z.string().describe("Which number will show whether it worked.") })).describe("1 to 3 experiments, most useful first."),
});
export type Learnings = z.infer<typeof Learnings> & { date: string; reels: number };

async function learn(reels: ReelResult[]): Promise<Learnings> {
  const previous = readJson<Partial<Learnings>>("research/learnings.json", {});
  const table = reels.map((r) => ({
    id: r.id, title: r.title, hook: r.hook, hookPattern: r.hookPattern || "not recorded", format: r.format, pillar: r.pillar, goal: r.goal, seconds: r.seconds, ageDays: r.latest.ageDays,
    watchShare: watchShare(r), instagram: r.latest.instagram, facebook: r.latest.facebook, youtube: r.latest.youtube,
    growth: r.history.map((h) => ({ date: h.date, ageDays: h.ageDays, igViews: h.instagram.views, fbPlays: h.facebook.blue_reels_play_count, ytViews: h.youtube.viewCount })),
  }));
  const lib = await askJson({
    system: [
      "You are the analyst for Flowra's short videos (Instagram Reels, the Facebook Page and YouTube Shorts, the same video on all three). Flowra sells an SEO tool to content teams and agencies, so the numbers that matter most are the ones that lead to customers: follows, profile visits and saves first, then shares and how much of the video people watched, then views. Likes matter least.",
      "Compare the reels against each other and find what the better ones did differently: the hook and its pattern, the story structure, the pillar, the goal (send or save), the length. Account for age: a reel posted yesterday has had less time; compare at similar ages using the growth snapshots. watchShare is average watch time divided by length (Instagram), the best sign of whether the hook and story held people.",
      "Instagram does not report follows or profile visits per Reel, so do not ask for them; use saves, shares and watch time instead. Facebook's numbers are whatever its video insights return (plays, reach, watch time); YouTube gives views, likes and comments only.",
      "Be honest about the sample: with a handful of reels, every finding is an early signal, never a rule. Never invent a number; use only the data given. When there is too little to say something, say so. Keep the previous findings that still hold, and update or drop the rest. Plain words, short sentences. Never the em dash or en dash.",
    ].join("\n\n"),
    prompt: [
      `The previous learnings${previous.date ? ` (${previous.date})` : ""}:`,
      previous.summary ? JSON.stringify({ summary: previous.summary, signals: previous.signals, tryNext: previous.tryNext }) : "none yet",
      "",
      "Every published reel, newest last:",
      JSON.stringify(table, null, 1),
    ].join("\n"),
    schema: Learnings,
    effort: "high",
  });
  return { date: new Date().toISOString().slice(0, 10), reels: reels.length, ...lib };
}

export function learningsMarkdown(l: Learnings, reels: ReelResult[]): string {
  const row = (r: ReelResult) => {
    const ig = r.latest.instagram, w = watchShare(r);
    return `| ${r.id.slice(0, 4)} | ${r.title.replace(/\|/g, "/").slice(0, 60)} | ${r.latest.ageDays}d | ${ig.views ?? "?"} | ${ig.saved ?? "?"} | ${ig.shares ?? "?"} | ${ig.follows ?? "?"} | ${w === undefined ? "?" : Math.round(w * 100) + "%"} | ${r.latest.facebook.blue_reels_play_count ?? "?"} | ${r.latest.youtube.viewCount ?? "-"} |`;
  };
  return [
    `# What our reels taught us (${l.date})`,
    "",
    l.summary,
    "",
    "| Reel | Title | Age | IG views | Saves | Shares | Follows | Watched | FB plays | YT views |",
    "|---|---|---|---|---|---|---|---|---|---|",
    ...reels.map(row),
    "",
    "## Signals",
    ...l.signals.map((s) => `- **${s.finding}** (${s.confidence}). ${s.evidence}`),
    "",
    "## Do more",
    ...l.doMore.map((x) => `- ${x}`),
    "",
    "## Do less",
    ...l.doLess.map((x) => `- ${x}`),
    "",
    "## Try next",
    ...l.tryNext.map((t) => `- ${t.experiment} Why: ${t.why} Measure: ${t.measure}`),
    "",
  ].join("\n");
}

/** What our results say, as a brief for a writer or planner. Empty before the first run. */
export function learnedBrief(root = ROOT): string {
  const f = path.join(root, "research/learnings.json");
  if (!existsSync(f)) return "";
  const l = JSON.parse(readFileSync(f, "utf8")) as Learnings;
  return [
    `WHAT OUR OWN REELS HAVE TAUGHT US (${l.reels} reels, ${l.date}; early signals, weigh by confidence):`,
    l.summary,
    ...l.signals.map((s) => `- ${s.finding} (${s.confidence} confidence)`),
    l.doMore.length ? `Do more: ${l.doMore.join(" | ")}` : "",
    l.doLess.length ? `Do less: ${l.doLess.join(" | ")}` : "",
    l.tryNext.length ? `Trying next: ${l.tryNext.map((t) => t.experiment).join(" | ")}` : "",
  ].filter(Boolean).join("\n");
}

async function main() {
  const reels = await collect();
  if (!reels.length) return void console.log("No published reels yet.");
  const date = new Date().toISOString().slice(0, 10);
  writeFileSync(path.join(ROOT, "state/results.json"), JSON.stringify({ updated: date, reels }, null, 1) + "\n");
  if (process.argv.includes("--numbers-only")) return;
  const l = await learn(reels);
  mkdirSync(path.join(ROOT, "research", date), { recursive: true });
  writeFileSync(path.join(ROOT, "research/learnings.json"), JSON.stringify(l, null, 1) + "\n");
  writeFileSync(path.join(ROOT, "research", date, "learnings.md"), learningsMarkdown(l, reels));
  const best = [...reels].sort((a, b) => (b.latest.instagram.views ?? 0) - (a.latest.instagram.views ?? 0))[0];
  await say([
    `*What our reels taught us this week* (${reels.length} reels)`,
    l.summary,
    `Most watched on Instagram: ${best.title} (${best.latest.instagram.views ?? 0} views, ${best.latest.instagram.saved ?? 0} saves).`,
    l.tryNext[0] ? `Trying next: ${l.tryNext[0].experiment}` : "",
    `Full notes: research/${date}/learnings.md`,
  ].filter(Boolean).join("\n"));
  console.log(`learnings -> research/learnings.json (${l.signals.length} signals)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
