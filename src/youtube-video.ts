// Uploads one long video to the Flowra SEO channel from a folder in
// youtube/videos/<name>/ holding meta.json and the thumbnail. The video file
// itself is too big for git, so it comes from a GitHub release asset (see
// .github/workflows/youtube-video.yml). Records the result in the folder's
// published.json; refuses to upload the same folder twice.
//
//   npx tsx src/youtube-video.ts youtube/videos/launch-film path/to/video.mp4

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { setThumbnail, uploadVideo, type VideoMeta } from "./youtube.ts";

const [dir, file] = process.argv.slice(2);
if (!dir || !file) throw new Error("Usage: youtube-video.ts <folder> <video.mp4>");
const done = path.join(dir, "published.json");
if (existsSync(done)) {
  console.log(`Already uploaded: ${readFileSync(done, "utf8").trim()}`);
  process.exit(0);
}
const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8")) as VideoMeta & { thumbnail?: string };
const all = `${meta.title}\n${meta.description}`;
if (/[—–]/.test(all)) throw new Error("Title or description has an em or en dash.");
if (/[<>]/.test(all)) throw new Error("YouTube refuses < and > in the title or description.");
if (meta.title.length > 100) throw new Error(`Title is ${meta.title.length} characters; YouTube allows 100.`);

const v = await uploadVideo(file, meta);
console.log(`Uploaded: https://youtu.be/${v.id} (${v.privacy}${v.publishAt ? `, goes live ${v.publishAt}` : ""})`);
let thumb = "none";
if (meta.thumbnail) {
  try { await setThumbnail(v.id, path.join(dir, meta.thumbnail)); thumb = "set"; console.log("Thumbnail set."); }
  catch (e) { thumb = `failed: ${(e as Error).message}`; console.log(`Thumbnail ${thumb}`); }
}
writeFileSync(done, JSON.stringify({ id: v.id, url: `https://youtu.be/${v.id}`, privacy: v.privacy, publishAt: v.publishAt ?? null, thumbnail: thumb, uploadedAt: new Date().toISOString() }, null, 1) + "\n");
