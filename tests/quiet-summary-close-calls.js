// Summary's score strip vanished on very short pulls (the quiet-bug hunt, Nov 15, overnight; seen in headless Chrome on Wolfthorn's
// Thu Nov 12 night, The Coiled Altar pull 1, report Gax3AkbyFRXmdrgQ fight 3, a 29 s reset where three raiders died before 0:10).
// The Report card's "Close calls answered" row (rqcOf in src/ui.js) set its source and its bar (kitCallF(KN)) on lines that sat OUTSIDE
// its "if (KN)" (from e5fb5949, Nov 12). A raider with no close-call data (kitNight gives null: dead in the first 10 seconds) threw
// "Cannot read properties of null (reading 'pulls')", the card's numbers gave up, and Summary drew no Pull score, Performance, Mechanics,
// Staying alive or Ready to raid. The same throw also wrote the Close calls source onto the row before it (Defensive before dying).
// This runs rqcOf's own Staying alive lines (from just after "const KN = kitNight(" up to "// your toolkit") in a vm with small stand-ins:
// with no close-call data nothing may throw and there is no Close calls row; with close-call data the row is there with its source and bar.
// quiet-bugs.js runs it on every build.
'use strict';
const vm = require('vm');
module.exports = function quietSummaryCloseCalls(say, H) {
  const bad = (m) => say('Summary', 'score strip', m);
  if (!H || typeof H.grab !== 'function') { bad('the site helpers did not load, so the Close calls row could not be checked'); return; }
  let card = '', kit = '';
  try { card = H.grab('rqcOf'); kit = H.grab('kitHsV'); } catch (e) { bad('could not read rqcOf or the close-call helpers (kitHsV, kitCallV, kitCallF, kitCallT) out of src/ui.js'); return; }
  const a = card.indexOf('const KN = kitNight('), b = a < 0 ? -1 : card.indexOf('// your toolkit', a);
  if (a < 0 || b < 0) { bad('could not find the Report card\'s Staying alive lines in rqcOf (after "const KN = kitNight(", before "// your toolkit")'); return; }
  const body = card.slice(card.indexOf('\n', a) + 1, b);
  if (!body.includes('\'Close calls answered\'')) { bad('the Close calls answered row is no longer in rqcOf\'s Staying alive lines'); return; }
  const run = (KN) => {
    const rows = { prep: [], mech: [], alive: [], kit: [], perf: [] };
    const add = (sec, s, l, rule, v, tt) => { const o = { s, l, rule, v, tt: tt || '' }; rows[sec].push(o); return o; };
    const ctx = vm.createContext({ KN, TD: null, DO: { on: [], all: [], n: 0 }, on: 0, n: 1, defR: 0, kitR: 0, rows, add,
      RC_SRC: { deaths: 'deaths', hs: 'hs', calls: 'calls', tdef: 'tdef' }, esc: String, T: String, deathHit: () => '',
      plural: (k, w) => k + ' ' + w + (k === 1 ? '' : 's'), andList: (l) => l.join(', ') });
    vm.runInContext(kit + '\n' + body, ctx, { timeout: 1000 });
    return rows.alive;
  };
  // (no close-call data for this raider, as on Nov 12's 29 s Coiled Altar reset: nothing thrown, no Close calls row, the row before it keeps its own source)
  let A = null;
  try { A = run(null); } catch (e) { bad('a raider with no close-call data (dead in the first 10 seconds) breaks the Report card ("' + e.message + '"), so Summary shows no scores for that pull (Thu Nov 12, The Coiled Altar pull 1)'); }
  if (A) {
    if (A.some((x) => x.l === 'Close calls answered')) bad('a raider with no close-call data still gets a Close calls answered row');
    const d = A.find((x) => x.l === 'Defensive before dying');
    if (d && d.src !== 'deaths') bad('with no close-call data, the Close calls source lands on the Defensive before dying row');
  }
  // (with close-call data: the row is there, linked to its home, and its bar is pulls with every close call answered over pulls played: 2 of 3)
  let B = null;
  try { B = run({ uses: 0, usePulls: 0, pulls: 3, lows: 2, quiet: 1, badPulls: 1 }); } catch (e) { bad('the Close calls answered row breaks for a raider with close-call data ("' + e.message + '")'); return; }
  const c = B.find((x) => x.l === 'Close calls answered');
  if (!c) bad('a raider with close-call data no longer gets a Close calls answered row');
  else if (c.src !== 'calls' || typeof c.f !== 'number' || Math.abs(c.f - 2 / 3) > 1e-9) bad('the Close calls answered row lost its link or its bar (2 of 3 pulls should read 67%)');
};
