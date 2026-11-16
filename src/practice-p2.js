// ===== Practice, phase 2: Children of the Doomscale (Nov 15; Flex: "can another chat start working on the next phase of the fight", then
// "only build the 3d version for now") =====
// Ula'tek Mythic phase 2 as the practice game's second part (src/practice.js), from 2:46 to 5:18 on the measured Mythic clock
// (notes/Guides/Bosses/8 Ula'tek.md, "After phase 1, measured", the same to a third of a second on 116 kills: Hatching Doom 2:54, Wardens up 2:55,
// their Malice 3:03, Grasping Fangs 3:16, Wardens dead about 3:37 to 3:40, Falling Debris about 3:50, 4:30 and 5:17, Weakened Doomscales up about
// 4:27, Anguished Cry about 4:35, 4:53 and 5:09, Rage of the Shackled 4:48, heart open 4:55) and the guide's plan (src/guides.js: the halves (UX_HALF),
// the side ledges, the gate's landing, the Warden, the small eggs' spots (UL_EGGS), the cauldron pit (UX_E)); the big eggs from 10 top Mythic kills' logs.
// Not measured, so picked from the guide and flagged where they're set: the gates and their times, the solo break at
// 3:26 and the five at 3:34 (measured since, Main on all 131 library Mythic kills and checked on the 30 fastest: the tethers land about 3:17, one breaks alone a median 8.3 s later, the five a median 16.7 s after the landing, 8 s apart; 40 of 131 break all six at once), the tether's 25 yards, the small eggs in together at 3:56 and the big eggs picked up at 4:09 (south) and 4:13.5 and 4:16 (north; inside what 10 top kills did: small eggs in 3:46 to 3:56, big eggs up 4:04 to 4:23),
// Desperate Thrash's 14-yard, 50-degree cone, the way back at 4:38.5, a Clutch hatching a Viper if it lives 20 s (the guide; no kill let one live that
// long), the raid's pace on the adds (set so the adds die when they do on the kills, a little later when you don't help).
// practice.js keeps the loop, the screen, the cards and the score; this file gives the part its script, room, bots, hits, start card, minimap and
// 3D pieces through pgP2(api) (practice.js calls it when a part has `mod`). Read into ui.js's scope right after practice.js (build.ps1,
// /*PRACTICE*/). 3D only (Flex): the 2D canvas says so; the minimap stays. tests/practice-p2.js plays it in Node on every build.
// (Nov 15, the adds and kicks pass (Flex: "if this skips any part of the fight that requires mechanical execution its not good enough", "i still dont
// see good interupt mechanics", "theres also add spawns being missed"): the 30 fastest Mythic kills in the log library, checked on all 130 and the 26
// phase 2 wipes. Each Warden stands up at 2:55, Shadow Molt +1.5 s (a 3 s cast), Writhing Gestation +5 s (3 s; its nearest small eggs, 2 east and 3
// west, turn into Blightscale Clutches 0.3 s after it ends), ONE Malice +8.6 s (the 2nd Warden's 1.0 s after the 1st; a 1.5 s bar and a 6 s channel,
// kicked on 260 of 260, tanks about half), Grasping Fangs, and it dies to the raid about +43.4 s (3:38). Still alive it starts over: Shadow Molt +46,
// Writhing Gestation +49.8, Malice +55.3. A Clutch dies in about 6.9 s and leaves a Blightscale Rawling on its spot; so does every small egg thrown
// into a cauldron, at the cauldron. Rawlings: 24 a pull, killed in about 21 s; Boiling Venom (+100%) at 25 s, Acidic Expulsion (a raid hit and a
// stacking 35 s damage over time) 35.5 s after it spawns, then every 12 s. Four south eggs come up about 3:55; picking up the south big egg beside
// them turns them into Clutches. A Weakened Doomscale climbs out 1.0 s after its big egg goes in: Anguished Cry +7.8 s and every 15.8 s (a 2.5 s
// bar, kicked at about 0.9 s), Desperate Thrash +16.6 s and every 18.3 s (3 s), dead about +43.9 s; when the first dies the rest get Revenge (+100%:
// Cry in 1.25 s, Thrash in 1.5 s, double hits). A big egg left until Hatching Doom ends hatches a Ravenous Doomscale whose Dread Roar, 6 to 9 s later
// (2.5 s), wipes the raid)
const PG_P2_T = { start: 166, gate: 167, doom: 174, doomEnd: 264, wardens: 175, molt: 176.6, gest: 180.1, clutch: 183.4, malice: 183.9, fangs: 196, solo: 206, five: 214, wdie: 218.3, shells: 219, set2: 235,
  throwAt: 236, back: 243, bigUp: 249.5, bigN: [253.5, 256], bigIn: 267, hold: 15, dsUp: 268, home: 278.5, rage: 288, heart: 294.5, heartEnd: 314.5, debris: [230, 270, 317], end: 318,
  rattle: [292.8, 305.5], spit: [203.4, 223.5, 243.6, 263.6],
  W2: { molt: 46, gest: 49.8, malice: 55.3 }, CRY: [7.8, 23.6, 39.4], THRASH: [16.6, 34.9], DSLIFE: 43.9, RBOIL: 25, RACID: 35.5, RACID2: 12, CHATCH: 20, ROAR: 6.5 };
const PG_P2 = {
  // the two halves (the guide's UX_HALF on the east ledge, the rest on the west)
  half: { E: ['t1', 'h1', 'h3', 'm1', 'm2', 'm3', 'r1', 'r3', 'r5', 'r7'], W: ['t2', 'h2', 'h4', 'm4', 'm5', 'm6', 'm7', 'r2', 'r4', 'r6'] },
  // the east ledge's spots, yards (the west ledge's: x mirrored). From the guide (UX_E): the gate's landing, where the Warden stands up, the pit
  // (the cauldron), the big eggs where 10 top Mythic kills picked them up: the south one ('far') at the ledge's south end, the north one ('close') past the small eggs (Flex, Nov 15). The rest are where the half stands; the Warden is tanked 13 yards from the eggs, clear of the ledge's inner notch.
  gateP: [24, -12], land: [100, 22], wSpawn: [94, 36], fight: [90, 47], pit: [108, 0], far: [56.5, -84.5], close: [56.5, 86.5], ranged: [96, 31], wait: [96, 9], swait: [76, -60], ds: [119, 6], dsKick: [106.5, 6], dsWait: [97, 6],
  // the default jobs per ledge: the small eggs' carriers in egg order (UL_EGGS: 8 east, 7 west), the big eggs (as the top kills do, below: a healer
  // the north one, a mobile melee the south one), the Warden's one Malice (its tank: tanks kicked 33 of the 60 on the 30 fastest kills, the plan's
  // kick line starts with the tank), and one kicker for each Doomscale's Anguished Cry
  // (Flex, Nov 15: "im fairly confident they [healers] are usually the ones assigned to pick up the big eggs". The 30 fastest Mythic kills in the log
  // library: the north big egg is a healer's on 45 of 46; the south one a melee's on 45 of 74 (Havoc DH and Windwalker most), ranged 15, healers 14;
  // healers carry 6% of the small eggs (27 of 450), tanks 13% (about one each a kill), ranged 52%, melee 29%. 'far' is the south egg, 'close' the north)
  eggs: { E: ['t1', 'm1', 'm2', 'm3', 'r1', 'r3', 'r5', 'r7'], W: ['t2', 'm4', 'm5', 'm6', 'r2', 'r4', 'r6'] },
  big: { E: { far: 'm3', close: 'h1' }, W: { far: 'm6', close: 'h2' } },
  mal: { E: ['t1'], W: ['t2'] }, cry: { E: ['m1', 'm2'], W: ['m4', 'm5'] },
  // the Blightscale Clutches' spots (where the Warden's Writhing Gestation turns its nearest small eggs, the same on every kill: 2 east, 3 west) and the
  // four south eggs that come up about 3:55 (2 a ledge), beside the south big eggs. Real yards, not mirrored (the two ledges differ)
  clutch: { E: [[94, 55], [90, 63]], W: [[-82, 56], [-80, 59], [-76, 60]] }, south: { E: [[69, -78], [67, -74]], W: [[-67, -75], [-63, -74]] },
  // sizes: the tether breaks past 25 yards (the guide's picture), Warden's Protection 3 (spell 1306858: on the kills it hits players standing a median
  // 2.6 yards from an egg, about 43k a hit, a minor tick), the cauldron takes an egg within 9 (my pick), kicks reach 8 yards for melee and 30 for
  // ranged, Anguished Cry stuns within 60 (spell 1305650), Desperate Thrash's cone (the guide's picture)
  TETHER: 25, WARD: 3, THROW: 9, KICK: { m: 8, t: 8, r: 30, h: 0 }, CRY: 60, FAN: { r: 14, half: 25 },
  // your share of the raid's damage on your ledge's adds as a damage dealer (training wheels: a quarter, so leaving them shows: a Warden you never hit
  // lives to its second Writhing Gestation and Malice), how many of your hits
  // kill a Rawling or a Clutch on their own, and the raid's pace on each ledge (Rawlings: oldest first, slower while the Warden or the Doomscales take
  // its damage; set so 7 or so boil a pull, as on the kills)
  SHARE: 0.25, RHITS: 6, CHITS: 8, RPACE: { warden: 0.11, eggs: 0.24, ds: 0.1 }, CPACE: 0.34,
};
// (the small eggs' fixed spots, the guide's UL_EGGS: 7 on the west ledge, 8 on the east)
const pgP2Eggs = () => (typeof UL_EGGS !== 'undefined' ? UL_EGGS : { L: [[-90.9, 57.5], [-74.9, 71.3], [-74.1, 66.8], [-69.7, 66.8], [-68.9, 71.4], [-68.3, 78.4], [-62.7, 71.8]], R: [[85.7, 59.6], [81.5, 63.7], [75, 71.5], [73.2, 66.6], [68.7, 67.5], [67.9, 73.9], [63.6, 80], [61.9, 72.1]] });
// ---- the room: the platform (practice.js's PG_UL.onPlat) and the two side ledges, read from the guide's floor (GDZ_FLOOR, yard by yard): the
// stone outside 45 yards, with every hole and notch up to about 6 yards filled (a closing on a yard grid), so a bot or you never catch on a crack ----
let PG_P2_MASK = null;
const pgP2Mask = () => { if (PG_P2_MASK) return PG_P2_MASK; const F = typeof GDZ_FLOOR !== 'undefined' && GDZ_FLOOR["Ula'tek"] ? GDZ_FLOOR["Ula'tek"].def : null, M = {};
  if (!F) { for (let y = -60; y <= 75; y++) M[y] = [[-150, -76], [76, 150]]; return (PG_P2_MASK = M); }
  const X0 = -170, Y0 = -96, W = 341, H = 193, g = new Uint8Array(W * H), R = 3, D = [];
  Object.keys(F).forEach((k) => { const y = +k; if (y < Y0 || y >= Y0 + H) return; F[k].forEach(([a, b]) => { for (let x = Math.max(X0, Math.ceil(a)); x <= Math.min(X0 + W - 1, Math.floor(b)); x++) if (Math.abs(x) > 45) g[(y - Y0) * W + (x - X0)] = 1; }); });
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) if (dx * dx + dy * dy <= R * R) D.push([dx, dy]);
  const morph = (src, grow) => { const out = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = grow ? 0 : 1; for (const [dx, dy] of D) { const xx = x + dx, yy = y + dy, q = xx >= 0 && xx < W && yy >= 0 && yy < H ? src[yy * W + xx] : 0; if (grow ? q : !q) { v = grow ? 1 : 0; break; } } out[y * W + x] = v; } return out; };
  const c = morph(morph(g, true), false);
  for (let y = 0; y < H; y++) { const out = []; let a = null; for (let x = 0; x <= W; x++) { const on = x < W && c[y * W + x] && Math.abs(x + X0) > 45; if (on && a == null) a = x; if (!on && a != null) { if (x - 1 - a >= 3) out.push([a + X0, x - 1 + X0]); a = null; } } M[y + Y0] = out; }
  return (PG_P2_MASK = M); };
const pgP2Ledge = (x, y, m) => { const M = pgP2Mask(), g = m == null ? 1.2 : m; return [-g, 0, g].every((dy) => (M[Math.round(y + dy)] || []).some(([a, b]) => x - g >= a && x + g <= b)); };
const pgP2Floor = (x, y) => PG_UL.onPlat(x, y) || pgP2Ledge(x, y, 0.8);
const pgP2L = (s, p) => (s === 'E' ? [p[0], p[1]] : [-p[0], p[1]]);
// (a point d yards from c at a heading in the east ledge's frame (0 east, 90 north), mirrored for the west ledge)
const pgP2Away = (c, d, deg, s) => { const a = (s === 'W' ? 180 - deg : deg) * Math.PI / 180; return [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d]; };

// ---- the jobs: who carries which egg, kicks which cast, and has a tether; your picked job swapped in (the card) ----
// (the plan's usual jobs, before the tethers: eggs, big eggs, Malice and Anguished Cry kicks)
function pgP2Base() { const P = PG_P2, J = {};
  ['E', 'W'].forEach((s) => P.half[s].forEach((id) => { J[id] = { side: s, egg: 0, big: null, mal: 0, cry: 0, teth: 0 }; }));
  ['E', 'W'].forEach((s) => { P.eggs[s].forEach((id, i) => { J[id].egg = i + 1; }); J[P.big[s].far].big = 'far'; J[P.big[s].close].big = 'close'; P.mal[s].forEach((id, i) => { J[id].mal = i + 1; }); P.cry[s].forEach((id, i) => { J[id].cry = i + 1; }); });
  return J; }
function pgP2Jobs(seed, me, pk) {
  const P = PG_P2, rnd = pgRng(((seed || 1) * 31 + 7) >>> 0), J = pgP2Base(), SIDES = ['E', 'W'];
  // Grasping Fangs: six tethers, three on each ledge, on anyone (tanks too: measured on 116 kills); one breaks alone (the guide: a mobile ranged),
  // then the other five together
  SIDES.forEach((s) => { const pool = P.half[s].slice(); for (let i = 0; i < 3; i++) J[pool.splice(Math.floor(rnd() * pool.length), 1)[0]].teth = 'five'; });
  const all = SIDES.flatMap((s) => P.half[s]); J[all.find((id) => J[id].teth && id[0] === 'r') || all.find((id) => J[id].teth)].teth = 'solo';
  // (Flex, Nov 15: "Make the player always get one of the grasping fangs, randomize if its the early break or 5 break": with a random tether you
  // always get one, the solo or one of the five on a coin flip, so both get practised)
  if (me && J[me] && pk) pgP2Give(J, me, pk.teth === 'random' ? { ...pk, teth: rnd() < 0.5 ? 'solo' : 'five' } : pk);
  // (the one Malice comes at 3:04, the tethers at 3:16: a kicker never has both at once, so nothing is handed on)
  return J;
}
// (your slot takes the picked jobs; whoever had them takes your slot's old ones, so every job is still done once and each ledge keeps three tethers)
function pgP2Give(J, me, pk) {
  const s = J[me].side, mates = PG_P2.half[s].filter((id) => id !== me), all = ['E', 'W'].flatMap((q) => PG_P2.half[q]).filter((id) => id !== me);
  const swap = (k, v) => { const o = mates.find((id) => J[id][k] === v); if (o) J[o][k] = J[me][k]; J[me][k] = v; };
  const give = (k, pref) => { if (!J[me][k]) return; const o = mates.find((id) => !J[id][k] && pref(id)) || mates.find((id) => !J[id][k] && id[0] !== 't') || mates.find((id) => !J[id][k]); if (o) J[o][k] = J[me][k]; J[me][k] = k === 'big' ? null : 0; };
  const kicker = (id) => id[0] === 'm' || id[0] === 'r', bigPref = () => { const w = J[me].big; return (id) => id[0] === (w === 'far' ? 'm' : 'h'); };
  if (pk.egg === 'far' || pk.egg === 'close') { swap('big', pk.egg); give('egg', (id) => id[0] !== 't'); }
  else if (pk.egg && /^n\d+$/.test(pk.egg)) { swap('egg', Math.min(+pk.egg.slice(1), PG_P2.eggs[s].length)); give('big', bigPref()); }
  else { give('egg', (id) => id[0] !== 't'); give('big', bigPref()); }
  if (me[0] === 'h' || !pk.mal) give('mal', (id) => id[0] === 't' || kicker(id)); else swap('mal', 1);
  if (me[0] === 'h' || !pk.cry) give('cry', kicker); else swap('cry', pk.cry);
  const newSolo = () => { const n = all.find((id) => J[id].teth === 'five' && id[0] === 'r') || all.find((id) => J[id].teth === 'five'); if (n) J[n].teth = 'solo'; };
  if (pk.teth === 'solo' && J[me].teth !== 'solo') { const old = all.find((id) => J[id].teth === 'solo');
    if (!J[me].teth) { const o = mates.includes(old) ? old : mates.find((id) => J[id].teth === 'five'); if (o) J[o].teth = 0; }
    if (old && J[old].teth === 'solo') J[old].teth = 'five'; J[me].teth = 'solo'; }
  else if (pk.teth === 'five' && J[me].teth !== 'five') {
    if (J[me].teth === 'solo') { J[me].teth = 'five'; newSolo(); }
    else { const o = mates.find((id) => J[id].teth === 'five') || mates.find((id) => J[id].teth === 'solo'); const v = o ? J[o].teth : 0; if (o) J[o].teth = 0; J[me].teth = 'five'; if (v === 'solo') newSolo(); } }
  else if (pk.teth === 'none' && J[me].teth) { const o = mates.find((id) => !J[id].teth && id[0] !== 't') || mates.find((id) => !J[id].teth); if (o) J[o].teth = J[me].teth; J[me].teth = 0; }
}

// ---- the fight, second by second ----
function pgP2Script(o) {
  const T = PG_P2_T, P = PG_P2, seed = o.seed || 1, rnd = pgRng(((seed * 131) + 17) >>> 0), side = pgRng((seed * 7919 + 13) >>> 0), L = pgP2L;
  // (where she came up after her dive in phase 1: the east or west edge, from the run's seed as in phase 1)
  const east = o.east != null ? !!o.east : side() < 0.5, sg = east ? 1 : -1, her = [46 * sg, 0], heart = [41.5 * sg, 0];
  const S = { part: 2, start: T.start, end: T.end, east, seed, her, heart, ROT: 0, SURF: -9, rotAt: () => 0, F: (p) => [p[0], p[1]], FT: (p) => [p[0], p[1]], herTank: () => 't1',
    casts: [], warns: [], timers: [], waves: [], impacts: [], soaks: [], bubbles: [], thrash: [], wrath: [], tails: [], beams: [], pulses: [], wretches: [], eggSets: [], wings: [], dive: { t0: -9, gone: -9, surf: -9, to: her } };
  const cast = (who, name, t0, t1, x) => { const c = { who, name, t0, t1, ...(x || {}) }; S.casts.push(c); return c; }, warn = (t, text, c) => S.warns.push({ t, text, c: c || '#ff8f87' }), timer = (t, name) => S.timers.push({ t, name });
  S.job = pgP2Jobs(seed, o.me, o.pick);
  // the gates (a Warlock's gateway each way, not measured): open from 2:47, the tanks first; back from 4:38.5
  S.gates = ['E', 'W'].flatMap((s) => [{ side: s, back: false, p: L(s, P.gateP), to: L(s, P.land), t0: T.gate, t1: T.wdie }, { side: s, back: true, p: L(s, P.land), to: L(s, P.gateP), t0: T.home, t1: T.heart }]);
  S.cross = {}; S.home = {}; ['E', 'W'].forEach((s) => P.half[s].forEach((id, i) => { S.cross[id] = id[0] === 't' ? T.gate + 0.4 : T.gate + 1 + i * 0.45; S.home[id] = id[0] === 't' ? T.home + 0.2 : S.job[id].cry ? T.home + 0.5 + S.job[id].cry * 0.2 : T.home + 1 + i * 0.45; })); /* (a Doomscale's kicker goes right behind the tank that drags it, so its Cry on the way is still in reach) */
  warn(T.start, 'Phase 2: split to your ledge through your gate!', '#c084ff'); timer(T.gate, 'Gates open');
  // Hatching Doom (2:54): each ledge's two big Doomscale Eggs, 90 s to pick up
  warn(T.doom, 'Hatching Doom: the big eggs must be picked up by 4:24', '#e6b450'); timer(T.doomEnd, 'Hatching Doom ends');
  // (the big eggs' pickups (Flex, Nov 15: "i think the first healer picks it up right away, and the second one is delayed"; the 30 fastest Mythic kills:
  // the melee take the south eggs first, about 4:06 to 4:10; then the healers the north ones, the first a median 4:13, the second a median 2.5 s
  // later, middle half 1.3 to 4.7; which ledge's healer goes first, from the run's seed)
  const nFirst = side() < 0.5 ? 'E' : 'W'; S.bigAt = { E: { far: T.bigUp, close: T.bigN[nFirst === 'E' ? 0 : 1] }, W: { far: T.bigUp + 0.5, close: T.bigN[nFirst === 'W' ? 0 : 1] } }; S.nFirst = nFirst;
  S.big = ['E', 'W'].flatMap((s) => ['far', 'close'].map((w) => { const p = L(s, P[w]); return { side: s, which: w, x: p[0], y: p[1] }; }));
  S.pits = { E: L('E', P.pit), W: L('W', P.pit) };
  // the Wardens (2:55): pulled across the line, Shadow Molt toward the eggs (3 s), Writhing Gestation (3 s), killed by the raid about 3:38
  S.wardens = ['E', 'W'].map((s) => ({ side: s, id: 'wd' + s, spawn: L(s, P.wSpawn), at: L(s, P.fight), up: T.wardens, molt: T.molt + 3, dies: T.wdie }));
  ['E', 'W'].forEach((s) => { cast('warden', 'Warden: Shadow Molt', T.molt, T.molt + 3, { side: s, spell: 'molt' }); cast('warden', 'Warden: Writhing Gestation', T.gest, T.gest + 3, { side: s, spell: 'gest' }); });
  warn(T.wardens, 'Doomscale Wardens: tank on the eggs, kick Malice!', '#b06bff'); timer(T.wardens, 'Wardens'); timer(T.gest + 3, 'Writhing Gestation');
  warn(T.clutch, 'Clutches! Kill the glowing eggs (Tab, then 1)', '#c38bff');
  // (the Clutches: the Warden's nearest small eggs, 0.3 s after its Writhing Gestation; the four south eggs come up about 3:55)
  S.clutches = ['E', 'W'].flatMap((s) => P.clutch[s].map((p, i) => ({ id: 'cl' + s + (i + 1), side: s, x: p[0], y: p[1], up: T.clutch + i * 0.15, set: 1 })));
  S.south = ['E', 'W'].flatMap((s) => P.south[s].map((p, i) => ({ id: 'se' + s + (i + 1), side: s, x: p[0], y: p[1], up: T.set2 })));
  // Malice: ONE a Warden (260 of 260 on the kills), the second Warden 1.0 s after the first (which first, from the run's seed): a 1.5 s cast bar, then a
  // 6 s channel; a kick up to 0.9 s into the channel and nobody is hit. A Warden still up 55.3 s after it stood up casts another (below, as it happens)
  const mFirst = side() < 0.5 ? 'E' : 'W'; S.malice = ['E', 'W'].map((s) => { const t0 = T.malice + (s === mFirst ? 0 : 1); return { side: s, k: 1, t0, ch: t0 + 1.5, by: t0 + 2.4, t1: t0 + 7.5, c: cast('warden', 'Warden: Malice', t0, t0 + 1.5, { side: s, spell: 'malice', kick: true }), cc: cast('warden', 'Warden: Malice (channel)', t0 + 1.5, t0 + 7.5, { side: s, spell: 'malice', kick: true, by: t0 + 2.4 }) }; });
  timer(T.malice, 'Malice');
  // Grasping Fangs (3:16): the solo breaks first, about 8 s after the tethers land, then the five together 8 s later (131 library Mythic kills)
  ['E', 'W'].forEach((s) => cast('warden', 'Warden: Grasping Fangs', T.fangs - 2, T.fangs, { side: s, spell: 'fangs' })); warn(T.fangs, 'Grasping Fangs: six tethers!', '#ff5a4f'); timer(T.fangs, 'Grasping Fangs'); timer(T.solo, 'Solo break'); timer(T.five, 'The five break');
  warn(T.solo, 'Solo break!', '#ff8a6a'); warn(T.five - 3, 'The five: to the edge of your tether…', '#ff8a6a'); warn(T.five, 'The five: break now!', '#ff5a4f');
  timer(T.wdie, 'Wardens die'); warn(T.wdie, 'Wardens down: pick up your egg once Blight Vein drops', '#f5d33a');
  // the small eggs on their fixed spots at each ledge's north end, shielded until the Warden is dead and the shield broken
  const UE = pgP2Eggs(); S.eggs = ['E', 'W'].flatMap((s) => (s === 'E' ? UE.R : UE.L).map((p, i) => ({ side: s, n: i + 1, x: p[0], y: p[1] })));
  // (each carrier's lane spot round the cauldron, in the order of the eggs round it (east frame: from the north-east round to the west), so no two paths cross)
  S.lane = {}; ['E', 'W'].forEach((s) => { const pit = L(s, P.pit), ang = (e) => { const q = L(s, [e.x - pit[0], e.y - pit[1]]); return Math.atan2(q[1], q[0]); }; S.lane[s] = S.eggs.filter((e) => e.side === s).sort((a, b) => ang(a) - ang(b)).map((e) => e.n); });
  timer(T.throwAt, 'Small eggs in'); warn(T.throwAt - 6, 'Small eggs: to the cauldron, in together at 3:56', '#f5d33a');
  timer(T.set2, 'South eggs'); timer(T.bigUp, 'Big eggs up'); warn(T.bigUp - 1, 'Big eggs: the south ones now, the north ones a few seconds later; in by 4:24!', '#e6b450');
  // the Weakened Doomscales: one climbs out of each cauldron 1.0 s after each big egg goes in (Doomscale 1 from the south egg, 2 from the north). Their
  // casts are set when they climb out (below); the plan's times here are for the cards: the bots carry a big egg in 15 s after picking it up (the walk
  // from the ledge's end is about 100 yards; on the kills the Doomscales climb out about 4:26, 4:27, 4:29 and 4:31)
  S.ds = ['E', 'W'].flatMap((s) => [1, 2].map((k) => ({ id: 'ds' + s + k, side: s, k, egg: k === 1 ? 'far' : 'close', up: S.bigAt[s][k === 1 ? 'far' : 'close'] + T.hold + 1 })));
  timer(Math.min(...S.ds.map((d) => d.up)), 'Doomscales');
  // Anguished Cry (from every Doomscale, 7.8 s after it climbs out, then every 15.8 s; kicked 1,450 of 1,489 on the kills, never let through): a 2.5 s
  // cast, or everyone within 60 yards is hit and stunned 6 s. Desperate Thrash (16.6 s, then every 18.3 s): a 3 s cast, then a frontal at its tank.
  // Both made as each Doomscale climbs out (dsCasts)
  S.cries = []; S.dthrash = [];
  // the way back, and the second heart burn (the same as the first)
  warn(T.home, 'Back to her through your gate: the heart burn!', '#c084ff'); timer(T.home, 'Back to her');
  cast('boss', 'Rage of the Shackled', T.rage, T.heart); warn(T.rage, 'Rage of the Shackled: burn the heart, watch the floor!', '#ff8a5a'); timer(T.heart, 'Heart open');
  for (let t = T.heart; t < T.heartEnd; t += 4) S.pulses.push(t);
  // Falling Debris: three times in stage 2 (about 3:50, 4:30 and 5:17; 264k to 458k a hit since Nov 6), by each half, and all over the stone in the heart burn
  const near = (c, r, onF) => { let q = c; for (let k = 0; k < 40; k++) { const a = rnd() * Math.PI * 2, d = 2 + rnd() * r; q = [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d]; if (onF(q[0], q[1])) break; } return q; };
  const fall = (q, at) => S.impacts.push({ x: q[0], y: q[1], r: 7, t0: at - 2, at, name: 'Falling Debris', dmg: 30, color: '#c8a36a', tip: 'Brown circles: step out before they land.' });
  // (on the ledges: never right at an edge, so there's stone to step out on either side)
  [[T.debris[0], [104, 24]], [T.debris[1], [104, 6]]].forEach(([at, c]) => ['E', 'W'].forEach((s) => { for (let j = 0; j < 4; j++) fall(near(L(s, c), 13, (x, y) => pgP2Ledge(x, y, 7)), at + j * 0.3); }));
  for (let j = 0; j < 3; j++) fall(near([24 * sg, 2], 16, PG_UL.onPlat), T.debris[2] + j * 0.3);
  T.debris.forEach((t) => { timer(t, 'Falling Debris'); warn(t - 2, 'Falling Debris: brown circles!', '#c8a36a'); });
  for (let t = T.heart + 2.5; t < T.heartEnd; t += 3.4) for (let j = 0; j < 3; j++) { let q; for (let k = 0; k < 30; k++) { q = [-30 + rnd() * 60, -30 + rnd() * 62]; if (PG_UL.onPlat(q[0], q[1])) break; } fall(q, t + j * 0.25); }
  // the heart burn's small tails (Gore Rattle, Caustic Waves; measured on the 12 fastest kills: a pair rises at one edge spot about 4:50.4 and fires
  // 2.4 s later, as the heart opens; another pair about 5:03.1. The first spot is (39,-39), (0,-56) or (0,57), the second (40,40), (-40,-39),
  // (-40,40) or (55,0)). As in phase 1's heart burn: three waves, 12.5 yards a second, its heading at the middle of the room and two more
  const tailSpots = [[[39, -39], [0, -56], [0, 57]], [[40, 40], [-40, -39], [-40, 40], [55, 0]]];
  T.rattle.forEach((at, k) => { const L0 = tailSpots[k], p = L0[Math.floor(rnd() * L0.length)], hd = Math.atan2(-p[1], -p[0]) * 180 / Math.PI; S.tails.push({ x: p[0], y: p[1], t0: at - 2.4, at });
    timer(at, 'Small tails'); warn(at - 2.4, 'A small tail rises at the edge: step out of its waves!', '#ff8a6a');
    [0, -(20 + rnd() * 45), 20 + rnd() * 45].forEach((off) => S.waves.push({ kind: 'tail', x: p[0], y: p[1], deg: hd + off, v: 12.5, w: 9, d: 4, cres: [[-4.5, 4.5]], warn: 2.4, t0: at, t1: at + 8.5, name: 'Caustic Waves from a small tail', tip: 'A small tail rising at the edge sends three waves 2.4 s later: step out of their red lanes. Stunned, you can\'t.' })); });
  T.spit.forEach((at) => timer(at + 6.5, 'Virulent Spit'));
  S.timers.sort((a, b) => a.t - b.t); S.warns.sort((a, b) => a.t - b.t);
  return S;
}

// ---- the part: practice.js calls pgP2(api) once per game; api is practice.js's window on the game (G, S, me, the hit helpers) ----
function pgP2(A) {
  const T = PG_P2_T, P = PG_P2, L = pgP2L, away = pgP2Away, clk = pgClock, RN = { m: 'Melee', r: 'Ranged', h: 'Healer' }, SD = { E: 'east', W: 'west' }, NS = { far: 'south', close: 'north' };
  let S = null, G = null; const sync = () => { S = A.S; G = A.G; };
  // (the plan's Cry times for the cards: Doomscale 1 climbs out 1 s after the south egg goes in, 15 s after its 4:09 pickup)
  const crN = T.CRY.map((o) => T.bigUp + T.hold + 1 + o);
  // (its debuffs on your frame, and which mistakes count as big ones: added on the first run, once practice.js has made its lists)
  let setUp = false; const setup = () => { if (setUp) return; setUp = true;
    if (A.DPS_SAY) Object.assign(A.DPS_SAY, { warden: ['Hit the Warden', 'The Warden was up', 'Tab picks the Doomscale Warden: your half kills it about 3:38, before it starts over (Writhing Gestation again 50 s after it stood up). Stay in range.', 'it'], ds: ['Hit the Doomscales', 'The Doomscales were up', 'Tab picks a Weakened Doomscale: hit them from behind or beside (their frontal goes at the tank), and kill them evenly.', 'them'],
      clutch: ['Kill the Clutches', 'Clutches were up', 'The Warden\'s Writhing Gestation turns its nearest eggs into glowing Clutches: Tab picks one, keep pressing 1. Each leaves a Rawling.', 'them'],
      rawling: ['Kill the Rawlings', 'Rawlings were up', 'A Rawling comes out of every Clutch and every egg in the cauldron: Tab picks one, keep pressing 1. They boil at 25 s.', 'them'] });
    Object.assign(A.DEB, { vein: ['Blight Vein', '#ff5a4f'], fangs: ['Grasping Fangs', '#ff8a6a'], stun: ['Stunned', '#ffd23b'], doom: ['Doomscale Egg', '#e6b450'], malice: ['Malice', '#b06bff'], acid: ['Acidic Expulsion', '#b8e04a'] });
    ['kick', 'tether', 'big', 'wipe', 'frontal', 'side', 'egg', 'even'].forEach((k) => A.MAJ.add(k)); };
  // ---- your job (the start card), remembered on this browser ----
  const KEY = 'wla-pg-job2', job0 = () => ({ side: 'E', role: 'r', egg: 'n6', mal: 0, cry: 0, teth: 'random' });
  const jobOk = (j) => !!j && (j.side === 'E' || j.side === 'W') && /^[mrh]$/.test(j.role) && (j.egg === null || j.egg === 'far' || j.egg === 'close' || /^n[1-8]$/.test(j.egg)) && [0, 1, 2, 3].includes(j.mal) && [0, 1, 2].includes(j.cry) && ['random', 'solo', 'five', 'none'].includes(j.teth);
  let pk = (() => { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (jobOk(j)) return j; } catch (e) { /* (no storage) */ } return job0(); })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(pk)); } catch (e) { /* (no storage) */ } };
  const fix = () => { if (pk.role === 'h') { pk.mal = 0; pk.cry = 0; } if (pk.mal > 1) pk.mal = 1; /* (one Malice a Warden: an old 2nd or 3rd pick is that one) */ if (pk.side === 'W' && pk.egg === 'n8') pk.egg = 'n7'; };
  // (your slot: one of your half with your role, the one whose usual jobs are nearest your pick)
  const slotOf = (j) => { const c = P.half[j.side].filter((id) => id[0] === j.role), D = pgP2Base(), n = j.egg && j.egg[0] === 'n' ? +j.egg.slice(1) : 0;
    return c.map((id) => [id, (n && D[id].egg === n ? 3 : 0) + (j.egg && D[id].big === j.egg ? 3 : 0) + (j.mal && D[id].mal === j.mal ? 1 : 0) + (j.cry && D[id].cry === j.cry ? 1 : 0) + (!j.egg && !D[id].egg ? 1 : 0)]).sort((a, b) => b[1] - a[1])[0][0]; };
  const mine = () => A.me === slotOf(pk);
  const pos = (id) => (id === A.me ? [G.x, G.y] : [G.bots[id].x, G.bots[id].y]);
  const idx = (id) => P.half[S.job[id].side].indexOf(id);
  const spiral = (c, i, r) => { const a = i * 2.39996, rr = r * Math.sqrt(((i % 9) + 0.5) / 9); return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; };
  const range = (id) => P.KICK[id[0]] || 0;
  const holder = (k, s, v) => Object.keys(S.job).find((id) => S.job[id].side === s && S.job[id][k] === v) || null;
  const bigIx = (s, w) => S.big.findIndex((b) => b.side === s && b.which === w);
  const slot = (s, n) => { const o = S.lane[s].indexOf(n); return pgP2Away(S.pits[s], 8.8, 10 + Math.max(0, o) * 33, s); } /* (8.8 yards out, 33 degrees apart: 5.0 yards between carriers, past the 4.3 a splash needs) */, bigSlot = (s, w) => away(S.pits[s], 8, w === 'far' ? 250 : 70, s);
  const TDIR = [10, -15, -32, -50, -68, -84];
  // (your way out of a tether: the safe heading (east round to south, away from the eggs and the venom) nearest your own side of the Warden)
  const outDir = (F, b0, s) => { const q = pgP2L(s, [b0.x - F[0], b0.y - F[1]]), b = Math.atan2(q[1], q[0]) * 180 / Math.PI, off = (a) => Math.abs((((a - b) % 360) + 540) % 360 - 180); return TDIR.reduce((m, a) => (off(a) < off(m) ? a : m), TDIR[0]); };
  const once = (k) => (G.p2.once.has(k) ? false : (G.p2.once.add(k), true));
  const stunned = (id, t) => (G.p2.stun[id] || -1) > t;
  const nearFloor = (q) => { if (pgP2Floor(q[0], q[1])) return q; for (let r = 0.5; r < 26; r += 0.5) for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, x = q[0] + Math.cos(a) * r, y = q[1] + Math.sin(a) * r; if (pgP2Floor(x, y)) return [x, y]; } return q; };
  // (a Doomscale's frontal: its 14 yards toward its tank, 50 degrees wide)
  const inFan = (f, x, y, m) => { if (!f.dir) return false; const d = Math.hypot(x - f.p[0], y - f.p[1]); if (d > P.FAN.r + (m || 0) || d < 0.3) return false; let da = Math.atan2(y - f.p[1], x - f.p[0]) - f.dir; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; return Math.abs(da) * 180 / Math.PI <= P.FAN.half + (m ? 12 : 0); };

  // ---- the Wardens and the Doomscales: where they are (a Warden is up until the raid kills it: G.p2.wdead) ----
  const wdAt = (w, t) => { if (t < w.up || G.p2.wdead[w.side] != null) return null; if (t >= w.molt) return w.at.slice(); const a = w.spawn, b = [(w.spawn[0] + w.at[0]) / 2, (w.spawn[1] + w.at[1]) / 2], f = Math.max(0, Math.min(1, (t - w.up - 1) / 2)); return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
  const wdUp = (s) => !!G.p2.wd[s];
  // (your share of your ledge's damage: a damage dealer's fifth, a healer's hits a bonus; nobody's on the other ledge)
  const shareOf = (s) => { const j = S.job[A.me]; return j && j.side === s && (A.me[0] === 'm' || A.me[0] === 'r') ? P.SHARE : 0; };
  const hitVal = (v) => v * (A.me[0] === 'h' ? 0.25 : 1);
  // (a bot's kick lands a moment into the bar, as on the kills: Malice about 0.6 s (0.5 to 0.75), Anguished Cry about 0.9 s (0.7 to 1.2), a little
  // sooner under Revenge's 1.25 s bar; the same each time for a run's seed)
  const kdelay = (key, kind, rev) => { let h = (S.seed * 2654435761) >>> 0; for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0; const f = (h % 1000) / 1000;
    return kind === 'Malice' ? 0.45 + f * 0.35 : rev ? 0.45 + f * 0.4 : 0.65 + f * 0.5; };
  // (the raid's pace on a ledge's Rawlings: slower while the Warden or the Doomscales take its damage)
  const rpace = (s, t) => (wdUp(s) ? P.RPACE.warden : S.ds.some((d) => d.side === s && G.p2.dsS[d.id] && G.p2.dsS[d.id].dead == null) ? P.RPACE.ds : P.RPACE.eggs);
  const tankOf = (s) => (s === 'E' ? 't1' : 't2');
  // (a kicker's spot: 5 yards behind their Doomscale, on the side away from its tank, so its frontal never points at them)
  const behind = (s, k) => { const d = G.p2.ds['ds' + s + k]; if (!d) return null; const tp = pos(tankOf(s)), ex = d.x - tp[0], ey = d.y - tp[1], ee = Math.hypot(ex, ey) || 1; return [d.x + ex / ee * 3.5, d.y + ey / ee * 3.5]; };
  const dsWant = (d, t) => { const st = G.p2.dsS[d.id]; if (!st || st.dead != null) return null; if (t < st.up + 1.5) return S.pits[d.side].slice(); const tk = tankOf(d.side), tp = pos(tk), sg = S.east ? 1 : -1;
    return G.p2.where[tk] === 'p1' ? [tp[0] + sg * (d.k === 1 ? -2.5 : 2.5), tp[1] + (tp[1] < 0 ? 7 : -7)] : (() => { const o = pgP2L(d.side, [-7, d.k === 1 ? 2.5 : -2.5]); return [tp[0] + o[0], tp[1] + o[1]]; })(); };

  // (a ledge's Doomscales: any climbed out yet, and when the next one will)
  const dsOut = (s) => S.ds.some((d) => d.side === s && G.p2.dsS[d.id]);
  const dsNext = (s) => Math.min(...S.ds.filter((d) => d.side === s).map((d) => (G.p2.dsS[d.id] ? G.p2.dsS[d.id].up : G.p2.dsAt[d.id] || d.up)));
  // (a melee's spot on the ledge's adds: 3 yards from the Clutch or Rawling they're on, the oldest first; you, on your target)
  // (with an anchor, only the adds within rad of it: in the eggs phase the half's spot, where the Rawlings come to it, so nobody chases one across the ledge)
  const meleeOn = (id, s, b0, an, rad) => { let o = null; const ok = (x, y) => !an || Math.hypot(x - an[0], y - an[1]) <= rad;
    if (id === A.me && G.tgt) { const c = G.p2.cl[G.tgt], a = G.adds.find((q) => q.id === G.tgt && q.own); if (c && c.dead == null && c.side === s && ok(c.x, c.y)) o = [c.x, c.y]; else if (a && a.side === s && ok(a.x, a.y)) o = [a.x, a.y]; }
    if (!o) { const c = Object.values(G.p2.cl).filter((q) => q.side === s && q.dead == null && ok(q.x, q.y)).sort((a, b) => a.born - b.born)[0]; if (c) o = [c.x, c.y]; }
    if (!o && (id !== A.me || an)) { const a = G.adds.filter((q) => q.own && q.side === s && q.kind === 'rawling' && ok(q.x, q.y)).sort((x, y) => x.born - y.born)[0]; if (a && pgP2Ledge(a.x, a.y, 0.6)) o = [a.x, a.y]; }
    if (!o) return null; const dx = b0.x - o[0], dy = b0.y - o[1], d = Math.hypot(dx, dy) || 1, q = [o[0] + dx / d * 3, o[1] + dy / d * 3], inside = (p) => pgP2Ledge(p[0], p[1], 2) || PG_UL.onPlat(p[0], p[1]);
    if (inside(q)) return q; /* (2 yards in from the edge: an add walking along it would lead you off the stone) */
    let best = null, bd = 1e9; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, p = [o[0] + Math.cos(a) * 3, o[1] + Math.sin(a) * 3]; if (!inside(p)) continue; const dd = Math.hypot(p[0] - b0.x, p[1] - b0.y); if (dd < bd) { bd = dd; best = p; } }
    return best || nearFloor(q); };
  // (a kick due for this raider soon (their own, or the one they're backing up): where its caster is)
  const kickDue = (id, t) => { const k = kickables(t + 4).concat(kickables(t)).find((q) => q.who === id && t >= q.t0 - 4); return k ? k.p : null; };
  const bkCry = (id) => { const b = G.p2.bk; if (!b || id !== A.me || G.p2.kick[b.key] || !/^c/.test(b.key)) return 0; const c = S.cries.find((q) => 'c' + q.ds + q.i === b.key); return c ? c.dk : 0; };
  // ---- where each raider's job wants them (the bots, the autopilot and your hint arrow all follow this) ----
  const ledgeJob = (id, t, j, s, b0) => { const tk = id[0] === 't', i = idx(id), F = L(s, P.fight); let T0, fast = false, ob = null;
    if (t < T.molt + 3) { T0 = tk ? (t < T.wardens + 1 ? L(s, [P.wSpawn[0] - 1.5, P.wSpawn[1] - 2.5]) : L(s, [(P.wSpawn[0] + P.fight[0]) / 2 + 2, (P.wSpawn[1] + P.fight[1]) / 2 - 2])) : spiral(L(s, [98, 22]), i, 5); fast = tk; }
    else if (wdUp(s)) { // the Warden: its tank, the melee round its south side (on the Clutches and the Rawlings while they live), the ranged and healers back
      if (tk) T0 = away(F, 2.6, 300, s); else if (id[0] === 'm') T0 = meleeOn(id, s, b0) || away(F, 4.5, 205 + P.half[s].filter((q) => q[0] === 'm').indexOf(id) * 30, s); else T0 = spiral(L(s, P.ranged), i, 6);
      // (a kick of yours (or the backup's): within reach of its caster)
      const kd = kickDue(id, t); if (kd) { const rg = range(id) - 1.5, d = pgDist(T0, kd); if (d > rg && rg > 0) T0 = [kd[0] + (T0[0] - kd[0]) * rg / d, kd[1] + (T0[1] - kd[1]) * rg / d]; }
      // (a tether: within 19 yards of the Warden until your break, to 21 yards 2.8 s before it, out past 25 on the count)
      const th = G.p2.teth[id]; if (th && th.br == null && t >= T.fangs - 0.2) { const bt = th.solo ? T.solo : T.five, dir = id === A.me ? outDir(F, b0, s) : th.solo ? TDIR[0] : TDIR[1 + (th.n % 4)]; /* (you: straight out from where you stand, not round the Warden) */
        if (t >= bt) { T0 = away(F, 28, dir, s); fast = true; ob = { at: bt + 0.6, p: T0, r: 1 }; } else if (t >= bt - (id === A.me ? 5.5 : 2.8)) { T0 = away(F, 21, dir, s); fast = true; ob = { at: bt, p: T0, r: 1 }; } /* (you walk slower than the bots run: off 5.5 s early, then wait at the edge) */
        else { const d = pgDist(T0, F); if (d > 19) T0 = [F[0] + (T0[0] - F[0]) * 19 / d, F[1] + (T0[1] - F[1]) * 19 / d]; } } }
    else if (!dsOut(s)) { // the eggs: yours once its shield breaks, to your lane spot at the cauldron, in together; the big eggs last
      const e = G.eggs.find((q) => q.id === id && q.state !== 'gone'), bi = j.big ? bigIx(s, j.big) : -1, bg = bi >= 0 ? G.p2.big[bi] : null;
      if (e && e.state === 'floor') { const busy = G.eggs.some((q) => q !== e && q.state === 'held' && q.who && q.who !== id && pgDist(pos(q.who), [e.x, e.y]) < 5.4); T0 = t >= e.shell - 0.8 && !busy ? [e.x, e.y] : (() => { const o = L(s, [3.2, 1.5]); return [e.x + o[0], e.y + o[1]]; })(); fast = pgDist([b0.x, b0.y], T0) > 6; ob = { at: e.shell, p: [e.x, e.y], r: 1 }; }
      // (the lanes: down the ledge to your lane's gap at y 34 (5 yards apart, past a splash's 4.3), east of the ledge's inner notch, then to your spot at the cauldron; the lanes in the eggs' order, so none cross)
      else if (e && e.state === 'held') { const o = Math.max(0, S.lane[s].indexOf(e.n)); T0 = b0.y > 36 ? L(s, [122 - o * 5, 34]) : slot(s, e.n); fast = pgDist([b0.x, b0.y], T0) > 6; ob = { at: T.throwAt, p: T0, r: 1.2 }; }
      else if (bg && bg.state === 'floor' && t >= S.bigAt[s][j.big] - (id === A.me ? 16 : 11)) { const B = S.big[bi]; T0 = t >= S.bigAt[s][j.big] - 0.6 ? [B.x, B.y] : [B.x + (S.pits[s][0] - B.x) * 0.06, B.y + (S.pits[s][1] - B.y) * 0.06]; fast = pgDist([b0.x, b0.y], T0) > 6; ob = { at: T.bigUp, p: [B.x, B.y], r: 1 }; }
      else if (bg && bg.state === 'held') { T0 = bigSlot(s, j.big); fast = true; ob = { at: bg.at + T.hold, p: T0, r: 1.2 }; }
      else { const wsp = L(s, t >= T.throwAt && (t < S.bigAt[s].far + 6 || (t < dsNext(s) - 5 && (G.adds.some((a) => a.own && a.side === s && a.y < -20) || Object.values(G.p2.cl).some((c) => c.side === s && c.dead == null && c.y < -20)))) && j.big !== 'close' ? P.swait : P.wait); T0 = (id[0] === 'm' && meleeOn(id, s, b0)) || spiral(wsp, i, 5); } /* (once the small eggs are in, the half waits by the south eggs and the south big egg, where the kills kill the cauldron's Rawlings, and is back by the cauldron before its Doomscales and the 4:30 debris; the north egg's carrier stays by the cauldron, nearer to it) */
      if (j.cry && !(e && e.state === 'held') && !(bg && bg.state === 'held') && t >= dsNext(s) - 8) { T0 = spiral(L(s, P.dsKick), i, 2); fast = pgDist([b0.x, b0.y], T0) > 6; } /* (a Cry kicker by the cauldron before its Doomscale climbs out) */
      if (tk && t >= dsNext(s) - 4) { T0 = L(s, P.ds); fast = true; } }
    else { // the Doomscales: their tank east of them (their frontal goes at the tank), the kickers behind them, the rest further back
      // (once their tank has taken them through the gate, everyone left on the ledge heads for it too: never at them across the venom)
      const gone = G.p2.where[tankOf(s)] === 'p1', bi = j.big ? bigIx(s, j.big) : -1, bg = bi >= 0 ? G.p2.big[bi] : null;
      // (a big egg still in your hands once the first Doomscale is out: on to the cauldron with it)
      if (bg && bg.state === 'held' && bg.who === id) return { T: bigSlot(s, j.big), fast: true, ob: { at: bg.at + T.hold, p: bigSlot(s, j.big), r: 1.2 } };
      if (bg && bg.state === 'floor' && t < T.doomEnd) { const B = S.big[bi]; return { T: t >= S.bigAt[s][j.big] - 0.6 ? [B.x, B.y] : [B.x + (S.pits[s][0] - B.x) * 0.06, B.y + (S.pits[s][1] - B.y) * 0.06], fast: true, ob: { at: S.bigAt[s][j.big], p: [B.x, B.y], r: 1 } }; }
      const ck = j.cry || bkCry(id); T0 = tk ? L(s, P.ds) : gone ? L(s, P.land) : ck ? behind(s, ck) || L(s, P.dsKick) : id[0] === 'm' ? (() => { const q = behind(s, 1 + (i % 2)); return q ? spiral(q, i, 2.2) : L(s, P.dsKick); })() : spiral(L(s, P.dsWait), i, 5); fast = gone; } /* (the melee: behind them, in reach (the damage moments, Nov 15)) */
    return { T: T0, fast, ob }; };
  const platJob = (id, t, j) => { const sg = S.east ? 1 : -1, PL = (x, y) => [x * sg, y], east = j.side === 'E';
    // (back by her, the Doomscales dragged in by the heart for the cleave (the guide): the east half's tank holds its two just south of the heart and
    // the west half's just north, their frontals pointing away at the tanks; every melee by the heart, in reach of it and of their Doomscale (kicks
    // too); the ranged and healers a little back. The damage moments, Nov 15)
    const i = GDZ_RAID.indexOf(id), T0 = id[0] === 't' ? PL(34, east ? -12 : 12) : id[0] === 'm' ? spiral(PL(35.5, 0), i, 1.5) : spiral(PL(25, 0), i, 5);
    // (a kick due: the escapes from the small tails' waves keep you in reach of its caster)
    const kd = kickDue(id, t); return { T: T0, fast: false, ob: kd ? { at: t + 3, p: kd.slice(), r: Math.max(2, range(id) - 1.5) } : null }; };
  const job = (id, t) => { sync(); const j = S.job[id], s = j.side, w = G.p2.where[id], ws = G.p2.wside[id], b0 = id === A.me ? { x: G.x, y: G.y } : G.bots[id]; let r;
    if (w === 'p0') r = t < S.cross[id] ? { T: spiral(L(s, [14, -2]), idx(id), 5), fast: false, ob: null } : { T: L(s, P.gateP), fast: true, ob: { at: T.wardens, p: L(s, P.gateP), r: 1.2 } };
    else if (w === 'L' && ws !== s) r = { T: L(ws, P.land), fast: true, ob: null }; /* (on the wrong ledge: back through its gate) */
    else if (w === 'L') r = t >= S.home[id] ? { T: L(s, P.land), fast: true, ob: { at: T.rage, p: L(s, P.land), r: 1.2 } } : ledgeJob(id, t, j, s, b0);
    else r = platJob(id, t, j);
    // (out of a Doomscale's frontal while it casts, unless it's at you)
    // (and if you're walking through one now, straight out of its side nearest you)
    for (const f of G.p2.fan) if (t >= f.t0 && t <= f.at + 0.2 && f.tank !== id && (inFan(f, r.T[0], r.T[1], 1.5) || inFan(f, b0.x, b0.y, 1.5))) { const sd = Math.sin(Math.atan2(b0.y - f.p[1], b0.x - f.p[0]) - f.dir) >= 0 ? 1 : -1, a = f.dir + sd * Math.PI * 0.6, q = [f.p[0] + Math.cos(a) * Math.max(6, Math.hypot(b0.x - f.p[0], b0.y - f.p[1])), f.p[1] + Math.sin(a) * Math.max(6, Math.hypot(b0.x - f.p[0], b0.y - f.p[1]))]; r.T = q; r.fast = true; }
    // (Falling Debris: phase 2's own dodge, in place of practice.js's (that one is for the flat platform; on the ledges a straight step can cross the
    // venom). A brown circle coming down where the job wants you, or on you: go to the nearest spot clear of every circle due in the next 2.4 s, on the
    // stone all the way there, and past each circle on the way before it lands)
    r.T = nearFloor(r.T); const imps = S.impacts.filter((m) => m.at >= t - 0.05 && m.at - t <= 2.4); if (!imps.length) { r.T = route(b0, r.T, id); return r; }
    const sp = (id === A.me ? 7 * (A.has('sprint') ? 1.4 : 1) : 9.8) * Math.max(0.3, slow(id, t)), near = (x, y, pad) => imps.some((q) => Math.hypot(x - q.x, y - q.y) <= q.r + pad);
    // (a carrier's escape keeps out of the other carriers' rings too: 4.4 yards from them, just past a splash's 4.3)
    const held = G.eggs.some((e) => e.who === id && e.state === 'held'), rings = held ? G.eggs.filter((e) => e.state === 'held' && e.who && e.who !== id).map((e) => pos(e.who)) : [];
    const clear = (x, y) => { if (near(x, y, 1.6) || rings.some((o) => Math.hypot(x - o[0], y - o[1]) < 4.4)) return false; const d = Math.hypot(x - b0.x, y - b0.y); for (let k = 1; k <= 10; k++) { const f = k / 10, px = b0.x + (x - b0.x) * f, py = b0.y + (y - b0.y) * f, tt = t + d * f / sp; if (!pgP2Floor(px, py) || imps.some((q) => tt >= q.at - 0.35 && tt <= q.at + 0.25 && Math.hypot(px - q.x, py - q.y) <= q.r + 1)) return false; } return true; };
    // (an escape, once picked, is kept while it stays clean until the circles land: a circle right on you has two equally good ways out, and
    // re-picking each step would swap between them and leave you in it (a Virulent Spit swirl lands on the raider it marked))
    const need = (near(r.T[0], r.T[1], 2.2) || near(b0.x, b0.y, 1.6)) && !clear(r.T[0], r.T[1]), es = G.p2.esc[id]; if (need && es && t < es.until && clear(es.T[0], es.T[1]) && !G.p2.fan.some((f) => t >= f.t0 && t <= f.at + 0.2 && f.tank !== id && inFan(f, es.T[0], es.T[1], 1.5))) { r.T = es.T; r.fast = true; r.T = route(b0, r.T, id); return r; }
    if (need) {
      // (a kick of yours due: stay within reach of its caster if you can. The spots are tried cheapest first, so few paths are walked through)
      const kk = kickables(t + 1).concat(kickables(t)).find((k) => k.who === id), foe = kk ? kk.p : null, rg = range(id) + (id === A.me ? -0.6 : 3), C = [];
      for (const rr of [2, 3.5, 5, 7, 9, 11, 14, 17]) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, x = b0.x + Math.cos(a) * rr, y = b0.y + Math.sin(a) * rr; C.push([rr + 0.4 * Math.hypot(x - r.T[0], y - r.T[1]) + (foe && Math.hypot(x - foe[0], y - foe[1]) > rg ? 40 : 0), x, y]); }
      C.sort((a, b) => a[0] - b[0]); let best = null; for (const c of C) if (clear(c[1], c[2])) { best = [c[1], c[2]]; break; }
      // (nowhere clean in time: the nearest spot out of every circle that's on the stone all the way there)
      if (!best) { const onWay = (x, y) => { for (let k = 1; k <= 8; k++) { const f = k / 8; if (!pgP2Floor(b0.x + (x - b0.x) * f, b0.y + (y - b0.y) * f)) return false; } return true; };
        const D = C.map((c) => [Math.hypot(c[1] - b0.x, c[2] - b0.y), c[1], c[2]]).sort((a, b) => a[0] - b[0]); for (const c of D) if (!near(c[1], c[2], 0.5) && onWay(c[1], c[2])) { best = [c[1], c[2]]; break; } }
      if (best) { r.T = best; r.fast = true; G.p2.esc[id] = { T: best, until: Math.max(...imps.map((m) => m.at)) + 0.3 }; } }
    r.T = route(b0, r.T, id); return r; };
  // (a straight walk that would leave the stone (the ledges have inlets of venom): via the nearest point down the ledge's middle that it can reach
  // on the stone and that reaches the spot on the stone)
  const MID = [[100, 60], [100, 45], [100, 30], [100, 15], [100, 0], [100, -15], [100, -30], [100, -45], [80, 66], [78, -62]];
  const onWay = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(d / 1.5)); for (let k = 1; k <= n; k++) { const f = k / n; if (!pgP2Floor(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)) return false; } return true; };
  // (a route point, once picked, is kept until you're on it, so the walk doesn't wobble between two)
  const route = (b0, T0, id) => { const a = [b0.x, b0.y]; if (!pgP2Ledge(a[0], a[1], 0.4)) return T0; const st = G.p2.wp[id];
    if (st && pgDist(st.T, T0) < 3 && pgDist(a, st.q) > 2 && onWay(a, st.q)) return st.q; delete G.p2.wp[id]; if (onWay(a, T0)) return T0; const s = a[0] > 0 ? 'E' : 'W'; let best = null, bd = 1e9;
    MID.forEach((p) => { const q = pgP2L(s, p); if (!onWay(a, q) || !onWay(q, T0)) return; const d = pgDist(a, q) + pgDist(q, T0); if (d < bd) { bd = d; best = q; } }); if (best) G.p2.wp[id] = { q: best, T: T0.slice() }; return best || T0; };
  const home = (id) => { sync(); const s = PG_P2.half.E.includes(id) ? 'E' : 'W'; return spiral(L(s, [14, -2]), PG_P2.half[s].indexOf(id), 5); };
  const slow = (id, t) => { sync(); if (!G || !G.p2) return 1; if (stunned(id, t)) return 0; const th = G.p2.teth[id]; return th && th.br == null && t >= T.fangs && wdUp(th.side) ? 0.75 : 1; };

  // ---- a new run ----
  const init = (G0) => { setup(); G = G0; S = A.S; G.t = T.start; G.wipes = 0; G.bossHp = bossHp(T.start);
    G.p2 = { where: {}, wside: {}, lock: {}, wp: {}, teth: {}, kick: {}, gone: [], stun: {}, kickCd: -99, wardT: -99, big: S.big.map(() => ({ state: 'floor', who: null, at: null })), ds: {}, wd: {}, fan: [], tlog: [], missed: [], veins: [], once: new Set(), crossT: null, backT: null,
      // (the adds' health: the Wardens, the Clutches, the south eggs, the Doomscales (from when each climbs out), the first Doomscale's death (Revenge),
      // your hits on each Doomscale, who kicked what and when (the Interrupted labels), the backup kick, the Ravenous Doomscales)
      whp: { E: 1, W: 1 }, wdead: { E: null, W: null }, w2: { E: {}, W: {} }, cl: {}, se: {}, dsS: {}, dsAt: {}, rev: null, dsHits: {}, intr: [], bk: null, bkSeen: 0, rav: [], acid: new Set(), esc: {} };
    S.south.forEach((q) => { G.p2.se[q.id] = { state: 'egg' }; });
    GDZ_RAID.forEach((id) => { G.p2.where[id] = 'p0'; G.p2.wside[id] = null; });
    G.eggs = S.eggs.map((e) => ({ id: holder('egg', e.side, e.n), side: e.side, n: e.n, x: e.x, y: e.y, land: T.wardens, shell: T.shells + S.eggs.filter((q) => q.side === e.side && pgDist([q.x, q.y], S.pits[e.side]) > pgDist([e.x, e.y], S.pits[e.side])).length * 1.1, set: 0, state: 'floor', who: null, lock: 'Its shield holds until the Warden is dead: wait.' })); };
  const bossHp = (t) => 56 - (t > T.heart ? 12 * Math.min(1, (t - T.heart) / (T.heartEnd - T.heart)) : 0);

  // ---- what happens each step: gates, kicks, tethers, the eggs' rules, the big eggs, the frontals ----
  const vein = (t) => { A.deb('vein', 4, true); G.p2.veins.push(t); };
  // (the casts you can kick now: each Warden's Malice (its bar, and the first 0.9 s of its channel), each Doomscale's Anguished Cry. Its kicker: the
  // plan's, or you while you're its backup)
  const bkWho = (key, who) => (G.p2.bk && G.p2.bk.key === key ? A.me : who);
  const kickables = (t) => S.malice.filter((m) => t >= m.t0 && t <= m.by && !G.p2.kick['m' + m.side + m.k] && G.p2.wd[m.side]).map((m) => ({ key: 'm' + m.side + m.k, kind: 'Malice', p: G.p2.wd[m.side], who: bkWho('m' + m.side + m.k, holder('mal', m.side, 1)), t0: m.t0, side: m.side, c: m.c, cc: m.cc, caster: 'wd' + m.side }))
    .concat(S.cries.filter((c) => t >= c.t0 && t <= c.t1 && !G.p2.kick['c' + c.ds + c.i] && G.p2.ds[c.ds]).map((c) => ({ key: 'c' + c.ds + c.i, kind: 'Anguished Cry', p: [G.p2.ds[c.ds].x, G.p2.ds[c.ds].y], who: bkWho('c' + c.ds + c.i, holder('cry', c.side, c.dk)), t0: c.t0, side: c.side, rev: c.rev, c: c.c, caster: c.ds })));
  // (a kick lands: its bars stop, and an "Interrupted" label stands over the caster for a moment with who kicked it, yours or a bot's, so you see every one)
  const kicked = (k, who, t) => { G.p2.kick[k.key] = who; k.c.t1 = Math.min(k.c.t1, t); if (k.cc) k.cc.t1 = Math.min(k.cc.t1, t); G.p2.intr.push({ key: k.key, caster: k.caster, who, t, kind: k.kind });
    if (who === A.me) { A.say((G.p2.bk && G.p2.bk.key === k.key ? 'Backup kick! ' : 'Kicked: ') + k.kind + ' interrupted.'); } };
  const kick = () => { sync(); if (!G || !G.p2) return; const t = G.t, me = A.me, rg = range(me);
    if (!rg) { A.say('Healers have no kick in Midnight (only a Restoration Shaman).', true); return; } if (stunned(me, t)) { A.say('You\'re stunned.', true); return; }
    if (t - G.p2.kickCd < 15) { A.say('Kick is on cooldown: ' + Math.ceil(15 - (t - G.p2.kickCd)) + ' s.', true); return; }
    const foes = S.wardens.map((w) => G.p2.wd[w.side]).filter(Boolean).concat(Object.values(G.p2.ds).map((d) => [d.x, d.y])); if (!foes.some((p) => pgDist(p, [G.x, G.y]) <= rg)) { A.say('Nothing to kick within ' + rg + ' yards.', true); return; }
    // (as in WoW your kick goes to your target when it's casting; with no caster picked, the one you're meant to kick, else the nearest in reach)
    const inR = kickables(t).filter((k) => pgDist(k.p, [G.x, G.y]) <= rg), K = inR.find((k) => k.caster === G.tgt) || inR.sort((a, b) => (b.who === me) - (a.who === me) || pgDist(a.p, [G.x, G.y]) - pgDist(b.p, [G.x, G.y]))[0];
    G.p2.kickCd = t; if (K) kicked(K, me, t); else A.say('Kick wasted: nothing was casting. 15 s until the next.', true); A.hud(true); };
  const gates = (t) => { const me = A.me;
    // (a gate takes you once you've stepped off the one you came out of: you land beside the other end, which would send you straight back (the review, Nov 15))
    GDZ_RAID.forEach((id) => { const lk = G.p2.lock[id]; if (lk && pgDist(pos(id), lk) > 3.6) delete G.p2.lock[id]; });
    S.gates.forEach((g) => { const ids = GDZ_RAID.filter((id) => !G.p2.lock[id] && (g.back ? G.p2.where[id] === 'L' && G.p2.wside[id] === g.side : G.p2.where[id] === 'p0'));
      ids.forEach((id) => { const j = S.job[id], p = pos(id), wrong = id === me && g.back && j.side !== g.side, open = (t >= g.t0 && t <= g.t1) || (wrong && t < T.heart); if (!open || pgDist(p, g.p) > 2.4) return;
        if (id !== me && (j.side !== g.side || t < (g.back ? S.home[id] : S.cross[id]))) return; if (id !== me && !(t >= g.t0 && t <= g.t1)) return;
        const q = g.back && t < T.home ? home(id) : spiral(g.to, idx(id), 2.6), dst = nearFloor(q); if (id === me) { G.x = dst[0]; G.y = dst[1]; G.kb = null; A.clearTarget(); } else { G.bots[id].x = dst[0]; G.bots[id].y = dst[1]; G.bots[id].esc = null; }
        G.p2.lock[id] = g.to.slice();
        if (!g.back) { G.p2.where[id] = 'L'; G.p2.wside[id] = g.side; } else { G.p2.where[id] = t < T.home ? 'p0' : 'p1'; G.p2.wside[id] = null; }
        if (id !== me) return;
        if (!g.back) { G.p2.crossT = t; if (g.side !== j.side) { if (once('side' + g.side + Math.floor(t / 20))) A.mistake('side', 'You took the ' + SD[g.side] + ' gate: your half is on the ' + SD[j.side] + ' ledge.', 'Your gate is the gold ring on your ledge\'s side of the platform. Step off and back into this ledge\'s gate to go back.', 0); } else if (t > T.wardens + 1 && once('late0')) A.mistake('late', 'You crossed late (' + clk(t) + '): your half was already on the Warden.', 'Walk into your gate as it opens at 2:47.', 0); else A.say('On the ' + SD[g.side] + ' ledge.'); }
        else if (G.p2.where[id] === 'p1') { G.p2.backT = t; if (t > T.rage && once('late1')) A.mistake('late', 'You came back late (' + clk(t) + ') for the heart burn.', 'Take your gate back at 4:38, as the tank brings the Doomscales.', 0); else A.say('Back by her: burn the heart.'); } }); });
    if (t > T.wardens + 10 && G.p2.where[me] === 'p0' && once('nocross')) A.mistake('side', 'You never crossed to your ledge.', 'Walk into your gate (the gold ring on your side of the platform) as it opens at 2:47.', 0);
    if (t > T.heart && G.p2.where[me] === 'L' && once('noback')) A.mistake('late', 'You stayed on the ledge through the heart burn.', 'Take your gate back to her at 4:38.', 0); };
  // (once a run you're the backup: the plan's kicker has their kick on cooldown, so the cast is yours. It comes on a Cry or a Malice on your ledge
  // that your kick is ready for and you're near; never to a healer (no kick). Raids keep a backup for this: Flex, Nov 15: "i still dont see good
  // interupt mechanics", the audit: "a default run never asks for E")
  const backup = (t) => { const me = A.me, j = S.job[me]; if (G.p2.bk || !j || !range(me) || stunned(me, t) || t - G.p2.kickCd < 15) return;
    kickables(t).forEach((k) => { if (G.p2.bk || k.side !== j.side || k.who === me || !k.who || t > k.t0 + 0.15 || G.p2.kick[k.key]) return; if (pgDist([G.x, G.y], k.p) > range(me) + 4) return;
      if (++G.p2.bkSeen < 1 + (S.seed % 2)) return; /* (the run's first or second chance, from its seed) */
      G.p2.bk = { key: k.key, t, who: k.who, kind: k.kind }; if (!window.__pgAuto) { if (A.big) A.big('Backup! ' + A.nm(k.who) + '\'s kick is on cooldown: kick ' + k.kind + ' now (E)!', '#ffd34d'); A.say('You\'re the backup: kick ' + k.kind + ' now (E)!', true); } }); };
  const kicks = (t0, t) => { const cr = (at) => at > t0 && at <= t, me = A.me; backup(t);
    // (the plan's kickers kick a moment into the bar (0.6 s for Malice, 0.9 s for a Cry, as on the kills); you kick yourself unless the autopilot plays)
    kickables(t).forEach((k) => { if (!k.who || stunned(k.who, t) || (k.who === me && !window.__pgAuto) || t < k.t0 + (k.who === me ? 0.25 : kdelay(k.key, k.kind, k.rev))) return; if (pgDist(pos(k.who), k.p) <= range(k.who) + (k.who === me ? 0 : G.p2.where[k.who] === 'p1' ? 10 : 3)) kicked(k, k.who, t); }); /* (the bots' kicks reach 3 yards further (10 back by her, where they dodge the small tails' waves too): the plan's kickers, never a miss of yours) */
    S.malice.forEach((m) => { const key = 'm' + m.side + m.k, bk = G.p2.bk && G.p2.bk.key === key, who = bk ? me : holder('mal', m.side, 1);
      if (cr(m.by) && !G.p2.kick[key] && G.p2.wd[m.side]) { G.p2.kick[key] = 'none'; G.p2.gone.push(m); m.cc.name = 'Warden: Malice (not kicked)'; G.p2.missed.push([who, 'a Malice not kicked ' + clk(m.t0)]);
        if (who === me) A.mistake('kick', bk ? 'You were the backup and didn\'t kick Malice (' + clk(m.t0) + '): it hit everyone every second for 6 s.' : 'You didn\'t kick Malice (' + clk(m.t0) + '): it hit everyone every second for 6 s.', 'Press E while the Warden\'s cast bar runs (you have until just under a second into its channel), within ' + range(me) + ' yards of it.', 0); }
      // (its ticks: 792k unmitigated on every living player, a second apart from a second after the bar; close to half a raider's health each)
      if (G.p2.kick[key] === 'none') for (let k = 1; k <= 6; k++) if (cr(m.ch + k) && G.p2.wd[m.side]) { A.hurt(45); A.deb('malice', 1.2); } });
    S.cries.forEach((c) => { const key = 'c' + c.ds + c.i, d = G.p2.ds[c.ds], bk = G.p2.bk && G.p2.bk.key === key, who = bk ? me : holder('cry', c.side, c.dk); if (!cr(c.t1) || G.p2.kick[key] || !d) return; G.p2.kick[key] = 'none'; G.p2.missed.push([who, 'an Anguished Cry not kicked ' + clk(c.t0)]);
      GDZ_RAID.forEach((id) => { if (pgDist(pos(id), [d.x, d.y]) <= P.CRY) G.p2.stun[id] = t + 6; });
      // (516k and the 6 s stun on everyone in reach; with Revenge 1.03M, twice as much)
      if (pgDist([G.x, G.y], [d.x, d.y]) <= P.CRY) { A.deb('stun', 6); A.hurt(c.rev ? 50 : 25); if (who !== me) A.say('Anguished Cry' + (c.rev ? ' (Revenge)' : '') + ': stunned for 6 s.', true); }
      if (who === me) A.mistake('kick', (bk ? 'You were the backup and didn\'t kick Anguished Cry (' : 'You didn\'t kick Anguished Cry (') + clk(c.t0) + ')' + (c.rev ? ', in 1.25 s with Revenge' : '') + ': everyone within 60 yards was stunned for 6 s.', c.rev ? 'With Revenge its bar is half as long: press E the moment it starts.' : 'Press E during the Doomscale\'s cast bar, within ' + range(me) + ' yards.', 0); }); };
  const tethers = (t0, t) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    if (cr(T.fangs)) { const n = { E: 0, W: 0 }; Object.keys(S.job).forEach((id) => { const j = S.job[id]; if (!j.teth) return; G.p2.teth[id] = { solo: j.teth === 'solo', br: null, side: j.side, n: n[j.side]++ };
      if (id === me) { A.deb('fangs', 30); A.say('Grasping Fangs on you: ' + (j.teth === 'solo' ? 'you break alone at 3:26.' : 'break with the five at 3:34.'), true); } }); }
    // (the five's break puts five stacks of Blight Vein on everyone at once: 640 to 960k each on the kills, under raid cooldowns; your defensive halves it)
    if (cr(T.five - 1.5) && !window.__pgAuto && A.big && G.p2.where[me] === 'L') A.big('The five are about to break: press Q (your defensive)!', '#7fb8ff');
    if (t < T.fangs) return;
    Object.entries(G.p2.teth).forEach(([id, th]) => { if (th.br != null) return; const W = G.p2.wd[th.side]; if (!W) { if (G.p2.wdead[th.side] != null) th.br = 'gone'; return; } /* (its Warden dead: the tether goes with it) */ const d = pgDist(pos(id), W), bt = th.solo ? T.solo : T.five, lo = th.solo ? bt - 1.5 : bt - 1, hi = th.solo ? bt + 3 : bt + 1.5;
      const late = id === me && !window.__pgAuto && t > hi + 1;
      if (d <= P.TETHER && !late) return; th.br = t; vein(t); G.p2.tlog.push([id, t, t >= lo && t <= hi]); if (id !== me) return; if (G.debs.fangs) G.debs.fangs.until = t;
      if (t < lo) A.mistake('tether', 'You broke your tether early (' + clk(t) + '): ' + (th.solo ? 'the solo break is at 3:26.' : 'the five break together at 3:34.'), th.solo ? 'Walk out alone at 3:26, once the raid is ready for it.' : 'Wait at the edge of your tether (about 20 yards from the Warden) and step out on the count.', 0);
      else if (t > hi) A.mistake('tether', 'You broke your tether late (' + clk(t) + '): its Blight Vein landed apart from the others, so everyone took extra ticks.', th.solo ? 'Walk out past 25 yards from the Warden at 3:26.' : 'Be at the edge of your tether two seconds early, then step out on the count at 3:34.', 0);
      else A.say('Tether broken on time.'); }); };
  const eggs = (t0, t) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    // Warden's Protection: an egg can't be touched while its Warden lives, and it nicks anyone standing on one (about 43k, a median 2.6 yards from
    // the egg on the kills: a small tick, taken a few times a kill)
    if (t - G.p2.wardT > 4 && G.eggs.some((e) => e.state === 'floor' && wdUp(e.side) && Math.hypot(G.x - e.x, G.y - e.y) <= P.WARD)) { G.p2.wardT = t; A.mistake('ward', 'Warden\'s Protection: you stood on an egg while its Warden lived.', 'Stand beside the eggs, not on them, until the Warden is dead.', 4); }
    // into the cauldron: a carrier at their own ledge's pit, from the count
    G.eggs.forEach((e) => { if (e.state !== 'held' || !e.who) return; const p = pos(e.who); if (pgDist(p, S.pits[e.side]) > P.THROW) return;
      if (t < T.throwAt) { if (e.who === me && once('wait' + e.n)) A.say('Wait here: in together at 3:56.'); return; }
      e.state = 'gone'; { const q = pgP2Away(S.pits[e.side], 3, e.n * 47, e.side); rawling(e.side, q, t); } /* (a Rawling climbs out of the cauldron for every small egg, as on the kills) */
      if (e.id === me) { if (t > T.throwAt + 7) A.mistake('late', 'Your egg went into the cauldron late (' + clk(t) + ').', 'Be at your lane spot by the cauldron before 3:56: in together.', 0); else A.say('Your egg is in the cauldron.'); } e.who = null; });
    if (cr(T.bigUp + 0.5)) G.eggs.forEach((e) => { if (e.id !== me || e.state === 'gone') return; if (e.state === 'floor') A.mistake('egg', 'You never picked up your egg (#' + e.n + ').', 'Your egg sits at the north end of your ledge (the gold circle): pick it up once the Warden is dead.', 0); else A.mistake('egg', 'Your egg (#' + e.n + ') wasn\'t in the cauldron before the big eggs were picked up.', 'Carry it to the cauldron and throw it in with the others at 3:56.', 0); }); };
  const big = (t0, t) => { const me = A.me;
    S.big.forEach((B, i) => { const st = G.p2.big[i], hd = holder('big', B.side, B.which);
      if (st.state === 'floor') { const mineB = hd === me, who = mineB ? (Math.hypot(G.x - B.x, G.y - B.y) <= 2.2 ? me : null) : hd && t >= S.bigAt[B.side][B.which] && pgDist(pos(hd), [B.x, B.y]) <= 2.2 ? hd : null;
        if (who) { st.state = 'held'; st.who = who; st.at = t; if (who === me) { A.deb('doom', 20); if (G.eggs.some((e) => e.side === B.side && e.state !== 'gone')) A.mistake('big', 'You picked up the big egg with small eggs still out.', 'Big eggs last (the plan): every small egg on your ledge goes into the cauldron first.', 0); else A.say('Big egg: into the cauldron within 20 s.'); }
          // (the south egg's pickup turns the south small eggs beside it into Clutches, 0.7 s later: 16 of the 30 fastest kills let that happen and kill them)
          if (B.which === 'far') S.south.forEach((q) => { const se = G.p2.se[q.id]; if (q.side === B.side && se.state === 'egg' && t >= q.up) { se.state = 'gest'; se.at = t + 0.7; } }); }
        else if (t >= T.doomEnd) { st.state = 'hatched'; ravenous(B, [B.x, B.y], t, hd === me, 'Hatching Doom ran out on your big egg', 'Pick the big egg up by 4:24 (the plan: 4:09 for the south one, 4:13 or 4:16 for the north) and carry it straight in.'); } }
      else if (st.state === 'held') { const p = pos(st.who);
        if (t - st.at >= 20) { st.state = 'hatched'; ravenous(B, p, t, st.who === me, 'Your big egg hatched in your hands (20 s after you picked it up)', 'Once picked up, a big egg hatches in 20 s: carry it straight to the cauldron.'); }
        else if (pgDist(p, S.pits[B.side]) <= P.THROW && (st.who === me || t >= st.at + T.hold)) { st.state = 'in'; G.p2.dsAt['ds' + B.side + (B.which === 'far' ? 1 : 2)] = t + 1; if (st.who === me) { if (G.debs.doom) G.debs.doom.until = t; A.say('Big egg in the cauldron: a Weakened Doomscale climbs out.'); } } } }); };
  // (a big egg that hatches: a Ravenous Doomscale at full health stands up there and, 6.5 s later, casts Dread Roar (2.5 s): on the kills' wipes it
  // killed 15 of 17 in 3 s. A wipe on a real pull; here a 6 s stun and a big hit, so you can play on)
  const ravenous = (B, p, t, mine, why, tip) => { G.p2.rav.push({ side: B.side, x: p[0], y: p[1], t, roar: t + T.ROAR + 2.5, mine, c: cast('rav', 'Ravenous Doomscale: Dread Roar', t + T.ROAR, t + T.ROAR + 2.5, { side: B.side, spell: 'roar' }) });
    if (mine) { G.wipes++; A.mistake('wipe', why + ': a Ravenous Doomscale stood up and its Dread Roar wipes the raid on a real pull (here a 6 s stun, so you can play on).', tip, 0); }
    if (!window.__pgAuto && A.big) A.big('A Ravenous Doomscale! Dread Roar in ' + (T.ROAR + 2.5) + ' s: a wipe on a real pull', '#ff5a4f'); };
  const cast = (who, name, t0, t1, x) => { const c = { who, name, t0, t1, ...(x || {}) }; S.casts.push(c); return c; };
  // (a Blightscale Rawling: from a Clutch, or a small egg in the cauldron. Phase 2 runs its own (own: practice.js leaves their health and their boiling to it))
  const rawling = (s, q, t) => { const a = { kind: 'rawling', own: true, side: s, x: q[0], y: q[1], born: t, hp: P.RHITS }; a.id = 'a' + (G.addN = (G.addN || 0) + 1); G.adds.push(a); return a; };
  const fans = (t0, t) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    S.dthrash.forEach((f, i) => { const d = G.p2.ds[f.ds]; if (cr(f.t0) && d) { const tk = pos(tankOf(f.side)); G.p2.fan.push({ i, t0: f.t0, at: f.at, p: [d.x, d.y], dir: Math.atan2(tk[1] - d.y, tk[0] - d.x), tank: tankOf(f.side) }); }
      const F = G.p2.fan.find((q) => q.i === i); if (F && cr(f.at) && inFan(F, G.x, G.y)) A.mistake('frontal', 'Desperate Thrash hit you: you stood in front of a Doomscale.', 'Its frontal goes toward its tank: stand behind it or beside it.', 30); });
    G.p2.fan = G.p2.fan.filter((q) => t <= q.at + 0.6); };
  // ---- the adds, each step: the Wardens' health (and a second round if one lives), the Clutches, the south eggs, the Rawlings, the Doomscales ----
  const W2T = (w, k) => w.up + T.W2[k];
  const wardens = (t0, t, dt) => { const cr = (at) => at > t0 && at <= t, me = A.me, span = T.wdie - (T.molt + 3);
    S.wardens.forEach((w) => { const s = w.side; if (!G.p2.wd[s] || t < w.molt) return;
      G.p2.whp[s] -= (1 - shareOf(s)) / span * dt; /* (the raid's damage: it dies about 3:38 when you do your share) */
      if (G.p2.whp[s] <= 0) { G.p2.wdead[s] = t; delete G.p2.wd[s]; S.casts.forEach((c) => { if (c.who === 'warden' && c.side === s && c.t1 > t) c.t1 = Math.max(c.t0, t); });
        G.eggs.forEach((e) => { if (e.side !== s || e.state !== 'floor') return; e.shell = t + 0.7 + S.eggs.filter((q) => q.side === s && pgDist([q.x, q.y], S.pits[s]) > pgDist([e.x, e.y], S.pits[s])).length * 1.1; }); /* (the shells open as the raid finishes them, the far ones first) */
        if (S.job[me].side === s && G.p2.where[me] === 'L') A.say('The Warden is dead: the eggs open in a moment.'); return; }
      // (still up 46 s after it stood up: Shadow Molt again, Writhing Gestation again (more of its eggs turn), another Malice at 55.3 s)
      const r = G.p2.w2[s];
      if (cr(W2T(w, 'molt'))) { cast('warden', 'Warden: Shadow Molt', t, t + 3, { side: s, spell: 'molt' }); if (S.job[me].side === s && !window.__pgAuto && A.big) A.big('The Warden is still up: it starts over! Kill it before its next Writhing Gestation.', '#c38bff'); }
      if (cr(W2T(w, 'gest'))) r.gest = cast('warden', 'Warden: Writhing Gestation', t, t + 3, { side: s, spell: 'gest' });
      if (r.gest && !r.done && t >= r.gest.t1 + 0.3 && r.gest.t1 > r.gest.t0 + 2.9) { r.done = true; const W = w.at, near = G.eggs.filter((e) => e.side === s && e.state === 'floor').sort((a, b) => pgDist([a.x, a.y], W) - pgDist([b.x, b.y], W)).slice(0, s === 'E' ? 2 : 3);
        near.forEach((e, i) => { e.state = 'gone'; e.who = null; G.p2.cl['c2' + s + i] = { id: 'c2' + s + i, side: s, x: e.x, y: e.y, born: t, hp: 1, dead: null, set: 3 }; if (e.id === me) A.mistake('add', 'Your egg (#' + e.n + ') turned into a Clutch: the Warden lived long enough for a second Writhing Gestation.', 'Hit the Warden (Tab, then 1) so it dies about 3:38, before it starts over.', 0); });
        if (near.length && shareOf(s) && once('w2' + s)) A.mistake('add', 'The Warden lived long enough for a second Writhing Gestation: ' + near.length + ' more eggs turned into Clutches.', 'Hit the Warden (Tab, then 1) whenever nothing more urgent is up: it should die about 3:38.', 0); }
      if (cr(W2T(w, 'malice'))) { const t1 = t; S.malice.push({ side: s, k: 2, t0: t1, ch: t1 + 1.5, by: t1 + 2.4, t1: t1 + 7.5, c: cast('warden', 'Warden: Malice', t1, t1 + 1.5, { side: s, spell: 'malice', kick: true }), cc: cast('warden', 'Warden: Malice (channel)', t1 + 1.5, t1 + 7.5, { side: s, spell: 'malice', kick: true, by: t1 + 2.4 }) }); } }); };
  const clutches = (t0, t, dt) => { const me = A.me;
    // (set 1: the Warden's nearest eggs, 0.3 s after its Writhing Gestation; set 2: the south eggs, 0.7 s after the south big egg is picked up beside them)
    S.clutches.forEach((c) => { if (!G.p2.cl[c.id] && t >= c.up && G.p2.wd[c.side]) G.p2.cl[c.id] = { id: c.id, side: c.side, x: c.x, y: c.y, born: t, hp: 1, dead: null, set: 1 }; });
    S.south.forEach((q) => { const se = G.p2.se[q.id]; if (se.state === 'gest' && t >= se.at) { se.state = 'clutch'; G.p2.cl['c' + q.id] = { id: 'c' + q.id, side: q.side, x: q.x, y: q.y, born: t, hp: 1, dead: null, set: 2 }; } });
    // (the raid cleaves them, the oldest first, from 1.5 s after they turn: about 6.9 s each on the kills; a Clutch that dies leaves a Rawling on its spot)
    ['E', 'W'].forEach((s) => { const L0 = Object.values(G.p2.cl).filter((c) => c.side === s && c.dead == null && t >= c.born + 1.5).sort((a, b) => a.born - b.born); if (L0[0]) L0[0].hp -= P.CPACE * (1 - shareOf(s)) * dt; });
    Object.values(G.p2.cl).forEach((c) => { if (c.dead != null) return;
      if (c.hp <= 0) { c.dead = t; rawling(c.side, [c.x, c.y], t); return; }
      // (one the raid leaves 20 s hatches a Blightscale Viper (the guide; no kill let one live that long): Putrid Membrane on everyone)
      if (t >= c.born + T.CHATCH) { c.dead = t; c.hatched = true; G.adds.push({ kind: 'viper', x: c.x, y: c.y, born: t }); A.deb('putrid', 20, true);
        if (shareOf(c.side)) A.mistake('viper', 'A Clutch lived 20 s and hatched a Viper (Putrid Membrane on the whole raid).', 'Kill the glowing eggs as they turn: Tab picks one, then keep pressing 1.', 8); } }); };
  const rawlings = (t0, t, dt) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    ['E', 'W'].forEach((s) => { const L0 = G.adds.filter((a) => a.own && a.kind === 'rawling' && a.side === s).sort((a, b) => a.born - b.born);
      // (the raid's damage on the oldest; your share comes from your hits)
      if (L0[0] && t >= L0[0].born + 1.1) { const a = L0[0]; a.hp -= rpace(s, t) * (1 - shareOf(s)) * P.RHITS * dt; }
      L0.forEach((a) => { if (a.hp <= 0) { G.adds = G.adds.filter((q) => q !== a); if (G.tgt === a.id) G.tgt = null; return; }
        // (they go for their ledge's tank, as on the kills (98% of their hits are on tanks))
        const tp = pos(tankOf(s)), dx = tp[0] - a.x, dy = tp[1] - a.y, d = Math.hypot(dx, dy); if (d > 2.5) { const m = Math.min(d - 2.5, 4.5 * dt); a.x += dx / d * m; a.y += dy / d * m; } /* (slower than you, so a melee can catch one) */
        // (Boiling Venom at 25 s: +100% haste and damage; Acidic Expulsion 35.5 s after it spawned (a 1.2 s cast), then every 12 s: a hit on everyone near and a
        // stacking 35 s damage over time)
        if (cr(a.born + T.RBOIL)) a.boil = t;
        for (let k = 0; k < 4; k++) { const at = a.born + T.RACID + k * T.RACID2; if (cr(at - 1.2)) cast('rawling', 'Rawling: Acidic Expulsion', at - 1.2, at, { rid: a.id, side: s });
          if (cr(at)) { if (pgDist([G.x, G.y], [a.x, a.y]) <= 45) { A.hurt(18); A.deb('acid', 35, true); }
            if (shareOf(s) && once('acid')) A.mistake('add', 'A Rawling lived 35 s and cast Acidic Expulsion: a hit and a damage over time on everyone near.', 'Kill the Rawlings as they come out: Tab picks one, then keep pressing 1. They boil at 25 s.', 0); } } }); }); };
  // (a Weakened Doomscale climbs out 1.0 s after its big egg goes in: its Cries and Thrashes from then; the raid kills it about 43.9 s later; the first
  // to die gives the rest Revenge)
  const doomscales = (t0, t, dt) => { const me = A.me;
    S.ds.forEach((d) => { const at = G.p2.dsAt[d.id]; if (G.p2.dsS[d.id] || at == null || t < at) return; const st = G.p2.dsS[d.id] = { up: at, hp: 1, dead: null, rev: G.p2.rev };
      if (once('dsw')) S.warns.push({ t: t + 0.05, text: 'Weakened Doomscales: kick Anguished Cry!', c: '#c9d98a' }), S.warns.sort((a, b) => a.t - b.t);
      T.CRY.forEach((o, i) => { const c0 = at + o, len = st.rev != null ? 1.25 : 2.5; S.cries.push({ ds: d.id, side: d.side, dk: d.k, i: i + 1, t0: c0, t1: c0 + len, rev: st.rev != null, c: cast('ds', 'Doomscale: Anguished Cry', c0, c0 + len, { ds: d.id, side: d.side, spell: 'cry', kick: true }) }); });
      T.THRASH.forEach((o) => { const a1 = at + o, len = st.rev != null ? 1.5 : 3; S.dthrash.push({ ds: d.id, side: d.side, t0: a1 - len, at: a1, c: cast('ds', 'Doomscale: Desperate Thrash', a1 - len, a1, { ds: d.id, side: d.side, spell: 'thrash' }) }); }); });
    S.ds.forEach((d) => { const st = G.p2.dsS[d.id]; if (!st || st.dead != null || t < st.up + 1.5) return; st.hp -= (1 - shareOf(d.side) / 2) / T.DSLIFE * dt;
      if (st.hp > 0) return; st.dead = t; delete G.p2.ds[d.id]; if (G.tgt === d.id) G.tgt = null;
      S.casts.forEach((c) => { if (c.ds === d.id && c.t1 > t) { c.t1 = Math.max(c.t0, Math.min(c.t1, t)); if (c.t0 > t) c.t0 = c.t1 = -9; } });
      if (G.p2.rev != null) return; G.p2.rev = t; /* (the first death: Revenge on every Doomscale still up, 0.06 s later on the kills) */
      S.ds.forEach((o) => { const so = G.p2.dsS[o.id]; if (!so || so.dead != null) return; so.rev = t;
        S.cries.forEach((c) => { if (c.ds === o.id && c.t0 > t) { c.rev = true; c.t1 = c.t0 + 1.25; c.c.t1 = c.t1; c.c.name = 'Doomscale: Anguished Cry (Revenge)'; } });
        S.dthrash.forEach((f) => { if (f.ds === o.id && f.t0 > t) { f.t0 = f.at - 1.5; f.c.t0 = f.t0; } }); });
      const j = S.job[me], mate = S.ds.find((o) => o.side === d.side && o.id !== d.id), ms = mate && G.p2.dsS[mate.id], h = G.p2.dsHits;
      if (j && j.side === d.side && shareOf(d.side) && ms && ms.dead == null && ms.hp > 0.25 && (h[d.id] || 0) > (h[mate.id] || 0) + 6) A.mistake('even', 'You burned one Doomscale down long before the other: the rest got Revenge (Cries in 1.25 s, double damage).', 'Kill them evenly: Tab to the one with more health.', 0);
      else if (!window.__pgAuto) A.say('A Doomscale died: the others have Revenge (faster Cries, double damage).', true); }); };
  // (Virulent Spit: Ula'tek spits every 20 s from 3:23 (3:23.4, 3:43.5, 4:03.6, 4:23.6, measured; one helper a ledge): a green swirl under a raider on
  // each ledge that lands 6.5 s later (794k on the one hit on the 12 fastest kills: it's dodged). The 1st and 3rd on your ledge are under you, so you
  // practise stepping out)
  const spit = (t0, t) => { const me = A.me; T.spit.forEach((at, k) => { if (!(at > t0 && at <= t)) return;
    ['E', 'W'].forEach((s) => { const ids = P.half[s].filter((id) => G.p2.where[id] === 'L' && G.p2.wside[id] === s); if (!ids.length) return;
      const who = ids.includes(me) && k % 2 === 0 ? me : ids.filter((id) => id !== me)[(S.seed * 7 + k * 3 + (s === 'E' ? 1 : 0)) % Math.max(1, ids.length - (ids.includes(me) ? 1 : 0))] || ids[0], p = pos(who);
      S.impacts.push({ x: p[0], y: p[1], r: 5, t0: t, at: t + 6.5, name: 'Virulent Spit', dmg: 40, color: '#7ddc3a', fill: '#5fbf2a', tip: 'A green swirl under you: step out of it before it lands (6.5 s).' });
      if (who === me && !window.__pgAuto && A.big) A.big('Virulent Spit under you: step out of the green swirl!', '#7ddc3a'); }); }); };
  // (your hits on the Warden, a Clutch or a Doomscale (practice.js's hitTgt: a Rawling or a Viper it takes itself): your share of the raid's damage)
  const hit = (key) => { sync(); if (!G || !G.p2) return;
    if (key === 'wdE' || key === 'wdW') { const s = key.slice(2); if (G.p2.wd[s]) G.p2.whp[s] -= hitVal(P.SHARE / 20); return; }
    const c = G.p2.cl[key]; if (c && c.dead == null) { c.hp -= hitVal(1 / P.CHITS); return; }
    const st = G.p2.dsS[key]; if (st && st.dead == null) { st.hp -= hitVal(P.SHARE / 13.5); G.p2.dsHits[key] = (G.p2.dsHits[key] || 0) + 1; } };
  const check = (t0, t) => { sync(); const dt = t - t0, me = A.me;
    S.wardens.forEach((w) => { const p = wdAt(w, t); if (p) G.p2.wd[w.side] = p; else delete G.p2.wd[w.side]; });
    wardens(t0, t, dt); clutches(t0, t, dt); doomscales(t0, t, dt);
    S.ds.forEach((d) => { const p = dsWant(d, t); if (!p) { delete G.p2.ds[d.id]; return; } const c = G.p2.ds[d.id]; if (!c || pgDist([c.x, c.y], p) > 40) { G.p2.ds[d.id] = { x: p[0], y: p[1] }; return; }
      if (S.casts.some((q) => q.ds === d.id && t >= q.t0 && t <= q.t1)) return; /* (it stands still to cast, as in WoW: its frontal goes off where it stood) */ const ex = p[0] - c.x, ey = p[1] - c.y, ee = Math.hypot(ex, ey), sp = 9 * dt; if (ee > sp) { c.x += ex / ee * sp; c.y += ey / ee * sp; } else { c.x = p[0]; c.y = p[1]; } });
    gates(t); kicks(t0, t); tethers(t0, t); eggs(t0, t); big(t0, t); fans(t0, t); rawlings(t0, t, dt); spit(t0, t);
    // (the Ravenous Doomscale's Dread Roar lands: everyone stunned, a big hit)
    G.p2.rav.forEach((r) => { if (r.roar > t0 && r.roar <= t) { GDZ_RAID.forEach((id) => { G.p2.stun[id] = t + 6; }); A.deb('stun', 6); A.hurt(40); if (!window.__pgAuto) A.say('Dread Roar: everyone stunned. A wipe on a real pull.', true); } });
    // (your kick, a second before its bar: a call in the middle of the screen)
    if (!window.__pgAuto && A.big) { const k = myKicks(t + 1)[0]; if (k && t >= k.at - 1 && t < k.at && once('kc' + k.key)) A.big('Kick ' + k.kind + ' in 1 s: E!', '#ffd34d'); }
    if (A.has('vein')) G.hp -= 3 * G.debs.vein.n * dt * (A.has('def') ? 0.5 : 1);
    if (A.has('acid')) G.hp -= 2.2 * G.debs.acid.n * dt * (A.has('def') ? 0.5 : 1);
    G.p2.intr = G.p2.intr.filter((q) => t - q.t <= 1.6); G.p2.own = G.adds.filter((a) => a.own);
    if (stunned(me, t) && once('stun' + Math.floor(t))) A.clearTarget(); };

  // ---- the screen: your job now, what's next, the kick button ----
  // (your kicks: your ledge's Malice if it's yours (and its second, if the Warden lives that long), your Doomscale's Cries, and the one you're backing up)
  const myKicks = (t) => { const j = S.job[A.me]; if (!j) return []; const bk = G.p2.bk ? G.p2.bk.key : null;
    return S.malice.filter((m) => m.side === j.side && (j.mal || bk === 'm' + m.side + m.k)).map((m) => ({ at: m.t0, by: m.by, kind: 'Malice', key: 'm' + m.side + m.k }))
      .concat(S.cries.filter((c) => (c.side === j.side && c.dk === j.cry) || bk === 'c' + c.ds + c.i).map((c) => ({ at: c.t0, by: c.t1, kind: 'Anguished Cry', key: 'c' + c.ds + c.i, rev: c.rev }))).filter((k) => !G.p2.kick[k.key] && k.by >= t).sort((a, b) => a.at - b.at); };
  const jobText = () => { sync(); const t = G.t, me = A.me, j = S.job[me], w = G.p2.where[me], th = G.p2.teth[me], e = G.eggs.find((q) => q.id === me && q.state !== 'gone'), bi = j.big ? bigIx(j.side, j.big) : -1, bg = bi >= 0 ? G.p2.big[bi] : null, k = myKicks(t)[0];
    if (stunned(me, t)) return 'Stunned: ' + Math.ceil(G.p2.stun[me] - t) + ' s.';
    if (k && G.p2.bk && G.p2.bk.key === k.key && t >= k.at) return 'Backup: ' + A.nm(G.p2.bk.who) + '\'s kick is on cooldown. Kick ' + k.kind + ' now! (E)';
    if (w === 'p0') return t < T.gate ? 'Phase 2: your half crosses to the ' + SD[j.side] + ' ledge. Your gate opens in ' + Math.ceil(T.gate - t) + ' s.' : 'Walk into your gate (the gold ring, ' + SD[j.side] + ' side) to cross to your ledge.';
    if (w === 'L' && G.p2.wside[me] !== j.side) return 'Wrong ledge: take this ledge\'s gate back, then your own.';
    if (k && t >= k.at - 5) return t < k.at ? 'Your kick: ' + k.kind + ' in ' + Math.ceil(k.at - t) + ' s. Press E as its cast bar starts.' : 'Kick ' + k.kind + ' now! (E)' + (k.rev ? ' Revenge: its bar is only 1.25 s.' : '');
    if (th && th.br == null && t >= T.fangs && wdUp(th.side)) { const bt = th.solo ? T.solo : T.five; return th.solo ? (t < bt ? 'Grasping Fangs: you break alone. To the edge of your tether now (about 20 yards; you\'re slowed), then past 25 yards at 3:26 (' + Math.ceil(bt - t) + ' s).' : 'Break now: walk past 25 yards from the Warden.') : t < bt - 5.5 ? 'Grasping Fangs: you\'re one of the five. At 3:28 go to the edge of your tether (20 yards; you\'re slowed), out together at 3:34.' : t < bt ? 'To the edge of your tether: out together in ' + Math.ceil(bt - t) + ' s.' : 'Break now: step out past 25 yards!'; }
    const fl = S.impacts.find((m) => t >= m.t0 && t <= m.at && Math.hypot(G.x - m.x, G.y - m.y) < m.r + 3); if (fl) return 'Falling Debris: step out of the brown circle!';
    if (w === 'L' && t >= S.home[me] && t < T.heart) return 'Back to her: walk into your gate (the gold ring).';
    const dh = A.dpsHint && A.dpsHint(); if (dh) return dh;
    if (w === 'L' && wdUp(j.side)) return G.eggs.some((q) => q.state === 'floor' && Math.hypot(G.x - q.x, G.y - q.y) < P.WARD + 1) ? 'Step off the egg: Warden\'s Protection nicks anyone on one while the Warden lives.' : 'The Warden: kill it with your half (about 3:38), off the eggs.' + (e ? ' Your egg (#' + e.n + ') opens when it dies.' : '');
    if (e && e.state === 'floor') return t < e.shell ? 'Your egg (#' + e.n + ', gold) opens in ' + Math.ceil(e.shell - t) + ' s: wait by it.' : 'Pick up your egg (#' + e.n + ') now: walk over it.';
    if (e && e.state === 'held') return t < T.throwAt ? 'Carry your egg to your lane spot by the cauldron (gold). Keep your ring off theirs (about 4 yards). In together in ' + Math.ceil(T.throwAt - t) + ' s.' : 'Into the cauldron now: stand in its ring.';
    const bt = j.big ? S.bigAt[j.side][j.big] : 0;
    if (bg && bg.state === 'floor' && t < T.doomEnd) return t < bt - 16 ? 'The ' + NS[j.big] + ' big egg waits at the ' + NS[j.big] + ' end of your ledge. Go to it at ' + clk(bt - 16) + ', pick it up at ' + clk(bt) + '.' : t < bt ? 'By the ' + NS[j.big] + ' big egg: pick it up in ' + Math.ceil(bt - t) + ' s, once the small eggs are in.' : 'Pick up the big egg now, before Hatching Doom ends (' + Math.ceil(T.doomEnd - t) + ' s).';
    if (bg && bg.state === 'held') return 'Big egg: into the cauldron before it hatches (' + Math.ceil(20 - (t - bg.at)) + ' s).';
    if (dsOut(j.side) && t < T.home) return 'Doomscales: behind or beside them, never in front (their frontal goes at the tank).';
    if (t >= T.heart) return 'The heart is open: step out of the brown circles.';
    if (w === 'p1') return 'By her for the heart burn at 4:55. Keep out of the front of the Doomscales.';
    const nx = S.timers.find((q) => q.t > t); return nx ? 'Next: ' + nx.name + ' in ' + Math.ceil(nx.t - t) + ' s.' : ''; };
  const upNext = (t) => { sync(); const me = A.me, j = S.job[me], L0 = [], add = (at, text, c) => { if (at > t && at - t <= 30) L0.push({ at, text, c }); };
    if (G.p2.where[me] === 'p0') add(T.gate, 'Your gate opens', '#c084ff');
    myKicks(t).forEach((k) => add(k.at, 'Your kick: ' + k.kind, '#b06bff'));
    const th = G.p2.teth[me]; if (th && th.br == null) add(th.solo ? T.solo : T.five, th.solo ? 'Your solo break' : 'Break with the five', '#ff8a6a'); else if (t < T.fangs) add(T.fangs, 'Grasping Fangs', '#ff8a6a');
    const e = G.eggs.find((q) => q.id === me && q.state !== 'gone'); if (e) { add(e.shell, 'Your egg opens', '#f3c969'); add(T.throwAt, 'Small eggs in', '#f5d33a'); }
    if (j.big) add(S.bigAt[j.side][j.big], 'Pick up the ' + NS[j.big] + ' big egg', '#e6b450');
    T.debris.forEach((d) => add(d - 2, 'Falling Debris', '#c8a36a')); add(S.home[me], 'Back to her', '#c084ff'); add(T.heart, 'Heart open', '#ff8a5a'); if (!dsOut(j.side)) add(dsNext(j.side), 'Doomscales', '#c9d98a'); add(T.clutch, 'Clutches: kill them', '#c38bff');
    return L0.sort((a, b) => a.at - b.at).slice(0, 3); };
  const acts = () => '<div class="pg-act" data-a="kick"><b>E</b><span>Kick</span><i></i></div>';
  const hud = (t) => { const el = A.$('.pg-act[data-a="kick"]'); if (!el || !G.p2) return; const left = 15 - (t - G.p2.kickCd); el.querySelector('i').style.height = !range(A.me) ? '100%' : left > 0 ? (left / 15 * 100).toFixed(1) + '%' : '0'; el.title = range(A.me) ? 'Kick (E): ' + range(A.me) + ' yards' : 'Healers have no kick in Midnight'; };

  // ---- the start card: your ledge, role, egg, kicks and tether ----
  const ui = { tab: 'egg' };
  const ledgeSvg = () => { const s = pk.side, U = pgP2Eggs()[s === 'E' ? 'R' : 'L'], X = (p) => p[0].toFixed(1), Y = (p) => (-p[1]).toFixed(1), vb = (s === 'E' ? '42' : '-154') + ' -94 112 188';
    const tx = (p, t, c, sz) => '<text pointer-events="none" x="' + X(p) + '" y="' + Y(p) + '" fill="' + (c || '#e8edf2') + '" font-size="' + (sz || 4.4) + '" text-anchor="middle" font-weight="700" paint-order="stroke" stroke="#05070a" stroke-width="' + ((sz || 4.4) * 0.28).toFixed(2) + '">' + esc(t) + '</text>';
    const hit = (v, label, on, inner) => '<g class="pg-jhit" tabindex="0" role="button" data-p2e="' + v + '" aria-label="' + esc(label) + '" aria-pressed="' + on + '"><title>' + esc(label) + '</title>' + inner + '</g>';
    const pit = pgP2L(s, P.pit), gate = pgP2L(s, P.land), wd = pgP2L(s, P.fight);
    return '<svg viewBox="' + vb + '" style="max-height:430px;width:auto;margin:0 auto" role="group" aria-label="Your egg on the ' + SD[s] + ' ledge"><image href="' + PG_UL.art + '" x="' + (-PG_UL.artW / 2).toFixed(1) + '" y="' + (-(PG_UL.artY + PG_UL.artH / 2)).toFixed(1) + '" width="' + PG_UL.artW.toFixed(1) + '" height="' + PG_UL.artH.toFixed(1) + '" preserveAspectRatio="none" opacity=".55"/>' +
      '<circle cx="' + X(pit) + '" cy="' + Y(pit) + '" r="' + P.THROW + '" fill="rgba(176,107,255,.12)" stroke="#b06bff" stroke-width=".7"/>' + tx([pit[0], pit[1] - 2], 'Cauldron', '#d6b8ff', 4) +
      '<circle cx="' + X(gate) + '" cy="' + Y(gate) + '" r="2.6" fill="none" stroke="#c084ff" stroke-width=".7"/>' + tx([gate[0], gate[1] + 4], 'Gate', '#d6b8ff', 3.8) + '<circle cx="' + X(wd) + '" cy="' + Y(wd) + '" r="2.4" fill="#5b2a8c" stroke="#c89bff" stroke-width=".6"/>' + tx([wd[0], wd[1] - 6], 'Warden', '#c89bff', 3.8) +
      U.map((p, i) => { const v = 'n' + (i + 1), on = pk.egg === v; return hit(v, 'Small egg ' + (i + 1), on, '<circle cx="' + X(p) + '" cy="' + Y(p) + '" r="3.1" fill="' + (on ? '#f3c969' : 'rgba(10,12,16,.85)') + '" stroke="' + (on ? '#fff' : '#e6e0c8') + '" stroke-width=".55"/>') + tx([p[0], p[1] - 1.5], String(i + 1), on ? '#1a1405' : '#fff', 4); }).join('') +
      ['far', 'close'].map((w) => { const p = pgP2L(s, P[w]), on = pk.egg === w; return hit(w, 'The ' + NS[w] + ' big egg', on, '<ellipse cx="' + X(p) + '" cy="' + Y(p) + '" rx="3.6" ry="4.6" fill="' + (on ? '#f3c969' : '#6a5320') + '" stroke="' + (on ? '#fff' : '#e6b450') + '" stroke-width=".6"/>') + tx([p[0] + (s === 'E' ? 15 : -15), p[1] - 1.3], w === 'far' ? 'South big egg' : 'North big egg', on ? '#f3c969' : '#e6b450', 3.8); }).join('') + '</svg>'; };
  const seg = (k, opts, cur, dis) => '<div class="pg-seg pg-jseg">' + opts.map(([v, t]) => '<button type="button" data-' + k + '="' + v + '" aria-pressed="' + (String(v) === String(cur)) + '"' + (String(v) === String(cur) ? ' class="on"' : '') + (dis ? ' disabled' : '') + '>' + esc(t) + '</button>').join('') + '</div>';
  // (a melee can't kick from the end of a tether: the 2nd Malice comes as the solo walks out, the 3rd as the five do; raids hand that kick on)
  // (the one Malice comes at 3:04, the tethers at 3:16: nothing clashes any more. Kept so the card's markup stays the same)
  const clash = () => '';
  const card = () => { fix(); const heal = pk.role === 'h', tab = ui.tab; let body;
    if (tab === 'egg') body = '<div class="pg-jobp"><div class="pg-jmap">' + ledgeSvg() + '</div><div class="pg-jside"><p><b>Your egg.</b> Click your small egg (its number on your raid\'s plan) or a big egg.</p><p>' +
      (pk.egg === 'far' || pk.egg === 'close' ? esc('Picked: the ' + NS[pk.egg] + ' big egg. Pick it up at ' + (pk.egg === 'far' ? '4:09' : '4:13 or 4:16 (one ledge\'s healer goes first)') + ', once the small eggs are in, and have it in by 4:27.') : pk.egg ? esc('Picked: small egg ' + pk.egg.slice(1) + '. Pick it up once the Warden is dead, then into the cauldron at 3:56.') : 'Picked: no egg.') + '</p>' +
      '<button type="button" class="pg-btn pg-jno' + (pk.egg ? '' : ' on') + '" data-p2e="none" aria-pressed="' + !pk.egg + '">No egg</button></div></div>';
    else if (tab === 'kick') body = '<div class="pg-p2kick"><p><b>Malice.</b> Your ledge\'s Warden casts it once, at ' + clk(T.malice) + ' (its tank kicks it if you don\'t). Do you kick it?</p>' + seg('p2m', [[0, 'No'], [1, 'Kick it · ' + clk(T.malice)]], pk.mal, heal) +
      '<p><b>Anguished Cry.</b> Each Doomscale on your ledge casts it three times, 8 s after it climbs out (about 4:33) and every 16 s. Kick one Doomscale\'s three?</p>' + seg('p2c', [[0, 'None'], [1, 'Doomscale 1'], [2, 'Doomscale 2']], pk.cry, heal) +
      '<p>' + (heal ? 'Healers have no kick in Midnight (only a Restoration Shaman).' : 'Press E during the cast bar: melee within 8 yards, ranged within 30.') + '</p>' + clash() + '</div>';
    else body = '<div class="pg-p2kick"><p><b>Grasping Fangs (3:16).</b> Six tethers, three on each ledge, on anyone. One player breaks alone, then the other five break together.</p>' +
      seg('p2t', [['random', 'Random'], ['solo', 'Solo break'], ['five', 'One of the five'], ['none', 'No tether']], pk.teth) +
      '<p>' + ({ random: 'You always get one: alone or one of the five, at random each run.', solo: 'You walk out past 25 yards from the Warden at 3:26, alone.', five: 'At 3:28 go to the edge of your tether (20 yards); step out on the count at 3:34.', none: 'You stay with your half; the bots take the tethers.' })[pk.teth] + '</p>' + clash() + '</div>';
    return '<div class="pg-optrow pg-jrole"><span>Ledge</span>' + seg('p2s', [['W', 'West'], ['E', 'East']], pk.side) + '<span>Role</span>' + seg('p2r', [['m', 'Melee'], ['r', 'Ranged'], ['h', 'Healer']], pk.role) + '</div>' +
      '<div class="pg-jtabs">' + seg('p2tab', [['egg', 'Egg'], ['kick', 'Kicks'], ['teth', 'Tether']], tab) + '</div>' + body; };
  const bind = (box, refresh) => { box.onclick = (e) => { const b = e.target.closest('[data-p2s],[data-p2r],[data-p2tab],[data-p2e],[data-p2m],[data-p2c],[data-p2t]'); if (!b || b.disabled) return; const d0 = b.dataset;
      if (d0.p2s) pk.side = d0.p2s; if (d0.p2r) pk.role = d0.p2r; if (d0.p2tab) ui.tab = d0.p2tab; if (d0.p2e) pk.egg = d0.p2e === 'none' ? null : d0.p2e; if (d0.p2m != null) pk.mal = +d0.p2m; if (d0.p2c != null) pk.cry = +d0.p2c; if (d0.p2t) pk.teth = d0.p2t;
      const fk = ['p2s', 'p2r', 'p2tab', 'p2e', 'p2m', 'p2c', 'p2t'].find((k) => d0[k] != null), sel = fk ? '[data-' + fk + '="' + d0[fk] + '"]' : null, refocus = e.detail === 0;
      fix(); save(); box.innerHTML = card(); refresh(); if (refocus && sel) { const nb = box.querySelector(sel); if (nb && nb.focus) nb.focus(); } };
    box.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.pg-jhit')) { e.preventDefault(); e.stopPropagation(); e.target.closest('.pg-jhit').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })); } }; };
  const role = () => { fix(); const id = slotOf(pk), egg = pk.egg === 'far' || pk.egg === 'close' ? 'the ' + NS[pk.egg] + ' big egg' : pk.egg ? 'small egg ' + pk.egg.slice(1) : 'no egg';
    return { id, name: RN[pk.role], job: SD[pk.side][0].toUpperCase() + SD[pk.side].slice(1) + ' ledge · ' + egg + (pk.mal ? ' · Malice' : '') + (pk.cry ? ' · Anguished Cry' : '') }; };
  // ---- the shared setup screen (Nov 15, Flex via Main: "fix the setup menus ... still too complex and confusing"): a role, then one job in plain words.
  // Your ledge stays as remembered, a small egg's number is your slot's own, and the tether comes at random, like the real fight. The north big egg is a
  // healer's and the south one a melee's (the kills); healers carry no small eggs and have no kick (Midnight) ----
  const SJ = { m: [['mal', 'Kick Malice'], ['cry', 'Kick the Cry'], ['egg', 'Small egg'], ['big', 'South big egg']], r: [['egg', 'Small egg'], ['cry', 'Kick the Cry'], ['none', 'No egg']], h: [['big', 'North big egg'], ['none', 'No egg']] };
  const jobNow = (j) => (j.egg === 'far' || j.egg === 'close' ? 'big' : j.mal ? 'mal' : j.cry ? 'cry' : j.egg ? 'egg' : 'none');
  const setupCard = { roles: ['m', 'r', 'h'],
    now: () => { fix(); const r = pk.role, v = jobNow(pk); return { role: r, job: SJ[r].some((x) => x[0] === v) ? v : SJ[r][0][0] }; },
    jobs: (r) => (SJ[r] || []).map((x) => x.slice()),
    set: (r, v) => { if (!SJ[r]) return; if (!SJ[r].some((x) => x[0] === v)) v = SJ[r][0][0]; const D = pgP2Base(), side = pk.side === 'W' ? 'W' : 'E', mine0 = P.half[side].find((id) => id[0] === r && D[id].egg);
      pk = { side, role: r, egg: v === 'big' ? (r === 'h' ? 'close' : 'far') : v === 'egg' ? 'n' + (mine0 ? D[mine0].egg : 6) : null, mal: v === 'mal' ? 1 : 0, cry: v === 'cry' ? 1 : 0, teth: 'random' }; fix(); save(); },
    say: () => { const v = setupCard.now().job; return ({ mal: 'You cross to your ledge and kick the Warden\'s Malice at ' + clk(T.malice) + ' with E, then break your tether (alone at 3:26 or with the five at 3:34) and follow the plan to the heart burn.',
      cry: 'You cross to your ledge, break your tether (alone at 3:26 or with the five at 3:34), then kick your Doomscale\'s Anguished Cry with E each time it casts (about ' + crN.map(clk).join(', ') + ').',
      egg: 'You cross to your ledge, break your tether (alone at 3:26 or with the five at 3:34) and carry a small egg into the cauldron once the Warden dies.',
      big: 'You cross to your ledge and carry the ' + (pk.role === 'h' ? 'north' : 'south') + ' big egg into the cauldron before Hatching Doom runs out, after breaking your tether (alone at 3:26 or with the five at 3:34).',
      none: 'You cross to your ledge, break your tether (alone at 3:26 or with the five at 3:34), help kill the Warden and the Doomscales, and keep out of the frontals and the falling rocks.' })[v]; } };
  const asg = () => { fix(); const L0 = [], s = SD[pk.side];
    L0.push(['Cross over (2:47)', 'Walk into your gate (the gold ring on the ' + s + ' side of the platform). Your half fights on the ' + s + ' ledge.']);
    L0.push(['The Warden (2:55)', 'Kill it with your half (it dies about 3:38). Kill the glowing Clutches it makes first (3:04), then the Rawlings that come out of them.' + (pk.mal ? ' Kick its Malice (' + clk(T.malice) + ') with E.' : ' Its tank kicks its Malice.')]);
    L0.push(['Grasping Fangs (3:16)', ({ random: 'You always get a tether, the solo or one of the five at random. Solo: walk out past 25 yards at 3:26. One of the five: to the edge of your tether at 3:28, out together at 3:34.', solo: 'You break alone: walk out past 25 yards from the Warden at 3:26.', five: 'One of the five: to the edge of your tether (20 yards) at 3:28, out together at 3:34.', none: 'No tether: the bots break theirs (one at 3:26, five at 3:34).' })[pk.teth]]);
    if (pk.egg === 'far' || pk.egg === 'close') L0.push(['The ' + NS[pk.egg] + ' big egg', 'It waits at your ledge\'s ' + (pk.egg === 'far' ? 'south' : 'north') + ' end. ' + (pk.egg === 'far' ? 'Go to it at 3:53, pick it up at 4:09' : 'Go to it at about 3:58, pick it up at 4:13 or 4:16 (one ledge\'s healer goes first, the other about 2.5 s later)') + ' (after the small eggs), into the cauldron by 4:27. It hatches 20 s after you pick it up: a wipe.']);
    else if (pk.egg) L0.push(['Small egg ' + pk.egg.slice(1), 'Pick it up once the Warden is dead (3:38) and Blight Vein has dropped. Carry it to your lane spot at the cauldron, keeping your ring off theirs (about 4 yards), and throw it in with the others at 3:56.']);
    else L0.push(['No egg', 'Keep out of the carriers\' rings.']);
    L0.push(['Small eggs in: Rawlings (3:56)', 'A Rawling climbs out of the cauldron for every egg: kill them before they boil (25 s).']); L0.push(['The Doomscales (about 4:26)', 'Behind or beside them, never in front: their frontal goes at the tank.' + (pk.cry ? ' Kick Doomscale ' + pk.cry + '\'s Anguished Cry each time (about ' + crN.map(clk).join(', ') + ').' : '')]);
    L0.push(['Back to her (4:38)', 'Take your gate back. The heart opens at 4:55: step out of the brown circles.']); L0.push(['Falling Debris', 'Also at 3:50, 4:30 and 5:17: step out of the brown circles.']);
    return '<ul class="pg-asg">' + L0.map(([a, b]) => '<li><b>' + esc(a) + '</b><span>' + esc(b) + '</span></li>').join('') + '</ul>'; };
  // (the start card's "Your job in short" (practice.js pick(), Nov 15, Flex: "improve the setup screens. Still a little convoluted"): four plain
  // lines, your ledge and gate, your egg and kicks, your tether, the heart; the full rundown (asg) folds away under it)
  const short = () => { fix(); const s = SD[pk.side], ord = ['', '1st', '2nd', '3rd'], L0 = [];
    L0.push(s[0].toUpperCase() + s.slice(1) + ' ledge: cross through your gate (the gold ring) at 2:47.');
    const egg = pk.egg === 'far' || pk.egg === 'close' ? 'The ' + NS[pk.egg] + ' big egg: pick it up at ' + (pk.egg === 'far' ? '4:09' : '4:13 or 4:16') + ', in by 4:27' : pk.egg ? 'Small egg ' + pk.egg.slice(1) + ': pick it up when the Warden dies, into the cauldron at 3:56' : 'No egg: keep out of the carriers\' rings';
    const kk = [pk.mal ? 'the Warden\'s Malice (' + clk(T.malice) + ')' : '', pk.cry ? 'Doomscale ' + pk.cry + '\'s Anguished Cry' : ''].filter(Boolean);
    L0.push(egg + (kk.length ? '. Kick (E) ' + kk.join(' and ') : '') + '.');
    L0.push(({ random: 'Tether: you get one every run, at random: break alone at 3:26 or with the five at 3:34.', solo: 'Tether: you break alone at 3:26, past 25 yards from the Warden.', five: 'Tether: to its edge at 3:28, out with the five at 3:34.', none: 'No tether: stay with your half.' })[pk.teth]);
    L0.push('Back to her at 4:38: burn the heart, step out of the brown circles.');
    return '<ul class="pg-short">' + L0.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'; };
  // ---- hitting the right thing (Nov 15, Flex: "can we look at adding the dps mechanics in"; practice.js does the rest: Tab or a click picks a target,
  // you hit it in range (melee 5 yards, others 40), a moment spent mostly on it counts, a miss is one line). The targets: your ledge's Warden while it
  // lives, the Weakened Doomscales, any Viper, the heart while it's open. The moments, most urgent first: a Viper (deadly), the heart (the second burn,
  // 4:55 to 5:15), the Doomscales (from 4:29, killed evenly; the guide), the Warden (before its next Writhing Gestation, dead by 3:38) ----
  // (each target with its health for the target frame and the ring round it: the adds' own, the Warden's and the Doomscales' from the raid's damage)
  const tgts = (t) => { sync(); const L0 = []; if (!G || !G.p2) return L0;
    G.adds.forEach((a) => { if (a.kind !== 'viper' && !a.own) return; a.id = a.id || 'a' + (G.addN = (G.addN || 0) + 1);
      if (a.kind === 'viper') L0.push({ key: a.id, kind: 'viper', name: 'Blightscale Viper', p: [a.x, a.y], r: 1.6, hp: a.hp == null ? 5 : a.hp, max: 5, hpFr: Math.max(0, a.hp == null ? 1 : a.hp / 5) });
      else L0.push({ key: a.id, kind: 'rawling', side: a.side, name: 'Blightscale Rawling' + (a.boil ? ' (boiling)' : ''), p: [a.x, a.y], r: 1.1, hp: Math.max(0, a.hp), max: P.RHITS, hpFr: Math.max(0, a.hp / P.RHITS) }); });
    Object.values(G.p2.cl).forEach((c) => { if (c.dead == null) L0.push({ key: c.id, kind: 'clutch', side: c.side, name: 'Blightscale Clutch · ' + Math.max(0, Math.ceil(c.born + T.CHATCH - t)) + ' s', p: [c.x, c.y], r: 1.4, hp: Math.max(0, c.hp) * 10, max: 10, hpFr: Math.max(0, c.hp) }); });
    if (t >= T.heart && t < T.heartEnd) L0.push({ key: 'heart', kind: 'heart', name: 'Venomous Heart', p: S.heart.slice(), r: 3 });
    // (kill them evenly (the guide): on your ledge the right one is the one with the most health, or any within 5% of it)
    const js = (S.job[A.me] || {}).side, top = Math.max(0, ...S.ds.filter((d) => d.side === js && G.p2.ds[d.id] && G.p2.dsS[d.id]).map((d) => G.p2.dsS[d.id].hp));
    S.ds.forEach((d) => { const c = G.p2.ds[d.id], st = G.p2.dsS[d.id]; if (c && st && t >= st.up + 1.5) L0.push({ key: d.id, kind: d.side === js && st.hp < top - 0.05 ? 'dsx' : 'ds', side: d.side, name: 'Weakened Doomscale ' + d.k + (st.rev != null ? ' (Revenge)' : ''), p: [c.x, c.y], r: 2.6, hp: Math.max(0, st.hp) * 100, max: 100, hpFr: Math.max(0, st.hp) }); });
    S.wardens.forEach((w) => { const p = G.p2.wd[w.side]; if (p && t >= w.molt) L0.push({ key: w.id, kind: 'warden', side: w.side, name: 'Doomscale Warden', p: p.slice(), r: 2.5, hp: Math.max(0, G.p2.whp[w.side]) * 100, max: 100, hpFr: Math.max(0, G.p2.whp[w.side]) }); });
    return L0; };
  // (the moment that matters most now, on your ledge: a Viper, a Clutch (it hatches at 20 s), the heart, a Rawling, the Doomscales, the Warden)
  // (while you carry an egg, carrying it is your job: no damage moment then)
  const dpsCat = (t) => { sync(); if (!G || !G.p2) return null; const j = S.job[A.me], s = j && j.side, here = G.p2.where[A.me] === 'L' && G.p2.wside[A.me] === s, near = (p) => pgDist(p, [G.x, G.y]) < 45;
    if (G.adds.some((a) => a.kind === 'viper')) return 'viper'; if (G.eggs.some((e) => e.who === A.me && e.state === 'held') || G.p2.big.some((b) => b.who === A.me && b.state === 'held')) return null;
    if (here && Object.values(G.p2.cl).some((c) => c.side === s && c.dead == null && pgDist([c.x, c.y], [G.x, G.y]) < (A.me[0] === 'm' ? 12 : 40))) return 'clutch'; /* (one within your reach soon: a melee 12 yards (they die in seconds), others their 40) */
    if (t >= T.heart && t < T.heartEnd) return 'heart'; if (dsOut(s) && Object.keys(G.p2.ds).some((id) => G.p2.dsS[id] && t >= G.p2.dsS[id].up + 1.5)) return 'ds'; /* (once Doomscales are out, they come first: the raid cleaves the last Rawlings along, as on the kills) */ if (G.adds.some((a) => a.own && a.side === s && pgDist([a.x, a.y], [G.x, G.y]) < (A.me[0] === 'm' ? 25 : 40) && pgP2Ledge(a.x, a.y, 0.4) === pgP2Ledge(G.x, G.y, 0.4))) return 'rawling'; /* (one on your side of the venom) */
    if (Object.keys(G.p2.ds).some((id) => G.p2.dsS[id] && t >= G.p2.dsS[id].up + 1.5)) return 'ds'; return j && G.p2.wd[s] && t >= T.clutch ? 'warden' : null; };
  const dpsNames = (DL) => { const k = new Set(DL.map((m) => m.kind)); return ['warden', 'clutch', 'rawling', 'ds', 'heart', 'viper'].filter((x) => k.has(x)).map((x) => ({ warden: 'the Warden', clutch: 'the Clutches', rawling: 'the Rawlings', ds: 'the Doomscales', heart: 'the heart', viper: 'the Vipers' })[x]).join(', '); };
  // (the bar under your target's frame: your target's cast, gold when you can kick it; "Interrupted" a moment after a kick lands on it; with no target,
  // Ula'tek's own (Rage of the Shackled))
  const castOf = (t) => { sync(); if (!G || !G.p2) return null; const k = G.tgt;
    if (k) { const iq = G.p2.intr.find((q) => q.caster === k && t - q.t <= 0.9); if (iq) return { who: 'x', name: 'Interrupted (' + (iq.who === A.me ? 'you' : A.nm(iq.who)) + ')', t0: iq.t, t1: iq.t + 0.9, intr: true };
      const side = k === 'wdE' ? 'E' : k === 'wdW' ? 'W' : null, c = S.casts.find((q) => t >= q.t0 && t <= q.t1 && ((side && q.who === 'warden' && q.side === side) || (q.ds && q.ds === k) || (q.rid && q.rid === k)));
      if (c) return { ...c, kick: !!c.kick && (c.by == null || t <= c.by) }; }
    return S.casts.find((q) => q.who === 'boss' && t >= q.t0 && t <= q.t1) || null; };
  const starts = [[0, '2:46 · The split'], [190, '3:10 · The tethers'], [216, '3:36 · The small eggs'], [248, '4:08 · The big eggs'], [266, '4:26 · The Doomscales'], [284, '4:44 · The heart burn']];

  // ---- the minimap: the whole room, both ledges ----
  const mini = (mx, Wm, Hm, t) => { sync(); const sc = Wm / 330, M = (x, y) => [Wm / 2 + x * sc, Hm / 2 - y * sc], dot = (x, y, r, c, st) => { const [a, b] = M(x, y); mx.beginPath(); mx.arc(a, b, r, 0, Math.PI * 2); if (c) { mx.fillStyle = c; mx.fill(); } if (st) { mx.strokeStyle = st; mx.lineWidth = 1.2; mx.stroke(); } };
    mx.clearRect(0, 0, Wm, Hm); mx.fillStyle = 'rgba(8,10,14,.82)'; mx.fillRect(0, 0, Wm, Hm); mx.fillStyle = 'rgba(120,140,110,.28)';
    const MK = pgP2Mask(); Object.keys(MK).forEach((k) => { if (+k % 2) return; MK[k].forEach(([a, b]) => { const p = M(a, +k + 1); mx.fillRect(p[0], p[1], (b - a) * sc, 2 * sc + 0.5); }); });
    const oct = [[36.5, 12.5], [15, 34], [-15, 34], [-36.5, 12.5], [-36.5, -12.5], [-15, -34], [15, -34], [36.5, -12.5]].map((q) => M(q[0], q[1])); mx.beginPath(); oct.forEach((q, i) => (i ? mx.lineTo(q[0], q[1]) : mx.moveTo(q[0], q[1]))); mx.closePath(); mx.fill();
    Object.values(S.pits).forEach((p) => dot(p[0], p[1], P.THROW * sc, null, '#b06bff'));
    S.gates.forEach((g) => { if (t >= g.t0 && t <= g.t1) dot(g.p[0], g.p[1], 2.5, '#c084ff'); });
    S.impacts.forEach((m) => { if (t >= m.t0 && t <= m.at) dot(m.x, m.y, m.r * sc, 'rgba(255,90,60,.35)'); });
    G.eggs.forEach((e) => { if (e.state === 'floor') dot(e.x, e.y, 1.4, e.id === A.me ? '#f3c969' : '#e9e2c6'); });
    S.big.forEach((B, i) => { if (G.p2.big[i].state === 'floor') dot(B.x, B.y, 2, '#e6b450'); });
    Object.values(G.p2.wd).forEach((p) => dot(p[0], p[1], 2.6, '#9b5cff')); Object.values(G.p2.ds).forEach((d) => dot(d.x, d.y, 2.4, '#c9d98a'));
    dot(S.her[0], S.her[1], 3.4, '#2f6a22', '#b6f23a');
    GDZ_RAID.forEach((id) => { if (id !== A.me) dot(G.bots[id].x, G.bots[id].y, 1.4, GDZ_ROLE[id[0]][1]); }); dot(G.x, G.y, 2.6, '#fff', '#000');
    if (A.v3) { const f = A.v3.fwd(), [a, b] = M(G.x, G.y); mx.beginPath(); mx.moveTo(a, b); mx.lineTo(a + f[0] * 12, b - f[1] * 12); mx.strokeStyle = '#f3c969'; mx.lineWidth = 2; mx.stroke(); } };
  // ---- 3D only (Flex): the 2D canvas says so while 3D loads, or if it can't ----
  const draw2d = (cx, cv) => { const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), Wd = Math.max(1, Math.round(r.width * dpr)), Hd = Math.max(1, Math.round(r.height * dpr)); if (cv.width !== Wd || cv.height !== Hd) { cv.width = Wd; cv.height = Hd; }
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#07090c'; cx.fillRect(0, 0, cv.width, cv.height); cx.textAlign = 'center'; cx.fillStyle = '#e8edf2'; cx.font = '800 ' + Math.round(22 * dpr) + 'px system-ui, sans-serif';
    cx.fillText(A.busy ? 'Loading 3D…' : 'Phase 2 plays in 3D', cv.width / 2, cv.height / 2 - 14 * dpr); cx.fillStyle = '#aab4c0'; cx.font = '600 ' + Math.round(15 * dpr) + 'px system-ui, sans-serif';
    cx.fillText(A.busy ? 'The ledges and the cauldron are on their way.' : 'Press 3D under the minimap. If this PC can\'t show 3D, try phase 1.', cv.width / 2, cv.height / 2 + 16 * dpr); };

  // ---- the bots' audit (window.__pgDbg.audit): what practice.js's own audit can't see in phase 2 ----
  const auditStep = (t0, t, add) => { sync(); const cr = (at) => at > t0 && at <= t;
    GDZ_RAID.forEach((id) => { const p = pos(id), j = S.job[id];
      if (cr(T.wardens + 1) && (G.p2.where[id] !== 'L' || G.p2.wside[id] !== j.side)) add('not on their ledge at 2:56', id, t);
      if (cr(T.rage + 2) && G.p2.where[id] !== 'p1') add('not back by her at 4:50', id, t);
      if (G.eggs.some((e) => e.state === 'floor' && wdUp(e.side) && Math.hypot(p[0] - e.x, p[1] - e.y) <= P.WARD)) add('standing on a protected egg', id, t);
      G.p2.fan.forEach((f) => { if (cr(f.at) && f.tank !== id && inFan(f, p[0], p[1])) add('in a Desperate Thrash', id, t); }); });
    G.p2.tlog.splice(0).forEach(([id, bt, okT]) => { if (!okT) add('broke their tether off the count ' + clk(bt), id, bt); });
    G.p2.missed.splice(0).forEach(([id, what]) => add(what, id || '?', t));
    if (cr(T.throwAt + 7)) G.eggs.forEach((e) => { if (e.state !== 'gone') add('small egg not in by 4:05', e.id || '?', t); });
    S.big.forEach((B, i) => { if (cr(S.bigAt[B.side][B.which] + T.hold + 3) && G.p2.big[i].state !== 'in') add('big egg not in 18 s after its pickup', holder('big', B.side, B.which) || '?', t); });
    Object.values(G.p2.cl).forEach((c) => { if (c.hatched && cr(c.dead)) add('a Clutch hatched a Viper', '?', t); }); };

  // ---- 3D: the shapes for this part (practice3d.js's pg3dShapes adds them to the list it draws) ----
  const shapes = (t, P3, h) => { sync(); if (!G || !G.p2) return; const me = A.me, j = S.job[me] || {};
    S.gates.forEach((g) => { if (t >= g.t0 - 1 && t <= g.t1) { const yours = g.side === j.side; P3({ k: 'gate', x: g.p[0], y: g.p[1], c: yours ? '#f3c969' : '#c084ff' }); h.ring(g.p[0], g.p[1], 2.4, yours ? '#f3c969' : '#c084ff', 1, 0.3, true); h.label(g.p[0], g.p[1], 6, g.back ? 'Gate: back to her' : 'Gate: ' + SD[g.side] + ' ledge', yours ? '#f3c969' : '#d6b8ff', 13); } });
    Object.entries(S.pits).forEach(([s, p]) => { P3({ k: 'cauldron', x: p[0], y: p[1] }); const carry = G.eggs.some((e) => e.who === me && e.state === 'held') || G.p2.big.some((b) => b.who === me && b.state === 'held'); h.disc(p[0], p[1], P.THROW, '#b06bff', 0.07); h.ring(p[0], p[1], P.THROW, carry && s === j.side ? '#f3c969' : '#b06bff', 0.9, 0.3, carry && s === j.side); h.label(p[0], p[1], 7, 'Doomscale Cauldron', '#d6b8ff', 13); });
    G.eggs.forEach((e) => { if (e.state === 'floor' && wdUp(e.side)) { h.disc(e.x, e.y, P.WARD, '#7fbf3a', 0.05); h.ring(e.x, e.y, P.WARD, '#7fbf3a', 0.55, 0.18); } });
    const myE = G.eggs.find((e) => e.who === me && e.state === 'held'); if (myE && !dsOut(myE.side)) { const q = slot(myE.side, myE.n); h.disc(q[0], q[1], 1.3, '#f3c969', 0.18); h.ring(q[0], q[1], 1.3, '#f3c969', 1, 0.25, true); h.label(q[0], q[1], 2.8, 'Your lane spot', '#f3c969', 13); }
    // (a cast bar over a caster, as a ring round it that fills, gold while you can kick it; its name and seconds left over it; "Interrupted" after a kick)
    const castRing = (x, y, r, c, who) => { const kk = c.kick && (c.by == null || t <= c.by), f = Math.max(0.02, Math.min(1, (t - c.t0) / Math.max(0.1, c.t1 - c.t0)));
      P3({ k: 'arc', x, y, r, f, c: kk ? '#ffd34d' : '#b06bff', o: 1 }); h.label(x, y, who === 'ds' ? 7.8 : 8.6, c.name.replace(/^[^:]+: /, '') + (kk ? ': kick! ' : ' ') + Math.max(0, c.t1 - t).toFixed(1), kk ? '#ffe9a0' : '#e3c7ff', kk ? 16 : 13); };
    const intrAt = (key, x, y, hh) => { const q = G.p2.intr.find((z) => z.caster === key); if (!q) return false; h.label(x, y, hh, 'Interrupted · ' + (q.who === me ? 'you' : A.nm(q.who)), '#ffffff', 15); return true; };
    S.wardens.forEach((w) => { const p = G.p2.wd[w.side]; if (!p) return; P3({ k: 'warden', x: p[0], y: p[1] }); const go = G.p2.gone.find((q) => q.side === w.side && t >= q.by && t <= q.t1), c = S.casts.find((q) => q.who === 'warden' && q.side === w.side && t >= q.t0 && t <= q.t1);
      if (go) P3({ k: 'dome', x: p[0], y: p[1], r: 4, c: '#b06bff', o: 0.22 + 0.1 * Math.sin(t * 12) });
      if (!intrAt(w.id, p[0], p[1], 8.6)) { if (c) castRing(p[0], p[1], 3.6, c, 'warden'); else h.label(p[0], p[1], 7.5, 'Doomscale Warden', '#c89bff', 13); }
      if (j.mal && j.side === w.side && G.p2.wdead[w.side] == null) h.ring(p[0], p[1], 4.4, '#f3c969', 0.7, 0.2); /* (your kick's caster: a gold ring under it) */
      Object.entries(G.p2.teth).forEach(([id, th]) => { if (th.side !== w.side || th.br != null) return; const q = pos(id); P3({ k: 'tether', x0: p[0], y0: p[1], x1: q[0], y1: q[1], c: id === me ? '#f3c969' : '#ff5a4f' }); if (id === me) h.ring(p[0], p[1], P.TETHER, '#f3c969', 0.75, 0.3, true); }); });
    S.big.forEach((B, i) => { const st = G.p2.big[i], mineB = holder('big', B.side, B.which) === me; if (st.state === 'floor') { P3({ k: 'begg', x: B.x, y: B.y, h: 0 }); if (mineB) { h.ring(B.x, B.y, 3, '#f3c969', 1, 0.3, true); h.label(B.x, B.y, 6.5, 'Your big egg' + (t >= T.doom ? ' · ' + Math.max(0, Math.ceil(T.doomEnd - t)) + ' s' : ''), '#f3c969', 14); } else if (t >= T.back) h.label(B.x, B.y, 6, 'Doomscale Egg', '#e6b450', 12); }
      else if (st.state === 'held') { const q = pos(st.who); P3({ k: 'begg', x: q[0], y: q[1], h: 4.4 }); if (st.who === me) h.label(q[0], q[1], 8.5, 'Into the cauldron · ' + Math.max(0, 20 - (t - st.at)).toFixed(0) + ' s', '#f3c969', 14); } });
    S.ds.forEach((d) => { const c = G.p2.ds[d.id], st = G.p2.dsS[d.id]; if (!c || !st) return; const cc = S.casts.find((q) => q.ds === d.id && t >= q.t0 && t <= q.t1), rv = st.rev != null;
      P3({ k: 'dscale', id: d.id, x: c.x, y: c.y, climb: Math.min(1, (t - st.up) / 1.5), rev: rv });
      if (!intrAt(d.id, c.x, c.y, 7.8)) { if (cc) castRing(c.x, c.y, 3.6, cc, 'ds'); else h.label(c.x, c.y, 7, 'Weakened Doomscale ' + d.k + (rv ? ' · Revenge' : ''), rv ? '#ff9b8a' : '#c9d98a', 13); }
      if (j.side === d.side && (j.cry === d.k || bkCry(me) === d.k)) { h.ring(c.x, c.y, 4.2, '#f3c969', 0.8, 0.22, true); h.label(c.x, c.y, 10, 'Your kick', '#f3c969', 13); } /* (your Doomscale, marked as a raid marks it) */
      const gone = S.cries.find((q) => q.ds === d.id && G.p2.kick['c' + q.ds + q.i] === 'none' && t >= q.t1 && t <= q.t1 + 0.8); if (gone) P3({ k: 'shock', x: c.x, y: c.y, r: P.CRY * Math.min(1, (t - gone.t1) / 0.8), c: '#ffd23b' }); });
    G.p2.fan.forEach((f) => { if (t >= f.t0 && t <= f.at + 0.3) P3({ k: 'fan', x: f.p[0], y: f.p[1], a: f.dir, r: P.FAN.r, half: P.FAN.half * Math.PI / 180, c: '#ff9b4a', o: t > f.at ? 0.45 : 0.14 + 0.16 * Math.min(1, (t - f.t0) / (f.at - f.t0)) }); });
    // (the Clutches: purple, glowing, pulsing faster as their 20 s run out; the south eggs before the big egg's pickup turns them; the Rawlings' boil and
    // Acidic Expulsion; a Ravenous Doomscale and its Dread Roar)
    Object.values(G.p2.cl).forEach((c) => { if (c.dead != null) return; const left = c.born + T.CHATCH - t; P3({ k: 'clutch', x: c.x, y: c.y, p: left }); if (c.side === j.side || pgDist([c.x, c.y], [G.x, G.y]) < 30) h.label(c.x, c.y, 3.6, 'Clutch · ' + Math.max(0, Math.ceil(left)) + ' s', left < 6 ? '#ff8f87' : '#d9b8ff', 13); });
    S.south.forEach((q) => { const se = G.p2.se[q.id]; if (t >= q.up && se.state !== 'clutch') P3({ k: 'egg', x: q.x, y: q.y, h: 0 }); });
    G.adds.forEach((a) => { if (!a.own) return; const c = S.casts.find((q) => q.rid === a.id && t >= q.t0 && t <= q.t1); if (c) castRing(a.x, a.y, 2, c, 'rawling'); }); /* (a boiling one's red ring: practice3d.js draws it for every add with a.boil) */
    G.p2.rav.forEach((r) => { P3({ k: 'rav', x: r.x, y: r.y }); const c = r.c; if (t >= c.t0 && t <= c.t1) castRing(r.x, r.y, 5, c, 'rav'); else h.label(r.x, r.y, 10, 'Ravenous Doomscale', '#ff8f87', 15);
      if (t >= r.roar && t <= r.roar + 0.9) P3({ k: 'shock', x: r.x, y: r.y, r: 60 * Math.min(1, (t - r.roar) / 0.9), c: '#ff5a4f' }); });
    if (t >= T.heart && t < T.heartEnd + 0.5) { const hp = S.heart; h.disc(hp[0], hp[1], 3, '#5a0f22', 0.6); h.ring(hp[0], hp[1], 3, '#ff5a7a', 1, 0.3); P3({ k: 'heart', x: hp[0], y: hp[1] }); h.label(hp[0], hp[1], 6.5, 'Venomous Heart', '#ff9fb2', 14); }
    if (stunned(me, t)) h.label(G.x, G.y, 5.2, 'STUNNED', '#ffd23b', 15); };

  return { part: 2, script: (o) => pgP2Script({ ...(o || {}), me: A.me, pick: mine() ? pk : null }), init, home, job, slow, check, kick, bossHp, onPlat: pgP2Floor, bossAt: () => ({ p: (A.S || {}).her || [46, 0], up: true }), tailAt: () => ({ p: [0, 0], up: false }),
    jobText, upNext, acts, hud, card, bind, role, asg, short, setup: setupCard, starts, tgts, dpsCat, dpsNames, hit, castOf, mini, draw2d, auditStep, shapes,
    // (back on the platform for the heart burn, the bots use practice.js's dodge too, for the small tails' waves: the platform is flat there, as in phase 1)
    // (a kicker with a kick due holds its place instead: a missed Cry stuns everyone, worse than a wave)
    dodges: (id, t) => !!(G && G.p2 && t >= T.rage),
    // (Noxious Splash: two small-egg carriers within 4.3 yards hatch both eggs (21 real splashes, median 4.3; Flex, Nov 15: "Yes, use measured"))
    splash: 4.3,
    // (and its escapes keep out of a Doomscale's frontal that's casting: a wave's way out mustn't lead into one)
    unsafe: (id, x, y, t) => !!(G && G.p2 && G.p2.fan.some((f) => t >= f.t0 && t <= f.at + 0.2 && f.tank !== id && inFan(f, x, y, 1.5))),
    // (after a start-at fast-forward: practice.js empties the adds, so the Rawlings alive then come back; the backup kick is the player's to have)
    ff: () => { sync(); if (G && G.p2) { G.wipes = 0; G.p2.kickCd = -99; G.p2.wardT = -99; G.p2.stun = {}; G.p2.missed = []; G.p2.tlog = []; G.p2.bk = null; G.p2.bkSeen = 0; (G.p2.own || []).forEach((a) => { if (!G.adds.includes(a)) G.adds.push(a); }); } },
    clean: 'Every kick landed, your tether broke on the count, your eggs went in clean, the adds died before they boiled, and you kept out of the frontals and the debris. Try another job.',
    get pick() { return pk; }, set pick(j) { if (jobOk(j)) pk = j; }, slotOf, mine, clash, get T() { return T; } };
}
// (the part on the start card's Part switch, after phase 1; `?practice=2` on the guide opens it)
PG_PARTS["Ula'tek"].m2 = { name: 'Phase 2', d: 'm', end: PG_P2_T.end, roles: [{ id: 'r5', name: 'Ranged', job: 'East ledge' }], mod: pgP2 };

// ---- 3D (practice3d.js calls pg3dP2(K) once when the 3D view opens for a phase 2 game; K is its kit: three.js, the scene, keep, pool, flat,
// fxMat, glw, the shared shapes and textures). Builds the side ledges as stone, and returns put(shape, t) for this part's own shapes (pgP2's
// shapes()): the gates, the cauldrons, the Wardens, the tethers, the big eggs, the Doomscales, the frontal cones and Anguished Cry's shockwave;
// frame(G) keeps the sun's shadows round you out on a ledge. ----
function pg3dP2(K) {
  const T = K.T, scene = K.scene, keep = K.keep, M = pgP2Mask();
  // the ledges: each row of the floor joined to the next as one smooth strip (the platform's stone slabs on top, 4 yards deep, a pale rim on the
  // inner edge over the venom); where a row splits, a plain block
  const P = [], N = [], U = [], I = [], RP = [], RI = [];
  const quad = (a, b, c, d, n) => { const v = P.length / 3; [a, b, c, d].forEach((q) => { P.push(q[0], q[1], -q[2]); N.push(n[0], n[1], -n[2]); U.push(q[0], q[2]); }); I.push(v, v + 1, v + 2, v, v + 2, v + 3); };
  const wall = (x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, n = [dy / l, 0, -dx / l]; quad([x0, 0, y0], [x0, -4, y0], [x1, -4, y1], [x1, 0, y1], n); };
  const rim = (x0, y0, x1, y1, w) => { const v = RP.length / 3; [[x0, y0], [x0 + w, y0], [x1 + w, y1], [x1, y1]].forEach((q) => RP.push(q[0], 0.025, -q[1])); RI.push(v, v + 1, v + 2, v, v + 2, v + 3); };
  const side = (y, sgn) => (M[y] || []).filter(([a, b]) => (sgn > 0 ? a > 0 : b < 0));
  [1, -1].forEach((sgn) => { for (let y = -96; y < 96; y++) { const A0 = side(y, sgn), A1 = side(y + 1, sgn);
    if (A0.length === 1 && A1.length === 1) { const [a0, b0] = A0[0], [a1, b1] = A1[0]; quad([a0, 0, y], [b0, 0, y], [b1, 0, y + 1], [a1, 0, y + 1], [0, 1, 0]);
      wall(a1, y + 1, a0, y); wall(b0, y, b1, y + 1); if (sgn > 0) rim(a0, y, a1, y + 1, 0.6); else rim(b0, y, b1, y + 1, -0.6);
      if (!side(y - 1, sgn).length) wall(a0, y, b0, y); if (!side(y + 2, sgn).length) wall(b1, y + 1, a1, y + 1); }
    else A0.forEach(([a, b]) => { quad([a, 0, y - 0.5], [b, 0, y - 0.5], [b, 0, y + 0.5], [a, 0, y + 0.5], [0, 1, 0]); wall(a, y + 0.5, a, y - 0.5); wall(b, y - 0.5, b, y + 0.5); wall(a, y - 0.5, b, y - 0.5); wall(b, y + 0.5, a, y + 0.5); }); } });
  const lg = keep(new T.BufferGeometry()); lg.setAttribute('position', new T.Float32BufferAttribute(P, 3)); lg.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); lg.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); lg.setIndex(I);
  const ledge = new T.Mesh(lg, keep(new T.MeshStandardMaterial({ map: K.slab, roughness: 0.9, side: T.DoubleSide }))); ledge.receiveShadow = true; scene.add(ledge);
  const rg = keep(new T.BufferGeometry()); rg.setAttribute('position', new T.Float32BufferAttribute(RP, 3)); rg.setIndex(RI);
  const rimM = new T.Mesh(rg, keep(new T.MeshBasicMaterial({ color: 0xc9d2d8, transparent: true, opacity: 0.5, depthWrite: false, side: T.DoubleSide }))); rimM.renderOrder = 5; scene.add(rimM);
  // (the rock spires out in the venom stood on the ledges: moved out past the room's walls)
  scene.children.forEach((o) => { if (!o.isInstancedMesh) return; const m4 = new T.Matrix4(), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3();
    for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, s); const r = Math.hypot(p.x, p.z) || 1, k = (185 + (i % 5) * 14) / r; p.x *= k; p.z *= k; m4.compose(p, q, s); o.setMatrixAt(i, m4); } o.instanceMatrix.needsUpdate = true; });
  const BALL = K.BALL, CONE = K.CONEG, glw = K.glw;
  const stdM = (c, e, x) => keep(new T.MeshStandardMaterial(Object.assign({ color: c, emissive: e || 0, roughness: 0.5 }, x || {})));
  // (a Warlock's gateway: a ring of fel-purple on the floor, a column of light, a slow swirl)
  const gate = K.pool(() => { const g = new T.Group(), rm = stdM(0x5a1d8c, 0x7a2ad8), r = new T.Mesh(keep(new T.TorusGeometry(2.3, 0.22, 10, 48)), rm), cm = K.fxMat(3, '#c084ff', true), c = new T.Mesh(K.WALLG, cm), sw = new T.Mesh(K.UDISC, keep(new T.MeshBasicMaterial({ color: 0x9a4dff, transparent: true, opacity: 0.35, depthWrite: false, blending: T.AdditiveBlending })));
    r.rotation.x = Math.PI / 2; r.position.y = 0.25; c.scale.set(2.1, 7, 2.1); c.renderOrder = 650; sw.scale.set(2.1, 1, 2.1); sw.position.y = 0.06; sw.renderOrder = 12; g.add(r, c, sw); g.userData = { rm, cm, sw }; return g; });
  // (the cauldron in each ledge's pit: a stone bowl with a bubbling purple brew and its glow)
  const caul = K.pool(() => { const g = new T.Group(), bowl = new T.Mesh(keep(new T.TorusGeometry(4.2, 1.2, 12, 40)), stdM(0x3a3632, 0x0a0806, { roughness: 0.95 })), brew = new T.Mesh(K.UDISC, stdM(0x4a1a6a, 0x8a3ac8, { roughness: 0.2 })), bub = new T.Group(), bm = stdM(0xb98aff, 0x6a2ab0);
    bowl.rotation.x = Math.PI / 2; bowl.position.y = 0.9; bowl.castShadow = true; brew.scale.set(3.8, 1, 3.8); brew.position.y = 1.1; for (let i = 0; i < 9; i++) bub.add(new T.Mesh(BALL, bm)); g.add(bowl, brew, bub); g.userData = { bub }; return g; });
  // (the Doomscale Warden: a hulking serpent-kin in dark scales with a fel crest)
  const WARDM = stdM(0x2a1838, 0x12061e, { roughness: 0.45 }), CRESTM = stdM(0x9b5cff, 0x5a2aa8);
  const warden = K.pool(() => { const g = new T.Group(), b = new T.Mesh(BALL, WARDM), h = new T.Mesh(BALL, WARDM); b.scale.set(1.8, 2.6, 1.6); b.position.y = 2.6; h.scale.set(1.1, 1, 1.4); h.position.set(0, 5.4, 0.6); b.castShadow = h.castShadow = true; g.add(b, h);
    for (let i = 0; i < 5; i++) { const c = new T.Mesh(CONE, CRESTM); c.scale.setScalar(0.45 - i * 0.04); c.position.set(0, 6.3 - i * 0.9, -0.6 - i * 0.25); c.rotation.x = -0.5; g.add(c); } [-0.45, 0.45].forEach((x) => { const e = new T.Mesh(BALL, CRESTM); e.scale.setScalar(0.18); e.position.set(x, 5.6, 1.85); g.add(e); }); return g; });
  // (a Blightscale Clutch: an egg swollen purple and glowing, its pulse quickening as it nears hatching)
  const CLM = stdM(0x6a2a9a, 0x5a1a8a, { roughness: 0.3 });
  const clutch = K.pool(() => { const m = new T.Mesh(BALL, CLM); m.castShadow = true; return m; });
  // (the Ravenous Doomscale: a Doomscale grown huge and blood-red, full of fury)
  const RAVM = stdM(0x7a1a14, 0x3a0604, { roughness: 0.5 });
  const rav = K.pool(() => { const g = new T.Group(), b = new T.Mesh(BALL, RAVM), n = new T.Mesh(BALL, RAVM), h = new T.Mesh(BALL, RAVM); b.scale.set(3.4, 2.6, 4.8); b.position.y = 2.7; n.scale.set(1.4, 1.4, 2.4); n.position.set(0, 4.6, 3.9); h.scale.set(1.4, 1.1, 2); h.position.set(0, 5.5, 6); b.castShadow = n.castShadow = h.castShadow = true; g.add(b, n, h); return g; });
  // (a Weakened Doomscale: a heavy, scarred drake-serpent, olive and grey, rising out of the cauldron's pit; with Revenge, a red glow)
  const DSM = stdM(0x56603a, 0x141a06, { roughness: 0.6 });
  const dscale = K.pool(() => { const g = new T.Group(), b = new T.Mesh(BALL, DSM), n = new T.Mesh(BALL, DSM), h = new T.Mesh(BALL, DSM); b.scale.set(2.2, 1.7, 3.2); b.position.y = 1.8; n.scale.set(0.9, 0.9, 1.6); n.position.set(0, 3, 2.6); h.scale.set(0.9, 0.75, 1.3); h.position.set(0, 3.6, 4); b.castShadow = n.castShadow = h.castShadow = true; g.add(b, n, h);
    for (let i = 0; i < 5; i++) { const c = new T.Mesh(CONE, CRESTM); c.scale.setScalar(0.38); c.position.set(0, 3.4, 1.5 - i * 1.1); g.add(c); } return g; });
  // (the big Doomscale Egg: twice a small egg, gold-brown and glowing)
  const BEGGM = stdM(0xb08a3a, 0x3a2a08, { roughness: 0.35 });
  const begg = K.pool(() => { const m = new T.Mesh(BALL, BEGGM); m.scale.set(1.5, 1.95, 1.5); m.castShadow = true; return m; });
  // (a tether: a thin glowing line from the Warden to the bitten player)
  const teth = K.pool(() => { const m = new T.Mesh(K.BEAMG, K.fxMat(1, '#ff5a4f', true)); m.renderOrder = 640; return m; });
  const FANS = new Map(), fanG = (half) => { const key = half.toFixed(3); let g = FANS.get(key); if (!g) { g = K.flatG(keep(new T.CircleGeometry(1, 32, -half, 2 * half))); FANS.set(key, g); } return g; };
  const V1 = new T.Vector3(), V2 = new T.Vector3(), V3 = new T.Vector3(), UP = new T.Vector3(0, 1, 0), faceIn = (x, y) => Math.atan2(-x, y);
  const put = (s, t) => { const k = s.k, by = K.baseY(s.x, s.y);
    if (k === 'gate') { const g = gate(), u = g.userData; g.position.set(s.x, by, -s.y); g.rotation.y = t * 0.8; K.col(u.rm, s.c); u.cm.uniforms.uO.value = 0.5 + 0.15 * Math.sin(t * 4); u.sw.rotation.y = -t * 2; glw(s.x, by + 1.5, -s.y, 5, s.c, 0.5); return true; }
    if (k === 'cauldron') { const g = caul(); g.position.set(s.x, by, -s.y); g.userData.bub.children.forEach((b, i) => { const ph = (t * 0.7 + i * 0.37) % 1, a = i * 2.4, rr = 0.6 + (i % 4) * 0.7; b.position.set(Math.cos(a) * rr, 1.1 + ph * 0.8, Math.sin(a) * rr); b.scale.setScalar(0.25 + 0.2 * Math.sin(ph * Math.PI)); }); glw(s.x, by + 2.2, -s.y, 9, '#9a4dff', 0.45); return true; }
    if (k === 'warden') { const g = warden(); g.position.set(s.x, by, -s.y); g.rotation.y = faceIn(s.x, s.y) + Math.PI + Math.sin(t * 0.9) * 0.08; return true; }
    if (k === 'dscale') { const g = dscale(), c = s.climb == null ? 1 : s.climb; g.position.set(s.x, by - 5 * (1 - c), -s.y); g.rotation.y = faceIn(s.x, s.y) + Math.PI + Math.sin(t * 1.1) * 0.1; if (s.rev) glw(s.x, by + 2.5, -s.y, 6, '#ff3b2f', 0.4 + 0.15 * Math.sin(t * 6)); return true; }
    if (k === 'clutch') { const m = clutch(), sp = s.p < 6 ? 9 : 4, z = 1 + 0.08 * Math.sin(t * sp); m.scale.set(1.05 * z, 1.35 * z, 1.05 * z); m.position.set(s.x, by + 1.3, -s.y); glw(s.x, by + 1.3, -s.y, 3.6, s.p < 6 ? '#ff6bd0' : '#b06bff', 0.45 + 0.2 * Math.sin(t * sp)); return true; }
    if (k === 'rav') { const g = rav(); g.position.set(s.x, by, -s.y); g.rotation.y = faceIn(s.x, s.y) + Math.PI + Math.sin(t * 1.4) * 0.12; glw(s.x, by + 3, -s.y, 9, '#ff3b2f', 0.35 + 0.1 * Math.sin(t * 5)); return true; }
    if (k === 'begg') { const m = begg(), z = s.h > 0 ? 0.62 : 1, h0 = by + (s.h || 0) + 1.9 * z; m.scale.set(1.5 * z, 1.95 * z, 1.5 * z); m.position.set(s.x, h0 + (s.h > 0 ? Math.sin(t * 4) * 0.15 : 0), -s.y); m.rotation.y = t * 0.4; glw(s.x, h0, -s.y, 4.5 * z, '#ffcf5a', 0.35 + 0.15 * Math.sin(t * 3)); return true; }
    if (k === 'tether') { V1.set(s.x0, K.baseY(s.x0, s.y0) + 4.2, -s.y0); V2.set(s.x1, K.baseY(s.x1, s.y1) + 1.3, -s.y1); V3.subVectors(V2, V1); const len = V3.length(), m = teth(), u = m.material.uniforms; m.position.copy(V1); m.quaternion.setFromUnitVectors(UP, V3.normalize()); m.scale.set(0.14, len, 0.14); K.ucol(u.uC, s.c); u.uLen.value = len * 1.2; u.uO.value = 0.9; return true; }
    if (k === 'fan') { K.flat(fanG(s.half), s.x, s.y, s.r, s.r, s.a, s.c, s.o, false); return true; }
    if (k === 'shock') { if (s.r > 0.5) K.flat(K.URING, s.x, s.y, s.r, s.r, 0, s.c, 0.85 * (1 - s.r / 60), false); return true; }
    return false; };
  // (the sun's shadow box follows you, so the ledges get shadows too)
  const frame = (G) => { if (!G || !K.sun) return; K.sun.position.set(G.x - 34, 72, -G.y + 26); K.sun.target.position.set(G.x, 0, -G.y); K.sun.target.updateMatrixWorld(); };
  return { put, frame, ledge };
}
