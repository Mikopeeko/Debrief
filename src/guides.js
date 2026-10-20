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
  const m = new Map(); for (const id of GDZ_RAID) { const [, color, icon] = GDZ_ROLE[id[0]]; m.set(gdzName(id), { name: gdzName(id), color, specIcon: icon, glyph: id[0] }); }
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
  const U = new Map(), A = ARENAS[boss] || { cx: 0, cy: 0 }, k = { pauses: [], calls: [], wmarks: [], rings: [], cones: [], links: [], arrows: [], tags: [], cbars: {}, steps: [], hl: new Set(), good: [], goodAt: [], bad: [], badAt: [] };
  // seg: the stretch being written (T: its start, pre: its own names for orbs, adds and bosses, w: its window); players carry on
  const seg = { T: 0, pre: '', w: null, rot: 0 }, RO = (x, y) => { if (!seg.rot || x == null || y == null) return [x, y]; const a = seg.rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a); return [Math.round((x * c - y * sn) * 1000) / 1000, Math.round((x * sn + y * c) * 1000) / 1000]; },
    RI = (p) => { if (!seg.rot || !p) return p; const a = -seg.rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a); return [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]; }, isP = (id) => /^[thmr]\d$/.test(id), P = (id) => (id == null || isP(id) ? id : seg.pre + id), TT = (t) => (t == null ? t : t + seg.T);
  const unit = (id, kind, name) => { if (!U.has(id)) U.set(id, { id, kind, name: name || (kind === 'player' ? gdzName(id) : String(id).replace(/^s\d+:/, '')), path: [], from: seg.w && kind !== 'player' ? seg.w[0] : -1, to: seg.w && kind !== 'player' ? seg.w[1] : Infinity }); return U.get(id); };
  const put = (u, t, x, y, fixed) => { u.path.push([t, x, y, !!fixed]); u.path.sort((a, b) => a[0] - b[0]); };
  const posRaw = (id, t) => { const u = U.get(id); if (!u || !u.path.length) return null; const p = u.path; if (t <= p[0][0]) return [p[0][1], p[0][2]];
    for (let i = 0; i < p.length - 1; i++) if (t <= p[i + 1][0]) { const a = p[i], b = p[i + 1], w = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return [a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w]; }
    const z = p[p.length - 1]; return [z[1], z[2]]; };
  const kit = {
    posAt: (id, t) => RI(posRaw(P(id), TT(t))), // (in the layout's own frame, so a turned layout reads back what it wrote)
    // (turn the layout that follows by deg (counterclockwise): a plan drawn one way round, fitted to the room)
    rot(deg) { seg.rot = deg || 0; return kit; },
    // one player (id like 'm3') at a spot at a moment; or a group of players in a clump around a spot
    at(t, ids, x, y, spread, fixed) { ids = [].concat(ids); ids.forEach((id, i) => { const [dx, dy] = spread ? gdzSpot(i, ids.length, spread) : [0, 0]; const q0 = RO(x + dx, y + dy); put(unit(id, 'player'), TT(t), q0[0], q0[1], fixed); }); return kit; },
    // the same players stay where they are until t (so the next move starts then, not from the start)
    hold(t, ids) { for (const id of [].concat(ids)) { const p = posRaw(id, TT(t)); if (p) put(unit(id, 'player'), TT(t), p[0], p[1], true); } return kit; }, /* (a hold is a wait: the speed limit never moves it earlier) */
    boss(id, name, t, x, y) { const q0 = RO(x, y); put(unit(P(id), 'boss', name), TT(t), q0[0], q0[1]); return kit; },
    add(id, name, t, x, y) { const q0 = RO(x, y); put(unit(P(id), 'add', name), TT(t), q0[0], q0[1]); return kit; },
    // orbs ('orb' green, 'porb' purple) and ghosts ('ghost'): from when they appear, until they're gone
    obj(id, kind, t, x, y) { const q0 = RO(x, y); put(unit(P(id), kind), TT(t), q0[0], q0[1]); return kit; },
    show(id, from, to) { const u = U.get(P(id)); if (u) { if (from != null) u.from = TT(from); if (to != null) u.to = TT(to); } return kit; },
    // a circle: fixed (x, y) or on a unit (on), from t0 for dur seconds; fx as in miniMap (soak, burst, debuff, puddle, zone, safe); at: when it goes off
    ring(o) { const q0 = RO(o.x, o.y); k.rings.push({ ...o, x: q0[0], y: q0[1], on: P(o.on), t0: TT(o.t0), at: TT(o.at) }); return kit; },
    // a frontal from a unit toward another unit (or a direction in degrees, east = 0, counterclockwise), landing at 'at'; hit: orbs or ghosts it removes
    cone(o) { k.cones.push({ ...o, deg: o.deg != null ? o.deg + seg.rot : o.deg, from: P(o.from), to: P(o.to), at: TT(o.at), hit: (o.hit || []).map(P) }); return kit; },
    link(o) { k.links.push({ ...o, from: P(o.from), to: P(o.to), t0: TT(o.t0), t1: TT(o.t1) }); return kit; },
    arrow(o) { k.arrows.push({ ...o, g: P(o.g), t0: TT(o.t0), t1: TT(o.t1), at: TT(o.at) }); return kit; },
    tag(id, text, from, to) { k.tags.push([P(id), text, TT(from), TT(to)]); return kit; },
    cast(id, spell, t0, t1, end, by) { const g = P(id); (k.cbars[g] = k.cbars[g] || []).push({ t0: TT(t0), t1: TT(t1), len: t1 - t0, spell, end: end || 'done', by: by || '' }); return kit; },
    // the numbered steps beside the map, each lit while it plays
    step(t, text) { k.steps.push([TT(t), text]); return kit; },
    // a raid marker on the floor (square, triangle, diamond, cross, star, circle, moon, skull), as the plan placed it
    wmark(kind, x0, y0) { const [x, y] = RO(x0, y0); if (!k.wmarks.some((w) => w.k === kind && w.x === x && w.y === y)) k.wmarks.push({ k: kind, x, y }); return kit; },
    pause(t, text, o) { o = o || {}; k.pauses.push({ t: TT(t), text, dur: o.dur || 3.6 }); if (o.r) { const q0 = RO(o.x, o.y); k.calls.push({ kind: 'spot', on: P(o.on), x: q0[0], y: q0[1], r: o.r, t0: TT(t) - 0.002, t1: TT(t) + 0.002 }); } return kit; },
    dispel(from, to, t) { k.calls.push({ kind: 'beam', from: P(from), on: P(to), t0: TT(t), t1: TT(t) + 0.9, color: '#7cf07c' }); return kit; },
    call(t0, t1, text, o) { o = o || {}; const q0 = RO(o.x, o.y); k.calls.push({ t0: TT(t0), t1: TT(t1), text, on: P(o.on), x: q0[0], y: q0[1], color: o.color, ink: o.ink }); return kit; },
    ring1(ids) { for (const id of [].concat(ids)) k.hl.add(P(id)); return kit; },
    ok(id, t) { k.good.push(P(id)); if (t != null) k.goodAt.push([P(id), TT(t)]); return kit; },
    oops(id, t) { k.bad.push(P(id)); if (t != null) k.badAt.push([P(id), TT(t)]); return kit; },
    raid: GDZ_RAID,
    // (Putting it all together: start the next stretch at T, n-th of the fight)
    seg(T, n, segLen) { seg.T = T; seg.pre = 's' + n + ':'; seg.w = [T, T + segLen]; seg.rot = 0; return kit; },
    stepCount: () => k.steps.length,
    takeFocus() { const f0 = kit._foc; kit._foc = null; return f0 || null; },
    done(o) {
      if (GDZ_SEG && GDZ_SEG.kit === kit && !(o && o.final)) { if (o && o.focus) { const q0 = RO(o.focus.x, o.focus.y); kit._foc = { x: q0[0], y: q0[1], r: o.focus.r }; } return kit; } // (a stretch of the whole fight: the whole is built once, at the end)
      o = o || {}; const X = (x) => A.cx + x, Y = (y) => A.cy + y, frames = [], L = o.len || len;
      // (a running pace (your note, Oct 20: icons almost teleported on long moves): when a move would need more than about 8.5 yards a
      // second, the player sets off earlier from the spot they were standing on, so they still arrive on time. Several passes, as an
      // earlier start can make the move before it the rushed one. Anything still too quick is left as written)
      const VMAX = 8.5;
      for (const u of U.values()) { if (u.kind !== 'player' || u.path.length < 3) continue; const p = u.path;
        for (let pass = 0; pass < 4; pass++) for (let i = 1; i < p.length - 1; i++) {
          const a = p[i], b = p[i + 1], d = Math.hypot(b[1] - a[1], b[2] - a[2]), need = d / VMAX; if (b[0] - a[0] >= need - 1e-6) continue;
          const prev = p[i - 1], still = Math.hypot(prev[1] - a[1], prev[2] - a[2]) < 0.3; if (!still || a[3]) continue; /* (a fixed key: not before then, e.g. an orb that hasn't landed) */
          a[0] = Math.max(prev[0], b[0] - need); } }
      for (let t = 0; t <= L + 1e-6; t += 0.25) {
        const pts = [];
        for (const u of U.values()) { if (t < u.from || t > u.to || !u.path.length) continue; const p = posRaw(u.id, t); pts.push({ guid: u.id, name: u.name, kind: u.kind, x: X(p[0]), y: Y(p[1]) }); }
        frames.push({ t, pts });
      }
      const cones = k.cones.map((c) => { const p = posRaw(c.from, c.at), q = c.to ? posRaw(c.to, c.at) : null, dir = q ? Math.atan2(q[1] - p[1], q[0] - p[0]) : (c.deg || 0) * Math.PI / 180;
        return { x: X(p[0]), y: Y(p[1]), r: c.r || 30, half: (c.width || 60) * Math.PI / 360, dir, at: c.at, hit: c.hit || [] }; });
      const rings = k.rings.map((g) => ({ ...g, x: g.x != null ? X(g.x) : undefined, y: g.y != null ? Y(g.y) : undefined, guid: g.on, cn: g.cn }));
      const calls = k.calls.map((c) => ({ ...c, x: c.x != null ? X(c.x) : undefined, y: c.y != null ? Y(c.y) : undefined }));
      for (const g of rings) { const R0 = GDZ_CALL[g.cn]; if (!R0 || g.t0 == null) continue; const [text, how, color] = R0;
        const t1 = how === 'land' ? (g.at != null ? g.at + 0.4 : g.t0 + 3) : how === 'dur' ? g.t0 + (g.dur || 3) : g.t0 + how;
        const at0 = g.guid ? posRaw(g.guid, g.t0) : [g.x - A.cx, g.y - A.cy]; if (!at0) continue;
        // (one label for a cluster: a second one with the same words close by at the same time is left out)
        if (calls.some((c) => c.text === text && Math.abs(c.t0 - g.t0) < 1.5 && c._p && (text === 'Purple: keep clear' || text === 'Dodge' || Math.hypot(c._p[0] - at0[0], c._p[1] - at0[1]) < 16))) continue; /* (the purple warning once per orb set) */
        calls.push({ t0: g.t0, t1, text, color, on: g.guid, x: g.guid ? undefined : g.x, y: g.guid ? undefined : g.y, _p: at0 }); }
      for (const g of rings) { const col = GDZ_BADGE[g.cn]; if (!col || !g.guid || g.t0 == null) continue;
        calls.push({ kind: 'badge', name: g.cn, color: col, on: g.guid, t0: g.t0, t1: g.at != null ? g.at + 0.3 : g.t0 + (g.dur || 3) }); }
      for (const b of calls.filter((c) => c.kind === 'beam')) { const bd = calls.find((c) => c.kind === 'badge' && c.on === b.on && c.t0 <= b.t0 && c.t1 >= b.t0);
        if (bd) { bd.pop = b.t0 + 0.25; bd.t1 = b.t0 + 0.7; }
        calls.push({ t0: b.t0 + 0.3, t1: b.t0 + 1.3, text: 'Dispelled', color: '#2fd15a', on: b.on }); }
      for (const c of calls) if (c.text === 'Dispel') { const b = calls.find((q) => q.kind === 'beam' && q.on === c.on && q.t0 >= c.t0 && q.t0 <= c.t1 + 0.5); if (b) c.t1 = b.t0 + 0.2; }
      let lastTo = null; for (const c of k.cones.slice().sort((a, b) => a.at - b.at)) {
        calls.push({ t0: c.at - 1.4, t1: c.at + 0.3, text: 'Frontal', color: '#ff5a4f', ink: '#fff', on: c.from });
        if (c.to && /^t\d$/.test(c.to) && (lastTo ? lastTo !== c.to : c.to !== 't1')) calls.push({ t0: c.at - 1.9, t1: c.at - 0.4, text: 'Taunt', color: '#5aa0ff', ink: '#fff', on: c.to }); lastTo = c.to; }
      for (const [g, l] of Object.entries(k.cbars)) for (const b of l) if (b.end === 'kick') calls.push({ t0: b.t0, t1: b.t1, text: 'Kick', color: '#2fd15a', on: g });
      const f0 = o.focus || { x: 0, y: 0, r: 20 }, fq = RO(f0.x, f0.y), f = { x: fq[0], y: fq[1], r: f0.r }, quiet = !!o.quiet; // (quiet: no names or rings on players, for the whole fight)
      return { boss, title: o.title || '', wmarks: k.wmarks.map((w) => ({ k: w.k, x: X(w.x), y: Y(w.y) })), frames, pts: frames[0].pts, t: 0, gdzLook: true, room: GDZ_ROOM[boss] ? { id: 'gdzRoom' + (++GDZ_ROOM_N), x0: A.cx - GDZ_ROOM[boss], x1: A.cx + GDZ_ROOM[boss], y0: A.cy - GDZ_ROOM[boss], y1: A.cy + GDZ_ROOM[boss] } : null, rings, cones, callouts: calls, pauses: k.pauses.slice().sort((a, b) => a.t - b.t), links: k.links, arrows: k.arrows, tags: quiet ? [] : k.tags, cbars: k.cbars,
        hl: quiet ? [] : [...k.hl], good: quiet ? [] : k.good, goodAt: !quiet && k.goodAt.length ? k.goodAt : null, bad: quiet ? [] : k.bad, badAt: !quiet && k.badAt.length ? k.badAt : null,
        hitOrbs: cones.flatMap((c) => c.hit.filter((g) => U.get(g) && U.get(g).kind !== 'ghost')), ghostHit: cones.flatMap((c) => c.hit.filter((g) => U.get(g) && U.get(g).kind === 'ghost')),
        focus: { x: X(f.x), y: Y(f.y), r: f.r }, steps: k.steps.slice().sort((a, b) => a[0] - b[0]), playerLabel: 'Player (role icon: tank, healer, melee, ranged)', spd: o.spd || 1,
        lateHit: true, liveLeg: true, hlLabel: o.hlLabel, goodLabel: o.goodLabel, badLabel: o.badLabel, tagLabel: o.tagLabel, noArena: !!o.noArena };
    },
  };
  return kit;
}
// Putting it all together: an animated simulation of the whole fight. With a timeline (G.sim: the real kill's order, by its
// clock) every mechanic and short scene plays in that order; without one, each mechanic's map plays once in phase order.
// Returns the map, its captions ({ t, j, c, text }) and its scenes ({ t, len, rt, ph, phase, name }).
function gdzWhole(boss, G, D) {
  const GAP = 1.2, kit = gdzKit(boss, 1), caps = [], chaps = [], byId = {};
  G.phases.forEach((p, pi) => (p.mechs || []).forEach((m) => { if (m.id) byId[m.id] = { m, pi }; }));
  const list = G.sim || G.phases.flatMap((p, pi) => (p.mechs || []).filter((m) => m.map).map((m) => ({ mech: m.id || null, m, ph: pi })));
  let T = 0, n = 0, prevLen = null;
  // (one scene: a short scene of the guide, or one of its mechanic maps; returns its name and steps, or null)
  const play = (e) => {
    if (e.beat) { const b = (G.beats || {})[e.beat]; if (!b) return null; b.run(e.o || {}); return { name: b.name, texts: b.do || [] }; }
    const m = e.m || (byId[e.mech] || {}).m; if (!m || !m.map) return null; m.map(D, e.o); return { name: m.name, texts: (e.o && e.o.do) || m.do || [] }; /* (a scene played a different way, e.g. the second axe soak, brings its own captions) */
  };
  const main = { kit, next(len) { kit.seg(T, n, len); kit.rot(G.simRot || 0); main.len = len; } };
  try {
    for (const e of list) {
      // (where everyone starts the scene, found by playing it on its own first, so the walk there gets the time it needs at a
      // running pace of about 8 yards a second, never less than the usual short gap)
      if (prevLen != null) { GDZ_SEG = null; const pk = gdzKit(boss, 1); GDZ_SEG = { kit: pk, next(len) { pk.seg(0, 0, len); pk.rot(G.simRot || 0); } }; let need = GAP;
        try { if (play(e)) for (const id of GDZ_RAID) { const a = kit.posAt(id, prevLen), b = pk.posAt(id, 0); if (a && b) need = Math.max(need, Math.hypot(b[0] - a[0], b[1] - a[1]) / 8); } } catch (er) { /* (a scene that can't be probed keeps the usual gap) */ }
        T += need; }
      GDZ_SEG = main; n++; main.len = 0; const s0 = kit.stepCount(), got = play(e); if (!got) { if (prevLen != null) T -= 0; continue; } const { name, texts } = got;
      const len = main.len || 4, ph = e.ph != null ? e.ph : 0;
      if (G.simAdd) G.simAdd(kit, e);
      kit.hold(len, GDZ_RAID); // (everyone holds still to the end of the scene, then walks to the next one's spots in the gap)
      chaps.push({ t: T, len, rt: e.at, ph: ph + 1, phase: G.phases[ph] ? G.phases[ph].name : '', name: e.label || name, foc: kit.takeFocus() });
      for (let j = s0; j < kit.stepCount(); j++) caps.push({ t: 0, j: j - s0, c: chaps.length - 1, text: texts[j - s0] || '' });
      T += len; prevLen = len;
    }
  } finally { GDZ_SEG = null; }
  const end = T;
  // (real clock to simulation time, for what runs through the whole fight)
  const rt2sim = (rt) => { let i = 0; while (i < chaps.length - 1 && chaps[i + 1].rt <= rt) i++; const c = chaps[i], nx = chaps[i + 1];
    return c.t + (nx && nx.rt > c.rt ? Math.min(1, Math.max(0, (rt - c.rt) / (nx.rt - c.rt))) : 0) * c.len; };
  if (G.sim && G.simOverlay) { kit.seg(0, 'ov', end + 1); G.simOverlay(kit, rt2sim, end); }
  const mp = kit.done({ final: true, len: end, title: 'The whole fight', focus: { x: 0, y: 0, r: 30 }, quiet: true, spd: G.sim ? 1.5 : 1.4 }); /* (a reading pace: the video's captions need time) */
  mp.steps.forEach(([t], i) => { if (caps[i]) caps[i].t = t; });
  // (the real clock at a moment of the simulation, for the captions)
  const clock = (ft) => { let i = 0; while (i < chaps.length - 1 && chaps[i + 1].t <= ft) i++; const c = chaps[i], nx = chaps[i + 1];
    return c.rt == null ? null : c.rt + Math.min(1, Math.max(0, (ft - c.t) / c.len)) * ((nx && nx.rt != null ? nx.rt : c.rt + c.len) - c.rt); };
  return { mp, caps, chaps, clock, real: !!G.sim };
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

// A pop-up label on a map, like the text on a video guide: a bold pill above the spot it's about, with a pointer; it pops in
// and fades out (c: { text, color, t0, t1 }, ft: the moment drawn)
function gdzCallSvg(c, x, y, ft, at, yd) {
  if (c.kind === 'spot') { const R = Math.max(30, (c.r || 10) * (yd || 4)), B = 100000;
    return '<path d="M' + -B + ' ' + -B + 'H' + B + 'V' + B + 'H' + -B + 'Z M' + (x + R) + ' ' + y + 'A' + R + ' ' + R + ' 0 1 0 ' + (x - R) + ' ' + y + 'A' + R + ' ' + R + ' 0 1 0 ' + (x + R) + ' ' + y + 'Z" fill="#05060a" fill-opacity=".55" fill-rule="evenodd"/>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + R + '" fill="none" stroke="#f3c969" stroke-width="2.5" stroke-dasharray="8 5" vector-effect="non-scaling-stroke"/>'; }
  if (c.kind === 'badge') { // (the debuff's own icon on the player's shoulder; it bursts away when it's dispelled)
    const bx = x + 11, by = y - 11, col = c.color || '#7cf07c', url = mapIconUrl(c.name), k0 = String(c.name).toLowerCase();
    if (c.pop != null && ft >= c.pop) { const p = Math.min(1, (ft - c.pop) / 0.4); return '<circle cx="' + bx + '" cy="' + by + '" r="' + (8 + 12 * p).toFixed(1) + '" fill="none" stroke="#fff" stroke-opacity="' + (1 - p).toFixed(2) + '" stroke-width="2.5"/>' +
      [0, 1, 2, 3, 4, 5].map((i) => { const a = i * 1.047 + 0.3, d = 6 + 13 * p; return '<circle cx="' + (bx + Math.cos(a) * d).toFixed(1) + '" cy="' + (by + Math.sin(a) * d).toFixed(1) + '" r="1.8" fill="' + col + '" fill-opacity="' + (1 - p).toFixed(2) + '"/>'; }).join(''); }
    const el = ft - c.t0, k = el < 0.2 ? 0.5 + 2.5 * el : 1, pulse = 0.55 + 0.45 * Math.abs(Math.sin(ft * 3));
    return '<g class="mic' + (url ? ' on' : '') + '" transform="translate(' + bx + ' ' + by + ') scale(' + k.toFixed(2) + ') translate(' + -bx + ' ' + -by + ')">' +
      '<circle cx="' + bx + '" cy="' + by + '" r="10.5" fill="' + col + '" fill-opacity="' + (0.25 * pulse).toFixed(2) + '"/><circle cx="' + bx + '" cy="' + by + '" r="8" fill="#0b0d12" stroke="' + col + '" stroke-width="2"/>' +
      '<image class="mic-i" data-mn="' + esc(k0) + '"' + (url ? ' href="' + url + '"' : '') + ' x="' + (bx - 6.5) + '" y="' + (by - 6.5) + '" width="13" height="13" clip-path="url(#pclip)" preserveAspectRatio="xMidYMid slice"><title>' + esc(c.name) + '</title></image></g>';
  }
  if (c.kind === 'beam') { // (a healer's dispel: a bright line shoots from the healer to the target, then fades)
    const h = at && at(c.from); if (!h) return ''; const el = ft - c.t0, p = Math.min(1, el / 0.25), o = el < 0.6 ? 1 : Math.max(0, 1 - (el - 0.6) / 0.3);
    const x1 = h[0] + (x - h[0]) * p, y1 = h[1] + (y - h[1]) * p, col = c.color || '#7cf07c', NS = ' vector-effect="non-scaling-stroke"';
    return '<g opacity="' + o.toFixed(2) + '"><line x1="' + h[0] + '" y1="' + h[1] + '" x2="' + x1.toFixed(1) + '" y2="' + y1.toFixed(1) + '" stroke="' + col + '" stroke-opacity=".35" stroke-width="9" stroke-linecap="round"' + NS + '/>' +
      '<line x1="' + h[0] + '" y1="' + h[1] + '" x2="' + x1.toFixed(1) + '" y2="' + y1.toFixed(1) + '" stroke="#fff" stroke-width="2.2" stroke-linecap="round"' + NS + '/>' +
      (p >= 1 ? '<circle cx="' + x + '" cy="' + y + '" r="' + (6 + 10 * Math.min(1, (el - 0.25) / 0.35)).toFixed(1) + '" fill="' + col + '" fill-opacity="' + (0.35 * o).toFixed(2) + '"/>' : '') + '</g>';
  }
  const el = ft - c.t0, left = c.t1 - ft, k = el < 0.25 ? 0.55 + 1.8 * el : 1, o = left < 0.3 ? Math.max(0, left / 0.3) : 1;
  const col = c.color || '#f3c969', ink = c.ink || '#14100a', t = String(c.text).toUpperCase(), w = t.length * 7.4 + 20, h = 21, by = y - 16 - h;
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + k.toFixed(2) + ') translate(' + -x + ' ' + -y + ')" opacity="' + o.toFixed(2) + '">' +
    '<path d="M' + (x - 6) + ' ' + (by + h - 1) + 'L' + x + ' ' + (y - 8) + 'L' + (x + 6) + ' ' + (by + h - 1) + 'Z" fill="' + col + '" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<rect x="' + (x - w / 2) + '" y="' + by + '" width="' + w + '" height="' + h + '" rx="5" fill="' + col + '" stroke="#000" stroke-width="1.4"/>' +
    '<text x="' + x + '" y="' + (by + 15) + '" text-anchor="middle" style="font:800 12.5px var(--head,sans-serif);letter-spacing:.04em" fill="' + ink + '">' + esc(t) + '</text></g>';
}
// the labels the maps put up by themselves, by mechanic (cn): what to do, and how long it shows (land: until it goes off; a number: seconds)
const GDZ_CALL = { 'Toxic Deluge': ['Dodge', 'land'], Guillotine: ['Soak here · 5+', 'land', '#ff8a6a'], "Widow's Kiss": ['Get 40 yards away', 'land', '#9ff26d'], Gloombomb: ['To your add', 'land', '#e07bff'],
  Venomfang: ['Dispel', 'dur', '#7cf07c'], Dreadmarch: ['Mind controlled', 3, '#c49bff'], 'Spirit Erasure': ['Stop it', 'land', '#c49bff'], 'Veil of Twilight': ['Burst the shield', 'dur', '#e07bff'],
  'Purple circles': ['Dodge', 'land', '#e07bff'], Defilement: ['Stay out', 3, '#8fd16a'], 'Raid cooldowns': ['Stack · raid cooldowns', 'dur', '#b9a6ff'], "Purple orb's ring": ['Purple: keep clear', 2.4, '#c49bff'], 'Noxious Ground': ['Avoid', 3, '#8fd16a'] };

const GDZ_BADGE = { 'Corrupted Toxin': '#8fd16a', Venomfang: '#7cf07c', Dreadmarch: '#c49bff', Gloombomb: '#e07bff', Guillotine: '#ff8a6a' };

// ---- the guides' own icons (drawn here; boss portraits load at runtime from Wowhead, never bundled) ----
// a room's half-width in yards, for pools that pour in from a wall (they're cut at the floor's edge: on The Coiled Altar about 46 yards
// from the middle, where every player position of a kill stops; the pools themselves are centred on the wall statues, 52 out)
const GDZ_ROOM = { 'The Coiled Altar': 46 }; let GDZ_ROOM_N = 0;
const GDZ_GLYPH = { t: 'M0 -6.4L5.2 -4.3V0C5.2 3.6 2.7 5.6 0 6.7C-2.7 5.6 -5.2 3.6 -5.2 0V-4.3Z', h: 'M-1.9 -6.2H1.9V-1.9H6.2V1.9H1.9V6.2H-1.9V1.9H-6.2V-1.9H-1.9Z', r: 'M1.6 -6.8L-4.2 1H-0.6L-1.6 6.8L4.2 -1H0.6Z' };
function gdzGlyph(x, y, pl, r, attrs, title) { // a role token: the role's colour, a dark face and a white sign (shield, cross, swords, bolt)
  const R = r + 3, k = (R - 2.4) / 7.4, c = pl.color, g = pl.glyph; attrs = String(attrs || '').replace(/opacity:0?.6/, 'opacity:.9'); /* (solid enough to read at a glance) */
  const sign = g === 'm' ? '<path d="M-5 5L5 -5M-5 -5L5 5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M-6.5 3.5L-3.5 6.5M3.5 6.5L6.5 3.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>' : '<path d="' + GDZ_GLYPH[g] + '" fill="#fff"/>';
  return '<g' + (attrs || '') + '><circle cx="' + (x + 0.8) + '" cy="' + (y + 1.2) + '" r="' + (R + 0.4) + '" fill="#000" fill-opacity=".45"/><circle cx="' + x + '" cy="' + y + '" r="' + R + '" fill="' + c + '" stroke="#0b0d12" stroke-width="1.4"/>' +
    '<circle cx="' + x + '" cy="' + y + '" r="' + (R - 1.6) + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"/><g transform="translate(' + x + ' ' + y + ') scale(' + k.toFixed(3) + ')" style="color:' + c + '">' + sign.replace(/#fff/g, '#10131a') + '</g>' + (title ? '<title>' + esc(title) + '</title>' : '') + '</g>';
}
const GDZ_ART = { "Zul'jan": 142472, Malacrass: 142140, 'Hex Lord Malacrass': 142140 };
function gdzBossToken(x, y, name) { // a boss: a gold ring with their portrait (or a skull while it loads)
  const d = GDZ_ART[name], R = 13;
  return '<circle cx="' + (x + 1) + '" cy="' + (y + 1.5) + '" r="' + (R + 3) + '" fill="#000" fill-opacity=".5"/><circle cx="' + x + '" cy="' + y + '" r="' + (R + 2.5) + '" fill="#e6b450" stroke="#3a2a08" stroke-width="1.4"/><circle cx="' + x + '" cy="' + y + '" r="' + R + '" fill="#2a1d0d"/>' +
    '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-size="14" fill="#e6b450">☠</text>' +
    (d ? '<image href="' + artUrl(d) + '" x="' + (x - R) + '" y="' + (y - R) + '" width="' + 2 * R + '" height="' + 2 * R + '" clip-path="url(#pclip)" preserveAspectRatio="xMidYMin slice"/>' : '') +
    '<circle cx="' + x + '" cy="' + y + '" r="' + R + '" fill="none" stroke="#fff3c4" stroke-opacity=".6" stroke-width="1"/><title>' + esc(name) + '</title>';
}
function gdzGhost(x, y, label) { // a ghost: a pale wisp with dark eyes
  return '<g><ellipse cx="' + x + '" cy="' + (y + 8) + '" rx="6" ry="1.8" fill="#000" fill-opacity=".35"/><path d="M' + (x - 7) + ' ' + (y + 7) + 'V' + (y - 1) + 'A7 7 0 0 1 ' + (x + 7) + ' ' + (y - 1) + 'V' + (y + 7) + 'L' + (x + 4.7) + ' ' + (y + 4.6) + 'L' + (x + 2.3) + ' ' + (y + 7) + 'L' + x + ' ' + (y + 4.6) + 'L' + (x - 2.3) + ' ' + (y + 7) + 'L' + (x - 4.7) + ' ' + (y + 4.6) + 'Z" fill="#eef1ff" stroke="#6d58b8" stroke-width="1.3"/>' +
    '<ellipse cx="' + (x - 2.4) + '" cy="' + (y - 1) + '" rx="1.4" ry="2" fill="#2b1e52"/><ellipse cx="' + (x + 2.4) + '" cy="' + (y - 1) + '" rx="1.4" ry="2" fill="#2b1e52"/><title>' + esc(label || 'Ghost') + '</title></g>';
}
function gdzAddToken(p, x, y) { // a fragment: a purple flame
  if (!/Fragment of Malacrass/.test(p.name)) return '';
  return '<circle cx="' + x + '" cy="' + y + '" r="10" fill="#b65cff" fill-opacity=".22"/><path d="M' + x + ' ' + (y - 9) + 'C' + (x + 4) + ' ' + (y - 4) + ' ' + (x + 6.5) + ' ' + (y - 1) + ' ' + (x + 6.5) + ' ' + (y + 2.5) + 'A6.5 6.5 0 0 1 ' + (x - 6.5) + ' ' + (y + 2.5) + 'C' + (x - 6.5) + ' ' + (y - 1) + ' ' + (x - 4) + ' ' + (y - 4) + ' ' + x + ' ' + (y - 9) + 'Z" fill="#9b4dff" stroke="#2a0d4d" stroke-width="1.2"/>' +
    '<path d="M' + x + ' ' + (y - 3) + 'C' + (x + 2) + ' ' + y + ' ' + (x + 3) + ' ' + (y + 1.5) + ' ' + (x + 3) + ' ' + (y + 3) + 'A3 3 0 0 1 ' + (x - 3) + ' ' + (y + 3) + 'C' + (x - 3) + ' ' + (y + 1.5) + ' ' + (x - 2) + ' ' + y + ' ' + x + ' ' + (y - 3) + 'Z" fill="#e6c7ff"/><title>' + esc(p.name) + '</title>';
}
function gdzAxe(x, y, ft) { // a rolling axe: a spinning double blade
  const a = ((ft || 0) * 400) % 360;
  return '<g transform="rotate(' + a.toFixed(0) + ' ' + x + ' ' + y + ')"><circle cx="' + x + '" cy="' + y + '" r="9" fill="#ff9628" fill-opacity=".18"/>' +
    '<path d="M' + (x - 1.2) + ' ' + (y - 8) + 'H' + (x + 1.2) + 'V' + (y + 8) + 'H' + (x - 1.2) + 'Z" fill="#6b4a2a"/>' +
    '<path d="M' + (x + 1) + ' ' + (y - 7) + 'C' + (x + 8) + ' ' + (y - 7) + ' ' + (x + 8) + ' ' + (y - 1) + ' ' + (x + 1) + ' ' + (y - 1) + 'Z" fill="#d9dde6" stroke="#2b2f38" stroke-width="1"/>' +
    '<path d="M' + (x - 1) + ' ' + (y + 7) + 'C' + (x - 8) + ' ' + (y + 7) + ' ' + (x - 8) + ' ' + (y + 1) + ' ' + (x - 1) + ' ' + (y + 1) + 'Z" fill="#d9dde6" stroke="#2b2f38" stroke-width="1"/></g><title>Axegrinder</title>';
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
  // (they set off once the orb is there, never into a circle still landing, and move at a running pace: a long way takes longer)
  const V = 8, t1 = Math.max(tAppear + 0.2, tp - 1.6), from = k.posAt(who, t1) || [ox, oy];
  const ta = Math.max(tp, t1 + Math.hypot(ox - from[0], oy - from[1]) / V), tb = Math.max(td, ta + Math.hypot(dx - ox, dy - oy) / V);
  k.obj(obj, kind, tAppear, ox, oy).obj(obj, kind, ta, ox, oy).obj(obj, kind, tb, dx, dy).show(obj, tAppear);
  k.at(t1, who, from[0], from[1], 0, true).at(ta, who, ox, oy).at(tb, who, dx + 1.5, dy + 1.5);
  if (back) k.at(tb + Math.max(1.8, Math.hypot(back[0] - dx, back[1] - dy) / V), who, back[0], back[1]);
  k.ring1(who).tag(who, 'orb', ta, tb); return tb;
}

// ===== The Coiled Altar (from notes/Guides/Bosses/7 The Coiled Altar.md; Mythic from its "Mythic plan in detail" section) =====
// The room is a square about 104 yards across (doors north and south); the bosses fight in the middle.
// The usual P1 raid spots around Zul'jan (boss tank in front, the boss facing south)
// the raid in the lane between the second Fangs pools (Mythic plan frame): the boss tank behind the boss, the off-tank ready to taunt,
// everyone else on the far side of the boss, Warlocks at the entrance end and Mages at the far end
function gdzCaLane(k, t) {
  k.at(t, 't1', 5, 0).at(t, 't2', -3, 1.5).at(t, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 11, 0, 4).at(t, ['h1', 'h2', 'h3', 'h4'], 20, 0, 4).at(t, ['r5', 'r6', 'r7'], 27, 0, 3)
    .at(t, 'r1', -38, -6).at(t, 'r2', -38, 6).at(t, 'r3', 41, -2).at(t, 'r4', 41, 2);
  return k;
}
function gdzCaRaid(k, skip) {
  const s = new Set(skip || []), g = (ids) => ids.filter((x) => !s.has(x));
  k.at(0, g(['t1']), 0, 3).at(0, g(['t2']), 7, 7).at(0, g(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']), 0, 16, 7).at(0, g(['h1', 'h2']), -16, 14, 3).at(0, g(['h3', 'h4']), 16, 14, 3)
    .at(0, g(['r1', 'r2', 'r3', 'r4']), -22, 2, 6).at(0, g(['r5', 'r6', 'r7']), 22, 2, 5);
}
// The Mythic plan's raid markers (turned so the room's doors are north and south, like the floor art): the X marks the entrance
// side (west here), moon and skull its corners, star and square the far corners, diamond the far wall, the circle a side wall
function gdzCaMarks(k) { k.rot(90); /* (the plan is drawn entrance-west; the room's entrance side is south: Sever hits the tank south first, then north (Oct 20, two kills)) */ k.wmark('cross', -42, 0).wmark('moon', -40, -40).wmark('skull', -40, 40).wmark('star', 40, -40).wmark('square', 40, 40).wmark('diamond', 42, 13).wmark('circle', 19, 42); return k; } /* (on the floor's edge, which ends about 43 yards out) */
const GDZ_CA_AXES = {
  1: { tg: 'r3', grp: ['m5', 'm6', 'r6', 'r5', 'r7', 'h3'], tags: [['r5', 'Turtle'], ['r7', 'Turtle'], ['m6', 'Feint'], ['r6', 'Disp.']], hl: ['r5', 'r7'], title: 'Guillotine on Mythic: the first soak', hlLabel: 'axe target and the Hunters', tagLabel: 'What they press (Hunters keep Turtle for soak 2)',
    pause: 'Freeze. A big first soak, 6 or 7. The Hunters are in it so they can\'t be picked for the next axe; they\'ll Turtle that one.' },
  2: { tg: 'm3', grp: ['t1', 't2', 'r5', 'r7'], tags: [['m3', 'BoP'], ['t1', 'Wall'], ['t2', 'Wall'], ['r5', 'Turtle'], ['r7', 'Turtle']], hl: ['t1', 't2', 'r5', 'r7'], title: 'Guillotine on Mythic: the second soak', hlLabel: 'axe target and the five soakers', tagLabel: 'What they press',
    pause: 'Freeze. Exactly five: both tanks with a defensive, both Hunters in Turtle, and Blessing of Protection on the target. Nobody else.',
    do: ['Axe on you? Walk to the corner. Blessing of Protection goes on you: this axe is physical.', 'The second soak is exactly five: both tanks with a defensive, both Hunters in Turtle, and the target.', 'The axe lands and the damage is split five ways.', 'Walk out of the 40 yards. The tanks bring the boss back to the middle.', 'Phase 3 has three more axes, and those are magic.'] },
  g1: { tg: 'r2', grp: ['m1', 'h1', 'r1', 'h2'], tags: [['r2', 'Externals']], hl: [], title: 'Grim Guillotine 1: at the star', hlLabel: 'player with the axe', tagLabel: 'Big externals on the target',
    pause: 'Freeze. Phase 3\'s first axe, at the star: five who have never soaked, and big externals on the target. These axes are magic now.',
    do: ['Axe on you? Walk to the star marker. Big externals go on you.', 'The axe is magic now. Five who have never soaked go in.', 'The axe lands and the damage is split.', 'Walk out of the 40 yards. Gate in, never out.', 'The next two axes go to the square.'] },
  g2: { tg: 'r4', grp: ['m6', 'h3', 'm5', 'm4'], tags: [['r4', 'Externals'], ['m6', 'Cloak'], ['h3', 'Bubble'], ['m5', 'Spellward']], hl: ['m6', 'h3', 'm5'], title: 'Grim Guillotine 2: at the square', hlLabel: 'axe target and the immunities', tagLabel: 'What they press',
    pause: 'Freeze. Five at the square. Cloak, Bubble and Blessing of Spellwarding let players who already soaked take this magic axe.',
    do: ['Axe on you? Walk to the square marker. Big externals go on you.', 'Exactly five: players who already soaked go in with Cloak, Bubble or Blessing of Spellwarding.', 'The axe lands and the damage is split.', 'Walk out of the 40 yards.', 'One more axe, at the square again.'] },
  g3: { tg: 'm7', grp: ['m2', 'h4', 'r5', 'r7', 'r3'], tags: [['m7', 'Externals'], ['r5', 'Turtle'], ['r7', 'Turtle'], ['r3', 'Ice Block']], hl: ['r5', 'r7', 'r3'], title: 'Grim Guillotine 3: send everyone free', hlLabel: 'axe target and the immunities', tagLabel: 'What they press',
    pause: 'Freeze. The last axe: everyone still free of the debuff, plus immunities. Five is the minimum and four wipes, so this sends six.',
    do: ['The last axe: to the square marker.', 'Send everyone still free of the debuff, plus anyone with an immunity. Five is the minimum and four wipes, so send more.', 'The axe lands and the damage is split.', 'Walk out of the 40 yards.', 'That was the last axe. Now finish Zul\'jan.'] },
};
function gdzCaKicks(k, RA, MA) {
  k.boss('hm', 'Malacrass', 0, 18, 20).add('ar', 'Spiteful Soulcoiler', 0, RA[0], RA[1]).add('am', 'Spiteful Soulcoiler', 0, MA[0], MA[1]);
  k.at(0, 't1', 24, 26).at(0, 't2', 10, 22).at(0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 18, 14, 5.5).at(0, ['h1', 'h2', 'h3', 'h4'], 0, 30, 5).at(0, ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], -12, -6, 7);
  [[0.5, 'Ranged 3'], [4.2, 'Ranged 6'], [8, 'Ranged 3']].forEach(([t, by]) => k.cast('ar', 'Wail of Terror', t, t + 0.7, 'kick', by));
  [[0.6, 'Melee 3'], [4.4, 'Melee 4'], [8.2, 'Melee 3']].forEach(([t, by]) => k.cast('am', 'Wail of Terror', t, t + 0.7, 'kick', by));
  k.step(0.5).step(1.6).step(4.2).step(8);
  k.pause(4.8, 'Freeze. No bombs on these adds. Their shields don\'t need breaking, so the raid just keeps kicking every Wail of Terror.'); return k.done({ title: 'The last adds: just kick them', focus: { x: -4, y: -2, r: 20 } });
}
const GDZ_CA_M = {
  // P1: purples at the far end of each frontal's triangle, greens between them and the boss; the entrance side first
  orbs() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 26.5));
    k.boss('zj', 'Zul\'jan', 0, 0, 0);
    k.at(0, 't1', 5, 0).at(0, 't2', -2, 6).at(0, ['m1', 'm2', 'm3', 'm4'], 0, 8, 5.5).at(0, ['m5', 'm6', 'm7'], 0, -8, 4.5).at(0, ['h1', 'h2'], -6, 22, 3).at(0, ['h3', 'h4'], 6, -22, 3)
      .at(0, 'r1', -38, -34).at(0, 'r2', -38, 34).at(0, 'r3', 38, -34).at(0, 'r4', 38, 34).at(0, ['r5', 'r6', 'r7'], 4, 19, 4);
    k.hold(10.6, 't2').at(11.8, 't2', -6, 0).hold(13.6, 't2'); /* (the off-tank's taunt spot first, so its orb run starts from there) */
    // purples: the two Warlocks (entrance corners) and the two Mages (far corners) take the one nearest their corner; the off-tank the awkward one
    const PU = [['r1', -36, -22, -31, -5, 4.2, 7], ['r2', -34, 24, -31, 5, 4.6, 7.4], ['r3', 34, -26, 31, 0, 9.5, 12.5], ['r4', 30, 30, 31, 10, 10, 13], ['t2', 40, -14, 31, -10, 15.2, 19]];
    PU.forEach(([w, x, y, tx, ty, tp, td], i) => { k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: '#b65cff', cn: 'Toxic Deluge', legend: 'circle lands and leaves an orb' });
      if (w !== 't2') k.at(tp - 1.4, w, k.posAt(w, 0)[0], k.posAt(w, 0)[1]);
      gdzCarry(k, w, 'p' + i, 'porb', 3, x, y, tp, tx, ty, td, null); k.show('p' + i, 3, i < 2 ? 14.2 : 25.4);
      k.ring({ on: 'p' + i, r: 3.5, fx: 'debuff', t0: 3, dur: i < 2 ? 10.2 : 22.4, color: '#b65cff', cn: 'Purple orb\'s ring', legend: 'must never touch another orb' }); });
    k.at(9, 'r1', -38, -20).at(9.3, 'r2', -38, 20).at(15, 'r3', 40, 24).at(15.4, 'r4', 38, 32).at(22.8, 't2', 30, -23);
    // greens: moved out of the purple carriers' way first, then into each triangle
    const GR = [['m5', -14, -24, -20, -3, 3.4, 6.4], ['h1', -20, 30, -20, 3, 3.6, 6.6], ['r5', -14, 14, -25, 0, 3.8, 7], ['m6', -16, -30, -24, -6, 4, 7.4], ['m1', 18, 18, 22, -3, 9.6, 12.6], ['h3', 16, -27, 22, 3, 10, 13]];
    GR.forEach(([w, x, y, tx, ty, tp, td], i) => { k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: '#5fd35f', cn: 'Toxic Deluge' }); const back = [tx + (tx < 0 ? 8 : -8), ty < 0 ? -18 : 18]; /* (a step to the side of the triangle, clear of the frontal) */
      if (tp > 8) k.hold(tp - 1.6, w); gdzCarry(k, w, 'g' + i, 'orb', 3, x, y, tp, tx, ty, td, back); k.show('g' + i, 3, i < 4 ? 14.2 : 25.4); });
    // the off-tank taunts and takes the entrance frontal, then runs for the last purple; the boss tank taunts back for the far side
    k.cast('zj', 'Sever', 11.8, 13.4).cone({ from: 'zj', to: 't2', at: 13.4, r: 35, hit: ['p0', 'p1', 'g0', 'g1', 'g2', 'g3'] });
    k.hold(22.8, 't1').at(23.6, 't1', 6, 0);
    k.cast('zj', 'Sever', 23, 24.6).cone({ from: 'zj', to: 't1', at: 24.6, r: 35, hit: ['p2', 'p3', 'p4', 'g4', 'g5'] });
    k.ring1(['r1', 'r2', 'r3', 'r4', 't2', 't1']).step(1).step(3.2).step(4).step(11.8).step(14.2).step(23);
    k.pause(12.9, 'Freeze. The entrance triangle: purples at the tip, greens between them and the boss, nothing touching a purple ring. The off-tank has the boss turned.', { x: -25, y: 0, r: 11 }); k.pause(24.1, 'Same on the far side: three purples at the tip, greens in front of them. The boss tank has taunted back.', { x: 26, y: 0, r: 11 }); return k.done({ title: 'Toxic Deluge on Mythic: two triangles', focus: { x: 0, y: 0, r: 28 }, tagLabel: 'Carrying an orb', hlLabel: 'purple carriers and tanks' });
  },
  // P1, the set under the second Fangs pools (Oct 20 audit: the pools nearly touch by the boss and leave a lane down the middle, where
  // unhit players stood on 9 kills): the same two triangles, played inside that lane. The raid waits behind the boss from each frontal.
  orbsLane() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 26.5));
    k.boss('zj', 'Zul\'jan', 0, 0, 0); gdzCaLane(k, 0);
    // purples: Warlocks at the entrance end, Mages at the far end, the off-tank the last one after the first frontal
    const PU = [['r1', -43, -12, -31, -5, 4.2, 7], ['r2', -43, 12, -31, 5, 4.6, 7.4], ['r3', 42, -10, 31, 0, 9.5, 12.5], ['r4', 40, 14, 31, 10, 10, 13], ['t2', 36, -18, 24, -9, 17.2, 19]];
    k.hold(10.6, 't2').at(11.8, 't2', -6, 0).hold(13.6, 't2').at(15.6, 't2', 10, 1);
    PU.forEach(([w, x, y, tx, ty, tp, td], i) => { k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: '#b65cff', cn: 'Toxic Deluge', legend: 'circle lands and leaves an orb' });
      if (w !== 't2') k.at(tp - 1.4, w, k.posAt(w, 0)[0], k.posAt(w, 0)[1]);
      gdzCarry(k, w, 'p' + i, 'porb', 3, x, y, tp, tx, ty, td, null); k.show('p' + i, 3, i < 2 ? 14.2 : 25.4);
      k.ring({ on: 'p' + i, r: 3.5, fx: 'debuff', t0: 3, dur: i < 2 ? 10.2 : 22.4, color: '#b65cff', cn: 'Purple orb\'s ring', legend: 'must never touch another orb' }); });
    k.at(9, 'r1', -40, -8).at(9.3, 'r2', -40, 8).at(15, 'r3', 41, -5).at(15.4, 'r4', 41, 5).at(22.8, 't2', 36, -10); /* (out past the frontal's reach, still in the lane) */
    // greens: four melee fill the entrance triangle and come back behind the boss; two more carry the far greens past him
    const GR = [['m5', -14, -3, -20, -3, 4.4, 7.4, [9, -3]], ['m6', -18, -5, -24, -6, 4.6, 7.8, [12, -2.5]], ['m7', -18, 0, -25, 0, 4.8, 8, [14, 1]], ['m4', -14, 3, -20, 3, 5, 8.2, [10, 2.5]], ['m1', -9, -4, 22, -3, 9.4, 13.4, null], ['m2', -9, 4, 22, 3, 9.6, 13.6, null]];
    GR.forEach(([w, x, y, tx, ty, tp, td, back], i) => { k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: '#5fd35f', cn: 'Toxic Deluge' });
      if (tp > 8) k.hold(tp - 1.6, w); gdzCarry(k, w, 'g' + i, 'orb', 3, x, y, tp, tx, ty, td, back); k.show('g' + i, 3, i < 4 ? 14.2 : 25.4); });
    k.cast('zj', 'Sever', 11.8, 13.4).cone({ from: 'zj', to: 't2', at: 13.4, r: 35, hit: ['p0', 'p1', 'g0', 'g1', 'g2', 'g3'] });
    // after the first frontal everyone but the boss tank walks past the boss to the entrance half, clear of the second
    const crew = GDZ_RAID.filter((x) => !['t1', 't2', 'r1', 'r2', 'r3', 'r4'].includes(x)); k.hold(13.8, crew);
    k.at(21, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], -11, 0, 4).at(21, ['h1', 'h2', 'h3', 'h4'], -20, 0, 4).at(21, ['r5', 'r6', 'r7'], -27, 0, 3);
    k.hold(22.8, 't1').at(23.6, 't1', 6, 0);
    k.cast('zj', 'Sever', 23, 24.6).cone({ from: 'zj', to: 't1', at: 24.6, r: 35, hit: ['p2', 'p3', 'p4', 'g4', 'g5'] });
    k.ring1(['r1', 'r2', 'r3', 'r4', 't2', 't1']).step(1).step(3.2).step(4).step(11.8).step(14.2).step(23);
    k.pause(12.9, 'Freeze. Same triangles, squeezed into the lane between the pools. Everyone who isn\'t tanking waits behind the boss.', { x: -25, y: 0, r: 11 }); k.pause(24.1, 'Now the raid waits on the entrance half, and the frontal takes the far triangle.', { x: 26, y: 0, r: 11 });
    return k.done({ title: 'Toxic Deluge in the lane', focus: { x: 0, y: 0, r: 28 }, tagLabel: 'Carrying an orb', hlLabel: 'purple carriers and tanks' });
  },
  // P1 axes: soak 1 is everyone who'll immune soak 2, plus tanky players; soak 2 is exactly five, with immunities
  axe(o) {
    const V = GDZ_CA_AXES[(o && o.soak) || 1], k = gdzCaMarks(gdzKit('The Coiled Altar', 13)), C = (o && o.at) || [-38, -38], tg = V.tg, grp = V.grp;
    // (written for the moon corner; another corner mirrors the raid's spots and the way out, so everyone ends 40 yards from it)
    const fx = C[0] > 0 ? -1 : 1, fy = C[1] > 0 ? -1 : 1, at = (t, ids, x, y, sp) => k.at(t, ids, x * fx, y * fy, sp), S = new Set([tg].concat(grp)), free = (ids) => ids.filter((x) => !S.has(x));
    const TK = S.has('t1'), B0 = TK ? [-11 * fx, -11 * fy] : [0, 0];
    k.boss('zj', 'Zul\'jan', 0, B0[0], B0[1]); at(0, 't1', TK ? -8 : 5, TK ? -11 : 0); at(0, 't2', TK ? -12 : -2, TK ? -7 : 6); at(0, free(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']), 0, 8, 4.5); at(0, free(['h1', 'h2', 'h3', 'h4']), -6, 22, 3.5); at(0, free(['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7']), 4, 24, 4.5);
    at(0, tg, -20, -12); at(0, grp.filter((x) => x[0] !== 't'), -14, -20, 5);
    k.ring({ on: tg, r: 9, fx: 'soak', t0: 1, at: 6, dur: 5.8, color: '#f24824', cn: 'Guillotine', legend: '9-yard soak' });
    k.hold(1, tg).at(4.2, tg, C[0], C[1]); grp.forEach((id, i) => { const [dx, dy] = gdzSpot(i + 1, grp.length + 1, 4.5); k.hold(id[0] === 't' ? 0.3 : 1.2, id).at(4.8, id, C[0] + dx, C[1] + dy); });
    // (when both tanks soak, the boss comes with them, then back to the middle)
    if (TK) k.boss('zj', 'Zul\'jan', 0.3, B0[0], B0[1]).boss('zj', 'Zul\'jan', 4.8, C[0] + 9 * fx, C[1] + 9 * fy).boss('zj', 'Zul\'jan', 6.3, C[0] + 9 * fx, C[1] + 9 * fy).boss('zj', 'Zul\'jan', 11, 0, 0);
    V.tags.forEach(([id, txt]) => k.tag(id, txt, 1, 13));
    k.ring({ x: C[0], y: C[1], r: 40, fx: 'burst', t0: 6, at: 12, dur: 6.6, color: '#9ff26d', cn: 'Widow\'s Kiss', legend: 'erupts 40 yards around the spot, 6 s after' });
    [tg].concat(grp).forEach((id, i) => { k.ok(id, 6); const [dx, dy] = gdzSpot(i, grp.length + 1, 6); k.hold(6.3, id); at(11, id, -6 + dx, -6 + dy); });
    k.ring1([tg].concat(V.hl)).step(1).step(2).step(6).step(6.4).step(11);
    k.pause(5.6, V.pause, { x: C[0], y: C[1], r: 11 }); return k.done({ title: V.title, focus: { x: C[0] * 0.37, y: C[1] * 0.37, r: 24 }, hlLabel: V.hlLabel, goodLabel: 'in the soak', tagLabel: V.tagLabel });
  },
  // P2: everyone stacks the mind controls on the square; ghosts land around them and get frozen apart; the frontal sweeps them
  ghosts() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 13)), SQ = [41, 39];
    k.boss('hm', 'Malacrass', 0, 6, 4).boss('hm', 'Malacrass', 3, 22, 22);
    k.at(0, 't1', 10, 4).at(3, 't1', 28, 24).hold(7, 't1').at(9.6, 't1', 42, 38).at(0, 't2', 2, 8).at(3, 't2', 14, 20)
      .at(0, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 6, 12, 5).at(3, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 18, 28, 5).at(0, ['h1', 'h3', 'h4'], -8, 14, 4).at(3, ['h1', 'h3', 'h4'], 6, 30, 4)
      .at(0, ['r1', 'r2', 'r3', 'r4', 'r6', 'r7'], -6, -6, 6).at(3, ['r1', 'r2', 'r3', 'r4', 'r6', 'r7'], 4, 12, 6);
    k.at(0, 'r5', 16, 30).at(0, 'm4', 22, 28).at(0, 'h2', 10, 36);
    const mc = ['r5', 'm4', 'h2'];
    mc.forEach((id, i) => { k.ring({ on: id, r: 3, fx: 'debuff', t0: 1, dur: 5, color: '#b65cff', cn: 'Dreadmarch', legend: 'mind controlled, shielded' }); k.tag(id, 'MC', 1, 6); const [dx, dy] = gdzSpot(i, 3, 2.5); k.hold(1, id).at(4.4, id, SQ[0] + dx, SQ[1] + dy).hold(6.4, id); });
    // (they land around their player and are frozen on the spot by being looked at; the two outside the cone are let creep in)
    const G = [[34, 40], [37, 32], [44, 44], [43, 31], [31, 34], [26, 44]], IN = { 5: [30, 38], 2: [42, 38] };
    G.forEach(([x, y], q) => { const g = 'g' + q; k.obj(g, 'ghost', 6.2, x, y).show(g, 6.2, 12); if (IN[q]) k.obj(g, 'ghost', 8, x, y).obj(g, 'ghost', 9.6, IN[q][0], IN[q][1]); });
    // (a dashed line from each freed player to their ghost while they look at it: a ghost only moves while its player looks away)
    G.forEach((_, q) => { const own = mc[Math.floor(q / 2)], g = 'g' + q; if (IN[q]) k.link({ from: own, to: g, t0: 6.6, t1: 8, color: '#c49bff', dash: true, legend: 'looking at their ghost: it stays frozen' }).link({ from: own, to: g, t0: 9.6, t1: 11, color: '#c49bff', dash: true, legend: 'looking at their ghost: it stays frozen' }); else k.link({ from: own, to: g, t0: 6.6, t1: 11, color: '#c49bff', dash: true, legend: 'looking at their ghost: it stays frozen' }); });
    mc.forEach((id, i) => k.at(9.4, id, 18 - i * 3, 36 + i * 3));
    k.cast('hm', 'Soul Sever', 9.8, 11).cone({ from: 'hm', to: 't1', at: 11, r: 45, hit: ['g0', 'g1', 'g2', 'g3', 'g4', 'g5'] });
    k.ring1(mc.concat('t1')).step(1).step(2).step(6.2).step(8).step(11);
    k.pause(9.7, 'Freeze. Every ghost on its own spot, none touching, all in the frontal\'s path. The boss tank lines it up from the diamond side.', { x: 36, y: 34, r: 12 }); return k.done({ title: 'Dreadmarch on Mythic: stack on square', focus: { x: 30, y: 30, r: 15 }, hlLabel: 'mind-controlled players and the boss tank', tagLabel: 'Mind controlled, with a shield' });
  },
  bombs(o) {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 11)), RA = [-32, -28], MA = [24, 8];
    if (o && o.kick) return gdzCaKicks(k, RA, MA);
    k.boss('hm', 'Malacrass', 0, 18, 20).add('ar', 'Spiteful Soulcoiler', 0, RA[0], RA[1]).add('am', 'Spiteful Soulcoiler', 0, MA[0], MA[1]);
    k.at(0, 't1', 24, 26).at(0, 't2', 10, 22).at(0, ['m3', 'm4', 'm5', 'm6', 'm7'], 14, 31, 5).at(0, ['h1', 'h2', 'h3', 'h4'], 0, 30, 5).at(0, ['r3', 'r4', 'r5', 'r6', 'r7'], -4, 12, 6);
    k.at(0, ['m1', 'm2'], 18, 28, 2).at(0, ['r1', 'r2'], -16, -10, 2);
    [['r1', RA, -1], ['r2', RA, 1], ['m1', MA, -1], ['m2', MA, 1]].forEach(([id, a, s]) => { k.ring({ on: id, r: 15, fx: 'burst', t0: 1, at: 6, dur: 5, color: '#da3df2', cn: 'Gloombomb', legend: 'explodes 15 yards around them' });
      k.hold(1.4, id).at(4.4, id, a[0] + s * 8, a[1]).hold(6.6, id) /* (opposite sides of the add: the circles overlap on it, like a Venn diagram) */.at(9.6, id, k.posAt(id, 0)[0], k.posAt(id, 0)[1]); });
    k.cast('ar', 'Wail of Terror', 0.5, 1.2, 'kick', 'Ranged 3').cast('am', 'Wail of Terror', 0.6, 1.3, 'kick', 'Ranged 4').cast('am', 'Wail of Terror', 7.6, 8.8, 'kick', 'Melee 3');
    k.ring1(['r1', 'r2', 'm1', 'm2']).step(1).step(1.6).step(6).step(7.6);
    k.pause(5.5, 'Freeze. Two bombs on each add, one on each side. Their circles overlap on the add, not on each other, and nobody else is inside.', { x: 24, y: 8, r: 17 }); return k.done({ title: 'Gloombombs on the adds', focus: { x: -4, y: -2, r: 20 }, hlLabel: 'players with a Gloombomb' });
  },
  // P3: one frontal takes every purple in a diamond; greens go to one side, lined up
  diamond() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 16));
    k.boss('zj', 'Zul\'jan', 0, 16, -6).boss('hm', 'Malacrass', 0, 19, -2);
    k.at(0, 't1', 22, -6).at(0, 't2', 26, 0).at(0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 20, -14, 4).at(0, ['h1', 'h2', 'h3'], 28, -22, 4).at(0, ['r1', 'r2', 'r5', 'r6', 'r7'], 30, 14, 5);
    k.at(0, ['r3', 'r4'], 4, 6, 3).at(0, 'h4', -6, -24);
    const PU = [['r3', -6, 22, 0, -6, 2, 12], ['r4', -24, 10, -8, 1, -12, 20], ['t2', 6, -30, -8, -13, 0, 0], ['h4', -14, -32, -16, -6, -6, -30]], GR = [['m1', -10, -8, -4, -34], ['m2', -2, 2, 4, -34], ['m3', -20, -18, -12, -34]];
    PU.concat(GR).forEach(([, x, y], i) => k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: i < PU.length ? '#b65cff' : '#5fd35f', cn: 'Toxic Deluge' }));
    GR.forEach(([w, x, y, tx, ty], i) => { k.hold(2.2, w); gdzCarry(k, w, 'g' + i, 'orb', 3, x, y, 3.6 + i * 0.3, tx, ty, 7.4 + i * 0.3, null); k.show('g' + i, 3, 16); });
    PU.forEach(([w, x, y, tx, ty, ex, ey], i) => { k.hold(3, w); gdzCarry(k, w, 'p' + i, 'porb', 3, x, y, 4.4 + i * 0.4, tx, ty, 7.6 + i * 0.3, null); k.show('p' + i, 3, 14.6);
      k.ring({ on: 'p' + i, r: 3.5, fx: 'debuff', t0: 3, dur: 10.8, color: '#b65cff', cn: 'Purple orb\'s ring', legend: 'must never touch another orb' }); if (w !== 't2') k.at(12, w, ex, ey); }); /* (each carrier steps out of the frontal to its own spot) */
    k.hold(10.4, 't2').at(12.6, 't2', 10, -6);
    k.cast('zj', 'Blighted Sever', 12.4, 13.6).cone({ from: 'zj', to: 't2', at: 13.6, r: 45, hit: ['p0', 'p1', 'p2', 'p3'] });
    k.ring1(['r3', 'r4', 't2', 'h4']).step(1).step(3.4).step(4.4).step(12.4);
    k.pause(13.1, 'Freeze. The purple diamond: four purples, all apart, all inside the frontal. The greens are lined up off to the side.', { x: -8, y: -6, r: 12 }); return k.done({ title: 'Phase 3 on Mythic: the purple diamond', focus: { x: 2, y: 4, r: 21 }, tagLabel: 'Carrying an orb', hlLabel: 'purple carriers' });
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
      const wk = Math.max(3.2, Math.hypot(tgt[0] - sa[0], tgt[1] - sa[1]) / 8); k.at(ts - wk, who, sa[0], sa[1]).at(ts, who, tgt[0], tgt[1]).at(ts + wk, who, sa[0], sa[1]);
      k.ring({ on: who, r: 3, fx: 'burst', t0: ts - 1.1, at: ts, dur: 1.3, color: '#b65cff', cn: 'Spirit Erasure', legend: 'a stop: hits the whole raid, +20% for 2 s' }).ring1(who); });
    k.tag('h2', 'CDs', 8.4, 14).tag('m1', 'CDs', 8.4, 14);
    k.step(0).step(1).step(2.2).step(5.6).step(10);
    k.pause(9.8, 'Freeze. Raid cooldowns are down. This is the big turn: 7 to 10 stops at once.'); return k.done({ title: 'Intermission on Mythic: stops in turns', focus: { x: 0, y: 0, r: 18 }, hlLabel: 'players stopping a fragment', tagLabel: 'Raid cooldowns go down' });
  },
};
// ---- The Coiled Altar on Mythic: the animated simulation (Putting it all together) ----
// The real order and timings come from a Mythic kill (Adequate, pull 13: logs give the timings only); what each scene shows
// and says comes from the guide notes. Quiet stretches are cut, so the fight plays in a few minutes; the captions keep the real clock.
// the bosses on screen during a short scene: Zul'jan (phase 1), Malacrass (phase 2), both (intermission and phase 3)
function gdzCaBoss(k, ph) {
  if (ph === 0) k.boss('zj', 'Zul\'jan', 0, 0, 0);
  else if (ph === 1) k.boss('hm', 'Malacrass', 0, 22, 22);
  else { k.boss('zj', 'Zul\'jan', 0, 12, 0); if (ph === 3) k.boss('hm', 'Malacrass', 0, 16, 4); }
  // (phase 3: the raid plays on the star side, south of the bosses, clear of the frontals aimed north at the circle)
  if (ph === 3) k.at(0, 't1', 16, -4).at(0, 't2', 9, -3).at(0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 16, -11, 4).at(0, ['h1', 'h2', 'h3', 'h4'], 24, -24, 4).at(0, ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], 32, -12, 5);
  return k;
}
const GDZ_CA_BEATS = {
  start: { name: 'The pull', do: ['The boss tank takes Zul\'jan to the middle. Warlocks wait at the entrance corners, Mages at the far corners, the rest around the boss.', 'Fangs of the Coiled Altar: raid damage, and the altar spits green puddles at the sides. Stay out of them.'],
    run() { const k = gdzCaMarks(gdzKit('The Coiled Altar', 5)); gdzCaBoss(k, 0);
      k.at(0, 't1', 5, 0).at(0, 't2', -2, 6).at(0, ['m1', 'm2', 'm3', 'm4'], 0, 8, 5.5).at(0, ['m5', 'm6', 'm7'], 0, -8, 4.5).at(0, ['h1', 'h2'], -6, 22, 3).at(0, ['h3', 'h4'], 6, -22, 3)
        .at(0, 'r1', -38, -34).at(0, 'r2', -38, 34).at(0, 'r3', 38, -34).at(0, 'r4', 38, 34).at(0, ['r5', 'r6', 'r7'], 4, 19, 4);
      k.step(0.2).step(2.4); } },
  fangs: { name: 'Fangs of the Coiled Altar (Avoid the puddles)', do: ['Fangs again: this time the pools pour in from both side walls and nearly touch by the boss. The raid stands in the lane between them, which is wider to the north and south. The raid takes damage for about 25 seconds, so healers get ready.'],
    run(o) { const k = gdzKit('The Coiled Altar', 3.5); gdzCaBoss(k, 0); gdzCaLane(k, 0); /* (into the lane before the pools pour in) */ k.cast('zj', 'Fangs of the Coiled Altar', 0, 1.6); k.step(0.2); } },
  venomfang: { name: 'Venomfang (Dispel fast)', do: ['Venomfang: two players are poisoned. Healers dispel it fast (Poison Cleansing Totem does it on its own).'],
    run(o) { const k = gdzKit('The Coiled Altar', 4); gdzCaBoss(k, o.ph || 0); const v = o.on || ['m3', 'r6'];
      v.forEach((id, i) => { k.ring({ on: id, r: 2.6, fx: 'debuff', t0: 0.2, dur: 2.4 + i * 0.3, color: '#7cf07c', cn: 'Venomfang', legend: 'poison: dispel it fast' });
        k.dispel(i ? 'h3' : 'h1', id, 2.4 + i * 0.3); });
      k.step(0.2); } },
  transition: { name: 'Into phase 2 (Stack cooldowns)', do: ['End of phase 1: hold damage. The second-to-last frontal pops only 2 or 3 orbs and the last one hits none.', 'Kill Zul\'jan around the pools. Everyone stacks in a spot clear of axes: Darkness, Anti-Magic Zone and Spirit Link Totem for the 9 to 11 stacks.'],
    run() { const k = gdzKit('The Coiled Altar', 10); gdzCaBoss(k, 0);
      k.hold(1.5, k.raid).at(6.4, k.raid.filter((x) => x[0] !== 't'), -8, 14, 7).at(6.4, ['t1', 't2'], 3, 2, 2);
      k.ring({ x: -8, y: 14, r: 9, fx: 'zone', t0: 6.6, dur: 3.2, color: '#9a7bff', cn: 'Raid cooldowns', legend: 'Darkness, Anti-Magic Zone, Spirit Link Totem' });
      k.pause(7.6, 'Stack here and stay inside the raid cooldowns until the stacks drop.', { x: -8, y: 14, r: 10 }); 
      k.step(0.2).step(6.4); } },
  nightfall: { name: 'Eternal Nightfall (Break the shield)', do: ['Eternal Nightfall: Malacrass shields himself and starts a cast that wipes the raid. Everyone bursts the shield with the cooldowns saved for it.', 'Shield broken: the cast stops. Now dodge the purple circles.'],
    run(o) { const k = gdzKit('The Coiled Altar', 7); const ph = o.ph || 1; gdzCaBoss(k, ph); const b = ph === 1 ? [22, 22] : [16, 4];
      k.ring({ on: 'hm', r: 4, fx: 'zone', t0: 0.3, dur: 4.4, color: '#c45cff', cn: 'Veil of Twilight', legend: 'the shield: break it to stop the cast' });
      k.cast('hm', 'Eternal Nightfall', 0.3, 4.8, 'stop');
      [[-6, 6], [4, -14], [-20, -6], [10, 18]].forEach(([dx, dy], i) => k.ring({ x: b[0] + dx - 8, y: b[1] + dy - 10, r: 5, fx: 'soak', t0: 4.6, at: 6.4, dur: 2.2, color: '#c45cff', cn: 'Purple circles', legend: 'dodge them' }));
      k.pause(4.3, 'This shield has to break before the cast finishes. Everyone saves damage and cooldowns for it.', { on: 'hm', r: 8 }); 
      k.step(0.3).step(4.8); } },
  p2end: { name: 'Into the intermission', do: ['End of phase 2: hold damage. Keep looking at your ghost and it vanishes at the transition. The transition knocks you back: stay off the edge.'],
    run() { const k = gdzKit('The Coiled Altar', 7); gdzCaBoss(k, 1); k.hold(1, k.raid).at(5.6, k.raid.filter((x) => x[0] !== 't'), 0, 4, 10).at(5.6, ['t1', 't2'], 6, 8, 2); k.step(0.2); } },
  defile: { name: 'Defilement (Tanks swap)', do: ['Defilement replaces Fangs: ground that puts heal absorbs on you, and a poison on the tank. The other tank taunts.'],
    run() { const k = gdzKit('The Coiled Altar', 5); gdzCaBoss(k, 3);
      [[-24, 30], [26, -32], [-34, -14]].forEach(([x, y]) => k.ring({ x, y, r: 6, fx: 'puddle', t0: 0.6, dur: 60, color: '#4f8f2a', fill: 'rgba(79,143,42,.25)', cn: 'Defilement', legend: 'heal-absorb ground: stay out' }));
      k.ring({ on: 't1', r: 2.8, fx: 'debuff', t0: 0.8, dur: 2.8, color: '#8fd16a', cn: 'Corrupted Toxin', legend: 'poison on the tank: the other tank taunts' }); k.call(1.9, 3.2, 'Taunt', { on: 't2', color: '#5aa0ff', ink: '#fff' });
      k.hold(2, ['t1', 't2']).at(3.4, 't2', 8, -4).at(3.4, 't1', 18, -10); k.step(0.3); } },
  p3orbs: { name: 'Toxic Deluge (Circle side first)', do: ['More orbs. This set goes by the circle marker first, with two purples at the tip.', 'The off-tank taunts and the frontal pops them. Greens elsewhere can wait; purples can\'t.'],
    run() { const k = gdzCaMarks(gdzKit('The Coiled Altar', 14.5)); gdzCaBoss(k, 3);
      const PU = [['r3', 30, 16, 22, 28], ['r4', 15, 6, 12, 30]], GR = [['m2', 6, 16, 19, 21]];
      PU.concat(GR).forEach(([, x, y], i) => k.ring({ x, y, r: 5, fx: 'soak', t0: 0.6, at: 2.4, dur: 2.4, color: i < 2 ? '#b65cff' : '#5fd35f', cn: 'Toxic Deluge' }));
      PU.forEach(([w, x, y, tx, ty], i) => { k.hold(2, w); const tb = gdzCarry(k, w, 'p' + i, 'porb', 2.4, x, y, 3.2 + i * 0.4, tx, ty, 6.4 + i * 0.3, null); k.show('p' + i, 2.4, 13.6);
        k.ring({ on: 'p' + i, r: 3.5, fx: 'debuff', t0: 2.4, dur: 10.2, color: '#b65cff', cn: 'Purple orb\'s ring', legend: 'must never touch another orb' }); const ex = i ? -12 : 40, ey = i ? 24 : 16; k.at(tb + 0.2 + Math.hypot(ex - tx, ey - ty) / 8, w, ex, ey); });
      GR.forEach(([w, x, y, tx, ty], i) => { const back = k.posAt(w, 0); k.hold(2, w); gdzCarry(k, w, 'g' + i, 'orb', 2.4, x, y, 3 + i * 0.3, tx, ty, 6 + i * 0.3, back); k.show('g' + i, 2.4, 13.6); });
      k.hold(9.8, 't2').at(11.6, 't2', 15, 10);
      k.cast('zj', 'Blighted Sever', 11, 12.4).cone({ from: 'zj', to: 't2', at: 12.4, r: 45, hit: ['p0', 'p1', 'g0'] });
      k.pause(11.8, 'Purples at the tip by the circle marker, one green in front. The off-tank has the boss turned.', { x: 17, y: 24, r: 10 }); 
      k.step(0.6).step(11); } },
  kill: { name: 'The kill', do: ['Kill Zul\'jan before his pool cast, about a minute after the second shield, or every orb left blows up. Malacrass at 7 or 8% when Zul\'jan dies is fine: don\'t over-damage him.'],
    run() { const k = gdzKit('The Coiled Altar', 7.5); gdzCaBoss(k, 3);
      k.call(0.3, 2, 'Zul\'jan first', { on: 'zj' }); k.ring({ on: 'zj', r: 7, fx: 'burst', t0: 1.6, at: 2.2, dur: 0.8, color: '#ffd23b', cn: 'Zul\'jan dies', legend: 'Zul\'jan dies first' }); k.show('zj', 0, 2.4);
      k.ring({ on: 'hm', r: 5, fx: 'zone', t0: 2.4, dur: 2.8, color: '#ff3b3b', cn: 'Soulbound', legend: 'one boss dead: the other gets 500% stronger' }); k.call(2.5, 4.9, 'About 7%: finish him', { on: 'hm', color: '#ff3b3b', ink: '#fff' });
      k.ring({ on: 'hm', r: 7, fx: 'burst', t0: 4.6, at: 5.2, dur: 0.8, color: '#ffd23b', cn: 'Malacrass dies', legend: 'the kill' }); k.show('hm', 0, 5.4); k.call(5.4, 7.4, 'Kill', { x: 14, y: 2 });
      k.pause(2.7, 'Zul\'jan is dead, before his pool cast. Malacrass is at 7 or 8% and now hits 500% harder, so finish him fast.', { on: 'hm', r: 9 });
      k.step(0.3); } },
};
// the real kill's order, by its clock (seconds): a mechanic of the guide (mech, with its own options) or a short scene (beat)
const GDZ_CA_SIM = [
  { at: 0, beat: 'start', ph: 0 }, { at: 2, mech: 'orbs', ph: 0 }, { at: 30, beat: 'venomfang', ph: 0 }, { at: 43, mech: 'axe', ph: 0 },
  { at: 45, mech: 'orbs', ph: 0 }, { at: 65, beat: 'venomfang', ph: 0, o: { on: ['r4', 'm5'] } }, { at: 85, beat: 'fangs', ph: 0 }, { at: 87, mech: 'orbs', ph: 0, label: 'Toxic Deluge (In the lane between the pools)', o: { lane: true, do: ['Pools are down: the whole raid plays in the lane down the middle. Warlocks wait at the entrance end, Mages at the far end.', 'Everyone else: clear the greens out of the purple carriers\' way first. Greens only. Never touch a purple.', 'Entrance side first: purples to the tip, greens between them and the boss. The raid waits on the far side of the boss.', 'Off-tank: taunt right before Sever and pop the whole entrance triangle. 5 or 6 orbs, never more than 7.', 'Now the far side. The raid walks past the boss to the entrance half, and the off-tank brings the last purple.', 'Boss tank: taunt back and take the second Sever through the far triangle.'] } },
  { at: 115, beat: 'venomfang', ph: 0, o: { on: ['r7', 'm2'] } }, { at: 128, mech: 'axe', ph: 0, label: 'Guillotine 2 (Five, with immunities)', o: { soak: 2, do: GDZ_CA_AXES[2].do } }, { at: 130, mech: 'orbs', ph: 0 },
  { at: 150, beat: 'venomfang', ph: 0, o: { on: ['m6', 'r5'] } }, { at: 165, beat: 'transition', ph: 0 },
  { at: 177, mech: 'dm', ph: 1 }, { at: 190, mech: 'bombs', ph: 1 }, { at: 219, mech: 'dm', ph: 1 }, { at: 223, mech: 'bombs', ph: 1 }, { at: 247, beat: 'nightfall', ph: 1 },
  { at: 267, mech: 'dm', ph: 1 }, { at: 275, mech: 'bombs', ph: 1 }, { at: 304, mech: 'dm', ph: 1 }, { at: 308, mech: 'bombs', ph: 1 }, { at: 332, beat: 'nightfall', ph: 1 },
  { at: 352, mech: 'dm', ph: 1 }, { at: 360, mech: 'bombs', ph: 1, label: 'Last adds (Just kick them)', o: { kick: true, do: ['The last adds before the intermission: no bombs on them this time.', 'Kick every Wail of Terror. Each kick makes the add teleport.', 'Keep the kick rotation going on both adds.', 'Their shields break at the transition, so there\'s nothing more to do.'] } }, { at: 385, beat: 'p2end', ph: 1 },
  { at: 392, mech: 'frags', ph: 2 },
  { at: 430, beat: 'defile', ph: 3 }, { at: 432, mech: 'diamond', ph: 3 }, { at: 446, mech: 'axe', ph: 3, o: { at: [38, -38], soak: 'g1', do: GDZ_CA_AXES.g1.do }, label: 'Grim Guillotine 1 (At the star)' }, { at: 467, beat: 'nightfall', ph: 3, o: { ph: 3 } },
  { at: 473, beat: 'p3orbs', ph: 3 }, { at: 484, mech: 'dm', ph: 3 }, { at: 492, mech: 'bombs', ph: 3 }, { at: 511, mech: 'axe', ph: 3, o: { at: [38, 38], soak: 'g2', do: GDZ_CA_AXES.g2.do }, label: 'Grim Guillotine 2 (At the square)' },
  { at: 532, beat: 'defile', ph: 3 }, { at: 533, beat: 'p3orbs', ph: 3 }, { at: 564, beat: 'nightfall', ph: 3, o: { ph: 3 } }, { at: 583, mech: 'dm', ph: 3 }, { at: 589, mech: 'bombs', ph: 3, label: 'Last adds (Just kick them)', o: { kick: true, do: ['The last adds of the fight: no bombs needed.', 'Kick every Wail of Terror. Each kick makes the add teleport.', 'Keep the kick rotation going on both adds.', 'Damage stays on the bosses: the kill is close.'] } },
  { at: 611, mech: 'axe', ph: 3, o: { at: [38, 38], soak: 'g3', do: GDZ_CA_AXES.g3.do }, label: 'Grim Guillotine 3 (Send everyone free)' }, { at: 618, beat: 'kill', ph: 3 },
];
// (phase 3 has both bosses up: a scene borrowed from phase 1 or 2 gets the other one beside it)
function gdzCaSimAdd(k, e) {
  if (e.ph !== 3 || !e.mech || e.mech === 'diamond') return; const z = k.posAt('zj', 0), h = k.posAt('hm', 0);
  if (z && !h) k.boss('hm', 'Malacrass', 0, z[0] + 4, z[1] + 4); else if (h && !z) k.boss('zj', 'Zul\'jan', 0, h[0] - 4, h[1] - 4);
}
// running through the whole simulation: the rolling axes (they never go away on Mythic) and the Fangs puddles at the sides
function gdzCaSimOverlay(k, rt2sim, end) {
  const t0 = rt2sim(15);
  [0, 2.1, 4.2].forEach((a0, i) => { const id = 'axe' + i, w = 0.09 * (i % 2 ? -1 : 1);
    for (let t = t0 + i * 3; t <= end; t += 2) { const a = a0 + (t - t0) * w; k.obj(id, 'axe', t, Math.cos(a) * 44, Math.sin(a) * 44); }
    k.show(id, t0 + i * 3, end).ring({ on: id, r: 3, fx: 'zone', t0: t0 + i * 3, dur: end, color: '#ff9628', cn: 'Axegrinder', legend: 'rolling axe: knocks you back' }); });
  const p2 = rt2sim(177);
  // (Noxious Ground, measured from about 1,600 hits on 11 Mythic kills (your notes, Oct 20: from the exact middle of each side, equal
  // sizes): each pool pours from the middle of the west or east wall. After the first Fangs it reaches to about 24 yards short of
  // the centre; after the second it stops about 4 yards short of the boss, so the two nearly touch there, and the gap widens to about 25 yards 30 yards north and south (where unhit players stood, Oct 20). Each hurts for about 28 seconds, then fades)
  const W = 52, life = 28;
  [[-W, 0], [W, 0]].forEach(([x, y]) => { k.ring({ x, y, r: 28, clip: true, fx: 'puddle', t0: rt2sim(0) + 2.6, dur: rt2sim(life) - rt2sim(0) - 2.6, color: '#c4f03c', fill: 'rgba(52,128,30,.5)', cn: 'Noxious Ground', legend: 'pools from Fangs: stay in the middle lane' });
    k.ring({ x, y, r: 48, clip: true, fx: 'puddle', t0: rt2sim(85) + 0.8, dur: rt2sim(85 + life) - rt2sim(85) - 0.8, color: '#c4f03c', fill: 'rgba(52,128,30,.46)', cn: 'Noxious Ground', legend: 'pools from Fangs: stay in the middle lane' }); });
}
// ---- What goes wrong (your idea, Oct 20): each mechanic's map can also play a mistake and what it costs ----
// a raid-wide hit: a red blast over the room and a red label, and the players it kills marked
function gdzFailBlast(k, t, text, x, y, who, cn) {
  k.ring({ x: 0, y: 0, r: 70, fx: 'burst', t0: t - 0.4, at: t, dur: 1, color: '#ff3b3b', cn: cn || 'Raid hit', legend: 'it hits the whole raid' });
  k.call(t + 0.2, t + 4, text, { x, y, color: '#ff3b3b', ink: '#fff' });
  (who || []).forEach((id, i) => k.oops(id, t + 0.4 + i * 0.25));
}
const GDZ_CA_FAIL = {
  orbsH: { name: 'Too many orbs in one frontal', what: 'Nine orbs in one Sever: the raid takes nine hits at once and the healers can\'t keep up.',
    do: ['The raid piles 9 orbs in front of the boss.', 'Sever pops all 9 at once.', 'Nine Venom Ruptures hit everyone together. People die.'],
    map: () => { const k = gdzKit('The Coiled Altar', 8); k.boss('zj', 'Zul\'jan', 0, 0, 10); gdzCaRaid(k); k.at(0, 't2', 0, 2).at(0, 't1', 6, 6); const ids = [];
      for (let i = 0; i < 9; i++) { const [dx, dy] = gdzSpot(i, 9, 6); k.obj('o' + i, 'orb', 0, dx, -15 + dy).show('o' + i, 0, 5.2); ids.push('o' + i); }
      k.cast('zj', 'Sever', 2.4, 4).cone({ from: 'zj', to: 't2', at: 4, r: 35, hit: ids });
      gdzFailBlast(k, 4.4, '9 hits at once', 0, 18, ['h2', 'r4', 'm3'], 'Venom Rupture ×9');
      k.step(0.3).step(2.4).step(4.4); return k.done({ title: 'Mistake: too many orbs', focus: { x: 0, y: 0, r: 20 }, badLabel: 'dies to the raid damage' }); } },
  orbsM: { name: 'A purple touches a green', what: 'A purple carrier walks too close to a green orb on the ground. The purple ring touches it and the raid wipes.',
    do: ['A purple carrier takes a shortcut past a green orb on the ground.', 'The purple ring touches the green.', 'About 20 Venom Ruptures at once. The raid wipes.'],
    map: () => { const k = gdzCaMarks(gdzKit('The Coiled Altar', 8.5)); k.boss('zj', 'Zul\'jan', 0, 0, 0);
      k.at(0, 't1', 5, 0).at(0, 't2', -2, 6).at(0, ['m1', 'm2', 'm3', 'm4'], 0, 8, 5.5).at(0, ['m5', 'm6', 'm7'], 0, -8, 4.5).at(0, ['h1', 'h2'], -6, 22, 3).at(0, ['h3', 'h4'], 6, -22, 3)
        .at(0, 'r1', -34, -24).at(0, 'r2', -38, 34).at(0, 'r3', 38, -34).at(0, 'r4', 38, 34).at(0, ['r5', 'r6', 'r7'], 4, 24, 4);
      k.obj('g0', 'orb', 0, -24, -6).show('g0', 0, 4.6);
      gdzCarry(k, 'r1', 'p0', 'porb', 0, -36, -20, 0.8, -26, -9, 3.6, null); k.show('p0', 0, 4.6);
      k.ring({ on: 'p0', r: 3.5, fx: 'debuff', t0: 0, dur: 4.4, color: '#b65cff', cn: 'Purple orb\'s ring', legend: 'must never touch another orb' });
      gdzFailBlast(k, 4.4, 'Wipe', -25, 0, GDZ_RAID, 'Venom Rupture ×20');
      k.step(0.3).step(3.6).step(4.4); k.pause(3.4, 'Stop. See that purple ring about to touch the green orb? That\'s a wipe.', { x: -25, y: -7, r: 7 }); return k.done({ title: 'Mistake: purple touches green', focus: { x: -14, y: -6, r: 18 }, badLabel: 'dead' }); } },
  axe: { name: 'Only 3 in the soak', what: 'The axe needs at least 5 inside. With 3, it hits the whole raid instead (Execution).',
    do: ['The axe target walks to the corner, but only 2 players join them.', 'The axe lands with 3 inside, not 5.', 'Execution: a big hit on the whole raid, and people die.'],
    map: () => { const k = gdzKit('The Coiled Altar', 9), C = [36, -36]; k.boss('zj', 'Zul\'jan', 0, 0, 10); gdzCaRaid(k, ['r3', 'm5', 'm6']);
      k.at(0, 'r3', 24, -14).at(0, ['m5', 'm6'], 14, -10, 2);
      k.ring({ on: 'r3', r: 9, fx: 'soak', t0: 0.5, at: 4.5, dur: 4.3, color: '#f24824', cn: 'Guillotine', legend: '9-yard soak, 5 or more inside' });
      k.hold(0.5, 'r3').at(3, 'r3', C[0], C[1]); ['m5', 'm6'].forEach((id, i) => { const [dx, dy] = gdzSpot(i + 1, 3, 3); k.hold(0.5, id).at(3.6, id, C[0] + dx, C[1] + dy); });
      gdzFailBlast(k, 4.6, 'Only 3: Execution', 14, -16, ['h2', 'r1', 'm2'], 'Execution');
      k.step(0.5).step(4.5).step(4.8); k.pause(4.3, 'Stop. Only 3 in the circle. This is going to hit the whole raid.', { x: C[0], y: C[1], r: 11 }); return k.done({ title: 'Mistake: too few soakers', focus: { x: 16, y: -12, r: 24 }, badLabel: 'dies to Execution' }); } },
  dmH: { name: 'A ghost reaches its player', what: 'A ghost moves whenever its player looks away. If it reaches them, they\'re mind controlled again.',
    do: ['A freed player turns away from their ghost to run.', 'The ghost catches up and touches them.', 'Mind controlled again: back to the stack spot, with a fresh shield to break.'],
    map: () => { const k = gdzKit('The Coiled Altar', 8); k.boss('hm', 'Malacrass', 0, 0, 10);
      k.at(0, 't1', 0, 3).at(0, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 0, 16, 6).at(0, ['h1', 'h3', 'h4'], 15, 14, 4).at(0, ['r1', 'r3', 'r4', 'r5', 'r6', 'r7'], 20, 0, 7).at(0, 'r2', -16, -12);
      k.obj('g0', 'ghost', 0, -22, -18).obj('g0', 'ghost', 1, -22, -18).obj('g0', 'ghost', 4, -10, -6).show('g0', 0, 4.2);
      k.hold(1, 'r2').at(4, 'r2', -10, -6);
      k.ring({ on: 'r2', r: 3, fx: 'debuff', t0: 4.2, dur: 3.6, color: '#b65cff', cn: 'Dreadmarch', legend: 'mind controlled again' });
      k.call(4.4, 7.8, 'Mind controlled again', { on: 'r2', color: '#ff3b3b', ink: '#fff' });
      k.step(0.5).step(4).step(4.4); return k.done({ title: 'Mistake: a ghost reaches its player', focus: { x: -10, y: -6, r: 14 } }); } },
  dmM: { name: 'Two ghosts touch', what: 'On Mythic only you can see your ghost. If two ghosts touch each other, both of their players die.',
    do: ['Two freed players stand close and let their ghosts drift.', 'The two ghosts touch.', 'Both players die.'],
    map: () => { const k = gdzCaMarks(gdzKit('The Coiled Altar', 8)); k.boss('hm', 'Malacrass', 0, 22, 22);
      k.at(0, 't1', 28, 24).at(0, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 18, 28, 5).at(0, ['h1', 'h3', 'h4'], 6, 30, 4).at(0, ['r1', 'r3', 'r4', 'r6', 'r7'], 4, 12, 6).at(0, 'r5', 40, 38).at(0, 'm4', 36, 33);
      k.obj('g0', 'ghost', 0, 44, 32).obj('g0', 'ghost', 1, 44, 32).obj('g0', 'ghost', 3.6, 40.5, 30.5).show('g0', 0, 4.2);
      k.obj('g1', 'ghost', 0, 34, 26).obj('g1', 'ghost', 1, 34, 26).obj('g1', 'ghost', 3.6, 39, 30).show('g1', 0, 4.2);
      k.ring({ x: 39.8, y: 30.2, r: 4, fx: 'burst', t0: 3.2, at: 3.8, dur: 0.8, color: '#c49bff', cn: 'Malevolent Resonance', legend: 'two ghosts touching' });
      k.call(4, 7.6, 'Both players die', { x: 40, y: 36, color: '#ff3b3b', ink: '#fff' }); k.oops('r5', 4.2); k.oops('m4', 4.2);
      k.step(0.5).step(3.6).step(4.1); k.pause(3.2, 'Stop. Those two ghosts are drifting into each other. When they touch, both players die.', { x: 39, y: 30, r: 7 }); return k.done({ title: 'Mistake: two ghosts touch', focus: { x: 36, y: 30, r: 12 }, badLabel: 'dies' }); } },
  bombs: { name: 'Bombs stacked together', what: 'Two bomb carriers stand on the same spot, next to the melee. Every bomb hits everyone around it.',
    do: ['Both melee bombs run to the same spot, right next to the melee.', 'The bombs go off together.', 'They hit each other and the melee around them, twice.'],
    map: () => { const k = gdzKit('The Coiled Altar', 8).rot(90), MA = [24, 8]; k.boss('hm', 'Malacrass', 0, 18, 20).add('am', 'Spiteful Soulcoiler', 0, MA[0], MA[1]);
      k.at(0, 't1', 24, 26).at(0, ['m3', 'm4', 'm5', 'm6', 'm7'], 18, 14, 4).at(0, ['h1', 'h2', 'h3', 'h4'], 0, 30, 5).at(0, ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], -6, 4, 6).at(0, ['m1', 'm2'], 18, 28, 2);
      ['m1', 'm2'].forEach((id) => { k.ring({ on: id, r: 15, fx: 'burst', t0: 0.5, at: 4.5, dur: 4.3, color: '#da3df2', cn: 'Gloombomb', legend: 'explodes 15 yards around them' }); k.hold(0.6, id).at(3.2, id, 20, 11); });
      k.call(4.7, 7.8, 'Hit 6 players', { x: 20, y: 18, color: '#ff3b3b', ink: '#fff' }); ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'].forEach((id, i) => k.oops(id, 4.7 + i * 0.15));
      k.step(0.5).step(4.5).step(4.8); k.pause(4.2, 'Stop. Both bombs on one spot, right next to the melee. Everyone in there takes both.', { x: 20, y: 11, r: 15 }); return k.done({ title: 'Mistake: bombs stacked', focus: { x: 18, y: 14, r: 14 }, badLabel: 'hit by a Gloombomb' }); } },
  frags: { name: 'A fragment gets through', what: 'Nobody steps in front of a fragment and it reaches Zul\'jan. Each one that gets through heals him about 10%.',
    do: ['A fragment walks in from the edge and nobody covers it.', 'It reaches Zul\'jan.', 'He heals about 10%. Two or three of these and the burn fails.'],
    map: () => { const k = gdzKit('The Coiled Altar', 8); k.boss('zj', 'Zul\'jan', 0, 0, 0);
      k.at(0, 't1', -3, 0).at(0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 0, 0, 9).at(0, ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], 6, 10, 10).at(0, ['h1', 'h2', 'h3', 'h4'], 14, -10, 6).at(0, 't2', 20, 20);
      k.add('f0', 'Fragment of Malacrass', 0, -44, -28).add('f0', 'Fragment of Malacrass', 4.2, -3, -2).show('f0', 0, 4.3);
      k.ring({ on: 'zj', r: 6, fx: 'burst', t0: 3.8, at: 4.4, dur: 0.8, color: '#45d16b', cn: 'Fragment heals Zul\'jan', legend: 'about 10% health back' });
      k.call(4.5, 7.8, '+10% health', { on: 'zj', color: '#ff3b3b', ink: '#fff' });
      k.step(0.3).step(4.2).step(4.5); return k.done({ title: 'Mistake: a fragment gets through', focus: { x: -12, y: -6, r: 18 } }); } },
  diamond: { name: 'A purple left behind', what: 'A purple orb isn\'t in the frontal and nobody moves it. When the next Toxic Deluge lands, it blows up and wipes the raid.',
    do: ['One purple sits outside the diamond.', 'The frontal pops the others but misses it.', 'The next Toxic Deluge lands and the leftover purple blows up: wipe.'],
    map: () => { const k = gdzCaMarks(gdzKit('The Coiled Altar', 9)); k.boss('zj', 'Zul\'jan', 0, 16, -6).boss('hm', 'Malacrass', 0, 19, -2);
      k.at(0, 't1', 22, -6).at(0, 't2', 10, -6).at(0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], 20, -14, 4).at(0, ['h1', 'h2', 'h3', 'h4'], 28, -22, 4).at(0, ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], 30, 14, 5);
      [[0, -6], [-8, 1], [-8, -13]].forEach(([x, y], i) => k.obj('p' + i, 'porb', 0, x, y).show('p' + i, 0, 3.4)); k.obj('p3', 'porb', 0, -20, 22).show('p3', 0, 6.4);
      k.cast('zj', 'Blighted Sever', 1, 2.4).cone({ from: 'zj', to: 't2', at: 2.4, r: 45, hit: ['p0', 'p1', 'p2'] });
      k.call(3, 5.6, 'Missed one', { x: -20, y: 26, color: '#ff9f1c' });
      k.ring({ x: -30, y: -20, r: 5, fx: 'soak', t0: 4.4, at: 6.2, dur: 2.2, color: '#5fd35f', cn: 'Toxic Deluge' });
      gdzFailBlast(k, 6.4, 'Wipe', -20, 18, GDZ_RAID, 'Purple orb explodes');
      k.step(0.3).step(2.4).step(6.4); return k.done({ title: 'Mistake: a purple left behind', focus: { x: -4, y: 4, r: 20 }, badLabel: 'dead' }); } },
};
GDZ['The Coiled Altar'] = {
  sum: 'Zul\'jan first, then Hex Lord Malacrass, then both at once. Orbs go to the front for the frontal, axes get soaked by five, and ghosts get led into the frontal too.',
  // (the Mythic guide credits its source by name (your call, Oct 20): a name only, never a link out)
  m: { simRot: 90, sim: GDZ_CA_SIM, beats: GDZ_CA_BEATS, simOverlay: gdzCaSimOverlay, simAdd: gdzCaSimAdd, source: 'Tactyks\' Mythic Coiled Altar guide and first-kill video', sum: 'Zul\'jan, then Hex Lord Malacrass, then both. Purple orbs must never touch another orb, every axe\'s soakers are planned, ghosts must never touch, and bombs go on the adds. This follows a plan that killed it, with its markers; your raid may mark the room its own way.' },
  facts: [['Phases', '3 + intermission'], ['Bloodlust', 'Intermission'], ['Healers', '5', 'm'], ['Hardest part', 'Orbs and ghosts', 'h'], ['Hardest part', 'Purple orbs', 'm']],
  phases: [
    { id: 'p1', name: 'Phase 1: Zul\'jan', sum: 'One boss. Gather the orbs in front of him, soak the axes, and dodge the axes rolling around the room.',
      m: { sum: 'One boss in the middle. Two orb triangles, one each side, popped by alternating frontals; two axe soaks.' },
      mechs: [
        { id: 'orbs', fail: GDZ_CA_FAIL.orbsH, name: 'Toxic Deluge (Carry orbs to the front)', spell: 'Coalesced Venom', what: 'Green circles drop around the room and each one leaves an orb. Orbs hurt the raid until they\'re popped. Sever, the tank frontal, pops them, and every pop hits the whole raid.',
          do: ['Circles incoming: step out before they land.', 'Each circle leaves a green orb. The longer orbs sit, the more the raid takes.', 'Run over an orb to grab it. It drops after 5 seconds. Bring every orb to the pile in front of the boss.', 'Off-tank: taunt right before Sever so the boss faces the pile.', 'Sever pops the pile. Aim for 5 or 6 orbs. Never more than 7.'],
          note: 'Each pop also adds a stack of damage over time to the whole raid, so don\'t pop too many at once.',
          m: { fail: GDZ_CA_FAIL.orbsM, name: 'Toxic Deluge (Two triangles, purples at the tip)', what: 'Green and purple orbs drop. If a purple\'s ring touches any other orb, on the ground or carried, the raid wipes. Each frontal pops one triangle: purples at the far tip, greens between them and the boss.',
            do: ['Circles incoming. Purple carriers: the two Warlocks take the entrance corners, the two Mages the far corners, and the off-tank grabs the awkward one.', 'Everyone else: clear the greens out of the purple carriers\' way first. Greens only. Never touch a purple.', 'Entrance side first: purples go to the tip, up to the marker line. Greens fill in between them and the boss.', 'Off-tank: taunt right before Sever and pop the whole entrance triangle. 5 or 6 orbs, never more than 7.', 'Now the far side. The off-tank brings the last purple and the raid fills in the greens.', 'Boss tank: taunt back and take the second Sever through the far triangle.'],
            plan: ['The entrance side always gets the first frontal, so set that side up first. Three purples on one side and two on the other worked, but don\'t force it.', 'Each Warlock takes the purple nearest their corner; the Mages wait and Blink in only if needed, because the off-tank is the safer runner.', 'Warlocks: wait until greens on your path are picked up before you teleport, or you\'ll run a purple into them.', 'The two side markers show how far the frontal reaches from the middle. Drop orbs at or inside that line; if some are further back, pull the boss a little off centre.', 'You may run a carried green past a carried purple. A green on the ground must never touch a purple\'s ring.', 'Every orb is one stack, purple or green. 5 or 6 per frontal; 7 is healable; never more.', 'Tanks: avoid a second Sever stack in phase 1 (it needs two externals). Two Evokers\' Time Spiral resets the runners\' movement abilities.', 'End of the phase: when ahead, hold damage. The second-to-last frontal hits only 2 or 3 orbs and the last one hits none, because every orb left blows up when Zul\'jan dies.'],
            note: 'Carrying an orb gives Tainted Blood (its damage around you goes up 200% for 10 seconds), so take turns carrying.' },
          map: (d, o) => {
            if (d === 'm') return o && o.lane ? GDZ_CA_M.orbsLane() : GDZ_CA_M.orbs();
            const k = gdzKit('The Coiled Altar', 16);
            k.boss('zj', 'Zul\'jan', 0, 0, 10); gdzCaRaid(k);
            const spots = [[-32, -16], [26, -12], [-31, -4], [32, -2], [-10, -30], [12, -32]], who = ['r2', 'r6', 'r3', 'r7', 'r4', 'r5'];
            spots.forEach(([x, y]) => k.ring({ x, y, r: 5, fx: 'soak', t0: 1, at: 3, dur: 2.6, color: '#5fd35f', cn: 'Toxic Deluge', legend: 'circle lands and leaves an orb' }));
            spots.forEach(([x, y], i) => { const [dx, dy] = gdzSpot(i, 6, 4.5), back = [dx < 0 ? -18 : 18, -12]; /* (then a step to the side, clear of the frontal) */ gdzCarry(k, who[i], 'o' + i, 'orb', 3, x, y, 3.4 + i * 0.35, dx, -15 + dy, 6 + i * 0.2, back); k.show('o' + i, 3, 14.4); });
            k.at(11.8, 't2', 7, 7).at(12.8, 't2', 0, 2).at(11.8, 't1', 0, 3).at(12.8, 't1', 6, 6);
            k.cast('zj', 'Sever', 12, 13.6).cone({ from: 'zj', to: 't2', at: 13.6, r: 35, hit: ['o0', 'o1', 'o2', 'o3', 'o4', 'o5'] }).ring1(['t1', 't2']);
            k.step(1).step(3).step(3.4).step(11.8).step(13.6);
            k.pause(13.1, 'Freeze. This is the pile: every orb right in front of the boss, and the off-tank has taunted. 5 to 7 orbs is fine. More hurts.', { x: 0, y: -15, r: 9 }); return k.done({ title: 'Toxic Deluge and Sever', focus: { x: 0, y: -4, r: 17 }, tagLabel: 'Carrying an orb', hlLabel: 'orb carriers and tanks' });
          } },
        { id: 'axe', fail: GDZ_CA_FAIL.axe, name: 'Guillotine (Two groups take turns)', what: 'An axe drops on a player. Everyone in its 9-yard circle splits the hit; with too few inside, it hits the whole raid. Six seconds after it lands, the spot erupts 40 yards out.',
          do: ['Axe on you? Walk to a corner, away from the raid.', 'Soak group: get in with them. Bring at least 5 to be safe.', 'The axe lands and the damage is split between everyone inside.', 'Now run. The spot erupts 40 yards out 6 seconds later (Widow\'s Kiss).', 'Everyone\'s clear. Walk or use a speed boost. Gateway into a soak, never out of one: orbs spawn on the path.'],
          note: 'Soaking leaves Guillotined (the next axe hits you 500% harder), so two soak groups take turns: group 1 takes this axe, group 2 the next.',
          m: { note: null, name: 'Guillotine (Planned soakers, immunities on the second)', what: 'An axe drops on a player. At least 5 must share its 9-yard circle, then everyone gets 40 yards away before it erupts. On Mythic, soaking marks you for the rest of the fight, so every soak is planned.',
            do: ['Axe target: you get gated into the back corner. Externals and a Zephyr go on you.', 'The first soak is big, 6 or 7: everyone who immunes the second axe, plus tanky players with a defensive.', 'The axe lands and the damage is split. Anyone marked can\'t be picked for the next axe.', 'Walk out of the 40 yards. There\'s plenty of time. Gate in, never out.', 'The second soak is exactly 5: both tanks with a defensive, both Hunters in Turtle, and Blessing of Protection on the target.'],
            plan: ['Phase 1 has two axes; phase 3 has three.', 'Why the Hunters soak the first axe: anyone carrying the debuff can\'t be targeted, so a Hunter can\'t be picked for axe 2 and leave the soak one short.', 'Good soak 1 extras: Shadow Priest (Dispersion), a Warrior (walls work well, the phase 1 axe is physical), a Rogue (Feint).', 'Phase 1 axes are physical: Blessing of Protection on the target works. Phase 3 axes are magic: a Rogue\'s Cloak and Blessing of Spellwarding (or a Paladin\'s Bubble) work instead, and big externals go on the target.', 'In phase 3 the first axe goes to the star marker, the second and third to the square.', 'Last axe of phase 3: send everyone who is free of the debuff. Five is the minimum and four wipes, so over-send.'] },
          map: (d, o) => {
            if (d === 'm') return GDZ_CA_M.axe(o);
            const k = gdzKit('The Coiled Altar', 13), C = [36, -36], grp = ['m5', 'm6', 'r6', 'h3'];
            k.boss('zj', 'Zul\'jan', 0, 0, 10); gdzCaRaid(k, ['r3'].concat(grp));
            k.at(0, 'r3', 24, -14).at(0, ['m5', 'm6'], 14, -10, 2).at(0, 'r6', 20, -8).at(0, 'h3', 12, -16);
            k.ring({ on: 'r3', r: 9, fx: 'soak', t0: 1, at: 6, dur: 5.8, color: '#f24824', cn: 'Guillotine', legend: '9-yard soak, 5 or more inside' });
            k.hold(1, 'r3').at(3.2, 'r3', C[0], C[1]); grp.forEach((id, i) => { const [dx, dy] = gdzSpot(i + 1, 5, 4); k.hold(1.2, id).at(4.6, id, C[0] + dx, C[1] + dy); });
            k.ring({ x: C[0], y: C[1], r: 40, fx: 'burst', t0: 6, at: 12, dur: 6.6, color: '#9ff26d', cn: 'Widow\'s Kiss', legend: 'erupts 40 yards around the spot, 6 s after' });
            ['r3'].concat(grp).forEach((id, i) => { k.ok(id, 6); const [dx, dy] = gdzSpot(i, 5, 5); k.hold(6.3, id).at(11, id, 2 + dx, -2 + dy); });
            k.ring1(['r3']).step(1).step(2.4).step(6).step(6.4).step(11);
            k.pause(5.6, 'Freeze. Count them: at least 5 in the circle, everyone else well away. In a moment the spot erupts 40 yards out.', { x: C[0], y: C[1], r: 11 }); return k.done({ title: 'Guillotine', focus: { x: 16, y: -14, r: 26 }, hlLabel: 'player with the axe', goodLabel: 'in the soak' });
          } },
      ],
      tiles: [
        { name: 'Fangs of the Coiled Altar (Avoid the puddles)', do: 'Raid damage each cast, and big poison pools pour in from the middle of both side walls for about 25 seconds. The first ones stop short of the boss; the second ones nearly touch by the boss and leave a lane that widens to the north and south, so the raid takes damage and healers plan for it. The tank takes extra poison from his next hits.' },
        { name: 'Axegrinder (Dodge the axes)', do: 'Axes roll around the room for 3 minutes and knock you back. They kill a lot of melee. If you must pick, stand in a puddle rather than in an axe.', m: { do: 'Axes roll around at random and never go away; three or four can sit in melee at once. Ranged: stay out of melee. Pick a puddle over an axe, and don\'t get knocked into a purple orb.' } },
        { name: 'Venomfang (Dispel fast)', do: 'A poison on players. Dispel it quickly. Poison Cleansing Totem handles it on its own.' },
        { only: 'm', name: 'Into phase 2 (Stack cooldowns)', spell: 'Venom Rupture', do: 'You go in with 9 to 11 orb stacks. Group up in a spot clear of axes, and use Darkness, Anti-Magic Zone and Spirit Link Totem. Stay inside until the stacks drop. Kill Zul\'jan around the pools.' },
      ] },
    { id: 'p2', name: 'Phase 2: Malacrass', sum: 'Hex Lord Malacrass takes over. Mind controls, ghosts led into the frontal, bombs, adds, and a shield to break.',
      m: { sum: 'Malacrass. Mind controls always stack on the square marker, ghosts get frozen apart and swept by the frontal, bombs go on the adds, and every second set brings the shield.' },
      mechs: [
        { id: 'dm', fail: GDZ_CA_FAIL.dmH, name: 'Dreadmarch (Stack them, then pile the ghosts)', spell: 'Dreadmarch', what: 'A few players get mind controlled and walk toward the edge with a big shield on. When they break free, two ghosts chase each of them. A ghost only moves while its target isn\'t looking at it.',
          do: ['A few players are mind controlled and start walking to the edge.', 'The raid brings them to the set spot, stuns or roots them there and breaks their shields. Mind controlled? Press your cancel macro.', 'Once free, stand still until your ghosts spawn: two each.', 'Lead your ghosts into one pile in front of the boss, then turn and look at them so they freeze.', 'Soul Sever, the tank frontal, wipes out every ghost in it. Hit by it? Pick up your 3 Soul Fragments or you die.'],
          note: 'A ghost that reaches its player mind controls them again.',
          m: { fail: GDZ_CA_FAIL.dmM, name: 'Dreadmarch (Stack on square, freeze your ghosts)', what: 'A few players get mind controlled with a big shield. When freed, two ghosts chase each of them. Only you can see your ghosts, and two ghosts touching kills both players.',
            do: ['Arrow over your head? Press the cancel macro. The raid stacks on the square marker.', 'The raid stuns or roots them on the square (Ring of Peace, Leg Sweep, Shockwave, Ursol\'s Vortex, Mass Grip, Chaos Nova) and breaks the shields.', 'Freed? Stand still. Your ghosts spawn where you stand, so they land near the square. Look at yours right away.', 'Keep your ghosts frozen and apart: the dashed line is you looking at yours. Only if yours is outside the frontal, look away and let it creep in.', 'Boss tank: step toward the diamond or the circle so Soul Sever hits the most ghosts. The frontal wipes them out.'],
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
            mc.forEach((id, i) => { k.at(8.2, id, -3 + i * 3, -16).at(9.8, id, -14 + i * 2, -7 + i); for (let j = 0; j < 2; j++) k.link({ from: id, to: 'g' + i + j, t0: 9.7, t1: 11, color: '#c49bff', dash: true, legend: 'looking at their ghost: it stays frozen' }); }); /* (pile made: they turn and look, so the ghosts freeze) */
            k.cast('hm', 'Soul Sever', 9.8, 11).cone({ from: 'hm', to: 't1', at: 11, r: 45, hit: ['g00', 'g01', 'g10', 'g11', 'g20', 'g21'] });
            k.ring1(mc).step(1).step(2).step(6).step(7).step(11);
            k.pause(9.7, 'Freeze. The ghosts are piled in front of the boss and their players have stepped aside. Now the frontal takes them all.', { x: 0, y: -13, r: 9 }); return k.done({ title: 'Dreadmarch and Soul Sever', focus: { x: -4, y: -4, r: 18 }, hlLabel: 'mind-controlled players', tagLabel: 'Mind controlled, with a shield' });
          } },
        { id: 'bombs', fail: GDZ_CA_FAIL.bombs, only: 'm', name: 'Gloombomb (Drop it on your add)', what: 'The two Soulcoiler adds take almost no damage until 2 Gloombombs hit each one. Every time, 2 ranged and 2 melee get a bomb that explodes 15 yards around them.',
          do: ['Bombs are out. Kick the adds the moment the Gloombomb cast shows, so they stand still.', 'Ranged bombs go to the ranged add, melee bombs to the melee add, one on each side of it. Everyone else stays 15 yards away. Bombs: use your best defensive.', 'The bombs go off on the adds and break their shields. Now kill them.', 'Kick every Wail of Terror. The melee add\'s second kick has to be a melee.'],
          plan: ['One add is the ranged add and the other the melee add. One player marks the ranged add and calls where both are: marked means ranged kicks, unmarked means melee kicks.', 'Which is which, by where they spawn (the plan\'s rule): an add at the moon is always ranged; an add beside the stack spot is always melee.', 'Skull add: melee if the other is at the moon, ranged if the other is at the square or star. Star add: melee if the other is at the moon or skull, ranged if the other is at the square.', 'Every second set of adds is followed by Eternal Nightfall, so the adds must die before the next set but the shield comes first.', 'The last set before the intermission doesn\'t need bombs: their shields break at the transition. Just keep kicking.'],
          map: (d, o) => GDZ_CA_M.bombs(o) },
      ],
      tiles: [
        { only: 'h', name: 'Gloombomb (Run out)', do: 'Marked players explode 15 yards around them. Run away from everyone first. Anyone hit must pick up their Soul Fragments.' },
        { name: 'Eternal Nightfall (Break the shield)', do: 'Malacrass shields himself and starts a cast that wipes the raid. Break the shield to stop it (save damage for it), and dodge the purple circles.', m: { do: 'Comes after every second set of adds. Assign big cooldowns to each shield and pool damage for it. Boss damage barely matters in this phase: the shield is the real damage check.' } },
        { name: 'Spiritcackle (Kick and kill)', spell: 'Wail of Terror', do: 'Adds cast Wail of Terror, a raid fear. Kick it (they teleport after each kick) and kill them before they reach full energy.', m: { do: 'Keep a kick rotation on each add (a Protection Paladin can solo the ranged one, but it isn\'t needed). Two Warlocks can Curse of Tongues every add.' } },
        { name: 'Soul Sever (Tanks swap)', do: 'The tank frontal. Swap tanks after each one, and aim it through the ghosts.', m: { do: 'One tank can take them all: a defensive on odd casts, a defensive and two externals on even ones. Aim it through as many ghosts as you can.' } },
      ] },
    { id: 'int', name: 'Intermission: Soulbinding', sum: 'Zul\'jan comes back healing himself but taking double damage. Bloodlust here.',
      mechs: [
        { id: 'frags', fail: GDZ_CA_FAIL.frags, name: 'Fragments of Malacrass (Stop them in turns)', what: 'Zul\'jan comes back healing 2% a second for 35 seconds, but he takes double damage. Fragments walk to him, and each one that gets there heals him about 10%. Stopping one hits the whole raid.',
          do: ['Zul\'jan is healing but takes double damage. Bloodlust, potions, everything.', 'Fragments spawn around the room and walk toward him.', 'Step in their path to stop them. Each stop hits the whole raid (Spirit Erasure).', 'Stop a couple at a time, spread out, with healing cooldowns ready.'],
          m: { name: 'Fragments of Malacrass (3 to 5, then 7 to 10)', what: 'Zul\'jan heals 2% a second but takes double damage. Each fragment that reaches him heals him about 10%, close to a wipe. Each stop hits the raid and makes the next one 20% stronger for 2 seconds.',
            do: ['Bloodlust, potions, every cooldown. The raid held damage at the end of phase 2 for this.', 'Fragments spawn at the edges, plus one sneaky one on the inner ring. Mobile healers and the off-tank cover their areas; the rest of the raid circles the boss.', 'Stop 3 to 5, then let the stacks drop.', 'Again: 3 to 5, wait, repeat. About five rounds.', 'Near the end, the raid stacks cooldowns in the middle and stops 7 to 10 at once.'],
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
              const sa = k.posAt(who, 0), wk = Math.max(3.2, Math.hypot(tgt[0] - sa[0], tgt[1] - sa[1]) / 8); k.at(ts - wk, who, sa[0], sa[1]).at(ts, who, tgt[0], tgt[1]).at(ts + wk, who, sa[0], sa[1]);
              k.ring({ on: who, r: 3, fx: 'burst', t0: ts - 1.2, at: ts, dur: 1.4, color: '#b65cff', cn: 'Spirit Erasure', legend: 'a stop: hits the whole raid' }).ring1(who); });
            k.step(0).step(1).step(3.6).step(5.6);
            k.pause(3.3, 'Freeze. One player steps into each fragment\'s path, a couple at a time, spread out. Every stop hits the raid.'); return k.done({ title: 'Fragments of Malacrass', focus: { x: 0, y: 4, r: 18 }, hlLabel: 'players stopping a fragment' });
          } },
      ] },
    { id: 'p3', name: 'Phase 3: Coiled Union', sum: 'Both bosses at once, with everything from phases 1 and 2 together.',
      m: { sum: 'Both bosses, everything at once. Play on the star and square side; purples are all that matter; kill Zul\'jan before his next pool cast.' },
      mechs: [
        { id: 'diamond', fail: GDZ_CA_FAIL.diamond, only: 'm', name: 'Blighted Sever (All purples in one diamond)', what: 'The frontal is bigger now and hits orbs and ghosts. The first one takes every purple at once, set out in a diamond. Greens go to one side.',
          do: ['Orbs are down. Carriers now: both Mages, the off-tank and the Evoker healer.', 'Everyone else: clear the greens out of the middle and line them up on one side. A missed green is fine. A missed purple wipes.', 'Carriers build the purple diamond in the middle, each one well clear of the others. Use a purple that\'s already in place.', 'Off-tank: take the first phase 3 frontal and aim it through the whole diamond.'],
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
// the note shown while a map is frozen at a key moment: the raid lead's words, and a bar running down until it plays on
function gdzPauseUi(zbox, label) {
  const el = document.createElement('div'); el.className = 'gdz-vpause'; el.innerHTML = '<b>⏸ ' + (label || 'Raid lead') + '</b><span></span><i></i>'; zbox.appendChild(el);
  return (p) => { if (!p) { el.classList.remove('on'); return; } el.querySelector('span').textContent = p.text; const bar = el.querySelector('i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = 'gdzBar ' + (p.dur || 3.6) + 's linear forwards'; el.classList.add('on'); };
}
// Boss guides as a page of its own (your call, Oct 20: in the menu, not a tab, open to anyone without a report or sign-in).
// Coming from a pull, a button takes you back to it.
let GDZ_BACK = null;
function openGuides(boss, d) {
  if (S.page === 'pull' && S.item) GDZ_BACK = { item: S.item, tab: S.tab, scope: S.scope };
  if (typeof LIVE !== 'undefined' && LIVE.on) setLive(false);
  if (boss && GDZ[boss]) S.gdzBoss = boss; if (d === 'm' || d === 'h') S.gdzDiff = d; else if (!S.gdzDiff) S.gdzDiff = 'm';
  S.item = null; S.rep = null; S.page = 'guides';
  $('#list').innerHTML = ''; $('#bossHead').innerHTML = ''; $('#bossPick').innerHTML = '';
  $('#main').innerHTML = '<div class="gdz-pagetop">' + (GDZ_BACK && S.index ? '<button type="button" class="btn gdz-back">‹ Back to your pull</button>' : '') + '<div><div class="gdz-kick">Debrief</div><h1>Boss guides</h1><p>How each fight works: the plan in plain words, animated maps, what goes wrong, and the whole fight played out.</p></div></div><section id="view"></section>';
  const bk = $('#main .gdz-back'); if (bk) bk.onclick = () => { const g = GDZ_BACK; GDZ_BACK = null; S.tab = g.tab || 'audit'; S.scope = g.scope || 'pull'; select(g.item); };
  gdzView(); navNote(); window.scrollTo(0, 0);
}
function gdzView() {
  gdzCss();
  const have = GDZ_ORDER.filter((b) => GDZ[b]);
  if (!S.gdzBoss || !GDZ[S.gdzBoss]) S.gdzBoss = S.rep && S.rep.item && GDZ[S.rep.item.boss] ? S.rep.item.boss : have[0];
  // Heroic or Mythic: each its own guide (your call, Oct 20: positions change a lot between them). It opens on the open pull's
  // difficulty. A part can be one difficulty only (only: 'h' / 'm') or change on one (h: { .. } / m: { .. } over the shared fields).
  if (!S.gdzDiff) S.gdzDiff = S.rep && S.rep.item && S.rep.item.diffId !== 16 ? 'h' : 'm';
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
    (p.mechs || []).map((m) => { const n = mi++; maps.push(m); return '<article class="gdz-m">' + (m.map ? '<div class="gdz-mapc">' + (m.fail ? '<div class="gdz-mode" data-i="' + n + '"><button type="button" class="on" data-v="ok">✓ The right way</button><button type="button" data-v="bad">✕ Show a mistake</button></div>' : '') + '<div class="gdz-mm" data-i="' + n + '"></div></div>' : '') +
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
  const whole = hasMaps ? '<section class="gdz-sec" id="gdz-all"><div class="gdz-sh"><i>★</i><div><div class="gdz-kick">Animated simulation</div><h3>Putting it all together</h3><p>' + (G.sim ? 'The whole fight in the order of a real kill, every mechanic down to the dispels and taunts. Quiet stretches are cut; the time shown is the real fight clock. Pick a moment to jump there.' : 'The whole fight on one map, start to finish. Each step shows up as it happens; pick a chapter to jump there.') + '</p></div></div>' +
    '<article class="gdz-m gdz-whole"><div class="gdz-mapc"><div class="gdz-mm" data-w="1"></div></div><div class="gdz-mt"><ol class="gdz-chaps"></ol></div></article></section>' : '';
  view('<div class="gdz">' + pick + head + phNav + keyRow + G.phases.map(sec).join('') + whole + roles + '<p class="gdz-foot">' + (D === 'm' ? 'Mythic' : 'Heroic') + ' guide. ' + (G.source ? 'Based on ' + esc(G.source) + ', in our own words.' : 'From the guides, in our own words.') + ' The maps are examples of where to stand, not a real pull.</p></div>');
  const root = document.querySelector('#view .gdz');
  root.querySelectorAll('.gdz-pb:not(.soon)').forEach((b) => (b.onclick = () => { S.gdzBoss = b.dataset.b; gdzView(); if (S.page === 'guides') navNote(); window.scrollTo({ top: Math.min(window.scrollY, (document.querySelector('#view').getBoundingClientRect().top + window.scrollY) - 70) }); }));
  root.querySelectorAll('.gdz-diff button').forEach((b) => (b.onclick = () => { if (b.dataset.d === D) return; S.gdzDiff = b.dataset.d; const y = window.scrollY; gdzView(); window.scrollTo({ top: y }); if (S.page === 'guides') navNote(); }));
  root.querySelectorAll('.gdz-phc').forEach((a) => (a.onclick = (e) => { e.preventDefault(); const el = document.getElementById(a.getAttribute('href').slice(1)); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); }));
  // the maps: built when they're first near the screen, then played by the Debriefing's own player
  const pmap = gdzPmap();
  const mountWhole = (box) => {
    const key = boss + '|' + D + '|whole'; let W = GDZ_CACHE.get(key);
    if (!W) { try { W = gdzWhole(boss, G, D); } catch (e) { console.error(e); box.innerHTML = '<p class="muted">This map could not be drawn.</p>'; return; } GDZ_CACHE.set(key, W); }
    box.innerHTML = miniMap(W.mp, pmap); bindZoom(box); hydrateMapIcons(box);
    const art = box.closest('.gdz-m'), ol = art.querySelector('.gdz-chaps'), zb = box.querySelector('.zbox'), svg = box.querySelector('svg.zmap'), clk = (t) => (t == null ? '' : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0'));
    // (the scenes, under their phase, each with its real time when there is one)
    let lastPh = 0; ol.innerHTML = W.chaps.map((c, i) => (c.ph !== lastPh ? ((lastPh = c.ph), '<li class="gdz-chh">' + esc(c.phase) + '</li>') : '') +
      '<li data-c="' + i + '"><i>' + (W.real ? clk(c.rt) : c.ph) + '</i><span><b>' + esc(c.name) + '</b></span></li>').join('');
    const lis = [...ol.querySelectorAll('li[data-c]')];
    // the video layer over the map, like a guide video: a badge with the phase and the fight clock, a title card at the start and at
    // each phase, and a lower-third caption (the mechanic's instruction big, the step under it with its key words lit)
    const vid = document.createElement('div'); vid.className = 'gdz-vid'; vid.innerHTML = '<div class="gdz-vchip"></div><div class="gdz-vcard"></div><div class="gdz-vlow"><div class="gdz-vlk"></div><div class="gdz-vlt"></div><div class="gdz-vls"></div></div>'; zb.appendChild(vid);
    const vchip = vid.querySelector('.gdz-vchip'), vcard = vid.querySelector('.gdz-vcard'), vlow = vid.querySelector('.gdz-vlow'); box._onPause = gdzPauseUi(vid);
    const KEYW = /\b(dodge|soak|run|dispel|dispels|taunt|taunts|kick|stack|stacks|look|burst|break|stop|never|carry|pop|pops|spread|walk|step out|hold|kill|swap|stand still|wipes?|dies?|die|bloodlust|cooldowns?|defensive|purples?|greens?)\b|\b\d+(?:\s?(?:to|or)\s?\d+)?(?:\s?(?:yards?|seconds?|%|orbs?))?/gi;
    const lit = (t) => esc(t).replace(KEYW, (m) => '<em>' + m + '</em>');
    // the camera: glides to each scene's own view as it starts; dragging the map stops it until Follow is pressed again
    const zbar = box.querySelector('.zbar'), o = (svg.dataset.o || '0,0').split(',').map(Number), yd = +svg.dataset.yd, A = ARENAS[boss] || { cx: 0, cy: 0 };
    const camVB = (f) => { const span = Math.max(30, f.r * 3.2), fx0 = (A.cx + f.x) - span * 0.6, fy0 = -(A.cy + f.y) - span * 0.6; return [(fx0 - o[0]) * yd, (fy0 - o[1]) * yd, span * 1.2 * yd, span * 1.2 * yd]; };
    let follow = true, camC = -1, tw = null; const cur0 = () => svg.getAttribute('viewBox').split(/[ ,]+/).map(Number);
    const glide = (to) => { const fr = cur0(), t0 = performance.now(); if (tw) cancelAnimationFrame(tw); const st = (now) => { const p = Math.min(1, (now - t0) / 900), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      box._zoomTo(fr.map((v, i) => v + (to[i] - v) * e)); if (p < 1 && follow) tw = requestAnimationFrame(st); }; tw = requestAnimationFrame(st); };
    const fb = document.createElement('button'); fb.type = 'button'; fb.className = 'btn gdz-follow on'; fb.textContent = '🎥 Follow the action'; zbar.prepend(fb);
    fb.onclick = () => { follow = !follow; fb.classList.toggle('on', follow); if (follow) { camC = -1; } };
    svg.addEventListener('pointerdown', () => { if (follow) { follow = false; fb.classList.remove('on'); if (tw) cancelAnimationFrame(tw); } });
    svg.addEventListener('wheel', () => { if (follow) { follow = false; fb.classList.remove('on'); } }, { passive: true });
    for (const b of box.querySelectorAll('.zfull, .zfocus, .zin, .zout')) b.addEventListener('click', () => { follow = false; fb.classList.remove('on'); });
    // full screen, for watching it like a video
    const fs = document.createElement('button'); fs.type = 'button'; fs.className = 'btn gdz-fs'; fs.textContent = '⛶ Full screen'; zbar.appendChild(fs);
    fs.onclick = () => { const el = art.querySelector('.gdz-mapc'); if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); };
    let cur = '', lastPhase = -1;
    box._onFrame = (ft) => {
      let j = -1, c = 0; W.caps.forEach((q, i) => { if (ft >= q.t - 0.01) j = i; }); W.chaps.forEach((q, i) => { if (ft >= q.t - 0.01) c = i; });
      const q = j >= 0 && W.caps[j].c === c ? W.caps[j] : null, ch = W.chaps[c], rt = W.real ? clk(W.clock(ft)) : '';
      vchip.innerHTML = '<b>' + esc(ch.phase.replace(/:.*$/, '')) + '</b>' + (rt ? '<span>' + rt + '</span>' : '');
      // (title cards: the fight's at the start, then each phase's as it begins)
      const phStart = W.chaps.find((x) => x.ph === ch.ph).t, card = ft < 3 ? 0 : ft - phStart < 2.6 && ch.ph > 1 ? ch.ph : -1;
      if (card !== lastPhase) { lastPhase = card; vcard.classList.toggle('on', card >= 0);
        if (card === 0) vcard.innerHTML = '<small>' + esc(D === 'm' ? 'Mythic guide' : 'Heroic guide') + '</small><h3>' + esc(boss) + '</h3><p>' + esc(W.chaps.length + ' moments, in the order of a real kill') + '</p>';
        else if (card > 0) vcard.innerHTML = '<small>' + esc('Phase ' + card) + '</small><h3>' + esc(ch.phase.replace(/^[^:]*:\s*/, '')) + '</h3>'; }
      if (follow && c !== camC) { camC = c; glide(camVB(ch.foc || { x: 0, y: 0, r: 26 })); }
      const k2 = j + '|' + c; if (k2 === cur) return; cur = k2;
      const big = (ch.name.match(/\(([^)]*)\)/) || [])[1] || ch.name, small = ch.name.replace(/\s*\(.*$/, '');
      vlow.classList.remove('in'); void vlow.offsetWidth; vlow.classList.add('in');
      vlow.children[0].textContent = big === ch.name ? '' : small; vlow.children[1].textContent = big; vlow.children[2].innerHTML = q ? lit(q.text) : '';
      lis.forEach((li, i) => { li.classList.toggle('on', i === c); li.classList.toggle('past', i < c); });
      // (the list keeps the scene playing in view, inside its own box, without moving the page)
      const on = lis[c]; if (on && ol.scrollHeight > ol.clientHeight) { const top = on.offsetTop; if (top < ol.scrollTop || top > ol.scrollTop + ol.clientHeight - 40) ol.scrollTop = Math.max(0, top - 60); }
    };
    lis.forEach((li) => (li.onclick = () => { const i = +li.dataset.c, rng = box.querySelector('.zrange'); if (!rng) return; let fi = 0; W.mp.frames.forEach((fr, z) => { if (fr.t <= W.chaps[i].t + 0.3) fi = z; }); rng.value = fi; rng.dispatchEvent(new Event('input')); }));
    bindAnim(box, W.mp, pmap, true);
  };
  const mount = (box) => {
    if (box._on) return; box._on = 1; if (box.dataset.w) { mountWhole(box); return; } const m0 = maps[+box.dataset.i], bad = box.dataset.v === 'bad' && m0.fail, m = bad ? m0.fail : m0, key = boss + '|' + D + '|' + (bad ? 'fail|' : '') + m0.name;
    let mp = GDZ_CACHE.get(key); if (!mp) { try { mp = m.map(D); } catch (e) { console.error(e); box.innerHTML = '<p class="muted">This map could not be drawn.</p>'; return; } GDZ_CACHE.set(key, mp); }
    box.innerHTML = miniMap(mp, pmap); bindZoom(box); hydrateMapIcons(box);
    if ((mp.pauses || []).length) { const zb = box.querySelector('.zbox'); if (zb) box._onPause = gdzPauseUi(zb); }
    const ol = root.querySelector('.gdz-steps[data-i="' + box.dataset.i + '"]'), lis = ol ? [...ol.querySelectorAll('li')] : [], st = mp.steps || [];
    // (each step lights while it plays; clicking one jumps the map there)
    if (lis.length && st.length) {
      // (on a phone the list sits under the map, out of view: the step playing also shows as a caption right under the map)
      const cap = document.createElement('div'); cap.className = 'gdz-cap'; (box.querySelector('.zbox') || box).after(cap); /* (under the map: the play bar is inside it now) */
      let cur = -1; box._onFrame = (ft) => { let j = -1; st.forEach(([t], q) => { if (ft >= t - 0.01) j = q; }); if (j !== cur) { cur = j; lis.forEach((li, q) => { li.classList.toggle('on', q === j); li.classList.toggle('past', q < j); });
        cap.innerHTML = j < 0 ? '' : '<i>' + (j + 1) + '</i><span>' + esc((m.do || [])[j] || '') + '</span>'; } };
      lis.forEach((li, q) => { if (!st[q]) return; li.classList.add('go'); li.onclick = () => { const rng = box.querySelector('.zrange'); if (!rng) return; let fi = 0; mp.frames.forEach((f, z) => { if (f.t <= st[q][0] + 0.3) fi = z; }); rng.value = fi; rng.dispatchEvent(new Event('input')); }; });
    }
    bindAnim(box, mp, pmap, true);
  };
  root.querySelectorAll('.gdz-mode').forEach((sw) => sw.querySelectorAll('button').forEach((bt) => (bt.onclick = () => {
    const i = sw.dataset.i, m0 = maps[+i], box = sw.parentElement.querySelector('.gdz-mm'), art = sw.closest('.gdz-m'), ol = art.querySelector('.gdz-steps'), v = bt.dataset.v;
    if (box.dataset.v === v || (!box.dataset.v && v === 'ok')) return;
    sw.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === bt)); box.dataset.v = v;
    const old = art.querySelector('.gdz-failnote'); if (old) old.remove();
    const list = v === 'bad' ? m0.fail.do : m0.do;
    if (ol) { ol.innerHTML = list.map((d, j) => '<li data-j="' + j + '"><span>' + esc(d) + '</span></li>').join(''); ol.classList.toggle('gdz-bad', v === 'bad');
      if (v === 'bad') ol.insertAdjacentHTML('beforebegin', '<div class="gdz-failnote"><b>Mistake: ' + esc(m0.fail.name) + '</b>' + esc(m0.fail.what) + '</div>'); }
    box._on = 0; box._onFrame = null; box.innerHTML = ''; mount(box);
  })));
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
.gdz-pagetop { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; margin: 18px 0 16px; }
.gdz-pagetop h1 { font: 800 32px/1.1 var(--head); margin: 2px 0 4px; }
.gdz-pagetop p { margin: 0; color: var(--muted); max-width: 640px; }
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
.gdz-whole .zbox { container-type: inline-size; overflow: hidden; }
.gdz-vid { position: absolute; inset: 0; pointer-events: none; font-family: var(--head); }
.gdz-vchip { position: absolute; top: 3%; left: 3%; display: flex; gap: .6em; align-items: center; background: rgba(8,9,13,.82); border: 1px solid rgba(230,180,80,.6); border-radius: 999px; padding: .25em .8em; font-size: clamp(11px, 2.6cqw, 22px); color: #fff; }
.gdz-vchip b { color: var(--gold); letter-spacing: .06em; text-transform: uppercase; } .gdz-vchip span { font-variant-numeric: tabular-nums; }
.gdz-vcard { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: radial-gradient(ellipse at center, rgba(8,9,13,.9) 0%, rgba(8,9,13,.65) 55%, rgba(8,9,13,0) 100%); opacity: 0; transform: scale(1.06); transition: opacity .45s, transform .6s; }
.gdz-vcard.on { opacity: 1; transform: none; }
.gdz-vcard small { color: var(--gold); font-weight: 800; letter-spacing: .2em; text-transform: uppercase; font-size: clamp(11px, 2.6cqw, 22px); }
.gdz-vcard h3 { margin: .1em 0; font-size: clamp(24px, 8cqw, 72px); font-weight: 800; color: #fff; text-shadow: 0 3px 18px rgba(0,0,0,.8); line-height: 1.05; }
.gdz-vcard p { margin: 0; color: #d8d2c4; font-family: var(--body); font-size: clamp(11px, 2.4cqw, 20px); }
.gdz-vlow { position: absolute; left: 2%; right: auto; max-width: 84%; bottom: 2%; background: linear-gradient(90deg, rgba(8,9,13,.94), rgba(8,9,13,.82)); border-left: .35em solid var(--gold); border-radius: .5em; padding: .35em .7em .4em; font-size: clamp(10px, 2cqw, 17px); color: #fff; box-shadow: 0 6px 20px rgba(0,0,0,.45); }
.gdz-vlow.in { animation: gdzLow .45s ease-out; }
@keyframes gdzLow { from { transform: translateY(20%); opacity: 0; } to { transform: none; opacity: 1; } }
.gdz-vlk { color: var(--gold); font-weight: 800; letter-spacing: .08em; text-transform: uppercase; font-size: .72em; }
.gdz-vlk:empty { display: none; }
.gdz-vlt { font-weight: 800; font-size: 1.2em; line-height: 1.1; text-transform: uppercase; letter-spacing: .02em; }
.gdz-vls { font-family: var(--body); font-size: .9em; line-height: 1.3; margin-top: .2em; color: #e9e4d8; }
.gdz-vls:empty { display: none; }
.gdz-vls em { font-style: normal; font-weight: 800; color: #ffd36a; }
.gdz-mm .zbox { container-type: inline-size; }
.gdz-vpause { position: absolute; top: 12%; left: 50%; transform: translate(-50%, -8px); width: min(86%, 560px); background: rgba(8,9,13,.94); border: 2px solid var(--gold); border-radius: .6em; padding: .55em .9em .7em; font-size: clamp(12px, 2.6cqw, 21px); color: #fff; opacity: 0; transition: opacity .3s, transform .3s; pointer-events: none; box-shadow: 0 8px 26px rgba(0,0,0,.55); z-index: 2; overflow: hidden; }
.gdz-vpause.on { opacity: 1; transform: translate(-50%, 0); }
@media (hover: hover) and (pointer: fine) { .gdz-vlow { transition: bottom .18s; } .zbox:hover .gdz-vlow, .zbox:focus-within .gdz-vlow { bottom: 60px; } } /* (the caption steps up out of the play bar's way) */
.gdz-vpause b { display: block; color: var(--gold); font: 800 .75em var(--head); letter-spacing: .12em; text-transform: uppercase; margin-bottom: .15em; }
.gdz-vpause span { font-family: var(--body); line-height: 1.35; }
.gdz-vpause i { position: absolute; left: 0; bottom: 0; height: 3px; width: 100%; background: var(--gold); transform-origin: left; }
@keyframes gdzBar { from { transform: scaleX(1); } to { transform: scaleX(0); } }
.gdz-follow.on { border-color: var(--gold); color: var(--gold); }
.gdz-mapc:fullscreen { background: #000; display: flex; align-items: center; justify-content: center; padding: 1vh 1vw; }
.gdz-mapc:fullscreen .gdz-mm { width: min(100%, 92vh); }
.gdz-mapc:fullscreen .zleg, .gdz-mapc:fullscreen .zbar .sub { display: none; }
.gdz-now { background: rgba(230,180,80,.08); border: 1px solid rgba(230,180,80,.45); border-radius: 10px; padding: 14px 16px; min-height: 150px; }
.gdz-nowph { font: 700 12px var(--head); letter-spacing: .1em; text-transform: uppercase; color: var(--gold); }
.gdz-now h4 { font: 700 21px/1.25 var(--head); margin: 2px 0 8px; }
.gdz-now p { margin: 0; display: flex; gap: 10px; align-items: flex-start; font-size: 16px; }
.gdz-now p i { font-style: normal; flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--gold); color: var(--gold-ink); font: 800 13px var(--head); margin-top: 1px; }
.gdz-now p.gdz-nowwait { color: var(--muted); }
.gdz-chaps { list-style: none; margin: 0; padding: 0 4px 0 0; display: flex; flex-direction: column; gap: 3px; max-height: 430px; overflow-y: auto; position: relative; }
.gdz-chaps li.gdz-chh { cursor: default; padding: 8px 4px 2px; font: 700 12px var(--head); letter-spacing: .08em; text-transform: uppercase; color: var(--gold); }
.gdz-chaps li.gdz-chh:hover { background: none; }
.gdz-chaps li i { width: auto; min-width: 21px; padding: 0 5px; border-radius: 999px; }
.gdz-nowph span { color: var(--muted); letter-spacing: 0; text-transform: none; }
.gdz-cap em { font-style: normal; flex: none; font: 700 12px var(--head); color: var(--gold); padding-top: 2px; }
.gdz-chaps li { display: flex; gap: 10px; align-items: center; padding: 6px 10px; border-radius: 8px; border: 1px solid transparent; cursor: pointer; color: var(--muted); }
.gdz-chaps li:hover { background: var(--raised); }
.gdz-chaps li i { font-style: normal; flex: none; width: 21px; height: 21px; border-radius: 50%; display: grid; place-items: center; background: var(--raised); border: 1px solid var(--line2); font: 800 12px var(--head); }
.gdz-chaps li span { display: flex; flex-direction: column; line-height: 1.25; }
.gdz-chaps li b { font-weight: 600; } .gdz-chaps li em { font-style: normal; font-size: 12px; color: var(--faint); }
.gdz-chaps li.past { color: var(--text); }
.gdz-chaps li.on { background: rgba(230,180,80,.1); border-color: rgba(230,180,80,.45); color: var(--text); }
.gdz-chaps li.on i { background: var(--gold); color: var(--gold-ink); border-color: var(--gold); }
.gdz-mode { display: flex; gap: 4px; margin-bottom: 8px; background: var(--raised); border: 1px solid var(--line2); border-radius: 999px; padding: 3px; width: fit-content; }
.gdz-mode button { background: none; border: 0; border-radius: 999px; padding: 4px 14px; font: 700 13.5px var(--head); color: var(--muted); cursor: pointer; }
.gdz-mode button[data-v="ok"].on { background: var(--good); color: #0b1a0f; }
.gdz-mode button[data-v="bad"].on { background: var(--bad); color: #fff; }
.gdz-failnote { background: var(--bad-bg); border: 1px solid rgba(229,83,75,.55); border-radius: 8px; padding: 9px 12px; margin: 0 0 10px; font-size: 14px; }
.gdz-failnote b { display: block; color: #ff8a80; font: 700 15px var(--head); margin-bottom: 2px; }
.gdz-steps.gdz-bad li.on { background: rgba(229,83,75,.12); border-color: rgba(229,83,75,.5); }
.gdz-steps.gdz-bad li.on::before { background: var(--bad); color: #fff; border-color: var(--bad); }
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
// (for tests/guides-safety.js, run in the console of the app on your PC; never set on the website)
if (!window.WLA_HOSTED) window.__gdz = { GDZ, gdzWhole };
