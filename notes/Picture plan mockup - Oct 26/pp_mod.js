
// ---- Picture plan (Oct 26, your words: "auto fill based on assignments in the plan tab, and these assignment images be posted
// directly with the assignments on the preview screen"; then "let the raid lead select which raid marker the mechanics happen on
// when they are used and give the raid lead a way to change the marker positions"). Next to every Copy for Discord button in Plan,
// a Pictures button opens one picture per mechanic the note gives jobs for: the boss's whole room, the note's players on their
// spots (names in class colour, spec icons; a random target is a grey ?) and the raid lead's own markers, which they drag to where
// they stand and pick for each mechanic. Each picture is a fixed 1200 x 675 image (Discord shows 16:9 cleanly) with Copy and
// Download. The maps are the guide's own (gdzKit, GDZ_CA_M), frozen at their key moment. Open to everyone since Oct 26; built per boss and
// difficulty in GDZ_PP, The Coiled Altar Mythic first. Plan's code is untouched: the buttons are added beside its own.
const PP_MKS = ['star', 'circle', 'diamond', 'triangle', 'moon', 'square', 'cross', 'skull'];
const PP_ON = () => true; /* (open to everyone (your call, Oct 26: "push this live please"); put the owner check back here to hide it again) */
const ppKey = (b, d) => 'wla-pp|' + b + '|' + d;
// (the raid lead's markers for a boss: { marks: { cross: [x, y], … }, uses: { axe: 'moon', … } }, over the boss's starting ones)
// (base: 'guide', the strategy's spots, or 'raid', the raid's own from its pulls; the raid lead's moves and picks go on top)
function ppConf(b, d) { const C = GDZ_PP[b] && GDZ_PP[b][d]; if (!C) return null; let s = {}; try { s = JSON.parse(store.get(ppKey(b, d)) || '{}') || {}; } catch (e) { s = {}; }
  const base = s.base === 'raid' && C.raid ? 'raid' : 'guide', B = base === 'raid' ? C.raid : { marks: C.marks, stack: C.stack, uses: Object.fromEntries(C.uses.map(([id, , def]) => [id, def])) };
  const marks = { _stack: B.stack }; for (const k of PP_MKS) marks[k] = (s.marks && s.marks[k]) || B.marks[k] || null;
  const uses = {}; for (const [id] of C.uses) uses[id] = s.uses && id in s.uses ? s.uses[id] : B.uses[id];
  return { C, base, marks, uses, saved: !!(s.marks || s.uses) }; }
const ppSave = (b, d, v) => store.set(ppKey(b, d), JSON.stringify(v));
// (a stand-in for whoever the fight picks: a grey dot with a question mark)
const ppAny = (label) => ({ name: label, color: '#c9ced8', specIcon: 'inv_misc_questionmark', any: true });
// (who each name is: class colour, spec icon and role, from the pull, else from Plan's saved specs)
function ppWho(r, names) { const sp = ndzSpecs(), here = new Map((r ? ndzIn(r) : []).map((p) => [ndzPn(p).toLowerCase(), p])), P = new Map();
  for (const n of names) { const p = here.get(n.toLowerCase()), s = sp[n.toLowerCase()] || {}, cls = p ? p.cls : s.cls, sid = +(p ? p.specId : s.sid) || 0, role = p ? p.role : s.role;
    P.set(n.toLowerCase(), { name: n, color: [p && p.color, s.color, (E.CLASSES[cls] || [])[1]].find((c) => c && c !== 'inherit') || '#ddd', specIcon: NDZ_SPECIC[sid] || (cls ? 'classicon_' + String(cls).toLowerCase() : 'inv_misc_questionmark'),
      role: role === 'tank' ? 'tank' : role === 'healer' ? 'healer' : sid && NDZ_MELEE.has(sid) ? 'melee' : 'ranged' }); }
  return P; }
// (who stands in which of the guide's spots: the jobs first, then everyone else by role, so a healer takes a healer's spot)
function ppSeat(P, fix) { const S = { ...fix }, used = new Set(Object.values(fix).filter((v) => typeof v === 'string')), left = [...P.values()].map((p) => p.name).filter((n) => !used.has(n)), free = GDZ_RAID.filter((s) => !(s in S)), R = { t: 'tank', h: 'healer', m: 'melee', r: 'ranged' };
  for (const s of free) { const i = left.findIndex((n) => P.get(n.toLowerCase()).role === R[s[0]]); if (i >= 0) S[s] = left.splice(i, 1)[0]; }
  for (const s of free) if (!(s in S) && left.length) S[s] = left.shift();
  return S; }
// (one picture's map: a guide map frozen at T, the note's names on its spots, only the job players named, the raid lead's markers)
function ppFreeze(mp, T, S, P, M, o) {
  o = o || {}; const f = mp.frames.reduce((a, b) => (Math.abs(b.t - T) < Math.abs(a.t - T) ? b : a)), nm = (v) => (typeof v === 'string' ? v : v && v.name);
  const pts = f.pts.map((p) => (p.kind === 'player' && S[p.guid] ? { ...p, name: nm(S[p.guid]) } : p));
  const pm = new Map(); for (const v of Object.values(S)) { const x = typeof v === 'string' ? P.get(v.toLowerCase()) : v; if (x) pm.set(x.name, x); }
  const cx = mp.room ? (mp.room.x0 + mp.room.x1) / 2 : 0, cy = mp.room ? (mp.room.y0 + mp.room.y1) / 2 : 0;
  const at = (ids, low) => { const q = pts.filter((p) => ids.includes(p.guid)); return q.length ? { x: q.reduce((a, p) => a + p.x, 0) / q.length, y: (low ? Math.min : Math.max)(...q.map((p) => p.y)) } : null; };
  // (a label sits over its group, or under it (below) when the group is by the top wall; or on a spot in yards from the room's middle)
  const calls = (o.labels || []).map(([ids, text, color, ink, dy, below]) => { const c = Array.isArray(ids) ? at(ids, below) : ids.rx != null ? { x: cx + ids.rx, y: cy + ids.ry } : ids;
    return c ? { t0: 0, t1: 1e9, text, x: c.x, y: below ? c.y - (dy == null ? 9 : dy) : c.y + (dy == null ? 5 : dy), color, ink: ink || '#fff' } : null; }).filter(Boolean);
  const cb = {}; for (const [g, l] of Object.entries(mp.cbars || {})) cb[g] = l.map((b) => ({ ...b, by: '' }));
  // (the raid lead's markers, drawn 4 yards further out than their spot so whoever stands on one doesn't hide it)
  const wm = PP_MKS.filter((k) => M[k] && (!o.marks || o.marks.includes(k))).map((k) => ({ k, x: cx + M[k][0], y: cy + M[k][1] + (M[k][1] >= 0 ? 4 : -4) }));
  const out = { ...mp, frames: null, pts, t: T, ft: T, pauses: [], steps: [], callouts: calls, tags: (o.tags || []).map(([g, tx]) => [g, tx, null, null]), hl: Object.keys(S).filter((g) => (o.hl || []).includes(g)),
    good: [], goodAt: null, bad: [], badAt: null, cbars: cb, wmarks: wm, liveLeg: false, hlLabel: 'assigned in the note', playerLabel: 'Player (spec icon, class colour)' };
  return { out, pm, keep: (o.named || []).map((g) => nm(S[g])).filter(Boolean) };
}
const ppG = (title, color, items, sub) => ({ title, color, items: items.filter(Boolean), sub });
const ppI = (P, n, job) => { const x = typeof n === 'string' ? P.get(n.toLowerCase()) : n; return x ? { ...x, job } : null; };

// ===== The Coiled Altar, Mythic =====
// (the note's jobs, from Plan's note, in the lines NSRT notes use: "Orb Carriers" sets with "{cross} purple orb: Name" (phase 1's set,
// then phase 3's), "P1 Soak 1:" axe soaks, "P1 Guillotine 1 External Guillotine Target:" and "… Zephyr Guillotine:", "1st CC on
// Mindcontrol:", the intstart kick lines, "Curse Unmarked Add:", "Soak Ghost at {cross}:"; and the older "Guillotine 1:" style)
function ppReadCA(N, P) {
  const isN = (w) => P.has(String(w).toLowerCase()), J = { axes: [], grim: [], orbs: [], cc: [], kicks: [], curse: {}, inter: [] }, slot = (ph, n) => { const L = ph === 'p3' ? J.grim : J.axes; return (L[n - 1] = L[n - 1] || { soak: [] }); };
  let inKick = false, orb = null;
  for (const l of N.lines) {
    const lab = l.label.toLowerCase(), raw = l.raw.toLowerCase(), mk = l.marks.map((i) => PP_MKS[i - 1]), who = l.words.filter(isN).map((w) => P.get(w.toLowerCase()).name), w0 = (l.words[0] || '').toLowerCase(); let m;
    if (w0 === 'intstart') { inKick = true; continue; } if (w0 === 'intend') { inKick = false; continue; }
    if (inKick) { if (who.length) J.kicks.push(who); continue; }
    // (a heading has no names; each "Orb Carriers" starts the next orb set)
    if (!who.length) { if (/orb carriers?/.test(raw)) J.orbs.push(orb = { purple: [], green: [], helpers: [] }); continue; }
    if ((m = /^(p[13])?\s*guillotine\s*(\d)\s+(external|zephyr)/.exec(lab))) { slot(m[1], +m[2])[m[3] === 'external' ? 'ext' : 'zeph'] = who[0]; continue; }
    if ((m = /^(external|zephyr)\s+(p3\s+)?guillotine\s*(\d)/.exec(lab))) { slot(m[2] ? 'p3' : 'p1', +m[3])[m[1] === 'external' ? 'ext' : 'zeph'] = who[0]; continue; }
    if ((m = /^(p[13])\s*soak\s*(\d)/.exec(lab)) || (m = /^(p3\s*)?guillotine\s*(\d)$/.exec(lab))) { slot(m[1] && m[1].trim() === 'p3' ? 'p3' : 'p1', +m[2]).soak = who; continue; }
    if (/\bcc\b|crowd control/.test(lab) && /mind ?control|dreadmarch|\bmc\b/.test(lab)) { const o = /(\d)/.exec(lab); J.cc[o ? +o[1] - 1 : J.cc.length] = who[0]; continue; }
    if (/curse/.test(lab)) { if (/unmarked/.test(lab)) J.curse.unmarked = who[0]; else J.curse.marked = who[0]; continue; }
    if (/ghost|fragment/.test(lab) && mk.length) { J.inter.push([mk[0], who[0]]); continue; }
    if (/purple orbs?$/.test(lab) && !mk.length && !orb) { J.orbs.push(orb = { purple: who.map((n) => ['', n]), green: [], helpers: [] }); continue; }
    if (!orb) continue;
    if (/help/.test(lab)) orb.helpers.push(...who); else if (/green/.test(lab)) orb.green.push([mk[0] || 'side', who[0]]); else if (/purple/.test(lab)) orb.purple.push([mk[0] || '', who[0]]);
  }
  return J;
}
// (the starting map pieces of a static scene: the raid around Zul'jan, everyone not placed in two clumps beside him)
function ppRest(k, put, spots, spread) { const left = GDZ_RAID.filter((s) => !put.has(s)); spots.forEach(([x, y], j) => k.at(0, left.filter((_, i) => i % spots.length === j), x, y, spread || 4.5)); }
// (an axe soak on a marker: the target and its soakers there, its 9-yard circle and the 40-yard eruption after it; the raid by the boss)
function ppAxe(at, soak, ext, zeph, P, M) {
  const k = gdzKit('The Coiled Altar', 3), fix = {}, put = new Set(), tanks = soak.filter((n) => (P.get(n.toLowerCase()) || {}).role === 'tank'), others = soak.filter((n) => !tanks.includes(n));
  const B = tanks.length ? [at[0] * 0.72, at[1] * 0.72] : [0, 0]; k.boss('zj', 'Zul\'jan', 0, B[0], B[1]);
  fix.m7 = ppAny('Axe target'); put.add('m7'); k.at(0, 'm7', at[0], at[1]);
  const TS = ['t1', 't2'], OS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'h1', 'h2', 'h3', 'h4'];
  tanks.forEach((n, i) => { fix[TS[i]] = n; put.add(TS[i]); });
  others.forEach((n, i) => { const s = OS.find((x) => !put.has(x)); fix[s] = n; put.add(s); });
  const G = Object.keys(fix).filter((s) => s !== 'm7'); G.forEach((s, i) => { const [dx, dy] = gdzSpot(i + 1, G.length + 1, 4.6); k.at(0, s, at[0] + dx, at[1] + dy); });
  const jobs = [[ext, 'External'], [zeph, 'Zephyr']].filter(([n]) => n && !soak.includes(n)).map(([n, t]) => { const s = OS.find((x) => !put.has(x)); fix[s] = n; put.add(s); return [s, t]; });
  const away = [-at[0] * 0.15, -at[1] * 0.15]; jobs.forEach(([s], i) => k.at(0, s, away[0] + (i ? 7 : -7), away[1] - 9));
  if (!tanks.length) { const T = TS.filter((s) => !put.has(s)); k.at(0, T[0], 0, -4).at(0, T[1], 4, 3); T.forEach((s) => put.add(s)); }
  ppRest(k, put, [[away[0] - 10, away[1] + 6], [away[0] + 10, away[1] + 6]]);
  k.ring({ on: 'm7', r: 9, fx: 'soak', t0: 0, at: 4, dur: 5, color: '#f24824', cn: 'Guillotine', label: false }).ring({ x: at[0], y: at[1], r: 40, fx: 'burst', t0: 0.4, at: 6.4, dur: 6.2, color: '#9ff26d', cn: 'Widow\'s Kiss', label: false });
  const S = ppSeat(P, fix); return { mp: k.done({ title: 'Guillotine', focus: { x: 0, y: 0, r: 30 } }), T: 1, S, G: G.concat('m7'), jobs };
}
function ppCardsCA(J, M, U, P) {
  const cards = [], R = '#f24824', PU = '#b65cff', GR = '#2fd15a', BL = '#5aa0ff', GO = '#e6b450', Q = '#c9ced8', spot = (u, def) => (U[u] && M[U[u]]) || def, MKN = (k) => (GDZ_WM[k] || [0, ''])[1].replace(' (X)', '');
  const where = (u) => (U[u] ? 'on ' + MKN(U[u]) : 'by the boss');
  // Phase 1 orbs: purples on their markers, two with each frontal; greens between them and the boss; the tanks swap between the two
  const O = J.orbs[0]; if (O && O.purple.length) { const k = gdzKit('The Coiled Altar', 3), fix = {}, put = new Set(['t1', 't2']), PS = ['r1', 'r2', 'r3', 'r4', 'r6', 'r7'];
    const pur = O.purple.map(([mk, n], i) => ({ mk, n, p: M[mk] || [[-5, 30], [5, 29], [-4, -31], [7, -32]][i % 4] }));
    // (the two pairs: north and south of the boss when it splits two and two (your pulls), else east and west; the south or west pair first)
    const ns = pur.filter((q) => q.p[1] < 0).length === 2, side = (q) => (ns ? q.p[1] < 0 : q.p[0] < 0), A = pur.filter(side), Bq = pur.filter((q) => !side(q)), dir = (L) => (L.length ? [L.reduce((s, q) => s + q.p[0], 0) / L.length, L.reduce((s, q) => s + q.p[1], 0) / L.length] : [0, -1]);
    const d1 = dir(A), d2 = dir(Bq), u = (d) => { const m = Math.hypot(d[0], d[1]) || 1; return [d[0] / m, d[1] / m]; }, u1 = u(d1), u2 = u(d2);
    k.boss('zj', 'Zul\'jan', 0, 0, 0).at(0, 't1', u1[0] * 5, u1[1] * 5).at(0, 't2', u2[0] * 6, u2[1] * 6);
    pur.forEach((q, i) => { const s = PS[i]; fix[s] = q.n; put.add(s); const sx = q.p[0] < 0 ? -1 : 1;
      k.obj('p' + i, 'porb', 0, q.p[0], q.p[1]).ring({ on: 'p' + i, r: 3.5, fx: 'debuff', t0: 0, dur: 99, color: PU, cn: 'Purple orb\'s ring', label: false }).at(0, s, q.p[0] + sx * 6, q.p[1] + (q.p[1] > 0 ? 2 : -2)); });
    // (every set has four greens (your note, Oct 26: "The maps are missing the green orbs"): the note's green carriers on their marker or
    // beside the frontal, and any green the note gives nobody still drawn, two with each frontal)
    const GS = ['m1', 'm2', 'm3', 'm4', 'm5'], sides = [[-8, 0.6], [8, 0.6]], greens = O.green.slice(0, 4).concat(Array(Math.max(0, 4 - O.green.length)).fill(['', ''])); let si = 0;
    greens.forEach(([mk, n], i) => { let p = mk && mk !== 'side' && M[mk];
      if (!p) { const a = si < 2 ? A : Bq, L = a.length ? a : pur, d = dir(L), uu = si < 2 ? u1 : u2, [ox, f] = sides[si % 2]; si++; p = [d[0] * f + ox * Math.abs(uu[1]), d[1] * f + ox * Math.abs(uu[0])]; }
      k.obj('g' + i, 'orb', 0, p[0], p[1]); if (!n) return; const s = GS[i]; fix[s] = n; put.add(s); k.at(0, s, p[0] + (p[0] <= 0 ? -3.5 : 3.5), p[1]); });
    const HS = ['h1', 'h2', 'h3', 'h4'], hp = [[-9, 10], [9, 10], [-12, -11], [12, -11]]; O.helpers.slice(0, 4).forEach((n, i) => { const s = HS[i]; fix[s] = n; put.add(s); k.at(0, s, hp[i][0] * (ns ? 1 : 0.4) + (ns ? 0 : hp[i][1]), hp[i][1] * (ns ? 1 : 0.4) + (ns ? 0 : hp[i][0])); });
    ppRest(k, put, ns ? [[-17, 0], [17, 0]] : [[0, 17], [0, -17]]);
    k.cone({ from: 'zj', to: 't1', at: 1.2, r: 35 }).cone({ from: 'zj', to: 't2', at: 1.2, r: 35 });
    const S = ppSeat(P, fix), PG = PS.slice(0, pur.length).concat(GS.slice(0, O.green.length)), lab = (d, t) => [{ rx: d[0] * 0.55 + (ns ? 22 : 0), ry: d[1] * 0.55 + (ns ? 0 : 22) }, t, R, '#fff', 0];
    cards.push({ id: 'orbs1', ph: 1, when: 'Every orb set', title: 'Toxic Deluge (Purples on their markers)', map: ppFreeze(k.done({ title: 'Toxic Deluge', focus: { x: 0, y: 0, r: 30 } }), 1, S, P, M, { hl: PG.concat(['t1', 't2']), named: PG, labels: [lab(d1, '1st frontal'), lab(d2, '2nd frontal')] }),
      legend: [ppG('Purple carriers', PU, pur.map((q) => ppI(P, q.n, MKN(q.mk)))), ppG('Green carriers', GR, O.green.map(([mk, n]) => ppI(P, n, mk === 'side' ? 'Side' : MKN(mk))), O.green.length ? '' : 'Not in the note: whoever is closest carries them.'), ppG('Helpers', GO, O.helpers.map((n) => ppI(P, n)), 'Move greens out of the purple carriers\' way.'),
        ppG('Tanks', BL, [], 'One takes the 1st frontal; the other taunts for the 2nd.')],
      foot: 'Two purples go with each frontal. Nothing may touch a purple ring.' }); }
  // Phase 1's two axes, on the raid lead's marker
  J.axes.forEach((A, i) => { if (!A || !A.soak.length) return; const x = ppAxe(spot('axe', [-37, 37]), A.soak, A.ext, A.zeph, P, M);
    cards.push({ id: 'axe' + (i + 1), ph: 1, when: 'Axe ' + (i + 1), title: 'Guillotine ' + (i + 1) + ' (Soak ' + where('axe') + ')', map: ppFreeze(x.mp, x.T, x.S, P, M, { hl: x.G.concat(x.jobs.map((q) => q[0])), named: x.jobs.map((q) => q[0]), tags: x.jobs, labels: [[x.G, 'Axe ' + (i + 1) + ' soak', R, '#fff', 7]] }),
      legend: [ppG('Soak (' + A.soak.length + ' + the target)', R, A.soak.map((n) => ppI(P, n))), ppG('On the axe target', GO, [A.ext && ppI(P, A.ext, 'External'), A.zeph && ppI(P, A.zeph, 'Zephyr')]), ppG('Axe target', Q, [ppI(P, ppAny('Whoever gets the axe'))], 'Walks to the soak spot.')],
      foot: 'Soakers walk 40 yards out after it lands: the spot erupts.' }); });
  // The end of phase 1: Zul'jan dies and every orb blows up; the raid stacks in the cooldowns the note puts there
  { const st = spot('stack', M._stack || [5, -11]), k = gdzKit('The Coiled Altar', 3), put = new Set(['t1', 't2']); k.boss('zj', 'Zul\'jan', 0, 0, 0).at(0, 't1', 0, -3).at(0, 't2', 3, 2);
    k.at(0, GDZ_RAID.filter((s) => !put.has(s)), st[0], st[1], 7).ring({ x: st[0], y: st[1], r: 9, fx: 'zone', t0: 0, dur: 99, color: '#9a7bff', cn: 'Raid cooldowns', label: false });
    cards.push({ id: 'stack', ph: 1.9, when: 'The push', title: 'Venom Rupture (Stack in the cooldowns)', map: ppFreeze(k.done({ title: 'Venom Rupture', focus: { x: 0, y: 0, r: 30 } }), 1, ppSeat(P, {}), P, M, { labels: [[{ rx: st[0], ry: st[1] + 9 }, 'Stack in the cooldowns', '#9a7bff', '#fff', 0]] }),
      legend: [ppG('Raid cooldowns', '#9a7bff', (J.rupture || []).map(([t, n, sp]) => ppI(P, n, t + ' ' + sp)), (J.rupture || []).length ? '' : 'Your note\'s cooldowns for the push go here.'), ppG('Everyone', GO, [], 'A defensive when the orbs blow up.')],
      foot: 'Zul\'jan dies by the pools: every orb blows up, so the whole raid stacks inside the cooldowns.' }); }
  // Phase 2, Dreadmarch: the mind controls are stacked on the raid lead's marker; the note's crowd-control order frees them
  if (J.cc.filter(Boolean).length) { const st = spot('dread', [25, -35]), k = gdzKit('The Coiled Altar', 3), m = Math.hypot(st[0], st[1]) || 1, toM = [-st[0] / m, -st[1] / m], fix = {}, put = new Set();
    const bx = [st[0] + toM[0] * 16, st[1] + toM[1] * 16]; k.boss('hm', 'Malacrass', 0, bx[0], bx[1]);
    ['r5', 'm4', 'h2'].forEach((s, i) => { fix[s] = ppAny('Mind controlled'); put.add(s); const [dx, dy] = gdzSpot(i, 3, 2.4); k.at(0, s, st[0] + dx, st[1] + dy); });
    const CS = ['m1', 'h1', 'r1', 'm2'], nx = [-toM[1], toM[0]]; J.cc.filter(Boolean).forEach((n, i) => { const s = CS[i]; fix[s] = n; put.add(s); const a = (i - 1.5) * 5.5; k.at(0, s, st[0] + toM[0] * 7 + nx[0] * a, st[1] + toM[1] * 7 + nx[1] * a); });
    k.at(0, 't1', bx[0] + toM[0] * 3, bx[1] + toM[1] * 3).at(0, 't2', bx[0] + nx[0] * 4, bx[1] + nx[1] * 4); put.add('t1'); put.add('t2');
    k.at(0, GDZ_RAID.filter((s) => !put.has(s)), st[0] + toM[0] * 13, st[1] + toM[1] * 13, 6);
    const S = ppSeat(P, fix), C4 = CS.slice(0, J.cc.filter(Boolean).length);
    cards.push({ id: 'dread', ph: 2, when: 'Every Dreadmarch', title: 'Dreadmarch (Stack the mind controls ' + where('dread') + ')', map: ppFreeze(k.done({ title: 'Dreadmarch', focus: { x: 0, y: 0, r: 30 } }), 1, S, P, M, { hl: ['r5', 'm4', 'h2'].concat(C4), named: C4, tags: C4.map((s, i) => [s, 'CC ' + (i + 1)]), labels: [[['r5', 'm4', 'h2'], 'Mind controls here', PU, '#fff', 6]] }),
      legend: [ppG('Crowd control, in order', PU, J.cc.filter(Boolean).map((n, i) => ppI(P, n, ['1st', '2nd', '3rd', '4th'][i] || ''))), ppG('Mind controlled', Q, [ppI(P, ppAny('Random players'))], 'They walk to the stack spot. Break their shields there.')],
      foot: 'Freed players stand still and look at their ghost. The boss tank lines up Soul Sever so it hits the most ghosts.' }); }
  // Phase 2 adds: the note's kick lines (the line with more melee takes the unmarked add) and the curses
  if (J.kicks.length) { const mel = (L) => L.filter((n) => (P.get(n.toLowerCase()) || {}).role === 'melee').length, L = J.kicks.slice(0, 2).sort((a, b) => mel(b) - mel(a)), fix = {}, put = new Set();
    const MS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], RS = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'];
    const seat = (names, slots) => [...new Set(names)].forEach((n) => { const isT = (P.get(n.toLowerCase()) || {}).role === 'tank', s = isT ? ['t2', 't1'].find((x) => !put.has(x)) : slots.find((x) => !put.has(x)); if (s) { fix[s] = n; put.add(s); } });
    seat(L[0] || [], MS); seat(L[1] || [], RS);
    const cu = [[J.curse.unmarked, 'Curse'], [J.curse.marked, 'Curse']].filter(([n]) => n), cs = cu.map(([n]) => Object.keys(fix).find((s) => fix[s] === n) || (() => { const s = RS.find((x) => !put.has(x)); fix[s] = n; put.add(s); return s; })());
    const mp = GDZ_CA_M.kicks(), ar = mp.frames[0].pts.find((p) => p.guid === 'ar'), am = mp.frames[0].pts.find((p) => p.guid === 'am');
    cards.push({ id: 'kicks', ph: 2, when: 'Every add set', title: 'Spiritcackle (Kick every Wail of Terror)', map: ppFreeze(mp, 4.8, ppSeat(P, fix), P, M, { hl: [...put], named: cs, tags: cs.map((s) => [s, 'Curse']), labels: [[{ x: am.x, y: am.y }, 'Kick line 1', BL, '#fff', 6], [{ x: ar.x, y: ar.y }, 'Kick line 2 · marked', GR, '#06140a', 6]] }),
      legend: [ppG('Kick line 1: the unmarked add', BL, (L[0] || []).map((n, i) => ppI(P, n, 'Kick ' + (i + 1)))), ppG('Kick line 2: the marked add', GR, (L[1] || []).map((n, i) => ppI(P, n, 'Kick ' + (i + 1)))),
        ppG('Curse of Tongues', '#8788EE', [J.curse.unmarked && ppI(P, J.curse.unmarked, 'Unmarked add'), J.curse.marked && ppI(P, J.curse.marked, 'Marked add')])],
      foot: 'The next kicker takes the next cast, even after the add teleports.' }); }
  // Phase 2 Gloombombs (no names in a note: two random ranged and two random melee; ranged bombs to the marked add)
  { const mp = GDZ_CA_M.bombs(), ar = mp.frames[0].pts.find((p) => p.guid === 'ar'), am = mp.frames[0].pts.find((p) => p.guid === 'am');
    cards.push({ id: 'bombs', ph: 2, when: 'Every add set', title: 'Gloombomb (Two bombs on each add)', map: ppFreeze(mp, 5.5, ppSeat(P, { r1: ppAny('Ranged bomb'), r2: ppAny('Ranged bomb'), m1: ppAny('Melee bomb'), m2: ppAny('Melee bomb') }), P, M, { hl: ['r1', 'r2', 'm1', 'm2'], labels: [[{ x: ar.x, y: ar.y }, 'Ranged bombs · marked add', GR, '#06140a', 9], [{ x: am.x, y: am.y }, 'Melee bombs · unmarked add', BL, '#fff', 9]] }),
      legend: [ppG('Gloombomb (random each set)', '#da3df2', [ppI(P, ppAny('2 ranged players'), 'Marked add'), ppI(P, ppAny('2 melee players'), 'Unmarked add')], 'Stand on opposite sides of your add, so the two blasts overlap on it and on nobody else.')],
      foot: 'Each add\'s shield needs two bombs. Kick the add as soon as the Gloombomb cast shows, so it stands still.' }); }
  // Intermission: the note's first fragment stops, each on their marker; everyone else on Zul'jan for Bloodlust
  if (J.inter.length) { const k = gdzKit('The Coiled Altar', 3), fix = {}, put = new Set(['t1', 't2']), SL = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
    k.boss('zj', 'Zul\'jan', 0, 0, 0).at(0, 't1', -2, 3).at(0, 't2', 2, 3);
    J.inter.forEach(([mk, n], i) => { const p = M[mk]; if (!p || !SL[i]) return; const s = SL[i]; fix[s] = n; put.add(s); k.at(0, s, p[0], p[1]); const m = Math.hypot(p[0], p[1]) || 1, f = [p[0] + p[0] / m * 9, p[1] + p[1] / m * 9];
      k.add('f' + i, 'Fragment of Malacrass', 0, f[0], f[1]).link({ from: 'f' + i, to: s, t0: 0, t1: 99, color: '#c49bff', dash: true }); });
    k.at(0, GDZ_RAID.filter((s) => !put.has(s)), 0, -1, 7); const G = Object.keys(fix);
    cards.push({ id: 'inter', ph: 2.5, when: 'First stops', title: 'Fragments of Malacrass (Stop them at your marker)', map: ppFreeze(k.done({ title: 'Intermission', focus: { x: 0, y: 0, r: 30 } }), 1, ppSeat(P, fix), P, M, { hl: G, named: G, marks: J.inter.map((q) => q[0]), labels: [[{ rx: 0, ry: 9 }, 'Bloodlust on Zul\'jan', '#ff7a5c', '#fff', 0]] }),
      legend: [ppG('First stops, on their markers', PU, J.inter.map(([mk, n]) => ppI(P, n, MKN(mk)))), ppG('Raid cooldowns', '#9a7bff', (J.interCds || []).map(([t, n, sp]) => ppI(P, n, t + ' ' + sp)))],
      foot: 'Every stop hits the whole raid, so stop a few at a time, then the big turn under the raid cooldowns.' }); }
  // Phase 3 orbs: the note's purple carriers build the diamond in the middle (the guide's shape; your Oct 21 pull dropped them there too)
  const O3 = J.orbs[1]; if (O3 && O3.purple.length) { const fix = {}, put = new Set(), slot = (n) => { const r = (P.get(n.toLowerCase()) || {}).role, s = (r === 'tank' ? ['t2'] : r === 'healer' ? ['h4', 'r3', 'r4'] : ['r3', 'r4', 'h4']).find((x) => !put.has(x)) || ['r3', 'r4', 't2', 'h4'].find((x) => !put.has(x)); put.add(s); return s; };
    O3.purple.slice(0, 4).forEach(([, n]) => { fix[slot(n)] = n; }); const G = Object.keys(fix); ['m1', 'm2', 'm3'].forEach((s, i) => { if (O3.green[i]) fix[s] = O3.green[i][1]; });
    cards.push({ id: 'orbs3', ph: 3, when: 'Every orb set', title: 'Toxic Deluge (Build the purple diamond)', map: ppFreeze(GDZ_CA_M.diamond(), 13.1, ppSeat(P, fix), P, M, { hl: G, named: G, labels: [[['p0', 'p1', 'p2', 'p3'], 'Purple diamond', PU, '#fff', 8, true]] }),
      legend: [ppG('Purple carriers', PU, O3.purple.map(([mk, n]) => ppI(P, n, mk ? MKN(mk) : ''))), ppG('Green carriers', GR, O3.green.map(([mk, n]) => ppI(P, n, mk === 'side' ? 'Side' : MKN(mk))), 'Line the greens up off to the side.'), ppG('Helpers', GO, O3.helpers.map((n) => ppI(P, n)))],
      foot: 'Every purple apart, all inside the frontal. The off-tank takes the frontal and aims it through the diamond.' }); }
  // Phase 3's three axes, each on the raid lead's marker
  J.grim.forEach((A, i) => { if (!A || !A.soak.length) return; const u = i ? 'grim2' : 'grim1', x = ppAxe(spot(u, [25, -35]), A.soak, A.ext, A.zeph, P, M);
    cards.push({ id: 'grim' + (i + 1), ph: 3, when: 'Axe ' + (i + 1), title: 'Grim Guillotine ' + (i + 1) + ' (Soak ' + where(u) + ')', map: ppFreeze(x.mp, x.T, x.S, P, M, { hl: x.G.concat(x.jobs.map((q) => q[0])), named: x.jobs.map((q) => q[0]), tags: x.jobs, labels: [[x.G, 'Axe ' + (i + 1) + ' soak', R, '#fff', 7]] }),
      legend: [ppG('Soak (' + A.soak.length + ' + the target)', R, A.soak.map((n) => ppI(P, n))), ppG('On the axe target', GO, [A.ext && ppI(P, A.ext, 'External'), A.zeph && ppI(P, A.zeph, 'Zephyr')]), ppG('Axe target', Q, [ppI(P, ppAny('Whoever gets the axe'))], 'Walks to the soak spot.')],
      foot: 'These axes are magic: big externals on the target. Soakers walk 40 yards out after it lands.' }); });
  return cards;
}
// (the note's healing and raid cooldowns at a moment, for a picture's legend: NSRT reminder lines between two times of a phase)
function ppCds(N, P, ph, t0, t1) { return N.reminders.filter((x) => x.ph === ph && x.time >= t0 && x.time <= t1 && x.spellid).flatMap((x) => x.tags.filter((w) => P.has(w.toLowerCase())).map((w) => [Math.floor(x.time / 60) + ':' + String(Math.round(x.time % 60)).padStart(2, '0'), P.get(w.toLowerCase()).name, (E.cdName && E.cdName(x.spellid)) || x.text || 'Cooldown'])); }
const GDZ_PP = {
  'The Coiled Altar': { Mythic: {
    // (the starting spots, in yards from the room's middle (x east, y north): the guide's strategy (your call, Oct 26: "the markers should
    // be at the default locations based on the strategy"): the X on the entrance wall, moon and skull in its corners, star and square in the
    // far corners, diamond on the far wall, the circle on a side wall (the guide's maps, turned to the room), the triangle on the other)
    marks: { cross: [0, -37], moon: [35, -35], skull: [-35, -35], star: [35, 35], square: [-35, 35], diamond: [-13, 37], circle: [-37, 19], triangle: [37, 19] },
    stack: [-14, -8],
    // (where each mechanic happens: a marker the raid lead picks, or '' for the spot shown; the guide: phase 1's axes at the moon,
    // Dreadmarch on the square, phase 3's first axe at the star and the next two at the square)
    uses: [['axe', 'Phase 1 axes', 'moon'], ['stack', 'Venom Rupture stack', ''], ['dread', 'Dreadmarch stack', 'square'], ['grim1', 'Phase 3 axe 1', 'star'], ['grim2', 'Phase 3 axes 2 and 3', 'square']],
    // (your raid's own spots, one click away: read from your pulls on Oct 21 and 22: where each purple carrier dropped their orb
    // (cross, triangle, square, diamond) and the greens (star, skull), where you soaked phase 1's axes (moon), and where you stacked
    // Dreadmarch and soaked phase 3's axes (circle))
    raid: { marks: { cross: [-5, 30], triangle: [5, 29], square: [-4, -31], diamond: [7, -32], star: [2, 16], skull: [-2, -23], moon: [-37, 37], circle: [25, -35] }, stack: [5, -11],
      uses: { axe: 'moon', stack: '', dread: 'circle', grim1: 'circle', grim2: 'circle' } },
    read(N, P) { const J = ppReadCA(N, P); J.rupture = ppCds(N, P, 1, 160, 200).concat(ppCds(N, P, 2, 0, 5)); J.interCds = ppCds(N, P, 2.5, 0, 40); return J; },
    cards: ppCardsCA,
    // (Plan's Jobs cards and the pictures each one shows: by the key Plan gives each card's picture row (its build parts), else by the
    // card's title, where the grim card is matched before the phase 1 axes)
    mech: { kicks: ['kicks', 'bombs'], g: ['axe1', 'axe2'], g3: ['grim1', 'grim2', 'grim3'], orbs: ['orbs1', 'orbs3'], mc: ['dread'], curse: ['kicks'], cd: ['stack', 'inter'], cds: ['stack', 'inter'], def: [] },
    jobs: [[/p3|grim/i, ['grim1', 'grim2', 'grim3']], [/guillotine/i, ['axe1', 'axe2']], [/kick/i, ['kicks', 'bombs']], [/purple orb/i, ['orbs1', 'orbs3']], [/dreadmarch|mind ?control/i, ['dread']], [/curse/i, ['kicks']], [/raid cooldown/i, ['stack', 'inter']]] } },
};
const PP_PH = { 1: ['Phase 1', '#5aa0ff'], 1.9: ['Phase 1 ends', '#5aa0ff'], 2: ['Phase 2', '#b65cff'], 2.5: ['Intermission', '#e6b450'], 3: ['Phase 3', '#ff5a4f'] };

// ---- turning a card into its 1200 x 675 picture: the map (the miniMap SVG with its styles written in and its images inlined, so a
// canvas can draw it and still be copied), the title, the legend and a footer, drawn on a canvas
const PP_IMG = new Map();
function ppData(u) { if (!u) return Promise.resolve(''); if (PP_IMG.has(u)) return PP_IMG.get(u);
  const p = fetch(u, { mode: 'cors' }).then((r) => (r.ok ? r.blob() : Promise.reject(new Error('HTTP ' + r.status)))).then((b) => new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => ok(''); fr.readAsDataURL(b); })).catch(() => '');
  PP_IMG.set(u, p); return p; }
// (the room render comes from RaidPlan, which doesn't let a page copy its pictures: the website's Worker hands it over (/api/art/))
const ppArt = (u) => { const m = /^https:\/\/cdn\.raidplan\.io\/raid\/wow\.venomabyss\/map\/([\w.-]+)$/.exec(u || ''); return m ? (window.WLA_HOSTED ? '/api/art/' + m[1] : '') : u; };
const ppImg = (src) => new Promise((ok) => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const PP_CSS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'text-anchor', 'dominant-baseline', 'paint-order', 'display', 'visibility'];
async function ppMapImg(fz) {
  const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-10000px;top:0;width:700px;pointer-events:none'; box.className = 'pp-off'; box.innerHTML = miniMap(fz.out, fz.pm); document.body.appendChild(box);
  try { const sv = box.querySelector('svg.zmap') || box.querySelector('svg'); if (!sv) return null;
    sv.querySelectorAll('text.mlp').forEach((t) => { if (!fz.keep.some((n) => t.textContent === n || t.textContent.startsWith(n + ' '))) t.remove(); });
    const cl = sv.cloneNode(true), walk = (a, b) => { const cs = getComputedStyle(a); b.setAttribute('style', PP_CSS.map((k) => k + ':' + cs.getPropertyValue(k)).join(';')); for (let i = 0; i < a.children.length; i++) walk(a.children[i], b.children[i]); };
    walk(sv, cl); cl.removeAttribute('style'); cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); cl.setAttribute('width', 1000); cl.setAttribute('height', 1000);
    // (the round clip for spec icons lives in the page's shared defs: the picture gets its own copy)
    if (!cl.querySelector('#pclip')) cl.insertAdjacentHTML('afterbegin', '<defs><clipPath id="pclip" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath></defs>');
    await Promise.all([...cl.querySelectorAll('image')].map(async (im) => { const d = await ppData(ppArt(im.getAttribute('href'))); if (d) im.setAttribute('href', d); else im.remove(); }));
    return await ppImg(URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(cl)], { type: 'image/svg+xml' })));
  } finally { box.remove(); }
}
const ppMarkImg = (k) => ppImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-11 -11 22 22" width="44" height="44">' + gdzMarkSvg(k, 0, 0) + '</svg>'));
async function ppDraw(card, boss, diff) {
  const W = 1200, H = 675, S2 = 2, cv = document.createElement('canvas'); cv.width = W * S2; cv.height = H * S2; const g = cv.getContext('2d'); g.scale(S2, S2);
  await Promise.all(['800 28px "Barlow Semi Condensed"', '700 16px Barlow', '500 13px Barlow'].map((f) => document.fonts.load(f).catch(() => null)));
  g.fillStyle = '#12141b'; g.fillRect(0, 0, W, H);
  const M0 = 18, MS = H - M0 * 2, map = await ppMapImg(card.map); g.save(); g.beginPath(); g.roundRect ? g.roundRect(M0, M0, MS, MS, 12) : g.rect(M0, M0, MS, MS); g.clip(); g.fillStyle = '#0b0d12'; g.fillRect(M0, M0, MS, MS); if (map) g.drawImage(map, M0, M0, MS, MS); g.restore();
  const X0 = M0 * 2 + MS + 6, CW = W - X0 - 24, fit = (t, w) => { if (g.measureText(t).width <= w) return t; let s = t; while (s.length > 1 && g.measureText(s + '…').width > w) s = s.slice(0, -1); return s + '…'; };
  const wrap = (t, w) => { const out = []; let line = ''; for (const wd of String(t).split(' ')) { const tr = line ? line + ' ' + wd : wd; if (g.measureText(tr).width > w && line) { out.push(line); line = wd; } else line = tr; } if (line) out.push(line); return out; };
  const icons = new Map(); await Promise.all(card.legend.flatMap((G) => G.items).map(async (it) => { if (it.specIcon && !icons.has(it.specIcon)) icons.set(it.specIcon, await ppImg(await ppData('https://wow.zamimg.com/images/wow/icons/medium/' + it.specIcon + '.jpg'))); }));
  const MKI = new Map(); await Promise.all(PP_MKS.map(async (k) => MKI.set(GDZ_WM[k][1].replace(' (X)', ''), await ppMarkImg(k))));
  // (the right side at a scale: the phase chip (the site's quiet pill with the phase's colour dot), the title, then the legend: each
  // group's title with its colour, then its players in two columns (one when a job is long). Discord shows a pasted picture about
  // 550 px wide, so the type is as big as the space allows: a dry run at each size, the biggest that fits is drawn (Design studio, Oct 26))
  const FOOT = H - 58, side = (s, draw) => { const F = (px) => Math.round(px * s), D = (fn) => { if (draw) fn(); }; let lost = 0;
    const [phN, phC] = PP_PH[card.ph] || ['', '#888']; g.font = '700 ' + F(12) + 'px Barlow, sans-serif'; const chip = phN.toUpperCase() + (card.when ? '  ·  ' + card.when : ''), ch = F(20), cw = g.measureText(chip).width + F(28);
    D(() => { g.fillStyle = '#1b1f29'; g.strokeStyle = '#3a4150'; g.lineWidth = 1; g.beginPath(); g.roundRect ? g.roundRect(X0, 24, cw, ch, ch / 2) : g.rect(X0, 24, cw, ch); g.fill(); g.stroke();
      g.fillStyle = phC; g.beginPath(); g.arc(X0 + F(11), 24 + ch / 2, F(4), 0, Math.PI * 2); g.fill(); g.fillStyle = '#c9ced8'; g.fillText(chip, X0 + F(20), 24 + ch / 2 + F(4.3)); });
    let y = 24 + ch + F(30); g.font = '800 ' + F(25) + 'px "Barlow Semi Condensed", sans-serif'; g.fillStyle = '#ece8df';
    for (const l of wrap(card.title, CW).slice(0, 2)) { D(() => g.fillText(l, X0, y)); y += F(28); }
    g.font = '500 ' + F(11) + 'px Barlow, sans-serif'; g.fillStyle = '#7d8594'; D(() => g.fillText(fit(boss + ' · ' + diff, CW), X0, y - F(8))); y += F(10);
    for (const G of card.legend) { y += F(6); D(() => { g.fillStyle = G.color; g.beginPath(); g.roundRect ? g.roundRect(X0, y - F(10), F(10), F(10), 3) : g.rect(X0, y - F(10), F(10), F(10)); g.fill(); });
      g.font = '700 ' + F(15) + 'px Barlow, sans-serif'; g.fillStyle = '#ece8df'; D(() => g.fillText(fit(G.title, CW - F(16)), X0 + F(16), y)); y += F(4);
      if (G.sub) { g.font = '500 ' + F(12) + 'px Barlow, sans-serif'; g.fillStyle = '#98a0ad'; for (const l of wrap(G.sub, CW).slice(0, 2)) { y += F(15); D(() => g.fillText(l, X0, y)); } }
      const one = G.items.some((it) => it.job && it.job.length > 10) || G.items.length <= 2 && G.items.some((it) => it.any), cols = one ? 1 : 2, colW = (CW - (cols - 1) * 14) / cols, rh = F(25), ic0 = F(19); y += F(9);
      G.items.forEach((it, i) => { const x = X0 + (i % cols) * (colW + 14), yy = y + Math.floor(i / cols) * rh; if (yy + rh > FOOT) { lost++; return; } if (!draw) return;
        const ic = icons.get(it.specIcon); if (ic) { g.save(); g.beginPath(); g.arc(x + ic0 / 2, yy + ic0 / 2, ic0 / 2, 0, Math.PI * 2); g.clip(); g.drawImage(ic, x, yy, ic0, ic0); g.restore(); }
        const mi = it.job && MKI.get(it.job), jw = it.job ? (mi ? F(16) + 2 : (g.font = '700 ' + F(11.5) + 'px Barlow, sans-serif', g.measureText(it.job).width + 6)) : 0;
        g.font = (it.any ? 'italic ' : '') + '700 ' + F(15) + 'px Barlow, sans-serif'; g.fillStyle = it.color; g.fillText(fit(it.name, colW - ic0 - 8 - jw), x + ic0 + 6, yy + ic0 * 0.78);
        if (it.job) { if (mi) g.drawImage(mi, x + colW - F(16), yy + (ic0 - F(16)) / 2, F(16), F(16)); else { g.font = '700 ' + F(11.5) + 'px Barlow, sans-serif'; g.fillStyle = '#f3d48a'; g.fillText(it.job, x + colW - g.measureText(it.job).width, yy + ic0 * 0.76); } } });
      y += Math.ceil(G.items.length / cols) * rh + F(8); }
    if (draw) { g.fillStyle = '#2a2f3b'; g.fillRect(X0, FOOT, CW, 1); g.font = '500 ' + F(12) + 'px Barlow, sans-serif'; g.fillStyle = '#98a0ad'; wrap(card.foot || '', CW - 90).slice(0, 2).forEach((l, i) => g.fillText(l, X0, FOOT + F(16) + i * F(16)));
      g.font = '800 ' + F(14) + 'px "Barlow Semi Condensed", sans-serif'; g.fillStyle = '#e6b450'; g.fillText('DEBRIEF', W - 24 - g.measureText('DEBRIEF').width, H - 14); }
    return { y, lost }; };
  const s = [1.35, 1.25, 1.15, 1.05, 1].find((v) => { const r = side(v, false); return !r.lost && r.y <= FOOT + 4; }) || 1; side(s, true); cv._scale = s;
  return cv;
}

// (Download all: a plain zip of the pictures, stored as they are (PNGs are already packed), names in fight order)
const PP_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function ppZip(files) {
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  for (const f of files) { const nm = enc.encode(f.name), d = f.data; let c = 0xffffffff; for (let i = 0; i < d.length; i++) c = PP_CRC[(c ^ d[i]) & 255] ^ (c >>> 8); c = (c ^ 0xffffffff) >>> 0;
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, c, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, nm.length, true);
    const z = new DataView(new ArrayBuffer(46)); z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true); z.setUint32(16, c, true); z.setUint32(20, d.length, true); z.setUint32(24, d.length, true); z.setUint16(28, nm.length, true); z.setUint32(42, off, true);
    parts.push(new Uint8Array(h.buffer), nm, d); cen.push(new Uint8Array(z.buffer), nm); off += 30 + nm.length + d.length; }
  const cs = cen.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22)); e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cs, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, new Uint8Array(e.buffer)], { type: 'application/zip' });
}
// ---- the Pictures window: the markers (drag them; pick one for each mechanic), then every picture with Copy and Download
// (only what the window needs to work: the marker map's overlay and dragging, the mark pick's place, and which parts hide in the
// one-picture view. Every look rule for these classes is the Design studio's, in shell.html (one owner per thing, Oct 26))
function ppCss() {
  if (document.getElementById('pp-css')) return; const st = document.createElement('style'); st.id = 'pp-css';
  st.textContent = '#ppWin .pp-mkmap{position:relative}#ppWin .pp-mkmap .zbar,#ppWin .pp-mkmap .zctl,#ppWin .pp-mkmap .zkey,#ppWin .pp-mkmap .znorth{display:none!important}' +
    '#ppWin .pp-mklay{position:absolute;inset:0;pointer-events:none}#ppWin .pp-mkdot{position:absolute;transform:translate(-50%,-50%);pointer-events:auto;touch-action:none;cursor:grab}#ppWin .pp-mkdot.on{cursor:grabbing}' +
    '#ppWin .pp-mkpick{position:fixed;z-index:1001}' +
    '#ppWin:not(.pp-one) .pp-nav{display:none}#ppWin.pp-one .pp-intro,#ppWin.pp-one .pp-all,#ppWin.pp-one .pp-mkbox,#ppWin.pp-one .ds-ppnav,#ppWin.pp-one .pp-card:not(.pp-cur),#ppWin.pp-one .pp-cur .pp-ph{display:none}' +
    '.pj-pic img:not([src]){visibility:hidden}';
  document.head.appendChild(st);
}
// (one note's pictures, worked out once: who's who, the jobs and the cards at the raid lead's markers; each drawn picture is kept with
// them, so Plan redrawing its page or the window opening again doesn't draw twelve pictures again)
const PP_SETS = new Map();
function ppSet(r, u0) {
  const boss = r && r.item && r.item.boss; let N = { header: {}, reminders: [], lines: [] }; try { N = E.parseNote(noteResolve(u0.text)); } catch (e) { /* (an unreadable note draws nothing) */ }
  const hd = N.header || {}, diff = /heroic|15/i.test(String(hd.difficulty || '')) ? 'Heroic' : /mythic|16/i.test(String(hd.difficulty || '')) ? 'Mythic' : ((r && r.item.diff) || 'Mythic'), cf = boss && ppConf(boss, diff);
  if (!cf) return { boss, diff, cards: [] };
  const key = [boss, diff, u0.text, JSON.stringify([cf.marks, cf.uses]), store.get(NDZ_SPEC_KEY)].join('|'); if (PP_SETS.has(key)) return PP_SETS.get(key);
  const names = ndzNoteRoster(u0) || [...new Set(noteNames(noteResolve(u0.text)).map((x) => String(x).split('-')[0]))].concat(ndzIn(r).map(ndzPn)), P = ppWho(r, [...new Set(names)]);
  const set = { key, boss, diff, cf, cards: cf.C.cards(cf.C.read(N, P), cf.marks, cf.uses, P), pics: new Map() };
  set.pic = (cd) => { if (!set.pics.has(cd.id)) set.pics.set(cd.id, ppDraw(cd, boss, diff).then((cv) => ({ cv, url: cv.toDataURL('image/png') })).catch((e) => { console.warn('Picture plan:', e); return null; })); return set.pics.get(cd.id); };
  PP_SETS.set(key, set); if (PP_SETS.size > 4) PP_SETS.delete(PP_SETS.keys().next().value);
  return set;
}
// (a picture's name and its short instruction, from "Guillotine 1 (Soak on Moon)")
const ppSplit = (t) => { const m = /^(.*?)\s*\((.*)\)\s*$/.exec(t); return m ? [m[1], m[2]] : [t, '']; };
// (the raid lead moved a marker: the Jobs cards' small pictures are drawn again from the new spots)
const ppStale = () => document.querySelectorAll('.plb-rc[data-pj]').forEach((el) => { const p = el.querySelector(':scope > .pj-pics'); if (p) { if (p.dataset.mech) p.innerHTML = ''; else p.remove(); } el.classList.remove('pj-has', 'pj-3'); delete el.dataset.pj; }); /* (Plan's own empty row stays, emptied) */
// The window: every picture with Copy and Download, Download all and the Markers editor; or, from a Jobs card's small picture, one
// picture big (pp-one) with the ones before and after it and a way to all of them (Design studio's mock, Oct 26)
function ppOpen(r, u0, opt) {
  ppCss(); opt = opt || {}; let set = ppSet(r, u0), one = !!opt.one; const { boss, diff } = set;
  let box = $('#ppWin'); if (box) box.remove(); box = document.createElement('div'); box.id = 'ppWin'; box.className = 'ndz-wiz ndz-nv' + (one ? ' pp-one' : ''); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Pictures for Discord');
  document.body.appendChild(box); document.body.classList.add('ndz-modal');
  const close = () => { box.remove(); if (!$('#ndzWiz') && !$('#ndzGuide') && !$('#ndzNoteView') && !$('#ndzShot')) document.body.classList.remove('ndz-modal'); };
  const head = '<div class="ndz-whead"><span class="sub">Pictures for Discord</span><button class="ndz-ex" type="button" data-ppx aria-label="Close">✕</button></div>';
  if (!set.cf) { box.innerHTML = '<div class="ndz-wbox">' + head + '<h2>Pictures for Discord</h2><p class="sub">Pictures are ready for The Coiled Altar on Mythic so far. The other bosses come next.</p></div>'; box.querySelector('[data-ppx]').onclick = close; box.onclick = (e) => { if (e.target === box) close(); }; return; }
  box.innerHTML = '<div class="ndz-wbox ndz-shotbox pp-win">' + head + '<h2 class="pp-h2"></h2>' +
    '<div class="pp-nav"><span class="sub pp-navt"></span><button class="btn sm" type="button" data-ppprev></button><button class="btn sm" type="button" data-ppnext></button><button class="btn sm" type="button" data-ppallv></button></div>' +
    '<p class="sub pp-intro">One picture for each mechanic your note gives jobs for, with everyone on their spot. Copy one and paste it in Discord (Ctrl+V), or download it.</p>' +
    '<div class="pp-all"><button class="btn sm primary" type="button" data-ppcopyall disabled>Copy all</button><button class="btn sm" type="button" data-ppall disabled>Download all</button><span class="sub pp-allmsg">Copy all makes one picture of them all, ready to paste in Discord. Download all saves each one in a zip.</span></div>' +
    '<details class="pp-mkbox"><summary>Markers <span class="sub">Drag a marker to move it, right-click it to change the mark, and pick where each mechanic happens</span></summary><div class="pp-mk"><div class="pp-mkmap"></div><div class="pp-mkuse"></div></div></details>' +
    '<div class="pp-cards"></div></div>';
  box.querySelector('[data-ppx]').onclick = close; box.onclick = (e) => { if (e.target === box) close(); };
  let gen = 0, cur = Math.max(0, set.cards.findIndex((cd) => cd.id === opt.one));
  const host = box.querySelector('.pp-cards'), all = box.querySelector('[data-ppall]'), zipName = (cd, i) => ((i < 9 ? '0' : '') + (i + 1) + ' ' + cd.title).replace(/[\\/:*?"<>|]+/g, '') + '.png';
  // (one card's picture, from the kept drawings)
  const fill = async (i, my) => { const cd = set.cards[i], el = host.querySelector('.pp-card[data-i="' + i + '"]'); if (!el || el.dataset.ok) return; const p = await set.pic(cd); if (my !== gen) return;
    if (!p) { el.querySelector('.pp-pic').innerHTML = '<span class="sub">Couldn\'t draw this one.</span>'; return; } el.dataset.ok = '1';
    const file = ('Debrief - ' + boss + ' - ' + cd.title).replace(/[\\/:*?"<>|]+/g, '') + '.png';
    el.querySelector('.pp-pic').innerHTML = '<img class="ndz-shotimg" alt="' + esc(cd.title) + '" src="' + p.url + '">';
    el.querySelector('[data-ppdl]').onclick = () => { const a = document.createElement('a'); a.href = p.url; a.download = file; a.click(); };
    el.querySelector('[data-ppcp]').onclick = () => p.cv.toBlob(async (b) => { const m = el.querySelector('.pp-msg'); try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); m.textContent = '✓ Copied. Paste it in Discord.'; } catch (e) { m.textContent = 'Your browser didn\'t allow it: use Download.'; } }); };
  // (the heading, the one-picture line and its buttons, and which card is showing)
  const show = () => { const n = set.cards.length, cd = set.cards[cur], nm = (i) => ppSplit(set.cards[i].title)[0];
    box.querySelector('.pp-h2').textContent = one && cd ? cd.title : boss + ' · ' + diff;
    box.querySelector('.pp-navt').textContent = 'Picture ' + (cur + 1) + ' of ' + n + ' · ' + boss + ', ' + diff + (opt.from ? ' · from the ' + opt.from + ' job' : '');
    const pv = box.querySelector('[data-ppprev]'), nx = box.querySelector('[data-ppnext]'); pv.textContent = cur > 0 ? '‹ ' + nm(cur - 1) : '‹'; pv.disabled = cur <= 0; nx.textContent = cur < n - 1 ? nm(cur + 1) + ' ›' : '›'; nx.disabled = cur >= n - 1;
    box.querySelector('[data-ppallv]').textContent = 'All ' + n + ' pictures'; host.querySelectorAll('.pp-card').forEach((el) => el.classList.toggle('pp-cur', +el.dataset.i === cur)); if (one) fill(cur, gen); };
  // (Copy all is the Design studio's (your call, Oct 26: "I want your version of the copy all"): its handler makes the one big picture from
  // the finished pictures; the button here only waits until they're drawn)
  const copyAll = box.querySelector('[data-ppcopyall]');
  const draw = async () => { const my = ++gen; all.disabled = true; copyAll.disabled = true;
    if (!set.cards.length) { host.innerHTML = '<p class="sub">This note has no jobs a picture can show yet (soaks, orb carriers, kick lines, crowd control).</p>'; return; }
    host.innerHTML = set.cards.map((cd, i) => '<div class="pp-card" data-i="' + i + '" data-ph="' + (cd.ph >= 3 ? '3' : cd.ph >= 2.5 ? 'int' : cd.ph >= 2 ? '2' : '1') + '" data-when="' + esc(cd.when || '') + '" data-legend="' + esc(JSON.stringify(cd.legend.map((G) => ({ title: G.title, color: G.color, sub: G.sub || '', items: G.items.map((it) => ({ name: it.name, color: it.color, specIcon: it.specIcon, job: it.job || '', any: !!it.any })) })))) + '"><div class="pp-ph sub">' + esc(cd.title) + '</div><div class="pp-pic"><span class="sub">Drawing…</span></div><div class="pp-act"><span class="sub pp-msg"></span><button class="btn sm" type="button" data-ppdl>Download</button><button class="btn sm primary" type="button" data-ppcp>Copy</button></div></div>').join('');
    show(); if (one) return; for (let i = 0; i < set.cards.length; i++) { await fill(i, my); if (my !== gen) return; } all.disabled = false; copyAll.disabled = false; };
  box.querySelector('[data-ppprev]').onclick = () => { if (cur > 0) { cur--; show(); } };
  box.querySelector('[data-ppnext]').onclick = () => { if (cur < set.cards.length - 1) { cur++; show(); } };
  box.querySelector('[data-ppallv]').onclick = () => { one = false; box.classList.remove('pp-one'); draw(); };
  all.onclick = async () => { const m = box.querySelector('.pp-allmsg'); all.disabled = true; m.textContent = 'Packing the pictures…';
    try { const files = await Promise.all(set.cards.map(async (cd, i) => { const p = await set.pic(cd); return p && await new Promise((ok) => p.cv.toBlob((b) => b.arrayBuffer().then((a) => ok({ name: zipName(cd, i), data: new Uint8Array(a) })))); }));
      const a = document.createElement('a'); a.href = URL.createObjectURL(ppZip(files.filter(Boolean))); a.download = ('Debrief - ' + boss + ' - pictures').replace(/[\\/:*?"<>|]+/g, '') + '.zip'; a.click(); m.textContent = '✓ Saved ' + plural(files.filter(Boolean).length, 'picture') + ' in one zip.'; }
    catch (e) { m.textContent = 'Couldn\'t pack them: use each picture\'s Download.'; } all.disabled = false; };
  // (the raid lead changed a marker: the note's pictures are worked out again, here and on the Jobs cards)
  const redo = () => { set = ppSet(r, u0); ppStale(); draw(); };
  // (the marker editor: the room with the markers on it; drag one and every picture redraws; pick a marker for each mechanic)
  const mkDraw = () => { const c = ppConf(boss, diff), mhost = box.querySelector('.pp-mkmap'), k = gdzKit(boss, 1); k.boss('zj', 'Zul\'jan', 0, 0, 0); const mp = k.done({ title: '', focus: { x: 0, y: 0, r: 30 } });
    mhost.innerHTML = miniMap({ ...mp, wmarks: [], callouts: [], liveLeg: false }, new Map()) + '<div class="pp-mklay"></div>';
    const sv = mhost.querySelector('svg.zmap'), lay = mhost.querySelector('.pp-mklay'); if (!sv) return; const vb = sv.viewBox.baseVal, [x0, y0] = (sv.dataset.o || '0,0').split(',').map(Number), yd = +sv.dataset.yd || 1, cx = (mp.room.x0 + mp.room.x1) / 2, cy = (mp.room.y0 + mp.room.y1) / 2;
    const toPx = ([rx, ry]) => { const R = sv.getBoundingClientRect(), L = lay.getBoundingClientRect(); return [((cx + rx - x0) * yd - vb.x) / vb.width * R.width + R.left - L.left, ((-(cy + ry) - y0) * yd - vb.y) / vb.height * R.height + R.top - L.top]; };
    const toYd = (px, py) => { const R = sv.getBoundingClientRect(); const X = vb.x + (px - R.left) / R.width * vb.width, Y = vb.y + (py - R.top) / R.height * vb.height; return [Math.round((X / yd + x0 - cx) * 2) / 2, Math.round((-(Y / yd + y0) - cy) * 2) / 2]; };
    const dot = (m) => '<svg viewBox="-11 -11 22 22" width="26" height="26">' + gdzMarkSvg(m, 0, 0) + '</svg>', keep = (cc) => ppSave(boss, diff, { base: cc.base, marks: cc.marks, uses: cc.uses });
    lay.innerHTML = PP_MKS.filter((m) => c.marks[m]).map((m) => '<button type="button" class="pp-mkdot" data-mk="' + m + '" title="' + esc(GDZ_WM[m][1]) + ': drag to move, right-click to change the mark" aria-label="' + esc(GDZ_WM[m][1]) + '">' + dot(m) + '</button>').join('');
    const place = () => lay.querySelectorAll('.pp-mkdot').forEach((b) => { const [px, py] = toPx(ppConf(boss, diff).marks[b.dataset.mk]); b.style.left = px + 'px'; b.style.top = py + 'px'; });
    requestAnimationFrame(place); if (mhost._ro) mhost._ro.disconnect(); if (window.ResizeObserver) (mhost._ro = new ResizeObserver(() => place())).observe(mhost); /* (the dots follow the map when the window or phone turns) */
    // (right-click a marker (hold it on a phone): the eight marks in a row, this one lit; picking another swaps the two marks, so no mark
    // shows twice and nothing else moves, and a mechanic set on either mark stays on its spot (your call, Oct 26: "right clicking them lets
    // you change which mark it is"))
    const pick = (b) => { box.querySelectorAll('.pp-mkpick').forEach((x) => x.remove()); const a = b.dataset.mk, R = b.getBoundingClientRect();
      box.insertAdjacentHTML('beforeend', '<div class="pp-mkpick" role="menu" aria-label="Change this mark">' + PP_MKS.map((m) => '<button type="button" role="menuitem" data-mk="' + m + '"' + (m === a ? ' class="on"' : '') + ' title="' + esc(GDZ_WM[m][1]) + '" aria-label="' + esc(GDZ_WM[m][1]) + '">' + dot(m) + '</button>').join('') + '</div>');
      const pk = box.lastElementChild; pk.style.left = Math.max(8, Math.min(innerWidth - 320, R.left + R.width / 2 - 150)) + 'px'; pk.style.top = (R.bottom + 6 + 50 > innerHeight ? R.top - 50 : R.bottom + 6) + 'px';
      pk.onclick = (e) => { e.stopPropagation(); const q = e.target.closest('[data-mk]'); pk.remove(); if (!q || q.dataset.mk === a) return; const t = q.dataset.mk, cc = ppConf(boss, diff), pa = cc.marks[a];
        cc.marks[a] = cc.marks[t]; cc.marks[t] = pa; for (const u of Object.keys(cc.uses)) cc.uses[u] = cc.uses[u] === a ? t : cc.uses[u] === t ? a : cc.uses[u];
        keep(cc); mkDraw(); redo(); };
      setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!pk.contains(e.target)) { pk.remove(); document.removeEventListener('pointerdown', off, true); } }, true)); };
    lay.querySelectorAll('.pp-mkdot').forEach((b) => { b.oncontextmenu = (e) => { e.preventDefault(); pick(b); };
      b.onpointerdown = (e) => { if (e.button === 2) return; e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add('on'); const x0p = e.clientX, y0p = e.clientY; let moved = false, held = false;
        const hold = e.pointerType === 'touch' ? setTimeout(() => { held = true; b.classList.remove('on'); pick(b); }, 550) : 0;
        const move = (ev) => { if (held) return; if (!moved && Math.hypot(ev.clientX - x0p, ev.clientY - y0p) < 6) return; moved = true; clearTimeout(hold); const L = lay.getBoundingClientRect(); b.style.left = (ev.clientX - L.left) + 'px'; b.style.top = (ev.clientY - L.top) + 'px'; };
        const up = (ev) => { clearTimeout(hold); b.onpointermove = b.onpointerup = null; b.classList.remove('on'); if (held || !moved) return; const q = toYd(ev.clientX, ev.clientY), lim = 44; q[0] = Math.max(-lim, Math.min(lim, q[0])); q[1] = Math.max(-lim, Math.min(lim, q[1]));
          const cc = ppConf(boss, diff); cc.marks[b.dataset.mk] = q; keep(cc); place(); redo(); mkDraw(); };
        b.onpointermove = move; b.onpointerup = up; }; });
    const uses = box.querySelector('.pp-mkuse'), opt0 = (v) => '<option value=""' + (v ? '' : ' selected') + '>The spot shown (no marker)</option>' + PP_MKS.map((m) => '<option value="' + m + '"' + (v === m ? ' selected' : '') + '>' + esc(GDZ_WM[m][1]) + '</option>').join('');
    uses.innerHTML = '<div class="sub">Where each mechanic happens</div>' + c.C.uses.map(([id, label]) => '<label class="pp-use"><span>' + esc(label) + '</span><select data-use="' + id + '">' + opt0(c.uses[id]) + '</select></label>').join('') +
      '<div class="pp-mkbase"><button class="btn sm" type="button" data-ppreset' + (c.base === 'guide' && !c.saved ? ' disabled' : '') + '>Back to the guide\'s spots</button>' +
      (c.C.raid ? '<button class="btn sm" type="button" data-ppraid' + (c.base === 'raid' && !c.saved ? ' disabled' : '') + '>Use your raid\'s spots</button>' : '') + '</div>' +
      '<p class="sub">' + (c.base === 'raid' ? 'Started from where your raid stood in your own pulls.' : 'Started from the guide\'s spots.') + ' Drag a marker to move it; right-click it (hold it on a phone) to change which mark it is. Saved in this browser.</p>';
    uses.querySelectorAll('select[data-use]').forEach((s) => { s.onchange = () => { const cc = ppConf(boss, diff); cc.uses[s.dataset.use] = s.value; keep(cc); mkDraw(); redo(); }; });
    uses.querySelector('[data-ppreset]').onclick = () => { ppSave(boss, diff, { base: 'guide' }); mkDraw(); redo(); };
    const rb = uses.querySelector('[data-ppraid]'); if (rb) rb.onclick = () => { ppSave(boss, diff, { base: 'raid' }); mkDraw(); redo(); }; };
  box.querySelector('.pp-mkbox').addEventListener('toggle', (e) => { if (e.target.open) mkDraw(); });
  draw();
}
// (the Jobs cards on a boss's plan page: each card whose jobs have pictures gets them small, in a row under its assignments (a square
// crop of the map, the name and the short instruction under it), drawn when the card scrolls near; a tap opens that picture big.
// Plan leaves an empty last child div.pj-pics[data-mech] in each card for them; until it does, the row is added here. Plan's cards are
// untouched apart from that row and the class pj-has (Design studio's mock, Oct 26; your call: "a horizontal row under the assignments"))
let PP_IO = null;
function ppJobs() {
  const els = document.querySelectorAll('.bj-jobs .plb-rc:not([data-pj])'); if (!els.length) return;
  els.forEach((el) => { el.dataset.pj = '1'; const ch = el.querySelector('[data-noteboss][data-noteid]'), t = ((el.querySelector('.plb-rch b') || {}).textContent || '').replace(/^\s*\d+\s*·\s*/, '').trim(); if (!ch || !t) return;
    const note = ch.dataset.noteboss + '|' + ch.dataset.noteid, c = ndzDcNote(note); if (!c) return; const set = ppSet(c.r, c.u0); if (!set.cf || !set.cf.C.jobs) return;
    // (which pictures: by Plan's key for the card when it gives one, else by the card's title)
    let pics = el.querySelector(':scope > .pj-pics'); const mech = pics && pics.dataset.mech, byKey = mech && set.cf.C.mech && set.cf.C.mech[mech], m = !byKey && set.cf.C.jobs.find(([re]) => re.test(t));
    const ids = (byKey || (m ? m[1] : [])).filter((id) => set.cards.some((cd) => cd.id === id)); if (!ids.length) return;
    ppCss(); el.classList.add('pj-has'); if (!pics) { el.insertAdjacentHTML('beforeend', '<div class="pj-pics"></div>'); pics = el.lastElementChild; }
    pics.innerHTML = ids.map((id) => { const cd = set.cards.find((x) => x.id === id), [nm, ins] = ppSplit(cd.title);
      return '<button type="button" class="pj-pic" data-pj="' + id + '" data-note="' + esc(note) + '" data-job="' + esc(t) + '" aria-label="' + esc(cd.title + ': open it big') + '"><img alt=""><small>' + esc(nm) + (ins ? '<i>' + esc(ins) + '</i>' : '') + '</small></button>'; }).join('');
    // (a numbered picture sits beside its own numbered job (your call: "If there's numbered mechanics, like an order, line the image up
    // with the assignment next to it"): Guillotine 1 by the "Guillotine 1" row, Grim Guillotine 1 by "P3 Guillotine 1"; the rest stay
    // in the row under the jobs)
    const num = (s) => { const k = String(s).toLowerCase().replace(/\b(p\d|grim)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim(); return /\d$/.test(k) ? k : null; };
    const rows = [...el.querySelectorAll('.plb-rr')].filter((r) => r.querySelector('.plb-rl') && !/external|zephyr/i.test(r.querySelector('.plb-rl').textContent));
    pics._btns = [...pics.querySelectorAll('.pj-pic')]; pics._set = set;
    for (const b of pics._btns) { const k = num(ppSplit(set.cards.find((x) => x.id === b.dataset.pj).title)[0]), r = k && rows.find((q) => num(q.querySelector('.plb-rl').textContent) === k); if (r) r.appendChild(b); }
    el._pics = pics; if (!window.IntersectionObserver) { ppThumbs(pics); return; } /* (the card is watched, not its row, which is hidden when every picture went beside its job) */
    (PP_IO = PP_IO || new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { PP_IO.unobserve(e.target); ppThumbs(e.target._pics); } }), { rootMargin: '300px' })).observe(el); });
}
async function ppThumbs(pics) { const set = pics._set; for (const b of pics._btns || pics.querySelectorAll('.pj-pic')) { const cd = set.cards.find((x) => x.id === b.dataset.pj), p = cd && await set.pic(cd), im = b.querySelector('img'); if (p && im && im.isConnected) im.src = p.url; } }
// (a Pictures button beside every Copy for Discord button Plan shows, and beside the plan header's Copy for the game, opening the
// same note's pictures; and the Jobs cards' small pictures)
if (typeof document !== 'undefined') {
  const ppAdd = () => { if (!PP_ON()) return; document.querySelectorAll('[data-ndzdc],[data-ndzpcopy]').forEach((b) => { if (b.nextElementSibling && b.nextElementSibling.hasAttribute('data-ppnote')) return;
    b.insertAdjacentHTML('afterend', '<button class="btn' + (b.dataset.ndzpcopy ? '' : ' sm') + ' pp-btn" type="button" data-ppnote="' + esc(b.dataset.ndzdc || b.dataset.ndzpcopy) + '" data-tt="' + esc('<b>Pictures for Discord</b><br>One picture for each mechanic, with everyone on their spot.') + '">🖼 Pictures</button>'); });
    try { ppJobs(); } catch (e) { console.warn('Picture plan:', e); } };
  let ppT = 0; new MutationObserver(() => { if (!ppT) ppT = setTimeout(() => { ppT = 0; ppAdd(); }, 60); }).observe(document.documentElement, { childList: true, subtree: true }); /* (a few times a second at most; a timer, not a frame, so a tab that isn't painting still fills) */
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-ppnote]'); if (!b) return; e.preventDefault(); const c = ndzDcNote(b.dataset.ppnote); if (c) ppOpen(c.r, c.u0); });
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.pj-pic'); if (!b) return; e.preventDefault(); const c = ndzDcNote(b.dataset.note); if (c) ppOpen(c.r, c.u0, { one: b.dataset.pj, from: b.dataset.job }); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#ppWin')) { $('#ppWin').remove(); if (!$('#ndzWiz') && !$('#ndzGuide') && !$('#ndzNoteView') && !$('#ndzShot')) document.body.classList.remove('ndz-modal'); } });
}
