// Egg touches said as the log shows them (Nov 14, raid-night rehearsal of Wolfthorn Thu Nov 12 Ula'tek pull 13, report Gax3AkbyFRXmdrgQ fight 23).
// The bug: Summary's root cause read "Egg carriers came within 3 yards of each other twice (Dragooned at 1:47, nearest carrier Boltzzx about 4 yards
// away; Schooty and Volkovod at 2:13)": a touch and "4 yards away" in one sentence. The log shows the 1:47 Noxious Splash on Dragooned alone (Boltzzx's
// shell came off at his death, 2.6 s later). And How it went's 1:47 row, "Dragooned's egg went off", ended "Caused by Dragooned, Schooty and Volkovod",
// though Schooty's and Volkovod's shells came off at 2:12.5. Pull 12 (fight 22) had the same "Caused by" on its 0:30 row (the 0:38 trio named there).
//   A. A carrier alone is never said to have come within 3 yards: no "within 3 yards" clause names a carrier "about N yards away" with N over 3.
//   B. Pull 13 says Dragooned's egg went off at 1:47 by itself, and Schooty and Volkovod touched at 2:12 (the splash that killed Schooty), not 2:13.
//   C. When a root cause has several egg moments, each row names its own carriers: the page adds no "Caused by" naming carriers the root row doesn't.
// Runs on every build from tests/contradictions.js; alone: node tests/ula-egg-touch.js (exit 1 on a problem). Needs the log library; without it, it passes.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function ulaEggTouch(H, say) {
  const LIB = process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs', code = 'Gax3AkbyFRXmdrgQ', E = H.E, W = require(path.join(__dirname, '..', 'src', 'wcl.js'));
  const find = (n) => [path.join(LIB, 'events', n), path.join(LIB, 'reports', n)].find((f) => fs.existsSync(f)), rf = find('rep_' + code + '.json'); if (!rf) return 0;
  let rr = JSON.parse(fs.readFileSync(rf, 'utf8')); rr = rr.data || (rr.reportData ? rr.reportData.report : rr); const items = H.pullItems(code, rr, W);
  const SITE = H.site(['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT'], { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} });
  let n = 0;
  for (const fight of [22, 23]) { const it = items.get(fight), ef = find(code + '_' + fight + '.json'); if (!it || !ef) continue;
    let ev = JSON.parse(fs.readFileSync(ef, 'utf8')); if (!Array.isArray(ev)) ev = ev.events; const r = E.analyze(it, W.translate(it, ev), {}); ev = null; r.item = it; n++;
    const ci = SITE.cutInfo(r), c0 = ci && ci.call ? ci.call : ci, cut = c0 && c0.auto ? c0.t : null, rc = E.rootCause(r, c0 && c0.auto ? { cut, why: c0.why, at: c0.at, mn: c0.mn, ms: c0.ms } : { cut });
    const pull = "Wolfthorn Thu Nov 12 Ula'tek pull " + it.pull + ' (' + code + ':' + fight + ')', s = String((rc && rc.short) || '');
    // A.
    for (const cl of s.split(/;|\. |, and /)) { const far = /about (\d+) yards away/.exec(cl); if (far && +far[1] > 3 && /came within 3 yards/.test(cl)) say(pull, 'ulatek', 'the root cause says carriers came within 3 yards and, in the same breath, that the nearest was ' + far[1] + ' yards away: "' + s + '" (check A)'); }
    // B.
    if (fight === 23 && (!/Dragooned's egg went off at 1:47 \(the nearest other carrier, Boltzzx, was about \d+ yards away\)/.test(s) || !/Schooty and Volkovod came within 3 yards of each other at 2:12\b/.test(s)))
      say(pull, 'ulatek', 'the root cause should say Dragooned\'s egg went off at 1:47 by itself and Schooty and Volkovod touched at 2:12; it reads "' + s + '" (check B)');
    // C. (shell.html adds rc.bySay to the root row when that row doesn't name every carrier in rc.by)
    const c0r = rc && rc.chain && rc.chain[0], row = c0r ? String(c0r.txt || '') : '';
    if (rc && /^noxious splash$/i.test(rc.name || '') && rc.bySay && (rc.by || []).some((x) => row.indexOf(x) < 0))
      say(pull, 'ulatek', 'How it went\'s ' + E.fmtT(c0r.t) + ' row "' + row.replace(/\s*\(\d+:\d\d\)$/, '') + '" would end "' + rc.bySay + '", naming carriers whose eggs broke at another moment (check C)'); }
  return n;
};
if (require.main === module) { const P = []; const n = module.exports(require('./site-helpers.js'), (pull, kind, msg) => P.push(pull + ': [' + kind + '] ' + msg)); for (const p of P) console.log(p); console.log('Egg touch check: ' + n + ' pull(s), ' + (P.length ? P.length + ' problem(s)' : 'OK')); process.exit(P.length ? 1 : 0); }
