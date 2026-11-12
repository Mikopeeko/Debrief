// The estimated parse, side by side with Warcraft Logs' (Nov 12, Main's method, Flex: "yea that works"). Flex sent Warcraft Logs' damage table for
// the Nov 11 Coiled Altar night (all 19 pulls, every one a wipe), Parse % column. Ours: each phase a raider played (up to the wipe call, while alive)
// over that spec's phase factor from top kills (PHASE_FAC), phases and pulls by time alive, placed on Warcraft Logs' kill rankings (PARSE_TAB).
// The pieces each pull gives (estPull, read off the practice page) are in tests/fixtures/agt6_ca_estpull.json; this runs the page's own estCombine.
// Warcraft Logs' numbers are a sanity check, not a target: its multi-pull Parse % lifts short early wipes (all opener and Bloodlust), which this
// method doesn't copy. So the check fails only when a raider has no estimate, or is more than GAP off WITHOUT that reason behind it (their pulls of
// 2 minutes or less parsing at least SHORT points above their longer ones). Healers are printed: Flex's table was damage only (the healers' numbers
// in it are damage parses). Warcraft Logs' percentiles drift as more guilds kill the boss, so tables read weeks later move these a few points.
// node tests/parse-estimate.js
'use strict';
const fs = require('fs'), path = require('path'), H = require('./site-helpers.js');
const GAP = 10, SHORT = 20, SHORT_S = 120;
const WCL = { Fourinches: 61, Komo: 60, Zaffia: 50, Hobbz: 54, Shockabunga: 59, Dragooned: 56, Kargaryen: 27, Raiyvenz: 37, Volkovod: 53, Larryg: 36, Boltzzx: 46, Dashtoswirly: 31, Schooty: 37, Jangokin: 35, Vandagos: 57, Tyralien: 73 };
const X = H.site(['PARSE_PCT', 'PARSE_TAB', 'PHASE_FAC', 'parseAt', 'phFacOf', 'estCombine']);
const F = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'agt6_ca_estpull.json'), 'utf8'));
const pulls = (L) => L.map((x) => ({ bk: x.bk, kill: !!x.kill, list: x.list.map(([n, sp, role, ph]) => ({ n, sp, role, ph })) }));
const D = pulls(F.d), HL = pulls(F.h), est = X.estCombine(D), estH = X.estCombine(HL), mean = (L) => (L.length ? L.reduce((t, v) => t + v, 0) / L.length : null);
let bad = 0;
console.log('Estimated parse, The Coiled Altar Mythic, Nov 11, all 19 pulls (ours, Warcraft Logs\' Parse %)');
for (const [nm, want] of Object.entries(WCL)) { const x = est.get(nm), got = x ? x.pct : null;
  // (each pull on its own, to name the reason behind a gap: short burst wipes against the long pulls)
  const one = D.map((pl) => { const q = pl.list.find((y) => y.n === nm); if (!q) return null; const v = X.estCombine([{ bk: pl.bk, kill: pl.kill, list: [q] }]).get(nm); return { t: q.ph.reduce((s, z) => s + z[2], 0), pct: v ? v.pct : null }; }).filter((v) => v && v.pct != null);
  const sh = one.filter((v) => v.t <= SHORT_S), lo = one.filter((v) => v.t > SHORT_S), mS = mean(sh.map((v) => v.pct)), mL = mean(lo.map((v) => v.pct)), lift = mS != null && mL != null ? mS - mL : null;
  const off = got == null ? null : got - want, why = off != null && Math.abs(off) > GAP ? (off < 0 && lift != null && lift >= SHORT ? 'short wipes: ' + sh.length + ' pulls of 2 min or less parse ' + Math.round(mS) + ', the ' + lo.length + ' longer ones ' + Math.round(mL) + ' (' + Math.round(100 * sh.reduce((s, v) => s + v.t, 0) / one.reduce((s, v) => s + v.t, 0)) + '% of their time)' : 'NO REASON FOUND') : '';
  if (got == null || /NO REASON/.test(why)) bad++;
  console.log('  ' + nm.padEnd(13) + String(x ? x.spec : '?').padEnd(22) + ' ours ' + String(got == null ? '-' : got).padStart(3) + '   WCL ' + String(want).padStart(3) + (off == null ? '   (no estimate: ' + (x && x.none ? 'no table' : 'missing') + ')' : '   ' + (off >= 0 ? '+' : '') + off) + (why ? '   ' + why : '')); }
for (const [nm, x] of estH) console.log('  healer ' + nm.padEnd(13) + String(x.spec).padEnd(22) + ' ours ' + (x.pct == null ? '-' : x.pct) + '   (Warcraft Logs\' healing Parse % not sent)');
// Graphs' parse = the Report card's, every raider, damage and healing (Main's re-test, Nov 12: Graphs read 16 pulls, the card 19, so Komo read 59 on
// Graphs and 65 on the card). In the page: Graphs' All pulls reads the whole night like the card, and both read estParses; here, Graphs' way (every pull
// of the night at once) and the card's (each raider's own pulls) give the same number for everyone
{ const U = H.UI, src = [[/async function graphsAll\([\s\S]{0,900}?bossReps\(it, still, [^;]*?, true\); if \(!got/, 'Graphs\' All pulls doesn\'t read the whole night (bossReps(..., true)), so it can count fewer pulls than the Report card'],
    [/const gbPrs = \(k\) => [^\n]*estParses\(night \? NP\.map\(\(it\) => it\.r\) : \[r\], k\)/, 'Graphs\' Parse column doesn\'t read estParses over the night\'s pulls'],
    [/estParses\(a\.per\.map\(\(g\) => g\.r\), kind377\)/, 'the Report card\'s Damage/Healing row doesn\'t read estParses over its pulls']];
  for (const [rx, say] of src) if (!rx.test(U)) { bad++; console.log('  x ' + say); }
  for (const [L, all] of [[D, est], [HL, estH]]) for (const [nm, x] of all) { const mine = L.filter((pl) => pl.list.some((q) => q.n === nm)).map((pl) => ({ ...pl, list: pl.list.filter((q) => q.n === nm) })), y = X.estCombine(mine).get(nm);
    if (!y || y.pct !== x.pct) { bad++; console.log('  x ' + nm + ': Graphs ' + x.pct + ', Report card ' + (y && y.pct)); } }
  console.log('Graphs and the Report card: the same pulls and the same number for every raider, both tables' + (bad ? ' (see the x lines)' : '')); }
console.log(bad ? bad + ' raider(s) with no estimate or an unexplained gap' : 'every raider has an estimate; every gap over ' + GAP + ' is the short-wipe lift');
process.exit(bad ? 1 : 0);
