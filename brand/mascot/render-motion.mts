// Renders brand/mascot/motion-test.html to Floey-motion-test.mp4 with its sound.
//   npx tsx brand/mascot/render-motion.mts [--stills]
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out"), FR = path.join(OUT, "frames"), FPS = 30;
const stills = process.argv.includes("--stills");
rmSync(FR, { recursive: true, force: true });
mkdirSync(FR, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => console.log("page error:", e.message));
await page.addInitScript(`window.MOUTH = ${readFileSync(path.join(HERE, "motion-mouth.json"), "utf8")};`);
await page.goto("file://" + path.join(HERE, "motion-test.html"));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const dur: number = await page.evaluate(() => (window as any).DURATION);
const times = stills ? [0.5, 1.3, 1.6, 1.85, 2.34, 3.2, 4.7, 5.15, 5.8, 6.3, 6.6, 7.2, 7.75, 8.4] : Array.from({ length: Math.round(dur * FPS) }, (_, i) => i / FPS);
for (const [i, t] of times.entries()) {
  await page.evaluate((t) => (window as any).render(t), t);
  await page.screenshot({ path: path.join(FR, `${String(i).padStart(4, "0")}.png`) });
}
await browser.close();
if (stills) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(FR, "%04d.png"), "-vf", "scale=270:-1,tile=7x2", "-frames:v", "1", path.join(OUT, "stills.png")]);
  console.log(path.join(OUT, "stills.png"));
} else {
  const mp4 = path.join(OUT, "Floey-motion-test.mp4");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(FR, "%04d.png"), "-i", path.join(HERE, "motion.wav"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-shortest", mp4]);
  console.log(mp4);
}
