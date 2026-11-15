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
//     waves, the small tails', a wave without crescents, and a ring: every point a ring hits is inside the drawn ring).
// contradictions.js runs it on every build (and `node tests/practice-3d.js` on its own). It fails on 9e8d89f9, the game before the 3D view.
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
    if (!/try \{ v = localStorage\.getItem\('wla-pg-view'\); \} catch/.test(PJ)) bad('the 2D | 3D pick is no longer remembered inside a try/catch'); }
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
  return loadP;
};
if (require.main === module) {
  const P = []; Promise.resolve(module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c))).then(() => { P.forEach((x) => console.log(x)); console.log('Practice 3D check: ' + (P.length ? P.length + ' problem(s)' : 'OK')); process.exit(P.length ? 1 : 0); });
}
