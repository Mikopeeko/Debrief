// ===== Practice: play a part of the fight (rebuilt from scratch, Nov 11; Flex: "im giving you creative freedom on the game to make it really
// good. Even if you have to entirely build it from scratch" / "Need you to put in your best effort this time") =====
// A browser game over the guide: Ula'tek Mythic, phase 1, on the real fight clock. Its own engine (a canvas at screen rate, a camera on you, the
// guide's room picture), the fight scripted second by second from the measured top Mythic kills (notes/Guides/Bosses/8 Ula'tek.md) and the
// guide's plan (spots, soak groups, bubbles), a WoW-style screen (your frame and debuffs, her cast bar, boss-mod timers, raid warnings, an
// action bar), 19 raiders who do their jobs and dodge, and a report at the end. Built into ui.js's scope next to guides.js (build.ps1,
// /*PRACTICE*/): it borrows the guide's room numbers (UX_HOME, UX_ZONE, UL_EDGE, GDZ_ROLE) but draws and plays on its own.
const PG_PARTS = { "Ula'tek": { m: { name: 'Phase 1', end: 165, roles: [
  { id: 'r3', name: 'Ranged', job: 'Egg carrier (west zone)' }, { id: 'm1', name: 'Melee', job: 'Egg carrier (by her, west)' }, { id: 'h2', name: 'Healer', job: 'No egg' }] } } };
const pgPart = (boss, d) => (PG_PARTS[boss] || {})[d] || null;
const pgClock = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const pgRot = (p, deg) => { if (!deg) return [p[0], p[1]]; const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
const pgDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// (a little seeded randomness, so a run can be replayed and tested)
const pgRng = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

// ---- Ula'tek, phase 1, Mythic: the room and the plan (yards from the platform's middle, x east, y north; her at the north edge) ----
const PG_UL = {
  art: 'https://cdn.raidplan.io/raid/wow.venomabyss/map/08.ulatek-ort-full-v185.jpg', artW: 2448 / 7.5, artH: 1371 / 7.5, artY: -0.9,
  boss: [0, 46], tail: [-41, 0], reach: [0, 33], soakA: [-25, 8], soakB: [-25, -8], heart: [0, 41.5],
  // (the stone: an octagon about 69 yards across, from the guide's floor outline)
  onPlat: (x, y) => Math.abs(x) <= 36.5 && Math.abs(y) <= 34 && Math.abs(x) + Math.abs(y) <= 49,
  // (a spot pulled onto the stone, 1.5 yards in from its edge)
  inward: (p) => { let q = [p[0], p[1]]; for (let i = 0; i < 60 && !(Math.abs(q[0]) <= 35 && Math.abs(q[1]) <= 32.5 && Math.abs(q[0]) + Math.abs(q[1]) <= 47); i++) q = [q[0] * 0.98, q[1] * 0.98]; return q; },
  eggO: { r3: [-3, 4], m1: [0, 0], r5: [-3, 2], r1: [2, 3], r2: [-2, 3], r6: [3, -2], m2: [0, 0], r4: [3, 2] },
  // (the coil soak groups: set 1, every carrier takes the first slam inside the Wretch's bubble and group two the second; set 2, the carriers split)
  soak: [[['m1', 'm2', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'h1', 'h3', 'm3'], ['m4', 'm5', 'm6', 'm7', 'h2', 'h4', 'r7']],
    [['r1', 'r3', 'r5', 'm1', 'h1', 'h3', 'm3', 'm4', 'm5'], ['r2', 'r4', 'r6', 'm2', 'h2', 'h4', 'm6', 'm7', 'r7']]],
};

// the fight, second by second (the measured top Mythic kills, the guide's plan); east: she surfaces on the east edge
// (Nov 15, Main checked it against the measured Mythic clock, notes/Guides/Bosses/8 Ula'tek.md "Mythic phase 1, measured", the same to half a second on
// every pull: eggs 0:01 · Wretch lands 0:03 (wakes 0:23) · venom beam 0:15 to 0:19 · Mother's Wrath 0:27 · bubble 0:39 · coils 0:40 and 0:43 · Thrash 0:49 ·
// her waves 0:56 · bubble 1:10 · eggs 1:11 · second Wretch 1:12 · dive 1:17 · second beam 1:24 to 1:28 · Mother's Wrath 1:37 · Thrash 1:46 · bubble 1:48 ·
// her waves 1:53 · coils 2:14 and 2:17 · bubble 2:20. tests/practice-game.js holds the game to it)
function pgUlScript(o) {
  // (the sides, from the run's seed so a run can be replayed: where she surfaces, her tail's side in set 1 (west or east, about even), and which coil of
  // each set appears first; Flex: "whichever appears first is the one gets soaked", team 1 takes it)
  const rnd = pgRng(o.seed || 1), side = pgRng(((o.seed || 1) * 7919 + 13) >>> 0), sr = [side(), side(), side(), side()];
  const east = o.east != null ? !!o.east : sr[0] < 0.5, tailEast = o.tailEast != null ? !!o.tailEast : sr[1] < 0.5, first = Array.isArray(o.first) ? o.first.map((x) => !!x) : [sr[2] < 0.5, sr[3] < 0.5];
  const ROT = east ? -90 : 90, SURF = 85.8, DIVE = 77, rotAt = (t) => (t < SURF ? 0 : ROT), F = (p, t) => pgRot(p, rotAt(t));
  // (her tail's frame: the plan's spots are for a tail on the west; set 1 mirrors them when it rises east, set 2 turns them to the south after her turn)
  const FT = (p, t) => (t < SURF ? (tailEast ? [-p[0], p[1]] : [p[0], p[1]]) : east ? [p[1], p[0]] : [-p[1], p[0]]);
  // (her tank: t1 until the dive; then the tank who took the first Mother's Wrath soaks the second beam and takes the new tail, and the other has her)
  const S = { ROT, SURF, rotAt, F, FT, end: 165, east, tailEast, first, seed: o.seed || 1, herTank: (t) => (t < DIVE ? 't1' : 't2') };
  S.casts = []; S.warns = []; S.timers = []; S.waves = []; S.impacts = []; S.soaks = []; S.bubbles = []; S.thrash = []; S.wrath = []; S.tails = []; S.beams = []; S.pulses = [];
  const cast = (who, name, t0, t1) => S.casts.push({ who, name, t0, t1 }), warn = (t, text, c) => S.warns.push({ t, text, c: c || '#ff8f87' }), timer = (t, name) => S.timers.push({ t, name });
  const cres = (w) => { const n = Math.max(1, Math.round(w / 7)), wd = w / n, out = []; for (let i = 0; i < n; i++) out.push([-w / 2 + wd * i + (i ? 0.6 : 0), -w / 2 + wd * (i + 1) - (i < n - 1 ? 0.6 : 0)]); return out; };
  // eggs: Call of the Serpent, 8 eggs into the carriers' zones (they turn with her), 4-yard landings, a shell for 3.6 s
  S.eggSets = [{ cast: 1, land: 10, rot: 0 }, { cast: 71, land: 80, rot: ROT }].map((e, si) => ({ ...e, si, eggs: Object.keys(PG_UL.eggO).map((id, i) => { const z = UX_ZONE[id], q = PG_UL.eggO[id]; const p = PG_UL.inward(pgRot([z[0] + q[0], z[1] + q[1]], e.rot)); return { id, x: p[0], y: p[1], land: e.land + (i % 3) * 0.7, shell: e.land + (i % 3) * 0.7 + 3.6 }; }) }));
  S.eggSets.forEach((e) => { cast('boss', 'Call of the Serpent', e.cast, e.cast + 1.4); warn(e.cast, e.si ? 'Call of the Serpent: eight more eggs!' : 'Call of the Serpent: eggs incoming!', '#e6e0c8'); timer(e.land, 'Eggs land'); });
  // the Wretches: Toxic Womb lands in the middle (7 yards) at 0:03 and 1:12, it wakes 20 s later; a spectral image beams it, five impacts a second apart
  // (0:15 to 0:19, 1:24 to 1:28), all on one tank: the off tank first, then the tank who took the first Mother's Wrath. The old Wretch dies as the new one lands.
  // (the guide: the first image rises on her tail's side, so the raid knows early where the coils will be)
  const IMG = [UL_EDGE.NW, UL_EDGE.SE];
  S.wretches = [{ id: 'w1', cast: 1.8, land: 3, awake: 23, dies: 73, img: FT(IMG[0], 15), beam: 15, tank: 't2' }, { id: 'w2', cast: 70.8, land: 72, awake: 92, dies: 160 /* (the raid kills it in the heart burn, before its third bubble at about 2:52: an estimate, engine.js "dies between the second and third bubble") */, img: IMG[1], beam: 84, tank: S.herTank(27) }];
  S.wretches.forEach((w, wi) => { cast('boss', 'Toxic Womb', w.cast, w.cast + 1.2); warn(w.cast, wi ? 'Toxic Womb: a second Wretch!' : 'Toxic Womb: stay out of the middle!', '#d8f22f'); timer(w.land, 'Toxic Womb lands');
    S.impacts.push({ x: 0, y: 0, r: 7, t0: w.cast + 0.4, at: w.land, name: 'Toxic Womb', dmg: 50, color: '#c8a36a', tip: 'Stay out of its 7 yards: the Womb lands in the middle.' });
    const B = [w.img[0] + (0 - w.img[0]) * 0.34, w.img[1] + (0 - w.img[1]) * 0.34], ba = Math.atan2(-w.img[1], -w.img[0]) * 180 / Math.PI; w.B = B;
    S.beams.push({ from: w.img, to: [0, 0], at: B, t0: w.beam - 0.4, t1: w.beam + 4.3, hits: [0, 1, 2, 3, 4].map((i) => w.beam + i), wretch: w.id, tank: w.tank });
    warn(w.beam - 2, 'Venom beam on the off tank: only the tank stands in it. Stay out of its side waves!', '#3af2a8'); timer(w.beam, 'Venom beam');
    for (let i = 0; i < 5; i++) [90, -90].forEach((a) => S.waves.push({ kind: 'incub', tank: w.tank, warn: 1.5, x: B[0], y: B[1], deg: ba + a, v: 12.5, w: 10, d: 5, cres: cres(10), t0: w.beam + i, t1: w.beam + 9.5 + i, name: 'Caustic Waves from the off tank', tip: 'The off tank\'s beam sends waves out sideways: stay clear of their lanes.' })); });
  // the bubbles (Fester Burst, 4 s cast, 10 yards round the Wretch) at 0:39, 1:10, 1:48 and 2:20: on the first coil's circle (by her tail, whichever coil comes
  // first); in the middle by her; the second Wretch held by her tank 20 yards in front of her new spot (measured 17 to 22, and 46 to 53 from the new tail), the
  // raid on it from the Thrash's cast so the Thrash only hits them small; between the second coil circles. `tank`: who holds the Wretch there
  const B1 = (p) => FT(first[0] ? [p[0], -p[1]] : p, 30);
  [{ w: 'w1', t0: 35, at: 39, p: B1([-26, 2]), m: B1, tank: 't2' }, { w: 'w1', t0: 66, at: 70, p: [4, 20], tank: 't2' }, { w: 'w2', t0: 104, at: 108, p: F([0, 26], 108), tank: S.herTank(108), stack: 101.5 },
    { w: 'w2', t0: 136, at: 140, p: FT([-25, 0], 140), tank: S.herTank(108) === 't1' ? 't2' : 't1' }].forEach((b) => {
    S.bubbles.push(b); cast('wretch', 'Fester Burst', b.t0, b.at); warn(b.t0, 'Fester Burst: into the Wretch\'s bubble!', '#d8f22f'); timer(b.at, 'Fester Burst'); });
  // Mother's Wrath: 5 s cast, her tank knocked back, then five bites in her reach (the red circle in front of her)
  [22, 92].forEach((t) => { cast('boss', 'Mother\'s Wrath', t, t + 5); warn(t, 'Mother\'s Wrath on her tank: stay out of her reach', '#ff8f87'); timer(t + 5, 'Mother\'s Wrath bites'); S.wrath.push({ t0: t, at: t + 5, p: F(PG_UL.reach, t + 1), tank: S.herTank(t + 5) }); });
  // Spectral Coils: two 10-yard soaks beside her tail, wherever it is (set 1 west or east, set 2 south), slamming 0:40 and 0:43, 2:14 and 2:17; either one can
  // appear first, and team 1 soaks the first to appear (Flex); Soul Constrictor 5 s on Mythic; carried eggs break
  [{ set: 0, cast: 36, a: 40, b: 43 }, { set: 1, cast: 130, a: 134, b: 137 }].forEach((c) => { cast('tail', 'Spectral Coils', c.cast, c.cast + 0.8); warn(c.cast, 'Spectral Coils: team 1 takes the first coil to appear!', '#24f2cb');
    const P0 = first[c.set] ? PG_UL.soakB : PG_UL.soakA, P1 = first[c.set] ? PG_UL.soakA : PG_UL.soakB;
    [[c.a, P0, 0], [c.b, P1, 1]].forEach(([at, p, k]) => { const q = FT(p, at); S.soaks.push({ set: c.set, k, x: q[0], y: q[1], r: 10, t0: k ? c.a - 0.6 : c.cast + 0.8, at, cast: c.cast, group: (o.soakSets && o.soakSets[c.set] && o.soakSets[c.set][k]) || (o.soak && o.soak[k] && o.soak[k].length ? o.soak[k] : PG_UL.soak[c.set][k]) }); timer(at, 'Coil slam ' + (k + 1)); }); });
  // Mephitic Thrash: her tail sweeps 35 yards (a big hit and a knockback): everyone near it runs out, its tank too
  warn(101, 'Run to the second Wretch in front of her: its bubble is outside the tail\'s sweep!', '#d8f22f'); /* (the 1:48 stack that wiped Wolfthorn's pulls 7, 8 and 10) */
  [45, 102].forEach((t) => { const p = FT(PG_UL.tail, t); cast('tail', 'Mephitic Thrash', t, t + 4); warn(t, 'Mephitic Thrash: out of her tail\'s 35 yards!', '#ff9b4a'); timer(t + 4, 'Mephitic Thrash'); S.thrash.push({ t0: t, at: t + 4, x: p[0], y: p[1], r: 35 }); });
  // Caustic Waves: 6 s cast, she pulls one wing back; that half gets two waves first, the other half 6.5 s later, rolling away from her
  S.wings = [];
  [50, 107].forEach((t) => { const west = rnd() < 0.5, T0 = t + 6, rot = rotAt(T0), d1 = pgRot([west ? -1 : 1, 0], rot), side = (v) => (Math.abs(v[0]) > Math.abs(v[1]) ? (v[0] < 0 ? 'WEST' : 'EAST') : (v[1] < 0 ? 'SOUTH' : 'NORTH')), wFirst = side(d1), wSafe = side([-d1[0], -d1[1]]);
    S.wings.push({ t, west, first: wFirst, safe: wSafe, d1 }); /* (the half of the room her first waves come down, turned with her after the dive) */
    cast('boss', 'Caustic Waves', t, T0); warn(t, 'Ula\'tek pulls her wing back: the ' + wFirst + ' half goes first!', '#9be13a'); timer(T0, 'Caustic Waves'); timer(T0 + 6.5, 'Caustic Waves (second half)');
    const first = west ? [-12, -36] : [12, 36], second = west ? [12, 36] : [-12, -36];
    [[first, T0], [second, T0 + 6.5]].forEach(([xs, t0]) => xs.forEach((x) => { const p = pgRot([x, 46], rot); S.waves.push({ kind: 'her', x: p[0], y: p[1], deg: 270 + rot, v: 12.5, w: 24, d: 5, cres: cres(24), warn: 2.2, t0, t1: t0 + 7.6, name: 'Caustic Waves', tip: 'Wait on the half that goes second, then cross behind the first wave.' }); })); });
  // the small tails (Gore Rattle), from the 12 measured top Mythic kills (notes/Guides/Bosses/8 Ula'tek.md, "Tail waves"): each rises at the
  // edge 2.4 s before it fires and on Mythic sends 3 straight waves (game data: "reduced to 3 on Mythic"), 12.5 yards a second, about 9 yards
  // wide: its logged heading and two more at random. Spots in her-north yards (after the dive and in the heart burn, the measured her-west
  // spots turned back); the tail that comes with her waves rises on her west or east edge and goes straight across.
  const withHer = () => (rnd() < 0.5 ? [[-40.8, -0.4], 0] : [[39.9, -0.7], 180]);
  [[56, [withHer()]], [58.6, [[[-39.7, -40.2], 64.6], [[38.5, -39.6], 114]]], [69, [[[-55.8, -0.4], 39.4], [[54.8, -0.7], 139.2]]],
    [113, [withHer()]], [115.6, [[[-0.7, -54.8], 90.5], [[39.2, -39.6], 115.7]]], [126, [[[55.8, 0.1], 141.5], [[-39.6, -38.5], 65.8]]], [131.5, [[[-0.4, 55.8], 233.7], [[38.9, 39.5], 206.2]]],
    [143.7, [[[-0.7, -54.8], 90.5], [[39.2, -39.6], 115.7]]], [156.8, [[[-39.6, -38.5], 65.8], [[55.8, 0.1], 141.5]]]].forEach(([t, ts]) => { timer(t, 'Small tails');
    ts.forEach(([q, hd]) => { const p = F(q, t), h = hd + rotAt(t); S.tails.push({ x: p[0], y: p[1], t0: t - 2.4, at: t });
      [0, -(20 + rnd() * 45), 20 + rnd() * 45].forEach((off) => S.waves.push({ kind: 'tail', x: p[0], y: p[1], deg: h + off, v: 12.5, w: 9, d: 4, cres: cres(9), warn: 2.4, t0: t, t1: t + 8.5, name: 'Caustic Waves from a small tail', tip: 'A small tail rising at the edge sends three waves 2.4 s later: step out of their red lanes.' })); }); });
  // the dive: Submerge, bubbles where she'll come up, she surfaces on the other side; her tank has to be there first
  S.dive = { t0: 77, gone: 78.6, surf: SURF, to: pgRot(PG_UL.boss, ROT) }; cast('boss', 'Submerge', 77, 78.6); warn(77, 'Ula\'tek dives: watch for the bubbles!', '#7fd8ff'); warn(SURF, 'She surfaces on the ' + (east ? 'EAST' : 'WEST') + ' edge, where the bubbles were!', '#7fd8ff'); timer(SURF, 'She surfaces');
  // Rage of the Shackled: 6.5 s cast, then her heart is open for 20 s; raid damage every 4 s; Falling Debris (7 yards) all over
  cast('boss', 'Rage of the Shackled', 139, 145.5); warn(139, 'Rage of the Shackled: burn the heart, watch the floor!', '#ff8a5a'); timer(145.5, 'Heart open');
  for (let t = 145.5; t < 165; t += 4) S.pulses.push(t);
  for (let t = 147; t < 164.5; t += 3.4) for (let j = 0; j < 3; j++) { let q; for (let k = 0; k < 30; k++) { q = [-30 + rnd() * 60, -30 + rnd() * 62]; if (PG_UL.onPlat(q[0], q[1])) break; } S.impacts.push({ x: q[0], y: q[1], r: 7, t0: t - 1.8, at: t + j * 0.25, name: 'Falling Debris', dmg: 55, color: '#c8a36a', tip: 'Brown circles in the heart burn: step out before they land.' }); }
  S.timers.sort((a, b) => a.t - b.t); S.warns.sort((a, b) => a.t - b.t);
  return S;
}

function pgOpen(root, boss, d, pk) {
  const part = pgPart(boss, pk || d); if (!part) return; const old = document.querySelector('.pg'); if (old) old.remove();
  pgCss(); const dn = d === 'h' ? 'Heroic' : 'Mythic';
  // (a later part of the fight, e.g. phase 2 (src/practice-p2.js): its own script, room, bots, hits and start card through these hooks; this file keeps the loop, the screen and the score)
  const P2API = { get G() { return G; }, get S() { return S; }, get me() { return me; }, get v3() { return v3; }, get busy() { return vw.classList.contains('busy'); }, get DEB() { return DEB; }, get MAJ() { return MAJ; },
    get DPS_SAY() { return DPS_SAY; }, dpsHint: () => { const t = G.t, dc = dpsCat(t); return dc && !onRight(dc, tgtNow(t)) ? DPS_SAY[dc][0] + ': press Tab to pick ' + (DPS_SAY[dc][3] === 'them' ? 'one' : 'it') + ', then keep pressing 1 to hit it' + (rl(me) === 'm' ? ' (melee: get close to it)' : '') + '.' : null; },
    mistake: (...a) => mistake(...a), hurt: (n) => hurt(n), deb: (...a) => deb(...a), has: (k) => has(k), say: (...a) => say(...a), $: (s) => $(s), hud: (f) => hud(f), clearTarget: () => { target = null; } };
  const P2 = part.mod ? part.mod(P2API) : null;
  const ov = document.createElement('div'); ov.className = 'pg' + (P2 ? ' pg-p2' : ''); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Practice ' + boss + ' ' + part.name);
  // (the screen, laid out like a raider's UI (Nov 15, Flex: "Player healthbar and target bar in the middle, hotbars with spells on them for the attack/sprint/
  // defensive. Boss mods. Etc. Nothing fancy, just a better more familiar layout"): top right the minimap, the 2D | 3D switch and your mistakes, then her boss
  // frame; on the left the boss-mod timer bars; bottom centre your job, then your frame and your target's side by side (her cast bar under the target), then
  // the action bar, filled in once your role is known (actsHtml))
  const HUD = '<div class="pg-in"><canvas class="pg-cv"></canvas><div class="pg-3d"></div>' +
    '<div class="pg-tr"><canvas class="pg-mini" width="200" height="200"></canvas><div class="pg-trow"><div class="pg-vw" role="group" aria-label="View"><button type="button" data-v="2" class="on">2D</button><button type="button" data-v="3" title="3D: drag to turn the camera, W walks where it looks">3D</button></div>' +
    '<div class="pg-mis" title="Your mistakes so far"><b class="pg-mc">0</b><span>Mistakes</span></div></div>' +
    '<div class="pg-bossf"><div class="pg-nm"><b>' + esc(boss) + '</b><span class="pg-clk">0:00</span></div><div class="pg-bar pg-bhp"><i></i><span></span></div></div></div>' +
    '<button type="button" class="pg-x" aria-label="Close">✕</button><div class="pg-timers"></div>' +
    '<div class="pg-warn" aria-live="polite"></div><div class="pg-float"></div>' +
    '<div class="pg-bot"><div class="pg-job"><span>Your job now</span><p></p></div>' +
    '<div class="pg-ufs"><div class="pg-ucol pg-me"><div class="pg-uf"><div class="pg-nm"><b class="pg-mn"></b><span class="pg-mj"></span></div><div class="pg-bar pg-hp"><i></i><span></span></div></div><div class="pg-debs"></div></div>' +
    '<div class="pg-ucol pg-tfc"><div class="pg-uf pg-tf none"><div class="pg-nm"><b class="pg-tfn">No target</b><span class="pg-tfr">Tab to pick</span></div><div class="pg-bar pg-tfh"><i></i><span></span></div></div>' +
    '<div class="pg-bar pg-cast" style="display:none"><i></i><span></span></div><div class="pg-tgt"></div></div></div>' +
    '<div class="pg-acts"></div></div><div class="pg-card"></div></div>';
  ov.innerHTML = HUD;
  (root && root.isConnected ? root : document.body).appendChild(ov); document.documentElement.classList.add('pg-open');
  const mini = ov.querySelector('.pg-mini'), mx2 = mini.getContext('2d'), cv = ov.querySelector('.pg-cv'), cx = cv.getContext('2d'), card = ov.querySelector('.pg-card'), $ = (s) => ov.querySelector(s);
  // ---- pictures: the room, and each role's icon (loaded from Wowhead at runtime, a plain circle until they arrive) ----
  const IMG = {}; const img = (k, src) => { if (IMG[k]) return IMG[k]; const i = new Image(); i.src = src; IMG[k] = i; return i; };
  img('room', PG_UL.art); Object.entries(GDZ_ROLE).forEach(([k, r]) => img('role' + k, 'https://wow.zamimg.com/images/wow/icons/medium/' + r[2] + '.jpg'));
  const ok = (i) => i && i.complete && i.naturalWidth > 0;

  // ---- the game ----
  let S = null, G = null, me = part.roles[0].id, role = part.roles[0], speed = 1, startAt = 0, raf = null, last = 0, paused = true, keys = {}, target = null, Z = 13, cam = null, dpr = 1;
  const SPEED = 7, PR = 0.7, carrierOf = (id) => !!PG_UL.eggO[id];
  // ---- your team's plan: signed in, with a Mythic plan for this boss (the one the Plan page shows), you play as yourself and the others are
  // your raiders on the plan's jobs: each egg area's two (the first is the centre, the second the edge), the coil soaks, the Fester Burst
  // spots; the rest by role. Without one, the guide's plan. ----
  let teamWhy = '', pickedMe = false; /* (why there's no team plan in the game: for the audit) */
  const TEAM = (() => { try { if (P2) { teamWhy = 'a later part: picked jobs'; return null; } if (d !== 'm' || typeof pnGet !== 'function' || typeof pnState !== 'function' || typeof ulRead !== 'function') { teamWhy = 'no plan code (d=' + d + ')'; return null; }
      const o = pnGet(), st = pnState(o, boss), lc = (x) => String(x).split('-')[0].toLowerCase(), on = new Set(((o.on || {})[boss] || []).map(lc));
      const L = notesOf(boss).list.filter((q) => !q.example && !q.pgEmpty && pnNoteDiff(q) === 'Mythic'), chId = typeof planChosenGet === 'function' ? planChosenGet(o.rid, boss) : null, sc = (q) => { const t = noteResolve(q.text); return [...on].filter((x) => noteHas(t, x)).length; };
      const n = (st && st.n && pnNoteDiff(st.n) === 'Mythic' ? st.n : null) || L.find((q) => q.id === chId) || L.slice().sort((a, b) => sc(b) - sc(a) || (b.saved || 0) - (a.saved || 0))[0] || null;
      teamWhy = 'state ' + (st && st.k) + ', plans ' + L.length + ', picked ' + (n ? planNm(n) : 'none') + ', on ' + on.size; if (!n) return null;
      const U = ulRead(noteResolve(n.text));
      const P = pnPeople(o).filter((q) => !q.bench && (!on.size || on.has(lc(q.n)))); teamWhy += ', people ' + P.length + ', teams ' + U.teams.map((x) => x.length).join('/'); if (P.length < 10) return null;
      const byN = new Map(P.map((q) => [lc(q.n), q])), mains = P.map((q) => String(q.n).split('-')[0]), AM = new Map(pnPeople(o, { alts: true }).filter((q) => q.alt).map((q) => [lc(q.n), lc(q.alt)])), al = (x) => { const k = lc(x); if (byN.has(k)) return k; if (AM.has(k) && byN.has(AM.get(k))) return AM.get(k); if (typeof altOf !== 'function') return k; const m = altOf(String(x).split('-')[0], mains); return m ? lc(m) : k; }; /* (an alt in the plan counts as their main) */
      const id2 = {}, used = new Set(), put = (x, id) => { const q = byN.get(al(x)); if (q && !used.has(q) && !id2[id]) { id2[id] = q; used.add(q); } };
      [['melee', ['m1', 'm2']], ['left', ['r5', 'r3']], ['right', ['r6', 'r4']], ['far', ['r1', 'r2']]].forEach(([z, ids]) => (U.ez[z] || []).slice(0, 2).forEach((x, i) => put(x, ids[i])));
      const free = (L) => GDZ_RAID.filter((id) => L.includes(id[0]) && !id2[id]), rk = (q) => (q.role === 'tank' ? 0 : q.role === 'healer' ? 1 : 2);
      P.filter((q) => !used.has(q)).sort((a, b) => rk(a) - rk(b)).forEach((q) => { const w = q.role === 'tank' ? 't' : q.role === 'healer' ? 'h' : q.kind === 'melee' ? 'm' : 'r';
        const id = free([w])[0] || free(w === 'm' ? ['r', 'h'] : w === 'r' ? ['m', 'h'] : ['m', 'r'])[0] || free(['t', 'h', 'm', 'r'])[0]; if (id) { id2[id] = q; used.add(q); } });
      const n2 = new Map(Object.entries(id2).map(([id, q]) => [lc(q.n), id])), ids = (L) => [...new Set((L || []).map((x) => n2.get(al(x))).filter(Boolean))];
      const T = { name: planNm(n), id2, soak: [ids(U.teams[0]), ids(U.teams[1])], ce: [ids(U.ce[0]), ids(U.ce[1])], fb: (U.fb || []).map(ids), you: n2.get(lc((typeof tpMe === 'function' && tpMe()) || (typeof tpWho === 'function' && tpWho()) || '')) || null };
      teamWhy += ', ok ' + T.soak.map((x) => x.length).join('/') + ', me ' + ((typeof tpMe === 'function' && tpMe()) || '-') + '/' + ((typeof tpWho === 'function' && tpWho()) || '-') + ' -> ' + (T.you || 'none') + ', not placed: ' + [...new Set([...U.teams[0], ...U.teams[1], ...(U.fb || []).flat()])].filter((x) => !n2.has(al(x))).join(' ') + ', left out: ' + P.filter((q) => !used.has(q)).map((q) => q.n).join(' '); return T.soak[0].length && T.soak[1].length ? T : null; } catch (e) { teamWhy += ' error ' + e; return null; } })();
  const nm = (id) => (TEAM && TEAM.id2[id] ? String(TEAM.id2[id].n).split('-')[0] : gdzName(id));
  const rl = (id) => { const q = TEAM && TEAM.id2[id]; return q ? (q.role === 'tank' ? 't' : q.role === 'healer' ? 'h' : q.kind === 'melee' ? 'm' : 'r') : id === me && jobMine() ? myJob.role : id[0]; };
  const clsC = (id) => { const q = TEAM && TEAM.id2[id], c = q && E.CLASSES && E.CLASSES[q.cls]; return c ? c[1] : null; };
  const ZN = { m1: ['by her', 'centre'], m2: ['by her', 'edge'], r5: ['left (west)', 'centre'], r3: ['left (west)', 'edge'], r6: ['right (east)', 'centre'], r4: ['right (east)', 'edge'], r1: ['far (south)', 'centre'], r2: ['far (south)', 'edge'] };
  const teamRole = (id) => { const sk = TEAM.soak[0].includes(id) ? 1 : TEAM.soak[1].includes(id) ? 2 : 0; return { id, name: nm(id), job: (carrierOf(id) ? 'Egg carrier, ' + ZN[id][0] : rl(id) === 'h' ? 'Healer' : rl(id) === 't' ? 'Tank' : 'No egg') + (sk ? ' · soak #' + sk : '') }; };
  // ---- your own job, without a team plan (Nov 15, Flex: "letting the player pick their assignment, for those who arent using my website for
  // assignments", then "its a bit overkill"): three rows of buttons, your role, your egg area (or none) and your coil team. The rest is picked for
  // you: the egg spot in your area, a free bubble spot (shown in gold), and team 1 in set 1 for egg carriers. The other 19 take the jobs left and
  // the teams stay even. Remembered on this browser. ----
  const JOB_KEY = 'wla-pg-job', job0 = () => ({ role: 'r', egg: 'r3', soak: [1, 1], fb: [0, 0] });
  const jobOk = (j) => !!j && /^[mrh]$/.test(j.role) && (j.egg === null || !!PG_UL.eggO[j.egg]) && Array.isArray(j.soak) && j.soak.length === 2 && Array.isArray(j.fb) && j.fb.length === 2;
  let myJob = (() => { try { const j = JSON.parse(localStorage.getItem(JOB_KEY) || 'null'); if (jobOk(j)) return { ...j, soak: [j.soak[1], j.soak[1]], fb: [0, 0] }; } catch (e) { /* (no storage) */ } return job0(); })();
  const jobSave = () => { try { localStorage.setItem(JOB_KEY, JSON.stringify(myJob)); } catch (e) { /* (no storage) */ } };
  const jobSlot = (j) => (j.egg && PG_UL.eggO[j.egg] ? j.egg : { m: 'm3', r: 'r7', h: 'h2' }[j.role]);
  const jobMine = () => !P2 && !TEAM && !!myJob && jobSlot(myJob) === me; /* (the picked job is the one played: no team plan, and you're in its slot) */
  // (the coil teams with you on the one you picked: you change places with someone on it, a carrier for a carrier, the same role if there is one)
  const jobSoak = (slot, j) => PG_UL.soak.map((two, si) => { const g = [two[0].slice(), two[1].slice()], want = si === 0 && PG_UL.eggO[slot] ? 0 : j.soak[si] === 2 ? 1 : 0, /* (set 1: carriers take the first coil, in the Wretch's bubble) */ have = g[0].includes(slot) ? 0 : g[1].includes(slot) ? 1 : -1;
    if (have === want) return g; if (have < 0) { g[want].push(slot); return g; }
    const car = (x) => !!PG_UL.eggO[x], pool = g[want], mate = pool.find((x) => car(x) === car(slot) && x[0] === slot[0]) || pool.find((x) => car(x) === car(slot)) || pool[pool.length - 1];
    g[have] = g[have].filter((x) => x !== slot).concat([mate]); g[want] = g[want].filter((x) => x !== mate).concat([slot]); return g; });
  const jobRole = (j) => { const slot = jobSlot(j), sk = jobSoak(slot, j), RN = { m: 'Melee', r: 'Ranged', h: 'Healer' }, t1 = sk[0][0].includes(slot) ? 1 : 2, t2 = sk[1][0].includes(slot) ? 1 : 2; /* (Main, Nov 15: "then 1" read oddly) */
    return { id: slot, name: RN[j.role], job: (j.egg ? 'Egg carrier, ' + ZN[slot][0] + ', ' + ZN[slot][1] + ' spot' : 'No egg') + ' · coil team ' + t1 + (t2 !== t1 ? ', then team ' + t2 : '') }; };
  const newG = () => { G = { t: 0, hp: 100, x: 0, y: 0, debs: {}, log: [], deaths: 0, done: new Set(), eggs: [], adds: [], bots: {}, wr: {}, kb: null, sprint: -99, def: -99, fx: [], warnI: 0, bossHp: 100, still: true, vipers: 0 };
    S.eggSets.forEach((e) => e.eggs.forEach((q) => G.eggs.push({ ...q, set: e.si, state: 'air', who: null })));
    GDZ_RAID.forEach((id) => { const p = homeOf(id, 0); G.bots[id] = { id, x: p[0], y: p[1], esc: null }; });
    const p0 = homeOf(me, 0); G.x = p0[0]; G.y = p0[1]; target = null; keys = {}; cam = null; if (P2) P2.init(G); };
  const reset = (o) => { o = o || {}; S = (P2 ? P2.script : pgUlScript)({ east: o.east, tailEast: o.tailEast, first: o.first, seed: o.seed || ((Date.now() & 0xffff) || 7), soak: TEAM && TEAM.soak, soakSets: jobMine() ? jobSoak(me, myJob) : null }); newG(); };
  // where each raider stands when nothing is happening: her tank in front of her, melee round her, carriers in their zones, the rest inside; turned with her
  const homeOf = (id, t) => { if (P2) return P2.home(id, t); const rot = S.rotAt(t), egg = G && G.eggs.some((e) => (e.who === id && e.state === 'held') || (e.id === id && e.state !== 'gone' && e.state !== 'held' && e.land - t < 14));
    return PG_UL.inward(pgRot(carrierOf(id) && egg ? UX_ZONE[id] : UX_HOME[id], rot)); };
  const bossAt = (t) => { if (P2) return P2.bossAt(t); const D = S.dive; if (t < D.gone) return { p: PG_UL.boss.slice(), up: true }; return { p: D.to, up: t >= D.surf }; };
  // (her waves' halves, Nov 15: [first, safe] as the floor shows them now: until the first wave has gone by the first half is red and the other green,
  // then the colours swap: cross behind it. d: the direction into the half that's hit first)
  const halvesAt = (t) => { if (P2 || !S.wings) return null; const wg = S.wings.find((w) => t >= w.t && t <= w.t + 19); if (!wg) return null; const sw = t >= wg.t + 10.5; return { d: wg.d1, red: sw ? -1 : 1, swap: sw, t0: wg.t, first: wg.first, safe: wg.safe }; };
  const tailAt = (t) => { if (P2) return P2.tailAt(t); const D = S.dive; if (t >= D.gone && t < D.surf) return { p: S.FT(PG_UL.tail, D.surf), up: false }; return { p: S.FT(PG_UL.tail, t), up: true }; };

  // ---- the Wretches: asleep where they land until they wake, then held by a tank (the one of its last bubble, or of its next), brought to each bubble's spot in time ----
  const wretchAt = (w, t) => { if (t < w.land || t >= w.dies) return null; if (t < w.awake) return [0, 0]; const nb = S.bubbles.find((q) => q.w === w.id && q.at >= t - 0.5);
    if (nb && t >= nb.at - 9) return nb.p.slice(); const pv = S.bubbles.filter((q) => q.w === w.id && q.at < t - 0.5).pop(), b = G.bots[(pv || nb || {}).tank || 't2']; return b ? [b.x + 2.2, b.y - 1.2] : [0, 0]; };

  // ---- what hurts (the same shapes as drawn) ----
  const inWave = (w, t, x, y, m) => { if (t < w.t0 || t > w.t1) return false; const el = t - w.t0, R0 = PR + (m || 0);
    if (w.ring) { const Rr = w.v * el + 2.5, st = 2 * Math.PI / w.n, hz = w.cw / 2, dd = Math.hypot(x - w.x, y - w.y); if (Math.abs(dd - Rr - 0.6) > 3.6 + R0) return false;
      for (let k = 0; k < w.n; k++) { const a = w.ph + k * st, u = Math.cos(a), v = Math.sin(a), rx = x - (w.x + u * Rr), ry = y - (w.y + v * Rr), s1 = rx * u + ry * v, s2 = -rx * v + ry * u; if (Math.abs(s2) <= hz + R0 && s1 >= -2.4 - R0 && s1 <= 3.6 + R0) return true; }
      return false; }
    const a = w.deg * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), cx0 = w.x + u * w.v * el, cy0 = w.y + v * w.v * el, rx = x - cx0, ry = y - cy0, s1 = rx * u + ry * v, s2 = -rx * v + ry * u, hw = w.w / 2, hd = w.d / 2;
    if (Math.abs(s2) > hw + R0) return false; if (w.cres && !w.cres.some(([a0, b0]) => s2 >= a0 - R0 && s2 <= b0 + R0)) return false; return s1 >= -hd - R0 && s1 <= hd + 3 + R0; };
  const onPlat = (x, y) => (P2 ? P2.onPlat(x, y) : PG_UL.onPlat(x, y)), inVenom = (x, y) => !onPlat(x, y);
  const nearEdge = (x, y) => { if (onPlat(x, y)) return [x, y]; for (let r = 0.5; r < 20; r += 0.5) for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, qx = x + Math.cos(a) * r, qy = y + Math.sin(a) * r; if (onPlat(qx, qy)) return [qx, qy]; } return [0, 0]; };

  // ---- you: damage, debuffs, mistakes ----
  const DEB = { venom: ['Caustic Venom', '#9be13a'], shell: ['Noxious Shell', '#3af2a8'], yolk: ['Rancid Yolk', '#e0c48c'], soul: ['Soul Constrictor', '#c89bff'], fester: ['Fester Burst', '#d8f22f'], putrid: ['Putrid Membrane', '#7fbf3a'], splash: ['Noxious Splash', '#ff6b5c'], sting: ['Petrifying Sting', '#cfc6b0'], thrash: ['Mephitic Thrash', '#ff9b4a'], acid: ['Acidic Expulsion', '#c9df9a'], def: ['Defensive', '#7fb8ff'], sprint: ['Sprint', '#7ee08f'] };
  const deb = (k, dur, stack) => { const o = G.debs[k] && G.debs[k].until > G.t ? G.debs[k] : { n: 0 }; G.debs[k] = { until: G.t + dur, n: stack ? Math.min(9, o.n + 1) : 1 }; };
  const has = (k) => G.debs[k] && G.debs[k].until > G.t;
  let flashT = 0; const flash = () => { flashT = performance.now(); };
  const hurt = (n) => { if (!n) return; const m = has('def') ? 0.5 : 1; G.hp -= n * m; G.fx.push({ x: G.x, y: G.y, text: '−' + Math.round(n * m), t0: G.t, c: '#ff8f87' }); flash(); };
  const MAJ = new Set(['wave', 'ring', 'impact', 'fester', 'thrash', 'bite', 'viper', 'soak', 'soul', 'yolk', 'beam']);
  // ---- hitting the right thing (Nov 15, Flex: "include dps mechanics ... very simplified version", "just let the player get the idea of what they
  // need to do and when"): Tab picks a target (a click on one picks it too) and you hit it while you're in range (melee 5 yards from it, everyone else
  // 40). The moments that matter: a Viper the moment it hatches, the heart while it's open, the Rawlings after each coil soak. A moment spent mostly
  // on the right thing counts; a miss is one line in the report. No damage numbers: training wheels. ----
  const ADD_HP = { rawling: 3, viper: 5 };
  const tgtList = (t) => { if (P2) return P2.tgts(t); /* (a later part's own targets and moments: src/practice-p2.js) */ const L = [], B = bossAt(t), TL = tailAt(t);
    G.adds.forEach((a) => { a.id = a.id || 'a' + (G.addN = (G.addN || 0) + 1); const mx = ADD_HP[a.kind] || 3; if (a.hp == null) a.hp = mx; L.push({ key: a.id, kind: a.kind, name: a.kind === 'viper' ? 'Blightscale Viper' : 'Blightscale Rawling', p: [a.x, a.y], r: a.kind === 'viper' ? 1.6 : 1.1, hp: a.hp, max: mx }); });
    if (t >= 145.5 && t < 165) L.push({ key: 'heart', kind: 'heart', name: 'Venomous Heart', p: S.F(PG_UL.heart, t), r: 3 });
    S.wretches.forEach((w) => { const c = G.wr[w.id]; if (c && t >= w.awake) L.push({ key: w.id, kind: 'wretch', name: 'Blightscale Wretch', p: [c.x, c.y], r: 2.2 }); });
    if (B.up) L.push({ key: 'boss', kind: 'boss', name: 'Ula\'tek', p: B.p, r: 6.5 }); if (TL.up) L.push({ key: 'tail', kind: 'tail', name: 'Gore Rattle', p: TL.p, r: 3.4 });
    return L; };
  // (the Nov 15 audit: the Wretches died on their own and your hits on them did nothing; their last 10 s are now a moment to help kill them)
  const wretchDying = (t) => S.wretches.some((w) => t >= w.dies - 10 && t < w.dies && t >= w.awake && G.wr[w.id]);
  const dpsCat = (t) => (P2 ? P2.dpsCat(t) : G.adds.some((a) => a.kind === 'viper') ? 'viper' : t >= 145.5 && t < 165 ? 'heart' : G.adds.some((a) => a.kind === 'rawling') ? 'rawling' : wretchDying(t) ? 'wretch' : null);
  const DPS_SAY = { viper: ['Kill the Viper', 'A Viper was up', 'Vipers are deadly: press Tab to pick it, then keep pressing 1 until it dies.'], heart: ['Hit the heart', 'The heart was open', 'When her heart opens, press Tab to pick the Venomous Heart, then keep pressing 1 while you stay in range.'],
    rawling: ['Kill the Rawlings', 'Rawlings were up', 'Each broken egg leaves a Rawling: press Tab to pick one, then keep pressing 1 until they die.'],
    wretch: ['Kill the Wretch', 'The Wretch was going down', 'Help kill each Wretch before its third bubble: press Tab to pick it, then keep pressing 1.', 'it'] };
  const isRight = (cat, o) => !!o && (cat === 'heart' ? o.key === 'heart' : o.kind === cat);
  const inRange = (o) => pgDist([G.x, G.y], o.p) - o.r <= (rl(me) === 'm' ? 5 : 40);
  const tgtNow = (t) => (G.tgt ? tgtList(t).find((o) => o.key === G.tgt) || null : null);
  const GCD = 1; /* (one hit a press, then the button cools down for a second, like a spell on a WoW action bar) */
  const onRight = (cat, o) => !!cat && isRight(cat, o) && inRange(o) && G.lastHitCat === cat && G.t - (G.lastHitT == null ? -99 : G.lastHitT) <= GCD + 0.6;
  const nearestRight = (t) => { const cat = dpsCat(t), L = tgtList(t), d = (o) => pgDist([G.x, G.y], o.p); return (cat ? L.filter((o) => isRight(cat, o)) : L.filter((o) => o.kind !== 'boss' && o.kind !== 'tail')).sort((a, b) => d(a) - d(b))[0] || L.sort((a, b) => d(a) - d(b))[0] || null; };
  const atkKey = () => { if (!G) return false; const t = G.t; let o = tgtNow(t); if (!o) { o = nearestRight(t); if (o) G.tgt = o.key; } if (!o) return false;
    if (t - (G.gcd0 == null ? -99 : G.gcd0) < GCD) return false; /* (still cooling down) */
    if (!inRange(o)) { if (!window.__pgAuto) say(rl(me) === 'm' ? 'Too far: get close to it, then press 1.' : 'Too far away: get closer.', true); return false; }
    G.gcd0 = t; hitTgt(o, t); hud(true); return true; };
  const hitTgt = (o, t) => { (G.hitFx = G.hitFx || []).push({ x0: G.x, y0: G.y, x1: o.p[0], y1: o.p[1], r: o.r, t0: t, melee: rl(me) === 'm' });
    const cat = dpsCat(t); G.hits = (G.hits || 0) + 1; G.lastHitT = t; G.lastHitCat = cat && isRight(cat, o) ? cat : null;
    const a = G.adds.find((q) => q.id === o.key); if (a) { a.hp = (a.hp == null ? ADD_HP[a.kind] || 3 : a.hp) - 1; if (a.hp <= 0) { G.adds = G.adds.filter((q) => q !== a); G.kills = (G.kills || 0) + 1; say((a.kind === 'viper' ? 'Viper' : 'Rawling') + ' killed.');
      const c2 = dpsCat(t), nx = c2 ? nearestRight(t) : null; G.tgt = nx && isRight(c2, nx) ? nx.key : null; } } /* (training wheels: after a kill your target moves on to the next one that matters) */
    else if (o.key === 'heart') G.heartHits = (G.heartHits || 0) + 1; else if (P2 && P2.hit) P2.hit(o.key); };
  const atkStep = (t) => { if (window.__pgAuto && dpsCat(t)) atkKey(); }; /* (the autopilot, a careful player, presses 1 as soon as it's ready) */
  const dpsClose = () => { const D = G.dpsM; if (!D || !D.cur) return; const c = D.cur; D.cur = null; if (c.tot < 1.5) return; const fr = c.ok / c.tot; D.list.push({ kind: c.kind, t0: c.t0, fr });
    if (fr < 0.5) G.log.push({ t: c.t0, kind: 'dps', text: DPS_SAY[c.kind][1] + ': you were on ' + (DPS_SAY[c.kind][3] || (c.kind === 'heart' || c.kind === 'viper' ? 'it' : 'them')) + ' ' + Math.round(fr * 100) + '% of the time.', tip: DPS_SAY[c.kind][2] }); };
  const dpsStep = (t, dt) => { const D = G.dpsM = G.dpsM || { list: [], cur: null }, cat = dpsCat(t);
    if (G.tgt && !tgtNow(t)) G.tgt = null;
    if (window.__pgAuto && cat && !onRight(cat, tgtNow(t))) { const o = tgtList(t).filter((q) => isRight(cat, q)).sort((a, b) => pgDist([G.x, G.y], a.p) - pgDist([G.x, G.y], b.p))[0]; if (o) G.tgt = o.key; } /* (the autopilot, a careful player, picks the right thing) */
    if (cat && !G.taught && !window.__pgAuto) { G.taught = true; bigCall(cat === 'heart' ? 'Her heart is open! Press Tab to pick it, then keep pressing 1 to hit it.' : (cat === 'viper' ? 'A Viper! ' : cat === 'wretch' ? 'The Wretch is going down! ' : 'Rawlings! ') + 'Press Tab to pick ' + (cat === 'rawling' ? 'one' : 'it') + ', then keep pressing 1 to hit it.', '#f3c969'); } /* (once a run: how to attack) */
    atkStep(t); if (G.hitFx && G.hitFx.length && t - G.hitFx[0].t0 > 0.5) G.hitFx = G.hitFx.filter((x) => t - x.t0 <= 0.5);
    if (cat !== (D.cur && D.cur.kind)) { dpsClose(); if (cat) D.cur = { kind: cat, t0: t, tot: 0, ok: 0 }; }
    if (D.cur) { D.cur.tot += dt; if (onRight(cat, tgtNow(t))) D.cur.ok += dt; } };
  const cycleTgt = () => { press('tgt'); const L = tgtList(G.t).sort((a, b) => pgDist([G.x, G.y], a.p) - pgDist([G.x, G.y], b.p)); if (!L.length) return; const i = L.findIndex((o) => o.key === G.tgt); G.tgt = L[(i + 1) % L.length].key; hud(true); };
  const pickTgtAt = (p) => { if (!G) return false; const o = tgtList(G.t).filter((q) => pgDist(p, q.p) <= q.r + 1.5).sort((a, b) => pgDist(p, a.p) - pgDist(p, b.p))[0]; if (!o) return false; G.tgt = o.key; hud(true); return true; };
  const dpsView = () => { if (!G) return null; const t = G.t, cat = dpsCat(t), cur = tgtNow(t); return { cat, cur, cd: Math.max(0, GCD - (t - (G.gcd0 == null ? -99 : G.gcd0))), right: cat ? tgtList(t).filter((o) => isRight(cat, o)) : [], inRange: cur ? inRange(cur) : false, ok: cat ? onRight(cat, cur) : false, fx: (G.hitFx || []).map((x) => ({ ...x, age: t - x.t0 })), adds: tgtList(t).filter((o) => o.max) }; };
  const bigCall = (text, c) => { const el = $('.pg-warn'); if (!el) return; el.textContent = text; el.style.color = c || '#fff'; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); };
  const say = (text, bad) => { const f = $('.pg-float'); f.textContent = text; f.className = 'pg-float ' + (bad ? 'bad' : 'ok'); void f.offsetWidth; f.classList.add('in'); };
  const mistake = (kind, text, tip, dmg) => { G.log.push({ t: G.t, kind, text, tip }); hurt(dmg || 0); say(text, true); };
  // (how close the nearest other carrier is to your egg: 0 clear, 1 within 5 yards, 2 within 3.5)
  const eggWarnAt = () => { if (!G || !G.eggs.some((e) => e.who === me && e.state === 'held')) return 0; let dmin = 99; G.eggs.forEach((e) => { if (e.state === 'held' && e.who && e.who !== me) { const b = G.bots[e.who]; if (b) dmin = Math.min(dmin, Math.hypot(b.x - G.x, b.y - G.y)); } }); return dmin < 3.5 ? 2 : dmin < 5 ? 1 : 0; };
  const myEggHeld = () => G.eggs.find((e) => e.who === me && e.state === 'held');
  const hatch = (e, why, tip) => { e.state = 'gone'; e.who = null; G.vipers++; deb('putrid', 20, true); G.adds.push({ kind: 'viper', x: G.x + 1.5, y: G.y - 1, born: G.t }); mistake('viper', why + ': a Viper hatched (Putrid Membrane on the whole raid).', tip, 8);
    if (!window.__pgAuto) bigCall('A Viper hatched! Kill it now: Tab, then keep pressing 1.', '#ff8f87'); }; /* (it stays until you kill it: vipers() below) */

  // ---- the others: where their job puts them right now, then out of the way of anything coming ----
  // (egg carriers stand on their own spots in a bubble or a soak: a ring 6.5 yards out, about 5 yards apart, in the same order every time, so
  // nobody is inside another carrier's 3-yard circle and they walk from the bubble to the soak side by side; the others stand in the middle)
  const CAR8 = Object.keys(PG_UL.eggO);
  const eggsHeldAt = (at) => { const L = Math.max(-1, ...S.eggSets.filter((e) => e.land < at).map((e) => e.land)); return L >= 0 && !S.soaks.some((q) => q.at > L && q.at < at); };
  const spotIn = (ob, id) => { if (!ob || !ob.car || !ob.car.includes(id)) return null;
    if (ob.fb >= 0 && typeof UL_FB !== 'undefined' && UL_FB[ob.fb] && ob.car.indexOf(id) < UL_FB[ob.fb].length) { const u = UL_FB[ob.fb][ob.car.indexOf(id)], q = ob.fb ? pgRot(u, S.rotAt(ob.at) - 90) : ob.m ? ob.m(u) : u; return [ob.p[0] + q[0] * 10, ob.p[1] + q[1] * 10]; } const RC = S._ring = S._ring || new Map(), key = ob.at + ',' + ob.p.join(','); let M = RC.get(key);
    if (!M) { const n = Math.max(5, ob.car.length), D = 2 * Math.PI / n, th = ob.car.map((c) => { const z = S.F(UX_ZONE[c] || UX_HOME[c] || [0, 0], ob.at); return [c, Math.atan2(z[1] - ob.p[1], z[0] - ob.p[0])]; }).sort((a, b) => a[1] - b[1]);
      let sx = 0, sy = 0; th.forEach(([, a], i) => { sx += Math.cos(a - i * D); sy += Math.sin(a - i * D); }); const c0 = Math.atan2(sy, sx); M = new Map(th.map(([c], i) => [c, c0 + i * D])); RC.set(key, M); }
    const a = M.get(id); return [ob.p[0] + Math.cos(a) * 6.5, ob.p[1] + Math.sin(a) * 6.5]; };
  // (the carriers' numbered bubble spots: the team plan's; without one, each carrier takes a free spot round the bubble)
  const fbList = (ek) => { if (!TEAM) return null; const f = TEAM.fb[ek]; return f && f.length ? f : null; };
  const jobOf = (id, t) => { if (P2) return P2.job(id, t); let T = homeOf(id, t), fast = false; const b0 = id === me ? { x: G.x, y: G.y } : G.bots[id], myEgg = G.eggs.find((e) => e.id === id && (e.state === 'floor' || e.state === 'air') && e.land - t < 14);
    // carriers: next to their egg once it's down, onto it when the shell breaks
    if (myEgg && t >= myEgg.land - 1.5) { T = t >= myEgg.shell - 0.4 ? [myEgg.x, myEgg.y] : [myEgg.x - 4.6, myEgg.y + 1]; }
    // the tanks (measured on 20 top kills): her tank in front of her, in her reach for Mother's Wrath, first to the bubbles in the dive; the other soaks the
    // venom beam (all 5 impacts), has the tail and takes the Wretch to the bubbles it holds. At the dive the tank who took the first Mother's Wrath soaks the
    // second beam and goes to the new tail; the other waits at the bubbles, has her, and holds the second Wretch in front of her
    if (id === 't1' || id === 't2') { const hers = S.herTank(t) === id, wr = S.wrath.find((q) => q.tank === id && t >= q.t0 && t <= q.at + 3.2), bm = !hers && S.beams.find((b) => b.tank === id && t <= b.t1), nb = S.bubbles.find((q) => q.tank === id && q.at >= t && q.at - t <= 11);
      if (hers) T = wr ? wr.p.slice() : t >= S.dive.t0 && t < S.dive.surf + 2 ? pgRot([0, 39], S.ROT) : S.F([0, 34], t);
      else { T = bm ? bm.at.slice() : nb ? [nb.p[0] - 2, nb.p[1] + 1] : S.FT([-31, 3], t); if (bm || nb) fast = true; } }
    // the next bubble, or your own coil slam, whichever comes first
    // (they leave in time: once it's cast, and sooner the farther they are, at about 8 yards a second plus a margin)
    const due = (at, p, from) => at >= t && t >= from && at - t <= Math.max(4.6, pgDist([b0.x, b0.y], p) / 8 + 1.6);
    let ob = null; for (const q of S.bubbles) if (id !== 't1' && id !== 't2' && ((q.stack && t >= q.stack && t <= q.at) || due(q.at, q.p, q.t0 - 2)) && (!ob || q.at < ob.at)) { const w = S.wretches.find((z) => z.id === q.w); if (w && t < w.dies) { const ek = S.bubbles.filter((z) => eggsHeldAt(z.at)).indexOf(q), fb = ek >= 0 ? fbList(ek) : null; ob = { at: q.at, p: q.p, m: q.m, r: 5.5, car: eggsHeldAt(q.at) ? (fb ? fb.concat(CAR8.filter((c) => !fb.includes(c))) : CAR8) : null, fb: fb ? ek : -1 }; } }
    for (const s of S.soaks) if (s.group.includes(id) && due(s.at, [s.x, s.y], s.cast - 0.5) && (!ob || s.at < ob.at)) ob = { at: s.at, p: [s.x, s.y], r: 5, car: CAR8.filter((c) => s.group.includes(c)) };
    if (ob) { const sp = spotIn(ob, id); if (sp) T = sp; else { const ix = GDZ_RAID.indexOf(id), a = ix * 2.39996, rr = (ob.car ? 3.2 : ob.r) * Math.sqrt(((ix % 11) + 0.5) / 11); T = [ob.p[0] + Math.cos(a) * rr, ob.p[1] + Math.sin(a) * rr]; } const dT = pgDist(T, [b0.x, b0.y]); fast = dT > 10 || (ob.at - t < 2.5 && dT > 1.5); } /* (hurry when it's close: from a far bubble spot to the coil a second later) */
    // her waves: on the half that goes second, then behind the first wave into the half it just left
    const wg = S.wings.find((w) => t >= w.t + 1 && t <= w.t + 16); if (wg && id !== S.herTank(t)) { const rot = S.rotAt(wg.t + 6), q = pgRot(T, -rot), side = wg.west ? 1 : -1, fw = S.waves.find((w) => w.kind === 'her' && Math.abs(w.t0 - (wg.t + 6)) < 0.1);
      const front = fw ? 46 - fw.v * Math.max(0, t - fw.t0) : 46, crossed = t > wg.t + 6 && front < Math.min(q[1], 26) - 5, lx = Math.max(6, Math.min(18, Math.abs(q[0]) + 4)) * (crossed ? -side : side);
      if (t <= wg.t + 6 + 6.5 + 4) { T = pgRot([lx, Math.max(-26, Math.min(24, q[1]))], rot); fast = true; } }
    // the tail's sweep: out of its 35 yards before it lands (its tank too)
    for (const th of S.thrash) if (t >= th.t0 - 0.5 && t <= th.at) { const dd = pgDist(T, [th.x, th.y]); if (dd < 38.5) { const a = Math.atan2(T[1] - th.y, T[0] - th.x); T = [th.x + Math.cos(a) * 40, th.y + Math.sin(a) * 40]; if (!onPlat(T[0], T[1])) T = nearEdge(T[0], T[1]); fast = true; } }
    // her reach in Mother's Wrath: her tank only
    for (const wr of S.wrath) if (t >= wr.t0 && t <= wr.at + 3.2 && id !== wr.tank && pgDist(T, wr.p) < 8) { const a = Math.atan2(T[1] - wr.p[1], T[0] - wr.p[0]); T = [wr.p[0] + Math.cos(a) * 9, wr.p[1] + Math.sin(a) * 9]; }
    // coil circles that aren't yours: stay out
    // (a soak of yours coming, its coils not out yet: wait on her tail's side of the middle (the tail is up before its coils), close enough to reach either circle)
    if (!ob) { const ns = S.soaks.find((q) => q.group.includes(id) && q.at > t && q.at - t <= 12 && t < q.cast - 0.5); if (ns && id !== 't1' && id !== 't2') { const A = S.FT([-17, 0], ns.at), d0 = pgDist(T, A); if (d0 > 7) T = [A[0] + (T[0] - A[0]) * 7 / d0, A[1] + (T[1] - A[1]) * 7 / d0]; } }
    for (const s of S.soaks) if (t >= s.t0 && t <= s.at && !s.group.includes(id) && !(ob && ob.at < s.at - 0.3) && pgDist(T, [s.x, s.y]) < 11.5) { const a = Math.atan2(T[1] - s.y, T[0] - s.x); T = [s.x + Math.cos(a) * 12.5, s.y + Math.sin(a) * 12.5]; }
    if (!onPlat(T[0], T[1])) T = nearEdge(T[0], T[1]);
    return { T, fast, ob }; };
  const dodge = (b, T, t, fast, ob) => { if (P2 && !P2.dodges) return { T, fast }; /* (phase 2 dodges in its own job: src/practice-p2.js; phase 3 asks for this one: src/practice-p3.js) */ const act = S.waves.filter((w) => w.t1 >= t && w.t0 <= t + Math.max(1.5, w.warn || 0) && !(w.kind === 'incub' && b.id === w.tank) && w.from !== b.id);
    const imps = S.impacts.filter((m) => m.at >= t && m.at - t <= 2.4).concat(G.eggs.filter((e) => e.state === 'air' && e.land >= t && e.land - t <= 2.4).map((e) => ({ x: e.x, y: e.y, r: 4, at: e.land })),
      b.id === 't1' || b.id === 't2' ? [] : S.soaks.filter((q) => !q.group.includes(b.id) && t >= q.t0 && q.at >= t && q.at - t <= 2.4).map((q) => ({ x: q.x, y: q.y, r: q.r, at: q.at, mg: 0.5 })));
    if (!act.length && !imps.length) { b.esc = null; return { T, fast }; }
    const bad = (x, y, k) => act.some((w) => inWave(w, t + k, x, y, 1.4)) || imps.some((m) => m.at >= t + k - 0.2 && m.at <= t + k + 0.9 && Math.hypot(x - m.x, y - m.y) <= m.r + (m.mg != null ? m.mg : 1.4));
    // (a path is judged at the speed they'll really walk it: the bots run 1.4 times as fast to escape or when far, the autopilot walks; firstBad: how soon it meets something)
    const KS = [0, 0.1, 0.2, 0.35, 0.5, 0.7, 0.9, 1.15, 1.4, 1.8, 2.2, 2.6], firstBad = (x1, y1, sp) => { const dd = Math.hypot(x1 - b.x, y1 - b.y); for (const k of KS) { const f = dd > 0 ? Math.min(1, sp * k / dd) : 0; if (bad(b.x + (x1 - b.x) * f, b.y + (y1 - b.y) * f, k)) return k; } return Infinity; }, path = (x1, y1, sp) => firstBad(x1, y1, sp) < Infinity;
    const vEsc = b.id === me ? SPEED : SPEED * 1.4, vT = b.id === me ? SPEED : SPEED * (fast || Math.hypot(T[0] - b.x, T[1] - b.y) > 15 ? 1.4 : 1);
    if (!path(T[0], T[1], vT)) { b.esc = null; return { T, fast }; }
    // (an escape spot: not in a soak that isn't theirs, and with an egg not next to another carrier)
    const held = G.eggs.some((e) => e.who === b.id && e.state === 'held'), others = held ? G.eggs.filter((e) => e.state === 'held' && e.who && e.who !== b.id).map((e) => (e.who === me ? { x: G.x, y: G.y } : G.bots[e.who])) : [];
    const unsafe = (x, y) => S.soaks.some((q) => !q.group.includes(b.id) && q.at >= t && q.at - t <= 3.5 && Math.hypot(x - q.x, y - q.y) <= q.r + 1.2) || others.some((o) => Math.hypot(x - o.x, y - o.y) < 4);
    if (b.esc && t - b.esc.t < 2 && !path(b.esc.x, b.esc.y, vEsc) && !unsafe(b.esc.x, b.esc.y) && !(P2 && P2.walk && !P2.walk(b.x, b.y, b.esc.x, b.esc.y))) return { T: [b.esc.x, b.esc.y], fast: true };
    // (no clean spot: the one that meets the danger latest, rather than walking on into it)
    let best = null, bd = Infinity, late = null, lk = firstBad(T[0], T[1], vT); const keepIn = ob && ob.at - t <= 3.5; /* (a bubble or their soak due: dodge inside it first) */
    for (let pass = keepIn ? 0 : 1; pass < 2 && !best; pass++) for (const rr of (pass === 0 ? [0, 2.5, 5, 7, 8.6, -1, -2, -3] : [2, 3.5, 5.5, 8, 11, 14])) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, o = pass === 0 && rr >= 0 ? ob.p : [b.x, b.y], r0 = Math.abs(rr), x = o[0] + Math.cos(a) * r0, y = o[1] + Math.sin(a) * r0; if (!onPlat(x, y) || (pass === 0 && Math.hypot(x - ob.p[0], y - ob.p[1]) > (ob.r === 5 ? 9.2 : 9.2)) || unsafe(x, y) || (P2 && P2.walk && !P2.walk(b.x, b.y, x, y))) continue; /* (P2.walk: phase 3's broken floor, src/practice-p3.js: never an escape across the venom) */ const fk = firstBad(x, y, vEsc); if (fk < Infinity) { if (fk > lk) { lk = fk; late = [x, y]; } continue; } const dd = Math.hypot(x - T[0], y - T[1]) + Math.hypot(x - b.x, y - b.y) * 0.4; if (dd < bd) { bd = dd; best = [x, y]; } }
    if (best) { b.esc = { x: best[0], y: best[1], t }; return { T: best, fast: true }; } if (late) return { T: late, fast: true }; return { T, fast }; };
  const moveBots = (t, dt) => { const pre = {}; if (myEggHeld()) GDZ_RAID.forEach((id) => { if (id !== me) pre[id] = Math.hypot(G.bots[id].x - G.x, G.bots[id].y - G.y); });
    GDZ_RAID.forEach((id) => { if (id === me) return; const b = G.bots[id]; const j = jobOf(id, t); let { T, fast } = j; ({ T, fast } = dodge(b, T, t, fast, j.ob));
      const dx = T[0] - b.x, dy = T[1] - b.y, dd = Math.hypot(dx, dy), sp = SPEED * (fast || dd > 15 ? 1.4 : 1) * dt * (P2 ? P2.slow(id, t) : 1); if (dd > sp) { b.x += dx / dd * sp; b.y += dy / dd * sp; } else { b.x = T[0]; b.y = T[1]; } });
    // carriers keep out of each other's 3-yard circles; nobody walks into yours (if you walk into theirs, that's yours)
    const car = G.eggs.filter((e) => e.state === 'held' && e.who && e.who !== me).map((e) => G.bots[e.who]); for (let it = 0; it < 2; it++) { for (let i = 0; i < car.length; i++) for (let j = i + 1; j < car.length; j++) { const a = car[i], c = car[j], ex = c.x - a.x, ey = c.y - a.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.6) { const pu = (3.6 - ee) / 2; a.x -= ex / ee * pu; a.y -= ey / ee * pu; c.x += ex / ee * pu; c.y += ey / ee * pu; } }
      if (myEggHeld() && window.__pgAuto) for (const c of car) { const ex = G.x - c.x, ey = G.y - c.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.6) { const nx = ex / ee, ny = ey / ee; G.x = c.x + nx * 3.6; G.y = c.y + ny * 3.6; if (target) { const tx = target[0] - G.x, ty = target[1] - G.y; if (tx * nx + ty * ny < 0) { const sd = tx * -ny + ty * nx >= 0 ? 1 : -1, d = SPEED * dt * 0.8; G.x -= ny * sd * d; G.y += nx * sd * d; } } } } /* (the autopilot, a careful player, steps round other carriers: out of their circle, and along its edge when they stand in the way) */
      if (myEggHeld()) for (const c of car) { const ex = c.x - G.x, ey = c.y - G.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.6 && (G.still || (pre[c.id] == null ? 9 : pre[c.id]) >= 3.6)) { c.x = G.x + ex / ee * 3.6; c.y = G.y + ey / ee * 3.6; } } }
    // the Wretches follow
    S.wretches.forEach((w) => { const p = wretchAt(w, t); if (!p) { delete G.wr[w.id]; return; } const c = G.wr[w.id]; if (!c) { G.wr[w.id] = { x: p[0], y: p[1] }; return; } const ex = p[0] - c.x, ey = p[1] - c.y, ee = Math.hypot(ex, ey), sp = 9 * dt; if (ee > sp) { c.x += ex / ee * sp; c.y += ey / ee * sp; } else { c.x = p[0]; c.y = p[1]; } }); };

  // ---- one step of the fight ----
  const step1 = (dt) => { const t0 = G.t, t = Math.min(S.end, G.t + dt), px = G.x, py = G.y;
    if (G.kb) { const k = Math.min(1, (t - G.kb.t0) / 0.55); G.x = G.kb.x0 + (G.kb.x1 - G.kb.x0) * k; G.y = G.kb.y0 + (G.kb.y1 - G.kb.y0) * k; if (k >= 1) G.kb = null; }
    else { if (window.__pgAuto) { const j = jobOf(me, t), ab = { id: me, x: G.x, y: G.y, esc: G.autoEsc }, dz = dodge(ab, j.T, t, j.fast, j.ob); G.autoEsc = ab.esc; target = dz.T; }
      let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), my = (keys.u ? 1 : 0) - (keys.d ? 1 : 0);
      if (v3 && (mx || my)) { const f = v3.fwd(); [mx, my] = [mx * f[1] + my * f[0], my * f[1] - mx * f[0]]; } /* (3D: W walks where the camera looks, A and D to its sides) */
      const byKeys = !!(mx || my);
      if (!byKeys && target) { const ex = target[0] - G.x, ey = target[1] - G.y, ee = Math.hypot(ex, ey); if (ee < 0.2) target = null; else { mx = ex / ee; my = ey / ee; } }
      const mm = Math.hypot(mx, my); if (mm > 1) { mx /= mm; my /= mm; } let sp = SPEED * (has('sprint') ? 1.4 : 1) * (inVenom(G.x, G.y) ? 0.6 : 1) * dt * (P2 ? P2.slow(me, t) : 1);
      if (!byKeys && target) sp = Math.min(sp, Math.hypot(target[0] - G.x, target[1] - G.y));
      const nx = G.x + mx * sp, ny = G.y + my * sp; if (onPlat(nx, ny) || inVenom(G.x, G.y)) { G.x = nx; G.y = ny; } else if (onPlat(nx, G.y)) G.x = nx; else if (onPlat(G.x, ny)) G.y = ny; }
    G.still = !G.kb && Math.hypot(G.x - px, G.y - py) < 1e-4; G.t = t; moveBots(t, dt); check(t0, t);
    G.bossHp = P2 ? P2.bossHp(t) : Math.max(52, 100 - 30 * Math.min(1, t / 139) - (t > 145.5 ? 14 * Math.min(1, (t - 145.5) / 19.5) : 0) - Math.min(4, (G.heartHits || 0) * 0.12)); /* (your hits on the heart take her down a little faster) */ };
  const check = (t0, t) => { const x = G.x, y = G.y, crossed = (at) => at > t0 && at <= t;
    // waves: a hit is huge stacking poison; an egg it touches hatches (in your hands or on the floor)
    S.waves.forEach((w, i) => { if (G.done.has('w' + i) || w.from === me || !inWave(w, t, x, y)) return; /* (w.from: a wave sent by a raider, phase 3's Volatile Purge, never hits them) */ G.done.add('w' + i); deb('venom', 10, true); mistake(w.ring ? 'ring' : 'wave', w.name + ' hit you.', w.tip, 28); const e = myEggHeld(); if (e) hatch(e, 'A wave touched your egg', 'Carrying an egg, a wave hatches it: dodge every one.'); });
    G.eggs.forEach((e) => { if (e.id === me && e.state === 'floor' && S.waves.some((w) => inWave(w, t, e.x, e.y))) hatch(e, 'Your egg was still on the floor when a wave reached it', 'Pick your egg up as soon as its shell breaks.'); });
    // impacts: the Womb, the debris
    S.impacts.forEach((m) => { if (crossed(m.at) && Math.hypot(x - m.x, y - m.y) <= m.r + PR * 0.5) mistake('impact', m.name + ' landed on you.', m.tip, m.dmg); });
    // (the venom beam, from the image to the off tank: a raider in its line takes it, the wipe of Wolfthorn's pull 1)
    (S.beams || []).forEach((bm, bi) => { if (P2 || t < bm.t0 || t > bm.t1 || G.done.has('beam' + bi)) return; const ax = bm.from[0], ay = bm.from[1], tk = G.bots[bm.tank] || { x: bm.at[0], y: bm.at[1] }, vx = tk.x - ax, vy = tk.y - ay, L2 = vx * vx + vy * vy || 1, u = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / L2));
      if (Math.hypot(x - (ax + vx * u), y - (ay + vy * u)) <= 1.6) { G.done.add('beam' + bi); mistake('beam', 'You stood in the venom beam: only the off tank stands in it.', 'The spectral image beams the off tank: keep out of the line between them.', 35); } });
    // the eggs land (4 yards), their shells break, carriers pick theirs up
    G.eggs.forEach((e) => { if (e.state === 'air' && t >= e.land) { e.state = 'floor'; if (Math.hypot(x - e.x, y - e.y) <= 4 + PR * 0.5) mistake('impact', 'An egg landed on you.', 'Eggs fall in 4-yard circles: step out of them.', 25); }
      if (e.state === 'floor' && e.id !== me && t >= e.shell + 0.3) { const b = G.bots[e.id]; if ((b && Math.hypot(b.x - e.x, b.y - e.y) < 2.5) || t > e.shell + 6) { e.state = 'held'; e.who = e.id; } }
      if (e.state === 'floor' && e.id === me && Math.hypot(x - e.x, y - e.y) <= 2.2) { if (t < e.shell) { if (!G.done.has('sh' + e.set)) { G.done.add('sh' + e.set); say(e.lock || 'Its shell isn\'t broken yet: wait a moment.'); } } else { if (has('yolk')) mistake('yolk', 'You picked up an egg with Rancid Yolk on you.', 'Rancid Yolk lasts 20 s after your egg breaks: let it drop first.', 15); e.state = 'held'; e.who = me; say('Egg picked up: keep it out of every wave and away from other carriers.'); if (!G.eggTaught) { G.eggTaught = true; bigCall('This ring is your egg\'s 3 yards. Another carrier inside it hatches a Viper.', '#3af2a8'); } } }
      if (e.state === 'floor' && e.id === me && !G.done.has('left' + e.set)) { const sk = S.soaks.find((s) => s.at > e.land && s.group.includes(me)); if (sk && t > sk.at) { G.done.add('left' + e.set); mistake('egg', 'You never picked up your egg.', 'Your egg lands in your zone (the gold circle): pick it up once the shell breaks.', 0); } } });
    // another carrier inside your 3-yard circle: Noxious Splash, it hatches at once
    const mine = myEggHeld(); if (mine && !G.still) G.eggs.forEach((e) => { if (e.state !== 'held' || !e.who || e.who === me || !mine || mine.state !== 'held') return; const b = G.bots[e.who]; if (b && Math.hypot(x - b.x, y - b.y) < 3) { const wn = nm(e.who); deb('splash', 10); hurt(30); e.state = 'gone'; e.who = null; G.vipers++; G.adds.push({ kind: 'viper', x: b.x + 1, y: b.y + 1, born: t }); /* (both eggs burst: two Vipers, Nov 15 audit) */ hatch(mine, wn + ' (carrying too) came inside your 3-yard circle: both eggs hatched', 'Two carriers within 3 yards: Noxious Splash bursts both eggs. Keep your circle clear.'); } });
    // the coil slams: shared by everyone within 10 yards; carried eggs break; Soul Constrictor 5 s
    S.soaks.forEach((s) => { if (!crossed(s.at)) return; const n = 1 + GDZ_RAID.filter((id) => id !== me && Math.hypot(G.bots[id].x - s.x, G.bots[id].y - s.y) <= s.r).length, inn = Math.hypot(x - s.x, y - s.y) <= s.r;
      if (inn) { if (has('soul')) mistake('soul', 'Soul Constrictor: you took the slam before, so you couldn\'t help with this one.', 'Take only your own slam; the next one is the other group\'s.', 25);
        else { hurt(slamHit(n)); const e = myEggHeld(); if (e) { e.state = 'gone'; e.who = null; deb('yolk', 20); G.adds.push({ kind: 'rawling', x: x + 1.2, y: y + 1.2, born: t }); say('Soaked: your egg broke (a Rawling). Rancid Yolk for 20 s.'); } else say('Soaked.'); } deb('soul', 5); }
      else { hurt(slamHit(n)); if (s.group.includes(me)) mistake('soak', 'You missed your coil soak (slam ' + (s.k + 1) + '): the others took more.', 'Be inside your group\'s 10-yard circle when it slams.', 0); } /* (every slam hits the whole raid: the soakers only make it smaller, Nov 15 audit) */
      G.eggs.forEach((e) => { if (e.state === 'held' && e.who && e.who !== me && Math.hypot(G.bots[e.who].x - s.x, G.bots[e.who].y - s.y) <= s.r) { e.state = 'gone'; G.adds.push({ kind: 'rawling', x: G.bots[e.who].x + 1, y: G.bots[e.who].y + 1, born: t }); e.who = null; } }); });
    // the bubbles: everyone farther than 10 yards from the Wretch is hit
    S.bubbles.forEach((q) => { if (!crossed(q.at)) return; const c = G.wr[q.w]; if (c && Math.hypot(x - c.x, y - c.y) > 10) { deb('fester', 12); mistake('fester', 'Fester Burst: you were outside the Wretch\'s bubble.', 'Be within 10 yards of the Wretch when Fester Burst goes off.', 40); } });
    // the tail's sweep: 35 yards, a big hit and a knockback
    S.thrash.forEach((th) => { if (!crossed(th.at)) return; const dd = Math.hypot(x - th.x, y - th.y); hurt(15); deb('thrash', 10); /* (everyone takes the sweep's hit and its DoT, Nov 15 audit) */
      if (dd <= th.r) { mistake('thrash', 'Mephitic Thrash: you were inside her tail\'s 35 yards.', 'Run out of 35 yards from her tail during the cast.', 30); { const e = myEggHeld(); if (e) hatch(e, 'Mephitic Thrash hit your egg inside her tail\'s 35 yards', 'Carrying an egg, get out of 35 yards from her tail before the sweep.'); } const a = Math.atan2(y - th.y, x - th.x); G.kb = { t0: t, x0: x, y0: y, x1: th.x + Math.cos(a) * (dd + 14), y1: th.y + Math.sin(a) * (dd + 14) }; } });
    // Mother's Wrath: five bites in her reach
    S.wrath.forEach((wr) => { for (let k = 0; k < 5; k++) { if (crossed(wr.at + k * 0.6) && Math.hypot(x - wr.p[0], y - wr.p[1]) <= 5 + PR) mistake('bite', 'Mother\'s Wrath bit you: you were in her reach.', 'Only her tank stands in the red circle in front of her.', 30); } });
    // the venom off the platform: it hurts, and it hatches a carried egg
    if (inVenom(x, y)) { hurt(10 * (t - t0)); const e = myEggHeld(); if (e) hatch(e, 'You went into the venom with your egg', 'The water off the platform hatches eggs: stay on the stone.'); if (!G.done.has('venom' + Math.floor(t / 10))) { G.done.add('venom' + Math.floor(t / 10)); G.log.push({ t, kind: 'venom', text: 'You were in the venom off the platform.', tip: 'Stay on the stone.' }); } }
    // raid damage in the heart burn, and what's on you
    S.pulses.forEach((p) => { if (crossed(p)) hurt(6); });
    const dps = (has('venom') ? 3.5 * G.debs.venom.n : 0) + (myEggHeld() ? (has('yolk') ? 3.6 : 1.2) : 0) + (has('fester') ? 3 : 0) + (has('putrid') ? 1.2 * G.debs.putrid.n : 0) + (has('splash') ? 5 : 0) + (has('thrash') ? 1.5 : 0) + 2 * G.adds.filter((a) => a.boil && !a.own && a.born != null && G.t - a.born >= 35).length; /* (a Rawling's Acidic Expulsion on the raid, from 35 s after it spawns: measured 35.3 to 35.6 s on the 30 fastest kills, phase 2 chat Nov 15; a part's own adds run their own) */
    vipers(t0, t, x, y); addsStep(t0, t);
    G.hp -= dps * (t - t0) * (has('def') ? 0.5 : 1); G.hp = Math.min(100, G.hp + (has('sting') ? 0 : 5.5) * (t - t0)); /* (Petrifying Sting: no healing on you while it lasts) */
    if (P2) P2.check(t0, t);
    G.adds = G.adds.filter((a) => a.t1 == null || t < a.t1); dpsStep(t, t - t0); };
  // (the audit of Nov 15, Flex: "theres also add spawns being missed ... in all phases": adds left on their own after a few seconds. Now an add with no
  // t1 stays until it dies, and the raid helps: the other 19 wear down the oldest Rawling (about one hit a second between them) and join on a Viper after
  // 4 s. A Rawling alive 25 s boils (Mythic: Boiling Venom 1313757, +100% haste and damage, and Acidic Expulsion on the raid: a tick on you while it lives).
  // Every part uses this: a part's own adds only need born instead of t1)
  const slamHit = (n) => Math.max(6, Math.round(80 / n));
  const addsStep = (t0, t) => { const dt = t - t0; if (!(dt > 0) || !G.adds.length) return; const hp = (a) => (a.hp == null ? (a.hp = ADD_HP[a.kind] || 3) : a.hp);
    const raws = G.adds.filter((a) => a.kind === 'rawling' && a.born != null && !a.own).sort((p, q) => p.born - q.born); if (raws.length) { const a = raws[0]; a.hp = hp(a) - 1.1 * dt; }
    G.adds.forEach((a) => { if (a.own) return; /* (a part that runs its own adds marks them own: phase 2's Rawlings, Nov 15) */ if (a.kind === 'viper' && t - (a.born == null ? t : a.born) >= 4) a.hp = hp(a) - 0.35 * dt;
      if (a.kind === 'rawling' && a.born != null && !a.boil && t - a.born >= 25) { a.boil = true; if (!G.done.has('boil')) { G.done.add('boil'); G.log.push({ t, kind: 'boil', text: 'A Rawling lived 25 s and boiled (Boiling Venom: twice as fast and strong).', tip: 'Kill Rawlings within 25 s: press Tab to pick one, then keep pressing 1.' }); } if (!window.__pgAuto) say('A Rawling boiled: kill it!', true); } });
    if (G.adds.some((a) => a.hp != null && a.hp <= 0)) G.adds = G.adds.filter((a) => !(a.hp != null && a.hp <= 0)); };
  // (Flex, Nov 15: "If a viper spawns though it needs to be killed", "it shouldnt just vanish": a Viper no longer leaves after 8 s; it stays until you kill it.
  // The guide: a Viper is deadly, kill it at once; its Petrifying Sting is a big heal absorb. So it crawls to you and stings you every 3 s while it's close:
  // a little damage, and no healing on you while the sting lasts, stacking. Ignore it and it wears you down)
  const vipers = (t0, t, x, y) => { G.adds.forEach((a) => { if (a.kind !== 'viper') return; const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy);
    if (d > 1.8) { const m = Math.min(d - 1.8, 6 * (t - t0)); a.x += dx / d * m; a.y += dy / d * m; }
    const last = a.sting == null ? (a.born == null ? t0 : a.born) : a.sting; if (d <= 3.2 && t - last >= 3) { a.sting = t; G.lastSting = t; hurt(8); deb('sting', 6, true); if (!window.__pgAuto) say('Petrifying Sting: kill the Viper!', true); } }); };

  // ---- drawing ----
  const W2S = (x, y) => [cv.width / 2 + (x - cam[0]) * Z * dpr, cv.height / 2 - (y - cam[1]) * Z * dpr];
  const draw = () => { if (v3) { v3.draw(G.t); if (v3) { miniMap2(G.t); return; } } /* (the 3D view draws instead: src/practice3d.js) */ if (P2) { P2.draw2d(cx, cv); miniMap2(G.t); return; } /* (a later part is 3D only, Flex) */ const rect = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); const Wd = Math.max(1, Math.round(rect.width * dpr)), Hd = Math.max(1, Math.round(rect.height * dpr)); if (cv.width !== Wd || cv.height !== Hd) { cv.width = Wd; cv.height = Hd; }
    const t = G.t, k = Z * dpr; if (!cam) cam = [G.x, G.y]; cam = [cam[0] + (G.x - cam[0]) * 0.18, cam[1] + (G.y - cam[1]) * 0.18];
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#07090c'; cx.fillRect(0, 0, cv.width, cv.height);
    const room = IMG.room; if (ok(room)) { const [sx, sy] = W2S(-PG_UL.artW / 2, PG_UL.artY + PG_UL.artH / 2); cx.drawImage(room, sx, sy, PG_UL.artW * k, PG_UL.artH * k); }
    const P = W2S, circ = (x, y, r, fill, stroke, lw, dash) => { const [sx, sy] = P(x, y); cx.beginPath(); cx.arc(sx, sy, Math.max(0.5, r * k), 0, Math.PI * 2); if (fill) { cx.fillStyle = fill; cx.fill(); } if (stroke) { cx.setLineDash((dash || []).map((v) => v * dpr)); cx.lineWidth = (lw || 2) * dpr; cx.strokeStyle = stroke; cx.stroke(); cx.setLineDash([]); } };
    const label = (x, y, text, color, size, dy) => { const [sx, sy] = P(x, y); cx.font = '700 ' + Math.round((size || 12) * dpr) + 'px system-ui, sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 3 * dpr; cx.strokeStyle = 'rgba(0,0,0,.85)'; cx.strokeText(text, sx, sy + (dy || 0) * dpr); cx.fillStyle = color || '#fff'; cx.fillText(text, sx, sy + (dy || 0) * dpr); };
    { const hv = halvesAt(t); if (hv) { const [dx, dy] = hv.d, half = (sg) => { const c = [[0, 0], [dx * 60 * sg, dy * 60 * sg]]; const px = -dy, py = dx; return [[c[0][0] + px * 60, c[0][1] + py * 60], [c[1][0] + px * 60, c[1][1] + py * 60], [c[1][0] - px * 60, c[1][1] - py * 60], [c[0][0] - px * 60, c[0][1] - py * 60]]; };
        [[hv.red, 'rgba(255,70,50,.2)'], [-hv.red, 'rgba(90,230,120,.17)']].forEach(([sg, col]) => { const q = half(sg).map((p) => P(p[0], p[1])); cx.beginPath(); q.forEach((p, i) => (i ? cx.lineTo(p[0], p[1]) : cx.moveTo(p[0], p[1]))); cx.closePath(); cx.fillStyle = col; cx.fill(); }); } }
    // ground: the thrash zone, her reach, coil circles (yours gold), bubbles, impacts, the beam
    S.thrash.forEach((th) => { if (t >= th.t0 && t <= th.at + 0.4) { const f = Math.min(1, (t - th.t0) / (th.at - th.t0)); circ(th.x, th.y, th.r, 'rgba(255,140,60,' + (0.06 + 0.1 * f).toFixed(3) + ')', 'rgba(255,155,74,.9)', 2.5, [10, 6]); if (t > th.at) circ(th.x, th.y, th.r, 'rgba(255,120,40,.35)'); } });
    S.wrath.forEach((wr) => { if (t >= wr.t0 && t <= wr.at + 3.2) circ(wr.p[0], wr.p[1], 5, 'rgba(255,60,60,.22)', '#ff4a4a', 2); });
    S.soaks.forEach((s) => { if (t >= s.t0 && t <= s.at + 0.5) { const mineS = s.group.includes(me), f = Math.min(1, (t - s.t0) / (s.at - s.t0)); circ(s.x, s.y, s.r, 'rgba(36,242,203,' + (t > s.at ? 0.4 : 0.08) + ')', mineS ? '#f3c969' : '#24f2cb', mineS ? 3.5 : 2, mineS ? [12, 6] : null); circ(s.x, s.y, s.r * f, null, 'rgba(36,242,203,.7)', 1.5); label(s.x, s.y, mineS ? 'YOUR SOAK' : 'Soak ' + (s.k + 1), mineS ? '#f3c969' : '#24f2cb', 13); } });
    S.bubbles.forEach((q) => { const c = G.wr[q.w]; if (c && t >= q.t0 && t <= q.at + 0.4) { const f = Math.min(1, (t - q.t0) / (q.at - q.t0)), [sx, sy] = P(c.x, c.y), g = cx.createRadialGradient(sx, sy, 0, sx, sy, 10 * k); g.addColorStop(0, 'rgba(216,242,47,.04)'); g.addColorStop(0.85, 'rgba(216,242,47,' + (0.1 + 0.14 * f).toFixed(3) + ')'); g.addColorStop(1, 'rgba(216,242,47,' + (0.25 + 0.2 * f).toFixed(3) + ')');
      cx.fillStyle = g; cx.beginPath(); cx.arc(sx, sy, 10 * k, 0, Math.PI * 2); cx.fill(); circ(c.x, c.y, 10, null, '#d8f22f', 2.5); circ(c.x, c.y, 10 * (1 - f), null, 'rgba(216,242,47,.55)', 1.5); if (t > q.at) circ(c.x, c.y, 10, 'rgba(216,242,47,.45)'); label(c.x, c.y, 'Into the bubble · ' + Math.max(0, q.at - t).toFixed(1), '#e8ff6a', 13, 10 * k / dpr + 16); } });
    S.impacts.forEach((m) => { if (t >= m.t0 && t <= m.at + 0.3) { const f = Math.min(1, (t - m.t0) / (m.at - m.t0)); circ(m.x, m.y, m.r, 'rgba(200,163,106,.16)', m.color, 2); circ(m.x, m.y, m.r * f, 'rgba(255,90,60,.25)'); } });
    G.eggs.forEach((e) => { if (e.state === 'air' && t >= e.land - 2.5) { const f = Math.min(1, (t - e.land + 2.5) / 2.5); circ(e.x, e.y, 4, 'rgba(230,224,200,.12)', '#e6e0c8', 1.6); circ(e.x, e.y, 4 * f, 'rgba(255,90,60,.22)'); } });
    S.beams.forEach((b) => { if (t >= b.t0 && t <= b.t1) { const [ax, ay] = P(b.from[0], b.from[1]), tk = G.bots[b.tank] || G.bots.t2, [bx, by] = P(tk.x, tk.y); cx.lineWidth = 6 * dpr; cx.strokeStyle = 'rgba(58,242,168,.55)'; cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(bx, by); cx.stroke(); } if (t >= b.t0 - 1 && t <= b.t1) { circ(b.from[0], b.from[1], 3, 'rgba(58,242,168,.25)', '#3af2a8', 2); label(b.from[0], b.from[1], 'Spectral Ula\'tek', '#3af2a8', 12, -18); } });
    S.tails.forEach((q) => { if (t >= q.t0 && t <= q.at + 0.6) { circ(q.x, q.y, 3, 'rgba(255,90,58,.35)', '#ff5a3a', 2); label(q.x, q.y, 'Tail', '#ff8a6a', 11, -14); } });
    if (t >= S.dive.gone && t < S.dive.surf) { const p = S.dive.to; circ(p[0], p[1], 5, 'rgba(127,216,255,.25)', '#7fd8ff', 2, [6, 4]); label(p[0], p[1], 'Bubbles', '#7fd8ff', 12, -16); }
    // waves: rows of crescents (hers and the beam's), rings of crescents (the small tails)
    const cres = (Cx, Cy, ux, uy, f0, a0, b0, op) => { const zc = (a0 + b0) / 2, hz = (b0 - a0) / 2, bul = Math.min(3.6, 0.8 + hz * 0.7), th = Math.min(2.2, 0.8 + hz * 0.4), Q = (s1, s2) => P(Cx + ux * s1 - uy * s2, Cy + uy * s1 + ux * s2);
      const p1 = Q(f0, a0), c1 = Q(f0 + 2 * bul, zc), p2 = Q(f0, b0), c2 = Q(f0 + 2 * (bul - th), zc); cx.beginPath(); cx.moveTo(p1[0], p1[1]); cx.quadraticCurveTo(c1[0], c1[1], p2[0], p2[1]); cx.quadraticCurveTo(c2[0], c2[1], p1[0], p1[1]); cx.closePath();
      cx.globalAlpha = op; cx.fillStyle = '#9be13a'; cx.fill(); cx.lineWidth = 1.4 * dpr; cx.strokeStyle = '#06260e'; cx.stroke(); cx.globalAlpha = 1; };
    S.waves.forEach((w) => { if (w.warn && t >= w.t0 - w.warn && t < w.t0) { const a = w.deg * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), Q = (s1, s2) => P(w.x + ux * s1 - uy * s2, w.y + uy * s1 + ux * s2), c = [Q(-2.5, -w.w / 2), Q(2.5, -w.w / 2), Q(2.5, w.w / 2), Q(-2.5, w.w / 2)];
        cx.beginPath(); cx.moveTo(c[0][0], c[0][1]); c.slice(1).forEach((q) => cx.lineTo(q[0], q[1])); cx.closePath(); cx.fillStyle = 'rgba(255,90,58,' + (0.35 + 0.2 * Math.sin(t * 9)).toFixed(3) + ')'; cx.fill(); }
      if (t < w.t0 || t > w.t1) return; const el = t - w.t0, op = Math.max(0, Math.min(1, el / 0.35, (w.t1 - t) / 0.5)) * 0.92;
      if (w.ring) { const Rr = w.v * el + 2.5, st = 2 * Math.PI / w.n; for (let q = 0; q < w.n; q++) { const a = w.ph + q * st, u = Math.cos(a), v = Math.sin(a); cres(w.x + u * Rr, w.y + v * Rr, u, v, -2.2, -w.cw / 2, w.cw / 2, op); } return; }
      const a = w.deg * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), Cx = w.x + u * w.v * el, Cy = w.y + v * w.v * el; w.cres.forEach(([a0, b0]) => cres(Cx, Cy, u, v, w.d / 2 - 2.2, a0, b0, op)); });
    // units: eggs, adds, the Wretches, her and her tail, the raid, you
    G.eggs.forEach((e) => { if (e.state === 'air' || e.state === 'gone') return; let p = [e.x, e.y]; if (e.who) { const b = e.who === me ? { x: G.x, y: G.y } : G.bots[e.who]; p = [b.x + 0.9, b.y + 0.9]; const ew = e.who === me ? eggWarnAt() : 0; circ(b.x, b.y, 3, ew === 2 ? 'rgba(255,90,58,.18)' : ew === 1 ? 'rgba(255,155,74,.14)' : 'rgba(58,242,168,.08)', ew === 2 ? '#ff5a3a' : ew === 1 ? '#ff9b4a' : 'rgba(58,242,168,.85)', ew ? 2.4 : 1.6); }
      circ(p[0], p[1], 0.9, '#e9e2c6', '#5a5136', 1.5); if (e.state === 'floor' && t < e.shell) { circ(e.x, e.y, 2, null, '#e6e0c8', 2.5); const f = (t - e.land) / (e.shell - e.land), [sx, sy] = P(e.x, e.y); cx.beginPath(); cx.arc(sx, sy, 2 * k, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); cx.lineWidth = 3 * dpr; cx.strokeStyle = '#ffd36b'; cx.stroke(); }
      if (e.id === me && e.state === 'floor') { circ(e.x, e.y, 2.8, null, '#f3c969', 2.5, [5, 4]); label(e.x, e.y, t < e.shell ? 'Your egg (shell up)' : 'Your egg: pick it up', '#f3c969', 12, -22); } });
    if (myEggHeld()) { const jm = jobOf(me, t), ys = jm.ob && spotIn(jm.ob, me); if (ys) { circ(ys[0], ys[1], 1.3, 'rgba(243,201,105,.18)', '#f3c969', 2.5, [5, 4]); label(ys[0], ys[1], 'Your spot', '#f3c969', 12, -14); } }
    const nextEgg = G.eggs.find((e) => e.id === me && e.state === 'air' && e.land - t < 14); if (nextEgg) { circ(nextEgg.x, nextEgg.y, 4.5, 'rgba(243,201,105,.08)', '#f3c969', 2, [8, 5]); label(nextEgg.x, nextEgg.y, 'Your egg lands here', '#f3c969', 12, -26); }
    G.adds.forEach((a) => { circ(a.x, a.y, a.kind === 'viper' ? 1.6 : 1.1, a.kind === 'viper' ? '#ff3b3b' : '#a7c46b', '#000', 1.5); label(a.x, a.y, a.kind === 'viper' ? 'Viper' : 'Rawling', a.kind === 'viper' ? '#ff8f87' : '#c9df9a', 11, -14); });
    S.wretches.forEach((w) => { const c = G.wr[w.id]; if (!c) return; circ(c.x, c.y, 2.2, t < w.awake ? '#5b3e7a' : '#9b5cff', '#1a0d2b', 2); label(c.x, c.y, t < w.awake ? 'Wretch (asleep)' : 'Blightscale Wretch', '#c89bff', 12, -22); });
    const B = bossAt(t), TL = tailAt(t);
    if (TL.up) { const a0 = Math.atan2(-TL.p[1], -TL.p[0]); for (let i = 3; i >= 0; i--) { const a = a0 + Math.PI + (i - 1.5) * 0.55, q = [TL.p[0] + Math.cos(a) * (i ? 2.8 : 0), TL.p[1] + Math.sin(a) * (i ? 2.8 : 0)]; circ(q[0], q[1], 3.4 - i * 0.45, i ? '#3a2f16' : '#4a3b19', '#c8a36a', 2); } label(TL.p[0], TL.p[1], 'Gore Rattle', '#e8d6a8', 12, -38 * 0 - 4); }
    if (B.up) { const [sx, sy] = P(B.p[0], B.p[1]), a = Math.atan2(-B.p[1], -B.p[0]), r6 = 6.5 * k, g = cx.createRadialGradient(sx, sy, r6 * 0.2, sx, sy, r6 * 1.25); g.addColorStop(0, '#3f7a2c'); g.addColorStop(0.7, '#183516'); g.addColorStop(1, 'rgba(10,30,10,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(sx, sy, r6 * 1.25, 0, Math.PI * 2); cx.fill(); cx.beginPath(); cx.ellipse(sx, sy, r6, r6 * 0.82, -a, 0, Math.PI * 2); cx.fillStyle = '#1f4a1b'; cx.fill(); cx.lineWidth = 3 * dpr; cx.strokeStyle = '#b6f23a'; cx.stroke();
      [-1, 1].forEach((sd) => { const ex = sx + Math.cos(-a) * r6 * 0.45 - Math.sin(-a) * sd * r6 * 0.38, ey = sy + Math.sin(-a) * r6 * 0.45 + Math.cos(-a) * sd * r6 * 0.38; cx.beginPath(); cx.ellipse(ex, ey, r6 * 0.16, r6 * 0.09, -a + Math.PI / 2, 0, Math.PI * 2); cx.fillStyle = '#ffe14a'; cx.shadowColor = '#ffe14a'; cx.shadowBlur = 10 * dpr; cx.fill(); cx.shadowBlur = 0; });
      label(B.p[0], B.p[1], 'Ula\'tek', '#e9ffd0', 15, -7.6 * k / dpr); }
    if (t >= 145.5 && t < 165.5) { const hp = S.F(PG_UL.heart, t); circ(hp[0], hp[1], 3, '#5a0f22', '#ff5a7a', 2.5); label(hp[0], hp[1], 'Venomous Heart', '#ff9fb2', 12, -18); }
    const unit = (id, x, y, you) => { const r = GDZ_ROLE[rl(id)], [sx, sy] = P(x, y), rad = (you ? 1.3 : 1.0) * k, ic = IMG['role' + rl(id)]; cx.save(); cx.beginPath(); cx.arc(sx, sy, rad, 0, Math.PI * 2); cx.closePath(); if (ok(ic)) { cx.clip(); cx.drawImage(ic, sx - rad, sy - rad, rad * 2, rad * 2); } else { cx.fillStyle = r[1]; cx.fill(); } cx.restore();
      cx.beginPath(); cx.arc(sx, sy, rad, 0, Math.PI * 2); cx.lineWidth = (you ? 3 : 2) * dpr; cx.strokeStyle = you ? '#fff' : clsC(id) || r[1]; cx.stroke(); if (TEAM && !you) label(x, y, nm(id).slice(0, 7), clsC(id) || '#cfd6df', 10, -13); };
    GDZ_RAID.forEach((id) => { if (id !== me) unit(id, G.bots[id].x, G.bots[id].y, false); });
    if (has('def')) circ(G.x, G.y, 1.9, 'rgba(127,184,255,.18)', '#7fb8ff', 2); unit(me, G.x, G.y, true); label(G.x, G.y, 'YOU', '#fff', 12, -22);
    const dv3 = dpsView(); if (dv3) { dv3.fx.forEach((h) => { if (h.melee) { if (h.age < 0.25) { const [sx, sy] = P(h.x1, h.y1), rr = (h.r + 0.6) * k; cx.strokeStyle = 'rgba(255,240,200,' + (1 - h.age / 0.25).toFixed(2) + ')'; cx.lineWidth = 3 * dpr; cx.beginPath(); cx.moveTo(sx - rr, sy - rr); cx.lineTo(sx + rr, sy + rr); cx.stroke(); } return; }
        const f2 = Math.min(1, h.age / 0.22), bx = h.x0 + (h.x1 - h.x0) * f2, by = h.y0 + (h.y1 - h.y0) * f2; if (f2 < 1) circ(bx, by, 0.5, '#ffe9a8', '#f3c969', 1.5); else if (h.age < 0.45) circ(h.x1, h.y1, h.r + 0.4 + (h.age - 0.22) * 6, null, 'rgba(243,201,105,' + (1 - (h.age - 0.22) / 0.23).toFixed(2) + ')', 2); });
      dv3.adds.forEach((o) => { if (o.hp >= o.max) return; const [sx, sy] = P(o.p[0], o.p[1] + o.r + 1.2), w = 30 * dpr, h2 = 4 * dpr; cx.fillStyle = 'rgba(0,0,0,.8)'; cx.fillRect(sx - w / 2 - dpr, sy - h2 - dpr, w + 2 * dpr, h2 + 2 * dpr); cx.fillStyle = '#ff6b5c'; cx.fillRect(sx - w / 2, sy - h2, w * Math.max(0, o.hp / o.max), h2); }); }
    const dv2 = dpsView(); if (dv2) { const pu = (0.55 + 0.4 * Math.sin(performance.now() / 150)).toFixed(2); dv2.right.forEach((o) => circ(o.p[0], o.p[1], o.r + 1.2, null, 'rgba(243,201,105,' + pu + ')', 2.5)); if (dv2.cur) circ(dv2.cur.p[0], dv2.cur.p[1], dv2.cur.r + 0.7, null, dv2.inRange ? '#ffffff' : '#ff8f87', 2, [4, 3]); }
    const hn = hintNow(); if (hn) { const ux = (hn.T[0] - G.x) / hn.d, uy = (hn.T[1] - G.y) / hn.d, A = (r, s2) => P(G.x + ux * r - uy * s2, G.y + uy * r + ux * s2), a0 = A(2.2, 0), a1 = A(4.6, 0), w1 = A(3.6, -0.9), w2 = A(3.6, 0.9), pulse = 0.65 + 0.35 * Math.sin(performance.now() / 160);
      cx.globalAlpha = pulse; cx.lineWidth = 3 * dpr; cx.strokeStyle = '#f3c969'; cx.beginPath(); cx.moveTo(a0[0], a0[1]); cx.lineTo(a1[0], a1[1]); cx.moveTo(w1[0], w1[1]); cx.lineTo(a1[0], a1[1]); cx.lineTo(w2[0], w2[1]); cx.stroke(); cx.globalAlpha = 1;
      circ(hn.T[0], hn.T[1], 1.4, 'rgba(243,201,105,.14)', '#f3c969', 2, [4, 3]); label(hn.T[0], hn.T[1], 'Go here · ' + Math.round(hn.d) + ' yd', '#f3c969', 12, -16); }
    if (target && !window.__pgAuto) circ(target[0], target[1], 0.6, null, 'rgba(255,255,255,.6)', 1.5);
    G.fx = G.fx.filter((f) => t - f.t0 < 1.2); G.fx.forEach((f) => { const [sx, sy] = P(f.x, f.y), el = t - f.t0; cx.globalAlpha = Math.max(0, 1 - el / 1.2); cx.font = '800 ' + Math.round(18 * dpr) + 'px system-ui, sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 4 * dpr; cx.strokeStyle = '#000'; cx.strokeText(f.text, sx, sy - (30 + el * 30) * dpr); cx.fillStyle = f.c; cx.fillText(f.text, sx, sy - (30 + el * 30) * dpr); cx.globalAlpha = 1; });
    miniMap2(t);
    const fl = (performance.now() - flashT) / 400; if (fl < 1) { const g = cx.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * 0.35, cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * 0.75); g.addColorStop(0, 'rgba(255,40,30,0)'); g.addColorStop(1, 'rgba(255,40,30,' + (0.45 * (1 - fl)).toFixed(3) + ')'); cx.fillStyle = g; cx.fillRect(0, 0, cv.width, cv.height); } };

  // ---- the minimap: the whole stone at a glance ----
  const miniMap2 = (t) => { if (P2) { P2.mini(mx2, mini.width, mini.height, t); return; } const Wm = mini.width, Hm = mini.height, sc = Wm / 120, M = (x, y) => [Wm / 2 + x * sc, Hm / 2 - y * sc], dot = (x, y, r, c, st) => { const [a, b] = M(x, y); mx2.beginPath(); mx2.arc(a, b, r, 0, Math.PI * 2); if (c) { mx2.fillStyle = c; mx2.fill(); } if (st) { mx2.strokeStyle = st; mx2.lineWidth = 1.5; mx2.stroke(); } };
    mx2.clearRect(0, 0, Wm, Hm); mx2.fillStyle = 'rgba(8,10,14,.82)'; mx2.fillRect(0, 0, Wm, Hm);
    const oct = [[36.5, 12.5], [15, 34], [-15, 34], [-36.5, 12.5], [-36.5, -12.5], [-15, -34], [15, -34], [36.5, -12.5]].map((q) => M(q[0], q[1])); mx2.beginPath(); oct.forEach((q, i) => (i ? mx2.lineTo(q[0], q[1]) : mx2.moveTo(q[0], q[1]))); mx2.closePath(); mx2.fillStyle = 'rgba(120,140,110,.28)'; mx2.fill(); mx2.strokeStyle = 'rgba(200,220,190,.5)'; mx2.lineWidth = 1; mx2.stroke();
    S.thrash.forEach((th) => { if (t >= th.t0 && t <= th.at) dot(th.x, th.y, th.r * sc, 'rgba(255,140,60,.18)', '#ff9b4a'); });
    S.soaks.forEach((q) => { if (t >= q.t0 && t <= q.at) dot(q.x, q.y, q.r * sc, 'rgba(36,242,203,.15)', q.group.includes(me) ? '#f3c969' : '#24f2cb'); });
    S.bubbles.forEach((q) => { const c = G.wr[q.w]; if (c && t >= q.t0 && t <= q.at) dot(c.x, c.y, 10 * sc, 'rgba(216,242,47,.18)', '#d8f22f'); });
    S.impacts.forEach((m) => { if (t >= m.t0 && t <= m.at) dot(m.x, m.y, m.r * sc, 'rgba(255,90,60,.25)'); });
    S.waves.forEach((w) => { if (t < w.t0 || t > w.t1) return; const el = t - w.t0; if (w.ring) { const [a, b] = M(w.x, w.y); mx2.beginPath(); mx2.arc(a, b, (w.v * el + 2.5) * sc, 0, Math.PI * 2); mx2.strokeStyle = 'rgba(155,225,58,.8)'; mx2.lineWidth = 2; mx2.stroke(); return; }
      const ang = w.deg * Math.PI / 180, u = Math.cos(ang), v = Math.sin(ang), c0 = [w.x + u * w.v * el, w.y + v * w.v * el], p1 = M(c0[0] + v * w.w / 2, c0[1] - u * w.w / 2), p2 = M(c0[0] - v * w.w / 2, c0[1] + u * w.w / 2); mx2.beginPath(); mx2.moveTo(p1[0], p1[1]); mx2.lineTo(p2[0], p2[1]); mx2.strokeStyle = 'rgba(155,225,58,.9)'; mx2.lineWidth = 3; mx2.stroke(); });
    const B = bossAt(t), TL = tailAt(t); if (B.up) dot(B.p[0], B.p[1], 5, '#2f6a22', '#b6f23a'); if (TL.up) dot(TL.p[0], TL.p[1], 3.5, '#4a3b19', '#c8a36a');
    S.wretches.forEach((w) => { const c = G.wr[w.id]; if (c) dot(c.x, c.y, 3, '#9b5cff'); });
    GDZ_RAID.forEach((id) => { if (id !== me) dot(G.bots[id].x, G.bots[id].y, 1.8, GDZ_ROLE[id[0]][1]); }); dot(G.x, G.y, 3, '#fff', '#000');
    if (v3) { const f = v3.fwd(), [a, b] = M(G.x, G.y); mx2.beginPath(); mx2.moveTo(a, b); mx2.lineTo(a + f[0] * 14, b - f[1] * 14); mx2.strokeStyle = '#f3c969'; mx2.lineWidth = 2; mx2.stroke(); } }; /* (3D: the way the camera looks) */

  // ---- the screen: your frame, her frame and cast, timers, warnings, your job, the action bar ----
  let hudKey = '';
  const castNow = (t) => S.casts.filter((c) => t >= c.t0 && t <= c.t1).sort((a) => (a.who === 'boss' ? -1 : 1))[0];
  const jobText = () => { if (P2) return P2.jobText(); const t = G.t, e = G.eggs.find((q) => q.id === me && (q.state === 'floor' || q.state === 'air') && q.land - t < 14), held = myEggHeld();
    const sk = S.soaks.find((s) => s.group.includes(me) && s.at > t && s.at - t <= 9), bb = S.bubbles.find((q) => q.at > t && q.at - t <= 8 && G.wr[q.w]), th = S.thrash.find((q) => t >= q.t0 - 1 && t <= q.at), wg = S.wings.find((w) => t >= w.t && t <= w.t + 14);
    if (th && Math.hypot(G.x - th.x, G.y - th.y) < 38) return 'Mephitic Thrash in ' + Math.max(0, Math.ceil(th.at - t)) + ' s: ' + (S.bubbles.some((q) => q.stack && t >= q.stack - 1 && t < q.at) ? 'run to the second Wretch in front of her, outside the 35 yards!' : 'run out of 35 yards from her tail!');
    if (bb) return 'Fester Burst in ' + Math.ceil(bb.at - t) + ' s: get within 10 yards of the Wretch (the yellow bubble).';
    if (sk && t < sk.t0) return 'Soak #' + (sk.k + 1) + ': ' + (sk.k ? 'the second coil to appear is yours. Wait for it beside her tail.' : 'the first coil to appear beside her tail is yours.') + (held ? ' Your egg breaks there.' : '');
    if (sk) return 'Your coil (the ' + (sk.k ? 'second' : 'first') + ' to appear) slams in ' + Math.ceil(sk.at - t) + ' s: stand in the gold circle.' + (held ? ' Your egg breaks there.' : '');
    const ew = eggWarnAt(); if (ew === 2) { const nb = G.eggs.filter((q) => q.state === 'held' && q.who && q.who !== me).map((q) => q.who).sort((a, b) => Math.hypot(G.bots[a].x - G.x, G.bots[a].y - G.y) - Math.hypot(G.bots[b].x - G.x, G.bots[b].y - G.y))[0]; return 'Too close to ' + nm(nb) + '\'s egg: step away before your rings touch!'; }
    const dc = !P2 && dpsCat(t); if (dc && !onRight(dc, tgtNow(t)) && !(e && e.state !== 'gone')) return DPS_SAY[dc][0] + ': press Tab to pick ' + (dc === 'rawling' ? 'one' : 'it') + ', then keep pressing 1 to hit it' + (rl(me) === 'm' ? ' (melee: get close to it)' : '') + '.';
    if (wg) return 'The ' + wg.first.toLowerCase() + ' half goes first: wait on the ' + wg.safe.toLowerCase() + ' half, then cross behind the first wave.';
    if (e && e.state === 'air') return 'Your egg lands in ' + Math.max(0, Math.ceil(e.land - t)) + ' s (the gold circle): stay out of the 4-yard impact, then wait by it.';
    if (e && t < e.shell) return 'Your egg\'s shell breaks in ' + Math.ceil(e.shell - t) + ' s: wait by it.';
    if (e) return 'Pick up your egg now: walk over it.';
    if (has('yolk')) return 'Rancid Yolk: no new egg for ' + Math.ceil(G.debs.yolk.until - t) + ' s.';
    if (held) return 'Carrying your egg: no waves, no venom, keep other carriers out of your 3-yard circle. Break it in your coil soak.';
    if (t >= 145.5) return 'The heart is open: step out of the brown circles.';
    const nx = S.timers.find((q) => q.t > t); return nx ? 'Next: ' + nx.name + ' in ' + Math.ceil(nx.t - t) + ' s.' : ''; };
  // ---- hints (Nov 15, Flex: "maybe having some warnings on screen of whats coming next to help the player a bit"): the next three things that
  // matter to you, and an arrow at your feet to where your job wants you now (the same target the bots and the autopilot follow, round the waves
  // the way they dodge), with a "Go here" ring. On by default; a switch on the start card, remembered. ----
  let hints = (() => { try { return localStorage.getItem('wla-pg-hints') !== '0'; } catch (e) { return true; } })();
  const upNext = (t) => { if (P2) return P2.upNext(t); const L = [], add = (at, text, c) => { if (at > t && at - t <= 30) L.push({ at, text, c }); }, car = carrierOf(me);
    G.eggs.filter((e) => e.id === me && e.state === 'air').forEach((e) => add(e.land, 'Your egg lands', '#f3c969'));
    if (!car) S.eggSets.forEach((e) => add(e.land, 'Eggs land: dodge the circles', '#e6e0c8'));
    S.soaks.filter((q) => q.group.includes(me)).forEach((q) => add(q.at, 'Your coil (' + (q.k ? '2nd' : '1st') + ' to appear)', '#24f2cb'));
    S.bubbles.forEach((q) => { const w = S.wretches.find((z) => z.id === q.w); if (w && q.at < w.dies) add(q.at, 'Bubble: get in', '#d8f22f'); });
    S.thrash.forEach((q) => add(q.at, 'Tail sweep: out of 35 yards', '#ff9b4a')); S.wings.forEach((w) => add(w.t + 6, 'Her waves', '#9be13a'));
    { const r0 = G.adds.filter((a) => a.kind === 'rawling' && a.born != null && !a.boil).sort((p, q) => p.born - q.born)[0]; if (r0) add(r0.born + 25, 'Rawlings boil', '#ff8f87'); }
    S.wrath.forEach((q) => add(q.at, 'Her bites: out of her reach', '#ff8f87')); add(S.dive.t0, 'She dives', '#7fd8ff'); add(145.5, 'Heart open: hit it', '#ff8a5a');
    return L.sort((a, b) => a.at - b.at).slice(0, 3); };
  let hintC = null; const hintNow = () => { if (!hints || !G || !S || window.__pgAuto || G.kb) return null; if (hintC && hintC.t === G.t) return hintC.h;
    // (Flex, Nov 15: "the move here thing should only be for specific mechanics ... where to stand for things like soaks, not how to dodge waves": your coil
    // soak, the Wretch's bubble and your egg; never the waves, the tail's sweep or her reach)
    const t = G.t, j = jobOf(me, t), eg = G.eggs.find((e) => e.id === me && e.state === 'floor'); let T = null, what = '';
    if (j.ob) { T = spotIn(j.ob, me) || j.ob.p.slice(); what = 'spot'; } else if (eg) { T = [eg.x, eg.y]; what = 'egg'; }
    const d = T ? Math.hypot(T[0] - G.x, T[1] - G.y) : 0, h = T && d > 2.5 ? { T, d, what } : null; hintC = { t, h }; return h; };
  const hud = (force) => { const t = G.t, c = castNow(t), dv = dpsView(), key = Math.floor(t * 4) + '|' + Math.round(G.hp) + '|' + G.log.length + '|' + (c ? c.name : '') + '|' + (G.tgt || '') + (dv && dv.inRange ? 'i' : 'o') + '|' + (G.lastHitT || 0) + '|' + (dv && dv.cd > 0 ? Math.ceil(dv.cd * 8) : 0);
    if (!force && key === hudKey) return; hudKey = key;
    $('.pg-mn').textContent = role.name + ' (you)'; { const mj = $('.pg-mj'); mj.textContent = role.job; mj.title = role.job; } /* (cut short in the frame: the whole job on hover) */
    const hp = Math.max(0, Math.round(G.hp)), hb = $('.pg-hp'); hb.querySelector('i').style.width = hp + '%'; hb.querySelector('span').textContent = hp + '%'; hb.className = 'pg-bar pg-hp ' + (hp < 35 ? 'low' : hp < 65 ? 'mid' : '');
    $('.pg-debs').innerHTML = Object.entries(G.debs).filter(([, v]) => v.until > t).concat(myEggHeld() ? [['shell', { until: t + 99, n: 1 }]] : []).map(([kk, v]) => { const dd = DEB[kk]; return '<span style="border-color:' + dd[1] + ';color:' + dd[1] + '">' + esc(dd[0]) + (v.n > 1 ? ' ×' + v.n : '') + (v.until - t < 60 ? ' <em>' + Math.ceil(v.until - t) + '</em>' : '') + '</span>'; }).join('');
    $('.pg-clk').textContent = pgClock(t); const bh = $('.pg-bhp'); bh.querySelector('i').style.width = G.bossHp.toFixed(1) + '%'; bh.querySelector('span').textContent = Math.round(G.bossHp) + '%';
    const cb = $('.pg-cast'); if (c) { cb.style.display = 'block'; cb.querySelector('i').style.width = Math.min(100, (t - c.t0) / (c.t1 - c.t0) * 100) + '%'; cb.querySelector('span').textContent = (c.who === 'tail' ? 'Gore Rattle: ' : c.who === 'wretch' ? 'Wretch: ' : '') + c.name + '  ' + Math.max(0, c.t1 - t).toFixed(1); } else cb.style.display = 'none';
    modsDraw(t);
    $('.pg-job p').textContent = jobText(); $('.pg-mc').textContent = G.log.length;
    tfDraw(tgtFrame(t)); const tg = $('.pg-tgt'); if (tg) tg.innerHTML = tgtHint(dv);
    { const tb = $('.pg-tab'); if (tb) { const hot = !!(dv && dv.cat && !dv.ok), good = !!(dv && dv.ok); tb.classList.toggle('hot', hot); tb.classList.toggle('good', good); tb.querySelector('span').textContent = dv && dv.cur ? dv.cur.name.split(' ').pop() : 'Target'; }
      const ab = $('.pg-atk'); if (ab) { const rdy = !!dv && dv.cd <= 0, ai = atkIc(); ab.classList.toggle('hot', !!(dv && dv.cat && rdy && !dv.ok)); ab.classList.toggle('good', !!(dv && dv.ok)); ab.classList.toggle('far', !!(dv && dv.cur && !dv.inRange)); ab.classList.remove('on'); ab.querySelector('span').textContent = dv && dv.cur && !dv.inRange ? 'Too far' : 'Attack'; ab.querySelector('i').style.height = dv && dv.cd > 0 ? (dv.cd / GCD * 100).toFixed(1) + '%' : '0';
        const an = ab.querySelector('.pg-cdn'); if (an) an.textContent = dv && dv.cd > 1 ? Math.ceil(dv.cd) : ''; if (ai !== atkShown) { atkShown = ai; icSet(ab, ai); } } } /* (the attack's icon is your role's: a melee strike, a firebolt, a healer's smite) */
    [['sprint', G.sprint, 30], ['def', G.def, 90]].forEach(([kk, at, cd]) => { const el = $('.pg-act[data-a="' + kk + '"] i'), left = cd - (t - at); el.style.height = left > 0 ? (left / cd * 100).toFixed(1) + '%' : '0'; const n = $('.pg-act[data-a="' + kk + '"] .pg-cdn'); if (n) n.textContent = left > 1 ? Math.ceil(left) : ''; }); if (P2) P2.hud(t); };
  // ---- the target frame (Nov 15, Flex: "theres also no healthbar for the target. This should look/feel like youre playing the game(kind of)"): your target's
  // name and a hostile red health bar. An add's own health; Ula'tek, her tail and her heart share hers (they are all her); a Wretch's by the clock, from waking
  // to dying; anything else (phase 2's targets have no health) a full bar with no number. No target: a dim frame, "Tab to pick". A hit flashes the bar ----
  const tgtFrame = (t) => { if (!G) return null; const o = tgtNow(t); if (!o) return { none: true, name: 'No target' }; let pct = null;
    if (o.max) pct = Math.max(0, o.hp == null ? o.max : o.hp) / o.max * 100; else if ((o.kind === 'boss' || o.kind === 'tail' || o.kind === 'heart') && typeof G.bossHp === 'number') pct = G.bossHp;
    else if (o.kind === 'wretch') { const w = (S.wretches || []).find((q) => q.id === o.key); if (w && w.dies > w.awake) pct = Math.max(0, Math.min(1, (w.dies - t) / (w.dies - w.awake))) * 100; }
    return { none: false, key: o.key, name: o.name, pct: pct == null ? null : Math.max(0, Math.min(100, pct)), range: inRange(o) }; };
  let hitSeen = null, tfFlash = 0;
  const tfDraw = (tf) => { const el = $('.pg-tf'); if (!el || !tf) return; el.classList.toggle('none', !!tf.none); el.classList.toggle('far', !tf.none && !tf.range);
    $('.pg-tfn').textContent = tf.name; $('.pg-tfr').textContent = tf.none ? 'Tab to pick' : tf.range ? '' : 'Out of range';
    const bar = $('.pg-tfh'); bar.querySelector('i').style.width = (tf.none ? 0 : tf.pct == null ? 100 : tf.pct).toFixed(1) + '%'; bar.querySelector('span').textContent = tf.none || tf.pct == null ? '' : Math.round(tf.pct) + '%';
    const h = G.hits || 0; if (h !== hitSeen) { const nw = hitSeen != null && h > hitSeen; hitSeen = h; if (nw && !window.__pgAuto) { tfFlash++; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); } } }; /* (by the hit count: two hits in one step still flash) */
  // (the line under it: what to do about your target, only while a moment needs one: the wrong one picked, too far, or not hitting it)
  const tgtHint = (dv) => { if (!dv || !dv.cat || dv.ok) return ''; const s0 = (DPS_SAY[dv.cat] || ['Hit the right target'])[0], right = !!dv.cur && isRight(dv.cat, dv.cur);
    return '<span class="pg-tgr">' + esc(!right ? s0 + ': press Tab' : !dv.inRange ? (rl(me) === 'm' ? 'Too far: get close to it' : 'Too far: get closer') : s0 + ': keep pressing 1') + '</span>'; };
  // ---- the boss mods (Nov 15, Flex: "Boss mods"): timer bars like DBM or BigWigs on the left, the coming-up hints (when hints are on) and the boss-mod timers
  // in one list, the same thing once (by name, or the same spell within 1.5 s), soonest first, five at most. Each bar has its spell's icon (the site's, by the
  // fight's spell names in the engine), its name, the seconds left and a fill that empties as the time runs out; under 5 s it lights up ----
  const MOD_SP = [[/coil/i, 'Spectral Coils'], [/womb/i, 'Toxic Womb'], [/beam/i, 'Toxic Incubation'], [/bubble|fester/i, 'Fester Burst'], [/wrath|bites/i, 'Mother\'s Wrath'], [/thrash|tail sweep/i, 'Mephitic Thrash'],
    [/heart|rage/i, 'Rage of the Shackled'], [/debris/i, 'Falling Debris'], [/wave|small tails/i, 'Caustic Waves'], [/malice/i, 'Malice'], [/cry|doomscale/i, 'Anguished Cry'], [/fangs|break/i, 'Grasping Fangs'], [/egg/i, null]];
  const modSp = (n) => { const m = MOD_SP.find(([re]) => re.test(n)); return !m ? null : m[1] || (P2 && P2.part === 2 ? 'Hatching Doom' : 'Call of the Serpent'); }; /* (the intermission's eggs are Call of the Serpent's, Nov 15) */
  const modBars = (t) => { const L = [], put = (at, name, c) => { if (!(at > t) || !name) return; const sp = modSp(name); if (L.some((q) => q.name === name || (sp && q.sp === sp && Math.abs(q.at - at) <= 1.5))) return;
      L.push({ at, name, c: /^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#5a8cdc', sp, left: at - t, soon: at - t < 5 }); };
    if (hints) upNext(t).forEach((u) => put(u.at, u.text, u.c)); myTimers(t).forEach((q) => put(q.t, q.name, null));
    return L.sort((a, b) => a.at - b.at).slice(0, 5); };
  const modIcon = (b) => { if (b.sp && typeof spellIcon === 'function') { try { return '<span class="pg-tmi">' + spellIcon(0, b.sp) + '</span>'; } catch (e) { /* (no icon: the colour square) */ } } return '<span class="pg-tmi pg-tmq"></span>'; };
  let modKey = null; /* (the bars are made again only when the list changes, so their icons don't flicker; the fills and seconds are set every time) */
  const modsDraw = (t) => { const el = $('.pg-timers'); if (!el) return; const B = modBars(t), k = B.map((b) => b.name + '@' + b.at).join('|');
    if (k !== modKey) { modKey = k; el.innerHTML = B.map((b) => '<div class="pg-tm" style="--c:' + b.c + '">' + modIcon(b) + '<div class="pg-tmb"><i></i><span>' + esc(b.name) + '</span><b></b></div></div>').join(''); if (typeof hydrateIcons === 'function') { try { hydrateIcons(); } catch (e) { /* (the colour squares stay) */ } } }
    const rows = el.children; B.forEach((b, i) => { const r = rows && rows[i]; if (!r) return; r.classList.toggle('soon', b.soon); r.querySelector('.pg-tmb i').style.width = Math.max(0, Math.min(100, b.left / 30 * 100)).toFixed(1) + '%'; r.querySelector('.pg-tmb b').textContent = b.soon ? b.left.toFixed(1) : String(Math.ceil(b.left)); }); };
  // ---- the action bar (Nov 15, Flex: "hotbars with spells on them for the attack/sprint/defensive"): square spell icons with the key in the corner and a
  // short name under each, the cooldown's dark sweep and its seconds; the gold glow when it's the thing to press. Icons by name (loaded at runtime, the site's
  // loader when it's there); a button whose icon can't load stays a plain dark square with its key. Phase 2's Kick gets its icon here too ----
  const ACT_IC = { tgt: 'ability_hunter_markedfordeath', sprint: 'ability_rogue_sprint', def: 'spell_holy_divineprotection', kick: 'ability_kick' }, ATK_IC = { m: 'ability_warrior_savageblow', r: 'spell_fire_firebolt02', h: 'spell_holy_searinglight' };
  const atkIc = () => ATK_IC[rl(me)] || ATK_IC.m; let atkShown = null;
  const actDeco = (h) => String(h).replace(/<div class="pg-act(?: [^"]*)?" data-a="(\w+)"[^>]*>(?!<img class="pg-ai")/g, (m0, a) => { const n = a === 'atk' ? atkIc() : ACT_IC[a]; return n ? m0 + '<img class="pg-ai" data-ic="' + n + '" alt="">' : m0; });
  const actsHtml = () => actDeco('<div class="pg-act pg-tab" data-a="tgt" role="button" tabindex="0" title="Pick a target (Tab)."><b>Tab</b><span>Target</span></div>' +
    '<div class="pg-act pg-atk" data-a="atk" role="button" tabindex="0" title="Hit your target (1). Press it again as soon as it is ready."><b>1</b><span>Attack</span><i></i><em class="pg-cdn"></em></div>' +
    '<div class="pg-act" data-a="sprint" title="Sprint (Shift): faster for 3 s, every 30 s."><b>Shift</b><span>Sprint</span><i></i><em class="pg-cdn"></em></div>' +
    '<div class="pg-act" data-a="def" title="Defensive (Q): half damage for 8 s, every 90 s."><b>Q</b><span>Defensive</span><i></i><em class="pg-cdn"></em></div>' + (P2 && P2.acts ? P2.acts() : ''));
  const hudHtml = () => HUD.replace('<div class="pg-acts"></div>', '<div class="pg-acts">' + actsHtml() + '</div>'); /* (the screen as it stands once the action bar is in: for the test) */
  const icLoad = (im, n) => { if (!im || !n) return; im.dataset.ic = n; if (typeof loadOfficial === 'function') { try { loadOfficial(im, n); return; } catch (e) { /* (loaded here instead) */ } }
    const u = ['https://wow.zamimg.com/images/wow/icons/large/' + n + '.jpg', 'https://render.worldofwarcraft.com/us/icons/56/' + n + '.jpg']; let k = 0;
    im.onload = () => { if (im.naturalWidth && im.parentNode) im.parentNode.classList.add('has'); }; im.onerror = () => { if (++k < u.length) im.src = u[k]; else im.remove(); }; im.src = u[0]; };
  const icSet = (btn, n) => { if (!btn) return; let im = btn.querySelector('img.pg-ai'); if (!im) { im = document.createElement('img'); im.className = 'pg-ai'; im.alt = ''; btn.insertBefore(im, btn.firstChild); } btn.classList.remove('has'); icLoad(im, n); };
  const press = (a) => { const el = $('.pg-act[data-a="' + a + '"]'); if (!el) return; el.classList.remove('pr'); void el.offsetWidth; el.classList.add('pr'); }; /* (a key or a click shows the button pressed) */
  // (calls that come within 1.5 s of each other share one line, so one never covers the other: "a second Wretch!" showed for 0.2 s, Nov 15 review)
  // (the boss-mod timers: only your coil slam, named "Your coil", Nov 15 review)
  const myTimers = (t) => S.timers.filter((q) => q.t > t).filter((q) => { const m = /^Coil slam (\d)$/.exec(q.name); return !m || S.soaks.some((z) => Math.abs(z.at - q.t) < 0.01 && z.k === +m[1] - 1 && z.group.includes(me)); }).map((q) => (/^Coil slam \d$/.test(q.name) ? { ...q, name: 'Your coil' } : q)).filter((q, i, a) => a.findIndex((z) => z.name === q.name) === i).slice(0, 5);
  const warns = () => { const now = []; while (G.warnI < S.warns.length && S.warns[G.warnI].t <= G.t) now.push(S.warns[G.warnI++]); if (!now.length) return; const el = $('.pg-warn');
    const keep = G.lastWarn && G.t - G.lastWarn.t < 1.5 ? [G.lastWarn.text] : [], txt = keep.concat(now.map((w) => w.text)).filter((x, i, a) => a.indexOf(x) === i).join('  ·  ');
    G.lastWarn = { t: G.t, text: now.map((w) => w.text).join('  ·  ') }; el.textContent = txt; el.style.color = now[now.length - 1].c; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); };

  // ---- the cards: pick your role, the countdown, a death, the end ----
  const asg = (id) => { const J = !TEAM && myJob && jobSlot(myJob) === id ? myJob : null, SK = J ? jobSoak(id, J) : PG_UL.soak, L = [];
    const sets = TEAM ? [0, 1].map(() => (TEAM.soak[0].includes(id) ? 1 : TEAM.soak[1].includes(id) ? 2 : 0)) : SK.map((s) => (s[0].includes(id) ? 1 : s[1].includes(id) ? 2 : 0));
    if (carrierOf(id)) L.push(['Your egg', 'Your area: ' + ZN[id][0] + ', the ' + ZN[id][1] + ' spot. It lands there at 0:10. At 1:20 it lands in your zone turned with her (the gold circle shows it). Wait for its shell, walk over it, carry it clean, break it in your coil soak.']);
    else L.push(['No egg', 'Keep out of the carriers\' way.']);
    if (TEAM && sets[0]) L.push(['Coil soaks', 'Soak #' + sets[0] + (TEAM.ce[sets[0] - 1].includes(id) ? ' with your egg' : ' (filler)') + ': ' + (sets[0] === 1 ? 'the first coil to appear, 0:40 and 2:14' : 'the second coil to appear, 0:43 and 2:17') + '. They rise beside her tail, on either side. Your circle is gold. Never both: Soul Constrictor.']);
    else if (TEAM) L.push(['Coil soaks', 'Not yours: stay out of both circles.']);
    else L.push(['Coil soaks', 'First set (0:40): team ' + sets[0] + '. Second set (2:14): team ' + sets[1] + '. Team 1 takes the first coil to appear, team 2 the next. They rise beside her tail, on either side. Your circle is gold. Never both: Soul Constrictor.']);
    if (TEAM) TEAM.fb.forEach((f, i) => { const j = f.indexOf(id); if (j >= 0) L.push(['Fester Burst ' + (i ? '1:48' : '0:39'), 'Your spot in the bubble: ' + (i ? 11 + j : 1 + j) + ' (a gold circle while you carry your egg).']); });
    else if (J && carrierOf(id)) L.push(['Fester Burst (0:39 and 1:48)', 'Your spot in the bubble is picked for you: the gold circle. Keep 3 yards from the other carriers.']);
    L.push(['The Wretch\'s bubble', 'Within 10 yards of the Wretch at 0:39, 1:10, 1:48 and 2:20. At 1:48 stand on it from her tail\'s sweep at 1:46.']); L.push(['Her tail\'s sweep', 'Out of 35 yards from her tail at 0:49 and 1:46.']);
    L.push(['Her waves', 'At 0:56 and 1:53: wait on the half she isn\'t pulling her wing back from, then cross behind the first wave.']); L.push(['Small tails', 'A tail rising at the edge sends three waves 2.4 s later: step out of their red lanes.']);
    L.push(['Her reach', 'The red circle in front of her is her tank\'s.']); L.push(['The dive (1:17) and the heart (2:25)', 'She comes up on either side. In the heart burn, step out of the brown circles.']);
    return '<ul class="pg-asg">' + L.map(([a, b]) => '<li><b>' + esc(a) + '</b><span>' + esc(b) + '</span></li>').join('') + '</ul>'; };
  // (the start card's glyphs, in the colours the fight uses: an egg, a coil, the Wretch's bubble, a wave; drawn here, no pictures)
  const pgGlyph = (k) => '<svg class="pg-gl" viewBox="0 0 16 16" aria-hidden="true">' + ({
    egg: '<ellipse cx="8" cy="8.6" rx="4.8" ry="6.1" fill="#e9e2c6" stroke="#5a5136" stroke-width="1"/>',
    noegg: '<ellipse cx="8" cy="8.6" rx="4.8" ry="6.1" fill="none" stroke="#8d97a3" stroke-width="1.3" stroke-dasharray="2 1.6"/>',
    coil: '<circle cx="8" cy="8" r="5.6" fill="rgba(36,242,203,.18)" stroke="#24f2cb" stroke-width="1.8"/>',
    bubble: '<circle cx="8" cy="8" r="6.2" fill="rgba(216,242,47,.2)" stroke="#d8f22f" stroke-width="1.4"/><circle cx="8" cy="8" r="1.9" fill="#9b5cff"/>',
    wave: '<path d="M1.5 11.5Q8 1.5 14.5 11.5Q8 7 1.5 11.5Z" fill="#9be13a" stroke="#06260e" stroke-width=".8"/>' }[k] || '') + '</svg>';
  // (your job in short: three or four plain lines for the start card; the full rundown is one click away)
  const short = (id) => { const J = !TEAM && myJob && jobSlot(myJob) === id ? myJob : null, SK = J ? jobSoak(id, J) : PG_UL.soak, L = [];
    const sets = TEAM ? [0, 1].map(() => (TEAM.soak[0].includes(id) ? 1 : TEAM.soak[1].includes(id) ? 2 : 0)) : SK.map((s2) => (s2[0].includes(id) ? 1 : s2[1].includes(id) ? 2 : 0));
    const G4 = [carrierOf(id) ? 'egg' : 'noegg', 'coil', 'bubble', 'wave'];
    L.push(carrierOf(id) ? 'You carry an egg (' + ZN[id][0] + '). It lands at 0:10 and 1:20: pick it up once its shell breaks.' : 'No egg: keep out of the egg carriers\' way.');
    L.push(sets[0] || sets[1] ? 'Coil team ' + sets[0] + (sets[1] !== sets[0] ? ' at 0:40, team ' + sets[1] + ' at 2:14' : ' at 0:40 and 2:14') + '. Team 1 takes the first coil to appear.' : 'No coil soak: stay out of both circles.');
    const fbn = TEAM ? TEAM.fb.map((q, i) => { const j = q.indexOf(id); return j >= 0 ? (i ? 11 + j : 1 + j) : 0; }).filter(Boolean) : [];
    L.push('Get in the Wretch\'s bubble at 0:39, 1:10, 1:48 and 2:20.' + (fbn.length ? ' Your spot: ' + fbn.join(' and ') + '.' : ''));
    L.push('Dodge every wave. Get out of her tail\'s 35 yards at 0:49 and 1:46.');
    return '<ul class="pg-short">' + L.map((x, i) => '<li>' + pgGlyph(G4[i]) + esc(x) + '</li>').join('') + '</ul>'; };
  const START = [[0, 'The pull'], [30, '0:30 · First coils and the bubble'], [44, '0:44 · Tail sweep, then her waves'], [66, '1:06 · Second eggs and the dive'], [98, '1:38 · The hardest waves'], [124, '2:04 · Second coils'], [138, '2:18 · The last bubble and the heart burn']];
  // ---- the setup: one screen (Flex via Main, Nov 15: "fix the setup menus in the game ... They are still too complex and confusing"). The part,
  // then two choices, your role and your job, each one row of big buttons, one plain sentence about the job, and one big Play that says what you'll
  // play: it's ready the moment the card opens (a sensible job, or the last one you played), so pressing Play is "just play". Hints, speed and where
  // to start are three small chips under it; no folding, no rundown (the guide page and the hints in the game teach the rest). With a team plan, one
  // choice: who you are. Every part gives the card the same setup (SETUP below; a later part's module gives its own as setup) ----
  const SROLE = { m: 'Melee', r: 'Ranged', h: 'Healer' }, EGG_BY = { m: 'm1', r: 'r5', h: 'r1' };
  const SETUP = P2 ? P2.setup || null : {
    roles: ['m', 'r', 'h'],
    now: () => ({ role: myJob.role, job: myJob.egg ? 'egg' : myJob.soak[1] === 2 ? 'c2' : 'c1' }),
    jobs: () => [['egg', 'Egg carrier'], ['c1', 'First coil'], ['c2', 'Second coil']],
    set: (r, jb) => { const keep = jb === 'egg' && myJob.egg && myJob.role === r; myJob = { role: r, egg: jb === 'egg' ? (keep ? myJob.egg : EGG_BY[r]) : null, soak: jb === 'c2' ? [2, 2] : [1, 1], fb: [0, 0] }; jobSave(); },
    say: () => { const slot = jobSlot(myJob); return myJob.egg ? 'You carry an egg. It lands ' + (ZN[slot][0] === 'by her' ? 'by her' : 'on the ' + ZN[slot][0]) + ': pick it up once its shell breaks, soak the first coil with it, then get in the Wretch\'s bubble.' :
      myJob.soak[1] === 2 ? 'You soak the second coil to appear (0:43 and 2:17) and get in the Wretch\'s bubble.' : 'You soak the first coil to appear (0:40 and 2:14) and get in the Wretch\'s bubble.'; },
  };
  const ric = (v) => (typeof GDZ_ROLE !== 'undefined' && GDZ_ROLE[v] ? '<img class="pg-ric" src="https://wow.zamimg.com/images/wow/icons/medium/' + GDZ_ROLE[v][2] + '.jpg" alt="" onerror="this.remove()">' : '');
  const tiles = (k, opts, cur) => '<div class="pg-tiles" role="group">' + opts.map(([v, t]) => '<button type="button" class="pg-tile' + (String(v) === String(cur) ? ' on' : '') + '" data-' + k + '="' + v + '" aria-pressed="' + (String(v) === String(cur)) + '">' + (k === 'sr' ? ric(v) : '') + '<span>' + esc(t) + '</span></button>').join('') + '</div>';
  const setupHtml = () => { if (TEAM) return '<div class="pg-srow"><span class="pg-sl">You</span><select class="pg-me">' + GDZ_RAID.filter((id) => TEAM.id2[id] && rl(id) !== 't').map((id) => '<option value="' + id + '"' + (id === role.id ? ' selected' : '') + '>' + esc(nm(id)) + ' · ' + esc(teamRole(id).job) + '</option>').join('') + '</select></div>' +
      '<p class="pg-say">Your job comes from <b>' + esc(TEAM.name) + '</b>: ' + esc(role.job) + '.</p>';
    if (!SETUP) return '<div class="pg-job0">' + P2.card() + '</div>'; /* (a part that has no setup yet keeps its own picker) */
    const nw = SETUP.now();
    return '<div class="pg-srow"><span class="pg-sl">Role</span>' + tiles('sr', SETUP.roles.map((r) => [r, SROLE[r]]), nw.role) + '</div>' +
      '<div class="pg-srow"><span class="pg-sl">Job</span>' + tiles('sj', SETUP.jobs(nw.role), nw.job) + '</div><p class="pg-say">' + esc(SETUP.say()) + '</p>'; };
  const panel = () => setupHtml(); /* (for the test) */
  const playSub = () => role.name + ' · ' + (TEAM ? role.job : SETUP ? ((SETUP.jobs(SETUP.now().role).find((o) => o[0] === SETUP.now().job) || [0, ''])[1]) : role.job);
  const pick = () => { stop(); paused = true; card.className = 'pg-card on'; if (TEAM && (!pickedMe || !role || !TEAM.id2[role.id] || rl(role.id) === 't')) pickedMe = true, role = teamRole(TEAM.you && rl(TEAM.you) !== 't' ? TEAM.you : CAR8.find((c) => TEAM.id2[c]) || GDZ_RAID.find((c) => TEAM.id2[c] && rl(c) !== 't'));
    if (P2) role = P2.role(); else if (!TEAM) role = jobRole(myJob);
    const parts = Object.keys(PG_PARTS[boss] || {}).filter((k) => k === d || PG_PARTS[boss][k].d === d), pkNow = pk || d; /* (the parts of the fight you can practise) */
    const art = typeof BOSS_ART !== 'undefined' && typeof artUrl === 'function' && BOSS_ART[boss] ? artUrl(BOSS_ART[boss][0]) : '';
    card.innerHTML = '<div class="pg-cin pg-setup"><div class="pg-head">' + (art ? '<img class="pg-head-art" src="' + art + '" alt="" onerror="this.remove()">' : '') + '<span class="pg-k">Practice · ' + dn + '</span><h2>' + esc(boss) + '</h2>' +
      '<p class="pg-sub">Real Mythic timings. The other 19 play the plan.</p>' +
      (parts.length > 1 ? '<div class="pg-seg pg-part" role="group" aria-label="Part">' + parts.map((k) => '<button type="button" data-v="' + k + '"' + (k === pkNow ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(PG_PARTS[boss][k].name) + '</button>').join('') + '</div>' : '') + '</div>' +
      '<div class="pg-sbox">' + setupHtml() + '</div>' +
      '<button type="button" class="pg-btn pg-go pg-play"><b>▶ Play</b><span class="pg-psub">' + esc(playSub()) + '</span></button>' +
      '<div class="pg-chips"><button type="button" class="pg-chip pg-hint" aria-pressed="' + hints + '">' + (hints ? 'Hints on' : 'Hints off') + '</button><button type="button" class="pg-chip pg-spd" aria-pressed="' + (speed < 1) + '">' + (speed < 1 ? 'Half speed' : 'Normal speed') + '</button>' +
      '<label class="pg-chip pg-atw">Start <select class="pg-at" aria-label="Where to start">' + (P2 ? P2.starts : START).map(([t0, n]) => '<option value="' + t0 + '"' + (t0 === startAt ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></label></div>' +
      '<p class="pg-keys">Move: W A S D or click · Tab: target · 1: attack (keep pressing) · Shift: sprint · Q: defensive' + (P2 && P2.acts && P2.acts() ? ' · E: kick' : '') /* (only a part with a Kick button: the intermission has none, Nov 15) */ + ' · Space: pause · 3D: drag to turn, wheel to zoom</p></div>';
    const box = card.querySelector('.pg-sbox');
    const seeMe = () => { if (!G || !S) return; me = role.id; const p0 = homeOf(me, 0); G.x = p0[0]; G.y = p0[1]; cam = null; try { draw(); hud(true); } catch (e) { /* (drawn on Play) */ } }; /* (the picture behind the card is you) */
    const redo = (sel) => { if (P2) role = P2.role(); else if (!TEAM) role = jobRole(myJob); box.innerHTML = setupHtml(); card.querySelector('.pg-psub').textContent = playSub(); bindBox(); seeMe(); if (sel) { const nb = box.querySelector(sel); if (nb && nb.focus) nb.focus(); } };
    const bindBox = () => { const pm = box.querySelector('.pg-me'); if (pm) pm.onchange = () => { role = teamRole(pm.value); redo(); };
      const jp = box.querySelector('.pg-job0'); if (jp && P2 && P2.bind) P2.bind(jp, () => { role = P2.role(); card.querySelector('.pg-psub').textContent = playSub(); seeMe(); }); };
    box.onclick = (e) => { const b = e.target.closest('[data-sr],[data-sj]'); if (!b || !SETUP) return; const nw = SETUP.now(), r = b.dataset.sr || nw.role, js = SETUP.jobs(r).map((o) => o[0]);
      SETUP.set(r, b.dataset.sj || (js.includes(nw.job) ? nw.job : js[0])); redo(e.detail === 0 ? (b.dataset.sr ? '[data-sr="' + r + '"]' : '[data-sj="' + b.dataset.sj + '"]') : null); };
    bindBox(); seeMe();
    card.querySelectorAll('.pg-part button').forEach((b) => (b.onclick = () => { if (b.dataset.v === pkNow) return; close(); pgOpen(root, boss, d, b.dataset.v === d ? null : b.dataset.v); }));
    const hb = card.querySelector('.pg-hint'); hb.onclick = () => { hints = !hints; try { localStorage.setItem('wla-pg-hints', hints ? '1' : '0'); } catch (e) { /* (no storage) */ } hb.textContent = hints ? 'Hints on' : 'Hints off'; hb.setAttribute('aria-pressed', String(hints)); };
    const sb = card.querySelector('.pg-spd'); sb.onclick = () => { speed = speed < 1 ? 1 : 0.5; sb.textContent = speed < 1 ? 'Half speed' : 'Normal speed'; sb.setAttribute('aria-pressed', String(speed < 1)); };
    card.querySelector('.pg-at').onchange = (e) => { startAt = +e.target.value || 0; };
    card.querySelector('.pg-go').onclick = begin; };
  const ffTo = (T0) => { if (!(T0 > 0)) return; window.__pgAuto = true; try { while (G.t < T0) step1(0.05); } finally { window.__pgAuto = false; }
    G.eggs.forEach((e) => { if (e.id === me && e.state === 'gone') { const sk = S.soaks.find((s) => s.at > e.land && s.group.includes(me)); if (e.shell < T0 && sk && T0 < sk.at) { e.state = 'held'; e.who = me; } } });
    G.log = []; G.hp = 100; G.deaths = 0; G.debs = {}; G.adds = []; G.dpsM = null; G.tgt = null; G.kb = null; G.fx = []; G.hitFx = []; G.sprint = -99; G.def = -99; G.vipers = 0; target = null; cam = null; G.warnI = S.warns.findIndex((w) => w.t > G.t); if (G.warnI < 0) G.warnI = S.warns.length; if (P2) P2.ff(); };
  const begin = () => { me = role.id; reset(); ffTo(startAt); draw(); hud(true); let n = 3; card.className = 'pg-card on pg-cd'; card.innerHTML = '<div class="pg-n">' + n + '</div>';
    const tick = () => { if (!ov.isConnected) return; n--; if (n > 0) { card.innerHTML = '<div class="pg-n">' + n + '</div>'; setTimeout(tick, 750); } else { card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); } }; setTimeout(tick, 750); };
  const died = () => { stop(); paused = true; G.deaths++; const e = myEggHeld(); if (e) { e.state = 'gone'; e.who = null; G.vipers++; deb('putrid', 20, true); G.adds.push({ kind: 'viper', x: G.x + 1.5, y: G.y - 1, born: G.t }); G.log.push({ t: G.t, kind: 'viper', text: 'You died holding your egg: a Viper hatched.', tip: 'A carrier\'s death hatches the egg.' }); } /* (it's really there when you keep going, Nov 15 audit) */
    const why = G.adds.some((a) => a.kind === 'viper') && G.t - (G.lastSting == null ? -99 : G.lastSting) < 4 ? { text: 'The Viper\'s stings wore you down.', tip: 'Kill a Viper at once: press Tab to pick it, then keep pressing 1 until it dies.' } : G.log.slice(-4).reverse().find((m) => m.kind !== 'venom' && m.kind !== 'viper') || G.log[G.log.length - 1] || {};
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin"><span class="pg-k">' + pgClock(G.t) + '</span><h2>You died</h2><p>' + esc(why.text || '') + '</p>' + (why.tip ? '<p class="pg-tip">' + esc(why.tip) + '</p>' : '') +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go">Keep going</button><button type="button" class="pg-btn pg-again">Start over</button></div></div>';
    card.querySelector('.pg-go').onclick = () => { G.hp = 100; G.debs = {}; card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); };
    card.querySelector('.pg-again').onclick = pick; };
  const grade = () => { const maj = G.log.filter((m) => MAJ.has(m.kind)).length, mn = G.log.length - maj, sc = Math.max(0, 100 - maj * 9 - mn * 4 - G.deaths * 20 - (G.wipes || 0) * 20); return { sc, g: sc >= 95 ? 'S' : sc >= 85 ? 'A' : sc >= 70 ? 'B' : sc >= 50 ? 'C' : 'D' }; };
  const end = () => { stop(); paused = true; dpsClose(); const { sc, g } = grade(), n = G.log.length, DL = (G.dpsM && G.dpsM.list) || [];
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin pg-end"><span class="pg-k">' + esc(boss) + ' ' + dn + ' · ' + esc(part.name) + ' · ' + esc(role.name) + (speed < 1 ? ' · half speed' : '') + (startAt ? ' · from ' + pgClock(startAt) : '') + '</span>' +
      '<div class="pg-grade"><b class="g' + g + '">' + g + '</b><div><h2>' + (n ? n + ' mistake' + (n > 1 ? 's' : '') : 'A clean run') + (G.deaths ? ', ' + G.deaths + ' death' + (G.deaths > 1 ? 's' : '') : '') + '</h2><p>' + sc + ' / 100' + (G.vipers ? ' · ' + G.vipers + ' Viper' + (G.vipers > 1 ? 's' : '') + ' hatched' : '') + '</p></div></div>' + (DL.length ? '<p class="pg-dpsl">Right target: <b>' + DL.filter((m) => m.fr >= 0.5).length + ' of ' + DL.length + '</b> moments (' + (P2 ? P2.dpsNames(DL) : 'the Rawlings, the heart' + (DL.some((m) => m.kind === 'viper') ? ', the Vipers' : '')) + ').</p>' : '') +
      (n ? '<ol class="pg-sum">' + G.log.slice().sort((a, b) => a.t - b.t).map((m) => '<li><time>' + pgClock(m.t) + '</time><div><b>' + esc(m.text) + '</b>' + (m.tip ? '<span>' + esc(m.tip) + '</span>' : '') + '</div></li>').join('') + '</ol>' : '<p>' + (P2 ? esc(P2.clean) : 'Every wave dodged, every soak and bubble taken, your eggs carried clean. Try another role.') + '</p>') +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go pg-copy">Copy my score</button><button type="button" class="pg-btn pg-again">Play again</button><button type="button" class="pg-btn pg-close2">Close</button></div></div>';
    card.querySelector('.pg-again').onclick = pick; card.querySelector('.pg-close2').onclick = close;
    const txt = 'Debrief practice · ' + boss + ' ' + dn + ', ' + part.name + ' · ' + role.name + ': ' + g + ' (' + (n ? n + ' mistake' + (n > 1 ? 's' : '') : 'no mistakes') + ', ' + G.deaths + ' death' + (G.deaths === 1 ? '' : 's') + ')' + (speed < 1 ? ' at half speed' : '') + ' · https://debriefme.io/guide/' + guideSlug(boss) + '/' + (d === 'h' ? 'heroic' : 'mythic') + '?practice' + (P2 ? '=' + (P2.part || 2) : '');
    card.querySelector('.pg-copy').onclick = async (e) => { const b = e.currentTarget; let done = false; try { await navigator.clipboard.writeText(txt); done = true; } catch (er) { /* (no clipboard) */ } b.textContent = done ? 'Copied: post it in Discord' : txt; }; };

  // ---- the loop ----
  const frame = (now) => { raf = null; if (!ov.isConnected || paused) return; const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    let left = dt * speed; while (left > 1e-6) { const h = Math.min(0.02, left); step1(h); left -= h; if (G.hp <= 0 || G.t >= S.end) break; }
    warns(); draw(); hud(); if (G.hp <= 0) { died(); return; } if (G.t >= S.end) { end(); return; } raf = requestAnimationFrame(frame); };
  const go = () => { last = 0; if (!raf) raf = requestAnimationFrame(frame); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
  const pauseT = () => { if (!G || card.classList.contains('on')) return; paused = !paused; if (paused) { stop(); const w = $('.pg-warn'); w.textContent = 'Paused (Space to go on)'; w.style.color = '#fff'; w.classList.remove('in'); void w.offsetWidth; w.classList.add('in'); } else go(); };
  const K = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  const kd = (e) => { if (!ov.isConnected) return; const tg = e.target && e.target.tagName, typing = tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT';
    if (!(e.ctrlKey || e.metaKey || e.altKey)) { e.stopPropagation(); if (/^[0-9]$/.test(e.key) && !typing) e.preventDefault(); } /* (the site's own keys never see the game's: 1 switched the guide to Heroic and closed it) */
    if (e.key === 'Escape') { close(); return; } if (e.code === 'Space' || e.code === 'KeyP') { e.preventDefault(); pauseT(); return; }
    if (G && !paused && (e.code === 'ShiftLeft' || e.code === 'ShiftRight')) { sprintKey(e); return; }
    if (G && !paused && P2 && e.code === 'KeyE') { if (!e.repeat) press('kick'); P2.kick(); return; }
    if (G && !paused && e.code === 'Tab') { e.preventDefault(); cycleTgt(); return; }
    if (G && !paused && (e.code === 'Digit1' || e.code === 'Numpad1')) { e.preventDefault(); atkKey(); if (!e.repeat) press('atk'); return; }
    if (G && !paused && e.code === 'KeyQ') { defKey(e); return; }
    const k = K[e.code]; if (k) { e.preventDefault(); keys[k] = true; target = null; } };
  const sprintKey = (e) => { if (!(e && e.repeat)) press('sprint'); if (G.t - G.sprint >= 30) { G.sprint = G.t; deb('sprint', 3); hud(true); } };
  const defKey = (e) => { if (!(e && e.repeat)) press('def'); if (G.t - G.def >= 90) { G.def = G.t; deb('def', 8); say('Defensive: half damage for 8 s.'); hud(true); } };
  const ku = (e) => { const k = K[e.code]; if (k) keys[k] = false; };
  document.addEventListener('keydown', kd, true); document.addEventListener('keyup', ku, true);
  cv.addEventListener('pointerdown', (e) => { if (paused || !G || !cam) return; const r = cv.getBoundingClientRect(), sx = (e.clientX - r.left) * dpr, sy = (e.clientY - r.top) * dpr; const wp = [cam[0] + (sx - cv.width / 2) / (Z * dpr), cam[1] - (sy - cv.height / 2) / (Z * dpr)]; e.preventDefault(); if (!pickTgtAt(wp)) target = wp; });
  cv.addEventListener('wheel', (e) => { e.preventDefault(); Z = Math.min(26, Math.max(6, Z * (e.deltaY > 0 ? 1 / 1.12 : 1.12))); if (paused && G) draw(); }, { passive: false });
  const onBlur = () => { keys = {}; }; window.addEventListener('blur', onBlur);
  // ---- the 3D view (src/practice3d.js; Nov 15, Flex: "theres nothing else like this out there"): the 2D | 3D switch by the minimap, remembered.
  // three.js loads only when 3D is picked; if it can't (or the PC has no WebGL, or drawing fails), the switch goes back to 2D and says so ----
  let v3 = null, want3 = false; const vw = $('.pg-vw');
  const v3api = { halves: () => (G && !P2 ? halvesAt(G.t) : null), eggWarn: () => (G ? eggWarnAt() : 0), hint: () => hintNow(), P2, onPlat: (x, y) => onPlat(x, y), get G() { return G; }, get S() { return S; }, get me() { return me; }, get target() { return window.__pgAuto ? null : target; }, get flashT() { return flashT; }, nm, rl, clsC, bossAt, tailAt,
    spot: () => { if (!myEggHeld()) return null; const jm = jobOf(me, G.t); return jm.ob ? spotIn(jm.ob, me) : null; }, walk: (p) => { if (!paused && G && !pickTgtAt(p)) target = p; }, dps: () => dpsView(), fail: (e) => { console.error('Practice 3D:', e); off3d('3D stopped working, so you\'re back in 2D.'); } };
  const off3d = (why) => { want3 = false; if (v3) v3.dispose(); v3 = null; ov.classList.remove('pg3'); vw.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === '2')); try { if (!P2) localStorage.setItem('wla-pg-view', '2d'); } catch (e) { /* (no storage) */ } if (why && ov.isConnected) say(why, true); };
  const view = (on) => { want3 = on; if (!on) { off3d(); if (G) draw(); return; } if (v3 || vw.classList.contains('busy')) return; vw.classList.add('busy');
    pg3dLoad().then(() => { if (!ov.isConnected || v3 || !want3) return; v3 = pg3d($('.pg-3d'), v3api); ov.classList.add('pg3'); vw.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === '3')); try { if (!P2) localStorage.setItem('wla-pg-view', '3d'); } catch (e) { /* (no storage) */ } if (G) draw(); })
      .catch((e) => { console.error('Practice 3D:', e); off3d('3D didn\'t load' + (P2 ? ': ' + (P2.label || 'phase ' + (P2.part || 2)) + ' needs it. Press 3D to try again, or play phase 1 in 2D.' : ', so you\'re in 2D.')); }).finally(() => vw.classList.remove('busy')); };
  vw.onclick = (e) => { const b = e.target.closest('button'); if (b) { b.blur(); view(b.dataset.v === '3'); } };
  { let v = ''; try { v = localStorage.getItem('wla-pg-view'); } catch (e) { /* (no storage) */ } if (v === '3d' || P2) view(true); } /* (a later part is 3D only (Flex): it opens in 3D, and doesn't change the view phase 1 remembers) */
  window.__pg3dDbg = { get v3() { return v3; }, view };
  const close = () => { if (!ov.isConnected) return; stop(); if (v3) { v3.dispose(); v3 = null; } ov.remove(); document.documentElement.classList.remove('pg-open'); document.removeEventListener('keydown', kd, true); document.removeEventListener('keyup', ku, true); window.removeEventListener('blur', onBlur); };
  $('.pg-x').onclick = close;
  // (the action bar goes in now that your role is known (the attack's icon is your role's), its icons load, and every button is clickable like a WoW bar)
  { const ba = $('.pg-acts'); if (ba) { ba.innerHTML = actsHtml(); atkShown = atkIc(); ba.querySelectorAll('img.pg-ai').forEach((im) => icLoad(im, im.dataset.ic));
    ba.addEventListener('click', (e) => { const b = e.target && e.target.closest ? e.target.closest('.pg-act') : null; if (!b || !G || paused) return; const a = b.dataset.a; if (a === 'sprint') sprintKey(); else if (a === 'def') defKey(); else if (a === 'kick' && P2) { press('kick'); P2.kick(); } }); } }
  { const ab = $('.pg-atk'); if (ab) { ab.onclick = () => { if (G && !paused) { atkKey(); press('atk'); } }; ab.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (G && !paused) { atkKey(); press('atk'); } } }; } }
  { const tb = $('.pg-tab'); if (tb) { tb.onclick = () => { if (G && !paused) cycleTgt(); }; tb.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (G && !paused) cycleTgt(); } }; } }
  reset(); draw(); hud(true); pick(); [300, 1000, 2500].forEach((ms) => setTimeout(() => { if (G && paused && ov.isConnected) draw(); }, ms));

  // (for testing: play the whole part at once, as a raider who follows the plan or stands still; and an audit of all 20)
  const sim = (id, auto, eastSide, seedV, more) => { stop(); paused = true; me = id; role = TEAM && TEAM.id2[id] ? teamRole(id) : part.roles.find((r) => r.id === id) || role; reset({ east: !!eastSide, seed: seedV || 3, ...(more || {}) });
    window.__pgAuto = !!auto; const deaths = []; try { while (G.t < S.end) { step1(0.05); if (G.hp <= 0) { deaths.push(pgClock(G.t)); G.hp = 100; } } } finally { window.__pgAuto = false; } return { deaths, log: G.log.map((m) => pgClock(m.t) + ' ' + m.text) }; };
  const audit = (eastSide, seedV, more) => { stop(); paused = true; reset({ east: !!eastSide, seed: seedV || 3, ...(more || {}) });
    window.__pgAuto = true; const out = {}, hitW = new Set(), add = (kk, who, t) => { const q = out[kk] = out[kk] || { n: 0, who: new Set(), t: [] }; q.n++; q.who.add(who); if (q.t.length < 4 && !q.t.includes(pgClock(t))) q.t.push(pgClock(t)); };
    try { while (G.t < S.end) { const t0 = G.t; step1(0.05); const t = G.t, crossed = (at) => at > t0 && at <= t;
      GDZ_RAID.forEach((id) => { const b = id === me ? { x: G.x, y: G.y } : G.bots[id];
        S.waves.forEach((w, i) => { const kk = 'w' + i + id; if (!hitW.has(kk) && !(w.kind === 'incub' && id === w.tank) && w.from !== id && inWave(w, t, b.x, b.y)) { hitW.add(kk); add('in ' + w.name + ' (' + pgClock(w.t0) + ')', id, t); } });
        S.impacts.forEach((m) => { if (crossed(m.at) && Math.hypot(b.x - m.x, b.y - m.y) <= m.r) add('in ' + m.name, id, t); });
        G.eggs.forEach((e) => { if (crossed(e.land) && Math.hypot(b.x - e.x, b.y - e.y) <= 4) add('under a landing egg', id, t); });
        S.soaks.forEach((s) => { if (!crossed(s.at)) return; const dd = Math.hypot(b.x - s.x, b.y - s.y); if (s.group.includes(id) && dd > s.r) add('off their soak (set ' + (s.set + 1) + ' slam ' + (s.k + 1) + ')', id, t); if (!s.group.includes(id) && dd <= s.r && s.k === 1 && S.soaks.some((q) => q.set === s.set && q.k === 0 && q.group.includes(id))) add('soaked both slams', id, t); });
        S.bubbles.forEach((q) => { const c = G.wr[q.w]; if (crossed(q.at) && c && id !== (q.tank === 't1' ? 't2' : 't1') && Math.hypot(b.x - c.x, b.y - c.y) > 10) add('outside the bubble ' + pgClock(q.at), id, t); });
        S.thrash.forEach((th) => { if (crossed(th.at) && Math.hypot(b.x - th.x, b.y - th.y) <= th.r) add('in the tail\'s sweep ' + pgClock(th.at), id, t); });
        S.wrath.forEach((wr) => { if (crossed(wr.at) && id !== wr.tank && Math.hypot(b.x - wr.p[0], b.y - wr.p[1]) <= 5) add('in her reach ' + pgClock(wr.at), id, t); if (crossed(wr.at) && id === wr.tank && Math.hypot(b.x - wr.p[0], b.y - wr.p[1]) > 5) add('her tank out of her reach ' + pgClock(wr.at), id, t); });
        S.beams.forEach((bm) => bm.hits.forEach((ht) => { if (crossed(ht) && id === bm.tank && Math.hypot(b.x - bm.at[0], b.y - bm.at[1]) > 3) add('beam tank not in the beam ' + pgClock(ht), id, t); }));
        if (!onPlat(b.x, b.y)) add('off the platform', id, t); });
      const car = G.eggs.filter((e) => e.state === 'held' && e.who).map((e) => e.who); for (let i = 0; i < car.length; i++) for (let j = i + 1; j < car.length; j++) { const a = car[i] === me ? { x: G.x, y: G.y } : G.bots[car[i]], c = car[j] === me ? { x: G.x, y: G.y } : G.bots[car[j]]; if (Math.hypot(a.x - c.x, a.y - c.y) < 3) add('two carriers within 3 yards', car[i] + '+' + car[j], t); }
      if (P2) P2.auditStep(t0, t, add); const ht = S.herTank(S.dive.surf); if (!P2 && t > S.dive.surf && t0 <= S.dive.surf && pgDist([G.bots[ht].x, G.bots[ht].y], S.dive.to) > 12) add('her tank not at the bubbles when she surfaced', ht, t); } } finally { window.__pgAuto = false; }
    return Object.entries(out).sort((a, b) => b[1].n - a[1].n).map(([kk, v]) => kk + ' × ' + v.n + ' [' + [...v.who].join(' ') + '] ' + v.t.join(' ')); };
  window.__pgDbg = { get P2() { return P2; }, kick: () => P2 && P2.kick(), html: () => hudHtml(), tf: () => tgtFrame(G.t), mods: () => modBars(G.t), deco: (h) => actDeco(h), get atkIc() { return atkShown; }, get tfFlash() { return tfFlash; }, get role() { return role; }, get log() { return G ? G.log.map((m) => pgClock(m.t) + ' ' + m.text) : []; }, grade: () => grade(), get teamWhy() { return teamWhy; }, get G() { return G; }, get S() { return S; }, get myJob() { return myJob; }, set myJob(j) { myJob = j; }, hint: () => { hintC = null; return hintNow(); }, upNext: () => upNext(G.t), set hints(v) { hints = !!v; }, jobSlot: () => jobSlot(myJob), panel: () => panel(), setupApi: () => SETUP, asg: (id) => asg(id), short: (id) => short(id), jobRole: () => jobRole(myJob), dps: () => dpsView(), ff: (T0) => { ffTo(T0); return G.t; }, hatchMine: () => { const e = myEggHeld() || G.eggs.find((q) => q.id === me && q.state !== 'gone'); if (!e) return false; hatch(e, 'Check', 'Check'); return true; }, dpsList: () => (G.dpsM && G.dpsM.list) || [], stepOwn: (n) => { for (let i = 0; i < n; i++) step1(0.05); return G.t; }, tgts: () => tgtList(G.t), set tgt(k) { G.tgt = k; }, get tgt() { return G.tgt; }, atk: () => atkKey(), halves: () => halvesAt(G.t), eggWarn: () => eggWarnAt(), timers: () => myTimers(G.t).map((q) => q.name), sim, audit, step: (n) => { window.__pgAuto = true; try { for (let i = 0; i < n; i++) step1(0.05); } finally { window.__pgAuto = false; } return G.t; }, job: (id) => jobOf(id, G.t), play: () => { card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); }, set pos(p) { G.x = p[0]; G.y = p[1]; }, frame: () => { draw(); hud(true); }, at: (T0, id, more) => { stop(); paused = true; me = id || me; role = TEAM && TEAM.id2[me] ? teamRole(me) : part.roles.find((r) => r.id === me) || role; reset({ east: false, seed: 3, tailEast: false, first: [false, false], ...(more || {}) }); window.__pgAuto = true; try { while (G.t < T0) step1(0.05); } finally { window.__pgAuto = false; } draw(); hud(true); warns(); return G.t; } };
}

function pgCss() {
  if (document.getElementById('pg-css')) return; const st = document.createElement('style'); st.id = 'pg-css';
  st.textContent = `
html.pg-open, html.pg-open body { overflow: hidden; }
.pg { position: fixed; inset: 0; z-index: 72; background: #05070a; }
.pg-in { position: absolute; inset: 0; overflow: hidden; font-family: var(--body, system-ui, sans-serif); color: #e8edf2; user-select: none; }
.pg-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: crosshair; }
/* (the screen, Nov 15: laid out like a raider's UI; every rule under .pg so none of it reaches the site's own pg- classes) */
.pg .pg-nm { display: flex; align-items: baseline; gap: 8px; min-width: 0; margin-bottom: 4px; } .pg .pg-nm b { flex: none; font: 700 14px var(--head, system-ui); color: #fff; text-shadow: 0 1px 3px #000; }
.pg .pg-nm span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: #c2cbd5; text-shadow: 0 1px 3px #000; }
.pg .pg-bar { position: relative; height: 20px; background: rgba(10,12,16,.85); border: 1px solid rgba(255,255,255,.18); overflow: hidden; }
.pg .pg-bar i { position: absolute; left: 0; top: 0; bottom: 0; background: #3fbf5a; transition: width .1s linear; } .pg .pg-bar span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 700 12.5px var(--head, system-ui); color: #fff; text-shadow: 0 1px 2px #000; }
.pg .pg-hp.mid i { background: #d9a93a; } .pg .pg-hp.low i { background: #d8483e; }
/* (top right, where WoW's minimap is: the minimap, the 2D | 3D switch and your mistakes under it, then her boss frame; the close button in the corner) */
.pg .pg-tr { position: absolute; top: 12px; right: 54px; width: 200px; display: flex; flex-direction: column; gap: 6px; pointer-events: none; }
.pg .pg-mini { display: block; width: 200px; height: 200px; border: 1px solid rgba(255,255,255,.2); pointer-events: none; }
.pg .pg-trow { display: flex; flex-wrap: wrap; align-items: stretch; justify-content: space-between; gap: 6px; } /* (wraps in the 150 px column on a narrow window: Mistakes stuck out past the minimap) */
.pg .pg-mis { display: flex; align-items: center; gap: 6px; padding: 0 9px; background: rgba(10,12,16,.85); border: 1px solid rgba(255,255,255,.18); font: 600 12px var(--body, system-ui); color: #aab4c0; } .pg .pg-mis b { font: 800 16px var(--head, system-ui); color: #ff8f87; font-variant-numeric: tabular-nums; }
.pg .pg-bossf { padding: 5px 6px 6px; background: rgba(10,12,16,.85); border: 1px solid rgba(255,255,255,.2); } .pg .pg-bossf .pg-nm { justify-content: space-between; } .pg .pg-clk { font: 800 15px var(--head, system-ui) !important; color: #fff !important; font-variant-numeric: tabular-nums; }
.pg .pg-bhp i { background: #b0303a; }
.pg .pg-x { position: absolute; top: 12px; right: 14px; z-index: 6; width: 32px; height: 32px; border: 1px solid rgba(255,255,255,.25); background: rgba(10,12,16,.85); color: #cfd6de; font-size: 15px; cursor: pointer; } .pg .pg-x:hover { border-color: #f3c969; color: #fff; }
/* (left side: the boss mods, timer bars like DBM's: an icon, the name, the seconds; the fill empties as the time runs out, brighter under 5 s) */
.pg .pg-timers { position: absolute; left: 14px; top: 36%; width: 270px; display: flex; flex-direction: column; gap: 3px; pointer-events: none; }
.pg .pg-tm { display: flex; height: 24px; background: rgba(10,12,16,.85); border: 1px solid rgba(255,255,255,.16); }
.pg .pg-tmi { position: relative; flex: none; width: 22px; height: 22px; overflow: hidden; background: #0b0d11; border-right: 1px solid #000; } .pg .pg-tmq { background: var(--c); opacity: .7; }
.pg .pg-tmi .icw { display: block; width: 22px; height: 22px; margin: 0; vertical-align: top; } .pg .pg-tmi .icw img.oi { border-radius: 0; box-shadow: none; } .pg .pg-tmi .icw svg rect { rx: 0; }
.pg .pg-tmb { position: relative; flex: 1; min-width: 0; } .pg .pg-tmb i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--c); opacity: .38; transition: width .25s linear; }
.pg .pg-tmb span { position: absolute; left: 7px; right: 42px; top: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 12.5px/22px var(--body, system-ui); color: #e8edf2; text-shadow: 0 1px 2px #000; }
.pg .pg-tmb b { position: absolute; right: 7px; top: 0; font: 700 12.5px/22px var(--head, system-ui); color: #e8edf2; font-variant-numeric: tabular-nums; text-shadow: 0 1px 2px #000; }
.pg .pg-tm.soon { border-color: var(--c); } .pg .pg-tm.soon .pg-tmb i { opacity: .85; } .pg .pg-tm.soon .pg-tmb span, .pg .pg-tm.soon .pg-tmb b { color: #fff; font-weight: 800; }
.pg-warn { position: absolute; top: 22%; left: 0; right: 0; text-align: center; font: 800 26px var(--head, system-ui); text-shadow: 0 2px 6px #000, 0 0 2px #000; opacity: 0; pointer-events: none; padding: 0 20px; }
.pg-warn.in { animation: pgWarn 3s ease-out forwards; } @keyframes pgWarn { 0% { opacity: 0; transform: scale(1.15); } 8% { opacity: 1; transform: scale(1); } 75% { opacity: 1; } 100% { opacity: 0; } }
.pg-float { position: absolute; top: 31%; left: 0; right: 0; text-align: center; font: 700 16px var(--head, system-ui); text-shadow: 0 1px 4px #000; opacity: 0; pointer-events: none; padding: 0 20px; }
.pg-float.bad { color: #ff8f87; } .pg-float.ok { color: #7ee08f; } .pg-float.in { animation: pgFl 2.6s ease-out forwards; } @keyframes pgFl { 0% { opacity: 0; } 8% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
/* (bottom centre, ElvUI style: your job, then your frame left of centre and your target's right of it (you stand between them), then the action bar) */
.pg .pg-bot { position: absolute; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 0 14px 8px; pointer-events: none; }
.pg .pg-job { max-width: min(520px, 100%); padding: 6px 12px 7px; text-align: center; background: rgba(10,12,16,.85); border: 1px solid rgba(243,201,105,.45); } .pg .pg-job span { display: block; font: 700 12px var(--head, system-ui); letter-spacing: .04em; text-transform: uppercase; color: #f3c969; } .pg .pg-job p { margin: 1px 0 0; font: 600 14px/1.35 var(--body, system-ui); color: #e8edf2; }
.pg .pg-ufs { display: flex; justify-content: center; gap: 140px; }
.pg .pg-ucol { position: relative; width: 250px; min-height: 104px; display: flex; flex-direction: column; align-items: stretch; gap: 4px; }
/* (the site's own rules reach in here: ".pg-me { align-items: flex-start }" (Home's "Which one is you?") shrank your frame to its words, and body.refine
   rounds every button and "#main .pg-bar" (the Plan page's bar, inside the site's defaultTheme layer, so this one has to be in that layer too) by 4 px;
   the screen keeps square edges) */
.pg.pg .pg-in :is(.pg-x, .pg-vw button, .pg-bar) { border-radius: 0 !important; } @layer defaultTheme { html body #main .pg.pg .pg-in .pg-bar { border-radius: 0 !important; } }
.pg .pg-uf { padding: 5px 6px 6px; background: rgba(10,12,16,.85); border: 1px solid rgba(255,255,255,.2); } .pg .pg-uf .pg-bar { height: 22px; background: #15181d; border-color: #000; } .pg .pg-uf .pg-bar span { justify-content: flex-end; padding-right: 7px; }
.pg .pg-debs { display: flex; flex-wrap: wrap; gap: 3px; } .pg .pg-debs span { padding: 1px 5px; border: 1px solid; background: rgba(10,12,16,.85); font: 600 12px var(--body, system-ui); } .pg .pg-debs em { font-style: normal; color: #fff; margin-left: 3px; }
.pg .pg-tfh i { background: #c0352c; } .pg .pg-tf .pg-tfr { color: #ff8f87; font-weight: 700; } .pg .pg-tf.far .pg-tfh i { background: #7c2a25; }
.pg .pg-tf.none { opacity: .6; } .pg .pg-tf.none .pg-tfn { color: #aab4c0; } .pg .pg-tf.none .pg-tfr { color: #8d97a3; font-weight: 600; }
.pg .pg-tfh::after { content: ''; position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; } .pg .pg-tf.hit .pg-tfh::after { animation: pgHit .15s ease-out; } @keyframes pgHit { 0% { opacity: .5; } 100% { opacity: 0; } }
.pg .pg-cast { height: 18px; } .pg .pg-cast i { background: #e0a53a; } .pg .pg-cast span { font-size: 12px; }
.pg .pg-tgt { display: flex; flex-wrap: wrap; gap: 6px; } .pg .pg-tgt:empty { display: none; } .pg .pg-tgt span { padding: 1px 8px; background: rgba(10,12,16,.85); border: 1px solid #f3c969; color: #f3c969; font: 700 12.5px var(--body, system-ui); }
/* (the action bar: square spell icons, the key in the corner, the name under it; the cooldown's dark sweep and its seconds; the gold proc glow, green when right) */
.pg .pg-acts { display: flex; gap: 14px; padding-bottom: 18px; }
.pg .pg-acts .pg-act { position: relative; isolation: isolate; flex: none; width: 46px; height: 46px; background: #11141a; border: 1px solid rgba(255,255,255,.3); box-shadow: 0 0 0 1px #000; pointer-events: auto; cursor: pointer; }
.pg .pg-acts .pg-act img.pg-ai { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; pointer-events: none; } .pg .pg-acts .pg-act.has img.pg-ai { opacity: 1; }
.pg .pg-acts .pg-act b { position: absolute; left: 3px; top: 1px; z-index: 3; font: 800 12.5px var(--head, system-ui); color: #fff; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; pointer-events: none; }
.pg .pg-acts .pg-act span { position: absolute; left: 50%; top: calc(100% + 3px); transform: translateX(-50%); max-width: 62px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 600 12px var(--body, system-ui); color: #c2cbd5; text-shadow: 0 1px 2px #000; pointer-events: none; }
.pg .pg-acts .pg-act i { position: absolute; left: 0; right: 0; bottom: 0; height: 0; z-index: 1; background: rgba(0,0,0,.62); pointer-events: none; }
.pg .pg-acts .pg-act em { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; padding-top: 12px; font: 800 16px var(--head, system-ui); font-style: normal; color: #fff; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; pointer-events: none; }
.pg .pg-acts .pg-act::before { content: ''; position: absolute; inset: 0; z-index: 1; background: rgba(200,30,30,.45); opacity: 0; pointer-events: none; } .pg .pg-acts .pg-act.far::before { opacity: 1; }
.pg .pg-acts .pg-act::after { content: ''; position: absolute; inset: 0; z-index: 4; background: rgba(255,240,200,.5); opacity: 0; pointer-events: none; } .pg .pg-acts .pg-act.pr::after { animation: pgPr .16s ease-out; } @keyframes pgPr { 0% { opacity: 1; } 100% { opacity: 0; } }
.pg .pg-acts .pg-act:hover { border-color: #f3c969; }
.pg .pg-acts .pg-act.hot { border-color: #f3c969; box-shadow: 0 0 0 1px #f3c969, 0 0 14px rgba(243,201,105,.6); animation: pgTabHot 1s ease-in-out infinite; } .pg .pg-acts .pg-act.hot span { color: #f3c969; }
@keyframes pgTabHot { 50% { box-shadow: 0 0 0 1px #f3c969, 0 0 4px rgba(243,201,105,.2); } }
.pg .pg-acts .pg-act.good { border-color: #7ee08f; box-shadow: 0 0 0 1px #7ee08f; } .pg .pg-acts .pg-act.good span { color: #7ee08f; }
@media (max-width: 900px) { .pg .pg-tr { width: 150px; } .pg .pg-mini { width: 150px; height: 150px; } .pg .pg-timers { width: 230px; } .pg .pg-ufs { gap: 60px; } .pg .pg-ucol { width: 230px; } }
@media (max-width: 640px) { .pg .pg-ufs { gap: 12px; } .pg .pg-ucol { width: calc(50vw - 20px); } .pg .pg-acts { gap: 10px; } .pg .pg-timers { width: 200px; } .pg .pg-job p { font-size: 13px; } }
.pg-card { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(5,6,9,.62); z-index: 3; } .pg-card.on { display: flex; }
.pg-cin { width: min(620px, 94%); max-height: 92%; overflow: auto; padding: 20px 22px; background: var(--bg, #0f1117); border: 1px solid var(--line2, rgba(255,255,255,.18)); border-radius: 4px; box-shadow: 0 12px 40px rgba(0,0,0,.55); }
.pg-cin h2 { margin: 2px 0 8px; font: 800 24px/1.15 var(--head, system-ui); color: #fff; } .pg-k { display: block; font: 700 11.5px var(--head, system-ui); letter-spacing: .04em; text-transform: uppercase; color: #aab4c0; }
.pg-cin p { margin: 0 0 10px; color: #c2cbd5; font-size: 15px; line-height: 1.45; } .pg-tip { color: #f3c969 !important; }
.pg-who select { min-width: 0; flex: 1; max-width: 420px; }
.pg-jrow { margin-top: 0 !important; } .pg-jrow > span { min-width: 70px; } .pg-jnote { margin: 2px 0 0 !important; font-size: 13px !important; color: #aab4c0 !important; } .pg-jseg button { height: 30px; }
.pg-jobp { display: flex; flex-wrap: wrap; gap: 12px; margin: 10px 0 2px; align-items: flex-start; }
.pg-jmap { flex: 0 1 200px; max-width: 220px; background: #0b0f12; border: 1px solid rgba(255,255,255,.15); } .pg-jmap svg { display: block; width: 100%; height: auto; }
.pg-jhit { cursor: pointer; } .pg-jhit:hover circle:first-of-type { stroke: #fff; }
.pg-jside { flex: 1 1 300px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; } .pg-jside p { margin: 0 !important; font-size: 13.5px !important; } .pg-jside b { color: #fff; }
.pg-jno.on { border-color: #f3c969; color: #f3c969; }
.pg-dpsl { margin: -4px 0 10px !important; } .pg-dpsl b { color: #fff; }
.pg-short0 { margin-top: 12px; } .pg-short { list-style: none; margin: 4px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.pg-short li { position: relative; padding-left: 24px; font-size: 14px; line-height: 1.45; color: #e8edf2; } .pg-short li .pg-gl { position: absolute; left: 0; top: 2px; }
.pg-gl { width: 16px; height: 16px; flex: none; vertical-align: -3px; } .pg-jrow > span .pg-gl { margin-right: 6px; }
.pg-ric { width: 16px; height: 16px; margin-right: 6px; vertical-align: -3px; border: 1px solid rgba(0,0,0,.5); }
.pg-head { position: relative; margin: -20px -22px 10px; padding: 18px 22px 14px; min-height: 92px; background: #0b0e12; border-bottom: 1px solid rgba(255,255,255,.08); overflow: hidden; }
.pg-head > * { position: relative; } .pg-head-art { position: absolute !important; right: -34px; bottom: -78px; height: 250px; width: auto; opacity: .9; pointer-events: none; }
.pg-head .pg-partrow { margin-top: 8px; }
.pg-jmapw { flex: 0 1 220px; max-width: 230px; display: flex; flex-direction: column; gap: 8px; } .pg-jmapw .pg-jmap { max-width: none; flex: none; }
.pg-jcoil { display: flex; align-items: center; gap: 8px; font-size: 12.5px; line-height: 1.35; color: #c2cbd5; } .pg-jcoil svg { width: 84px; height: auto; flex: none; } .pg-jcoil b { color: #fff; font-weight: 600; }
.pg-seg button.on { background: rgba(230,180,80,.16); color: #f3c969; box-shadow: inset 0 0 0 1px rgba(230,180,80,.45); }
.pg-go { height: 40px; padding: 0 26px; font-size: 15.5px; }
.pg-more, .pg-opts { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.08); } .pg-more > summary, .pg-opts > summary { cursor: pointer; list-style: none; font: 700 13.5px var(--head, system-ui); color: #aab4c0; }
.pg-more > summary::-webkit-details-marker, .pg-opts > summary::-webkit-details-marker { display: none; } .pg-more > summary::before, .pg-opts > summary::before { content: '▸  '; } .pg-more[open] > summary::before, .pg-opts[open] > summary::before { content: '▾  '; }
.pg-more > summary:hover, .pg-opts > summary:hover { color: #fff; } .pg-opts summary b { color: #e8edf2; font-weight: 600; } .pg-opts .pg-optrow { margin-top: 8px; }
.pg-row .pg-keys { margin: 0 !important; align-self: center; flex: 1; min-width: 200px; font-size: 12.5px !important; } .pg-jno:disabled { opacity: .45; cursor: not-allowed; } .pg-jteams { display: flex; flex-wrap: wrap; gap: 6px; }
.pg-jhit:focus { outline: none; } .pg-jhit:focus-visible circle:first-of-type { stroke: #fff; stroke-width: 1.2; }
.pg-cin > .pg-row:last-child { position: sticky; bottom: -20px; margin: 14px -22px -20px; padding: 10px 22px 14px; background: var(--bg, #0f1117); border-top: 1px solid rgba(255,255,255,.08); }
.pg-roles { display: flex; gap: 8px; margin: 12px 0; } .pg-role { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid rgba(255,255,255,.2); border-radius: 4px; background: none; color: #fff; cursor: pointer; text-align: left; }
.pg-role b { font: 700 15px var(--head, system-ui); } .pg-role small { font-size: 12.5px; color: #aab4c0; } .pg-role.on { border-color: #f3c969; background: rgba(243,201,105,.08); }
.pg-asg { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 5px; max-height: 230px; overflow: auto; } .pg-asg li { padding: 5px 9px; border-left: 2px solid rgba(243,201,105,.6); font-size: 13.5px; line-height: 1.35; color: #c2cbd5; } .pg-asg li b { display: block; color: #fff; font: 700 13.5px var(--head, system-ui); }
.pg-optrow { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 12px; font-size: 13.5px; color: #aab4c0; }
.pg-seg { display: inline-flex; border: 1px solid rgba(255,255,255,.2); } .pg-seg button { height: 30px; padding: 0 12px; border: 0; background: none; color: #aab4c0; font: 600 13px var(--body, system-ui); cursor: pointer; } .pg-seg button.on { background: rgba(255,255,255,.1); color: #fff; }
.pg-at { height: 30px; padding: 0 8px; border: 1px solid rgba(255,255,255,.2); border-radius: 4px; background: #0f1117; color: #fff; font: 600 13px var(--body, system-ui); }
.pg-keys { margin-top: 10px !important; font-size: 13px !important; color: #8d97a3 !important; }
.pg-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; } .pg-btn { height: 34px; padding: 0 16px; border: 1px solid rgba(255,255,255,.25); border-radius: 4px; background: none; color: #fff; font: 700 14px var(--body, system-ui); cursor: pointer; } .pg-btn:hover { border-color: #f3c969; }
.pg-go { background: #f3c969; border-color: #f3c969; color: #1a1405; }
.pg-cd { background: none; pointer-events: none; } .pg-n { font: 800 110px/1 var(--head, system-ui); color: #fff; text-shadow: 0 4px 30px rgba(0,0,0,.8); }
.pg-grade { display: flex; align-items: center; gap: 16px; margin: 8px 0 12px; } .pg-grade > b { width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; font: 900 46px var(--head, system-ui); border: 2px solid; }
.pg-grade .gS { color: #f3c969; } .pg-grade .gA { color: #7ee08f; } .pg-grade .gB { color: #7fb8ff; } .pg-grade .gC { color: #e0a53a; } .pg-grade .gD { color: #ff8f87; } .pg-grade h2 { margin: 0; } .pg-grade p { margin: 2px 0 0; }
.pg-sum { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; } .pg-sum li { display: flex; gap: 10px; font-size: 14px; } .pg-sum time { min-width: 38px; color: #8d97a3; font-variant-numeric: tabular-nums; } .pg-sum b { display: block; color: #fff; font-weight: 600; } .pg-sum span { display: block; color: #f3c969; font-size: 13px; }
.pg-setup { width: min(560px, 94%); }
.pg-sub { margin: 2px 0 10px !important; font-size: 13.5px !important; color: #aab4c0 !important; }
.pg-sbox { display: flex; flex-direction: column; gap: 10px; margin: 16px 0 2px; }
.pg-srow { display: flex; align-items: center; gap: 12px; } .pg-sl { flex: none; width: 46px; font: 700 12px var(--head, system-ui); letter-spacing: .04em; text-transform: uppercase; color: #aab4c0; }
.pg-tiles { flex: 1; min-width: 0; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 6px; }
.pg-tile { height: 48px; min-width: 0; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 8px; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.03); color: #e8edf2; font: 700 14.5px var(--body, system-ui); cursor: pointer; }
.pg-tile span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pg-tile:hover { border-color: rgba(243,201,105,.7); }
.pg-tile.on { border-color: #f3c969; background: rgba(243,201,105,.12); color: #f3c969; box-shadow: inset 0 0 0 1px #f3c969; } .pg-tile .pg-ric { width: 22px; height: 22px; margin: 0; flex: none; }
.pg-say { margin: 2px 0 0 !important; padding-left: 58px; font-size: 14px !important; line-height: 1.45 !important; color: #c2cbd5 !important; } .pg-say b { color: #fff; }
.pg-srow select.pg-me { flex: 1; min-width: 0; height: 38px; padding: 0 8px; border: 1px solid rgba(255,255,255,.2); background: #0f1117; color: #fff; font: 600 14px var(--body, system-ui); }
.pg-play { width: 100%; height: 60px; margin-top: 16px; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.pg-play b { font: 800 20px var(--head, system-ui); letter-spacing: .02em; color: #1a1405; } .pg-psub { font: 600 13px var(--body, system-ui); color: #3b2f0c; }
.pg-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-top: 12px; }
.pg-chip { height: 28px; display: inline-flex; align-items: center; gap: 6px; padding: 0 10px; border: 1px solid rgba(255,255,255,.18); background: none; color: #aab4c0; font: 600 12.5px var(--body, system-ui); cursor: pointer; }
.pg-chip:hover { color: #fff; border-color: rgba(255,255,255,.4); } .pg-chip select { height: 22px; max-width: 220px; border: 0; background: #0f1117; color: #e8edf2; font: 600 12.5px var(--body, system-ui); }
.pg-setup .pg-keys { text-align: center; margin: 8px 0 0 !important; } .pg-setup .pg-head .pg-part { margin-top: 2px; }
.pg.pg .pg-in :is(.pg-tile, .pg-chip, .pg-play, .pg-chip select, .pg-srow select) { border-radius: 0 !important; }
@media (max-width: 640px) { .pg-srow { flex-direction: column; align-items: stretch; gap: 6px; } .pg-say { padding-left: 0; } .pg-tile { height: 44px; font-size: 13.5px; } }
.pg-3d { position: absolute; inset: 0; display: none; } .pg3 .pg-3d { display: block; } .pg3 .pg-cv { visibility: hidden; }
.pg-vw { position: relative; z-index: 6; display: inline-flex; border: 1px solid rgba(255,255,255,.2); background: #0a0c10; pointer-events: auto; }
.pg-vw button { height: 28px; min-width: 44px; padding: 0 10px; border: 0; background: none; color: #aab4c0; font: 700 13px var(--head, system-ui); cursor: pointer; } .pg-vw button:hover { color: #fff; } .pg-vw button.on { background: rgba(255,255,255,.12); color: #fff; }
.pg-vw.busy button[data-v="3"] { cursor: progress; opacity: .6; } .pg-p2 .pg-vw button[data-v="2"] { display: none; }
.pg-p2kick { margin: 10px 0 2px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; } .pg-p2kick p { margin: 0 !important; font-size: 13.5px !important; } .pg-p2kick b { color: #fff; } .pg-seg button:disabled { opacity: .45; cursor: not-allowed; }
`;
  document.head.appendChild(st);
}
