# The "pro" style: what a professional reel is drawn with

A clean product explainer in useflowra.com's colours: white with a faint grid,
navy ink, cool hairlines, one deep orange accent. The picture is a working
screen in motion (a chart drawing itself, rows sliding in and re-sorting, a
cursor clicking a tab, the camera pushing in on the one row that matters),
with one short headline above it. A narrator speaks (a clear, grown-up voice,
not Floey's). There is no mascot in the story; Floey only perches on the logo
in the end card, which `PRO.endCard` draws for you.

`reel/pro/template.html` is the approved worked example. Copy its shape.

## The page

```html
<script src="../../node_modules/gsap/dist/gsap.min.js"></script>
<script src="../../brand/mascot/hum.js"></script>
<script src="../../brand/mascot/floey.js"></script>   <!-- only for the end card's perched Floey -->
<script src="../../brand/styles/pro/ui.js"></script>
<script src="lines.js"></script>   <!-- window.LINES, written by the pipeline; never edit or redefine -->
```

Fonts come from `reel/assets/` with @font-face, exactly as the template does
(Space Grotesk for headlines, Public Sans for interface text, IBM Plex Mono for
numbers). Never load fonts from the web.

- `const LINES = window.LINES, M = window.MOUTHS || {};` then timing exactly as the template: `B[id] = { start, len, end }` from each line's mouth length and a GAP per line.
- World state in one object `W`, animated by one paused gsap timeline `wt`. Camera is `W.camX, W.camY, W.zoom`.
- Sounds: `const S = PRO.sounds();` then `S.sfx(t, kind)` on real events and `S.say(B[id].start, M[id], id)` for every line (a loop over LINES, as in the template).
- `window.render = (t) => {...}`: `wt.seek(Math.min(DUR, t), false)`, then build the SVG string into `#stage`. Pure function of t: no Date, no Math.random, no requestAnimationFrame.
- Also set `window.DURATION = DUR; window.SOUND = () => S.sound(DUR); window.CAMERA = (t) => {...}; window.BEATS = B; window.STYLE = "pro";` Do not set `window.FLOEY`. Finish with `window.render(0); document.fonts.ready.then(() => window.render(0));`.

Draw order: `PRO.bg(t)`, the kicker and headline, then `PRO.cam(screens, {x, y, zoom})` holding the screens (each wrapped in `PRO.screen(inner, k)` so it swings in and falls away), then `PRO.endCard(W.end, t)`, then `PRO.captions(LINES, B, t)` last (hide captions once the end card is up).

## Parts (brand/styles/pro/ui.js)

| part | what it draws |
|---|---|
| `PRO.screen(inner, k)` | a whole screen: k 0 to 1 swings in from the right, 1 to 2 falls away to the left. Use it between screens (never a hard cut). |
| `PRO.card(x, y, w, h, {title, tag})` | a window card with a title bar; `tag` is an orange pill (e.g. "Search Console") |
| `PRO.chart(x, y, w, h, {labels, series, mark})` | line chart; each series `{pts, color, k, area, label}` draws itself as k goes 0 to 1; `mark {from, to, k, label}` shades an x range |
| `PRO.table(x, y, w, {cols, rows, k, hi, hk, order, ok, sortCol})` | rows slide in with k; `hi`/`hk` highlight a row; `order` + `ok` re-sort the rows; `sortCol` marks the sorted column |
| `PRO.tabs(x, y, labels, active, k)` | tab row; active underlined in orange |
| `PRO.cursor(x, y, {click, k})` | pointer; `click` 0 to 1 plays a ripple. Move it with the timeline and land it on the exact control the voice names. |
| `PRO.ring(x, y, w, h, k, tone)` | a highlight drawn around something (bad, good or brand) |
| `PRO.arrow(x1, y1, x2, y2, k)` | an arrow drawing on |
| `PRO.pill(x, y, text, tone, k)` | status pill: good, bad, warn, ink, brand |
| `PRO.counter(x, y, from, to, k, opts)` | a number counting up or down |
| `PRO.headline(text, {y, k, accent})` | the line above the screen, words rising in; `accent` words turn orange. One headline per screen, at most 6 words, at y 340. It names the step, never repeats the voice. |
| `PRO.kicker(text, y, k)` | small label over the headline (e.g. "Search Console check"), y 236 |
| `PRO.captions(LINES, B, t)` | burned-in captions on a navy box at y 1530 |
| `PRO.endCard(k, t)` | the logo with Floey perched on the spark's left arm, the tagline, the address |
| `PRO.c` | the colours: ink, muted, line, brand, good, bad, warn, clicks (blue), imps (purple) |

Sounds (`S.sfx`): click (cursor clicks), whoosh (a screen swings), pop (a pill or rows appear), tick (a small change), rise (before the payoff), thump (the end card lands). One per real event, never more than one every 0.4 seconds. The music bed (assets/music) and the mix are added for you.

## Hard rules

- **Frame one shows the problem**, already in motion: the falling line, the red number, the broken row. Never an empty screen, a logo or a title card first. The cover is never seen in the feed.
- **Every line has a picture that does what the voice says, at that moment.** "Sort by the difference" means the cursor clicks that column and the rows move. Never a static screen while the voice describes an action.
- **Screens are drawn, never screenshots, and never pretend to be someone's real data.** Example pages and numbers are plainly examples (/blog/..., round numbers). A tool's screen (Search Console, GA4, WordPress) is drawn in this style, with no third-party logos.
- **Big enough for a phone:** interface text at least 26 px, headline 66 px, numbers in the table 31 px. Keep everything inside x 60 to 1020 and y 220 to 1420; captions own 1440 to 1580; Instagram covers the top 200 px and the bottom 340 px.
- **Text never overflows its box and never overlaps other text.** Measure with `PRO.measure`.
- **One idea per screen, two or three screens per reel,** each swinging in with `PRO.screen`. Push the camera in (zoom 1.1 to 1.25) on the payoff; never crop the thing you are pointing at.
- **No em dashes or en dashes anywhere.**
