// The Flowra hummingbird, drawn as SVG from a handful of controls so the reel
// renderer can pose and animate it frame by frame. Side profile, facing left.
// Local units: a 300 x 300 box; the head centre sits near (140, 112).
//
//   HUM.svg({ mood, beak, wing, wingPhase, tail, crest, flash, look, blink })
//
// mood   hello | happy | worried | think | surprised | determined | sad | party
// beak   0 closed .. 1 wide open (talking: drive it from the voice)
// wing   blur (hovering) | up | point | wave | fold
// wingPhase 0..1 position in the figure-8 cycle (blur ghosts follow it)
// tail   0 closed .. 1 fully fanned (braking)
// crest  -1 flat (sad) .. 1 raised (alert)
// flash  0..1 gorget shimmer: the Flowra spectrum sweeps across the throat
// look   -1..1 pupils left/right
// blink  0 open .. 1 shut
(function () {
  const C = { ink: "#1f1810", cream: "#f6efe3", paper: "#fffaf2", amber: "#f2b247", coral: "#ef6f73", magenta: "#c25aa0", violet: "#8466d9", indigo: "#4f5fc7", deep: "#3b2f6b" };
  let uid = 0;

  const defs = (id, flash) => {
    // the gorget gradient slides with flash so the colours sweep across it
    const o = -0.6 + flash * 1.2;
    return `<defs>
  <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.coral}"/><stop offset=".5" stop-color="${C.magenta}"/><stop offset="1" stop-color="${C.violet}"/></linearGradient>
  <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.indigo}"/></linearGradient>
  <linearGradient id="${id}g" x1="${o}" y1="0" x2="${o + 1}" y2=".6">${flash > 0
    ? `<stop offset="0" stop-color="${C.magenta}"/><stop offset=".25" stop-color="${C.amber}"/><stop offset=".5" stop-color="${C.coral}"/><stop offset=".75" stop-color="${C.violet}"/><stop offset="1" stop-color="${C.indigo}"/>`
    : `<stop offset="0" stop-color="${C.coral}"/><stop offset="1" stop-color="#e0457c"/>`}</linearGradient>
  <radialGradient id="${id}s" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>`;
  };

  // a four-point spark (the Flowra logo shape)
  const spark = (x, y, r, fill, k = 0.22) => `<path d="M${x},${y - r} Q${x + r * k},${y - r * k} ${x + r},${y} Q${x + r * k},${y + r * k} ${x},${y + r} Q${x - r * k},${y + r * k} ${x - r},${y} Q${x - r * k},${y - r * k} ${x},${y - r}Z" fill="${fill}"/>`;

  function tail(id, fan, ang = 0) {
    // 3 feathers when closed, spreading to 5 when fanned
    const n = fan > 0.35 ? 5 : 3, spread = 10 + fan * 46;
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = (-spread / 2 + (spread * i) / (n - 1)) * Math.PI / 180, L = 74 - Math.abs(i - (n - 1) / 2) * 8;
      const bx = 208, by = 202, ang = Math.PI * 0.27 + a;
      const tx = bx + Math.cos(ang) * L, ty = by + Math.sin(ang) * L;
      const nx = -Math.sin(ang) * 9, ny = Math.cos(ang) * 9;
      s += `<path transform="rotate(${ang} 208 202)" d="M${bx + nx},${by + ny} Q${(bx + tx) / 2 + nx * 1.4},${(by + ty) / 2 + ny * 1.4} ${tx},${ty} Q${(bx + tx) / 2 - nx * 1.4},${(by + ty) / 2 - ny * 1.4} ${bx - nx},${by - ny}Z" fill="${i % 2 ? C.indigo : C.deep}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>`;
    }
    return s;
  }

  function wings(id, mode, phase) {
    const sh = { x: 184, y: 126 }; // shoulder
    const feather = (rot, len = 96, wid = 30, op = 1) => `<g transform="rotate(${rot} ${sh.x} ${sh.y})" opacity="${op}">
      <path d="M${sh.x},${sh.y} C${sh.x + wid},${sh.y - len * 0.35} ${sh.x + wid * 0.7},${sh.y - len * 0.85} ${sh.x + 6},${sh.y - len} C${sh.x - wid * 0.5},${sh.y - len * 0.7} ${sh.x - wid * 0.45},${sh.y - len * 0.3} ${sh.x},${sh.y}Z" fill="url(#${id}w)" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M${sh.x + 4},${sh.y - 18} Q${sh.x + 12},${sh.y - len * 0.55} ${sh.x + 6},${sh.y - len * 0.86}" stroke="${C.cream}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/></g>`;
    if (mode === "blur") {
      // figure-8 sweep: a soft fan of ghost wings, the brightest at the current phase
      const a = Math.sin(phase * Math.PI * 2);
      const ghosts = [-14, 8, 30, 52, 74].map((r, i) => {
        const near = 1 - Math.min(1, Math.abs((i / 4) * 2 - 1 - a));
        return feather(r + a * 6, 104, 30, 0.12 + near * 0.32);
      }).join("");
      const lines = [-20, 10, 40, 64].map((r) => `<path d="M${sh.x + 20},${sh.y - 30} A110,110 0 0 1 ${sh.x + 96},${sh.y + 6}" transform="rotate(${r + a * 4} ${sh.x} ${sh.y})" stroke="${C.cream}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`).join("");
      return `<ellipse cx="${sh.x + 50}" cy="${sh.y - 40}" rx="70" ry="58" fill="${C.violet}" opacity=".10"/>${ghosts}${lines}`;
    }
    if (mode === "up") return feather(-4);
    if (mode === "stretch") return feather(150, 112, 26); // wing stretched down along the body
    if (mode === "fold") return feather(64, 84, 26);
    if (mode === "wave") return feather(-28 + Math.sin(phase * Math.PI * 2) * 22);
    // point: the wing swings forward like an arm, tip toward the beak side
    return feather(-96, 100, 28);
  }

  function face(mood, beak, look, blink, crest, x = {}) {
    const ex = 128 + look * 3, ey = 102, ly = (x.lookY || 0) * 4, sq = x.squint || 0;
    let s = `<g transform="rotate(${x.crestWob || 0} 158 64)">`;
    // crest: three small feathers on the crown
    const cr = crest * 18;
    [[152, 58, -14], [164, 58, 14]].forEach(([x, y, r], i) => {
      s += `<path d="M${x},${y + 6} q${-5 + i * 2},${-16 - cr * .7} ${5 + i * 3},${-19 - cr * .7} q${2},${10 + cr / 3} ${-5},${19 + cr / 3}z" fill="${i === 1 ? C.violet : C.magenta}" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round" transform="rotate(${r} ${x} ${y + 6})"/>`;
    });
    s += `</g>`;
    // tongue: flicks out past the beak tip (hummingbirds do this after feeding and preening)
    if (x.tongue > 0.02) s += `<path d="M70,${109 + beak * 6} L${52 - x.tongue * 40},${107 + beak * 8}" stroke="${C.coral}" stroke-width="4" stroke-linecap="round"/><circle cx="${52 - x.tongue * 40}" cy="${107 + beak * 8}" r="3" fill="${C.coral}"/>`;
    // beak: upper and lower halves hinge open
    const open = beak * 16;
    s += `<path d="M110,100 Q78,96 46,${102 - open * 0.25} Q78,${104 - open * 0.1} 112,110Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M112,112 Q80,${114 + open * 0.6} 52,${110 + open} Q82,${120 + open * 0.7} 114,120Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    if (beak > 0.2) s += `<path d="M104,${112 + open * 0.3} Q86,${114 + open * 0.55} 72,${113 + open * 0.6}" stroke="${C.coral}" stroke-width="${2 + beak * 3}" stroke-linecap="round" fill="none"/>`;
    // eye
    const r = mood === "surprised" ? 15 : 13;
    if (mood === "happy" || mood === "party" || blink > 0.8) {
      s += `<path d="M${ex - r},${ey + 2} Q${ex},${ey - r * 1.3} ${ex + r},${ey + 2}" stroke="${C.ink}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
    } else {
      const open = (1 - blink) * (1 - sq * 0.55);
      s += `<ellipse cx="${ex}" cy="${ey + sq * 3}" rx="${r}" ry="${r * 1.12 * open}" fill="${C.paper}" stroke="${C.ink}" stroke-width="4"/>`;
      const pr = mood === "surprised" ? 6.5 : 8.5;
      s += `<ellipse cx="${ex - 2 + look * 4}" cy="${ey + 1 + ly + sq * 3}" rx="${pr}" ry="${Math.min(pr * 1.15, r * 1.12 * open)}" fill="${C.ink}"/>`;
      // catchlight shaped like the Flowra spark
      if (open > 0.4) s += spark(ex - 4 + look * 4, ey - 4 + ly + sq * 3, 4.6, "#fff");
      if (sq > 0.05) s += `<path d="M${ex - r - 2},${ey - r * open + sq * 3} L${ex + r + 2},${ey - r * open + sq * 5}" stroke="${C.ink}" stroke-width="4.5" stroke-linecap="round"/>`;
    }
    // brows float above the eye
    const brow = { worried: `M${ex - 14},${ey - 18} L${ex + 12},${ey - 26}`, sad: `M${ex - 14},${ey - 20} Q${ex},${ey - 26} ${ex + 14},${ey - 18}`, think: `M${ex - 14},${ey - 26} L${ex + 14},${ey - 22}`, determined: `M${ex - 14},${ey - 26} L${ex + 12},${ey - 17}`, surprised: `M${ex - 13},${ey - 30} Q${ex},${ey - 38} ${ex + 13},${ey - 30}` }[mood];
    if (brow) s += `<path d="${brow}" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    s += `<ellipse cx="${ex + 14}" cy="${ey + 22}" rx="10" ry="5.5" fill="${C.coral}" opacity=".55"/>`;
    // something held in the beak, drawn centred on the beak tip
    if (x.hold) s += `<g transform="translate(${44} ${106 + beak * 6})">${x.hold}</g>`;
    return `<g transform="rotate(${x.tilt || 0} 140 112)">${s}</g>`;
  }

  // ---- front, three-quarter and back views ----
  // turn: 0 = facing the camera, 1 = three-quarter (head turned to its right,
  // our left). back draws the same body from behind.
  function frontal(p, id) {
    const back = p.view === "back";
    const turn = p.view === "three" ? 0.62 : back ? 0 : (p.turn ?? 0);
    const fx = 150 - turn * 30, open = p.beak * 14;
    const body = `M150,58 C198,58 216,112 213,162 C210,214 184,238 150,238 C116,238 90,214 87,162 C84,112 102,58 150,58Z`;
    const fanSide = (side, scale) => {
      // a figure-8 blur fan on one side of the body
      const sx = 150 + side * 52, sy = 128, a = Math.sin(p.wingPhase * Math.PI * 2);
      const ghost = (r, op) => `<g transform="translate(${sx} ${sy}) scale(${side * scale} ${scale}) rotate(${r})" opacity="${op}"><path d="M0,0 C28,-30 26,-82 8,-100 C-14,-76 -18,-30 0,0Z" fill="url(#${id}w)" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/></g>`;
      if (p.wing !== "blur") {
        if (side < 0 && p.wing === "wave") return ghost(30 + Math.sin(p.wingPhase * Math.PI * 2) * 25, 1);
        return ghost(side < 0 && p.wing === "point" ? 80 : 150, 1);
      }
      return `<ellipse cx="${sx + side * 40 * scale}" cy="${sy - 46}" rx="${56 * scale}" ry="${60 * scale}" fill="${C.violet}" opacity=".10"/>` +
        [18, 38, 58, 78].map((r, i) => ghost(r + a * 8, 0.14 + (1 - Math.min(1, Math.abs(i / 3 * 2 - 1 - a))) * 0.32)).join("") +
        [24, 54].map((r) => `<path d="M${sx},${sy} m${side * 18},-26 a96,96 0 0 ${side > 0 ? 1 : 0} ${side * 70},40" stroke="${C.cream}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7" transform="rotate(${side * (r - 40)} ${sx} ${sy})"/>`).join("");
    };
    const tailFront = () => {
      const n = p.tail > 0.35 ? 5 : 3, spread = 16 + p.tail * 60;
      let t = "";
      for (let i = 0; i < n; i++) {
        const r = -spread / 2 + (spread * i) / (n - 1), L = (back ? 70 : 46) - Math.abs(i - (n - 1) / 2) * 6;
        t += `<g transform="translate(150 ${back ? 226 : 228}) rotate(${r})"><path d="M-9,0 Q-11,${L * 0.6} 0,${L} Q11,${L * 0.6} 9,0Z" fill="${i % 2 ? C.indigo : C.deep}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/></g>`;
      }
      return t;
    };
    const crest = () => {
      const cr = p.crest * 14;
      return [[-9, -12], [9, 12]].map(([dx, r], i) => `<path d="M${fx + dx},${64} q${-4 + i * 4},${-16 - cr} ${4 + i * 2},${-19 - cr} q2,${10 + cr / 3} -4,${19 + cr / 3}z" fill="${i ? C.violet : C.magenta}" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round" transform="rotate(${r} ${fx + dx} 64)"/>`).join("");
    };
    let s = defs(id, p.flash) + `<g transform="rotate(${p.lean ?? 0} 150 150)">`;
    s += tailFront() + fanSide(1, back ? 1 : 1 - turn * 0.45) + fanSide(-1, 1);
    if (back) {
      s += `<path d="${body}" fill="url(#${id}b)" stroke="${C.ink}" stroke-width="5"/>`;
      s += `<ellipse cx="150" cy="104" rx="46" ry="30" fill="${C.violet}" opacity=".35"/>`;
      s += [[150, 150], [134, 176], [166, 176], [150, 200]].map(([x, y]) => `<path d="M${x - 8},${y} q8,8 16,0" stroke="${C.ink}" stroke-width="3" fill="none" opacity=".35" stroke-linecap="round"/>`).join("");
      s += crest();
      return s + `</g>`;
    }
    s += `<path d="${body}" fill="url(#${id}b)" stroke="${C.ink}" stroke-width="5"/>`;
    s += `<ellipse cx="${fx + 2}" cy="200" rx="${40 - turn * 6}" ry="30" fill="${C.cream}" opacity=".92"/>`;
    // gorget bib, narrower on the far side when turned
    const fr = 36 * (1 - turn * 0.5);
    // a throat shield below the beak: narrow at the top, round at the bottom, feathered edge (never mouth-shaped)
    const fr2 = 26 * (1 - turn * 0.45);
    s += `<path d="M${fx - 14},132 Q${fx},128 ${fx + fr2 * 0.55},132 C${fx + fr2},150 ${fx + fr2 * 0.6},176 ${fx},182 C${fx - 26 * 0.6},176 ${fx - 26},150 ${fx - 14},132Z" fill="url(#${id}g)"/>`;
    s += [-14, 0, 14].map((dx) => `<path d="M${fx + dx * (dx > 0 ? 1 - turn * 0.45 : 1) - 7},${172 - Math.abs(dx) * 0.4} q7,7 14,0" stroke="${C.ink}" stroke-width="2.5" fill="none" opacity=".35" stroke-linecap="round"/>`).join("");
    if (p.flash > 0) s += `<ellipse cx="${fx - 30 + p.flash * 56}" cy="146" rx="16" ry="8" fill="url(#${id}s)" opacity="${Math.sin(p.flash * Math.PI)}"/>`;
    if (p.feet) s += `<path d="M138,236 v12 M162,236 v12" stroke="${C.ink}" stroke-width="4.5" stroke-linecap="round"/><path d="M130,249 h14 M156,249 h14" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`;
    s += crest();
    // eyes: near (our left) full size, far one smaller when turned
    const eye = (x, sc) => {
      const r = (p.mood === "surprised" ? 14 : 12) * sc, y = 104;
      if (p.mood === "happy" || p.mood === "party" || p.blink > 0.8) return `<path d="M${x - r},${y + 2} Q${x},${y - r * 1.3} ${x + r},${y + 2}" stroke="${C.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      const pr = (p.mood === "surprised" ? 6 : 8) * sc;
      return `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.12 * (1 - p.blink)}" fill="${C.paper}" stroke="${C.ink}" stroke-width="4"/><ellipse cx="${x - turn * 3 + p.look * 3}" cy="${y + 1}" rx="${pr}" ry="${pr * 1.15 * (1 - p.blink)}" fill="${C.ink}"/>` + spark(x - 3 - turn * 3 + p.look * 3, y - 4, 4.2 * sc, "#fff");
    };
    s += eye(fx - 26, 1) + eye(fx + 26 * (1 - turn * 0.55), 1 - turn * 0.3);
    const brow = { worried: [[-14, -18, 12, -25], [-12, -25, 14, -18]], think: [[-14, -26, 14, -22], [-14, -24, 14, -27]], determined: [[-14, -26, 12, -17], [-12, -17, 14, -26]], sad: [[-14, -18, 12, -22], [-12, -22, 14, -18]], surprised: [[-12, -30, 12, -32], [-12, -32, 12, -30]] }[p.mood];
    if (brow) [fx - 26, fx + 26 * (1 - turn * 0.55)].forEach((x, i) => { const [a, b, c, d] = brow[i]; s += `<path d="M${x + a},${104 + b} L${x + c},${104 + d}" stroke="${C.ink}" stroke-width="4.5" stroke-linecap="round"/>`; });
    s += `<ellipse cx="${fx - 44}" cy="124" rx="9" ry="5" fill="${C.coral}" opacity=".55"/><ellipse cx="${fx + 44 * (1 - turn * 0.6)}" cy="124" rx="9" ry="5" fill="${C.coral}" opacity=".55"/>`;
    // beak: foreshortened toward camera, swinging to our left as the head turns
    // facing us the beak points at the camera (a short wedge with a highlight);
    // turned, it swings out to our left with a thick base
    const tipx = fx - turn * 84, tipy = 142 - turn * 24;
    if (open > 1) s += `<path d="M${fx - 10},124 L${tipx},${tipy + open} L${fx + 10},125Z" fill="${C.coral}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M${fx - 12},112 Q${fx},106 ${fx + 12},113 Q${fx + 10},${122} ${fx + 4},126 L${tipx},${tipy} Q${fx - 12},${122 - turn * 6} ${fx - 12},112Z" fill="${C.ink}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M${fx - 5},114 Q${(fx + tipx) / 2 - 2},${(114 + tipy) / 2 - 3} ${tipx + (fx - tipx) * 0.25},${tipy - (tipy - 114) * 0.25}" stroke="#fff" stroke-width="2.5" opacity=".35" fill="none" stroke-linecap="round"/>`;
    if (open > 1) s += `<path d="M${fx - 8},${124 + open * 0.3} L${tipx + 4},${tipy + open + 2} L${fx + 9},${125 + open * 0.3}Z" fill="${C.ink}"/>`;
    return s + `</g>`;
  }

  function svg(o = {}) {
    const p = { mood: "hello", beak: 0, wing: "blur", wingPhase: 0, tail: 0.15, crest: 0.2, flash: 0, look: 0, blink: 0, ...o };
    if (p.feet === undefined) p.feet = p.wing !== "blur";
    if (p.mood === "worried" || p.mood === "sad") p.crest = Math.min(p.crest, -0.6);
    if (p.mood === "surprised" || p.mood === "determined" || p.mood === "party") p.crest = Math.max(p.crest, 0.9);
    const id = `hum${uid++}`;
    if (p.view && p.view !== "side") return frontal(p, id);
    const back = p.wing === "point" || p.wing === "wave" ? "" : wings(id, p.wing, p.wingPhase);
    const front = back ? "" : wings(id, p.wing, p.wingPhase);
    const lean = p.lean ?? (p.wing === "blur" ? -16 : -6);
    return `${defs(id, p.flash)}<g transform="rotate(${lean} 160 150) translate(160 150) scale(.92 1) translate(-160 -150)">
  ${tail(id, p.tail, p.tailAngle || 0)}
  ${back}
  <g transform="translate(160 150) scale(${1 + (p.puff || 0) * 0.09}) translate(-160 -150)">
  <path d="M100,118 C98,70 146,48 184,66 C226,88 240,150 222,192 C206,226 170,240 148,232 C114,222 100,172 100,118Z" fill="url(#${id}b)" stroke="${C.ink}" stroke-width="5"/>
  ${(p.puff || 0) > 0.05 ? [[100, 150, 200], [118, 214, 225], [224, 160, 10], [206, 214, 50], [192, 70, -40], [104, 96, 160]].map(([x, y, r]) => `<path d="M${x},${y} l${Math.cos(r * Math.PI / 180) * 12 * p.puff},${Math.sin(r * Math.PI / 180) * 12 * p.puff} l${Math.cos((r + 50) * Math.PI / 180) * 8 * p.puff},${Math.sin((r + 50) * Math.PI / 180) * 8 * p.puff}" stroke="${C.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join("") : ""}
  </g>
  <path d="M122,170 C134,206 168,222 196,206 C186,226 162,234 146,228 C126,220 116,196 122,170Z" fill="${C.cream}" opacity=".92"/>
  <path d="M104,124 C110,154 132,172 162,170 C156,152 146,136 132,124 C122,118 110,118 104,124Z" fill="url(#${id}g)" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"/>
  ${p.flash > 0 ? `<ellipse cx="${118 + p.flash * 30}" cy="${136 + p.flash * 12}" rx="20" ry="9" fill="url(#${id}s)" opacity="${Math.sin(p.flash * Math.PI)}" transform="rotate(30 ${118 + p.flash * 30} ${136 + p.flash * 12})"/>` : ""}
  ${p.feet ? (() => { const L = 14 * (p.feetOut ?? 1); return `<path d="M156,232 l-4,${L} M170,230 l2,${L}" stroke="${C.ink}" stroke-width="4.5" stroke-linecap="round"/><path d="M146,${233 + L} h12 M168,${231 + L} h12" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>`; })() : ""}
  ${face(p.mood, p.beak, p.look, p.blink, p.crest, p)}
  ${front}</g>`;
  }

  const api = { svg, colors: C, spark };
  if (typeof window !== "undefined") window.HUM = api;
  if (typeof module !== "undefined") module.exports = api;
})();
