// Draws a draft's reel frame by frame in a headless browser and joins the
// frames with its audio into reel.mp4 (1080x1920, 30 fps, H.264 + AAC), the
// format Instagram Reels, TikTok, YouTube Shorts and LinkedIn all accept.
//
//   tsx src/render.ts <draft dir> [--stills 1.2,5,9]
//
// Needs script.json and timeline.json in the draft (src/audio.py writes the
// timeline and audio.wav). Frame 0 is the hook fully written out, so the
// cover Instagram picks by default is readable, not a blank first frame.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import type { Script } from "./script.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;

interface Timeline { duration: number; beats: { start: number; spokenEnd: number; end: number }[] }

function clipFrames(dir: string, script: Script): Record<string, { dir: string; count: number; fps: number }> {
  const catalog = JSON.parse(readFileSync(path.join(ROOT, "assets/clips.json"), "utf8")) as { clips: { id: string; mp4: string }[] };
  const out: Record<string, { dir: string; count: number; fps: number }> = {};
  for (const b of script.beats) {
    if (b.kind !== "clip" || !b.clip || out[b.clip]) continue;
    const c = catalog.clips.find((x) => x.id === b.clip);
    if (!c) throw new Error(`Unknown clip "${b.clip}"`);
    const fdir = path.join(dir, "work", `clip-${c.id}`);
    rmSync(fdir, { recursive: true, force: true });
    mkdirSync(fdir, { recursive: true });
    // Chromium can't play H.264, so the clip becomes still frames the page swaps in.
    execFileSync("ffmpeg", ["-v", "error", "-i", path.join(ROOT, "assets/clips", c.mp4), "-vf", "fps=25,scale=1280:800:flags=lanczos", "-q:v", "3", path.join(fdir, "%04d.jpg")]);
    const count = execFileSync("ls", [fdir]).toString().trim().split("\n").length;
    out[b.clip] = { dir: "file://" + fdir, count, fps: 25 };
  }
  return out;
}

export async function render(dir: string, stills?: number[]): Promise<{ mp4: string; poster: string; seconds: number }> {
  const script = JSON.parse(readFileSync(path.join(dir, "script.json"), "utf8")) as Script;
  const timeline = JSON.parse(readFileSync(path.join(dir, "timeline.json"), "utf8")) as Timeline;
  const clips = clipFrames(dir, script);

  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript((data) => { (window as unknown as { REEL: unknown }).REEL = data; }, { script, timeline, clips });
    // A script may name its own scene page (reel/scenes/<name>.html); the default is the kinetic template.
    await page.goto("file://" + path.join(ROOT, "reel", (script as Script & { template?: string }).template ?? "reel.html"));
    await page.evaluate(() => (window as unknown as { ready: Promise<boolean> }).ready);
    if (errors.length) throw new Error(`The reel page failed: ${errors.join("; ")}`);
    const draw = (t: number) => page.evaluate((t) => (window as unknown as { render: (t: number) => Promise<void> }).render(t), t);

    if (stills) {
      mkdirSync(path.join(dir, "stills"), { recursive: true });
      for (const t of stills) {
        await draw(t);
        await page.screenshot({ path: path.join(dir, "stills", `${t.toFixed(2)}.png`) });
      }
      return { mp4: "", poster: "", seconds: timeline.duration };
    }

    const frames = path.join(dir, "work", "frames");
    rmSync(frames, { recursive: true, force: true });
    mkdirSync(frames, { recursive: true });
    const n = Math.ceil(timeline.duration * FPS);
    const hook = timeline.beats[0];
    for (let i = 0; i < n; i++) {
      const posterAt = (script as Script & { posterAt?: number }).posterAt;
      await draw(i === 0 ? posterAt ?? Math.min(hook.spokenEnd, hook.end - 0.15) : i / FPS);
      await page.screenshot({ path: path.join(frames, `${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
      if (i % 150 === 0) console.log(`frame ${i}/${n}`);
    }
    if (errors.length) throw new Error(`The reel page failed while drawing: ${errors.join("; ")}`);

    const mp4 = path.join(dir, "reel.mp4");
    const poster = path.join(dir, "poster.jpg");
    execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(frames, "%05d.jpg"), "-i", path.join(dir, "audio.wav"),
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-r", String(FPS),
      "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", "-movflags", "+faststart", mp4]);
    execFileSync("cp", [path.join(frames, "00000.jpg"), poster]);
    rmSync(path.join(dir, "work"), { recursive: true, force: true });
    return { mp4, poster, seconds: timeline.duration };
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith("render.ts")) {
  const [dir, flag, list] = process.argv.slice(2);
  if (!dir || !existsSync(path.join(dir, "timeline.json"))) throw new Error("Usage: tsx src/render.ts <draft dir> [--stills 1,2.5]");
  const r = await render(path.resolve(dir), flag === "--stills" ? list.split(",").map(Number) : undefined);
  console.log(r.mp4 ? `${r.mp4} (${r.seconds.toFixed(1)}s)` : "stills written");
}
