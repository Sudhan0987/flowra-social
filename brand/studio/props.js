// Floey's prop room: the approved, hand-tuned pieces every reel draws with.
// Taken from reel 000 ("meet Floey", approved 2026-10-01) and made reusable,
// so a new reel starts from finished parts instead of drawing them again.
//
// Load after hum.js (it uses HUM.colors and HUM.spark). Everything is a pure
// function of its arguments and returns an SVG string in world units
// (1080 x 1920 frame; the garden's ground is at y 1720).
//
//   PROPS.timing(LINES, MOUTHS, GAP)   beat start/end from the spoken lines
//   PROPS.head(flower, bloom)          where a page-flower's head is
//   PROPS.bug(t, k, mark)              the 404 bug (any short mark: "404", "500")
//   PROPS.bugOn(flower, t)             a bug wandering over a flower's page
//   PROPS.tag(x, y, k, text, bg)       a pill label that pops on (k 0..1)
//   PROPS.reviewCard(k, opts)          the "changes to review" card + Publish button
//   PROPS.calendar(k, x, y, label)     a day counter (k 0..1 runs day 1 to days)
//   PROPS.chart(k, x, y, opts)         a small line chart that draws in (k 0..1)
//   PROPS.rankLine(y, label)           the dashed "PAGE 1" line across the garden
//   PROPS.sparks(t, x, y, at, n, size) a burst of brand sparks at time `at`
//   PROPS.captions(LINES, B, t)        burned-in captions, 3 or 4 words at a time
//   PROPS.endCard(k, url, sub)         the address card (measured, never overflows)
//   PROPS.measure(text, font)          text width in px, for sizing boxes
//
// UI chrome — for a reel that walks through a real screen (Flowra's own, or a
// tool like Search Console). Build the screen from these, in this ink/paper
// style, never as a literal screenshot (see brand/studio/README.md):
//
//   PROPS.panel(k, x, y, w, h, opts)      a window of paper to hold other props
//   PROPS.panelBody(x, y, w, h, opts)     the content rect inside a panel
//   PROPS.tabs(k, x, y, w, labels, i)     a tab row; the active one is underlined
//   PROPS.dropdown(k, x, y, label)        an outline control pill with a chevron
//   PROPS.table(k, x, y, w, rows)         up to 4 rows of {label, diff}
//   PROPS.badge(k, x, y, text, tone)      a status pill: good | warn | critical | neutral
//   PROPS.button(k, x, y, label, tone)    a filled pill button (tone: ink | good)
//   PROPS.bars(k, x, y, w, h, data)       up to 5 categorical bars, rounded ends
//   PROPS.cursor(k, x, y)                 a tap ring, to land Floey's reach on a control
//   PROPS.series / PROPS.seriesColor(i)   the fixed categorical hue order
//   PROPS.good / PROPS.bad / PROPS.warn   the reserved status colours
(function () {
  const C = HUM.colors;
  const INK = C.ink, FONT = "Space Grotesk", CAP = "Public Sans";
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  const measure = (() => {
    let ctx; const cache = {};
    return (txt, font) => {
      ctx ??= document.createElement("canvas").getContext("2d");
      return (cache[font + txt] ??= (ctx.font = font, ctx.measureText(txt).width));
    };
  })();

  // beat timing comes from the spoken lines: B[id] = { start, len, end }
  function timing(lines, mouths = {}, gap = {}, opts = {}) {
    const fps = opts.fps ?? 30, B = {}; let t = opts.lead ?? 0.35;
    for (const [id] of lines) {
      const len = (mouths[id] || []).length / fps || opts.fallback || 2.5;
      B[id] = { start: t, len, end: t + len };
      t += len + (gap[id] ?? 0.45);
    }
    return { B, DUR: t + (opts.tail ?? 0.5) };
  }

  // a flower's head: bloom 1 stands straight, 0 droops 26 degrees toward f.dir
  const head = (f, b) => { const d = (1 - b) * 26 * (f.dir || 1), a = d * Math.PI / 180; return { x: f.x + Math.sin(a) * f.h, y: f.base - Math.cos(a) * f.h, a: d }; };

  function bug(t, k = 1, mark = "404") {
    const w = Math.sin(t * 22), legs = [-14, 0, 14].map((x, i) => [-1, 1].map((sd) => `<path d="M${x},${sd * 18} q${4 + (i - 1) * 6},${sd * 12} ${(i - 1) * 10 + w * 4 * sd},${sd * 24}" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`).join("")).join("");
    const flap = 0.6 + Math.abs(Math.sin(t * 40)) * 0.4;
    return `<g transform="scale(${k})">${legs}
      <ellipse cx="6" cy="-14" rx="${18 * flap}" ry="10" fill="#e9f3ff" opacity=".7" stroke="${INK}" stroke-width="2.5" transform="rotate(-25 6 -14)"/>
      <ellipse cx="6" cy="14" rx="${18 * flap}" ry="10" fill="#e9f3ff" opacity=".7" stroke="${INK}" stroke-width="2.5" transform="rotate(25 6 14)"/>
      <ellipse cx="4" cy="0" rx="30" ry="24" fill="#d24b4b" stroke="${INK}" stroke-width="4.5"/>
      ${mark ? `<text x="5" y="7" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${mark.length > 3 ? 15 : 19}" fill="#fff">${esc(mark)}</text>` : ""}
      <circle cx="-30" cy="0" r="12" fill="${INK}"/><circle cx="-34" cy="-4" r="3.2" fill="#fff"/><circle cx="-34" cy="5" r="3.2" fill="#fff"/>
      <path d="M-38,-8 q-10,-14 -4,-24 M-38,8 q-12,10 -8,22" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  }
  // a bug wandering over a flower's page (follows the page as it leans)
  const bugOn = (f, t, bloom = 0) => { const h = head(f, bloom), a = h.a * Math.PI / 180, ox = Math.sin(t * 0.8) * 26, oy = -20 + Math.cos(t * 0.55) * 22; return { x: h.x + Math.cos(a) * ox - Math.sin(a) * oy, y: h.y + Math.sin(a) * ox + Math.cos(a) * oy, a: h.a + Math.sin(t * 0.8) * 25 }; };

  // a pill label; the box is measured to its text
  function tag(x, y, k, text, bg = "#d24b4b") {
    if (k <= 0) return "";
    const w = Math.max(148, measure(text, `700 32px '${FONT}'`) + 56);
    return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="${-w / 2}" y="-30" width="${w}" height="60" rx="30" fill="${bg}" stroke="${INK}" stroke-width="5"/><text x="0" y="12" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="32" fill="#fff">${esc(text)}</text></g>`;
  }

  // the change preview: rows of removed / added / kept lines and a Publish button
  function reviewCard(k, o = {}) {
    if (k <= 0.01) return "";
    const cx = o.x ?? 540, cy = o.y ?? 520, pub = o.published ?? 0;
    const title = o.title ?? "Changes to review", idle = o.button ?? "Publish to WordPress", done = o.done ?? "Live on WordPress  ✓";
    const rows = o.rows ?? [["del", 300], ["add", 380], ["keep", 340], ["add", 260]];
    const x0 = cx - 290, y0 = cy - 220, by = y0 + 320;
    let s = `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})"><rect x="${x0}" y="${y0}" width="580" height="420" rx="32" fill="#fffaf2" stroke="${INK}" stroke-width="7"/>`;
    s += `<text x="${x0 + 40}" y="${y0 + 70}" font-family="${FONT}" font-weight="700" font-size="38" fill="${INK}">${esc(title)}</text>`;
    rows.forEach(([kind, w], i) => {
      const y = y0 + 104 + i * 46, col = kind === "del" ? "#f1c6c6" : kind === "add" ? "#c8ebd3" : "#e9e2d6";
      s += `<rect x="${x0 + 40}" y="${y}" width="${w}" height="26" rx="13" fill="${col}"/>`;
      if (kind === "del") s += `<path d="M${x0 + 40},${y + 13} h${w}" stroke="#d24b4b" stroke-width="4"/>`;
      if (kind === "add") s += `<text x="${x0 + 50 + w}" y="${y + 23}" font-family="${FONT}" font-weight="700" font-size="26" fill="#2f9e62">+</text>`;
    });
    const label = pub > 0.5 ? done : idle, fs = Math.min(32, 32 * 440 / Math.max(1, measure(label, `700 32px '${FONT}'`)));
    s += `<rect x="${x0 + 40}" y="${by - 34}" width="500" height="68" rx="34" fill="${pub > 0.5 ? "#2f9e62" : INK}"/><text x="${cx}" y="${by + 12}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="${fs.toFixed(1)}" fill="#fff">${esc(label)}</text>`;
    return s + `</g>`;
  }
  // where the review card's button is, for Floey to tap
  const reviewButton = (o = {}) => ({ x: (o.x ?? 540) + 236, y: (o.y ?? 520) + 100 });

  // a day counter: k 0..1 runs from day 1 to `days`
  function calendar(k, x = 160, y = 330, days = 14, label = "DAY") {
    if (k <= 0.01) return "";
    const day = Math.max(1, Math.round(1 + (days - 1) * Math.min(1, k)));
    return `<g opacity="${Math.min(1, k * 3)}"><rect x="${x}" y="${y}" width="330" height="330" rx="28" fill="#fffaf2" stroke="${INK}" stroke-width="7"/><rect x="${x}" y="${y}" width="330" height="80" rx="28" fill="${C.coral}"/><rect x="${x}" y="${y + 50}" width="330" height="30" fill="${C.coral}"/>
      <text x="${x + 165}" y="${y + 55}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="34" fill="#fff">${esc(label)}</text><text x="${x + 165}" y="${y + 260}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="150" fill="${INK}">${day}</text></g>`;
  }

  // a small line chart that draws in. points are 0..1 values, left to right.
  // opts: { title, points, color, markAt (0..1 position of a dashed "change" line) }
  function chart(k, x = 530, y = 330, o = {}) {
    if (k <= 0.01) return "";
    const pts = o.points ?? [0.3, 0.33, 0.28, 0.31, 0.5, 0.7, 0.9], W = o.w ?? 420, H = o.h ?? 330;
    const px = (i) => x + 30 + (i / (pts.length - 1)) * (W - 60), py = (v) => y + H - 40 - v * (H - 110);
    const n = Math.max(2, Math.ceil(pts.length * Math.min(1, k)));
    let s = `<g opacity="${Math.min(1, k * 4)}"><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="28" fill="#fffaf2" stroke="${INK}" stroke-width="7"/><text x="${x + 30}" y="${y + 55}" font-family="${FONT}" font-weight="700" font-size="30" fill="${INK}">${esc(o.title ?? "Clicks")}</text>`;
    if (o.markAt != null) s += `<path d="M${x + 30 + o.markAt * (W - 60)},${y + 40} v${H - 60}" stroke="${INK}" stroke-width="3" stroke-dasharray="8 8" opacity=".4"/>`;
    s += `<polyline points="${pts.slice(0, n).map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ")}" fill="none" stroke="${o.color ?? "#2f9e62"}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    return s;
  }

  // Reserved status colours: good/warn/critical never stand for anything but
  // that state. GOOD/BAD double as the diverging pair for any up/down number.
  const GOOD = "#2f9e62", BAD = "#d24b4b", WARN = C.amber;
  // Fixed categorical order for a multi-series chart or bar group — assign by
  // a series' position, never by its value, and never cycle past the end;
  // a 6th series folds into "other" instead of repeating a colour.
  const SERIES = [C.coral, C.indigo, C.amber, C.magenta, C.violet];
  const seriesColor = (i) => SERIES[i % SERIES.length];

  // --- UI chrome ------------------------------------------------------------
  // For walking through a real screen. Compose a scene from these the same
  // way the garden is composed from flowers: panel() for the window, then
  // tabs/dropdown/table/bars/badge/button placed inside it with panelBody()'s
  // rect as the guide. Never draw raw browser chrome or copy a real product's
  // exact layout — this is Floey's own paper-and-ink rendering of a screen.

  // a window of paper to hold other props; k 0..1 pops it on (scales in)
  function panel(k, x, y, w, h, o = {}) {
    if (k <= 0.01) return "";
    const title = o.title, accent = o.accent ?? C.coral, cx = x + w / 2, cy = y + h / 2;
    let s = `<g opacity="${Math.min(1, k * 4)}" transform="translate(${cx} ${cy}) scale(${0.96 + k * 0.04}) translate(${-cx} ${-cy})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="#fffaf2" stroke="${INK}" stroke-width="7"/>`;
    if (title) {
      s += `<rect x="${x}" y="${y}" width="${w}" height="76" rx="28" fill="${accent}"/><rect x="${x}" y="${y + 42}" width="${w}" height="34" fill="${accent}"/>`;
      s += `<text x="${x + 34}" y="${y + 50}" font-family="${FONT}" font-weight="700" font-size="30" fill="#fff">${esc(title)}</text>`;
    }
    return s + `</g>`;
  }
  // the content rect inside a panel, under its title bar if it has one
  const panelBody = (x, y, w, h, o = {}) => ({ x: x + 34, y: y + (o.title ? 76 : 24) + 20, w: w - 68, h: h - (o.title ? 76 : 24) - 44 });

  // a row of tab labels; the active one is bold ink with an underline
  function tabs(k, x, y, w, labels, active = 0, accent = C.coral) {
    if (k <= 0.01) return "";
    const cw = w / labels.length;
    let s = `<g opacity="${Math.min(1, k * 4)}">`;
    labels.forEach((label, i) => {
      const cx = x + cw * i + cw / 2, on = i === active, tw = measure(label, `700 26px '${FONT}'`);
      s += `<text x="${cx}" y="${y + 30}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="26" fill="${INK}" opacity="${on ? 1 : 0.4}">${esc(label)}</text>`;
      if (on) s += `<rect x="${cx - tw / 2}" y="${y + 44}" width="${tw}" height="6" rx="3" fill="${accent}"/>`;
    });
    return s + `</g>`;
  }

  // an outline control pill with a chevron — a filter or a setting, not a status badge.
  // the chevron sits a fixed gap past the text's own measured end, not off the
  // pill's half-width, so it never crowds a wide label.
  function dropdown(k, x, y, label) {
    if (k <= 0.01) return "";
    const tw = measure(label, `700 28px '${FONT}'`), padL = 32, gap = 40, chevW = 30;
    const w = padL + tw + gap + chevW + 30, x0 = -w / 2, chevCx = x0 + padL + tw + gap + chevW / 2;
    return `<g opacity="${Math.min(1, k * 4)}" transform="translate(${x} ${y})"><rect x="${x0}" y="-28" width="${w}" height="56" rx="28" fill="#fffaf2" stroke="${INK}" stroke-width="4.5"/><text x="${x0 + padL}" y="8" font-family="${FONT}" font-weight="700" font-size="28" fill="${INK}">${esc(label)}</text><path d="M${chevCx - 9},-6 l9,10 l9,-10" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }

  // up to 4 rows of {label, diff}; diff > 0 rises in GOOD, diff < 0 falls in
  // BAD — the one diverging pair, never a third colour for a third meaning.
  // k 0..1 lands the rows in one at a time.
  function table(k, x, y, w, rows) {
    if (k <= 0.01) return "";
    const rh = 64, n = rows.length;
    let s = "";
    rows.forEach((r, i) => {
      const op = Math.min(1, Math.max(0, k * n - i) * 3); if (op <= 0) return;
      const ry = y + i * rh;
      s += `<g opacity="${op}">`;
      if (i > 0) s += `<path d="M${x},${ry} H${x + w}" stroke="${INK}" stroke-width="2" opacity=".12"/>`;
      s += `<text x="${x}" y="${ry + rh / 2 + 10}" font-family="${FONT}" font-weight="700" font-size="28" fill="${INK}">${esc(r.label)}</text>`;
      if (r.diff != null) {
        const up = r.diff > 0, col = up ? GOOD : r.diff < 0 ? BAD : INK, text = (up ? "+" : "") + r.diff;
        const tw = measure(text, `700 28px '${FONT}'`);
        s += `<text x="${x + w}" y="${ry + rh / 2 + 10}" text-anchor="end" font-family="${FONT}" font-weight="700" font-size="28" fill="${col}">${esc(text)}</text>`;
        if (r.diff !== 0) s += `<path d="${up ? `M${x + w - tw - 40},${ry + rh / 2 + 6} l9,-11 l9,11` : `M${x + w - tw - 40},${ry + rh / 2 - 6} l9,11 l9,-11`}" stroke="${col}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
      s += `</g>`;
    });
    return s;
  }

  // a status pill: tone is good | warn | critical | neutral, fixed colours —
  // never reused for an unrelated category (use tag() for that instead)
  function badge(k, x, y, text, tone = "neutral") {
    if (k <= 0.01) return "";
    const bg = { good: GOOD, warn: WARN, critical: BAD, neutral: INK }[tone] ?? INK;
    const w = measure(text, `700 26px '${FONT}'`) + 44;
    return `<g opacity="${Math.min(1, k * 4)}" transform="translate(${x} ${y}) scale(${0.9 + k * 0.1})"><rect x="${-w / 2}" y="-24" width="${w}" height="48" rx="24" fill="${bg}"/><text x="0" y="9" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="26" fill="#fff">${esc(text)}</text></g>`;
  }

  // a filled pill button, centred at x,y — that point is also where Floey
  // should reach to tap it. tone: ink (default action) | good (confirmed)
  function button(k, x, y, label, tone = "ink") {
    if (k <= 0.01) return "";
    const bg = tone === "good" ? GOOD : INK, w = measure(label, `700 30px '${FONT}'`) + 72;
    return `<g opacity="${Math.min(1, k * 4)}" transform="translate(${x} ${y}) scale(${0.94 + k * 0.06})"><rect x="${-w / 2}" y="-34" width="${w}" height="68" rx="34" fill="${bg}"/><text x="0" y="11" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="30" fill="#fff">${esc(label)}</text></g>`;
  }

  // up to 5 categorical bars, rounded ends, baseline at y+h.
  // data: [{ label, value (0..1), color? }] — color falls back to seriesColor(i)
  function bars(k, x, y, w, h, data) {
    if (k <= 0.01) return "";
    const n = data.length, gap = 24, bw = (w - gap * (n - 1)) / n;
    let s = `<g opacity="${Math.min(1, k * 4)}">`;
    data.forEach((d, i) => {
      const bh = Math.max(8, d.value * h * Math.min(1, k * 2)), bx = x + i * (bw + gap), by = y + h - bh;
      s += `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="${bw / 2}" fill="${d.color ?? seriesColor(i)}"/>`;
      s += `<text x="${bx + bw / 2}" y="${y + h + 34}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="22" fill="${INK}" opacity=".7">${esc(d.label)}</text>`;
    });
    return s + `</g>`;
  }

  // a tap ring at a point, to land Floey's reach on a control (k 0..1, once)
  function cursor(k, x, y) {
    if (k <= 0.01) return "";
    const r = 16 + k * 20;
    return `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" fill="none" stroke="${INK}" stroke-width="4" opacity="${(1 - k) * 0.8}"/>`;
  }

  // the dashed line flowers must reach to be on page one
  const rankLine = (y = 930, label = "PAGE 1") => {
    const w = measure(label, `700 26px '${FONT}'`) + 40;
    return `<path d="M30,${y} H1050" stroke="${INK}" stroke-width="4" stroke-dasharray="14 12" opacity=".45"/><rect x="${515 - w / 2}" y="${y - 50}" width="${w}" height="40" rx="10" fill="${INK}" opacity=".85"/><text x="515" y="${y - 21}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="26" fill="#fff">${esc(label)}</text>`;
  };

  function sparks(t, x, y, at, n = 10, size = 28) {
    const k = (t - at) / 0.7; if (k < 0 || k > 1) return "";
    let s = ""; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + i, d = 40 + k * (120 + (i % 3) * 40); s += `<g opacity="${1 - k}">${HUM.spark(x + Math.cos(a) * d, y + Math.sin(a) * d, size * (1 - k * 0.5), [C.amber, C.coral, C.magenta, C.violet][i % 4])}</g>`; }
    return s;
  }

  // captions: the spoken line in chunks of 3 or 4 words, timed by length.
  // Drawn in screen space (outside the camera), centred at y 1515, inside the safe area.
  function captions(lines, B, t, y = 1515) {
    for (const [id, text, , shown] of lines) {
      const bt = B[id]; if (!bt || t < bt.start - 0.05 || t > bt.end + 0.25) continue;
      const chunks = [];
      for (const part of (shown ?? text).split(/(?<=[.,!?])\s+/).filter(Boolean)) {
        const words = part.split(" ");
        for (let i = 0; i < words.length;) { const left = words.length - i, n = left <= 4 ? left : left === 5 ? 2 : 3; chunks.push(words.slice(i, i + n).join(" ")); i += n; }
      }
      const total = chunks.reduce((a, c) => a + c.length, 0); let acc = 0, cur = chunks[chunks.length - 1];
      for (const c of chunks) { acc += c.length; if (t < bt.start + (acc / total) * bt.len) { cur = c; break; } }
      let fs = 50, w = measure(cur, `800 ${fs}px '${CAP}'`) + 70;
      if (w > 960) { fs = 50 * 890 / (w - 70); w = 960; }
      return `<g transform="translate(540 ${y})"><rect x="${-w / 2}" y="-52" width="${w}" height="88" rx="22" fill="${INK}" opacity=".88"/><text x="0" y="12" text-anchor="middle" font-family="${CAP}" font-weight="800" font-size="${fs.toFixed(1)}" fill="#fff">${esc(cur)}</text></g>`;
    }
    return "";
  }

  // the end card: spark + address, measured so it always fits
  function endCard(k, url = "useflowra.com", sub = "Start free", y = 300) {
    if (k <= 0) return "";
    const tw = measure(url, `700 70px '${FONT}'`), gap = 22, spark = 52, padX = 56;
    const w = spark + gap + tw + padX * 2, x0 = -w / 2;
    return `<g opacity="${k}" transform="translate(540 ${y}) scale(${0.9 + k * 0.1})"><rect x="${x0}" y="-82" width="${w}" height="176" rx="44" fill="#fffaf2" opacity=".96" stroke="${INK}" stroke-width="5"/>${HUM.spark(x0 + padX + spark / 2, -18, 26, C.coral)}<text x="${x0 + padX + spark + gap}" y="6" font-family="${FONT}" font-weight="700" font-size="70" fill="${INK}">${esc(url)}</text>${sub ? `<text x="0" y="62" text-anchor="middle" font-family="${FONT}" font-weight="600" font-size="32" fill="${C.magenta}">${esc(sub)}</text>` : ""}</g>`;
  }

  window.PROPS = {
    measure, timing, head, bug, bugOn, tag, reviewCard, reviewButton, calendar, chart, rankLine, sparks, captions, endCard, esc,
    panel, panelBody, tabs, dropdown, table, badge, button, bars, cursor,
    series: SERIES, seriesColor, good: GOOD, bad: BAD, warn: WARN,
  };
})();
