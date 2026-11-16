// ===== Practice, phase 3: Ula'tek's Ascension (Nov 15; Flex: "have a new chat start building phase 3 as well") =====
// Ula'tek Mythic phase 3 as the practice game's third part (src/practice.js), from 6:12 (the platform has just shattered into four quarters) to the
// kill at 9:51, on the measured Mythic clock: the 17 top Mythic kills in the log library since the Nov 6 hotfix (C:/Users/james/DebriefLogs), read
// event by event (medians; all within a second of them, one kill 4.4 s early everywhere after an early intermission):
//   her Call of the Serpent 6:17, 6:47 and 8:25 (4 s casts; phase 3 starts as the first lands, 6:21); Slithering Clutches 6:22 and 6:52 (four, one on
//   each quarter) and 8:30 (two, on her quarter and the next, with two Blightscale Shriekers from the eggs that fall where the broken quarters were),
//   10 a kill; Mother's Wrath 6:22, 7:47 and 8:55 (5 s); Serpent's Bite 6:37, 7:41 and 9:25 (5 s casts, the red circles 0.5 s after, on one melee and
//   one ranged DPS on 48 of 51 sets), cleared 13 s after they land by three soakers (36 of 51 sets; four on 13, five or six on 2), Volatile Purge 5 s
//   after that; her waves 7:02, 7:57, 8:47 and 9:31 (4.5 s casts), the small tails 3.3 s after each, two at the far edges across the room from her
//   (and a second pair at 9:39); Toxic Womb 7:09 on the quarter across from hers, the beam 7:15 (8 s) on the off tank, Fester Burst 7:41 (4 s) and
//   8:15 (2 s, enraged), the Wretch dead about 8:27; Circling Prey 7:12, 8:03 and 9:04 (8 s casts; its hit 0.5 s after, about 280k on all 20, nobody
//   ever left on her quarter), then she submerges and comes up at the next corner counter-clockwise 4.8 s after the cast; Vicious Echoes 8:47 (both
//   kicked on every kill), the Shriekers dead about 8:53; Rage of the Shackled 9:37, the heart 9:43.6, the kill 9:51.
//   Where (Warcraft Logs' x/100 and y/100 - 1553.1, the guide's yards): her four corners (33.4, 31.4) (-33.1, 32.7) (-33.5, -32) (32.8, -32), her
//   first quarter any of the four; the whole raid stacked on her quarter on Mythic (the guide's picture puts ranged and healers on the next one): in
//   her north-east frame melee about (16.5, 16.5), ranged (11.5, 13.5), healers (13, 13.5), her tank (22.4, 21.6); the bites stacked at (10.2, 30.3),
//   (26.8, 16.1) and (23.5, 24.9); each Call's clutch spots on every quarter; the Shriekers on the two broken quarters; the Wretch landing at
//   (-18.3, -19.5), still there 25 s (awake at 20), at its first bubble's spot (20.4, 17.6) about 7:40 and its second's at (20.8, 13.3), dead about
//   8:27 to 8:32; the heart at (29, 28); Death Knights (two on 10 kills, three on 7) grip the clutches, four grips a set on the first two Calls and one to
//   three on the last, Gorefiend's Grasp 2 to 10 s after they land; Warlock gateways onto her first quarter (5 of 17 kills, 6:11 to 6:16) and from her
//   second quarter to her third at the second Circling Prey (7 of 17, 7:58 to 8:12), the rest walk across the cracks.
// Not measured, so picked and flagged where they're set: the raid landing on the south-east quarter after the Shattering (the commonest), the soakers'
// 7-yard reach and a drain of 2.56 a second each (so three clear a bite in 13 s, as on the kills, four in 9.8, and two can't in 15), the 2 million as it ends, the Purge's 5-yard burst and its
// three waves 120 degrees apart (the guide's picture), Vicious Echoes' 3 s cast, her health (40% to 0), the clutches hatching 8 s after they land (7.5
// to 10 in the logs), the grip times, the Shriekers' walk to the raid, and the jobs (the guide's plan: soak sets of two Mages and a Hunter; a Rogue and
// both tanks; a healer and both tanks; one kicker on each Shrieker; a Blood Death Knight tank and a melee Death Knight on the grips).
// practice.js keeps the loop, the screen, the cards, the shared dodge (pgP3 asks for it: `dodges`) and the score; this file gives the part its script,
// room (the broken quarters, which sink one by one), bots, hits, start card, minimap and 3D pieces through pgP3(api), the way practice-p2.js does.
// 3D only, like phase 2. tests/practice-p3.js plays it in Node on every build.
const PG_P3_T = { start: 372, gate: 372.5, gateEnd: 400, up: 375.1, call: [377.1, 407.1, 505.1], clu: [382.2, 412.2, 510.2], gest: 8, wrath: [382.1, 467.1, 535.1],
  bite: [397.1, 461.1, 565.1], biteCast: 5, biteLand: 5.5, venom: 15, purge: 5, waves: [422.1, 477.1, 527.1, 571.1], wavesCast: 4.5, tails: [425.4, 480.5, 530.6, 574.4, 579.5],
  womb: 429.3, wake: 449.3, incub: 435.3, prey: [432.1, 483.1, 544.1], preyCast: 8, fester: [[461.3, 465.3], [495.6, 497.6]], wdie: 560, shriek: 510.2, echoes: 526.8, echoCast: 3,
  sdie: 560, acid: 516.8, fester3: [527, 529], gate2: [478, 492], gate2w: 487, rage: 577.1, heart: 583.6, end: 591.4 };
const PG_P3 = {
  // her corners (measured), by quarter: 0 north-east, 1 north-west, 2 south-west, 3 south-east (counter-clockwise, the way she moves)
  her: [[33.4, 31.4], [-33.1, 32.7], [-33.5, -32], [32.8, -32]], QN: ['north-east', 'north-west', 'south-west', 'south-east'],
  // the raid lands on the south-east quarter after the Shattering (picked: the commonest spot on the 17 kills), about here
  land: 3, landAt: [18, -14],
  // spots in her frame (her quarter turned to the north-east): the raid stacked on her quarter, her tank, the off tank, the bite stacks, the
  // Purge spread spots at the quarter's rim (picked from where the soakers burst on the kills), the clutch spots on any quarter (that quarter turned to
  // the north-east), the Shriekers on the broken quarters, the Wretch, the beam, the bubbles, the heart, the gateways
  mel: [16.5, 16.5], rng: [11, 13.5], heal: [13, 13.5], tank: [22.4, 21.6], off: [24.5, 16.5], grasp: [15, 17],
  stack: [[10.2, 30.3], [26.8, 16.1], [23.5, 24.9]], spread: [[35, 8], [35, 17], [28, 4.5], [7.5, 32.5], [5, 25], [30, 22.5], [19, 4.5], [37, 12.5]],
  clutch: [[8, 24], [24, 9], [15, 29]], shriek: [[-9, -24], [8.5, -22.5]],
  womb: [-18.3, -19.5], beam: [-20.6, -29.3], img: [-21.4, -51.4], fb: [[20.4, 17.6], [20.8, 13.3]], heart: [29, 28],
  gate1To: [12, 13], gate2: [[13, 16], [-15, 18]], tails: [[-51, -21], [-21, -51]], tails2: [[-51, 21], [21, -51]],
  // where the cracks are narrowest: one way across between each two quarters (0-1, 1-2, 2-3, 3-0)
  cross: [[0.5, 26], [-26, -1], [0.5, -30], [26, -1]],
  // the plan (the guide's): the three bite soak sets, a kicker for each Shrieker, the two Death Knights' grips
  soak: { 1: ['r1', 'r2', 'r3'], 2: ['m1', 't1', 't2'], 3: ['h1', 't1', 't2'] }, kick: { 1: 'm2', 2: 'r4' }, dk: ['t2', 'm4'],
  // sizes: the bite's 7 yards (spell 1288879), the drain (picked), the Purge's burst, the bubble's 10 (spell 1310763), Circling Prey's 13 (spell
  // 1301510), kicks (melee 8, ranged 30), Vicious Echoes' reach (the whole room), Death Grip's 30
  BITE: 7, DRAIN: 2.56, PURGE: 5, FB: 10, PREY: 13, KICK: { m: 8, t: 8, r: 30, h: 0 }, ECHO: 60, GRIP: 30, GAP: [5.5, 11],
  // the adds' health (picked so the raid alone kills them on the kills' clock: the near clutches in 6 to 8 s, the Shriekers about 8:53, the Wretch about 8:50, so
  // your hits bring the Wretch down by 8:27 to 8:32 as on the kills; a hit of yours: a clutch 1, a Shrieker 0.5, the Wretch 0.25). The far clutch, gripped in
  // last (4.2 s), outlives its 10.2 s gestation without you
  // (a Shrieker keeps 15% until its Vicious Echoes is kicked or done: on every kill both cast it, and your hits with the raid's killed yours at 8:44 to 8:46,
  //  before its cast at 8:46.8, so you never got a kick (Flex, Nov 15: "there should be at least one spot where the player is asked to interupt"))
  CLUTCH: { hp: 7, drain: 1.1, gest: 10.2 }, SHRIEK: { hp: 12, drain: 0.57, hit: 0.5, late: 40, floor: 0.15 }, WRETCH: { hp: 30, drain: 0.4, hit: 0.25 } };
// (a point in her frame turned to quarter k: 0 as is, then 90 degrees counter-clockwise each step)
const pgP3R = (p, k) => { k = ((k % 4) + 4) % 4; return k === 0 ? [p[0], p[1]] : k === 1 ? [-p[1], p[0]] : k === 2 ? [-p[0], -p[1]] : [p[1], -p[0]]; };
// (which quarter a point is on: the cracks cross at about x 0.5, y -1)
const pgP3Q = (x, y) => (y > -1 ? (x > 0.5 ? 0 : 1) : (x > 0.5 ? 3 : 2));
// ---- the room: the broken platform, read from the guide's floor (GDZ_FLOOR, the broken picture, yard by yard), each quarter with its holes and notches
// up to about 6 yards filled (a closing on a yard grid, kept to its own quarter so no crack is filled), and the narrow cracks between two quarters
// (a gap within 7.5 yards of stone on both sides) walkable while both quarters stand: you wade across them, slowed ----
let PG_P3_M = null;
const pgP3Mask = () => { if (PG_P3_M) return PG_P3_M;
  const X0 = -46, N = 93, raw = new Uint8Array(N * N), F = typeof GDZ_FLOOR !== 'undefined' && GDZ_FLOOR["Ula'tek"] && GDZ_FLOOR["Ula'tek"].art ? GDZ_FLOOR["Ula'tek"].art['08.ulatek-ort-fullbreak-v185.jpg'] : null;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = i + X0, y = j + X0;
    raw[j * N + i] = F ? ((F[y] || []).some(([a, b]) => x >= a && x <= b) ? 1 : 0) : (Math.abs(x) <= 36.5 && Math.abs(y) <= 34 && Math.abs(x) + Math.abs(y) <= 49 && Math.abs(x - 0.5) > 2.5 && Math.abs(y + 1) > 2 && Math.abs(x - 0.5) + Math.abs(y + 1) > 18 ? 1 : 0); }
  const R = 3, D = []; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= R * R) D.push([dx, dy]);
  const morph = (src, grow, k) => { const out = new Uint8Array(N * N); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { if (pgP3Q(i + X0, j + X0) !== k) continue; let v = grow ? 0 : 1;
    for (const [dx, dy] of D) { const ii = i + dx, jj = j + dy, q = ii >= 0 && ii < N && jj >= 0 && jj < N && pgP3Q(ii + X0, jj + X0) === k ? src[jj * N + ii] : grow ? 0 : 1; if (grow ? q : !q) { v = grow ? 1 : 0; break; } } out[j * N + i] = v; } return out; };
  const q = new Int8Array(N * N).fill(-1);
  for (let k = 0; k < 4; k++) { const src = new Uint8Array(N * N); for (let c = 0; c < N * N; c++) if (raw[c] && pgP3Q((c % N) + X0, Math.floor(c / N) + X0) === k) src[c] = 1;
    const cl = morph(morph(src, true, k), false, k); for (let c = 0; c < N * N; c++) if (cl[c]) q[c] = k; }
  // (each quarter's edge cells, to measure the cracks)
  const edge = [[], [], [], []]; for (let c = 0; c < N * N; c++) { const k = q[c]; if (k < 0) continue; const i = c % N, j = Math.floor(c / N); if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const ii = i + a, jj = j + b; return ii < 0 || jj < 0 || ii >= N || jj >= N || q[jj * N + ii] !== k; })) edge[k].push([i, j]); }
  const ck = new Int8Array(N * N).fill(-1);
  for (let c = 0; c < N * N; c++) { if (q[c] >= 0) continue; const i = c % N, j = Math.floor(c / N), x = i + X0, y = j + X0; if (Math.abs(x) > 40 || Math.abs(y) > 38) continue;
    const d = edge.map((L) => { let m = 99; for (const [a, b] of L) { const v = Math.hypot(a - i, b - j); if (v < m) m = v; } return m; });
    for (let p = 0; p < 4; p++) { const a = d[p], b = d[(p + 1) % 4]; if (a + b <= 9 && Math.max(a, b) <= 6.5) { ck[c] = p; break; } } }
  return (PG_P3_M = { X0, N, q, ck, raw }); };
const pgP3Cell = (x, y) => { const M = pgP3Mask(), i = Math.round(x) - M.X0, j = Math.round(y) - M.X0; return i < 0 || j < 0 || i >= M.N || j >= M.N ? -1 : j * M.N + i; };
// (stone you can stand on, given which quarters still stand: a quarter, or a crack between two standing quarters)
const pgP3On = (x, y, alive) => { const c = pgP3Cell(x, y); if (c < 0) return false; const M = pgP3Mask(), k = M.q[c]; if (k >= 0) return !!alive[k]; const p = M.ck[c]; return p >= 0 && !!alive[p] && !!alive[(p + 1) % 4]; };
const pgP3Floor = (x, y, alive, m) => { const g = m == null ? 0.6 : m; return [[0, 0], [g, 0], [-g, 0], [0, g], [0, -g]].every(([dx, dy]) => pgP3On(x + dx, y + dy, alive || [1, 1, 1, 1])); };
const pgP3Crack = (x, y) => { const c = pgP3Cell(x, y); if (c < 0) return false; const M = pgP3Mask(); return M.q[c] < 0 && M.ck[c] >= 0; };

// ---- the jobs: the soak sets, the Shrieker kicks, the grips; your picked job swapped in (the card); the bite targets ----
function pgP3Base() { const P = PG_P3, J = {}; GDZ_RAID.forEach((id) => { J[id] = { sk: [], kick: 0, dk: 0 }; });
  [1, 2, 3].forEach((n) => P.soak[n].forEach((id) => J[id].sk.push(n))); J[P.kick[1]].kick = 1; J[P.kick[2]].kick = 2; P.dk.forEach((id, i) => { J[id].dk = i + 1; }); return J; }
function pgP3Jobs(seed, me, pk) {
  const P = PG_P3, rnd = pgRng(((seed || 1) * 53 + 11) >>> 0), J = pgP3Base(); if (me && J[me] && pk) pgP3Give(J, me, pk);
  // the bites: one melee and one ranged DPS each set (48 of 51 sets since Nov 6), never that set's soakers or the grips; your pick of "yes" or "no" kept
  const tg = [1, 2, 3].map((n) => { const ok = (id, r) => id[0] === r && !J[id].sk.includes(n) && !J[id].dk && !(id === me && pk && pk.bite === 'no'); const pickOne = (r) => { const L = GDZ_RAID.filter((id) => ok(id, r)); return L[Math.floor(rnd() * L.length)] || null; }; return [pickOne('m'), pickOne('r')]; });
  let bset = 0; if (me && pk && pk.bite === 'yes' && (me[0] === 'm' || me[0] === 'r')) { const free = [1, 2, 3].filter((n) => !J[me].sk.includes(n)); bset = free[Math.floor(rnd() * free.length)] || 0; if (bset) { tg.forEach((L, i) => { if (i + 1 !== bset) { const k = L.indexOf(me); if (k >= 0) L[k] = null; } }); tg[bset - 1][me[0] === 'm' ? 0 : 1] = me; } }
  // (a target lost to a pick: another of that role who's free)
  tg.forEach((L, i) => [0, 1].forEach((k) => { if (L[k]) return; const r = k ? 'r' : 'm', o = GDZ_RAID.find((id) => id[0] === r && id !== me && !J[id].sk.includes(i + 1) && !J[id].dk && !L.includes(id)); L[k] = o || null; }));
  return { J, tg, bset };
}
// (your slot takes the picked jobs; whoever had them takes your slot's old ones, so every set still has three soakers and each Shrieker one kicker)
function pgP3Give(J, me, pk) { const P = PG_P3, kicker = (id) => id[0] === 'm' || id[0] === 'r';
  [1, 2, 3].forEach((n) => { const has = J[me].sk.includes(n), want = pk.soak === n;
    if (want && !has) { const set = GDZ_RAID.filter((id) => J[id].sk.includes(n) && id !== me), o = set.find((id) => id[0] === me[0]) || set.find((id) => id[0] !== 't') || set[set.length - 1]; if (o) { J[o].sk = J[o].sk.filter((v) => v !== n); J[o].sk.push(...J[me].sk.filter((v) => v !== n && !J[o].sk.includes(v))); J[me].sk = []; } J[me].sk.push(n); }
    else if (!want && has) { const o = GDZ_RAID.find((id) => id !== me && id[0] === me[0] && !J[id].sk.length && !J[id].dk && !J[id].kick) || GDZ_RAID.find((id) => id !== me && id[0] !== 't' && !J[id].sk.length && !J[id].dk); if (o) J[o].sk.push(n); J[me].sk = J[me].sk.filter((v) => v !== n); } });
  if (me[0] === 'h' || !pk.kick) { if (J[me].kick) { const o = GDZ_RAID.find((id) => id !== me && kicker(id) && !J[id].kick && !J[id].dk); if (o) J[o].kick = J[me].kick; J[me].kick = 0; } }
  else if (J[me].kick !== pk.kick) { const o = GDZ_RAID.find((id) => J[id].kick === pk.kick); if (o) J[o].kick = J[me].kick || (GDZ_RAID.some((id) => id !== o && J[id].kick === (3 - pk.kick)) ? 0 : 3 - pk.kick); J[me].kick = pk.kick; }
  if (J[me].dk) { const o = GDZ_RAID.find((id) => id !== me && id[0] === 'm' && !J[id].dk && !J[id].kick && !J[id].sk.length); if (o) J[o].dk = J[me].dk; J[me].dk = 0; } }

// ---- the fight, second by second ----
function pgP3Script(o) {
  const T = PG_P3_T, P = PG_P3, seed = o.seed || 1, rnd = pgRng(((seed * 211) + 29) >>> 0);
  // (her first quarter: any of the four on the kills (north-east 3, north-west 5, south-west 4, south-east 5), from the run's seed)
  const q1 = o.q1 != null ? ((o.q1 % 4) + 4) % 4 : Math.floor(pgRng((seed * 7919 + 13) >>> 0)() * 4), Qs = [0, 1, 2, 3].map((n) => (q1 + n) % 4), F = (p, n) => pgP3R(p, Qs[n]);
  const hit = T.prey.map((p) => p + T.preyCast + 0.5), sink = T.prey.map((p) => p + T.preyCast + 0.1), upAt = T.prey.map((p) => p + T.preyCast + 4.8);
  const stepAt = (t) => (t < sink[0] + 2.3 ? 0 : t < sink[1] + 2.3 ? 1 : t < sink[2] + 2.3 ? 2 : 3);
  const herTank = (t) => (t < 450 ? 't1' : t < 532 ? 't2' : 't1');
  const S = { part: 3, start: T.start, end: T.end, seed, q1, Qs, F, hit, sink, upAt, stepAt, ROT: 0, SURF: -9, rotAt: () => 0, F2: F, FT: (p) => [p[0], p[1]], herTank, her: (n) => P.her[Qs[Math.min(3, n)]].slice(),
    casts: [], warns: [], timers: [], waves: [], impacts: [], soaks: [], bubbles: [], thrash: [], wrath: [], tails: [], beams: [], pulses: [], wretches: [], eggSets: [], wings: [], dive: { t0: -9, gone: -9, surf: -9, to: [0, 0] } };
  S.F = (p) => [p[0], p[1]]; /* (practice.js's own frame helper: phase 3 is in room yards) */
  const cast = (who, name, t0, t1, x) => { const c = { who, name, t0, t1, ...(x || {}) }; S.casts.push(c); return c; }, warn = (t, text, c) => S.warns.push({ t, text, c: c || '#ff8f87' }), timer = (t, name) => S.timers.push({ t, name });
  const jb = pgP3Jobs(seed, o.me, o.pick); S.job = jb.J; S.tg = jb.tg; S.bset = jb.bset;
  // the gateways (a Warlock's, one way): onto her first quarter from where the raid landed (unless she came up on it), and from her second quarter to
  // her third at the second Circling Prey (picked times inside the kills' 6:11 to 6:16 and 7:59 to 8:12)
  S.gates = []; const nf = (p) => pgP3Near(p, [1, 1, 1, 1]);
  if (Qs[0] !== P.land) S.gates.push({ k: 1, p: nf(pgP3R([15, 15], P.land)), to: nf(F(P.gate1To, 0)), t0: T.gate, t1: T.gateEnd });
  S.gates.push({ k: 2, p: nf(F(P.gate2[0], 1)), to: nf(F(P.gate2[1], 1)), t0: T.gate2w, shown: T.gate2[0], t1: T.gate2[1] }); /* (placed by 7:58, takes you from 8:07: it sits in the raid's stack, and through it sooner you'd come out in her waves) */
  // (the calls: short, at most two show at once and the ones about you go first (Main, Nov 15); a fact the boss-mod bars already have gets no call)
  warn(T.start, Qs[0] === P.land ? 'Phase 3: she rises on your quarter. Stack up!' : 'Phase 3: you need the gateway to reach her!', '#c084ff');
  if (Qs[0] !== P.land) timer(T.gateEnd, 'Gateway closes');
  // Call of the Serpent: the clutches, one on each standing quarter (two in the last set, and two Shriekers where the broken quarters were)
  S.clutches = []; T.call.forEach((c0, ci) => { cast('boss', 'Call of the Serpent', c0, c0 + 4); timer(T.clu[ci], ci === 2 ? 'Clutches and Shriekers' : 'Slithering Clutches'); const n = stepAt(T.clu[ci]), R = Qs[n];
    const quarters = ci < 2 ? [R, (R + 1) % 4, (R + 3) % 4, (R + 2) % 4] : [R, (R + 1) % 4];
    quarters.forEach((k, j) => { const sp = P.clutch[Math.floor(rnd() * P.clutch.length)], p = nf(pgP3R(sp, k)), rel = (k - R + 4) % 4, id = 'c' + ci + j;
      // (the grips (picked inside the kills' 0.6 to 4 s after they land): the next quarter's by the tank, the one before by the melee Death Knight, the far one
      // in two grips; then Gorefiend's Grasp onto the raid)
      const grips = rel === 0 ? [] : rel === 1 ? [{ at: T.clu[ci] + 0.8, by: P.dk[0] }] : rel === 3 ? [{ at: T.clu[ci] + 1.4, by: P.dk[1] }] : [{ at: T.clu[ci] + 2.6, by: P.dk[1], mid: true }, { at: T.clu[ci] + 4.2, by: P.dk[0] }];
      S.clutches.push({ id, ci, k, rel, p, land: T.clu[ci], grips, grasp: T.clu[ci] + 5, hatch: T.clu[ci] + T.gest, gone: T.clu[ci] + T.gest + 4, n }); }); });
  warn(T.clu[0], 'Slithering Clutches: break them before they hatch!', '#c9d98a');
  // Mother's Wrath (5 s): on her tank, in her reach in front of her
  T.wrath.forEach((w0, i) => { const n = stepAt(w0 + 5), tk = herTank(w0 + 5); S.wrath.push({ t0: w0, at: w0 + 5, p: F(P.tank, n), tank: tk }); cast('boss', 'Mother\'s Wrath', w0, w0 + 5); timer(w0 + 5, 'Mother\'s Wrath'); });
  // Serpent's Bite: two red circles 0.5 s after the cast, 15 s of venom; the two stack, three soakers stand in both
  S.bites = T.bite.map((b0, i) => { const land = b0 + T.biteLand, n = stepAt(land); cast('boss', 'Serpent\'s Bite', b0, b0 + T.biteCast); timer(land, 'Serpent\'s Bite'); { const on = !!o.me && S.tg[i].includes(o.me), so = !!o.me && !!S.job[o.me] && S.job[o.me].sk.includes(i + 1); warn(land, on ? 'Serpent\'s Bite on you: go to the gold ring!' : so ? 'Your soak: into the stacked red circles!' : 'Serpent\'s Bite: soakers only, keep out!', '#ff5a6a'); }
    return { i, b0, land, end: land + T.venom, n, stack: nf(F(P.stack[i], n)), tg: S.tg[i].filter(Boolean), so: GDZ_RAID.filter((id) => S.job[id].sk.includes(i + 1)) }; });
  // her waves: a wall the whole room wide rolling out from her quarter toward the middle, 12.5 yards a second (the guide's, Nov 11), with gaps; the
  // small tails' rings at the far edges 3.3 s after each cast. (Picked: a 5.5-yard gap every 11 yards, wide enough to stand in with room to spare;
  // the guide draws 3 every 8, which no one can stand in once you allow for a body's width)
  T.waves.forEach((w0, i) => { const t0 = w0 + T.wavesCast, n = stepAt(t0), B = S.her(n), deg = Math.atan2(-B[1], -B[0]) * 180 / Math.PI, cres = []; let prev = -50; for (let z = -44; z <= 44; z += P.GAP[1]) { if (z - P.GAP[0] / 2 > prev + 0.5) cres.push([prev, z - P.GAP[0] / 2]); prev = z + P.GAP[0] / 2; } cres.push([prev, 50]);
    cast('boss', 'Caustic Waves', w0, t0); timer(t0, 'Her waves'); warn(t0 - 2, 'Her waves: step into a gap beside you!', '#9be13a');
    S.waves.push({ kind: 'her3', x: B[0], y: B[1], deg, v: 12.5, w: 96, d: 5, cres, warn: 2.2, t0, t1: t0 + 9, name: 'Her Caustic Waves', tip: 'Her waves roll out from her quarter, the whole room wide: step sideways into a gap (the dark lanes).' }); });
  T.tails.forEach((b0, i) => { const n = stepAt(b0), L = i === 4 ? P.tails2 : P.tails, mid = F(P.mel, n); L.forEach((q) => { const O = F(q, n), st = 2 * Math.PI / 16, toR = Math.atan2(mid[1] - O[1], mid[0] - O[0]);
    S.tails.push({ x: O[0], y: O[1], t0: b0, at: b0 + 2.4 }); S.waves.push({ kind: 'tail', ring: 1, x: O[0], y: O[1], n: 16, cw: 7, v: 12.5, d: 5, ph: toR + st / 2, t0: b0 + 2.4, t1: b0 + 2.4 + 9.5, name: 'A small tail\'s Caustic Waves', tip: 'In phase 3 two small tails rise at the far edges behind the raid: watch for their rings and stand in a gap.' }); });
    if (i < 4) warn(b0 + 0.4, 'Small tails behind you: watch their rings!', '#ff8a6a'); });
  // the Wretch: Toxic Womb on the quarter across from hers (7 yards), awake 20 s later; the spectral image beams it, the off tank soaks the 5 impacts
  // (each sends two waves out square to the beam); dragged to the raid for its bubbles, dead about 8:27
  { const p0 = nf(F(P.womb, 0)), img = F(P.img, 0), bm = F(P.beam, 0), ba = Math.atan2(p0[1] - img[1], p0[0] - img[0]) * 180 / Math.PI;
    S.impacts.push({ x: p0[0], y: p0[1], r: 7, t0: T.womb - 2, at: T.womb, name: 'Toxic Womb', dmg: 25, color: '#c8a36a', tip: 'The Wretch lands in a 7-yard circle: keep out of it.' });
    S.wretch = { p0, land: T.womb, wake: T.wake, dies: T.wdie, fb: T.fester.map(([t0, at], i) => ({ i, t0, at, p: nf(F(P.fb[i], i + 1)) })) };
    timer(T.womb, 'Toxic Womb'); /* (no call: the bar has it) */
    const b0 = T.incub + 8; cast('boss', 'Toxic Incubation', T.incub, b0); S.beams.push({ tank: 't2', from: img, at: bm, t0: b0, t1: b0 + 4, hits: [0, 1, 2, 3, 4].map((i) => b0 + i) });
    for (let i = 0; i < 5; i++) [90, -90].forEach((a) => S.waves.push({ kind: 'incub', tank: 't2', x: bm[0], y: bm[1], deg: ba + a, v: 12.5, w: 10, d: 5, cres: [[-5, 5]], t0: b0 + 0.5 + i, t1: b0 + 10 + i, name: 'Caustic Waves from the beam', tip: 'The off tank in the spectral beam sends waves out to both sides: keep out of their lanes.' }));
    S.wretch.fb.forEach((q) => { cast('wretch', 'Fester Burst', q.t0, q.at); warn(q.t0, 'Fester Burst: you have ' + Math.round(q.at - q.t0) + ' s to get in the bubble!', '#d8f22f'); timer(q.at, 'Fester Burst'); }); }
  // Circling Prey (8 s): she destroys her quarter; everyone moves one quarter counter-clockwise first
  T.prey.forEach((p0, i) => { cast('boss', 'Circling Prey', p0, p0 + T.preyCast); timer(hit[i], 'Circling Prey'); warn(p0, i === 1 && S.gates.some((g) => g.k === 2) ? 'Circling Prey: take your gateway once her waves pass!' : 'Circling Prey: move one quarter left, you have ' + Math.floor(hit[i] - p0) + ' s!', '#ff4a4a'); });
  // the Shriekers: hatched in the venom where the broken quarters were, tanked to the raid; Vicious Echoes (kick it!), dead about 8:53
  S.shriekers = P.shriek.map((q, i) => ({ id: 'sh' + (i + 1), k: i + 1, p0: F(q, 2), up: T.shriek, dies: T.sdie }));
  { const mk = o.me && S.job[o.me] ? S.job[o.me].kick : 0, ck = (t) => { const r = Math.round(t); return Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0'); };
    warn(T.shriek, mk ? 'Two Shriekers: your kick is Shrieker ' + mk + ' at ' + ck(T.echoes) + ' (E)!' : 'Two Blightscale Shriekers: kill them fast!', '#ff9fb2'); if (mk) warn(T.echoes, 'Kick now: your Shrieker\'s Vicious Echoes (E)!', '#ff9fb2'); }
  S.echoes = S.shriekers.map((s) => ({ sh: s.id, k: s.k, t0: T.echoes, t1: T.echoes + T.echoCast, c: cast('shrieker', 'Shrieker: Vicious Echoes', T.echoes, T.echoes + T.echoCast) })); timer(T.echoes, 'Vicious Echoes');
  // the last burn
  cast('boss', 'Rage of the Shackled', T.rage, T.heart); timer(T.heart, 'Heart open'); for (let t = T.heart; t < T.end; t += 4) S.pulses.push(t);
  S.heart = F(P.heart, 3);
  { const al = [0, 0, 0, 0]; al[Qs[3]] = 1; for (let t = T.heart + 2.5; t < T.end - 1; t += 4) for (let j = 0; j < 2; j++) { let q = null; for (let k = 0; k < 40; k++) { const c = F([6 + rnd() * 14, 6 + rnd() * 14], 3); /* (picked: two every 4 s on the inner part of her quarter, away from the heart, the melee by it and the soakers spread at the rim) */ if (pgP3Floor(c[0], c[1], al, 3)) { q = c; break; } }
    if (q) S.impacts.push({ x: q[0], y: q[1], r: 7, t0: t + j * 0.25 - 2, at: t + j * 0.25, name: 'Falling Debris', dmg: 30, color: '#c8a36a', tip: 'Brown circles: step out before they land.' }); }
    warn(T.heart + 0.3, 'The heart is open: burn it, dodge brown circles!', '#c8a36a'); }
  S.timers.sort((a, b) => a.t - b.t); S.warns.sort((a, b) => a.t - b.t);
  return S;
}
// (a spot pulled onto the standing stone, the nearest one)
// (a spot pulled onto the standing stone, the nearest one a little way in from its edge)
function pgP3Near(q, alive) { if (pgP3Floor(q[0], q[1], alive, 1.4)) return [q[0], q[1]]; for (let r = 0.5; r < 30; r += 0.5) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, x = q[0] + Math.cos(a) * r, y = q[1] + Math.sin(a) * r; if (pgP3Floor(x, y, alive, 1.4)) return [x, y]; } return [q[0], q[1]]; }

// ---- the part: practice.js calls pgP3(api) once per game ----
function pgP3(A) {
  const T = PG_P3_T, P = PG_P3, clk = pgClock, RN = { m: 'Melee', r: 'Ranged', h: 'Healer' }, ORD = ['', '1st', '2nd', '3rd'];
  let S = null, G = null; const sync = () => { S = A.S; G = A.G; };
  let setUp = false; const setup = () => { if (setUp) return; setUp = true;
    if (A.DPS_SAY) Object.assign(A.DPS_SAY, { clutch: ['Hit the clutches', 'The clutches were up', 'Once the Death Knights grip the clutches onto the raid, press Tab to pick one, then keep pressing 1 until they die.', 'them'],
      wretch: ['Hit the Wretch', 'The Wretch was up', 'Press Tab to pick the Blightscale Wretch, then keep pressing 1: kill it before its third bubble.', 'it'], shrieker: ['Hit the Shriekers', 'The Shriekers were up', 'Press Tab to pick a Blightscale Shrieker, then keep pressing 1: they stack damage on the whole raid, so kill them fast.', 'them'] });
    Object.assign(A.DEB, { bite: ['Serpent\'s Bite', '#ff4a4a'], purge: ['Volatile Purge', '#ff8a3b'], stun: ['Stunned', '#ffd23b'], echo: ['Vicious Echoes', '#ff9fb2'], acid: ['Acidic Expulsion', '#a8e04a'], corpse: ['Calcified Corpse', '#b8a88a'] });
    ['prey', 'stone', 'soakmiss', 'stack', 'purge', 'kick', 'fester', 'wipe'].forEach((k) => A.MAJ.add(k)); };
  // ---- your job (the start card), remembered on this browser ----
  const KEY = 'wla-pg-job3', job0 = () => ({ role: 'r', soak: 0, bite: 'random', kick: 2 });
  const jobOk = (j) => !!j && /^[mrh]$/.test(j.role) && [0, 1, 2, 3].includes(j.soak) && ['random', 'yes', 'no'].includes(j.bite) && [0, 1, 2].includes(j.kick);
  let pk = (() => { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (jobOk(j)) { if (j.role !== 'h' && j.soak && !j.kick) j.kick = j.role === 'm' ? 1 : 2; /* (a soak saved before the soaks carried a kick) */ return j; } } catch (e) { /* (no storage) */ } return job0(); })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(pk)); } catch (e) { /* (no storage) */ } };
  // (a healer has no kick and, since Nov 6, no red circle: what's played drops them, but the saved pick keeps them for when you switch back (the review, Nov 15:
  // one tap on Healer wiped a saved kick and red circle))
  const eff = () => (pk.role === 'h' ? { ...pk, kick: 0, bite: 'no' } : pk);
  // (your slot: one with your role whose usual jobs are nearest your pick; never the melee Death Knight on the grips)
  const slotOf = (j) => { const D = pgP3Base(), c = GDZ_RAID.filter((id) => id[0] === j.role && !D[id].dk); return c.map((id) => [id, (j.soak && D[id].sk.includes(j.soak) ? 3 : 0) + (!D[id].sk.length ? (j.soak ? 0.5 : 1) : 0) + (j.kick && D[id].kick === j.kick ? 2 : 0) + (!j.kick && !D[id].kick ? 1 : 0)]).sort((a, b) => b[1] - a[1])[0][0]; };
  const mine = () => A.me === slotOf(eff());
  const pos = (id) => (id === A.me ? [G.x, G.y] : [G.bots[id].x, G.bots[id].y]);
  const spiral = (c, i, r) => { const a = i * 2.39996, rr = r * Math.sqrt(((i % 9) + 0.5) / 9); return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; };
  const range = (id) => P.KICK[id[0]] || 0;
  const once = (k) => (G.p3.once.has(k) ? false : (G.p3.once.add(k), true));
  const stunned = (id, t) => (G.p3.stun[id] || -1) > t;
  const alive = (t) => [0, 1, 2, 3].map((k) => { const n = S.Qs.indexOf(k); return n < 0 || n > 2 || t < S.hit[n] ? 1 : 0; });
  const near = (q, t) => pgP3Near(q, alive(t == null ? G.t : t));
  const step = (t) => S.stepAt(t);
  // (where the raid should be: on her quarter, and on the next one from 2.5 s into each Circling Prey's cast)
  const raidStep = (t) => { let n = step(t); for (let i = 0; i < 3; i++) if (t >= T.prey[i] + 2.5 && t < S.sink[i] + 2.3) n = Math.max(n, i + 1); return n; };
  const FR = (p, n) => S.F2(p, n);
  const kq = (x, y) => { const c = pgP3Cell(x, y), M = pgP3Mask(); return c >= 0 && M.q[c] >= 0 ? M.q[c] : -1; };

  // ---- the Wretch and the Shriekers and the clutches: where they are ----
  const wrWant = (t) => { const W = S.wretch; if (t < W.land || t >= W.dies || G.p3.wrDead) return null; if (t < W.land + 25) return W.p0.slice(); /* (awake at 20 s, but it stays put until 25 s on all 17 kills, then reaches its bubble spot about 7:40) */ const f = W.fb; return t < f[0].at + 1 ? f[0].p.slice() : t >= T.prey[1] + 2.5 ? f[1].p.slice() : f[0].p.slice(); };
  const shWant = (s, t) => { if (t < s.up || t >= s.dies || G.p3.shDead[s.id]) return null; if (t < s.up + 1.2) return s.p0.slice(); const c = FR(P.grasp, step(t)); return [c[0] + (s.k === 1 ? -2.5 : 2.5), c[1] + (s.k === 1 ? 1.5 : -1.5)]; };

  // ---- where each raider's job wants them (the bots, the autopilot and your hint arrow all follow this; practice.js's shared dodge then keeps them out
  // of the waves) ----
  const roleSpot = (id, n, t) => { const i = GDZ_RAID.indexOf(id); if (id === S.herTank(t == null ? G.t : t)) return FR(P.tank, n); if (id === 't1' || id === 't2') return FR(P.off, n);
    const tk = FR(P.tank, n), out = (q) => { const d = pgDist(q, tk); return d < 6.8 ? [tk[0] + (q[0] - tk[0]) / (d || 1) * 6.8, tk[1] + (q[1] - tk[1]) / (d || 1) * 6.8] : q; }; /* (never in her reach: the review, Nov 15) */
    return id[0] === 'm' ? out(spiral(FR(P.mel, n), i, 4.5)) : id[0] === 'h' ? spiral(FR(P.heal, n), i, 3.8) : spiral(FR(P.rng, n), i, 5); };
  // (what the melee stand round, when the raid is killing something: the Shriekers, the clutches gripped in, the Wretch once it's with the raid)
  const meleeFoe = (t) => { const c = FR(P.mel, raidStep(t)), sh = Object.values(G.p3.sh).filter((s) => pgDist([s.x, s.y], c) < 25); if (sh.length) return [sh.reduce((a, s) => a + s.x, 0) / sh.length, sh.reduce((a, s) => a + s.y, 0) / sh.length];
    const cl = S.clutches.find((q) => G.p3.cl[q.id] && G.p3.cl[q.id].on && t >= q.grasp); if (cl) return FR(P.grasp, cl.n); const w = G.p3.wr; return w && t >= S.wretch.wake + 6 && pgDist([w.x, w.y], c) < 20 ? [w.x, w.y] : null; };
  const job = (id, t) => { sync(); const n = raidStep(t), b0 = id === A.me ? { x: G.x, y: G.y } : G.bots[id]; let T0 = roleSpot(id, n, t), fast = false, ob = null, viaGate = false;
    if (id[0] === 'm') { const fo = meleeFoe(t); if (fo) T0 = spiral(fo, GDZ_RAID.indexOf(id), 3.6); }
    // the start: onto her first quarter, through the gateway when there is one
    const g1 = S.gates.find((g) => g.k === 1); if (g1 && t < T.gateEnd + 6 && kq(b0.x, b0.y) === P.land && !G.p3.used[id + 'g1']) { T0 = g1.p.slice(); fast = true; ob = { at: T.clu[0] - 3, p: g1.p, r: 1.2 }; }
    // the gateway to the third quarter at the second Circling Prey: the ranged and healers take it once her waves have passed its far end (7 of 17 kills
    // used one, at 8:07 to 8:12; through it sooner, you come out in her waves), the rest walk
    const g2 = S.gates.find((g) => g.k === 2); if (g2 && t >= T.gate2w && t < T.gate2[1] && (id[0] === 'r' || id[0] === 'h' || id === A.me) && kq(b0.x, b0.y) === S.Qs[1] && !G.p3.used[id + 'g2']) { T0 = g2.p.slice(); fast = true; ob = { at: S.hit[1], p: g2.p, r: 1.2 }; viaGate = true; }
    // the tanks: her tank in her reach; the off tank on the beam, then her again; the Wretch held by the other; the Shriekers picked up
    if (id === 't1' || id === 't2') { const wr = S.wrath.find((q) => q.tank === id && t >= q.t0 - 3 && t <= q.at + 3.2), bm = S.beams.find((b) => b.tank === id && t >= b.t0 - 11 && t <= b.t1 + 0.3); /* (11 s: two cracks to cross to the far quarter) */
      if (bm) { T0 = bm.at.slice(); fast = true; } else if (wr) { T0 = wr.p.slice(); fast = true; }
      else if (id === 't1' && t >= 450 && t < S.wretch.dies && G.p3.wr) { const w = G.p3.wr, c = FR(P.mel, n); const ex = w.x - c[0], ey = w.y - c[1], ee = Math.hypot(ex, ey) || 1; T0 = t < S.wretch.wake + 0.5 ? [w.x, w.y] : [w.x + ex / ee * 2.5, w.y + ey / ee * 2.5]; fast = pgDist([b0.x, b0.y], T0) > 4; }
      else if (id === 't1' && t >= T.shriek && t < T.sdie) { const sh = Object.values(G.p3.sh)[0]; if (sh && t < T.shriek + 1.5) { T0 = [sh.x, sh.y]; fast = true; } else T0 = FR([P.grasp[0] + 3, P.grasp[1] + 3], step(t)); } }
    // the bites: the targets to the stack spot, the soakers onto it; after it clears, the soakers out to the rim for the Purge
    const bt = S.bites.find((b) => t >= b.land - 1.2 && t < b.end + 0.5 && !(G.p3.bite[b.i] && G.p3.bite[b.i].done)), pu = G.p3.purge.find((q) => q.who.includes(id) && t < q.burst + 2.1);
    // (a soaker: out to their spot at the rim, and there until the waves have gone (their three lanes show red from 1.5 s before the burst))
    if (pu) { T0 = pu.spot[id] || T0; fast = true; ob = { at: pu.burst, p: T0, r: 1 }; }
    else if (bt && (bt.tg.includes(id) || bt.so.includes(id))) { const wr = S.wrath.find((q) => q.tank === id && t >= q.at - 1 && t <= q.at + 3.2);
      T0 = bt.tg.includes(id) ? [bt.stack[0] + (bt.tg.indexOf(id) ? 0.7 : -0.7), bt.stack[1]] : wr ? (() => { const ex = bt.stack[0] - wr.p[0], ey = bt.stack[1] - wr.p[1], ee = Math.hypot(ex, ey) || 1; return [wr.p[0] + ex / ee * Math.min(3.8, ee / 2), wr.p[1] + ey / ee * Math.min(3.8, ee / 2)]; })() : spiral(bt.stack, bt.so.indexOf(id) + 1, 2.2);
      fast = pgDist([b0.x, b0.y], T0) > 2; ob = { at: bt.end, p: bt.stack, r: 2 }; }
    // (everyone else keeps 7 yards from the soakers, where they stand and where they're going, until the Purge has burst)
    if (!pu) G.p3.purge.forEach((q) => { if (t >= q.burst + 0.3) return; q.who.forEach((s) => [pos(s), q.spot[s]].forEach((c) => { if (!c) return; const d = pgDist(T0, c); if (d < 7) { const a = d > 0.1 ? Math.atan2(T0[1] - c[1], T0[0] - c[0]) : 0; T0 = [c[0] + Math.cos(a) * 7.2, c[1] + Math.sin(a) * 7.2]; } })); });
    // (a red circle that isn't yours: keep out of its 7 yards, or you soak it too)
    if (!pu && !(bt && (bt.tg.includes(id) || bt.so.includes(id)))) S.bites.forEach((b) => { const st = G.p3.bite[b.i]; if (t < b.land - 0.5 || t >= b.end || (st && st.done) || b.tg.includes(id) || b.so.includes(id)) return;
      b.tg.forEach((tg) => { const p = tg === id ? null : pos(tg); if (!p) return; const d = pgDist(T0, p); if (d < P.BITE + 2) { const a = d > 0.1 ? Math.atan2(T0[1] - p[1], T0[0] - p[0]) : 0; T0 = [p[0] + Math.cos(a) * (P.BITE + 2.2), p[1] + Math.sin(a) * (P.BITE + 2.2)]; } }); });
    // Fester Burst: everyone into the bubble round the Wretch
    const fb = S.wretch.fb.find((q) => t >= q.t0 - 2.5 && t <= q.at + 0.3); if (fb && G.p3.wr && !pu) { const w = [G.p3.wr.x, G.p3.wr.y]; if (pgDist(T0, w) > 6.5) { const i = GDZ_RAID.indexOf(id); T0 = spiral(w, i, 6); } fast = true; ob = { at: fb.at, p: w, r: 5 }; }
    // the kickers in reach of their Shrieker
    const ek = S.echoes.find((e) => S.job[id].kick === e.k && t >= e.t0 - 5 && t <= e.t1 && !G.p3.kick[e.sh]); if (ek && G.p3.sh[ek.sh]) { const s = G.p3.sh[ek.sh], rg = range(id) - 1.5, d = pgDist(T0, [s.x, s.y]); if (d > rg && rg > 0) T0 = [s.x + (T0[0] - s.x) * rg / d, s.y + (T0[1] - s.y) * rg / d]; }
    // the heart: the melee up by it (it's off the stone, by her corner)
    if (t >= T.heart - 1.5 && id[0] === 'm' && !pu && !bt && (!G.p3.bite[2] || G.p3.bite[2].done)) { const hs = near(S.heart.slice(), t); T0 = spiral([hs[0] + (S.heart[0] - hs[0]) * 0.1, hs[1] + (S.heart[1] - hs[1]) * 0.1], GDZ_RAID.indexOf(id), 1); } /* (the stone nearest the heart, once the last bite has drained: its circles sit by the heart) */
    // out of her reach in Mother's Wrath, unless it's yours
    for (const wr of S.wrath) if (t >= wr.t0 && t <= wr.at + 3.2 && id !== wr.tank && pgDist(T0, wr.p) < 6.5) { const a = Math.atan2(T0[1] - wr.p[1], T0[0] - wr.p[0]); T0 = [wr.p[0] + Math.cos(a) * 6.8, wr.p[1] + Math.sin(a) * 6.8]; if (id === A.me) { fast = true; if (!ob) ob = { at: wr.at, p: T0.slice(), r: 1.5 }; } } /* (your arrow: to the spot out of her reach) */
    // (Circling Prey due: never stay on her quarter)
    for (let i = 0; i < 3; i++) if (!viaGate && t >= T.prey[i] + 2.5 && t <= S.hit[i] + 0.2 && kq(T0[0], T0[1]) === S.Qs[i]) { /* (the second gateway sits on her quarter: walking to it is the way off) */ T0 = roleSpot(id, i + 1, t); fast = true; }
    for (let i = 0; i < 3; i++) if (t >= T.prey[i] && t <= S.hit[i] && kq(b0.x, b0.y) === S.Qs[i]) { fast = true; if (!ob) ob = { at: S.hit[i], p: T0, r: 2 }; }
    T0 = near(T0, viaGate ? t : Math.max(t, ...S.hit.filter((h, i) => t >= T.prey[i] + 2.5 && t < h + 0.1))); /* (the gateway stands on her quarter until it breaks) */
    { const qh = kq(b0.x, b0.y), qt = kq(T0[0], T0[1]); if (qh >= 0 && qt >= 0 && qh !== qt) fast = true; } /* (on the wrong quarter: hurry, and your arrow shows the way) */
    return { T: detour(b0, route(b0, T0, id), id), fast, ob }; };
  // (a walk between two quarters goes across the narrowest part of the crack between them, one quarter at a time; a point once picked is kept until you're on it)
  // (a straight walk that stays on the standing stone: the shared dodge asks before it picks an escape)
  const walk = (ax, ay, bx, by) => { sync(); const al = alive(G.t), d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d * 2)); for (let k = 1; k <= n; k++) { const f = k / n; if (!pgP3Floor(ax + (bx - ax) * f, ay + (by - ay) * f, al, 0.7)) return false; /* (a wider margin than onPlat's 0.35, so no step along it lands off) */ } return true; };
  // (in a crack, a raider still belongs to the quarter they came from until they're on the next; the crossing, once reached, takes them on to the next)
  const route = (b0, T0, id) => { const a = [b0.x, b0.y], here = kq(a[0], a[1]); if (here >= 0) G.p3.lq[id] = here; const qa = G.p3.lq[id], qb = kq(T0[0], T0[1]);
    if (qa == null || qb < 0 || qa === qb) return T0;
    const al = alive(G.t), brk = T.prey.findIndex((p0, i) => G.t >= p0 && G.t < S.hit[i]), no = (q) => !al[q] || (brk >= 0 && q === S.Qs[brk]), fwd0 = (qb - qa + 4) % 4, fwd = fwd0 === 2 ? (no((qa + 1) % 4) ? 3 : 1) : fwd0, nx = fwd === 3 ? (qa + 3) % 4 : (qa + 1) % 4, C = P.cross[fwd === 3 ? nx : qa], cen = pgP3R([20, 20], nx), d = pgDist(C, cen) || 1, on = [C[0] + (cen[0] - C[0]) / d * 4.5, C[1] + (cen[1] - C[1]) / d * 4.5];
    return (here < 0 && pgDist(a, C) < 4.5) || pgDist(a, C) < 1.2 ? on : C; };
  // (a straight walk that would clip a notch or the hole in the middle: via a point toward the middle of the quarter you're on)
  const detour = (b0, R, id) => { const a = [b0.x, b0.y]; if (walk(a[0], a[1], R[0], R[1])) return R; const q = kq(a[0], a[1]) >= 0 ? kq(a[0], a[1]) : G.p3.lq[id]; if (q == null || q < 0) return R;
    const c = pgP3R([20, 20], q), m = [(a[0] + R[0]) / 2, (a[1] + R[1]) / 2];
    for (const f of [0.25, 0.45, 0.65, 0.85]) { const W = [m[0] + (c[0] - m[0]) * f, m[1] + (c[1] - m[1]) * f]; if (walk(a[0], a[1], W[0], W[1]) && walk(W[0], W[1], R[0], R[1])) return W; }
    for (const f of [0.3, 0.6, 1]) { const W = [a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f]; if (walk(a[0], a[1], W[0], W[1])) return W; } return R; };
  const home = (id) => { sync(); const i = GDZ_RAID.indexOf(id), c = S && S.Qs[0] === P.land ? null : P.landAt; return pgP3Near(c ? spiral(c, i, 7) : roleSpot(id, 0, T.start), [1, 1, 1, 1]); };
  const slow = (id, t) => { sync(); if (!G || !G.p3) return 1; if (stunned(id, t)) return 0; const p = pos(id); return pgP3Crack(p[0], p[1]) ? 0.65 : 1; };

  // ---- a new run ----
  const init = (G0) => { setup(); G = G0; S = A.S; G.t = T.start; G.wipes = 0; G.bossHp = bossHp(T.start);
    G.p3 = { used: {}, lock: {}, lq: {}, clDone: {}, shDead: {}, wrHp: P.WRETCH.hp, wrDead: null, kick: {}, stun: {}, kickCd: -99, cl: {}, sh: {}, wr: null, bite: {}, purge: [], stones: [], grips: [], missed: [], once: new Set() };
    GDZ_RAID.forEach((id) => { const p = home(id); if (id !== A.me) { G.bots[id].x = p[0]; G.bots[id].y = p[1]; } }); };
  const bossHp = (t) => Math.max(0, 40 - 34 * Math.min(1, (t - T.start) / (T.heart - T.start)) - (t > T.heart ? 6 * Math.min(1, (t - T.heart) / (T.end - T.heart)) : 0));

  // ---- what happens each step ----
  const gates = (t) => { const me = A.me;
    GDZ_RAID.forEach((id) => { const lk = G.p3.lock[id]; if (lk && pgDist(pos(id), lk) > 3.6) delete G.p3.lock[id]; });
    S.gates.forEach((g) => { if (t < g.t0 || t > g.t1) return; GDZ_RAID.forEach((id) => { if (G.p3.lock[id] || G.p3.used[id + 'g' + g.k]) return; const p = pos(id); if (pgDist(p, g.p) > 2.4) return;
      if (id !== me && g.k === 2 && !(id[0] === 'r' || id[0] === 'h')) return;
      const dst = near(spiral(g.to, GDZ_RAID.indexOf(id), 2.6), t); if (id === me) { G.x = dst[0]; G.y = dst[1]; G.kb = null; A.clearTarget(); A.say('Through the gateway.'); } else { G.bots[id].x = dst[0]; G.bots[id].y = dst[1]; G.bots[id].esc = null; }
      G.p3.lock[id] = g.to.slice(); G.p3.used[id + 'g' + g.k] = t; G.p3.lq[id] = kq(dst[0], dst[1]); }); });
    if (t > T.clu[0] + 2 && t <= T.clu[0] + 2.5 && kq(G.x, G.y) !== S.Qs[0] && once('late1')) A.mistake('late', 'You weren\'t on her quarter when phase 3 began (' + clk(T.clu[0]) + ').', S.gates.some((g) => g.k === 1) ? 'Take the gateway (the gold ring) to her quarter as she rises, then stack with the raid.' : 'Stack with the raid on her quarter as she rises.', 0); };
  // (the kicks: Vicious Echoes from each Shrieker)
  const kickables = (t) => S.echoes.filter((e) => t >= e.t0 && t <= e.t1 && !G.p3.kick[e.sh] && G.p3.sh[e.sh]).map((e) => ({ key: e.sh, kind: 'Vicious Echoes', p: [G.p3.sh[e.sh].x, G.p3.sh[e.sh].y], who: GDZ_RAID.find((id) => S.job[id].kick === e.k) || null, t0: e.t0, c: e.c }));
  const kicked = (k, who, t) => { G.p3.kick[k.key] = who; k.c.t1 = Math.min(k.c.t1, t); if (who === A.me) A.say('Kicked: Vicious Echoes interrupted.'); };
  const kick = () => { sync(); if (!G || !G.p3) return; const t = G.t, me = A.me, rg = range(me);
    if (!rg) { A.say('Healers have no kick in Midnight (only a Restoration Shaman).', true); return; } if (stunned(me, t)) { A.say('You\'re stunned.', true); return; }
    if (t - G.p3.kickCd < 15) { A.say('Kick is on cooldown: ' + Math.ceil(15 - (t - G.p3.kickCd)) + ' s.', true); return; }
    const foes = Object.values(G.p3.sh).map((s) => [s.x, s.y]); if (!foes.some((p) => pgDist(p, [G.x, G.y]) <= rg)) { A.say('Nothing to kick within ' + rg + ' yards.', true); return; }
    G.p3.kickCd = t; const K = kickables(t).filter((k) => pgDist(k.p, [G.x, G.y]) <= rg).sort((a, b) => (b.who === me) - (a.who === me))[0]; if (K) kicked(K, me, t); else A.say('Kick wasted: nothing was casting. 15 s until the next.', true); A.hud(true); };
  const kicks = (t0, t) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    kickables(t).forEach((k) => { if (!k.who || stunned(k.who, t) || (k.who === me && !window.__pgAuto) || t < k.t0 + 0.3) return; if (pgDist(pos(k.who), k.p) <= range(k.who) + (k.who === me ? 0 : 3)) kicked(k, k.who, t); });
    S.echoes.forEach((e) => { const s = G.p3.sh[e.sh], who = GDZ_RAID.find((id) => S.job[id].kick === e.k); if (!cr(e.t1) || G.p3.kick[e.sh] || !s) return; G.p3.kick[e.sh] = 'none'; G.p3.missed.push([who, 'a Vicious Echoes not kicked ' + clk(e.t0)]);
      GDZ_RAID.forEach((id) => { if (pgDist(pos(id), [s.x, s.y]) <= P.ECHO) G.p3.stun[id] = t + 6; }); A.deb('stun', 6); A.deb('echo', 12, true); A.hurt(25);
      if (who === me) A.mistake('kick', 'You didn\'t kick Vicious Echoes (' + clk(e.t0) + '): the whole raid was stunned for 6 s.', 'Press E while the Shrieker glows pink ("Vicious Echoes: kick!"), within ' + range(me) + ' yards of it.', 0); else A.say('Vicious Echoes: stunned for 6 s.', true); }); };
  // (the clutches: landed, gripped, pulled in by Gorefiend's Grasp, cleaved down. The audit, Nov 15, Flex: "if this skips any part of the fight that
  // requires mechanical execution its not good enough": a clutch has health now. Broken before its Slithering Gestation ends (10.2 s, measured 10 to
  // 10.4), it leaves a Rawling that stays until it's killed (practice.js's shared adds: the raid wears them down, one boils at 25 s); still whole, it
  // hatches a Viper (LPDTjqfyrBQWx1Nc fight 21: three at 6:32). The raid breaks the near three on its own; the far one, gripped in last, needs your hits too)
  const clutches = (t0, t, dt) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    S.clutches.forEach((c) => { let st = G.p3.cl[c.id]; if (t < c.land || c.done || G.p3.clDone[c.id]) return;
      if (!st) st = G.p3.cl[c.id] = { x: c.p[0], y: c.p[1], on: c.rel === 0, hp: P.CLUTCH.hp };
      c.grips.forEach((g) => { if (!cr(g.at)) return; const d = pos(g.by), to = g.mid ? near(pgP3R(P.clutch[1], (S.Qs[c.n] + 1) % 4), t) : [d[0] + 1.5, d[1] - 1]; G.p3.grips.push({ by: g.by, from: [st.x, st.y], to, t0: t }); st.x = to[0]; st.y = to[1]; if (!g.mid) st.on = true; });
      if (cr(c.grasp)) { const q = near(FR(P.grasp, c.n), t); if (st.on) { const i = S.clutches.indexOf(c); st.x = q[0] + Math.cos(i * 2.1) * 1.4; st.y = q[1] + Math.sin(i * 2.1) * 1.4; } if (!G.p3.once.has('grasp' + c.ci)) { G.p3.once.add('grasp' + c.ci); G.p3.grips.push({ by: P.dk[0], grasp: q, t0: t }); } }
      if (st.on && t >= c.land + 0.5) st.hp -= P.CLUTCH.drain * dt; /* (the raid's cleave once it's with the raid) */
      if (st.hp <= 0) { G.p3.clDone[c.id] = 'broken'; delete G.p3.cl[c.id]; G.adds.push({ kind: 'rawling', x: st.x, y: st.y, born: t }); return; }
      if (t >= c.land + P.CLUTCH.gest) { G.p3.clDone[c.id] = 'viper'; delete G.p3.cl[c.id]; G.adds.push({ kind: 'viper', x: st.x, y: st.y, born: t }); G.vipers = (G.vipers || 0) + 1; A.deb('putrid', 20, true);
        A.mistake('viper', 'A Slithering Clutch wasn\'t broken in time (' + clk(t) + '): it hatched a Viper, with Putrid Membrane on the raid.', 'Once the Death Knights grip a clutch in, press Tab to pick it and keep pressing 1: break each one within 10 s of landing.', 8); return; }
      // (before the grips, a clutch crawls for the venom, a yard a second)
      if (!c.grips.some((g) => t >= g.at) && c.rel !== 0) { const R = c.k, cen = pgP3R([20, 20], R), ex = st.x - cen[0], ey = st.y - cen[1], ee = Math.hypot(ex, ey) || 1; st.x += ex / ee * dt; st.y += ey / ee * dt; } });
    G.p3.grips = G.p3.grips.filter((g) => t - g.t0 < 0.7); };
  // (the bites: each red circle drains while soakers stand in it; three clear it in about 13 s, two never do)
  const bites = (t0, t, dt) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    S.bites.forEach((b) => { if (t < b.land) return; let st = G.p3.bite[b.i]; if (!st) { st = G.p3.bite[b.i] = { v: {}, by: new Set(), done: null }; b.tg.forEach((id) => { st.v[id] = 100; }); if (b.tg.includes(me)) { A.deb('bite', T.venom); A.say('Serpent\'s Bite on you: walk to the gold ring and stack with the other red circle.', true); } }
      if (st.done) return;
      const inNow = new Set(); b.tg.forEach((tg) => { if (st.v[tg] <= 0) return; const p = pos(tg); let n = 0; GDZ_RAID.forEach((id) => { if (b.tg.includes(id)) return; if (pgDist(pos(id), p) <= P.BITE) { n++; inNow.add(id); } }); st.v[tg] -= P.DRAIN * n * dt; });
      st.sec = st.sec || {}; inNow.forEach((id) => { st.sec[id] = (st.sec[id] || 0) + dt; if (st.sec[id] >= 1) st.by.add(id); }); /* (a soaker is one who stood in it a second or more: a step through it doesn't count) */
      // (the autopilot, a careful soaker, presses its defensive just before the circles drain)
      if (window.__pgAuto && st.by.has(me) && t - G.def >= 90 && Math.max(...b.tg.map((tg) => st.v[tg])) < 14) { G.def = t; A.deb('def', 8); }
      if (b.tg.every((tg) => st.v[tg] <= 0)) { st.done = t; if (G.debs.bite && b.tg.includes(me)) G.debs.bite.until = t;
        const who = [...st.by]; G.p3.purge.push({ i: b.i, who, burst: t + T.purge, spot: spreadSpots(who, b.n, t), waves: false });
        if (who.includes(me)) { A.deb('purge', T.purge); if (!b.so.includes(me) && once('extra' + b.i)) A.mistake('extra', 'You soaked Serpent\'s Bite ' + (b.i + 1) + ' without being one of its soakers: you took its 2 million and a Volatile Purge too.', 'Soak with as few as possible: only the three assigned soakers stand in the red circles.', 0);
          if (A.has('def')) { A.hurt(18); A.say('The bite cleared: spread out now, 5 yards from everyone, at the edge.'); } else A.mistake('def', 'You took the end of Serpent\'s Bite (about 2 million) without a defensive.', 'Press Q (your defensive) just before the red circles drain.', 40); }
        return; }
      if (t >= b.end) { st.done = t; b.tg.forEach((tg) => { if (st.v[tg] <= 0) return; const p = pos(tg); G.p3.stones.push({ x: p[0], y: p[1], t0: t, who: tg }); });
        const mineFail = (b.tg.includes(me) && st.v[me] > 0) || (b.so.includes(me) && !st.by.has(me)); A.deb('corpse', 6); A.hurt(20);
        if (mineFail) { G.wipes++; if (b.tg.includes(me) && st.v[me] > 0) A.mistake('stack', 'Your Serpent\'s Bite ran out uncleared (' + clk(b.end) + '): you turned to stone, and the corpse hurts the whole raid every second. A wipe on a real pull.', 'Walk to the gold ring as soon as the red circle lands, onto the other red circle: the soakers stand there.', 0);
          else A.mistake('soakmiss', 'You didn\'t soak Serpent\'s Bite ' + (b.i + 1) + ': two soakers can\'t drain it in 15 s, so it turned to stone. A wipe on a real pull.', 'Stand on the stacked red circles (the gold ring) from the moment they land until they drain.', 0); }
        else G.p3.missed.push([b.tg.find((id) => st.v[id] > 0) || '?', 'a Serpent\'s Bite turned to stone ' + clk(b.end)]); } });
    // the Purge: 5 s after the bite clears, a 5-yard burst on each soaker, then three waves out of each, 120 degrees apart, one straight away from the raid
    // (the three ways are turned as clear of the raid as they can be (the game picks them; the guide draws them that way), so a soaker at the edge
    // with the raid behind them sends all three clear, and one in the raid can't)
    G.p3.purge.forEach((q) => { if (!q.waves && t >= q.burst - 1.5) { q.waves = true; const c = FR(P.mel, step(q.burst));
      const dest = {}; GDZ_RAID.forEach((o) => { dest[o] = job(o, t).T; }); /* (where each raider is heading too, so the lanes miss them there as well) */
      q.who.forEach((id) => { const p = id === me || !q.spot[id] ? pos(id) : q.spot[id], others = /* (a bot's lanes from the spot it's walking to; yours from where you stand) */ GDZ_RAID.filter((o) => o !== id).flatMap((o) => (dest[o] ? [pos(o), dest[o]] : [pos(o)])), base = aim3(p, others, Math.atan2(p[1] - c[1], p[0] - c[0]));
        [0, 2 * Math.PI / 3, -2 * Math.PI / 3].forEach((da) => { const a = base + da, o = [p[0] + Math.cos(a) * 4.5, p[1] + Math.sin(a) * 4.5]; /* (from 4.5 yards out: a soaker still stepping can't walk into their own wave) */
          S.waves.push({ kind: 'purge', from: id, x: o[0], y: o[1], deg: a * 180 / Math.PI, v: 14, w: 5, d: 3, cres: [[-2.5, 2.5]], warn: 1.5, t0: q.burst + 0.2, t1: q.burst + 2, name: 'Caustic Waves from a Volatile Purge', tip: 'Each soaker\'s Purge sends three waves out: keep out of their lanes.' }); });
        if (id === me) { const hitN = others.filter((q2) => lanes(p, base).some((u) => { const dx = q2[0] - p[0], dy = q2[1] - p[1], al = dx * u[0] + dy * u[1]; return al > 1 && al < 27 && Math.abs(dy * u[0] - dx * u[1]) < 3.4; })).length;
          if (hitN && once('pw' + q.i)) A.mistake('purge', 'Your Volatile Purge waves headed through ' + hitN + ' raider' + (hitN > 1 ? 's' : '') + '.', 'Walk to the edge of the quarter, away from the raid, before it bursts: then its three waves miss everyone.', 0); } }); }
      if (!cr(q.burst)) return; const near5 = (id) => GDZ_RAID.filter((o) => o !== id && pgDist(pos(o), pos(id)) <= P.PURGE);
      if (q.who.includes(me)) { const n = near5(me).length; if (G.debs.purge) G.debs.purge.until = t; G.p3.dot = t + 18; A.hurt(8); if (n) A.mistake('purge', 'Your Volatile Purge burst on ' + n + ' raider' + (n > 1 ? 's' : '') + ' within 5 yards.', 'Spread out once the bite clears: 5 yards from everyone, at the edge, before the burst (5 s).', 12); }
      else if (q.who.some((id) => pgDist(pos(id), [G.x, G.y]) <= P.PURGE)) A.mistake('purge', 'A soaker\'s Volatile Purge burst on you.', 'Keep 5 yards from the bite soakers when their Purge bursts, 5 s after the circles clear.', 20); });
    G.p3.purge = G.p3.purge.filter((q) => t < q.burst + 1); G.p3.stones = G.p3.stones.filter((q) => t < q.t0 + 30); };
  // (where the soakers spread to: free rim spots of the raid's quarter, far from the raid and not far to walk, 7 yards apart; you pick first, so the
  // gold "Spread here" is the best one)
  const spreadSpots = (who, n, t) => { const L = P.spread.map((q) => near(FR(q, n), t)), rest = GDZ_RAID.filter((id) => !who.includes(id)).map((id) => roleSpot(id, raidStep(t + T.purge), t + T.purge).concat([pos(id)])), used = [], out = {};
    const clear = (q) => Math.min(14, ...rest.map((r) => Math.min(pgDist(q, [r[0], r[1]]), pgDist(q, r[2])))); /* (from where the raid stands and where it's going) */
    const order = who.slice().sort((a, b) => (b === A.me) - (a === A.me)); order.forEach((id) => { const p = pos(id), free = L.filter((q) => used.every((u) => pgDist(u, q) >= 10));
      const wk = id === A.me ? 0.55 : 0.25, best = (free.length ? free : L).slice().sort((a, b) => clear(b) - clear(a) + wk * (pgDist(a, p) - pgDist(b, p)))[0]; /* (yours a nearer one: you walk slower than the bots, and may have to dodge on the way) */ used.push(best); out[id] = best; }); return out; };
  // (the Purge's three lanes from a soaker, and the turn of them that keeps farthest from everyone: each raider's distance from a lane within its 27 yards)
  const lanes = (p, a) => [0, 2 * Math.PI / 3, -2 * Math.PI / 3].map((da) => [Math.cos(a + da), Math.sin(a + da)]);
  const aim3 = (p, others, out) => { let best = out, bs = -1e9; for (let k = 0; k < 24; k++) { const a = out - Math.PI / 3 + k * Math.PI / 36, L = lanes(p, a); let m = 9;
      for (const q of others) for (const u of L) { const dx = q[0] - p[0], dy = q[1] - p[1], al = dx * u[0] + dy * u[1]; if (al > -2 && al < 27) m = Math.min(m, Math.abs(dy * u[0] - dx * u[1])); }
      const sc = m + 0.02 * Math.cos(a - out); if (sc > bs) { bs = sc; best = a; } } return best; };
  const check = (t0, t) => { sync(); const dt = t - t0, cr = (at) => at > t0 && at <= t, me = A.me;
    // the Wretch: asleep where it landed, then dragged to the raid; the Shriekers walk to their tank
    { const w = wrWant(t); if (!w) G.p3.wr = null; else { const c = G.p3.wr; if (!c || pgDist([c.x, c.y], w) > 60) G.p3.wr = { x: w[0], y: w[1] }; else { const ex = w[0] - c.x, ey = w[1] - c.y, ee = Math.hypot(ex, ey), sp = 7.5 * dt; if (ee > sp) { c.x += ex / ee * sp; c.y += ey / ee * sp; } else { c.x = w[0]; c.y = w[1]; } } } }
    S.shriekers.forEach((s) => { const w = shWant(s, t); if (!w) { delete G.p3.sh[s.id]; return; } const c = G.p3.sh[s.id]; if (!c) { G.p3.sh[s.id] = { x: w[0], y: w[1], hp: P.SHRIEK.hp }; return; } const ex = w[0] - c.x, ey = w[1] - c.y, ee = Math.hypot(ex, ey), sp = 9 * dt; if (ee > sp) { c.x += ex / ee * sp; c.y += ey / ee * sp; } else { c.x = w[0]; c.y = w[1]; } });
    gates(t); kicks(t0, t); clutches(t0, t, dt); bites(t0, t, dt);
    // (the Shriekers and the Wretch have health (the audit, Nov 15): the raid wears them down once they're with it, your hits add)
    { const c = FR(P.mel, raidStep(t)); Object.entries(G.p3.sh).forEach(([k, s]) => { if (pgDist([s.x, s.y], c) < 25) s.hp -= P.SHRIEK.drain * dt; const ec = S.echoes.find((q) => q.sh === k); if (ec && !G.p3.kick[k] && t < ec.t1) s.hp = Math.max(s.hp, P.SHRIEK.hp * P.SHRIEK.floor); /* (it lives to cast: your kick) */ if (s.hp <= 0) { G.p3.shDead[k] = t; delete G.p3.sh[k]; } });
      const w = G.p3.wr; if (w && !G.p3.wrDead && t >= S.wretch.wake + 6 && pgDist([w.x, w.y], c) < 20) G.p3.wrHp -= P.WRETCH.drain * dt; if (w && G.p3.wrHp <= 0 && !G.p3.wrDead) { G.p3.wrDead = t; G.p3.wr = null; } }
    // (Acidic Expulsion: each Shrieker alive 6.6 s after it hatches puts a stack on the whole raid for about 36 s (8:36.8 to 9:14.5 on the kills); alive at 40 s, again)
    if (cr(T.acid)) Object.keys(G.p3.sh).forEach(() => A.deb('acid', 36, true));
    if (cr(T.shriek + P.SHRIEK.late) && Object.keys(G.p3.sh).length) { Object.keys(G.p3.sh).forEach(() => A.deb('acid', 20, true)); if (once('shlate')) A.mistake('dps', 'The Shriekers lived 40 s (' + clk(t) + '): Acidic Expulsion again on the whole raid.', 'Press Tab to pick a Blightscale Shrieker, then keep pressing 1: kill them fast.', 0); }
    if (A.has('acid')) G.hp -= 0.8 * G.debs.acid.n * dt * (A.has('def') ? 0.5 : 1);
    if (A.has('echo')) G.hp -= 1.5 * G.debs.echo.n * dt * (A.has('def') ? 0.5 : 1); /* (Vicious Echoes' damage over time, stacking: the audit, Nov 15) */
    // (the Wretch alive at its third bubble (on 2 of 17 kills it lived to a third and a fourth, 8:48 and 9:21): another, faster Fester Burst, and the reason why)
    if (cr(T.fester3[0]) && G.p3.wr && !G.p3.wrDead) { const q = { i: 2, t0: T.fester3[0], at: T.fester3[1], p: near(FR(P.fb[1], 2), t) }; S.wretch.fb.push(q); S.casts.push({ who: 'wretch', name: 'Fester Burst', t0: q.t0, t1: q.at });
      A.say('Fester Burst again: into the Wretch\'s bubble!', true); if (once('wr3')) A.mistake('dps', 'The Wretch lived to its third bubble (' + clk(t) + ').', 'Press Tab to pick the Blightscale Wretch and keep pressing 1 whenever it\'s up: kill it before its third bubble.', 0); }
    // Fester Burst: everyone farther than 10 yards from the Wretch is hit
    S.wretch.fb.forEach((q) => { if (!cr(q.at) || !G.p3.wr) return; if (pgDist([G.x, G.y], [G.p3.wr.x, G.p3.wr.y]) > P.FB) { A.deb('fester', 12); A.mistake('fester', 'Fester Burst: you were outside the Wretch\'s bubble (' + clk(q.at) + ').', 'Be within 10 yards of the Wretch when Fester Burst goes off: the bite\'s red circles stack inside it too.', 40); } });
    // Circling Prey: her quarter is destroyed with anyone on it; everyone takes a smaller hit
    S.hit.forEach((h, i) => { if (!cr(h)) return; const B = S.her(i); if (kq(G.x, G.y) === S.Qs[i] || pgDist([G.x, G.y], B) <= P.PREY) A.mistake('prey', 'Circling Prey destroyed her quarter with you on it (' + clk(h) + ').', 'At Circling Prey move one quarter left (counter-clockwise), across the crack or through the gateway, before it lands.', 100); else A.hurt(9); });
    // (the stone from a bite left uncleared: Calcified Corpse hurts the raid every second for a while)
    if (G.p3.stones.some((q) => t - q.t0 < 6)) A.hurt(6 * dt);
    if ((G.p3.dot || 0) > t) G.hp -= 1.2 * dt * (A.has('def') ? 0.5 : 1); /* (the Purge's 18 s of damage over time on a soaker) */
    if (stunned(me, t) && once('stun' + Math.floor(t))) A.clearTarget(); };

  // ---- the screen: your job now, what's next, the kick button ----
  const myBite = (t) => S.bites.find((b) => t >= b.land - 1.2 && t < b.end + 0.5 && (b.tg.includes(A.me) || b.so.includes(A.me)) && !(G.p3.bite[b.i] && G.p3.bite[b.i].done));
  const jobText = () => { sync(); const t = G.t, me = A.me, j = S.job[me], qm = kq(G.x, G.y), n = raidStep(t), pu = G.p3.purge.find((q) => q.who.includes(me) && t < q.burst + 0.3), bt = myBite(t);
    if (stunned(me, t)) return 'Stunned: ' + Math.ceil(G.p3.stun[me] - t) + ' s.';
    const g1 = S.gates.find((g) => g.k === 1); if (g1 && t < T.gateEnd && qm !== S.Qs[0] && !G.p3.used[me + 'g1']) return 'She rose on the ' + P.QN[S.Qs[0]] + ' quarter: walk into the gateway (the gold ring) to get to her.';
    if (pu) return t < pu.burst ? 'Volatile Purge in ' + Math.ceil(pu.burst - t) + ' s: walk to the edge (gold), 5 yards from everyone, with the raid behind you.' : 'Purge bursting: stay 5 yards from everyone.';
    if (bt) { const st = G.p3.bite[bt.i], left = Math.max(0, bt.end - t); if (bt.tg.includes(me)) return t < bt.land ? 'Serpent\'s Bite is coming: if it\'s on you, walk to the gold ring.' : 'Serpent\'s Bite on you: stand on the gold ring with the other red circle. The soakers come to you (' + Math.ceil(left) + ' s).';
      const v = st ? Math.max(0, ...bt.tg.map((id) => st.v[id] || 0)) : 100; return t < bt.land ? 'Your soak: Serpent\'s Bite ' + (bt.i + 1) + ' lands in ' + Math.ceil(bt.land - t) + ' s. Be on the gold ring.' : 'Soak: stand on the stacked red circles (' + Math.round(v) + '% left). Press Q just before they drain.'; }
    for (let i = 0; i < 3; i++) if (t >= T.prey[i] && t < S.hit[i]) return qm === S.Qs[i] ? 'Circling Prey: move one quarter left (counter-clockwise) now, off her quarter (' + Math.ceil(S.hit[i] - t) + ' s).' + (i === 1 && !G.p3.used[me + 'g2'] ? (t < T.gate2w ? ' Let her waves pass, then the gateway (gold) takes you there.' : ' The gateway (gold) takes you there.') : '') : qm === S.Qs[i + 1] ? 'Off her quarter: good. Stack with the raid here.' + (i ? ' Press Q (defensive) as it lands.' : '') : 'Get onto the next quarter to the left (counter-clockwise), where the raid is going.';
    const fb = S.wretch.fb.find((q) => t >= q.t0 - 2.5 && t <= q.at); if (fb && G.p3.wr) return 'Fester Burst in ' + Math.max(0, fb.at - t).toFixed(1) + ' s: into the Wretch\'s bubble (10 yards).';
    const ek = S.echoes.find((e) => j.kick === e.k && t >= e.t0 - 5 && t <= e.t1 && !G.p3.kick[e.sh]); if (ek) return t < ek.t0 ? 'Your kick: Shrieker ' + ek.k + '\'s Vicious Echoes in ' + Math.ceil(ek.t0 - t) + ' s. Press E as it glows pink ("Vicious Echoes: kick!").' : 'Kick Vicious Echoes now! (E)';
    const wv = S.waves.find((w) => (w.kind === 'her3' || w.kind === 'tail') && t >= w.t0 - (w.warn || 1) && t <= w.t0 + 3); if (wv) return wv.kind === 'her3' ? 'Her waves: step sideways into a gap (the dark lanes).' : 'Small tails\' rings from behind: stand in a gap.';
    const wrN = S.wrath.find((q) => t >= q.t0 && t <= q.at + 3.2 && q.tank !== me); if (wrN && pgDist([G.x, G.y], wrN.p) < 6.5) return 'Mother\'s Wrath: step out of her reach (the red circle in front of her).';
    const dh = A.dpsHint && A.dpsHint(); if (dh) return dh;
    if (qm !== S.Qs[n] && qm >= 0) return 'Get onto her quarter (the ' + P.QN[S.Qs[n]] + ') and stack with the raid.';
    if (t >= T.heart) return 'The heart is open: burn it.';
    const nx = S.timers.find((q) => q.t > t); return nx ? 'Stack with the raid. Next: ' + nx.name + ' in ' + Math.ceil(nx.t - t) + ' s.' : ''; };
  const upNext = (t) => { sync(); const me = A.me, j = S.job[me], L0 = [], add = (at, text, c) => { if (at > t && at - t <= 30) L0.push({ at, text, c }); };
    S.bites.forEach((b) => { if (b.so.includes(me)) add(b.land, 'Your soak: bite ' + (b.i + 1), '#ff5a6a'); else if (b.tg.includes(me)) add(b.land, 'Your red circle', '#ff5a6a'); else add(b.land, 'Serpent\'s Bite', '#ff8f87'); });
    T.prey.forEach((p0, i) => { add(p0, 'Circling Prey: move left', '#ff4a4a'); if (i) add(S.hit[i] - 1, 'Circling Prey lands: Q', '#7fb8ff'); }); S.wretch.fb.forEach((q) => add(q.t0, 'Fester Burst', '#d8f22f')); S.wrath.forEach((q) => { if (q.tank !== me) add(q.at, 'Mother\'s Wrath: out of her reach', '#ff4a4a'); });
    T.waves.forEach((w0) => add(w0 + T.wavesCast, 'Her waves', '#9be13a')); S.echoes.forEach((e) => { if (j.kick === e.k) add(e.t0, 'Your kick: Shrieker ' + e.k, '#ff9fb2'); }); add(T.heart, 'Heart open', '#ff8a5a');
    return L0.sort((a, b) => a.at - b.at).slice(0, 3); };
  const acts = () => '<div class="pg-act" data-a="kick"><b>E</b><span>Kick</span><i></i></div>';
  const hud = (t) => { const el = A.$('.pg-act[data-a="kick"]'); if (!el || !G.p3) return; const left = 15 - (t - G.p3.kickCd); el.querySelector('i').style.height = !range(A.me) ? '100%' : left > 0 ? (left / 15 * 100).toFixed(1) + '%' : '0'; el.title = range(A.me) ? 'Kick (E): ' + range(A.me) + ' yards' : 'Healers have no kick in Midnight';
    const due = range(A.me) && kickables(t).some((k) => k.who === A.me); el.style.borderColor = due ? '#ffd0dc' : ''; el.style.boxShadow = due ? '0 0 0 2px #ff9fb2, 0 0 16px rgba(255,159,178,.75)' : ''; };

  // ---- the start card: your role, your bite soak, the bite on you, your Shrieker kick ----
  const ui = { tab: 'bite' };
  const seg = (k, opts, cur, dis) => '<div class="pg-seg pg-jseg">' + opts.map(([v, t]) => '<button type="button" data-' + k + '="' + v + '" aria-pressed="' + (String(v) === String(cur)) + '"' + (String(v) === String(cur) ? ' class="on"' : '') + (dis ? ' disabled' : '') + '>' + esc(t) + '</button>').join('') + '</div>';
  // (the four quarters in the order she breaks them, from the floor itself: her quarter first, then counter-clockwise)
  const roomSvg = () => { const M = pgP3Mask(), C = ['#7f6a3a', '#3f5f7f', '#4d6b3f', '#6a4a6a'], rects = [];
    for (let j = 0; j < M.N; j++) for (let i = 0; i < M.N; i++) { const k = M.q[j * M.N + i]; if (k >= 0) rects.push('<rect x="' + (i + M.X0 - 0.5) + '" y="' + (-(j + M.X0) - 0.5) + '" width="1.05" height="1.05" fill="' + C[k] + '"/>'); }
    const lab = (p, t, c) => '<text x="' + p[0] + '" y="' + (-p[1]) + '" fill="' + (c || '#fff') + '" font-size="5" font-weight="800" text-anchor="middle" paint-order="stroke" stroke="#05070a" stroke-width="1.4">' + esc(t) + '</text>';
    const arr = [[22, 30, -22, 30], [-32, 20, -32, -20], [-22, -32, 22, -32], [32, -20, 32, 20]].map(([a, b, c, d]) => '<path d="M' + a + ' ' + (-b) + ' Q ' + ((a + c) / 2 * 1.35) + ' ' + (-(b + d) / 2 * 1.35) + ' ' + c + ' ' + (-d) + '" fill="none" stroke="#ffd23b" stroke-width="1.1" marker-end="url(#pg3a)"/>').join('');
    return '<svg viewBox="-46 -46 92 92" style="max-height:260px;width:auto;margin:0 auto;display:block" role="img" aria-label="The four quarters, broken one by one counter-clockwise"><defs><marker id="pg3a" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L6 3L0 6Z" fill="#ffd23b"/></marker></defs>' +
      '<rect x="-46" y="-46" width="92" height="92" fill="#0b1a0c"/>' + rects.join('') + arr + lab([20, 16], '1') + lab([-20, 16], '2') + lab([-20, -20], '3') + lab([20, -20], '4') + lab([0, 42], 'She breaks her quarter, then moves left', '#ffd23b') + '</svg>'; };
  const card = () => { const e = eff(), heal = pk.role === 'h', tab = ui.tab; let body;
    if (tab === 'bite') body = '<div class="pg-p2kick"><p><b>Serpent\'s Bite.</b> Two red circles at 6:42, 7:46 and 9:30. They stack on one spot, and three soakers stand in both until they drain. Which set do you soak?</p>' +
      seg('p3s', [[0, 'None'], [1, '1st · 6:42'], [2, '2nd · 7:46'], [3, '3rd · 9:30']], pk.soak) +
      '<p><b>A red circle on you?</b> Since Nov 6 it goes to one melee and one ranged each time.</p>' + seg('p3b', [['random', 'Random'], ['yes', 'Yes, once'], ['no', 'Never']], e.bite, heal) +
      '<p>' + (heal ? 'Healers don\'t get a red circle since the Nov 6 hotfix.' : ({ random: 'Like the real fight: you may get one.', yes: 'You get one red circle, in a set you don\'t soak: walk it to the gold ring.', no: 'The bots get them.' })[e.bite]) + '</p></div>';
    else if (tab === 'kick') body = '<div class="pg-p2kick"><p><b>Vicious Echoes.</b> Two Blightscale Shriekers come at 8:30. Each casts Vicious Echoes at 8:47: unkicked, it stuns the whole raid. Which one do you kick?</p>' + seg('p3k', [[0, 'None'], [1, 'Shrieker 1'], [2, 'Shrieker 2']], e.kick, heal) +
      '<p>' + (heal ? 'Healers have no kick in Midnight (only a Restoration Shaman).' : 'Press E while it glows pink (its label says "Vicious Echoes: kick!"): melee within 8 yards, ranged within 30.') + '</p></div>';
    else body = '<div class="pg-p3room">' + roomSvg() + '<p>The platform is in four quarters. The whole raid stacks on her quarter. At each Circling Prey (7:12, 8:03, 9:04) she breaks it: everyone moves one quarter left first.</p></div>';
    return '<div class="pg-optrow pg-jrole"><span>Role</span>' + seg('p3r', [['m', 'Melee'], ['r', 'Ranged'], ['h', 'Healer']], pk.role) + '</div>' +
      '<div class="pg-jtabs">' + seg('p3tab', [['bite', 'Bite'], ['kick', 'Kick'], ['room', 'The quarters']], tab) + '</div>' + body; };
  const bind = (box, refresh) => { box.onclick = (e) => { const b = e.target.closest('[data-p3r],[data-p3tab],[data-p3s],[data-p3b],[data-p3k]'); if (!b || b.disabled) return; const d0 = b.dataset;
      if (d0.p3r) pk.role = d0.p3r; if (d0.p3tab) ui.tab = d0.p3tab; if (d0.p3s != null) pk.soak = +d0.p3s; if (d0.p3b) pk.bite = d0.p3b; if (d0.p3k != null) pk.kick = +d0.p3k;
      const fk = ['p3r', 'p3tab', 'p3s', 'p3b', 'p3k'].find((k) => d0[k] != null), sel = fk ? '[data-' + fk + '="' + d0[fk] + '"]' : null, refocus = e.detail === 0;
      save(); box.innerHTML = card(); refresh(); if (refocus && sel) { const nb = box.querySelector(sel); if (nb && nb.focus) nb.focus(); } }; };
  const role = () => { const e = eff(), id = slotOf(e); return { id, name: RN[e.role], job: (e.soak ? 'Soak bite ' + e.soak : 'No soak') + (e.kick ? ' · Kick Shrieker ' + e.kick : '') }; };
  const asg = () => { const e = eff(), L0 = [];
    L0.push(['Onto her quarter (6:12)', 'The platform has shattered. She rises on one of the four quarters: take the gateway (the gold ring) or walk there, and stack with the raid.']);
    L0.push(['Slithering Clutches (6:22, 6:52, 8:30)', 'One lands on each quarter. The two Death Knights grip them onto the raid: hit them down before they hatch.']);
    L0.push(['Serpent\'s Bite (6:42, 7:46, 9:30)', (pk.soak ? 'You soak the ' + ORD[pk.soak] + ' set: stand on the two stacked red circles (the gold ring) until they drain, press Q just before, then walk to the edge, 5 yards from everyone, before your Volatile Purge bursts 5 s later.' : 'Not your soak: keep out of the red circles.') + (e.bite !== 'no' ? ' A red circle on you: walk to the gold ring, onto the other one.' : '')]);
    L0.push(['Her waves (7:02, 7:57, 8:47, 9:31)', 'A wall the whole room wide rolls out from her: step sideways into a gap. Two small tails behind the raid send rings a moment later.']);
    L0.push(['Circling Prey (7:12, 8:03, 9:04)', 'She breaks her quarter. Move one quarter left (counter-clockwise) before it lands. At the 2nd, a gateway takes you across.']);
    L0.push(['The Wretch (7:09, bubbles 7:45 and 8:17)', 'It lands on the far quarter; the tanks bring it to the raid. Get inside its bubble (10 yards) for each Fester Burst.']);
    L0.push(['The Shriekers (8:30)', 'Two hatch in the venom. ' + (e.kick ? 'Kick Shrieker ' + e.kick + '\'s Vicious Echoes (8:47) with E.' : 'Their kickers stop Vicious Echoes at 8:47.') + ' Kill them fast.']);
    L0.push(['The last burn (9:37)', 'Rage of the Shackled: the heart opens at 9:43, by her corner. Burn it: she dies at about 9:51.']);
    return '<ul class="pg-asg">' + L0.map(([a, b]) => '<li><b>' + esc(a) + '</b><span>' + esc(b) + '</span></li>').join('') + '</ul>'; };
  // ---- the shared setup screen (practice.js, Nov 15, Flex via Main: "still too complex and confusing"): a role, then one job in plain words, as
  // phase 2's. The soak sets are the guide's plan's (the 1st a ranged's, the 2nd a melee's, the 3rd a healer's); a kick is a melee's or a ranged's;
  // the red circle comes at random, like the real fight (one melee and one ranged DPS each set since Nov 6) ----
  // (every melee and ranged pick but "no kick" has a Shrieker kick, Flex, Nov 15: "there should be at least one spot where the player is asked to interupt")
  const SJ = { m: [['k1', 'Kick a Shrieker'], ['s2', 'Soak the 2nd bite, and kick'], ['none', 'Stack and hit, no kick']], r: [['k2', 'Kick a Shrieker'], ['s1', 'Soak the 1st bite, and kick'], ['none', 'Stack and hit, no kick']], h: [['s3', 'Soak the 3rd bite'], ['none', 'Heal, no soak']] };
  const jobNow = (j) => (j.soak ? 's' + j.soak : j.kick ? 'k' + j.kick : 'none');
  const setupCard = { roles: ['m', 'r', 'h'],
    now: () => { const e = eff(), r = e.role, v = jobNow(e); return { role: r, job: SJ[r].some((x) => x[0] === v) ? v : SJ[r][0][0] }; },
    jobs: (r) => (SJ[r] || []).map((x) => x.slice()),
    set: (r, v) => { if (!SJ[r]) return; if (!SJ[r].some((x) => x[0] === v)) v = SJ[r][0][0]; pk = { role: r, soak: v[0] === 's' ? +v[1] : 0, kick: v[0] === 'k' ? +v[1] : v[0] === 's' && r !== 'h' ? (r === 'm' ? 1 : 2) : 0, bite: 'random' }; save(); },
    say: () => { const v = setupCard.now().job, e = eff(), n = +v.slice(1), circle = e.role === 'h' ? '' : ' A red circle may land on you: walk it to the gold ring.';
      return (v[0] === 's' ? 'You soak the ' + ORD[n] + ' Serpent\'s Bite (' + ['', '6:42', '7:46', '9:30'][n] + '): stand on the stacked red circles, press Q as they drain, then spread to the edge.' + (e.kick ? ' Then kick Shrieker ' + e.kick + '\'s Vicious Echoes at 8:47 with E.' : '')
        : v[0] === 'k' ? 'You stack with the raid on her quarter and kick Shrieker ' + n + '\'s Vicious Echoes at 8:47 with E.'
        : e.role === 'h' ? 'You stack with the raid on her quarter, keep out of the red circles and move a quarter left at each Circling Prey.' : 'You stack with the raid on her quarter, hit what\'s up, and move a quarter left at each Circling Prey.') + circle; } };
  // (the start card's "Your job in short": four plain lines)
  const short = () => { const e = eff(), L0 = [];
    L0.push('Get onto her quarter (gateway or walk) and stack with the raid. At each Circling Prey (7:12, 8:03, 9:04) move one quarter left first.');
    L0.push((pk.soak ? 'Soak the ' + ORD[pk.soak] + ' Serpent\'s Bite (' + ['', '6:42', '7:46', '9:30'][pk.soak] + '): stand on the red circles, press Q as they drain, then spread to the edge.' : 'No soak: keep out of the red circles.') + (e.bite === 'yes' ? ' One red circle will land on you: walk it to the gold ring.' : e.bite === 'random' ? ' One may land on you: walk it to the gold ring.' : '')); /* (the red circle in both cases, soaker or not: the review, Nov 15) */
    L0.push((e.kick ? 'Kick Shrieker ' + e.kick + '\'s Vicious Echoes at 8:47 (E). ' : '') + 'Hit the clutches, the Wretch and the Shriekers when they\'re up (Tab, then keep pressing 1).');
    L0.push('Step into a gap in her waves. Into the Wretch\'s bubble at 7:45 and 8:17. Burn the heart at 9:43.');
    return '<ul class="pg-short">' + L0.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'; };
  // ---- hitting the right thing: the clutches once they're on the raid (and their Rawlings), the Wretch while it's awake, the Shriekers once they're
  // with the raid, the heart; most urgent first: a Viper, the Shriekers, the clutches, the heart, the Wretch ----
  const tgts = (t) => { sync(); const L0 = []; if (!G || !G.p3) return L0;
    G.adds.forEach((a) => { if (a.kind !== 'viper') return; a.id = a.id || 'a' + (G.addN = (G.addN || 0) + 1); L0.push({ key: a.id, kind: 'viper', name: 'Blightscale Viper', p: [a.x, a.y], r: 1.6 }); });
    S.clutches.forEach((c) => { const st = G.p3.cl[c.id]; if (st && st.on && t >= c.land) L0.push({ key: c.id, kind: 'clutch', name: 'Slithering Clutch', p: [st.x, st.y], r: 1.3, hp: st.hp, max: P.CLUTCH.hp }); });
    G.adds.forEach((a) => { if (a.kind !== 'rawling') return; a.id = a.id || 'a' + (G.addN = (G.addN || 0) + 1); L0.push({ key: a.id, kind: 'rawling', name: 'Blightscale Rawling', p: [a.x, a.y], r: 1.1, hp: a.hp == null ? 3 : a.hp, max: 3 }); });
    if (G.p3.wr && t >= S.wretch.wake) L0.push({ key: 'w3', kind: 'wretch', name: 'Blightscale Wretch', p: [G.p3.wr.x, G.p3.wr.y], r: 2.2, hp: G.p3.wrHp, max: P.WRETCH.hp });
    Object.entries(G.p3.sh).forEach(([k, s]) => L0.push({ key: k, kind: 'shrieker', name: 'Blightscale Shrieker', p: [s.x, s.y], r: 2, hp: s.hp, max: P.SHRIEK.hp }));
    if (t >= T.heart && t < T.end) L0.push({ key: 'heart', kind: 'heart', name: 'Venomous Heart', p: S.heart.slice(), r: 4.5 }); /* (her heart is big: the melee hit it from the stone's edge) */
    return L0; };
  // (while your own job has you elsewhere (your red circle or your soak, your Purge, the walk off her quarter, the gateway), there's no damage
  // moment for you: training wheels, so a soaker isn't told they missed the Wretch)
  const busy = (t) => { const me = A.me; if (myBite(t) || G.p3.purge.some((q) => q.who.includes(me) && t < q.burst + 2)) return true; const qm = kq(G.x, G.y);
    if (T.prey.some((p0, i) => t >= p0 - 2 && t < S.hit[i] + 1.5)) return true; const g1 = S.gates.find((g) => g.k === 1); return !!(g1 && t < T.gateEnd + 4 && qm !== S.Qs[0]); }; /* (and everyone, while the raid changes quarters) */
  const dpsCat = (t) => { sync(); if (!G || !G.p3) return null; if (G.adds.some((a) => a.kind === 'viper')) return 'viper'; if (busy(t)) return null; const c = FR(P.mel, raidStep(t));
    if (Object.values(G.p3.sh).some((s) => pgDist([s.x, s.y], c) < 25)) return 'shrieker'; if (S.clutches.some((q) => G.p3.cl[q.id] && G.p3.cl[q.id].on && t >= q.grasp)) return 'clutch'; if (G.adds.some((a) => a.kind === 'rawling')) return 'rawling';
    if (t >= T.heart && t < T.end) return 'heart'; return G.p3.wr && t >= S.wretch.wake + 6 ? 'wretch' : null; };
  const dpsNames = (DL) => { const k = new Set(DL.map((m) => m.kind)); return ['clutch', 'rawling', 'wretch', 'shrieker', 'heart', 'viper'].filter((x) => k.has(x)).map((x) => ({ clutch: 'the clutches', rawling: 'the Rawlings', wretch: 'the Wretch', shrieker: 'the Shriekers', heart: 'the heart', viper: 'the Vipers' })[x]).join(', '); };
  const starts = [[0, '6:12 · Onto her quarter'], [392, '6:32 · The first bite'], [418, '6:58 · Waves, then Circling Prey'], [455, '7:35 · The Wretch\'s bubble and the second bite'], [476, '7:56 · The second Circling Prey'], [503, '8:23 · The Shriekers'], [540, '9:00 · The last quarter and the burn']];

  // ---- the minimap: the four quarters, as long as they stand ----
  const mini = (mx, Wm, Hm, t) => { sync(); const sc = Wm / 100, M = (x, y) => [Wm / 2 + x * sc, Hm / 2 - y * sc], dot = (x, y, r, c, st) => { const [a, b] = M(x, y); mx.beginPath(); mx.arc(a, b, r, 0, Math.PI * 2); if (c) { mx.fillStyle = c; mx.fill(); } if (st) { mx.strokeStyle = st; mx.lineWidth = 1.2; mx.stroke(); } };
    mx.clearRect(0, 0, Wm, Hm); mx.fillStyle = 'rgba(8,14,9,.85)'; mx.fillRect(0, 0, Wm, Hm); const MK = pgP3Mask(), al = alive(t);
    for (let j = 0; j < MK.N; j += 2) for (let i = 0; i < MK.N; i++) { const k = MK.q[j * MK.N + i]; if (k < 0 || !al[k]) continue; const p = M(i + MK.X0 - 0.5, j + MK.X0 + 1.5); mx.fillStyle = k === S.Qs[raidStep(t)] ? 'rgba(170,150,110,.5)' : 'rgba(120,140,110,.32)'; mx.fillRect(p[0], p[1], sc + 0.5, 2 * sc + 0.5); }
    S.gates.forEach((g) => { if (t >= (g.shown || g.t0) && t <= g.t1) { dot(g.p[0], g.p[1], 2.6, t < g.t0 ? '#c084ff' : '#f3c969'); dot(g.to[0], g.to[1], 2, '#c084ff'); } });
    S.bites.forEach((b) => { const st = G.p3.bite[b.i]; if (!st || st.done) return; b.tg.forEach((id) => { const p = pos(id); dot(p[0], p[1], P.BITE * sc, 'rgba(255,74,74,.28)', '#ff4a4a'); }); });
    S.clutches.forEach((c) => { const st = G.p3.cl[c.id]; if (st) dot(st.x, st.y, 1.6, '#8f9a5a'); });
    if (G.p3.wr) dot(G.p3.wr.x, G.p3.wr.y, 2.4, '#c89bff'); Object.values(G.p3.sh).forEach((s) => dot(s.x, s.y, 2.4, '#ff9fb2'));
    const B = bossAt(t); if (B.up) dot(B.p[0], B.p[1], 3.4, '#2f6a22', '#b6f23a');
    GDZ_RAID.forEach((id) => { if (id !== A.me) dot(G.bots[id].x, G.bots[id].y, 1.4, GDZ_ROLE[id[0]][1]); }); dot(G.x, G.y, 2.6, '#fff', '#000');
    if (A.v3) { const f = A.v3.fwd(), [a, b] = M(G.x, G.y); mx.beginPath(); mx.moveTo(a, b); mx.lineTo(a + f[0] * 12, b - f[1] * 12); mx.strokeStyle = '#f3c969'; mx.lineWidth = 2; mx.stroke(); } };
  // ---- 3D only: the 2D canvas says so while 3D loads, or if it can't ----
  const draw2d = (cx, cv) => { const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), Wd = Math.max(1, Math.round(r.width * dpr)), Hd = Math.max(1, Math.round(r.height * dpr)); if (cv.width !== Wd || cv.height !== Hd) { cv.width = Wd; cv.height = Hd; }
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#07090c'; cx.fillRect(0, 0, cv.width, cv.height); cx.textAlign = 'center'; cx.fillStyle = '#e8edf2'; cx.font = '800 ' + Math.round(22 * dpr) + 'px system-ui, sans-serif';
    cx.fillText(A.busy ? 'Loading 3D…' : 'Phase 3 plays in 3D', cv.width / 2, cv.height / 2 - 14 * dpr); cx.fillStyle = '#aab4c0'; cx.font = '600 ' + Math.round(15 * dpr) + 'px system-ui, sans-serif';
    cx.fillText(A.busy ? 'The broken quarters are on their way.' : 'Press 3D under the minimap. If this PC can\'t show 3D, try phase 1.', cv.width / 2, cv.height / 2 + 16 * dpr); };
  // (her: on the corner of her quarter; under the venom from the end of each Circling Prey until she comes up at the next corner)
  const bossAt = (t) => { sync(); if (!S || !S.Qs) return { p: PG_P3.her[0].slice(), up: true }; const n = step(t), up = !S.sink.some((s, i) => t >= s + 0.4 && t < S.upAt[i]); return { p: S.her(n), up: up && t >= T.up - 0.1 }; };

  // ---- the bots' audit (window.__pgDbg.audit) ----
  const auditStep = (t0, t, add) => { sync(); const cr = (at) => at > t0 && at <= t;
    GDZ_RAID.forEach((id) => { const p = pos(id);
      if (cr(T.clu[0] + 1) && kq(p[0], p[1]) !== S.Qs[0]) add('not on her quarter at 6:23', id, t);
      S.hit.forEach((h, i) => { if (cr(h) && (kq(p[0], p[1]) === S.Qs[i] || pgDist(p, S.her(i)) <= P.PREY)) add('on her quarter at Circling Prey ' + clk(h), id, t); });
      S.wretch.fb.forEach((q) => { if (cr(q.at) && G.p3.wr && pgDist(p, [G.p3.wr.x, G.p3.wr.y]) > P.FB) add('outside the bubble ' + clk(q.at), id, t); });
      G.p3.purge.forEach((q) => { if (cr(q.burst) && q.who.some((o) => o !== id && pgDist(pos(o), p) <= P.PURGE)) add('within 5 yards of a Purge ' + clk(q.burst), id, t); }); });
    G.p3.missed.splice(0).forEach(([id, what]) => add(what, id || '?', t)); };

  // ---- 3D: the shapes for this part (practice3d.js's pg3dShapes adds them to the list it draws) ----
  const shapes = (t, P3, h) => { sync(); if (!G || !G.p3) return; const me = A.me, al = alive(t);
    [0, 1, 2, 3].forEach((k) => { const n = S.Qs.indexOf(k), f = n >= 0 && n < 3 && t >= S.hit[n] ? Math.min(1, (t - S.hit[n]) / 3) : 0; P3({ k: 'qsink', q: k, f }); });
    S.gates.forEach((g) => { if (t >= (g.shown || g.t0) - 1 && t <= g.t1) { const used = G.p3.used[me + 'g' + g.k], soon = t < g.t0; P3({ k: 'gate', x: g.p[0], y: g.p[1], c: used || soon ? '#c084ff' : '#f3c969' }); P3({ k: 'gate', x: g.to[0], y: g.to[1], c: '#c084ff' }); h.ring(g.p[0], g.p[1], 2.4, '#f3c969', 1, 0.3, !used); h.label(g.p[0], g.p[1], 6, g.k === 1 ? 'Gateway: to her quarter' : soon ? 'Gateway: from ' + clk(g.t0) + ', once her waves pass' : 'Gateway: to the next quarter', '#f3c969', 13); } });
    // (Circling Prey: her quarter reddens through the cast, a 13-yard ring round her)
    T.prey.forEach((p0, i) => { if (t >= p0 && t <= S.hit[i] + 0.4) { const B = S.her(i), c = pgP3R([19, 19], S.Qs[i]); h.disc(c[0], c[1], 20, '#ff3b3b', 0.08 + 0.1 * Math.min(1, (t - p0) / T.preyCast)); h.ring(B[0], B[1], P.PREY, '#ff4a4a', 1, 0.4); h.label(c[0], c[1], 6, 'Circling Prey: off this quarter! · ' + Math.max(0, S.hit[i] - t).toFixed(1), '#ff8a8a', 15); }
      if (t >= S.sink[i] && t < S.sink[i] + 2.4) { const B = S.her(i); P3({ k: 'splash', x: B[0], y: B[1], p: (t - S.sink[i]) / 2.4, s: 1.5 }); } if (t >= S.upAt[i] && t < S.upAt[i] + 2.4) { const B = S.her(i + 1); P3({ k: 'splash', x: B[0], y: B[1], p: (t - S.upAt[i]) / 2.4, s: 2 }); } });
    // (the bites: each red circle on its target, the stack spot gold when it's yours, the stone where one ran out)
    S.bites.forEach((b) => { const st = G.p3.bite[b.i], yours = b.tg.includes(me) || b.so.includes(me);
      if (yours && t >= b.land - 3 && t < b.end && !(st && st.done)) { h.disc(b.stack[0], b.stack[1], 1.6, '#f3c969', 0.2); h.ring(b.stack[0], b.stack[1], 1.6, '#f3c969', 1, 0.3, true); h.label(b.stack[0], b.stack[1], 3.2, b.tg.includes(me) ? 'Stack here' : 'Soak here', '#f3c969', 14); }
      if (!st || st.done) return; b.tg.forEach((id) => { const p = pos(id), v = Math.max(0, st.v[id] || 0); h.disc(p[0], p[1], P.BITE, '#ff3b3b', 0.12); h.ring(p[0], p[1], P.BITE, '#ff4a4a', 1, 0.35); P3({ k: 'arc', x: p[0], y: p[1], r: P.BITE - 0.6, f: v / 100, c: '#ff8a8a', o: 0.9 }); h.label(p[0], p[1], 5.5, 'Serpent\'s Bite · ' + Math.round(v) + '%', '#ffb0b0', 13); }); });
    G.p3.purge.forEach((q) => q.who.forEach((id) => { if (t > q.burst + 0.3) return; const p = pos(id); h.ring(p[0], p[1], P.PURGE, '#ff8a3b', 0.9, 0.3, true); if (id === me) { const sp = q.spot[me]; if (sp) { h.disc(sp[0], sp[1], 1.3, '#f3c969', 0.18); h.ring(sp[0], sp[1], 1.3, '#f3c969', 1, 0.25, true); h.label(sp[0], sp[1], 3, 'Spread here', '#f3c969', 13); } h.label(p[0], p[1], 6, 'Volatile Purge · ' + Math.max(0, q.burst - t).toFixed(1), '#ffb46a', 14); } }));
    G.p3.stones.forEach((q) => { P3({ k: 'stone', x: q.x, y: q.y }); if (t - q.t0 < 6) h.grow(q.x, q.y, 4 + (t - q.t0) % 1 * 30, '#b8a88a', 0.5); h.label(q.x, q.y, 5, 'Calcified Corpse', '#d8c8a8', 13); });
    // (the clutches, the grips, Gorefiend's Grasp)
    S.clutches.forEach((c) => { const st = G.p3.cl[c.id]; if (!st) return; P3({ k: 'clutch', x: st.x, y: st.y, ph: c.land }); const left = Math.max(0, 1 - (t - c.land) / P.CLUTCH.gest); /* (its Slithering Gestation running out: a ring that empties, red at the end) */
      P3({ k: 'arc', x: st.x, y: st.y, r: 2, f: left, c: left < 0.3 ? '#ff5a4f' : '#9bd94a', o: 0.95 }); if (st.on && left < 0.4) h.label(st.x, st.y, 3.4, 'Break it: ' + Math.ceil(left * P.CLUTCH.gest) + ' s', '#ff8f87', 13); });
    G.p3.grips.forEach((g) => { const d = pos(g.by); if (g.grasp) { h.grow(g.grasp[0], g.grasp[1], 8 * (1 - (t - g.t0) / 0.7), '#c0394f', 0.8); return; } P3({ k: 'grip', x0: d[0], y0: d[1], x1: g.to[0], y1: g.to[1] }); });
    if (S.clutches.some((c) => t >= c.land && t < c.land + 3) && G.p3.cl) { const c0 = S.clutches.find((c) => t >= c.land && t < c.land + 3), cc = FR(P.grasp, c0.n); h.label(cc[0], cc[1], 7, 'Death Knights: grip!', '#ff8a9a', 13); }
    // (the Wretch's bubble)
    if (G.p3.wr) { const w = G.p3.wr, up = t >= S.wretch.wake; P3({ k: 'wretch', id: 'w3', x: w.x, y: w.y, awake: up }); const fb = S.wretch.fb.find((q) => t >= q.t0 && t <= q.at + 0.4);
      if (fb) { const f = Math.min(1, (t - fb.t0) / (fb.at - fb.t0)); P3({ k: 'dome', x: w.x, y: w.y, r: P.FB, c: '#d8f22f', o: 0.14 + 0.16 * f, f }); h.ring(w.x, w.y, P.FB, '#d8f22f', 1, 0.4); h.grow(w.x, w.y, P.FB * (1 - f), '#d8f22f', 0.55); h.label(w.x, w.y, 5, 'Into the bubble · ' + Math.max(0, fb.at - t).toFixed(1), '#e8ff6a', 15); }
      else h.label(w.x, w.y, up ? 6 : 4.5, up ? 'Blightscale Wretch' : 'Wretch (asleep)', '#c89bff', 13); }
    // (the Shriekers, and Vicious Echoes)
    Object.entries(G.p3.sh).forEach(([k, s]) => { const e = S.echoes.find((q) => q.sh === k && t >= q.t0 && t <= q.t1 && !G.p3.kick[k]), mineK = S.job[me] && S.echoes.some((q) => q.sh === k && S.job[me].kick === q.k); P3({ k: 'shrieker', x: s.x, y: s.y });
      if (e) P3({ k: 'dome', x: s.x, y: s.y, r: 3.4, c: '#ff9fb2', o: 0.22 + 0.1 * Math.sin(t * 12) }); h.label(s.x, s.y, 6.5, e ? 'Vicious Echoes: kick!' : 'Shrieker ' + k.slice(2) + (mineK ? ' · yours' : ''), e ? '#ffd0dc' : '#ff9fb2', e ? 15 : 13);
      const gone = S.echoes.find((q) => q.sh === k && G.p3.kick[k] === 'none' && t >= q.t1 && t <= q.t1 + 0.8); if (gone) P3({ k: 'shock', x: s.x, y: s.y, r: P.ECHO * Math.min(1, (t - gone.t1) / 0.8), c: '#ffd23b' }); });
    if (t >= T.heart && t < T.end + 0.5) { const hp = S.heart; h.disc(hp[0], hp[1], 4.5, '#5a0f22', 0.6); h.ring(hp[0], hp[1], 4.5, '#ff5a7a', 1, 0.3); P3({ k: 'heart', x: hp[0], y: hp[1] }); h.label(hp[0], hp[1], 6.5, 'Venomous Heart', '#ff9fb2', 14); }
    if (stunned(me, t)) h.label(G.x, G.y, 5.2, 'STUNNED', '#ffd23b', 15); void al; };

  // (your hits on this part's own targets: practice.js hitTgt calls P2.hit for anything that isn't one of its shared adds)
  const hit = (key) => { sync(); if (!G || !G.p3) return; const c = G.p3.cl[key]; if (c) { c.hp -= 1; return; } const s = G.p3.sh[key]; if (s) { s.hp -= P.SHRIEK.hit; return; } if (key === 'w3' && G.p3.wr) G.p3.wrHp -= P.WRETCH.hit; };

  return { part: 3, dodges: true, autoAoe: true, walk, hit,
    script: (o) => pgP3Script({ ...(o || {}), me: A.me, pick: mine() ? eff() : null }), init, home, job, slow, check, kick, bossHp, onPlat: (x, y) => { sync(); return pgP3Floor(x, y, S && G && G.p3 ? alive(G.t) : [1, 1, 1, 1], 0.35); }, bossAt, tailAt: () => ({ p: [0, 0], up: false }),
    jobText, upNext, acts, hud, card, bind, role, asg, short, setup: setupCard, starts, tgts, dpsCat, dpsNames, mini, draw2d, auditStep, shapes, ff: () => { sync(); if (G && G.p3) { G.wipes = 0; G.p3.kickCd = -99; G.p3.stun = {}; G.p3.missed = []; G.p3.once = new Set([...G.p3.once].filter((k) => !/^(extra|pw|late1)/.test(k))); } },
    clean: 'Onto her quarter in time, every bite cleared and spread, out of every wave and off every quarter before it broke. Try another job.',
    get pick() { return pk; }, set pick(j) { if (jobOk(j)) pk = j; }, slotOf, mine, get T() { return T; }, alive: (t) => { sync(); return alive(t); }, raidStep: (t) => { sync(); return raidStep(t); } };
}
// (the part on the start card's Part switch, after phase 2; `?practice=3` on the guide opens it)
PG_PARTS["Ula'tek"].m3 = { name: 'Phase 3', d: 'm', end: PG_P3_T.end, roles: [{ id: 'r1', name: 'Ranged', job: 'Soak bite 1' }], mod: pgP3 };

// ---- 3D (practice3d.js calls pg3dP3(K) once when the 3D view opens for a phase 3 game; K is its kit: three.js, the scene, keep, pool, flat, fxMat,
// glw, the shared shapes, and the whole platform it built (plat), which phase 3 hides for the four broken quarters). put(shape, t) draws this part's
// own shapes (pgP3's shapes()): the quarters sinking as she breaks them, the gateways, the clutches, the grips, the Shriekers, the stone, the shock ----
function pg3dP3(K) {
  const T = K.T, scene = K.scene, keep = K.keep, M = pgP3Mask();
  if (K.plat) K.plat.visible = false; const rimO = scene.getObjectByName('pg-rim'); if (rimO) rimO.visible = false;
  const topM = K.plat && Array.isArray(K.plat.material) ? K.plat.material[0] : keep(new T.MeshStandardMaterial({ color: 0x6a7076, roughness: 0.9 })), wallM = keep(new T.MeshLambertMaterial({ color: 0x3b4146 }));
  // (a mesh from the floor's own yard cells: the tops of each row's runs, and a wall on every edge where the next cell isn't the same piece. Whole
  // cells, so no slit between rows (the review, Nov 15: strips joined row to row left half-yard gaps); h is the top's height, walls go 4 yards down)
  const cells = (has, h, wallsToo) => { const Pn = [], Nn = [], U = [], I = [], W = [];
    const quad = (a, b, c, d, n, wall) => { const v = Pn.length / 3; [a, b, c, d].forEach((q) => { Pn.push(q[0], q[1], -q[2]); Nn.push(n[0], n[1], -n[2]); U.push(q[0], q[2]); }); (wall ? W : I).push(v, v + 1, v + 2, v, v + 2, v + 3); };
    const wall = (x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1; quad([x0, h, y0], [x0, h - 4, y0], [x1, h - 4, y1], [x1, h, y1], [dy / l, 0, -dx / l], true); };
    const on = (i, j) => i >= 0 && j >= 0 && i < M.N && j < M.N && has(j * M.N + i);
    for (let j = 0; j < M.N; j++) { const y = j + M.X0; let a = null; for (let i = 0; i <= M.N; i++) { const c = i < M.N && on(i, j); if (c && a == null) a = i; if (!c && a != null) { quad([a + M.X0 - 0.5, h, y - 0.5], [i - 1 + M.X0 + 0.5, h, y - 0.5], [i - 1 + M.X0 + 0.5, h, y + 0.5], [a + M.X0 - 0.5, h, y + 0.5], [0, 1, 0]); a = null; } }
      if (wallsToo) for (let i = 0; i < M.N; i++) { if (!on(i, j)) continue; const x = i + M.X0; if (!on(i - 1, j)) wall(x - 0.5, y + 0.5, x - 0.5, y - 0.5); if (!on(i + 1, j)) wall(x + 0.5, y - 0.5, x + 0.5, y + 0.5); if (!on(i, j - 1)) wall(x - 0.5, y - 0.5, x + 0.5, y - 0.5); if (!on(i, j + 1)) wall(x + 0.5, y + 0.5, x - 0.5, y + 0.5); } }
    const g = keep(new T.BufferGeometry()); g.setAttribute('position', new T.Float32BufferAttribute(Pn, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(Nn, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); g.setIndex(I.concat(W)); g.addGroup(0, I.length, 0); g.addGroup(I.length, W.length, 1); return g; };
  // the quarters, each its own mesh so each can sink into the venom when she breaks it
  const Q = [0, 1, 2, 3].map((k) => { const m = new T.Mesh(cells((c) => M.q[c] === k, 0, true), [topM, wallM]); m.receiveShadow = true; m.userData.f = 0; scene.add(m); return m; });
  // (the venom inside where the platform was: the water's shader brightens it near the old edge, which the platform used to cover; a plain dark sheet
  // just over the water covers the hole, the cracks and each quarter as it sinks (the review, Nov 15))
  { const WY = K.baseY(400, 400) + 0.45, OCT = [[36.5, 12.5], [15, 34], [-15, 34], [-36.5, 12.5], [-36.5, -12.5], [-15, -34], [15, -34], [36.5, -12.5]], sh = new T.Shape(); OCT.forEach((p, i) => (i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]))); sh.closePath();
    const g = keep(new T.ShapeGeometry(sh)); g.rotateX(-Math.PI / 2); const m = new T.Mesh(g, keep(new T.MeshStandardMaterial({ color: 0x174211, emissive: 0x0b1f07, roughness: 0.45, metalness: 0.1 }))); m.position.y = WY + 0.03; m.receiveShadow = true; scene.add(m); }
  // (a ford of shallow venom over each crack, so a raider wading across stands in venom, not on air; shown while both its quarters stand)
  const FORDM = keep(new T.MeshStandardMaterial({ color: 0x2c5c1d, emissive: 0x17400c, roughness: 0.35, metalness: 0.1 }));
  const CK = [0, 1, 2, 3].map((p) => { const m = new T.Mesh(cells((c) => M.ck[c] === p, -0.06, false), [FORDM, FORDM]); scene.add(m); return m; });
  const BALL = K.BALL, CONE = K.CONEG, glw = K.glw, stdM = (c, e, x) => keep(new T.MeshStandardMaterial(Object.assign({ color: c, emissive: e || 0, roughness: 0.5 }, x || {})));
  // (a Warlock's gateway: a fel-purple ring, a column of light, a slow swirl)
  const gate = K.pool(() => { const g = new T.Group(), rm = stdM(0x5a1d8c, 0x7a2ad8), r = new T.Mesh(keep(new T.TorusGeometry(2.3, 0.22, 10, 48)), rm), cm = K.fxMat(3, '#c084ff', true), c = new T.Mesh(K.WALLG, cm);
    r.rotation.x = Math.PI / 2; r.position.y = 0.25; c.scale.set(2.1, 7, 2.1); c.renderOrder = 650; g.add(r, c); g.userData = { rm, cm }; return g; });
  // (a Slithering Clutch: a knot of dark scaled eggs with a sickly glow, squirming)
  const CLM = stdM(0x2c3a1c, 0x1a2a08, { roughness: 0.4 }), CLG = stdM(0x9bd94a, 0x4a8a18);
  const clutch = K.pool(() => { const g = new T.Group(); for (let i = 0; i < 4; i++) { const m = new T.Mesh(BALL, i === 3 ? CLG : CLM); m.scale.set(0.8, 1, 0.8); m.position.set(Math.cos(i * 2.1) * 0.7, 0.8 + (i === 3 ? 0.7 : 0), Math.sin(i * 2.1) * 0.7); m.castShadow = true; g.add(m); } return g; });
  // (a Blightscale Shrieker: a big winged serpent-kin, pale pink crest)
  const SHM = stdM(0x4a2a3a, 0x1a0610, { roughness: 0.45 }), SHC = stdM(0xff9fb2, 0x7a2a3a);
  const shrieker = K.pool(() => { const g = new T.Group(), b = new T.Mesh(BALL, SHM), h = new T.Mesh(BALL, SHM); b.scale.set(1.6, 2.2, 1.4); b.position.y = 2.2; h.scale.set(1, 0.9, 1.3); h.position.set(0, 4.6, 0.6); b.castShadow = h.castShadow = true; g.add(b, h);
    [-1, 1].forEach((s) => { const w = new T.Mesh(CONE, SHC); w.scale.set(0.5, 2.6, 1.6); w.position.set(s * 1.9, 3.2, -0.4); w.rotation.z = -s * 1.1; g.add(w); }); return g; });
  // (a Calcified Corpse: a grey stone figure)
  const STM = stdM(0x8a8378, 0x111008, { roughness: 0.95 });
  const stone = K.pool(() => { const g = new T.Group(), b = new T.Mesh(BALL, STM), h = new T.Mesh(BALL, STM); b.scale.set(0.7, 1.2, 0.55); b.position.y = 1.2; h.scale.setScalar(0.42); h.position.y = 2.6; b.castShadow = h.castShadow = true; g.add(b, h); return g; });
  // (a grip: a dark red chain of light from the Death Knight to the clutch)
  const grip = K.pool(() => { const m = new T.Mesh(K.BEAMG, K.fxMat(1, '#c0394f', true)); m.renderOrder = 640; return m; });
  const V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3(), UP = new T.Vector3(0, 1, 0);
  const put = (s, t) => { const k = s.k;
    if (k === 'qsink') { const m = Q[s.q]; if (m) { m.position.y = -7 * s.f; m.visible = s.f < 1; m.userData.f = s.f; CK.forEach((c, p) => { c.visible = !Q[p].userData.f && !Q[(p + 1) % 4].userData.f; }); } return true; }
    if (k === 'gate') { const by = K.baseY(s.x, s.y), g = gate(), u = g.userData; g.position.set(s.x, by, -s.y); g.rotation.y = t * 0.8; K.col(u.rm, s.c); u.cm.uniforms.uO.value = 0.5 + 0.15 * Math.sin(t * 4); glw(s.x, by + 1.5, -s.y, 5, s.c, 0.5); return true; }
    if (k === 'clutch') { const g = clutch(), by = K.baseY(s.x, s.y); g.position.set(s.x, by, -s.y); g.rotation.y = t * 0.6 + (s.ph || 0); g.children.forEach((c, i) => { c.position.y = 0.8 + (i === 3 ? 0.7 : 0) + Math.sin(t * 5 + i) * 0.12; }); glw(s.x, by + 1, -s.y, 2.2, '#9bd94a', 0.3); return true; }
    if (k === 'shrieker') { const g = shrieker(), by = K.baseY(s.x, s.y); g.position.set(s.x, by, -s.y); g.rotation.y = Math.atan2(-s.x, s.y) + Math.sin(t) * 0.1; return true; }
    if (k === 'stone') { const g = stone(); g.position.set(s.x, K.baseY(s.x, s.y), -s.y); return true; }
    if (k === 'grip') { V1.set(s.x0, K.baseY(s.x0, s.y0) + 1.3, -s.y0); V2.set(s.x1, K.baseY(s.x1, s.y1) + 1, -s.y1); V3.subVectors(V2, V1); const len = V3.length(); if (len < 0.1) return true; const m = grip(), u = m.material.uniforms; m.position.copy(V1); m.quaternion.setFromUnitVectors(UP, V3.normalize()); m.scale.set(0.16, len, 0.16); K.ucol(u.uC, '#c0394f'); u.uLen.value = len * 1.2; u.uO.value = 0.9; return true; }
    if (k === 'shock') { if (s.r > 0.5) K.flat(K.URING, s.x, s.y, s.r, s.r, 0, s.c, 0.85 * (1 - s.r / 60), false); return true; }
    return false; };
  return { put, frame: () => {}, quarters: Q };
}
