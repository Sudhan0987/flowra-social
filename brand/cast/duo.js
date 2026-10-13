// The duo studio: the sets, props, captions and end card of the Maya & Floey
// reels (brand/styles/duo/README.md). A scene builds the cast (FLOEY.create,
// MAYA.create with floey: F so both voices reach the mixer), cues them to the
// lines, and draws DUO parts inside DUO.cam(). Every part is a pure function
// of its arguments, so a frame depends only on t.
//
// Needs gsap, hum.js, floey.js, brand/studio/props.js and maya.js loaded first.
(function () {
  const HC = HUM.colors, MC = MAYA.colors, INK = HC.ink;
  const esc = PROPS.esc, measure = PROPS.measure;
  const LIB = window.FLOEY; // kept: a scene later sets window.FLOEY to its Floey actor
  const f = (n) => Math.round(n * 10) / 10;

  // where the cast stands in Maya's room (world units; the frame is 1080 x 1920)
  const SPOT = {
    maya: { x: 640, y: 1478, scale: 1.3 },               // behind the desk, waist hidden by it
    floeyLaptop: { x: 300, y: 1028, scale: 0.95 },        // perched on the laptop lid, facing Maya (facing -1)
    floeyHover: { x: 330, y: 760, scale: 0.95 },          // hovering at Maya's eye height, left of her
    floeyShoulder: { x: 795, y: 1092, scale: 0.75 },      // perched on Maya's left shoulder (screen right)
    floeyMug: { x: 900, y: 1268, scale: 0.7 },            // perched on the mug rim at the desk's right end
  };
  // camera framings that work in this room: { camX, camY, zoom }
  const SHOT = {
    wide: { camX: 560, camY: 1010, zoom: 1.12 },          // the two-shot: both, the desk, the window
    maya: { camX: 720, camY: 820, zoom: 1.55 },           // medium close on Maya (Floey fully out of frame)
    mayaTight: { camX: 640, camY: 760, zoom: 2.1 },       // her face fills the frame (a reaction)
    floey: { camX: 470, camY: 1000, zoom: 1.3 },          // a closer two-shot favouring Floey: both faces fully in frame
    floeyTight: { camX: 200, camY: 1040, zoom: 2.0 },     // Floey alone on the laptop (a deadpan line); Maya's ear at most at the right edge
  };

  const timing = (lines, mouths, gap, opts = {}) => PROPS.timing(lines, mouths, gap, { lead: 0.3, tail: 0.2, ...opts });
  const cam = (inner, W) => `<g transform="translate(540 960) scale(${f(W.zoom)}) translate(${f(-W.camX)} ${f(-W.camY)})">${inner}</g>`;

  // ---------- Maya's room ----------
  // opts: { night } (dark window, moon, desk lamp glow); the cloud drifts with t
  function room(t, opts = {}) {
    const night = !!opts.night;
    let s = `<rect x="-600" y="-400" width="2280" height="2800" fill="${night ? "#d9cfe6" : "#efe6f3"}"/>`;
    s += `<rect x="640" y="330" width="360" height="430" rx="18" fill="${night ? "#2d3170" : "#cfe7ff"}" stroke="${INK}" stroke-width="7"/>`;
    if (night) {
      s += `<circle cx="920" cy="410" r="34" fill="#fff6c8"/><circle cx="906" cy="402" r="34" fill="#2d3170"/>`;
      for (let i = 0; i < 7; i++) s += `<circle cx="${670 + ((i * 97) % 300)}" cy="${360 + ((i * 53) % 160)}" r="${2 + (i % 3)}" fill="#fff" opacity="${0.5 + 0.4 * Math.sin(t * 2 + i)}"/>`;
    } else {
      const cx = 700 + ((t * 12) % 300);
      s += `<g opacity=".9"><ellipse cx="${f(cx)}" cy="460" rx="70" ry="26" fill="#fff"/><ellipse cx="${f(cx + 40)}" cy="444" rx="44" ry="26" fill="#fff"/></g>`;
    }
    s += `<path d="M820,330 V760 M640,545 H1000" stroke="${INK}" stroke-width="7"/>`;
    // shelf: books and a plant
    s += `<rect x="70" y="520" width="380" height="18" rx="6" fill="#b98a5e" stroke="${INK}" stroke-width="6"/>`;
    s += `<rect x="96" y="430" width="34" height="90" rx="5" fill="${HC.violet}" stroke="${INK}" stroke-width="5"/><rect x="134" y="446" width="30" height="74" rx="5" fill="${HC.coral}" stroke="${INK}" stroke-width="5"/><rect x="168" y="420" width="36" height="100" rx="5" fill="${HC.amber}" stroke="${INK}" stroke-width="5"/>`;
    const sway = Math.sin(t * 1.4) * 3;
    s += `<g transform="rotate(${f(sway)} 340 452)"><path d="M330,452 q-40,-60 -10,-110 M340,452 q10,-70 50,-96 M336,452 q-60,-30 -80,-70" fill="none" stroke="#5f9e5a" stroke-width="12" stroke-linecap="round"/></g><path d="M300,452 h80 l-10,68 h-60Z" fill="${HC.coral}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
    // the framed spark poster
    s += `<rect x="470" y="300" width="130" height="160" rx="10" fill="#fffaf2" stroke="${INK}" stroke-width="6"/>${HUM.spark(535, 380, 38, HC.magenta)}`;
    if (night) s += `<radialGradient id="lampglow"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient><circle cx="980" cy="1200" r="420" fill="url(#lampglow)"/>`;
    // the desk top surface, behind her hands
    s += `<path d="M-200,1372 L1280,1372 L1280,1410 L-200,1410Z" fill="#d7a873" stroke="${INK}" stroke-width="7"/>`;
    return s;
  }
  const deskFront = () => `<rect x="-200" y="1406" width="1480" height="900" fill="#c28e5a" stroke="${INK}" stroke-width="7"/><path d="M-200,1470 H1280" stroke="${INK}" stroke-width="4" opacity=".2"/>`;
  // the back of her open laptop, facing us, with a spark sticker
  const laptop = (x = 305) => `<path d="M${x - 155},1086 L${x + 155},1086 L${x + 173},1376 L${x - 173},1376Z" fill="#c9cbe0" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>${HUM.spark(x, 1230, 46, HC.coral)}<rect x="${x - 201}" y="1372" width="400" height="22" rx="8" fill="#a8abc6" stroke="${INK}" stroke-width="6"/>`;
  // a coffee mug on the desk (Floey can perch on it: SPOT.floeyMug)
  const mug = (x = 900) => `<g transform="translate(${x} 1290)"><path d="M40,22 q34,0 34,30 q0,30 -34,30" fill="none" stroke="${INK}" stroke-width="10"/><rect x="-44" y="0" width="88" height="96" rx="12" fill="#fffaf2" stroke="${INK}" stroke-width="7"/><path d="M-40,30 h80" stroke="${HC.violet}" stroke-width="12"/></g>`;

  // ---------- inserts (full-frame cutaways, drawn in screen space, outside the camera) ----------
  // what is on her laptop screen: a line chart that draws itself. k 0..1 swings the insert in,
  // draw 0..1 draws the line; opts { title, points: [0..1], color, label, tone }
  function screenInsert(k, draw, opts = {}) {
    if (k <= 0.01) return "";
    const pts = opts.points || [0.7, 0.72, 0.68, 0.7, 0.5, 0.38, 0.3];
    const x0 = 150, x1 = 930, y0 = 760, y1 = 1180, n = pts.length;
    const P = pts.map((v, i) => [x0 + (x1 - x0) * i / (n - 1), y1 - (y1 - y0) * v]);
    const m = Math.max(1, Math.round(draw * (n - 1) * 100) / 100);
    const shown = []; for (let i = 0; i <= Math.floor(m); i++) shown.push(P[i]);
    if (m % 1 && P[Math.ceil(m)]) { const a = P[Math.floor(m)], b = P[Math.ceil(m)], u = m % 1; shown.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]); }
    const col = opts.color || (opts.tone === "good" ? "#2f9e62" : "#d24b4b");
    const line = shown.map((p, i) => `${i ? "L" : "M"}${f(p[0])},${f(p[1])}`).join(" ");
    const area = `${line} L${f(shown[shown.length - 1][0])},${y1} L${x0},${y1}Z`;
    const title = opts.title || "Clicks";
    const ty = 1920 * (1 - k) * 0.6;
    let s = `<g transform="translate(0 ${f(ty)})" opacity="${Math.min(1, k * 2)}"><rect width="1080" height="1920" fill="#2d2f45" opacity=".55"/>`;
    s += `<rect x="90" y="560" width="900" height="760" rx="30" fill="#fffaf2" stroke="${INK}" stroke-width="8"/><rect x="90" y="560" width="900" height="84" rx="30" fill="#e9e3f3" stroke="${INK}" stroke-width="8"/>`;
    s += `<circle cx="140" cy="602" r="12" fill="${HC.coral}"/><circle cx="178" cy="602" r="12" fill="${HC.amber}"/><circle cx="216" cy="602" r="12" fill="#7cc48a"/>`;
    s += `<text x="150" y="718" font-family="Space Grotesk" font-weight="700" font-size="46" fill="${INK}">${esc(title)}</text>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${x0},${y0 + i * (y1 - y0) / 3} H${x1}" stroke="${INK}" stroke-width="2" opacity=".12"/>`;
    s += `<path d="${area}" fill="${col}" opacity=".14"/><path d="${line}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`;
    const e = shown[shown.length - 1]; s += `<circle cx="${f(e[0])}" cy="${f(e[1])}" r="14" fill="${col}" stroke="${INK}" stroke-width="5"/>`;
    if (opts.label && draw > 0.85) {
      const w = measure(opts.label, "700 44px 'Space Grotesk'") + 48;
      s += `<rect x="${f(930 - w)}" y="1222" width="${f(w)}" height="70" rx="20" fill="${col}" stroke="${INK}" stroke-width="5"/><text x="${f(930 - w / 2)}" y="1271" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="44" fill="#fff">${esc(opts.label)}</text>`;
    }
    return s + `</g>`;
  }

  // a phone notification card sliding down (screen space): from = who sent it, text = the message (max ~40 chars)
  function notification(k, from, text, y = 420) {
    if (k <= 0.01) return "";
    const fs = 40, w = Math.min(940, Math.max(measure(text, `600 ${fs}px 'Public Sans'`), measure(from, "700 34px 'Space Grotesk'")) + 170);
    const dy = (1 - Math.min(1, k)) * -260;
    return `<g transform="translate(${f(540 - w / 2)} ${f(y + dy)})" opacity="${Math.min(1, k * 2)}"><rect x="0" y="0" width="${f(w)}" height="150" rx="34" fill="#fffaf2" stroke="${INK}" stroke-width="6"/>
<rect x="28" y="33" width="84" height="84" rx="22" fill="${HC.violet}" stroke="${INK}" stroke-width="5"/><text x="70" y="91" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="44" fill="#fff">${esc(from[0] || "?")}</text>
<text x="138" y="66" font-family="Space Grotesk" font-weight="700" font-size="34" fill="${INK}">${esc(from)}</text><text x="138" y="118" font-family="Public Sans" font-weight="600" font-size="${fs}" fill="${INK}">${esc(text)}</text></g>`;
  }

  // a number or short word pill in the world (k 0..1 pops it): tone good | bad | warn | brand | ink
  function stat(x, y, k, text, tone = "bad") {
    if (k <= 0.01) return "";
    const col = { good: "#2f9e62", bad: "#d24b4b", warn: "#e08a1e", brand: HC.magenta, ink: INK }[tone] || tone;
    const w = measure(text, "700 54px 'Space Grotesk'") + 64;
    return `<g transform="translate(${x} ${y}) scale(${f(0.6 + 0.4 * Math.min(1, k))})" opacity="${Math.min(1, k * 1.5)}"><rect x="${f(-w / 2)}" y="-48" width="${f(w)}" height="96" rx="26" fill="${col}" stroke="${INK}" stroke-width="6"/><text x="0" y="18" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="54" fill="#fff">${esc(text)}</text></g>`;
  }

  // little comic marks near a head (world space): "sweat" drops, "!" , "?" , "zzz"
  function mark(kind, x, y, k, t = 0) {
    if (k <= 0.01) return "";
    const o = `opacity="${Math.min(1, k * 2)}"`;
    if (kind === "!") return `<g ${o} transform="translate(${x} ${y - k * 20}) rotate(10)"><text x="0" y="0" font-family="Space Grotesk" font-weight="700" font-size="110" fill="#d24b4b" stroke="${INK}" stroke-width="5" paint-order="stroke">!</text></g>`;
    if (kind === "?") return `<g ${o} transform="translate(${x} ${y - k * 20}) rotate(-8)"><text x="0" y="0" font-family="Space Grotesk" font-weight="700" font-size="100" fill="${HC.violet}" stroke="${INK}" stroke-width="5" paint-order="stroke">?</text></g>`;
    if (kind === "sweat") return `<g ${o}>${[0, 1, 2].map((i) => `<path d="M${x + i * 34},${y + ((t * 60 + i * 20) % 50)} q-12,18 0,26 q12,-8 0,-26Z" fill="#8fd0ff" stroke="${INK}" stroke-width="4"/>`).join("")}</g>`;
    if (kind === "zzz") return `<g ${o}>${[0, 1, 2].map((i) => `<text x="${x + i * 30}" y="${y - i * 36 - ((t * 20) % 20)}" font-family="Space Grotesk" font-weight="700" font-size="${40 + i * 10}" fill="${HC.indigo}">z</text>`).join("")}</g>`;
    return "";
  }

  // captions with the speaker's name tag (MAYA amber, FLOEY pink), 3 or 4 words at a time.
  // A line is [id, say, emotion, speaker] or [id, say, emotion, speaker, caption]; the caption replaces the spoken words on screen.
  function captions(lines, B, t, y = 1540) {
    for (const [id, text, , who, shown] of lines) {
      const bt = B[id]; if (!bt || t < bt.start - 0.05 || t > bt.end + 0.2) continue;
      // chunks of at most 4 words and about 22 characters, so a chunk always fits one line
      const words = (shown || text).split(" "), chunks = [];
      let cur0 = [];
      for (const w0 of words) {
        if (cur0.length && (cur0.length >= 4 || (cur0.join(" ") + " " + w0).length > 22)) { chunks.push(cur0.join(" ")); cur0 = []; }
        cur0.push(w0);
      }
      if (cur0.length) chunks.push(cur0.join(" "));
      const total = chunks.reduce((a, c) => a + c.length, 0); let acc = 0, cur = chunks[chunks.length - 1];
      for (const c of chunks) { acc += c.length; if (t < bt.start + (acc / total) * bt.len) { cur = c; break; } }
      const maya = who === "maya", col = maya ? MC.hoodie : HC.magenta, name = maya ? "MAYA" : "FLOEY", nameInk = maya ? INK : "#fff";
      let fs = 52, w = measure(cur, `800 ${fs}px 'Public Sans'`) + 72; if (w > 960) { fs = 52 * 888 / (w - 72); w = 960; }
      const nw = measure(name, "700 26px 'Space Grotesk'") + 30;
      return `<g transform="translate(540 ${y})"><rect x="${f(-w / 2)}" y="-54" width="${f(w)}" height="92" rx="24" fill="${INK}" opacity=".9"/><text x="0" y="13" text-anchor="middle" font-family="Public Sans" font-weight="800" font-size="${f(fs)}" fill="#fff">${esc(cur)}</text>
<rect x="${f(-w / 2 + 18)}" y="-84" width="${f(nw)}" height="40" rx="12" fill="${col}" stroke="${INK}" stroke-width="4"/><text x="${f(-w / 2 + 18 + nw / 2)}" y="-55" text-anchor="middle" font-family="Space Grotesk" font-weight="700" font-size="26" fill="${nameInk}">${name}</text></g>`;
    }
    return "";
  }

  // the end card: the Flowra logo, the series line, Floey perched in front (she faces the camera)
  function endCard(k, t, line = "Maya & Floey, every day") {
    if (k <= 0.01) return "";
    const tw = measure("Flowra", "700 96px 'Space Grotesk'"), lw = 120 + tw;
    let s = `<g opacity="${f(Math.min(1, k * 1.4))}"><rect width="1080" height="1920" fill="#fffaf2" opacity="${f(0.97 * Math.min(1, k))}"/>`;
    s += `<g transform="translate(540 820) scale(${f(0.85 + 0.15 * Math.min(1, k))})">${HUM.spark(-lw / 2 + 50, -10, 60, HC.coral)}<text x="${f(-lw / 2 + 120)}" y="22" font-family="Space Grotesk" font-weight="700" font-size="96" fill="${INK}">Flowra</text>`;
    s += `<text x="0" y="120" text-anchor="middle" font-family="Public Sans" font-weight="800" font-size="40" fill="${HC.magenta}">${esc(line)}</text></g>`;
    if (k > 0.6) s += LIB.create({ x: 540, y: 1150, facing: 1, scale: 1.1, mood: "happy", perched: true, view: "front" }).svg(t);
    return s + `</g>`;
  }

  window.DUO = { SPOT, SHOT, timing, cam, room, deskFront, laptop, mug, screenInsert, notification, stat, mark, captions, endCard };
})();
