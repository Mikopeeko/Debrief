// ===== Practice, the intermission: The Shattering (Nov 15; Flex: "i think we forgot to do the intermission with the coil soaks", then "ok open a
// new chat for the intermission then") =====
// Ula'tek Mythic's intermission as the practice game's own part (src/practice.js), from 5:18 to 6:12, 3D only like phase 2 (src/practice-p2.js,
// which this file follows: a script, the jobs, a part module and its 3D shapes). Read into ui.js's scope right after practice-p2.js (build.ps1,
// /*PRACTICE*/). It plays on phase 1's platform, so practice.js's own rules do the eggs (they land, their shells, Noxious Splash, the venom) and the
// coil slams (who's inside, carried eggs break into Rawlings, Soul Constrictor, a missed soak); this file adds the rest. tests/practice-int.js plays it.
// Measured on the 17 top Mythic kills in the log library since the Nov 6 hotfix (raw events, read as text a line at a time; 16 on the clock, one
// 4.4 s early throughout): her Call of the Serpent 5:19.0 (4 s cast, lands 5:23.0); eight eggs land 5:24.1 to 5:24.8 all over the stone, a median
// 21 yards out, under a Hardened shell; the eight Spectral Coils rise at the rim 4.0 s before they slam, at 5:36.5, 5:38.5, 5:42.5, 5:44.5, 5:48.5,
// 5:50.4, 5:52.5 and 5:54.5 (each within about half a second on every kill); the slam order is always one of the guide's three (UL_PAT: Star first
// on 3 kills, Triangle on 9, Cross on 5), and the soakers (by Soul Constrictor) split into the guide's teams on every kill: 1-4-6 / 2-5-8 / 3-7 on
// Star and Triangle, 1-4-7 / 2-5-8 / 3-6 on Cross; a median 6 soakers a slam (5 to 7 on 119 of 136), standing where the guide's plan puts each soak
// (UL_SOAK, within 3.5 yards), the coil itself at the rim (UL_RIM); every slam hits the whole raid, soakers and the rest alike (about 330k each); the
// eggs are carried into the soaks and break there (Rancid Yolk, one Rawling each) at slams 1 to 7, and the Rawlings die about 5:55 to 6:12; she
// takes no damage from 5:20 until the platform shatters at 6:09.4 (Falling on 8 to 18 players); standing within 3 yards of a crack line (the lines
// through the middle, north to south and east to west) 53% landed in the venom, 3 to 6 yards 34%, 6 to 10 yards 9%; the raid gathered in the
// south-east quarter (the diamond's) on 9 of 17 kills. Her next Call 6:17.2 (phase 3, src/practice-p3.js, from 6:12).
// Picked, not measured: the fall's hit (a third of your health: the audit's 380k); the shells breaking one by one from 5:31 to 5:40 (top kills pick the eggs up from about 5:30, half of them by 5:40); which
// raider carries which egg (three in each three-soak team, two in Blue) and where the eggs land (at random in each team's part of the room, from the
// run's seed, 8 to 17 yards out between the soak circles, so no carrier has to step into another team's coil; the real ones land a median 21 out); the soak's 10 yards (as phase 1's); the cracks' 3.5 yards each side; her burst's 8 yards in the middle; the knockback's 6 yards out
// from the middle (players move about 7 yards in the logs); the gathering spot on the diamond line 23.5 yards out (the guide: "toward the diamond, on
// the inside"); the defensive window 5:45.5 to 5:52.6 (the guide: "personals around 5:50"); the slams' damage in the game; the Rawlings lasting to
// about 6:00 to 6:06 unless you kill them first, and crawling after the raid once the coils are done. The teams are the guide's (src/guides.js, the Mythic intermission card): a tank, a healer and 5 melee
// (Yellow, waits by Star); a tank, a healer and 4 ranged (Purple, by Diamond); the other two healers and the rest of the DPS (Blue, by Square).
const PG_INT_T = { start: 318, call: 319, callL: 323, land: 324.1, shell0: 331, shellGap: 1.25, slams: [336.5, 338.5, 342.5, 344.5, 348.5, 350.4, 352.5, 354.5], lead: 4,
  defFrom: 345.5, defBy: 352.6, gather: 355, bubbles: 363, shatter: 369.4, end: 372 };
const PG_INT = {
  team: { Y: ['t1', 'h1', 'm1', 'm2', 'm3', 'm4', 'm5'], P: ['t2', 'h2', 'r1', 'r2', 'r3', 'r4'], B: ['h3', 'h4', 'm6', 'm7', 'r5', 'r6', 'r7'] },
  carry: ['m1', 'm2', 'm3', 'r1', 'r2', 'r3', 'r5', 'r6'],
  // (each team's marker (the guide's: Yellow on Star, Purple on Diamond, Blue on Square; degrees from east, counter-clockwise) and the part of the
  // room its eggs land in)
  mark: { Y: 112.5, P: 292.5, B: 202.5 }, area: { Y: [28, 118], P: [248, 332], B: [152, 210] },
  R: 10, CRACK: 3.5, MID: 8, KB: 6, GATHER: 23.5, GA: 292.5, SPREAD: 4,
  TN: { Y: 'Yellow', P: 'Purple', B: 'Blue' }, TC: { Y: '#f5d33a', P: '#c86bff', B: '#3d8bff' }, TM: { Y: 'Star', P: 'Diamond', B: 'Square' },
  PN: ['', 'Star', 'Triangle', 'Cross'],
};
// (the guide's own tables, src/guides.js: the three slam orders and who soaks each (UL_PAT), the soak spots (UL_SOAK), the coils at the rim (UL_RIM),
// the plan's marker at each spot (UL_CMK); copies here only for a page without the guide)
const pgIntPat = () => (typeof UL_PAT !== 'undefined' ? UL_PAT : [[['NNW', 'Y'], ['SSE', 'P'], ['WSW', 'B'], ['ENE', 'Y'], ['SSW', 'P'], ['NNE', 'Y'], ['WNW', 'B'], ['ESE', 'P']],
  [['SSW', 'P'], ['NNE', 'Y'], ['WNW', 'B'], ['ESE', 'P'], ['NNW', 'Y'], ['SSE', 'P'], ['WSW', 'B'], ['ENE', 'Y']], [['WNW', 'Y'], ['SSE', 'P'], ['SSW', 'B'], ['NNE', 'Y'], ['ENE', 'P'], ['WSW', 'B'], ['NNW', 'Y'], ['ESE', 'P']]]);
const pgIntSoak = () => (typeof UL_SOAK !== 'undefined' ? UL_SOAK : { NNW: [-9.7, 24.2], NNE: [10.2, 23.3], ENE: [22.4, 11], ESE: [22.1, -9.4], SSE: [10.3, -22.5], SSW: [-7.2, -23.8], WSW: [-20.9, -8.6], WNW: [-23, 7.5] });
const pgIntRim = () => (typeof UL_RIM !== 'undefined' ? UL_RIM : { NNW: [-18, 44], NNE: [19, 45], ENE: [44, 18.5], ESE: [44, -18], SSE: [20, -44], SSW: [-17.5, -44], WSW: [-42, -20], WNW: [-45, 18.5] });
const pgIntMk = (k) => (typeof UL_CMK !== 'undefined' && UL_CMK[k]) || ({ NNW: 'Star', NNE: 'Circle', ENE: 'Skull', ESE: 'Moon', SSE: 'Diamond', SSW: 'Triangle', WSW: 'Square', WNW: 'Cross' })[k] || k;
const PG_INT_MKC = { Skull: '#ece8df', Circle: '#ff8a2a', Star: '#ffd23b', Cross: '#ff5a4a', Square: '#5aa0ff', Triangle: '#7ee08f', Diamond: '#c39bff', Moon: '#c8d0dc' };
const PG_INT_MKA = { ENE: 22.5, NNE: 67.5, NNW: 112.5, WNW: 157.5, WSW: 202.5, SSW: 247.5, SSE: 292.5, ESE: 337.5 };
const pgIntAt = (deg, r) => [Math.cos(deg * Math.PI / 180) * r, Math.sin(deg * Math.PI / 180) * r];
// (on a crack line once the platform shatters: within 3.5 yards of the line through the middle north to south, or east to west)
const pgIntCrack = (x, y, m) => Math.abs(x) <= PG_INT.CRACK + (m || 0) || Math.abs(y) <= PG_INT.CRACK + (m || 0);
const pgIntGather = () => pgIntAt(PG_INT.GA, PG_INT.GATHER);
const pgIntOrd = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
// (where the knockback puts you: 6 yards further out from the middle; from inside her burst, out past it)
const pgIntKb = (p) => { const d = Math.hypot(p[0], p[1]) || 0.01, nd = d <= PG_INT.MID ? PG_INT.MID + PG_INT.KB : d + PG_INT.KB; return [p[0] / d * nd, p[1] / d * nd]; };

// ---- the jobs: who is on which team and who carries an egg; your picked job swapped in (the card) ----
function pgIntBase() { const team = {}; Object.entries(PG_INT.team).forEach(([g, L]) => L.forEach((id) => { team[id] = g; })); return { team, carry: new Set(PG_INT.carry) }; }
// (your slot: one of your role, on your picked team if it has one, with the same egg job if it can be)
function pgIntSlot(j) { const B = pgIntBase(); return Object.keys(B.team).filter((id) => id[0] === j.role).map((id, i) => [id, (B.team[id] === j.team ? 4 : 0) + (B.carry.has(id) === !!j.egg ? 2 : 0) - i * 0.01]).sort((a, b) => b[1] - a[1])[0][0]; }
function pgIntJobs(me, pk) { const J = pgIntBase(), ids = Object.keys(J.team), dps = (id) => id[0] === 'm' || id[0] === 'r';
  if (me && pk && J.team[me]) {
    // (onto your picked team: you change places with one of it, your role if it has one, so the teams keep their size and their egg count)
    if (J.team[me] !== pk.team) { const pool = ids.filter((id) => J.team[id] === pk.team && id !== me), o = pool.find((id) => id[0] === me[0]) || pool.find(dps) || pool.find((id) => id[0] !== 't') || pool[0];
      if (o) { J.team[o] = J.team[me]; const cm = J.carry.has(me), co = J.carry.has(o); if (cm !== co) { J.carry.delete(cm ? me : o); J.carry.add(cm ? o : me); } } J.team[me] = pk.team; }
    const mates = ids.filter((id) => J.team[id] === pk.team && id !== me);
    if (pk.egg && !J.carry.has(me)) { const o = mates.find((id) => J.carry.has(id) && id[0] === me[0]) || mates.find((id) => J.carry.has(id)); if (o) J.carry.delete(o); J.carry.add(me); }
    else if (!pk.egg && J.carry.has(me)) { const o = mates.find((id) => !J.carry.has(id) && id[0] === me[0]) || mates.find((id) => !J.carry.has(id) && dps(id)) || mates.find((id) => !J.carry.has(id) && id[0] !== 't') || mates.find((id) => !J.carry.has(id)); if (o) J.carry.add(o); J.carry.delete(me); } }
  const ord = typeof GDZ_RAID !== 'undefined' ? GDZ_RAID : ids; J.list = { Y: [], P: [], B: [] }; ord.forEach((id) => { if (J.team[id]) J.list[J.team[id]].push(id); });
  return J; }

// ---- the fight, second by second ----
function pgIntScript(o) {
  const T = PG_INT_T, P = PG_INT, seed = o.seed || 1, rnd = pgRng(((seed * 211) + 29) >>> 0), side = pgRng((seed * 7919 + 13) >>> 0);
  // (where she came up after her dive in phase 1, from the run's seed as in phase 2: the heart burn that ends phase 2 is by her, east or west)
  const east = o.east != null ? !!o.east : side() < 0.5, sg = east ? 1 : -1, her = [46 * sg, 0];
  const pat = o.pat >= 1 && o.pat <= 3 ? +o.pat : 1 + Math.floor(rnd() * 3);
  const S = { part: 'int', start: T.start, end: T.end, east, seed, her, pat, ROT: 0, SURF: -9, rotAt: () => 0, F: (p) => [p[0], p[1]], FT: (p) => [p[0], p[1]], herTank: () => 't1',
    casts: [], warns: [], timers: [], waves: [], impacts: [], soaks: [], bubbles: [], thrash: [], wrath: [], tails: [], beams: [], pulses: [], wretches: [], eggSets: [], wings: [],
    // (her bubbles in the middle from 6:03, then she bursts up through it as the platform shatters: practice3d.js draws the bubbles and her rise from this)
    dive: { t0: T.bubbles, gone: T.bubbles + 0.2, surf: T.shatter, to: [0, 0] } };
  const cast = (who, name, t0, t1) => S.casts.push({ who, name, t0, t1 }), warn = (t, text, c) => S.warns.push({ t, text, c: c || '#ff8f87' }), timer = (t, name) => S.timers.push({ t, name });
  S.job = pgIntJobs(o.me, o.pick);
  warn(T.start, 'Intermission: go to your team\'s mark. Eggs and coils are coming!', '#c084ff');
  cast('boss', 'Call of the Serpent', T.call, T.callL); warn(T.call, 'Call of the Serpent: eight eggs incoming!', '#e6e0c8'); timer(T.land, 'Call of the Serpent');
  // each team waits by its marker, 16 yards out (the guide's map)
  S.pre = { Y: pgIntAt(P.mark.Y, 16), P: pgIntAt(P.mark.P, 16), B: pgIntAt(P.mark.B, 16) };
  // the eggs: one for each carrier, at random in its team's part of the room, apart from each other and from the teams' waiting spots
  // (between the soak circles, so a carrier never has to step into another team's coil for it: 8 to 17 yards out, 10.5 from every soak's middle; the
  // real eggs land anywhere, a median 21 yards out (picked, flagged above))
  const SOK = Object.values(pgIntSoak()), spots = [], car = Object.keys(S.job.team).filter((id) => S.job.carry.has(id));
  // (always clear of the circles; when a team's part is crowded, the eggs may sit a little closer to each other and to the waiting spot: the spot
  // that fits best)
  const fit = (q, m) => Math.min(...SOK.map((s) => pgDist(s, q) - 10.5), ...spots.map((s) => pgDist(s, q) - (6.5 - m)), ...Object.values(S.pre).map((s) => pgDist(s, q) - (7 - m)));
  const L = car.map((id) => { const ar = P.area[S.job.team[id]]; let q = null, best = null, bs = -1e9; for (let k = 0; k < 320 && !q; k++) { const m = k < 160 ? 0 : 2, a = ar[0] - 8 + rnd() * (ar[1] - ar[0] + 16), r = 8 + rnd() * 10, c = pgIntAt(a, r); if (!PG_UL.onPlat(c[0], c[1])) continue; const f = fit(c, m); if (f >= 0) q = c; else if (f > bs && SOK.every((s) => pgDist(s, c) >= 10.5)) { bs = f; best = c; } }
    q = q || best || PG_UL.inward(pgIntAt((ar[0] + ar[1]) / 2, 9)); spots.push(q); return { id, x: q[0], y: q[1] }; });
  const rank = L.map((_, i) => i); for (let i = rank.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rank[i], rank[j]] = [rank[j], rank[i]]; }
  S.eggSets = [{ si: 0, cast: T.call, land: T.land, rot: 0, eggs: L.map((e, i) => ({ ...e, land: T.land + i * 0.09, shell: T.shell0 + rank[i] * T.shellGap })) }];
  warn(T.shell0, 'Egg shells are breaking: carriers, pick yours up and bring it into your soak.', '#f3c969');
  // the eight coils: the pattern's order (the guide's table), each slammed by its team; the coil rises at the rim 4 s before
  const PAT = pgIntPat()[pat - 1], SO = pgIntSoak(), RIM = pgIntRim();
  S.soaks = PAT.map(([k, g], n) => { const at = T.slams[n], q = SO[k]; return { set: 0, k: n, x: q[0], y: q[1], r: P.R, t0: at - T.lead, at, cast: at - T.lead, spot: k, team: g, rim: RIM[k].slice(), group: S.job.list[g].slice() }; });
  S.soaks.forEach((s, n) => timer(s.at, 'Coil slam ' + (n + 1)));
  warn(S.soaks[0].cast, 'Pattern ' + pat + ': ' + P.PN[pat] + ' first! Your spots light up in gold.', '#24f2cb');
  warn(T.defFrom + 1, 'Personals now: the last four slams come back to back!', '#7fb8ff');
  warn(T.gather + 0.3, 'Coils done: kill the Rawlings, then to the diamond line, inside.', '#f3c969');
  warn(T.bubbles, 'Bubbles in the middle: she bursts up at 6:09. Diamond line, inside, off the cracks!', '#7fd8ff'); timer(T.shatter, 'The Shattering');
  warn(T.shatter, 'The platform shatters!', '#ff8a5a');
  S.timers.sort((a, b) => a.t - b.t); S.warns.sort((a, b) => a.t - b.t);
  return S;
}

// ---- the part: practice.js calls pgInt(api) once per game; api is practice.js's window on the game (G, S, me, the hit helpers) ----
function pgInt(A) {
  const T = PG_INT_T, P = PG_INT, clk = pgClock, RN = { m: 'Melee', r: 'Ranged', h: 'Healer' };
  let S = null, G = null; const sync = () => { S = A.S; G = A.G; };
  let setUp = false; const setup = () => { if (setUp) return; setUp = true; Object.assign(A.DEB, { fall: ['Falling', '#c8a36a'], dvenom: ['Deadly Venom', '#9be13a'] }); ['shatter', 'egg'].forEach((k) => A.MAJ.add(k)); };
  // ---- your job (the start card), remembered on this browser ----
  const KEY = 'wla-pg-jobint', job0 = () => ({ role: 'r', team: 'B', egg: false, pat: 0 });
  const jobOk = (j) => !!j && /^[mrh]$/.test(j.role) && /^[YPB]$/.test(j.team) && typeof j.egg === 'boolean' && [0, 1, 2, 3].includes(j.pat);
  let pk = (() => { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (jobOk(j)) return j; } catch (e) { /* (no storage) */ } return job0(); })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(pk)); } catch (e) { /* (no storage) */ } };
  const slotOf = (j) => pgIntSlot(j || pk), mine = () => A.me === slotOf(pk);
  const pos = (id) => (id === A.me ? [G.x, G.y] : [G.bots[id].x, G.bots[id].y]);
  const teamOf = (id) => S.job.team[id];
  const spiral = (c, i, r) => { const a = i * 2.39996, rr = r * Math.sqrt(((i % 9) + 0.5) / 9); return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; };
  const once = (k) => (G.int.once.has(k) ? false : (G.int.once.add(k), true));
  const called = (t) => t >= S.soaks[0].cast; /* (the first coil rises on Star, Triangle or Cross: the caller calls the pattern, and every team knows its spots) */
  const nextSoak = (id, t) => S.soaks.find((s) => s.group.includes(id) && s.at >= t - 0.15) || null;
  const ordOf = (s) => S.soaks.filter((q) => q.team === s.team && q.at <= s.at).length;
  // (each raider's spot in a soak: the carriers on a ring 5 yards out, apart, so their 3-yard rings never touch; the rest near the middle)
  const slotIn = (s, id) => { const car = s.group.filter((q) => S.job.carry.has(q)), i = car.indexOf(id); if (i >= 0) { const a = i / Math.max(3, car.length) * Math.PI * 2 + 0.6; return [s.x + Math.cos(a) * 5, s.y + Math.sin(a) * 5]; }
    return spiral([s.x, s.y], Math.max(0, s.group.filter((q) => !S.job.carry.has(q)).indexOf(id)), 3); };
  const preSpot = (id) => { const g = teamOf(id), L = S.job.list[g], car = L.filter((q) => S.job.carry.has(q)), i = car.indexOf(id), c = S.pre[g];
    if (i >= 0) { const a = i / Math.max(3, car.length) * Math.PI * 2 + 1.1; return [c[0] + Math.cos(a) * 5, c[1] + Math.sin(a) * 5]; } return spiral(c, Math.max(0, L.filter((q) => !S.job.carry.has(q)).indexOf(id)), 3.2); };
  const homeAt = (id) => { const sg = S.east ? 1 : -1, i = GDZ_RAID.indexOf(id); return id[0] === 't' ? [34 * sg, id === 't1' ? -12 : 12] : id[0] === 'm' ? spiral([35.5 * sg, 0], i, 1.5) : spiral([25 * sg, 0], i, 5); };

  // ---- where each raider's job wants them (the bots, the autopilot and your hint arrow all follow this) ----
  const job = (id, t) => { sync(); const b0 = id === A.me ? { x: G.x, y: G.y } : G.bots[id], sp = id === A.me ? 7 : 9.8, e = G.eggs.find((q) => q.id === id && q.state !== 'gone'), ns = nextSoak(id, t); let T0, fast = false, ob = null;
    if (t >= T.gather) { T0 = spiral(pgIntGather(), GDZ_RAID.indexOf(id), P.SPREAD); ob = t < T.shatter ? { at: T.shatter, p: pgIntGather(), r: P.SPREAD } : null; fast = pgDist([b0.x, b0.y], T0) > 6; /* (the coils done: everyone to the diamond line for the Shattering) */
      // (the melee and tanks to the nearest Rawling first, until the bubbles show in the middle; the ranged and healers reach them from the line)
      if ((id[0] === 'm' || id[0] === 't') && t < T.bubbles) { const ra = G.adds.filter((a) => a.kind === 'rawling').sort((a, b) => pgDist([b0.x, b0.y], [a.x, a.y]) - pgDist([b0.x, b0.y], [b.x, b.y]))[0]; if (ra) { const d = pgDist([b0.x, b0.y], [ra.x, ra.y]) || 1; T0 = d > 3 ? [ra.x + (b0.x - ra.x) / d * 2.5, ra.y + (b0.y - ra.y) / d * 2.5] : [b0.x, b0.y]; ob = null; fast = d > 6; } } }
    else { const soakNow = !!ns && called(t);
      // (your egg: once its shell is about to break, when there's time to get it and still make your next soak; else after that soak)
      let eggGo = false, dE = 0; if (e && e.state === 'floor' && t >= e.shell - 2.5) { dE = pgDist([b0.x, b0.y], [e.x, e.y]); if (!soakNow) eggGo = true; else eggGo = Math.max(dE / sp, e.shell - t) + pgDist([e.x, e.y], [ns.x, ns.y]) / sp + 0.9 <= ns.at - t; }
      if (eggGo) { const busy = G.eggs.some((q) => q !== e && q.state === 'held' && q.who && q.who !== id && pgDist(pos(q.who), [e.x, e.y]) < 4.6); /* (another carrier by it: wait a step off, so the two rings never touch) */
        T0 = t >= e.shell - 0.3 && !busy ? [e.x, e.y] : [e.x + (e.x > 0 ? 1 : -1) * 3.2, e.y + 1.5]; fast = dE > 6; ob = { at: e.shell, p: [e.x, e.y], r: 1 }; }
      else if (soakNow) { T0 = slotIn(ns, id); fast = pgDist([b0.x, b0.y], T0) > 4; ob = { at: ns.at, p: [ns.x, ns.y], r: P.R - 3 }; }
      else if (!ns && called(t)) { T0 = spiral(pgIntGather(), GDZ_RAID.indexOf(id), P.SPREAD); ob = { at: T.shatter, p: pgIntGather(), r: P.SPREAD }; } /* (your soaks done: on toward the diamond line, round the other teams' circles) */
      else { T0 = preSpot(id); fast = pgDist([b0.x, b0.y], T0) > 10; } }
    // (carrying an egg: a wide berth round an egg someone is about to pick up, and round other carriers, so no two 3-yard rings touch)
    if (G.eggs.some((q) => q.who === id && q.state === 'held')) { const away = (c, r) => { const ps = (p) => { const d = pgDist(p, c); if (d >= r) return p; const a = d > 0.1 ? Math.atan2(p[1] - c[1], p[0] - c[0]) : 0.7; return [c[0] + Math.cos(a) * (r + 0.4), c[1] + Math.sin(a) * (r + 0.4)]; }; T0 = ps(T0); if (pgDist([b0.x, b0.y], c) < r - 0.3) { T0 = ps([b0.x, b0.y]); fast = true; } };
      G.eggs.forEach((q) => { if (q.id !== id && q.state === 'floor' && t >= q.shell - 1.5) away([q.x, q.y], 4.4); if (q.state === 'held' && q.who && q.who !== id && q.who !== A.me) away(pos(q.who), 4); }); }
    // (out of a falling egg's 4 yards before it lands)
    // (all the landing eggs at once: two 8 yards apart trapped a tank between them when it stepped out of one into the other, Nov 15)
    { const LE = G.eggs.filter((q) => q.state === 'air' && q.land - t <= 3), inE = (p, r) => LE.some((q) => pgDist(p, [q.x, q.y]) < r);
      const clear = (c, goal) => { let best = null, bs = 1e9; for (const rr of [1, 2, 3.5, 5, 6.5, 8, 10, 13]) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, p = [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; if (!PG_UL.onPlat(p[0], p[1]) || inE(p, 5.8)) continue; const s = rr + 0.4 * pgDist(p, goal); if (s < bs) { bs = s; best = p; } } return best; };
      if (LE.length) { if (inE(T0, 5.5)) T0 = clear(T0, T0) || T0; const soon = LE.filter((q) => q.land - t < 1.8); if (soon.some((q) => pgDist([b0.x, b0.y], [q.x, q.y]) < 5.3)) { T0 = clear([b0.x, b0.y], T0) || T0; fast = true; } } }
    // (another team's coil about to slam: never inside it (Soul Constrictor would keep you out of your own next one))
    S.soaks.forEach((s) => { if (s.group.includes(id) || t < s.t0 || t > s.at) return; const out = (p) => { const d = pgDist(p, [s.x, s.y]); if (d > s.r + 1.5) return p; const a = d > 0.1 ? Math.atan2(p[1] - s.y, p[0] - s.x) : Math.atan2(-s.y, -s.x); return [s.x + Math.cos(a) * (s.r + 2.2), s.y + Math.sin(a) * (s.r + 2.2)]; };
      T0 = out(T0); if (s.at - t < 1.6 && pgDist([b0.x, b0.y], [s.x, s.y]) <= s.r + 1) { T0 = out([b0.x, b0.y]); fast = true; } });
    // (after the Shattering the lines through the middle are venom)
    if (t >= T.shatter && pgIntCrack(T0[0], T0[1], 1)) T0 = [Math.abs(T0[0]) <= P.CRACK + 1 ? (T0[0] < 0 ? -1 : 1) * (P.CRACK + 2) : T0[0], Math.abs(T0[1]) <= P.CRACK + 1 ? (T0[1] < 0 ? -1 : 1) * (P.CRACK + 2) : T0[1]];
    if (!PG_UL.onPlat(T0[0], T0[1])) T0 = PG_UL.inward(T0);
    return { T: T0, fast, ob }; };
  const home = (id) => { sync(); return homeAt(id); };
  const slow = () => 1;

  // ---- a new run ----
  const init = (G0) => { setup(); G = G0; S = A.S; G.t = T.start; G.wipes = 0; G.bossHp = bossHp(T.start); G.done.add('left0'); /* (practice.js's "never picked up your egg" is phase 1's timing: this part has its own) */
    G.int = { once: new Set(), kb: {}, shat: false, soakN: [], fell: [] }; };
  const bossHp = () => 44; /* (she is under the venom: no damage until she bursts up (measured)) */

  // ---- what happens each step: the slams on everyone, the defensive, your egg, the Shattering ----
  const check = (t0, t) => { sync(); const cr = (at) => at > t0 && at <= t, me = A.me, x = G.x, y = G.y, dt = t - t0;
    // (every slam hits the whole raid, the fewer in its circle the harder: practice.js does that (slamHit); here only the count, for the audit)
    S.soaks.forEach((s) => { if (!cr(s.at)) return; const inn = pgDist([x, y], [s.x, s.y]) <= s.r; G.int.soakN.push([s.k, GDZ_RAID.filter((id) => id !== me && pgDist(pos(id), [s.x, s.y]) <= s.r).length + (inn ? 1 : 0)]); });
    // the Rawlings from the broken eggs stay until killed (practice.js), but the raid only starts on them as the coils end (measured: the first die
    // about 5:52 to 5:57, the last by 6:12), so practice.js's helpers wait till then: its clock for them (born) is held back to 2 s before the last
    // slam. They still boil 25 s after they hatched.
    const RAW0 = T.slams[7] - 2, cx = GDZ_RAID.reduce((s0, id) => s0 + pos(id)[0], 0) / GDZ_RAID.length, cy = GDZ_RAID.reduce((s0, id) => s0 + pos(id)[1], 0) / GDZ_RAID.length;
    G.adds.forEach((a) => { if (a.kind !== 'rawling') return; if (a.born != null && a.hatch == null) { a.hatch = a.born; if (t < RAW0) delete a.born; } if (a.born == null && t >= RAW0) a.born = a.hatch != null ? a.hatch : t;
      // (and they crawl after the raid, toward its middle, stopping round it: slowly while the coils come, faster after; while she's coming up, never
      // into her burst or onto a crack, so nobody chases them there)
      if (a.o == null) a.o = ((a.x * 1.7 + a.y * 0.9) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      { let tq = [cx + Math.cos(a.o) * 4.5, cy + Math.sin(a.o) * 4.5]; if (t >= T.bubbles - 3) { const gq = pgIntGather(); tq = [gq[0] + Math.cos(a.o) * 6, gq[1] + Math.sin(a.o) * 3]; }
        const d = pgDist([a.x, a.y], tq), st = (t >= T.gather ? 5 : 3) * dt; if (d > st) { a.x += (tq[0] - a.x) / d * st; a.y += (tq[1] - a.y) / d * st; } } });
    // your defensive for the back-to-back slams (the guide: "personals around 5:50"; the autopilot, a careful player, presses it)
    if (window.__pgAuto && cr(T.defFrom + 1.5) && t - G.def >= 90) { G.def = t; A.deb('def', 8); }
    if (cr(T.defBy) && !(G.def >= T.defFrom - 1 && G.def <= T.defBy) && once('def')) A.mistake('def', 'No defensive for the last four slams (' + clk(T.slams[4]) + ' to ' + clk(T.slams[7]) + ').', 'Press Q at about 5:47: the last four slams come 2 s apart and each hits the whole raid. Personals and potions there.', 0);
    // (a bot whose soak kept it from its egg walks to it after: practice.js would hand it over from afar 6 s after its shell breaks, next to another carrier)
    G.eggs.forEach((q) => { if (q.state === 'floor' && q.id !== me && t > q.shell + 5.5 && G.bots[q.id] && pgDist(pos(q.id), [q.x, q.y]) > 2.5) q.shell = t - 5.5; });
    // (nor does a bot pick its egg up with another carrier beside it: it waits a moment, so their 3-yard rings never touch)
    { const hold = G.eggs.filter((q) => q.state === 'held' && q.who).map((q) => pos(q.who)); G.eggs.forEach((q) => { if (q.state !== 'floor' || q.id === me || !G.bots[q.id] || t < q.shell) return; const p = pos(q.id); if (pgDist(p, [q.x, q.y]) < 3 && hold.some((h) => pgDist(h, p) < 3.8)) q.shell = t + 0.2; }); }
    // your egg: picked up once it opened, and into a soak by the last slam
    const e = G.eggs.find((q) => q.id === me);
    if (e && e.state === 'floor' && t >= e.shell + 0.5) { const sk = S.soaks.find((s) => s.group.includes(me) && s.at > e.shell + 3); if ((sk ? t > sk.at + 0.3 : t > T.gather) && once('eggleft')) A.mistake('egg', 'You never picked up your egg (its shell broke at ' + clk(e.shell) + ').', 'Your egg is the gold one: pick it up once its shell breaks, then carry it into your next soak.', 0); }
    if (cr(T.slams[7] + 0.2) && e && e.state === 'held' && e.who === me && once('eggkept')) A.mistake('egg', 'Your egg was still in your hands after the last slam.', 'Carry your egg into your own soak: the slam breaks it (and leaves a Rawling to kill).', 0);
    // the Shattering: she bursts up through the middle, the platform breaks into four along the lines through it, and everyone is knocked out 6 yards
    if (cr(T.shatter)) { G.int.shat = true; G.eggs.forEach((q) => { if (q.state === 'floor' || q.state === 'air') q.state = 'gone'; });
      GDZ_RAID.forEach((id) => { if (id === me) return; const p = pos(id), q = pgIntKb(p); G.int.kb[id] = { t0: t, x0: p[0], y0: p[1], x1: q[0], y1: q[1] }; G.int.fell.push([id, p.slice(), q]); });
      const q = pgIntKb([x, y]), dd = Math.hypot(x, y), onC = pgIntCrack(x, y), off = !PG_UL.onPlat(q[0], q[1]) || pgIntCrack(q[0], q[1]);
      G.kb = { t0: t, x0: x, y0: y, x1: q[0], y1: q[1] }; A.hurt(28); A.deb('fall', 1.5); /* (Falling: about 380k on landing, a third of a raider's health (the Nov 15 audit, engine.js)) */ G.done.add('venom' + Math.floor(t / 10)); G.done.add('venom' + Math.floor((t + 5) / 10));
      if (dd <= P.MID) A.mistake('shatter', 'She burst up under you in the middle of the platform.', 'Keep out of the middle before 6:09: watch for her bubbles there, she comes up right through them.', 35);
      else if (onC) { A.mistake('shatter', 'You stood on a crack as the platform shattered, and fell into the venom.', 'It breaks along the lines through the middle (north to south, east to west): stand inside a quarter, on the diamond line.', 25); A.deb('dvenom', 12); }
      else if (off) { A.mistake('shatter', 'The knockback threw you into the venom: you stood too close to the edge.', 'Stand on the inside, not at the edge: the burst knocks everyone about 6 yards out from the middle.', 25); A.deb('dvenom', 12); }
      else A.say('You rode out the Shattering on the stone.'); }
    Object.entries(G.int.kb).forEach(([id, k]) => { const f = Math.min(1, (t - k.t0) / 0.55), b = G.bots[id]; if (b) { b.x = k.x0 + (k.x1 - k.x0) * f; b.y = k.y0 + (k.y1 - k.y0) * f; } if (f >= 1) delete G.int.kb[id]; });
    // (a crack after the Shattering is venom: it hurts until you're back on the stone)
    if (G.int.shat && !G.kb && pgIntCrack(x, y)) { G.hp -= 10 * dt * (A.has('def') ? 0.5 : 1); if (!A.has('dvenom')) A.deb('dvenom', 6); }
    if (A.has('dvenom')) G.hp -= 2.5 * dt * (A.has('def') ? 0.5 : 1); };
  const kick = () => A.say('Nothing to kick in the intermission.', true);

  // ---- the screen: your job now, what's next ----
  const mkAt = (s) => pgIntMk(s.spot);
  const jobText = () => { sync(); const t = G.t, me = A.me, g = teamOf(me), e = G.eggs.find((q) => q.id === me && q.state !== 'gone'), ns = nextSoak(me, t), tn = P.TN[g] + ' team';
    if (G.int.shat) return t < T.shatter + 0.7 ? '' : pgIntCrack(G.x, G.y) ? 'You\'re in a crack: it\'s venom now. Step back onto the stone.' : 'She\'s up and phase 3 is starting. Well done.';
    if (t >= T.gather) { const d = pgDist([G.x, G.y], pgIntGather()), dh = t < T.bubbles && A.dpsHint ? A.dpsHint() : null; if (dh) return dh;
      return t < T.bubbles ? 'Coils done. Kill the Rawlings, then go to the diamond line (the gold ring), inside, before 6:09.' : d > P.SPREAD + 1 ? 'To the diamond line now (the gold ring): she bursts up through the middle at 6:09!' : 'Good: on the diamond line, inside, off the cracks. Hold here for the Shattering (' + Math.max(0, Math.ceil(T.shatter - t)) + ' s).'; }
    if (t < T.land + 0.5) return e ? 'Go to the ' + tn + '\'s mark (' + P.TM[g] + '). Your egg lands at the gold circle at 5:24: stand beside it, not under it.' : 'Intermission: go to the ' + tn + '\'s mark (' + P.TM[g] + ') and wait. Eggs land at 5:24: step out of their circles.';
    const q = t >= T.defFrom && t <= T.defBy && !(G.def >= T.defFrom - 1) ? ' Press Q now: personals for the back-to-back slams.' : '';
    if (ns && called(t) && (ns.at - t <= 6 || !(e && e.state === 'floor'))) { const n = ordOf(ns), car = e && e.state === 'held' ? ' Bring your egg: the slam breaks it.' : '', d = pgDist([G.x, G.y], [ns.x, ns.y]);
      return (d <= ns.r - 1 ? 'In your ' + pgIntOrd(n) + ' soak at ' + mkAt(ns) + ': stay inside until it slams (' + Math.max(0, ns.at - t).toFixed(1) + ' s).' : 'Your ' + pgIntOrd(n) + ' soak: the gold circle at ' + mkAt(ns) + '. Get in before it slams (' + Math.max(0, Math.ceil(ns.at - t)) + ' s).') + car + q; }
    if (e && e.state === 'floor') return (t < e.shell ? 'Your egg (gold) opens in ' + Math.ceil(e.shell - t) + ' s: wait beside it.' : 'Pick up your egg now: walk over it.') + q;
    if (!called(t)) return 'Wait by ' + P.TM[g] + ' with the ' + tn + '. The first coil sets the pattern: Star, Triangle or Cross.' + (e && e.state === 'held' ? ' Keep your egg 3 yards from other carriers.' : '');
    if (q) return q.trim();
    if (!ns) return 'Your soaks are done: head for the diamond line (the gold ring), round the other teams\' circles. The last slam is at ' + clk(T.slams[7]) + '.';
    return 'Next: your ' + pgIntOrd(ordOf(ns)) + ' soak at ' + mkAt(ns) + ' in ' + Math.ceil(ns.at - t) + ' s.'; };
  const upNext = (t) => { sync(); const me = A.me, L0 = [], add = (at, text, c) => { if (at > t && at - t <= 30) L0.push({ at, text, c }); }, e = G.eggs.find((q) => q.id === me && q.state !== 'gone');
    if (e && e.state === 'air') add(e.land, 'Yours lands', '#f3c969'); if (e && e.state !== 'held') add(e.shell, 'Your shell breaks', '#f3c969');
    if (!called(t)) add(S.soaks[0].cast, 'The pattern is called', '#24f2cb'); else S.soaks.filter((s) => s.group.includes(me)).forEach((s) => add(s.at, 'Your coil at ' + mkAt(s), '#f3c969'));
    if (!(G.def >= T.defFrom - 1)) add(T.defFrom + 1, 'Defensive (Q)', '#7fb8ff'); add(T.shatter, 'The Shattering', '#ff8a5a');
    return L0.sort((a, b) => a.at - b.at).slice(0, 3); };
  const acts = () => '', hud = () => {};

  // ---- the start card: your role, team, egg and the pattern ----
  const seg = (k, opts, cur) => '<div class="pg-seg pg-jseg">' + opts.map(([v, t]) => '<button type="button" data-' + k + '="' + v + '" aria-pressed="' + (String(v) === String(cur)) + '"' + (String(v) === String(cur) ? ' class="on"' : '') + '>' + esc(t) + '</button>').join('') + '</div>';
  const row = (k, lab, opts, cur) => '<div class="pg-optrow pg-jrow"><span>' + lab + '</span>' + seg(k, opts, cur) + '</div>';
  const soaksOf = (g, pat) => pgIntPat()[pat - 1].map(([k, gg], n) => (gg === g ? 'the ' + pgIntOrd(n + 1) + ' at ' + pgIntMk(k) : null)).filter(Boolean);
  const lst = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  // (the room: the eight markers, the picked pattern's eight soaks in their team's colour, numbered in that team's order (the guide's map), yours bright;
  // where your team waits; where everyone ends, on the diamond line)
  const roomSvg = () => { const pat = pk.pat || 1, PAT = pgIntPat()[pat - 1], SO = pgIntSoak(), X = (p) => p[0].toFixed(1), Y = (p) => (-p[1]).toFixed(1), g = pk.team;
    const tx = (p, t, c, sz) => '<text pointer-events="none" x="' + X(p) + '" y="' + Y(p) + '" fill="' + c + '" font-size="' + sz + '" text-anchor="middle" dominant-baseline="central" font-weight="700" paint-order="stroke" stroke="#05070a" stroke-width="' + (sz * 0.28).toFixed(2) + '">' + esc(t) + '</text>';
    const oct = [[36.5, 12.5], [15, 34], [-15, 34], [-36.5, 12.5], [-36.5, -12.5], [-15, -34], [15, -34], [36.5, -12.5]].map((q) => X(q) + ',' + Y(q)).join(' ');
    let s = '<svg viewBox="-47 -47 94 94" role="img" aria-label="' + esc('Pattern ' + pat + ': the ' + P.TN[g] + ' team\'s soaks') + '"><image href="' + PG_UL.art + '" x="' + (-PG_UL.artW / 2).toFixed(1) + '" y="' + (-(PG_UL.artY + PG_UL.artH / 2)).toFixed(1) + '" width="' + PG_UL.artW.toFixed(1) + '" height="' + PG_UL.artH.toFixed(1) + '" preserveAspectRatio="none" opacity=".45"/>' +
      '<polygon points="' + oct + '" fill="none" stroke="rgba(255,255,255,.25)" stroke-width=".5"/>';
    Object.keys(PG_INT_MKA).forEach((k) => { const p = pgIntAt(PG_INT_MKA[k], 41), nm = pgIntMk(k); s += '<circle cx="' + X(p) + '" cy="' + Y(p) + '" r="2.2" fill="' + PG_INT_MKC[nm] + '"/>' + tx([p[0], p[1] + (p[1] > 0 ? 3.9 : -3.9)], nm, PG_INT_MKC[nm], 3.2); });
    PAT.forEach(([k, gg], n) => { const p = SO[k], yours = gg === g, c = yours ? P.TC[gg] : '#7c838f', ord = PAT.slice(0, n + 1).filter(([, x]) => x === gg).length;
      s += '<circle cx="' + X(p) + '" cy="' + Y(p) + '" r="' + (yours ? 7 : 6) + '" fill="' + c + '" fill-opacity="' + (yours ? 0.28 : 0.1) + '" stroke="' + c + '" stroke-width="' + (yours ? 0.9 : 0.4) + '"/>' + tx(p, String(ord), yours ? '#fff' : '#9aa3ad', yours ? 6 : 4.2); });
    const pr = pgIntAt(P.mark[g], 16), ga = pgIntGather();
    s += '<circle cx="' + X(pr) + '" cy="' + Y(pr) + '" r="2" fill="' + P.TC[g] + '" stroke="#fff" stroke-width=".5"/>' + tx([pr[0], pr[1] - 4.2], 'Wait', P.TC[g], 3.6);
    s += '<path d="M' + X([ga[0], ga[1] + 3.2]) + ' ' + Y([ga[0], ga[1] + 3.2]) + 'l3.2 3.2l-3.2 3.2l-3.2 -3.2z" fill="#f3c969"/>' + tx([ga[0] + 11, ga[1] - 3.2], 'End here', '#f3c969', 3.6);
    return s + '</svg>'; };
  const teamLine = () => { const g = pk.team, n = g === 'B' ? 2 : 3; return 'You wait by ' + P.TM[g] + ', then soak ' + n + ' of the 8 coils' + (pk.pat ? ': ' + lst(soaksOf(g, pk.pat)) + '.' : '. Which ones depends on the pattern.'); };
  const patLine = () => (pk.pat ? 'Pattern ' + pk.pat + ': the first coil rises on ' + P.PN[pk.pat] + '. The map shows its eight soaks, your team\'s numbered in its order.' : 'Random, as in the raid: the first coil rises on Star, Triangle or Cross, and the other seven always follow in that pattern\'s order. The map shows pattern 1.');
  const card = () => '<div class="pg-jobp"><div class="pg-jside">' + row('ir', 'Role', [['m', 'Melee'], ['r', 'Ranged'], ['h', 'Healer']], pk.role) + row('it', 'Team', [['Y', 'Yellow · Star'], ['P', 'Purple · Diamond'], ['B', 'Blue · Square']], pk.team) +
    row('ie', 'Egg', [['1', 'Carry one'], ['0', 'No egg']], pk.egg ? '1' : '0') + row('ip', 'Pattern', [[0, 'Random'], [1, 'Star'], [2, 'Triangle'], [3, 'Cross']], pk.pat) +
    '<p class="pg-jnote"><b>' + esc(P.TN[pk.team] + ' team.') + '</b> ' + esc(teamLine()) + ' ' + esc(patLine()) + '</p></div><div class="pg-jmapw"><div class="pg-jmap">' + roomSvg() + '</div></div></div>';
  const bind = (box, refresh) => { box.onclick = (e) => { const b = e.target.closest('[data-ir],[data-it],[data-ie],[data-ip]'); if (!b || b.disabled) return; const d0 = b.dataset;
    if (d0.ir) pk.role = d0.ir; if (d0.it) pk.team = d0.it; if (d0.ie != null) pk.egg = d0.ie === '1'; if (d0.ip != null) pk.pat = +d0.ip;
    const fk = ['ir', 'it', 'ie', 'ip'].find((k) => d0[k] != null), sel = fk ? '[data-' + fk + '="' + d0[fk] + '"]' : null, refocus = e.detail === 0;
    save(); box.innerHTML = card(); refresh(); if (refocus && sel) { const nb = box.querySelector(sel); if (nb && nb.focus) nb.focus(); } }; };
  const role = () => ({ id: slotOf(pk), name: RN[pk.role], job: P.TN[pk.team] + ' team' + (pk.egg ? ' · egg' : '') + (pk.pat ? ' · pattern ' + pk.pat : '') });
  const asg = () => { const g = pk.team, L0 = [];
    L0.push(['The eggs (5:24)', 'Eight eggs drop all over the stone at 5:24: step out of their circles.' + (pk.egg ? ' Yours is the gold one. Its shell breaks between 5:31 and 5:40: pick it up and carry it into your next soak, 3 yards from other carriers. The slam breaks it.' : ' Keep 3 yards from the egg carriers.')]);
    L0.push(['Your team: ' + P.TN[g], 'Wait by ' + P.TM[g] + '. Your soaks: ' + [1, 2, 3].map((p) => P.PN[p] + ' first: ' + lst(soaksOf(g, p))).join('; ') + '.']);
    L0.push(['The coils (5:36 to 5:54)', 'Eight slams, in pairs from opposite sides 2 s apart. Be inside your team\'s 10-yard circle when it slams. Never step into another team\'s: Soul Constrictor keeps you out of the next slam for 5 s.']);
    L0.push(['Personals (5:47)', 'The last four slams come 2 s apart and each one hits the whole raid: press Q (defensive).']);
    L0.push(['The Shattering (6:09)', 'Bubbles in the middle from 6:03: she bursts up there, and the platform breaks into four along the lines through the middle with a knockback. Stand on the diamond line, inside: off the cracks, away from the middle and the edge.']);
    return '<ul class="pg-asg">' + L0.map(([a, b]) => '<li><b>' + esc(a) + '</b><span>' + esc(b) + '</span></li>').join('') + '</ul>'; };
  // (the start card's "Your job in short": four plain lines, your team and soaks, your egg, the defensive, the Shattering)
  const short = () => { const g = pk.team, L0 = [];
    L0.push(pk.pat ? P.TN[g] + ' team, pattern ' + pk.pat + ' (' + P.PN[pk.pat] + ' first): wait by ' + P.TM[g] + ', then soak ' + lst(soaksOf(g, pk.pat)) + '.' : P.TN[g] + ' team: wait by ' + P.TM[g] + '. The first coil sets the pattern; then your ' + (g === 'B' ? 2 : 3) + ' soaks light up in gold.');
    L0.push(pk.egg ? 'Carry an egg: pick it up when its shell breaks (5:31 to 5:40) and bring it into your next soak.' : 'No egg: step out of the falling eggs at 5:24 and keep 3 yards from the carriers.');
    L0.push('Press Q at 5:47: the last four slams come back to back.');
    L0.push('By 6:09 stand on the diamond line, inside: off the cracks, away from the middle and the edge.');
    return '<ul class="pg-short">' + L0.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'; };
  // (the one-screen setup (practice.js SETUP, Nov 15, Flex via Main: "still too complex and confusing"): your role, then your job, the team you soak
  // with and, for some, an egg: the guide's teams, so melee are Yellow or Blue, ranged Purple or Blue, healers any. The pattern is random each run,
  // as in the raid; one plain sentence)
  const SJ = { m: [['Ye', 'Yellow team, egg'], ['Y', 'Yellow team'], ['B', 'Blue team']], r: [['Pe', 'Purple team, egg'], ['P', 'Purple team'], ['Be', 'Blue team, egg'], ['B', 'Blue team']], h: [['Y', 'Yellow team'], ['P', 'Purple team'], ['B', 'Blue team']] };
  const jobNow = (j) => j.team + (j.egg ? 'e' : '');
  const setupCard = { roles: ['m', 'r', 'h'],
    now: () => { const r = pk.role; if (!SJ[r].some((x) => x[0] === jobNow(pk))) setupCard.set(r, SJ[r][0][0]); return { role: pk.role, job: jobNow(pk) }; },
    jobs: (r) => (SJ[r] || []).map((x) => x.slice()),
    set: (r, v) => { if (!SJ[r]) return; if (!SJ[r].some((x) => x[0] === v)) v = SJ[r][0][0]; pk = { role: r, team: v[0], egg: v.length > 1, pat: 0 }; save(); },
    say: () => { const g = pk.team; return 'You wait by ' + P.TM[g] + ' with the ' + P.TN[g] + ' team and soak your ' + (g === 'B' ? 2 : 3) + ' of the 8 coils as the pattern lights them up in gold' + (pk.egg ? ', carrying an egg into one' : '') + '. Press Q at 5:47, then end on the diamond line before she bursts up at 6:09. No kicks in this part.'; } };
  const starts = [[0, '5:18 · The eggs'], [330, '5:30 · The first coils'], [345, '5:45 · The back-to-back slams'], [356, '5:56 · The Shattering']];
  // ---- hitting the right thing: the Rawlings once the coils are done (the raid kills them then), any Viper at once ----
  const ADD_HP = { rawling: 3, viper: 5 };
  const tgts = () => { sync(); const L0 = []; if (!G) return L0; G.adds.forEach((a) => { a.id = a.id || 'a' + (G.addN = (G.addN || 0) + 1); const mx = ADD_HP[a.kind] || 3; if (a.hp == null) a.hp = mx; L0.push({ key: a.id, kind: a.kind, name: a.kind === 'viper' ? 'Blightscale Viper' : 'Blightscale Rawling', p: [a.x, a.y], r: a.kind === 'viper' ? 1.6 : 1.1, hp: a.hp, max: mx }); }); return L0; };
  const dpsCat = (t) => { sync(); if (!G) return null; if (G.adds.some((a) => a.kind === 'viper')) return 'viper'; return t >= T.slams[7] + 0.5 && t < T.shatter && G.adds.some((a) => a.kind === 'rawling') ? 'rawling' : null; };
  const dpsNames = (DL) => { const k = new Set(DL.map((m) => m.kind)); return ['rawling', 'viper'].filter((x) => k.has(x)).map((x) => ({ rawling: 'the Rawlings', viper: 'the Vipers' })[x]).join(', '); };

  // ---- the minimap: the platform, the markers, the soaks, the eggs, everyone ----
  const mini = (mx, Wm, Hm, t) => { sync(); const sc = Wm / 100, M = (x, y) => [Wm / 2 + x * sc, Hm / 2 - y * sc], dot = (x, y, r, c, st) => { const [a, b] = M(x, y); mx.beginPath(); mx.arc(a, b, r, 0, Math.PI * 2); if (c) { mx.fillStyle = c; mx.fill(); } if (st) { mx.strokeStyle = st; mx.lineWidth = 1.2; mx.stroke(); } };
    mx.clearRect(0, 0, Wm, Hm); mx.fillStyle = 'rgba(8,10,14,.82)'; mx.fillRect(0, 0, Wm, Hm); mx.fillStyle = 'rgba(120,140,110,.28)';
    const oct = [[36.5, 12.5], [15, 34], [-15, 34], [-36.5, 12.5], [-36.5, -12.5], [-15, -34], [15, -34], [36.5, -12.5]].map((q) => M(q[0], q[1])); mx.beginPath(); oct.forEach((q, i) => (i ? mx.lineTo(q[0], q[1]) : mx.moveTo(q[0], q[1]))); mx.closePath(); mx.fill();
    if (G.int && G.int.shat) { mx.fillStyle = 'rgba(40,90,30,.95)'; const a = M(-P.CRACK, 36), b = M(-37, P.CRACK); mx.fillRect(a[0], a[1], 2 * P.CRACK * sc, 72 * sc); mx.fillRect(b[0], b[1], 74 * sc, 2 * P.CRACK * sc); }
    Object.keys(PG_INT_MKA).forEach((k) => { const p = pgIntAt(PG_INT_MKA[k], 40); dot(p[0], p[1], 2.2, PG_INT_MKC[pgIntMk(k)]); });
    const me = A.me, g = S.job.team[me];
    S.soaks.forEach((s) => { if (t > s.at + 0.4) return; const yours = s.group.includes(me); if (t >= s.t0) dot(s.x, s.y, s.r * sc, yours ? 'rgba(243,201,105,.25)' : 'rgba(36,242,203,.18)', yours ? '#f3c969' : '#24f2cb'); else if (yours && called(t)) dot(s.x, s.y, s.r * sc, null, 'rgba(243,201,105,.55)'); });
    if (!called(t)) { const p = S.pre[g]; dot(p[0], p[1], 3, null, P.TC[g]); }
    if (t >= T.gather - 1 && t < T.shatter + 1) { const p = pgIntGather(); dot(p[0], p[1], P.SPREAD * sc, 'rgba(243,201,105,.25)', '#f3c969'); }
    G.eggs.forEach((e) => { if (e.state === 'floor' || e.state === 'air') dot(e.x, e.y, 1.4, e.id === me ? '#f3c969' : '#e9e2c6'); });
    G.adds.forEach((a) => dot(a.x, a.y, 1.3, a.kind === 'viper' ? '#ff3b3b' : '#a7c46b'));
    if (t < T.callL + 0.6) dot(S.her[0], S.her[1], 3.4, '#2f6a22', '#b6f23a'); else if (t >= T.shatter) dot(0, 0, 4, '#2f6a22', '#b6f23a');
    GDZ_RAID.forEach((id) => { if (id !== me) dot(G.bots[id].x, G.bots[id].y, 1.4, GDZ_ROLE[id[0]][1]); }); dot(G.x, G.y, 2.6, '#fff', '#000');
    if (A.v3) { const f = A.v3.fwd(), [a, b] = M(G.x, G.y); mx.beginPath(); mx.moveTo(a, b); mx.lineTo(a + f[0] * 12, b - f[1] * 12); mx.strokeStyle = '#f3c969'; mx.lineWidth = 2; mx.stroke(); } };
  // ---- 3D only (as phase 2): the 2D canvas says so while 3D loads, or if it can't ----
  const draw2d = (cx, cv) => { const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), Wd = Math.max(1, Math.round(r.width * dpr)), Hd = Math.max(1, Math.round(r.height * dpr)); if (cv.width !== Wd || cv.height !== Hd) { cv.width = Wd; cv.height = Hd; }
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#07090c'; cx.fillRect(0, 0, cv.width, cv.height); cx.textAlign = 'center'; cx.fillStyle = '#e8edf2'; cx.font = '800 ' + Math.round(22 * dpr) + 'px system-ui, sans-serif';
    cx.fillText(A.busy ? 'Loading 3D…' : 'The intermission plays in 3D', cv.width / 2, cv.height / 2 - 14 * dpr); cx.fillStyle = '#aab4c0'; cx.font = '600 ' + Math.round(15 * dpr) + 'px system-ui, sans-serif';
    cx.fillText(A.busy ? 'The coils are on their way.' : 'Press 3D under the minimap. If this PC can\'t show 3D, try phase 1.', cv.width / 2, cv.height / 2 + 16 * dpr); };

  // ---- the bots' audit (window.__pgDbg.audit): what practice.js's own audit can't see here ----
  const auditStep = (t0, t, add) => { sync(); const cr = (at) => at > t0 && at <= t;
    GDZ_RAID.forEach((id) => { const p = pos(id);
      S.soaks.forEach((s) => { if (!cr(s.at) || s.group.includes(id) || pgDist(p, [s.x, s.y]) > s.r) return; const nx = S.soaks.find((q) => q.group.includes(id) && q.at > s.at); if (nx && nx.at - s.at < 5.2) add('in another team\'s slam ' + clk(s.at) + ' before their own', id, t); });
      if (cr(T.shatter)) { const q = pgIntKb(p); if (Math.hypot(p[0], p[1]) <= P.MID) add('in the middle as she burst up', id, t); else if (pgIntCrack(p[0], p[1])) add('on a crack at the Shattering', id, t); else if (!PG_UL.onPlat(q[0], q[1]) || pgIntCrack(q[0], q[1])) add('thrown into the venom at the Shattering', id, t); }
      if (t > T.shatter + 0.6 && pgIntCrack(p[0], p[1]) && !G.int.kb[id]) add('in a crack after the Shattering', id, t); });
    if (cr(T.gather)) G.eggs.forEach((e) => { if (e.state !== 'gone') add('egg not broken by the last slam', e.id || '?', t); });
    G.int.soakN.splice(0).forEach(([k, n]) => { if (n < 5) add('slam ' + (k + 1) + ' had only ' + n + ' soakers', 'raid', t); }); };

  // ---- 3D: the shapes for this part (practice3d.js's pg3dShapes adds them to the list it draws) ----
  const cl = (v) => Math.max(0, Math.min(1, v));
  const shapes = (t, P3, h) => { sync(); if (!G || !G.int) return; const me = A.me, g = teamOf(me);
    // (the raid markers round the room, as the plan puts them)
    Object.keys(PG_INT_MKA).forEach((k) => { const p = pgIntAt(PG_INT_MKA[k], 33), nm = pgIntMk(k), c = PG_INT_MKC[nm]; h.disc(p[0], p[1], 1.5, c, 0.6); h.ring(p[0], p[1], 1.5, c, 0.95, 0.2); h.label(p[0], p[1], 2.4, nm, c, 12); });
    // (her Call at her edge, then down into the venom with a splash)
    if (t >= T.callL + 0.6 && t < T.callL + 2.8) P3({ k: 'splash', x: S.her[0], y: S.her[1], p: (t - T.callL - 0.6) / 2.2, s: 1.5 });
    // (where your team waits until the pattern is called)
    if (!called(t) && t < T.gather) { const p = S.pre[g]; h.ring(p[0], p[1], 4.5, P.TC[g], 0.85, 0.25, true); h.label(p[0], p[1], 3.6, P.TN[g] + ' team waits here', P.TC[g], 13); }
    // (your coming soaks once the pattern is called, numbered in your team's order (the guide's map); the one up now practice3d.js draws itself)
    if (called(t)) S.soaks.forEach((s) => { if (s.team !== g || t >= s.t0) return; h.ring(s.x, s.y, s.r, '#f3c969', 0.55, 0.3, true); h.label(s.x, s.y, 3, 'Your ' + pgIntOrd(ordOf(s)) + ' soak · ' + mkAt(s), '#f3c969', 14); });
    // (each coil: the spectral tail rises at the rim and slams its circle; the circle's team over it)
    S.soaks.forEach((s) => { if (t < s.t0 || t > s.at + 0.6) return; P3({ k: 'stail', x: s.rim[0], y: s.rim[1], f: cl((t - s.t0) / 1.2), sink: t > s.at ? cl((t - s.at) / 0.6) : 0 }); if (t < s.t0 + 1.1) P3({ k: 'splash', x: s.rim[0], y: s.rim[1], p: (t - s.t0) / 1.1, s: 0.6 });
      h.label(s.rim[0], s.rim[1], 9, 'Spectral Coil', '#7ff2dc', 12); h.label(s.x, s.y, 7.5, P.TN[s.team] + ' team' + (s.team === g ? ' (yours)' : ''), P.TC[s.team], 13); });
    // (the end: where to stand, then the cracks and her burst lighting up red; after it the cracks are venom)
    if ((t >= T.gather - 1 || (called(t) && !nextSoak(me, t))) && t < T.shatter + 1) { const p = pgIntGather(); h.disc(p[0], p[1], P.SPREAD, '#f3c969', 0.12); h.ring(p[0], p[1], P.SPREAD, '#f3c969', 1, 0.3, true); h.label(p[0], p[1], 4, 'Diamond line · stand here', '#f3c969', 14); }
    if (t >= T.bubbles && t < T.shatter) { const o = 0.16 + 0.1 * Math.sin(t * 6); [0, Math.PI / 2].forEach((a) => P3({ k: 'rect', x: 0, y: 0, a, f0: -38, f1: 38, w0: -P.CRACK, w1: P.CRACK, c: '#ff4a3a', o }));
      h.disc(0, 0, P.MID, '#ff4a3a', 0.18); h.ring(0, 0, P.MID, '#ff4a3a', 1, 0.3, true); h.label(0, 0, 6, 'She bursts up here', '#ff8a6a', 14); }
    if (t >= T.shatter) [0, Math.PI / 2].forEach((a) => { P3({ k: 'rect', x: 0, y: 0, a, f0: -38, f1: 38, w0: -P.CRACK, w1: P.CRACK, c: '#24481c', o: 0.94 }); P3({ k: 'rect', x: 0, y: 0, a, f0: -38, f1: 38, w0: -P.CRACK * 0.6, w1: P.CRACK * 0.6, c: '#5fae2e', o: 0.35 + 0.1 * Math.sin(t * 4) }); }); };

  return { part: 'int', label: 'the intermission', flat3d: true,
    script: (o) => pgIntScript({ ...(o || {}), me: A.me, pick: mine() ? pk : null, pat: o && o.pat != null ? o.pat : pk.pat }), init, home, job, slow, check, kick, bossHp, onPlat: (x, y) => PG_UL.onPlat(x, y),
    bossAt: (t) => { sync(); if (!S) return { p: [46, 0], up: true }; if (t >= T.shatter) return { p: [0, 0], up: true }; if (t < T.callL + 0.6) return { p: S.her.slice(), up: true }; return { p: [0, 0], up: false }; }, tailAt: () => ({ p: [0, 0], up: false }),
    jobText, upNext, acts, hud, card, bind, role, asg, short, setup: setupCard, starts, tgts, dpsCat, dpsNames, mini, draw2d, auditStep, shapes, ff: () => { sync(); if (G && G.int) { G.wipes = 0; G.int.soakN = []; } },
    clean: 'Every soak taken, your egg broken in a soak, your defensive for the back-to-back slams, and you rode out the Shattering on the diamond line. Try another team or pattern.',
    get pick() { return pk; }, set pick(j) { if (jobOk(j)) pk = j; }, slotOf, mine, get T() { return T; } };
}
// (the part on the start card's Part switch, after phase 2 and before phase 3 whichever file is read first; `?practice=int` on the guide opens it)
{ const U = PG_PARTS["Ula'tek"], mi = { name: 'Intermission', d: 'm', end: PG_INT_T.end, roles: [{ id: 'r7', name: 'Ranged', job: 'Blue team' }], mod: pgInt }, out = {}, keys = Object.keys(U);
  keys.forEach((k) => { if (k === 'm3' && !out.mint) out.mint = mi; if (k !== 'mint') out[k] = U[k]; }); if (!out.mint) out.mint = mi; keys.forEach((k) => { delete U[k]; }); Object.assign(U, out); }
