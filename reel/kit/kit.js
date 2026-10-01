// The scene kit: everything a story reel is drawn with. A scene page loads
// this file, builds its world from these pieces, and defines
// window.render(t) as a pure function of time (seconds).
//
//   Helpers:   el, g, place, p, c01, lerp, ease.*, noise
//   Director:  camera(shots, shakes) -> (t) => {x, y, zoom, rot, blur}
//              applyCamera(layers, cam) moves parallax layers and the world
//   Cast:      robot(), bouncer(), building(), sign(), page(), stamp(),
//              chart(), serp(), terminal(), chip(), check(), cross(),
//              cloud(), person(), phone(), trophy(), clock(), arrow()
//   Reel UI:   captions(t) and progress(t), wired to window.REEL
//
// House look: warm paper, ink outlines 5 to 7 units, orange accent, flat
// colour, rounded shapes. Characters are simple and readable at phone size.
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const K = (window.KIT = {});
  const C = (K.color = { ink: "#211b16", paper: "#fbf7ef", bg: "#f4efe6", orange: "#e0663a", red: "#c9352b", green: "#2f8f5b", teal: "#2f8f83", yellow: "#f2b441", blue: "#3b73c9", purple: "#7a5bc7", grey: "#9aa7ad", sand: "#e7dcc8", skin: "#c98d64" });

  // ---------- basics ----------
  K.c01 = (v) => Math.max(0, Math.min(1, v));
  K.p = (t, a, d) => K.c01((t - a) / d);
  K.lerp = (a, b, k) => a + (b - a) * k;
  K.ease = {
    out: (x) => 1 - Math.pow(1 - x, 3),
    in: (x) => x * x * x,
    io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    back: (x, k = 1.7) => 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2),
    expo: (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    // a damped spring settling on 1: good for pops and landings
    spring: (x, bounce = 0.35) => 1 - Math.exp(-6 * x) * Math.cos(x * Math.PI * (2 + 6 * bounce)),
  };
  // deterministic smooth noise in [-1, 1] (for shake and idle drift)
  K.noise = (x, seed = 0) => {
    const h = (n) => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return h(i) * (1 - u) + h(i + 1) * u;
  };
  K.el = (parent, tag, attrs = {}, text) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text != null) e.textContent = text;
    parent.appendChild(e);
    return e;
  };
  K.g = (parent, attrs) => K.el(parent, "g", attrs);
  K.place = (node, x, y, s = 1, r = 0, o = 1, sx) => {
    node.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${r.toFixed(2)}) scale(${(sx ?? s).toFixed(4)} ${s.toFixed(4)})`);
    node.setAttribute("opacity", K.c01(o).toFixed(3));
  };
  const { el, g, c01, lerp, ease } = K;

  // ---------- the director ----------
  // shots: [{ at, x, y, zoom = 1, rot = 0, move = "ease" | "cut" | "whip" | "push" | "drift", dur }]
  //   at   - when the camera arrives at (or cuts to) this framing
  //   x, y - the world point placed at the frame's focus (540, 760)
  //   move - ease: glide over dur (default .6s) into the shot
  //          cut:  jump at `at`
  //          whip: fast pan (dur .25s) with horizontal motion blur
  //          push: slow push-in during the shot: zoom grows 8% until the next shot
  //          drift: a gentle handheld float during the shot
  // shakes: [{ at, amp = 14, dur = .35 }] - an impact jolt, decaying
  K.FOCUS = { x: 540, y: 760 };
  K.camera = function (shots, shakes = []) {
    const list = shots.slice().sort((a, b) => a.at - b.at);
    return function (t) {
      let i = 0;
      // `at` is when the camera has ARRIVED, so stay on the current shot until
      // then and let the block below glide into the next one over its `dur`.
      while (i + 1 < list.length && t >= list[i + 1].at) i++;
      const cur = list[i], next = list[i + 1];
      let x = cur.x, y = cur.y, zoom = cur.zoom ?? 1, rot = cur.rot ?? 0, blur = 0;
      if (next && next.move !== "cut") {
        const d = next.dur ?? (next.move === "whip" ? 0.25 : 0.6);
        const k = K.p(t, next.at - d, d);
        if (k > 0) {
          const e = next.move === "whip" ? ease.io(k) : ease.io(k);
          x = lerp(x, next.x, e); y = lerp(y, next.y, e); zoom = lerp(zoom, next.zoom ?? 1, e); rot = lerp(rot, next.rot ?? 0, e);
          if (next.move === "whip") blur = Math.sin(Math.PI * k) * 26;
        }
      }
      const end = next ? next.at - (next.dur ?? 0.6) : t + 4;
      if (cur.move === "push") zoom *= 1 + 0.08 * ease.io(K.p(t, cur.at, Math.max(0.5, end - cur.at)));
      if (cur.move === "drift") { x += K.noise(t * 0.5, 1) * 10; y += K.noise(t * 0.5, 2) * 8; rot += K.noise(t * 0.4, 3) * 0.6; }
      for (const s of shakes) {
        const k = K.p(t, s.at, s.dur ?? 0.35);
        if (k > 0 && k < 1) { const a = (s.amp ?? 14) * (1 - k) * (1 - k); x += K.noise(t * 40, 5) * a; y += K.noise(t * 40, 9) * a; rot += K.noise(t * 30, 7) * a * 0.05; }
      }
      return { x, y, zoom, rot, blur };
    };
  };
  // layers: [{ node, depth }] - depth 1 is the world, <1 is far (moves less), >1 is near
  K.applyCamera = function (layers, cam, blurFilter) {
    for (const { node, depth } of layers) {
      const z = 1 + (cam.zoom - 1) * depth;
      const tx = K.FOCUS.x - (cam.x * depth + K.FOCUS.x * (1 - depth)) * z;
      const ty = K.FOCUS.y - (cam.y * depth + K.FOCUS.y * (1 - depth)) * z;
      node.setAttribute("transform", `rotate(${cam.rot.toFixed(3)} ${K.FOCUS.x} ${K.FOCUS.y}) translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${z.toFixed(4)})`);
    }
    if (blurFilter) blurFilter.setAttribute("stdDeviation", `${cam.blur.toFixed(1)} 0`);
  };
  // the defs every scene needs (dots paper texture and the whip-pan blur)
  K.stage = function (svg) {
    const defs = el(svg, "defs");
    const pat = el(defs, "pattern", { id: "kdots", width: 36, height: 36, patternUnits: "userSpaceOnUse" });
    el(pat, "circle", { cx: 2, cy: 2, r: 2, fill: "#e6dccb" });
    const f = el(defs, "filter", { id: "kwhip", x: "-10%", y: "-10%", width: "120%", height: "120%" });
    const blur = el(f, "feGaussianBlur", { stdDeviation: "0 0" });
    el(svg, "rect", { width: 1080, height: 1920, fill: C.bg });
    el(svg, "rect", { width: 1080, height: 1920, fill: "url(#kdots)", opacity: 0.7 });
    const cameraRoot = g(svg, { filter: "url(#kwhip)" });
    const far = g(cameraRoot), world = g(cameraRoot), near = g(cameraRoot);
    const overlay = g(svg);
    return { far, world, near, overlay, blur };
  };

  // ---------- cast ----------
  // Every character is drawn around its feet at (0, 0), facing the viewer.
  K.robot = function (parent, color = C.teal, tag = "") {
    const root = g(parent), body = g(root);
    const legL = el(body, "rect", { x: -32, y: -46, width: 22, height: 46, rx: 9, fill: C.ink });
    const legR = el(body, "rect", { x: 10, y: -46, width: 22, height: 46, rx: 9, fill: C.ink });
    const torso = g(body);
    el(torso, "rect", { x: -52, y: -140, width: 104, height: 100, rx: 22, fill: color, stroke: C.ink, "stroke-width": 6 });
    const armL = el(torso, "rect", { x: -70, y: -128, width: 20, height: 62, rx: 10, fill: color, stroke: C.ink, "stroke-width": 5 });
    const armR = el(torso, "rect", { x: 50, y: -128, width: 20, height: 62, rx: 10, fill: color, stroke: C.ink, "stroke-width": 5 });
    if (tag) {
      el(torso, "rect", { x: -44, y: -118, width: 88, height: 30, rx: 7, fill: "#fff", stroke: C.ink, "stroke-width": 3 });
      el(torso, "text", { x: 0, y: -97, "text-anchor": "middle", "font-size": tag.length > 11 ? 12 : 15, "font-family": "IBM Plex Mono", fill: C.ink }, tag);
    }
    const head = g(body);
    el(head, "line", { x1: 0, y1: -222, x2: 0, y2: -250, stroke: C.ink, "stroke-width": 6, "stroke-linecap": "round" });
    const bulb = el(head, "circle", { cx: 0, cy: -256, r: 11, fill: C.yellow, stroke: C.ink, "stroke-width": 5 });
    el(head, "rect", { x: -58, y: -226, width: 116, height: 90, rx: 26, fill: C.ink });
    el(head, "rect", { x: -46, y: -214, width: 92, height: 66, rx: 18, fill: "#2d3a3a" });
    const eyeL = el(head, "ellipse", { cx: -20, cy: -184, rx: 10, ry: 12, fill: "#9ff0e2" });
    const eyeR = el(head, "ellipse", { cx: 20, cy: -184, rx: 10, ry: 12, fill: "#9ff0e2" });
    const mouth = el(head, "path", { d: "M -14 -162 q 14 10 28 0", fill: "none", stroke: "#9ff0e2", "stroke-width": 5, "stroke-linecap": "round" });
    const r = { root, body, legL, legR, armL, armR, head, eyeL, eyeR, mouth, bulb, torso };
    // pose: walk (phase), moving, mood (1 happy .. -1 sad), wave, lean (deg), look (-1 left .. 1 right)
    r.pose = function ({ t = 0, walk = 0, moving = false, mood = 1, wave = 0, lean = 0, look = 0, surprise = 0 } = {}) {
      const sw = moving ? Math.sin(walk * Math.PI * 2) : 0;
      legL.setAttribute("transform", `rotate(${(sw * 22).toFixed(1)} -21 -46)`);
      legR.setAttribute("transform", `rotate(${(-sw * 22).toFixed(1)} 21 -46)`);
      const bob = moving ? Math.abs(Math.sin(walk * Math.PI * 2)) * -8 : Math.sin(t * 2.2) * 2;
      body.setAttribute("transform", `translate(0 ${bob.toFixed(1)}) rotate(${lean.toFixed(1)} 0 -20)`);
      armL.setAttribute("transform", `rotate(${(surprise ? 150 : -sw * 25).toFixed(1)} -60 -124)`);
      armR.setAttribute("transform", `rotate(${(wave ? -150 + Math.sin(t * 14) * 25 : surprise ? -150 : sw * 25).toFixed(1)} 60 -124)`);
      const blink = t % 3.1 < 0.12 ? 0.15 : 1;
      const big = 1 + 0.35 * surprise;
      [eyeL, eyeR].forEach((e, i) => { e.setAttribute("ry", (12 * blink * big).toFixed(1)); e.setAttribute("rx", (10 * big).toFixed(1)); e.setAttribute("cx", ((i ? 20 : -20) + look * 6).toFixed(1)); });
      const m = mood * 10;
      mouth.setAttribute("d", surprise > 0.5 ? "M -8 -166 a 8 9 0 1 0 16 0 a 8 9 0 1 0 -16 0" : `M -14 ${(-162 - m * 0.3).toFixed(1)} q 14 ${m.toFixed(1)} 28 0`);
      bulb.setAttribute("fill", mood < 0 ? "#9b8f84" : C.yellow);
    };
    return r;
  };

  // a person: simple, friendly, readable. shirt colour and an optional label
  K.person = function (parent, shirt = C.blue, label = "") {
    const root = g(parent), body = g(root);
    const legL = el(body, "rect", { x: -28, y: -80, width: 24, height: 80, rx: 10, fill: "#3a312a" });
    const legR = el(body, "rect", { x: 4, y: -80, width: 24, height: 80, rx: 10, fill: "#3a312a" });
    el(body, "rect", { x: -50, y: -210, width: 100, height: 140, rx: 36, fill: shirt, stroke: C.ink, "stroke-width": 6 });
    const armL = el(body, "rect", { x: -66, y: -196, width: 22, height: 90, rx: 11, fill: shirt, stroke: C.ink, "stroke-width": 5 });
    const armR = el(body, "rect", { x: 44, y: -196, width: 22, height: 90, rx: 11, fill: shirt, stroke: C.ink, "stroke-width": 5 });
    if (label) el(body, "text", { x: 0, y: -140, "text-anchor": "middle", "font-size": 18, "font-family": "Space Grotesk", "font-weight": 700, fill: "#fff" }, label);
    const head = g(body);
    el(head, "circle", { cx: 0, cy: -262, r: 52, fill: C.skin, stroke: C.ink, "stroke-width": 6 });
    el(head, "path", { d: "M -52 -270 q 10 -60 52 -58 q 44 -2 52 58 q -26 -26 -52 -22 q -30 -4 -52 22 z", fill: C.ink });
    const eyeL = el(head, "circle", { cx: -18, cy: -262, r: 6, fill: C.ink });
    const eyeR = el(head, "circle", { cx: 18, cy: -262, r: 6, fill: C.ink });
    const mouth = el(head, "path", { d: "M -16 -236 q 16 12 32 0", fill: "none", stroke: C.ink, "stroke-width": 5, "stroke-linecap": "round" });
    const r = { root, body, armL, armR, mouth };
    r.pose = function ({ t = 0, walk = 0, moving = false, mood = 1, wave = 0, surprise = 0, point = 0 } = {}) {
      const sw = moving ? Math.sin(walk * Math.PI * 2) : 0;
      legL.setAttribute("transform", `rotate(${(sw * 20).toFixed(1)} -16 -80)`);
      legR.setAttribute("transform", `rotate(${(-sw * 20).toFixed(1)} 16 -80)`);
      const bob = moving ? Math.abs(Math.sin(walk * Math.PI * 2)) * -7 : Math.sin(t * 2) * 1.5;
      body.setAttribute("transform", `translate(0 ${bob.toFixed(1)})`);
      armL.setAttribute("transform", `rotate(${(surprise ? 160 : -sw * 22).toFixed(1)} -55 -190)`);
      armR.setAttribute("transform", `rotate(${(wave ? -150 + Math.sin(t * 14) * 25 : surprise ? -160 : point ? -90 : sw * 22).toFixed(1)} 55 -190)`);
      const blink = t % 2.9 < 0.1 ? 0.2 : 1;
      [eyeL, eyeR].forEach((e) => e.setAttribute("r", (6 * (1 + 0.4 * surprise) * (blink < 1 ? 0.3 : 1)).toFixed(1)));
      const m = mood * 12;
      mouth.setAttribute("d", surprise > 0.5 ? "M -9 -238 a 9 10 0 1 0 18 0 a 9 10 0 1 0 -18 0" : `M -16 ${(-236 - m * 0.3).toFixed(1)} q 16 ${m.toFixed(1)} 32 0`);
    };
    return r;
  };

  K.bouncer = function (parent, label = "WEB HOST") {
    const root = g(parent), body = g(root);
    el(body, "rect", { x: -62, y: -90, width: 48, height: 90, rx: 14, fill: "#2b241f" });
    el(body, "rect", { x: 14, y: -90, width: 48, height: 90, rx: 14, fill: "#2b241f" });
    el(body, "rect", { x: -100, y: -350, width: 200, height: 275, rx: 46, fill: C.ink });
    el(body, "path", { d: "M -30 -350 L 0 -300 L 30 -350 Z", fill: "#fff" });
    el(body, "text", { x: 0, y: -236, "text-anchor": "middle", "font-size": label.length > 9 ? 24 : 30, "font-family": "Space Grotesk", "font-weight": 700, fill: "#fff" }, label);
    el(body, "rect", { x: -108, y: -206, width: 216, height: 50, rx: 25, fill: "#3a312a", stroke: C.ink, "stroke-width": 4 });
    el(body, "rect", { x: -58, y: -460, width: 116, height: 118, rx: 40, fill: C.skin, stroke: C.ink, "stroke-width": 6 });
    el(body, "rect", { x: -52, y: -420, width: 104, height: 28, rx: 12, fill: C.ink });
    el(body, "path", { d: "M -20 -372 h 40", stroke: C.ink, "stroke-width": 6, "stroke-linecap": "round" });
    return { root, body };
  };

  // a shop-front building with a sign and a door hinged on its left edge
  K.building = function (parent, name = "yoursite.com", accent = C.orange) {
    const root = g(parent);
    el(root, "rect", { x: -240, y: -490, width: 480, height: 490, rx: 14, fill: C.paper, stroke: C.ink, "stroke-width": 7 });
    el(root, "rect", { x: -205, y: -550, width: 410, height: 88, rx: 16, fill: C.ink });
    el(root, "text", { x: 0, y: -492, "text-anchor": "middle", fill: "#fff", "font-size": name.length > 14 ? 34 : 40, "font-family": "Space Grotesk", "font-weight": 700 }, name);
    for (let i = 0; i < 8; i++) el(root, "path", { d: `M ${-240 + i * 60} -450 h 60 v 48 q -30 18 -60 0 z`, fill: i % 2 ? C.paper : accent, stroke: C.ink, "stroke-width": 5 });
    el(root, "rect", { x: -205, y: -350, width: 90, height: 110, rx: 10, fill: "#cfe3e0", stroke: C.ink, "stroke-width": 6 });
    el(root, "rect", { x: 115, y: -350, width: 90, height: 110, rx: 10, fill: "#cfe3e0", stroke: C.ink, "stroke-width": 6 });
    el(root, "rect", { x: -75, y: -245, width: 150, height: 245, rx: 10, fill: "#3a2f27", stroke: C.ink, "stroke-width": 7 });
    const hinge = g(root);
    el(hinge, "rect", { x: 0, y: 0, width: 150, height: 245, rx: 10, fill: accent, stroke: C.ink, "stroke-width": 7 });
    el(hinge, "circle", { cx: 122, cy: 128, r: 9, fill: C.ink });
    return { root, door: (open) => hinge.setAttribute("transform", `translate(-75 -245) scale(${(1 - 0.85 * c01(open)).toFixed(3)} 1)`) };
  };

  // a sign on a post: title + up to three short lines
  K.sign = function (parent, title, lines = [], w = 240) {
    const root = g(parent);
    el(root, "rect", { x: -6, y: -330, width: 12, height: 330, fill: C.ink, rx: 6 });
    const board = g(root);
    const h = 60 + lines.length * 36;
    el(board, "rect", { x: -w / 2, y: -h / 2 - 20, width: w, height: h, rx: 14, fill: "#fff", stroke: C.ink, "stroke-width": 6 });
    el(board, "text", { x: -w / 2 + 24, y: -h / 2 + 22, "font-size": 30, "font-family": "Space Grotesk", "font-weight": 700, fill: C.ink }, title);
    lines.forEach((l, i) => el(board, "text", { x: -w / 2 + 24, y: -h / 2 + 60 + i * 34, "font-size": 21, "font-family": "IBM Plex Mono", fill: "#5c5047" }, l));
    return { root, board };
  };

  // a document with a label (a page, a post, a request)
  K.page = function (parent, label = "", color = "#fff") {
    const root = g(parent);
    el(root, "path", { d: "M -34 -44 h 46 l 22 22 v 66 h -68 z", fill: color, stroke: C.ink, "stroke-width": 5 });
    for (let i = 0; i < 3; i++) el(root, "rect", { x: -22, y: -18 + i * 13, width: i === 2 ? 26 : 44, height: 5, rx: 2.5, fill: "#d8cdbb" });
    if (label) el(root, "text", { x: 0, y: 70, "text-anchor": "middle", "font-size": 20, "font-family": "IBM Plex Mono", fill: C.ink }, label);
    return { root };
  };

  K.check = function (parent) { const root = g(parent); el(root, "circle", { r: 30, fill: C.green, stroke: C.ink, "stroke-width": 5 }); el(root, "path", { d: "M -13 1 l 9 10 l 18 -20", fill: "none", stroke: "#fff", "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" }); return { root }; };
  K.cross = function (parent) { const root = g(parent); el(root, "path", { d: "M -26 -26 L 26 26 M 26 -26 L -26 26", stroke: C.red, "stroke-width": 11, "stroke-linecap": "round" }); return { root }; };

  // a stamp: big text in a frame, like a rubber stamp
  K.stamp = function (parent, text, sub = "", color = C.red) {
    const root = g(parent);
    const w = Math.max(360, text.length * 90 + 80);
    el(root, "rect", { x: -w / 2, y: -120, width: w, height: 240, rx: 30, fill: "rgba(255,255,255,.93)", stroke: color, "stroke-width": 16 });
    el(root, "text", { x: 0, y: sub ? 42 : 55, "text-anchor": "middle", "font-size": 150, "font-family": "Space Grotesk", "font-weight": 700, fill: color }, text);
    if (sub) el(root, "text", { x: 0, y: 96, "text-anchor": "middle", "font-size": 34, "font-family": "IBM Plex Mono", fill: color }, sub);
    return { root };
  };

  // a line chart that draws itself; values 0..1, n points; `draw` 0..1
  K.chart = function (parent, values, { w = 700, h = 380, color = C.orange, label = "" } = {}) {
    const root = g(parent);
    el(root, "rect", { x: -w / 2 - 30, y: -h - 40, width: w + 60, height: h + 90, rx: 24, fill: "#fff", stroke: C.ink, "stroke-width": 6 });
    for (let i = 1; i < 4; i++) el(root, "line", { x1: -w / 2, x2: w / 2, y1: -h + (i * h) / 4 - 10, y2: -h + (i * h) / 4 - 10, stroke: "#efe8dc", "stroke-width": 3 });
    const pts = values.map((v, i) => [-w / 2 + (i * w) / (values.length - 1), -10 - v * (h - 30)]);
    const d = pts.map((q, i) => `${i ? "L" : "M"} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
    const line = el(root, "path", { d, fill: "none", stroke: color, "stroke-width": 12, "stroke-linecap": "round", "stroke-linejoin": "round" });
    const dot = el(root, "circle", { r: 16, fill: color, stroke: C.ink, "stroke-width": 5 });
    if (label) el(root, "text", { x: -w / 2, y: -h - 60, "font-size": 34, "font-family": "Space Grotesk", "font-weight": 700, fill: C.ink }, label);
    let len = 0;
    return {
      root,
      draw(k) {
        if (!len) { len = line.getTotalLength(); line.setAttribute("stroke-dasharray", len.toFixed(1)); }
        line.setAttribute("stroke-dashoffset", (len * (1 - c01(k))).toFixed(1));
        const at = line.getPointAtLength(len * c01(k));
        dot.setAttribute("cx", at.x.toFixed(1)); dot.setAttribute("cy", at.y.toFixed(1));
        dot.setAttribute("opacity", k > 0.01 ? 1 : 0);
      },
    };
  };

  // a Google-style results page with ranked results; move(i, pos) slides a result to a rank
  K.serp = function (parent, results, { w = 760, query = "" } = {}) {
    const root = g(parent);
    const rowH = 118;
    el(root, "rect", { x: -w / 2, y: -80, width: w, height: 110 + results.length * rowH, rx: 26, fill: "#fff", stroke: C.ink, "stroke-width": 6 });
    el(root, "rect", { x: -w / 2 + 30, y: -54, width: w - 60, height: 58, rx: 29, fill: "#f3efe8", stroke: "#d9cfbf", "stroke-width": 3 });
    el(root, "text", { x: -w / 2 + 64, y: -15, "font-size": 26, "font-family": "Public Sans", fill: "#5c5047" }, query);
    const rows = results.map((r, i) => {
      const row = g(root);
      el(row, "rect", { x: -w / 2 + 24, y: 0, width: w - 48, height: rowH - 18, rx: 16, fill: r.highlight ? "#fdeee6" : "#fff", stroke: r.highlight ? C.orange : "#efe8dc", "stroke-width": 4 });
      el(row, "text", { x: -w / 2 + 50, y: 40, "font-size": 20, "font-family": "IBM Plex Mono", fill: "#5c8a4f" }, r.url);
      el(row, "text", { x: -w / 2 + 50, y: 78, "font-size": 30, "font-family": "Public Sans", "font-weight": 700, fill: "#2b4ea2" }, r.title);
      return row;
    });
    const pos = results.map((_, i) => i);
    return {
      root,
      rowH,
      // put result i at (fractional) rank r, 0 = top
      set(i, r) { pos[i] = r; },
      layout() { rows.forEach((row, i) => row.setAttribute("transform", `translate(0 ${(40 + pos[i] * rowH).toFixed(1)})`)); },
    };
  };

  // a terminal window; type(k) reveals the command, show(k) the answer
  K.terminal = function (parent, command, answer, { answerColor = "#ff7a6b", note = "" } = {}) {
    const root = g(parent);
    el(root, "rect", { x: -470, y: -260, width: 940, height: 520, rx: 30, fill: "#1b1714", stroke: C.ink, "stroke-width": 6 });
    el(root, "rect", { x: -470, y: -260, width: 940, height: 70, rx: 30, fill: "#2c2622" });
    ["#e5645a", "#f2b441", "#58b86f"].forEach((c, i) => el(root, "circle", { cx: -420 + i * 38, cy: -225, r: 12, fill: c }));
    const lines = command.map((_, i) => el(root, "text", { x: -420, y: -120 + i * 60, "font-size": 40, "font-family": "IBM Plex Mono", fill: "#e8e2d9" }, ""));
    const ans = el(root, "text", { x: -420, y: 50, "font-size": 64, "font-family": "Space Grotesk", "font-weight": 700, fill: answerColor }, answer);
    const n = el(root, "text", { x: -420, y: 150, "font-size": 34, "font-family": "IBM Plex Mono", fill: "#a89e92" }, note);
    const total = command.reduce((a, l) => a + l.length, 0);
    return {
      root,
      type(k) { let left = Math.floor(c01(k) * total); command.forEach((l, i) => { lines[i].textContent = l.slice(0, Math.max(0, left)); left -= l.length; }); },
      show(k) { ans.setAttribute("opacity", c01(k * 3)); ans.setAttribute("transform", `translate(0 ${(20 * (1 - ease.back(c01(k), 2))).toFixed(1)})`); n.setAttribute("opacity", c01((k - 0.5) * 2)); },
    };
  };

  // a result chip: a label and a coloured code, e.g. GPTBot/1.2 -> 429
  K.chip = function (parent, label, code, color) {
    const root = g(parent);
    el(root, "rect", { x: -225, y: -110, width: 450, height: 220, rx: 28, fill: "#fff", stroke: C.ink, "stroke-width": 7 });
    el(root, "text", { x: 0, y: -40, "text-anchor": "middle", "font-size": 40, "font-family": "IBM Plex Mono", fill: C.ink }, label);
    el(root, "rect", { x: -120, y: 0, width: 240, height: 84, rx: 42, fill: color });
    el(root, "text", { x: 0, y: 58, "text-anchor": "middle", "font-size": 56, "font-family": "Space Grotesk", "font-weight": 700, fill: "#fff" }, code);
    return { root };
  };

  K.cloud = function (parent) {
    const root = g(parent);
    el(root, "path", { d: "M -60 0 a 30 30 0 0 1 20 -45 a 38 38 0 0 1 70 -5 a 28 28 0 0 1 30 50 z", fill: C.grey, stroke: C.ink, "stroke-width": 5 });
    const drops = [-35, 0, 35].map((x) => el(root, "rect", { x, y: 14, width: 7, height: 22, rx: 3.5, fill: "#6d8fa6" }));
    return { root, rain: (t) => drops.forEach((d, i) => d.setAttribute("transform", `translate(0 ${((t * 90 + i * 17) % 40).toFixed(1)})`)) };
  };

  // a phone showing a feed; `scroll` 0..1 moves the posts
  K.phone = function (parent, posts = 4) {
    const root = g(parent);
    el(root, "rect", { x: -170, y: -340, width: 340, height: 680, rx: 50, fill: C.ink });
    el(root, "rect", { x: -150, y: -310, width: 300, height: 620, rx: 34, fill: "#fff" });
    const clip = `kphone${Math.random().toString(36).slice(2, 7)}`;
    const cp = el(el(root, "defs"), "clipPath", { id: clip });
    el(cp, "rect", { x: -150, y: -310, width: 300, height: 620, rx: 34 });
    const feed = g(g(root, { "clip-path": `url(#${clip})` }));
    for (let i = 0; i < posts; i++) { el(feed, "rect", { x: -130, y: -290 + i * 200, width: 260, height: 180, rx: 18, fill: ["#fdeee6", "#e3f1e7", "#ebe4fa", "#fbe9cc"][i % 4] }); }
    return { root, scroll: (k) => feed.setAttribute("transform", `translate(0 ${(-k * 200 * (posts - 3)).toFixed(1)})`) };
  };

  K.clock = function (parent) {
    const root = g(parent);
    el(root, "circle", { r: 90, fill: "#fff", stroke: C.ink, "stroke-width": 8 });
    for (let i = 0; i < 12; i++) el(root, "rect", { x: -3, y: -80, width: 6, height: 14, rx: 3, fill: C.ink, transform: `rotate(${i * 30})` });
    const hand = el(root, "rect", { x: -4, y: -70, width: 8, height: 74, rx: 4, fill: C.red });
    el(root, "circle", { r: 9, fill: C.ink });
    return { root, set: (k) => hand.setAttribute("transform", `rotate(${(k * 360).toFixed(1)})`) };
  };

  K.trophy = function (parent) {
    const root = g(parent);
    el(root, "path", { d: "M -60 -150 h 120 v 40 a 60 60 0 0 1 -120 0 z", fill: C.yellow, stroke: C.ink, "stroke-width": 6 });
    el(root, "rect", { x: -12, y: -52, width: 24, height: 36, fill: C.yellow, stroke: C.ink, "stroke-width": 5 });
    el(root, "rect", { x: -48, y: -18, width: 96, height: 22, rx: 6, fill: C.ink });
    return { root };
  };

  K.arrow = function (parent, color = C.orange) {
    const root = g(parent);
    const path = el(root, "path", { d: "M -120 0 Q 0 -80 110 0", fill: "none", stroke: color, "stroke-width": 12, "stroke-linecap": "round" });
    const head = el(root, "path", { d: "M 80 -26 L 118 2 L 76 22", fill: "none", stroke: color, "stroke-width": 12, "stroke-linecap": "round", "stroke-linejoin": "round" });
    let len = 0;
    return { root, draw(k) { if (!len) { len = path.getTotalLength(); path.setAttribute("stroke-dasharray", len); } path.setAttribute("stroke-dashoffset", (len * (1 - c01(k))).toFixed(1)); head.setAttribute("opacity", k > 0.95 ? 1 : 0); } };
  };

  // the Flowra lockup for the last beat
  K.lockup = function (parent, line = "One fix a week") {
    const root = g(parent);
    el(root, "path", { d: "M 24 2 C 25.2 16.5 27.5 22 44 24 C 28 25.5 25.2 30.5 24 42 C 22.8 30.5 20.5 25.5 6 24 C 20.5 22 22.8 16.5 24 2 Z", transform: "translate(-330 -150) scale(3.4)", fill: C.orange, stroke: C.ink, "stroke-width": 1.8, "stroke-linejoin": "round" });
    el(root, "text", { x: 60, y: -40, "text-anchor": "middle", "font-size": 150, "font-family": "Space Grotesk", "font-weight": 700, fill: C.ink }, "Flowra");
    el(root, "text", { x: 0, y: 70, "text-anchor": "middle", "font-size": 50, "font-family": "Space Grotesk", "font-weight": 700, fill: C.orange }, line);
    el(root, "text", { x: 0, y: 140, "text-anchor": "middle", "font-size": 40, "font-family": "IBM Plex Mono", fill: "#8a4f06" }, "useflowra.com");
    return { root };
  };

  // ---------- reel UI: captions and progress, from window.REEL ----------
  K.reelUI = function () {
    const style = document.createElement("style");
    style.textContent = `#kcap{position:absolute;left:540px;top:1400px;max-width:880px;padding:20px 34px 24px;border-radius:26px;background:rgba(33,27,22,.93);color:#fff;font:800 58px/1.12 "Public Sans",sans-serif;text-align:center;white-space:nowrap;opacity:0}#kcap span{display:inline-block;margin:0 .12em}#kcap span.on{color:#ffb37a}#kbar{position:absolute;left:0;top:0;height:10px;width:1080px;background:${C.orange};transform-origin:0 0}`;
    document.head.appendChild(style);
    const cap = document.createElement("div"); cap.id = "kcap"; document.body.appendChild(cap);
    const bar = document.createElement("div"); bar.id = "kbar"; document.body.appendChild(bar);
    const B = window.REEL.timeline.beats;
    let key = "";
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    return function (t) {
      bar.style.transform = `scaleX(${c01(t / window.REEL.timeline.duration)})`;
      let chunk = null, opens = false;
      // `opens` marks the first chunk of a beat: only that one fades up. A chunk
      // that replaces another swaps at full opacity, so no frame of a running
      // caption is ever drawn half transparent (grey on dark, unreadable).
      for (const b of B) b.chunks.forEach((c, i) => { const until = i + 1 < b.chunks.length ? b.chunks[i + 1].start : b.end - 0.15; if (t >= c.start && t < until) { chunk = c; opens = i === 0; } });
      if (!chunk) { cap.style.opacity = 0; return; }
      if (chunk.start + "" !== key) {
        cap.innerHTML = chunk.words.map((w) => `<span>${esc(w)}</span>`).join("");
        key = chunk.start + "";
        cap.style.transform = "none";
        for (const s of [58, 52, 46, 42]) { cap.style.fontSize = s + "px"; if (cap.offsetWidth <= 880) break; }
      }
      let on = 0;
      chunk.wordStarts.forEach((s, i) => { if (t >= s) on = i; });
      [...cap.children].forEach((s, i) => s.classList.toggle("on", i === on));
      cap.style.opacity = opens ? c01(K.p(t, chunk.start, 0.09)) : 1;
      cap.style.transform = `translate(-50%, 0) scale(${0.92 + 0.08 * ease.back(K.p(t, chunk.start, 0.14), 2)})`;
    };
  };
  // beat timing helpers: S(i) start, E(i) end, SE(i) when the words end
  K.beats = () => { const B = window.REEL.timeline.beats; return { S: (i) => B[i].start, E: (i) => B[i].end, SE: (i) => B[i].spokenEnd, D: window.REEL.timeline.duration }; };
})();
