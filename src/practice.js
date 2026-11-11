// ===== Practice: play a part of the fight (Nov 11, Flex: "make an interactive 2d game for people to play parts of the fight to practice
// using real timings" / "like a browser game" / "try with just phase 1" / "Make sure the map moves with the person" / "its missing a lot of
// key details, right now its just following the walkthrough from the guide. Each part of the fight needs to be accounted for like not
// touching other eggs and things like that" / "it should feel like they are doing the fight") =====
// A pop-up over the guide. The fight runs on its real clock (the measured top Mythic kills, notes/Guides/Bosses/8 Ula'tek.md): every
// mechanic at its real moment and overlapping as in the fight, drawn by the guide's own scene maps (each placed at its real time) on the
// guide's own room picture. You are one raider and do your own job: wait for your egg's shell, pick it up, carry it clear of waves and of
// other carriers' rings, break it in your coil soak (Rancid Yolk, Soul Constrictor), get into the Wretch's bubble, get out of the tail's
// sweep, stay out of her reach, dodge the debris. The other 19 play the plan. Built into ui.js's scope next to guides.js (build.ps1,
// /*PRACTICE*/), so it uses the guide's kit, scenes and drawing.
const PG_PARTS = { "Ula'tek": { m: { name: 'Phase 1', end: 165, roles: [
  { id: 'r3', name: 'Ranged', note: 'Egg carrier, coil group 1' }, { id: 'm1', name: 'Melee', note: 'Egg carrier, coil group 2' }, { id: 'h2', name: 'Healer', note: 'No egg, coil group 2' }] } } };
const pgPart = (boss, d) => (PG_PARTS[boss] || {})[d] || null;
// (how much a hit takes off your health in the game: not the real numbers, but two big hits close together kill, as in the fight)
const PG_DMG = { wave: 45, ring: 35, beam: 40, burst: 35, cone: 80, fester: 50, bite: 60, thrash: 55, raid: 6, viper: 10, soul: 30, 'Toxic Womb': 60, 'Falling Debris': 55, egg: 30 };
const PG_SPEED = 7, PG_R = 0.7; // (your running speed in yards a second, as in the game; your own size for hits)
const pgClock = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const pgName = (s, fb) => { const t = String(s || '').split(':')[0].trim(); return t || fb; };
const PG_G1 = ['m3', 'm4', 'm5', 'm6', 'm7', 'h1', 'h3', 'r1', 'r3', 'r5', 'r7']; // (the coils scene's two soak groups)
const PG_EGGO = { r3: [-3, 4], m1: [0, 0], r5: [-3, 2], r1: [2, 3], r2: [-2, 3], r6: [3, -2], m2: [0, 0], r4: [3, 2] }; // (where each carrier's egg lands in their zone, as on the eggs map)

// ---- Ula'tek phase 1 on the real clock (seconds from the pull; T places each guide scene so its key moment lands at the real time) ----
// eggs: land 0:11 (cast 0:01) and 1:21 (cast 1:11), shells break 3.6 s later; Toxic Womb 0:03 (beam 0:07); Mother's Wrath 0:22 and 1:32;
// Fester Burst 0:38.6 and 1:14 (first Wretch), 1:48 and 2:21.6 (second); Spectral Coils slams 0:40.8/0:44.2 and 2:14.3/2:17.7; Mephitic
// Thrash 0:49 and 1:46; her Caustic Waves 0:56 and 1:53 (tails 0:58.6, 1:09, ...); the dive 1:17; Rage of the Shackled, heart open 2:25.
function pgPlan(east) {
  const rot = east ? -90 : 90;
  return { rot, east, eggs: [11, 81], shell: 3.6, segs: [
    { beat: 'start', T: 0 },
    { m: 'wretch', T: 4.4, keep: [0, 9] },
    { m: 'eggs', T: 8.6 },
    { m: 'wrath', T: 21.8 },
    { m: 'coils', T: 33.0, o: { set: 1 } },
    { m: 'thrash', T: 44.6 },
    { m: 'waves', T: 51.6 },
    { m: 'wretch', T: 59.4, keep: [9.4, 16] },
    { m: 'wretch', T: 73.4, keep: [0, 9], o: { img: 'SW' } },
    { beat: 'dive', T: 77, o: { east } },
    { m: 'eggs', T: 78.6, o: { rot } },
    { m: 'wrath', T: 91.8, o: { rot } },
    { m: 'wretch', T: 93.4, keep: [9.4, 16], o: { rot } },
    { m: 'thrash', T: 101.6, o: { rot } },
    { m: 'waves', T: 108.6, o: { rot } },
    { m: 'coils', T: 126.5, o: { set: 2, rot } },
    { m: 'heart', T: 142.8, o: east ? { e: true } : { rot: 90 } }],
  events: [[1, 'Call of the Serpent: eight eggs incoming'], [3, 'Toxic Womb lands in the middle'], [11, 'Eggs land: wait for the shells'], [22, 'Mother\'s Wrath'], [33, 'Her tail rises: Spectral Coils'],
    [36, 'Fester Burst: into the Wretch\'s bubble'], [40.8, 'Coil slam 1 (group 1)'], [44.2, 'Coil slam 2 (group 2)'], [45, 'Mephitic Thrash: out of 35 yards'], [50, 'Caustic Waves: the other half'],
    [70, 'Fester Burst'], [71, 'Call of the Serpent: eight more'], [72, 'Toxic Womb: a second Wretch'], [77, 'She dives: watch the bubbles'], [81, 'Eggs land'], [92, 'Mother\'s Wrath'],
    [102, 'Mephitic Thrash'], [104, 'Fester Burst'], [107, 'Caustic Waves: the hardest set'], [127, 'Spectral Coils, second set'], [139, 'Rage of the Shackled: burn the heart'], [165, 'Phase 2']] };
}

// one guide scene, built on its own (the guide's own map script), as a map
function pgScene(boss, G, d, s) {
  const kit = gdzKit(boss, 1); let L = 1; GDZ_SEG = { kit, next(len) { kit.seg(0, 0, len); L = Math.max(L, len); } };
  try { if (s.beat) { const b = (G.beats || {})[s.beat]; if (!b) return null; b.run(s.o || {}); } else { const m = G.phases.flatMap((p) => p.mechs || []).find((q) => q.id === s.m); if (!m || !m.map) return null; m.map(d, s.o); } }
  catch (e) { console.error(e); return null; } finally { GDZ_SEG = null; }
  return kit.done({ final: true, len: L, quiet: true, focus: { x: 0, y: 0, r: 30 } });
}
function pgBuild(boss, d, east) {
  const part = pgPart(boss, d), G0 = GDZ[boss]; if (!part || !G0) return null;
  const own = (o) => (!o || (o.only && o.only !== d) ? null : Object.assign({}, o, o[d] || {}));
  const G = own(G0); G.phases = G.phases.map(own).filter(Boolean).map((p) => ({ ...p, mechs: (p.mechs || []).map(own).filter(Boolean), tiles: (p.tiles || []).map(own).filter(Boolean) }));
  const P = pgPlan(east), EGGISH = new Set(['Call of the Serpent', 'Hardened', 'Noxious Shell', 'Rancid Yolk', 'Putrid Membrane', 'Soul Constrictor']), isP = (g) => /^[thmr]\d$/.test(g);
  const W = { P, segs: [], rings: [], waves: [], arcs: [], beams: [], cones: [], callouts: [], links: [], arrows: [], cbars: {}, wmarks: [], base: null };
  P.segs.forEach((s, i) => { const mp = pgScene(boss, G, d, s); if (!mp || !mp.frames || !mp.frames.length) return; if (!W.base) W.base = mp;
    const T = s.T, k0 = s.keep ? s.keep[0] : -1, k1 = s.keep ? s.keep[1] : 1e9, keep = (t) => t == null || (t >= k0 - 1e-6 && t <= k1), pre = 'S' + i + ':', G2 = (g) => (g == null ? g : isP(g) ? g : String(g).replace(/^s0:/, pre));
    const sh = (o, ks) => { const q = { ...o, _s: i, _m: s.m || s.beat }; ks.forEach((kk) => { if (q[kk] != null) q[kk] += T; }); return q; };
    // (which raiders this scene moves: they follow it while it plays; the rest follow the newest scene)
    const f0 = new Map(mp.frames[0].pts.map((p) => [p.guid, p])), dyn = new Set(); mp.frames.forEach((f) => { if (f.t < (k0 < 0 ? 0 : k0) || f.t > k1) return; f.pts.forEach((p) => { const a = f0.get(p.guid); if (p.kind === 'player' && a && Math.hypot(p.x - a.x, p.y - a.y) > 1.5) dyn.add(p.guid); }); });
    W.segs.push({ i, T, k0: Math.max(0, k0), k1: Math.min(mp.frames[mp.frames.length - 1].t, k1), frames: mp.frames, dyn, G2, s });
    (mp.rings || []).forEach((g) => { if (EGGISH.has(g.cn) || !keep(g.at != null ? g.at : g.t0)) return; W.rings.push({ ...sh(g, ['t0', 'at']), guid: G2(g.guid), on: G2(g.on) }); });
    (mp.waves || []).forEach((w) => { if (keep(w.t0)) W.waves.push(sh(w, ['t0', 't1'])); });
    (mp.arcs || []).forEach((w) => { if (keep(w.t0)) W.arcs.push(sh(w, ['t0', 't1'])); });
    (mp.beams || []).forEach((w) => { if (keep(w.t0)) W.beams.push(sh(w, ['t0', 't1'])); });
    (mp.cones || []).forEach((c) => { if (keep(c.at)) W.cones.push(sh(c, ['at'])); });
    (mp.callouts || []).forEach((c) => { if (keep(c.t0) && !/^(Break the shells)$/.test(c.text || '')) W.callouts.push({ ...sh(c, ['t0', 't1', 'pop']), on: G2(c.on) }); });
    (mp.links || []).forEach((c) => { if (keep(c.t0)) W.links.push({ ...sh(c, ['t0', 't1']), from: G2(c.from), to: G2(c.to) }); });
    (mp.arrows || []).forEach((c) => { if (keep(c.t0 != null ? c.t0 : c.at)) W.arrows.push({ ...sh(c, ['t0', 't1', 'at']), g: G2(c.g) }); });
    Object.entries(mp.cbars || {}).forEach(([g, l]) => { const gg = G2(g); l.forEach((b) => { if (keep(b.t0)) (W.cbars[gg] = W.cbars[gg] || []).push({ ...b, t0: b.t0 + T, t1: b.t1 + T }); }); });
    (mp.wmarks || []).forEach((w) => W.wmarks.push(w)); });
  // (which coil slam is the first of its set: group 1 takes it, group 2 the second)
  const bySeg = {}; W.rings.filter((g) => g.fx === 'soak').forEach((g) => { (bySeg[g._s] = bySeg[g._s] || []).push(g); }); Object.values(bySeg).forEach((l) => l.sort((a, b) => a.at - b.at).forEach((g, j) => { g._ord = j; }));
  return W.base ? W : null;
}

// (the nearest spot on the room's floor, for an egg that would land off it)
function pgFloorSpot(FLR, A, x, y) { const m = FLR && (FLR.def || null); if (!m) return [x, y]; const on = (qx, qy) => { const row = m[Math.round(qy - A.cy)]; if (!row) return false; const lx = qx - A.cx; return row.some(([a, b]) => lx >= a + 1.5 && lx <= b - 1.5); };
  if (on(x, y)) return [x, y]; for (let r = 1; r <= 12; r += 1) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, qx = x + Math.cos(a) * r, qy = y + Math.sin(a) * r; if (on(qx, qy)) return [qx, qy]; } return [x, y]; }
function pgOpen(root, boss, d) {
  const part = pgPart(boss, d); if (!part) return; const old = document.querySelector('.pg'); if (old) old.remove();
  pgCss(); if (typeof gdzCss === 'function') gdzCss();
  let east = Math.random() < 0.5, W; try { W = pgBuild(boss, d, east); } catch (e) { console.error(e); W = null; }
  if (!W) return;
  const pmap = gdzPmap(), dn = d === 'h' ? 'Heroic' : 'Mythic', A = GDZ_ORIGIN[boss] || ARENAS[boss] || { cx: 0, cy: 0 }, FLR = GDZ_FLOOR[boss] || null, END = part.end;
  const ov = document.createElement('div'); ov.className = 'pg'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Practice ' + boss + ' ' + part.name);
  ov.innerHTML = '<div class="pg-in"><div class="pg-h"><div><span class="pg-k">Practice · ' + dn + '</span><b>' + esc(boss) + ': ' + esc(part.name) + '</b></div>' +
    '<span class="pg-keys">Move: W A S D, the arrows, or click · Shift: speed boost · Wheel: zoom · Space: pause</span><button type="button" class="pg-x" aria-label="Close">✕</button></div>' +
    '<div class="pg-b"><div class="pg-mapw"><div class="pg-map"></div><div class="pg-cast" hidden><span></span><i></i></div><div class="pg-toast" aria-live="polite"></div><div class="pg-card"></div></div>' +
    '<aside class="pg-side"><div class="pg-clk"><span>Fight clock</span><b>0:00</b></div>' +
    '<div class="pg-hp"><span>Health</span><div class="pg-hpb"><i></i></div><div class="pg-buffs"></div></div>' +
    '<div class="pg-job"><span class="pg-lab">Your job now <em class="pg-spd"></em></span><p></p></div>' +
    '<div class="pg-asg"><span class="pg-lab">Your assignments</span><ul></ul></div>' +
    '<div class="pg-next"><span class="pg-lab">Up next</span><b></b></div>' +
    '<div class="pg-log"><span class="pg-lab">Mistakes <em>0</em></span><ol></ol></div>' +
    '<div class="pg-opts"><label><input type="checkbox" class="pg-ghost"> Show my spot from the plan</label><button type="button" class="pg-btn pg-pause">Pause</button></div></aside></div></div>';
  (root && root.isConnected ? root : document.body).appendChild(ov); document.documentElement.classList.add('pg-open');
  const box = ov.querySelector('.pg-map'), card = ov.querySelector('.pg-card'), toast = ov.querySelector('.pg-toast'), mapw = ov.querySelector('.pg-mapw');
  const base = { ...W.base, title: '', pauses: [], steps: [], tags: [], hl: [], good: [], bad: [], goodAt: null, badAt: null, rings: [], waves: [], arcs: [], beams: [], cones: [], callouts: [], links: [], arrows: [], cbars: {}, wmarks: W.wmarks };
  box.innerHTML = miniMap(base, pmap); try { bindZoom(box); } catch (e) { /* (no zoom: the map still plays) */ } try { hydrateMapIcons(box); } catch (e) { /* (icons load later) */ }
  const svg = box.querySelector('svg.zmap'); if (!svg) { ov.remove(); document.documentElement.classList.remove('pg-open'); return; }
  const [ox, oy] = (svg.getAttribute('data-o') || '0,0').split(',').map(Number), yd = +svg.getAttribute('data-yd') || 1;
  const SX = (x) => (x - ox) * yd, SY = (y) => (-y - oy) * yd; // (yards in the room to the map's own units)
  // (the camera: centred on you and following as you run, about 60 yards across; the mouse wheel zooms)
  let Z = 36, cam = null, camT = 0; const fit = (snap) => { if (!G || !box._zoomTo) return; const now = performance.now(), k = snap || !cam ? 1 : Math.min(1, (now - camT) / 1000 * 7); camT = now;
    cam = cam && !snap ? [cam[0] + (G.x - cam[0]) * k, cam[1] + (G.y - cam[1]) * k] : [G.x, G.y]; box._zoomTo([SX(cam[0]) - Z * yd, SY(cam[1]) - Z * yd, 2 * Z * yd, 2 * Z * yd]); };
  svg.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); Z = Math.min(70, Math.max(14, Z * (e.deltaY > 0 ? 1.12 : 1 / 1.12))); fit(true); }, { capture: true, passive: false });
  const inner = (html) => { const a = html.indexOf('<svg'), b = html.indexOf('>', a), c = html.indexOf('</svg><div class="zscale">', b); return html.slice(b + 1, c); };
  const R = (p, deg) => { if (!deg) return p; const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
  const WX = (p) => [A.cx + p[0], A.cy + p[1]];

  // ---- the game ----
  let me = null, role = part.roles[0], G = null, raf = null, last = 0, lastDraw = 0, paused = true, keys = {}, target = null, speed = 1, startAt = 0;
  const grp = (id) => (PG_G1.includes(id) ? 0 : 1), myGroup = () => grp(me);
  // (where to start, to practise one stretch: the game plays up to it for you, then hands you the controls)
  const PG_START = [[0, 'The pull'], [30, '0:30 · First coils and the bubble'], [44, '0:44 · Tail sweep, then her waves'], [66, '1:06 · Second eggs and the dive'], [98, '1:38 · The hardest waves'], [122, '2:02 · Second coils'], [138, '2:18 · The heart burn']];
  // your assignments: what you do, and when
  const asgList = (id) => { const g = grp(id), ts = (l) => l.map((t) => pgClock(t)).join(', '), at = (f) => W.rings.filter(f).map((q) => q.at).sort((a, b) => a - b), out = [];
    if (PG_EGGO[id]) out.push({ k: 'Egg carrier', d: 'Your egg lands in your zone (gold on the map). Pick it up once its shell breaks, carry it clean, break it in your coil soak.', t: W.P.eggs.slice() });
    else out.push({ k: 'No egg', d: 'Keep out of the carriers\' way, and away from eggs on the floor.', t: [] });
    out.push({ k: 'Coil soak: group ' + (g + 1), d: (g ? 'The second' : 'The first') + ' slam of each set (your circle turns gold). Never both: Soul Constrictor.', t: at((q) => q.fx === 'soak' && q._ord === g) });
    out.push({ k: 'The Wretch\'s bubble', d: 'Within 10 yards of the Wretch when Fester Burst goes off.', t: at((q) => q.cn === 'Fester Burst' && q.fx === 'burst') });
    out.push({ k: 'Her tail\'s sweep', d: 'Out of 35 yards from her tail.', t: at((q) => q.cn === 'Mephitic Thrash' && q.fx === 'burst') });
    out.push({ k: 'Her reach', d: 'Mother\'s Wrath: stay out of the red circle in front of her (that\'s the tank\'s).', t: [22, 92] });
    out.push({ k: 'Her waves', d: 'Wait on the half that goes second, then cross behind the first wave.', t: [56, 113] });
    out.push({ k: 'The heart burn', d: 'Step out of the brown circles.', t: [145] });
    return out.map((o) => ({ ...o, ts: ts(o.t) })); };
  const asgHtml = (id, t) => { const l = asgList(id), nx = l.map((o) => o.t.find((q) => q > t)).reduce((a, q, i) => (q != null && (a == null || q < l[a].t.find((z) => z > t)) ? i : a), null);
    return l.map((o, i) => '<li class="' + (i === nx ? 'on' : o.t.length && o.t.every((q) => q <= t) ? 'past' : '') + '"><b>' + esc(o.k) + '</b>' + (o.ts ? '<time>' + esc(o.ts) + '</time>' : '') + '<span>' + esc(o.d) + '</span></li>').join(''); };
  // the eggs: eight per set, each landing in its carrier's zone (the zones turn with her after the dive); you carry yours, the others carry theirs
  const mkEggs = () => { const out = []; W.P.eggs.forEach((land, si) => { const rot = si ? W.P.rot : 0; Object.keys(PG_EGGO).forEach((id, i) => { const z = UX_ZONE[id], o = PG_EGGO[id], p = WX(R([z[0] + o[0], z[1] + o[1]], rot));
    const brk = W.rings.filter((g) => g.fx === 'soak' && g.at > land).sort((a, b) => a.at - b.at), bg = PG_G1.includes(id) ? 0 : 1, br = brk.find((g) => g._ord === bg);
    const q0 = pgFloorSpot(FLR, A, p[0], p[1]); p[0] = q0[0]; p[1] = q0[1];
    out.push({ id, set: si, land: land + (i % 3) * 0.6, shell: land + W.P.shell, x: p[0], y: p[1], who: null, pick: land + W.P.shell + 0.8 + (i % 3) * 0.3, brk: br ? br.at : 1e9, state: 'air' }); }); }); return out; };
  const reset = () => { G = { t: 0, hp: 100, x: 0, y: 0, done: new Set(), log: [], deaths: 0, near: {}, over: false, eggs: mkEggs(), yolk: -99, soul: -99, boost: -99, adds: [], bots: new Map(), npc: new Map(), kb: null, fx: [], still: true }; target = null; keys = {}; cam = null; };
  const segsAt = (t) => W.segs.filter((s) => t >= s.T + s.k0 && t <= s.T + s.k1);
  const frameOf = (s, t) => { const fr = s.frames, lt = Math.max(0, t - s.T), i = Math.min(fr.length - 1, Math.floor(lt / 0.25)), a = fr[i], b = fr[Math.min(i + 1, fr.length - 1)], w = b.t > a.t ? Math.min(1, Math.max(0, (lt - a.t) / (b.t - a.t))) : 0;
    if (!w || a === b) return a.pts; const nb = new Map(b.pts.map((p) => [p.guid, p])); return a.pts.map((p) => { const q = nb.get(p.guid); return q ? { ...p, x: p.x + (q.x - p.x) * w, y: p.y + (q.y - p.y) * w } : p; }); };
  // where everything is at t: the scenes playing (their bosses and adds), the 19 others where the plan has them (gliding, never jumping), you, the eggs
  const world = (t, dt) => { const act = segsAt(t), pts = [], plan = {}, raw = {}, pick = {};
    const newest = act.reduce((a, s) => (!a || s.T + s.k0 >= a.T + a.k0 ? s : a), null), dive = act.find((s) => s.s.beat === 'dive');
    // (one of each boss and add: her and her tail from the dive while she dives, else from the newest scene that has them; every scene's own units are kept for the hit checks)
    act.forEach((s) => { frameOf(s, t).forEach((p) => { if (p.kind === 'player') { if (s === newest) plan[p.guid] = { x: p.x, y: p.y }; return; }
      if (p.kind === 'egg' || /^Blightscale (Viper|Rawling)/.test(p.name || '')) return; const g = s.G2(p.guid), nm = p.name || g; raw[g] = [p.x, p.y];
      const pr = (dive && s === dive && /^(Ula'tek|Gore Rattle)$/.test(nm) ? 1e6 : 0) + s.T + s.k0; if (!pick[nm] || pr >= pick[nm].pr) pick[nm] = { pr, p: { ...p, guid: g } }; }); });
    Object.values(pick).forEach((o) => pts.push(o.p)); G.raw = raw;
    // (the boss stays on the map between scenes; the Wretch stays with the off tank)
    if (!pts.some((p) => p.kind === 'boss' && /Ula/.test(p.name || ''))) { const b = WX(t < 86 ? [0, 46] : R([0, 46], W.P.rot)); pts.push({ guid: 'pg-ul', name: 'Ula\'tek', kind: 'boss', x: b[0], y: b[1] }); }
    GDZ_RAID.forEach((id) => { if (id === me) return; const tg = plan[id], cur = G.bots.get(id); if (!tg) { if (cur) pts.push({ ...cur }); return; }
      const q = cur ? { ...cur } : { guid: id, name: gdzName(id), kind: 'player', x: tg.x, y: tg.y }; const dx = tg.x - q.x, dy = tg.y - q.y, dd = Math.hypot(dx, dy), mv = PG_SPEED * (dt || 0); /* (the others run at your speed) */
      const mv2 = dd > 15 ? mv * 1.4 : mv; /* (far behind: as fast as your speed boost) */ if (!cur) { q.x = tg.x; q.y = tg.y; } else if (dd > mv2) { q.x += dx / dd * mv2; q.y += dy / dd * mv2; } else { q.x = tg.x; q.y = tg.y; } G.bots.set(id, q); pts.push(q); });
    // (carriers keep out of each other's 3-yard circles: the others step apart, and never walk into yours while you stand still)
    const carr = G.eggs.filter((e) => e.state === 'held' && e.who && e.who !== me).map((e) => G.bots.get(e.who)).filter(Boolean), meC = G.eggs.some((e) => e.state === 'held' && e.who === me);
    for (let it = 0; it < 3; it++) { for (let i = 0; i < carr.length; i++) for (let j = i + 1; j < carr.length; j++) { const a = carr[i], b = carr[j], ex = b.x - a.x, ey = b.y - a.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.8) { const pu = (3.8 - ee) / 2, ux = ex / ee, uy = ey / ee; a.x -= ux * pu; a.y -= uy * pu; b.x += ux * pu; b.y += uy * pu; } }
      if (meC && G.still) for (const b of carr) { const ex = b.x - G.x, ey = b.y - G.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.8) { b.x = G.x + ex / ee * 3.8; b.y = G.y + ey / ee * 3.8; } } }
    if (!pts.some((p) => /Wretch/.test(p.name || '')) && t > 5.4 && t < END) { const tk = G.bots.get('t2'); if (tk) pts.push({ guid: 'pg-wr', name: 'Blightscale Wretch', kind: 'add', x: tk.x + 2.5, y: tk.y - 1 }); }
    // (no jumps: each boss and add glides from where it was last shown to where this moment's map has it; the raiders run on their own above)
    pts.forEach((p, i) => { if (p.kind === 'player') return; const k = p.name || p.guid, c = G.npc.get(k);
      if (!c || !dt || t - c.seen > 0.5 || /^(Gore Rattle|Spectral Ula'tek|Venomous Heart)$/.test(k)) { G.npc.set(k, { x: p.x, y: p.y, seen: t }); return; } /* (her tail, the image and the heart rise in place; anything new appears where it is) */
      c.seen = t; const ex = p.x - c.x, ey = p.y - c.y, ee = Math.hypot(ex, ey), mv = (ee > 20 ? 12 : 8) * dt;
      if (ee > mv) { c.x += ex / ee * mv; c.y += ey / ee * mv; } else { c.x = p.x; c.y = p.y; } pts[i] = { ...p, x: c.x, y: c.y }; });
    pts.push({ guid: me, name: gdzName(me), kind: 'player', x: G.x, y: G.y });
    G.eggs.forEach((e, i) => { if (e.state === 'air' || e.state === 'gone') return; const b = e.who && e.who !== me ? G.bots.get(e.who) : null, h = e.who ? (e.who === me ? [G.x, G.y] : (b ? [b.x, b.y] : null)) : [e.x, e.y]; if (h) pts.push({ guid: 'pg-egg' + i, name: 'Egg', kind: 'egg', x: h[0] + (e.who ? 0.9 : 0), y: h[1] + (e.who ? 0.9 : 0) }); });
    G.adds = G.adds.filter((a) => t < a.t1); G.adds.forEach((a, i) => pts.push({ guid: 'pg-add' + i, name: a.name, kind: 'add', x: a.x, y: a.y }));
    G.plan = plan; return { pts, plan }; };
  const posOf = (pts, guid) => { if (guid === me) return [G.x, G.y]; if (G.raw && G.raw[guid]) return G.raw[guid]; const p = pts.find((q) => q.guid === guid); return p ? [p.x, p.y] : null; };
  const artAt = (t) => { let a = W.base.art || null; for (const [tt, aa] of W.base.artAt || []) if (tt <= t + 1e-6) a = aa; return a; };
  const walk = (x, y) => { if (!FLR) return true; const m = (artAt(G.t) && FLR.art[artAt(G.t)]) || FLR.def; if (!m) return true; const row = m[Math.round(y - A.cy)]; if (!row) return false; const lx = x - A.cx; return row.some(([a, b]) => lx >= a - 0.5 && lx <= b + 0.5); };

  // what hurts, as the map draws it
  const inWave = (w, t, x, y) => { if (t < w.t0 || t > w.t1) return false; const el = t - w.t0;
    if (w.ring) { const Rr = w.v * el + 2.5, st = 2 * Math.PI / w.n, hz = (w.cw || 7) / 2, ph = w.ph != null ? w.ph : (w.deg || 0) * Math.PI / 180;
      for (let k = 0; k < w.n; k++) { const a = ph + k * st, u = Math.cos(a), v = Math.sin(a), rx = x - (w.x + u * Rr), ry = y - (w.y + v * Rr), s1 = rx * u + ry * v, s2 = -rx * v + ry * u; if (Math.abs(s2) <= hz + PG_R && s1 >= -2.4 - PG_R && s1 <= 3.6 + PG_R) return true; }
      return false; }
    const a = w.deg * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), cx = w.x + u * w.v * el, cy = w.y + v * w.v * el, rx = x - cx, ry = y - cy, s1 = rx * u + ry * v, s2 = -rx * v + ry * u, hw = w.w / 2, hd = (w.d || 4) / 2;
    if (Math.abs(s2) > hw + PG_R) return false; if (w.cres && !w.cres.some(([a0, b0]) => s2 >= a0 - PG_R && s2 <= b0 + PG_R)) return false;
    const bw = (w.bow || 0) * Math.max(0, 1 - Math.pow(s2 / hw, 2)); return s1 >= -hd + bw - PG_R && s1 <= hd + bw + (w.cres ? 3 : 0) + PG_R; };
  const inArc = (w, t, x, y) => { if (t < w.t0 || t > w.t1) return false; const r = w.r0 + w.v * (t - w.t0), dd = Math.hypot(x - w.x, y - w.y); if (Math.abs(dd - r) > (w.d || 4) / 2 + PG_R) return false;
    const ang = Math.atan2(y - w.y, x - w.x) * 180 / Math.PI, inside = (a0, a1) => { for (let k = -2; k <= 2; k++) { const q = ang + 360 * k; if (q >= a0 && q <= a1) return true; } return false; };
    return inside(w.a0, w.a1) && !(w.gaps || []).some(([g0, g1]) => inside(g0, g1)); };
  const inBeam = (b, t, x, y) => { if (t < b.t0 || t > b.t1) return false; const a = (b.a0 + b.v * (t - b.t0)) * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), rx = x - b.x, ry = y - b.y, s1 = rx * u + ry * v, s2 = -rx * v + ry * u; return s1 >= 1.5 && s1 <= b.len + PG_R && Math.abs(s2) <= b.w / 2 + PG_R; };
  const inCone = (c, x, y) => { const dd = Math.hypot(x - c.x, y - c.y); if (dd > c.r + PG_R) return false; let da = Math.atan2(y - c.y, x - c.x) - c.dir; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; return Math.abs(da) <= c.half + (dd > 0.1 ? Math.atan(PG_R / dd) : Math.PI); };
  const carrying = () => G.eggs.some((e) => e.who === me && e.state === 'held');
  const say = (text) => { toast.textContent = text; toast.className = 'pg-toast ok'; void toast.offsetWidth; toast.classList.add('in'); };
  const mistake = (text, dmg) => { G.log.push({ t: G.t, text }); if (dmg) { G.hp -= dmg; G.fx.push({ x: G.x, y: G.y, text: '−' + dmg, t0: G.t }); mapw.classList.remove('hit'); void mapw.offsetWidth; mapw.classList.add('hit'); }
    toast.textContent = text + (dmg ? ' −' + dmg : ''); toast.className = 'pg-toast'; void toast.offsetWidth; toast.classList.add('in'); side(true); };
  const hatch = (e, x, y, why) => { e.state = 'gone'; e.who = null; G.adds.push({ name: 'Blightscale Viper', x: x + 1.5, y: y - 1, t1: G.t + 8 }); mistake(why + ': a Viper hatched (Putrid Membrane on the raid).', PG_DMG.viper); };
  const hit = (key, text, dmg, wave) => { if (G.done.has(key)) return false; G.done.add(key); mistake(text, dmg); const e = G.eggs.find((q) => q.who === me && q.state === 'held'); if (e && wave) hatch(e, G.x, G.y, 'A wave touched your egg'); return true; };
  const check = (t0, t, pts) => { const x = G.x, y = G.y;
    W.waves.forEach((w, i) => { if (!G.done.has('w' + i) && inWave(w, t, x, y)) hit('w' + i, pgName(w.legend, 'Caustic Waves') + ' hit you.', w.ring ? PG_DMG.ring : PG_DMG.wave, true); });
    W.arcs.forEach((w, i) => { if (!G.done.has('a' + i) && inArc(w, t, x, y)) hit('a' + i, pgName(w.legend, 'A wave') + ' hit you.', PG_DMG.ring, true); });
    W.beams.forEach((b, i) => { if (!G.done.has('b' + i) && inBeam(b, t, x, y)) hit('b' + i, pgName(b.legend, 'A beam') + ' hit you.', PG_DMG.beam, false); });
    W.cones.forEach((c, i) => { if (!c.soak && c.at > t0 && c.at <= t && inCone(c, x, y)) hit('c' + i, 'A frontal hit you.', PG_DMG.cone, false); });
    W.rings.forEach((g, i) => { const at = g.at; if (at == null || !(at > t0 && at <= t)) return; const c = g.guid ? posOf(pts, g.guid) : [g.x, g.y]; if (!c || c[0] == null) return; const dd = Math.hypot(x - c[0], y - c[1]), r = g.r || 0;
      if (g.fx === 'soak') { if (dd <= r) { if (t - G.soul < 5) mistake('Soul Constrictor: you soaked the slam before, so you couldn\'t help with this one.', PG_DMG.soul); else { const e = G.eggs.find((q) => q.who === me && q.state === 'held'); if (e) { e.state = 'gone'; e.who = null; G.yolk = t; G.adds.push({ name: 'Blightscale Rawling', x: x + 1.2, y: y + 1.2, t1: t + 10 }); say('Soaked. Your egg broke: a Rawling, and Rancid Yolk for 20 s.'); } else say('Soaked.'); }
          G.soul = t; } else if (g._ord === myGroup()) mistake('You missed your Spectral Coils soak (group ' + (myGroup() + 1) + '): the others took more.', 0); return; }
      if (g.fx !== 'burst') return;
      if (g.cn === 'Fester Burst') { if (dd > r + PG_R * 0.5) hit('r' + i, 'Fester Burst: you were outside the Wretch\'s bubble.', PG_DMG.fester, false); return; }
      if (g.cn === 'Bite') { const z = W.rings.find((q) => q._s === g._s && q.cn === 'Mother\'s Wrath' && q.fx === 'zone'); if (z && Math.hypot(x - z.x, y - z.y) <= (z.r || 5) + PG_R) hit('bite' + g._s, 'Mother\'s Wrath: you were in her reach for the bites.', PG_DMG.bite, false); return; }
      if (r >= 40 && g.cn !== 'Mephitic Thrash') { G.hp -= PG_DMG.raid; return; }
      if (dd <= r + PG_R * 0.5) { if (g.cn === 'Mephitic Thrash') { if (hit('r' + i, 'Mephitic Thrash: you were inside its 35 yards (a big hit and a knockback).', PG_DMG.thrash, false)) { const a = Math.atan2(y - c[1], x - c[0]); G.kb = { t0: t, x0: x, y0: y, x1: c[0] + Math.cos(a) * Math.min(48, dd + 14), y1: c[1] + Math.sin(a) * Math.min(48, dd + 14) }; } }
        else hit('r' + i, (g.cn || 'An impact') + ' hit you.', PG_DMG[g.cn] || PG_DMG.burst, false); } });
    // the eggs: they land (4 yards), their shells break, the carriers pick theirs up, break them in their soak; waves hatch any they touch
    G.eggs.forEach((e, i) => { if (e.state === 'air' && t >= e.land) { e.state = 'floor'; if (Math.hypot(x - e.x, y - e.y) <= 4 + PG_R * 0.5) hit('egg' + i, 'An egg landed on you.', PG_DMG.egg, false); }
      if (e.state === 'floor' && e.id !== me && t >= e.pick) { e.state = 'held'; e.who = e.id; }
      if (e.state === 'held' && e.who !== me && t >= e.brk) { e.state = 'gone'; const b = G.bots.get(e.who); if (b) G.adds.push({ name: 'Blightscale Rawling', x: b.x + 1, y: b.y + 1, t1: t + 9 }); e.who = null; }
      if (e.state === 'floor' && e.id === me) { if (W.waves.some((w) => w._m !== 'wretch' && inWave(w, t, e.x, e.y))) hatch(e, e.x, e.y, 'Your egg was still on the floor when a wave rolled over it');
        else if (t >= e.shell && Math.hypot(x - e.x, y - e.y) <= 2.6) { if (t - G.yolk < 20 && !G.done.has('yolk' + i)) { G.done.add('yolk' + i); mistake('You picked up an egg with Rancid Yolk on you: three times the egg\'s damage.', 40); } e.state = 'held'; e.who = me; say('You picked up your egg. Keep it out of waves and away from other carriers.'); }
        else if (t >= e.brk + 1 && !G.done.has('left' + i)) { G.done.add('left' + i); mistake('You never picked up your egg.', 0); } } });
    // another carrier must never come into your 3-yard circle (the boss notes: Noxious Shell, "touching another small-egg carrier hatches a viper")
    if (carrying()) G.eggs.forEach((e) => { if (e.state !== 'held' || !e.who || e.who === me) return; const b = G.bots.get(e.who); if (!b) return;
      if (Math.hypot(x - b.x, y - b.y) < 3 && !(G.near[e.who] > t - 4)) { G.near[e.who] = t; const mine = G.eggs.find((q) => q.who === me && q.state === 'held'); if (mine) hatch(mine, x, y, gdzName(e.who) + ' (carrying an egg too) came into your 3-yard circle'); } });
    G.hp = Math.min(100, G.hp + 4 * (t - t0)); };

  // drawing: the guide's map at this moment, with you, the eggs, and (if on) your spot from the plan
  const draw = (w) => { const t = G.t, mine = G.eggs.find((e) => e.id === me && e.state === 'floor'), rings = W.rings.slice();
    G.eggs.forEach((e) => { if (e.state === 'air' && t >= e.land - 2.2) rings.push({ x: e.x, y: e.y, r: 4, fx: 'burst', t0: e.land - 2.2, at: e.land, dur: 2.6, color: '#c8a36a', cn: 'Call of the Serpent' });
      if (e.state === 'floor' && t < e.shell) rings.push({ x: e.x, y: e.y, r: 2.4, fx: 'safe', t0: e.land, dur: e.shell - e.land, color: '#e6e0c8', cn: 'Hardened' });
      if (e.state === 'held' && e.who) rings.push({ guid: e.who, on: e.who, r: 3, fx: 'debuff', t0: t - 0.1, dur: 1, color: '#3af2a8', cn: 'Noxious Shell' }); });
    if (t - G.yolk < 20) rings.push({ guid: me, on: me, r: 2.2, fx: 'debuff', t0: t - 0.1, dur: 1, color: '#c8a36a', cn: 'Rancid Yolk' });
    if (t - G.soul < 5) rings.push({ guid: me, on: me, r: 1.8, fx: 'debuff', t0: t - 0.1, dur: 1, color: '#b06bff', cn: 'Soul Constrictor' });
    let html; try { html = miniMap({ ...base, pts: w.pts, ft: t, _kp: base.pts, rings, waves: W.waves, arcs: W.arcs, beams: W.beams, cones: W.cones, callouts: W.callouts, links: W.links, arrows: W.arrows, cbars: W.cbars, hl: [me], tags: [[me, 'You', -1, 1e9, 1]] }, pmap); } catch (e) { return; }
    let s = inner(html);
    if (mine) s += '<circle cx="' + SX(mine.x).toFixed(1) + '" cy="' + SY(mine.y).toFixed(1) + '" r="' + (2.6 * yd).toFixed(1) + '" fill="none" stroke="#f3c969" stroke-width="2" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"><animate attributeName="stroke-opacity" values="1;.35;1" dur="1s" repeatCount="indefinite"/></circle>';
    const ze = G.eggs.find((e) => e.id === me && e.state === 'air' && e.land - t <= 12); if (ze) s += '<circle cx="' + SX(ze.x).toFixed(1) + '" cy="' + SY(ze.y).toFixed(1) + '" r="' + (4.5 * yd).toFixed(1) + '" fill="rgba(243,201,105,.10)" stroke="#f3c969" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>';
    W.rings.forEach((g) => { if (g.fx === 'soak' && g._ord === myGroup() && g.x != null && t >= g.t0 - 0.2 && t <= g.at + 0.3) s += '<circle cx="' + SX(g.x).toFixed(1) + '" cy="' + SY(g.y).toFixed(1) + '" r="' + ((g.r || 10) * yd).toFixed(1) + '" fill="none" stroke="#f3c969" stroke-width="3" stroke-dasharray="8 5" vector-effect="non-scaling-stroke"/>'; });
    G.fx = G.fx.filter((f) => t - f.t0 < 1.4); G.fx.forEach((f) => { const X0 = SX(f.x), Y0 = SY(f.y), el = t - f.t0; s += '<g class="ic" data-x="' + X0.toFixed(1) + '" data-y="' + Y0.toFixed(1) + '"><text x="' + X0.toFixed(1) + '" y="' + (Y0 - 26 - el * 22).toFixed(1) + '" text-anchor="middle" font-size="20" font-weight="800" fill="#ff8f87" stroke="#000" stroke-width="4" paint-order="stroke" opacity="' + Math.max(0, 1 - el / 1.4).toFixed(2) + '">' + esc(f.text) + '</text></g>'; });
    const cb = ov.querySelector('.pg-cast'), ne = W.P.events.find(([at]) => at > t && at - t <= 6); if (ne) { cb.hidden = false; cb.querySelector('span').textContent = ne[1] + ' · ' + (ne[0] - t).toFixed(1) + ' s'; cb.querySelector('i').style.width = ((1 - (ne[0] - t) / 6) * 100).toFixed(1) + '%'; } else cb.hidden = true;
    const plan = w.plan[me]; if (plan && ov.querySelector('.pg-ghost').checked) s += '<circle cx="' + SX(plan.x).toFixed(1) + '" cy="' + SY(plan.y).toFixed(1) + '" r="' + (1.6 * yd).toFixed(1) + '" fill="rgba(243,201,105,.12)" stroke="#f3c969" stroke-width="1.6" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>';
    svg.innerHTML = s; fit(); };

  // the side panel: the clock, your health and debuffs, your job right now, what's next, your mistakes
  let sideKey = '';
  const job = () => { const t = G.t, e = G.eggs.find((q) => q.id === me && (q.state === 'floor' || q.state === 'air') && q.land - t < 12), held = carrying();
    if (t - G.yolk < 20 && !held && e) return 'Rancid Yolk for ' + Math.ceil(20 - (t - G.yolk)) + ' s: don\'t pick up another egg yet.';
    if (held) return 'Carrying your egg: keep it out of every wave and keep the other carriers out of your 3-yard circle. Break it in your coil soak (group ' + (myGroup() + 1) + ').';
    if (e && e.state === 'air') return 'Eggs land in ' + Math.max(0, Math.ceil(e.land - t)) + ' s: stay out of the impact circles. Yours lands in your zone.';
    if (e && t < e.shell) return 'Your egg\'s shell breaks in ' + Math.ceil(e.shell - t) + ' s (the gold circle). Wait by it.';
    if (e) return 'Pick up your egg now (the gold circle).';
    const sk = W.rings.filter((g) => g.fx === 'soak' && g._ord === myGroup() && g.at > t && g.at - t <= 9).sort((a, b) => a.at - b.at)[0];
    if (sk) return 'Your coil soak (group ' + (myGroup() + 1) + ') slams in ' + Math.ceil(sk.at - t) + ' s: stand in that circle when it lands. Not the other one: Soul Constrictor.';
    const fb = W.rings.find((g) => g.cn === 'Fester Burst' && g.fx === 'burst' && g.at > t && g.at - t <= 9); if (fb) return 'Fester Burst in ' + Math.ceil(fb.at - t) + ' s: get within 10 yards of the Wretch (into its bubble).';
    const nx = W.P.events.find(([at]) => at > t - 3 && at <= t + 8); return nx ? nx[1] + (nx[0] > t ? ' in ' + Math.ceil(nx[0] - t) + ' s' : '') + '.' : 'Stay with the raid and watch for her next move.'; };
  const side = (force) => { const t = G.t, nx = W.P.events.find(([at]) => at > t), jb = job(), key = Math.floor(t) + '|' + G.log.length + '|' + Math.round(G.hp) + '|' + jb;
    if (!force && key === sideKey) return; sideKey = key;
    ov.querySelector('.pg-clk b').textContent = pgClock(t);
    const hp = Math.max(0, G.hp), bar = ov.querySelector('.pg-hpb i'); bar.style.width = hp + '%'; bar.className = hp < 35 ? 'low' : hp < 65 ? 'mid' : '';
    const bf = []; if (carrying()) bf.push('<span class="nx">Noxious Shell</span>'); if (t - G.yolk < 20) bf.push('<span class="ry">Rancid Yolk ' + Math.ceil(20 - (t - G.yolk)) + 's</span>'); if (t - G.soul < 5) bf.push('<span class="sc">Soul Constrictor ' + Math.ceil(5 - (t - G.soul)) + 's</span>'); bf.push(t - G.boost < 30 ? '<span class="cd">Speed boost ' + Math.ceil(30 - (t - G.boost)) + 's</span>' : '<span class="bo">Speed boost ready (Shift)</span>');
    ov.querySelector('.pg-buffs').innerHTML = bf.join('');
    ov.querySelector('.pg-job p').textContent = jb; ov.querySelector('.pg-asg ul').innerHTML = asgHtml(me, t); ov.querySelector('.pg-spd').textContent = speed < 1 ? 'Half speed' : '';
    ov.querySelector('.pg-next b').textContent = nx ? pgClock(nx[0]) + ' · ' + nx[1] : '';
    ov.querySelector('.pg-log em').textContent = G.log.length; ov.querySelector('.pg-log ol').innerHTML = G.log.slice().reverse().map((m) => '<li><time>' + pgClock(m.t) + '</time>' + esc(m.text) + '</li>').join(''); };

  // the cards over the map: pick your role, the countdown, a death, the end
  const pick = () => { stop(); paused = true; card.className = 'pg-card on';
    card.innerHTML = '<div class="pg-cin"><p class="pg-lead">Play ' + esc(part.name.toLowerCase()) + ' of ' + esc(boss) + ' on the real fight clock.</p>' +
      '<p>You are one raider. The other 19 play the plan. Do your job: pick up your egg once its shell breaks, carry it clear of waves and of other carriers, break it in your coil soak, get into the Wretch\'s bubble, get out of the tail\'s sweep, stay out of her reach, and dodge everything she throws.</p>' +
      '<p class="pg-fine">Every mechanic comes at its time from real Mythic kills, overlapping as in the fight. She dives to a random side, so watch for the bubbles.</p>' +
      '<div class="pg-roles">' + part.roles.map((r) => '<button type="button" class="pg-role' + (r === role ? ' on' : '') + '" data-id="' + r.id + '"><b>' + esc(r.name) + '</b><small>' + esc(r.note) + '</small></button>').join('') + '</div>' +
      '<div class="pg-asg pg-asg0"><span class="pg-lab">Your assignments</span><ul></ul></div>' +
      '<div class="pg-optrow"><span>Speed</span><div class="pg-seg pg-spdsel"><button type="button" data-v="1"' + (speed === 1 ? ' class="on"' : '') + '>Normal</button><button type="button" data-v="0.5"' + (speed < 1 ? ' class="on"' : '') + '>Half speed</button></div></div>' +
      '<div class="pg-optrow"><span>Start at</span><select class="pg-at">' + PG_START.map(([t0, n]) => '<option value="' + t0 + '"' + (t0 === startAt ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></div>' +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go">Start</button></div></div>';
    const a0 = () => { card.querySelector('.pg-asg0 ul').innerHTML = asgHtml(role.id, -1); }; a0();
    card.querySelectorAll('.pg-role').forEach((b) => (b.onclick = () => { role = part.roles.find((r) => r.id === b.dataset.id) || role; card.querySelectorAll('.pg-role').forEach((q) => q.classList.toggle('on', q === b)); a0(); }));
    card.querySelectorAll('.pg-spdsel button').forEach((b) => (b.onclick = () => { speed = +b.dataset.v; card.querySelectorAll('.pg-spdsel button').forEach((q) => q.classList.toggle('on', q === b)); }));
    card.querySelector('.pg-at').onchange = (e) => { startAt = +e.target.value || 0; };
    card.querySelector('.pg-go').onclick = begin; };
  // (start at a moment: the game plays up to it as a raider who follows the plan, then hands over with full health and a clean list)
  const ffTo = (T0) => { if (!(T0 > 0)) return; window.__pgAuto = true; try { while (G.t < T0) tick(0.02); } finally { window.__pgAuto = false; }
    G.eggs.forEach((e) => { if (e.id === me && e.state === 'gone' && e.shell < T0 && T0 < e.brk) { e.state = 'held'; e.who = me; } });
    G.log = []; G.hp = 100; G.deaths = 0; G.fx = []; G.adds = []; G.soul = -99; G.kb = null; G.boost = -99; target = null; cam = null; draw(world(G.t, 0)); fit(true); side(true); toast.className = 'pg-toast'; };
  const fresh = () => { east = Math.random() < 0.5; try { const W2 = pgBuild(boss, d, east); if (W2) W = W2; } catch (e) { /* (keep the last build) */ } };
  const start0 = () => { me = role.id; reset(); const w = world(0, 0), p0 = w.plan[me]; if (p0) { G.x = p0.x; G.y = p0.y; } draw(world(0, 0)); fit(true); side(true); };
  const begin = () => { fresh(); start0(); ffTo(startAt); let n = 3; card.className = 'pg-card on pg-cd'; card.innerHTML = '<div class="pg-n">' + n + '</div>';
    const tick = () => { if (!ov.isConnected) return; n--; if (n > 0) { card.innerHTML = '<div class="pg-n">' + n + '</div>'; setTimeout(tick, 800); } else { card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); } }; setTimeout(tick, 800); };
  const died = () => { stop(); paused = true; G.deaths++; const why = (G.log[G.log.length - 1] || {}).text || ''; const e = G.eggs.find((q) => q.who === me && q.state === 'held'); if (e) { e.state = 'gone'; e.who = null; G.log.push({ t: G.t, text: 'You died holding your egg: a Viper hatched.' }); }
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin"><p class="pg-lead">You died at ' + pgClock(G.t) + '.</p><p>' + esc(why) + '</p><div class="pg-row"><button type="button" class="pg-btn pg-go">Keep going</button><button type="button" class="pg-btn pg-again">Start over</button></div></div>';
    card.querySelector('.pg-go').onclick = () => { G.hp = 100; card.className = 'pg-card'; card.innerHTML = ''; paused = false; side(true); go(); };
    card.querySelector('.pg-again').onclick = pick; };
  const end = () => { stop(); paused = true; G.over = true; const n = G.log.length, by = {}; G.log.forEach((m) => { const k = m.text.replace(/\.$/, ''); by[k] = (by[k] || 0) + 1; });
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin"><p class="pg-lead">' + (n ? esc(part.name) + ' done: ' + n + ' mistake' + (n > 1 ? 's' : '') + (G.deaths ? ', ' + G.deaths + ' death' + (G.deaths > 1 ? 's' : '') : '') + '.' : 'A clean ' + esc(part.name.toLowerCase()) + ': no mistakes.') + '</p>' +
      (n ? '<ul class="pg-sum">' + Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, c]) => '<li><b>' + c + '×</b> ' + esc(k) + '</li>').join('') + '</ul>' : '<p>Every wave dodged, every soak taken, your eggs carried clean. Try another role.</p>') +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go pg-copy">Copy my score</button><button type="button" class="pg-btn pg-again">Play again</button><button type="button" class="pg-btn pg-close2">Close</button></div></div>';
    card.querySelector('.pg-again').onclick = pick; card.querySelector('.pg-close2').onclick = close;
    const txt = 'Debrief practice · ' + boss + ' ' + dn + ', ' + part.name + ' · ' + role.name + ': ' + (n ? n + ' mistake' + (n > 1 ? 's' : '') : 'no mistakes') + ', ' + G.deaths + ' death' + (G.deaths === 1 ? '' : 's') + (speed < 1 ? ' (half speed)' : '') + (startAt ? ' (from ' + pgClock(startAt) + ')' : '') + ' · https://debriefme.io/guide/' + guideSlug(boss) + '/' + (d === 'h' ? 'heroic' : 'mythic') + '?practice';
    card.querySelector('.pg-copy').onclick = async (e) => { const b = e.currentTarget; let ok = false; try { await navigator.clipboard.writeText(txt); ok = true; } catch (er) { /* (no clipboard) */ } b.textContent = ok ? 'Copied: post it in Discord' : txt; }; };

  // the loop: move, check, draw (about 30 pictures a second; moving and checking every screen refresh)
  const step = (now) => { raf = null; if (!ov.isConnected || paused) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; const w = tick(dt * speed), t = G.t;
    if (now - lastDraw >= 33) { draw(w); lastDraw = now; side(); }
    if (G.hp <= 0) { draw(w); side(true); died(); return; }
    if (t >= END) { draw(w); side(true); end(); return; }
    raf = requestAnimationFrame(step); };
  const tick = (dt) => { const t0 = G.t, t = Math.min(END, G.t + dt), px0 = G.x, py0 = G.y;
    if (G.kb) { const k = Math.min(1, (t - G.kb.t0) / 0.6), nx = G.kb.x0 + (G.kb.x1 - G.kb.x0) * k, ny = G.kb.y0 + (G.kb.y1 - G.kb.y0) * k; if (walk(nx, ny)) { G.x = nx; G.y = ny; } if (k >= 1) G.kb = null; }
    else { if (window.__pgAuto && G.plan) { const e = G.eggs.find((q) => q.id === me && q.state === 'floor' && G.t >= q.shell), p = G.plan[me]; target = e ? [e.x, e.y] : p ? [p.x, p.y] : target; } /* (testing: a raider who follows the plan) */
      let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), my = (keys.u ? 1 : 0) - (keys.d ? 1 : 0);
      if (!mx && !my && target) { const ddx = target[0] - G.x, ddy = target[1] - G.y, dd = Math.hypot(ddx, ddy); if (dd < 0.25) target = null; else { mx = ddx / dd; my = ddy / dd; if (dd < PG_SPEED * dt) { mx *= dd / (PG_SPEED * dt); my *= dd / (PG_SPEED * dt); } } }
      const mm = Math.hypot(mx, my); if (mm > 1) { mx /= mm; my /= mm; } const sp = PG_SPEED * (t - G.boost < 3 ? 1.4 : 1), nx = G.x + mx * sp * dt, ny = G.y + my * sp * dt;
      if (walk(nx, ny)) { G.x = nx; G.y = ny; } else if (walk(nx, G.y)) G.x = nx; else if (walk(G.x, ny)) G.y = ny; else target = null; }
    G.still = !G.kb && Math.hypot(G.x - px0, G.y - py0) < 1e-3; G.t = t; const w = world(t, dt); check(t0, t, w.pts); return w; };
  // (testing: play the whole part at once, as a raider who follows the plan or stands still, and list the mistakes)
  const simRun = (id, eastSide, auto) => { stop(); paused = true; role = part.roles.find((r) => r.id === id) || role; east = !!eastSide; try { const W2 = pgBuild(boss, d, east); if (W2) W = W2; } catch (e) { /* keep */ } start0(); window.__pgAuto = !!auto; const deaths = [];
    while (G.t < END) { tick(0.02); if (G.hp <= 0) { deaths.push(pgClock(G.t)); G.hp = 100; } } window.__pgAuto = false; draw(world(G.t, 0)); side(true); return { deaths, log: G.log.map((m) => pgClock(m.t) + ' ' + m.text) }; };
  const go = () => { last = 0; ov.querySelector('.pg-pause').textContent = 'Pause'; if (!raf) raf = requestAnimationFrame(step); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
  const pauseT = () => { if (!G || G.over || card.classList.contains('on')) return; paused = !paused; ov.querySelector('.pg-pause').textContent = paused ? 'Play' : 'Pause'; if (paused) stop(); else go(); };
  ov.querySelector('.pg-pause').onclick = pauseT;
  ov.querySelector('.pg-ghost').onchange = () => { if (G) draw(world(G.t, 0)); };

  // the controls: W A S D or the arrows; a click on the map runs you there
  const K = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  const kd = (e) => { if (e.key === 'Escape') { close(); return; } if (e.code === 'Space' || e.code === 'KeyP') { e.preventDefault(); pauseT(); return; }
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && G && !paused) { if (G.t - G.boost >= 30) { G.boost = G.t; say('Speed boost: 40% faster for 3 s.'); side(true); } return; }
    const k = K[e.code]; if (k) { e.preventDefault(); keys[k] = true; target = null; } };
  const ku = (e) => { const k = K[e.code]; if (k) keys[k] = false; };
  document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
  const toWorld = (cx, cy) => { const m = svg.getScreenCTM(); if (!m) return null; const p = svg.createSVGPoint(); p.x = cx; p.y = cy; const q = p.matrixTransform(m.inverse()); return [q.x / yd + ox, -(q.y / yd + oy)]; };
  svg.addEventListener('pointerdown', (e) => { if (paused || !G) return; const w = toWorld(e.clientX, e.clientY); if (w) target = w; e.preventDefault(); e.stopPropagation(); }, true);
  const close = () => { if (!ov.isConnected) return; stop(); ov.remove(); document.documentElement.classList.remove('pg-open'); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  ov.querySelector('.pg-x').onclick = close;
  window.addEventListener('blur', () => { keys = {}; });
  start0(); pick();
  window.__pgDbg = { get G() { return G; }, get W() { return W; }, set keys(v) { keys = v; }, get me() { return me; }, set pos(p) { G.x = p[0]; G.y = p[1]; }, sim: simRun, trace: (id) => { stop(); paused = true; role = part.roles.find((r) => r.id === id) || role; start0(); window.__pgAuto = true; const out = []; let nx = 0; try { while (G.t < END) { const w = tick(0.05); if (G.t >= nx) { nx += 1; out.push({ t: Math.round(G.t), npc: w.pts.filter((q) => q.kind !== 'player').map((q) => q.name + '@' + Math.round(q.x - A.cx) + ',' + Math.round(q.y - A.cy)), segs: segsAt(G.t).map((q) => (q.s.m || q.s.beat) + (q.s.o && q.s.o.set ? q.s.o.set : '')), calls: W.callouts.filter((c) => c.text && G.t >= c.t0 && G.t <= c.t1).map((c) => c.text), casts: Object.entries(W.cbars).flatMap(([g, l]) => l.filter((b) => G.t >= b.t0 && G.t <= b.t1).map((b) => b.spell)) }); } } } finally { window.__pgAuto = false; } return out; } }; /* (for testing: the game's state) */
}

function pgCss() {
  if (document.getElementById('pg-css')) return; const st = document.createElement('style'); st.id = 'pg-css';
  st.textContent = `
html.pg-open, html.pg-open body { overflow: hidden; }
.pg { position: fixed; inset: 0; z-index: 72; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(5,6,9,.85); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
.pg-in { width: min(1320px, 100%); height: 100%; max-height: 980px; display: flex; flex-direction: column; background: var(--bg, #0f1117); border: 1px solid var(--line2, var(--line)); border-radius: 4px; box-shadow: 0 20px 60px rgba(0,0,0,.6); }
.pg-h { display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
.pg-h > div { display: flex; flex-direction: column; gap: 1px; }
.pg-k { font: 700 11.5px var(--head); letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
.pg-h b { font: 700 22px/1.1 var(--head); color: var(--text); }
.pg-keys { margin-left: auto; font-size: 13px; color: var(--muted); }
.pg-x { width: 30px; height: 30px; border: 1px solid var(--line2, var(--line)); border-radius: 4px; background: none; color: var(--muted); font-size: 15px; cursor: pointer; }
.pg-x:hover { color: var(--text); border-color: var(--gold); }
.pg-b { flex: 1; min-height: 0; display: flex; gap: 16px; padding: 14px 16px 16px; }
.pg-mapw { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.pg-map { height: 100%; aspect-ratio: 1; max-width: 100%; }
.pg-map > .sub { display: none; }
.pg-map .zwrap { max-width: none !important; height: 100%; }
.pg-map .zbox { height: 100%; }
.pg-map svg.zmap { max-width: none !important; width: 100% !important; height: 100%; cursor: crosshair; }
.pg-map .zanim, .pg-map .zctl, .pg-map .zbar { display: none !important; }
.pg-mapw.hit::after { content: ''; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 0 3px rgba(255,90,70,.9), inset 0 0 60px rgba(255,60,40,.45); animation: pgHit .5s ease-out forwards; }
@keyframes pgHit { to { opacity: 0; } }
.pg-toast { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); max-width: 90%; padding: 7px 14px; border-radius: 4px; background: rgba(20,8,8,.92); border: 1px solid rgba(255,143,135,.6); color: #ff8f87; font: 700 15px var(--head); pointer-events: none; opacity: 0; text-align: center; }
.pg-toast.ok { background: rgba(8,20,10,.92); border-color: rgba(126,224,143,.6); color: #7ee08f; }
.pg-toast.in { animation: pgToast 2.6s ease-out forwards; }
@keyframes pgToast { 0% { opacity: 0; transform: translate(-50%, -4px); } 8% { opacity: 1; transform: translate(-50%, 0); } 78% { opacity: 1; } 100% { opacity: 0; } }
.pg-card { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(5,6,9,.55); }
.pg-card.on { display: flex; }
.pg-cin { width: min(540px, 92%); padding: 20px 22px; background: var(--bg, #0f1117); border: 1px solid var(--line2, var(--line)); border-radius: 4px; box-shadow: 0 12px 40px rgba(0,0,0,.55); }
.pg-cin p { margin: 0 0 10px; color: var(--muted); font-size: 15px; line-height: 1.45; }
.pg-cin .pg-lead { font: 700 18px/1.25 var(--head); color: var(--text); }
.pg-cin .pg-fine { font-size: 13px; }
.pg-roles { display: flex; gap: 8px; margin: 14px 0 4px; }
.pg-role { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid var(--line2, var(--line)); border-radius: 4px; background: none; color: var(--text); cursor: pointer; text-align: left; }
.pg-role b { font: 700 15px var(--head); } .pg-role small { font-size: 12.5px; color: var(--muted); }
.pg-role.on { border-color: var(--gold); background: rgba(243,201,105,.08); }
.pg-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.pg-btn { height: 30px; padding: 0 14px; border: 1px solid var(--line2, var(--line)); border-radius: 4px; background: none; color: var(--text); font: 600 13.5px var(--body); cursor: pointer; }
.pg-btn:hover { border-color: var(--gold); }
.pg-go { background: var(--gold); border-color: var(--gold); color: #1a1405; }
.pg-cd { background: none; pointer-events: none; }
.pg-n { font: 800 96px/1 var(--head); color: var(--text); text-shadow: 0 4px 30px rgba(0,0,0,.8); }
.pg-sum { margin: 0 0 4px; padding: 0 0 0 18px; color: var(--text); font-size: 14.5px; line-height: 1.6; } .pg-sum b { color: #ff8f87; }
.pg-side { width: 300px; flex: none; display: flex; flex-direction: column; gap: 14px; overflow: auto; }
.pg-lab { display: block; font: 700 11.5px var(--head); letter-spacing: .04em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
.pg-clk span, .pg-hp > span { display: block; font: 700 11.5px var(--head); letter-spacing: .04em; text-transform: uppercase; color: var(--muted); }
.pg-clk b { font: 800 34px/1.1 var(--head); color: var(--text); font-variant-numeric: tabular-nums; }
.pg-hpb { height: 12px; margin-top: 5px; background: rgba(255,255,255,.06); border: 1px solid var(--line); }
.pg-hpb i { display: block; height: 100%; background: #7ee08f; transition: width .15s linear; } .pg-hpb i.mid { background: #f3c969; } .pg-hpb i.low { background: #ff8f87; }
.pg-buffs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; min-height: 20px; }
.pg-buffs span { padding: 1px 7px; border: 1px solid var(--line2, var(--line)); font: 600 12px var(--body); color: var(--text); }
.pg-buffs .cd { color: var(--muted); } .pg-buffs .bo { border-color: #7ee08f; color: #7ee08f; }
.pg-buffs .nx { border-color: #3af2a8; color: #3af2a8; } .pg-buffs .ry { border-color: #c8a36a; color: #e0c48c; } .pg-buffs .sc { border-color: #b06bff; color: #c89bff; }
.pg-job p { margin: 0; padding: 10px 12px; border: 1px solid var(--line2, var(--line)); background: rgba(243,201,105,.06); font: 600 15px/1.4 var(--body); color: var(--text); }
.pg-asg ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.pg-asg li { padding: 6px 8px; border-left: 2px solid var(--line2, var(--line)); font-size: 13px; line-height: 1.35; color: var(--muted); }
.pg-asg li b { color: var(--text); font: 700 13.5px var(--head); margin-right: 6px; } .pg-asg li time { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.pg-asg li span { display: block; } .pg-asg li.on { border-left-color: #f3c969; background: rgba(243,201,105,.07); color: var(--text); } .pg-asg li.past { opacity: .5; }
.pg-side .pg-asg li:not(.on) span { display: none; } /* (in the side panel, only the next one says what to do) */
.pg-asg0 { margin-top: 12px; } .pg-asg0 ul { max-height: 210px; overflow: auto; }
.pg-optrow { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 13.5px; color: var(--muted); } .pg-optrow > span { min-width: 64px; }
.pg-seg { display: inline-flex; border: 1px solid var(--line2, var(--line)); } .pg-seg button { height: 28px; padding: 0 12px; border: 0; background: none; color: var(--muted); font: 600 13px var(--body); cursor: pointer; }
.pg-seg button.on { background: rgba(255,255,255,.08); color: var(--text); }
.pg-at { height: 30px; padding: 0 8px; border: 1px solid var(--line2, var(--line)); border-radius: 4px; background: var(--bg, #0f1117); color: var(--text); font: 600 13px var(--body); }
.pg-spd { font-style: normal; color: #f3c969; margin-left: 6px; text-transform: none; letter-spacing: 0; }
.pg-cast { position: absolute; top: 56px; left: 50%; transform: translateX(-50%); width: min(360px, 70%); padding: 5px 10px 7px; background: rgba(10,12,16,.88); border: 1px solid var(--line2, var(--line)); pointer-events: none; }
.pg-cast span { display: block; font: 700 13.5px var(--head); color: var(--text); text-align: center; } .pg-cast i { display: block; height: 4px; margin-top: 4px; background: #f3c969; }
.pg-next b { display: block; font: 700 15px/1.3 var(--head); color: var(--text); }
.pg-log { flex: 1; min-height: 80px; }
.pg-log em { font-style: normal; color: #ff8f87; }
.pg-log ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; line-height: 1.4; color: var(--text); }
.pg-log time { display: inline-block; min-width: 38px; color: var(--muted); font-variant-numeric: tabular-nums; }
.pg-opts { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 13.5px; color: var(--muted); }
.pg-opts label { display: flex; align-items: center; gap: 6px; cursor: pointer; }
@media (max-width: 900px) { .pg-b { flex-direction: column; overflow: auto; } .pg-side { width: auto; } .pg-keys { display: none; } .pg-mapw { flex: none; aspect-ratio: 1; } }
`;
  document.head.appendChild(st);
}
