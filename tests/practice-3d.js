// The practice game's 3D view (Nov 15, Flex picked 3D for Ula'tek Mythic phase 1, "theres nothing else like this out there", after the mock in
// notes/Practice game - 3D mock.html). src/practice3d.js draws the same fight as the 2D map in three.js, loaded from a CDN only when 3D is picked.
// This fails if:
//  1. three.js isn't pinned to one exact version on jsdelivr, unpkg or cdnjs, or it loads with the page (a script tag, or a pg3dLoad() call
//     anywhere but practice.js's 2D | 3D switch), or build.ps1 stops checking practice3d.js or putting it in after practice.js;
//  2. a failed load doesn't fall back to 2D: the loader keeps the failed try (so the next click can't try again), the switch's catch doesn't
//     put 2D back and say so, a crash while drawing doesn't go back to 2D, or closing the game leaves the 3D view running;
//  3. a 3D shape isn't where the hit code hits: a coil soak's radius isn't s.r, the bubble isn't the hit code's 10 yards round the Wretch's live
//     spot (G.wr), the tail's sweep isn't th.r, her reach isn't the hit code's 5 at wr.p, a landing egg isn't its 4, an impact isn't m.r, the
//     beam doesn't go to b.tank (else the off tank), or a wave's floor strip isn't exactly practice.js's inWave area (her waves, the beam's
//     waves, the small tails', a wave without crescents, and a ring: every point a ring hits is inside the drawn ring);
//  4. (the graphics pass, Nov 15, Flex: "improve the graphics a bit across the whole thing") the nameplates go back to a pile of names: a raider
//     far from you who isn't in your soak group or carrying near you still shows a name, a raider next to you, a soak mate across the stone while
//     your coil is up or a carrier near you shows none, you have no nameplate, far plates aren't fainter, or raider names are plain labels again;
//  5. the hint (practice.js hintNow) isn't drawn: no arrow at your feet pointing to hint().T, no "Go here · N yd" ring at it, or an arrow when
//     hint() gives nothing;
//  6. the spell effects lose their shapes: no spectral coil over a coil soak (and its flash after the slam), no rock dropping for Falling Debris,
//     no blob shadow under a falling egg, she doesn't rear and bite for Mother's Wrath, no splash when she surfaces, her tail doesn't slam;
//  7. drawing makes new three.js objects (a `new T.` in put or draw1), or a geometry, material or texture is made without keep() (so closing
//     the game wouldn't free it);
//  8. (the review of the graphics pass, Nov 15, the 0:39, 0:41, 0:48, 0:57 and 1:27 pictures) the words pile up again: the soak and bubble
//     labels float high over their circles into the HUD's call-outs, a label on a call-out isn't moved below it (or hidden if it only names a
//     creature: pg3dHud), names aren't capped at four besides yours or a name sits on a label (pg3dPick), every add gets its own label (nine
//     "Rawling" in a heap) instead of one per pack near you, a soak mate already in the circle still shows a name, or the "Ula'tek" label is
//     back under the boss bar; her eyes, fangs and mouth stay solid while she's faded, the faded tail shows every overlapping part (no depth
//     twins), her head is back up behind the boss bar or the neck's open end hangs under her jaw, the splash's light column is tall and bright
//     again, or a wave's strip has no red border drawn over the wave;
//  9. (Nov 15, Flex: "Maybe the platform could have an actual texture similar to the platform in the game?") the platform is plain tiles
//     again: its top or its side walls lack a canvas-drawn colour map and normal (or bump) map from pg3dStoneDraw, a texture loads from an
//     address (or pg3dStoneDraw needs more than a canvas to draw), the stone is drawn more than once or while drawing frames, its textures or
//     canvases aren't freed on close (keep()), the normal map is inside out, or the carving doesn't line up with the octagon (pg3dStonePlan:
//     its outline isn't PG_UL.onPlat's, a slab, chip, crack, knot or fan is off the stone, a panel sits in the rim's band, the medallion isn't
//     in the middle, or the texture doesn't span the plan with the stone's middle at its middle);
// 10. (the review of the stone's pictures, Nov 15: 0:30, 0:39, 0:41, 0:48, 0:57, 2:30) a carved mark looks like a floor marker again: a mark on
//     the stone glows at more than 30% of the shader's venom glow (the green corner inlays read as a ">" by the gold hint arrow and the "Go here"
//     ring, the serpent's eyes as arrowheads either side of you), a glowing line is under 0.1 yards wide (a dotted green dash that flickers, like
//     a beam out from under you), the stone's own colours glow, the stone isn't teal (olive under the warm light, not the room's sea-green), or
//     the slate panels aren't a separate blue.
// 11. (Nov 15, Flex: "the attack doesnt look like its attacking ... This should look/feel like youre playing the game(kind of) ... I dont want
//     it anything fancy, just familiar") attacks can't be seen in 3D: a ranged hit 0.1 s old has no bolt between you and your target at about
//     hand height (2.4), or it bursts before the bolt gets there; 0.4 s after it there is no impact on the target; a healer's bolt isn't its
//     own colour; a melee hit has no slash by you facing the target, or throws a bolt, or makes no spark; you don't lean into a hit; your target
//     has no red circle under it as in WoW (or two, or the old white one too, or it covers the add's red health arc, or it no longer shows
//     out of range by turning dashed); or put() doesn't draw the bolt, the impact or the slash.
// 12. (Nov 16, Flex: "The interupts are impossible to track/see. The monsters should have cast bars over their heads", then "remember this is
//     intended to be training wheels") no cast bar over a caster you can kick: the bar's words aren't "Kick (E)" / "Get closer" on your kick (gold
//     frame), the spell's name on someone else's (amber), "Interrupted" in red after a kick, or they have a number in them; a part's castBars aren't
//     passed on as 'cast' shapes; put() doesn't draw them, or draws them unpooled, every frame, off the caster's head, too small or too wide to read,
//     never freed, or under the labels and names.
// contradictions.js runs it on every build (and `node tests/practice-3d.js` on its own). 1 to 3 fail on 9e8d89f9, the game before the 3D view;
// 4 to 7 fail on a79ac9bd, the 3D view before the graphics pass; 8 fails on 47da0826, the graphics pass before its review; 9 fails on
// 18efba7b, the plain grey tiles; 10 fails on 9051ebd6, the stone before its review; 11 fails on 44673a75, the attacks before they showed in 3D;
// 12 fails on 3cf6c8e1, the game before its cast bars.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function practice3d(say, H) {
  const bad = (m) => say('Practice game 3D', 'the 3D view', m);
  const SRC = path.join(__dirname, '..', 'src'), rd = (f) => { try { return fs.readFileSync(path.join(SRC, f), 'utf8').replace(/\r\n/g, '\n'); } catch (e) { return null; } };
  const P3 = rd('practice3d.js'), PJ = rd('practice.js'), GJ = rd('guides.js') || '', SH = rd('shell.html') || '', UI = rd('ui.js') || '', BP = rd('build.ps1') || '';
  if (!P3) { bad('src/practice3d.js is missing: the practice game has no 3D view'); return Promise.resolve(); }
  if (!PJ) { bad('src/practice.js is missing'); return Promise.resolve(); }
  H = H || require('./site-helpers.js');
  const grab = (n, src) => { try { return H.grab(n, src); } catch (e) { bad('could not read ' + n + ' (' + e.message + ')'); return null; } };
  // (Nov 15: the carved stone platform took away the old floor tiles, "slab", that phase 2's 3D kit is still handed; phase 2's 3D stopped loading with
  //  "slab is not defined". Every name handed to pg3dP2 must be declared in the 3D view)
  { const k = /pg3dP2\(\{([^}]*)\}\)/.exec(P3); if (k) k[1].split(',').map((x) => x.trim()).filter((x) => /^[A-Za-z_]\w*$/.test(x)).forEach((n) => {
    if (!new RegExp('(?:\\b(?:const|let|var)\\s+|,\\s*)' + n + '\\s*=').test(P3)) bad('phase 2\'s 3D kit is handed "' + n + '", which the 3D view no longer declares, so phase 2\'s 3D stops loading (' + n + ' is not defined)'); }); }
  // (Flex, Nov 15: phase 2's side ledges should be "some kind of rocky tile, nothing fancy": rows of stone tiles that add up to the full width and wrap, so
  //  the floor repeats without a seam; not the old four flat grey squares)
  { const m = /const slab = A\.P2 \? ctex\(canvas\(512, 512,[\s\S]*?\), true\) : null;/.exec(P3);
    if (!m || !/for \(const o of \[-512, 0, 512\]\)/.test(m[0]) || !/g\.clip\(\)/.test(m[0]) ||!/x = \(x \+ w\) % 512/.test(m[0]) || /g\.fillRect\(i \* 128 \+ 3, j \* 128 \+ 3, 122, 122\)/.test(P3)) bad('phase 2\'s side ledges aren\'t rocky tiles that wrap without a seam (Flex, Nov 15)'); }
  // (Main, Nov 15, at 0:42 in 3D: the "2D | 3D" switch under the minimap was half hidden: her tail showed through it and a name sat on its words. The switch is
  //  solid and on top, and the 3D labels and names keep out of the minimap's corner)
  { const vw = /\.pg-vw \{([^}]*)\}/.exec(PJ); if (!vw || !/z-index: ?([6-9]|\d\d)/.test(vw[1]) || !/background: ?#[0-9a-f]{3,6}\b/i.test(vw[1])) bad('the "2D | 3D" switch isn\'t solid and on top (z-index 6 or more and a solid background): the 3D picture shows through it');
    // (Nov 15, the raider-style screen: her boss frame, your Mistakes and the boss-mod bars joined that corner and the left side, so the labels keep out of them too)
    { const m = /const CRN = \[([^\]]*)\]\.map\(/.exec(P3); if (!m || ['.pg-mini', '.pg-vw', '.pg-mis', '.pg-bossf', '.pg-timers'].some((c) => !m[1].includes("'" + c + "'"))) bad('the 3D labels don\'t keep out of the boss frame, Mistakes and the boss-mod bars (the raider-style screen, Nov 15)'); }
    if (!/for \(let i = 0; i < CRN\.length; i\+\+\)[^\n]*BX\.push|BX\.push\(B\); \} \};/.test(P3)) bad('the 3D labels no longer keep out of the minimap and the "2D | 3D" switch'); }

  // 1. one exact version, an allowed host, loaded on demand
  const m = /const PG3D_THREE = '([^']+)'/.exec(P3);
  if (!m) bad('practice3d.js no longer says where three.js comes from (const PG3D_THREE)');
  else if (!/^https:\/\/(cdn\.jsdelivr\.net\/npm\/three@|unpkg\.com\/three@|cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/)\d+\.\d+\.\d+\/[\w./-]+\.js$/.test(m[1])) bad('three.js must come from one exact version on jsdelivr, unpkg or cdnjs, not ' + m[1]);
  if (/<script[^>]*three(\.min)?\.js/i.test(SH) || /three@\d|three\.js\/\d/.test(UI + PJ + GJ)) bad('three.js loads with the page (a script tag, or its address outside practice3d.js): it must load only when 3D is picked');
  const own = (P3.match(/pg3dLoad\(\)/g) || []).length; if (own) bad('practice3d.js calls pg3dLoad() itself (' + own + ' time(s)): only the 2D | 3D switch may load three.js');
  { const n = (PJ.match(/pg3dLoad\(\)/g) || []).length, a = PJ.indexOf('const view = (on) =>'), b = a < 0 ? -1 : PJ.indexOf('\n  vw.onclick', a), at = PJ.indexOf('pg3dLoad()');
    if (n !== 1 || a < 0 || b < 0 || at < a || at > b) bad('practice.js must load three.js in one place, the switch (view): it has ' + n + ' call(s)' + (a < 0 ? ' and no view()' : '')); }
  if (!BP.includes("'practice3d.js'") || !BP.includes("(& $read 'practice.js') + \"`n\" + (& $read 'practice3d.js')")) bad('build.ps1 no longer checks src/practice3d.js or puts it into the page right after practice.js');

  // 2. a failed load goes back to 2D and says so; the next click tries again; a crash while drawing and closing the game end the 3D view
  { const view = PJ.slice(PJ.indexOf('const view = (on) =>'), PJ.indexOf('\n  vw.onclick')), off = (/const off3d = \(why\) => \{[^\n]*/.exec(PJ) || [''])[0];
    if (!/\.catch\([^\n]*off3d\('[^\n]*2D/.test(view)) bad('when three.js can\'t load, the switch no longer goes back to 2D with a message (view\'s catch must call off3d with a line that says 2D)');
    if (!off.includes('v3 = null') || !off.includes("classList.remove('pg3')") || !/if \(why[^)]*\) say\(why/.test(off)) bad('off3d no longer drops the 3D view, shows the 2D map again and says why');
    if (!/fail: \(e\) => \{[^\n]*off3d\('/.test(PJ) || !/draw\(G\.t\); if \(v3\) \{ miniMap2\(G\.t\); return; \}/.test(PJ)) bad('a crash in the 3D view no longer puts the 2D map back in the same frame');
    if (!/const close = \(\) => \{[^\n]*v3\.dispose\(\)/.test(PJ)) bad('closing the game leaves the 3D view (and its WebGL) running');
    if (!/view\(true\); \/\* \(Flex, Nov 15: 3D only/.test(PJ) || !/\.pg-vw button\[data-v="2"\] \{ display: none; \} \.pg\.pg3 \.pg-vw \{ display: none; \}/.test(PJ)) bad('a part still opens in 2D or shows the 2D | 3D switch (Main\'s playtest, Nov 15: Flex said 3D only)'); }
  const loads = (mode) => new Promise((done) => { const win = {}, doc = { head: { appendChild: (s) => { s.parentNode = doc.head; setImmediate(() => { if (mode === 'ok') { win.THREE = { REVISION: '149', WebGLRenderer: function () {} }; s.onload(); } else s.onerror(); }); }, removeChild: (s) => { s.parentNode = null; } }, createElement: () => ({}) };
    const code = [grab('PG3D_THREE', P3), grab('PG3D_LIB', P3), grab('pg3dLoad', P3)]; if (code.some((x) => !x)) { done(null); return; }
    const ctx = vm.createContext({ window: win, document: doc, setTimeout, clearTimeout, Promise, Error });
    vm.runInContext(code.join('\n') + '\nthis.load = pg3dLoad; this.lib = () => PG3D_LIB;', ctx);
    const p = ctx.load(); p.then(() => setImmediate(() => done({ ok: true, lib: ctx.lib(), win })), (e) => setImmediate(() => done({ ok: false, e, lib: ctx.lib(), again: ctx.load() !== p }))); });
  const loadP = Promise.all([loads('fail'), loads('ok')]).then(([f, o]) => {
    if (!f || !o) return;
    if (f.ok) bad('a three.js that fails to load still counts as loaded');
    else { if (f.lib) bad('a failed three.js load is kept, so a second click can\'t try again'); if (!f.again) bad('after a failed load, the next pick doesn\'t try again'); }
    if (!o.ok || !o.lib) bad('a three.js that loads isn\'t handed to the 3D view (or isn\'t kept for the next time)'); }).catch((e) => bad('the load check crashed: ' + e.message));

  // 3. the shapes against the hit code: the same radii as check(), the same wave areas as inWave()
  const code = [grab('PG_UL', PJ), grab('GDZ_ROLE', GJ), grab('GDZ_RAID', GJ), grab('pg3dShapes', P3)];
  const iw = grab('inWave', PJ), chk = (/const check = \(t0, t\) => \{[\s\S]*?G\.adds = G\.adds\.filter/.exec(PJ) || [''])[0];
  if (code.some((x) => !x) || !iw) return loadP;
  const ctx = vm.createContext({ Math, Object, Array });
  try { vm.runInContext(code.join('\n') + '\nconst PR = 0.7;\n' + iw + '\nthis.shapes = pg3dShapes; this.inWave = inWave; this.PG_UL = PG_UL;', ctx); } catch (e) { bad('pg3dShapes or inWave no longer runs by itself: ' + String(e.message).slice(0, 140)); return loadP; }
  // (the hit code's own radii, read out of check(): the bubble, her reach, a landing egg)
  const num = (re, what) => { const q = re.exec(chk); if (!q) { bad('check() no longer has ' + what + ' as the 3D test reads it'); return null; } return +q[1]; };
  const R_BUB = num(/Math\.hypot\(x - c\.x, y - c\.y\) > (\d+(?:\.\d+)?)\) \{ deb\('fester'/, 'the bubble\'s radius'), R_WR = num(/Math\.hypot\(x - wr\.p\[0\], y - wr\.p\[1\]\) <= (\d+(?:\.\d+)?) \+ PR/, 'her reach\'s radius'), R_EGG = num(/Math\.hypot\(x - e\.x, y - e\.y\) <= (\d+(?:\.\d+)?) \+ PR \* 0\.5\) mistake\('impact', 'An egg landed/, 'a landing egg\'s radius');
  if (!/Math\.hypot\(x - s\.x, y - s\.y\) <= s\.r/.test(chk) || !/dd <= th\.r/.test(chk) || !/Math\.hypot\(x - m\.x, y - m\.y\) <= m\.r \+ PR \* 0\.5/.test(chk)) bad('check() no longer hits by s.r (soaks), th.r (the sweep) and m.r (impacts) as the 3D view draws them');
  const cresOf = (w) => { const n = Math.max(1, Math.round(w / 7)), wd = w / n, out = []; for (let i = 0; i < n; i++) out.push([-w / 2 + wd * i + (i ? 0.6 : 0), -w / 2 + wd * (i + 1) - (i < n - 1 ? 0.6 : 0)]); return out; };
  const bots = { t1: { x: 2, y: 31 }, t2: { x: -21, y: 22 }, h1: { x: -4, y: 10 }, m1: { x: -8, y: 26 }, r3: { x: -30, y: 4 } };
  const S = { thrash: [{ t0: 45, at: 49, x: -41, y: 0, r: 35 }], wrath: [{ t0: 22, at: 27, p: [0, 33] }],
    soaks: [{ set: 0, k: 0, x: -25, y: 8, r: 10, t0: 36.8, at: 40.8, cast: 36, group: ['r3', 'm1'] }, { set: 0, k: 1, x: -25, y: -8, r: 9.5, t0: 40.2, at: 43.6, cast: 36, group: ['h1'] }],
    bubbles: [{ w: 'w1', t0: 34.7, at: 38.7, p: [-26, 2] }], impacts: [{ x: 5, y: -6, r: 7, t0: 3.4, at: 5, color: '#c8a36a' }],
    beams: [{ from: [-39.5, 38.9], t0: 7, t1: 12 }, { from: [38.5, -39.6], t0: 76, t1: 81, tank: 't1' }], tails: [], waves: [], wretches: [{ id: 'w1', awake: 25 }],
    dive: { t0: 77, gone: 78.6, surf: 85.8, to: [-46, 0] }, F: (p) => p.slice(), rotAt: () => 0 };
  const G = { t: 0, x: -30, y: 4, bots, wr: { w1: { x: -18, y: 4 } }, eggs: [{ id: 'r3', x: 10, y: -10, land: 10, shell: 13.6, state: 'air' }], adds: [], debs: {}, fx: [] };
  const A = { G, S, me: 'r3', nm: (id) => id, rl: (id) => id[0], clsC: () => null, bossAt: (t) => (t < S.dive.gone ? { p: [0, 46], up: true } : { p: S.dive.to, up: t >= S.dive.surf }), tailAt: () => ({ p: [-41, 0], up: true }), spot: () => null, target: null };
  const at = (t) => { try { return ctx.shapes(A, t); } catch (e) { bad('pg3dShapes crashed at ' + t + ' s: ' + e.message); return []; } };
  const has = (L, k, x, y, r) => L.some((s) => s.k === k && Math.abs(s.x - x) < 1e-9 && Math.abs(s.y - y) < 1e-9 && Math.abs(s.r - r) < 1e-9);
  { const L = at(40); if (!has(L, 'disc', -25, 8, 10) || !L.some((s) => s.k === 'label' && s.text === 'YOUR SOAK')) bad('your coil soak isn\'t drawn at its spot with its radius (s.r) and "YOUR SOAK"'); }
  { const L = at(43); if (!has(L, 'disc', -25, -8, 9.5)) bad('a coil soak\'s radius isn\'t its own s.r (9.5 here)'); }
  { const L = at(37); if (R_BUB != null && !has(L, 'dome', -18, 4, R_BUB)) bad('the Fester Burst bubble isn\'t a ' + R_BUB + '-yard dome round the Wretch\'s live spot (G.wr), as check() hits it'); if (L.some((s) => s.k === 'dome' && s.x === -26 && s.y === 2)) bad('the bubble is drawn at its planned spot (q.p), not where the Wretch is'); }
  { const L = at(47); if (!has(L, 'disc', -41, 0, 35)) bad('Mephitic Thrash isn\'t drawn with its own radius (th.r, 35) round her tail'); }
  { const L = at(24); if (R_WR != null && !has(L, 'disc', 0, 33, R_WR)) bad('Mother\'s Wrath isn\'t drawn as check()\'s ' + R_WR + ' yards at wr.p'); }
  { const L = at(4); if (!has(L, 'disc', 5, -6, 7)) bad('an impact isn\'t drawn with its own radius (m.r)'); }
  { const L = at(8.5); if (R_EGG != null && !has(L, 'disc', 10, -10, R_EGG)) bad('a landing egg isn\'t drawn as check()\'s ' + R_EGG + '-yard circle'); if (!L.some((s) => s.k === 'egg' && s.x === 10 && s.y === -10 && s.h > 5)) bad('an egg no longer falls from the sky before it lands'); }
  { const b1 = at(9).find((s) => s.k === 'beam'), b2 = at(78).find((s) => s.k === 'beam');
    if (!b1 || b1.x1 !== bots.t2.x || b1.y1 !== bots.t2.y) bad('the first spectral beam doesn\'t go to the off tank'); if (!b2 || b2.x1 !== bots.t1.x || b2.y1 !== bots.t1.y) bad('a beam with b.tank doesn\'t go to that tank (G.bots[b.tank || \'t2\'])'); }
  { const L = at(80); if (L.some((s) => s.k === 'boss')) bad('Ula\'tek is drawn while she dives (bossAt says she\'s down)'); }
  // (waves: a fine grid round each wave at its start, middle and end; a point is in a drawn strip exactly when inWave hits it with no body size)
  const W = [{ name: 'her wave', w: { kind: 'her', x: -12, y: 46, deg: 270, v: 12.5, w: 24, d: 5, cres: cresOf(24), warn: 2.2, t0: 56, t1: 63.6 } },
    { name: 'the beam\'s wave', w: { kind: 'incub', x: -26, y: 25.7, deg: 225, v: 12.5, w: 10, d: 5, cres: cresOf(10), t0: 7.5, t1: 16.5 } },
    { name: 'a small tail\'s wave', w: { kind: 'tail', x: -39.7, y: -40.2, deg: 64.6 + 33, v: 12.5, w: 9, d: 4, cres: cresOf(9), warn: 2.4, t0: 58.6, t1: 67.1 } },
    { name: 'a wave with no crescents', w: { kind: 'tail', x: 3, y: -30, deg: 81, v: 10, w: 12, d: 4, t0: 100, t1: 106 } },
    { name: 'a ring of crescents', ring: true, w: { kind: 'tail', ring: 1, x: 39.2, y: -39.6, n: 16, cw: 7, ph: 0.3, v: 12.5, d: 5, t0: 115.6, t1: 125.1 } }];
  const inside = (L, x, y) => L.some((s) => { if (s.k !== 'wave') return false; const u = Math.cos(s.a), v = Math.sin(s.a), rx = x - s.x, ry = y - s.y, f = rx * u + ry * v, c = -rx * v + ry * u; return f >= s.f0 && f <= s.f1 && c >= s.w0 && c <= s.w1; });
  for (const { name, w, ring } of W) { S.waves = [w]; let miss = 0, extra = 0, hits = 0, ex = '';
    if (w.warn) { const L = at(w.t0 - 1); if (!L.some((s) => s.k === 'rect' && s.f0 === -2.5 && s.f1 === 2.5) || L.some((s) => s.k === 'wave')) bad(name + ': no red warning strip before it goes, or the wave is out early'); }
    for (const t of [w.t0 + 0.013, (w.t0 + w.t1) / 2 + 0.007, w.t1 - 0.011]) { const L = at(t), el = t - w.t0, a = w.deg * Math.PI / 180, cx = ring ? w.x : w.x + Math.cos(a) * w.v * el, cy = ring ? w.y : w.y + Math.sin(a) * w.v * el, R = ring ? w.v * el + 8 : Math.max(w.w || 0, 10) / 2 + 9;
      for (let x = cx - R; x <= cx + R; x += (ring ? 0.53 : 0.31)) for (let y = cy - R; y <= cy + R; y += (ring ? 0.53 : 0.29)) { const hit = ctx.inWave(w, t, x, y, -0.7), drawn = inside(L, x, y); if (hit) hits++;
        if (hit && !drawn) { miss++; if (!ex) ex = 'e.g. ' + x.toFixed(2) + ',' + y.toFixed(2) + ' at ' + t.toFixed(2) + ' s'; } else if (drawn && !hit && !ring) { extra++; if (!ex) ex = 'e.g. ' + x.toFixed(2) + ',' + y.toFixed(2) + ' at ' + t.toFixed(2) + ' s'; } } }
    if (!hits) bad(name + ': the test grid found no point the wave hits (the test is broken)');
    if (miss) bad(name + ': ' + miss + ' spot(s) the wave hits are outside its 3D strip (' + ex + ')');
    if (extra) bad(name + ': ' + extra + ' spot(s) inside its 3D strip aren\'t hit by it (' + ex + ')'); }
  S.waves = [];

  // 4. nameplates: a bar over everyone, a name only near you, on your soak group while your coil is up, and on carriers near you (you: r3 at -30, 4)
  { const h0 = { x: bots.h1.x, y: bots.h1.y }; bots.h1.x = -27; bots.h1.y = 6; const L = at(40); bots.h1.x = h0.x; bots.h1.y = h0.y; const pl = (id) => L.find((s) => s.k === 'plate' && s.id === id);
    if (!pl('r3') || !pl('r3').show) bad('you have no nameplate (with your name always shown)');
    if (!pl('t1') || pl('t1').show) bad('a raider 42 yards from you, not in your soak group and not carrying, still shows a name (the pile of names in a bubble)');
    if (!pl('h1') || !pl('h1').show) bad('a raider 4 yards from you shows no name on their nameplate');
    if (!pl('m1') || !pl('m1').show) bad('your soak group mate across the stone shows no name while your coil is up');
    if (pl('t1') && pl('h1') && !(pl('t1').o < pl('h1').o)) bad('a far nameplate isn\'t fainter than a near one');
    if (L.some((s) => s.k === 'label' && /^(t1|t2|h1|m1)$/.test(s.text))) bad('raider names are plain labels again, not nameplates'); }
  { const t2 = { x: bots.t2.x, y: bots.t2.y }; bots.t2.x = -36; bots.t2.y = 10; G.eggs.push({ id: 't2', x: 0, y: 0, land: 0, shell: 0, state: 'held', who: 't2' }, { id: 't1', x: 0, y: 0, land: 0, shell: 0, state: 'held', who: 't1' });
    const L = at(20), pl = (id) => L.find((s) => s.k === 'plate' && s.id === id); G.eggs.splice(1, 2); bots.t2.x = t2.x; bots.t2.y = t2.y;
    if (!pl('t2') || !pl('t2').show) bad('an egg carrier 8.5 yards from you shows no name');
    if (!pl('t1') || pl('t1').show) bad('an egg carrier 42 yards from you shows a name'); }
  // 5. the hint: an arrow at your feet to hint().T and a "Go here" ring with the yards; nothing when hint() gives nothing
  { A.hint = () => ({ T: [-20, 10], d: Math.hypot(10, 6), dodge: false }); const L = at(20); A.hint = () => null; const L0 = at(20); delete A.hint;
    const ar = L.find((s) => s.k === 'arrow'); if (!ar || ar.x !== G.x || ar.y !== G.y || Math.abs(ar.a - Math.atan2(6, 10)) > 1e-9) bad('no hint arrow at your feet pointing to where your job wants you (hint().T)');
    if (!L.some((s) => s.k === 'label' && s.text === 'Go here · 12 yd') || !has(L, 'ring', -20, 10, 1.4)) bad('no "Go here · 12 yd" ring at the hint\'s spot');
    if (L0.some((s) => s.k === 'arrow' || (s.k === 'label' && /^Go here/.test(s.text)))) bad('a hint arrow shows when hint() gives nothing'); }
  // 6. the spell effects' shapes
  { const c = at(40).find((s) => s.k === 'coil'), c2 = at(41).find((s) => s.k === 'coil' && s.x === -25 && s.y === 8);
    if (!c || c.x !== -25 || c.y !== 8 || c.r !== 10 || !(c.f > 0) || c.slam) bad('no spectral coil rising over a coil soak before its slam');
    if (!c2 || !(c2.slam > 0)) bad('no flash on a coil soak right after its slam'); }
  { S.impacts.push({ x: 10, y: 10, r: 7, t0: 150, at: 151.8, name: 'Falling Debris', color: '#c8a36a' }); const r1 = at(151).find((s) => s.k === 'rock'), r2 = at(151.9).find((s) => s.k === 'rock'); S.impacts.pop();
    if (!r1 || r1.x !== 10 || r1.y !== 10 || r1.land || !r2 || !(r2.land > 0)) bad('no rock dropping onto a Falling Debris circle (and landing on it)'); }
  if (!at(8.5).some((s) => s.k === 'egg' && s.fall && s.h > 5)) bad('a falling egg isn\'t marked as falling (its shadow on the floor)');
  { const b1 = at(24).find((s) => s.k === 'boss'), b2 = at(28).find((s) => s.k === 'boss'); if (!b1 || !(b1.rear > 0) || !b2 || !(b2.bite >= 0)) bad('she doesn\'t rear back for Mother\'s Wrath and bite after it'); }
  if (!at(86.5).some((s) => s.k === 'splash' && s.x === S.dive.to[0] && s.y === S.dive.to[1])) bad('no splash where she bursts up after the dive');
  { const tl = at(49.3).find((s) => s.k === 'tail'); if (!tl || !(tl.slam > 0) || !(at(47).find((s) => s.k === 'tail').wig > 0)) bad('her tail doesn\'t lift for Mephitic Thrash and slam as it lands'); }
  // 7. nothing new while drawing; everything made through keep() so closing the game frees it
  { const a = P3.indexOf('const put = '), b = P3.indexOf('\n  // ---- the camera'), c = P3.indexOf('const draw1 = '), d = P3.indexOf('\n  const draw = ');
    if (a < 0 || b < a || c < 0 || d < c) bad('practice3d.js no longer has put and draw1 where the test reads them');
    else if (/new T\./.test(P3.slice(a, b) + P3.slice(c, d))) bad('the 3D view makes new three.js objects while drawing (a `new T.` in put or draw1): everything must come from a pool made once');
    const loose = []; for (const m of P3.matchAll(/new T\.(\w*(?:Geometry|Material|Texture)|InstancedMesh)\(/g)) if (P3.slice(m.index - 5, m.index) !== 'keep(') loose.push(m[1]);
    if (loose.length) bad('a three.js ' + [...new Set(loose)].join(', ') + ' is made without keep(), so closing the game wouldn\'t free it');
    if (!/own\.forEach\(\(o\) => \{ try \{ o\.dispose\(\); \}/.test(P3)) bad('dispose() no longer frees everything keep() holds'); }
  // 8. the review of the graphics pass (Nov 15)
  { const lb = (L, re) => L.find((s) => s.k === 'label' && re.test(s.text)), ys = lb(at(40), /^YOUR SOAK$/), bb = lb(at(37), /^Into the bubble/);
    if (!ys || ys.h > 6) bad('the "YOUR SOAK" label floats ' + (ys ? ys.h : '?') + ' yards up, over the HUD\'s call-outs and far from its circle (0:39): keep it low (6 at most)');
    if (!bb || bb.h > 6) bad('the "Into the bubble" label floats ' + (bb ? bb.h : '?') + ' yards up, on the HUD\'s call-outs (0:39, under "Egg picked up"): keep it low (6 at most)');
    if (at(20).some((s) => s.k === 'label' && /^Ula'tek$/.test(s.text))) bad('the "Ula\'tek" label is back: it sat half under the boss bar, which already names her');
    const gl = at(48).find((s) => s.k === 'label' && s.text === 'Gore Rattle'); if (!gl || gl.how !== 'name') bad('"Gore Rattle" isn\'t marked as a creature\'s name (how: \'name\'), so it would move off a HUD call-out instead of hiding'); }
  { G.adds.length = 0; for (let i = 0; i < 9; i++) G.adds.push({ kind: 'rawling', x: -27 + (i % 3) * 1.2, y: 6 + Math.floor(i / 3) * 1.2 }); G.adds.push({ kind: 'viper', x: 20, y: -20 });
    const L = at(20), ad = L.filter((s) => s.k === 'label' && /^(Rawling|Viper)/.test(s.text)); G.adds.length = 0;
    if (L.filter((s) => s.k === 'add').length !== 10) bad('the adds themselves aren\'t all drawn');
    if (ad.length !== 1 || ad[0].text !== 'Rawlings ×9' || ad[0].how !== 'add') bad('nine Rawlings in one pack near you get ' + ad.length + ' label(s) (' + ad.map((s) => s.text).join(', ') + '), not one "Rawlings ×9" (0:48: nine "Rawling" in a heap), or a far pack gets one'); }
  { const g0 = S.soaks[0].group; S.soaks[0].group = ['r3', 'm1', 'h1']; const h0 = { x: bots.h1.x, y: bots.h1.y }; bots.h1.x = -18; bots.h1.y = 8; const L = at(40); bots.h1.x = h0.x; bots.h1.y = h0.y; S.soaks[0].group = g0;
    const pl = (id) => L.find((s) => s.k === 'plate' && s.id === id);
    if (!pl('h1') || pl('h1').show) bad('a soak mate already inside your soak circle (12 yards from you) still shows a name (0:39: six names plus yours in the bubble)');
    if (!pl('m1') || !pl('m1').show) bad('a late soak mate, still outside your soak circle, shows no name'); }
  { const fn = (n) => { try { const c = vm.createContext({ Math }); vm.runInContext(H.grab(n, P3) + '\nthis.f = ' + n + ';', c); return c.f; } catch (e) { bad('practice3d.js has no ' + n + ' (' + e.message + ')'); return null; } };
    const hud = fn('pg3dHud'), pick = fn('pg3dPick');
    if (hud) { const B = [{ l: 460, t: 198, r: 980, b: 232 }, { l: 500, t: 279, r: 940, b: 300 }], L = [{ x: 712, y: 290, w: 150, h: 18 }, { x: 760, y: 214, w: 110, h: 18 }, { x: 860, y: 216, w: 100, h: 16, hide: true }, { x: 200, y: 600, w: 90, h: 16 }, { x: 205, y: 604, w: 80, h: 16, hide: true }];
      hud(L, B); const clear = (l) => B.every((b) => !(l.x - l.w / 2 < b.r && l.x + l.w / 2 > b.l && l.y - l.h / 2 < b.b && l.y + l.h / 2 > b.t));
      if (L[0].off || !clear(L[0]) || !(L[0].y > 300)) bad('pg3dHud: a label on the HUD\'s lower call-out isn\'t moved below it (0:39 "Into the bubble" under "Egg picked up")');
      if (L[1].off || !clear(L[1]) || !(L[1].y > 232)) bad('pg3dHud: a label on the top call-out isn\'t moved clear of both call-outs');
      if (!L[2].off) bad('pg3dHud: a creature\'s name on a call-out isn\'t hidden (0:39 "Gore Rattle" on "Spectral Coils: team 1 takes the first coil")');
      if (L[3].off || L[3].y !== 600) bad('pg3dHud: a label away from the call-outs is moved or hidden');
      if (!L[4].off) bad('pg3dHud: a creature\'s name on top of an earlier label isn\'t hidden'); }
    if (pick) { const Q = [{ l: 700, t: 500, r: 740, b: 520, fix: true, pri: 0 }], at0 = (x, y, pri, o) => Object.assign({ l: x - 30, t: y - 10, r: x + 30, b: y + 10, pri }, o || {});
      for (let i = 0; i < 8; i++) Q.push(at0(100 + i * 150, 300, 1 + i / 100)); Q.push(at0(110, 305, 0.5), at0(400, 700, 60, { free: true }), at0(1000, 700, 61, { free: true }), at0(720, 515, 0.2), at0(900, 100, 2, { fix: true }));
      pick(Q, 4); const on = Q.filter((q) => q.on && !q.fix && !q.free);
      if (on.length !== 4) bad('pg3dPick: ' + on.length + ' names show besides yours and the labels, not four at most (0:39: six names plus yours in a bubble)');
      if (Q.some((q) => q.l === 80 && q.on) === Q.some((q) => q.l === 70 && q.on)) bad('pg3dPick: a name on top of a nearer one isn\'t dropped');
      if (Q.some((q) => q.l === 690 && q.on)) bad('pg3dPick: a name on top of your nameplate isn\'t dropped');
      if (!Q.filter((q) => q.free).every((q) => q.on)) bad('pg3dPick: an add pack\'s label on nothing is dropped, or counts against the four names'); }
    if (!/const names = \(\) => \{ bands\(\);[\s\S]*?pg3dHud\(LQ, BX\)[\s\S]*?pg3dPick\(PQ, 4\)/.test(P3) || !/'\.pg-warn', '\.pg-float'/.test(P3)) bad('pg3d no longer reads the HUD\'s call-outs (.pg-warn, .pg-float) and runs pg3dHud and pg3dPick in names()'); }
  { const bm = (/const BOSSM = \[([^\]]*)\]/.exec(P3) || ['', ''])[1];
    if (!['FANGM', 'MOUTHM', 'EYEM', 'PUPM'].every((m) => new RegExp('\\b' + m + '\\b').test(bm) && new RegExp('\\b' + m + ' = keep\\(new T\\.\\w+\\(\\{[^}]*transparent: true').test(P3))) bad('her eyes, pupils, fangs and mouth don\'t fade with her (see-through materials in BOSSM): they float solid inside her faint head');
    if (!/eyeGl\[i\]\.material\.opacity = eyeO \* bo/.test(P3) || !/const bo = fade\(boss,/.test(P3)) bad('her eyes\' glow stays at full brightness while she\'s faded');
    if (!/const twins = /.test(P3) || !/BTW = twins\(boss\)/.test(P3) || !/TTW = twins\(tail\)/.test(P3) || !/userData\.tw = twins\(g\)/.test(P3) || !/fade\(tail, TAILM, 6, TTW,/.test(P3)) bad('her, her tail or a Wretch has no depth twins while faded: the faded tail shows every overlapping segment, a stack of see-through coins (1:27)');
    const nk = /const NECK = (\[\[[^;]*?\]\]), nr = \(u\) => ([^;]+);/.exec(P3), hd = /headG\.position\.set\(([-\d.]+), ([-\d.]+), ([-\d.]+)\)/.exec(P3);
    if (!nk || !hd) bad('practice3d.js no longer has her NECK path, nr() and headG where the test reads them');
    else { const N = JSON.parse(nk[1]), r1 = vm.runInNewContext('(' + nk[2] + ')', { u: 1 }), e = N[N.length - 1], hy = +hd[2], hz = +hd[3];
      if (hy > 20.5) bad('her head is ' + hy + ' yards up, behind the HUD\'s boss bar from the default camera (0:16): keep it about 19');
      if (e[2] < hz - 0.6 * 1.9 * 3.4 || Math.abs(e[1] - hy) > 1.5 || r1 > 2) bad('her neck\'s open end isn\'t inside her skull (ends at ' + e.join(',') + ', radius ' + r1.toFixed(2) + '): a hollow ring shows under her jaw (0:16)'); } }
  { const sp = /const hh = Math\.sin\([^;]*?\* ([\d.]+) \* s\.s; [^;]*;[^;]*; u\.cm\.uniforms\.uO\.value = ([\d.]+) \*/.exec(P3);
    if (!sp || +sp[1] > 6 || +sp[2] > 0.5 || !/cm\.uniforms\.uK\.value = 3/.test(P3) || !/vy = \(7\.0 \+ 10\.0 \* aR\.z\) \* sqrt\(uS\)/.test(P3)) bad('the splash\'s light column is tall and bright again (it washed out the HUD\'s words at 1:18 and 1:27): 6 x size at most, 0.5 bright at most, fading fast at the top, its droplets rising by the square root of its size');
    if (!/const edge = pool\([\s\S]*?m\.renderOrder = 605/.test(P3) || !/const e = edge\(\); e\.position\.set\(x, 0\.04, -y\); e\.rotation\.set\(0, s\.a, 0\); e\.scale\.set\(Dd, 1, Wd\)/.test(P3)) bad('a wave\'s strip has no red border drawn after the wave (the red under it never showed, 0:57)'); }
  // 9. the carved stone (Nov 15): drawn by code once, on the top and the side walls, freed on close, lined up with the octagon
  let marks = null; /* (what the top's colour map got: every fill and stroke, its colour and width; k, pixels a yard) */
  { const nope = (m) => bad('the stone: ' + m);
    const pm = /const plat = new T\.Mesh\(pg, \[([\s\S]*?)\]\);/.exec(P3), mats = pm ? pm[1] : '';
    if (!/\{ map: stx\(STN\.col, [^}]*?(normalMap|bumpMap): stx\(STN\.nrm, /.test(mats)) nope('the platform\'s top has no canvas-drawn colour map and normal (or bump) map from pg3dStoneDraw (plain grey tiles)');
    if (!/\{ map: stx\(STN\.wall, [^}]*?(normalMap|bumpMap): stx\(STN\.wallN, /.test(mats)) nope('the platform\'s side walls have no rock face (a canvas-drawn colour map and normal or bump map)');
    if (!/const stx = \([^)]*\) => \{ const tx = ctex\(c, true\)/.test(P3) || !/const ctex = \(c, rep\) => \{ const tx = keep\(new T\.CanvasTexture\(c\)\)/.test(P3)) nope('its textures aren\'t canvas textures made through ctex() and keep(), so closing the game wouldn\'t free them');
    if (!/keep\(\{ dispose: STN\.free \}\)/.test(P3)) nope('its canvases aren\'t emptied on close (keep({ dispose: STN.free }))');
    const calls = [...P3.matchAll(/pg3dStoneDraw\((?!mk, px\))/g)].map((q) => q.index), a = P3.indexOf('const put = '), b = P3.indexOf('\n  // ---- the camera'), c = P3.indexOf('const draw1 = '), d = P3.indexOf('\n  const draw = ');
    if (calls.length !== 1 || calls.some((i) => (i > a && i < b) || (i > c && i < d)) || !/const STN = pg3dStoneDraw\(/.test(P3)) nope('it must be drawn once, when the 3D view opens (one pg3dStoneDraw call, in pg3d and not in put or draw1): ' + calls.length + ' call(s)');
    const url = []; for (const re of [/TextureLoader|ImageLoader|ImageBitmapLoader|FileLoader|createImageBitmap|XMLHttpRequest/, /new Image\b/, /\bfetch\(/, /url\(/, /data:image/, /\.src\s*=(?! PG3D_THREE;)/]) if (re.test(P3)) url.push(String(re));
    if ((P3.match(/https?:\/\//g) || []).length !== 1) url.push('an address besides three.js\'s');
    if (url.length) nope('a texture or picture loads from an address (' + url.join(', ') + '): the stone must be drawn by code, never a picture');
    if (!/const P = \(x, y\) => \[\(x \+ S \/ 2\) \* K, \(S \/ 2 - y\) \* K\]/.test(P3) || !/S = PL\.span, K = px \/ S/.test(P3) || !/map: stx\(STN\.col, 1 \/ STN\.span, 1 \/ STN\.span, 0\.5, 0\.5\)/.test(P3) || !/normalMap: stx\(STN\.nrm, 1 \/ STN\.span, 1 \/ STN\.span, 0\.5, 0\.5/.test(P3)) nope('the texture doesn\'t span the plan (1 / span, the stone\'s middle at 0.5) the way pg3dStoneDraw draws it ((x + S / 2) * K, (S / 2 - y) * K): the carving would slide off the octagon');
    const sc = (() => { try { const x = vm.createContext({ Math, Uint8Array, Uint8ClampedArray }); vm.runInContext(H.grab('PG_UL', PJ) + '\n' + H.grab('pg3dStonePlan', P3) + '\n' + H.grab('pg3dNormals', P3) + '\n' + H.grab('pg3dStoneDraw', P3) + '\nthis.plan = pg3dStonePlan; this.nrm = pg3dNormals; this.draw = pg3dStoneDraw; this.on = PG_UL.onPlat;', x); return x; } catch (e) { nope('pg3dStonePlan, pg3dNormals or pg3dStoneDraw don\'t run by themselves (' + String(e.message).slice(0, 140) + ')'); return null; } })();
    if (sc) { let PL = null; try { PL = sc.plan(); } catch (e) { nope('pg3dStonePlan crashed: ' + e.message); }
      if (PL) { const on = (p) => sc.on(p[0] * 0.9999, p[1] * 0.9999), OCT = /const OCT = (\[\[[^;]*?\]\])/.exec(P3);
        if (PL.oct.length !== 8 || !PL.oct.every((p) => on(p) && !sc.on(p[0] * 1.01, p[1] * 1.01))) nope('the carving\'s outline isn\'t PG_UL.onPlat\'s octagon (every corner on its edge)');
        if (!OCT || JSON.stringify(JSON.parse(OCT[1])) !== JSON.stringify(PL.oct)) nope('the carving\'s outline isn\'t the platform mesh\'s octagon (OCT)');
        const off = []; PL.slabs.forEach((L) => L.forEach((p) => { if (!on(p)) off.push('slab'); })); PL.chips.forEach((L) => L.forEach((p) => { if (!on(p)) off.push('chip'); })); PL.cracks.forEach((q) => q.L.forEach((p) => { if (!on(p)) off.push('crack'); }));
        [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(([u, v]) => { for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2, r = PL.knots.h * 1.45; if (!on([u * PL.knots.at + Math.cos(t) * r, v * PL.knots.at + Math.sin(t) * r])) off.push('knot'); }
          if (!PL.inside(u * PL.fans.at, v * PL.fans.at, PL.FRAME)) off.push('fan'); });
        if (off.length) nope([...new Set(off)].join(', ') + ' off the stone (' + off.length + ' point(s)): the carving doesn\'t line up with the octagon');
        if (PL.panels.some((p) => PL.box(...p).some((q) => !PL.inside(q[0], q[1], PL.FRAME)))) nope('a blue-slate panel runs into the rim\'s band and frame');
        if (PL.med.x !== 0 || PL.med.y !== 0 || !(PL.med.r[0] < PL.sq[3])) nope('the medallion isn\'t round in the middle of the carved square'); }
      try { const N = sc.nrm(new Uint8Array(9).fill(100), 3, 3, 6, false), E = sc.nrm(Uint8Array.from([0, 50, 100, 0, 50, 100, 0, 50, 100]), 3, 3, 6, false), S = sc.nrm(Uint8Array.from([100, 100, 100, 50, 50, 50, 0, 0, 0]), 3, 3, 6, false);
        if (N[16] !== 128 || N[17] !== 128 || N[18] !== 255) nope('a flat stone\'s normal map isn\'t flat (128, 128, 255)');
        if (!(E[16] < 128) || !(S[17] < 128)) nope('the normal map is inside out: a slope rising east must face west (red under 128), one rising north must face south (green under 128)'); } catch (e) { nope('pg3dNormals crashed: ' + e.message); }
      // (drawn with nothing but a canvas maker: a stand-in canvas that keeps what's put on it)
      // (it also notes every fill and stroke with its colour and width, for 10)
      const made = [], fake = (w, h) => { const cv = { width: w, height: h, puts: [], draws: [] }, o = { lineWidth: 1 }, g = new Proxy(o, { get: (t, k) => k === 'getImageData' ? (x, y, ww, hh) => ({ data: new Uint8ClampedArray(ww * hh * 4) }) : k === 'createImageData' ? (ww, hh) => ({ data: new Uint8ClampedArray(ww * hh * 4), width: ww, height: hh })
        : k === 'putImageData' ? (im) => { cv.puts.push(im); } : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : (k === 'fill' || k === 'stroke') ? () => { cv.draws.push({ k, s: k === 'fill' ? t.fillStyle : t.strokeStyle, w: t.lineWidth }); } : k in t ? t[k] : () => {} });
        cv.getContext = () => g; made.push(cv); return cv; };
      try { const r = sc.draw(fake, 256), nm = r.nrm.puts[r.nrm.puts.length - 1]; marks = { draws: r.col.draws, k: 256 / r.span };
        if (r.col.width !== 256 || r.nrm.width !== 256 || r.span !== (PL && PL.span) || !r.wall || !r.wallN || !(r.wallW > 0) || !(r.wallH > 0)) nope('pg3dStoneDraw doesn\'t give the top\'s colour and normal maps (px square, the plan\'s span) and the wall\'s');
        if (!nm || nm.data[0] !== 128 || nm.data[1] !== 128 || nm.data[2] !== 255 || !r.wallN.puts.length) nope('the normal maps aren\'t made from the heights (pg3dNormals)');
        r.free(); if ([r.col, r.nrm, r.wall, r.wallN].some((q) => q.width !== 0)) nope('free() doesn\'t empty the stone\'s canvases'); } catch (e) { nope('pg3dStoneDraw needs more than a canvas to draw (' + String(e.message).slice(0, 140) + ')'); } } }
  // 10. the stone's marks against the floor's markers (Nov 15, the review of the stone's 0:30, 0:39, 0:41, 0:48, 0:57 and 2:30 pictures): the
  // shader's venom glow (vglow) lights any green in the colour map, so each mark is measured as it lands on a groove
  { const nope = (m) => bad('the stone\'s marks: ' + m);
    const vg = /smoothstep\(([\d.]+), ([\d.]+), diffuseColor\.g - max\(diffuseColor\.r, diffuseColor\.b\)\)/.exec(P3), pal = (n) => { const q = new RegExp('\\b' + n + ' = \\[(\\d+), (\\d+), (\\d+)\\]').exec(P3); return q && q.slice(1).map(Number); };
    const ST = pal('STONE'), GR = pal('GROOVE'), RA = pal('RAISED'), SL = pal('SLATE');
    if (!vg || !ST || !GR || !RA || !SL) nope('can\'t read the venom glow\'s threshold (vglow: smoothstep(lo, hi, diffuseColor.g - max(diffuseColor.r, diffuseColor.b))) or the stone\'s colours (STONE, GROOVE, RAISED, SLATE in pg3dStoneDraw)');
    else {
      const lo = +vg[1], hi = +vg[2], glow = (c, a) => { const m = GR.map((g, i) => g + (c[i] - g) * a), x = Math.min(1, Math.max(0, ((m[1] - Math.max(m[0], m[2])) / 255 - lo) / (hi - lo))); return x * x * (3 - 2 * x); };
      if ([ST, GR, RA].some((c) => glow(c, 1) > 0)) nope('the stone\'s own colours (STONE, GROOVE, RAISED) clear the venom glow\'s threshold: the whole floor would glow');
      if (ST[2] - ST[0] < 10) nope('the stone isn\'t teal (STONE ' + ST.join(', ') + ': blue at least 10 over red): the warm key light takes blue away, so a grey-green came out olive, not the room\'s sea-green (0:41 against the room\'s picture)');
      if (SL[2] - SL[1] < ST[2] - ST[1] + 8) nope('the slate panels aren\'t a separate blue from the stone (SLATE ' + SL.join(', ') + ' against STONE ' + ST.join(', ') + ')');
      if (marks) { const hot = new Set(), thin = new Set();
        marks.draws.forEach((d) => { const q = /^rgba\((\d+),(\d+),(\d+),([\d.]+)\)$/.exec(typeof d.s === 'string' ? d.s : ''); if (!q) return; const g = glow([+q[1], +q[2], +q[3]], +q[4]), yd = d.w / marks.k;
          if (g > 0.3) hot.add(d.s + ' ' + d.k + ' at ' + Math.round(g * 100) + '%');
          if (g > 0 && d.k === 'stroke' && yd < 0.1) thin.add(d.s + ' ' + yd.toFixed(2) + ' yd'); });
        if (hot.size) nope('a carved mark glows at more than 30% of the venom glow (' + [...hot].join('; ') + '): the corner inlays read as green arrows by the gold hint arrow and the "Go here" ring (0:39, 0:41) and the serpent\'s eyes as arrowheads either side of you (0:30); keep the stone\'s marks dull so only the markers stand out');
        if (thin.size) nope('a glowing line is under 0.1 yards wide, under 3 texels on the 2048 map (' + [...thin].join('; ') + '): it breaks into a dotted green dash that flickers as the camera moves, like a beam out from under you (0:48)'); } } }
  // 11. attacks you can see (Nov 15, Flex: "the attack doesnt look like its attacking"): practice.js's hitTgt pushes { x0, y0, x1, y1, r, t0, melee }
  // and dpsView hands them over with their age; you (r3) stand at -30, 4 and hit a Viper 16 yards east
  { const nope = (m) => bad('attacks: ' + m), tg = { key: 'a1', kind: 'viper', name: 'Blightscale Viper', p: [-14, 4], r: 1.6, hp: 4, max: 5 }, dT = Math.hypot(tg.p[0] - G.x, tg.p[1] - G.y);
    const hit = (age, melee) => ({ x0: G.x, y0: G.y, x1: tg.p[0], y1: tg.p[1], r: tg.r, t0: 20 - age, melee, age });
    const run = (fx, o) => { const r0 = A.rl; o = o || {}; A.dps = () => ({ cat: 'viper', cur: tg, cd: 0, right: [tg], inRange: o.far ? false : true, ok: true, fx, adds: [tg] }); if (o.rl) A.rl = o.rl; const L = at(20); A.rl = r0; delete A.dps; return L; };
    const rgb = (c) => { const q = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c || ''); return q ? q.slice(1).map((x) => parseInt(x, 16)) : [0, 0, 0]; };
    const L1 = run([hit(0.1, false)]), bo = L1.filter((s) => s.k === 'bolt'), b = bo[0];
    if (bo.length !== 1) nope('a ranged hit 0.1 s old draws ' + bo.length + ' bolt(s), not one flying from you to your target');
    else { const dp = Math.hypot(b.x - G.x, b.y - G.y), dq = Math.hypot(b.x - tg.p[0], b.y - tg.p[1]), off = Math.abs((b.x - G.x) * (tg.p[1] - G.y) - (b.y - G.y) * (tg.p[0] - G.x)) / dT, c = rgb(b.c);
      if (!(dp > 0.5 && dq > 0.5 && dp < dT && dq < dT && off < 0.05)) nope('the ranged bolt at 0.1 s isn\'t on its way between you and your target (at ' + b.x.toFixed(2) + ', ' + b.y.toFixed(2) + ')');
      if (!(Math.abs(b.h - 2.4) < 0.6)) nope('the ranged bolt flies ' + b.h + ' yards up, not about hand height (2.4)');
      if (!(c[0] > 200 && c[1] >= 50 && c[1] <= 170 && c[2] < 100)) nope('the ranged bolt isn\'t orange-red like fire (' + b.c + ')');
      if (!(b.tx != null && Math.hypot(b.tx - G.x, b.ty - G.y) < dp)) nope('the ranged bolt has no streak behind it, back toward you'); }
    if (L1.some((s) => s.k === 'impact')) nope('a ranged hit bursts on the target 0.1 s in, before its bolt gets there');
    const L2 = run([hit(0.4, false)]), im = L2.find((s) => s.k === 'impact');
    if (!im || Math.hypot(im.x - tg.p[0], im.y - tg.p[1]) > tg.r || !(im.p > 0 && im.p < 1)) nope('0.4 s after a ranged hit there is no impact (a flash and a ring) on the target');
    if (L2.some((s) => s.k === 'bolt')) nope('the ranged bolt is still flying 0.4 s after the hit');
    if (run([hit(0.55, false)]).some((s) => s.k === 'impact' || s.k === 'bolt')) nope('a hit\'s bolt or impact is still showing after half a second');
    const bh = run([hit(0.1, false)], { rl: (id) => (id === 'r3' ? 'h' : id[0]) }).find((s) => s.k === 'bolt'), ch = bh ? rgb(bh.c) : [0, 0, 0];
    if (!bh || (b && bh.c === b.c) || !(ch[0] > 220 && ch[1] > 170 && ch[2] < 150)) nope('a healer\'s bolt isn\'t its own holy gold (' + (bh ? bh.c : 'no bolt') + ')');
    const L3 = run([hit(0.1, true)]), sl = L3.find((s) => s.k === 'slash'), mine = L3.find((s) => s.k === 'unit' && s.you);
    if (!sl || Math.hypot(sl.x - G.x, sl.y - G.y) > 2) nope('a melee hit draws ' + (sl ? 'its slash away from you' : 'no slash') + ': a melee swing is a quick slash in front of you');
    else if (Math.abs(Math.atan2(Math.sin(sl.a - Math.atan2(tg.p[1] - G.y, tg.p[0] - G.x)), Math.cos(sl.a - Math.atan2(tg.p[1] - G.y, tg.p[0] - G.x)))) > 0.05) nope('the melee slash doesn\'t face the target');
    if (L3.some((s) => s.k === 'bolt')) nope('a melee hit throws a bolt: a melee swing is a slash, never a bolt');
    if (!L3.some((s) => s.k === 'impact' && Math.hypot(s.x - tg.p[0], s.y - tg.p[1]) <= tg.r && s.melee)) nope('a melee hit makes no spark on its target');
    if (!mine || !(mine.lf > 0)) nope('you don\'t lean into a hit');
    // (your target's circle: one, red, solid while in range, dashed while out of range, inside the add's health arc at r + 0.7)
    const at0 = (L) => L.filter((s) => s.k === 'ring' && Math.abs(s.x - tg.p[0]) < 1e-9 && Math.abs(s.y - tg.p[1]) < 1e-9 && s.r > tg.r - 0.01 && s.r < tg.r + 1), red = (s) => { const c = rgb(s.c); return c[0] > 200 && c[1] < 90 && c[2] < 90; };
    const R1 = at0(L1), rr = R1.filter(red), Rf = at0(run([], { far: true })).filter(red);
    if (rr.length !== 1 || rr[0].dash) nope('your target has ' + rr.length + ' red circle(s) under it, not one solid red circle as in WoW');
    if (R1.some((s) => /^#fff/i.test(s.c))) nope('your target still has the old white ring as well as its red circle (one circle, not two)');
    if (rr.length === 1 && rr[0].r > tg.r + 0.7 - 0.32) nope('your target\'s red circle (radius r + ' + (rr[0].r - tg.r).toFixed(2) + ') sits on the add\'s red health arc (r + 0.38 to r + 0.7): the health can\'t be read');
    if (Rf.length !== 1 || !Rf[0].dash) nope('your target\'s circle no longer turns dashed while it\'s out of range');
    if (!L1.some((s) => s.k === 'disc' && s.x === tg.p[0] && s.y === tg.p[1] && red(s))) nope('your target\'s red circle has no faint red fill under it');
    const pa = P3.indexOf('const put = '), pb = P3.indexOf('\n  // ---- the camera'), body = pa < 0 || pb < pa ? '' : P3.slice(pa, pb);
    ['bolt', 'impact', 'slash'].forEach((k) => { if (!body.includes("if (k === '" + k + "')")) nope('put() doesn\'t draw the ' + k + ' (pg3dShapes lists it, but nothing shows)'); }); }
  // 12. cast bars over the casters you can kick (Nov 16, Flex: "The interupts are impossible to track/see. The monsters should have cast bars over their heads
  // i think to make it more visually clear theres something that needs to be interrupted", then "I appreceate the time stamps and everything on the fight,
  // but remember this is intended to be training wheels for people to do the fight"). The parts' own checks (tests/practice-p2.js and practice-p3.js, check CB)
  // play every cast; this one reads the look and the drawing: words, never numbers; your kick gold; a part's castBars passed on as 'cast' shapes; drawn,
  // pooled and freed like the nameplates, just over the caster's head, about a nameplate wide, and kept clear of the labels and names
  { const nope = (m) => bad('cast bars: ' + m);
    if (!/function pg3dCastLook\(/.test(P3)) nope('practice3d.js has no cast bar look (pg3dCastLook): nothing is drawn over a caster you can kick but a ring on the floor with seconds');
    else { try { vm.runInContext(grab('pg3dCastLook', P3) + '\nthis.look = pg3dCastLook;', ctx); } catch (e) { nope('pg3dCastLook no longer runs by itself: ' + String(e.message).slice(0, 140)); }
      const look = (o) => { try { return ctx.look(o) || {}; } catch (e) { return {}; } };
      const mN = look({ name: 'Malice', f: 0.3, mine: true, near: true, state: 'cast' }), mF = look({ name: 'Malice', f: 0.3, mine: true, near: false, state: 'cast' }), o = look({ name: 'Anguished Cry', f: 0.5, mine: false, near: true, state: 'cast' }), x = look({ name: 'Vicious Echoes', f: 0.4, mine: true, near: true, state: 'kicked' });
      if (mN.text !== 'Kick (E)' || mF.text !== 'Get closer') nope('your kick\'s bar says "' + mN.text + '" in reach and "' + mF.text + '" out of it, not "Kick (E)" and "Get closer"');
      if (!/^#f3c969$/i.test(mN.frame || '') || !mN.mine) nope('your kick\'s bar has no gold frame');
      if (o.text !== 'Anguished Cry' || o.mine || !/^#e0a53a$/i.test(o.fill || '') || /^#f3c969$/i.test(o.frame || '')) nope('someone else\'s kick isn\'t the spell\'s name on an amber bar with a dark frame');
      if (x.text !== 'Interrupted' || !/^#b8322a$/i.test(x.fill || '') || !x.full) nope('a kicked cast isn\'t a full red "Interrupted" bar');
      [mN, mF, o, x].forEach((q) => { if (/\d/.test(q.text || '')) nope('a bar\'s words have a number in them: "' + q.text + '" (training wheels: no seconds)'); });
      // (a part's castBars, one 'cast' shape each, as the part gave them; none for a part without them)
      const BARS = [{ key: 'mE1', caster: 'wdE', x: 90, y: 47, h: 7.1, name: 'Malice', f: 0.4, mine: true, near: true, state: 'cast' }, { key: 'cdsE11', caster: 'dsE1', x: 112, y: 8.5, h: 4.6, name: 'Anguished Cry', f: 1, mine: false, near: false, state: 'kicked' }];
      let LS = []; try { LS = ctx.shapes(Object.assign({}, A, { P2: { shapes() {}, castBars: () => BARS } }), 20); } catch (e) { nope('pg3dShapes crashed with a part\'s cast bars: ' + e.message); }
      const cs = LS.filter((s) => s.k === 'cast'); if (cs.length !== 2 || BARS.some((b) => !cs.some((s) => Object.keys(b).every((k) => s[k] === b[k])))) nope('pg3dShapes doesn\'t pass a part\'s castBars on as one \'cast\' shape each');
      if (at(20).some((s) => s.k === 'cast')) nope('a part with no castBars (phase 1) gets cast bars');
      // (the drawing)
      const pa = P3.indexOf('const put = '), pb = P3.indexOf('\n  // ---- the camera'), body = pa < 0 || pb < pa ? '' : P3.slice(pa, pb), cb = (/const castBar = [\s\S]*?CB\.push\(b\); \};/.exec(P3) || [''])[0];
      if (!body.includes("if (k === 'cast') { castBar(s, t); return; }")) nope('put() doesn\'t draw the \'cast\' shapes (pg3dShapes lists them, but nothing shows)');
      if (!/if \(b\.dk !== dk\)/.test(cb) || !/\* CBN\)/.test(cb)) nope('a bar\'s picture isn\'t drawn again only when its fill moves a step or its words change');
      if (!/plSprite\(CBW, CBH\)/.test(cb) || !/CBF\.pop\(\)/.test(cb)) nope('the bars don\'t come from a pool of sprites made through plSprite (keep())');
      const K = /const CBW = (\d+), CBH = (\d+), CBK = ([\d.]+)/.exec(P3), fz = /let f = (\d+); g\.font = '700 ' \+ f/.exec(cb);
      if (!K || !fz || +fz[1] * +K[3] < 12 || +K[1] * +K[3] < 110 || +K[1] * +K[3] > 170) nope('a bar isn\'t about a nameplate wide (110 to 170 px on screen) with its words at least 12 px');
      if (!/b\.sp\.position\.set\(s\.x, baseY\(s\.x, s\.y\) \+ \(s\.h \|\| 0\), -s\.y\)/.test(cb) || !/center\.set\(0\.5, -0\.25\)/.test(cb)) nope('a bar isn\'t placed just over its caster\'s head (h yards over its base, the gap in pixels)');
      if (!/CBS\.forEach\(\(b, key\) => \{ if \(!b\.on\) \{ b\.sp\.visible = false; CBS\.delete\(key\); CBF\.push\(b\); \} \}\)/.test(P3)) nope('a bar that ends isn\'t hidden and put back in the pool each frame');
      if (!/CBS\.clear\(\)/.test(P3.slice(P3.indexOf('const dispose = ')))) nope('closing the game doesn\'t let go of the bars');
      const nm = P3.slice(P3.indexOf('const names = '), P3.indexOf('\n  // ---- one shape on the screen'));
      if (!/pg3dHud\(CQ, HB\)/.test(nm) || !/BX\.push\(q\)/.test(nm)) nope('the labels and names don\'t keep off the bars (their boxes don\'t join the call-outs\' in names())'); } }
  return loadP;
};
if (require.main === module) {
  const P = []; Promise.resolve(module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c))).then(() => { P.forEach((x) => console.log(x)); console.log('Practice 3D check: ' + (P.length ? P.length + ' problem(s)' : 'OK')); process.exit(P.length ? 1 : 0); });
}
