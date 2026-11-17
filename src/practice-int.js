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
// takes no damage from 5:20 until the platform shatters at 6:09.4 (Falling on 8 to 18 players), and she comes up at one quarter's outer corner (north-east 3, north-west 5, south-west 4, south-east 5: hit there from 6:12.3), her bubbles showing it first (the guide); standing within 3 yards of a crack line (the lines
// through the middle, north to south and east to west) 53% landed in the venom, 3 to 6 yards 34%, 6 to 10 yards 9%; the raid gathered in the
// south-east quarter (the diamond's) on 9 of 17 kills. Her next Call 6:17.2 (phase 3, src/practice-p3.js, from 6:12).
// Picked, not measured: the fall's hit (a third of your health: the audit's 380k); the shells breaking one by one from 5:31 to 5:40 (top kills pick the eggs up from about 5:30, half of them by 5:40); which
// raider carries which egg (three in each three-soak team, two in Blue) and where the eggs land (at random in each team's part of the room, from the
// run's seed, 8 to 17 yards out between the soak circles, so no carrier has to step into another team's coil; the real ones land a median 21 out); the soak's 10 yards (as phase 1's); the cracks' 3.5 yards each side; her bubbles from 6:03; the knockback's 6 yards out
// from the middle (players move about 7 yards in the logs); the gathering spot on the diamond line 23.5 yards out (the guide: "toward the diamond, on
// the inside"); the defensive's cue at 5:47 so its 8 s cover all four slams, counted if pressed 5:44.5 to 5:52.6 (the guide: "personals around 5:50"); the slams' damage in the game; the Rawlings lasting to
// about 6:00 to 6:06 unless you kill them first, and crawling after the raid once the coils are done. The teams are the guide's (src/guides.js, the Mythic intermission card): a tank, a healer and 5 melee
// (Yellow, waits by Star); a tank, a healer and 4 ranged (Purple, by Diamond); the other two healers and the rest of the DPS (Blue, by Square).
const PG_INT_T = { start: 318, call: 319, callL: 323, land: 324.1, shell0: 331, shellGap: 1.25, slams: [336.5, 338.5, 342.5, 344.5, 348.5, 350.4, 352.5, 354.5], lead: 4,
  defFrom: 345.5, defCue: 347, defBy: 352.6, gather: 355, bubbles: 363, shatter: 369.4, end: 372 };
const PG_INT = {
  team: { Y: ['t1', 'h1', 'm1', 'm2', 'm3', 'm4', 'm5'], P: ['t2', 'h2', 'r1', 'r2', 'r3', 'r4'], B: ['h3', 'h4', 'm6', 'm7', 'r5', 'r6', 'r7'] },
  carry: ['m1', 'm2', 'm3', 'r1', 'r2', 'r3', 'r5', 'r6'],
  // (each team's marker (the guide's: Yellow on Star, Purple on Diamond, Blue on Square; degrees from east, counter-clockwise) and the part of the
  // room its eggs land in)
  mark: { Y: 112.5, P: 292.5, B: 202.5 }, area: { Y: [28, 118], P: [248, 332], B: [152, 210] },
  R: 10, CRACK: 3.5, MID: 8, KB: 6, GATHER: 23.5, GA: 292.5, SPREAD: 4,
  TN: { Y: 'Yellow', P: 'Purple', B: 'Blue' }, TC: { Y: '#f5d33a', P: '#c86bff', B: '#3d8bff' }, TM: { Y: 'Star', P: 'Diamond', B: 'Square' },
  PN: ['', 'Star', 'Triangle', 'Cross'],
  // (where she comes up as the platform shatters: the outer corner of one quarter, a different one each pull (the 17 kills: north-east 3, north-west
  // 5, south-west 4, south-east 5; she's hit there from 6:12.3), the first quarter of phase 3. Her bubbles show there first)
  Q: { NE: [33.4, 31.4], NW: [-33.1, 32.7], SW: [-33.5, -32], SE: [32.8, -32] }, QN: { NE: 'north-east', NW: 'north-west', SW: 'south-west', SE: 'south-east' },
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
// (the eight raid markers in the shapes and colours raiders know from the game (Flex, Nov 15: "make the markers have the floating marker shape like in
// game"), drawn here, never Blizzard's art: a yellow star, an orange circle, a purple diamond, a green triangle, a silver moon, a blue square, a red
// cross and a white skull, lit from the top with a dark rim. On a canvas context g, centred on cx, cy, r across; `bg` cuts the moon's crescent in that
// colour (on a shared canvas, the minimap), else it's cut out of its own canvas)
const PG_INT_MKG = { Star: ['#ffe873', '#d9a40b'], Circle: ['#ffb873', '#d9620c'], Diamond: ['#e4b8ff', '#9a3fe0'], Triangle: ['#aef5a2', '#2f9f3c'], Moon: ['#f4f7fb', '#98a4b4'], Square: ['#93c8ff', '#2562c9'], Cross: ['#ff9182', '#c8281c'], Skull: ['#ffffff', '#bdb6a8'] };
function pgIntMarkDraw(g, nm, cx, cy, r, bg) {
  const C = PG_INT_MKG[nm] || ['#ffffff', '#999999'], gr = g.createLinearGradient(cx, cy - r, cx, cy + r); gr.addColorStop(0, C[0]); gr.addColorStop(1, C[1]);
  g.save(); g.lineJoin = 'round'; g.lineWidth = Math.max(1, r * 0.13); g.strokeStyle = 'rgba(12,9,6,.92)'; g.fillStyle = gr; g.beginPath();
  const poly = (L) => L.forEach(([x, y], i) => (i ? g.lineTo(cx + x * r, cy + y * r) : g.moveTo(cx + x * r, cy + y * r)));
  if (nm === 'Star') { const L = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? 0.44 : 0.98; L.push([Math.cos(a) * q, Math.sin(a) * q + 0.06]); } poly(L); g.closePath(); }
  else if (nm === 'Circle') g.arc(cx, cy, r * 0.84, 0, Math.PI * 2);
  else if (nm === 'Diamond') { poly([[0, -0.98], [0.7, 0], [0, 0.98], [-0.7, 0]]); g.closePath(); }
  else if (nm === 'Triangle') { poly([[0, -0.9], [0.96, 0.78], [-0.96, 0.78]]); g.closePath(); }
  else if (nm === 'Square') g.rect(cx - r * 0.74, cy - r * 0.74, r * 1.48, r * 1.48);
  else if (nm === 'Cross') { const w = 0.27, l = 0.98, c = Math.SQRT1_2; poly([[w, -l], [w, -w], [l, -w], [l, w], [w, w], [w, l], [-w, l], [-w, w], [-l, w], [-l, -w], [-w, -w], [-w, -l]].map(([x, y]) => [(x - y) * c, (x + y) * c])); g.closePath(); }
  else if (nm === 'Skull') { g.arc(cx, cy - r * 0.14, r * 0.72, Math.PI * 0.82, Math.PI * 2.18); g.lineTo(cx + r * 0.4, cy + r * 0.78); g.lineTo(cx - r * 0.4, cy + r * 0.78); g.closePath(); }
  else if (nm === 'Moon') g.arc(cx, cy, r * 0.86, 0, Math.PI * 2);
  g.fill(); g.stroke();
  if (nm === 'Moon') { g.beginPath(); g.arc(cx + r * 0.42, cy - r * 0.22, r * 0.68, 0, Math.PI * 2); if (bg) { g.fillStyle = bg; g.fill(); } else { g.globalCompositeOperation = 'destination-out'; g.fill(); g.globalCompositeOperation = 'source-over'; } }
  if (nm === 'Skull') { g.fillStyle = 'rgba(20,16,12,.92)'; [-1, 1].forEach((sd) => { g.beginPath(); g.arc(cx + sd * r * 0.27, cy - r * 0.12, r * 0.18, 0, Math.PI * 2); g.fill(); }); g.beginPath(); poly([[0, 0.12], [0.09, 0.3], [-0.09, 0.3]]); g.closePath(); g.fill();
    g.lineWidth = Math.max(1, r * 0.06); g.strokeStyle = 'rgba(20,16,12,.8)'; [-0.18, 0, 0.18].forEach((x) => { g.beginPath(); g.moveTo(cx + x * r, cy + r * 0.5); g.lineTo(cx + x * r, cy + r * 0.74); g.stroke(); }); }
  g.restore(); }
// (on a crack line once the platform shatters: within 3.5 yards of the line through the middle north to south, or east to west)
const pgIntCrack = (x, y, m) => Math.abs(x) <= PG_INT.CRACK + (m || 0) || Math.abs(y) <= PG_INT.CRACK + (m || 0);
// (her corner by the two raid markers either side of it, never a compass word (the prompts audit, Nov 16: "the south-east corner"): "between Diamond and Moon")
const pgIntCorner = (q) => { const a = { NE: 45, NW: 135, SW: 225, SE: 315 }[q], L = Object.keys(PG_INT_MKA).filter((k) => Math.abs((((PG_INT_MKA[k] - a) % 360) + 540) % 360 - 180) < 23).map(pgIntMk);
  return L.length === 2 ? 'between ' + L[0] + ' and ' + L[1] : 'where her bubbles are'; };
const pgIntGather = () => pgIntAt(PG_INT.GA, PG_INT.GATHER);
const pgIntOrd = (n) => n + (n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th');
// (where the knockback puts you: 6 yards further out from the middle; from inside her burst, out past it)
const pgIntKb = (p) => { const d = Math.hypot(p[0], p[1]) || 0.01, nd = d <= PG_INT.MID ? PG_INT.MID + PG_INT.KB : d + PG_INT.KB; return [p[0] / d * nd, p[1] / d * nd]; };
// (where each team waits until the pattern is called: 16 yards out by its marker (the guide's map). One rule for the game and the setup's spot maps)
const pgIntPre = (g) => pgIntAt(PG_INT.mark[g], 16);
const pgIntSpiral = (c, i, r) => { const a = i * 2.39996, rr = r * Math.sqrt(((i % 9) + 0.5) / 9); return [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; };
// (your own spot while your team waits (J: pgIntJobs's teams): the carriers on a ring 5 yards out, apart; the rest round the middle)
const pgIntPreAt = (J, id, c0) => { const g = J.team[id], L = J.list[g], car = L.filter((q) => J.carry.has(q)), i = car.indexOf(id), c = c0 || pgIntPre(g);
  if (i >= 0) { const a = i / Math.max(3, car.length) * Math.PI * 2 + 1.1; return [c[0] + Math.cos(a) * 5, c[1] + Math.sin(a) * 5]; } return pgIntSpiral(c, Math.max(0, L.filter((q) => !J.carry.has(q)).indexOf(id)), 3.2); };

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
    // (her bubbles from 6:03 at the corner where she comes up as the platform shatters: practice3d.js draws the bubbles and her rise from this; `to`
    // is set below, once the eggs have their spots, so a run's seed still gives the same eggs)
    dive: { t0: T.bubbles, gone: T.bubbles + 0.2, surf: T.shatter, to: [0, 0] } };
  const cast = (who, name, t0, t1) => S.casts.push({ who, name, t0, t1 }), warn = (t, text, c, o) => S.warns.push({ t, text, c: c || '#ff8f87', ...(o || {}) }), timer = (t, name) => S.timers.push({ t, name });
  S.job = pgIntJobs(o.me, o.pick);
  // (the centre calls, written "Mechanic: Order" (the prompts audit, Nov 16, Flex: "the alerts and training wheels could be better", then "All 10"): the
  // big line is the order, verb first, the mechanic's name small; "your" only in the calls about your own job (practice.js draws those gold), never a
  // clock time or a second count (Flex, Nov 16: "i feel like the game confuses people saying timestamps"): the boss-mod bars count. Yours from o.me)
  const me = o.me, mine = !!me && !!S.job.team[me], iCarry = mine && S.job.carry.has(me);
  warn(T.start, mine ? (iCarry ? 'Intermission: Run to your egg\'s gold circle! Stand beside it, not under it.' : 'Intermission: Go to your team\'s spot by ' + P.TM[S.job.team[me]] + '! Eggs are coming.') : 'Intermission: Go to your team\'s spot! Eggs are coming.', '#c084ff', mine ? { me: 1 } : null); /* (yours, gold: practice.js no longer turns a call gold for saying "your", Nov 16) */
  // (its bar "Eggs land": "egg" in the name gives it Call of the Serpent's icon, and a carrier's own "Your egg lands" stands in for it, one bar for one thing)
  cast('boss', 'Call of the Serpent', T.call, T.callL); warn(T.call, 'Call of the Serpent: Dodge the falling eggs! Eight land all over the stone.', '#e6e0c8'); timer(T.land, 'Eggs land');
  // each team waits by its marker, 16 yards out (the guide's map)
  S.pre = { Y: pgIntPre('Y'), P: pgIntPre('P'), B: pgIntPre('B') };
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
  // (no call when the shells break: your own egg's shell is up from its landing until you hit it open, so "Egg shells are breaking: carriers, pick yours
  // up", gold to everyone at 5:31, was false for you and wrong for the rest (the prompts audit, Nov 16). The job line says it, for you)
  // the eight coils: the pattern's order (the guide's table), each slammed by its team; the coil rises at the rim 4 s before
  const PAT = pgIntPat()[pat - 1], SO = pgIntSoak(), RIM = pgIntRim();
  S.soaks = PAT.map(([k, g], n) => { const at = T.slams[n], q = SO[k]; return { set: 0, k: n, x: q[0], y: q[1], r: P.R, t0: at - T.lead, at, cast: at - T.lead, spot: k, team: g, rim: RIM[k].slice(), group: S.job.list[g].slice() }; });
  // (the boss-mod bars as a raid's would show them: when the coils start and when the last four come, not whose they are: a "Coil slam 1" timer
  // would show you yours before the pattern is called (the review, Nov 15). Yours come with the hints, once it's called)
  timer(S.soaks[0].at, 'Spectral Coils'); timer(S.soaks[4].at, 'Spectral Coils: the last four');
  // (the pattern call names YOUR first soak in the big line, the raid's pattern small: "Triangle first" sent Yellow players, whose first soak is at Circle,
  // looking at Triangle (the prompts audit, Nov 16))
  { const f = mine && S.soaks.find((s) => s.group.includes(me)); warn(S.soaks[0].cast, f ? 'Spectral Coils: Go to your soak at ' + pgIntMk(f.spot) + '! ' + P.PN[pat] + ' first (pattern ' + pat + ').' : 'Spectral Coils: ' + P.PN[pat] + ' first! Pattern ' + pat + '.', '#24f2cb', f ? { me: 1 } : null); }
  // (the defensive: the only call that needs a key, so it says Q and it's yours (gold). It was "Personals now" small under "the last four slams come back
  // to back", and never named Q. check() below turns it into a plain warning when your Q can't be pressed for it, or is already up)
  warn(T.defCue, mine ? 'Back-to-back slams: Press Q (your defensive) now!' : 'Back-to-back slams: Four slams in a row now!', '#7fb8ff', mine ? { me: 1 } : null);
  // (the Rawlings: the ranged and healers hit them from the gold ring, the melee and tanks go to them first: the call said "kill the Rawlings, then to the
  // diamond line" to everyone, the reverse of what the ranged do. At the moment the job line changes, not after it)
  warn(T.gather, mine && /^[mt]/.test(me) ? 'Coils done: Kill the Rawlings! Then go to the gold ring by the Diamond.' : 'Coils done: Go to the gold ring by the Diamond! Hit the Rawlings from there.', '#c9df9a');
  // (where she comes up: one quarter's outer corner, from the run's seed (drawn last, so the eggs above stay the same for a seed))
  const QK = ['NE', 'NW', 'SW', 'SE'], q1 = QK[Math.min(3, Math.floor(rnd() * 4))]; S.q1 = q1; S.dive.to = P.Q[q1].slice();
  // (by the two markers either side of her corner, never a compass word or "at 6:09": the order first)
  warn(T.bubbles, 'The Shattering: Stand on the gold ring by the Diamond! She comes up ' + pgIntCorner(q1) + '.', '#7fd8ff'); timer(T.shatter, 'The Shattering');
  warn(T.shatter, 'The Shattering: Brace for the knockback!', '#ff8a5a');
  S.timers.sort((a, b) => a.t - b.t); S.warns.sort((a, b) => a.t - b.t);
  return S;
}
// (where each team's eggs land in the game, for the setup's Your egg map: the run's own rule above over 96 runs, the middle of them and the circle
// round 95% of them (it holds 93 to 95% of 200 other runs' eggs: tests/practice-int.js N); worked out once, about 50 ms. `pts`: as many real landings
// as the team carries eggs, to draw: its eggs in order round the room cut into that many equal slices, the landing nearest each slice's middle; `you`: the
// one of them nearest the middle (the review, Nov 16: the map drew them on a made-up ring, one 3.6 yards from where any Purple egg ever lands)
let PG_INT_EA = null;
const pgIntEggArea = (g) => { if (!PG_INT_EA) { const by = { Y: [], P: [], B: [] }; for (let seed = 1; seed <= 96; seed++) { const S = pgIntScript({ seed }); S.eggSets[0].eggs.forEach((e) => by[S.job.team[e.id]].push([e.x, e.y])); }
    PG_INT_EA = {}; Object.entries(by).forEach(([k, L]) => { const c = [L.reduce((s, p) => s + p[0], 0) / L.length, L.reduce((s, p) => s + p[1], 0) / L.length], d = L.map((p) => pgDist(p, c)).sort((a, b) => a - b);
      const n = PG_INT.carry.filter((id) => PG_INT.team[k].includes(id)).length, ac = Math.atan2(c[1], c[0]), rel = (p) => ((Math.atan2(p[1], p[0]) - ac + Math.PI * 3) % (Math.PI * 2)) - Math.PI, A = L.slice().sort((p, q) => rel(p) - rel(q));
      const pts = Array.from({ length: n }, (_, i) => { const ch = A.slice(Math.floor(i * A.length / n), Math.floor((i + 1) * A.length / n)), m = [ch.reduce((s, p) => s + p[0], 0) / ch.length, ch.reduce((s, p) => s + p[1], 0) / ch.length]; return ch.reduce((b, p) => (pgDist(p, m) < pgDist(b, m) ? p : b)).slice(); });
      PG_INT_EA[k] = { c, r: d[Math.floor(d.length * 0.95)], n, pts, you: pts.reduce((b, p) => (pgDist(p, c) < pgDist(b, c) ? p : b)) }; }); }
  return PG_INT_EA[g]; };

// ---- the part: practice.js calls pgInt(api) once per game; api is practice.js's window on the game (G, S, me, the hit helpers) ----
function pgInt(A) {
  const T = PG_INT_T, P = PG_INT, clk = pgClock, RN = { m: 'Melee', r: 'Ranged', h: 'Healer' };
  let S = null, G = null; const sync = () => { S = A.S; G = A.G; };
  let setUp = false; const setup = () => { if (setUp) return; setUp = true; Object.assign(A.DEB, { fall: ['Falling', '#c8a36a'], dvenom: ['Deadly Venom', '#9be13a'] }); ['shatter', 'egg'].forEach((k) => A.MAJ.add(k));
    if (A.DPS_SAY && A.DPS_SAY.rawling) A.DPS_SAY.rawling[3] = 'them'; }; /* ("press Tab to pick one", not "it": this game's own copy of the lines, the review, Nov 15) */
  // ---- your job (the start card), remembered on this browser ----
  const KEY = 'wla-pg-jobint', job0 = () => ({ role: 'r', team: 'P', egg: true, pat: 0 }); /* (a first visit plays every mechanic a ranged can: Purple, with an egg (Flex, Nov 16)) */
  const jobOk = (j) => !!j && /^[mrh]$/.test(j.role) && /^[YPB]$/.test(j.team) && typeof j.egg === 'boolean' && [0, 1, 2, 3].includes(j.pat);
  let pk = (() => { try { const j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (jobOk(j)) return j; } catch (e) { /* (no storage) */ } return job0(); })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(pk)); } catch (e) { /* (no storage) */ } };
  const slotOf = (j) => pgIntSlot(j || pk), mine = () => A.me === slotOf(pk);
  const pos = (id) => (id === A.me ? [G.x, G.y] : [G.bots[id].x, G.bots[id].y]);
  const teamOf = (id) => S.job.team[id];
  const spiral = pgIntSpiral;
  const once = (k) => (G.int.once.has(k) ? false : (G.int.once.add(k), true));
  const called = (t) => t >= S.soaks[0].cast; /* (the first coil rises on Star, Triangle or Cross: the caller calls the pattern, and every team knows its spots) */
  const nextSoak = (id, t) => S.soaks.find((s) => s.group.includes(id) && s.at >= t - 0.15) || null;
  // (each raider's spot in a soak: the carriers on a ring 5 yards out, apart, 8.7 yards apart, so their 3-yard rings never touch; the rest near the middle)
  const slotIn = (s, id) => { const car = s.group.filter((q) => S.job.carry.has(q)), i = car.indexOf(id); if (i >= 0) { const a = i / Math.max(3, car.length) * Math.PI * 2 + 0.6; return [s.x + Math.cos(a) * 5, s.y + Math.sin(a) * 5]; }
    return spiral([s.x, s.y], Math.max(0, s.group.filter((q) => !S.job.carry.has(q)).indexOf(id)), 3); };
  const preSpot = (id) => pgIntPreAt(S.job, id, S.pre[teamOf(id)]);
  // (one rule for your egg, used by the bots, the autopilot, your arrow and your hint (the review, Nov 15: the hint sent carriers to their soak, then
  // the score said they never picked their egg up): go for it from 4 s before its shell breaks whenever you can be at it as it breaks and still reach
  // your next soak's edge before it slams; else soak first and get it after)
  // (your own egg's Hardened shell has health since Nov 15 (practice.js, Flex: "The eggs have to be damaged to break the shield"): you go and break it
  // as soon as it lands, when your next soak allows: with your hits and the raid's it opens in about 3.6 s)
  // (your soaks done and your egg still on the floor: it can't go into a soak now, so you leave it (the release sweep, Nov 16: the hint said "Pick up your
  // egg now", and doing it added "still in your hands" on top of "never went into a soak"). The bots keep their old rule: they always make their soaks)
  const eggFirst = (id, t, b0, e, ns) => { if (!e || e.state !== 'floor') return false; const opens = e.shp > 0 ? t + e.shp / 1.4 : e.shell; if (!(e.shp > 0) && t < opens - 4) return false; if (!ns && called(t) && id === A.me) return false; if (!ns || !called(t)) return true; const sp = id === A.me ? 7 : 9.8;
    return Math.max(pgDist([b0.x, b0.y], [e.x, e.y]) / sp, opens - t) + Math.max(0, pgDist([e.x, e.y], [ns.x, ns.y]) - (ns.r - 2)) / 7 + 0.4 <= ns.at - t; }; /* (the walk to the soak with the egg at 7 yards a second: a carrier holding an egg walks at your speed (calmCarriers, Flex, Nov 15: "they tend to pause and then move a lot faster than the player and will run right into me")) */
  const homeAt = (id) => { const sg = S.east ? 1 : -1, i = GDZ_RAID.indexOf(id); return id[0] === 't' ? [34 * sg, id === 't1' ? -12 : 12] : id[0] === 'm' ? spiral([35.5 * sg, 0], i, 1.5) : spiral([25 * sg, 0], i, 5); };

  // ---- where each raider's job wants them (the bots, the autopilot and your hint arrow all follow this) ----
  // (the eggs about to land, and the nearest spot out of all their circles from c, toward goal: one rule for the bots, the autopilot and your arrow)
  const landing = (t) => G.eggs.filter((q) => q.state === 'air' && q.land - t <= 3);
  const clearOf = (LE, c, goal) => { const inE = (p, r) => LE.some((q) => pgDist(p, [q.x, q.y]) < r); let best = null, bs = 1e9; for (const rr of [1, 2, 3.5, 5, 6.5, 8, 10, 13]) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, p = [c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr]; if (!PG_UL.onPlat(p[0], p[1]) || inE(p, 5.8)) continue; const s = rr + 0.4 * pgDist(p, goal); if (s < bs) { bs = s; best = p; } } return best; };
  const job = (id, t) => { sync(); const b0 = id === A.me ? { x: G.x, y: G.y } : G.bots[id], sp = id === A.me ? 7 : 9.8, e = G.eggs.find((q) => q.id === id && q.state !== 'gone'), ns = nextSoak(id, t); let T0, fast = false, ob = null, why = 'wait', busy = false;
    if (t >= T.gather) { why = 'end'; T0 = spiral(pgIntGather(), GDZ_RAID.indexOf(id), P.SPREAD); ob = t < T.shatter ? { at: T.shatter, p: pgIntGather(), r: P.SPREAD } : null; fast = pgDist([b0.x, b0.y], T0) > 6; /* (the coils done: everyone to the diamond line for the Shattering) */
      // (the melee and tanks to the nearest Rawling first, until her bubbles show; the ranged and healers reach them from the line)
      if ((id[0] === 'm' || id[0] === 't') && t < T.bubbles) { const ra = G.adds.filter((a) => a.kind === 'rawling').sort((a, b) => pgDist([b0.x, b0.y], [a.x, a.y]) - pgDist([b0.x, b0.y], [b.x, b.y]))[0]; if (ra) { const d = pgDist([b0.x, b0.y], [ra.x, ra.y]) || 1; T0 = d > 3 ? [ra.x + (b0.x - ra.x) / d * 2.5, ra.y + (b0.y - ra.y) / d * 2.5] : [b0.x, b0.y]; fast = d > 6; why = 'raw';
          // (with your egg left on the floor, a spot where you stand, so practice.js's arrow doesn't fall back to the egg (the release sweep, Nov 16: it
          // pointed at it from 5:55, though your soaks were done). Your own arrow: arrowOb below)
          ob = id === A.me && e && e.state === 'floor' ? { at: T.bubbles, p: [b0.x, b0.y], r: 0 } : null; } } }
    else { const soakNow = !!ns && called(t), eggGo = eggFirst(id, t, b0, e, ns), dE = e ? pgDist([b0.x, b0.y], [e.x, e.y]) : 0; void sp;
      if (eggGo) { why = 'egg'; busy = G.eggs.some((q) => q !== e && q.state === 'held' && q.who && q.who !== id && pgDist(pos(q.who), [e.x, e.y]) < 4.6); /* (another carrier by it: wait a step off, so the two rings never touch) */
        T0 = t >= e.shell - 0.3 && !busy ? [e.x, e.y] : [e.x + (e.x > 0 ? 1 : -1) * 3.2, e.y + 1.5]; fast = dE > 6; ob = { at: e.shell, p: [e.x, e.y], r: 1 }; }
      else if (soakNow) { why = 'soak'; T0 = slotIn(ns, id); fast = pgDist([b0.x, b0.y], T0) > 4; ob = { at: ns.at, p: [ns.x, ns.y], r: P.R - 3 }; }
      else if (!ns && called(t)) { why = 'done'; T0 = spiral(pgIntGather(), GDZ_RAID.indexOf(id), P.SPREAD); ob = { at: T.shatter, p: pgIntGather(), r: P.SPREAD }; } /* (your soaks done: on toward the diamond line, round the other teams' circles) */
      else { T0 = preSpot(id); fast = pgDist([b0.x, b0.y], T0) > 10; } }
    // (two carriers' rings never touch: practice.js pushes carriers apart as they walk, and check() below holds a pickup back while another carrier
    // stands by. A berth pushed straight out round other eggs left carriers stuck on its edge, off their soak (the review, Nov 15): gone)
    // (out of a falling egg's 4 yards before it lands)
    // (all the landing eggs at once: two 8 yards apart trapped a tank between them when it stepped out of one into the other, Nov 15)
    { const LE = landing(t), inE = (p, r) => LE.some((q) => pgDist(p, [q.x, q.y]) < r);
      if (LE.length) { if (inE(T0, 5.5)) T0 = clearOf(LE, T0, T0) || T0; const soon = LE.filter((q) => q.land - t < 1.8); if (soon.some((q) => pgDist([b0.x, b0.y], [q.x, q.y]) < 5.3)) { T0 = clearOf(LE, [b0.x, b0.y], T0) || T0; fast = true; } } }
    // (another team's coil about to slam: never inside it (Soul Constrictor would keep you out of your own next one))
    S.soaks.forEach((s) => { if (s.group.includes(id) || t < s.t0 || t > s.at) return; const out = (p) => { const d = pgDist(p, [s.x, s.y]); if (d > s.r + 1.5) return p; const a = d > 0.1 ? Math.atan2(p[1] - s.y, p[0] - s.x) : Math.atan2(-s.y, -s.x); return [s.x + Math.cos(a) * (s.r + 2.2), s.y + Math.sin(a) * (s.r + 2.2)]; };
      T0 = out(T0); if (s.at - t < 1.6 && pgDist([b0.x, b0.y], [s.x, s.y]) <= s.r + 1) { T0 = out([b0.x, b0.y]); fast = true; } });
    // (after the Shattering the lines through the middle are venom)
    if (t >= T.shatter && pgIntCrack(T0[0], T0[1], 1)) T0 = [Math.abs(T0[0]) <= P.CRACK + 1 ? (T0[0] < 0 ? -1 : 1) * (P.CRACK + 2) : T0[0], Math.abs(T0[1]) <= P.CRACK + 1 ? (T0[1] < 0 ? -1 : 1) * (P.CRACK + 2) : T0[1]];
    if (!PG_UL.onPlat(T0[0], T0[1])) T0 = PG_UL.inward(T0);
    // (your arrow, when you play it yourself: practice.js's hintNow points at ob.p and hides within 2.5 yards of it. The bots and the autopilot keep the ob
    // above, which their dodging reads)
    return { T: T0, fast, ob: id === A.me && !window.__pgAuto ? arrowOb(t, T0, why, e, ns, busy) : ob }; };
  // ---- your arrow (the prompts audit, Nov 16, Flex: "the alerts and training wheels could be better in terms of the on screen prompts", then "All 10") ----
  // It follows the job line: it shows from the moment the line names a place (your egg's gold circle from 5:18, not from its landing; your team's spot
  // while you wait; your Rawling, for a melee), points at YOUR spot, and goes away only once you're inside the circle the game counts: your soak's 10
  // yards (it said "Go here · 5 yd" for up to 26 s while the line said "stay inside"), the gold ring's 4, your egg's 2.8 pickup. Out of a falling egg
  // first. It bends round anything it would walk you through: another team's coil before it slams, another carrier's 3-yard ring, a landing egg.
  // `here`: no arrow (practice.js draws none for a spot where you stand; null would point it at your egg)
  const arrowOb = (t, T0, why, e, ns, busy) => { if (t >= T.shatter) return null; const me = A.me, p0 = [G.x, G.y], here = { at: t + 1, p: p0, r: 0 }, g = teamOf(me);
    const LE = landing(t), inE = (p, r) => LE.some((q) => pgDist(p, [q.x, q.y]) < r); let p = null, at = t + 1, r = 2.5;
    /* (the review, Nov 16: inside another team's live coil, bend() skips it, so the arrow ran on through its middle while the line said to step out: out
       first, at least 3 yards, to beyond its edge) */
    const oc = S.soaks.find((s) => !s.group.includes(me) && t >= s.t0 - 0.5 && t <= s.at + 0.2 && pgDist(p0, [s.x, s.y]) < s.r + 1);
    if (oc && !inE(p0, 4 + 0.7)) { const d = pgDist(p0, [oc.x, oc.y]) || 0.01, k = Math.max(oc.r + 2.2, d + 3); a0 = Math.atan2(p0[1] - oc.y, p0[0] - oc.x);
      for (const n of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6]) { const a = a0 + n * Math.PI / 6, q = [oc.x + Math.cos(a) * k, oc.y + Math.sin(a) * k]; if (PG_UL.onPlat(q[0], q[1])) { p = q; break; } } /* (straight out, or round its edge when that is off the stone) */
      return { at: oc.at, p: p || T0, r: 0.5, via: p || T0 }; }
    if (inE(p0, 4 + 0.7)) { p = clearOf(LE, p0, T0) || T0; const d = pgDist(p0, p); if (d < 3) p = [p0[0] + (p[0] - p0[0]) / (d || 1) * 3, p0[1] + (p[1] - p0[1]) / (d || 1) * 3]; } /* (in a falling egg's circle: out first, a few steps, so the arrow doesn't vanish on its edge) */
    else if (why === 'raw') { p = T0; at = T.bubbles; } /* (beside your Rawling, as it crawls: an arrow that stopped at 5 yards lost it at every step) */
    else if (why === 'end' || why === 'done') { const ga = pgIntGather(), blk = S.soaks.some((s) => !s.group.includes(me) && t >= s.t0 - 0.5 && t <= s.at && pgDist(ga, [s.x, s.y]) <= s.r + 1); /* (the ring inside another team's live coil (pattern 2's sixth): where job() holds you, out of it) */
      if (!blk && pgDist(p0, ga) <= P.SPREAD) return here; p = blk ? T0 : ga; at = T.shatter; r = P.SPREAD; }
    else if (why === 'soak') { if (pgDist(p0, [ns.x, ns.y]) <= ns.r - 1) return here; p = slotIn(ns, me); at = ns.at; r = ns.r - 1; }
    else if (why === 'egg') { p = busy ? T0 : [e.x, e.y]; at = e.shell; }
    else if (e && e.state === 'air') { const ok = (q) => PG_UL.onPlat(q[0], q[1]) && pgDist(q, [e.x, e.y]) >= 4.8 && !G.eggs.some((o) => o !== e && o.state === 'air' && pgDist(q, [o.x, o.y]) < 5.6);
      if (ok(p0) && pgDist(p0, [e.x, e.y]) <= 8) return here; /* (beside your egg's gold circle, out of every landing one: there) */
      const d = pgDist(p0, [e.x, e.y]), a0 = d > 0.1 ? Math.atan2(p0[1] - e.y, p0[0] - e.x) : 0; for (const k of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6]) { const a = a0 + k * Math.PI / 6, q = [e.x + Math.cos(a) * 5.8, e.y + Math.sin(a) * 5.8]; if (ok(q)) { p = q; break; } }
      p = p || T0; at = e.land; }
    else { if (pgDist(p0, T0) <= 2.5 || (!(e && e.state === 'held') && pgDist(p0, S.pre[g]) <= 4.5)) return here; p = T0; } /* (your team's spot while you wait: inside the ring drawn there; a carrier on its own spot, clear of the others') */
    void r; return { at, p, r: 0.5, via: bend(t, p0, p) }; }; /* (p your spot, via the next waypoint round what's in the way: practice.js points the arrow at via and adds no bend of its own. r 0.5: this part says "here" itself (the returns above), so the shared arrow mustn't vanish at its own radius round a waypoint; merge of the four parts' audits, Nov 16) */
  // (the arrow's way round: the first thing on the straight line from you to p that it must not walk you through, and a point on a circle round it a step
  // ahead of you toward p (at most 43 degrees round, so the line from you to it stays clear); the other way round if that point is off the stone)
  const bend = (t, p0, p) => { const me = A.me, held = G.eggs.some((q) => q.state === 'held' && q.who === me), O = [];
    S.soaks.forEach((s) => { if (!s.group.includes(me) && t >= s.t0 - 0.5 && t <= s.at + 0.2) O.push([s.x, s.y, s.r + 1]); });
    if (held) G.eggs.forEach((q) => { if (q.state === 'held' && q.who && q.who !== me && G.bots[q.who]) O.push([G.bots[q.who].x, G.bots[q.who].y, 3 + 1]); });
    G.eggs.forEach((q) => { if (q.state === 'air' && q.land - t <= 6) O.push([q.x, q.y, 4 + 1, 1]); }); /* (the eggs about to land, from before their circles show: walking through one's spot left you in it as it showed) */
    const dx = p[0] - p0[0], dy = p[1] - p0[1], L2 = dx * dx + dy * dy; if (L2 < 1) return p; let hit = null, hu = 2;
    O.forEach(([cx, cy, R0, egg]) => { const d0 = pgDist(p0, [cx, cy]), R = egg && d0 < R0 ? Math.max(4.2, d0 - 0.15) : R0; /* (the review, Nov 16: 4.85 yards from a landing egg, inside its 5, it was skipped and the arrow crossed its 4-yard impact: the circle shrinks to just inside you, so the arrow still goes round the impact) */
      if (pgDist(p, [cx, cy]) < R || d0 < R) return; const u = Math.max(0, Math.min(1, ((cx - p0[0]) * dx + (cy - p0[1]) * dy) / L2)); if (pgDist([p0[0] + dx * u, p0[1] + dy * u], [cx, cy]) < R && u < hu) { hu = u; hit = [cx, cy, R]; } });
    if (!hit) return p; const [cx, cy, R] = hit, a0 = Math.atan2(p0[1] - cy, p0[0] - cx), a1 = Math.atan2(p[1] - cy, p[0] - cx), da = ((a1 - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    if (Math.abs(da) < 0.3) return p; const rr = R + 1, st = Math.min(Math.abs(da), 0.75);
    for (const sg of [Math.sign(da), -Math.sign(da)]) { const a = a0 + sg * st, q = [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; if (PG_UL.onPlat(q[0], q[1])) return q; }
    return p; };
  const home = (id) => { sync(); return homeAt(id); };
  const slow = () => 1;

  // ---- a new run ----
  const init = (G0) => { setup(); G = G0; S = A.S; G.t = T.start; G.wipes = 0; G.bossHp = bossHp(T.start); G.done.add('left0'); /* (practice.js's "never picked up your egg" is phase 1's timing: this part has its own) */
    G.done.add('boil'); /* (nor is a Rawling boiling your mistake here: the raid only starts on them at 5:50.4 and you at 5:55, so one could boil at 6:03 while you pressed 1 all along. Your part is the Rawling moment's score (the release sweep, Nov 16)) */
    G.int = { once: new Set(), kb: {}, shat: false, soakN: [], fell: [] }; };
  const bossHp = () => 44; /* (she is under the venom: no damage until she comes up as it shatters (measured)) */

  // ---- what happens each step: the slams on everyone, the defensive, your egg, the Shattering ----
  const check = (t0, t) => { sync(); const cr = (at) => at > t0 && at <= t, me = A.me, x = G.x, y = G.y, dt = t - t0;
    // (every slam hits the whole raid, the fewer in its circle the harder: practice.js does that (slamHit); here only the count, for the audit)
    S.soaks.forEach((s) => { if (!cr(s.at)) return; const inn = pgDist([x, y], [s.x, s.y]) <= s.r; G.int.soakN.push([s.k, GDZ_RAID.filter((id) => id !== me && pgDist(pos(id), [s.x, s.y]) <= s.r).length + (inn ? 1 : 0)]); });
    // the Rawlings from the broken eggs stay until killed (practice.js), but the raid only starts on them at the 6th slam (measured: the first die about
    // 5:52 to 5:57, the last by 6:12, a median 21 s after they hatch), so practice.js's helpers wait till then: its clock for them (born) is held back to
    // 5:50.4, then set to when each hatched. They still boil 25 s after they hatched, as 16% of the kills' Rawlings did.
    const RAW0 = T.slams[5], cx = GDZ_RAID.reduce((s0, id) => s0 + pos(id)[0], 0) / GDZ_RAID.length, cy = GDZ_RAID.reduce((s0, id) => s0 + pos(id)[1], 0) / GDZ_RAID.length;
    G.adds.forEach((a) => { if (a.kind !== 'rawling') return; if (a.born != null && a.hatch == null) { a.hatch = a.born; if (t < RAW0) delete a.born; } if (a.born == null && t >= RAW0) a.born = a.hatch != null ? a.hatch : t;
      // (and they crawl after the raid, toward its middle, stopping round it: slowly while the coils come, faster after; while she's coming up, never
      // into her burst or onto a crack, so nobody chases them there)
      if (a.o == null) a.o = ((a.x * 1.7 + a.y * 0.9) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      { let tq = [cx + Math.cos(a.o) * 4.5, cy + Math.sin(a.o) * 4.5]; if (t >= T.bubbles - 3) { const gq = pgIntGather(); tq = [gq[0] + Math.cos(a.o) * 6, gq[1] + Math.sin(a.o) * 3]; }
        const d = pgDist([a.x, a.y], tq), st = (t >= T.gather ? 5 : 3) * dt; if (d > st) { a.x += (tq[0] - a.x) / d * st; a.y += (tq[1] - a.y) / d * st; } } });
    // (the Rawlings alive now, kept for ff below: practice.js's skip ahead clears the adds, so a 5:45 start had only the last few left, dead about 2 s
    // into the moment (the release sweep, Nov 16))
    G.int.raws = G.adds.filter((a) => a.kind === 'rawling');
    // (a melee's Rawling moment opens once you could have reached one: from where you stand as the coils end, at your 7 yards a second, to your reach
    // (5 yards plus the Rawling's 1.1), or as soon as one is in reach. The release sweep, Nov 16: a melee whose last soak was across the room was scored
    // from 5:55 on Rawlings 20 yards away; the ranged and healers reach them from anywhere)
    { const RT = T.slams[7] + 0.5, RL = G.adds.filter((a) => a.kind === 'rawling'), near = RL.length ? Math.min(...RL.map((a) => pgDist([x, y], [a.x, a.y]))) : 1e9;
      if (cr(RT)) G.int.rawAt = me[0] === 'm' && RL.length ? RT + Math.max(0, (near - 6.1) / 7) : RT;
      else if (G.int.rawAt != null && t < G.int.rawAt && near <= 6.1) G.int.rawAt = t; }
    // your defensive for the back-to-back slams (the guide: "personals around 5:50"; the autopilot, a careful player, presses it)
    if (window.__pgAuto && cr(T.defCue) && t - G.def >= 90) { G.def = t; A.deb('def', 8); }
    // (the call at the cue says "Press Q" only while your Q can be pressed for these slams and you haven't yet: pressed already, or still cooling down,
    // it's a plain warning of the four slams (the prompts audit, Nov 16: the call never named Q; a "Press Q now" with Q cooling down would be false))
    // (the pattern call, as it fires: a carrier with its egg still to break is told to get it first, as the job line says (the review, Nov 16: the gold
    // call sent a Purple carrier to Triangle while the line said "Break your egg"))
    if (t < S.soaks[0].cast && S.job.team[me]) { const w = S.warns.find((q) => q.t === S.soaks[0].cast && /^Spectral Coils:/.test(q.text)), f = S.soaks.find((s) => s.group.includes(me)), e0 = G.eggs.find((q) => q.id === me && q.state !== 'gone');
      if (w && f) w.text = 'Spectral Coils: ' + (eggFirst(me, S.soaks[0].cast, { x, y }, e0, f) ? 'Get your egg, then your soak at ' : 'Go to your soak at ') + pgIntMk(f.spot) + '! ' + P.PN[S.pat] + ' first (pattern ' + S.pat + ').'; }
    if (t < T.defCue && S.job.team[me]) { const w = S.warns.find((q) => q.t === T.defCue && /^Back-to-back slams:/.test(q.text)); if (w) { const off = G.def >= T.defFrom - 1 || G.def + 90 > T.defCue; w.text = off ? 'Back-to-back slams: Four slams in a row now!' : 'Back-to-back slams: Press Q (your defensive) now!'; w.me = off ? 0 : 1; } }
    // (pressed early in the part, Q is still cooling down for these slams: the mistake says so (the release sweep, Nov 16))
    if (cr(T.defBy) && !(G.def >= T.defFrom - 1 && G.def <= T.defBy) && once('def')) { const early = G.def > 0 && G.def < T.defFrom - 1 && G.def + 90 > T.defFrom - 1;
      A.mistake('def', 'No defensive for the last four slams.' + (early ? ' You pressed Q too early: it was still cooling down.' : ''), early ? 'Save Q for the back-to-back slams: it takes a minute and a half to come back. The last four slams come back to back and each hits the whole raid.' : 'Press Q as the last four slams start: they come back to back and each hits the whole raid. Defensives and potions there.', 0); }
    // (a bot whose soak kept it from its egg walks to it after: practice.js would hand it over from afar 6 s after its shell breaks, next to another carrier)
    G.eggs.forEach((q) => { if (q.state === 'floor' && q.id !== me && t > q.shell + 5.5 && G.bots[q.id] && pgDist(pos(q.id), [q.x, q.y]) > 2.5) q.shell = t - 5.5; });
    // (nor does a bot pick its egg up with another carrier beside it: it waits a moment, so their 3-yard rings never touch)
    { const hold = G.eggs.filter((q) => q.state === 'held' && q.who).map((q) => pos(q.who)); G.eggs.forEach((q) => { if (q.state !== 'floor' || q.id === me || !G.bots[q.id] || t < q.shell) return; const p = pos(q.id); if (pgDist(p, [q.x, q.y]) < 3 && hold.some((h) => pgDist(h, p) < 3.8)) q.shell = t + 0.2; }); }
    // your egg: into one of your soaks by your last one (one mistake or the other, never both: the review, Nov 15). The rule the hint follows
    // (eggFirst) may skip a soak to fetch it first or after; your last soak is the deadline either way
    const e = G.eggs.find((q) => q.id === me), last = S.soaks.filter((s) => s.group.includes(me)).pop();
    if (e && last && cr(last.at + 0.3) && e.state === 'floor' && once('eggleft')) A.mistake('egg', 'Your egg never went into a soak: you didn\'t pick it up.', 'Your egg is the gold one: pick it up once its shell breaks, then carry it into your next soak.', 0);
    if (cr(T.slams[7] + 0.2) && e && e.state === 'held' && e.who === me && !G.int.once.has('eggleft') && once('eggkept')) A.mistake('egg', 'Your egg was still in your hands after the last slam.', 'Carry your egg into your own soak: the slam breaks it (and leaves a Rawling to kill).', 0);
    // (an egg in the venom hatches a Viper (the guide's rule; practice.js does it off the edge): on a crack as it shatters, or carried into one after)
    const vip = (px, py, mineE, why, tip) => { G.vipers++; G.adds.push({ kind: 'viper', x: px + 1.2, y: py - 1, born: t }); A.deb('putrid', 20, true); if (mineE) A.mistake('viper', why + ': a Viper hatched (Putrid Membrane on the whole raid).', tip, 8); };
    // the Shattering: she comes up at one quarter's outer corner, the platform breaks into four along the lines through the middle, and everyone is
    // knocked out 6 yards from the middle
    // (your egg left on the floor was already "never went into a soak": its Viper still hatches, but it isn't a second mistake (the release sweep, Nov 16))
    if (cr(T.shatter)) { G.int.shat = true; G.eggs.forEach((q) => { if (q.state === 'floor' || q.state === 'air') { if (q.state === 'floor' && pgIntCrack(q.x, q.y)) { const left = q.id === me && G.int.once.has('eggleft'); vip(q.x, q.y, q.id === me && !left, 'Your egg was on a crack as the platform shattered', 'Pick your egg up and break it in a soak before the platform shatters.'); if (left) A.say('Your egg was on a crack as the platform shattered: a Viper hatched.', true); } q.state = 'gone'; } });
      GDZ_RAID.forEach((id) => { if (id === me) return; const p = pos(id), q = pgIntKb(p); G.int.kb[id] = { t0: t, x0: p[0], y0: p[1], x1: q[0], y1: q[1] }; G.int.fell.push([id, p.slice(), q]); });
      const q = pgIntKb([x, y]), onC = pgIntCrack(x, y), off = !PG_UL.onPlat(q[0], q[1]) || pgIntCrack(q[0], q[1]), held = G.eggs.find((z) => z.who === me && z.state === 'held');
      G.kb = { t0: t, x0: x, y0: y, x1: q[0], y1: q[1] }; A.hurt(28); A.deb('fall', 1.5); /* (Falling: about 380k on landing, a third of a raider's health (the Nov 15 audit, engine.js)) */ G.done.add('venom' + Math.floor(t / 10)); G.done.add('venom' + Math.floor((t + 5) / 10));
      if (onC) { A.mistake('shatter', 'You stood on a crack as the platform shattered, and fell into the venom.', 'It breaks along the lines through the middle (north to south, east to west): stand inside a quarter, on the gold ring by the Diamond.', 25); A.deb('dvenom', 12); }
      else if (off) { A.mistake('shatter', 'The knockback threw you into the venom: you stood too close to the edge.', 'Stand on the inside, not at the edge: the burst knocks everyone about 6 yards out from the middle.', 25); A.deb('dvenom', 12); }
      else A.say('You rode out the Shattering on the stone.');
      if (held && (onC || off)) { held.state = 'gone'; held.who = null; vip(q[0], q[1], true, 'Your egg went into the venom with you', 'Carried eggs hatch in the venom: break yours in a soak before the Shattering.'); } }
    Object.entries(G.int.kb).forEach(([id, k]) => { const f = Math.min(1, (t - k.t0) / 0.55), b = G.bots[id]; if (b) { b.x = k.x0 + (k.x1 - k.x0) * f; b.y = k.y0 + (k.y1 - k.y0) * f; } if (f >= 1) delete G.int.kb[id]; });
    // (a crack after the Shattering is venom: it hurts until you're back on the stone (off the stone, practice.js's own venom does it: not twice))
    if (G.int.shat && !G.kb && pgIntCrack(x, y) && PG_UL.onPlat(x, y)) { G.hp -= 10 * dt * (A.has('def') ? 0.5 : 1); if (!A.has('dvenom')) A.deb('dvenom', 6); const h2 = G.eggs.find((z) => z.who === me && z.state === 'held'); if (h2) { h2.state = 'gone'; h2.who = null; vip(x, y, true, 'You carried your egg into a crack', 'The cracks are venom after the Shattering: it hatches eggs.'); } }
    if (A.has('dvenom')) G.hp -= 2.5 * dt * (A.has('def') ? 0.5 : 1); };
  const kick = () => A.say('Nothing to kick in the intermission.', true);

  // ---- the screen: your job now, what's next ----
  const mkAt = (s) => pgIntMk(s.spot);
  // (the job line (the prompts audit, Nov 16; Flex then: "i feel like the game confuses people saying timestamps"): one order about you, verb first, in
  // plain words, never a clock time or a second count (the boss-mod bars and cast bars count). The first that applies: a dodge (an egg landing on you,
  // another team's coil with you in it, another carrier's ring, the cracks and the edge), then your step due or the walk to it (your egg, your soak, the
  // gold ring), then the right target, then where to wait. Q comes after the move line, never instead of it ("Press Q now: personals" replaced "head for
  // the diamond line" from 5:51). In your soak, "Then: ..." names your next one (the long runs to it came with 2.3 s to spare, unannounced)
  const RING = 'the gold ring by the Diamond';
  const qDue = (t) => t >= T.defCue && t <= T.defBy && !(G.def >= T.defFrom - 1), qNow = (t) => qDue(t) && t - G.def >= 90;
  const dodgeLine = (t) => { const me = A.me, p0 = [G.x, G.y];
    const fe = G.eggs.find((q) => q.state === 'air' && q.land - t <= 2.5 && pgDist(p0, [q.x, q.y]) < 4 + 0.7); /* (its 4 yards, with room to spare; from 2.5 s, when practice3d.js draws its circle) */
    if (fe) return fe.id === me ? 'Step out of your egg\'s circle: it lands there!' : 'Step out of the white circle: an egg is landing on you!';
    const oc = S.soaks.find((s) => !s.group.includes(me) && t >= s.t0 && t <= s.at && pgDist(p0, [s.x, s.y]) < s.r + 1); /* (r + 1, as the arrow's way round sees it) */
    if (oc) return 'Step out of the ' + P.TN[oc.team] + ' soak: it isn\'t yours!';
    if (G.eggs.some((q) => q.state === 'held' && q.who === me)) { let nb = null, dm = 4.5; G.eggs.forEach((q) => { if (q.state === 'held' && q.who && q.who !== me && G.bots[q.who]) { const d = pgDist(p0, [G.bots[q.who].x, G.bots[q.who].y]); if (d < dm) { dm = d; nb = q.who; } } });
      if (nb) return 'Step away from ' + A.nm(nb) + '\'s egg: your rings almost touch!'; } /* (practice.js's own "Too close" line never ran here: the part's job line comes first) */
    if (t >= T.bubbles && t < T.shatter) { if (pgIntCrack(G.x, G.y)) return 'Step off the crack: the floor breaks along it!'; const kq = pgIntKb(p0); if (!PG_UL.onPlat(kq[0], kq[1])) return 'Step in from the edge: the burst throws you off!'; if (pgIntCrack(kq[0], kq[1])) return 'Step away from the crack: the burst throws you onto it!'; }
    return null; };
  const jobText = () => { sync(); const t = G.t, me = A.me, g = teamOf(me), e = G.eggs.find((q) => q.id === me && q.state !== 'gone'), ns = nextSoak(me, t), held = !!e && e.state === 'held', mel = /^[mt]/.test(me);
    if (G.int.shat) { if (t < T.shatter + 0.7) return ''; if (!PG_UL.onPlat(G.x, G.y)) return 'Get back onto the stone: you\'re in the venom.'; if (pgIntCrack(G.x, G.y)) return 'Step out of the crack: it\'s venom now.';
      return 'She\'s up ' + pgIntCorner(S.q1) + ': phase 3 starts by her.' + (G.log.some((m) => m.kind === 'shatter') ? '' : ' Well done.'); }
    const dz = dodgeLine(t); if (dz) return dz;
    // (Q pressed earlier in the part is still cooling down: say so, never "Press Q now" (the release sweep, Nov 16))
    const q = qDue(t) ? (qNow(t) ? ' Press Q (defensive) now.' : ' Your Q is still cooling down.') : '';
    if (t >= T.gather) { const onR = pgDist([G.x, G.y], pgIntGather()) <= P.SPREAD, raw = t < T.bubbles && G.adds.some((a) => a.kind === 'rawling'), off = !!(A.dpsHint && A.dpsHint());
      // (the melee and tanks go to the Rawlings, then the gold ring; the ranged and healers the reverse, hitting them from the ring: the line said "Kill the
      // Rawlings, then go to the diamond line" to them too, against the game's own plan)
      if (raw && mel) { const near = Math.min(...G.adds.filter((a) => a.kind === 'rawling').map((a) => pgDist([G.x, G.y], [a.x, a.y])));
        return (near > 6 ? 'Run to the Rawlings and kill them.' : off ? 'Kill the Rawlings: Tab, then 1.' : 'Keep hitting the Rawlings.') + ' Then: go to ' + RING + '.'; }
      if (!onR) return 'Go to ' + RING + (t >= T.bubbles ? ' now: the floor breaks soon.' : '.' + (raw ? ' Hit the Rawlings from there.' : ''));
      return raw ? (off ? 'Kill the Rawlings from here: Tab, then 1.' : 'Good spot. Keep hitting the Rawlings.') : 'Good spot. Stay here.'; }
    if (e && e.state === 'air') return 'Run to your egg\'s gold circle. Stand beside it, not under it.';
    if (t < T.land + 0.5 && !e) return pgDist([G.x, G.y], S.pre[g]) <= 4.5 ? 'Wait by ' + P.TM[g] + ' with your team.' : 'Go to your team\'s spot by ' + P.TM[g] + '.';
    if (eggFirst(me, t, { x: G.x, y: G.y }, e, ns)) { const far = pgDist([G.x, G.y], [e.x, e.y]) > 4.5;
      return (e.shp > 0 ? (mel && far ? 'Run to your egg, then break it: Tab, then 1.' : 'Break your egg: Tab, then 1. Then: walk over it.') : t < e.shell ? 'Wait by your egg: its shell is breaking.' : 'Pick up your egg: walk over it.') + q; }
    if (ns && called(t)) { const d = pgDist([G.x, G.y], [ns.x, ns.y]), mk = mkAt(ns), nx = S.soaks.find((s) => s.group.includes(me) && s.at > ns.at + 0.1);
      if (d > ns.r - 1) { const late = (d - (ns.r - 1)) / 7 > ns.at - t - 0.6; return 'Get into your soak at ' + mk + (late ? ': sprint (Shift)!' : '.') + (held ? ' Bring your egg.' : e && e.state === 'floor' ? ' Get your egg after it.' : '') + q; }
      return 'Stay in your soak at ' + mk + '.' + (q || (nx ? ' Then: run to ' + mkAt(nx) + (pgDist([ns.x, ns.y], [nx.x, nx.y]) > 28 ? ', across the room.' : '.') : ' Then: go to ' + RING + '.')); }
    if (!called(t)) return 'Wait by ' + P.TM[g] + (held ? '. Keep 3 yards from other carriers.' : ' with your team.'); /* (12 words at most: the gold call and your soak's ring say what's next) */
    if (e && e.state === 'floor') return 'Your soaks are done: leave your egg. Go to ' + RING + '.' + q; /* (no soak left to break it in: eggFirst) */
    return (pgDist([G.x, G.y], pgIntGather()) <= P.SPREAD ? 'Good spot. Stay on the gold ring.' : 'Go to ' + RING + ', round the other soaks.') + q; };
  // (the boss-mod bars: yours, named as the job line names them. No "Your egg opens": your egg's shell is up until you hit it open, so that bar jumped
  // 13, 10, 6, 2 as you hit while the line said to break it (the prompts audit, Nov 16). "coil" in the soak's name: its bar takes Spectral Coils' icon and
  // stands in for the raid's own coil bar at the same slam, one bar each)
  const upNext = (t) => { sync(); const me = A.me, L0 = [], add = (at, text, c) => { if (at > t && at - t <= 30) L0.push({ at, text, c }); }, e = G.eggs.find((q) => q.id === me && q.state !== 'gone');
    if (e && e.state === 'air') add(e.land, 'Your egg lands', '#f3c969'); /* ("egg" in the name: the boss-mod bar takes Call of the Serpent's icon, not Grasping Fangs' for "breaks") */
    if (!called(t)) add(S.soaks[0].cast, 'First coil rises', '#24f2cb'); else S.soaks.filter((s) => s.group.includes(me)).forEach((s) => add(s.at, 'Your coil soak at ' + mkAt(s), '#f3c969'));
    if (!(G.def >= T.defFrom - 1) && G.def + 90 <= T.defBy) add(T.defCue, 'Defensive (Q)', '#7fb8ff'); /* (not while Q can't be ready for it: the release sweep, Nov 16) */ add(T.shatter, 'The Shattering', '#ff8a5a');
    return L0.sort((a, b) => a.at - b.at).slice(0, 3); };
  // (Q's "now" moment: its button glows gold from the cue until you press it, while it can be pressed for these slams (the prompts audit, Nov 16))
  const acts = () => '', hud = (t) => { sync(); if (!G || !A.$) return; const b = A.$('.pg-act[data-a="def"]'); if (b && b.classList) b.classList.toggle('hot', qNow(t != null ? t : G.t)); };

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
    // (the start card in the order things happen, with no clock times (Flex, Nov 16: "i feel like the game confuses people saying timestamps"), and true:
    // your egg lands with its shell up and you hit it open; it said the shell "breaks between 5:31 and 5:40", the prompts audit, Nov 16)
    L0.push(['The eggs', 'Eight eggs drop all over the stone as it starts: step out of their circles.' + (pk.egg ? ' Yours is the gold one. It lands with a shell: hit it until it breaks, pick it up and carry it into your next soak, 3 yards from other carriers. The slam breaks it.' : ' Keep out of the egg carriers\' way.')]);
    L0.push(['Your team: ' + P.TN[g], 'Wait by ' + P.TM[g] + '. Your soaks: ' + [1, 2, 3].map((p) => P.PN[p] + ' first: ' + lst(soaksOf(g, p))).join('; ') + '.']);
    L0.push(['The coils', 'Eight slams, one after another from opposite sides. Be inside your team\'s 10-yard circle when it slams. Never step into another team\'s: Soul Constrictor then keeps you out of your own.']);
    L0.push(['Your defensive', 'The last four slams come back to back and each one hits the whole raid: press Q (defensive) as they start.']);
    L0.push(['The Shattering', 'At the end, her bubbles show at one quarter\'s outer corner: she comes up there as the platform breaks into four along the lines through the middle, with a knockback. Stand on the gold ring, just inside the Diamond marker: off the cracks, away from the middle and the edge.']);
    return '<ul class="pg-asg">' + L0.map(([a, b]) => '<li><b>' + esc(a) + '</b><span>' + esc(b) + '</span></li>').join('') + '</ul>'; };
  // (the start card's "Your job in short": four plain lines, your team and soaks, your egg, the defensive, the Shattering)
  const short = () => { const g = pk.team, L0 = [];
    L0.push(pk.pat ? P.TN[g] + ' team, pattern ' + pk.pat + ' (' + P.PN[pk.pat] + ' first): wait by ' + P.TM[g] + ', then soak ' + lst(soaksOf(g, pk.pat)) + '.' : P.TN[g] + ' team: wait by ' + P.TM[g] + '. The first coil sets the pattern; then your ' + (g === 'B' ? 2 : 3) + ' soaks light up in gold.');
    L0.push(pk.egg ? 'Carry an egg: it lands with a shell, so hit it until it breaks, pick it up and bring it into your next soak.' : 'No egg: step out of the falling eggs and keep out of the carriers\' way.');
    L0.push('Press Q as the last four slams start: they come back to back.');
    L0.push('Before the floor breaks, stand on the gold ring, just inside the Diamond marker: off the cracks, away from the middle and the edge.');
    return '<ul class="pg-short">' + L0.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'; };
  // (the one-screen setup (practice.js SETUP, Nov 15, Flex via Main: "still too complex and confusing"): your role, then your job, the team you soak
  // with and, for some, an egg: the guide's teams, so melee are Yellow or Blue, ranged Purple or Blue, healers any. The pattern is random each run,
  // as in the raid; one plain sentence)
  const SJ = {}; /* (filled below the maps' grpsOf and eggsOf, so the job list and the maps offer the same teams: Flex, Nov 16, a ranged on Yellow) */
  const jobNow = (j) => j.team + (j.egg ? 'e' : '');
  // ---- the spot maps (Flex, Nov 16: "visual maps that lets them select the spot ... use the plans maps so its something familiar", "Customizable, but
  // not crazy confusing"; practice.js's contract, SETUP.maps). The Plan's Intermission Positions map (its Groups page, UL_PAGES.trans[0]) twice:
  //   Your group: a ring for each team your role is on in the guide's plan, where the game has that team wait until the pattern is called (16 yards out
  //   by its marker: Yellow by Star, Purple by Diamond, Blue by Square; pgIntPre, the same rule the run uses), and you where the game stands you in it
  //   (pgIntPreAt: carriers on a ring 5 yards out, the rest round the middle). From there each team soaks its coils as the pattern lights them up.
  //   Your egg (melee and ranged): where each team's eggs land in the game (pgIntEggArea, the run's own rule), for the teams whose plan has your role carry
  //   one: Yellow for melee, Purple or Blue for ranged. Healers carry none.
  // Every role carries an egg where its team's plan has one (Flex: "each role should ideally be tested on as many mechanics as they are elgible to get");
  // No egg turns it off; the same buttons on both tabs (Flex: "clicking on your coil hides no egg"). The pattern stays random each run, as in the raid ----
  // (Flex, Nov 16, on the map: "theres no yellow group assignments", then "i forgot melee are in that group, but maybe leave it as an option for ranged just in
  // case groups do it that way": melee and healers keep the teams the plan has them on; a ranged may also take Yellow, with one of its eggs. The run swaps you
  // with someone in it (pgIntJobs), so the teams keep their size and their egg count)
  const planGrps = (r) => ['Y', 'P', 'B'].filter((g) => PG_INT.team[g].some((id) => id[0] === r));
  const planEggs = (r) => ['Y', 'P', 'B'].filter((g) => PG_INT.team[g].some((id) => id[0] === r && PG_INT.carry.includes(id)));
  const grpsOf = (r) => (r === 'r' ? ['Y', 'P', 'B'] : planGrps(r));
  const eggsOf = (r) => (r === 'r' ? ['Y', 'P', 'B'].filter((g) => g === 'Y' || planEggs(r).includes(g)) : planEggs(r));
  // (the job list behind the card (now/jobs/set): every team the maps offer, the plan's own first, each with its egg where you can carry one. It was a
  // fixed list, so a ranged's Yellow pick was put back to Purple on every redraw)
  ['m', 'r', 'h'].forEach((r) => { SJ[r] = []; const G = planGrps(r).concat(grpsOf(r).filter((g) => !planGrps(r).includes(g)));
    G.forEach((g) => { if (eggsOf(r).includes(g)) SJ[r].push([g + 'e', P.TN[g] + ' team, egg']); SJ[r].push([g, P.TN[g] + ' team']); }); });
  const put = (j) => { pk = { role: j.role, team: j.team, egg: !!j.egg && eggsOf(j.role).includes(j.team), pat: 0 }; save(); };
  const want = () => (eggsOf(pk.role).includes(pk.team) ? pk.egg : true); /* (an egg wherever you can carry one, unless you turned it off) */
  const ROOM = (x, y) => [340 + x * 2.083, 240 - (y + 0.9) * 2.083]; /* (room yards on the Plan's maps, as ulSvg draws them) */
  // (the Plan's own Groups page, with its group labels kept off the spots you click (its pick, told those spots are taken); on Your egg, each team's eggs
  // drawn on real landings from the game (pgIntEggArea's pts), as many as it carries)
  const mapPage = (key) => { const base = UL_PAGES.trans[0], H = MAPS.hot(key), OFF = [-1e5, -1e5, -1e5 + 1, -1e5 + 1];
    const near = (b) => H.some((h) => { const [cx, cy] = ROOM(h.x, h.y), rr = (h.r + (h.you ? 2.6 : 1)) * 2.083, nx = Math.max(b[0], Math.min(cx, b[2])), ny = Math.max(b[1], Math.min(cy, b[3])); return Math.hypot(nx - cx, ny - cy) < rr; });
    const pg = { t: key === 'egg' ? 'Where the eggs land' : base.t, s: base.s, vb: base.vb, draw: (D, g) => {
      if (key === 'egg') eggsOf(pk.role).forEach((gg) => pgIntEggArea(gg).pts.forEach((p) => g.egg(p[0], p[1])));
      base.draw(D, Object.assign({}, g, { pick: (C, box) => g.pick(C, (x, y) => { const b = box(x, y); return near(b) ? OFF : b; }) })); } };
    const D = { ez: { melee: [], left: [], right: [], far: [], backup: [] }, shields: [], teams: [[], []], ce: [[], []], cf: [[], []], trans: [[], [], []], side: { L: {}, R: {} } };
    return { svg: ulSvg(pg, D, new Map(), {}), vb: UL_VB[pg.vb] || UL_VB.mid }; };
  const nSoak = (g) => pgIntPat()[0].filter(([, x]) => x === g).length;
  const MAPS = { tab: 'grp',
    tabs: () => (eggsOf(pk.role).length ? [['grp', 'Your group'], ['egg', 'Your egg']] : [['grp', 'Your group']]),
    page: (key) => mapPage(key === 'egg' && eggsOf(pk.role).length ? 'egg' : 'grp'),
    hot: (key) => { if (key === 'egg') { const L = eggsOf(pk.role).map((g) => { const A = pgIntEggArea(g); return { id: g, x: A.c[0], y: A.c[1], r: A.r, big: true, on: pk.egg && pk.team === g, title: P.TN[g] + ' team: its eggs land in here. Carry one into your soak' }; });
        /* (You on one of your team's drawn eggs, a real landing, not on the circle's middle) */ const Y0 = pk.egg && eggsOf(pk.role).includes(pk.team) ? pgIntEggArea(pk.team).you : null;
        return Y0 ? L.concat([{ id: pk.team, x: Y0[0], y: Y0[1], r: 0.8, on: true, you: true, title: 'You: your egg lands in the ' + P.TN[pk.team] + ' circle, somewhere new each pull' }]) : L; }
      const me = slotOf(pk), yp = pgIntPreAt(pgIntJobs(me, pk), me);
      return grpsOf(pk.role).map((g) => { const c = pgIntPre(g); return { id: g, x: c[0], y: c[1], r: 6, on: pk.team === g, title: P.TN[g] + ' team: wait here by ' + P.TM[g] + ', then soak ' + nSoak(g) + ' of the 8 coils' }; })
        .concat([{ id: pk.team, x: yp[0], y: yp[1], r: 0.8, on: true, you: true, title: 'You: where the game stands you until the pattern is called' }]); },
    pick: (key, id) => { if (!/^[YPB]$/.test(id)) return; const egg = key === 'egg' && eggsOf(pk.role).length > 0; /* (the tab shown: a healer has no Your egg) */
      if (egg && eggsOf(pk.role).includes(id)) put({ ...pk, team: id, egg: true }); else if (!egg && grpsOf(pk.role).includes(id)) put({ ...pk, team: id, egg: want() }); },
    extras: () => (eggsOf(pk.role).length ? [['noegg', 'No egg', !pk.egg]] : []),
    extra: (id) => { if (id !== 'noegg' || !eggsOf(pk.role).length) return; if (pk.egg) put({ ...pk, egg: false }); else put({ ...pk, team: eggsOf(pk.role).includes(pk.team) ? pk.team : eggsOf(pk.role)[0], egg: true }); },
    random: () => { const L = grpsOf(pk.role); put({ ...pk, team: L[Math.floor(Math.random() * L.length)], egg: true }); }, /* (no plan yet: a team your role is on, with its egg if it has one) */
    role: (r) => { const L = grpsOf(r); if (!L.length) return; const w = want(); put({ role: r, team: L.includes(pk.team) ? pk.team : eggsOf(r)[0] || L[0], egg: w }); if (!eggsOf(r).length) MAPS.tab = 'grp'; },
    say: () => { const g = pk.team; return 'You wait by ' + P.TM[g] + ' with the ' + P.TN[g] + ' team' + (pk.egg ? ', carry an egg into your next soak' : '') + ' and soak ' + nSoak(g) + ' of the 8 coils as the pattern lights them up, then end by the Diamond marker before the floor breaks.'; },
    sub: () => P.TN[pk.team] + ' team' + (eggsOf(pk.role).length ? (pk.egg ? ' · egg' : ' · no egg') : '') };
  const setupCard = { roles: ['m', 'r', 'h'], maps: MAPS,
    now: () => { const r = pk.role; if (!SJ[r].some((x) => x[0] === jobNow(pk))) setupCard.set(r, SJ[r][0][0]); return { role: pk.role, job: jobNow(pk) }; },
    jobs: (r) => (SJ[r] || []).map((x) => x.slice()),
    set: (r, v) => { if (!SJ[r]) return; if (!SJ[r].some((x) => x[0] === v)) v = SJ[r][0][0]; pk = { role: r, team: v[0], egg: v.length > 1, pat: 0 }; save(); },
    say: () => { const g = pk.team; return 'You wait by ' + P.TM[g] + ' with the ' + P.TN[g] + ' team and soak your ' + (g === 'B' ? 2 : 3) + ' of the 8 coils as the pattern lights them up in gold' + (pk.egg ? ', carrying an egg into one' : '') + '. Press Q for the back-to-back slams, then end by the Diamond marker before the platform shatters. No kicks in this part.'; } };
  // (where to start, by what happens there, not by the clock: Flex, Nov 16, "i feel like the game confuses people saying timestamps")
  const starts = [[0, 'The eggs'], [330, 'The first coils'], [345, 'The back-to-back slams'], [356, 'The Shattering']];
  // ---- hitting the right thing: the Rawlings once the coils are done (the raid kills them then), any Viper at once ----
  const ADD_HP = { rawling: 3, viper: 5 };
  const tgts = () => { sync(); const L0 = []; if (!G) return L0; G.adds.forEach((a) => { a.id = a.id || 'a' + (G.addN = (G.addN || 0) + 1); const mx = ADD_HP[a.kind] || 3; if (a.hp == null) a.hp = mx; L0.push({ key: a.id, kind: a.kind, name: a.kind === 'viper' ? 'Blightscale Viper' : 'Blightscale Rawling', p: [a.x, a.y], r: a.kind === 'viper' ? 1.6 : 1.1, hp: a.hp, max: mx }); }); return L0; };
  const dpsCat = (t) => { sync(); if (!G) return null; if (G.adds.some((a) => a.kind === 'viper')) return 'viper'; return t >= T.slams[7] + 0.5 && t < T.bubbles && !(G.int && G.int.rawAt != null && t < G.int.rawAt) && G.adds.some((a) => a.kind === 'rawling') ? 'rawling' : null; }; /* (a melee's from when it could reach one: check() above) */ /* (till her bubbles show: then everyone holds the diamond line, as the hint says (the review, Nov 15)) */
  const dpsNames = (DL) => { const k = new Set(DL.map((m) => m.kind)); return ['rawling', 'viper'].filter((x) => k.has(x)).map((x) => ({ rawling: 'the Rawlings', viper: 'the Vipers' })[x]).join(', '); };

  // ---- the minimap: the platform, the markers, the soaks, the eggs, everyone ----
  const mini = (mx, Wm, Hm, t) => { sync(); const sc = Wm / 100, M = (x, y) => [Wm / 2 + x * sc, Hm / 2 - y * sc], dot = (x, y, r, c, st) => { const [a, b] = M(x, y); mx.beginPath(); mx.arc(a, b, r, 0, Math.PI * 2); if (c) { mx.fillStyle = c; mx.fill(); } if (st) { mx.strokeStyle = st; mx.lineWidth = 1.2; mx.stroke(); } };
    mx.clearRect(0, 0, Wm, Hm); mx.fillStyle = 'rgba(8,10,14,.82)'; mx.fillRect(0, 0, Wm, Hm); mx.fillStyle = 'rgba(120,140,110,.28)';
    const oct = [[36.5, 12.5], [15, 34], [-15, 34], [-36.5, 12.5], [-36.5, -12.5], [-15, -34], [15, -34], [36.5, -12.5]].map((q) => M(q[0], q[1])); mx.beginPath(); oct.forEach((q, i) => (i ? mx.lineTo(q[0], q[1]) : mx.moveTo(q[0], q[1]))); mx.closePath(); mx.fill();
    if (G.int && G.int.shat) { mx.fillStyle = 'rgba(40,90,30,.95)'; const a = M(-P.CRACK, 36), b = M(-37, P.CRACK); mx.fillRect(a[0], a[1], 2 * P.CRACK * sc, 72 * sc); mx.fillRect(b[0], b[1], 74 * sc, 2 * P.CRACK * sc); }
    Object.keys(PG_INT_MKA).forEach((k) => { const p = pgIntAt(PG_INT_MKA[k], 40), q = M(p[0], p[1]); pgIntMarkDraw(mx, pgIntMk(k), q[0], q[1], Math.max(4, Wm / 32), 'rgb(14,17,20)'); }); /* (the markers in their own shapes, as in the game) */
    const me = A.me, g = S.job.team[me];
    S.soaks.forEach((s) => { if (t > s.at + 0.4) return; const yours = s.group.includes(me); if (t >= s.t0) dot(s.x, s.y, s.r * sc, yours ? 'rgba(243,201,105,.25)' : 'rgba(36,242,203,.18)', yours ? '#f3c969' : '#24f2cb'); else if (yours && called(t)) dot(s.x, s.y, s.r * sc, null, 'rgba(243,201,105,.55)'); });
    if (!called(t)) { const p = S.pre[g]; dot(p[0], p[1], 3, null, P.TC[g]); }
    if (t >= T.gather - 1 && t < T.shatter + 1) { const p = pgIntGather(); dot(p[0], p[1], P.SPREAD * sc, 'rgba(243,201,105,.25)', '#f3c969'); }
    G.eggs.forEach((e) => { if (e.state === 'floor' || e.state === 'air') dot(e.x, e.y, 1.4, e.id === me ? '#f3c969' : '#e9e2c6'); });
    G.adds.forEach((a) => dot(a.x, a.y, 1.3, a.kind === 'viper' ? '#ff3b3b' : '#a7c46b'));
    if (t < T.callL + 0.6) dot(S.her[0], S.her[1], 3.4, '#2f6a22', '#b6f23a'); else if (t >= T.shatter) dot(S.dive.to[0], S.dive.to[1], 4, '#2f6a22', '#b6f23a'); else if (t >= T.bubbles) dot(S.dive.to[0], S.dive.to[1], 3, null, '#7fd8ff');
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
      if (cr(T.shatter)) { const q = pgIntKb(p); if (pgIntCrack(p[0], p[1])) add('on a crack at the Shattering', id, t); else if (!PG_UL.onPlat(q[0], q[1]) || pgIntCrack(q[0], q[1])) add('thrown into the venom at the Shattering', id, t); }
      if (t > T.shatter + 0.6 && pgIntCrack(p[0], p[1]) && !G.int.kb[id]) add('in a crack after the Shattering', id, t); });
    if (cr(T.gather)) G.eggs.forEach((e) => { if (e.state !== 'gone') add('egg not broken by the last slam', e.id || '?', t); });
    G.int.soakN.splice(0).forEach(([k, n]) => { if (n < 5) add('slam ' + (k + 1) + ' had only ' + n + ' soakers', 'raid', t); }); };

  // ---- 3D: the shapes for this part (practice3d.js's pg3dShapes adds them to the list it draws) ----
  const cl = (v) => Math.max(0, Math.min(1, v));
  const shapes = (t, P3, h) => { sync(); if (!G || !G.int) return; const me = A.me, g = teamOf(me);
    // (the raid markers round the room, as the plan puts them)
    // (as in the game: the marker floating over its spot with a soft glow of its colour on the stone (pg3dInt draws the floating shape), its name small
    // under it, training wheels)
    Object.keys(PG_INT_MKA).forEach((k) => { const p = pgIntAt(PG_INT_MKA[k], 33), nm = pgIntMk(k), c = PG_INT_MKC[nm]; h.disc(p[0], p[1], 2, c, 0.2); h.ring(p[0], p[1], 2, c, 0.75, 0.16); P3({ k: 'wmark', x: p[0], y: p[1], nm, c }); h.label(p[0], p[1], 1.1, nm, c, 12); });
    // (her Call at her edge, then down into the venom with a splash)
    if (t >= T.callL + 0.6 && t < T.callL + 2.8) P3({ k: 'splash', x: S.her[0], y: S.her[1], p: (t - T.callL - 0.6) / 2.2, s: 1.5 });
    // (the floor's words, one label a spot (the prompts audit, Nov 16: up to 11 labels and the 8 marker names at once, two numberings side by side), words
    // only, no counts: where your team waits; your next soak once the pattern is called ("Then here" while one of yours is up: practice3d.js labels that one
    // YOUR SOAK), your later ones a ring only; the other teams' live circles by team; the gold ring only once you're on it (the arrow's own label marks it
    // while you walk there); "Crack" on the red strips, beside you along each line)
    if (!called(t) && t < T.gather) { const p = S.pre[g]; h.ring(p[0], p[1], 4.5, P.TC[g], 0.85, 0.25, true); h.label(p[0], p[1], 3.6, 'Wait here', P.TC[g], 13); }
    if (called(t)) { const up = S.soaks.some((s) => s.team === g && t >= s.t0 && t <= s.at + 0.5); let first = true;
      S.soaks.forEach((s) => { if (s.team !== g || t >= s.t0) return; h.ring(s.x, s.y, s.r, '#f3c969', first ? 0.55 : 0.35, 0.3, true); if (first) h.label(s.x, s.y, 3, up ? 'Then here' : 'Your next soak', '#f3c969', 14); first = false; }); }
    // (each coil: the spectral tail rises at the rim and slams its circle; another team's circle has that team's name over it)
    S.soaks.forEach((s) => { if (t < s.t0 || t > s.at + 0.6) return; P3({ k: 'stail', x: s.rim[0], y: s.rim[1], f: cl((t - s.t0) / 1.2), sink: t > s.at ? cl((t - s.at) / 0.6) : 0 }); if (t < s.t0 + 1.1) P3({ k: 'splash', x: s.rim[0], y: s.rim[1], p: (t - s.t0) / 1.1, s: 0.6 });
      if (s.team !== g) h.label(s.x, s.y, 7.5, P.TN[s.team] + ' team', P.TC[s.team], 13); });
    // (the end: where to stand, then the cracks and her burst lighting up red; after it the cracks are venom)
    if ((t >= T.gather - 1 || (called(t) && !nextSoak(me, t))) && t < T.shatter + 1) { const p = pgIntGather(); h.disc(p[0], p[1], P.SPREAD, '#f3c969', 0.12); h.ring(p[0], p[1], P.SPREAD, '#f3c969', 1, 0.3, true); if (pgDist([G.x, G.y], p) <= P.SPREAD && t < T.shatter) h.label(p[0], p[1], 4, 'Good spot', '#7ee08f', 14); }
    if (t >= T.bubbles && t < T.shatter) { const o = 0.16 + 0.1 * Math.sin(t * 6); [0, Math.PI / 2].forEach((a) => P3({ k: 'rect', x: 0, y: 0, a, f0: -38, f1: 38, w0: -P.CRACK, w1: P.CRACK, c: '#ff4a3a', o }));
      const cy = Math.max(-30, Math.min(30, Math.abs(G.y) < 8 ? (G.y < 0 ? -8 : 8) : G.y)), cx = Math.max(-30, Math.min(30, Math.abs(G.x) < 8 ? (G.x < 0 ? -8 : 8) : G.x));
      h.label(0, cy, 2.5, 'Crack', '#ff6a5a', 13); h.label(cx, 0, 2.5, 'Crack', '#ff6a5a', 13); } /* (her bubbles: practice3d.js labels them "Bubbles", once) */
    if (t >= T.shatter) [0, Math.PI / 2].forEach((a) => { P3({ k: 'rect', x: 0, y: 0, a, f0: -38, f1: 38, w0: -P.CRACK, w1: P.CRACK, c: '#24481c', o: 0.94 }); P3({ k: 'rect', x: 0, y: 0, a, f0: -38, f1: 38, w0: -P.CRACK * 0.6, w1: P.CRACK * 0.6, c: '#5fae2e', o: 0.35 + 0.1 * Math.sin(t * 4) }); }); };

  return { part: 'int', label: 'the intermission', flat3d: true,
    script: (o) => pgIntScript({ ...(o || {}), me: A.me, pick: mine() ? pk : null, pat: o && o.pat != null ? o.pat : pk.pat }), init, home, job, slow, check, kick, bossHp, onPlat: (x, y) => PG_UL.onPlat(x, y),
    bossAt: (t) => { sync(); if (!S) return { p: [46, 0], up: true }; if (t >= T.shatter) return { p: S.dive.to.slice(), up: true }; if (t < T.callL + 0.6) return { p: S.her.slice(), up: true }; return { p: [0, 0], up: false }; }, tailAt: () => ({ p: [0, 0], up: false }),
    jobText, upNext, acts, hud, card, bind, role, asg, short, setup: setupCard, starts, tgts, dpsCat, dpsNames, mini, draw2d, auditStep, shapes, ff: () => { sync(); if (G && G.int) { G.wipes = 0; G.int.soakN = []; /* (the Rawlings alive at your start stay: the release sweep, Nov 16) */ const back = (G.int.raws || []).filter((a) => !(a.hp != null && a.hp <= 0) && !G.adds.includes(a)); if (back.length) G.adds.push(...back); } },
    get clean() { return 'No mistakes: every soak on time' + (pk.egg ? ', your egg broken in a soak' : '') + ', your defensive for the back-to-back slams, and you rode out the Shattering on the stone. Try another team.'; }, /* (only what this job does: the review, Nov 15) */
    get pick() { return pk; }, set pick(j) { if (jobOk(j)) pk = j; }, slotOf, mine, get T() { return T; }, kit3d: (K) => pg3dInt(K), eggShells: true, calmCarriers: true, qGlow: (t) => { sync(); return !!G && qNow(t != null ? t : G.t); } }; /* (calmCarriers: a bot holding an egg walks at your speed, Sprints 3 s in 30 only for a wave or a soak due, and steps round you a little (practice.js, Flex, Nov 15: "they tend to pause and then move a lot faster than the player and will run right into me"; "Yes, turn them on" for the intermission)) */ /* (eggShells: your egg's Hardened shell you break by hitting it, as in phase 1 (practice.js, Nov 15); the intermission's eggs land Hardened too (measured: cast 1299650 at each landing)) */
}
// (the part on the start card's Part switch, after phase 2 and before phase 3 whichever file is read first; `?practice=int` on the guide opens it)
// ---- 3D (practice3d.js calls pg3dInt(K) once when the 3D view opens for an intermission game, through the part's kit3d; K is its kit: three.js, the
// scene, keep, pool, glw, canvas, ctex, baseY). The floating raid markers: each of the eight shapes drawn once on its own canvas, a sprite that bobs
// 3.4 yards over its spot with a glow round it, like the game's world markers. put(shape) draws this part's 'wmark' shapes; frame() has nothing to do ----
function pg3dInt(K) {
  const T = K.T, SP = {}, H = 3.4;
  ['Skull', 'Circle', 'Star', 'Cross', 'Square', 'Triangle', 'Diamond', 'Moon'].forEach((nm) => { const tx = K.ctex(K.canvas(128, 128, (g) => pgIntMarkDraw(g, nm, 64, 64, 54)));
    SP[nm] = K.pool(() => { const sp = new T.Sprite(K.keep(new T.SpriteMaterial({ map: tx, transparent: true, depthWrite: false, fog: false }))); sp.renderOrder = 680; return sp; }); });
  const put = (s, t) => { if (s.k !== 'wmark' || !SP[s.nm]) return false; const sp = SP[s.nm](), y = K.baseY(s.x, s.y) + H + Math.sin(t * 1.7 + s.x * 0.21 + s.y * 0.13) * 0.3;
    sp.position.set(s.x, y, -s.y); sp.scale.set(2.5, 2.5, 1); if (K.glw) K.glw(s.x, y, -s.y, 4.2, s.c, 0.3); return true; };
  return { put, frame: () => {} };
}
{ const U = PG_PARTS["Ula'tek"], mi = { name: 'Intermission', d: 'm', end: PG_INT_T.end, roles: [{ id: 'r7', name: 'Ranged', job: 'Blue team' }], mod: pgInt }, out = {}, keys = Object.keys(U);
  keys.forEach((k) => { if (k === 'm3' && !out.mint) out.mint = mi; if (k !== 'mint') out[k] = U[k]; }); if (!out.mint) out.mint = mi; keys.forEach((k) => { delete U[k]; }); Object.assign(U, out); }
