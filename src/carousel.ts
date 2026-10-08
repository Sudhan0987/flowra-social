// LinkedIn document posts (PDF carousels). The 2026 data says they are the
// format with the most reach and engagement on LinkedIn (van der Blom's
// Algorithm Insights 2026 on 1.3M posts; AuthoredUp 2026: about 6x the
// engagement and 4x the reach of a text post), and Flowra had none. Each
// Thursday post now ships as text plus a 6 to 9 slide PDF in the site's look:
// white ground, the faint grid, Floey's colours as the accent, the spark mark,
// Floey herself on the last slide. Slides hold at most about 12 words each
// (the benchmark for the best performing documents), which the schema enforces.
//
// Rendered by Playwright at 1080 x 1350 (4:5, LinkedIn's tallest document
// page, which fills the phone screen). Output: posts/linkedin/<date>.pdf and
// a PNG of the first slide for the Desk preview.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const Slide = z.object({
  kicker: z.string().optional().describe("2 to 4 words above the title, e.g. 'Step 1' or 'The check'. Empty on the cover."),
  title: z.string().describe("At most 8 words. The one thing this slide says."),
  body: z.string().optional().describe("At most 18 words, one or two short lines. Empty when the title carries it."),
  stat: z.string().optional().describe("A number from the sources to show big, e.g. '82%' or '15 days'. Only when the slide is about it."),
});
export type Slide = z.infer<typeof Slide>;
export const Slides = z.array(Slide).min(6).max(9).describe("Slide 1 is the cover (title = the hook, body = who it is for). Slides 2 to n-1 carry one point each. The last slide is the close: what to do now, no link.");

const words = (s = "") => s.trim().split(/\s+/).filter(Boolean).length;

/** What is wrong with a slide deck before drawing it; empty means it can be drawn. */
export function slideProblems(slides: Slide[]): string[] {
  const out: string[] = [];
  const text = JSON.stringify(slides);
  if (/[—–]/.test(text)) out.push("a slide has an em or en dash");
  if (/https?:\/\/|useflowra\.com\//.test(text)) out.push("a slide has a link");
  slides.forEach((s, i) => {
    if (words(s.title) > 8) out.push(`slide ${i + 1} title over 8 words`);
    if (words(s.body) > 18) out.push(`slide ${i + 1} body over 18 words`);
    if (words(s.kicker) > 4) out.push(`slide ${i + 1} kicker over 4 words`);
    if (words(s.title) + words(s.body) + words(s.kicker) > 26) out.push(`slide ${i + 1} is a wall of text (over 26 words)`);
  });
  return out;
}

const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SPECTRUM = ["#ef6f73", "#8466d9", "#f0a24a", "#c25aa0", "#4f5fc7"];
const spark = (size: number) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0a24a"/><stop offset=".5" stop-color="#ef6f73"/><stop offset="1" stop-color="#c25aa0"/></linearGradient></defs><path d="M12 1C13 8 16 11 23 12C16 13 13 16 12 23C11 16 8 13 1 12C8 11 11 8 12 1Z" fill="url(#sg)"/></svg>`;
const floey = (h: number) => readFileSync(path.join(ROOT, "brand/mascot/floey-perched.svg"), "utf8").replace("<svg ", `<svg width="${Math.round((h * 196) / 230)}" height="${h}" `);

/** The whole deck as one HTML document, one 1080 x 1350 page per slide. */
export function carouselHtml(slides: Slide[], handle = "useflowra"): string {
  const n = slides.length;
  const page = (s: Slide, i: number) => {
    const cover = i === 0, last = i === n - 1;
    const c = SPECTRUM[i % SPECTRUM.length];
    return `<section class="slide ${cover ? "cover" : ""} ${last ? "last" : ""}" style="--c:${c}">
      <div class="wash"></div><div class="grid"></div>
      <header><span class="brand">${spark(30)}Flowra</span><span class="count">${i + 1} / ${n}</span></header>
      <div class="body">
        ${s.kicker ? `<div class="kicker">${esc(s.kicker)}</div>` : ""}
        ${s.stat ? `<div class="stat">${esc(s.stat)}</div>` : ""}
        <h1 class="${cover ? "h-cover" : s.stat ? "h-small" : ""}">${esc(s.title)}</h1>
        ${s.body ? `<p>${esc(s.body)}</p>` : ""}
      </div>
      ${last ? `<div class="floey">${floey(300)}</div>` : ""}
      <footer><span class="handle">linkedin.com/company/${esc(handle)}</span>${last ? "" : `<span class="next">Swipe <svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 12h13M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`}</footer>
      <div class="rule"></div>
    </section>`;
  };
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Public+Sans:wght@400;500;600;700&display=block" rel="stylesheet">
<style>
  @page{size:1080px 1350px;margin:0}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{background:#fff;font-family:"Public Sans",system-ui,sans-serif;color:#0f1729}
  .slide{position:relative;width:1080px;height:1350px;overflow:hidden;page-break-after:always;background:#fff;display:flex;flex-direction:column;padding:72px 84px 84px}
  .slide:last-child{page-break-after:auto}
  .wash{position:absolute;inset:0;background:radial-gradient(50% 36% at 0% 0%,rgba(240,162,61,.16),transparent 70%),radial-gradient(50% 36% at 100% 100%,rgba(139,111,216,.14),transparent 70%)}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(150,160,180,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(150,160,180,.16) 1px,transparent 1px);background-size:44px 44px;-webkit-mask-image:radial-gradient(70% 60% at 50% 40%,#000 30%,transparent 80%)}
  header,footer,.body,.floey{position:relative}
  header{display:flex;justify-content:space-between;align-items:center}
  .brand{display:flex;align-items:center;gap:12px;font:700 32px "Space Grotesk";letter-spacing:-.01em}
  .count{font:600 22px "Public Sans";letter-spacing:.08em;color:#55627a}
  .body{flex:1;display:flex;flex-direction:column;justify-content:center;gap:28px;padding:40px 0}
  .kicker{display:inline-flex;align-self:flex-start;align-items:center;gap:10px;font:700 22px "Public Sans";letter-spacing:.14em;text-transform:uppercase;color:var(--c);background:color-mix(in srgb,var(--c) 12%,#fff);padding:10px 18px;border-radius:999px}
  .stat{font:700 200px/1 "Space Grotesk";letter-spacing:-.05em;background:linear-gradient(100deg,#c74e0a,#d63a3d 50%,#a83a82);-webkit-background-clip:text;color:transparent;padding-bottom:10px}
  h1{font:700 84px/1.04 "Space Grotesk";letter-spacing:-.035em;text-wrap:balance}
  h1.h-cover{font-size:96px}
  h1.h-small{font-size:64px}
  p{font:400 40px/1.35 "Public Sans";color:#3d4a60;text-wrap:pretty;max-width:860px}
  .cover p{font-size:36px;color:#55627a}
  .last .body{padding-right:300px}
  .floey{position:absolute;right:60px;bottom:140px;line-height:0}
  footer{display:flex;justify-content:space-between;align-items:center;font:500 22px "Public Sans";color:#55627a}
  .next{display:inline-flex;align-items:center;gap:8px;color:var(--c);font-weight:700}
  .rule{position:absolute;left:0;right:0;bottom:0;height:12px;background:linear-gradient(90deg,#f0a24a,#ef6f73 28%,#c25aa0 52%,#8466d9 76%,#4f5fc7)}
</style></head><body>${slides.map(page).join("")}</body></html>`;
}

/** Renders the PDF and a PNG of the first slide. Returns the two paths. */
export async function renderCarousel(slides: Slide[], outBase: string): Promise<{ pdf: string; png: string }> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await page.setContent(carouselHtml(slides), { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>(".slide").forEach((s, i) => {
        const b = s.querySelector<HTMLElement>(".body")!;
        if (b.scrollHeight > b.clientHeight + 2) out.push(`slide ${i + 1} overflows`);
      });
      return out;
    });
    if (bad.length) throw new Error(bad.join("; "));
    mkdirSync(path.dirname(outBase), { recursive: true });
    const pdf = `${outBase}.pdf`, png = `${outBase}-slide1.png`;
    await page.pdf({ path: pdf, width: "1080px", height: "1350px", printBackground: true, preferCSSPageSize: true });
    await page.locator(".slide").first().screenshot({ path: png });
    return { pdf, png };
  } finally {
    await browser.close();
  }
}

// `npx tsx src/carousel.ts <slides.json> <outBase>` renders a deck from a file (for previews and tests).
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) && process.argv[2]) {
  const slides = Slides.parse(JSON.parse(readFileSync(process.argv[2], "utf8")));
  const p = slideProblems(slides);
  if (p.length) { console.error(p.join("\n")); process.exit(1); }
  renderCarousel(slides, process.argv[3] ?? "runs/carousel/preview").then((r) => console.log(r.pdf, r.png));
}
