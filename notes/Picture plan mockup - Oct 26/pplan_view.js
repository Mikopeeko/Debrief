// TEST ONLY (mockup, never in main): a picture plan for The Coiled Altar Mythic. Each key moment is one of the guide's own maps,
// frozen at its key second and shown with the whole arena, with the note's players on it (class colours, spec icons) and the groups
// in a legend beside it.
(() => {
  /* (the site tidies the address bar on load, so this also reads the address the page was opened with) */
  if (!/[?&]pictureplan\b/.test(location.search + (((performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {}).name || ''))) return;
  // (the user's own NSRT note "Mythic plan, Oct 22", as jobs: the Plan chat's plan-coiled-altar-mythic-assignments.json, Oct 26)
  const NOTE = {
    src: 'From your note "Mythic plan, Oct 22"',
    players: [['Tyralien', 'Paladin', 'Protection', 'tank'], ['Vandagos', 'Warrior', 'Protection', 'tank'],
      ['Flëxørçïst', 'Paladin', 'Holy', 'healer'], ['Optt', 'Priest', 'Holy', 'healer'], ['Ashdknight', 'Monk', 'Mistweaver', 'healer'], ['Huservoker', 'Evoker', 'Preservation', 'healer'], ['Urgdragon', 'Evoker', 'Preservation', 'healer'],
      ['Zaffia', 'Rogue', 'Subtlety', 'melee'], ['Larryg', 'Warrior', 'Arms', 'melee'], ['Dashtoswirly', 'Demon Hunter', 'Havoc', 'melee'], ['Fourinches', 'Death Knight', 'Unholy', 'melee'],
      ['Kargaryen', 'Evoker', 'Augmentation', 'ranged'], ['Shockabunga', 'Shaman', 'Elemental', 'ranged'], ['Boltzzx', 'Mage', 'Arcane', 'ranged'], ['Earthday', 'Druid', 'Balance', 'ranged'], ['Schooty', 'Hunter', 'Beast Mastery', 'ranged'],
      ['Komo', 'Warlock', 'Demonology', 'ranged'], ['Jangokin', 'Druid', 'Balance', 'ranged'], ['Arsyn', 'Warlock', 'Affliction', 'ranged'], ['Volkovod', 'Hunter', 'Beast Mastery', 'ranged']],
    axes: [{ at: '0:48', soak: ['Schooty', 'Volkovod', 'Larryg', 'Boltzzx', 'Jangokin', 'Zaffia'], ext: 'Huservoker', zeph: 'Kargaryen' },
      { at: '2:13', soak: ['Tyralien', 'Vandagos', 'Schooty', 'Volkovod'], ext: 'Flëxørçïst', zeph: 'Urgdragon' }],
    grim: [{ at: '0:22', soak: ['Zaffia', 'Schooty', 'Volkovod', 'Boltzzx', 'Jangokin', 'Fourinches'], ext: 'Huservoker', zeph: 'Kargaryen' },
      { at: '1:26', soak: ['Schooty', 'Volkovod', 'Jangokin', 'Zaffia'], ext: 'Huservoker', zeph: 'Urgdragon' },
      { at: '3:06', soak: ['Dashtoswirly', 'Earthday', 'Kargaryen', 'Shockabunga', 'Arsyn', 'Komo', 'Optt', 'Huservoker', 'Urgdragon', 'Ashdknight'], ext: 'Urgdragon', zeph: 'Huservoker' }],
    // (the cooldowns the note stacks right after its "Push" at 2:45, when Zul'jan dies and the orbs blow up)
    rupture: [['2:48', 'Huservoker', 'Rewind'], ['2:48', 'Huservoker', 'Zephyr'], ['2:50', 'Fourinches', 'Anti-Magic Zone'], ['2:50', 'Larryg', 'Rallying Cry'], ['2:51', 'Dashtoswirly', 'Darkness']],
    kicks: [['Jangokin', 'Dashtoswirly', 'Fourinches', 'Kargaryen', 'Shockabunga', 'Zaffia'], ['Tyralien', 'Tyralien', 'Volkovod', 'Earthday', 'Arsyn', 'Komo']],
    curse: { unmarked: 'Komo', marked: 'Arsyn' },
    cc: ['Dashtoswirly', 'Ashdknight', 'Shockabunga', 'Larryg'], ccAt: 'Phase 2: 0:09, 0:45, 1:34, 2:10, 2:59. Phase 3: 0:58, 2:34, 3:22.',
    p3orbs: { purple: [['Cross', 'Schooty'], ['Square', 'Jangokin'], ['Triangle', 'Tyralien'], ['Diamond', 'Volkovod']], green: [['Star', 'Arsyn'], ['Skull', 'Komo'], ['Side', 'Shockabunga'], ['Side', 'Earthday']], helpers: ['Huservoker', 'Urgdragon', 'Dashtoswirly', 'Kargaryen'] },
    p1orbs: { purple: [['Cross', 'Boltzzx'], ['Square', 'Arsyn'], ['Triangle', 'Jangokin'], ['Diamond', 'Komo']], green: [['Star', 'Schooty'], ['Skull', 'Volkovod'], ['Side', 'Shockabunga'], ['Side', 'Earthday']], helpers: ['Huservoker', 'Urgdragon', 'Kargaryen', 'Dashtoswirly'] },
    inter: [['Cross', 'Boltzzx'], ['Triangle', 'Jangokin'], ['Diamond', 'Komo'], ['Square', 'Arsyn']],
    interCds: [['0:01', 'Huservoker', 'Stasis'], ['0:04', 'Kargaryen', 'Time Spiral'], ['0:14', 'Flëxørçïst', 'Avenging Wrath'], ['0:14', 'Ashdknight', 'Invoke Yu\'lon'], ['0:18', 'Optt', 'Divine Hymn'],
      ['0:24', 'Huservoker', 'Rewind'], ['0:27', 'Dashtoswirly', 'Darkness'], ['0:27', 'Larryg', 'Rallying Cry'], ['0:28', 'Fourinches', 'Anti-Magic Zone']],
  };
  const go = () => {
    const K = window.__ppK; if (!K || !document.body) return setTimeout(go, 200);
    const { GDZ_CA_M, GDZ_CA_AXES, GDZ_RAID, miniMap, E, esc, NDZ_SPECIC, gdzKit } = K;
    const ROLE = { t: 'tank', h: 'healer', m: 'melee', r: 'ranged' }, CLS = Object.fromEntries(Object.entries(E.CLASSES).map(([k, v]) => [v[0], [k, v[1]]]));
    const P = new Map(NOTE.players.map(([name, cls, spec, role]) => { const ck = CLS[cls][0], id = Object.keys(E.SPECS).find((i) => E.SPECS[i][0] === spec && E.SPECS[i][1] === ck);
      return [name, { name, cls, spec, role, color: CLS[cls][1], specIcon: NDZ_SPECIC[id] || null }]; }));
    // (a stand-in for someone the fight picks at random: a grey dot with a question mark)
    const ANY = (label) => ({ name: label, color: '#c9ced8', specIcon: 'inv_misc_questionmark', any: true });
    // (who stands in which of the guide's spots: the jobs first, then everyone else by role, so a healer takes a healer's spot)
    const seat = (fix) => { const S = { ...fix }, used = new Set(Object.values(fix)), left = [...P.keys()].filter((n) => !used.has(n)), free = GDZ_RAID.filter((s) => !(s in S));
      for (const s of free) { const i = left.findIndex((n) => P.get(n).role === ROLE[s[0]]); if (i >= 0) S[s] = left.splice(i, 1)[0]; }
      for (const s of free) if (!(s in S) && left.length) S[s] = left.shift();
      return S; };
    const icon = (n) => 'https://wow.zamimg.com/images/wow/icons/medium/' + n + '.jpg';
    // (one frozen picture of a guide map: its frame at T, the whole arena, the note's names on it, only the job players named, our tags and group labels)
    const shot = (mp, T, S, o) => {
      o = o || {}; const f = mp.frames.reduce((a, b) => (Math.abs(b.t - T) < Math.abs(a.t - T) ? b : a));
      const pts = f.pts.map((p) => (p.kind === 'player' && S[p.guid] ? { ...p, name: typeof S[p.guid] === 'string' ? S[p.guid] : S[p.guid].name } : p));
      const pm = new Map(); for (const v of Object.values(S)) { const x = typeof v === 'string' ? P.get(v) : v; if (x) pm.set(x.name, x); }
      const at = (ids, low) => { const q = pts.filter((p) => ids.includes(p.guid)); return q.length ? { x: q.reduce((a, p) => a + p.x, 0) / q.length, y: (low ? Math.min : Math.max)(...q.map((p) => p.y)) } : null; };
      const cx = mp.room ? (mp.room.x0 + mp.room.x1) / 2 : 0, cy = mp.room ? (mp.room.y0 + mp.room.y1) / 2 : 0; /* (a label can also be a spot in yards from the room's middle: { rx, ry }) */
      const calls = (o.labels || []).map(([ids, text, color, ink, dy, below]) => { const c = Array.isArray(ids) ? at(ids, below) : ids.rx != null ? { x: cx + ids.rx, y: cy + ids.ry } : ids; return c ? { t0: 0, t1: 1e9, text, x: c.x, y: below ? c.y - (dy == null ? 9 : dy) : c.y + (dy == null ? 5 : dy), color, ink: ink || '#fff' } : null; }).filter(Boolean);
      const cb = {}; for (const [g, l] of Object.entries(mp.cbars || {})) cb[g] = l.map((b) => ({ ...b, by: '' }));
      const out = { ...mp, frames: null, pts, t: T, ft: T, pauses: [], steps: [], callouts: calls, tags: (o.tags || []).map(([g, tx]) => [g, tx, null, null]), hl: Object.keys(S).filter((g) => (o.hl || []).includes(g)), good: [], goodAt: null, bad: [], badAt: null, cbars: cb,
        hlLabel: o.hlLabel || 'assigned in the note', playerLabel: 'Player (spec icon, class colour)', liveLeg: false };
      const keep = (o.named || []).map((g) => (typeof S[g] === 'string' ? S[g] : S[g] && S[g].name)).filter(Boolean);
      return '<div class="pp-mapw" data-keep="' + esc(keep.join('|')) + '">' + miniMap(out, pm) + '</div>';
    };
    const who = (n, job) => { const x = typeof n === 'string' ? P.get(n) : n; if (!x) return '';
      return '<li class="pp-p' + (x.any ? ' pp-q' : '') + (x.any || (job && job.length > 9) ? ' pp-any' : '') + '"><img src="' + icon(x.specIcon) + '" alt=""><b style="color:' + x.color + '">' + esc(x.name) + '</b>' + (job ? '<i>' + esc(job) + '</i>' : '') + '</li>'; };
    const grp = (title, color, list, sub) => '<div class="pp-g"><div class="pp-gh"><span class="pp-chip" style="background:' + color + '"></span>' + esc(title) + '</div>' + (sub ? '<div class="pp-gs">' + esc(sub) + '</div>' : '') + (list.length ? '<ul>' + list.join('') + '</ul>' : '') + '</div>';
    const card = (ph, title, map, legend, foot) => '<section class="pp-card"><div class="pp-hd"><span class="pp-ph">' + esc(ph) + '</span><h2>' + esc(title) + '</h2></div><div class="pp-bd"><div class="pp-map">' + map + '</div><div class="pp-leg">' + legend + '</div></div>' + (foot ? '<div class="pp-ft">' + esc(foot) + '</div>' : '') + '</section>';
    const R = '#f24824', PU = '#b65cff', GR = '#2fd15a', BL = '#5aa0ff', GO = '#e6b450', Q = '#c9ced8';
    const cards = [];
    // (your raid's marker spots, read from where your carriers dropped their orbs in your Oct 21 and Oct 22 pulls: the same spots every set)
    const MK = { cross: [-5, 30], triangle: [5, 29], square: [-4, -31], diamond: [7, -32], star: [2, 16], skull: [-2, -23] };
    // (each marker icon is drawn 4 yards further out than its spot, so the orb or player standing on it doesn't hide it)
    const marks = (k, which) => { for (const m of which || Object.keys(MK)) k.wmark(m, MK[m][0], MK[m][1] + (MK[m][1] > 0 ? 4 : -4)); return k; };

    // Phase 1 orbs on your markers: purples at the far end of each frontal's triangle (two north, two south), greens between them and the boss
    { const O = NOTE.p1orbs, k = marks(gdzKit('The Coiled Altar', 3)), fix = { t1: 'Vandagos', t2: 'Tyralien' }, put = new Set(['t1', 't2']), PS = { cross: 'r1', triangle: 'r2', square: 'r3', diamond: 'r4' };
      k.boss('zj', 'Zul\'jan', 0, 0, 0).at(0, 't1', 0, -5).at(0, 't2', 0, 6); /* (your pulls: the 1st Sever goes south at Vandagos, the 2nd north at Tyralien) */
      O.purple.forEach(([m, n], i) => { const mk = m.toLowerCase(), s = PS[mk], p = MK[mk], sx = p[0] < 0 ? -1 : 1; fix[s] = n; put.add(s);
        k.obj('p' + i, 'porb', 0, p[0], p[1]).ring({ on: 'p' + i, r: 3.5, fx: 'debuff', t0: 0, dur: 99, color: '#b65cff', cn: 'Purple orb\'s ring', label: false }).at(0, s, p[0] + sx * 6, p[1] + (p[1] > 0 ? 2 : -2)); });
      const GS = [MK.star, MK.skull, [-8, -18], [6, -18]], GSL = ['r5', 'r7', 'r6', 'm7'];
      O.green.forEach(([, n], i) => { const p = GS[i], s = GSL[i]; fix[s] = n; put.add(s); k.obj('g' + i, 'orb', 0, p[0], p[1]).at(0, s, p[0] + (p[0] <= 0 ? -3.5 : 3.5), p[1]); });
      O.helpers.forEach((n, i) => { const s = ['h1', 'h2', 'm5', 'm6'][i]; fix[s] = n; put.add(s); k.at(0, s, [-9, 9, -12, 12][i], [10, 10, -11, -11][i]); });
      const left = GDZ_RAID.filter((s) => !put.has(s)); k.at(0, left.filter((_, i) => i % 2 === 0), -17, 0, 4.5).at(0, left.filter((_, i) => i % 2 === 1), 17, 0, 4.5);
      k.cone({ from: 'zj', to: 't1', at: 1.2, r: 35 }).cone({ from: 'zj', to: 't2', at: 1.2, r: 35 }); /* (drawn in full just before they land, the frozen moment) */
      const mp = k.done({ title: 'Toxic Deluge on your markers', focus: { x: 0, y: 0, r: 30 } }), S = seat(fix), PG = Object.values(PS).concat(GSL);
      const map = shot(mp, 1, S, { hl: PG.concat(['t1', 't2']), named: PG, labels: [[{ rx: 25, ry: -15 }, '1st frontal', R, '#fff', 0], [{ rx: 25, ry: 13 }, '2nd frontal', R, '#fff', 0]] });
      cards.push(card('Phase 1 · 0:07, 0:50, 1:32, 2:15', 'Toxic Deluge (Purples on your markers)', map,
        grp('Purple carriers', PU, O.purple.map(([m, n]) => who(n, m))) + grp('Green carriers', GR, O.green.map(([m, n]) => who(n, m))) + grp('Helpers', GO, O.helpers.map((n) => who(n)), 'Move greens out of the purple carriers\' way.') +
          grp('Tanks', BL, [who('Vandagos', '1st frontal, south'), who('Tyralien', 'Taunts: 2nd, north')], 'From your pulls (your note has no tank lines).'),
        'The spots are where your carriers dropped their orbs on Oct 21 and 22. The south frontal goes first and takes square and diamond; the north one takes cross and triangle. Nothing may touch a purple ring.')); }

    // 1 and 2. Phase 1's two axes at the moon corner (the guide's spot): the note's soakers in the circle, its External and Zephyr players named
    NOTE.axes.forEach((A, i) => {
      const SL = i ? { Tyralien: 't2', Vandagos: 't1', Schooty: 'r5', Volkovod: 'r7' } : { Schooty: 'r5', Volkovod: 'r7', Larryg: 'm1', Boltzzx: 'r1', Jangokin: 'r2', Zaffia: 'm2' };
      const tg = i ? 'm3' : 'r3', ex = 'h1', ze = i ? 'h2' : 'r4', G = A.soak.map((n) => SL[n]), fix = { [tg]: ANY('Axe target'), [ex]: A.ext, [ze]: A.zeph }; A.soak.forEach((n) => (fix[SL[n]] = n));
      const S = seat(fix); GDZ_CA_AXES['pp' + i] = { tg, grp: G, tags: [], hl: [], title: '', pause: '' };
      const map = shot(GDZ_CA_M.axe({ soak: 'pp' + i }), 5.6, S, { hl: G.concat([tg, ex, ze]), named: [ex, ze], tags: [[ex, 'External'], [ze, 'Zephyr']], labels: [[G.concat(tg), 'Axe ' + (i + 1) + ' soak', R, '#fff', 7]] });
      cards.push(card('Phase 1 · ' + A.at, i ? 'Guillotine 2 (Five soak: tanks and Hunters)' : 'Guillotine 1 (Six soak in the moon corner)', map,
        grp('Axe ' + (i + 1) + ' soak (' + A.soak.length + ' + the target)', R, A.soak.map((n) => who(n))) + grp('On the axe target', GO, [who(A.ext, 'External'), who(A.zeph, 'Zephyr')]) +
          grp('Axe target', Q, [who(ANY('Whoever gets the axe'))], i ? 'Walks to the moon corner. The tanks bring the boss.' : 'Walks to the moon corner.'),
        i ? 'Exactly five. Nobody else goes in.' : 'Everyone else stays 40 yards away. Soakers walk out after it lands.'));
    });
    // 3. The end of phase 1: Zul'jan dies by the pools and the orbs blow up; the raid stacks in the note's cooldowns
    { const S = seat({ h1: 'Huservoker', m1: 'Fourinches', m2: 'Larryg', m3: 'Dashtoswirly', t1: 'Vandagos', t2: 'Tyralien' });
      const map = shot(GDZ_CA_M.p2stack(), 7.8, S, { hl: ['h1', 'm1', 'm2', 'm3'], labels: [[GDZ_RAID.filter((x) => x[0] !== 't'), 'Stack in the cooldowns', '#9a7bff', '#fff', 6]] });
      cards.push(card('Phase 1 ends · 2:48', 'Venom Rupture (Stack in the cooldowns)', map,
        grp('Raid cooldowns', '#9a7bff', NOTE.rupture.map(([t, n, sp]) => who(n, t + ' ' + sp))) + grp('Everyone', GO, [], 'Push at 2:45, then stack. A defensive when the orbs blow up.'),
        'Zul\'jan dies by the pools: every orb blows up, so the whole raid stacks inside the cooldowns.')); }
    // 5. Phase 2, Dreadmarch: the mind-controlled players walk to the square (the guide's spot); the note's crowd-control order frees them
    { const S = seat({ r5: ANY('Mind controlled'), m4: ANY('Mind controlled'), h2: ANY('Mind controlled'), m1: 'Dashtoswirly', h1: 'Ashdknight', r1: 'Shockabunga', m2: 'Larryg', t1: 'Vandagos' });
      const map = shot(GDZ_CA_M.ghosts(), 5.2, S, { hl: ['r5', 'm4', 'h2', 'm1', 'h1', 'r1', 'm2'], named: ['m1', 'h1', 'r1', 'm2'], tags: [['m1', 'CC 1'], ['h1', 'CC 2'], ['r1', 'CC 3'], ['m2', 'CC 4']], labels: [[['r5', 'm4', 'h2'], 'Stack on square', PU, '#fff', 9, true]] });
      cards.push(card('Phase 2 · from 0:09', 'Dreadmarch (Stack the mind controls on square)', map,
        grp('Crowd control, in order', PU, NOTE.cc.map((n, i) => who(n, ['1st', '2nd', '3rd', '4th'][i])), NOTE.ccAt) + grp('Mind controlled', Q, [who(ANY('Random players'))], 'They walk to the square marker. Break their shields there.'),
        'Freed players stand still and look at their ghost. The boss tank lines up Soul Sever so it hits the most ghosts.')); }
    // 4. Phase 2 adds: the note's two kick lines. It doesn't say which add each takes, so the line with the melee goes on the unmarked add
    { const L1 = NOTE.kicks[0], L2 = NOTE.kicks[1], S = seat({ m1: L1[0], m2: L1[1], m3: L1[2], m4: L1[3], m5: L1[4], m6: L1[5], t2: 'Tyralien', r1: 'Volkovod', r2: 'Earthday', r3: 'Arsyn', r4: 'Komo' });
      const mp = GDZ_CA_M.kicks(), ar = mp.frames[0].pts.find((p) => p.guid === 'ar'), am = mp.frames[0].pts.find((p) => p.guid === 'am');
      const map = shot(mp, 4.8, S, { hl: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 't2', 'r1', 'r2', 'r3', 'r4'], named: ['r3', 'r4'], tags: [['r3', 'Curse'], ['r4', 'Curse']],
        labels: [[{ x: am.x, y: am.y }, 'Kick line 1', BL, '#fff', 6], [{ x: ar.x, y: ar.y }, 'Kick line 2 · marked', GR, '#06140a', 6]] });
      cards.push(card('Phase 2', 'Spiritcackle (Kick every Wail of Terror)', map,
        grp('Kick line 1: the unmarked add', BL, L1.map((n, i) => who(n, 'Kick ' + (i + 1)))) + grp('Kick line 2: the marked add', GR, L2.map((n, i) => who(n, 'Kick ' + (i + 1)))) +
          grp('Curse of Tongues', '#8788EE', [who(NOTE.curse.unmarked, 'Unmarked add'), who(NOTE.curse.marked, 'Marked add')]),
        'The next kicker takes the next cast, even after the add teleports. Tyralien takes two kicks in a row, as the note has it.')); }
    // Phase 2 Gloombombs: two random ranged and two random melee; ranged bombs to the marked add, melee bombs to the unmarked one (the guide)
    { const S = seat({ r1: ANY('Ranged bomb'), r2: ANY('Ranged bomb'), m1: ANY('Melee bomb'), m2: ANY('Melee bomb'), t1: 'Vandagos', t2: 'Tyralien' });
      const mp = GDZ_CA_M.bombs(), ar = mp.frames[0].pts.find((p) => p.guid === 'ar'), am = mp.frames[0].pts.find((p) => p.guid === 'am');
      const map = shot(mp, 5.5, S, { hl: ['r1', 'r2', 'm1', 'm2'], labels: [[{ x: ar.x, y: ar.y }, 'Ranged bombs · marked add', GR, '#06140a', 9], [{ x: am.x, y: am.y }, 'Melee bombs · unmarked add', BL, '#fff', 9]] });
      cards.push(card('Phase 2', 'Gloombomb (Two bombs on each add)', map,
        grp('Gloombomb (random each set)', '#da3df2', [who(ANY('2 ranged players'), 'Marked add'), who(ANY('2 melee players'), 'Unmarked add')], 'Stand on opposite sides of your add, so the two blasts overlap on it and on nobody else.'),
        'Each add\'s shield needs two bombs. Kick the add as soon as the Gloombomb cast shows, so it stands still. Your note has no bomb lines; this is the guide.')); }
    // Intermission: the note's first fragment stops at 0:05, each soaker on their marker; everyone else on Zul'jan for Bloodlust
    { const k = marks(gdzKit('The Coiled Altar', 3), ['cross', 'triangle', 'square', 'diamond']), fix = { t1: 'Vandagos', t2: 'Tyralien' }, put = new Set(['t1', 't2']);
      const SO = { cross: ['r1', [-16, 46]], triangle: ['r2', [16, 46]], square: ['r3', [-10, -47]], diamond: ['r4', [12, -46]] };
      k.boss('zj', 'Zul\'jan', 0, 0, 0).at(0, 't1', -2, 3).at(0, 't2', 2, 3);
      NOTE.inter.forEach(([m, n], i) => { const mk = m.toLowerCase(), [s, from] = SO[mk], p = MK[mk]; fix[s] = n; put.add(s); k.at(0, s, p[0], p[1]);
        k.add('f' + i, 'Fragment of Malacrass', 0, p[0] + (from[0] - p[0]) * 0.5, p[1] + (from[1] - p[1]) * 0.5).link({ from: 'f' + i, to: s, t0: 0, t1: 99, color: '#c49bff', dash: true }); });
      k.at(0, GDZ_RAID.filter((s) => !put.has(s)), 0, -1, 7);
      const mp = k.done({ title: 'Intermission', focus: { x: 0, y: 0, r: 30 } }), S = seat(fix), G = ['r1', 'r2', 'r3', 'r4'];
      const map = shot(mp, 1, S, { hl: G, named: G, labels: [[{ rx: 0, ry: 9 }, 'Bloodlust on Zul\'jan', '#ff7a5c', '#fff', 0]] });
      cards.push(card('Intermission · 0:05', 'Fragments of Malacrass (Stop them at your marker)', map,
        grp('First stops, on your markers', PU, NOTE.inter.map(([m, n]) => who(n, m))) + grp('Raid cooldowns', '#9a7bff', NOTE.interCds.map(([t, n, sp]) => who(n, t + ' ' + sp))),
        'Fragments run to Zul\'jan. Every stop hits the whole raid, so stop a few at a time, then the big turn under the 0:27 cooldowns. Bloodlust, potions and every damage cooldown go here.')); }
    // 6. Phase 3 orbs: the note's four purple carriers build the diamond (the guide's shape); the off-tank aims the frontal through it
    { const O = NOTE.p3orbs, pu = { Schooty: 'r3', Jangokin: 'r4', Tyralien: 't2', Volkovod: 'h4' }, G = Object.values(pu), fix = { t1: 'Vandagos', m1: 'Arsyn', m2: 'Komo', m3: 'Shockabunga' };
      for (const [n, s] of Object.entries(pu)) fix[s] = n; const S = seat(fix);
      const map = shot(GDZ_CA_M.diamond(), 13.1, S, { hl: G, named: G, labels: [[['p0', 'p1', 'p2', 'p3'], 'Purple diamond', PU, '#fff', 8, true]] });
      cards.push(card('Phase 3 · 0:07, 0:48, 1:49', 'Toxic Deluge (Build the purple diamond)', map,
        grp('Purple carriers', PU, O.purple.map(([m, n]) => who(n, m))) + grp('Green carriers', GR, O.green.map(([m, n]) => who(n, m)), 'Line the greens up off to the side.') + grp('Helpers', GO, O.helpers.map((n) => who(n))),
        'Every purple apart, all inside the frontal. Tyralien takes the frontal and aims it through the diamond.')); }
    // 7. Phase 3 axes: three small maps in one picture (the guide's star, then square, then square)
    { const AT = [[35, -35], [35, 35], [35, 35]], WH = ['the star', 'the square', 'the square'], SP = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'm1', 'm2', 'm3', 'm4', 'h1', 'h2', 'h3', 'h4'];
      const maps = NOTE.grim.map((A, i) => { const home = (n) => { const r = P.get(n).role; return SP.filter((s) => s[0] === (r === 'healer' ? 'h' : r === 'melee' ? 'm' : r === 'tank' ? 't' : 'r')); };
        const fix = {}, used = new Set(['m7']); A.soak.forEach((n) => { const s = home(n).find((x) => !used.has(x)) || SP.find((x) => !used.has(x)); used.add(s); fix[s] = n; });
        const slots = Object.keys(fix); fix.m7 = ANY('Axe target'); const S = seat(fix); GDZ_CA_AXES['ppg' + i] = { tg: 'm7', grp: slots, tags: [], hl: [], title: '', pause: '' };
        return '<div class="pp-mini"><div class="pp-mt">Axe ' + (i + 1) + ' · ' + A.at + ' · ' + WH[i] + '</div>' + shot(GDZ_CA_M.axe({ soak: 'ppg' + i, at: AT[i] }), 5.6, S, { hl: slots.concat('m7'), labels: [[slots.concat('m7'), 'Axe ' + (i + 1), R, '#fff', 11, true]] }) +
          '<ul>' + A.soak.map((n) => who(n)).join('') + '</ul><div class="pp-gs">External: <b style="color:' + P.get(A.ext).color + '">' + esc(A.ext) + '</b> · Zephyr: <b style="color:' + P.get(A.zeph).color + '">' + esc(A.zeph) + '</b></div></div>'; });
      cards.push('<section class="pp-card pp-wide"><div class="pp-hd"><span class="pp-ph">Phase 3</span><h2>Grim Guillotine (Star, then square)</h2></div><div class="pp-three">' + maps.join('') + '</div><div class="pp-ft">These axes are magic: big externals on every target. Soakers walk 40 yards out after each one.</div></section>'); }

    // Every mechanic that needs a job or a spot, and where this plan covers it (a picture, or a line when there's no spot to draw)
    const ROWS = [
      ['Phase 1', 'Toxic Deluge (orbs)', 'Picture', 'Purple and green carriers on your markers', 'note+logs'],
      ['Phase 1', 'Sever (tank frontal)', 'In the orbs picture', 'Vandagos takes the south one, Tyralien taunts for the north one', 'logs+guide'],
      ['Phase 1', 'Guillotine 1 and 2', 'Pictures', 'Soakers, External and Zephyr', 'note'],
      ['Phase 1', 'Fangs of the Coiled Altar', 'Line', 'Stay out of the pools. From 1:25, stay in the lane between them.', 'guide'],
      ['Phase 1', 'Axegrinder', 'Line', 'Step away from rolling axes.', 'guide'],
      ['Phase 1', 'Venomfang', 'Line', 'Healers dispel it fast.', 'guide'],
      ['Phase 1 ends', 'Venom Rupture (the push)', 'Picture', 'Cooldowns at 2:48 to 2:51', 'note'],
      ['Phase 2', 'Dreadmarch', 'Picture', 'Crowd-control order, stack on square', 'note+guide'],
      ['Phase 2', 'Ghosts and Soul Sever', 'In the Dreadmarch picture', 'Look at your ghost. The boss tank lines up the frontal.', 'guide'],
      ['Phase 2', 'Spiteful Soulcoilers', 'Picture', 'Two kick lines and the curses', 'note'],
      ['Phase 2', 'Gloombomb', 'Picture', 'Two bombs on each add', 'guide'],
      ['Phase 2', 'Eternal Nightfall', 'Line', 'Save damage and break the shield before the cast ends.', 'guide'],
      ['Intermission', 'Fragments of Malacrass', 'Picture', 'First stops on your markers, cooldowns', 'note+logs'],
      ['Phase 3', 'Toxic Deluge (diamond)', 'Picture', 'Purple and green carriers', 'note'],
      ['Phase 3', 'Grim Guillotine 1 to 3', 'Picture', 'Soakers, External and Zephyr', 'note'],
      ['Phase 3', 'Dreadmarch again', 'In the Dreadmarch picture', 'Same order at 0:58, 2:34 and 3:22', 'note'],
      ['Phase 3', 'Defilement and Corrupted Toxin', 'Line', 'Stay off the ground. Tanks swap on the poison.', 'guide'],
      ['Phase 3', 'Gloombomb with no adds', 'Line', 'Run to the edge, away from the raid.', 'guide'],
    ];
    const FROM = { note: ['Your note', '#e6b450'], logs: ['Your logs', '#5aa0ff'], guide: ['Guide', '#8a93a6'] };
    cards.unshift('<section class="pp-card pp-chk"><div class="pp-hd"><span class="pp-ph">Every mechanic</span><h2>What needs a job or a spot</h2></div><div class="pp-tbl">' +
      ROWS.map(([ph, mech, how, what, from]) => '<div class="pp-row"><span class="pp-rph">' + esc(ph) + '</span><b>' + esc(mech) + '</b><span class="pp-how' + (how === 'Line' ? ' ln' : '') + '">' + esc(how) + '</span><span class="pp-what">' + esc(what) + '</span><span class="pp-from">' +
        from.split('+').map((x) => '<i style="border-color:' + FROM[x][1] + ';color:' + FROM[x][1] + '">' + FROM[x][0] + '</i>').join('') + '</span></div>').join('') + '</div></section>');

    const css = '#pp{position:fixed;inset:0;z-index:2147483000;overflow:auto;background:#0b0d12;color:#e8eaf0;font:14px/1.45 system-ui,"Segoe UI",sans-serif;padding:24px 16px 60px}' +
      '#pp .pp-top{max-width:1180px;margin:0 auto 18px}#pp h1{font-size:26px;margin:0 0 4px}#pp .pp-src{color:#9aa3b2;margin:0 0 10px}' +
      '#pp .pp-auto{display:flex;gap:10px;flex-wrap:wrap}#pp .pp-auto div{flex:1 1 320px;background:#141821;border:1px solid #262c38;border-radius:10px;padding:10px 12px}#pp .pp-auto b{display:block;margin-bottom:2px}' +
      '#pp .pp-card{max-width:1180px;margin:0 auto 22px;background:#12151c;border:1px solid #262c38;border-radius:16px;padding:16px 18px 12px;box-shadow:0 6px 24px rgba(0,0,0,.35)}' +
      '#pp .pp-hd{display:flex;align-items:center;gap:10px;margin-bottom:10px}#pp .pp-hd h2{font-size:20px;margin:0}#pp .pp-ph{background:#e6b450;color:#1a1405;font-weight:800;font-size:12px;letter-spacing:.04em;text-transform:uppercase;border-radius:999px;padding:3px 10px;white-space:nowrap}' +
      '#pp .pp-bd{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(260px,1fr);gap:18px;align-items:start}#pp .pp-map{min-width:0}#pp .pp-map svg{width:100%;height:auto;display:block;border-radius:10px}' +
      '#pp .mlo{display:none}#pp .zwrap,#pp svg.zmap{max-width:none!important}#pp .pp-map .sub,#pp .pp-mini .sub,#pp .zbar,#pp .zctl,#pp .zkey,#pp .znorth{display:none!important}#pp .pp-any{grid-column:1/-1}' +
      '#pp .pp-g{background:#171b24;border:1px solid #262c38;border-radius:12px;padding:10px 12px;margin-bottom:10px}#pp .pp-gh{font-weight:800;font-size:15px;display:flex;align-items:center;gap:8px}#pp .pp-chip{width:12px;height:12px;border-radius:4px;display:inline-block}' +
      '#pp .pp-gs{color:#aab2c0;margin-top:3px}#pp ul{list-style:none;margin:6px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:4px 10px}#pp .pp-p{display:flex;align-items:center;gap:6px;min-width:0;white-space:nowrap}' +
      '#pp .pp-p img{width:20px;height:20px;border-radius:5px;border:1px solid #000;flex:none}#pp .pp-p b{font-weight:700;overflow:hidden;text-overflow:ellipsis}#pp .pp-p i{font-style:normal;color:#f3d48a;font-weight:700;font-size:12px;margin-left:auto;padding-left:4px}' +
      '#pp .pp-q b{color:#c9ced8!important;font-style:italic}#pp .pp-ft{color:#aab2c0;border-top:1px solid #222834;margin-top:10px;padding-top:8px}' +
      '#pp .pp-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}#pp .pp-mini .pp-mt{font-weight:800;margin-bottom:6px}#pp .pp-mini ul{grid-template-columns:1fr 1fr}#pp .pp-mini .pp-gs{margin-top:6px}' +
      '#pp .pp-row{display:grid;grid-template-columns:110px 230px 180px minmax(0,1fr) auto;gap:10px;padding:7px 4px;border-top:1px solid #222834;align-items:center}#pp .pp-row:first-child{border-top:0}' +
      '#pp .pp-rph{color:#9aa3b2;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}#pp .pp-how{font-weight:700;color:#2fd15a}#pp .pp-how.ln{color:#aab2c0}#pp .pp-what{color:#cfd4de}' +
      '#pp .pp-from i{font-style:normal;font-size:11px;font-weight:800;border:1px solid;border-radius:999px;padding:1px 8px;margin-left:4px;white-space:nowrap}' +
      '@media (max-width:820px){#pp .pp-bd,#pp .pp-three{grid-template-columns:1fr}#pp .pp-row{grid-template-columns:1fr 1fr}}';
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const box = document.createElement('div'); box.id = 'pp';
    box.innerHTML = '<div class="pp-top"><h1>The Coiled Altar · Mythic · Picture plan</h1><p class="pp-src">Mockup. ' + esc(NOTE.src) + '. Each picture is one moment of the fight.</p>' +
      '<div class="pp-auto"><div><b>Automatic</b>Names, class colours, spec icons and every group come straight from your note. Your markers\' spots come from your own pulls; the other spots are the guide\'s maps.</div>' +
      '<div><b>Not automatic</b>Axe targets, mind controls and bombs are random, so they show as a grey ?. Your note doesn\'t say which kick line takes which add, so the line with the melee gets the unmarked one.</div></div></div>' + cards.join('');
    document.body.appendChild(box); document.querySelectorAll('.tour').forEach((e) => e.remove());
    // (names only for the players named on purpose (a job tag); a group's names stay in the legend, so a soak circle isn't a pile of names)
    box.querySelectorAll('.pp-mapw').forEach((w) => { const keep = w.dataset.keep ? w.dataset.keep.split('|') : [];
      w.querySelectorAll('text.mlp').forEach((t) => { if (!keep.some((n) => t.textContent === n || t.textContent.startsWith(n + ' '))) t.remove(); }); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(go, 300)); else setTimeout(go, 300);
})();
