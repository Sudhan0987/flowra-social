# The Floey studio: what a reel is drawn with

Every reel is one HTML page that draws a frame for any time `t`. It is built
from approved parts only, so each new reel starts at the quality of reel 000
("meet Floey"): `reel/floey/template.html` is that reel, rebuilt on these parts.
Copy its shape.

## The page

```html
<script src="../../node_modules/gsap/dist/gsap.min.js"></script>
<script src="../../node_modules/gsap/dist/CustomEase.min.js"></script>
<script src="../../brand/mascot/hum.js"></script>
<script src="../../brand/mascot/floey.js"></script>
<script src="../../brand/world/garden.js"></script>
<script src="../../brand/studio/props.js"></script>
<script src="lines.js"></script>   <!-- window.LINES, written by the pipeline; never edit or redefine -->
```

- `const LINES = window.LINES, M = window.MOUTHS || {};` LINES is `[[id, text, emotion], ...]`; Floey speaks every line, in order.
- `const { B, DUR } = PROPS.timing(LINES, M, GAP);` B[id] = `{ start, len, end }` in seconds. GAP[id] is the pause after a line (0.25 to 0.75; longer before the address).
- World state lives in one object `W` animated by one paused gsap timeline `wt` (camera `camX, camY, zoom` and every prop's 0..1 progress).
- Floey is one actor: `const F = FLOEY.create({ x, y, facing, scale: 1.35, mood })`, then behaviours at times.
- `window.render = (t) => {...}` is a pure function of t: `wt.seek(Math.min(DUR, t), false); F.pose(t);` then build the SVG string and set `#stage` innerHTML. No Date, no Math.random, no requestAnimationFrame.
- Also set: `window.DURATION = DUR; window.SOUND = () => ({ ...F.sound(DUR), music: Object.values(B).map((x) => x.start) }); window.CAMERA = (t) => { wt.seek(Math.min(DUR, t), false); return { camX: W.camX, camY: W.camY, zoom: W.zoom }; }; window.FLOEY = F; window.BEATS = B;` and finish with `window.render(0)`.

Draw order in render: `GARDEN.defs() + GARDEN.background(t, cam)`, then the camera group `translate(540 960) scale(zoom) translate(-camX -camY)` holding `GARDEN.ground()`, flowers, props, `F.trail(t) + F.svg(t)`; close it; then `GARDEN.pollen(t, cam) + GARDEN.vignette()`, then `PROPS.captions(LINES, B, t)` and any screen-space card (end card) last.

## Floey (brand/mascot/floey.js)

Call behaviours in time order. Every one adds its own sound.

| behaviour | what it does |
|---|---|
| `dart(t, x, y, d=0.3, facing)` | a fast zip with stretch, then a brake |
| `move(t, x, y, d=0.45, ease)` | a smooth hover to a spot |
| `exit(t, x, y, d=0.32)` | zips off screen |
| `land(t, x, y, d=0.5)` / `takeoff(t)` | perch on something / leave it |
| `pivot(t, "side" or "front" or "three" or "back")` | turns her body (front = talking to the viewer) |
| `face(t, 1 or -1)` | which way she faces in side view (-1 = left) |
| `mood(t, m)` | hello, happy, worried, think, surprised, determined, sad, party |
| `look(t, x, y, d)` | eyes toward -1..1, -1..1 |
| `say(t, M[id], id)` | speaks line id with lip sync. Call it at `B[id].start` for every line. |
| `chips(t, n)` | her little "pip pip" (before she introduces herself, or a happy beat) |
| `reach(t, px, py, d)` | moves so her beak tip lands on a point (to tap a button, catch a bug) |
| `pick(t, svgItem, id)` / `eat(t)` / `toss(t, dir)` | takes an item in her beak; eats it (bugs); throws it |
| `sip(t, n)` | drinks from a flower |
| `flash(t)` | the throat shimmer (a proud or excited moment) |
| `wink(t)`, `tongue(t, n)`, `preen(t, d)`, `stretch(t, d)`, `shake(t)`, `lookAround(t, d)` | small life between actions |
| `shuttle(t, n, w, step)` | side-to-side display flight (celebration) |
| `reverse(t, x, d)` | flies backwards (hummingbirds can) |
| `sfx(t, kind)` | an extra sound: swish, tk, pluck, tap, ting, bloom, rustle, brrt, flutter, shimmer, zipoff, chip |
| `F.events` | `{ type: "picked", t }` etc., to hide a bug once she has caught it |

Scale 1.35 is her normal size in a reel; 1.0 for a wide shot.

## The garden (brand/world/garden.js)

- Pages are flowers: `f = { x, base: 1720, h: 380..720, pal: [3 colours from HUM.colors], dir: 1 or -1, seed }`.
- `GARDEN.flower(f, health, t, { arrow: "up" or "down", dropPetal: 0..1 })`: health 1 = thriving (bright, sway, glow), 0 = fading (beige, droop, yellowed page). If the voice says a page is fading, animate its health down; if it recovers, up.
- `GARDEN.fallingPetal(f, health, x, y, k)` a petal dropping, k 0..1.
- `GARDEN.background(t, cam)`, `GARDEN.ground()`, `GARDEN.pollen(t, cam)`, `GARDEN.vignette()`, `GARDEN.defs()`.
- Colours: `HUM.colors` = ink, cream, paper, amber, coral, magenta, violet, indigo, deep. The brand spark: `HUM.spark(x, y, r, colour)`.

## Props (brand/studio/props.js)

`PROPS.head(f, health)` where a flower's page sits; `PROPS.bug(t, k, "404")` and `PROPS.bugOn(f, t)` a bug crawling on a page (Floey eats bugs: errors, broken links); `PROPS.tag(x, y, k, text, colour)` pill label; `PROPS.reviewCard(k, { published, title, button, done })` and `PROPS.reviewButton()` the change preview with a Publish button; `PROPS.calendar(k, x, y, days, label)`; `PROPS.chart(k, x, y, { title, points, markAt, color })`; `PROPS.rankLine(y, "PAGE 1")`; `PROPS.sparks(t, x, y, at, n, size)`; `PROPS.captions(LINES, B, t)`; `PROPS.endCard(k, "useflowra.com", "Start free")`; `PROPS.measure(text, font)` to size any new box to its text.

A reel may draw one or two small new props of its own (a magnifying glass, a signpost, a search result card) in the same style: ink outlines 5 to 7 px, paper fill `#fffaf2`, rounded corners, Space Grotesk 700. Size every box to its text with `PROPS.measure`.

## Walking through a real screen (UI chrome)

Not every reel is a garden metaphor. Some topics are genuinely "here's what you do in the product" — Search Console, GA4, Flowra's own dashboard, the rework queue. Those reels still draw the screen, they just draw it in Floey's own hand, never as a screenshot. Build it from these (same `brand/studio/props.js`):

- `PROPS.panel(k, x, y, w, h, { title, accent })` a window of paper to hold the rest; `PROPS.panelBody(x, y, w, h, { title })` returns the `{x, y, w, h}` content rect under its title bar — place everything else relative to that, not to the panel's outer edges.
- `PROPS.tabs(k, x, y, w, labels, activeIndex, accent)` a tab row, active one underlined.
- `PROPS.dropdown(k, x, y, label)` an outline pill with a chevron — a filter or setting a viewer recognizes, not a status badge.
- `PROPS.table(k, x, y, w, rows)` up to 4 rows of `{ label, diff }` — a real data table (query, page, metric), not invented numbers; `diff` drives the rising/falling colour and arrow by itself.
- `PROPS.bars(k, x, y, w, h, data)` up to 5 bars, `data: [{ label, value (0..1), color? }]`, rounded ends, `color` falling back to `PROPS.seriesColor(i)`.
- `PROPS.badge(k, x, y, text, tone)` a status pill, `tone` one of `good | warn | critical | neutral` only.
- `PROPS.button(k, x, y, label, tone)` a filled pill, `tone` `ink` (default action) or `good` (confirmed); its `x, y` is also where Floey should `reach()` to tap it.
- `PROPS.cursor(k, x, y)` a small tap ring to land on a control the moment Floey reaches it.

Colour discipline for this (the same rules any chart follows, just drawn by hand):

- `PROPS.series` is the fixed categorical order `[coral, indigo, amber, magenta, violet]` — assign `PROPS.seriesColor(i)` by a series' position, never cycle past the 5th; a 6th thing folds into "other" rather than repeating a hue.
- `PROPS.good` (rising, confirmed) and `PROPS.bad` (falling, error) are the one diverging pair, used by `table()`'s diff arrows and nowhere else as a meaning. `PROPS.warn` is reserved for the `badge()` warn tone only.
- A status tone (`badge`) is never reused for a category, and a category colour (`series`) is never reused to mean a status. If you need both a category and a status on the same row, show the category as a coloured dot or label and the status as its own `badge`.
- A real reel never shows more than one `panel` of invented numbers; label them "example numbers" in the voice line or caption if the exact figures aren't the viewer's real data.

Hard rule specific to this: **never draw browser chrome, a literal window frame, or copy a real product's exact layout, icon set, or wordmark.** This is Floey's own paper-and-ink rendering of a screen living inside her garden — compose it the same way you'd place a prop beside a flower: a `panel` can sit over the grass with Floey perched at it, tapping a `button`, reacting to a `badge`. If a storyboard beat describes a UI action ("open the Date filter", "sort by clicks"), that is exactly what `dropdown`/`tabs`/`table` are for — draw the approved part, never a new invented mockup. `brand/studio/demo.html` renders every part above at rest (`npx tsx brand/mascot/render-scene.mts brand/studio/demo.html demo --out=/tmp/x --stills=0`) — look at it before inventing a new UI piece; if what you need isn't there, build it from the same ink-outline/paper-fill/Space-Grotesk vocabulary, sized with `PROPS.measure`, the same way `panel`/`badge`/`button` are built.

## Hard rules (the pipeline checks these in code before anyone looks)

- The page loads with no errors and defines everything above; `window.LINES` is not redefined.
- While she speaks, Floey is inside the frame (x 60 to 1020, y 220 to 1420 on screen) or fully off screen as a voice-over; never half cut off at the edge.
- Nothing important under the captions band (y 1440 to 1580) and no text in the top 150 px (Instagram covers them); a close-up (zoom 2+) may crop the world.
- Text never overflows its box and no two texts overlap.
- Captions are never repeated as on-screen text: the picture shows the idea. Short interface labels a viewer needs to follow along (a tab or column name, one number) are fine.
- Length 15 to 45 seconds.
