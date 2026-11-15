// The estimated parse against Warcraft Logs' own wipe Parse % (Nov 13, ruling B, Main: "every raider within about 10 points, no one more than 15 above. Kills stay within
// 5 of the real parse ... guard it in tests/parse-estimate.js with those five raiders named").
// Ours: each phase a raider played (up to the wipe call, while alive) ranked on its own table (the spec's kill rankings times the spec's own share of its kill output in that
// phase, PHASE_FAC, from every kill in the log library), the ranks combined by time alive (Flex's design: time dead doesn't lower it). This runs the page's own estCombine
// on saved pieces (tests/fixtures/agt6_ca_estpull.json, from the engine's estPull of every pull). Warcraft Logs' numbers were read from its report pages on Nov 13.
// The Nov 11 Coiled Altar night is the guard: every raider within GAP, nobody more than OVER above, the average under MEAN, and Main's five named. Before B, one factor per
// phase for every damage dealer read Schooty 79 (Warcraft Logs 36), Volkovod 86 (53), Dragooned 80 (54), Komo 83 (59), Fourinches 72 (59). Warcraft Logs' percentiles drift
// as more guilds kill the boss, so tables read weeks later move these a few points.
// Nov 12 Ula'tek is printed, not checked: Warcraft Logs' wipe Parse % there doesn't follow its own kill rankings (Fourinches' 196K a second reads 54, the Frost Death Knight
// kill median is 355K) and its Ula'tek damage table doesn't match the raw log per player, so no estimate from the log can land on it (reported to Main, Nov 13).
// node tests/parse-estimate.js (contradictions.js runs it on every build)
'use strict';
const fs = require('fs'), path = require('path');
const GAP = 15, OVER = 15, MEAN = 8;
const WCL = { Fourinches: 59, Komo: 59, Zaffia: 48, Hobbz: 53, Shockabunga: 58, Dragooned: 54, Kargaryen: 27, Raiyvenz: 36, Volkovod: 53, Larryg: 35, Boltzzx: 45, Dashtoswirly: 30, Schooty: 36, Jangokin: 36, Vandagos: 55, Tyralien: 72 };
const WCLH = { 'Flëxørçïst': 85, Huservoker: 64, Optt: 45, Urgdragon: 11 };
const NAMED = { Schooty: 79, Volkovod: 86, Dragooned: 80, Komo: 83, Fourinches: 72 }; /* (what each read before B) */
const ULA = { Jangokin: 6, Zaffia: 7, Kargaryen: 7, Shockabunga: 14, Dashtoswirly: 32, Fourinches: 54, Raiyvenz: 42, Phartsy: 8, Boltzzx: 28, Volkovod: 22, Dragooned: 21, Komo: 23, Larryg: 19, Schooty: 15, Vandagos: 59 };
function run(H, say, quiet) {
  const log = quiet ? () => {} : console.log, X = H.site(['PARSE_PCT', 'PARSE_TAB', 'PHASE_FAC', 'parseAt', 'phFacOf', 'estCombine']);
  const F = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'agt6_ca_estpull.json'), 'utf8')), nm = (p) => String(p || '').split('-')[0];
  const pulls = (L) => (L || []).map((x) => ({ bk: x.bk, kill: !!x.kill, list: x.list.map(([n, sp, role, ph]) => ({ n, sp, role, ph })) })), byN = (m) => new Map([...m].map(([k, v]) => [nm(k), v]));
  const est = byN(X.estCombine(pulls(F.d))), estH = byN(X.estCombine(pulls(F.h))), bad = (m) => say('the estimated parse', 'parse', m); let gaps = 0, n = 0;
  log('Estimated parse, The Coiled Altar Mythic, Nov 11, 19 wipes (ours / Warcraft Logs\' Parse %)');
  for (const [who, want] of Object.entries(WCL)) { const x = est.get(who), got = x ? x.pct : null; if (got == null) { bad(who + ', Nov 11: no estimate (' + (x && x.none ? 'no table for ' + x.spec : 'missing') + ')'); continue; }
    const off = got - want; gaps += Math.abs(off); n++; log('  ' + who.padEnd(13) + String(x.spec).padEnd(22) + String(got).padStart(4) + ' /' + String(want).padStart(3) + '   ' + (off >= 0 ? '+' : '') + off + (NAMED[who] != null ? '   (was ' + NAMED[who] + ')' : ''));
    if (off > OVER) bad(who + ', Nov 11: the estimate reads ' + got + ', Warcraft Logs ' + want + ' (' + off + ' above; no one may be more than ' + OVER + ' above)' + (NAMED[who] != null ? '. Before ruling B it read ' + NAMED[who] : ''));
    else if (Math.abs(off) > GAP) bad(who + ', Nov 11: the estimate reads ' + got + ', Warcraft Logs ' + want + ' (' + off + ')'); }
  if (n && gaps / n > MEAN) bad('Nov 11: the estimate is ' + (gaps / n).toFixed(1) + ' points from Warcraft Logs on average (it was 6.4 at ruling B, 12.4 before)');
  for (const [who, want] of Object.entries(WCLH)) { const x = estH.get(who), got = x ? x.pct : null; log('  healer ' + who.padEnd(13) + String(got).padStart(4) + ' /' + String(want).padStart(3)); if (got == null || Math.abs(got - want) > GAP) bad('healer ' + who + ', Nov 11: the estimate reads ' + got + ', Warcraft Logs ' + want); }
  /* (Main's five, by name: none may read more than OVER above Warcraft Logs again) */
  for (const [who, was] of Object.entries(NAMED)) { const x = est.get(who); if (x && x.pct != null && x.pct - WCL[who] > OVER) bad(who + ' reads ' + x.pct + ' again (Warcraft Logs ' + WCL[who] + '; ' + was + ' before ruling B)'); }
  /* (Nov 12 Ula'tek: printed only, the reason is at the top) */
  if (F.ud) { const u = byN(X.estCombine(pulls(F.ud))); log('Nov 12 Ula\'tek, 13 wipes, printed only (Warcraft Logs\' wipe numbers there don\'t follow its own rankings):'); log('  ' + Object.entries(ULA).map(([w, v]) => w + ' ' + ((u.get(w) || {}).pct) + '/' + v).join(', ')); }
  /* (Nov 13, Main: "a made-up raider whose phase 1 damage per second sits at a spec's median ... must read about 50 (±5), and one at the 90th percentile about 90", for
     three specs on Ula'tek. Our method by our own rule, where Warcraft Logs' wipe numbers disagree: a raider who played 5 minutes of phase 1 at the spec's kill-ranking amount
     at that percentile, times the spec's own phase 1 share (PHASE_FAC), must read that percentile) */
  { const bk = "Ula'tek|16", ph = 'P1 Serpent Mother', F = X.PHASE_FAC[bk];
    for (const sp of ['Frost Death Knight', 'Balance Druid', 'Beast Mastery Hunter']) { const T = X.PARSE_TAB[sp] && X.PARSE_TAB[sp][bk]; if (!T || !F) { bad('Ula\'tek self-check: no table for ' + sp); continue; } const f = X.phFacOf(F, sp, 'dps', ph);
      for (const want of [50, 90]) { const amt = T[1 + X.PARSE_PCT.indexOf(want)] * f, got = (X.estCombine([{ bk, kill: false, list: [{ n: 'Test', sp, role: 'dps', ph: [[ph, amt * 300, 300]] }] }]).get('Test') || {}).pct;
        log('  Ula\'tek self-check: ' + sp + ' at the ' + want + 'th percentile of phase 1 reads ' + got); if (got == null || Math.abs(got - want) > 5) bad('Ula\'tek self-check: ' + sp + ' at the ' + want + 'th percentile of phase 1 reads ' + got + ', not about ' + want); } } }
  /* (Graphs and the Report card read the same pulls and give the same number: Graphs' All pulls reads the whole night like the card) */
  const U = H.UI; for (const [rx, m] of [[/async function graphsAll\([\s\S]{0,900}?bossReps\(it, still, [^;]*?, true\); if \(!got/, 'Graphs\' All pulls doesn\'t read the whole night (bossReps(..., true)), so it can count fewer pulls than the Report card'],
    [/const gbPrs = \(k\) => [^\n]*estParses\(night \? NP\.map\(\(it\) => it\.r\) : \[r\], k\)/, 'Graphs\' Parse column doesn\'t read estParses over the night\'s pulls'], [/estParses\(a\.per\.map\(\(g\) => g\.r\), kind377\)/, 'the Report card\'s Damage/Healing row doesn\'t read estParses over its pulls']]) if (!rx.test(U)) bad(m);
}
module.exports = run;
if (require.main === module) { const H = require('./site-helpers.js'); let k = 0; run(H, (a, b, m) => { k++; console.log('  x ' + m); }); console.log(k ? k + ' problem(s)' : 'every raider within ' + GAP + ', nobody more than ' + OVER + ' above, Main\'s five named'); process.exit(k ? 1 : 0); }
