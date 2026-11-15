// Raid review's Graphs > Debuffs: the small "avoidable" word after a debuff's name (and the Avoidable filter) never got the boss's own
// avoidable rules, and in All pulls it stopped after the first pull. The list (AV314 in src/ui.js, added Oct 30 in d0070117) read a bare
// PACKS, but PACKS lives inside engine.js; the page only has E.PACKS. It threw "PACKS is not defined" on every Graphs open and an empty catch
// hid it. Found in the quiet-bug hunt (Nov 15, overnight) by a free-name scan of ui.js, then caught on an instrumented page: on the answer key's
// night (Gax3AkbyFRXmdrgQ) The Coiled Altar's All pulls showed no "avoidable" word at all.
// Part 1 fails when src/ui.js, or a file the build splices inside it (guides.js, mptab.js, sidenav.js), uses a bare PACKS.
// Part 2 runs the page's own AV314 line in a vm on two pulls of one boss and checks that the boss's rule names and the second pull's names land.
// quiet-bugs.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietGraphsAvoidableTag(say, H) {
  const bad = (m) => say('Graphs', 'Debuffs avoidable tag', m);
  const SRC = path.join(__dirname, '..', 'src');
  // part 1: no bare PACKS (comments and strings aside) in ui.js or the files spliced into it
  let ui = '';
  for (const f of ['ui.js', 'guides.js', 'mptab.js', 'sidenav.js']) {
    let t; try { t = fs.readFileSync(path.join(SRC, f), 'utf8'); } catch (e) { if (f === 'ui.js') bad('could not read src/ui.js'); continue; }
    if (f === 'ui.js') ui = t;
    if (/(?:const|let|var)\s+PACKS\b/.test(t)) continue; /* (a file that makes its own PACKS may use it) */
    t.split('\n').forEach((l, i) => {
      const c = l.replace(/\/\*.*?\*\//g, '').replace(/(^|\s)\/\/.*$/, '');
      if (/(^|[^.\w$'"`])PACKS(?![\w$'"`])(?!\s*:)/.test(c)) bad('src/' + f + ' line ' + (i + 1) + ' uses a bare PACKS, which only engine.js can see (the page has E.PACKS), so it stops with "PACKS is not defined"');
    });
  }
  if (!ui) return;
  // part 2: the page's own line, two pulls of one boss
  const E = (H && H.E) || (() => { try { return require(path.join(SRC, 'engine.js')); } catch (e) { return null; } })();
  if (!E || !Array.isArray(E.PACKS)) { bad('could not load the boss rules (E.PACKS) from src/engine.js'); return; }
  const a = ui.indexOf('const AV314 = new Set();');
  if (a < 0) { bad('could not find the Debuffs avoidable list (const AV314 = new Set();) in src/ui.js'); return; }
  const c0 = ui.indexOf('} catch (e)', a), o0 = c0 < 0 ? -1 : ui.indexOf('{', c0 + 1), z = o0 < 0 ? -1 : ui.indexOf('}', o0 + 1);
  if (z < 0 || ui.slice(a, z).includes('\n')) { bad('could not cut the Debuffs avoidable list (its try and catch on one line) out of src/ui.js'); return; }
  const stmt = ui.slice(a, z + 1);
  const pk = E.PACKS.find((p) => (p.rules || []).some((q) => q.type === 'avoidable'));
  if (!pk) { bad('no boss in E.PACKS has an avoidable rule, so the Debuffs avoidable list could not be checked'); return; }
  const want = pk.rules.filter((q) => q.type === 'avoidable').map((q) => String(q.name).toLowerCase());
  const mk = (pull, label) => ({ item: { boss: pk.encounter, pull }, module: { sections: [{ id: 'avoid', groups: [{ names: [label.toLowerCase()], label }] }] } });
  const ctx = vm.createContext({ E, REPS: [mk(1, 'First pull splash'), mk(2, 'Second pull splash')] });
  let got;
  try { got = vm.runInContext('(() => { ' + stmt + '\nreturn [...AV314]; })()', ctx, { timeout: 1000 }); } catch (e) { bad('the Debuffs avoidable list could not run ("' + e.message + '")'); return; }
  if (!got.includes('first pull splash')) bad(pk.encounter + ', two pulls: the first pull\'s avoidable names are not tagged avoidable');
  if (!got.includes('second pull splash')) bad(pk.encounter + ', two pulls: the second pull\'s avoidable names are not tagged, so All pulls stops after the first pull');
  const miss = want.filter((n) => !got.includes(n));
  if (miss.length) bad(pk.encounter + ': the boss\'s own avoidable rules (' + miss.join(', ') + ') are not tagged avoidable on Graphs > Debuffs');
};
