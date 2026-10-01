// Floey's behaviours. A scene builds one Floey, calls behaviours at times
// (dart, brake, preen, pick, sip, shuttle...), then draws F.svg(t) each frame.
// Every behaviour also adds sound cues; F.sound() returns them plus a
// per-frame track (position, speed, flying) for the wing hum and stereo pan.
//
// Needs gsap (with CustomEase) and hum.js loaded first.
(function () {
  const FPS = 30;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const noise = (t, seed) => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return (hash(i + seed * 57) * (1 - u) + hash(i + 1 + seed * 57) * u) * 2 - 1; };

  function create(o = {}) {
    const K = o.scale ?? 1.6; // drawing scale of the 300-unit bird
    const S = { x: o.x ?? 540, y: o.y ?? 900, rot: 0, sx: 1, sy: 1, tail: 0.15, tailAngle: 0, crest: 0.2, flash: 0, beakAdd: 0, tongue: 0, tilt: 0, lookX: 0, lookY: 0, squint: 0, puff: 0, feetOut: o.perched ? 1 : 0 };
    const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    const steps = { view: [[0, o.view ?? "side"]], facing: [[0, o.facing ?? 1]], mood: [[0, o.mood ?? "hello"]], wing: [[0, o.perched ? "fold" : "blur"]], perched: [[0, !!o.perched]], hold: [[0, null]], mouth: [[0, null]], moving: [[0, false]] };
    const cues = [], events = [];
    let end = 0;
    const set = (key, t, v) => { steps[key].push([t, v]); steps[key].sort((a, b) => a[0] - b[0]); end = Math.max(end, t); };
    const at = (key, t) => { let v = steps[key][0][1]; for (const [s, x] of steps[key]) if (s <= t) v = x; else break; return v; };
    const cue = (t, kind, extra = {}) => { cues.push({ t: +t.toFixed(3), kind, ...extra }); end = Math.max(end, t); };
    const tw = (t, vars) => { tl.to(S, vars, t); end = Math.max(end, t + (vars.duration ?? 0.5)); };
    const snap = (t) => { tl.seek(clamp(t, 0, tl.duration()), false); return { ...S }; };

    // where the beak tip lands in the world for a given state (side view)
    function beakOffset(st, f) {
      const lean = (at("wing", 0) === "blur" ? -16 : -6) * Math.PI / 180;
      let x = -116 * 0.92, y = -44;
      [x, y] = [x * Math.cos(lean) - y * Math.sin(lean), x * Math.sin(lean) + y * Math.cos(lean)];
      x *= f * K * st.sx; y *= K * st.sy;
      const r = st.rot * -f * Math.PI / 180;
      return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
    }

    const F = {
      S, tl, K, events,
      mood(t, m) { set("mood", t, m); return F; },
      move(t, x, y, d = 0.45, ease = "power3.out") { set("moving", t, true); set("moving", t + d, false); tw(t, { x, y, duration: d, ease }); return F; },
      sfx(t, kind, extra = {}) { cue(t, kind, extra); return F; },
      look(t, x = 0, y = 0, d = 0.08) { tw(t, { lookX: x, lookY: y, duration: d }); return F; },
      tiltTo(t, deg, d = 0.2) { tw(t, { tilt: deg, duration: d }); return F; },
      face(t, f) { if (at("facing", t) !== f) { set("facing", t, f); cue(t, "tk"); } return F; },
      view(t, v) { set("view", t, v); return F; },

      /** Snap round to a new view the way hummingbirds pivot: through three-quarter in 2 frames. */
      pivot(t, v) {
        const from = at("view", t);
        if (from === v) return F;
        if ((from === "side" && v === "front") || (from === "front" && v === "side")) { set("view", t, "three"); set("view", t + 2 / FPS, v); } else set("view", t, v);
        tw(t, { sx: 1.07, sy: 1.07, duration: 0.07 }); tw(t + 0.07, { sx: 1, sy: 1, duration: 0.3, ease: "back.out(3)" });
        cue(t, "tk");
        return F;
      },

      /** Dart to (x, y): a small lean back first, a stretched zip, then hand over to brake(). */
      dart(t, x, y, d = 0.3, facing) {
        const from = snap(t - 0.2), f = facing ?? (x < from.x ? 1 : -1);
        F.face(t - 0.2, f);
        set("moving", t - 0.2, true); set("moving", t + d + 0.1, false);
        tw(t - 0.2, { x: from.x + f * 26, rot: 12, sx: 0.9, sy: 1.08, duration: 0.18, ease: "power1.in" });
        tw(t, { x, y, rot: -6, sx: 1.32, sy: 0.84, duration: d, ease: "dart" });
        cue(t - 0.02, "zip", { d, x0: from.x, x1: x });
        F.brake(t + d);
        return F;
      },
      /** Reach a world point with the beak tip (for sips and picks). */
      reach(t, px, py, d = 0.32) {
        const f = px < snap(t).x ? 1 : -1, st = { ...snap(t + d + 0.5), rot: 14, sx: 1, sy: 1 };
        const [ox, oy] = beakOffset(st, f);
        return F.dart(t, px - ox, py - oy, d, f).tiltTo(t + d, 0, 0.1);
      },
      brake(t) {
        tw(t, { tail: 1, sx: 1, sy: 1, duration: 0.18 });
        tw(t, { rot: -20, duration: 0.11 });
        tw(t + 0.11, { rot: 0, duration: 0.5, ease: "elastic.out(1,.45)" });
        tw(t + 0.35, { tail: 0.15, duration: 0.4 });
        cue(t, "brrt");
        return F;
      },
      takeoff(t) {
        set("perched", t, false); set("wing", t, "blur");
        tw(t, { feetOut: 0, duration: 0.2 });
        tw(t, { y: S.y - 70, sy: 1.06, duration: 0.35, ease: "back.out(1.6)" });
        tw(t + 0.2, { sy: 1, duration: 0.2 });
        cue(t, "flutter");
        return F;
      },
      /** Fly in and land with feet first: feet drop, tail brakes, a squash on contact, wings fold. */
      land(t, x, y, d = 0.5) {
        set("moving", t, true); set("moving", t + d, false);
        tw(t, { x, y: y - 6, duration: d, ease: "power3.out" });
        tw(t + d * 0.4, { feetOut: 1, tail: 0.9, duration: d * 0.5 });
        tw(t + d, { y, sy: 0.9, sx: 1.05, duration: 0.07, ease: "power1.in" });
        tw(t + d + 0.07, { sy: 1, sx: 1, duration: 0.35, ease: "elastic.out(1,.4)" });
        tw(t + d + 0.2, { tail: 0.15, duration: 0.3 });
        set("perched", t + d, true); set("wing", t + d + 0.12, "fold");
        cue(t + d, "tap"); cue(t + d + 0.12, "rustle", { n: 1 });
        return F;
      },
      /** Run the beak through the chest feathers a few times, feathers fluff, then a tongue flick. */
      preen(t, d = 1.0) {
        set("wing", t, "fold");
        tw(t, { tilt: 34, lookY: 1, duration: 0.18 });
        const n = 3;
        for (let i = 0; i < n; i++) {
          const s = t + 0.2 + (i * (d - 0.4)) / n;
          tw(s, { tilt: 46, puff: 0.5, duration: 0.09, ease: "power1.in" });
          tw(s + 0.09, { tilt: 34, puff: 0.2, duration: 0.14 });
          cue(s, "rustle", { n: 1 });
        }
        tw(t + d - 0.15, { tilt: 0, lookY: 0, puff: 0, duration: 0.2, ease: "back.out(2)" });
        return F.tongue(t + d + 0.1, 2);
      },
      tongue(t, n = 3) {
        for (let i = 0; i < n; i++) { tw(t + i * 0.16, { tongue: 1, duration: 0.06, ease: "power2.out" }); tw(t + i * 0.16 + 0.06, { tongue: 0, duration: 0.08, ease: "power2.in" }); cue(t + i * 0.16, "lick"); }
        return F;
      },
      /** Stretch one wing down along the body and fan the tail, like a waking bird. */
      stretch(t, d = 0.75) {
        set("wing", t, "stretch"); set("wing", t + d, at("perched", t) ? "fold" : "blur");
        tw(t, { tail: 0.95, tailAngle: 10, sy: 1.05, duration: 0.25 });
        tw(t + d - 0.2, { tail: 0.15, tailAngle: 0, sy: 1, duration: 0.25 });
        cue(t, "rustle", { n: 2 });
        return F;
      },
      /** The quick side-to-side head turns of a perched hummingbird. */
      lookAround(t, d = 0.9) {
        const seq = [[-12, -0.8], [9, 0.9], [-5, -0.3], [3, 0.6]];
        seq.forEach(([tilt, lx], i) => { const s = t + (i * d) / seq.length; tw(s, { tilt, lookX: lx, duration: 0.05, ease: "power3.out" }); });
        tw(t + d, { tilt: 0, lookX: 0, duration: 0.08 });
        return F;
      },
      shake(t) {
        tw(t, { puff: 1, duration: 0.08 });
        tw(t + 0.08, { rot: 6, duration: 0.05, yoyo: true, repeat: 5, ease: "sine.inOut" });
        tw(t + 0.38, { puff: 0, rot: 0, duration: 0.2 });
        cue(t, "shake");
        return F;
      },
      /** Speak: the beak follows the voice loudness, with small head nods on loud syllables. */
      say(t, mouth, id = "voice") { set("mouth", t, { start: t, mouth }); set("mouth", t + mouth.length / FPS, null); cue(t, "voice", { id, len: mouth.length / FPS }); return F; },
      chips(t, n = 3) { for (let i = 0; i < n; i++) { tw(t + i * 0.09, { beakAdd: 0.35, duration: 0.03 }); tw(t + i * 0.09 + 0.03, { beakAdd: 0, duration: 0.05 }); } cue(t, "chip", { n }); return F; },

      /** Pick something up with the beak: dip, grab, lift. item is an SVG string drawn at the beak tip. */
      pick(t, item, id) {
        tw(t, { tilt: 24, duration: 0.12, ease: "power2.in" });
        set("hold", t + 0.12, item);
        events.push({ t: t + 0.12, type: "picked", id });
        tw(t + 0.12, { tilt: -12, sy: 1.04, duration: 0.18, ease: "back.out(2)" });
        tw(t + 0.3, { tilt: 0, sy: 1, duration: 0.2 });
        cue(t + 0.12, "pluck");
        return F;
      },
      /** Eat what she is holding: head back, two chomps, a gulp (cheeks puff), a happy wiggle. */
      eat(t) {
        tw(t, { tilt: -26, duration: 0.12, ease: "power2.out" });
        for (let i = 0; i < 2; i++) { tw(t + 0.14 + i * 0.16, { beakAdd: 0.55, duration: 0.05 }); tw(t + 0.19 + i * 0.16, { beakAdd: 0, duration: 0.07 }); cue(t + 0.14 + i * 0.16, "chomp"); }
        set("hold", t + 0.3, null);
        events.push({ t: t + 0.3, type: "eaten" });
        tw(t + 0.46, { tilt: 0, puff: 0.45, sy: 1.06, duration: 0.12, ease: "power2.out" });
        tw(t + 0.58, { puff: 0, sy: 1, duration: 0.3, ease: "elastic.out(1,.4)" });
        cue(t + 0.46, "gulp");
        set("mood", t + 0.5, "happy");
        tw(t + 0.62, { rot: 7, duration: 0.07, yoyo: true, repeat: 3, ease: "sine.inOut" });
        return F;
      },
      /** Flick the held item away: wind up, snap the head, let go. The scene animates the flight. */
      toss(t, dir = 1) {
        tw(t, { tilt: 18 * dir, duration: 0.12, ease: "power1.in" });
        tw(t + 0.12, { tilt: -30 * dir, duration: 0.07, ease: "power3.out" });
        set("hold", t + 0.17, null);
        events.push({ t: t + 0.17, type: "tossed", dir });
        tw(t + 0.19, { tilt: 0, duration: 0.3, ease: "back.out(2)" });
        cue(t + 0.12, "flick");
        return F;
      },
      sip(t, n = 3, step = 0.26) {
        tw(t, { beakAdd: 0.18, duration: 0.05 });
        const x0 = snap(t).x, f = at("facing", t);
        for (let i = 0; i < n; i++) {
          const s = t + i * step;
          tw(s, { x: x0 - 12 * f, duration: 0.08, ease: "power1.in" });
          tw(s + 0.08, { x: x0, duration: 0.12 });
          cue(s + 0.06, "sip");
        }
        tw(t + n * step, { beakAdd: 0, duration: 0.05 });
        return F.tongue(t + n * step + 0.05, 2);
      },
      /** The courtship shuttle: quick pendulum swings side to side, chip notes at each end. */
      shuttle(t, n = 4, w = 70, step = 0.2) {
        const x0 = snap(t).x, y0 = snap(t).y;
        for (let i = 0; i < n; i++) {
          const s = t + i * step, dir = i % 2 ? -1 : 1;
          tw(s, { x: x0 + dir * w, duration: step, ease: "sine.inOut" });
          tw(s, { y: y0 + 24, duration: step / 2, ease: "sine.out" });
          tw(s + step / 2, { y: y0, duration: step / 2, ease: "sine.in" });
          tw(s, { rot: dir * 10, duration: step, ease: "sine.inOut" });
          cue(s, "swish");
          if (i % 2) F.chips(s + step * 0.8, 2);
        }
        tw(t + n * step, { x: x0, rot: 0, duration: 0.2 });
        return F;
      },
      flash(t) { tw(t, { flash: 1, duration: 0.45, ease: "none" }); tw(t + 0.5, { flash: 0, duration: 0.01 }); cue(t, "shimmer"); return F; },
      wink(t) { tw(t, { squint: 1, duration: 0.05 }); tw(t + 0.25, { squint: 0, duration: 0.1 }); cue(t, "ting"); return F; },
      /** Comic backwards flight: the body stays facing forward while it reverses. */
      reverse(t, x, d = 0.6) { set("moving", t, true); set("moving", t + d, false); tw(t, { x, rot: 8, duration: d, ease: "power1.inOut" }); tw(t + d, { rot: 0, duration: 0.2 }); cue(t, "reverse", { d }); return F; },
      exit(t, x, y, d = 0.32) { set("moving", t, true); F.face(t - 0.12, x < snap(t).x ? 1 : -1); tw(t - 0.12, { rot: 12, sx: 0.9, duration: 0.12 }); tw(t, { x, y, rot: -16, sx: 1.5, sy: 0.78, duration: d, ease: "power3.in" }); cue(t, "zipoff", { d, x0: snap(t).x, x1: x }); return F; },

      /** The full pose at time t, with the automatic "alive" layer on top. */
      pose(t) {
        const now = snap(t), prev = snap(t - 1 / FPS), back = snap(t - 0.12);
        snap(t);
        const vx = (now.x - prev.x) * FPS, vy = (now.y - prev.y) * FPS, ax = vx - (prev.x - back.x) * (FPS / 3.6);
        const speed = Math.hypot(vx, vy), perched = at("perched", t), view = at("view", t), mood = at("mood", t);
        const flying = !perched;
        const p = { ...now, view, mood, facing: at("facing", t), wing: at("wing", t), hold: at("hold", t), perched, speed };
        // hover: gentle bob and sway, tail pumps every ~1.4 s
        if (flying && !at("moving", t)) {
          p.y += Math.sin(t * Math.PI * 2 * 2.2) * 5 + noise(t * 1.3, 1) * 4;
          p.x += noise(t * 0.9, 2) * 5;
          p.rot += noise(t * 1.1, 3) * 2.5;
          const ph = (t % 1.4) / 1.4; if (ph < 0.13) p.tailAngle += Math.sin(ph / 0.13 * Math.PI) * 14;
        }
        if (perched) p.sy *= 1 + Math.sin(t * Math.PI * 2 * 3.1) * 0.01; // fast breathing
        // follow-through from velocity: tail lags, crest streams back, body banks into turns
        p.tailAngle += clamp(-vy * 0.012, -18, 18);
        p.crestWob = clamp(-ax * 0.01 * p.facing, -22, 22) + Math.sin(t * 9) * Math.min(1, speed / 1500) * 3;
        // eyes: blinks every 2 to 4 s, micro-saccades while idle
        const bi = Math.floor(t / 3.1), bt = bi * 3.1 + hash(bi) * 1.6;
        p.blink = t > bt && t < bt + 0.11 ? Math.sin((t - bt) / 0.11 * Math.PI) : 0;
        if (Math.abs(p.lookX) < 0.05 && Math.abs(p.lookY) < 0.05) { const si = Math.floor(t / 0.7); p.lookX += (hash(si + 9) - 0.5) * 0.5; p.lookY += (hash(si + 19) - 0.5) * 0.3; }
        // talking
        const m = at("mouth", t);
        p.beak = p.beakAdd + (m ? (m.mouth[Math.round((t - m.start) * FPS)] || 0) : 0);
        if (m) p.tilt += p.beak * 4;
        if (mood === "surprised") p.beak = Math.max(p.beak, 0.55);
        if (mood === "party") p.beak = Math.max(p.beak, 0.45);
        p.feet = perched || p.feetOut > 0.05;
        return p;
      },
      /** Draw Floey at t. ghost (0..1) draws a faded copy for motion trails. */
      svg(t, ghost) {
        const p = F.pose(t), mi = Math.round(t * FPS);
        const art = HUM.svg({ view: p.view, mood: p.mood, beak: p.beak, wing: p.wing, wingPhase: (mi * 0.37) % 1, tail: p.tail, tailAngle: p.tailAngle, crest: p.crest, crestWob: p.crestWob, flash: p.flash, blink: p.blink, look: p.lookX, lookY: p.lookY, squint: p.squint, tongue: p.tongue, tilt: p.view === "side" ? p.tilt : 0, puff: p.puff, feet: p.feet, feetOut: p.feetOut, hold: p.hold, lean: p.view === "side" ? (p.perched ? -6 : undefined) : p.rot * 0.3 });
        const f = p.view === "side" ? p.facing : 1;
        return `<g opacity="${ghost ?? 1}" transform="translate(${p.x} ${p.y}) rotate(${p.view === "side" ? p.rot * -f : 0}) scale(${p.sx * f * K} ${p.sy * K}) translate(-160 -150)">${art}</g>`;
      },
      /** Ghost copies behind a fast move. */
      trail(t) {
        const now = F.pose(t);
        return [3, 2, 1].map((k) => ({ k, p: F.pose(t - k * 0.025) })).filter((g) => Math.hypot(g.p.x - now.x, g.p.y - now.y) > 36)
          .map((g) => F.svg(t - g.k * 0.025, 0.1 + (3 - g.k) * 0.06)).join("");
      },
      beakTip(t) { const p = F.pose(t); const [ox, oy] = beakOffset(p, p.facing); return [p.x + ox, p.y + oy]; },
      /** Sound cues plus a per-frame track for the hum and the stereo pan. */
      sound(dur) {
        const track = { fps: FPS, x: [], speed: [], flying: [] };
        for (let i = 0; i < Math.round(dur * FPS); i++) { const p = F.pose(i / FPS); track.x.push(Math.round(p.x)); track.speed.push(Math.round(p.speed)); track.flying.push(p.perched ? 0 : 1); }
        return { cues: cues.map((c) => ({ ...c, x: Math.round(F.pose(c.t).x) })).sort((a, b) => a.t - b.t), track };
      },
      get end() { return end; },
    };
    return F;
  }

  if (typeof gsap !== "undefined" && typeof CustomEase !== "undefined") {
    gsap.registerPlugin(CustomEase);
    CustomEase.create("dart", "M0,0 C0.08,0.6 0.18,1.02 1,1");
    CustomEase.create("brake", "M0,0 C0.2,1.35 0.42,0.94 1,1");
  }
  window.FLOEY = { create, FPS };
})();
