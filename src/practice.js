// ===== Practice: play a part of the fight (rebuilt from scratch, Nov 11; Flex: "im giving you creative freedom on the game to make it really
// good. Even if you have to entirely build it from scratch" / "Need you to put in your best effort this time") =====
// A browser game over the guide: Ula'tek Mythic, phase 1, on the real fight clock. Its own engine (a canvas at screen rate, a camera on you, the
// guide's room picture), the fight scripted second by second from the measured top Mythic kills (notes/Guides/Bosses/8 Ula'tek.md) and the
// guide's plan (spots, soak groups, bubbles), a WoW-style screen (your frame and debuffs, her cast bar, boss-mod timers, raid warnings, an
// action bar), 19 raiders who do their jobs and dodge, and a report at the end. Built into ui.js's scope next to guides.js (build.ps1,
// /*PRACTICE*/): it borrows the guide's room numbers (UX_HOME, UX_ZONE, UL_EDGE, GDZ_ROLE) but draws and plays on its own.
const PG_PARTS = { "Ula'tek": { m: { name: 'Phase 1', end: 165, roles: [
  { id: 'r3', name: 'Ranged', job: 'Egg carrier (west zone)' }, { id: 'm1', name: 'Melee', job: 'Egg carrier (by her, west)' }, { id: 'h2', name: 'Healer', job: 'No egg' }] } } };
const pgPart = (boss, d) => (PG_PARTS[boss] || {})[d] || null;
const pgClock = (s) => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const pgRot = (p, deg) => { if (!deg) return [p[0], p[1]]; const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
const pgDist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// (a little seeded randomness, so a run can be replayed and tested)
const pgRng = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

// ---- Ula'tek, phase 1, Mythic: the room and the plan (yards from the platform's middle, x east, y north; her at the north edge) ----
const PG_UL = {
  art: 'https://cdn.raidplan.io/raid/wow.venomabyss/map/08.ulatek-ort-full-v185.jpg', artW: 2448 / 7.5, artH: 1371 / 7.5, artY: -0.9,
  boss: [0, 46], tail: [-41, 0], reach: [0, 33], soakA: [-25, 8], soakB: [-25, -8], heart: [0, 41.5],
  // (the stone: an octagon about 69 yards across, from the guide's floor outline)
  onPlat: (x, y) => Math.abs(x) <= 36.5 && Math.abs(y) <= 34 && Math.abs(x) + Math.abs(y) <= 49,
  // (a spot pulled onto the stone, 1.5 yards in from its edge)
  inward: (p) => { let q = [p[0], p[1]]; for (let i = 0; i < 60 && !(Math.abs(q[0]) <= 35 && Math.abs(q[1]) <= 32.5 && Math.abs(q[0]) + Math.abs(q[1]) <= 47); i++) q = [q[0] * 0.98, q[1] * 0.98]; return q; },
  eggO: { r3: [-3, 4], m1: [0, 0], r5: [-3, 2], r1: [2, 3], r2: [-2, 3], r6: [3, -2], m2: [0, 0], r4: [3, 2] },
  // (the coil soak groups: set 1, every carrier takes the first slam inside the Wretch's bubble and group two the second; set 2, the carriers split)
  soak: [[['m1', 'm2', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'h1', 'h3', 'm3'], ['m4', 'm5', 'm6', 'm7', 'h2', 'h4', 'r7']],
    [['r1', 'r3', 'r5', 'm1', 'h1', 'h3', 'm3', 'm4', 'm5'], ['r2', 'r4', 'r6', 'm2', 'h2', 'h4', 'm6', 'm7', 'r7']]],
};

// the fight, second by second (the measured top Mythic kills, the guide's plan); east: she surfaces on the east edge
function pgUlScript(o) {
  const rnd = pgRng(o.seed || 1), ROT = o.east ? -90 : 90, SURF = 85.8, rotAt = (t) => (t < SURF ? 0 : ROT), F = (p, t) => pgRot(p, rotAt(t)), S = { ROT, SURF, rotAt, F, end: 165, east: !!o.east };
  S.casts = []; S.warns = []; S.timers = []; S.waves = []; S.impacts = []; S.soaks = []; S.bubbles = []; S.thrash = []; S.wrath = []; S.tails = []; S.beams = []; S.pulses = [];
  const cast = (who, name, t0, t1) => S.casts.push({ who, name, t0, t1 }), warn = (t, text, c) => S.warns.push({ t, text, c: c || '#ff8f87' }), timer = (t, name) => S.timers.push({ t, name });
  const cres = (w) => { const n = Math.max(1, Math.round(w / 7)), wd = w / n, out = []; for (let i = 0; i < n; i++) out.push([-w / 2 + wd * i + (i ? 0.6 : 0), -w / 2 + wd * (i + 1) - (i < n - 1 ? 0.6 : 0)]); return out; };
  // eggs: Call of the Serpent, 8 eggs into the carriers' zones (they turn with her), 4-yard landings, a shell for 3.6 s
  S.eggSets = [{ cast: 1, land: 10, rot: 0 }, { cast: 71, land: 80, rot: ROT }].map((e, si) => ({ ...e, si, eggs: Object.keys(PG_UL.eggO).map((id, i) => { const z = UX_ZONE[id], q = PG_UL.eggO[id]; const p = PG_UL.inward(pgRot([z[0] + q[0], z[1] + q[1]], e.rot)); return { id, x: p[0], y: p[1], land: e.land + (i % 3) * 0.7, shell: e.land + (i % 3) * 0.7 + 3.6 }; }) }));
  S.eggSets.forEach((e) => { cast('boss', 'Call of the Serpent', e.cast, e.cast + 1.4); warn(e.cast, e.si ? 'Call of the Serpent: eight more eggs!' : 'Call of the Serpent: eggs incoming!', '#e6e0c8'); timer(e.land, 'Eggs land'); });
  // the Wretches: Toxic Womb lands in the middle (7 yards), a spectral image beams it for 5 s (the off tank stands in it), it wakes 20 s later
  const IMG = [UL_EDGE.NW, UL_EDGE.SE];
  S.wretches = [{ id: 'w1', cast: 3, land: 5, awake: 25, dies: 76, img: IMG[0], beam: 7 }, { id: 'w2', cast: 72, land: 74.5, awake: 94.5, dies: 999, img: IMG[1], beam: 76 }];
  S.wretches.forEach((w, wi) => { cast('boss', 'Toxic Womb', w.cast, w.cast + 1.2); warn(w.cast, wi ? 'Toxic Womb: a second Wretch!' : 'Toxic Womb: stay out of the middle!', '#d8f22f'); timer(w.land, 'Toxic Womb lands');
    S.impacts.push({ x: 0, y: 0, r: 7, t0: w.cast + 0.4, at: w.land, name: 'Toxic Womb', dmg: 50, color: '#c8a36a', tip: 'Stay out of its 7 yards: the Womb lands in the middle.' });
    const B = [w.img[0] + (0 - w.img[0]) * 0.34, w.img[1] + (0 - w.img[1]) * 0.34], ba = Math.atan2(-w.img[1], -w.img[0]) * 180 / Math.PI; w.B = B;
    S.beams.push({ from: w.img, to: [0, 0], at: B, t0: w.beam, t1: w.beam + 5, wretch: w.id });
    for (let i = 0; i < 5; i++) [90, -90].forEach((a) => S.waves.push({ kind: 'incub', x: B[0], y: B[1], deg: ba + a, v: 12.5, w: 10, d: 5, cres: cres(10), t0: w.beam + 0.5 + i, t1: w.beam + 10 + i, name: 'Caustic Waves from the off tank', tip: 'The off tank\'s beam sends waves out sideways: stay clear of their lanes.' })); });
  // the bubbles (Fester Burst, 4 s cast, 10 yards round the Wretch): on the first coil circle; in the middle by her; in the middle by her on her new side; between the second coil circles
  [{ w: 'w1', t0: 34.7, at: 38.7, p: [-26, 2] }, { w: 'w1', t0: 70, at: 74, p: [4, 20] }, { w: 'w2', t0: 104, at: 108, p: [4, 20] }, { w: 'w2', t0: 137.6, at: 141.6, p: [-25, 0] }].forEach((b) => {
    const p = F(b.p, b.at); S.bubbles.push({ ...b, p }); cast('wretch', 'Fester Burst', b.t0, b.at); warn(b.t0, 'Fester Burst: into the Wretch\'s bubble!', '#d8f22f'); timer(b.at, 'Fester Burst'); });
  // Mother's Wrath: 5 s cast, her tank knocked back, then five bites in her reach (the red circle in front of her)
  [22, 92].forEach((t) => { cast('boss', 'Mother\'s Wrath', t, t + 5); warn(t, 'Mother\'s Wrath on her tank: stay out of her reach', '#ff8f87'); timer(t + 5, 'Mother\'s Wrath bites'); S.wrath.push({ t0: t, at: t + 5, p: F(PG_UL.reach, t + 1) }); });
  // Spectral Coils: her tail rises by the edge, two 10-yard soaks a few seconds apart; Soul Constrictor 5 s on Mythic; carried eggs break
  [{ set: 0, cast: 36, a: 40.8, b: 43.6 }, { set: 1, cast: 130.3, a: 134.3, b: 137.5 }].forEach((c) => { cast('tail', 'Spectral Coils', c.cast, c.cast + 0.8); warn(c.cast, 'Spectral Coils: into your circle!', '#24f2cb');
    [[c.a, PG_UL.soakA, 0], [c.b, PG_UL.soakB, 1]].forEach(([at, p, k]) => { const q = F(p, at); S.soaks.push({ set: c.set, k, x: q[0], y: q[1], r: 10, t0: k ? c.a - 0.6 : c.cast + 0.8, at, cast: c.cast, group: o.soak && o.soak[k] && o.soak[k].length ? o.soak[k] : PG_UL.soak[c.set][k] }); timer(at, 'Coil slam ' + (k + 1)); }); });
  // Mephitic Thrash: her tail sweeps 35 yards (a big hit and a knockback): everyone near it runs out, its tank too
  [45, 102].forEach((t) => { const p = F(PG_UL.tail, t); cast('tail', 'Mephitic Thrash', t, t + 4); warn(t, 'Mephitic Thrash: out of her tail\'s 35 yards!', '#ff9b4a'); timer(t + 4, 'Mephitic Thrash'); S.thrash.push({ t0: t, at: t + 4, x: p[0], y: p[1], r: 35 }); });
  // Caustic Waves: 6 s cast, she pulls one wing back; that half gets two waves first, the other half 6.5 s later, rolling away from her
  S.wings = [];
  [50, 107].forEach((t) => { const west = rnd() < 0.5, T0 = t + 6, rot = rotAt(T0); S.wings.push({ t, west });
    cast('boss', 'Caustic Waves', t, T0); warn(t, 'Ula\'tek pulls her ' + (west ? 'WEST' : 'EAST') + ' wing back!', '#9be13a'); timer(T0, 'Caustic Waves'); timer(T0 + 6.5, 'Caustic Waves (second half)');
    const first = west ? [-12, -36] : [12, 36], second = west ? [12, 36] : [-12, -36];
    [[first, T0], [second, T0 + 6.5]].forEach(([xs, t0]) => xs.forEach((x) => { const p = pgRot([x, 46], rot); S.waves.push({ kind: 'her', x: p[0], y: p[1], deg: 270 + rot, v: 12.5, w: 24, d: 5, cres: cres(24), warn: 2.2, t0, t1: t0 + 7.6, name: 'Caustic Waves', tip: 'Wait on the half that goes second, then cross behind the first wave.' }); })); });
  // the small tails (Gore Rattle), from the 12 measured top Mythic kills (notes/Guides/Bosses/8 Ula'tek.md, "Tail waves"): each rises at the
  // edge 2.4 s before it fires and on Mythic sends 3 straight waves (game data: "reduced to 3 on Mythic"), 12.5 yards a second, about 9 yards
  // wide: its logged heading and two more at random. Spots in her-north yards (after the dive and in the heart burn, the measured her-west
  // spots turned back); the tail that comes with her waves rises on her west or east edge and goes straight across.
  const withHer = () => (rnd() < 0.5 ? [[-40.8, -0.4], 0] : [[39.9, -0.7], 180]);
  [[56, [withHer()]], [58.6, [[[-39.7, -40.2], 64.6], [[38.5, -39.6], 114]]], [69, [[[-55.8, -0.4], 39.4], [[54.8, -0.7], 139.2]]],
    [113, [withHer()]], [115.6, [[[-0.7, -54.8], 90.5], [[39.2, -39.6], 115.7]]], [126, [[[55.8, 0.1], 141.5], [[-39.6, -38.5], 65.8]]], [131.5, [[[-0.4, 55.8], 233.7], [[38.9, 39.5], 206.2]]],
    [143.7, [[[-0.7, -54.8], 90.5], [[39.2, -39.6], 115.7]]], [156.8, [[[-39.6, -38.5], 65.8], [[55.8, 0.1], 141.5]]]].forEach(([t, ts]) => { timer(t, 'Small tails');
    ts.forEach(([q, hd]) => { const p = F(q, t), h = hd + rotAt(t); S.tails.push({ x: p[0], y: p[1], t0: t - 2.4, at: t });
      [0, -(20 + rnd() * 45), 20 + rnd() * 45].forEach((off) => S.waves.push({ kind: 'tail', x: p[0], y: p[1], deg: h + off, v: 12.5, w: 9, d: 4, cres: cres(9), warn: 2.4, t0: t, t1: t + 8.5, name: 'Caustic Waves from a small tail', tip: 'A small tail rising at the edge sends three waves 2.4 s later: step out of their red lanes.' })); }); });
  // the dive: Submerge, bubbles where she'll come up, she surfaces on the other side; her tank has to be there first
  S.dive = { t0: 77, gone: 78.6, surf: SURF, to: pgRot(PG_UL.boss, ROT) }; cast('boss', 'Submerge', 77, 78.6); warn(77, 'Ula\'tek dives: watch for the bubbles!', '#7fd8ff'); warn(SURF, 'She surfaces on the ' + (o.east ? 'EAST' : 'WEST') + ' edge!', '#7fd8ff'); timer(SURF, 'She surfaces');
  // Rage of the Shackled: 6.5 s cast, then her heart is open for 20 s; raid damage every 4 s; Falling Debris (7 yards) all over
  cast('boss', 'Rage of the Shackled', 139, 145.5); warn(139, 'Rage of the Shackled: burn the heart, watch the floor!', '#ff8a5a'); timer(145.5, 'Heart open');
  for (let t = 145.5; t < 165; t += 4) S.pulses.push(t);
  for (let t = 147; t < 164.5; t += 3.4) for (let j = 0; j < 3; j++) { let q; for (let k = 0; k < 30; k++) { q = [-30 + rnd() * 60, -30 + rnd() * 62]; if (PG_UL.onPlat(q[0], q[1])) break; } S.impacts.push({ x: q[0], y: q[1], r: 7, t0: t - 1.8, at: t + j * 0.25, name: 'Falling Debris', dmg: 55, color: '#c8a36a', tip: 'Brown circles in the heart burn: step out before they land.' }); }
  S.timers.sort((a, b) => a.t - b.t); S.warns.sort((a, b) => a.t - b.t);
  return S;
}

function pgOpen(root, boss, d) {
  const part = pgPart(boss, d); if (!part) return; const old = document.querySelector('.pg'); if (old) old.remove();
  pgCss(); const dn = d === 'h' ? 'Heroic' : 'Mythic';
  const ov = document.createElement('div'); ov.className = 'pg'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Practice ' + boss + ' ' + part.name);
  ov.innerHTML = '<div class="pg-in"><canvas class="pg-cv"></canvas>' +
    '<div class="pg-top"><div class="pg-me"><div class="pg-nm"><b class="pg-mn"></b><span class="pg-mj"></span></div><div class="pg-bar pg-hp"><i></i><span></span></div><div class="pg-debs"></div></div>' +
    '<div class="pg-bossf"><div class="pg-nm"><b>' + esc(boss) + '</b><span class="pg-clk">0:00</span></div><div class="pg-bar pg-bhp"><i></i><span></span></div><div class="pg-bar pg-cast" style="display:none"><i></i><span></span></div></div>' +
    '<div class="pg-timers"></div><button type="button" class="pg-x" aria-label="Close">✕</button></div>' +
    '<div class="pg-warn" aria-live="polite"></div><div class="pg-float"></div>' +
    '<div class="pg-bot"><div class="pg-job"><span>Your job now</span><p></p></div><div class="pg-acts"><div class="pg-act" data-a="sprint"><b>Shift</b><span>Sprint</span><i></i></div><div class="pg-act" data-a="def"><b>Q</b><span>Defensive</span><i></i></div><div class="pg-act pg-mis"><b class="pg-mc">0</b><span>Mistakes</span></div></div></div>' +
    '<canvas class="pg-mini" width="200" height="200"></canvas><div class="pg-card"></div></div>';
  (root && root.isConnected ? root : document.body).appendChild(ov); document.documentElement.classList.add('pg-open');
  const mini = ov.querySelector('.pg-mini'), mx2 = mini.getContext('2d'), cv = ov.querySelector('.pg-cv'), cx = cv.getContext('2d'), card = ov.querySelector('.pg-card'), $ = (s) => ov.querySelector(s);
  // ---- pictures: the room, and each role's icon (loaded from Wowhead at runtime, a plain circle until they arrive) ----
  const IMG = {}; const img = (k, src) => { if (IMG[k]) return IMG[k]; const i = new Image(); i.src = src; IMG[k] = i; return i; };
  img('room', PG_UL.art); Object.entries(GDZ_ROLE).forEach(([k, r]) => img('role' + k, 'https://wow.zamimg.com/images/wow/icons/medium/' + r[2] + '.jpg'));
  const ok = (i) => i && i.complete && i.naturalWidth > 0;

  // ---- the game ----
  let S = null, G = null, me = part.roles[0].id, role = part.roles[0], speed = 1, startAt = 0, raf = null, last = 0, paused = true, keys = {}, target = null, Z = 13, cam = null, dpr = 1;
  const SPEED = 7, PR = 0.7, carrierOf = (id) => !!PG_UL.eggO[id];
  // ---- your team's plan: signed in, with a Mythic plan for this boss (the one the Plan page shows), you play as yourself and the others are
  // your raiders on the plan's jobs: each egg area's two (the first is the centre, the second the edge), the coil soaks, the Fester Burst
  // spots; the rest by role. Without one, the guide's plan. ----
  let teamWhy = '', pickedMe = false; /* (why there's no team plan in the game: for the audit) */
  const TEAM = (() => { try { if (d !== 'm' || typeof pnGet !== 'function' || typeof pnState !== 'function' || typeof ulRead !== 'function') { teamWhy = 'no plan code (d=' + d + ')'; return null; }
      const o = pnGet(), st = pnState(o, boss), lc = (x) => String(x).split('-')[0].toLowerCase(), on = new Set(((o.on || {})[boss] || []).map(lc));
      const L = notesOf(boss).list.filter((q) => !q.example && !q.pgEmpty && pnNoteDiff(q) === 'Mythic'), chId = typeof planChosenGet === 'function' ? planChosenGet(o.rid, boss) : null, sc = (q) => { const t = noteResolve(q.text); return [...on].filter((x) => noteHas(t, x)).length; };
      const n = (st && st.n && pnNoteDiff(st.n) === 'Mythic' ? st.n : null) || L.find((q) => q.id === chId) || L.slice().sort((a, b) => sc(b) - sc(a) || (b.saved || 0) - (a.saved || 0))[0] || null;
      teamWhy = 'state ' + (st && st.k) + ', plans ' + L.length + ', picked ' + (n ? planNm(n) : 'none') + ', on ' + on.size; if (!n) return null;
      const U = ulRead(noteResolve(n.text));
      const P = pnPeople(o).filter((q) => !q.bench && (!on.size || on.has(lc(q.n)))); teamWhy += ', people ' + P.length + ', teams ' + U.teams.map((x) => x.length).join('/'); if (P.length < 10) return null;
      const byN = new Map(P.map((q) => [lc(q.n), q])), mains = P.map((q) => String(q.n).split('-')[0]), AM = new Map(pnPeople(o, { alts: true }).filter((q) => q.alt).map((q) => [lc(q.n), lc(q.alt)])), al = (x) => { const k = lc(x); if (byN.has(k)) return k; if (AM.has(k) && byN.has(AM.get(k))) return AM.get(k); if (typeof altOf !== 'function') return k; const m = altOf(String(x).split('-')[0], mains); return m ? lc(m) : k; }; /* (an alt in the plan counts as their main) */
      const id2 = {}, used = new Set(), put = (x, id) => { const q = byN.get(al(x)); if (q && !used.has(q) && !id2[id]) { id2[id] = q; used.add(q); } };
      [['melee', ['m1', 'm2']], ['left', ['r5', 'r3']], ['right', ['r6', 'r4']], ['far', ['r1', 'r2']]].forEach(([z, ids]) => (U.ez[z] || []).slice(0, 2).forEach((x, i) => put(x, ids[i])));
      const free = (L) => GDZ_RAID.filter((id) => L.includes(id[0]) && !id2[id]), rk = (q) => (q.role === 'tank' ? 0 : q.role === 'healer' ? 1 : 2);
      P.filter((q) => !used.has(q)).sort((a, b) => rk(a) - rk(b)).forEach((q) => { const w = q.role === 'tank' ? 't' : q.role === 'healer' ? 'h' : q.kind === 'melee' ? 'm' : 'r';
        const id = free([w])[0] || free(w === 'm' ? ['r', 'h'] : w === 'r' ? ['m', 'h'] : ['m', 'r'])[0] || free(['t', 'h', 'm', 'r'])[0]; if (id) { id2[id] = q; used.add(q); } });
      const n2 = new Map(Object.entries(id2).map(([id, q]) => [lc(q.n), id])), ids = (L) => [...new Set((L || []).map((x) => n2.get(al(x))).filter(Boolean))];
      const T = { name: planNm(n), id2, soak: [ids(U.teams[0]), ids(U.teams[1])], ce: [ids(U.ce[0]), ids(U.ce[1])], fb: (U.fb || []).map(ids), you: n2.get(lc((typeof tpMe === 'function' && tpMe()) || (typeof tpWho === 'function' && tpWho()) || '')) || null };
      teamWhy += ', ok ' + T.soak.map((x) => x.length).join('/') + ', me ' + ((typeof tpMe === 'function' && tpMe()) || '-') + '/' + ((typeof tpWho === 'function' && tpWho()) || '-') + ' -> ' + (T.you || 'none') + ', not placed: ' + [...new Set([...U.teams[0], ...U.teams[1], ...(U.fb || []).flat()])].filter((x) => !n2.has(al(x))).join(' ') + ', left out: ' + P.filter((q) => !used.has(q)).map((q) => q.n).join(' '); return T.soak[0].length && T.soak[1].length ? T : null; } catch (e) { teamWhy += ' error ' + e; return null; } })();
  const nm = (id) => (TEAM && TEAM.id2[id] ? String(TEAM.id2[id].n).split('-')[0] : gdzName(id));
  const rl = (id) => { const q = TEAM && TEAM.id2[id]; return q ? (q.role === 'tank' ? 't' : q.role === 'healer' ? 'h' : q.kind === 'melee' ? 'm' : 'r') : id[0]; };
  const clsC = (id) => { const q = TEAM && TEAM.id2[id], c = q && E.CLASSES && E.CLASSES[q.cls]; return c ? c[1] : null; };
  const ZN = { m1: ['by her', 'centre'], m2: ['by her', 'edge'], r5: ['left (west)', 'centre'], r3: ['left (west)', 'edge'], r6: ['right (east)', 'centre'], r4: ['right (east)', 'edge'], r1: ['far (south)', 'centre'], r2: ['far (south)', 'edge'] };
  const teamRole = (id) => { const sk = TEAM.soak[0].includes(id) ? 1 : TEAM.soak[1].includes(id) ? 2 : 0; return { id, name: nm(id), job: (carrierOf(id) ? 'Egg carrier, ' + ZN[id][0] : rl(id) === 'h' ? 'Healer' : rl(id) === 't' ? 'Tank' : 'No egg') + (sk ? ' · soak #' + sk : '') }; };
  const newG = () => { G = { t: 0, hp: 100, x: 0, y: 0, debs: {}, log: [], deaths: 0, done: new Set(), eggs: [], adds: [], bots: {}, wr: {}, kb: null, sprint: -99, def: -99, fx: [], warnI: 0, bossHp: 100, still: true, vipers: 0 };
    S.eggSets.forEach((e) => e.eggs.forEach((q) => G.eggs.push({ ...q, set: e.si, state: 'air', who: null })));
    GDZ_RAID.forEach((id) => { const p = homeOf(id, 0); G.bots[id] = { id, x: p[0], y: p[1], esc: null }; });
    const p0 = homeOf(me, 0); G.x = p0[0]; G.y = p0[1]; target = null; keys = {}; cam = null; };
  const reset = (o) => { o = o || {}; S = pgUlScript({ east: o.east != null ? o.east : Math.random() < 0.5, seed: o.seed || ((Date.now() & 0xffff) || 7), soak: TEAM && TEAM.soak }); newG(); };
  // where each raider stands when nothing is happening: her tank in front of her, melee round her, carriers in their zones, the rest inside; turned with her
  const homeOf = (id, t) => { const rot = S.rotAt(t), egg = G && G.eggs.some((e) => (e.who === id && e.state === 'held') || (e.id === id && e.state !== 'gone' && e.state !== 'held' && e.land - t < 14));
    return PG_UL.inward(pgRot(carrierOf(id) && egg ? UX_ZONE[id] : UX_HOME[id], rot)); };
  const bossAt = (t) => { const D = S.dive; if (t < D.gone) return { p: PG_UL.boss.slice(), up: true }; return { p: D.to, up: t >= D.surf }; };
  const tailAt = (t) => { const D = S.dive; if (t >= D.gone && t < D.surf) return { p: S.F(PG_UL.tail, D.surf), up: false }; return { p: S.F(PG_UL.tail, t), up: true }; };

  // ---- the Wretches: asleep where they land until they wake, then held by the off tank, brought to each bubble's spot in time ----
  const wretchAt = (w, t) => { if (t < w.land || t >= w.dies) return null; if (t < w.awake) return [0, 0]; const b = G.bots.t2, nb = S.bubbles.find((q) => q.w === w.id && q.at >= t - 0.5);
    if (nb && t >= nb.at - 9) return nb.p.slice(); return b ? [b.x + 2.2, b.y - 1.2] : [0, 0]; };

  // ---- what hurts (the same shapes as drawn) ----
  const inWave = (w, t, x, y, m) => { if (t < w.t0 || t > w.t1) return false; const el = t - w.t0, R0 = PR + (m || 0);
    if (w.ring) { const Rr = w.v * el + 2.5, st = 2 * Math.PI / w.n, hz = w.cw / 2, dd = Math.hypot(x - w.x, y - w.y); if (Math.abs(dd - Rr - 0.6) > 3.6 + R0) return false;
      for (let k = 0; k < w.n; k++) { const a = w.ph + k * st, u = Math.cos(a), v = Math.sin(a), rx = x - (w.x + u * Rr), ry = y - (w.y + v * Rr), s1 = rx * u + ry * v, s2 = -rx * v + ry * u; if (Math.abs(s2) <= hz + R0 && s1 >= -2.4 - R0 && s1 <= 3.6 + R0) return true; }
      return false; }
    const a = w.deg * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), cx0 = w.x + u * w.v * el, cy0 = w.y + v * w.v * el, rx = x - cx0, ry = y - cy0, s1 = rx * u + ry * v, s2 = -rx * v + ry * u, hw = w.w / 2, hd = w.d / 2;
    if (Math.abs(s2) > hw + R0) return false; if (w.cres && !w.cres.some(([a0, b0]) => s2 >= a0 - R0 && s2 <= b0 + R0)) return false; return s1 >= -hd - R0 && s1 <= hd + 3 + R0; };
  const onPlat = (x, y) => PG_UL.onPlat(x, y), inVenom = (x, y) => !onPlat(x, y);
  const nearEdge = (x, y) => { if (onPlat(x, y)) return [x, y]; for (let r = 0.5; r < 20; r += 0.5) for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, qx = x + Math.cos(a) * r, qy = y + Math.sin(a) * r; if (onPlat(qx, qy)) return [qx, qy]; } return [0, 0]; };

  // ---- you: damage, debuffs, mistakes ----
  const DEB = { venom: ['Caustic Venom', '#9be13a'], shell: ['Noxious Shell', '#3af2a8'], yolk: ['Rancid Yolk', '#e0c48c'], soul: ['Soul Constrictor', '#c89bff'], fester: ['Fester Burst', '#d8f22f'], putrid: ['Putrid Membrane', '#7fbf3a'], splash: ['Noxious Splash', '#ff6b5c'], def: ['Defensive', '#7fb8ff'], sprint: ['Sprint', '#7ee08f'] };
  const deb = (k, dur, stack) => { const o = G.debs[k] && G.debs[k].until > G.t ? G.debs[k] : { n: 0 }; G.debs[k] = { until: G.t + dur, n: stack ? Math.min(9, o.n + 1) : 1 }; };
  const has = (k) => G.debs[k] && G.debs[k].until > G.t;
  let flashT = 0; const flash = () => { flashT = performance.now(); };
  const hurt = (n) => { if (!n) return; const m = has('def') ? 0.5 : 1; G.hp -= n * m; G.fx.push({ x: G.x, y: G.y, text: '−' + Math.round(n * m), t0: G.t, c: '#ff8f87' }); flash(); };
  const MAJ = new Set(['wave', 'ring', 'impact', 'fester', 'thrash', 'bite', 'viper', 'soak', 'soul', 'yolk']);
  const say = (text, bad) => { const f = $('.pg-float'); f.textContent = text; f.className = 'pg-float ' + (bad ? 'bad' : 'ok'); void f.offsetWidth; f.classList.add('in'); };
  const mistake = (kind, text, tip, dmg) => { G.log.push({ t: G.t, kind, text, tip }); hurt(dmg || 0); say(text, true); };
  const myEggHeld = () => G.eggs.find((e) => e.who === me && e.state === 'held');
  const hatch = (e, why, tip) => { e.state = 'gone'; e.who = null; G.vipers++; deb('putrid', 30, true); G.adds.push({ kind: 'viper', x: G.x + 1.5, y: G.y - 1, t1: G.t + 8 }); mistake('viper', why + ': a Viper hatched (Putrid Membrane on the whole raid).', tip, 8); };

  // ---- the others: where their job puts them right now, then out of the way of anything coming ----
  // (egg carriers stand on their own spots in a bubble or a soak: a ring 6.5 yards out, about 5 yards apart, in the same order every time, so
  // nobody is inside another carrier's 3-yard circle and they walk from the bubble to the soak side by side; the others stand in the middle)
  const CAR8 = Object.keys(PG_UL.eggO);
  const eggsHeldAt = (at) => { const L = Math.max(-1, ...S.eggSets.filter((e) => e.land < at).map((e) => e.land)); return L >= 0 && !S.soaks.some((q) => q.at > L && q.at < at); };
  const spotIn = (ob, id) => { if (!ob || !ob.car || !ob.car.includes(id)) return null;
    if (ob.fb >= 0 && typeof UL_FB !== 'undefined' && UL_FB[ob.fb] && ob.car.indexOf(id) < UL_FB[ob.fb].length) { const q = pgRot(UL_FB[ob.fb][ob.car.indexOf(id)], ob.fb ? S.rotAt(ob.at) - 90 : 0); return [ob.p[0] + q[0] * 10, ob.p[1] + q[1] * 10]; } const RC = S._ring = S._ring || new Map(), key = ob.at + ',' + ob.p.join(','); let M = RC.get(key);
    if (!M) { const n = Math.max(5, ob.car.length), D = 2 * Math.PI / n, th = ob.car.map((c) => { const z = S.F(UX_ZONE[c] || UX_HOME[c] || [0, 0], ob.at); return [c, Math.atan2(z[1] - ob.p[1], z[0] - ob.p[0])]; }).sort((a, b) => a[1] - b[1]);
      let sx = 0, sy = 0; th.forEach(([, a], i) => { sx += Math.cos(a - i * D); sy += Math.sin(a - i * D); }); const c0 = Math.atan2(sy, sx); M = new Map(th.map(([c], i) => [c, c0 + i * D])); RC.set(key, M); }
    const a = M.get(id); return [ob.p[0] + Math.cos(a) * 6.5, ob.p[1] + Math.sin(a) * 6.5]; };
  const jobOf = (id, t) => { let T = homeOf(id, t), fast = false; const b0 = id === me ? { x: G.x, y: G.y } : G.bots[id], myEgg = G.eggs.find((e) => e.id === id && (e.state === 'floor' || e.state === 'air') && e.land - t < 14);
    // carriers: next to their egg once it's down, onto it when the shell breaks
    if (myEgg && t >= myEgg.land - 1.5) { T = t >= myEgg.shell - 0.4 ? [myEgg.x, myEgg.y] : [myEgg.x - 4.6, myEgg.y + 1]; }
    // her tank: in front of her (first to the bubbles in the dive)
    if (id === 't1') T = t >= S.dive.t0 && t < S.dive.surf + 2 ? pgRot([0, 39], S.ROT) : S.F([0, 34], t);
    // the off tank: into the beam, then the Wretch to its next bubble spot, on the tail otherwise
    if (id === 't2') { const bm = S.beams.find((b) => t >= b.t0 - 3 && t <= b.t1), nb = S.bubbles.find((q) => q.at >= t && q.at - t <= 11);
      T = bm ? bm.at.slice() : nb ? [nb.p[0] - 2, nb.p[1] + 1] : S.F([-31, 3], t); if (bm || nb) fast = true; }
    // the next bubble, or your own coil slam, whichever comes first
    // (they leave in time: once it's cast, and sooner the farther they are, at about 8 yards a second plus a margin)
    const due = (at, p, from) => at >= t && t >= from && at - t <= Math.max(4.6, pgDist([b0.x, b0.y], p) / 8 + 1.6);
    let ob = null; for (const q of S.bubbles) if (id !== 't1' && id !== 't2' && due(q.at, q.p, q.t0 - 2) && (!ob || q.at < ob.at)) { const w = S.wretches.find((z) => z.id === q.w); if (w && t < w.dies) { const ek = S.bubbles.filter((z) => eggsHeldAt(z.at)).indexOf(q), fb = TEAM && ek >= 0 && TEAM.fb[ek] && TEAM.fb[ek].length ? TEAM.fb[ek] : null; ob = { at: q.at, p: q.p, r: 5.5, car: eggsHeldAt(q.at) ? (fb ? fb.concat(CAR8.filter((c) => !fb.includes(c))) : CAR8) : null, fb: fb ? ek : -1 }; } }
    for (const s of S.soaks) if (s.group.includes(id) && due(s.at, [s.x, s.y], s.cast - 0.5) && (!ob || s.at < ob.at)) ob = { at: s.at, p: [s.x, s.y], r: 5, car: CAR8.filter((c) => s.group.includes(c)) };
    if (ob) { const sp = spotIn(ob, id); if (sp) T = sp; else { const ix = GDZ_RAID.indexOf(id), a = ix * 2.39996, rr = (ob.car ? 3.2 : ob.r) * Math.sqrt(((ix % 11) + 0.5) / 11); T = [ob.p[0] + Math.cos(a) * rr, ob.p[1] + Math.sin(a) * rr]; } fast = pgDist(T, [b0.x, b0.y]) > 10; }
    // her waves: on the half that goes second, then behind the first wave into the half it just left
    const wg = S.wings.find((w) => t >= w.t + 1 && t <= w.t + 16); if (wg && id !== 't1') { const rot = S.rotAt(wg.t + 6), q = pgRot(T, -rot), side = wg.west ? 1 : -1, fw = S.waves.find((w) => w.kind === 'her' && Math.abs(w.t0 - (wg.t + 6)) < 0.1);
      const front = fw ? 46 - fw.v * Math.max(0, t - fw.t0) : 46, crossed = t > wg.t + 6 && front < Math.min(q[1], 26) - 5, lx = Math.max(6, Math.min(18, Math.abs(q[0]) + 4)) * (crossed ? -side : side);
      if (t <= wg.t + 6 + 6.5 + 4) { T = pgRot([lx, Math.max(-26, Math.min(24, q[1]))], rot); fast = true; } }
    // the tail's sweep: out of its 35 yards before it lands (its tank too)
    for (const th of S.thrash) if (t >= th.t0 - 0.5 && t <= th.at) { const dd = pgDist(T, [th.x, th.y]); if (dd < 38.5) { const a = Math.atan2(T[1] - th.y, T[0] - th.x); T = [th.x + Math.cos(a) * 40, th.y + Math.sin(a) * 40]; if (!onPlat(T[0], T[1])) T = nearEdge(T[0], T[1]); fast = true; } }
    // her reach in Mother's Wrath: her tank only
    for (const wr of S.wrath) if (t >= wr.t0 && t <= wr.at + 3.2 && id !== 't1' && pgDist(T, wr.p) < 8) { const a = Math.atan2(T[1] - wr.p[1], T[0] - wr.p[0]); T = [wr.p[0] + Math.cos(a) * 9, wr.p[1] + Math.sin(a) * 9]; }
    // coil circles that aren't yours: stay out
    // (a soak of yours coming, its coils not out yet: wait nearer the middle, so you can reach it from anywhere)
    if (!ob) { const ns = S.soaks.find((q) => q.group.includes(id) && q.at > t && q.at - t <= 12 && t < q.cast - 0.5); if (ns && id !== 't1' && id !== 't2') { const d0 = Math.hypot(T[0], T[1]); if (d0 > 12) T = [T[0] * 12 / d0, T[1] * 12 / d0]; } }
    for (const s of S.soaks) if (t >= s.t0 && t <= s.at && !s.group.includes(id) && !(ob && ob.at < s.at - 0.3) && pgDist(T, [s.x, s.y]) < 11.5) { const a = Math.atan2(T[1] - s.y, T[0] - s.x); T = [s.x + Math.cos(a) * 12.5, s.y + Math.sin(a) * 12.5]; }
    if (!onPlat(T[0], T[1])) T = nearEdge(T[0], T[1]);
    return { T, fast, ob }; };
  const dodge = (b, T, t, fast, ob) => { const act = S.waves.filter((w) => w.t1 >= t && w.t0 <= t + Math.max(1.5, w.warn || 0) && !(w.kind === 'incub' && b.id === 't2'));
    const imps = S.impacts.filter((m) => m.at >= t && m.at - t <= 2.4).concat(G.eggs.filter((e) => e.state === 'air' && e.land >= t && e.land - t <= 2.4).map((e) => ({ x: e.x, y: e.y, r: 4, at: e.land })));
    if (!act.length && !imps.length) { b.esc = null; return { T, fast }; }
    const bad = (x, y, k) => act.some((w) => inWave(w, t + k, x, y, 1.4)) || imps.some((m) => m.at >= t + k - 0.2 && m.at <= t + k + 0.9 && Math.hypot(x - m.x, y - m.y) <= m.r + 1.4);
    const KS = [0, 0.1, 0.2, 0.35, 0.5, 0.7, 0.9, 1.15, 1.4, 1.8, 2.2, 2.6], path = (x1, y1, sp) => { const dd = Math.hypot(x1 - b.x, y1 - b.y); for (const k of KS) { const f = dd > 0 ? Math.min(1, sp * k / dd) : 0; if (bad(b.x + (x1 - b.x) * f, b.y + (y1 - b.y) * f, k)) return true; } return false; };
    if (!path(T[0], T[1], SPEED * (fast ? 1.4 : 1))) { b.esc = null; return { T, fast }; }
    // (an escape spot: not in a soak that isn't theirs, and with an egg not next to another carrier)
    const held = G.eggs.some((e) => e.who === b.id && e.state === 'held'), others = held ? G.eggs.filter((e) => e.state === 'held' && e.who && e.who !== b.id).map((e) => (e.who === me ? { x: G.x, y: G.y } : G.bots[e.who])) : [];
    const unsafe = (x, y) => S.soaks.some((q) => !q.group.includes(b.id) && q.at >= t && q.at - t <= 3.5 && Math.hypot(x - q.x, y - q.y) <= q.r + 1.2) || others.some((o) => Math.hypot(x - o.x, y - o.y) < 4);
    if (b.esc && t - b.esc.t < 2 && !path(b.esc.x, b.esc.y, SPEED) && !unsafe(b.esc.x, b.esc.y)) return { T: [b.esc.x, b.esc.y], fast: true };
    let best = null, bd = Infinity; const keepIn = ob && ob.at - t <= 3.5; /* (a bubble or their soak due: dodge inside it first) */
    for (let pass = keepIn ? 0 : 1; pass < 2 && !best; pass++) for (const rr of (pass === 0 ? [0, 2.5, 5, 7, 8.6, -1, -2, -3] : [2, 3.5, 5.5, 8, 11, 14])) for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, o = pass === 0 && rr >= 0 ? ob.p : [b.x, b.y], r0 = Math.abs(rr), x = o[0] + Math.cos(a) * r0, y = o[1] + Math.sin(a) * r0; if (!onPlat(x, y) || (pass === 0 && Math.hypot(x - ob.p[0], y - ob.p[1]) > (ob.r === 5 ? 9.2 : 9.2)) || unsafe(x, y) || path(x, y, SPEED)) continue; const dd = Math.hypot(x - T[0], y - T[1]) + Math.hypot(x - b.x, y - b.y) * 0.4; if (dd < bd) { bd = dd; best = [x, y]; } }
    if (best) { b.esc = { x: best[0], y: best[1], t }; return { T: best, fast: true }; } return { T, fast }; };
  const moveBots = (t, dt) => { const pre = {}; if (myEggHeld()) GDZ_RAID.forEach((id) => { if (id !== me) pre[id] = Math.hypot(G.bots[id].x - G.x, G.bots[id].y - G.y); });
    GDZ_RAID.forEach((id) => { if (id === me) return; const b = G.bots[id]; const j = jobOf(id, t); let { T, fast } = j; ({ T, fast } = dodge(b, T, t, fast, j.ob));
      const dx = T[0] - b.x, dy = T[1] - b.y, dd = Math.hypot(dx, dy), sp = SPEED * (fast || dd > 15 ? 1.4 : 1) * dt; if (dd > sp) { b.x += dx / dd * sp; b.y += dy / dd * sp; } else { b.x = T[0]; b.y = T[1]; } });
    // carriers keep out of each other's 3-yard circles; nobody walks into yours (if you walk into theirs, that's yours)
    const car = G.eggs.filter((e) => e.state === 'held' && e.who && e.who !== me).map((e) => G.bots[e.who]); for (let it = 0; it < 2; it++) { for (let i = 0; i < car.length; i++) for (let j = i + 1; j < car.length; j++) { const a = car[i], c = car[j], ex = c.x - a.x, ey = c.y - a.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.6) { const pu = (3.6 - ee) / 2; a.x -= ex / ee * pu; a.y -= ey / ee * pu; c.x += ex / ee * pu; c.y += ey / ee * pu; } }
      if (myEggHeld() && window.__pgAuto) for (const c of car) { const ex = G.x - c.x, ey = G.y - c.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.6) { G.x = c.x + ex / ee * 3.6; G.y = c.y + ey / ee * 3.6; } } /* (the autopilot, a careful player, steps round other carriers) */
      if (myEggHeld()) for (const c of car) { const ex = c.x - G.x, ey = c.y - G.y, ee = Math.hypot(ex, ey) || 0.01; if (ee < 3.6 && (G.still || (pre[c.id] == null ? 9 : pre[c.id]) >= 3.6)) { c.x = G.x + ex / ee * 3.6; c.y = G.y + ey / ee * 3.6; } } }
    // the Wretches follow
    S.wretches.forEach((w) => { const p = wretchAt(w, t); if (!p) { delete G.wr[w.id]; return; } const c = G.wr[w.id]; if (!c) { G.wr[w.id] = { x: p[0], y: p[1] }; return; } const ex = p[0] - c.x, ey = p[1] - c.y, ee = Math.hypot(ex, ey), sp = 9 * dt; if (ee > sp) { c.x += ex / ee * sp; c.y += ey / ee * sp; } else { c.x = p[0]; c.y = p[1]; } }); };

  // ---- one step of the fight ----
  const step1 = (dt) => { const t0 = G.t, t = Math.min(S.end, G.t + dt), px = G.x, py = G.y;
    if (G.kb) { const k = Math.min(1, (t - G.kb.t0) / 0.55); G.x = G.kb.x0 + (G.kb.x1 - G.kb.x0) * k; G.y = G.kb.y0 + (G.kb.y1 - G.kb.y0) * k; if (k >= 1) G.kb = null; }
    else { if (window.__pgAuto) { const j = jobOf(me, t), ab = { id: me, x: G.x, y: G.y, esc: G.autoEsc }, dz = dodge(ab, j.T, t, j.fast, j.ob); G.autoEsc = ab.esc; target = dz.T; }
      let mx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0), my = (keys.u ? 1 : 0) - (keys.d ? 1 : 0); const byKeys = !!(mx || my);
      if (!byKeys && target) { const ex = target[0] - G.x, ey = target[1] - G.y, ee = Math.hypot(ex, ey); if (ee < 0.2) target = null; else { mx = ex / ee; my = ey / ee; } }
      const mm = Math.hypot(mx, my); if (mm > 1) { mx /= mm; my /= mm; } let sp = SPEED * (has('sprint') ? 1.4 : 1) * (inVenom(G.x, G.y) ? 0.6 : 1) * dt;
      if (!byKeys && target) sp = Math.min(sp, Math.hypot(target[0] - G.x, target[1] - G.y));
      const nx = G.x + mx * sp, ny = G.y + my * sp; if (onPlat(nx, ny) || inVenom(G.x, G.y)) { G.x = nx; G.y = ny; } else if (onPlat(nx, G.y)) G.x = nx; else if (onPlat(G.x, ny)) G.y = ny; }
    G.still = !G.kb && Math.hypot(G.x - px, G.y - py) < 1e-4; G.t = t; moveBots(t, dt); check(t0, t);
    G.bossHp = Math.max(56, 100 - 30 * Math.min(1, t / 139) - (t > 145.5 ? 14 * Math.min(1, (t - 145.5) / 19.5) : 0)); };
  const check = (t0, t) => { const x = G.x, y = G.y, crossed = (at) => at > t0 && at <= t;
    // waves: a hit is huge stacking poison; an egg it touches hatches (in your hands or on the floor)
    S.waves.forEach((w, i) => { if (G.done.has('w' + i) || !inWave(w, t, x, y)) return; G.done.add('w' + i); deb('venom', 10, true); mistake(w.ring ? 'ring' : 'wave', w.name + ' hit you.', w.tip, 28); const e = myEggHeld(); if (e) hatch(e, 'A wave touched your egg', 'Carrying an egg, a wave hatches it: dodge every one.'); });
    G.eggs.forEach((e) => { if (e.id === me && e.state === 'floor' && S.waves.some((w) => w.kind !== 'incub' && inWave(w, t, e.x, e.y))) hatch(e, 'Your egg was still on the floor when a wave reached it', 'Pick your egg up as soon as its shell breaks.'); });
    // impacts: the Womb, the debris
    S.impacts.forEach((m) => { if (crossed(m.at) && Math.hypot(x - m.x, y - m.y) <= m.r + PR * 0.5) mistake('impact', m.name + ' landed on you.', m.tip, m.dmg); });
    // the eggs land (4 yards), their shells break, carriers pick theirs up
    G.eggs.forEach((e) => { if (e.state === 'air' && t >= e.land) { e.state = 'floor'; if (Math.hypot(x - e.x, y - e.y) <= 4 + PR * 0.5) mistake('impact', 'An egg landed on you.', 'Eggs fall in 4-yard circles: step out of them.', 25); }
      if (e.state === 'floor' && e.id !== me && t >= e.shell + 0.3) { const b = G.bots[e.id]; if ((b && Math.hypot(b.x - e.x, b.y - e.y) < 2.5) || t > e.shell + 6) { e.state = 'held'; e.who = e.id; } }
      if (e.state === 'floor' && e.id === me && Math.hypot(x - e.x, y - e.y) <= 2.2) { if (t < e.shell) { if (!G.done.has('sh' + e.set)) { G.done.add('sh' + e.set); say('Its shell isn\'t broken yet: wait a moment.'); } } else { if (has('yolk')) mistake('yolk', 'You picked up an egg with Rancid Yolk on you.', 'Rancid Yolk lasts 20 s after your egg breaks: let it drop first.', 15); e.state = 'held'; e.who = me; say('Egg picked up: keep it out of every wave and away from other carriers.'); } }
      if (e.state === 'floor' && e.id === me && !G.done.has('left' + e.set)) { const sk = S.soaks.find((s) => s.at > e.land && s.group.includes(me)); if (sk && t > sk.at) { G.done.add('left' + e.set); mistake('egg', 'You never picked up your egg.', 'Your egg lands in your zone (the gold circle): pick it up once the shell breaks.', 0); } } });
    // another carrier inside your 3-yard circle: Noxious Splash, it hatches at once
    const mine = myEggHeld(); if (mine && !G.still) G.eggs.forEach((e) => { if (e.state !== 'held' || !e.who || e.who === me || !mine || mine.state !== 'held') return; const b = G.bots[e.who]; if (b && Math.hypot(x - b.x, y - b.y) < 3) { deb('splash', 10); hurt(30); hatch(mine, nm(e.who) + ' (carrying too) came inside your 3-yard circle', 'Two carriers within 3 yards: Noxious Splash. Keep your circle clear.'); } });
    // the coil slams: shared by everyone within 10 yards; carried eggs break; Soul Constrictor 5 s
    S.soaks.forEach((s) => { if (!crossed(s.at)) return; const n = 1 + GDZ_RAID.filter((id) => id !== me && Math.hypot(G.bots[id].x - s.x, G.bots[id].y - s.y) <= s.r).length, inn = Math.hypot(x - s.x, y - s.y) <= s.r;
      if (inn) { if (has('soul')) mistake('soul', 'Soul Constrictor: you took the slam before, so you couldn\'t help with this one.', 'Take only your own slam; the next one is the other group\'s.', 25);
        else { hurt(Math.max(6, Math.round(80 / n))); const e = myEggHeld(); if (e) { e.state = 'gone'; e.who = null; deb('yolk', 20); G.adds.push({ kind: 'rawling', x: x + 1.2, y: y + 1.2, t1: t + 9 }); say('Soaked: your egg broke (a Rawling). Rancid Yolk for 20 s.'); } else say('Soaked.'); } deb('soul', 5); }
      else if (s.group.includes(me)) mistake('soak', 'You missed your coil soak (slam ' + (s.k + 1) + '): the others took more.', 'Be inside your group\'s 10-yard circle when it slams.', 0);
      G.eggs.forEach((e) => { if (e.state === 'held' && e.who && e.who !== me && Math.hypot(G.bots[e.who].x - s.x, G.bots[e.who].y - s.y) <= s.r) { e.state = 'gone'; G.adds.push({ kind: 'rawling', x: G.bots[e.who].x + 1, y: G.bots[e.who].y + 1, t1: t + 9 }); e.who = null; } }); });
    // the bubbles: everyone farther than 10 yards from the Wretch is hit
    S.bubbles.forEach((q) => { if (!crossed(q.at)) return; const c = G.wr[q.w]; if (c && Math.hypot(x - c.x, y - c.y) > 10) { deb('fester', 12); mistake('fester', 'Fester Burst: you were outside the Wretch\'s bubble.', 'Be within 10 yards of the Wretch when Fester Burst goes off.', 40); } });
    // the tail's sweep: 35 yards, a big hit and a knockback
    S.thrash.forEach((th) => { if (!crossed(th.at)) return; const dd = Math.hypot(x - th.x, y - th.y); if (dd <= th.r) { mistake('thrash', 'Mephitic Thrash: you were inside her tail\'s 35 yards.', 'Run out of 35 yards from her tail during the cast.', 45); const a = Math.atan2(y - th.y, x - th.x); G.kb = { t0: t, x0: x, y0: y, x1: th.x + Math.cos(a) * (dd + 14), y1: th.y + Math.sin(a) * (dd + 14) }; } });
    // Mother's Wrath: five bites in her reach
    S.wrath.forEach((wr) => { for (let k = 0; k < 5; k++) { if (crossed(wr.at + k * 0.6) && Math.hypot(x - wr.p[0], y - wr.p[1]) <= 5 + PR) mistake('bite', 'Mother\'s Wrath bit you: you were in her reach.', 'Only her tank stands in the red circle in front of her.', 30); } });
    // the venom off the platform: it hurts, and it hatches a carried egg
    if (inVenom(x, y)) { hurt(10 * (t - t0)); const e = myEggHeld(); if (e) hatch(e, 'You went into the venom with your egg', 'The water off the platform hatches eggs: stay on the stone.'); if (!G.done.has('venom' + Math.floor(t / 10))) { G.done.add('venom' + Math.floor(t / 10)); G.log.push({ t, kind: 'venom', text: 'You were in the venom off the platform.', tip: 'Stay on the stone.' }); } }
    // raid damage in the heart burn, and what's on you
    S.pulses.forEach((p) => { if (crossed(p)) hurt(6); });
    const dps = (has('venom') ? 3.5 * G.debs.venom.n : 0) + (myEggHeld() ? (has('yolk') ? 3.6 : 1.2) : 0) + (has('fester') ? 3 : 0) + (has('putrid') ? 1.2 * G.debs.putrid.n : 0) + (has('splash') ? 5 : 0);
    G.hp -= dps * (t - t0) * (has('def') ? 0.5 : 1); G.hp = Math.min(100, G.hp + 5.5 * (t - t0));
    G.adds = G.adds.filter((a) => t < a.t1); };

  // ---- drawing ----
  const W2S = (x, y) => [cv.width / 2 + (x - cam[0]) * Z * dpr, cv.height / 2 - (y - cam[1]) * Z * dpr];
  const draw = () => { const rect = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); const Wd = Math.max(1, Math.round(rect.width * dpr)), Hd = Math.max(1, Math.round(rect.height * dpr)); if (cv.width !== Wd || cv.height !== Hd) { cv.width = Wd; cv.height = Hd; }
    const t = G.t, k = Z * dpr; if (!cam) cam = [G.x, G.y]; cam = [cam[0] + (G.x - cam[0]) * 0.18, cam[1] + (G.y - cam[1]) * 0.18];
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.fillStyle = '#07090c'; cx.fillRect(0, 0, cv.width, cv.height);
    const room = IMG.room; if (ok(room)) { const [sx, sy] = W2S(-PG_UL.artW / 2, PG_UL.artY + PG_UL.artH / 2); cx.drawImage(room, sx, sy, PG_UL.artW * k, PG_UL.artH * k); }
    const P = W2S, circ = (x, y, r, fill, stroke, lw, dash) => { const [sx, sy] = P(x, y); cx.beginPath(); cx.arc(sx, sy, Math.max(0.5, r * k), 0, Math.PI * 2); if (fill) { cx.fillStyle = fill; cx.fill(); } if (stroke) { cx.setLineDash((dash || []).map((v) => v * dpr)); cx.lineWidth = (lw || 2) * dpr; cx.strokeStyle = stroke; cx.stroke(); cx.setLineDash([]); } };
    const label = (x, y, text, color, size, dy) => { const [sx, sy] = P(x, y); cx.font = '700 ' + Math.round((size || 12) * dpr) + 'px system-ui, sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 3 * dpr; cx.strokeStyle = 'rgba(0,0,0,.85)'; cx.strokeText(text, sx, sy + (dy || 0) * dpr); cx.fillStyle = color || '#fff'; cx.fillText(text, sx, sy + (dy || 0) * dpr); };
    // ground: the thrash zone, her reach, coil circles (yours gold), bubbles, impacts, the beam
    S.thrash.forEach((th) => { if (t >= th.t0 && t <= th.at + 0.4) { const f = Math.min(1, (t - th.t0) / (th.at - th.t0)); circ(th.x, th.y, th.r, 'rgba(255,140,60,' + (0.06 + 0.1 * f).toFixed(3) + ')', 'rgba(255,155,74,.9)', 2.5, [10, 6]); if (t > th.at) circ(th.x, th.y, th.r, 'rgba(255,120,40,.35)'); } });
    S.wrath.forEach((wr) => { if (t >= wr.t0 && t <= wr.at + 3.2) circ(wr.p[0], wr.p[1], 5, 'rgba(255,60,60,.22)', '#ff4a4a', 2); });
    S.soaks.forEach((s) => { if (t >= s.t0 && t <= s.at + 0.5) { const mineS = s.group.includes(me), f = Math.min(1, (t - s.t0) / (s.at - s.t0)); circ(s.x, s.y, s.r, 'rgba(36,242,203,' + (t > s.at ? 0.4 : 0.08) + ')', mineS ? '#f3c969' : '#24f2cb', mineS ? 3.5 : 2, mineS ? [12, 6] : null); circ(s.x, s.y, s.r * f, null, 'rgba(36,242,203,.7)', 1.5); label(s.x, s.y, mineS ? 'YOUR SOAK' : 'Soak ' + (s.k + 1), mineS ? '#f3c969' : '#24f2cb', 13); } });
    S.bubbles.forEach((q) => { const c = G.wr[q.w]; if (c && t >= q.t0 && t <= q.at + 0.4) { const f = Math.min(1, (t - q.t0) / (q.at - q.t0)), [sx, sy] = P(c.x, c.y), g = cx.createRadialGradient(sx, sy, 0, sx, sy, 10 * k); g.addColorStop(0, 'rgba(216,242,47,.04)'); g.addColorStop(0.85, 'rgba(216,242,47,' + (0.1 + 0.14 * f).toFixed(3) + ')'); g.addColorStop(1, 'rgba(216,242,47,' + (0.25 + 0.2 * f).toFixed(3) + ')');
      cx.fillStyle = g; cx.beginPath(); cx.arc(sx, sy, 10 * k, 0, Math.PI * 2); cx.fill(); circ(c.x, c.y, 10, null, '#d8f22f', 2.5); circ(c.x, c.y, 10 * (1 - f), null, 'rgba(216,242,47,.55)', 1.5); if (t > q.at) circ(c.x, c.y, 10, 'rgba(216,242,47,.45)'); label(c.x, c.y, 'Into the bubble · ' + Math.max(0, q.at - t).toFixed(1), '#e8ff6a', 13, 10 * k / dpr + 16); } });
    S.impacts.forEach((m) => { if (t >= m.t0 && t <= m.at + 0.3) { const f = Math.min(1, (t - m.t0) / (m.at - m.t0)); circ(m.x, m.y, m.r, 'rgba(200,163,106,.16)', m.color, 2); circ(m.x, m.y, m.r * f, 'rgba(255,90,60,.25)'); } });
    G.eggs.forEach((e) => { if (e.state === 'air' && t >= e.land - 2.5) { const f = Math.min(1, (t - e.land + 2.5) / 2.5); circ(e.x, e.y, 4, 'rgba(230,224,200,.12)', '#e6e0c8', 1.6); circ(e.x, e.y, 4 * f, 'rgba(255,90,60,.22)'); } });
    S.beams.forEach((b) => { if (t >= b.t0 && t <= b.t1) { const [ax, ay] = P(b.from[0], b.from[1]), tk = G.bots.t2, [bx, by] = P(tk.x, tk.y); cx.lineWidth = 6 * dpr; cx.strokeStyle = 'rgba(58,242,168,.55)'; cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(bx, by); cx.stroke(); } if (t >= b.t0 - 1 && t <= b.t1) { circ(b.from[0], b.from[1], 3, 'rgba(58,242,168,.25)', '#3af2a8', 2); label(b.from[0], b.from[1], 'Spectral Ula\'tek', '#3af2a8', 12, -18); } });
    S.tails.forEach((q) => { if (t >= q.t0 && t <= q.at + 0.6) { circ(q.x, q.y, 3, 'rgba(255,90,58,.35)', '#ff5a3a', 2); label(q.x, q.y, 'Tail', '#ff8a6a', 11, -14); } });
    if (t >= S.dive.gone && t < S.dive.surf) { const p = S.dive.to; circ(p[0], p[1], 5, 'rgba(127,216,255,.25)', '#7fd8ff', 2, [6, 4]); label(p[0], p[1], 'Bubbles', '#7fd8ff', 12, -16); }
    // waves: rows of crescents (hers and the beam's), rings of crescents (the small tails)
    const cres = (Cx, Cy, ux, uy, f0, a0, b0, op) => { const zc = (a0 + b0) / 2, hz = (b0 - a0) / 2, bul = Math.min(3.6, 0.8 + hz * 0.7), th = Math.min(2.2, 0.8 + hz * 0.4), Q = (s1, s2) => P(Cx + ux * s1 - uy * s2, Cy + uy * s1 + ux * s2);
      const p1 = Q(f0, a0), c1 = Q(f0 + 2 * bul, zc), p2 = Q(f0, b0), c2 = Q(f0 + 2 * (bul - th), zc); cx.beginPath(); cx.moveTo(p1[0], p1[1]); cx.quadraticCurveTo(c1[0], c1[1], p2[0], p2[1]); cx.quadraticCurveTo(c2[0], c2[1], p1[0], p1[1]); cx.closePath();
      cx.globalAlpha = op; cx.fillStyle = '#9be13a'; cx.fill(); cx.lineWidth = 1.4 * dpr; cx.strokeStyle = '#06260e'; cx.stroke(); cx.globalAlpha = 1; };
    S.waves.forEach((w) => { if (w.warn && t >= w.t0 - w.warn && t < w.t0) { const a = w.deg * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), Q = (s1, s2) => P(w.x + ux * s1 - uy * s2, w.y + uy * s1 + ux * s2), c = [Q(-2.5, -w.w / 2), Q(2.5, -w.w / 2), Q(2.5, w.w / 2), Q(-2.5, w.w / 2)];
        cx.beginPath(); cx.moveTo(c[0][0], c[0][1]); c.slice(1).forEach((q) => cx.lineTo(q[0], q[1])); cx.closePath(); cx.fillStyle = 'rgba(255,90,58,' + (0.35 + 0.2 * Math.sin(t * 9)).toFixed(3) + ')'; cx.fill(); }
      if (t < w.t0 || t > w.t1) return; const el = t - w.t0, op = Math.max(0, Math.min(1, el / 0.35, (w.t1 - t) / 0.5)) * 0.92;
      if (w.ring) { const Rr = w.v * el + 2.5, st = 2 * Math.PI / w.n; for (let q = 0; q < w.n; q++) { const a = w.ph + q * st, u = Math.cos(a), v = Math.sin(a); cres(w.x + u * Rr, w.y + v * Rr, u, v, -2.2, -w.cw / 2, w.cw / 2, op); } return; }
      const a = w.deg * Math.PI / 180, u = Math.cos(a), v = Math.sin(a), Cx = w.x + u * w.v * el, Cy = w.y + v * w.v * el; w.cres.forEach(([a0, b0]) => cres(Cx, Cy, u, v, w.d / 2 - 2.2, a0, b0, op)); });
    // units: eggs, adds, the Wretches, her and her tail, the raid, you
    G.eggs.forEach((e) => { if (e.state === 'air' || e.state === 'gone') return; let p = [e.x, e.y]; if (e.who) { const b = e.who === me ? { x: G.x, y: G.y } : G.bots[e.who]; p = [b.x + 0.9, b.y + 0.9]; circ(b.x, b.y, 3, 'rgba(58,242,168,.08)', 'rgba(58,242,168,.85)', 1.6); }
      circ(p[0], p[1], 0.9, '#e9e2c6', '#5a5136', 1.5); if (e.state === 'floor' && t < e.shell) { circ(e.x, e.y, 2, null, '#e6e0c8', 2.5); const f = (t - e.land) / (e.shell - e.land), [sx, sy] = P(e.x, e.y); cx.beginPath(); cx.arc(sx, sy, 2 * k, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); cx.lineWidth = 3 * dpr; cx.strokeStyle = '#ffd36b'; cx.stroke(); }
      if (e.id === me && e.state === 'floor') { circ(e.x, e.y, 2.8, null, '#f3c969', 2.5, [5, 4]); label(e.x, e.y, t < e.shell ? 'Your egg (shell up)' : 'Your egg: pick it up', '#f3c969', 12, -22); } });
    if (myEggHeld()) { const jm = jobOf(me, t), ys = jm.ob && spotIn(jm.ob, me); if (ys) { circ(ys[0], ys[1], 1.3, 'rgba(243,201,105,.18)', '#f3c969', 2.5, [5, 4]); label(ys[0], ys[1], 'Your spot', '#f3c969', 12, -14); } }
    const nextEgg = G.eggs.find((e) => e.id === me && e.state === 'air' && e.land - t < 14); if (nextEgg) { circ(nextEgg.x, nextEgg.y, 4.5, 'rgba(243,201,105,.08)', '#f3c969', 2, [8, 5]); label(nextEgg.x, nextEgg.y, 'Your egg lands here', '#f3c969', 12, -26); }
    G.adds.forEach((a) => { circ(a.x, a.y, a.kind === 'viper' ? 1.6 : 1.1, a.kind === 'viper' ? '#ff3b3b' : '#a7c46b', '#000', 1.5); label(a.x, a.y, a.kind === 'viper' ? 'Viper' : 'Rawling', a.kind === 'viper' ? '#ff8f87' : '#c9df9a', 11, -14); });
    S.wretches.forEach((w) => { const c = G.wr[w.id]; if (!c) return; circ(c.x, c.y, 2.2, t < w.awake ? '#5b3e7a' : '#9b5cff', '#1a0d2b', 2); label(c.x, c.y, t < w.awake ? 'Wretch (asleep)' : 'Blightscale Wretch', '#c89bff', 12, -22); });
    const B = bossAt(t), TL = tailAt(t);
    if (TL.up) { const a0 = Math.atan2(-TL.p[1], -TL.p[0]); for (let i = 3; i >= 0; i--) { const a = a0 + Math.PI + (i - 1.5) * 0.55, q = [TL.p[0] + Math.cos(a) * (i ? 2.8 : 0), TL.p[1] + Math.sin(a) * (i ? 2.8 : 0)]; circ(q[0], q[1], 3.4 - i * 0.45, i ? '#3a2f16' : '#4a3b19', '#c8a36a', 2); } label(TL.p[0], TL.p[1], 'Gore Rattle', '#e8d6a8', 12, -38 * 0 - 4); }
    if (B.up) { const [sx, sy] = P(B.p[0], B.p[1]), a = Math.atan2(-B.p[1], -B.p[0]), r6 = 6.5 * k, g = cx.createRadialGradient(sx, sy, r6 * 0.2, sx, sy, r6 * 1.25); g.addColorStop(0, '#3f7a2c'); g.addColorStop(0.7, '#183516'); g.addColorStop(1, 'rgba(10,30,10,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(sx, sy, r6 * 1.25, 0, Math.PI * 2); cx.fill(); cx.beginPath(); cx.ellipse(sx, sy, r6, r6 * 0.82, -a, 0, Math.PI * 2); cx.fillStyle = '#1f4a1b'; cx.fill(); cx.lineWidth = 3 * dpr; cx.strokeStyle = '#b6f23a'; cx.stroke();
      [-1, 1].forEach((sd) => { const ex = sx + Math.cos(-a) * r6 * 0.45 - Math.sin(-a) * sd * r6 * 0.38, ey = sy + Math.sin(-a) * r6 * 0.45 + Math.cos(-a) * sd * r6 * 0.38; cx.beginPath(); cx.ellipse(ex, ey, r6 * 0.16, r6 * 0.09, -a + Math.PI / 2, 0, Math.PI * 2); cx.fillStyle = '#ffe14a'; cx.shadowColor = '#ffe14a'; cx.shadowBlur = 10 * dpr; cx.fill(); cx.shadowBlur = 0; });
      label(B.p[0], B.p[1], 'Ula\'tek', '#e9ffd0', 15, -7.6 * k / dpr); }
    if (t >= 145.5 && t < 165.5) { const hp = S.F(PG_UL.heart, t); circ(hp[0], hp[1], 3, '#5a0f22', '#ff5a7a', 2.5); label(hp[0], hp[1], 'Venomous Heart', '#ff9fb2', 12, -18); }
    const unit = (id, x, y, you) => { const r = GDZ_ROLE[rl(id)], [sx, sy] = P(x, y), rad = (you ? 1.3 : 1.0) * k, ic = IMG['role' + rl(id)]; cx.save(); cx.beginPath(); cx.arc(sx, sy, rad, 0, Math.PI * 2); cx.closePath(); if (ok(ic)) { cx.clip(); cx.drawImage(ic, sx - rad, sy - rad, rad * 2, rad * 2); } else { cx.fillStyle = r[1]; cx.fill(); } cx.restore();
      cx.beginPath(); cx.arc(sx, sy, rad, 0, Math.PI * 2); cx.lineWidth = (you ? 3 : 2) * dpr; cx.strokeStyle = you ? '#fff' : clsC(id) || r[1]; cx.stroke(); if (TEAM && !you) label(x, y, nm(id).slice(0, 7), clsC(id) || '#cfd6df', 10, -13); };
    GDZ_RAID.forEach((id) => { if (id !== me) unit(id, G.bots[id].x, G.bots[id].y, false); });
    if (has('def')) circ(G.x, G.y, 1.9, 'rgba(127,184,255,.18)', '#7fb8ff', 2); unit(me, G.x, G.y, true); label(G.x, G.y, 'YOU', '#fff', 12, -22);
    if (target && !window.__pgAuto) circ(target[0], target[1], 0.6, null, 'rgba(255,255,255,.6)', 1.5);
    G.fx = G.fx.filter((f) => t - f.t0 < 1.2); G.fx.forEach((f) => { const [sx, sy] = P(f.x, f.y), el = t - f.t0; cx.globalAlpha = Math.max(0, 1 - el / 1.2); cx.font = '800 ' + Math.round(18 * dpr) + 'px system-ui, sans-serif'; cx.textAlign = 'center'; cx.lineWidth = 4 * dpr; cx.strokeStyle = '#000'; cx.strokeText(f.text, sx, sy - (30 + el * 30) * dpr); cx.fillStyle = f.c; cx.fillText(f.text, sx, sy - (30 + el * 30) * dpr); cx.globalAlpha = 1; });
    miniMap2(t);
    const fl = (performance.now() - flashT) / 400; if (fl < 1) { const g = cx.createRadialGradient(cv.width / 2, cv.height / 2, Math.min(cv.width, cv.height) * 0.35, cv.width / 2, cv.height / 2, Math.max(cv.width, cv.height) * 0.75); g.addColorStop(0, 'rgba(255,40,30,0)'); g.addColorStop(1, 'rgba(255,40,30,' + (0.45 * (1 - fl)).toFixed(3) + ')'); cx.fillStyle = g; cx.fillRect(0, 0, cv.width, cv.height); } };

  // ---- the minimap: the whole stone at a glance ----
  const miniMap2 = (t) => { const Wm = mini.width, Hm = mini.height, sc = Wm / 120, M = (x, y) => [Wm / 2 + x * sc, Hm / 2 - y * sc], dot = (x, y, r, c, st) => { const [a, b] = M(x, y); mx2.beginPath(); mx2.arc(a, b, r, 0, Math.PI * 2); if (c) { mx2.fillStyle = c; mx2.fill(); } if (st) { mx2.strokeStyle = st; mx2.lineWidth = 1.5; mx2.stroke(); } };
    mx2.clearRect(0, 0, Wm, Hm); mx2.fillStyle = 'rgba(8,10,14,.82)'; mx2.fillRect(0, 0, Wm, Hm);
    const oct = [[36.5, 12.5], [15, 34], [-15, 34], [-36.5, 12.5], [-36.5, -12.5], [-15, -34], [15, -34], [36.5, -12.5]].map((q) => M(q[0], q[1])); mx2.beginPath(); oct.forEach((q, i) => (i ? mx2.lineTo(q[0], q[1]) : mx2.moveTo(q[0], q[1]))); mx2.closePath(); mx2.fillStyle = 'rgba(120,140,110,.28)'; mx2.fill(); mx2.strokeStyle = 'rgba(200,220,190,.5)'; mx2.lineWidth = 1; mx2.stroke();
    S.thrash.forEach((th) => { if (t >= th.t0 && t <= th.at) dot(th.x, th.y, th.r * sc, 'rgba(255,140,60,.18)', '#ff9b4a'); });
    S.soaks.forEach((q) => { if (t >= q.t0 && t <= q.at) dot(q.x, q.y, q.r * sc, 'rgba(36,242,203,.15)', q.group.includes(me) ? '#f3c969' : '#24f2cb'); });
    S.bubbles.forEach((q) => { const c = G.wr[q.w]; if (c && t >= q.t0 && t <= q.at) dot(c.x, c.y, 10 * sc, 'rgba(216,242,47,.18)', '#d8f22f'); });
    S.impacts.forEach((m) => { if (t >= m.t0 && t <= m.at) dot(m.x, m.y, m.r * sc, 'rgba(255,90,60,.25)'); });
    S.waves.forEach((w) => { if (t < w.t0 || t > w.t1) return; const el = t - w.t0; if (w.ring) { const [a, b] = M(w.x, w.y); mx2.beginPath(); mx2.arc(a, b, (w.v * el + 2.5) * sc, 0, Math.PI * 2); mx2.strokeStyle = 'rgba(155,225,58,.8)'; mx2.lineWidth = 2; mx2.stroke(); return; }
      const ang = w.deg * Math.PI / 180, u = Math.cos(ang), v = Math.sin(ang), c0 = [w.x + u * w.v * el, w.y + v * w.v * el], p1 = M(c0[0] + v * w.w / 2, c0[1] - u * w.w / 2), p2 = M(c0[0] - v * w.w / 2, c0[1] + u * w.w / 2); mx2.beginPath(); mx2.moveTo(p1[0], p1[1]); mx2.lineTo(p2[0], p2[1]); mx2.strokeStyle = 'rgba(155,225,58,.9)'; mx2.lineWidth = 3; mx2.stroke(); });
    const B = bossAt(t), TL = tailAt(t); if (B.up) dot(B.p[0], B.p[1], 5, '#2f6a22', '#b6f23a'); if (TL.up) dot(TL.p[0], TL.p[1], 3.5, '#4a3b19', '#c8a36a');
    S.wretches.forEach((w) => { const c = G.wr[w.id]; if (c) dot(c.x, c.y, 3, '#9b5cff'); });
    GDZ_RAID.forEach((id) => { if (id !== me) dot(G.bots[id].x, G.bots[id].y, 1.8, GDZ_ROLE[id[0]][1]); }); dot(G.x, G.y, 3, '#fff', '#000'); };

  // ---- the screen: your frame, her frame and cast, timers, warnings, your job, the action bar ----
  let hudKey = '';
  const castNow = (t) => S.casts.filter((c) => t >= c.t0 && t <= c.t1).sort((a) => (a.who === 'boss' ? -1 : 1))[0];
  const jobText = () => { const t = G.t, e = G.eggs.find((q) => q.id === me && (q.state === 'floor' || q.state === 'air') && q.land - t < 14), held = myEggHeld();
    const sk = S.soaks.find((s) => s.group.includes(me) && s.at > t && s.at - t <= 9), bb = S.bubbles.find((q) => q.at > t && q.at - t <= 8 && G.wr[q.w]), th = S.thrash.find((q) => t >= q.t0 - 1 && t <= q.at), wg = S.wings.find((w) => t >= w.t && t <= w.t + 14);
    if (th && Math.hypot(G.x - th.x, G.y - th.y) < 38) return 'Mephitic Thrash in ' + Math.max(0, Math.ceil(th.at - t)) + ' s: run out of 35 yards from her tail!';
    if (bb) return 'Fester Burst in ' + Math.ceil(bb.at - t) + ' s: get within 10 yards of the Wretch (the yellow bubble).';
    if (sk) return 'Your coil slam lands in ' + Math.ceil(sk.at - t) + ' s: stand in the gold circle.' + (held ? ' Your egg breaks there.' : '');
    if (wg) return 'Her ' + (wg.west ? 'west' : 'east') + ' half goes first: wait on the ' + (wg.west ? 'east' : 'west') + ' half, then cross behind the first wave.';
    if (e && e.state === 'air') return 'Your egg lands in ' + Math.max(0, Math.ceil(e.land - t)) + ' s (the gold circle): stay out of the 4-yard impact, then wait by it.';
    if (e && t < e.shell) return 'Your egg\'s shell breaks in ' + Math.ceil(e.shell - t) + ' s: wait by it.';
    if (e) return 'Pick up your egg now: walk over it.';
    if (has('yolk')) return 'Rancid Yolk: no new egg for ' + Math.ceil(G.debs.yolk.until - t) + ' s.';
    if (held) return 'Carrying your egg: no waves, no venom, keep other carriers out of your 3-yard circle. Break it in your coil soak.';
    if (t >= 145.5) return 'The heart is open: step out of the brown circles.';
    const nx = S.timers.find((q) => q.t > t); return nx ? 'Next: ' + nx.name + ' in ' + Math.ceil(nx.t - t) + ' s.' : ''; };
  const hud = (force) => { const t = G.t, c = castNow(t), key = Math.floor(t * 4) + '|' + Math.round(G.hp) + '|' + G.log.length + '|' + (c ? c.name : '');
    if (!force && key === hudKey) return; hudKey = key;
    $('.pg-mn').textContent = role.name + ' (you)'; $('.pg-mj').textContent = role.job;
    const hp = Math.max(0, Math.round(G.hp)), hb = $('.pg-hp'); hb.querySelector('i').style.width = hp + '%'; hb.querySelector('span').textContent = hp + '%'; hb.className = 'pg-bar pg-hp ' + (hp < 35 ? 'low' : hp < 65 ? 'mid' : '');
    $('.pg-debs').innerHTML = Object.entries(G.debs).filter(([, v]) => v.until > t).concat(myEggHeld() ? [['shell', { until: t + 99, n: 1 }]] : []).map(([kk, v]) => { const dd = DEB[kk]; return '<span style="border-color:' + dd[1] + ';color:' + dd[1] + '">' + esc(dd[0]) + (v.n > 1 ? ' ×' + v.n : '') + (v.until - t < 60 ? ' <em>' + Math.ceil(v.until - t) + '</em>' : '') + '</span>'; }).join('');
    $('.pg-clk').textContent = pgClock(t); const bh = $('.pg-bhp'); bh.querySelector('i').style.width = G.bossHp.toFixed(1) + '%'; bh.querySelector('span').textContent = Math.round(G.bossHp) + '%';
    const cb = $('.pg-cast'); if (c) { cb.style.display = 'block'; cb.querySelector('i').style.width = Math.min(100, (t - c.t0) / (c.t1 - c.t0) * 100) + '%'; cb.querySelector('span').textContent = (c.who === 'tail' ? 'Gore Rattle: ' : c.who === 'wretch' ? 'Wretch: ' : '') + c.name + '  ' + Math.max(0, c.t1 - t).toFixed(1); } else cb.style.display = 'none';
    $('.pg-timers').innerHTML = S.timers.filter((q) => q.t > t).filter((q, i, a) => a.findIndex((z) => z.name === q.name) === i).slice(0, 5).map((q) => '<div class="pg-tm"><i style="width:' + Math.max(0, Math.min(100, (1 - (q.t - t) / 20) * 100)).toFixed(1) + '%"></i><span>' + esc(q.name) + '</span><b>' + Math.ceil(q.t - t) + '</b></div>').join('');
    $('.pg-job p').textContent = jobText(); $('.pg-mc').textContent = G.log.length;
    [['sprint', G.sprint, 30], ['def', G.def, 90]].forEach(([kk, at, cd]) => { const el = $('.pg-act[data-a="' + kk + '"] i'), left = cd - (t - at); el.style.height = left > 0 ? (left / cd * 100).toFixed(1) + '%' : '0'; }); };
  const warns = () => { while (G.warnI < S.warns.length && S.warns[G.warnI].t <= G.t) { const w = S.warns[G.warnI++], el = $('.pg-warn'); el.textContent = w.text; el.style.color = w.c; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); } };

  // ---- the cards: pick your role, the countdown, a death, the end ----
  const asg = (id) => { const sets = TEAM ? [0, 1].map(() => (TEAM.soak[0].includes(id) ? 1 : TEAM.soak[1].includes(id) ? 2 : 0)) : PG_UL.soak.map((s) => (s[0].includes(id) ? 1 : s[1].includes(id) ? 2 : 0)), L = [];
    if (carrierOf(id)) L.push(['Your egg', TEAM ? 'Your area: ' + ZN[id][0] + ', the ' + ZN[id][1] + ' spot. It lands there at 0:10 and 1:20 (the gold circle). Wait for its shell, walk over it, carry it clean, break it in your coil soak.' : 'Lands in your zone at 0:10 and 1:20 (the gold circle). Wait for its shell, walk over it, carry it clean, break it in your coil soak.']);
    else L.push(['No egg', 'Keep out of the carriers\' way.']);
    if (TEAM && sets[0]) L.push(['Coil soaks', 'Soak #' + sets[0] + (TEAM.ce[sets[0] - 1].includes(id) ? ' with your egg' : ' (filler)') + ': ' + (sets[0] === 1 ? 'the first slam, 0:41 and 2:14' : 'the second slam, 0:44 and 2:18') + '. Your circle is gold. Never both slams: Soul Constrictor.']);
    else if (TEAM) L.push(['Coil soaks', 'Not yours: stay out of both circles.']);
    else L.push(['Coil soaks', 'First set (0:41): slam ' + sets[0] + '. Second set (2:14): slam ' + sets[1] + '. Your circle is gold. Never both slams: Soul Constrictor.']);
    if (TEAM) TEAM.fb.forEach((f, i) => { const j = f.indexOf(id); if (j >= 0) L.push(['Fester Burst ' + (i ? '1:48' : '0:39'), 'Your spot in the bubble: ' + (i ? 11 + j : 1 + j) + ' (a gold circle while you carry your egg).']); });
    L.push(['The Wretch\'s bubble', 'Within 10 yards of the Wretch at 0:39, 1:14, 1:48 and 2:22.']); L.push(['Her tail\'s sweep', 'Out of 35 yards from her tail at 0:49 and 1:46.']);
    L.push(['Her waves', 'At 0:56 and 1:53: wait on the half she isn\'t pulling her wing back from, then cross behind the first wave.']); L.push(['Small tails', 'A tail rising at the edge sends three waves 2.4 s later: step out of their red lanes.']);
    L.push(['Her reach', 'The red circle in front of her is her tank\'s.']); L.push(['The dive (1:17) and the heart (2:25)', 'She comes up on either side. In the heart burn, step out of the brown circles.']);
    return '<ul class="pg-asg">' + L.map(([a, b]) => '<li><b>' + esc(a) + '</b><span>' + esc(b) + '</span></li>').join('') + '</ul>'; };
  const START = [[0, 'The pull'], [30, '0:30 · First coils and the bubble'], [44, '0:44 · Tail sweep, then her waves'], [66, '1:06 · Second eggs and the dive'], [98, '1:38 · The hardest waves'], [124, '2:04 · Second coils'], [137, '2:17 · The heart burn']];
  const pick = () => { stop(); paused = true; card.className = 'pg-card on'; if (TEAM && (!pickedMe || !role || !TEAM.id2[role.id] || rl(role.id) === 't')) pickedMe = true, role = teamRole(TEAM.you && rl(TEAM.you) !== 't' ? TEAM.you : CAR8.find((c) => TEAM.id2[c]) || GDZ_RAID.find((c) => TEAM.id2[c] && rl(c) !== 't'));
    card.innerHTML = '<div class="pg-cin"><span class="pg-k">Practice · ' + dn + '</span><h2>' + esc(boss) + ': ' + esc(part.name) + '</h2>' +
      (TEAM ? '<p class="pg-lead">The real fight clock, from the top Mythic kills, with your team\'s plan: <b>' + esc(TEAM.name) + '</b>. Everyone does their job from it.</p>' +
        '<div class="pg-optrow pg-who"><span>Play as</span><select class="pg-me">' + GDZ_RAID.filter((id) => TEAM.id2[id] && rl(id) !== 't').map((id) => '<option value="' + id + '"' + (id === role.id ? ' selected' : '') + '>' + esc(nm(id)) + ' · ' + esc(teamRole(id).job) + '</option>').join('') + '</select></div>'
      : '<p class="pg-lead">The real fight clock, from the top Mythic kills. You are one raider; the other 19 play the plan.</p>' +
      '<div class="pg-roles">' + part.roles.map((r) => '<button type="button" class="pg-role' + (r.id === role.id ? ' on' : '') + '" data-id="' + r.id + '"><b>' + esc(r.name) + '</b><small>' + esc(r.job) + '</small></button>').join('') + '</div>') +
      '<div class="pg-asg0"><span class="pg-k">Your assignments</span>' + asg(role.id) + '</div>' +
      '<div class="pg-optrow"><span>Speed</span><div class="pg-seg pg-spd"><button type="button" data-v="1"' + (speed === 1 ? ' class="on"' : '') + '>Normal</button><button type="button" data-v="0.5"' + (speed < 1 ? ' class="on"' : '') + '>Half speed</button></div>' +
      '<span>Start at</span><select class="pg-at">' + START.map(([t0, n]) => '<option value="' + t0 + '"' + (t0 === startAt ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></div>' +
      '<p class="pg-keys">Move: W A S D, the arrows, or click · Shift: sprint · Q: defensive · Wheel: zoom · Space: pause</p>' +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go">Start</button></div></div>';
    const seeMe = () => { if (!G || !S) return; me = role.id; const p0 = homeOf(me, 0); G.x = p0[0]; G.y = p0[1]; cam = null; try { draw(); hud(true); } catch (e) { /* (drawn on Start) */ } }; /* (the picture behind the card is you) */
    if (TEAM) seeMe();
    const pm = card.querySelector('.pg-me'); if (pm) pm.onchange = () => { role = teamRole(pm.value); card.querySelector('.pg-asg0').innerHTML = '<span class="pg-k">Your assignments</span>' + asg(role.id); seeMe(); };
    card.querySelectorAll('.pg-role').forEach((b) => (b.onclick = () => { role = part.roles.find((r) => r.id === b.dataset.id) || role; card.querySelectorAll('.pg-role').forEach((q) => q.classList.toggle('on', q === b)); card.querySelector('.pg-asg0').innerHTML = '<span class="pg-k">Your assignments</span>' + asg(role.id); }));
    card.querySelectorAll('.pg-spd button').forEach((b) => (b.onclick = () => { speed = +b.dataset.v; card.querySelectorAll('.pg-spd button').forEach((q) => q.classList.toggle('on', q === b)); }));
    card.querySelector('.pg-at').onchange = (e) => { startAt = +e.target.value || 0; };
    card.querySelector('.pg-go').onclick = begin; };
  const ffTo = (T0) => { if (!(T0 > 0)) return; window.__pgAuto = true; try { while (G.t < T0) step1(0.05); } finally { window.__pgAuto = false; }
    G.eggs.forEach((e) => { if (e.id === me && e.state === 'gone') { const sk = S.soaks.find((s) => s.at > e.land && s.group.includes(me)); if (e.shell < T0 && sk && T0 < sk.at) { e.state = 'held'; e.who = me; } } });
    G.log = []; G.hp = 100; G.deaths = 0; G.debs = {}; G.adds = []; G.kb = null; G.fx = []; G.sprint = -99; G.def = -99; G.vipers = 0; target = null; cam = null; G.warnI = S.warns.findIndex((w) => w.t > G.t); if (G.warnI < 0) G.warnI = S.warns.length; };
  const begin = () => { me = role.id; reset(); ffTo(startAt); draw(); hud(true); let n = 3; card.className = 'pg-card on pg-cd'; card.innerHTML = '<div class="pg-n">' + n + '</div>';
    const tick = () => { if (!ov.isConnected) return; n--; if (n > 0) { card.innerHTML = '<div class="pg-n">' + n + '</div>'; setTimeout(tick, 750); } else { card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); } }; setTimeout(tick, 750); };
  const died = () => { stop(); paused = true; G.deaths++; const e = myEggHeld(); if (e) { e.state = 'gone'; e.who = null; G.vipers++; G.log.push({ t: G.t, kind: 'viper', text: 'You died holding your egg: a Viper hatched.', tip: 'A carrier\'s death hatches the egg.' }); }
    const why = G.log.slice(-4).reverse().find((m) => m.kind !== 'venom' && m.kind !== 'viper') || G.log[G.log.length - 1] || {};
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin"><span class="pg-k">' + pgClock(G.t) + '</span><h2>You died</h2><p>' + esc(why.text || '') + '</p>' + (why.tip ? '<p class="pg-tip">' + esc(why.tip) + '</p>' : '') +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go">Keep going</button><button type="button" class="pg-btn pg-again">Start over</button></div></div>';
    card.querySelector('.pg-go').onclick = () => { G.hp = 100; G.debs = {}; card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); };
    card.querySelector('.pg-again').onclick = pick; };
  const grade = () => { const maj = G.log.filter((m) => MAJ.has(m.kind)).length, mn = G.log.length - maj, sc = Math.max(0, 100 - maj * 9 - mn * 4 - G.deaths * 20); return { sc, g: sc >= 95 ? 'S' : sc >= 85 ? 'A' : sc >= 70 ? 'B' : sc >= 50 ? 'C' : 'D' }; };
  const end = () => { stop(); paused = true; const { sc, g } = grade(), n = G.log.length;
    card.className = 'pg-card on'; card.innerHTML = '<div class="pg-cin pg-end"><span class="pg-k">' + esc(boss) + ' ' + dn + ' · ' + esc(part.name) + ' · ' + esc(role.name) + (speed < 1 ? ' · half speed' : '') + (startAt ? ' · from ' + pgClock(startAt) : '') + '</span>' +
      '<div class="pg-grade"><b class="g' + g + '">' + g + '</b><div><h2>' + (n ? n + ' mistake' + (n > 1 ? 's' : '') : 'A clean run') + (G.deaths ? ', ' + G.deaths + ' death' + (G.deaths > 1 ? 's' : '') : '') + '</h2><p>' + sc + ' / 100' + (G.vipers ? ' · ' + G.vipers + ' Viper' + (G.vipers > 1 ? 's' : '') + ' hatched' : '') + '</p></div></div>' +
      (n ? '<ol class="pg-sum">' + G.log.slice().sort((a, b) => a.t - b.t).map((m) => '<li><time>' + pgClock(m.t) + '</time><div><b>' + esc(m.text) + '</b>' + (m.tip ? '<span>' + esc(m.tip) + '</span>' : '') + '</div></li>').join('') + '</ol>' : '<p>Every wave dodged, every soak and bubble taken, your eggs carried clean. Try another role.</p>') +
      '<div class="pg-row"><button type="button" class="pg-btn pg-go pg-copy">Copy my score</button><button type="button" class="pg-btn pg-again">Play again</button><button type="button" class="pg-btn pg-close2">Close</button></div></div>';
    card.querySelector('.pg-again').onclick = pick; card.querySelector('.pg-close2').onclick = close;
    const txt = 'Debrief practice · ' + boss + ' ' + dn + ', ' + part.name + ' · ' + role.name + ': ' + g + ' (' + (n ? n + ' mistake' + (n > 1 ? 's' : '') : 'no mistakes') + ', ' + G.deaths + ' death' + (G.deaths === 1 ? '' : 's') + ')' + (speed < 1 ? ' at half speed' : '') + ' · https://debriefme.io/guide/' + guideSlug(boss) + '/' + (d === 'h' ? 'heroic' : 'mythic') + '?practice';
    card.querySelector('.pg-copy').onclick = async (e) => { const b = e.currentTarget; let done = false; try { await navigator.clipboard.writeText(txt); done = true; } catch (er) { /* (no clipboard) */ } b.textContent = done ? 'Copied: post it in Discord' : txt; }; };

  // ---- the loop ----
  const frame = (now) => { raf = null; if (!ov.isConnected || paused) return; const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    let left = dt * speed; while (left > 1e-6) { const h = Math.min(0.02, left); step1(h); left -= h; if (G.hp <= 0 || G.t >= S.end) break; }
    warns(); draw(); hud(); if (G.hp <= 0) { died(); return; } if (G.t >= S.end) { end(); return; } raf = requestAnimationFrame(frame); };
  const go = () => { last = 0; if (!raf) raf = requestAnimationFrame(frame); };
  const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
  const pauseT = () => { if (!G || card.classList.contains('on')) return; paused = !paused; if (paused) { stop(); const w = $('.pg-warn'); w.textContent = 'Paused (Space to go on)'; w.style.color = '#fff'; w.classList.remove('in'); void w.offsetWidth; w.classList.add('in'); } else go(); };
  const K = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  const kd = (e) => { if (e.key === 'Escape') { close(); return; } if (e.code === 'Space' || e.code === 'KeyP') { e.preventDefault(); pauseT(); return; }
    if (G && !paused && (e.code === 'ShiftLeft' || e.code === 'ShiftRight')) { if (G.t - G.sprint >= 30) { G.sprint = G.t; deb('sprint', 3); hud(true); } return; }
    if (G && !paused && e.code === 'KeyQ') { if (G.t - G.def >= 90) { G.def = G.t; deb('def', 8); say('Defensive: half damage for 8 s.'); hud(true); } return; }
    const k = K[e.code]; if (k) { e.preventDefault(); keys[k] = true; target = null; } };
  const ku = (e) => { const k = K[e.code]; if (k) keys[k] = false; };
  document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
  cv.addEventListener('pointerdown', (e) => { if (paused || !G || !cam) return; const r = cv.getBoundingClientRect(), sx = (e.clientX - r.left) * dpr, sy = (e.clientY - r.top) * dpr; target = [cam[0] + (sx - cv.width / 2) / (Z * dpr), cam[1] - (sy - cv.height / 2) / (Z * dpr)]; e.preventDefault(); });
  cv.addEventListener('wheel', (e) => { e.preventDefault(); Z = Math.min(26, Math.max(6, Z * (e.deltaY > 0 ? 1 / 1.12 : 1.12))); if (paused && G) draw(); }, { passive: false });
  const onBlur = () => { keys = {}; }; window.addEventListener('blur', onBlur);
  const close = () => { if (!ov.isConnected) return; stop(); ov.remove(); document.documentElement.classList.remove('pg-open'); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); window.removeEventListener('blur', onBlur); };
  $('.pg-x').onclick = close;
  reset(); draw(); hud(true); pick(); [300, 1000, 2500].forEach((ms) => setTimeout(() => { if (G && paused && ov.isConnected) draw(); }, ms));

  // (for testing: play the whole part at once, as a raider who follows the plan or stands still; and an audit of all 20)
  const sim = (id, auto, eastSide, seedV) => { stop(); paused = true; me = id; role = TEAM && TEAM.id2[id] ? teamRole(id) : part.roles.find((r) => r.id === id) || role; reset({ east: !!eastSide, seed: seedV || 3 });
    window.__pgAuto = !!auto; const deaths = []; try { while (G.t < S.end) { step1(0.05); if (G.hp <= 0) { deaths.push(pgClock(G.t)); G.hp = 100; } } } finally { window.__pgAuto = false; } return { deaths, log: G.log.map((m) => pgClock(m.t) + ' ' + m.text) }; };
  const audit = (eastSide, seedV) => { stop(); paused = true; reset({ east: !!eastSide, seed: seedV || 3 });
    window.__pgAuto = true; const out = {}, hitW = new Set(), add = (kk, who, t) => { const q = out[kk] = out[kk] || { n: 0, who: new Set(), t: [] }; q.n++; q.who.add(who); if (q.t.length < 4 && !q.t.includes(pgClock(t))) q.t.push(pgClock(t)); };
    try { while (G.t < S.end) { const t0 = G.t; step1(0.05); const t = G.t, crossed = (at) => at > t0 && at <= t;
      GDZ_RAID.forEach((id) => { const b = id === me ? { x: G.x, y: G.y } : G.bots[id];
        S.waves.forEach((w, i) => { const kk = 'w' + i + id; if (!hitW.has(kk) && !(w.kind === 'incub' && id === 't2') && inWave(w, t, b.x, b.y)) { hitW.add(kk); add('in ' + w.name + ' (' + pgClock(w.t0) + ')', id, t); } });
        S.impacts.forEach((m) => { if (crossed(m.at) && Math.hypot(b.x - m.x, b.y - m.y) <= m.r) add('in ' + m.name, id, t); });
        G.eggs.forEach((e) => { if (crossed(e.land) && Math.hypot(b.x - e.x, b.y - e.y) <= 4) add('under a landing egg', id, t); });
        S.soaks.forEach((s) => { if (!crossed(s.at)) return; const dd = Math.hypot(b.x - s.x, b.y - s.y); if (s.group.includes(id) && dd > s.r) add('off their soak (set ' + (s.set + 1) + ' slam ' + (s.k + 1) + ')', id, t); if (!s.group.includes(id) && dd <= s.r && s.k === 1 && S.soaks.some((q) => q.set === s.set && q.k === 0 && q.group.includes(id))) add('soaked both slams', id, t); });
        S.bubbles.forEach((q) => { const c = G.wr[q.w]; if (crossed(q.at) && c && id !== 't1' && Math.hypot(b.x - c.x, b.y - c.y) > 10) add('outside the bubble ' + pgClock(q.at), id, t); });
        S.thrash.forEach((th) => { if (crossed(th.at) && Math.hypot(b.x - th.x, b.y - th.y) <= th.r) add('in the tail\'s sweep ' + pgClock(th.at), id, t); });
        S.wrath.forEach((wr) => { if (crossed(wr.at) && id !== 't1' && Math.hypot(b.x - wr.p[0], b.y - wr.p[1]) <= 5) add('in her reach ' + pgClock(wr.at), id, t); });
        if (!onPlat(b.x, b.y)) add('off the platform', id, t); });
      const car = G.eggs.filter((e) => e.state === 'held' && e.who).map((e) => e.who); for (let i = 0; i < car.length; i++) for (let j = i + 1; j < car.length; j++) { const a = car[i] === me ? { x: G.x, y: G.y } : G.bots[car[i]], c = car[j] === me ? { x: G.x, y: G.y } : G.bots[car[j]]; if (Math.hypot(a.x - c.x, a.y - c.y) < 3) add('two carriers within 3 yards', car[i] + '+' + car[j], t); }
      if (t > S.dive.surf && t0 <= S.dive.surf && pgDist([G.bots.t1.x, G.bots.t1.y], S.dive.to) > 12) add('her tank not at the bubbles when she surfaced', 't1', t); } } finally { window.__pgAuto = false; }
    return Object.entries(out).sort((a, b) => b[1].n - a[1].n).map(([kk, v]) => kk + ' × ' + v.n + ' [' + [...v.who].join(' ') + '] ' + v.t.join(' ')); };
  window.__pgDbg = { get teamWhy() { return teamWhy; }, get G() { return G; }, get S() { return S; }, sim, audit, step: (n) => { window.__pgAuto = true; try { for (let i = 0; i < n; i++) step1(0.05); } finally { window.__pgAuto = false; } return G.t; }, job: (id) => jobOf(id, G.t), play: () => { card.className = 'pg-card'; card.innerHTML = ''; paused = false; go(); }, set pos(p) { G.x = p[0]; G.y = p[1]; }, frame: () => { draw(); hud(true); }, at: (T0, id) => { stop(); paused = true; me = id || me; role = TEAM && TEAM.id2[me] ? teamRole(me) : part.roles.find((r) => r.id === me) || role; reset({ east: false, seed: 3 }); window.__pgAuto = true; try { while (G.t < T0) step1(0.05); } finally { window.__pgAuto = false; } draw(); hud(true); warns(); return G.t; } };
}

function pgCss() {
  if (document.getElementById('pg-css')) return; const st = document.createElement('style'); st.id = 'pg-css';
  st.textContent = `
html.pg-open, html.pg-open body { overflow: hidden; }
.pg { position: fixed; inset: 0; z-index: 72; background: #05070a; }
.pg-in { position: absolute; inset: 0; overflow: hidden; font-family: var(--body, system-ui, sans-serif); color: #e8edf2; user-select: none; }
.pg-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: crosshair; }
.pg-top { position: absolute; top: 0; left: 0; right: 0; display: grid; grid-template-columns: 300px 1fr 280px 34px; gap: 16px; align-items: start; padding: 12px 14px; pointer-events: none; }
.pg-top > * { pointer-events: auto; }
.pg-nm { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; } .pg-nm b { font: 700 15px var(--head, system-ui); text-shadow: 0 1px 3px #000; } .pg-nm span { font-size: 12.5px; color: #c2cbd5; text-shadow: 0 1px 3px #000; }
.pg-bar { position: relative; height: 20px; background: rgba(10,12,16,.85); border: 1px solid rgba(255,255,255,.18); overflow: hidden; }
.pg-bar i { position: absolute; left: 0; top: 0; bottom: 0; background: #3fbf5a; transition: width .1s linear; } .pg-bar span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font: 700 12.5px var(--head, system-ui); text-shadow: 0 1px 2px #000; }
.pg-hp.mid i { background: #d9a93a; } .pg-hp.low i { background: #d8483e; }
.pg-debs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; min-height: 22px; } .pg-debs span { padding: 2px 6px; border: 1px solid; background: rgba(10,12,16,.85); font: 600 12px var(--body, system-ui); } .pg-debs em { font-style: normal; color: #fff; margin-left: 3px; }
.pg-bossf { justify-self: center; width: min(460px, 100%); } .pg-bossf .pg-nm { justify-content: space-between; } .pg-clk { font: 800 16px var(--head, system-ui) !important; color: #fff !important; font-variant-numeric: tabular-nums; }
.pg-bhp i { background: #b0303a; } .pg-cast { margin-top: 4px; height: 18px; } .pg-cast i { background: #e0a53a; }
.pg-timers { display: flex; flex-direction: column; gap: 3px; } .pg-tm { position: relative; height: 20px; background: rgba(10,12,16,.85); border: 1px solid rgba(255,255,255,.15); font: 600 12.5px var(--body, system-ui); }
.pg-tm i { position: absolute; left: 0; top: 0; bottom: 0; background: rgba(90,140,220,.45); } .pg-tm span { position: absolute; left: 7px; top: 2px; } .pg-tm b { position: absolute; right: 7px; top: 2px; font-variant-numeric: tabular-nums; }
.pg-x { width: 32px; height: 32px; border: 1px solid rgba(255,255,255,.25); border-radius: 4px; background: rgba(10,12,16,.85); color: #cfd6de; font-size: 15px; cursor: pointer; } .pg-x:hover { border-color: #f3c969; color: #fff; }
.pg-warn { position: absolute; top: 22%; left: 0; right: 0; text-align: center; font: 800 26px var(--head, system-ui); text-shadow: 0 2px 6px #000, 0 0 2px #000; opacity: 0; pointer-events: none; padding: 0 20px; }
.pg-warn.in { animation: pgWarn 3s ease-out forwards; } @keyframes pgWarn { 0% { opacity: 0; transform: scale(1.15); } 8% { opacity: 1; transform: scale(1); } 75% { opacity: 1; } 100% { opacity: 0; } }
.pg-float { position: absolute; top: 31%; left: 0; right: 0; text-align: center; font: 700 16px var(--head, system-ui); text-shadow: 0 1px 4px #000; opacity: 0; pointer-events: none; padding: 0 20px; }
.pg-float.bad { color: #ff8f87; } .pg-float.ok { color: #7ee08f; } .pg-float.in { animation: pgFl 2.6s ease-out forwards; } @keyframes pgFl { 0% { opacity: 0; } 8% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
.pg-bot { position: absolute; left: 0; right: 0; bottom: 0; display: flex; justify-content: center; align-items: flex-end; gap: 16px; padding: 12px 14px; pointer-events: none; }
.pg-job { max-width: 560px; padding: 9px 12px; background: rgba(10,12,16,.88); border: 1px solid rgba(243,201,105,.5); } .pg-job span { display: block; font: 700 11.5px var(--head, system-ui); letter-spacing: .04em; text-transform: uppercase; color: #f3c969; } .pg-job p { margin: 2px 0 0; font: 600 15px/1.35 var(--body, system-ui); }
.pg-acts { display: flex; gap: 6px; } .pg-act { position: relative; width: 64px; height: 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(10,12,16,.88); border: 1px solid rgba(255,255,255,.22); overflow: hidden; }
.pg-act b { font: 800 14px var(--head, system-ui); } .pg-act span { font-size: 11.5px; color: #aab4c0; } .pg-act i { position: absolute; left: 0; right: 0; bottom: 0; height: 0; background: rgba(0,0,0,.6); }
.pg-mis b { color: #ff8f87; font-size: 18px; }
.pg-mini { position: absolute; left: 14px; top: 104px; width: 180px; height: 180px; border: 1px solid rgba(255,255,255,.2); pointer-events: none; }
@media (max-width: 900px) { .pg-mini { width: 120px; height: 120px; bottom: auto; top: 120px; } }
.pg-card { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(5,6,9,.62); z-index: 3; } .pg-card.on { display: flex; }
.pg-cin { width: min(620px, 94%); max-height: 92%; overflow: auto; padding: 20px 22px; background: var(--bg, #0f1117); border: 1px solid var(--line2, rgba(255,255,255,.18)); border-radius: 4px; box-shadow: 0 12px 40px rgba(0,0,0,.55); }
.pg-cin h2 { margin: 2px 0 8px; font: 800 24px/1.15 var(--head, system-ui); color: #fff; } .pg-k { display: block; font: 700 11.5px var(--head, system-ui); letter-spacing: .04em; text-transform: uppercase; color: #aab4c0; }
.pg-cin p { margin: 0 0 10px; color: #c2cbd5; font-size: 15px; line-height: 1.45; } .pg-tip { color: #f3c969 !important; }
.pg-who select { min-width: 0; flex: 1; max-width: 420px; }
.pg-roles { display: flex; gap: 8px; margin: 12px 0; } .pg-role { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid rgba(255,255,255,.2); border-radius: 4px; background: none; color: #fff; cursor: pointer; text-align: left; }
.pg-role b { font: 700 15px var(--head, system-ui); } .pg-role small { font-size: 12.5px; color: #aab4c0; } .pg-role.on { border-color: #f3c969; background: rgba(243,201,105,.08); }
.pg-asg { list-style: none; margin: 6px 0 0; padding: 0; display: flex; flex-direction: column; gap: 5px; max-height: 230px; overflow: auto; } .pg-asg li { padding: 5px 9px; border-left: 2px solid rgba(243,201,105,.6); font-size: 13.5px; line-height: 1.35; color: #c2cbd5; } .pg-asg li b { display: block; color: #fff; font: 700 13.5px var(--head, system-ui); }
.pg-optrow { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 12px; font-size: 13.5px; color: #aab4c0; }
.pg-seg { display: inline-flex; border: 1px solid rgba(255,255,255,.2); } .pg-seg button { height: 30px; padding: 0 12px; border: 0; background: none; color: #aab4c0; font: 600 13px var(--body, system-ui); cursor: pointer; } .pg-seg button.on { background: rgba(255,255,255,.1); color: #fff; }
.pg-at { height: 30px; padding: 0 8px; border: 1px solid rgba(255,255,255,.2); border-radius: 4px; background: #0f1117; color: #fff; font: 600 13px var(--body, system-ui); }
.pg-keys { margin-top: 10px !important; font-size: 13px !important; color: #8d97a3 !important; }
.pg-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; } .pg-btn { height: 34px; padding: 0 16px; border: 1px solid rgba(255,255,255,.25); border-radius: 4px; background: none; color: #fff; font: 700 14px var(--body, system-ui); cursor: pointer; } .pg-btn:hover { border-color: #f3c969; }
.pg-go { background: #f3c969; border-color: #f3c969; color: #1a1405; }
.pg-cd { background: none; pointer-events: none; } .pg-n { font: 800 110px/1 var(--head, system-ui); color: #fff; text-shadow: 0 4px 30px rgba(0,0,0,.8); }
.pg-grade { display: flex; align-items: center; gap: 16px; margin: 8px 0 12px; } .pg-grade > b { width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; font: 900 46px var(--head, system-ui); border: 2px solid; }
.pg-grade .gS { color: #f3c969; } .pg-grade .gA { color: #7ee08f; } .pg-grade .gB { color: #7fb8ff; } .pg-grade .gC { color: #e0a53a; } .pg-grade .gD { color: #ff8f87; } .pg-grade h2 { margin: 0; } .pg-grade p { margin: 2px 0 0; }
.pg-sum { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; } .pg-sum li { display: flex; gap: 10px; font-size: 14px; } .pg-sum time { min-width: 38px; color: #8d97a3; font-variant-numeric: tabular-nums; } .pg-sum b { display: block; color: #fff; font-weight: 600; } .pg-sum span { display: block; color: #f3c969; font-size: 13px; }
@media (max-width: 900px) { .pg-top { grid-template-columns: 1fr 34px; } .pg-bossf, .pg-timers { display: none; } .pg-bot { flex-direction: column; align-items: stretch; } }
`;
  document.head.appendChild(st);
}
