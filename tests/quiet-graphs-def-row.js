// Raid review's Graphs: opening or closing a row on the Defensives card (or "Healthstones, potions & self-heals") threw
// "ReferenceError: S is not defined", so the open row was never remembered and snapped shut on the next redraw (a phase or length button,
// the search box). Found in the quiet-bug hunt (Nov 15, overnight) by a free-name scan of ui.js, and seen at runtime on Wolfthorn's Nov 11 and
// Nov 12 nights. The toggle listener (window.__g8so, added Nov 9 in 70987dbf) sat after the end of ui.js's big closure, where the page's state S
// doesn't exist. Its twin, the Buffs row (window.__g8bo), had the same bug and was fixed on Nov 14 (5f794474, tests/graphs-buff-row.js).
// This finds where ui.js's closure ends (the first "})();" line where the file so far is a whole program), then runs the listener's own line
// where it sits: inside the closure it sees the page state S, outside it sees none. Toggling rows the way the browser does must remember
// and forget the open row in S.gbSvOpen without throwing. quiet-bugs.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietGraphsDefRow(say) {
  const bad = (m) => say('Graphs', 'Defensives row', m);
  let L; try { L = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8').split('\n'); } catch (e) { bad('could not read src/ui.js'); return; }
  let end = null;
  for (let i = 0; i < L.length; i++) if (/^\}\)\(\);?\s*$/.test(L[i])) { try { new vm.Script(L.slice(0, i + 1).join('\n')); end = i + 1; break; } catch (e) { /* (still inside) */ } }
  const at = L.findIndex((l) => l.includes('window.__g8so = 1')) + 1;
  if (!at) { bad('could not find the Defensives row listener (window.__g8so) in src/ui.js'); return; }
  if (!end) { bad('could not find where ui.js\'s closure ends'); return; }
  const inside = at <= end;
  // (the listener's line, run with a stand-in document; S is there only when the line sits inside the closure, as on the page)
  const S = {}, win = {}, doc = {}; let fn = null;
  doc.addEventListener = (type, f) => { if (type === 'toggle') fn = f; };
  const ctx = vm.createContext({ window: win, document: doc, __S: S });
  try { vm.runInContext(inside ? '(function () { const S = __S;\n' + L[at - 1] + '\n})();' : L[at - 1], ctx, { timeout: 1000 }); } catch (e) { bad('the Defensives row listener breaks when the page sets it up ("' + e.message + '")'); return; }
  if (!fn) { bad('the Defensives row listener no longer listens for rows opening and closing'); return; }
  const row = (key, open, on) => ({ target: { classList: { contains: (c) => c === 'g8-svd' }, dataset: { g8so: key }, open, isConnected: on } });
  try {
    fn(row('d:Komo', true, true)); if (S.gbSvOpen !== 'd:Komo') bad('opening a Defensives row is not remembered, so it snaps shut on the next redraw');
    fn(row('d:Komo', false, false)); if (S.gbSvOpen !== 'd:Komo') bad('a redraw (the old row leaving the page) forgets the open Defensives row');
    fn(row('d:Komo', false, true)); if (S.gbSvOpen !== null) bad('closing the open Defensives row by hand is not remembered, so it pops back open');
    fn(row('h:Komo', true, true)); if (S.gbSvOpen !== 'h:Komo') bad('opening a self-heals row is not remembered');
  } catch (e) {
    bad('opening or closing a Defensives row breaks ("' + e.message + '"), so the open row is never remembered' + (inside ? '' : ': the listener sits outside ui.js\'s closure (line ' + at + ', the closure ends at line ' + end + '), where the page state S doesn\'t exist'));
  }
};
