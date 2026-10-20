// ---------- Guides: how each boss works, with animated maps (your call, Oct 20) ----------
// A teaching page, not a log check: each boss's phases, every mechanic in plain words with what to do, a top-down map
// that plays the whole mechanic in order, and notes for tanks, healers and DPS. The maps are drawn by the same code as the
// Debriefing maps (miniMap / bindAnim / bindZoom in ui.js) from scripted example positions, not from a log.
// Strategy comes only from the guide library (notes/Guides/Bosses) and the boss research notes; the page says "the guides".
// Greyed out on the website until you say to show it (GDZ_OFF in ui.js). Built into the page after ui.js (build.ps1).

// The example raid on the maps: 2 tanks, 4 healers, 7 melee, 7 ranged, each drawn as a role icon in its role's colour.
const GDZ_ROLE = {
  t: ['Tank', '#5aa0ff', 'ability_warrior_defensivestance'], h: ['Healer', '#45d16b', 'spell_holy_renew'],
  m: ['Melee', '#ff7a5c', 'ability_dualwield'], r: ['Ranged', '#f2b33a', 'spell_fire_firebolt02'] };
const GDZ_RAID = ['t1', 't2', 'h1', 'h2', 'h3', 'h4', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'];
const gdzName = (id) => GDZ_ROLE[id[0]][0] + ' ' + id.slice(1);
function gdzPmap() {
  const m = new Map(); for (const id of GDZ_RAID) { const [, color, icon] = GDZ_ROLE[id[0]]; m.set(gdzName(id), { name: gdzName(id), color, specIcon: icon }); }
  return m;
}
// where member i of n stands in a loose clump of radius r (a sunflower spiral, so clumps look natural and never overlap)
const gdzSpot = (i, n, r) => { if (n <= 1) return [0, 0]; const a = i * 2.39996, d = r * Math.sqrt((i + 0.5) / n); return [Math.cos(a) * d, Math.sin(a) * d]; };

// ---- the script kit: a mechanic's map is written as where things are at given seconds ----
// Positions are yards from the room's centre (x east, y north). Units hold still between their key moments and glide
// from one to the next. kit.done() turns it into a map for miniMap: frames every quarter second, plus its circles,
// frontals, lines and cast bars.
// (Putting it all together: while GDZ_SEG is set, every mechanic's map script writes into one shared kit instead of its
// own, each shifted to its own stretch of the fight (seg.T) with its orbs, adds and bosses kept apart (seg.pre))
let GDZ_SEG = null;
function gdzKit(boss, len) {
  if (GDZ_SEG) { GDZ_SEG.next(len); return GDZ_SEG.kit; }
  const U = new Map(), A = ARENAS[boss] || { cx: 0, cy: 0 }, k = { wmarks: [], rings: [], cones: [], links: [], arrows: [], tags: [], cbars: {}, steps: [], hl: new Set(), good: [], goodAt: [], bad: [], badAt: [] };
  // seg: the stretch being written (T: its start, pre: its own names for orbs, adds and bosses, w: its window); players carry on
  const seg = { T: 0, pre: '', w: null }, isP = (id) => /^[thmr]\d$/.test(id), P = (id) => (id == null || isP(id) ? id : seg.pre + id), TT = (t) => (t == null ? t : t + seg.T);
  const unit = (id, kind, name) => { if (!U.has(id)) U.set(id, { id, kind, name: name || (kind === 'player' ? gdzName(id) : String(id).replace(/^s\d+:/, '')), path: [], from: seg.w && kind !== 'player' ? seg.w[0] : -1, to: seg.w && kind !== 'player' ? seg.w[1] : Infinity }); return U.get(id); };
  const put = (u, t, x, y) => { u.path.push([t, x, y]); u.path.sort((a, b) => a[0] - b[0]); };
  const posRaw = (id, t) => { const u = U.get(id); if (!u || !u.path.length) return null; const p = u.path; if (t <= p[0][0]) return [p[0][1], p[0][2]];
    for (let i = 0; i < p.length - 1; i++) if (t <= p[i + 1][0]) { const a = p[i], b = p[i + 1], w = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return [a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w]; }
    const z = p[p.length - 1]; return [z[1], z[2]]; };
  const kit = {
    posAt: (id, t) => posRaw(P(id), TT(t)),
    // one player (id like 'm3') at a spot at a moment; or a group of players in a clump around a spot
    at(t, ids, x, y, spread) { ids = [].concat(ids); ids.forEach((id, i) => { const [dx, dy] = spread ? gdzSpot(i, ids.length, spread) : [0, 0]; put(unit(id, 'player'), TT(t), x + dx, y + dy); }); return kit; },
    // the same players stay where they are until t (so the next move starts then, not from the start)
    hold(t, ids) { for (const id of [].concat(ids)) { const p = posRaw(id, TT(t)); if (p) put(unit(id, 'player'), TT(t), p[0], p[1]); } return kit; },
    boss(id, name, t, x, y) { put(unit(P(id), 'boss', name), TT(t), x, y); return kit; },
    add(id, name, t, x, y) { put(unit(P(id), 'add', name), TT(t), x, y); return kit; },
    // orbs ('orb' green, 'porb' purple) and ghosts ('ghost'): from when they appear, until they're gone
    obj(id, kind, t, x, y) { put(unit(P(id), kind), TT(t), x, y); return kit; },
    show(id, from, to) { const u = U.get(P(id)); if (u) { if (from != null) u.from = TT(from); if (to != null) u.to = TT(to); } return kit; },
    // a circle: fixed (x, y) or on a unit (on), from t0 for dur seconds; fx as in miniMap (soak, burst, debuff, puddle, zone, safe); at: when it goes off
    ring(o) { k.rings.push({ ...o, on: P(o.on), t0: TT(o.t0), at: TT(o.at) }); return kit; },
    // a frontal from a unit toward another unit (or a direction in degrees, east = 0, counterclockwise), landing at 'at'; hit: orbs or ghosts it removes
    cone(o) { k.cones.push({ ...o, from: P(o.from), to: P(o.to), at: TT(o.at), hit: (o.hit || []).map(P) }); return kit; },
    link(o) { k.links.push({ ...o, from: P(o.from), to: P(o.to), t0: TT(o.t0), t1: TT(o.t1) }); return kit; },
    arrow(o) { k.arrows.push({ ...o, g: P(o.g), t0: TT(o.t0), t1: TT(o.t1), at: TT(o.at) }); return kit; },
    tag(id, text, from, to) { k.tags.push([P(id), text, TT(from), TT(to)]); return kit; },
    cast(id, spell, t0, t1, end, by) { const g = P(id); (k.cbars[g] = k.cbars[g] || []).push({ t0: TT(t0), t1: TT(t1), len: t1 - t0, spell, end: end || 'done', by: by || '' }); return kit; },
    // the numbered steps beside the map, each lit while it plays
    step(t, text) { k.steps.push([TT(t), text]); return kit; },
    // a raid marker on the floor (square, triangle, diamond, cross, star, circle, moon, skull), as the plan placed it
    wmark(kind, x, y) { if (!k.wmarks.some((w) => w.k === kind && w.x === x && w.y === y)) k.wmarks.push({ k: kind, x, y }); return kit; },
    ring1(ids) { for (const id of [].concat(ids)) k.hl.add(P(id)); return kit; },
    ok(id, t) { k.good.push(P(id)); if (t != null) k.goodAt.push([P(id), TT(t)]); return kit; },
    oops(id, t) { k.bad.push(P(id)); if (t != null) k.badAt.push([P(id), TT(t)]); return kit; },
    raid: GDZ_RAID,
    // (Putting it all together: start the next stretch at T, n-th of the fight)
    seg(T, n, segLen) { seg.T = T; seg.pre = 's' + n + ':'; seg.w = [T, T + segLen]; return kit; },
    stepCount: () => k.steps.length,
    done(o) {
      if (GDZ_SEG && GDZ_SEG.kit === kit && !(o && o.final)) return kit; // (a stretch of the whole fight: the whole is built once, at the end)
      o = o || {}; const X = (x) => A.cx + x, Y = (y) => A.cy + y, frames = [], L = o.len || len;
      for (let t = 0; t <= L + 1e-6; t += 0.25) {
        const pts = [];
        for (const u of U.values()) { if (t < u.from || t > u.to || !u.path.length) continue; const p = posRaw(u.id, t); pts.push({ guid: u.id, name: u.name, kind: u.kind, x: X(p[0]), y: Y(p[1]) }); }
        frames.push({ t, pts });
      }
      const cones = k.cones.map((c) => { const p = posRaw(c.from, c.at), q = c.to ? posRaw(c.to, c.at) : null, dir = q ? Math.atan2(q[1] - p[1], q[0] - p[0]) : (c.deg || 0) * Math.PI / 180;
        return { x: X(p[0]), y: Y(p[1]), r: c.r || 30, half: (c.width || 60) * Math.PI / 360, dir, at: c.at, hit: c.hit || [] }; });
      const rings = k.rings.map((g) => ({ ...g, x: g.x != null ? X(g.x) : undefined, y: g.y != null ? Y(g.y) : undefined, guid: g.on, cn: g.cn }));
      const f = o.focus || { x: 0, y: 0, r: 20 }, quiet = !!o.quiet; // (quiet: no names or rings on players, for the whole fight)
      return { boss, title: o.title || '', wmarks: k.wmarks.map((w) => ({ k: w.k, x: X(w.x), y: Y(w.y) })), frames, pts: frames[0].pts, t: 0, rings, cones, links: k.links, arrows: k.arrows, tags: quiet ? [] : k.tags, cbars: k.cbars,
        hl: quiet ? [] : [...k.hl], good: quiet ? [] : k.good, goodAt: !quiet && k.goodAt.length ? k.goodAt : null, bad: quiet ? [] : k.bad, badAt: !quiet && k.badAt.length ? k.badAt : null,
        hitOrbs: cones.flatMap((c) => c.hit.filter((g) => U.get(g) && U.get(g).kind !== 'ghost')), ghostHit: cones.flatMap((c) => c.hit.filter((g) => U.get(g) && U.get(g).kind === 'ghost')),
        focus: { x: X(f.x), y: Y(f.y), r: f.r }, steps: k.steps.slice().sort((a, b) => a[0] - b[0]), playerLabel: 'Player (role icon: tank, healer, melee, ranged)', spd: o.spd,
        lateHit: true, hlLabel: o.hlLabel, goodLabel: o.goodLabel, badLabel: o.badLabel, tagLabel: o.tagLabel, noArena: !!o.noArena };
    },
  };
  return kit;
}
// Putting it all together: every mechanic's map of a guide, in fight order, as one long map. Returns the map and its
// captions ({ t, ph, name, text }: each step of each mechanic, from when it plays) and chapters (each mechanic's start).
function gdzWhole(boss, G, D) {
  const GAP = 1.5, kit = gdzKit(boss, 1), caps = [], chaps = [];
  let T = 0, n = 0;
  GDZ_SEG = { kit, next(len) { kit.seg(T, n, len); GDZ_SEG.len = len; } };
  try {
    G.phases.forEach((p, pi) => (p.mechs || []).forEach((m) => {
      if (!m.map) return; n++; const s0 = kit.stepCount();
      m.map(D); const len = GDZ_SEG.len || 12;
      chaps.push({ t: T, ph: pi + 1, phase: p.name, name: m.name });
      // (the mechanic's own numbered steps become the captions, in the order they play)
      for (let j = s0; j < kit.stepCount(); j++) caps.push({ t: 0, j: j - s0, ph: pi + 1, name: m.name, text: (m.do || [])[j - s0] || '' });
      T += len + GAP;
    }));
  } finally { GDZ_SEG = null; }
  const mp = kit.done({ final: true, len: T - GAP, title: 'The whole fight', focus: { x: 0, y: 0, r: 30 }, quiet: true, spd: 1.4 });
  mp.steps.forEach(([t], i) => { if (caps[i]) caps[i].t = t; });
  return { mp, caps, chaps };
}

// The game's raid markers, drawn here (no game art): their colour and shape, about the size of a player icon
const GDZ_WM = { star: ['#ffd23b', 'Star'], circle: ['#ff8a1c', 'Circle'], diamond: ['#c45cff', 'Diamond'], triangle: ['#3fd15a', 'Triangle'], moon: ['#cfd8e6', 'Moon'], square: ['#3a8bff', 'Square'], cross: ['#ff3b3b', 'Cross (X)'], skull: ['#f4f4f4', 'Skull'] };
function gdzMarkSvg(kind, x, y) {
  const [c, n] = GDZ_WM[kind] || ['#fff', kind], o = ' fill="' + c + '" stroke="#000" stroke-width="1.4"', P = (pts) => '<polygon points="' + pts.map(([a, b]) => (x + a).toFixed(1) + ',' + (y + b).toFixed(1)).join(' ') + '"' + o + '/>';
  let g = '';
  if (kind === 'square') g = '<rect x="' + (x - 7) + '" y="' + (y - 7) + '" width="14" height="14" rx="1.5"' + o + '/>';
  else if (kind === 'triangle') g = P([[0, -8], [8, 6.5], [-8, 6.5]]);
  else if (kind === 'diamond') g = P([[0, -9], [7, 0], [0, 9], [-7, 0]]);
  else if (kind === 'cross') g = '<path d="M' + (x - 6) + ' ' + (y - 6) + 'L' + (x + 6) + ' ' + (y + 6) + 'M' + (x + 6) + ' ' + (y - 6) + 'L' + (x - 6) + ' ' + (y + 6) + '" stroke="#000" stroke-width="6" stroke-linecap="round"/><path d="M' + (x - 6) + ' ' + (y - 6) + 'L' + (x + 6) + ' ' + (y + 6) + 'M' + (x + 6) + ' ' + (y - 6) + 'L' + (x - 6) + ' ' + (y + 6) + '" stroke="' + c + '" stroke-width="3.6" stroke-linecap="round"/>';
  else if (kind === 'star') { const q = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.8 : 9; q.push([Math.cos(a) * r, Math.sin(a) * r]); } g = P(q); }
  else if (kind === 'circle') g = '<circle cx="' + x + '" cy="' + y + '" r="7.5"' + o + '/>';
  else if (kind === 'moon') g = '<path d="M' + (x + 3) + ' ' + (y - 8) + 'A8 8 0 1 0 ' + (x + 3) + ' ' + (y + 8) + 'A6 6 0 1 1 ' + (x + 3) + ' ' + (y - 8) + 'Z"' + o + '/>';
  else g = '<circle cx="' + x + '" cy="' + (y - 1.5) + '" r="7"' + o + '/><rect x="' + (x - 3.5) + '" y="' + (y + 3) + '" width="7" height="5" rx="1"' + o + '/><circle cx="' + (x - 2.6) + '" cy="' + (y - 2) + '" r="1.7" fill="#111"/><circle cx="' + (x + 2.6) + '" cy="' + (y - 2) + '" r="1.7" fill="#111"/>';
  return '<g opacity=".95">' + g + '<title>' + esc(n) + ' marker</title></g>';
}

// ---- the guides: one per boss, filled in below (GDZ[boss] = { ... }) ----
// { sum: one line, facts: [[label, value, only 'h'/'m']], phases: [{ id, name, sum, mechs: [{ name, what, do: [..], note, map: (d) => mp }], tiles: [{ name, do, note }] }],
//   (any part: only: 'h' or 'm' for one difficulty; h: { .. } / m: { .. } to change fields on that difficulty)
//   roles: { t: [..], h: [..], d: [..] } }
const GDZ = {};
const GDZ_ORDER = ['Nymrissa Wavecaller', "Nek'zali the Soulcoiler", 'Entombed Sentinels', 'The Lost Explorers', 'Vashnik the Malignant', 'Sszorak', 'The Twin Fangs', 'The Coiled Altar', "Ula'tek", "Kith'ix"];
const GDZ_CACHE = new Map(); // (a map's frames are built once per visit)
// a carried object: the carrier walks to it, picks it up at tp, walks it to (dx, dy) by td, and the object rides along
function gdzCarry(k, who, obj, kind, tAppear, ox, oy, tp, dx, dy, td, back) {
  const from = k.posAt(who, tp - 1.6) || [ox, oy];
  k.obj(obj, kind, tAppear, ox, oy).obj(obj, kind, tp, ox, oy).obj(obj, kind, td, dx, dy).show(obj, tAppear);
  k.at(tp - 1.6, who, from[0], from[1]).at(tp, who, ox, oy).at(td, who, dx + 1.5, dy + 1.5);
  if (back) k.at(td + 1.8, who, back[0], back[1]);
  k.ring1(who).tag(who, 'orb', tp, td);
}

// ===== The Coiled Altar (from notes/Guides/Bosses/7 The Coiled Altar.md; Mythic from its "Mythic plan in detail" section) =====
// The room is a square about 104 yards across (doors north and south); the bosses fight in the middle.
// The usual P1 raid spots around Zul'jan (boss tank in front, the boss facing south)
function gdzCaRaid(k, skip) {
  const s = new Set(skip || []), g = (ids) => ids.filter((x) => !s.has(x));
  k.at(0, g(['t1']), 0, 3).at(0, g(['t2']), 7, 7).at(0, g(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']), 0, 16, 7).at(0, g(['h1', 'h2']), -16, 14, 3).at(0, g(['h3', 'h4']), 16, 14, 3)
    .at(0, g(['r1', 'r2', 'r3', 'r4']), -22, 2, 6).at(0, g(['r5', 'r6', 'r7']), 22, 2, 5);
}
// The Mythic plan's raid markers (turned so the room's doors are north and south, like the floor art): the X marks the entrance
// side (west here), moon and skull its corners, star and square the far corners, diamond the far wall, the circle a side wall
function gdzCaMarks(k) { k.wmark('cross', -46, 0).wmark('moon', -44, -44).wmark('skull', -44, 44).wmark('star', 44, -44).wmark('square', 44, 44).wmark('diamond', 48, 14).wmark('circle', 20, 47); return k; }
const GDZ_CA_M = {
  // P1: purples at the far end of each frontal's triangle, greens between them and the boss; the entrance side first
  orbs() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 18));
    k.boss('zj', 'Zul\'jan', 0, 0, 0);
    k.at(0, 't1', 5, 0).at(0, 't2', -2, 6).at(0, ['m1', 'm2', 'm3', 'm4'], 0, 8, 4).at(0, ['m5', 'm6', 'm7'], 0, -8, 3).at(0, ['h1', 'h2'], -6, 22, 3).at(0, ['h3', 'h4'], 6, -22, 3)
      .at(0, 'r1', -38, -34).at(0, 'r2', -38, 34).at(0, 'r3', 38, -34).at(0, 'r4', 38, 34).at(0, ['r5', 'r6', 'r7'], 4, 24, 4);
    k.hold(8, 't2').at(9.2, 't2', -6, 0).hold(10.4, 't2'); /* (the off-tank's taunt spot first, so its orb run starts from there) */
    // purples: the two Warlocks (entrance corners) and the two Mages (far corners) take the one nearest their corner; the off-tank the awkward one
    const PU = [['r1', -36, -22, -31, -5, 4.2, 7], ['r2', -34, 24, -31, 5, 4.6, 7.4], ['r3', 34, -26, 31, -10, 9.5, 12.5], ['r4', 30, 30, 31, 10, 10, 13], ['t2', 46, 2, 31, 0, 12, 14.2]];
    PU.forEach(([w, x, y, tx, ty, tp, td], i) => { k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: '#b65cff', cn: 'Toxic Deluge', legend: 'circle lands and leaves an orb' });
      if (w !== 't2') k.at(tp - 1.4, w, k.posAt(w, 0)[0], k.posAt(w, 0)[1]);
      gdzCarry(k, w, 'p' + i, 'porb', 3, x, y, tp, tx, ty, td, null); k.show('p' + i, 3, i < 2 ? 11 : 17.4);
      k.ring({ on: 'p' + i, r: 3.5, fx: 'debuff', t0: 3, dur: i < 2 ? 7 : 13.5, color: '#b65cff', cn: 'Purple orb\'s ring', legend: 'must never touch another orb' }); });
    k.at(7.6, 'r1', -38, -20).at(7.9, 'r2', -38, 20).at(13.6, 'r3', 34, -27).at(14, 'r4', 34, 27).at(15.4, 't2', 22, -16);
    // greens: moved out of the purple carriers' way first, then into each triangle
    const GR = [['m5', -14, -24, -20, -3, 3.4, 6.4], ['h1', -20, 30, -20, 3, 3.6, 6.6], ['r5', -6, 34, -25, 0, 3.8, 7], ['m6', -26, -36, -24, -6, 4, 7.4], ['m1', 18, 18, 22, -3, 9.6, 12.6], ['h3', 16, -30, 22, 3, 10, 13]];
    GR.forEach(([w, x, y, tx, ty, tp, td], i) => { k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: '#5fd35f', cn: 'Toxic Deluge' }); const back = k.posAt(w, 0);
      if (tp > 8) k.hold(tp - 1.6, w); gdzCarry(k, w, 'g' + i, 'orb', 3, x, y, tp, tx, ty, td, back); k.show('g' + i, 3, i < 4 ? 11 : 17.4); });
    // the off-tank taunts and takes the entrance frontal, then runs for the last purple; the boss tank taunts back for the far side
    k.cast('zj', 'Sever', 8.6, 10.2).cone({ from: 'zj', to: 't2', at: 10.2, r: 35, hit: ['p0', 'p1', 'g0', 'g1', 'g2', 'g3'] });
    k.hold(14.6, 't1').at(15.4, 't1', 6, 0);
    k.cast('zj', 'Sever', 15, 16.6).cone({ from: 'zj', to: 't1', at: 16.6, r: 35, hit: ['p2', 'p3', 'p4', 'g4', 'g5'] });
    k.ring1(['r1', 'r2', 'r3', 'r4', 't2', 't1']).step(1).step(3.2).step(4).step(8.6).step(11).step(15);
    return k.done({ title: 'Toxic Deluge on Mythic: two triangles', focus: { x: 0, y: 0, r: 28 }, tagLabel: 'Carrying an orb', hlLabel: 'purple carriers and tanks' });
  },
  // P1 axes: soak 1 is everyone who'll immune soak 2, plus tanky players; soak 2 is exactly five, with immunities
  axe() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 13)), C = [-38, -38], grp = ['m5', 'm6', 'r6', 'r5', 'r7', 'h3'];
    k.boss('zj', 'Zul\'jan', 0, 0, 0); k.at(0, 't1', 5, 0).at(0, 't2', -2, 6).at(0, ['m1', 'm2', 'm3', 'm4', 'm7'], 0, 8, 4).at(0, ['h1', 'h2', 'h4'], -6, 22, 3).at(0, ['r1', 'r2', 'r4'], 4, 24, 4);
    k.at(0, 'r3', -20, -12).at(0, grp, 6, -14, 5);
    k.ring({ on: 'r3', r: 9, fx: 'soak', t0: 1, at: 6, dur: 5.8, color: '#f24824', cn: 'Guillotine', legend: '9-yard soak' });
    k.hold(1, 'r3').at(3.4, 'r3', C[0], C[1]); grp.forEach((id, i) => { const [dx, dy] = gdzSpot(i + 1, 7, 4.5); k.hold(1.6, id).at(4.6, id, C[0] + dx, C[1] + dy); });
    k.tag('r5', 'Turtle', 1, 13).tag('r7', 'Turtle', 1, 13).tag('m6', 'Feint', 1, 13).tag('r6', 'Disp.', 1, 13);
    k.ring({ x: C[0], y: C[1], r: 40, fx: 'burst', t0: 6, at: 12, dur: 6.6, color: '#9ff26d', cn: 'Widow\'s Kiss', legend: 'erupts 40 yards around the spot, 6 s after' });
    ['r3'].concat(grp).forEach((id, i) => { k.ok(id, 6); const [dx, dy] = gdzSpot(i, 7, 6); k.hold(6.3, id).at(11, id, 10 + dx, 12 + dy); });
    k.ring1(['r3', 'r5', 'r7']).step(1).step(2).step(6).step(6.4).step(11);
    return k.done({ title: 'Guillotine on Mythic: the first soak', focus: { x: -14, y: -14, r: 24 }, hlLabel: 'axe target and the Hunters', goodLabel: 'in the soak', tagLabel: 'What they press (Hunters keep Turtle for soak 2)' });
  },
  // P2: everyone stacks the mind controls on the square; ghosts land around them and get frozen apart; the frontal sweeps them
  ghosts() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 13)), SQ = [41, 39];
    k.boss('hm', 'Malacrass', 0, 6, 4).boss('hm', 'Malacrass', 3, 22, 22);
    k.at(0, 't1', 10, 4).at(3, 't1', 28, 24).hold(8, 't1').at(9.6, 't1', 47, 42).at(0, 't2', 2, 8).at(3, 't2', 14, 20)
      .at(0, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 6, 12, 5).at(3, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 18, 28, 5).at(0, ['h1', 'h3', 'h4'], -8, 14, 4).at(3, ['h1', 'h3', 'h4'], 6, 30, 4)
      .at(0, ['r1', 'r2', 'r3', 'r4', 'r6', 'r7'], -6, -6, 6).at(3, ['r1', 'r2', 'r3', 'r4', 'r6', 'r7'], 4, 12, 6);
    k.at(0, 'r5', -18, 4).at(0, 'm4', 2, -10).at(0, 'h2', -12, 20);
    const mc = ['r5', 'm4', 'h2'];
    mc.forEach((id, i) => { k.ring({ on: id, r: 3, fx: 'debuff', t0: 1, dur: 5, color: '#b65cff', cn: 'Dreadmarch', legend: 'mind controlled, shielded' }); k.tag(id, 'MC', 1, 6); const [dx, dy] = gdzSpot(i, 3, 2.5); k.hold(1, id).at(4.4, id, SQ[0] + dx, SQ[1] + dy).hold(6.4, id); });
    // (they land around their player and are frozen on the spot by being looked at; the two outside the cone are let creep in)
    const G = [[34, 40], [37, 32], [44, 44], [43, 31], [31, 34], [26, 44]], IN = { 5: [30, 38], 2: [42, 38] };
    G.forEach(([x, y], q) => { const g = 'g' + q; k.obj(g, 'ghost', 6.2, x, y).show(g, 6.2, 12); if (IN[q]) k.obj(g, 'ghost', 8, x, y).obj(g, 'ghost', 9.6, IN[q][0], IN[q][1]); });
    mc.forEach((id, i) => k.at(8.6, id, 18 - i * 3, 36 + i * 3));
    k.cast('hm', 'Soul Sever', 9.8, 11).cone({ from: 'hm', to: 't1', at: 11, r: 45, hit: ['g0', 'g1', 'g2', 'g3', 'g4', 'g5'] });
    k.ring1(mc.concat('t1')).step(1).step(2).step(6.2).step(8).step(11);
    return k.done({ title: 'Dreadmarch on Mythic: stack on square', focus: { x: 30, y: 30, r: 15 }, hlLabel: 'mind-controlled players and the boss tank', tagLabel: 'Mind controlled, with a shield' });
  },
  bombs() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 11)), RA = [-32, -28], MA = [24, 8];
    k.boss('hm', 'Malacrass', 0, 18, 20).add('ar', 'Spiteful Soulcoiler', 0, RA[0], RA[1]).add('am', 'Spiteful Soulcoiler', 0, MA[0], MA[1]);
    k.at(0, 't1', 24, 26).at(0, 't2', 10, 22).at(0, ['m3', 'm4', 'm5', 'm6', 'm7'], 14, 26, 5).at(0, ['h1', 'h2', 'h3', 'h4'], 0, 30, 5).at(0, ['r3', 'r4', 'r5', 'r6', 'r7'], -4, 12, 6);
    k.at(0, ['m1', 'm2'], 18, 28, 2).at(0, ['r1', 'r2'], -6, 4, 2);
    [['r1', RA, -1], ['r2', RA, 1], ['m1', MA, -1], ['m2', MA, 1]].forEach(([id, a, s]) => { k.ring({ on: id, r: 15, fx: 'burst', t0: 1, at: 6, dur: 5, color: '#da3df2', cn: 'Gloombomb', legend: 'explodes 15 yards around them' });
      k.hold(1.4, id).at(4.4, id, a[0] + s * 1.5, a[1] + 1.5).hold(6.6, id).at(8.4, id, k.posAt(id, 0)[0], k.posAt(id, 0)[1]); });
    k.cast('ar', 'Wail of Terror', 0.5, 1.2, 'kick', 'Ranged 3').cast('am', 'Wail of Terror', 0.6, 1.3, 'kick', 'Ranged 4').cast('am', 'Wail of Terror', 7.6, 8.8, 'kick', 'Melee 3');
    k.ring1(['r1', 'r2', 'm1', 'm2']).step(1).step(1.6).step(6).step(7.6);
    return k.done({ title: 'Gloombombs on the adds', focus: { x: -4, y: -2, r: 20 }, hlLabel: 'players with a Gloombomb' });
  },
  // P3: one frontal takes every purple in a diamond; greens go to one side, lined up
  diamond() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 13));
    k.boss('zj', 'Zul\'jan', 0, 16, -6).boss('hm', 'Malacrass', 0, 19, -2);
    k.at(0, 't1', 22, -6).at(0, 't2', 26, 0).at(0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 20, -14, 4).at(0, ['h1', 'h2', 'h3', 'h4'], 28, -22, 4).at(0, ['r1', 'r2', 'r5', 'r6', 'r7'], 30, 14, 5);
    k.at(0, ['r3', 'r4'], 4, 6, 3).at(0, 'h4', 8, -14);
    const PU = [['r3', -6, 22, 0, -6], ['r4', -24, 10, -8, 1], ['t2', -14, -32, -8, -13], ['h4', 6, -30, -16, -6]], GR = [['m1', -10, -8, -8, 26], ['m2', -2, 2, -16, 26], ['h1', -20, -18, 0, 26]];
    PU.concat(GR).forEach(([x, y]) => k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: '#5fd35f', cn: 'Toxic Deluge' }));
    GR.forEach(([w, x, y, tx, ty], i) => { const back = k.posAt(w, 0); k.hold(2.2, w); gdzCarry(k, w, 'g' + i, 'orb', 3, x, y, 3.6 + i * 0.3, tx, ty, 7.4 + i * 0.3, back); k.show('g' + i, 3, 13); });
    PU.forEach(([w, x, y, tx, ty], i) => { k.hold(3, w); gdzCarry(k, w, 'p' + i, 'porb', 3, x, y, 4.4 + i * 0.4, tx, ty, 8.6 + i * 0.3, null); k.show('p' + i, 3, 11.6);
      k.ring({ on: 'p' + i, r: 3.5, fx: 'debuff', t0: 3, dur: 7.8, color: '#b65cff', cn: 'Purple orb\'s ring', legend: 'must never touch another orb' }); if (w !== 't2') k.at(9.9, w, tx + 3, ty + (ty > -6 ? 13 : -13)); });
    k.hold(9.4, 't2').at(10, 't2', 10, -6);
    k.cast('zj', 'Blighted Sever', 9.4, 10.6).cone({ from: 'zj', to: 't2', at: 10.6, r: 45, hit: ['p0', 'p1', 'p2', 'p3'] });
    k.ring1(['r3', 'r4', 't2', 'h4']).step(1).step(3.4).step(4.4).step(9.4);
    return k.done({ title: 'Phase 3 on Mythic: the purple diamond', focus: { x: 2, y: 4, r: 21 }, tagLabel: 'Carrying an orb', hlLabel: 'purple carriers' });
  },
  // the intermission: mobile healers and the off-tank spread to cover the room; stops of 3-5 with a pause, then 7-10 under cooldowns
  frags() {
    const k = gdzKit('The Coiled Altar', 14);
    k.boss('zj', 'Zul\'jan', 0, 0, 0);
    k.at(0, 't1', -3, 0).at(0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 0, 0, 9).at(0, ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], 0, 0, 16);
    k.at(0, 'h1', -22, 18).at(0, 'h3', 22, 18).at(0, 'h4', 22, -18).at(0, 'h2', -4, -10).at(0, 't2', -24, -18);
    const F = [[-46, 26, 'h1', 2.4], [44, 30, 'h3', 2.6], [-12, 12, 'm2', 2.2], [46, -24, 'h4', 5.6], [-44, -28, 't2', 5.8], [10, -46, 'm5', 6], [-16, 48, 'r2', 10], [16, 48, 'r6', 10.2], [-48, 2, 'r1', 10.4], [48, 4, 'r4', 10.6], [-10, -48, 'm6', 10.8], [30, -44, 'r7', 11]];
    F.forEach(([x, y, who, ts], i) => { const id = 'f' + i, tgt = [x * (i === 2 ? 0.6 : 0.55), y * (i === 2 ? 0.6 : 0.55)], sa = k.posAt(who, 0);
      k.add(id, 'Fragment of Malacrass', 0, x, y).add(id, 'Fragment of Malacrass', ts, tgt[0], tgt[1]).show(id, 0, ts + 0.1);
      k.at(ts - 2, who, sa[0], sa[1]).at(ts, who, tgt[0], tgt[1]).at(ts + 2, who, sa[0], sa[1]);
      k.ring({ on: who, r: 3, fx: 'burst', t0: ts - 1.1, at: ts, dur: 1.3, color: '#b65cff', cn: 'Spirit Erasure', legend: 'a stop: hits the whole raid, +20% for 2 s' }).ring1(who); });
    k.tag('h2', 'CDs', 8.4, 14).tag('m1', 'CDs', 8.4, 14);
    k.step(0).step(1).step(2.2).step(5.6).step(10);
    return k.done({ title: 'Intermission on Mythic: stops in turns', focus: { x: 0, y: 0, r: 18 }, hlLabel: 'players stopping a fragment', tagLabel: 'Raid cooldowns go down' });
  },
};
GDZ['The Coiled Altar'] = {
  sum: 'Zul\'jan first, then Hex Lord Malacrass, then both at once. Orbs go to the front for the frontal, axes get soaked by five, and ghosts get led into the frontal too.',
  // (the Mythic guide credits its source by name (your call, Oct 20): a name only, never a link out)
  m: { source: 'Tactyks\' Mythic Coiled Altar guide and first-kill video', sum: 'Zul\'jan, then Hex Lord Malacrass, then both. Purple orbs must never touch another orb, every axe\'s soakers are planned, ghosts must never touch, and bombs go on the adds. This follows a plan that killed it, with its markers; your raid may mark the room its own way.' },
  facts: [['Phases', '3 + intermission'], ['Bloodlust', 'Intermission'], ['Healers', '5', 'm'], ['Hardest part', 'Orbs and ghosts', 'h'], ['Hardest part', 'Purple orbs', 'm']],
  phases: [
    { id: 'p1', name: 'Phase 1: Zul\'jan', sum: 'One boss. Gather the orbs in front of him, soak the axes, and dodge the axes rolling around the room.',
      m: { sum: 'One boss in the middle. Two orb triangles, one each side, popped by alternating frontals; two axe soaks.' },
      mechs: [
        { name: 'Toxic Deluge (Carry orbs to the front)', spell: 'Coalesced Venom', what: 'Green circles land around the room and each leaves an orb that pulses damage on the raid. The tank frontal, Sever, pops orbs, and every pop hits the whole raid.',
          do: ['Step out of the green circles as they land.', 'Each circle leaves a green orb. Orbs hurt the raid until they are popped.', 'Step on an orb to carry it for 5 seconds, then it drops. Bring every orb to the pile in front of the boss.', 'The other tank taunts just before Sever, so the boss turns with the orbs in front of it.', 'Sever pops every orb in its cone. Pop about 5 or 6 at a time (never more than 7).'],
          note: 'Each pop also adds a stack of damage over time to the whole raid, so don\'t pop too many at once.',
          m: { name: 'Toxic Deluge (Two triangles, purples at the tip)', what: 'Green and purple orbs land. If a purple orb\'s ring touches any other orb, carried or on the ground, the raid wipes. Each frontal pops one triangle of orbs: purples at the far end, greens between them and the boss.',
            do: ['Circles land, then the orbs appear. Purple orbs are hard-assigned: two Warlocks (entrance corners), two Mages (far corners) and the off-tank.', 'Everyone else moves green orbs out of the purple carriers\' way first. Greens only, never a purple.', 'Build the entrance side first: purples at the far end of the triangle, up to the marker line, greens between them and the boss.', 'The off-tank taunts just before Sever and pops the whole entrance triangle: 5 or 6 orbs, never more than 7.', 'Now the far side: the off-tank grabs the last, awkward purple and the greens fill in.', 'The boss tank taunts back and takes the second Sever over the far triangle.'],
            plan: ['The entrance side always gets the first frontal, so set that side up first. Three purples on one side and two on the other worked, but don\'t force it.', 'Each Warlock takes the purple nearest their corner; the Mages wait and Blink in only if needed, because the off-tank is the safer runner.', 'Warlocks: wait until greens on your path are picked up before you teleport, or you\'ll run a purple into them.', 'The two side markers show how far the frontal reaches from the middle. Drop orbs at or inside that line; if some are further back, pull the boss a little off centre.', 'You may run a carried green past a carried purple. A green on the ground must never touch a purple\'s ring.', 'Every orb is one stack, purple or green. 5 or 6 per frontal; 7 is healable; never more.', 'Tanks: avoid a second Sever stack in phase 1 (it needs two externals). Two Evokers\' Time Spiral resets the runners\' movement abilities.', 'End of the phase: when ahead, hold damage. The second-to-last frontal hits only 2 or 3 orbs and the last one hits none, because every orb left blows up when Zul\'jan dies.'],
            note: 'Carrying an orb gives Tainted Blood (its damage around you goes up 200% for 10 seconds), so take turns carrying.' },
          map: (d) => {
            if (d === 'm') return GDZ_CA_M.orbs();
            const k = gdzKit('The Coiled Altar', 13);
            k.boss('zj', 'Zul\'jan', 0, 0, 10); gdzCaRaid(k);
            const spots = [[-26, -10], [26, -12], [-34, 16], [32, 22], [-10, -30], [12, -32]], who = ['r2', 'r6', 'r3', 'm6', 'r4', 'r5'];
            spots.forEach(([x, y]) => k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: '#5fd35f', cn: 'Toxic Deluge', legend: 'circle lands and leaves an orb' }));
            spots.forEach(([x, y], i) => { const [dx, dy] = gdzSpot(i, 6, 4.5), back = k.posAt(who[i], 0); gdzCarry(k, who[i], 'o' + i, 'orb', 3, x, y, 3.4 + i * 0.35, dx, -15 + dy, 8 + i * 0.25, back); k.show('o' + i, 3, 11); });
            k.at(8.4, 't2', 7, 7).at(9.4, 't2', 0, 2).at(8.4, 't1', 0, 3).at(9.4, 't1', 6, 6);
            k.cast('zj', 'Sever', 8.6, 10.2).cone({ from: 'zj', to: 't2', at: 10.2, r: 35, hit: ['o0', 'o1', 'o2', 'o3', 'o4', 'o5'] }).ring1(['t1', 't2']);
            k.step(1).step(3).step(3.4).step(8.4).step(10.2);
            return k.done({ title: 'Toxic Deluge and Sever', focus: { x: 0, y: -4, r: 17 }, tagLabel: 'Carrying an orb', hlLabel: 'orb carriers and tanks' });
          } },
        { name: 'Guillotine (Two groups take turns)', what: 'An axe drops on a player. Everyone inside its 9-yard circle shares the hit; with fewer than 5 inside, it hits the whole raid. Six seconds after it lands, it erupts 40 yards around the spot.',
          do: ['The player with the axe walks to a corner, away from the raid.', 'Their soak group joins them: at least 5 players inside the circle.', 'The axe lands and the damage is split between everyone inside.', 'Now run: the spot erupts 40 yards around it 6 seconds later (Widow\'s Kiss).', 'Everyone is clear. Walk or use a speed boost. Gateway into a soak, never out of one (orbs land on the path).'],
          note: 'Soaking leaves Guillotined (the next axe hits you 500% harder), so two soak groups take turns: group 1 takes this axe, group 2 the next.',
          m: { note: null, name: 'Guillotine (Planned soakers, immunities on the second)', what: 'An axe drops on a player; 5 or more must share its 9-yard circle, then everyone gets 40 yards away before it erupts. On Mythic, soaking leaves you Guillotined for the rest of the fight, so every soak is planned.',
            do: ['The axe target is gated into the back corner. Externals and a Zephyr go on them.', 'Soak 1 is big (6 or 7): everyone who will immune soak 2, plus tanky players with a defensive.', 'The axe lands and the damage is split. Players with the debuff can\'t be picked for the next axe.', 'Walk out of the 40-yard eruption. There is plenty of time; gate in, never out.', 'Soak 2 is exactly five: both tanks with a defensive, both Hunters in Turtle, and Blessing of Protection on the target.'],
            plan: ['Phase 1 has two axes; phase 3 has three.', 'Why the Hunters soak the first axe: anyone carrying the debuff can\'t be targeted, so a Hunter can\'t be picked for axe 2 and leave the soak one short.', 'Good soak 1 extras: Shadow Priest (Dispersion), a Warrior (walls work well, the phase 1 axe is physical), a Rogue (Feint).', 'Phase 1 axes are physical: Blessing of Protection on the target works. Phase 3 axes are magic: a Rogue\'s Cloak and Blessing of Spellwarding (or a Paladin\'s Bubble) work instead, and big externals go on the target.', 'In phase 3 the first axe goes to the star marker, the second and third to the square.', 'Last axe of phase 3: send everyone who is free of the debuff. Five is the minimum and four wipes, so over-send.'] },
          map: (d) => {
            if (d === 'm') return GDZ_CA_M.axe();
            const k = gdzKit('The Coiled Altar', 13), C = [36, -36], grp = ['m5', 'm6', 'r6', 'h3'];
            k.boss('zj', 'Zul\'jan', 0, 0, 10); gdzCaRaid(k, ['r3'].concat(grp));
            k.at(0, 'r3', 20, 0).at(0, ['m5', 'm6'], 6, 18, 2).at(0, 'r6', 22, 6).at(0, 'h3', 16, 14);
            k.ring({ on: 'r3', r: 9, fx: 'soak', t0: 1, at: 6, dur: 5.8, color: '#f24824', cn: 'Guillotine', legend: '9-yard soak, 5 or more inside' });
            k.hold(1, 'r3').at(3.2, 'r3', C[0], C[1]); grp.forEach((id, i) => { const [dx, dy] = gdzSpot(i + 1, 5, 4); k.hold(2, id).at(4.6, id, C[0] + dx, C[1] + dy); });
            k.ring({ x: C[0], y: C[1], r: 40, fx: 'burst', t0: 6, at: 12, dur: 6.6, color: '#9ff26d', cn: 'Widow\'s Kiss', legend: 'erupts 40 yards around the spot, 6 s after' });
            ['r3'].concat(grp).forEach((id, i) => { k.ok(id, 6); const [dx, dy] = gdzSpot(i, 5, 5); k.hold(6.3, id).at(10.6, id, -4 + dx, 6 + dy); });
            k.ring1(['r3']).step(1).step(2.4).step(6).step(6.4).step(11);
            return k.done({ title: 'Guillotine', focus: { x: 16, y: -14, r: 26 }, hlLabel: 'player with the axe', goodLabel: 'in the soak' });
          } },
      ],
      tiles: [
        { name: 'Fangs of the Coiled Altar (Avoid the puddles)', do: 'Raid damage each cast, and the altar\'s mouths spit big green puddles at the sides that grow every cast. Stay out of them. The tank takes extra poison from his next hits.' },
        { name: 'Axegrinder (Dodge the axes)', do: 'Axes roll around the room for 3 minutes and knock you back. They kill a lot of melee. If you must pick, stand in a puddle rather than in an axe.', m: { do: 'Axes roll around at random and never go away; three or four can sit in melee at once. Ranged: stay out of melee. Pick a puddle over an axe, and don\'t get knocked into a purple orb.' } },
        { name: 'Venomfang (Dispel fast)', do: 'A poison on players. Dispel it quickly. Poison Cleansing Totem handles it on its own.' },
        { only: 'm', name: 'Into phase 2 (Stack cooldowns)', spell: 'Venom Rupture', do: 'You go in with 9 to 11 orb stacks. Group up in a spot clear of axes, and use Darkness, Anti-Magic Zone and Spirit Link Totem. Stay inside until the stacks drop. Kill Zul\'jan around the pools.' },
      ] },
    { id: 'p2', name: 'Phase 2: Malacrass', sum: 'Hex Lord Malacrass takes over. Mind controls, ghosts led into the frontal, bombs, adds, and a shield to break.',
      m: { sum: 'Malacrass. Mind controls always stack on the square marker, ghosts get frozen apart and swept by the frontal, bombs go on the adds, and every second set brings the shield.' },
      mechs: [
        { name: 'Dreadmarch (Stack them, then pile the ghosts)', spell: 'Dreadmarch', what: 'A few players are mind controlled and walk toward the edge with a big shield on them. When they\'re free, two ghosts chase each of them. A ghost only moves while its target isn\'t looking at it.',
          do: ['A few players are mind controlled and start walking toward the edge.', 'Bring them to the set spot, stun or root them there, and break their shields. They press a macro to cancel speed boosts and shields.', 'Once free, they stand still until their ghosts spawn: two each.', 'Lead your ghosts into one pile in front of the boss, then turn and look at them so they freeze.', 'Soul Sever, the tank frontal, removes every ghost in its cone. Anyone it hits must pick up their 3 Soul Fragments or die.'],
          note: 'A ghost that reaches its player mind controls them again.',
          m: { name: 'Dreadmarch (Stack on square, freeze your ghosts)', what: 'A few players are mind controlled with a big shield. When freed, two ghosts chase each of them. Only you can see your ghosts, and two ghosts touching kills both of their players.',
            do: ['A few players get the arrow over their head: they press the cancel macro, and everyone stacks on the square marker.', 'Stun or root them on the square (Ring of Peace, Leg Sweep, Shockwave, Ursol\'s Vortex, Mass Grip, Chaos Nova) and break the shields.', 'Freed players stand still: the ghosts spawn where you stand, so they land near the square. Look at yours at once.', 'Ghosts stay frozen apart. Only someone whose ghost is outside the frontal lets it creep into the cone.', 'The boss tank steps toward the diamond or the circle, whichever lines Soul Sever up with the most ghosts, and the frontal wipes them out.'],
            plan: ['The cancel macro removes your speed boosts and shields (Power Word: Shield, Void Shield and the like) so the stack can break you out fast. Press it only if you were picked.', 'Put an air-horn sound alert on the ghost fixate, so you turn and look right away.', 'A ghost the frontal missed is fine: walk it back toward the square for the next one.', 'One tank took every phase 2 frontal: a defensive on the odd ones, a defensive and two externals on the even ones. The stacks fall off before the third.', 'After the kicks, the other tank taunts the boss back to the square, so the Mages can hit the shields on the mind controls.', 'End of the phase: if your ghost is still up, keep looking at it and it vanishes at the transition. The transition knocks you back: stay off the edge.'],
            note: 'Kicking Wail of Terror shows every ghost to everyone for a moment.' },
          map: (d) => {
            if (d === 'm') return GDZ_CA_M.ghosts();
            const k = gdzKit('The Coiled Altar', 13);
            k.boss('hm', 'Malacrass', 0, 0, 10);
            k.at(0, 't1', 0, 3).at(0, 't2', 7, 7).at(0, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 0, 16, 6).at(0, ['h1', 'h3', 'h4'], 15, 14, 4).at(0, ['r1', 'r3', 'r4', 'r5', 'r6', 'r7'], 20, 0, 7);
            k.at(0, 'r2', -20, 2).at(0, 'm4', -4, 18).at(0, 'h2', -14, 14);
            const mc = ['r2', 'm4', 'h2'], SP = [-16, -12];
            mc.forEach((id, i) => { k.ring({ on: id, r: 3, fx: 'debuff', t0: 1, dur: 5, color: '#b65cff', cn: 'Dreadmarch', legend: 'mind controlled, shielded' }); k.tag(id, 'MC', 1, 6); const [dx, dy] = gdzSpot(i, 3, 2); k.hold(1, id).at(4.2, id, SP[0] + dx, SP[1] + dy).hold(6.6, id); });
            mc.forEach((id, i) => { for (let j = 0; j < 2; j++) { const g = 'g' + i + j, p = k.posAt(id, 6), a = (i * 2 + j) * 1.1, q = i * 2 + j; k.obj(g, 'ghost', 6, p[0] + Math.cos(a) * 6, p[1] + Math.sin(a) * 6).show(g, 6, 12);
              const [ex, ey] = gdzSpot(q, 6, 4); k.obj(g, 'ghost', 7, p[0] + Math.cos(a) * 6, p[1] + Math.sin(a) * 6).obj(g, 'ghost', 9.6, ex, -13 + ey); } });
            mc.forEach((id, i) => { k.at(9, id, -3 + i * 3, -16).at(10.2, id, -14 + i * 2, -7 + i); });
            k.cast('hm', 'Soul Sever', 9.8, 11).cone({ from: 'hm', to: 't1', at: 11, r: 45, hit: ['g00', 'g01', 'g10', 'g11', 'g20', 'g21'] });
            k.ring1(mc).step(1).step(2).step(6).step(7).step(11);
            return k.done({ title: 'Dreadmarch and Soul Sever', focus: { x: -4, y: -4, r: 18 }, hlLabel: 'mind-controlled players', tagLabel: 'Mind controlled, with a shield' });
          } },
        { only: 'm', name: 'Gloombomb (Drop it on your add)', what: 'The two Spiteful Soulcoiler adds have a shield that blocks almost all damage until 2 Gloombombs hit each one. Each time, 2 ranged and 2 melee get a bomb that explodes 15 yards around them.',
          do: ['Bombs go out: kick the adds as soon as the Gloombomb cast appears, so they stand still.', 'Ranged bombs walk to the ranged add, melee bombs to the melee add. Everyone else stays 15 yards away. Use your best defensive: this hit is huge.', 'The bombs go off on the adds and break their shields. Now kill them.', 'Kick every Wail of Terror. The melee add\'s second kick must come from a melee player.'],
          plan: ['One add is the ranged add and the other the melee add. One player marks the ranged add and calls where both are: marked means ranged kicks, unmarked means melee kicks.', 'Which is which, by where they spawn (the plan\'s rule): an add at the moon is always ranged; an add beside the stack spot is always melee.', 'Skull add: melee if the other is at the moon, ranged if the other is at the square or star. Star add: melee if the other is at the moon or skull, ranged if the other is at the square.', 'Every second set of adds is followed by Eternal Nightfall, so the adds must die before the next set but the shield comes first.', 'The last set before the intermission doesn\'t need bombs: their shields break at the transition. Just keep kicking.'],
          map: () => GDZ_CA_M.bombs() },
      ],
      tiles: [
        { only: 'h', name: 'Gloombomb (Run out)', do: 'Marked players explode 15 yards around them. Run away from everyone first. Anyone hit must pick up their Soul Fragments.' },
        { name: 'Eternal Nightfall (Break the shield)', do: 'Malacrass shields himself and starts a cast that wipes the raid. Break the shield to stop it (save damage for it), and dodge the purple circles.', m: { do: 'Comes after every second set of adds. Assign big cooldowns to each shield and pool damage for it. Boss damage barely matters in this phase: the shield is the real damage check.' } },
        { name: 'Spiritcackle (Kick and kill)', spell: 'Wail of Terror', do: 'Adds cast Wail of Terror, a raid fear. Kick it (they teleport after each kick) and kill them before they reach full energy.', m: { do: 'Keep a kick rotation on each add (a Protection Paladin can solo the ranged one, but it isn\'t needed). Two Warlocks can Curse of Tongues every add.' } },
        { name: 'Soul Sever (Tanks swap)', do: 'The tank frontal. Swap tanks after each one, and aim it through the ghosts.', m: { do: 'One tank can take them all: a defensive on odd casts, a defensive and two externals on even ones. Aim it through as many ghosts as you can.' } },
      ] },
    { id: 'int', name: 'Intermission: Soulbinding', sum: 'Zul\'jan comes back healing himself but taking double damage. Bloodlust here.',
      mechs: [
        { name: 'Fragments of Malacrass (Stop them in turns)', what: 'Zul\'jan heals 2% a second for 35 seconds but takes double damage. Fragments walk to him and each one that arrives heals him about 10%. Stopping one hits the whole raid.',
          do: ['Zul\'jan heals himself but takes double damage. Use Bloodlust, potions and every cooldown.', 'Fragments spawn around the room and walk toward him.', 'Step in their path to stop them. Each one you stop hits the whole raid (Spirit Erasure).', 'Stop them a couple at a time, spread out, with healing cooldowns ready.'],
          m: { name: 'Fragments of Malacrass (3 to 5, then 7 to 10)', what: 'Zul\'jan heals 2% a second but takes double damage. Each fragment that reaches him heals him about 10%, nearly a wipe. Each stop hits the raid and makes the next one 20% stronger for 2 seconds.',
            do: ['Bloodlust, potions and every cooldown. You held damage at the end of phase 2 for this.', 'Fragments spawn at the edges, and one sneaky one on the inner ring. Mobile healers and the off-tank cover their areas; the rest circle the boss.', 'Stop 3 to 5, then let the stacks fall off.', 'Again: 3 to 5, wait, and repeat (about five times).', 'Near the end, stack raid cooldowns in the middle and stop 7 to 10 at once.'],
            plan: ['Spots: the mobile healers spread to the four sides, the priests stay near the melee (they\'re less mobile), and the off-tank soaks far fragments.', 'The Augmentation Evoker, the Hunters and the Warlocks stand together on one side, so the Augmentation buffs land on the right people for the burn.', 'Melee play defence: you\'re the most mobile, so make sure none get in.', 'Getting Zul\'jan under about 35% here puts you in kill range.'] },
          map: (d) => {
            if (d === 'm') return GDZ_CA_M.frags();
            const k = gdzKit('The Coiled Altar', 12);
            k.boss('zj', 'Zul\'jan', 0, 0, 6);
            k.at(0, 't1', 0, 0).at(0, 't2', 4, 1).at(0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 0, 12, 5).at(0, ['h1', 'h2', 'h3', 'h4'], -10, 4, 4).at(0, ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], 12, 0, 6);
            const F = [[-46, 30], [46, 32], [-44, -26], [44, -30], [-14, 48], [16, 48], [-12, -48], [14, -46]];
            const T = [3.6, 3.8, 5.6, 5.8, 7.6, 7.8, 9.6, 9.8], W = ['r1', 'm6', 'r2', 'm7', 'h1', 'r4', 'm3', 'r6'];
            F.forEach(([x, y], i) => { const id = 'f' + i, who = W[i], ts = T[i], tgt = [x * 0.45, 6 + (y - 6) * 0.45];
              k.add(id, 'Fragment of Malacrass', 0, x, y).add(id, 'Fragment of Malacrass', ts, tgt[0], tgt[1]).show(id, 0, ts + 0.1);
              const sa = k.posAt(who, 0); k.at(ts - 2.2, who, sa[0], sa[1]).at(ts, who, tgt[0], tgt[1]).at(ts + 2.2, who, sa[0], sa[1]);
              k.ring({ on: who, r: 3, fx: 'burst', t0: ts - 1.2, at: ts, dur: 1.4, color: '#b65cff', cn: 'Spirit Erasure', legend: 'a stop: hits the whole raid' }).ring1(who); });
            k.step(0).step(1).step(3.6).step(5.6);
            return k.done({ title: 'Fragments of Malacrass', focus: { x: 0, y: 4, r: 18 }, hlLabel: 'players stopping a fragment' });
          } },
      ] },
    { id: 'p3', name: 'Phase 3: Coiled Union', sum: 'Both bosses at once, with everything from phases 1 and 2 together.',
      m: { sum: 'Both bosses, everything at once. Play on the star and square side; purples are all that matter; kill Zul\'jan before his next pool cast.' },
      mechs: [
        { only: 'm', name: 'Blighted Sever (All purples in one diamond)', what: 'The frontal is bigger now and hits orbs and ghosts. The first one takes every purple orb at once, set out in a diamond; green orbs go to one side.',
          do: ['Orbs land. Orb carriers now: both Mages, the off-tank and the Evoker healer.', 'Everyone clears green orbs out of the middle and lines them up on one side. A missed green is survivable; a missed purple wipes.', 'The carriers build a diamond of purples in the middle, each well clear of the others. Use a purple that\'s already in place.', 'The off-tank takes the first phase 3 frontal and aims it through the whole diamond.'],
          plan: ['Gloombomb with no adds up: just run to the edge of the room, away from the raid. Speed boosts help.', 'The next orb sets are built around the circle and diamond markers: the circle side gets its frontal first (two purples by the circle).', 'Damage: kill Zul\'jan before his pool cast, about a minute after the second shield, because every orb blows up then. Malacrass at 7 or 8% when Zul\'jan dies is fine. Don\'t over-damage Malacrass.', 'The last frontals hit 0 or 1 orbs. The last adds just need kicks.', 'Axes in phase 3: the first at the star marker, the second and third at the square.'],
          map: () => GDZ_CA_M.diamond() },
      ],
      tiles: [
        { name: 'Soulbound (Kill them together)', do: 'When one boss dies, the other gets 500% stronger. Keep their health close and kill them at the same time.', m: { do: 'When one dies the other gets 500% stronger. Kill Zul\'jan first, before his pool cast, with Malacrass around 7 to 8%.' } },
        { only: 'h', name: 'Blighted Sever (Orbs and ghosts)', do: 'The frontal now hits orbs and ghosts both, and anyone it hits gets Gravebound: pick up your Soul Fragments.' },
        { name: 'Defilement (Tanks swap)', do: 'Replaces Fangs: ground that puts heal absorbs on you, and a poison on the tank that forces swaps.' },
        { name: 'Grim Guillotine (Soak with 5, then run)', do: 'The axe again, now shadow damage. Same plan: five inside, then 40 yards away.', m: { name: 'Grim Guillotine (Star, then square)', do: 'Three axes, now magic. The first goes to the star, the next two to the square. The second uses Cloak, Spellwarding or Bubble; on the last, send everyone without the debuff.' } },
      ] },
  ],
  roles: {
    t: ['Swap on every frontal: the other tank taunts just before Sever or Soul Sever.', 'Aim Sever through the orb pile and Soul Sever through the ghosts.', 'Phase 3: Corrupted Toxin also forces swaps.'],
    h: ['Dispel Venomfang fast (Poison Cleansing Totem does it on its own).', 'Each popped orb hits the raid: be ready when the frontal lands.', 'Going into phase 2 the orb stacks are high: stack raid cooldowns there.', 'Intermission: every fragment stop hits the raid, so keep cooldowns ready.'],
    d: ['Carry orbs to the pile in front of the boss (5 seconds each).', 'Soak the axe when it\'s your group\'s turn, then run 40 yards.', 'Break Dreadmarch shields and the Eternal Nightfall shield fast.', 'Bloodlust in the intermission: Zul\'jan takes double damage.', 'Phase 3: kill both bosses together.'],
  },
};
GDZ['The Coiled Altar'].m.roles = {
  t: ['Boss tank: a sturdy tank (Blood Death Knight, Guardian Druid or Protection Warrior) holds the boss.', 'Off-tank: a mobile tank runs purple orbs and taunts for the entrance frontal. Protection Paladin is best, but any mobile tank works.', 'Phase 2: one tank can take every Soul Sever (two externals on the even ones); step to the diamond or circle to line it up with the ghosts.', 'Soak the second phase 1 axe with a defensive.'],
  h: ['Five healers: lots of raid damage, and you hold damage often anyway.', 'Into phase 2 at 9 to 11 orb stacks: stack Spirit Link and raid cooldowns.', 'Intermission: mobile healers cover the four sides; save the big cooldowns for the 7-to-10 turn.', 'Mobile healers (Evoker especially) can carry purples between mechanics; in phase 3 the Evoker healer is a carrier.'],
  d: ['Greens only, unless you\'re assigned purples (Warlocks in phase 1, Mages all fight). Clear greens out of purple carriers\' way first.', 'Hunters: soak axe 1, then Turtle on axe 2. Rogues: Feint on axe 1, Cloak in phase 3.', 'Gloombomb: take it to your add (ranged to the ranged add, melee to the melee add) and use your best defensive.', 'Pool damage and cooldowns for every Eternal Nightfall shield; boss damage barely matters in phase 2.', 'Bloodlust in the intermission. Phase 3: kill Zul\'jan before his pool cast; don\'t over-damage Malacrass.'],
};

// ---- the page ----
function gdzView() {
  gdzCss();
  const have = GDZ_ORDER.filter((b) => GDZ[b]);
  if (!S.gdzBoss || !GDZ[S.gdzBoss]) S.gdzBoss = S.rep && S.rep.item && GDZ[S.rep.item.boss] ? S.rep.item.boss : have[0];
  // Heroic or Mythic: each its own guide (your call, Oct 20: positions change a lot between them). It opens on the open pull's
  // difficulty. A part can be one difficulty only (only: 'h' / 'm') or change on one (h: { .. } / m: { .. } over the shared fields).
  if (!S.gdzDiff) S.gdzDiff = S.rep && S.rep.item && S.rep.item.diffId === 16 ? 'm' : 'h';
  const D = S.gdzDiff, own = (o) => (!o || (o.only && o.only !== D) ? null : Object.assign({}, o, o[D] || {}));
  const boss = S.gdzBoss, G0 = GDZ[boss], G = G0 && own(G0);
  if (G) { G.phases = G.phases.map(own).filter(Boolean).map((p) => ({ ...p, mechs: (p.mechs || []).map(own).filter(Boolean), tiles: (p.tiles || []).map(own).filter(Boolean) })); G.facts = (G.facts || []).filter((x) => !x[2] || x[2] === D); }
  if (!G) { view('<div class="gdz"><p class="muted">No guides yet.</p></div>'); return; }
  const H = BOSS_HERO[boss], hero = H ? 'https://wow.zamimg.com/uploads/guide/header/' + H[0] + '.jpg' : '';
  const pick = '<nav class="gdz-pick" aria-label="Pick a boss">' + GDZ_ORDER.map((b) => '<button type="button" class="gdz-pb' + (b === boss ? ' on' : '') + (GDZ[b] ? '' : ' soon') + '" data-b="' + esc(b) + '"' + (GDZ[b] ? '' : ' disabled title="Coming soon"') + '>' + esc(b.replace(/ the (Soulcoiler|Malignant)$/, '')) + '</button>').join('') + '</nav>';
  const head = '<header class="gdz-hero"' + (hero ? ' style="--gdz-art:url(\'' + hero + '\');--gdz-pos:' + H[1] + '%"' : '') + '><div class="gdz-hin"><div class="gdz-kick">Boss guide</div><div class="gdz-diff" role="tablist" aria-label="Difficulty">' + [['h', 'Heroic'], ['m', 'Mythic']].map(([k, n]) => '<button type="button" role="tab" data-d="' + k + '" class="' + (k === D ? 'on' : '') + '" aria-selected="' + (k === D) + '">' + n + '</button>').join('') + '</div><h2>' + esc(boss) + '</h2><p>' + esc(G.sum) + '</p>' +
    (G.source ? '<p class="gdz-src">Based on ' + esc(G.source) + '.</p>' : '') + '<div class="gdz-facts">' + (G.facts || []).map(([l, v]) => '<div class="gdz-fact"><span>' + esc(l) + '</span><b>' + esc(v) + '</b></div>').join('') + '</div></div></header>';
  const phNav = '<nav class="gdz-phn">' + G.phases.map((p, i) => '<a href="#gdz-' + p.id + '" class="gdz-phc"><i>' + (i + 1) + '</i><span>' + esc(p.name) + '</span></a>').join('<span class="gdz-arr" aria-hidden="true">›</span>') + (G.phases.some((p) => (p.mechs || []).some((m) => m.map)) ? '<span class="gdz-arr" aria-hidden="true">›</span><a href="#gdz-all" class="gdz-phc"><i>★</i><span>Putting it all together</span></a>' : '') + '</nav>';
  const keyRow = '<div class="gdz-key">' + Object.entries(GDZ_ROLE).map(([, [n, c, ic]]) => '<span><img src="https://wow.zamimg.com/images/wow/icons/medium/' + ic + '.jpg" alt="" style="border-color:' + c + '">' + n + '</span>').join('') + '<span class="gdz-keyn">On the maps. Positions are examples.</span></div>';
  let mi = 0; const maps = [];
  const sec = (p, i) => '<section class="gdz-sec" id="gdz-' + p.id + '"><div class="gdz-sh"><i>' + (i + 1) + '</i><div><h3>' + esc(p.name) + '</h3><p>' + esc(p.sum) + '</p></div></div>' +
    (p.mechs || []).map((m) => { const n = mi++; maps.push(m); return '<article class="gdz-m">' + (m.map ? '<div class="gdz-mapc"><div class="gdz-mm" data-i="' + n + '"></div></div>' : '') +
      '<div class="gdz-mt"><h4>' + spellIcon(0, m.spell || m.name.replace(/ \(.*$/, '')) + '<span>' + esc(m.name) + '</span></h4><p class="gdz-what">' + esc(m.what) + '</p>' +
      (m.do && m.do.length ? '<ol class="gdz-steps" data-i="' + n + '">' + m.do.map((d, j) => '<li data-j="' + j + '"><span>' + esc(d) + '</span></li>').join('') + '</ol>' : '') +
      (m.plan && m.plan.length ? '<details class="gdz-plan"><summary>Full plan <span>' + m.plan.length + ' details: who, where and when</span></summary><ul>' + m.plan.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></details>' : '') +
      (m.note ? '<div class="gdz-my"><b>' + (D === 'm' ? 'Mythic' : 'Heroic') + '</b>' + esc(m.note) + '</div>' : '') + '</div></article>'; }).join('') +
    ((p.tiles || []).length ? '<div class="gdz-tiles">' + p.tiles.map((t) => '<div class="gdz-tile"><h5>' + spellIcon(0, t.spell || t.name.replace(/ \(.*$/, '')) + '<span>' + esc(t.name) + '</span></h5><p>' + esc(t.do) + '</p>' + (t.note ? '<p class="gdz-tmy">' + esc(t.note) + '</p>' : '') + '</div>').join('') + '</div>' : '') + '</section>';
  const roles = G.roles ? '<section class="gdz-sec gdz-roles"><div class="gdz-sh"><i>★</i><div><h3>Your job, by role</h3><p>The short version for each role.</p></div></div><div class="gdz-rgrid">' +
    [['t', 'Tanks'], ['h', 'Healers'], ['d', 'DPS']].map(([k, n]) => '<div class="gdz-role gdz-r' + k + '"><h5>' + n + '</h5><ul>' + (G.roles[k] || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>').join('') + '</div></section>' : '';
  // Putting it all together (your idea, Oct 20): every map of this guide joined in fight order on one map, with each step
  // showing up as it plays and a chapter per mechanic to jump to
  const hasMaps = G.phases.some((p) => (p.mechs || []).some((m) => m.map));
  const whole = hasMaps ? '<section class="gdz-sec" id="gdz-all"><div class="gdz-sh"><i>★</i><div><h3>Putting it all together</h3><p>The whole fight on one map, start to finish. Each step shows up as it happens; pick a chapter to jump there.</p></div></div>' +
    '<article class="gdz-m gdz-whole"><div class="gdz-mapc"><div class="gdz-mm" data-w="1"></div></div><div class="gdz-mt"><div class="gdz-now"></div><ol class="gdz-chaps"></ol></div></article></section>' : '';
  view('<div class="gdz">' + pick + head + phNav + keyRow + G.phases.map(sec).join('') + whole + roles + '<p class="gdz-foot">' + (D === 'm' ? 'Mythic' : 'Heroic') + ' guide. ' + (G.source ? 'Based on ' + esc(G.source) + ', in our own words.' : 'From the guides, in our own words.') + ' The maps are examples of where to stand, not a real pull.</p></div>');
  const root = document.querySelector('#view .gdz');
  root.querySelectorAll('.gdz-pb:not(.soon)').forEach((b) => (b.onclick = () => { S.gdzBoss = b.dataset.b; gdzView(); window.scrollTo({ top: Math.min(window.scrollY, (document.querySelector('#view').getBoundingClientRect().top + window.scrollY) - 70) }); }));
  root.querySelectorAll('.gdz-diff button').forEach((b) => (b.onclick = () => { if (b.dataset.d === D) return; S.gdzDiff = b.dataset.d; const y = window.scrollY; gdzView(); window.scrollTo({ top: y }); }));
  root.querySelectorAll('.gdz-phc').forEach((a) => (a.onclick = (e) => { e.preventDefault(); const el = document.getElementById(a.getAttribute('href').slice(1)); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); }));
  // the maps: built when they're first near the screen, then played by the Debriefing's own player
  const pmap = gdzPmap();
  const mountWhole = (box) => {
    const key = boss + '|' + D + '|whole'; let W = GDZ_CACHE.get(key);
    if (!W) { try { W = gdzWhole(boss, G, D); } catch (e) { console.error(e); box.innerHTML = '<p class="muted">This map could not be drawn.</p>'; return; } GDZ_CACHE.set(key, W); }
    box.innerHTML = miniMap(W.mp, pmap); bindZoom(box); hydrateMapIcons(box);
    const art = box.closest('.gdz-m'), now = art.querySelector('.gdz-now'), ol = art.querySelector('.gdz-chaps');
    ol.innerHTML = W.chaps.map((c, i) => '<li data-c="' + i + '"><i>' + c.ph + '</i><span><b>' + esc(c.name) + '</b><em>' + esc(c.phase) + '</em></span></li>').join('');
    const lis = [...ol.children], cap = document.createElement('div'); cap.className = 'gdz-cap'; (box.querySelector('.zanim') || box).after(cap);
    let cur = -2;
    box._onFrame = (ft) => { let j = -1, c = 0; W.caps.forEach((q, i) => { if (ft >= q.t - 0.01) j = i; }); W.chaps.forEach((q, i) => { if (ft >= q.t - 0.01) c = i; });
      const key2 = j + '|' + c; if (key2 === cur) return; cur = key2; const q = j >= 0 && W.caps[j].name === W.chaps[c].name ? W.caps[j] : null, ch = W.chaps[c];
      now.innerHTML = '<div class="gdz-nowph">' + esc(ch.phase) + '</div><h4>' + esc(ch.name) + '</h4>' + (q ? '<p><i>' + (q.j + 1) + '</i><span>' + esc(q.text) + '</span></p>' : '<p class="gdz-nowwait">Getting into position…</p>');
      cap.innerHTML = q ? '<i>' + (q.j + 1) + '</i><span><b>' + esc(ch.name.replace(/ \(.*$/, '')) + ':</b> ' + esc(q.text) + '</span>' : '<span><b>' + esc(ch.name) + '</b></span>';
      lis.forEach((li, i) => { li.classList.toggle('on', i === c); li.classList.toggle('past', i < c); }); };
    lis.forEach((li, i) => (li.onclick = () => { const rng = box.querySelector('.zrange'); if (!rng) return; let fi = 0; W.mp.frames.forEach((fr, z) => { if (fr.t <= W.chaps[i].t + 0.3) fi = z; }); rng.value = fi; rng.dispatchEvent(new Event('input')); }));
    bindAnim(box, W.mp, pmap, true);
  };
  const mount = (box) => {
    if (box._on) return; box._on = 1; if (box.dataset.w) { mountWhole(box); return; } const m = maps[+box.dataset.i], key = boss + '|' + D + '|' + m.name;
    let mp = GDZ_CACHE.get(key); if (!mp) { try { mp = m.map(D); } catch (e) { console.error(e); box.innerHTML = '<p class="muted">This map could not be drawn.</p>'; return; } GDZ_CACHE.set(key, mp); }
    box.innerHTML = miniMap(mp, pmap); bindZoom(box); hydrateMapIcons(box);
    const ol = root.querySelector('.gdz-steps[data-i="' + box.dataset.i + '"]'), lis = ol ? [...ol.children] : [], st = mp.steps || [];
    // (each step lights while it plays; clicking one jumps the map there)
    if (lis.length && st.length) {
      // (on a phone the list sits under the map, out of view: the step playing also shows as a caption right under the map)
      const cap = document.createElement('div'); cap.className = 'gdz-cap'; (box.querySelector('.zanim') || box).after(cap);
      let cur = -1; box._onFrame = (ft) => { let j = -1; st.forEach(([t], q) => { if (ft >= t - 0.01) j = q; }); if (j !== cur) { cur = j; lis.forEach((li, q) => { li.classList.toggle('on', q === j); li.classList.toggle('past', q < j); });
        cap.innerHTML = j < 0 ? '' : '<i>' + (j + 1) + '</i><span>' + esc(m.do[j] || '') + '</span>'; } };
      lis.forEach((li, q) => { if (!st[q]) return; li.classList.add('go'); li.onclick = () => { const rng = box.querySelector('.zrange'); if (!rng) return; let fi = 0; mp.frames.forEach((f, z) => { if (f.t <= st[q][0] + 0.3) fi = z; }); rng.value = fi; rng.dispatchEvent(new Event('input')); }; });
    }
    bindAnim(box, mp, pmap, true);
  };
  const boxes = [...root.querySelectorAll('.gdz-mm')];
  if (typeof IntersectionObserver !== 'undefined') { const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { io.unobserve(e.target); mount(e.target); } }, { rootMargin: '300px 0px' }); boxes.forEach((b) => io.observe(b)); }
  else boxes.forEach(mount);
  refreshIcons();
}

// the page's look (its own gdz- names, kept here with the code)
function gdzCss() {
  if (document.getElementById('gdz-css')) return;
  const st = document.createElement('style'); st.id = 'gdz-css';
  st.textContent = `
.gdz { display: flex; flex-direction: column; gap: 18px; padding-bottom: 30px; }
.gdz-pick { display: flex; flex-wrap: wrap; gap: 6px; }
.gdz-pb { background: var(--panel); border: 1px solid var(--line); color: var(--muted); border-radius: 999px; padding: 5px 12px; font-size: 13px; font-weight: 600; cursor: pointer; }
.gdz-pb:hover:not(.soon) { color: var(--text); border-color: var(--line2); }
.gdz-pb.on { background: var(--gold); color: var(--gold-ink); border-color: var(--gold); }
.gdz-pb.soon { opacity: .4; cursor: default; }
.gdz-hero { position: relative; border-radius: var(--r); overflow: hidden; border: 1px solid var(--line); background: var(--panel); min-height: 190px; display: flex; align-items: flex-end; }
.gdz-hero::before { content: ''; position: absolute; inset: 0; background: var(--gdz-art) var(--gdz-pos, 50%) 28% / cover no-repeat; opacity: .55; }
.gdz-hero::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(15,17,23,.97) 0%, rgba(15,17,23,.85) 45%, rgba(15,17,23,.25) 100%); }
.gdz-hin { position: relative; z-index: 1; padding: 20px 22px; max-width: 640px; }
.gdz-kick { font: 700 12px var(--head); letter-spacing: .12em; text-transform: uppercase; color: var(--gold); }
.gdz-diff { display: inline-flex; margin: 8px 0 4px; background: rgba(15,17,23,.8); border: 1px solid var(--line2); border-radius: 999px; padding: 3px; gap: 2px; }
.gdz-diff button { background: none; border: 0; border-radius: 999px; padding: 4px 16px; font: 700 14px var(--head); color: var(--muted); cursor: pointer; }
.gdz-diff button:hover { color: var(--text); }
.gdz-diff button.on { background: var(--gold); color: var(--gold-ink); }
.gdz-diff button[data-d="m"].on { background: #a36cff; color: #12091f; }
.gdz-hin h2 { font: 700 30px/1.1 var(--head); margin: 2px 0 6px; }
.gdz-hin p { margin: 0 0 12px; color: var(--text); }
.gdz-hin p.gdz-src { margin: -6px 0 12px; font-size: 13px; color: var(--muted); }
.gdz-facts { display: flex; flex-wrap: wrap; gap: 8px; }
.gdz-fact { background: rgba(15,17,23,.75); border: 1px solid var(--line2); border-radius: 8px; padding: 6px 11px; display: flex; flex-direction: column; min-width: 92px; }
.gdz-fact span { font-size: 11.5px; color: var(--muted); }
.gdz-fact b { font: 700 15px var(--head); }
.gdz-phn { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.gdz-phc { display: inline-flex; align-items: center; gap: 7px; text-decoration: none; background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 6px 11px 6px 7px; font-weight: 600; font-size: 14px; }
.gdz-phc:hover { border-color: var(--gold); }
.gdz-phc i, .gdz-sh i { font-style: normal; display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--gold); color: var(--gold-ink); font: 800 12.5px var(--head); flex: none; }
.gdz-arr { color: var(--faint); font-size: 18px; }
.gdz-key { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; font-size: 13px; color: var(--muted); }
.gdz-key span { display: inline-flex; align-items: center; gap: 6px; }
.gdz-key img { width: 20px; height: 20px; border-radius: 50%; border: 2px solid; }
.gdz-keyn { color: var(--faint); }
.gdz-sec { display: flex; flex-direction: column; gap: 14px; scroll-margin-top: 70px; }
.gdz-sh { display: flex; gap: 12px; align-items: flex-start; border-bottom: 1px solid var(--line); padding-bottom: 10px; }
.gdz-sh i { width: 30px; height: 30px; font-size: 15px; margin-top: 2px; }
.gdz-sh h3 { font: 700 22px/1.2 var(--head); margin: 0; }
.gdz-sh p { margin: 2px 0 0; color: var(--muted); }
.gdz-m { display: grid; grid-template-columns: minmax(0, 520px) minmax(0, 1fr); gap: 20px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 16px; align-items: start; }
.gdz-m:not(:has(.gdz-mapc)) { grid-template-columns: 1fr; }
.gdz-mm .sub:first-child { display: none; }
.gdz-mm .zwrap { max-width: none !important; }
.gdz-mm svg.zmap { max-width: none !important; }
.gdz-mt h4 { font: 700 19px/1.25 var(--head); margin: 0 0 6px; display: flex; align-items: center; gap: 8px; }
.gdz-mt h4 img { width: 26px; height: 26px; border-radius: 5px; }
.gdz-what { margin: 0 0 12px; color: var(--text); }
.gdz-steps { list-style: none; counter-reset: gs; margin: 0 0 12px; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.gdz-steps li { counter-increment: gs; display: flex; gap: 10px; align-items: flex-start; padding: 7px 10px; border-radius: 8px; border: 1px solid transparent; color: var(--muted); transition: background .25s, color .25s, border-color .25s; }
.gdz-steps li::before { content: counter(gs); flex: none; width: 21px; height: 21px; border-radius: 50%; display: grid; place-items: center; background: var(--raised); border: 1px solid var(--line2); font: 800 12px var(--head); color: var(--muted); margin-top: 1px; }
.gdz-steps li.go { cursor: pointer; }
.gdz-steps li.go:hover { background: var(--raised); }
.gdz-steps li.past { color: var(--text); }
.gdz-steps li.on { background: rgba(230,180,80,.1); border-color: rgba(230,180,80,.45); color: var(--text); }
.gdz-steps li.on::before { background: var(--gold); color: var(--gold-ink); border-color: var(--gold); }
.gdz-my { background: rgba(163,108,255,.1); border: 1px solid rgba(163,108,255,.4); border-radius: 8px; padding: 8px 11px; font-size: 14px; }
.gdz-my b { display: inline-block; background: #a36cff; color: #12091f; font: 800 11px var(--head); letter-spacing: .06em; text-transform: uppercase; border-radius: 4px; padding: 1px 6px; margin-right: 8px; }
.gdz-plan { margin: 0 0 12px; border: 1px solid var(--line2); border-radius: 8px; background: var(--raised); }
.gdz-plan summary { cursor: pointer; padding: 8px 12px; font: 700 15px var(--head); list-style: none; display: flex; align-items: center; gap: 8px; }
.gdz-plan summary::-webkit-details-marker { display: none; }
.gdz-plan summary::before { content: '›'; display: inline-block; transition: transform .2s; color: var(--gold); font-size: 18px; line-height: 1; }
.gdz-plan[open] summary::before { transform: rotate(90deg); }
.gdz-plan summary span { font: 400 13px var(--body); color: var(--muted); }
.gdz-plan ul { margin: 0; padding: 0 14px 12px 32px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; }
.gdz-whole .gdz-mt { display: flex; flex-direction: column; gap: 12px; }
.gdz-now { background: rgba(230,180,80,.08); border: 1px solid rgba(230,180,80,.45); border-radius: 10px; padding: 14px 16px; min-height: 150px; }
.gdz-nowph { font: 700 12px var(--head); letter-spacing: .1em; text-transform: uppercase; color: var(--gold); }
.gdz-now h4 { font: 700 21px/1.25 var(--head); margin: 2px 0 8px; }
.gdz-now p { margin: 0; display: flex; gap: 10px; align-items: flex-start; font-size: 16px; }
.gdz-now p i { font-style: normal; flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--gold); color: var(--gold-ink); font: 800 13px var(--head); margin-top: 1px; }
.gdz-now p.gdz-nowwait { color: var(--muted); }
.gdz-chaps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
.gdz-chaps li { display: flex; gap: 10px; align-items: center; padding: 6px 10px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; color: var(--muted); }
.gdz-chaps li:hover { background: var(--raised); }
.gdz-chaps li i { font-style: normal; flex: none; width: 21px; height: 21px; border-radius: 50%; display: grid; place-items: center; background: var(--raised); border: 1px solid var(--line2); font: 800 12px var(--head); }
.gdz-chaps li span { display: flex; flex-direction: column; line-height: 1.25; }
.gdz-chaps li b { font-weight: 600; } .gdz-chaps li em { font-style: normal; font-size: 12px; color: var(--faint); }
.gdz-chaps li.past { color: var(--text); }
.gdz-chaps li.on { background: rgba(230,180,80,.1); border-color: rgba(230,180,80,.45); color: var(--text); }
.gdz-chaps li.on i { background: var(--gold); color: var(--gold-ink); border-color: var(--gold); }
.gdz-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
.gdz-tile { background: var(--panel); border: 1px solid var(--line); border-radius: var(--r); padding: 12px 14px; }
.gdz-tile h5 { font: 700 16px/1.25 var(--head); margin: 0 0 4px; display: flex; align-items: center; gap: 7px; }
.gdz-tile h5 img { width: 20px; height: 20px; border-radius: 4px; }
.gdz-tile p { margin: 0; font-size: 14px; color: var(--muted); }
.gdz-tile p.gdz-tmy { margin-top: 6px; color: #c9b3ff; }
.gdz-rgrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.gdz-role { background: var(--panel); border: 1px solid var(--line); border-top: 3px solid; border-radius: var(--r); padding: 12px 16px; }
.gdz-role h5 { font: 700 18px var(--head); margin: 0 0 6px; }
.gdz-role ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 5px; font-size: 14.5px; }
.gdz-rt { border-top-color: #5aa0ff; } .gdz-rh { border-top-color: #45d16b; } .gdz-rd { border-top-color: #ff7a5c; }
.gdz-foot { color: var(--faint); font-size: 13px; margin: 0; }
.gdz-cap { display: none; }
@media (max-width: 900px) { .gdz-m { grid-template-columns: 1fr; } .gdz-cap { display: flex; gap: 9px; align-items: flex-start; min-height: 3.2em; margin-top: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(230,180,80,.1); border: 1px solid rgba(230,180,80,.45); font-size: 14px; }
  .gdz-cap:empty { visibility: hidden; } .gdz-cap i { font-style: normal; flex: none; width: 21px; height: 21px; border-radius: 50%; display: grid; place-items: center; background: var(--gold); color: var(--gold-ink); font: 800 12px var(--head); } .gdz-rgrid { grid-template-columns: 1fr; } }
@media (max-width: 760px) { .gdz-pick { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin: 0 calc(-1 * var(--gmin)); padding: 0 var(--gmin); } .gdz-pb { flex: none; } .gdz-hin { padding: 16px; } .gdz-hin h2 { font-size: 25px; } .gdz-m { padding: 12px; } .gdz-hero::after { background: linear-gradient(0deg, rgba(15,17,23,.97) 30%, rgba(15,17,23,.6) 100%); } .gdz-arr { display: none; } }
`;
  document.head.appendChild(st);
}
