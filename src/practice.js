// ===== Practice: play a part of the fight (Nov 11, Flex: "make an interactive 2d game for people to play parts of the fight to practice
// using real timings" / "like a browser game" / "try with just phase 1" / "if its good we can add on") =====
// A pop-up over the guide: you steer one raider of the guide's example raid through the part, on the guide's own whole-fight map (the
// same scenes, in the order of a real kill, each at its real speed: casts, landings and wave speeds as in the game; mechanics that
// overlap in the fight play one after the other, as in the whole-fight video, and the fight clock slows between them). Everything the map draws that hurts is checked against where you are:
// her waves, the tails' rings, impacts, frontals, the Wretch's bubble, your coil soak, and your egg. The other 19 play the plan.
// Built into ui.js's scope next to guides.js (build.ps1, /*PRACTICE*/), so it uses the guide's own kit, maps and drawing.
const PG_PARTS = { "Ula'tek": { m: { name: 'Phase 1', ph: 0, roles: [
  { id: 'r3', name: 'Ranged', note: 'You carry an egg' }, { id: 'm1', name: 'Melee', note: 'You carry an egg' }, { id: 'h2', name: 'Healer', note: 'No egg' }] } } };
const pgPart = (boss, d) => (PG_PARTS[boss] || {})[d] || null;
// (how much a hit takes off your health in the game: not the real numbers, but two big hits close together kill, as in the fight)
const PG_DMG = { wave: 45, ring: 35, arc: 35, beam: 40, burst: 35, cone: 80, safe: 45, pool: 12, 'Toxic Womb': 60, 'Falling Debris': 50 };
const PG_SPEED = 7, PG_R = 0.7; // (your running speed in yards a second, as in the game; your own size for hits)
const pgClock = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const pgName = (s, fb) => { const t = String(s || '').split(':')[0].trim(); return t || fb; };

// the part's map: the guide's whole fight, only this part's scenes
function pgBuild(boss, d) {
  const part = pgPart(boss, d), G0 = GDZ[boss]; if (!part || !G0) return null;
  const own = (o) => (!o || (o.only && o.only !== d) ? null : Object.assign({}, o, o[d] || {}));
  const G = own(G0); G.phases = G.phases.map(own).filter(Boolean).map((p) => ({ ...p, mechs: (p.mechs || []).map(own).filter(Boolean), tiles: (p.tiles || []).map(own).filter(Boolean) }));
  const G1 = { ...G, sim: (G.sim || []).filter((e) => e.ph === part.ph), simSkip: [] };
  return gdzWhole(boss, G1, d);
}

function pgOpen(root, boss, d) {
  const part = pgPart(boss, d); if (!part) return; const old = document.querySelector('.pg'); if (old) old.remove();
  pgCss(); if (typeof gdzCss === 'function') gdzCss();
  let W; try { W = pgBuild(boss, d); } catch (e) { console.error(e); W = null; }
  if (!W || !W.mp || !W.mp.frames || !W.mp.frames.length) return;
  const mp0 = W.mp, fr = mp0.frames, T0 = fr[0].t, T1 = fr[fr.length - 1].t, pmap = gdzPmap(), dn = d === 'h' ? 'Heroic' : 'Mythic';
  const A = GDZ_ORIGIN[boss] || ARENAS[boss] || { cx: 0, cy: 0 }, FLR = GDZ_FLOOR[boss] || null;
  const ov = document.createElement('div'); ov.className = 'pg'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Practice ' + boss + ' ' + part.name);
  ov.innerHTML = '<div class="pg-in"><div class="pg-h"><div><span class="pg-k">Practice · ' + dn + '</span><b>' + esc(boss) + ': ' + esc(part.name) + '</b></div>' +
    '<span class="pg-keys">Move: W A S D or the arrow keys, or click where to run · Mouse wheel: zoom · Space: pause</span><button type="button" class="pg-x" aria-label="Close">✕</button></div>' +
    '<div class="pg-b"><div class="pg-mapw"><div class="pg-map"></div><div class="pg-toast" aria-live="polite"></div><div class="pg-card"></div></div>' +
    '<aside class="pg-side"><div class="pg-clk"><span>Fight clock</span><b>0:00</b></div>' +
    '<div class="pg-hp"><span>Health</span><div class="pg-hpb"><i></i></div></div>' +
    '<div class="pg-now"><span class="pg-lab">Now</span><b></b><p></p></div><div class="pg-next"><span class="pg-lab">Up next</span><b></b></div>' +
    '<div class="pg-log"><span class="pg-lab">Mistakes <em>0</em></span><ol></ol></div>' +
    '<div class="pg-opts"><label><input type="checkbox" class="pg-ghost" checked> Show my spot</label><button type="button" class="pg-btn pg-pause">Pause</button></div></aside></div></div>';
  (root && root.isConnected ? root : document.body).appendChild(ov); document.documentElement.classList.add('pg-open');
  const box = ov.querySelector('.pg-map'), card = ov.querySelector('.pg-card'), toast = ov.querySelector('.pg-toast'), mapw = ov.querySelector('.pg-mapw');
  box.innerHTML = miniMap(mp0, pmap); try { bindZoom(box); } catch (e) { /* (no zoom: the map still plays) */ } try { hydrateMapIcons(box); } catch (e) { /* (icons load later) */ }
  const svg = box.querySelector('svg.zmap'); if (!svg) { ov.remove(); document.documentElement.classList.remove('pg-open'); return; }
  const [ox, oy] = (svg.getAttribute('data-o') || '0,0').split(',').map(Number), yd = +svg.getAttribute('data-yd') || 1;
  const SX = (x) => (x - ox) * yd, SY = (y) => (-y - oy) * yd; // (yards in the room to the map's own units)
  // (the camera: centred on you and following as you run, about 60 yards across; the mouse wheel zooms between 32 and 140)
  let Z = 30, cam = null, camT = 0; const fit = (snap) => { if (!G || !box._zoomTo) return; const now = performance.now(), k = snap || !cam ? 1 : Math.min(1, (now - camT) / 1000 * 7); camT = now;
    cam = cam && !snap ? [cam[0] + (G.x - cam[0]) * k, cam[1] + (G.y - cam[1]) * k] : [G.x, G.y]; box._zoomTo([SX(cam[0]) - Z * yd, SY(cam[1]) - Z * yd, 2 * Z * yd, 2 * Z * yd]); };
  svg.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); Z = Math.min(70, Math.max(16, Z * (e.deltaY > 0 ? 1.12 : 1 / 1.12))); fit(true); }, { capture: true, passive: false });
  const inner = (html) => { const a = html.indexOf('<svg'), b = html.indexOf('>', a), c = html.indexOf('</svg><div class="zscale">', b); return html.slice(b + 1, c); };

  // ---- the game ----
  let me = null, role = part.roles[0], G = null, raf = null, last = 0, lastDraw = 0, fi = 0, paused = true, keys = {}, target = null;
  const reset = () => { G = { t: T0, hp: 100, x: 0, y: 0, done: new Set(), log: [], deaths: 0, near: {}, pool: 0, over: false, tPrev: T0 }; fi = 0; target = null; keys = {}; };
  const frameAt = (t) => { if (fi > 0 && fr[fi].t > t) fi = 0; while (fi < fr.length - 2 && fr[fi + 1].t <= t) fi++;
    const a = fr[fi], b = fr[Math.min(fi + 1, fr.length - 1)], w = b.t > a.t ? Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : 0;
    if (!w || a === b) return a.pts; const nb = new Map(b.pts.map((p) => [p.guid, p])); return a.pts.map((p) => { const q = nb.get(p.guid); return q ? { ...p, x: p.x + (q.x - p.x) * w, y: p.y + (q.y - p.y) * w } : p; }); };
  const planAt = (pts) => { const p = pts.find((q) => q.guid === me); return p ? [p.x, p.y] : null; };
  const posOf = (pts, guid) => { if (guid === me) return [G.x, G.y]; const p = pts.find((q) => q.guid === guid); return p ? [p.x, p.y] : null; };
  const artAt = (t) => { let a = mp0.art || null; for (const [tt, aa] of mp0.artAt || []) if (tt <= t + 1e-6) a = aa; return a; };
  const walk = (x, y, t) => { if (!FLR) return true; const m = (artAt(t) && FLR.art[artAt(t)]) || FLR.def; if (!m) return true; const row = m[Math.round(y - A.cy)]; if (!row) return false; const lx = x - A.cx; return row.some(([a, b]) => lx >= a - 0.5 && lx <= b + 0.5); };

  // what hurts at this moment, and what you must do (a mistake costs health, or counts as a mistake on its own)
  const cbarName = (at) => { for (const l of Object.values(mp0.cbars || {})) for (const b of l) if (at >= b.t0 - 0.3 && at <= b.t1 + 1.6 && b.spell) return b.spell; return 'a frontal'; };
  const inWave = (w, t, x, y) => { if (t < w.t0 || t > w.t1) return false; const el = t - w.t0;
    if (w.ring) { const R = w.v * el + 2.5, st = 2 * Math.PI / w.n, hz = (w.cw || 7) / 2, ph = w.ph != null ? w.ph : (w.deg || 0) * Math.PI / 180;
      for (let k = 0; k < w.n; k++) { const a = ph + k * st, u = Math.cos(a), v = Math.sin(a), rx = x - (w.x + u * R), ry = y - (w.y + v * R), s1 = rx * u + ry * v, s2 = -rx * v + ry * u; if (Math.abs(s2) <= hz + PG_R && s1 >= -2.4 - PG_R && s1 <= 3.6 + PG_R) return true; }
      return false; }
    const a = w.deg * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), cx = w.x + u * w.v * el, cy = w.y + v * w.v * el, rx = x - cx, ry = y - cy, s1 = rx * u + ry * v, s2 = -rx * v + ry * u, hw = w.w / 2, hd = (w.d || 4) / 2;
    if (Math.abs(s2) > hw + PG_R) return false; if (w.cres && !w.cres.some(([a0, b0]) => s2 >= a0 - PG_R && s2 <= b0 + PG_R)) return false;
    const bw = (w.bow || 0) * Math.max(0, 1 - Math.pow(s2 / hw, 2)); return s1 >= -hd + bw - PG_R && s1 <= hd + bw + (w.cres ? 3 : 0) + PG_R; };
  const inArc = (w, t, x, y) => { if (t < w.t0 || t > w.t1) return false; const r = w.r0 + w.v * (t - w.t0), dd = Math.hypot(x - w.x, y - w.y); if (Math.abs(dd - r) > (w.d || 4) / 2 + PG_R) return false;
    let ang = Math.atan2(y - w.y, x - w.x) * 180 / Math.PI; const inside = (a0, a1) => { for (let k = -2; k <= 2; k++) { const q = ang + 360 * k; if (q >= a0 && q <= a1) return true; } return false; };
    if (!inside(w.a0, w.a1)) return false; return !(w.gaps || []).some(([g0, g1]) => inside(g0, g1)); };
  const inBeam = (b, t, x, y) => { if (t < b.t0 || t > b.t1) return false; const a = (b.a0 + b.v * (t - b.t0)) * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), rx = x - b.x, ry = y - b.y, s1 = rx * u + ry * v, s2 = -rx * v + ry * u; return s1 >= 1.5 && s1 <= b.len + PG_R && Math.abs(s2) <= b.w / 2 + PG_R; };
  const inCone = (c, x, y) => { const dd = Math.hypot(x - c.x, y - c.y); if (dd > c.r + PG_R) return false; let da = Math.atan2(y - c.y, x - c.x) - c.dir; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; return Math.abs(da) <= c.half + (dd > 0.1 ? Math.atan(PG_R / dd) : Math.PI); };
  const carrying = (t, guid) => (mp0.rings || []).some((g) => g.guid === guid && g.cn === 'Noxious Shell' && t >= g.t0 && t <= g.t0 + (g.dur || 0));
  const hit = (key, text, dmg, egg) => { if (G.done.has(key)) return; G.done.add(key); mistake(text, dmg);
    if (egg && carrying(G.t, me)) mistake('A wave touched your egg: a Viper hatched.', 0); };
  const mistake = (text, dmg) => { const rt = W.clock ? W.clock(G.t) : G.t; G.log.push({ t: rt, text }); if (dmg) { G.hp -= dmg; mapw.classList.remove('hit'); void mapw.offsetWidth; mapw.classList.add('hit'); }
    toast.textContent = text + (dmg ? ' −' + dmg : ''); toast.classList.remove('in'); void toast.offsetWidth; toast.classList.add('in'); side(true); };
  const check = (t0, t, pts) => { const x = G.x, y = G.y, plan = planAt(pts) || [x, y];
    (mp0.waves || []).forEach((w, i) => { if (!G.done.has('w' + i) && inWave(w, t, x, y) && !inWave(w, t, plan[0], plan[1])) hit('w' + i, pgName(w.legend, 'Caustic Waves') + ' hit you.', w.ring ? PG_DMG.ring : PG_DMG.wave, true); });
    (mp0.arcs || []).forEach((w, i) => { if (!G.done.has('a' + i) && inArc(w, t, x, y) && !inArc(w, t, plan[0], plan[1])) hit('a' + i, pgName(w.legend, 'A wave') + ' hit you.', PG_DMG.arc, true); });
    (mp0.beams || []).forEach((b, i) => { if (!G.done.has('b' + i) && inBeam(b, t, x, y) && !inBeam(b, t, plan[0], plan[1])) hit('b' + i, pgName(b.legend, 'A beam') + ' hit you.', PG_DMG.beam, false); });
    (mp0.cones || []).forEach((c, i) => { if (c.soak || c.at == null || !(c.at > t0 && c.at <= t)) return; if (inCone(c, x, y) && !inCone(c, plan[0], plan[1])) hit('c' + i, cbarName(c.at) + ': you were in the frontal.', PG_DMG.cone, false); });
    let inPool = false;
    (mp0.rings || []).forEach((g, i) => { const c = g.guid ? posOf(pts, g.guid) : [g.x, g.y]; if (!c || c[0] == null) return; const r = g.r || 0, mine = Math.hypot(x - c[0], y - c[1]) <= r + PG_R * 0.5, plan2 = g.guid === me ? true : Math.hypot(plan[0] - c[0], plan[1] - c[1]) <= r;
      if (g.fx === 'burst' && g.at != null && !g.guid && r < 40 && g.at > t0 && g.at <= t) { if (mine && !plan2) hit('r' + i, (g.cn === 'Call of the Serpent' ? 'An egg landed on you' : (g.cn || 'An impact') + ' hit you') + '.', PG_DMG[g.cn] || PG_DMG.burst, false); return; }
      if (g.fx === 'soak' && g.at != null && g.at > t0 && g.at <= t) { if (plan2 && !mine && g.guid !== me) hit('r' + i, 'You missed your ' + (g.cn || 'soak') + ' soak.', 0, false); return; }
      if (g.fx === 'safe' && r >= 6 && g.cn !== 'Hardened' && g.t0 != null) { const end = g.t0 + (g.dur || 0); if (end > t0 && end <= t && plan2 && !mine) hit('r' + i, (g.cn || 'The blast') + ': you were outside the bubble.', PG_DMG.safe, false); return; }
      if ((g.fx === 'puddle' || g.fx === 'zone') && g.t0 != null && t >= g.t0 && t <= g.t0 + (g.dur || 0) && mine && !plan2 && r < 40) inPool = (g.cn || 'the venom'); });
    if (inPool) { G.hp -= PG_DMG.pool * (t - t0); G.pool += t - t0; if (G.pool > 1.5) { G.pool = -99; mistake('You stood in ' + inPool + '.', 0); } } else if (G.pool > 0) G.pool = 0;
    // (your egg's 3-yard ring must never touch another carrier's)
    if (carrying(t, me)) for (const g of mp0.rings || []) { if (g.cn !== 'Noxious Shell' || g.guid === me || t < g.t0 || t > g.t0 + (g.dur || 0)) continue; const o = posOf(pts, g.guid); if (!o) continue;
      if (Math.hypot(x - o[0], y - o[1]) < 6 && Math.hypot(plan[0] - o[0], plan[1] - o[1]) >= 6 && !(G.near[g.guid] > t - 4)) { G.near[g.guid] = t; mistake('Your egg ring touched ' + (pmap.get(g.guid) ? pmap.get(g.guid).name : 'another carrier') + '\'s: a Viper hatched.', 0); } }
    G.hp = Math.min(100, G.hp + 4 * (t - t0)); };

  // drawing: the guide's own map at this moment, with you where you are, your egg with you, and your spot from the plan
  const draw = (pts) => { const plan = planAt(pts), dx = plan ? G.x - plan[0] : 0, dy = plan ? G.y - plan[1] : 0;
    const p2 = pts.map((p) => p.guid === me ? { ...p, x: G.x, y: G.y } : (p.kind === 'egg' && plan && Math.hypot(p.x - plan[0], p.y - plan[1]) < 1.6 ? { ...p, x: p.x + dx, y: p.y + dy } : p));
    let html; try { html = miniMap({ ...mp0, pts: p2, ft: G.t, _kp: mp0._kp || mp0.pts, hl: [me], tags: (mp0.tags || []).concat([[me, 'You', -1, 1e9, 1]]) }, pmap); } catch (e) { return; }
    let s = inner(html); if (plan && ov.querySelector('.pg-ghost').checked) { const gx = SX(plan[0]), gy = SY(plan[1]), d2 = Math.hypot(dx, dy);
      s += (d2 > 2.5 ? '<line x1="' + SX(G.x).toFixed(1) + '" y1="' + SY(G.y).toFixed(1) + '" x2="' + gx.toFixed(1) + '" y2="' + gy.toFixed(1) + '" stroke="#f3c969" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>' : '') +
        '<circle cx="' + gx.toFixed(1) + '" cy="' + gy.toFixed(1) + '" r="' + (1.6 * yd).toFixed(1) + '" fill="rgba(243,201,105,.12)" stroke="#f3c969" stroke-width="1.6" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>'; }
    svg.innerHTML = s; fit(); };

  // the side panel: the clock, your health, what's happening and what's next, your mistakes
  let sideKey = '';
  const side = (force) => { const rt = W.clock ? W.clock(G.t) : G.t, ci = Math.max(0, W.chaps.findIndex((c, i) => G.t >= c.t && (!W.chaps[i + 1] || G.t < W.chaps[i + 1].t))), ch = W.chaps[ci], nx = W.chaps.slice(ci + 1).find((c) => c.t > G.t);
    const cap = W.caps.filter((c) => c.c === ci && c.t <= G.t + 0.01).pop(), key = ci + '|' + (cap ? cap.j : -1) + '|' + G.log.length + '|' + Math.floor(rt) + '|' + Math.round(G.hp);
    if (!force && key === sideKey) return; sideKey = key;
    ov.querySelector('.pg-clk b').textContent = pgClock(rt);
    const hp = Math.max(0, G.hp), bar = ov.querySelector('.pg-hpb i'); bar.style.width = hp + '%'; bar.className = hp < 35 ? 'low' : hp < 65 ? 'mid' : '';
    ov.querySelector('.pg-now b').textContent = ch ? ch.name : ''; ov.querySelector('.pg-now p').textContent = cap ? cap.text : '';
    ov.querySelector('.pg-next b').textContent = nx ? nx.name.replace(/\s*\(.*$/, '') + (nx.rt != null ? ' · ' + pgClock(nx.rt) : '') : 'The end of ' + part.name.toLowerCase();
    ov.querySelector('.pg-log em').textContent = G.log.length; ov.querySelector('.pg-log ol').innerHTML = G.log.slice().reverse().map((m) => '<li><time>' + pgClock(m.t) + '</time>' + esc(m.text) + '</li>').join(''); };

  // the cards over the map: pick your role, the countdown, a death, the end
  const pick = () => { stop(); paused = true; card.className = 'pg-card on';
    card.innerHTML = '<div class="pg-cin"><p class="pg-lead">Play ' + esc(part.name.toLowerCase()) + ' of ' + esc(boss) + ' at the real timings.</p>' +
      '<p>You are one raider of the plan. The other 19 play their jobs. Dodge her waves, stay out of the impacts, soak your coils, get in the Wretch\'s bubble, and keep your egg safe.</p>' +
      '<p class="pg-fine">Each mechanic plays at its real speed, in the order of a real kill. Mechanics that overlap in the fight come one after the other here, so the fight clock slows down between them. The gold circle is your spot in the plan.</p>' +
      '<div class="pg-roles">' + part.roles.map((r) => '<button type="button" class="pg-role' + (r === role ? ' on' : '') + '" data-id="' + r.id + '"><b>' + esc(r.name) + '</b><small>' + esc(r.note) + '</small></button>').join('') + '</div>' +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go">Start</button></div></div>';
    card.querySelectorAll('.pg-role').forEach((b) => (b.onclick = () => { role = part.roles.find((r) => r.id === b.dataset.id) || role; card.querySelectorAll('.pg-role').forEach((q) => q.classList.toggle('on', q === b)); }));
    card.querySelector('.pg-go').onclick = begin; };
  const begin = () => { me = role.id; reset(); const p0 = planAt(frameAt(T0)); if (p0) { G.x = p0[0]; G.y = p0[1]; } cam = null; draw(frameAt(T0)); side(true); let n = 3;
    card.className = 'pg-card on pg-cd'; card.innerHTML = '<div class="pg-n">' + n + '</div>';
    const tick = () => { if (!ov.isConnected) return; n--; if (n > 0) { card.innerHTML = '<div class="pg-n">' + n + '</div>'; setTimeout(tick, 800); } else { card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); } }; setTimeout(tick, 800); };
  const died = () => { stop(); paused = true; G.deaths++; const why = (G.log[G.log.length - 1] || {}).text || '';
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin"><p class="pg-lead">You died at ' + pgClock(W.clock ? W.clock(G.t) : G.t) + '.</p><p>' + esc(why) + '</p><div class="pg-row"><button type="button" class="pg-btn pg-go">Keep going</button><button type="button" class="pg-btn pg-again">Start over</button></div></div>';
    card.querySelector('.pg-go').onclick = () => { G.hp = 100; card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); };
    card.querySelector('.pg-again').onclick = pick; };
  const end = () => { stop(); paused = true; G.over = true; const n = G.log.length, by = {}; G.log.forEach((m) => { const k = m.text.replace(/\.$/, ''); by[k] = (by[k] || 0) + 1; });
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin"><p class="pg-lead">' + (n ? esc(part.name) + ' done: ' + n + ' mistake' + (n > 1 ? 's' : '') + (G.deaths ? ', ' + G.deaths + ' death' + (G.deaths > 1 ? 's' : '') : '') + '.' : 'A clean ' + esc(part.name.toLowerCase()) + ': no mistakes.') + '</p>' +
      (n ? '<ul class="pg-sum">' + Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, c]) => '<li><b>' + c + '×</b> ' + esc(k) + '</li>').join('') + '</ul>' : '<p>Every wave dodged, every soak taken. Try it as another role.</p>') +
      '<div class="pg-row"><button type="button" class="pg-btn pg-again">Play again</button><button type="button" class="pg-btn pg-close2">Close</button></div></div>';
    card.querySelector('.pg-again').onclick = pick; card.querySelector('.pg-close2').onclick = close; };

  // the loop: move, check, draw (about 30 pictures a second; moving and checking every screen refresh)
  const step = (now) => { raf = null; if (!ov.isConnected) return; if (paused) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), my = (keys.u ? 1 : 0) - (keys.d ? 1 : 0);
    if (!mx && !my && target) { const ddx = target[0] - G.x, ddy = target[1] - G.y, dd = Math.hypot(ddx, ddy); if (dd < 0.25) target = null; else { mx = ddx / dd; my = ddy / dd; if (dd < PG_SPEED * dt) { mx *= dd / (PG_SPEED * dt); my *= dd / (PG_SPEED * dt); } } }
    const mm = Math.hypot(mx, my); if (mm > 1) { mx /= mm; my /= mm; }
    const t0 = G.t, t = Math.min(T1, G.t + dt); const nx = G.x + mx * PG_SPEED * dt, ny = G.y + my * PG_SPEED * dt;
    if (walk(nx, ny, t)) { G.x = nx; G.y = ny; } else if (walk(nx, G.y, t)) G.x = nx; else if (walk(G.x, ny, t)) G.y = ny; else target = null;
    G.t = t; const pts = frameAt(t); check(t0, t, pts);
    if (now - lastDraw >= 33) { draw(pts); lastDraw = now; side(); }
    if (G.hp <= 0) { draw(pts); side(true); died(); return; }
    if (t >= T1) { draw(pts); side(true); end(); return; }
    raf = requestAnimationFrame(step); };
  const go = () => { last = 0; ov.querySelector('.pg-pause').textContent = 'Pause'; if (!raf) raf = requestAnimationFrame(step); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
  const pauseT = () => { if (!G || G.over || card.classList.contains('on')) return; paused = !paused; ov.querySelector('.pg-pause').textContent = paused ? 'Play' : 'Pause'; if (paused) stop(); else go(); };
  ov.querySelector('.pg-pause').onclick = pauseT;
  ov.querySelector('.pg-ghost').onchange = () => { if (G) draw(frameAt(G.t)); };

  // the controls: W A S D or the arrows; a click on the map runs you there
  const K = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  const kd = (e) => { if (e.key === 'Escape') { close(); return; } if (e.code === 'Space' || e.code === 'KeyP') { e.preventDefault(); pauseT(); return; }
    const k = K[e.code]; if (k) { e.preventDefault(); keys[k] = true; target = null; } };
  const ku = (e) => { const k = K[e.code]; if (k) keys[k] = false; };
  document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
  const toWorld = (cx, cy) => { const m = svg.getScreenCTM(); if (!m) return null; const p = svg.createSVGPoint(); p.x = cx; p.y = cy; const q = p.matrixTransform(m.inverse()); return [q.x / yd + ox, -(q.y / yd + oy)]; };
  svg.addEventListener('pointerdown', (e) => { if (paused || !G) return; const w = toWorld(e.clientX, e.clientY); if (w) target = w; e.preventDefault(); e.stopPropagation(); }, true);
  const close = () => { if (!ov.isConnected) return; stop(); ov.remove(); document.documentElement.classList.remove('pg-open'); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  ov.querySelector('.pg-x').onclick = close;
  window.addEventListener('blur', () => { keys = {}; });
  me = role.id; reset(); const p0 = planAt(frameAt(T0)); if (p0) { G.x = p0[0]; G.y = p0[1]; } draw(frameAt(T0)); fit(true); side(true); pick();
  window.__pgDbg = { get G() { return G; }, W, mp: mp0, set keys(v) { keys = v; }, get me() { return me; } }; /* (for testing: the game's state) */
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
.pg-toast { position: absolute; top: 14px; left: 50%; transform: translateX(-50%); padding: 7px 14px; border-radius: 4px; background: rgba(20,8,8,.9); border: 1px solid rgba(255,143,135,.6); color: #ff8f87; font: 700 15px var(--head); pointer-events: none; opacity: 0; white-space: nowrap; }
.pg-toast.in { animation: pgToast 2.2s ease-out forwards; }
@keyframes pgToast { 0% { opacity: 0; transform: translate(-50%, -4px); } 8% { opacity: 1; transform: translate(-50%, 0); } 75% { opacity: 1; } 100% { opacity: 0; } }
.pg-card { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(5,6,9,.55); }
.pg-card.on { display: flex; }
.pg-cin { width: min(520px, 92%); padding: 20px 22px; background: var(--bg, #0f1117); border: 1px solid var(--line2, var(--line)); border-radius: 4px; box-shadow: 0 12px 40px rgba(0,0,0,.55); }
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
.pg-now b, .pg-next b { display: block; font: 700 15px/1.3 var(--head); color: var(--text); }
.pg-now p { margin: 4px 0 0; font-size: 14px; line-height: 1.45; color: var(--muted); }
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
