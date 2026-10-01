// Floey's world: the page-flower garden. A background with depth (sun, clouds,
// misty mountains, hills, pollen) drawn with parallax, and page-flowers whose
// look follows their health from 0 (fading) to 1 (thriving).
//
//   GARDEN.background(t, cam)            cam = { camX, camY, zoom }; returns SVG in screen space
//   GARDEN.flower(f, health, t, opts)    f = { x, base, h, pal, dir, seed }; world space
//   GARDEN.pollen(t, cam)                floating specks, screen space, drawn over the world
(function () {
  const INK = "#1f1810";
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, k))).toString(16).padStart(2, "0")).join(""); };
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // the fade: colour drains to dry beige, then towards a dusty brown
  const fade = (col, h) => (h > 0.4 ? mix(col, "#cdbfa9", (1 - h) * 1.1) : mix(mix(col, "#cdbfa9", 0.66), "#a8957c", (0.4 - h) * 2.2));

  // ---------- background ----------
  // each layer moves with the camera by its depth factor p (0 = fixed, 1 = world)
  const layer = (cam, p, inner) => {
    const z = 1 + (cam.zoom - 1) * p, cx = 540 + (cam.camX - 540) * p, cy = 960 + (cam.camY - 960) * p;
    return `<g transform="translate(540 960) scale(${z}) translate(${-cx} ${-cy})">${inner}</g>`;
  };
  function cloud(x, y, s, o) {
    return `<g transform="translate(${x} ${y}) scale(${s})" opacity="${o}"><path d="M-120,30 C-150,30 -160,-6 -128,-14 C-130,-52 -80,-66 -56,-40 C-40,-80 30,-82 44,-36 C70,-60 120,-40 112,-6 C150,-4 150,30 118,30Z" fill="#ffffff"/><path d="M-120,30 C-90,40 90,40 118,30" stroke="#dcd3ee" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
  }
  function background(t, cam) {
    let s = `<defs>
      <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9e2f8"/><stop offset=".45" stop-color="#f6eef0"/><stop offset=".75" stop-color="#fbf3e6"/><stop offset="1" stop-color="#f3ead9"/></linearGradient>
      <radialGradient id="gsun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd98a" stop-opacity=".95"/><stop offset=".45" stop-color="#ffcf8a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>
      <linearGradient id="gm1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8cfee"/><stop offset="1" stop-color="#ece5f3"/></linearGradient>
      <linearGradient id="gm2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9c3e3"/><stop offset="1" stop-color="#e6e1ef"/></linearGradient>
      <linearGradient id="gh1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9e5c9"/><stop offset="1" stop-color="#e6ecd8"/></linearGradient>
      <radialGradient id="gvig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#3b2f6b" stop-opacity="0"/><stop offset="1" stop-color="#3b2f6b" stop-opacity=".16"/></radialGradient>
    </defs><rect width="1080" height="1920" fill="url(#gsky)"/>`;
    // sun with slowly turning rays
    const rays = Array.from({ length: 12 }, (_, i) => `<path d="M0,0 L${Math.cos((i / 12) * Math.PI * 2) * 900},${Math.sin((i / 12) * Math.PI * 2) * 900} L${Math.cos((i / 12 + 0.025) * Math.PI * 2) * 900},${Math.sin((i / 12 + 0.025) * Math.PI * 2) * 900}Z" fill="#ffd98a"/>`).join("");
    s += layer(cam, 0.08, `<g transform="translate(790 520)"><g transform="rotate(${t * 2.2})" opacity=".13">${rays}</g><circle r="210" fill="url(#gsun)"/><circle r="92" fill="#ffe2a3" opacity=".9"/></g>`);
    // drifting clouds
    s += layer(cam, 0.15, [[180, 300, 1.1, 0.9, 6], [760, 210, 0.8, 0.75, 4], [1000, 430, 0.6, 0.6, 7], [420, 520, 0.55, 0.55, 5]].map(([x, y, sc, o, v]) => cloud(((x + t * v + 300) % 1560) - 240, y, sc, o)).join(""));
    // far mountains, then nearer mountains
    s += layer(cam, 0.25, `<path d="M-300,1180 L-60,880 L120,1010 L330,760 L560,1000 L760,820 L980,1040 L1180,860 L1400,1180Z" fill="url(#gm1)"/><path d="M330,760 L380,815 L350,812 L330,840 L305,808 L282,812Z" fill="#ffffff" opacity=".7"/><path d="M760,820 L800,862 L775,860 L758,885 L742,858 L722,860Z" fill="#ffffff" opacity=".65"/>`);
    s += layer(cam, 0.4, `<path d="M-300,1300 C-100,1150 60,1070 220,1120 C380,1170 470,1020 640,1040 C820,1060 900,1170 1080,1110 C1200,1070 1300,1120 1400,1300Z" fill="url(#gm2)" opacity=".9"/>`);
    // hills with small trees
    const trees = [[60, 1290], [150, 1305], [700, 1262], [770, 1272], [1010, 1300], [430, 1310]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><path d="M0,0 v26" stroke="#9ab08a" stroke-width="6"/><ellipse cx="0" cy="-8" rx="${18 + (i % 3) * 4}" ry="${24 + (i % 2) * 6}" fill="${["#a9c49a", "#b7cfa6", "#9fbb92"][i % 3]}"/></g>`).join("");
    s += layer(cam, 0.6, `<path d="M-400,1420 C-100,1300 200,1290 420,1330 C640,1370 820,1260 1080,1290 C1260,1310 1400,1340 1500,1420 L1500,2400 L-400,2400Z" fill="url(#gh1)"/>${trees}`);
    return s;
  }
  // a soft frame over everything (draw last, screen space)
  const vignette = () => `<rect width="1080" height="1920" fill="url(#gvig)"/>`;

  // the ground in world space: meadow with grass tufts and tiny wildflowers
  function ground() {
    let s = `<path d="M-500,1610 C-100,1560 260,1600 560,1575 C860,1550 1200,1580 1600,1600 L1600,2600 L-500,2600Z" fill="#dbe7c8"/><path d="M-500,1700 C200,1660 760,1720 1600,1680 L1600,2600 L-500,2600Z" fill="#cbdbb6"/>`;
    for (let i = 0; i < 26; i++) {
      const x = -380 + i * 72 + hash(i) * 40, y = 1640 + hash(i + 5) * 220;
      s += `<path d="M${x},${y} q-6,-22 -14,-30 M${x},${y} q2,-26 0,-36 M${x},${y} q8,-20 16,-28" stroke="#8fb07a" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      if (i % 3 === 0) s += `<circle cx="${x + 18}" cy="${y - 6}" r="6" fill="${["#f2b247", "#ef6f73", "#ffffff", "#8466d9"][i % 4]}" opacity=".8"/>`;
    }
    return s;
  }

  function pollen(t, cam) {
    let s = "";
    for (let i = 0; i < 22; i++) {
      const sp = 14 + hash(i) * 22, x = (hash(i + 3) * 1200 + Math.sin(t * 0.7 + i) * 30 - (cam.camX - 540) * 0.9) % 1200 - 60;
      const y = 1900 - ((t * sp + hash(i + 7) * 1900) % 1900);
      s += `<circle cx="${x}" cy="${y}" r="${2 + hash(i + 9) * 3}" fill="#fff6d6" opacity="${0.35 + hash(i + 11) * 0.35}"/>`;
    }
    return s;
  }

  // ---------- the page-flower ----------
  const petal = (len, wid) => `M0,0 C${wid},${-len * 0.25} ${wid * 0.9},${-len * 0.85} ${wid * 0.18},${-len} Q0,${-len * 0.9} ${-wid * 0.18},${-len} C${-wid * 0.9},${-len * 0.85} ${-wid},${-len * 0.25} 0,0Z`;

  /**
   * health 0..1. opts: arrow ('up' | 'down' | auto), dropPetal (0..1 progress of one petal falling)
   */
  function flower(f, health, t, opts = {}) {
    const h = Math.max(0, Math.min(1, health)), dir = f.dir || 1, seed = f.seed ?? f.x;
    const sway = Math.sin(t * 1.25 + seed) * 1.6 * h + Math.sin(t * 2.9 + seed * 2) * 0.5 * h;
    const lean = (1 - h) * 26 * dir + sway;
    const hx = f.x, hy = f.base - f.h, stemCol = mix("#5c8a4f", "#a39257", (1 - h) * 0.9), leafCol = mix("#76a865", "#b8a86a", (1 - h) * 0.85);
    let s = `<ellipse cx="${f.x}" cy="${f.base + 4}" rx="${70}" ry="14" fill="#1f1810" opacity=".08"/>`;
    s += `<g transform="rotate(${lean} ${f.x} ${f.base})">`;
    // glow behind a thriving head
    if (h > 0.75) s += `<circle cx="${hx}" cy="${hy}" r="${190}" fill="url(#gglow)" opacity="${(h - 0.75) * 4 * (0.8 + Math.sin(t * 2 + seed) * 0.2)}"/>`;
    // stem and leaves (leaves droop as health drops)
    s += `<path d="M${hx},${f.base} C${hx - 8},${f.base - f.h * 0.3} ${hx + 8},${f.base - f.h * 0.65} ${hx},${hy + 60}" stroke="${INK}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M${hx},${f.base} C${hx - 8},${f.base - f.h * 0.3} ${hx + 8},${f.base - f.h * 0.65} ${hx},${hy + 60}" stroke="${stemCol}" stroke-width="11" fill="none" stroke-linecap="round"/>`;
    [[-1, 0.3, 0], [1, 0.5, 1]].forEach(([side, at, i]) => {
      const ly = f.base - f.h * at, droop = (1 - h) * 38 * -side + Math.sin(t * 1.6 + seed + i) * 3 * h;
      s += `<g transform="translate(${hx} ${ly}) rotate(${droop}) scale(${side} 1)"><path d="M0,0 C-30,-6 -70,-30 -96,-64 C-50,-62 -14,-36 0,0Z" fill="${leafCol}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M-4,-4 C-30,-18 -56,-34 -82,-56" stroke="${mix(leafCol, "#ffffff", 0.35)}" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    });
    // petals: a back ring and a front ring; they droop and curl as health drops
    const n = 7;
    for (const ring of [0, 1]) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 360 + (ring ? 0 : 180 / n) + (f.spin || 0);
        if (opts.dropPetal > 0 && ring === 1 && i === 2) continue; // this one is falling
        const down = Math.cos((a * Math.PI) / 180); // 1 at the bottom of the head
        const droopRot = (1 - h) * 34 * Math.sign(Math.sin((a * Math.PI) / 180) || 1) * Math.max(0, -down * 0.4 + 0.6);
        const base = f.pal[i % f.pal.length], col = fade(ring ? base : mix(base, INK, 0.18), h);
        const len = (ring ? 150 : 166) * (0.82 + h * 0.18), wid = (ring ? 60 : 54) * (0.8 + h * 0.2) * (1 - (1 - h) * 0.25);
        const breathe = 1 + Math.sin(t * 2.1 + i + seed) * 0.015 * h;
        s += `<g transform="translate(${hx} ${hy}) rotate(${a + droopRot}) scale(${breathe})"><path d="${petal(len, wid)}" fill="${col}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
        if (h > 0.45 && ring) s += `<path d="M0,-12 Q${wid * 0.12},${-len * 0.5} 0,${-len * 0.82}" stroke="${mix(col, "#ffffff", 0.45)}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="${(h - 0.45) * 1.8}"/>`;
        if (h < 0.5) s += `<path d="M${-wid * 0.5},${-len * 0.7} q${wid * 0.25},6 ${wid * 0.5},0" stroke="${INK}" stroke-width="2.5" fill="none" opacity="${(0.5 - h) * 1.2}"/>`;
        s += `</g>`;
      }
    }
    // the page in the middle: yellows and gets a folded corner as it fades
    const paper = mix("#fffaf2", "#eadbb8", (1 - h) * 1.1), lineGrey = mix("#d9d2c6", "#c9b99a", 1 - h);
    s += `<g transform="rotate(${(1 - h) * 6 * dir} ${hx} ${hy})"><rect x="${hx - 62}" y="${hy - 74}" width="124" height="150" rx="14" fill="${paper}" stroke="${INK}" stroke-width="6"/>`;
    if (h < 0.55) { const c = (0.55 - h) * 60; s += `<path d="M${hx + 62 - c},${hy - 74} L${hx + 62},${hy - 74 + c} L${hx + 62 - c},${hy - 74 + c}Z" fill="${mix(paper, INK, 0.12)}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`; }
    [0, 1, 2, 3].forEach((i) => s += `<rect x="${hx - 40}" y="${hy - 46 + i * 28}" width="${[80, 64, 76, 50][i]}" height="10" rx="5" fill="${i === 0 || i === 3 ? fade(f.pal[i ? 1 : 0], h) : lineGrey}"/>`);
    const up = opts.arrow ? opts.arrow === "up" : h > 0.6, k = up ? -1 : 1;
    s += `<path d="M${hx + 34},${hy + 40 - 13 * k} l0,${26 * k} m-10,${-10 * k} l10,${10 * k} l10,${-10 * k}" stroke="${up ? "#2f9e62" : "#d24b4b"}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
    // twinkles on a thriving flower
    if (h > 0.85) for (let i = 0; i < 2; i++) { const ph = (t * 0.8 + i * 0.5 + seed * 0.01) % 1, a = (i * 2.4 + seed) % 6.28; const r = 120 + i * 20; s += `<g opacity="${Math.sin(ph * Math.PI) * (h - 0.85) * 6}">${HUM.spark(hx + Math.cos(a) * r, hy + Math.sin(a) * r - 20, 12 * Math.sin(ph * Math.PI) + 4, "#fff4c8")}</g>`; }
    s += `</g>`;
    return s;
  }
  // the falling petal, drawn on its own (progress k 0..1 from the head at (x, y))
  function fallingPetal(f, health, x, y, k) {
    if (k <= 0 || k >= 1) return "";
    const col = fade(f.pal[2 % f.pal.length], health);
    return `<g transform="translate(${x + Math.sin(k * 9) * 40 + k * 60} ${y + k * 560}) rotate(${k * 320})" opacity="${1 - k * 0.5}"><path d="${petal(100, 40)}" fill="${col}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/></g>`;
  }
  const defs = () => `<defs><radialGradient id="gglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff1c2" stop-opacity=".9"/><stop offset="1" stop-color="#fff1c2" stop-opacity="0"/></radialGradient></defs>`;

  window.GARDEN = { background, ground, pollen, flower, fallingPetal, vignette, defs, mix, fade };
})();
