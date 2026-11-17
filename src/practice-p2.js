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
  throwAt: 236, back: 243, bigUp: 257.5, bigN: [255.5, 257], bigIn: 267.5, hold: 15, s2hit: 241.6, s2die: 253.5, dsUp: 268, home: 278.5, rage: 288, heart: 294.5, heartEnd: 314.5, debris: [230, 270, 317], end: 318,
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
  // (each ledge's two Weakened Doomscales by the Plan's raid markers (ui.js, the Mythic kick lines as the team's wowutils plan lays them out): Moon and Cross
  // on the west (left) ledge, Skull and Diamond on the east (right); Doomscale 1, from the south big egg, takes the first)
  mk: { E: ['Skull', 'Diamond'], W: ['Moon', 'Cross'] },
  // the Blightscale Clutches' spots (where the Warden's Writhing Gestation turns its nearest small eggs, the same on every kill: 2 east, 3 west) and the
  // four south eggs that come up about 3:55 (2 a ledge), beside the south big eggs. Real yards, not mirrored (the two ledges differ)
  clutch: { E: [[94, 55], [90, 63]], W: [[-82, 56], [-80, 59], [-76, 60]] }, south: { E: [[69, -78], [67, -74]], W: [[-67, -75], [-63, -74]] },
  // sizes: the tether breaks past 25 yards (the guide's picture), Warden's Protection 3 (spell 1306858: on the kills it hits players standing a median
  // 2.6 yards from an egg, about 43k a hit, a minor tick), the cauldron takes an egg within 9 (my pick), kicks reach 8 yards for melee and 30 for
  // ranged, Anguished Cry stuns within 60 (spell 1305650), Desperate Thrash's cone (the guide's picture)
  TETHER: 25, WARD: 3, THROW: 9, KICK: { m: 8, t: 8, r: 30, h: 0 }, CRY: 60, FAN: { r: 14, half: 25 },
  // (where the game counts you, the same as the ring drawn round it (the prompts audit, Nov 16): your gate takes you inside 2.8 yards, you pick up your big egg
  //  inside its 3. Practice.js's Go-here arrow goes away 2.5 yards from its spot, so stopping there now always counts)
  GATE: 2.8, BIG: 3,
  // your share of the raid's damage on your ledge's adds as a damage dealer (training wheels: a quarter, so leaving them shows: a Warden you never hit
  // lives to its second Writhing Gestation and Malice), how many of your hits
  // kill a Rawling or a Clutch on their own, and the raid's pace on each ledge (Rawlings: oldest first, slower while the Warden or the Doomscales take
  // its damage; set so 7 or so boil a pull, as on the kills)
  SHARE: 0.25, RHITS: 6, CHITS: 8, RPACE: { warden: 0.11, eggs: 0.24, ds: 0.17 }, CPACE: 0.34,
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
  // (the two south small eggs a ledge: two of its ranged or melee with no big egg carry them, the ranged first; never you)
  SIDES.forEach((s) => { let k = 0; P.half[s].filter((id) => id !== me && !J[id].big && (id[0] === 'r' || id[0] === 'm')).sort((a, b) => (a[0] === 'r' ? 0 : 1) - (b[0] === 'r' ? 0 : 1)).slice(0, 2).forEach((id) => { J[id].south = ++k; }); });
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
  const cast = (who, name, t0, t1, x) => { const c = { who, name, t0, t1, ...(x || {}) }; S.casts.push(c); return c; }, warn = (t, text, c, you) => S.warns.push({ t, text, c: c || '#ff8f87', ...(you ? { you: 1 } : {}) }), timer = (t, name) => S.timers.push({ t, name });
  S.job = pgP2Jobs(seed, o.me, o.pick);
  // (the calls (Nov 16, the prompts audit; Flex: "Lets improve the curated experience as the game guides players onto what they need to do next", then "i feel
  //  like the game confuses people saying timestamps"): each one "Mechanic: order", the order in plain words with no clock time or seconds (the boss-mod bars
  //  count); a call about you only to you (mj: your job, when the game knows who you are), worded with "your" so it shows gold, a raid-wide one without; a
  //  call about your next step waits while one of your own steps is under 3 s away)
  const mj = (o.me && S.job[o.me]) || null, heal = !!o.me && o.me[0] === 'h', GOLD = '#f3c969', RED = '#ff5a4f';
  // the gates (a Warlock's gateway each way, not measured): open from 2:47, the tanks first; back from 4:38.5
  S.gates = ['E', 'W'].flatMap((s) => [{ side: s, back: false, p: L(s, P.gateP), to: L(s, P.land), t0: T.gate, t1: T.wdie }, { side: s, back: true, p: L(s, P.land), to: L(s, P.gateP), t0: T.home, t1: T.heart }]);
  S.cross = {}; S.home = {}; ['E', 'W'].forEach((s) => P.half[s].forEach((id, i) => { S.cross[id] = id[0] === 't' ? T.gate + 0.4 : T.gate + 1 + i * 0.45; S.home[id] = id[0] === 't' ? T.home + 0.2 : S.job[id].cry ? T.home + 0.5 + S.job[id].cry * 0.2 : T.home + 1 + i * 0.45; })); /* (a Doomscale's kicker goes right behind the tank that drags it, so its Cry on the way is still in reach) */
  // (the calls' orders capitalised, "Mechanic: Order!" (the review of the prompt fixes, Nov 16); phase 2's own call as it starts, short (Flex, Nov 16: the opening "feels off"))
  warn(T.start, 'Phase 2: Go to your ledge!', '#c084ff', 1); timer(T.gate, 'Gates open');
  // Hatching Doom (2:54): each ledge's two big Doomscale Eggs, 90 s to pick up
  // (its order only to whoever it's for (the review, Nov 16: "pick up the big eggs" went to every role): a big egg's carrier hears it comes last, the rest to leave them)
  if (mj && mj.big) warn(T.doom, 'Hatching Doom: Get your big egg after the small eggs!', GOLD, 1); else warn(T.doom, 'Hatching Doom: Leave the big eggs to their carriers!', '#e6b450');
  timer(T.doomEnd, 'Hatching Doom ends');
  // (the big eggs' pickups (Flex, Nov 15: "i think the first healer picks it up right away, and the second one is delayed"; the 30 fastest Mythic kills:
  // the melee take the south eggs first, about 4:06 to 4:10; then the healers the north ones, the first a median 4:13, the second a median 2.5 s
  // later, middle half 1.3 to 4.7; which ledge's healer goes first, from the run's seed)
  const nFirst = side() < 0.5 ? 'E' : 'W'; S.bigAt = { E: { far: T.bigUp, close: T.bigN[nFirst === 'E' ? 0 : 1] }, W: { far: T.bigUp + 0.5, close: T.bigN[nFirst === 'W' ? 0 : 1] } }; S.nFirst = nFirst;
  // (both of a ledge's big eggs go in on one count (the 30 fastest kills: a median 0.2 s apart, 22 of 30 within 2 s; south 4:28.0, north 4:29.2); the ledge whose
  // healer went first counts first, about 4:29 and 4:31)
  S.bigIn = { E: S.bigAt.E.close + 10.5, W: S.bigAt.W.close + 10.5 }; /* (the count waits for the north healer's 100-yard run (on the kills the north egg goes in 9.8 s after its pickup), and comes before the 4:30 debris lands on the cauldron) */
  S.big = ['E', 'W'].flatMap((s) => ['far', 'close'].map((w) => { const p = L(s, P[w]); return { side: s, which: w, x: p[0], y: p[1] }; }));
  S.pits = { E: L('E', P.pit), W: L('W', P.pit) };
  // the Wardens (2:55): pulled across the line, Shadow Molt toward the eggs (3 s), Writhing Gestation (3 s), killed by the raid about 3:38
  S.wardens = ['E', 'W'].map((s) => ({ side: s, id: 'wd' + s, spawn: L(s, P.wSpawn), at: L(s, P.fight), up: T.wardens, molt: T.molt + 3, dies: T.wdie }));
  ['E', 'W'].forEach((s) => { cast('warden', 'Warden: Shadow Molt', T.molt, T.molt + 3, { side: s, spell: 'molt' }); cast('warden', 'Warden: Writhing Gestation', T.gest, T.gest + 3, { side: s, spell: 'gest' }); });
  warn(T.molt + 3 - 1, heal ? 'Doomscale Wardens: Stay with your half, off the eggs' : 'Doomscale Wardens: Hit the Warden, stay off the eggs', '#b06bff', heal); /* (1 s before it can be hit, as the skipping ahead ends: "Hit the Warden" at 2:55 came 4.6 s before its Shadow Molt ended, Nov 17) */ timer(T.wardens, 'Wardens'); timer(T.gest + 3, 'Writhing Gestation');
  // (the Clutches: the Warden's nearest small eggs, 0.3 s after its Writhing Gestation; the four south eggs come up about 3:55)
  S.clutches = ['E', 'W'].flatMap((s) => P.clutch[s].map((p, i) => ({ id: 'cl' + s + (i + 1), side: s, x: p[0], y: p[1], up: T.clutch + i * 0.15, set: 1 })));
  S.south = ['E', 'W'].flatMap((s) => P.south[s].map((p, i) => ({ id: 'se' + s + (i + 1), side: s, x: p[0], y: p[1], up: T.set2 })));
  // Malice: ONE a Warden (260 of 260 on the kills), the second Warden 1.0 s after the first (which first, from the run's seed): a 1.5 s cast bar, then a
  // 6 s channel; a kick up to 0.9 s into the channel and nobody is hit. A Warden still up 55.3 s after it stood up casts another (below, as it happens)
  const mFirst = side() < 0.5 ? 'E' : 'W'; S.malice = ['E', 'W'].map((s) => { const t0 = T.malice + (s === mFirst ? 0 : 1); return { side: s, k: 1, t0, ch: t0 + 1.5, by: t0 + 2.4, t1: t0 + 7.5, c: cast('warden', 'Warden: Malice', t0, t0 + 1.5, { side: s, spell: 'malice', kick: true }), cc: cast('warden', 'Warden: Malice (channel)', t0 + 1.5, t0 + 7.5, { side: s, spell: 'malice', kick: true, by: t0 + 2.4 }) }; });
  timer(T.malice, 'Malice');
  // (the Clutches' call teaches Tab and 1: practice.js's once-a-run teaching call is off in phase 2 (init), as it named them "Rawlings" and could cover your kick.
  //  A Malice kicker gets it once the kick is done; healers don't hit adds)
  if (!heal) { const mm = mj && mj.mal ? S.malice.find((m) => m.side === mj.side) : null; warn(mm ? mm.by + 0.4 : T.clutch, 'Clutches: Press Tab to pick one, then keep pressing 1', '#c38bff'); }
  // Grasping Fangs (3:16): the solo breaks first, about 8 s after the tethers land, then the five together 8 s later (131 library Mythic kills)
  // (its calls only to whoever has that tether: the solo's to the solo, the five's to the five; the walk to the tether's edge when the game sends you, 5.5 s
  //  before the break, as you walk slower than the bots run)
  ['E', 'W'].forEach((s) => cast('warden', 'Warden: Grasping Fangs', T.fangs - 2, T.fangs, { side: s, spell: 'fangs' })); timer(T.fangs, 'Grasping Fangs');
  const tt = mj ? mj.teth : 0;
  // (the review of the prompt fixes, Nov 16: with no tether the call was marked yours ("no tether on you"), gold for nothing of yours; and "stay on the Warden" named
  //  another spot than the job line's "within 20 yards of the Warden". Now the tethered hear their order in gold, the rest a plain one)
  if (mj && tt) warn(T.fangs, tt === 'solo' ? 'Grasping Fangs: You break first, alone! Stay within 20 yards of the Warden.' : 'Grasping Fangs: You break second, with the 5! Stay within 20 yards of the Warden.', GOLD, 1); /* (which break is yours, first thing: the call said "Stay within 20 yards" and the screen dropped the rest, Flex, Nov 17) */
  else if (mj) warn(T.fangs, heal ? 'Grasping Fangs: Stay with the group! No tether this time.' : 'Grasping Fangs: Keep hitting the Warden! No tether this time.', '#ff8a6a');
  else warn(T.fangs, 'Grasping Fangs: Six tethers, three on each ledge', '#ff8a6a');
  if (tt === 'solo') { timer(T.solo, 'Solo break'); warn(T.solo - 5.5, 'Your tether: Walk to its edge now!', GOLD, 1); warn(T.solo, 'Solo break: Walk out of your tether now!', GOLD, 1); }
  if (tt === 'five') { timer(T.five, 'The five break'); warn(T.five - 5.5, 'Your tether: Walk to its edge now!', GOLD, 1); warn(T.five, 'The five: Walk out of your tether now!', GOLD, 1); }
  // (the five's break puts five Blight Vein stacks on everyone, so it's everyone's moment for Q: the review, Nov 16, found its bar only on the five's own screens. A bar
  //  for the rest, ending as the "press Q" call comes)
  if (tt !== 'five') timer(T.five - 1.5, 'Blight Vein: press Q');
  // (the Wardens' deaths: each ledge's own call comes when its Warden dies, worded for your job (wardens(), in the part), not at a fixed time for everyone. Its bar
  //  is gone too (the review, Nov 16: it stayed at a fixed 3:38.3, the false time taken off the call; the Wardens die 3:37.5 to 3:42.5))
  // the small eggs on their fixed spots at each ledge's north end, shielded until the Warden is dead and the shield broken
  const UE = pgP2Eggs(); S.eggs = ['E', 'W'].flatMap((s) => (s === 'E' ? UE.R : UE.L).map((p, i) => ({ side: s, n: i + 1, x: p[0], y: p[1] })));
  // (each carrier's lane spot round the cauldron, in the order of the eggs round it (east frame: from the north-east round to the west), so no two paths cross)
  S.lane = {}; ['E', 'W'].forEach((s) => { const pit = L(s, P.pit), ang = (e) => { const q = L(s, [e.x - pit[0], e.y - pit[1]]); return Math.atan2(q[1], q[0]); }; S.lane[s] = S.eggs.filter((e) => e.side === s).sort((a, b) => ang(a) - ang(b)).map((e) => e.n); });
  // (the small eggs: a carrier is sent to the cauldron, then told "now" as they go in together; everyone else keeps out of the carriers' rings)
  timer(T.throwAt, 'Small eggs in');
  // (only while your egg is in your hands (the review, Nov 16: both fired from the script, so a carrier who never picked theirs up was told to carry it and throw it
  //  in. per: practice.js asks as the call comes; o.eggOf, the part's: 'held', 'floor', 'in' once it went into the cauldron, 'lost'. At the count it may have gone in
  //  on the step just before the call shows)
  const eggOf = (id) => (o.eggOf ? o.eggOf(id) : 'held');
  if (mj && mj.egg) { S.warns.push({ t: T.throwAt - 6, text: 'Small eggs: Carry your egg to the cauldron! Your spot is the gold ring.', c: GOLD, you: 1, per: (id) => (eggOf(id) === 'held' ? null : false) });
    S.warns.push({ t: T.throwAt, text: 'Your egg: Step into the cauldron ring now!', c: GOLD, you: 1, per: (id) => (eggOf(id) === 'held' || eggOf(id) === 'in' ? null : false) }); }
  else warn(T.throwAt - 6, 'Small eggs: Keep out of the carriers\' rings!', '#f5d33a');
  // (the two south eggs: only the south big egg's carrier waits on them (they're never yours to carry); the big eggs' own calls come at your pickup time and
  //  as yours goes in (big(), in the part): the old fixed call for everyone named the wrong time, and the bars "Big eggs up" and "Big eggs in" weren't yours)
  // (outside its gold ring: that ring picks it up, so "wait by your big egg" picked it up early, with the south eggs still out (the review, Nov 16))
  timer(T.set2, 'South eggs');
  if (mj && mj.big === 'far') warn(T.set2, 'South eggs: Stay outside your big egg\'s ring! Wait until both are carried off.', GOLD, 1); /* (the big line 40 characters at most, Nov 17 review) */
  if (mj && mj.big) timer(S.bigIn[mj.side], 'Your big egg: in together');
  // the Weakened Doomscales: one climbs out of each cauldron 1.0 s after each big egg goes in (Doomscale 1 from the south egg, 2 from the north). Their
  // casts are set when they climb out (below); the plan's times here are for the cards: the bots carry a big egg in 15 s after picking it up (the walk
  // from the ledge's end is about 100 yards; on the kills the Doomscales climb out about 4:26, 4:27, 4:29 and 4:31)
  S.ds = ['E', 'W'].flatMap((s) => [1, 2].map((k) => ({ id: 'ds' + s + k, side: s, k, egg: k === 1 ? 'far' : 'close', up: S.bigIn[s] + 1 })));
  timer(Math.min(...S.ds.map((d) => d.up)), 'Doomscales');
  // Anguished Cry (from every Doomscale, 7.8 s after it climbs out, then every 15.8 s; kicked 1,450 of 1,489 on the kills, never let through): a 2.5 s
  // cast, or everyone within 60 yards is hit and stunned 6 s. Desperate Thrash (16.6 s, then every 18.3 s): a 3 s cast, then a frontal at its tank.
  // Both made as each Doomscale climbs out (dsCasts)
  S.cries = []; S.dthrash = [];
  // the way back, and the second heart burn (the same as the first)
  // (your call to go back comes when the game sends you (S.home, behind your ledge's tank); the heart's own call as it opens, after the Rage call, which only
  //  says it's coming: the old one said "burn the heart" 6.5 s early and nothing came as it opened)
  warn(o.me && S.home[o.me] != null ? S.home[o.me] : T.home, 'Back to her: Walk into your gate now!', '#c084ff', 1); timer(T.home, 'Back to her');
  cast('boss', 'Rage of the Shackled', T.rage, T.heart); warn(T.rage, 'Rage of the Shackled: Get ready, the heart opens soon', '#ff8a5a'); timer(T.heart, 'Heart open');
  warn(T.heart, heal ? 'Heart open: Step out of the brown circles!' : 'Heart open: Hit the heart (Tab, then 1)!', '#ff8a5a');
  for (let t = T.heart; t < T.heartEnd; t += 4) S.pulses.push(t);
  // Falling Debris: three times in stage 2 (about 3:50, 4:30 and 5:17; 264k to 458k a hit since Nov 6), by each half, and all over the stone in the heart burn
  const near = (c, r, onF) => { let q = c; for (let k = 0; k < 40; k++) { const a = rnd() * Math.PI * 2, d = 2 + rnd() * r; q = [c[0] + Math.cos(a) * d, c[1] + Math.sin(a) * d]; if (onF(q[0], q[1])) break; } return q; };
  // (its circles show 3.5 s before they land, with the call: at 2 s a raider walking from the landing spot was hit three times (the prompts audit, Nov 16))
  const fall = (q, at) => S.impacts.push({ x: q[0], y: q[1], r: 7, t0: at - 3.5, at, name: 'Falling Debris', dmg: 30, color: '#c8a36a', tip: 'Step out of the brown circles before they land.' });
  // (on the ledges: never right at an edge, so there's stone to step out on either side)
  [[T.debris[0], [104, 24]], [T.debris[1], [104, 6]]].forEach(([at, c]) => ['E', 'W'].forEach((s) => { for (let j = 0; j < 4; j++) fall(near(L(s, c), 13, (x, y) => pgP2Ledge(x, y, 7)), at + j * 0.3); }));
  for (let j = 0; j < 3; j++) fall(near([24 * sg, 2], 16, PG_UL.onPlat), T.debris[2] + j * 0.3);
  T.debris.forEach((t) => { timer(t, 'Falling Debris'); warn(t - 3.5, 'Falling Debris: Step out of the brown circles!', '#c8a36a'); });
  for (let t = T.heart + 2.5; t < T.heartEnd; t += 3.4) for (let j = 0; j < 3; j++) { let q; for (let k = 0; k < 30; k++) { q = [-30 + rnd() * 60, -30 + rnd() * 62]; if (PG_UL.onPlat(q[0], q[1])) break; } fall(q, t + j * 0.25); }
  // the heart burn's small tails (Gore Rattle, Caustic Waves; measured on the 12 fastest kills: a pair rises at one edge spot about 4:50.4 and fires
  // 2.4 s later, as the heart opens; another pair about 5:03.1. The first spot is (39,-39), (0,-56) or (0,57), the second (40,40), (-40,-39),
  // (-40,40) or (55,0)). As in phase 1's heart burn: three waves, 12.5 yards a second, its heading at the middle of the room and two more
  const tailSpots = [[[39, -39], [0, -56], [0, 57]], [[40, 40], [-40, -39], [-40, 40], [55, 0]]];
  T.rattle.forEach((at, k) => { const L0 = tailSpots[k], p = L0[Math.floor(rnd() * L0.length)], hd = Math.atan2(-p[1], -p[0]) * 180 / Math.PI; S.tails.push({ x: p[0], y: p[1], t0: at - 2.4, at });
    timer(at, 'Small tails'); warn(at - 2.4, 'Small tails: Step out of the red lanes!', RED);
    [0, -(20 + rnd() * 45), 20 + rnd() * 45].forEach((off) => S.waves.push({ kind: 'tail', x: p[0], y: p[1], deg: hd + off, v: 12.5, w: 9, d: 4, cres: [[-4.5, 4.5]], warn: 2.4, t0: at, t1: at + 8.5, name: 'Caustic Waves from a small tail', tip: 'A small tail rising at the edge sends a short fan of three waves: step out of their red lanes. Stunned, you can\'t.' })); });
  // (Virulent Spit's bar: only the swirls under you (the 1st and 3rd on your ledge), not the ones under someone else)
  T.spit.forEach((at, k) => { if (!mj || k % 2 === 0) timer(at + 6.5, 'Virulent Spit'); });
  S.timers.sort((a, b) => a.t - b.t); S.warns.sort((a, b) => a.t - b.t);
  return S;
}

// ---- the part: practice.js calls pgP2(api) once per game; api is practice.js's window on the game (G, S, me, the hit helpers) ----
function pgP2(A) {
  const T = PG_P2_T, P = PG_P2, L = pgP2L, away = pgP2Away, clk = pgClock, RN = { m: 'Melee', r: 'Ranged', h: 'Healer' }, SD = { E: 'east', W: 'west' }, NS = { far: 'south', close: 'north' };
  let S = null, G = null; const sync = () => { S = A.S; G = A.G; };
  // (its debuffs on your frame, and which mistakes count as big ones: added on the first run, once practice.js has made its lists)
  let setUp = false; const setup = () => { if (setUp) return; setUp = true;
    if (A.DPS_SAY) Object.assign(A.DPS_SAY, { warden: ['Hit the Warden', 'The Warden was up', 'Tab picks the Doomscale Warden: your half kills it before it starts over (a second Writhing Gestation turns more eggs). Stay in range.', 'it'], ds: ['Hit the Doomscales', 'The Doomscales were up', 'Tab picks a Weakened Doomscale: hit them from behind or beside (their frontal goes at the tank), and kill them evenly.', 'them'],
      clutch: ['Kill the Clutches', 'Clutches were up', 'The Warden\'s Writhing Gestation turns its nearest eggs into glowing Clutches: Tab picks one, keep pressing 1. Each leaves a Rawling.', 'them'],
      rawling: ['Kill the Rawlings', 'Rawlings were up', 'A Rawling comes out of every Clutch and every egg in the cauldron: Tab picks one, keep pressing 1. Kill them before they boil.', 'them'] });
    Object.assign(A.DEB, { vein: ['Blight Vein', '#ff5a4f'], fangs: ['Grasping Fangs', '#ff8a6a'], stun: ['Stunned', '#ffd23b'], doom: ['Doomscale Egg', '#e6b450'], malice: ['Malice', '#b06bff'], acid: ['Acidic Expulsion', '#b8e04a'] });
    ['kick', 'tether', 'big', 'wipe', 'frontal', 'side', 'egg', 'even'].forEach((k) => A.MAJ.add(k)); };
  // ---- your job (the start card), remembered on this browser ----
  // (Nov 16, the spot maps: every role starts on every mechanic it can take (Flex: "each role should ideally be tested on as many mechanics as they are
  // elgible to get"): a melee kicks Malice and a Doomscale's Anguished Cry and carries the south big egg, a ranged kicks Malice and a Cry too (30 yards
  // reaches the Warden from the ranged spot; the review, Nov 16: a ranged left off Malice never practised the ledge's first kick) and carries a small egg, a
  // healer carries the north big egg (no kick in Midnight); the tether comes at random. A pick saved by the old one-job setup keeps its ledge and role)
  const KEY = 'wla-pg-job3', KEY0 = 'wla-pg-job2', EGG0 = { m: 'far', r: 'n6', h: 'close' }, KICK0 = { m: [1, 1], r: [1, 1], h: [0, 0] };
  const job0 = (r, s) => { const R = /^[mrh]$/.test(r) ? r : 'r'; return { side: s === 'W' ? 'W' : 'E', role: R, egg: EGG0[R], mal: KICK0[R][0], cry: KICK0[R][1], teth: 'random' }; };
  const jobOk = (j) => !!j && (j.side === 'E' || j.side === 'W') && /^[mrh]$/.test(j.role) && (j.egg === null || j.egg === 'far' || j.egg === 'close' || /^n[1-8]$/.test(j.egg)) && [0, 1, 2, 3].includes(j.mal) && [0, 1, 2].includes(j.cry) && ['random', 'solo', 'five', 'none'].includes(j.teth);
  let pk = (() => { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (jobOk(j)) return j; const o = JSON.parse(localStorage.getItem(KEY0) || 'null'); if (jobOk(o)) return job0(o.role, o.side); } catch (e) { /* (no storage) */ } return job0(); })();
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
  // (yours 6 yards in, like the big egg's (the prompts audit, Nov 16): at 8 the Go-here marker went 2.5 yards short of it, 9.9 yards out, past the 9-yard ring
  //  that takes the egg, and "Into the cauldron now" kept on. The bots keep 8: their lane spots are 3.8 yards apart there, clear of each other's 3 yards)
  const slot = (s, n, mine) => { const r = mine ? 6 : 8; if (n > 100) return pgP2Away(S.pits[s], r, 260 + (n - 100) * 26, s); const o = S.lane[s].indexOf(n); return pgP2Away(S.pits[s], r, 25 + Math.max(0, o) * 27, s); }, bigSlot = (s, w) => away(S.pits[s], 6, w === 'far' ? 250 : 70, s); /* (6 yards in: the Go-here marker goes 2.5 yards from its spot, and at 8 that could leave you outside the 9-yard ring (the release sweep, Nov 16)) */
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
  // (your share of a ledge's Rawlings or Clutches: only while they're your moment and one is in your reach soon; carrying an egg, or walking to your big
  // egg, the raid doesn't wait on you (Main's playtest, Nov 15: Melee / South big egg let a cauldron Rawling live 35 s))
  const addShare = (s, kind, L0) => { if (!shareOf(s) || dpsCat(G.t) !== kind) return 0; const reach = A.me[0] === 'm' ? 10 : 40; return L0.some((q) => pgDist([q.x, q.y], [G.x, G.y]) <= reach) ? shareOf(s) : 0; };
  // (a bot's kick lands a moment into the bar, as on the kills: Malice about 0.6 s (0.5 to 0.75), Anguished Cry about 0.9 s (0.7 to 1.2), a little
  // sooner under Revenge's 1.25 s bar; the same each time for a run's seed)
  const kdelay = (key, kind, rev) => { let h = (S.seed * 2654435761) >>> 0; for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0; const f = (h % 1000) / 1000;
    return kind === 'Malice' ? 0.45 + f * 0.35 : rev ? 0.45 + f * 0.4 : 0.65 + f * 0.5; };
  // (the raid's pace on a ledge's Rawlings: slower while the Warden or the Doomscales take its damage)
  const rpace = (s, t) => (wdUp(s) ? P.RPACE.warden : S.ds.some((d) => d.side === s && G.p2.dsS[d.id] && G.p2.dsS[d.id].dead == null) ? P.RPACE.ds : P.RPACE.eggs);
  const tankOf = (s) => (s === 'E' ? 't1' : 't2');
  // (a kicker's spot: 5 yards behind their Doomscale, on the side away from its tank, so its frontal never points at them)
  const behind = (s, k) => { const d = G.p2.ds['ds' + s + k]; if (!d) return null; const tp = pos(tankOf(s)), ex = d.x - tp[0], ey = d.y - tp[1], ee = Math.hypot(ex, ey) || 1; return [d.x + ex / ee * 3.5, d.y + ey / ee * 3.5]; };
  // (on the ledge a Doomscale stands 7 yards in from its tank, Doomscale 1 north of Doomscale 2: where its tank holds it until 4:38.5, and where the setup's
  // Kicks map puts them. Its first Anguished Cry comes there when the big eggs go in on the count; the next two come by her, where the tank has taken it)
  const dsOff = (k) => [-7, k === 1 ? 2.5 : -2.5];
  const dsWant = (d, t) => { const st = G.p2.dsS[d.id]; if (!st || st.dead != null) return null; if (t < st.up + 1.5) return S.pits[d.side].slice(); const tk = tankOf(d.side), tp = pos(tk), sg = S.east ? 1 : -1;
    return G.p2.where[tk] === 'p1' ? [tp[0] + sg * (d.k === 1 ? -2.5 : 2.5), tp[1] + (tp[1] < 0 ? 7 : -7)] : (() => { const o = pgP2L(d.side, dsOff(d.k)); return [tp[0] + o[0], tp[1] + o[1]]; })(); };

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
  // (each small egg's waiting spot until it opens: off the other carriers' lanes (each from its egg to its gap at y 34, on the stone as route() walks it) and 3.6
  // yards or more from every egg, so nobody waiting there is inside a carrier's 3 yards. The release sweep, Nov 16: 3.5 yards east of the egg sat on the next
  // carriers' lanes, 0.4 yards from one, and the arrow put you on the egg itself, beside them. The south eggs keep their old spot, away from the lanes)
  const waitOf = (e) => { const W = S.wspot || (S.wspot = {}), k = e.side + e.n, s = e.side, old = () => { const o = L(s, [3.2, 1.5]); return [e.x + o[0], e.y + o[1]]; }; if (W[k]) return W[k]; if (e.south) return (W[k] = old());
    const E = S.eggs.filter((q) => q.side === s), lane = (q) => { const o = Math.max(0, S.lane[s].indexOf(q.n)), g = L(s, [120 - o * 3.8, 34]), a = [q.x, q.y]; if (onWay(a, g)) return [a, g]; let bm = null, bd = 1e9; MID.forEach((p) => { const m = L(s, p); if (!onWay(a, m) || !onWay(m, g)) return; const d = pgDist(a, m) + pgDist(m, g); if (d < bd) { bd = d; bm = m; } }); return bm ? [a, bm, g] : [a, g]; };
    const segD = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1, u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l2)); return Math.hypot(p[0] - a[0] - vx * u, p[1] - a[1] - vy * u); };
    const LN = E.filter((q) => q.n !== e.n).map(lane); let best = null;
    for (let r = 3.6; r <= 8.01; r += 0.3) for (let a = 0; a < 360; a += 10) { const q = [e.x + Math.cos(a * Math.PI / 180) * r, e.y + Math.sin(a * Math.PI / 180) * r]; if (!pgP2Ledge(q[0], q[1], 1) || !onWay([e.x, e.y], q)) continue;
      const eg = Math.min(...E.map((o) => Math.hypot(o.x - q[0], o.y - q[1]))); if (eg < 3.6) continue; const ld = Math.min(...LN.map((Q) => Math.min(...Q.slice(1).map((b, i) => segD(q, Q[i], b))))), sc = Math.min(ld, 3.6) * 2 + Math.min(eg, 4.5) - r * 0.5; if (!best || sc > best.sc) best = { q, sc }; } /* (clear of the lanes by a carrier's 3 yards and a bit, then as near the egg as can be: the egg nearest the cauldron opens last, and its carrier grabs it between the others going by) */
    return (W[k] = best ? best.q : old()); };
  // (you, about to pick up your small egg (on it as it opens) or carrying it)
  const meSoon = (t) => G.eggs.some((q) => q.id === A.me && (q.state === 'held' || (q.state === 'floor' && t >= q.shell - 1 && pgDist([G.x, G.y], [q.x, q.y]) < 4)));
  const bkCry = (id) => { const b = G.p2.bk; if (!b || id !== A.me || G.p2.kick[b.key] || !/^c/.test(b.key)) return 0; const c = S.cries.find((q) => 'c' + q.ds + q.i === b.key); return c ? c.dk : 0; };
  // ---- where each raider's job wants them (the bots, the autopilot and your hint arrow all follow this) ----
  // (your arrow, from when the job line names the step (the prompts audit, Nov 16: it came at the step's own time, so a ranged or a healer landed 26 yards from
  //  the Warden and broke the tether as it landed, a melee stood 25 yards off its Malice, and a Cry kicker 75 yards from its Doomscale got no arrow back).
  //  Your next kick within lead seconds and where its caster stands now; a spot clamped to within r of a point)
  const kickPos = (key) => { if (key[0] === 'm') return G.p2.wd[key[1]] || null; const d = G.p2.ds[key.slice(1, -1)]; return d ? [d.x, d.y] : null; };
  const myKickAt = (t, lead) => { const k = myKicksNow(t)[0]; if (!k || t < k.at - lead) return null; const p = kickPos(k.key); return p ? { k, p } : null; };
  const clampTo = (q, c, r) => { const d = pgDist(q, c); return d > r ? [c[0] + (q[0] - c[0]) * r / d, c[1] + (q[1] - c[1]) * r / d] : q; };
  // (in reach of your next kick's caster, with a yard of slack once you are: in from half a yard inside your reach, out again only half a yard past it. The review,
  //  Nov 16: as a Doomscale walked across the reach line the job line flipped between "press E when its bar starts" and "get close to it" twice in half a second.
  //  G.p2.kIn, the kick last shown in reach, is kept by the job line; the arrow and the floor's "Get closer" read it too)
  const kickIn = (key, p, q) => { const rg = range(A.me), d = pgDist(p, q || [G.x, G.y]); return !!rg && (d <= rg - 1 || (G.p2.kIn === key && d <= rg)); }; /* (the slack stays inside your reach: at rg + 0.5 the line said "press E" and the kick failed as "too far", Nov 17 review) */
  const KLEAD = 6; /* (your kick's line and arrow: 6 s before its bar, so a melee walks into reach in time) */
  const ledgeJob = (id, t, j, s, b0) => { const tk = id[0] === 't', i = idx(id), F = L(s, P.fight), me = id === A.me, mk = me ? myKickAt(t, KLEAD) : null; let T0, fast = false, ob = null;
    // (you, with a kick of yours coming: within reach of its caster, 3 yards inside it so stopping where the arrow goes away still reaches; the arrow while you're out of reach)
    const toKick = () => { if (!mk || !range(id)) return; T0 = clampTo(T0, mk.p, range(id) - 3); if (!kickIn(mk.k.key, mk.p, [b0.x, b0.y])) ob = { at: mk.k.at, p: T0.slice(), r: 1.5 }; };
    if (t < T.molt + 3) { T0 = tk ? (t < T.wardens + 1 ? L(s, [P.wSpawn[0] - 1.5, P.wSpawn[1] - 2.5]) : L(s, [(P.wSpawn[0] + P.fight[0]) / 2 + 2, (P.wSpawn[1] + P.fight[1]) / 2 - 2])) : spiral(L(s, [98, 22]), i, 5); fast = tk; toKick(); }
    else if (wdUp(s)) { // the Warden: its tank, the melee round its south side (on the Clutches and the Rawlings while they live), the ranged and healers back
      if (tk) T0 = away(F, 2.6, 300, s); else if (id[0] === 'm') T0 = meleeOn(id, s, b0) || away(F, 4.5, 205 + P.half[s].filter((q) => q[0] === 'm').indexOf(id) * 30, s); else T0 = spiral(L(s, P.ranged), i, 6);
      // (a kick of yours (or the backup's): within reach of its caster)
      const kd = kickDue(id, t); if (kd) { const rg = range(id) - 1.5, d = pgDist(T0, kd); if (d > rg && rg > 0) T0 = [kd[0] + (T0[0] - kd[0]) * rg / d, kd[1] + (T0[1] - kd[1]) * rg / d]; }
      toKick();
      // (you, before the tethers land: within 18 yards of the Warden, where the tether can't break, with the arrow while you're past 19; a ranged's or a
      //  healer's spot could be 23 yards off, and the gate lands you at 26)
      const th = G.p2.teth[id], thOn = th && th.br == null && t >= T.fangs - 0.2;
      if (me && !tk && t >= T.fangs - 8 && (t < T.fangs || (thOn && t < (th.solo ? T.solo : T.five) - 5.5))) { T0 = clampTo(T0, F, 18); if (!ob && pgDist([b0.x, b0.y], F) > 19) ob = { at: T.fangs, p: T0.slice(), r: 1.5 }; }
      // (a tether: within 19 yards of the Warden until your break, to 21 yards 2.8 s before it, out past 25 on the count)
      if (thOn) { const bt = th.solo ? T.solo : T.five, dir = id === A.me ? outDir(F, b0, s) : th.solo ? TDIR[0] : TDIR[1 + (th.n % 4)]; /* (you: straight out from where you stand, not round the Warden) */
        if (t >= bt) { T0 = away(F, 28, dir, s); fast = true; ob = { at: bt + 0.6, p: T0, r: 1 }; } else if (t >= bt - (id === A.me ? 5.5 : 2.8)) { T0 = away(F, 21, dir, s); fast = true; ob = { at: bt, p: T0, r: 1 }; } /* (you walk slower than the bots run: off 5.5 s early, then wait at the edge) */
        else { const d = pgDist(T0, F); if (d > 19) T0 = [F[0] + (T0[0] - F[0]) * 19 / d, F[1] + (T0[1] - F[1]) * 19 / d]; } } }
    else if (!dsOut(s)) { // the eggs: yours once its shield breaks, to your lane spot at the cauldron, in together; the big eggs last
      const e = G.eggs.find((q) => q.id === id && q.state !== 'gone'), bi = j.big ? bigIx(s, j.big) : -1, bg = bi >= 0 ? G.p2.big[bi] : null;
      if (e && e.state === 'floor') { const busy = G.eggs.some((q) => q !== e && q.state === 'held' && q.who && q.who !== id && pgDist(pos(q.who), [e.x, e.y]) < 4.6) || (id !== A.me && meSoon(t) && (pgDist([G.x, G.y], [e.x, e.y]) < 4.6 || pgDist([G.x, G.y], [b0.x, b0.y]) < 4.2)); /* (a bot holds off its egg while you carry yours, or are on it as it opens, and you're by its egg or by it: it never picks up inside your 3 yards (the release sweep, Nov 16)) */
        T0 = t >= e.shell - 0.8 && !busy ? [e.x, e.y] : waitOf(e); fast = pgDist([b0.x, b0.y], T0) > 6; ob = { at: e.shell, p: T0.slice(), r: 1 }; } /* (the arrow on the waiting spot until the egg opens, not on the egg beside the other carriers' lanes) */
      // (the lanes: down the ledge to your lane's gap at y 34 (3.8 yards apart), east of the ledge's inner notch, then to your spot at the cauldron; the lanes in the eggs' order, so none cross)
      else if (e && e.state === 'held') { const o = Math.max(0, S.lane[s].indexOf(e.n)); T0 = b0.y > 36 ? L(s, [120 - o * 3.8, 34]) : slot(s, e.n, me); fast = pgDist([b0.x, b0.y], T0) > 6; ob = { at: T.throwAt, p: T0, r: 1.2 }; }
      else if (bg && bg.state === 'floor' && t >= S.bigAt[s][j.big] - (id === A.me ? 16 : 11)) { const B = S.big[bi]; T0 = t >= S.bigAt[s][j.big] - 0.6 ? [B.x, B.y] : [B.x + (S.pits[s][0] - B.x) * 0.06, B.y + (S.pits[s][1] - B.y) * 0.06]; fast = pgDist([b0.x, b0.y], T0) > 6; ob = { at: S.bigAt[s][j.big], p: T0.slice(), r: 1 }; } /* (the arrow on the waiting spot until the pickup time, not on the egg: walking onto it picks it up with the small eggs still out (the release sweep, Nov 16)) */
      else if (bg && bg.state === 'held') { T0 = bigSlot(s, j.big); fast = true; ob = { at: S.bigIn[s], p: T0, r: 1.2 }; }
      else { const wsp = L(s, t >= T.throwAt && (t < S.bigAt[s].far + 6 || (t < dsNext(s) - 5 && (G.adds.some((a) => a.own && a.side === s && a.y < -20) || Object.values(G.p2.cl).some((c) => c.side === s && c.dead == null && c.y < -20)))) && j.big !== 'close' ? P.swait : P.wait); T0 = (id[0] === 'm' && meleeOn(id, s, b0)) || spiral(wsp, i, 5); } /* (once the small eggs are in, the half waits by the south eggs and the south big egg, where the kills kill the cauldron's Rawlings, and is back by the cauldron before its Doomscales and the 4:30 debris; the north egg's carrier stays by the cauldron, nearer to it) */
      if (j.cry && !(e && e.state === 'held') && !(bg && bg.state === 'held') && t >= dsNext(s) - (me && !(bg && bg.state === 'floor') ? 10 : 8)) { T0 = spiral(L(s, P.dsKick), i, 2); fast = pgDist([b0.x, b0.y], T0) > 6; if (me && pgDist([b0.x, b0.y], T0) > 3) ob = { at: dsNext(s), p: T0.slice(), r: 1.5 }; } /* (a Cry kicker by the cauldron before its Doomscale climbs out; you from 10 s before, with the arrow, unless your big egg is still to pick up) */
      if (tk && t >= dsNext(s) - 4) { T0 = L(s, P.ds); fast = true; } }
    else { // the Doomscales: their tank east of them (their frontal goes at the tank), the kickers behind them, the rest further back
      // (once their tank has taken them through the gate, everyone left on the ledge heads for it too: never at them across the venom)
      const gone = G.p2.where[tankOf(s)] === 'p1', bi = j.big ? bigIx(s, j.big) : -1, bg = bi >= 0 ? G.p2.big[bi] : null;
      // (a big egg still in your hands once the first Doomscale is out: on to the cauldron with it)
      if (bg && bg.state === 'held' && bg.who === id) return { T: bigSlot(s, j.big), fast: true, ob: { at: S.bigIn[s], p: bigSlot(s, j.big), r: 1.2 } };
      if (bg && bg.state === 'floor' && t < T.doomEnd) { const B = S.big[bi], q = t >= S.bigAt[s][j.big] - 0.6 ? [B.x, B.y] : [B.x + (S.pits[s][0] - B.x) * 0.06, B.y + (S.pits[s][1] - B.y) * 0.06]; return { T: q, fast: true, ob: { at: S.bigAt[s][j.big], p: q.slice(), r: 1 } }; }
      const ck = j.cry || bkCry(id); T0 = tk ? L(s, P.ds) : gone ? L(s, P.land) : ck ? behind(s, ck) || L(s, P.dsKick) : id[0] === 'm' ? (() => { const b1 = behind(s, 1), b2 = behind(s, 2), q = id === A.me && b1 && b2 ? [(b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2] : behind(s, 1 + (i % 2)) || behind(s, 2 - (i % 2)); return q ? spiral(q, i, 2.2) : L(s, P.dsKick); })() /* (you: behind the two of them, in reach of both, so killing them evenly costs no walking; anyone: behind whichever is out) */ : spiral(L(s, P.dsWait), i, 5); fast = gone; if (!gone) toKick(); } /* (the melee: behind them, in reach (the damage moments, Nov 15)) */
    return { T: T0, fast, ob }; };
  const platJob = (id, t, j) => { const sg = S.east ? 1 : -1, PL = (x, y) => [x * sg, y], east = j.side === 'E';
    // (back by her, the Doomscales dragged in by the heart for the cleave (the guide): the east half's tank holds its two just south of the heart and
    // the west half's just north, their frontals pointing away at the tanks; every melee by the heart, in reach of it and of their Doomscale (kicks
    // too); the ranged and healers a little back. The damage moments, Nov 15)
    const i = GDZ_RAID.indexOf(id); let T0 = id[0] === 't' ? PL(34, east ? -12 : 12) : id[0] === 'm' ? spiral(PL(35.5, 0), i, 1.5) : spiral(PL(25, 0), i, 5);
    // (a melee, until the heart opens: behind their ledge's Doomscales wherever the tank has them, both in reach (they follow the drag across the platform))
    if (id[0] === 'm' && t < T.heart) { const b1 = behind(j.side, 1), b2 = behind(j.side, 2), q = b1 && b2 ? [(b1[0] + b2[0]) / 2, (b1[1] + b2[1]) / 2] : b1 || b2; if (q && PG_UL.onPlat(q[0], q[1])) T0 = j.cry && behind(j.side, j.cry) ? behind(j.side, j.cry) : q; }
    // (a kick due: the escapes from the small tails' waves keep you in reach of its caster)
    // (your arrow: only while you're out of its reach, to a spot 3 yards inside it, not onto the caster's nose (the prompts audit, Nov 16))
    if (id === A.me) { const mk = myKickAt(t, KLEAD); return { T: T0, fast: false, ob: mk && range(id) && !kickIn(mk.k.key, mk.p) ? { at: mk.k.at, p: clampTo(T0, mk.p, range(id) - 3), r: 1.5 } : null }; }
    const kd = kickDue(id, t); return { T: T0, fast: false, ob: kd ? { at: t + 3, p: kd.slice(), r: Math.max(2, range(id) - 1.5) } : null }; };
  // (what's in the way of your arrow: a circle landing in the next 2.5 s that you're not already in, a Doomscale's frontal going off, or a small tail's wave
  //  crossing it in the next 2 s. Then there's no arrow and the job line says to wait (the prompts audit, Nov 16: the arrow is a straight line, and the dodge
  //  moved the bots but left your arrow pointing through the circles))
  const segDist = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1, u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l2)); return Math.hypot(p[0] - a[0] - vx * u, p[1] - a[1] - vy * u); };
  const waveAt = (wv, q, t, lo, hi) => { if (wv.kind !== 'tail' || t > wv.t1 || t < wv.t0 - (wv.warn || 2.4) - 0.5) return false; const a = wv.deg * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), rx = q[0] - wv.x, ry = q[1] - wv.y, s1 = rx * u + ry * v, s2 = -rx * v + ry * u;
    if (Math.abs(s2) > wv.w / 2 + 1.2 || s1 < -2) return false; const th = wv.t0 + s1 / wv.v; return th >= t + lo - 0.2 && th <= t + hi + 0.4; };
  const pathBlock = (a, b, t) => { if (pgDist(a, b) < 1) return null; const n = Math.max(2, Math.ceil(pgDist(a, b))), at = (k) => [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n];
    for (const m of S.impacts) if (m.at >= t && m.at - t <= 2.5 && pgDist(a, [m.x, m.y]) > m.r + 1 && segDist([m.x, m.y], a, b) < m.r + 1) return m.name === 'Virulent Spit' ? 'the green swirl land' : 'the brown circles land';
    for (const f of G.p2.fan) if (t >= f.t0 && t <= f.at + 0.2 && f.tank !== A.me && !inFan(f, a[0], a[1], 1)) for (let k = 1; k <= n; k++) { const q = at(k); if (inFan(f, q[0], q[1], 1)) return 'the frontal go off'; }
    for (const wv of S.waves) if (!waveAt(wv, a, t, -0.3, 2)) for (let k = 1; k <= n; k++) if (waveAt(wv, at(k), t, -0.3, 2)) return 'the waves pass';
    return null; };
  // (the review, Nov 16: blocked, the spot used to be dropped, and practice.js's arrow then fell back to your small egg about to open, straight through the circle.
  //  Now the spot is where you stand, so no arrow is drawn at all while the line says to wait)
  const job = (id, t) => { const r = jobAt(id, t); if (id === A.me && !window.__pgAuto && G.p2) { const why = r.ob ? pathBlock([G.x, G.y], r.ob.p, t) : null; if (why) { r.ob = { at: t, p: [G.x, G.y], r: 1 }; r.wait = why; } G.p2.lastWait = why ? { t, why } : null; } return r; };
  const jobAt = (id, t) => { sync(); const j = S.job[id], s = j.side, w = G.p2.where[id], ws = G.p2.wside[id], b0 = id === A.me ? { x: G.x, y: G.y } : G.bots[id]; let r;
    // (you: to your gate the moment it opens, with the arrow (the prompts audit, Nov 16: the job line said so at 2:47 and the arrow came at your bot slot's turn, up to 4 s later))
    if (w === 'p0') r = t < (id === A.me ? T.gate : S.cross[id]) ? { T: spiral(L(s, [14, -2]), idx(id), 5), fast: false, ob: null } : { T: L(s, P.gateP), fast: true, ob: { at: T.wardens, p: L(s, P.gateP), r: 1.2 } };
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
    // (a carrier's spot keeps out of the other carriers' 3-yard rings too)
    const held = G.eggs.some((e) => e.who === id && e.state === 'held'), rings = held ? G.eggs.filter((e) => e.state === 'held' && e.who && e.who !== id).map((e) => pos(e.who)) : [];
    const clear = (x, y) => { if (near(x, y, 1.6) || rings.some((o) => Math.hypot(x - o[0], y - o[1]) < 3.9)) return false; const d = Math.hypot(x - b0.x, y - b0.y); for (let k = 1; k <= 10; k++) { const f = k / 10, px = b0.x + (x - b0.x) * f, py = b0.y + (y - b0.y) * f, tt = t + d * f / sp; if (!pgP2Floor(px, py) || imps.some((q) => tt >= q.at - 0.35 && tt <= q.at + 0.25 && Math.hypot(px - q.x, py - q.y) <= q.r + 1)) return false; } return true; };
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
  const onWay = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(d / 0.75)); /* (every 0.75 yards: at 1.5 a walk south from the cauldron clipped the ledge's edge near (88, -30)) */ for (let k = 1; k <= n; k++) { const f = k / n; if (!pgP2Floor(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)) return false; } return true; };
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
      whp: { E: 1, W: 1 }, wdead: { E: null, W: null }, farGo: {}, settled: { E: true, W: true }, landT: {}, w2: { E: {}, W: {} }, cl: {}, se: {}, dsS: {}, dsAt: {}, rev: null, dsHits: {}, intr: [], bk: null, bkSeen: new Set(), malCut: {}, rav: [], acid: new Set(), esc: {} };
    S.south.forEach((q) => { G.p2.se[q.id] = { state: 'egg' }; });
    GDZ_RAID.forEach((id) => { G.p2.where[id] = 'p0'; G.p2.wside[id] = null; });
    G.eggs = S.eggs.map((e) => ({ id: holder('egg', e.side, e.n), side: e.side, n: e.n, x: e.x, y: e.y, land: T.wardens, shell: T.shells + S.eggs.filter((q) => q.side === e.side && pgDist([q.x, q.y], S.pits[e.side]) > pgDist([e.x, e.y], S.pits[e.side])).length * 1.1, set: 0, state: 'floor', who: null, lock: 'Its shield holds until the Warden is dead: wait.' }));
    // (yours opens only once its Warden is dead (wardens() sets its time then), however long the Warden lives: the plan's words, and the job line's (the prompts
    //  audit, Nov 16). The bots' keep their times)
    G.eggs.forEach((e) => { if (e.id === A.me) e.shell = 1e9; });
    // (practice.js's once-a-run "Rawlings! Press Tab..." call is off here: in phase 2 it named the Clutches "Rawlings" and could land on your Malice kick. The
    //  Clutches' call teaches Tab and 1 instead (pgP2Script), and the heart's call as it opens)
    G.taught = true; };
  const bossHp = (t) => 56 - (t > T.heart ? 12 * Math.min(1, (t - T.heart) / (T.heartEnd - T.heart)) : 0);

  // ---- what happens each step: gates, kicks, tethers, the eggs' rules, the big eggs, the frontals ----
  const vein = (t) => { A.deb('vein', 4, true); G.p2.veins.push(t); };
  // (the casts you can kick now: each Warden's Malice (its bar, and the first 0.9 s of its channel), each Doomscale's Anguished Cry. Its kicker: the
  // plan's, or you while you're its backup)
  const bkWho = (key, who) => (G.p2.bk && G.p2.bk.key === key ? A.me : who);
  const kickables = (t) => S.malice.filter((m) => t >= m.t0 && t <= m.by && !G.p2.kick['m' + m.side + m.k] && G.p2.wd[m.side]).map((m) => ({ key: 'm' + m.side + m.k, kind: 'Malice', p: G.p2.wd[m.side], who: bkWho('m' + m.side + m.k, holder('mal', m.side, 1)), t0: m.t0, t1: m.by, side: m.side, c: m.c, cc: m.cc, caster: 'wd' + m.side }))
    .concat(S.cries.filter((c) => t >= c.t0 && t <= c.t1 && !G.p2.kick['c' + c.ds + c.i] && G.p2.ds[c.ds]).map((c) => ({ key: 'c' + c.ds + c.i, kind: 'Anguished Cry', p: [G.p2.ds[c.ds].x, G.p2.ds[c.ds].y], who: bkWho('c' + c.ds + c.i, holder('cry', c.side, c.dk)), t0: c.t0, t1: c.t1, side: c.side, rev: c.rev, c: c.c, caster: c.ds })));
  // (the cast bars over the casters' heads (Nov 16, Flex: "The interupts are impossible to track/see. The monsters should have cast bars over their heads",
  // then "remember this is intended to be training wheels"): one for each cast E can kick now, over its caster, filling through its kick window (Malice: its
  // bar and the 0.9 s of its channel you can still kick in, so a full bar means too late); mine when it's your kick (your plan's, or the backup's; a healer
  // has none), near when you're in reach; then red "Interrupted" for 0.8 s after a kick. practice3d.js draws them (pg3dShapes' 'cast'). h: the yards over
  // the caster's base its bar sits at, just over its head (the Warden's crest tops out about 6.9, a Doomscale's head about 4.4)
  const BAR_H = { w: 7.1, d: 4.6 }, casterAt = (id) => (id[0] === 'w' ? G.p2.wd[id.slice(2)] || null : G.p2.ds[id] ? [G.p2.ds[id].x, G.p2.ds[id].y] : null);
  const castBars = (t) => { sync(); if (!G || !G.p2) return []; const me = A.me, rg = range(me), out = [], at = (p) => !!rg && pgDist(p, [G.x, G.y]) <= rg;
    kickables(t).forEach((k) => out.push({ key: k.key, caster: k.caster, x: k.p[0], y: k.p[1], h: BAR_H[k.caster[0]], name: k.kind, f: Math.max(0, Math.min(1, (t - k.t0) / Math.max(0.1, k.t1 - k.t0))), mine: !!rg && k.who === me, near: at(k.p), state: 'cast' }));
    G.p2.intr.forEach((q) => { if (t < q.t || t - q.t > 0.8) return; const p = casterAt(q.caster); if (p) out.push({ key: q.key, caster: q.caster, x: p[0], y: p[1], h: BAR_H[q.caster[0]], name: q.kind, f: 1, mine: !!rg && q.who === me, near: at(p), state: 'kicked' }); });
    return out; };
  // (a kick lands: its bars stop, and its cast bar over the caster turns red, "Interrupted", for a moment (castBars); your target's frame says who kicked it, yours or a bot's, so you see every one)
  const kicked = (k, who, t) => { G.p2.kick[k.key] = who; k.c.t1 = Math.min(k.c.t1, t); if (k.cc) k.cc.t1 = Math.min(k.cc.t1, t); G.p2.intr.push({ key: k.key, caster: k.caster, who, t, kind: k.kind });
    if (who === A.me) { A.say((G.p2.bk && G.p2.bk.key === k.key ? 'Backup kick! ' : 'Kicked: ') + k.kind + ' interrupted.'); } };
  const kick = () => { sync(); if (!G || !G.p2) return; const t = G.t, me = A.me, rg = range(me);
    if (!rg) { A.say('Healers have no kick in Midnight (only a Restoration Shaman).', true); return; } if (stunned(me, t)) { A.say('You\'re stunned.', true); return; }
    if (t - G.p2.kickCd < 15) { A.say('Kick is on cooldown: wait for the button to fill.', true); return; }
    // (training wheels: E goes to the cast that's yours to kick first (your plan's, or the backup's), then your target's, else the nearest in reach. The release
    // sweep, Nov 16: both of a ledge's Doomscales cast their Cry together, and E on your damage target, the other one, let your own Cry through)
    // (a cast of yours running out of your reach: you're told to get closer and the kick isn't spent (the prompts audit, Nov 16: the backup, called from 4 yards
    //  out of reach, pressed E, lost the kick to "nothing was casting" and then the Cry)
    const all = kickables(t), inR = all.filter((k) => pgDist(k.p, [G.x, G.y]) <= rg), K = inR.find((k) => k.who === me) || inR.find((k) => k.caster === G.tgt) || inR.sort((a, b) => pgDist(a.p, [G.x, G.y]) - pgDist(b.p, [G.x, G.y]))[0];
    const far = !K && all.find((k) => k.who === me); if (far) { A.say('Too far from the casting ' + (far.kind === 'Malice' ? 'Warden' : 'Doomscale') + ': get closer, then press E.', true); return; }
    const foes = S.wardens.map((w) => G.p2.wd[w.side]).filter(Boolean).concat(Object.values(G.p2.ds).map((d) => [d.x, d.y])); if (!foes.some((p) => pgDist(p, [G.x, G.y]) <= rg)) { A.say('Nothing to kick within ' + rg + ' yards.', true); return; }
    G.p2.kickCd = t; if (K) kicked(K, me, t); else A.say('Kick wasted: nothing was casting in your reach.', true); A.hud(true); };
  const gates = (t) => { const me = A.me;
    // (a gate takes you once you've stepped off the one you came out of: you land beside the other end, which would send you straight back (the review, Nov 15))
    GDZ_RAID.forEach((id) => { const lk = G.p2.lock[id]; if (lk && pgDist(pos(id), lk) > 3.6) delete G.p2.lock[id]; });
    S.gates.forEach((g) => { const ids = GDZ_RAID.filter((id) => !G.p2.lock[id] && (g.back ? G.p2.where[id] === 'L' && G.p2.wside[id] === g.side : G.p2.where[id] === 'p0'));
      ids.forEach((id) => { const j = S.job[id], p = pos(id), wrong = id === me && g.back && j.side !== g.side, open = (t >= g.t0 && t <= g.t1) || (wrong && t < T.heart); if (!open || pgDist(p, g.p) > (id === me ? P.GATE : 2.4)) return; /* (you: anywhere inside its drawn ring (the prompts audit, Nov 16: 2.4, and the arrow goes away at 2.5, so a player who stopped there stayed on the ledge through the heart burn); the bots as before) */
        if (id !== me && (j.side !== g.side || t < (g.back ? S.home[id] : S.cross[id]))) return; if (id !== me && !(t >= g.t0 && t <= g.t1)) return;
        const q = g.back && t < T.home ? home(id) : spiral(g.to, idx(id), 2.6), dst = nearFloor(q); if (id === me) { G.x = dst[0]; G.y = dst[1]; G.kb = null; A.clearTarget(); } else { G.bots[id].x = dst[0]; G.bots[id].y = dst[1]; G.bots[id].esc = null; }
        G.p2.lock[id] = g.to.slice();
        if (!g.back) { G.p2.where[id] = 'L'; G.p2.wside[id] = g.side; } else { G.p2.where[id] = t < T.home ? 'p0' : 'p1'; G.p2.wside[id] = null; G.p2.landT[id] = t; }
        if (id !== me) return;
        if (!g.back) { G.p2.crossT = t; if (g.side !== j.side) { if (once('side' + g.side + Math.floor(t / 20))) A.mistake('side', 'You took the ' + SD[g.side] + ' gate: your half is on the ' + SD[j.side] + ' ledge.', 'Your gate is the gold ring on your ledge\'s side of the platform. Step off and back into this ledge\'s gate to go back.', 0); } else if (t > T.wardens + 1 && once('late0')) A.mistake('late', 'You crossed late (' + clk(t) + '): your half was already on the Warden.', 'Walk into your gate as soon as it opens, at the start of phase 2.', 0); else A.say('On the ' + SD[g.side] + ' ledge.'); }
        else if (G.p2.where[id] === 'p1') { G.p2.backT = t; if (t > T.rage && once('late1')) A.mistake('late', 'You came back late (' + clk(t) + ') for the heart burn.', 'Take your gate back as the tank brings the Doomscales to her.', 0); else A.say('Back by her: burn the heart.'); } }); });
    if (t > T.wardens + 10 && G.p2.where[me] === 'p0' && once('nocross')) A.mistake('side', 'You never crossed to your ledge.', 'Walk into your gate (the gold ring on your side of the platform) as soon as it opens.', 0);
    if (t > T.heart && G.p2.where[me] === 'L' && once('noback')) A.mistake('late', 'You stayed on the ledge through the heart burn.', 'Take your gate back to her when the call comes, as the tank brings the Doomscales.', 0); };
  // (once a run you're the backup: the plan's kicker has their kick on cooldown, so the cast is yours. It comes on a Cry or a Malice on your ledge
  // that your kick is ready for and you're near; never to a healer (no kick). Raids keep a backup for this: Flex, Nov 15: "i still dont see good
  // interupt mechanics", the audit: "a default run never asks for E")
  // (the release sweep, Nov 16: never when a kick of your own comes within the kick's 15 s cooldown. Both of a ledge's Doomscales cast their Cry together, so
  // a backup on the other one's left your own Cry with no kick on every default melee and ranged run. Each cast counts once as a chance, not once a step)
  const ownSoon = (t, key) => { const j = S.job[A.me], w = S.wardens.find((q) => q.side === j.side), w2 = w ? W2T(w, 'malice') : 1e9;
    return myKicks(t).some((m) => m.key !== key && m.at < t + 15) || !!(j.mal && G.p2.wd[j.side] && w2 > t && w2 < t + 15); };
  const backup = (t) => { const me = A.me, j = S.job[me]; if (G.p2.bk || !j || !range(me) || stunned(me, t) || t - G.p2.kickCd < 15) return;
    kickables(t).forEach((k) => { if (G.p2.bk || k.side !== j.side || k.who === me || !k.who || t > k.t0 + 0.15 || G.p2.kick[k.key]) return; if (pgDist([G.x, G.y], k.p) > range(me) + 4) return;
      if (ownSoon(t, k.key) || G.p2.bkSeen.has(k.key)) return; G.p2.bkSeen.add(k.key); if (G.p2.bkSeen.size < 1 + (S.seed % 2)) return; /* (the run's first or second chance, from its seed) */
      G.p2.bk = { key: k.key, t, who: k.who, kind: k.kind }; /* (the call: the order in big letters, and the way to get in reach when you're not (the prompts audit, Nov 16: its big line read only "Backup", and the player, out of reach, spent the kick on nothing)) */
      if (!window.__pgAuto) { const inR = pgDist([G.x, G.y], k.p) <= range(me); if (A.big) A.big(inR ? 'Your backup kick: Kick ' + k.kind + ' now (E)!' : 'Your backup kick: Get close to ' + casterName(k.key) + ', then press E!', '#f3c969'); A.say(A.nm(k.who) + '\'s kick is on cooldown: you\'re the backup.', true); } }); };
  // (a kick's caster in plain words: the Warden, or a Doomscale by its raid marker)
  const casterName = (key) => { if (key[0] === 'm') return 'the Warden'; const d = S.ds.find((q) => q.id === key.slice(1, -1)); return d ? 'the ' + P.mk[d.side][d.k - 1] + ' Doomscale' : 'the Doomscale'; };
  const kicks = (t0, t) => { const cr = (at) => at > t0 && at <= t, me = A.me; backup(t);
    // (the plan's kickers kick a moment into the bar (0.6 s for Malice, 0.9 s for a Cry, as on the kills); you kick yourself unless the autopilot plays)
    kickables(t).forEach((k) => { if (!k.who || stunned(k.who, t) || (k.who === me && (!window.__pgAuto || t - G.p2.kickCd < 15)) || t < k.t0 + (k.who === me ? 0.25 : kdelay(k.key, k.kind, k.rev))) return; if (pgDist(pos(k.who), k.p) <= range(k.who) + (k.who === me ? (G.p2.where[me] === 'p1' && window.__pgAuto ? 5 : 0) : G.p2.where[k.who] === 'p1' ? 10 : 3)) { if (k.who === me) G.p2.kickCd = t; kicked(k, k.who, t); } }); /* (the autopilot's own kicks keep the 15 s cooldown, as yours do (the release sweep, Nov 16), so the checks see a clash) */ /* (the autopilot, back by her, reaches 5 more while it dodges the small tails; you kick from your own reach) */ /* (the bots' kicks reach 3 yards further (10 back by her, where they dodge the small tails' waves too): the plan's kickers, never a miss of yours) */
    S.malice.forEach((m) => { const key = 'm' + m.side + m.k, bk = G.p2.bk && G.p2.bk.key === key, who = bk ? me : holder('mal', m.side, 1);
      if (cr(m.by) && !G.p2.kick[key] && G.p2.wd[m.side]) { G.p2.kick[key] = 'none'; G.p2.gone.push(m); m.cc.name = 'Warden: Malice (not kicked)'; G.p2.missed.push([who, 'a Malice not kicked ' + clk(m.t0)]);
        if (who === me) A.mistake('kick', bk ? 'You were the backup and didn\'t kick Malice (' + clk(m.t0) + '): it hit everyone every second for 6 s.' : 'You didn\'t kick Malice (' + clk(m.t0) + '): it hit everyone every second for 6 s.', 'Press E while the Warden\'s cast bar runs, within ' + range(me) + ' yards of it.', 0); }
      // (its ticks: 792k unmitigated on every living player, a second apart from a second after the bar; close to half a raider's health each)
      if (G.p2.kick[key] === 'none' && G.p2.malCut[key] == null) for (let k = 1; k <= 6; k++) if (cr(m.ch + k) && G.p2.wd[m.side]) { A.hurt(45); A.deb('malice', 1.2); } }); /* (malCut: its ticks left on you stop when you're revived (revive)) */
    S.cries.forEach((c) => { const key = 'c' + c.ds + c.i, d = G.p2.ds[c.ds], bk = G.p2.bk && G.p2.bk.key === key, who = bk ? me : holder('cry', c.side, c.dk); if (!cr(c.t1) || G.p2.kick[key] || !d) return; G.p2.kick[key] = 'none'; G.p2.missed.push([who, 'an Anguished Cry not kicked ' + clk(c.t0)]);
      GDZ_RAID.forEach((id) => { if (pgDist(pos(id), [d.x, d.y]) <= P.CRY) G.p2.stun[id] = t + 6; });
      // (516k and the 6 s stun on everyone in reach; with Revenge 1.03M, twice as much)
      if (pgDist([G.x, G.y], [d.x, d.y]) <= P.CRY) { A.deb('stun', 6); A.hurt(c.rev ? 50 : 25); if (who !== me) A.say('Anguished Cry' + (c.rev ? ' (Revenge)' : '') + ': nobody kicked it, you\'re stunned.', true); }
      if (who === me) A.mistake('kick', (bk ? 'You were the backup and didn\'t kick Anguished Cry (' : 'You didn\'t kick Anguished Cry (') + clk(c.t0) + ')' + (c.rev ? ', in 1.25 s with Revenge' : '') + ': everyone within 60 yards was stunned for 6 s.', c.rev ? 'With Revenge its bar is half as long: press E the moment it starts.' : 'Press E during the Doomscale\'s cast bar, within ' + range(me) + ' yards.', 0); }); };
  const tethers = (t0, t) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    if (cr(T.fangs)) { const n = { E: 0, W: 0 }; Object.keys(S.job).forEach((id) => { const j = S.job[id]; if (!j.teth) return; G.p2.teth[id] = { solo: j.teth === 'solo', br: null, side: j.side, n: n[j.side]++ };
      if (id === me) { A.deb('fangs', 30); A.say('Grasping Fangs on you: ' + (j.teth === 'solo' ? 'you break first, alone.' : 'you break second, with the 5.'), true); } }); }
    // (the five's break puts five stacks of Blight Vein on everyone at once: 640 to 960k each on the kills, under raid cooldowns; your defensive halves it)
    if (cr(T.five - 1.5) && !window.__pgAuto && A.big && G.p2.where[me] === 'L') A.big('The five break: Press Q now!', '#7fb8ff'); /* (not "your defensive": a call that says "your" reads as yours, and this one is everyone's) */
    if (t < T.fangs) return;
    Object.entries(G.p2.teth).forEach(([id, th]) => { if (th.br != null) return; const W = G.p2.wd[th.side]; if (!W) { if (G.p2.wdead[th.side] != null) th.br = 'gone'; return; } /* (its Warden dead: the tether goes with it) */ const d = pgDist(pos(id), W), bt = th.solo ? T.solo : T.five, lo = th.solo ? bt - 1.5 : bt - 1, hi = th.solo ? bt + 3 : bt + 1.5;
      const late = id === me && !window.__pgAuto && t > hi + 1;
      if (d <= P.TETHER && !late) return; th.br = t; vein(t); G.p2.tlog.push([id, t, t >= lo && t <= hi]); if (id !== me) return; if (G.debs.fangs) G.debs.fangs.until = t;
      if (t < lo) A.mistake('tether', 'You broke your tether early (' + clk(t) + '): ' + (th.solo ? 'the solo breaks on its own call.' : 'the five break together on their call.'), th.solo ? 'Stay within 20 yards of the Warden until the solo break call, then walk out alone.' : 'Wait at the edge of your tether (about 20 yards from the Warden) and step out on the five\'s call.', 0);
      else if (t > hi) A.mistake('tether', 'You broke your tether late (' + clk(t) + '): its Blight Vein landed apart from the others, so everyone took extra ticks.', th.solo ? 'Walk out past 25 yards from the Warden on the solo break call.' : 'Be at the edge of your tether early, then step out on the five\'s call.', 0);
      else A.say('Tether broken on time.'); }); };
  const eggs = (t0, t) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    // Warden's Protection: an egg can't be touched while its Warden lives, and it nicks anyone standing on one (about 43k, a median 2.6 yards from
    // the egg on the kills: a small tick, taken a few times a kill)
    if (t - G.p2.wardT > 4 && G.eggs.some((e) => e.state === 'floor' && wdUp(e.side) && Math.hypot(G.x - e.x, G.y - e.y) <= P.WARD)) { G.p2.wardT = t; A.mistake('ward', 'Warden\'s Protection: you stood on an egg while its Warden lived.', 'Stand beside the eggs, not on them, until the Warden is dead.', 4); }
    // into the cauldron: a carrier at their own ledge's pit, from the count
    G.eggs.forEach((e) => { if (e.state !== 'held' || !e.who) return; const p = pos(e.who); if (pgDist(p, S.pits[e.side]) > P.THROW) return;
      if (t < T.throwAt) { if (e.who === me && once('wait' + e.n)) A.say('In the ring: the small eggs go in together.'); return; }
      e.state = 'gone'; e.inAt = t; { const q = pgP2Away(S.pits[e.side], 3, e.n * 47, e.side); rawling(e.side, q, t); } /* (a Rawling climbs out of the cauldron for every small egg, as on the kills) */
      if (e.id === me) { if (t > T.throwAt + 7) A.mistake('late', 'Your egg went into the cauldron late (' + clk(t) + ').', 'Be at your lane spot by the cauldron before the call: in together.', 0); else A.say('Your egg is in the cauldron.'); } e.who = null; });
    if (cr(T.bigUp + 0.5)) G.eggs.forEach((e) => { if (e.id !== me || e.state === 'gone') return; if (e.state === 'floor') A.mistake('egg', 'You never picked up your egg (#' + e.n + ').', 'Your egg sits at the north end of your ledge (the gold circle): pick up your egg once the Warden is dead.', 0); else A.mistake('egg', 'Your egg (#' + e.n + ') wasn\'t in the cauldron before the big eggs were picked up.', 'Carry it to the cauldron and throw it in with the others on the call.', 0); }); };
  const big = (t0, t) => { const me = A.me;
    S.big.forEach((B, i) => { const st = G.p2.big[i], hd = holder('big', B.side, B.which);
      if (st.state === 'floor') { const mineB = hd === me, who = mineB ? (Math.hypot(G.x - B.x, G.y - B.y) <= P.BIG ? me : null) : hd && t >= S.bigAt[B.side][B.which] && pgDist(pos(hd), [B.x, B.y]) <= 2.2 ? hd : null; /* (you: anywhere inside its drawn 3-yard ring (the prompts audit, Nov 16: 2.2, so players who stopped in the ring, where the arrow went away, let it hatch); the bots as before) */
        if (who) { st.state = 'held'; st.who = who; st.at = t; if (who === me) { A.deb('doom', 20); if (G.eggs.some((e) => e.side === B.side && (e.south ? e.state === 'floor' : e.state !== 'gone'))) A.mistake('big', 'You picked up the big egg with small eggs still out.', 'Big eggs last (the plan): every small egg on your ledge is broken out and grabbed first.', 0); else A.say('Big egg picked up: carry it straight to the cauldron.'); }
          // (the south egg's pickup turns the south small eggs beside it into Clutches, 0.7 s later: 16 of the 30 fastest kills let that happen and kill them)
          if (B.which === 'far') G.eggs.forEach((e) => { if (!e.south || e.side !== B.side || e.state !== 'floor') return; e.state = 'gone'; e.who = null; const se = G.p2.se[e.qid]; se.state = 'gest'; se.at = t + 0.7; }); } /* (a south egg not yet grabbed when the south big egg goes up turns into a Clutch: break them out and grab them first) */
        else if (t >= T.doomEnd) { st.state = 'hatched'; ravenous(B, [B.x, B.y], t, hd === me, 'Your big egg hatched', 'Pick up your big egg on its call and carry it straight in.'); } }
      else if (st.state === 'held') { const p = pos(st.who);
        if (t - st.at >= 20) { st.state = 'hatched'; ravenous(B, p, t, st.who === me, 'Your big egg hatched in your hands (20 s after you picked it up)', 'Once picked up, a big egg hatches when the Doomscale Egg bar on your frame runs out: carry it straight to the cauldron.'); }
        else if (pgDist(p, S.pits[B.side]) <= P.THROW && t < S.bigIn[B.side] && st.who === me) { if (once('bw' + i)) A.say('In the ring: both big eggs go in together.'); }
        else if (pgDist(p, S.pits[B.side]) <= P.THROW && t >= S.bigIn[B.side] && !partnerComing(B, i, t)) { st.state = 'in'; st.inAt = t; G.p2.dsAt['ds' + B.side + (B.which === 'far' ? 1 : 2)] = t + 1; if (st.who === me) { if (G.debs.doom) G.debs.doom.until = t; A.say('Big egg in the cauldron: a Weakened Doomscale climbs out.');
          // (your big egg's "now", on the step it goes in: at the count when the other is there too, or as the other arrives. The review, Nov 16: the call sat after
          //  this step in check(), so once your egg was in it never fired, and it fired only when it didn't go in, the other carrier still coming. "Together" only when
          //  the other goes in with it)
          const k2 = S.big.findIndex((q, k) => k !== i && q.side === B.side), s2 = k2 >= 0 ? G.p2.big[k2] : null, tog = !!s2 && ((s2.state === 'in' && t - s2.inAt < 1.5) || (s2.state === 'held' && pgDist(pos(s2.who), S.pits[B.side]) <= P.THROW));
          if (!window.__pgAuto && A.big && once('bigin')) A.big(tog ? 'Your big egg: In together now!' : 'Your big egg: In the cauldron now!', '#f3c969'); } } } }); };
  // (a big egg that hatches: a Ravenous Doomscale at full health stands up there and, 6.5 s later, casts Dread Roar (2.5 s): on the kills' wipes it
  // killed 15 of 17 in 3 s. A wipe on a real pull; here a 6 s stun and a big hit, so you can play on)
  // (a ledge's two big eggs go in together: a carrier at the cauldron waits for the other one still on its way, up to 4 s past the count)
  const partnerComing = (B, i, t) => { if (t >= S.bigIn[B.side] + 4) return false; const j = S.big.findIndex((q, k) => k !== i && q.side === B.side), st = G.p2.big[j]; return !!st && st.state === 'held' && pgDist(pos(st.who), S.pits[B.side]) > P.THROW; };
  const ravenous = (B, p, t, mine, why, tip) => { G.p2.rav.push({ side: B.side, x: p[0], y: p[1], t, roar: t + T.ROAR + 2.5, mine, c: cast('rav', 'Ravenous Doomscale: Dread Roar', t + T.ROAR, t + T.ROAR + 2.5, { side: B.side, spell: 'roar' }) });
    if (mine) { G.wipes++; A.mistake('wipe', why + ': a Ravenous Doomscale stood up (its Dread Roar wipes a real raid; here it only stuns, so you can play on).', tip, 0); }
    // (an order, not news (the review, Nov 16: "a big egg hatched! Its roar wipes a real pull."): Q halves its hit. Q lasts 8 s and the roar lands 9 s after the hatch,
    //  so "now" waits for its cast bar (check())
    if (!window.__pgAuto && A.big) A.big('Ravenous Doomscale: Press Q when it roars!', '#ff5a4f'); };
  const cast = (who, name, t0, t1, x) => { const c = { who, name, t0, t1, ...(x || {}) }; S.casts.push(c); return c; };
  // (a Blightscale Rawling: from a Clutch, or a small egg in the cauldron. Phase 2 runs its own (own: practice.js leaves their health and their boiling to it))
  const rawling = (s, q, t) => { const a = { kind: 'rawling', own: true, side: s, x: q[0], y: q[1], born: t, hp: P.RHITS }; a.id = 'a' + (G.addN = (G.addN || 0) + 1); G.adds.push(a); return a; };
  const fans = (t0, t) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    S.dthrash.forEach((f, i) => { const d = G.p2.ds[f.ds]; if (cr(f.t0) && d) { const tk = pos(tankOf(f.side)), F0 = { i, t0: f.t0, at: f.at, p: [d.x, d.y], dir: Math.atan2(tk[1] - d.y, tk[0] - d.x), tank: tankOf(f.side) }; G.p2.fan.push(F0);
        /* (a call only when you're in or by its cone (the prompts audit, Nov 16: four labels counting down, no call)) */ if (!window.__pgAuto && A.big && F0.tank !== me && inFan(F0, G.x, G.y, 2) && once('fanc' + i)) A.big('Doomscale frontal: Step behind it!', '#ff5a4f'); }
      const F = G.p2.fan.find((q) => q.i === i); if (F && cr(f.at) && inFan(F, G.x, G.y)) A.mistake('frontal', 'Desperate Thrash hit you: you stood in front of a Doomscale.', 'Its frontal goes toward its tank: stand behind it or beside it.', 30); });
    G.p2.fan = G.p2.fan.filter((q) => t <= q.at + 0.6); };
  // ---- the adds, each step: the Wardens' health (and a second round if one lives), the Clutches, the south eggs, the Rawlings, the Doomscales ----
  const W2T = (w, k) => w.up + T.W2[k];
  const wardens = (t0, t, dt) => { const cr = (at) => at > t0 && at <= t, me = A.me, span = T.wdie - (T.molt + 3);
    S.wardens.forEach((w) => { const s = w.side; if (!G.p2.wd[s] || t < w.molt) return;
      G.p2.whp[s] -= (1 - shareOf(s)) / span * dt; /* (the raid's damage: it dies about 3:38 when you do your share) */
      if (G.p2.whp[s] <= 0) { G.p2.wdead[s] = t; delete G.p2.wd[s]; S.casts.forEach((c) => { if (c.who === 'warden' && c.side === s && c.t1 > t) c.t1 = Math.max(c.t0, t); });
        G.eggs.forEach((e) => { if (e.side !== s || e.state !== 'floor') return; e.shell = t + 2.5 + S.eggs.filter((q) => q.side === s && pgDist([q.x, q.y], S.pits[s]) > pgDist([e.x, e.y], S.pits[s])).length * 0.8; e.wd = t; }); /* (the raid breaks them out 2.5 to 8.1 s after the Warden dies, the far ones first, apart enough that neighbours' carriers don't meet: on the kills a median 6.0 s, middle half 3.8 to 7.4) */
        // (its eggs, touched before they open, say so plainly now its shield is gone; and your call comes now, when your own ledge's Warden dies, worded for your
        //  job (the prompts audit, Nov 16: a call at a fixed 3:38.3 for everyone said "pick up your egg", up to 4 s before some Wardens died, and to big-egg
        //  carriers and healers too))
        G.eggs.forEach((e) => { if (e.side === s && e.state === 'floor' && !e.south) e.lock = 'Not open yet: hit it (Tab, then 1), or wait a moment.'; });
        const jm = S.job[me]; if (jm.side === s && G.p2.where[me] === 'L') { A.say('The Warden is dead.');
          const myEgg = G.eggs.some((e) => e.id === me && e.state === 'floor' && !e.south);
          const [tx, you] = myEgg ? ['Warden dead: Wait by your egg: it opens soon', 1] : jm.big ? ['Warden dead: Stay with your half, your big egg comes later', 1] : me[0] === 'h' ? ['Warden dead: Stay with your half, off the carriers\' rings', 1] : ['Warden dead: Kill the Rawlings (Tab, then 1)', 0];
          S.warns.push({ t: t + 0.05, text: tx, c: '#f5d33a', ...(you ? { you: 1 } : {}) }); S.warns.sort((a, b) => a.t - b.t); }
        return; }
      // (still up 46 s after it stood up: Shadow Molt again, Writhing Gestation again (more of its eggs turn), another Malice at 55.3 s)
      const r = G.p2.w2[s];
      if (cr(W2T(w, 'molt'))) { cast('warden', 'Warden: Shadow Molt', t, t + 3, { side: s, spell: 'molt' }); if (S.job[me].side === s && me[0] !== 'h' && !window.__pgAuto && A.big) A.big('Warden still up: Kill the Warden before it turns more eggs!', '#c38bff'); }
      if (cr(W2T(w, 'gest'))) r.gest = cast('warden', 'Warden: Writhing Gestation', t, t + 3, { side: s, spell: 'gest' });
      if (r.gest && !r.done && t >= r.gest.t1 + 0.3 && r.gest.t1 > r.gest.t0 + 2.9) { r.done = true; const W = w.at, near = G.eggs.filter((e) => e.side === s && e.state === 'floor').sort((a, b) => pgDist([a.x, a.y], W) - pgDist([b.x, b.y], W)).slice(0, s === 'E' ? 2 : 3);
        near.forEach((e, i) => { e.state = 'gone'; e.who = null; G.p2.cl['c2' + s + i] = { id: 'c2' + s + i, side: s, x: e.x, y: e.y, born: t, hp: 1, dead: null, set: 3 }; if (e.id === me) A.mistake('add', 'Your egg (#' + e.n + ') turned into a Clutch: the Warden lived long enough for a second Writhing Gestation.', 'Hit the Warden (Tab, then 1) so it dies before it starts over.', 0); });
        if (near.length && shareOf(s) && once('w2' + s)) A.mistake('add', 'The Warden lived long enough for a second Writhing Gestation: ' + near.length + ' more eggs turned into Clutches.', 'Hit the Warden (Tab, then 1) whenever nothing more urgent is up: it should die before it starts over.', 0); }
      if (cr(W2T(w, 'malice'))) { const t1 = t; S.malice.push({ side: s, k: 2, t0: t1, ch: t1 + 1.5, by: t1 + 2.4, t1: t1 + 7.5, c: cast('warden', 'Warden: Malice', t1, t1 + 1.5, { side: s, spell: 'malice', kick: true }), cc: cast('warden', 'Warden: Malice (channel)', t1 + 1.5, t1 + 7.5, { side: s, spell: 'malice', kick: true, by: t1 + 2.4 }) }); } }); };
  const clutches = (t0, t, dt) => { const me = A.me;
    // (set 1: the Warden's nearest eggs, 0.3 s after its Writhing Gestation; set 2: the south eggs, 0.7 s after the south big egg is picked up beside them)
    S.clutches.forEach((c) => { if (!G.p2.cl[c.id] && t >= c.up && G.p2.wd[c.side]) G.p2.cl[c.id] = { id: c.id, side: c.side, x: c.x, y: c.y, born: t, hp: 1, dead: null, set: 1 }; });
    S.south.forEach((q) => { const se = G.p2.se[q.id]; if (se.state === 'gest' && t >= se.at) { se.state = 'clutch'; G.p2.cl['c' + q.id] = { id: 'c' + q.id, side: q.side, x: q.x, y: q.y, born: t, hp: 1, dead: null, set: 2 }; } });
    // (the raid cleaves them, the oldest first, from 1.5 s after they turn: about 6.9 s each on the kills; a Clutch that dies leaves a Rawling on its spot)
    ['E', 'W'].forEach((s) => { const L0 = Object.values(G.p2.cl).filter((c) => c.side === s && c.dead == null && t >= c.born + 1.5).sort((a, b) => a.born - b.born); if (L0[0]) L0[0].hp -= P.CPACE * (1 - addShare(s, 'clutch', L0)) * dt; });
    Object.values(G.p2.cl).forEach((c) => { if (c.dead != null) return;
      if (c.hp <= 0) { c.dead = t; rawling(c.side, [c.x, c.y], t); return; }
      // (one the raid leaves 20 s hatches a Blightscale Viper (the guide; no kill let one live that long): Putrid Membrane on everyone)
      if (t >= c.born + T.CHATCH) { c.dead = t; c.hatched = true; G.adds.push({ kind: 'viper', x: c.x, y: c.y, born: t }); A.deb('putrid', 20, true);
        if (shareOf(c.side)) A.mistake('viper', 'A Clutch lived 20 s and hatched a Viper (Putrid Membrane on the whole raid).', 'Kill the glowing eggs as they turn: Tab picks one, then keep pressing 1.', 8); } }); };
  const rawlings = (t0, t, dt) => { const cr = (at) => at > t0 && at <= t, me = A.me;
    ['E', 'W'].forEach((s) => { const L0 = G.adds.filter((a) => a.own && a.kind === 'rawling' && a.side === s).sort((a, b) => a.born - b.born);
      // (the raid's damage on the oldest; your share comes from your hits)
      if (L0[0] && t >= L0[0].born + 1.1) { const a = L0[0]; a.hp -= rpace(s, t) * (1 - addShare(s, 'rawling', L0)) * P.RHITS * dt; }
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
      if (once('dsw')) { const jm = S.job[me] || {}; S.warns.push(jm.cry ? { t: t + 0.05, text: 'Weakened Doomscales: Kick your ' + P.mk[jm.side][jm.cry - 1] + ' Doomscale\'s Cry (E)!', c: '#f3c969', you: 1 } : { t: t + 0.05, text: 'Weakened Doomscales: Stay behind the Doomscales, out of their front', c: '#c9d98a' }); S.warns.sort((a, b) => a.t - b.t); } /* (the kick only to a kicker: healers have none (the prompts audit, Nov 16)) */
      T.CRY.forEach((o, i) => { const c0 = at + o, len = st.rev != null ? 1.25 : 2.5; S.cries.push({ ds: d.id, side: d.side, dk: d.k, i: i + 1, t0: c0, t1: c0 + len, rev: st.rev != null, c: cast('ds', 'Doomscale: Anguished Cry', c0, c0 + len, { ds: d.id, side: d.side, spell: 'cry', kick: true }) }); });
      T.THRASH.forEach((o) => { const a1 = at + o, len = st.rev != null ? 1.5 : 3; S.dthrash.push({ ds: d.id, side: d.side, t0: a1 - len, at: a1, c: cast('ds', 'Doomscale: Desperate Thrash', a1 - len, a1, { ds: d.id, side: d.side, spell: 'thrash' }) }); }); });
    // (a Thrash about to start while its Doomscale is still being dragged waits until it's settled by its tank (on the kills the drag takes about 13 s and the
    // first Thrash comes as it ends), so its frontal never goes off in the middle of the raid's walk)
    S.dthrash.forEach((f) => { if (f.t0 <= t || f.t0 > t + dt + 0.01) return; const c = G.p2.ds[f.ds], crossing = GDZ_RAID.some((id) => S.job[id].side === f.side && (G.p2.where[id] === 'L' ? G.p2.big.every((b) => b.who !== id) && t >= S.home[id] - 1 : t - (G.p2.landT[id] == null ? -99 : G.p2.landT[id]) < 4)); if (c && (!G.p2.settled[f.side] || crossing) && (f.held = (f.held || 0) + 1) < 160) { const k = dt + 0.05; f.t0 += k; f.at += k; f.c.t0 += k; f.c.t1 += k; } });
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
      S.impacts.push({ x: p[0], y: p[1], r: 4, t0: t, at: t + 6.5, name: 'Virulent Spit', dmg: 40, color: '#7ddc3a', fill: '#5fbf2a', tip: 'A green swirl under you: step out of the green swirl before it lands.' });
      if (who === me && !window.__pgAuto && A.big) A.big('Virulent Spit: Step out of the green swirl!', '#ff5a4f'); }); }); }; /* (not "under you": a red dodge call, not gold (the review, Nov 16)) */
  // ---- the small eggs broken out by the raid (Flex, Nov 16; the 30 fastest kills: the north eggs are hit from 3:03 as the raid cleaves the Clutches and the
  // Warden, their Hardened shields break about 3:22 (15 s before the Warden dies), each egg breaks open about 6 s after it dies; the two south eggs a ledge
  // come up about 3:55, are hit from 4:01.6 and broken about 4:15.6, and their carriers take them in) ----
  // (the Hardened shield's share left is e.hs, not e.shp: practice.js wears down your own egg's e.shp, phase 1's shell, every step, so in phase 2 your egg read
  //  "Shell broken: walk over your egg to pick it up" at 2:48.6 and could be picked up on the ledge before its Warden died (the prompts audit, Nov 16))
  const eggFr = (e, t) => (e.south ? Math.max(0, e.ehp) : e.hs > 0 ? 0.5 + 0.5 * e.hs : e.wd == null ? 0.5 : Math.max(0, Math.min(0.5, 0.5 * (e.shell - t) / Math.max(0.1, e.shell - e.wd))));
  const breakEggs = (t0, t, dt) => { const cr = (at) => at > t0 && at <= t;
    G.eggs.forEach((e) => { if (e.state !== 'floor' || e.south) return; if (e.hs == null) e.hs = 1; if (t >= T.clutch && e.hs > 0) e.hs = Math.max(0, e.hs - dt / (202.4 - T.clutch)); });
    if (cr(T.set2)) S.south.forEach((q, i) => { const k = +q.id.slice(-1), who = Object.keys(S.job).find((id) => S.job[id].side === q.side && S.job[id].south === k) || null; G.eggs.push({ id: who, side: q.side, n: 100 + k, x: q.x, y: q.y, land: t, shell: 1e9, set: 2, state: 'floor', who: null, south: true, qid: q.id, ehp: 1, lock: 'Break it out first: hit it (Tab, then 1).' }); });
    G.eggs.forEach((e) => { if (!e.south || e.state !== 'floor' || e.shell < 1e8) return; if (t >= T.s2hit) e.ehp -= dt / (T.s2die - T.s2hit); if (e.ehp <= 0) { e.ehp = 0; e.shell = t; } });
    // (the south big egg goes up as soon as the ledge's two south eggs are grabbed (in that kill, 2 s after the last); 4:22 at the latest)
    ['E', 'W'].forEach((s) => { if (G.p2.farGo[s]) return; const se = G.eggs.filter((e) => e.south && e.side === s); if ((se.length === 2 && se.every((e) => e.state !== 'floor')) || t >= 262) { G.p2.farGo[s] = t; S.bigAt[s].far = Math.min(Math.max(t + 2, S.bigAt[s].far - 6), 262); } }); };
  // (your hits on the Warden, a Clutch or a Doomscale (practice.js's hitTgt: a Rawling or a Viper it takes itself): your share of the raid's damage)
  const hit = (key) => { sync(); if (!G || !G.p2) return;
    if (key === 'wdE' || key === 'wdW') { const s = key.slice(2); if (G.p2.wd[s]) G.p2.whp[s] -= hitVal(P.SHARE / 20); return; }
    const c = G.p2.cl[key]; if (c && c.dead == null) { c.hp -= hitVal(1 / P.CHITS); return; }
    const st = G.p2.dsS[key]; if (st && st.dead == null) { st.hp -= hitVal(P.SHARE / 13.5); G.p2.dsHits[key] = (G.p2.dsHits[key] || 0) + 1; return; }
    // (an egg: a north one's shield first; its egg only once its Warden is dead (Warden\'s Protection); a south one, straight on)
    const eg = /^egg(\d+)([EW])$/.exec(key), e = eg && G.eggs.find((q) => q.n === +eg[1] && q.side === eg[2] && q.state === 'floor'); if (!e) return; const t = G.t;
    if (e.south) { if (e.shell > 1e8) { e.ehp -= hitVal(0.08); if (e.ehp <= 0) { e.ehp = 0; e.shell = t; } } return; }
    if (e.hs > 0) { e.hs = Math.max(0, e.hs - hitVal(0.06)); return; } if (G.p2.wd[e.side]) { if (once('wp' + Math.floor(t / 5))) A.say('Warden\'s Protection: it can\'t break open while the Warden lives.', true); return; } e.shell = Math.max(t, e.shell - hitVal(0.6)); };
  const check = (t0, t) => { sync(); const dt = t - t0, me = A.me;
    S.wardens.forEach((w) => { const p = wdAt(w, t); if (p) G.p2.wd[w.side] = p; else delete G.p2.wd[w.side]; });
    // (each ledge's tank: settled at its spot, or still dragging its Doomscales across)
    ['E', 'W'].forEach((s) => { const tk = tankOf(s); G.p2.settled[s] = pgDist(pos(tk), job(tk, t).T) <= 2.5; });
    wardens(t0, t, dt); clutches(t0, t, dt); doomscales(t0, t, dt); breakEggs(t0, t, dt);
    S.ds.forEach((d) => { const p = dsWant(d, t); if (!p) { delete G.p2.ds[d.id]; return; } const c = G.p2.ds[d.id]; if (!c || pgDist([c.x, c.y], p) > 40) { G.p2.ds[d.id] = { x: p[0], y: p[1] }; return; }
      if (S.casts.some((q) => q.ds === d.id && t >= q.t0 && t <= q.t1)) return; /* (it stands still to cast, as in WoW: its frontal goes off where it stood) */ const ex = p[0] - c.x, ey = p[1] - c.y, ee = Math.hypot(ex, ey), sp = 9 * dt; if (ee > sp) { c.x += ex / ee * sp; c.y += ey / ee * sp; } else { c.x = p[0]; c.y = p[1]; } });
    gates(t); kicks(t0, t); tethers(t0, t); eggs(t0, t); big(t0, t); fans(t0, t); rawlings(t0, t, dt); spit(t0, t);
    // (the Ravenous Doomscale's Dread Roar lands: everyone stunned, a big hit)
    G.p2.rav.forEach((r) => { if (r.c.t0 > t0 && r.c.t0 <= t && !window.__pgAuto && A.big) A.big('Dread Roar: Press Q now!', '#ff5a4f'); /* (as its cast bar starts, 2.5 s before it lands: Q's 8 s cover it (the review, Nov 16)) */
      if (r.roar > t0 && r.roar <= t) { GDZ_RAID.forEach((id) => { G.p2.stun[id] = t + 6; }); A.deb('stun', 6); A.hurt(40); if (!window.__pgAuto) A.say('Dread Roar: everyone stunned. A wipe on a real pull.', true); } });
    // (your big egg's "pick it up now" at your pickup time (the south one's moves with its small eggs); its "now" as they go in together comes from big(), on the step it
    //  goes in. The prompts audit, Nov 16: a 3, 2, 1 count timed for the bots ran while you were still 40 to 19 yards out; the bar counts, the call says when)
    if (!window.__pgAuto && A.big) { const jm = S.job[me], bi = jm && jm.big ? bigIx(jm.side, jm.big) : -1, bg = bi >= 0 ? G.p2.big[bi] : null;
      if (bg && bg.state === 'floor' && t < T.doomEnd && t >= S.bigAt[jm.side][jm.big] && once('bigup')) A.big('Your big egg: Pick up your big egg now!', '#f3c969'); }
    // (your kick, as its bar starts, the same moment the job line says "now"; your way into reach if you're not in it. The backup's has its own call. Gold, as yours:
    //  the review, Nov 16, found it in another yellow that the screen didn't count as yours)
    if (!window.__pgAuto && A.big) { const k = myKicksNow(t)[0]; if (k && t >= k.at && t < k.at + 0.5 && !(G.p2.bk && G.p2.bk.key === k.key) && once('kc' + k.key)) { const p = kickPos(k.key), inR = !!p && pgDist(p, [G.x, G.y]) <= range(me);
      A.big(inR ? k.kind + ': Press E now: your kick!' : k.kind + ': Your kick: get close to ' + casterName(k.key) + '!', '#f3c969'); } }
    if (A.has('vein')) G.hp -= 3 * G.debs.vein.n * dt * (A.has('def') ? 0.5 : 1);
    if (A.has('acid')) G.hp -= 2.2 * G.debs.acid.n * dt * (A.has('def') ? 0.5 : 1);
    G.p2.intr = G.p2.intr.filter((q) => t - q.t <= 1.6); G.p2.own = G.adds.filter((a) => a.own);
    if (stunned(me, t) && once('stun' + Math.floor(t))) A.clearTarget(); };

  // ---- the screen: your job now, what's next, the kick button ----
  // (your kicks: your ledge's Malice if it's yours (and its second, if the Warden lives that long), your Doomscale's Cries, and the one you're backing up)
  const myKicks = (t) => { const j = S.job[A.me]; if (!j) return []; const bk = G.p2.bk ? G.p2.bk.key : null;
    return S.malice.filter((m) => m.side === j.side && (j.mal || bk === 'm' + m.side + m.k)).map((m) => ({ at: m.t0, by: m.by, kind: 'Malice', key: 'm' + m.side + m.k }))
      .concat(S.cries.filter((c) => (c.side === j.side && c.dk === j.cry) || bk === 'c' + c.ds + c.i).map((c) => ({ at: c.t0, by: c.t1, kind: 'Anguished Cry', key: 'c' + c.ds + c.i, rev: c.rev }))).filter((k) => !G.p2.kick[k.key] && k.by >= t).sort((a, b) => a.at - b.at); };
  // (and the ones that will still come: not a dead Doomscale's Cries, nor a dead Warden's Malice. The screen and your arrow read these (the prompts audit, Nov 16:
  //  with your Doomscale dead the job line kept saying "Your kick is next: get close to the Skull Doomscale"); the backup's own-kick check keeps myKicks as it was)
  const myKicksNow = (t) => myKicks(t).filter((k) => (k.key[0] === 'm' ? G.p2.wdead[k.key[1]] == null : !!G.p2.dsS[k.key.slice(1, -1)] && G.p2.dsS[k.key.slice(1, -1)].dead == null));
  // ---- the job line (Nov 16, the prompts audit; Flex: "I think the alerts and training wheels could be better in terms of the on screen prompts", then "i feel
  // like the game confuses people saying timestamps"): one order about you, verb first, in plain words, with no clock time and no seconds (the boss-mod bars and
  // the cast bars count). The first of these that applies: (a) a dodge: something lands on you or the waves cross you; (b) your step, due now: a kick, the
  // tether's break, a pickup, into the cauldron; (c) the walk to your next step, from when it's named (the arrow comes with it); (d) hitting the right thing;
  // (e) your standing job. Never another player's timer ("Next: Virulent Spit in 11 s" to someone the swirl wasn't under). The way back through your gate comes
  // before a kick, and a kick due on the way goes after it, never in its place (a kick line had pushed it out, and a player stayed on the ledge) ----
  const kickLine = (k) => { const p = kickPos(k.key), inR = !!p && pgDist(p, [G.x, G.y]) <= range(A.me), bk = G.p2.bk && G.p2.bk.key === k.key;
    return inR ? (bk ? 'Backup: kick ' : 'Kick ') + k.kind + ' now (E)!' + (k.rev ? ' Its bar is short (Revenge).' : '') : (bk ? 'Backup: get close to ' : 'Get close to ') + casterName(k.key) + ', then press E!'; };
  // ((a): a circle landing on you soon, a frontal you're in, a small tail's wave about to cross you, an egg's shield)
  const dangerText = (t) => { const me = A.me, P0 = [G.x, G.y];
    const m = S.impacts.find((q) => t >= q.t0 && t <= q.at && q.at - t <= 3.5 && pgDist(P0, [q.x, q.y]) < q.r + 1); /* (a green swirl's own call comes as it appears; the job line from 3.5 s before it lands, so it doesn't hide a step due now) */
    if (m) return m.name === 'Virulent Spit' ? 'Virulent Spit: step out of the green swirl!' : 'Falling Debris: step out of the brown circle!';
    if (G.p2.fan.some((f) => t >= f.t0 && t <= f.at && f.tank !== me && inFan(f, G.x, G.y, 1))) return 'Doomscale frontal: step behind it!';
    if (S.waves.some((wv) => waveAt(wv, P0, t, -0.3, 3))) return 'Small tails: step out of the red lane!';
    if (G.eggs.some((q) => q.state === 'floor' && wdUp(q.side) && Math.hypot(G.x - q.x, G.y - q.y) < P.WARD + 1)) return 'Step off the egg: its shield hurts you while the Warden lives.';
    return null; };
  // (your countdown alerts (Flex, Nov 17: '"Break tether in 20s" and it slowly counts down'): from the moment your tether lands, "Break tether in Ns" to your
  //  break, whole seconds, then "Break tether now!" until you're out (1.5 s at most). Nothing once it's broken or its Warden is dead)
  const alerts = (t) => { sync(); if (!G || !G.p2 || !S) return []; const th = G.p2.teth[A.me]; if (!th || t < T.fangs || th.br != null || !wdUp(th.side)) return [];
    const tb = th.solo ? T.solo : T.five, left = tb - t; if (left > 0) return [{ key: 'teth', text: 'Break tether in ' + Math.ceil(left - 1e-6) + 's', c: '#f3c969' }];
    return t < tb + 1.5 ? [{ key: 'teth', text: 'Break tether now!', c: '#f3c969', now: 1 }] : []; };
  const jobText = () => { sync(); const t = G.t, me = A.me, j = S.job[me], s = j.side, w = G.p2.where[me], th = G.p2.teth[me], e = G.eggs.find((q) => q.id === me && q.state !== 'gone'), bi = j.big ? bigIx(s, j.big) : -1, bg = bi >= 0 ? G.p2.big[bi] : null, k = myKicksNow(t)[0];
    const heal = me[0] === 'h', here = [G.x, G.y], inRing = pgDist(here, S.pits[s]) <= P.THROW, wDead = G.p2.wdead[s] != null, wd = G.p2.wd[s], bt = j.big ? S.bigAt[s][j.big] : 0;
    if (stunned(me, t)) return 'Stunned: wait for it to wear off.';
    // (a) a dodge; and the way to your spot crossed by something about to land or go off: no arrow (job), wait
    const dz = dangerText(t); if (dz) return dz;
    const lw = G.p2.lastWait; if (lw && Math.abs(lw.t - t) < 0.3) return 'Wait: let ' + lw.why + ', then go.';
    if (w === 'p0') return t < T.gate ? 'Your gate (the gold ring) opens next: stand by it.' : 'Walk into your gate (the gold ring) to cross to the ' + SD[s] + ' ledge.';
    if (w === 'L' && G.p2.wside[me] !== s) return 'Wrong ledge: take this ledge\'s gate back, then your own.';
    const kNow = k && t >= k.at;
    if (w === 'L' && t >= S.home[me] && t < T.heart) return 'Back to her: walk into your gate.' + (kNow ? ' ' + kickLine(k) : '');
    // (b) your step, due now
    if (kNow) return kickLine(k);
    const thOn = th && th.br == null && t >= T.fangs && wdUp(th.side), tb = th ? (th.solo ? T.solo : T.five) : 0;
    if (thOn && t >= tb) return 'Break now: walk out past 25 yards!';
    if (thOn && t >= tb - 5.5) return th.solo ? 'Walk to your tether\'s edge: you break first.' : 'Walk to your tether\'s edge: you break with the 5.';
    if (e && e.state === 'floor' && wDead && t >= e.shell) return 'Pick up your egg (#' + e.n + ') now: walk over it!';
    if (bg && bg.state === 'floor' && t < T.doomEnd && t >= bt) return 'Pick up your big egg now: walk onto it!';
    if (e && e.state === 'held' && t >= T.throwAt) return inRing ? 'Into the cauldron now: hold still in the gold ring.' : 'Into the cauldron now: step into the gold ring!';
    if (bg && bg.state === 'held' && t >= S.bigIn[s]) return inRing ? 'Wait in the ring: the other big egg is coming.' : 'Into the cauldron now: sprint (Shift) into the gold ring!';
    // (c) the walk to your next step, from when it's named
    if (k && t >= k.at - KLEAD) { const p = kickPos(k.key), inR = !!p && kickIn(k.key, p); G.p2.kIn = inR ? k.key : null; return inR ? 'Your kick is next: press E when ' + casterName(k.key) + '\'s bar starts.' : 'Your kick is next: get close to ' + casterName(k.key) + ' (the arrow).'; }
    if (e && e.state === 'floor' && wDead) return 'Wait by your egg (#' + e.n + '): hit your egg to open it (Tab, then 1).';
    if (e && e.state === 'held') return inRing ? 'Wait in the gold ring: the small eggs go in together.' : 'Carry your egg to your spot by the cauldron (gold).';
    if (bg && bg.state === 'held') return inRing ? 'Wait in the gold ring: both big eggs go in together.' : 'Sprint (Shift) to the cauldron: your spot in the gold ring.';
    // (outside its gold ring: stepping into it picks it up (the review, Nov 16: "Wait by your big egg" took a player 2.6 yards from it, inside the ring, who picked it
    //  up early with the south eggs still out, and they turned into Clutches))
    if (bg && bg.state === 'floor' && t < T.doomEnd && t >= bt - 16) { const far = pgDist(here, [S.big[bi].x, S.big[bi].y]) > 12;
      return j.big === 'far' ? (far ? 'Walk to your big egg at the south end (the arrow).' : 'Wait outside your egg\'s gold ring until both south eggs are carried off.') : (far ? 'Run alone to your big egg at the north end (the arrow).' : 'Wait outside your egg\'s gold ring until the call.'); }
    if (j.cry && w === 'L' && !dsOut(s) && t >= dsNext(s) - (bg && bg.state === 'floor' ? 8 : 10)) return (pgDist(here, L(s, P.dsKick)) > 6 ? 'Back to the cauldron' : 'Wait by the cauldron') + ': your ' + P.mk[s][j.cry - 1] + ' Doomscale climbs out next.';
    if (w === 'L' && wd && t >= T.fangs - 8 && t < T.fangs && pgDist(here, wd) > 19) return 'Tethers come next: stand within 20 yards of the Warden.';
    // (a tether on you: which break is yours, steady from the moment it lands until the walk to its edge; before the right target, which flipped the line every
    //  second between "Hit the Warden" and the tether: Flex, Nov 17, "its not clear if youre the early break or the late break with the 5")
    if (thOn) return th.solo ? 'You break first, alone: stay by the Warden.' : 'You break second, with the 5: stay by the Warden.';
    // (d) the right target
    const dh = A.dpsHint && A.dpsHint(); if (dh) return dh;
    // (e) your standing job (a tether on you: where to stay until your walk, and which break is yours; the NEXT line names the walk)
    if (w === 'L') {
      if (t < T.wardens) return 'The Warden stands up next: wait here, off the eggs.';
      if (wdUp(s) && t < Math.min(...S.wardens.map((w) => w.molt))) return 'The Warden lands next: hit it once its cast ends.'; /* (before its Shadow Molt ends Tab picks nothing: "Hit the Warden" was false there, Nov 17 review) */
      if (wdUp(s)) return heal ? (t < T.fangs ? 'Stay with your half, within 20 yards of the Warden.' : 'Stay with your half, off the eggs.') : e ? 'Hit the Warden: your egg (#' + e.n + ') opens once it dies.' : j.big ? 'Hit the Warden: your big egg comes later.' : 'Hit the Warden with your half, off the eggs.';
      if (dsOut(s)) return 'Stand behind or beside the Doomscales, never in front.';
      if (bg && bg.state === 'floor') return 'Stay with your half: your big egg comes later.';
      return !heal && G.adds.some((a) => a.own && a.side === s) ? 'Kill the Rawlings as they climb out (Tab, then 1).' : 'Stay with your half, out of the carriers\' rings.'; }
    if (t >= T.heart) return heal ? 'Step out of the brown circles as they fall.' : 'Hit the heart, and step out of the brown circles.';
    if (w === 'p1') return 'Stay by her, out of the front of the Doomscales.';
    return ''; };
  // (the line under it (the audit's NEXT line): your next step and where, as an order, from 10 s before it until the job line names it; nothing when nothing of
  //  yours is coming. For practice.js to show in place of the three-item list: P2.nextText)
  const nextText = () => { sync(); if (!G || !G.p2) return ''; const t = G.t, me = A.me, j = S.job[me], s = j.side, L0 = [], add = (at, named, text) => { if (t >= at - 10 && t < named) L0.push({ at, text }); };
    if (G.p2.where[me] === 'p0') add(T.gate, T.gate, 'Then: walk into your gate (the gold ring).');
    myKicksNow(t).forEach((k) => add(k.at, k.at - KLEAD, 'Then: kick ' + k.kind + ' on ' + casterName(k.key) + ' (E).'));
    const th = G.p2.teth[me]; if (th && th.br == null) { const tb = th.solo ? T.solo : T.five; add(tb - 5.5, tb - 5.5, 'Then: walk to the edge of your tether.'); }
    const bi = j.big ? bigIx(s, j.big) : -1, bg = bi >= 0 ? G.p2.big[bi] : null; if (bg && bg.state === 'floor') add(S.bigAt[s][j.big] - 16, S.bigAt[s][j.big] - 16, 'Then: walk to your big egg at the ' + NS[j.big] + ' end.');
    if (j.cry && !j.big && !dsOut(s)) { const at = dsNext(s) - 10; add(at, at, 'Then: back to the cauldron for your ' + P.mk[s][j.cry - 1] + ' Doomscale.'); } /* (a big egg's carrier is on the way to the cauldron already) */
    if (G.p2.where[me] === 'L') add(S.home[me], S.home[me], 'Then: back to her through your gate.');
    const n = L0.sort((a, b) => a.at - b.at)[0]; return n ? n.text : ''; };
  const upNext = (t) => { sync(); const me = A.me, j = S.job[me], L0 = [], add = (at, text, c) => { if (at > t && at - t <= 30) L0.push({ at, text, c }); };
    if (G.p2.where[me] === 'p0') add(T.gate, 'Your gate opens', '#c084ff');
    myKicksNow(t).forEach((k) => add(k.at, 'Your kick: ' + k.kind, '#b06bff'));
    const th = G.p2.teth[me]; if (th && th.br == null) add(th.solo ? T.solo : T.five, th.solo ? 'Your solo break' : 'Break with the five', '#ff8a6a'); else if (t < T.fangs) add(T.fangs, 'Grasping Fangs', '#ff8a6a');
    const e = G.eggs.find((q) => q.id === me && q.state !== 'gone'); if (e) { add(e.shell, 'Your egg opens', '#f3c969'); add(T.throwAt, 'Small eggs in', '#f5d33a'); }
    if (j.big) { add(S.bigAt[j.side][j.big], 'Pick up the ' + NS[j.big] + ' big egg', '#e6b450'); add(S.bigIn[j.side], 'Your big egg: in together', '#e6b450'); } /* ("Your ..." bars get the 3-2-1 beeps) */
    /* (the debris bar to its landing, the same time as its boss-mod timer, so they show as one bar; the Clutches' only to those who hit them) */
    /* (your ledge's next Doomscale frontal: it had no bar, only labels counting down (the prompts audit, Nov 16)) */ { const f = S.dthrash.filter((q) => q.side === j.side && q.at > t && G.p2.ds[q.ds]).sort((a, b) => a.at - b.at)[0]; if (f) add(f.at, 'Doomscale frontal', '#ff9b4a'); }
    T.debris.forEach((d) => add(d, 'Falling Debris', '#c8a36a')); add(S.home[me], 'Back to her', '#c084ff'); add(T.heart, 'Heart open', '#ff8a5a'); if (!dsOut(j.side)) add(dsNext(j.side), 'Doomscales', '#c9d98a'); if (me[0] !== 'h') add(T.clutch, 'Clutches: kill them', '#c38bff');
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
      (pk.egg === 'far' || pk.egg === 'close' ? esc('Picked: the ' + NS[pk.egg] + ' big egg. Pick it up ' + (pk.egg === 'far' ? 'as soon as the two south small eggs are grabbed' : 'after the small eggs, running there alone') + ', and throw it in with the other on the call.') : pk.egg ? esc('Picked: small egg ' + pk.egg.slice(1) + '. Pick it up once the Warden is dead, then into the cauldron with the others.') : 'Picked: no egg.') + '</p>' +
      '<button type="button" class="pg-btn pg-jno' + (pk.egg ? '' : ' on') + '" data-p2e="none" aria-pressed="' + !pk.egg + '">No egg</button></div></div>';
    else if (tab === 'kick') body = '<div class="pg-p2kick"><p><b>Malice.</b> Your ledge\'s Warden casts it once, soon after it stands up (its tank kicks it if you don\'t). Do you kick it?</p>' + seg('p2m', [[0, 'No'], [1, 'Kick it']], pk.mal, heal) +
      '<p><b>Anguished Cry.</b> Each Doomscale on your ledge casts it three times: once by the cauldron soon after it climbs out, then twice by her. Kick one Doomscale\'s three?</p>' + seg('p2c', [[0, 'None'], [1, P.mk[pk.side][0]], [2, P.mk[pk.side][1]]], pk.cry, heal) +
      '<p>' + (heal ? 'Healers have no kick in Midnight (only a Restoration Shaman).' : 'Press E during the cast bar: melee within 8 yards, ranged within 30.') + '</p>' + clash() + '</div>';
    else body = '<div class="pg-p2kick"><p><b>Grasping Fangs.</b> Six tethers, three on each ledge, on anyone. One player breaks alone, then the other five break together.</p>' +
      seg('p2t', [['random', 'Random'], ['solo', 'Solo break'], ['five', 'One of the five'], ['none', 'No tether']], pk.teth) +
      '<p>' + ({ random: 'You always get one: alone or one of the five, at random each run.', solo: 'You walk out past 25 yards from the Warden first, alone, on its call.', five: 'After the solo, go to the edge of your tether (20 yards) and step out with the five on their call.', none: 'You stay with your half; the bots take the tethers.' })[pk.teth] + '</p>' + clash() + '</div>';
    return '<div class="pg-optrow pg-jrole"><span>Ledge</span>' + seg('p2s', [['W', 'West'], ['E', 'East']], pk.side) + '<span>Role</span>' + seg('p2r', [['m', 'Melee'], ['r', 'Ranged'], ['h', 'Healer']], pk.role) + '</div>' +
      '<div class="pg-jtabs">' + seg('p2tab', [['egg', 'Egg'], ['kick', 'Kicks'], ['teth', 'Tether']], tab) + '</div>' + body; };
  const bind = (box, refresh) => { box.onclick = (e) => { const b = e.target.closest('[data-p2s],[data-p2r],[data-p2tab],[data-p2e],[data-p2m],[data-p2c],[data-p2t]'); if (!b || b.disabled) return; const d0 = b.dataset;
      if (d0.p2s) pk.side = d0.p2s; if (d0.p2r) pk.role = d0.p2r; if (d0.p2tab) ui.tab = d0.p2tab; if (d0.p2e) pk.egg = d0.p2e === 'none' ? null : d0.p2e; if (d0.p2m != null) pk.mal = +d0.p2m; if (d0.p2c != null) pk.cry = +d0.p2c; if (d0.p2t) pk.teth = d0.p2t;
      const fk = ['p2s', 'p2r', 'p2tab', 'p2e', 'p2m', 'p2c', 'p2t'].find((k) => d0[k] != null), sel = fk ? '[data-' + fk + '="' + d0[fk] + '"]' : null, refocus = e.detail === 0;
      fix(); save(); box.innerHTML = card(); refresh(); if (refocus && sel) { const nb = box.querySelector(sel); if (nb && nb.focus) nb.focus(); } };
    box.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.pg-jhit')) { e.preventDefault(); e.stopPropagation(); e.target.closest('.pg-jhit').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })); } }; };
  const role = () => { fix(); const id = slotOf(pk), egg = pk.egg === 'far' || pk.egg === 'close' ? 'the ' + NS[pk.egg] + ' big egg' : pk.egg ? 'small egg ' + pk.egg.slice(1) : 'no egg';
    return { id, name: RN[pk.role], job: SD[pk.side][0].toUpperCase() + SD[pk.side].slice(1) + ' ledge · ' + egg + (pk.mal ? ' · Malice' : '') + (pk.cry ? ' · ' + P.mk[pk.side][pk.cry - 1] + ' Cry' : '') }; };
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
    say: () => { const v = setupCard.now().job; return ({ mal: 'You cross to your ledge and kick the Warden\'s Malice with E, then break your tether (alone first, or with the five after) and follow the plan to the heart burn.',
      cry: 'You cross to your ledge, break your tether (alone first, or with the five after), then kick your Doomscale\'s Anguished Cry with E each of the three times it casts.',
      egg: 'You cross to your ledge, break your tether (alone first, or with the five after) and carry a small egg into the cauldron once the Warden dies.',
      big: pk.role === 'h' ? 'You cross to your ledge, break your tether (alone first, or with the five after), then run alone to the north big egg and throw it in with the south one on the call.' : 'You cross to your ledge, break your tether (alone first, or with the five after), pick up the south big egg as soon as the two south small eggs are grabbed, and throw it in with the north one on the call.',
      none: 'You cross to your ledge, break your tether (alone first, or with the five after), help kill the Warden and the Doomscales, and keep out of the frontals and the falling rocks.' })[v]; } };
  // ---- the spot maps (Flex, Nov 16: "visual maps that lets them select the spot is best, you should use the plans maps so its something familiar ...
  // Customizable, but not crazy confusing", "maybe randomize their assignments", "make sure the maps are placed properly it looks off"): practice.js's
  // contract (its "the spot maps" comment), handed over as setup.maps. Each spot is where the game puts you, or the thing you act on, in room yards:
  //   Your side: the whole room, both ledges; you land beside your gate (P.land).
  //   Small egg (melee, ranged): the Plan's own Side Egg Pickups page for your ledge, eggs 1 to 8 on their spots (the game lays its small eggs on UL_EGGS).
  //   Big egg (everyone): your whole ledge, where the game lays them (S.big). The south one is anyone's but a healer's here (the 30 fastest kills: melee 45 of
  //   74, ranged 15, healers 14; a raid that gives it to a ranged needs it practised), the north one a healer's (45 of 46).
  //   Kicks (melee, ranged; healers have no kick in Midnight): your Warden where it casts Malice (P.fight, every run) and your ledge's two Weakened
  //   Doomscales by the Plan's markers, where their tank holds them on the ledge (P.ds and dsOff, every run, until 4:38.5): the first Anguished Cry comes there
  //   when the big eggs go in on the count, the next two by her (the review, Nov 16: not "where each casts its first Cry": with your big egg in late, that
  //   comes as the tank walks off, 12 yards away).
  // The same buttons on every tab (Flex: "clicking on your coil hides no egg"); the tether stays random, as in the fight ----
  const cap = (w) => w[0].toUpperCase() + w.slice(1), mkOf = (s, k) => P.mk[s][k - 1];
  const eggOk = (r, e) => !e || (r === 'h' ? e === 'close' : /^n[1-8]$/.test(e) || e === 'far'); /* (a melee or a ranged takes a small egg or the south big egg, a healer the north big egg; healers stay simple) */
  const mset = (o) => { pk = { ...pk, ...o, teth: 'random' }; fix(); save(); };
  // (the maps' frames in the Plan's map units (ulSvg: 340 + x * 2.083 across, 240 - (y + 0.9) * 2.083 down), square, w yards across round cx, cy: the whole room,
  // a whole ledge, the ledge's middle. ulSvg reads a page's frame out of UL_VB by its name, so these are added to it the first time a map is drawn)
  const vbox = (cx, cy, w) => [+(340 + (cx - w / 2) * 2.083).toFixed(1), +(240 - (cy + w / 2 + 0.9) * 2.083).toFixed(1), +(w * 2.083).toFixed(1)];
  const VBS = { p2room: vbox(0, 0, 330), p2bigE: vbox(68, 0, 196), p2bigW: vbox(-68, 0, 196), p2kickE: vbox(104, 21, 70), p2kickW: vbox(-104, 21, 70) };
  const vbOf = (k) => { if (VBS[k] && !UL_VB[k]) UL_VB[k] = VBS[k]; return UL_VB[k] || UL_VB.mid; };
  const dsSpot = (s, k) => L(s, [P.ds[0] + dsOff(k)[0], P.ds[1] + dsOff(k)[1]]);
  const D0 = () => ({ ez: { melee: [], left: [], right: [], far: [], backup: [] }, shields: [], teams: [[], []], ce: [[], []], cf: [[], []], trans: [], side: { L: {}, R: {} } });
  const PAGES = {
    side: () => ({ t: 'Your side', s: 'Phase 2: each half crosses to its own ledge', vb: 'p2room', draw: (D, g) => ['W', 'E'].forEach((s) => g.tag(L(s, [100, 58])[0], 58, cap(SD[s]) + ' ledge', s === pk.side ? '#f3c969' : null)) }),
    egg: () => ((typeof UL_PAGES !== 'undefined' && UL_PAGES.sideeggs) || [])[pk.side === 'W' ? 0 : 1] || { t: 'Small eggs', s: '', vb: pk.side === 'W' ? 'L2' : 'R2', draw: (D, g) => pgP2Eggs()[pk.side === 'W' ? 'L' : 'R'].forEach((p, i) => g.egg(p[0], p[1], i + 1)) },
    big: () => ({ t: 'Big egg', s: 'The ledge\'s two big eggs, at its two ends', vb: 'p2big' + pk.side, draw: (D, g) => { const s = pk.side, sx = s === 'E' ? 1 : -1, pit = L(s, P.pit);
      g.circle(pit[0], pit[1], P.THROW, '#b06bff', true); g.tag(pit[0], pit[1] - 15, 'Cauldron', '#d6b8ff'); pgP2Eggs()[s === 'E' ? 'R' : 'L'].forEach((p) => g.egg(p[0], p[1]));
      ['far', 'close'].forEach((w) => { const p = L(s, P[w]); g.circle(p[0], p[1], 2.6, '#e6b450', true); g.tag(p[0] - sx * 28, p[1], cap(NS[w]) + ' big egg', pk.egg === w ? '#f3c969' : '#e6b450'); }); } }),
    kick: () => ({ t: 'Kicks', s: 'Your Warden\'s Malice and your ledge\'s two Weakened Doomscales', vb: 'p2kick' + pk.side, draw: (D, g) => { const s = pk.side, sx = s === 'E' ? 1 : -1, pit = L(s, P.pit), wd = L(s, P.fight);
      g.circle(pit[0], pit[1], P.THROW, '#b06bff', true); g.circle(wd[0], wd[1], 2, '#b06bff', true); g.tag(wd[0], wd[1] + 5.5, 'Warden · Malice', pk.mal ? '#f3c969' : '#c89bff');
      [1, 2].forEach((k) => { const q = dsSpot(s, k); g.tag(q[0] + sx * 8, q[1], mkOf(s, k), pk.cry === k ? '#f3c969' : '#c9d98a'); }); } }) };
  // (the Doomscales' raid markers, drawn as the Plan draws its markers (POM_MK), on each one's spot)
  const mkSvg = (s, vb) => (typeof POM_MK === 'undefined' ? '' : [1, 2].map((k) => { const q = dsSpot(s, k), m = mkOf(s, k), g0 = POM_MK[m.toLowerCase()];
    return g0 ? '<g transform="translate(' + (340 + q[0] * 2.083).toFixed(1) + ' ' + (240 - (q[1] + 0.9) * 2.083).toFixed(1) + ') scale(' + (vb[2] / 380).toFixed(3) + ')"><circle r="12" fill="#0b0d11" fill-opacity=".6"/>' + g0 + '<title>The ' + m + ' Doomscale</title></g>' : ''; }).join(''));
  const eggName = (e) => (e === 'far' || e === 'close' ? cap(NS[e]) + ' big egg' : e ? 'Small egg ' + e.slice(1) : 'No egg');
  let mtab = 'side';
  const MAPS = { get tab() { const T0 = MAPS.tabs(); return T0.some((q) => q[0] === mtab) ? mtab : T0[0][0]; }, set tab(v) { mtab = v; },
    tabs: () => { const r = pk.role; return [['side', 'Your side']].concat(r === 'h' ? [] : [['egg', 'Small egg']], [['big', 'Big egg']], r === 'h' ? [] : [['kick', 'Kicks']]); },
    page: (key) => { fix(); const pg = (PAGES[key] || PAGES.side)(), vb = vbOf(pg.vb); let svg = ulSvg(pg, D0(), new Map([['you', { color: '#f3c969' }]]), {});
      if (key === 'kick') { const i = svg.lastIndexOf('</svg>'); svg = svg.slice(0, i) + mkSvg(pk.side, vb) + svg.slice(i); } return { svg, vb }; },
    hot: (key) => { fix(); const s = pk.side, r = pk.role;
      if (key === 'side') return ['W', 'E'].map((q) => { const p = L(q, P.land), on = s === q; return { id: q, x: p[0], y: p[1], r: 26, big: true, on, you: on, title: cap(SD[q]) + ' ledge: your half crosses through its gate at the start of phase 2 and lands here' }; });
      if (key === 'egg') return r === 'h' ? [] : pgP2Eggs()[s === 'E' ? 'R' : 'L'].map((p, i) => { const id = 'n' + (i + 1), on = pk.egg === id; return { id, x: p[0], y: p[1], r: 2.1, on, you: on, title: 'Small egg ' + (i + 1) + ': pick it up once the Warden is dead, into the cauldron with the others' }; });
      if (key === 'big') return ['far', 'close'].filter((w) => eggOk(r, w)).map((w) => { const p = L(s, P[w]), on = pk.egg === w; return { id: w, x: p[0], y: p[1], r: 6, on, you: on,
        title: w === 'far' ? 'The south big egg: wait by it while the two south small eggs are broken out, pick it up once they are grabbed, in together on the call' : 'The north big egg: run here alone once the small eggs are in, pick it up on the call, in together on the call' }; });
      if (key === 'kick') { if (r === 'h') return []; const wd = L(s, P.fight); return [{ id: 'mal', x: wd[0], y: wd[1], r: 3.2, on: !!pk.mal, title: 'Kick the Warden\'s Malice, soon after it stands up; its tank kicks it if you don\'t' }]
        .concat([1, 2].map((k) => { const q = dsSpot(s, k); return { id: 'cry' + k, x: q[0], y: q[1], r: 2.3, on: pk.cry === k, title: 'Kick the ' + mkOf(s, k) + ' Doomscale\'s Anguished Cry: the first one here, where its tank holds it, then the next two by her' }; })); }
      return []; },
    pick: (key, id) => { const r = pk.role;
      if (id === 'E' || id === 'W') mset({ side: id });
      else if (/^n[1-8]$/.test(id) || id === 'far' || id === 'close') { if (eggOk(r, id)) mset({ egg: id }); }
      else if (id === 'mal') { if (r !== 'h') mset({ mal: pk.mal ? 0 : 1 }); }
      else if (/^cry[12]$/.test(id) && r !== 'h') { const k = +id.slice(3); mset({ cry: pk.cry === k ? 0 : k }); } },
    extras: () => [['noegg', 'No egg', !pk.egg]],
    extra: (id) => { if (id === 'noegg') mset({ egg: pk.egg ? null : EGG0[pk.role] }); },
    // (no assignments yet: a ledge, an egg your role can carry and a Doomscale to kick, at random (the south big egg one time in three for a melee, one in six
    // for a ranged, as the kills give it more often to melee); a melee or a ranged still kicks Malice)
    random: () => { const r = pk.role, side = Math.random() < 0.5 ? 'E' : 'W', small = 'n' + (1 + Math.floor(Math.random() * P.eggs[side].length));
      mset({ side, egg: r === 'h' ? 'close' : Math.random() < (r === 'm' ? 1 / 3 : 1 / 6) ? 'far' : small, mal: r === 'h' ? 0 : 1, cry: r === 'h' ? 0 : 1 + Math.floor(Math.random() * 2) }); },
    // (a new role: your ledge and an egg it can carry stay; its kicks start as that role's)
    role: (r) => { if (!/^[mrh]$/.test(r) || r === pk.role) return; mset({ role: r, egg: eggOk(r, pk.egg) ? pk.egg : EGG0[r], mal: KICK0[r][0], cry: r === 'h' ? 0 : pk.cry || KICK0[r][1] }); },
    say: () => { fix(); const L0 = [], th = ({ random: 'break your tether (alone or with the five)', solo: 'break your tether alone, first', five: 'break your tether with the five, after the solo' })[pk.teth];
      if (pk.mal) L0.push('kick Malice'); if (th) L0.push(th);
      if (pk.egg === 'far') L0.push('carry the south big egg in on the call'); else if (pk.egg === 'close') L0.push('run alone to the north big egg, then throw it in on the call'); else if (pk.egg) L0.push('carry small egg ' + pk.egg.slice(1) + ' into the cauldron');
      if (pk.cry) L0.push('kick the ' + mkOf(pk.side, pk.cry) + ' Doomscale\'s three Cries');
      if (L0.length < 2) L0.push('keep out of the frontals and the falling rocks');
      return cap(SD[pk.side]) + ' ledge: you ' + (L0.length < 2 ? L0[0] : L0.slice(0, -1).join(', ') + ' and ' + L0[L0.length - 1]) + '.'; },
    sub: () => { fix(); const kk = (pk.mal ? ['Malice'] : []).concat(pk.cry ? [mkOf(pk.side, pk.cry)] : []); return cap(SD[pk.side]) + ' ledge · ' + eggName(pk.egg) + (kk.length ? ' · Kick ' + kk.join(' + ') : ''); } };
  setupCard.maps = MAPS;
  // (the start card's words, in the order of the fight and with no clock times (Flex, Nov 16: "i feel like the game confuses people saying timestamps"): what to
  //  do and what comes before it; the calls and the bars say when in the game)
  const asg = () => { fix(); const L0 = [], s = SD[pk.side];
    L0.push(['Cross over', 'Walk into your gate (the gold ring on the ' + s + ' side of the platform) as soon as it opens. Your half fights on the ' + s + ' ledge.']);
    L0.push(['The Warden', 'Kill it with your half. Kill the glowing Clutches it makes first, then the Rawlings that come out of them.' + (pk.mal ? ' Kick its Malice with E.' : ' Its tank kicks its Malice.')]);
    L0.push(['Grasping Fangs', ({ random: 'You always get a tether, the solo or one of the five at random. Solo: walk out past 25 yards first, on its call. One of the five: to the edge of your tether after the solo, out together on the call.', solo: 'You break alone: walk out past 25 yards from the Warden first, on its call.', five: 'One of the five: to the edge of your tether (20 yards) after the solo, out together on the call.', none: 'No tether: the bots break theirs (one alone, then five together).' })[pk.teth]]);
    if (pk.egg === 'far' || pk.egg === 'close') L0.push(['The ' + NS[pk.egg] + ' big egg', 'It waits at your ledge\'s ' + (pk.egg === 'far' ? 'south' : 'north') + ' end. ' + (pk.egg === 'far' ? 'Wait there with the group while it breaks out the two south small eggs; pick the big egg up as soon as they are grabbed' : 'Run there alone once the small eggs are in; pick it up on the call') + ', then into the cauldron with the other on the call. Carry it straight in: it hatches in your hands, a wipe.']);
    else if (pk.egg) L0.push(['Small egg ' + pk.egg.slice(1), 'Pick it up once the Warden is dead and its shield is gone. Carry it to your lane spot at the cauldron, 3 yards from other carriers, and throw it in with the others on the call.']);
    else L0.push(['No egg', 'Keep out of the carriers\' 3-yard rings.']);
    L0.push(['Small eggs in: Rawlings', 'A Rawling climbs out of the cauldron for every egg: kill the Rawlings before they boil.']); L0.push(['The Doomscales', 'Behind or beside them, never in front: their frontal goes at the tank.' + (pk.cry ? ' Kick the ' + P.mk[pk.side][pk.cry - 1] + ' Doomscale\'s Anguished Cry each time: once by the cauldron, then twice by her.' : '')]);
    L0.push(['Back to her', 'Take your gate back as the tank brings the Doomscales. Then the heart opens: hit it, and step out of the brown circles.']); L0.push(['Falling Debris', 'Three times in this phase: step out of the brown circles.']);
    return '<ul class="pg-asg">' + L0.map(([a, b]) => '<li><b>' + esc(a) + '</b><span>' + esc(b) + '</span></li>').join('') + '</ul>'; };
  // (the start card's "Your job in short" (practice.js pick(), Nov 15, Flex: "improve the setup screens. Still a little convoluted"): four plain
  // lines, your ledge and gate, your egg and kicks, your tether, the heart; the full rundown (asg) folds away under it)
  const short = () => { fix(); const s = SD[pk.side], ord = ['', '1st', '2nd', '3rd'], L0 = [];
    L0.push(s[0].toUpperCase() + s.slice(1) + ' ledge: cross through your gate (the gold ring) as it opens.');
    const egg = pk.egg === 'far' || pk.egg === 'close' ? 'The ' + NS[pk.egg] + ' big egg: ' + (pk.egg === 'far' ? 'pick it up once the south small eggs are grabbed' : 'run there alone after the small eggs, pick it up on the call') + ', in together on the call' : pk.egg ? 'Small egg ' + pk.egg.slice(1) + ': pick it up when the Warden dies, into the cauldron with the others' : 'No egg: keep out of the carriers\' rings';
    const kk = [pk.mal ? 'the Warden\'s Malice' : '', pk.cry ? 'the ' + P.mk[pk.side][pk.cry - 1] + ' Doomscale\'s Anguished Cry' : ''].filter(Boolean);
    L0.push(egg + (kk.length ? '. Kick (E) ' + kk.join(' and ') : '') + '.');
    L0.push(({ random: 'Tether: you get one every run, at random: break alone first, or with the five after.', solo: 'Tether: you break alone first, past 25 yards from the Warden.', five: 'Tether: to its edge after the solo, out with the five on the call.', none: 'No tether: stay with your half.' })[pk.teth]);
    L0.push('Back to her as the tank brings the Doomscales: burn the heart, step out of the brown circles.');
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
    Object.values(G.p2.cl).forEach((c) => { if (c.dead == null) L0.push({ key: c.id, kind: 'clutch', side: c.side, name: 'Blightscale Clutch', p: [c.x, c.y], r: 1.4, hp: Math.max(0, c.hp) * 10, max: 10, hpFr: Math.max(0, c.hp) }); });
    { const e = G.eggs.find((q) => q.id === A.me && q.state === 'floor' && t < q.shell); if (e) L0.push({ key: 'egg' + e.n + e.side, kind: 'pegg', side: e.side, name: 'Your egg' + (!e.south && e.hs > 0 ? ' (Hardened shell)' : ''), p: [e.x, e.y], r: 1, hp: eggFr(e, t) * 10, max: 10, hpFr: eggFr(e, t) }); }
    if (t >= T.heart && t < T.heartEnd) L0.push({ key: 'heart', kind: 'heart', name: 'Venomous Heart', p: S.heart.slice(), r: 3 });
    // (kill them evenly (the guide): on your ledge the right one is the one with the most health, or any within 5% of it)
    const js = (S.job[A.me] || {}).side, top = Math.max(0, ...S.ds.filter((d) => d.side === js && G.p2.ds[d.id] && G.p2.dsS[d.id]).map((d) => G.p2.dsS[d.id].hp));
    S.ds.forEach((d) => { const c = G.p2.ds[d.id], st = G.p2.dsS[d.id]; if (c && st && t >= st.up + 1.5) L0.push({ key: d.id, kind: d.side === js && st.hp < top - 0.05 ? 'dsx' : 'ds', side: d.side, name: 'Weakened Doomscale (' + P.mk[d.side][d.k - 1] + ')' + (st.rev != null ? ' · Revenge' : ''), p: [c.x, c.y], r: 2.6, hp: Math.max(0, st.hp) * 100, max: 100, hpFr: Math.max(0, st.hp) }); });
    S.wardens.forEach((w) => { const p = G.p2.wd[w.side]; if (p && t >= w.molt) L0.push({ key: w.id, kind: 'warden', side: w.side, name: 'Doomscale Warden', p: p.slice(), r: 2.5, hp: Math.max(0, G.p2.whp[w.side]) * 100, max: 100, hpFr: Math.max(0, G.p2.whp[w.side]) }); });
    return L0; };
  // (the moment that matters most now, on your ledge: a Viper, a Clutch (it hatches at 20 s), the heart, a Rawling, the Doomscales, the Warden)
  // (while you carry an egg, carrying it is your job: no damage moment then)
  const dpsCat = (t) => { sync(); if (!G || !G.p2) return null; const j = S.job[A.me], s = j && j.side, here = G.p2.where[A.me] === 'L' && G.p2.wside[A.me] === s, near = (p) => pgDist(p, [G.x, G.y]) < 45;
    if (A.me[0] === 'h') return null; /* (Flex, Nov 15: healers stay simple, dodge and follow their spots) */
    if (G.adds.some((a) => a.kind === 'viper')) return 'viper'; if (G.eggs.some((e) => e.who === A.me && e.state === 'held') || G.p2.big.some((b) => b.who === A.me && b.state === 'held')) return null;
    { const bi = j && j.big ? bigIx(s, j.big) : -1; if (bi >= 0 && G.p2.big[bi].state === 'floor' && t >= S.bigAt[s][j.big] - 16) return null; } /* (on your way to your big egg: that's your job then) */
    if (G.p2.where[A.me] === 'L' && t >= S.home[A.me] && t < T.heart) return null; /* (and on your way back to her through your gate) */
    // (a melee's moment only while it's in reach: 5 yards past the add's edge (practice.js inRange). The release sweep, Nov 16: at 8 and 12 yards the autopilot,
    // held off by the job to dodge the debris, was marked off the Rawlings and the Doomscales. While your Warden lives the old reach stays: the plan holds the
    // melee on the adds round it, and off them the moment is the Warden's)
    const mR = (r, old) => (G.p2.wd[s] ? old : 5 + r);
    // (and for a melee the Doomscale in reach is one that counts: the one with the most health, or within 5% of it (tgts), not the other)
    const dsTop = Math.max(0, ...S.ds.filter((d) => d.side === s && G.p2.ds[d.id] && G.p2.dsS[d.id]).map((d) => G.p2.dsS[d.id].hp)), dsNear = (d) => d.side === s && G.p2.settled[s] && G.p2.ds[d.id] && G.p2.dsS[d.id] && t >= G.p2.dsS[d.id].up + 1.5 && (A.me[0] !== 'm' || G.p2.dsS[d.id].hp >= dsTop - 0.05) && pgDist([G.p2.ds[d.id].x, G.p2.ds[d.id].y], [G.x, G.y]) < (A.me[0] === 'm' ? mR(2.6, 12) : 45);
    if (here && Object.values(G.p2.cl).some((c) => c.side === s && c.dead == null && pgDist([c.x, c.y], [G.x, G.y]) < (A.me[0] === 'm' ? mR(1.4, 12) : 40))) return 'clutch'; /* (one within your reach soon: a melee's (they die in seconds), others their 40) */
    if (t >= T.heart && t < T.heartEnd) return 'heart'; if (S.ds.some(dsNear)) return 'ds'; /* (once Doomscales are out, they come first: the raid cleaves the last Rawlings along, as on the kills) */ if (G.adds.some((a) => a.own && a.side === s && pgDist([a.x, a.y], [G.x, G.y]) < (A.me[0] === 'm' ? mR(1.1, 8) : 40) && pgP2Ledge(a.x, a.y, 0.4) === pgP2Ledge(G.x, G.y, 0.4))) return 'rawling'; /* (one on your side of the venom) */
    if (S.ds.some(dsNear)) return 'ds'; return j && G.p2.wd[s] && t >= T.clutch ? 'warden' : null; };
  const dpsNames = (DL) => { const k = new Set(DL.map((m) => m.kind)); return ['warden', 'clutch', 'rawling', 'ds', 'heart', 'viper'].filter((x) => k.has(x)).map((x) => ({ warden: 'the Warden', clutch: 'the Clutches', rawling: 'the Rawlings', ds: 'the Doomscales', heart: 'the heart', viper: 'the Vipers' })[x]).join(', '); };
  // (the bar under your target's frame: your target's cast, gold when you can kick it; "Interrupted" a moment after a kick lands on it; with no target,
  // Ula'tek's own (Rage of the Shackled))
  const castOf = (t) => { sync(); if (!G || !G.p2) return null; const k = G.tgt;
    if (k) { const iq = G.p2.intr.find((q) => q.caster === k && t - q.t <= 0.9); if (iq) return { who: 'x', name: 'Interrupted (' + (iq.who === A.me ? 'you' : A.nm(iq.who)) + ')', t0: iq.t, t1: iq.t + 0.9, intr: true };
      const side = k === 'wdE' ? 'E' : k === 'wdW' ? 'W' : null, c = S.casts.find((q) => t >= q.t0 && t <= q.t1 && ((side && q.who === 'warden' && q.side === side) || (q.ds && q.ds === k) || (q.rid && q.rid === k)));
      if (c) return { ...c, kick: !!c.kick && (c.by == null || t <= c.by) }; }
    return S.casts.find((q) => q.who === 'boss' && t >= q.t0 && t <= q.t1) || null; };
  const starts = [[0, 'The split'], [190, 'The tethers'], [216, 'The small eggs'], [248, 'The big eggs'], [266, 'The Doomscales'], [284, 'The heart burn']]; /* (in the fight's order, no clock times: Flex, Nov 16) */

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
    if (cr(T.throwAt + 7)) G.eggs.forEach((e) => { if (e.state !== 'gone' && !e.south) add('small egg not in by 4:05', e.id || '?', t); });
    S.big.forEach((B, i) => { if (cr(S.bigIn[B.side] + 5) && G.p2.big[i].state !== 'in') add('big egg not in on the count', holder('big', B.side, B.which) || '?', t); });
    Object.values(G.p2.cl).forEach((c) => { if (c.hatched && cr(c.dead)) add('a Clutch hatched a Viper', '?', t); }); };

  // ---- 3D: the shapes for this part (practice3d.js's pg3dShapes adds them to the list it draws) ----
  const shapes = (t, P3, h) => { sync(); if (!G || !G.p2) return; const me = A.me, j = S.job[me] || {};
    S.gates.forEach((g) => { if (t >= g.t0 - 1 && t <= g.t1) { const yours = g.side === j.side; P3({ k: 'gate', x: g.p[0], y: g.p[1], c: yours ? '#f3c969' : '#c084ff' }); h.ring(g.p[0], g.p[1], P.GATE, yours ? '#f3c969' : '#c084ff', 1, 0.3, true); /* (drawn where it takes you) */ h.label(g.p[0], g.p[1], 6, g.back ? 'Gate: back to her' : 'Gate: ' + SD[g.side] + ' ledge', yours ? '#f3c969' : '#d6b8ff', 13); } });
    Object.entries(S.pits).forEach(([s, p]) => { P3({ k: 'cauldron', x: p[0], y: p[1] }); const carry = G.eggs.some((e) => e.who === me && e.state === 'held') || G.p2.big.some((b) => b.who === me && b.state === 'held'); h.disc(p[0], p[1], P.THROW, '#b06bff', 0.07); h.ring(p[0], p[1], P.THROW, carry && s === j.side ? '#f3c969' : '#b06bff', 0.9, 0.3, carry && s === j.side); h.label(p[0], p[1], 7, 'Doomscale Cauldron', '#d6b8ff', 13); });
    G.eggs.forEach((e) => { if (e.state === 'floor' && wdUp(e.side)) { h.disc(e.x, e.y, P.WARD, '#7fbf3a', 0.05); h.ring(e.x, e.y, P.WARD, '#7fbf3a', 0.55, 0.18); } });
    // (your lane spot, once you're down your lane past the venom inlet: before that the arrow is on the lane's gap, and two gold spots at once read as two places to go
    //  (the prompts audit, Nov 16))
    const myE = G.eggs.find((e) => e.who === me && e.state === 'held'); if (myE && !dsOut(myE.side) && G.y <= 36) { const q = slot(myE.side, myE.n, true); h.disc(q[0], q[1], 1.3, '#f3c969', 0.18); h.ring(q[0], q[1], 1.3, '#f3c969', 1, 0.25, true); h.label(q[0], q[1], 2.8, 'Your lane spot', '#f3c969', 13); }
    // (a cast you can't kick: a ring round its caster that fills, purple, its name over it in words (the ring counts; the prompts audit, Nov 16: "Desperate
    // Thrash 2.6" four times at once). A cast you can kick has its cast bar over the caster's head instead (castBars, Nov 16), and so does its "Interrupted"
    // after a kick; its caster's name comes back once the bar has gone. A Doomscale's frontal is "Frontal", its name everywhere else in the game)
    const bars = castBars(t), barOn = (id) => bars.some((b) => b.caster === id);
    const castRing = (x, y, r, c, who) => { const f = Math.max(0.02, Math.min(1, (t - c.t0) / Math.max(0.1, c.t1 - c.t0)));
      P3({ k: 'arc', x, y, r, f, c: '#b06bff', o: 1 }); h.label(x, y, who === 'ds' ? 7.8 : 8.6, c.spell === 'thrash' ? 'Frontal' : c.name.replace(/^[^:]+: /, ''), c.spell === 'thrash' ? '#ffb27a' : '#e3c7ff', 13); };
    // (your next kick's caster before its bar, while you're out of its reach: "Get closer" where its cast bar will show, the bar's own words (the audit's fix the review
    //  found undone, Nov 16); the bar takes over as the cast starts)
    const mk = me[0] === 'h' ? null : myKickAt(t, KLEAD), gcK = mk && t < mk.k.at && !kickIn(mk.k.key, mk.p) ? mk.k.key : null, gcId = gcK ? (gcK[0] === 'm' ? 'wd' + gcK[1] : gcK.slice(1, -1)) : null;
    S.wardens.forEach((w) => { const p = G.p2.wd[w.side]; if (!p) return; P3({ k: 'warden', x: p[0], y: p[1], ref: w }); const go = G.p2.gone.find((q) => q.side === w.side && t >= q.by && t <= q.t1), c = S.casts.find((q) => q.who === 'warden' && q.side === w.side && t >= q.t0 && t <= q.t1);
      if (go) P3({ k: 'dome', x: p[0], y: p[1], r: 4, c: '#b06bff', o: 0.22 + 0.1 * Math.sin(t * 12) });
      if (!barOn(w.id)) { if (gcId === w.id) h.label(p[0], p[1], BAR_H.w, 'Get closer', '#f3c969', 13); if (c) castRing(p[0], p[1], 3.6, c, 'warden'); else if (gcId !== w.id) h.label(p[0], p[1], 7.5, 'Doomscale Warden', '#c89bff', 13); }
      if (j.mal && j.side === w.side && G.p2.wdead[w.side] == null) h.ring(p[0], p[1], 4.4, '#f3c969', 0.7, 0.2); /* (your kick's caster: a gold ring under it) */
      // (before the tethers land: the 25 yards they break at, dashed round your ledge's Warden, from when the job line says "Tethers come next" (the audit's fix the
      //  review found undone, Nov 16). Once a tether is on you, yours is drawn below)
      if (j.side === w.side && G.p2.where[me] === 'L' && G.p2.wside[me] === w.side && t >= T.fangs - 8 && t < T.fangs) h.ring(p[0], p[1], P.TETHER, '#ff8a6a', 0.55, 0.25, true);
      Object.entries(G.p2.teth).forEach(([id, th]) => { if (th.side !== w.side || th.br != null) return; const q = pos(id); P3({ k: 'tether', x0: p[0], y0: p[1], x1: q[0], y1: q[1], c: id === me ? '#f3c969' : '#ff5a4f' }); if (id === me) h.ring(p[0], p[1], P.TETHER, '#f3c969', 0.75, 0.3, true); }); });
    S.big.forEach((B, i) => { const st = G.p2.big[i], mineB = holder('big', B.side, B.which) === me; if (st.state === 'floor') { P3({ k: 'begg', x: B.x, y: B.y, h: 0 }); if (mineB) { h.ring(B.x, B.y, 3, '#f3c969', 1, 0.3, true); h.label(B.x, B.y, 6.5, 'Your big egg', '#f3c969', 14); } /* (no seconds: the Hatching Doom bar counts) */ else if (t >= T.back) h.label(B.x, B.y, 6, 'Doomscale Egg', '#e6b450', 12); }
      else if (st.state === 'held') { const q = pos(st.who); P3({ k: 'begg', x: q[0], y: q[1], h: 4.4 }); if (st.who === me) h.label(q[0], q[1], 8.5, 'Into the cauldron', '#f3c969', 14); } }); /* (the Doomscale Egg bar on your frame counts) */
    S.ds.forEach((d) => { const c = G.p2.ds[d.id], st = G.p2.dsS[d.id]; if (!c || !st) return; const cc = S.casts.find((q) => q.ds === d.id && t >= q.t0 && t <= q.t1), rv = st.rev != null;
      P3({ k: 'dscale', id: d.id, x: c.x, y: c.y, climb: Math.min(1, (t - st.up) / 1.5), rev: rv, ref: d });
      if (!barOn(d.id)) { if (cc) castRing(c.x, c.y, 3.6, cc, 'ds'); else h.label(c.x, c.y, 7, 'Weakened Doomscale (' + P.mk[d.side][d.k - 1] + ')' + (rv ? ' · Revenge' : ''), rv ? '#ff9b8a' : '#c9d98a', 13); } /* (by the Plan's marker, the one your setup's Kicks map names) */
      if (j.side === d.side && (j.cry === d.k || bkCry(me) === d.k)) { h.ring(c.x, c.y, 4.2, '#f3c969', 0.8, 0.22, true); h.label(c.x, c.y, 10, 'Your kick', '#f3c969', 13); } /* (your Doomscale, marked as a raid marks it) */
      if (gcId === d.id && !barOn(d.id)) h.label(c.x, c.y, BAR_H.d, 'Get closer', '#f3c969', 13);
      const gone = S.cries.find((q) => q.ds === d.id && G.p2.kick['c' + q.ds + q.i] === 'none' && t >= q.t1 && t <= q.t1 + 0.8); if (gone) P3({ k: 'shock', x: c.x, y: c.y, r: P.CRY * Math.min(1, (t - gone.t1) / 0.8), c: '#ffd23b' }); });
    G.p2.fan.forEach((f) => { if (t >= f.t0 && t <= f.at + 0.3) P3({ k: 'fan', x: f.p[0], y: f.p[1], a: f.dir, r: P.FAN.r, half: P.FAN.half * Math.PI / 180, c: '#ff9b4a', o: t > f.at ? 0.45 : 0.14 + 0.16 * Math.min(1, (t - f.t0) / (f.at - f.t0)) }); });
    // (the Clutches: purple, glowing, pulsing faster as their 20 s run out; the south eggs before the big egg's pickup turns them; the Rawlings' boil and
    // Acidic Expulsion; a Ravenous Doomscale and its Dread Roar)
    Object.values(G.p2.cl).forEach((c) => { if (c.dead != null) return; const left = c.born + T.CHATCH - t; P3({ k: 'clutch', x: c.x, y: c.y, p: left, ref: c }); if (c.side === j.side || pgDist([c.x, c.y], [G.x, G.y]) < 30) h.label(c.x, c.y, 3.6, left < 6 ? 'Clutch: hatching!' : 'Clutch', left < 6 ? '#ff8f87' : '#d9b8ff', 13); }); /* (words, no seconds: its glow pulses faster as it nears hatching) */
    G.eggs.forEach((e) => { if (e.state !== 'floor') return; const fr = eggFr(e, t); if (fr < 0.999) P3({ k: 'arc', x: e.x, y: e.y, r: 1.9, f: Math.max(0.02, fr), c: e.south || !(e.hs > 0) ? '#f5d33a' : '#9fd6ff', o: 0.9 }); }); /* (an egg being broken out: a ring that empties, blue while its Hardened shield holds) */
    G.adds.forEach((a) => { if (!a.own) return; const c = S.casts.find((q) => q.rid === a.id && t >= q.t0 && t <= q.t1); if (c) castRing(a.x, a.y, 2, c, 'rawling'); }); /* (a boiling one's red ring: practice3d.js draws it for every add with a.boil) */
    G.p2.rav.forEach((r) => { P3({ k: 'rav', x: r.x, y: r.y, ref: r }); const c = r.c; if (t >= c.t0 && t <= c.t1) castRing(r.x, r.y, 5, c, 'rav'); else h.label(r.x, r.y, 10, 'Ravenous Doomscale', '#ff8f87', 15);
      if (t >= r.roar && t <= r.roar + 0.9) P3({ k: 'shock', x: r.x, y: r.y, r: 60 * Math.min(1, (t - r.roar) / 0.9), c: '#ff5a4f' }); });
    if (t >= T.heart && t < T.heartEnd + 0.5) { const hp = S.heart; h.disc(hp[0], hp[1], 3, '#5a0f22', 0.6); h.ring(hp[0], hp[1], 3, '#ff5a7a', 1, 0.3); P3({ k: 'heart', x: hp[0], y: hp[1] }); h.label(hp[0], hp[1], 6.5, 'Venomous Heart', '#ff9fb2', 14); }
    if (stunned(me, t)) h.label(G.x, G.y, 5.2, 'STUNNED', '#ffd23b', 15); };

  // (your small egg's state for the script's calls (pgP2Script's per): 'held', 'floor', 'in' once it went into the cauldron, 'lost' (a Clutch, a hatch), or 'none')
  const eggOf = (id) => { sync(); const e = G && G.eggs ? G.eggs.find((q) => q.id === id && !q.south) : null; return !e ? 'none' : e.state !== 'gone' ? e.state : e.inAt != null ? 'in' : 'lost'; };
  // ---- the opening (Flex, Nov 16: "From the time phase 2 starts and the group teleports over, to the time you're able to attack the first add. There's a weird timing
  // pause that feels off ... I think its just because the game was built around timings"): once you're through your gate onto your own ledge, the clock runs twice as
  // fast until 1.5 s before the Wardens stand up, so you land as they come. practice.js's frame loop reads it (never while paused) and shows "Skipping ahead". Nothing
  // else changes: the bots, your walk and every scripted moment only come sooner. From the Start list's first entry too (its fast-forward stops before the gates) ----
  const RUSH = { k: 2, lead: 0.3, stop: T.molt + 3 - 1 }; /* (to 1 s before you can hit your Warden (its Shadow Molt ends: S.wardens' molt, T.molt + 3), not 1.5 s before it stands up: that left about 6 s at normal speed with nothing to hit, the pause Flex felt (Nov 17)) */
  const rush = (t) => { sync(); if (!G || !G.p2 || !S) return 1; const c = G.p2.crossT, j = S.job[A.me]; return c != null && !!j && G.p2.where[A.me] === 'L' && G.p2.wside[A.me] === j.side && t >= c + RUSH.lead && t < RUSH.stop ? RUSH.k : 1; };
  return { part: 2, script: (o) => pgP2Script({ ...(o || {}), me: A.me, pick: mine() ? pk : null, eggOf }), init, home, job, slow, check, kick, bossHp, onPlat: pgP2Floor, bossAt: () => ({ p: (A.S || {}).her || [46, 0], up: true }), tailAt: () => ({ p: [0, 0], up: false }),
    jobText, nextText, upNext, acts, hud, card, bind, role, asg, short, setup: setupCard, starts, tgts, dpsCat, dpsNames, hit, castOf, castBars, mini, draw2d, auditStep, shapes, rush, alerts,
    // (back on the platform for the heart burn, the bots use practice.js's dodge too, for the small tails' waves: the platform is flat there, as in phase 1)
    // (a kicker with a kick due holds its place instead: a missed Cry stuns everyone, worse than a wave)
    dodges: (id, t) => !!(G && G.p2 && t >= T.rage),
    // (Noxious Splash: the game's 3 yards. The 21 logged splashes looked like 4.3, but the phase 3 chat's re-scan of 170 Mythic pulls found carriers 4 to
    // 6 yards apart for about 80 minutes with no splash: those were measured after the burst)
    splash: 3,
    // (and its escapes keep out of a Doomscale's frontal that's casting: a wave's way out mustn't lead into one)
    unsafe: (id, x, y, t) => !!(G && G.p2 && G.p2.fan.some((f) => t >= f.t0 && t <= f.at + 0.2 && f.tank !== id && inFan(f, x, y, 1.5))),
    // (after a start-at fast-forward: practice.js empties the adds, so the Rawlings alive then come back; the backup kick is the player's to have)
    ff: () => { sync(); if (G && G.p2) { G.wipes = 0; G.p2.kickCd = -99; G.p2.wardT = -99; G.p2.stun = {}; G.p2.missed = []; G.p2.tlog = []; G.p2.bk = null; G.p2.bkSeen = new Set(); (G.p2.own || []).forEach((a) => { if (!G.adds.includes(a)) G.adds.push(a); }); } },
    // (back up after "Keep going" on the death card (practice.js calls it): a missed Malice still ticking stops on you, so it can't kill you again straight
    // away (the release sweep, Nov 16))
    revive: () => { sync(); if (!G || !G.p2) return; const t = G.t; S.malice.forEach((m) => { const key = 'm' + m.side + m.k; if (G.p2.kick[key] === 'none' && t < m.ch + 6.05 && G.p2.malCut[key] == null) G.p2.malCut[key] = t; }); },
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
    if (K.mon && s.ref && (k === 'warden' || k === 'rav' || k === 'clutch') && K.mon(s.ref, k === 'rav' ? 'ravenous' : k, s.x, s.y, k === 'clutch' ? null : { face: Math.atan2(-s.x, s.y) })) return true; /* (its monster model, src/practice3d.js PG3D_MON) */
    if (K.mon && s.ref && k === 'dscale' && K.mon(s.ref, 'doomscale', s.x, s.y, { face: Math.atan2(-s.x, s.y), dy: -5 * (1 - (s.climb == null ? 1 : s.climb)) })) return true;
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
