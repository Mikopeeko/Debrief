// Mythic+ page, the fresh-eyes review of Nov 16 (Flex: "Fresh-eyes review"; four reviewers, one lens each: trust 6/10, clarity 6, looks 7, logic 7, on his
// Kings' Rest +19). Each finding below was checked against the code and the log before it was fixed. This fails if one comes back:
// 1. the "push damage" line names the healer (his damage is about 5% of the group's, and his own card and Rotation praise it);
// 2. the Report card's "furthest behind their spec" names the healer the same way, or says "Everyone was ahead" while someone isn't;
// 3. the run's hover names who was behind "the fast run" without saying it's the same spec in the fast run (so it read as contradicting the grade line);
// 4. a pull's hover gives times on the key's timer with a death's seconds in them, and a length that doesn't subtract, with nothing saying so;
// 5. a death after a pull ended reads as "Pull 6" (the Route says "after pull 6");
// 6. the group totals count dispels only (18) while the group's Dispels column counts dispels and purges (36);
// 7. "Defensives on big hits" says "14 pressed · 3 missed" beside 57% (that is 4 of 7 big hits covered);
// 8. the Report card's Staying alive hover says close calls are graded and defensives aren't (the card grades it the other way round);
// 9. the group banner says "Best: Leafeon 100" when everyone scored 100;
// 10. Know this dungeon ticks a debuff green ("never left on too long") that killed a player;
// 11. a boss fight "only 0:16 slower" when its two times, as shown, are 17 s apart.
// contradictions.js runs it on every build. Each part fails on f4b9fc60.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function mplusReviewNov16(say) {
  const bad = (m) => say('Mythic+ page', 'the fresh-eyes review, Nov 16', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const has = (t, why) => { if (s.indexOf(t) < 0) bad(why); };
  has(".filter((x) => x.vs && x.vs.pct < 0 && ((x.p || {}).role || 'dps') !== 'healer')", '1. the "push damage" line can name the healer for the group\'s low damage');
  has("const VD = V.filter((x) => (x.p.role || 'dps') !== 'healer'), low = (VD.length ? VD : V).slice().sort((a, b) => a.v.pct - b.v.pct)[0];", '2. the Report card\'s "furthest behind their spec" can name the healer');
  has(": V.every((x) => x.v.pct >= 0) ? 'Everyone was ahead of the middle player of their spec.' : '') : ''].filter(Boolean);", '2. the Report card can say "Everyone was ahead" while the healer is behind');
  has("' furthest behind the same specs in the fast run.'", '3. the run\'s hover names who was behind "the fast run" without saying it is the same specs in it');
  has("' on the timer · ' + mpMM(p.dur) + ' long' + (Math.round(b - a - p.dur) >= 5 ? ' (a death added ' + mpMM(Math.round(b - a - p.dur)) + ' to the timer)' : '')", '4. a pull\'s hover gives timer times with a death in them and a length that does not subtract, with nothing saying so');
  has("(R.pulls[i] && d.t > R.pulls[i].e + 1 ? 'After ' + esc(mpPullName(R, i)) : esc(mpCap(mpPullName(R, i))))", '5. a death after a pull ended reads as in that pull');
  has("plural(S((p) => p.dispels), 'dispel'), (S((p) => p.purges) === 1 ? '1 purge or soothe' : S((p) => p.purges) + ' purges or soothes'),", '6. the group totals count dispels only while the Dispels column counts dispels and purges');
  has("(cov + miss ? cov + ' of ' + (cov + miss) + ' big hits covered · ' : '') + (p.defs || 0) + ' pressed'", '7. "Defensives on big hits" shows numbers that do not make its percent');
  has("'The card\\'s Staying alive: deaths, defensives on big hits and health potions; close calls are shown, not graded'", '8. the Staying alive hover says the opposite of what the card grades');
  has("(tN === l0.length && tN > 1 ? 'Everyone: ' + Math.round(top.secSc[k])", '9. the group banner names one "Best" player when everyone tied');
  has("DK = D.death.filter((d) => lc(mpxTo(d.d && d.d.to)) === lc(s)), J = DK.length ? { st: 'n', r: 'killed ' + who(DK.map((d) => d.who)) }", '10. Know this dungeon can tick green a debuff that killed a player');
  has('const d = Math.round(p.dur) - Math.round(fq.dur), q = d / fq.dur;', '11. a boss fight\'s gap to the fast run is worked out before rounding, so it can disagree with its two times as shown');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ fresh-eyes review fixes: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
