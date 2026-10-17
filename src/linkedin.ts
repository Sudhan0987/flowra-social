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
  return readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f)).map((f) => f.slice(0, 10))
    .filter((d) => d <= today && existsSync(path.join(DIR, `${d}.approved`)) && !existsSync(path.join(DIR, `${d}.posted`))).sort();
}

async function createPost(channelId: string, text: string, firstComment: string): Promise<string> {
  type Res = { createPost: { post?: { id: string }; message?: string } };
  const sel = `{ ... on PostActionSuccess { post { id } } ... on MutationError { message } }`;
  const send = (input: Record<string, unknown>) => buffer<Res>(`mutation($input: CreatePostInput!) { createPost(input: $input) ${sel} }`, { input });
  // Buffer's free plan refuses LinkedIn first comments ("requires a paid plan", seen 17 Oct 2026), so by default the
  // link goes under the post. BUFFER_FIRST_COMMENT=true tries the first comment first (paid plan), falling back on any refusal.
  if (firstComment && process.env.BUFFER_FIRST_COMMENT === "true") {
    try {
      const r = await send({ channelId, text, schedulingType: "automatic", mode: "shareNow", metadata: { linkedin: { firstComment } } });
      if (r.createPost.post?.id) return r.createPost.post.id;
      console.log(`First comment refused (${r.createPost.message ?? "no reason"}); putting the link under the post.`);
    } catch (e) { console.log(`First comment refused (${(e as Error).message.slice(0, 120)}); putting the link under the post.`); }
  }
  const r = await send({ channelId, text: firstComment ? `${text}\n\n${firstComment}` : text, schedulingType: "automatic", mode: "shareNow" });
  if (!r.createPost.post?.id) throw new Error(`Buffer refused the post: ${r.createPost.message ?? "no reason given"}`);
  return r.createPost.post.id;
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
    const { text, firstComment } = parseDraft(readFileSync(path.join(DIR, `${d}.md`), "utf8"));
    if (process.argv.includes("--dry")) { console.log(`dry: would post ${d} to ${page.displayName ?? page.name}:\n${text}\n--- first comment:\n${firstComment}`); continue; }
    const id = await createPost(page.id, text, firstComment);
    writeFileSync(path.join(DIR, `${d}.posted`), `buffer ${id} ${new Date().toISOString()}\n`);
    console.log(`LinkedIn: posted ${d} to ${page.displayName ?? page.name} (Buffer post ${id})`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => { console.error((e as Error).message); process.exit(1); });
}
