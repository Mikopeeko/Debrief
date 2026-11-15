// ===== Practice in 3D (Nov 15; Flex picked 3D for the practice game, "theres nothing else like this out there", after the mock in
// notes/Practice game - 3D mock.html) =====
// The same fight as the 2D map, drawn in three.js. practice.js keeps the clock, the moves, the hits, the mistakes and the score; this file only
// draws it and runs a WoW-style camera: behind you and gliding after you, drag the mouse to turn it, the wheel zooms, W walks where it looks,
// a click on the floor walks there. Read into ui.js's scope right after practice.js (build.ps1, /*PRACTICE*/); practice.js holds the
// "2D | 3D" switch by the minimap. three.js comes from jsdelivr, one exact version, only once 3D is picked: if it can't load (or the PC has no
// WebGL), the switch goes back to 2D and says so. Every floor shape is the hit code's own (the same centres, radii and time windows as
// practice.js's draw(), check() and inWave()): pg3dShapes lists them, pg3d draws the list, tests/practice-3d.js checks the list against inWave.
// Yards as in practice.js (x east, y north, the stone's middle at 0,0) map to three.js as X = x, Z = -y, Y up.
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
// A: practice.js's window on the game (G, S, me, nm, rl, clsC, bossAt, tailAt, spot, target). Floor shapes: disc, ring (fixed size), grow (a
// ring that grows or shrinks), arc, rect (a strip: f0..f1 along angle a, w0..w1 across it, from x,y); wave (a wave wall over its rect: exactly
// inWave's area); dome, wall; then units, eggs, adds, the Wretches, her, her tail, the small tails, the spectral image, the heart, labels.
function pg3dShapes(A, t) {
  const G = A.G, S = A.S, me = A.me, out = [], P = (o) => { out.push(o); };
  if (!G || !S) return out;
  const disc = (x, y, r, c, o) => P({ k: 'disc', x, y, r, c, o }), grow = (x, y, r, c, o) => P({ k: 'grow', x, y, r, c, o });
  const ring = (x, y, r, c, o, w, dash) => P({ k: 'ring', x, y, r, c, o, w: w || 0.3, dash: !!dash });
  const label = (x, y, h, text, c, px) => P({ k: 'label', x, y, h, text, c, px: px || 13 });
  // the floor: her tail's sweep (th.r, 35), her reach (5), the coil soaks (s.r, 10; yours gold), the bubble (10 round the Wretch), impacts (m.r), landing eggs (4)
  S.thrash.forEach((th) => { if (t >= th.t0 && t <= th.at + 0.4) { const f = Math.min(1, (t - th.t0) / (th.at - th.t0)); disc(th.x, th.y, th.r, '#ff8c3c', 0.1 + 0.16 * f); ring(th.x, th.y, th.r, '#ff9b4a', 0.9, 0.5, true); if (t > th.at) disc(th.x, th.y, th.r, '#ff7828', 0.35); } });
  S.wrath.forEach((wr) => { if (t >= wr.t0 && t <= wr.at + 3.2) { disc(wr.p[0], wr.p[1], 5, '#ff3c3c', 0.22); ring(wr.p[0], wr.p[1], 5, '#ff4a4a', 1, 0.3); } });
  S.soaks.forEach((s) => { if (t >= s.t0 && t <= s.at + 0.5) { const mine = s.group.includes(me), f = Math.min(1, (t - s.t0) / (s.at - s.t0)), c = mine ? '#f3c969' : '#24f2cb';
    disc(s.x, s.y, s.r, '#24f2cb', t > s.at ? 0.4 : 0.08); ring(s.x, s.y, s.r, c, 1, mine ? 0.45 : 0.3, mine); grow(s.x, s.y, s.r * f, '#24f2cb', 0.7);
    P({ k: 'wall', x: s.x, y: s.y, r: s.r, h: 1.5 + 4 * f, c, o: 0.06 + 0.1 * f }); label(s.x, s.y, 7.5, mine ? 'YOUR SOAK' : 'Soak ' + (s.k + 1), c, 15); } });
  S.bubbles.forEach((q) => { const c = G.wr[q.w]; if (c && t >= q.t0 && t <= q.at + 0.4) { const f = Math.min(1, (t - q.t0) / (q.at - q.t0));
    P({ k: 'dome', x: c.x, y: c.y, r: 10, c: '#d8f22f', o: 0.14 + 0.16 * f }); ring(c.x, c.y, 10, '#d8f22f', 1, 0.4); grow(c.x, c.y, 10 * (1 - f), '#d8f22f', 0.55); if (t > q.at) disc(c.x, c.y, 10, '#d8f22f', 0.45);
    label(c.x, c.y, 12, 'Into the bubble · ' + Math.max(0, q.at - t).toFixed(1), '#e8ff6a', 15); } });
  S.impacts.forEach((m) => { if (t >= m.t0 && t <= m.at + 0.3) { const f = Math.min(1, (t - m.t0) / (m.at - m.t0)); disc(m.x, m.y, m.r, '#c8a36a', 0.16); ring(m.x, m.y, m.r, m.color || '#c8a36a', 1, 0.3); disc(m.x, m.y, m.r * f, '#ff5a3c', 0.25); } });
  G.eggs.forEach((e) => { if (e.state === 'air' && t >= e.land - 2.5) { const f = Math.min(1, (t - e.land + 2.5) / 2.5); disc(e.x, e.y, 4, '#e6e0c8', 0.12); ring(e.x, e.y, 4, '#e6e0c8', 1, 0.25); disc(e.x, e.y, 4 * f, '#ff5a3c', 0.22);
    P({ k: 'egg', x: e.x, y: e.y, h: 1.2 + 32 * (1 - f * f) }); } }); /* (falling from the sky until it lands) */
  // the beam: from the spectral image to the tank in it (b.tank, else the off tank)
  S.beams.forEach((b) => { const tk = G.bots[b.tank || 't2']; if (t >= b.t0 && t <= b.t1 && tk) P({ k: 'beam', x0: b.from[0], y0: b.from[1], x1: tk.x, y1: tk.y });
    if (t >= b.t0 - 1 && t <= b.t1) { disc(b.from[0], b.from[1], 3, '#3af2a8', 0.25); ring(b.from[0], b.from[1], 3, '#3af2a8', 1, 0.25); P({ k: 'ghost', x: b.from[0], y: b.from[1] }); label(b.from[0], b.from[1], 15, 'Spectral Ula\'tek', '#3af2a8', 14); } });
  S.tails.forEach((q) => { if (t >= q.t0 && t <= q.at + 0.6) { disc(q.x, q.y, 3, '#ff5a3a', 0.35); ring(q.x, q.y, 3, '#ff5a3a', 1, 0.25); P({ k: 'stail', x: q.x, y: q.y, f: Math.min(1, (t - q.t0) / 1.2) }); label(q.x, q.y, 8, 'Tail', '#ff8a6a', 13); } });
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
    if (e.who) { const b = e.who === me ? { x: G.x, y: G.y } : G.bots[e.who]; if (!b) return; x = b.x; y = b.y; h = 3.9; disc(b.x, b.y, 3, '#3af2a8', 0.08); ring(b.x, b.y, 3, '#3af2a8', 0.85, 0.2); }
    P({ k: 'egg', x, y, h, held: !!e.who });
    if (e.state === 'floor' && t < e.shell) { ring(e.x, e.y, 2, '#e6e0c8', 1, 0.3); P({ k: 'arc', x: e.x, y: e.y, r: 2, f: (t - e.land) / (e.shell - e.land), c: '#ffd36b', o: 1 }); P({ k: 'dome', x: e.x, y: e.y, r: 1.7, c: '#3af2a8', o: 0.22 }); }
    if (e.id === me && e.state === 'floor') { ring(e.x, e.y, 2.8, '#f3c969', 1, 0.3, true); label(e.x, e.y, 4.2, t < e.shell ? 'Your egg (shell up)' : 'Your egg: pick it up', '#f3c969', 14); } });
  const ys = A.spot ? A.spot() : null; if (ys) { disc(ys[0], ys[1], 1.3, '#f3c969', 0.18); ring(ys[0], ys[1], 1.3, '#f3c969', 1, 0.25, true); label(ys[0], ys[1], 2.8, 'Your spot', '#f3c969', 13); }
  const nextEgg = G.eggs.find((e) => e.id === me && e.state === 'air' && e.land - t < 14); if (nextEgg) { disc(nextEgg.x, nextEgg.y, 4.5, '#f3c969', 0.08); ring(nextEgg.x, nextEgg.y, 4.5, '#f3c969', 1, 0.3, true); label(nextEgg.x, nextEgg.y, 4.5, 'Your egg lands here', '#f3c969', 14); }
  // the adds, the Wretches, her, her tail, the heart
  G.adds.forEach((a) => { P({ k: 'add', kind: a.kind, x: a.x, y: a.y }); label(a.x, a.y, 2.6, a.kind === 'viper' ? 'Viper' : 'Rawling', a.kind === 'viper' ? '#ff8f87' : '#c9df9a', 12); });
  S.wretches.forEach((w) => { const c = G.wr[w.id]; if (!c) return; const up = t >= w.awake; P({ k: 'wretch', id: w.id, x: c.x, y: c.y, awake: up }); label(c.x, c.y, up ? 6 : 4.5, up ? 'Blightscale Wretch' : 'Wretch (asleep)', '#c89bff', 13); });
  const B = A.bossAt(t), TL = A.tailAt(t), D = S.dive;
  let sink = 0; if (B.up && t >= D.t0 && t < D.gone) sink = (t - D.t0) / (D.gone - D.t0); if (B.up && t >= D.surf && t < D.surf + 1.5) sink = 1 - (t - D.surf) / 1.5; /* (only the picture: bossAt says where she is) */
  if (B.up) { P({ k: 'boss', x: B.p[0], y: B.p[1], sink }); if (sink < 0.6) label(B.p[0], B.p[1], 33, 'Ula\'tek', '#e9ffd0', 16); }
  if (TL.up) { const th = S.thrash.find((q) => t >= q.t0 && t <= q.at + 0.6); P({ k: 'tail', x: TL.p[0], y: TL.p[1], wig: th ? Math.min(1, (t - th.t0) / (th.at - th.t0)) : 0 }); label(TL.p[0], TL.p[1], 15, 'Gore Rattle', '#e8d6a8', 13); }
  if (t >= 145.5 && t < 165.5) { const hp = S.F(PG_UL.heart, t); disc(hp[0], hp[1], 3, '#5a0f22', 0.6); ring(hp[0], hp[1], 3, '#ff5a7a', 1, 0.3); P({ k: 'heart', x: hp[0], y: hp[1] }); label(hp[0], hp[1], 6.5, 'Venomous Heart', '#ff9fb2', 14); }
  // the raid, then you (a gold ring and YOU), your defensive, where you clicked
  const RAID = typeof GDZ_RAID !== 'undefined' ? GDZ_RAID : Object.keys(G.bots);
  RAID.forEach((id) => { const b = G.bots[id]; if (id === me || !b) return; const rc = GDZ_ROLE[A.rl(id)][1], cc = A.clsC(id); ring(b.x, b.y, 0.95, rc, 0.9, 0.16); P({ k: 'unit', id, x: b.x, y: b.y, c: cc || rc }); label(b.x, b.y, 3.1, A.nm(id).slice(0, 12), cc || '#cfd6df', 12); });
  if (G.debs.def && G.debs.def.until > t) P({ k: 'dome', x: G.x, y: G.y, r: 1.9, c: '#7fb8ff', o: 0.18 });
  ring(G.x, G.y, 1.25, '#f3c969', 1, 0.32); P({ k: 'unit', id: me, x: G.x, y: G.y, c: A.clsC(me) || GDZ_ROLE[A.rl(me)][1], you: true }); label(G.x, G.y, 3.4, 'YOU', '#ffd34d', 15);
  const tg = A.target; if (tg) ring(tg[0], tg[1], 0.6, '#ffffff', 0.6, 0.15);
  return out;
}

// ---- the 3D view: pg3d(host, A) draws into host (a box over the 2D canvas). A as above, plus walk([x, y]) for a click on the floor, flashT
// (the red hurt flash) and fail(e) (a crash while drawing: practice.js goes back to 2D). Returns { draw(t), resize(), pick(clientX, clientY)
// -> [x, y] or null, fwd() -> the way the camera looks [x, y], yaw, dispose() } ----
function pg3d(host, A) {
  const T = window.THREE, TAU = Math.PI * 2, WATER = -0.55, own = [], keep = (o) => { own.push(o); return o; };
  const R = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  R.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  const cv = R.domElement; cv.className = 'pg3-cv'; cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair;touch-action:none';
  const fxL = document.createElement('div'), flL = document.createElement('div');
  fxL.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
  flL.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(ellipse at center,rgba(255,40,30,0) 45%,rgba(255,40,30,.45) 100%)';
  host.textContent = ''; host.appendChild(cv); host.appendChild(fxL); host.appendChild(flL);
  const scene = new T.Scene(); scene.background = new T.Color(0x0b120d); scene.fog = new T.Fog(0x0b120d, 110, 260);
  const cam = new T.PerspectiveCamera(55, 1, 0.5, 700);
  scene.add(new T.HemisphereLight(0xcfe8d0, 0x1d3a14, 0.8));
  const sun = new T.DirectionalLight(0xfff2dd, 0.85); sun.position.set(-30, 70, 30); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -72, right: 72, top: 72, bottom: -72, near: 1, far: 220 }); sun.shadow.bias = -0.0006; scene.add(sun);
  const V = (p) => new T.Vector3(p[0], p[1], p[2]), onP = (x, y) => PG_UL.onPlat(x, y), baseY = (x, y) => (onP(x, y) ? 0 : WATER - 0.45);
  const low = (x, y, r) => r < 8 && !onP(x, y); /* (a small shape off the stone sits on the venom, not in the air) */
  const col = (m, c) => { if (m.userData.c !== c) { m.userData.c = c; m.color.set(c); if (m.emissive && m.userData.glow) m.emissive.set(c).multiplyScalar(m.userData.glow); } };

  // the venom: a big green sheet with a slow swell
  const wg = keep(new T.PlaneGeometry(420, 420, 70, 70)); wg.rotateX(-Math.PI / 2);
  const water = new T.Mesh(wg, keep(new T.MeshStandardMaterial({ color: 0x24581a, emissive: 0x0b2405, roughness: 0.28, metalness: 0.2 }))); water.position.y = WATER; water.receiveShadow = true; scene.add(water);
  const wpos = wg.attributes.position, wbase = wpos.array.slice();
  // the stone: practice.js's PG_UL.onPlat octagon (|x| <= 36.5, |y| <= 34, |x| + |y| <= 49), slabs every 5 yards, a pale rim at the very edge
  const OCT = [[36.5, 12.5], [15, 34], [-15, 34], [-36.5, 12.5], [-36.5, -12.5], [-15, -34], [15, -34], [36.5, -12.5]];
  const shp = (L) => { const s = new T.Shape(); L.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.closePath(); return s; };
  const slab = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#4f585f'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { const l = 116 + ((i * 3 + j * 5) % 4) * 6; g.fillStyle = 'rgb(' + l + ',' + (l + 9) + ',' + (l + 17) + ')'; g.fillRect(i * 128 + 3, j * 128 + 3, 122, 122); }
    for (let k = 0; k < 1400; k++) { g.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.07).toFixed(3) + ')'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
    const tx = keep(new T.CanvasTexture(c)); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(0.1, 0.1); tx.anisotropy = 4; return tx; })();
  const pg = keep(new T.ExtrudeGeometry(shp(OCT), { depth: 4, bevelEnabled: false })); pg.rotateX(-Math.PI / 2);
  const plat = new T.Mesh(pg, [keep(new T.MeshStandardMaterial({ map: slab, roughness: 0.9 })), keep(new T.MeshStandardMaterial({ color: 0x5d666e, roughness: 0.95 }))]); plat.position.y = -4; plat.receiveShadow = true; scene.add(plat);
  { const rim = shp(OCT); rim.holes.push(shp(OCT.map((p) => [p[0] * 0.985, p[1] * 0.982]).reverse())); const rg = keep(new T.ShapeGeometry(rim)); rg.rotateX(-Math.PI / 2);
    const m = new T.Mesh(rg, keep(new T.MeshBasicMaterial({ color: 0xc9d2d8, transparent: true, opacity: 0.55, depthWrite: false }))); m.position.y = 0.02; m.renderOrder = 5; scene.add(m); }

  // ---- reused pieces: floor shapes from a few flat geometries, everything else from pools (nothing new per frame once warm) ----
  const flatG = (g) => { g.rotateX(-Math.PI / 2); return keep(g); };
  const UDISC = flatG(new T.CircleGeometry(1, 72)), URING = flatG(new T.RingGeometry(0.965, 1, 96)), URECT = flatG(new T.PlaneGeometry(1, 1));
  const RINGS = new Map(), ringG = (r, w, dash) => { const key = r.toFixed(2) + '|' + w.toFixed(2) + (dash ? 'd' : ''); let g = RINGS.get(key); if (g) return g;
    if (!dash) g = new T.RingGeometry(Math.max(0.01, r - w), r, Math.max(32, Math.min(180, Math.round(r * 8))));
    else { const n = Math.max(8, Math.round(TAU * r / 2.4)), sub = 5, pos = [], idx = [];
      for (let k = 0; k < n; k++) { const a0 = k * TAU / n, a1 = a0 + TAU / n * 0.58, v0 = pos.length / 3; for (let j = 0; j <= sub; j++) { const a = a0 + (a1 - a0) * j / sub, c = Math.cos(a), s = Math.sin(a); pos.push(c * (r - w), s * (r - w), 0, c * r, s * r, 0); }
        for (let j = 0; j < sub; j++) { const b = v0 + j * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
      g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); }
    g = flatG(g); RINGS.set(key, g); return g; };
  const ARCS = new Map(), arcG = (r, f) => { const q = Math.max(1, Math.min(48, Math.round(f * 48))), key = r + '|' + q; let g = ARCS.get(key); if (!g) { g = flatG(new T.RingGeometry(r - 0.32, r, 64, 1, Math.PI / 2 - q / 48 * TAU, q / 48 * TAU)); ARCS.set(key, g); } return g; };
  // (a wave wall over its strip: rises from the back, a crest that bulges forward in the middle like the 2D's crescents, a steep front; ends closed)
  const WAVES = new Map(), waveG = (D, W) => { const key = D.toFixed(2) + '|' + W.toFixed(2); let g = WAVES.get(key); if (g) return g;
    const NX = 16, NZ = Math.max(4, Math.round(W / 1.1)), pos = [], idx = [], prof = (x, q) => { const xc = D * (0.4 + 0.32 * q), H = 1.5 + 1.3 * q; return Math.max(0.04, x <= xc ? H * Math.pow(Math.sin(x / xc * Math.PI / 2), 1.5) : H * Math.cos((x - xc) / (D - xc) * Math.PI / 2)); };
    for (let j = 0; j <= NZ; j++) { const z = -W / 2 + W * j / NZ, q = 1 - Math.pow(2 * z / W, 2); for (let i = 0; i <= NX; i++) { const x = D * i / NX; pos.push(x - D / 2, prof(x, q), z); } }
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    [0, NZ].forEach((j) => { const z = -W / 2 + W * j / NZ, v0 = pos.length / 3; for (let i = 0; i <= NX; i++) { const x = D * i / NX; pos.push(x - D / 2, prof(x, 0), z, x - D / 2, 0.02, z); } for (let i = 0; i < NX; i++) { const b = v0 + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } });
    g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); WAVES.set(key, keep(g)); return g; };
  const FLAT = []; let nF = 0;
  const flat = (geo, x, y, sx, sz, ry, c, o, lw) => { let m = FLAT[nF]; if (!m) { m = new T.Mesh(geo, keep(new T.MeshBasicMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide }))); scene.add(m); FLAT[nF] = m; }
    nF++; m.geometry = geo; m.visible = true; m.position.set(x, lw ? WATER + 0.3 : 0.035, -y); m.scale.set(sx, 1, sz); m.rotation.set(0, ry, 0); col(m.material, c); m.material.opacity = Math.max(0, Math.min(1, o)); m.renderOrder = 10 + nF; return m; };
  const pools = [], pool = (make) => { const p = { L: [], n: 0 }; pools.push(p); const get = () => { let o = p.L[p.n]; if (!o) { o = make(); p.L.push(o); scene.add(o); } p.n++; o.visible = true; return o; }; get.L = p.L; return get; };
  const DOMEG = keep(new T.SphereGeometry(1, 40, 16, 0, TAU, 0, Math.PI / 2)), WALLG = keep(new T.CylinderGeometry(1, 1, 1, 64, 1, true)); WALLG.translate(0, 0.5, 0);
  const glass = (glow) => { const m = keep(new T.MeshStandardMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, roughness: 0.35 })); m.userData.glow = glow; return m; };
  const dome = pool(() => new T.Mesh(DOMEG, glass(0.3))), wall = pool(() => new T.Mesh(WALLG, glass(0.4)));
  const wave = pool(() => new T.Mesh(URECT, keep(new T.MeshStandardMaterial({ color: 0xa6f03c, emissive: 0x4a8a10, roughness: 0.25, metalness: 0.05, transparent: true, depthWrite: false, side: T.DoubleSide }))));
  const BEAMG = keep(new T.CylinderGeometry(1, 1, 1, 12, 1, true)); BEAMG.translate(0, 0.5, 0);
  const BEAMO = keep(new T.MeshBasicMaterial({ color: 0x3af2a8, transparent: true, opacity: 0.28, depthWrite: false, blending: T.AdditiveBlending })), BEAMI = keep(new T.MeshBasicMaterial({ color: 0xb8ffe6, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending }));
  const beam = pool(() => { const g = new T.Group(), a = new T.Mesh(BEAMG, BEAMO), b = new T.Mesh(BEAMG, BEAMI); a.scale.set(0.8, 1, 0.8); b.scale.set(0.26, 1, 0.26); a.renderOrder = b.renderOrder = 640; g.add(a, b); return g; });
  const BALL = keep(new T.SphereGeometry(1, 16, 12)), CONEG = keep(new T.ConeGeometry(0.9, 3, 8));
  const scaleM = () => keep(new T.MeshStandardMaterial({ color: 0x5a3a8c, roughness: 0.5, emissive: 0x140826, transparent: true })), spikeM = () => keep(new T.MeshStandardMaterial({ color: 0xb7e34a, roughness: 0.5, transparent: true })), boneM = () => keep(new T.MeshStandardMaterial({ color: 0xc8a36a, roughness: 0.6, transparent: true }));
  const SCALE = scaleM(), SPIKE = spikeM(), BONE = boneM(); /* (her and her tail get their own, so they can fade when they'd hide you) */
  const EGGM = keep(new T.MeshStandardMaterial({ color: 0xe9e2c6, roughness: 0.4 })), VIPM = keep(new T.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0x3a0606, roughness: 0.5 })), RAWM = keep(new T.MeshStandardMaterial({ color: 0xa7c46b, roughness: 0.6 }));
  const egg = pool(() => { const m = new T.Mesh(BALL, EGGM); m.scale.set(0.9, 1.17, 0.9); m.castShadow = true; return m; });
  const VIPG = keep(new T.CapsuleGeometry(0.42, 1.8, 4, 8));
  const viper = pool(() => { const g = new T.Group(), b = new T.Mesh(VIPG, VIPM), h = new T.Mesh(BALL, VIPM); b.rotation.x = Math.PI / 2; b.position.y = 0.45; h.scale.setScalar(0.62); h.position.set(0, 0.75, 1.5); b.castShadow = true; g.add(b, h); return g; });
  const rawl = pool(() => { const m = new T.Mesh(BALL, RAWM); m.scale.set(1.15, 0.85, 1.15); m.castShadow = true; return m; });
  // (the Wretch: about the 2D's 2.2 yards across its back; see-through when it stands between the camera and you)
  const wretch = pool(() => { const g = new T.Group(), m = keep(new T.MeshStandardMaterial({ color: 0x5b3e7a, roughness: 0.6, transparent: true })), sm = spikeM(), b = new T.Mesh(BALL, m), h = new T.Mesh(BALL, m); b.scale.set(1.8, 1.45, 2.1); b.position.y = 1.45; h.scale.setScalar(0.9); h.position.set(0, 2.2, 1.9);
    b.castShadow = h.castShadow = true; g.add(b, h); for (let i = 0; i < 4; i++) { const c = new T.Mesh(CONEG, sm); c.scale.setScalar(0.42); c.position.set(0, 2.85, 0.8 - i * 0.8); g.add(c); } g.userData.m = m; g.userData.mats = [m, sm]; return g; });
  // her (a neck out of the venom by the edge, from the mock), her tail with its rattle, the small tails, the spectral image, the heart, the dive's bubbles
  const neckC = new T.CatmullRomCurve3([[0, -9, -16], [0, 4, -10], [0, 14, -6], [0, 22, -1], [0, 24, 4]].map(V)), NECKG = keep(new T.TubeGeometry(neckC, 60, 3.6, 14)), HEADM = keep(new T.MeshStandardMaterial({ color: 0x7c56b8, roughness: 0.45, transparent: true }));
  const BOSSM = [scaleM(), HEADM, spikeM()], TAILM = [scaleM(), boneM(), spikeM()];
  const boss = new T.Group(); { const nk = new T.Mesh(NECKG, BOSSM[0]), hd = new T.Mesh(BALL, HEADM); nk.castShadow = true; hd.scale.set(5.75, 3.9, 7.8); hd.position.set(0, 24, 6.5); hd.castShadow = true; boss.add(nk, hd);
    const eye = keep(new T.MeshBasicMaterial({ color: 0xd8f22f })); [-2.2, 2.2].forEach((x) => { const e = new T.Mesh(BALL, eye); e.scale.setScalar(0.65); e.position.set(x, 25.5, 11); boss.add(e); });
    for (let i = 0; i < 9; i++) { const p = neckC.getPoint(0.1 + i * 0.1), c = new T.Mesh(CONEG, BOSSM[2]); c.position.set(p.x, p.y + 3.3, p.z - 1); boss.add(c); } } scene.add(boss);
  // (her tail rises just off the stone's edge, its rattle over the edge: it never reaches in over the raid)
  const tailC = new T.CatmullRomCurve3([[0, -5, -12], [0, 2.5, -8.5], [0, 7, -5], [0, 9.2, -2], [0, 8.4, 0.4]].map(V));
  const tail = new T.Group(); { const tb = new T.Mesh(keep(new T.TubeGeometry(tailC, 40, 1.35, 10)), TAILM[0]); tb.castShadow = true; tail.add(tb);
    [[7.6, 1.4, 1.15], [6.8, 2.3, 0.9], [6.1, 3, 0.7]].forEach(([y, z, r]) => { const b = new T.Mesh(BALL, TAILM[1]); b.scale.setScalar(r); b.position.set(0, y, z); b.castShadow = true; tail.add(b); });
    for (let i = 0; i < 5; i++) { const p = tailC.getPoint(0.2 + i * 0.15), c = new T.Mesh(CONEG, TAILM[2]); c.scale.setScalar(0.5); c.position.set(p.x, p.y + 1.5, p.z); tail.add(c); } } scene.add(tail);
  // (her or her tail between the camera and you: see-through until you're clear)
  const fade = (g, mats, rad) => { if (!g.visible || !camAt) return; const ax = cam.position.x, az = cam.position.z, dx = camAt[0] - ax, dz = -camAt[1] - az, L2 = dx * dx + dz * dz || 1, px = g.position.x, pz = g.position.z;
    const u = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / L2)), o = Math.hypot(ax + dx * u - px, az + dz * u - pz) < rad || Math.hypot(ax - px, az - pz) < rad * 2 ? 0.25 : 1; /* (or right by the camera) */ mats.forEach((m) => { m.opacity = o; m.depthWrite = o === 1; }); };
  const STG = keep(new T.TubeGeometry(new T.CatmullRomCurve3([[0, -3, -1.5], [0, 1.5, -0.8], [0, 4, 0.3], [0, 5.3, 1.6]].map(V)), 20, 0.6, 8));
  const stail = pool(() => { const g = new T.Group(), m = new T.Mesh(STG, SCALE), b = new T.Mesh(BALL, BONE); b.scale.setScalar(0.75); b.position.set(0, 5.2, 2.2); m.castShadow = true; g.add(m, b); return g; });
  const GHOSTM = keep(new T.MeshStandardMaterial({ color: 0x3af2a8, emissive: 0x1a8a60, transparent: true, opacity: 0.42, depthWrite: false, roughness: 0.3 }));
  const ghost = pool(() => { const g = new T.Group(), nk = new T.Mesh(NECKG, GHOSTM), hd = new T.Mesh(BALL, GHOSTM); hd.scale.set(5.75, 3.9, 7.8); hd.position.set(0, 24, 6.5); g.add(nk, hd); g.scale.setScalar(0.45); return g; });
  const heart = new T.Mesh(BALL, keep(new T.MeshStandardMaterial({ color: 0x8a1030, emissive: 0x5a0f22, roughness: 0.35 }))); heart.castShadow = true; scene.add(heart);
  const fizz = new T.Group(); { const m = keep(new T.MeshStandardMaterial({ color: 0x9fe4ff, transparent: true, opacity: 0.75, roughness: 0.2 })); for (let i = 0; i < 16; i++) fizz.add(new T.Mesh(BALL, m)); } scene.add(fizz);
  // the raid: a capsule each in its class colour (role colour without a team plan)
  const CAPG = keep(new T.CapsuleGeometry(0.55, 1.2, 4, 12)), UNITS = new Map();
  // labels: a sprite each, the same size on screen at any distance
  const LBL = []; let nL = 0, W0 = 0, H0 = 0, pxK = 800;
  const label = (s) => { let L = LBL[nL]; if (!L) { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const tx = keep(new T.CanvasTexture(c)); tx.minFilter = T.LinearFilter; tx.generateMipmaps = false;
      const sp = new T.Sprite(keep(new T.SpriteMaterial({ map: tx, transparent: true, depthTest: false, depthWrite: false, sizeAttenuation: false, fog: false }))); sp.renderOrder = 1000; scene.add(sp); L = LBL[nL] = { sp, c, tx, key: '' }; }
    nL++; const key = s.text + '|' + s.c;
    if (L.key !== key) { L.key = key; const g = L.c.getContext('2d'); g.clearRect(0, 0, 512, 96); let f = 56; g.font = '700 ' + f + 'px system-ui, sans-serif'; const w = g.measureText(s.text).width; if (w > 492) { f = Math.floor(f * 492 / w); g.font = '700 ' + f + 'px system-ui, sans-serif'; }
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.85)'; g.strokeText(s.text, 256, 50); g.fillStyle = s.c; g.fillText(s.text, 256, 50); L.tx.needsUpdate = true; }
    L.sp.visible = true; L.sp.position.set(s.x, s.h + (low(s.x, s.y, 0) ? WATER : 0), -s.y); const k = s.px / 56 / pxK; L.sp.scale.set(512 * k, 96 * k, 1); };

  // ---- one shape on the screen ----
  const V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3(), UP = new T.Vector3(0, 1, 0), faceIn = (x, y) => Math.atan2(-x, y); /* (turned to face the middle of the stone) */
  const put = (s, t) => { const k = s.k;
    if (k === 'disc' || k === 'grow') { if (s.r > 0.05) flat(k === 'disc' ? UDISC : URING, s.x, s.y, s.r, s.r, 0, s.c, s.o, low(s.x, s.y, s.r)); return; }
    if (k === 'ring') { flat(ringG(s.r, s.w, s.dash), s.x, s.y, 1, 1, s.dash ? t * 0.3 : 0, s.c, s.o, low(s.x, s.y, s.r)); return; }
    if (k === 'arc') { flat(arcG(s.r, s.f), s.x, s.y, 1, 1, 0, s.c, s.o, low(s.x, s.y, s.r)); return; }
    if (k === 'rect' || k === 'wave') { const u = Math.cos(s.a), v = Math.sin(s.a), m1 = (s.f0 + s.f1) / 2, m2 = (s.w0 + s.w1) / 2, x = s.x + u * m1 - v * m2, y = s.y + v * m1 + u * m2, Dd = s.f1 - s.f0, Wd = s.w1 - s.w0;
      if (k === 'rect') { flat(URECT, x, y, Dd, Wd, s.a, s.c, s.o, false); return; }
      const q = Math.min(1, s.o / 0.92), m = wave(); m.geometry = waveG(Dd, Wd); m.position.set(x, 0.03, -y); m.rotation.set(0, s.a, 0); m.scale.set(1, 0.25 + 0.75 * q, 1); m.material.opacity = 0.88 * q; m.renderOrder = 600;
      flat(URECT, x, y, Dd, Wd, s.a, '#ff4a32', 0.3 * q, false); return; } /* (the red strip under it: exactly where it hits) */
    if (k === 'dome' || k === 'wall') { const m = k === 'dome' ? dome() : wall(); m.position.set(s.x, low(s.x, s.y, s.r) ? WATER + 0.25 : 0.03, -s.y); if (k === 'dome') m.scale.setScalar(s.r); else m.scale.set(s.r, s.h, s.r); col(m.material, s.c); m.material.opacity = s.o; m.renderOrder = k === 'dome' ? 620 : 610; return; }
    if (k === 'beam') { const d = Math.hypot(s.x0, s.y0) || 1, sx = s.x0 * (1 - 2.9 / d), sy = s.y0 * (1 - 2.9 / d); V1.set(sx, 10.2, -sy); V2.set(s.x1, baseY(s.x1, s.y1) + 1.3, -s.y1); V3.subVectors(V2, V1); const len = V3.length(), g = beam(); g.position.copy(V1); g.quaternion.setFromUnitVectors(UP, V3.normalize()); g.scale.set(1, len, 1); return; }
    if (k === 'unit') { let u = UNITS.get(s.id); if (!u) { u = { m: new T.Mesh(CAPG, keep(new T.MeshStandardMaterial({ roughness: 0.55 }))), x: s.x, y: s.y }; u.m.castShadow = true; scene.add(u.m); UNITS.set(s.id, u); }
      col(u.m.material, s.c); u.m.material.emissive.setHex(s.you ? 0x2a2008 : 0); const mv = Math.hypot(s.x - u.x, s.y - u.y) > 0.005; u.x = s.x; u.y = s.y; u.m.position.set(s.x, baseY(s.x, s.y) + 1.15 + (mv ? Math.abs(Math.sin(t * 16)) * 0.14 : 0), -s.y); u.m.visible = true; u.on = true; return; }
    if (k === 'egg') { const m = egg(), z = s.held ? 0.72 : 1; m.scale.set(0.9 * z, 1.17 * z, 0.9 * z); m.position.set(s.x, baseY(s.x, s.y) + s.h + (s.held ? Math.sin(t * 4) * 0.15 : 0), -s.y); return; }
    if (k === 'add') { const g = s.kind === 'viper' ? viper() : rawl(); g.position.set(s.x, baseY(s.x, s.y) + (s.kind === 'viper' ? 0 : 0.8), -s.y); if (s.kind === 'viper') g.rotation.y = t * 1.6 + s.x; return; }
    if (k === 'wretch') { const g = wretch(), ud = g.userData; if (ud.x != null && Math.hypot(s.x - ud.x, s.y - ud.y) > 0.02) g.rotation.y = Math.atan2(s.x - ud.x, -(s.y - ud.y)); ud.x = s.x; ud.y = s.y;
      g.position.set(s.x, baseY(s.x, s.y), -s.y); g.scale.set(1, s.awake ? 1 : 0.6, 1); col(ud.m, s.awake ? '#9b5cff' : '#5b3e7a'); return; }
    if (k === 'boss') { boss.visible = true; boss.position.set(s.x, -36 * s.sink, -s.y); boss.rotation.y = faceIn(s.x, s.y); return; }
    if (k === 'tail') { tail.visible = true; tail.position.set(s.x, 0, -s.y); tail.rotation.set(s.wig > 0 && s.wig < 1 ? Math.sin(s.wig * 9) * 0.06 : 0, faceIn(s.x, s.y) + (s.wig > 0 ? Math.sin(s.wig * Math.PI * 3) * 0.35 * s.wig : 0), 0); return; }
    if (k === 'stail') { const g = stail(); g.position.set(s.x, WATER, -s.y); g.rotation.y = faceIn(s.x, s.y); g.scale.setScalar(0.25 + 0.75 * s.f); return; }
    if (k === 'ghost') { const g = ghost(); g.position.set(s.x, 0, -s.y); g.rotation.y = faceIn(s.x, s.y); return; }
    if (k === 'heart') { heart.visible = true; heart.position.set(s.x, 3.2, -s.y); heart.scale.setScalar(2.2 * (1 + 0.08 * Math.sin(t * 7))); return; }
    if (k === 'fizz') { fizz.visible = true; fizz.position.set(s.x, 0, -s.y); fizz.children.forEach((b, i) => { const a = i * 2.4, rr = 0.8 + (i * 1.7) % 3.8, ph = (t * 1.1 + i * 0.37) % 1; b.position.set(Math.cos(a) * rr, WATER + ph * 1.6, Math.sin(a) * rr); b.scale.setScalar((0.2 + (i % 3) * 0.12) * (1 - ph * 0.5)); }); return; }
    if (k === 'label') label(s); };

  // ---- the camera: behind you and gliding after you; yaw is the way it looks (the game's angle: 0 east, a quarter turn north) ----
  let yaw = Math.PI / 2, pitch = 0.55, dist = 36, camAt = null, dead = false, lastT = 0, lastDraw = 0, prevNow = 0, pend = 0, drag = null, flashSeen = 0;
  { const G = A.G, B = G && A.bossAt ? A.bossAt(G.t) : null; if (B) yaw = Math.atan2(B.p[1] - G.y, B.p[0] - G.x); } /* (first facing her) */
  const place = () => { if (!camAt) return; const fx = Math.cos(yaw), fy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), th = camAt[2] + 2.2;
    cam.position.set(camAt[0] - fx * cp * dist, th + sp * dist, -(camAt[1] - fy * cp * dist)); cam.lookAt(camAt[0] + fx * 4, th, -(camAt[1] + fy * 4)); };
  const resize = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h || (w === W0 && h === H0)) return; W0 = w; H0 = h; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); pxK = (h / 2) / Math.tan(cam.fov * Math.PI / 360); };
  const RAY = new T.Raycaster(), NDC = new T.Vector2(), GROUND = new T.Plane(new T.Vector3(0, 1, 0), 0), HIT = new T.Vector3();
  const pick = (X, Y) => { const r = cv.getBoundingClientRect(); if (!r.width || !r.height || !camAt) return null; NDC.set((X - r.left) / r.width * 2 - 1, 1 - (Y - r.top) / r.height * 2); cam.updateMatrixWorld(); RAY.setFromCamera(NDC, cam);
    const p = RAY.ray.intersectPlane(GROUND, HIT); if (!p || Math.hypot(p.x, p.z) > 140) return null; return [p.x, -p.z]; };
  // (the damage numbers float up by you, and the red flash when you're hurt, over the picture as in 2D)
  const FX = new Map(), V4 = new T.Vector3();
  const fx = (t) => { const G = A.G; G.fx = G.fx.filter((f) => t - f.t0 < 1.2); const live = new Set();
    for (const f of G.fx) { if (/^−?0$/.test(f.text)) continue; let el = FX.get(f); if (!el) { el = document.createElement('div'); el.textContent = f.text; el.style.cssText = 'position:absolute;left:0;top:0;font:800 18px system-ui,sans-serif;color:' + f.c + ';text-shadow:0 0 3px #000,0 1px 2px #000;white-space:nowrap'; fxL.appendChild(el); FX.set(f, el); }
      live.add(f); const e1 = t - f.t0; V4.set(f.x, baseY(f.x, f.y) + 3.4 + e1 * 1.6, -f.y).project(cam); if (V4.z > 1) { el.style.display = 'none'; continue; }
      el.style.display = ''; el.style.opacity = String(Math.max(0, 1 - e1 / 1.2)); el.style.transform = 'translate(' + ((V4.x + 1) / 2 * W0).toFixed(1) + 'px,' + ((1 - V4.y) / 2 * H0).toFixed(1) + 'px) translate(-50%,-50%)'; }
    for (const [f, el] of FX) if (!live.has(f)) { el.remove(); FX.delete(f); } };
  const draw1 = (t) => { lastT = t; const now = performance.now(), dt = prevNow ? Math.min(0.1, (now - prevNow) / 1000) : 0.016; prevNow = now; lastDraw = now; resize(); const G = A.G; if (!G) return;
    for (let i = 0; i < wpos.count; i++) { const x = wbase[i * 3], z = wbase[i * 3 + 2]; wpos.setY(i, Math.sin(x * 0.08 + t * 1.4) * 0.12 + Math.cos(z * 0.07 + t) * 0.1); } wpos.needsUpdate = true;
    nF = 0; nL = 0; pools.forEach((p) => { p.n = 0; }); boss.visible = tail.visible = heart.visible = fizz.visible = false; UNITS.forEach((u) => { u.on = false; });
    const L = pg3dShapes(A, t); for (let i = 0; i < L.length; i++) put(L[i], t);
    for (let i = nF; i < FLAT.length; i++) FLAT[i].visible = false; for (let i = nL; i < LBL.length; i++) LBL[i].sp.visible = false; pools.forEach((p) => { for (let i = p.n; i < p.L.length; i++) p.L[i].visible = false; }); UNITS.forEach((u) => { u.m.visible = u.on; });
    const px = G.x, py = G.y, ph = baseY(px, py); if (!camAt || Math.hypot(camAt[0] - px, camAt[1] - py) > 25) camAt = [px, py, ph]; else { const q = 1 - Math.exp(-dt * 9); camAt[0] += (px - camAt[0]) * q; camAt[1] += (py - camAt[1]) * q; camAt[2] += (ph - camAt[2]) * q; }
    place(); fade(boss, BOSSM, 12); fade(tail, TAILM, 6); wretch.L.forEach((g) => fade(g, g.userData.mats, 2.4)); fx(t);
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
    own.forEach((o) => { try { o.dispose(); } catch (e) { /* (already gone) */ } }); own.length = 0; RINGS.clear(); ARCS.clear(); WAVES.clear(); FX.clear(); scene.clear();
    try { R.dispose(); R.forceContextLoss(); } catch (e) { /* (no context left) */ } host.textContent = ''; };
  resize();
  return { draw, resize, pick, dispose, fwd: () => [Math.cos(yaw), Math.sin(yaw)], get yaw() { return yaw; }, set yaw(v) { yaw = +v || 0; kick(); }, get pitch() { return pitch; }, set pitch(v) { pitch = Math.max(0.1, Math.min(1.35, +v || 0.5)); kick(); }, get dist() { return dist; }, set dist(v) { dist = Math.max(8, Math.min(85, +v || 34)); kick(); } };
}
