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

## Hard rules (the pipeline checks these in code before anyone looks)

- The page loads with no errors and defines everything above; `window.LINES` is not redefined.
- While she speaks, Floey is inside the frame (x 60 to 1020, y 220 to 1420 on screen) or fully off screen as a voice-over; never half cut off at the edge.
- Nothing important under the captions band (y 1440 to 1580) and no text in the top 150 px (Instagram covers them); a close-up (zoom 2+) may crop the world.
- Text never overflows its box and no two texts overlap.
- Captions are never repeated as on-screen text: the picture shows the idea. Short interface labels a viewer needs to follow along (a tab or column name, one number) are fine.
- Length 15 to 45 seconds.
