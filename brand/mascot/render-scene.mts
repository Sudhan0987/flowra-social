// Render a Floey scene to video with its own sound.
//   npx tsx brand/mascot/render-scene.mts <scene.html> <name> [id="line" ...] [--stills t1,t2,...]
// 1. speaks each line (beak sync comes from these), 2. draws every frame,
// 3. mixes the sound from the scene's cues, 4. joins them.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, "../..");
const [scene, name, ...rest] = process.argv.slice(2);
const stillsArg = rest.find((a) => a.startsWith("--stills"));
const lines = rest.filter((a) => /^\w+=/.test(a)).map((a) => [a.slice(0, a.indexOf("=")), a.slice(a.indexOf("=") + 1)]);
const OUT = path.join(HERE, "out", name), FR = path.join(OUT, "frames"), FPS = 30;
mkdirSync(OUT, { recursive: true });
const py = path.join(ROOT, ".venv/bin/python"), snd = path.join(HERE, "floey_sound.py");
const env = { ...process.env, ESPEAK_LIB: process.env.ESPEAK_LIB ?? "/opt/homebrew/lib/libespeak-ng.dylib", ESPEAK_DATA: process.env.ESPEAK_DATA ?? "/opt/homebrew/share/espeak-ng-data" };

// lines come from the command line, or from the scene's own window.LINES
const browser = await chromium.launch(); // SVG scenes need no WebGL; the software GL flags made screenshots hang
if (!lines.length) {
  const probe = await browser.newPage();
  await probe.goto("file://" + path.resolve(scene));
  lines.push(...((await probe.evaluate(() => (window as any).LINES)) ?? []));
  await probe.close();
}
const mouths: Record<string, number[]> = {};
for (const [id, line] of lines) {
  const said = path.join(OUT, `${id}.txt`);
  if (!existsSync(path.join(OUT, `${id}.mouth.json`)) || !existsSync(said) || readFileSync(said, "utf8") !== line) { writeFileSync(said, line); execFileSync(py, [snd, "voice", id, line, OUT], { stdio: "inherit", env }); }
  mouths[id] = JSON.parse(readFileSync(path.join(OUT, `${id}.mouth.json`), "utf8"));
}

const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on("pageerror", (e) => console.log("page error:", e.message));
await page.addInitScript(`window.MOUTHS = ${JSON.stringify(mouths)};`);
await page.goto("file://" + path.resolve(scene));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const dur: number = await page.evaluate(() => (window as any).DURATION);
rmSync(FR, { recursive: true, force: true });
mkdirSync(FR, { recursive: true });
const times = stillsArg ? stillsArg.split("=")[1].split(",").map(Number) : Array.from({ length: Math.round(dur * FPS) }, (_, i) => i / FPS);
for (const [i, t] of times.entries()) {
  await page.evaluate((t) => (window as any).render(t), t);
  await page.screenshot({ path: path.join(FR, `${String(i).padStart(4, "0")}.png`) });
}
if (stillsArg) {
  const cols = Math.min(7, times.length);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(FR, "%04d.png"), "-vf", `scale=270:-1,tile=${cols}x${Math.ceil(times.length / cols)}`, "-frames:v", "1", path.join(OUT, "stills.png")]);
  console.log(path.join(OUT, "stills.png"));
} else {
  writeFileSync(path.join(OUT, "cues.json"), JSON.stringify(await page.evaluate(() => (window as any).SOUND())));
  execFileSync(py, [snd, "mix", path.join(OUT, "cues.json"), OUT, String(dur)], { stdio: "inherit", env });
  const mp4 = path.join(OUT, `${name}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(FR, "%04d.png"), "-i", path.join(OUT, "mix.wav"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-shortest", mp4]);
  console.log(mp4);
}
await browser.close();
