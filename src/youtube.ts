// Uploads a reel to the Flowra SEO channel (@useflowra) as a YouTube Short,
// through the YouTube Data API with the channel's own sign-in (a refresh
// token made once by the founder, 10 Oct 2026, kept as a GitHub secret).
//
// Google keeps videos uploaded by an API project that has not passed its
// compliance audit private, whatever we ask for. So until the audit passes,
// each Short lands as Private and the founder flips it to Public in Studio;
// uploadShort reports the privacy YouTube actually gave it, so the record and
// the Slack note say which it was.
//
// Env: YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN. Never prints a token.

import { readFileSync, statSync } from "node:fs";

const env = (k: string) => process.env[k] ?? "";
export const youtubeReady = () => Boolean(env("YT_CLIENT_ID") && env("YT_CLIENT_SECRET") && env("YT_REFRESH_TOKEN"));

async function accessToken(): Promise<string> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ client_id: env("YT_CLIENT_ID"), client_secret: env("YT_CLIENT_SECRET"), refresh_token: env("YT_REFRESH_TOKEN"), grant_type: "refresh_token" }),
  });
  const j = (await r.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!j.access_token) throw new Error(`YouTube sign-in failed: ${j.error_description ?? j.error ?? r.status}. If it says invalid_grant, the founder signs in again (scratchpad auth script).`);
  return j.access_token;
}

export interface ShortMeta { title: string; description: string; tags: string[] }

/**
 * Title, description and tags for a Short from the reel's script. The title
 * carries #Shorts and stays inside YouTube's 100 characters; the description
 * is the Instagram caption (YouTube refuses < and > in either).
 */
export function shortMeta(script: { title: string; caption: string; hashtags?: string[] }): ShortMeta {
  const clean = (s: string) => s.replace(/[<>]/g, "").trim();
  const tag = " #Shorts";
  let title = clean(script.title);
  if (title.length + tag.length > 100) title = title.slice(0, 100 - tag.length - 1).replace(/\s+\S*$/, "") + "…";
  const hashtags = (script.hashtags ?? []).slice(0, 3);
  const description = clean(`${script.caption}${hashtags.length ? "\n\n" + hashtags.join(" ") : ""}`).slice(0, 4900);
  const base = ["seo", "search console", "content marketing", "seo tips", "google search"];
  // base tags first, then hashtag words not already covered ("searchconsole" is the same tag as "search console")
  const seen = new Set<string>(), tags: string[] = [];
  for (const t of [...base, ...(script.hashtags ?? []).map((h) => h.replace(/^#/, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase())]) {
    const k = t.replace(/\s+/g, "");
    if (!seen.has(k)) { seen.add(k); tags.push(t); }
  }
  return { title: title + tag, description, tags: tags.slice(0, 12) };
}

/** Uploads the file as a public Short (not made for kids). Returns the video id and the privacy YouTube actually set. */
export async function uploadShort(file: string, meta: ShortMeta): Promise<{ id: string; privacy: string }> {
  const token = await accessToken();
  const size = statSync(file).size;
  const start = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Length": String(size), "X-Upload-Content-Type": "video/mp4" },
    body: JSON.stringify({
      snippet: { title: meta.title, description: meta.description, tags: meta.tags, categoryId: "28" }, // Science & Technology
      status: { privacyStatus: "public", selfDeclaredMadeForKids: false, embeddable: true },
    }),
  });
  const where = start.headers.get("location");
  if (!start.ok || !where) throw new Error(`YouTube upload refused: ${start.status} ${(await start.text()).slice(0, 300)}`);
  const put = await fetch(where, { method: "PUT", headers: { "Content-Type": "video/mp4", "Content-Length": String(size) }, body: readFileSync(file) });
  const v = (await put.json().catch(() => ({}))) as { id?: string; status?: { privacyStatus?: string }; error?: { message?: string } };
  if (!put.ok || !v.id) throw new Error(`YouTube upload failed: ${put.status} ${v.error?.message ?? ""}`);
  return { id: v.id, privacy: v.status?.privacyStatus ?? "unknown" };
}
