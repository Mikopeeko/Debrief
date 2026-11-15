// Mythic+ Summary, the clean-up pass (Nov 14, Flex: "work on the summary tab. Clean it up make it better"; judged on his +19 Kings' Rest of Sep 25,
// report dtMfgnRvDwBLPCKZ fight 2). Before it, "Fix first" was one thin line of text, and "The key, pull by pull" showed two deaths and nothing of the
// key's five close calls or its three pulls with no big cooldown. This runs Summary's own code (mpxFix, mpxAlso, mpxMarks, mpxGlance) on made-up keys and
// fails if: the rows of mistakes are gone, are named another way than the Mistakes box, or sit on each other on a crowded key; a mark no longer opens its
// kind's list; the bracket and column for Fix first's pulls are gone; the rows show on the Companion's card or on a key with no timer; or Fix first loses
// its box, its Next time line or the mistakes inside its pulls. contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function summaryStrip(say) {
  const bad = (m) => say('Mythic+ Summary', 'the strip and Fix first', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const a = s.indexOf('// (Summary, the clean-up pass'), z = s.indexOf('// (a player\'s part, two ways.');
  if (a < 0 || z < a) { bad('Summary\'s Fix first box and the strip\'s rows of mistakes are gone from src/mptab.js (mpxFix, mpxMarks, mpxGlance)'); return; }
  const line = (n) => { const m = s.match(new RegExp('\\nconst ' + n + ' = [^\\n]*')); if (!m) throw new Error('src/mptab.js has no ' + n); return m[0]; };
  const run = (card) => vm.runInNewContext(
    'const MPC_ON = ' + (card ? 'true' : 'false') + ', document = { addEventListener: () => {} };' +
    'const esc = (x) => String(x == null ? "" : x).replace(/[&<>"\']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", \'"\': "&quot;", "\'": "&#39;" }[c]));' +
    'const mpT1 = (h) => " data-tt=\\"" + esc(h) + "\\"", mpShim = () => "<span class=\\"mpt-shim\\"></span>";' +
    'const mpPullName = (R, k) => "pull " + (k + 1), mpPNs = (R, ns) => "pulls " + ns.join(", "), mpClock = (R) => R._C || null, mpxData = (R) => R._D;' +
    line('mpMM') + line('mpAnd') + line('mpCap') + line('mpDTo') + line('MPX_KIND') + '\n' + s.slice(a, z) + '\n({ mpxFix, mpxAlso, mpxMarks, mpxGlance, MPX_KIND })');
  let X; try { X = run(false); } catch (e) { bad('Summary\'s own code no longer runs by itself: ' + String(e.message).slice(0, 140)); return; }
  // a made-up key: 12 pulls of 20 s back to back from 10 s, a 600 s timer; tv is the plain clock
  const P = Array.from({ length: 12 }, (_, i) => ({ s: 10 + i * 20, e: 30 + i * 20, n: i + 1 }));
  const C = { ck: { par: 600, time: 250 }, pen: 15, T0: 0, tv: (t) => t };
  const D0 = () => ({ kick: [], cc: [], minor: [], death: [], close: [], disp: [], avoid: [], cd: [] });
  const lefts = (h, cls) => { const r = (h.split('<div class="mpt-ln mpx-ml ' + cls + '">')[1] || '').split('</div></div>')[0]; return [...r.matchAll(/class="mpx-md[^"]*" style="left:([\d.]+)%"[^>]*>(\d*)</g)].map((m) => [+m[1], m[2]]); };
  // 1. a crowded key: three missed kicks in each of six pulls in a row; then pulls so short their marks would touch
  { const D = D0(); for (let i = 0; i < 6; i++) for (let k = 0; k < 3; k++) D.kick.push({ t: 12 + i * 20 + k, at: '0:' + (12 + i * 20), i, spell: 'Bolt', mob: 'Mage', id: 1, ready: ['Ann'] });
    const short = P.map((p, i) => ({ s: 10 + i * 4, e: 14 + i * 4, n: i + 1 })), D2 = D0(); for (let i = 0; i < 6; i++) D2.kick.push({ t: 11 + i * 4, at: '0:11', i, spell: 'Bolt', mob: 'Mage', id: 1, ready: [] });
    const h = X.mpxMarks({ pulls: P, _C: C, _D: D }, null, null), L = lefts(h, 'mpx-g-' + X.MPX_KIND.kick[1]);
    if (L.length !== 6) bad('the Missed kicks row over the strip has ' + L.length + ' marks for six pulls with missed kicks (one mark a pull, with its count)');
    else if (L.some((m) => m[1] !== '3')) bad('the marks of one kind in one pull no longer merge into one mark with their count (three missed kicks in a pull must read 3)');
    if (!/class="mpx-md[^"]*" style="left:[\d.]+%" data-mpxv="mis" data-mpxk="kick"/.test(h)) bad('a mark over the strip no longer opens its kind\'s list in the Mistakes box');
    if (h.indexOf('Bolt ×3, kick ready: Ann') < 0 || h.indexOf('Bolt, kick ready: Ann') >= 0) bad('a mark\'s hover repeats the same line for each cast of one spell (three Bolts with Ann\'s kick ready must read "Bolt ×3, kick ready: Ann" once; the patch review, Nov 14)');
    const h2 = X.mpxMarks({ pulls: short, _C: C, _D: D2 }, null, null), L2 = lefts(h2, 'mpx-g-' + X.MPX_KIND.kick[1]);
    { const C2 = { ck: { par: 200, time: 260 }, pen: 15, T0: 0, tv: (x) => x }, D3 = D0(); for (let k = 0; k < 5; k++) D3.close.push({ t: 255 + k, at: '4:15', i: 7 + k, who: 'Ann', left: 9, spell: 'Slam' + k, ready: [] });
      const L3 = lefts(X.mpxMarks({ pulls: P, _C: C2, _D: D3 }, null, null), 'mpx-g-' + X.MPX_KIND.close[1]); if (L3.length !== 5 || L3.some((m, j) => j && m[0] - L3[j - 1][0] < 2.59) || L3.some((m) => m[0] > 99.01)) bad('at the end of a key that went over time the marks over the strip sit on each other or run past its end (' + L3.map((m) => m[0]).join(', ') + '; the patch review, Nov 14)'); }
    if (L2.length !== 6 || L2.some((m, j) => j && m[0] - L2[j - 1][0] < 2.59) || L2.some((m) => m[0] > 100)) bad('on a crowded key the marks over the strip sit on each other or run off its end (six short pulls in a row: ' + L2.map((m) => m[0]).join(', ') + ')'); }
  // 2. every kind gets its row, in the Mistakes box's order and under its names, and a death sits at its own moment
  { const D = D0(); D.death.push({ t: 130, at: '2:10', i: 6, who: 'Ann', d: { to: 'unknown' } }); D.close.push({ t: 50, at: '0:50', i: 2, who: 'Bob', left: 7, spell: 'Slam', ready: [] }); D.cd.push({ t: 70, at: '1:10', i: 3, names: ['Ann', 'Bob'], dur: 80 });
    D.avoid.push({ t: 95, at: '1:35', i: 4, who: 'Bob', spell: 'Pool', n: 4, dmg: 9 }); D.disp.push({ t: 150, at: '2:30', i: 7, n: 'Rot', who: 'Ann', dur: 14, rdy: [] }); D.cc.push({ t: 170, at: '2:50', i: 8, spell: 'Roar', mob: 'Brute', ready: [] });
    const h = X.mpxMarks({ pulls: P, _C: C, _D: D }, null, [{ t: 'Trash before the boss', ps: [1, 2, 5] }, 1]);
    const order = ['mpx-mlf', 'mpx-g-d', 'mpx-g-d', 'mpx-g-k', 'mpx-g-p', 'mpx-g-c', 'mpx-g-a'], got = [...h.matchAll(/<div class="mpt-ln mpx-ml ([\w-]+)">/g)].map((m) => m[1]);
    if (got.join(' ') !== order.join(' ')) bad('the rows over the strip are not Fix first, then a row a kind in the Mistakes box\'s order (got: ' + got.join(' ') + ')');
    for (const k of ['death', 'close', 'cc', 'disp', 'cd', 'avoid']) if (h.indexOf('>' + X.MPX_KIND[k][0] + '</button>') < 0) bad('a row over the strip is not named as the Mistakes box names it (' + X.MPX_KIND[k][0] + ')');
    if ((h.match(/class="mpx-md mpx-mdh"/g) || []).length !== 3) bad('a close call, a cast that needed a stop and a cooldown not pressed are no longer drawn hollow (two kinds share red, two share purple, and a solid blue mark reads as a small pull)');
    { const hb = X.mpxMarks({ pulls: P, _C: C, _D: D }, null, [{ t: 'Pulls 6', ps: [5] }, 1]); if ((hb.match(/Pulls 6/g) || []).length !== 1) bad('the Fix first bracket\'s hover says the title twice (a boss fix read "The Golden Serpent / The Golden Serpent"; the patch review, Nov 14)'); }
    if ((h.match(/class="mpx-mfs"/g) || []).length !== 2) bad('the Fix first bracket no longer draws one piece a run of pulls (pulls 2, 3 and 6 are two pieces)');
    if ((h.match(/class="mpx-mfc"/g) || []).length !== 2 || h.indexOf('class="mpx-mfc"') > h.indexOf('<div class="mpt-ln mpx-ml ')) bad('the faint column for the pulls Fix first is about is gone, or is drawn after the rows (it must sit behind them)');
    const dl = lefts(h, 'mpx-g-d')[0]; if (!dl || Math.abs(dl[0] - 100 * (130 + 7.5) / (600 * 1.03)) > 0.02) bad('a death\'s mark is no longer over the middle of its red block on the lane (its moment plus half its 15 s penalty, on the strip\'s scale: the timer\'s length times 1.03)');
    if (h.indexOf('died to unknown') >= 0) bad('a death\'s mark says "died to unknown"');
    if (!/>4<\/button>/.test(h)) bad('an avoidable hit that landed four times no longer shows 4 on its mark'); }
  // 3. nothing to show: no rows, and the strip is left as it was
  { const R0 = { pulls: P, _C: C, _D: D0() }, tl = '<div class="mpt-tl"><div class="mpt-ln"><span>You</span></div></div>';
    if (X.mpxMarks(R0, null, null) !== '') bad('a key with no mistakes and no located fix gets rows over its strip');
    const g0 = X.mpxGlance(tl, R0, null, null); if (g0.indexOf(tl) < 0 || /mpx-glm/.test(g0) || g0.indexOf('Click a pull to open it on Route') < 0) bad('a key with no mistakes no longer shows its strip as it was');
    const D = D0(); D.death.push({ t: 130, at: '2:10', i: 6, who: 'Ann', d: { to: 'Slam' } }); const R1 = { pulls: P, _C: C, _D: D }, g1 = X.mpxGlance(tl, R1, null, null);
    if (!/class="mpx-gl mpx-glm"/.test(g1) || g1.indexOf('<div class="mpt-tl"><div class="mpt-ln mpx-ml ') < 0 || g1.indexOf('</div></div><div class="mpt-ln"><span>You</span>') < 0) bad('the rows of mistakes no longer go in front of the strip\'s first lane');
    if (g1.indexOf('Click a mark for its list') < 0) bad('the strip no longer says a mark can be clicked');
    { const g2 = X.mpxGlance(tl, R0, null, [{ t: 'Trash', ps: [2, 3] }, 1]); if (!/mpx-glm/.test(g2) || g2.indexOf('Click a mark') >= 0) bad('the strip says "Click a mark for its list" when it has only the Fix first bracket and no mark (the patch review, Nov 14)'); }
    if (X.mpxGlance('<div class="mpt-tl">no lanes here</div>', R1, null, null).indexOf('no lanes here') < 0) bad('a strip with no lanes loses its markup');
    if (X.mpxMarks({ pulls: P, _C: null, _D: D }, null, null) !== '') bad('a key with no timer gets rows over a strip it does not have'); }
  // 4. the Companion's card keeps its layout
  { const Y = run(true), D = D0(); D.death.push({ t: 130, at: '2:10', i: 6, who: 'Ann', d: { to: 'Slam' } }); const R = { pulls: P, _C: C, _D: D };
    if (Y.mpxMarks(R, null, null) !== '' || Y.mpxGlance('<div class="mpt-ln">', R, null, null) !== '' || Y.mpxAlso(R, null, { ps: [6], c: 'trash' }) !== '') bad('the Companion\'s card gets the website\'s strip rows'); }
  // 5. Fix first: a box with its Next time line and what it cost; a placeholder while the fast run loads; nothing when there is nothing to fix
  { const f = X.mpxFix([{ t: 'Trash before the boss', s: 90, c: 'trash' }, 1], false, true, { nt: '<p class="mpt-nt"><b>Next time</b> Pull bigger.</p>', go: '<button>map</button>', gap: 335, also: '<p class="mpx-fxa">also</p>' });
    if (!/^<div class="mpx-fix mpx-fx2 mpx-fx-trash">/.test(f) || f.indexOf('<span class="mpx-fk">Fix first</span><span class="mpx-fxt">Trash before the boss</span>') < 0 || f.indexOf('<div class="mpx-fxn"><p class="mpt-nt"><b>Next time</b> Pull bigger.</p></div><p class="mpx-fxa">also</p>') < 0 || f.indexOf('data-mpxv="cmp"') < 0) bad('Fix first is no longer a box with its title, its Next time line, the mistakes inside its pulls and the link to Compare');
    if (f.indexOf('<b class="mpx-vr">1:30</b><span class="mpx-fxsl">of your 5:35 behind</span>') < 0 || f.indexOf('Where your 5:35 went ›') < 0) bad('Fix first no longer ties its number to the key\'s gap ("1:30 of your 5:35 behind", "Where your 5:35 went")');
    if (X.mpxFix([{ t: 'Trash', s: 90, c: 'trash' }, 1], false, true, { gap: 60 }).indexOf('<span class="mpx-fxsl">behind the fast run</span>') < 0) bad('Fix first says "1:30 of your 1:00 behind" when one stretch lost more than the whole gap');
    const g = X.mpxFix([{ t: 'One death', s: 15, c: 'death' }, 0], false, true, null); if (g.indexOf('<b class="mpx-vg">0:15</b><span class="mpx-fxsl">back on the timer</span>') < 0 || g.indexOf('Where the time went ›') < 0) bad('a fix that gives time back on the timer no longer says how much');
    if (X.mpxFix([{ t: 'Kick Bolt', s: 0, n: 7, c: 'kick' }, 0], false, true, null).indexOf('<b class="mpx-vk">7</b><span class="mpx-fxsl">casts went off</span>') < 0) bad('a fix counted in casts no longer says "7 casts went off" (a bare number needs its name)');
    if (X.mpxFix(null, true, true, null).indexOf('mpt-shim') < 0 || !/^<div class="mpx-fix mpx-fx2">/.test(X.mpxFix(null, true, true, null))) bad('Fix first has no placeholder box while the fast run loads (the page jumps when it arrives)');
    if (X.mpxFix(null, false, true, null) !== '') bad('Fix first shows an empty box on a key with nothing to fix');
    if (X.mpxFix([{ t: 'Trash', s: 90, c: 'trash', d: 'You took 6 pulls there.' }, 1], false, true, { nt: '' }).indexOf('<div class="mpx-fxn"><p class="mpx-fxd">You took 6 pulls there.</p></div>') < 0) bad('a fix with no Next time line leaves the Fix first box a title alone (it says its plain facts instead)'); }
  // 6. Also in these pulls: the mistakes inside the fix's pulls, each opening its list; none of the fix's own kind
  { const D = D0(); D.death.push({ t: 50, at: '0:50', i: 2, who: 'Ann', d: { to: 'Slam' } }, { t: 190, at: '3:10', i: 9, who: 'Bob', d: { to: 'Slam' } }); D.close.push({ t: 52, at: '0:52', i: 2, who: 'Bob', left: 7, spell: 'Slam', ready: [] }, { t: 33, at: '0:33', i: 1, who: 'Ann', left: 9, spell: 'Slam', ready: [] });
    const R = { pulls: P, _C: C, _D: D }, al = X.mpxAlso(R, null, { t: 'Trash', ps: [1, 2], c: 'trash' });
    if (al.indexOf('Also in these pulls') < 0 || al.indexOf('data-mpxk="death">1 death</button>') < 0 || al.indexOf('data-mpxk="close">2 close calls</button>') < 0) bad('Fix first no longer says which mistakes happened inside its pulls ("Also in these pulls: 1 death · 2 close calls")');
    if (X.mpxAlso(R, null, { t: 'The boss', ps: [2], c: 'boss' }).indexOf('Also in this pull<') < 0) bad('Fix first says "Also in these pulls" under a fix that is one pull or one boss (the patch review, Nov 14)');
    { const D2 = D0(); D2.cd.push({ t: 50, at: '0:50', i: 2, names: ['Ann'], dur: 60 }); if (X.mpxAlso({ pulls: P, _C: C, _D: D2 }, null, { ps: [2], c: 'trash' }).indexOf('1 pull with a big cooldown not pressed') < 0) bad('"Also in these pulls" says a pull had no big cooldown when one player held theirs (it must say "a big cooldown not pressed", as its list does; the patch review, Nov 14)'); }
    if (X.mpxAlso(R, null, { t: 'Kick Slam', ps: [2], c: 'kick', sp: 'Slam', s: 15 }).indexOf('data-mpxk="death"') >= 0) bad('a kick fix lists its own deaths again under "Also in these pulls" (the deaths to the spell it is about; the patch review, Nov 14)');
    if (X.mpxAlso(R, null, { t: 'Deaths', ps: [2], c: 'death' }).indexOf('data-mpxk="death"') >= 0) bad('a fix that is about deaths lists its own deaths again under "Also in these pulls"');
    if (X.mpxAlso(R, null, { t: 'Standing between pulls', c: 'stand' }) !== '' || X.mpxAlso(R, null, { t: 'Trash', ps: [5, 6], c: 'trash' }) !== '') bad('"Also in these pulls" shows for a fix with no pulls or with nothing in them'); }
};
