// ===== Practice in 3D (Nov 15; Flex picked 3D for the practice game, "theres nothing else like this out there", after the mock in
// notes/Practice game - 3D mock.html) =====
// The same fight as the 2D map, drawn in three.js. practice.js keeps the clock, the moves, the hits, the mistakes and the score; this file only
// draws it and runs a WoW-style camera: behind you and gliding after you, drag the mouse to turn it, the wheel zooms, W walks where it looks,
// a click on the floor walks there. Read into ui.js's scope right after practice.js (build.ps1, /*PRACTICE*/); practice.js holds the
// "2D | 3D" switch by the minimap. three.js comes from jsdelivr, one exact version, only once 3D is picked: if it can't load (or the PC has no
// WebGL), the switch goes back to 2D and says so. Every floor shape is the hit code's own (the same centres, radii and time windows as
// practice.js's draw(), check() and inWave()): pg3dShapes lists them, pg3d draws the list, tests/practice-3d.js checks the list against inWave.
// Yards as in practice.js (x east, y north, the stone's middle at 0,0) map to three.js as X = x, Z = -y, Y up.
// The graphics pass (Nov 15, Flex: "improve the graphics a bit across the whole thing", 3D only): Ula'tek as a serpent (neck, head, hood, coils
// of her body in the venom, glowing eyes; she rears and bites for Mother's Wrath, sinks in the dive and bursts up with a splash), her ridged
// tail with its rattle (it lifts and slams for Mephitic Thrash), moving venom with a glow at the stone's edge, the spell effects (spectral coils,
// a shimmering bubble, rolling wave crests with foam, a beam with sparks, falling eggs and rocks with shadows, the heart), WoW-style nameplates,
// the hint's arrow and "Go here" ring, a warm key light and a cool rim light. Everything is built once and reused: nothing new while drawing.
const PG3D_THREE = 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js';
let PG3D_LIB = null;
const pg3dLoad = () => { if (PG3D_LIB) return PG3D_LIB;
  const p = PG3D_LIB = new Promise((ok, no) => {
    if (window.THREE && window.THREE.REVISION === '149') { ok(window.THREE); return; }
    const sc = document.createElement('script'); let done = false;
    const fail = (why) => { if (done) return; done = true; if (sc.parentNode) sc.parentNode.removeChild(sc); no(new Error(why)); };
    const tm = setTimeout(() => fail('three.js took too long'), 20000);
    sc.onload = () => { clearTimeout(tm); if (done) return; if (window.THREE && window.THREE.WebGLRenderer) { done = true; ok(window.THREE); } else fail('three.js loaded empty'); };
    sc.onerror = () => { clearTimeout(tm); fail('three.js could not load'); };
    sc.src = PG3D_THREE; document.head.appendChild(sc); });
  p.catch(() => { if (PG3D_LIB === p) PG3D_LIB = null; }); /* (a failed try is forgotten: the next click tries again) */
  return p; };

// ---- what to draw at time t: a list of shapes, each from the numbers the hit code uses (practice.js draw(), line for line) ----
// A: practice.js's window on the game (G, S, me, nm, rl, clsC, bossAt, tailAt, spot, target, hint). Floor shapes: disc, ring (fixed size), grow
// (a ring that grows or shrinks), arc, rect (a strip: f0..f1 along angle a, w0..w1 across it, from x,y); wave (a wave wall over its rect: exactly
// inWave's area); dome, wall; then units with their nameplates, eggs, rocks, adds, the Wretches, her, her tail, the small tails, the spectral
// image, the heart, splashes, the hint's arrow, labels.
function pg3dShapes(A, t) {
  const G = A.G, S = A.S, me = A.me, out = [], P = (o) => { out.push(o); };
  if (!G || !S) return out;
  const cl = (v) => Math.max(0, Math.min(1, v));
  const disc = (x, y, r, c, o) => P({ k: 'disc', x, y, r, c, o }), grow = (x, y, r, c, o) => P({ k: 'grow', x, y, r, c, o });
  const ring = (x, y, r, c, o, w, dash) => P({ k: 'ring', x, y, r, c, o, w: w || 0.3, dash: !!dash });
  // (a label; how 'name' for one that only names a creature, so pg3d hides it rather than move it off a HUD call-out; 'add' for an add pack's)
  const label = (x, y, h, text, c, px, how) => P({ k: 'label', x, y, h, text, c, px: px || 13, how: how || '' });
  // the floor: her tail's sweep (th.r, 35), her reach (5), the coil soaks (s.r, 10; yours gold), the bubble (10 round the Wretch), impacts (m.r), landing eggs (4)
  S.thrash.forEach((th) => { if (t >= th.t0 && t <= th.at + 0.4) { const f = Math.min(1, (t - th.t0) / (th.at - th.t0)); disc(th.x, th.y, th.r, '#ff8c3c', 0.1 + 0.16 * f); ring(th.x, th.y, th.r, '#ff9b4a', 0.9, 0.5, true); if (t > th.at) disc(th.x, th.y, th.r, '#ff7828', 0.35); } });
  S.wrath.forEach((wr) => { if (t >= wr.t0 && t <= wr.at + 3.2) { disc(wr.p[0], wr.p[1], 5, '#ff3c3c', 0.22); ring(wr.p[0], wr.p[1], 5, '#ff4a4a', 1, 0.3); } });
  // (a coil soak: its circle, and a spectral coil rising over it until the slam, then a flash)
  S.soaks.forEach((s) => { if (t >= s.t0 && t <= s.at + 0.5) { const mine = s.group.includes(me), f = Math.min(1, (t - s.t0) / (s.at - s.t0)), c = mine ? '#f3c969' : '#24f2cb';
    disc(s.x, s.y, s.r, '#24f2cb', t > s.at ? 0.4 : 0.08); ring(s.x, s.y, s.r, c, 1, mine ? 0.45 : 0.3, mine); grow(s.x, s.y, s.r * f, '#24f2cb', 0.7);
    P({ k: 'wall', x: s.x, y: s.y, r: s.r, h: 2 + 3 * f, c, o: 0.08 + 0.14 * f }); P({ k: 'coil', x: s.x, y: s.y, r: s.r, f, slam: t > s.at ? cl((t - s.at) / 0.5) : 0 });
    label(s.x, s.y, 5, mine ? 'YOUR SOAK' : 'Soak ' + (s.k + 1), c, 15); } }); /* (low over its circle: higher up it sat on the HUD's call-outs, review of Nov 15) */
  S.bubbles.forEach((q) => { const c = G.wr[q.w]; if (c && t >= q.t0 && t <= q.at + 0.4) { const f = Math.min(1, (t - q.t0) / (q.at - q.t0));
    P({ k: 'dome', x: c.x, y: c.y, r: 10, c: '#d8f22f', o: 0.14 + 0.16 * f, f }); ring(c.x, c.y, 10, '#d8f22f', 1, 0.4); grow(c.x, c.y, 10 * (1 - f), '#d8f22f', 0.55); if (t > q.at) disc(c.x, c.y, 10, '#d8f22f', 0.45);
    label(c.x, c.y, 5, 'Into the bubble · ' + Math.max(0, q.at - t).toFixed(1), '#e8ff6a', 15); } });
  // (impacts; the Womb and the Falling Debris drop out of the sky onto their circles)
  S.impacts.forEach((m) => { if (t >= m.t0 && t <= m.at + 0.3) { const f = Math.min(1, (t - m.t0) / (m.at - m.t0)); disc(m.x, m.y, m.r, '#c8a36a', 0.16); ring(m.x, m.y, m.r, m.color || '#c8a36a', 1, 0.3); disc(m.x, m.y, m.r * f, '#ff5a3c', 0.25);
    if (m.name === 'Falling Debris' || m.name === 'Toxic Womb') P({ k: 'rock', x: m.x, y: m.y, f, land: t > m.at ? cl((t - m.at) / 0.3) : 0, womb: m.name === 'Toxic Womb', sd: m.x * 0.37 + m.y * 0.71 }); } });
  G.eggs.forEach((e) => { if (e.state === 'air' && t >= e.land - 2.5) { const f = Math.min(1, (t - e.land + 2.5) / 2.5); disc(e.x, e.y, 4, '#e6e0c8', 0.12); ring(e.x, e.y, 4, '#e6e0c8', 1, 0.25); disc(e.x, e.y, 4 * f, '#ff5a3c', 0.22);
    P({ k: 'egg', x: e.x, y: e.y, h: 1.2 + 32 * (1 - f * f), fall: true }); } }); /* (falling from the sky until it lands, its shadow shrinking under it) */
  // the beam: from the spectral image to the tank in it (b.tank, else the off tank)
  S.beams.forEach((b) => { const tk = G.bots[b.tank || 't2']; if (t >= b.t0 && t <= b.t1 && tk) P({ k: 'beam', x0: b.from[0], y0: b.from[1], x1: tk.x, y1: tk.y });
    if (t >= b.t0 - 1 && t <= b.t1) { disc(b.from[0], b.from[1], 3, '#3af2a8', 0.25); ring(b.from[0], b.from[1], 3, '#3af2a8', 1, 0.25); P({ k: 'ghost', x: b.from[0], y: b.from[1] }); label(b.from[0], b.from[1], 12, 'Spectral Ula\'tek', '#3af2a8', 14, 'name'); } });
  S.tails.forEach((q) => { if (t >= q.t0 && t <= q.at + 0.6) { disc(q.x, q.y, 3, '#ff5a3a', 0.35); ring(q.x, q.y, 3, '#ff5a3a', 1, 0.25); P({ k: 'stail', x: q.x, y: q.y, f: cl((t - q.t0) / 1.2), sink: t > q.at ? cl((t - q.at) / 0.6) : 0 }); label(q.x, q.y, 8, 'Tail', '#ff8a6a', 13, 'name');
    if (t < q.t0 + 1.1) P({ k: 'splash', x: q.x, y: q.y, p: (t - q.t0) / 1.1, s: 0.5 }); } });
  if (t >= S.dive.gone && t < S.dive.surf) { const p = S.dive.to; disc(p[0], p[1], 5, '#7fd8ff', 0.25); ring(p[0], p[1], 5, '#7fd8ff', 1, 0.3, true); P({ k: 'fizz', x: p[0], y: p[1] }); label(p[0], p[1], 5, 'Bubbles', '#7fd8ff', 14); }
  // waves: the red lanes before they go (the 2D's start strip, and the lane it will run down), then the walls, placed as inWave places them
  S.waves.forEach((w) => { const a = w.deg * Math.PI / 180, hw = w.w / 2, segs = w.cres || [[-hw, hw]];
    if (w.warn && t >= w.t0 - w.warn && t < w.t0) { P({ k: 'rect', x: w.x, y: w.y, a, f0: -2.5, f1: 2.5, w0: -hw, w1: hw, c: '#ff5a3a', o: 0.35 + 0.2 * Math.sin(t * 9) });
      if (!w.ring) segs.forEach(([a0, b0]) => P({ k: 'rect', x: w.x, y: w.y, a, f0: -w.d / 2, f1: w.v * (w.t1 - w.t0) + w.d / 2 + 3, w0: Math.max(a0, -hw), w1: Math.min(b0, hw), c: '#ff5a3a', o: 0.05 })); }
    if (t < w.t0 || t > w.t1) return; const el = t - w.t0, op = Math.max(0, Math.min(1, el / 0.35, (w.t1 - t) / 0.5)) * 0.92;
    if (w.ring) { const Rr = w.v * el + 2.5, st = 2 * Math.PI / w.n, hz = w.cw / 2; for (let q = 0; q < w.n; q++) { const b = w.ph + q * st; P({ k: 'wave', x: w.x + Math.cos(b) * Rr, y: w.y + Math.sin(b) * Rr, a: b, f0: -2.4, f1: 3.6, w0: -hz, w1: hz, o: op }); } return; }
    const u = Math.cos(a), v = Math.sin(a), cx0 = w.x + u * w.v * el, cy0 = w.y + v * w.v * el, hd = w.d / 2;
    segs.forEach(([a0, b0]) => { const w0 = Math.max(a0, -hw), w1 = Math.min(b0, hw); if (w1 > w0) P({ k: 'wave', x: cx0, y: cy0, a, f0: -hd, f1: hd + 3, w0, w1, o: op }); }); });
  // eggs: on the floor (its shell, and yours in gold), or riding over their carrier with the 3-yard circle
  G.eggs.forEach((e) => { if (e.state === 'air' || e.state === 'gone') return; let x = e.x, y = e.y, h = 1.2;
    if (e.who) { const b = e.who === me ? { x: G.x, y: G.y } : G.bots[e.who]; if (!b) return; x = b.x; y = b.y; h = 3.9; const ew = e.who === me && A.eggWarn ? A.eggWarn() : 0, ec = ew === 2 ? '#ff5a3a' : ew === 1 ? '#ff9b4a' : '#3af2a8'; disc(b.x, b.y, 3, ec, ew ? 0.16 : 0.08); ring(b.x, b.y, 3, ec, 0.9, ew ? 0.32 : 0.2); }
    P({ k: 'egg', x, y, h, held: !!e.who });
    if (e.state === 'floor' && t < e.shell) { ring(e.x, e.y, 2, '#e6e0c8', 1, 0.3); P({ k: 'arc', x: e.x, y: e.y, r: 2, f: (t - e.land) / (e.shell - e.land), c: '#ffd36b', o: 1 }); P({ k: 'dome', x: e.x, y: e.y, r: 1.7, c: '#3af2a8', o: 0.22 }); }
    if (e.id === me && e.state === 'floor') { ring(e.x, e.y, 2.8, '#f3c969', 1, 0.3, true); label(e.x, e.y, 4.2, t < e.shell ? 'Your egg (shell up)' : 'Your egg: pick it up', '#f3c969', 14); } });
  // (hitting the right thing, Nov 15: the targets that matter now pulse gold; yours has a white ring, red while it's out of range)
  // (your attacks, Nov 15: a gold flash on what you hit; Rawlings and Vipers show their health as a red arc that shrinks)
  // (her waves, Nov 15: the half hit first glows red, the safe half green; they swap once the first wave has gone by)
  const hv = A.halves ? A.halves() : null; if (hv) { const a = Math.atan2(hv.d[1], hv.d[0]); P({ k: 'rect', x: 0, y: 0, a: hv.red > 0 ? a : a + Math.PI, f0: 0, f1: 60, w0: -60, w1: 60, c: '#ff4632', o: 0.26 }); P({ k: 'rect', x: 0, y: 0, a: hv.red > 0 ? a + Math.PI : a, f0: 0, f1: 60, w0: -60, w1: 60, c: '#5ae678', o: 0.22 }); }
  const dvh = A.dps ? A.dps() : null; if (dvh) { (dvh.fx || []).forEach((h) => { if (h.age < 0.4) grow(h.x1, h.y1, h.r + 0.4 + h.age * 5, h.melee ? '#fff0c8' : '#f3c969', 1 - h.age / 0.4); }); (dvh.adds || []).forEach((o) => { if (o.hp < o.max) P({ k: 'arc', x: o.p[0], y: o.p[1], r: o.r + 0.7, f: Math.max(0.02, o.hp / o.max), c: '#ff6b5c', o: 1 }); }); }
  const dv = A.dps ? A.dps() : null; if (dv) { dv.right.forEach((o) => ring(o.p[0], o.p[1], o.r + 1.2, '#f3c969', 0.6 + 0.35 * Math.sin(t * 8), 0.35)); if (dv.cur) ring(dv.cur.p[0], dv.cur.p[1], dv.cur.r + 0.7, dv.inRange ? '#ffffff' : '#ff8f87', 0.9, 0.25, true); }
  const hn = A.hint ? A.hint() : null, ys = A.spot ? A.spot() : null;
  if (ys) { disc(ys[0], ys[1], 1.3, '#f3c969', 0.18); ring(ys[0], ys[1], 1.3, '#f3c969', 1, 0.25, true); if (!(hn && hn.T && Math.hypot(hn.T[0] - ys[0], hn.T[1] - ys[1]) < 2)) label(ys[0], ys[1], 2.8, 'Your spot', '#f3c969', 13); } /* (the hint's "Go here" says it when they're the same spot) */
  const nextEgg = G.eggs.find((e) => e.id === me && e.state === 'air' && e.land - t < 14); if (nextEgg) { disc(nextEgg.x, nextEgg.y, 4.5, '#f3c969', 0.08); ring(nextEgg.x, nextEgg.y, 4.5, '#f3c969', 1, 0.3, true); label(nextEgg.x, nextEgg.y, 4.5, 'Your egg lands here', '#f3c969', 14); }
  // the adds, the Wretches, her, her tail, the heart. The adds: one label for each pack near you ("Rawlings ×9" at its middle), not one each
  // (nine names piled up in one heap, review of Nov 15)
  const packs = []; G.adds.forEach((a) => { P({ k: 'add', kind: a.kind, x: a.x, y: a.y }); let q = null; for (const o of packs) if (o.kind === a.kind && Math.hypot(o.x0 - a.x, o.y0 - a.y) < 6) { q = o; break; }
    if (!q) packs.push(q = { kind: a.kind, x0: a.x, y0: a.y, sx: 0, sy: 0, n: 0 }); q.sx += a.x; q.sy += a.y; q.n++; });
  packs.forEach((q) => { const x = q.sx / q.n, y = q.sy / q.n, vp = q.kind === 'viper'; if (Math.hypot(x - G.x, y - G.y) <= 15) label(x, y, 2.6, (vp ? 'Viper' : 'Rawling') + (q.n > 1 ? 's ×' + q.n : ''), vp ? '#ff8f87' : '#c9df9a', 12, 'add'); });
  S.wretches.forEach((w) => { const c = G.wr[w.id]; if (!c) return; const up = t >= w.awake; P({ k: 'wretch', id: w.id, x: c.x, y: c.y, awake: up });
    if (!S.bubbles.some((q) => q.w === w.id && t >= q.t0 && t <= q.at + 0.4)) label(c.x, c.y, up ? 6 : 4.5, up ? 'Blightscale Wretch' : 'Wretch (asleep)', '#c89bff', 13, 'name'); }); /* (its bubble's label says it while that's up) */
  const B = A.bossAt(t), TL = A.tailAt(t), D = S.dive;
  let sink = 0; if (B.up && t >= D.t0 && t < D.gone) sink = (t - D.t0) / (D.gone - D.t0); if (B.up && t >= D.surf && t < D.surf + 1.5) sink = 1 - (t - D.surf) / 1.5; /* (only the picture: bossAt says where she is) */
  // (her: she rears back through Mother's Wrath's cast, then bites five times; a splash as she dives and as she bursts up on the other side)
  if (B.up) { const wr = S.wrath.find((q) => t >= q.t0 && t < q.at + 3); P({ k: 'boss', x: B.p[0], y: B.p[1], sink, rear: wr && t < wr.at ? (t - wr.t0) / (wr.at - wr.t0) : 0, bite: wr && t >= wr.at ? ((t - wr.at) % 0.6) / 0.6 : -1 }); } /* (no name over her: the boss bar says it, and the name sat under the bar) */
  if (t >= D.t0 + 0.4 && t < D.gone + 1) { const p0 = A.bossAt(D.t0).p; P({ k: 'splash', x: p0[0], y: p0[1], p: (t - D.t0 - 0.4) / (D.gone + 0.6 - D.t0), s: 1.5 }); }
  if (t >= D.surf && t < D.surf + 2.4) P({ k: 'splash', x: B.p[0], y: B.p[1], p: (t - D.surf) / 2.4, s: 2 });
  // (her tail: it lifts through Mephitic Thrash's cast and slams down on the stone's edge as it lands)
  if (TL.up) { const th = S.thrash.find((q) => t >= q.t0 && t <= q.at + 0.8); P({ k: 'tail', x: TL.p[0], y: TL.p[1], wig: th ? cl((t - th.t0) / (th.at - th.t0)) : 0, slam: th && t > th.at ? cl((t - th.at) / 0.8) : 0 }); label(TL.p[0], TL.p[1], 15, 'Gore Rattle', '#e8d6a8', 13, 'name');
    if (th && t > th.at && t < th.at + 0.9) { const dd = Math.hypot(TL.p[0], TL.p[1]) || 1; P({ k: 'splash', x: TL.p[0] - TL.p[0] / dd * 7, y: TL.p[1] - TL.p[1] / dd * 7, p: (t - th.at) / 0.9, s: 0.9 }); } }
  if (A.P2) A.P2.shapes(t, P, { disc, ring, grow, label }); /* (a later part's own shapes: src/practice-p2.js) */
  if (t >= 145.5 && t < 165.5) { const hp = S.F(PG_UL.heart, t); disc(hp[0], hp[1], 3, '#5a0f22', 0.6); ring(hp[0], hp[1], 3, '#ff5a7a', 1, 0.3); P({ k: 'heart', x: hp[0], y: hp[1] }); label(hp[0], hp[1], 6.5, 'Venomous Heart', '#ff9fb2', 14, 'name'); }
  // the raid, then you (a gold ring), your defensive, where you clicked. Nameplates as in WoW: a thin bar over everyone, fainter far away; a name
  // only near you (7 yards), on your soak group's late ones (still outside its circle) while your coil is up, and on egg carriers near you (14
  // yards); yours always (no more pile of 20 names in a bubble: pg3d also drops a name that would sit on top of a nearer one, four at most)
  const RAID = typeof GDZ_RAID !== 'undefined' ? GDZ_RAID : Object.keys(G.bots), NEAR = 7, CARRY = 14, mates = new Map(), carry = new Set();
  S.soaks.forEach((s) => { if (s.group.includes(me) && t >= s.cast - 0.5 && t <= s.at + 0.5) s.group.forEach((id) => { if (!mates.has(id)) mates.set(id, s); }); });
  G.eggs.forEach((e) => { if (e.state === 'held' && e.who && e.who !== me) carry.add(e.who); });
  RAID.forEach((id) => { const b = G.bots[id]; if (id === me || !b) return; const rc = GDZ_ROLE[A.rl(id)][1], cc = A.clsC(id), d = Math.hypot(b.x - G.x, b.y - G.y);
    ring(b.x, b.y, 0.95, rc, 0.9, 0.16); P({ k: 'unit', id, x: b.x, y: b.y, c: cc || rc });
    const ms = mates.get(id), why = d <= NEAR ? 'near' : ms && Math.hypot(b.x - ms.x, b.y - ms.y) > ms.r ? 'soak' : carry.has(id) && d <= CARRY ? 'egg' : '';
    P({ k: 'plate', id, x: b.x, y: b.y, name: A.nm(id).slice(0, 12), c: cc || '#cfd6df', bar: cc || '#3fbf5a', hp: 1, o: d < 16 ? 1 : Math.max(0.3, 1 - (d - 16) / 40), show: !!why, why, d }); });
  if (G.debs.def && G.debs.def.until > t) P({ k: 'dome', x: G.x, y: G.y, r: 1.9, c: '#7fb8ff', o: 0.18 });
  const hp = cl((G.hp == null ? 100 : G.hp) / 100);
  ring(G.x, G.y, 1.25, '#f3c969', 1, 0.32); P({ k: 'unit', id: me, x: G.x, y: G.y, c: A.clsC(me) || GDZ_ROLE[A.rl(me)][1], you: true });
  P({ k: 'plate', id: me, x: G.x, y: G.y, name: 'YOU', c: '#ffd34d', bar: hp < 0.35 ? '#d8483e' : hp < 0.65 ? '#d9a93a' : '#3fbf5a', hp, o: 1, show: true, why: 'you', d: 0, you: true });
  const tg = A.target; if (tg) ring(tg[0], tg[1], 0.6, '#ffffff', 0.6, 0.15);
  // the hint (practice.js hintNow: where your job wants you now): an arrow at your feet and a "Go here" ring with the yards, gold as in 2D
  if (hn && hn.T && hn.d > 0) { P({ k: 'arrow', x: G.x, y: G.y, a: Math.atan2(hn.T[1] - G.y, hn.T[0] - G.x), d: hn.d }); disc(hn.T[0], hn.T[1], 1.4, '#f3c969', 0.14); ring(hn.T[0], hn.T[1], 1.4, '#f3c969', 1, 0.25, true);
    P({ k: 'beacon', x: hn.T[0], y: hn.T[1] }); label(hn.T[0], hn.T[1], 3.4, 'Go here · ' + Math.round(hn.d) + ' yd', '#f3c969', 14); }
  return out;
}

// ---- the words over the picture, worked out on the screen each frame (plain functions, so tests/practice-3d.js runs them) ----
// pg3dHud: the HUD's call-outs in the middle of the screen (practice.js .pg-warn and .pg-float) win over the labels in the picture, and an
// earlier label wins over a later one. A label on top of one moves down below it, or hides if it only names a creature (the picture shows it).
// L: the labels in order, [{ x, y, w, h, hide }] (centre and size in pixels); B: the call-outs showing now, [{ l, t, r, b }], top to bottom.
// Sets y (moved down) or off on each label. (Review of Nov 15: at 0:39 "Into the bubble" sat under "Egg picked up" and neither could be read.)
function pg3dHud(L, B) {
  const on = (l, a, b, c, d) => l.x - l.w / 2 < c && l.x + l.w / 2 > a && l.y - l.h / 2 < d && l.y + l.h / 2 > b;
  for (let i = 0; i < L.length; i++) { const l = L[i]; l.off = false;
    for (let g = 0; g < 12; g++) { let low = null;
      for (let j = 0; j < B.length && low == null; j++) { const o = B[j]; if (on(l, o.l, o.t, o.r, o.b)) low = o.b; }
      for (let j = 0; j < i && low == null; j++) { const o = L[j]; if (!o.off && on(l, o.x - o.w / 2, o.y - o.h / 2, o.x + o.w / 2, o.y + o.h / 2)) low = o.y + o.h / 2; }
      if (low == null) break; if (l.hide) { l.off = true; break; } l.y = low + l.h / 2 + 3; } }
  return L; }
// pg3dPick: which names to show. Q: [{ l, t, r, b, pri, fix, free }]. Fixed boxes always stay (you, the labels, the call-outs); the rest go by
// pri (lower first) and stay only where they sit on nothing kept, `cap` at most (free ones, the add packs' labels, don't count). Sets on.
function pg3dPick(Q, cap) {
  Q.sort((a, b) => (a.fix ? -1 : a.pri) - (b.fix ? -1 : b.pri)); let n = 0;
  for (let k = 0; k < Q.length; k++) { const q = Q[k]; q.on = false;
    if (!q.fix) { if (!q.free && n >= cap) continue; let hit = false; for (let i = 0; i < k && !hit; i++) { const o = Q[i]; hit = o.on && q.l < o.r && q.r > o.l && q.t < o.b && q.b > o.t; } if (hit) continue; if (!q.free) n++; }
    q.on = true; }
  return Q; }

// ---- the stone (Nov 15, Flex: "Maybe the platform could have an actual texture similar to the platform in the game?") ----
// The in-game platform as a texture drawn by code on a canvas once, when 3D opens (no picture is loaded or shipped): weathered grey-green
// slabs in a border band round the rim with worn, chipped edges and a raised frame inside it, four sunken blue-slate panels (north, south,
// east, west), carved knots at the four corners, a carved square in the middle with scale-carved fans in its corners (each with a green venom
// inlay) round a round medallion with the serpent's head (glowing eyes), and cracks, a few with a faint venom glow. Laid out after the room's
// top-down picture and fitted to practice.js's PG_UL.onPlat octagon. Mid-dark and low in contrast, so the floor markers stay bright on it.
// pg3dStonePlan: the layout in yards (x east, y north, as practice.js), plain numbers, so tests/practice-3d.js checks it against onPlat.
function pg3dStonePlan() {
  const hs = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  const octAt = (d) => { const a = 36.5 - d, b = 34 - d, c = 49 - d * Math.SQRT2; return [[a, c - a], [c - b, b], [b - c, b], [-a, c - a], [-a, a - c], [b - c, -b], [c - b, -b], [a, a - c]]; };
  const inside = (x, y, d) => Math.abs(x) <= 36.5 - d && Math.abs(y) <= 34 - d && Math.abs(x) + Math.abs(y) <= 49 - d * Math.SQRT2;
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const BAND = 6.4, FRAME = 7.4, O = octAt(0), I = octAt(BAND), slabs = [], chips = [], cracks = [], rays = [];
  // (the border band: each side cut into slabs with slanted joints, some split across the band)
  for (let i = 0; i < 8; i++) { const j = (i + 1) % 8, n = Math.max(2, Math.round(Math.hypot(O[j][0] - O[i][0], O[j][1] - O[i][1]) / 4.4)), cut = [[0, 0]];
    for (let k = 1; k < n; k++) cut.push([(k + (hs(i, k) - 0.5) * 0.5) / n, (k + (hs(k, i + 9) - 0.5) * 0.6) / n]); cut.push([1, 1]);
    for (let k = 0; k < n; k++) { const a = cut[k], b = cut[k + 1], o0 = lerp(O[i], O[j], a[0]), o1 = lerp(O[i], O[j], b[0]), i1 = lerp(I[i], I[j], b[1]), i0 = lerp(I[i], I[j], a[1]);
      if (hs(i * 7 + k, 3) < 0.4) { const m0 = lerp(o0, i0, 0.35 + hs(i, k + 20) * 0.3), m1 = lerp(o1, i1, 0.35 + hs(i + 20, k) * 0.3); slabs.push([o0, o1, m1, m0], [m0, m1, i1, i0]); } else slabs.push([o0, o1, i1, i0]); } }
  // (chips out of the rim: a small notch on the edge; the octagon runs anticlockwise, so inward is the edge's left)
  for (let c = 0; c < 44; c++) { const i = c % 8, j = (i + 1) % 8, L = Math.hypot(O[j][0] - O[i][0], O[j][1] - O[i][1]), t = 0.06 + hs(c, 31) * 0.88, w = (0.4 + hs(c, 32) * 0.8) / L / 2, dp = 0.18 + hs(c, 33) * 0.4;
    const ux = (O[j][0] - O[i][0]) / L, uy = (O[j][1] - O[i][1]) / L, m = lerp(O[i], O[j], t), sk = (hs(c, 34) - 0.5) * 0.3;
    chips.push([lerp(O[i], O[j], t - w), [m[0] - uy * dp + ux * sk, m[1] + ux * dp + uy * sk], [m[0] - uy * dp * 0.4 + ux * w * L * 0.8, m[1] + ux * dp * 0.4 + uy * w * L * 0.8], lerp(O[i], O[j], t + w)]); }
  // (cracks: short wandering lines, some with a branch; every third one glows faintly with venom)
  for (let c = 0; c < 18; c++) { let x = 0, y = 0, k = 0; do { x = (hs(c, 40 + k) - 0.5) * 70; y = (hs(c, 60 + k) - 0.5) * 64; k++; } while (!inside(x, y, 1.5) && k < 20); if (!inside(x, y, 1.5)) continue;
    let a = hs(c, 41) * Math.PI * 2; const L = [[x, y]], n = 4 + Math.floor(hs(c, 42) * 4);
    for (let s = 0; s < n; s++) { a += (hs(c, 50 + s) - 0.5) * 1.1; const d = 0.7 + hs(c, 70 + s) * 0.9; x += Math.cos(a) * d; y += Math.sin(a) * d; if (!inside(x, y, 0.3)) break; L.push([x, y]); }
    if (L.length > 1) cracks.push({ L, glow: c % 3 === 0, w: 0.08 + hs(c, 43) * 0.06 });
    if (L.length > 2 && hs(c, 44) < 0.45) { let bx = L[1][0], by = L[1][1], b = a + 1.2; const B = [[bx, by]]; for (let s = 0; s < 3; s++) { b += (hs(c, 80 + s) - 0.5) * 0.9; bx += Math.cos(b) * 0.8; by += Math.sin(b) * 0.8; if (!inside(bx, by, 0.3)) break; B.push([bx, by]); } if (B.length > 1) cracks.push({ L: B, glow: c % 3 === 0, w: 0.06 }); } }
  // (the field's joints, out from the middle to the frame; the panels and the middle cover most of them)
  for (let k = 0; k < 16; k++) { const a = (k * 22.5 + 11.25) * Math.PI / 180, u = Math.cos(a), v = Math.sin(a); let r = 15; while (inside(u * (r + 0.2), v * (r + 0.2), FRAME)) r += 0.2; rays.push([[u * 15, v * 15], [u * r, v * r]]); }
  // (a panel: a long box with its corners cut, [x0, y0, x1, y1, cut])
  const box = (x0, y0, x1, y1, c) => [[x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c], [x0 + c, y0]];
  const panels = [[-13.5, 17.2, 13.5, 25.8, 4], [-13.5, -25.8, 13.5, -17.2, 4], [17.2, -13.5, 27.6, 13.5, 4.3], [-27.6, -13.5, -17.2, 13.5, 4.3]];
  return { span: 74, oct: O, band: I, BAND, FRAME, octAt, inside, slabs, chips, cracks, rays, box, panels, sq: [16.6, 15.6, 14.4, 13.6], fans: { at: 16.6, r: 8 }, knots: { at: 19.4, h: 2.6 }, med: { x: 0, y: 0, r: [9.6, 8.6] } };
}
// pg3dNormals: a normal map (RGBA bytes into out, or a new array) from a height map (one byte a pixel, w x h), k the relief's strength; wrap:
// the left and right edges meet (the side wall's texture repeats). Canvas rows run south, so a slope up to the north tilts the normal south.
function pg3dNormals(H, w, h, k, wrap, out) {
  out = out || new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) { const yu = y > 0 ? y - 1 : 0, yd = y < h - 1 ? y + 1 : h - 1;
    for (let x = 0; x < w; x++) { const xl = x > 0 ? x - 1 : (wrap ? w - 1 : 0), xr = x < w - 1 ? x + 1 : (wrap ? 0 : w - 1), j = (y * w + x) * 4;
      const dx = (H[y * w + xr] - H[y * w + xl]) * k / 510, dy = (H[yd * w + x] - H[yu * w + x]) * k / 510, l = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      out[j] = (0.5 - dx * l * 0.5) * 255; out[j + 1] = (0.5 + dy * l * 0.5) * 255; out[j + 2] = (0.5 + l * 0.5) * 255; out[j + 3] = 255; } }
  return out; }
// pg3dStoneDraw: draws the plan on canvases made by mk(w, h): the top's colour map and normal map (px square, the plan's span across, the
// stone's middle in the middle), and the side wall's rock face and its normal map (wallW yards along the wall, the top wallH yards of it).
// Each shape goes on the colour map and a height map at once, the normal maps come from the heights and the grooves are darkened from the
// same heights, so colour and relief line up. free() empties the canvases (closing the game calls it through keep()).
function pg3dStoneDraw(mk, px) {
  const PL = pg3dStonePlan(), S = PL.span, K = px / S, TAU = Math.PI * 2, hs = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  // (the stone leans teal like the room's: the warm key light takes blue away, so a grey-green came out olive. Its green never tops its red
  // and blue by much, so the shader's venom glow (vglow) leaves it alone; only GLOW-coloured marks clear it, and none of them by much)
  const STONE = [54, 72, 70], GROOVE = [32, 44, 43], RAISED = [64, 84, 80], SLATE = [40, 52, 64], RUST = [72, 44, 34], GLOW = [92, 222, 46], MOSS = [64, 92, 54];
  const rgb = (c, a) => 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')', sh = (c, d) => [c[0] + d, c[1] + d, c[2] + d];
  // (one pen for both maps: a shape goes on the colour map and, given a height, on the height map too; a list of lines is one path, so a
  // see-through stroke over it never doubles up where they cross)
  const pen = (w, h, toPx, k) => { const col = mk(w, h), hgt = mk(w, h), C = col.getContext('2d'), H = hgt.getContext('2d'), both = [C, H];
    const go = (L, close) => { for (const g of both) { g.beginPath(); (Array.isArray(L[0][0]) ? L : [L]).forEach((M) => { M.forEach((p, i) => { const q = toPx(p[0], p[1]); if (i) g.lineTo(q[0], q[1]); else g.moveTo(q[0], q[1]); }); if (close) g.closePath(); }); } };
    return { col, hgt, C, H, w, h, poly: (L) => go(L, true), line: (L) => go(L, false),
      arc: (x, y, r, a0, a1) => { const q = toPx(x, y); for (const g of both) { g.beginPath(); g.arc(q[0], q[1], r * k, a0 || 0, a1 == null ? TAU : a1); } },
      fill: (c, hv, a) => { C.fillStyle = rgb(c, a); C.fill(); if (hv != null) { H.fillStyle = rgb([hv, hv, hv], a); H.fill(); } },
      stroke: (c, hv, wd, a, cap) => { C.lineWidth = H.lineWidth = wd * k; C.lineJoin = H.lineJoin = 'round'; C.lineCap = H.lineCap = cap || 'round'; C.strokeStyle = rgb(c, a); C.stroke(); if (hv != null) { H.strokeStyle = rgb([hv, hv, hv], a); H.stroke(); } },
      clip: () => { for (const g of both) { g.save(); g.clip(); } }, unclip: () => { for (const g of both) g.restore(); },
      blot: (x, y, r, c, a) => { const q = toPx(x, y), rr = r * k, g = C.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr); g.addColorStop(0, rgb(c, a)); g.addColorStop(1, rgb(c, 0)); C.fillStyle = g; C.fillRect(q[0] - rr, q[1] - rr, rr * 2, rr * 2); } }; };
  // (the heights blurred a little make the normal map; the heights against a wider blur darken the grooves and lighten the ridges; a fine grain)
  const finish = (Q, k, wrap) => { const w = Q.w, h = Q.h, half = mk(w >> 1, h >> 1), tiny = mk(w >> 3, h >> 3), hc = half.getContext('2d'), tc = tiny.getContext('2d'), tw = w >> 3, th = h >> 3;
    hc.imageSmoothingQuality = tc.imageSmoothingQuality = 'high'; hc.drawImage(Q.hgt, 0, 0, w >> 1, h >> 1); tc.drawImage(Q.hgt, 0, 0, tw, th); const td = tc.getImageData(0, 0, tw, th).data;
    Q.H.setTransform(1, 0, 0, 1, 0, 0); Q.H.globalAlpha = 1; Q.H.globalCompositeOperation = 'copy'; Q.H.drawImage(half, 0, 0, w, h); Q.H.globalCompositeOperation = 'source-over';
    const A = Q.H.getImageData(0, 0, w, h).data, n = w * h, Hh = new Uint8Array(n), ci = Q.C.getImageData(0, 0, w, h), D = ci.data;
    for (let y = 0, i = 0; y < h; y++) { const fy = Math.min(th - 1, Math.max(0, (y + 0.5) / 8 - 0.5)), y0 = fy | 0, y1 = Math.min(th - 1, y0 + 1), wy = fy - y0;
      for (let x = 0; x < w; x++, i++) { const fx = Math.min(tw - 1, Math.max(0, (x + 0.5) / 8 - 0.5)), x0 = fx | 0, x1 = Math.min(tw - 1, x0 + 1), wx = fx - x0, j = i * 4;
        const b = (td[(y0 * tw + x0) * 4] * (1 - wx) + td[(y0 * tw + x1) * 4] * wx) * (1 - wy) + (td[(y1 * tw + x0) * 4] * (1 - wx) + td[(y1 * tw + x1) * 4] * wx) * wy;
        let z = Math.imul(i, 0x9E3779B1); z ^= z >>> 15; z = Math.imul(z, 0x85EBCA77); const f = 1 + (A[j] - b) * 0.0036 + ((z >>> 24) - 128) * 0.0003;
        Hh[i] = A[j]; D[j] *= f; D[j + 1] *= f; D[j + 2] *= f; } }
    Q.C.putImageData(ci, 0, 0); const nd = Q.H.createImageData(w, h); pg3dNormals(Hh, w, h, k, wrap, nd.data); Q.H.putImageData(nd, 0, 0); half.width = half.height = tiny.width = tiny.height = 0; };

  // ---- the top ----
  const P = (x, y) => [(x + S / 2) * K, (S / 2 - y) * K], T = pen(px, px, P, K), quad = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
  // (outside the octagon: the rim's colour, a little lower, so the edge stays dark and worn where the texture is blended down far away)
  T.C.fillStyle = rgb(sh(STONE, -14)); T.C.fillRect(0, 0, px, px); T.H.fillStyle = rgb([118, 118, 118]); T.H.fillRect(0, 0, px, px);
  T.poly(PL.oct); T.fill(STONE, 150);
  // (the border band: slabs, each its own shade and patches, with worn joints that wander a little, the same way from either slab (the rim's
  // own edge gets none); the field's joints; the raised frame inside the band)
  const rim = (p) => !PL.inside(p[0], p[1], 0.02), rough = (a, b) => { if (b[0] < a[0] || (b[0] === a[0] && b[1] < a[1])) { const c = a; a = b; b = c; } const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 0.7)), out = [a];
    for (let k = 1; k < n; k++) { const t = k / n, o = (hs(a[0] * 7.3 + b[0] * 3.1 + k, a[1] * 5.7 + b[1] * 2.3) - 0.5) * 0.16; out.push([a[0] + (b[0] - a[0]) * t - (b[1] - a[1]) / L * o, a[1] + (b[1] - a[1]) * t + (b[0] - a[0]) / L * o]); } out.push(b); return out; };
  PL.slabs.forEach((L, i) => { T.poly(L); T.fill(sh(STONE, (hs(i, 5) - 0.5) * 12), 146 + hs(i, 6) * 10); const c = L.reduce((s, p) => [s[0] + p[0] / L.length, s[1] + p[1] / L.length], [0, 0]);
    for (let k = 0; k < 3; k++) T.blot(c[0] + (hs(i, k + 7) - 0.5) * 3, c[1] + (hs(k + 7, i) - 0.5) * 3, 0.8 + hs(i + k, 8) * 1.6, hs(i, k + 9) < 0.5 ? [28, 36, 35] : [86, 103, 100], 0.12); });
  PL.slabs.forEach((L) => L.forEach((a, k) => { const b = L[(k + 1) % L.length]; if (rim(a) && rim(b)) return; T.line(rough(a, b)); T.stroke(GROOVE, 112, 0.45, 0.3); T.stroke(GROOVE, 74, 0.17); }));
  PL.rays.forEach((L) => { T.line(L); T.stroke(GROOVE, 112, 0.45, 0.3); T.stroke(GROOVE, 78, 0.18); });
  T.poly(PL.octAt(PL.BAND + 0.5)); T.stroke(RAISED, 184, PL.FRAME - PL.BAND); [PL.BAND, PL.FRAME].forEach((d) => { T.poly(PL.octAt(d)); T.stroke(GROOVE, 80, 0.16); }); T.poly(PL.octAt(PL.BAND + 0.5)); T.stroke(sh(RAISED, -8), 168, 0.06);
  // (the corner knots, over the frame and into the band: a square and a diamond woven over and under each other round a small square, carved strips)
  const sqr = (x, y, r) => [[x - r, y - r], [x + r, y - r], [x + r, y + r], [x - r, y + r]];
  quad.forEach(([sx, sy]) => { const cx = sx * PL.knots.at, cy = sy * PL.knots.at, h = PL.knots.h, d = h * 1.3, strip = (L, open) => { T[open ? 'line' : 'poly'](L); T.stroke(GROOVE, 84, 0.95, 1, open && 'butt'); T.stroke(RAISED, 186, 0.55, 1, open && 'butt'); };
    T.arc(cx, cy, h * 1.45); T.fill(sh(STONE, -4), 146); T.stroke(GROOVE, 84, 0.14); strip(sqr(cx, cy, h)); strip([[cx + d, cy], [cx, cy + d], [cx - d, cy], [cx, cy - d]]);
    /* (the square goes back over the diamond at every other crossing: (h, d - h) and its quarter turns) */
    let p = [h, d - h], t = [0, 0.7]; for (let q = 0; q < 4; q++) { strip([[cx + p[0] - t[0], cy + p[1] - t[1]], [cx + p[0] + t[0], cy + p[1] + t[1]]], true); p = [-p[1], p[0]]; t = [-t[1], t[0]]; }
    strip(sqr(cx, cy, h * 0.42)); });
  // (the four sunken blue-slate panels: a raised lip, the slate with a faint diamond grid and a thin rust line inside the lip)
  PL.panels.forEach((p, n) => { const [x0, y0, x1, y1, c] = p, ins = (d) => PL.box(x0 + d, y0 + d, x1 - d, y1 - d, c - d * 0.414);
    T.poly(PL.box(x0, y0, x1, y1, c)); T.fill(RAISED, 176); T.stroke(GROOVE, 80, 0.18); T.poly(ins(0.6)); T.fill(SLATE, 118); T.clip();
    for (let k = 0; k < 9; k++) T.blot(x0 + hs(n, k) * (x1 - x0), y0 + hs(k, n) * (y1 - y0), 2 + hs(n + k, 7) * 4, hs(k, n + 3) < 0.5 ? [26, 36, 48] : [60, 74, 86], 0.28);
    for (let v = -40; v < 40; v += 2.4) { T.line([[x0 + v, y0], [x0 + v + 40, y0 + 40]]); T.stroke(sh(SLATE, -7), 112, 0.06); T.line([[x0 + v, y1], [x0 + v + 40, y1 - 40]]); T.stroke(sh(SLATE, -7), 112, 0.06); }
    T.unclip(); T.poly(ins(0.6)); T.stroke([22, 28, 34], 96, 0.14); T.poly(ins(0.8)); T.stroke(RUST, null, 0.1, 0.45); });
  // (the carved square in the middle: two raised frames)
  const [s0, s1, s2, s3] = PL.sq; T.poly(sqr(0, 0, s0)); T.fill(sh(STONE, -2), 150); T.poly(sqr(0, 0, (s0 + s1) / 2)); T.stroke(RAISED, 182, s0 - s1); T.poly(sqr(0, 0, (s2 + s3) / 2)); T.stroke(RAISED, 180, s2 - s3);
  PL.sq.forEach((h) => { T.poly(sqr(0, 0, h)); T.stroke(GROOVE, 82, 0.15); });
  // (a fan of carved scales in each corner of the square, with a dull moss inlay at its corner: green enough to glow, it read as an arrow on
  // the floor next to the gold hint arrow (0:39, 0:41), so it stays under vglow's threshold)
  quad.forEach(([sx, sy]) => { const F = PL.fans, cx = sx * F.at, cy = sy * F.at, a0 = sy > 0 ? 0 : Math.PI; T.poly(sqr(0, 0, s0)); T.clip(); T.arc(cx, cy, F.r); T.fill(sh(RAISED, -4), 168); T.clip();
    for (let j = 0; j < 11; j++) for (let i = 0; i < 8; i++) { T.arc(cx - sx * (i * 1.3 + (j % 2) * 0.65), cy - sy * j * 0.85, 0.68, a0, a0 + Math.PI); T.stroke(GROOVE, 104, 0.08, 0.8); }
    T.unclip(); T.arc(cx, cy, F.r - 0.3); T.stroke(RAISED, 184, 0.6); T.arc(cx, cy, F.r); T.stroke(GROOVE, 82, 0.14); T.unclip();
    const L = [[cx - sx * 3.8, cy - sy * 0.9], [cx - sx * 0.9, cy - sy * 0.9], [cx - sx * 0.9, cy - sy * 3.8]]; T.line(L); T.stroke(GROOVE, 90, 0.5); T.stroke(MOSS, 104, 0.18, 0.5); });
  // (the round medallion: a raised ring with rune marks, and the serpent's head inside: a crest of spikes, whiskers, scales, brows, glowing
  // eyes, fangs; it looks south as in the room's picture)
  const M = PL.med; T.arc(M.x, M.y, M.r[0]); T.fill(sh(STONE, -3), 148); T.arc(M.x, M.y, (M.r[0] + M.r[1]) / 2); T.stroke(RAISED, 184, M.r[0] - M.r[1]); M.r.forEach((r) => { T.arc(M.x, M.y, r); T.stroke(GROOVE, 82, 0.15); });
  for (let k = 0; k < 32; k++) { const a = k / 32 * TAU, c = Math.cos(a), s = Math.sin(a), r0 = M.r[1] + 0.15, r1 = k % 4 ? r0 + 0.35 : M.r[0] - 0.15; T.line([[M.x + c * r0, M.y + s * r0], [M.x + c * r1, M.y + s * r1]]); T.stroke(GROOVE, 120, k % 4 ? 0.07 : 0.1); }
  T.arc(M.x, M.y, M.r[1]); T.fill(sh(STONE, -4), 138);
  const mir = (L) => L.map((p) => [-p[0], p[1]]), carve = (L, c, hv) => { T.poly(L.map((p) => [M.x + p[0], M.y + p[1]])); T.fill(c, hv); T.stroke(GROOVE, 92, 0.11); }, cut = (L, hv, w) => { T.line(L.map((p) => [M.x + p[0], M.y + p[1]])); T.stroke(GROOVE, hv, w); };
  for (let k = 0; k < 9; k++) { const a = (25 + k * 16.25) * Math.PI / 180, R = 5.6 + 1.6 * (1 - Math.abs(k - 4) / 4), at = (r, da) => [Math.cos(a + da) * r, 0.8 + Math.sin(a + da) * r];
    carve([at(2.4, -0.13), at(R * 0.6, -0.1), at(R, 0), at(R * 0.6, 0.1), at(2.4, 0.13)], sh(RAISED, -2), 184); cut([at(2.6, 0), at(R * 0.85, 0)], 120, 0.06); }
  [[[3.4, -1.0], [7.2, -2.4], [3.1, -2.0]], [[2.6, -3.0], [5.9, -5.4], [2.2, -3.9]]].forEach((L) => { carve(L, sh(RAISED, -2), 182); carve(mir(L), sh(RAISED, -2), 182); });
  const half = [[0, 3.0], [1.8, 2.7], [3.2, 1.6], [3.7, 0.0], [3.3, -1.8], [2.4, -3.6], [1.5, -5.2], [0.8, -6.1]], HEAD = half.concat([[0, -6.4]], mir(half.slice(1)).reverse());
  carve(HEAD, RAISED, 192); T.poly(HEAD.map((p) => [M.x + p[0], M.y + p[1]])); T.clip();
  for (let j = 0; j < 17; j++) for (let i = -5; i <= 5; i++) { T.arc(M.x + i * 0.75 + (j % 2) * 0.375, M.y + 2.7 - j * 0.55, 0.38, 0, Math.PI); T.stroke(GROOVE, 150, 0.045, 0.7); }
  T.unclip();
  const PLATE = [[-3.1, 0.5], [-1.6, 0.9], [-1.1, 0.3], [-2.0, -0.2], [-3.0, -0.1]], EYE = [[-3.15, -0.45], [-2.3, -0.32], [-1.55, -0.78], [-2.45, -1.05]], FANG = [[0.35, -6.2], [0.85, -6.0], [0.55, -7.9]];
  carve(PLATE, sh(RAISED, 5), 206); carve(mir(PLATE), sh(RAISED, 5), 206);
  [[[0, 2.8], [0, -4.6]], [[-3.3, -0.8], [-2.2, -3.4], [-1.0, -5.6]], [[3.3, -0.8], [2.2, -3.4], [1.0, -5.6]]].forEach((L) => cut(L, 128, 0.06)); [[[-0.75, -5.15], [-0.45, -5.6]], [[0.75, -5.15], [0.45, -5.6]]].forEach((L) => cut(L, 100, 0.13));
  carve(FANG, sh(RAISED, 10), 204); carve(mir(FANG), sh(RAISED, 10), 204);
  /* (the eyes glow faintly: at full glow they read as two arrowheads either side of you, 0:30) */
  [EYE, mir(EYE)].forEach((L) => { T.poly(L.map((p) => [M.x + p[0], M.y + p[1]])); T.fill(GROOVE, 110); T.fill(GLOW, null, 0.25); });
  // (the rim: worn on top, chipped, stained by the venom; then the cracks)
  T.poly(PL.oct); T.stroke(sh(STONE, 18), 136, 0.32, 0.55); PL.chips.forEach((L) => { T.poly(L); T.fill(sh(GROOVE, 12), 104); });
  T.poly(PL.octAt(0.9)); T.stroke([56, 98, 42], null, 1.6, 0.2);
  /* (a glowing crack's core is 0.11 yards wide, 3 texels on the 2048 map, and faint: thinner, it broke into a dotted green line that flickers as
     the camera moves, like a beam out from under you, 0:48. The glowing ones are one path, so a branch doesn't glow twice where it starts) */
  PL.cracks.forEach((c) => { T.line(c.L); T.stroke(GROOVE, 88, c.w); });
  const lit = PL.cracks.filter((c) => c.glow).map((c) => c.L); if (lit.length) { T.line(lit); T.stroke(GLOW, null, 0.4, 0.09); T.stroke(GLOW, null, 0.11, 0.2); }
  // (weathering over everything: dark and light patches, a little moss, pits)
  T.poly(PL.oct); T.C.save(); T.C.clip();
  for (let k = 0; k < 900; k++) T.blot((hs(k, 97) - 0.5) * 74, (hs(k, 98) - 0.5) * 70, 0.3 + hs(k, 99) * 0.9, hs(k, 100) < 0.55 ? [24, 32, 31] : [94, 110, 108], 0.07);
  for (let k = 0; k < 150; k++) { const z = hs(k, 93); T.blot((hs(k, 90) - 0.5) * 74, (hs(k, 91) - 0.5) * 70, 1.2 + hs(k, 92) * 5, z < 0.5 ? [20, 28, 27] : z < 0.75 ? [50, 80, 36] : [92, 108, 106], z < 0.5 ? 0.16 : z < 0.75 ? 0.12 : 0.07); }
  for (let k = 0; k < 1600; k++) { T.arc((hs(k, 94) - 0.5) * 74, (hs(k, 95) - 0.5) * 70, 0.03 + hs(k, 96) * 0.06); T.fill(GROOVE, 112, 0.5); }
  T.C.restore(); finish(T, 6, false);

  // ---- the side wall: x along the wall, y down from its top, in yards (the venom covers all but its top half yard) ----
  const WW = 16, WH = 2, wk = 64, W = pen(WW * wk, WH * wk, (x, y) => [x * wk, y * wk], wk), J = [];
  W.C.fillStyle = rgb(sh(STONE, 4)); W.C.fillRect(0, 0, W.w, W.h); W.H.fillStyle = rgb([150, 150, 150]); W.H.fillRect(0, 0, W.w, W.h);
  for (let k = 0; k < 8; k++) J.push(k * 2 + 0.6 + (hs(k, 101) - 0.5) * 0.9);
  // (blocks, each its own shade, the joints slanting a little; a course line under the venom; the block shades wrap round the seam)
  for (let row = 0; row < 2; row++) for (let k = 0; k < 8; k++) { const o = row ? 1 : 0, x0 = J[k] + o, x1 = J[(k + 1) % 8] + o + (k === 7 ? WW : 0), y0 = row ? 0.9 : 0, y1 = row ? WH : 0.9, c = sh(STONE, 2 + (hs(k + row * 8, 102) - 0.5) * 12);
    [0, -WW, WW].forEach((d) => { W.poly([[x0 + d, y0], [x1 + d, y0], [x1 + d, y1], [x0 + d, y1]]); W.fill(c, 146 + hs(k, 103 + row) * 10); }); }
  for (let row = 0; row < 2; row++) J.forEach((x, k) => { const o = row ? 1 : 0; [0, -WW, WW].forEach((d) => { W.line([[x + o + d, row ? 0.9 : 0], [x + o + d + (hs(k, 104) - 0.5) * 0.2, row ? WH : 0.9]]); W.stroke(GROOVE, 112, 0.18, 0.35); W.stroke(GROOVE, 70, 0.07); }); });
  W.line([[-1, 0.9], [WW + 1, 0.9]]); W.stroke(GROOVE, 112, 0.18, 0.35); W.stroke(GROOVE, 70, 0.07);
  // (the worn top edge, rounded off in the heights; chips out of it; patches and pits; a crack or two)
  const tg = W.H.createLinearGradient(0, 0, 0, 0.14 * wk); tg.addColorStop(0, rgb([104, 104, 104])); tg.addColorStop(1, rgb([150, 150, 150], 0)); W.H.fillStyle = tg; W.H.fillRect(0, 0, W.w, 0.14 * wk);
  W.line([[-1, 0.04], [WW + 1, 0.04]]); W.stroke(sh(STONE, 12), null, 0.08, 0.7);
  for (let k = 0; k < 16; k++) { const x = hs(k, 105) * WW, w = 0.15 + hs(k, 106) * 0.35, d = 0.03 + hs(k, 107) * 0.06; [0, -WW, WW].forEach((o) => { W.poly([[x + o - w, 0], [x + o + w * 0.2, d], [x + o + w, 0]]); W.fill(sh(GROOVE, 8), 112); }); }
  for (let k = 0; k < 40; k++) { const x = hs(k, 108) * WW, y = hs(k, 109) * WH, z = hs(k, 110); [0, -WW, WW].forEach((o) => W.blot(x + o, y, 0.3 + hs(k, 111) * 1.1, z < 0.6 ? [20, 28, 27] : [90, 106, 104], z < 0.6 ? 0.18 : 0.08)); }
  for (let k = 0; k < 260; k++) { W.arc(hs(k, 112) * WW, hs(k, 113) * WH, 0.02 + hs(k, 114) * 0.04); W.fill(GROOVE, 112, 0.5); }
  for (let k = 0; k < 4; k++) { let x = 1 + hs(k, 115) * (WW - 2), y = 0; const L = [[x, y]]; while (y < 0.9) { x += (hs(k, 116 + y * 10) - 0.5) * 0.25; y += 0.12 + hs(k, 117 + y) * 0.1; L.push([x, y]); } W.line(L); W.stroke(GROOVE, 88, 0.05); }
  // (the venom's stain and a faint glowing line where it meets the stone, half a yard down)
  const vg = W.C.createLinearGradient(0, 0.22 * wk, 0, 0.62 * wk); vg.addColorStop(0, rgb([50, 95, 35], 0)); vg.addColorStop(1, rgb([50, 95, 35], 0.45)); W.C.fillStyle = vg; W.C.fillRect(0, 0.22 * wk, W.w, W.h);
  W.line([[-1, 0.55], [WW + 1, 0.55]]); W.stroke(GLOW, null, 0.03, 0.4);
  finish(W, 4, true);
  return { span: S, px, col: T.col, nrm: T.hgt, wall: W.col, wallN: W.hgt, wallW: WW, wallH: WH, free: () => { [T.col, T.hgt, W.col, W.hgt].forEach((c) => { c.width = c.height = 0; }); } };
}

// ---- the 3D view: pg3d(host, A) draws into host (a box over the 2D canvas). A as above, plus walk([x, y]) for a click on the floor, flashT
// (the red hurt flash) and fail(e) (a crash while drawing: practice.js goes back to 2D). Returns { draw(t), resize(), pick(clientX, clientY)
// -> [x, y] or null, fwd() -> the way the camera looks [x, y], yaw, info() (the renderer's counts, for tests), dispose() } ----
function pg3d(host, A) {
  const T = window.THREE, TAU = Math.PI * 2, WATER = -0.55, own = [], keep = (o) => { own.push(o); return o; };
  const R = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  R.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  const cv = R.domElement; cv.className = 'pg3-cv'; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair;touch-action:none';
  const fxL = document.createElement('div'), flL = document.createElement('div'), vgL = document.createElement('div');
  fxL.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  flL.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,rgba(255,40,30,0) 45%,rgba(255,40,30,.45) 100%)';
  vgL.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 55%,rgba(0,0,0,0) 58%,rgba(0,0,0,.42) 100%)'; /* (a soft dark edge round the picture) */
  host.textContent = ''; host.appendChild(cv); host.appendChild(vgL); host.appendChild(fxL); host.appendChild(flL);
  const FOGC = 0x07100a, scene = new T.Scene(); scene.background = new T.Color(FOGC); scene.fog = new T.FogExp2(FOGC, 0.0058);
  const cam = new T.PerspectiveCamera(55, 1, 0.5, 700);
  // the light: a cool sky and the venom's green from below, one warm key light with soft shadows, a cool rim light from behind her
  scene.add(new T.HemisphereLight(0xa7c2d4, 0x1b3611, 0.62));
  const sun = new T.DirectionalLight(0xffd3a1, 1.05); sun.position.set(-34, 72, 26); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -78, right: 78, top: 78, bottom: -78, near: 1, far: 240 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; scene.add(sun);
  const rim = new T.DirectionalLight(0x6aa6ff, 0.62); rim.position.set(44, 30, -60); scene.add(rim);
  const V = (p) => new T.Vector3(p[0], p[1], p[2]), onP = (x, y) => (A.P2 ? A.onPlat(x, y) : PG_UL.onPlat(x, y)), baseY = (x, y) => (onP(x, y) ? 0 : WATER - 0.45);
  const low = (x, y, r) => r < 8 && !onP(x, y); /* (a small shape off the stone sits on the venom, not in the air) */
  const col = (m, c) => { if (m.userData.c !== c) { m.userData.c = c; m.color.set(c); if (m.emissive && m.userData.glow) m.emissive.set(c).multiplyScalar(m.userData.glow); } };
  const ucol = (u, c) => { if (u.c !== c) { u.c = c; u.value.set(c); } };
  const UT = { value: 0 }, UPX = { value: 800 }, UP = new T.Vector3(0, 1, 0), XV = new T.Vector3(1, 0, 0), ZV = new T.Vector3(0, 0, 1);
  const hash = (a, b) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  const canvas = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
  const ctex = (c, rep) => { const tx = keep(new T.CanvasTexture(c)); if (rep) { tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.anisotropy = 4; } return tx; };
  // (shader pieces: a cheap smooth noise)
  const NOISE = 'float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }\n' +
    'float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }\n';

  // ---- the venom: one flat sheet, its swell and glowing veins drawn in its shader (nothing to move per frame), brighter by the stone with a line
  // of foam at the very edge, darker and deeper far out; it still takes her shadow ----
  const wg = keep(new T.PlaneGeometry(560, 560, 1, 1)); wg.rotateX(-Math.PI / 2);
  const wm = keep(new T.MeshStandardMaterial({ color: 0x174211, roughness: 0.4, metalness: 0.12 }));
  wm.onBeforeCompile = (sh) => { sh.uniforms.uT = UT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <project_vertex>', '#include <project_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;\nuniform float uT;\n' + NOISE + 'float octD(vec2 q){ q = abs(q); return max(max(q.x - 36.5, q.y - 34.0), (q.x + q.y - 49.0) * 0.7071); }\n')
      .replace('#include <color_fragment>', '#include <color_fragment>\nvec2 wq = vec2(vWp.x, -vWp.z); float wd = octD(wq), deep = smoothstep(6.0, 150.0, wd);\ndiffuseColor.rgb *= mix(1.0, 0.3, deep);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' +
        'vec2 dh = vec2(0.055 * cos(wq.x * 0.33 + uT * 1.3), 0.035 * cos(wq.y * 0.29 - uT * 0.9)) + 0.021 * cos(dot(wq, vec2(0.21, 0.17)) + uT * 1.7) * vec2(1.0, 0.8) + 0.033 * cos(dot(wq, vec2(-0.47, 0.39)) - uT * 2.3) * vec2(-1.0, 0.83) + 0.03 * cos(dot(wq, vec2(0.9, 0.7)) + uT * 3.1) * vec2(1.0, 0.78);\n' +
        'normal = normalize((viewMatrix * vec4(normalize(vec3(-dh.x, 1.0, dh.y)), 0.0)).xyz);')
      .replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular *= 0.22;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' +
        'float vA = vn(wq * 0.085 + vec2(uT * 0.05, uT * 0.035)), vB = vn(wq * 0.11 - vec2(uT * 0.04, -uT * 0.06)), vein = pow(1.0 - abs(vA - vB), 14.0);\n' +
        'float edge = exp(-max(wd, 0.0) / 2.2), foam = smoothstep(1.3, 0.1, wd) * (0.55 + 0.45 * sin(wq.x * 1.7 + wq.y * 1.3 + uT * 3.1));\n' +
        'totalEmissiveRadiance += vec3(0.3, 0.85, 0.12) * vein * 0.3 * (1.0 - deep * 0.85) + vec3(0.4, 0.95, 0.18) * edge * 0.4 + vec3(0.78, 1.0, 0.58) * foam * 0.45 + vec3(0.012, 0.04, 0.008);'); };
  const water = new T.Mesh(wg, wm); water.position.y = WATER; water.receiveShadow = true; scene.add(water);
  // (the cavern: jagged rock spires standing in the venom far out, fading into the dark, so the room reads as deep)
  { const g = keep(new T.ConeGeometry(1, 1, 7, 5)); g.translate(0, 0.5, 0); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), j = hash(x * 10 + y * 3, z * 10 - y * 7) - 0.5; p.setXYZ(i, x * (1 + j * 0.6), y, z * (1 + j * 0.6)); } g.computeVertexNormals();
    const N = 26, im = keep(new T.InstancedMesh(g, keep(new T.MeshStandardMaterial({ color: 0x2a3329, roughness: 0.95, flatShading: true, emissive: 0x040a03 })), N)), M4 = new T.Matrix4(), Q = new T.Quaternion(), Sx = new T.Vector3(), Px = new T.Vector3();
    for (let i = 0; i < N; i++) { const a = i / N * TAU + hash(i, 1) * 0.2, r = 118 + hash(i, 2) * 80, h = 30 + hash(i, 3) * 60, w = 5 + hash(i, 4) * 8; Px.set(Math.cos(a) * r, WATER - 3, Math.sin(a) * r); Q.setFromAxisAngle(UP, hash(i, 5) * TAU); Sx.set(w, h, w); M4.compose(Px, Q, Sx); im.setMatrixAt(i, M4); }
    scene.add(im); }
  // (motes of venom drifting up in the air round the stone)
  { const N = 240, pos = new Float32Array(N * 3), sd = new Float32Array(N); for (let i = 0; i < N; i++) { const a = hash(i, 9) * TAU, r = 6 + Math.sqrt(hash(i, 10)) * 90; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = hash(i, 11) * 26; pos[i * 3 + 2] = Math.sin(a) * r; sd[i] = hash(i, 12); }
    const g = keep(new T.BufferGeometry()); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aS', new T.BufferAttribute(sd, 1));
    const m = keep(new T.ShaderMaterial({ uniforms: { uT: UT, uPx: UPX }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: 'attribute float aS; uniform float uT, uPx; varying float vA; void main(){ vec3 p = position; p.y = mod(p.y + uT * (0.35 + aS * 0.8), 26.0); p.x += sin(uT * 0.35 + aS * 40.0) * 2.0; p.z += cos(uT * 0.3 + aS * 30.0) * 2.0; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.0, (0.16 + 0.2 * aS) * uPx / -mv.z); vA = (0.45 + 0.55 * sin(uT * 2.0 + aS * 50.0)) * smoothstep(0.0, 3.0, p.y) * smoothstep(26.0, 17.0, p.y); }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(0.62, 1.0, 0.3, max(vA, 0.0) * 0.8 * smoothstep(0.5, 0.0, d)); }' }));
    const pts = new T.Points(g, m); pts.frustumCulled = false; scene.add(pts); }
  // the stone: practice.js's PG_UL.onPlat octagon (|x| <= 36.5, |y| <= 34, |x| + |y| <= 49), a pale rim at the very edge. Its top and side
  // walls wear the carved stone pg3dStoneDraw draws once here (a colour map and a normal map each; 1024 px on a PC with little memory): the
  // top's texture spans the plan's 74 yards with the stone's middle at its middle (the top's UVs are yards), the wall's runs along the wall
  // with its top edge at the wall's top (the wall's UVs are yards along it and 1 - height). The faint venom glow in the cracks and the
  // serpent's eyes comes from their green in the colour map, worked out in the shader (no third texture to read). Kept as quick to draw as the old
  // tiles (measured in headless Chrome): Lambert light (rough stone shows no shine anyway), the normal maps read from one mip level.
  const OCT = [[36.5, 12.5], [15, 34], [-15, 34], [-36.5, 12.5], [-36.5, -12.5], [-15, -34], [15, -34], [36.5, -12.5]], DEPTH = 4;
  const shp = (L) => { const s = new T.Shape(); L.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.closePath(); return s; };
  const STN = pg3dStoneDraw((w, h) => canvas(w, h, () => {}), (navigator.deviceMemory || 8) < 4 ? 1024 : 2048), AN = Math.min(4, R.capabilities.getMaxAnisotropy()); keep({ dispose: STN.free });
  // (phase 2's ledges still wear the old floor tiles: its 3D kit asks for them as slab; the carved stone took their place on phase 1's platform
  // and phase 2's 3D stopped loading with "slab is not defined", Nov 15)
  const slab = A.P2 ? ctex(canvas(256, 256, (g) => { g.fillStyle = '#4f585f'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const l = 116 + ((i * 3 + j * 5) % 4) * 6; g.fillStyle = 'rgb(' + l + ',' + (l + 9) + ',' + (l + 17) + ')'; g.fillRect(i * 128 + 3, j * 128 + 3, 122, 122); }
    for (let k = 0; k < 1400; k++) { g.fillStyle = 'rgba(0,0,0,' + (hash(k, 1) * 0.07).toFixed(3) + ')'; g.fillRect(hash(k, 2) * 256, hash(k, 3) * 256, 2, 2); } }), true) : null; if (slab) slab.repeat.set(0.1, 0.1);
  const stx = (c, rx, ry, ox, oy, nrm) => { const tx = ctex(c, true); tx.anisotropy = nrm ? 1 : AN; if (nrm) tx.minFilter = T.LinearMipmapNearestFilter; tx.repeat.set(rx, ry); tx.offset.set(ox, oy); return tx; };
  const vglow = (m) => { m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' +
    'totalEmissiveRadiance += vec3(0.15, 0.46, 0.06) * smoothstep(0.1, 0.3, diffuseColor.g - max(diffuseColor.r, diffuseColor.b));'); }; return m; };
  const pg = keep(new T.ExtrudeGeometry(shp(OCT), { depth: DEPTH, bevelEnabled: false })); pg.rotateX(-Math.PI / 2);
  const plat = new T.Mesh(pg, [vglow(keep(new T.MeshLambertMaterial({ map: stx(STN.col, 1 / STN.span, 1 / STN.span, 0.5, 0.5), normalMap: stx(STN.nrm, 1 / STN.span, 1 / STN.span, 0.5, 0.5, true) }))),
    vglow(keep(new T.MeshLambertMaterial({ map: stx(STN.wall, 1 / STN.wallW, -1 / STN.wallH, 0, 1 + (1 - DEPTH) / STN.wallH), normalMap: stx(STN.wallN, 1 / STN.wallW, -1 / STN.wallH, 0, 1 + (1 - DEPTH) / STN.wallH, true) })))]);
  plat.position.y = -DEPTH; plat.receiveShadow = true; scene.add(plat);
  { const rim = shp(OCT); rim.holes.push(shp(OCT.map((p) => [p[0] * 0.985, p[1] * 0.982]).reverse())); const rg = keep(new T.ShapeGeometry(rim)); rg.rotateX(-Math.PI / 2);
    const m = new T.Mesh(rg, keep(new T.MeshBasicMaterial({ color: 0xb4c2b6, transparent: true, opacity: 0.38, depthWrite: false }))); /* (a worn pale stone over the carved texture, not a white band) */ m.position.y = 0.02; m.renderOrder = 5; m.name = 'pg-rim'; scene.add(m); } /* (named: phase 3 hides it with the platform, src/practice-p3.js) */

  // ---- reused pieces: floor shapes from a few flat geometries, everything else from pools (nothing new per frame once warm) ----
  const flatG = (g) => { g.rotateX(-Math.PI / 2); return g; };
  const UDISC = flatG(keep(new T.CircleGeometry(1, 72))), URING = flatG(keep(new T.RingGeometry(0.965, 1, 96))), URECT = flatG(keep(new T.PlaneGeometry(1, 1)));
  const RINGS = new Map(), ringG = (r, w, dash) => { const key = r.toFixed(2) + '|' + w.toFixed(2) + (dash ? 'd' : ''); let g = RINGS.get(key); if (g) return g;
    if (!dash) g = keep(new T.RingGeometry(Math.max(0.01, r - w), r, Math.max(32, Math.min(180, Math.round(r * 8)))));
    else { const n = Math.max(8, Math.round(TAU * r / 2.4)), sub = 5, pos = [], idx = [];
      for (let k = 0; k < n; k++) { const a0 = k * TAU / n, a1 = a0 + TAU / n * 0.58, v0 = pos.length / 3; for (let j = 0; j <= sub; j++) { const a = a0 + (a1 - a0) * j / sub, c = Math.cos(a), s = Math.sin(a); pos.push(c * (r - w), s * (r - w), 0, c * r, s * r, 0); }
        for (let j = 0; j < sub; j++) { const b = v0 + j * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
      g = keep(new T.BufferGeometry()); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); }
    g = flatG(g); RINGS.set(key, g); return g; };
  const ARCS = new Map(), arcG = (r, f) => { const q = Math.max(1, Math.min(48, Math.round(f * 48))), key = r + '|' + q; let g = ARCS.get(key); if (!g) { g = flatG(keep(new T.RingGeometry(r - 0.32, r, 64, 1, Math.PI / 2 - q / 48 * TAU, q / 48 * TAU))); ARCS.set(key, g); } return g; };
  // (a wave over its strip: rises from the back, a crest that bulges forward in the middle like the 2D's crescents, a steep front; ends closed.
  // Only its height moves in its shader, so it never leaves the strip it hits)
  const WAVES = new Map(), waveG = (D, W) => { const key = D.toFixed(2) + '|' + W.toFixed(2); let g = WAVES.get(key); if (g) return g;
    const NX = 20, NZ = Math.max(6, Math.round(W / 0.8)), pos = [], idx = [], prof = (x, q) => { const xc = D * (0.4 + 0.32 * q), H = 1.5 + 1.3 * q; return Math.max(0.04, x <= xc ? H * Math.pow(Math.sin(x / xc * Math.PI / 2), 1.5) : H * Math.cos((x - xc) / (D - xc) * Math.PI / 2)); };
    for (let j = 0; j <= NZ; j++) { const z = -W / 2 + W * j / NZ, q = 1 - Math.pow(2 * z / W, 2); for (let i = 0; i <= NX; i++) { const x = D * i / NX; pos.push(x - D / 2, prof(x, q), z); } }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    [0, NZ].forEach((j) => { const z = -W / 2 + W * j / NZ, v0 = pos.length / 3; for (let i = 0; i <= NX; i++) { const x = D * i / NX; pos.push(x - D / 2, prof(x, 0), z, x - D / 2, 0.02, z); } for (let i = 0; i < NX; i++) { const b = v0 + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } });
    g = keep(new T.BufferGeometry()); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); WAVES.set(key, g); return g; };
  const FLAT = []; let nF = 0;
  const flatMake = () => { const m = new T.Mesh(UDISC, keep(new T.MeshBasicMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide }))); scene.add(m); return m; };
  const flat = (geo, x, y, sx, sz, ry, c, o, lw) => { let m = FLAT[nF]; if (!m) m = FLAT[nF] = flatMake();
    nF++; m.geometry = geo; m.visible = true; m.position.set(x, lw ? WATER + 0.3 : 0.035, -y); m.scale.set(sx, 1, sz); m.rotation.set(0, ry, 0); col(m.material, c); m.material.opacity = Math.max(0, Math.min(1, o)); m.renderOrder = 10 + nF; return m; };
  const pools = [], pool = (make) => { const p = { L: [], n: 0 }; pools.push(p); const get = () => { let o = p.L[p.n]; if (!o) { o = make(); p.L.push(o); scene.add(o); } p.n++; o.visible = true; return o; }; get.L = p.L; return get; };
  // (textures drawn once: a soft glow, a ring of foam, her scales, the hood's membrane)
  const GLOWT = ctex(canvas(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }));
  const FOAMT = ctex(canvas(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 18, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(0,0,0,' + (hash(i, 4) * 0.7).toFixed(2) + ')'; g.beginPath(); g.arc(hash(i, 5) * 128, hash(i, 6) * 128, 1 + hash(i, 7) * 4, 0, TAU); g.fill(); } }));
  const SCALET = ctex(canvas(256, 256, (g) => { g.fillStyle = '#9c9c9c'; g.fillRect(0, 0, 256, 256);
    for (let row = 9; row >= -1; row--) for (let c = -1; c <= 8; c++) { const x = c * 32 + (row % 2 ? 16 : 0), y = row * 32, gr = g.createRadialGradient(x, y + 6, 2, x, y + 4, 22);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#e4e4e4'); gr.addColorStop(0.88, '#b8b8b8'); gr.addColorStop(1, '#8c8c8c'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 17, 21, 0, 0, Math.PI); g.fill(); } }), true);
  const FINT = ctex(canvas(128, 256, (g) => { const gr = g.createLinearGradient(0, 256, 128, 0); gr.addColorStop(0, '#3c1a66'); gr.addColorStop(0.6, '#7a3fb2'); gr.addColorStop(1, '#a865e0'); g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
    g.strokeStyle = 'rgba(20,6,34,.85)'; g.lineWidth = 5; for (let i = 0; i < 7; i++) { const a = 0.15 + i * 0.21; g.beginPath(); g.moveTo(0, 256); g.quadraticCurveTo(Math.sin(a) * 70, 256 - Math.cos(a) * 140, Math.sin(a) * 150, 256 - Math.cos(a) * 270); g.stroke(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(216,242,47,' + (0.25 + hash(i, 8) * 0.5).toFixed(2) + ')'; g.beginPath(); g.arc(30 + hash(i, 9) * 95, 20 + hash(i, 10) * 150, 2 + hash(i, 11) * 4, 0, TAU); g.fill(); } }));
  // (the effect shaders: 0 a soft glowing tube, 1 bands flowing along it, 2 a dome with a bright rim and shimmering bands that pulse quicker as it
  // nears, 3 a column of light fading upward)
  const FXV = 'varying vec2 vUv; varying float vF; varying vec3 vP; void main(){ vUv = uv; vP = position; vec4 wp = modelMatrix * vec4(position, 1.0); vec3 n = normalize(mat3(modelMatrix) * normal); vF = abs(dot(n, normalize(cameraPosition - wp.xyz))); gl_Position = projectionMatrix * viewMatrix * wp; }';
  const FXF = 'uniform vec3 uC; uniform float uO, uT, uLen, uF, uK; varying vec2 vUv; varying float vF; varying vec3 vP;\nvoid main(){ float a; vec3 c = uC;\n' +
    '#if MODE == 0\n a = uO * pow(vF, 1.4);\n' +
    '#elif MODE == 1\n float b = 0.5 + 0.5 * sin(vUv.y * uLen - uT * 12.0); a = uO * (0.45 + 0.55 * b) * (0.5 + 0.5 * vF); c = mix(uC, vec3(1.0), 0.22 * b);\n' +
    '#elif MODE == 2\n float fr = pow(1.0 - vF, 2.4), an = atan(vP.z, vP.x), sh = 0.5 + 0.5 * sin(vP.y * 16.0 - uT * (2.5 + 7.0 * uF) + sin(an * 7.0 + uT * 1.3) * 1.6), pu = 0.5 + 0.5 * sin(uT * (4.0 + 10.0 * uF));\n a = uO * (0.12 + fr * 2.4 + sh * (0.3 + fr)) * (0.8 + 0.5 * pu * uF); c = uC * (0.75 + fr * 0.9 + sh * 0.35);\n' +
    '#else\n a = uO * pow(1.0 - vUv.y, uK) * (0.6 + 0.4 * vF);\n#endif\n gl_FragColor = vec4(c, clamp(a, 0.0, 1.0)); }';
  const fxMat = (mode, c, add) => keep(new T.ShaderMaterial({ defines: { MODE: mode }, uniforms: { uC: { value: new T.Color(c) }, uO: { value: 1 }, uT: UT, uLen: { value: 10 }, uF: { value: 0 }, uK: { value: 1.6 } }, vertexShader: FXV, fragmentShader: FXF, transparent: true, depthWrite: false, side: T.DoubleSide, blending: add ? T.AdditiveBlending : T.NormalBlending }));
  // (points worked out in their shader from fixed random numbers: 0 sparks flowing along a beam, 1 a splash's droplets, 2 spray over a wave's crest)
  const PTV = 'attribute vec3 aR; uniform float uT, uPx, uP, uS, uD, uW, uO; varying float vA;\nvoid main(){ vec3 p; float sz;\n' +
    '#if MODE == 0\n float u = fract(aR.x + uT * (0.7 + 0.5 * aR.y)), an = aR.z * 6.2832 + uT * (5.0 + 3.0 * aR.y), rr = 0.2 + 0.7 * aR.y * (1.0 - u * 0.4); p = vec3(cos(an) * rr, u, sin(an) * rr); sz = 0.2 + 0.25 * aR.z; vA = uO * sin(u * 3.1416);\n' +
    '#elif MODE == 1\n float tt = uP * 1.5, an = aR.x * 6.2832, sp = (2.0 + 5.0 * aR.y) * uS, vy = (7.0 + 10.0 * aR.z) * sqrt(uS), y = vy * tt - 11.0 * tt * tt; p = vec3(cos(an) * sp * tt, y, sin(an) * sp * tt); sz = (0.28 + 0.35 * aR.z) * uS; vA = (y > -0.3 ? 1.0 : 0.0) * (1.0 - uP);\n' +
    '#else\n float ph = fract(aR.y + uT * (0.8 + 0.7 * aR.z)), z = (aR.x - 0.5) * uW * 0.95, q = 1.0 - pow(2.0 * z / max(uW, 0.1), 2.0); p = vec3(uD * (0.02 + 0.2 * aR.z) + ph * 1.1, (1.5 + 1.3 * q) * (1.0 + 0.1 * ph) + ph * (0.6 + 1.2 * aR.z), z); sz = 0.14 + 0.2 * aR.z; vA = uO * (1.0 - ph) * 0.9;\n#endif\n' +
    ' vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.0, sz * uPx / -mv.z); }';
  const PTF = 'uniform vec3 uC; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(uC, vA * smoothstep(0.5, 0.1, d)); }';
  const ptsG = (n) => { const g = keep(new T.BufferGeometry()), r = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) r[i] = hash(i, n); g.setAttribute('position', new T.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aR', new T.BufferAttribute(r, 3)); return g; };
  const ptsMat = (mode, c) => keep(new T.ShaderMaterial({ defines: { MODE: mode }, uniforms: { uC: { value: new T.Color(c) }, uT: UT, uPx: UPX, uP: { value: 0 }, uS: { value: 1 }, uD: { value: 5 }, uW: { value: 5 }, uO: { value: 1 } }, vertexShader: PTV, fragmentShader: PTF, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  const pts = (g, m) => { const p = new T.Points(g, m); p.frustumCulled = false; p.renderOrder = 650; return p; };
  const SPARKG = ptsG(28), DROPG = ptsG(70), SPRAYG = ptsG(30);
  // (a tube along a path: fn(u, o) puts the point o.p, two sideways directions o.d (its back) and o.s, returns the radius; cf gives colours round it)
  const tube = (n, m, fn, uRep, vRep, cf) => { const pos = [], nor = [], uv = [], cols = [], idx = [], o = { p: new T.Vector3(), t: new T.Vector3(), d: new T.Vector3(), s: new T.Vector3() }, cc = [0, 0, 0];
    for (let i = 0; i <= n; i++) { const u = i / n, r = fn(u, o); for (let j = 0; j <= m; j++) { const a = j / m * TAU, c = Math.cos(a), sn = Math.sin(a), nx = o.d.x * c + o.s.x * sn, ny = o.d.y * c + o.s.y * sn, nz = o.d.z * c + o.s.z * sn;
      pos.push(o.p.x + nx * r, o.p.y + ny * r, o.p.z + nz * r); nor.push(nx, ny, nz); uv.push(j / m * uRep, u * vRep); if (cf) { cf(c, cc); cols.push(cc[0], cc[1], cc[2]); } } }
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const a = i * (m + 1) + j, b = a + m + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = keep(new T.BufferGeometry()); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); if (cf) g.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); g.setIndex(idx); return g; };
  // (a smooth path through a few points, worked out without new objects)
  const crPt = (Pt, u, o) => { const n = Pt.length - 1, f = Math.min(n - 1e-6, Math.max(0, u * n)), i = Math.floor(f), s = f - i, p0 = Pt[Math.max(0, i - 1)], p1 = Pt[i], p2 = Pt[i + 1], p3 = Pt[Math.min(n, i + 2)], s2 = s * s, s3 = s2 * s;
    for (let k = 0; k < 3; k++) o[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * s + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * s2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * s3); return o; };
  const fA = [0, 0, 0], fB = [0, 0, 0], frame = (Pt, u, o) => { crPt(Pt, u, fA); crPt(Pt, u < 0.99 ? u + 0.01 : u - 0.01, fB); o.t.set(fB[0] - fA[0], fB[1] - fA[1], fB[2] - fA[2]); if (u >= 0.99) o.t.negate(); o.t.normalize(); o.p.set(fA[0], fA[1], fA[2]); o.d.crossVectors(o.t, XV).normalize(); o.s.crossVectors(o.d, o.t); return o; };
  const BACK = [0.3, 0.19, 0.5], SIDE = [0.47, 0.31, 0.67], BELLY = [0.8, 0.83, 0.5], shade = (k, o) => { const q = Math.min(1, Math.abs(k) * 1.25), b = k > 0 ? BACK : BELLY; for (let i = 0; i < 3; i++) o[i] = SIDE[i] + (b[i] - SIDE[i]) * q; return o; };
  const paint = (g, fn) => { const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3), o = [0, 0, 0]; for (let i = 0; i < p.count; i++) { shade(fn(p.getX(i), p.getY(i), p.getZ(i), n.getX(i), n.getY(i), n.getZ(i)), o); c[i * 3] = o[0]; c[i * 3 + 1] = o[1]; c[i * 3 + 2] = o[2]; } g.setAttribute('color', new T.BufferAttribute(c, 3)); return g; };
  const uvx = (g, a, b) => { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * a, uv.getY(i) * b); return g; };
  // (round things, cones, the glow sprites)
  const BALL = keep(new T.SphereGeometry(1, 18, 14)), CONEG = keep(new T.ConeGeometry(0.9, 3, 8)), BEAMG = keep(new T.CylinderGeometry(1, 1, 1, 14, 1, true)); BEAMG.translate(0, 0.5, 0);
  const DOMEG = keep(new T.SphereGeometry(1, 48, 18, 0, TAU, 0, Math.PI / 2)), WALLG = keep(new T.CylinderGeometry(1, 1, 1, 64, 1, true)); WALLG.translate(0, 0.5, 0);
  const glowM = (c, o) => keep(new T.SpriteMaterial({ map: GLOWT, color: c, transparent: true, opacity: o == null ? 1 : o, depthWrite: false, blending: T.AdditiveBlending, fog: false }));
  const glow = pool(() => { const sp = new T.Sprite(glowM(0xffffff)); sp.renderOrder = 700; return sp; });
  const glw = (X, Y, Z, s, c, o, sy, cy) => { const sp = glow(); sp.position.set(X, Y, Z); sp.scale.set(s, s * (sy || 1), 1); sp.center.set(0.5, cy == null ? 0.5 : cy); col(sp.material, c); sp.material.opacity = o; return sp; };
  const blob = pool(() => { const m = new T.Mesh(URECT, keep(new T.MeshBasicMaterial({ map: GLOWT, color: 0x000000, transparent: true, depthWrite: false }))); m.renderOrder = 8; return m; });
  const blobAt = (x, y, h, r) => { const m = blob(), k = r * (0.8 + h * 0.035); m.position.set(x, onP(x, y) ? 0.04 : WATER + 0.06, -y); m.scale.set(k * 2.2, 1, k * 2.2); m.material.opacity = 0.12 + 0.6 * Math.max(0, 1 - h / 40); };
  const foam = pool(() => { const m = new T.Mesh(URECT, keep(new T.MeshBasicMaterial({ map: FOAMT, color: 0xd9ffb8, transparent: true, depthWrite: false }))); m.renderOrder = 9; return m; });
  const foamAt = (X, Z, s, o, spin) => { const m = foam(); m.position.set(X, WATER + 0.07, Z); m.scale.set(s, 1, s); m.rotation.set(0, spin || 0, 0); m.material.opacity = o; return m; };

  // ---- the spell effects ----
  // (the bubble, the egg's shell, your defensive: a dome with a bright rim; the soak's column of light; the coil soaks' spectral coils and their flash)
  const dome = pool(() => new T.Mesh(DOMEG, fxMat(2, '#d8f22f', false))), wall = pool(() => new T.Mesh(WALLG, fxMat(3, '#24f2cb', true)));
  const HELIXG = tube(110, 8, (u, o) => { const a = u * 2.4 * TAU, rr = 1 - 0.2 * u; o.p.set(Math.cos(a) * rr, u, Math.sin(a) * rr); o.t.set(-Math.sin(a) * rr * 2.4 * TAU, 1, Math.cos(a) * rr * 2.4 * TAU).normalize(); o.d.set(Math.cos(a), 0, Math.sin(a)); o.s.crossVectors(o.d, o.t).normalize(); return 0.055 * (1 - 0.4 * u); }, 1, 1);
  const coil = pool(() => { const g = new T.Group(), hm = fxMat(1, '#30e0c0', true), hx = new T.Mesh(HELIXG, hm), a1 = 2.4 * TAU, hd = new T.Mesh(BALL, hm);
    hm.uniforms.uLen.value = 70; hd.scale.set(0.11, 0.08, 0.2); hd.position.set(Math.cos(a1) * 0.8, 1.02, Math.sin(a1) * 0.8); hd.quaternion.setFromUnitVectors(ZV, new T.Vector3(-Math.sin(a1), 0.12, Math.cos(a1)).normalize()); hx.add(hd);
    const flm = keep(new T.MeshBasicMaterial({ color: 0xc8fff2, transparent: true, depthWrite: false, blending: T.AdditiveBlending })), fl = new T.Mesh(UDISC, flm), fcm = fxMat(3, '#b8fff0', true), fc = new T.Mesh(WALLG, fcm);
    fl.position.y = 0.06; fl.renderOrder = 640; fc.renderOrder = 641; hx.renderOrder = 642; g.add(hx, fl, fc); g.userData = { hx, hm, fl, flm, fc, fcm }; return g; });
  // (her waves and the tails': a rolling crest, darker at its foot, foam and spray on top)
  const WAVEV = 'uniform float uT; varying float vH; varying vec3 vN; varying vec3 vW; void main(){ vec3 p = position; p.y *= 1.0 + 0.09 * sin(p.z * 0.85 + uT * 6.0) + 0.05 * sin(p.z * 2.3 - uT * 8.5); vH = p.y / 2.8; vec4 wp = modelMatrix * vec4(p, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * wp; }';
  const WAVEF = 'uniform float uO, uT; varying float vH; varying vec3 vN; varying vec3 vW;\n' + NOISE + 'void main(){ vec3 n = normalize(vN), v = normalize(cameraPosition - vW); float lam = 0.55 + 0.45 * max(dot(n, normalize(vec3(-0.4, 0.8, 0.35))), 0.0);\n' +
    ' vec3 c = mix(vec3(0.05, 0.24, 0.04), vec3(0.38, 0.84, 0.12), smoothstep(0.0, 0.5, vH)); c = mix(c, vec3(0.7, 1.0, 0.32), smoothstep(0.45, 0.8, vH)) * lam;\n' +
    ' float fn = vn(vW.xz * 1.6 + vec2(uT * 2.5, -uT * 1.7)), fm = smoothstep(0.6, 0.92, vH + (fn - 0.5) * 0.35), fr = pow(1.0 - abs(dot(n, v)), 2.0);\n' +
    ' c = mix(c, vec3(0.93, 1.0, 0.86), fm) + vec3(0.35, 0.8, 0.15) * fr * 0.4; gl_FragColor = vec4(c, uO * (0.84 + 0.16 * fm)); }';
  const wave = pool(() => { const m = new T.Mesh(URECT, keep(new T.ShaderMaterial({ uniforms: { uO: { value: 1 }, uT: UT }, vertexShader: WAVEV, fragmentShader: WAVEF, transparent: true, depthWrite: false, side: T.DoubleSide }))), sm = ptsMat(2, '#e8ffd0'), sp = pts(SPRAYG, sm);
    m.add(sp); m.userData = { sm }; return m; });
  // (exactly the strip a wave hits: a thin red border drawn after the wave, so it reads on the stone and on the venom; a red fill under the wave
  // was covered by it and never showed, review of Nov 15)
  const EDGEV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const EDGEF = 'uniform vec2 uS; uniform float uO; varying vec2 vUv; void main(){ vec2 d = min(vUv, 1.0 - vUv) * uS; if (min(d.x, d.y) > 0.3) discard; gl_FragColor = vec4(1.0, 0.27, 0.18, uO); }';
  const edge = pool(() => { const m = new T.Mesh(URECT, keep(new T.ShaderMaterial({ uniforms: { uS: { value: new T.Vector2(1, 1) }, uO: { value: 1 } }, vertexShader: EDGEV, fragmentShader: EDGEF, transparent: true, depthWrite: false, side: T.DoubleSide }))); m.renderOrder = 605; return m; });
  // (the beam: a soft glow, a bright core with bands flowing to the tank, sparks round it)
  const beam = pool(() => { const g = new T.Group(), om = fxMat(0, '#3af2a8', true), im = fxMat(1, '#b8ffe6', true), a = new T.Mesh(BEAMG, om), b = new T.Mesh(BEAMG, im), sm = ptsMat(0, '#d8fff0'), sp = pts(SPARKG, sm);
    om.uniforms.uO.value = 0.55; im.uniforms.uO.value = 0.95; a.scale.set(0.95, 1, 0.95); b.scale.set(0.24, 1, 0.24); a.renderOrder = b.renderOrder = 640; g.add(a, b, sp); g.userData = { im, sm }; return g; });
  // (a splash: droplets thrown up and out, a ring of foam spreading, a short column of venom that rises and falls, fading fast at its top: a
  // tall bright one sat right behind the HUD's call-outs and washed their words out, review of Nov 15)
  const splash = pool(() => { const g = new T.Group(), pm = ptsMat(1, '#c8ff8a'), d = pts(DROPG, pm), fm = keep(new T.MeshBasicMaterial({ map: FOAMT, color: 0xd9ffb8, transparent: true, depthWrite: false })), f = new T.Mesh(URECT, fm), cm = fxMat(3, '#9cff5a', true), c = new T.Mesh(WALLG, cm);
    cm.uniforms.uK.value = 3; f.position.y = 0.08; f.renderOrder = 9; c.renderOrder = 645; g.add(d, f, c); g.userData = { pm, f, fm, c, cm }; return g; });
  // (falling eggs, Falling Debris rocks with a burning trail, the Toxic Womb)
  const EGGM = keep(new T.MeshStandardMaterial({ color: 0xe9e2c6, roughness: 0.35, emissive: 0x15140c })), VIPM = keep(new T.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0x3a0606, roughness: 0.5 })), RAWM = keep(new T.MeshStandardMaterial({ color: 0xa7c46b, roughness: 0.6 }));
  const egg = pool(() => { const m = new T.Mesh(BALL, EGGM); m.scale.set(0.9, 1.17, 0.9); m.castShadow = true; return m; });
  const ROCKG = (() => { const g = keep(new T.IcosahedronGeometry(1, 1)), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), j = 0.75 + 0.5 * hash(Math.round(x * 50) + Math.round(z * 30), Math.round(y * 70)); p.setXYZ(i, x * j, y * j * 0.8, z * j); } g.computeVertexNormals(); return g; })();
  const ROCKM = keep(new T.MeshStandardMaterial({ color: 0x4a3f38, roughness: 0.95, flatShading: true, emissive: 0x2a0c02 })), WOMBM = keep(new T.MeshStandardMaterial({ color: 0x6b3a8c, roughness: 0.35, emissive: 0x2a5a0a }));
  const rock = pool(() => { const m = new T.Mesh(ROCKG, ROCKM); m.castShadow = true; return m; }), womb = pool(() => { const m = new T.Mesh(BALL, WOMBM); m.castShadow = true; return m; });
  const VIPG = keep(new T.CapsuleGeometry(0.42, 1.8, 4, 8));
  const viper = pool(() => { const g = new T.Group(), b = new T.Mesh(VIPG, VIPM), h = new T.Mesh(BALL, VIPM); b.rotation.x = Math.PI / 2; b.position.y = 0.45; h.scale.setScalar(0.62); h.position.set(0, 0.75, 1.5); b.castShadow = true; g.add(b, h); return g; });
  const rawl = pool(() => { const m = new T.Mesh(BALL, RAWM); m.scale.set(1.15, 0.85, 1.15); m.castShadow = true; return m; });
  const spikeM = () => keep(new T.MeshStandardMaterial({ color: 0xb7e34a, roughness: 0.45, emissive: 0x253f06, transparent: true }));
  // (see-through, cleanly: each part of her, her tail and a Wretch has a twin that only writes depth, drawn just before them while they're
  // faded, so only their front surface blends: one clean ghost, not a stack of overlapping parts showing through each other (her tail looked
  // like a pile of see-through coins near the camera, review of Nov 15))
  const DEPTHM = keep(new T.MeshBasicMaterial({ colorWrite: false, transparent: true }));
  const twins = (g) => { const L = []; g.traverse((m) => { if (m.isMesh) L.push(m); }); return L.map((m) => { const d = new T.Mesh(m.geometry, DEPTHM); d.visible = false; m.add(d); return [m, d]; }); };
  // (the Wretch: about the 2D's 2.2 yards across its back; see-through when it stands between the camera and you)
  const wretch = pool(() => { const g = new T.Group(), m = keep(new T.MeshStandardMaterial({ color: 0x5b3e7a, roughness: 0.6, transparent: true })), sm = spikeM(), b = new T.Mesh(BALL, m), h = new T.Mesh(BALL, m); b.scale.set(1.8, 1.45, 2.1); b.position.y = 1.45; h.scale.setScalar(0.9); h.position.set(0, 2.2, 1.9);
    b.castShadow = h.castShadow = true; g.add(b, h); for (let i = 0; i < 4; i++) { const c = new T.Mesh(CONEG, sm); c.scale.setScalar(0.42); c.position.set(0, 2.85, 0.8 - i * 0.8); g.add(c); } g.userData.m = m; g.userData.mats = [m, sm]; g.userData.tw = twins(g); return g; });

  // ---- her: a serpent's neck and head out of the venom, a hood, three coils of her body breaking the surface behind her, glowing eyes ----
  const SCALEM = keep(new T.MeshStandardMaterial({ map: SCALET, bumpMap: SCALET, bumpScale: 0.3, vertexColors: true, roughness: 0.42, metalness: 0.18, emissive: 0x12061e, transparent: true }));
  const SPIKEM = spikeM(), FINM = keep(new T.MeshStandardMaterial({ map: FINT, side: T.DoubleSide, roughness: 0.55, emissive: 0x1a0830, transparent: true })), HORNM = keep(new T.MeshStandardMaterial({ color: 0x3a2b48, roughness: 0.5, transparent: true }));
  const FANGM = keep(new T.MeshStandardMaterial({ color: 0xece4c8, roughness: 0.3, transparent: true })), EYEM = keep(new T.MeshBasicMaterial({ color: 0xeaff4a, transparent: true })), PUPM = keep(new T.MeshBasicMaterial({ color: 0x0a0a04, transparent: true })), MOUTHM = keep(new T.MeshStandardMaterial({ color: 0x4a0812, emissive: 0x2a0308, roughness: 0.6, transparent: true }));
  const BOSSM = [SCALEM, SPIKEM, FINM, HORNM, FANGM, MOUTHM, EYEM, PUPM]; /* (all of her fades together: her eyes, fangs and mouth stayed solid inside a faint head, review of Nov 15) */
  // (her head about 19 yards up, so it clears the HUD's boss bar from the default camera; the neck ends inside her skull, no open ring under her jaw)
  const NECK = [[0, -12, -17], [0, -2, -13.5], [0, 6.5, -10.5], [0, 13, -7.2], [0, 17.4, -2.6], [0, 19.4, 4.8]], nr = (u) => 3.9 - 1.45 * u - 0.65 * u * u * u * u;
  const NECKG = tube(56, 18, (u, o) => { frame(NECK, u, o); return nr(u); }, 2, 3.2, (c, o) => shade(c, o));
  const SKULLG = (() => { const g = keep(new T.SphereGeometry(1, 30, 22)), p = g.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const fz = (z + 1) / 2; x *= 1.15 * (1 - 0.42 * fz * fz); y *= (y > 0 ? 0.62 : 0.5) * (1 - 0.3 * fz); z *= 1.9; p.setXYZ(i, x, y, z); }
    g.computeVertexNormals(); uvx(g, 2, 1.4); return paint(g, (x, y, z, nx, ny) => Math.max(-1, Math.min(1, ny * 1.6 + 0.25))); })();
  const JAWG = (() => { const g = keep(new T.SphereGeometry(1, 22, 14)), p = g.attributes.position; for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const fz = (z + 1) / 2; x *= 0.95 * (1 - 0.42 * fz * fz); y *= 0.3; z *= 1.72; p.setXYZ(i, x, y, z); }
    g.computeVertexNormals(); uvx(g, 1.8, 1.1); return paint(g, (x, y, z, nx, ny) => Math.max(-1, Math.min(1, ny * 1.2 - 0.55))); })();
  const HUMPG = (() => { const g = keep(new T.TorusGeometry(4.2, 2.05, 12, 24, Math.PI)); uvx(g, 2, 1); return paint(g, (x, y, z, nx, ny) => Math.max(-1, Math.min(1, ny * 1.5 + 0.2))); })();
  const FING = (() => { const s = new T.Shape(); s.moveTo(0, 0); s.bezierCurveTo(3.5, 1.2, 5.8, 4.5, 5.2, 9); s.bezierCurveTo(4.8, 11.5, 2.5, 12.6, 0.4, 12); s.lineTo(0, 11); s.closePath(); const g = keep(new T.ShapeGeometry(s, 10)); return uvx(g, 1 / 6, 1 / 12.6); })();
  const boss = new T.Group(), headG = new T.Group(), jawP = new T.Group(), humps = [], eyeGl = [], fo = { p: new T.Vector3(), t: new T.Vector3(), d: new T.Vector3(), s: new T.Vector3() };
  boss.rotation.order = 'YXZ';
  { const nk = new T.Mesh(NECKG, SCALEM); nk.castShadow = true; boss.add(nk);
    for (let i = 0; i < 11; i++) { const u = 0.17 + i * 0.075; frame(NECK, u, fo); const r = nr(u), c = new T.Mesh(CONEG, SPIKEM), k = 0.65 + 0.45 * Math.sin(i / 10 * Math.PI);
      c.position.copy(fo.p).addScaledVector(fo.d, r * 0.8); c.quaternion.setFromUnitVectors(UP, fo.d.clone().multiplyScalar(0.85).addScaledVector(fo.t, -0.5).normalize()); c.scale.set(0.8 * k, k, 0.8 * k); boss.add(c); }
    // (the hood: a membrane each side of her upper neck, swept back)
    frame(NECK, 0.62, fo); [1, -1].forEach((sd) => { const f = new T.Mesh(FING, FINM), X1 = fo.s.clone().multiplyScalar(sd), X2 = X1.clone().multiplyScalar(Math.cos(0.55)).addScaledVector(fo.d, Math.sin(0.55)).normalize(), Z1 = new T.Vector3().crossVectors(X2, fo.t);
      f.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(X2, fo.t, Z1)); f.position.copy(fo.p).addScaledVector(X1, nr(0.62) * 0.55).addScaledVector(fo.d, 0.4); f.scale.setScalar(0.8); boss.add(f); }); /* (0.8: her neck is shorter since her head came down) */
    headG.position.set(0, 19.4, 6.4); headG.scale.setScalar(3.4); boss.add(headG);
    const sk = new T.Mesh(SKULLG, SCALEM); sk.castShadow = true; headG.add(sk);
    jawP.position.set(0, -0.26, -1.05); headG.add(jawP); const jw = new T.Mesh(JAWG, SCALEM); jw.position.set(0, -0.08, 1.05); jw.castShadow = true; jawP.add(jw);
    const mo = new T.Mesh(BALL, MOUTHM); mo.scale.set(0.78, 0.15, 1.4); mo.position.set(0, -0.3, 0.38); headG.add(mo);
    [-0.36, 0.36].forEach((x) => { const f = new T.Mesh(CONEG, FANGM); f.scale.set(0.085, 0.16, 0.085); f.rotation.x = Math.PI; f.position.set(x, -0.42, 1.5); headG.add(f); });
    [[0.5, 0.42, -1.1, 0.25, 1], [-0.5, 0.42, -1.1, -0.25, 1], [0.86, 0.2, -0.85, 0.55, 0.72], [-0.86, 0.2, -0.85, -0.55, 0.72]].forEach(([x, y, z, rz, s]) => { const h = new T.Mesh(CONEG, HORNM); h.scale.set(0.2 * s, 0.55 * s, 0.2 * s); h.position.set(x, y, z); h.rotation.set(-1.12, 0, -rz); headG.add(h); });
    [-1, 1].forEach((sd) => { const br = new T.Mesh(BALL, HORNM); br.scale.set(0.3, 0.12, 0.6); br.position.set(sd * 0.55, 0.37, 0.52); br.rotation.z = sd * 0.3; headG.add(br);
      const e = new T.Mesh(BALL, EYEM); e.scale.setScalar(0.17); e.position.set(sd * 0.74, 0.24, 0.78); headG.add(e); const pu = new T.Mesh(BALL, PUPM); pu.scale.set(0.03, 0.14, 0.05); pu.position.set(sd * 0.895, 0.24, 0.82); headG.add(pu);
      const gl = new T.Sprite(glowM(0xd8f22f, 0.9)); gl.scale.setScalar(0.9); gl.position.set(sd * 0.8, 0.24, 0.85); gl.renderOrder = 700; headG.add(gl); eyeGl.push(gl); });
    // (her body: three coils breaking the surface behind her, smaller further out)
    [[-5.5, -27, 0.5, 1], [4.5, -38, -0.45, 0.85], [-2.5, -48.5, 0.3, 0.7]].forEach(([x, z, yaw, s], i) => { const h = new T.Mesh(HUMPG, SCALEM); h.castShadow = true; h.position.set(x, -2.6 * s, z); h.rotation.y = Math.PI / 2 + yaw; h.scale.setScalar(s);
      [-0.5, 0, 0.5].forEach((da) => { const a = Math.PI / 2 + da, c = new T.Mesh(CONEG, SPIKEM); c.position.set(Math.cos(a) * 6.1, Math.sin(a) * 6.1, 0); c.rotation.z = a - Math.PI / 2; c.scale.set(0.7, 0.8, 0.7); h.add(c); }); boss.add(h); humps.push({ m: h, x, z, s, y0: -2.6 * s, i }); }); }
  const BTW = twins(boss); let eyeO = 1; scene.add(boss);
  // ---- her tail (Gore Rattle): ridged segments rising from the venom just off the stone, its rattle at the tip; it lifts and slams for the Thrash ----
  const SEGG = keep(new T.LatheGeometry([[0, -0.5], [0.8, -0.5], [0.97, -0.36], [1, -0.12], [0.9, 0.22], [0.72, 0.5], [0, 0.5]].map(([x, y]) => new T.Vector2(x, y)), 14));
  const TAILSM = keep(new T.MeshStandardMaterial({ color: 0x6a4596, map: SCALET, roughness: 0.48, metalness: 0.15, emissive: 0x140826, transparent: true })), BONEM = keep(new T.MeshStandardMaterial({ color: 0xd2ae74, roughness: 0.45, emissive: 0xff7a2a, emissiveIntensity: 0.06, transparent: true })), TSPIKEM = spikeM();
  const TAILM = [TAILSM, BONEM, TSPIKEM];
  const chain = (parent, nT, nR, sc, tm, bm, spm) => { const C = { seg: [], spk: [], nT, pts: [], sc }; for (let i = 0; i < nT + nR; i++) { const m = new T.Mesh(SEGG, i < nT ? tm : bm); m.castShadow = sc > 0.7; parent.add(m); C.seg.push(m); C.pts.push([0, 0, 0]); }
    if (spm) for (let i = 2; i < nT - 1; i += 2) { const m = new T.Mesh(CONEG, spm); parent.add(m); C.spk.push({ m, i }); } return C; };
  const CT = new T.Vector3(), CD = new T.Vector3();
  const pose = (C, Pt, t, shake, r0, r1, rr) => { const n = C.seg.length, P = C.pts; for (let i = 0; i < n; i++) crPt(Pt, i / (n - 1), P[i]);
    for (let i = 0; i < n; i++) { const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], m = C.seg[i], tl = i < C.nT, r = (tl ? r0 + (r1 - r0) * i / Math.max(1, C.nT - 1) : rr * (1 - 0.08 * (i - C.nT))) * C.sc;
      CT.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const L = CT.length() / (i === 0 || i === n - 1 ? 1 : 2) || 0.5; CT.normalize();
      const j = tl ? 0 : Math.sin(t * 57 + i * 1.9) * 0.16 * shake * C.sc; m.position.set(P[i][0] + j, P[i][1], P[i][2]); m.quaternion.setFromUnitVectors(UP, CT); m.scale.set(r, L * (tl ? 1.45 : 1.05), r); }
    C.spk.forEach(({ m, i }) => { const a = P[i - 1], b = P[i + 1]; CT.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); CD.crossVectors(CT, XV).normalize(); const r = (r0 + (r1 - r0) * i / (C.nT - 1)) * C.sc;
      m.position.set(P[i][0] + CD.x * r * 0.75, P[i][1] + CD.y * r * 0.75, P[i][2] + CD.z * r * 0.75); CD.addScaledVector(CT, -0.45).normalize(); m.quaternion.setFromUnitVectors(UP, CD); m.scale.set(0.42 * r, 0.42 * r, 0.42 * r); }); };
  const mixP = (P0, P1, k, O) => { for (let i = 0; i < O.length; i++) for (let j = 0; j < 3; j++) O[i][j] = P0[i][j] + (P1[i][j] - P0[i][j]) * k; };
  const TREST = [[-8, -6, -11.5], [-6, 1.5, -9], [-2.6, 7, -6], [0.6, 10, -2.6], [1.6, 9.4, 0.8]], TLIFT = [[-8, -6, -11.5], [-7.5, 4, -10.5], [-6, 12, -9.5], [-2.5, 17.5, -8], [1.2, 19, -4.8]], TSLAM = [[-8, -6, -11.5], [-5.5, 2, -8], [-2.6, 3.2, -3], [0, 1.6, 2.5], [0.8, 0.9, 7]];
  const TP = TREST.map(() => [0, 0, 0]), tail = new T.Group(), TAIL = chain(tail, 18, 6, 1, TAILSM, BONEM, TSPIKEM), TTW = twins(tail); tail.scale.setScalar(1.35); scene.add(tail);
  const tailPose = (wig, slam, t) => { if (slam > 0) { const a = Math.min(1, slam / 0.16), b = slam < 0.55 ? 0 : (slam - 0.55) / 0.45; mixP(TLIFT, TSLAM, a * a, TP); if (b > 0) mixP(TP, TREST, b * b * (3 - 2 * b), TP); }
    else { mixP(TREST, TLIFT, wig * wig * (3 - 2 * wig), TP); for (let i = 1; i < 5; i++) { TP[i][0] += Math.sin(t * 1.3 + i * 0.8) * 0.5 * i / 4; TP[i][1] += Math.sin(t * 1.7 + i) * 0.25 * i / 4; } }
    BONEM.emissiveIntensity = 0.06 + 0.7 * wig * (1 - slam) * (0.75 + 0.25 * Math.sin(t * 20)); pose(TAIL, TP, t, 0.25 + 1.2 * wig * (1 - slam), 1.9, 0.85, 1.1); };
  // (her or her tail between the camera and you: see-through until you're clear; returns how see-through. While faded, her parts draw late (ro + 1)
  // right after their depth twins (ro), so whatever is behind her, effects too, shows through one clean ghost)
  const fade = (g, mats, rad, tw, ro) => { if (!g.visible || !camAt) return 1; const ax = cam.position.x, az = cam.position.z, dx = camAt[0] - ax, dz = -camAt[1] - az, L2 = dx * dx + dz * dz || 1, px = g.position.x, pz = g.position.z;
    const u = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L2)), o = Math.hypot(ax + dx * u - px, az + dz * u - pz) < rad || Math.hypot(ax - px, az - pz) < rad * 2 ? 0.25 : 1; /* (or right by the camera) */
    const see = o < 1; mats.forEach((m) => { m.opacity = o; m.depthWrite = !see; });
    if (tw && g.userData.see !== see) { g.userData.see = see; tw.forEach(([m, d]) => { d.visible = see; d.renderOrder = ro; m.renderOrder = see ? ro + 1 : 0; }); } return o; };
  // (the small tails: the same ridged tail, smaller, rising out of the venom and sinking back once they've fired)
  const STAILM = keep(new T.MeshStandardMaterial({ color: 0x6a4596, map: SCALET, roughness: 0.5, emissive: 0x140826 })), SBONEM = keep(new T.MeshStandardMaterial({ color: 0xd2ae74, roughness: 0.45 }));
  const STREST = [[0, -5, -3.5], [0, -0.5, -2.4], [0, 3.6, -1.2], [0, 6.2, 0.6], [0, 6.8, 2.8]], ST = STREST.map(() => [0, 0, 0]);
  const stail = pool(() => { const g = new T.Group(); g.userData.C = chain(g, 9, 3, 0.55, STAILM, SBONEM, null); return g; });
  // (the spectral image that beams the Wretch: her neck and head, see-through and glowing)
  const GHOSTM = keep(new T.MeshBasicMaterial({ color: 0x3af2a8, transparent: true, opacity: 0.32, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  const ghost = pool(() => { const g = new T.Group(), nk = new T.Mesh(NECKG, GHOSTM), hd = new T.Group(), sk = new T.Mesh(SKULLG, GHOSTM); hd.position.copy(headG.position); hd.scale.setScalar(3.4); hd.rotation.x = 0.2; hd.add(sk); g.add(nk, hd); g.scale.setScalar(0.45); return g; });
  // (the Venomous Heart: a beating heart over the venom, glowing, vessels hanging into the venom)
  const heart = new T.Group(), HEARTM = keep(new T.MeshStandardMaterial({ color: 0x7a0c28, emissive: 0xd01840, emissiveIntensity: 0.5, roughness: 0.3 })), VESM = keep(new T.MeshStandardMaterial({ color: 0x5a0f22, emissive: 0x3a0612, roughness: 0.5 }));
  const hcore = new T.Mesh(BALL, HEARTM), hhalo = new T.Sprite(glowM(0xff3a6a, 0.6)), hfl = new T.Mesh(UDISC, keep(new T.MeshBasicMaterial({ color: 0xff2a55, transparent: true, opacity: 0.3, depthWrite: false, blending: T.AdditiveBlending })));
  { hcore.castShadow = true; heart.add(hcore); [[0.5, 0.35], [-0.45, 0.3]].forEach(([x, y]) => { const l = new T.Mesh(BALL, HEARTM); l.scale.setScalar(0.62); l.position.set(x, y, 0.1); hcore.add(l); });
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, c = new T.CatmullRomCurve3([V([0, -0.6, 0]), V([Math.cos(a) * 1.2, -1.6, Math.sin(a) * 1.2]), V([Math.cos(a) * 2.6, -3, Math.sin(a) * 2.6]), V([Math.cos(a) * 3.4, -4.6, Math.sin(a) * 3.4])]); heart.add(new T.Mesh(keep(new T.TubeGeometry(c, 16, 0.16, 6)), VESM)); }
    hhalo.renderOrder = 700; heart.add(hhalo); hfl.renderOrder = 12; scene.add(heart, hfl); }
  const fizz = new T.Group(); { const m = keep(new T.MeshStandardMaterial({ color: 0x9fe4ff, transparent: true, opacity: 0.75, roughness: 0.2, emissive: 0x1a4a5a })); for (let i = 0; i < 16; i++) fizz.add(new T.Mesh(BALL, m)); } scene.add(fizz);
  // (the hint: a gold arrow at your feet pointing to where your job wants you, with a dark edge so it reads on the pale stone, and a light over the spot)
  const arrowShape = (x0, x1, x2, w, hw) => { const s = new T.Shape(); s.moveTo(x0, -w); s.lineTo(x1, -w); s.lineTo(x1, -hw); s.lineTo(x2, 0); s.lineTo(x1, hw); s.lineTo(x1, w); s.lineTo(x0, w); s.closePath(); return flatG(keep(new T.ShapeGeometry(s))); };
  const arrow = new T.Mesh(arrowShape(2.1, 3.55, 4.9, 0.2, 0.62), keep(new T.MeshBasicMaterial({ color: 0xf3c969, transparent: true, depthWrite: false, side: T.DoubleSide })));
  const arrowB = new T.Mesh(arrowShape(1.9, 3.45, 5.25, 0.36, 0.86), keep(new T.MeshBasicMaterial({ color: 0x1a1405, transparent: true, depthWrite: false, side: T.DoubleSide })));
  const beacon = new T.Mesh(WALLG, fxMat(3, '#f3c969', true)); arrow.renderOrder = 902; arrowB.renderOrder = 901; beacon.renderOrder = 650; scene.add(arrow, arrowB, beacon);
  // the raid: a capsule each in its class colour (role colour without a team plan)
  const CAPG = keep(new T.CapsuleGeometry(0.55, 1.2, 4, 12)), UNITS = new Map();
  const unitOf = (id) => { let u = UNITS.get(id); if (!u) { u = { m: new T.Mesh(CAPG, keep(new T.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05 }))), x: 0, y: 0, on: false }; u.m.castShadow = true; scene.add(u.m); UNITS.set(id, u); } return u; };
  // labels: a sprite each, the same size on screen at any distance
  const LBL = []; let nL = 0, W0 = 0, H0 = 0, pxK = 800;
  const lblMake = () => { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const tx = keep(new T.CanvasTexture(c)); tx.minFilter = T.LinearFilter; tx.generateMipmaps = false;
    const sp = new T.Sprite(keep(new T.SpriteMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false, fog: false }))); sp.renderOrder = 1000; scene.add(sp); return { sp, c, tx, key: '', tw: 0, px: 13, hide: false, free: false, q: null }; };
  const label = (s) => { let L = LBL[nL]; if (!L) L = LBL[nL] = lblMake();
    nL++; const key = s.text + '|' + s.c;
    if (L.key !== key) { L.key = key; const g = L.c.getContext('2d'); g.clearRect(0, 0, 512, 96); let f = 56; g.font = '700 ' + f + 'px system-ui, sans-serif'; const w = g.measureText(s.text).width; if (w > 492) { f = Math.floor(f * 492 / w); g.font = '700 ' + f + 'px system-ui, sans-serif'; }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(s.text, 256, 50); g.fillStyle = s.c; g.fillText(s.text, 256, 50); L.tx.needsUpdate = true; L.tw = Math.min(w, 492) + 10; }
    L.px = s.px; L.hide = s.how === 'name' || s.how === 'add'; L.free = s.how === 'add'; /* (pg3dHud and pg3dPick read these in names()) */
    L.sp.visible = true; L.sp.position.set(s.x, s.h + (low(s.x, s.y, 0) ? WATER : 0), -s.y); const k = s.px / 56 / pxK; L.sp.scale.set(512 * k, 96 * k, 1); };
  // nameplates (WoW style): a name and a thin bar over each raider, each its own pair of sprites drawn only when they change; a name is kept only
  // if it doesn't sit on a label, a HUD call-out or one nearer to you (you first, then your soak group's late ones and carriers, then the
  // nearest), four besides yours at most (pg3dPick)
  const PLATES = new Map(), PL = [], PLN = 12.5 / 26;
  const plSprite = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const tx = keep(new T.CanvasTexture(c)); tx.minFilter = T.LinearFilter; tx.generateMipmaps = false;
    const sp = new T.Sprite(keep(new T.SpriteMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false, fog: false }))); sp.renderOrder = 990; sp.visible = false; scene.add(sp); return { c, tx, sp }; };
  const plateOf = (id) => { let p = PLATES.get(id); if (!p) { p = { n: plSprite(256, 40), b: plSprite(64, 8), nk: '', bk: '', w: 0, on: false, s: null }; p.n.sp.center.set(0.5, -0.3); PLATES.set(id, p); } return p; };
  const plate = (s) => { const p = plateOf(s.id), nk = s.name + '|' + s.c;
    if (p.nk !== nk) { p.nk = nk; const g = p.n.c.getContext('2d'); g.clearRect(0, 0, 256, 40); g.font = '700 26px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.9)'; g.strokeText(s.name, 128, 21); g.fillStyle = s.c; g.fillText(s.name, 128, 21); p.w = Math.min(256, g.measureText(s.name).width + 12) * PLN; p.n.tx.needsUpdate = true; }
    const bk = s.bar + '|' + Math.round(s.hp * 40); if (p.bk !== bk) { p.bk = bk; const g = p.b.c.getContext('2d'), w = Math.round(62 * s.hp); g.clearRect(0, 0, 64, 8); g.fillStyle = 'rgba(0,0,0,.85)'; g.fillRect(0, 0, 64, 8); g.fillStyle = s.bar; g.fillRect(1, 1, w, 6); g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(1, 1, w, 2); p.b.tx.needsUpdate = true; }
    const y = baseY(s.x, s.y) + 2.75; p.n.sp.position.set(s.x, y, -s.y); p.b.sp.position.set(s.x, y, -s.y); const kn = PLN / pxK; p.n.sp.scale.set(256 * kn, 40 * kn, 1); p.b.sp.scale.set((s.you ? 56 : 44) / pxK, (s.you ? 6 : 5) / pxK, 1);
    p.n.sp.material.opacity = s.o; p.b.sp.material.opacity = s.o * 0.9; p.b.sp.visible = true; p.n.sp.visible = false; p.on = true; p.s = s; PL.push(p); };
  // (the HUD's call-outs in the middle of the screen, practice.js's .pg-warn and .pg-float: where their words are while they show. Their box is
  // read again only when their words or the window's size change)
  const HUD = ['.pg-warn', '.pg-float'].map((c) => host.parentNode && host.parentNode.querySelector(c)).filter(Boolean).map((el) => ({ el, cs: getComputedStyle(el), key: '', l: 0, t: 0, r: 0, b: 0, fix: true, pri: -1, on: true }));
  // (the minimap and the "2D | 3D" switch under it: the labels and names keep out of that corner too. Main, Nov 15: at 0:42 a name sat over the switch)
  const CRN = ['.pg-mini', '.pg-vw'].map((c) => host.parentNode && host.parentNode.querySelector(c)).filter(Boolean).map((el) => ({ el, key: '', l: 0, t: 0, r: 0, b: 0, fix: true, pri: -1, on: true }));
  const RNG = document.createRange(), BX = [], LQ = [], PQ = [];
  const bands = () => { BX.length = 0; let hr = null;
    for (let i = 0; i < HUD.length; i++) { const B = HUD[i], txt = B.el.textContent; if (!txt || !(parseFloat(B.cs.opacity) > 0.04)) continue; const key = txt + '|' + W0 + '|' + H0;
      if (B.key !== key) { B.key = key; hr = hr || host.getBoundingClientRect(); RNG.selectNodeContents(B.el); const r = RNG.getBoundingClientRect(); B.l = r.left - hr.left - 6; B.t = r.top - hr.top - 3; B.r = r.right - hr.left + 6; B.b = r.bottom - hr.top + 3; }
      BX.push(B); }
    for (let i = 0; i < CRN.length; i++) { const B = CRN[i]; if (!B.el.offsetWidth) continue; const key = W0 + '|' + H0;
      if (B.key !== key) { B.key = key; hr = hr || host.getBoundingClientRect(); const r = B.el.getBoundingClientRect(); B.l = r.left - hr.left - 6; B.t = r.top - hr.top - 4; B.r = r.right - hr.left + 6; B.b = r.bottom - hr.top + 4; }
      BX.push(B); } };
  const names = () => { bands();
    // (the labels: each one's box on the screen; a HUD call-out or an earlier label pushes it down below, or hides it if it only names a creature)
    LQ.length = 0; for (let i = 0; i < nL; i++) { const L = LBL[i]; V4.copy(L.sp.position).project(cam); if (V4.z > 1 || Math.abs(V4.x) > 1.3 || Math.abs(V4.y) > 1.3) continue;
      const q = L.q || (L.q = { L, i: 0, x: 0, y: 0, y0: 0, z: 0, w: 0, h: 0, hide: false, off: false, l: 0, t: 0, r: 0, b: 0, fix: true, free: false, pri: 0, on: true });
      q.i = i; q.x = (V4.x + 1) / 2 * W0; q.y = q.y0 = (1 - V4.y) / 2 * H0; q.z = V4.z; q.w = L.tw * L.px / 56; q.h = L.px * 1.2; q.hide = L.hide; q.free = L.free;
      if (q.hide && (q.x - q.w / 2 < 0 || q.x + q.w / 2 > W0)) { L.sp.visible = false; continue; } /* (a creature's name cut by the screen's edge) */ LQ.push(q); }
    LQ.sort((a, b) => (a.hide - b.hide) || (a.i - b.i)); pg3dHud(LQ, BX);
    PQ.length = 0; for (let i = 0; i < BX.length; i++) PQ.push(BX[i]);
    for (let i = 0; i < LQ.length; i++) { const q = LQ[i]; if (q.off) { q.L.sp.visible = false; continue; }
      if (q.y !== q.y0) { V4.set(q.x / W0 * 2 - 1, 1 - q.y / H0 * 2, q.z).unproject(cam); q.L.sp.position.copy(V4); }
      q.l = q.x - q.w / 2; q.r = q.x + q.w / 2; q.t = q.y - q.h / 2; q.b = q.y + q.h / 2; q.fix = !q.free; q.pri = 50 + q.i; PQ.push(q); }
    // (the names: you, the labels and the call-outs stay; then the late soak mates and carriers, then the nearest, where they sit on nothing)
    for (let k = 0; k < PL.length; k++) { const p = PL[k], s = p.s; if (!s.show) continue; V4.copy(p.n.sp.position).project(cam); if (V4.z > 1 || Math.abs(V4.x) > 1.2 || Math.abs(V4.y) > 1.2) continue;
      const q = p.q || (p.q = { p, l: 0, t: 0, r: 0, b: 0, fix: false, free: false, pri: 0, on: false }), x = (V4.x + 1) / 2 * W0, y = (1 - V4.y) / 2 * H0, hw = p.w / 2 + 2;
      q.l = x - hw; q.r = x + hw; q.t = y - 25; q.b = y - 5; q.fix = !!s.you; q.pri = (s.why === 'near' ? 2 : 1) + s.d / 1000; PQ.push(q); }
    pg3dPick(PQ, 4); for (let i = 0; i < PQ.length; i++) { const q = PQ[i]; if (q.p) q.p.n.sp.visible = q.on; else if (q.L && !q.on) q.L.sp.visible = false; } };

  // ---- one shape on the screen ----
  const V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3(), V4 = new T.Vector3(), faceIn = (x, y) => Math.atan2(-x, y); /* (turned to face the middle of the stone) */
  // (a later part's own pieces: its room and creatures (src/practice-p2.js pg3dP2), drawn from this kit)
  const P2K = A.P2 && A.P2.part === 3 ? (typeof pg3dP3 === 'function' ? pg3dP3({ T, scene, keep, pool, flat, flatG, fxMat, glw, col, ucol, baseY, sun, BALL, CONEG, BEAMG, WALLG, UDISC, URING, plat }) : null) /* (phase 3's broken quarters: src/practice-p3.js) */
    : A.P2 && typeof pg3dP2 === 'function' ? pg3dP2({ T, scene, keep, pool, flat, flatG, fxMat, glw, col, ucol, baseY, slab, sun, BALL, CONEG, BEAMG, WALLG, UDISC, URING }) : null;
  const put = (s, t) => { const k = s.k; if (P2K && P2K.put(s, t)) return;
    if (k === 'disc' || k === 'grow') { if (s.r > 0.05) flat(k === 'disc' ? UDISC : URING, s.x, s.y, s.r, s.r, 0, s.c, s.o, low(s.x, s.y, s.r)); return; }
    if (k === 'ring') { flat(ringG(s.r, s.w, s.dash), s.x, s.y, 1, 1, s.dash ? t * 0.3 : 0, s.c, s.o, low(s.x, s.y, s.r)); return; }
    if (k === 'arc') { flat(arcG(s.r, s.f), s.x, s.y, 1, 1, 0, s.c, s.o, low(s.x, s.y, s.r)); return; }
    if (k === 'rect' || k === 'wave') { const u = Math.cos(s.a), v = Math.sin(s.a), m1 = (s.f0 + s.f1) / 2, m2 = (s.w0 + s.w1) / 2, x = s.x + u * m1 - v * m2, y = s.y + v * m1 + u * m2, Dd = s.f1 - s.f0, Wd = s.w1 - s.w0;
      if (k === 'rect') { flat(URECT, x, y, Dd, Wd, s.a, s.c, s.o, false); return; }
      const q = Math.min(1, s.o / 0.92), m = wave(), sm = m.userData.sm.uniforms; m.geometry = waveG(Dd, Wd); m.position.set(x, 0.03, -y); m.rotation.set(0, s.a, 0); m.scale.set(1, 0.25 + 0.75 * q, 1); m.material.uniforms.uO.value = 0.9 * q; m.renderOrder = 600;
      sm.uD.value = Dd; sm.uW.value = Wd; sm.uO.value = q;
      const e = edge(); e.position.set(x, 0.04, -y); e.rotation.set(0, s.a, 0); e.scale.set(Dd, 1, Wd); e.material.uniforms.uS.value.set(Dd, Wd); e.material.uniforms.uO.value = 0.95 * q; return; } /* (its red border: exactly where it hits) */
    if (k === 'dome' || k === 'wall') { const m = k === 'dome' ? dome() : wall(), U = m.material.uniforms; m.position.set(s.x, low(s.x, s.y, s.r) ? WATER + 0.25 : 0.03, -s.y); if (k === 'dome') m.scale.setScalar(s.r); else m.scale.set(s.r, s.h, s.r);
      ucol(U.uC, s.c); U.uO.value = s.o * (k === 'dome' ? 0.65 : 1.6); U.uF.value = s.f || 0; m.renderOrder = k === 'dome' ? 620 : 610; return; }
    if (k === 'coil') { const g = coil(), u = g.userData, sl = s.slam, rise = 0.12 + 0.88 * (1 - Math.pow(1 - s.f, 3)), dn = sl > 0 ? Math.max(0, 1 - sl / 0.3) : 1, R0 = s.r * 0.78;
      g.position.set(s.x, 0.04, -s.y); u.hx.visible = dn > 0.02; u.hx.scale.set(R0, R0 * 1.05 * rise * dn + 0.01, R0); u.hx.rotation.y = t * 1.4 + s.x; u.hm.uniforms.uO.value = (0.22 + 0.33 * s.f) * Math.min(1, dn * 1.5);
      u.fl.visible = u.fc.visible = sl > 0; if (sl > 0) { const q = 1 - sl; u.fl.scale.set(s.r, 1, s.r); u.flm.opacity = 0.8 * q * q; u.fc.scale.set(s.r * 0.95, 16 * (0.4 + 0.6 * q), s.r * 0.95); u.fcm.uniforms.uO.value = 0.75 * q; } return; }
    if (k === 'beam') { const d = Math.hypot(s.x0, s.y0) || 1, sx = s.x0 * (1 - 2.9 / d), sy = s.y0 * (1 - 2.9 / d); V1.set(sx, 7.6, -sy); V2.set(s.x1, baseY(s.x1, s.y1) + 1.3, -s.y1); V3.subVectors(V2, V1); const len = V3.length(), g = beam(); g.position.copy(V1); g.quaternion.setFromUnitVectors(UP, V3.normalize()); g.scale.set(1, len, 1);
      g.userData.im.uniforms.uLen.value = len * 1.4; g.userData.sm.uniforms.uO.value = 1; const pu = 0.75 + 0.25 * Math.sin(t * 13); glw(V2.x, V2.y, V2.z, 4.2 * pu, '#7affd0', 0.9); glw(V1.x, V1.y, V1.z, 5, '#3af2a8', 0.8); return; }
    if (k === 'unit') { const u = unitOf(s.id); col(u.m.material, s.c); u.m.material.emissive.setHex(s.you ? 0x2a2008 : 0); const mv = Math.hypot(s.x - u.x, s.y - u.y) > 0.005; u.x = s.x; u.y = s.y; u.m.position.set(s.x, baseY(s.x, s.y) + 1.15 + (mv ? Math.abs(Math.sin(t * 16)) * 0.14 : 0), -s.y); u.m.visible = true; u.on = true; return; }
    if (k === 'plate') { plate(s); return; }
    if (k === 'egg') { const m = egg(), z = s.held ? 0.72 : 1; m.scale.set(0.9 * z, 1.17 * z, 0.9 * z); m.position.set(s.x, baseY(s.x, s.y) + s.h + (s.held ? Math.sin(t * 4) * 0.15 : 0), -s.y); m.rotation.set(s.fall ? t * 3 : 0, 0, 0); if (s.fall) blobAt(s.x, s.y, s.h - 1.2, 2.2); return; }
    if (k === 'rock') { const m = s.womb ? womb() : rock(), h = s.land > 0 ? 0 : 44 * (1 - s.f * s.f), by = baseY(s.x, s.y), sp = 1 - s.land;
      m.position.set(s.x, by + (s.womb ? 2.4 : 1.1) * (1 - 0.45 * s.land) + h, -s.y); m.rotation.set(s.sd + t * 2.3 * sp, s.sd * 1.7 + t * 1.6 * sp, 0); if (s.womb) m.scale.set(2.5, 2.9 * (1 - 0.4 * s.land), 2.5); else m.scale.setScalar(1.6 * (1 - 0.3 * s.land));
      const near = cam.position.distanceTo(m.position) < 11; if (near) m.visible = false; /* (one falling right past the camera would fill the screen) */
      blobAt(s.x, s.y, h, s.womb ? 5 : 3.2); if (h > 2 && !near) glw(s.x, by + h + 0.6, -s.y, s.womb ? 4 : 3.2, s.womb ? '#b8ff6a' : '#ff9a3c', 0.85, 2.6, 0.15);
      if (s.land > 0) flat(URING, s.x, s.y, 2 + 6 * s.land, 2 + 6 * s.land, 0, s.womb ? '#d8f22f' : '#e8c89a', 0.8 * (1 - s.land), low(s.x, s.y, 1)); return; }
    if (k === 'add') { const g = s.kind === 'viper' ? viper() : rawl(); g.position.set(s.x, baseY(s.x, s.y) + (s.kind === 'viper' ? 0 : 0.8), -s.y); if (s.kind === 'viper') g.rotation.y = t * 1.6 + s.x; return; }
    if (k === 'wretch') { const g = wretch(), ud = g.userData; if (ud.x != null && Math.hypot(s.x - ud.x, s.y - ud.y) > 0.02) g.rotation.y = Math.atan2(s.x - ud.x, -(s.y - ud.y)); ud.x = s.x; ud.y = s.y;
      g.position.set(s.x, baseY(s.x, s.y), -s.y); g.scale.set(1, s.awake ? 1 : 0.6, 1); col(ud.m, s.awake ? '#9b5cff' : '#5b3e7a'); return; }
    if (k === 'boss') { const rear = s.rear || 0, bite = s.bite >= 0 ? Math.sin(s.bite * Math.PI) : 0, fy = faceIn(s.x, s.y), sy = Math.sin(fy), cy = Math.cos(fy), bx = s.x, bz = -s.y;
      boss.visible = true; boss.position.set(bx, -36 * s.sink, bz); boss.rotation.set(-0.16 * rear * rear + 0.42 * bite + 0.025 * Math.sin(t * 1.3) + 0.25 * s.sink, fy + Math.sin(t * 0.9) * 0.05, 0); /* (0.42: the same reach as before her head came down) */
      headG.rotation.set(0.2 - 0.18 * rear + 0.12 * bite, Math.sin(t * 1.7) * 0.1, Math.sin(t * 1.1) * 0.05); jawP.rotation.x = 0.05 + 0.5 * bite + 0.28 * rear;
      eyeO = 0.75 + 0.25 * Math.sin(t * 4); /* (the eyes' glow: set after fade() in draw1, times how see-through she is) */
      humps.forEach((h) => { h.m.position.y = h.y0 + Math.sin(t * 1.1 + h.i * 1.7) * 0.45 * h.s; });
      if (s.sink < 0.85) { const fo1 = 0.6 * (1 - s.sink), ws = (lx, lz, sz, i) => foamAt(bx + lx * cy + lz * sy, bz - lx * sy + lz * cy, sz * (1 + 0.06 * Math.sin(t * 2.3 + i)), fo1, t * 0.2 + i);
        ws(0, -13.2, 13, 0); humps.forEach((h) => { const a = Math.PI / 2 + [0.5, -0.45, 0.3][h.i], ex = Math.cos(a) * 3.6 * h.s, ez = -Math.sin(a) * 3.6 * h.s; ws(h.x + ex, h.z + ez, 7 * h.s, h.i * 2 + 1); ws(h.x - ex, h.z - ez, 7 * h.s, h.i * 2 + 2); }); }
      return; }
    if (k === 'tail') { tail.visible = true; tail.position.set(s.x, 0, -s.y); tail.rotation.set(0, faceIn(s.x, s.y), 0); tailPose(s.wig, s.slam, t); const fy = faceIn(s.x, s.y), lx = -8.4 * 1.35, lz = -10.2 * 1.35; foamAt(s.x + lx * Math.cos(fy) + lz * Math.sin(fy), -s.y - lx * Math.sin(fy) + lz * Math.cos(fy), 10, 0.55, t * 0.25); return; }
    if (k === 'stail') { const g = stail(), C = g.userData.C, rise = 1 - Math.pow(1 - s.f, 3), dn = -9 * (1 - rise) - 10 * (s.sink || 0); g.position.set(s.x, WATER, -s.y); g.rotation.y = faceIn(s.x, s.y);
      for (let i = 0; i < 5; i++) { ST[i][0] = STREST[i][0] + Math.sin(t * 3.1 + i) * 0.35 * i / 4; ST[i][1] = STREST[i][1] + dn; ST[i][2] = STREST[i][2]; } pose(C, ST, t, 1, 1.5, 0.8, 1.0); if (s.sink < 0.9) foamAt(s.x, -s.y, 4.5, 0.5 * rise * (1 - (s.sink || 0)), t * 0.4); return; }
    if (k === 'splash') { if (s.p < 0 || s.p > 1) return; const g = splash(), u = g.userData, oy = onP(s.x, s.y) ? 0.04 : WATER + 0.02; g.position.set(s.x, oy, -s.y); u.pm.uniforms.uP.value = s.p; u.pm.uniforms.uS.value = s.s;
      u.f.scale.set((2 + 9 * Math.sqrt(s.p)) * s.s * 2, 1, (2 + 9 * Math.sqrt(s.p)) * s.s * 2); u.fm.opacity = 0.8 * (1 - s.p); const hh = Math.sin(Math.min(1, s.p * 1.5) * Math.PI) * 5 * s.s; u.c.visible = hh > 0.1; u.c.scale.set(2.4 * s.s * (1 + s.p), hh + 0.01, 2.4 * s.s * (1 + s.p)); u.cm.uniforms.uO.value = 0.4 * (1 - s.p); return; }
    if (k === 'ghost') { const g = ghost(); g.position.set(s.x, 0, -s.y); g.rotation.y = faceIn(s.x, s.y); return; }
    if (k === 'heart') { const ph = (t * 1.2) % 1, b = Math.exp(-Math.pow(ph / 0.07, 2)) + 0.6 * Math.exp(-Math.pow((ph - 0.24) / 0.07, 2)); heart.visible = hfl.visible = true; heart.position.set(s.x, 3.2, -s.y); hcore.scale.setScalar(2.1 * (1 + 0.1 * b)); HEARTM.emissiveIntensity = 0.3 + 1.05 * b;
      hhalo.scale.setScalar(10 + 3 * b); hhalo.material.opacity = 0.35 + 0.5 * b; hfl.position.set(s.x, WATER + 0.12, -s.y); hfl.scale.set(6 + 2 * b, 1, 6 + 2 * b); hfl.material.opacity = 0.18 + 0.25 * b; return; }
    if (k === 'fizz') { fizz.visible = true; fizz.position.set(s.x, 0, -s.y); fizz.children.forEach((b, i) => { const a = i * 2.4, rr = 0.8 + (i * 1.7) % 3.8, ph = (t * 1.1 + i * 0.37) % 1; b.position.set(Math.cos(a) * rr, WATER + ph * 1.6, Math.sin(a) * rr); b.scale.setScalar((0.2 + (i % 3) * 0.12) * (1 - ph * 0.5)); }); foamAt(s.x, -s.y, 9 + Math.sin(t * 3) * 0.6, 0.5, t * 0.6); return; }
    if (k === 'arrow') { const y0 = baseY(s.x, s.y) + (onP(s.x, s.y) ? 0.06 : 0.75), pu = 0.72 + 0.28 * Math.sin(t * 6.5); arrow.visible = arrowB.visible = true; arrow.position.set(s.x, y0 + 0.01, -s.y); arrowB.position.set(s.x, y0, -s.y); arrow.rotation.y = arrowB.rotation.y = s.a; arrow.material.opacity = pu; arrowB.material.opacity = 0.5 * pu; return; }
    if (k === 'beacon') { beacon.visible = true; beacon.position.set(s.x, baseY(s.x, s.y) + 0.05, -s.y); beacon.scale.set(0.5, 9, 0.5); beacon.material.uniforms.uO.value = 0.55 + 0.2 * Math.sin(t * 5); return; }
    if (k === 'label') label(s); };

  // ---- the camera: behind you and gliding after you; yaw is the way it looks (the game's angle: 0 east, a quarter turn north) ----
  let yaw = Math.PI / 2, pitch = 0.45, dist = 36, camAt = null, dead = false, lastT = 0, lastDraw = 0, prevNow = 0, pend = 0, drag = null, flashSeen = 0;
  { const G = A.G, B = G && A.bossAt ? A.bossAt(G.t) : null; if (B) yaw = Math.atan2(B.p[1] - G.y, B.p[0] - G.x); } /* (first facing her) */
  const place = () => { if (!camAt) return; const fx = Math.cos(yaw), fy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), th = camAt[2] + 2.2;
    cam.position.set(camAt[0] - fx * cp * dist, th + sp * dist, -(camAt[1] - fy * cp * dist)); cam.lookAt(camAt[0] + fx * 4, th + dist * 0.085, -(camAt[1] + fy * 4)); }; /* (looking a little over you: you sit a bit below the middle and she stays in the picture) */
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h || (w === W0 && h === H0)) return; W0 = w; H0 = h; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); pxK = (h / 2) / Math.tan(cam.fov * Math.PI / 360); UPX.value = pxK * R.getPixelRatio(); };
  const RAY = new T.Raycaster(), NDC = new T.Vector2(), GROUND = new T.Plane(new T.Vector3(0, 1, 0), 0), HIT = new T.Vector3();
  const pick = (X, Y) => { const r = cv.getBoundingClientRect(); if (!r.width || !r.height || !camAt) return null; NDC.set((X - r.left) / r.width * 2 - 1, 1 - (Y - r.top) / r.height * 2); cam.updateMatrixWorld(); RAY.setFromCamera(NDC, cam);
    const p = RAY.ray.intersectPlane(GROUND, HIT); if (!p || Math.hypot(p.x, p.z) > (A.P2 ? 200 : 140)) return null; /* (phase 2's ledges reach about 180 yards out) */ return [p.x, -p.z]; };
  // (the damage numbers float up by you, and the red flash when you're hurt, over the picture as in 2D)
  const FX = new Map(), V5 = new T.Vector3();
  const fx = (t) => { const G = A.G; G.fx = G.fx.filter((f) => t - f.t0 < 1.2); const live = new Set();
    for (const f of G.fx) { if (/^−?0$/.test(f.text)) continue; let el = FX.get(f); if (!el) { el = document.createElement('div'); el.textContent = f.text; el.style.cssText = 'position:absolute;left:0;top:0;font:800 18px system-ui,sans-serif;color:' + f.c + ';text-shadow:0 0 3px #000,0 1px 2px #000;white-space:nowrap'; fxL.appendChild(el); FX.set(f, el); }
      live.add(f); const e1 = t - f.t0; V5.set(f.x, baseY(f.x, f.y) + 3.4 + e1 * 1.6, -f.y).project(cam); if (V5.z > 1) { el.style.display = 'none'; continue; }
      el.style.display = ''; el.style.opacity = String(Math.max(0, 1 - e1 / 1.2)); el.style.transform = 'translate(' + ((V5.x + 1) / 2 * W0).toFixed(1) + 'px,' + ((1 - V5.y) / 2 * H0).toFixed(1) + 'px) translate(-50%,-50%)'; }
    for (const [f, el] of FX) if (!live.has(f)) { el.remove(); FX.delete(f); } };
  const draw1 = (t) => { lastT = t; const now = performance.now(), dt = prevNow ? Math.min(0.1, (now - prevNow) / 1000) : 0.016; prevNow = now; lastDraw = now; resize(); const G = A.G; if (!G) return;
    UT.value = t; nF = 0; nL = 0; PL.length = 0; pools.forEach((p) => { p.n = 0; }); boss.visible = tail.visible = heart.visible = hfl.visible = fizz.visible = arrow.visible = arrowB.visible = beacon.visible = false; UNITS.forEach((u) => { u.on = false; }); PLATES.forEach((p) => { p.on = false; });
    const L = pg3dShapes(A, t); for (let i = 0; i < L.length; i++) put(L[i], t); if (P2K) P2K.frame(G);
    for (let i = nF; i < FLAT.length; i++) FLAT[i].visible = false; for (let i = nL; i < LBL.length; i++) LBL[i].sp.visible = false; pools.forEach((p) => { for (let i = p.n; i < p.L.length; i++) p.L[i].visible = false; }); UNITS.forEach((u) => { u.m.visible = u.on; }); PLATES.forEach((p) => { if (!p.on) p.n.sp.visible = p.b.sp.visible = false; });
    const px = G.x, py = G.y, ph = baseY(px, py); if (!camAt || Math.hypot(camAt[0] - px, camAt[1] - py) > 25) camAt = [px, py, ph]; else { const q = 1 - Math.exp(-dt * 9); camAt[0] += (px - camAt[0]) * q; camAt[1] += (py - camAt[1]) * q; camAt[2] += (ph - camAt[2]) * q; }
    place(); cam.updateMatrixWorld(); names(); const bo = fade(boss, BOSSM, 12, BTW, 690); for (let i = 0; i < eyeGl.length; i++) eyeGl[i].material.opacity = eyeO * bo;
    fade(tail, TAILM, 6, TTW, 692); wretch.L.forEach((g) => fade(g, g.userData.mats, 2.4, g.userData.tw, 694)); fx(t);
    if (A.flashT && A.flashT !== flashSeen) { flashSeen = A.flashT; const left = 400 - (performance.now() - flashSeen); if (left > 0 && flL.animate) flL.animate([{ opacity: left / 400 }, { opacity: 0 }], { duration: left, easing: 'linear' }); } /* (the red hurt flash fades on its own, paused or not) */
    R.render(scene, cam); };
  const draw = (t) => { if (dead) return; try { draw1(t); } catch (e) { if (A.fail) A.fail(e); else throw e; } };
  // ---- the mouse: drag (either button) turns the camera, the wheel zooms, a click on the floor walks there ----
  const kick = () => { if (pend || dead) return; pend = requestAnimationFrame(() => { pend = 0; if (performance.now() - lastDraw > 30) draw(lastT); }); }; /* (a redraw while the fight is paused) */
  const down = (e) => { if (e.button !== 0 && e.button !== 2) return; drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, b: e.button }; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* (an old browser) */ } e.preventDefault(); };
  const move = (e) => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 5) return;
    drag.moved = true; cv.style.cursor = 'grabbing'; yaw -= dx * 0.0065; pitch = Math.max(0.1, Math.min(1.35, pitch + dy * 0.0045)); kick(); };
  const up = (e) => { if (!drag) return; const d = drag; drag = null; cv.style.cursor = 'crosshair'; try { cv.releasePointerCapture(e.pointerId); } catch (er) { /* (an old browser) */ }
    if (!d.moved && d.b === 0 && e.type === 'pointerup') { const p = pick(e.clientX, e.clientY); if (p && A.walk) A.walk(p); kick(); } };
  const wheel = (e) => { e.preventDefault(); dist = Math.max(8, Math.min(85, dist * (e.deltaY > 0 ? 1.1 : 1 / 1.1))); kick(); };
  const noMenu = (e) => { e.preventDefault(); };
  cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('wheel', wheel, { passive: false }); cv.addEventListener('contextmenu', noMenu); window.addEventListener('resize', kick);
  const dispose = () => { if (dead) return; dead = true; if (pend) cancelAnimationFrame(pend); window.removeEventListener('resize', kick);
    cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); cv.removeEventListener('wheel', wheel); cv.removeEventListener('contextmenu', noMenu);
    own.forEach((o) => { try { o.dispose(); } catch (e) { /* (already gone) */ } }); own.length = 0; RINGS.clear(); ARCS.clear(); WAVES.clear(); FX.clear(); UNITS.clear(); PLATES.clear(); scene.clear();
    try { R.dispose(); R.forceContextLoss(); } catch (e) { /* (no context left) */ } host.textContent = ''; };
  resize();
  return { draw, resize, pick, dispose, fwd: () => [Math.cos(yaw), Math.sin(yaw)], info: () => ({ calls: R.info.render.calls, tris: R.info.render.triangles, geometries: R.info.memory.geometries, textures: R.info.memory.textures, programs: R.info.programs ? R.info.programs.length : 0 }),
    get yaw() { return yaw; }, set yaw(v) { yaw = +v || 0; kick(); }, get pitch() { return pitch; }, set pitch(v) { pitch = Math.max(0.1, Math.min(1.35, +v || 0.5)); kick(); }, get dist() { return dist; }, set dist(v) { dist = Math.max(8, Math.min(85, +v || 34)); kick(); } };
}
