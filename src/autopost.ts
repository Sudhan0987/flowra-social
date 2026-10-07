// Posts approved reels to Instagram (as a Reel) and the Facebook Page, with
// nobody at a keyboard. Run by .github/workflows/autopost.yml.
//
// 1. Approvals: a draft whose Slack message got a ✅ becomes approved (❌
//    rejects it). Approvals made in Flowra Desk are already in posts.json.
// 2. At most one reel goes out per India day, oldest approved first. Reels
//    with a `reason` are held on purpose and never posted.
// 3. The video comes from the reel's own make.yml artifact. Instagram gets it
//    through the resumable upload (no public URL needed); Facebook gets the
//    file directly.
// 4. posts.json records what went out (ids and date); the workflow commits it.
//
// Env: META_ACCESS_TOKEN, GITHUB_TOKEN, GITHUB_REPOSITORY, SLACK_BOT_TOKEN
// (optional), IG_USER_ID, FB_PAGE_ID. Never prints a token.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const G = "https://graph.facebook.com/v23.0";
const env = (k: string) => process.env[k] ?? "";
const T = env("META_ACCESS_TOKEN");
const IG = env("IG_USER_ID") || "17841426622354094";
const PAGE = env("FB_PAGE_ID") || "1322809910922605";
const DRY = process.argv.includes("--dry");

interface Post {
  id: string; status: string; topic: string; madeAt: string; reason?: string; note?: string; run?: number;
  slack?: { channel: string; ts: string };
  published?: { at: string; instagram?: string; facebook?: string | boolean };
}
const STATE = path.join(ROOT, "state/posts.json");
const load = () => JSON.parse(readFileSync(STATE, "utf8")) as { posts: Post[] };
const save = (s: { posts: Post[] }) => writeFileSync(STATE, JSON.stringify(s, null, 2) + "\n");
const istDay = (d = new Date()) => new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function graph(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const j = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok || j.error) throw new Error(`Meta: ${j.error?.message ?? res.status}`);
  return j;
}

/** ✅ / ❌ reactions on each draft's Slack message decide it. Quietly does nothing without a Slack token or scope. */
async function slackDecisions(state: { posts: Post[] }): Promise<string[]> {
  const tok = env("SLACK_BOT_TOKEN");
  const changed: string[] = [];
  if (!tok) return changed;
  for (const p of state.posts) {
    if (p.status !== "draft" || !p.slack) continue;
    const u = `https://slack.com/api/reactions.get?channel=${p.slack.channel}&timestamp=${p.slack.ts}&full=true`;
    const j = (await (await fetch(u, { headers: { Authorization: `Bearer ${tok}` } })).json()) as { ok: boolean; error?: string; message?: { reactions?: { name: string }[] } };
    if (!j.ok) { console.log(`Slack reactions for ${p.id}: ${j.error}`); continue; }
    const names = (j.message?.reactions ?? []).map((r) => r.name);
    if (names.some((n) => /^(white_check_mark|heavy_check_mark|ballot_box_with_check)$/.test(n))) { p.status = "approved"; p.note = "Approved with ✅ in Slack"; changed.push(`${p.id} approved in Slack`); }
    else if (names.some((n) => /^(x|negative_squared_cross_mark|heavy_multiplication_x)$/.test(n))) { p.status = "rejected"; p.note = "Rejected with ❌ in Slack"; changed.push(`${p.id} rejected in Slack`); }
  }
  return changed;
}

/** The reel's video from its make.yml run artifact. */
async function fetchVideo(p: Post): Promise<string> {
  const repo = env("GITHUB_REPOSITORY") || "Sudhan0987/flowra-social";
  const gh = { Authorization: `Bearer ${env("GITHUB_TOKEN")}`, Accept: "application/vnd.github+json" };
  const list = (await (await fetch(`https://api.github.com/repos/${repo}/actions/artifacts?name=reels&per_page=100`, { headers: gh })).json()) as { artifacts: { id: number; expired: boolean; created_at: string; archive_download_url: string; workflow_run: { id: number } }[] };
  const made = Date.parse(p.madeAt);
  const live = list.artifacts.filter((a) => !a.expired);
  const art = (p.run && live.find((a) => a.workflow_run.id === p.run)) || live.filter((a) => Math.abs(Date.parse(a.created_at) - made) < 30 * 60000).sort((a, b) => Math.abs(Date.parse(a.created_at) - made) - Math.abs(Date.parse(b.created_at) - made))[0];
  if (!art) throw new Error(`No video artifact found for ${p.id} (artifacts are kept 30 days).`);
  const res = await fetch(art.archive_download_url, { headers: gh });
  if (!res.ok) throw new Error(`Artifact download failed: ${res.status}`);
  const dir = mkdtempSync(path.join(os.tmpdir(), "reel-"));
  writeFileSync(path.join(dir, "a.zip"), Buffer.from(await res.arrayBuffer()));
  execFileSync("unzip", ["-q", "-o", "a.zip"], { cwd: dir });
  const sub = readdirSync(dir).find((d) => d === p.id || d.startsWith(p.id.slice(0, 4)));
  const file = sub && path.join(dir, sub, "reel.mp4");
  if (!file || !existsSync(file)) throw new Error(`The artifact has no reel.mp4 for ${p.id}.`);
  return file;
}

function caption(p: Post): string {
  const f = path.join(ROOT, "drafts", p.id, "script.json");
  if (!existsSync(f)) throw new Error(`No script for ${p.id}.`);
  const s = JSON.parse(readFileSync(f, "utf8")) as { caption: string; hashtags?: string[] };
  const text = `${s.caption.trim()}${s.hashtags?.length ? "\n\n" + s.hashtags.join(" ") : ""}`;
  if (/[—–]/.test(text)) throw new Error("Caption has an em or en dash.");
  return text.slice(0, 2200);
}

async function postInstagram(file: string, text: string): Promise<string> {
  const size = statSync(file).size;
  const c = await graph(`${G}/${IG}/media`, { method: "POST", body: new URLSearchParams({ media_type: "REELS", upload_type: "resumable", caption: text, access_token: T }) });
  const up = await fetch(`https://rupload.facebook.com/ig-api-upload/v23.0/${c.id}`, {
    method: "POST",
    headers: { Authorization: `OAuth ${T}`, offset: "0", file_size: String(size) },
    body: readFileSync(file),
  });
  const uj = (await up.json().catch(() => ({}))) as Record<string, any>;
  if (!up.ok || uj.success === false) throw new Error(`Instagram upload: ${uj.debug_info?.message ?? uj.message ?? up.status}`);
  for (let i = 0; i < 60; i++) {
    const s = await graph(`${G}/${c.id}?fields=status_code,status&access_token=${T}`);
    if (s.status_code === "FINISHED") break;
    if (s.status_code === "ERROR") throw new Error(`Instagram processing: ${s.status}`);
    if (i === 59) throw new Error("Instagram never finished processing.");
    await sleep(10000);
  }
  const pub = await graph(`${G}/${IG}/media_publish`, { method: "POST", body: new URLSearchParams({ creation_id: c.id, access_token: T }) });
  return String(pub.id);
}

async function postFacebook(file: string, text: string): Promise<string> {
  const pages = await graph(`${G}/me/accounts?fields=id,access_token&access_token=${T}`);
  const pt = (pages.data as { id: string; access_token: string }[]).find((x) => x.id === PAGE)?.access_token;
  if (!pt) throw new Error("No access to the Facebook Page with this token.");
  const fd = new FormData();
  fd.set("description", text);
  fd.set("access_token", pt);
  fd.set("source", new Blob([readFileSync(file)], { type: "video/mp4" }), "reel.mp4");
  const v = await graph(`https://graph-video.facebook.com/v23.0/${PAGE}/videos`, { method: "POST", body: fd });
  return String(v.id);
}

/** --check: upload the newest posted reel to Instagram and wait until it is processed, without publishing (the container lapses unused). */
async function check() {
  const p = load().posts.filter((x) => x.published).sort((a, b) => b.madeAt.localeCompare(a.madeAt))[0];
  if (!p) throw new Error("No posted reel to test with.");
  const file = await fetchVideo(p);
  const size = statSync(file).size;
  const c = await graph(`${G}/${IG}/media`, { method: "POST", body: new URLSearchParams({ media_type: "REELS", upload_type: "resumable", caption: "upload check", access_token: T }) });
  const up = await fetch(`https://rupload.facebook.com/ig-api-upload/v23.0/${c.id}`, { method: "POST", headers: { Authorization: `OAuth ${T}`, offset: "0", file_size: String(size) }, body: readFileSync(file) });
  console.log(`upload ${up.status}: ${JSON.stringify(await up.json().catch(() => ({}))).slice(0, 200)}`);
  for (let i = 0; i < 40; i++) {
    const st = await graph(`${G}/${c.id}?fields=status_code,status&access_token=${T}`);
    console.log(`[${i}] ${st.status_code}`);
    if (st.status_code === "FINISHED") return console.log("Instagram upload path works (not published).");
    if (st.status_code === "ERROR") throw new Error(`Instagram processing: ${st.status}`);
    await sleep(10000);
  }
  throw new Error("Instagram never finished processing.");
}

async function main() {
  if (process.argv.includes("--check")) return check();
  const state = load();
  const notes = await slackDecisions(state);
  if (notes.length) { save(state); notes.forEach((n) => console.log(n)); }
  const today = istDay();
  if (state.posts.some((p) => p.published?.at === today)) return console.log(`A reel already went out today (${today}); next one tomorrow.`);
  const next = state.posts.filter((p) => p.status === "approved" && !p.reason && !p.published).sort((a, b) => a.madeAt.localeCompare(b.madeAt))[0];
  if (!next) return console.log("Nothing approved and waiting.");
  console.log(`Posting ${next.id}`);
  const text = caption(next);
  if (DRY) return console.log("dry run: caption ok,", text.length, "characters");
  if (!T) throw new Error("META_ACCESS_TOKEN is not set.");
  const file = await fetchVideo(next);
  const ig = await postInstagram(file, text);
  console.log(`Instagram: ${ig}`);
  let fb: string | boolean = false;
  try { fb = await postFacebook(file, text); console.log(`Facebook: ${fb}`); } catch (e) { console.log(`Facebook failed: ${(e as Error).message}`); }
  const fresh = load();
  const p = fresh.posts.find((x) => x.id === next.id)!;
  p.status = "published";
  p.published = { at: today, instagram: ig, facebook: fb };
  save(fresh);
}

main().catch((e) => {
  console.error((e as Error).message);
  process.exit(1);
});
