// Maya, Floey's co-star: a solo blogger who panics about her traffic. Drawn as
// SVG from a handful of controls (same flat, ink-outlined look as Floey), so a
// scene can pose and animate her frame by frame and she lip-syncs to her voice.
// Local units: a 600 x 760 box, waist up; the head centre sits at (300, 240).
//
//   MAYA.svg({ expr, mouth, blink, look, lookY, pose, tilt, lean, breathe, hold, glasses })
//
// expr    neutral | happy | panic | worried | annoyed | smug | surprised | think | deadpan | sad | proud
// mouth   0 closed .. 1 wide open (talking: drive it from the voice)
// pose    a name from POSES or { L: [x, y], R: [x, y] } hand targets (blend two with MAYA.mix)
// hold    "phone" | "mug" | "laptop-lid" | null: drawn in the right hand
(function () {
  const C = {
    ink: "#1f1810", skin: "#d9a07a", skinShade: "#c2845f", blush: "#e8846f", hair: "#3a2418", hairHi: "#5a3a26",
    hoodie: "#f2b247", hoodieShade: "#d99a2f", cuff: "#e7a63a", white: "#fffaf2", iris: "#4a2c1c", lip: "#b5524f", mouth: "#5a1f22", tongue: "#e07a76",
    pencil: "#ef6f73", pencilWood: "#f6d7a7", glasses: "#1f1810",
  };

  // expression = brows (angle in degrees for the inner end, height), eyes (open 0..1.2), mouth (smile -1..1, width), extras
  const EXPR = {
    neutral:   { brow: [0, 0],    eye: 1,    smile: 0.15, w: 1,    blush: 0 },
    happy:     { brow: [-4, -6],  eye: 0.82, smile: 1,    w: 1.15, blush: 0.6 },
    proud:     { brow: [-6, -4],  eye: 0.7,  smile: 0.85, w: 1.1,  blush: 0.4 },
    panic:     { brow: [22, -14], eye: 1.25, smile: -0.7, w: 0.9,  blush: 0, sweat: 1, pupil: 0.7 },
    worried:   { brow: [16, -6],  eye: 1.05, smile: -0.45, w: 0.85, blush: 0, sweat: 0.5 },
    annoyed:   { brow: [-18, 6],  eye: 0.62, smile: -0.25, w: 0.8,  blush: 0 },
    smug:      { brow: [-10, 2],  eye: 0.58, smile: 0.55, w: 0.95, blush: 0.3, side: 1 },
    surprised: { brow: [6, -20],  eye: 1.3,  smile: 0,    w: 0.7,  blush: 0, round: 1, pupil: 0.75 },
    think:     { brow: [8, -8],   eye: 0.9,  smile: -0.1, w: 0.7,  blush: 0, side: -1, lookUp: 1 },
    deadpan:   { brow: [0, 4],    eye: 0.5,  smile: 0,    w: 0.85, blush: 0 },
    sad:       { brow: [20, -2],  eye: 0.8,  smile: -0.8, w: 0.85, blush: 0 },
  };

  // right/left hand targets for each pose (local units). L is her right hand on screen left.
  const POSES = {
    rest:     { L: [228, 705], R: [372, 705] },
    type:     { L: [252, 690], R: [348, 690], typing: 1 },
    facepalm: { L: [228, 705], R: [318, 228], kR: "open" },
    panic:    { L: [128, 236], R: [472, 236], kL: "open", kR: "open" },
    cheeks:   { L: [196, 318], R: [404, 318], kL: "open", kR: "open" },
    point:    { L: [228, 705], R: [560, 470], kR: "point" },
    pointL:   { L: [40, 470], R: [372, 705], kL: "point" },
    shrug:    { L: [112, 560], R: [488, 560], kL: "open", kR: "open" },
    chin:     { L: [300, 620], R: [322, 372] },
    wave:     { L: [228, 705], R: [486, 290], kR: "open", wave: 1 },
    phone:    { L: [228, 705], R: [404, 300], hold: "phone" },
    mug:      { L: [262, 640], R: [378, 600], hold: "mug" },
    crossed:  { L: [376, 600], R: [224, 600], crossed: 1 },
    fist:     { L: [228, 705], R: [452, 250] },
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerp2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const f = (n) => Math.round(n * 10) / 10;

  /** Blend two poses (names or objects) by k: hands travel, flags switch at the halfway point. */
  function mix(a, b, k) {
    const A = typeof a === "string" ? POSES[a] : a, B = typeof b === "string" ? POSES[b] : b;
    const out = { ...(k < 0.5 ? A : B) };
    out.L = lerp2(A.L, B.L, k); out.R = lerp2(A.R, B.R, k);
    return out;
  }

  // two-bone arm: the elbow bends away from the body (outward and down)
  function elbow(S, H, a, b, side) {
    const dx = H[0] - S[0], dy = H[1] - S[1];
    const d = clamp(Math.hypot(dx, dy), 20, a + b - 2);
    const base = Math.atan2(dy, dx), ang = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
    const e1 = [S[0] + a * Math.cos(base + ang), S[1] + a * Math.sin(base + ang)];
    const e2 = [S[0] + a * Math.cos(base - ang), S[1] + a * Math.sin(base - ang)];
    const score = (e) => (e[0] - 300) * side + (e[1] - S[1]) * 0.35;
    return score(e1) > score(e2) ? e1 : e2;
  }

  const sleeve = (S, E, H) => {
    const d = `M${f(S[0])},${f(S[1])} L${f(E[0])},${f(E[1])} L${f(H[0])},${f(H[1])}`;
    return `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="68" stroke-linecap="round" stroke-linejoin="round"/>
<path d="${d}" fill="none" stroke="${C.hoodie}" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"/>`;
  };

  // a mitten hand at H, rotated to the forearm direction; kind: open | fist | point | palm | hold
  function hand(H, E, kind, mirror) {
    const a = Math.atan2(H[1] - E[1], H[0] - E[0]) * 180 / Math.PI;
    const s = mirror ? -1 : 1;
    const ink = `stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"`;
    let body;
    if (kind === "point") {
      body = `<ellipse cx="0" cy="0" rx="30" ry="27" fill="${C.skin}" ${ink}/>
<rect x="14" y="${-9 * s - 7}" width="46" height="18" rx="9" fill="${C.skin}" ${ink}/>
<ellipse cx="2" cy="${17 * s}" rx="13" ry="9" fill="${C.skin}" ${ink}/>`;
    } else if (kind === "open") {
      // spread palm: four fingers fanned along the forearm direction, thumb to the side
      const fingers = [-46, -16, 14, 42].map((d, k) => `<rect x="18" y="-8" width="${k === 0 || k === 3 ? 34 : 42}" height="16" rx="8" fill="${C.skin}" stroke="${C.ink}" stroke-width="5.5" transform="rotate(${d * s})"/>`).join("");
      body = `${fingers}<rect x="4" y="-8" width="34" height="16" rx="8" fill="${C.skin}" stroke="${C.ink}" stroke-width="5.5" transform="rotate(${-96 * s})"/>
<ellipse cx="4" cy="0" rx="27" ry="26" fill="${C.skin}" stroke="${C.ink}" stroke-width="6"/>`;
    } else {
      body = `<ellipse cx="0" cy="0" rx="30" ry="28" fill="${C.skin}" ${ink}/>
<path d="M8,${-20 * s} q14,${4 * s} 12,${18 * s}" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`;
    }
    return `<g transform="translate(${f(H[0])} ${f(H[1])}) rotate(${f(a)})">${body}</g>`;
  }

  // things she can hold, drawn at the right hand
  function prop(kind, H) {
    if (kind === "phone") return `<g transform="translate(${f(H[0] - 6)} ${f(H[1] - 70)}) rotate(8)"><rect x="-28" y="0" width="56" height="104" rx="10" fill="#2d2f45" stroke="${C.ink}" stroke-width="6"/><rect x="-21" y="9" width="42" height="80" rx="4" fill="#8fa0ff" opacity=".9"/></g>`;
    if (kind === "mug") return `<g transform="translate(${f(H[0] + 8)} ${f(H[1] - 52)})"><path d="M28,18 q30,0 30,26 q0,26 -30,26" fill="none" stroke="${C.ink}" stroke-width="9"/><rect x="-34" y="0" width="64" height="80" rx="9" fill="${C.white}" stroke="${C.ink}" stroke-width="6"/><path d="M-30,24 h56" stroke="${C.pencil}" stroke-width="10"/><path d="M-12,-12 q-8,-12 0,-24 M8,-12 q-8,-12 0,-24" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round" opacity=".35"/></g>`;
    return "";
  }

  function mouthPath(e, open, side) {
    const w = 50 * e.w * (1 - open * 0.2), cx = 300 + (side || 0) * 10, cy = 334;
    const sm = e.smile, lift = sm * 14;
    if (e.round && open < 0.25) open = 0.35;
    if (open < 0.06) {
      // closed: one curve; smug pulls one corner up
      const l = [cx - w, cy - lift * 0.5 + (side > 0 ? 4 : 0)], r = [cx + w, cy - lift * 0.5 - (side > 0 ? 8 : 0)];
      return `<path d="M${f(l[0])},${f(l[1])} Q${cx},${f(cy + lift)} ${f(r[0])},${f(r[1])}" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>`;
    }
    const h = 10 + open * 52, top = cy - lift * 0.4 - h * 0.25;
    const l = [cx - w, top + (sm > 0 ? -lift * 0.3 : 4)], r = [cx + w, top + (sm > 0 ? -lift * 0.3 : 4)];
    const low = top + h + Math.max(0, sm) * 10;
    const d = `M${f(l[0])},${f(l[1])} Q${cx},${f(top - 6 + Math.max(0, -sm) * 8)} ${f(r[0])},${f(r[1])} Q${f(cx + w * 0.7)},${f(low)} ${cx},${f(low)} Q${f(cx - w * 0.7)},${f(low)} ${f(l[0])},${f(l[1])}Z`;
    return `<path d="${d}" fill="${C.mouth}" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>
<clipPath id="mq${uid}"><path d="${d}"/></clipPath>
<g clip-path="url(#mq${uid})"><ellipse cx="${cx}" cy="${f(low + 4)}" rx="${f(w * 0.6)}" ry="${f(h * 0.42)}" fill="${C.tongue}"/><rect x="${f(cx - w)}" y="${f(top - 10)}" width="${f(w * 2)}" height="${f(9 + open * 4)}" fill="${C.white}"/></g>`;
  }
  let uid = 0;

  function eye(cx, cy, open, look, lookY, blink, pupilK, squintLow) {
    const ry = 34 * open * (1 - blink), rx = 28;
    if (ry < 3) return `<path d="M${cx - rx},${cy} Q${cx},${cy + 9} ${cx + rx},${cy}" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>`;
    const px = cx + look * 10, py = cy + lookY * 10 + 3, pr = 16 * (pupilK || 1);
    uid++;
    return `<clipPath id="ec${uid}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(ry)}"/></clipPath>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(ry)}" fill="${C.white}" stroke="${C.ink}" stroke-width="6"/>
<g clip-path="url(#ec${uid})"><circle cx="${f(px)}" cy="${f(py)}" r="${f(pr)}" fill="${C.iris}"/><circle cx="${f(px)}" cy="${f(py)}" r="${f(pr * 0.55)}" fill="${C.ink}"/><circle cx="${f(px + 4)}" cy="${f(py - 5)}" r="4.5" fill="#fff"/>
${squintLow ? `<rect x="${cx - rx}" y="${f(cy + ry * (1 - squintLow * 0.7))}" width="${rx * 2}" height="40" fill="${C.skin}"/>` : ""}</g>
${squintLow ? `<path d="M${cx - rx + 3},${f(cy + ry * (1 - squintLow * 0.7))} Q${cx},${f(cy + ry * (1 - squintLow * 0.7) - 5)} ${cx + rx - 3},${f(cy + ry * (1 - squintLow * 0.7))}" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>` : ""}`;
  }

  function brow(cx, cy, inner, lift, dir) {
    // inner end towards the nose; positive inner = inner end raised (worry)
    const x0 = cx - 26 * dir, x1 = cx + 30 * dir;
    const y0 = cy + lift * 1.3 - inner * 1.25, y1 = cy + lift * 1.3 + inner * 0.45;
    return `<path d="M${f(x0)},${f(y0)} Q${f(cx)},${f(Math.min(y0, y1) - 10)} ${f(x1)},${f(y1)}" fill="none" stroke="${C.hair}" stroke-width="15" stroke-linecap="round"/>`;
  }

  function svg(o = {}) {
    const e = EXPR[o.expr || "neutral"];
    const pose = typeof o.pose === "string" ? POSES[o.pose] : (o.pose || POSES.rest);
    const open = clamp(o.mouth || 0, 0, 1), blink = o.blink || 0, br = o.breathe || 0;
    const look = (o.look ?? 0) + (e.side ? e.side * 0.5 : 0), lookY = (o.lookY ?? 0) - (e.lookUp ? 0.8 : 0);
    const tilt = o.tilt || 0, lean = o.lean || 0, t = o.t || 0;
    uid++;

    // body
    const sy = 1 + br * 0.012;
    let out = `<g transform="rotate(${f(lean)} 300 760)">`;
    out += `<g transform="translate(0 ${f(760 * (1 - sy))}) scale(1 ${sy})">`;
    // hood behind the neck
    out += `<path d="M190,440 Q300,372 410,440 Q420,470 300,476 Q180,470 190,440Z" fill="${C.hoodieShade}" stroke="${C.ink}" stroke-width="7"/>`;
    // torso
    out += `<path d="M168,470 Q176,436 230,430 L370,430 Q424,436 432,470 L470,770 L130,770Z" fill="${C.hoodie}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`;
    out += `<path d="M300,452 L300,520" stroke="${C.ink}" stroke-width="4" opacity=".25"/>`;
    // drawstrings
    out += `<path d="M276,452 q-6,40 -2,72 M324,452 q6,40 2,72" fill="none" stroke="${C.white}" stroke-width="7" stroke-linecap="round"/><circle cx="274" cy="526" r="6" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><circle cx="326" cy="526" r="6" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>`;
    // the Flowra spark on her chest
    out += `<path d="M372,536 Q376,552 392,556 Q376,560 372,576 Q368,560 352,556 Q368,552 372,536Z" fill="#ef6f73" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>`;
    // pocket line
    out += `<path d="M208,640 Q300,624 392,640" fill="none" stroke="${C.ink}" stroke-width="5" opacity=".3"/>`;
    out += `</g>`;

    // neck
    out += `<path d="M270,330 L270,432 Q300,448 330,432 L330,330Z" fill="${C.skinShade}" stroke="${C.ink}" stroke-width="6"/>`;
    out += `<path d="M232,430 Q300,470 368,430" fill="none" stroke="${C.ink}" stroke-width="7"/>`;

    // head group (tilts around the neck)
    out += `<g transform="rotate(${f(tilt)} 300 360)">`;
    // back hair (bob to the jaw)
    out += `<path d="M170,250 Q160,120 300,110 Q440,120 430,250 L436,352 Q420,372 396,360 L398,262 L202,262 L204,360 Q180,372 164,352Z" fill="${C.hair}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`;
    // bun with a pencil through it
    out += `<g transform="rotate(${f(Math.sin(t * 3) * 1.5)} 300 120)"><path d="M232,58 L376,128" stroke="${C.ink}" stroke-width="18" stroke-linecap="round"/><path d="M232,58 L376,128" stroke="${C.pencil}" stroke-width="10" stroke-linecap="round"/><path d="M226,55 l-14,-8 l18,-2Z" fill="${C.pencilWood}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>`;
    out += `<circle cx="300" cy="96" r="54" fill="${C.hair}" stroke="${C.ink}" stroke-width="7"/><path d="M262,84 q30,-26 66,-4" fill="none" stroke="${C.hairHi}" stroke-width="7" stroke-linecap="round"/></g>`;
    // ears
    out += `<ellipse cx="184" cy="258" rx="22" ry="30" fill="${C.skin}" stroke="${C.ink}" stroke-width="6"/><ellipse cx="416" cy="258" rx="22" ry="30" fill="${C.skin}" stroke="${C.ink}" stroke-width="6"/>`;
    out += `<circle cx="182" cy="300" r="11" fill="none" stroke="${C.ink}" stroke-width="9"/><circle cx="182" cy="300" r="11" fill="none" stroke="#f2c14e" stroke-width="4"/><circle cx="418" cy="300" r="11" fill="none" stroke="${C.ink}" stroke-width="9"/><circle cx="418" cy="300" r="11" fill="none" stroke="#f2c14e" stroke-width="4"/>`;
    // face
    out += `<path d="M186,226 Q186,128 300,128 Q414,128 414,226 L412,280 Q404,372 300,384 Q196,372 188,280Z" fill="${C.skin}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`;
    // fringe
    out += `<path d="M186,236 Q176,128 300,124 Q426,128 414,236 Q396,176 340,170 Q350,196 320,206 Q318,178 282,170 Q252,204 214,198 Q232,184 236,166 Q200,184 186,236Z" fill="${C.hair}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>`;
    out += `<path d="M236,150 q36,-20 84,-12" fill="none" stroke="${C.hairHi}" stroke-width="7" stroke-linecap="round"/>`;
    // blush
    if (e.blush) out += `<ellipse cx="226" cy="304" rx="24" ry="13" fill="${C.blush}" opacity="${0.45 * e.blush}"/><ellipse cx="374" cy="304" rx="24" ry="13" fill="${C.blush}" opacity="${0.45 * e.blush}"/>`;
    // eyes, glasses, brows
    const squint = e.smile > 0.6 ? (e.smile - 0.6) * 1.6 : 0;
    out += eye(254, 262, e.eye, look, lookY, blink, e.pupil, squint) + eye(346, 262, e.eye, look, lookY, blink, e.pupil, squint);
    if (o.glasses !== false) out += `<g fill="none" stroke="${C.glasses}" stroke-width="6"><circle cx="252" cy="262" r="47"/><circle cx="348" cy="262" r="47"/><path d="M295,256 q5,-7 10,0"/><path d="M205,254 L188,248 M395,254 L412,248"/></g><path d="M226,236 q10,-8 22,-8" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`;
    out += brow(252, 196, e.brow[0], e.brow[1], 1) + brow(348, 196, e.brow[0], e.brow[1], -1);
    // nose
    out += `<path d="M300,276 q-10,18 0,24" fill="none" stroke="${C.skinShade}" stroke-width="6" stroke-linecap="round"/>`;
    // mouth
    out += mouthPath(e, open, e.side);
    // sweat drop
    if (e.sweat) out += `<path d="M420,190 q-14,22 0,30 q14,-8 0,-30Z" fill="#8fd0ff" stroke="${C.ink}" stroke-width="4" opacity="${e.sweat}" transform="translate(0 ${f((t * 40) % 30)})"/>`;
    out += `</g>`;

    // arms (in front of the body)
    const SL = [190, 470], SR = [410, 470];
    let L = pose.L, R = pose.R;
    if (pose.typing) { L = [L[0] + Math.sin(t * 22) * 6, L[1] + Math.abs(Math.sin(t * 17)) * -8]; R = [R[0] + Math.sin(t * 19 + 1) * 6, R[1] + Math.abs(Math.sin(t * 23 + 2)) * -8]; }
    if (pose.wave) R = [R[0] + Math.sin(t * 10) * 26, R[1]];
    const EL = elbow(SL, L, 150, 150, -1), ER = elbow(SR, R, 150, 150, 1);
    const kindL = pose.kL || "fist", kindR = pose.kR || "fist";
    const armL = sleeve(SL, EL, L) + hand(L, EL, kindL, true);
    const armR = sleeve(SR, ER, R) + prop(o.hold ?? pose.hold, R) + hand(R, ER, kindR, false);
    out += pose.crossed ? armR + armL : armL + armR;
    out += `</g>`;
    return out;
  }

  // ---------- performer: Maya acting over time (same shape as FLOEY.create) ----------
  // M.expr(t, e), M.pose(t, p, d), M.look(t, x, y), M.tiltTo(t, deg), M.leanTo(t, deg), M.say(t, mouth, id),
  // M.nod(t), M.jolt(t) (startled jump), M.slump(t), then M.svg(t). Voice cues go to the shared `cues`
  // array if one is passed (pass Floey's F so the mixer hears both), else M.cues.
  const FPS = 30;
  const hash = (n) => { const x = Math.sin(n * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
  const ease = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

  function create(o = {}) {
    const K = o.scale ?? 1, steps = { expr: [[0, o.expr ?? "neutral"]], pose: [[0, o.pose ?? "rest", 0]], mouth: [[0, null]], hold: [[0, null]] };
    const S = { x: o.x ?? 540, y: o.y ?? 1100, look: 0, lookY: 0, tilt: 0, lean: 0, bob: 0 };
    const tl = gsap.timeline({ paused: true });
    const cues = [];
    const set = (k, t, v, extra) => { steps[k].push(extra === undefined ? [t, v] : [t, v, extra]); steps[k].sort((a, b) => a[0] - b[0]); };
    const at = (k, t) => { let v = steps[k][0]; for (const st of steps[k]) if (st[0] <= t) v = st; else break; return v; };
    const tw = (t, vars) => tl.to(S, vars, t);
    const voice = (t, id, len) => { const c = { t: +t.toFixed(3), kind: "voice", id, len }; if (o.floey) o.floey.sfx(t, "voice", { id, len }); else cues.push(c); };
    const M = {
      S, cues,
      expr(t, e) { set("expr", t, e); return M; },
      pose(t, p, d = 0.32) { set("pose", t, p, d); return M; },
      hold(t, item) { set("hold", t, item); return M; },
      look(t, x = 0, y = 0, d = 0.12) { tw(t, { look: x, lookY: y, duration: d }); return M; },
      tiltTo(t, deg, d = 0.25) { tw(t, { tilt: deg, duration: d, ease: "power2.out" }); return M; },
      leanTo(t, deg, d = 0.35) { tw(t, { lean: deg, duration: d, ease: "power2.out" }); return M; },
      move(t, x, y, d = 0.5) { tw(t, { x, y, duration: d, ease: "power3.inOut" }); return M; },
      say(t, mouth, id = "voice") { set("mouth", t, { start: t, mouth }); set("mouth", t + mouth.length / FPS, null); voice(t, id, mouth.length / FPS); return M; },
      nod(t, n = 2) { for (let i = 0; i < n; i++) { tw(t + i * 0.24, { tilt: 5, duration: 0.1 }); tw(t + i * 0.24 + 0.1, { tilt: 0, duration: 0.14 }); } return M; },
      jolt(t) { tw(t, { bob: -46, duration: 0.12, ease: "power2.out" }); tw(t + 0.12, { bob: 0, duration: 0.45, ease: "bounce.out" }); if (o.floey) o.floey.sfx(t, "pop"); return M; },
      slump(t, d = 0.5) { tw(t, { bob: 26, lean: -3, duration: d, ease: "power2.inOut" }); return M; },
      sit(t, d = 0.4) { tw(t, { bob: 0, lean: 0, duration: d, ease: "power2.out" }); return M; },
      /** The pose at t: blended hands, the current face, talking mouth, blinks and breathing. */
      state(t) {
        tl.seek(Math.max(0, t), false);
        const ps = steps.pose; let i = 0; while (i + 1 < ps.length && ps[i + 1][0] <= t) i++;
        const cur = ps[i], prev = ps[Math.max(0, i - 1)];
        const k = i === 0 ? 1 : Math.min(1, (t - cur[0]) / (cur[2] || 0.001));
        const pose = i === 0 ? cur[1] : mix(prev[1], cur[1], ease(k));
        const m = at("mouth", t)[1];
        let mouth = m ? (m.mouth[Math.round((t - m.start) * FPS)] || 0) : 0;
        const bi = Math.floor(t / 2.7), bt = bi * 2.7 + hash(bi) * 1.4;
        const blink = t > bt && t < bt + 0.12 ? Math.sin((t - bt) / 0.12 * Math.PI) : 0;
        // idle: micro head drift; talking: small head bobs on loud syllables
        const tilt = S.tilt + Math.sin(t * 1.3) * 1.2 + mouth * 2.5;
        return { expr: at("expr", t)[1], pose, mouth, blink, look: S.look, lookY: S.lookY, tilt, lean: S.lean, breathe: Math.sin(t * Math.PI * 2 / 3.4), hold: at("hold", t)[1], t };
      },
      svg(t) {
        const st = M.state(t), f = o.facing === -1 ? -1 : 1;
        return `<g transform="translate(${S.x} ${S.y + S.bob}) scale(${K * f} ${K}) translate(-300 -760)">${svg(st)}</g>`;
      },
      sound() { return cues; },
    };
    if (o.floey) M.cues = null;
    return M;
  }

  window.MAYA = { svg, mix, create, POSES, EXPR, colors: C };
})();
