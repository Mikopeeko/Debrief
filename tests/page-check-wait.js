// The build's page check gives the same answer every run (Nov 15; found by the Nov 14 raid-night rehearsal).
// The bug: "page check: 11 pull(s) ... (N with a root cause)" read 9, 10 or 11 on the same build. The first pulls of a run (three tabs starting at once in a
// hidden browser) sometimes took over 45 s to show anything; tests/header-page.mjs gave up at 45 s and counted the blank page as "no root cause", with no problem.
// Caught on Nov 15: The Coiled Altar Oct 21 pulls (HWFBkCyc6JNazQrK 10 and 14) showed nothing for 45 s, then their root cause 2 s later.
// This reads tests/header-page.mjs itself (it needs a browser, so it can't run here): a pull that never shows must be a problem, the wait must be long,
// and background tabs must run at full speed. Run by tests/contradictions.js on every build.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function pageCheckWait(say) {
  const bad = (m) => say('page check', 'steady answer', m);
  let s = ''; try { s = fs.readFileSync(path.join(__dirname, 'header-page.mjs'), 'utf8'); } catch (e) { bad('tests/header-page.mjs is missing'); return; }
  if (!/if \(!open\) return \{ p, fail:/.test(s)) bad('a pull that never shows in the browser is no longer a problem: it would count as "no root cause" again (the 9, 10 or 11 of Nov 14)');
  const m = /for \(let i = 0; i < (\d+); i\+\+\) \{ await sleep\(500\); o = JSON\.parse/.exec(s); if (!m || +m[1] < 240) bad('the wait for a pull to show is under 2 minutes (' + (m ? +m[1] / 2 + ' s' : 'not found') + '); the slow first pulls took over 45 s');
  for (const f of ['--disable-background-timer-throttling', '--disable-renderer-backgrounding']) if (!s.includes(f)) bad('the browser no longer starts with ' + f + ': background tabs slow down again');
  if (!/same >= \(o\.root \? 2 : 9\)/.test(s)) bad('the answer is no longer read only once it holds still');
};
