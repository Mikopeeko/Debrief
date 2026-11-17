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
const PG_HP_K = 735; /* (your frame's health in thousands at full: Flex's own, from his screenshot of his UI, Nov 15) */
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
  // (the team plan's egg places, as the Plan's "Pick up eggs" map draws them (guides.js UL_PAGES.eggs): melee by her, left, right and far as she faces north, the
  // centre carrier about 14 yards in on the quadrant's line and the edge carrier at the rim. GENERAL PLACES, not where eggs land (Flex, Nov 16: "The plans layout is
  // just general locations not exact egg spots remember"): the eggs land at random, one inner and one outer in each quadrant (eggLand), and you take yours)
  planEgg: { m1: [0, 14], m2: [0, 35], r5: [-14, 0], r3: [-41, 0], r6: [14, 0], r4: [41, 0], r1: [0, -14], r2: [0, -40] }, eggQ: { m1: ['melee', 0], m2: ['melee', 1], r5: ['left', 0], r3: ['left', 1], r6: ['right', 0], r4: ['right', 1], r1: ['far', 0], r2: ['far', 1] }, qAx: { melee: 90, left: 180, right: 0, far: 270 },
  // (the coil soak groups, the plan's Egg Clear map (guides.js ulSoaks; Flex, Nov 16: "The guide governs the game", "the only thing from the plan should be the maps
  //  to set up the game", "it should be 4 and 4"): Right Soak #1 takes the first coil with the carriers of the melee and left zones (m1 m2, r5 r3), Left Soak #2 the
  //  next with the right and far zones' (r6 r4, r1 r2); the same teams in both sets; everyone else split evenly, 9 a soak. Before Nov 16, set 1 sent all 8 carriers
  //  to the first coil (a line of guide text), and for an hour the coil walkthrough's groups split them 3 and 5)
  soak: [[['m1', 'm2', 'r5', 'r3', 'h1', 'h3', 'm3', 'm4', 'm5'], ['r6', 'r4', 'r1', 'r2', 'h2', 'h4', 'm6', 'm7', 'r7']],
    [['m1', 'm2', 'r5', 'r3', 'h1', 'h3', 'm3', 'm4', 'm5'], ['r6', 'r4', 'r1', 'r2', 'h2', 'h4', 'm6', 'm7', 'r7']]],
};

// the fight, second by second (the measured top Mythic kills, the guide's plan); east: she surfaces on the east edge
// (Nov 15, Main checked it against the measured Mythic clock, notes/Guides/Bosses/8 Ula'tek.md "Mythic phase 1, measured", the same to half a second on
// every pull: eggs 0:01 · Wretch lands 0:03 (wakes 0:23) · venom beam 0:15 to 0:19 · Mother's Wrath 0:27 · bubble 0:39 · coils 0:40 and 0:43 · Thrash 0:49 ·
// her waves 0:56 · bubble 1:10 · eggs 1:11 · second Wretch 1:12 · dive 1:17 · second beam 1:24 to 1:28 · Mother's Wrath 1:37 · Thrash 1:46 · bubble 1:48 ·
// her waves 1:53 · coils 2:14 and 2:17 · bubble 2:20. tests/practice-game.js holds the game to it)
function pgUlScript(o) {
  // (the sides, from the run's seed so a run can be replayed: where she surfaces, her tail's side in set 1 (west or east, about even), and which coil of
  // each set appears first; Flex: "whichever appears first is the one gets soaked", team 1 takes it)
  const rnd = pgRng(o.seed || 1), side = pgRng(((o.seed || 1) * 7919 + 13) >>> 0), sr = [side(), side(), side(), side()], eggRnd = pgRng(((o.seed || 1) * 104729 + 71) >>> 0);
  const east = o.east != null ? !!o.east : sr[0] < 0.5, tailEast = o.tailEast != null ? !!o.tailEast : sr[1] < 0.5, first = Array.isArray(o.first) ? o.first.map((x) => !!x) : [sr[2] < 0.5, sr[3] < 0.5];
  const ROT = east ? -90 : 90, SURF = 85.8, DIVE = 77, rotAt = (t) => (t < SURF ? 0 : ROT), F = (p, t) => pgRot(p, rotAt(t));
  // (her tail's frame: the plan's spots are for a tail on the west; set 1 mirrors them when it rises east, set 2 turns them to the south after her turn)
  const FT = (p, t) => (t < SURF ? (tailEast ? [-p[0], p[1]] : [p[0], p[1]]) : east ? [p[1], p[0]] : [-p[1], p[0]]);
  // (her tank: t1 until the dive; then the tank who took the first Mother's Wrath soaks the second beam and takes the new tail, and the other has her)
  const S = { ROT, SURF, rotAt, F, FT, end: 165, east, tailEast, first, seed: o.seed || 1, herTank: (t) => (t < DIVE ? 't1' : 't2') };
  S.casts = []; S.warns = []; S.timers = []; S.waves = []; S.impacts = []; S.soaks = []; S.bubbles = []; S.thrash = []; S.wrath = []; S.tails = []; S.beams = []; S.pulses = [];
  // (a call: "Mechanic: ORDER", the order is the big line (the prompts audit, Nov 16). Red for danger on or near you, neutral for the raid, green for safe; a call is
  //  gold only when it is marked as yours (o.me, or o.per(id) -> { text, me } worked out for the player as it fires), never because it says "you". o.at: the moment
  //  a call is about, so it waits while a step of yours comes first (warns() in pgOpen); o.tail: a small tail's call, shown only when its lanes come near you)
  const cast = (who, name, t0, t1) => S.casts.push({ who, name, t0, t1 }), warn = (t, text, c, o) => S.warns.push({ t, text, c: c || '#ff8f87', ...(o || {}) }), timer = (t, name) => S.timers.push({ t, name });
  const RED = '#ff8f87', NEU = '#e8edf2', GRN = '#7ee08f';
  const cres = (w) => { const n = Math.max(1, Math.round(w / 7)), wd = w / n, out = []; for (let i = 0; i < n; i++) out.push([-w / 2 + wd * i + (i ? 0.6 : 0), -w / 2 + wd * (i + 1) - (i < n - 1 ? 0.6 : 0)]); return out; };
  // eggs: Call of the Serpent, 8 eggs into the carriers' zones (they turn with her), 4-yard landings, a shell for 3.6 s
  S.eggSets = [{ cast: 1, land: 10, rot: 0 }, { cast: 71, land: 80, rot: ROT }].map((e, si) => ({ ...e, si, eggs: Object.keys(PG_UL.eggO).map((id, i) => { const [z, out] = PG_UL.eggQ[id], a = (PG_UL.qAx[z] + (eggRnd() * 2 - 1) * 28) * Math.PI / 180, dd = out ? 24 + eggRnd() * 10 : 9 + eggRnd() * 9;
    const p = PG_UL.inward(pgRot([Math.cos(a) * dd, Math.sin(a) * dd], e.rot)); /* (at random in your quadrant, the inner or the outer one (Flex, Nov 16: the Plan's places are general)) */ return { id, x: p[0], y: p[1], land: e.land + (i % 3) * 0.7, shell: e.land + (i % 3) * 0.7 + 3.6 }; }) }));
  S.eggSets.forEach((e) => { cast('boss', 'Call of the Serpent', e.cast, e.cast + 1.4); warn(e.cast, 'Call of the Serpent: dodge the falling eggs!', RED, { per: (id) => (PG_UL.eggO[id] ? { text: 'Your egg: wait next to its gold circle!', me: true } : null) }); timer(e.land, 'Eggs land'); });
  // the Wretches: Toxic Womb lands in the middle (7 yards) at 0:03 and 1:12, it wakes 20 s later; a spectral image beams it, five impacts a second apart
  // (0:15 to 0:19, 1:24 to 1:28), all on one tank: the off tank first, then the tank who took the first Mother's Wrath. The old Wretch dies as the new one lands.
  // (the guide: the first image rises on her tail's side, so the raid knows early where the coils will be)
  const IMG = [UL_EDGE.NW, UL_EDGE.SE];
  S.wretches = [{ id: 'w1', cast: 1.8, land: 3, awake: 23, dies: 73, img: FT(IMG[0], 15), beam: 15, tank: 't2' }, { id: 'w2', cast: 70.8, land: 72, awake: 92, dies: 160 /* (the raid kills it in the heart burn, before its third bubble at about 2:52: an estimate, engine.js "dies between the second and third bubble") */, img: IMG[1], beam: 84, tank: S.herTank(27) }];
  S.wretches.forEach((w, wi) => { cast('boss', 'Toxic Womb', w.cast, w.cast + 1.2); warn(w.cast, 'Toxic Womb: stay out of the middle!', RED); timer(w.land, 'Toxic Womb lands');
    S.impacts.push({ x: 0, y: 0, r: 7, t0: w.cast + 0.4, at: w.land, name: 'Toxic Womb', dmg: 50, color: '#c8a36a', tip: 'Stay out of its 7 yards: the Womb lands in the middle.' });
    const B = [w.img[0] + (0 - w.img[0]) * 0.34, w.img[1] + (0 - w.img[1]) * 0.34], ba = Math.atan2(-w.img[1], -w.img[0]) * 180 / Math.PI; w.B = B;
    S.beams.push({ from: w.img, to: [0, 0], at: B, t0: w.beam - 0.4, t1: w.beam + 4.3, hits: [0, 1, 2, 3, 4].map((i) => w.beam + i), wretch: w.id, tank: w.tank });
    warn(w.beam - 2, 'Venom beam: stay out of the line and its side waves!', RED); timer(w.beam, 'Venom beam');
    for (let i = 0; i < 5; i++) [90, -90].forEach((a) => S.waves.push({ kind: 'incub', tank: w.tank, warn: 1.5, x: B[0], y: B[1], deg: ba + a, v: 12.5, w: 10, d: 5, cres: cres(10), t0: w.beam + i, t1: w.beam + 9.5 + i, name: 'Caustic Waves from the off tank', tip: 'The off tank\'s beam sends waves out sideways: stay clear of their lanes.' })); });
  // (the random eggs land clear of the venom beam's spot, where the beam tank has to stand: one landed on the 1:24 beam spot (Nov 16). Turned round the middle
  //  in 12-degree steps until 8 yards clear, staying in the same quadrant band)
  //  (and clear of the beam tank's walk to the second beam: at the dive her tank runs from in front of her straight to that spot, a tight 7 s; an egg landing on
  //  the way at 1:20 held it up and the first impact missed it)
  const segD = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy || 1))); return Math.hypot(p[0] - a[0] - vx * u, p[1] - a[1] - vy * u); };
  const eggBad = (e, si) => S.beams.some((bm) => Math.hypot(e.x - bm.at[0], e.y - bm.at[1]) < 8) || (si === 1 && S.beams[1] && segD([e.x, e.y], [0, 34], S.beams[1].at) < 6);
  // (an egg kept off them moves within its own quadrant: at most 40 degrees off its axis, in its inner or outer band. Before, it turned up to 60 degrees,
  //  and a third of set 2's inner eggs landed in the next quadrant (the map review, Nov 16))
  S.eggSets.forEach((st, si) => st.eggs.forEach((e) => { if (!eggBad(e, si)) return; const [z, out] = PG_UL.eggQ[e.id], l0 = pgRot([e.x, e.y], -st.rot), a0 = Math.atan2(l0[1], l0[0]) * 180 / Math.PI, d0 = Math.hypot(l0[0], l0[1]);
    const off = (a) => ((a - PG_UL.qAx[z]) % 360 + 540) % 360 - 180, R = out ? [22, 36] : [7, 20], C = [];
    [0, 12, -12, 24, -24, 36, -36, 48, -48].forEach((da) => [1, 0.8, 1.25, 0.65, 1.45].forEach((f) => { const a = a0 + da; if (Math.abs(off(a)) <= 40) C.push([Math.abs(da) / 12 + Math.abs(f - 1) * 3, a, Math.max(R[0], Math.min(R[1], d0 * f))]); }));
    C.sort((p, q) => p[0] - q[0]); for (const [, a, d] of C) { const q = PG_UL.inward(pgRot([Math.cos(a * Math.PI / 180) * d, Math.sin(a * Math.PI / 180) * d], st.rot)); if (!eggBad({ x: q[0], y: q[1] }, si)) { e.x = q[0]; e.y = q[1]; return; } } }));
  // the bubbles (Fester Burst, 4 s cast, 10 yards round the Wretch) at 0:39, 1:10, 1:48 and 2:20: on the first coil's circle (by her tail, whichever coil comes
  // first); in the middle by her; the second Wretch held by her tank 20 yards in front of her new spot (measured 17 to 22, and 46 to 53 from the new tail), the
  // raid on it from the Thrash's cast so the Thrash only hits them small; between the second coil circles. `tank`: who holds the Wretch there
  const B1 = (p) => FT(first[0] ? [p[0], -p[1]] : p, 30);
  [{ w: 'w1', t0: 35, at: 39, p: B1([-26, 2]), m: B1, tank: 't2' }, { w: 'w1', t0: 66, at: 70, p: [4, 20], tank: 't2' }, { w: 'w2', t0: 104, at: 108, p: F([0, 26], 108), tank: S.herTank(108), stack: 101.5 },
    { w: 'w2', t0: 136, at: 140, p: FT([-25, 0], 140), tank: S.herTank(108) === 't1' ? 't2' : 't1' }].forEach((b) => {
    S.bubbles.push(b); cast('wretch', 'Fester Burst', b.t0, b.at); if (!b.stack) warn(b.t0, 'Fester Burst: get in the bubble!', NEU, { at: b.at }); /* (the 1:48 one has its own call at 1:41: run to it) */ timer(b.at, 'Bubble'); });
  // Mother's Wrath: 5 s cast, her tank knocked back, then five bites in her reach (the red circle in front of her)
  [22, 92].forEach((t) => { cast('boss', 'Mother\'s Wrath', t, t + 5); warn(t, 'Mother\'s Wrath: stay out of her reach!', RED); timer(t + 5, 'Her bites'); S.wrath.push({ t0: t, at: t + 5, p: F(PG_UL.reach, t + 1), tank: S.herTank(t + 5) }); });
  // Spectral Coils: two 10-yard soaks beside her tail, wherever it is (set 1 west or east, set 2 south), slamming 0:40 and 0:43, 2:14 and 2:17; either one can
  // appear first, and team 1 soaks the first to appear (Flex); Soul Constrictor 5 s on Mythic; carried eggs break
  // (the coil call says which one is yours, in gold: the prompts audit, Nov 16, found "team 1 takes the first coil to appear" the same, in white, for both teams)
  [{ set: 0, cast: 36, a: 40, b: 43 }, { set: 1, cast: 130, a: 134, b: 137 }].forEach((c) => { cast('tail', 'Spectral Coils', c.cast, c.cast + 0.8);
    warn(c.cast, 'Spectral Coils: stay out of both circles!', RED, { per: (id) => { const k = S.soaks.filter((q) => q.set === c.set).findIndex((q) => q.group.includes(id)); return k === 0 ? { text: 'Your coil: soak the first one to appear!', me: true } : k === 1 ? { text: 'Your coil: stay out of the first one, soak the second!', me: true } : null; } });
    const P0 = first[c.set] ? PG_UL.soakB : PG_UL.soakA, P1 = first[c.set] ? PG_UL.soakA : PG_UL.soakB;
    [[c.a, P0, 0], [c.b, P1, 1]].forEach(([at, p, k]) => { const q = FT(p, at); S.soaks.push({ set: c.set, k, x: q[0], y: q[1], r: 10, t0: k ? c.a - 0.6 : c.cast + 0.8, at, cast: c.cast, group: (o.soakSets && o.soakSets[c.set] && o.soakSets[c.set][k]) || (o.soak && o.soak[k] && o.soak[k].length ? o.soak[k] : PG_UL.soak[c.set][k]) }); timer(at, 'Coil slam ' + (k + 1)); }); });
  // Mephitic Thrash: her tail sweeps 35 yards (a big hit and a knockback): everyone near it runs out, its tank too
  warn(101, 'Fester Burst: run to the Wretch in front of her!', NEU, { at: 108 }); /* (the 1:48 stack that wiped Wolfthorn's pulls 7, 8 and 10: its bubble is outside the tail's sweep) */
  [45, 102].forEach((t) => { const p = FT(PG_UL.tail, t); cast('tail', 'Mephitic Thrash', t, t + 4); warn(t, 'Mephitic Thrash: run away from her tail!', RED); timer(t + 4, 'Tail sweep'); S.thrash.push({ t0: t, at: t + 4, x: p[0], y: p[1], r: 35 }); });
  // Caustic Waves: 6 s cast, she pulls one wing back; that half gets two waves first, the other half 6.5 s later, rolling away from her
  S.wings = [];
  [50, 107].forEach((t) => { const west = rnd() < 0.5, T0 = t + 6, rot = rotAt(T0), d1 = pgRot([west ? -1 : 1, 0], rot), side = (v) => (Math.abs(v[0]) > Math.abs(v[1]) ? (v[0] < 0 ? 'WEST' : 'EAST') : (v[1] < 0 ? 'SOUTH' : 'NORTH')), wFirst = side(d1), wSafe = side([-d1[0], -d1[1]]);
    S.wings.push({ t, west, first: wFirst, safe: wSafe, d1 }); /* (the half of the room her first waves come down, turned with her after the dive) */
    // (no compass words in the calls: the floor shows the halves red and green, and the camera turns. Two steps, each with its moment (the prompts audit, Nov 16):
    //  wait in the green half, then, as the first wave goes by and the floor swaps (halvesAt, 10.5 s into her cast), cross now)
    cast('boss', 'Caustic Waves', t, T0); warn(t, 'Her waves: wait in the green half!', GRN); warn(t + 10.5, 'Her waves: cross into the green half now!', GRN); timer(T0, 'Her waves'); timer(T0 + 6.5, 'Her waves (second half)');
    const first = west ? [-12, -36] : [12, 36], second = west ? [12, 36] : [-12, -36];
    [[first, T0], [second, T0 + 6.5]].forEach(([xs, t0]) => xs.forEach((x) => { const p = pgRot([x, 46], rot); S.waves.push({ kind: 'her', x: p[0], y: p[1], deg: 270 + rot, v: 12.5, w: 24, d: 5, cres: cres(24), warn: 2.2, t0, t1: t0 + 7.6, name: 'Caustic Waves', tip: 'Wait on the half that goes second, then cross behind the first wave.' }); })); });
  // the small tails (Gore Rattle), from the 12 measured top Mythic kills (notes/Guides/Bosses/8 Ula'tek.md, "Tail waves"): each rises at the
  // edge 2.4 s before it fires and on Mythic sends 3 straight waves (game data: "reduced to 3 on Mythic"), 12.5 yards a second, about 9 yards
  // wide: its logged heading and two more at random. Spots in her-north yards (after the dive and in the heart burn, the measured her-west
  // spots turned back); the tail that comes with her waves rises on her west or east edge and goes straight across.
  // (Main's playtest, Nov 15: the small tails fire "a short fan of about 3 waves, along fixed lines from 8 fixed edge spots", the guide's UL_TAIL_SETS from
  //  130 Mythic kills: each fan about 15 degrees apart round its facing (the measured angles where the logs resolve them: E at 1:09 18/28/44, N after the
  //  dive 10/25/38), crescents 7 yards wide that run 9.5 s; the pair at 0:37.8 just before the first coils is in too. These spots and facings already
  //  matched the guide; the fan was three random lines 20 to 65 degrees apart)
  const withHer = () => (rnd() < 0.5 ? [[-40.8, -0.4], 0] : [[39.9, -0.7], 180]), FAN = [-15, 0, 15];
  [[37.8, [[[54.8, 0.2], 180], [[39.6, 40.1], 206.3]], 1], [56, [withHer()]], [58.6, [[[-39.7, -40.2], 64.6], [[38.5, -39.6], 114]]], [69, [[[-55.8, -0.4], 39.4], [[54.8, -0.7], 139.2, [18, 28, 44]]]],
    [113, [withHer()]], [115.6, [[[-0.7, -54.8], 90.5], [[39.2, -39.6], 115.7]]], [126, [[[55.8, 0.1], 141.5, [10, 25, 38]], [[-39.6, -38.5], 65.8]]], [131.5, [[[-0.4, 55.8], 233.7], [[38.9, 39.5], 206.2]]],
    [143.7, [[[-0.7, -54.8], 90.5], [[39.2, -39.6], 115.7]]], [156.8, [[[-39.6, -38.5], 65.8], [[55.8, 0.1], 141.5, [10, 25, 38]]]]].forEach(([t, ts, side]) => { timer(t, 'Small tails'); /* (side: measured on pulls with her tail west, so it mirrors with her tail east: the 0:37.8 pair fires across the room into the coils' side, reaching the soaks after both slams) */
    warn(t - 2.4, 'Small tails: dodge the red lanes!', RED, { tail: t }); /* (as they rise, for a player their lanes come near: the prompts audit, Nov 16, the most common mistake had no words) */
    ts.forEach(([q, hd, fan]) => { const p = side ? FT(q, t) : F(q, t), h = side && tailEast ? 180 - hd : hd + rotAt(t); S.tails.push({ x: p[0], y: p[1], t0: t - 2.4, at: t });
      (fan || FAN).forEach((off) => S.waves.push({ kind: 'tail', x: p[0], y: p[1], deg: h + off, v: 12.5, w: 7, d: 4, cres: cres(7), warn: 2.4, t0: t, t1: t + 9.5, name: 'Caustic Waves from a small tail', tip: 'A small tail rising at the edge fires a short fan of three waves 2.4 s later, on the same lines every pull: step out of their red lanes.' })); }); });
  // the dive: Submerge, bubbles where she'll come up, she surfaces on the other side; her tank has to be there first
  S.dive = { t0: 77, gone: 78.6, surf: SURF, to: pgRot(PG_UL.boss, ROT) }; cast('boss', 'Submerge', 77, 78.6); warn(77, 'Ula\'tek dives: watch where the bubbles rise!', NEU); warn(SURF, 'Ula\'tek surfaces: face her new spot, where the bubbles were!', NEU); timer(SURF, 'She surfaces');
  // Rage of the Shackled: 6.5 s cast, then her heart is open for 20 s; raid damage every 4 s; Falling Debris (7 yards) all over
  // (the call that says hit it comes as it opens: the prompts audit, Nov 16, found the 2:19 call gone from the screen when the heart opened at 2:25.5)
  cast('boss', 'Rage of the Shackled', 139, 145.5); warn(139, 'Rage of the Shackled: get ready to hit the heart!', NEU, { at: 145.5 }); warn(145.5, 'Heart open: hit it now (Tab, then 1)!', NEU); timer(145.5, 'Heart open');
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
    mistake: (...a) => mistake(...a), hurt: (n) => hurt(n), deb: (...a) => deb(...a), has: (k) => has(k), say: (...a) => say(...a), sfx: (k) => sfx(k), $: (s) => $(s), hud: (f) => hud(f), clearTarget: () => { target = null; },
    big: (text, c) => bigCall(text, c), nm: (id) => nm(id),
    /* (the prompts audit, Nov 16: your arrow as the screen draws it ({ T, d, what, wait, fin, rad }: wait true while the way is blocked, a wave crossing it or no way round, so the floor says Wait),
       and pathClear(from, to, s): true when walking from one spot to the other meets no wave in the next s seconds (2 by default), no other carrier's ring
       while you carry, and in phase 1 no coil that isn't yours) */
    hint: () => hintNow(), pathClear: (a, b, s) => pathClear(a, b, s) }; /* (phase 2's big calls (your kick, the backup, the five's defensive) and the bots' names on its Interrupted labels) */
  const P2 = part.mod ? part.mod(P2API) : null;
  const ov = document.createElement('div'); ov.className = 'pg' + (P2 ? ' pg-p2' : ''); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Practice ' + boss + ' ' + part.name);
  // (the screen, laid out like a raider's UI (Nov 15, Flex: "Player healthbar and target bar in the middle, hotbars with spells on them for the attack/sprint/
  // defensive. Boss mods. Etc. Nothing fancy, just a better more familiar layout"): top right the minimap, the 2D | 3D switch and your mistakes, then her boss
  // frame; on the left the boss-mod timer bars; bottom centre your job, then your frame and your target's side by side (her cast bar under the target), then
  // the action bar, filled in once your role is known (actsHtml))
  const HUD = '<div class="pg-in"><canvas class="pg-cv"></canvas><div class="pg-3d"></div>' +
    '<div class="pg-tr"><canvas class="pg-mini" width="200" height="200"></canvas><div class="pg-trow"><div class="pg-vw" role="group" aria-label="View"><button type="button" data-v="2" class="on">2D</button><button type="button" data-v="3" title="3D: drag to turn the camera, W walks where it looks">3D</button></div>' +
    '<button type="button" class="pg-snd on" aria-pressed="true" title="Sound cues, like a boss mod (M)">Sound</button><div class="pg-mis" title="Your mistakes so far"><b class="pg-mc">0</b><span>Mistakes</span></div></div>' +
    '<div class="pg-bossf"><div class="pg-nm"><b>' + esc(boss) + '</b><span class="pg-clk">0:00</span></div><div class="pg-bar pg-bhp" data-n="' + esc(boss) + '"><i></i><span></span></div></div></div>' +
    '<button type="button" class="pg-x" aria-label="Close">✕</button><div class="pg-timers"></div>' +
    '<div class="pg-warn" aria-live="polite"></div><div class="pg-float"></div>' +
    '<div class="pg-bot"><div class="pg-job"><span>Your job now</span><p></p><p class="pg-nx"></p></div>' +
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
  // ---- the setup: the guide governs the game (Flex, Nov 16: "The game should not be pulling from the teams set plan, it should only use the maps as the
  // setup", "The guide governs the game"): the raid, the egg zones, the coil soak groups and the bubbles come from the guide's maps, never from a plan made
  // on the Plan page. (Before Nov 16 a signed-in raider's team plan replaced them, and its two coil teams soaked both coil sets as they were.) ----
  let teamWhy = 'the guide governs the game', pickedMe = false; /* (for the audit) */
  const TEAM = null;
  const nm = (id) => (TEAM && TEAM.id2[id] ? String(TEAM.id2[id].n).split('-')[0] : gdzName(id));
  const rl = (id) => { const q = TEAM && TEAM.id2[id]; return q ? (q.role === 'tank' ? 't' : q.role === 'healer' ? 'h' : q.kind === 'melee' ? 'm' : 'r') : id === me && jobMine() ? myJob.role : id[0]; };
  const clsC = (id) => { const q = TEAM && TEAM.id2[id], c = q && E.CLASSES && E.CLASSES[q.cls]; return c ? c[1] : null; };
  // (the quadrants by name only, as the setup's maps say them: they turn with her dive, so a compass word was wrong for the 1:20 egg. The release sweep, Nov 16:
  //  the frame said "left (west)" all pull while that egg landed north)
  const ZN = { m1: ['by her', 'inner'], m2: ['by her', 'outer'], r5: ['left quadrant', 'inner'], r3: ['left quadrant', 'outer'], r6: ['right quadrant', 'inner'], r4: ['right quadrant', 'outer'], r1: ['far quadrant', 'inner'], r2: ['far quadrant', 'outer'] };
  const teamRole = (id) => { const sk = PG_UL.soak[0][0].includes(id) ? 1 : PG_UL.soak[0][1].includes(id) ? 2 : 0; return { id, name: nm(id), job: (carrierOf(id) ? 'Egg carrier, ' + ZN[id][0] : rl(id) === 'h' ? 'Healer' : rl(id) === 't' ? 'Tank' : 'No egg') + (sk ? ' · soak #' + sk : '') }; };
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
  const eggTeam = (slot) => (PG_UL.soak[0][1].includes(slot) ? 2 : 1); /* (an egg zone's coil team on the plan's Egg Clear map: melee and left Soak #1, right and far Soak #2) */
  const myTeam = () => (myJob.egg && PG_UL.eggO[myJob.egg] ? eggTeam(myJob.egg) : myJob.soak[1] === 2 ? 2 : 1); /* (your coil: your egg's team, else your pick) */
  const jobSoak = (slot, j) => PG_UL.soak.map((two, si) => { const g = [two[0].slice(), two[1].slice()], have = g[0].includes(slot) ? 0 : g[1].includes(slot) ? 1 : -1, want = PG_UL.eggO[slot] && have >= 0 ? have : j.soak[si] === 2 ? 1 : 0; /* (a carrier: their zone's group, as the guide's map has it) */
    if (have === want) return g; if (have < 0) { g[want].push(slot); return g; }
    const car = (x) => !!PG_UL.eggO[x], pool = g[want], mate = pool.find((x) => car(x) === car(slot) && x[0] === slot[0]) || pool.find((x) => car(x) === car(slot)) || pool[pool.length - 1];
    g[have] = g[have].filter((x) => x !== slot).concat([mate]); g[want] = g[want].filter((x) => x !== mate).concat([slot]); return g; });
  const jobRole = (j) => { const slot = jobSlot(j), sk = jobSoak(slot, j), RN = { m: 'Melee', r: 'Ranged', h: 'Healer' }, t1 = sk[0][0].includes(slot) ? 1 : 2, t2 = sk[1][0].includes(slot) ? 1 : 2; /* (Main, Nov 15: "then 1" read oddly) */
    return { id: slot, name: RN[j.role], job: (j.egg ? 'Egg carrier, ' + ZN[slot][0] + ', ' + ZN[slot][1] + ' spot' : 'No egg') + ' · coil team ' + t1 + (t2 !== t1 ? ', then team ' + t2 : '') }; };
  const newG = () => { G = { t: 0, hp: 100, x: 0, y: 0, debs: {}, log: [], deaths: 0, done: new Set(), eggs: [], adds: [], bots: {}, wr: {}, kb: null, sprint: -99, def: -99, fx: [], warnI: 0, bossHp: 100, still: true, vipers: 0 };
    S.eggSets.forEach((e) => e.eggs.forEach((q) => G.eggs.push({ ...q, set: e.si, state: 'air', who: null })));
    GDZ_RAID.forEach((id) => { const p = homeOf(id, 0); G.bots[id] = { id, x: p[0], y: p[1], esc: null }; });
    const p0 = homeOf(me, 0); G.x = p0[0]; G.y = p0[1]; target = null; keys = {}; cam = null; if (P2) P2.init(G); };
  const reset = (o) => { o = o || {}; S = (P2 ? P2.script : pgUlScript)({ east: o.east, tailEast: o.tailEast, first: o.first, seed: o.seed || ((Date.now() & 0xffff) || 7), soakSets: jobMine() ? jobSoak(me, myJob) : null }); newG(); };
  // where each raider stands when nothing is happening: her tank in front of her, melee round her, carriers in their zones, the rest inside; turned with her
  const homeOf = (id, t) => { if (P2) return P2.home(id, t); const rot = S.rotAt(t), egg = G && G.eggs.find((e) => (e.who === id && e.state === 'held') || (e.id === id && e.state !== 'gone' && e.state !== 'held' && e.land - t < 14));
    // (an egg carrier waits and holds the first set's egg at the Plan's place for it, where the setup's ring is: the map review, Nov 16, found the game holding
    //  carriers on another guide's zone-defence spots, 4 to 20 yards from their ring (Flex: "make sure the maps are placed properly it looks off"). The
    //  second set keeps the zone spots: on the Plan's places, turned with her dive, m2 stood in her reach at 1:37 and r1 and r6 met at 1:25)
    return PG_UL.inward(pgRot(carrierOf(id) && egg ? (egg.set === 0 && PG_UL.planEgg[id]) || UX_ZONE[id] : UX_HOME[id], rot)); };
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
  // (Flex, Nov 15: "The eggs have to be damaged to break the shield in order to get picked up": your egg's Hardened shell has 5 health; the raid chips 0.4 a
  //  second, so with your hits (one a second) it opens in about 3.6 s, as on the kills, and in about 12 s without them. "the player should get an AOE
  //  ability" with "a short cooldown": 2 hits everything within 8 yards of your target, every 8 s. "if a viper hatches the tank should taunt it and then the
  //  group kills it": the off tank taunts it 2 s after it hatches, and the raid kills it faster once it's on the tank)
  const SHELL = { hp: 5, raid: 0.4 }, AOE = { cd: 8, r: 8 }, TAUNT = { at: 2, drain: 0.6 };
  const shellsOn = () => !P2 || !!P2.eggShells; /* (phase 1 always; a later part opts in with eggShells) */
  const myShell = () => (G && shellsOn() ? G.eggs.find((e) => e.id === me && e.state === 'floor' && e.shp > 0) || null : null);
  const tgtList0 = (t) => { if (P2) return P2.tgts(t); /* (a later part's own targets and moments: src/practice-p2.js) */ const L = [], B = bossAt(t), TL = tailAt(t);
    G.adds.forEach((a) => { a.id = a.id || 'a' + (G.addN = (G.addN || 0) + 1); const mx = ADD_HP[a.kind] || 3; if (a.hp == null) a.hp = mx; L.push({ key: a.id, kind: a.kind, name: a.kind === 'viper' ? 'Blightscale Viper' : 'Blightscale Rawling', p: [a.x, a.y], r: a.kind === 'viper' ? 1.6 : 1.1, hp: a.hp, max: mx }); });
    if (t >= 145.5 && t < 165) L.push({ key: 'heart', kind: 'heart', name: 'Venomous Heart', p: S.F(PG_UL.heart, t), r: 3 });
    S.wretches.forEach((w) => { const c = G.wr[w.id]; if (c && t >= w.awake) L.push({ key: w.id, kind: 'wretch', name: 'Blightscale Wretch', p: [c.x, c.y], r: 2.2 }); });
    if (B.up) L.push({ key: 'boss', kind: 'boss', name: 'Ula\'tek', p: B.p, r: 6.5 }); if (TL.up) L.push({ key: 'tail', kind: 'tail', name: 'Gore Rattle', p: TL.p, r: 3.4 });
    return L; };
  // (the Nov 15 audit: the Wretches died on their own and your hits on them did nothing; their last 10 s are now a moment to help kill them)
  const tgtList = (t) => { const L = tgtList0(t).slice(), e = myShell(); if (e) L.push({ key: 'egg', kind: 'egg', name: 'Your egg (Hardened shell)', p: [e.x, e.y], r: 1, hp: e.shp, max: e.shpMax }); return L; };
  const wretchDying = (t) => S.wretches.some((w) => t >= w.dies - 10 && t < w.dies && t >= w.awake && G.wr[w.id]);
  const dpsCat = (t) => (myShell() && !G.adds.some((a) => a.kind === 'viper') ? 'egg' : P2 ? P2.dpsCat(t) : G.adds.some((a) => a.kind === 'viper') ? 'viper' : t >= 145.5 && t < 165 ? 'heart' : G.adds.some((a) => a.kind === 'rawling') ? 'rawling' : wretchDying(t) ? 'wretch' : null);
  const DPS_SAY = { egg: ['Break your egg', 'Your egg\'s shell was up', 'Your egg lands with a Hardened shell: press Tab to pick it, then keep pressing 1 (and 2, your area attack) until it breaks, then walk over it.', 'it'], viper: ['Kill the Viper', 'A Viper was up', 'Vipers are deadly: press Tab to pick it, then keep pressing 1 until it dies.'], heart: ['Hit the heart', 'The heart was open', 'When her heart opens, press Tab to pick the Venomous Heart, then keep pressing 1 while you stay in range.'],
    rawling: ['Kill the Rawlings', 'Rawlings were up', 'Each broken egg leaves a Rawling: press Tab to pick one, then keep pressing 1 until they die.'],
    wretch: ['Kill the Wretch', 'The Wretch was going down', 'Help kill each Wretch before its third bubble: press Tab to pick it, then keep pressing 1.', 'it'] };
  const isRight = (cat, o) => !!o && (cat === 'heart' ? o.key === 'heart' : o.kind === cat);
  const inRange = (o) => pgDist([G.x, G.y], o.p) - o.r <= (rl(me) === 'm' ? 5 : 40);
  const tgtNow = (t) => (G.tgt ? tgtList(t).find((o) => o.key === G.tgt) || null : null);
  const GCD = 1; /* (one hit a press, then the button cools down for a second, like a spell on a WoW action bar) */
  const onRight = (cat, o) => !!cat && isRight(cat, o) && inRange(o) && G.lastHitCat === cat && G.t - (G.lastHitT == null ? -99 : G.lastHitT) <= GCD + 0.6;
  const nearestRight = (t) => { const cat = dpsCat(t), L = tgtList(t), d = (o) => pgDist([G.x, G.y], o.p); return (cat ? L.filter((o) => isRight(cat, o)) : L.filter((o) => o.kind !== 'boss' && o.kind !== 'tail')).sort((a, b) => d(a) - d(b))[0] || L.sort((a, b) => d(a) - d(b))[0] || null; };
  const atkKey = () => { if (!G) return false; if (has('stun')) { if (!window.__pgAuto) say('You\'re stunned: you can\'t attack.', true); return false; } /* (stunned, as by an Anguished Cry nobody kicked: no attacks, Nov 15 audit) */ const t = G.t; let o = tgtNow(t); if (!o) { o = nearestRight(t); if (o) G.tgt = o.key; } if (!o) return false;
    if (t - (G.gcd0 == null ? -99 : G.gcd0) < GCD) return false; /* (still cooling down) */
    if (!inRange(o)) { if (!window.__pgAuto) say(rl(me) === 'm' ? 'Too far: get close to it, then press 1.' : 'Too far away: get closer.', true); return false; }
    G.gcd0 = t; hitTgt(o, t); hud(true); return true; };
  const hitTgt = (o, t, quiet) => { if (!quiet) feel(rl(me) === 'm' ? 'slash' : rl(me) === 'h' ? 'holy' : 'fire'); if (!quiet) (G.hitFx = G.hitFx || []).push({ x0: G.x, y0: G.y, x1: o.p[0], y1: o.p[1], r: o.r, t0: t, melee: rl(me) === 'm' });
    const cat = dpsCat(t); G.hits = (G.hits || 0) + 1; if (!quiet) { G.lastHitT = t; G.lastHitCat = cat && isRight(cat, o) ? cat : null; } /* (the area attack's extra hits don't change what you're on) */
    const a = G.adds.find((q) => q.id === o.key); if (a) { a.hp = (a.hp == null ? ADD_HP[a.kind] || 3 : a.hp) - 1; if (a.hp <= 0) { G.adds = G.adds.filter((q) => q !== a); G.kills = (G.kills || 0) + 1; say((a.kind === 'viper' ? 'Viper' : 'Rawling') + ' killed.');
      const c2 = dpsCat(t), nx = c2 ? nearestRight(t) : null; G.tgt = nx && isRight(c2, nx) ? nx.key : null; } } /* (training wheels: after a kill your target moves on to the next one that matters) */
    else if (o.key === 'heart') G.heartHits = (G.heartHits || 0) + 1; else if (o.kind === 'egg') shellHit(1, t); else if (P2 && P2.hit) P2.hit(o.key); };
  const aoeLeft = (t) => Math.max(0, AOE.cd - (t - (G.aoe0 == null ? -99 : G.aoe0)));
  const aoeKey = () => { if (!G) return false; if (has('stun')) { if (!window.__pgAuto) say('You\'re stunned: you can\'t attack.', true); return false; } const t = G.t; let o = tgtNow(t); if (!o) { o = nearestRight(t); if (o) G.tgt = o.key; } if (!o) return false;
    if (aoeLeft(t) > 0) { if (!window.__pgAuto) say('Area attack isn\'t ready yet.', true); return false; } if (t - (G.gcd0 == null ? -99 : G.gcd0) < GCD) return false;
    if (!inRange(o)) { if (!window.__pgAuto) say(rl(me) === 'm' ? 'Too far: get close to it, then press 2.' : 'Too far away: get closer.', true); return false; }
    G.aoe0 = t; G.gcd0 = t; const c = o.p.slice(), L = tgtList(t).filter((q) => q.key !== o.key && q.kind !== 'boss' && q.kind !== 'tail' && q.kind !== 'heart' && pgDist(q.p, c) - (q.r || 0) <= AOE.r);
    hitTgt(o, t); L.forEach((q) => hitTgt(q, t, true)); feel('whirl'); (G.aoeFx = G.aoeFx || []).push({ x: c[0], y: c[1], r: AOE.r, t0: t, n: L.length + 1 }); hud(true); return true; };
  const aoeWorth = (t) => { const o = tgtNow(t); return !!o && aoeLeft(t) <= 0 && tgtList(t).filter((q) => q.max && pgDist(q.p, o.p) - (q.r || 0) <= AOE.r).length >= 2; };
  const atkStep = (t) => { if (window.__pgAuto && dpsCat(t)) { if ((!P2 || P2.autoAoe) && aoeWorth(t)) aoeKey(); atkKey(); } }; /* (the autopilot presses 2 when two or more things are close together, in phase 1 and in a part that says autoAoe: its damage moments are tuned for the faster kills) */ /* (the autopilot, a careful player, presses 1 as soon as it's ready) */
  const dpsClose = () => { const D = G.dpsM; if (!D || !D.cur) return; const c = D.cur; D.cur = null; if (c.tot < 1.5) return; const fr = c.ok / c.tot; D.list.push({ kind: c.kind, t0: c.t0, fr });
    if (fr < 0.5) G.log.push({ t: c.t0, kind: 'dps', text: DPS_SAY[c.kind][1] + ': you were on ' + (DPS_SAY[c.kind][3] || (c.kind === 'heart' || c.kind === 'viper' ? 'it' : 'them')) + ' ' + Math.round(fr * 100) + '% of the time.', tip: DPS_SAY[c.kind][2] }); };
  const dpsStep = (t, dt) => { const D = G.dpsM = G.dpsM || { list: [], cur: null }, cat = dpsCat(t);
    if (G.tgt && !tgtNow(t)) G.tgt = null;
    if (window.__pgAuto && cat && !onRight(cat, tgtNow(t))) { const o = tgtList(t).filter((q) => isRight(cat, q)).sort((a, b) => pgDist([G.x, G.y], a.p) - pgDist([G.x, G.y], b.p))[0]; if (o) G.tgt = o.key; } /* (the autopilot, a careful player, picks the right thing) */
    // (once a run: how to attack, named by what's really up (a later part's own lines in DPS_SAY), and never while a step of yours is under 3 s away. The prompts
    //  audit, Nov 16: "Rawlings! Press Tab..." covered "Kick Malice in 1 s" with Clutches up, and a Soak #2 healer's coil slam at 0:43)
    if (cat && !G.taught && !window.__pgAuto && !stepSoon(t)) { G.taught = true; const ds = DPS_SAY[cat]; bigCall((ds ? ds[0] : 'Hit the right target') + ': press Tab to pick ' + (cat === 'rawling' || (ds && ds[3] === 'them') ? 'one' : 'it') + ', then keep pressing 1.', '#f3c969'); }
    atkStep(t); if (G.hitFx && G.hitFx.length && t - G.hitFx[0].t0 > 0.5) G.hitFx = G.hitFx.filter((x) => t - x.t0 <= 0.5);
    if (cat !== (D.cur && D.cur.kind)) { dpsClose(); if (cat) D.cur = { kind: cat, t0: t, tot: 0, ok: 0 }; }
    // (her tail's Mephitic Thrash sends everyone 35 yards out, past a ranged player's reach of the Rawlings: that run doesn't count you off target)
    const away = (S.thrash || []).some((q) => t >= q.t0 && t <= q.at + 3);
    if (D.cur && !away) { D.cur.tot += dt; if (onRight(cat, tgtNow(t))) D.cur.ok += dt; } };
  const cycleTgt = () => { press('tgt'); const L = tgtList(G.t).sort((a, b) => pgDist([G.x, G.y], a.p) - pgDist([G.x, G.y], b.p)); if (!L.length) return; const i = L.findIndex((o) => o.key === G.tgt); G.tgt = L[(i + 1) % L.length].key; hud(true); };
  const pickTgtAt = (p) => { if (!G) return false; const o = tgtList(G.t).filter((q) => pgDist(p, q.p) <= q.r + 1.5).sort((a, b) => pgDist(p, a.p) - pgDist(p, b.p))[0]; if (!o) return false; G.tgt = o.key; hud(true); return true; };
  const dpsView = () => { if (!G) return null; const t = G.t, cat = dpsCat(t), cur = tgtNow(t); return { cat, cur, cd: Math.max(0, GCD - (t - (G.gcd0 == null ? -99 : G.gcd0))), right: cat ? tgtList(t).filter((o) => isRight(cat, o)) : [], inRange: cur ? inRange(cur) : false, ok: cat ? onRight(cat, cur) : false, fx: (G.hitFx || []).map((x) => ({ ...x, age: t - x.t0 })), aoe: (G.aoeFx || []).filter((x) => t - x.t0 < 0.7).map((x) => ({ ...x, age: t - x.t0 })), aoeCd: aoeLeft(t), adds: tgtList(t).filter((o) => o.max) }; };
  const bigCall = (text, c) => { const el = $('.pg-warn'); if (!el) return; const its = [{ text, c: c || '#e8edf2', by: null }]; if (G) G.lastWarn = { t: G.t, n: 1, all: [text], items: its }; /* (on the game's clock like every call, so an older call's clearing can't wipe it) */ alPut(el, its, G ? G.t : 0); el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); };
  const said = []; /* (the last floats, for the tests' read of what the screen said) */
  const say = (text, bad) => { said.push({ t: G ? G.t : 0, text: String(text) }); if (said.length > 300) said.shift(); const f = $('.pg-float'); f.textContent = text; f.className = 'pg-float ' + (bad ? 'bad' : 'ok'); void f.offsetWidth; f.classList.add('in'); };
  // ---- sounds (Flex, Nov 15: "I think sound alerts or sound ques are going to be a good addition", "Players are used to sound ques with boss mods so thats
  // a great way to simulate it"): short tones made here, no sound files and never a voice. A two-note ping for a call about you, three quick beeps for a
  // "now" call, a soft blip for the others; 3-2-1 beeps and a high one as your own boss-mod bar ("Your ...") runs out; a chime when you kick, break your
  // egg's shell or pick it up; a low buzz for a mistake. The Sound button or M turns them off (remembered). Nothing plays for the autopilot or a jump
  let sndOn = (() => { try { return localStorage.getItem('wla-pg-sound') !== 'off'; } catch (e) { return true; } })(), actx = null;
  const sndCtx = () => { if (actx) return actx; const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext); if (!AC) return null; try { actx = new AC(); } catch (e) { actx = null; } return actx; };
  const SND = { you: [[880, 0, 0.11], [1320, 0.12, 0.16]], now: [[1046, 0, 0.07], [1046, 0.1, 0.07], [1568, 0.2, 0.12]], call: [[660, 0, 0.08]], tick: [[740, 0, 0.06]], go: [[1175, 0, 0.16]], ok: [[988, 0, 0.08], [1319, 0.09, 0.14]], bad: [[155, 0, 0.22]] };
  const sfx = (k) => { if (!sndOn || window.__pgAuto || !SND[k]) return; const c = sndCtx(); if (!c) return; try { if (c.state === 'suspended' && c.resume) c.resume(); const t0 = c.currentTime + 0.01;
    SND[k].forEach(([f, at, d]) => { const o = c.createOscillator(), g = c.createGain(), v = k === 'call' || k === 'tick' ? 0.05 : k === 'bad' ? 0.06 : 0.09; o.type = k === 'bad' ? 'sawtooth' : k === 'now' ? 'square' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(v, t0 + at + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + d); o.connect(g); g.connect(c.destination); o.start(t0 + at); o.stop(t0 + at + d + 0.03); }); } catch (e) { /* (no sound here) */ } };
  // (Flex, Nov 16: "Maybe try to include some sounds of what some mechanics might feel like or add attack sounds as well if you can": what a mechanic feels
  // like, made the same way, from noise and sliding tones: a whoosh as a wave passes you, a deep boom for a coil's slam, a wet pop for the Wretch's bubble, a
  // heavy sweep for the tail's Thrash, a thud when something lands near you, a hiss when a Viper hatches and a zip when it stings, a low roar as she dives and
  // as her heart opens; and your attacks: a fire whoosh that crackles on landing (ranged), a soft holy bell (healers), a blade's swish and thump (melee), a
  // whirl for the area attack. Quiet, under the calls; nothing for the autopilot)
  let NZ = null; const noise = (c) => { if (NZ && NZ.sampleRate === c.sampleRate) return NZ; NZ = c.createBuffer(1, Math.floor(c.sampleRate * 1.6), c.sampleRate); const d = NZ.getChannelData(0); let v = 0; for (let i = 0; i < d.length; i++) { v = v * 0.6 + (Math.random() * 2 - 1) * 0.4; d[i] = v * 1.6; } return NZ; };
  const nz = (c, t0, d, v, type, f0, f1, q) => { const n = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); n.buffer = noise(c); fl.type = type; fl.frequency.setValueAtTime(f0, t0); fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + d); fl.Q.value = q || 0.8;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + Math.min(0.04, d * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); n.connect(fl); fl.connect(g); g.connect(c.destination); n.start(t0); n.stop(t0 + d + 0.05); };
  const tn = (c, t0, d, v, type, f0, f1) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + 0.05); };
  const FX = { wave: (c, t) => nz(c, t, 0.7, 0.07, 'bandpass', 380, 1500, 1.2), slam: (c, t) => { tn(c, t, 0.5, 0.16, 'sine', 95, 38); nz(c, t, 0.35, 0.08, 'lowpass', 900, 120); },
    pop: (c, t) => { tn(c, t, 0.18, 0.09, 'sine', 420, 90); nz(c, t + 0.02, 0.25, 0.05, 'lowpass', 1800, 300); }, sweep: (c, t) => { nz(c, t, 1.1, 0.09, 'lowpass', 2200, 160); tn(c, t + 0.6, 0.45, 0.1, 'sine', 70, 40); },
    thud: (c, t) => { tn(c, t, 0.28, 0.11, 'sine', 120, 45); nz(c, t, 0.18, 0.05, 'lowpass', 600, 120); }, hiss: (c, t) => nz(c, t, 0.7, 0.06, 'highpass', 2600, 5200, 0.7), zip: (c, t) => tn(c, t, 0.12, 0.05, 'sawtooth', 1800, 600),
    roar: (c, t) => { tn(c, t, 1.4, 0.07, 'sawtooth', 62, 48); nz(c, t, 1.4, 0.06, 'lowpass', 420, 140); },
    fire: (c, t) => { nz(c, t, 0.24, 0.06, 'bandpass', 600, 2400, 1.1); nz(c, t + 0.22, 0.22, 0.05, 'highpass', 1800, 900); }, holy: (c, t) => { tn(c, t, 0.6, 0.045, 'sine', 1318, 1310); tn(c, t, 0.45, 0.02, 'sine', 2637, 2620); },
    slash: (c, t) => { nz(c, t, 0.14, 0.07, 'highpass', 1500, 5200, 0.7); tn(c, t + 0.06, 0.12, 0.07, 'sine', 160, 70); }, whirl: (c, t) => { nz(c, t, 0.45, 0.06, 'bandpass', 500, 2600, 1.4); nz(c, t + 0.15, 0.35, 0.05, 'bandpass', 2600, 700, 1.4); } };
  const feel = (k) => { if (!sndOn || window.__pgAuto || !FX[k]) return; const c = sndCtx(); if (!c) return; try { if (c.state === 'suspended' && c.resume) c.resume(); FX[k](c, c.currentTime + 0.01); } catch (e) { /* (no sound here) */ } };
  const sndUi = () => { const b = $('.pg-snd'); if (!b) return; b.classList.toggle('on', sndOn); b.textContent = sndOn ? 'Sound' : 'Muted'; b.setAttribute('aria-pressed', sndOn ? 'true' : 'false'); };
  const sndSet = (on) => { sndOn = !!on; try { localStorage.setItem('wla-pg-sound', sndOn ? 'on' : 'off'); } catch (e) { /* (no storage) */ } sndUi(); if (sndOn) sfx('ok'); };
  const countdown = () => { if (!sndOn || !G) return; const t = G.t, D = G.cdn || (G.cdn = new Set()); modBars(t).forEach((q) => { if (!/^Your\b/.test(q.name)) return; const left = q.at - t, id = q.name + '|' + q.at.toFixed(1) + '|';
    [3, 2, 1].forEach((n) => { if (left <= n && left > n - 0.5 && !D.has(id + n)) { D.add(id + n); sfx('tick'); } }); if (left <= 0.15 && !D.has(id + 0)) { D.add(id + 0); sfx('go'); } }); };
  const mistake = (kind, text, tip, dmg) => { G.log.push({ t: G.t, kind, text, tip }); hurt(dmg || 0); say(text, true); sfx('bad'); };
  // (how close the nearest other carrier is to your egg: 0 clear, 1 within 6 yards (orange), 2 within 3.5 (red). The prompts audit, Nov 16: the warning came at 3.5
  //  yards, about 0.07 s before the splash at walking speed; it starts at 6 now)
  const eggWarnAt = () => { if (!G || !G.eggs.some((e) => e.who === me && e.state === 'held')) return 0; let dmin = 99; G.eggs.forEach((e) => { if (e.state === 'held' && e.who && e.who !== me) { const b = G.bots[e.who]; if (b) dmin = Math.min(dmin, Math.hypot(b.x - G.x, b.y - G.y)); } }); return dmin < 3.5 ? 2 : dmin < 6 ? 1 : 0; };
  const myEggHeld = () => G.eggs.find((e) => e.who === me && e.state === 'held');
  const shellBreak = (e, t) => { e.shp = 0; e.shell = Math.min(e.shell, t); if (!window.__pgAuto) { say('Shell broken.'); sfx('ok'); } };
  // (an egg held by something else (phase 2's e.lock: its Warden's shield) stays shut until that is gone. The prompts audit, Nov 16: this file's shell code wore the
  //  phase 2 egg's shell down by 2:48.5 under the Warden's shield and said "Shell broken: walk over your egg", while it stayed shut till its Warden died)
  const eggLocked = (e) => !!e.lock && !(G.p2 && G.p2.wdead && G.p2.wdead[e.side] != null);
  const shellHit = (n, t) => { const e = myShell(); if (!e) return; e.shp -= n; if (e.shp <= 0) shellBreak(e, t); else e.shell = t + e.shp / SHELL.raid; };
  const hatch = (e, why, tip) => { feel('hiss'); e.state = 'gone'; e.who = null; G.vipers++; deb('putrid', 20, true); G.adds.push({ kind: 'viper', x: G.x + 1.5, y: G.y - 1, born: G.t }); mistake('viper', why + ': a Viper hatched (Putrid Membrane on the whole raid).', tip, 8);
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
    const a = M.get(id), rad = ob.bub || ob.car.length > 5 ? 6.5 : 3.8; return [ob.p[0] + Math.cos(a) * rad, ob.p[1] + Math.sin(a) * rad]; }; /* (rad: a soak's 4 carriers (the plan's 4 and 4, Nov 16) stand 3.8 yards out, still more than 3 yards apart, with room to dodge a small tail's wave inside the circle; at 6.5 they stepped out of it) */
  // (the carriers' numbered bubble spots: the team plan's; without one, each carrier takes a free spot round the bubble)
  const fbList = (ek) => { if (!TEAM) return null; const f = TEAM.fb[ek]; return f && f.length ? f : null; };
  // (Main's playtest, Nov 15: melee never hit the heart in the burn, "you were on it 0% of the time": their spot stayed at home, south of the middle, out of
  //  reach. As her heart opens, each melee stands at her edge, spread along it, 7 yards or less from the heart's middle: in reach (its 3 yards and your 5))
  const meleeBurn = (id, t) => { const M = GDZ_RAID.filter((q) => rl(q) === 'm'), k = Math.max(0, M.indexOf(id)), p = S.F([[-3.5, -1.2, 1.2, 3.5, 0][k % 5], 35.5], t); return PG_UL.onPlat(p[0], p[1]) ? p : PG_UL.inward(p); };
  const jobOf = (id, t) => { if (P2) return P2.job(id, t); let T = homeOf(id, t), fast = false; if (rl(id) === 'm' && t >= 142 && t < 165) T = meleeBurn(id, t); const b0 = id === me ? { x: G.x, y: G.y } : G.bots[id], myEgg = G.eggs.find((e) => e.id === id && (e.state === 'floor' || e.state === 'air') && e.land - t < 14);
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
    // (you, and your arrow (hintNow): at your 7 yards a second, and a bubble is yours from when the job line calls it, 8 s before it pops. The release sweep,
    //  Nov 16: your arrow came 6 s before the pop, timed for the bots' run, so from the far side of the room you walked where it said and got there late)
    const vW = id === me ? SPEED : 8, due = (at, p, from) => at >= t && t >= from && at - t <= Math.max(4.6, pgDist([b0.x, b0.y], p) / vW + 1.6);
    let ob = null; for (const q of S.bubbles) if (id !== 't1' && id !== 't2' && ((q.stack && t >= q.stack && t <= q.at) || due(q.at, q.p, id === me ? Math.min(q.t0 - 2, q.at - 8) : q.t0 - 2)) && (!ob || q.at < ob.at)) { const w = S.wretches.find((z) => z.id === q.w); if (w && t < w.dies) { const ek = S.bubbles.filter((z) => eggsHeldAt(z.at)).indexOf(q), fb = ek >= 0 ? fbList(ek) : null; ob = { bub: true, at: q.at, p: q.p, m: q.m, r: 5.5, car: eggsHeldAt(q.at) ? (fb ? fb.concat(CAR8.filter((c) => !fb.includes(c))) : CAR8) : null, fb: fb ? ek : -1 }; } }
    for (const s of S.soaks) if (s.group.includes(id) && due(s.at, [s.x, s.y], s.cast - 0.5) && (!ob || s.at < ob.at)) ob = { at: s.at, p: [s.x, s.y], r: 5, car: CAR8.filter((c) => s.group.includes(c)) };
    if (ob) { const sp = spotIn(ob, id); if (sp) T = sp; else { const ix = GDZ_RAID.indexOf(id), a = ix * 2.39996, rr = (ob.car ? 3.2 : ob.r) * Math.sqrt(((ix % 11) + 0.5) / 11); T = [ob.p[0] + Math.cos(a) * rr, ob.p[1] + Math.sin(a) * rr]; } const dT = pgDist(T, [b0.x, b0.y]); fast = dT > 10 || (ob.at - t < 2.5 && dT > 1.5); } /* (hurry when it's close: from a far bubble spot to the coil a second later) */
    // (a bubble that bursts just before your coil (set 1: it sits between the two circles): stand where the bubble and your coil's circle overlap, out of the
    //  other circle, the carriers 3.6 yards apart across it, so you're in the bubble and already in your soak. Nov 16, the plan's 4 and 4: Soak #2's carriers
    //  stood on the bubble's ring, partly in the first circle, ran out of it a second before the bubble burst, and reached the second circle late)
    if (ob && ob.bub) { const ns = S.soaks.find((q) => q.group.includes(id) && q.at > ob.at && q.at - ob.at <= 6), c = ns && [ns.x, ns.y], d = c ? pgDist(ob.p, c) : 99;
      if (ns && d < 16) { const ux = (c[0] - ob.p[0]) / (d || 1), uy = (c[1] - ob.p[1]) / (d || 1), M = [ob.p[0] + ux * d / 2, ob.p[1] + uy * d / 2], car = ns.group.filter((x) => CAR8.includes(x)), ci = car.indexOf(id);
        if (ci >= 0) { const off = (ci - (car.length - 1) / 2) * 3.6; T = [M[0] - uy * off, M[1] + ux * off]; } else { const ot = ns.group.filter((x) => !CAR8.includes(x)), ix = Math.max(0, ot.indexOf(id)), a2 = ix * 2.39996, rr = 2.4 * Math.sqrt(((ix % 7) + 0.5) / 7); T = [M[0] + ux * 1.6 + Math.cos(a2) * rr, M[1] + uy * 1.6 + Math.sin(a2) * rr]; }
        const dT2 = pgDist(T, [b0.x, b0.y]); fast = dT2 > 10 || (ob.at - t < 2.5 && dT2 > 1.5); } }
    // her waves: on the half that goes second, then behind the first wave into the half it just left
    const wg = S.wings.find((w) => t >= w.t + 1 && t <= w.t + 16); if (wg && id !== S.herTank(t) && !(ob && !ob.bub && ob.at - t <= 5)) { /* (not over a soak of yours 5 s off: set 2 slams while her waves still roll, and the safe-half spot kept m2 (by her) from its circle, Nov 16) */ const rot = S.rotAt(wg.t + 6), q = pgRot(T, -rot), side = wg.west ? 1 : -1, fw = S.waves.find((w) => w.kind === 'her' && Math.abs(w.t0 - (wg.t + 6)) < 0.1);
      const front = fw ? 46 - fw.v * Math.max(0, t - fw.t0) : 46, crossed = t > wg.t + 6 && front < Math.min(q[1], 26) - 5, lx = Math.max(6, Math.min(18, Math.abs(q[0]) + 4)) * (crossed ? -side : side);
      if (t <= wg.t + 6 + 6.5 + 4) { T = pgRot([lx, Math.max(-26, Math.min(24, q[1]))], rot); fast = true; } }
    // the tail's sweep: out of its 35 yards before it lands (its tank too)
    for (const th of S.thrash) if (t >= th.t0 - 0.5 && t <= th.at) { const dd = pgDist(T, [th.x, th.y]); if (dd < 38.5) { const a = Math.atan2(T[1] - th.y, T[0] - th.x); T = [th.x + Math.cos(a) * 40, th.y + Math.sin(a) * 40]; if (!onPlat(T[0], T[1])) T = nearEdge(T[0], T[1]); fast = true; } }
    // her reach in Mother's Wrath: her tank only
    for (const wr of S.wrath) if (t >= wr.t0 && t <= wr.at + 3.2 && id !== wr.tank && pgDist(T, wr.p) < 8) { const a = Math.atan2(T[1] - wr.p[1], T[0] - wr.p[0]); T = [wr.p[0] + Math.cos(a) * 9, wr.p[1] + Math.sin(a) * 9]; }
    // coil circles that aren't yours: stay out
    // (a soak of yours coming, its coils not out yet: wait on her tail's side of the middle (the tail is up before its coils), close enough to reach either circle)
    let wait = null; if (!ob) { const ns = S.soaks.find((q) => q.group.includes(id) && q.at > t && q.at - t <= 12 && t < q.cast - 0.5); if (ns && id !== 't1' && id !== 't2') { const A = S.FT([-17, 0], ns.at), d0 = pgDist(T, A); wait = A; if (d0 > 7) T = [A[0] + (T[0] - A[0]) * 7 / d0, A[1] + (T[1] - A[1]) * 7 / d0]; } }
    for (const s of S.soaks) if (t >= s.t0 && t <= s.at && !s.group.includes(id) && !(ob && ob.at < s.at - 0.3) && pgDist(T, [s.x, s.y]) < 11.5) { const a = Math.atan2(T[1] - s.y, T[0] - s.x); T = [s.x + Math.cos(a) * 12.5, s.y + Math.sin(a) * 12.5]; }
    if (!onPlat(T[0], T[1])) T = nearEdge(T[0], T[1]);
    return { T, fast, ob, wait }; }; /* (wait: the spot by her tail where a soaker waits for their coils, which dodge keeps them near) */
  const dodge = (b, T, t, fast, ob0, wait) => { const ob = ob0 || (wait ? { p: wait, r: 9, bub: true, at: t + 99, wait: true } : null); /* (waiting for your coils: dodge near the waiting spot first, Nov 16: m2 drifted 15 yards east dodging a small tail and missed set 2) */ if (P2 && !(typeof P2.dodges === 'function' ? P2.dodges(b.id, t) : P2.dodges)) return { T, fast }; /* (phase 2 dodges in its own job: src/practice-p2.js; phase 3 asks for this one: src/practice-p3.js) */ const act = S.waves.filter((w) => w.t1 >= t && w.t0 <= t + Math.max(1.5, w.warn || 0) && !(w.kind === 'incub' && b.id === w.tank) && w.from !== b.id);
    const imps = S.impacts.filter((m) => m.at >= t && m.at - t <= 2.4).concat(G.eggs.filter((e) => e.state === 'air' && e.land >= t && e.land - t <= 2.4).map((e) => ({ x: e.x, y: e.y, r: 4, at: e.land })),
      b.id === 't1' || b.id === 't2' ? [] : S.soaks.filter((q) => !q.group.includes(b.id) && t >= q.t0 && q.at >= t && q.at - t <= 2.4).map((q) => ({ x: q.x, y: q.y, r: q.r, at: q.at, mg: 0.5 })));
    if (!act.length && !imps.length) { b.esc = null; return { T, fast }; }
    const bad = (x, y, k) => act.some((w) => inWave(w, t + k, x, y, 1.4)) || imps.some((m) => m.at >= t + k - 0.2 && m.at <= t + k + 0.9 && Math.hypot(x - m.x, y - m.y) <= m.r + (m.mg != null ? m.mg : 1.4));
    // (a path is judged at the speed they'll really walk it: the bots run 1.4 times as fast to escape or when far, the autopilot walks; firstBad: how soon it meets something)
    const KS = [0, 0.1, 0.2, 0.35, 0.5, 0.7, 0.9, 1.15, 1.4, 1.8, 2.2, 2.6], firstBad = (x1, y1, sp) => { const dd = Math.hypot(x1 - b.x, y1 - b.y); for (const k of KS) { const f = dd > 0 ? Math.min(1, sp * k / dd) : 0; if (bad(b.x + (x1 - b.x) * f, b.y + (y1 - b.y) * f, k)) return k; } return Infinity; }, path = (x1, y1, sp) => firstBad(x1, y1, sp) < Infinity;
    const calmH = b.id !== me && (!P2 || !!P2.calmCarriers) && G.eggs.some((e) => e.state === 'held' && e.who === b.id), /* (an egg holder walks at your speed: the plan has to know, moveBots) */ sprOk = calmH && (b.spr == null || t - b.spr < 3 || t - b.spr >= 30), vEsc = b.id === me ? SPEED : SPEED * (calmH && !sprOk ? 1 : 1.4), vT = b.id === me ? SPEED : SPEED * (calmH ? (sprOk && (b.spr != null && t - b.spr < 3 || ob && ob.at >= t && ob.at - t <= 3.5) ? 1.4 : 1) : fast || Math.hypot(T[0] - b.x, T[1] - b.y) > 15 ? 1.4 : 1);
    if (!path(T[0], T[1], vT)) { b.esc = null; return { T, fast }; }
    // (an escape spot: not in a soak that isn't theirs, and with an egg not next to another carrier)
    const held = G.eggs.some((e) => e.who === b.id && e.state === 'held'), others = held ? G.eggs.filter((e) => e.state === 'held' && e.who && e.who !== b.id).map((e) => (e.who === me ? { x: G.x, y: G.y } : G.bots[e.who])) : [];
    const unsafe = (x, y) => S.soaks.some((q) => !q.group.includes(b.id) && q.at >= t && q.at - t <= 3.5 && Math.hypot(x - q.x, y - q.y) <= q.r + 1.2) || others.some((o) => Math.hypot(x - o.x, y - o.y) < 4) || !!(P2 && P2.unsafe && P2.unsafe(b.id, x, y, t)); /* (a part's own danger the escape must keep out of: phase 2's Doomscale frontals) */
    if (b.esc && t - b.esc.t < 2 && !path(b.esc.x, b.esc.y, vEsc) && !unsafe(b.esc.x, b.esc.y) && !(P2 && P2.walk && !P2.walk(b.x, b.y, b.esc.x, b.esc.y))) return { T: [b.esc.x, b.esc.y], fast: true };
    // (no clean spot: the one that meets the danger latest, rather than walking on into it)
    let best = null, bd = Infinity, late = null, lk = firstBad(T[0], T[1], vT); const keepIn = ob && (ob.wait || ob.at - t <= (ob.bub ? 3.5 : 6)); /* (a bubble or their soak due: dodge inside it first; a soak from 6 s off, so a wave doesn't send them away from it: m2 in set 2, Nov 16) */
    for (let pass = keepIn ? 0 : 1; pass < (keepIn && !ob.bub ? 1 : 2) && !best; pass++) /* (a soak about to slam: dodge only inside it, or stay and take the wave; Nov 16, Soak #2 carriers stepped out for a small tail's wave and missed it) */ for (const rr of (pass === 0 ? [0, 2.5, 5, 7, 8.6, -1, -2, -3] : [2, 3.5, 5.5, 8, 11, 14])) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, o = pass === 0 && rr >= 0 ? ob.p : [b.x, b.y], r0 = Math.abs(rr), x = o[0] + Math.cos(a) * r0, y = o[1] + Math.sin(a) * r0; if (!onPlat(x, y) || (pass === 0 && Math.hypot(x - ob.p[0], y - ob.p[1]) > (ob.r === 5 ? 9.2 : 9.2)) || unsafe(x, y) || (P2 && P2.walk && !P2.walk(b.x, b.y, x, y))) continue; /* (P2.walk: phase 3's broken floor, src/practice-p3.js: never an escape across the venom) */ const fk = firstBad(x, y, vEsc); if (fk < Infinity) { if (fk > lk) { lk = fk; late = [x, y]; } continue; } const dd = Math.hypot(x - T[0], y - T[1]) + Math.hypot(x - b.x, y - b.y) * 0.4; if (dd < bd) { bd = dd; best = [x, y]; } }
    if (best) { b.esc = { x: best[0], y: best[1], t }; return { T: best, fast: true }; } if (late) return { T: late, fast: true }; return { T, fast }; };
  const moveBots = (t, dt, px, py) => { const pre = {}, myT = myEggHeld() && G.eggs.some((e) => e.state === 'held' && e.who && e.who !== me) ? (window.__pgAuto ? [G.x, G.y] : jobOf(me, t).T) : null; /* (your planned spot, for the carriers to keep clear of; for the tests' autopilot, where it stands, as the checks were built on) */
    // (the release sweep, Nov 16: who closed the gap. pre: each raider from where you stand now, before they move; G.walkIn: the ones YOUR step brought inside 3 yards
    //  (they were farther before it). Only those can splash on you: a carrier picking up its egg beside you, or walking at you, is never your mistake)
    G.walkIn = {}; GDZ_RAID.forEach((id) => { if (id === me) return; const b = G.bots[id], d1 = Math.hypot(b.x - G.x, b.y - G.y), d0 = px == null ? d1 : Math.hypot(b.x - px, b.y - py); pre[id] = d1; if (d1 < 3 && d1 < d0 - 1e-6) G.walkIn[id] = true; });
    GDZ_RAID.forEach((id) => { if (id === me) return; const b = G.bots[id]; const j = jobOf(id, t); let { T, fast } = j; ({ T, fast } = dodge(b, T, t, fast, j.ob, j.wait));
      // (Flex, Nov 15: "they tend to pause and then move a lot faster than the player and will run right into me if im in their path": a raider holding an egg
      //  walks at your speed, 7 yards a second, and only goes faster to get out of a wave, as you would with Sprint. With your egg held and you right in its path
      //  (7 yards ahead, inside 4.2 of its line) it sidesteps a little, onto safe floor only: "just a little, without making it super super easy")
      const held = (!P2 || !!P2.calmCarriers) && G.eggs.some((e) => e.state === 'held' && e.who === id), want = !!(b.esc && b.esc.t === t) || !!(j.ob && j.ob.at >= t && j.ob.at - t <= 3.5);
      // (Main's playtest, Nov 15: as the melee egg carrier, Ranged 5's spot at 0:31 was 0.8 yards from yours and it walked into you, both eggs hatched on every
      //  run; at 1:58 some carriers' spots are the same. While you both hold eggs, a raider with an egg keeps the spot it walks to 4.2 yards from YOUR PLANNED
      //  spot. Not from where you stand: Flex, Nov 16, "its impossible to walk into another egg carrier now. Thats part of the fight people need to practice")
      if (held && myT) { const ex = T[0] - myT[0], ey = T[1] - myT[1], ee = Math.hypot(ex, ey); if (ee < 4.2) { const ux = ee > 0.01 ? ex / ee : 1, uy = ee > 0.01 ? ey / ee : 0, a = [myT[0] + ux * 4.2, myT[1] + uy * 4.2], c = [myT[0] - ux * 4.2, myT[1] - uy * 4.2]; T = onPlat(a[0], a[1]) ? a : onPlat(c[0], c[1]) ? c : a; } }
      if (held && want && !(b.spr != null && t - b.spr < 30)) b.spr = t; /* (Flex: "dont have them moving faster than wow speeds": Sprint like yours, 3 s every 30 s, for a wave or a soak due) */ const esc = held && b.spr != null && t - b.spr < 3; /* (still hurries for a wave, or when its soak or bubble is due within 3.5 s: the 0:39 bubble to the 0:40 coil. Phase 1; a later part opts in with calmCarriers, its routes planned for the old 1.4) */
      const dx = T[0] - b.x, dy = T[1] - b.y, dd = Math.hypot(dx, dy), sp = SPEED * (held ? (esc ? 1.4 : 1) : fast || dd > 15 ? 1.4 : 1) * dt * (P2 ? P2.slow(id, t) : 1); if (esc) b.rush = t;
      if (dd > sp) { let mx = dx / dd, my = dy / dd; if (held && myEggHeld()) { const wx = G.x - b.x, wy = G.y - b.y, along = wx * mx + wy * my, side = mx * wy - my * wx;
          if (along > 0 && along < 7 && Math.abs(side) < 4.2) { const nx = side > 0 ? my : -my, ny = side > 0 ? -mx : mx, sx = mx * 0.8 + nx * 0.6, sy = my * 0.8 + ny * 0.6, sl = Math.hypot(sx, sy), px = b.x + sx / sl * sp, py = b.y + sy / sl * sp;
            if (onPlat(px, py) && !S.soaks.some((q) => !q.group.includes(id) && q.at >= t && q.at - t <= 3.5 && Math.hypot(px - q.x, py - q.y) <= q.r + 1.2) && !(P2 && P2.walk && !P2.walk(b.x, b.y, px, py))) { mx = sx / sl; my = sy / sl; b.side = t; } } }
        b.x += mx * sp; b.y += my * sp; } else { b.x = T[0]; b.y = T[1]; } });
    // carriers keep out of each other's 3-yard circles; nobody walks into yours (if you walk into theirs, that's yours)
    const car = G.eggs.filter((e) => e.state === 'held' && e.who && e.who !== me).map((e) => G.bots[e.who]); for (let it = 0; it < 2; it++) { for (let i = 0; i < car.length; i++) for (let j = i + 1; j < car.length; j++) { const a = car[i], c = car[j], ex = c.x - a.x, ey = c.y - a.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.6) { const pu = (3.6 - ee) / 2; a.x -= ex / ee * pu; a.y -= ey / ee * pu; c.x += ex / ee * pu; c.y += ey / ee * pu; } }
      if (myEggHeld() && window.__pgAuto) for (const c of car) { const ex = G.x - c.x, ey = G.y - c.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.6) { const nx = ex / ee, ny = ey / ee; G.x = c.x + nx * 3.6; G.y = c.y + ny * 3.6; if (target) { const tx = target[0] - G.x, ty = target[1] - G.y; if (tx * nx + ty * ny < 0) { const sd = tx * -ny + ty * nx >= 0 ? 1 : -1, d = SPEED * dt * 0.8; G.x -= ny * sd * d; G.y += nx * sd * d; } } } } /* (the autopilot, a careful player, steps round other carriers: out of their circle, and along its edge when they stand in the way) */
      // (the release sweep, Nov 16: a carrier's own step never takes it inside 3.6 yards of where you really stand. It stops on that edge, or where it was if
      //  you had already stepped closer than that, so walking into one is still yours to do. Before, it was held back only while you stood perfectly still:
      //  your next small step let it walk onto its spot inside your ring, and both eggs burst on your score)
      if (myEggHeld()) for (const c of car) { const ex = c.x - G.x, ey = c.y - G.y, ee = Math.hypot(ex, ey) || 0.01, k = G.still ? 3.6 : Math.min(3.6, pre[c.id] == null ? 9 : pre[c.id]); if (ee < k - 1e-6) { c.x = G.x + ex / ee * k; c.y = G.y + ey / ee * k; }
        // (Main's playtest, Nov 15: stepping out of one carrier's ring pushed the autopilot into another's. Only for the autopilot (the tests' careful player) a
        //  carrier it comes at gives way; you can walk into one and splash, Flex, Nov 16: "Thats part of the fight people need to practice")
        else if (ee < 3.6 && window.__pgAuto) { const st = Math.min(3.6 - ee, SPEED * dt), nx = c.x + ex / ee * st, ny = c.y + ey / ee * st; if (onPlat(nx, ny)) { c.x = nx; c.y = ny; } } } }
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
    G.still = !G.kb && Math.hypot(G.x - px, G.y - py) < 1e-4; if (!G.still && !G.kb) G.mv = [G.x - px, G.y - py]; /* (your last step's way, for "Carrier ahead") */ G.t = t; moveBots(t, dt, px, py); check(t0, t);
    G.bossHp = P2 ? P2.bossHp(t) : Math.max(52, 100 - 30 * Math.min(1, t / 139) - (t > 145.5 ? 14 * Math.min(1, (t - 145.5) / 19.5) : 0) - Math.min(4, (G.heartHits || 0) * 0.12)); /* (your hits on the heart take her down a little faster) */ };
  const check = (t0, t) => { const x = G.x, y = G.y, crossed = (at) => at > t0 && at <= t;
    // waves: a hit is huge stacking poison; an egg it touches hatches (in your hands or on the floor)
    // (what the fight feels like, Nov 16: a whoosh as a wave passes within 5 yards, a thud when something lands near you, a low roar as she dives and as her heart opens)
    S.waves.forEach((w, i) => { if (!G.done.has('ws' + i) && w.from !== me && inWave(w, t, x, y, 5)) { G.done.add('ws' + i); feel('wave'); } });
    S.impacts.forEach((m) => { if (crossed(m.at) && Math.hypot(x - m.x, y - m.y) <= m.r + 10) feel('thud'); }); if (!P2 && S.dive && (crossed(S.dive.t0) || crossed(145.5))) feel('roar');
    S.waves.forEach((w, i) => { if (G.done.has('w' + i) || w.from === me || !inWave(w, t, x, y)) return; /* (w.from: a wave sent by a raider, phase 3's Volatile Purge, never hits them) */ G.done.add('w' + i); deb('venom', 10, true); mistake(w.ring ? 'ring' : 'wave', w.name + ' hit you.', w.tip, 28); const e = myEggHeld(); if (e) hatch(e, 'A wave touched your egg', 'Carrying an egg, a wave hatches it: dodge every one.'); });
    G.eggs.forEach((e) => { if (e.id === me && e.state === 'floor' && S.waves.some((w) => inWave(w, t, e.x, e.y))) hatch(e, 'Your egg was still on the floor when a wave reached it', 'Pick your egg up as soon as its shell breaks.'); });
    // impacts: the Womb, the debris
    S.impacts.forEach((m) => { if (crossed(m.at) && Math.hypot(x - m.x, y - m.y) <= m.r + PR * 0.5) mistake('impact', m.name + ' landed on you.', m.tip, m.dmg); });
    // (the venom beam, from the image to the off tank: a raider in its line takes it, the wipe of Wolfthorn's pull 1)
    (S.beams || []).forEach((bm, bi) => { if (P2 || t < bm.t0 || t > bm.t1 || G.done.has('beam' + bi)) return; const ax = bm.from[0], ay = bm.from[1], tk = G.bots[bm.tank] || { x: bm.at[0], y: bm.at[1] }, vx = tk.x - ax, vy = tk.y - ay, L2 = vx * vx + vy * vy || 1, u = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / L2));
      if (Math.hypot(x - (ax + vx * u), y - (ay + vy * u)) <= 1.6) { G.done.add('beam' + bi); mistake('beam', 'You stood in the venom beam: only the off tank stands in it.', 'The spectral image beams the off tank: keep out of the line between them.', 35); } });
    // the eggs land (4 yards), their shells break, carriers pick theirs up
    G.eggs.forEach((e) => { if (e.state === 'air' && t >= e.land) { e.state = 'floor'; if (Math.hypot(x - e.x, y - e.y) <= 14) feel('thud'); if (e.id === me && shellsOn()) { e.shpMax = SHELL.hp; e.shp = SHELL.hp; e.shell = t + SHELL.hp / SHELL.raid; } if (Math.hypot(x - e.x, y - e.y) <= 4 + PR * 0.5) mistake('impact', 'An egg landed on you.', 'Eggs fall in 4-yard circles: step out of them.', 25); }
      if (e.state === 'floor' && e.id === me && e.shp > 0 && !eggLocked(e)) { e.shp -= SHELL.raid * (t - t0); if (e.shp <= 0) shellBreak(e, t); else e.shell = t + e.shp / SHELL.raid; }
      if (e.state === 'floor' && e.id !== me && t >= e.shell + 0.3) { const b = G.bots[e.id], byYou = b && myEggHeld() && Math.hypot(b.x - x, b.y - y) < 3.6; /* (the release sweep, Nov 16: a raider doesn't pick its egg up inside 3.6 yards of you while you carry yours; it waits for you to pass) */ if ((b && !byYou && Math.hypot(b.x - e.x, b.y - e.y) < 2.5) || t > e.shell + 6) { e.state = 'held'; e.who = e.id; } }
      // (the release sweep, Nov 16: you pick your egg up anywhere inside its gold 2.8-yard ring, the one drawn round it. It was 2.2, so a player who stopped
      //  inside the ring, or where the Go here arrow went away at 2.5, kept waiting with "Pick up your egg now")
      if (e.state === 'floor' && e.id === me && Math.hypot(x - e.x, y - e.y) <= 2.8) { if (t < e.shell) { if (!G.done.has('sh' + e.set)) { G.done.add('sh' + e.set); say(e.lock ? (eggLocked(e) ? e.lock : 'Not open yet: hit it (Tab, then 1).') : (e.shp > 0 ? 'Its shell is still up: hit it (Tab, then 1) to break it.' : 'Its shell isn\'t broken yet: wait a moment.')); } } else { if (has('yolk')) mistake('yolk', 'You picked up an egg with Rancid Yolk on you.', 'Rancid Yolk lasts 20 s after your egg breaks: let it drop first.', 15); e.state = 'held'; e.who = me; say('Egg picked up.'); sfx('ok'); if (!G.eggTaught) { G.eggTaught = true; bigCall('This ring is your egg\'s 3 yards. Walk into another carrier\'s ring and both eggs hatch.', '#3af2a8'); /* (the release sweep, Nov 16: only your own step splashes) */ } } }
      if (e.state === 'floor' && e.id === me && !G.done.has('left' + e.set)) { const sk = S.soaks.find((s) => s.at > e.land && s.group.includes(me)); if (sk && t > sk.at) { G.done.add('left' + e.set); mistake('egg', 'You never picked up your egg.', 'Your egg lands in your zone (the gold circle): pick it up once the shell breaks.', 0); } } });
    // you walk into another carrier's 3-yard circle: Noxious Splash, both eggs hatch at once. (The release sweep, Nov 16: only when YOUR step closed the gap
    //  below 3 yards, G.walkIn from moveBots. Before, any step of yours counted while a carrier was close, even one away from it or one it walked into, and
    //  the words blamed the other carrier for it)
    const mine = myEggHeld(), wi = G.walkIn || {}; if (mine && !G.still) G.eggs.forEach((e) => { if (e.state !== 'held' || !e.who || e.who === me || !mine || mine.state !== 'held' || !wi[e.who]) return; const b = G.bots[e.who]; if (b && Math.hypot(x - b.x, y - b.y) < 3) { const wn = nm(e.who); deb('splash', 10); hurt(30); e.state = 'gone'; e.who = null; G.vipers++; G.adds.push({ kind: 'viper', x: b.x + 1, y: b.y + 1, born: t }); /* (both eggs burst: two Vipers, Nov 15 audit) */ hatch(mine, 'You walked into ' + wn + '\'s 3-yard circle (carrying too): both eggs hatched', 'Two carriers within 3 yards: Noxious Splash bursts both eggs. Walk round other carriers\' circles.'); } });
    // the coil slams: shared by everyone within 10 yards; carried eggs break; Soul Constrictor 5 s
    S.soaks.forEach((s) => { if (!crossed(s.at)) return; feel('slam'); const n = 1 + GDZ_RAID.filter((id) => id !== me && Math.hypot(G.bots[id].x - s.x, G.bots[id].y - s.y) <= s.r).length, inn = Math.hypot(x - s.x, y - s.y) <= s.r;
      if (inn) { if (has('soul')) mistake('soul', 'Soul Constrictor: you took the slam before, so you couldn\'t help with this one.', 'Take only your own slam; the next one is the other group\'s.', 25);
        else { hurt(slamHit(n)); const e = myEggHeld(); if (e) { e.state = 'gone'; e.who = null; deb('yolk', 20); G.adds.push({ kind: 'rawling', x: x + 1.2, y: y + 1.2, born: t }); say('Soaked: your egg broke (a Rawling).'); } else say('Soaked.'); } deb('soul', 5); }
      else { hurt(slamHit(n)); if (s.group.includes(me)) mistake('soak', 'You missed your coil soak (slam ' + (s.k + 1) + '): the others took more.', 'Be inside your group\'s 10-yard circle when it slams.', 0); } /* (every slam hits the whole raid: the soakers only make it smaller, Nov 15 audit) */
      G.eggs.forEach((e) => { if (e.state === 'held' && e.who && e.who !== me && Math.hypot(G.bots[e.who].x - s.x, G.bots[e.who].y - s.y) <= s.r) { e.state = 'gone'; G.adds.push({ kind: 'rawling', x: G.bots[e.who].x + 1, y: G.bots[e.who].y + 1, born: t }); e.who = null; } }); });
    // the bubbles: everyone farther than 10 yards from the Wretch is hit
    S.bubbles.forEach((q) => { if (!crossed(q.at)) return; const c = G.wr[q.w]; if (c) feel('pop'); if (c && Math.hypot(x - c.x, y - c.y) > 10) { deb('fester', 12); mistake('fester', 'Fester Burst: you were outside the Wretch\'s bubble.', 'Be within 10 yards of the Wretch when Fester Burst goes off.', 40); } });
    // the tail's sweep: 35 yards, a big hit and a knockback
    S.thrash.forEach((th) => { if (!crossed(th.at)) return; feel('sweep'); const dd = Math.hypot(x - th.x, y - th.y); hurt(15); deb('thrash', 10); /* (everyone takes the sweep's hit and its DoT, Nov 15 audit) */
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
    G.adds.forEach((a) => { if (a.own) return; /* (a part that runs its own adds marks them own: phase 2's Rawlings, Nov 15) */ if (a.kind === 'viper' && t - (a.born == null ? t : a.born) >= 4) a.hp = hp(a) - (a.tank ? TAUNT.drain : 0.35) * dt;
      if (a.kind === 'rawling' && a.born != null && !a.boil && t - a.born >= 25) { a.boil = true; if (!G.done.has('boil')) { G.done.add('boil'); G.log.push({ t, kind: 'boil', text: 'A Rawling lived 25 s and boiled (Boiling Venom: twice as fast and strong).', tip: 'Kill Rawlings within 25 s: press Tab to pick one, then keep pressing 1.' }); } if (!window.__pgAuto) say('A Rawling boiled: kill it!', true); } });
    if (G.adds.some((a) => a.hp != null && a.hp <= 0)) G.adds = G.adds.filter((a) => !(a.hp != null && a.hp <= 0)); };
  // (Flex, Nov 15: "If a viper spawns though it needs to be killed", "it shouldnt just vanish": a Viper no longer leaves after 8 s; it stays until you kill it.
  // The guide: a Viper is deadly, kill it at once; its Petrifying Sting is a big heal absorb. So it crawls to you and stings you every 3 s while it's close:
  // a little damage, and no healing on you while the sting lasts, stacking. Ignore it and it wears you down)
  const offTank = (t) => { const ht = S.herTank ? S.herTank(t) : 't1'; return GDZ_RAID.find((id) => id[0] === 't' && id !== ht) || 't2'; };
  const tauntStep = (a, t) => { if (a.tank || t - (a.born == null ? t : a.born) < TAUNT.at) return; a.tank = offTank(t); a.taunt = t; if (a.tank !== me && !window.__pgAuto) say('The tank taunted the Viper: kill it with the raid!'); };
  const vipers = (t0, t, x, y) => { G.adds.forEach((a) => { if (a.kind !== 'viper') return; tauntStep(a, t); const tk = a.tank && a.tank !== me ? G.bots[a.tank] : null, gx = tk ? tk.x : x, gy = tk ? tk.y : y, dx = gx - a.x, dy = gy - a.y, d = Math.hypot(dx, dy);
    if (d > 1.8) { const m = Math.min(d - 1.8, 6 * (t - t0)); a.x += dx / d * m; a.y += dy / d * m; }
    const last = a.sting == null ? (a.born == null ? t0 : a.born - 2) : a.sting; /* (its first sting lands 1 s after it hatches, before the tank has it) */ if (!tk && d <= 3.2 && t - last >= 3) { a.sting = t; G.lastSting = t; feel('zip'); hurt(8); deb('sting', 6, true); if (!window.__pgAuto) say('Petrifying Sting: kill the Viper!', true); } }); };

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
    S.soaks.forEach((s) => { if (t >= s.t0 && t <= s.at + 0.5) { const mineS = s.group.includes(me), f = Math.min(1, (t - s.t0) / (s.at - s.t0)); circ(s.x, s.y, s.r, 'rgba(36,242,203,' + (t > s.at ? 0.4 : 0.08) + ')', mineS ? '#f3c969' : '#24f2cb', mineS ? 3.5 : 2, mineS ? [12, 6] : null); circ(s.x, s.y, s.r * f, null, 'rgba(36,242,203,.7)', 1.5); label(s.x, s.y, mineS ? 'Your coil' : 'Not yours', mineS ? '#f3c969' : '#24f2cb', 13); } });
    S.bubbles.forEach((q) => { const c = G.wr[q.w]; if (c && t >= q.t0 && t <= q.at + 0.4) { const f = Math.min(1, (t - q.t0) / (q.at - q.t0)), [sx, sy] = P(c.x, c.y), g = cx.createRadialGradient(sx, sy, 0, sx, sy, 10 * k); g.addColorStop(0, 'rgba(216,242,47,.04)'); g.addColorStop(0.85, 'rgba(216,242,47,' + (0.1 + 0.14 * f).toFixed(3) + ')'); g.addColorStop(1, 'rgba(216,242,47,' + (0.25 + 0.2 * f).toFixed(3) + ')');
      cx.fillStyle = g; cx.beginPath(); cx.arc(sx, sy, 10 * k, 0, Math.PI * 2); cx.fill(); circ(c.x, c.y, 10, null, '#d8f22f', 2.5); circ(c.x, c.y, 10 * (1 - f), null, 'rgba(216,242,47,.55)', 1.5); if (t > q.at) circ(c.x, c.y, 10, 'rgba(216,242,47,.45)'); label(c.x, c.y, 'Into the bubble', '#e8ff6a', 13, 10 * k / dpr + 16); } });
    S.impacts.forEach((m) => { if (t >= m.t0 && t <= m.at + 0.3) { const f = Math.min(1, (t - m.t0) / (m.at - m.t0)); circ(m.x, m.y, m.r, 'rgba(200,163,106,.16)', m.color, 2); circ(m.x, m.y, m.r * f, 'rgba(255,90,60,.25)'); } });
    G.eggs.forEach((e) => { if (e.state === 'air' && t >= e.land - 3) { const f = Math.min(1, (t - e.land + 3) / 3); circ(e.x, e.y, 4, 'rgba(230,224,200,.12)', '#e6e0c8', 1.6); circ(e.x, e.y, 4 * f, 'rgba(255,90,60,.22)'); } });
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
    { const ys = mySpot(), hy = hintNow(); if (ys) { circ(ys[0], ys[1], 1.3, 'rgba(243,201,105,.18)', '#f3c969', 2.5, [5, 4]); if (!(hy && pgDist(hy.T, ys) < 2)) label(ys[0], ys[1], hy && hy.wait ? 'Wait' : 'Your spot', '#f3c969', 12, -14); } }
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
      if (!hn.wait) { cx.globalAlpha = pulse; cx.lineWidth = 3 * dpr; cx.strokeStyle = '#f3c969'; cx.beginPath(); cx.moveTo(a0[0], a0[1]); cx.lineTo(a1[0], a1[1]); cx.moveTo(w1[0], w1[1]); cx.lineTo(a1[0], a1[1]); cx.lineTo(w2[0], w2[1]); cx.stroke(); cx.globalAlpha = 1; } /* (no arrow while the way is blocked: "Wait") */
      circ(hn.T[0], hn.T[1], 1.4, 'rgba(243,201,105,.14)', '#f3c969', 2, [4, 3]); label(hn.T[0], hn.T[1], hn.wait ? 'Wait' : 'Go here · ' + Math.round(hn.d) + ' yd', '#f3c969', 12, -16); }
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
  const castNow = (t) => (P2 && P2.castOf ? P2.castOf(t) : S.casts.filter((c) => t >= c.t0 && t <= c.t1).sort((a) => (a.who === 'boss' ? -1 : 1))[0]); /* (phase 2: your target's cast, as in WoW, gold when you can kick it) */
  // ---- your job now, and next (the prompts audit, Nov 16, Flex: "Lets improve the curated experience as the game guides players onto what they need to do next",
  // then "All 10", then "i feel like the game confuses people saying timestamps"). Two lines talk to you: NOW, one order about you, and NEXT under it, your next
  // step and where it is. No clock times and no second counts in either: the boss-mod bars and cast bars do the counting. NOW shows the first that applies:
  // (a) dodge: something lands on you or reaches you within 3 s; (b) your step is due now (your coil, the bubble, your egg); (c) walk to your next step from the
  // moment it is named; (w) her waves' two steps, wait in the green half, then cross now; (d) hit the right target; (e) your standing job. Never another player's
  // timer and never "Next: X in N s" (it read "Next: Coil slam 2 in 3 s" to the first coil's soakers, the other team's coil). tests/practice-game.js check R ----
  const DUE = 3, ORD = (s) => (s.k ? 'second' : 'first'), WAITTXT = 'Wait: let it pass, then go.';
  // (your steps in order, phase 1: your egg as it falls, breaking and picking it up, each bubble, your coils, the heart. at: its moment; from: when the job line
  //  names it and your arrow shows (a bubble 8 s before it pops, the 1:48 one from the raid's stack, a coil from its cast, your egg 8 s before it lands; the
  //  audit: the arrow came about 1.6 s before you needed it, timed for the bots' run, and the second egg had none until it landed))
  let stepC = null;
  const mySteps = (t) => { if (P2 || !S || !G) return []; if (stepC && stepC.t === t && stepC.me === me && stepC.S === S) return stepC.L; const L = [];
    G.eggs.forEach((e) => { if (e.id !== me || e.state === 'gone' || e.state === 'held') return; if (e.state === 'air') { L.push({ k: 'egg', id: 'e' + e.set, at: e.land, from: e.land - 8, e }); return; }
      const sk = S.soaks.find((s) => s.at > e.land && s.group.includes(me)); if (sk && t > sk.at) return; L.push({ k: e.shp > 0 ? 'shell' : 'pick', id: 'p' + e.set, at: Math.min(e.shell, t), from: e.land, e }); });
    S.bubbles.forEach((q, i) => { const w = S.wretches.find((z) => z.id === q.w); if (!w || q.at >= w.dies || q.at < t) return; L.push({ k: 'bubble', id: 'b' + i, at: q.at, from: Math.min(q.stack || 1e9, q.t0 - 2, q.at - 8), q }); });
    S.soaks.forEach((s, i) => { if (s.group.includes(me) && s.at >= t) L.push({ k: 'coil', id: 's' + i, at: s.at, from: s.cast - 0.5, s }); });
    if (t < 165) L.push({ k: 'heart', id: 'h', at: 145.5, from: 142, mel: rl(me) === 'm' });
    const ord = (s) => (s.k === 'pick' || s.k === 'shell' ? -1 : s.at); L.sort((a, b) => ord(a) - ord(b)); stepC = { t, me, S, L }; return L; };
  // (the step your job line is on: the first one named; a bubble or coil due within 3 s comes before picking up your egg or walking to the heart)
  const curStep = (t) => { const L = mySteps(t).filter((s) => t >= s.from); if (!L.length) return null; let c = L[0];
    if (c.k === 'pick' || c.k === 'shell' || c.k === 'heart') { const due = L.find((s) => (s.k === 'bubble' || s.k === 'coil') && s.at - t <= DUE); if (due) c = due; } return c; };
  // (a step of yours under 3 s away, before `before` if given: teaching tips and calls about a later moment wait for it. A later part can give its own, P2.stepSoon)
  const stepSoon = (t, before) => (P2 ? !!(typeof P2.stepSoon === 'function' && P2.stepSoon(t, before)) : mySteps(t).some((s) => (s.k === 'bubble' || s.k === 'coil' || s.k === 'egg') && s.at > t && s.at - t < DUE && (before == null || s.at < before - 0.3)));
  // (where a step puts you, and when the game counts you there: T your spot; rad, how close to T is inside what the game counts (the bubble's 10 yards round the
  //  Wretch, your coil's circle, your egg's 2.8-yard pickup ring), less a margin, and outside every coil that isn't yours. The arrow goes away only inside rad.
  //  The audit: the arrow went away at 2.5 yards whatever the step, and at 0:34 pointed a Soak #2 player 7 yards inside the first coil (Soul Constrictor at 0:43))
  const bubOb = (q) => { const ek = S.bubbles.filter((z) => eggsHeldAt(z.at)).indexOf(q), fb = ek >= 0 ? fbList(ek) : null; return { at: q.at, p: q.p, m: q.m, r: 5.5, car: eggsHeldAt(q.at) ? (fb ? fb.concat(CAR8.filter((c) => !fb.includes(c))) : CAR8) : null, fb: fb ? ek : -1 }; };
  const spreadSpot = (p, r0) => { const ix = GDZ_RAID.indexOf(me), a = ix * 2.39996, rr = r0 * Math.sqrt(((ix % 11) + 0.5) / 11); return [p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr]; }; /* (as jobOf spreads the raid) */
  // (the nearest spot to T0 inside the circle (c, r), outside each circle in out, inside pref when it can be, and on the stone)
  const fitSpot = (T0, c, r, out, pref) => { const ok = (p, wp) => onPlat(p[0], p[1]) && pgDist(p, c) <= r && out.every((o) => pgDist(p, o.c) >= o.r) && (!wp || pgDist(p, wp.c) <= wp.r);
    for (const wp of pref ? [pref, null] : [null]) { if (ok(T0, wp)) return T0.slice(); let best = null, bd = 1e9; for (let rr = 0; rr <= r + 1e-6; rr += 0.5) for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16, p = [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; if (!ok(p, wp)) continue; const dd = pgDist(p, T0); if (dd < bd) { bd = dd; best = p; } } if (best) return best; }
    return T0.slice(); };
  const stepSpot = (st, t) => { if (!st || P2) return null; const held = !!myEggHeld();
    if (st.k === 'egg') { const e = st.e, dx = G.x - e.x, dy = G.y - e.y, a0 = Math.hypot(dx, dy) > 0.1 ? Math.atan2(dy, dx) : 0; let T = null; /* (next to it on your side, not under it) */
      for (const da of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8, 2.6, -2.6, Math.PI]) { const p = [e.x + Math.cos(a0 + da) * 6.2, e.y + Math.sin(a0 + da) * 6.2]; if (onPlat(p[0], p[1])) { T = p; break; } }
      return { T: T || [e.x, e.y], C: [e.x, e.y], what: 'egg', rad: 1.4, inside: (x, y) => { const d = Math.hypot(x - e.x, y - e.y); return d >= 5.6 && d <= 7.8; /* (clear of the "falling on you" warning's 5.2) */ } }; }
    if (st.k === 'shell' || st.k === 'pick') { const e = st.e; return { T: [e.x, e.y], C: null, what: 'egg', rad: 2.5, inside: (x, y) => Math.hypot(x - e.x, y - e.y) <= 2.5 }; }
    if (st.k === 'heart') { if (!st.mel) return null; const T = meleeBurn(me, t), hp = S.F(PG_UL.heart, t); return { T, C: hp, what: 'spot', rad: 1.2, inside: (x, y) => Math.hypot(x - hp[0], y - hp[1]) - 3 <= 4.5 }; } /* (in reach of the heart: its 3 yards and your 5) */
    let C, R, T0, pref = null, car = false, others;
    if (st.k === 'bubble') { const q = st.q, ob = bubOb(q); C = q.p; R = 10; car = !!(ob.car && ob.car.includes(me)); T0 = spotIn(ob, me) || spreadSpot(q.p, ob.car ? 3.2 : 5.5);
      others = S.soaks.filter((s) => !s.group.includes(me) && s.at >= t && s.at <= q.at + 2); /* (a coil that slams while you stand there, or a second after: 0:39's bubble sits on the 0:40 coil) */
      const nx = S.soaks.find((s) => s.group.includes(me) && s.at > q.at && s.at - q.at <= 6); if (nx) pref = { c: [nx.x, nx.y], r: nx.r - 2 }; } /* (your coil right after: where the bubble and it overlap) */
    else { const s = st.s, ob = { at: s.at, p: [s.x, s.y], r: 5, car: CAR8.filter((c) => s.group.includes(c)) }; C = [s.x, s.y]; R = s.r; car = ob.car.includes(me); T0 = spotIn(ob, me) || spreadSpot(C, 3.2);
      others = S.soaks.filter((z) => z.set === s.set && !z.group.includes(me) && z.at >= t); } /* (the other coil, before or after yours: in both, Soul Constrictor) */
    const out = others.map((s) => ({ c: [s.x, s.y], r: s.r + 2.5 })), FC = S._fit = S._fit || new Map(), key = st.id + '|' + me + '|' + out.map((o) => o.c.join(',')).join(';') + '|' + (pref ? 1 : 0) + '|' + T0.map((v) => v.toFixed(1)).join(',');
    let T = FC.get(key); if (!T) { T = fitSpot(T0, C, R - 2, out, pref); FC.set(key, T); }
    let rad = R - 0.8 - pgDist(T, C); out.forEach((o) => { rad = Math.min(rad, pgDist(T, o.c) - (o.r - 1.3)); }); if (pref && pgDist(T, pref.c) <= pref.r) rad = Math.min(rad, pref.r + 1.2 - pgDist(T, pref.c));
    rad = car && held ? Math.max(1, Math.min(rad, 1.6)) : Math.max(1.2, rad); /* (a carrier keeps to its own spot, 3 yards from the others') */
    // (inside: on your spot, or (without an egg to keep apart) anywhere well inside the circle that counts, clear of the other coils, and in your next coil when it follows)
    const own = car && held, inArea = (x, y) => pgDist([x, y], C) <= R - 1.2 && out.every((o) => pgDist([x, y], o.c) >= o.r - 1.3) && (!pref || pgDist([x, y], pref.c) <= pref.r + 1.2);
    return { T, what: 'spot', rad, C, R, out, inside: (x, y) => Math.hypot(x - T[0], y - T[1]) <= rad || (!own && inArea(x, y)) }; };
  // (the way to your spot: blocked by a coil that isn't yours, another carrier's ring while you carry, or a wave that would reach you on the way within 2 s when
  //  standing still wouldn't. route() bends round a circle, or says Wait. The audit: the straight arrow walked carriers into other carriers' rings (0:36.9, 0:40.2,
  //  1:45.4) and Soak #2 through the first coil. pathClear(from, to, s) works for any part: true when the walk is clear for the next s seconds (2 by default))
  const segDist = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy || 1))); return Math.hypot(p[0] - a[0] - vx * u, p[1] - a[1] - vy * u); };
  const pathBlock = (a, b, t, hz, mid) => { const L = pgDist(a, b); if (L < 0.05) return null; /* (mid: b is a spot on the way, so it mustn't sit in anything either; your own spot may) */
    if (!P2) for (const s of S.soaks) { if (s.group.includes(me) || t < s.t0 - 0.5 || t > s.at) continue; const c = [s.x, s.y], R = s.r + 1; if (pgDist(a, c) <= R || (!mid && pgDist(b, c) <= R)) continue; if (pgDist(b, c) <= R || segDist(c, a, b) < R) return { k: 'coil', c, r: R }; }
    if (myEggHeld()) for (const e of G.eggs) { if (e.state !== 'held' || !e.who || e.who === me) continue; const o = G.bots[e.who]; if (!o) continue; const c = [o.x, o.y], R = 4, da = pgDist(a, c), db = pgDist(b, c);
      if (da <= R) { if (segDist(c, a, b) < Math.min(da, 3.4) - 0.05) return { k: 'ring', c, r: R }; continue; } /* (already close: only a walk that takes you closer to its ring is blocked) */
      if (db <= 3.4) return { k: 'ring', c, r: R }; if (db <= R && !mid) continue; if (segDist(c, a, b) < R) return { k: 'ring', c, r: R }; }
    if (hz > 0) { const W = (S.waves || []).filter((w) => w.from !== me && !(w.kind === 'incub' && w.tank === me) && w.t1 >= t && w.t0 - (w.warn || 1.5) <= t + hz);
      if (W.length) { const hit = (f) => { for (let k = 0; k <= hz + 1e-6; k += 0.25) { const g = f(k); if (W.some((w) => inWave(w, t + k, g[0], g[1], 0.6))) return true; } return false; };
        if (hit((k) => { const f = Math.min(1, SPEED * k / L); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }) && !hit(() => a)) return { k: 'wave' }; } }
    return null; };
  const pathClear = (a, b, s) => !!G && !!S && !pathBlock(a, b, G.t, s == null ? 2 : s);
  // (round one thing in the way (a spot beside it), or in from straight outside your spot, away from the middle of the circle it sits in (C): the bubble's carriers
  //  stand in a ring 5 yards apart, so the straight way to your spot across it passes inside someone's 3 yards. Wait only when nothing works, or for a wave)
  const route = (a, T, t, C) => { const b0 = pathBlock(a, T, t, 2); if (!b0) return { P: T, wait: false }; if (b0.k === 'wave') return { P: T, wait: true };
    const around = (p, q, ob) => { const ux = q[0] - p[0], uy = q[1] - p[1], L = Math.hypot(ux, uy) || 1, nx = -uy / L, ny = ux / L, out = []; [ob.r + 0.6, ob.r + 2, ob.r + 4].forEach((R) => [1, -1].forEach((sg) => out.push([ob.c[0] + nx * R * sg, ob.c[1] + ny * R * sg]))); return out.filter((w) => onPlat(w[0], w[1])); };
    const ok = (p, q, last) => !pathBlock(p, q, t, last ? 0 : 2, !last); let best = null;
    const take = (pts) => { let len = 0; for (let i = 1; i < pts.length; i++) len += pgDist(pts[i - 1], pts[i]); if (!best || len < best.len) best = { P: pts[1], len }; };
    around(a, T, b0).forEach((W) => { if (ok(a, W) && ok(W, T, true)) take([a, W, T]); });
    if (C) { const ux = T[0] - C[0], uy = T[1] - C[1], L = Math.hypot(ux, uy); if (L > 0.5) [4.5, 7, 10].forEach((k) => { const W2 = [T[0] + ux / L * k, T[1] + uy / L * k]; if (!onPlat(W2[0], W2[1]) || !ok(W2, T, true)) return;
      if (ok(a, W2)) { take([a, W2, T]); return; } const b1 = pathBlock(a, W2, t, 2, true); if (b1 && b1.c) around(a, W2, b1).forEach((W1) => { if (ok(a, W1) && ok(W1, W2)) take([a, W1, W2, T]); }); }); }
    return best ? { P: best.P, wait: false, bend: true } : { P: T, wait: true }; };
  const whereOf = (p, at) => { const TL = tailAt(at).p, B = bossAt(at).p; return pgDist(p, TL) < 24 ? 'by her tail' : pgDist(p, B) < 32 ? 'in front of her' : 'in the middle'; };
  // (another carrier's ring: too close, or straight ahead within 6 yards as you walk. Every part, before its own job line: the audit found the intermission never
  //  ran it, and phase 1's came at 3.5 yards, about 0.07 s before the splash)
  const ringWarn = () => { if (!G || !myEggHeld()) return null; let nb = null, dn = 99; G.eggs.forEach((e) => { if (e.state === 'held' && e.who && e.who !== me) { const b = G.bots[e.who]; if (b) { const d = Math.hypot(b.x - G.x, b.y - G.y); if (d < dn) { dn = d; nb = e.who; } } } });
    if (!nb) return null; if (dn < 3.6) return 'Too close to ' + nm(nb) + '\'s egg: step away from them!';
    if (dn < 6 && !G.still && G.mv) { const b = G.bots[nb], vx = G.mv[0], vy = G.mv[1], vl = Math.hypot(vx, vy) || 1, rx = b.x - G.x, ry = b.y - G.y; if ((rx * vx + ry * vy) / vl > 0 && Math.abs(rx * vy - ry * vx) / vl < 3.8) return 'Carrier ahead: walk round ' + nm(nb) + '\'s ring.'; }
    return null; };
  // (a: what reaches you within 3 s, soonest first: a small tail's lanes (the most common mistake, no words before), her waves, the beam's waves, a falling egg
  //  (non-carriers had nothing: hit at 0:10 and 1:21), the Womb and the debris; then her tail's sweep, her bites, the beam's line and a coil that isn't yours)
  const dangerNow = (t) => { const x = G.x, y = G.y; if (inVenom(x, y)) return 'Get back on the stone: the venom hurts.';
    const rw = ringWarn(); if (rw) return rw;
    const st = curStep(t), sp = st && (st.k === 'coil' || st.k === 'bubble') && st.at - t <= 4 ? stepSpot(st, t) : null, inStep = !!sp && pgDist([x, y], sp.C) <= sp.R - 0.5;
    let best = null; const put = (k, text) => { if (!best || k < best.k) best = { k, text }; };
    for (const w of S.waves) { if (w.from === me || (w.kind === 'incub' && w.tank === me) || w.t1 < t || w.t0 - (w.warn || 1.5) > t) continue;
      for (let k = 0; k <= DUE + 1e-6; k += 0.25) if (inWave(w, t + k, x, y, 0.8)) { put(k, w.kind === 'tail' ? (inStep ? 'Small tail: stay in your circle, step to the clear side.' : 'Small tail: step into a gap between the red lanes.') : w.kind === 'her' ? 'Her wave: step out of its lane, into the green half.' : 'Beam waves: step out of the red lanes.'); break; } }
    G.eggs.forEach((e) => { if (e.state === 'air' && e.land >= t && e.land - t <= DUE && Math.hypot(x - e.x, y - e.y) <= 5.2) put(e.land - t, 'An egg is falling on you: step out of the white circle.'); });
    S.impacts.forEach((m) => { if (t >= m.t0 && m.at >= t && m.at - t <= DUE && Math.hypot(x - m.x, y - m.y) <= m.r + 1.2) put(m.at - t, m.name === 'Toxic Womb' ? 'The Womb lands in the middle: step out of its circle.' : 'Step out of the brown circle.'); });
    if (best) return best.text;
    for (const th of S.thrash) if (t >= th.t0 - 1 && t <= th.at && Math.hypot(x - th.x, y - th.y) < th.r + 3) return S.bubbles.some((q) => q.stack && t >= q.stack - 1 && t < q.at) ? 'Run to the Wretch in front of her, out of the orange circle.' : 'Run away from her tail: out of the orange circle.';
    for (const wr of S.wrath) if (t >= wr.t0 && t <= wr.at + 3.2 && wr.tank !== me && Math.hypot(x - wr.p[0], y - wr.p[1]) <= 7) return 'Step out of the red circle in front of her.';
    for (const bm of S.beams || []) { if (t < bm.t0 || t > bm.t1 || bm.tank === me) continue; const tk = G.bots[bm.tank]; if (tk && segDist([x, y], bm.from, [tk.x, tk.y]) <= 3) return 'Step out of the venom beam\'s line.'; }
    for (const s of S.soaks) if (!s.group.includes(me) && t >= s.t0 - 0.5 && s.at >= t && s.at - t <= 3.5 && Math.hypot(x - s.x, y - s.y) <= s.r + 1) return 'Stay out of the ' + ORD(s) + ' coil: it\'s the other team\'s.';
    return null; };
  // (a melee told to get close to a target in her tail's sweep or the half her waves hit first: wait, then hit it. The audit: 0:41 to 0:57, "Kill the Rawlings ...
  //  get close to it" sent melee into the 0:49 sweep and the half hit first)
  const tgtUnsafe = (t, dc) => { if (P2 || rl(me) !== 'm' || (dc !== 'rawling' && dc !== 'wretch')) return null; const o = nearestRight(t); if (!o || (o.kind !== 'rawling' && o.kind !== 'wretch')) return null; const w2 = dc === 'rawling' ? ['the Rawlings are', 'them'] : ['the Wretch is', 'it'];
    for (const th of S.thrash) if (t >= th.t0 - 4 && t <= th.at && pgDist(o.p, [th.x, th.y]) <= th.r + 1) return 'Wait: ' + w2[0] + ' in the tail sweep. Hit ' + w2[1] + ' after.';
    const hv = halvesAt(t); if (hv && t <= hv.t0 + 15.5) { const inFirst = o.p[0] * hv.d[0] + o.p[1] * hv.d[1] > 0; if (hv.swap ? !inFirst : inFirst) return 'Wait: ' + w2[0] + ' in the red half. Hit ' + w2[1] + ' after the wave.'; }
    return null; };
  const jobPick = () => { if (!G || !S) return { text: '', r: 'e' }; const rw = ringWarn(); if (P2) return rw ? { text: rw, r: 'a' } : { text: P2.jobText() || '', r: 'p' };
    const t = G.t, dz = dangerNow(t); if (dz) return { text: dz, r: 'a' };
    const st = curStep(t), held = !!myEggHeld(), sp = stepSpot(st, t), mineIn = !!sp && sp.inside(G.x, G.y), rt = sp && !mineIn ? route([G.x, G.y], sp.T, t, sp.C) : null, wait = !!(rt && rt.wait), egT = held ? ' Your egg breaks there.' : '';
    if (st) { const due = st.at - t <= DUE;
      if (st.k === 'egg') return due ? { text: mineIn ? 'Wait here, next to your egg\'s gold circle.' : 'Go next to your egg\'s gold circle now.', r: 'b', st } : { text: wait ? WAITTXT : 'Go next to your egg\'s gold circle, not under it.', r: 'c', st };
      if (st.k === 'shell') return { text: 'Break your egg: Tab, then 1.', r: 'b', st };
      if (st.k === 'pick') return { text: 'Pick up your egg: walk over it.', r: 'b', st };
      if (st.k === 'bubble') { const q = st.q, oc = S.soaks.find((s) => !s.group.includes(me) && s.at >= t && s.at <= q.at + 2 && t >= s.cast), inB = pgDist([G.x, G.y], q.p) <= 9.2 && !(oc && pgDist([G.x, G.y], [oc.x, oc.y]) <= oc.r + 0.8);
        if (due) return { text: inB ? 'Stay in the yellow bubble until it pops.' : 'Get in the yellow bubble now!', r: 'b', st };
        return { text: wait ? WAITTXT : oc ? 'Get in the yellow bubble, outside the ' + ORD(oc) + ' coil: it isn\'t yours.' : 'Get in the yellow bubble ' + whereOf(q.p, q.at) + '.', r: 'c', st }; }
      if (st.k === 'coil') { const s = st.s, pre = S.soaks.find((z) => z.set === s.set && !z.group.includes(me) && z.at > t && z.at < s.at), inC = pgDist([G.x, G.y], [s.x, s.y]) <= s.r - 0.6 && !(pre && pgDist([G.x, G.y], [pre.x, pre.y]) <= pre.r + 0.8);
        if (inC || due) return { text: inC ? 'Stand in your coil (the ' + ORD(s) + ' to appear) until it slams.' + egT : 'Get in your gold coil now!', r: 'b', st };
        if (pre) return { text: 'Wait outside the ' + ORD(pre) + ' coil: yours is the ' + ORD(s) + '.', r: 'c', st };
        return { text: wait ? WAITTXT : t < s.t0 ? 'Wait by her tail: your coil is the ' + ORD(s) + ' to appear.' : 'Go to your coil (the ' + ORD(s) + ' to appear) by her tail.', r: 'c', st }; }
      if (st.k === 'heart' && sp && !mineIn) return { text: wait ? WAITTXT : 'Go to her edge: hit the heart from there.', r: 'c', st }; }
    // (w: her waves in two steps, by the floor's colours, never a compass word: wait in the green half, then as the first wave goes by, cross now. The audit: one
    //  line for 14 s and nothing at the 1:00.5 swap; "the west half" meant little with the 3D camera turning)
    const hv = halvesAt(t); if (hv) { const inFirst = G.x * hv.d[0] + G.y * hv.d[1] > 0, inGreen = hv.swap ? inFirst : !inFirst;
      return { text: hv.swap ? (inGreen ? 'Stay in the green half.' : 'Now cross into the green half, behind the wave.') : (inGreen ? 'Wait in the green half.' : 'Get into the green half.'), r: 'w' }; }
    const dc = dpsCat(t); if (dc && !onRight(dc, tgtNow(t))) return { text: tgtUnsafe(t, dc) || DPS_SAY[dc][0] + ': press Tab, then keep pressing 1' + (rl(me) === 'm' ? ' (melee: get close).' : '.'), r: 'd' };
    if (held) return { text: 'Carry it to your coil. Dodge waves, keep out of other carriers\' rings.', r: 'e' };
    if (t >= 145.5) return { text: 'Keep hitting the heart. Step out of the brown circles.', r: 'e' };
    return { text: dc ? 'Keep pressing 1: you\'re on the right target.' : 'Hit Ula\'tek and dodge what comes.', r: 'e' }; };
  const jobText = () => jobPick().text;
  // (NEXT: your next step after the one NOW is on, and where, from 10 s before it. Hidden when nothing of yours is coming. A later part gives its own, P2.nextText)
  const stepSay = (s) => (s.k === 'bubble' ? 'Then: get in the yellow bubble ' + whereOf(s.q.p, s.q.at) + '.' : s.k === 'coil' ? 'Then: soak your coil, the ' + ORD(s.s) + ' to appear, by her tail.' : s.k === 'egg' ? 'Then: go next to your egg\'s gold circle.' : s.k === 'heart' ? (s.mel ? 'Then: hit the heart from her edge.' : 'Then: hit the heart.') : 'Then: break your egg and pick it up.');
  const nextText = (jl) => { if (!G || !S) return ''; if (P2) return typeof P2.nextText === 'function' ? P2.nextText() || '' : ''; const t = G.t, L = mySteps(t).filter((s) => s.k !== 'pick' && s.k !== 'shell' && !(s.k === 'heart' && t >= 145.5)), now = jl && jl.st;
    const n = now ? L.find((s) => s.id !== now.id && s.at > now.at + 0.3) : L[0]; return n && n.at - t <= 10 ? stepSay(n) : ''; };
  // (the gold "Your spot" on the floor while you carry your egg: your spot in the bubble or your coil)
  const mySpot = () => { if (!G || !S || !myEggHeld()) return null; if (P2) { const jm = jobOf(me, G.t); return jm.ob ? spotIn(jm.ob, me) : null; } const st = curStep(G.t); if (!st || (st.k !== 'bubble' && st.k !== 'coil')) return null; const sp = stepSpot(st, G.t); return sp ? sp.T : null; };
  // ---- hints (Nov 15, Flex: "maybe having some warnings on screen of whats coming next to help the player a bit"): the next three things that
  // matter to you, and an arrow at your feet to where your job wants you now (the same target the bots and the autopilot follow, round the waves
  // the way they dodge), with a "Go here" ring. On by default; a switch on the start card, remembered. ----
  let hints = (() => { try { return localStorage.getItem('wla-pg-hints') !== '0'; } catch (e) { return true; } })();
  // (your look in 3D, Flex, Nov 16: a wizard for ranged, a cleric for healers, "another one for ranged classes like a hunter": Auto picks by your
  //  role (and Hunter by your class on the team plan); the chip on the card goes round the figures. Saved in this browser only.)
  //  Then a figure for every WoW class (Flex: "Are there models that can match each class in wow?", "yes! do as many as you can"): auto picks
  //  each raider's class from the team plan (else the role), and the card's Look list picks yours.)
  const LOOKN = { auto: 'Auto (your class or role)', knight: 'Knight', warrior: 'Warrior', paladin: 'Paladin', hunter: 'Hunter', rogue: 'Rogue', priest: 'Priest', deathknight: 'Death Knight', shaman: 'Shaman', mage: 'Mage', warlock: 'Warlock', monk: 'Monk', druid: 'Druid', demonhunter: 'Demon Hunter', evoker: 'Evoker' }, LOOKS = Object.keys(LOOKN);
  let look = (() => { try { const v = localStorage.getItem('wla-pg-look'); return LOOKS.includes(v) ? v : 'auto'; } catch (e) { return 'auto'; } })();
  // (the boss-mod bars' names, one per mechanic from start to end, as the calls and the job line say them (the audit: "Fester Burst" turned into "Bubble: get in"
  //  halfway, "Mephitic Thrash" into "Tail sweep: out of 35 yards"))
  const upNext = (t) => { if (P2) return P2.upNext(t); const L = [], add = (at, text, c) => { if (at > t && at - t <= 30) L.push({ at, text, c }); }, car = carrierOf(me);
    G.eggs.filter((e) => e.id === me && e.state === 'air').forEach((e) => add(e.land, 'Your egg lands', '#f3c969'));
    if (!car) S.eggSets.forEach((e) => add(e.land, 'Eggs land', '#e6e0c8'));
    S.soaks.filter((q) => q.group.includes(me)).forEach((q) => add(q.at, 'Your coil (' + ORD(q) + ')', '#24f2cb'));
    S.bubbles.forEach((q) => { const w = S.wretches.find((z) => z.id === q.w); if (w && q.at < w.dies) add(q.at, 'Bubble', '#d8f22f'); });
    S.thrash.forEach((q) => add(q.at, 'Tail sweep', '#ff9b4a')); S.wings.forEach((w) => add(w.t + 6, 'Her waves', '#9be13a'));
    { const r0 = G.adds.filter((a) => a.kind === 'rawling' && a.born != null && !a.boil).sort((p, q) => p.born - q.born)[0]; if (r0) add(r0.born + 25, 'Rawlings boil', '#ff8f87'); }
    S.wrath.forEach((q) => add(q.at, 'Her bites', '#ff8f87')); add(S.dive.t0, 'She dives', '#7fd8ff'); add(145.5, 'Heart open', '#ff8a5a');
    return L.sort((a, b) => a.at - b.at).slice(0, 3); };
  let hintC = null; const hintNow = () => { if (!hints || !G || !S || window.__pgAuto || G.kb) return null; if (hintC && hintC.t === G.t && hintC.me === me && hintC.S === S) return hintC.h;
    // (Flex, Nov 15: "the move here thing should only be for specific mechanics ... where to stand for things like soaks, not how to dodge waves": your coil
    // soak, the Wretch's bubble and your egg; never the waves, the tail's sweep or her reach)
    // (your egg on the floor: from its landing when only its own shell holds it (phase 1, the intermission: go and hit it); one held by something else
    //  (phase 2's, e.lock: the Warden's shield, a south egg to break out) once it opens, its Warden dead. The release sweep, Nov 16: in phase 2 the arrow
    //  pointed at your shielded egg from 2:55 till the Warden died: Warden's Protection, your tether broken early, Malice out of your kick's reach)
    //  (its Warden dead, not just not up: the release check, Nov 16. Before the Wardens rise at 2:55 none was up, so from 2:47.7 the arrow pointed at your egg
    //  across the venom while the job line said to walk into your gate. tests/practice-game.js check Q)
    // (the prompts audit, Nov 16: phase 1's arrow follows your step (stepSpot: from when the job line names it, to your spot, gone only inside what the game counts);
    //  a later part's goes to its job's spot and goes away inside that spot's ob.r, the radius it counts (2.5 when it gives none); every part's bends round a
    //  coil that isn't yours or another carrier's ring, and says Wait while a wave crosses the way or nothing gets round (route))
    const t = G.t; let T = null, what = '', rad = 2.5, h = null, C = null;
    if (P2) { const j = jobOf(me, t), eg = G.eggs.find((e) => e.id === me && e.state === 'floor' && (!e.lock || (t >= e.shell - 1 && !!(G.p2 && G.p2.wdead && G.p2.wdead[e.side] != null))));
      if (j.ob) { T = spotIn(j.ob, me) || j.ob.p.slice(); what = 'spot'; } else if (eg) { T = [eg.x, eg.y]; what = 'egg'; }
      if (j.ob && j.ob.r > 0) rad = j.ob.r; if (j.ob) C = j.ob.p; }
    else { const sp = stepSpot(curStep(t), t); if (sp && !sp.inside(G.x, G.y)) { T = sp.T; what = sp.what; rad = sp.rad; C = sp.C; } }
    if (T && pgDist(T, [G.x, G.y]) > (P2 ? rad : 0.05)) { const rt = route([G.x, G.y], T, t, C); h = { T: rt.P, d: pgDist(rt.P, [G.x, G.y]), what, wait: rt.wait, fin: T, rad }; }
    hintC = { t, me, S, h }; return h; };
  const hud = (force) => { const t = G.t, c = castNow(t), dv = dpsView(), key = Math.floor(t * 4) + '|' + Math.round(G.hp) + '|' + G.log.length + '|' + (c ? c.name : '') + '|' + (G.tgt || '') + (dv && dv.inRange ? 'i' : 'o') + '|' + (G.lastHitT || 0) + '|' + (dv && dv.cd > 0 ? Math.ceil(dv.cd * 8) : 0);
    if (!force && key === hudKey) return; hudKey = key;
    $('.pg-mn').textContent = role.name + ' (you)'; { const mj = $('.pg-mj'); mj.textContent = role.job; mj.title = role.job; } /* (cut short in the frame: the whole job on hover) */
    const hp = Math.max(0, Math.round(G.hp)), hb = $('.pg-hp'); hb.querySelector('i').style.width = hp + '%'; hb.querySelector('span').textContent = Math.round(PG_HP_K * hp / 100) + 'K | ' + hp + '%'; /* (as Flex's own frame reads, Nov 15: "735K | 100%") */
    hb.querySelector('i').style.background = clsC(me) || (GDZ_ROLE[rl(me)] || GDZ_ROLE.r)[1]; /* (your class colour, else your role's: one colour, as in the game) */ hb.className = 'pg-bar pg-hp ' + (hp < 35 ? 'low' : hp < 65 ? 'mid' : '');
    $('.pg-debs').innerHTML = Object.entries(G.debs).filter(([, v]) => v.until > t).concat(myEggHeld() ? [['shell', { until: t + 99, n: 1 }]] : []).map(([kk, v]) => { const dd = DEB[kk]; return '<span style="border-color:' + dd[1] + ';color:' + dd[1] + '">' + esc(dd[0]) + (v.n > 1 ? ' ×' + v.n : '') + (v.until - t < 60 ? ' <em>' + Math.ceil(v.until - t) + '</em>' : '') + '</span>'; }).join('');
    $('.pg-clk').textContent = pgClock(t); const bh = $('.pg-bhp'); bh.querySelector('i').style.width = G.bossHp.toFixed(1) + '%'; bh.querySelector('span').textContent = Math.round(G.bossHp) + '%';
    const cb = $('.pg-cast'); if (c) { cb.style.display = 'block'; cb.querySelector('i').style.width = (c.intr ? 100 : Math.min(100, (t - c.t0) / (c.t1 - c.t0) * 100)) + '%'; cb.querySelector('span').textContent = c.intr ? c.name : (c.who === 'tail' ? 'Gore Rattle: ' : c.who === 'wretch' ? 'Wretch: ' : '') + c.name + (P2 && c.kick ? ' · kick!' : '') + '  ' + Math.max(0, c.t1 - t).toFixed(1);
      cb.classList.toggle('intr', !!c.intr); cb.classList.toggle('nok', !!P2 && !c.kick && !c.intr); } else cb.style.display = 'none'; /* (phase 2, as in WoW: gold you can kick, grey you can't, red "Interrupted") */
    modsDraw(t);
    // (a line stays up at least 2.5 s, unless a dodge or a step due now takes over; NEXT under it while hints are on)
    { const jl = jobPick(), J = G.jobShow, calm = (r) => r === 'c' || r === 'w' || r === 'd' || r === 'e', hold = !!J && J.text !== jl.text && G.t >= J.t && G.t - J.t < 2.5 && calm(J.r) && calm(jl.r);
      if (!hold && (!J || J.text !== jl.text)) G.jobShow = { text: jl.text, r: jl.r, t: G.t };
      $('.pg-job p').textContent = G.jobShow.text; const nx = $('.pg-job .pg-nx'); if (nx) nx.textContent = hints ? nextText(jl) : ''; }
    $('.pg-mc').textContent = G.log.length;
    tfDraw(tgtFrame(t)); const tg = $('.pg-tgt'); if (tg) tg.innerHTML = tgtHint(dv);
    { const tb = $('.pg-tab'); if (tb) { const hot = !!(dv && dv.cat && !dv.ok), good = !!(dv && dv.ok); tb.classList.toggle('hot', hot); tb.classList.toggle('good', good); tb.querySelector('span').textContent = dv && dv.cur ? dv.cur.name.split(' ').pop() : 'Target'; }
      const ab = $('.pg-atk'); if (ab) { const rdy = !!dv && dv.cd <= 0, ai = atkIc(); ab.classList.toggle('hot', !!(dv && dv.cat && rdy && !dv.ok)); ab.classList.toggle('good', !!(dv && dv.ok)); ab.classList.toggle('far', !!(dv && dv.cur && !dv.inRange)); ab.classList.remove('on'); ab.querySelector('span').textContent = dv && dv.cur && !dv.inRange ? 'Too far' : 'Attack'; ab.querySelector('i').style.height = dv && dv.cd > 0 ? (dv.cd / GCD * 100).toFixed(1) + '%' : '0';
        const an = ab.querySelector('.pg-cdn'); if (an) an.textContent = dv && dv.cd > 1 ? Math.ceil(dv.cd) : ''; if (ai !== atkShown) { atkShown = ai; icSet(ab, ai); } } } /* (the attack's icon is your role's: a melee strike, a firebolt, a healer's smite) */
    [['sprint', G.sprint, 30], ['def', G.def, 90], ['aoe', G.aoe0 == null ? -99 : G.aoe0, AOE.cd]].forEach(([kk, at, cd]) => { const el = $('.pg-act[data-a="' + kk + '"] i'), left = cd - (t - at); el.style.height = left > 0 ? (left / cd * 100).toFixed(1) + '%' : '0'; const n = $('.pg-act[data-a="' + kk + '"] .pg-cdn'); if (n) n.textContent = left > 1 ? Math.ceil(left) : ''; }); if (P2) P2.hud(t); };
  // ---- the target frame (Nov 15, Flex: "theres also no healthbar for the target. This should look/feel like youre playing the game(kind of)"): your target's
  // name and a hostile red health bar. An add's own health; Ula'tek, her tail and her heart share hers (they are all her); a Wretch's by the clock, from waking
  // to dying; anything else (phase 2's targets have no health) a full bar with no number. No target: a dim frame, "Tab to pick". A hit flashes the bar ----
  const tgtFrame = (t) => { if (!G) return null; const o = tgtNow(t); if (!o) return { none: true, name: 'No target' }; let pct = null;
    // (Flex, Nov 15: "the health bars in p2 arent moving": phase 2's targets carried no health, so the frame showed a full bar that never moved. A part's
    //  target can give hpFr (0 to 1), and an add in G.adds shows its own health whoever lists it)
    const ad = !o.max && o.hpFr == null ? G.adds.find((q) => q.id === o.key) : null;
    if (o.max) pct = Math.max(0, o.hp == null ? o.max : o.hp) / o.max * 100; else if (o.hpFr != null) pct = o.hpFr * 100; else if (ad) { const mx = ADD_HP[ad.kind] || 3; pct = Math.max(0, ad.hp == null ? mx : ad.hp) / mx * 100; }
    else if ((o.kind === 'boss' || o.kind === 'tail' || o.kind === 'heart') && typeof G.bossHp === 'number') pct = G.bossHp;
    else if (o.kind === 'wretch') { const w = (S.wretches || []).find((q) => q.id === o.key); if (w && w.dies > w.awake) pct = Math.max(0, Math.min(1, (w.dies - t) / (w.dies - w.awake))) * 100; }
    let tot = null; if (o.kind === 'boss' || o.kind === 'tail') tot = S.herTank ? S.herTank(t) : null; else if (o.kind === 'viper') { const a = G.adds.find((q) => q.id === o.key); tot = a && a.tank ? a.tank : me; } /* (its target, as the target frame shows it after a ">" (Flex's UI)) */
    return { none: false, key: o.key, name: o.name, tot: tot ? (tot === me ? role.name + ' (you)' : nm(tot)) : null, totC: tot ? clsC(tot) || (GDZ_ROLE[rl(tot)] || GDZ_ROLE.r)[1] : null, pct: pct == null ? null : Math.max(0, Math.min(100, pct)), range: inRange(o) }; };
  let hitSeen = null, tfFlash = 0;
  const tfDraw = (tf) => { const el = $('.pg-tf'); if (!el || !tf) return; el.classList.toggle('none', !!tf.none); el.classList.toggle('far', !tf.none && !tf.range);
    $('.pg-tfn').innerHTML = esc(tf.name) + (tf.tot ? ' <em class="pg-tot" style="color:' + tf.totC + '">&gt; ' + esc(tf.tot) + '</em>' : ''); $('.pg-tfr').textContent = tf.none ? 'Tab to pick' : tf.range ? '' : 'Out of range';
    const bar = $('.pg-tfh'); bar.querySelector('i').style.width = (tf.none ? 0 : tf.pct == null ? 100 : tf.pct).toFixed(1) + '%'; bar.querySelector('span').textContent = tf.none || tf.pct == null ? '' : Math.round(tf.pct) + '%';
    const h = G.hits || 0; if (h !== hitSeen) { const nw = hitSeen != null && h > hitSeen; hitSeen = h; if (nw && !window.__pgAuto) { tfFlash++; el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); } } }; /* (by the hit count: two hits in one step still flash) */
  // (the line under it: what to do about your target, only while a moment needs one: the wrong one picked, too far, or not hitting it)
  const tgtHint = (dv) => { if (!dv || !dv.cat || dv.ok) return ''; { const un = tgtUnsafe(G.t, dv.cat); if (un) return '<span class="pg-tgr">' + esc(/sweep/.test(un) ? 'Wait: hit after the sweep' : 'Wait: hit after the wave') + '</span>'; } /* (never "get close" into the sweep or the red half: the prompts audit, Nov 16) */ const s0 = (DPS_SAY[dv.cat] || ['Hit the right target'])[0], right = !!dv.cur && isRight(dv.cat, dv.cur);
    return '<span class="pg-tgr">' + esc(!right ? s0 + ': press Tab' : !dv.inRange ? (rl(me) === 'm' ? 'Too far: get close to it' : 'Too far: get closer') : s0 + ': keep pressing 1') + '</span>'; };
  // ---- the boss mods (Nov 15, Flex: "Boss mods"): timer bars like DBM or BigWigs on the left, the coming-up hints (when hints are on) and the boss-mod timers
  // in one list, the same thing once (by name, or the same spell within 1.5 s), soonest first, five at most. Each bar has its spell's icon (the site's, by the
  // fight's spell names in the engine), its name, the seconds left and a fill that empties as the time runs out; under 5 s it lights up ----
  const MOD_SP = [[/coil/i, 'Spectral Coils'], [/womb/i, 'Toxic Womb'], [/beam/i, 'Toxic Incubation'], [/bubble|fester/i, 'Fester Burst'], [/wrath|bites/i, 'Mother\'s Wrath'], [/thrash|tail sweep/i, 'Mephitic Thrash'],
    [/heart|rage/i, 'Rage of the Shackled'], [/debris/i, 'Falling Debris'], [/small tail/i, 'Gore Rattle'], [/wave/i, 'Caustic Waves'], /* ("Small tails" its own bar: the prompts audit, Nov 16, found it merged into "Her waves" at 0:56 and 1:53) */ [/malice/i, 'Malice'], [/cry|doomscale/i, 'Anguished Cry'], [/prey/i, 'Circling Prey'], [/echoes/i, 'Vicious Echoes'], [/bite/i, 'Serpent\'s Bite'], [/purge/i, 'Volatile Purge'], /* (phase 3's: one bar per mechanic, the personal one first; the prompts audit, Nov 16, found three bars for one Circling Prey) */ [/fangs|break/i, 'Grasping Fangs'], [/egg/i, null]];
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
  const AOE_IC = { m: 'ability_whirlwind', t: 'ability_whirlwind', r: 'spell_fire_selfdestruct', h: 'spell_holy_innerfire' }; /* (Whirlwind, Flamestrike, Consecration) */
  const atkIc = () => ATK_IC[rl(me)] || ATK_IC.m; let atkShown = null;
  const actDeco = (h) => String(h).replace(/<div class="pg-act(?: [^"]*)?" data-a="(\w+)"[^>]*>(?!<img class="pg-ai")/g, (m0, a) => { const n = a === 'atk' ? atkIc() : a === 'aoe' ? AOE_IC[rl(me)] || AOE_IC.m : ACT_IC[a]; return n ? m0 + '<img class="pg-ai" data-ic="' + n + '" alt="">' : m0; });
  const actsHtml = () => actDeco('<div class="pg-act pg-tab" data-a="tgt" role="button" tabindex="0" title="Pick a target (Tab)."><b>Tab</b><span>Target</span></div>' +
    '<div class="pg-act pg-atk" data-a="atk" role="button" tabindex="0" title="Hit your target (1). Press it again as soon as it is ready."><b>1</b><span>Attack</span><i></i><em class="pg-cdn"></em></div>' +
    '<div class="pg-act pg-aoe" data-a="aoe" role="button" tabindex="0" title="Area attack (2): hits everything within 8 yards of your target, every 8 s."><b>2</b><span>Area</span><i></i><em class="pg-cdn"></em></div>' +
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
  const myTimers = (t) => S.timers.filter((q) => q.t > t).filter((q) => { const m = /^Coil slam (\d)$/.exec(q.name); return !m || S.soaks.some((z) => Math.abs(z.at - q.t) < 0.01 && z.k === +m[1] - 1 && z.group.includes(me)); }).map((q) => { const m = /^Coil slam (\d)$/.exec(q.name); return m ? { ...q, name: 'Your coil (' + (m[1] === '1' ? 'first' : 'second') + ')' } : q; }).filter((q, i, a) => a.findIndex((z) => z.name === q.name) === i).slice(0, 5);
  // (Main, Nov 15, phase 3 at 7:10 and 8:25: four to six calls shared one line, ran to two lines and under the minimap. Now at most two calls show at
  // once, the one about you first; the rest wait their turn, and a call that has waited 4 s is dropped: the boss-mod bars already have it)
  // (the prompts audit, Nov 16: a call is yours, gold, first in line and pinging, because it is marked so (me, worked out for you as it fires, or a part's gold
  //  colour), or because it names your own thing first ("Your coil: ...", "Your kick: ..."). Not because it says "you" somewhere: 10 of 14 phase 3 calls
  //  drew gold that way, and "Venom beam ... only the tank stands in it" went gold to everyone)
  const myCall = (w) => (w.me != null ? (w.me ? 1 : 0) : w.c === '#f3c969' || /^Your\b/.test(w.text) ? 1 : 0), nowCall = (w) => (/\bnow\b/i.test(w.text) ? 1 : 0);
  // (Main's playtest, Nov 15: "Circling Prey: move one quarter left, you have 8 s!" said at 9:05 was still up at 9:18. The line only faded on a screen timer,
  //  which stops when the page isn't in front. Now it goes by the game's clock: a call clears 3.2 s after it shows, a call that gives you N seconds counts
  //  them down and clears when they run out (its moment has passed))
  // (Flex, Nov 16: "I think the alerts need some work", then "Yes" to the mock: each call is a boss-mod alert, the spell's icon, a short order in big letters,
  // the spell and the rest under it, a live countdown on the right; gold when it's about you, the call's own colour otherwise; two at most, the second smaller)
  const alSplit = (r) => { const s1 = /^(.+?)[!.](\s|$)/.exec(r); let o = s1 ? s1[1] : r, d = s1 ? r.slice(s1[0].length).trim() : ''; if (o.length > 40) { const k = o.indexOf(', '); if (k > 8) { d = (o.slice(k + 2) + (d ? ' ' + d : '')).trim(); o = o.slice(0, k); } } return [o.trim(), d]; };
  const alertOf = (it, t, small) => { const m = /^([^:!?]{3,40}):\s*(.+)$/.exec(it.text), title = m ? m[1].trim() : '', rest = (m ? m[2] : it.text).replace(/,?\s*you have \d+ s\b/i, '').trim(), [order, detail] = alSplit(rest || it.text);
    const mine = !!myCall(it), col = mine ? '#f3c969' : it.c || '#e8edf2', sp = modSp(title || it.text); let ic = '';
    if (sp && typeof spellIcon === 'function') { try { ic = spellIcon(0, sp); } catch (e) { ic = ''; } }
    return '<div class="pg-al' + (mine ? ' you' : '') + (small ? ' small' : '') + '" style="--c:' + col + '"><span class="pg-ali">' + ic + '</span><span class="pg-alt"><b class="pg-alo">' + esc(order) + '</b>' +
      (title || detail ? '<span class="pg-ald">' + esc([title, detail].filter(Boolean).join(' · ')) + '</span>' : '') + '</span></div>'; }; /* (no countdown number on a call: Flex, Nov 16, "i feel like the game confuses people saying timestamps"; a call that gives you N s still stays up till they run out, and the boss-mod bars count) */
  const alertsHtml = (items, t) => items.map((it, i) => alertOf(it, t, i > 0)).join('');
  const alKey = (items) => items.map((it) => it.text + '|' + (myCall(it) ? 1 : 0)).join('~');
  const alPut = (el, items, t) => { const k = alKey(items, t); if (el.dataset.k === k) return; el.dataset.k = k; el.innerHTML = alertsHtml(items, t); if (typeof hydrateIcons === 'function') { try { hydrateIcons(); } catch (e) { /* (no icons here) */ } } };
  const callBy = (w) => (w.by != null ? w.by : ((m) => (m ? w.t + +m[1] : null))(/you have (\d+) s\b/.exec(w.text)));
  const callTxt = (it, t) => (it.by != null ? it.text.replace(/you have \d+ s\b/, 'you have ' + Math.max(1, Math.ceil(it.by - t)) + ' s') : it.text);
  // (the prompts audit, Nov 16: a call worked out for you as it fires (per: your coil, your egg); a small tail's call only when its lanes come near you or your spot;
  //  a call about a later moment (at) waits while a step of yours under 3 s away comes first (the 2:16 bubble call covered a Soak #2 player's 2:17 coil), and
  //  doesn't age out while it waits; yours first, then the "now" calls)
  const tailNear = (tt) => { const sp = mySpot(); return (S.waves || []).some((w) => w.kind === 'tail' && Math.abs(w.t0 - tt) < 0.05 && [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6].some((k) => inWave(w, w.t0 + k, G.x, G.y, 5) || (sp && inWave(w, w.t0 + k, sp[0], sp[1], 3)))); };
  const waitsFor = (w) => w.at != null && stepSoon(G.t, w.at);
  const warns = () => { const Q = G.warnQ || (G.warnQ = []);
    while (G.warnI < S.warns.length && S.warns[G.warnI].t <= G.t) { const w0 = S.warns[G.warnI++], pw = typeof w0.per === 'function' ? w0.per(me) : null; if (pw === false || (w0.tail != null && !tailNear(w0.tail))) continue; Q.push({ ...w0, ...(pw || {}), q: G.t }); }
    for (let i = Q.length - 1; i >= 0; i--) { if (waitsFor(Q[i])) Q[i].q = G.t; else if (G.t - Q[i].q > 4) Q.splice(i, 1); }
    { const L0 = G.lastWarn, e0 = $('.pg-warn'); if (L0 && L0.items) { const live = L0.items.filter((it) => (it.by != null ? G.t < it.by : G.t - L0.t < 3.2));
      if (!live.length) { if (e0) { e0.innerHTML = ''; e0.dataset.k = ''; e0.classList.remove('in', 'hold'); } G.lastWarn = null; }
      else if (live.length !== L0.items.length || live.some((it) => it.by != null)) { L0.items = live; L0.all = live.map((it) => it.text); L0.n = live.length; if (e0) { alPut(e0, live, G.t); e0.classList.toggle('hold', live.some((it) => it.by != null)); } } } }
    if (!Q.length) return; const L = G.lastWarn, age = L ? G.t - L.t : 99; if (L && L.n >= 2 && age < 2.2) return; /* (the line is full: the rest wait) */
    const ready = Q.filter((w) => !waitsFor(w)).sort((a, b) => myCall(b) - myCall(a) || nowCall(b) - nowCall(a) || a.t - b.t); if (!ready.length) return;
    const join = !!L && L.n === 1 && age < 1.5, take = ready.slice(0, join ? 1 : 2); take.forEach((w) => Q.splice(Q.indexOf(w), 1)); const take2 = take.filter((w) => !(join && w.text === L.all[0]));
    if (!take2.length) return; sfx(take2.some(nowCall) ? 'now' : take2.some(myCall) ? 'you' : 'call'); const items = (join ? [L.items[0]] : []).concat(take2.map((w) => ({ text: w.text, c: w.c, by: callBy(w), me: w.me }))), all = items.map((it) => it.text), el = $('.pg-warn');
    G.lastWarn = { t: G.t, n: all.length, all, items }; alPut(el, items, G.t); el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); el.classList.toggle('hold', items.some((it) => it.by != null)); };

  // ---- the cards: pick your role, the countdown, a death, the end ----
  const asg = (id) => { const J = !TEAM && myJob && jobSlot(myJob) === id ? myJob : null, SK = J ? jobSoak(id, J) : PG_UL.soak, L = [];
    const sets = SK.map((s) => (s[0].includes(id) ? 1 : s[1].includes(id) ? 2 : 0));
    if (carrierOf(id)) L.push(['Your egg', 'Your area: ' + ZN[id][0] + ', the ' + ZN[id][1] + ' spot. It lands there first. The second time, it lands in your zone turned with her (the gold circle shows it). Break its shell, walk over it, carry it clean, break it in your coil soak.']);
    else L.push(['No egg', 'Keep out of the carriers\' way.']);
    if (TEAM && sets[0]) L.push(['Coil soaks', 'Soak #' + sets[0] + (TEAM.ce[sets[0] - 1].includes(id) ? ' with your egg' : ' (filler)') + ': ' + (sets[0] === 1 ? 'the first coil to appear, both times' : 'the second coil to appear, both times') + '. They rise beside her tail, on either side. Your circle is gold. Never both: Soul Constrictor.']);
    else if (TEAM) L.push(['Coil soaks', 'Not yours: stay out of both circles.']);
    else L.push(['Coil soaks', 'First set: team ' + sets[0] + '. Second set: team ' + sets[1] + '. Team 1 takes the first coil to appear, team 2 the next. They rise beside her tail, on either side. Your circle is gold. Never both: Soul Constrictor.']);
    if (TEAM) TEAM.fb.forEach((f, i) => { const j = f.indexOf(id); if (j >= 0) L.push(['Fester Burst (' + (i ? 'third' : 'first') + ' bubble)', 'Your spot in the bubble: ' + (i ? 11 + j : 1 + j) + ' (a gold circle while you carry your egg).']); });
    else if (J && carrierOf(id)) L.push(['Fester Burst (first and third bubbles)', 'Your spot in the bubble is picked for you: the gold circle. Keep 3 yards from the other carriers.']);
    L.push(['The Wretch\'s bubble', 'Within 10 yards of the Wretch each time it swells, four times. For the third, run to it in front of her as her tail sweeps.']); L.push(['Her tail\'s sweep', 'Run out of 35 yards from her tail, twice.']);
    L.push(['Her waves', 'Twice: wait in the green half, then cross behind the first wave as the floor swaps.']); L.push(['Small tails', 'Two tails rise at the edge, always on the same spots, and each fires a short fan of three waves: stand in a gap between their red lanes.']);
    L.push(['Her reach', 'The red circle in front of her is her tank\'s.']); L.push(['The dive and the heart', 'She comes up on either side. When her heart opens, hit it and step out of the brown circles.']);
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
    const sets = SK.map((s2) => (s2[0].includes(id) ? 1 : s2[1].includes(id) ? 2 : 0));
    const G4 = [carrierOf(id) ? 'egg' : 'noegg', 'coil', 'bubble', 'wave'];
    L.push(carrierOf(id) ? 'You carry an egg (' + ZN[id][0] + '). It lands twice: pick it up once its shell breaks.' : 'No egg: keep out of the egg carriers\' way.');
    L.push(sets[0] || sets[1] ? 'Coil team ' + sets[0] + (sets[1] !== sets[0] ? ' first, then team ' + sets[1] : ' both times') + '. Team 1 takes the first coil to appear.' : 'No coil soak: stay out of both circles.');
    const fbn = TEAM ? TEAM.fb.map((q, i) => { const j = q.indexOf(id); return j >= 0 ? (i ? 11 + j : 1 + j) : 0; }).filter(Boolean) : [];
    L.push('Get in the Wretch\'s bubble each time it swells.' + (fbn.length ? ' Your spot: ' + fbn.join(' and ') + '.' : ''));
    L.push('Dodge every wave. Run out of her tail\'s 35 yards when it sweeps.');
    return '<ul class="pg-short">' + L.map((x, i) => '<li>' + pgGlyph(G4[i]) + esc(x) + '</li>').join('') + '</ul>'; };
  const START = [[0, 'The pull'], [30, 'First coils and the bubble'], [44, 'Tail sweep, then her waves'], [66, 'Second eggs and the dive'], [98, 'The hardest waves'], [124, 'Second coils'], [138, 'The last bubble and the heart burn']]; /* (no clock times on the card: Flex, Nov 16) */
  // ---- the setup: one screen (Flex via Main, Nov 15: "fix the setup menus in the game ... They are still too complex and confusing"). The part,
  // then two choices, your role and your job, each one row of big buttons, one plain sentence about the job, and one big Play that says what you'll
  // play: it's ready the moment the card opens (a sensible job, or the last one you played), so pressing Play is "just play". Hints, speed and where
  // to start are three small chips under it; no folding, no rundown (the guide page and the hints in the game teach the rest). With a team plan, one
  // choice: who you are. Every part gives the card the same setup (SETUP below; a later part's module gives its own as setup) ----
  const SROLE = { m: 'Melee', r: 'Ranged', h: 'Healer' }, EGG_BY = { m: 'm1', r: 'r5', h: 'r1' };
  const HEAL_EGG = 'Healers carry the same eggs as ranged. '; /* (the release sweep, Nov 16: a healer with an egg plays a ranged carrier's job, and the card didn't say so) */
  const SETUP = P2 ? P2.setup || null : {
    roles: ['m', 'r', 'h'],
    now: () => ({ role: myJob.role, job: myJob.egg ? 'egg' : myJob.soak[1] === 2 ? 'c2' : 'c1' }),
    jobs: () => [['egg', 'Egg carrier'], ['c1', 'First coil'], ['c2', 'Second coil']],
    set: (r, jb) => { const keep = jb === 'egg' && myJob.egg && myJob.role === r; myJob = { role: r, egg: jb === 'egg' ? (keep ? myJob.egg : EGG_BY[r]) : null, soak: jb === 'c2' ? [2, 2] : [1, 1], fb: [0, 0] }; jobSave(); },
    say: () => { const slot = jobSlot(myJob); return myJob.egg ? (myJob.role === 'h' ? HEAL_EGG : '') + 'You carry an egg. It lands ' + (ZN[slot][0] === 'by her' ? 'by her' : 'in the ' + ZN[slot][0]) + ': pick it up once its shell breaks, soak the first coil with it, then get in the Wretch\'s bubble.' :
      myJob.soak[1] === 2 ? 'You soak the second coil to appear, both times, and get in the Wretch\'s bubble.' : 'You soak the first coil to appear, both times, and get in the Wretch\'s bubble.'; },
  };
  const ric = (v) => (typeof GDZ_ROLE !== 'undefined' && GDZ_ROLE[v] ? '<img class="pg-ric" src="https://wow.zamimg.com/images/wow/icons/medium/' + GDZ_ROLE[v][2] + '.jpg" alt="" onerror="this.remove()">' : '');
  const tiles = (k, opts, cur) => '<div class="pg-tiles" role="group">' + opts.map(([v, t]) => '<button type="button" class="pg-tile' + (String(v) === String(cur) ? ' on' : '') + '" data-' + k + '="' + v + '" aria-pressed="' + (String(v) === String(cur)) + '">' + (k === 'sr' ? ric(v) : '') + '<span>' + esc(t) + '</span></button>').join('') + '</div>';
  const setupHtml = () => { if (TEAM) return '<div class="pg-srow"><span class="pg-sl">You</span><select class="pg-me">' + GDZ_RAID.filter((id) => TEAM.id2[id] && rl(id) !== 't').map((id) => '<option value="' + id + '"' + (id === role.id ? ' selected' : '') + '>' + esc(nm(id)) + ' · ' + esc(teamRole(id).job) + '</option>').join('') + '</select></div>' +
      '<p class="pg-say">Your job comes from <b>' + esc(TEAM.name) + '</b>: ' + esc(role.job) + '.</p>';
    if (!SETUP) return '<div class="pg-job0">' + P2.card() + '</div>'; /* (a part that has no setup yet keeps its own picker) */
    const nw = SETUP.now();
    if (mapsOn()) { try { return '<div class="pg-srow"><span class="pg-sl">Role</span>' + tiles('sr', SETUP.roles.map((r) => [r, SROLE[r]]), nw.role) + '</div>' + mapsHtml(SETUP.maps) + '<p class="pg-say">' + esc(SETUP.maps.say()) + '</p>'; } catch (e) { console.error('Practice setup maps:', e); /* (no maps here: the job row) */ } }
    return '<div class="pg-srow"><span class="pg-sl">Role</span>' + tiles('sr', SETUP.roles.map((r) => [r, SROLE[r]]), nw.role) + '</div>' +
      '<div class="pg-srow"><span class="pg-sl">Job</span>' + tiles('sj', SETUP.jobs(nw.role), nw.job) + '</div><p class="pg-say">' + esc(SETUP.say()) + '</p>'; };
  // (Flex, Nov 16: "each role should ideally be tested on as many mechanics as they are elgible to get", and "assigned positions in soaks, or where they pick
  // up eggs ... let them select those spots without it being crazy complex. I think visual maps that lets them select the spot is best, you should use the
  // plans maps so its something familiar". Phase 1: under your role, the Plan's own maps (ulSvg, UL_PAGES, as Plan draws them for the team's wowutils plan):
  // Your egg, the eight quadrant spots (melee by her, left, right, far; the centre and the edge one), and Your coil, Right Soak #1 or Left Soak #2. You are
  // the gold token; every spot your role can take has a dashed ring to click. You carry an egg and soak a coil by default, as the plan has everyone)
  // ---- the spot maps (Flex, Nov 16). The contract every part gives its setup as SETUP.maps (phase 1's below; a later part's module gives its own):
  //   tabs() -> [[key, label]], tab: the key shown now (read and written by the card), page(key) -> { svg, vb } (svg: the Plan's own map, ulSvg of a UL_PAGES
  //   page, with you on it; vb: its view box [x, y, w]), hot(key) -> [{ id, x, y, r, title, on, big, you }] (the spots you can click, in room yards, the same
  //   frame as the Plan's maps; r in yards; on: yours now; you: draw the gold You token there; big: a whole area like a soak circle), pick(key, id) (take
  //   that spot), extras() -> [[id, label, on]] (small buttons like No egg) and extra(id), random() (Flex: "for people who dont have assignments yet maybe
  //   randomize their assignments"), role(r) (a new role: keep the spots it can take, move the rest), say() -> one sentence, sub() -> the Play button's line.
  //   Spots go where the game really puts you (Flex, Nov 16: "make sure the maps are placed properly it looks off"). Every role takes every mechanic it can
  //   by default (Flex: "each role should ideally be tested on as many mechanics as they are elgible to get") ----
  const mapsOn = () => !TEAM && !!(SETUP && SETUP.maps) && typeof ulSvg === 'function' && typeof UL_PAGES !== 'undefined' && typeof UL_VB !== 'undefined';
  const MX = (x) => +(340 + x * 2.083).toFixed(1), MY = (y) => +(240 - (y + 0.9) * 2.083).toFixed(1); /* (room yards on the Plan's maps, as ulSvg draws them) */
  // (a tab with no Plan map (page(key) -> null) shows its spots as plain buttons instead: { id, lab, note, on }. Flex, Nov 16, on a made-up phase 3 map:
  // "where did this come from? Theres no map like this in the plan section", "the soak assignments are just who stands in the soaks", "the soaks are not
  // spread out on mythic". Only the Plan's own maps are drawn; a job that isn't a place is a button)
  const spotBtns = (M, tab) => '<div class="pg-seg pg-spl" role="group" aria-label="Pick one">' + M.hot(tab).map((h) => '<button type="button" data-mh="' + esc(h.id) + '"' + (h.on ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + (h.title ? ' title="' + esc(h.title) + '"' : '') + '><span class="pg-spn">' + esc(h.lab || h.title) + '</span>' + (h.note ? '<span class="pg-spt">' + esc(h.note) + '</span>' : '') + '</button>').join('') + '</div>';
  const mapsHtml = (M) => { const T = M.tabs(), tab = T.some((q) => q[0] === M.tab) ? M.tab : T[0][0], pg = M.page(tab), vb = pg ? pg.vb : [0, 0, 380], k = vb[2] / 380;
    const hot = pg && M.hot(tab).map((h) => '<circle class="pg-hs' + (h.on ? ' on' : '') + (h.big ? ' big' : '') + '" data-mh="' + esc(h.id) + '" cx="' + MX(h.x) + '" cy="' + MY(h.y) + '" r="' + (h.r * 2.083).toFixed(1) + '"><title>' + esc(h.title) + '</title></circle>' +
      (h.you ? '<g pointer-events="none"><circle cx="' + MX(h.x) + '" cy="' + MY(h.y) + '" r="' + (9 * k).toFixed(1) + '" fill="#f3c969" stroke="#0b0d11" stroke-width="' + (1.2 * k).toFixed(2) + '"/><text x="' + MX(h.x) + '" y="' + (MY(h.y) + 3.1 * k).toFixed(1) + '" text-anchor="middle" font-family="Barlow Condensed, sans-serif" font-weight="700" font-size="' + (8.5 * k).toFixed(1) + '" fill="#0d1014">You</text></g>' : '')).join('');
    return '<div class="pg-srow pg-sprow"><span class="pg-sl">Spots</span><div class="pg-spw"><div class="pg-seg pg-sptab" role="group" aria-label="Map">' + T.map(([v, t]) => '<button type="button" data-mt="' + esc(v) + '"' + (v === tab ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(t) + '</button>').join('') +
      '<button type="button" class="pg-rnd" data-mr="1" title="No assignments yet? Pick random spots your role can take">🎲 Random</button>' + (M.extras ? M.extras() : []).map(([id, t, on]) => '<button type="button" class="pg-mx' + (on ? ' on' : '') + '" data-mx="' + esc(id) + '" aria-pressed="' + !!on + '">' + esc(t) + '</button>').join('') + '</div>' +
      (pg ? '<div class="pg-spmap">' + pg.svg + '<svg class="pg-hot" viewBox="' + [vb[0], vb[1], vb[2], vb[2]].join(' ') + '" xmlns="http://www.w3.org/2000/svg">' + hot + '</svg></div>' : spotBtns(M, tab)) + '</div></div>'; };
  // phase 1's maps: Your egg (the Plan's Pick up eggs page: the eight spots, melee by her, left, right, far, the centre and the edge one, drawn where the game drops
  // each egg in the first set) and Your coil (its Coil soaks page: Right Soak #1, the first coil to appear, or Left Soak #2). You carry an egg and soak a coil by default
  const EGG_SP = [['m1', 'melee', 0], ['m2', 'melee', 1], ['r5', 'left', 0], ['r3', 'left', 1], ['r6', 'right', 0], ['r4', 'right', 1], ['r1', 'far', 0], ['r2', 'far', 1]], ZNAME = { melee: 'by her', left: 'left', right: 'right', far: 'far' };
  const eggFor = (r, z) => (r === 'm' ? z === 'melee' : z !== 'melee'); /* (the plan's egg melee take the quadrant by her, everyone else the other three) */
  const eggAt = (slot) => PG_UL.inward(PG_UL.planEgg[slot]); /* (the Plan's general place for that egg, on the stone: the egg itself lands at random in that quadrant.
    DO NOT move these rings onto the eggs' landing spots: Flex, Nov 16, "The plans layout is just general locations not exact egg spots remember". Check O holds it) */
  const P1MAPS = { tab: 'egg', tabs: () => [['egg', 'Your egg'], ['coil', 'Your coil']],
    page: (key) => { const D = { ez: { melee: [], left: [], right: [], far: [], backup: [] }, shields: [], teams: [[], []], ce: [[], []], cf: [[], []], trans: [], side: { L: {}, R: {} } }, ti = myTeam() === 2 ? 1 : 0;
      if (key === 'coil' && myJob.egg) { D.teams[ti] = ['You']; D.ce[ti] = ['You']; } const pg = key === 'egg' ? UL_PAGES.eggs[0] : UL_PAGES.coils[0]; /* (an egg carrier on the Plan's numbered spot in the circle; without an egg, You is drawn in the middle of your circle (hot: you), where the game stands you, not in the Plan's list under it (review, Nov 16)) */
      return { svg: ulSvg(pg, D, new Map([['you', { color: '#f3c969' }]]), {}), vb: UL_VB[pg.vb] || UL_VB.mid }; },
    hot: (key) => (key === 'egg' ? EGG_SP.filter(([slot, z]) => eggFor(myJob.role, z) || slot === myJob.egg).map(([slot, z, i]) => { const p = eggAt(slot), on = slot === myJob.egg; return { id: slot, x: p[0], y: p[1], r: 7.2, title: (z === 'melee' ? 'By her' : ZNAME[z][0].toUpperCase() + ZNAME[z].slice(1) + ' quadrant') + ': the ' + (i ? 'outer' : 'inner') + ' egg (it lands somewhere there)', on, you: on }; })
      : [[1, 19], [2, -19]].map(([tm, cx]) => { const on = myTeam() === tm; return { id: 't' + tm, x: cx, y: 6, r: 15, big: true, on, you: on && !myJob.egg, title: tm === 1 ? 'Right Soak #1: the first coil to appear' : 'Left Soak #2: the second coil to appear' }; })),
    pick: (key, id) => { if (key === 'egg') { const te = PG_UL.eggO[id] ? eggTeam(id) : myJob.soak[1]; myJob = { ...myJob, egg: id, soak: [te, te], fb: [0, 0] }; } else { /* (an egg takes its zone's coil team, as on the plan's Egg Clear map) */ const tm = id === 't2' ? 2 : 1; myJob = { ...myJob, soak: [tm, tm], fb: [0, 0] }; } jobSave(); },
    extras: () => [['noegg', 'No egg', !myJob.egg]], extra: (id) => { if (id === 'noegg') { myJob = { ...myJob, egg: null, fb: [0, 0] }; jobSave(); } },
    random: () => { const ok = EGG_SP.filter((q) => eggFor(myJob.role, q[1])), q = ok[Math.floor(Math.random() * ok.length)], tm = Math.random() < 0.5 ? 1 : 2; myJob = { ...myJob, egg: q ? q[0] : null, soak: [tm, tm], fb: [0, 0] }; jobSave(); },
    role: (r) => { const es = EGG_SP.find((q) => q[0] === myJob.egg), keep = es && eggFor(r, es[1]); myJob = { ...myJob, role: r, egg: myJob.egg ? (keep ? myJob.egg : EGG_BY[r]) : null, fb: [0, 0] }; jobSave(); },
    // (an egg carrier takes the first coil in set 1, in the bubble, whatever their pick (jobSoak); Left Soak #2 is theirs in the second set only. The sentence said
    //  "pick it up, then soak Left Soak #2" while the game stood them in the first coil (review, Nov 16))
    say: () => { const es = EGG_SP.find((q) => q[0] === myJob.egg), t2 = myTeam() === 2; return es ? (myJob.role === 'h' ? HEAL_EGG : '') + 'Your egg lands somewhere ' + (es[1] === 'melee' ? 'by her' : 'in the ' + ZNAME[es[1]] + ' quadrant') + ' (the ' + (es[2] ? 'outer' : 'inner') + ' one): pick it up, then ' + (t2 ? 'break it in Left Soak #2, the second coil to appear (both sets), and get in the Wretch\'s bubble.' : 'break it in Right Soak #1, the first coil to appear (both sets), and get in the Wretch\'s bubble.')
      : 'No egg: you soak ' + (t2 ? 'Left Soak #2, the second coil to appear' : 'Right Soak #1, the first coil to appear') + ', and get in the Wretch\'s bubble.'; },
    sub: () => (myJob.egg ? 'Egg ' + ZNAME[(EGG_SP.find((q) => q[0] === myJob.egg) || [0, 'far'])[1]] : 'No egg') + ' · ' + (myTeam() === 2 ? 'Left Soak #2' : 'Right Soak #1') };
  if (SETUP && !P2) SETUP.maps = P1MAPS;
  const panel = () => setupHtml(); /* (for the test) */
  const playSub = () => role.name + ' · ' + (TEAM ? role.job : mapsOn() ? SETUP.maps.sub() : SETUP ? ((SETUP.jobs(SETUP.now().role).find((o) => o[0] === SETUP.now().job) || [0, ''])[1]) : role.job);
  const pick = () => { stop(); paused = true; card.className = 'pg-card on'; if (TEAM && (!pickedMe || !role || !TEAM.id2[role.id] || rl(role.id) === 't')) pickedMe = true, role = teamRole(TEAM.you && rl(TEAM.you) !== 't' ? TEAM.you : CAR8.find((c) => TEAM.id2[c]) || GDZ_RAID.find((c) => TEAM.id2[c] && rl(c) !== 't'));
    if (P2) role = P2.role(); else if (!TEAM) role = jobRole(myJob);
    const parts = Object.keys(PG_PARTS[boss] || {}).filter((k) => k === d || PG_PARTS[boss][k].d === d), pkNow = pk || d; /* (the parts of the fight you can practise) */
    const art = typeof BOSS_ART !== 'undefined' && typeof artUrl === 'function' && BOSS_ART[boss] ? artUrl(BOSS_ART[boss][0]) : '';
    card.innerHTML = '<div class="pg-cin pg-setup"><div class="pg-head">' + (art ? '<img class="pg-head-art" src="' + art + '" alt="" onerror="this.remove()">' : '') + '<span class="pg-k">Practice · ' + dn + '</span><h2>' + esc(boss) + ' <span class="pg-beta" title="New: tell us what feels off">Beta</span></h2>' +
      '<p class="pg-sub">Real Mythic timings. The other 19 play the plan.</p>' +
      (parts.length > 1 ? '<div class="pg-seg pg-part" role="group" aria-label="Part">' + parts.map((k) => '<button type="button" data-v="' + k + '"' + (k === pkNow ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(PG_PARTS[boss][k].name) + '</button>').join('') + '</div>' : '') + '</div>' +
      '<div class="pg-sbox">' + setupHtml() + '</div>' +
      '<button type="button" class="pg-btn pg-go pg-play"><b>▶ Play</b><span class="pg-psub">' + esc(playSub()) + '</span></button>' +
      '<div class="pg-chips"><button type="button" class="pg-chip pg-hint" aria-pressed="' + hints + '">' + (hints ? 'Hints on' : 'Hints off') + '</button><button type="button" class="pg-chip pg-spd" aria-pressed="' + (speed < 1) + '">' + (speed < 1 ? 'Half speed' : 'Normal speed') + '</button><label class="pg-chip pg-lookw" title="Your figure in 3D">Look <select class="pg-look">' + LOOKS.map((k) => '<option value="' + k + '"' + (k === look ? ' selected' : '') + '>' + LOOKN[k] + '</option>').join('') + '</select></label>' +
      '<label class="pg-chip pg-atw">Start <select class="pg-at" aria-label="Where to start">' + (P2 ? P2.starts : START).map(([t0, n]) => '<option value="' + t0 + '"' + (t0 === startAt ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></label></div>' +
      '<p class="pg-keys">Move: W A S D · Click a mob or Tab: target · 1: attack (keep pressing) · 2: area attack · Shift: sprint · Q: defensive' + (P2 && P2.acts && P2.acts() ? ' · E: kick' : '') /* (only a part with a Kick button: the intermission has none, Nov 15) */ + ' · M: sound · Space: pause · 3D: drag to turn, wheel to zoom</p></div>';
    const box = card.querySelector('.pg-sbox');
    const seeMe = () => { if (!G || !S) return; me = role.id; const p0 = homeOf(me, 0); G.x = p0[0]; G.y = p0[1]; cam = null; try { draw(); hud(true); } catch (e) { /* (drawn on Play) */ } }; /* (the picture behind the card is you) */
    const redo = (sel) => { if (P2) role = P2.role(); else if (!TEAM) role = jobRole(myJob); box.innerHTML = setupHtml(); card.querySelector('.pg-psub').textContent = playSub(); bindBox(); seeMe(); if (sel) { const nb = box.querySelector(sel); if (nb && nb.focus) nb.focus(); } };
    const bindBox = () => { const pm = box.querySelector('.pg-me'); if (pm) pm.onchange = () => { role = teamRole(pm.value); redo(); };
      const jp = box.querySelector('.pg-job0'); if (jp && P2 && P2.bind) P2.bind(jp, () => { role = P2.role(); card.querySelector('.pg-psub').textContent = playSub(); seeMe(); }); };
    box.onclick = (e) => { const M = mapsOn() ? SETUP.maps : null, m = M && e.target.closest('[data-mt],[data-mh],[data-mx],[data-mr]');
      if (m) { const d0 = m.dataset; if (d0.mt) M.tab = d0.mt; else if (d0.mh) M.pick(M.tab, d0.mh); else if (d0.mx) M.extra(d0.mx); else if (d0.mr) M.random(); redo(); return; } /* (a map tab, a spot, an extra like No egg, or 🎲 Random) */
      const b = e.target.closest('[data-sr],[data-sj]'); if (!b || !SETUP) return;
      if (b.dataset.sr && M && M.role) { M.role(b.dataset.sr); redo(e.detail === 0 ? '[data-sr="' + b.dataset.sr + '"]' : null); return; } const nw = SETUP.now(), r = b.dataset.sr || nw.role, js = SETUP.jobs(r).map((o) => o[0]);
      SETUP.set(r, b.dataset.sj || (js.includes(nw.job) ? nw.job : js[0])); redo(e.detail === 0 ? (b.dataset.sr ? '[data-sr="' + r + '"]' : '[data-sj="' + b.dataset.sj + '"]') : null); };
    bindBox(); seeMe();
    card.querySelectorAll('.pg-part button').forEach((b) => (b.onclick = () => { if (b.dataset.v === pkNow) return; close(); pgOpen(root, boss, d, b.dataset.v === d ? null : b.dataset.v); }));
    const hb = card.querySelector('.pg-hint'); hb.onclick = () => { hints = !hints; try { localStorage.setItem('wla-pg-hints', hints ? '1' : '0'); } catch (e) { /* (no storage) */ } hb.textContent = hints ? 'Hints on' : 'Hints off'; hb.setAttribute('aria-pressed', String(hints)); };
    const sb = card.querySelector('.pg-spd'); sb.onclick = () => { speed = speed < 1 ? 1 : 0.5; sb.textContent = speed < 1 ? 'Half speed' : 'Normal speed'; sb.setAttribute('aria-pressed', String(speed < 1)); };
    const lb = card.querySelector('.pg-look'); if (lb) lb.onchange = (e) => { look = LOOKS.includes(e.target.value) ? e.target.value : 'auto'; try { localStorage.setItem('wla-pg-look', look); } catch (er) { /* (no storage) */ } };
    card.querySelector('.pg-at').onchange = (e) => { startAt = +e.target.value || 0; };
    card.querySelector('.pg-go').onclick = begin; };
  const ffTo = (T0) => { if (!(T0 > 0)) return; window.__pgAuto = true; try { while (G.t < T0) step1(0.05); } finally { window.__pgAuto = false; }
    G.eggs.forEach((e) => { if (e.id === me && e.state === 'gone') { const sk = S.soaks.find((s) => s.at > e.land && s.group.includes(me)); if (e.shell < T0 && sk && T0 < sk.at) { e.state = 'held'; e.who = me; } } });
    // (the release sweep, Nov 16: an egg of yours the fast-forward left whole after your last coil for it (it missed the 2:17 coil in 12 of 408 runs) is broken
    //  in that coil, as the plan has it. Starting at 2:18 you held an egg with no coil left to break it, and the job line told you to break it in your soak)
    G.eggs.forEach((e) => { if (e.id !== me || e.state === 'gone' || !(e.land < T0)) return; const mineS = S.soaks.filter((s) => s.at > e.land && s.group.includes(me)); if (mineS.length && !mineS.some((s) => s.at > T0)) { e.state = 'gone'; e.who = null; } });
    G.log = []; G.hp = 100; G.deaths = 0; G.debs = {}; G.adds = []; G.dpsM = null; G.tgt = null; G.kb = null; G.fx = []; G.hitFx = []; G.sprint = -99; G.def = -99; G.aoe0 = -99; G.aoeFx = []; G.vipers = 0; target = null; cam = null; G.warnI = S.warns.findIndex((w) => w.t > G.t); if (G.warnI < 0) G.warnI = S.warns.length; G.warnQ = []; G.lastWarn = null; if (P2) P2.ff(); };
  const begin = () => { { const c = sndOn ? sndCtx() : null; if (c && c.state === 'suspended' && c.resume) c.resume().catch(() => {}); } me = role.id; reset(); ffTo(startAt); draw(); hud(true); let n = 3; card.className = 'pg-card on pg-cd'; card.innerHTML = '<div class="pg-n">' + n + '</div>'; sfx('tick');
    const tick = () => { if (!ov.isConnected) return; n--; if (n > 0) { card.innerHTML = '<div class="pg-n">' + n + '</div>'; sfx('tick'); setTimeout(tick, 750); } else { card.className = 'pg-card'; card.innerHTML = ''; paused = false; sfx('go'); go(); } }; setTimeout(tick, 750); };
  const died = () => { stop(); paused = true; G.deaths++; const L0 = G.log.slice(), e = myEggHeld(); if (e) { e.state = 'gone'; e.who = null; G.vipers++; deb('putrid', 20, true); G.adds.push({ kind: 'viper', x: G.x + 1.5, y: G.y - 1, born: G.t }); G.log.push({ t: G.t, kind: 'viper', text: 'You died holding your egg: a Viper hatched.', tip: 'A carrier\'s death hatches the egg.' }); } /* (it's really there when you keep going, Nov 15 audit) */
    // (what killed you, the release sweep, Nov 16: the newest thing that hit you in the last 6 s by its time, then an egg that hatched on you, then the venom
    //  off the platform, then the poison on you. A damage-moment line (kind dps) is never it: it is dated at the moment's start and pushed when the moment
    //  closes, so "A Viper was up: you were on it 0%" named a death 15 s later from Caustic Venom)
    const last6 = (f) => L0.filter((m) => m.t >= G.t - 6 && m.t <= G.t + 0.01 && f(m)).sort((a, b) => b.t - a.t)[0], dots = ['venom', 'dvenom', 'putrid', 'fester', 'splash', 'thrash', 'acid', 'vein', 'malice', 'bite', 'purge', 'echo', 'fangs'].filter((k) => has(k) && DEB[k]).map((k) => DEB[k][0] + (G.debs[k].n > 1 ? ' (' + G.debs[k].n + ' stacks)' : ''));
    const why = G.adds.some((a) => a.kind === 'viper') && G.t - (G.lastSting == null ? -99 : G.lastSting) < 4 ? { text: 'The Viper\'s stings wore you down.', tip: 'Kill a Viper at once: press Tab to pick it, then keep pressing 1 until it dies.' } : last6((m) => m.kind !== 'venom' && m.kind !== 'viper' && m.kind !== 'dps') || last6((m) => m.kind === 'viper') || last6((m) => m.kind === 'venom') ||
      (dots.length ? { text: dots.join(' and ') + ' wore you down.', tip: has('venom') ? 'Caustic Venom stacks each time a wave hits you: dodge every wave.' : '' } : { text: 'Your health ran out.' });
    (G.deathAt = G.deathAt || []).push({ t: G.t, why: why.text || '' }); /* (for the result screen's list) */
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin"><span class="pg-k">' + pgClock(G.t) + '</span><h2>You died</h2><p>' + esc(why.text || '') + '</p>' + (why.tip ? '<p class="pg-tip">' + esc(why.tip) + '</p>' : '') +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go">Keep going</button><button type="button" class="pg-btn pg-again">End the run</button></div></div>';
    // (Keep going stays: a death still costs its 20 points. A part can clear what was still hurting you, P2.revive: phase 2 cancels a missed Malice's last ticks,
    //  so one miss can't kill you twice. End the run shows the result screen with your grade and mistakes; it went straight to the setup card, no result.
    //  The release sweep, Nov 16: "there are no retrys in the game, only failures and wipes")
    card.querySelector('.pg-go').onclick = () => { G.hp = 100; G.debs = {}; if (P2 && typeof P2.revive === 'function') P2.revive(); card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); };
    card.querySelector('.pg-again').onclick = end; };
  const grade = () => { const maj = G.log.filter((m) => MAJ.has(m.kind)).length, mn = G.log.length - maj, sc = Math.max(0, 100 - maj * 9 - mn * 4 - G.deaths * 20 - (G.wipes || 0) * 20); return { sc, g: sc >= 95 ? 'S' : sc >= 85 ? 'A' : sc >= 70 ? 'B' : sc >= 50 ? 'C' : 'D' }; };
  // (the result screen. The release sweep, Nov 16: it also opens from the death card's End the run, so a run that stopped early says where, never "A clean run"
  //  or the clean-run sentence, and your deaths are in the list with what killed you; "Right target" names the kinds of moment it counts, not always the
  //  Rawlings and the heart)
  const P1DPS = { egg: 'your egg', rawling: 'the Rawlings', wretch: 'the Wretch', heart: 'the heart', viper: 'the Vipers' }, p1Names = (DL) => Object.keys(P1DPS).filter((k) => DL.some((m) => m.kind === k)).map((k) => P1DPS[k]).join(', ');
  const end = () => { stop(); paused = true; dpsClose(); const { sc, g } = grade(), n = G.log.length, DL = (G.dpsM && G.dpsM.list) || [], early = G.t < S.end - 0.5, quiet = early || G.deaths > 0;
    const rows = G.log.map((m) => ({ t: m.t, b: m.text, s: m.tip })).concat((G.deathAt || []).map((q) => ({ t: q.t, b: 'You died', s: q.why }))).sort((a, b) => a.t - b.t);
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin pg-end"><span class="pg-k">' + esc(boss) + ' ' + dn + ' · ' + esc(part.name) + ' · ' + esc(role.name) + (speed < 1 ? ' · half speed' : '') + (startAt ? ' · from ' + pgClock(startAt) : '') + (early ? ' · stopped at ' + pgClock(G.t) : '') + '</span>' +
      '<div class="pg-grade"><b class="g' + g + '">' + g + '</b><div><h2>' + (n ? n + ' mistake' + (n > 1 ? 's' : '') : quiet ? 'No mistakes' : 'A clean run') + (G.deaths ? ', ' + G.deaths + ' death' + (G.deaths > 1 ? 's' : '') : '') + '</h2><p>' + sc + ' / 100' + (G.vipers ? ' · ' + G.vipers + ' Viper' + (G.vipers > 1 ? 's' : '') + ' hatched' : '') + '</p></div></div>' + (DL.length ? '<p class="pg-dpsl">Right target: <b>' + DL.filter((m) => m.fr >= 0.5).length + ' of ' + DL.length + '</b> moments (' + (P2 ? P2.dpsNames(DL) : p1Names(DL)) + ').</p>' : '') +
      (rows.length ? '<ol class="pg-sum">' + rows.map((m) => '<li><time>' + pgClock(m.t) + '</time><div><b>' + esc(m.b) + '</b>' + (m.s ? '<span>' + esc(m.s) + '</span>' : '') + '</div></li>').join('') + '</ol>' : '<p>' + (early ? 'No mistakes up to ' + pgClock(G.t) + '.' : P2 ? esc(P2.clean) : 'Every wave dodged, every soak and bubble taken, your eggs carried clean. Try another role.') + '</p>') +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go pg-copy">Copy my score</button><button type="button" class="pg-btn pg-again">Play again</button><button type="button" class="pg-btn pg-close2">Close</button></div></div>';
    card.querySelector('.pg-again').onclick = pick; card.querySelector('.pg-close2').onclick = close;
    const txt = 'Debrief practice · ' + boss + ' ' + dn + ', ' + part.name + ' · ' + role.name + ': ' + g + ' (' + (n ? n + ' mistake' + (n > 1 ? 's' : '') : 'no mistakes') + ', ' + G.deaths + ' death' + (G.deaths === 1 ? '' : 's') + (early ? ', stopped at ' + pgClock(G.t) : '') + ')' + (speed < 1 ? ' at half speed' : '') + ' · https://debriefme.io/guide/' + guideSlug(boss) + '/' + (d === 'h' ? 'heroic' : 'mythic') + '?practice' + (P2 ? '=' + (P2.part || 2) : '');
    card.querySelector('.pg-copy').onclick = async (e) => { const b = e.currentTarget; let done = false; try { await navigator.clipboard.writeText(txt); done = true; } catch (er) { /* (no clipboard) */ } b.textContent = done ? 'Copied: post it in Discord' : txt; }; };

  // ---- the loop ----
  const frame = (now) => { raf = null; if (!ov.isConnected || paused) return; const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    let left = dt * speed; while (left > 1e-6) { const h = Math.min(0.02, left); step1(h); left -= h; if (G.hp <= 0 || G.t >= S.end) break; }
    countdown(); warns(); draw(); hud(); if (G.hp <= 0) { died(); return; } if (G.t >= S.end) { end(); return; } raf = requestAnimationFrame(frame); };
  const go = () => { last = 0; if (!raf) raf = requestAnimationFrame(frame); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
  const pauseT = () => { if (!G || card.classList.contains('on')) return; paused = !paused; if (paused) { stop(); const w = $('.pg-warn'); w.textContent = 'Paused (Space to go on)'; w.style.color = '#fff'; w.classList.remove('in'); void w.offsetWidth; w.classList.add('in'); } else go(); };
  const K = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  const kd = (e) => { if (!ov.isConnected) return; const tg = e.target && e.target.tagName, typing = tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT';
    if (!(e.ctrlKey || e.metaKey || e.altKey)) { e.stopPropagation(); if (/^[0-9]$/.test(e.key) && !typing) e.preventDefault(); } /* (the site's own keys never see the game's: 1 switched the guide to Heroic and closed it) */
    if (e.key === 'Escape') { close(); return; } if (e.code === 'Space' || e.code === 'KeyP') { e.preventDefault(); pauseT(); return; } if (e.code === 'KeyM') { sndSet(!sndOn); return; }
    if (G && !paused && (e.code === 'ShiftLeft' || e.code === 'ShiftRight')) { sprintKey(e); return; }
    if (G && !paused && P2 && e.code === 'KeyE') { if (!e.repeat) press('kick'); P2.kick(); return; }
    if (G && !paused && e.code === 'Tab') { e.preventDefault(); cycleTgt(); return; }
    if (G && !paused && (e.code === 'Digit1' || e.code === 'Numpad1')) { e.preventDefault(); atkKey(); if (!e.repeat) press('atk'); return; }
    if (G && !paused && (e.code === 'Digit2' || e.code === 'Numpad2')) { e.preventDefault(); if (!e.repeat) { aoeKey(); press('aoe'); } return; }
    if (G && !paused && e.code === 'KeyQ') { defKey(e); return; }
    const k = K[e.code]; if (k) { e.preventDefault(); keys[k] = true; target = null; } };
  const sprintKey = (e) => { if (!(e && e.repeat)) press('sprint'); if (G.t - G.sprint >= 30) { G.sprint = G.t; deb('sprint', 3); hud(true); } };
  const defKey = (e) => { if (!(e && e.repeat)) press('def'); if (G.t - G.def >= 90) { G.def = G.t; deb('def', 8); say('Defensive on: half damage.'); hud(true); } };
  const ku = (e) => { const k = K[e.code]; if (k) keys[k] = false; };
  document.addEventListener('keydown', kd, true); document.addEventListener('keyup', ku, true);
  cv.addEventListener('pointerdown', (e) => { if (paused || !G || !cam) return; const r = cv.getBoundingClientRect(), sx = (e.clientX - r.left) * dpr, sy = (e.clientY - r.top) * dpr; const wp = [cam[0] + (sx - cv.width / 2) / (Z * dpr), cam[1] - (sy - cv.height / 2) / (Z * dpr)]; e.preventDefault(); pickTgtAt(wp); }); /* (a click only targets: no click to move, Flex, Nov 16: "completely remove click to move dont need it") */
  cv.addEventListener('wheel', (e) => { e.preventDefault(); Z = Math.min(26, Math.max(6, Z * (e.deltaY > 0 ? 1 / 1.12 : 1.12))); if (paused && G) draw(); }, { passive: false });
  const onBlur = () => { keys = {}; }; window.addEventListener('blur', onBlur);
  // ---- the 3D view (src/practice3d.js; Nov 15, Flex: "theres nothing else like this out there"): the 2D | 3D switch by the minimap, remembered.
  // three.js loads only when 3D is picked; if it can't (or the PC has no WebGL, or drawing fails), the switch goes back to 2D and says so ----
  let v3 = null, want3 = false; const vw = $('.pg-vw');
  const v3api = { halves: () => (G && !P2 ? halvesAt(G.t) : null), eggWarn: () => (G ? eggWarnAt() : 0), hint: () => hintNow(), P2, onPlat: (x, y) => onPlat(x, y), get G() { return G; }, get S() { return S; }, get me() { return me; }, get target() { return window.__pgAuto ? null : target; }, get flashT() { return flashT; }, nm, rl, clsC, bossAt, tailAt, tgts: () => (G ? tgtList(G.t) : []), look: () => look, cls: (id) => (TEAM && TEAM.id2[id] ? String(TEAM.id2[id].cls || '') : ''),
    spot: () => mySpot(), tgtKey: (k) => { if (paused || !G || !tgtList(G.t).some((o) => o.key === k)) return false; press('tgt'); G.tgt = k; hud(true); return true; }, /* (a click on a mob in 3D targets it, Flex, Nov 16: "click on the mobs to target them instead of only tabbing") */ dps: () => dpsView(), fail: (e) => { console.error('Practice 3D:', e); off3d('3D stopped working, so you\'re back in 2D.'); } };
  const off3d = (why) => { want3 = false; if (v3) v3.dispose(); v3 = null; ov.classList.remove('pg3'); vw.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === '2')); try { if (!P2) localStorage.setItem('wla-pg-view', '2d'); } catch (e) { /* (no storage) */ } if (why && ov.isConnected) say(why, true); };
  const view = (on) => { want3 = on; if (!on) { off3d(); if (G) draw(); return; } if (v3 || vw.classList.contains('busy')) return; vw.classList.add('busy');
    pg3dLoad().then(() => { if (!ov.isConnected || v3 || !want3) return; v3 = pg3d($('.pg-3d'), v3api); ov.classList.add('pg3'); vw.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === '3')); try { if (!P2) localStorage.setItem('wla-pg-view', '3d'); } catch (e) { /* (no storage) */ } if (G) draw(); })
      .catch((e) => { console.error('Practice 3D:', e); off3d('3D didn\'t load' + (P2 ? ': ' + (P2.label || 'phase ' + (P2.part || 2)) + ' needs it. Press 3D to try again, or play phase 1 in 2D.' : ', so you\'re in 2D.')); }).finally(() => vw.classList.remove('busy')); };
  vw.onclick = (e) => { const b = e.target.closest('button'); if (b) { b.blur(); view(b.dataset.v === '3'); } };
  view(true); /* (Flex, Nov 15: 3D only. Every part opens in 3D; the 2D picture is only the fallback when 3D can't load, and then a 3D button offers a retry) */
  window.__pg3dDbg = { get v3() { return v3; }, view };
  const close = () => { if (!ov.isConnected) return; stop(); if (v3) { v3.dispose(); v3 = null; } ov.remove(); document.documentElement.classList.remove('pg-open'); document.removeEventListener('keydown', kd, true); document.removeEventListener('keyup', ku, true); window.removeEventListener('blur', onBlur); };
  $('.pg-x').onclick = close;
  // (the action bar goes in now that your role is known (the attack's icon is your role's), its icons load, and every button is clickable like a WoW bar)
  { const ba = $('.pg-acts'); if (ba) { ba.innerHTML = actsHtml(); atkShown = atkIc(); ba.querySelectorAll('img.pg-ai').forEach((im) => icLoad(im, im.dataset.ic));
    ba.addEventListener('click', (e) => { const b = e.target && e.target.closest ? e.target.closest('.pg-act') : null; if (!b || !G || paused) return; const a = b.dataset.a; if (a === 'sprint') sprintKey(); else if (a === 'def') defKey(); else if (a === 'aoe') { aoeKey(); press('aoe'); } else if (a === 'kick' && P2) { press('kick'); P2.kick(); } }); } }
  { const sb = $('.pg-snd'); if (sb) { sndUi(); sb.onclick = (e) => { e.stopPropagation(); sndSet(!sndOn); sb.blur(); }; } }
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
  window.__pgDbg = { get P2() { return P2; }, jobPick: () => jobPick(), next: () => nextText(jobPick()), said: () => said.slice(), v3a: v3api, steps: () => mySteps(G.t).map((s) => ({ k: s.k, at: s.at, from: s.from })), stepSpot: () => { const sp = stepSpot(curStep(G.t), G.t); return sp ? { T: sp.T, rad: sp.rad, inside: sp.inside(G.x, G.y) } : null; }, pathClear: (a, b, s) => pathClear(a, b, s), alertTexts: (items) => items.map((it) => { const h = alertOf(it, G.t, false); return { mine: /class="pg-al you/.test(h), order: (/pg-alo">([^<]*)/.exec(h) || [])[1] || '', detail: (/pg-ald">([^<]*)/.exec(h) || [])[1] || '', num: /pg-aln/.test(h) }; }), myCall: (w) => myCall(w), kick: () => P2 && P2.kick(), html: () => hudHtml(), tf: () => tgtFrame(G.t), mods: () => modBars(G.t), deco: (h) => actDeco(h), get atkIc() { return atkShown; }, get tfFlash() { return tfFlash; }, get role() { return role; }, get log() { return G ? G.log.map((m) => pgClock(m.t) + ' ' + m.text) : []; }, grade: () => grade(), get teamWhy() { return teamWhy; }, get G() { return G; }, get S() { return S; }, get myJob() { return myJob; }, set myJob(j) { myJob = j; }, hint: () => { hintC = null; return hintNow(); }, upNext: () => upNext(G.t), set hints(v) { hints = !!v; }, jobSlot: () => jobSlot(myJob), panel: () => panel(), setupApi: () => SETUP, asg: (id) => asg(id), short: (id) => short(id), jobRole: () => jobRole(myJob), dps: () => dpsView(), ff: (T0) => { ffTo(T0); return G.t; }, alerts: (items) => alertsHtml(items, G.t), walkTo: (p) => { target = p; }, warnsNow: () => { warns(); return G.lastWarn; }, hatchMine: () => { const e = myEggHeld() || G.eggs.find((q) => q.id === me && q.state !== 'gone'); if (!e) return false; hatch(e, 'Check', 'Check'); return true; }, dpsList: () => (G.dpsM && G.dpsM.list) || [], stepOwn: (n) => { for (let i = 0; i < n; i++) step1(0.05); return G.t; }, tgts: () => tgtList(G.t), set tgt(k) { G.tgt = k; }, get tgt() { return G.tgt; }, atk: () => atkKey(), aoe: () => aoeKey(), snd: (on) => { if (on != null) sndSet(on); return sndOn; }, cdn: () => countdown(), halves: () => halvesAt(G.t), eggWarn: () => eggWarnAt(), timers: () => myTimers(G.t).map((q) => q.name), sim, audit, step: (n) => { window.__pgAuto = true; try { for (let i = 0; i < n; i++) step1(0.05); } finally { window.__pgAuto = false; } return G.t; }, job: (id) => jobOf(id, G.t), play: () => { card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); }, set pos(p) { G.x = p[0]; G.y = p[1]; }, frame: () => { draw(); hud(true); }, at: (T0, id, more) => { stop(); paused = true; me = id || me; role = TEAM && TEAM.id2[me] ? teamRole(me) : part.roles.find((r) => r.id === me) || role; reset({ east: false, seed: 3, tailEast: false, first: [false, false], ...(more || {}) }); window.__pgAuto = true; try { while (G.t < T0) step1(0.05); } finally { window.__pgAuto = false; } draw(); hud(true); warns(); return G.t; } };
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
.pg-warn { position: absolute; top: 22%; left: 300px; right: 230px; text-align: center; /* (between the boss-mod bars on the left and the minimap column on the right, Main, Nov 15) */ font: 800 26px var(--head, system-ui); text-shadow: 0 2px 6px #000, 0 0 2px #000; opacity: 0; pointer-events: none; padding: 0 20px; }
.pg-warn { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.pg-al { display: flex; align-items: center; gap: 12px; max-width: 100%; padding: 6px 16px 6px 6px; text-align: left; background: linear-gradient(90deg, rgba(8,10,14,.9), rgba(8,10,14,.62)); border-left: 4px solid var(--c); box-shadow: 0 6px 24px rgba(0,0,0,.45); }
.pg-al.small { transform: scale(.85); transform-origin: center top; opacity: .92; margin-top: -6px; }
.pg-ali { flex: none; width: 46px; height: 46px; overflow: hidden; border: 2px solid var(--c); background: var(--c); } .pg-ali .icw { display: block; width: 100%; height: 100%; margin: 0; } .pg-ali .icw svg, .pg-ali .icw img { display: block; width: 100%; height: 100%; } .pg-ali .icw svg rect { rx: 0; }
.pg-alt { display: flex; flex-direction: column; min-width: 0; } .pg .pg-alo { font: 800 26px/1.08 var(--head, system-ui); color: var(--c); text-transform: uppercase; letter-spacing: .02em; text-shadow: 0 2px 6px #000; }
.pg .pg-ald { font: 600 14.5px/1.3 var(--body, system-ui); color: #e8edf2; text-shadow: 0 1px 3px #000; } .pg .pg-aln { font: 800 36px/1 var(--head, system-ui); color: #fff; font-style: normal; margin-left: 8px; min-width: 30px; text-align: right; text-shadow: 0 2px 6px #000; }
@media (max-width: 900px) { .pg .pg-alo { font-size: 20px; } .pg .pg-ali { width: 36px; height: 36px; } }
.pg-warn.in { animation: pgWarn 3s ease-out forwards; } .pg-warn.in.hold { animation: pgWarnIn .3s ease-out forwards; } @keyframes pgWarnIn { 0% { opacity: 0; transform: scale(1.15); } 100% { opacity: 1; transform: scale(1); } } /* (a countdown call stays up until its seconds run out, then the game clears it) */ @keyframes pgWarn { 0% { opacity: 0; transform: scale(1.15); } 8% { opacity: 1; transform: scale(1); } 75% { opacity: 1; } 100% { opacity: 0; } }
.pg-float { position: absolute; top: 31%; left: 0; right: 0; text-align: center; font: 700 16px var(--head, system-ui); text-shadow: 0 1px 4px #000; opacity: 0; pointer-events: none; padding: 0 20px; }
.pg-float.bad { color: #ff8f87; } .pg-float.ok { color: #7ee08f; } .pg-float.in { animation: pgFl 2.6s ease-out forwards; } @keyframes pgFl { 0% { opacity: 0; } 8% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
/* (bottom centre, ElvUI style: your job, then your frame left of centre and your target's right of it (you stand between them), then the action bar) */
.pg .pg-bot { position: absolute; left: 0; right: 0; bottom: 0; display: grid; grid-template-columns: 250px auto 250px; grid-template-areas: "job job job" "me acts tf"; justify-content: center; justify-items: center; align-items: start; gap: 8px 12px; padding: 0 14px 8px; pointer-events: none; }
.pg .pg-bot > .pg-job { grid-area: job; } .pg .pg-bot > .pg-ufs { display: contents; } .pg .pg-ufs > .pg-me { grid-area: me; width: 250px; } .pg .pg-ufs > .pg-tfc { grid-area: tf; width: 250px; } .pg .pg-bot > .pg-acts { grid-area: acts; } /* (Flex's UI, Nov 15: your frame left of the hotbar, your target's right of it) */
.pg .pg-job { max-width: min(520px, 100%); padding: 6px 12px 7px; text-align: center; background: rgba(10,12,16,.85); border: 1px solid rgba(243,201,105,.45); } .pg .pg-job span { display: block; font: 700 12px var(--head, system-ui); letter-spacing: .04em; text-transform: uppercase; color: #f3c969; } .pg .pg-job p { margin: 1px 0 0; font: 600 14px/1.35 var(--body, system-ui); color: #e8edf2; }
.pg .pg-job p.pg-nx { margin-top: 3px; font: 600 12.5px/1.3 var(--body, system-ui); color: #aab4c0; } .pg .pg-job p.pg-nx:empty { display: none; } /* (NEXT: your next step, under your job now; the prompts audit, Nov 16) */
.pg .pg-ufs { display: flex; justify-content: center; gap: 140px; }
.pg .pg-ucol { position: relative; width: 250px; min-height: 104px; display: flex; flex-direction: column; align-items: stretch; gap: 4px; }
/* (the site's own rules reach in here: ".pg-me { align-items: flex-start }" (Home's "Which one is you?") shrank your frame to its words, and body.refine
   rounds every button and "#main .pg-bar" (the Plan page's bar, inside the site's defaultTheme layer, so this one has to be in that layer too) by 4 px;
   the screen keeps square edges) */
.pg.pg .pg-in :is(.pg-x, .pg-vw button, .pg-bar) { border-radius: 0 !important; } @layer defaultTheme { html body #main .pg.pg .pg-in .pg-bar { border-radius: 0 !important; } }
.pg .pg-uf { position: relative; padding: 0; background: none; border: 0; } .pg .pg-uf .pg-bar { height: 28px; background: #2b2f36; border: 1px solid #000; box-shadow: 0 0 0 1px rgba(255,255,255,.14); } .pg .pg-uf .pg-bar span { justify-content: flex-end; padding-right: 9px; font: 700 12.5px var(--head, system-ui); color: #fff; text-shadow: 0 1px 2px #000, 0 0 2px #000; }
.pg .pg-uf .pg-nm { position: absolute; left: 0; right: 0; top: 0; height: 28px; z-index: 2; margin: 0; padding: 0 9px; align-items: center; gap: 6px; pointer-events: none; } .pg .pg-uf .pg-nm b { font: 700 13px var(--head, system-ui); color: #fff; text-shadow: 0 1px 2px #000, 0 0 2px #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 64%; flex: 0 1 auto; } .pg .pg-uf .pg-mj { display: none; } .pg .pg-tot { font-style: normal; } .pg .pg-uf .pg-nm .pg-tfr { font-size: 12px; text-shadow: 0 1px 2px #000; } /* (Flex's UI, Nov 15) */
.pg .pg-bossf .pg-nm b { display: none; } .pg .pg-bossf .pg-nm { justify-content: flex-end; } .pg .pg-bossf .pg-bar { height: 24px; background: #2b2f36; border: 1px solid #000; } .pg .pg-bhp::before { content: attr(data-n); position: absolute; left: 8px; top: 0; bottom: 0; z-index: 2; display: flex; align-items: center; font: 700 12.5px var(--head, system-ui); color: #fff; text-shadow: 0 1px 2px #000, 0 0 2px #000; } .pg .pg-bossf .pg-bar span { justify-content: flex-end; padding-right: 8px; z-index: 2; }
.pg .pg-debs { display: flex; flex-wrap: wrap; gap: 3px; } .pg .pg-debs span { padding: 1px 5px; border: 1px solid; background: rgba(10,12,16,.85); font: 600 12px var(--body, system-ui); } .pg .pg-debs em { font-style: normal; color: #fff; margin-left: 3px; }
.pg .pg-tfh i { background: #c0352c; } .pg .pg-tf .pg-tfr { color: #ff8f87; font-weight: 700; } .pg .pg-tf.far .pg-tfh i { background: #7c2a25; }
.pg .pg-tf.none { opacity: .6; } .pg .pg-tf.none .pg-tfn { color: #aab4c0; } .pg .pg-tf.none .pg-tfr { color: #8d97a3; font-weight: 600; }
.pg .pg-tfh::after { content: ''; position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; } .pg .pg-tf.hit .pg-tfh::after { animation: pgHit .15s ease-out; } @keyframes pgHit { 0% { opacity: .5; } 100% { opacity: 0; } }
.pg .pg-cast { height: 18px; } .pg .pg-cast i { background: #e0a53a; } .pg .pg-cast span { font-size: 12px; } .pg .pg-cast.nok i { background: #7d8590; } .pg .pg-cast.intr i { background: #b8322a; }
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
@media (max-width: 900px) { .pg .pg-bot { grid-template-columns: 1fr 1fr; grid-template-areas: "job job" "me tf" "acts acts"; } .pg .pg-ufs > .pg-me, .pg .pg-ufs > .pg-tfc { width: 230px; } .pg .pg-warn { left: 250px; right: 170px; } .pg .pg-tr { width: 150px; } .pg .pg-mini { width: 150px; height: 150px; } .pg .pg-timers { width: 230px; } .pg .pg-ufs { gap: 60px; } .pg .pg-ucol { width: 230px; } }
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
.pg-head .pg-partrow { margin-top: 8px; } .pg-beta { display: inline-block; vertical-align: middle; margin-left: 8px; padding: 1px 6px; border: 1px solid #f3c969; color: #f3c969; font: 700 12px var(--head, system-ui); letter-spacing: .04em; text-transform: uppercase; } /* (the release, Nov 16: Main asked for a Beta tag on the start card) */
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
.pg-sprow { align-items: flex-start !important; } .pg-sprow .pg-sl { padding-top: 8px; } .pg-spw { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.pg-sptab { display: flex; } .pg-sptab button { flex: 1; } .pg-sptab .pg-rnd, .pg-sptab .pg-mx { flex: none; padding: 0 10px; } .pg-sptab .pg-mx.on { color: #f3c969; } .pg-noegg.on { color: #f3c969; }
.pg-spmap { position: relative; width: min(100%, 330px); aspect-ratio: 1; margin: 0 auto; border: 1px solid rgba(255,255,255,.15); background: #0b0f12; overflow: hidden; } .pg-spmap > svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: hidden; }
.pg-hot .pg-hs { fill: rgba(243,201,105,.06); stroke: #f3c969; stroke-width: 1.4; stroke-dasharray: 4 3; cursor: pointer; } .pg-hot .pg-hs:hover { fill: rgba(243,201,105,.22); } .pg-hot .pg-hs.on { fill: none; stroke-dasharray: none; stroke-width: 2.2; }
.pg-hot .pg-hs.big { fill: rgba(243,201,105,.04); } .pg-hot .pg-hs.big.on { fill: rgba(243,201,105,.10); }
.pg-spl { display: flex; width: 100%; } .pg-spl button { flex: 1; height: auto; min-height: 46px; padding: 6px 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; } .pg-spl button + button { border-left: 1px solid rgba(255,255,255,.12); }
.pg-spl .pg-spn { font: 600 14px var(--body, system-ui); } .pg-spl .pg-spt { font: 500 12px var(--body, system-ui); color: #8a96a4; } .pg-spl button.on { background: rgba(230,180,80,.16); color: #f3c969; box-shadow: inset 0 0 0 1px rgba(230,180,80,.45); } .pg-spl button.on .pg-spt { color: #d9b765; }
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
.pg-snd { height: 28px; padding: 0 10px; border: 1px solid rgba(255,255,255,.18); border-radius: 0; background: rgba(10,12,16,.72); color: #aab4c0; font: 700 13px var(--head, system-ui); cursor: pointer; pointer-events: auto; } .pg-snd.on { color: #fff; } .pg-snd:hover { color: #fff; }
.pg-vw.busy button[data-v="3"] { cursor: progress; opacity: .6; } .pg-vw button[data-v="2"] { display: none; } .pg.pg3 .pg-vw { display: none; } /* (3D only, Flex: no 2D | 3D switch; the 3D button shows only to retry when 3D didn't load) */
.pg:has(.pg-card.on) .pg-vw { display: none; } /* (the setup card covers the picture: no view switch over it; after the real .pg-vw rule, which tests/practice-3d.js reads first) */
.pg-p2kick { margin: 10px 0 2px; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; } .pg-p2kick p { margin: 0 !important; font-size: 13.5px !important; } .pg-p2kick b { color: #fff; } .pg-seg button:disabled { opacity: .45; cursor: not-allowed; }
`;
  document.head.appendChild(st);
}
