// Mythic+, Survival off the Players tab and the page in fewer colours (Nov 15). Flex: "I feel like the survival section needs to just be removed. Its clutter
// at this point", then "keep survival in graphs though"; and "The mythic + tab as a whole feels hard to read, theres a lot of colors".
// This fails if: Survival comes back as a part of Players (or its code, its links or its look come back); an old link to Survival or Big hits stops opening
// Graphs on its Survival; a link to the big hits stops opening Debrief's close calls; Graphs loses its Survival or one of its four sections; or the page's
// colours go back to many: spell names purple or gold again, the pull squares in the map's colours away from the map, "Next time" green, grade colours on
// the numbers beside a badge, the pull-by-pull marks in blue and gold for things that are not deaths or close calls. Each part fails on acd07a20.
// contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusCalm(say) {
  const bad = (m) => say('Mythic+ page', 'Survival off, fewer colours', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('cannot read src: ' + e.message); return; }
  const one = (n) => { const m = s.match(new RegExp('\\nconst ' + n + ' = [^\\n]*?;')); if (!m) throw new Error('src/mptab.js has no ' + n); return m[0].trim(); };
  let T; try { T = vm.runInNewContext([one('MPX_VIEWS'), one('MPX_OLD'), one('MPX_NEED'), one('MPX_BYID'), one('MPX_GM'), s.match(/\nconst MPX_TABS = [^\n]*?;/)[0]].join('\n') + '\n({ MPX_VIEWS, MPX_OLD, MPX_NEED, MPX_BYID, MPX_GM, MPX_TABS, MPX_SUB })', {}); }
  catch (e) { bad('the key\'s tab lists no longer read by themselves: ' + String(e.message).slice(0, 140)); return; }
  // 1. Survival is off Players
  if (T.MPX_VIEWS.some(([v, l]) => v === 'sur' || l === 'Survival')) bad('Survival is a view of the key again (Flex, Nov 15: "I feel like the survival section needs to just be removed. Its clutter at this point")');
  if (T.MPX_SUB.map((x) => x[1]).join(' | ') !== 'Report card | Rotation') bad('the Players tab is not Report card and Rotation (Survival came off it, Nov 15)');
  if (T.MPX_NEED.sur || Object.values(T.MPX_BYID).includes('sur')) bad('a section still sends people to the Survival view, which is gone');
  for (const f of ['function mpxSurv(', 'function mpxSvGroups(', 'function mpxSvNums(', 'const mpxSvCell', 'mpxSurv(R, fx)', 'data-mpxv="sur"', 'id="mptCV"', 'Survival tab under Players']) if (s.indexOf(f) >= 0) bad('the Survival part\'s code or a link to it is back: ' + f);
  for (const f of ['#mptCV', 'mpsv-', '[data-mpv="sur"]']) if (css.indexOf(f) >= 0) bad('the Survival part\'s look is back in the page: ' + f);
  // 2. old links: Survival and Big hits open Graphs on its Survival; a link to the big hits opens Debrief's close calls
  if (T.MPX_OLD.sur !== 'gra' || T.MPX_OLD.hit !== 'gra') bad('an old link to Survival or Big hits (&mpv=sur, &mpv=hit) no longer opens Graphs');
  if (s.indexOf("if (v === 'hit' || v === 'sur') { MP.gm = 'def'; MP.gsv = 'd';") < 0) bad('an old link to Survival or Big hits opens Graphs on Damage done, not on its Survival (Flex: "keep survival in graphs though")');
  if (s.indexOf("const mpxGoId = (id) => { if (!MPC_ON && id === 'mptCH') { mpxMis('close'); return; }") < 0) bad('a link to the big hits no longer opens Debrief\'s close calls on the website');
  { const i = s.indexOf('function mpxView(v) {'), j = s.indexOf('mpxOpen(); }', i), body = s.slice(i, j + 12).replace(/'[^']*'/g, "''").replace(/\/\*[\s\S]*?\*\//g, '');
    if (i < 0 || j < 0 || /\bhit\b/.test(body)) bad('the tab switcher uses a name it no longer has ("hit"): every tab click would stop with an error (found while building it, Nov 15)'); }
  // 3. Graphs keeps its Survival, with its four sections
  const gm = T.MPX_GM.find((x) => x[0] === 'def'); if (!gm || gm[1] !== 'Survival') bad('Graphs lost its Survival (Flex, Nov 15: "keep survival in graphs though")');
  if (s.indexOf('function mpgSurv(sec, X)') < 0 || s.indexOf("[['d', 'Defensives'], ['h', 'Healthstones, potions & self-heals'], ['p', 'Combat potions'], ['l', 'Health over the key']]") < 0) bad('Graphs\' Survival lost one of its sections (Defensives; Healthstones, potions and self-heals; Combat potions; Health over the key)');
  // 4. fewer colours: the block, and each rule in it
  const a = css.indexOf('/* Mythic+, fewer colours (Nov 15'), z = a < 0 ? -1 : css.indexOf('\n}\n', a), blk = a < 0 || z < 0 ? '' : css.slice(a, z + 3), V = 'html:not(.mpcard) body #view#view#view #mptBody#mptBody ';
  if (!blk) { bad('the fewer-colours look is gone (Flex, Nov 15: "theres a lot of colors")'); return; }
  if (css.lastIndexOf('<style') > a || css.lastIndexOf('<style id="look-nov13">') !== css.lastIndexOf('<style') || blk.indexOf('@layer defaultTheme {') < 0) bad('the fewer-colours look is not inside the last style\'s default layer');
  const has = (sel, decl, why) => { if (blk.indexOf(V + sel) < 0 || blk.indexOf(decl, blk.indexOf(V + sel)) < 0 || blk.indexOf(decl, blk.indexOf(V + sel)) > blk.indexOf('}', blk.indexOf(V + sel))) bad(why); };
  has(':is(#mptCD, #mptCA, #mptCP, #mptCCv, #mptCM, #mptCC, #mptC5) b.mpt-ab', 'color: #eef0f3 !important;', 'spell and enemy names are purple again, not bold white as on every other page');
  has('#mptCD b.mpdb-sp', 'color: #eef0f3 !important;', 'a spell name in the key pull by pull is gold again');
  has('#mptCD i.mpdb-sq', 'background: rgba(255,255,255,.32) !important;', 'the pull squares on Debrief are in the map\'s colours again, with no map beside them');
  has('#mptCD .mpdb-e:not(.mpdb-bad) > .mpdb-ei', 'color: var(--muted) !important;', 'the pull-by-pull marks are blue and gold again for things that are not deaths or close calls');
  has(':is(#mptCD, #mptCA, #mptCP, #mptCM, #mptCC) p.mpt-nt:not(.mpt-ntd) > b:first-child:not(.mpt-nm):not([style])', 'color: #d4b77d !important;', '"Next time" is green again (green is a good result; Next time is Debrief\'s voice, gold), or the gold reaches a death line and turns the dead player\'s class-coloured name gold (found by the fresh reviewers, Nov 15)');
  has('#mptCD .mpdb-e:not(.mpdb-bad) > .mpdb-ei', 'filter: grayscale(1) !important;', 'Lust\'s ⚡ is orange again on Debrief: it draws as a coloured emoji that ignores the text colour (found by the fresh reviewers, Nov 15)');
  has('#mptCD .mprn-n', 'color: #eef0f3 !important;', 'the Next key list\'s numbers are gold again');
  has('#mptCP .rcb-st b', 'color: #eef0f3 !important;', 'a grade\'s colour is on the number beside its badge again');
  has('#mptCP b.mpr-dps', 'color: #eef0f3 !important;', 'the players table\'s DPS is in parse colours again');
  has('#mptCP em.rqc-pc.ok', 'color: var(--muted) !important;', 'every passed check\'s 100% is green again');
  has('#mptCM :is(b.mrs-p, b.mrs-tp)', 'color: #eef0f3 !important;', 'the route score\'s numbers are coloured again (their bars carry the colour)');
  if (/#mptCG|#mptCR|\.mrp/.test(blk)) bad('the fewer-colours look reaches Graphs, Rotation or the replay, which keep their own colours');
  if (/rgb\(195, ?155, ?255\)|#c39bff|purple/i.test(blk.replace(/\/\*[\s\S]*?\*\//g, ''))) bad('the fewer-colours look sets a purple');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ page, Survival off and fewer colours: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
