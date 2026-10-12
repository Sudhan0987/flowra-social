// The "pro" reel style: a clean product explainer in useflowra.com's colours
// (white, navy ink, cool hairlines, deep orange). The picture is a working
// screen in motion (a chart drawing, rows sorting, a cursor clicking, the
// camera pushing in on the one row that matters), with a short headline above
// it. No mascot in the story; Floey only perches on the logo in the end card.
//
// Every function returns an SVG string for one moment; k is a 0..1 progress
// the scene animates with its gsap timeline. Nothing here reads the clock.
//
//   PRO.bg(t)                                   white, faint grid, a slow wash of colour
//   PRO.cam(inner, {x, y, zoom, rot})           camera around the frame centre
//   PRO.screen(inner, k, dir)                   a whole screen swinging in (k 0..1) or out (k 1..2)
//   PRO.card(x, y, w, h, {title, k, tag})       a window card with a title bar
//   PRO.chart(x, y, w, h, {series, k, labels, mark, yTicks})   line chart that draws itself
//   PRO.table(x, y, w, {cols, rows, k, hi, hk, order, ok})      rows that slide in, highlight, re-sort
//   PRO.tabs(x, y, labels, active, k)            a tab row; the active tab is underlined
//   PRO.cursor(x, y, {click, k})                 pointer with a click ripple
//   PRO.ring(x, y, w, h, k, tone)                a highlight drawn around something
//   PRO.headline(text, {y, k, size, accent})     the line above the screen, words rising in
//   PRO.kicker(text, y, k)                       small label over the headline
//   PRO.counter(x, y, from, to, k, {size, prefix, suffix, tone, anchor})
//   PRO.pill(x, y, text, tone, k)                status pill: good | bad | warn | ink | brand
//   PRO.arrow(x1, y1, x2, y2, k, tone)           a hand-placed arrow drawing on
//   PRO.captions(LINES, B, t)                    burned-in captions, navy box, 3 or 4 words
//   PRO.endCard(k, t, url)                       logo with Floey perched, the address
//   PRO.sounds()                                 collects cues: say, sfx, sound(dur)
//   PRO.measure(text, font) / PRO.c / PRO.ease / PRO.p
(function () {
  const c = {
    white: "#ffffff", surface: "#f5f7fa", ink: "#0e1a2b", ink2: "#3a4757", muted: "#6b7787", line: "#e2e7ee",
    brand: "#c74c0a", brandSoft: "#fdebdf", good: "#15803d", goodSoft: "#dcfce7", bad: "#c2410c", badSoft: "#ffedd5",
    warn: "#b45309", clicks: "#3b6fe0", imps: "#6d4bc4", violet: "#7a5bc7", coral: "#ef6f53", amber: "#f2a93b",
  };
  const FONT = "Space Grotesk", BODY = "Public Sans", MONO = "IBM Plex Mono";
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const c01 = (v) => Math.max(0, Math.min(1, v));
  const p = (t, a, d) => c01((t - a) / d);
  const ease = {
    out: (x) => 1 - Math.pow(1 - c01(x), 3),
    io: (x) => { x = c01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    back: (x, s = 1.6) => { x = c01(x); return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2); },
  };
  const measure = (() => {
    let ctx; const cache = {};
    // widths measured before the web fonts load are the fallback font's, so they are never cached
    return (txt, font) => {
      ctx ??= document.createElement("canvas").getContext("2d");
      if (document.fonts && document.fonts.status !== "loaded") { ctx.font = font; return ctx.measureText(txt).width; }
      return (cache[font + txt] ??= (ctx.font = font, ctx.measureText(txt).width));
    };
  })();
  const tone = (t) => ({ good: [c.good, c.goodSoft], bad: [c.bad, c.badSoft], warn: [c.warn, "#fef3c7"], ink: [c.white, c.ink], brand: [c.white, c.brand] }[t] || [c.ink2, c.surface]);

  // ---------- frame ----------
  function bg(t) {
    let grid = "";
    for (let x = 0; x <= 1080; x += 72) grid += `<line x1="${x}" y1="0" x2="${x}" y2="1920" stroke="${c.line}" stroke-width="1" opacity=".55"/>`;
    for (let y = 0; y <= 1920; y += 72) grid += `<line x1="0" y1="${y}" x2="1080" y2="${y}" stroke="${c.line}" stroke-width="1" opacity=".55"/>`;
    const wx = 540 + Math.sin(t * 0.35) * 160, wy = 640 + Math.cos(t * 0.27) * 120;
    return `<defs><radialGradient id="wash1"><stop offset="0" stop-color="${c.coral}" stop-opacity=".16"/><stop offset="1" stop-color="${c.coral}" stop-opacity="0"/></radialGradient>
<radialGradient id="wash2"><stop offset="0" stop-color="${c.violet}" stop-opacity=".13"/><stop offset="1" stop-color="${c.violet}" stop-opacity="0"/></radialGradient>
<filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0e1a2b" flood-opacity=".13"/></filter></defs>
<rect width="1080" height="1920" fill="${c.white}"/>${grid}
<circle cx="${wx}" cy="${wy}" r="620" fill="url(#wash1)"/><circle cx="${1080 - wx + 200}" cy="${1350 - wy / 3}" r="560" fill="url(#wash2)"/>`;
  }
  const cam = (inner, { x = 540, y = 960, zoom = 1, rot = 0 } = {}) =>
    `<g transform="translate(540 960) rotate(${rot}) scale(${zoom}) translate(${-x} ${-y})">${inner}</g>`;

  // a whole screen swinging in from the right (k 0 to 1) and falling away to the left (k 1 to 2)
  function screen(inner, k, dir = 1) {
    if (k <= 0 || k >= 2) return "";
    if (k <= 1) {
      const e = ease.out(k), r = (1 - e) * 14 * dir, dx = (1 - e) * 760 * dir, s = 0.86 + 0.14 * e;
      return `<g opacity="${c01(k * 3)}" transform="translate(${540 + dx} 960) rotate(${r}) scale(${s}) translate(-540 -960)">${inner}</g>`;
    }
    const e = ease.io(k - 1), r = -e * 16 * dir, dx = -e * 820 * dir, s = 1 - 0.18 * e;
    return `<g opacity="${c01((2 - k) * 2.5)}" transform="translate(${540 + dx} ${960 + e * 120}) rotate(${r}) scale(${s}) translate(-540 -960)">${inner}</g>`;
  }

  // ---------- parts ----------
  function card(x, y, w, h, { title = "", k = 1, tag = "" } = {}) {
    if (k <= 0) return "";
    const e = ease.back(k, 1.2), s = 0.92 + 0.08 * e;
    const t = title ? `<text x="${x + 36}" y="${y + 58}" font-family="${FONT}" font-weight="700" font-size="36" fill="${c.ink}">${esc(title)}</text>` : "";
    const dots = [0, 1, 2].map((i) => `<circle cx="${x + w - 40 - i * 22}" cy="${y + 44}" r="6" fill="${c.line}"/>`).join("");
    const tg = tag ? pill(x + w - 120 - measure(tag, `700 22px '${BODY}'`) / 2, y + 44, tag, "brand", 1) : "";
    return `<g opacity="${c01(k * 2)}" transform="translate(${x + w / 2} ${y + h / 2}) scale(${s}) translate(${-x - w / 2} ${-y - h / 2})">
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${c.white}" stroke="${c.line}" stroke-width="2" filter="url(#shadow)"/>
${title ? `<line x1="${x}" y1="${y + 86}" x2="${x + w}" y2="${y + 86}" stroke="${c.line}" stroke-width="2"/>` : ""}${t}${tag ? tg : dots}</g>`;
  }

  // series: [{ pts: [values], color, k, width, dash, label }]; mark: { from, to, k, label } highlights an x range (0..1)
  function chart(x, y, w, h, { series = [], k = 1, labels = [], mark, yTicks = 4 } = {}) {
    if (k <= 0) return "";
    const all = series.flatMap((s) => s.pts), max = Math.max(...all) * 1.12, min = 0;
    const px = (i, n) => x + (i / (n - 1)) * w, py = (v) => y + h - ((v - min) / (max - min)) * h;
    let out = "";
    for (let i = 0; i <= yTicks; i++) {
      const yy = y + (i / yTicks) * h;
      out += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}" stroke="${c.line}" stroke-width="2" opacity="${c01(k * 2)}"/>`;
    }
    labels.forEach((l, i) => { out += `<text x="${px(i, labels.length)}" y="${y + h + 40}" text-anchor="middle" font-family="${BODY}" font-weight="600" font-size="26" fill="${c.muted}" opacity="${c01(k * 2)}">${esc(l)}</text>`; });
    if (mark && mark.k > 0) {
      const mx = x + mark.from * w, mw = (mark.to - mark.from) * w * ease.out(mark.k);
      out += `<rect x="${mx}" y="${y - 10}" width="${mw}" height="${h + 20}" rx="12" fill="${c.badSoft}" opacity=".85"/>`;
      if (mark.label) out += `<text x="${mx + 16}" y="${y + 30}" font-family="${BODY}" font-weight="800" font-size="28" fill="${c.bad}" opacity="${c01(mark.k * 2 - 1)}">${esc(mark.label)}</text>`;
    }
    for (const s of series) {
      const sk = ease.io(s.k ?? k), n = s.pts.length, upto = sk * (n - 1);
      let d = "";
      for (let i = 0; i <= Math.floor(upto); i++) d += `${i ? "L" : "M"}${px(i, n).toFixed(1)},${py(s.pts[i]).toFixed(1)} `;
      const fi = Math.floor(upto), fr = upto - fi;
      let ex = px(fi, n), ey = py(s.pts[fi]);
      if (fi < n - 1 && fr > 0) { ex = px(fi + fr, n); ey = py(s.pts[fi] + (s.pts[fi + 1] - s.pts[fi]) * fr); d += `L${ex.toFixed(1)},${ey.toFixed(1)}`; }
      if (s.area) out += `<path d="${d} L${ex.toFixed(1)},${y + h} L${x},${y + h} Z" fill="${s.color}" opacity=".08"/>`;
      out += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width ?? 7}" stroke-linecap="round" stroke-linejoin="round" ${s.dash ? `stroke-dasharray="${s.dash}"` : ""}/>`;
      if (sk > 0.02) out += `<circle cx="${ex}" cy="${ey}" r="11" fill="${c.white}" stroke="${s.color}" stroke-width="6"/>`;
      if (s.label && sk > 0.9) out += `<text x="${ex - 30}" y="${ey - 44}" text-anchor="end" font-family="${FONT}" font-weight="700" font-size="44" fill="${c.bad}" opacity="${c01((sk - 0.9) * 10)}">${esc(s.label)}</text>`;
    }
    return out;
  }

  // cols: [{ label, w, align }]; rows: [{ cells: [..], tone }]; hi: row index highlighted with progress hk;
  // order: the rows' order after a sort (indexes), ok: 0..1 progress of the re-sort
  function table(x, y, w, { cols = [], rows = [], k = 1, hi = -1, hk = 0, order, ok = 0, rowH = 104, sortCol = -1, size = 31, hiTone = "bad" } = {}) {
    if (k <= 0) return "";
    let out = "", cx = x;
    const colX = cols.map((col) => { const at = cx; cx += col.w; return at; });
    cols.forEach((col, i) => {
      const tx = col.align === "end" ? colX[i] + col.w - 20 : colX[i] + 20;
      out += `<text x="${tx}" y="${y + 40}" text-anchor="${col.align === "end" ? "end" : "start"}" font-family="${BODY}" font-weight="700" font-size="${size - 5}" fill="${i === sortCol ? c.brand : c.muted}" opacity="${c01(k * 3)}">${esc(col.label)}${i === sortCol ? " ↓" : ""}</text>`;
    });
    out += `<line x1="${x}" y1="${y + 62}" x2="${x + w}" y2="${y + 62}" stroke="${c.line}" stroke-width="2" opacity="${c01(k * 3)}"/>`;
    rows.forEach((r, i) => {
      const rk = ease.out(c01(k * (rows.length + 2) - i - 1));
      if (rk <= 0) return;
      const to = order ? order.indexOf(i) : i, slot = i + (to - i) * ease.io(ok);
      const ry = y + 70 + slot * rowH + (1 - rk) * 40;
      if (i === hi && hk > 0) out += `<rect x="${x - 10}" y="${ry + 4}" width="${(w + 20) * ease.out(hk)}" height="${rowH - 8}" rx="16" fill="${hiTone === "warn" ? "#fef3c7" : c.badSoft}"/>`;
      r.cells.forEach((cell, j) => {
        const col = cols[j], tx = col.align === "end" ? colX[j] + col.w - 20 : colX[j] + 20;
        const isNum = col.align === "end", fill = isNum && r.tone ? tone(r.tone)[0] : c.ink;
        out += `<text x="${tx}" y="${ry + rowH / 2 + 10}" text-anchor="${isNum ? "end" : "start"}" font-family="${isNum ? MONO : BODY}" font-weight="${isNum ? 500 : 600}" font-size="${size}" fill="${fill}" opacity="${rk}">${esc(cell)}</text>`;
      });
      if (i < rows.length - 1) out += `<line x1="${x}" y1="${ry + rowH}" x2="${x + w}" y2="${ry + rowH}" stroke="${c.line}" stroke-width="1.5" opacity="${rk * 0.8}"/>`;
    });
    return out;
  }

  function tabs(x, y, labels, active, k = 1) {
    if (k <= 0) return "";
    let out = "", cx = x;
    labels.forEach((l, i) => {
      const tw = measure(l, `700 30px '${BODY}'`);
      const on = i === active;
      out += `<text x="${cx}" y="${y}" font-family="${BODY}" font-weight="700" font-size="30" fill="${on ? c.ink : c.muted}" opacity="${c01(k * 2)}">${esc(l)}</text>`;
      if (on) out += `<rect x="${cx}" y="${y + 16}" width="${tw}" height="6" rx="3" fill="${c.brand}" opacity="${c01(k * 2)}"/>`;
      cx += tw + 46;
    });
    return out;
  }

  function cursor(x, y, { click = 0, k = 1 } = {}) {
    if (k <= 0) return "";
    const ripple = click > 0 && click < 1 ? `<circle cx="${x}" cy="${y}" r="${18 + click * 46}" fill="none" stroke="${c.brand}" stroke-width="${6 * (1 - click)}" opacity="${1 - click}"/>` : "";
    const s = click > 0 && click < 0.25 ? 0.88 : 1;
    return `${ripple}<g opacity="${c01(k * 3)}" transform="translate(${x} ${y}) scale(${s * 1.5})"><path d="M0,0 L0,34 L9,26 L15,40 L21,37 L15,24 L27,24 Z" fill="${c.ink}" stroke="${c.white}" stroke-width="3" stroke-linejoin="round"/></g>`;
  }

  function ring(x, y, w, h, k, t = "brand") {
    if (k <= 0) return "";
    const col = t === "bad" ? c.bad : t === "good" ? c.good : c.brand, per = 2 * (w + h);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="none" stroke="${col}" stroke-width="6" stroke-dasharray="${per}" stroke-dashoffset="${per * (1 - ease.out(k))}" stroke-linecap="round"/>`;
  }

  // the headline: wraps to `max` px, each word rises in; words in `accent` are brand orange
  function headline(text, { y = 300, k = 1, size = 66, max = 920, accent = [] } = {}) {
    if (k <= 0) return "";
    const font = `700 ${size}px '${FONT}'`, words = text.split(/\s+/), lines = [[]];
    for (const wd of words) { const cur = lines[lines.length - 1]; if (cur.length && measure([...cur, wd].join(" "), font) > max) lines.push([wd]); else cur.push(wd); }
    let out = "", n = 0;
    const lh = size * 1.12;
    lines.forEach((ln, li) => {
      let cx = 540 - measure(ln.join(" "), font) / 2;
      for (const wd of ln) {
        const wk = ease.out(c01(k * (words.length * 0.35 + 1) - n * 0.35)), ww = measure(wd, font);
        const hot = accent.some((a) => wd.toLowerCase().replace(/[^a-z0-9%]/g, "").startsWith(a.toLowerCase()));
        out += `<text x="${cx}" y="${y + li * lh + (1 - wk) * 34}" font-family="${FONT}" font-weight="700" font-size="${size}" fill="${hot ? c.brand : c.ink}" opacity="${wk}">${esc(wd)}</text>`;
        cx += ww + measure(" ", font); n++;
      }
    });
    return out;
  }

  function kicker(text, y, k = 1) {
    if (k <= 0) return "";
    const tw = measure(text.toUpperCase(), `800 22px '${BODY}'`) + text.length * 2.4, w = tw + 44;
    return `<g opacity="${c01(k * 2)}"><rect x="${540 - w / 2}" y="${y - 30}" width="${w}" height="46" rx="23" fill="${c.brandSoft}"/><text x="540" y="${y}" text-anchor="middle" font-family="${BODY}" font-weight="800" font-size="22" letter-spacing="2.4" fill="${c.brand}">${esc(text.toUpperCase())}</text></g>`;
  }

  function counter(x, y, from, to, k, { size = 96, prefix = "", suffix = "", tone: tn = "ink", anchor = "middle" } = {}) {
    if (k <= 0) return "";
    const v = Math.round(from + (to - from) * ease.out(k));
    const col = tn === "bad" ? c.bad : tn === "good" ? c.good : tn === "brand" ? c.brand : c.ink;
    return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${FONT}" font-weight="700" font-size="${size}" fill="${col}" opacity="${c01(k * 4)}">${esc(prefix)}${v.toLocaleString("en-US")}${esc(suffix)}</text>`;
  }

  function pill(x, y, text, tn = "ink", k = 1) {
    if (k <= 0) return "";
    const [fg, bgc] = tone(tn), tw = measure(text, `700 28px '${BODY}'`), w = tw + 44, s = 0.8 + 0.2 * ease.back(k);
    return `<g opacity="${c01(k * 3)}" transform="translate(${x} ${y}) scale(${s})"><rect x="${-w / 2}" y="-28" width="${w}" height="56" rx="28" fill="${bgc}"/><text x="0" y="10" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="28" fill="${fg}">${esc(text)}</text></g>`;
  }

  function arrow(x1, y1, x2, y2, k, tn = "brand") {
    if (k <= 0) return "";
    const col = tn === "bad" ? c.bad : tn === "good" ? c.good : c.brand, e = ease.out(k);
    const mx = (x1 + x2) / 2 + (y2 - y1) * 0.18, my = (y1 + y2) / 2 - (x2 - x1) * 0.18;
    const len = Math.hypot(x2 - x1, y2 - y1) * 1.15;
    const ang = Math.atan2(y2 - my, x2 - mx);
    const head = e > 0.85 ? `<path d="M${x2},${y2} l${-26 * Math.cos(ang - 0.45)},${-26 * Math.sin(ang - 0.45)} M${x2},${y2} l${-26 * Math.cos(ang + 0.45)},${-26 * Math.sin(ang + 0.45)}" stroke="${col}" stroke-width="8" stroke-linecap="round" opacity="${c01((e - 0.85) * 7)}"/>` : "";
    return `<path d="M${x1},${y1} Q${mx},${my} ${x2},${y2}" fill="none" stroke="${col}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${len}" stroke-dashoffset="${len * (1 - e)}"/>${head}`;
  }

  // captions: the spoken line in chunks of 3 or 4 words on a navy box
  function captions(lines, B, t, y = 1530) {
    for (const [id, text, , cap] of lines) {
      const b = B[id];
      if (!b || t < b.start || t > b.end + 0.12) continue;
      const words = String(cap || text).split(/\s+/), chunks = [];
      for (let i = 0; i < words.length;) { const n = words.length - i === 5 ? 3 : Math.min(4, words.length - i); chunks.push(words.slice(i, i + n).join(" ")); i += n; }
      const weights = chunks.map((ch) => ch.length + 4), total = weights.reduce((a, x) => a + x, 0);
      let at = b.start, chunk = chunks[0];
      for (let i = 0; i < chunks.length; i++) { const d = (weights[i] / total) * b.len; if (t >= at) chunk = chunks[i]; at += d; }
      const font = `800 48px '${BODY}'`, tw = measure(chunk, font), w = Math.min(1000, tw + 64);
      return `<g><rect x="${540 - w / 2}" y="${y - 58}" width="${w}" height="84" rx="20" fill="${c.ink}" opacity=".94"/><text x="540" y="${y}" text-anchor="middle" font-family="${BODY}" font-weight="800" font-size="48" fill="${c.white}">${esc(chunk)}</text></g>`;
    }
    return "";
  }

  // the logo (spark + wordmark) with Floey perched on the spark's left arm, then the address
  function endCard(k, t, url = "useflowra.com") {
    if (k <= 0) return "";
    const e = ease.back(k, 1.3), s = 0.85 + 0.15 * e;
    const spark = window.HUM ? HUM.spark(372, 820, 92, c.brand) : "";
    let floey = "";
    if (window.FLOEY && window.HUM) {
      // a still Floey, perched (the rule: on the spark's left arm, facing the camera, never covering it)
      endCard.f ??= FLOEY.create({ x: 312, y: 768, facing: 1, scale: 0.5, mood: "happy", perched: true, view: "front" });
      const f = endCard.f;
      f.pose(0);
      floey = `<g transform="translate(0 ${-6 * Math.sin(t * 2)})">${f.svg(0)}</g>`;
    }
    const uw = measure(url, `700 72px '${FONT}'`);
    return `<g opacity="${c01(k * 2)}" transform="translate(540 960) scale(${s}) translate(-540 -960)">
<rect x="90" y="560" width="900" height="760" rx="48" fill="${c.white}" stroke="${c.line}" stroke-width="2" filter="url(#shadow)"/>
${spark}<text x="492" y="852" font-family="${FONT}" font-weight="700" font-size="104" fill="${c.ink}">Flowra</text>${floey}
<text x="540" y="1080" text-anchor="middle" font-family="${BODY}" font-weight="700" font-size="34" fill="${c.muted}">Find the loss. Fix the page. Prove it worked.</text>
<rect x="${540 - uw / 2 - 48}" y="1150" width="${uw + 96}" height="112" rx="56" fill="${c.ink}"/>
<text x="540" y="1230" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="72" fill="${c.white}">${esc(url)}</text></g>`;
  }

  // sound cues for brand/mascot/floey_sound.py's mix (style "pro": no garden hum or ambience, the music file as the bed)
  function sounds() {
    const cues = [];
    const S = {
      say(t, mouth, id) { cues.push({ t: +t.toFixed(3), kind: "voice", id, len: (mouth || []).length / 30 }); return S; },
      sfx(t, kind, extra = {}) { cues.push({ t: +t.toFixed(3), kind, x: 540, ...extra }); return S; },
      sound(dur, music = "assets/music/mk162.mp3") { return { style: "pro", cues: [...cues].sort((a, b) => a.t - b.t), track: [], musicFile: music }; },
    };
    return S;
  }

  window.PRO = { c, FONT, BODY, MONO, esc, c01, p, ease, measure, bg, cam, screen, card, chart, table, tabs, cursor, ring, headline, kicker, counter, pill, arrow, captions, endCard, sounds };
})();
