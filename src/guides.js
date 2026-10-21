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
  const U = new Map(), A = GDZ_ORIGIN[boss] || ARENAS[boss] || { cx: 0, cy: 0 }, k = { waves: [], beams: [], arcs: [], artAt: [], pauses: [], calls: [], wmarks: [], rings: [], cones: [], links: [], arrows: [], tags: [], cbars: {}, steps: [], hl: new Set(), good: [], goodAt: [], bad: [], badAt: [] };
  // seg: the stretch being written (T: its start, pre: its own names for orbs, adds and bosses, w: its window); players carry on
  const seg = { T: 0, pre: '', w: null, rot: 0, sq: GDZ_SQ[boss] || 0 }, CL = (v) => (seg.sq && v != null ? Math.max(-seg.sq, Math.min(seg.sq, v)) : v), RO = (x, y) => { if (!seg.rot || x == null || y == null) return [x, y]; const a = seg.rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a); return [Math.round((x * c - y * sn) * 1000) / 1000, Math.round((x * sn + y * c) * 1000) / 1000]; },
    RI = (p) => { if (!seg.rot || !p) return p; const a = -seg.rot * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a); return [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]; }, isP = (id) => /^[thmr]\d$/.test(id), P = (id) => (id == null || isP(id) ? id : seg.pre + id), TT = (t) => (t == null ? t : t + seg.T);
  const unit = (id, kind, name) => { if (!U.has(id)) U.set(id, { id, kind, name: name || (kind === 'player' ? gdzName(id) : String(id).replace(/^s\d+:/, '')), path: [], from: seg.w && kind !== 'player' ? seg.w[0] : -1, to: seg.w && kind !== 'player' ? seg.w[1] : Infinity }); return U.get(id); };
  const put = (u, t, x, y, fixed) => { u.path.push([t, x, y, !!fixed]); u.path.sort((a, b) => a[0] - b[0]); };
  const posRaw = (id, t) => { const u = U.get(id); if (!u || !u.path.length) return null; const p = u.path; if (t <= p[0][0]) return [p[0][1], p[0][2]];
    for (let i = 0; i < p.length - 1; i++) if (t <= p[i + 1][0]) { const a = p[i], b = p[i + 1], w = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1; return [a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w]; }
    const z = p[p.length - 1]; return [z[1], z[2]]; };
  const kit = {
    posAt: (id, t) => RI(posRaw(P(id), TT(t))), peek: () => k, /* (the drawing so far, for checks like the axe dodge) */ // (in the layout's own frame, so a turned layout reads back what it wrote)
    // (turn the layout that follows by deg (counterclockwise): a plan drawn one way round, fitted to the room)
    rot(deg) { seg.rot = deg || 0; return kit; },
    // one player (id like 'm3') at a spot at a moment; or a group of players in a clump around a spot
    at(t, ids, x, y, spread, fixed) { ids = [].concat(ids); ids.forEach((id, i) => { const [dx, dy] = spread ? gdzSpot(i, ids.length, spread) : [0, 0]; const q0 = RO(CL(x + dx), CL(y + dy)); put(unit(id, 'player'), TT(t), q0[0], q0[1], fixed); }); return kit; },
    // the same players stay where they are until t (so the next move starts then, not from the start)
    hold(t, ids) { for (const id of [].concat(ids)) { const p = posRaw(id, TT(t)); if (p) put(unit(id, 'player'), TT(t), p[0], p[1], true); } return kit; }, /* (a hold is a wait: the speed limit never moves it earlier) */
    boss(id, name, t, x, y) { const q0 = RO(x, y); put(unit(P(id), 'boss', name), TT(t), q0[0], q0[1]); return kit; },
    add(id, name, t, x, y) { const q0 = RO(x, y); put(unit(P(id), 'add', name), TT(t), q0[0], q0[1]); return kit; },
    // orbs ('orb' green, 'porb' purple) and ghosts ('ghost'): from when they appear, until they're gone
    obj(id, kind, t, x, y) { const q0 = RO(CL(x), CL(y)); put(unit(P(id), kind), TT(t), q0[0], q0[1]); return kit; },
    show(id, from, to) { const u = U.get(P(id)); if (u) { if (from != null) u.from = TT(from); if (to != null) u.to = TT(to); } return kit; },
    // a circle: fixed (x, y) or on a unit (on), from t0 for dur seconds; fx as in miniMap (soak, burst, debuff, puddle, zone, safe); at: when it goes off
    ring(o) { const q0 = o.fx === 'soak' && o.r < 10 ? RO(CL(o.x), CL(o.y)) : RO(o.x, o.y); /* (an orb's landing circle stays on the platform; pools and raid hits keep their centre) */ k.rings.push({ ...o, x: q0[0], y: q0[1], on: P(o.on), t0: TT(o.t0), at: TT(o.at) }); return kit; },
    // a frontal from a unit toward another unit (or a direction in degrees, east = 0, counterclockwise), landing at 'at'; hit: orbs or ghosts it removes
    cone(o) { k.cones.push({ ...o, deg: o.deg != null ? o.deg + seg.rot : o.deg, from: P(o.from), to: P(o.to), at: TT(o.at), hit: (o.hit || []).map(P) }); return kit; },
    link(o) { const ty = o.toYd ? RO(o.toYd.x, o.toYd.y) : null; k.links.push({ ...o, toPt: ty ? { x: A.cx + ty[0], y: A.cy + ty[1] } : o.toPt, from: P(o.from), to: P(o.to), t0: TT(o.t0), t1: TT(o.t1) }); return kit; }, /* (toYd: a spot in yards) */
    // a wall of venom (Ula'tek's Caustic Waves): starts centred on (x, y), rolls along deg (east = 0, counterclockwise) at v yards a second, w wide and d deep
    wave(o) { const q0 = RO(o.x, o.y); k.waves.push({ ...o, x: q0[0], y: q0[1], deg: (o.deg || 0) + seg.rot, t0: TT(o.t0), t1: TT(o.t1) }); return kit; },
    // the room picture from t on (a RaidPlan render's file name, 'none' for the floor map)
    art(t, f) { k.artAt.push([TT(t), f]); return kit; },
    // a curved wave spreading out from (x, y) at v yards a second between angles a0 and a1 (degrees), d deep, with gaps; a red arc warns first
    arc(o) { const q0 = RO(o.x, o.y); k.arcs.push({ ...o, x: q0[0], y: q0[1], a0: o.a0 + seg.rot, a1: o.a1 + seg.rot, gaps: (o.gaps || []).map((g) => [g[0] + seg.rot, g[1] + seg.rot]), t0: TT(o.t0), t1: TT(o.t1) }); return kit; },
    // a spinning beam: one wide bar from (x, y), pointing a0 degrees at t0 (east = 0, counterclockwise) and turning v degrees a second
    // (negative: clockwise), len yards long and w wide, until t1
    beam(o) { const q0 = RO(o.x, o.y); k.beams.push({ ...o, x: q0[0], y: q0[1], a0: (o.a0 || 0) + seg.rot, t0: TT(o.t0), t1: TT(o.t1) }); return kit; },
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
    // (the whole fight: the bosses stay on the map between scenes. Each holds its spot through the walk to the next scene and glides to
    // where that scene has it; through a scene with no boss of its own (a short scene like the pull) they stay where they were)
    bridge(chaps) { const B = (t) => [...U.values()].filter((u) => u.kind === 'boss' && u.path.length && Math.abs(u.from - t) < 1e-6); let live = [];
      chaps.forEach((c, i) => { const own = B(c.t); if (own.length) live = own.filter((u) => u.to >= c.t + c.len - 0.3);
        const nx = chaps[i + 1]; if (!nx) return; const nb = B(nx.t);
        for (const u of live) { if (u.to >= nx.t) continue; const p0 = posRaw(u.id, u.to); put(u, u.to, p0[0], p0[1], true);
          const v = nb.find((w) => w.name === u.name); if (v) { const q = posRaw(v.id, nx.t); put(u, nx.t - 0.01, q[0], q[1], true); } u.to = nx.t + 0.001; } }); /* (a hair past the next start, so no frame falls between them) */
      return kit; },
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
      // (a knockback is a flight, not a jump (the reviewer's note, Oct 21): a player thrown more than 6 yards faster than 25 yards a second
      // lands over about a second instead (30 yards a second), unless their next move comes first)
      const KB = k.calls.filter((c) => /^(Knocked back|Blown|Bounce)/.test(c.text || ''));
      for (const u of U.values()) { if (u.kind !== 'player' || !KB.length) continue; const p = u.path;
        for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1], dt = b[0] - a[0], d = Math.hypot(b[1] - a[1], b[2] - a[2]); if (dt <= 0 || d < 6 || d / dt < 25) continue;
          if (!KB.some((c) => (!c.on || c.on === u.id) && a[0] >= c.t0 - 0.6 && a[0] <= c.t1)) continue;
          const nx = p[i + 2] ? p[i + 2][0] - 0.05 : Infinity; b[0] = Math.max(b[0], Math.min(a[0] + Math.min(1.1, Math.max(0.6, d / 30)), nx)); } }
      for (let t = 0; t <= L + 1e-6; t += 0.25) {
        const pts = [];
        for (const u of U.values()) { if (t < u.from || t > u.to || !u.path.length) continue; const p = posRaw(u.id, t); pts.push({ guid: u.id, name: u.name, kind: u.kind, x: X(p[0]), y: Y(p[1]) }); }
        frames.push({ t, pts });
      }
      const cones = k.cones.map((c) => { const p = posRaw(c.from, c.at), q = c.to ? posRaw(c.to, c.at) : null, dir = q ? Math.atan2(q[1] - p[1], q[0] - p[0]) : (c.deg || 0) * Math.PI / 180;
        return { x: X(p[0]), y: Y(p[1]), r: c.r || 30, half: (c.width || 60) * Math.PI / 360, dir, at: c.at, hit: c.hit || [], soak: !!c.soak }; }); /* (soak: a frontal the raid stands in on purpose) */
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
        lateHit: true, liveLeg: true, hlLabel: o.hlLabel, goodLabel: o.goodLabel, badLabel: o.badLabel, tagLabel: o.tagLabel, noArena: !!o.noArena, waves: k.waves.map((w) => ({ ...w, x: X(w.x), y: Y(w.y) })), beams: k.beams.map((b) => ({ ...b, x: X(b.x), y: Y(b.y) })), art: o.art || null, fullAt: (o.full || (!o.final && GDZ_FULL[boss])) ? ((f) => ({ x: X(f.x), y: Y(f.y), r: f.r }))(o.full || GDZ_FULL[boss]) : null, artAt: k.artAt.length ? k.artAt.slice().sort((a, b) => a[0] - b[0]) : null, arcs: k.arcs.map((a) => ({ ...a, x: X(a.x), y: Y(a.y) })) };
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
        try { if (play(e)) { kit.rot(0); pk.rot(0); /* (both in the room's own frame, whichever way each scene was turned) */ for (const id of GDZ_RAID) { const a = kit.posAt(id, prevLen), b = pk.posAt(id, 0); if (a && b) need = Math.max(need, Math.hypot(b[0] - a[0], b[1] - a[1]) / 8); } } } catch (er) { /* (a scene that can't be probed keeps the usual gap) */ }
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
  kit.bridge(chaps);
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
  'Purple circles': ['Dodge', 'land', '#e07bff'], Defilement: ['Stay out', 3, '#8fd16a'], 'Raid cooldowns': ['Stack · raid cooldowns', 'dur', '#b9a6ff'], "Purple orb's ring": ['Purple: keep clear', 2.4, '#c49bff'], 'Noxious Ground': ['Avoid', 3, '#8fd16a'],
  'Spectral Coils': ['Soak', 'land', '#24f2cb'], 'Fester Burst': ['Get in the bubble', 'land', '#d8f22f'], 'Falling Debris': ['Dodge', 'land', '#c8a36a'], 'Call of the Serpent': ['Dodge', 'land', '#c8a36a'], 'Serpent\'s Bite': ['Stack and soak', 'dur', '#ff5a6a'], 'Circling Prey': ['Move one piece left', 'land', '#ff3b3b'] };

const GDZ_BADGE = { 'Corrupted Toxin': '#8fd16a', Venomfang: '#7cf07c', Dreadmarch: '#c49bff', Gloombomb: '#e07bff', Guillotine: '#ff8a6a' };

// ---- the guides' own icons (drawn here; boss portraits load at runtime from Wowhead, never bundled) ----
// a room's half-width in yards, for pools that pour in from a wall (they're cut at the floor's edge: on The Coiled Altar about 46 yards
// from the middle, where every player position of a kill stops; the pools themselves are centred on the wall statues, 52 out)
const GDZ_ROOM = { 'The Coiled Altar': 46 }; let GDZ_ROOM_N = 0;
// (a square platform's floor limit, yards from the centre: the Coiled Altar's stone ends about 41 out, then a bevel and the drop)
const GDZ_SQ = { 'The Coiled Altar': 39 };
const GDZ_GLYPH = { t: 'M0 -6.4L5.2 -4.3V0C5.2 3.6 2.7 5.6 0 6.7C-2.7 5.6 -5.2 3.6 -5.2 0V-4.3Z', h: 'M-1.9 -6.2H1.9V-1.9H6.2V1.9H1.9V6.2H-1.9V1.9H-6.2V-1.9H-1.9Z', r: 'M1.6 -6.8L-4.2 1H-0.6L-1.6 6.8L4.2 -1H0.6Z' };
function gdzGlyph(x, y, pl, r, attrs, title) { // a role token: the role's colour, a dark face and a white sign (shield, cross, swords, bolt)
  const R = r + 3, k = (R - 2.4) / 7.4, c = pl.color, g = pl.glyph; attrs = String(attrs || '').replace(/opacity:0?.6/, 'opacity:.9'); /* (solid enough to read at a glance) */
  const sign = g === 'm' ? '<path d="M-5 5L5 -5M-5 -5L5 5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/><path d="M-6.5 3.5L-3.5 6.5M3.5 6.5L6.5 3.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>' : '<path d="' + GDZ_GLYPH[g] + '" fill="#fff"/>';
  return '<g' + (attrs || '') + '><circle class="grh gr-' + g + '" cx="' + x + '" cy="' + y + '" r="' + (R + 3.4) + '" fill="none" stroke="#f3c969" stroke-width="2.2" display="none" style="stroke:#f3c969"/><circle cx="' + (x + 0.8) + '" cy="' + (y + 1.2) + '" r="' + (R + 0.4) + '" fill="#000" fill-opacity=".45" style="stroke:none"/><circle cx="' + x + '" cy="' + y + '" r="' + R + '" fill="' + c + '" stroke="#0b0d12" stroke-width="1.4"/>' +
    '<circle cx="' + x + '" cy="' + y + '" r="' + (R - 1.6) + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" style="stroke:#fff;stroke-width:1"/><g transform="translate(' + x + ' ' + y + ') scale(' + k.toFixed(3) + ')" style="color:' + c + '">' + sign.replace(/#fff/g, '#10131a') + '</g>' + (title ? '<title>' + esc(title) + '</title>' : '') + '</g>';
}
const GDZ_ART = { "Zul'jan": 142472, Malacrass: 142140, 'Hex Lord Malacrass': 142140 };
// (a boss's portrait by name: Zul'jan and Malacrass, a boss named like its encounter, and the one boss of a council or pair whose
// render the site already uses (BOSS_ART); the others get the skull on their own colour until we have theirs)
// (the rest of each council and pair, and Ula'tek's two linked bosses: NPC IDs from real Mythic reports, display IDs from their Wowhead pages)
const GDZ_ART_MORE = { "Blood of Ula'tek": 143436, "Breath of Ula'tek": 143437, 'Scrollsage Iku': 144892, 'First Mate Nama': 144893, 'Trader Gebbo': 144894, "Mor'zahi": 143824,
  Ithraz: 141309, Vexhul: 140993, 'Gore Rattle': 141466, 'Venomous Heart': 145052, Vashnik: 141675, "Nek'zali, the Soulcoiler": 142077 };
const gdzArtOf = (n) => GDZ_ART[n] || GDZ_ART_MORE[n] || (typeof BOSS_ART !== 'undefined' && BOSS_ART[n] ? BOSS_ART[n][0] : null);
function gdzBossToken(x, y, name) { // a boss: a gold ring with their portrait (or a skull while it loads)
  let hs = 0; for (const c of String(name)) hs = (hs * 31 + c.charCodeAt(0)) >>> 0;
  const d = gdzArtOf(name), R = 13, bg = d ? '#2a1d0d' : ['#2f5f3a', '#7a2333', '#33508f', '#6a3f9a', '#8a5a22'][hs % 5];
  return '<circle cx="' + (x + 1) + '" cy="' + (y + 1.5) + '" r="' + (R + 3) + '" fill="#000" fill-opacity=".5"/><circle cx="' + x + '" cy="' + y + '" r="' + (R + 2.5) + '" fill="#e6b450" stroke="#3a2a08" stroke-width="1.4"/><circle cx="' + x + '" cy="' + y + '" r="' + R + '" fill="' + bg + '"/>' +
    '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-size="14" fill="' + (d ? '#e6b450' : '#f1ead8') + '">☠</text>' +
    (d ? '<image href="' + artUrl(d) + '" x="' + (x - R) + '" y="' + (y - R) + '" width="' + 2 * R + '" height="' + 2 * R + '" clip-path="url(#pclip)" preserveAspectRatio="xMidYMin slice"/>' : '') +
    '<circle cx="' + x + '" cy="' + y + '" r="' + R + '" fill="none" stroke="#fff3c4" stroke-opacity=".6" stroke-width="1"/><title>' + esc(name) + '</title>';
}
function gdzEgg(x, y, kind, label) { // an egg: a small Blightscale Spawn (a green sac, as in game), or the big Doomscale Egg
  const big = kind === 'begg', rx = big ? 8.5 : 6, ry = big ? 10 : 6.6, body = big ? '#3f6e22' : '#7fb83c', dot = big ? '#a6e05a' : '#d8f07a';
  return '<g><ellipse cx="' + x + '" cy="' + (y + ry - 1) + '" rx="' + rx + '" ry="2" fill="#000" fill-opacity=".35"/><ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + body + '" stroke="#16280a" stroke-width="1.4"/>' +
    '<circle cx="' + (x - rx * 0.38) + '" cy="' + (y + ry * 0.1) + '" r="' + (big ? 2 : 1.5) + '" fill="' + dot + '" fill-opacity=".85"/><circle cx="' + (x + rx * 0.32) + '" cy="' + (y + ry * 0.35) + '" r="' + (big ? 1.6 : 1.2) + '" fill="' + dot + '" fill-opacity=".85"/><circle cx="' + (x + rx * 0.15) + '" cy="' + (y - ry * 0.3) + '" r="' + (big ? 1.3 : 1) + '" fill="' + dot + '" fill-opacity=".7"/>' +
    '<ellipse cx="' + (x - rx * 0.3) + '" cy="' + (y - ry * 0.45) + '" rx="' + (rx * 0.3) + '" ry="' + (ry * 0.18) + '" fill="#fff" fill-opacity=".4"/><title>' + esc(label || 'Egg') + '</title></g>';
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
  return '<g transform="translate(' + x + ' ' + y + ') scale(1.35) translate(' + (-x) + ' ' + (-y) + ') rotate(' + a.toFixed(0) + ' ' + x + ' ' + y + ')"><circle cx="' + x + '" cy="' + y + '" r="9" fill="#ff9628" fill-opacity=".18"/>' +
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
function gdzCaMarks(k) { k.rot(90); /* (the plan is drawn entrance-west; the room's entrance side is south: Sever hits the tank south first, then north (Oct 20, two kills)) */ k.wmark('cross', -37, 0).wmark('moon', -35, -35).wmark('skull', -35, 35).wmark('star', 35, -35).wmark('square', 35, 35).wmark('diamond', 37, 13).wmark('circle', 19, 37); return k; } /* (on the flat stone near the edge: it ends about 41 yards out, then a bevel and the drop) */
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
// Axegrinder (from 5 top Mythic kills, Oct 20): Zul'jan throws 5 axes out at 0:14 and 5 more at 1:39, and each set rolls around the
// room for 3 minutes (10 at once from 1:39 to about 3:15; the last ones gone about 4:40). Anyone a thrown axe flies into is knocked
// back; after that a rolling axe only hurts whoever it touches. Each axe's wandering path, by seconds since it landed (yards from the
// centre; they cross the middle often, as on the real kills)
const GDZ_CA_AXP = Array.from({ length: 10 }, (_, i) => {
  const r = (n) => { const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };
  const ax = 18 + r(1) * 6, bx = 8 + r(2) * 4, ay = 18 + r(3) * 6, by = 8 + r(4) * 4, w = [0.13 + r(5) * 0.07, 0.27 + r(6) * 0.09, 0.12 + r(7) * 0.07, 0.25 + r(8) * 0.09], p = [9, 10, 11, 12].map((n) => r(n) * 6.283);
  return (t) => [ax * Math.sin(w[0] * t + p[0]) + bx * Math.sin(w[1] * t + p[1]), ay * Math.sin(w[2] * t + p[2]) + by * Math.sin(w[3] * t + p[3])];
});
// (a player an axe touches: a red flash and a Hit label)
function gdzAxeHit(k, id, t) {
  k.ring({ on: id, r: 2.6, fx: 'burst', t0: t - 0.3, at: t, dur: 0.6, color: '#ff3b3b', cn: 'Axegrinder', legend: 'touched by an axe: it hurts' });
  k.call(t, t + 1.1, 'Hit', { on: id, color: '#ff3b3b', ink: '#fff' });
}
// (every touch from t0 to t1: pos(i, t) is axe i's spot, or null while it isn't rolling; a player is hit again only 2 seconds later)
function gdzAxeHits(k, ids, pos, axes, t0, t1, from) {
  const last = {}, out = [];
  for (let t = t0; t <= t1 + 0.001; t += 0.25) for (const id of ids) { if (from && from[id] && t < from[id]) continue; const b = k.posAt(id, t); if (!b || (last[id] != null && t - last[id] < 2)) continue;
    for (const i of axes) { const q = pos(i, t); if (q && Math.hypot(b[0] - q[0], b[1] - q[1]) < 3) { last[id] = t; out.push([id, t]); gdzAxeHit(k, id, t); break; } } }
  return out;
}
// (through the whole fight the raid watches the rolling axes: anyone one is about to roll into steps aside, a quick sidestep, never a
// sprint, then carries on with what their scene has them doing; the steps are fixed, so the scenes keep their timing)
function gdzAxeDodge(k, ids, pos, n, t0, t1) {
  const K = k.peek(), RI = (x, y) => [y, -x]; /* (the overlay is drawn turned 90 degrees, like the scenes) */
  const bad = K.rings.filter((g) => (g.r < 40 || /Noxious Ground/.test(g.cn || '')) && /Noxious Ground|Gloombomb|Bomb|Toxic Deluge|Guillotine|Execution|soak/i.test((g.cn || '') + ' ' + (g.fx || ''))), coneT = K.cones.map((c) => c.at).filter((x) => x != null);
  const inBad = (p, t) => bad.some((g) => { if (t < g.t0 || t > g.t0 + (g.dur || 0)) return false; const c = g.on ? (/^[thmr]\d$/.test(g.on) ? k.posAt(g.on, t) : null) : RI(g.x, g.y); return c && Math.hypot(p[0] - c[0], p[1] - c[1]) < g.r + 1.5; });
  for (const id of ids) { const keys = []; let ox = 0, oy = 0;
    for (let t = Math.ceil(t0 * 2) / 2; t <= t1 + 0.001; t += 0.5) { const b = k.posAt(id, t), b0 = k.posAt(id, t - 0.5), b2 = k.posAt(id, t + 1.5); if (!b) { ox = oy = 0; continue; }
      const still = b0 && b2 && Math.hypot(b[0] - b0[0], b[1] - b0[1]) < 0.8 && Math.hypot(b2[0] - b[0], b2[1] - b[1]) < 2.4 && !coneT.some((x) => Math.abs(x - t) < 2.5) && !inBad(b, t);
      let tx = 0, ty = 0;
      if (still) for (let i = 0; i < n; i++) { let bst = null; for (const dt of [0, 0.5, 1, 1.5]) { const q = pos(i, t + dt); if (!q) continue; const d = Math.hypot(b[0] - q[0], b[1] - q[1]); if (!bst || d < bst[0]) bst = [d, b[0] - q[0], b[1] - q[1]]; }
        if (bst && bst[0] < 6) { const p = 7.5 - bst[0]; tx += bst[1] / (bst[0] || 1) * p; ty += bst[2] / (bst[0] || 1) * p; } }
      let nx = ox * 0.4 + tx * 0.6, ny = oy * 0.4 + ty * 0.6; const st = Math.hypot(nx - ox, ny - oy); if (st > 3) { nx = ox + (nx - ox) * 3 / st; ny = oy + (ny - oy) * 3 / st; } /* (a quick sidestep, never a sprint) */
      const m = Math.hypot(nx, ny); if (m > 4.5) { nx *= 4.5 / m; ny *= 4.5 / m; }
      if (Math.hypot(nx, ny) > 0.3 && (inBad([b[0] + nx, b[1] + ny], t) || Math.max(Math.abs(b[0] + nx), Math.abs(b[1] + ny)) > 39)) { nx = ox * 0.4; ny = oy * 0.4; } /* (never into a pool, a bomb, a soak or off the edge) */
      if (Math.hypot(nx, ny) > 0.3 || Math.hypot(ox, oy) > 0.3) keys.push([t, b[0] + nx, b[1] + ny]); ox = nx; oy = ny; }
    keys.forEach(([t, x, y]) => k.at(t, id, x, y, 0, true)); } }
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
    const V = GDZ_CA_AXES[(o && o.soak) || 1], k = gdzCaMarks(gdzKit('The Coiled Altar', 13)), C = (o && o.at) || [-35, -35], tg = V.tg, grp = V.grp;
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
    [tg].concat(grp).forEach((id, i) => { k.ok(id, 6); const [dx, dy] = gdzSpot(i, grp.length + 1, 6); k.hold(6.3, id); at(11.8, id, dx, dy); });
    k.ring1([tg].concat(V.hl)).step(1).step(2).step(6).step(6.4).step(11);
    k.pause(5.6, V.pause, { x: C[0], y: C[1], r: 11 }); return k.done({ title: V.title, focus: { x: C[0] * 0.37, y: C[1] * 0.37, r: 24 }, hlLabel: V.hlLabel, goodLabel: 'in the soak', tagLabel: V.tagLabel });
  },
  // P2: everyone stacks the mind controls on the square; ghosts land around them and get frozen apart; the frontal sweeps them
  ghosts() {
    const k = gdzCaMarks(gdzKit('The Coiled Altar', 13)), SQ = [35, 33]; /* (by the square, on the stone: the ghosts land around the stack and must stay on the platform) */
    k.boss('hm', 'Malacrass', 0, 6, 4).boss('hm', 'Malacrass', 3, 16, 16);
    k.at(0, 't1', 10, 4).at(3, 't1', 22, 18).hold(7, 't1').at(9.6, 't1', 36, 32).at(0, 't2', 2, 8).at(3, 't2', 8, 14)
      .at(0, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 6, 12, 5).at(3, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 12, 22, 5).at(0, ['h1', 'h3', 'h4'], -8, 14, 4).at(3, ['h1', 'h3', 'h4'], 0, 24, 4)
      .at(0, ['r1', 'r2', 'r3', 'r4', 'r6', 'r7'], -6, -6, 6).at(3, ['r1', 'r2', 'r3', 'r4', 'r6', 'r7'], -2, 6, 6);
    k.at(0, 'r5', 10, 24).at(0, 'm4', 16, 22).at(0, 'h2', 4, 30);
    const mc = ['r5', 'm4', 'h2'];
    mc.forEach((id, i) => { k.ring({ on: id, r: 3, fx: 'debuff', t0: 1, dur: 5, color: '#b65cff', cn: 'Dreadmarch', legend: 'mind controlled, shielded' }); k.tag(id, 'MC', 1, 6); const [dx, dy] = gdzSpot(i, 3, 2.5); k.hold(1, id).at(4.4, id, SQ[0] + dx, SQ[1] + dy).hold(6.4, id); });
    // (they land around their player and are frozen on the spot by being looked at; the two outside the cone are let creep in)
    const G = [[28, 34], [31, 26], [38, 38], [37, 25], [25, 28], [20, 38]], IN = { 5: [24, 32], 2: [36, 32] };
    G.forEach(([x, y], q) => { const g = 'g' + q; k.obj(g, 'ghost', 6.2, x, y).show(g, 6.2, 12); if (IN[q]) k.obj(g, 'ghost', 8, x, y).obj(g, 'ghost', 9.6, IN[q][0], IN[q][1]); });
    // (a dashed line from each freed player to their ghost while they look at it: a ghost only moves while its player looks away)
    G.forEach((_, q) => { const own = mc[Math.floor(q / 2)], g = 'g' + q; if (IN[q]) k.link({ from: own, to: g, t0: 6.6, t1: 8, color: '#c49bff', dash: true, legend: 'looking at their ghost: it stays frozen' }).link({ from: own, to: g, t0: 9.6, t1: 11, color: '#c49bff', dash: true, legend: 'looking at their ghost: it stays frozen' }); else k.link({ from: own, to: g, t0: 6.6, t1: 11, color: '#c49bff', dash: true, legend: 'looking at their ghost: it stays frozen' }); });
    mc.forEach((id, i) => k.at(9.4, id, 12 - i * 3, 30 + i * 3));
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
  // Axegrinder: Zul'jan throws 5 axes out from himself (anyone one flies into is knocked back), then they roll around the room at
  // random, often through the middle; the raid steps out of their way, and anyone one touches takes a hit. o.more: the second
  // throw (in the whole fight the first 5 roll on beside it). fail: a melee who stops watching them takes hit after hit and dies
  grinder(fail, o, D) {
    o = o || {}; const L = fail ? 12 : 14, k = gdzKit('The Coiled Altar', L), BZ = o.more ? [0, 0] : [0, 10], TC = 0.4, TW = 2.4, FL = 1, TR = TW + FL, seg = !!GDZ_SEG;
    const NEW = o.more ? [5, 6, 7, 8, 9] : [0, 1, 2, 3, 4], OLD = o.more && !seg ? [0, 1, 2, 3, 4] : [], AX = OLD.concat(NEW), KB = fail || o.more ? null : 'm4', V = fail ? 'm3' : null;
    k.boss('zj', 'Zul\'jan', 0, BZ[0], BZ[1]).cast('zj', 'Axegrinder', TC, TW); if (o.more) gdzCaLane(k, 0); else gdzCaRaid(k, [KB, V].filter(Boolean)); /* (the second throw comes while the second Fangs pools are down: the raid is in the lane) */
    // (in the whole fight the Fangs pools are down during both throws: nobody steps or is knocked into one (the first ones reach 24
    // yards in from the side walls, the second ones nearly to the boss))
    const PR = seg ? (o.more ? 48 : 28) : 0, inLane = (p) => { if (PR && Math.abs(p[0]) < PR) { const m = 52 - Math.sqrt(PR * PR - p[0] * p[0]) - 1.5; p[1] = Math.max(-m, Math.min(m, p[1])); } return p; };
    const IDS = GDZ_RAID.filter((id) => id !== KB && id !== V && k.posAt(id, 0)), B = {}; IDS.forEach((id) => { B[id] = k.posAt(id, 0); });
    // (where each axe is at a moment: flying out from the boss, then rolling; p0 picks its path up at a later point)
    let PT0 = 0; const end = (i, p0) => GDZ_CA_AXP[i](p0);
    const pos = (i, t, p0) => { p0 = p0 == null ? PT0 : p0; if (OLD.includes(i)) return GDZ_CA_AXP[i](t + 85 + p0); if (t < TW) return null; const e = end(i, p0);
      if (t < TR) { const w = (t - TW) / FL; return [BZ[0] + (e[0] - BZ[0]) * w, BZ[1] + (e[1] - BZ[1]) * w]; } return GDZ_CA_AXP[i](t - TR + p0); };
    const roll = (i, t, p0) => (t >= TR || OLD.includes(i) ? pos(i, t, p0) : null);
    // (a thrown axe knocks back whoever stands on its way out: when, and which way)
    const knockOf = (b, p0) => { for (const i of NEW) { const e = end(i, p0), dx = e[0] - BZ[0], dy = e[1] - BZ[1], l = Math.hypot(dx, dy) || 1, u = ((b[0] - BZ[0]) * dx + (b[1] - BZ[1]) * dy) / (l * l);
      if (u > 2 / l && u < 1 && Math.abs((b[0] - BZ[0]) * dy - (b[1] - BZ[1]) * dx) / l < 2.2) { const sd = dx * (b[1] - BZ[1]) - dy * (b[0] - BZ[0]) >= 0 ? 1 : -1, kx = dx / l * 0.45 - sd * dy / l, ky = dy / l * 0.45 + sd * dx / l, kl = Math.hypot(kx, ky); return { t: TW + FL * u, d: [kx / kl, ky / kl] }; } } return null; };
    const landClear = (p0) => NEW.every((i) => { const e = end(i, p0); return IDS.every((id) => Math.hypot(B[id][0] - e[0], B[id][1] - e[1]) > 6); });
    const near = (b, t, p0) => { let m = 99; for (const i of AX) { const q = roll(i, t, p0); if (q) m = Math.min(m, Math.hypot(b[0] - q[0], b[1] - q[1])); } return m; };
    // (the moment to show: the axes land clear of everyone; then either one player who isn't watching gets touched once, 6 to 11
    // seconds in, or (fail) the melee spot the axes roll over at least three times)
    let C = null, CT = 7, SV = null, VH = [];
    if (!seg) for (let p0 = 0; p0 < 600 && !C && !SV; p0 += fail ? 0.5 : 1) { if (!landClear(p0)) continue;
      if (fail) { for (const rad of [3, 4, 5, 6, 7, 8]) for (let a = 0; a < 16 && !SV; a++) { const s = [BZ[0] + Math.cos(a * Math.PI / 8) * rad, BZ[1] + Math.sin(a * Math.PI / 8) * rad]; if (knockOf(s, p0)) continue; const h = [];
          for (let t = TR; t <= 11 && h.length < 3; t += 0.25) if ((!h.length || t - h[h.length - 1] >= 1.6) && near(s, t, p0) < 2.6) h.push(t);
          if (h.length >= 3 && h[0] >= 4.5) { SV = s; VH = h; PT0 = p0; } } }
      else { let best = null; for (const id of IDS) { if (/^t/.test(id) || knockOf(B[id], p0)) continue; let tf = null, early = false;
          for (let t = TR; t <= 11; t += 0.25) { const d = near(B[id], t, p0); if (d < 3 && t < 6) early = true; if (d < 2.2 && t >= 6 && tf == null) tf = t; }
          if (!early && tf != null && (!best || tf < best[1])) best = [id, tf]; }
        if (best) { C = best[0]; CT = best[1]; PT0 = p0; } } }
    // (one melee stands right on the way of the axe thrown toward the melee, to show the knockback)
    if (KB) { const mc = IDS.filter((id) => /^m/.test(id)).map((id) => B[id]), cx = mc.reduce((a, b) => a + b[0], 0) / (mc.length || 1), cy = mc.reduce((a, b) => a + b[1], 0) / (mc.length || 1), ml = Math.hypot(cx - BZ[0], cy - BZ[1]) || 1;
      let bi = NEW[0], bd = -2; for (const i of NEW) { const e = end(i, PT0), l = Math.hypot(e[0] - BZ[0], e[1] - BZ[1]) || 1, c = ((e[0] - BZ[0]) * (cx - BZ[0]) + (e[1] - BZ[1]) * (cy - BZ[1])) / (l * ml); if (c > bd) { bd = c; bi = i; } }
      const e = end(bi, PT0), l = Math.hypot(e[0] - BZ[0], e[1] - BZ[1]) || 1; B[KB] = [BZ[0] + (e[0] - BZ[0]) / l * 5.5, BZ[1] + (e[1] - BZ[1]) / l * 5.5]; k.at(0, KB, B[KB][0], B[KB][1]); }
    if (fail) k.at(0, V, SV ? SV[0] : BZ[0], SV ? SV[1] : BZ[1] + 6);
    // (the axes: thrown out, then rolling, with a dashed line to where each is heading)
    for (const i of AX) { const id = 'ax' + i, t0 = OLD.includes(i) ? 0 : TW; for (let t = t0; t <= L + 0.001; t += t < TR - 0.01 ? 0.25 : 0.5) { const q = pos(i, t); if (q) k.obj(id, 'axe', t, q[0], q[1]); }
      k.show(id, t0, L).ring({ on: id, r: 3, fx: 'zone', t0, dur: L - t0, color: '#ff9628', cn: 'Axegrinder', legend: 'rolling axe: hurts if it touches you' });
      for (let t = Math.max(t0, TR); t < L; t += 0.5) { const q = pos(i, t + 1.6); k.link({ from: id, toYd: { x: q[0], y: q[1] }, t0: t, t1: t + 0.5, color: '#ff9628', dash: true, legend: 'where each axe is heading' }); } }
    // (everyone watching steps out of an axe's way a moment before it arrives, then back to their spot)
    const dodge = (id, b, t0) => { let ox = 0, oy = 0;
      for (let t = t0; t <= L + 0.001; t += 0.5) { let tx = 0, ty = 0; for (const i of AX) { let bst = null; for (const dt of [0, 0.5, 1, 1.5]) { const q = roll(i, t + dt); if (!q) continue; const d = Math.hypot(b[0] - q[0], b[1] - q[1]); if (!bst || d < bst[0]) bst = [d, b[0] - q[0], b[1] - q[1]]; }
          if (bst && bst[0] < 7.5) { const p = 9.5 - bst[0]; tx += bst[1] / (bst[0] || 1) * p; ty += bst[2] / (bst[0] || 1) * p; } }
        let nx = ox * 0.4 + tx * 0.6, ny = oy * 0.4 + ty * 0.6; const st = Math.hypot(nx - ox, ny - oy); if (st > 4.2) { nx = ox + (nx - ox) * 4.2 / st; ny = oy + (ny - oy) * 4.2 / st; } /* (a quick sidestep, never a sprint) */
        if (t === t0) { nx = tx; ny = ty; } ox = nx; oy = ny; const p = inLane([b[0] + ox, b[1] + oy]); k.at(t, id, p[0], p[1]); } };
    // (the throw: anyone on an axe's way out is knocked aside 8 yards, off its path, then walks back)
    const KN = [], FROM = {}; for (const id of IDS.concat(KB ? [KB] : [])) { const kn = knockOf(B[id], PT0); if (!kn) continue; KN.push(id); FROM[id] = kn.t + 1.6;
      const ld = inLane([B[id][0] + kn.d[0] * 8, B[id][1] + kn.d[1] * 8]); k.hold(kn.t, id).at(kn.t + 0.75, id, ld[0], ld[1]).hold(kn.t + 1.3, id); k.call(kn.t, kn.t + 2, 'Knocked back', { on: id, color: '#ff9628', ink: '#141006' }); dodge(id, B[id], Math.ceil((kn.t + 2.6) * 2) / 2); }
    IDS.filter((id) => id !== C && !KN.includes(id)).forEach((id) => dodge(id, B[id], 1));
    const hit = gdzAxeHits(k, IDS.concat(KB ? [KB] : []), roll, AX, TR, L, FROM);
    if (fail) { VH.slice(0, 3).forEach((t) => gdzAxeHit(k, V, t)); const td = (VH[2] || 9) + 0.3; k.call(td, td + 3, 'Dead', { on: V, color: '#ff3b3b', ink: '#fff' }).oops(V, td).ring1(V);
      k.step(TC).step(VH[0] || 5).step(VH[1] || 7).step(VH[2] || 9); k.pause((VH[0] || 5) + 0.6, 'Stop. One hit won\'t kill you. But the axes don\'t go away, so they keep coming back.', { on: V, r: 9 });
      return k.done({ title: 'Mistake: standing in the axes', focus: { x: SV ? SV[0] : 0, y: SV ? SV[1] : 14, r: 18 }, badLabel: 'dead' }); }
    if (C) k.oops(C, CT); if (KB) k.ring1(KB);
    k.step(TC).step(TR).step(TR + 1.6).step(Math.max(TR + 2.5, C ? CT : (hit[0] ? hit[0][1] : 7)));
    k.pause(TW - 0.4, 'Freeze. Zul\'jan is about to throw 5 axes out from himself. Anyone they fly into gets knocked back.', { x: BZ[0], y: BZ[1], r: 14 });
    if (C) k.pause(CT - 1.1, 'Freeze. This player isn\'t watching. The dashed line shows an axe heading right at them.', { on: C, r: 8 });
    return k.done({ title: o.more ? 'Axegrinder: five more axes' : 'Axegrinder: dodge the rolling axes', focus: { x: 0, y: 6, r: 30 }, hlLabel: 'knocked back by the throw', badLabel: 'hit by an axe' });
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
// (how long each part lasts on the real kill's clock, for the written version's overlaps: an orb set from the circles to the second
// frontal, an axe from the target to the eruption, the Fangs pools until they fade, a shield until it breaks)
const GDZ_CA_DUR = { 'm:grinder': 183, 'm:orbs': 27, 'm:axe': 13, 'm:dm': 12, 'm:bombs': 12, 'm:frags': 38, 'm:diamond': 15, 'b:venomfang': 5, 'b:fangs': 28, 'b:nightfall': 8, 'b:p3orbs': 14, 'b:defile': 6, 'b:transition': 12, 'b:p2end': 7, 'b:start': 2, 'b:kill': 0 };
// (how dangerous a miss is: 3 can wipe the raid, 2 can kill players, 1 minor)
const GDZ_CA_SEV = { 'm:grinder': 2, 'm:orbs': 3, 'b:p3orbs': 3, 'm:diamond': 3, 'm:axe': 3, 'm:dm': 3, 'b:nightfall': 3, 'm:frags': 3, 'm:bombs': 2, 'b:fangs': 2, 'b:transition': 2, 'b:venomfang': 1, 'b:defile': 1, 'b:p2end': 1, 'b:start': 1, 'b:kill': 1 };
const GDZ_CA_SIM = [
  { at: 0, beat: 'start', ph: 0 }, { at: 2, mech: 'orbs', ph: 0 }, { at: 12, mech: 'grinder', ph: 0 }, { at: 30, beat: 'venomfang', ph: 0 }, { at: 43, mech: 'axe', ph: 0 },
  { at: 45, mech: 'orbs', ph: 0 }, { at: 65, beat: 'venomfang', ph: 0, o: { on: ['r4', 'm5'] } }, { at: 85, beat: 'fangs', ph: 0 }, { at: 87, mech: 'orbs', ph: 0, label: 'Toxic Deluge (In the lane between the pools)', o: { lane: true, do: ['Pools are down: the whole raid plays in the lane down the middle. Warlocks wait at the entrance end, Mages at the far end.', 'Everyone else: clear the greens out of the purple carriers\' way first. Greens only. Never touch a purple.', 'Entrance side first: purples to the tip, greens between them and the boss. The raid waits on the far side of the boss.', 'Off-tank: taunt right before Sever and pop the whole entrance triangle. 5 or 6 orbs, never more than 7.', 'Now the far side. The raid walks past the boss to the entrance half, and the off-tank brings the last purple.', 'Boss tank: taunt back and take the second Sever through the far triangle.'] } },
  { at: 97, mech: 'grinder', ph: 0, label: 'Axegrinder 2 (Ten axes out)', o: { more: true, do: ['He throws 5 more axes. With the first 5 still rolling, that\'s 10 at once.', 'Anyone they fly into gets knocked back again.', 'Until about 3:15, watch for axes all the time, also during soaks and orbs.', 'Every touch hurts. They don\'t go away.'] } },
  { at: 115, beat: 'venomfang', ph: 0, o: { on: ['r7', 'm2'] } }, { at: 128, mech: 'axe', ph: 0, label: 'Guillotine 2 (Five, with immunities)', o: { soak: 2, do: GDZ_CA_AXES[2].do } }, { at: 130, mech: 'orbs', ph: 0 },
  { at: 150, beat: 'venomfang', ph: 0, o: { on: ['m6', 'r5'] } }, { at: 165, beat: 'transition', ph: 0 },
  { at: 177, mech: 'dm', ph: 1 }, { at: 190, mech: 'bombs', ph: 1 }, { at: 219, mech: 'dm', ph: 1 }, { at: 223, mech: 'bombs', ph: 1 }, { at: 247, beat: 'nightfall', ph: 1 },
  { at: 267, mech: 'dm', ph: 1 }, { at: 275, mech: 'bombs', ph: 1 }, { at: 304, mech: 'dm', ph: 1 }, { at: 308, mech: 'bombs', ph: 1 }, { at: 332, beat: 'nightfall', ph: 1 },
  { at: 352, mech: 'dm', ph: 1 }, { at: 360, mech: 'bombs', ph: 1, label: 'Last adds (Just kick them)', o: { kick: true, do: ['The last adds before the intermission: no bombs on them this time.', 'Kick every Wail of Terror. Each kick makes the add teleport.', 'Keep the kick rotation going on both adds.', 'Their shields break at the transition, so there\'s nothing more to do.'] } }, { at: 385, beat: 'p2end', ph: 1 },
  { at: 392, mech: 'frags', ph: 2 },
  { at: 430, beat: 'defile', ph: 3 }, { at: 432, mech: 'diamond', ph: 3 }, { at: 446, mech: 'axe', ph: 3, o: { at: [35, -35], soak: 'g1', do: GDZ_CA_AXES.g1.do }, label: 'Grim Guillotine 1 (At the star)' }, { at: 467, beat: 'nightfall', ph: 3, o: { ph: 3 } },
  { at: 473, beat: 'p3orbs', ph: 3 }, { at: 484, mech: 'dm', ph: 3 }, { at: 492, mech: 'bombs', ph: 3 }, { at: 511, mech: 'axe', ph: 3, o: { at: [35, 35], soak: 'g2', do: GDZ_CA_AXES.g2.do }, label: 'Grim Guillotine 2 (At the square)' },
  { at: 532, beat: 'defile', ph: 3 }, { at: 533, beat: 'p3orbs', ph: 3 }, { at: 564, beat: 'nightfall', ph: 3, o: { ph: 3 } }, { at: 583, mech: 'dm', ph: 3 }, { at: 589, mech: 'bombs', ph: 3, label: 'Last adds (Just kick them)', o: { kick: true, do: ['The last adds of the fight: no bombs needed.', 'Kick every Wail of Terror. Each kick makes the add teleport.', 'Keep the kick rotation going on both adds.', 'Damage stays on the bosses: the kill is close.'] } },
  { at: 611, mech: 'axe', ph: 3, o: { at: [35, 35], soak: 'g3', do: GDZ_CA_AXES.g3.do }, label: 'Grim Guillotine 3 (Send everyone free)' }, { at: 618, beat: 'kill', ph: 3 },
];
// (phase 3 has both bosses up: a scene borrowed from phase 1 or 2 gets the other one beside it)
function gdzCaSimAdd(k, e) {
  if (e.ph !== 3 || !e.mech || e.mech === 'diamond') return; const z = k.posAt('zj', 0), h = k.posAt('hm', 0);
  if (z && !h) k.boss('hm', 'Malacrass', 0, z[0] + 4, z[1] + 4); else if (h && !z) k.boss('zj', 'Zul\'jan', 0, h[0] - 4, h[1] - 4);
}
// running through the whole simulation: the rolling axes (5 from 0:14, 5 more from 1:39, each set for 3 minutes) and the Fangs puddles at the sides
function gdzCaSimOverlay(k, rt2sim, end) {
  const p2 = rt2sim(177);
  // (Noxious Ground, measured from about 1,600 hits on 11 Mythic kills (your notes, Oct 20: from the exact middle of each side, equal
  // sizes): each pool pours from the middle of the west or east wall. After the first Fangs it reaches to about 24 yards short of
  // the centre; after the second it stops about 4 yards short of the boss, so the two nearly touch there, and the gap widens to about 25 yards 30 yards north and south (where unhit players stood, Oct 20). Each hurts for about 28 seconds, then fades)
  const W = 52, life = 28;
  [[-W, 0], [W, 0]].forEach(([x, y]) => { k.ring({ x, y, r: 28, clip: true, fx: 'puddle', t0: rt2sim(0) + 2.6, dur: rt2sim(life) - rt2sim(0) - 2.6, color: '#c4f03c', fill: 'rgba(52,128,30,.5)', cn: 'Noxious Ground', legend: 'pools from Fangs: stay in the middle lane' });
    k.ring({ x, y, r: 48, clip: true, fx: 'puddle', t0: rt2sim(85) + 0.8, dur: rt2sim(85 + life) - rt2sim(85) - 0.8, color: '#c4f03c', fill: 'rgba(52,128,30,.46)', cn: 'Noxious Ground', legend: 'pools from Fangs: stay in the middle lane' }); });
  // (the rolling axes, as on the real kills: each throw's 5 roll on from the end of its own scene for 3 minutes, then vanish; in the
  // layout's turn (simRot 90), like the scenes; anyone one touches takes a hit)
  k.rot(90); const ov = [];
  GDZ_CA_SIM.forEach((e, j) => { if (e.mech !== 'grinder') return; const S = rt2sim(e.at), nx = GDZ_CA_SIM[j + 1], a = nx ? rt2sim(nx.at - 0.001) : S + 14, b = Math.min(end, rt2sim(e.at + 3 + 180));
    for (let n = 0; n < 5; n++) { const i = (e.o && e.o.more ? 5 : 0) + n, id = 'axo' + i, P = (t) => GDZ_CA_AXP[i](t - S - 3.4); for (let t = a; t <= b + 0.001; t += 1) { const q = P(t); k.obj(id, 'axe', t, q[0], q[1]); }
      k.show(id, a, b).ring({ on: id, r: 3, fx: 'zone', t0: a, dur: b - a, color: '#ff9628', cn: 'Axegrinder', legend: 'rolling axe: hurts if it touches you' }); ov.push({ a, b, P }); } });
  if (ov.length) { const pos = (i, t) => (t >= ov[i].a && t <= ov[i].b ? ov[i].P(t) : null), t0 = Math.min(...ov.map((x) => x.a)), t1 = Math.max(...ov.map((x) => x.b));
    gdzAxeDodge(k, GDZ_RAID, pos, ov.length, t0, t1); gdzAxeHits(k, GDZ_RAID, pos, ov.map((_, i) => i), t0, t1); }
  k.rot(0);
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
    map: () => { const k = gdzCaMarks(gdzKit('The Coiled Altar', 8)); k.boss('hm', 'Malacrass', 0, 16, 16);
      k.at(0, 't1', 22, 18).at(0, ['m1', 'm2', 'm3', 'm5', 'm6', 'm7'], 12, 22, 5).at(0, ['h1', 'h3', 'h4'], 0, 24, 4).at(0, ['r1', 'r3', 'r4', 'r6', 'r7'], -2, 6, 6).at(0, 'r5', 34, 32).at(0, 'm4', 30, 27);
      k.obj('g0', 'ghost', 0, 38, 26).obj('g0', 'ghost', 1, 38, 26).obj('g0', 'ghost', 3.6, 34.5, 24.5).show('g0', 0, 4.2);
      k.obj('g1', 'ghost', 0, 28, 20).obj('g1', 'ghost', 1, 28, 20).obj('g1', 'ghost', 3.6, 33, 24).show('g1', 0, 4.2);
      k.ring({ x: 33.8, y: 24.2, r: 4, fx: 'burst', t0: 3.2, at: 3.8, dur: 0.8, color: '#c49bff', cn: 'Malevolent Resonance', legend: 'two ghosts touching' });
      k.call(4, 7.6, 'Both players die', { x: 34, y: 30, color: '#ff3b3b', ink: '#fff' }); k.oops('r5', 4.2); k.oops('m4', 4.2);
      k.step(0.5).step(3.6).step(4.1); k.pause(3.2, 'Stop. Those two ghosts are drifting into each other. When they touch, both players die.', { x: 33, y: 24, r: 7 }); return k.done({ title: 'Mistake: two ghosts touch', focus: { x: 30, y: 24, r: 12 }, badLabel: 'dies' }); } },
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
  grinder: { name: 'Standing in the axes', solo: true, what: 'A melee player stops watching the axes. They take hit after hit and die, and the axes are still rolling.',
    do: ['A melee player keeps hitting the boss and stops watching the axes.', 'An axe rolls over them. It hurts, but one hit won\'t kill.', 'The axes don\'t go away. Every pass hurts again.', 'The hits add up: dead, and the axes are still rolling.'],
    map: () => GDZ_CA_M.grinder(true) },
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
  upd: ['12.1', 'Oct 20, 2026'], // (when this guide was last checked against the game and real kills)
  // (who each step is for, set by hand: '' everyone, t tanks, h healers, d DPS; the step lists of Heroic and Mythic by their names)
  stepRoles: {
    'Toxic Deluge (Carry orbs to the front)': ['', '', 'd', 't', ''], 'Toxic Deluge (Two triangles, purples at the tip)': ['dt', 'dh', 'd', 't', 'td', 't'],
    'Guillotine (Two groups take turns)': ['', '', '', '', ''], 'Guillotine (Planned soakers, immunities on the second)': ['', 'd', '', '', 'tdh'],
    'Dreadmarch (Stack them, then pile the ghosts)': ['', '', '', '', 't'], 'Dreadmarch (Stack on square, freeze your ghosts)': ['', 'd', '', '', 't'],
    'Gloombomb (Drop it on your add)': ['td', 'd', 'd', 'td'], 'Fragments of Malacrass (Stop them in turns)': ['d', '', '', 'h'], 'Fragments of Malacrass (3 to 5, then 7 to 10)': ['d', 'ht', '', '', 'h'],
    'Blighted Sever (All purples in one diamond)': ['dth', 'dh', 'dth', 't'], 'Axegrinder (Dodge the axes)': ['td', '', '', ''],
  },
  sum: 'Zul\'jan first, then Hex Lord Malacrass, then both at once. Orbs go to the front for the frontal, axes get soaked by five, and ghosts get led into the frontal too.',
  // (the Mythic guide credits its source by name (your call, Oct 20): a name only, never a link out)
  m: { simRot: 90, sim: GDZ_CA_SIM, simDur: GDZ_CA_DUR, simSev: GDZ_CA_SEV, simBands: [{ t0: 15, t1: 100, n: 5 }, { t0: 100, t1: 195, n: 10 }, { t0: 195, t1: 280, n: 5 }], simAlways: ['Axegrinder: 5 axes roll around the room from 0:14, 10 from 1:39, and the last ones vanish around 4:40. Step out of their way: every touch hurts.', 'From phase 3, Defilement ground stays down: stay out of it.'], beats: GDZ_CA_BEATS, simOverlay: gdzCaSimOverlay, simAdd: gdzCaSimAdd, source: 'Tactyks\' Mythic Coiled Altar guide and first-kill video', sum: 'Zul\'jan, then Hex Lord Malacrass, then both. Purple orbs must never touch another orb, every axe\'s soakers are planned, ghosts must never touch, and bombs go on the adds. This follows a plan that killed it, with its markers; your raid may mark the room its own way.' },
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
            ['r3'].concat(grp).forEach((id, i) => { k.ok(id, 6); const [dx, dy] = gdzSpot(i, 5, 5); k.hold(6.3, id).at(11, id, -3 + dx, 3 + dy); });
            k.ring1(['r3']).step(1).step(2.4).step(6).step(6.4).step(11);
            k.pause(5.6, 'Freeze. Count them: at least 5 in the circle, everyone else well away. In a moment the spot erupts 40 yards out.', { x: C[0], y: C[1], r: 11 }); return k.done({ title: 'Guillotine', focus: { x: 16, y: -14, r: 26 }, hlLabel: 'player with the axe', goodLabel: 'in the soak' });
          } },
        { id: 'grinder', fail: GDZ_CA_FAIL.grinder, name: 'Axegrinder (Dodge the axes)', spell: 'Axegrinder', what: 'Zul\'jan throws 5 axes out from himself, and anyone they fly into is knocked back. Then they roll around the room at random for 3 minutes, often right through the middle, and hurt anyone they touch.',
          do: ['Zul\'jan throws 5 axes out from himself. Anyone they fly into gets knocked back.', 'Then they roll around the room at random for 3 minutes, often right through the middle. Keep an eye on them.', 'The dashed line shows where an axe is heading. Step out of its path early, not when it\'s on you.', 'A touch doesn\'t knock you back, it just hurts. One won\'t kill you, but they add up. If you must pick, stand in a puddle rather than in an axe.'],
          m: { what: 'Zul\'jan throws 5 axes at 0:14 and 5 more at 1:39. Each set rolls for 3 minutes, so 10 are out at once until about 3:15, right through soaks, orbs and the start of phase 2.', do: ['Zul\'jan throws 5 axes out at 0:14 and 5 more at 1:39. Anyone they fly into gets knocked back.', 'Each set rolls around at random for 3 minutes, often through the middle. From 1:39 to about 3:15 there are 10.', 'The dashed line shows where an axe is heading. Step out of its path early, also during soaks and orbs.', 'A touch doesn\'t knock you back, it just hurts. One won\'t kill you, but they add up. Ranged: stay out of melee.'] },
          map: (D, o) => GDZ_CA_M.grinder(false, o, D) },
      ],
      tiles: [
        { name: 'Fangs of the Coiled Altar (Avoid the puddles)', do: 'Raid damage each cast, and big poison pools pour in from the middle of both side walls for about 25 seconds. The first ones stop short of the boss; the second ones nearly touch by the boss and leave a lane that widens to the north and south, so the raid takes damage and healers plan for it. The tank takes extra poison from his next hits.' },
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

// ===== Ula'tek: the shared bits (the platform's frame, the egg carrying, a hit; the room pictures and the phase-three quarters)
const ulP = (px, py) => [Math.round((px - 600) * 1.685) / 10, Math.round((337.5 - py) * 1.685) / 10]; // (a spot on Tactyks' RaidPlan, in yards)
const GDZ_ORIGIN = { 'Ula\'tek': { cx: 0, cy: 1554 } }, GDZ_FULL = { 'Ula\'tek': { x: 0, y: 0, r: 57 } };
const UL_SHELL = { r: 3, fx: 'debuff', color: '#3af2a8', cn: 'Noxious Shell', legend: 'carrying an egg: a 3-yard ring that must never touch another carrier\'s' };
// a carrier walks to an egg, picks it up and carries it (the ring round them on Mythic)
function ulCarry(k, who, egg, tAppear, ox, oy, tp, dx, dy, td, until, noRing) {
  const V = 8, t1 = Math.max(tAppear + 0.2, tp - 1.6), from = k.posAt(who, t1) || [ox, oy];
  const ta = Math.max(tp, t1 + Math.hypot(ox - from[0], oy - from[1]) / V), tb = Math.max(td, ta + Math.hypot(dx - ox, dy - oy) / V);
  k.obj(egg, 'egg', tAppear, ox, oy).obj(egg, 'egg', ta, ox, oy).obj(egg, 'egg', tb, dx + 2.6, dy - 2.2).show(egg, tAppear, until);
  k.at(t1, who, from[0], from[1], 0, true).at(ta, who, ox, oy).at(tb, who, dx, dy);
  if (!noRing) k.ring({ ...UL_SHELL, on: who, t0: ta, dur: (until || 99) - ta });
  return [ta, tb];
}
// an egg riding with its carrier from t0 to t1 (keyed every half second from where the carrier is), then gone
function ulRide(k, who, egg, t0, t1) { for (let t = t0; t <= t1 + 0.001; t += 0.5) { const p = k.posAt(who, Math.min(t, t1)); k.obj(egg, 'egg', t, p[0] + 2.6, p[1] - 2.2); } k.show(egg, t0, t1); }
function ulViper(k, id, t, x, y) { k.add(id, 'Blightscale Viper', t, x, y).show(id, t); k.ring({ x, y, r: 4, fx: 'burst', t0: t - 0.3, at: t, dur: 0.8, color: '#ff3b3b', cn: 'Noxious Splash', legend: 'an egg hatching a Viper' }); k.call(t + 0.1, t + 3.2, 'Viper hatched', { x, y: y + 5, color: '#ff3b3b', ink: '#fff' }); }
function ulHit(k, id, t, text) { k.ring({ on: id, r: 2.6, fx: 'burst', t0: t - 0.3, at: t, dur: 0.6, color: '#ff3b3b', cn: 'Hit', legend: 'a hit' }); k.call(t, t + 1.4, text || 'Hit', { on: id, color: '#ff3b3b', ink: '#fff' }); }
const UL_BROKEN = '08.ulatek-ort-fullbreak-v185.jpg', UL_FULL = '08.ulatek-ort-full-v185.jpg'; // (RaidPlan's whole-room pictures, broken and intact: the same size)
const UL_PL = { NW: [-14, 14], SW: [-14, -18], SE: [13, -18], NE: [16, 14] }, UL_PC = { NW: [-25, 27], SW: [-25, -27], SE: [25, -27], NE: [25, 27] }, UL_PB = { NW: [-33, 32], SW: [-33.5, -33], SE: [33, -33], NE: [33.4, 30.5] };
// ===== Ula'tek, rebuilt from scratch (Oct 21; notes/Guides/Bosses/8 Ula'tek.md): the in-game journal read in full, both Tactyks videos read
// in full, our Heroic kill xBTWphFCkG4jdwbY #12 (9:48) for the spots and the Heroic clock, and the top Mythic kills' clock (9:40). Yards from
// the platform's centre, x east, y north (RaidPlan's room picture). She starts at the north edge with her tail on the west side; the raid
// stands in front of her. Phase two splits the raid onto the two side ledges; phase three is on the four broken quarters.
const UX = "Ula'tek", UX_B = [0, 46], UX_TAIL = [-41, 0], UX_SA = [-25, 8], UX_SB = [-25, -8];
// home in phase one: her tank in front of her, melee round her south side, the off tank on the tail, healers and ranged further in
const UX_MEL = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'];
const UX_HOME = (() => { const H = { t1: [0, 39.5], t2: [-35, 2] };
  [215, 237, 259, 281, 303, 325].forEach((a, i) => { const r = a * Math.PI / 180; H[UX_MEL[i]] = [UX_B[0] + Math.cos(r) * 9, UX_B[1] + Math.sin(r) * 9]; }); /* (nzAdd isn't defined yet when this runs) */ H.m7 = [6, 30];
  [['h1', -13, 24], ['h2', 13, 24], ['h3', -4, 16], ['h4', 8, 14], ['r1', -24, 18], ['r2', 24, 18], ['r3', -18, 8], ['r4', 19, 6], ['r5', -8, 4], ['r6', 4, 2], ['r7', 30, 12]].forEach(([id, x, y]) => { H[id] = [x, y]; });
  return H; })();
function uxHome(k, t, hold, skip) { Object.entries(UX_HOME).forEach(([id, q]) => { if (skip && skip.includes(id)) return; if (hold != null) k.hold(hold, id); k.at(t, id, q[0], q[1]); }); return k; }
const uxBoss = (k, t, p) => k.boss('ul', UX, t || 0, (p || UX_B)[0], (p || UX_B)[1]);
const uxTail = (k, t, p) => k.boss('tl', 'Gore Rattle', t || 0, (p || UX_TAIL)[0], (p || UX_TAIL)[1]);
// the eight egg carriers' zones (Tactyks' zone defence, turned with her): Mages far left and right, two melee up by her, the rest inside
const UX_ZONE = { r3: [-34, 4], m1: [-11, 30], r5: [-16, 12], r1: [-12, -16], r2: [12, -16], r6: [16, 12], m2: [11, 30], r4: [34, 4] };
const UX_CAR = Object.keys(UX_ZONE);
const uxShell = (k, id, t0, dur) => k.ring({ on: id, r: 3, fx: 'debuff', t0, dur, color: '#3af2a8', cn: 'Noxious Shell', legend: 'Mythic: carrying an egg: a 3-yard ring that must never touch another carrier\'s' });
const uxSoak = (k, p, t0, at, cn) => k.ring({ x: p[0], y: p[1], r: 10, fx: 'soak', t0, at, dur: at - t0 + 0.6, color: '#24f2cb', cn: cn || 'Spectral Coils', legend: 'Spectral Coils: everyone in it shares the hit; carried eggs break' });
const UX_M = {
  // Call of the Serpent: her eggs fall from the ceiling (4-yard impacts), eight at a time. Each carrier picks up the one in their zone and
  // keeps it safe: a wave touching an egg (on the floor or carried) hatches a Viper, which hits the raid with Putrid Membrane and must die at
  // once. Mythic: each egg is Hardened (a shield to break first: Balance, Shadow), and carrying one gives Noxious Shell: a 3-yard ring that
  // must never touch another carrier's (it hatches at once). (fail, Heroic: an egg left on the floor when her waves come; Mythic: two
  // carriers' rings touch)
  eggs(fail, d, o) {
    const myth = d !== 'h', L = fail ? 15 : 13, k = gdzKit(UX, L); if (o && o.rot) k.rot(o.rot); k.art(0, UL_FULL); uxBoss(k, 0); uxTail(k, 0); uxHome(k, 0);
    k.cast('ul', 'Call of the Serpent', 0.2, 1.6); const T = 2.4, PICK = myth ? 6 : 3.4, O = { r3: [-3, -2], m1: [2, -3], r5: [-3, 2], r1: [2, 3], r2: [-2, 3], r6: [3, -2], m2: [-2, -3], r4: [3, 2] };
    UX_CAR.forEach((id, i) => { const z = UX_ZONE[id], e = [z[0] + O[id][0], z[1] + O[id][1]]; k.ring({ x: e[0], y: e[1], r: 4, fx: 'burst', t0: 1.6, at: T, dur: 0.8, color: '#c8a36a', cn: 'Call of the Serpent', legend: 'an egg lands: 4 yards of damage where it hits' });
      if (myth) k.ring({ x: e[0], y: e[1], r: 2.4, fx: 'safe', t0: T, dur: PICK - 0.6 - T, color: '#e6e0c8', cn: 'Hardened', legend: 'Mythic: a shield on the egg; break it before anyone can pick it up' });
      const left = fail && !myth && id === 'r1'; if (left) { k.obj('eg' + i, 'egg', T, e[0], e[1]).show('eg' + i, T, 11.6); return; }
      const [ta] = ulCarry(k, id, 'eg' + i, T, e[0], e[1], PICK + (i % 3) * 0.3, e[0] - 1, e[1] - 1, PICK + 0.8 + (i % 3) * 0.3, L, true); if (myth) uxShell(k, id, ta, L - ta); });
    if (myth) k.call(T + 0.4, PICK - 0.6, 'Break the shells', { x: 0, y: 22, color: '#e6e0c8', ink: '#1a1405' });
    if (fail && myth) { const a = 'r1', b = 'r2', mid = [0, -14]; k.hold(PICK + 1.6, [a, b]).at(8, a, mid[0] - 1, mid[1]).at(8, b, mid[0] + 1, mid[1]); ulViper(k, 'vp', 8.2, mid[0], mid[1] - 3); k.oops(a, 8.2); k.oops(b, 8.2);
      k.ring({ x: 0, y: 0, r: 70, fx: 'burst', t0: 8.4, at: 8.8, dur: 0.6, color: '#7fbf3a', cn: 'Putrid Membrane', legend: 'a Viper hatching: a DoT on the whole raid' }); k.step(0.2).step(T).step(8.2);
      k.pause(8.6, 'Two carriers drifted together: their rings touched and the egg hatched at once. A Viper, and Putrid Membrane on the whole raid.', { x: mid[0], y: mid[1], r: 8 });
      return k.done({ title: 'Mistake: two carriers touch', focus: { x: 0, y: 8, r: 40 }, badLabel: 'carriers who touched' }); }
    if (fail) { const e = [UX_ZONE.r1[0] + O.r1[0], UX_ZONE.r1[1] + O.r1[1]]; k.wave({ x: 12, y: 44, deg: 270, v: 12.5, w: 26, d: 5, t0: 7.6, t1: 15, color: '#9be13a', legend: 'Caustic Waves: an egg they touch hatches' });
      const th = 7.6 + (44 - e[1]) / 12.5; ulViper(k, 'vp', th, e[0], e[1]); k.ring({ x: 0, y: 0, r: 70, fx: 'burst', t0: th + 0.2, at: th + 0.6, dur: 0.6, color: '#7fbf3a', cn: 'Putrid Membrane', legend: 'a Viper hatching: a DoT on the whole raid' });
      UX_CAR.filter((id) => id !== 'r1' && UX_ZONE[id][0] > 0).forEach((id) => { k.hold(PICK + 1.6, id).at(7.4, id, UX_ZONE[id][0] - 26, UX_ZONE[id][1]); }); ['h2', 'h4', 'r7'].forEach((id) => { k.hold(4, id).at(7.4, id, UX_HOME[id][0] - 30, UX_HOME[id][1]); });
      k.step(0.2).step(T).step(th); k.pause(th + 0.4, 'Nobody took this egg. Her waves rolled over it and it hatched: a Viper, and Putrid Membrane on the whole raid.', { x: e[0], y: e[1], r: 8 });
      return k.done({ title: 'Mistake: an egg left on the floor', focus: { x: 0, y: 8, r: 44 } }); }
    k.ring1(UX_CAR).step(0.2).step(T).step(PICK).step(PICK + 1.2);
    k.pause(PICK + 1.2, myth ? 'Shells broken, every carrier holds the egg from their own zone, well apart: the 3-yard rings never touch.' : 'Every carrier picks up the egg in their zone. Eggs on the floor or in hand must never meet a wave.', { x: 0, y: 8, r: 40 });
    return k.done({ title: 'Call of the Serpent: every egg picked up', focus: { x: 0, y: 8, r: 44 }, hlLabel: 'the eight egg carriers' });
  },
  // Spectral Coils: her tail rises beside the platform and two soak circles appear by it, one after the other (the one on the right, facing
  // the tail, first). Everyone but her tank soaks: the hit is shared by everyone within 10 yards. Carried eggs break in the soak (a weak
  // Rawling). Heroic and up: Soul Constrictor (a soaker can't help the next one), so two groups, one per circle. (fail: everyone piles into the
  // first, the second goes off with nobody in it)
  coils(fail, d, o) {
    const myth = d !== 'h', L = 14, S1 = 7.8, S2 = 11.2, k = gdzKit(UX, L); if (o && o.rot) k.rot(o.rot); k.art(0, UL_FULL); uxBoss(k, 0); uxTail(k, 0); uxHome(k, 0);
    k.cast('tl', 'Spectral Coils', 0.4, 1.4); uxSoak(k, UX_SA, 1.4, S1); if (!fail) uxSoak(k, UX_SB, S1, S2); else k.ring({ x: UX_SB[0], y: UX_SB[1], r: 10, fx: 'soak', t0: S1, at: S2, dur: S2 - S1 + 0.6, color: '#24f2cb', cn: 'Spectral Coils', legend: 'Spectral Coils: everyone in it shares the hit; carried eggs break' });
    const G1 = ['m3', 'm4', 'm5', 'm6', 'm7', 'h1', 'h3', 'r1', 'r3', 'r5', 'r7'], G2 = ['m1', 'm2', 'h2', 'h4', 'r2', 'r4', 'r6'], C1 = fail ? G1.concat(G2) : G1;
    C1.forEach((id, i) => { const q = gdzSpot(i, C1.length, fail ? 6.4 : 5.8); k.hold(0.6, id).at(S1 - 0.4, id, UX_SA[0] + q[0], UX_SA[1] + q[1] + 2); }); /* (a step north, so group one isn't in the second soak's 10 yards too) */
    if (!fail) G2.forEach((id, i) => { const q = gdzSpot(i, G2.length, 4.8); k.hold(0.6, id).at(S1 - 0.6, id, UX_SB[0] + q[0] + 8, UX_SB[1] + q[1] - 6).hold(S1 + 0.2, id).at(S2 - 0.4, id, UX_SB[0] + q[0], UX_SB[1] + q[1] - 2); });
    // two carried eggs break in the first soak: weak Rawlings
    ['r3', 'r5'].forEach((id, i) => { const p0 = k.posAt(id, 0); k.obj('ce' + i, 'egg', 0, p0[0] + 2.6, p0[1] - 2.2); ulRide(k, id, 'ce' + i, 0, S1); k.add('rw' + i, 'Blightscale Rawling', S1 + 0.1, ...k.posAt(id, S1).map((v, j) => v + (j ? -3 : 3))).show('rw' + i, S1 + 0.1, L); });
    k.call(S1 + 0.2, S1 + 1.8, 'Eggs break: Rawlings', { x: UX_SA[0] + 6, y: UX_SA[1] + 11, color: '#c9d98a', ink: '#141006' });
    G1.forEach((id) => k.ring({ on: id, r: 2, fx: 'debuff', t0: S1 + 0.1, dur: 5, color: '#b06bff', cn: 'Soul Constrictor', legend: 'Soul Constrictor: you can\'t help with the next coil for 5 seconds' }));
    if (fail) { gdzFailBlast(k, S2 + 0.2, 'Nobody in the second coil: full damage', -6, 26, ['h4', 'r6'], 'Spectral Coils'); k.step(0.4).step(1.4).step(S2);
      k.pause(S2 + 0.6, 'Everyone piled into the first circle, and Soul Constrictor stopped them helping with the second. It went off with nobody in it: the whole hit on everyone.', { x: UX_SB[0], y: UX_SB[1], r: 10 });
      return k.done({ title: 'Mistake: nobody in the second coil', focus: { x: -18, y: 6, r: 32 }, badLabel: 'dies to the full hit' }); }
    k.ring1(G2).step(0.4).step(1.4).step(S1).step(S2);
    k.pause(S1 - 0.6, 'Group one in the first circle (the right one, facing the tail), group two waiting by the second. Her tank stays on her.', { x: -24, y: 0, r: 18 });
    return k.done({ title: 'Spectral Coils: two groups, two soaks', focus: { x: -18, y: 6, r: 32 }, hlLabel: 'group two, the second soak' });
  },
  // Caustic Waves: she pulls one wing back, and waves of venom roll across that half of the platform first, then the other half (and her
  // tail sends waves of its own). A wave hit is a huge stacking DoT, and an egg it touches hatches. Stand in the other half, then cross once
  // the first set has passed. (kept simple, your call: no tail waves drawn; fail: one player stays on the first side)
  waves(fail, d, o) {
    const L = 16, T0 = 4.4, k = gdzKit(UX, L), W1 = { x: -12, y: 46, deg: 270, v: 12.5, w: 24, d: 5, t0: T0, t1: T0 + 7.6, color: '#9be13a', legend: 'Caustic Waves: half the platform first, then the other half' }; if (o && o.rot) k.rot(o.rot); k.art(0, UL_FULL); uxBoss(k, 0); uxTail(k, 0); uxHome(k, 0);
    k.cast('ul', 'Caustic Waves', 0.2, T0); k.call(0.4, 2.6, 'Left wing back: west first', { x: -10, y: 38, color: '#9be13a', ink: '#0b1503' });
    k.wave(W1); k.wave({ ...W1, x: 12, t0: T0 + 5, t1: T0 + 12.6 }); k.wave({ ...W1, x: -36 }); k.wave({ ...W1, x: 36, t0: T0 + 5, t1: T0 + 12.6 });
    // (everyone waits on the east half near the middle; once the first wave has passed their row, they cross to the west half behind it)
    const LATE = fail ? 'r3' : null;
    Object.entries(UX_HOME).forEach(([id, q]) => { if (id === LATE || id === 't1') return; const wst = q[0] < 0, xa = Math.min(16, Math.max(6, Math.abs(q[0]) + 4)) + (wst ? 2 : 0), ya = q[1] + (wst ? -2.5 : 0), th = T0 + (46 - ya) / 12.5; /* (west players a step off, so mirror-image spots don't land on each other) */
      k.hold(0.4, id).at(Math.max(1.6, th - 0.6), id, xa, ya).hold(th + 0.4, id).at(th + 0.4 + 2 * xa / 7.5, id, -xa, ya); });
    k.hold(T0 - 1, 't1').at(T0 - 0.2, 't1', 6, 40).hold(T0 + 1, 't1').at(T0 + 3, 't1', -6, 40);
    if (fail) { const q = UX_HOME.r3, th = T0 + (46 - q[1]) / 12.5; ulHit(k, 'r3', th, 'Wave: a huge DoT'); k.oops('r3', th + 0.2); k.step(0.2).step(T0).step(th);
      k.pause(th + 0.3, 'This ranged stayed on the west half. The first wave rolled over them: a stacking DoT that one more wave finishes.', { on: 'r3', r: 8 });
      return k.done({ title: 'Mistake: on the side that goes first', focus: { x: 0, y: 4, r: 46 } }); }
    k.ring1(['t1']).step(0.2).step(T0).step(T0 + 3.4).step(T0 + 5);
    k.pause(T0 + 3.2, 'The west half goes first: everyone waits on the east half, then crosses behind the first wave before the second half goes.', { x: 0, y: 10, r: 30 });
    return k.done({ title: 'Caustic Waves: one half, then the other', focus: { x: 0, y: 4, r: 46 }, hlLabel: 'her tank, who steps with her' });
  },
  // Mother's Wrath (tank): a 5-second cast that knocks her tank back and marks them; then she bites for 3 seconds whoever is in her reach (the
  // red circle in front of her). Her tank runs straight back in with a big defensive: each bite stacks Stone Venom and Hobbled (55% slower).
  // If her tank is out of reach, the bites go on everyone. Swap after each one (best when her waves cast starts). (fail: the tank stays out)
  wrath(fail, d, o) {
    const L = 11, k = gdzKit(UX, L), RC = [0, 39]; if (o && o.rot) k.rot(o.rot); k.art(0, UL_FULL); uxBoss(k, 0); uxTail(k, 0); uxHome(k, 0);
    k.cast('ul', 'Mother\'s Wrath', 0.2, 5.2); k.ring({ x: RC[0], y: RC[1], r: 5, fx: 'zone', t0: 0.8, dur: 7.6, color: '#ff4a4a', fill: 'rgba(255,60,60,.18)', cn: 'Mother\'s Wrath', legend: 'her reach: her tank must be inside when the bites start' });
    k.hold(0.9, 't1').at(1.4, 't1', 0, 27); k.call(0.9, 2.4, 'Knocked back', { on: 't1', color: '#ff8a8a', ink: '#200a0a' });
    if (!fail) { k.hold(2, 't1').at(4.8, 't1', 0.5, 39.5); k.call(3.6, 5.2, 'Big defensive', { on: 't1', color: '#5aa0ff', ink: '#fff' }); }
    for (let i = 0; i < 5; i++) k.ring({ on: fail ? 'h1' : 't1', r: 2.6, fx: 'burst', t0: 5.2 + i * 0.6 - 0.2, at: 5.2 + i * 0.6, dur: 0.4, color: '#ff4a4a', cn: 'Bite', legend: 'a bite: Stone Venom and Hobbled' });
    if (fail) { gdzFailBlast(k, 5.4, 'Out of reach: the bites hit everyone', -16, 30, ['h1', 'r5'], 'Mother\'s Wrath'); k.step(0.2).step(0.9).step(5.2);
      k.pause(6, 'Her tank didn\'t get back into the red circle in time, so every bite went out to the whole raid instead.', { x: RC[0], y: RC[1], r: 8 });
      return k.done({ title: 'Mistake: her tank out of reach', focus: { x: -4, y: 28, r: 24 }, badLabel: 'dies to the bites' }); }
    k.ring({ on: 't1', r: 2.2, fx: 'debuff', t0: 5.4, dur: L - 5.4, color: '#c8a36a', cn: 'Hobbled', legend: 'Hobbled: 55% slower (Blessing of Freedom helps); Stone Venom stacks' });
    k.call(8.6, 10.6, 'Swap at her waves cast', { on: 't2', color: '#5aa0ff', ink: '#fff' }); /* (the tanks swap during her next Caustic Waves cast, never two Wraths in a row) */
    k.ring1(['t1', 't2']).step(0.2).step(0.9).step(4.8).step(8.6);
    k.pause(4.9, 'Knocked back, her tank walks straight back into the red circle in front of her and takes the bites with a big defensive.', { x: RC[0], y: RC[1], r: 8 });
    return k.done({ title: 'Mother\'s Wrath: back into her reach', focus: { x: -4, y: 28, r: 24 }, hlLabel: 'the tanks' });
  },
  // Mephitic Thrash: her tail sweeps the ground: a big hit and a knockback within 35 yards, a smaller hit and DoT beyond. Everyone near the
  // tail runs out of the 35 yards, its tank too, then back. (fail: a ranged stays inside)
  thrash(fail, d, o) {
    const L = 10, k = gdzKit(UX, L); if (o && o.rot) k.rot(o.rot); k.art(0, UL_FULL); uxBoss(k, 0); uxTail(k, 0); uxHome(k, 0);
    k.cast('tl', 'Mephitic Thrash', 0.4, 4.4); k.ring({ x: UX_TAIL[0], y: UX_TAIL[1], r: 35, fx: 'zone', t0: 0.4, dur: 4.2, color: '#ff8a3b', fill: 'rgba(255,138,59,.12)', cn: 'Mephitic Thrash', legend: 'Mephitic Thrash: a big hit and a knockback within 35 yards' });
    const OUT = (q) => { const v = [q[0] - UX_TAIL[0], q[1] - UX_TAIL[1]], dd = Math.hypot(v[0], v[1]) || 1; return dd >= 37 ? null : [UX_TAIL[0] + v[0] / dd * 38, UX_TAIL[1] + v[1] / dd * 38]; };
    Object.entries(UX_HOME).forEach(([id, q]) => { if (fail && id === 'r3') return; const o = id === 't2' ? [-3, 2] : OUT(q); if (!o) return; k.hold(0.6, id).at(4, id, o[0], o[1]).hold(4.8, id).at(L - 0.4, id, q[0], q[1]); });
    k.ring({ x: UX_TAIL[0], y: UX_TAIL[1], r: 35, fx: 'burst', t0: 4.1, at: 4.4, dur: 0.6, color: '#ff8a3b', cn: 'Mephitic Thrash', legend: 'the sweep lands' });
    if (fail) { const q = UX_HOME.r3; ulHit(k, 'r3', 4.4, 'Hit and knocked back'); k.hold(4.4, 'r3').at(4.9, 'r3', q[0] + 14, q[1] + 2); k.call(4.4, 5.8, 'Knocked back', { on: 'r3', color: '#ff8a8a', ink: '#200a0a' }); k.step(0.4).step(0.6).step(4.4);
      k.pause(5, 'This ranged stayed inside the 35 yards: the full hit and a knockback (with an egg in hand, straight into trouble).', { on: 'r3', r: 9 });
      return k.done({ title: 'Mistake: inside the sweep', focus: { x: -12, y: 8, r: 40 } }); }
    k.ring1(['t2']).step(0.4).step(0.6).step(4.4);
    k.pause(3, 'Everyone near the tail runs out of its 35 yards, its tank too; the rest take only the small hit.', { x: UX_TAIL[0], y: UX_TAIL[1], r: 35 });
    return k.done({ title: 'Mephitic Thrash: out of 35 yards', focus: { x: -12, y: 8, r: 42 }, hlLabel: 'the tail\'s tank' });
  },
  // Mythic: the Blightscale Wretch. Toxic Womb drops it (7 yards of damage where it lands); a spectral Ula'tek at the platform's edge pours
  // venom at it for 4 seconds unless the off tank steps into the stream (Toxic Burn on the tank, and waves from the tank: aim them off the
  // platform, away from eggs). It wakes after 20 seconds and casts Fester Burst: a 10-yard bubble round it, a big hit and DoT on everyone
  // farther away: the whole raid, egg carriers too, gets inside. Kill it before its third bubble. (fail: a carrier stays outside)
  wretch(fail, d, o) {
    const L = 16, k = gdzKit(UX, L), WP = [-4, 26], IMG = [-46, 8]; if (o && o.rot) k.rot(o.rot); k.art(0, UL_FULL); uxBoss(k, 0); uxTail(k, 0); uxHome(k, 0);
    k.ring({ x: WP[0], y: WP[1], r: 7, fx: 'burst', t0: 0.2, at: 1, dur: 0.6, color: '#c8a36a', cn: 'Toxic Womb', legend: 'Toxic Womb: 7 yards of damage where the Wretch lands' });
    k.add('wr', 'Blightscale Wretch', 1, WP[0], WP[1]); k.add('im', 'Spectral Ula\'tek', 1.4, IMG[0], IMG[1]).show('im', 1.4, 7);
    const BEAM = nzAdd(IMG, Math.atan2(WP[1] - IMG[1], WP[0] - IMG[0]) * 180 / Math.PI, 5); k.hold(0.6, 't2').at(2.6, 't2', BEAM[0], BEAM[1]);
    k.link({ from: 'im', to: 't2', t0: 2.6, t1: 6.6, color: '#3af2a8', legend: 'Toxic Incubation: the off tank stands in the venom so the Wretch doesn\'t get it' });
    for (let i = 0; i < 4; i++) k.wave({ x: BEAM[0], y: BEAM[1], deg: 180 + (i % 2 ? 18 : -18), v: 14, w: 4, d: 3, t0: 3 + i, t1: 4.6 + i, color: '#9be13a', legend: 'waves from the tank: aimed off the platform, away from the eggs' });
    k.ring({ on: 't2', r: 2.4, fx: 'debuff', t0: 2.6, dur: 4, color: '#3af2a8', cn: 'Toxic Burn', legend: 'Toxic Burn: a stacking DoT on the off tank' });
    k.hold(6.8, 't2').at(11, 't2', WP[0] - 3, WP[1] - 4); k.add('wr', 'Blightscale Wretch', 11, WP[0] - 2, WP[1] - 1);
    k.cast('wr', 'Fester Burst', 10.6, 14.6); k.ring({ on: 'wr', r: 10, fx: 'safe', t0: 10.6, dur: 4.4, color: '#d8f22f', cn: 'Fester Burst', legend: 'Fester Burst: inside this bubble is safe; everyone farther than 10 yards is hit' });
    const IN = Object.keys(UX_HOME).filter((id) => !['t1', 't2'].includes(id) && !(fail && id === 'r4')); IN.forEach((id, i) => { const q = gdzSpot(i, IN.length, 9); k.hold(9.4, id).at(14.2, id, WP[0] - 2 + q[0], WP[1] - 1 + q[1]); });
    k.ring({ on: 'wr', r: 10, fx: 'burst', t0: 14.3, at: 14.6, dur: 0.6, color: '#d8f22f', cn: 'Fester Burst', legend: 'the bubble bursts: everyone outside it is hit' });
    k.call(10.8, 13.6, 'Into the bubble', { x: WP[0], y: WP[1] + 14, color: '#d8f22f', ink: '#141603' });
    if (fail) { ulHit(k, 'r4', 14.6, 'Outside: big hit and DoT'); k.oops('r4', 14.8); k.step(0.2).step(2.6).step(14.6);
      k.pause(15, 'An egg carrier stayed out by their zone. Fester Burst hits everyone outside the 10 yards: with the egg\'s DoT on top, dead, and the egg hatches.', { on: 'r4', r: 9 });
      return k.done({ title: 'Mistake: outside the Wretch\'s bubble', focus: { x: -8, y: 12, r: 40 } }); }
    k.ring1(['t2']).step(0.2).step(2.6).step(10.6).step(14.6);
    k.pause(4, 'The off tank stands in the spectral venom so the Wretch never gets it, aiming its waves off the platform.', { x: BEAM[0], y: BEAM[1], r: 10 });
    return k.done({ title: 'The Wretch: soak its venom, then into its bubble', focus: { x: -12, y: 14, r: 36 }, hlLabel: 'the off tank' });
  },
  // Rage of the Shackled: a 6.5-second cast, then 20 seconds of raid damage every 4 seconds and Falling Debris (7 yards, a one-shot even for a
  // tank) at random spots, while her Venomous Heart is open and takes 100% more damage: everything on the heart (adds dragged in to cleave),
  // cooldowns and potions; dodge the brown circles. (o.e: she's on the east edge; fail: a player stays under a debris circle)
  heart(fail, d, o) {
    o = o || {}; const L = 14, k = gdzKit(UX, L); if (o.e) k.rot(-90); else if (o.rot) k.rot(o.rot); k.art(0, UL_FULL); uxBoss(k, 0); uxHome(k, 0); if (o.tail !== false) uxTail(k, 0);
    k.cast('ul', 'Rage of the Shackled', 0.2, 2.2); k.add('ht', 'Venomous Heart', 2.2, 0, 41.5).show('ht', 2.2, L);
    k.call(2.4, 5, 'Heart open: everything on it', { x: 0, y: 30, color: '#ff8a5a', ink: '#1a0a04' });
    [2.6, 6.6, 10.6].forEach((t) => k.ring({ x: 0, y: 0, r: 70, fx: 'burst', t0: t - 0.2, at: t, dur: 0.5, color: '#9b6bff', cn: 'Rage of the Shackled', legend: 'raid damage every 4 seconds' }));
    const D = [[[-20, 26], [18, 8], [-6, -10]], [[10, 30], [-24, 6], [22, -12]], [[-12, 18], [26, 22], [2, -24]]], NEAR = new Set();
    D.forEach((set, w) => set.forEach((p, j) => { const at = 4.5 + w * 3.4; k.ring({ x: p[0], y: p[1], r: 7, fx: 'burst', t0: at - 1.8, at, dur: 2.4, color: '#c8a36a', cn: 'Falling Debris', legend: 'Falling Debris: 7 yards, one-shots anyone, tanks too' });
      Object.entries(UX_HOME).forEach(([id, q]) => { const cur = k.posAt(id, at - 1.8) || q; if (Math.hypot(cur[0] - p[0], cur[1] - p[1]) < 8.5 && !(fail && id === 'r5' && w === 0)) { const v = [cur[0] - p[0], cur[1] - p[1]], dd = Math.hypot(v[0], v[1]) || 1, e = [p[0] + v[0] / dd * 9.5, p[1] + v[1] / dd * 9.5]; if (!NEAR.has(id + w)) { NEAR.add(id + w); k.hold(at - 1.8, id).at(at - 0.6, id, e[0], e[1]); } } }); }));
    if (fail) { const p = D[0][2]; k.hold(2, 'r5').at(3.6, 'r5', p[0] + 1, p[1] + 1); k.oops('r5', 4.6); k.call(4.6, 6.4, 'Under the debris: dead', { on: 'r5', color: '#ff3b3b', ink: '#fff' }); k.step(0.2).step(2.4).step(4.5);
      k.pause(4.9, 'This ranged didn\'t look down: Falling Debris one-shots anyone inside its 7 yards.', { x: p[0], y: p[1], r: 9 });
      return k.done({ title: 'Mistake: under the falling debris', focus: { x: 0, y: 10, r: 42 } }); }
    k.step(0.2).step(2.4).step(2.7).step(4.5);
    k.pause(3, 'Her heart is open for 20 seconds and takes double damage. Brown circles mark the debris: step out before it lands.', { x: 0, y: 16, r: 28 });
    return k.done({ title: 'Rage of the Shackled: burn the heart, dodge the debris', focus: { x: 0, y: 10, r: 44 } });
  },
};

// ---- Phase two: half the raid on each side ledge (drawn on the east one; the west is the same, mirrored). From our Heroic kill: each half
// went to its ledge's north end first (most eggs), then south; the Weakened Doomscales came out by each ledge's pit (the cauldron).
const UX_E = { gate: [100, 22], north: [82, 58], south: [90, -46], pit: [108, 0], warden: [94, 36] };
const UX_HALF = ['t1', 'h1', 'h3', 'm1', 'm2', 'm3', 'r1', 'r3', 'r5', 'r7'];
const UX_NEGG = [[76, 60], [86, 64], [82, 52]];
// the half at the north end, the tank on the Warden, ranged and healers out of the eggs' 7 yards
function uxHalf(k, t, hold, W) { const S = { t1: [W[0] + 3.5, W[1] - 3], m1: [W[0] - 4, W[1] - 5], m2: [W[0] + 6, W[1] - 7.5], m3: [W[0] + 1, W[1] - 9], h1: [90, 42], h3: [97, 46], r1: [100, 52], r3: [92, 36], r5: [100, 38], r7: [96, 58] };
  Object.entries(S).forEach(([id, q]) => { if (hold != null) k.hold(hold, id); k.at(t, id, q[0], q[1]); }); return S; }
Object.assign(UX_M, {
  // Doomscale Warden: the half gates over. Its tank pulls the Warden across, it Shadow Molts to the eggs and starts Writhing Gestation on
  // them (they become a clutch that hatches in 20 seconds): cleave the gestating eggs first. While it lives no egg can be touched (Warden's
  // Protection hurts anyone within 7 yards). Kick every Malice (6 seconds of raid damage). Kill it before its next Gestation.
  // (fail: a Malice not kicked)
  warden(fail, d) {
    const myth = d !== 'h', L = 16, k = gdzKit(UX, L), E = UX_E; k.art(0, UL_FULL);
    UX_HALF.forEach((id, i) => { const q = gdzSpot(i, UX_HALF.length, 5); k.at(0, id, 26 + q[0], 4 + q[1]).hold(0.6, id).at(1, id, E.gate[0] + q[0], E.gate[1] + q[1]); });
    k.call(0.4, 1.8, 'Gateway', { x: E.gate[0], y: E.gate[1] - 8, color: '#c084ff', ink: '#14062a' });
    k.add('wd', 'Doomscale Warden', 0, E.warden[0], E.warden[1]).add('wd', 'Doomscale Warden', 2.4, E.warden[0], E.warden[1]).add('wd', 'Doomscale Warden', 3.4, E.warden[0] - 2, 28);
    k.hold(1, 't1').at(2.4, 't1', E.warden[0] + 2, E.warden[1] - 3).at(3.4, 't1', E.warden[0], 25);
    k.cast('wd', 'Shadow Molt', 3.4, 4.6); const W = [80, 56]; k.add('wd', 'Doomscale Warden', 4.6, E.warden[0] - 2, 28).add('wd', 'Doomscale Warden', 4.8, W[0], W[1]);
    UX_NEGG.forEach((p, i) => { k.obj('ne' + i, 'egg', 0, p[0], p[1]).show('ne' + i, 0, 10.4 + i * 0.4); k.ring({ x: p[0], y: p[1], r: 7, fx: 'zone', t0: 0, dur: 10.4 + i * 0.4, color: '#7fbf3a', fill: 'rgba(127,191,58,.08)', cn: 'Warden\'s Protection', legend: 'Warden\'s Protection: eggs can\'t be touched while it lives, and hurt anyone within 7 yards' }); k.add('rl' + i, 'Blightscale Rawling', 10.4 + i * 0.4, p[0], p[1]).show('rl' + i, 10.4 + i * 0.4, L); });
    k.cast('wd', 'Writhing Gestation', 4.8, L); k.ring({ on: 'wd', r: 10, fx: 'zone', t0: 4.8, dur: 5.6, color: '#b06bff', fill: 'rgba(176,107,255,.12)', cn: 'Writhing Gestation', legend: 'Writhing Gestation: nearby eggs become a clutch that hatches in 20 seconds: cleave them first' });
    uxHalf(k, 9.4, 4.6, W); k.call(7.4, 9.4, 'Cleave the gestating eggs', { x: W[0], y: W[1] + 12, color: '#b06bff', ink: '#fff' });
    k.cast('wd', 'Malice', 9.6, 11.1, fail ? 'done' : 'kick', fail ? '' : 'm1'); k.cast('wd', 'Malice', 13.2, 14.7, 'kick', 'm2');
    if (fail) { [11.1, 12.1, 13.1].forEach((t) => k.ring({ x: 0, y: 0, r: 200, fx: 'burst', t0: t - 0.2, at: t, dur: 0.4, color: '#ff3b3b', cn: 'Malice', legend: 'Malice: raid damage every second for 6 seconds' })); gdzFailBlast(k, 12.2, 'Malice not kicked: raid damage', 90, 70, ['h3', 'r7'], 'Malice');
      k.step(0.4).step(4.8).step(11.1); k.pause(12.4, 'Nobody kicked this Malice: a big hit on the whole raid every second for 6 seconds, and the half crumbles.', { x: W[0], y: W[1], r: 10 });
      return k.done({ title: 'Mistake: a Malice not kicked', focus: { x: 90, y: 42, r: 26 }, full: { x: 88, y: 30, r: 40 } }); }
    k.ring({ on: 'wd', r: 4, fx: 'burst', t0: 15.2, at: 15.6, dur: 0.6, color: '#ffd23b', cn: 'Doomscale Warden dies', legend: 'the Warden dies before its next Gestation' }); k.show('wd', 0, 15.6);
    k.ring1(['t1', 'm1', 'm2']).step(0.4).step(3.4).step(9.4).step(13.2);
    k.pause(9.6, 'The Warden Shadow Molts to the eggs and starts Writhing Gestation: cleave those eggs first, and stay out of their 7 yards while it lives.', { x: W[0], y: W[1], r: 12 });
    return k.done({ title: 'Doomscale Warden: cleave the eggs, kick Malice', focus: { x: 90, y: 42, r: 26 }, full: { x: 88, y: 30, r: 40 }, hlLabel: 'its tank and the kickers' });
  },
  // Grasping Fangs: the Warden bites a few players (three a side on Heroic, six on Mythic) with tethers that slow them; snapping one (moving
  // away) gives Blight Vein, a DoT. Heroic and up it lands on the whole raid and stacks: snap two at a time and let it fall off. Mythic: one
  // solo snap (a mobile ranged), then the other five together at the edge of their tethers, stepping out on the count under stacked raid
  // cooldowns. (fail: everyone snaps at once (Heroic), or the five snap one by one (Mythic))
  fangs(fail, d) {
    const myth = d !== 'h', L = 15, k = gdzKit(UX, L), W = [80, 56]; k.art(0, UL_FULL); k.add('wd', 'Doomscale Warden', 0, W[0], W[1]); const S = uxHalf(k, 0, null, W);
    k.cast('wd', 'Grasping Fangs', 0.4, 1.6); const TG = myth ? ['r1', 'r3', 'r5', 'r7', 'h1', 'h3'] : ['r1', 'r5', 'h3'];
    const SNAP = myth ? (fail ? [4, 8.6, 9.4, 10.4, 11.2, 12] : [4, 9.6, 9.6, 9.6, 9.6, 9.6]) : (fail ? [4.4, 4.4, 4.4] : [4.4, 4.4, 9.6]);
    TG.forEach((id, i) => { const q = S[id], v = [q[0] - W[0], q[1] - W[1]], dd = Math.hypot(v[0], v[1]) || 1, ed = [W[0] + v[0] / dd * 20, W[1] + v[1] / dd * 20], out = [W[0] + v[0] / dd * 25, W[1] + v[1] / dd * 25];
      k.link({ from: 'wd', to: id, t0: 1.6, t1: SNAP[i], color: '#ff5a4f', legend: 'Grasping Fangs: a tether that breaks with distance; snapping it gives Blight Vein' });
      k.hold(1.6, id).at(Math.min(SNAP[i] - 1, 3.6), id, ed[0], ed[1]).hold(SNAP[i] - 0.4, id).at(SNAP[i], id, out[0], out[1]);
      k.ring({ x: 0, y: 0, r: 200, fx: 'burst', t0: SNAP[i] - 0.2, at: SNAP[i] + i * 0.01, dur: 0.5, color: '#ff5a4f', cn: 'Blight Vein', legend: 'Blight Vein: a DoT on everyone (Heroic and up), stacking with every snap' }); });
    if (myth) k.call(8.4, 11, 'AMZ, Rally: snap together', { x: W[0] + 10, y: W[1] + 14, color: '#45d16b', ink: '#04140a' }); else k.call(8.8, 10.6, 'Next pair', { x: W[0] + 10, y: W[1] + 14, color: '#ff5a4f', ink: '#fff' });
    if (fail) { gdzFailBlast(k, myth ? 12.2 : 4.8, myth ? 'Late snaps: extra Blight Vein ticks' : 'Three snaps at once: stacked DoTs', 92, 72, ['h1', 'r7'], 'Blight Vein'); k.step(0.4).step(1.6).step(myth ? 9.6 : 4.4);
      k.pause(myth ? 12.6 : 5.2, myth ? 'The five snapped one after another instead of together, so the raid ate extra ticks of every Blight Vein.' : 'All three snapped at once: three stacks of Blight Vein on everyone at the same moment.', { x: W[0], y: W[1], r: 22 });
      return k.done({ title: myth ? 'Mistake: the five snap one by one' : 'Mistake: everyone snaps at once', focus: { x: 88, y: 50, r: 28 }, full: { x: 88, y: 40, r: 36 }, badLabel: 'dies to the stacked DoTs' }); }
    k.ring1(TG).step(0.4).step(1.6).step(myth ? 4 : 4.4).step(9.6);
    k.pause(3.8, myth ? 'One mobile ranged snaps alone first. The other five walk to the edge of their tethers and step out together on the count.' : 'Two snap first and the raid heals through their Blight Vein; the last one snaps once it has fallen off.', { x: W[0], y: W[1], r: 22 });
    return k.done({ title: myth ? 'Grasping Fangs: one, then the five together' : 'Grasping Fangs: two at a time', focus: { x: 88, y: 50, r: 28 }, full: { x: 88, y: 40, r: 36 }, hlLabel: 'the tethered players' });
  },
  // The Doomscale Eggs: with the Warden dead, carry every small egg to the cauldron in the pit (they hatch into weak Rawlings: kill them),
  // and the big Doomscale Egg last: picking it up with small eggs still out starts them all gestating, and it must be in the cauldron before
  // its Hatching Doom finishes, or the Ravenous Doomscale's Dread Roar stuns everyone for 20 seconds: a wipe. The cauldron gives a Weakened
  // Doomscale: kick Anguished Cry (a 60-yard stun), its Desperate Thrash frontal away from the raid, bring it back to her. Mythic: carriers in
  // lanes (3-yard rings), and kill the Doomscales evenly (Revenge). (fail: the big egg too late)
  doomscales(fail, d) {
    const myth = d !== 'h', L = fail ? 17 : 22, k = gdzKit(UX, L), E = UX_E, W = [80, 56]; k.art(0, UL_FULL); uxHalf(k, 0, null, W);
    k.obj('dg', 'begg', 0, E.south[0], E.south[1]); k.cast('dg', 'Hatching Doom', 0, fail ? 15.6 : 24);
    const CAR = ['r1', 'r3', 'm2'], SM = [[78, 60], [86, 62], [82, 52]], LANE = [[92, 36], [112, 40], [94, 26]];
    CAR.forEach((id, i) => { const p = SM[i], [ta, tb] = ulCarry(k, id, 'se' + i, 0, p[0], p[1], 1 + i, LANE[i][0], LANE[i][1], 5 + i * 0.4, 99, true); if (myth) uxShell(k, id, ta, 11.8 - ta);
      k.hold(tb, id).at(tb + 4.4, id, E.pit[0] - 7 + i * 7, E.pit[1] + 6); k.add('rw' + i, 'Blightscale Rawling', 12, E.pit[0] - 4 + i * 4, E.pit[1] - 1).show('rw' + i, 12, 15.4 + i * 0.4); k.show('se' + i, 0, 11.8); }); /* (7 yards apart at the cauldron: the 3-yard rings never touch; in together at 12) */
    k.call(11.8, 13.4, 'Small eggs in: Rawlings', { x: E.pit[0], y: E.pit[1] - 8, color: '#c9d98a', ink: '#141006' });
    ['t1', 'm1', 'm3', 'h1', 'r5', 'r7'].forEach((id, i) => { const q = gdzSpot(i, 6, 6); k.hold(5, id).at(9.4, id, E.pit[0] - 2 + q[0], E.pit[1] + 17 + q[1]); }); /* (north of the carriers' spots at the cauldron) */
    const BIG = 'h3', tp = fail ? 9.4 : 8.6; k.hold(1, BIG).at(tp, BIG, E.south[0] + 1, E.south[1] + 1); k.call(8.4, 10.4, 'Big egg last', { on: BIG, color: '#7fbf3a', ink: '#0b1503' });
    if (fail) { k.call(10, 15.4, 'Waiting too long…', { on: BIG, color: '#ffd23b', ink: '#1a1405' }); k.add('rd', 'Ravenous Doomscale', 15.6, E.south[0], E.south[1] + 3); k.cast('rd', 'Dread Roar', 15.6, 16.4);
      gdzFailBlast(k, 16.4, 'Dread Roar: everyone stunned 20 s', 96, 66, ['h1', 'r7', 'm1'], 'Dread Roar'); k.step(0.2).step(tp).step(15.6);
      k.pause(16.6, 'The big egg stayed out too long: its Hatching Doom finished, and the Ravenous Doomscale\'s Dread Roar stunned everyone for 20 seconds. A wipe.', { x: E.south[0], y: E.south[1], r: 10 });
      return k.done({ title: 'Mistake: the Doomscale Egg too late', focus: { x: 98, y: 8, r: 46 }, full: { x: 92, y: 8, r: 58 }, badLabel: 'stunned' }); }
    for (let t = tp; t <= 15.4; t += 0.5) { const f = Math.min(1, (t - tp) / 6.6); k.obj('dg', 'begg', t, E.south[0] + (E.pit[0] - E.south[0]) * f + 2.6, E.south[1] + (E.pit[1] - E.south[1]) * f - 2.2); }
    k.show('dg', 0, 15.6); k.at(15.2, BIG, E.pit[0], E.pit[1] - 3);
    k.add('dm', 'Weakened Doomscale', 15.8, E.pit[0], E.pit[1] - 6).add('dm', 'Weakened Doomscale', L, E.pit[0] - 8, E.pit[1] - 4); k.call(15.8, 17.6, 'Weakened: kick, tank it', { x: E.pit[0], y: E.pit[1] - 14, color: '#c9d98a', ink: '#141006' });
    k.cast('dm', 'Anguished Cry', 17, 19.5, 'kick', 'm1'); k.hold(15.8, 't1').at(18.2, 't1', E.pit[0] - 6, E.pit[1] - 10); k.cast('dm', 'Desperate Thrash', 19.6, 21.6); k.cone({ from: 'dm', to: 't1', at: 21.6, r: 14, width: 50 });
    if (myth) k.call(19.8, 21.8, 'Kill both sides evenly', { x: E.pit[0] + 2, y: E.pit[1] + 18, color: '#ffd23b', ink: '#1a1405' });
    k.ring1(CAR.concat(BIG)).step(0.2).step(5).step(8.6).step(15.8);
    k.pause(12.2, 'Small eggs into the cauldron first' + (myth ? ', each carrier in their own lane' : '') + '. Then one player brings the big Doomscale Egg, well before its Hatching Doom ends.', { x: 100, y: 6, r: 22 });
    return k.done({ title: 'The Doomscale Eggs: small first, the big one last', focus: { x: 98, y: 8, r: 46 }, full: { x: 92, y: 8, r: 58 }, hlLabel: 'the egg carriers' });
  },
  // The intermission: eggs keep falling and tails rise round the room, each casting Spectral Coils, one after another. Heroic: two groups
  // take turns (Soul Constrictor); Mythic: three groups (the coils come faster; the third only soaks twice). Carry eggs into the soaks to
  // break them. Then she bursts up through the middle and the platform shatters into four: stand toward your side, on the inside.
  // (fail: one group takes two coils in a row and Soul Constrictor stops them counting)
  intcoils(fail, d) {
    const myth = d !== 'h', L = myth ? 28 : 26.2, k = gdzKit(UX, L); k.art(0, UL_FULL);
    const ORD = myth ? [90, 45, 0, 315, 270, 225, 180, 135] : [90, 45, 0, 315, 270, 225], GRP = myth ? [0, 1, 2, 0, 1, 2, 0, 1] : [0, 1, 0, 1, 0, 1];
    const G = myth ? [['t1', 'm1', 'm2', 'm3', 'm4', 'm5'], ['t2', 'r1', 'r2', 'r3', 'm6', 'm7'], ['r4', 'r5', 'r6', 'r7', 'h1', 'h2']] : [['t1', 'm1', 'm2', 'm3', 'm4', 'm5', 'r1', 'r2', 'h1'], ['t2', 'm6', 'm7', 'r3', 'r4', 'r5', 'r6', 'r7', 'h2']];
    const MID = myth ? ['h3', 'h4'] : ['h3', 'h4']; MID.forEach((id, i) => k.at(0, id, i ? 4 : -4, 0));
    const SP = (a) => nzAdd([0, 0], a, 24), START = [[0, 8], [-14, -8], [14, -8]];
    G.forEach((g, gi) => g.forEach((id, i) => { const q = gdzSpot(i, g.length, 5); k.at(0, id, START[gi][0] + q[0], START[gi][1] + q[1]); }));
    let t = 2.4; const busy = [0, 0, 0];
    ORD.forEach((a, n) => { const c = nzAdd([0, 0], a, 44), s = SP(a), land = t + 2.6, gi = fail && n === 1 ? 0 : GRP[n];
      k.add('tc' + n, 'Gore Rattle', t, c[0], c[1]).show('tc' + n, t, land + 0.6); uxSoak(k, s, t, land);
      G[gi].forEach((id, i) => { const q = gdzSpot(i, G[gi].length, 4.6); k.hold(busy[gi], id).at(land - 0.3, id, s[0] + q[0], s[1] + q[1]); }); /* (off to the next coil as soon as the last soak is done) */
      busy[gi] = land + 0.3; if (d === 'h' || myth) G[gi].forEach((id) => k.ring({ on: id, r: 2, fx: 'debuff', t0: land + 0.1, dur: 5, color: '#b06bff', cn: 'Soul Constrictor', legend: 'Soul Constrictor: you can\'t help with the next coil for 5 seconds' }));
      if (fail && n === 1) { gdzFailBlast(k, land + 0.2, 'Group one again: they don\'t count', 0, 30, ['h3', 'r6'], 'Spectral Coils'); }
      t += myth ? 2.4 : 2.9; });
    if (fail) { k.step(0.2).step(2.4).step(2.4 + (myth ? 2.4 : 2.9) + 2.8); k.pause(2.4 + (myth ? 2.4 : 2.9) + 3.2, 'Group one went for the second coil too. Soul Constrictor means they don\'t count, so it hit everyone almost unsoaked.', { x: SP(ORD[1])[0], y: SP(ORD[1])[1], r: 9 });
      return k.done({ title: 'Mistake: one group takes two in a row', focus: { x: 0, y: 0, r: 46 } }); }
    const END = t + 5, gOf = (id) => G.findIndex((g) => g.includes(id)); Object.keys(UX_HOME).forEach((id, i) => { const q = gdzSpot(i, 20, 7), dm = nzAdd([0, 0], 300, 12), gi = gOf(id); k.hold(gi >= 0 ? busy[gi] : 0, id).at(END, id, dm[0] + q[0], dm[1] + q[1]); });
    k.call(END - 1.6, END + 0.4, 'Toward diamond, on the inside', { x: 8, y: -24, color: '#7fd8ff', ink: '#06131c' });
    k.ring1(G[0]).step(0.2).step(2.4).step(2.4 + (myth ? 2.4 : 2.9)).step(END - 1);
    k.pause(4.8, myth ? 'Three groups: each knows its three coils from the first one\'s marker. Into it, out, and on to your next.' : 'Two groups take turns: group one the first coil, group two the next, and so on. Healers stay in the middle.', { x: 0, y: 0, r: 30 });
    return k.done({ title: myth ? 'The intermission: three groups take turns' : 'The intermission: two groups take turns', focus: { x: 0, y: 0, r: 46 }, hlLabel: 'group one' });
  },
});

// ---- Phase three: the four quarters (counter-clockwise: north-east, north-west, south-west, south-east, as on our kill). Melee and tanks on
// her quarter; healers at the near edge of the next quarter counter-clockwise, ranged on its far side.
const UX_NEXT = { NE: 'NW', NW: 'SW', SW: 'SE', SE: 'NE' };
function uxP3(k, t, q, hold, skip) {
  const s = new Set(skip || []), b = UL_PB[q], c = UL_PL[q], n = UX_NEXT[q], cn = UL_PC[n], nn = UL_PL[n], one = (id, p) => { if (s.has(id)) return; if (hold != null) k.hold(hold, id); k.at(t, id, p[0], p[1]); };
  one('t1', [c[0] + (b[0] - c[0]) * 0.6, c[1] + (b[1] - c[1]) * 0.6]); one('t2', [c[0] + (b[0] - c[0]) * 0.35 + 4, c[1] + (b[1] - c[1]) * 0.35 - 4]);
  UX_MEL.forEach((id, i) => { const g = gdzSpot(i, 7, 6.2); one(id, [c[0] + g[0], c[1] + g[1]]); });
  const near = [nn[0] + (c[0] - nn[0]) * 0.25, nn[1] + (c[1] - nn[1]) * 0.25]; ['h1', 'h2', 'h3', 'h4'].forEach((id, i) => { const g = gdzSpot(i, 4, 4.8); one(id, [near[0] + g[0], near[1] + g[1]]); });
  ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'].forEach((id, i) => { const g = gdzSpot(i, 7, 6.2); one(id, [cn[0] + g[0], cn[1] + g[1]]); });
  return k;
}
const uxB3 = (k, t, q) => k.boss('ul', UX, t || 0, UL_PB[q][0], UL_PB[q][1]);
Object.assign(UX_M, {
  // Circling Prey: she smashes the quarter she's on: a huge hit and a knockback within 13 yards, a smaller hit on everyone else. Everyone
  // moves one quarter counter-clockwise before it lands (personal defensives for the second and third), and she comes up at the next corner.
  // (fail: a melee stays on her quarter)
  prey(fail, d, o) {
    o = o || {}; const q = o.q || 'NE', n = UX_NEXT[q], L = 12, k = gdzKit(UX, L); k.art(0, UL_BROKEN); uxB3(k, 0, q); uxP3(k, 0, q);
    k.cast('ul', 'Circling Prey', 0.6, 8.2); k.ring({ x: UL_PC[q][0], y: UL_PC[q][1], r: 22, fx: 'zone', t0: 0.6, dur: 7.8, color: '#ff4a4a', fill: 'rgba(255,60,60,.12)', cn: 'Circling Prey', legend: 'Circling Prey: this quarter is destroyed' });
    uxP3(k, 6.6, n, 1.2, fail ? ['m4'] : null); k.call(1.4, 4, 'Move counter-clockwise', { x: UL_PC[n][0], y: UL_PC[n][1] + 10, color: '#ffd23b', ink: '#1a1405' });
    k.ring({ x: UL_PB[q][0], y: UL_PB[q][1], r: 13, fx: 'burst', t0: 7.9, at: 8.2, dur: 0.7, color: '#ff4a4a', cn: 'Circling Prey', legend: 'a huge hit and a knockback within 13 yards' });
    k.ring({ x: 0, y: 0, r: 80, fx: 'burst', t0: 8, at: 8.3, dur: 0.5, color: '#c8a36a', cn: 'Circling Prey', legend: 'a smaller hit on everyone else' });
    uxB3(k, 8.4, q); k.boss('ul', UX, 9.6, UL_PB[n][0], UL_PB[n][1]);
    if (fail) { k.oops('m4', 8.4); k.call(8.3, 10, 'Still on the quarter: dead', { on: 'm4', color: '#ff3b3b', ink: '#fff' }); k.step(0.6).step(1.4).step(8.2);
      k.pause(8.6, 'This melee kept hitting her instead of moving. The quarter went with them in it.', { on: 'm4', r: 9 });
      return k.done({ title: 'Mistake: still on her quarter', focus: { x: 0, y: 6, r: 40 }, art: UL_BROKEN }); }
    k.step(0.6).step(1.4).step(8.2).step(9.6);
    k.pause(4.6, 'Everyone shifts one quarter counter-clockwise: melee onto the next quarter, healers and ranged onto the one after.', { x: 0, y: 6, r: 34 });
    return k.done({ title: 'Circling Prey: one quarter counter-clockwise', focus: { x: 0, y: 6, r: 40 }, art: UL_BROKEN });
  },
  // Serpent's Bite: a melee, a ranged and a healer each get a 7-yard circle and a 15-second venom; when it ends they turn to stone and die
  // (Heroic and up the corpse also hurts the whole raid every second). Players inside the circle leech the venom away, then their Volatile
  // Purge erupts 5 seconds later: spread out at once. Mythic: the fewest soakers that clear it (target plus four, assigned), a big defensive
  // for the 2-million hit as it ends, and the waves each soaker then sends must go away from the raid. (fail: a circle left alone)
  bite(fail, d, o) {
    o = o || {}; const myth = d !== 'h', q = o.q || 'NE', n = UX_NEXT[q], TE = 11.4, L = TE + 7.4, k = gdzKit(UX, L); k.art(0, UL_BROKEN); uxB3(k, 0, q); uxP3(k, 0, q); /* (TE: when the venom ends) */
    k.cast('ul', 'Serpent\'s Bite', 0.2, 1.4);
    // (Mythic: the targets stack 12 yards in from her, toward the middle; the three soakers stand inside all three circles at once)
    const B = UL_PB[q], bd = Math.hypot(B[0], B[1]) || 1, ST = [B[0] - B[0] / bd * 12, B[1] - B[1] / bd * 12];
    const RED = myth ? [['m3', []], ['h2', []], ['r6', []]] : [['m3', ['t2', 'm1', 'm2', 'm5', 'm6', 'm7']], ['h2', ['h1', 'h3', 'h4', 'r1', 'r2']], ['r6', ['r3', 'r4', 'r5', 'r7']]], SO = ['r3', 'r4', 'r5'];
    RED.forEach(([id], j) => { k.ring({ on: id, r: 7, fx: 'soak', t0: 1.4, at: TE, dur: TE - 1.2, color: '#ff4a4a', cn: 'Serpent\'s Bite', legend: 'Serpent\'s Bite: stand in it to leech the venom before it ends' });
      if (myth && !(fail && j === 2)) { const g = gdzSpot(j, 3, 2.6); k.hold(1.6, id).at(7.6, id, ST[0] + g[0], ST[1] + g[1]); } });
    if (myth) { SO.forEach((s, i) => { const g = gdzSpot(i, 3, 2.6); k.hold(1.8, s).at(8, s, ST[0] + g[0] + 0.8, ST[1] + g[1] - 0.8); }); k.call(TE - 1.2, TE + 0.4, 'Big defensive', { on: 'r3', color: '#5aa0ff', ink: '#fff' }); }
    else RED.forEach(([id, so], j) => { if (fail && j === 2) return; const c = k.posAt(id, 1.4); so.forEach((s, i) => { const g = gdzSpot(i + 1, so.length + 1, 4.4); k.hold(1.6, s).at(4, s, c[0] + g[0], c[1] + g[1]); }); });
    // (the purge: everyone who soaked spreads out; on Mythic each sends a wave out, so they walk toward the venom and aim it away from the raid)
    const PS = myth ? SO : RED.filter((_, j) => !(fail && j === 2)).flatMap(([id, so]) => so.concat(id));
    PS.forEach((s, i) => { k.ring({ on: s, r: 2.2, fx: 'debuff', t0: TE, dur: 5, color: '#ff8a3b', cn: 'Volatile Purge', legend: 'Volatile Purge: it erupts in 5 seconds: spread out' });
      const p = k.posAt(s, TE), a = Math.atan2(p[1], p[0]) * 180 / Math.PI + (myth ? (i - 1) * 28 : (i % 6) * 60), g = nzAdd(p, a, myth ? 8 : 6.5); k.hold(TE + 0.2, s).at(TE + 4.2, s, g[0], g[1]);
      k.ring({ on: s, r: 4, fx: 'burst', t0: TE + 4.7, at: TE + 5, dur: 0.6, color: '#ff8a3b', cn: 'Volatile Purge', legend: 'Volatile Purge erupting round the soaker' });
      if (myth) k.wave({ x: g[0], y: g[1], deg: a, v: 14, w: 5, d: 3, t0: TE + 5, t1: TE + 6.8, color: '#9be13a', legend: 'Mythic: a wave from each soaker: aimed away from the raid' }); });
    k.call(TE + 0.2, TE + 2.6, 'Spread!', { x: UL_PC[n][0], y: UL_PC[n][1] + 12, color: '#ff8a3b', ink: '#1a0a04' });
    if (fail) { k.oops('r6', TE + 0.2); k.call(TE + 0.1, TE + 2.1, 'Turned to stone', { on: 'r6', color: '#ff3b3b', ink: '#fff' }); gdzFailBlast(k, TE + 1.2, 'Calcified Corpse: damage on everyone', 0, -2, ['h4'], 'Calcified Corpse'); k.step(0.2).step(1.4).step(TE);
      k.pause(TE + 1.4, myth ? 'This ranged didn\'t stack with the other two targets, so no soaker stood in their circle. The venom ran out: they turned to stone, and the corpse hurts the whole raid every second.' : 'Nobody stood in this ranged\'s circle. The venom ran out: they turned to stone, and the corpse hurts the whole raid every second.', { on: 'r6', r: 9 });
      return k.done({ title: 'Mistake: a red circle left alone', focus: { x: -6, y: 18, r: 34 }, art: UL_BROKEN, badLabel: 'turned to stone' }); }
    k.ring1(myth ? RED.map(([id]) => id).concat(SO) : RED.map(([id]) => id)).step(0.2).step(1.4).step(myth ? 8 : 4).step(TE + 0.2);
    k.pause(myth ? 8.4 : 4.4, myth ? 'The three targets stack on one spot and the three assigned soakers stand on it: inside all three circles at once.' : 'Each group soaks its own red circle: melee on her quarter, healers and ranged on the next.', { x: myth ? ST[0] : -6, y: myth ? ST[1] : 18, r: myth ? 12 : 30 });
    return k.done({ title: myth ? 'Serpent\'s Bite: three soakers, stacked' : 'Serpent\'s Bite: soak, then spread', focus: { x: -6, y: 18, r: 34 }, art: UL_BROKEN, hlLabel: myth ? 'the targets and their soakers' : 'the three red circles' });
  },
  // Call of the Serpent in phase three. Heroic: a Blightscale Clutch lands on every quarter: break each (weak Rawlings) or it hatches a
  // Blightscale Shrieker (kick Vicious Echoes, a raid stun; its Acidic Expulsion stacks a raid DoT). Mythic: Slithering Clutches crawl toward
  // the venom: the two Death Knights grip them in, quarter to quarter, then Gorefiend's Grasp onto the raid to cleave them.
  // (fail: one reaches the venom and hatches a Shrieker)
  clutches(fail, d, o) {
    o = o || {}; const myth = d !== 'h', q = o.q || 'NE', L = 13, k = gdzKit(UX, L); k.art(0, UL_BROKEN); uxB3(k, 0, q); uxP3(k, 0, q);
    k.cast('ul', 'Call of the Serpent', 0.2, 1.6); const OTH = ['NW', 'SW', 'SE'].filter((x) => x !== q).concat(q === 'NE' ? [] : ['NE']).slice(0, 3), C = UL_PL[q];
    const SP = { NW: [-30, 18], SW: [-30, -22], SE: [24, -30], NE: [24, 20] };
    if (!myth) { [q].concat(OTH.slice(0, 2)).forEach((x, i) => { const p = i ? SP[x] : [C[0] - 8, C[1] - 8]; k.add('cl' + i, 'Blightscale Clutch', 2, p[0], p[1]).show('cl' + i, 2, fail && i === 2 ? 7 : 6.6 + i * 0.5);
      if (!(fail && i === 2)) k.add('rw' + i, 'Blightscale Rawling', 6.6 + i * 0.5, p[0] + 1, p[1]).show('rw' + i, 6.6 + i * 0.5, L); });
      k.call(2.2, 4.6, 'Break every clutch', { x: 0, y: 4, color: '#c9d98a', ink: '#141006' });
      if (fail) { const p = SP[OTH[1]]; k.add('sh', 'Blightscale Shrieker', 7, p[0], p[1]); k.cast('sh', 'Vicious Echoes', 9, 11.5); gdzFailBlast(k, 11.6, 'Vicious Echoes: everyone stunned', 0, 4, ['h1'], 'Vicious Echoes'); k.step(0.2).step(2).step(7);
        k.pause(11.8, 'Nobody broke the clutch on the far quarter. It hatched a Shrieker, and nobody was there to kick its Vicious Echoes.', { x: p[0], y: p[1], r: 9 });
        return k.done({ title: 'Mistake: a clutch left to hatch', focus: { x: 0, y: 2, r: 44 }, art: UL_BROKEN }); }
      k.ring1([]).step(0.2).step(2).step(6.6); k.pause(4, 'A clutch lands on every quarter: the nearest group breaks each one before it hatches.', { x: 0, y: 2, r: 30 });
      return k.done({ title: 'Call of the Serpent: break every clutch', focus: { x: 0, y: 2, r: 44 }, art: UL_BROKEN }); }
    // Mythic: grips, quarter to quarter, then Gorefiend's Grasp
    const A = SP[OTH[0]], B2 = SP[OTH[2]], F = SP[OTH[1]], G1 = 't1', G2 = 't2', R = [C[0] - 7, C[1] - 6];
    const crawl = (id, p, t1, gp, tg) => { const v = [p[0], p[1]], dd = Math.hypot(v[0], v[1]) || 1, e = [p[0] + v[0] / dd * 6, p[1] + v[1] / dd * 6]; k.add(id, 'Slithering Clutch', 2, p[0], p[1]).add(id, 'Slithering Clutch', t1, e[0], e[1]); if (gp) k.add(id, 'Slithering Clutch', t1 + 0.4, gp[0], gp[1]); return e; };
    crawl('c1', A, 4, [R[0] + 2, R[1]]); k.call(4, 5.4, 'Grip', { on: G1, color: '#c0394f', ink: '#fff' });
    crawl('c2', B2, 4.6, [R[0] - 2, R[1] + 1]); k.call(4.6, 6, 'Grip', { on: G2, color: '#c0394f', ink: '#fff' });
    const fe = crawl('c3', F, fail ? 9 : 5.6, fail ? null : [B2[0], B2[1]]);
    if (fail) { k.add('sh', 'Blightscale Shrieker', 9.2, fe[0], fe[1]); k.show('c3', 2, 9.2); k.call(9.2, 11, 'Reached the venom: a Shrieker', { x: fe[0], y: fe[1] + 6, color: '#ff3b3b', ink: '#fff' }); k.step(0.2).step(4).step(9.2);
      k.pause(9.6, 'The far clutch was never gripped. It crawled into the venom and hatched a Blightscale Shrieker.', { x: fe[0], y: fe[1], r: 9 });
      return k.done({ title: 'Mistake: a clutch reaches the venom', focus: { x: 0, y: 2, r: 44 }, art: UL_BROKEN }); }
    k.call(5.6, 7, 'Grip to the near quarter', { on: G2, color: '#c0394f', ink: '#fff' }); k.add('c3', 'Slithering Clutch', 7.4, B2[0], B2[1]).add('c3', 'Slithering Clutch', 7.8, R[0], R[1] - 2); k.call(7.4, 8.8, 'Grip again', { on: G1, color: '#c0394f', ink: '#fff' });
    k.ring({ x: R[0], y: R[1], r: 8, fx: 'burst', t0: 8.4, at: 8.8, dur: 0.7, color: '#c0394f', cn: 'Gorefiend\'s Grasp', legend: 'Gorefiend\'s Grasp: every clutch pulled onto the raid to cleave' });
    ['c1', 'c2', 'c3'].forEach((id, i) => { k.add(id, 'Slithering Clutch', 9, R[0] + (i - 1) * 1.6, R[1]); k.show(id, 2, 11 + i * 0.3); });
    k.ring1([G1, G2]).step(0.2).step(4).step(5.6).step(8.8);
    k.pause(6.2, 'The Death Knights grip each clutch in before it reaches the venom: the far one to the near quarter first, then onto the raid.', { x: 0, y: 2, r: 30 });
    return k.done({ title: 'Slithering Clutches: grip them in', focus: { x: 0, y: 2, r: 44 }, art: UL_BROKEN, hlLabel: 'the two Death Knights' });
  },
});
const UX_FAIL = {
  eggsH: { name: 'An egg left on the floor', what: 'Nobody picks up one egg: her waves roll over it and it hatches a Viper, with Putrid Membrane on the whole raid.', do: ['The eggs land.', 'One is left.', 'A wave hatches it.'], map: () => UX_M.eggs(true, 'h') },
  eggsM: { name: 'Two carriers touch', what: 'Two egg carriers drift within 3 yards: the egg hatches at once, a Viper, and Putrid Membrane on the raid.', do: ['Shells broken, eggs picked up.', 'Two carriers drift together.', 'It hatches.'], map: () => UX_M.eggs(true, 'm') },
  coils: { name: 'Nobody in the second coil', what: 'Everyone piles into the first circle; Soul Constrictor stops them helping with the second, which hits everyone almost unsoaked.', do: ['The coils rise.', 'Everyone soaks the first.', 'The second hits the raid.'], map: (d) => UX_M.coils(true, d) },
  waves: { name: 'On the side that goes first', what: 'A player stays on the half her wing points to: the first wave rolls over them, a huge stacking DoT.', do: ['Her wing goes back.', 'One player stays.', 'Hit.'], map: (d) => UX_M.waves(true, d) },
  wrath: { name: 'Her tank out of reach', what: 'Her tank doesn\'t get back into the red circle: every bite goes out to the whole raid.', do: ['The knockback.', 'The tank stays out.', 'The raid takes the bites.'], map: (d) => UX_M.wrath(true, d) },
  thrash: { name: 'Inside the sweep', what: 'A ranged stays within 35 yards of the tail: the full hit and a knockback.', do: ['The tail winds up.', 'One stays inside.', 'Hit and knocked back.'], map: (d) => UX_M.thrash(true, d) },
  wretch: { name: 'Outside the Wretch\'s bubble', what: 'An egg carrier stays out by their zone: Fester Burst hits everyone farther than 10 yards.', do: ['The Wretch lands.', 'The off tank soaks its venom.', 'Outside the bubble: hit.'], map: (d) => UX_M.wretch(true, d) },
  heart: { name: 'Under the falling debris', what: 'A player doesn\'t look down: Falling Debris one-shots anyone inside its 7 yards.', do: ['The heart opens.', 'Raid damage.', 'Under the debris: dead.'], map: (d) => UX_M.heart(true, d) },
  warden: { name: 'A Malice not kicked', what: 'Nobody kicks the Warden\'s Malice: a big hit on everyone every second for 6 seconds.', do: ['The half gates over.', 'The Warden gestates eggs.', 'Malice goes off.'], map: (d) => UX_M.warden(true, d) },
  fangsH: { name: 'Everyone snaps at once', what: 'All three tethers snap together: three stacks of Blight Vein on everyone at the same moment.', do: ['Fangs on three players.', 'They walk out.', 'All snap at once.'], map: () => UX_M.fangs(true, 'h') },
  fangsM: { name: 'The five snap one by one', what: 'After the solo snap, the five snap one after another instead of together: extra ticks of every Blight Vein.', do: ['Fangs on six players.', 'One solo snap.', 'The five snap late.'], map: () => UX_M.fangs(true, 'm') },
  doomscales: { name: 'The Doomscale Egg too late', what: 'The big egg stays out too long: its Hatching Doom ends and the Ravenous Doomscale\'s Dread Roar stuns everyone for 20 seconds.', do: ['Small eggs in.', 'The big egg waits.', 'Dread Roar: a wipe.'], map: (d) => UX_M.doomscales(true, d) },
  intcoils: { name: 'One group takes two in a row', what: 'Group one goes for the second coil too: Soul Constrictor means they don\'t count, so it hits almost unsoaked.', do: ['Coils round the room.', 'Group one again.', 'An unsoaked hit.'], map: (d) => UX_M.intcoils(true, d) },
  prey: { name: 'Still on her quarter', what: 'A melee keeps hitting her instead of moving: the quarter is destroyed with them on it.', do: ['She winds up.', 'One melee stays.', 'Dead.'], map: (d) => UX_M.prey(true, d) },
  bite: { name: 'A red circle left alone', what: 'Nobody stands in one Serpent\'s Bite circle: its target turns to stone and the corpse hurts the whole raid every second.', do: ['Three red circles.', 'One has no soakers.', 'Stone.'], map: (d) => UX_M.bite(true, d) },
  clutchesH: { name: 'A clutch left to hatch', what: 'Nobody breaks the far quarter\'s clutch: it hatches a Shrieker, and nobody kicks its Vicious Echoes.', do: ['Clutches on every quarter.', 'One is left.', 'A Shrieker, unkicked.'], map: () => UX_M.clutches(true, 'h') },
  clutchesM: { name: 'A clutch reaches the venom', what: 'The far clutch is never gripped: it crawls into the venom and hatches a Shrieker.', do: ['Clutches crawl.', 'Two gripped.', 'The far one reaches the venom.'], map: () => UX_M.clutches(true, 'm') },
};

// ---- Ula'tek's whole fight, on the top Mythic kills' clock (three top kills and a fourth guild agree to about a second)
const UX_BEATS = {
  start: { name: 'The pull', do: ['She rises at the north edge, her tail on the west side. The carriers stand in their zones; on Mythic the off tank heads for the spectral image.'],
    run() { const k = gdzKit(UX, 2.5); k.art(0, UL_FULL); uxBoss(k, 0); uxTail(k, 0); uxHome(k, 0, null, UX_CAR); UX_CAR.forEach((id) => k.at(0, id, UX_ZONE[id][0], UX_ZONE[id][1])); k.step(0.2); } },
  dive: { name: 'She dives (Watch the bubbles)', do: ['After her first waves she dives and comes up at the west edge, where the bubbles rise. Her tank gets there first: an empty melee range hits the whole raid.'],
    run() { const k = gdzKit(UX, 9.4); k.art(0, UL_FULL); uxBoss(k, 0); uxTail(k, 0); uxHome(k, 0); k.cast('ul', 'Submerge', 0.4, 1.6); uxBoss(k, 1.6); uxBoss(k, 8.8, [-46, -1]);
      k.ring({ x: -44, y: -1, r: 5, fx: 'zone', t0: 1.6, dur: 7.4, color: '#7fd8ff', fill: 'rgba(127,216,255,.2)', cn: 'Bubbles', legend: 'bubbles where she comes up' });
      k.hold(0.6, 't1').at(8.4, 't1', -39, -1); k.call(1.8, 6, 'Tank: to the bubbles', { on: 't1', color: '#5aa0ff', ink: '#fff' }); k.step(0.2); } },
  kill: { name: 'The kill', do: ['Rage of the Shackled one last time: burn the heart. If she\'s at 1 or 2% as it ends, jump off behind her to live a few seconds longer.'],
    run() { const k = gdzKit(UX, 4); k.art(0, UL_BROKEN); uxB3(k, 0, 'SE'); k.cast('ul', 'Rage of the Shackled', 0, 1.5); k.add('ht', 'Venomous Heart', 1.5, UL_PB.SE[0] * 0.85, UL_PB.SE[1] * 0.85).show('ht', 1.5); uxP3(k, 0, 'SE'); k.step(0.2); } },
};
const UX_SIM = [
  { at: 0, beat: 'start', ph: 0 }, { at: 1, mech: 'eggs', ph: 0, label: 'Call of the Serpent 1' }, { at: 3, mech: 'wretch', ph: 0, label: 'Blightscale Wretch 1' },
  { at: 22, mech: 'wrath', ph: 0, label: 'Mother\'s Wrath 1' }, { at: 36, mech: 'coils', ph: 0, label: 'Spectral Coils 1' },
  { at: 50, mech: 'waves', ph: 0, label: 'Caustic Waves 1 (Go to the other half)' }, { at: 71, mech: 'eggs', ph: 0, label: 'Call of the Serpent 2 (Eight more)' },
  { at: 72, mech: 'wretch', ph: 0, label: 'Blightscale Wretch 2' }, { at: 77, beat: 'dive', ph: 0 },
  { at: 92, mech: 'wrath', ph: 0, label: 'Mother\'s Wrath 2', o: { rot: 90 } }, { at: 107, mech: 'waves', ph: 0, label: 'Caustic Waves 2 (The hardest set)', o: { rot: 90 } },
  { at: 130, mech: 'coils', ph: 0, label: 'Spectral Coils 2', o: { rot: 90 } }, { at: 139, mech: 'heart', ph: 0, label: 'Rage of the Shackled 1 (Burn the heart)', o: { rot: 90 } },
  { at: 173, mech: 'warden', ph: 1 }, { at: 195, mech: 'fangs', ph: 1 }, { at: 240, mech: 'doomscales', ph: 1 }, { at: 288, mech: 'heart2', ph: 1 },
  { at: 319, mech: 'intcoils', ph: 2 },
  { at: 377, mech: 'clutches', ph: 3, label: 'Slithering Clutches 1 (Grip them in)', o: { q: 'NE' } }, { at: 397, mech: 'bite', ph: 3, label: 'Serpent\'s Bite 1', o: { q: 'NE' } },
  { at: 407, mech: 'clutches', ph: 3, label: 'Slithering Clutches 2', o: { q: 'NE' } }, { at: 432, mech: 'prey', ph: 3, label: 'Circling Prey 1', o: { q: 'NE' } },
  { at: 461, mech: 'bite', ph: 3, label: 'Serpent\'s Bite 2', o: { q: 'NW' } }, { at: 483, mech: 'prey', ph: 3, label: 'Circling Prey 2 (Gate to the third quarter)', o: { q: 'NW' } },
  { at: 505, mech: 'clutches', ph: 3, label: 'Slithering Clutches 3 (Two grips, two Shriekers)', o: { q: 'SW' } }, { at: 544, mech: 'prey', ph: 3, label: 'Circling Prey 3 (The last quarter)', o: { q: 'SW' } },
  { at: 565, mech: 'bite', ph: 3, label: 'Serpent\'s Bite 3 (The last set)', o: { q: 'SE' } }, { at: 577, beat: 'kill', ph: 3 },
];
// (how long each part lasts on the real clock, for the written version's overlaps; how bad a miss is: 3 can wipe, 2 can kill, 1 minor)
const UX_DUR = { 'm:eggs': 43, 'm:wretch': 66, 'm:wrath': 8, 'm:coils': 8, 'm:waves': 21, 'm:thrash': 6, 'm:heart': 26, 'm:warden': 22, 'm:fangs': 15, 'm:doomscales': 49, 'm:heart2': 26, 'm:intcoils': 56, 'm:clutches': 14, 'm:bite': 20, 'm:prey': 11, 'b:start': 2, 'b:dive': 9, 'b:kill': 0 };
const UX_SEV = { 'm:eggs': 3, 'm:wretch': 2, 'm:wrath': 1, 'm:coils': 2, 'm:waves': 3, 'm:thrash': 1, 'm:heart': 2, 'm:warden': 2, 'm:fangs': 3, 'm:doomscales': 3, 'm:heart2': 2, 'm:intcoils': 3, 'm:clutches': 3, 'm:bite': 3, 'm:prey': 2, 'b:start': 1, 'b:dive': 2, 'b:kill': 1 };
GDZ['Ula\'tek'] = {
  upd: ['12.1', 'Oct 21, 2026'],
  stepRoles: {
    'Call of the Serpent (Break, carry, spread)': ['', 'd', 'd', 'd'], 'Blightscale Wretch (Soak its venom, then the bubble)': ['', 't', '', ''],
    'Mother\'s Wrath (Run back in)': ['t', 't', 't', 't'], 'Mephitic Thrash (Get 35 yards away)': ['', '', ''],
    'Doomscale Warden (Pull it across, cleave, kick)': ['', 't', '', 'd'], 'Grasping Fangs (One break, then five together)': ['', '', 'd', 'h'],
    'Slithering Clutches (Grip them in)': ['', 't', 't', 't'], 'Serpent\'s Bite (Three soakers, stacked)': ['', '', 'h', ''],
  },
  sum: 'A long fight on a set clock. Phase 1: carry eggs, soak the coils, dodge her waves, burn her heart. Phase 2: the raid splits onto the two side ledges. Then the platform shatters and the last phase moves from quarter to quarter.',
  // (the Mythic guide credits its source by name (your call, Oct 20): a name only, never a link out)
  m: { sim: UX_SIM, simDur: UX_DUR, simSev: UX_SEV, beats: UX_BEATS, simBands: [{ t0: 10, t1: 44, n: 8, text: '8 eggs', title: '8 eggs carried' }, { t0: 82, t1: 138, n: 8, text: '8 eggs', title: '8 eggs carried' }],
    simAlways: ['Egg carriers: your 3-yard ring never touches another carrier\'s, you never take a wave, and you never die holding an egg.', 'Her waves come out of her, half the platform at a time: go to the other half, then cross behind the first wave.'],
    source: 'Tactyks\' Mythic Ula\'tek guide and first-kill video', sum: 'Eggs have shells, and carriers have 3-yard rings that must never touch. A Wretch add makes a bubble everyone stands in, four Doomscales need kicks, the intermission takes three soak groups, and the last phase needs grips. Tuned on Oct 6, so it is easier than the video: softer coils, tethers and tail waves, and Serpent\'s Bite needs only three soakers. This follows a plan that killed it; your raid may set its own zones and markers.',
    roles: {
      t: ['Phase 1: the off tank soaks the spectral venom (waves off the platform), then takes the tail and the Wretch; the boss tank runs back in after Mother\'s Wrath. Never two Mother\'s Wraths in a row.', 'She dives at 1:17: her tank waits at the bubbles.', 'Phase 2: pull the Warden across the line so it teleports to the eggs; grab both Doomscales and bring them back.', 'Phase 3: the two Death Knights grip the clutches quarter by quarter and Gorefiend\'s Grasp them; tanks soak two of the three red sets.'],
      h: ['Phase 1: raid cooldowns just before the first coil slam; the brown circles in the heart burn kill in one hit.', 'Phase 2: the five-player tether break needs Anti-Magic Zone and Rallying Cry, plus Spirit Link or Darkness.', 'Intermission: personals and potions around 5:50 for the back-to-back slams.', 'Phase 3: the three red soakers take about 2 million each as it ends, then a big DoT: externals on them.'],
      d: ['Phase 1: 8 carriers in their zones, rings never touch; the egg-damage players break the shells. An immunity won\'t save your egg from a wave.', 'Phase 1: the whole raid in the bubble on the first coil circle, carriers rings apart, then into the second circle.', 'Phase 2: one mobile ranged breaks their tether alone, then five break together 4 seconds later.', 'Phase 3: the assigned soakers stand on the stacked reds, then aim their waves away from the raid.'],
    } },
  facts: [['Phases', '3 + intermission'], ['Healers', '4', 'm'], ['Fight length', 'About 9:45, on a set clock'], ['Bloodlust', 'First heart burn', 'h'], ['Bloodlust', 'Second heart burn', 'm'], ['Hardest part', 'Eggs and waves', 'h'], ['Hardest part', 'Phase 1', 'm']],
  phases: [
    { id: 'p1', name: 'Phase 1: Fury of the Serpent Mother', sum: 'She rises at the north edge with her tail beside her. Carry the eggs, soak the coils, dodge her waves, then burn her heart.',
      m: { sum: 'Two rounds of 8 eggs (0:01 and 1:11), two Wretches, two coil soaks, two big wave sets with a dive between them, then the heart at 2:25. The hardest part of the fight.' },
      mechs: [
        { id: 'eggs', fail: UX_FAIL.eggsH, name: 'Call of the Serpent (Carry the eggs)', spell: 'Call of the Serpent', what: 'Eggs crash down around the platform. Let one touch venom (a wave, the water, or a carrier dying) and a deadly Viper hatches. Carry them until a coil soak breaks them: then only a weak Rawling comes out.',
          do: ['Eggs incoming: step out of the impact circles.', 'Each carrier walks to the egg in their zone.', 'Pick it up: carrying it hurts a little over time.', 'Keep it away from venom until a coil soak breaks it.'],
          plan: ['On the pull, the first egg anyone touches pulls her: pick up the three starting eggs together.', 'Dying with an egg, or taking a wave while carrying one, hatches a Viper: kill it at once.', 'An immunity keeps you alive in a wave, but the egg still hatches.'],
          m: { fail: UX_FAIL.eggsM, name: 'Call of the Serpent (Break, carry, spread)', what: 'Eight eggs crash down at random, twice in phase 1. Each one has a shell to break first, and carrying one puts a 3-yard ring on you. If two carriers\' rings touch, a Viper hatches.',
            do: ['Eggs incoming: step out of the impact circles.', 'The egg-damage players (two Balance Druids, or Balance and Shadow) break the shells.', 'Carriers: grab the egg in your zone; zones turn with her. Mages take the far left and far right.', 'Your ring is 3 yards: never let it touch another carrier\'s.'],
            plan: ['Pick 8 carriers and backups, no more than 2 or 3 melee. Each owns an area set by which way she faces, not by the floor markers.', 'Breaking an egg gives Rancid Yolk for 20 seconds; picking up another while it\'s on you kills you, so let it drop first.', 'Dying with an egg, or taking a wave while carrying one, hatches a Viper. An immunity keeps you alive, but the egg still hatches.', 'Second egg set (1:11): the bubble comes before the waves; melee take their eggs before it, ranged after.'] },
          map: (d, o) => UX_M.eggs(false, d, o) },
        { id: 'wretch', only: 'm', fail: UX_FAIL.wretch, name: 'Blightscale Wretch (Soak its venom, then the bubble)', spell: 'Fester Burst', what: 'An add at 0:03 and 1:12 (and again in phase 3). A spectral Ula\'tek at the edge pours venom at it; the off tank steps into that stream instead. About every 34 seconds it makes a 10-yard bubble and blasts everyone outside it.',
          do: ['The Wretch lands where the Toxic Womb was.', 'Off tank: stand in the spectral venom with a defensive, and aim its waves off the platform.', 'Fester Burst: everyone inside its 10 yards, carriers too, rings apart.', 'Kill it before its third bubble.'],
          plan: ['The tail comes up on the same side as the spectral image, so you know early where the soaks will be.', 'Its enrage only adds tank damage: kill it between its second and third bubble. Kill the old Wretch as the new one lands.', 'First bubble: on the first coil circle, whole raid in it. Second bubble: after the second eggs, in the middle by her.'],
          map: (d, o) => UX_M.wretch(false, d, o) },
        { id: 'coils', fail: UX_FAIL.coils, name: 'Spectral Coils (Two groups, two circles)', spell: 'Spectral Coils', what: 'Two coils rise at the edge by her tail and slam one after the other, about 3 seconds apart. Everyone within 10 yards of a slam shares it. Soul Constrictor stops a soaker helping with the next one for 5 seconds, so two groups.',
          do: ['The tail comes up at the edge; its tank stays on it.', 'Facing the tail, the right-hand coil slams first: group one in it.', 'It slams: carried eggs break into weak Rawlings. Kill them.', 'Group two takes the second slam.'],
          plan: ['Raid cooldowns right before the first slam: Spirit Link, Darkness, Anti-Magic Zone.', 'Never take a wave to reach a soak: take the other one instead.'],
          m: { what: 'First set: the Wretch\'s bubble goes up on the first circle and the carriers take that slam inside it; group two takes the second. Second set: the carriers split between the circles, and right after both slams the bubble goes up between them.',
            plan: ['Outside the Wretch\'s bubble is a big hit and a DoT; the tanks decide where it goes by where they hold the Wretch.', 'Second set (2:11): carrying 8 eggs through her waves into the double slam is the hardest moment of phase 1. A wave is always coming: keep dodging in your soak.', 'Rawlings are padding for the burn: no careless AoE, keep them to the side of the boss.'] },
          map: (d, o) => UX_M.coils(false, d, o) },
        { id: 'waves', fail: UX_FAIL.waves, name: 'Caustic Waves (Go to the other half)', spell: 'Caustic Waves', note: 'Which half she starts on changes every pull, so someone calls it. The map shows one way it can go.', what: 'She pulls one wing back and waves of venom roll across that half of the platform, then the other half a few seconds later; her tail sends waves of its own. A hit is a huge stacking poison, and it hatches a carried egg.',
          do: ['Her wing goes back: that half goes first. Go to the other half.', 'Her waves roll over the first half.', 'Cross behind the first wave before the second half goes.', 'Stay out until it has rolled past. Carrying an egg? A hit hatches it.'],
          m: { name: 'Caustic Waves (The lane steps across, Mages Blink)', what: 'The second set at 1:47 is the hardest moment of the fight: eggs out, her waves and the tails\' waves at once, with carriers who must not touch. A wave kills unless you have a big defensive up.',
            do: ['The caller says which half she starts on. The lane steps to the other half together, rings apart.', 'Her first half rolls; small tails rise at the corners and fire a moment later: step out of their paths.', 'Her other half next: the lane crosses back behind her first wave. Mages at the sides Blink back over it.', 'Ten seconds later two more tails fire from the edges.'],
            plan: ['Mages make the best outer carriers: they Blink over a wave when there\'s no room. Two Evokers\' Time Spiral helps them.', 'Stay in your own area when the small tails fire. A big defensive lets you live through one hit.'] },
          map: (d, o) => UX_M.waves(false, d, o) },
        { id: 'wrath', fail: UX_FAIL.wrath, name: 'Mother\'s Wrath (Run back in)', spell: 'Mother\'s Wrath', what: 'A 5-second cast that knocks her tank back and marks them, then 3 seconds of bites on whoever is in her reach, the red circle in front of her. Each bite stacks Stone Venom and Hobbled (55% slower). If her tank is out of reach, the bites hit everyone.',
          do: ['Mother\'s Wrath: her tank is knocked back.', 'Run straight back into the red circle in front of her.', 'Take the bites with a big defensive; Blessing of Freedom takes the slow off.', 'The other tank taunts: swap during her waves cast, never two in a row.'],
          map: (d, o) => UX_M.wrath(false, d, o) },
        { id: 'thrash', fail: UX_FAIL.thrash, name: 'Mephitic Thrash (Get 35 yards away)', spell: 'Mephitic Thrash', what: 'Her tail sweeps the ground: a big hit and a knockback within 35 yards, a smaller hit and DoT beyond.',
          do: ['The tail winds up.', 'Everyone near it runs out of the 35 yards, its tank too.', 'It lands: back to your spots. Keep eggs away from it.'],
          map: (d, o) => UX_M.thrash(false, d, o) },
        { id: 'heart', fail: UX_FAIL.heart, name: 'Rage of the Shackled (Burn the heart)', spell: 'Rage of the Shackled', what: 'Her Venomous Heart opens for 20 seconds and takes double damage, while she hits the raid every 4 seconds. Falling Debris lands in brown circles that kill anyone they hit, tanks too.',
          do: ['A 6-second cast, then her heart opens: save cooldowns and a potion.', 'Everyone on the heart, the adds dragged in for the cleave.', 'Raid damage every 4 seconds: heal through it.', 'Brown circles: step out before the debris lands.'],
          plan: ['On Heroic, Bloodlust here.', 'She ends on the left or right edge: that side\'s phase 2 half stays, the other walks across.'],
          m: { plan: ['Start your cooldowns when the cast is about 2.7 seconds from the end, so they\'re up as it opens.', 'Under about 66% after this burn means you\'re on pace for a kill.', 'Where she ends sets where the second burn starts: the half on her side gets the short walk back.'] },
          map: (d, o) => UX_M.heart(false, d, o) },
      ],
      tiles: [
        { name: 'She dives (Watch the bubbles)', do: 'After her first waves (1:02 on Heroic, 1:17 on Mythic) she dives and comes up where bubbles rise at the edge. Her tank gets there before she lands: an empty melee range hits the whole raid.' },
        { name: 'Her and the tail (Two tanks, always)', do: 'One tank on her and one on the tail at all times. Nobody on the tail: Rattler Slam hits the raid. Nobody in melee of her: Unchecked Rage hits the raid.' },
        { name: 'Blightscale Rawling (Kill them quickly)', do: 'A broken egg hatches a weak Rawling. Kill it.', m: { do: 'Kill Rawlings within 25 seconds: once they enrage they cast Acidic Expulsion, a raid-wide DoT.' } },
        { name: 'Blightscale Viper (Never hatch one)', do: 'An egg that touches venom hatches a deadly Viper: kill it first. Each Viper leaves Putrid Membrane, a raid DoT.' },
      ] },
    { id: 'p2', name: 'Phase 2: Children of the Doomscale', sum: 'The raid splits in two and crosses to the side ledges. Each half kills a Warden, carries eggs to the cauldron and kills the Doomscales, then comes back for the second heart burn.',
      m: { sum: 'Two even halves (the right side has one extra egg). One Warlock can gate both sides. Mythic adds a five-player tether break under raid cooldowns, and four Doomscales that enrage when one dies.' },
      mechs: [
        { id: 'warden', fail: UX_FAIL.warden, name: 'Doomscale Warden (Kick Malice, cleave the clutch)', spell: 'Malice', what: 'Each half fights a Doomscale Warden on its ledge. While it lives no egg can be picked up, and standing within 7 yards of one hurts. Its Writhing Gestation turns nearby eggs into a clutch that hatches in 20 seconds. Kick every Malice, a deadly raid-wide channel.',
          do: ['Wait for her last wave to pass, tank first, then cross: a Warlock gate or your own movement.', 'The Warden Shadow Molts to the eggs and starts Writhing Gestation.', 'Cleave the gestating eggs first; stay out of their 7 yards.', 'Kick every Malice, then kill the Warden.'],
          m: { name: 'Doomscale Warden (Pull it across, cleave, kick)', what: 'Each half gates to its ledge. Pull the Warden across the line and it teleports to the eggs and gestates every egg within 10 yards. Cleave those first, kick every Malice, and kill the Warden before its next gestation.',
            do: ['Wait for her last wave line to pass, then gate across: the Warlock places a gate for each side.', 'The tank pulls the Warden to the stairs: it teleports to the eggs and starts Writhing Gestation.', 'Break those egg shields and kill the Rawlings by 3:12, everyone off the eggs.', 'Kick every Malice (a 15-second cooldown: the melee share it), and kill the Warden before its next gestation.'],
            plan: ['Start at the north end of the ledge, where most eggs are, then work south.', 'Split evenly: the right side has one extra egg. Make sure each side can kill its Warden in time.', 'With one Warlock: they place the other side\'s gate first, then Soulburn to place their own. The side without one takes the movement classes for the way back.'] },
          map: (d, o) => UX_M.warden(false, d, o) },
        { id: 'fangs', fail: UX_FAIL.fangsH, name: 'Grasping Fangs (Break two at a time)', spell: 'Grasping Fangs', what: 'The Warden tethers three players on each ledge. A tether breaks with distance and leaves Blight Vein, a DoT on everyone that stacks with every break.',
          do: ['The Warden tethers three players.', 'They walk out to the edge of their tethers.', 'Two break first; the raid heals through their Blight Vein.', 'The last one breaks once it has fallen off.'],
          m: { fail: UX_FAIL.fangsM, name: 'Grasping Fangs (One break, then five together)', what: 'The Warden tethers six players. One mobile ranged breaks theirs alone; then the other five break together, at full stretch, away from the eggs, inside stacked raid cooldowns.',
            do: ['The Warden tethers six players.', 'One mobile ranged (a Mage, Hunter or Balance Druid) walks out and breaks theirs alone.', 'The other five walk to the edge of their tethers, away from the eggs, inside Anti-Magic Zone and Rallying Cry.', 'Four seconds later, as that Blight Vein ends, the five break on the same second: strongest defensive and a potion or Healthstone.'],
            plan: ['Someone counts down the break; an addon timer shows it too.', 'Cooldowns per side: an Anti-Magic Zone and a Rallying Cry each, plus Spirit Link Totem on one side and Darkness on the other.', 'Be at the end of your tether two seconds early: a late break adds 1 to 3 ticks for everyone.', 'If the Warden dies early, don\'t pick up an egg until your Blight Vein is gone.'] },
          map: (d, o) => UX_M.fangs(false, d, o) },
        { id: 'doomscales', fail: UX_FAIL.doomscales, name: 'Doomscale Eggs (Small first, the big one last)', spell: 'Doomscale Cauldron', what: 'With the Warden dead, carry every small egg to the cauldron in the pit (weak Rawlings come out: kill them). The big Doomscale Egg goes last, before its Hatching Doom ends, or the Ravenous Doomscale stuns everyone for 20 seconds: a wipe. A Weakened Doomscale climbs out: kick its Anguished Cry and bring it back to her.',
          do: ['Warden dead: pick up the small eggs.', 'Small eggs into the cauldron first: kill the Rawlings.', 'Then one player brings the big Doomscale Egg, well before its Hatching Doom ends.', 'A Weakened Doomscale climbs out: tank it, kick Anguished Cry, aim Desperate Thrash away, and bring it back to her.'],
          m: { name: 'Doomscale Eggs (Two lanes, kill them evenly)', what: 'Each side has two big Doomscale Eggs and small eggs whose carriers keep their 3-yard rings apart, so each half uses lanes. Two Weakened Doomscales climb out of each pit; when one dies the rest enrage, so kill them evenly.',
            do: ['Warden dead: wait for your Blight Vein to drop, then pick up. Leave the big eggs for now.', 'Small eggs up the lanes, carriers never touching; wait at the pit and throw them in together.', 'Big eggs: a mobile healer runs back for the far one, a melee takes the close one, both in on one countdown.', 'Two Doomscales per side: kick every Anguished Cry, aim Desperate Thrash away, and kill them evenly.'],
            plan: ['Kill the Rawlings before Boiling Venom: everyone on them; stun any that enrage.', 'Watch Rancid Yolk: picking up an egg with it on kills you (unless you\'re a tank). Let it drop first.', 'Mark the Doomscales from the boss frames and set focus: the kick alert needs it. Call it when two drift apart.'] },
          map: (d, o) => UX_M.doomscales(false, d, o) },
        { id: 'heart2', fail: UX_FAIL.heart, name: 'Rage of the Shackled (The second burn)', spell: 'Rage of the Shackled', what: 'The second heart burn (4:38 on Heroic, 4:48 on Mythic). The same as the first, with the Doomscales dragged in for the cleave.',
          do: ['Back on the platform by her: the heart opens for 20 seconds.', 'Everything on the heart, the Doomscales cleaved with it.', 'Raid damage every 4 seconds.', 'Brown circles kill in one hit: step out.'],
          m: { do: ['Back on the platform by her: the heart opens for 20 seconds.', 'Bloodlust and your second potion here.', 'Raid damage every 4 seconds; the tails fire at the raid again.', 'Brown circles kill in one hit: step out.'], plan: ['Under about 44% after this burn is killable.', 'On early pulls with deaths, use Bloodlust earlier.'] },
          map: (d, o) => UX_M.heart(false, d, { e: true, ...(o || {}) }) },
      ],
      tiles: [
        { name: 'Crossing over (Last wave first, then gate)', do: 'The raid splits in two and crosses the venom to the side ledges. Wait for her last wave line to pass, tank first, then movement abilities or a Warlock gate. On the way back, the side without a gate needs its own way.' },
        { name: 'Brown circles (Kill in one hit)', do: 'Debris falls on the ledges too: the brown circles kill even a tank. Run through one only right after it lands.' },
      ] },
    { id: 'int', name: 'Intermission: The Shattering', sum: 'Eggs rain down and coils rise around the platform for back-to-back soaks. Then the platform shatters into four.',
      m: { sum: 'Eight coil soaks in about 20 seconds, three groups taking turns; the middle ones come back to back, so personals and potions.' },
      mechs: [
        { id: 'intcoils', fail: UX_FAIL.intcoils, name: 'Spectral Coils (Two groups take turns)', spell: 'Spectral Coils', what: 'Six coils rise round the platform and slam one after another, each needing a soak. Soul Constrictor means nobody soaks two in a row, so two groups take turns. Eggs rain down too: bring them into the soaks to break them. Then the platform shatters and knocks everyone back.',
          do: ['Eggs rain down and coils rise around the platform.', 'Group one soaks the first coil.', 'Group two the next, and so on, turn about; bring eggs into the soaks.', 'Then stand toward the inside: the shattering knocks everyone back.'],
          m: { name: 'Spectral Coils (Three groups, eight soaks)', what: 'Eight soaks in about 20 seconds, round the room, three groups taking turns. Where the first one lands sets the order, so the caller presses it and each group gets its spots.',
            do: ['Eggs rain down and coils rise. Each group waits near the marker its note gives it.', 'The caller presses where the first slam lands: your spots pop up.', 'Round the room: group one, two, three, again; group three, the multi-dotters, only soaks twice. Personals around 5:50.', 'Finish on the line toward the diamond, inside: the knockback is big and outside is the venom.'],
            plan: ['Groups: a tank, a healer and 5 melee; a tank, a healer and 4 ranged; the other two healers and the rest of the DPS.', 'Only three patterns, set by where the first soak lands. Don\'t get baited by her real tail: wait for the spectral coil.', 'This is often harder to heal than phase 3.'] },
          map: (d, o) => UX_M.intcoils(false, d, o) },
      ],
      tiles: [
        { name: 'The Shattering (Stay inside)', do: 'The platform breaks into four with a big knockback. Stand toward the middle: from the edge you land in the venom.', m: { do: 'The knockback is bigger than on Heroic. Gather on the line toward the diamond, inside. Watch where her bubbles come up: that\'s the first quarter (usually north-east).' } },
      ] },
    { id: 'p3', name: 'Phase 3: Ula\'tek\'s Ascension', sum: 'The platform is in four quarters. Clutches land, red circles need soaking, and she smashes the quarter she\'s on, so the raid moves one quarter counter-clockwise each time.',
      m: { sum: 'Grips for the Slithering Clutches, three stacked red circles with three soakers, a raid cooldown on every quarter, and one last heart burn. Most raids find it the easiest phase.' },
      mechs: [
        { id: 'clutches', fail: UX_FAIL.clutchesH, name: 'Call of the Serpent (Break every clutch)', spell: 'Call of the Serpent', what: 'A Blightscale Clutch lands on every quarter. Break each one (a weak Rawling comes out), or it hatches a Blightscale Shrieker: kick its Vicious Echoes, a raid stun.',
          do: ['Clutches land on the quarters: step out of the circles.', 'Melee break the one by her; ranged the one on their quarter and the one at the back.', 'Kill each before it hatches.'],
          m: { fail: UX_FAIL.clutchesM, name: 'Slithering Clutches (Grip them in)', what: 'On Mythic the clutches crawl for the venom, and one that gets there hatches a Shrieker. Two Death Knights grip them over, quarter by quarter, then Gorefiend\'s Grasp pulls them into the raid\'s cleave.',
            do: ['Clutches spawn on the quarters and crawl for the venom.', 'The Death Knights grip the near ones right away.', 'The far one first to the near quarter, then the rest of the way.', 'Gorefiend\'s Grasp them together and cleave them down before the waves reach them.'],
            plan: ['You need two Death Knights; a Blood Death Knight covers nearly every Gorefiend\'s Grasp.', 'They come back during Serpent\'s Bite, so on the first quarter you do it twice.', 'The last set (8:25) is the easy one: two grips, and two Shriekers to kick (half the raid on each).'] },
          map: (d, o) => UX_M.clutches(false, d, o) },
        { id: 'bite', fail: UX_FAIL.bite, name: 'Serpent\'s Bite (Soak every red circle)', spell: 'Serpent\'s Bite', what: 'A melee, a ranged and a healer each get a 7-yard red circle and a 15-second venom. Others stand in it until it drains, or the target turns to stone and the corpse hurts the whole raid every second. Soakers then get Volatile Purge: spread out. Four sets on Heroic, one per quarter.',
          do: ['Three red circles: on a melee, a ranged and a healer.', 'Each group soaks its own red circle.', 'Never leave one unsoaked.', 'Volatile Purge: spread out at once.'],
          plan: ['Keep a backup ready for an off-role player who gets a circle.', 'Pick one side per group for the circles and tell everyone.'],
          m: { name: 'Serpent\'s Bite (Three soakers, stacked)', what: 'Three sets on Mythic. The three targets stack on one spot, so the circles overlap, and three assigned soakers (one backup) stand on all three at once. Each soaker takes about 2 million as it ends, an 18-second DoT, and sends a wave out: away from the raid.',
            do: ['Three reds: a melee, a ranged and a healer. They stack on one spot toward the middle.', 'The three assigned soakers stand on it: inside all three circles at once.', 'As it ends every soaker takes about 2 million: a big defensive.', 'Spread out at once; your wave goes away from the raid. Dying is better than hitting them.'],
            plan: ['Since Oct 6 three soakers clear a set. Sets: two Mages and a Hunter; a Rogue and both tanks; a healer and both tanks; one backup each.', 'After the hit, rotate personals and externals through the DoT.', 'Last set: you can die after it ends (just not during), so soakers walk into the water rather than hit the raid with their waves.'] },
          map: (d, o) => UX_M.bite(false, d, o) },
        { id: 'prey', fail: UX_FAIL.prey, name: 'Circling Prey (One quarter counter-clockwise)', spell: 'Circling Prey', what: 'She destroys the quarter she\'s on: a huge hit and a knockback within 13 yards, a smaller hit on everyone else. Everyone moves one quarter counter-clockwise, to her left. Personals for the second and third.',
          do: ['Circling Prey: she\'s about to destroy the quarter she\'s on.', 'Everyone moves one quarter counter-clockwise.', 'It lands: personals for the second and third.', 'She comes up at the next corner.'],
          m: { plan: ['A raid cooldown waits on each new quarter (Anti-Magic Zone, Anti-Magic Zone, Spirit Link Totem).', 'The third quarter is short: a Warlock gate to the fourth makes it easy.', 'Waves in this phase come from behind: turn your camera to see them coming.'] },
          map: (d, o) => UX_M.prey(false, d, o) },
      ],
      tiles: [
        { name: 'Caustic Waves (Watch behind you)', do: 'Her waves still come in this phase, from behind. Watch for them, step out, then spread back out.' },
        { name: 'Mother\'s Wrath (Taunt swap)', do: 'The knockback on the tank. The tank without the debuff taunts her back before the next one.', m: { do: 'The tank without Stone Venom soaks the spectral venom on the Wretch, then taunts her back before the next Mother\'s Wrath; the other tank takes the Wretch.' } },
        { only: 'm', name: 'Blightscale Wretch (Again on quarter 2)', do: 'A Wretch comes back on the second quarter. Its bubble right after the second break overlaps the red circles: the reds stack inside it.' },
        { name: 'Blightscale Shrieker (Kick and tank)', do: 'Kick its Vicious Echoes (a raid stun and a stacking DoT; never let it reach 2 stacks) and tank it to the boss.', m: { do: 'Two Shriekers come with the last clutches: half the raid kicks each. Kill them around their enrage.' } },
        { name: 'The last burn (Jump off at the end)', do: 'Rage of the Shackled one more time (9:27 on Heroic, 9:37 on Mythic). If she\'s nearly dead as it ends, jump off behind her: the venom hurts, but you dodge the slam and live a few seconds longer. Use a normal potion here.' },
      ] },
  ],
  roles: {
    t: ['One tank on her and one on the tail at all times; never two Mother\'s Wraths in a row.', 'Phase 1: after Mother\'s Wrath, run straight back in; when she dives, be at the bubbles first.', 'Phase 2: tank the Warden on the gestating eggs, then grab the Doomscales and bring them back.', 'Phase 3: swap on Mother\'s Wrath.'],
    h: ['Phase 1: every coil soak hits the raid: cooldowns right before the first.', 'Phase 2: Blight Vein follows each tether break, so they break two at a time.', 'Intermission: the slams come back to back, often harder to heal than phase 3.', 'Phase 3: the red-circle soakers need big healing.'],
    d: ['Phase 1: carry eggs safely until a soak breaks them, and kill Rawlings fast.', 'Phase 2: kick Malice and Anguished Cry.', 'Phase 3: break the clutches, and stand in the red circles when it\'s your group.'],
  },
};

// ===== Entombed Sentinels (notes/Guides/Bosses/2 Entombed Sentinels.md: the guides for what each mechanic does, the plan from your raid's
// own Mythic kills, Wolfthorn Sept 16, Sept 23 and Oct 1, which the guides back up). Drawn on the room picture kept square (your call,
// Oct 21): yards from the picture's centre (log 367.5,710.5), x right, y up; red gem on the left wall, green gem on the right. In the game
// the room sits turned (green gem north-east), so the N arrow leans. The plan: Breath (green) in the bottom corner on the green gem's side,
// Blood (red) in the bottom corner on the red gem's side, about 55 yards apart; melee on their boss, ranged and healers above it; the red
// half stacks for every soak and drops its puddles along the wall between the bosses; after the second intermission each boss sits by its
// own gem. Spots are tidied for reading (your note: the positions are reference points; the plan's spots stay).
GDZ_ORIGIN['Entombed Sentinels'] = { cx: 367.5, cy: 710.5 }; GDZ_FULL['Entombed Sentinels'] = { x: 0, y: -5, r: 55 }; /* (the room, a little low: the action is in the bottom corners, clear of the map's buttons) */
const SE_G = [29, -28], SE_R = [-29, -28], /* (the floor ends about 40 yards below the centre: the bosses sit a few yards out of the corners) */ SE_GREEN = ['t1', 'h1', 'h2', 'm1', 'm2', 'm3', 'm4', 'r1', 'r2', 'r3'], SE_RED = ['t2', 'h3', 'h4', 'm5', 'm6', 'm7', 'r4', 'r5', 'r6', 'r7'];
const SE_ACID = { color: '#6dff8e', fill: 'rgba(109,255,142,.12)' }, SE_BLOOD = { color: '#ff5a5a', fill: 'rgba(255,90,90,.12)' };
// both halves at their boss: the tank in front, melee behind it in the corner, ranged and healers above (skip: players a map places itself)
function seRaid(k, skip, t) {
  t = t || 0; const s = new Set(skip || []), put = (ids, x, y, r) => { const g = ids.filter((id) => !s.has(id)); g.forEach((id, i) => { const [dx, dy] = gdzSpot(i, g.length, r); k.at(t, id, x + dx, y + dy); }); };
  put(['t1'], 25, -24, 0); put(['m1', 'm2', 'm3', 'm4'], 37, -19, 6.5); put(['h1', 'h2', 'r1', 'r2', 'r3'], 22, -6, 8.5); /* (spaced so icons sit side by side on the whole-room view) */
  put(['t2'], -25, -24, 0); put(['m5', 'm6', 'm7'], -37, -19, 6); put(['h3', 'h4', 'r4', 'r5', 'r6', 'r7'], -22, -6, 9);
  return k;
}
const seBosses = (k) => k.boss('bg', 'Breath of Ula\'tek', 0, SE_G[0], SE_G[1]).boss('br', 'Blood of Ula\'tek', 0, SE_R[0], SE_R[1]);
// a round's spots: the maps are drawn for the first round (Blood by the red gem, Breath by the green gem); mx mirrors them, with the
// halves' players swapped so each half stays on its own side while the bosses cross; dy moves everything up the walls
const SE_SW = { t1: 't2', t2: 't1', h1: 'h3', h3: 'h1', h2: 'h4', h4: 'h2', m1: 'm5', m5: 'm1', m2: 'm6', m6: 'm2', m3: 'm7', m7: 'm3', m4: 'r7', r7: 'm4', r1: 'r4', r4: 'r1', r2: 'r5', r5: 'r2', r3: 'r6', r6: 'r3' };
function seK(k, o) {
  const mx = !!(o && o.mx), dy = (o && o.dy) || 0; if (!mx && !dy) return k;
  const X = (x) => (x == null ? x : mx ? -x : x), Y = (y) => (y == null ? y : y + dy), I = (id) => (mx && typeof id === 'string' && SE_SW[id]) || id, Is = (v) => (Array.isArray(v) ? v.map(I) : I(v));
  const P = {}, W = (r) => (r === k ? P : r), O = (q) => { if (!q) return q; const z = { ...q }; if (z.x != null) z.x = X(z.x); if (z.y != null) z.y = Y(z.y); for (const f of ['on', 'from', 'to']) if (z[f]) z[f] = I(z[f]); if (z.toYd) z.toYd = { x: X(z.toYd.x), y: Y(z.toYd.y) }; return z; };
  for (const key of Object.keys(k)) { const v = k[key]; P[key] = typeof v === 'function' ? (...a) => W(v.apply(k, a)) : v; }
  Object.assign(P, {
    at: (t, ids, x, y, sp, fx) => W(k.at(t, Is(ids), X(x), Y(y), sp, fx)), hold: (t, ids) => W(k.hold(t, Is(ids))),
    boss: (id, n, t, x, y) => W(k.boss(id, n, t, X(x), Y(y))), add: (id, n, t, x, y) => W(k.add(id, n, t, X(x), Y(y))), obj: (id, kd, t, x, y) => W(k.obj(id, kd, t, X(x), Y(y))),
    ring: (q) => W(k.ring(O(q))), call: (t0, t1, tx, q) => W(k.call(t0, t1, tx, O(q))), pause: (t, tx, q) => W(k.pause(t, tx, O(q))), link: (q) => W(k.link(O(q))),
    wave: (q) => W(k.wave({ ...O(q), deg: mx ? 180 - (q.deg || 0) : q.deg })), ring1: (ids) => W(k.ring1(Is(ids))), oops: (id, t) => W(k.oops(I(id), t)), ok: (id, t) => W(k.ok(I(id), t)),
    dispel: (a, b, t) => W(k.dispel(I(a), I(b), t)), tag: (id, ...r) => W(k.tag(I(id), ...r)),
    posAt: (id, t) => { const p = k.posAt(I(id), t); return p ? [X(p[0]), p[1] - dy] : p; },
    done: (q) => k.done(q && q.focus ? { ...q, focus: { ...q.focus, x: X(q.focus.x), y: Y(q.focus.y) } } : q),
  });
  return P;
}
const SE_M = {
  // Two bosses, 40 yards apart: each half stays with its boss; within 25 yards of each other they take 99% less damage, and each boss
  // stacks its Mark on everyone within 40 yards (fail: the tanks drift in and the bosses come close)
  split(fail, d, o) {
    const L = 10, k = seK(gdzKit('Entombed Sentinels', L), o); seBosses(k); seRaid(k);
    k.ring({ x: SE_G[0], y: SE_G[1], r: 40, fx: 'zone', t0: 1, dur: 8, ...SE_ACID, cn: 'Mark of Acid', legend: 'Mark of Acid: within 40 yards of Breath, stacks on you' });
    k.ring({ x: SE_R[0], y: SE_R[1], r: 40, fx: 'zone', t0: 1, dur: 8, ...SE_BLOOD, cn: 'Mark of Blood', legend: 'Mark of Blood: within 40 yards of Blood, stacks on you' });
    if (fail) { k.hold(0.5, 't1').at(5, 't1', 8, -27).hold(0.5, 't2').at(5, 't2', -8, -27);
      k.boss('bg', 'Breath of Ula\'tek', 0.5, SE_G[0], SE_G[1]).boss('bg', 'Breath of Ula\'tek', 5, 10, -31).boss('br', 'Blood of Ula\'tek', 0.5, SE_R[0], SE_R[1]).boss('br', 'Blood of Ula\'tek', 5, -10, -31);
      SE_GREEN.slice(1).forEach((id, i) => { const [dx, dy] = gdzSpot(i, 9, 9); k.hold(0.5, id).at(5, id, 15 + dx, -15 + dy); }); SE_RED.slice(1).forEach((id, i) => { const [dx, dy] = gdzSpot(i, 9, 9); k.hold(0.5, id).at(5, id, -15 + dx, -15 + dy); });
      k.call(5.2, 9, '99% less damage', { x: 0, y: -38, color: '#ff3b3b', ink: '#fff' }); k.oops('t1', 5).oops('t2', 5); k.step(0.5).step(3).step(5.2);
      k.pause(4.4, 'The tanks drifted in. The bosses are inside 25 yards of each other: both take 99% less damage.', { x: 0, y: -31, r: 14 });
      return k.done({ title: 'Mistake: the bosses too close', focus: { x: 0, y: -27, r: 14 }, badLabel: 'tanks who drifted in' }); }
    k.link({ from: 'bg', to: 'br', t0: 1, t1: 9.6, color: '#e6b450', legend: 'keep the bosses 40+ yards apart' }); k.call(1.5, 9.6, '60 yards apart', { x: 0, y: -36, color: '#e6b450', ink: '#141006' });
    k.ring1(['t1', 't2']).step(0.5).step(1.5).step(4);
    k.pause(3.5, 'Breath in the corner by the green gem, Blood in the corner by the red gem: about 60 yards apart. Stay inside your own boss\'s ring and out of the other one.', { x: 0, y: -30, r: 20 });
    return k.done({ title: 'Two bosses, two halves', focus: { x: 0, y: -16, r: 20 }, hlLabel: 'the two tanks' });
  },
  // Venom Coagulation: an add baited on a ranged player, pulsing raid damage while alive. Tactyks' plan: the green ranged and healers
  // "stack far" to bait it (away from the old Blood tank's big puddle), and the tank takes Breath to the add's far side, so the boss is
  // 40+ yards from the ranged and every ranged on both halves hits the add from max range; melee cleave boss and add (fail: the add is
  // still up when the intermission starts)
  coag(fail, d, o) {
    const L = 12, k = seK(gdzKit('Entombed Sentinels', L), o), A = [10, -4], B = [26, -2]; seBosses(k); seRaid(k);
    k.cast('bg', 'Venom Coagulation', 0.5, 3);
    // (the green ranged and healers stack far; the tank starts walking Breath out to where the add's far side will be)
    ['r1', 'r2', 'r3', 'h1', 'h2'].forEach((id, i) => { const [dx, dy] = gdzSpot(i, 5, 6); k.hold(0.2, id).at(2.9, id, A[0] + 1 + dx, A[1] + 2 + dy); }); /* (the stack stays 40+ yards from Blood) */
    k.call(0.4, 3.2, 'Stack far', { x: A[0], y: A[1] + 10, color: '#e6b450', ink: '#141006' });
    k.hold(0.6, 't1').at(4.6, 't1', B[0] + 1, B[1] + 5); k.boss('bg', 'Breath of Ula\'tek', 0.6, SE_G[0], SE_G[1]).boss('bg', 'Breath of Ula\'tek', 4.8, B[0], B[1]);
    k.add('ad', 'Venom Coagulation', 3, A[0], A[1]).show('ad', 3, fail ? L : 9.4); k.ring({ on: 'ad', r: 6, fx: 'zone', t0: 3, dur: fail ? L - 3 : 6.4, color: '#e8ff3d', fill: 'rgba(232,255,61,.25)', cn: 'Contaminate', legend: 'Contaminate: raid damage every pulse while the add lives' });
    // (off the add: the green ranged spread out above it; melee between the add and the boss cleave both; the red ranged step a little
    // and hit it from where they stand: within 40 yards of it, more than 40 from Breath)
    ['r1', 'r2', 'r3', 'h1', 'h2'].forEach((id, i) => { const [dx, dy] = gdzSpot(i, 5, 8); k.hold(3.2, id).at(5.2, id, 16 + dx, 6 + dy); });
    ['m1', 'm2', 'm3', 'm4'].forEach((id, i) => { const [dx, dy] = gdzSpot(i, 4, 6.5); k.hold(0.6, id).at(4.8, id, 18 + dx, -10 + dy); });
    /* (the red ranged already stand within 40 yards of the add and more than 40 from Breath: they just turn and hit it) */ ['r4', 'r5', 'r6', 'r7'].forEach((id) => { k.link({ from: id, to: 'ad', t0: 5.4, t1: fail ? L : 9.4, color: '#ff8a8a', legend: 'every ranged hits the add from max range' }); });
    k.call(5.4, 8.8, 'Red ranged hit it too', { x: -22, y: 8, color: '#ff8a8a', ink: '#200a0a' });
    if (fail) { gdzFailBlast(k, 10, 'Add alive into the intermission', A[0], A[1] + 12, ['h1', 'r3'], 'Contaminate'); k.step(0.5).step(3).step(10);
      k.pause(9.4, 'The add is still alive. Its pulses keep hitting the raid all through the intermission.', { on: 'ad', r: 9 });
      return k.done({ title: 'Mistake: the add left alive', focus: { x: 0, y: -6, r: 18 }, badLabel: 'hit by the pulses' }); }
    k.ring1(['r1', 't1']).step(0.5).step(3).step(5.2).step(9.4);
    k.pause(5.6, 'The add landed in the stacked ranged. Breath sits on its far side, so every ranged on both halves hits it from max range without picking up a Mark, and melee cleave both.', { on: 'ad', r: 12 });
    return k.done({ title: 'Venom Coagulation: stack far, everyone burns it', focus: { x: 0, y: -6, r: 18 }, hlLabel: 'the add\'s target and the tank' });
  },
  // Toxic Droplets: they land all around both halves (17 to 19 a set on the kills); step on each before it bursts (raid damage); every
  // pickup hurts and two at once kill on Mythic, so each tank takes the ones on their side with a defensive and everyone else one here
  // and there. Mythic, Living Venom: 4 seconds after a droplet is soaked its venom flies from that spot straight back into Breath and hits
  // anyone in the way, so each soaker steps off that line (fail: a melee takes two at once)
  drops(fail, d, o) {
    const myth = d !== 'h', L = 15, k = seK(gdzKit('Entombed Sentinels', L), o); seBosses(k); seRaid(k);
    k.cast('bg', 'Toxic Droplets', 0.5, 2.5);
    const D = [[21, -30], [33, -37], [27, -38], [17, -10], [31, -8], [-16, -17], [-30, -16], [-26, -37], [-40, -38]], T = [4.4, 6.4, 8.6, 5, 8.4, 5.2, 5.8, 4.8, 7.2], WHO = ['t1', 't1', 't1', 'r1', 'r1', 'r4', 'h3', 't2', 't2'];
    // (a droplet lands at least 6 yards from everyone who isn't taking it, and on the floor)
    D.forEach((pt, i) => { for (let it = 0; it < 8; it++) for (const o of GDZ_RAID) { if (o === WHO[i]) continue; const q = k.posAt(o, 2.5); if (!q) continue; const dx = pt[0] - q[0], dy = pt[1] - q[1], dd = Math.hypot(dx, dy) || 0.01; if (dd < 6) { pt[0] += dx / dd * (6 - dd); pt[1] += dy / dd * (6 - dd); } } pt[0] = Math.max(-42, Math.min(42, pt[0])); pt[1] = Math.max(-38, Math.min(40, pt[1])); });
    D.forEach(([x, y], i) => k.ring({ x, y, r: 2.2, fx: 'zone', t0: 2.5, dur: T[i] - 2.5, color: '#b6ff5c', fill: 'rgba(150,255,90,.55)', cn: 'Toxic Droplets', legend: 'a droplet: step on it before it bursts' })); /* (a small puddle, not an orb the size of a player: no icon to mix up with someone standing on it) */
    // (each tank takes the ones on their side with a defensive; a ranged with an immunity two; the rest one each)
    const go = (id, path) => { let t0 = 2.6; path.forEach((i) => { k.hold(t0, id).at(T[i] - 0.1, id, D[i][0], D[i][1]); t0 = T[i]; }); };
    go('t1', fail ? [0] : [0, 1, 2]); go('r1', [3, 4]); go('r4', [5]); go('h3', [6]); go('t2', [7, 8]);
    k.call(2.6, 9, 'Defensive', { on: 't1', color: '#e6b450', ink: '#141006' }).call(2.6, 9, 'Defensive', { on: 't2', color: '#e6b450', ink: '#141006' }); if (myth) k.call(3, 9, 'Immunity', { on: 'r1', color: '#7fd8ff', ink: '#06131c' });
    if (fail) { go('m1', [1, 2]); ulHit(k, 'm1', 8.5, 'Two at once'); k.oops('m1', 8.5); k.step(0.5).step(2.5).step(8.5);
      k.pause(8, 'This melee already took a droplet and runs onto another one: two at once, without an immunity.', { on: 'm1', r: 6 });
      return k.done({ title: 'Mistake: two droplets at once', focus: { x: 27, y: -32, r: 10 }, badLabel: 'took two at once' }); }
    // (after their soak, each soaker steps off the line between their droplet and Breath; the melee shift east, clear of the last blades)
    const home = (id, t0, t1) => { const q = k.posAt(id, 0); k.hold(t0, id).at(t1, id, q[0], q[1]); }; home('r4', 6.2, 8); home('h3', 6.8, 8.6); home('t2', 7.6, 9.6);
    home('r1', 9, 11); k.hold(9, 't1').at(11, 't1', 20, -36);
    if (myth) [[38, -12], [43, -17], [38, -22], [43, -27]].forEach(([x, y], i) => k.hold(10, 'm' + (i + 1)).at(11.8, 'm' + (i + 1), x, y));
    // (Mythic, Living Venom: each soaked droplet's venom flies back into Breath 4 seconds later; dashed until it goes)
    if (myth) D.forEach(([x, y], i) => { const a = Math.atan2(SE_G[1] - y, SE_G[0] - x) * 180 / Math.PI, dd = Math.hypot(SE_G[0] - x, SE_G[1] - y), t0 = T[i] + 4;
      k.link({ from: 'bg', toYd: { x, y }, t0: T[i], t1: t0 + 0.2, color: '#9dff6a', legend: 'Living Venom: where a soaked droplet\'s venom will fly back into Breath' });
      k.wave({ x, y, deg: a, v: 30, w: 2, d: 3, t0, t1: t0 + dd / 30, color: '#9dff6a', legend: 'Living Venom: the venom flies back into Breath and hits anyone in the way' }); });
    k.ring1(['t1', 't2', 'r1', 'r4', 'h3']).step(0.5).step(2.5).step(4.4).step(8.4);
    k.pause(4.2, 'Droplets all around both halves. Each tank takes the ones on their side with a defensive, a ranged with an immunity takes two, everyone else one here and there.', { x: 0, y: -24, r: 30 });
    if (myth) k.pause(8.8, 'Each soaked droplet sends its venom back into Breath 4 seconds later, along its dashed line. Everyone steps off those lines.', { x: 10, y: -26, r: 26 });
    return k.done({ title: 'Toxic Droplets: tanks, immunities, and the venom flying back', focus: { x: 0, y: -12, r: 22 }, hlLabel: 'droplet soakers' });
  },
  // Unstable Miasma: a soak on a player in Blood's half; it goes off in the red half's stack by Blood with 8 or more in it; every soaker
  // then drops a puddle (Blood Venom), side by side along the wall between the bosses (fail: only four soak)
  miasma(fail, d, o) {
    const myth = d !== 'h', L = 21, k = seK(gdzKit('Entombed Sentinels', L), o), C = [-37, -33]; seBosses(k); seRaid(k);
    k.cast('br', 'Unstable Miasma', 0.5, 1.5);
    const tg = 'r4', SO = ['r4', 'h3', 'm5', 'm6', 'r5', 'r6', 'r7', 'h4', 'm7'], go = fail ? SO.slice(0, 4) : SO;
    k.hold(1.5, tg).at(5, tg, C[0], C[1]); k.ring({ on: tg, r: 7.5, fx: 'soak', t0: 1.5, at: 9.5, dur: 8, color: '#ff5a5a', cn: 'Unstable Miasma', legend: 'Unstable Miasma: 8 or more stand in it' });
    go.filter((id) => id !== tg).forEach((id, i, a) => { const st = a.length < 7 ? 180 : 110, sp = a.length < 7 ? 160 : 270, ang = (st + i * sp / Math.max(1, a.length - 1)) * Math.PI / 180; k.hold(1.6, id).at(6, id, C[0] + Math.cos(ang) * 7, C[1] + Math.sin(ang) * 7); }); /* (a ring inside the soak circle, with a gap toward Blood and the melee's spot) */
    if (fail) { gdzFailBlast(k, 9.5, 'Too few: soakers die', C[0] + 4, C[1] + 11, ['m5', 'h3'], 'Unstable Miasma'); k.step(0.5).step(1.5).step(9.5);
      k.pause(9, 'Only four in the soak. On Mythic it needs 8 or more, or the soakers die.', { x: C[0], y: C[1], r: 10 });
      return k.done({ title: 'Mistake: the soak left short', focus: { x: -24, y: -26, r: 11 }, badLabel: 'too few in the soak' }); }
    // (then the soakers walk along the wall between the bosses and drop their puddles there, side by side)
    const up = !!(o && o.dy); SO.forEach((id, i) => { const x = up ? -40 : i < 7 ? -43 + i * 4.8 : -40.6 + (i - 7) * 4.8, y = up ? -28 + i * 4.8 : i < 7 ? -37 : -31.8; /* (on Blood's side of the wall: 40+ yards from Breath, or its Mark stacks on them) */ k.hold(10.2, id).at(15.6, id, x, y).hold(16.2, id); k.ring({ x, y, r: 3, fx: 'puddle', t0: 16.2, dur: L - 16.2, color: '#ff5a4f', fill: 'rgba(255,90,79,.3)', cn: 'Blood Venom', legend: 'Blood Venom: the puddle each soaker drops' }); });
    SO.forEach((id, i) => { const [dx, dy] = gdzSpot(i, 9, 10); k.hold(16.4, id).at(L, id, -22 + dx, -6 + dy); });
    k.ring1([tg]).step(0.5).step(1.5).step(6).step(10.2).step(16.2);
    k.pause(9, myth ? 'Nine in the soak, right in the red half\'s stack by Blood. On Mythic it needs 8 or more.' : 'The soak goes off in the red half\'s stack by Blood, with plenty of people in it.', { x: C[0], y: C[1], r: 10 });
    return k.done({ title: 'Unstable Miasma: soak in the stack, puddles on the wall', focus: { x: -14, y: -30, r: 12 }, hlLabel: 'the soak target' });
  },
  // Shifting Protovenom (Mythic): 8 players get a 6-yard circle; circle meets circle and both clear; a circle touching someone without
  // one erupts (damage and a big knockback for both); pre-spread, unmarked players step out of the way (fail: a circle walks into an
  // unmarked player)
  proto(fail, d, o) {
    const L = 11, k = seK(gdzKit('Entombed Sentinels', L), o); seBosses(k); seRaid(k);
    // (pre-spread before the cast, each half above its own boss: the players who get circles land at least 13 yards from each other and
    // 7 from everyone else, so each pair can walk straight together without brushing anyone)
    const SPR = { m1: [10, -18], r2: [22, -14], h2: [38, -18], m3: [30, -8], m2: [36, -34], m4: [16, -34], h1: [40, -2], r1: [14, -4], r3: [25, 4],
      m6: [-10, -18], r5: [-22, -14], h4: [-38, -18], r7: [-30, -8], m5: [-36, -34], m7: [-16, -34], h3: [-40, -2], r4: [-14, -4], r6: [-25, 4] };
    Object.entries(SPR).forEach(([id, p]) => k.hold(0.3, id).at(3.9, id, p[0], p[1]));
    k.call(0.4, 4, 'Circles coming: spread', { x: 0, y: 8, color: '#ff9628', ink: '#1a0d00' });
    const CIR = ['m1', 'r2', 'h2', 'm3', 'r5', 'm6', 'h4', 'r7'], PAIRS = [['m1', 'r2'], ['h2', 'm3'], ['r5', 'm6'], ['h4', 'r7']];
    CIR.forEach((id) => k.ring({ on: id, r: 6, fx: 'debuff', t0: 4, dur: fail && id === 'r7' ? 3 : 4, color: '#ff9628', cn: 'Shifting Protovenom', legend: 'Shifting Protovenom: meet another circle to clear both' }));
    PAIRS.forEach(([a, b], i) => { if (fail && i === 3) return; const pa = k.posAt(a, 4), pb = k.posAt(b, 4), m = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2]; /* (never on top of a player without a circle: that would erupt) */ for (let it = 0; it < 6; it++) for (const o of GDZ_RAID) { if (CIR.includes(o)) continue; const q = k.posAt(o, 4); if (!q) continue; const dx = m[0] - q[0], dy = m[1] - q[1], dd = Math.hypot(dx, dy) || 0.01; if (dd < 8) { m[0] += dx / dd * (8 - dd); m[1] += dy / dd * (8 - dd); } } k.hold(5.6, [a, b]).at(7.6, a, m[0] - 3.5, m[1]).at(7.6, b, m[0] + 3.5, m[1]); k.call(7.6, 9, 'Cleared', { on: a, color: '#7ee36a', ink: '#0a1a06' }); });
    if (fail) { const p = k.posAt('r6', 4); k.hold(5.4, 'r7').at(7, 'r7', p[0] + 2, p[1]); k.ring({ on: 'r7', r: 10, fx: 'burst', t0: 6.6, at: 7, dur: 0.8, color: '#ff3b3b', cn: 'Protovenom Eruption', legend: 'Protovenom Eruption: damage and a big knockback' }); k.hold(7, 'r6').at(7.6, 'r6', p[0] - 8, p[1] + 5); k.oops('r7', 7); k.step(0.5).step(4).step(7);
      k.pause(6.4, 'This circle walks into a player without one. Both get blasted and knocked back, and the circle is still there.', { on: 'r7', r: 8 });
      return k.done({ title: 'Mistake: a circle meets an empty player', focus: { x: -24, y: -22, r: 11 }, badLabel: 'walked into an unmarked player' }); }
    k.ring1(CIR).step(0.5).step(2).step(4).step(5.6).step(7.6);
    k.pause(5.4, 'Eight circles, four on each side. Wait a moment, then walk to your partner circle. Everyone without one stays put.', { x: 0, y: -20, r: 34 });
    return k.done({ title: 'Shifting Protovenom: circle to circle', focus: { x: 0, y: -12, r: 22 }, hlLabel: 'players with a circle' });
  },
  // the intermission: both bosses walk to the middle with 99% less damage taken and the weaker heals up to the stronger; Helical Toxins:
  // everyone gets 1-3 green orbs and pairs up to make 4; on Mythic the counts hide, so Tactyks' traffic rules: 1s jump in place and
  // ping themselves, 3s find a jumping pinger, 2s go under a boss (fail: a wrong pair, a huge red puddle)
  helix(fail, d, o) {
    const myth = d !== 'h', L = 16, k = seK(gdzKit('Entombed Sentinels', L), o); seBosses(k); seRaid(k);
    k.cast('bg', 'Vitriolic Stasis', 0, 1.5).cast('br', 'Vitriolic Stasis', 0, 1.5).boss('bg', 'Breath of Ula\'tek', 4, 5, -18).boss('br', 'Blood of Ula\'tek', 4, -5, -18);
    k.ring({ on: 'bg', r: 4, fx: 'safe', t0: 1.5, dur: L - 1.5, color: '#b9a6ff', cn: 'Vitriolic Stasis', legend: 'Vitriolic Stasis: 99% less damage; the weaker boss heals up' }).ring({ on: 'br', r: 4, fx: 'safe', t0: 1.5, dur: L - 1.5, color: '#b9a6ff', cn: 'Vitriolic Stasis', legend: 'Vitriolic Stasis: 99% less damage; the weaker boss heals up' });
    // (everyone spreads round the bosses, each half on its own side, then: 1s jump and ping, 3s find a pinger, 2s go under a boss)
    const N = { t1: 1, r1: 3, m1: 1, h1: 3, r3: 2, m4: 2, t2: 1, r4: 3, m5: 1, r6: 3, h3: 2, r7: 2 }, S3 = Object.keys(N).filter((x) => N[x] === 3), S1 = Object.keys(N).filter((x) => N[x] === 1), S2 = Object.keys(N).filter((x) => N[x] === 2);
    const SP = { t1: [22, -4], m1: [30, -28], t2: [-22, -4], m5: [-30, -28], r1: [22, 9], h1: [31, -37], r4: [-22, 9], r6: [-31, -37], r3: [10, 4], m4: [10, -36], h3: [-10, -36], r7: [-10, 4],
      h2: [36, 4], m2: [40, -20], m3: [17, -37], r2: [34, 12], h4: [-36, 4], m6: [-40, -20], m7: [-17, -37], r5: [-34, 12] };
    Object.entries(SP).forEach(([id, p]) => k.hold(0.4, id).at(5.5, id, p[0], p[1]));
    S1.forEach((id) => k.call(6, 10, myth ? '1: ping' : '1', { on: id, color: '#7ee36a', ink: '#0a1a06' }));
    S3.forEach((id) => k.call(6, 10, myth ? '3: go' : '3', { on: id, color: '#7fd8ff', ink: '#06131c' }));
    S2.forEach((id) => k.call(6, 10, myth ? '2: boss' : '2', { on: id, color: '#e6b450', ink: '#141006' }));
    const PR = [['r1', 't1'], ['h1', 'm1'], ['r4', 't2'], ['r6', 'm5']]; PR.forEach(([a, b]) => { const p = SP[b]; k.hold(6.4, a).at(9.8, a, p[0] + (p[0] > 0 ? 3.6 : -3.6), p[1]); });
    // (the 2s pair up under the bosses: two under Breath, two under Blood)
    if (!fail) { k.hold(6.4, ['r3', 'r7']).at(10, 'r3', 6.8, -21.5).at(10, 'r7', 3.2, -21.5); } else { k.hold(6.4, 'r3').at(10, 'r3', 6.8, -21.5); k.hold(6.4, 'r7').at(9.6, 'r7', -24, 14); }
    k.hold(6.4, ['h3', 'm4']).at(10, 'h3', -6.8, -21.5).at(10, 'm4', -3.2, -21.5);
    if (fail) { k.hold(10, 'r3').at(11.4, 'r3', -3.6, -21.5); k.ring({ x: -5, y: -21.5, r: 12, fx: 'puddle', t0: 11.6, dur: L - 11.6, color: '#ff5a4f', fill: 'rgba(255,90,79,.35)', cn: 'Cultivated Burst', legend: 'Cultivated Burst: a wrong pair, a huge puddle' }); k.oops('r3', 11.4).oops('m4', 11.4); k.step(0.5).step(6).step(11.4);
      k.pause(11.2, 'A 2 bumped into a pair that was already made. Wrong total: Cultivated Burst, and a huge puddle in the middle.', { x: -5, y: -21.5, r: 10 });
      return k.done({ title: 'Mistake: a wrong pair', focus: { x: 0, y: -18, r: 12 }, badLabel: 'wrong pair' }); }
    k.ring1(S3.concat(S1, S2)).step(0.5).step(6).step(6.4).step(10);
    k.pause(9, myth ? 'The numbers are hidden now. 1s jump in place and ping themselves, 3s run to a jumping pinger, 2s go under a boss and pair up there.' : 'Pair up to make 4: a 1 with a 3, or two 2s. Touch only your partner.', { x: 0, y: -16, r: 30 });
    return k.done({ title: 'Intermission: make 4', focus: { x: 0, y: -12, r: 22 }, hlLabel: 'players pairing up' });
  },
  // the tank swap: Empowering Slam grows 10% a hit on the same tank and Bloodvenom Injection stacks a poison, so the tanks taunt-swap as
  // each intermission ends; the halves stay put and the bosses cross. The tank leaving Blood drops a huge puddle (its middle into a gap
  // in old blood: it grows from its middle and doesn't drift) while the green ranged stack far to bait the next add away from it. Drawn
  // for the round that starts (Breath on the right, last round's Blood puddles on the right) (fail: the big puddle on clean floor)
  swap(fail, d, o) {
    const L = 11, k = seK(gdzKit('Entombed Sentinels', L), o), up = !!(o && o.dy); seRaid(k, ['t1', 't2']);
    k.boss('bg', 'Breath of Ula\'tek', 0, -5, -18).boss('br', 'Blood of Ula\'tek', 0, 5, -18).boss('bg', 'Breath of Ula\'tek', 1, -5, -18).boss('br', 'Blood of Ula\'tek', 1, 5, -18)
      .boss('bg', 'Breath of Ula\'tek', 5, SE_G[0], SE_G[1]).boss('br', 'Blood of Ula\'tek', 5, SE_R[0], SE_R[1]);
    // (last round's soak puddles, along the wall on this side)
    for (let i = 0; i < 9; i++) k.ring({ x: up ? 40 : i < 7 ? 43 - i * 4.8 : 40.6 - (i - 7) * 4.8, y: up ? -28 + i * 4.8 : i < 7 ? -37 : -31.8, r: 3, fx: 'puddle', t0: 0, dur: L, color: '#ff5a4f', fill: 'rgba(255,90,79,.3)', cn: 'Blood Venom', legend: 'old puddles from the last round' });
    k.at(0, 't1', 8, -15).at(0, 't2', -8, -15);
    k.call(1, 3.2, 'Taunt', { on: 't1', color: '#5aa0ff', ink: '#fff' }).call(1, 3.2, 'Taunt', { on: 't2', color: '#5aa0ff', ink: '#fff' });
    k.hold(1.2, 't2').at(5, 't2', -25, -24);
    k.ring({ on: 't1', r: 2.6, fx: 'debuff', t0: 0.3, dur: 6.4, color: '#ff5a5a', cn: 'Bloodvenom Injection', legend: 'the old Blood tank: drops a huge puddle when it ends' });
    const P = fail ? [14, -20] : up ? [41, -4] : [40, -37];
    k.hold(1.2, 't1').at(6.4, 't1', P[0], P[1]).hold(7, 't1').at(10.2, 't1', 25, -24);
    k.ring({ x: P[0], y: P[1], r: 7, fx: 'puddle', t0: 6.7, dur: L - 6.7, color: '#ff5a4f', fill: 'rgba(255,90,79,.35)', cn: 'Blood Venom', legend: 'the old Blood tank\'s big puddle' });
    // (the green ranged and healers stack far, so the next add lands away from the big puddle)
    ['r1', 'r2', 'r3', 'h1', 'h2'].forEach((id, i) => { const [dx, dy] = gdzSpot(i, 5, 7.5); k.hold(3.4, id).at(6, id, 9 + dx, -4 + dy); }); k.call(3.6, 7, 'Stack far', { x: 9, y: 5, color: '#e6b450', ink: '#141006' });
    if (fail) { k.call(7, 10.5, 'Clean floor lost', { x: P[0], y: P[1] - 13, color: '#ff3b3b', ink: '#fff' }); k.oops('t1', 6.7); k.step(0.3).step(1).step(6.7);
      k.pause(7.4, 'The old Blood tank dropped the big puddle on clean floor. That space is gone for the rest of the fight.', { x: P[0], y: P[1], r: 11 });
      return k.done({ title: 'Mistake: the big puddle on clean floor', focus: { x: 12, y: -22, r: 16 }, badLabel: 'the old Blood tank' }); }
    k.ring1(['t1', 't2']).step(0.3).step(1).step(3.6).step(6.7);
    k.pause(7.2, 'The old Blood tank drops the big puddle with its middle in the old blood. It grows from its middle, so most of it lands on floor that was already used.', { x: P[0], y: P[1], r: 11 });
    return k.done({ title: 'Tank swap: taunt, then the big puddle into old blood', focus: { x: 8, y: -22, r: 18 }, hlLabel: 'the two tanks' });
  },
};
const SE_FAIL = {
  swap: { name: 'The big puddle on clean floor', what: 'The tank leaving Blood drops the huge puddle in open floor. It takes space the next adds and soaks need, for the rest of the fight.', do: ['The intermission ends and the tanks swap.', 'The old Blood tank drops the big puddle in the open.', 'A big piece of clean floor is gone for the rest of the fight.'], map: () => SE_M.swap(true) },
  split: { solo: true, name: 'The bosses too close', what: 'The tanks drift in until the bosses are within 25 yards of each other: both take 99% less damage.', do: ['Both halves on their bosses.', 'The tanks drift toward the middle.', 'Inside 25 yards: 99% less damage on both bosses.'], map: () => SE_M.split(true) },
  coag: { name: 'The add left alive', what: 'The add that spawns right before the intermission isn\'t killed, and its pulses hit the raid through the whole intermission.', do: ['The add spawns.', 'Nobody switches to it.', 'Its pulses keep hitting the raid through the intermission.'], map: () => SE_M.coag(true) },
  drops: { name: 'Two droplets at once', what: 'A player who already took a droplet runs onto another one: two at once kills on Mythic.', do: ['Droplets land.', 'One melee takes one, then runs onto another.', 'Two at once, no immunity: dead.'], map: (d) => SE_M.drops(true, d) },
  miasma: { name: 'The soak left short', what: 'Only four players stand in Unstable Miasma, and it kills them.', do: ['The soak goes on a ranged.', 'Only four join them.', 'Too few: the soakers die.'], map: (d) => SE_M.miasma(true, d) },
  proto: { name: 'A circle meets an empty player', what: 'A player with a circle walks into someone without one: Protovenom Eruption blasts and knocks back both, and the circle is still there.', do: ['Eight circles go out.', 'One walks into a player without a circle.', 'Both blasted and knocked back.'], map: () => SE_M.proto(true) },
  helix: { name: 'A wrong pair', what: 'A 2 bumps into a pair that was already made: the wrong total sets off Cultivated Burst and a huge puddle.', do: ['The numbers go out.', 'Pairs form.', 'A wrong bump: Cultivated Burst.'], map: (d) => SE_M.helix(true, d) },
};
// ---- The whole fight in order (your note, Oct 21: the guides teach the flow of the fight, told by the raid leader): your kills' clock
// (Wolfthorn, Sept 16: the same to within a few seconds on all three). Five rounds; after each intermission the tanks swap bosses, so the
// halves stay on their side and the bosses cross; from the third round the bosses work up the walls onto clean floor, by their own gems.
// A round's spots: mx swaps the bosses' sides (and the halves' jobs), dy moves everything up the walls.
const SE_R1 = {}, SE_R2 = { mx: 1 }, SE_R3 = { dy: 26 }, SE_R4 = { mx: 1, dy: 24 }, SE_R5 = { dy: 24 };
const SE_BEATS = {
  start: { name: 'The pull (Split, drag, Bloodlust)', do: ['We split in two before the pull: one half by the red gem, one half by the green gem. Bloodlust goes on the pull.', 'Tanks drag Blood into the corner by the red gem and Breath into the corner by the green gem: about 60 yards apart, and they stay that far apart all fight.'],
    run() { const k = gdzKit('Entombed Sentinels', 6); seRaid(k, ['t1', 't2']); k.boss('bg', 'Breath of Ula\'tek', 0, 6, -12).boss('br', 'Blood of Ula\'tek', 0, -6, -12).boss('bg', 'Breath of Ula\'tek', 3.4, SE_G[0], SE_G[1]).boss('br', 'Blood of Ula\'tek', 3.4, SE_R[0], SE_R[1]);
      k.at(0, 't1', 9, -12).at(0, 't2', -9, -12).hold(0.4, ['t1', 't2']).at(3.4, 't1', 25, -24).at(3.4, 't2', -25, -24);
      k.call(0.2, 3, 'Bloodlust', { x: 0, y: 0, color: '#e6b450', ink: '#141006' }); k.ring1(['t1', 't2']).step(0.2).step(3); } },
  blighted: { name: 'Blighted Blood (Dispel it fast)', do: ['Blighted Blood: Blood puts a poison on a few of its half. Healers dispel it fast, one after another.', 'If it runs out on its own it drops a red puddle, so a late dispel means another puddle by the boss.'],
    run(o) { const k = seK(gdzKit('Entombed Sentinels', 5), o); seBosses(k); seRaid(k); const who = ['r5', 'm6', 'h4'];
      who.forEach((id, i) => { k.ring({ on: id, r: 2.6, fx: 'debuff', t0: 0.3, dur: 1.6 + i * 0.6, color: '#ff5a5a', cn: 'Blighted Blood', legend: 'poison: dispel it fast' }); k.dispel(i === 1 ? 'h4' : 'h3', id, 1.9 + i * 0.6); });
      k.ring1(['h3', 'h4']).step(0.3).step(1.9); } },
  kill: { name: 'The last round (Burn them together)', do: ['Fifth round: the soak puddles go into the corner nooks to save space. Both bosses go down together.', 'If we ever reach the fifth intermission they enrage: skip the new add and burn the bosses.'],
    run(o) { const k = seK(gdzKit('Entombed Sentinels', 6), o); seBosses(k); seRaid(k);
      k.ring({ on: 'bg', r: 7, fx: 'burst', t0: 2, at: 2.6, dur: 0.8, color: '#ffd23b', cn: 'Breath dies', legend: 'the kill' }).ring({ on: 'br', r: 7, fx: 'burst', t0: 2.2, at: 2.8, dur: 0.8, color: '#ffd23b', cn: 'Blood dies', legend: 'the kill' }); k.show('bg', 0, 3).show('br', 0, 3.2);
      k.call(3.3, 5.6, 'Kill', { x: 0, y: -20 }); k.step(0.3).step(3.3); } },
};
// (each round's own words where it differs from the first time through)
const SE_DO = {
  coag2: ['Second add: it spawns right before the intermission and starts the worst overlap of the round. It has to die before the bosses go to the middle.', 'Same as before: the ranged stack far, Breath on its far side, every ranged on both halves burns it.'],
  drops2: ['Second droplets. Same jobs: each tank takes the ones on their side with a defensive, everyone else one here and there.', 'Droplets that land in red puddles: the tank goes and grabs them.'],
  miasma2: ['Second soak of the round. Same stack, same 8 or more.', 'Drop the new puddles next to the old ones, not in the middle.'],
  hard: ['The worst overlap of the fight: the second add, the last droplets and the second set of circles all land together, right after the second soak.', 'Kill the add fast. Immunities soak the droplets (Divine Shield, Turtle, Cloak), or a raid cooldown covers it (Rallying Cry, Devotion Aura). Circles pause and count to two before they walk.'],
};
const SE_SIM = [
  { at: 0, beat: 'start' }, { at: 12, mech: 'coag', o: SE_R1, label: 'Venom Coagulation (First add)' }, { at: 15, mech: 'drops', o: SE_R1 }, { at: 18, mech: 'miasma', o: SE_R1, label: 'Unstable Miasma (First soak)' },
  { at: 36, mech: 'proto', o: SE_R1 }, { at: 43, beat: 'blighted', o: SE_R1 }, { at: 46, mech: 'helix', o: SE_R1, label: 'Intermission 1 (Make 4)' },
  { at: 68, mech: 'swap', o: SE_R2 }, { at: 71, mech: 'coag', o: SE_R2 }, { at: 74, mech: 'drops', o: SE_R2 }, { at: 76, mech: 'miasma', o: SE_R2 }, { at: 98, mech: 'proto', o: SE_R2 }, { at: 102, beat: 'blighted', o: SE_R2 },
  { at: 106, mech: 'drops', o: { ...SE_R2, do: SE_DO.drops2 }, label: 'Toxic Droplets 2' }, { at: 117, mech: 'miasma', o: { ...SE_R2, do: SE_DO.miasma2 }, label: 'Unstable Miasma 2' },
  { at: 124, mech: 'coag', o: { ...SE_R2, do: SE_DO.coag2 }, label: 'Venom Coagulation 2 (Dead before the intermission)' }, { at: 139, mech: 'proto', o: { ...SE_R2, do: SE_DO.hard }, label: 'Droplets and circles together (The hard moment)' },
  { at: 149, mech: 'helix', o: SE_R2, label: 'Intermission 2 (Make 4)' },
  { at: 171, mech: 'swap', o: SE_R3, label: 'Tanks swap (Each boss to its own gem)' }, { at: 174, mech: 'coag', o: SE_R3 }, { at: 177, mech: 'drops', o: SE_R3 }, { at: 179, mech: 'miasma', o: SE_R3 }, { at: 201, mech: 'proto', o: SE_R3 },
  { at: 204, beat: 'blighted', o: SE_R3 }, { at: 210, mech: 'drops', o: { ...SE_R3, do: SE_DO.drops2 }, label: 'Toxic Droplets 2' }, { at: 221, mech: 'miasma', o: { ...SE_R3, do: SE_DO.miasma2 }, label: 'Unstable Miasma 2' },
  { at: 226, mech: 'coag', o: { ...SE_R3, do: SE_DO.coag2 }, label: 'Venom Coagulation 2 (Dead before the intermission)' }, { at: 242, mech: 'proto', o: { ...SE_R3, do: SE_DO.hard }, label: 'Droplets and circles together (The hard moment)' },
  { at: 252, mech: 'helix', o: { dy: 20 }, label: 'Intermission 3 (Make 4)' },
  { at: 279, mech: 'swap', o: SE_R4 }, { at: 282, mech: 'coag', o: SE_R4 }, { at: 285, mech: 'drops', o: SE_R4 }, { at: 288, mech: 'miasma', o: SE_R4 }, { at: 310, mech: 'proto', o: SE_R4 }, { at: 315, beat: 'blighted', o: SE_R4 },
  { at: 318, mech: 'drops', o: { ...SE_R4, do: SE_DO.drops2 }, label: 'Toxic Droplets 2' }, { at: 329, mech: 'miasma', o: { ...SE_R4, do: SE_DO.miasma2 }, label: 'Unstable Miasma 2' },
  { at: 335, mech: 'coag', o: { ...SE_R4, do: SE_DO.coag2 }, label: 'Venom Coagulation 2 (Dead before the intermission)' }, { at: 351, mech: 'proto', o: { ...SE_R4, do: SE_DO.hard }, label: 'Droplets and circles together (The hard moment)' },
  { at: 361, mech: 'helix', o: { mx: 1, dy: 25 }, label: 'Intermission 4 (Make 4)' },
  { at: 387, mech: 'swap', o: SE_R5 }, { at: 390, mech: 'coag', o: SE_R5 }, { at: 393, mech: 'drops', o: SE_R5 }, { at: 395, mech: 'miasma', o: SE_R5 }, { at: 417, mech: 'proto', o: SE_R5 }, { at: 428, beat: 'kill', o: SE_R5 },
];
// (how long each part lasts on the real clock, and how bad a miss is: 3 can wipe the raid, 2 can kill players, 1 minor)
const SE_DUR = { 'm:swap': 6, 'm:coag': 14, 'm:drops': 8, 'm:miasma': 15, 'm:proto': 8, 'm:helix': 22, 'b:start': 4, 'b:swap': 3, 'b:blighted': 5, 'b:kill': 0 };
const SE_SEV = { 'm:swap': 2, 'm:coag': 2, 'm:drops': 3, 'm:miasma': 3, 'm:proto': 3, 'm:helix': 3, 'b:start': 1, 'b:swap': 1, 'b:blighted': 1, 'b:kill': 1 };
GDZ['Entombed Sentinels'] = {
  upd: ['12.1', 'Oct 20, 2026'],
  stepRoles: {
    'Two bosses (Stay 40 yards apart)': ['', 't', ''], 'Venom Coagulation (Stack far, everyone burns it)': ['dh', 'dh', 'td', ''], 'Toxic Droplets (Tanks and immunities)': ['', 't', '', ''],
    'Unstable Miasma (8 or more soak, puddles on the wall)': ['', '', '', '', ''], 'Shifting Protovenom (Circle to circle)': ['', '', '', '', ''], 'Helical Toxins (Make 4)': ['', '', '', ''], 'Tank swap (Taunt after every intermission)': ['', 't', 'dh', 't'],
  },
  sum: 'Two bosses, two halves of the raid. Breath goes into the corner by the green gem, Blood into the corner by the red gem, 40+ yards apart. Stay with yours, keep the floor clean of red puddles, and solve the math game at every intermission. As each one ends, the tanks taunt-swap the bosses, and then it\'s rinse and repeat: the same round again, a little further along the walls.',
  m: { sim: SE_SIM, simDur: SE_DUR, simSev: SE_SEV, beats: SE_BEATS,
    simAlways: ['Every round after the first is rinse and repeat: the same order of events, the bosses swapped, a little further along the walls.', 'Stay with your boss: never inside 40 yards of the other one.', 'Red puddles stay down a long time: drop every new one next to the old ones, along the walls, and keep the middle clean.', 'After every intermission the tanks swap bosses: your half stays put and the other boss comes to you.'],
    source: 'Tactyks\' Mythic Sentinels video', sum: 'Every Heroic mistake now kills: two droplets at once, the lines flying back, a short red soak. Add the Protovenom circles, and a math game where the numbers hide. Clean play matters more than damage.' },
  facts: [['Bosses', '2, split raid'], ['Bloodlust', 'On pull'], ['Healers', '4', 'm'], ['Hardest part', 'The math game'], ['Fight length', 'About 7 minutes, 4 intermissions', 'm']],
  phases: [
    { id: 'p1', name: 'The fight: two Sentinels', sum: 'Breath of Ula\'tek (green) in the corner by the green gem, Blood of Ula\'tek (red) in the corner by the red gem, at the same end of the room. One half on each, then the intermission at full energy.',
      m: { sum: 'The first round is short: one add, one soak, one droplet set and one set of circles, then the intermission at 0:46. After that, about every 100 seconds: two adds, two red soaks, three droplet sets and two sets of circles, then the intermission. The second add, the last droplets and the second circles land together right before it: the worst moment of the fight. Every round after the first is rinse and repeat.' },
      mechs: [
        { id: 'split', fail: SE_FAIL.split, name: 'Two bosses (Stay 40 yards apart)', spell: 'Ula\'tek\'s Dominance', what: 'Within 25 yards of each other, both bosses take 99% less damage. Each boss also stacks its Mark on everyone within 40 yards, so stay with your own.',
          do: ['One half on each boss. Pull Breath (green) into the corner by the green gem and Blood (red) into the corner by the red gem, at the same end of the room.', 'Keep the bosses 40+ yards apart. At those spots they\'re about 60 apart.', 'Stay inside your own boss\'s 40 yards and out of the other one\'s.'],
          m: { do: ['One half on each boss. Pull Breath (green) into the corner by the green gem and Blood (red) into the corner by the red gem, at the same end of the room.', 'Keep the bosses 40+ yards apart. At those spots they\'re about 60 apart.', 'Stay with your boss. 20 Marks of Acid and 20 Marks of Blood on you at once kills you, so multi-dotters don\'t refresh into both.'],
            plan: ['Split the multi-dotters evenly (a Warlock and a Balance Druid on one side, a Warlock and a Shadow Priest on the other) and put the strong two-target melee on green: it has more adds.', 'If damage is tight, line up the bosses\' health before the intermission by swapping players around, not by stopping damage: the weaker one heals up to the stronger.'] },
          map: (d, o) => SE_M.split(false, d, o) },
        { id: 'coag', fail: SE_FAIL.coag, name: 'Venom Coagulation (Stack far, everyone burns it)', spell: 'Venom Coagulation', what: 'The green boss drops a big slime on a ranged player. It pulses raid damage while it lives, so everyone who can hits it.',
          do: ['The add is coming. Green ranged and healers: stack far, together, away from the tank and any big puddle.', 'It lands in your stack. Step off it.', 'The tank keeps Breath on the far side of the add. Melee cleave both; every ranged on both halves hits it from max range.', 'Dead: back to your spots.'],
          m: { plan: ['The first add of each round after the first matters most: the tank who just left Blood is dropping a huge puddle, and an add baited near it can\'t be cleaved. Stack far from that puddle.', 'With Breath on the far side, the boss is more than 40 yards from the ranged hitting the add, so nobody picks up a Mark.', 'The second add of a round spawns right before the intermission and starts the worst overlap: burn it.'] },
          map: (d, o) => SE_M.coag(false, d, o) },
        { id: 'drops', fail: SE_FAIL.drops, name: 'Toxic Droplets (Tanks and immunities)', spell: 'Toxic Droplets', what: 'Droplets land all around both halves. Step on each before it bursts and hits the raid. Every pickup hurts, so the tanks take most of them.',
          do: ['Droplets land all around both halves.', 'Each tank takes the ones on their side, always with a defensive up.', 'Everyone else takes one here and there.', 'Back to your spot.'],
          m: { what: 'Droplets land all around both halves. Step on each before it bursts and hits the raid. Every pickup hurts and two at once kills, so the tanks take most of them. 4 seconds after a droplet is soaked, its venom flies from that spot straight back into Breath and hits anyone in the way.',
            do: ['Droplets land all around both halves.', 'Each tank takes the ones on their side, always with a defensive up.', 'Everyone else takes one here and there. Never two at once without an immunity.', 'Step off the line between your droplet and Breath: 4 seconds after you soak it, its venom flies back into the boss.'],
            plan: ['Tanks: Barkskin, Incarnation, Survival Instincts or your own defensive for every set. If nothing is up, wait for it, then soak hard.', 'Droplets that land in red puddles: the tank goes and grabs them.', 'The worst overlap of each round after the first: the second add, these droplets and the second circles, right after the second soak. Immunities soak them (Divine Shield, Turtle, Cloak; two per side covers it), or raid cooldowns (Rallying Cry, Devotion Aura).'] },
          map: (d, o) => SE_M.drops(false, d, o) },
        { id: 'miasma', fail: SE_FAIL.miasma, name: 'Unstable Miasma (8 or more soak, puddles on the wall)', spell: 'Unstable Miasma', what: 'The red boss puts a soak on a player in its half. Everyone in it splits the hit and then drops a red puddle, so soak in your stack by Blood and drop the puddles side by side along the wall.',
          do: ['Soak on you? Stay in the red half\'s stack by Blood.', 'The red half stays stacked in it with you. On Mythic it needs 8 or more.', 'It lands. Every soaker gets a puddle to drop.', 'Walk along the wall between the two bosses and drop them there, side by side.', 'Back to the boss. The middle stays clean.'],
          m: { plan: ['Have a set pattern for the puddles: along the wall between the bosses first, then the other walls. A clean floor is what saves a bad Protovenom or a bad soak.', 'Stack defensives on the soak: Anti-Magic Zone or Spirit Link Totem helps.', 'Stack the next soak right up against the old puddles, and use movement speed (Stampeding Roar) to get in and out. Each round repeats a little further along the wall.', 'Dispel Blighted Blood fast: if it runs out it drops a puddle too, so let it drop near the others.'] },
          map: (d, o) => SE_M.miasma(false, d, o) },
        { id: 'proto', only: 'm', fail: SE_FAIL.proto, name: 'Shifting Protovenom (Circle to circle)', spell: 'Shifting Protovenom', what: 'Eight players get a 6-yard circle that hurts them every 2 seconds until it\'s cleared. Two circles touching clear each other. A circle touching anyone without one erupts: damage and a big knockback for both, and the circle stays.',
          do: ['Spread out before it lands. Tanks and melee too.', 'Circles go out: four on each side, if you\'re lucky.', 'Circle on you? Wait a moment, find your partner circle, and walk to them.', 'No circle? Stay put and let them come to each other.', 'Both circles clear when they touch.'],
          plan: ['Don\'t rush: pause a second or two before walking, unless the path is obvious.', 'Sometimes a side gets five. The extra one runs over to the other half to clear.', 'A multi-dotter in range of both bosses can be picked as a fifth on one side: step out of the other boss\'s range.'],
          map: (d, o) => SE_M.proto(false, d, o) },
        { id: 'helix', fail: SE_FAIL.helix, name: 'Helical Toxins (Make 4)', spell: 'Helical Toxins', what: 'At full energy both bosses go to the middle and take 99% less damage for about 30 seconds, and the weaker one heals up to the stronger. Everyone gets 1 to 3 green orbs: pair up with one player so the two of you make exactly 4.',
          do: ['The bosses go to the middle. Spread out.', 'Read your number: 1, 2 or 3 green orbs.', 'Pair up to make 4: a 1 with a 3, or two 2s. Touch only your partner.', 'A wrong pair blows up into a huge red puddle.'],
          m: { do: ['The bosses go to the middle. Spread out.', 'Your number shows for a moment, then hides. Remember it. If a partner is right next to you, clear at once.', '1s jump in place and ping themselves. 3s run to a jumping, pinging player. 2s go under a boss and pair up there.', 'A wrong pair blows up into a huge red puddle: that usually wipes.'],
            plan: ['The traffic rules are the same every time, so practice them: 2s under the boss, 1s jump and ping (a ping macro helps), 3s find the pingers.', 'Keep the bosses\' health even going in: a 5% gap is a lot of free healing for the weaker one. Multi-dotters push the higher one.', 'Failed? Go to a far corner and stop bumping: bumping grows the puddle. An immunity survives it.'] },
          map: (d, o) => SE_M.helix(false, d, o) },
        { id: 'swap', fail: SE_FAIL.swap, name: 'Tank swap (Taunt after every intermission)', spell: 'Bloodvenom Injection', what: 'Each boss wears its tank down: Breath\'s Empowering Slam hits 10% harder with every hit on the same tank, and Blood\'s Bloodvenom Injection stacks a poison. So the tanks taunt-swap as every intermission ends, and the tank leaving Blood drops a huge puddle.',
          do: ['Intermission over: the bosses leave the middle.', 'Both tanks taunt the other boss at the same moment. Your half stays where it is and the other boss comes to you.', 'Green ranged and healers: stack far, so the next add lands away from the tank\'s big puddle.', 'The tank leaving Blood drops a huge puddle: put its middle in a gap between old puddles.'],
          m: { plan: ['The big puddle grows from its middle and doesn\'t drift off other puddles, so with its middle in old blood most of it overlaps used floor.', 'Your Mark changes with your boss after the swap: the old stacks fall off on their own.', 'Call the taunts on voice: both at once, as the bosses walk out of the middle.'] },
          map: (d, o) => SE_M.swap(false, d, o) },
      ],
      tiles: [
        { name: 'Blighted Blood (Dispel it)', do: 'A DoT from the red boss. Dispel it fast. If it runs out, it drops a red puddle: let it drop near the others.' },
        { name: 'Blood Venom (Keep the floor clean)', do: 'Every red puddle stays a long time. Drop them in the corners and along the walls in a set pattern, so the middle stays free for the rest of the fight.' },
        { name: 'Boss spots (Clean floor every time)', do: 'On the pull, Breath goes into the corner by the green gem and Blood into the corner by the red gem, at the same end of the room. After each intermission the tanks swap bosses and each half moves a little further along its side of the room, onto clean floor. After the second one, each boss sits right by its own gem.' },
        { only: 'm', name: 'The enrage (Don\'t start the last add)', do: 'The bosses enrage after the fourth intermission cycle. If you\'re there, don\'t start the new green add: burn the bosses.' },
      ] },
  ],
  roles: {
    t: ['Pull Breath into the corner by the green gem and Blood into the corner by the red gem, 40+ yards apart.', 'Both tanks: take the droplets on your side, always with a defensive, and grab the ones that land in red puddles.', 'Taunt-swap as every intermission ends. Leaving Blood, drop your big puddle with its middle in old blood.', 'Keep Breath on the far side of every add, so all the ranged can hit it.'],
    h: ['Dispel Blighted Blood fast.', 'Red soaks and droplets hurt the raid: be ready right after them.', 'Intermission: the bosses heal, the raid doesn\'t take much; solve the math game.'],
    d: ['Stay with your boss: never in range of both.', 'Every add dies fast: ranged on both halves hit it from max range. The second one dies before the intermission.', 'Red half: 8 or more in every soak, then puddles along the wall.', 'Intermission: 1s jump and ping, 3s find a pinger, 2s go under a boss.'],
  },
};

// ===== Nek'zali the Soulcoiler (notes/Guides/Bosses/1 Nek'zali the Soulcoiler.md: Tactyks' Mythic and Normal/Heroic videos read in full,
// the spell text, and Wolfthorn's Mythic kill N1PK29BXAf7g6rYL #19 for the clock and the spots). Yards from the room picture's centre,
// x east, y north. The Soulcoil Well is the dark pit in the middle (about 8 yards to its rim; touching it takes you down); doors west
// and east, coffins round the walls, about 50 yards of floor each way. (In the kill's log the well, the doors and the Drowned Echo sit
// at log y 207, 9 yards north of the picture's centre (198), so spots taken from the log are moved down 9 yards to fit the picture.)
GDZ_ORIGIN['Nek\'zali the Soulcoiler'] = { cx: 0, cy: 198 }; GDZ_FULL['Nek\'zali the Soulcoiler'] = { x: 0, y: -4, r: 54 };
const NZ = 'Nek\'zali the Soulcoiler', NZ_B = [2, -14.5], NZ_IB = [0, -4.5], NZ_SQA = ['m1', 'm2', 'm3', 'r1', 'h1'], NZ_SQB = ['m4', 'm5', 'm6', 'r5', 'h2'];
const NZ_MEL = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], NZ_RNG = ['r1', 'h1', 'r2', 'r3', 'h2', 'r4', 'r5', 'h3', 'r6', 'h4', 'r7'];
const nzU = (a, r) => [Math.cos(a * Math.PI / 180) * (r == null ? 1 : r), Math.sin(a * Math.PI / 180) * (r == null ? 1 : r)];
const nzAdd = (p, a, r) => { const u = nzU(a, r); return [p[0] + u[0], p[1] + u[1]]; };
// a walk from wherever the player is at t0 to q by t1, round the well's rim when the straight line would cross it
function nzGo(k, t0, t1, id, q) { const p = k.posAt(id, t0); if (p) { const dx = q[0] - p[0], dy = q[1] - p[1], L2 = dx * dx + dy * dy, s = L2 ? Math.max(0, Math.min(1, -(p[0] * dx + p[1] * dy) / L2)) : 0, c = [p[0] + dx * s, p[1] + dy * s], dc = Math.hypot(c[0], c[1]);
    if (dc < 11 && s > 0.03 && s < 0.97) { const a = dc > 0.5 ? Math.atan2(c[1], c[0]) : Math.atan2(p[1], p[0]) + Math.PI / 2, w = [Math.cos(a) * 12.5, Math.sin(a) * 12.5], l1 = Math.hypot(w[0] - p[0], w[1] - p[1]), l2 = Math.hypot(q[0] - w[0], q[1] - w[1]); k.at(t0 + (t1 - t0) * l1 / (l1 + l2), id, w[0], w[1]); } }
  k.at(t1, id, q[0], q[1]); }
// players on arcs round a spot (rows: [radius, angle, angle, ...]), each id keeping its own slot, so icons never stack
function nzArc(k, t, ids, c, rows, hold, skip) { let i = 0; for (const [r, ...angs] of rows) for (const a of angs) { const id = ids[i++]; if (!id || (skip && skip.has(id))) continue; const q = nzAdd(c, a, r); if (hold != null) { k.hold(hold, id); nzGo(k, hold, t, id, q); } else k.at(t, id, q[0], q[1]); } }
// the raid round a boss (or an Echo) at P whose tank stands on side th (degrees): the tank in front, melee behind her in two rows, the
// other tank beside, ranged and healers further back; wings: the ranged split in two wings either side, so nobody stands on the well
function nzAt(k, t, P, th, o) {
  o = o || {}; const s = new Set(o.skip || []), b = th + 180, H = o.hold, one = (id, q) => { if (s.has(id)) return; if (H != null) { k.hold(H, id); nzGo(k, H, t, id, q); } else k.at(t, id, q[0], q[1]); };
  one('t1', nzAdd(P, th, 5.5)); one('t2', o.wings || o.fan != null ? nzAdd(P, th + 90, 13) : nzAdd(P, th - 60, 9)); const f = o.fan;
  nzArc(k, t, NZ_MEL, P, [[6, b - 50, b, b + 50], [12, b - 60, b - 20, b + 20, b + 60]], H, s);
  nzArc(k, t, NZ_RNG, P, f != null ? [[18.5, f - 70, f - 42, f - 14, f + 14, f + 42, f + 70], [25, f - 60, f - 30, f, f + 30, f + 60]] : o.wings ? [[18.5, b - 75, b - 52, b - 30, b + 30, b + 52, b + 75], [25, b - 70, b - 50, b - 30, b + 35, b + 70]] : [[18.5, b - 70, b - 42, b - 14, b + 14, b + 42, b + 70], [25, b - 60, b - 30, b, b + 30, b + 60]], H, s);
  return k;
}
const nzBoss = (k, t, x, y) => k.boss('nz', NZ, t || 0, x == null ? NZ_B[0] : x, y == null ? NZ_B[1] : y);
const nzWell = (k, t0, dur, color, legend) => k.ring({ x: 0, y: 0, r: 8.4, fx: 'zone', t0, dur, color: color || '#b06bff', fill: 'rgba(120,60,200,.18)', cn: 'Soulcoil Well', legend: legend || 'the Soulcoil Well' });
// where a scene starts. Phases one and two: the boss at the well's south edge, her tank between her and the well, the raid behind her.
// The intermission (o.E): she floats over the well and can't be hurt; the raid is on the Echo at its body pile, its tank on side o.th
function nzHome(k, o, L) {
  if (o && o.E) { k.boss('nz', NZ, 0, NZ_IB[0], NZ_IB[1]); k.ring({ on: 'nz', r: 4, fx: 'safe', t0: 0, dur: L, color: '#b9a6ff', cn: 'Tether of Awakening', legend: 'immune while her Echoes live' });
    if (!o.noEcho) k.add('ej', 'Echo of Jawae', 0, o.E[0], o.E[1]); nzAt(k, 0, o.E, o.th, { wings: true }); return { P: o.E, th: o.th, int: true }; }
  nzBoss(k); nzAt(k, 0, NZ_B, 90); return { P: NZ_B, th: 90 };
}
// the four Hungering Pyres in the kill, each on a body pile: the Echo (E) and the side its tank faces (th), out from the well
const NZ_PY = [{ E: [-19, 16], th: 140 }, { E: [-15.9, -12.2], th: 323 }, { E: [30, -6.5], th: -30 }, { E: [-22.8, 7.3], th: 162 }];
const NZ_M = {
  // Soulcoil Ignition: she floats over the well and stirs it (+25 energy, five raid hits with a stacking DoT); spirits rise and land on
  // players (5 yards: a big hit and a knockback): step out before they land (fail: one player stays where a spirit lands)
  ignite(fail) {
    const L = 11, k = gdzKit(NZ, L); nzHome(k); nzBoss(k, 0.4); nzBoss(k, 2.4, 0, 0); k.cast('nz', 'Soulcoil Ignition', 2.6, 8.6);
    nzWell(k, 2.6, 6.2, '#c084ff', 'the well churns: five raid hits, +25 energy');
    k.call(3, 8.5, 'Five raid hits: healing cooldowns', { x: 0, y: 13, color: '#c084ff', ink: '#14061f' });
    const TG = ['r5', 'r6', 'r7'];
    TG.forEach((id, i) => { const p = k.posAt(id, 3.4), d0 = Math.hypot(p[0], p[1]) || 1; k.obj('sp' + i, 'ghost', 3.4, p[0] / d0 * 7, p[1] / d0 * 7).obj('sp' + i, 'ghost', 5.4, p[0], p[1]).show('sp' + i, 3.4, 5.6); /* (each rises from the rim on its own side) */
      k.ring({ x: p[0], y: p[1], r: 5, fx: 'burst', t0: 4.2, at: 5.5, dur: 1, color: '#c084ff', cn: 'Anguished Echoes', legend: 'a spirit lands: 5 yards, a big hit and a knockback' });
      if (fail && i === 1) return; const v = [p[0] - NZ_B[0], p[1] - NZ_B[1]], d = Math.hypot(v[0], v[1]) || 1; k.hold(3.6, id).at(4.9, id, p[0] + v[0] / d * 6.5, p[1] + v[1] / d * 6.5).hold(8.6, id).at(10.6, id, p[0], p[1]); });
    nzBoss(k, 9); nzBoss(k, 10.6); const T0 = [k.posAt('t1', 0), k.posAt('t2', 0)]; k.hold(2.2, ['t1', 't2']).at(3.4, 't1', -10, -11).at(3.4, 't2', 12.5, -5).hold(9, ['t1', 't2']).at(10.6, 't1', T0[0][0], T0[0][1]).at(10.6, 't2', T0[1][0], T0[1][1]);
    if (fail) { ulHit(k, 'r6', 5.5, 'Hit and knocked back'); const p = k.posAt('r6', 5.5); k.call(5.5, 7, 'Knocked back', { on: 'r6', color: '#ff3b3b', ink: '#fff' }); k.hold(5.5, 'r6').at(6.1, 'r6', p[0], p[1] - 7); k.oops('r6', 5.5); k.step(0.4).step(2.6).step(5.5);
      k.pause(5.1, 'This ranged stayed where the spirit was landing: a big hit and a knockback, right in the middle of five raid hits.', { on: 'r6', r: 8 });
      return k.done({ title: 'Mistake: standing where a spirit lands', focus: { x: 2, y: -20, r: 24 }, badLabel: 'hit by a spirit' }); }
    k.ring1(TG).step(0.4).step(2.6).step(3.4);
    k.pause(4.6, 'Spirits rise out of the well and drop onto players. Step out of the circle before it lands, then heal everyone up through the five hits.', { x: 2, y: -28, r: 22 });
    return k.done({ title: 'Soulcoil Ignition: heal through it, dodge the spirits', focus: { x: 2, y: -16, r: 26 }, hlLabel: 'players a spirit is landing on' });
  },
  // Restless Amani: coffins light up on one side; adds walk for the well behind a shield only magic damage breaks. The tank drags the boss
  // toward them and everyone follows; casters break the shields, melee cleave adds and boss together; Heroic+: their bodies stay in one pile.
  // o.th0: the side of the room (the kill: east at 0:53, southeast at 2:01); in the intermission (o.E) the Echo is dragged to the pile instead
  // (o.P, its tank on side o.pth), and o.via walks everyone round the south of the well (fail: nobody breaks one add's shield)
  amani(fail, o) {
    o = o || {}; const T1 = o.via ? 12 : o.E ? 7 : (o.T1 || 5.8), L = T1 + 11.7, k = gdzKit(NZ, L), h = nzHome(k, o, L), int = !!h.int; /* (T1: when the boss or Echo reaches the adds; longer walks get longer) */
    const th = int ? o.pth : (o.th0 != null ? o.th0 : -23), P = int ? o.P : nzU(th, o.r || 28), ca = Math.atan2(P[1], P[0]) * 180 / Math.PI;
    const mv = (t, q) => (int ? k.add('ej', 'Echo of Jawae', t, q[0], q[1]) : k.boss('nz', NZ, t, q[0], q[1]));
    const CF = [ca - 34, ca - 12, ca + 12, ca + 34].map((a) => nzU(a, 48)), END = [th - 70, th - 25, th + 25, th + 70].map((a) => nzAdd(P, a, 9.5));
    CF.forEach(([x, y]) => k.ring({ x, y, r: 2.6, fx: 'zone', t0: 0.3, dur: 2.4, color: '#5ce1e6', fill: 'rgba(92,225,230,.3)', cn: 'Glowing coffin', legend: 'a glowing coffin: an add comes out here' }));
    k.call(0.3, 2.6, 'Glowing coffins', { x: CF[1][0] * 0.82, y: CF[1][1] * 0.82, color: '#5ce1e6', ink: '#03181a' });
    // (the tank drags the boss toward them and the raid follows, round the well's south edge in the intermission)
    mv(0.4, h.P); if (o.via) { mv(6.4, NZ_B); nzAt(k, 6.4, NZ_B, 90, { hold: 0.4 }); } mv(T1, P); const fh = Math.atan2(NZ_B[1] - P[1], NZ_B[0] - P[0]) * 180 / Math.PI, fan = (f) => [[18.5, -70, -42, -14, 14, 42, 70], [25, -60, -30, 0, 30, 60]].flatMap(([r, ...a]) => a.map((x) => nzAdd(P, f + x, r)));
    let lay = { wings: true }; if (!int) for (const dd of [0, 10, -10, 20, -20, 30, -30, 40, -40, 50, -50, 60, -60, 70, -70]) if (fan(fh + dd).every((q) => Math.hypot(q[0], q[1]) >= 11.5 && Math.hypot(q[0], q[1]) <= 48)) { lay = { fan: fh + dd }; break; } nzAt(k, T1, P, th, Object.assign({ hold: o.via ? 6.4 : 0.4 }, lay));
    const CAS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'].map((id) => [id, k.posAt(id, T1)]).sort((a, b) => Math.hypot(a[1][0] - P[0], a[1][1] - P[1]) - Math.hypot(b[1][0] - P[0], b[1][1] - P[1])).slice(0, 3).map((q) => q[0]);
    CF.forEach(([x, y], i) => { const a = 'am' + i, last = fail && i === 3; k.add(a, 'Restless Amani', 2.6, x, y);
      if (last) { k.add(a, 'Restless Amani', 9.4, 0, 0).show(a, 2.6, 9.8); k.ring({ on: a, r: 2.6, fx: 'debuff', t0: 2.6, dur: 7.2, color: '#7fb6ff', cn: 'Gravebound Advance', legend: 'the shield: only magic damage breaks it' }); return; }
      const brk = T1 + 0.2 + i * 0.4, mid = [x + (END[i][0] - x) * 0.45, y + (END[i][1] - y) * 0.45]; k.add(a, 'Restless Amani', brk, mid[0], mid[1]).add(a, 'Restless Amani', brk + 1.6, END[i][0], END[i][1]).show(a, 2.6, T1 + 4.2 + i * 0.2);
      k.ring({ on: a, r: 2.6, fx: 'debuff', t0: 2.6, dur: brk - 2.6, color: '#7fb6ff', cn: 'Gravebound Advance', legend: 'the shield: only magic damage breaks it' });
      k.ring({ x: END[i][0], y: END[i][1], r: 1.8, fx: 'puddle', t0: T1 + 4.2 + i * 0.2, dur: L, color: '#9aa0ac', fill: 'rgba(150,155,165,.45)', cn: 'Body', legend: 'Heroic and up: a body stays, to be burned in the intermission' });
      k.link({ from: CAS[i % 3], to: a, t0: 3, t1: brk, color: '#7fb6ff', legend: 'casters break the shields with magic' }); });
    if (fail) { gdzFailBlast(k, 9.8, 'An add reached the well: a raid hit, +5 energy', 0, 14, [], 'Soulcoil Rite'); k.step(0.3).step(2.6).step(9.8);
      k.pause(9, 'Nobody broke this add\'s shield, so it kept walking and reached the well: a raid hit and 5 energy for her.', { on: 'am3', r: 8 });
      return k.done({ title: 'Mistake: an add reached the well', focus: { x: P[0] * 0.6, y: P[1] * 0.6, r: 26 } }); }
    if (!int) { mv(T1 + 4.6, P); mv(L - 0.3, NZ_B); nzAt(k, L - 0.3, NZ_B, 90, { hold: T1 + 4.6 }); }
    k.ring1(['t1'].concat(CAS)).step(0.3).step(2.6).step(T1 + 0.2).step(T1 + 4.2);
    k.pause(T1 + 0.6, int ? 'The Echo\'s tank brings it to the adds. Casters break the shields with magic, and melee cleave the adds down on top of the Echo: that\'s the pile its next pyre burns.' : 'The tank brings the boss to the adds and everyone follows. Casters break the shields with magic, and melee cleave the adds down with her, in one pile.', { x: P[0], y: P[1], r: 16 });
    return k.done({ title: 'Restless Amani: break the shields, cleave them', focus: { x: P[0] * 0.6, y: P[1] * 0.6, r: 26 }, hlLabel: 'the tank and the casters' });
  },
  // Essence Rend: marked players are pulled toward her, then thrown out with a lingering hit; carry on to the edge behind the raid, then
  // healers dispel; a Latent Cultist appears where the dispel lands and slowly circles the room (fail: dispelled at once, in the raid)
  rend(fail) {
    const L = 12, k = gdzKit(NZ, L); nzHome(k); k.cast('nz', 'Essence Rend', 0.3, 1);
    const TG = ['r1', 'r3', 'h2'], EDGE = [[-23.5, -40.7], [-4.1, -46.8], [16.1, -44.2]], HEAL = ['h1', 'h3', 'h4'];
    TG.forEach((id, i) => (fail && i > 0) || k.ring({ on: id, r: 2.6, fx: 'debuff', t0: 1, dur: (fail ? 1.6 : 6.4 + i * 0.2) - 1, color: '#c084ff', cn: 'Essence Rend', legend: 'Essence Rend: pulled in, thrown out, then a lingering hit' }));
    if (fail) { const p = k.posAt('r1', 1.6); k.dispel('h1', 'r1', 1.6); k.add('lc0', 'Latent Cultist', 1.8, p[0], p[1]).show('lc0', 1.8, L); k.ring({ on: 'lc0', r: 4, fx: 'puddle', t0: 1.8, dur: L - 1.8, color: '#c084ff', fill: 'rgba(192,132,255,.3)', cn: 'Latent Cultist', legend: 'a cultist circle: stay out' });
      k.hold(2, 'r1').at(3, 'r1', p[0] - 5.5, p[1] + 1); k.call(2, 6, 'Dispelled too early', { on: 'lc0', color: '#ff3b3b', ink: '#fff' }); k.oops('h1', 1.6); k.step(0.3).step(1.8);
      k.pause(2.8, 'Dispelled at once, in the middle of the ranged: the cultist circle is now where the raid stands, for the rest of the fight.', { on: 'lc0', r: 9 });
      return k.done({ title: 'Mistake: a dispel in the raid', focus: { x: -6, y: -24, r: 20 }, badLabel: 'dispelled too early' }); }
    // (pulled toward her, thrown out toward the edge, then on to the edge, where healers dispel)
    TG.forEach((id, i) => { const p = k.posAt(id, 1), v = [NZ_B[0] - p[0], NZ_B[1] - p[1]], d = Math.hypot(v[0], v[1]) || 1, q = [p[0] + v[0] / d * 4, p[1] + v[1] / d * 4], w = [p[0] + (EDGE[i][0] - p[0]) * 0.6, p[1] + (EDGE[i][1] - p[1]) * 0.6];
      k.hold(1, id).at(3, id, q[0], q[1]).hold(3.1, id).at(4.6, id, w[0], w[1]).hold(4.7, id).at(6.2, id, EDGE[i][0], EDGE[i][1]); k.dispel(HEAL[i], id, 6.4 + i * 0.2); });
    k.call(3.1, 4.6, 'Thrown out', { on: 'r3', color: '#c084ff', ink: '#14061f' });
    EDGE.forEach(([x, y], i) => { const a = 'lc' + i, t0 = 6.9 + i * 0.2, a0 = Math.atan2(y, x), r0 = Math.hypot(x, y); k.add(a, 'Latent Cultist', t0, x, y); for (let t = t0 + 1; t <= L; t += 1) { const ang = a0 - (t - t0) * 0.035; k.add(a, 'Latent Cultist', t, Math.cos(ang) * r0, Math.sin(ang) * r0); } k.show(a, t0, L);
      k.ring({ on: a, r: 4, fx: 'puddle', t0, dur: L, color: '#c084ff', fill: 'rgba(192,132,255,.3)', cn: 'Latent Cultist', legend: 'a cultist circle: it slowly circles the room' }); });
    TG.forEach((id, i) => { const q = k.posAt(id, 0); k.hold(6.4 + i * 0.2, id).at(10.6, id, q[0], q[1]); });
    k.ring1(TG).step(0.3).step(3.1).step(6.4).step(7.6);
    k.pause(7, 'Out at the edge, behind the raid, then dispel. The cultist stays out there, slowly circling the room, far from where the raid stands.', { x: -4, y: -42, r: 18 });
    return k.done({ title: 'Essence Rend: to the edge, then dispel', focus: { x: -2, y: -28, r: 24 }, hlLabel: 'marked players' });
  },
  // Possession Barrage: echoes fly from her toward a tank and burst on arrival for raid damage, less the farther they fly; the tank not
  // holding her runs 30-40 yards out, the raid stays behind her (fail: a melee wanders into the line, an echo bursts early)
  barrage(fail) {
    const L = 13, k = gdzKit(NZ, L); nzHome(k); k.cast('nz', 'Possession Barrage', 0.4, 4.6);
    const T = [34, 4], dir = [(T[0] - NZ_B[0]) / 37, (T[1] - NZ_B[1]) / 37], pp = [-dir[1], dir[0]], IN = [NZ_B[0] + (T[0] - NZ_B[0]) * 0.3, NZ_B[1] + (T[1] - NZ_B[1]) * 0.3];
    k.hold(0.3, 't2').at(4.5, 't2', T[0], T[1]); k.call(0.6, 4.4, 'Tank: run away', { on: 't2', color: '#e6b450', ink: '#141006' });
    if (fail) k.hold(1.4, 'm3').at(4.2, 'm3', IN[0], IN[1]);
    for (let i = 0; i < 5; i++) { const t0 = 4.7 + i * 0.25, hit = fail && i === 0, end = hit ? IN : [T[0] + pp[0] * (i - 2) * 3 - dir[0] * Math.abs(i - 2) * 1.5, T[1] + pp[1] * (i - 2) * 3 - dir[1] * Math.abs(i - 2) * 1.5], tE = t0 + Math.hypot(end[0] - NZ_B[0], end[1] - NZ_B[1]) / 12;
      k.obj('ec' + i, 'ghost', t0, NZ_B[0], NZ_B[1]).obj('ec' + i, 'ghost', tE, end[0], end[1]).show('ec' + i, t0, tE + 0.1);
      k.ring({ x: end[0], y: end[1], r: hit ? 7 : 5, fx: 'burst', t0: tE - 0.5, at: tE, dur: 0.8, color: hit ? '#ff3b3b' : '#c084ff', cn: 'Possession Barrage', legend: 'an echo bursts: raid damage, less the farther it flew' }); if (hit) break; }
    if (fail) { gdzFailBlast(k, 6, 'It burst early: full raid damage', 2, 14, ['m3'], 'Possession Barrage'); k.step(0.4).step(4.7).step(5.8);
      k.pause(5.4, 'A melee walked into the line between her and the running tank: the first echo burst on them, close to her, for full raid damage.', { on: 'm3', r: 8 });
      return k.done({ title: 'Mistake: standing in the echoes\' line', focus: { x: 16, y: -6, r: 24 }, badLabel: 'in the line' }); }
    const q = k.posAt('t2', 0); k.hold(9, 't2').at(13, 't2', q[0], q[1]);
    k.ring1(['t2']).step(0.4).step(4.7).step(9);
    k.pause(5.6, 'The tank who isn\'t holding her runs straight away from the raid. The echoes fly after them and burst on arrival: the farther they fly, the less the raid takes. Nobody steps into that line.', { x: 18, y: -5, r: 20 });
    return k.done({ title: 'Possession Barrage: the tank runs, nobody in between', focus: { x: 16, y: -8, r: 26 }, hlLabel: 'the running tank' });
  },
  // Mythic, Grasping Depths: the well pulls and hurts everyone until its Drowned Echo dies; one hit squad (4 DPS + a healer) touches the
  // well and goes down, kicks the curse late (first kicker, then second), kills the Echo and climbs out; the other squad takes the next one.
  // o.b: squad two; o.E: in the intermission (fail: the curse isn't kicked: the squad is thrown out Soulcoiled)
  depths(fail, o) {
    o = o || {}; const L = 16.2, k = gdzKit(NZ, L), two = !!o.b, SQ = two ? NZ_SQB : NZ_SQA, K1 = two ? 'Melee 4' : 'Melee 1', K2 = two ? 'Melee 5' : 'Melee 2'; nzHome(k, o, L);
    k.ring({ x: 0, y: 0, r: 8.4, fx: 'zone', t0: 0.4, dur: L - 0.4, color: '#7a5cff', fill: 'rgba(90,60,220,.28)', cn: 'Grasping Depths', legend: 'the well pulls and hurts everyone until its Echo dies' });
    k.call(0.5, 3, 'The well pulls', { x: 0, y: 12, color: '#7a5cff', ink: '#fff' }); k.add('de', 'Drowned Echo', 1, 0, 2).show('de', 1, fail ? 8.2 : 11);
    // (the squad touches the well and goes down: drawn standing on the well, round its Echo)
    SQ.forEach((id, i) => { const a = [-10, 40, 90, 140, 190][i]; k.hold(0.3, id).at(5, id, Math.cos(a * Math.PI / 180) * 6, 2 + Math.sin(a * Math.PI / 180) * 6); });
    k.cast('de', 'Soulcoiler\'s Curse', 5.2, 7.8, fail ? 'done' : 'kick', K1); if (!fail) k.cast('de', 'Soulcoiler\'s Curse', 8.4, 10.8, 'kick', K2);
    if (fail) { SQ.forEach((id) => { const p = k.posAt(id, 7.8), d = Math.hypot(p[0], p[1]) || 1; k.hold(7.8, id).at(9.2, id, p[0] / d * 17, p[1] / d * 17); k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 8.2, dur: L - 8.2, color: '#ff3b3b', cn: 'Soulcoiled', legend: 'Soulcoiled: thrown out of the well' }); });
      k.call(7.9, 9.6, 'Thrown out', { x: 0, y: 18, color: '#ff3b3b', ink: '#fff' }); gdzFailBlast(k, 10.2, 'Curse not kicked: the squad is sacrificed', 0, 22, SQ.slice(0, 2), 'Soulcoiler\'s Curse'); k.step(0.4).step(1).step(7.8);
      k.pause(8.2, 'Nobody kicked the curse. It threw the whole squad out of the well, Soulcoiled, and the Echo is still alive.', { x: 0, y: 0, r: 17 });
      return k.done({ title: 'Mistake: the curse not kicked', focus: { x: 0, y: -4, r: 20 }, badLabel: 'thrown out' }); }
    k.ring({ on: 'de', r: 6, fx: 'burst', t0: 10.6, at: 11, dur: 0.8, color: '#ffd23b', cn: 'Drowned Echo dies', legend: 'the Echo dies: the pull stops' });
    SQ.forEach((id) => { const q = k.posAt(id, 0); k.hold(11.2, id).at(16, id, q[0], q[1]); k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 11.4, dur: L - 11.4, color: '#5b3fbf', cn: 'Soul Exhaustion', legend: 'Soul Exhaustion: this squad can\'t go down next time' }); });
    k.call(11.8, 15.8, two ? 'Next time: squad one' : 'Next time: squad two', { on: two ? 'm1' : 'm5', color: '#e6b450', ink: '#141006' });
    k.ring1(SQ).step(0.4).step(1).step(7).step(11.2);
    k.pause(7.2, (two ? 'Squad two' : 'Squad one') + ' is down in the well. Kick the curse late in its cast, first kicker then second, dodge the circles and spirits down there, and kill the Echo.', { x: 0, y: 0, r: 12 });
    return k.done({ title: 'Grasping Depths: hit squads take turns', focus: { x: 0, y: -8, r: 24 }, hlLabel: 'this round\'s squad' });
  },
  // the intermission at 50%: she floats over the well (free damage on the way) and can't be hurt while her Echoes live. Each Echo comes in
  // by a door: its tank stands in the doorway, so Soul Transfer's frontal (at the end of a 15-second cast) points into the door and the raid
  // stays behind it, on the room side. o.two: the second Echo, by the east door (fail: a melee in front at the end of the cast)
  echoes(fail, o) {
    o = o || {}; const two = !!o.two, sx = two ? 1 : -1, L = 15, k = gdzKit(NZ, L), E = [sx * 40, 0], th = two ? 0 : 180, TD = [sx * 45.5, 0];
    if (two) nzHome(k, o, L); else { nzHome(k); nzBoss(k, 0.3); k.boss('nz', NZ, 2.6, NZ_IB[0], NZ_IB[1]); k.call(0.4, 2.6, 'Free damage', { on: 'nz', color: '#7ee36a', ink: '#0a1a06' });
      k.ring({ on: 'nz', r: 4, fx: 'safe', t0: 2.7, dur: L - 2.7, color: '#b9a6ff', cn: 'Tether of Awakening', legend: 'immune while her Echoes live' }); }
    // (the tank heads for the doorway first; the Echo walks in; the raid gathers behind it, on the room side)
    k.hold(0.4, 't1'); nzGo(k, 0.4, 7, 't1', TD); k.call(0.6, 4, 'To the doorway', { on: 't1', color: '#5aa0ff', ink: '#fff' });
    k.add('ex', 'Echo of Jawae', 5.4, sx * 50.5, 0).add('ex', 'Echo of Jawae', 6.8, E[0], E[1]).show('ex', 5.4, L);
    nzAt(k, 10, E, th, { wings: true, hold: 0.6, skip: ['t1'].concat(fail ? ['m1'] : []) }); if (fail) { const q = nzAdd(E, th + 180 - 50, 6); k.hold(0.6, 'm1'); nzGo(k, 0.6, 9, 'm1', q); k.hold(10, 'm1').at(11.8, 'm1', sx * 46.5, -4.5); }
    k.cast('ex', 'Soul Transfer', 7.2, 12.2); k.call(10.6, 12.4, 'Out of its front', { x: sx * 30, y: 15, color: '#c084ff', ink: '#14061f' });
    k.cone({ from: 'ex', deg: th, r: 40, width: 90, at: 12.4, color: '#c084ff', legend: 'Soul Transfer: the Echo\'s frontal, at the end of its cast' });
    if (fail) { ulHit(k, 'm1', 12.4, 'Soul Transfer'); k.oops('m1', 12.4); k.step(0.3).step(5.4).step(12.4);
      k.pause(12.7, 'This melee walked round to the Echo\'s front and was still there when its cast ended: Soul Transfer hits for over a million.', { on: 'm1', r: 8 });
      return k.done({ title: 'Mistake: in front at the end of the cast', focus: { x: sx * 36, y: 0, r: 18 }, badLabel: 'hit by the frontal' }); }
    k.call(12.8, 14.8, two ? 'Then to the east pile' : 'Then to a body pile', { on: 't1', color: '#e6b450', ink: '#141006' });
    k.ring1(['t1']).step(0.3).step(5.4).step(10).step(12.8);
    k.pause(10.6, (two ? 'Echo two comes in by the east door. ' : 'Echo one comes in by the west door. ') + 'Its tank stands in the doorway, so the big frontal at the end of each cast points into the door. Everyone else stays behind it.', { on: 'ex', r: 12 });
    return k.done({ title: two ? 'Echo two: tank it in the doorway' : 'Intermission: tank the Echo in the doorway', focus: { x: sx * 30, y: 0, r: 24 }, hlLabel: 'the Echo\'s tank' });
  },
  // Hungering Pyre: a fire soak on the Echo's tank, split between everyone within 10 yards (the real hit is smaller: stand in the dead
  // centre); it burns the bodies it hits. Everyone it misses gets Slithering Flame; on Heroic+ that becomes Cremation, a small fire circle
  // round them for about 20 seconds that burns any body it touches: ranged walk theirs over the bodies left (fail: one is left, it comes back)
  pyre(fail, o) {
    o = o || NZ_PY[0]; const L = 12.5, k = gdzKit(NZ, L), E = o.E, th = o.th, b = th + 180, T = nzAdd(E, th, 5.5); nzHome(k, { E, th }, L);
    const SO = ['t2', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], SA = [[4.5, b + 80], [4.5, b + 200], [4.5, b + 320], [8.3, b + 50], [8.3, b + 110], [8.3, b + 170], [8.3, b + 230], [8.3, b + 290]];
    SO.forEach((id, i) => { const q = nzAdd(T, SA[i][1], SA[i][0]); k.hold(0.5, id).at(3.4, id, q[0], q[1]); });
    const BIN = [[1.5, th + 30], [3, th + 150], [4.5, th - 60], [5, th + 90], [2.5, th - 140], [5.5, th + 200]].map(([r, a]) => nzAdd(T, a, r)), BEDGE = [nzAdd(T, th + 80, 10.8), nzAdd(T, th - 40, 10.8)];
    BIN.forEach(([x, y]) => k.ring({ x, y, r: 1.8, fx: 'puddle', t0: 0, dur: 4.4, color: '#9aa0ac', fill: 'rgba(150,155,165,.45)', cn: 'Body', legend: 'a body: burn it or it comes back' }));
    BEDGE.forEach(([x, y], i) => k.ring({ x, y, r: 1.8, fx: 'puddle', t0: 0, dur: fail && i === 1 ? 9.2 : 8.8, color: '#9aa0ac', fill: 'rgba(150,155,165,.45)', cn: 'Body', legend: 'a body: burn it or it comes back' }));
    k.cast('ej', 'Hungering Pyre', 0.5, 4.2); k.ring({ on: 't1', r: 10, fx: 'soak', t0: 0.6, at: 4.2, dur: 3.8, color: '#ff8a3b', cn: 'Hungering Pyre', legend: 'Hungering Pyre: split between everyone inside; the real hit is smaller' });
    k.call(1, 4, 'Dead centre', { on: 't1', color: '#ff8a3b', ink: '#1a0a00' });
    nzAt(k, 7.2, E, th, { wings: true, hold: 4.6, skip: ['t1', 'h1', 'h2', 'h3', 'h4'].concat(NZ_RNG.filter((id) => id[0] === 'r')) });
    const OUT = NZ_RNG; OUT.forEach((id) => k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 4.4, dur: 3, color: '#ff8a3b', cn: 'Slithering Flame', legend: 'Slithering Flame: a burn on everyone the pyre missed' }));
    // (the two ranged nearest the bodies left walk their fire circles onto them)
    const WK = []; BEDGE.forEach((p, i) => { const id = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'].filter((x) => !WK.includes(x)).sort((a, c) => { const pa = k.posAt(a, 4.4), pc = k.posAt(c, 4.4); return Math.hypot(pa[0] - p[0], pa[1] - p[1]) - Math.hypot(pc[0] - p[0], pc[1] - p[1]); })[0]; WK.push(id); });
    WK.forEach((id, i) => { if (fail && i === 1) return; const p = BEDGE[i]; k.hold(4.6, id).at(8.4, id, p[0] - 1.2, p[1] - 1.2); k.ring({ on: id, r: 4, fx: 'zone', t0: 7.4, dur: L - 7.4, color: '#ff8a3b', fill: 'rgba(255,138,59,.25)', cn: 'Cremation', legend: 'Heroic and up: Cremation, a small fire circle round you that burns any body it touches' }); });
    if (fail) { k.add('rv', 'Restless Amani', 9.2, BEDGE[1][0], BEDGE[1][1]).show('rv', 9.2, L); k.ring({ on: 'rv', r: 14, fx: 'zone', t0: 9.2, dur: L - 9.2, color: '#ff3b3b', cn: 'Vessel of Awakening', legend: 'a body came back: it pulses heavy raid damage' });
      gdzFailBlast(k, 10, 'A body came back: kill it now', E[0], E[1] - 16, [], 'Vessel of Awakening'); k.step(0.5).step(4.2).step(9.2);
      k.pause(9.6, 'One body at the edge of the pile was missed and nobody walked a fire circle over it: it came back, pulsing heavy damage. Swap to it at once; two of these wipe the raid.', { on: 'rv', r: 10 });
      return k.done({ title: 'Mistake: a body left to come back', focus: { x: T[0], y: T[1], r: 18 }, badLabel: 'the missed body' }); }
    k.ring1(['t1'].concat(WK)).step(0.5).step(2).step(4.2).step(7.4);
    k.pause(4.6, 'The pyre\'s real hit is smaller than its circle: tanks and melee stack in the dead centre. Two bodies at the edge survived, so two ranged walk their fire circles onto them.', { x: T[0], y: T[1], r: 13 });
    return k.done({ title: 'Hungering Pyre: dead centre on a body pile', focus: { x: T[0], y: T[1], r: 22 }, hlLabel: 'the Echo\'s tank, and the ranged burning the last bodies' });
  },
  // phase 2, Invoke: Soulcoil Rite on everyone and the cultist circles dash to new spots round the edge (Entwined Step): watch the arrows
  // and step out of their paths; Mythic: stop casting before it lands or you're silenced (fail: a ranged stays in a circle's path)
  invoke(fail, d) {
    const myth = d !== 'h', L = 11, k = gdzKit(NZ, L); nzBoss(k); nzAt(k, 0, NZ_B, 90, { skip: ['r6'] });
    const V = [-13.3, -43.5]; k.at(0, 'r6', V[0], V[1]);
    k.call(0.3, 3, 'Bloodlust, cooldowns', { x: 0, y: 13, color: '#e6b450', ink: '#141006' }); k.cast('nz', 'Invoke', 1, 6);
    const FROM = [-120, -95, -70].map((a) => nzU(a, 47)), TO = [-150, -125, -100].map((a) => nzU(a, 47));
    FROM.forEach(([x, y], i) => { const a = 'lc' + i; k.add(a, 'Latent Cultist', 0, x, y).add(a, 'Latent Cultist', 6, x, y).add(a, 'Latent Cultist', 6.9, TO[i][0], TO[i][1]).show(a, 0, L);
      k.ring({ on: a, r: 4, fx: 'puddle', t0: 0, dur: L, color: '#c084ff', fill: 'rgba(192,132,255,.3)', cn: 'Latent Cultist', legend: 'a cultist circle: on Invoke it dashes to a new spot' });
      k.link({ from: a, toYd: { x: TO[i][0], y: TO[i][1] }, t0: 2, t1: 6.2, color: '#c084ff', legend: 'where each cultist circle will dash' }); });
    if (!fail) k.hold(3.2, 'r6').at(5, 'r6', -15, -35.5);
    if (myth) k.call(4.6, 6.1, 'Stop casting', { x: 2, y: 18, color: '#ff8a8a', ink: '#200a0a' });
    k.call(6, 7.6, 'Raid hit', { x: 0, y: 13, color: '#c084ff', ink: '#14061f' });
    if (fail) { ulHit(k, 'r6', 6.5, 'In the path'); k.oops('r6', 6.5); k.step(0.3).step(1).step(6.5);
      k.pause(6.8, 'This ranged stood in a cultist\'s path: the circle dashed straight through them.', { on: 'r6', r: 8 });
      return k.done({ title: 'Mistake: in a cultist\'s path', focus: { x: -12, y: -34, r: 18 }, badLabel: 'in the path' }); }
    k.ring1(['r6']).step(0.3).step(1).step(3.2).step(6);
    k.pause(5.2, myth ? 'Invoke: the cultist circles are about to dash to new spots round the edge. Watch the arrows and step out of their paths, and stop casting before it lands.' : 'Invoke: the cultist circles are about to dash to new spots round the edge. Watch the arrows and step out of their paths.', { x: -16, y: -38, r: 18 });
    return k.done({ title: 'Invoke: the circles move', focus: { x: -6, y: -26, r: 26 }, hlLabel: 'a ranged stepping out of a path' });
  },
};
const NZ_FAIL = {
  ignite: { name: 'Standing where a spirit lands', what: 'A player stays where a spirit is landing: a big hit and a knockback, in the middle of five raid hits.', do: ['Spirits rise from the well.', 'One player doesn\'t move.', 'Hit and knocked back.'], map: () => NZ_M.ignite(true) },
  amani: { name: 'An add reaches the well', what: 'Nobody breaks one add\'s shield, so it walks into the well: a raid hit and 5 energy for her.', do: ['The adds come out.', 'One add\'s shield is never broken.', 'It reaches the well: raid hit, +5 energy.'], map: () => NZ_M.amani(true) },
  rend: { name: 'A dispel in the raid', what: 'Essence Rend is dispelled at once, in the middle of the raid: the cultist circle stays there all fight.', do: ['Essence Rend goes out.', 'A healer dispels at once.', 'A cultist circle in the raid.'], map: () => NZ_M.rend(true) },
  barrage: { name: 'Standing in the echoes\' line', what: 'A melee walks into the line between the boss and the running tank: the first echo bursts early, for full raid damage.', do: ['Barrage starts.', 'A melee steps into the line.', 'An echo bursts early: full raid damage.'], map: () => NZ_M.barrage(true) },
  depths: { name: 'The curse not kicked', what: 'Nobody kicks the Drowned Echo\'s curse: the whole squad is thrown out of the well, Soulcoiled.', do: ['The squad goes down.', 'The curse isn\'t kicked.', 'The squad is thrown out and sacrificed.'], map: () => NZ_M.depths(true) },
  echoes: { name: 'In front at the end of the cast', what: 'A melee walks round to the Echo\'s front and is still there when Soul Transfer\'s cast ends: over a million damage.', do: ['The Echo casts.', 'A melee goes round to its front.', 'The frontal hits them.'], map: () => NZ_M.echoes(true) },
  pyre: { name: 'A body left to come back', what: 'A body at the edge of the pile is missed and nobody burns it: it comes back pulsing heavy damage.', do: ['The pyre goes off.', 'A body at its edge survives.', 'It comes back: kill it now.'], map: () => NZ_M.pyre(true) },
  invoke: { name: 'In a cultist\'s path', what: 'A player stands in the path of a cultist circle when Invoke moves it: it dashes straight through them.', do: ['Invoke starts.', 'A player stays in a path.', 'The circle dashes through them.'], map: (d) => NZ_M.invoke(true, d) },
};
// ---- the whole fight, by Wolfthorn's Mythic kill's clock (6:59)
const NZ_BEATS = {
  start: { name: 'The pull (Behind her, south of the well)', do: ['The boss tank takes her at the south edge of the well, standing between her and the well. Melee behind her, ranged and healers spread out behind them.', 'Nobody touches the well unless it\'s their turn to go down. Save Bloodlust for phase two.'],
    run() { const k = gdzKit(NZ, 4); nzHome(k); k.ring1(['t1']).step(0.2); } },
  int: { name: 'Into the intermission (50%)', do: ['At 50% she floats over the well. Hit her on the way: it\'s free damage.', 'Use one 2-minute cooldown in the intermission; save the second and Bloodlust for phase two.'],
    run() { const k = gdzKit(NZ, 4); nzHome(k); nzBoss(k, 0.3); k.boss('nz', NZ, 3, NZ_IB[0], NZ_IB[1]); k.call(0.4, 3, 'Free damage', { on: 'nz', color: '#7ee36a', ink: '#0a1a06' }); k.step(0.2); } },
  p2: { name: 'Phase two (Bloodlust and burn)', do: ['The second Echo is dead: she comes back. Bloodlust and every cooldown now.', 'From here the raid takes damage all the time: kill her before she reaches 100 energy.'],
    run() { const k = gdzKit(NZ, 4); k.boss('nz', NZ, 0, NZ_IB[0], NZ_IB[1]).boss('nz', NZ, 3, NZ_B[0], NZ_B[1]); nzAt(k, 0, NZ_B, 90); k.call(0.3, 3.6, 'Bloodlust', { x: 0, y: 13, color: '#e6b450', ink: '#141006' }); k.step(0.2); } },
  kill: { name: 'The kill', do: ['A race to the end: keep every add out of the well and burn her before 100 energy.'],
    run() { const k = gdzKit(NZ, 5); nzHome(k); k.ring({ on: 'nz', r: 7, fx: 'burst', t0: 1.4, at: 2, dur: 0.8, color: '#ffd23b', cn: 'Nek\'zali dies', legend: 'the kill' }); k.show('nz', 0, 2.2); k.call(2.3, 4.6, 'Kill', { x: 2, y: -6 }); k.step(0.3); } },
};
const NZ_SIM = [
  { at: 0, beat: 'start' }, { at: 0.5, mech: 'ignite', label: 'Soulcoil Ignition 1' }, { at: 16, mech: 'rend', label: 'Essence Rend 1' }, { at: 28, mech: 'barrage', label: 'Possession Barrage 1' }, { at: 43, mech: 'depths', label: 'Grasping Depths 1 (Squad one)' },
  { at: 53, mech: 'amani', label: 'Restless Amani 1 (east)', o: { th0: -23 } }, { at: 58, mech: 'rend', label: 'Essence Rend 2' }, { at: 64, mech: 'barrage', label: 'Possession Barrage 2' }, { at: 73, mech: 'ignite', label: 'Soulcoil Ignition 2' },
  { at: 90, mech: 'rend', label: 'Essence Rend 3' }, { at: 99, mech: 'barrage', label: 'Possession Barrage 3' }, { at: 114, mech: 'depths', label: 'Grasping Depths 2 (Squad two)', o: { b: 1 } }, { at: 121, mech: 'amani', label: 'Restless Amani 2 (southeast)', o: { th0: -46.5, r: 26 } },
  { at: 130, mech: 'rend', label: 'Essence Rend 4' }, { at: 135, mech: 'barrage', label: 'Possession Barrage 4' }, { at: 145, mech: 'ignite', label: 'Soulcoil Ignition 3' },
  { at: 150, beat: 'int', ph: 1 }, { at: 160, mech: 'echoes', ph: 1, label: 'Echo of Jawae 1 (west door)' }, { at: 180, mech: 'pyre', ph: 1, label: 'Hungering Pyre 1 (northwest pile)', o: NZ_PY[0] },
  { at: 196, mech: 'depths', ph: 1, label: 'Grasping Depths 3 (Squad one)', o: NZ_PY[0] }, { at: 202, mech: 'amani', ph: 1, label: 'Restless Amani in the intermission (southwest)', o: { E: NZ_PY[0].E, th: NZ_PY[0].th, P: NZ_PY[1].E, pth: NZ_PY[1].th } },
  { at: 214, mech: 'pyre', ph: 1, label: 'Hungering Pyre 2 (southwest pile)', o: NZ_PY[1] }, { at: 227, mech: 'echoes', ph: 1, label: 'Echo of Jawae 2 (east door)', o: { two: 1, E: NZ_PY[1].E, th: NZ_PY[1].th, noEcho: 1 } },
  { at: 245, mech: 'pyre', ph: 1, label: 'Hungering Pyre 3 (east pile)', o: NZ_PY[2] }, { at: 261, mech: 'depths', ph: 1, label: 'Grasping Depths 4 (Squad two)', o: { b: 1, E: NZ_PY[2].E, th: NZ_PY[2].th } },
  { at: 268, mech: 'amani', ph: 1, label: 'Restless Amani in the intermission (northwest)', o: { E: NZ_PY[2].E, th: NZ_PY[2].th, P: NZ_PY[3].E, pth: NZ_PY[3].th, via: 1 } }, { at: 280, mech: 'pyre', ph: 1, label: 'Hungering Pyre 4 (northwest pile)', o: NZ_PY[3] },
  { at: 295, beat: 'p2', ph: 2 }, { at: 296, mech: 'depths', ph: 2, label: 'Grasping Depths 5 (Squad one)' }, { at: 302, mech: 'amani', ph: 2, label: 'Restless Amani (west)', o: { th0: 170, r: 30, T1: 7 } }, { at: 308, mech: 'invoke', ph: 2, label: 'Invoke 1' },
  { at: 340, mech: 'barrage', ph: 2, label: 'Possession Barrage' }, { at: 356, mech: 'invoke', ph: 2, label: 'Invoke 2' }, { at: 357, mech: 'rend', ph: 2, label: 'Essence Rend' }, { at: 363, mech: 'depths', ph: 2, label: 'Grasping Depths 6 (Squad two)', o: { b: 1 } },
  { at: 370, mech: 'amani', ph: 2, label: 'Restless Amani (north)', o: { th0: 90, r: 23 } }, { at: 388, mech: 'invoke', ph: 2, label: 'Invoke 3' }, { at: 419, beat: 'kill', ph: 2 },
];
const NZ_DUR = { 'm:ignite': 9, 'm:rend': 6, 'm:barrage': 8, 'm:depths': 20, 'm:amani': 18, 'm:echoes': 20, 'm:pyre': 8, 'm:invoke': 5, 'b:start': 2, 'b:int': 6, 'b:p2': 4, 'b:kill': 0 };
const NZ_SEV = { 'm:ignite': 2, 'm:rend': 1, 'm:barrage': 2, 'm:depths': 3, 'm:amani': 3, 'm:echoes': 2, 'm:pyre': 3, 'm:invoke': 2, 'b:start': 1, 'b:int': 1, 'b:p2': 1, 'b:kill': 1 };
GDZ['Nek\'zali the Soulcoiler'] = {
  upd: ['12.1', 'Oct 21, 2026'],
  stepRoles: {
    'Soulcoil Ignition (Heal through it, dodge the spirits)': ['', 'h', ''], 'Restless Amani (Break the shields, cleave them)': ['t', 'd', 'td', ''], 'Essence Rend (To the edge, then dispel)': ['', '', 'h', ''],
    'Possession Barrage (Tank runs, nobody in between)': ['t', '', ''], 'Grasping Depths (Hit squads take turns)': ['', '', 'd', ''], 'Echoes of Jawae (Tank it in the doorway)': ['', 't', '', 't'],
    'Hungering Pyre (Dead centre on a body pile)': ['t', 'td', '', 'd'], 'Invoke (The circles move)': ['', '', 'dh', ''],
  },
  sum: 'Everything turns around the well in the middle. Keep every add out of it, take Essence Rend to the edge, and let a tank run Possession Barrage away from you. At 50% kill her two Echoes and burn every body pile with their pyres, then Bloodlust and race her to the end.',
  m: { sim: NZ_SIM, simDur: NZ_DUR, simSev: NZ_SEV, beats: NZ_BEATS,
    simAlways: ['No add may reach the well: each one hits the raid and gives her 5 energy.', 'Essence Rend circles stay all fight: drop them at the edge, behind the raid.', 'Grasping Depths comes all fight long: the two hit squads take turns.', 'Every body pile you make in phase one gets burned in the intermission.'],
    source: 'Tactyks\' Mythic Nek\'zali video', sum: 'Heroic plus hit squads: all fight long the well pulls the raid in until a squad of 4 DPS and a healer goes down, kicks the Drowned Echo\'s curse and kills it. Invoke now silences anyone casting.' },
  facts: [['Phases', '2 + intermission at 50%'], ['Bloodlust', 'Phase two'], ['Healers', '4', 'm'], ['Hardest part', 'Adds reaching the well'], ['Fight length', 'About 7 minutes', 'm']],
  phases: [
    { id: 'p1', name: 'Phase 1: the well', sum: 'Her Ignitions fill her energy a quarter at a time; adds that reach the well fill it faster. Push her to 50% before the fourth Ignition.',
      m: { sum: 'The same, plus Grasping Depths: twice a phase the well pulls the raid in until a hit squad kills its Echo.' },
      mechs: [
        { id: 'ignite', fail: NZ_FAIL.ignite, name: 'Soulcoil Ignition (Heal through it, dodge the spirits)', spell: 'Soulcoil Ignition', what: 'About every 73 seconds she floats over the well and stirs it: five raid hits with a DoT that stacks, and 25 energy for her. Spirits rise out of it and land on players: a big hit and a knockback within 5 yards.',
          do: ['She floats over the well and stirs it. The raid stays put.', 'Five raid hits: healers, a cooldown for each Ignition.', 'Spirits come out of the well: step out of the circle where one lands.'],
          map: () => NZ_M.ignite() },
        { id: 'amani', fail: NZ_FAIL.amani, name: 'Restless Amani (Break the shields, cleave them)', spell: 'Gravebound Advance', what: 'Coffins light up on one side of the room and adds come out, walking for the well behind a shield that only magic damage breaks. One that reaches the well hits the raid and gives her 5 energy.',
          do: ['Coffins light up: adds are coming. The tank drags the boss toward them, and everyone follows.', 'They walk for the well behind a shield only magic breaks: casters, on the shields.', 'Shields down: they\'re normal adds now. Cleave them down with the boss.', 'Bodies stay on Heroic and up: kill them together, in one pile.'],
          m: { plan: ['Death Grip, slows, knockbacks and Ursol\'s all work on them, shield or not.', 'Hunters do physical damage: they can\'t break shields. Warlocks, Shadow Priests and Boomkins can.', 'As long as no add reaches the well, boss damage hardly matters in phase one.', 'Remember where each pile is: the intermission\'s pyres go on them.'] },
          map: (d, o) => NZ_M.amani(false, o) },
        { id: 'rend', fail: NZ_FAIL.rend, name: 'Essence Rend (To the edge, then dispel)', spell: 'Essence Rend', what: 'A few players are pulled toward her, then thrown out with a lingering hit you can dispel. Where the dispel lands, a cultist circle appears and stays all fight, slowly circling the room.',
          do: ['Marked? You\'re pulled in, then thrown out.', 'Keep going to the edge of the room, behind the raid.', 'At the edge, healers dispel. A cultist circle appears there.', 'It slowly circles the room: keep away from it.'],
          m: { plan: ['Healers: don\'t dispel early. It also soaks up healing, so don\'t race it.', 'Pick a side of the room for the circles and keep them there.'] },
          map: () => NZ_M.rend() },
        { id: 'barrage', fail: NZ_FAIL.barrage, name: 'Possession Barrage (Tank runs, nobody in between)', spell: 'Possession Barrage', what: 'Echoes fly from her toward a tank and burst on arrival for raid damage: the farther they fly, the less it hurts.',
          do: ['The tank who isn\'t holding her runs straight away from the raid, 30 to 40 yards.', 'Everyone else stays behind her.', 'Nobody steps into the line between her and that tank.'],
          map: () => NZ_M.barrage() },
        { id: 'depths', only: 'm', fail: NZ_FAIL.depths, name: 'Grasping Depths (Hit squads take turns)', spell: 'Grasping Depths', what: 'All fight long, a Drowned Echo wakes in the well: it pulls the raid toward the well and hurts everyone until it dies. Touch the well to go down and fight it. Leaving gives Soul Exhaustion, so nobody goes twice in a row.',
          do: ['The well pulls and hurts everyone until its Echo dies.', 'This round\'s squad touches the well and goes down: 4 DPS and a healer.', 'Kick its curse late in the cast: first kicker, then second.', 'Echo dead: climb out. The other squad takes the next one.'],
          plan: ['Two squads of 4 DPS and a healer, alternating. Send physical DPS (Warriors, Hunters, Monks, Rogues, Death Knights).', 'Keep Warlocks, Shadow Priests and Boomkins upstairs: they break the add shields.', 'Two melee kicks or three ranged kicks cover each curse. Kick late in the cast.', 'Down there, dodge the circles on the floor and the swirling spirits.'],
          map: (d, o) => NZ_M.depths(false, o) },
      ],
      tiles: [
        { name: 'Hollowing Strikes (Swap at 7-9 stacks)', do: 'Her hits lower the tank\'s healing taken. Swap around 7 to 9 stacks. One tank can take every Possession Barrage.' },
        { name: 'Her energy (Keep the adds out of the well)', do: 'Each Ignition gives her 25 energy and each add in the well 5. At 100 she enrages. Push her to 50% before the fourth Ignition.' },
      ] },
    { id: 'int', name: 'Intermission: the Echoes', sum: 'At 50% she floats over the well and can\'t be hurt while her two Echoes live. Kill them one at a time, and burn every body pile with their pyres.',
      mechs: [
        { id: 'echoes', fail: NZ_FAIL.echoes, name: 'Echoes of Jawae (Tank it in the doorway)', spell: 'Soul Transfer', what: 'Two Echoes protect her, one at a time: the first comes in by the west door, the second by the east door. Each has a big frontal that goes off at the end of a 15-second cast. Adds keep coming.',
          do: ['She floats over the well: free damage on the way.', 'The Echo comes in by the door. Its tank stands in the doorway, so the frontal points into the door.', 'Everyone else stays behind the Echo, on the room side.', 'Then its tank takes it from body pile to body pile for the pyres.'],
          m: { plan: ['Adds keep coming in the intermission: pile them where the Echo\'s next pyre will go (Ursol\'s, grips, knockbacks).', 'The order of the piles: Echo one, northwest then southwest; Echo two, east then northwest.', 'One 2-minute cooldown here; save the second and Bloodlust for phase two.'] },
          map: (d, o) => NZ_M.echoes(false, o) },
        { id: 'pyre', fail: NZ_FAIL.pyre, name: 'Hungering Pyre (Dead centre on a body pile)', spell: 'Hungering Pyre', what: 'A fire soak on the Echo\'s tank, split between everyone within 10 yards; it burns every body it hits. Everyone it misses gets a burn, which on Heroic and up becomes a small fire circle round them for about 20 seconds that burns any body it touches.',
          do: ['The Echo\'s tank stands it on a body pile.', 'Tanks and melee stack in the dead centre, on that tank. Everyone else stays out.', 'The pyre burns the bodies it hits.', 'Ranged: walk your fire circle over any body left, here or in another pile.'],
          m: { plan: ['The real hit is smaller than its circle: dead centre, or bodies at the edge survive.', 'Ranged can stand on loose bodies before the pyre lands.', 'A body that comes back pulses heavy damage: swap to it at once. One is fine; two or more wipe.'] },
          map: (d, o) => NZ_M.pyre(false, o) },
      ] },
    { id: 'p2', name: 'Phase 2: Uncoiling', sum: 'She comes back with her energy at zero. The raid takes damage all the time now: Bloodlust, everything, and kill her before she fills again.',
      m: { sum: 'The same, plus Grasping Depths all phase, and Invoke silences anyone casting when it lands.' },
      mechs: [
        { id: 'invoke', fail: NZ_FAIL.invoke, name: 'Invoke (The circles move)', spell: 'Invoke', what: 'She calls the Rite again (a raid hit) and the cultist circles dash to new spots round the edge. On Mythic it also silences anyone casting when it lands.',
          do: ['Phase two: Bloodlust and cooldowns. The raid takes damage all the time now.', 'Invoke: the circles will move. Watch the arrows.', 'Stop casting before it lands.', 'Step out of the circles\' new paths.'],
          map: (d) => NZ_M.invoke(false, d) },
      ],
      tiles: [
        { name: 'Bloodlust (Phase two)', do: 'Use Bloodlust as phase two starts, with your second round of cooldowns. Holding it 30 to 50 seconds to line up is fine.' },
      ] },
  ],
  roles: {
    t: ['Drag the boss to each set of adds so melee cleave both.', 'Possession Barrage: the tank not holding her runs straight away from the raid, 30-40 yards.', 'Swap around 7-9 stacks of Hollowing Strikes.', 'Intermission: tank the Echo in its doorway, then take it from body pile to body pile for each pyre.'],
    h: ['Essence Rend: dispel only at the edge.', 'Ignition: five raid hits, a cooldown each time.', 'Phase two: the damage never stops; plan cooldowns for each Invoke.'],
    d: ['Casters break the add shields with magic; everyone cleaves them.', 'Never let an add reach the well.', 'Ranged: walk your fire circle over the bodies the pyre misses.', 'Mythic: hit squads take turns in the well; kick the curse late.'],
  },
};

// ===== Vashnik the Malignant (notes/Guides/Bosses/4 Vashnik the Malignant.md: Tactyks' Mythic video read in full, the spell text, and
// Wolfthorn's Mythic kill NcF2XLYmMQ4Bbnqh #27 (6:51) for the clock and the spots). Drawn on the room picture square to the page (the
// room sits turned 60 degrees in the game, like Sentinels: ARENAS rot -60): yards from the picture's centre, x right, y up. The Malignant
// Cavity in the middle (about 30 by 50 yards), the Blood fountain at the top, Flame bottom-left, Shadow bottom-right, the entrance at the
// bottom. Spots from the kill were turned into this frame: Imbibe with the boss by the Shadow fountain, the first Plague Froth lined up
// south-west of the Shadow side, toward Flame.
GDZ_ORIGIN['Vashnik the Malignant'] = { cx: 272.2, cy: 451.3 }; GDZ_FULL['Vashnik the Malignant'] = { x: 0, y: -26, r: 66 };
const VA = 'Vashnik the Malignant', VA_I = [36, -40], VA_LW = [-19, -54], VA_S = [56, -56], VA_F = [-59, -56], VA_B = [0, 80], VA_C = [0, 1];
// the Froth markers for the first set, on a slightly slanted line (the waves go north, south, east and west in the game, which is turned
// on this picture): X, triangle and moon for ranged; diamond and star for melee, with the boss and the melee stacked between them
const VA_MK = { cross: [-8, -24], triangle: [-10.5, -29], moon: [-13, -34], diamond: [-16.5, -44], star: [-22, -64] };
const VA_WD = [30, -60, -150, 120]; /* (the four wave directions on this picture: the game's north, east, south and west) */
const vaBoss = (k, t, P) => k.boss('va', VA, t || 0, (P || VA_I)[0], (P || VA_I)[1]);
// the raid round the boss at P, its tank on side th: melee behind in two rows, ranged and healers further back
function vaRaid(k, t, P, th, o) { o = o || {}; const s = new Set(o.skip || []), b = th + 180;
  if (!s.has('t1')) { const q = nzAdd(P, th, 5.5); if (o.hold != null) k.hold(o.hold, 't1'); k.at(t, 't1', q[0], q[1]); } if (!s.has('t2')) { const q = nzAdd(P, th - 100, 9); if (o.hold != null) k.hold(o.hold, 't2'); k.at(t, 't2', q[0], q[1]); }
  nzArc(k, t, NZ_MEL, P, [[6, b - 50, b, b + 50], [12, b - 60, b - 20, b + 20, b + 60]], o.hold, s);
  nzArc(k, t, NZ_RNG, P, [[18.5, b - 70, b - 42, b - 14, b + 14, b + 42, b + 70], [25, b - 60, b - 30, b, b + 30, b + 60]], o.hold, s); return k; }
const vaHome = (k) => { vaBoss(k); vaRaid(k, 0, VA_I, -38); };
const VA_LS = [[10, -38], [16, -34], [18, -48], [24, -44], [22, -30], [24, -52], [30, -40], [20, -58], [30, -48], [28, -26], [28, -58], [36, -44]], VA_LO = ['t2', 'h1', 'h2', 'h3', 'h4', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'];
function vaLawn(k, t, hold) { k.boss('va', VA, t, VA_LW[0], VA_LW[1]); const S = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'];
  S.forEach((id, i) => { const [dx, dy] = gdzSpot(i, S.length, 3.6), q = [VA_LW[0] + 0.5 + dx, VA_LW[1] + 0.5 + dy]; if (hold != null) { k.hold(hold, id); nzGo(k, hold, t, id, q); } else k.at(t, id, q[0], q[1]); });
  [['t1', [VA_LW[0] + 4.5, VA_LW[1] - 1.5]]].concat(VA_LO.map((id, i) => [id, VA_LS[i]])).forEach(([id, q]) => { if (hold != null) { k.hold(hold, id); k.at(t, id, q[0], q[1]); } else k.at(t, id, q[0], q[1]); }); }
// the Mythic totems: about two dozen rise after each Imbibe, mostly on the Flame-to-Shadow side; the first Froth's lines take most of them
const VA_TOT = [[-2, -30], [-6, -38], [-25, -24], [-30, -36], [-4, -48], [-28, -50], [-12, -58], [-34, -62], [-6, -66], [-16, -74], [-40, -44], [-22, -40], [-30, -70], [-8, -56], [-40, -56], [-20, -82],
  [-48, -24], [-52, -14], [4, -80], [-4, -84], [44, -62], [50, -28]];
const VA_M = {
  // Imbibe at 100 energy (about every 84 seconds): he drains the two fountains nearest him, a raid hit for each, a stacking infusion
  // (+100% that fountain's hit next time), its adds and its infection; Mythic: totems rise. Hold him by the Shadow fountain every time, so
  // it's always Shadow and Flame and never Blood (fail: held in the middle, so Blood joins in)
  imbibe(fail, d) {
    const myth = d !== 'h', L = 11, k = gdzKit(VA, L), P = fail ? [6, -30] : VA_I; vaBoss(k); vaRaid(k, 0, VA_I, -38);
    if (fail) { vaBoss(k, 0.4); vaBoss(k, 2.4, P); vaRaid(k, 2.4, P, -38, { hold: 0.4 }); }
    k.cast('va', 'Imbibe', 2.6, 6.6);
    const F = fail ? [VA_S, VA_B] : [VA_S, VA_F], FC = fail ? ['#b06bff', '#ff4a5a'] : ['#b06bff', '#ff8a3b'], FN = fail ? ['Shadow fountain', 'Blood fountain'] : ['Shadow fountain', 'Flame fountain'];
    F.forEach((q, i) => { k.ring({ x: q[0], y: q[1], r: 6, fx: 'zone', t0: 3, dur: 4, color: FC[i], fill: 'rgba(255,255,255,.12)', cn: FN[i], legend: 'a fountain he drains' }); k.link({ from: 'va', toYd: { x: q[0], y: q[1] }, t0: 3, t1: 6.6, color: FC[i], legend: 'Imbibe drains the two nearest fountains' }); });
    k.call(6.6, 8.6, 'Two raid hits, stronger every time', { x: 10, y: -8, color: '#c084ff', ink: '#14061f' });
    if (fail) { k.call(7, 10.6, 'Blood joins in: Clotting Venoms', { x: 4, y: 40, color: '#ff4a5a', ink: '#fff' }); k.add('cv', 'Clotting Venom', 7, VA_B[0], VA_B[1] - 6).add('cv', 'Clotting Venom', L, 0, 40); k.oops('t1', 2.4); k.step(0.4).step(2.6).step(7);
      k.pause(7.3, 'The boss was tanked too far from the Shadow fountain: Imbibe took Blood instead of Flame, with its big Clotting Venom and a fountain we never planned for.', { x: 4, y: 30, r: 18 });
      return k.done({ title: 'Mistake: Imbibe from the wrong spot', focus: { x: 10, y: -10, r: 50 }, badLabel: 'moved the boss' }); }
    if (myth) { VA_TOT.forEach(([x, y], i) => { k.add('tt' + i, 'Malignant Totem', 7 + (i % 6) * 0.15, x, y).show('tt' + i, 7 + (i % 6) * 0.15, L); });
      k.call(7.2, 10.6, 'Mythic: totems rise. Waves must hit them all', { x: -24, y: -12, color: '#c0ff7a', ink: '#0a1a06' }); }
    k.ring1(['t1']).step(0.4).step(2.6).step(6.6); if (myth) k.step(7.2);
    k.pause(4.4, 'The boss tank holds him by the Shadow fountain every time. Imbibe drains the two nearest, Shadow and Flame: never Blood.', { x: 40, y: -46, r: 18 });
    return k.done({ title: 'Imbibe: always Shadow and Flame', focus: { x: 0, y: -26, r: 60 }, hlLabel: 'the boss tank' });
  },
  // the venoms after each Imbibe: 8 Shrouded (Shadow) crawl from their fountain toward the cavity, Gorefiend's Grasp or Typhoon gathers
  // them on the boss; 3 Burning (Flame) come from the far fountain: one Death Knight walks out and grips two into the middle (one banished),
  // the other grips one straight to the boss; the far one is slowed or trapped. Each Burning Venom's death hits the raid: kill them 9-10
  // seconds apart (fail: two die together)
  adds(fail) {
    const L = 17, k = gdzKit(VA, L); vaHome(k); const DK1 = 'm4', DK2 = 'm5', BAN = 'r6', CC = 'r2';
    for (let i = 0; i < 8; i++) { const a = 'sv' + i, [dx, dy] = gdzSpot(i, 8, 4), s0 = [VA_S[0] + dx, VA_S[1] + 4 + dy], m = [s0[0] - 8, s0[1] + 4], g = nzAdd(VA_I, -38 + (i - 3.5) * 14, 9);
      k.add(a, 'Shrouded Venom', 0.4, s0[0], s0[1]).add(a, 'Shrouded Venom', 2.6, m[0], m[1]).add(a, 'Shrouded Venom', 3.1, g[0], g[1]).show(a, 0.4, 7 + i * 0.3); }
    k.call(2.6, 4.2, 'Gorefiend\'s Grasp', { on: DK2, color: '#7fd8ff', ink: '#06131c' }); k.call(0.5, 2.4, 'Shrouded Venoms: gather them', { x: 50, y: -40, color: '#b06bff', ink: '#fff' });
    // (the Burning Venoms: DK1 walks toward the middle and grips two in; DK2 grips one to the boss)
    const B0 = [VA_F[0] + 5, VA_F[1] + 6], q1 = k.posAt(DK1, 0); k.hold(0.2, DK1); nzGo(k, 0.2, 6, DK1, [-14, -36]);
    [['bv0', [B0[0], B0[1] + 3], 6.8, [VA_I[0] + 7, VA_I[1] - 1], fail ? 11.4 : 8], ['bv1', [B0[0] + 3, B0[1]], 6.2, [-18, -36], fail ? 11.4 : 12], ['bv2', [B0[0] - 2, B0[1] - 3], 0, null, 16]].forEach(([a, s0, tg, to, die], i) => {
      k.add(a, 'Burning Venom', 0.4, s0[0], s0[1]).add(a, 'Burning Venom', 5.6, s0[0] + 8, s0[1] + 5); if (to) k.add(a, 'Burning Venom', tg, s0[0] + 8, s0[1] + 5).add(a, 'Burning Venom', tg + 0.4, to[0], to[1]); else k.add(a, 'Burning Venom', 8, s0[0] + 10, s0[1] + 7);
      k.show(a, 0.4, die); k.ring({ on: a, r: 7, fx: 'zone', t0: 0.4, dur: die - 0.4, color: '#ff8a3b', fill: 'rgba(255,138,59,.12)', cn: 'Burning Presence', legend: 'Burning Presence: hurts the raid while it lives' });
      k.ring({ on: a, r: 9, fx: 'burst', t0: die - 0.4, at: die, dur: 0.8, color: '#ff5a2a', cn: 'Caustic Surge', legend: 'a Burning Venom dies: a raid hit' }); });
    k.call(6.6, 8, 'Grip', { on: DK2, color: '#7fd8ff', ink: '#06131c' }); k.call(6, 7.4, 'Grip', { on: DK1, color: '#7fd8ff', ink: '#06131c' });
    k.ring({ on: 'bv1', r: 3, fx: 'debuff', t0: 6.8, dur: fail ? 4.2 : 4.6, color: '#9b6bff', cn: 'Banish', legend: 'banished: safe from the cleave until it\'s time' }); k.link({ from: BAN, to: 'bv1', t0: 6.6, t1: 7.2, color: '#9b6bff', legend: 'a Warlock banishes it' });
    k.ring({ on: 'bv2', r: 3, fx: 'debuff', t0: 6, dur: 8.6, color: '#7fd8ff', cn: 'Freezing Trap', legend: 'the far one: slowed or trapped' }); k.link({ from: CC, to: 'bv2', t0: 5.6, t1: 6.2, color: '#7fd8ff', legend: 'a light crowd control on the far one' });
    k.hold(12.4, DK1); nzGo(k, 12.4, 16.8, DK1, q1);
    if (fail) { gdzFailBlast(k, 11.6, 'Two Caustic Surges at once', 10, -4, ['h3', 'r7'], 'Caustic Surge'); k.step(0.4).step(3).step(11.4);
      k.pause(11.8, 'The banish came off too early and two Burning Venoms died together: two Caustic Surges on the raid at once.', { x: 0, y: -34, r: 30 });
      return k.done({ title: 'Mistake: two fire adds die together', focus: { x: 0, y: -40, r: 46 }, badLabel: 'killed at once' }); }
    k.call(8, 9.8, 'Caustic Surge 1', { x: 22, y: -24, color: '#ff8a3b', ink: '#1a0a00' }); k.call(12, 13.8, 'Caustic Surge 2 (9-10 s later)', { x: 0, y: -24, color: '#ff8a3b', ink: '#1a0a00' }); k.call(14.2, 16, 'Then the far one', { x: -26, y: -40, color: '#ff8a3b', ink: '#1a0a00' });
    k.ring1([DK1, DK2]).step(0.4).step(2.6).step(6.6).step(8);
    k.pause(7.2, 'Shrouded Venoms are gripped onto the boss and cleaved. The Burning Venoms come from the far fountain: one gripped to the boss, one banished in the middle, the far one slowed. Kill them 9 to 10 seconds apart.', { x: 0, y: -38, r: 34 });
    return k.done({ title: 'The venoms: grip them in, kill the fire apart', focus: { x: 0, y: -40, r: 50 }, hlLabel: 'the two Death Knights' });
  },
  // Mythic, the first Plague Froth of each cycle ("mow the lawn"): 5 players marked; 6 seconds later each fires waves north, south, east and
  // west. Melee targets take the diamond and star, ranged the X, triangle and moon: one slanted line, so no wave crosses another target. The
  // boss sits between diamond and star with the melee stacked under him, in the gap between the lines. Waves destroy the totems they cross
  // (fail: a target off their marker sends a wave through the melee)
  froth1(fail) {
    const L = 12, k = gdzKit(VA, L), T = VA_LW; vaLawn(k, 0);
    Object.entries(VA_MK).forEach(([kd, [x, y]]) => k.wmark(kd, x, y));
    const TG = [['r5', 'cross'], ['h4', 'triangle'], ['h1', 'moon'], ['m2', 'diamond'], ['m6', 'star']], MEL = ['t1', 'm1', 'm3', 'm4', 'm5', 'm7'];
    TG.forEach(([id, mk], i) => { let q = VA_MK[mk]; if (fail && id === 'm6') q = [T[0] + 3, T[1] - 6]; k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 0.4, dur: 6.4, color: '#c0ff7a', cn: 'Plague Froth', legend: 'Plague Froth: in 6 seconds you fire waves north, south, east and west' }); k.hold(0.4, id).at(5.2 + i * 0.15, id, q[0] + 0.8, q[1] + 0.8); });
    // (the waves: they roll out from each target and destroy the totems they cross)
    const W0 = 6.8, V = 24, kill = {}; VA_TOT.forEach(([x, y], i) => { k.add('tt' + i, 'Malignant Totem', 0, x, y); kill[i] = L; });
    TG.forEach(([id], j) => { const p = k.posAt(id, W0); VA_WD.forEach((deg) => { k.wave({ x: p[0], y: p[1], deg, v: V, w: 3.5, d: 3, t0: W0, t1: W0 + 2.6, color: '#c0ff7a', legend: 'a Plague Wave' });
      const u = nzU(deg); VA_TOT.forEach(([x, y], i) => { const dx = x - p[0], dy = y - p[1], al = dx * u[0] + dy * u[1], ac = Math.abs(-dx * u[1] + dy * u[0]); if (al > 0 && al < V * 2.6 && ac < 3) kill[i] = Math.min(kill[i], W0 + al / V); }); }); });
    VA_TOT.forEach((_, i) => k.show('tt' + i, 0, kill[i]));
    if (fail) { k.oops('m6', W0); MEL.slice(1, 3).forEach((id) => ulHit(k, id, W0 + 0.4, 'Plague Wave')); k.step(0.4).step(3.6).step(W0);
      k.pause(W0 + 0.6, 'The star target stood next to the boss instead of on the star: one of their waves went straight through the stacked melee.', { x: T[0], y: T[1], r: 10 });
      return k.done({ title: 'Mistake: a wave through the melee', focus: { x: -14, y: -48, r: 30 }, badLabel: 'off their marker' }); }
    const left = VA_TOT.filter((_, i) => kill[i] >= L).length; k.call(W0 + 2.8, L, left + ' totems left: the second set gets them', { x: 20, y: -10, color: '#c0ff7a', ink: '#0a1a06' });
    k.ring1(TG.map((q) => q[0])).step(0.4).step(3.6).step(W0).step(W0 + 2.8);
    k.pause(6, 'The first Froth: the five targets take the markers, ranged on X, triangle and moon, melee on diamond and star. The boss sits between diamond and star with the melee stacked under him, in the gap between the lines.', { x: -16, y: -46, r: 26 });
    return k.done({ title: 'First Froth: mow the lawn', focus: { x: -14, y: -50, r: 38 }, hlLabel: 'the five Froth targets' });
  },
  // the second Froth of each cycle: call where the totems are left ("two to blue, one to the entrance"); targets walk to them and line
  // their waves up on them, melee targets included. Totems first, not hitting melee second. Any totem left at the next Imbibe casts
  // Malignance: a raid hit and a 1-minute DoT; one is survivable, two or more wipe (fail: one is missed)
  froth2(fail) {
    const L = 12.5, k = gdzKit(VA, L), T = VA_LW; vaLawn(k, 0); const LEFT = [[-48, -24], [-52, -14], [4, -80], [-4, -84], [44, -62], [50, -28]];
    LEFT.forEach(([x, y], i) => k.add('tt' + i, 'Malignant Totem', 0, x, y));
    k.call(0.4, 3, 'Two to the left, two to the entrance, one each to the right', { x: 4, y: 0, color: '#c0ff7a', ink: '#0a1a06' });
    // (each target stands due north, south, east or west of a totem, in the game's terms, so one wave runs through it)
    const TG = [['m3', 0, 120, 14], ['r3', 2, -150, 12], ['r6', 4, -150, 10], ['r7', 5, 120, 12], ['h1', -1, 0, 0]], kill = {};
    TG.forEach(([id, ti, deg, dd]) => { if (ti < 0 || (fail && ti === 5)) { k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 0.4, dur: 6.6, color: '#c0ff7a', cn: 'Plague Froth', legend: 'Plague Froth: in 6 seconds you fire waves north, south, east and west' }); if (ti < 0) k.hold(0.4, id).at(3.4, id, 2, -33); return; } const tt = LEFT[ti], q = nzAdd(tt, deg + 180, dd); k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 0.4, dur: 6.6, color: '#c0ff7a', cn: 'Plague Froth', legend: 'Plague Froth: in 6 seconds you fire waves north, south, east and west' }); k.hold(0.4, id); nzGo(k, 0.4, 6.4, id, q); });
    const W0 = 7, V = 24; LEFT.forEach((_, i) => (kill[i] = L)); TG.forEach(([id]) => { const p = k.posAt(id, W0); VA_WD.forEach((deg) => { k.wave({ x: p[0], y: p[1], deg, v: V, w: 3.5, d: 3, t0: W0, t1: W0 + 2.4, color: '#c0ff7a', legend: 'a Plague Wave' });
      const u = nzU(deg); LEFT.forEach(([x, y], i) => { const dx = x - p[0], dy = y - p[1], al = dx * u[0] + dy * u[1], ac = Math.abs(-dx * u[1] + dy * u[0]); if (al > 0 && al < V * 2.4 && ac < 3) kill[i] = Math.min(kill[i], W0 + al / V); }); }); });
    if (fail) kill[5] = L; LEFT.forEach((_, i) => k.show('tt' + i, 0, kill[i]));
    if (fail) { k.call(W0 + 2.6, L, 'One totem left: Malignance at the next Imbibe', { x: 40, y: -18, color: '#ff3b3b', ink: '#fff' }); k.step(0.4).step(4).step(W0 + 2.6);
      k.pause(W0 + 2.8, 'Nobody went to the last totem by the Shadow side. At the next Imbibe it casts Malignance: a raid hit and a 1-minute DoT. One is survivable; two would wipe.', { x: 50, y: -28, r: 10 });
      return k.done({ title: 'Mistake: a totem left standing', focus: { x: 0, y: -44, r: 56 } }); }
    k.ring1(TG.map((q) => q[0])).step(0.4).step(4).step(W0);
    k.pause(5.6, 'The second Froth: each target walks to a totem that\'s left and stands so a wave runs straight through it. Totems first; not hitting melee second.', { x: 0, y: -44, r: 50 });
    return k.done({ title: 'Second Froth: clean up the last totems', focus: { x: 0, y: -44, r: 56 }, hlLabel: 'the five Froth targets' });
  },
  // Malignant Catalyst (Heroic and up): a raid hit, then a few bile circles land around the room 5 seconds later; each must have at least
  // one player in it (split within 6 yards) or it hits the whole raid. Ranged spread out to cover them (fail: one left empty)
  catalyst(fail) {
    const L = 11.4, k = gdzKit(VA, L); vaHome(k); k.cast('va', 'Malignant Catalyst', 0.3, 1.2); k.call(1.2, 2.8, 'Raid hit', { x: 20, y: -12, color: '#c084ff', ink: '#14061f' });
    const BL = [[14, -18], [4, -40], [22, -64], [46, -16], [-10, -24]], SO = ['r1', 'r3', 'r5', 'r7', 'h1'];
    BL.forEach(([x, y], i) => k.ring({ x, y, r: 6, fx: 'soak', t0: 1.4, at: 6.2, dur: 5, color: '#8fe36a', cn: 'Catalytic Bile', legend: 'a bile: someone must stand in it' }));
    SO.forEach((id, i) => { if (fail && i === 2) return; k.hold(1.3, id); nzGo(k, 1.3, 5.8, id, [BL[i][0] + 1, BL[i][1] - 1]); k.hold(6.6, id); const q = k.posAt(id, 0); nzGo(k, 6.6, 11.2, id, q); });
    if (fail) { gdzFailBlast(k, 6.4, 'An empty bile: the whole raid takes it', 10, 0, [], 'Catalytic Bile'); k.step(0.3).step(1.4).step(6.2);
      k.pause(6.6, 'Nobody stood in this bile, so it hit the whole raid instead.', { x: BL[2][0], y: BL[2][1], r: 8 });
      return k.done({ title: 'Mistake: an empty bile', focus: { x: 16, y: -34, r: 40 } }); }
    k.ring1(SO).step(0.3).step(1.4).step(6.2);
    k.pause(3, 'Biles land round the room: the nearest ranged walks into each one. Five biles, five soakers.', { x: 16, y: -34, r: 34 });
    return k.done({ title: 'Malignant Catalyst: someone in every bile', focus: { x: 16, y: -34, r: 40 }, hlLabel: 'the bile soakers' });
  },
  // the infections after each Imbibe: Exploding Infection (Flame; Mythic: four, ramping every 1.5 s): removing it blasts the raid, less the
  // farther away, so its targets walk out first and two healers dispel one pair at a time; Stygian Infection (Shadow): a big heal absorb,
  // and the player drops Stygian Burst circles: keep walking, away from the raid, while healers heal it off (fail: all dispelled at once)
  infect(fail) {
    const L = 15.6, k = gdzKit(VA, L); vaHome(k); const EX = ['r2', 'm7', 'r6', 'h3'], ST = ['r1'], OUT = [[2, -12], [18, -10], [-6, -40], [10, -56]];
    EX.forEach((id, i) => { k.ring({ on: id, r: 2.6, fx: 'debuff', t0: 0.4, dur: (fail ? 5.2 : i < 2 ? 5.2 : 10.4) - 0.4, color: '#ff8a3b', cn: 'Exploding Infection', legend: 'Exploding Infection: removing it blasts the raid, less the farther away' }); k.hold(0.6, id).at(4.4, id, OUT[i][0], OUT[i][1]); });
    const pair = (ids, t, H) => ids.forEach((id, j) => { k.dispel(H[j], id, t + j * 0.2); k.ring({ on: id, r: 10, fx: 'burst', t0: t, at: t + 0.4, dur: 0.8, color: '#ff5a2a', cn: 'Caustic Explosion', legend: 'a dispelled infection: a blast on the raid, less the farther away' }); });
    if (fail) { pair(EX, 5, ['h1', 'h2', 'h4', 'h1']); gdzFailBlast(k, 5.8, 'Four blasts at once', 20, -10, ['r1', 'm2'], 'Caustic Explosion'); k.step(0.4).step(4.4).step(5);
      k.pause(6, 'All four infections were dispelled together: four blasts on the raid at once.', { x: 10, y: -30, r: 30 });
      return k.done({ title: 'Mistake: every infection dispelled at once', focus: { x: 10, y: -30, r: 40 }, badLabel: 'too many at once' }); }
    pair(EX.slice(0, 2), 5, ['h1', 'h2']); pair(EX.slice(2), 10.2, ['h4', 'h1']);
    EX.forEach((id, i) => { const q = k.posAt(id, 0), t = i < 2 ? 5.8 : 11; k.hold(t, id); nzGo(k, t, t + 4.4, id, q); });
    // (the Stygian player keeps walking along the edge, leaving circles behind, away from the raid)
    k.ring({ on: ST[0], r: 2.6, fx: 'debuff', t0: 0.4, dur: L - 0.4, color: '#b06bff', cn: 'Stygian Infection', legend: 'Stygian Infection: a big heal absorb; you drop circles: keep walking away' });
    const sp = [[48, -16], [54, -26], [60, -36], [60, -48]]; k.hold(0.6, ST[0]).at(3.6, ST[0], sp[0][0], sp[0][1]).at(6, ST[0], sp[1][0], sp[1][1]).at(9, ST[0], sp[2][0], sp[2][1]).at(12, ST[0], sp[3][0], sp[3][1]);
    [3, 6, 9].forEach((t, j) => k.ring({ x: sp[j][0], y: sp[j][1], r: 6, fx: 'puddle', t0: t + 0.4, dur: L - t - 0.4, color: '#b06bff', fill: 'rgba(176,107,255,.3)', cn: 'Stygian Burst', legend: 'Stygian Burst: a circle left behind' }));
    k.ring1(EX).step(0.4).step(4.4).step(5).step(10.2);
    k.pause(4.6, 'Exploding Infection: the four walk out from the raid, then two healers dispel one pair, and the second pair a while later. The Stygian player walks the edge, leaving their circles away from everyone.', { x: 10, y: -30, r: 36 });
    return k.done({ title: 'Infections: walk out, dispel a pair at a time', focus: { x: 16, y: -30, r: 46 }, hlLabel: 'players with Exploding Infection' });
  },
  // Dripping Fangs: his bite doubles the tank's physical damage taken and stacks a DoT: the other tank taunts after every one (fail: no swap)
  fangs(fail) {
    const L = 8, k = gdzKit(VA, L); vaHome(k); const A = k.posAt('t1', 0), B = k.posAt('t2', 0); k.cast('va', 'Dripping Fangs', 0.5, 2.3);
    k.ring({ on: 't1', r: 2.6, fx: 'debuff', t0: 2.3, dur: L - 2.3, color: '#c9a36a', cn: 'Dripping Fangs', legend: 'Dripping Fangs: +200% physical damage taken: swap' });
    if (fail) { ulHit(k, 't1', 5.6, 'Melee: dead'); k.oops('t1', 5.6); k.step(0.5).step(2.3).step(5.6);
      k.pause(5.9, 'No taunt after Dripping Fangs: the next few hits on a tank taking triple damage killed them.', { on: 't1', r: 9 });
      return k.done({ title: 'Mistake: no swap after Dripping Fangs', focus: { x: 36, y: -40, r: 18 }, badLabel: 'kept the boss' }); }
    k.hold(2.4, ['t1', 't2']).at(4.6, 't1', B[0], B[1]).at(4.6, 't2', A[0], A[1]); k.call(3.4, 4.8, 'Taunt', { on: 't2', color: '#5aa0ff', ink: '#fff' });
    k.ring1(['t1', 't2']).step(0.5).step(2.3).step(3.4);
    k.pause(2.6, 'Dripping Fangs on the boss tank: the other tank taunts right away. Swap on every one.', { x: 36, y: -40, r: 16 });
    return k.done({ title: 'Dripping Fangs: swap on every one', focus: { x: 36, y: -40, r: 20 }, hlLabel: 'the tanks' });
  },
};
const VA_FAIL = {
  imbibe: { name: 'Imbibe from the wrong spot', what: 'The boss is tanked too far from the Shadow fountain: Imbibe takes Blood instead of Flame.', do: ['The boss drifts toward the middle.', 'Imbibe drains Shadow and Blood.', 'Clotting Venoms and a new infection.'], map: () => VA_M.imbibe(true) },
  adds: { name: 'Two fire adds die together', what: 'Two Burning Venoms die at once: two Caustic Surges hit the raid together.', do: ['The Burning Venoms come in.', 'Two die at the same time.', 'Two raid hits at once.'], map: () => VA_M.adds(true) },
  froth1: { name: 'A wave through the melee', what: 'A Froth target stands next to the boss instead of on their marker: their wave runs through the stacked melee.', do: ['Five targets take the markers.', 'One stands by the boss.', 'Their wave hits the melee.'], map: () => VA_M.froth1(true) },
  froth2: { name: 'A totem left standing', what: 'Nobody goes to the last totem: at the next Imbibe it casts Malignance on the raid.', do: ['The second Froth goes out.', 'One totem has nobody.', 'Malignance at the next Imbibe.'], map: () => VA_M.froth2(true) },
  catalyst: { name: 'An empty bile', what: 'Nobody stands in one bile circle: it hits the whole raid instead.', do: ['Biles land round the room.', 'One has nobody in it.', 'It hits everyone.'], map: () => VA_M.catalyst(true) },
  infect: { name: 'Every infection dispelled at once', what: 'All four Exploding Infections are dispelled together: four blasts hit the raid at once.', do: ['Four players get Exploding Infection.', 'All four are dispelled together.', 'Four blasts at once.'], map: () => VA_M.infect(true) },
  fangs: { name: 'No swap after Dripping Fangs', what: 'Nobody taunts after Dripping Fangs: the tank taking triple damage dies.', do: ['Dripping Fangs lands.', 'No taunt.', 'The tank dies.'], map: () => VA_M.fangs(true) },
};
// ---- the whole fight, by Wolfthorn's Mythic kill's clock (6:51)
const VA_BEATS = {
  start: { name: 'The pull (Straight to the Shadow fountain)', do: ['Imbibe comes early: the tank takes him straight to his spot by the Shadow fountain.', 'Bloodlust on the pull.'],
    run() { const k = gdzKit(VA, 7); k.boss('va', VA, 0, 0, -23); vaRaid(k, 0, [0, -23], -38); vaBoss(k, 0.3, [0, -23]); vaBoss(k, 6.6); vaRaid(k, 6.6, VA_I, -38, { hold: 0.3 }); k.ring1(['t1']).step(0.2); } },
  tolawn: { name: 'To the lawn (First Froth next)', do: ['After the venoms, the tank brings the boss down to the lawn: between the diamond and star markers. Melee stack under him; everyone else to a clear spot.'],
    run() { const k = gdzKit(VA, 8); vaHome(k); vaBoss(k, 0.4); vaLawn(k, 7.4, 0.4); k.step(0.2); } },
  back: { name: 'Back to the Shadow fountain (Imbibe next)', do: ['Right after the second Froth, Imbibe comes again: back to the spot by the Shadow fountain.'],
    run() { const k = gdzKit(VA, 8); vaLawn(k, 0); vaBoss(k, 0.4, VA_LW); vaBoss(k, 7.4); vaRaid(k, 7.4, VA_I, -38, { hold: 0.4 }); k.step(0.2); } },
  imb5: { name: 'Imbibe 5 (The biggest hit of the fight)', do: ['Five stacks of both infusions: the biggest raid hit of the fight.', 'Everyone stacks: Rallying Cry, Spirit Link, Aura Mastery, Anti-Magic Zone and personals.'],
    run() { const k = gdzKit(VA, 4); vaHome(k); k.cast('va', 'Imbibe', 0.4, 3); k.call(0.4, 3.6, 'Stack every cooldown', { x: 20, y: -10, color: '#ffd23b', ink: '#1a1400' }); k.step(0.2); } },
  last: { name: 'The last set (CC the fire, burn him)', do: ['Don\'t kill the last Burning Venoms: their deaths on top of everything else kill people. Grip and crowd control them away from the cavity.', 'Totems don\'t matter now: just don\'t send waves through the melee. Burn Vashnik before Imbibe 6.'],
    run() { const k = gdzKit(VA, 4); vaHome(k); k.call(0.4, 3.6, 'Burn the boss', { x: 20, y: -10, color: '#ff8a8a', ink: '#200a0a' }); k.step(0.2); } },
  kill: { name: 'The kill', do: ['Down before the sixth Imbibe.'],
    run() { const k = gdzKit(VA, 5); vaHome(k); k.ring({ on: 'va', r: 7, fx: 'burst', t0: 1.4, at: 2, dur: 0.8, color: '#ffd23b', cn: 'Vashnik dies', legend: 'the kill' }); k.show('va', 0, 2.2); k.call(2.3, 4.6, 'Kill', { x: 36, y: -30 }); k.step(0.3); } },
};
const VA_SIM = [
  { at: 0, beat: 'start' }, { at: 10, mech: 'fangs', label: 'Dripping Fangs' }, { at: 20, mech: 'imbibe', label: 'Imbibe 1' }, { at: 25, mech: 'adds', label: 'Venoms 1' },
  { at: 30, mech: 'catalyst', label: 'Malignant Catalyst' }, { at: 43, mech: 'infect', label: 'Infections 1' }, { at: 50, beat: 'tolawn' }, { at: 54, mech: 'froth1', label: 'Plague Froth 1 (mow the lawn)' }, { at: 87, mech: 'froth2', label: 'Plague Froth 2 (clean up)' }, { at: 98, beat: 'back' },
  { at: 104, mech: 'imbibe', label: 'Imbibe 2' }, { at: 109, mech: 'adds', label: 'Venoms 2' }, { at: 127, mech: 'infect', label: 'Infections 2' }, { at: 134, beat: 'tolawn' }, { at: 138, mech: 'froth1', label: 'Plague Froth 3 (mow the lawn)' }, { at: 171, mech: 'froth2', label: 'Plague Froth 4 (clean up)' }, { at: 182, beat: 'back' },
  { at: 188, mech: 'imbibe', label: 'Imbibe 3' }, { at: 193, mech: 'adds', label: 'Venoms 3' }, { at: 218, beat: 'tolawn' }, { at: 222, mech: 'froth1', label: 'Plague Froth 5 (mow the lawn)' }, { at: 255, mech: 'froth2', label: 'Plague Froth 6 (clean up)' }, { at: 266, beat: 'back' },
  { at: 272, mech: 'imbibe', label: 'Imbibe 4' }, { at: 277, mech: 'adds', label: 'Venoms 4' }, { at: 302, beat: 'tolawn' }, { at: 306, mech: 'froth1', label: 'Plague Froth 7 (mow the lawn)' }, { at: 339, mech: 'froth2', label: 'Plague Froth 8 (clean up)' }, { at: 350, beat: 'back' },
  { at: 356, beat: 'imb5' }, { at: 365, beat: 'last' }, { at: 411, beat: 'kill' },
];
const VA_DUR = { 'm:imbibe': 6, 'm:adds': 30, 'm:froth1': 8, 'm:froth2': 8, 'm:catalyst': 6, 'm:infect': 15, 'm:fangs': 2, 'b:start': 7, 'b:tolawn': 4, 'b:back': 6, 'b:imb5': 6, 'b:last': 40, 'b:kill': 0 };
const VA_SEV = { 'm:imbibe': 3, 'm:adds': 2, 'm:froth1': 3, 'm:froth2': 3, 'm:catalyst': 2, 'm:infect': 2, 'm:fangs': 1, 'b:start': 1, 'b:tolawn': 1, 'b:back': 1, 'b:imb5': 3, 'b:last': 2, 'b:kill': 1 };
GDZ['Vashnik the Malignant'] = {
  upd: ['12.1', 'Oct 21, 2026'],
  stepRoles: {
    'Imbibe (Always Shadow and Flame)': ['t', 'h', ''], 'The venoms (Grip them in, kill the fire apart)': ['td', 'td', 'd', 'd'], 'Plague Froth, first set (Mow the lawn)': ['', 'd', 'd', ''],
    'Plague Froth, second set (Clean up the last totems)': ['', '', ''], 'Malignant Catalyst (Someone in every bile)': ['', 'd', ''], 'Infections (Walk out, dispel a pair at a time)': ['', 'h', 'h', ''], 'Dripping Fangs (Swap on every one)': ['t', 't'],
  },
  sum: 'Hold Vashnik by the Shadow fountain for every Imbibe, so it\'s always Shadow and Flame and never Blood. Grip the venoms in and kill the fire ones apart, soak every bile, dispel a pair at a time, and on Mythic hit every totem with the Froth waves: one line across the lawn, then clean up.',
  m: { sim: VA_SIM, simDur: VA_DUR, simSev: VA_SEV, beats: VA_BEATS,
    simAlways: ['Every Imbibe from the same spot by the Shadow fountain: Shadow and Flame, never Blood.', 'Burning Venoms die 9 to 10 seconds apart.', 'Mythic: every totem hit before the next Imbibe. One left is survivable, two wipe.', 'Five healers: the infusions stack to five, so the healing check is the hard part.'],
    source: 'Tactyks\' Mythic Vashnik video', sum: 'Heroic plus totems: each Imbibe raises about two dozen Malignant Totems, and only Plague Froth waves destroy them. A third Burning Venom, and Exploding Infection ramps until dispelled.' },
  facts: [['Phases', '1, on a loop (Imbibe every 84 s)'], ['Bloodlust', 'On the pull'], ['Healers', '5', 'm'], ['Hardest part', 'Hitting every totem'], ['Fight length', 'About 7 minutes', 'm']],
  phases: [
    { id: 'p1', name: 'The loop: Imbibe to Imbibe', sum: 'One phase on repeat: Imbibe, the venoms, biles and infections, then the two Plague Froths, then the next Imbibe. Rinse and repeat, each time with bigger hits and healthier adds.',
      m: { sum: 'The same loop, plus totems: the first Froth of each cycle mows the lawn, the second cleans up whatever is left.' },
      mechs: [
        { id: 'imbibe', fail: VA_FAIL.imbibe, name: 'Imbibe (Always Shadow and Flame)', spell: 'Imbibe', what: 'At full energy, about every 84 seconds, he drains the two fountains nearest him: a raid hit for each, an infusion that makes that fountain\'s next hit and adds stronger, that fountain\'s adds and its infection.',
          do: ['The boss tank holds him by the Shadow fountain, every Imbibe.', 'He drains Shadow and Flame: two raid hits, bigger each time.', 'Shadow and Flame adds come out; never touch Blood.'],
          m: { what: 'At full energy, about every 84 seconds, he drains the two fountains nearest him: a raid hit for each, an infusion that makes that fountain\'s next hit and adds stronger, that fountain\'s adds and its infection. On Mythic about two dozen totems rise.', do: ['The boss tank holds him by the Shadow fountain, every Imbibe.', 'He drains Shadow and Flame: two raid hits, bigger each time.', 'Shadow and Flame adds come out; never touch Blood.', 'About two dozen totems rise: the Froth waves must hit them all.'], plan: ['Same spot every time means little movement and no Clotting Venoms. The DPS check gets easy; the healing check gets hard, so bring five healers.', 'Imbibe 5 is the biggest hit of the fight: stack every raid cooldown on it.'] },
          map: (d) => VA_M.imbibe(false, d) },
        { id: 'adds', fail: VA_FAIL.adds, name: 'The venoms (Grip them in, kill the fire apart)', spell: 'Burning Venom', what: 'Each Imbibe sends venoms crawling to the cavity: Shrouded Venoms from Shadow (killed twice, swirls when they die) and Burning Venoms from Flame (hurt the raid while alive, a raid hit when they die). Any that reach the cavity hit the raid very hard.',
          do: ['Shrouded Venoms: Gorefiend\'s Grasp or Typhoon them onto the boss and cleave.', 'Burning Venoms: one Death Knight grips one to the boss, the other walks out and grips two to the middle.', 'Banish the middle one; slow or trap the far one.', 'Kill the Burning Venoms 9 to 10 seconds apart.'],
          m: { plan: ['Two Death Knights is ideal, any spec. Sigil of Chains or Typhoon work every time; Gorefiend\'s Grasp every other set.', 'At four or five infusion stacks the adds get very healthy: crowd control the far fire add for good.', 'Anything alive for 60 seconds hardens: immune to crowd control and faster.'] },
          map: () => VA_M.adds() },
        { id: 'froth1', only: 'm', fail: VA_FAIL.froth1, name: 'Plague Froth, first set (Mow the lawn)', spell: 'Plague Froth', what: 'Five players are marked; 6 seconds later each fires big waves north, south, east and west. On Mythic the waves are the only thing that destroys the totems.',
          do: ['Ranged targets take X, triangle and moon; melee targets take diamond and star.', 'The boss sits between diamond and star, melee stacked under him.', 'The line is slanted, so no wave crosses another target.', 'The waves mow down most of the totems.'],
          plan: ['Damage doesn\'t matter during the Froths: the totems do.', 'If more melee get picked than there are melee markers, the ranged slide outward along the line.', 'Totems turn white when a wave hits them.'],
          map: () => VA_M.froth1() },
        { id: 'froth2', only: 'm', fail: VA_FAIL.froth2, name: 'Plague Froth, second set (Clean up the last totems)', spell: 'Malignance', what: 'Any totem still up at the next Imbibe casts Malignance: a raid hit and a 1-minute DoT. One is survivable; two or more wipe the raid.',
          do: ['Call where totems are left: "two left, one to the entrance".', 'Each target walks to a totem and lines a wave up on it.', 'Totems first; not hitting melee second.'],
          plan: ['Two ranged always favor the left side, two the right; the rest stay central. Mobile melee leave the boss for far totems.', 'Then move back to the Shadow fountain: Imbibe comes right after.'],
          map: () => VA_M.froth2() },
        { id: 'catalyst', fail: VA_FAIL.catalyst, name: 'Malignant Catalyst (Someone in every bile)', spell: 'Malignant Catalyst', what: 'A raid hit, then bile circles land around the room 5 seconds later. Each one is split between the players in it; one that lands on nobody hits the whole raid.',
          do: ['Raid hit: biles are coming.', 'The nearest ranged walks into each bile.', 'Five biles on Mythic, five soakers.'],
          map: () => VA_M.catalyst() },
        { id: 'infect', fail: VA_FAIL.infect, name: 'Infections (Walk out, dispel a pair at a time)', spell: 'Exploding Infection', what: 'Each Imbibe brings its fountains\' infections. Exploding Infection (Flame): removing it blasts the raid, less the farther away; on Mythic it ramps until dispelled. Stygian Infection (Shadow): a big heal absorb, and you drop circles as you move.',
          do: ['Exploding Infection: walk out from the raid.', 'Two healers dispel one pair; another two take the second pair a while later.', 'Stygian Infection: keep walking at the edge, leaving your circles away from everyone.', 'Healers heal the absorb off.'],
          m: { plan: ['No need to rush the dispels: players can take close to ten stacks first.', 'Never dispel right before Imbibe 4 or 5.'] },
          map: () => VA_M.infect() },
        { id: 'fangs', fail: VA_FAIL.fangs, name: 'Dripping Fangs (Swap on every one)', spell: 'Dripping Fangs', what: 'About every 28 seconds he bites his tank: much more physical damage taken and a stacking DoT.',
          do: ['Dripping Fangs on the boss tank.', 'The other tank taunts right away, every time.'],
          map: () => VA_M.fangs() },
      ],
      tiles: [
        { name: 'Imbibe 5 (Stack every cooldown)', do: 'Five stacks of both infusions: the biggest raid hit of the fight. Rallying Cry, Spirit Link, Aura Mastery, Anti-Magic Zone and personals on it.' },
        { name: 'The last set (Don\'t kill the fire)', do: 'In the last set, crowd control the Burning Venoms instead of killing them, ignore the totems (just don\'t hit melee), and burn Vashnik before Imbibe 6.' },
      ] },
  ],
  roles: {
    t: ['Hold him by the Shadow fountain for every Imbibe.', 'Swap on every Dripping Fangs.'],
    h: ['Five healers: the infusions stack to five.', 'Exploding Infection: dispel in pairs, one pair at a time; never right before Imbibe 4 or 5.', 'Imbibe 5: every raid cooldown.'],
    d: ['Death Knights: grip the Burning Venoms in; Gorefiend\'s Grasp or Typhoon the Shrouded ones.', 'Kill Burning Venoms 9 to 10 seconds apart.', 'Ranged: soak the biles.', 'Mythic Froth: take your marker on the first set; line up a totem on the second.'],
  },
};

// ===== Sszorak (notes/Guides/Bosses/5 Sszorak.md and notes/Sszorak research.md: Tactyks' Mythic video read in full, the spell text, and
// Wolfthorn's Mythic kill PJk3Awpzg7HBVaGN #46 (5:55) for the clock and the spots). Drawn on the room picture square to the page (the
// platform sits turned 17 degrees in the game: ARENAS rot -17): yards from the platform's centre, x right, y up. An eight-sided platform
// about 60 yards to each flat edge, venom all round; the entrance bridge on the left, the exit on the right. In the kill each phase's first
// tank combo was at the entrance side, the second at the exit side, the winds and Dig In in the middle.
GDZ_ORIGIN['Sszorak'] = { cx: -409, cy: 384.2 }; GDZ_FULL['Sszorak'] = { x: 0, y: 0, r: 62 };
const SZ = 'Sszorak', SZ_EN = [-34, -6], SZ_EX = [33, 10], SZ_C = [3, 3];
const SZ_L = ['m1', 'm2', 'm3', 'r1', 'r2', 'r3', 'h1', 'h2', 'm7'], SZ_R = ['m4', 'm5', 'm6', 'r4', 'r5', 'r6', 'r7', 'h3', 'h4'];
// the four cysts of the kill's first phase, each opposite the tunnel its wind blows from; the fourth always at the exit
const SZ_CY = [[9, -35], [-6, 41], [-22, 27], [38, 11]], SZ_MK = ['cross', 'circle', 'triangle', 'diamond'];
// the Raging Crosswinds arrows, on this picture (the game's north, south, west and east, turned with the room)
const SZ_AR = { n: 56, s: 236, w: 146, e: 326 };
const szBoss = (k, t, P) => k.boss('sz', SZ, t || 0, (P || SZ_EN)[0], (P || SZ_EN)[1]);
// a clump of players round c (radius r), each keeping a slot; hold: from where they stood then
function szClump(k, t, ids, c, r, hold) { ids.forEach((id, i) => { const [dx, dy] = gdzSpot(i, ids.length, r); if (hold != null) k.hold(hold, id); k.at(t, id, c[0] + dx, c[1] + dy); }); return k; }
// the tank-combo layout at boss spot B: the north-side soak group, the south-east one, both tanks with a group, all clear of the edge
function szCombo(k, t, B, side, hold, skip) { const s = side || 1, gL = nzAdd(B, s > 0 ? 80 : 260, 11), gR = nzAdd(B, s > 0 ? -40 : 140, 12), sk = (ids) => ids.filter((id) => !(skip || []).includes(id));
  szClump(k, t, sk(SZ_L), gL, 7, hold); szClump(k, t, sk(SZ_R), gR, 7, hold); const a = nzAdd(B, s > 0 ? 80 : 260, 5), b = nzAdd(B, s > 0 ? -40 : 140, 5); if (hold != null) k.hold(hold, ['t1', 't2']); k.at(t, 't1', a[0], a[1]).at(t, 't2', b[0], b[1]); return { gL, gR }; }
const SZ_M = {
  // Apex Predator, the tank combo: five casts at the current tank, random order (Tempest never first or last): two Ravage (a huge hit and
  // +600% damage taken from the next: the tank points it at the edge, alone, and the other taunts), two Mutilate (a frontal soak split
  // between everyone in it, 5 or more; the next one hits those players 500% harder, so two groups take turns) and one Tempest (tornadoes)
  // (fail: the second Mutilate with too few in it)
  combo(fail, o) {
    const ex = !!(o && o.ex), sd = ex ? 180 : 0, L = 13, k = gdzKit(SZ, L), B = ex ? SZ_EX : SZ_EN, NG = ex ? 'South' : 'North', SG = ex ? 'North-west' : 'South-east'; szBoss(k, 0, B); const g = szCombo(k, 0, B, ex ? -1 : 1); /* (ex: the exit side, everything turned round) */
    k.cast('sz', 'Mutilate', 1.2, 2.6); k.cone({ from: 'sz', to: 't1', r: 18, width: 50, at: 2.6, soak: true, color: '#ff8a5a', legend: 'Mutilate: split between everyone in it' }); k.call(1.2, 2.6, NG + ' group: soak', { x: g.gL[0] + (ex ? -6 : 6), y: g.gL[1] + (ex ? -15 : 15), color: '#ff8a5a', ink: '#1a0a00' });
    const W1 = nzAdd(B, 180 + sd, 6); k.hold(2.8, 't1').at(4, 't1', W1[0], W1[1]); k.cast('sz', 'Ravage', 4, 4.8); k.cone({ from: 'sz', to: 't1', r: 18, width: 50, at: 4.8, color: '#ff3b3b', legend: 'Ravage: a huge hit on the tank, aimed at the edge' });
    k.ring({ on: 't1', r: 2.6, fx: 'debuff', t0: 4.8, dur: L - 4.8, color: '#ff3b3b', cn: 'Ravage', legend: 'Ravage: +600% damage from the next one: the other tank taunts' });
    k.call(5, 6.2, 'Taunt', { on: 't2', color: '#5aa0ff', ink: '#fff' });
    if (fail) { szClump(k, 6, SZ_R.slice(3), nzAdd(B, -60 + sd, 24), 6, 5); }
    k.cast('sz', 'Mutilate', 5.6, 7); k.cone({ from: 'sz', to: 't2', r: 18, width: 50, at: 7, soak: true, color: '#ff8a5a', legend: 'Mutilate: split between everyone in it' }); k.call(5.6, 7, SG + ' group: soak', { x: g.gR[0] + (ex ? -10 : 10), y: g.gR[1] + (ex ? 16 : -16), color: '#ff8a5a', ink: '#1a0a00' });
    if (fail) { ['m4', 'm5', 'm6'].forEach((id) => ulHit(k, id, 7.2, 'Mutilate: too few')); gdzFailBlast(k, 7.6, 'Only four in the soak: too much each', B[0] + (ex ? -14 : 14), B[1] + (ex ? -26 : 26), ['m4', 'm5'], 'Mutilate'); k.step(1.2).step(4).step(7);
      k.pause(7.4, 'Most of the ' + SG.toLowerCase() + ' group drifted off. Only four took the second Mutilate: split four ways, it kills.', { x: g.gR[0], y: g.gR[1], r: 12 });
      return k.done({ title: 'Mistake: a Mutilate with too few in it', focus: { x: B[0] + (ex ? -8 : 8), y: B[1] + (ex ? -2 : 2), r: 26 }, badLabel: 'too few in the soak' }); }
    // (Tempest: tornadoes roll out from the boss; everyone keeps clear of their paths)
    k.cast('sz', 'Tempest', 7.6, 9); [15, 140, 165, 200, 235].forEach((a, i) => { const id = 'tw' + i; k.add(id, 'Tempest tornado', 9, B[0], B[1]); for (let t = 10; t <= L + 0.01; t += 1) { const q = nzAdd(B, a + sd + (t - 9) * 4, (t - 9) * 4.5); k.add(id, 'Tempest tornado', t, q[0], q[1]); } k.show(id, 9, L);
      k.ring({ on: id, r: 3, fx: 'zone', t0: 9, dur: L - 9, color: '#9ad7ff', fill: 'rgba(154,215,255,.25)', cn: 'Tempest', legend: 'a tornado: deadly to anyone but a tank' }); });
    const W2 = nzAdd(B, 225 + sd, 6); k.hold(9, 't2').at(10.4, 't2', W2[0], W2[1]); k.cast('sz', 'Ravage', 10.6, 11.4); k.cone({ from: 'sz', to: 't2', r: 18, width: 50, at: 11.4, color: '#ff3b3b', legend: 'Ravage: a huge hit on the tank, aimed at the edge' });
    k.ring1(['t1', 't2']).step(1.2).step(4).step(5.6).step(7.6).step(10.6);
    k.pause(3.4, 'Mutilate on the ' + NG.toLowerCase() + ' group, Ravage on the tank alone, aimed at the edge. Now the other tank taunts: the ' + SG.toLowerCase() + ' group takes the second Mutilate, then Tempest and the last Ravage.', { x: B[0] + (ex ? -2 : 2), y: B[1] + (ex ? -2 : 2), r: 22 });
    return k.done({ title: 'The tank combo: soaks take turns, Ravage at the edge', focus: { x: B[0] + (ex ? -8 : 8), y: B[1] + (ex ? -2 : 2), r: 26 }, hlLabel: 'the tanks' });
  },
  // Tempest's tornadoes: they roam out from the boss for half a minute and kill anyone but a tank, sometimes in one hit: call them when they
  // pass through the boss, leave the melee a big pocket, step off rather than greed (fail: a melee stays on the boss)
  tempest(fail) {
    const L = 11, k = gdzKit(SZ, L), B = [-6, -2]; szBoss(k, 0, B); szClump(k, 0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], nzAdd(B, 0, 8), 6.5); szClump(k, 0, ['h1', 'h2', 'h3', 'h4', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], nzAdd(B, 0, 26), 11); k.at(0, 't1', B[0] - 5, B[1]).at(0, 't2', B[0] - 6, B[1] + 8);
    const PATH = [[150, 3.4], [40, 3], [-60, 3.2], [250, 3]]; PATH.forEach(([a, v], i) => { const id = 'tw' + i; for (let t = 0; t <= L + 0.01; t += 0.5) { const q = nzAdd(B, a + t * 9, 2 + t * v); k.add(id, 'Tempest tornado', t, q[0], q[1]); } k.show(id, 0, L);
      k.ring({ on: id, r: 3, fx: 'zone', t0: 0, dur: L, color: '#9ad7ff', fill: 'rgba(154,215,255,.25)', cn: 'Tempest', legend: 'a tornado: deadly to anyone but a tank' }); });
    k.call(0.6, 3, 'Tornado through the boss!', { x: B[0] + 8, y: B[1] + 18, color: '#9ad7ff', ink: '#06131c' });
    // (the melee step out of the tornado coming through them, then back in)
    const ME = ['m2', 'm5']; ME.forEach((id, i) => { if (fail && i === 0) return; const p = k.posAt(id, 0), q = nzAdd(p, 90 + i * 60, 7); k.hold(1.6, id).at(2.8, id, q[0], q[1]).hold(6, id).at(7.4, id, p[0], p[1]); });
    if (fail) { ulHit(k, 'm2', 4, 'Tornado: dead'); k.oops('m2', 4); k.step(0.6).step(4);
      k.pause(4.3, 'This melee kept hitting the boss as the tornado came through: one touch and they were dead.', { on: 'm2', r: 8 });
      return k.done({ title: 'Mistake: greeding into a tornado', focus: { x: 4, y: 4, r: 24 }, badLabel: 'hit by a tornado' }); }
    k.ring1(ME).step(0.6).step(1.6).step(6);
    k.pause(2.4, 'Tornadoes are the number one killer here. Call them as they pass through the boss; the melee step off and come back once it has passed.', { x: 4, y: 4, r: 20 });
    return k.done({ title: 'Tempest: step off for the tornadoes', focus: { x: 4, y: 4, r: 24 }, hlLabel: 'melee stepping out' });
  },
  // Mythic, Serpent's Fury: the player farthest from the boss is marked while his rage climbs; at 100 the raid is dead. 14 players within 8
  // yards of the marked one makes him charge them (To the Slaughter) and resets his rage. Right after each tank combo the raid pre-stacks
  // and the assigned Hunter walks in 1 second before the Surge bombs. Everyone in it gets Virulence: short lines 5 seconds later that pass
  // it on to anyone they hit: spread to set spots, half outside, half inside (fail: only 13 in the stack)
  fury(fail) {
    const L = 12, k = gdzKit(SZ, L), B = SZ_EN, S0 = nzAdd(B, 20, 10), HU = 'r7'; szBoss(k); szCombo(k, 0, B, 1, null, [HU]);
    k.at(0, HU, S0[0] + 13, S0[1] + 12); k.ring({ on: HU, r: 8, fx: 'zone', t0: 0, dur: 4.4, color: '#ff5a5a', fill: 'rgba(255,90,90,.12)', cn: 'Serpent\'s Fury', legend: 'Serpent\'s Fury: 14 players inside resets his rage' });
    k.call(0.3, 3, 'Rage 92: stack now', { x: -10, y: 30, color: '#ff8a8a', ink: '#200a0a' });
    const IN = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 't2', 'h1'].slice(0, fail ? 12 : 14);
    szClump(k, 2.4, IN, S0, 6.5, 0.4); k.hold(2.6, HU).at(4.2, HU, S0[0] + 1, S0[1] + 1);
    if (fail) { k.call(4.4, 6.6, '13 inside: nothing happens', { x: S0[0], y: S0[1] + 12, color: '#ff3b3b', ink: '#fff' }); gdzFailBlast(k, 7.2, 'Rage 100: Unbound Ferocity, a wipe', 0, 20, ['m1', 'h2', 'r3'], 'Unbound Ferocity'); k.step(0.3).step(2.4).step(4.4);
      k.pause(4.8, 'One player short: 13 in the circle with the marked Hunter. To the Slaughter never came, his rage hit 100, and the raid died.', { x: S0[0], y: S0[1], r: 12 });
      return k.done({ title: 'Mistake: one short in the Fury stack', focus: { x: -18, y: 6, r: 28 } }); }
    szBoss(k, 4.4, B); szBoss(k, 4.9, [S0[0] - 3, S0[1] - 2]); k.call(4.4, 6, 'To the Slaughter: rage reset', { x: S0[0], y: S0[1] + 12, color: '#7ee36a', ink: '#0a1a06' });
    // (Virulence: everyone in it spreads to set spots before the lines go off)
    const SP = IN.concat([HU]).map((id, i) => nzAdd(S0, i * (360 / 15), i % 2 ? 11 : 18));
    IN.concat([HU]).forEach((id, i) => { k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 4.8, dur: 5, color: '#c0ff7a', cn: 'Virulence', legend: 'Virulence: in 5 seconds short lines go out and pass it to anyone they hit' }); k.hold(5, id).at(8.6, id, SP[i][0], SP[i][1]);
      k.ring({ on: id, r: 3.5, fx: 'burst', t0: 9.4, at: 9.8, dur: 0.6, color: '#c0ff7a', cn: 'Virulence lines', legend: 'the lines go off: keep them off everyone' }); });
    szBoss(k, 9, [S0[0] - 3, S0[1] - 2]); szBoss(k, 11.6, B);
    k.ring1([HU]).step(0.3).step(2.4).step(4.4).step(5);
    k.pause(3.8, 'Right after the tank combo the raid stacks, and the Hunter with the mark walks in one second before the Surge bombs: 14 in the circle, he charges, his rage resets.', { x: S0[0], y: S0[1], r: 14 });
    return k.done({ title: 'Serpent\'s Fury: 14 in the circle, then spread', focus: { x: -18, y: 6, r: 28 }, hlLabel: 'the Hunter with the mark' });
  },
  // Venomous Surge: two players get a 10-second DoT; when it ends the raid takes a hit (less the farther away) and a Viscous Cyst drops
  // where they stand: walk it to your marker, opposite a wind tunnel, well away from the raid (2 minutes; touching one pops it, a knockback
  // and a slow). Heroic and up, Caustic Claws leaves puddles round the boss: the tank moves him off them (fail: a cyst dropped in the raid)
  surge(fail) {
    const L = 12, k = gdzKit(SZ, L), B = SZ_EN; szBoss(k); szCombo(k, 0, B); SZ_CY.forEach(([x, y], i) => k.wmark(SZ_MK[i], x, y));
    k.cast('sz', 'Venomous Surge', 0.3, 1); const TG = [['r2', 0], ['h3', 1]];
    TG.forEach(([id, ci], j) => { const q = fail && j === 0 ? nzAdd(B, 60, 14) : [SZ_CY[ci][0] + 1.5, SZ_CY[ci][1] + 1.5]; k.ring({ on: id, r: 2.6, fx: 'debuff', t0: 1, dur: 9.4, color: '#8fe36a', cn: 'Venomous Surge', legend: 'Venomous Surge: take your cyst to your marker' }); k.hold(1.2, id).at(9.8, id, q[0], q[1]);
      k.ring({ x: q[0], y: q[1], r: 4, fx: 'puddle', t0: 10.4, dur: L - 10.4, color: '#8fe36a', fill: 'rgba(143,227,106,.4)', cn: 'Viscous Cyst', legend: 'a Viscous Cyst: touching it pops it' }); });
    [[-30, -14], [-38, 2], [-26, 4]].forEach(([x, y], i) => k.ring({ x, y, r: 3.5, fx: 'puddle', t0: 1.4 + i * 0.4, dur: L, color: '#c8e65a', fill: 'rgba(200,230,90,.35)', cn: 'Caustic Residue', legend: 'Caustic Claws\' puddles: more damage taken while you stand in them' }));
    szBoss(k, 2.6, B); szBoss(k, 5, [B[0] - 4, B[1] - 5]); k.call(2.4, 4.6, 'Tank: off the puddles', { on: 't1', color: '#5aa0ff', ink: '#fff' });
    k.call(10.4, 12, 'Raid hit, less far away', { x: -10, y: 20, color: '#8fe36a', ink: '#0a1a06' });
    if (fail) { k.hold(10.8, 'm2').at(11.6, 'm2', nzAdd(B, 60, 14)[0] + 1, nzAdd(B, 60, 14)[1]); k.ring({ x: nzAdd(B, 60, 14)[0], y: nzAdd(B, 60, 14)[1], r: 9, fx: 'burst', t0: 11.4, at: 11.8, dur: 0.6, color: '#8fe36a', cn: 'Cyst popped', legend: 'a cyst popped too early: knocked back and slowed' }); k.oops('r2', 10.4); k.step(0.3).step(1.2).step(10.4);
      k.pause(11.9, 'This cyst was dropped in the raid, not at its marker. A melee walked into it and popped it: knocked back, slowed, and one cyst short for the winds.', { x: nzAdd(B, 60, 14)[0], y: nzAdd(B, 60, 14)[1], r: 10 });
      return k.done({ title: 'Mistake: a cyst dropped in the raid', focus: { x: -12, y: 6, r: 44 }, badLabel: 'dropped it in the raid' }); }
    k.ring1(TG.map((q) => q[0])).step(0.3).step(1.2).step(2.4).step(10.4);
    k.pause(6, 'The two Surge players walk their cysts to their markers, each across from a wind tunnel, far from the raid. Meanwhile the tank pulls the boss off his puddles.', { x: -12, y: 6, r: 40 });
    return k.done({ title: 'Venomous Surge: cysts to the markers', focus: { x: -12, y: 6, r: 44 }, hlLabel: 'the two Surge players' });
  },
  // Raging Crosswinds: marked players get an arrow and are launched that way about 8 seconds later. Stand so a partner's arrow points at you
  // (head on, or at right angles on Mythic) and you collide in the air; or cancel it with an immunity or a movement ability. Priests and
  // Paladins usually can't cancel: they ping themselves so a partner lines up with them (fail: a Priest with nobody lined up)
  crosswinds(fail) {
    const L = 11, k = gdzKit(SZ, L), B = [-6, -2]; szBoss(k, 0, B); szClump(k, 0, ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], nzAdd(B, 0, 8), 6.5); szClump(k, 0, ['h1', 'h2', 'h3', 'h4', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], nzAdd(B, 0, 26), 11); k.at(0, 't1', B[0] - 5, B[1]).at(0, 't2', B[0] - 6, B[1] + 8);
    // (pairs: r1 north-arrow with r4 south-arrow head on; h2 west-arrow with r5 east-arrow head on; r6 north-arrow with h4 west-arrow at right angles; m3 cancels)
    const PR = [['r1', 'n', 'r4', 's', [20, 2]], ['h2', 'w', 'r5', 'e', [30, 22]]], RA = ['r6', 'n', 'h4', 'w', [18, 30]];
    const ar = (id, dir, t1) => { const p = k.posAt(id, 3), q = nzAdd(p, SZ_AR[dir], 9); k.link({ from: id, toYd: { x: q[0], y: q[1] }, t0: 1, t1, color: '#c9e8ff', legend: 'the arrow: where you\'ll be launched' }); };
    PR.forEach(([a, da, b, db, c]) => { const pa = nzAdd(c, SZ_AR[db], 5), pb = nzAdd(c, SZ_AR[da], 5); k.hold(0.6, [a, b]).at(3, a, pa[0], pa[1]).at(3, b, pb[0], pb[1]); ar(a, da, 8); ar(b, db, 8); k.hold(8, [a, b]).at(8.6, a, c[0] - 1.5, c[1]).at(8.6, b, c[0] + 1.5, c[1]); });
    const [ra, rda, rb, rdb, rc] = RA; if (!fail) { const pa = nzAdd(rc, SZ_AR[rda] + 180, 6), pb = nzAdd(rc, SZ_AR[rdb] + 180, 6); k.hold(0.6, [ra, rb]).at(3, ra, pa[0], pa[1]).at(3, rb, pb[0], pb[1]); ar(ra, rda, 8); ar(rb, rdb, 8); k.hold(8, [ra, rb]).at(8.7, ra, rc[0] - 1.5, rc[1] + 1).at(8.7, rb, rc[0] + 1.5, rc[1] - 1); }
    else { const pa = [36, 20]; k.hold(0.6, ra).at(3, ra, pa[0], pa[1]); ar(ra, rda, 8); const q = nzAdd(pa, SZ_AR[rda], 46); k.hold(8, ra).at(9.4, ra, q[0], q[1]); k.call(8, 9.6, 'Knocked back', { on: ra, color: '#ff3b3b', ink: '#fff' }); }
    k.ring({ on: 'm3', r: 3, fx: 'safe', t0: 7.4, dur: 1.4, color: '#ffd23b', cn: 'Immunity', legend: 'an immunity or movement ability cancels your own launch' }); k.call(6.8, 8.6, 'Cancel', { on: 'm3', color: '#ffd23b', ink: '#1a1400' });
    k.call(1, 3, 'Arrows out: find your partner', { x: 10, y: 44, color: '#c9e8ff', ink: '#06131c' });
    if (fail) { k.oops(ra, 9.4); k.step(1).step(3).step(8);
      k.pause(9.6, 'This Priest can\'t cancel their launch and nobody lined up with them: they were thrown straight off the platform.', { x: 40, y: 34, r: 14 });
      return k.done({ title: 'Mistake: nobody lined up with the Priest', focus: { x: 18, y: 14, r: 40 }, badLabel: 'thrown off' }); }
    k.ring1(['r1', 'r4', 'h2', 'r5', 'r6', 'h4']).step(1).step(3).step(8);
    k.pause(5, 'Each marked player finds a partner whose arrow points at them, head on or at right angles, and they collide in the air. Anyone who can cancel it just cancels.', { x: 22, y: 16, r: 22 });
    return k.done({ title: 'Raging Crosswinds: collide with a partner', focus: { x: 18, y: 14, r: 34 }, hlLabel: 'players with arrows' });
  },
  // Dig In (100 energy, about every 2 minutes): 25 seconds of +30% damage taken in the middle while three winds blow from the tunnels in
  // order (the motes over each tunnel show it). The raid stacks in the middle; each wind pushes the stack into the cyst opposite its tunnel,
  // which pops and knocks everyone back. After the third, a mobile player pops the cyst at the exit, which throws the raid toward the
  // entrance for the next phase (fail: a player off the stack is blown off the platform)
  digin(fail) {
    const L = 31.4, k = gdzKit(SZ, L), B = SZ_C; szBoss(k, 0, B); k.ring({ on: 'sz', r: 5, fx: 'zone', t0: 0.4, dur: 28, color: '#ffd23b', fill: 'rgba(255,210,59,.12)', cn: 'Dig In', legend: 'Dig In: he takes 30% more damage for 25 seconds' });
    SZ_CY.forEach(([x, y], i) => { k.wmark(SZ_MK[i], x, y); const end = i < 3 ? 6.4 + i * 7.5 : 27.6; k.ring({ x, y, r: 4, fx: 'puddle', t0: 0, dur: end, color: '#8fe36a', fill: 'rgba(143,227,106,.4)', cn: 'Viscous Cyst', legend: 'a Viscous Cyst' }); });
    const ALL = ['t1', 't2'].concat(SZ_L, SZ_R), OFF = fail ? 'r6' : null, home = (t, hold) => szClump(k, t, ALL.filter((id) => id !== OFF), [B[0], B[1] - 12], 8, hold);
    home(0); if (OFF) k.at(0, OFF, B[0] - 12, B[1] - 20);
    const WN = [['the north', 0], ['the south', 1], ['the south-east', 2]];
    WN.forEach(([from, ci], w) => { const t0 = 1 + w * 7.5, cy = SZ_CY[ci], d = [cy[0] - B[0], cy[1] - B[1]], n = Math.hypot(d[0], d[1]), tgt = [cy[0] - d[0] / n * 6, cy[1] - d[1] / n * 6];
      k.call(t0, t0 + 2.4, 'Wind ' + (w + 1) + ' from ' + from, { x: 14, y: 50, color: '#c9e8ff', ink: '#06131c' });
      szClump(k, t0 + 5, ALL.filter((id) => id !== OFF), [tgt[0], tgt[1]], 7, t0 + 0.6);
      k.ring({ x: cy[0], y: cy[1], r: 12, fx: 'burst', t0: t0 + 5, at: t0 + 5.4, dur: 0.8, color: '#8fe36a', cn: 'Cyst popped', legend: 'the cyst pops: everyone is knocked back to the middle' });
      k.call(t0 + 5.4, t0 + 6.8, 'Knocked back to the middle', { x: B[0], y: B[1] + 14, color: '#8fe36a', ink: '#0a1a06' }); home(t0 + 6.8, t0 + 5.5);
      if (OFF && w === 0) { const p = k.posAt(OFF, 0), q = [p[0] + d[0] / n * 52, p[1] + d[1] / n * 52]; k.hold(t0 + 0.6, OFF).at(t0 + 4, OFF, q[0], q[1]); k.call(t0 + 1, t0 + 4.2, 'Blown off', { on: OFF, color: '#ff3b3b', ink: '#fff' }); } });
    if (fail) { k.oops(OFF, 5); k.step(1).step(5).step(7.5);
      k.pause(5.4, 'This ranged wasn\'t in the stack when the first wind came. Nothing stopped them: they were blown off the platform.', { on: OFF, r: 10 });
      return k.done({ title: 'Mistake: off the stack when the wind blows', focus: { x: 0, y: 0, r: 50 }, badLabel: 'blown off' }); }
    // (the exit cyst: a mobile player pops it and the raid flies toward the entrance)
    const EXC = SZ_CY[3], PO = 'r7'; k.hold(22.9, PO).at(27.2, PO, EXC[0] - 3, EXC[1]); k.ring({ x: EXC[0], y: EXC[1], r: 12, fx: 'burst', t0: 27.2, at: 27.6, dur: 0.8, color: '#8fe36a', cn: 'Exit cyst popped', legend: 'the exit cyst: pops and throws the raid toward the entrance' });
    k.call(23, 27.2, 'Pop the exit cyst', { on: PO, color: '#7ee36a', ink: '#0a1a06' }); k.call(27.6, 29.8, 'Knocked back toward the entrance', { x: -20, y: 14, color: '#8fe36a', ink: '#0a1a06' });
    szClump(k, 29.6, ALL.filter((id) => id !== PO), [SZ_EN[0] + 6, SZ_EN[1]], 9, 27.7); k.hold(27.7, PO).at(29.6, PO, SZ_EN[0] + 12, SZ_EN[1] + 10);
    k.ring1([PO]).step(1).step(5.4).step(8.5).step(16).step(22.6);
    k.pause(4.6, 'Everyone stacks in the middle. The wind shoves the stack into the cyst across from its tunnel; it pops and knocks you back to the middle. Re-centre, then the next wind.', { x: 6, y: -16, r: 26 });
    return k.done({ title: 'Dig In: three winds, three cysts, then the exit', focus: { x: 0, y: 2, r: 50 }, hlLabel: 'the player popping the exit cyst' });
  },
};
const SZ_FAIL = {
  combo: { name: 'A Mutilate with too few in it', what: 'Most of the group drifts off and only four take the second Mutilate: split four ways, it kills.', do: ['The first group soaks.', 'The second group drifts off.', 'Four people take it: deaths.'], map: () => SZ_M.combo(true) },
  tempest: { name: 'Greeding into a tornado', what: 'A melee keeps hitting the boss as a tornado comes through: one touch and they\'re dead.', do: ['A tornado comes through the boss.', 'One melee doesn\'t move.', 'Dead.'], map: () => SZ_M.tempest(true) },
  fury: { name: 'One short in the Fury stack', what: 'Only 13 in the circle with the marked player: To the Slaughter never comes, his rage hits 100 and the raid dies.', do: ['The raid stacks.', 'One player short.', 'Rage 100: a wipe.'], map: () => SZ_M.fury(true) },
  surge: { name: 'A cyst dropped in the raid', what: 'A Surge player drops their cyst in the raid: someone walks into it, it pops early, and it\'s missing for the winds.', do: ['Surge on two players.', 'One drops it in the raid.', 'It\'s popped by accident.'], map: () => SZ_M.surge(true) },
  crosswinds: { name: 'Nobody lined up with the Priest', what: 'A Priest can\'t cancel their launch and has no partner: thrown off the platform.', do: ['Arrows go out.', 'The Priest has no partner.', 'Thrown off the edge.'], map: () => SZ_M.crosswinds(true) },
  digin: { name: 'Off the stack when the wind blows', what: 'A player isn\'t in the stack when a wind comes: nothing stops them and they\'re blown off the platform.', do: ['Dig In: the raid stacks.', 'One player stands apart.', 'Blown off by the wind.'], map: () => SZ_M.digin(true) },
};
// ---- the whole fight, by Wolfthorn's Mythic kill's clock (5:55)
const SZ_BEATS = {
  start: { name: 'The pull (Deep, to the entrance side)', do: ['Pull him deep, to the entrance side of the platform: the puddles that follow the tank combo stay out of the middle.', 'Bloodlust on the pull. Read the tunnels: put a marker across from each wind, and the fourth at the exit.'],
    run() { const k = gdzKit(SZ, 6); szBoss(k, 0, [0, 3]); szCombo(k, 0, [0, 3]); szBoss(k, 0.3, [0, 3]); szBoss(k, 5.6); szCombo(k, 5.6, SZ_EN, 1, 0.3); SZ_CY.forEach(([x, y], i) => k.wmark(SZ_MK[i], x, y)); k.step(0.2); } },
  toex: { name: 'To the exit side (Second tank combo)', do: ['After the winds, the tank takes him to the exit side of the platform for the second combo; the groups follow, the soak groups on the same sides.'],
    run() { const k = gdzKit(SZ, 7); szBoss(k, 0, [-6, -2]); szCombo(k, 0, [-6, -2]); szBoss(k, 0.3, [-6, -2]); szBoss(k, 6.6, SZ_EX); szCombo(k, 6.6, SZ_EX, -1, 0.3); k.step(0.2); } },
  end: { name: 'The end (Don\'t touch the last cyst)', do: ['After the last Dig In, don\'t pop the exit cyst: the enrage comes right after and the pop would kill.', 'In the enrage, people can taunt a Mutilate each and die to buy seconds. Burn him.'],
    run() { const k = gdzKit(SZ, 5); szBoss(k, 0, SZ_C); szClump(k, 0, ['t1', 't2'].concat(SZ_L, SZ_R), [SZ_C[0], SZ_C[1] - 12], 8); k.ring({ on: 'sz', r: 7, fx: 'burst', t0: 1.4, at: 2, dur: 0.8, color: '#ffd23b', cn: 'Sszorak dies', legend: 'the kill' }); k.show('sz', 0, 2.2); k.call(2.3, 4.6, 'Kill', { x: 10, y: 14 }); k.step(0.3); } },
};
const SZ_SIM = [
  { at: 0, beat: 'start' }, { at: 5, mech: 'combo', label: 'Tank combo 1 (entrance side)' }, { at: 25, mech: 'fury', label: 'Serpent\'s Fury 1' }, { at: 29, mech: 'surge', label: 'Venomous Surge 1' }, { at: 40, mech: 'crosswinds', label: 'Raging Crosswinds 1' },
  { at: 44, beat: 'toex' }, { at: 52, mech: 'combo', label: 'Tank combo 2 (exit side)', o: { ex: 1 } }, { at: 64, mech: 'tempest', label: 'Tempest 2' }, { at: 76, mech: 'fury', label: 'Serpent\'s Fury 2' }, { at: 77, mech: 'surge', label: 'Venomous Surge 2' }, { at: 87, mech: 'crosswinds', label: 'Raging Crosswinds 2' },
  { at: 100, mech: 'digin', ph: 1, label: 'Dig In 1' },
  { at: 129, mech: 'combo', ph: 2, label: 'Tank combo 3 (entrance side)' }, { at: 152, mech: 'fury', ph: 2, label: 'Serpent\'s Fury 3 (right after the combo)' }, { at: 156, mech: 'surge', ph: 2, label: 'Venomous Surge 3' }, { at: 167, mech: 'crosswinds', ph: 2, label: 'Raging Crosswinds 3' },
  { at: 172, beat: 'toex', ph: 2 }, { at: 179, mech: 'combo', ph: 2, label: 'Tank combo 4 (exit side)', o: { ex: 1 } }, { at: 202, mech: 'fury', ph: 2, label: 'Serpent\'s Fury 4' }, { at: 203, mech: 'surge', ph: 2, label: 'Venomous Surge 4' }, { at: 214, mech: 'crosswinds', ph: 2, label: 'Raging Crosswinds 4' },
  { at: 227, mech: 'digin', ph: 3, label: 'Dig In 2' },
  { at: 256, mech: 'combo', ph: 4, label: 'Tank combo 5 (entrance side)' }, { at: 279, mech: 'fury', ph: 4, label: 'Serpent\'s Fury 5 (right after the combo)' }, { at: 283, mech: 'surge', ph: 4, label: 'Venomous Surge 5' }, { at: 294, mech: 'crosswinds', ph: 4, label: 'Raging Crosswinds 5' },
  { at: 300, beat: 'toex', ph: 4 }, { at: 306, mech: 'combo', ph: 4, label: 'Tank combo 6 (exit side)', o: { ex: 1 } }, { at: 326, mech: 'fury', ph: 4, label: 'Serpent\'s Fury 6' }, { at: 330, mech: 'surge', ph: 4, label: 'Venomous Surge 6' }, { at: 341, mech: 'crosswinds', ph: 4, label: 'Raging Crosswinds 6' },
  { at: 355, beat: 'end', ph: 4 },
];
const SZ_DUR = { 'm:combo': 20, 'm:tempest': 30, 'm:fury': 6, 'm:surge': 11, 'm:crosswinds': 8, 'm:digin': 25, 'b:start': 5, 'b:toex': 8, 'b:end': 0 };
const SZ_SEV = { 'm:combo': 3, 'm:tempest': 3, 'm:fury': 3, 'm:surge': 2, 'm:crosswinds': 2, 'm:digin': 3, 'b:start': 1, 'b:toex': 1, 'b:end': 1 };
GDZ['Sszorak'] = {
  upd: ['12.1', 'Oct 21, 2026'],
  stepRoles: {
    'Apex Predator (Soaks take turns, Ravage at the edge)': ['d', 't', 't', '', 't'], 'Tempest (Step off for the tornadoes)': ['', 'd', ''], 'Serpent\'s Fury (14 in the circle, then spread)': ['', 'd', 'd', 'd'],
    'Venomous Surge (Cysts to the markers)': ['', 'd', 't'], 'Raging Crosswinds (Collide with a partner)': ['', 'd', 'd'], 'Dig In (Three winds, three cysts, then the exit)': ['', '', '', 'd', ''],
  },
  sum: 'One boss on a loop: the tank combo, Serpent\'s Fury on Mythic, Venomous Surge and Raging Crosswinds, twice, then Dig In and its three winds. The first combo of each phase at the entrance side, the second at the exit side, the winds and Dig In in the middle. Tornadoes kill more raids than anything else here.',
  m: { sim: SZ_SIM, simDur: SZ_DUR, simSev: SZ_SEV, beats: SZ_BEATS,
    simAlways: ['Tornadoes: step off, never greed. Call them when they pass through the boss.', 'Each Mutilate on one group, the next on the other.', 'Mythic: 14 in the Fury circle right after every tank combo, or the raid dies at 100 rage.', 'Every phase is rinse and repeat: entrance side, exit side, then Dig In.'],
    source: 'Tactyks\' Mythic Sszorak video', sum: 'Heroic plus Serpent\'s Fury: the farthest player is marked while his rage climbs to a wipe at 100; 14 players stacking on them resets it, and Virulence spreads from everyone in the stack. Raging Crosswinds has four directions.' },
  facts: [['Phases', '1, on a loop (Dig In every ~2 min)'], ['Bloodlust', 'On the pull'], ['Healers', '4', 'm'], ['Hardest part', 'Tornadoes and the Fury stack'], ['Enrage', 'About 6:20', 'm']],
  phases: [
    { id: 'p1', name: 'The loop: two tank combos, then Dig In', sum: 'Tank combo, Surge and Crosswinds at the entrance side, the same again at the exit side, then Dig In in the middle. Rinse and repeat three times.',
      m: { sum: 'The same loop, plus Serpent\'s Fury right after every tank combo.' },
      mechs: [
        { id: 'combo', fail: SZ_FAIL.combo, name: 'Apex Predator (Soaks take turns, Ravage at the edge)', spell: 'Apex Predator', what: 'Five casts at the current tank, in random order: two Ravage (a huge hit and much more damage from the next), two Mutilate (a frontal soak split between everyone in it; the next one hits those players far harder) and one Tempest (tornadoes).',
          do: ['Mutilate: one of the two soak groups stands in it with the tank. 5 or more.', 'Ravage: the tank takes it alone, aimed at the edge.', 'The other tank taunts after the first Ravage or Mutilate.', 'The other group takes the next Mutilate.', 'Tempest: tornadoes. Step clear.'],
          m: { plan: ['Two soak groups, left and right, nine each; they never take two in a row.', 'Corroding Venom stacks on the tank: swap around 6 (it lines up with the combo swaps). A Blood Death Knight can tank most of the fight.'] },
          map: (d, o) => SZ_M.combo(false, o) },
        { id: 'tempest', fail: SZ_FAIL.tempest, name: 'Tempest (Step off for the tornadoes)', spell: 'Tempest', what: 'Tornadoes roam out from the boss for about half a minute. They kill anyone but a tank, sometimes in one touch. The number one killer on this boss.',
          do: ['Call the tornadoes as they pass through the boss.', 'Melee: step off, come back once it has passed.', 'Never greed: the DPS check only gets easier.'],
          plan: ['Leave the melee a big pocket round the boss, so they have room to dodge.'],
          map: () => SZ_M.tempest() },
        { id: 'fury', only: 'm', fail: SZ_FAIL.fury, name: 'Serpent\'s Fury (14 in the circle, then spread)', spell: 'Serpent\'s Fury', what: 'The farthest player from the boss is marked while his rage climbs; at 100 the raid dies. When 14 players are within 8 yards of the marked player he charges them and his rage resets. Everyone in it gets Virulence: short lines 5 seconds later that pass it to anyone they hit.',
          do: ['Right after each tank combo, the raid stacks near the boss.', 'The assigned Hunter, who always has the mark, walks in 1 second before the Surge bombs.', '14 in the circle: he charges, rage resets.', 'Spread to your Virulence spot: half outside, half inside.'],
          plan: ['Soak with all DPS, the other tank and the mobile healers.', 'Keep the stack close to melee range, or it can fail to count.', 'Phases two and three: the first stack has to pop right after the last tank buster (his rage is already about 94).', 'Never stack on the marked player just before or after Dig In: it pops on its own.'],
          map: () => SZ_M.fury() },
        { id: 'surge', fail: SZ_FAIL.surge, name: 'Venomous Surge (Cysts to the markers)', spell: 'Venomous Surge', what: 'Two players get a 10-second DoT; when it ends the raid takes a hit, less the farther away, and a Viscous Cyst drops where they stand. A cyst lasts 2 minutes; touching it pops it, a knockback and a slow. The intermission needs one per wind.',
          do: ['Read the tunnels: a marker across from each wind, and the fourth at the exit.', 'Surge on you: walk your cyst to your marker.', 'Heroic and up: the tank pulls the boss off Caustic Claws\' puddles.'],
          m: { plan: ['Northern Sky Raid Tools\' wind helper: the raid leader clicks the marker across from each wind and everyone sees their drop spot (the group must be 20 or fewer).'] },
          map: () => SZ_M.surge() },
        { id: 'crosswinds', fail: SZ_FAIL.crosswinds, name: 'Raging Crosswinds (Collide with a partner)', spell: 'Raging Crosswinds', what: 'Marked players get an arrow and are launched that way about 8 seconds later. Two players whose arrows meet collide in the air and stay put.',
          do: ['Arrow on you: find a partner whose arrow points at you.', 'Head on, or at right angles on Mythic: you collide and stop.', 'Can cancel it (an immunity or a movement ability)? Just cancel.'],
          m: { plan: ['Priests and Paladins usually can\'t cancel: they ping themselves so a partner lines up head on with them.', 'Don\'t stand too close to a flying player\'s path.'] },
          map: () => SZ_M.crosswinds() },
      ],
      tiles: [
        { name: 'Corroding Venom (Swap around 6)', do: 'His hits stack more physical damage taken on the tank. Swap around 6 stacks; it lines up with the combo swaps.' },
      ] },
    { id: 'dig', name: 'Dig In: the winds', sum: 'At full energy, about every 2 minutes, he digs in for 25 seconds and takes 30% more damage. Three winds blow from the tunnels; each pushes the raid into a cyst. Then the exit cyst throws everyone back to the entrance.',
      mechs: [
        { id: 'digin', fail: SZ_FAIL.digin, name: 'Dig In (Three winds, three cysts, then the exit)', spell: 'Dig In', what: 'For 25 seconds he takes 30% more damage while three winds blow from the tunnels, in the order the motes over them show. Each wind pushes everyone into the cyst across from its tunnel; the cyst pops and knocks them back.',
          do: ['Stack in the middle.', 'Each wind pushes the stack into the cyst across from its tunnel. It pops: you\'re back in the middle.', 'Re-centre before the next wind.', 'After the third, a mobile player pops the exit cyst.', 'Everyone flies to the entrance side: the next phase starts there.'],
          m: { plan: ['Two-minute cooldowns: don\'t lose a use to fit the 30%; many specs open with one press and save their cooldowns for the back half.', 'Two Evokers (Time Spiral) are nice here, not needed.', 'After the last Dig In, don\'t pop the exit cyst: the enrage follows.'] },
          map: () => SZ_M.digin() },
      ] },
  ],
  roles: {
    t: ['Ravage alone, aimed at the edge; taunt after the first Ravage or Mutilate.', 'Pull deep to the entrance side; the second combo at the exit side.', 'Move the boss off Caustic Claws\' puddles.'],
    h: ['Two soak groups take turns on Mutilate: heal the group that just soaked.', 'Mobile healers join the Fury stack.', 'Raid hits after each Surge.'],
    d: ['Tornadoes: step off. Never greed.', 'Mutilate with your group, never the next one.', 'Mythic: into the Fury stack right after the combo, then to your Virulence spot.', 'Crosswinds: collide with a partner, or cancel.'],
  },
};

// ===== The Twin Fangs (notes/Guides/Bosses/6 The Twin Fangs.md: Tactyks' Mythic video read in full, the spell text, and Wolfthorn's
// Mythic kill 9DRWhKnZbHtQgf4a #37 (6:43) for the clock and the spots). Yards from the room picture's centre, x east, y north (the picture
// matches the game). A triangular walkway round a central pool: each "platform" is one corner of the triangle, the two bosses in the
// venom off its tip. Platform 1 is the north corner; platform 2 the south-west one (the same layout turned 120 degrees and mirrored, as
// the bosses sit); platform 3 the south-east one (turned 120 degrees the other way). Every map is drawn on platform 1 and turned.
GDZ_ORIGIN['The Twin Fangs'] = { cx: 0, cy: 612 }; GDZ_FULL['The Twin Fangs'] = { x: 44, y: -24, r: 50 }; /* (the cards are drawn on the south-east platform; the whole fight uses its own view) */
const TF = 'The Twin Fangs', TF_VX = [-16, 82], TF_IT = [16, 81];
// the turn for each platform: 0 north, 1 south-west (turned and mirrored), 2 south-east (turned)
function tfT(plat) { const c = Math.cos(-120 * Math.PI / 180), s = Math.sin(-120 * Math.PI / 180), R = (p) => [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
  if (plat === 2) return { P: R, A: (d) => d - 120 }; if (plat === 1) return { P: (p) => { const q = R(p); return [-q[0], q[1]]; }, A: (d) => 180 - (d - 120) }; return { P: (p) => p, A: (d) => d }; }
// the corner's walkable stone, in platform 1's frame, from where our kill's players stood (the green rim is not walkable: you fall
// off): from about y 46 up it narrows toward the tip, so a player spot past the edge is pulled back onto the stone
function tfIn(p, m) { const [x, y] = p, e = m || 0, hi = (y <= 46 ? 99 : 30 - (y - 46) * 0.7) - e, lo = (y <= 50 ? -99 : -29 + (y - 50) * 0.7) + e; return [Math.min(hi, Math.max(lo, x)), Math.min(76 - e, y)]; } /* (m: keep that many yards in from the edge) */
// a kit wrapper that turns every spot (and direction) for the platform
function tfKit(L, plat) { const k = gdzKit(TF, L), T = tfT(plat || 0), P = T.P;
  const w = { k, P, A: T.A,
    at: (t, id, x, y) => { const q = P(tfIn([x, y])); k.at(t, id, q[0], q[1]); return w; }, hold: (t, ids) => { k.hold(t, ids); return w; },
    boss: (id, n, t, x, y) => { const q = P([x, y]); k.boss(id, n, t, q[0], q[1]); return w; }, add: (id, n, t, x, y) => { const q = P([x, y]); k.add(id, n, t, q[0], q[1]); return w; },
    ring: (o) => { const q = o.x != null ? P([o.x, o.y]) : [undefined, undefined]; k.ring({ ...o, x: q[0], y: q[1] }); return w; },
    call: (t0, t1, text, o) => { o = o || {}; const q = o.x != null ? P([o.x, o.y]) : [undefined, undefined]; k.call(t0, t1, text, { ...o, x: q[0], y: q[1] }); return w; },
    pause: (t, text, o) => { o = o || {}; const q = o.x != null ? P([o.x, o.y]) : [undefined, undefined]; k.pause(t, text, { ...o, x: q[0], y: q[1] }); return w; },
    wave: (o) => { const q = P([o.x, o.y]); k.wave({ ...o, x: q[0], y: q[1], deg: T.A(o.deg || 0) }); return w; },
    link: (o) => { k.link(o.toYd ? { ...o, toYd: ((q) => ({ x: q[0], y: q[1] }))(P([o.toYd.x, o.toYd.y])) } : o); return w; },
    done: (o) => { const f = o.focus ? P([o.focus.x, o.focus.y]) : null; return k.done({ ...o, focus: f ? { x: f[0], y: f[1], r: o.focus.r } : o.focus }); },
    posAt: (id, t) => { const q = k.posAt(id, t); if (!q || !plat) return q; /* (back into platform 1's frame) */ const T0 = tfT(plat), c = Math.cos(120 * Math.PI / 180), s = Math.sin(120 * Math.PI / 180); const m = plat === 1 ? [-q[0], q[1]] : q; return [m[0] * c - m[1] * s, m[0] * s + m[1] * c]; },
  };
  return w; }
// the platform's home: both tanks under the tip, melee between them, ranged and healers spread behind, toward the pool
const TF_MEL = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], TF_RNG = ['r1', 'h1', 'r2', 'r3', 'h2', 'r4', 'r5', 'h3', 'r6', 'h4', 'r7'];
const TF_HOME = (() => { const H = { t1: [-11, 64], t2: [11, 64] }; TF_MEL.forEach((id, i) => { H[id] = [-18 + i * 6, i % 2 ? 51 : 56]; }); const RS = [[-24, 44], [-14, 40], [-4, 44], [6, 40], [16, 44], [26, 40], [-20, 34], [-8, 32], [4, 34], [14, 32], [24, 33]]; TF_RNG.forEach((id, i) => { H[id] = RS[i]; }); return H; })();
function tfHome(w, t, hold, skip) { Object.entries(TF_HOME).forEach(([id, q]) => { if (skip && skip.includes(id)) return; if (hold != null) w.hold(hold, id); w.at(t, id, q[0], q[1]); }); return w; }
function tfBosses(w, t) { w.boss('vx', 'Vexhul', t || 0, TF_VX[0], TF_VX[1]).boss('it', 'Ithraz', t || 0, TF_IT[0], TF_IT[1]); return w; }
// Ravenous Feast's groups: knocked right, knocked left, and the front group
const TF_GR = ['m6', 'm7', 'h2', 'r4', 'r7', 'h4'], TF_GL = ['m1', 'm2', 'r1', 'h1', 'r5', 'h3'], TF_GF = ['m3', 'm4', 'm5', 'r2', 'r3', 'r6'];
// the ten Broodling slots on platform 1 (the kill), named as the raid calls them
const TF_SLOT = { L1: [-37, 43], L2: [-33, 51], L3: [-30, 65], L4: [-27, 72], R1: [39, 43], R2: [33, 50], R3: [30, 64], R4: [26, 71], FL: [-6, 80], FR: [6, 80] };
const TF_M = {
  // Caustic Deluge (Vexhul) with Blood Torrent (Ithraz, Mythic): a beam on Vexhul's tank that shoves them back, and a huge heal absorb on
  // Ithraz's tank: the biggest tank damage of the fight (Paladins: Bubble, Spellwarding, Bubble; otherwise big externals). Acid splashes
  // drop Caustic Globules that explode on the raid after 10 seconds unless someone soaks them (+1 venom stack). Mythic: each globule is
  // shielded until it's crowd controlled (Barbed Bulwark knocks soakers back): AoE CC as they land, then a low-stack player soaks each
  // (fail: one left to explode)
  beams(fail, d, o) {
    const myth = d !== 'h', plat = o && o.p != null ? o.p : 2, L = 15, w = tfKit(L, plat), k = w.k; tfBosses(w); tfHome(w, 0);
    k.cast('vx', 'Caustic Deluge', 0.4, 1.6); if (myth) k.cast('it', 'Blood Torrent', 0.4, 1.6);
    w.link({ from: 'vx', to: 't1', t0: 1.6, t1: 3.4, color: '#9ff26d', legend: 'Caustic Deluge: a beam that shoves the tank back' }); w.hold(1.6, 't1').at(3, 't1', -12, 54);
    if (myth) { k.ring({ on: 't2', r: 3, fx: 'debuff', t0: 1.6, dur: 6, color: '#ff4a5a', cn: 'Blood Torrent', legend: 'Blood Torrent: a huge heal absorb on the tank' }); w.call(1.6, 4, 'Big defensive', { on: 't2', color: '#5aa0ff', ink: '#fff' }); }
    w.call(1.6, 3.6, 'Pushed back', { on: 't1', color: '#9ff26d', ink: '#0a1a06' });
    // (the 15 globules of set 3 in our kill, platform 1's frame; low-stack players soak, here whoever is nearest, tanks aside)
    const G = [[-15, 48], [-4, 59], [22, 58], [3, 47], [-5, 68], [10, 42], [-4, 45], [22, 42], [17, 66], [4, 52], [1, 34], [0, 64], [9, 32], [18, 28], [23, 31]];
    const SO = (() => { const free = new Set(Object.keys(TF_HOME).filter((id) => !/^t/.test(id))), left = new Set(G.map((_, i) => i)), out = []; /* (the closest globule and player first, again and again) */
      while (left.size) { let b = null; for (const i of left) for (const id of free) { const q = TF_HOME[id], dd = Math.hypot(q[0] - G[i][0], q[1] - G[i][1]); if (!b || dd < b[0]) b = [dd, i, id]; } out[b[1]] = b[2]; left.delete(b[1]); free.delete(b[2]); } return out; })();
    G.forEach(([x, y], i) => { const t0 = 3 + i * 0.15, id = 'gl' + i; w.add(id, 'Caustic Globule', t0, x, y); const tSoak = (fail && i === 4) ? L : 8.2 + (i % 3) * 0.4; k.show(id, t0, tSoak);
      w.ring({ x, y, r: 2.6, fx: 'zone', t0, dur: tSoak - t0, color: '#9ff26d', fill: 'rgba(159,242,109,.3)', cn: 'Caustic Globule', legend: 'a globule: soak it within 10 seconds or it hits the raid' });
      if (myth) w.ring({ x, y, r: 3.4, fx: 'safe', t0, dur: 6.2 - t0, color: '#ffd23b', cn: 'Barbed Bulwark', legend: 'Mythic: shielded until it\'s crowd controlled' }); });
    if (myth) { [[-8, 50], [10, 38], [12, 60], [-4, 64]].forEach(([x, y], j) => { w.ring({ x, y, r: 10, fx: 'burst', t0: 5.6, at: 6, dur: 0.6, color: '#7fd8ff', cn: 'AoE crowd control', legend: 'an AoE crowd control breaks the shields' }); }); w.call(5.2, 6.8, 'CC the globules', { x: 0, y: 66, color: '#7fd8ff', ink: '#06131c' }); }
    G.forEach(([x, y], i) => { if (fail && i === 4) return; const id = SO[i], tS = 8.2 + (i % 3) * 0.4, p0 = w.posAt(id, 0); w.hold(5.6, id).at(tS, id, x + 1.2, y - 1.2).hold(tS + 0.6, id).at(tS + 0.6 + Math.max(2.8, Math.hypot(p0[0] - x, p0[1] - y) / 8.5), id, p0[0], p0[1]); });
    if (fail) { const g = G[4]; w.ring({ x: g[0], y: g[1], r: 8, fx: 'burst', t0: 12.6, at: 13, dur: 0.8, color: '#ff3b3b', cn: 'Globule explodes', legend: 'a globule nobody soaked explodes on the raid' }); gdzFailBlast(k, 13.2, 'A globule exploded: a raid hit', ...w.P([0, 40]), [], 'Caustic Globule'); k.step(0.4).step(3).step(8.2).step(13);
      w.pause(12.4, 'Nobody took this globule. Ten seconds after it landed it exploded on the whole raid.', { x: g[0], y: g[1], r: 8 });
      return w.done({ title: 'Mistake: a globule left to explode', focus: { x: 0, y: 48, r: 30 } }); }
    k.ring1(['t1', 't2'].concat(SO.slice(0, 3))).step(0.4).step(1.6).step(myth ? 5.2 : 3).step(8.2);
    w.pause(myth ? 6.2 : 4, myth ? 'Both beams at once: big defensives on both tanks. 15 globules land: AoE crowd control breaks their shields, then a low-stack player soaks each one.' : 'Vexhul\'s beam shoves his tank back. Globules land all over: a low-stack player soaks each one.', { x: 0, y: 46, r: 28 });
    return w.done({ title: myth ? 'Caustic Deluge and Blood Torrent: CC, then soak the globules' : 'Caustic Deluge: soak the globules', focus: { x: 0, y: 48, r: 30 }, hlLabel: 'the tanks, and a few globule soakers' });
  },
  // Stone Breaker (Ithraz): his tank is shoved back, then three slams land on marked spots in order: the tank steps into each in the order
  // they appeared (a missed slam hits the raid and knocks everyone back). Swap tanks after each set: each slam stacks a vulnerability
  // (fail: the tank misses the third slam)
  slams(fail, d, o) {
    const plat = o && o.p != null ? o.p : 2, L = 11, w = tfKit(L, plat), k = w.k; tfBosses(w); tfHome(w, 0); k.cast('it', 'Stone Breaker', 0.4, 1.6);
    w.hold(1.6, 't2').at(2.6, 't2', 12, 56); w.call(1.6, 3, 'Pushed back', { on: 't2', color: '#c9a36a', ink: '#141006' });
    const S = [[18, 60], [8, 62], [16, 68]]; S.forEach(([x, y], i) => { const t = 4.4 + i * 1.8; w.ring({ x, y, r: 3.4, fx: 'soak', t0: 2.8 + i * 0.3, at: t, dur: t - 2.8 - i * 0.3 + 0.3, color: '#c9a36a', cn: 'Stone Breaker', legend: 'a slam: the tank stands in it, in the order they appeared' });
      w.ring({ x, y, r: 1, fx: 'zone', t0: 2.8 + i * 0.3, dur: 1.2, color: '#ffd23b', fill: 'rgba(255,210,59,.7)', cn: 'Slam order ' + (i + 1), legend: 'the order the slams appear in' }); if (fail && i === 2) return; w.hold(t - 1.6, 't2').at(t - 0.2, 't2', x, y); });
    w.call(2.8, 4.2, '1, 2, 3: in order', { x: 26, y: 74, color: '#c9a36a', ink: '#141006' });
    if (fail) { gdzFailBlast(k, 8.2, 'A missed slam: raid hit and knockback', ...w.P([4, 42]), [], 'Stone Breaker'); w.ring({ x: 2, y: 48, r: 40, fx: 'burst', t0: 7.8, at: 8.2, dur: 0.9, color: '#ff3b3b', cn: 'Stone Breaker', legend: 'a missed slam hits the whole raid' }); k.oops('t2', 8); k.step(0.4).step(2.8).step(8);
      w.pause(8.4, 'The tank stayed on the second spot. The third slam hit nobody: it hit the raid and knocked everyone back.', { x: S[2][0], y: S[2][1], r: 8 });
      return w.done({ title: 'Mistake: a missed slam', focus: { x: 10, y: 56, r: 22 }, badLabel: 'missed the slam' }); }
    k.ring1(['t2']).step(0.4).step(2.8).step(4.4);
    w.pause(3.4, 'Three spots light up in order. Ithraz\'s tank steps into each one in that order; nobody else goes near them.', { x: 14, y: 62, r: 12 });
    return w.done({ title: 'Stone Breaker: the tank takes each slam in order', focus: { x: 10, y: 56, r: 22 }, hlLabel: 'Ithraz\'s tank' });
  },
  // Venomous Emergence: three Spawn of Vexhul rise at the pool's edge (+1 venom stack on everyone); each fires Corrosive Spit beams at
  // players (+1 stack): kill them before their second Spit. Spit targets move once, then stand still (fail: too slow, a second Spit)
  emergence(fail, d, o) {
    const plat = o && o.p != null ? o.p : 2, L = 13.4, w = tfKit(L, plat), k = w.k; tfBosses(w); tfHome(w, 0); k.cast('vx', 'Venomous Emergence', 0.4, 2.6);
    const SP = [[0, 24], [-7, 21], [7, 21]]; SP.forEach(([x, y], i) => { const id = 'sv' + i; w.add(id, 'Spawn of Vexhul', 2.6, x, y); k.show(id, 2.6, fail ? L : 8.6 + i * 0.4); });
    w.call(2.6, 4.4, '+1 stack for everyone', { x: 0, y: 46, color: '#9ff26d', ink: '#0a1a06' });
    const SW = ['m1', 'm2', 'm3', 'm5', 'm6', 'r1', 'r2', 'r3', 'r4', 'r5']; SW.forEach((id, i) => { const p = SP[i % 3], [dx, dy] = gdzSpot(i, SW.length, 8), h = TF_HOME[id]; let q = [p[0] + dx, p[1] + 11 + dy * 0.6];
      if (/^r/.test(id)) { const dd = Math.hypot(q[0] - h[0], q[1] - h[1]); q = dd > 18 ? [h[0] + (q[0] - h[0]) * (dd - 18) / dd, h[1] + (q[1] - h[1]) * (dd - 18) / dd] : h; } /* (ranged: only close enough to be in range) */
      w.hold(2.4, id).at(6, id, q[0], q[1]); });
    const TG = ['h2', 'r6', 'r7']; TG.forEach((id, i) => { w.link({ from: 'sv' + i, to: id, t0: 4, t1: 5.6, color: '#9ff26d', legend: 'Corrosive Spit: a beam on a player, +1 stack' }); });
    w.call(4, 5.6, 'Spit: stand still', { x: -3, y: 8, color: '#9ff26d', ink: '#0a1a06' });
    if (fail) { TG.forEach((id, i) => { w.link({ from: 'sv' + i, to: id, t0: 9.4, t1: 11, color: '#ff3b3b', legend: 'a second Spit: another stack' }); }); w.call(9.4, 11.6, 'Second Spit: +1 stack again', { x: -3, y: 8, color: '#ff3b3b', ink: '#fff' }); k.step(0.4).step(2.6).step(9.4);
      w.pause(10, 'Too many stayed on the bosses: the Spawns lived long enough to Spit a second time. Every extra stack brings the raid closer to the cap.', { x: 0, y: 24, r: 14 });
      return w.done({ title: 'Mistake: a second Corrosive Spit', focus: { x: 0, y: 30, r: 32 } }); }
    SW.forEach((id) => { const q = TF_HOME[id]; w.hold(9.6, id).at(13.2, id, q[0], q[1]); });
    k.ring1(TG).step(0.4).step(2.6).step(4).step(8.6);
    w.pause(5, 'Almost everyone swaps to the Spawns at the pool\'s edge. Spit targets take their beam standing still. Kill all three before they Spit again.', { x: 0, y: 26, r: 16 });
    return w.done({ title: 'Venomous Emergence: kill the Spawns before the second Spit', focus: { x: 0, y: 30, r: 32 }, hlLabel: 'the Spit targets' });
  },
  // Mythic, Rouse the Brood: with the Spawns, 10 Broodlings of Ithraz rise in ten slots round the platform (our kill: 50 kicks in 5 sets;
  // the top team's: 40 in 4); each casts Visceral Burst (a raid hit and a stacking DoT): kick every one. The first set has one in each
  // slot; the second is random, so some slots get two. Six
  // ground markers line up on slot 3 each side; the Protection Paladins take the front ones (Divine Toll, Avenger's Shield) (fail: a
  // missed kick)
  brood(fail, d, o) {
    const plat = o && o.p != null ? o.p : 2, L = 11, w = tfKit(L, plat), k = w.k; tfBosses(w); tfHome(w, 0);
    const N = Object.keys(TF_SLOT), ALL = N, KK = { L1: 'r1', L2: 'm1', L3: 'm2', L4: 't1', R1: 'r4', R2: 'm6', R3: 'm7', R4: 't2', FL: 't1', FR: 't2' }, KX = {};
    ALL.forEach((s, i) => { const p = TF_SLOT[s], j = i >= N.length, q = j ? [p[0] + (p[0] < 0 ? -3.5 : 3.5), p[1] + 2.5] : p, id = 'bl' + i; w.add(id, 'Broodling', 0.6 + (i % 5) * 0.15, q[0], q[1]); const by = j ? KX[s] : KK[s];
      const miss = fail && s === 'R2' && !j, bar = miss || (!j && ['FL', 'FR', 'L3'].includes(s)); /* (cast bars on three, so the kicks read clearly) */ if (bar) k.cast(id, 'Visceral Burst', 1.6 + (i % 4) * 0.5, 4 + (i % 4) * 0.5, miss ? 'done' : 'kick', gdzName(by)); k.show(id, 0.6, miss ? L : 4.4 + (i % 4) * 0.5); });
    ['diamond', 'star', 'moon', 'triangle', 'circle', 'square'].forEach((m, i) => { const s = ['L3', 'R3', 'L1', 'R1', 'L2', 'R2'][i], p = TF_SLOT[s], q = w.P(tfIn([p[0] * 0.75, p[1] * 0.96 - 2], 2)); k.wmark(m, q[0], q[1]); /* (a step in from the rim) */ });
    w.call(0.6, 2.4, 'Kick all 10 Broodlings', { x: 0, y: 30, color: '#ff8a8a', ink: '#200a0a' });
    if (fail) { gdzFailBlast(k, 4.4, 'A missed kick: Visceral Burst on the raid', ...w.P([0, 42]), [], 'Visceral Burst'); k.step(0.6).step(1.6).step(4.4);
      w.pause(4.8, 'Nobody kicked the Broodling at right 2. Visceral Burst went off: a big raid hit and a DoT that stacks. A miss like this is usually a wipe.', { x: TF_SLOT.R2[0], y: TF_SLOT.R2[1], r: 8 });
      return w.done({ title: 'Mistake: a missed Broodling kick', focus: { x: 0, y: 56, r: 30 } }); }
    k.ring1(['t1', 't2']).step(0.6).step(1.6).step(4);
    w.pause(2.8, 'Ten Broodlings, one in each slot. Each kicker covers theirs: left 1 to 4, right 1 to 4, the two at the tip for the Protection Paladins. On the second set some slots get two: spare kickers back them up.', { x: 0, y: 58, r: 28 });
    return w.done({ title: 'Rouse the Brood: a kick for every Broodling', focus: { x: 0, y: 56, r: 30 }, hlLabel: 'the tanks (they kick too)' });
  },
  // Coiling Ichor (Ithraz): a DoT that ramps as its circle shrinks; when it ends a Congealed Gore puddle drops (it stays; Heroic and up it
  // slows). Take it to your spot on the outer edge and pack the puddles tightly; time a defensive to cover the last ticks (fail: a puddle
  // in the middle of the platform)
  ichor(fail, d, o) {
    const plat = o && o.p != null ? o.p : 2, L = 11, w = tfKit(L, plat), k = w.k; tfBosses(w); tfHome(w, 0); k.cast('it', 'Coiling Ichor', 0.4, 2.4);
    const TG = ['r1', 'h1', 'r4'], SP = fail ? [[-26, 49], [-28, 43], [0, 46]] : [[-26, 49], [-28, 43], [26, 48]]; /* (where our kill's targets dropped theirs: the outer edges, a step in from the rim) */
    TG.forEach((id, i) => { k.ring({ on: id, r: 6, fx: 'debuff', t0: 2.4, dur: 6, color: '#ff6a5a', cn: 'Coiling Ichor', legend: 'Coiling Ichor: ramps as the circle shrinks; a puddle when it ends' }); w.hold(2.6, id).at(7.6, id, SP[i][0], SP[i][1]);
      w.ring({ x: SP[i][0], y: SP[i][1], r: 4.5, fx: 'puddle', t0: 8.4, dur: L - 8.4, color: '#a03040', fill: 'rgba(160,48,64,.5)', cn: 'Congealed Gore', legend: 'Congealed Gore: stays for the rest of the platform' }); });
    w.call(6.6, 8.4, 'Defensive for the last ticks', { x: -16, y: 62, color: '#ff8a8a', ink: '#200a0a' });
    if (fail) { k.oops('r4', 8.4); k.step(0.4).step(2.6).step(8.4);
      w.pause(8.8, 'One target dropped their puddle in the middle of the platform instead of at the edge: it stays there, taking space the raid needs for the adds and the soaks.', { x: 0, y: 46, r: 8 });
      return w.done({ title: 'Mistake: a puddle in the middle', focus: { x: 0, y: 46, r: 32 }, badLabel: 'dropped it in the middle' }); }
    TG.forEach((id) => { const q = TF_HOME[id]; w.hold(8.6, id).at(10.8, id, q[0], q[1]); });
    k.ring1(TG).step(0.4).step(2.6).step(6.6).step(8.4);
    w.pause(5, 'Coiling Ichor: walk to your spot on the outer edge and drop the puddles packed tight together, out of the way. Use a defensive that still covers the last ticks.', { x: -29, y: 47, r: 10 });
    return w.done({ title: 'Coiling Ichor: puddles packed at the edge', focus: { x: 0, y: 46, r: 32 }, hlLabel: 'the Coiling Ichor targets' });
  },
  // Stir the Depths (Vexhul): raid pulses, and sets of small waves rolling in from behind the raid (the pool's side), each set from its
  // own direction, in an order that changes from pull to pull (the tanks look back and call it): here first from the back-left toward
  // Ithraz's side, then from the back-right toward Vexhul's side, then straight up the middle (each wave that hits you: +1 venom stack).
  // Each set is five small waves side by side with gaps between them: everyone steps sideways into a gap before the set reaches them,
  // then back (fail: one player doesn't move)
  waves(fail, d, o) {
    const plat = o && o.p != null ? o.p : 2, L = 15.5, w = tfKit(L, plat), k = w.k; tfBosses(w); tfHome(w, 0); k.cast('vx', 'Stir the Depths', 0.4, 2);
    const V = 11, HW = 3, C = [0, 48], D0 = 24, SETS = [[65, 4.4], [118, 6.6], [90, 8.8]], LANES = [-20, -10, 0, 10, 20]; /* (each set: the way it heads, when it sets off from the walkway's back edge, D0 yards behind the middle of the corner) */
    const unit = (deg) => { const a = deg * Math.PI / 180; return [Math.cos(a), Math.sin(a)]; }, side = (u) => [-u[1], u[0]];
    SETS.forEach(([deg, t0]) => { const u = unit(deg), n = side(u); LANES.forEach((l) => w.wave({ x: C[0] - D0 * u[0] + l * n[0], y: C[1] - D0 * u[1] + l * n[1], deg, v: V, w: HW * 2, d: 3.5, t0, t1: t0 + 6.6, /* (on through the bosses) */ color: '#9ff26d', legend: 'small waves rolling in from behind: +1 venom stack each' })); });
    w.call(0.6, 4.2, 'Tanks: where are they coming from?', { x: 0, y: 30, color: '#9ff26d', ink: '#0a1a06' });
    // (when a set reaches a spot, and the spot's distance sideways from the set's nearest wave)
    const hit = (q, [deg, t0]) => { const u = unit(deg), n = side(u), dx = q[0] - C[0], dy = q[1] - C[1], al = dx * u[0] + dy * u[1], p = dx * n[0] + dy * n[1]; const off = LANES.map((l) => p - l).sort((a, b) => Math.abs(a) - Math.abs(b))[0]; return { t: t0 + (al + D0) / V, off, n }; };
    // (each player, set by set: if the set's waves would reach them, a sidestep into the nearest gap on the stone; they stay there until
    // the next set, then walk back once the last set has passed)
    const OFF = fail ? 'r6' : null, MOV = [];
    Object.keys(TF_HOME).forEach((id) => { if (id === OFF) return; const h = TF_HOME[id]; let p = h, free = 0, moved = false;
      SETS.forEach((st, si) => { const hh = hit(p, st); if (Math.abs(hh.off) >= HW + 1.2) return;
        const nx = SETS[si + 1], clearNext = (q) => { if (!nx) return true; const x = hit(q, nx); return Math.abs(x.off) >= HW + 1.2 || x.t - hh.t > 2.2; }; /* (a gap the next set won't reach right away, when there's a choice) */
        const sg = hh.off >= 0 ? 1 : -1, cs = [sg * 5 - hh.off, -sg * 5 - hh.off, sg * 15 - hh.off].map((g) => [p[0] + g * hh.n[0], p[1] + g * hh.n[1]]).filter((q) => { const c = tfIn(q); return Math.hypot(c[0] - q[0], c[1] - q[1]) < 0.01; })
          .map((q, i) => [q, (clearNext(q) ? 0 : 10) + i]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
        if (!cs.length) return; const q = cs[0], dur = Math.hypot(q[0] - p[0], q[1] - p[1]) / 7 + 0.2, tA = Math.max(free, hh.t - 0.7 - dur);
        w.hold(tA, id).at(tA + dur, id, q[0], q[1]); p = q; free = tA + dur; moved = true; });
      if (moved) { const tl = Math.max(free, ...SETS.map((st) => hit(p, st).t)) + 0.8, dur = Math.hypot(h[0] - p[0], h[1] - p[1]) / 7 + 0.2; w.hold(tl, id).at(tl + dur, id, h[0], h[1]); MOV.push(id); } });
    if (fail) { const th = hit(TF_HOME.r6, SETS[2]).t; ulHit(k, 'r6', th, 'Wave: +1 stack'); k.oops('r6', th); k.step(0.4).step(4.4).step(th);
      w.pause(th + 0.3, 'This ranged didn\'t step into a gap when the middle set rolled in from behind: another venom stack, and stacks are what end this fight.', { on: 'r6', r: 8 });
      return w.done({ title: 'Mistake: hit by a wave', focus: { x: 0, y: 50, r: 30 }, badLabel: 'hit by a wave' }); }
    k.ring1([...new Set(MOV)].slice(0, 4)).step(0.4).step(4.4).step(6.6);
    w.pause(5.8, 'Stir the Depths: sets of small waves roll in from behind the raid, here from the back-left, then the back-right, then up the middle. The order changes, so the tanks look back and call it. Step sideways into a gap before each set reaches you.', { x: 0, y: 48, r: 28 });
    return w.done({ title: 'Stir the Depths: step into the gaps', focus: { x: 0, y: 50, r: 30 }, hlLabel: 'players stepping into a gap' });
  },
  // Ravenous Feast (Ithraz): a big soak smashed three times (split between everyone in it, -1 venom stack each, a knockback). Heroic and
  // up, each player can only take one hit, so three groups: knocked right first, knocked left second, the front group last. Mythic: after
  // each hit a Tainted Blood orb appears (a soak, 6 or more; one left wipes the raid): the right group soaks the first, the left the second,
  // the front the third (fail: the third orb left alone)
  feast(fail, d, o) {
    const myth = d !== 'h', plat = o && o.p != null ? o.p : 2, L = 21, w = tfKit(L, plat), k = w.k, C = [4, 56]; /* (where our kill's hits landed) */ tfBosses(w); tfHome(w, 0); k.cast('it', 'Ravenous Feast', 0.4, 3.4);
    const grp = (ids, c, r, t, hold) => ids.forEach((id, i) => { const [dx, dy] = gdzSpot(i, ids.length, r); w.hold(hold, id).at(t, id, c[0] + dx, c[1] + dy); });
    const G = [[TF_GR, 4.4, [6, 0]], [TF_GL, 7.4, [-6, 0]], [TF_GF, 10.4, [0, 6]]], WAIT = [[22, 44], [-22, 44], [12, 40]];
    G.forEach(([ids], j) => j && grp(ids, WAIT[j], 6, 3.4, 0.2));
    const SHORT = fail && !myth; /* (Heroic's mistake: only three take the last hit) */
    G.forEach(([ids0, t, dv], j) => { const ids = SHORT && j === 2 ? ids0.slice(0, 3) : ids0; grp(ids, [C[0] + dv[0], C[1] + dv[1]], SHORT && j === 2 ? 3 : 4.5, t - 0.4, Math.max(0.2, t - 4)); w.ring({ x: C[0], y: C[1], r: 9, fx: 'soak', t0: t - 2.6, at: t, dur: 2.8, color: '#ff8a8a', cn: 'Ravenous Feast', legend: 'Ravenous Feast: split between everyone in it, -1 stack, then a knockback' });
      const kb = j === 0 ? [14, 0] : j === 1 ? [-14, 0] : [0, 8]; grp(ids, [C[0] + dv[0] + kb[0], C[1] + dv[1] + kb[1]], 6, t + 1, t + 0.1); w.call(t, t + 1.3, 'Knocked back', { x: C[0], y: C[1] - 13, color: '#ff8a8a', ink: '#200a0a' }); });
    w.call(0.6, 3.4, 'Right group first', { x: 18, y: 64, color: '#ff8a8a', ink: '#200a0a' });
    if (SHORT) { TF_GF.slice(0, 3).forEach((id, i) => k.oops(id, 10.6 + i * 0.2)); k.step(0.4).step(4.4).step(10.4);
      w.pause(10.9, 'Only three stood in the third hit. Split between too few, it killed them.', { x: C[0], y: C[1] + 6, r: 9 });
      return w.done({ title: 'Mistake: too few in the third hit', focus: { x: 2, y: 54, r: 28 }, badLabel: 'too few in the hit' }); }
    if (myth) { const OB = [[24, 40], [-24, 40], [4, 72]]; OB.forEach(([x, y], j) => { const t0 = 5 + j * 3, land = t0 + 4, gp = G[j][0], miss = fail && j === 2;
        w.ring({ x, y, r: 5, fx: 'soak', t0, at: land, dur: land - t0 + 0.4, color: '#d0303a', cn: 'Tainted Blood', legend: 'Mythic: a Tainted Blood orb: 6 or more soak it, or the raid wipes' });
        if (!miss) gp.forEach((id, i) => { const [dx, dy] = gdzSpot(i, gp.length, 4); w.hold(land - 2.6, id).at(land - 0.3, id, x + dx, y + dy); if (!fail) { const q = TF_HOME[id]; w.hold(land + 0.4, id).at(land + 0.4 + Math.max(3.6, Math.hypot(q[0] - x - dx, q[1] - y - dy) / 8.5), id, q[0], q[1]); } }); });
      if (fail) { gdzFailBlast(k, 15.6, 'An empty Tainted Blood orb: a wipe', ...w.P([0, 44]), ['m7', 'h2'], 'Tainted Blood'); k.step(0.4).step(4.4).step(10.4).step(15.6);
        w.pause(15.2, 'The front group took the third hit but never went to the third orb. Nobody soaked it: Tainted Blood wiped the raid.', { x: 0, y: 70, r: 8 });
        return w.done({ title: 'Mistake: the third orb left alone', focus: { x: 0, y: 42, r: 30 } }); } }
    k.ring1(TF_GR.slice(0, 2).concat(TF_GL.slice(0, 2), TF_GF.slice(0, 2))).step(0.4).step(4.4).step(7.4).step(10.4);
    w.pause(3.4, myth ? 'Three hits, three groups: the right group first, then the left, then the front. After each hit the group knocked out takes its Tainted Blood orb.' : 'Three hits, three groups: the right group first, then the left, then the front. Nobody takes two.', { x: 0, y: 44, r: 20 });
    return w.done({ title: 'Ravenous Feast: three groups, one hit each', focus: { x: 0, y: 42, r: 30 }, hlLabel: 'two from each group' });
  },
  // the intermission, Submerge: both bosses dive; Vexhul's Vile Flood beam turns round the room from the pool (the orbs circling him spin
  // the same way), Ithraz's Sanguine Storm drops gore swirls, and venom showers leave Noxious Slick puddles. In our kill (and a top team's)
  // the beam turned clockwise both times: the raid stepped to the corner's other side, let it start turning away, then followed behind
  // it the long way round to the next corner, about 8 yards a second (fail: one player stays where the beam starts)
  submerge(fail, d, o) {
    const plat = o && o.p != null ? o.p : 0, nx = Math.min(2, plat + 1), L = fail ? 12 : 32, w = tfKit(L, plat), k = w.k; tfBosses(w); tfHome(w, 0);
    // (the run goes round the triangle, so it is only turned for the platform, never mirrored)
    const a = 120 * plat * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), R = (p) => [p[0] * ca - p[1] * sa, p[0] * sa + p[1] * ca], PC = [0, 4];
    const at = (t, id, p) => { const q = R(p); k.at(t, id, q[0], q[1]); };
    { const q = R(PC), q2 = R([-6, 0]); k.boss('vx', 'Vexhul', 1.2, q[0], q[1]).boss('it', 'Ithraz', 1.2, q2[0], q2[1]); }
    // the orbs circling Vexhul, spinning clockwise: the way the beam will turn
    for (let i = 0; i < 4; i++) { const id = 'ob' + i; for (let t = 1.2; t <= 17.01; t += 0.4) { const g = (i * 90 - (t - 1.2) * 60) * Math.PI / 180, q = R([PC[0] + 6 * Math.cos(g), PC[1] + 6 * Math.sin(g)]); k.obj(id, 'orb', t, q[0], q[1]); } k.show(id, 1.2, Math.min(L, 17)); }
    w.call(0.6, 3.6, 'They dive: the orbs spin clockwise', { x: 0, y: 70, color: '#9ff26d', ink: '#0a1a06' });
    // Vile Flood: one big poison beam from the pool, starting on the corner and spinning clockwise about once round
    { const q = R(PC); k.beam({ x: q[0], y: q[1], a0: 88 + 120 * plat, v: -25, len: 84, w: 9, t0: 4.6, t1: 16.6, color: '#9ff26d', legend: 'Vile Flood: a big poison beam, spinning clockwise' }); }
    [[18, 58], [6, 66], [-4, 72], [16, 46]].forEach(([x, y], i) => { const q = R([x, y]); k.ring({ x: q[0], y: q[1], r: 4, fx: 'burst', t0: 2.2 + i * 0.5, at: 3.2 + i * 0.5, dur: 0.6, color: '#d0303a', cn: 'Sanguine Storm', legend: 'Sanguine Storm: gore swirls, step out' }); });
    [[36, 8], [28, -30], [-4, -42]].forEach(([x, y], i) => { const q = R([x, y]); k.ring({ x: q[0], y: q[1], r: 3.5, fx: 'puddle', t0: 6 + i * 2, dur: L - 6 - i * 2, color: '#6fae2a', fill: 'rgba(111,174,42,.45)', cn: 'Noxious Slick', legend: 'Noxious Slick: a puddle that makes you take more damage (still better than a wave)' }); });
    // the raid: to the corner's other side before the beam starts, then behind it round the walkway to the next platform's own spots
    const ALL = Object.keys(TF_HOME), OFF = fail ? 'r2' : null, PACK = [-17, 46], RUN = ALL.filter((id) => id !== OFF);
    // (the players furthest across the corner take the pack's near side, in order, so nobody has to sprint; their place in the run follows)
    const OFS = {}; { const u = R([1, 0]), dot = (p) => p[0] * u[0] + p[1] * u[1], sp = RUN.map((_, i) => gdzSpot(i, RUN.length, 11)).sort((a, b) => dot(R(b)) - dot(R(a)));
      RUN.slice().sort((a, b) => dot(k.posAt(b, 0)) - dot(k.posAt(a, 0))).forEach((id, j) => { OFS[id] = sp[j]; }); }
    if (OFF) { k.hold(0.4, OFF); at(3.4, OFF, [8, 47]); }
    RUN.forEach((id) => { const [dx, dy] = OFS[id], p0 = k.posAt(id, 0), pk = R([PACK[0] + dx, PACK[1] + dy]); k.hold(0.1, id); at(Math.min(4.5, Math.max(4.3, 0.1 + Math.hypot(pk[0] - p0[0], pk[1] - p0[1]) / 8.5)), id, [PACK[0] + dx, PACK[1] + dy]); k.hold(5.4, id);
      [[9.8, [14, 34]], [14.2, [36, 4]], [18.4, [32, -28]], [23.6, [-6, -40]]].forEach(([t, p]) => at(t, id, [p[0] + dx * 0.73, p[1] + dy * 0.73])); const q = tfT(nx).P(TF_HOME[id]); k.at(31.4, id, q[0], q[1]); });
    { const NP = tfT(nx).P, v = NP(TF_VX), i2 = NP(TF_IT), q = R(PC), q2 = R([-6, 0]); k.boss('vx', 'Vexhul', 18, q[0], q[1]).boss('vx', 'Vexhul', 22, v[0], v[1]).boss('it', 'Ithraz', 18, q2[0], q2[1]).boss('it', 'Ithraz', 22, i2[0], i2[1]); }
    w.call(5.6, 8.6, 'Let it turn away, then follow it', { x: -14, y: 62, color: '#7ee36a', ink: '#0a1a06' });
    { const q = R([40, 14]); k.call(10, 13.4, 'The long way round', { x: q[0], y: q[1], color: '#7ee36a', ink: '#0a1a06' }); }
    if (fail) { ulHit(k, OFF, 5, 'Beam: +stacks'); k.oops(OFF, 5); k.step(0.4).step(4.6).step(5);
      w.pause(5.3, 'This ranged stayed where the beam starts. It turned straight over them: more venom stacks.', { on: OFF, r: 9 });
      return w.done({ title: 'Mistake: caught by the beam', focus: { x: 0, y: 40, r: 34 }, full: { x: 0, y: 40, r: 44 }, badLabel: 'hit by the beam' }); }
    k.ring1(['r7', 'h2']).step(0.4).step(4.3).step(9.8).step(14.2);
    w.pause(7, 'The orbs spin clockwise, so the beam turns clockwise too. Everyone steps to the other side of the corner, lets it start turning away, then follows behind it the long way round to the next platform.', { x: 0, y: 4, r: 60 });
    return w.done({ title: 'Submerge: let the beam pass, then follow it', focus: { x: 0, y: 4, r: 66 }, full: { x: 0, y: -2, r: 84 }, hlLabel: 'a couple of the raid' }); /* (opens on the whole room: the run goes all the way round) */
  },
};
const TF_FAIL = {
  beams: { name: 'A globule left to explode', what: 'Nobody soaks one Caustic Globule: 10 seconds after it lands it explodes on the whole raid.', do: ['Vexhul casts Caustic Deluge.', 'Globules land.', 'All but one are soaked.', 'Ten seconds after it landed, it explodes on the raid.'], map: (d) => TF_M.beams(true, d) },
  slams: { name: 'A missed slam', what: 'The tank misses a Stone Breaker slam (here the last of the three): with nobody in it, it hits the whole raid and knocks everyone back.', do: ['Three spots light up.', 'The tank misses the last.', 'Raid hit and knockback.'], map: (d) => TF_M.slams(true, d) },
  emergence: { name: 'A second Corrosive Spit', what: 'The Spawns live too long and Spit a second time: another venom stack for each target.', do: ['The Spawns rise.', 'Too few swap to them.', 'A second Spit: more stacks.'], map: (d) => TF_M.emergence(true, d) },
  brood: { name: 'A missed Broodling kick', what: 'Nobody kicks one Broodling: its Visceral Burst hits the whole raid with a stacking DoT, and that usually wipes the raid.', do: ['10 Broodlings rise.', 'One kick is missed.', 'Visceral Burst on the raid.'], map: (d) => TF_M.brood(true, d) },
  ichor: { name: 'A puddle in the middle', what: 'A Coiling Ichor target drops their puddle in the middle of the platform: it stays there all platform.', do: ['Coiling Ichor goes out.', 'One target stays in the middle.', 'A puddle where the raid needs room.'], map: (d) => TF_M.ichor(true, d) },
  waves: { name: 'Hit by a wave', what: 'A player doesn\'t step into a gap as a set of waves rolls in: another venom stack.', do: ['Waves roll in from behind.', 'One player doesn\'t step into a gap.', 'Hit: +1 stack.'], map: (d) => TF_M.waves(true, d) },
  feastH: { name: 'Too few in the third hit', what: 'Only three players stand in the third Ravenous Feast hit: split between too few, it kills them.', do: ['Three Feast hits.', 'Only three take the last.', 'Split too few ways: they die.'], map: (d) => TF_M.feast(true, 'h') },
  feast: { name: 'The third orb left alone', what: 'Nobody soaks the third Tainted Blood orb: it wipes the raid.', do: ['Ithraz starts the Feast.', 'The right and left groups take their hits and orbs.', 'The front group takes the third hit, then skips its orb.', 'Tainted Blood: a wipe.'], map: (d) => TF_M.feast(true, d) },
  submerge: { name: 'Caught by the beam', what: 'A player stays where the Vile Flood beam starts: it turns straight over them, more venom stacks.', do: ['They dive.', 'One player stays where the beam starts.', 'Hit: more stacks.'], map: (d) => TF_M.submerge(true, d) },
};
// ---- the whole fight, by Wolfthorn's Mythic kill's clock (6:43)
const TF_BEATS = {
  start: { name: 'The pull (Platform 1, the north tip)', do: ['Both tanks under the tip, one boss each; melee between them, ranged and healers behind toward the pool.', 'Bloodlust on the pull. Cleave Vexhul toward 35% first.'],
    run() { const w = tfKit(4, 0); tfBosses(w); tfHome(w, 0); w.k.ring1(['t1', 't2']).step(0.2); } },
  pace2: { name: 'Platform 2 (Stack pace: about 3)', do: ['First globule set here: about 3 venom stacks. 3 or fewer soak; 4 or more wait.'],
    run() { const w = tfKit(4, 1); tfBosses(w); tfHome(w, 0); w.k.step(0.2); } },
  pace3: { name: 'Platform 3 (Stack pace: about 6, never above 8)', do: ['First set here: about 6 stacks. Never above 8: the Spawns add one, and a Spit on 9 kills.', 'On 9 with a Spit coming: call it and die in the middle, where your orbs are easy to soak. Kill Vexhul around the last soak.'],
    run() { const w = tfKit(4, 2); tfBosses(w); tfHome(w, 0); w.k.step(0.2); } },
  kill: { name: 'The kill', do: ['Vexhul first, around the last soak (then stacks stop killing and orbs stop exploding), Ithraz right after.'],
    run() { const w = tfKit(5, 2); tfBosses(w); tfHome(w, 0); w.k.ring({ on: 'it', r: 7, fx: 'burst', t0: 1.4, at: 2, dur: 0.8, color: '#ffd23b', cn: 'The Twin Fangs die', legend: 'the kill' }); w.k.step(0.3); } },
};
const TF_SIM = [
  { at: 0, beat: 'start' }, { at: 8, mech: 'beams', label: 'Caustic Deluge 1', o: { p: 0 } }, { at: 23, mech: 'slams', label: 'Stone Breaker 1', o: { p: 0 } }, { at: 33, mech: 'emergence', label: 'Venomous Emergence 1', o: { p: 0 } }, { at: 34, mech: 'brood', label: 'Rouse the Brood 1 (one per slot)', o: { p: 0 } },
  { at: 40, mech: 'ichor', label: 'Coiling Ichor 1', o: { p: 0 } }, { at: 47, mech: 'waves', label: 'Stir the Depths 1', o: { p: 0 } }, { at: 57, mech: 'feast', label: 'Ravenous Feast 1', o: { p: 0 } },
  { at: 69, mech: 'beams', label: 'Caustic Deluge 2', o: { p: 0 } }, { at: 84, mech: 'slams', label: 'Stone Breaker 2', o: { p: 0 } }, { at: 94, mech: 'emergence', label: 'Venomous Emergence 2', o: { p: 0 } }, { at: 95, mech: 'brood', label: 'Rouse the Brood 2 (fully random)', o: { p: 0 } },
  { at: 101, mech: 'ichor', label: 'Coiling Ichor 2', o: { p: 0 } }, { at: 108, mech: 'waves', label: 'Stir the Depths 2', o: { p: 0 } }, { at: 118, mech: 'feast', label: 'Ravenous Feast 2', o: { p: 0 } },
  { at: 136, mech: 'submerge', ph: 1, label: 'Submerge 1', o: { p: 0 } },
  { at: 160, beat: 'pace2', ph: 2 }, { at: 163, mech: 'beams', ph: 2, label: 'Caustic Deluge 3', o: { p: 1 } }, { at: 178, mech: 'slams', ph: 2, label: 'Stone Breaker 3', o: { p: 1 } }, { at: 188, mech: 'emergence', ph: 2, label: 'Venomous Emergence 3', o: { p: 1 } }, { at: 189, mech: 'brood', ph: 2, label: 'Rouse the Brood 3', o: { p: 1 } },
  { at: 195, mech: 'ichor', ph: 2, label: 'Coiling Ichor 3', o: { p: 1 } }, { at: 202, mech: 'waves', ph: 2, label: 'Stir the Depths 3', o: { p: 1 } }, { at: 212, mech: 'feast', ph: 2, label: 'Ravenous Feast 3', o: { p: 1 } },
  { at: 224, mech: 'beams', ph: 2, label: 'Caustic Deluge 4', o: { p: 1 } }, { at: 239, mech: 'slams', ph: 2, label: 'Stone Breaker 4', o: { p: 1 } }, { at: 248, mech: 'emergence', ph: 2, label: 'Venomous Emergence 4', o: { p: 1 } }, { at: 249, mech: 'brood', ph: 2, label: 'Rouse the Brood 4 (fully random)', o: { p: 1 } },
  { at: 256, mech: 'ichor', ph: 2, label: 'Coiling Ichor 4', o: { p: 1 } }, { at: 263, mech: 'waves', ph: 2, label: 'Stir the Depths 4', o: { p: 1 } }, { at: 273, mech: 'feast', ph: 2, label: 'Ravenous Feast 4', o: { p: 1 } },
  { at: 291, mech: 'submerge', ph: 3, label: 'Submerge 2', o: { p: 1 } },
  { at: 315, beat: 'pace3', ph: 4 }, { at: 318, mech: 'beams', ph: 4, label: 'Caustic Deluge 5', o: { p: 2 } }, { at: 333, mech: 'slams', ph: 4, label: 'Stone Breaker 5', o: { p: 2 } }, { at: 343, mech: 'emergence', ph: 4, label: 'Venomous Emergence 5 (Nobody above 8 stacks)', o: { p: 2 } }, { at: 344, mech: 'brood', ph: 4, label: 'Rouse the Brood 5', o: { p: 2 } },
  { at: 350, mech: 'ichor', ph: 4, label: 'Coiling Ichor 5', o: { p: 2 } }, { at: 357, mech: 'waves', ph: 4, label: 'Stir the Depths 5', o: { p: 2 } }, { at: 367, mech: 'feast', ph: 4, label: 'Ravenous Feast 5', o: { p: 2 } }, { at: 379, mech: 'beams', ph: 4, label: 'Caustic Deluge 6', o: { p: 2 } }, { at: 394, mech: 'slams', ph: 4, label: 'Stone Breaker 6', o: { p: 2 } }, { at: 403, beat: 'kill', ph: 4 },
];
const TF_DUR = { 'm:beams': 12, 'm:slams': 8, 'm:emergence': 12, 'm:brood': 10, 'm:ichor': 8, 'm:waves': 6, 'm:feast': 14, 'm:submerge': 24, 'b:start': 2, 'b:pace2': 2, 'b:pace3': 2, 'b:kill': 0 };
const TF_SEV = { 'm:beams': 3, 'm:slams': 2, 'm:emergence': 3, 'm:brood': 3, 'm:ichor': 2, 'm:waves': 2, 'm:feast': 3, 'm:submerge': 3, 'b:start': 1, 'b:pace2': 1, 'b:pace3': 2, 'b:kill': 1 };
GDZ['The Twin Fangs'] = {
  upd: ['12.1', 'Oct 21, 2026'],
  stepRoles: {
    'Caustic Deluge (CC, then soak the globules)': ['', 't', 'd', 'd'], 'Caustic Deluge (Soak the globules)': ['', 't', '', 'd'], 'Stone Breaker (The tank takes each slam in order)': ['t', '', 't'], 'Venomous Emergence (Kill the Spawns before the second Spit)': ['', 'd', '', 'd'],
    'Rouse the Brood (A kick for every Broodling)': ['td', 't', 'td'], 'Coiling Ichor (Puddles packed at the edge)': ['', '', '', ''], 'Stir the Depths (Step into the gaps)': ['t', '', ''],
    'Ravenous Feast (Three groups, one hit each)': ['', '', '', ''], 'Submerge (Let the beam pass, then follow it)': ['', '', '', ''],
  },
  sum: 'Two bosses, three platforms, two sets on each, then a Submerge to the next. Everything adds venom stacks and too many kills you, so the fight is about stack control: soak globules on pace, kill the Spawns before they Spit twice, dodge the waves and beams. Kill both together.',
  m: { sim: TF_SIM, simDur: TF_DUR, simSev: TF_SEV, beats: TF_BEATS,
    roles: {
      t: ['Both beams at once: your biggest defensives.', 'Stone Breaker: step into each slam in order; swap after each set.', 'Stir the Depths: look back and call where each set of waves comes from.', 'Protection Paladins: the Broodlings at the tip, then fill in.', 'Ravenous Feast: one of you in the right group, one in the left, then straight back to your boss.'],
      h: ['Blood Torrent is the biggest tank damage: externals.', 'Coiling Ichor ramps: heal the last ticks.', 'Ravenous Feast: each Tainted Blood orb leaves a heal absorb on its soakers: heal it off.'],
      d: ['Swap to the Spawns at once: never a second Spit.', 'Kick your Broodling slot.', 'Feast: your group\'s hit only, then its Tainted Blood orb.', 'Skip a globule at 4 stacks on set 3, 5 on set 4, 6 on set 5, 7 on set 6. Never carry more than 8.'],
    },
    simAlways: ['Eternal Venom: 10 stacks kills. About one stack per globule set: about 3 by platform 2 and 6 by platform 3, and never more than 8.', 'Every set is rinse and repeat: beams and globules, slams, Spawns and Broodlings, Coiling Ichor, waves, Feast.', 'Vexhul first, around the last soak, then Ithraz right after: the survivor gets stronger every few seconds.'],
    source: 'Tactyks\' Mythic Twin Fangs video', sum: 'Two bosses, three platforms, two sets on each, then a Submerge to the next. Everything adds venom stacks and 10 kills you. Crowd control the shielded globules, then soak them on pace; kick all 10 Broodlings with every Spawn set; soak a Tainted Blood orb after each Feast hit. Vexhul to 35% first, then Ithraz.' },
  facts: [['Phases', '3 platforms, 2 sets each'], ['Bloodlust', 'On the pull'], ['Healers', '4', 'm'], ['Hardest part', 'Venom stacks', 'h'], ['Hardest part', 'Venom stacks and kicks', 'm'], ['Fight length', 'About 7 minutes', 'm'], ['Hard enrage', 'Third Submerge (~7:30)']],
  phases: [
    { id: 'p1', name: 'A platform: two sets', sum: 'Each set: both beams and the globules, Stone Breaker, the Spawns (and Broodlings on Mythic), Coiling Ichor, Stir the Depths, then Ravenous Feast. Two sets, then Submerge.',
      mechs: [
        { id: 'beams', fail: TF_FAIL.beams, name: 'Caustic Deluge (CC, then soak the globules)', spell: 'Caustic Deluge', what: 'Vexhul\'s beam hits his tank and shoves them back; acid splashes drop Caustic Globules that explode on the raid 10 seconds later unless someone soaks them, which costs that player a venom stack.',
          do: ['Vexhul casts Caustic Deluge.', 'His tank is shoved back: stay in range.', 'Globules land all over the platform.', 'Low-stack players soak one each.'],
          line: 'Low-stack players soak one globule each, within 10 seconds of it landing.', h: { name: 'Caustic Deluge (Soak the globules)' },
          m: { what: 'Vexhul\'s beam shoves his tank back while Blood Torrent puts a huge heal absorb on Ithraz\'s tank: the biggest tank damage of the fight. Fifteen globules drop, each shielded until it\'s crowd controlled, then soaked within 10 seconds.', line: 'Both tanks use big defensives; crowd control the shielded globules, then low-stack players soak one each.', do: ['Both beams at once: Caustic Deluge and Blood Torrent.', 'Both tanks: big defensives (Paladins: Bubble, Spellwarding, Bubble).', 'AoE crowd control the globules near you once they land.', 'Low-stack players soak one each: 15 a set.'], plan: ['Spread the AoE crowd control round the room; single-target crowd control is the backup for the last one.', 'Shielded globules knock back anyone trying to soak them.'] },
          map: (d, o) => TF_M.beams(false, d, o) },
        { id: 'slams', fail: TF_FAIL.slams, name: 'Stone Breaker (The tank takes each slam in order)', spell: 'Stone Breaker', what: 'Ithraz shoves his tank back, then slams three marked spots in the order they appeared. A slam with nobody in it hits the raid and knocks everyone back.',
          do: ['Ithraz\'s tank is shoved back.', 'Three spots light up: nobody else near them.', 'The tank steps into each, in order.'],
          line: 'Ithraz\'s tank steps into each of the three slams, in the order they appeared.', plan: ['Each slam stacks a vulnerability on the tank: swap after each set.'],
          map: (d, o) => TF_M.slams(false, d, o) },
        { id: 'emergence', fail: TF_FAIL.emergence, name: 'Venomous Emergence (Kill the Spawns before the second Spit)', spell: 'Venomous Emergence', what: 'Three Spawn of Vexhul rise at the pool\'s edge (a venom stack for everyone). Each fires Corrosive Spit beams at players, another stack each.',
          do: ['Three Spawns rise at the pool\'s edge: a stack for everyone.', 'Almost everyone swaps to the Spawns.', 'Spit on you: move once, then stand still.', 'Kill all three before their second Spit.'], line: 'Almost everyone swaps to the Spawns and kills all three before their second Spit.',
          map: (d, o) => TF_M.emergence(false, d, o) },
        { id: 'brood', only: 'm', fail: TF_FAIL.brood, name: 'Rouse the Brood (A kick for every Broodling)', spell: 'Rouse the Brood', what: 'With the Spawns, 10 Broodlings of Ithraz rise in ten slots round the platform. Each casts Visceral Burst, a raid hit and a stacking DoT. The first set on a platform has one in each slot; the second is random, so some slots get two and some none.',
          do: ['Every kicker covers their slot: left 1 to 4, right 1 to 4.', 'The Protection Paladins take the two at the tip, and fill in with Divine Toll and Avenger\'s Shield.', 'Spare kickers on each side for double spawns: "back up left 3".'],
          plan: ['A missed kick is usually a wipe.', 'Raid markers on the floor show the slots, so every kicker knows where to look.', 'Warlocks: watch your pet: one stuck out of range missed a kick and wiped the raid.', 'Two Protection Paladins, or a Paladin and a Warrior, make this much easier.'],
          map: (d, o) => TF_M.brood(false, d, o) },
        { id: 'ichor', fail: TF_FAIL.ichor, name: 'Coiling Ichor (Puddles packed at the edge)', spell: 'Coiling Ichor', what: 'A DoT that ramps up as its circle shrinks. When it ends a Congealed Gore puddle drops, stays, and slows anyone in it.',
          do: ['Coiling Ichor goes out: a shrinking circle on each target.', 'Targets walk to their spots on the outer edge.', 'Use a defensive that still covers the last ticks.', 'The puddles drop there, packed tight together.'], line: 'Targets drop their puddles packed together at the outer edge, with a defensive for the last ticks.',
          plan: ['Keep the middle clear: the raid needs it for the Spawns, the soaks and the end of the fight.', 'Coiling Ichor is the most likely thing to kill a single player late in the fight.'],
          map: (d, o) => TF_M.ichor(false, d, o) },
        { id: 'waves', fail: TF_FAIL.waves, name: 'Stir the Depths (Step into the gaps)', spell: 'Stir the Depths', what: 'Raid-wide pulses, and sets of small waves rolling in from behind the raid, each set from its own direction: left, right or middle, in an order that changes. Each wave that hits you is another venom stack.',
          do: ['Tanks look back and call where each set comes from: left, right or middle.', 'Sets of small waves roll in from behind, one after another.', 'Step sideways into a gap between the waves before each set reaches you.'], line: 'Tanks call where each set of waves comes from; step into a gap before it reaches you.',
          map: (d, o) => TF_M.waves(false, d, o) },
        { id: 'feast', fail: TF_FAIL.feast, h: { fail: TF_FAIL.feastH }, name: 'Ravenous Feast (Three groups, one hit each)', spell: 'Ravenous Feast', what: 'Ithraz smashes a big soak three times: split between everyone in it, one venom stack off each, then a knockback. A player can only take one hit.', line: 'Three hits, one per group: right, then left, then front, six or more in each.',
          do: ['Right group takes the first hit, and is knocked right.', 'Left group takes the second, knocked left.', 'Front group takes the third.', 'Six or more in each hit.'],
          m: { what: 'Ithraz smashes a big soak three times: split between everyone in it, one venom stack off each, then a knockback. A player can only take one hit. After each hit a Tainted Blood orb appears: unsoaked, it wipes the raid.', do: ['Right group takes the first hit, then its Tainted Blood orb.', 'Left group takes the second hit and the second orb.', 'Front group takes the third hit and the last orb.', 'Six or more in each.'], line: 'Three hits, one per group: right, then left, then front, and each group then soaks its Tainted Blood orb.', plan: ['Always the same order, even when the orbs come out the other way round.', 'Mind where each hit throws you: never into a Coiling Ichor puddle.', 'Tanks split into the first two groups so they get back to their bosses in time.', 'Each orb gives you about 8 seconds to get there.', 'An immunity can\'t soak an orb alone any more (a hotfix): six or more in each.'] },
          map: (d, o) => TF_M.feast(false, d, o) },
      ],
      tiles: [
        { name: 'Eternal Venom (Keep stacks low)', do: 'Almost everything adds a venom stack, and 10 kills you. Share the globule soaks so nobody climbs too high, and swap tanks every set.',
          m: { name: 'Eternal Venom (Stack pace)', do: 'Almost everything adds a stack, and 10 kills you. Aim for about one stack per globule set. Skip a globule if you\'re already at 4 on set 3, 5 on set 4, 6 on set 5 or 7 on set 6. Never carry more than 8: the Spawns add one, and a Spit on 9 kills.' } },
        { name: 'Damage (Kill both together)', do: 'Keep them close in health and kill them together: the one left alive gets stronger every few seconds.',
          m: { name: 'Damage (Vexhul to 35%, then Ithraz)', do: 'Cleave Vexhul down to 35% (into execute) first, then swap to Ithraz. On pace on the last platform: Vexhul about 25%, Ithraz about 40%. Kill Vexhul around the last soak, then Ithraz right after.' } },
        { name: 'Hard enrage (The third Submerge)', do: 'At the third Submerge, about 7:30 to 8 minutes in, they enrage. Both must be dead before it. Once Vexhul is dead, stacks stop killing and globules stop exploding.' },
      ] },
    { id: 'int', name: 'Submerge: to the next platform', sum: 'After two sets both bosses dive. Let Vexhul\'s turning beam pass, then follow behind it round the walkway to the next corner of the triangle.',
      mechs: [
        { id: 'submerge', fail: TF_FAIL.submerge, name: 'Submerge (Let the beam pass, then follow it)', spell: 'Vile Flood', what: 'Both bosses dive. Vexhul\'s Vile Flood beam turns round the room from the pool (the orbs circling him show which way), Ithraz\'s Sanguine Storm drops gore swirls, and venom showers leave puddles that make you take more damage.',
          do: ['Watch the orbs circling Vexhul: the beam turns the way they spin.', 'Step to the side of the corner it turns away from.', 'Follow behind it, the long way round, to the next platform.', 'If you must, step on a puddle rather than into a wave: a puddle only makes you take more damage; a wave is more stacks.'],
          plan: ['Mobile players just walk; others can take a Warlock gateway once the waves have passed.', 'In our kill and a top team\'s kill the beam turned clockwise both times, so the raid always went the long way round.'],
          m: { plan: ['On Mythic the beam turns further: you can\'t cheat it any more.', 'Mobile players just walk; others can take a Warlock gateway once the waves have passed.', 'In our kill and a top team\'s kill the beam turned clockwise both times, so the raid always went the long way round.', 'Movement speed helps a lot, and so does an Evoker\'s Time Spiral (everyone can use their movement ability once more, even on cooldown).'] },
          map: (d, o) => TF_M.submerge(false, d, o) },
      ] },
  ],
  roles: {
    t: ['Caustic Deluge shoves Vexhul\'s tank back: stay in range.', 'Stone Breaker: step into each slam in order; swap after each set.', 'Stir the Depths: look back and call where each set of waves comes from.'],
    h: ['Tank hits on the beams and slams: externals.', 'Coiling Ichor ramps: heal the last ticks.', 'Soak globules too.'],
    d: ['Swap to the Spawns at once: never a second Spit.', 'Feast: your group\'s hit only.', 'Soak a globule when your stacks are low.'],
  },
};

// ===== Nymrissa Wavecaller (notes/Guides/Bosses/0 Nymrissa Wavecaller.md: Tactyks' Mythic video read in full, the spell text, a Heroic
// video read in full, and Wolfthorn's Mythic kill rdFvKLXyRPtBHDhn #43 (6:23) for the clock and the spots). Yards from the island's
// centre, where the bubble forms, x east, y north (the game's floor map: there's no RaidPlan render of this room). The island is about
// 110 yards across, ringed by water; the murlocs come out of pools in the water round its edge. The raid plays in the south-west quarter:
// the boss on the outside, the raid on the inside, the orbs dropped in a lane between her and the bubble, which Water Jet then blasts clean.
GDZ_ORIGIN['Nymrissa Wavecaller'] = { cx: 12085.3, cy: 4757.9 }; GDZ_FULL['Nymrissa Wavecaller'] = { x: -12, y: -6, r: 44 };
const NY = 'Nymrissa Wavecaller', NY_BH = nzAdd([0, 0], 219, 31), NY_U = nzU(39), NY_N = nzU(129);
// a spot in the lane from her toward the bubble: d yards along it, s yards to its north-west side (minus: the south-east side)
const nyL = (d, s) => [NY_BH[0] + NY_U[0] * d + NY_N[0] * s, NY_BH[1] + NY_U[1] * d + NY_N[1] * s];
// the murloc pools seen in the kill, in the water round the edge
const NY_POOL = { N: [-16, 65], NW: [-58, 43], W: [-74, 11], SW: [-50, -41], SSW: [-28, -61], SSE: [24, -69], ESE: [56, -39] };
const NY_MEL = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], NY_WEST = ['r1', 'r2', 'r3', 'h1', 'h4'], NY_SOUTH = ['r5', 'r6', 'r7', 'h3'];
// home: her tank in front of her (toward the bubble), the melee behind and beside her, the Death Knight (m7) at the back; the ranged and
// healers in two groups either side of the lane, well wide of it (Water Jet runs down it): the west group and the south group, each
// holding a murloc squad
const NY_HOME = (() => { const H = { t1: nyL(4, 0), t2: nyL(3.5, -8.5), r4: nyL(9, 8.5), h2: nyL(9, -8.5) };
  [[6.5, 139], [6.5, 179], [6.5, 219], [6.5, 259], [6.5, 299], [11, 199], [11, 239]].forEach(([r, a], i) => { H[NY_MEL[i]] = nzAdd(NY_BH, a, r); });
  [[5, 13], [10, 13.5], [15, 15], [7.5, 18.5], [12.5, 19.5]].forEach(([d, s], i) => { H[NY_WEST[i]] = nyL(d, s); });
  [[5, -13], [10, -13.5], [15, -15], [10, -19]].forEach(([d, s], i) => { H[NY_SOUTH[i]] = nyL(d, s); });
  return H; })();
function nyHome(k, t, hold, skip) { Object.entries(NY_HOME).forEach(([id, q]) => { if (skip && skip.includes(id)) return; if (hold != null) k.hold(hold, id); k.at(t, id, q[0], q[1]); }); return k; }
const nyBoss = (k, t, p) => k.boss('ny', NY, t || 0, (p || NY_BH)[0], (p || NY_BH)[1]);
const nyBubble = (k, t0, dur) => k.ring({ x: 0, y: 0, r: 8, fx: 'zone', t0, dur, color: '#7fd8ff', fill: 'rgba(127,216,255,.2)', cn: 'Alluring Bubble', legend: 'the Alluring Bubble: every murloc heads for it' });
const nyOrb = (k, p, t0, t1) => k.ring({ x: p[0], y: p[1], r: 1.6, fx: 'zone', t0, dur: t1 - t0, color: '#eafaff', fill: 'rgba(150,220,255,.85)', cn: 'Frost Orb', legend: 'a Frost Orb: whoever touches it takes a stacking DoT' });
const nyPuddle = (k, p, t0, dur) => k.ring({ x: p[0], y: p[1], r: 3, fx: 'puddle', t0, dur, color: '#bfefff', fill: 'rgba(191,239,255,.4)', cn: 'Lingering Frost', legend: 'Lingering Frost: ice that hurts and makes you slide' });
// the nine orbs of a Mythic set, in the lane: three rows of three, a big step apart, listed in the order they're soaked
const NY_ORB = [[19, 4.5], [13.5, 4.5], [8, 4.5], [8, 0], [13.5, 0], [19, 0], [8, -4.5], [13.5, -4.5], [19, -4.5]].map(([d, s]) => nyL(d, s));
// a pack of murlocs from a pool, walking at the bubble at 4.5 yards a second until crowd control stops it (stop); then slowed (slow,
// yards a second) or held; gone at die (one by one), or set off again (go) to the bubble's edge and gone there (gone)
function nyPack(k, pre, n, pool, t0, o) {
  o = o || {}; const v = 4.5, d0 = Math.hypot(pool[0], pool[1]), u = [-pool[0] / d0, -pool[1] / d0], ids = [], end = d0 - 10;
  const at = (sAl, i) => { const q = gdzSpot(i, n, 2.6); return [pool[0] + u[0] * sAl + q[0], pool[1] + u[1] * sAl + q[1]]; };
  const tS = o.stop != null ? o.stop : t0 + end / v, sS = Math.min(end, v * (tS - t0));
  for (let i = 0; i < n; i++) { const id = pre + i, nm = o.name || 'Bubblefin Shorerunner'; ids.push(id);
    k.add(id, nm, t0, ...at(0, i)).add(id, nm, tS, ...at(sS, i));
    if (o.slow && o.die != null) k.add(id, nm, o.die, ...at(Math.min(end, sS + o.slow * (o.die - tS)), i));
    else if (o.go != null) k.add(id, nm, o.go, ...at(sS, i)).add(id, nm, o.go + (end - sS) / v, ...at(end, i));
    k.show(id, t0, o.die != null ? o.die + (i % 3) * 0.4 : o.gone != null ? o.gone : o.stop == null ? t0 + end / v : undefined); }
  const c = (t) => { const s = t <= t0 ? 0 : t <= tS ? v * (t - t0) : o.go != null && t > o.go ? sS + v * (t - o.go) : sS + (o.slow ? o.slow * (t - tS) : 0), m = Math.min(end, s); return [pool[0] + u[0] * m, pool[1] + u[1] * m]; };
  return { ids, c, reach: o.go != null ? o.go + (end - sS) / v : t0 + end / v };
}
const nyCC = (k, p, t, cn, legend) => k.ring({ x: p[0], y: p[1], r: 6.5, fx: 'burst', t0: t - 0.3, at: t, dur: 0.7, color: '#7fd8ff', cn: cn || 'AoE crowd control', legend: legend || 'AoE crowd control stops a pack where it stands' });
// murlocs that reach the bubble: Berserkers, pulsing raid damage until they die
function nyZerk(k, t, n, L) { for (let i = 0; i < n; i++) { const q = nzAdd([0, 0], 190 + i * 25, 9.5); k.add('bz' + i, 'Bubblefin Berserker', t, q[0], q[1]).show('bz' + i, t, L); }
  for (let i = 0; t + 0.6 + i * 1.4 < L; i++) k.ring({ x: 0, y: 0, r: 60, fx: 'burst', t0: t + 0.3 + i * 1.4, at: t + 0.6 + i * 1.4, dur: 0.6, color: '#ff6a4a', cn: 'Bubblefin Berserker', legend: 'murlocs that reach the bubble pulse raid damage until they die' });
  k.call(t + 0.4, L, 'Berserkers: raid damage', { x: 0, y: 13, color: '#ff3b3b', ink: '#fff' }); }
// the raid in the whirlpools' gap (west of the bubble): rows 12.5 to 30.5 yards out, the boss in the middle of the 26-yard row
const NY_GAPA = [148, 212];
const NY_GAP = (() => { const S = []; [[12.5, 3], [17, 4], [21.5, 5], [26, 5], [30.5, 5]].forEach(([r, n]) => { const sp = Math.min(54 / (n - 1), 4.6 / r * 180 / Math.PI); for (let i = 0; i < n; i++) S.push(nzAdd([0, 0], 180 + (i - (n - 1) / 2) * sp, r)); }); return S; })();
// (slots: row 12.5 = 0-2, row 17 = 3-6, row 21.5 = 7-11, row 26 = 12-16 (14 is the boss), row 30.5 = 17-21; low numbers in a row are north)
const NY_GSLOT = { r1: 0, r4: 1, r5: 2, r2: 3, h1: 4, r6: 5, h3: 6, r3: 7, h4: 8, t1: 9, r7: 10, h2: 11, m1: 12, m2: 13, m3: 15, m4: 16, m7: 18, t2: 19, m6: 20, m5: 21 };
const NY_GBOSS = NY_GAP[14];
const NY_M = {
  // Alluring Bubble: the bubble forms in the middle and the pools in the water show how many murlocs are coming. They walk at the bubble;
  // any that reach it become Bubblefin Berserkers (raid damage pulses until they die; the Pop empowers them). The tanks walk her to the big
  // pack and the melee stun and cleave it on her; two ranged squads stop and kill the side packs; the Death Knight slows the far pack until
  // the west squad gets there. Mythic: the big pack's fifth murloc is a Bubblefin Frostscale (99% less damage for murlocs within 15 yards):
  // the Death Knight tank grips it out and it dies first. (fail, Mythic: nobody grips the Frostscale; Heroic: nobody takes the west pack)
  murlocs(fail, d) {
    const myth = d !== 'h', L = fail ? 23 : 24, k = gdzKit(NY, L); nyBoss(k, 0); nyHome(k, 0); nyBubble(k, 0, L);
    k.cast('ny', 'Alluring Bubble', 0, 0.8);
    [['SW', 5], ['W', 3], ['SSE', 3], ['NW', 2]].forEach(([p, n]) => { const q = NY_POOL[p]; k.ring({ x: q[0], y: q[1], r: 4.5, fx: 'zone', t0: 0.4, dur: 2.8, color: '#7fd8ff', fill: 'rgba(127,216,255,.25)', cn: 'Murloc pool', legend: 'a pool: it shows how many murlocs are coming (1 to 5)' });
      k.call(0.6, 3, n + (p === 'SW' ? ': the big pack' : ''), { x: q[0], y: q[1] + 6.5, color: '#7fd8ff', ink: '#06131c' }); });
    // the big pack walks straight at her: the tank pulls her a few yards to meet it, the melee spread round where it will stop
    const B2 = nyL(-5, 0), CP = nyL(-11, 0), gripFail = fail && myth, west = !(fail && !myth), P0 = NY_POOL.SW, D0 = Math.hypot(P0[0], P0[1]), U0 = [-P0[0] / D0, -P0[1] / D0];
    nyBoss(k, 1.2); nyBoss(k, 5, B2); k.hold(1.2, 't1').at(5, 't1', ...nyL(-1, 0));
    [100, 150, 200, 250, 300, 345].forEach((a, i) => { const q = nzAdd(CP, a, 6.5); k.hold(1.2, NY_MEL[i]).at(6.4, NY_MEL[i], q[0], q[1]); });
    const big = nyPack(k, 'bp', myth ? 4 : 5, P0, 3, gripFail ? { stop: 8, go: 12.4, gone: 12.4 + (D0 - 10 - 22.5) / 4.5 } : { stop: 8, die: myth ? 12.2 : 10.8 });
    nyCC(k, CP, 8, 'AoE stun', 'the melee stun the big pack on her');
    if (myth) { const FS = gdzSpot(4, 5, 2.6), at0 = [P0[0] + FS[0], P0[1] + FS[1]], atS = [P0[0] + U0[0] * 22.5 + FS[0], P0[1] + U0[1] * 22.5 + FS[1]];
      k.add('fs', 'Bubblefin Frostscale', 3, ...at0).add('fs', 'Bubblefin Frostscale', 8, ...atS);
      if (gripFail) { k.add('fs', 'Bubblefin Frostscale', 12.4, ...atS).add('fs', 'Bubblefin Frostscale', big.reach, P0[0] / D0 * 10, P0[1] / D0 * 10).show('fs', 3, big.reach); }
      else { const G2 = nzAdd(CP, 300, 21), FG = nzAdd(CP, 300, 17); k.hold(1.4, 't2').at(7.6, 't2', G2[0], G2[1]).hold(11.8, 't2').at(14, 't2', ...NY_HOME.t2);
        k.add('fs', 'Bubblefin Frostscale', 8.3, ...atS).add('fs', 'Bubblefin Frostscale', 8.8, FG[0], FG[1]).show('fs', 3, 11.6);
        k.call(8.2, 9.8, 'Grip', { on: 't2', color: '#5aa0ff', ink: '#fff' }); k.call(9, 11.4, 'Frostscale first', { x: FG[0] + 4, y: FG[1] - 6, color: '#ffd23b', ink: '#1a1405' }); }
      k.ring({ on: 'fs', r: 15, fx: 'zone', t0: 3, dur: (gripFail ? big.reach : 11.6) - 3, color: '#5fe0d0', fill: 'rgba(95,224,208,.1)', cn: 'Waterfog Shield', legend: 'Mythic: murlocs within 15 yards of the Frostscale take 99% less damage' }); }
    // after the big pack the melee step back round her
    if (!gripFail) [139, 179, 219, 259, 299, 199].forEach((a, i) => { const q = nzAdd(B2, a, i === 5 ? 11 : 6.5); k.hold(13, NY_MEL[i]).at(15, NY_MEL[i], q[0], q[1]); });
    // the west squad: the west pack, then the pack at the back; the south squad: the south pack, then home
    const SQ_W = ['r1', 'r2', 'r3'], SQ_S = ['r5', 'r6', 'r7'];
    const wp = nyPack(k, 'wp', 3, NY_POOL.W, 3, west ? { stop: 8.5, die: 9.6 } : {}), sp = nyPack(k, 'sp', 3, NY_POOL.SSE, 3, { stop: 8.5, die: 9.6 });
    const np = nyPack(k, 'np', 2, NY_POOL.NW, 3, { stop: 9, slow: 0.5, die: west ? 16.6 : 12.4 });
    const SQW = [-39.7, 3.7], SQS = [8.1, -38.5], SQN = [-36.5, 14.9];
    if (west) SQ_W.forEach((id, i) => { const q = gdzSpot(i, 3, 5); k.hold(3, id).at(7.8, id, SQW[0] + q[0], SQW[1] + q[1]).hold(12.8, id).at(15.6, id, SQN[0] + q[0], SQN[1] + q[1]).hold(17.6, id).at(22.6, id, ...NY_HOME[id]); });
    else SQ_W.forEach((id, i) => { const q = gdzSpot(i, 3, 5); k.hold(3, id).at(9.4, id, SQN[0] + q[0], SQN[1] + q[1]).hold(13, id).at(17.4, id, ...NY_HOME[id]); });
    SQ_S.forEach((id, i) => { const q = gdzSpot(i, 3, 5); k.hold(3, id).at(7.8, id, SQS[0] + q[0], SQS[1] + q[1]).hold(13, id).at(18.4, id, ...NY_HOME[id]); });
    if (west) nyCC(k, wp.c(8.5), 8.5); nyCC(k, sp.c(8.5), 8.5);
    // the Death Knight runs to the far pack and slows it until the west squad gets there
    const DK = [-31, 32], npc = np.c(9); k.hold(1, 'm7').at(9, 'm7', DK[0], DK[1]);
    k.ring({ x: npc[0], y: npc[1], r: 6, fx: 'puddle', t0: 9, dur: (west ? 16.6 : 12.4) - 9, color: '#c0394f', fill: 'rgba(160,40,60,.25)', cn: 'Death and Decay', legend: 'the Death Knight slows them: Death and Decay and Chains of Ice' });
    k.call(9, 11, 'Slowed', { on: 'm7', color: '#c0394f', ink: '#fff' }); if (myth) k.tag('m7', 'Death Knight', 0.6, 9.2);
    k.call(3, 5.4, 'Squads go', { x: -12, y: 10, color: '#f2b33a', ink: '#1a1003' });
    if (fail) {
      if (gripFail) { k.call(9, 12.4, '99% less damage: nothing dies', { x: CP[0] - 4, y: CP[1] - 8, color: '#ff3b3b', ink: '#fff' }); nyZerk(k, big.reach, 4, L); k.step(3).step(8.3).step(big.reach);
        k.pause(11.4, 'Nobody pulled the Frostscale out. Its shield gives the whole pack 99% less damage, so nothing dies, and when the stun ends they walk on to the bubble.', { x: CP[0], y: CP[1], r: 16 });
        return k.done({ title: 'Mistake: the Frostscale left in the pack', focus: { x: -14, y: -10, r: 44 }, full: { x: -8, y: -4, r: 70 }, badLabel: 'left the Frostscale in' }); }
      nyZerk(k, wp.reach, 3, L); k.step(0.4).step(3).step(wp.reach);
      k.pause(wp.reach + 0.5, 'The west squad went straight to the back pack and nobody stopped the west pack. It walked into the bubble: Berserkers, hitting the whole raid until they die.', { x: -14, y: 4, r: 18 });
      return k.done({ title: 'Mistake: a pack nobody took', focus: { x: -10, y: -4, r: 72 }, full: { x: -8, y: -4, r: 70 } }); }
    k.ring1(myth ? ['t1', 't2', 'm7'].concat(SQ_W, SQ_S) : ['t1', 'm7'].concat(SQ_W, SQ_S)).step(0.4).step(3).step(8).step(8.5).step(9);
    k.pause(myth ? 8.9 : 8.6, myth ? 'The big pack is stunned on her and its Frostscale gripped out, so the melee can kill it. The squads stop the side packs and kill them; the Death Knight slows the far one.' : 'The big pack is stunned on her and the melee cleave it. The squads stop the side packs and kill them; the Death Knight slows the far one.', { x: -16, y: -6, r: 40 });
    return k.done({ title: 'Murlocs: the big pack on her, squads on the rest', focus: { x: -10, y: -4, r: 72 }, full: { x: -8, y: -4, r: 70 }, hlLabel: myth ? 'the tanks, the Death Knight and the two squads' : 'her tank, the Death Knight and the two squads' });
  },
  // Chilling Frost (Mythic): three players are chilled and drop an orb under them every 1.5 seconds. Big steps in the lane, so the orbs lie
  // apart; every soak hits the whole raid (Frost Burst), so the immunity player soaks them one at a time and stops when the immunity ends;
  // the tanks take what's left, two each at most. Each soaked orb leaves Lingering Frost. (fail: orbs dropped in a pile, four soaked at once)
  orbsM(fail) {
    const L = fail ? 12 : 19, k = gdzKit(NY, L), DROP = [2.4, 3.9, 5.4]; nyBoss(k, 0); nyHome(k, 0); nyBubble(k, 0, L);
    k.cast('ny', 'Chilling Frost', 0.4, 2.4); const TG = [['r3', 4.5], ['r4', 0], ['r6', -4.5]];
    TG.forEach(([id, s]) => { k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 0.4, dur: 5.2, color: '#bfefff', cn: 'Chilling Frost', legend: 'Chilling Frost: an orb drops under you every 1.5 seconds' }); k.hold(0.5, id);
      const P = fail ? [0, 1, 2].map((i) => { const q = nyL(12, s * 0.6); return [q[0] + i * 0.5, q[1]]; }) : [nyL(8, s), nyL(13.5, s), nyL(19, s)];
      DROP.forEach((t, i) => k.at(t, id, P[i][0], P[i][1])); k.hold(5.6, id).at(8.6, id, ...NY_HOME[id]); });
    if (fail) { TG.forEach(([, s], j) => [0, 1, 2].forEach((i) => { const q = nyL(12, s * 0.6); nyOrb(k, [q[0] + i * 0.5, q[1]], DROP[i], j === 1 || (j === 0 && i === 2) ? 7.6 : L); }));
      k.hold(4.4, 'r1').at(7.6, 'r1', ...nyL(12, 1.4)); gdzFailBlast(k, 7.8, 'Four Frost Bursts at once', -16, 2, ['h4', 'r7', 'm2'], 'Frost Burst ×4');
      k.step(0.4).step(3).step(7.8);
      k.pause(7.2, 'The chilled players stood still, so their nine orbs landed in one pile. One step in and the soaker touches four at once: four raid hits together.', { x: nyL(12, 0)[0], y: nyL(12, 0)[1], r: 9 });
      return k.done({ title: 'Mistake: the orbs in one pile', focus: { x: -16, y: -12, r: 26 }, full: { x: -17, y: -11, r: 27 }, badLabel: 'dies to the raid damage' }); }
    const dropT = [5.4, 3.9, 2.4, 2.4, 3.9, 5.4, 2.4, 3.9, 5.4], SO = [['r1', 7], ['r1', 8.3], ['r1', 9.6], ['r1', 10.9], ['r1', 12.2], ['r1', 13.5], ['t1', 15], ['t2', 15], ['t2', 16.4]];
    k.tag('r1', 'Turtle', 6.4, 14); k.hold(4.4, 'r1'); k.hold(13.6, ['t1', 't2']);
    SO.forEach(([id, ts], i) => { const p = NY_ORB[i]; nyOrb(k, p, dropT[i], ts); nyPuddle(k, p, ts, L - ts); k.at(ts, id, p[0] - 0.8, p[1] + 0.8);
      k.ring({ x: 0, y: 0, r: 70, fx: 'burst', t0: ts - 0.2, at: ts, dur: 0.5, color: '#9fe6ff', cn: 'Frost Burst', legend: 'Mythic: every soak hits the whole raid' }); });
    k.call(14, 15.6, 'Turtle over: stop', { on: 'r1', color: '#ffd23b', ink: '#1a1405' }); k.hold(13.6, 'r1').at(16.6, 'r1', ...NY_HOME.r1);
    k.hold(15.3, 't1').at(17, 't1', ...NY_HOME.t1); k.hold(16.7, 't2').at(18.6, 't2', ...NY_HOME.t2);
    k.call(15, 16.6, '2 each at most', { on: 't2', color: '#5aa0ff', ink: '#fff' });
    k.ring1(['r1', 'r3', 'r4', 'r6', 't1', 't2']).step(0.4).step(2.4).step(7).step(14).step(15);
    k.pause(6.2, 'Big steps: nine orbs, well apart in the lane. Every soak will hit the whole raid, so they go one at a time.', { x: NY_ORB[4][0], y: NY_ORB[4][1], r: 13 });
    return k.done({ title: 'Chilling Frost: big steps, soak one at a time', focus: { x: -16, y: -12, r: 26 }, full: { x: -17, y: -11, r: 27 }, hlLabel: 'the three chilled players, the immunity soaker and the tanks' });
  },
  // Chilling Frost (Heroic): the chilled players go to the edge behind her and drop their three orbs close together there; each pops a
  // defensive and takes two of their own, the off tank the rest. An orb left 30 seconds shatters: a stacking DoT on the whole raid. The ice
  // they leave stays until the Pop washes it away. (fail: one orb left to shatter)
  orbsH(fail) {
    const L = 18, k = gdzKit(NY, L), DROP = [3.9, 5.4, 6.9]; nyBoss(k, 0); nyHome(k, 0); nyBubble(k, 0, L);
    k.cast('ny', 'Chilling Frost', 0.4, 2.4); const TG = [['m6', 205], ['m4', 222], ['h2', 240]];
    const SP = TG.map(([, a]) => [0, 1, 2].map((i) => nzAdd([0, 0], a - 3.2 + i * 3.2, 49)));
    TG.forEach(([id], j) => { k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 0.4, dur: 6.6, color: '#bfefff', cn: 'Chilling Frost', legend: 'Chilling Frost: an orb drops under you every 1.5 seconds' }); k.hold(0.4, id);
      DROP.forEach((t, i) => k.at(t, id, SP[j][i][0], SP[j][i][1])); SP[j].forEach((p, i) => { if (i < 2) nyOrb(k, p, DROP[i], i ? 7.8 : 9); });
      k.at(7.8, id, SP[j][1][0] - 0.8, SP[j][1][1]).at(9, id, SP[j][0][0] - 0.8, SP[j][0][1]).hold(9.2, id).at(12.6, id, ...NY_HOME[id]);
      k.call(7.2, 8.8, 'Defensive', { on: id, color: '#5aa0ff', ink: '#fff' }); [7.8, 9].forEach((t, i) => nyPuddle(k, SP[j][1 - i], t, L - t)); });
    // the off tank takes the third orb of each (the nearest first)
    const T3 = fail ? [[2, 10.4], [1, 12.4]] : [[2, 10.4], [1, 12.4], [0, 14.3]]; k.hold(7.6, 't2');
    T3.forEach(([j, t]) => { const p = SP[j][2]; k.at(t, 't2', p[0] + 0.8, p[1] + 0.8); nyPuddle(k, p, t, L - t); });
    const keep = (j, t) => { const p = SP[j][2]; k.ring({ x: p[0], y: p[1], r: 1.6, fx: 'zone', t0: DROP[2], dur: t - DROP[2], color: '#eafaff', fill: 'rgba(150,220,255,.85)', cn: 'Frost Orb', legend: 'a Frost Orb: whoever touches it takes a stacking DoT' }); };
    T3.forEach(([j, t]) => keep(j, t)); k.hold(fail ? 12.6 : 14.5, 't2').at(fail ? 15.6 : 17.6, 't2', ...NY_HOME.t2);
    if (fail) { keep(0, 16.2); const p = SP[0][2]; k.call(13.6, 15.8, '30 seconds after it dropped…', { x: p[0] + 4, y: p[1] + 7, color: '#ffd23b', ink: '#1a1405' });
      k.ring({ x: p[0], y: p[1], r: 6, fx: 'burst', t0: 15.8, at: 16.2, dur: 0.8, color: '#9fe6ff', cn: 'Frost Orb shatters', legend: 'an orb left 30 seconds shatters' }); gdzFailBlast(k, 16.4, 'A stacking DoT on everyone', -16, 4, [], 'Frost Orb');
      k.step(0.4).step(7.6).step(16.2);
      k.pause(16.6, 'Nobody took this orb. 30 seconds after it dropped it shattered: a DoT on the whole raid that stacks with every orb missed.', { x: p[0], y: p[1], r: 9 });
      return k.done({ title: 'Mistake: an orb left to shatter', focus: { x: -26, y: -24, r: 28 }, full: { x: -24, y: -22, r: 29 } }); }
    k.ring1(['m6', 'm4', 'h2', 't2']).step(0.4).step(3.9).step(7.2).step(7.6);
    k.pause(7.4, 'Nine orbs at the edge behind her, close together. Each chilled player takes two of their own with a defensive; the off tank takes the rest.', { x: -32, y: -32, r: 16 });
    return k.done({ title: 'Chilling Frost: orbs at the edge, all soaked', focus: { x: -26, y: -24, r: 28 }, full: { x: -24, y: -22, r: 29 }, hlLabel: 'the three chilled players and the off tank' });
  },
  // Water Jet (Mythic): a 3-second cast, then a 6-second line from her through her tank and on across the island, pushing the tank back;
  // it's the only thing that clears Lingering Frost. The tank steps across so the line sweeps the lane clean; swap after every cast (+20%
  // per hit). The first one each loop hits air. (o.n: puddles to clear, 0 for none; fail: the tank stands off to the side)
  jet(fail, d, o) {
    o = o || {}; const n = o.n != null ? o.n : 9, L = 11, k = gdzKit(NY, L); nyBoss(k, 0); nyHome(k, 0); nyBubble(k, 0, L);
    const TK = 't1', S0 = fail ? [1, 16] : [4.5, 2.7], S1 = fail ? [2, 20] : [7, -4.1];
    k.hold(0.4, TK).at(1.8, TK, ...nyL(S0[0], S0[1])).at(3.4, TK, ...nyL(S0[0], S0[1])).at(9.4, TK, ...nyL(S1[0], S1[1]));
    k.cast('ny', 'Water Jet', 0.4, 3.4);
    const th = (t) => { const w = Math.max(0, Math.min(1, (t - 3.4) / 6)), dd = S0[0] + (S1[0] - S0[0]) * w, ss = S0[1] + (S1[1] - S0[1]) * w; return Math.atan2(ss, dd) * 180 / Math.PI; };
    for (let t = 3.4; t < 9.39; t += 0.5) { const e = nzAdd(NY_BH, 39 + th(t + 0.25), 75); k.link({ from: 'ny', toYd: { x: e[0], y: e[1] }, t0: t, t1: t + 0.5, color: '#7fd8ff', legend: 'Water Jet: a line through the tank, right across the island' }); }
    for (let i = 1; i <= 6; i++) k.cone({ from: 'ny', to: TK, at: 3.4 + i, r: 75, width: 6 });
    // the ice: each patch gone as the line sweeps over it
    NY_ORB.slice(0, n).forEach((p) => { const v = [p[0] - NY_BH[0], p[1] - NY_BH[1]], tp = Math.atan2(v[0] * NY_N[0] + v[1] * NY_N[1], v[0] * NY_U[0] + v[1] * NY_U[1]) * 180 / Math.PI;
      let tc = L; if (!fail) for (let t = 3.4; t <= 9.4; t += 0.1) if (th(t) <= tp) { tc = t + 0.3; break; } nyPuddle(k, p, 0, tc); });
    k.call(9.6, 11, 'Taunt', { on: 't2', color: '#5aa0ff', ink: '#fff' }); k.hold(9.6, ['t1', 't2']).at(10.6, 't2', ...nyL(4, 0)).at(10.6, 't1', ...NY_HOME.t2);
    if (fail) { k.call(9.4, 11, 'The ice stays', { x: NY_ORB[4][0] + 6, y: NY_ORB[4][1] - 6, color: '#ff3b3b', ink: '#fff' }); k.step(0.4).step(3.4).step(9.4);
      k.pause(9.5, 'Her tank stood off to the side, so the jet went across empty floor. The ice stays: every set after has less room, and the murlocs speed up on it.', { x: NY_ORB[4][0], y: NY_ORB[4][1], r: 12 });
      return k.done({ title: 'Mistake: the ice left behind', focus: { x: -16, y: -12, r: 26 }, full: { x: -17, y: -11, r: 27 } }); }
    k.ring1(['t1', 't2']).step(0.4).step(3.4).step(5.4).step(9.6);
    k.pause(5.6, n ? 'Her tank walks slowly across the end of the lane, so the line sweeps over the ice and washes it away. Everyone else stays wide of the lane.' : 'No ice down yet: this one hits air. Still nobody in the line, and still a taunt after.', { x: NY_ORB[4][0], y: NY_ORB[4][1], r: 14 });
    return k.done({ title: n ? 'Water Jet: sweep the ice away' : 'Water Jet: the first one hits air', focus: { x: -16, y: -12, r: 26 }, full: { x: -17, y: -11, r: 27 }, hlLabel: 'the tanks' });
  },
  // Swirling Whirlpools: whirlpools rise all round the island's edge leaving one gap, and close in on the bubble (nearly a one-shot to
  // anyone they cross). Everyone into the gap, the boss too, close to the bubble (within about 30 yards: the Pop throws you 20). When they
  // reach it, it pops: a raid hit and a knockback away from it. Then back to the spots. (fail: one player stays out of the gap)
  whirl(fail, d) {
    const L = fail ? 15 : 22, k = gdzKit(NY, L), BUB = 14.2; nyBoss(k, 0); nyHome(k, 0); nyBubble(k, 0, BUB);
    k.cast('ny', 'Swirling Whirlpools', 0.4, 4.4);
    k.arc({ x: 0, y: 0, r0: 56, v: -4.9, d: 5, a0: 0, a1: 360, gaps: [NY_GAPA], t0: 4.4, t1: 14, warn: 2.4, color: '#5ab8ff', legend: 'Swirling Whirlpools: they close in on the bubble; stand in the gap' });
    nyBoss(k, 0.6); nyBoss(k, 4.2, NY_GBOSS);
    Object.entries(NY_GSLOT).forEach(([id, si]) => { if (fail && id === 'r6') return; const q = NY_GAP[si]; k.hold(0.4, id).at(4.2, id, q[0], q[1]); });
    k.call(1, 3.8, 'Into the gap', { x: -34, y: 8, color: '#5ab8ff', ink: '#06131c' });
    if (fail) { const hitT = 4.4 + (56 - Math.hypot(NY_HOME.r6[0], NY_HOME.r6[1])) / 4.9; ulHit(k, 'r6', hitT, 'Whirlpool: 2.5 million'); k.oops('r6', hitT + 0.3); k.step(0.4).step(4.4).step(hitT);
      k.pause(hitT + 0.4, 'This ranged stayed at their spot outside the gap. The whirlpools cross them on their way in: 2.5 million damage, and with the rain still ticking, dead.', { on: 'r6', r: 9 });
      return k.done({ title: 'Mistake: caught outside the gap', focus: { x: -12, y: -6, r: 44 }, full: { x: -4, y: -2, r: 60 }, badLabel: 'hit by the whirlpools' }); }
    k.ring({ x: 0, y: 0, r: 62, fx: 'burst', t0: BUB - 0.4, at: BUB, dur: 0.8, color: '#7fd8ff', cn: 'Pop!', legend: 'Pop!: a raid hit, and everyone is knocked away from the bubble' });
    k.call(BUB, BUB + 1.4, 'Knocked back', { x: -36, y: 16, color: '#7fd8ff', ink: '#06131c' });
    Object.entries(NY_GSLOT).forEach(([id, si]) => { const q = NY_GAP[si], r = Math.hypot(q[0], q[1]); k.hold(BUB, id).at(BUB + 0.6, id, q[0] / r * (r + 20), q[1] / r * (r + 20)).hold(BUB + 1.4, id).at(21.4, id, ...NY_HOME[id]); });
    nyBoss(k, BUB + 1.4, NY_GBOSS); nyBoss(k, 20.6);
    k.ring1(['t1', 't2']).step(0.4).step(4.4).step(BUB).step(BUB + 1.4);
    k.pause(9.4, 'The whirlpools close in from every side but one. Everyone, the boss too, stands in that gap, within about 30 yards of the bubble.', { x: -20, y: 0, r: 16 });
    return k.done({ title: 'Swirling Whirlpools: everyone in the gap', focus: { x: -12, y: -4, r: 58 }, full: { x: -4, y: -2, r: 60 }, hlLabel: 'the tanks, who bring her into the gap' });
  },
  // Pop!: the whirlpools reach the bubble and it bursts: a raid hit, and everyone is knocked about 20 yards away from it. Stand close
  // enough to land on the island. Mythic: the Pop leaves the ice where it is: with ice behind you, take a Warlock gateway (or cancel the
  // knockback). Heroic: the Pop washes the ice away. (fail: a melee too far out lands in the water: shark bites)
  pop(fail, d) {
    const myth = d !== 'h', L = 11, k = gdzKit(NY, L), BUB = 2.6, KB = (q, add) => { const r = Math.hypot(q[0], q[1]); return [q[0] / r * (r + add), q[1] / r * (r + add)]; };
    k.boss('ny', NY, 0, ...NY_GBOSS); nyBubble(k, 0, BUB);
    const S = {}; Object.entries(NY_GSLOT).forEach(([id, si]) => { S[id] = fail && id === 'm6' ? nzAdd([0, 0], 200, 40) : NY_GAP[si]; k.at(0, id, S[id][0], S[id][1]); });
    k.arc({ x: 0, y: 0, r0: 22, v: -5.2, d: 5, a0: 0, a1: 360, gaps: [NY_GAPA], t0: 0, t1: 2.5, color: '#5ab8ff', legend: 'Swirling Whirlpools: they close in on the bubble; stand in the gap' });
    k.ring({ x: 0, y: 0, r: 62, fx: 'burst', t0: BUB - 0.4, at: BUB, dur: 0.8, color: '#7fd8ff', cn: 'Pop!', legend: 'Pop!: a raid hit, and everyone is knocked away from the bubble' });
    k.call(BUB, BUB + 1.4, 'Knocked back', { x: -36, y: 16, color: '#7fd8ff', ink: '#06131c' }); k.call(BUB, BUB + 2, 'Raid cooldown', { on: 'h1', color: '#45d16b', ink: '#04140a' });
    const ICE = KB(S.r2, 20), GA = KB(S.r2, 15), GB = [-22, -14];
    if (myth) { nyPuddle(k, ICE, 0, L); [GA, GB].forEach((p) => k.ring({ x: p[0], y: p[1], r: 1.8, fx: 'zone', t0: 0, dur: BUB + 1.4, color: '#c084ff', fill: 'rgba(160,90,255,.45)', cn: 'Demonic Gateway', legend: 'a Warlock gateway: knocked into it, you come out the other end' })); }
    else { [[-44, -21], [-37, -33], [-24, -42]].forEach((p) => nyPuddle(k, p, 0, BUB + 0.2)); k.call(BUB + 0.2, BUB + 2.2, 'The Pop washes the ice away', { x: -34, y: -26, color: '#7fd8ff', ink: '#06131c' }); }
    Object.entries(S).forEach(([id, q]) => { const far = fail && id === 'm6', e = KB(q, 20);
      if (myth && id === 'r2') { k.hold(BUB, id).at(BUB + 0.4, id, GA[0], GA[1]).at(BUB + 0.5, id, GB[0], GB[1]).hold(BUB + 1.4, id).at(L - 0.6, id, ...NY_HOME[id]); k.call(BUB + 0.3, BUB + 2, 'Gateway', { on: id, color: '#c084ff', ink: '#14062a' }); return; }
      k.hold(BUB, id).at(BUB + 0.6, id, e[0], e[1]); if (!far) k.hold(BUB + 1.4, id).at(L - 0.6, id, ...NY_HOME[id]); });
    k.boss('ny', NY, BUB + 1.4, ...NY_GBOSS); nyBoss(k, L - 1);
    if (fail) { const w = KB(S.m6, 20); k.ring({ on: 'm6', r: 2.4, fx: 'debuff', t0: BUB + 0.8, dur: L, color: '#ff4a5a', cn: 'Wild Bite', legend: 'in the water: sharks bite, a 20-second bleed' }); k.hold(BUB + 1, 'm6').at(L - 0.2, 'm6', ...nzAdd([0, 0], 200, 51));
      k.call(BUB + 0.8, BUB + 3.6, 'In the water: sharks', { on: 'm6', color: '#ff3b3b', ink: '#fff' }); k.oops('m6', BUB + 0.8); k.step(0.2).step(BUB).step(BUB + 0.8);
      k.pause(BUB + 1.2, 'This melee stood too far from the bubble. The Pop threw them into the water: sharks bite, a 20-second bleed, and a long swim back while the next murlocs come.', { x: w[0], y: w[1], r: 9 });
      return k.done({ title: 'Mistake: knocked into the water', focus: { x: -34, y: -4, r: 32 }, full: { x: -23, y: -2, r: 34 }, badLabel: 'knocked into the water' }); }
    k.ring1(myth ? ['r2'] : []).step(0.2).step(BUB).step(BUB + 1.4);
    k.pause(BUB + 0.9, myth ? 'Everyone lands on the island. This ranged had ice behind them, so they lined up with a Warlock gateway and were thrown through it.' : 'Everyone lands on the island, and on Heroic the wave washes the ice away.', { x: -36, y: 0, r: 20 });
    return k.done({ title: 'Pop!: land on the island', focus: { x: -30, y: -4, r: 32 }, full: { x: -23, y: -2, r: 34 }, hlLabel: myth ? 'a ranged taking a gateway' : '' });
  },
};
const NY_FAIL = {
  murlocsH: { name: 'A pack nobody took', what: 'Nobody stops or kills one side pack: it walks into the bubble and becomes Berserkers that hit the whole raid until they die.', do: ['The packs come out.', 'The squads go, but one pack is left alone.', 'Berserkers at the bubble.'], map: () => NY_M.murlocs(true, 'h') },
  murlocsM: { name: 'The Frostscale left in the pack', what: 'Nobody grips the Frostscale out: its shield gives the whole pack 99% less damage, nothing dies, and they walk on into the bubble.', do: ['The big pack arrives.', 'Nobody grips the Frostscale: nothing dies.', 'On to the bubble: Berserkers.'], map: () => NY_M.murlocs(true, 'm') },
  orbsH: { name: 'An orb left to shatter', what: 'One orb is never soaked: 30 seconds after it dropped it shatters, a stacking DoT on the whole raid.', do: ['Nine orbs drop.', 'The off tank misses one.', 'It shatters on the raid.'], map: () => NY_M.orbsH(true) },
  orbsM: { name: 'The orbs in one pile', what: 'The chilled players stand still: nine orbs in one pile, and one step touches four at once. Four raid hits together.', do: ['Three players are chilled.', 'They stand still: one pile.', 'Four Frost Bursts at once.'], map: () => NY_M.orbsM(true) },
  jet: { name: 'The ice left behind', what: 'Her tank stands off to the side: Water Jet misses the lane and the ice stays. Every set after has less room, and the murlocs speed up on the ice.', do: ['Ice in the lane.', 'The jet goes off to the side.', 'The ice stays.'], map: (d) => NY_M.jet(true, d) },
  whirl: { name: 'Caught outside the gap', what: 'A player stays at their spot: the whirlpools cross them on the way in. 2.5 million damage.', do: ['Whirlpools rise.', 'One player stays out.', 'Hit: nearly dead.'], map: (d) => NY_M.whirl(true, d) },
  pop: { name: 'Knocked into the water', what: 'A melee stands too far from the bubble: the Pop throws them into the water. Sharks bite: a 20-second bleed, and a long swim back.', do: ['Too far out.', 'The Pop.', 'Into the water: sharks.'], map: (d) => NY_M.pop(true, d) },
};
// ---- the whole fight (Mythic), by Wolfthorn's kill's clock (6:23)
const NY_BEATS = {
  start: { name: 'The pull', do: ['Tanks take her to the south-west quarter of the island: she stays on the outside, the raid on the inside.', 'Bloodlust on the pull.'],
    run() { const k = gdzKit(NY, 3); nyBoss(k, 0); nyHome(k, 0); k.ring1(['t1', 't2']).step(0.2); } },
  rain: { name: 'Abyssal Rain', do: ['Four raid hits, then a 24-second DoT: a healing cooldown, personals if you\'re low.', 'She gets 5% stronger every cast: the fight ramps up.'],
    run(o) { const k = gdzKit(NY, 6); nyBoss(k, 0); nyHome(k, 0); if (!o.nob) nyBubble(k, 0, 6); k.cast('ny', 'Abyssal Rain', 0.2, 1.2);
      for (let i = 0; i < 4; i++) k.ring({ x: 0, y: 0, r: 70, fx: 'burst', t0: 1 + i, at: 1.2 + i, dur: 0.6, color: '#5ab8ff', cn: 'Abyssal Rain', legend: 'Abyssal Rain: four raid hits, then a 24-second DoT' });
      k.call(1.2, 4.4, 'Healing cooldown', { on: 'h1', color: '#45d16b', ink: '#04140a' }); k.call(1.4, 5, '+5% damage', { on: 'ny', color: '#ff8a5a', ink: '#1a0a04' }); k.step(0.2).step(1.4); } },
  burn: { name: 'The burn (after the third Pop)', do: ['She enrages after the next whirlpool (about 7:15): ignore the murlocs, everyone on the boss.', 'Keep soaking the orbs: they still go off long before the enrage.'],
    run() { const k = gdzKit(NY, 4); nyBoss(k, 0); nyHome(k, 0); nyBubble(k, 0, 4); k.call(0.4, 3.6, 'Ignore the adds: burn', { x: NY_BH[0], y: NY_BH[1] + 10, color: '#ffd23b', ink: '#1a1405' }); k.step(0.2).step(1.6); } },
  kill: { name: 'The kill', do: ['Nymrissa dies.'],
    run() { const k = gdzKit(NY, 4); nyBoss(k, 0); nyHome(k, 0); nyBubble(k, 0, 2); k.ring({ on: 'ny', r: 7, fx: 'burst', t0: 1.4, at: 2, dur: 0.8, color: '#ffd23b', cn: 'Nymrissa dies', legend: 'the kill' }); k.step(0.3); } },
};
const NY_SIM = [
  { at: 0, beat: 'start' }, { at: 8, beat: 'rain', label: 'Abyssal Rain 1', o: { nob: true } }, { at: 18, mech: 'murlocs', label: 'Alluring Bubble and Murloc set 1' }, { at: 27, mech: 'jet', label: 'Water Jet 1 (hits air)', o: { n: 0 } },
  { at: 36, mech: 'orbs', label: 'Chilling Frost 1' }, { at: 41, beat: 'rain', label: 'Abyssal Rain 2' }, { at: 49, mech: 'jet', label: 'Water Jet 2 (clears the ice)' },
  { at: 67, mech: 'murlocs', label: 'Murloc set 2' }, { at: 71, mech: 'jet', label: 'Water Jet 3', o: { n: 0 } }, { at: 80, mech: 'orbs', label: 'Chilling Frost 2' }, { at: 85, beat: 'rain', label: 'Abyssal Rain 3' }, { at: 93, mech: 'jet', label: 'Water Jet 4 (clears the ice)' },
  { at: 107, mech: 'whirl', label: 'Swirling Whirlpools and Pop! 1' },
  { at: 128, mech: 'murlocs', label: 'Alluring Bubble and Murloc set 3' }, { at: 137, mech: 'jet', label: 'Water Jet 5', o: { n: 0 } }, { at: 146, mech: 'orbs', label: 'Chilling Frost 3' }, { at: 151, beat: 'rain', label: 'Abyssal Rain 4' }, { at: 159, mech: 'jet', label: 'Water Jet 6 (clears the ice)' },
  { at: 177, mech: 'murlocs', label: 'Murloc set 4' }, { at: 181, mech: 'jet', label: 'Water Jet 7', o: { n: 0 } }, { at: 190, mech: 'orbs', label: 'Chilling Frost 4' }, { at: 195, beat: 'rain', label: 'Abyssal Rain 5' }, { at: 203, mech: 'jet', label: 'Water Jet 8 (clears the ice)' },
  { at: 217, mech: 'whirl', label: 'Swirling Whirlpools and Pop! 2' },
  { at: 238, mech: 'murlocs', label: 'Alluring Bubble and Murloc set 5' }, { at: 247, mech: 'jet', label: 'Water Jet 9', o: { n: 0 } }, { at: 256, mech: 'orbs', label: 'Chilling Frost 5' }, { at: 261, beat: 'rain', label: 'Abyssal Rain 6' }, { at: 269, mech: 'jet', label: 'Water Jet 10 (clears the ice)' },
  { at: 287, mech: 'murlocs', label: 'Murloc set 6' }, { at: 291, mech: 'jet', label: 'Water Jet 11', o: { n: 0 } }, { at: 300, mech: 'orbs', label: 'Chilling Frost 6' }, { at: 305, beat: 'rain', label: 'Abyssal Rain 7' }, { at: 313, mech: 'jet', label: 'Water Jet 12 (clears the ice)' },
  { at: 327, mech: 'whirl', label: 'Swirling Whirlpools and Pop! 3' }, { at: 342, beat: 'burn', ph: 1 },
  { at: 357, mech: 'jet', ph: 1, label: 'Water Jet 13', o: { n: 0 } }, { at: 366, mech: 'orbs', ph: 1, label: 'Chilling Frost 7' }, { at: 371, beat: 'rain', ph: 1, label: 'Abyssal Rain 8' }, { at: 379, mech: 'jet', ph: 1, label: 'Water Jet 14 (clears the ice)' }, { at: 383, beat: 'kill', ph: 1 },
];
const NY_DUR = { 'm:murlocs': 24, 'm:jet': 11, 'm:orbs': 19, 'm:whirl': 22, 'm:pop': 11, 'b:start': 3, 'b:rain': 6, 'b:burn': 4, 'b:kill': 0 };
const NY_SEV = { 'm:murlocs': 3, 'm:jet': 2, 'm:orbs': 3, 'm:whirl': 3, 'm:pop': 2, 'b:start': 1, 'b:rain': 2, 'b:burn': 2, 'b:kill': 1 };
GDZ['Nymrissa Wavecaller'] = {
  upd: ['12.1', 'Oct 21, 2026'],
  stepRoles: {
    'Alluring Bubble (Kill the murlocs before they reach it)': ['', 'td', 'd', 'd', 'd'], 'Alluring Bubble (Frostscale out, squads on the side packs)': ['t', 'd', 't', 'd', 't'],
    'Chilling Frost (Drop them at the edge, soak them all)': ['', '', '', 't'], 'Chilling Frost (Big steps, soak one at a time)': ['', '', '', '', 't'],
    'Water Jet (Sweep the ice, swap every cast)': ['t', 't', '', 't'], 'Swirling Whirlpools (Everyone in the gap)': ['', 't', '', ''], 'Pop! (Land on the island, not in the water)': ['', 'h', ''],
  },
  sum: 'One loop every 110 seconds, rinse and repeat: kill the murlocs before they reach her bubble, drop and soak the Frost Orbs with care, get into the whirlpools\' gap and land safely after the Pop. She gets stronger with every Abyssal Rain, so the fight ramps up.',
  m: { sim: NY_SIM, simDur: NY_DUR, simSev: NY_SEV, beats: NY_BEATS,
    simAlways: ['The loop is 110 seconds: two murloc sets, two orb sets and four Water Jets, then the whirlpools and the Pop.', 'Every orb soak hits the whole raid: one at a time.', 'She gets 5% stronger every Abyssal Rain: the fight ramps up.'],
    source: 'Tactyks\' Mythic Nymrissa video', sum: 'Heroic plus three things: a Frostscale in every big pack that shields the murlocs near it, a raid hit on every orb soak, and Water Jet, a tank line that is the only way to clear the ice.' },
  facts: [['Phases', 'One loop, every 110 s'], ['Bloodlust', 'On the pull'], ['Tanks', '3: one only slows murlocs', 'm'], ['Healers', '5', 'm'], ['Hardest part', 'Murlocs and orb soaks'], ['Fight length', 'About 3 minutes', 'h'], ['Fight length', 'About 6.5 minutes', 'm']],
  phases: [
    { id: 'loop', name: 'The loop: every 110 seconds', sum: 'Abyssal Rain, then her bubble and a murloc set, Chilling Frost and its orbs, a second murloc set and orbs (Water Jets on Mythic all the way through), then the whirlpools and the Pop. Rinse and repeat.',
      mechs: [
        { id: 'murlocs', spell: 'Alluring Bubble', map: (d) => NY_M.murlocs(false, d),
          h: { fail: NY_FAIL.murlocsH, name: 'Alluring Bubble (Kill the murlocs before they reach it)', what: 'She forms a giant bubble in the middle of the island, and pools in the water round the edge show how many murlocs are coming from each (1 to 5). They all walk to the bubble; any that get there become Berserkers that hit the raid until they die.',
            do: ['The pools show where the murlocs come out and how many.', 'Tanks walk her to the biggest pack; the melee stun it and cleave it on her.', 'Ranged with crowd control stop the side packs where they stand.', 'Two ranged squads kill the side packs, the biggest first.', 'A slow (a Death Knight, or any AoE slow) holds the far pack until a squad gets there.'],
            plan: ['Everyone brings some AoE crowd control: stuns, roots, Mass Entanglement, Frost Nova.', 'Grips and knockbacks can pull a pack next to yours into it.', 'One or two Berserkers is fine: cleave them on the boss.'] },
          m: { fail: NY_FAIL.murlocsM, name: 'Alluring Bubble (Frostscale out, squads on the side packs)', what: 'The same murlocs, but the biggest pack is always five and its fifth is a Bubblefin Frostscale: murlocs within 15 yards of it take 99% less damage. Murlocs that reach the bubble become Berserkers, and the next Pop empowers them: a wipe.',
            do: ['The pools show where the murlocs come out: walk her to the big pack.', 'The melee stun the big pack and cleave it on her.', 'The Death Knight tank grips the Frostscale out; kill it first.', 'Two ranged squads (3 or 4 each, with crowd control) take the side packs, then the one at the back.', 'A third tank, a Blood Death Knight, only slows the far pack: Death and Decay, Chains of Ice.'],
            plan: ['Play in one quarter of the island and never drag her across it: the squads go to the murlocs instead.', 'Druids, Evokers and Hunters bring the best crowd control for the squads.', 'The Blood Death Knight needs no gear and does no damage: their whole job is slowing murlocs.', 'After the third Pop, ignore them: see The burn.'] } },
        { id: 'orbs', spell: 'Chilling Frost', map: (d) => (d === 'h' ? NY_M.orbsH(false) : NY_M.orbsM(false)),
          h: { fail: NY_FAIL.orbsH, name: 'Chilling Frost (Drop them at the edge, soak them all)', what: 'A few players are chilled: an orb drops under them every 1.5 seconds, three each. Touching an orb soaks it: a DoT that stacks. An orb left for 30 seconds shatters: a stacking DoT on the whole raid. Each soaked orb leaves ice that hurts and makes you slide.',
            do: ['Chilled: go to the edge behind her.', 'Drop your three orbs close together.', 'Pop a defensive and take two of your own.', 'The off tank takes the rest, all within 30 seconds.'],
            plan: ['The ice stays until the Pop washes it away, so keep it in one corner.', 'A Chilling Frost lands just before the whirlpools: immunity players clean up any orbs left then.'] },
          m: { fail: NY_FAIL.orbsM, name: 'Chilling Frost (Big steps, soak one at a time)', what: 'Three players are chilled and drop three orbs each. Every soak now also hits the whole raid (Frost Burst), and the ice an orb leaves stays until a Water Jet washes it away.',
            do: ['Chilled: walk into the lane between her and the bubble.', 'Take big steps: your three orbs well apart.', 'The immunity player soaks them one at a time, a second or more apart.', 'Immunity over: stop, even with orbs left.', 'The tanks take what\'s left, two each at most.'],
            plan: ['Four immunity players take turns, one a set: Hunter Turtle, Paladin Bubble, Rogue Cloak. Three is enough: the tanks cover the middle set.', 'Two or three orbs left is fine: three tanks can take six between them.', 'Healers: a raid cooldown on every set. Four bursts at once nearly wiped a top guild.'] } },
        { id: 'jet', only: 'm', fail: NY_FAIL.jet, name: 'Water Jet (Sweep the ice, swap every cast)', spell: 'Water Jet', what: 'A tank line: after a 3-second cast she blasts her tank for 6 seconds, pushing them back, and the water runs right across the island. It\'s the only thing that clears the ice, and each hit adds 20% to the next.',
          do: ['Her tank steps to the edge of the lane.', 'Walk across it slowly: the line sweeps the ice away.', 'Nobody else in the line: it goes right across the island.', 'The other tank taunts after every cast.'],
          plan: ['The first one each loop hits air: no ice yet.', 'There\'s one more jet than ice sets, so you can catch up if you fall behind.', 'Call it when it goes through the bubble toward people on the far side.'],
          map: (d, o) => NY_M.jet(false, d, o) },
        { id: 'whirl', fail: NY_FAIL.whirl, name: 'Swirling Whirlpools (Everyone in the gap)', spell: 'Swirling Whirlpools', what: 'Whirlpools rise all round the edge of the island, leaving one gap, and close in on the bubble. They nearly one-shot anyone they cross. When they reach the bubble it pops.',
          do: ['Find the gap as they rise: raid speed boosts help.', 'Everyone into it, the boss too, close to the bubble.', 'They reach the bubble: it pops.', 'Back to your spots.'],
          plan: ['Stand within about 30 yards of the bubble: the Pop throws you about 20.', 'The gap can be anywhere: the raid lead calls it.'],
          map: (d) => NY_M.whirl(false, d) },
        { id: 'pop', fail: NY_FAIL.pop, name: 'Pop! (Land on the island, not in the water)', spell: 'Pop!', what: 'When the whirlpools reach the bubble it bursts: a raid hit, and everyone is knocked about 20 yards away from it. Land in the water and the sharks bite: a 20-second bleed.',
          do: ['Stand close to the bubble before it pops.', 'Pop: a raid cooldown for the hit, and the ice is washed away.', 'Walk back to your spots.'],
          m: { what: 'When the whirlpools reach the bubble it bursts: a raid hit, and everyone is knocked about 20 yards away from it. On Mythic the ice stays where it is. Land in the water and the sharks bite: a 20-second bleed.', do: ['Stand close to the bubble before it pops.', 'Pop: a raid cooldown. Ice behind you? Line up with a Warlock gateway, or cancel the knockback.', 'Walk back to your spots.'] },
          map: (d) => NY_M.pop(false, d) },
      ],
      tiles: [
        { name: 'Abyssal Rain (Healing cooldowns, it ramps)', spell: 'Abyssal Rain', do: 'On the pull, then twice a loop: four raid hits, then a 24-second DoT. She gets 5% stronger with every cast, so later ones need bigger cooldowns.' },
        { only: 'h', name: 'Iceblade Flurry (A defensive, then swap)', spell: 'Iceblade Flurry', do: 'Five ramping hits on her tank. A defensive for the last two, then the other tank taunts.' },
        { name: 'Lingering Frost (Stay off the ice)', spell: 'Lingering Frost', do: 'Each soaked orb leaves ice that hurts every second and makes you slide. Keep it in one place: on Mythic only Water Jet clears it, on Heroic the Pop.' },
        { name: 'Kill order (Murlocs first)', spell: 'Alluring Bubble', do: 'Murlocs before the boss, every set (Mythic: the Frostscale first). Cleave the big pack on her so no damage is lost.', m: { do: 'The Frostscale first, then the big pack on her, then the boss. Cleave the pack on her so no boss damage is lost.' } },
      ] },
    { id: 'burn', only: 'm', name: 'The burn: after the third Pop', sum: 'About 5:40 in, after the third Pop. She enrages after the next whirlpool (about 7:15), so this is the last stretch.',
      mechs: [],
      tiles: [
        { name: 'Enrage (Ignore the murlocs, burn)', spell: 'Unending Tides', do: 'Everyone on the boss. Murlocs can reach the bubble now: their big hit only comes with the next Pop, and that\'s the enrage anyway.' },
        { name: 'Orbs (Keep soaking)', spell: 'Frost Orb', do: 'Keep soaking the orbs: they still go off long before the enrage.' },
      ] },
  ],
  roles: {
    t: ['Walk her to the big pack each set, then back to the quarter.', 'Mythic: Death Knight tank grips the Frostscale out of the pack.', 'Mythic: swap on every Water Jet; sweep it across the ice.', 'Leftover orbs: two each at most.', 'Heroic: Iceblade Flurry: a defensive for the last two hits, then swap.'],
    h: ['Abyssal Rain: four raid hits and a long DoT; she gets 5% stronger every cast.', 'Mythic: every orb soak hits the raid: a cooldown on every set.', 'The Pop: a raid cooldown.'],
    d: ['Murlocs first (Mythic: the Frostscale first), then the boss.', 'Squads: your side pack, then the one at the back.', 'Chilled: big steps in the lane (Mythic) or drop them at the edge (Heroic).', 'Mythic: after the third Pop ignore the murlocs and burn her.'],
  },
};

// ===== Kith'ix (notes/Guides/Bosses/9 Kith'ix (12.1.5).md: Tactyks' Mythic and Normal/Heroic videos read in full, the spell text, our
// Heroic kill 9DRWhKnZbHtQgf4a #43 (3:43) for the spots, and the fastest Mythic kills' clock (4:39) for the whole fight). Yards from Lady
// Liadrin, who stands in the middle of the cave's round platform (about 125 yards across; the game's floor map, there's no RaidPlan
// render of this room), x east, y north. Kith'ix is tanked on the north side; the ranged and healers start on the west side (moon); the
// middle stays empty while adds are up. Liadrin's barrier in the intermissions: about 18 yards round her.
GDZ_ORIGIN["Kith'ix"] = { cx: 0, cy: 1828 }; GDZ_FULL["Kith'ix"] = { x: -2, y: 4, r: 46 };
const KX = "Kith'ix", KX_B = [6, 26], KX_VW = [[-10, -26], [26, -8]], KX_HULK0 = [-24, -10], KX_BR = 18;
// raid markers: soak spots just inside the barrier's edge (circle: the tanks' soaks; moon and triangle: the ranged pairs')
const KX_MK = { moon: [-16, 1.5], circle: [12.5, 12.5], triangle: [16, -1.5] };
// Dark Devastation drop spots 1 to 6 (each leaves a Voidscar): 1, 2, 4 and 5 in the north-east cluster behind circle; 3 out past moon
// (the first intermission) and 6 out past triangle (the second), far enough that the 15-yard hit misses the barrier
const KX_D = [[34, 34], [37, 30], [-33, 2], [32, 29], [35, 25], [33, -2]];
const KX_MEL = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], KX_RNG = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'], KX_HEAL = ['h1', 'h2', 'h3', 'h4'];
// phase one: his tank north of him, melee round his south side, the off tank between him and the ranged, the ranged and healers on the
// west side; nobody in the middle
const KX_HOME = (() => { const H = { t1: [6, 31.5], t2: [-16, 10] };
  [185, 219, 253, 287, 321, 355].forEach((a, i) => { H[KX_MEL[i]] = nzAdd(KX_B, a, 8); }); H.m7 = nzAdd(KX_B, 270, 13.5);
  [165, 177, 189, 201, 213].forEach((a, i) => { H[KX_RNG[i]] = nzAdd([0, 0], a, 30); }); [171, 195].forEach((a, i) => { H[KX_RNG[5 + i]] = nzAdd([0, 0], a, 38); });
  [110, 124, 138, 152].forEach((a, i) => { H[KX_HEAL[i]] = nzAdd([0, 0], a, 26); });
  return H; })();
// the intermissions: everyone inside the barrier, the boss at its north edge with his tank just inside it; nobody near the soak markers
const KX_IB = [0, 10], KX_INT = (() => { const H = { t1: [0, 15], t2: [5.5, 14.5] }, MK = Object.values(KX_MK);
  const keep = (p) => Math.hypot(p[0], p[1]) <= 16.6 && Math.hypot(p[0], p[1]) >= 4.6 && Math.hypot(p[0] - KX_IB[0], p[1] - KX_IB[1]) >= 4.8 && Math.hypot(p[0] - H.t1[0], p[1] - H.t1[1]) >= 4.6 && Math.hypot(p[0] - H.t2[0], p[1] - H.t2[1]) >= 4.6 && MK.every((m) => Math.hypot(p[0] - m[0], p[1] - m[1]) >= 6.6);
  const S = []; for (let i = 0; i < 36; i++) { const q = gdzSpot(i, 36, 16.5); if (keep(q)) S.push(q); }
  const near = (p) => Math.hypot(p[0] - KX_IB[0], p[1] - KX_IB[1]); S.sort((a, b) => near(a) - near(b));
  KX_MEL.concat(KX_HEAL, KX_RNG).forEach((id, i) => { H[id] = S[i]; }); return H; })();
function kxAt(k, t, P, hold, skip) { Object.entries(P).forEach(([id, q]) => { if (skip && skip.includes(id)) return; if (hold != null) k.hold(hold, id); k.at(t, id, q[0], q[1]); }); return k; }
const kxBoss = (k, t, p) => k.boss('kx', KX, t || 0, (p || KX_B)[0], (p || KX_B)[1]);
const kxLia = (k, t) => k.boss('li', 'Lady Liadrin', t || 0, 0, 0);
const kxMarks = (k) => Object.entries(KX_MK).forEach(([m, p]) => k.wmark(m, p[0], p[1]));
const kxBulwark = (k, t0, dur, r) => k.ring({ x: 0, y: 0, r: r || KX_BR, fx: 'zone', t0, dur, color: '#ffd76a', fill: 'rgba(255,215,106,.14)', cn: 'Refulgent Bulwark', legend: 'Liadrin\'s barrier: stay inside it' });
const kxDark = (k, t0, dur) => k.ring({ x: 0, y: 0, r: 80, fx: 'zone', t0, dur, color: '#5a2a8a', fill: 'rgba(40,10,70,.38)', cn: 'Suffocating Darkness', legend: 'Suffocating Darkness: outside the barrier you\'re pacified and take heavy damage' });
const kxScar = (k, p, t0, dur) => k.ring({ x: p[0], y: p[1], r: 4, fx: 'puddle', t0, dur, color: '#8a4dff', fill: 'rgba(110,50,200,.4)', cn: 'Voidscar', legend: 'a Voidscar: it knocks back anyone who touches it' });
const kxHit = (k, p, t, r, cn, legend, color) => k.ring({ x: p[0], y: p[1], r, fx: 'burst', t0: t - 0.3, at: t, dur: 0.7, color: color || '#9b6bff', cn, legend });
const KX_M = {
  // Voidswarm: raid damage, then the adds: two Voidweavers (they stand still and ramp up raid damage), the Venomous Hulk and three Bomber
  // Beetles (four from the second set). Adds near Kith'ix take 75% less damage. The off tank takes the Hulk onto the west Voidweaver, faced
  // out (Venom Roar); the ranged kill that Voidweaver and its eggs. Beetles fixate a player and explode on the first player they touch: a
  // stacking raid DoT, so one at a time. Mythic: the Death Knight slows them (never roots) and grips them one by one into himself by the
  // Hulk, so their egg drops in the cleave. Heroic: root them and one assigned player steps on each in turn. (fail: two popped at once)
  adds(fail, d) {
    const myth = d !== 'h', L = myth ? 17 : 21, k = gdzKit(KX, L); kxBoss(k, 0); kxLia(k, 0); kxAt(k, 0, KX_HOME); kxMarks(k);
    k.cast('kx', 'Voidswarm', 0.2, 2.6); [0.8, 1.6, 2.4].forEach((t) => kxHit(k, [0, 0], t, 70, 'Voidswarm', 'Voidswarm: raid damage, then the adds'));
    KX_VW.forEach((p, i) => k.add('vw' + i, 'Voidweaver', 2.6, p[0], p[1])); k.show('vw0', 2.6, 9.4);
    k.add('hk', 'Venomous Hulk', 2.6, ...KX_HULK0).add('hk', 'Venomous Hulk', 3.4, ...KX_HULK0).add('hk', 'Venomous Hulk', 6.6, -8.5, -27.5);
    k.hold(0.4, 't2').at(6.4, 't2', -11, -32.5); k.call(2.8, 4.6, 'Taunt the Hulk', { on: 't2', color: '#5aa0ff', ink: '#fff' });
    k.cast('hk', 'Venom Roar', 11.4, 13); k.cone({ from: 'hk', to: 't2', at: 13, r: 14, width: 60 }); k.call(13, 14.6, 'Faced out', { on: 't2', color: '#5aa0ff', ink: '#fff' });
    k.call(9.4, 11.2, 'Voidweaver down: eggs', { x: KX_VW[0][0], y: KX_VW[0][1] + 7, color: '#ffd23b', ink: '#1a1405' });
    for (let i = 0; i < (myth ? 3 : 2); i++) { const q = nzAdd(KX_VW[0], 100 + i * 110, 2.6); k.add('ve' + i, 'Mindstinger Egg', 9.4, q[0], q[1]).show('ve' + i, 9.4, 11.8 + i * 0.3); }
    // the beetles: each runs at its target; Mythic: slowed, then gripped one at a time; Heroic: rooted, then stepped on one at a time
    const DK = 'm7', DKS = [-5, -22], STEP = 'r5', V = 6, TG = ['r3', 'h3', 'r6'], B0 = [[14, -14], [8, -22], [20, -20]];
    const pos = (i, t, slowAt, slow) => { const s0 = B0[i], g = KX_HOME[TG[i]], dd = Math.hypot(g[0] - s0[0], g[1] - s0[1]), u = [(g[0] - s0[0]) / dd, (g[1] - s0[1]) / dd]; const tt = Math.max(0, t - 2.6), s = slowAt == null || t <= slowAt ? V * tt : V * (slowAt - 2.6) + slow * (t - slowAt); return [s0[0] + u[0] * s, s0[1] + u[1] * s]; };
    const POP = myth ? [5.3, 9.9, 14.3] : [8.2, 11.6, 15];
    if (myth) { k.hold(0.4, DK).at(5, DK, ...DKS); k.tag(DK, 'Death Knight', 2.8, 15); }
    else k.hold(3, STEP);
    B0.forEach((p0, i) => { const id = 'bb' + i, slowAt = myth ? (i ? 4.2 + (i - 1) * 0.4 : null) : 3.6, slow = myth ? 1.5 : 0, popAt = fail && i ? 7 : POP[i];
      const pre = myth && !(fail && i) ? popAt - 0.3 : popAt, q = fail && i ? pos(1, 7, slowAt, slow).map((v, j) => v + (i === 2 ? (j ? -1.6 : 1.6) : 0)) : pos(i, pre, slowAt, slow);
      k.add(id, 'Bomber Beetle', 2.6, ...p0); if (slowAt != null && slowAt < pre) k.add(id, 'Bomber Beetle', slowAt, ...pos(i, slowAt, slowAt, slow)); k.add(id, 'Bomber Beetle', pre, ...q);
      const at = myth && !(fail && i) ? DKS : q; if (myth && !(fail && i)) { k.add(id, 'Bomber Beetle', popAt, DKS[0] - 1.5, DKS[1] + 0.5); k.call(pre - 0.2, pre + 1.2, 'Grip', { on: DK, color: '#c0394f', ink: '#fff' }); }
      k.show(id, 2.6, popAt); k.link({ from: id, to: TG[i], t0: 2.8, t1: popAt - 0.1, color: '#ff8a3a', dash: true, legend: 'a Bomber Beetle runs at the player it fixates: it explodes on the first player it touches' });
      if (!myth && !fail) { k.at(popAt, STEP, q[0] + 1.2, q[1] - 1.2); }
      k.ring({ on: fail && i ? 'r3' : myth ? DK : STEP, r: 4, fx: 'burst', t0: popAt - 0.3, at: popAt, dur: 0.7, color: '#9b6bff', cn: 'Gut Reaction', legend: 'a beetle explodes on the player it touches' }); if (!(fail && i === 2)) kxHit(k, [0, 0], popAt + 0.15, 70, 'Digestive Juices', 'Digestive Juices: a stacking raid DoT from every beetle that explodes', '#9ff26d');
      if (myth) { const eg = fail && i ? [at[0] + 3.5, at[1] + 2.5] : [at[0] - 2.5 - i * 0.6, at[1] - 3.6 + i * 0.6]; k.add('be' + i, 'Mindstinger Egg', popAt, eg[0], eg[1]).show('be' + i, popAt, popAt + 2.6); } });
    if (myth) { const p = pos(1, 4.2, 4.2, 1.5); k.ring({ x: p[0], y: p[1], r: 6, fx: 'puddle', t0: 4.2, dur: 5.4, color: '#c0394f', fill: 'rgba(160,40,60,.25)', cn: 'Death and Decay', legend: 'the Death Knight slows them (never a root: they get gripped)' }); k.call(4.6, 6.4, 'Chains of Ice', { x: B0[2][0], y: B0[2][1] - 6, color: '#c0394f', ink: '#fff' }); }
    else { [0, 1, 2].forEach((i) => { const p = pos(i, 3.6, 3.6, 0); kxHit(k, p, 3.6, 5, 'AoE root', 'Heroic: root the beetles where they are', '#7fd8ff'); }); k.call(3.8, 5.6, 'Rooted', { x: 4, y: -26, color: '#7fd8ff', ink: '#06131c' }); }
    if (fail) { k.hold(4.4, 'r3').at(7, 'r3', ...pos(1, 7, myth ? 4.2 : 3.6, myth ? 1.5 : 0)); k.call(7, 9, 'Two at once', { on: 'r3', color: '#ff3b3b', ink: '#fff' });
      gdzFailBlast(k, 7.4, '2 stacks on everyone' + (myth ? ': a third is death' : ''), -18, 30, [], 'Digestive Juices ×2'); k.step(0.2).step(2.6).step(7);
      k.pause(7.5, 'This ranged cut through the middle and ran into two beetles at once. Two explosions together: two stacks of Digestive Juices on the whole raid' + (myth ? ', and on Mythic a third one kills.' : '.'), { on: 'r3', r: 8 });
      return k.done({ title: 'Mistake: two beetles at once', focus: { x: -6, y: -6, r: 32 } }); }
    if (!myth) k.hold(15.2, STEP).at(L - 0.4, STEP, ...KX_HOME[STEP]);
    k.ring1(myth ? ['t2', DK] : ['t2', STEP]).step(0.2).step(2.6).step(myth ? 5.3 : 8.2).step(9.4).step(11.4);
    k.pause(myth ? 5.6 : 8.5, myth ? 'The Hulk is on the west Voidweaver, faced out. The Death Knight slows the beetles and grips them in one at a time, so each egg lands in the cleave.' : 'The Hulk is on the west Voidweaver, faced out. The beetles are rooted, and one player steps on them one at a time.', { x: -16, y: -14, r: 14 });
    return k.done({ title: 'Voidswarm: the adds away from him, beetles one at a time', focus: { x: -6, y: -4, r: 34 }, hlLabel: myth ? 'the off tank and the Death Knight' : 'the off tank and the beetle stepper' });
  },
  // Extinguish: an 8-second cast, then a huge shadow hit on everyone. Liadrin throws Light's Embrace orbs toward the Hulk (or a Voidweaver,
  // or him): each player runs over one (90% less shadow damage for 8 seconds). So the Hulk goes to where the raid is first. The tanks swap
  // while he casts: he stands still. (o.int: in the intermission, the orbs land by him inside the barrier; fail: one player has no orb)
  extinguish(fail, d, o) {
    o = o || {}; const myth = d !== 'h', inn = !!o.int, L = inn ? 13 : 15, k = gdzKit(KX, L); kxLia(k, 0); kxMarks(k);
    let P, tgt; if (inn) { kxBoss(k, 0, KX_IB); kxBulwark(k, 0, L); kxDark(k, 0, L); P = KX_INT; tgt = KX_IB; }
    else { kxBoss(k, 0); const VW = KX_VW[1]; k.add('vw1', 'Voidweaver', 0, ...VW); k.add('hk', 'Venomous Hulk', 0, VW[0] + 2, VW[1] - 1.5); tgt = VW;
      P = { ...KX_HOME, t2: [31, -13] }; KX_RNG.concat(KX_HEAL).forEach((id, i) => { P[id] = nzAdd(VW, 105 + i * (150 / 10), i % 2 ? 15 : 10.5); }); }
    kxAt(k, 0, P); k.cast('li', 'Light\'s Embrace', 0.2, 0.8); k.cast('kx', 'Extinguish', 1, 9);
    // the orbs: a fan from Liadrin toward the Hulk (in the intermission, toward him inside the barrier); each player takes the nearest free one
    const ids = Object.keys(P), O = [], u = inn ? [1, 0] : nzU(Math.atan2(tgt[1], tgt[0]) * 180 / Math.PI), nv = [-u[1], u[0]], C0 = inn ? [0, -12] : nzAdd([0, 0], Math.atan2(tgt[1], tgt[0]) * 180 / Math.PI, 7), NO = inn ? [[0, 0], KX_IB, [0, 15], [5.5, 14.5]] : [[0, 0], tgt, [tgt[0] + 2, tgt[1] - 1.5]];
    for (let row = 0; O.length < ids.length + 2 && row < 12; row++) for (let col = 0; col < 5; col++) { const q = inn ? [C0[0] + (col - 2) * 5, C0[1] + row * 5] : [C0[0] + u[0] * row * 5 + nv[0] * (col - 2) * 5, C0[1] + u[1] * row * 5 + nv[1] * (col - 2) * 5]; if (inn && Math.hypot(q[0], q[1]) > 16.5) continue; if (NO.some((z) => Math.hypot(q[0] - z[0], q[1] - z[1]) < 4.6)) continue; O.push(q); }
    const SKIP = fail ? 'r5' : null, free = O.map((q) => !(SKIP && Math.hypot(q[0] - P[SKIP][0], q[1] - P[SKIP][1]) < 5));
    ids.forEach((id) => { if (id === SKIP) return; const p = P[id]; let b = -1, bd = 1e9; O.forEach((q, j) => { if (!free[j]) return; const dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd < bd) { bd = dd; b = j; } }); free[b] = false; const q = O[b], tp = Math.min(7.6, 1.4 + bd / 6.5);
      k.ring({ x: q[0], y: q[1], r: 1.2, fx: 'zone', t0: 0.8, dur: tp - 0.8, color: '#ffe9a0', fill: 'rgba(255,225,130,.9)', cn: 'Light\'s Embrace', legend: 'a Light\'s Embrace orb: run over it for 90% less shadow damage' });
      k.hold(1, id).at(tp, id, q[0], q[1]); k.ring({ on: id, r: 2.2, fx: 'debuff', t0: tp, dur: L - tp, color: '#ffd76a', cn: 'Light\'s Embrace', legend: 'Light\'s Embrace: 90% less shadow damage for 8 seconds' }); if (!inn) k.hold(9.6, id).at(L - 0.4, id, ...(id === 't1' ? [31, -13] : id === 't2' ? [6, 31.5] : P[id])); });
    O.forEach((q, j) => { if (free[j]) k.ring({ x: q[0], y: q[1], r: 1.2, fx: 'zone', t0: 0.8, dur: 9, color: '#ffe9a0', fill: 'rgba(255,225,130,.9)', cn: 'Light\'s Embrace', legend: 'a Light\'s Embrace orb: run over it for 90% less shadow damage' }); });
    kxHit(k, [0, 0], 9, 75, 'Extinguish', 'Extinguish: a huge shadow hit on everyone', '#7a3dff');
    if (!inn) { k.call(1.2, 3, 'He stands still: swap', { x: KX_B[0] + 6, y: KX_B[1] + 8, color: '#5aa0ff', ink: '#fff' }); k.call(9.4, 11, 'Taunt the Hulk', { on: 't1', color: '#5aa0ff', ink: '#fff' }); k.call(9.6, 11.2, 'Taunt', { on: 't2', color: '#5aa0ff', ink: '#fff' }); }
    if (fail) { k.oops('r5', 9.2); k.call(9.1, 11, myth ? 'No orb: dead' : 'No orb: nearly dead', { on: 'r5', color: '#ff3b3b', ink: '#fff' }); k.step(0.2).step(1).step(9);
      k.pause(9.4, 'This ranged never picked up an orb. Extinguish lands at full strength: ' + (myth ? 'dead.' : 'without a big defensive, dead.'), { on: 'r5', r: 8 });
      return k.done({ title: 'Mistake: no orb for Extinguish', focus: inn ? { x: 0, y: 2, r: 22 } : { x: 14, y: -2, r: 30 } }); }
    k.ring1(inn ? [] : ['t1', 't2']).step(0.2).step(1).step(9);
    k.pause(5.8, inn ? 'Inside the barrier the orbs land near him: one each, then the hit.' : 'The Hulk is with the raid on the east Voidweaver, so the orbs land right here. One orb each, then Extinguish.', { x: tgt[0] * 0.55, y: tgt[1] * 0.55, r: 14 });
    return k.done({ title: 'Extinguish: an orb for everyone', focus: inn ? { x: 0, y: 2, r: 22 } : { x: 14, y: -2, r: 30 }, full: inn ? { x: 0, y: 2, r: 24 } : null, hlLabel: inn ? '' : 'the tanks, who swap while he casts' });
  },
  // Unspeakable Horrors: a few players (a healer, a melee, a ranged) get 6 seconds, then they're feared in place (Overwhelming Fear).
  // Dispelling it lets out a scream that hurts everyone, less the further away you are. So they run out first (Mythic: healer to skull,
  // melee to star, ranged to cross) and get dispelled one at a time, the healer first. (o.int: inside the barrier there's no room: raid
  // cooldowns; fail: two dispelled at once inside the raid)
  fear(fail, d, o) {
    o = o || {}; const inn = !!o.int, L = inn ? 16 : 18, k = gdzKit(KX, L), TG = [['h3', 'skull', 'h1'], ['m4', 'star', 'h2'], ['r3', 'cross', 'h4']]; kxLia(k, 0);
    const P = inn ? KX_INT : KX_HOME, MK = inn ? { skull: KX_INT.h3, star: KX_INT.m4, cross: KX_INT.r3 } : { skull: [-32, 36], star: [28, 40], cross: [-44, -24] };
    if (inn) { kxBoss(k, 0, KX_IB); kxBulwark(k, 0, L); kxDark(k, 0, L); } else kxBoss(k, 0);
    kxAt(k, 0, P); Object.entries(MK).forEach(([m, p]) => k.wmark(m, p[0], p[1]));
    k.cast('kx', 'Unspeakable Horrors', 0.2, 0.4);
    TG.forEach(([id, m], i) => { k.ring({ on: id, r: 2.6, fx: 'debuff', t0: 0.4, dur: 6, color: '#b06bff', cn: 'Unspeakable Horrors', legend: 'Unspeakable Horrors: in 6 seconds you\'re feared in place' });
      if (!fail && !inn) { const q = MK[m]; k.hold(0.6, id).at(5.6, id, q[0] + 1.6, q[1] - 1.6); } });
    const DS = fail ? [7, 7, 13] : [7, 10.4, 13.8];
    TG.forEach(([id, , hl], i) => { k.ring({ on: id, r: 3, fx: 'debuff', t0: 6.4, dur: DS[i] - 6.4, color: '#7a3dff', cn: 'Overwhelming Fear', legend: 'Overwhelming Fear: stuck until a healer dispels it' });
      k.call(DS[i] - 0.4, DS[i] + 1, 'Dispel', { on: hl, color: '#45d16b', ink: '#04140a' }); k.ring({ on: id, r: inn || fail ? 40 : 15, fx: 'burst', t0: DS[i] - 0.3, at: DS[i], dur: 0.7, color: '#b06bff', cn: 'Scream', legend: 'the scream when it\'s dispelled: less damage the further away you are' });
      if (!fail && !inn) k.hold(DS[i] + 0.4, id).at(Math.min(L - 0.2, DS[i] + 3.4), id, ...P[id]); });
    if (inn) k.call(6.6, 9.4, 'Raid cooldowns', { x: -12, y: 18, color: '#45d16b', ink: '#04140a' });
    if (fail) { gdzFailBlast(k, 7.3, 'Two screams in the raid', -16, 34, ['h4', 'r7'], 'Scream ×2'); k.step(0.2).step(6.4).step(7);
      k.pause(7.6, 'They stayed in the raid and two were dispelled at once: two screams at full strength on everyone around them.', { x: -18, y: 6, r: 22 });
      return k.done({ title: 'Mistake: two dispels at once, in the raid', focus: { x: -6, y: 8, r: 36 }, badLabel: 'dies to the screams' }); }
    k.ring1(TG.map(([id]) => id).concat(TG.map(([, , h]) => h))).step(0.2).step(0.6).step(7).step(10.4);
    k.pause(6.2, inn ? 'Each goes to their marker inside the barrier: healer skull, melee star, ranged cross. The healer is dispelled first, then the others one at a time, with raid cooldowns.' : 'Each runs out to their marker: healer skull, melee star, ranged cross. Then one dispel at a time, the healer first, letting the raid heal up in between.', { x: -4, y: 10, r: inn ? 16 : 36 });
    return k.done({ title: inn ? 'Unspeakable Horrors: to the markers, one dispel at a time' : 'Unspeakable Horrors: run out, one dispel at a time', focus: inn ? { x: 0, y: 2, r: 22 } : { x: -6, y: 8, r: 40 }, full: inn ? { x: 0, y: 2, r: 24 } : { x: -6, y: 8, r: 46 }, hlLabel: 'the feared players and their healers' });
  },
  // Dark Devastation: a 15-yard circle on his tank: they take it out to the next drop spot with a defensive, and the other tank taunts
  // (+150% damage taken). Heroic and up it leaves a Voidscar there, which sends Eclipse Fragments in the intermission, so the drop spots
  // are planned: 1, 2, 4 and 5 together in the north-east, 3 and 6 just outside the barrier in each intermission. (o.n: which drop, o.int:
  // during the intermission; fail: the tank stays: the circle hits the melee and the Voidscar ends up under the boss)
  devastation(fail, d, o) {
    o = o || {}; const n = o.n != null ? o.n : 0, inn = !!o.int, L = 11, k = gdzKit(KX, L), D = KX_D[n]; kxLia(k, 0); kxMarks(k);
    const P = inn ? KX_INT : KX_HOME, B = inn ? KX_IB : KX_B; kxBoss(k, 0, B); kxAt(k, 0, P); if (inn) { kxBulwark(k, 0, L); kxDark(k, 0, L); }
    KX_D.slice(0, n).forEach((p) => kxScar(k, p, 0, L));
    k.cast('kx', 'Dark Devastation', 0.4, 4.4); k.ring({ on: 't1', r: 15, fx: 'debuff', t0: 0.4, dur: 4, color: '#9b6bff', cn: 'Dark Devastation', legend: 'Dark Devastation: a 15-yard hit round the tank' });
    const at = fail ? P.t1 : D; if (!fail) { k.hold(0.4, 't1').at(4.2, 't1', D[0] - 1.2, D[1] - 1.2); k.call(1, 3, 'Defensive', { on: 't1', color: '#5aa0ff', ink: '#fff' }); }
    k.ring({ on: 't1', r: 15, fx: 'burst', t0: 4.1, at: 4.4, dur: 0.7, color: '#9b6bff', cn: 'Dark Devastation', legend: 'Dark Devastation: a 15-yard hit round the tank' }); kxScar(k, at, 4.6, L - 4.6);
    k.call(4.8, 6.4, 'Taunt', { on: 't2', color: '#5aa0ff', ink: '#fff' }); const T2 = inn ? P.t1 : [6, 31.5];
    if (!fail) { k.hold(4.8, 't2').at(inn ? 6 : 9, 't2', T2[0], T2[1]); k.hold(4.8, 't1').at(inn ? L - 0.4 : 9, 't1', ...(inn ? P.t2 : [14, 33])); }
    k.call(4.8, 7, 'Drop ' + (n + 1), { x: D[0], y: D[1] + 6, color: '#b06bff', ink: '#fff' });
    if (fail) { ['m1', 'm3', 'm4', 'm5'].forEach((id, i) => ulHit(k, id, 4.5 + i * 0.1, 'Hit')); k.step(0.4).step(4.4).step(5);
      k.pause(5.2, 'His tank stayed put: the circle hit the melee, and the Voidscar is now under the boss, knocking back anyone who touches it.', { x: B[0], y: B[1], r: 16 });
      return k.done({ title: 'Mistake: Dark Devastation on the melee', focus: { x: B[0], y: B[1] - 2, r: 22 } }); }
    k.ring1(['t1', 't2']).step(0.4).step(1).step(4.4).step(4.8);
    k.pause(3.6, 'His tank takes the circle out to drop spot ' + (n + 1) + ' with a defensive. The Voidscar it leaves stays there for the intermission.', { x: D[0], y: D[1], r: 15 });
    return k.done({ title: 'Dark Devastation: out to the drop spot, swap', focus: inn ? { x: -6, y: 4, r: 26 } : { x: 18, y: 26, r: 26 }, full: inn ? { x: -4, y: 4, r: 28 } : { x: 14, y: 22, r: 30 }, hlLabel: 'the tanks' });
  },
  // Suffocating Darkness: at 100 energy darkness fills the room (outside the barrier: pacified, heavy damage). Liadrin puts up her barrier:
  // everyone inside, still doing his other mechanics in less room. Abyssal Grasp: a heal absorb that drags a few players toward the dark;
  // clear it within 8 seconds (healthstone, potion, healing) or they're flung out into it. (fail: one absorb not cleared)
  suffocate(fail, d) {
    const myth = d !== 'h', L = fail ? 19 : 15, k = gdzKit(KX, L); kxLia(k, 0); kxMarks(k);
    kxBoss(k, 0); kxBoss(k, 0.6); kxBoss(k, 5, KX_IB); kxAt(k, 0, KX_HOME); k.cast('kx', 'Suffocating Darkness', 0.4, 5.4); k.cast('li', 'Refulgent Bulwark', 0.4, 1.4);
    kxBulwark(k, 1.4, L); kxDark(k, 5.4, L); kxAt(k, 5.2, KX_INT, 0.6); k.call(1.4, 4.6, 'Everyone inside', { x: -2, y: -22, color: '#ffd76a', ink: '#1a1405' });
    const GR = ['r2', 'h4', 'm6', 'r7'], FL = fail ? 'r7' : null;
    GR.forEach((id) => { const p = KX_INT[id], r = Math.hypot(p[0], p[1]) || 1, e = [p[0] / r * 30, p[1] / r * 30]; const t1 = id === FL ? 16.6 : 11.6 + GR.indexOf(id) * 0.3;
      k.link({ from: id, toYd: { x: e[0], y: e[1] }, t0: 8, t1, color: '#7a3dff', legend: 'Abyssal Grasp: a heal absorb pulling you toward the dark' }); k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 8, dur: t1 - 8, color: '#7a3dff', cn: 'Abyssal Grasp', legend: 'Abyssal Grasp: clear the absorb within 8 seconds' });
      if (id !== FL) k.call(9, 10.8, GR.indexOf(id) % 2 ? 'Potion' : 'Healthstone', { on: id, color: '#45d16b', ink: '#04140a' }); });
    if (myth) k.call(8.4, 11.4, 'Raid cooldowns', { x: -14, y: 18, color: '#45d16b', ink: '#04140a' });
    if (fail) { const p = KX_INT.r7, r = Math.hypot(p[0], p[1]), e = [p[0] / r * 30, p[1] / r * 30]; k.hold(16, 'r7').at(16.6, 'r7', e[0], e[1]); k.call(16.6, 18.4, 'Flung into the dark', { on: 'r7', color: '#ff3b3b', ink: '#fff' }); k.oops('r7', 17.6);
      k.step(0.4).step(8).step(16.6); k.pause(17, 'Nobody cleared this absorb: after 8 seconds the player is flung into the darkness, pacified and dying.', { x: e[0], y: e[1], r: 9 });
      return k.done({ title: 'Mistake: Abyssal Grasp not cleared', focus: { x: 0, y: 2, r: 34 }, badLabel: 'flung into the dark' }); }
    k.ring1(GR).step(0.4).step(5.4).step(8).step(9);
    k.pause(6, 'Darkness everywhere but Liadrin\'s barrier: everyone inside, the boss at its north edge.', { x: 0, y: 0, r: 18 });
    return k.done({ title: 'Suffocating Darkness: inside the barrier', focus: { x: 0, y: 2, r: 30 }, full: { x: 0, y: 2, r: 34 }, hlLabel: 'the players with Abyssal Grasp' });
  },
  // Eclipse Fragments (Heroic and up): in the intermission every Voidscar sends a fragment floating toward Liadrin every 8 seconds (five
  // each). Soak them at the barrier's edge: a stacking DoT on you and anyone near (Mythic: 6 yards for 10 seconds, so no solo soaks). A
  // fragment that reaches her: a raid DoT and a smaller barrier. The tank without the debuff takes the north-east cluster at circle; two
  // ranged take turns at moon (first intermission) or triangle (second). (o.tri: the second intermission; fail: nobody at moon)
  fragments(fail, d, o) {
    o = o || {}; const myth = d !== 'h', tri = !!o.tri, L = fail ? 10 : tri ? 20 : 18, k = gdzKit(KX, L), V = 5; kxLia(k, 0); kxMarks(k); kxBoss(k, 0, KX_IB); kxAt(k, 0, KX_INT); kxDark(k, 0, L);
    const NE = tri ? [KX_D[0], KX_D[1], KX_D[3], KX_D[4]] : [KX_D[0], KX_D[1]], SIDE = tri ? KX_D[5] : KX_D[2], SM = tri ? KX_MK.triangle : KX_MK.moon;
    NE.concat([SIDE]).forEach((p) => kxScar(k, p, 0, L)); KX_D.slice(0, tri ? 6 : 3).forEach((p) => { if (!NE.includes(p) && p !== SIDE) kxScar(k, p, 0, L); });
    const SPL = myth ? 6 : 3, DOT = myth ? 10 : 6; let fi = 0;
    const frag = (from, t0, soak, who) => { const id = 'ef' + (fi++), r0 = Math.hypot(from[0], from[1]), u = [-from[0] / r0, -from[1] / r0], stopR = soak ? Math.max(0, Math.hypot(soak[0], soak[1])) : 0, t1 = t0 + (r0 - stopR) / V;
      k.add(id, 'Eclipse Fragment', t0, from[0], from[1]).add(id, 'Eclipse Fragment', t1, from[0] + u[0] * (r0 - stopR), from[1] + u[1] * (r0 - stopR)).show(id, t0, t1);
      k.ring({ on: id, r: 1.4, fx: 'zone', t0, dur: t1 - t0, color: '#c084ff', fill: 'rgba(170,100,255,.7)', cn: 'Eclipse Fragment', legend: 'an Eclipse Fragment floating to Liadrin: soak it before it reaches her' });
      if (who) { k.ring({ on: who, r: SPL, fx: 'burst', t0: t1 - 0.3, at: t1, dur: 0.7, color: '#c084ff', cn: 'Eclipse Fragment', legend: (myth ? 'Mythic: ' : '') + 'a soaked fragment: a DoT on the soaker and anyone within ' + SPL + ' yards' }); k.ring({ on: who, r: 2.4, fx: 'debuff', t0: t1, dur: DOT, color: '#c084ff', cn: 'Eclipse Fragment', legend: 'a stacking DoT from a soaked fragment' }); }
      return t1; };
    // the north-east soaks: the tank without the debuff at circle (second intermission: the other tank takes the second pair)
    const C = KX_MK.circle; k.hold(0.4, 't2').at(2.6, 't2', C[0], C[1]);
    [1.5, 9.5].forEach((t0, w) => { let ta = 0, tb = 0; NE.forEach((p, j) => { const pair = tri && j > 1, t = frag(p, t0 + (pair ? 2.4 : 0), C, pair ? 't1' : 't2'); if (pair) tb = t; else ta = Math.max(ta, t); });
      if (tri) { k.hold(ta + 0.2, 't2').at(ta + 1.6, 't2', ...KX_INT.t2); k.hold(ta, 't1').at(tb - 0.1, 't1', C[0], C[1]).hold(tb + 0.2, 't1').at(tb + 1.8, 't1', ...KX_INT.t1); if (!w) k.hold(tb + 1.8, 't2').at(9.5 + 6, 't2', C[0], C[1]); } });
    // the side scar: two ranged take turns at moon (or triangle)
    const PR = ['r1', 'r2'], spot = (i) => [SM[0] + (i ? 2.2 : -2.2) * (tri ? 1 : 0) , SM[1] + (i ? 2.2 : -2.2) * (tri ? 0 : 1)];
    if (!fail) { k.hold(0.4, PR[0]).at(2.6, PR[0], ...SM); const ta = frag(SIDE, 1.5, SM, PR[0]);
      k.hold(ta + 0.2, PR[0]).at(ta + 2.6, PR[0], ...KX_INT[PR[0]]); k.hold(ta + 0.6, PR[1]).at(ta + 3, PR[1], ...SM); const tb = frag(SIDE, 9.5, SM, PR[1]); k.hold(tb + 0.2, PR[1]).at(Math.min(L - 0.2, tb + 2.6), PR[1], ...KX_INT[PR[1]]);
      k.call(ta + 0.3, ta + 2, 'Swap', { on: PR[1], color: '#f2b33a', ink: '#1a1003' }); }
    kxBulwark(k, 0, fail ? 5.9 : L);
    if (fail) { const tr = frag(SIDE, 1.5, null, null); kxBulwark(k, tr, L - tr, 14.5); gdzFailBlast(k, tr, 'It reached her: a raid DoT, and a smaller barrier', -18, 22, [], 'Eclipse Fragment');
      k.step(0.2).step(1.5).step(tr); k.pause(tr + 0.4, 'Nobody stood at ' + (tri ? 'triangle' : 'moon') + '. The fragment floated all the way to Liadrin: a DoT on the whole raid, and her barrier shrinks for the rest of the intermission.', { x: SM[0], y: SM[1], r: 10 });
      return k.done({ title: 'Mistake: a fragment reached Liadrin', focus: { x: 4, y: 6, r: 40 } }); }
    k.ring1(['t2', 'r1', 'r2'].concat(tri ? ['t1'] : [])).step(0.2).step(1.6).step(7.5);
    k.pause(7.6, 'The tank without the debuff catches the north-east fragments together at circle. Two ranged take turns at ' + (tri ? 'triangle' : 'moon') + ': ' + (myth ? 'on Mythic nobody soaks one alone.' : 'one each.'), { x: 6, y: 8, r: 24 });
    return k.done({ title: 'Eclipse Fragments: caught at the barrier\'s edge', focus: { x: 6, y: 8, r: 40 }, full: { x: 6, y: 8, r: 44 }, hlLabel: 'the soakers' });
  },
  // Null Gate (phase two): a melee, a healer and a ranged (Mythic: two ranged) get 5 seconds, then a 5-yard hit and a gate where they stand
  // that sprays Nullshards for the rest of the fight (each a Nullify stack; Mythic: 3 stacks kills, Heroic 5). The boss stays put; each role
  // drops theirs at its own spot: melee off to his side, ranged at the far east side (through a Warlock gateway), healers to the west.
  // (fail: a ranged drops theirs in the ranged group)
  gates(fail, d) {
    const myth = d !== 'h', L = 15, k = gdzKit(KX, L); kxLia(k, 0); kxBoss(k, 0); kxAt(k, 0, { ...KX_HOME, t2: [14, 30] });
    k.ring({ on: 'kx', r: 4, fx: 'zone', t0: 0, dur: L, color: '#ffd76a', fill: 'rgba(255,215,106,.12)', cn: 'Luminous Grace', legend: 'Luminous Grace: 50% more damage and healing for the raid' });
    const T = myth ? [['m3', [-12, 38]], ['h2', [-42, 22]], ['r2', [26, 6]], ['r6', [30, 14]]] : [['m3', [-12, 38]], ['h2', [-42, 22]], ['r2', [26, 6]]];
    const GA = [-26, -4], GB = [22, -4]; k.ring({ x: GA[0], y: GA[1], r: 1.8, fx: 'zone', t0: 0, dur: 6, color: '#c084ff', fill: 'rgba(160,90,255,.45)', cn: 'Demonic Gateway', legend: 'a Warlock gateway to the far side' }); k.ring({ x: GB[0], y: GB[1], r: 1.8, fx: 'zone', t0: 0, dur: 6, color: '#c084ff', fill: 'rgba(160,90,255,.45)', cn: 'Demonic Gateway', legend: 'a Warlock gateway to the far side' });
    k.cast('kx', 'Null Gate', 0.2, 0.4);
    T.forEach(([id, q], i) => { k.ring({ on: id, r: 5, fx: 'debuff', t0: 0.4, dur: 5, color: '#c084ff', cn: 'Null Gate', legend: 'Null Gate: in 5 seconds a 5-yard hit, and a gate opens where you stand' });
      const at = fail && id === 'r2' ? KX_HOME.r2 : q; if (!(fail && id === 'r2')) { if (id[0] === 'r') { k.hold(0.4, id).at(2.4, id, GA[0] + (i % 2 ? 1.5 : -1.5), GA[1]).at(2.5, id, GB[0], GB[1] + (i % 2 ? 1.5 : -1.5)).at(5.2, id, q[0], q[1]); k.call(2.3, 3.6, 'Gateway', { on: id, color: '#c084ff', ink: '#14062a' }); } else k.hold(0.6, id).at(5.2, id, q[0], q[1]); }
      k.ring({ on: id, r: 5, fx: 'burst', t0: 5.1, at: 5.4, dur: 0.7, color: '#c084ff', cn: 'Null Gate', legend: 'Null Gate: a 5-yard hit as it opens' });
      k.ring({ x: at[0], y: at[1], r: 2.6, fx: 'zone', t0: 5.4, dur: L - 5.4, color: '#7a3dff', fill: 'rgba(90,40,170,.55)', cn: 'Null Gate (open)', legend: 'an open Null Gate: it sprays Nullshards' });
      // its shards fly out away from the raid
      const away = Math.atan2(at[1] - 8, at[0] + 4) * 180 / Math.PI; [6.2, 8.4, 10.6, 12.8].forEach((t, j) => { const a = away + (j % 2 ? 22 : -22) + (fail && id === 'r2' ? 180 : 0), e = nzAdd(at, a, 13), sid = 'ns' + i + j; k.obj(sid, 'porb', t, at[0], at[1]).obj(sid, 'porb', t + 2, e[0], e[1]).show(sid, t, t + 2); });
      if (!(fail && id === 'r2')) k.hold(5.6, id).at(id[0] === 'r' ? L - 0.4 : 9.6, id, ...(id[0] === 'r' ? [q[0] - 8, q[1] - 10] : KX_HOME[id])); });
    if (fail) { ['r1', 'r3'].forEach((id) => { ulHit(k, id, 5.5, 'Nullify +1'); }); ulHit(k, 'r4', 8.4, 'Nullify +1'); ulHit(k, 'r3', 10.6, 'Nullify +2'); if (myth) k.oops('r3', 12.8);
      k.step(0.2).step(0.6).step(5.4); k.pause(6, 'This ranged dropped their gate where they stood, in the ranged group: the hit and then the shards go through everyone around them.', { on: 'r2', r: 9 });
      return k.done({ title: 'Mistake: a gate in the ranged group', focus: { x: -6, y: 8, r: 46 } }); }
    k.ring1(T.map(([id]) => id)).step(0.2).step(0.6).step(5.4).step(6.2);
    k.pause(5, 'Each role drops its gate at its own spot: melee off to his side, healers west, ranged through the gateway to the far east side.', { x: -2, y: 10, r: 34 });
    return k.done({ title: 'Null Gate: each role to its spot', focus: { x: -2, y: 10, r: 46 }, full: { x: -2, y: 8, r: 48 }, hlLabel: 'the players with Null Gate' });
  },
  // Negation (phase two tank mechanic): his tank takes 100% more physical damage but moves 100% faster and shards can't touch them; after 8
  // seconds (12 on Mythic) it kills them unless they've run into a Null Gate (Mythic: three). Each one hits the tank hard (Explosive Restabilization) and
  // clears gates and shards within 10 yards. Defensive, run, and the other tank taunts at once. (fail: too few gates in time)
  negation(fail, d) {
    const myth = d !== 'h', N = myth ? 12 : 8, TD = 2.4 + N, L = TD + 1.6, k = gdzKit(KX, L); kxLia(k, 0); kxBoss(k, 0); kxAt(k, 0, { ...KX_HOME, t2: [14, 30] }); /* (N: Negation's length, TD: when it kills) */
    const G = { m: [-12, 38], h: [-42, 22], r1: [26, 6], r2: [30, 14] }; Object.entries(G).forEach(([g, p]) => k.ring({ x: p[0], y: p[1], r: 2.6, fx: 'zone', t0: 0, dur: L, color: '#7a3dff', fill: 'rgba(90,40,170,.55)', cn: 'Null Gate (open)', legend: 'an open Null Gate: it sprays Nullshards' }));
    k.cast('kx', 'Negation', 0.4, 2.4); k.ring({ on: 't1', r: 2.6, fx: 'debuff', t0: 2.4, dur: N, color: '#ffd76a', cn: 'Negation', legend: 'Negation: ' + N + ' seconds to run into ' + (myth ? 'three Null Gates' : 'a Null Gate') + ', or it kills you' });
    k.call(2.6, 4.2, 'Taunt', { on: 't2', color: '#5aa0ff', ink: '#fff' }); k.hold(2.6, 't2').at(4, 't2', 6, 31.5); k.call(2.6, 4.4, 'Defensive', { x: 0, y: 44, color: '#5aa0ff', ink: '#fff' });
    const RT = myth ? (fail ? [['m', 5], ['r2', 9.6]] : [['m', 5], ['r2', 9.2], ['r1', 10.2]]) : (fail ? [] : [['m', 5]]); k.hold(2.4, 't1');
    RT.forEach(([g, t]) => { const p = G[g]; k.at(t, 't1', p[0] + 1, p[1] - 1); k.ring({ on: 't1', r: 10, fx: 'burst', t0: t - 0.3, at: t, dur: 0.7, color: '#ffd76a', cn: 'Explosive Restabilization', legend: 'a big hit on the tank; it clears gates and shards within 10 yards' }); });
    if (!myth && fail) k.at(TD, 't1', -2, 36);
    if (fail) { k.oops('t1', TD + 0.1); k.call(TD, TD + 1.6, myth ? 'Only 2 gates: dead' : 'Too late: dead', { on: 't1', color: '#ff3b3b', ink: '#fff' }); k.step(0.4).step(2.4).step(TD);
      k.pause(TD + 0.4, myth ? 'On Mythic Negation needs three gates. This tank got two before the 12 seconds ran out, and it killed them.' : 'This tank waited too long: the 8 seconds ran out before they reached a gate.', { on: 't1', r: 8 });
      return k.done({ title: 'Mistake: Negation runs out', focus: { x: 8, y: 22, r: 36 } }); }
    k.ring1(['t1', 't2']).step(0.4).step(2.6).step(5);
    k.pause(5.3, myth ? 'Through the melee gate, then the two ranged gates: three in 12 seconds, with a defensive. The other tank already has him.' : 'A defensive and straight into the melee gate. The other tank already has him.', { x: 8, y: 26, r: 30 });
    return k.done({ title: 'Negation: into the gates in time', focus: { x: 8, y: 22, r: 36 }, full: { x: 6, y: 18, r: 40 }, hlLabel: 'the tanks' });
  },
};
const KX_FAIL = {
  adds: { name: 'Two beetles at once', what: 'A player runs through the middle and touches two Bomber Beetles together: two stacks of Digestive Juices on the whole raid at once.', do: ['The adds come out.', 'Beetles slowed in the middle.', 'Two at once: two stacks.'], map: (d) => KX_M.adds(true, d) },
  extinguish: { name: 'No orb for Extinguish', what: 'A player never picks up a Light\'s Embrace orb and takes Extinguish at full strength.', do: ['The orbs land.', 'Extinguish casts.', 'No orb: the full hit.'], map: (d) => KX_M.extinguish(true, d) },
  fear: { name: 'Two dispels at once, in the raid', what: 'The feared players stay in the raid and two are dispelled together: two screams at full strength on everyone around them.', do: ['Three players marked.', 'They stay in the raid.', 'Two screams at once.'], map: (d) => KX_M.fear(true, d) },
  devastation: { name: 'Dark Devastation on the melee', what: 'His tank doesn\'t move: the 15-yard circle hits the melee, and the Voidscar lands under the boss.', do: ['The circle goes on the tank.', 'It lands on the melee.', 'A Voidscar under the boss.'], map: (d) => KX_M.devastation(true, d) },
  suffocate: { name: 'Abyssal Grasp not cleared', what: 'Nobody clears one heal absorb in time: after 8 seconds the player is flung into the darkness.', do: ['Everyone inside.', 'Abyssal Grasp on four players.', 'One flung into the dark.'], map: (d) => KX_M.suffocate(true, d) },
  fragments: { name: 'A fragment reached Liadrin', what: 'Nobody waits at moon: the fragment floats all the way to Liadrin. A raid DoT, and her barrier shrinks.', do: ['Fragments start floating in.', 'Nobody at moon.', 'It reaches her.'], map: (d) => KX_M.fragments(true, d) },
  gates: { name: 'A gate in the ranged group', what: 'A ranged drops their Null Gate where they stand: the hit and then the shards go through the ranged.', do: ['Gates on three players.', 'One stays put.', 'Shards through the group.'], map: (d) => KX_M.gates(true, d) },
  negation: { name: 'Negation runs out', what: 'His tank reaches too few gates before Negation ends (8 seconds; on Mythic 12, and it needs three), and it kills them.', do: ['Negation on the tank.', 'Too few gates.', 'Dead when it ends.'], map: (d) => KX_M.negation(true, d) },
};
// ---- the whole fight (Mythic), by the fastest Mythic kills' clock (4:39): lust on the pull and skip the third intermission
const KX_BEATS = {
  start: { name: 'The pull', do: ['Mythic: Bloodlust, potions and every cooldown on the pull: push him to 25% before the third beetle set explodes (about 4:15).', 'His tank takes him to the north side; the ranged and healers start west, by moon.'],
    run() { const k = gdzKit(KX, 3); kxBoss(k, 0); kxLia(k, 0); kxAt(k, 0, KX_HOME); kxMarks(k); k.call(0.3, 2.8, 'Bloodlust', { x: -20, y: 30, color: '#ff8a5a', ink: '#1a0a04' }); k.ring1(['t1', 't2']).step(0.2); } },
  radiance: { name: 'Divine Radiance', do: ['Liadrin clears the darkness and stuns him for 8 seconds. It\'s not a damage window: don\'t save cooldowns for it.', 'Everyone out of the middle again for the next adds.'],
    run() { const k = gdzKit(KX, 7); kxBoss(k, 0, KX_IB); kxLia(k, 0); kxAt(k, 0, KX_INT); kxMarks(k); k.cast('li', 'Divine Radiance', 0.2, 1.4); kxHit(k, [0, 0], 1.4, 75, 'Divine Radiance', 'Divine Radiance: the darkness is gone, and he\'s stunned for 8 seconds', '#ffd76a'); kxAt(k, 6.6, KX_HOME, 1.6); kxBoss(k, 1.6, KX_IB); kxBoss(k, 6.6); k.step(0.2).step(1.6); } },
  push: { name: 'The push to 25%', do: ['The third adds: root the beetles and leave them. Everyone on the boss.', 'Hold the 2-minute cooldowns from the 4-minute mark for phase two.'],
    run() { const k = gdzKit(KX, 5); kxBoss(k, 0); kxLia(k, 0); kxAt(k, 0, KX_HOME); kxMarks(k); [[6, -12], [-2, -20], [14, -22], [10, -16]].forEach((p, i) => { k.add('pb' + i, 'Bomber Beetle', 0.4, p[0], p[1]); kxHit(k, p, 1, 5, 'AoE root', 'root the beetles and leave them', '#7fd8ff'); }); k.call(1, 4.4, 'Ignore them: push him', { x: 6, y: 40, color: '#ffd23b', ink: '#1a1405' }); k.step(0.2).step(1); } },
  p2: { name: 'Phase two: Last Light', do: ['At 25% everyone is stunned and every add disappears. Liadrin\'s Last Light: Luminous Grace, 50% more damage and healing.', 'Eightfold Eclipse: an orb (a raid hit) every few seconds, and the eighth kills everyone: about a minute to kill him.'],
    run() { const k = gdzKit(KX, 5); kxBoss(k, 0); kxLia(k, 0); kxAt(k, 0, KX_HOME); k.cast('kx', 'Stygian Howl', 0.2, 1); kxHit(k, [0, 0], 1, 75, 'Stygian Howl', 'Stygian Howl: everyone stunned for a moment', '#7a3dff'); k.cast('li', 'Last Light', 1.4, 2.2); kxHit(k, [0, 0], 2.2, 75, 'Last Light', 'Last Light: Luminous Grace, 50% more damage and healing', '#ffd76a'); k.step(0.2).step(2.2); } },
  kill: { name: 'The kill', do: ['Kith\'ix dies before the eighth Eclipse.'],
    run() { const k = gdzKit(KX, 4); kxBoss(k, 0); kxLia(k, 0); kxAt(k, 0, KX_HOME); k.ring({ on: 'kx', r: 7, fx: 'burst', t0: 1.4, at: 2, dur: 0.8, color: '#ffd23b', cn: 'Kith\'ix dies', legend: 'the kill' }); k.step(0.3); } },
};
const KX_SIM = [
  { at: 0, beat: 'start' }, { at: 6, mech: 'adds', label: 'Voidswarm 1: the adds' }, { at: 22, mech: 'devastation', label: 'Dark Devastation 1 (drop spot 1)', o: { n: 0 } },
  { at: 27, mech: 'extinguish', label: 'Extinguish 1' }, { at: 42, mech: 'devastation', label: 'Dark Devastation 2 (drop spot 2)', o: { n: 1 } }, { at: 43, mech: 'fear', label: 'Unspeakable Horrors 1' },
  { at: 57, mech: 'suffocate', ph: 1, label: 'Suffocating Darkness 1' }, { at: 62, mech: 'devastation', ph: 1, label: 'Dark Devastation 3 (just past moon)', o: { n: 2, int: true } },
  { at: 68, mech: 'fragments', ph: 1, label: 'Eclipse Fragments (circle and moon)' }, { at: 78, mech: 'extinguish', ph: 1, label: 'Extinguish 2 (inside the barrier)', o: { int: true } },
  { at: 91, mech: 'fear', ph: 1, label: 'Unspeakable Horrors 2 (to the markers)', o: { int: true } }, { at: 101, beat: 'radiance', ph: 1 },
  { at: 115, mech: 'adds', label: 'Voidswarm 2 (one more beetle)' }, { at: 131, mech: 'devastation', label: 'Dark Devastation 4 (drop spot 4)', o: { n: 3 } },
  { at: 145, mech: 'extinguish', label: 'Extinguish 3' }, { at: 151, mech: 'devastation', label: 'Dark Devastation 5 (drop spot 5)', o: { n: 4 } }, { at: 153, mech: 'fear', label: 'Unspeakable Horrors 3' },
  { at: 166, mech: 'suffocate', ph: 1, label: 'Suffocating Darkness 2' }, { at: 171, mech: 'devastation', ph: 1, label: 'Dark Devastation 6 (just past triangle)', o: { n: 5, int: true } },
  { at: 175, mech: 'fragments', ph: 1, label: 'Eclipse Fragments (circle and triangle)', o: { tri: true } }, { at: 187, mech: 'extinguish', ph: 1, label: 'Extinguish 4 (inside the barrier)', o: { int: true } },
  { at: 199, mech: 'fear', ph: 1, label: 'Unspeakable Horrors 4 (to the markers)', o: { int: true } }, { at: 210, beat: 'radiance', ph: 1 },
  { at: 224, beat: 'push' }, { at: 231, beat: 'p2', ph: 2 }, { at: 242, mech: 'gates', ph: 2, label: 'Null Gate 1' }, { at: 249, mech: 'negation', ph: 2, label: 'Negation 1 (three gates)' },
  { at: 262, mech: 'gates', ph: 2, label: 'Null Gate 3' }, { at: 264, mech: 'negation', ph: 2, label: 'Negation 2' }, { at: 279, beat: 'kill', ph: 2 },
];
const KX_DUR = { 'm:adds': 17, 'm:extinguish': 13, 'm:fear': 16, 'm:devastation': 11, 'm:suffocate': 15, 'm:fragments': 18, 'm:gates': 15, 'm:negation': 12, 'b:start': 3, 'b:radiance': 7, 'b:push': 5, 'b:p2': 5, 'b:kill': 0 };
const KX_SEV = { 'm:adds': 3, 'm:extinguish': 3, 'm:fear': 2, 'm:devastation': 2, 'm:suffocate': 3, 'm:fragments': 3, 'm:gates': 3, 'm:negation': 2, 'b:start': 1, 'b:radiance': 1, 'b:push': 2, 'b:p2': 2, 'b:kill': 1 };
GDZ["Kith'ix"] = {
  upd: ['12.1.5', 'Oct 21, 2026'],
  stepRoles: {
    'Voidswarm (Adds away from him, beetles one at a time)': ['', '', 'dt', 'd', 't'], 'Extinguish (An orb for everyone)': ['', '', ''],
    'Unspeakable Horrors (Run out, one dispel at a time)': ['', '', 'h', 'h'], 'Dark Devastation (Out to the drop spot, swap)': ['t', 't', 't', 't'],
    'Suffocating Darkness (Inside the barrier)': ['', '', '', 'h'], 'Eclipse Fragments (Catch them at the barrier\'s edge)': ['', 't', ''],
    'Null Gate (Drop it at your role\'s spot)': ['', '', '', ''], 'Negation (Into the gates in time)': ['t', 't', 't'],
  },
  sum: 'Phase one repeats until 25%: adds (kill them away from him, beetles one at a time), Extinguish (grab Liadrin\'s orbs), fears and tank circles, then an intermission inside Liadrin\'s barrier. Phase two is a one-minute race: drop your Null Gate at your spot and dodge the shards.',
  m: { sim: KX_SIM, simDur: KX_DUR, simSev: KX_SEV, beats: KX_BEATS,
    simAlways: ['The middle stays empty while adds are up: one beetle stepped on by accident can wipe.', 'Bloodlust on the pull: skip the third intermission by reaching 25% before the third beetle set explodes.', 'Phase two: about a minute before the eighth Eclipse.'],
    source: 'Tactyks\' Mythic Kith\'ix video', sum: 'Heroic with sharper edges: more eggs (beetles drop one too), fragments that splash 6 yards for 10 seconds, a fourth Null Gate, Negation needing three gates, and 3 Nullify stacks killing.' },
  facts: [['Phases', '2, with intermissions'], ['Bloodlust', 'Phase two', 'h'], ['Bloodlust', 'On the pull', 'm'], ['Raid size', 'Flex: 15 to 25', 'm'], ['Healers', '5 (for 25)', 'm'], ['Hardest part', 'Beetles and the intermissions'], ['Fight length', 'About 4 minutes', 'h'], ['Fight length', 'About 4.5 minutes', 'm']],
  phases: [
    { id: 'p1', name: 'Phase one: Darkness\' Domain', sum: 'Adds, Extinguish, fears and tank circles, until he reaches 100 energy and the intermission starts. Repeats until 25%.',
      mechs: [
        { id: 'adds', fail: KX_FAIL.adds, name: 'Voidswarm (Adds away from him, beetles one at a time)', spell: 'Voidswarm', what: 'Raid damage, then adds: a Venomous Hulk, two Voidweavers that stand still and ramp up raid damage, and three Bomber Beetles. Adds near him take 75% less damage. Every add must be dead before the intermission.',
          do: ['Voidswarm: the adds come out.', 'The off tank takes the Hulk onto a Voidweaver, faced out.', 'Beetles: root them, then one player steps on each, one at a time.', 'Kill the Voidweaver, then its eggs before they hatch.', 'The Hulk\'s Venom Roar: a frontal and knockback on its tank.'],
          plan: ['Nobody stands in the middle while adds are up.', 'Each beetle that explodes puts a stacking DoT on the raid: one at a time.', 'Hulk and Voidweavers drop eggs when they die (4 and 2): cleave them. He can be moved onto eggs: they ignore his shield.'],
          m: { what: 'The same adds, with more eggs (the Hulk drops 5, each Voidweaver 3) and every beetle dropping one where it explodes. Four beetles from the second set.',
            do: ['Voidswarm: the adds come out.', 'The off tank takes the Hulk to the Voidweaver on the ranged side, faced out.', 'The Death Knight slows the beetles and grips them in one at a time, by the Hulk.', 'Kill the Voidweaver, then the eggs.', 'Then the Hulk goes across to the other Voidweaver, with the raid.'],
            plan: ['Slow the beetles, never root them: they get gripped. Drop Death and Decay on the second-closest and grip the closest.', 'Wait for each DoT to end before the next grip. Two Death Knights make it easier.', 'Stepping on a beetle: one stack is fine, two is very dangerous, three kills.', 'Keep the Hulk alive and bring it to where the raid is: Liadrin\'s orbs land at the Hulk.'] },
          map: (d) => KX_M.adds(false, d) },
        { id: 'extinguish', fail: KX_FAIL.extinguish, name: 'Extinguish (An orb for everyone)', spell: 'Extinguish', what: 'An 8-second cast, then a huge shadow hit on everyone. Liadrin throws Light\'s Embrace orbs toward the Hulk (or a Voidweaver, or him): run over one for 90% less shadow damage.',
          do: ['Liadrin throws the orbs toward the Hulk.', 'One orb each; melee can catch them as they land.', 'Extinguish lands: the orb carries you through it.'],
          plan: ['No orb? A big defensive (on Normal and Heroic you usually live).', 'He stands still while he casts: the tanks swap then.'],
          m: { plan: ['The orbs land at the Hulk while it lives, then a Voidweaver, then him: walk the Hulk to the raid\'s Voidweaver first.', 'He stands still while he casts: the tanks swap then.'] },
          map: (d) => KX_M.extinguish(false, d) },
        { id: 'fear', fail: KX_FAIL.fear, name: 'Unspeakable Horrors (Run out, one dispel at a time)', spell: 'Unspeakable Horrors', what: 'A few players have 6 seconds before they\'re feared in place. Dispelling the fear lets out a scream that hurts everyone, less the further away you are.',
          do: ['Marked players get 6 seconds.', 'Run out of the raid (Mythic: healer to skull, melee to star, ranged to cross).', 'Dispel one, the healer first.', 'Let the raid heal, then the next.'],
          map: (d) => KX_M.fear(false, d) },
        { id: 'devastation', fail: KX_FAIL.devastation, name: 'Dark Devastation (Out to the drop spot, swap)', spell: 'Dark Devastation', what: 'A 15-yard hit round his tank that makes them take 150% more damage. Heroic and up it leaves a Voidscar there, which knocks back anyone who touches it and sends fragments in the intermission.',
          do: ['His tank runs the circle out to the next drop spot.', 'A defensive for the hit.', 'It lands: a Voidscar stays there.', 'The other tank taunts.'],
          plan: ['Drop spots 1, 2, 4 and 5 together in the north-east: one tank can catch their fragments together.', 'Spot 3 just past moon in the first intermission, spot 6 just past triangle in the second.'],
          map: (d, o) => KX_M.devastation(false, d, o) },
      ],
      tiles: [
        { name: 'Commanding Presence (Adds away from him)', spell: 'Commanding Presence', do: 'Adds within 25 yards of him take 75% less damage. The eggs don\'t: he can stand on those.' },
        { name: 'Mindstinger eggs (Cleave them)', spell: 'Incubation', do: 'Dead adds drop eggs. A hatched Mindstinger stuns and DoTs random players over and over: kill the eggs first.' },
        { name: 'Twisted Appendage (Step out)', spell: 'Twisted Appendage', do: 'Tentacles slam a short frontal toward a random player. Step out of it.' },
        { name: 'Dark Frenzy (All adds dead first)', spell: 'Dark Frenzy', do: 'Any add alive when the intermission starts gets much faster, can\'t be crowd controlled, and pulses raid damage.' },
      ] },
    { id: 'int', name: 'Intermission: Suffocating Darkness', sum: 'At 100 energy darkness fills the room: everyone inside Liadrin\'s barrier while he keeps casting. When she\'s full she clears it and stuns him.',
      mechs: [
        { id: 'suffocate', fail: KX_FAIL.suffocate, name: 'Suffocating Darkness (Inside the barrier)', spell: 'Suffocating Darkness', what: 'Darkness everywhere but Liadrin\'s barrier: outside it you\'re pacified and take heavy damage. Extinguish, fears and tank circles carry on in the small space. Abyssal Grasp drags a few players toward the dark until their heal absorb is gone.',
          do: ['Everyone into Liadrin\'s barrier.', 'The boss at its north edge.', 'Abyssal Grasp: a heal absorb pulling you out.', 'Clear it within 8 seconds: healthstone, potion, healing.'],
          m: { plan: ['Abyssal Grasp lands with the fears: the scariest moment. Rally, Anti-Magic Zone, Darkness, Spirit Link here.'] },
          map: (d) => KX_M.suffocate(false, d) },
        { id: 'fragments', fail: KX_FAIL.fragments, name: 'Eclipse Fragments (Catch them at the barrier\'s edge)', spell: 'Eclipse Fragment', what: 'Every Voidscar sends a fragment floating to Liadrin every 8 seconds, five each. Soaking one puts a stacking DoT on you and anyone within 3 yards. One that reaches her: a raid DoT and a smaller barrier.',
          do: ['Fragments float in from the Voidscars.', 'A tank catches the north-east cluster\'s at circle.', 'Two players take turns at the other scar.'],
          plan: ['The tank without the Devastation debuff soaks most of them.', 'With too many scars later on, spread them round the room with one soaker each.'],
          m: { what: 'Every Voidscar sends a fragment floating to Liadrin every 8 seconds, five each. On Mythic soaking one hurts everyone within 6 yards for 10 seconds, so nobody soaks a scar alone. One that reaches her: a raid DoT and a smaller barrier.',
            do: ['Fragments float in from the Voidscars.', 'The tank without the debuff catches the north-east ones at circle (two at a time, then swap).', 'Two ranged take turns at moon (or triangle), with a backup.'],
            plan: ['Keep the soakers all ranged: the fears pick one per role.', 'Everyone else stays near the middle, away from the 6-yard splashes.', 'Immunities don\'t stop the DoT; Anti-Magic Shell helps.'] },
          map: (d, o) => KX_M.fragments(false, d, o) },
      ],
      tiles: [
        { name: 'Divine Radiance (Not a damage window)', spell: 'Divine Radiance', do: 'When Liadrin is full she clears the darkness and stuns him for 8 seconds. Each time she\'s Exhausted: weaker orbs, a smaller barrier, 10% stronger darkness.' },
        { only: 'm', name: 'Skip the third intermission (Push by about 4:15)', do: 'Lust, potions and every cooldown on the pull. Reach 25% before the third beetle set explodes (about 4:10 to 4:20): root them and ignore them.' },
      ] },
    { id: 'p2', name: 'Phase two: Last Light (25% to the kill)', sum: 'Everyone is stunned, every add vanishes, and Liadrin gives the raid Luminous Grace. About a minute before the eighth Eclipse kills everyone.',
      mechs: [
        { id: 'gates', fail: KX_FAIL.gates, name: 'Null Gate (Drop it at your role\'s spot)', spell: 'Null Gate', what: 'A melee, a healer and a ranged get 5 seconds, then a 5-yard hit and a gate where they stand. Each gate sprays Nullshards for the rest of the fight: every hit is a Nullify stack, and 5 stacks kill.',
          do: ['Null Gate: 5 seconds.', 'Walk to your role\'s spot: melee off to his side, healers west, ranged far east.', 'The gate opens: nobody else within 5 yards.', 'Dodge the shards.'],
          m: { what: 'A melee, a healer and two ranged get 5 seconds, then a 5-yard hit and a gate where they stand. Each gate sprays Nullshards for the rest of the fight: every hit is a Nullify stack, and on Mythic 3 stacks kill.' },
          map: (d) => KX_M.gates(false, d) },
        { id: 'negation', fail: KX_FAIL.negation, name: 'Negation (Into the gates in time)', spell: 'Negation', what: 'His tank takes 100% more physical damage but moves twice as fast and shards can\'t touch them. After 8 seconds it kills them unless they\'ve run into a Null Gate. Each gate hits the tank hard and clears gates and shards within 10 yards.',
          do: ['Negation: the other tank taunts at once.', 'A defensive.', 'Run into the melee gate.'],
          m: { what: 'His tank takes 100% more physical damage but moves twice as fast and shards can\'t touch them. On Mythic it kills them after 12 seconds unless they\'ve run into three Null Gates. Each gate hits the tank and clears gates and shards within 10 yards.', do: ['Negation: the other tank taunts at once.', 'A defensive.', 'The melee gate, then the two ranged gates: three in 12 seconds.'] },
          map: (d) => KX_M.negation(false, d) },
      ],
      tiles: [
        { name: 'Eightfold Eclipse (About a minute)', spell: 'Eightfold Eclipse', do: 'An orb every few seconds, each a raid hit; the eighth kills everyone. Luminous Grace gives 50% more damage and healing.' },
        { name: 'Bloodlust (Phase two)', do: 'Bloodlust here on Heroic: it\'s a race to the finish.', m: { name: 'Bloodlust (On the pull)', do: 'On Mythic the hard part is reaching 25%: lust on the pull and hold the 2-minute cooldowns from the 4-minute mark for here.' } },
      ] },
  ],
  roles: {
    t: ['Off tank: the Hulk onto a Voidweaver, faced out (Venom Roar knocks back).', 'Dark Devastation: out to the drop spot with a defensive; swap every cast.', 'Intermission: the tank without the debuff soaks most fragments.', 'Phase two: Negation: taunt at once; run into gates (Mythic: three).'],
    h: ['Fears: dispel one at a time, the healer first.', 'Abyssal Grasp: clear the absorbs within 8 seconds.', 'Raid cooldowns when the fears and Abyssal Grasp overlap.'],
    d: ['Adds away from him; kill the Voidweavers and the eggs.', 'Beetles one at a time; nobody in the middle while adds are up.', 'Grab a Light\'s Embrace orb for every Extinguish.', 'Phase two: drop your gate at your role\'s spot, dodge the shards.'],
  },
};

// ===== The Lost Explorers (notes/Guides/Bosses/3 The Lost Explorers.md: Tactyks' Mythic video and his Normal/Heroic raid guide read in
// full, the spell text, and Wolfthorn's Mythic kill NcF2XLYmMQ4Bbnqh #20 (5:36) for the clock and the spots). Yards from the room
// picture's centre, x east, y north: a big eight-sided platform (players use about 50 yards each way), a water channel running north to
// south through the middle. Trader Gebbo walks a circle about 27 yards out, counter-clockwise, one lap in just under two minutes; in the
// kill the other two were dragged along with him, two bosses together and the third 30+ yards away.
GDZ_ORIGIN['The Lost Explorers'] = { cx: -470, cy: 698 }; GDZ_FULL['The Lost Explorers'] = { x: 0, y: 0, r: 56 };
const LE = 'The Lost Explorers', LE_MEL = NZ_MEL, LE_RNG = NZ_RNG;
const leG = (a) => nzU(a, 27); /* (Gebbo on his circle at angle a) */
// the raid on a pair of bosses (A tanked by t1, B the other one of the pair) with melee between them and ranged further in; skip: ids left out
function leRaid(k, t, A, B, o) {
  o = o || {}; const s = new Set(o.skip || []), M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], f = o.f != null ? o.f : Math.atan2(-M[1], -M[0]) * 180 / Math.PI;
  if (!s.has('t1')) { const q = nzAdd(A, Math.atan2(A[1] - M[1], A[0] - M[0]) * 180 / Math.PI, 5); if (o.hold != null) k.hold(o.hold, 't1'); k.at(t, 't1', q[0], q[1]); }
  nzArc(k, t, LE_MEL, M, [[8, f - 50, f, f + 50], [13.5, f - 60, f - 20, f + 20, f + 60]], o.hold, s);
  nzArc(k, t, LE_RNG, M, [[20, f - 60, f - 36, f - 12, f + 12, f + 36, f + 60], [26, f - 48, f - 24, f, f + 24, f + 48]], o.hold, s);
  return k;
}
// the start of a scene: Gebbo at angle a on his circle; mode 'IG' (Iku with Gebbo, Nama apart: the start of the fight) or 'IN' (Iku with
// Nama, Gebbo walking on his own: his turn, and between turns); returns the bosses' spots
function leHome(k, a, mode, t) {
  t = t || 0; const G = leG(a); k.boss('ge', 'Trader Gebbo', t, G[0], G[1]);
  if (mode === 'IN') { const I = [20, 21], N = [27, 13]; k.boss('ik', 'Scrollsage Iku', t, I[0], I[1]).boss('na', 'First Mate Nama', t, N[0], N[1]); const q = nzAdd(N, -20, 5); k.at(t, 't2', q[0], q[1]); leRaid(k, t, I, N, { f: 215 }); return { G, I, N }; }
  const I = nzU(a - 9, 33), N = nzU(a - 80, 31); k.boss('ik', 'Scrollsage Iku', t, I[0], I[1]).boss('na', 'First Mate Nama', t, N[0], N[1]); const q = nzAdd(N, a - 80, 5.5); k.at(t, 't2', q[0], q[1]); leRaid(k, t, I, G); return { G, I, N };
}
const LE_M = {
  // the rule for the whole fight: United Defense (Heroic and up): with all three within 30 yards they take 99% less damage. Iku is
  // tanked next to Gebbo as he walks his circle and cleaved there; Nama is tanked 30+ yards behind (fail: Nama dragged into the pair)
  pair(fail) {
    const L = 12, k = gdzKit(LE, L);
    for (let t = 0; t <= L + 0.01; t += 3) { const a = -100 + t * 3.2, G = leG(a), I = nzU(a - 9, 33), N = fail && t >= 6 ? nzU(a - 50, 30) : nzU(a - 80, 31); k.boss('ge', 'Trader Gebbo', t, G[0], G[1]).boss('ik', 'Scrollsage Iku', t, I[0], I[1]).boss('na', 'First Mate Nama', t, N[0], N[1]);
      const q = nzAdd(N, a - 80, 5.5); k.at(t, 't2', q[0], q[1]); leRaid(k, t, I, G); }
    k.call(0.4, 3.6, 'Gebbo walks his circle', { on: 'ge', color: '#e6b450', ink: '#141006' });
    k.link({ from: 'na', to: 'ik', t0: 1, t1: fail ? 5 : L, color: '#7ee36a', legend: 'Nama stays 30+ yards from the pair' });
    if (fail) { ['ge', 'ik', 'na'].forEach((b) => k.ring({ on: b, r: 5, fx: 'safe', t0: 8.4, dur: L - 8.4, color: '#ffd23b', cn: 'United Defense', legend: 'all three within 30 yards: 99% less damage taken' }));
      k.call(8.6, 12, 'United Defense: 99% less damage', { x: -2, y: -8, color: '#ffd23b', ink: '#1a1400' }); k.oops('t2', 8.4); k.step(0.3).step(5).step(8.4);
      k.pause(8.8, 'Nama was dragged in close to the other two. With all three within 30 yards they take 99% less damage: the raid\'s damage stops counting.', { x: 10, y: -24, r: 22 });
      return k.done({ title: 'Mistake: all three together', focus: { x: 6, y: -18, r: 26 }, badLabel: 'brought Nama too close' }); }
    k.ring1(['t1', 't2']).step(0.3).step(3).step(6);
    k.pause(4, 'Iku is tanked right next to Gebbo as he walks, so the melee cleave both. Nama\'s tank keeps her 30 yards behind them, and the ranged in the middle can hit all three.', { x: 8, y: -20, r: 26 });
    return k.done({ title: 'Two together, one apart', focus: { x: 6, y: -16, r: 28 }, hlLabel: 'the tanks' });
  },
  // Throw Junk: crates land on marked spots; breaking one bleeds the breaker (Mythic: the whole raid: Splinters); two assigned breakers
  // break them in pairs, a few seconds apart; one hides the fish, which its carrier picks up; a crate left too long explodes (Relic Rupture)
  crates(fail, d) {
    const myth = d !== 'h', L = 14, k = gdzKit(LE, L), h = leHome(k, -80, 'IG'), C = [[-20, -6], [16, -2], [-6, -2], [5, -1]], BR = ['r4', 'r1'];
    k.cast('ge', 'Throw Junk', 0.3, 1.6);
    C.forEach(([x, y], i) => { k.ring({ x, y, r: 3, fx: 'zone', t0: 0.4, dur: 1.6, color: '#d7a35a', fill: 'rgba(215,163,90,.18)', cn: 'Crate landing', legend: 'a crate is about to land here' });
      const tb = fail && i === 3 ? L : [4.6, 4.6, 9.4, 9.4][i]; k.ring({ x, y, r: 1.6, fx: 'puddle', t0: 2, dur: tb - 2, color: '#a8743a', fill: 'rgba(168,116,58,.85)', cn: 'Crate of junk', legend: 'a crate: walk over it to break it' }); });
    // (the two breakers step on their crates in pairs, the west one and the east one; the fish carrier collects the fish)
    BR.forEach((id, j) => { const p0 = k.posAt(id, 0), c1 = C[j], c2 = C[2 + j]; k.hold(2, id).at(4.4, id, c1[0] + 1.6, c1[1] + 1.2).hold(5, id); if (!(fail && j === 1)) { k.at(9.2, id, c2[0] + 1.6, c2[1] + 1.2).hold(10, id).at(13.4, id, p0[0], p0[1]); } else k.at(9, id, p0[0], p0[1]); });
    k.call(4.6, 6.4, myth ? 'Splinters: the whole raid bleeds' : 'Splinters: the breaker bleeds', { x: 0, y: 8, color: '#ff8a5a', ink: '#1a0a00' });
    if (!fail) { k.call(9.4, 11.2, myth ? 'Second pair: raid bleed again' : 'Second pair', { x: 0, y: 8, color: '#ff8a5a', ink: '#1a0a00' });
      const F = C[2], q = k.posAt('r7', 0); k.hold(9.6, 'r7').at(11.6, 'r7', F[0] + 1.6, F[1] + 1.8).hold(12, 'r7').at(14, 'r7', q[0], q[1]); k.tag('r7', 'Fish', 11.6, L);
      k.ring({ x: F[0], y: F[1], r: 1.4, fx: 'zone', t0: 9.4, dur: 2.2, color: '#7ee36a', fill: 'rgba(126,227,106,.6)', cn: 'Disgusting Fish', legend: 'the fish: its carrier picks it up' }); }
    if (fail) { k.ring({ x: C[3][0], y: C[3][1], r: 8, fx: 'burst', t0: 11.6, at: 12, dur: 0.8, color: '#ff3b3b', cn: 'Relic Rupture', legend: 'a crate left too long explodes' }); gdzFailBlast(k, 12.2, 'A crate exploded: a big raid hit', 0, 10, [], 'Relic Rupture'); k.step(0.3).step(4.6).step(12);
      k.pause(11.4, 'Nobody broke this crate. It sat there until it exploded: a big hit on the whole raid.', { x: C[3][0], y: C[3][1], r: 9 });
      return k.done({ title: 'Mistake: a crate left to explode', focus: { x: 0, y: -10, r: 20 } }); }
    k.ring1(BR.concat(['r7'])).step(0.3).step(2.2).step(4.6).step(9.4);
    k.pause(3.6, myth ? 'Two breakers, two crates at a time, a few seconds apart: each crate makes the whole raid bleed. Everyone else, and the melee most of all, watch your feet.' : 'Two breakers, two crates at a time. Everyone else, and the melee most of all, watch your feet: a crate you step on bleeds you.', { x: 0, y: -9, r: 16 });
    return k.done({ title: 'Crates: break them in pairs', focus: { x: 0, y: -8, r: 22 }, hlLabel: 'the two breakers, and the fish carrier' });
  },
  // Shell Spin: Nama throws three shells in a cone at a random melee (4-second stun); with Nama in the pair, the melee picked steps to the
  // outer side so the shells fly out of the room, then steps out of the line (fail: baited toward the ranged)
  shell(fail) {
    const L = 9.5, k = gdzKit(LE, L), h = leHome(k, 120, 'IN'), V = 'm6'; k.cast('na', 'Shell Spin', 0.6, 4.4);
    const out = nzAdd(h.N, fail ? 228 : 30, fail ? 10 : 8); k.hold(0.6, V).at(2.4, V, out[0], out[1]); k.call(0.7, 3, fail ? 'Shells: picked' : 'Shells: take them outside', { on: V, color: '#e6b450', ink: '#141006' });
    if (!fail) { const st = nzAdd(out, 120, 6); k.hold(2.6, V).at(3.3, V, st[0], st[1]); }
    k.cone({ from: 'na', deg: fail ? 228 : 30, r: 26, width: 40, at: 4.6, color: '#5ce1e6', legend: 'Shell Spin: three shells in a cone, a 4-second stun' });
    if (fail) { const inC = ['m1', 'm2', 'm3', 'm4', 'm5', 'm7'].concat(LE_RNG).filter((id) => { const p = k.posAt(id, 4), dx = p[0] - h.N[0], dy = p[1] - h.N[1], d0 = Math.hypot(dx, dy); let a = Math.atan2(dy, dx) * 180 / Math.PI - 228; while (a > 180) a -= 360; while (a < -180) a += 360; return d0 > 1 && d0 < 26 && Math.abs(a) <= 20; }).slice(0, 4);
      inC.forEach((id, i) => { ulHit(k, id, 4.8 + i * 0.1, 'Stunned'); k.oops(id, 4.9); }); k.step(0.6).step(2.4).step(4.6);
      k.pause(5.2, 'This melee baited the shells in toward the raid: they flew through the ranged and healers and stunned them for 4 seconds.', { x: h.N[0] - 10, y: h.N[1] - 8, r: 14 });
      return k.done({ title: 'Mistake: shells baited into the raid', focus: { x: 18, y: 10, r: 22 }, badLabel: 'stunned' }); }
    k.ring1([V]).step(0.6).step(2.4).step(3.3);
    k.pause(2.8, 'The melee the shells are coming for steps to the outside of the room, so they fly away from the raid, then steps out of their line.', { on: V, r: 10 });
    return k.done({ title: 'Shell Spin: take it outside', focus: { x: 24, y: 14, r: 20 }, hlLabel: 'the melee the shells are aimed at' });
  },
  // Blink Nova: Iku marks a ranged and teleports to them 7 seconds later; the raid takes falloff damage, less the farther away: the marked
  // player walks a little way out in front, toward the edge, so the melee keep cleaving (fail: they stay in the raid)
  blink(fail) {
    const L = 12.5, k = gdzKit(LE, L), h = leHome(k, -70, 'IG'), V = 'r4', p0 = k.posAt(V, 0); k.cast('ik', 'Blink Nova', 0.4, 7.2);
    const T = fail ? p0 : nzAdd(h.I, -70 - 9 + 35, 16); if (!fail) k.hold(0.6, V).at(4.4, V, T[0], T[1]); k.call(0.6, 4, fail ? 'Marked: stays put' : 'Marked: out in front', { on: V, color: '#b48cff', ink: '#12061f' });
    k.ring({ on: V, r: 2.6, fx: 'debuff', t0: 0.4, dur: 6.8, color: '#b48cff', cn: 'Blink Nova', legend: 'Blink Nova: Iku teleports to this player' });
    k.boss('ik', 'Scrollsage Iku', 7.2, h.I[0], h.I[1]).boss('ik', 'Scrollsage Iku', 7.4, T[0] + 3, T[1] + 1);
    k.ring({ x: T[0] + 3, y: T[1] + 1, r: fail ? 30 : 9, fx: 'burst', t0: 7, at: 7.4, dur: 1, color: '#b48cff', cn: 'Blink Nova burst', legend: 'the nova: raid damage, less the farther away' });
    const q1 = k.posAt('t1', 0); k.hold(7.4, 't1').at(9.6, 't1', T[0] + 6, T[1] + 4); k.boss('ik', 'Scrollsage Iku', 9.6, T[0] + 3, T[1] + 1).boss('ik', 'Scrollsage Iku', 12.2, h.I[0], h.I[1]); k.hold(9.6, 't1').at(12.2, 't1', q1[0], q1[1]);
    if (!fail) k.hold(7.6, V).at(10.6, V, p0[0], p0[1]);
    if (fail) { gdzFailBlast(k, 7.6, 'Nova in the raid: full damage on everyone', -4, 4, [], 'Blink Nova'); k.oops(V, 7.4); k.step(0.4).step(4).step(7.4);
      k.pause(7.8, 'The marked ranged stayed in the middle of the raid. Iku landed on top of everyone and the nova hit the whole raid at full strength.', { on: V, r: 12 });
      return k.done({ title: 'Mistake: Blink Nova in the raid', focus: { x: 8, y: -14, r: 24 }, badLabel: 'didn\'t move' }); }
    k.ring1([V]).step(0.4).step(0.6).step(7.4).step(9.6);
    k.pause(5, 'The marked ranged walks out in front, toward the edge. Iku lands there, so the nova is weaker for everyone, and the melee can still reach her.', { x: T[0], y: T[1], r: 14 });
    return k.done({ title: 'Blink Nova: out in front, toward the edge', focus: { x: 10, y: -16, r: 24 }, hlLabel: 'the marked ranged' });
  },
  // Icebound Flames: Iku's cast to kick, on a short rotation (a tank first, then melee); if one goes off, dispel it (fail: a kick is missed)
  kicks(fail) {
    const L = 11, k = gdzKit(LE, L), h = leHome(k, -80, 'IG');
    k.cast('ik', 'Icebound Flames', 0.6, 2.4, 'kick', 'Tank 1'); k.cast('ik', 'Icebound Flames', 4.4, 6.2, fail ? 'done' : 'kick', 'Melee 1'); if (!fail) k.cast('ik', 'Icebound Flames', 8.2, 10, 'kick', 'Melee 2');
    if (fail) { k.ring({ on: 'r3', r: 2.6, fx: 'debuff', t0: 6.2, dur: 2.6, color: '#7fd8ff', cn: 'Icebound Flames', legend: 'Icebound Flames on a player: dispel it' }); k.dispel('h2', 'r3', 8.8); k.oops('m1', 6.2); k.step(0.6).step(4.4).step(6.2).step(8.8);
      k.pause(6.6, 'The second kick was missed: Icebound Flames went off on a ranged. A healer has to dispel it, and it hurts until they do.', { on: 'r3', r: 9 });
      return k.done({ title: 'Mistake: a missed kick', focus: { x: 8, y: -16, r: 22 }, badLabel: 'missed the kick' }); }
    k.ring1(['t1', 'm1', 'm2']).step(0.6).step(4.4).step(8.2);
    k.pause(1.6, 'Iku casts Icebound Flames over and over. Kick every one on a set order: her tank first, then the melee with the shortest kicks.', { on: 'ik', r: 12 });
    return k.done({ title: 'Icebound Flames: kick every one', focus: { x: 6, y: -16, r: 22 }, hlLabel: 'the kickers, in order' });
  },
  // Shredding Shards (Iku): magic damage taken up on her tank; swap at once. Nama's hits stack Steady Strikes (+4% physical damage each), so
  // the tanks trade bosses every Shredding Shards (fail: no swap; the next Icebound Flames lands on the tank with Shards)
  swap(fail) {
    const L = 11, k = gdzKit(LE, L), h = leHome(k, -80, 'IG'), A = k.posAt('t1', 0), B = k.posAt('t2', 0); k.cast('ik', 'Shredding Shards', 0.5, 1.4);
    k.ring({ on: 't1', r: 2.6, fx: 'debuff', t0: 1.4, dur: fail ? L - 1.4 : 7, color: '#7fd8ff', cn: 'Shredding Shards', legend: 'Shredding Shards: more magic damage taken: swap now' });
    k.ring({ on: 't2', r: 2.6, fx: 'debuff', t0: 0, dur: fail ? L : 6, color: '#c9a36a', cn: 'Steady Strikes', legend: 'Steady Strikes: Nama\'s stacks, more physical damage taken each hit' });
    if (fail) { k.cast('ik', 'Icebound Flames', 5, 6.8, 'done'); ulHit(k, 't1', 7, 'Icebound Flames'); k.oops('t1', 7); k.step(0.5).step(1.4).step(7);
      k.pause(7.3, 'No swap after Shredding Shards: the next Icebound Flames went off on the tank who already takes extra magic damage.', { on: 't1', r: 9 });
      return k.done({ title: 'Mistake: no swap after Shredding Shards', focus: { x: 0, y: -26, r: 24 }, badLabel: 'kept Iku with Shards' }); }
    // (the tanks trade bosses: each runs to the other's boss and taunts)
    k.hold(1.6, ['t1', 't2']).at(5.4, 't1', B[0], B[1]).at(5.4, 't2', A[0], A[1]); k.call(4.6, 6, 'Taunt', { on: 't2', color: '#5aa0ff', ink: '#fff' }); k.call(4.8, 6.2, 'Taunt', { on: 't1', color: '#5aa0ff', ink: '#fff' });
    k.ring1(['t1', 't2']).step(0.5).step(1.6).step(5.4);
    k.pause(2, 'Shredding Shards: swap right away. The tanks trade bosses each time, so neither stacks too much of Nama\'s Steady Strikes or keeps Iku with Shards on.', { x: 0, y: -26, r: 22 });
    return k.done({ title: 'Tank swap on Shredding Shards', focus: { x: 0, y: -24, r: 26 }, hlLabel: 'the tanks' });
  },
  // the fish: Mor'zahi's energy climbs to Final Ascension (a wipe); at about 95, the carrier feeds the fish to the next boss: Mor'zahi
  // resets and that boss gets its ultimate. Each boss eats once (the kill: Gebbo, then Iku, then Nama). The boss with its ultimate is the
  // one kept on its own (fail: fed too late)
  fish(fail, o) {
    o = o || {}; const who = o.to || 'ge', L = 11, k = gdzKit(LE, L), h = who === 'na' ? leHome(k, -20, 'IN') : leHome(k, -80, 'IG'), C = 'r7', B = { ge: h.G, ik: h.I, na: h.N }[who], NM = { ge: 'Gebbo', ik: 'Iku', na: 'Nama' }[who];
    k.tag(C, 'Fish', 0, fail ? L : 5.6); k.call(0.3, 3, fail ? 'Mor\'zahi at 100' : 'Mor\'zahi at 95: feed ' + NM, { x: 0, y: 10, color: '#c084ff', ink: '#14061f' });
    if (fail) { gdzFailBlast(k, 3.4, 'Final Ascension: the raid is wiped', 0, 12, ['m1', 'h1', 'r1'], 'Final Ascension'); k.step(0.3).step(3.4);
      k.pause(3.8, 'The fish was held too long. Mor\'zahi reached full energy and Final Ascension wiped the raid.', { x: 0, y: 0, r: 30 });
      return k.done({ title: 'Mistake: the fish fed too late', focus: { x: 0, y: -8, r: 34 } }); }
    const p0 = k.posAt(C, 0), q = nzAdd(B, Math.atan2(B[1], B[0]) * 180 / Math.PI + 35, 6); k.hold(0.6, C).at(5, C, q[0], q[1]); k.link({ from: C, to: who, t0: 5, t1: 5.8, color: '#7ee36a', legend: 'the fish, fed to the boss' }); k.call(5.1, 6, 'Fed', { on: C, color: '#7ee36a', ink: '#0a1a06' });
    k.ring({ on: who, r: 6, fx: 'zone', t0: 5.8, dur: L - 5.8, color: '#ffd23b', fill: 'rgba(255,210,59,.15)', cn: 'Mor\'zahi\'s Command', legend: 'fed the fish: this boss gets its ultimate for a while' });
    k.call(6, 9, NM + '\'s turn: keep ' + (who === 'ik' ? 'her' : 'him') + ' apart', { on: who, color: '#ffd23b', ink: '#1a1400' }); k.hold(5.6, C).at(9, C, p0[0], p0[1]);
    k.ring1([C]).step(0.3).step(0.6).step(5.4).step(6);
    k.pause(5.8, 'At about 95 energy the carrier feeds the fish to ' + NM + '. Mor\'zahi starts over, and ' + NM + ' gets an ultimate for a while: that boss is the one kept on its own.', { on: who, r: 12 });
    return k.done({ title: 'The fish: feed it at 95', focus: { x: B[0] * 0.5, y: B[1] * 0.5, r: 30 }, hlLabel: 'the fish carrier' });
  },
  // Gebbo's turn, Explosive Surprise: he tosses a Bouncy Mushroom (Mythic: just one) and marks a player; 10 seconds later a bomb lands on
  // them (10 yards) and then blows, sending a Blast Wave across the room. The marked player takes the bomb to the edge across from the
  // mushroom; the raid gathers at the mushroom and bounces as the wave reaches it (fail: someone off the mushroom)
  bomb(fail, d) {
    const myth = d !== 'h', L = 17.5, k = gdzKit(LE, L), a0 = 160, h = leHome(k, a0, 'IN'), V = 'r6', M = myth ? [[14, 6]] : [[14, 6], [4, 14]];
    for (let t = 3; t <= L + 0.01; t += 3) { const G = leG(a0 + t * 3.2); k.boss('ge', 'Trader Gebbo', t, G[0], G[1]); }
    k.cast('ge', 'Explosive Surprise', 0.4, 1.6); M.forEach(([x, y]) => k.ring({ x, y, r: 2.4, fx: 'zone', t0: 1.6, dur: L - 1.6, color: '#7ee36a', fill: 'rgba(126,227,106,.45)', cn: 'Bouncy Mushroom', legend: 'a Bouncy Mushroom: touch it to bounce high into the air' }));
    const BP = [-30, -26]; k.ring({ on: V, r: 3, fx: 'debuff', t0: 1.6, dur: 6, color: '#ff8a3b', cn: 'Explosive Surprise', legend: 'the bomb lands on this player in 10 seconds' });
    const p0 = k.posAt(V, 0); k.hold(1.8, V).at(7.4, V, BP[0], BP[1]); k.call(2, 5, 'Bomb: across from the mushroom', { on: V, color: '#ff8a3b', ink: '#1a0a00' });
    k.ring({ x: BP[0], y: BP[1], r: 10, fx: 'burst', t0: 7.2, at: 7.6, dur: 0.8, color: '#ff8a3b', cn: 'Bomb lands', legend: 'the bomb lands: 10 yards' }); k.obj('bo', 'porb', 7.6, BP[0], BP[1]).show('bo', 7.6, 10);
    // (the raid gathers round the mushroom; the bomb carrier runs back to it; the wave rolls out from the bomb and everyone bounces)
    const ALL = ['t1', 't2'].concat(LE_MEL, LE_RNG).filter((id) => id !== V), off = fail ? ['m3'] : [], OFF = [M[0][0] - 14, M[0][1] - 14];
    ALL.forEach((id, i) => { const m = M[myth ? 0 : i % 2], [dx, dy] = gdzSpot(i, myth ? ALL.length : Math.ceil(ALL.length / 2), myth ? 11.5 : 8.5); if (off.includes(id)) { k.hold(2.4, id).at(6, id, OFF[0], OFF[1]); return; } k.hold(2.4, id).at(6.4, id, m[0] + dx, m[1] + dy); });
    k.hold(7.8, V).at(14.4, V, M[0][0] - 10, M[0][1] - 5);
    k.arc({ x: BP[0], y: BP[1], r0: 2, v: 9, d: 4, a0: 0, a1: 360, t0: 10, t1: L, color: '#ff5a2a', legend: 'Blast Wave: lethal; bounce over it' });
    const tw = 10 + (Math.hypot(M[0][0] - BP[0], M[0][1] - BP[1]) - 2 - 12) / 9, th = 10 + (Math.hypot(OFF[0] - BP[0], OFF[1] - BP[1]) - 2) / 9;
    if (!fail) k.call(tw - 0.6, tw + 2.8, 'Bounce!', { x: M[0][0], y: M[0][1] + 15, color: '#7ee36a', ink: '#0a1a06' });
    if (fail) { ulHit(k, 'm3', th, 'Blast Wave'); k.oops('m3', th); k.step(0.4).step(1.8).step(th);
      k.pause(th + 0.3, 'This melee wasn\'t on the mushroom when the wave arrived: the Blast Wave hits for millions.', { on: 'm3', r: 9 });
      return k.done({ title: 'Mistake: off the mushroom when the wave hits', focus: { x: -4, y: -6, r: 32 }, badLabel: 'caught by the wave' }); }
    k.ring1([V]).step(0.4).step(1.8).step(7.6).step(tw);
    k.pause(6.6, myth ? 'The marked player takes the bomb to the edge, across from the one mushroom. Everyone else gathers on the mushroom and bounces just as the wave reaches it.' : 'The marked player takes the bomb to the edge, across from the mushrooms. Everyone else gathers on a mushroom and bounces just as the wave reaches it.', { x: -6, y: -6, r: 30 });
    return k.done({ title: 'Explosive Surprise: bounce over the wave', focus: { x: -4, y: -6, r: 32 }, hlLabel: 'the player with the bomb' });
  },
  // Iku's turn, Frostfire Volley: missiles at several players (ranged: Burning Flames, melee: Piercing Frost), 10 yards round each, each
  // leaving a fire or frost patch; a missile striking someone who still has either debuff sets off Elemental Explosion (a huge raid hit).
  // Fire goes to one side, frost to the other, at the edge; then frost players put out fire patches and fire players frost patches, a pair
  // at a time (each clear is a raid hit) (fail: a second missile lands next to someone still debuffed)
  frostfire(fail) {
    // (Gebbo and Nama tanked together in the south, Iku on her own to the north-east; the raid north of the pair)
    const L = 14, k = gdzKit(LE, L), G = leG(260), N = [6, -31], I = [30, 18]; k.boss('ge', 'Trader Gebbo', 0, G[0], G[1]).boss('ik', 'Scrollsage Iku', 0, I[0], I[1]).boss('na', 'First Mate Nama', 0, N[0], N[1]);
    k.ring({ on: 'ik', r: 6, fx: 'zone', t0: 0, dur: L, color: '#ffd23b', fill: 'rgba(255,210,59,.12)', cn: 'Mor\'zahi\'s Command', legend: 'her turn: she has her ultimate' });
    leRaid(k, 0, N, G, { f: 90 }); k.at(0, 't2', 34, 22);
    k.cast('ik', 'Frostfire Volley', 0.5, 3.4);
    // (three pairs round the raid's edge, a fire spot and a frost spot 12 yards apart: ranged take fire, melee frost)
    const FI = ['r6', 'r3', 'r1'], FR = ['m7', 'm2', 'm5'], FS = [[-26, -4], [-4, 8], [28, -3]], RS = [[-28, -16], [8, 6], [30, -16]];
    const tEnd = (i) => (fail ? L : 7.4 + i * 1.4);
    [[FI, FS, '#ff8a3b', 'Burning Flames', '#ff6a2a', 'rgba(255,106,42,.35)', 'Fire Patch', 'a fire patch: frost puts it out'], [FR, RS, '#7fd8ff', 'Piercing Frost', '#5ab8ff', 'rgba(90,184,255,.35)', 'Frost Patch', 'a frost patch: fire puts it out']].forEach(([ids, S, c, deb, pc, pf, pn, pl]) =>
      ids.forEach((id, i) => { k.hold(0.6, id).at(3.2, id, S[i][0], S[i][1]); k.ring({ on: id, r: 10, fx: 'burst', t0: 2.8, at: 3.6, dur: 0.8, color: c, cn: 'Frostfire missile', legend: 'a missile: 10 yards round the target' });
        k.ring({ on: id, r: 2.4, fx: 'debuff', t0: 3.6, dur: tEnd(i) - 3.6, color: c, cn: deb, legend: deb + ': never let a missile hit you while you have it' });
        k.ring({ x: S[i][0], y: S[i][1], r: 5, fx: 'puddle', t0: 3.6, dur: tEnd(i) - 3.6, color: pc, fill: pf, cn: pn, legend: pl }); }));
    k.call(0.6, 3.2, 'Fire and frost: spread round the edge', { x: 0, y: 20, color: '#ffd23b', ink: '#1a1400' });
    if (fail) { const T2 = 'h3', q = [FS[1][0] + 5, FS[1][1] - 3]; k.hold(4, T2).at(6.4, T2, q[0], q[1]); k.cast('ik', 'Frostfire Volley', 5.4, 7.2); k.ring({ on: T2, r: 10, fx: 'burst', t0: 6.6, at: 7.4, dur: 0.8, color: '#ff3b3b', cn: 'Frostfire missile', legend: 'a missile: 10 yards round the target' });
      gdzFailBlast(k, 7.6, 'Elemental Explosion: a huge raid hit', 0, 20, ['m4', 'r7'], 'Elemental Explosion'); k.oops(T2, 7.4); k.step(0.5).step(3.6).step(7.4);
      k.pause(7.8, 'The next volley\'s target stood right next to a player who still had Burning Flames. The missile hit them both: Elemental Explosion on the whole raid.', { on: T2, r: 12 });
      return k.done({ title: 'Mistake: a missile next to a debuffed player', focus: { x: 0, y: -6, r: 32 }, badLabel: 'too close' }); }
    // (clearing, one pair at a time: the frost player steps into the fire patch, the fire player into the frost patch)
    [0, 1, 2].forEach((i) => { const t = 7.4 + i * 1.4; k.hold(t - 1.6, [FR[i], FI[i]]).at(t, FR[i], FS[i][0] + 1.5, FS[i][1] - 1.5).at(t, FI[i], RS[i][0] - 1.5, RS[i][1] + 1.5); });
    k.call(5.8, 10.6, 'Clear one pair at a time: frost into fire, fire into frost', { x: 0, y: 20, color: '#ffd23b', ink: '#1a1400' });
    k.ring1(FI.concat(FR)).step(0.5).step(3.6).step(5.8);
    k.pause(4.2, 'The fire and frost players spread round the edge of the raid in pairs, 12 yards apart. Now clear, one pair at a time: frost steps into the fire patch, fire into the frost patch.', { x: 0, y: -4, r: 30 });
    return k.done({ title: 'Frostfire Volley: spread, then clear in pairs', focus: { x: 0, y: -6, r: 34 }, hlLabel: 'players with fire or frost' });
  },
  // Nama's turn, Mighty Thud: three players are marked and she leaps to each in turn, split between everyone within 6 yards, with a
  // knockback (nobody there: a raid hit); each landing leaves Aftershock ground. The marks stand in a line; the raid stacks on the near side
  // of each landing, so the knockback throws them on to the next (fail: the raid doesn't reach the last landing)
  thud(fail) {
    const L = 13, k = gdzKit(LE, L), LS = [[-20, 15], [-6, 12], [9, 11]], MK = ['r2', 'h3', 'm6']; k.boss('ge', 'Trader Gebbo', 0, 20, 19).boss('ik', 'Scrollsage Iku', 0, 30, 0).boss('na', 'First Mate Nama', 0, -2, 25);
    k.ring({ on: 'na', r: 6, fx: 'zone', t0: 0, dur: 3, color: '#ffd23b', fill: 'rgba(255,210,59,.12)', cn: 'Mor\'zahi\'s Command', legend: 'her turn: she has her ultimate' }); k.cast('na', 'Mighty Thud', 0.4, 3);
    k.at(0, 't1', 33, 3).at(0, 't2', -1, 30);
    const REST = ['m1', 'm2', 'm3', 'm4', 'm5', 'm7', 'h1', 'h2', 'h4', 'r1', 'r3', 'r4', 'r5', 'r6', 'r7'];
    // (the marks spread on the line; everyone else stacks on the near side of the first landing)
    MK.forEach((id, i) => k.at(0, id, LS[i][0] + 2, LS[i][1] - 7).hold(0.5, id).at(2.6, id, LS[i][0], LS[i][1]));
    REST.forEach((id, i) => { const [dx, dy] = gdzSpot(i, REST.length, 8); k.at(0, id, LS[0][0] + 9 + dx * 1.1, LS[0][1] - 9 + dy * 1.1).hold(0.5, id).at(2.8, id, LS[0][0] + 2 + dx * 0.85, LS[0][1] - 0.4 + dy * 0.85); });
    const LT = [3.2, 6, 8.8]; LT.forEach((t, j) => { const P = LS[j], pv = j ? LS[j - 1] : [-2, 25]; k.boss('na', 'First Mate Nama', t - 0.5, pv[0], pv[1]).boss('na', 'First Mate Nama', t, P[0], P[1]);
      k.ring({ x: P[0], y: P[1], r: 6, fx: 'soak', t0: 0.6 + (j ? LT[j - 1] : 0), at: t, dur: t - (0.6 + (j ? LT[j - 1] : 0)) + 0.4, color: '#e6b450', cn: 'Mighty Thud', legend: 'a landing: split between everyone within 6 yards, then a knockback' });
      k.ring({ x: P[0], y: P[1], r: 6, fx: 'puddle', t0: t + 0.4, dur: L - t - 0.4, color: '#9a7a4a', fill: 'rgba(154,122,74,.3)', cn: 'Aftershock', legend: 'Aftershock: quaking ground, stay out' });
      if (fail && j === 2) return;
      const nx = j < 2 ? LS[j + 1] : [LS[2][0] + 12, LS[2][1] - 4], dir = Math.atan2(nx[1] - P[1], nx[0] - P[0]) * 180 / Math.PI;
      REST.concat(MK.slice(0, j + 1)).forEach((id) => { const p = k.posAt(id, t), q = nzAdd(p, dir, j < 2 ? 12.5 : 10); k.hold(t + 0.05, id).at(t + 1.15, id, q[0], q[1]); }); });
    k.call(0.6, 3, 'Stack here: the knockback carries you on', { x: LS[0][0], y: LS[0][1] - 12, color: '#e6b450', ink: '#141006' });
    if (fail) { const id = MK[2]; k.hold(8.9, id); ulHit(k, id, 8.8, 'Took it alone'); k.oops(id, 8.8); k.step(0.4).step(3.2).step(8.8);
      k.pause(9.1, 'The raid stopped after the second landing. Nama\'s last leap hit the marked player alone: the whole hit on one person.', { on: id, r: 10 });
      return k.done({ title: 'Mistake: the last landing left alone', focus: { x: -4, y: 12, r: 24 }, badLabel: 'left alone' }); }
    k.ring1(MK).step(0.4).step(3.2).step(6).step(8.8);
    k.pause(2.9, 'The three marked players stand in a line. Everyone else stacks on the near side of the first landing: each knockback throws the raid on to the next one.', { x: -6, y: 12, r: 20 });
    return k.done({ title: 'Mighty Thud: ride the knockbacks down the line', focus: { x: -4, y: 12, r: 24 }, hlLabel: 'the three marked players' });
  },
};
const LE_FAIL = {
  pair: { name: 'All three together', what: 'Nama is dragged within 30 yards of the other two: with all three that close they take 99% less damage.', do: ['Gebbo walks, Iku with him.', 'Nama is brought in close.', 'United Defense: 99% less damage.'], map: () => LE_M.pair(true) },
  crates: { name: 'A crate left to explode', what: 'Nobody breaks one crate: after a while it explodes, a big hit on the whole raid.', do: ['Crates land.', 'One is never broken.', 'It explodes: Relic Rupture.'], map: (d) => LE_M.crates(true, d) },
  shell: { name: 'Shells baited into the raid', what: 'The melee picked baits the shells in toward the ranged: they fly through the raid and stun several players.', do: ['Shell Spin picks a melee.', 'They step toward the raid.', 'The shells stun the ranged.'], map: () => LE_M.shell(true) },
  blink: { name: 'Blink Nova in the raid', what: 'The marked ranged stays in the middle: Iku lands on everyone and the nova hits at full strength.', do: ['A ranged is marked.', 'They stay in the raid.', 'Full damage on everyone.'], map: () => LE_M.blink(true) },
  kicks: { name: 'A missed kick', what: 'One Icebound Flames isn\'t kicked: it goes off on a player and a healer has to dispel it.', do: ['Iku casts.', 'Nobody kicks it.', 'It lands: dispel.'], map: () => LE_M.kicks(true) },
  swap: { name: 'No swap after Shredding Shards', what: 'The tank keeps Iku with Shredding Shards on: the next Icebound Flames lands on them.', do: ['Shredding Shards.', 'No swap.', 'Icebound Flames on that tank.'], map: () => LE_M.swap(true) },
  fish: { name: 'The fish fed too late', what: 'The fish is held too long: Mor\'zahi reaches full energy and Final Ascension wipes the raid.', do: ['Mor\'zahi climbs to 100.', 'Nobody feeds the fish.', 'Final Ascension: a wipe.'], map: () => LE_M.fish(true) },
  bomb: { name: 'Off the mushroom when the wave hits', what: 'A player isn\'t on the mushroom when the Blast Wave arrives: it hits for millions.', do: ['The bomb blows.', 'One player is off the mushroom.', 'The wave hits them.'], map: (d) => LE_M.bomb(true, d) },
  frostfire: { name: 'A missile next to a debuffed player', what: 'A second-volley target stands next to someone who still has Burning Flames: Elemental Explosion hits the whole raid.', do: ['The first volley lands.', 'A new target stands too close.', 'Elemental Explosion.'], map: () => LE_M.frostfire(true) },
  thud: { name: 'The last landing left alone', what: 'The raid doesn\'t reach the last landing: Nama\'s leap hits the marked player alone.', do: ['The first two landings are soaked.', 'The raid stops.', 'The last mark takes it alone.'], map: () => LE_M.thud(true) },
};
// ---- the whole fight, by Wolfthorn's Mythic kill's clock (5:36)
const LE_BEATS = {
  start: { name: 'The pull (Iku to Gebbo, Nama apart)', do: ['Iku\'s tank brings her right next to Gebbo, and the melee cleave both. Nama\'s tank takes her 30+ yards behind.', 'Bloodlust on the pull. Hit Gebbo early: you won\'t be near him much later.'],
    run() { const k = gdzKit(LE, 4); leHome(k, -110, 'IG'); k.ring1(['t1', 't2']).step(0.2); } },
  eyes: { name: 'Evil Eyes (Dodge the swirls)', do: ['Right after each fish, the statues fire swirls at the raid: step out of them.'],
    run() { const k = gdzKit(LE, 4); leHome(k, 120, 'IN'); [[14, 30], [33, 2], [-6, 2]].forEach(([x, y]) => k.ring({ x, y, r: 4, fx: 'burst', t0: 0.4, at: 2, dur: 0.8, color: '#c084ff', cn: 'Evil Eyes', legend: 'a statue\'s swirl: step out' })); k.step(0.2); } },
  kill: { name: 'The kill (Even health)', do: ['Bring all three down together: one dying early enrages the others.', 'If one has to enrage, let it be Gebbo: a tank taunts and kites him.'],
    run() { const k = gdzKit(LE, 5); leHome(k, -10, 'IG'); ['ge', 'ik', 'na'].forEach((b) => k.ring({ on: b, r: 6, fx: 'burst', t0: 1.4, at: 2, dur: 0.8, color: '#ffd23b', cn: 'Kill', legend: 'the kill' })); k.call(2.3, 4.6, 'Kill', { x: 0, y: 0 }); k.step(0.3); } },
};
const LE_SIM = [
  { at: 0, beat: 'start' }, { at: 5, mech: 'pair', label: 'Two together, one apart' }, { at: 10, mech: 'blink', label: 'Blink Nova 1' }, { at: 18, mech: 'shell', label: 'Shell Spin' }, { at: 20, mech: 'crates', label: 'Throw Junk 1' },
  { at: 30, mech: 'swap', label: 'Shredding Shards 1' }, { at: 36, mech: 'kicks', label: 'Icebound Flames' }, { at: 45, mech: 'fish', label: 'The fish: Gebbo\'s turn', o: { to: 'ge' } },
  { at: 57, beat: 'eyes', ph: 1 }, { at: 66, mech: 'bomb', ph: 1, label: 'Explosive Surprise 1' }, { at: 93, mech: 'swap', ph: 1, label: 'Shredding Shards 2' }, { at: 98, mech: 'bomb', ph: 1, label: 'Explosive Surprise 2' },
  { at: 133, mech: 'blink', label: 'Blink Nova 3' }, { at: 143, mech: 'crates', label: 'Throw Junk 4' }, { at: 153, mech: 'swap', label: 'Shredding Shards 3' }, { at: 170, mech: 'fish', ph: 2, label: 'The fish: Iku\'s turn', o: { to: 'ik' } },
  { at: 181, beat: 'eyes', ph: 2 }, { at: 195, mech: 'frostfire', ph: 2, label: 'Frostfire Volley 1' }, { at: 217, mech: 'swap', ph: 2, label: 'Shredding Shards 4' }, { at: 222, mech: 'frostfire', ph: 2, label: 'Frostfire Volley 2' },
  { at: 257, mech: 'blink', label: 'Blink Nova 6' }, { at: 267, mech: 'crates', label: 'Throw Junk 8' }, { at: 277, mech: 'swap', label: 'Shredding Shards 5' }, { at: 290, mech: 'fish', ph: 3, label: 'The fish: Nama\'s turn', o: { to: 'na' } },
  { at: 299, beat: 'eyes', ph: 3 }, { at: 308, mech: 'thud', ph: 3, label: 'Mighty Thud' }, { at: 336, beat: 'kill', ph: 3 },
];
const LE_DUR = { 'm:pair': 0, 'm:blink': 7, 'm:shell': 4, 'm:crates': 25, 'm:swap': 3, 'm:kicks': 2, 'm:fish': 15, 'm:bomb': 12, 'm:frostfire': 10, 'm:thud': 14, 'b:start': 2, 'b:eyes': 5, 'b:kill': 0 };
const LE_SEV = { 'm:pair': 1, 'm:blink': 2, 'm:shell': 1, 'm:crates': 2, 'm:swap': 2, 'm:kicks': 1, 'm:fish': 3, 'm:bomb': 3, 'm:frostfire': 3, 'm:thud': 3, 'b:start': 1, 'b:eyes': 1, 'b:kill': 1 };
GDZ['The Lost Explorers'] = {
  upd: ['12.1', 'Oct 21, 2026'],
  stepRoles: {
    'Two together, one apart (United Defense)': ['t', 'd', 't'], 'Crates (Break them in pairs)': ['', 'd', '', 'd'], 'Shell Spin (Take it outside)': ['d', 'd', ''], 'Blink Nova (Out in front)': ['d', '', ''],
    'Icebound Flames (Kick every one)': ['', 'td', 'h'], 'Shredding Shards (Swap at once)': ['t', 't', 't'], 'The fish (Feed it at 95)': ['d', '', '', ''],
    'Explosive Surprise (Bounce over the wave)': ['', '', '', ''], 'Frostfire Volley (Spread, then clear in pairs)': ['', '', '', ''], 'Mighty Thud (Ride the knockbacks)': ['', '', ''],
  },
  sum: 'Three bosses: two tanked together, the third 30+ yards away, and whichever boss has eaten the fish is the one on its own. Break crates in pairs, feed the fish at 95 energy, survive each boss\'s ultimate, and bring all three down together.',
  m: { sim: LE_SIM, simDur: LE_DUR, simSev: LE_SEV, beats: LE_BEATS,
    simAlways: ['Two bosses together, one 30+ yards away: never all three within 30 yards.', 'The boss that ate the fish is the one kept apart.', 'Crates two at a time, a few seconds apart: each one makes the whole raid bleed.', 'Kick every Icebound Flames; swap tanks on every Shredding Shards.'],
    source: 'Tactyks\' Mythic Lost Explorers video', sum: 'Heroic with tighter tuning: crates make the whole raid bleed, there are fewer of them, and Gebbo\'s turn has only one mushroom.' },
  facts: [['Bosses', '3: Gebbo, Iku, Nama'], ['Bloodlust', 'On the pull'], ['Healers', '4', 'm'], ['Hardest part', 'The ultimates'], ['Fight length', 'About 5 to 6 minutes', 'm']],
  phases: [
    { id: 'p1', name: 'Phase 1: before the first fish', sum: 'All fight long: two bosses together, one apart, crates, shells, Blink Nova, kicks and tank swaps. Then the fish, three times.',
      mechs: [
        { id: 'pair', fail: LE_FAIL.pair, name: 'Two together, one apart (United Defense)', spell: 'United Defense', what: 'On Heroic and up, if all three are within 30 yards of each other they take 99% less damage. Gebbo can\'t be tanked: he walks a big circle round the room all fight.',
          do: ['Iku\'s tank keeps her right next to Gebbo as he walks. Melee cleave both.', 'Ranged stand in the middle and hit all three.', 'Nama\'s tank keeps her 30+ yards behind the pair.'],
          m: { plan: ['Hit Gebbo early: you won\'t be near him much later.', 'Bosses that die early enrage the others (Gebbo\'s shovel, Iku\'s Cataclysmic Invocation, Nama\'s Relentless Escalation): keep their health even.', 'Evokers, Boomkins, Shadow Priests and Warlocks can hit all three from the middle.'] },
          map: () => LE_M.pair() },
        { id: 'crates', fail: LE_FAIL.crates, name: 'Crates (Break them in pairs)', spell: 'Throw Junk', what: 'Gebbo throws crates onto marked spots. Walking over one breaks it and bleeds you (Splinters; on Mythic it bleeds the whole raid). One crate holds the fish. A crate left too long explodes.',
          do: ['Marked spots: crates are landing. Step out of them.', 'Two assigned breakers walk over two crates together.', 'Wait a few seconds for the bleed to fade, then the next two.', 'The fish carrier picks up the fish. Everyone else watches their feet.'],
          m: { plan: ['Breakers: the off-tank with a mobile ranged, then two mobile ranged. The fish carrier is someone else.', 'Melee: stepping on a crate by accident is the most common wipe here.', 'Don\'t break crates during Gebbo\'s bomb.'] },
          map: (d) => LE_M.crates(false, d) },
        { id: 'shell', fail: LE_FAIL.shell, name: 'Shell Spin (Take it outside)', spell: 'Shell Spin', what: 'Nama throws three spinning shells in a cone at a random melee. Anyone they touch is stunned for 4 seconds.',
          do: ['The melee picked steps to the outside of the room.', 'The shells fly outward, away from the ranged.', 'Then step out of their line.'],
          m: { plan: ['Call every Shell Spin.', 'When Nama is the boss on her own, the shells come from far away: just dodge them.'] },
          map: () => LE_M.shell() },
        { id: 'blink', fail: LE_FAIL.blink, name: 'Blink Nova (Out in front)', spell: 'Blink Nova', what: 'Iku marks a ranged player and teleports to them 7 seconds later. The nova hits the whole raid, less the farther away you are.',
          do: ['Marked? Walk out in front of the raid, toward the edge.', 'Iku lands on you: the nova is weaker for everyone else.', 'Her tank picks her back up.'],
          map: () => LE_M.blink() },
        { id: 'kicks', fail: LE_FAIL.kicks, name: 'Icebound Flames (Kick every one)', spell: 'Icebound Flames', what: 'Iku casts Icebound Flames over and over. A kick stops it; if one goes off, it lands on a player and needs a dispel.',
          do: ['Kick on a set order: her tank first, then melee with short kicks.', 'Next kicker ready as soon as one lands.', 'Healers: if one goes off, dispel it.'],
          map: () => LE_M.kicks() },
        { id: 'swap', fail: LE_FAIL.swap, name: 'Shredding Shards (Swap at once)', spell: 'Shredding Shards', what: 'Iku\'s hit raises her tank\'s magic damage taken. Nama\'s hits stack Steady Strikes on hers, more physical damage each time; above about 25 stacks her hits kill.',
          do: ['Shredding Shards: swap right away.', 'The tanks trade bosses: each taunts the other\'s.', 'Never wait for a Shell Spin or a Blink to swap.'],
          map: () => LE_M.swap() },
        { id: 'fish', fail: LE_FAIL.fish, name: 'The fish (Feed it at 95)', spell: 'Disgusting Fish', what: 'Mor\'zahi\'s energy climbs to Final Ascension, a wipe. Feeding the fish from Gebbo\'s crates to one of the bosses resets it, and gives that boss its ultimate for a while. Each boss eats once.',
          do: ['The carrier picks the fish out of a crate.', 'At about 95 energy, feed it to the next boss.', 'Mor\'zahi starts over; that boss gets its ultimate.', 'That boss becomes the one kept apart.'],
          m: { plan: ['The raid\'s order: Gebbo, then Iku, then Nama. Any order works (Tactyks feeds Iku, Nama, then Gebbo; the written guides Gebbo, Nama, Iku).', 'Northern Sky Raid Tools counts the energy down.', 'Right after each fish, the statues fire swirls (Evil Eyes): dodge them.'] },
          map: (d, o) => LE_M.fish(false, o) },
      ] },
    { id: 'gebbo', name: 'Gebbo\'s turn', sum: 'After his fish Gebbo throws bombs: two rounds of Explosive Surprise. Iku and Nama are tanked together, away from his circle.',
      mechs: [
        { id: 'bomb', fail: LE_FAIL.bomb, name: 'Explosive Surprise (Bounce over the wave)', spell: 'Explosive Surprise', what: 'Gebbo tosses a Bouncy Mushroom and marks a player: 10 seconds later a bomb lands on them, then blows, sending a deadly Blast Wave across the room. A mushroom bounces you high into the air, over the wave.',
          do: ['The marked player takes the bomb to the edge, across from the mushroom.', 'Everyone else gathers on the mushroom. Don\'t touch it yet.', 'The bomb lands, then blows: the wave rolls out.', 'Touch the mushroom just as the wave reaches it: bounce over.'],
          m: { what: 'Gebbo tosses a single Bouncy Mushroom and marks a player: 10 seconds later a bomb lands on them, then blows, sending a deadly Blast Wave across the room. The mushroom bounces you high into the air, over the wave.', plan: ['Mythic has one mushroom: bait it to a good spot, and don\'t waste it.', 'The next mushroom comes near you during the bounce: stay near Gebbo.', 'Heroic and up: the bomb leaves a fire puddle.'] },
          map: (d) => LE_M.bomb(false, d) },
      ] },
    { id: 'iku', name: 'Iku\'s turn', sum: 'After her fish Iku casts Frostfire Volley, twice. Gebbo and Nama are tanked together, and Iku on her own.',
      mechs: [
        { id: 'frostfire', fail: LE_FAIL.frostfire, name: 'Frostfire Volley (Spread, then clear in pairs)', spell: 'Frostfire Volley', what: 'Missiles hit several players: ranged get Burning Flames, melee Piercing Frost, and everyone within 10 yards takes the hit. Each leaves a fire or frost patch. A missile hitting someone who still has either debuff sets off Elemental Explosion on the whole raid.',
          do: ['Fire on the ranged, frost on the melee: spread round the edge of the raid in fire and frost pairs, 12 yards apart.', 'Keep away from the next volley\'s targets while you still have your debuff.', 'Clear: frost steps into the fire patch, fire into the frost patch.', 'One pair at a time: each clear is a raid hit.'],
          m: { plan: ['The best moment for a personal defensive.', 'Ranged: a tank with frost needs a fire patch to clear on: leave them one.', 'Patches stay if their player dies.'] },
          map: () => LE_M.frostfire() },
      ] },
    { id: 'nama', name: 'Nama\'s turn', sum: 'After her fish Nama casts Mighty Thud. Gebbo and Iku are tanked together, Nama on her own. Then bring all three down together.',
      mechs: [
        { id: 'thud', fail: LE_FAIL.thud, name: 'Mighty Thud (Ride the knockbacks)', spell: 'Mighty Thud', what: 'Nama marks three players and leaps to each in turn. Each landing is split between everyone within 6 yards and knocks them back; a landing that hits nobody hits the whole raid. Each leaves quaking ground behind.',
          do: ['The three marked players stand in a line.', 'Everyone stacks on the near side of the first landing.', 'Each knockback throws the raid on to the next landing.'],
          m: { plan: ['Don\'t let crate bleeds or a Blink Nova land on top of the soaks: that\'s the scariest moment of the fight. Spirit Link or defensives if they do.'] },
          map: () => LE_M.thud() },
      ],
      tiles: [
        { name: 'The kill (Even health)', do: 'Bring all three down together: one dying early enrages the others. If one has to enrage, let it be Gebbo: a tank taunts and kites him.' },
      ] },
  ],
  roles: {
    t: ['Iku next to Gebbo, Nama 30+ yards away; the boss with its ultimate is the one apart.', 'Swap on every Shredding Shards: trade bosses.', 'Kick Icebound Flames first in the order.'],
    h: ['Crates bleed the whole raid on Mythic: heal through each pair.', 'Dispel any Icebound Flames that lands.', 'Cooldowns for Frostfire clears and the Mighty Thud soaks.'],
    d: ['Melee: never step on a crate by accident.', 'Shell Spin on you: take it to the outside.', 'Blink Nova on you: out in front, toward the edge.', 'Frostfire: spread in fire and frost pairs; clear one pair at a time.'],
  },
};
// ---- Something wrong here? (your OK, Oct 20): Report a problem, with this guide, its difficulty and the mechanic filled in ----
// (only where reports can be sent: the website)
const gdzWrong = (name) => (typeof REPORT_ON === 'function' && REPORT_ON() ? '<button type="button" class="gdz-wrong" data-about="' + esc(name) + '">Something wrong here?</button>' : '');
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.gdz-wrong'); if (!b) return; e.preventDefault(); e.stopPropagation();
  S.rpAbout = 'Boss guides · ' + S.gdzBoss + ' · ' + (S.gdzDiff === 'm' ? 'Mythic' : 'Heroic') + ' · ' + b.dataset.about; openReport(); });
// ---- From a pull to the guide (your ask, Oct 20): a Debriefing mechanic's "How to do it" opens the guide right at that mechanic ----
// (Debriefing's sections, by id, to the guide's mechanic (its id) or tile (its name's start))
const GDZ_SEC = { "Ula'tek": { eggs: 'eggs', coils: 'coils', waves: 'waves', tank: 'wrath', incub: 'wretch', wretch: 'wretch', amps: 'heart', fangs: 'fangs', doomscale: 'doomscales', kicks: 'doomscales', bite: 'bite', shriek: 'Blightscale Shrieker' }, 'The Coiled Altar': { orbs: 'orbs', soakq: 'axe', dmghost: 'dm', gloom: 'bombs', inter: 'frags', vf: 'Venomfang', shield: 'Eternal Nightfall', addsets: 'Spiritcackle', tankfront: 'Soul Sever' } };
function gdzHowTo(secId) {
  gdzUnlock();
  const bo = S.rep && S.rep.item && S.rep.item.boss, b = bo === 'The Bargained Crown' ? 'The Coiled Altar' : bo, t = (GDZ_SEC[b] || {})[secId]; if (!t || !GDZ[b]) return '';
  return '<button type="button" class="btn sm gdz-howto" data-gb="' + esc(b) + '" data-gt="' + esc(t) + '" style="margin:2px 0 10px">How to do it, in the guide ›</button>';
}
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.gdz-howto'); if (!b) return; e.preventDefault();
  S.gdzGo = b.dataset.gt; openGuides(b.dataset.gb, S.rep && S.rep.item && S.rep.item.diffId === 16 ? 'm' : 'h'); });
// (on the guide: show that part, open it in Quick, scroll to it and make it glow)
function gdzGoTo(root) {
  if (!S.gdzGo) return; const g = S.gdzGo; S.gdzGo = null;
  setTimeout(() => { const el = root.querySelector('.gdz-m[data-mid="' + g + '"]') || [...root.querySelectorAll('.gdz-tile')].find((t) => ((t.querySelector('h5') || {}).textContent || '').trim().startsWith(g)); if (!el) return;
    const sec = el.closest('.gdz-sec'); if (sec && sec.hidden && root._showSec) root._showSec(sec); if (root.classList.contains('gdz-q') && el.classList.contains('gdz-m')) el.classList.add('open');
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); el.classList.remove('gdz-flash'); void el.offsetWidth; el.classList.add('gdz-flash'); }, 80);
}
// ---- Putting it all together, written out (your idea, Oct 20) ----
// (each moment of the real kill: when, name, its own instruction, what to do, how dangerous, and what else is going on; by the
// kill's clock and name, so the video's list can find its own)
function gdzFightRows(G) {
  if (!G.sim) return []; const clk = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0'), byId = {}, DUR = G.simDur || {}, SEV = G.simSev || {};
  G.phases.forEach((p) => (p.mechs || []).forEach((m) => { if (m.id) byId[m.id] = m; }));
  const first = (x) => String((Array.isArray(x) ? x[0] : x) || '').split(/(?<=\.)\s+/)[0], nm = (x) => x.name.replace(/ \(.*$/, '').replace(/ \d$/, '');
  const ev = G.sim.map((e) => { const m = e.mech ? byId[e.mech] : null, b = e.beat ? (G.beats || {})[e.beat] : null, key = m ? 'm:' + m.id : 'b:' + e.beat, name = e.label || (m ? m.name : b ? b.name : '');
    return { t: e.at, ph: e.ph, key, name, d: DUR[key] != null ? DUR[key] : 8, sv: SEV[key] || 2, line: first((e.o && e.o.do) || (m ? m.line || m.do : b ? b.do : '')) }; }).filter((x) => x.name);
  ev.forEach((x) => { x.nm = nm(x); x.ins = /\((.*)\)$/.test(x.name) ? x.name.match(/\((.*)\)$/)[1] : '';
    x.ovs = ev.filter((y) => y !== x && y.d > 0 && x.d > 0 && y.t < x.t + x.d && y.t + y.d > x.t && nm(y) !== nm(x)).filter((y, j, a) => a.findIndex((z) => nm(z) === nm(y)) === j).map((y) => ({ sv: Math.min(x.sv, y.sv), txt: y.t < x.t ? nm(y) + ' (still going until ' + clk(y.t + y.d) + ')' : nm(y) + ' at ' + clk(y.t) })).sort((a, b) => b.sv - a.sv); /* (one line per mechanic) */
    x.top = x.ovs.reduce((a, o) => Math.max(a, o.sv), 0); });
  return ev;
}
// (how long the real kill behind the timeline lasted: the one number the facts, the timeline and the written version all show. Its kill
// moment, else when its last mechanic ends)
function gdzKillLen(G) { const s = G.sim || []; if (!s.length) return 0; const kl = s.find((e) => e.beat === 'kill' || e.beat === 'end'); if (kl) return kl.at;
  const DUR = G.simDur || {}, d = (e) => { const k = e.mech ? 'm:' + e.mech : 'b:' + e.beat; return DUR[k] != null ? DUR[k] : 8; }; return Math.max(...s.map((e) => e.at + d(e))); }
// (several things at once: the label says two only when it is two)
const gdzOvw = (top, n, minor) => top === 3 ? (n > 1 ? 'Several jobs at once, with a wipe risk' : 'Two wipe-level jobs at once') : top === 2 ? (n > 1 ? 'Busy: several jobs at once' : 'Busy: two jobs at once') : minor;
// the whole fight in order, phase by phase: when, what, one line on what to do, and what else is going on at that moment
function gdzFightText(G, D) {
  const clk = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0'), byId = {};
  G.phases.forEach((p) => (p.mechs || []).forEach((m) => { if (m.id) byId[m.id] = m; }));
  const first = (x) => String((Array.isArray(x) ? x[0] : x) || '').split(/(?<=\.)\s+/)[0];
  const always = (G.simAlways || []).length ? '<ul class="gdz-ftal">' + G.simAlways.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '';
  // (no real kill to time it by (Heroic): each phase's mechanics in order)
  if (!G.sim) { const rules = G.phases.flatMap((p) => p.tiles || []);
    return '<div class="gdz-ftext" hidden><p class="gdz-ftk">The mechanics of each phase, in the order they come.</p>' + always +
    (rules.length ? '<p class="gdz-ftk">Rules for this fight:</p><ul class="gdz-ftal">' + rules.map((m) => '<li><b>' + esc(m.name.replace(/ \(.*$/, '')) + ':</b> ' + esc(first(m.do || m.what)) + '</li>').join('') + '</ul>' : '') +
    G.phases.map((p) => '<div class="gdz-ftph"><h4>' + esc(p.name) + '</h4><ol>' +
    (p.mechs || []).map((m) => '<li><span class="gdz-ftt"></span><div><b>' + esc(m.name.replace(/ \(.*$/, '')) + '</b>' + (/\((.*)\)$/.test(m.name) ? '<span class="gdz-fti">' + esc(m.name.match(/\((.*)\)$/)[1]) + '</span>' : '') + '<p>' + esc(first(m.line || m.do || m.what)) + '</p></div></li>').join('') + '</ol></div>').join('') + '</div>'; }
  const DUR = G.simDur || {}, SEV = G.simSev || {};
  const ev = G.sim.map((e) => { const m = e.mech ? byId[e.mech] : null, b = e.beat ? (G.beats || {})[e.beat] : null, key = m ? 'm:' + m.id : 'b:' + e.beat, name = e.label || (m ? m.name : b ? b.name : '');
    return { t: e.at, ph: e.ph, key, name, d: DUR[key] != null ? DUR[key] : 8, sv: SEV[key] || 2, line: first((e.o && e.o.do) || (m ? m.line || m.do : b ? b.do : '')) }; }).filter((x) => x.name);
  // (how dangerous: 3 a miss can wipe the raid, 2 it can kill players, 1 minor; two things at once are as dangerous as the milder of the two)
  const CHIP = { 3: ['sv3', 'Wipe risk'], 2: ['sv2', 'Can kill'] };
  const nm = (x) => x.name.replace(/ \(.*$/, '').replace(/ \d$/, '');
  const phs = []; ev.forEach((x) => { if (!phs.length || phs[phs.length - 1].ph !== x.ph) phs.push({ ph: x.ph, list: [] }); phs[phs.length - 1].list.push(x); });
  const end = gdzKillLen(G) || (ev.length ? ev[ev.length - 1].t + ev[ev.length - 1].d : 0);
  return '<div class="gdz-ftext" hidden><p class="gdz-ftk">The whole fight in order, timed by a real kill (' + clk(end) + '). Coloured lines are moments when two things happen at once.</p>' +
    '<div class="gdz-ftlg"><span class="sv3">Red: a miss can wipe the raid</span><span class="sv2">Amber: a miss can kill players</span><span class="sv1">Grey: minor</span></div>' + always +
    phs.map((p, i) => { const t1 = i + 1 < phs.length ? phs[i + 1].list[0].t : end;
      return '<div class="gdz-ftph"><h4>' + esc((G.phases[p.ph] || {}).name || '') + '<span>' + clk(p.list[0].t) + '–' + clk(t1) + '</span></h4><ol>' + p.list.map((x) => {
        const ovs = ev.filter((y) => y !== x && y.d > 0 && x.d > 0 && y.t < x.t + x.d && y.t + y.d > x.t && nm(y) !== nm(x)).filter((y, j, a) => a.findIndex((z) => nm(z) === nm(y)) === j).map((y) => ({ sv: Math.min(x.sv, y.sv), txt: y.t < x.t ? esc(nm(y)) + ' (still going until ' + clk(y.t + y.d) + ')' : esc(nm(y)) + ' at ' + clk(y.t) }));
        const top = ovs.reduce((a, o) => Math.max(a, o.sv), 0), ins = /\((.*)\)$/.test(x.name) ? x.name.match(/\((.*)\)$/)[1] : '', ch = CHIP[x.sv];
        return '<li class="' + (top ? 'ov sv' + top : '') + '"><span class="gdz-ftt">' + clk(x.t) + '</span><div><b>' + esc(nm(x)) + '</b>' + (ch ? '<em class="gdz-ftc ' + ch[0] + '">' + ch[1] + '</em>' : '') + (ins ? '<span class="gdz-fti">' + esc(ins) + '</span>' : '') + (x.line ? '<p>' + esc(x.line) + '</p>' : '') +
          (ovs.length ? '<p class="gdz-fto"><b class="sv' + top + '">' + gdzOvw(top, ovs.length, 'Minor') + ':</b> ' + ovs.sort((a, b) => b.sv - a.sv).map((o) => '<span class="sv' + o.sv + '">' + o.txt + '</span>').join(', ') + '</p>' : '') + '</div></li>'; }).join('') + '</ol></div>'; }).join('') + '</div>';
}
// (the switch between the animated simulation and the written version)
function gdzReadTog(root) {
  const sec = root.querySelector('#gdz-all'); if (!sec) return; const tog = sec.querySelector('.gdz-wtog'), vid = sec.querySelector('.gdz-whole'), txt = sec.querySelector('.gdz-ftext'); if (!tog || !vid || !txt) return;
  const set = (v) => { vid.hidden = v === 'read'; txt.hidden = v !== 'read'; tog.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === v)); };
  tog.querySelectorAll('button').forEach((b) => (b.onclick = () => set(b.dataset.v)));
  set('watch'); /* (the video first, every time (your call, Oct 20)) */
}
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
  gdzUnlock();
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
  gdzUnlock(); gdzCss();
  const have = GDZ_ORDER.filter((b) => GDZ[b]);
  if (!S.gdzBoss || !GDZ[S.gdzBoss]) S.gdzBoss = S.rep && S.rep.item && GDZ[S.rep.item.boss] ? S.rep.item.boss : have[0];
  // Heroic or Mythic: each its own guide (your call, Oct 20: positions change a lot between them). It opens on the open pull's
  // difficulty. A part can be one difficulty only (only: 'h' / 'm') or change on one (h: { .. } / m: { .. } over the shared fields).
  if (!S.gdzDiff) S.gdzDiff = S.rep && S.rep.item && S.rep.item.diffId !== 16 ? 'h' : 'm';
  const D = S.gdzDiff, own = (o) => (!o || (o.only && o.only !== D) ? null : Object.assign({}, o, o[D] || {}));
  const boss = S.gdzBoss, G0 = GDZ[boss], G = G0 && own(G0);
  if (G) { G.phases = G.phases.map(own).filter(Boolean).map((p) => ({ ...p, mechs: (p.mechs || []).map(own).filter(Boolean), tiles: (p.tiles || []).map(own).filter(Boolean) })); G.facts = (G.facts || []).filter((x) => !x[2] || x[2] === D).map((x) => (x[0] === 'Enrage' ? ['Hard enrage', x[1]] : x));
    const kl = gdzKillLen(G); if (kl) { const was = (G.facts.find((x) => x[0] === 'Fight length') || [])[1] || '', more = was.includes(',') ? was.replace(/^[^,]*,\s*/, '') : '';
      G.facts = G.facts.filter((x) => x[0] !== 'Fight length').concat([['Fight length', Math.floor(kl / 60) + ':' + String(Math.floor(kl % 60)).padStart(2, '0') + ' on a real kill' + (more ? ' · ' + more : '')]]); }
    const FO = ['Phases', 'Bosses', 'Bloodlust', 'Healers', 'Hardest part', 'Fight length']; G.facts.sort((a, b) => (FO.indexOf(a[0]) + 1 || 99) - (FO.indexOf(b[0]) + 1 || 99)); }
  if (!G) { view('<div class="gdz"><p class="muted">No guides yet.</p></div>'); return; }
  const H = BOSS_HERO[boss], hero = H ? 'https://wow.zamimg.com/uploads/guide/header/' + H[0] + '.jpg' : '';
  const pick = '<nav class="gdz-pick" aria-label="Pick a boss">' + GDZ_ORDER.map((b) => '<button type="button" class="gdz-pb' + (b === boss ? ' on' : '') + (GDZ[b] ? '' : ' soon') + '" data-b="' + esc(b) + '"' + (GDZ[b] ? '' : ' disabled title="Coming soon"') + '>' + esc(b.replace(/ the (Soulcoiler|Malignant)$/, '')) + '</button>').join('') + '</nav>';
  const head = '<header class="gdz-hero"' + (hero ? ' style="--gdz-art:url(\'' + hero + '\');--gdz-pos:' + H[1] + '%"' : '') + '><div class="gdz-hin"><div class="gdz-kick">Boss guide</div><div class="gdz-diff" role="tablist" aria-label="Difficulty">' + [['h', 'Heroic'], ['m', 'Mythic']].map(([k, n]) => '<button type="button" role="tab" data-d="' + k + '" class="' + (k === D ? 'on' : '') + '" aria-selected="' + (k === D) + '">' + n + '</button>').join('') + '</div><h2>' + esc(boss) + '</h2><p>' + esc(G.sum) + '</p>' +
    (G.source ? '<p class="gdz-src">Based on ' + esc(G.source) + '.</p>' : '') + (G.upd ? '<p class="gdz-src gdz-upd">Updated for patch ' + esc(G.upd[0]) + ' on ' + esc(G.upd[1]) + '.</p>' : '') + '<div class="gdz-facts">' + (G.facts || []).map(([l, v]) => '<div class="gdz-fact"><span>' + esc(l) + '</span><b>' + esc(v) + '</b></div>').join('') + '</div></div></header>';
  const phNav = '<nav class="gdz-phn">' + G.phases.map((p, i) => '<a href="#gdz-' + p.id + '" class="gdz-phc"><i>' + (i + 1) + '</i><span>' + esc(p.name) + '</span></a>').join('<span class="gdz-arr" aria-hidden="true">›</span>') + (G.phases.some((p) => (p.mechs || []).some((m) => m.map)) ? '<span class="gdz-arr" aria-hidden="true">›</span><a href="#gdz-all" class="gdz-phc"><i>★</i><span>Putting it all together</span></a>' : '') + '</nav>';
  const keyRow = '<div class="gdz-key">' + Object.entries(GDZ_ROLE).map(([, [n, c, ic]]) => '<span><img src="https://wow.zamimg.com/images/wow/icons/medium/' + ic + '.jpg" alt="" style="border-color:' + c + '">' + n + '</span>').join('') + '<span class="gdz-keyn">On the maps. Positions are examples.</span></div>';
  let mi = 0; const maps = [];
  const sec = (p, i) => '<section class="gdz-sec" id="gdz-' + p.id + '"><div class="gdz-sh"><i>' + (i + 1) + '</i><div><h3>' + esc(p.name) + '</h3><p>' + esc(p.sum) + '</p></div></div>' +
    (p.mechs || []).map((m) => { const n = mi++; maps.push(m); return '<article class="gdz-m" data-mid="' + esc(m.id || '') + '">' + (m.map ? '<div class="gdz-mapc">' + (m.fail ? '<div class="gdz-mode" data-i="' + n + '"><button type="button" class="on" data-v="ok">✓ The right way</button><button type="button" data-v="bad">✕ Show a mistake</button></div>' : '') + '<div class="gdz-mm" data-i="' + n + '"></div></div>' : '') +
      '<div class="gdz-mt"><h4>' + spellIcon(0, m.spell || m.name.replace(/ \(.*$/, '')) + '<span>' + esc(m.name) + '</span></h4><p class="gdz-what">' + esc(m.what) + '</p>' +
      (m.do && m.do.length ? '<ol class="gdz-steps" data-i="' + n + '">' + m.do.map((d, j) => { const sr = (G.stepRoles || {})[m.name]; return '<li data-j="' + j + '"' + (sr && sr[j] != null ? ' data-r="' + sr[j] + '"' : '') + '><span>' + esc(d) + '</span></li>'; }).join('') + '</ol>' : '') +
      (m.plan && m.plan.length === 1 ? '<p class="gdz-plan1"><b>Plan</b>' + esc(m.plan[0]) + '</p>' : m.plan && m.plan.length ? '<details class="gdz-plan"><summary>Full plan <span>' + m.plan.length + ' details: who, where and when</span></summary><ul>' + m.plan.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></details>' : '') +
      (m.note ? '<div class="gdz-my"><b>' + (D === 'm' ? 'Mythic' : 'Heroic') + '</b>' + esc(m.note) + '</div>' : '') + gdzWrong(m.name) + '</div></article>'; }).join('') +
    ((p.tiles || []).length ? '<div class="gdz-tiles">' + p.tiles.map((t) => '<div class="gdz-tile"><h5>' + spellIcon(0, t.spell || t.name.replace(/ \(.*$/, '')) + '<span>' + esc(t.name) + '</span></h5><p>' + esc(t.do) + '</p>' + (t.note ? '<p class="gdz-tmy">' + esc(t.note) + '</p>' : '') + gdzWrong(t.name) + '</div>').join('') + '</div>' : '') + '</section>';
  const roles = G.roles ? '<section class="gdz-sec gdz-roles"><div class="gdz-sh"><i>★</i><div><h3>Your job, by role</h3><p>Every line for each role. The Your job box at the top shows the first three.</p></div></div><div class="gdz-rgrid">' +
    [['t', 'Tanks'], ['h', 'Healers'], ['d', 'DPS']].map(([k, n]) => '<div class="gdz-role gdz-r' + k + '"><h5>' + n + '</h5><ul>' + (G.roles[k] || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>').join('') + '</div></section>' : '';
  // Putting it all together (your idea, Oct 20): every map of this guide joined in fight order on one map, with each step
  // showing up as it plays and a chapter per mechanic to jump to
  const hasMaps = G.phases.some((p) => (p.mechs || []).some((m) => m.map));
  const whole = hasMaps ? '<section class="gdz-sec" id="gdz-all"><div class="gdz-sh"><i>★</i><div><div class="gdz-kick">Animated simulation</div><h3>Putting it all together</h3><p>' + (G.sim ? 'The whole fight in the order of a real kill. Quiet stretches are cut; the time shown is the real fight clock. Pick a moment to jump there.' : 'The whole fight on one map, start to finish. Each step shows up as it happens; pick a chapter to jump there.') + '</p></div></div>' +
    '<div class="gdz-wtog" role="tablist"><button type="button" data-v="watch" class="on">▶ Watch it</button><button type="button" data-v="read">☰ Read it</button></div>' +
    '<article class="gdz-m gdz-whole"><div class="gdz-mapc"><div class="gdz-mm" data-w="1"></div></div><div class="gdz-mt"><ol class="gdz-chaps"></ol></div></article>' + gdzFightText(G, D) + '</section>' : '';
  view('<div class="gdz">' + pick + head + phNav + keyRow + G.phases.map(sec).join('') + whole + roles + '<p class="gdz-foot">' + (D === 'm' ? 'Mythic' : 'Heroic') + ' guide. ' + (G.source ? 'Based on ' + esc(G.source) + ', in our own words.' : 'From the guides, in our own words.') + ' The maps are examples of where to stand, not a real pull.</p></div>');
  const root = document.querySelector('#view .gdz');
  gdzReadTog(root);
  gdzGoTo(root);
  gdzLookApply(root, G, D); /* (the Raider look: Learn or Quick, your role, the fight at a glance) */
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
    const FR = new Map(gdzFightRows(G).map((x) => [x.t + '|' + x.name, x])), CH = { 3: ['sv3', 'Wipe risk'], 2: ['sv2', 'Can kill'] };
    let lastPh = 0; ol.innerHTML = W.chaps.map((c, i) => { const x = FR.get(c.rt + '|' + c.name), ch = x && CH[x.sv];
      return (c.ph !== lastPh ? ((lastPh = c.ph), '<li class="gdz-chh">' + esc(c.phase) + '</li>') : '') +
        '<li data-c="' + i + '"' + (x && x.top ? ' class="ovl sv' + x.top + '"' : '') + '><i>' + (W.real ? clk(c.rt) : c.ph) + '</i><span><b>' + esc(x ? x.nm : c.name) + (ch ? '<em class="gdz-ftc ' + ch[0] + '">' + ch[1] + '</em>' : '') + '</b>' +
        (x && x.ins ? '<em class="gdz-chi">' + esc(x.ins) + '</em>' : '') + (x && x.line ? '<em class="gdz-chl">' + esc(x.line) + '</em>' : '') +
        (x && x.ovs.length ? '<em class="gdz-cho"><b class="sv' + x.top + '">' + gdzOvw(x.top, x.ovs.length, 'At the same time') + ':</b> ' + x.ovs.map((o) => '<span class="sv' + o.sv + '">' + esc(o.txt) + '</span>').join(', ') + '</em>' : '') + '</span></li>'; }).join('');
    const lis = [...ol.querySelectorAll('li[data-c]')];
    // the video layer over the map, like a guide video: a badge with the phase and the fight clock, a title card at the start and at
    // each phase, and a lower-third caption (the mechanic's instruction big, the step under it with its key words lit)
    const vid = document.createElement('div'); vid.className = 'gdz-vid'; vid.innerHTML = '<div class="gdz-vchip"></div><div class="gdz-vcard"></div><div class="gdz-vlow"><div class="gdz-vlk"></div><div class="gdz-vlt"></div><div class="gdz-vls"></div></div>'; zb.appendChild(vid);
    const vchip = vid.querySelector('.gdz-vchip'), vcard = vid.querySelector('.gdz-vcard'), vlow = vid.querySelector('.gdz-vlow'); box._onPause = gdzPauseUi(vid);
    const KEYW = /\b(dodge|soak|run|dispel|dispels|taunt|taunts|kick|stack|stacks|look|burst|break|stop|never|carry|pop|pops|spread|walk|step out|hold|kill|swap|stand still|wipes?|dies?|die|bloodlust|cooldowns?|defensive|purples?|greens?)\b|\b\d+(?:\s?(?:to|or)\s?\d+)?(?:\s?(?:yards?|seconds?|%|orbs?))?/gi;
    const lit = (t) => esc(t).split(/(&#?\w+;)/).map((p, i) => (i % 2 ? p : p.replace(KEYW, (m) => '<em>' + m + '</em>'))).join(''); /* (never inside an escaped character like &#39;) */
    // the camera: glides to each scene's own view as it starts; dragging the map stops it until Follow is pressed again
    const zbar = box.querySelector('.zbar'), o = (svg.dataset.o || '0,0').split(',').map(Number), yd = +svg.dataset.yd, A = GDZ_ORIGIN[boss] || (typeof GDZ_ARENAS !== 'undefined' && GDZ_ARENAS[boss]) || ARENAS[boss] || { cx: 0, cy: 0 }; /* (the guide's own origin, the same one its maps are drawn from) */
    const camVB = (f, c) => { let span = Math.max(30, f.r * 3.2); const fx = A.cx + f.x, fy = A.cy + f.y;
      if (c != null) { const fr = W.mp.frames.find((q) => q.t >= W.chaps[c].t + 0.5); if (fr) for (const p of fr.pts) if (p.kind === 'boss') span = Math.max(span, (Math.max(Math.abs(p.x - fx), Math.abs(p.y - fy)) + 9) / 0.6); } /* (a boss and its name a few yards inside the edge) */
      const fx0 = fx - span * 0.6, fy0 = -fy - span * 0.6; return [(fx0 - o[0]) * yd, (fy0 - o[1]) * yd, span * 1.2 * yd, span * 1.2 * yd]; };
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
      if (follow && c !== camC) { camC = c; glide(camVB(ch.foc || { x: 0, y: 0, r: 26 }, c)); }
      const nxc = W.chaps[c + 1], gap = !!nxc && ft > ch.t + ch.len + 0.1; /* (between two scenes: the walk to the next one's spots) */
      const k2 = j + '|' + c + (gap ? 'g' : ''); if (k2 === cur) return; cur = k2;
      const big = (ch.name.match(/\(([^)]*)\)/) || [])[1] || ch.name, small = ch.name.replace(/\s*\(.*$/, '');
      vlow.classList.remove('in'); void vlow.offsetWidth; vlow.classList.add('in');
      if (gap) { vlow.children[0].textContent = 'Up next'; vlow.children[1].textContent = nxc.name.replace(/\s*\(.*$/, ''); vlow.children[2].innerHTML = lit(((nxc.name.match(/\(([^)]*)\)/) || [])[1] ? nxc.name.match(/\(([^)]*)\)/)[1] + '. ' : '') + 'Everyone walks to their spots for it.'); }
      else { vlow.children[0].textContent = big === ch.name ? '' : small; vlow.children[1].textContent = big; vlow.children[2].innerHTML = q ? lit(q.text) : ''; }
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
.gdz-plan1 { margin: 0 0 12px; padding: 8px 12px; border: 1px solid var(--line2); border-radius: 8px; background: var(--raised); font-size: 14px; }
.gdz-plan1 b { font: 700 15px var(--head); margin-right: 8px; }
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
// ---- Page looks (Oct 20): D, Raider, is the page (your pick, live); A to C and Now stay on the test copy to compare (?guides&look=a|b|c|now or the switcher) ----
const GDZ_LOOKS = { a: 'Calm', b: 'Tabs', c: 'Storyboard', d: 'Raider' };
function gdzLook() { if (window.WLA_HOSTED) return 'd'; let l = new URLSearchParams(location.search).get('look'); if (l == null) try { l = localStorage.getItem('gdz-look'); } catch (e) { l = ''; } return l === 'now' ? '' : GDZ_LOOKS[l] ? l : 'd'; }
function gdzLookApply(root, G, D) {
  if (!document.getElementById('gdz-look-css')) { const st = document.createElement('style'); st.id = 'gdz-look-css'; st.textContent = "\nbody.gdz-lk .gdz-pagetop { padding: 0 var(--gut, 24px); margin: 22px 0 4px; }\nbody.gdz-lk .gdz-pagetop .gdz-kick, body.gdz-lk .gdz-pagetop p { display: none; }\nbody.gdz-lk .gdz-pick { gap: 0; border-bottom: 1px solid var(--line); flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }\nbody.gdz-lk .gdz-pick::-webkit-scrollbar { display: none; }\nbody.gdz-lk .gdz-pb { background: none; border: 0; border-bottom: 2px solid transparent; border-radius: 0; margin-bottom: -1px; padding: 9px 12px; font-size: 13.5px; white-space: nowrap; }\nbody.gdz-lk .gdz-pb.on { background: none; color: var(--text); border-bottom-color: var(--gold); }\nbody.gdz-lk .gdz-pb.soon { opacity: .32; }\nbody.gdz-lk .gdz-hero { border: 0; min-height: 0; }\nbody.gdz-lk .gdz-hin { padding: 22px 24px 20px; }\nbody.gdz-lk .gdz-hin .gdz-kick { display: none; }\nbody.gdz-lk .gdz-facts { gap: 0; }\nbody.gdz-lk .gdz-fact { flex-direction: row; align-items: baseline; gap: 5px; min-width: 0; padding: 0; background: none; border: 0; }\nbody.gdz-lk .gdz-fact + .gdz-fact::before { content: '·'; margin: 0 12px; color: var(--faint); }\nbody.gdz-lk .gdz-fact span { font-size: 13px; } body.gdz-lk .gdz-fact b { font-size: 13.5px; }\nbody.gdz-lk .gdz-key { display: none; }\nbody.gdz-lk .gdz-steps li { padding: 6px 0 6px 12px; border: 0; border-left: 2px solid transparent; border-radius: 0; }\nbody.gdz-lk .gdz-steps li::before { width: 16px; height: auto; background: none; border: 0; color: var(--faint); margin-top: 0; font-size: 13px; line-height: inherit; }\nbody.gdz-lk .gdz-steps li.go:hover { background: rgba(255,255,255,.03); }\nbody.gdz-lk .gdz-steps li.on { background: none; border-left-color: var(--gold); }\nbody.gdz-lk .gdz-steps li.on::before { background: none; color: var(--gold); }\nbody.gdz-lk .gdz-plan { background: none; border: 0; border-top: 1px solid var(--line); border-radius: 0; }\nbody.gdz-lk .gdz-plan summary { padding: 10px 0; font-size: 14px; }\nbody.gdz-lk .gdz-plan ul { padding: 0 0 12px 18px; }\nbody.gdz-lk .gdz-my { background: none; border: 0; border-left: 2px solid #a36cff; border-radius: 0; padding: 3px 0 3px 12px; color: var(--muted); }\nbody.gdz-lk .gdz-sh { border: 0; padding: 0; }\nbody.gdz-lk .gdz-sh i { background: none; border: 1.5px solid var(--gold); color: var(--gold); }\nbody.gdz-lk .gdz-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 32px; }\nbody.gdz-lk .gdz-tile { background: none; border: 0; border-top: 1px solid var(--line); border-radius: 0; padding: 14px 0; }\nbody.gdz-lk .gdz-role { background: none; border: 0; border-top: 2px solid; border-radius: 0; padding: 12px 0 0; }\n/* A, Calm: the same page, quieter: no boxes, more room, a slim phase bar that stays at the top */\n.gdz-lk-a .gdz { gap: 30px; }\n.gdz-lk-a .gdz-phn { position: sticky; top: 0; z-index: 6; gap: 2px; padding: 8px 0; background: rgba(15,17,23,.92); backdrop-filter: blur(6px); border-bottom: 1px solid var(--line); }\n.gdz-lk-a .gdz-phc { background: none; border: 0; padding: 5px 10px; font-size: 13.5px; color: var(--muted); }\n.gdz-lk-a .gdz-phc:hover { color: var(--text); }\n.gdz-lk-a .gdz-phc i { width: 18px; height: 18px; font-size: 11px; background: var(--raised); color: var(--muted); }\n.gdz-lk-a .gdz-arr { display: none; }\n.gdz-lk-a .gdz-m { background: none; border: 0; border-top: 1px solid var(--line); border-radius: 0; padding: 24px 0 0; gap: 32px; }\n.gdz-lk-a .gdz-mt { max-width: 64ch; }\n/* B, Tabs: one part of the fight at a time, picked from tabs that stay at the top */\n.gdz-lk-b .gdz-tabs { position: sticky; top: 0; z-index: 6; display: flex; gap: 4px; padding: 5px; overflow-x: auto; background: rgba(15,17,23,.94); backdrop-filter: blur(6px); border: 1px solid var(--line); border-radius: 12px; }\n.gdz-lk-b .gdz-tabs button { flex: 1 0 auto; padding: 8px 14px; border: 0; border-radius: 8px; background: none; color: var(--muted); font: 700 14px var(--head); white-space: nowrap; cursor: pointer; }\n.gdz-lk-b .gdz-tabs button:hover { color: var(--text); }\n.gdz-lk-b .gdz-tabs button.on { background: var(--gold); color: var(--gold-ink); }\n.gdz-lk-b .gdz-sh i { display: none; }\n.gdz-lk-b .gdz-sec[hidden] { display: none !important; }\n.gdz-lk-b .gdz-m { border-color: rgba(255,255,255,.06); padding: 20px; gap: 28px; }\n/* C, Storyboard: each mechanic leads with its name, then a big map, then its steps as cards in a row that light up as it plays */\n.gdz-lk-c .gdz { gap: 30px; }\n.gdz-lk-c .gdz-phn { gap: 2px; } .gdz-lk-c .gdz-phc { background: none; border: 0; padding: 5px 10px; color: var(--muted); } .gdz-lk-c .gdz-arr { display: none; }\n.gdz-lk-c .gdz-m { display: flex; flex-direction: column; align-items: center; gap: 14px; min-width: 0; background: none; border: 0; border-top: 1px solid var(--line); border-radius: 0; padding: 26px 0 0; }\n.gdz-lk-c .gdz-mt { display: contents; }\n.gdz-lk-c .gdz-mt h4 { order: -2; justify-content: center; font-size: 22px; margin: 0; }\n.gdz-lk-c .gdz-what { order: -1; margin: -6px 0 0; max-width: 70ch; text-align: center; color: var(--muted); }\n.gdz-lk-c .gdz-mapc { width: min(100%, 760px); }\n.gdz-lk-c .gdz-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; width: 100%; margin: 0; }\n.gdz-lk-c .gdz-plan, .gdz-lk-c .gdz-my { width: min(100%, 75ch); }\n.gdz-lk-c .gdz-steps li { flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid var(--line); border-left: 1px solid var(--line); border-radius: 10px; background: var(--panel); font-size: 13.5px; }\n.gdz-lk-c .gdz-steps li.on { border-color: var(--gold); background: rgba(230,180,80,.08); }\n.gdz-lk-c .gdz-plan, .gdz-lk-c .gdz-my { max-width: 75ch; }\n.gdz-lk-c .gdz-whole .gdz-chaps { max-height: 260px; }\n.gdz-lk-c .gdz-tiles { grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); }\n/* the switcher (test copy only) */\n#gdzLookSw { position: fixed; right: 14px; bottom: 14px; z-index: 50; display: flex; align-items: center; gap: 4px; padding: 5px; border-radius: 12px; background: rgba(11,13,18,.92); border: 1px solid var(--line2); box-shadow: 0 8px 24px rgba(0,0,0,.5); font-size: 12.5px; }\n#gdzLookSw b { padding: 0 6px; color: var(--faint); font-weight: 700; }\n#gdzLookSw button { padding: 6px 10px; border: 0; border-radius: 8px; background: none; color: var(--muted); font-weight: 700; cursor: pointer; }\n#gdzLookSw button.on { background: var(--gold); color: var(--gold-ink); }\n"; document.head.appendChild(st); }
  const l = gdzLook(); document.body.classList.toggle('gdz-lk', !!l); for (const k of Object.keys(GDZ_LOOKS)) document.body.classList.toggle('gdz-lk-' + k, k === l);
  const top = document.querySelector('#main .gdz-pagetop'); let sw = document.getElementById('gdzLookSw');
  if (!sw && !window.WLA_HOSTED) { sw = document.createElement('div'); sw.id = 'gdzLookSw'; (top || root).appendChild(sw); } /* (the switcher: test copy only) */
  if (sw) {
  sw.innerHTML = '<b>Look</b>' + [['now', 'Before']].concat(Object.entries(GDZ_LOOKS)).map(([k, n]) => '<button type="button" data-k="' + k + '" class="' + ((k === 'now' ? !l : k === l) ? 'on' : '') + '">' + (k !== 'now' ? k.toUpperCase() + ' · ' : '') + n + '</button>').join('');
  sw.querySelectorAll('button').forEach((b) => (b.onclick = () => { try { localStorage.setItem('gdz-look', b.dataset.k); } catch (e) { /* (private window) */ } const u = new URL(location.href); u.searchParams.delete('look'); history.replaceState(history.state, '', u); gdzView(); }));
  }
  if (l === 'b') gdzTabs(root);
  if (l === 'd' && G) gdzRaider(root, G, D);
}
// (look D, Raider: Learn or Quick, your role, and the fight at a glance)
function gdzRaider(root, G, D) {
  if (!document.getElementById('gdz-raider-css')) { const st = document.createElement('style'); st.id = 'gdz-raider-css'; st.textContent = "\n.gdz-lk-d .gdz { gap: 22px; }\n.gdz-lk-d .gdz-m { background: none; border: 0; border-top: 1px solid var(--line); border-radius: 0; padding: 22px 0 0; gap: 32px; }\n.gdz-lk-d .gdz-mt { max-width: 66ch; }\n.gdz-lk-d .gdz-tabs { position: sticky; top: 0; z-index: 6; display: flex; gap: 4px; padding: 5px; overflow-x: auto; background: rgba(15,17,23,.94); backdrop-filter: blur(6px); border: 1px solid var(--line); border-radius: 12px; }\n.gdz-lk-d .gdz-tabs button { flex: 1 0 auto; padding: 8px 14px; border: 0; border-radius: 8px; background: none; color: var(--muted); font: 700 14px var(--head); white-space: nowrap; cursor: pointer; }\n.gdz-lk-d .gdz-tabs button:hover { color: var(--text); } .gdz-lk-d .gdz-tabs button.on { background: var(--gold); color: var(--gold-ink); }\n.gdz-lk-d .gdz-sec[hidden] { display: none !important; } .gdz-lk-d .gdz-sh i { display: none; }\n.gdz-rbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; }\n.gdz-seg { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border-radius: 999px; background: var(--panel); border: 1px solid var(--line); }\n.gdz-seg span { padding: 0 8px 0 10px; font-size: 12.5px; color: var(--faint); }\n.gdz-seg button { padding: 6px 14px; border: 0; border-radius: 999px; background: none; color: var(--muted); font: 700 13.5px var(--head); cursor: pointer; }\n.gdz-seg button:hover { color: var(--text); } .gdz-seg button.on { background: var(--gold); color: var(--gold-ink); }\n.gdz-watch { margin-left: auto; padding: 7px 14px; border-radius: 999px; border: 1px solid rgba(230,180,80,.5); background: rgba(230,180,80,.12); color: var(--gold); font: 700 13.5px var(--head); cursor: pointer; }\n.gdz-watch:hover { background: rgba(230,180,80,.22); }\n.gdz-glance { display: flex; flex-direction: column; gap: 14px; }\n.gdz-tl { padding: 14px 16px 8px; border-radius: 12px; background: var(--panel); border: 1px solid var(--line); }\n.gdz-tlh { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; margin-bottom: 10px; } .gdz-tlh b { font: 700 16px var(--head); } .gdz-tlh span { font-size: 12.5px; color: var(--faint); }\n.gdz-tlbar { position: relative; height: 24px; border-radius: 6px; overflow: hidden; background: var(--raised); } .gdz-tlbd { position: relative; height: 15px; margin-top: 3px; } .gdz-tlbn { position: absolute; top: 0; bottom: 0; display: flex; align-items: center; padding: 0 6px; box-sizing: border-box; border-radius: 4px; overflow: hidden; white-space: nowrap; font: 700 10.5px var(--head); color: #ffb066; background: repeating-linear-gradient(135deg, rgba(255,150,40,.26) 0 6px, rgba(255,150,40,.12) 6px 12px); } .gdz-tlbn.hi { color: #ffd2a8; background: repeating-linear-gradient(135deg, rgba(255,120,30,.5) 0 6px, rgba(255,120,30,.28) 6px 12px); }\n.gdz-tlp { position: absolute; top: 0; bottom: 0; display: flex; align-items: center; padding: 0 8px; border-right: 2px solid var(--panel); overflow: hidden; box-sizing: border-box; }\n.gdz-tlp span { font: 700 12px var(--head); color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.gdz-tlev { position: relative; height: 54px; margin-top: 4px; }\n.gdz-tlm { position: absolute; top: 2px; transform: translateX(-50%); width: 24px; height: 24px; padding: 0; border: 1px solid var(--line2); border-radius: 6px; background: var(--raised); cursor: pointer; overflow: hidden; display: grid; place-items: center; }\n.gdz-tlm.lo { top: 28px; } .gdz-tlm img, .gdz-tlm svg { width: 22px; height: 22px; border-radius: 4px; }\n.gdz-tlm:hover { border-color: var(--gold); transform: translateX(-50%) scale(1.18); z-index: 2; }\n.gdz-tlax { position: relative; height: 16px; font-size: 11px; color: var(--faint); } .gdz-tlax span { position: absolute; transform: translateX(-50%); }\n.gdz-tlrow { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; } .gdz-tlc b { display: block; font: 700 13px var(--head); color: var(--gold); } .gdz-tlc span { font-size: 13px; color: var(--muted); }\n.gdz-cards { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); gap: 14px; }\n.gdz-job, .gdz-wipe { padding: 14px 16px; border-radius: 12px; background: var(--panel); border: 1px solid var(--line); }\n.gdz-job h4, .gdz-wipe h4 { margin: 0 0 8px; font: 700 16px var(--head); } .gdz-job h4 span { margin-left: 6px; font: 400 12.5px var(--body); color: var(--faint); }\n.gdz-job ul { margin: 0; padding: 0 0 0 18px; display: flex; flex-direction: column; gap: 6px; font-size: 14px; }\n.gdz-job3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; } .gdz-job3 b { font: 700 13px var(--head); color: var(--gold); } .gdz-job3 ul { margin-top: 4px; font-size: 13px; }\n.gdz-wipe { border-color: rgba(229,83,75,.35); background: linear-gradient(rgba(229,83,75,.06), rgba(229,83,75,.02)); } .gdz-wipe h4 { color: #ff8a83; }\n.gdz-wipe ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; } .gdz-wipe li b { display: block; font-size: 14px; } .gdz-wipe li span { font-size: 13px; color: var(--muted); }\n.gdz-steps li.gdz-me { color: var(--text); border-left-color: rgba(230,180,80,.7); }\n.gdz-steps li.gdz-me > span::before, .gdz-plan li.gdz-me::before { content: 'YOU'; display: inline-block; margin-right: 7px; padding: 0 5px; border-radius: 4px; background: var(--gold); color: var(--gold-ink); font: 800 10px/1.7 var(--head); letter-spacing: .06em; vertical-align: 1px; }\n.gdz-steps li.gdz-oth, .gdz-plan li.gdz-oth { opacity: .42; }\n.gdz-cards { align-items: start; } .gdz-job { border-left: 3px solid var(--rc, var(--gold)); background: linear-gradient(135deg, color-mix(in srgb, var(--rc, #e6b450) 10%, transparent), transparent 60%), var(--panel); } .gdz-job.gdz-jall { border-left-color: var(--line); } .gdz-job h4, .gdz-wipe h4 { display: flex; align-items: center; gap: 10px; font-size: 17px; } .gdz-jgl { width: 26px; height: 26px; flex: none; filter: drop-shadow(0 1px 2px rgba(0,0,0,.4)); } .gdz-jrole { margin-left: 2px; padding: 2px 10px; border-radius: 999px; font: 700 12.5px var(--head); font-style: normal; color: var(--rc); background: color-mix(in srgb, var(--rc) 16%, transparent); } .gdz-job ul, .gdz-job3 ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; } .gdz-job li { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,.03); font-size: 14px; line-height: 1.4; } .gdz-jph { flex: none; min-width: 34px; text-align: center; padding: 1px 6px; margin-top: 1px; border-radius: 6px; font: 700 11.5px var(--head); font-style: normal; color: var(--rc, var(--gold)); background: color-mix(in srgb, var(--rc, #e6b450) 14%, transparent); } .gdz-job3 > div > b { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; color: var(--rc); font: 700 14px var(--head); } .gdz-job3 .gdz-jgl { width: 22px; height: 22px; } .gdz-job3 li { font-size: 13px; padding: 7px 9px; } .gdz-wipe { border-left: 3px solid #e5534b; } .gdz-wipe li { padding: 8px 10px; border-radius: 8px; background: rgba(229,83,75,.06); } .gdz-wipe ul { gap: 6px; } .gdz-chaps li.ovl { border-left: 2px solid transparent; } .gdz-chaps li.ovl.sv3 { border-left-color: #e5534b; } .gdz-chaps li.ovl.sv2 { border-left-color: #e8a23a; } .gdz-chaps li.ovl.sv1 { border-left-color: #4a5060; } .gdz-chaps li b .gdz-ftc { margin-left: 7px; } .gdz-chaps .gdz-ftc.sv3 { color: #ff7b72; background: rgba(229,83,75,.16); } .gdz-chaps .gdz-ftc.sv2 { color: #f0b45a; background: rgba(232,162,58,.16); } .gdz-chaps li .gdz-chi { color: var(--faint); font-size: 12.5px; } .gdz-chaps li .gdz-chl { display: none; color: var(--text); font-size: 13px; margin-top: 2px; } .gdz-chaps li.on .gdz-chl { display: block; } .gdz-chaps li .gdz-cho { font-size: 12px; color: var(--muted); margin-top: 1px; } .gdz-chaps .sv3 { color: #ff7b72; } .gdz-chaps .sv2 { color: #f0b45a; } .gdz-chaps .sv1 { color: #8b92a2; } .gdz-chaps li.ovl .gdz-cho b { font-weight: 700; } .gdz-chaps li .gdz-cho span.sv1, .gdz-chaps li .gdz-cho b.sv1 { color: #8b92a2; } .gdz-chaps li .gdz-cho span { display: inline; } .gdz-chaps li .gdz-cho { display: block; } .gdz-wrong { display: block; margin-top: 10px; padding: 0; border: 0; background: none; color: var(--faint); font-size: 12.5px; text-decoration: underline dotted; text-underline-offset: 3px; cursor: pointer; } .gdz-wrong:hover { color: var(--gold); } .gdz-q .gdz-m:not(.open) .gdz-wrong, body.gdz-lk .gdz-q .gdz-tile .gdz-wrong { display: none; } .gdz-asg { margin: 0 0 10px; padding: 9px 12px; border-radius: 9px; background: rgba(230,180,80,.08); border: 1px solid rgba(230,180,80,.35); font-size: 14px; } .gdz-asg b { display: block; color: var(--gold); font: 700 13.5px var(--head); } .gdz-asg span { color: var(--muted); font-size: 13px; } .gdz-asg ul { margin: 4px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; } .grh { display: none; } .gdz-rl-t .grh.gr-t, .gdz-rl-h .grh.gr-h, .gdz-rl-d .grh.gr-m, .gdz-rl-d .grh.gr-r { display: inline; } .gdz-upd { opacity: .85; } .gdz-flash { animation: gdzFlash 1.6s ease-out; } @keyframes gdzFlash { 0%, 35% { box-shadow: 0 0 0 2px var(--gold); } 100% { box-shadow: 0 0 0 2px transparent; } }\n.gdz-q #gdz-all .gdz-ftext { display: block !important; } .gdz-q #gdz-all .gdz-sh p { display: none; } .gdz-wtog { display: inline-flex; align-self: flex-start; gap: 2px; padding: 3px; border-radius: 999px; background: var(--panel); border: 1px solid var(--line); } .gdz-wtog button { padding: 6px 16px; border: 0; border-radius: 999px; background: none; color: var(--muted); font: 700 13.5px var(--head); cursor: pointer; } .gdz-wtog button.on { background: var(--gold); color: var(--gold-ink); } .gdz-whole[hidden] { display: none !important; } .gdz-ftext[hidden] { display: none; } .gdz-ftext { display: flex; flex-direction: column; gap: 16px; max-width: 860px; } .gdz-ftk { margin: 0; color: var(--muted); font-size: 14px; } .gdz-ftal { margin: 0; padding: 10px 14px 10px 30px; border-radius: 10px; background: var(--panel); border: 1px solid var(--line); font-size: 14px; display: flex; flex-direction: column; gap: 4px; } .gdz-ftph h4 { display: flex; align-items: baseline; gap: 10px; margin: 0 0 6px; font: 700 17px var(--head); } .gdz-ftph h4 span { font: 600 12.5px var(--body); color: var(--faint); } .gdz-ftph ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; } .gdz-ftph li { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 12px; padding: 9px 0 9px 10px; border-top: 1px solid var(--line); border-left: 2px solid transparent; } .gdz-ftph li.ov.sv3 { border-left-color: #e5534b; background: linear-gradient(90deg, rgba(229,83,75,.09), transparent 60%); } .gdz-ftph li.ov.sv2 { border-left-color: #e8a23a; background: linear-gradient(90deg, rgba(232,162,58,.07), transparent 60%); } .gdz-ftph li.ov.sv1 { border-left-color: #4a5060; } .gdz-ftlg { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; } .gdz-ftlg span::before { content: ''; display: inline-block; width: 9px; height: 9px; border-radius: 2px; margin-right: 6px; background: currentColor; } .gdz-ftext .sv3 { color: #ff7b72; } .gdz-ftext .sv2 { color: #f0b45a; } .gdz-ftext .sv1 { color: #8b92a2; } .gdz-ftph li.ov { color: var(--text); } .gdz-ftc { margin-left: 8px; padding: 1px 7px; border-radius: 999px; font: 700 11px var(--head); font-style: normal; letter-spacing: .03em; vertical-align: 2px; } .gdz-ftc.sv3 { background: rgba(229,83,75,.16); } .gdz-ftc.sv2 { background: rgba(232,162,58,.16); } .gdz-ftt { font: 700 14px var(--head); color: var(--gold); font-variant-numeric: tabular-nums; padding-top: 1px; } .gdz-ftph li b { font: 700 15px var(--head); } .gdz-fti { margin-left: 8px; font-size: 13.5px; color: var(--muted); } .gdz-ftph li p { margin: 3px 0 0; font-size: 14px; color: var(--muted); } .gdz-ftph li p.gdz-fto { color: var(--muted); } .gdz-ftph li p.gdz-fto b { font: 700 13px var(--body); } .gdz-qline { display: none; }\n.gdz-q .gdz-phn, .gdz-q #gdz-all .gdz-whole, .gdz-q #gdz-all .gdz-wtog, .gdz-q .gdz-roles, .gdz-q .gdz-hin > p:not(.gdz-src) { display: none; }\n.gdz-q .gdz-sec { gap: 2px; } .gdz-q .gdz-sh { margin: 6px 0 2px; } .gdz-q .gdz-sh p { display: none; } .gdz-q .gdz-sh h3 { font-size: 18px; } .gdz-q .gdz-sh i { display: inline-grid; width: 24px; height: 24px; font-size: 12px; }\n.gdz-q .gdz-m:not(.open) { display: grid; grid-template-columns: 150px minmax(0, 1fr); gap: 16px; align-items: center; padding: 10px 0; cursor: pointer; }\n.gdz-q .gdz-m:not(.open) > .gdz-mapc { width: 150px; pointer-events: none; border-radius: 9px; transition: outline-color .15s; outline: 2px solid transparent; outline-offset: 2px; }\n.gdz-q .gdz-m:not(.open):hover > .gdz-mapc { outline-color: var(--gold); }\n.gdz-q .gdz-m:not(.open):not(:has(.gdz-mapc)) { grid-template-columns: 1fr; }\n.gdz-q .gdz-m:not(.open) .gdz-mode, .gdz-q .gdz-m:not(.open) .zctl, .gdz-q .gdz-m:not(.open) .zkey, .gdz-q .gdz-m:not(.open) .znorth, .gdz-q .gdz-m:not(.open) .zscale, .gdz-q .gdz-m:not(.open) .zanim, .gdz-q .gdz-m:not(.open) .gdz-cap { display: none !important; }\n.gdz-q .gdz-m:not(.open) .gdz-what, .gdz-q .gdz-m:not(.open) .gdz-steps, .gdz-q .gdz-m:not(.open) .gdz-plan, .gdz-q .gdz-m:not(.open) .gdz-my { display: none; }\n.gdz-q .gdz-m .gdz-mt { max-width: none; }\n.gdz-q .gdz-mt h4 { cursor: pointer; margin: 0; font-size: 16px; } .gdz-q .gdz-mt h4::after { content: 'Bigger map and steps ›'; margin-left: auto; padding-left: 12px; font: 600 12.5px var(--body); color: var(--gold); white-space: nowrap; }\n.gdz-q .gdz-m.open .gdz-mt h4::after { content: 'Close ⌃'; }\n.gdz-q .gdz-qline { display: block; margin: 3px 0 0 34px; font-size: 14px; color: var(--muted); } .gdz-qline b { color: var(--gold); } .gdz-q .gdz-m.open .gdz-qline { display: none; }\nbody.gdz-lk .gdz-q .gdz-tiles { grid-template-columns: 1fr; gap: 0; } body.gdz-lk .gdz-q .gdz-tile { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 14px; padding: 9px 0; } body.gdz-lk .gdz-q .gdz-tile h5 { margin: 0; font-size: 14px; } body.gdz-lk .gdz-q .gdz-tile p { font-size: 13px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; } body.gdz-lk .gdz-q .gdz-tile:hover p { -webkit-line-clamp: unset; }\n@media (max-width: 560px) { .gdz-tlev { display: none; } .gdz-tlh span { display: none; } .gdz-tlax { margin-top: 6px; } } /* (on a phone the mechanic icons would pile up: the phases and times stay) */\n@media (max-width: 760px) { .gdz-cards, .gdz-job3 { grid-template-columns: 1fr; } body.gdz-lk .gdz-q .gdz-tile { grid-template-columns: 1fr; gap: 2px; } .gdz-watch { margin-left: 0; } .gdz-q .gdz-qline { margin-left: 0; } }\n"; document.head.appendChild(st); }
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { /* (private window) */ } return null; };
  const mode = ls('gdz-mode') === 'quick' ? 'quick' : 'learn', r0 = ls('gdz-role'), role = ['t', 'h', 'd'].includes(r0) ? r0 : 'all';
  root.classList.toggle('gdz-q', mode === 'quick'); ['t', 'h', 'd'].forEach((k) => root.classList.toggle('gdz-rl-' + k, role === k)); /* (your role's icons ringed on the maps) */
  const clk = (t) => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
  // the switches: Learn or Quick, and whose job to show
  const seg = (k, cur, opts, lead) => '<div class="gdz-seg" data-k="' + k + '">' + (lead ? '<span>' + lead + '</span>' : '') + opts.map(([v, n]) => '<button type="button" data-v="' + v + '" class="' + (v === cur ? 'on' : '') + '">' + n + '</button>').join('') + '</div>';
  const bar = document.createElement('div'); bar.className = 'gdz-rbar';
  bar.innerHTML = seg('mode', mode, [['learn', 'Learn the fight'], ['quick', 'Quick']]) + seg('role', role, [['all', 'Everyone'], ['t', 'Tank'], ['h', 'Healer'], ['d', 'DPS']], 'Show me') + (mode === 'learn' && root.querySelector('#gdz-all') ? '<button type="button" class="gdz-watch">▶ Watch the whole fight</button>' : '');
  const hero = root.querySelector('.gdz-hero'); if (!hero) return; hero.after(bar);
  bar.querySelectorAll('.gdz-seg button').forEach((b) => (b.onclick = () => { ls(b.parentElement.dataset.k === 'mode' ? 'gdz-mode' : 'gdz-role', b.dataset.v); const y = window.scrollY; gdzView(); window.scrollTo({ top: y }); }));
  // the fight at a glance: a real kill's timeline (Mythic), or each phase's mechanics in order
  const byId = {}; G.phases.forEach((p) => (p.mechs || []).forEach((m) => { if (m.id) byId[m.id] = m; }));
  const ev = (G.sim || []).map((e) => { const m = e.mech ? byId[e.mech] : null, b = e.beat ? (G.beats || {})[e.beat] : null, name = e.label || (m ? m.name : b ? b.name : ''); return { t: e.at, ph: e.ph, name, short: name.replace(/ \(.*$/, '').replace(/ \d$/, ''), key: m ? 'm:' + m.id : 'b:' + e.beat }; }).filter((x) => x.name && !['b:start', 'b:transition', 'b:p2end', 'b:kill'].includes(x.key)); /* (only mechanics, not the pull or the kill) */
  let tl;
  if (ev.length) { const end = ev[ev.length - 1].t + 12, P = (t) => (t / end * 100).toFixed(2) + '%', PC = ['#3b4a6b', '#5a3b6b', '#6b5a2a', '#6b2f3b'];
    const phs = []; ev.forEach((x) => { if (!phs.length || phs[phs.length - 1].ph !== x.ph) phs.push({ ph: x.ph, t0: x.t }); }); phs.forEach((p, i) => (p.t1 = i + 1 < phs.length ? phs[i + 1].t0 : end));
    const pn = (p) => ((G.phases[p.ph] || {}).name || '').replace(/^Phase (\d): /, 'P$1 · ').replace(/^Intermission:.*/, 'Int.');
    const ticks = []; for (let t = 0; t <= end - 20; t += 120) ticks.push('<span style="left:' + P(t) + '">' + clk(t) + '</span>');
    tl = '<div class="gdz-tl"><div class="gdz-tlh"><b>The fight at a glance</b><span>a real kill, ' + clk(gdzKillLen(G) || end) + ' long · tap a mechanic to jump to it</span></div><div class="gdz-tlbar">' +
      phs.map((p) => '<div class="gdz-tlp" style="left:' + P(p.t0) + ';width:' + ((p.t1 - p.t0) / end * 100).toFixed(2) + '%;background:' + PC[p.ph % 4] + '" title="' + esc((G.phases[p.ph] || {}).name || '') + '"><span>' + esc(pn(p)) + '</span></div>').join('') + '</div>' + ((G.simBands || []).length ? '<div class="gdz-tlbd">' + G.simBands.map((b) => '<span class="gdz-tlbn' + (b.n >= 10 ? ' hi' : '') + '" style="left:' + P(b.t0) + ';width:' + ((b.t1 - b.t0) / end * 100).toFixed(2) + '%" title="' + esc((b.title || b.n + ' axes rolling') + ', ' + clk(b.t0) + ' to ' + clk(b.t1)) + '">' + esc(b.text || b.n + ' axes') + '</span>').join('') + '</div>' : '') + '<div class="gdz-tlev">' +
      ev.map((x, i) => '<button type="button" class="gdz-tlm' + (i % 2 ? ' lo' : '') + '" style="left:' + P(x.t) + '" data-key="' + esc(x.key) + '" title="' + esc(clk(x.t) + '  ' + x.name) + '">' + spellIcon(0, x.short) + '</button>').join('') + '</div><div class="gdz-tlax">' + ticks.join('') + '</div></div>';
  } else tl = '<div class="gdz-tl"><div class="gdz-tlh"><b>The fight at a glance</b><span>each phase and what happens in it</span></div><div class="gdz-tlrow">' + G.phases.map((p) => '<div class="gdz-tlc"><b>' + esc(p.name) + '</b><span>' + (p.mechs || []).concat(p.tiles || []).map((m) => esc(m.name.replace(/ \(.*$/, ''))).join(' · ') + '</span></div>').join('') + '</div></div>';
  // your job, and what wipes us (each mechanic's mistake, in our words)
  const RN = { t: 'Tanks', h: 'Healers', d: 'DPS' }, li = (x) => '<li>' + esc(x) + '</li>', RL = G.roles || {};
  // (each role's colour and sign, like the map's tokens; a job's line tagged with the part of the fight it's about)
  const RC = { t: '#5aa0ff', h: '#45d16b', d: '#ff8a5c' }, SIGN = { t: '<path d="M0 -6.4L5.2 -4.3V0C5.2 3.6 2.7 5.6 0 6.7C-2.7 5.6 -5.2 3.6 -5.2 0V-4.3Z" fill="#10131a"/>', h: '<path d="M-1.9 -6.2H1.9V-1.9H6.2V1.9H1.9V6.2H-1.9V1.9H-6.2V-1.9H-1.9Z" fill="#10131a"/>', d: '<path d="M-5 5L5 -5M-5 -5L5 5" stroke="#10131a" stroke-width="2.4" stroke-linecap="round"/>' };
  const jic = (k) => '<svg class="gdz-jgl" viewBox="-10 -10 20 20" aria-hidden="true"><circle r="9.4" fill="' + RC[k] + '"/>' + SIGN[k] + '</svg>';
  const jph = (x) => /intermission/i.test(x) ? 'Intermission' : /phase 3/i.test(x) ? 'P3' : /phase 2/i.test(x) ? 'P2' : /phase 1/i.test(x) ? 'P1' : ''; /* (no label on a line for the whole fight) */
  const jli = (x) => '<li>' + (jph(x) ? '<em class="gdz-jph">' + jph(x) + '</em>' : '') + '<span>' + esc(x) + '</span></li>';
  const job = role === 'all' ? '<div class="gdz-job gdz-jall"><h4>Your job <span>the first three for each role; pick yours above for all of them</span></h4><div class="gdz-job3">' + ['t', 'h', 'd'].map((k) => '<div style="--rc:' + RC[k] + '"><b>' + jic(k) + RN[k] + '</b><ul>' + (RL[k] || []).slice(0, 3).map(jli).join('') + '</ul></div>').join('') + '</div></div>'
    : '<div class="gdz-job" style="--rc:' + RC[role] + '"><h4>' + jic(role) + 'Your job<em class="gdz-jrole">' + RN[role] + '</em></h4><ul>' + (RL[role] || []).map(jli).join('') + '</ul></div>';
  // (your raid's assignments (your OK, Oct 20): the lines of your saved NSRT note for this boss that name you, the character you picked on your team)
  let asg = ''; try { const me = meOf(), all = (notesOf(S.gdzBoss).list || []);
    if (me && all.length) { const nm = me.name.split('-')[0], n = all.filter((x) => noteHas(noteResolve(x.text), nm)).sort((a, b) => (b.saved || 0) - (a.saved || 0))[0];
      if (n) { const P = E.parseNote(noteResolve(n.text)), lo = nm.toLowerCase();
        const ln = P.lines.filter((l) => l.words.some((w) => w.toLowerCase() === lo)).map((l) => { const oth = l.words.filter((w) => w.toLowerCase() !== lo && /^\p{Lu}/u.test(w)).slice(0, 4); return (l.label || 'With') + (oth.length ? ' · with ' + oth.join(', ') : ''); });
        const rm = P.reminders.filter((r) => r.tags.some((t) => t.toLowerCase() === lo) || noteHas(r.text, nm)).map((r) => clk(r.time) + ' · ' + (r.text || 'your reminder'));
        const it = ln.concat(rm); if (it.length) asg = '<div class="gdz-asg"><b>In your raid\'s note, for ' + esc(me.name) + '</b><ul>' + it.slice(0, 8).map(li).join('') + (it.length > 8 ? '<li>and ' + (it.length - 8) + ' more</li>' : '') + '</ul></div>'; } }
    else if (!me && all.length) asg = '<div class="gdz-asg"><b>Your raid has a note for this boss.</b><span>Pick which character is you on your team\'s page, and your own jobs from it show here.</span></div>'; } catch (e) { asg = ''; }
  const fails = []; G.phases.forEach((p) => (p.mechs || []).forEach((m) => { if (m.fail && !m.fail.solo) fails.push(m.fail); }));
  const wipe = fails.length ? '<div class="gdz-wipe"><h4><svg class="gdz-jgl" viewBox="-10 -10 20 20" aria-hidden="true"><circle r="9.4" fill="#e5534b"/><path d="M0 -5.6V1.2" stroke="#10131a" stroke-width="2.6" stroke-linecap="round"/><circle cy="4.6" r="1.6" fill="#10131a"/></svg>What wipes us</h4><ul>' + fails.slice(0, 4).map((x) => '<li><b>' + esc(x.name) + '</b><span>' + esc(String(x.what).split(/(?<=\.)\s+/).pop()) + '</span></li>').join('') + '</ul></div>' : '';
  const gl = document.createElement('section'); gl.className = 'gdz-glance'; gl.innerHTML = tl + '<div class="gdz-cards">' + job.replace('</h4>', '</h4>' + asg) + wipe + '</div>'; bar.after(gl);
  // your steps lit up, the other roles' dimmed
  const RX = { t: /\b(tanks?|off-tank|boss tank|taunts?)\b/i, h: /\b(healers?|heals?|dispel)/i, d: /\b(dps|warlocks?|mages?|hunters?|rogues?|melee|ranged|kicks?|carriers?)\b/i };
  if (role !== 'all') root.querySelectorAll('.gdz-steps li, .gdz-plan li').forEach((el) => { const tx = el.textContent, r = el.dataset.r; let me, oth;
    if (r != null) { me = r.includes(role); oth = !!r && !me; } else { me = RX[role].test(tx); oth = Object.entries(RX).some(([k, q]) => k !== role && q.test(tx)); } /* (set by hand, or guessed from the words) */
    el.classList.toggle('gdz-me', me); el.classList.toggle('gdz-oth', !me && oth); });
  // Quick: each mechanic is one line (yours, when you've picked a role); tap it for the map and steps
  root.querySelectorAll('.gdz-m:not(.gdz-whole)').forEach((a) => { const h = a.querySelector('.gdz-mt h4'); if (!h) return; const mine = a.querySelector('.gdz-steps li.gdz-me'), first = (a.querySelector('.gdz-what') || {}).textContent || '';
    const q = document.createElement('p'); q.className = 'gdz-qline'; q.innerHTML = mine ? '<b>You:</b> ' + esc(mine.textContent) : esc(first.split(/(?<=\.)\s+/)[0]); h.after(q);
    a.addEventListener('click', (e) => { if (!root.classList.contains('gdz-q')) return; if (!a.classList.contains('open')) a.classList.add('open'); else if (e.target.closest('.gdz-mt h4')) a.classList.remove('open'); }); }); /* (a closed row opens anywhere you click; the title closes it) */
  // Learn: the parts as tabs, and Watch the whole fight jumps to the simulation
  if (mode === 'learn') { gdzTabs(root); const w = bar.querySelector('.gdz-watch'), all = root.querySelector('#gdz-all'); if (w && all) w.onclick = () => { if (root._showSec) root._showSec(all); all.scrollIntoView({ behavior: 'smooth', block: 'start' }); }; }
  // the timeline's mechanics jump to their part of the page
  gl.querySelectorAll('.gdz-tlm').forEach((b) => (b.onclick = () => { const k = b.dataset.key; let el = null;
    if (k.startsWith('m:')) { const m = byId[k.slice(2)]; el = m && [...root.querySelectorAll('.gdz-m:not(.gdz-whole)')].find((a) => ((a.querySelector('h4') || {}).textContent || '').includes(m.name)); }
    else { const bt = (G.beats || {})[k.slice(2)], nm = bt ? bt.name.replace(/ \(.*$/, '') : ''; el = nm && [...root.querySelectorAll('.gdz-tile')].find((a) => ((a.querySelector('h5') || {}).textContent || '').includes(nm)); }
    if (!el) return; const sec = el.closest('.gdz-sec'); if (sec && sec.hidden && root._showSec) root._showSec(sec); if (root.classList.contains('gdz-q') && el.classList.contains('gdz-m')) el.classList.add('open');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.remove('gdz-flash'); void el.offsetWidth; el.classList.add('gdz-flash'); }));
}
// (look B: the page's parts as tabs, one shown at a time)
function gdzTabs(root) {
  const secs = [...root.querySelectorAll('.gdz-sec')]; if (!secs.length) return;
  const nm = (s) => ((s.querySelector('.gdz-sh h3') || {}).textContent || '').replace(/^Phase (\d): /, '$1 · ').replace(/^Intermission:.*/, 'Intermission').replace('Putting it all together', 'Whole fight').replace('Your job, by role', 'Your role');
  const nav = document.createElement('nav'); nav.className = 'gdz-tabs'; nav.innerHTML = secs.map((s, i) => '<button type="button" data-i="' + i + '">' + esc(nm(s)) + '</button>').join('');
  const ph = root.querySelector('.gdz-phn'); if (ph) ph.replaceWith(nav); else root.prepend(nav);
  const show = (i) => { S.gdzTab = i; secs.forEach((s, j) => (s.hidden = j !== i)); nav.querySelectorAll('button').forEach((b, j) => b.classList.toggle('on', j === i)); };
  nav.querySelectorAll('button').forEach((b) => (b.onclick = () => show(+b.dataset.i))); show(Math.min(S.gdzTab || 0, secs.length - 1));
  root._showSec = (sec) => { const i = secs.indexOf(sec); if (i >= 0) show(i); };
}
if (!window.WLA_HOSTED) window.__gdz = { GDZ, gdzWhole };

// ---- The guides' own fit of three room pictures (Oct 21): each checked against the game's floor map, turned and kept square on guide maps.
// Debriefing's maps keep ARENAS as it is until you say (a question in notes/Guides/Overnight boss guides - Oct 21 progress.md).
var GDZ_ARENAS = {
  'Entombed Sentinels': { f: '02.sentinels-ort-v108.jpg', w: 2123, h: 1188, cx: 367.5, cy: 710.5, s: 11, rot: -60, sq: true },
  'Vashnik the Malignant': { f: '03.vashnik-ort-enter-v180.jpg', w: 2448, h: 1371, cx: 272.2, cy: 451.3, s: 7.8, rot: -60, sq: true },
  Sszorak: { f: '05.sszorak-ort-v122.jpg', w: 2448, h: 1371, cx: -409, cy: 384.2, s: 11, rot: -17, sq: true },
  // (Nek'zali's guide was drawn on the picture's old spot (its centre is the guide's (0, 0)); Debriefing's now sits 9 yd north)
  "Nek'zali the Soulcoiler": { f: '01.nakzali-ort-v105.jpg', w: 2181, h: 1221, cx: 0, cy: 198, s: 11 },
};
// ---- New guides, for you only on the website for now (your call, Oct 21): they show when this browser knows you as Flëxørçïst, either
// the character you picked on your team or one on your signed-in Warcraft Logs account. Everyone else sees them as "Coming soon";
// the app on your PC shows all of them. The old Ula'tek guide is hidden on the website while it's rebuilt.
var GDZ_PRE = {}, GDZ_OPEN = false;
const GDZ_PREVIEW = ['Nymrissa Wavecaller', "Nek'zali the Soulcoiler", 'Entombed Sentinels', 'The Lost Explorers', 'Vashnik the Malignant', 'Sszorak', 'The Twin Fangs', "Kith'ix", "Ula'tek"], GDZ_HIDDEN = [];
GDZ_PREVIEW.forEach((b) => { if (GDZ[b]) { GDZ_PRE[b] = GDZ[b]; delete GDZ[b]; } });
if (window.WLA_HOSTED) GDZ_HIDDEN.forEach((b) => { delete GDZ[b]; });
function gdzOwner() {
  const n = (x) => String(x || '').normalize('NFC').toLowerCase(), me = ['flëxørçïst'];
  try { const m = meOf(); if (m && me.includes(n(m.name))) return true; const w = wclMe(); if (w && (w.chars || []).some((c) => me.includes(n(c.n)))) return true; } catch (e) { /* storage off */ }
  return false;
}
function gdzUnlock() { if (GDZ_OPEN || !GDZ_PRE || (window.WLA_HOSTED && !gdzOwner())) return; GDZ_OPEN = true; Object.assign(GDZ, GDZ_PRE); }
gdzUnlock();
