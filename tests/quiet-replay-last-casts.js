// Debriefing's Timeline replay: the followed player's "Last casts" card still listed casts nobody pressed, so a Holy Paladin's last three
// casts were mostly Reclamation. Flex, Nov 12: "reclamation is also still being included in holy paladin casts". Commit f7d344b5 added a
// filter on TL_NOT_PRESSED, but that list is a const inside ui.js's big closure and the card's code sits after the closure ends, where the
// name doesn't exist: "typeof TL_NOT_PRESSED !== 'undefined'" was always false and the filter never ran.
// Found by the quiet-bug hunt (Nov 15, overnight). The fix: the closure puts the list on window (window.TL_NOT_PRESSED) and the card reads it.
// This check (1) makes sure that window line is inside the closure, then (2) runs the card's real cast loop, cut out of src/ui.js, at the
// page's top level (where only window names are seen), next to the closure's real list lines, with a Holy Paladin's casts, and fails if
// Reclamation or Shadowy Apparition is still one of the three. quiet-bugs.js runs it on every build (contradictions.js runs quiet-bugs.js).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietReplayLastCasts(say) {
  const bad = (m) => say('Timeline replay', 'Last casts', m);
  let L; try { L = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8').replace(/\r\n/g, '\n').split('\n'); } catch (e) { bad('could not read src/ui.js'); return; }
  // (where the big closure ends: the first "})();" line where the file so far is a whole program, as tests/graphs-buff-row.js finds it)
  let end = null;
  for (let i = 0; i < L.length; i++) if (/^\}\)\(\);?\s*$/.test(L[i])) { try { new vm.Script(L.slice(0, i + 1).join('\n')); end = i + 1; break; } catch (e) { /* (still inside) */ } }
  if (!end) { bad('could not find where ui.js\'s closure ends'); return; }
  const inside = L.slice(0, end), after = L.slice(end);
  const cpm = inside.find((l) => /^\s*const CPM_PROCS\s*=/.test(l)), np = inside.find((l) => /^\s*const TL_NOT_PRESSED\s*=/.test(l));
  if (!cpm || !np) { bad('could not find the CPM_PROCS and TL_NOT_PRESSED lists inside ui.js\'s closure'); return; }
  // (1) the list must be put on window from inside the closure, where the name is seen
  const onWin = inside.join('\n').match(/\bwindow\.TL_NOT_PRESSED\s*=\s*TL_NOT_PRESSED\b\s*;?/);
  if (!onWin) bad('the casts nobody pressed (TL_NOT_PRESSED) are never put on window inside ui.js\'s closure, so the replay\'s Last casts card can\'t see them');
  // (2) the card's real line: after the closure, the one that walks p.castTg and keeps three casts
  const card = after.find((l) => l.includes('var ct = p.castTg') && l.includes('cs.push(c)')) || L.find((l) => l.includes('var ct = p.castTg') && l.includes('cs.push(c)'));
  if (!card) { bad('could not find the replay\'s Last casts line (var ct = p.castTg ... cs.push(c)) in src/ui.js'); return; }
  // (the page's top level: window is the global object; the closure's lines run inside a function, like the closure)
  const ctx = vm.createContext({}); ctx.window = ctx;
  try { vm.runInContext('(function () { \'use strict\';\n' + cpm + '\n' + np + '\n' + (onWin ? onWin[0] : '') + '\n})();', ctx); }
  catch (e) { bad('could not run the closure\'s TL_NOT_PRESSED lines: ' + e.message); return; }
  let set = null; try { set = vm.runInNewContext('(function () {\n' + cpm + '\n' + np + '\nreturn TL_NOT_PRESSED; })()', { window: {} }); } catch (e) { set = null; }
  if (!set || typeof set.has !== 'function' || !set.has('reclamation') || !set.has('shadowy apparition')) { bad('TL_NOT_PRESSED no longer lists Reclamation and Shadowy Apparition, so this check can\'t tell whether the card leaves them out'); return; }
  ctx.p = { castTg: [[10, 'Holy Shock', 0], [11, 'Reclamation', 0], [12, 'Melee', 0], [13, 'Judgment', 0], [13.2, 'Reclamation', 0], [14, 'Shadowy Apparition', 0], [15, 'Word of Glory', 0], [15.1, 'Reclamation', 0]] };
  ctx.ft = 16;
  try { vm.runInContext(card.slice(card.indexOf('var ct = p.castTg')), ctx); } catch (e) { bad('the replay\'s Last casts line threw: ' + e.message); return; }
  const got = (ctx.cs || []).map((c) => c[1]), want = ['Word of Glory', 'Judgment', 'Holy Shock'];
  if (got.join('|') !== want.join('|')) bad('a Holy Paladin\'s Last casts read "' + got.join(', ') + '", should be "' + want.join(', ') + '": casts nobody pressed (Reclamation) still show (Flex, Nov 12)');
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c)); console.log(P.length ? P.join('\n') : 'Timeline replay Last casts: OK'); process.exitCode = P.length ? 1 : 0; }
