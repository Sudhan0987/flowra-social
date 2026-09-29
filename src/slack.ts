// Posts a finished draft to #social: the video itself (so it plays inline)
// with its caption, and asks for a ✅ reaction to approve it. Without
// SLACK_BOT_TOKEN it prints instead, so everything runs before Slack is set up.

import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const CHANNEL = process.env.SLACK_CHANNEL ?? "social";

async function call<T>(method: string, body: Record<string, unknown>, form = false): Promise<T> {
  const token = process.env.SLACK_BOT_TOKEN;
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: form
      ? { authorization: `Bearer ${token}`, "content-type": "application/x-www-form-urlencoded" }
      : { authorization: `Bearer ${token}`, "content-type": "application/json; charset=utf-8" },
    body: form ? new URLSearchParams(Object.entries(body).map(([k, v]) => [k, String(v)])).toString() : JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; error?: string } & T;
  if (!json.ok) throw new Error(`Slack ${method}: ${json.error}`);
  return json;
}

let channelId: string | undefined;
async function channel(): Promise<string> {
  if (channelId) return channelId;
  const r = await call<{ channels: { id: string; name: string }[] }>("conversations.list", { limit: 200, exclude_archived: true, types: "public_channel,private_channel" });
  channelId = r.channels.find((c) => c.name === CHANNEL)?.id;
  if (!channelId) throw new Error(`Slack channel #${CHANNEL} not found, or the Flowra Agents app is not in it.`);
  return channelId;
}

/** A plain message as "Flowra Social". */
export async function say(text: string): Promise<void> {
  if (!process.env.SLACK_BOT_TOKEN) return void console.log(`(Slack) ${text}`);
  await call("chat.postMessage", { channel: await channel(), text, username: "Flowra Social", icon_emoji: ":clapper:", unfurl_links: false, unfurl_media: false });
}

/**
 * Uploads the video to #social with its message. Returns where the message
 * landed (channel and ts) so approvals can be read from its reactions later.
 */
export async function postDraft(file: string, text: string): Promise<{ channel: string; ts: string } | undefined> {
  if (!process.env.SLACK_BOT_TOKEN) {
    console.log(`(Slack) would upload ${file} to #${CHANNEL} with:\n${text}`);
    return undefined;
  }
  const ch = await channel();
  const bytes = readFileSync(file);
  const up = await call<{ upload_url: string; file_id: string }>("files.getUploadURLExternal", { filename: path.basename(file), length: statSync(file).size }, true);
  const put = await fetch(up.upload_url, { method: "POST", body: bytes });
  if (!put.ok) throw new Error(`Slack upload failed: ${put.status}`);
  await call("files.completeUploadExternal", { files: [{ id: up.file_id, title: path.basename(file) }], channel_id: ch, initial_comment: text });
  // The share is posted a moment later; find the message that carries the file.
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const h = await call<{ messages: { ts: string; files?: { id: string }[] }[] }>("conversations.history", { channel: ch, limit: 20 }, true);
    const m = h.messages.find((x) => x.files?.some((f) => f.id === up.file_id));
    if (m) return { channel: ch, ts: m.ts };
  }
  return { channel: ch, ts: "" };
}
