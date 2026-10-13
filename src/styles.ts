// The looks a reel can be made in (brand/styles/styles.json). The maker
// never repeats the last reel's style, so the feed alternates between, for
// example, Floey's garden and the professional screen explainer.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface Style { id: string; name: string; studio: string; template: string; voice: "floey" | "pro" | "duo"; mascot: boolean; research: string; rotation?: boolean }

export function styles(root: string): Style[] {
  const f = path.join(root, "brand/styles/styles.json");
  return existsSync(f) ? (JSON.parse(readFileSync(f, "utf8")) as { styles: Style[] }).styles : [];
}

/** Reels made before styles existed were all Floey's garden. */
export const styleOf = (p: { style?: string }) => p.style ?? "floey-garden";

/**
 * The style for the next reel: the first style in the rotation that is not
 * the style of the last reel actually made (failed ones don't count); with one
 * style in the rotation, that one. A style named by hand (REEL_STYLE) wins.
 */
export function pickStyle(all: Style[], posts: Array<{ status: string; style?: string }>, wanted?: string): Style {
  if (!all.length) throw new Error("brand/styles/styles.json lists no styles.");
  if (wanted) {
    const s = all.find((x) => x.id === wanted);
    if (!s) throw new Error(`Unknown reel style "${wanted}". Known: ${all.map((x) => x.id).join(", ")}.`);
    return s;
  }
  // only styles in the rotation are picked automatically; one style alone simply repeats
  const pool = all.filter((s) => s.rotation !== false);
  const from = pool.length ? pool : all;
  const made = posts.filter((p) => p.status !== "failed");
  const last = made.length ? styleOf(made[made.length - 1]) : undefined;
  return from.find((s) => s.id !== last) ?? from[0];
}
