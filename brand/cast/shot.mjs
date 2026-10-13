import { chromium } from "playwright";
const [file, out, w = 2400, h = 1900] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on("pageerror", (e) => console.log("page error:", e.message));
await p.goto("file://" + file); await p.waitForTimeout(300); await p.screenshot({ path: out }); await b.close();
