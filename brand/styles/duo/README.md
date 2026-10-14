# The "duo" style: Maya & Floey

A sitcom moment in Maya's room. **Maya** (a solo blogger who panics about her traffic) and **Floey** (Flowra's hummingbird, calm, dry, always right) talk to each other. Maya has the problem, Floey has the reframe and one real tip, and the reel ends on a button: a punchline, a reaction, a look to camera. The job is brand awareness: people watch it because it is funny and true, share it with a friend who is Maya, and remember the two characters. It is never a sales pitch; Flowra appears in the end card only.

Who they are, how they talk and their running jokes: `brand/cast/README.md`. Founder approval of the look, the voices and the template: 13 Oct 2026.

`reel/duo/template.html` is the approved worked example. Copy its shape.

## The page

```html
<script src="../../node_modules/gsap/dist/gsap.min.js"></script>
<script src="../../node_modules/gsap/dist/CustomEase.min.js"></script>
<script src="../../brand/mascot/hum.js"></script>
<script src="../../brand/mascot/floey.js"></script>
<script src="../../brand/studio/props.js"></script>
<script src="../../brand/cast/maya.js"></script>
<script src="../../brand/cast/duo.js"></script>
<script src="lines.js"></script>   <!-- window.LINES, written by the pipeline; never edit or redefine -->
```

Fonts come from `reel/assets/` with @font-face exactly as the template does. Never load fonts from the web.

- `const M = window.MOUTHS || {};` and `const LINES = window.LINES;` Each line is `[id, say, emotion, speaker]` (speaker `"maya"` or `"floey"`), sometimes with a 5th field: the caption to show instead of the spoken words.
- Timing: `const { B, DUR: SPOKEN } = DUO.timing(LINES, M, GAP)` with a GAP per line (the pause after it). Then `END = SPOKEN + 0.6`, `DUR = END + 1.6` for the end card. If the button has silent acting after the last line (a look to camera, a sip, a relapse click), push END later so it plays out before the end card (up to about 3 seconds).
- The cast, in this order: `const F = FLOEY.create({ ...DUO.SPOT.floeyLaptop, facing: -1, perched: true, view: "side", mood })`, then `const MY = MAYA.create({ ...DUO.SPOT.maya, expr, pose, floey: F })`. `floey: F` sends Maya's voice cues into Floey's sound list so the mixer hears both.
- Every line is spoken by its speaker at its own time: `MY.say(B[id].start, M[id] || [], id)` for Maya's lines, `F.say(B[id].start, M[id] || [], id)` for Floey's.
- World state (camera `camX, camY, zoom` and prop values) in one object `W`, animated by one paused gsap timeline `wt`.
- `window.render = (t) => {...}`: `wt.seek(Math.min(DUR, t), false)`, then `DUO.cam(world, W)` + screen-space parts (inserts, notification) + `DUO.captions(LINES, B, t)` (hide once the end card is up) + `DUO.endCard(W.end, t)`. Pure function of t: no Date, no Math.random, no requestAnimationFrame.
- Also set `window.DURATION = DUR; window.SOUND = () => ({ ...F.sound(DUR), style: "duo", musicFile: "assets/music/mk162.mp3" }); window.CAMERA = (t) => {...}; window.FLOEY = F; window.BEATS = B; window.STYLE = "duo";` and finish with `window.render(0); document.fonts.ready.then(() => window.render(0));`.

World draw order: `DUO.room(t, { night })`, Maya (`MY.svg(t)`), `DUO.deskFront()`, `DUO.laptop()` (and `DUO.mug()` if used), Floey (`F.svg(t)`), then world props (stats, marks).

## The cast and their controls

**Maya** (`brand/cast/maya.js`, `MAYA.create`): waist up behind the desk.
| call | what it does |
|---|---|
| `MY.expr(t, e)` | face: neutral, happy, proud, panic, worried, annoyed, smug, surprised, think, deadpan, sad |
| `MY.pose(t, p, d)` | arms, blended over d seconds: rest, type (hands move), facepalm, panic (hands up by her head), cheeks (hands on cheeks), point (to screen right), pointL (to screen left, at Floey on the laptop), shrug, chin (thinking), wave, phone (on a call), mug (holding coffee), crossed, fist (a small "yes!") |
| `MY.look(t, x, y)` | eyes: x -1 left (towards Floey on the laptop) .. 1 right, y -1 up .. 1 down (at the laptop) |
| `MY.jolt(t)` | a startled jump with a pop sound |
| `MY.nod(t, n)`, `MY.tiltTo(t, deg)`, `MY.leanTo(t, deg)`, `MY.slump(t)` / `MY.sit(t)` | head and body acting |
| `MY.say(t, mouth, id)` | lip sync to her line |

She blinks, breathes and moves her head while talking on her own. Her pencil bun wobbles.

**Floey** (`brand/mascot/floey.js`, see brand/studio/README.md for every behaviour): in this room she mostly perches (on the laptop, the mug, Maya's shoulder) and turns, tilts, winks, chips, preens, sips from the mug, or takes off and hovers by Maya's head. `F.pivot(t, "front")` to talk to the viewer on a button line; `F.mood(t, m)`: hello, happy, worried, think, surprised, determined, sad, party.

## Places and shots (`DUO.SPOT`, `DUO.SHOT`)

| spot | where |
|---|---|
| `maya` | behind the desk (always) |
| `floeyLaptop` | perched on the laptop lid, facing Maya (`facing: -1`) |
| `floeyHover` | hovering at Maya's eye height on her left |
| `floeyShoulder` | perched on Maya's left shoulder (screen right) |
| `floeyMug` | perched on the mug rim at the desk's right end (draw `DUO.mug()`) |

| shot | use |
|---|---|
| `wide` | the two-shot: who is where, reactions of both |
| `maya` | Maya talking or reacting (Floey is fully out of frame) |
| `mayaTight` | her face fills the frame: the panic, the realisation, the look to camera |
| `floey` | a closer two-shot favouring Floey: her reframe or tip |
| `floeyTight` | Floey alone on the laptop: a deadpan line |

Move between shots with `wt.to(W, { ...DUO.SHOT.x, duration: 0.5 to 0.8, ease: "power3.inOut" }, t)`. A shot may be nudged, but check that nobody is sliced at the frame edge.

## Props and inserts

| part | what it draws |
|---|---|
| `DUO.room(t, { night })` | Maya's room: window (day sky with a drifting cloud, or night with moon and stars plus a desk-lamp glow), shelf, plant, spark poster, desk top |
| `DUO.deskFront()`, `DUO.laptop(x)`, `DUO.mug(x)` | the desk, the back of her laptop (spark sticker), a mug. While Maya's pose is `mug` (the mug in her hand) do not draw `DUO.mug()`: one mug only. |
| `DUO.stat(x, y, k, text, tone)` | a number pill in the room, near her head (x about 880, y about 610): "-40%" bad, "+3%" good. Fade it out before a shot that would push it off the frame. |
| `DUO.mark(kind, x, y, k, t)` | comic marks by a head: "!", "?", "sweat", "zzz" |
| `DUO.screenInsert(k, draw, { title, points, tone, label })` | a cutaway to what is on her laptop: a chart that draws itself (points 0..1). Screen space, outside DUO.cam. Use it for the check moment ("compare it with last Sunday"). |
| `DUO.listInsert(k, rowsK, { title, sub, cols, rows: [{ label, value, tone, hi }], hiK })` | a cutaway to a ranked list or report table on her screen: a chatbot's answer, Search Console pages, GA4 traffic sources. Rows slide in with rowsK; the one row that matters (`hi`) gets a ring that grows with hiK. Up to 6 rows. Use it instead of drawing your own cards: every row has a real label and value, nothing on it is left blank. |
| `DUO.notification(k, from, text, y)` | a phone notification sliding down (screen space): the client's message, a Google alert. Great in a hook. Keep `text` under about 34 characters. |
| `DUO.captions(LINES, B, t)` | speaker-tagged captions (MAYA amber, FLOEY pink) at y 1540 |
| `DUO.endCard(k, t, line)` | the Flowra logo, "Maya & Floey, every day" (or another short line), Floey perched in front |

Sounds go through Floey's cue list: `F.sfx(t, kind, extra)`. Kinds that fit this room: pop, boing (comic), whoosh (an insert swings in), ding (a notification, a good number), buzz (phone vibrates), typing (`{ d: seconds }`), click, tick, rise (before the payoff), thump (the end card), plus Floey's own (chip, tk, swish, flutter, sip). One per real event, never more than one every 0.4 seconds. The music bed and the mix are added for you.

## Hard rules

- **Frame one is the problem, already happening**: Maya mid-panic with the red number up, the notification already on screen, the chart already falling. Never an empty room, a title or Floey flying in first.
- **They talk to each other, not to the viewer.** Floey may turn to camera for the final button line, and Maya may give the camera a look (no words). Nobody explains Flowra; the brand is the end card.
- **Every line is acted by its speaker while the other one reacts.** The listener is never frozen: a look, an expression change, a small move on the other's key word. Cut or push to the speaker on a speaker change when it helps, and to the listener's face for the punchline reaction.
- **A change every 2 to 3 seconds**: a shot change, a pose, a prop, an insert.
- **The face matches the line, every frame**: set Maya's expression at the start of each of her lines to that line's feeling (a worried line is never said with a grin), and change it again on the next line. The final test samples frames, so a face left over from the last line fails it.
- **Inserts are complete**: use `DUO.screenInsert` and `DUO.listInsert`, never a half-drawn card; a number the voice says is on screen beside the thing it belongs to.
- **Show the tip happening**: if Floey says compare, Maya types and the insert shows the comparison.
- **Inside the safe area**: subjects and props inside x 60 to 1020 and y 220 to 1420 on screen; captions own 1440 to 1580; Instagram covers the top 200 px and the bottom 340 px.
- **Text never overflows its box and never overlaps other text.** Measure with `PROPS.measure` (it waits for the fonts).
- **No em dashes or en dashes anywhere.**
