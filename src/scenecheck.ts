// The checks a machine can make on a Floey scene before anyone looks at it
// (brand/studio/README.md, "Hard rules"). Cheap and exact: they run before
// every visual review, so Claude's eyes are spent on taste, not on catching
// a bird that flew off screen or a label spilling out of its box.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

export type Line = [id: string, text: string, emotion: string];

const SAFE = { x0: 60, x1: 1020, y0: 220, y1: 1420 };
const CAPTION_BAND = { y0: 1440, y1: 1580 };

/** Lip-sync data the voice stage wrote (one number per frame per line). */
export function loadMouths(voiceDir: string): Record<string, number[]> {
  if (!existsSync(voiceDir)) return {};
  return Object.fromEntries(readdirSync(voiceDir).filter((f) => f.endsWith(".mouth.json")).map((f) => [f.replace(".mouth.json", ""), JSON.parse(readFileSync(path.join(voiceDir, f), "utf8"))]));
}

export async function checkScene(scene: string, lines: Line[], mouths: Record<string, number[]>): Promise<string[]> {
  const problems: string[] = [];
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(`window.MOUTHS = ${JSON.stringify(mouths)};`);
    await page.goto("file://" + path.resolve(scene));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    if (errors.length) return [`The page throws: ${errors.slice(0, 3).join(" | ")}`];

    const g = await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      // floey.js defines a global FLOEY library too; a scene with the mascot sets window.FLOEY to the actor, which has pose()
      const actor = typeof (w.FLOEY as { pose?: unknown } | undefined)?.pose === "function";
      return { render: typeof w.render, sound: typeof w.SOUND, camera: typeof w.CAMERA, floey: actor ? "object" : "none", beats: typeof w.BEATS, dur: w.DURATION as number, lines: w.LINES as unknown };
    });
    // window.FLOEY only in reels with the mascot (the pro style has none); the voice cues are checked either way
    for (const [k, v] of Object.entries({ "window.render": g.render, "window.SOUND": g.sound, "window.CAMERA": g.camera, "window.BEATS": g.beats })) if (v !== "function" && v !== "object") problems.push(`${k} is missing.`);
    if (problems.length) return problems;
    if (JSON.stringify(g.lines) !== JSON.stringify(lines)) problems.push("window.LINES was changed or redefined; use the pipeline's lines.js exactly.");
    if (!(g.dur >= 15 && g.dur <= 45)) problems.push(`DURATION is ${g.dur?.toFixed?.(1)} s; it must be 15 to 45.`);

    // every line is spoken, at its own time
    const sound = await page.evaluate(() => (window as unknown as { SOUND: () => { cues: { t: number; kind: string; id?: string; len?: number }[] } }).SOUND());
    const voice = sound.cues.filter((c) => c.kind === "voice");
    for (const [id] of lines) if (!voice.some((c) => c.id === id)) problems.push(`Line "${id}" is never spoken (no F.say(B.${id}.start, M.${id}, "${id}")).`);

    // where Floey is on screen while she speaks (reels with the mascot only)
    const samples = g.floey !== "object" ? [] : await page.evaluate((dur) => {
      const w = window as unknown as { render: (t: number) => void; CAMERA: (t: number) => { camX: number; camY: number; zoom: number }; FLOEY: { pose: (t: number) => { x: number; y: number } } };
      const out: { t: number; x: number; y: number }[] = [];
      for (let t = 0; t <= dur; t += 0.2) {
        w.render(t);
        const c = w.CAMERA(t), p = w.FLOEY.pose(t);
        out.push({ t: +t.toFixed(2), x: 540 + (p.x - c.camX) * c.zoom, y: 960 + (p.y - c.camY) * c.zoom });
      }
      return out;
    }, g.dur);
    for (const v of voice) {
      const s = samples.filter((p) => p.t >= v.t && p.t <= v.t + (v.len ?? 2));
      if (!s.length) continue;
      // fully off screen is a voice-over and fine; half in, half out is a cut-off bird
      const clipped = s.filter((p) => (p.x > -90 && p.x < SAFE.x0) || (p.x > SAFE.x1 && p.x < 1170) || (p.y > 40 && p.y < SAFE.y0) || (p.y > SAFE.y1 && p.y < CAPTION_BAND.y0 - 60));
      if (clipped.length / s.length > 0.25) problems.push(`Floey is cut off at the edge of the frame for ${Math.round(clipped.length / s.length * 100)}% of line "${v.id}" (${v.t.toFixed(1)} s to ${(v.t + (v.len ?? 2)).toFixed(1)} s), e.g. at ${clipped[0].t} s she is at screen ${Math.round(clipped[0].x)}, ${Math.round(clipped[0].y)}. Keep her inside x 60 to 1020, y 220 to 1420, or fully off screen for a voice-over.`);
      const low = s.filter((p) => p.y > CAPTION_BAND.y0 - 60 && p.y < CAPTION_BAND.y1);
      if (low.length / s.length > 0.25) problems.push(`Floey sits behind the captions (screen y ${Math.round(low[0].y)}) during line "${v.id}".`);
    }

    // text: inside the frame, out of Instagram's top bar, never overlapping other text
    const text = await page.evaluate((dur) => {
      const w = window as unknown as { render: (t: number) => void; CAMERA: (t: number) => { zoom: number } };
      const found: string[] = [];
      for (let t = 0.5; t < dur; t += 1) {
        w.render(t);
        // a deliberate close-up (zoom 2 and more) crops the world on purpose
        const closeUp = w.CAMERA(t).zoom >= 2;
        const boxes = [...document.querySelectorAll("#stage text")].map((e) => ({ s: (e.textContent ?? "").trim(), r: e.getBoundingClientRect(), o: +getComputedStyle(e).opacity * +(e.closest("[opacity]")?.getAttribute("opacity") ?? 1) }))
          .filter((b) => b.s && b.r.width > 2 && b.o > 0.3);
        for (const b of boxes) {
          if (closeUp) continue;
          if (b.r.left < -2 || b.r.right > 1082) found.push(`at ${t.toFixed(1)} s the text "${b.s.slice(0, 30)}" runs off the side of the frame`);
          if ((b.r.top + b.r.bottom) / 2 < 150) found.push(`at ${t.toFixed(1)} s the text "${b.s.slice(0, 30)}" sits in the top 150 px, under Instagram's header`);
        }
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].r, b = boxes[j].r;
          const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
          if (ix * iy > 0.25 * Math.min(a.width * a.height, b.width * b.height)) found.push(`at ${t.toFixed(1)} s the texts "${boxes[i].s.slice(0, 24)}" and "${boxes[j].s.slice(0, 24)}" overlap`);
        }
        // a text wider than the box drawn right behind it
        for (const e of document.querySelectorAll("#stage text")) {
          const rect = e.previousElementSibling;
          if (!rect || rect.tagName !== "rect") continue;
          const tr = e.getBoundingClientRect(), rr = rect.getBoundingClientRect();
          if (tr.width > 2 && rr.width > 20 && (tr.left < rr.left - 2 || tr.right > rr.right + 2) && tr.top >= rr.top - 4 && tr.bottom <= rr.bottom + 4) found.push(`at ${t.toFixed(1)} s the text "${(e.textContent ?? "").trim().slice(0, 30)}" overflows its box`);
        }
      }
      return [...new Set(found)];
    }, g.dur);
    // report each kind once per text, not once per second
    const seen = new Set<string>();
    for (const x of text) { const key = x.replace(/^at [\d.]+ s /, ""); if (!seen.has(key)) { seen.add(key); problems.push(x[0].toUpperCase() + x.slice(1) + "."); } }
  } finally {
    await browser.close();
  }
  return problems.slice(0, 15);
}

/** When each line starts in the scene, from its own window.BEATS. */
export async function beatStarts(scene: string, mouths: Record<string, number[]>): Promise<Record<string, number>> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addInitScript(`window.MOUTHS = ${JSON.stringify(mouths)};`);
    await page.goto("file://" + path.resolve(scene));
    return await page.evaluate(() => Object.fromEntries(Object.entries((window as unknown as { BEATS: Record<string, { start: number }> }).BEATS).map(([k, v]) => [k, v.start])));
  } finally {
    await browser.close();
  }
}
