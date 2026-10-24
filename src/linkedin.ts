// Posts approved LinkedIn drafts to the Flowra company page through Buffer.
//
// Founder, 2026-10-17: posts go on the Flowra page only, never the personal
// profile. LinkedIn's own API for company pages needs a partner review
// (Community Management API), so posting goes through Buffer, an approved
// LinkedIn partner, with a personal Buffer API key (BUFFER_API_KEY secret).
// Never a browser bot: that gets pages restricted.
//
// A draft is posts/linkedin/<date>.md. It goes out when:
//   - posts/linkedin/<date>.approved exists (Flowra Desk "Approve", or Claude
//     after the founder says yes in chat), and
//   - <date> is today or earlier (India time), and
//   - there is no posts/linkedin/<date>.posted yet.
// Media: posts/linkedin/<date>.pdf (+ <date>-slide1.png as the thumbnail) goes as a document, else
// <date>.png as an image; Buffer fetches them from raw.githubusercontent.com (public repo). If Buffer
// refuses the media, the text still goes out, and the log says so.
// After posting it writes <date>.posted ("buffer <post id> <time>") so the
// calendar and Desk show it as done and it never posts twice.
//
// Run by autopost.yml after the reel step. Quietly does nothing without the key.
//   npx tsx src/linkedin.ts           post what is due
//   npx tsx src/linkedin.ts --check   list Buffer organizations and channels, post nothing
//   npx tsx src/linkedin.ts --dry     show what would post
// Never prints the key.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "posts/linkedin");
const KEY = process.env.BUFFER_API_KEY ?? "";
const istDay = (d = new Date()) => new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);

async function buffer<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ query, variables }),
  });
  const j = (await res.json().catch(() => ({}))) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || j.errors?.length) throw new Error(`Buffer: ${j.errors?.map((e) => e.message).join("; ") ?? res.status}`);
  return j.data as T;
}

interface Channel { id: string; name: string; displayName?: string; service: string; isQueuePaused?: boolean }

/** Every channel on the account, from every organization. */
async function channels(): Promise<Channel[]> {
  const o = await buffer<{ account: { organizations: { id: string; name: string }[] } }>(`query { account { organizations { id name } } }`);
  const all: Channel[] = [];
  for (const org of o.account.organizations) {
    const c = await buffer<{ channels: Channel[] }>(`query($id: OrganizationId!) { channels(input: { organizationId: $id }) { id name displayName service isQueuePaused } }`, { id: org.id })
      .catch(async () => buffer<{ channels: Channel[] }>(`query { channels(input: { organizationId: "${org.id}" }) { id name displayName service isQueuePaused } }`));
    all.push(...c.channels);
  }
  return all;
}

/** The Flowra LinkedIn page: BUFFER_LINKEDIN_CHANNEL if set, else the only LinkedIn channel whose name looks like Flowra. */
async function flowraPage(): Promise<Channel> {
  const list = await channels();
  const forced = process.env.BUFFER_LINKEDIN_CHANNEL;
  const li = list.filter((c) => /linkedin/i.test(c.service));
  const page = forced ? li.find((c) => c.id === forced) : li.find((c) => /flowra/i.test(`${c.name} ${c.displayName ?? ""}`)) ?? (li.length === 1 ? li[0] : undefined);
  if (!page) throw new Error(`No Flowra LinkedIn channel in Buffer (LinkedIn channels: ${li.map((c) => c.displayName ?? c.name).join(", ") || "none"}). Connect the Flowra page in Buffer, or set BUFFER_LINKEDIN_CHANNEL.`);
  // founder, 17 Oct 2026: the Flowra page only, never the personal profile. Refuse anything else, even if the variable is wrong.
  if (!/flowra/i.test(`${page.name} ${page.displayName ?? ""}`)) throw new Error(`Refusing to post: channel "${page.displayName ?? page.name}" is not the Flowra page.`);
  return page;
}

/** The post text and its first comment, from the draft file (title line, notes and HTML comments removed). */
export function parseDraft(md: string): { text: string; firstComment: string } {
  const noNotes = md.replace(/<!--[\s\S]*?-->/g, "");
  const [head, ...rest] = noNotes.split("\n");
  const body = /^#\s/.test(head) ? rest.join("\n") : noNotes;
  const [main, comment = ""] = body.split(/\n---\s*\nFirst comment:\s*\n/);
  return { text: main.trim(), firstComment: comment.trim() };
}

/** Drafts that are approved, due and not posted yet, oldest first. */
export function dueDrafts(today = istDay()): string[] {
  if (!existsSync(DIR)) return [];
  const off = path.join(path.dirname(fileURLToPath(import.meta.url)), "../state/no-post-dates.txt");
  if (existsSync(off) && readFileSync(off, "utf8").split("\n").includes(today)) return [];
  return readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).map((f) => f.slice(0, 10))
    .filter((d) => d <= today && existsSync(path.join(DIR, `${d}.approved`)) && !existsSync(path.join(DIR, `${d}.posted`))).sort();
}

/** Public URL of a file on main (the repo is public since 17 Oct 2026; Buffer fetches assets by URL). */
export const rawUrl = (file: string) => `https://raw.githubusercontent.com/Sudhan0987/flowra-social/main/${file}`;

/** The media that goes with a draft: a PDF carousel (document) first, else an image card, else nothing. */
export function assetsFor(date: string, title: string): Record<string, unknown>[] {
  const pdf = path.join(DIR, `${date}.pdf`), slide1 = path.join(DIR, `${date}-slide1.png`), png = path.join(DIR, `${date}.png`);
  if (existsSync(pdf) && existsSync(slide1)) return [{ document: { url: rawUrl(`posts/linkedin/${date}.pdf`), title: title.slice(0, 100), thumbnailUrl: rawUrl(`posts/linkedin/${date}-slide1.png`) } }];
  if (existsSync(png)) return [{ image: { url: rawUrl(`posts/linkedin/${date}.png`), metadata: { altText: title.slice(0, 300) } } }];
  return [];
}

async function createPost(channelId: string, text: string, firstComment: string, assets: Record<string, unknown>[]): Promise<string> {
  type Res = { createPost: { post?: { id: string }; message?: string } };
  const sel = `{ ... on PostActionSuccess { post { id } } ... on MutationError { message } }`;
  const send = (input: Record<string, unknown>) => buffer<Res>(`mutation($input: CreatePostInput!) { createPost(input: $input) ${sel} }`, { input });
  const base = { channelId, schedulingType: "automatic", mode: "shareNow" };
  const body = (withComment: boolean) => (withComment || !firstComment ? text : `${text}\n\n${firstComment}`);
  // Buffer's free plan refuses LinkedIn first comments ("requires a paid plan", seen 17 Oct 2026), so by default the
  // link goes under the post. BUFFER_FIRST_COMMENT=true tries the first comment first (paid plan), falling back on any refusal.
  const attempts: Array<{ label: string; input: Record<string, unknown> }> = [];
  if (firstComment && process.env.BUFFER_FIRST_COMMENT === "true") attempts.push({ label: "with media and first comment", input: { ...base, text: body(true), assets, metadata: { linkedin: { firstComment } } } });
  attempts.push({ label: assets.length ? "with media" : "text", input: { ...base, text: body(false), assets } });
  if (assets.length) attempts.push({ label: "text only (media refused)", input: { ...base, text: body(false), assets: [] } });
  let last = "";
  for (const a of attempts) {
    try {
      const r = await send(a.input);
      if (r.createPost.post?.id) { if (a.label !== attempts[0].label) console.log(`Posted ${a.label}.`); return r.createPost.post.id; }
      last = r.createPost.message ?? "no reason given";
    } catch (e) { last = (e as Error).message; }
    console.log(`Buffer refused (${a.label}): ${last.slice(0, 160)}`);
  }
  throw new Error(`Buffer refused the post: ${last}`);
}

async function main() {
  if (!KEY) return console.log("BUFFER_API_KEY is not set: LinkedIn posts are not automated yet (post them from Flowra Desk with Open and copy).");
  if (process.argv.includes("--check")) {
    for (const c of await channels()) console.log(`${c.service}\t${c.displayName ?? c.name}\t${c.id}${c.isQueuePaused ? "\t(queue paused)" : ""}`);
    return;
  }
  const due = dueDrafts();
  if (!due.length) return console.log("No approved LinkedIn post due.");
  const page = await flowraPage();
  for (const d of due.slice(0, 1)) { // one post a day at most
    const md = readFileSync(path.join(DIR, `${d}.md`), "utf8");
    const { text, firstComment } = parseDraft(md);
    const title = md.split("\n")[0].replace(/^#\s*/, "").trim() || `Flowra, ${d}`;
    const assets = assetsFor(d, title);
    if (process.argv.includes("--dry")) { console.log(`dry: would post ${d} to ${page.displayName ?? page.name} with ${assets.length ? JSON.stringify(assets) : "no media"}:\n${text}\n--- first comment:\n${firstComment}`); continue; }
    const id = await createPost(page.id, text, firstComment, assets);
    writeFileSync(path.join(DIR, `${d}.posted`), `buffer ${id} ${new Date().toISOString()}\n`);
    console.log(`LinkedIn: posted ${d} to ${page.displayName ?? page.name} (Buffer post ${id})`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error((e as Error).message); process.exit(1); });
}
