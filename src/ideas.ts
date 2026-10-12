// The reel ideas from social listening (research/latest.json), in the order
// the listening ranked them, minus the ones already made. The calendar shows
// these as the coming reels and the maker makes the first one, so what Desk
// promises for a day is what gets made. Before this (9 Oct 2026) the calendar
// listed the ideas in order while the maker picked freely, and the reel that
// came out was not the one the calendar showed.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface ReelIdea { title: string; channel: string; pillar?: string; hook: string; why: string; sources: string[]; repeatOf?: string }
export interface MadeFrom { status: string; idea?: string }

/** Reel and carousel ideas from the latest listening, in ranked order, minus ones held as repeats. */
export function reelIdeas(root: string): ReelIdea[] {
  const f = path.join(root, "research/latest.json");
  if (!existsSync(f)) return [];
  const l = JSON.parse(readFileSync(f, "utf8")) as { ideas?: ReelIdea[] };
  // repeatOf: held by hand because it teaches the same thing as a reel already made
  return (l.ideas ?? []).filter((i) => (i.channel === "reel" || i.channel === "carousel") && !i.repeatOf);
}

/**
 * The ideas nobody has made yet. A reel that failed its final test never went
 * out, so its idea stays on the list; a draft, an approved, a posted or a
 * rejected reel uses its idea up.
 */
export function unusedReelIdeas(ideas: ReelIdea[], posts: MadeFrom[]): ReelIdea[] {
  const used = new Set(posts.filter((p) => p.idea && p.status !== "failed").map((p) => p.idea!.trim().toLowerCase()));
  return ideas.filter((i) => !used.has(i.title.trim().toLowerCase()));
}
