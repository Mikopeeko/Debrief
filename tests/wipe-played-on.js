// Played-on wipe: one wipe call, one "Pull ended" (Nov 14 raid-night rehearsal; Wolfthorn Thu Nov 12 Ula'tek pull 13, report Gax3AkbyFRXmdrgQ fight 23).
// The raid played on past the wipe call at 1:49 and wiped at 2:46. Summary's header said "Wiped at 2:46 (the raid played on past the wipe call) ... (3 by the call, 1:49)",
// but How it went's last row said "2:46 Wipe called", its sentence said "The wipe was called at 2:46", and the wipe picture's hover said "The wipe is called ... (2:46)":
// two different times for the one wipe call. Now the end of such a pull is "Pull ended" everywhere (the last row, the header and the wipe button; Main, Nov 14:
// never "Wipe called" at the end), and the call keeps its own time.
// Run by contradictions.js on every build; it reads the pull from the log library itself and skips (passes) without it.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function wipePlayedOn(H, say, LIB) {
  const E = H.E, W = require(path.join(__dirname, '..', 'src', 'wcl.js')), T = E.fmtT, where = "Wolfthorn Thu Nov 12 Ula'tek pull 13 (Gax3AkbyFRXmdrgQ:23)", tag = 'played on';
  // 1. How it went's end row takes its title from the chain's call: "Wiped" on a played-on pull, "Wipe called" otherwise (no log needed)
  if (!/<b>' \+ \(CH\.call\.on \? 'Pull ended' : 'Wipe called'\) \+ '<\/b>/.test(H.UI)) say(where, tag, 'How it went\'s last row always says "Wipe called", also on a pull the raid played on past the call (it should say "Pull ended" at the end of the pull)');
  if (!/var isWipe = function \(x\) \{ return \/\^\(wipe called\|pull ended\)\$\/i/.test(H.SH)) say(where, tag, 'the Why we wiped headline doesn\'t know the "Pull ended" end row (shell.html isWipe)');
  if (/'Wiped at '/.test(H.UI) || /'Wiped at ' \+ et/.test(H.SH)) say(where, tag, 'a played-on pull\'s end still reads "Wiped at" on the wipe button or the header; it is "Pull ended at" on every tab (Main, Nov 14)');
  // 2. the real pull
  const rf = path.join(LIB, 'reports', 'rep_Gax3AkbyFRXmdrgQ.json'), ef = path.join(LIB, 'events', 'Gax3AkbyFRXmdrgQ_23.json');
  if (!fs.existsSync(rf) || !fs.existsSync(ef)) { console.log('  (no saved copy of Gax3AkbyFRXmdrgQ:23, the played-on wording check skipped)'); return; }
  let rep = JSON.parse(fs.readFileSync(rf, 'utf8')); rep = rep.data || (rep.reportData ? rep.reportData.report : rep);
  const it = H.pullItems('Gax3AkbyFRXmdrgQ', rep, W).get(23); let ev = JSON.parse(fs.readFileSync(ef, 'utf8')); if (!Array.isArray(ev)) ev = ev.events;
  const r = E.analyze(it, W.translate(it, ev), {}); if (!r.item) r.item = it; ev = null;
  const SITE = H.site(['esc', 'raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT', 'wipePic'], { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} });
  const ci = SITE.cutInfo(r); if (!(ci && ci.why === 'played on' && Math.abs(ci.callT - 109.8) <= 1.5)) { say(where, tag, 'the pull should read as played on past the wipe call at 1:49 (check AA); it reads ' + (ci ? ci.why + ' at ' + T(ci.t) : 'no call')); return; }
  const rootOf = (x) => { const c = SITE.cutInfo(x), c0 = c && c.call ? c.call : c, cut = c0 && c0.auto ? c0.t : null; return E.rootCause(x, c0 && c0.auto ? { cut, why: c0.why, at: c0.at, mn: c0.mn, ms: c0.ms } : { cut }); };
  const CH = H.site(['deathHit', 'deathHitId', 'MECH_FAM', 'mechFams', 'chainTitleFits', 'deathBrief', 'collapseFrom', 'wipeChain'], { deathVerdict: () => null, cutInfo: (x) => SITE.cutInfo(x), cutT: (x) => SITE.cutT(x), wipeRoot: rootOf,
    keptMistakes: (x) => { const c = SITE.cutT(x); return (x.mistakes || []).filter((m) => m.t <= c + 0.5); }, keptDeaths: (x) => { const c = SITE.cutT(x); return (x.deaths || []).filter((d) => d.t <= c + 0.5); } });
  const ch = CH.wipeChain(r), call = ch && ch.call;
  if (!call) { say(where, tag, 'How it went has no end row'); return; }
  if (!call.on) say(where, tag, 'How it went\'s end row at ' + T(call.t) + ' reads "Wipe called", but the wipe was called at ' + T(ci.callT) + ' and the raid played on (the header says "Pull ended at ' + T(ci.t) + '")');
  if (call.on && Math.abs(call.at - ci.callT) > 0.5) say(where, tag, 'How it went keeps the wipe call at ' + T(call.at) + ', the header at ' + T(ci.callT));
  if (new RegExp('wipe was called at ' + T(ci.t).replace(/[.]/g, '\.')).test(ch.txt || '')) say(where, tag, 'How it went\'s sentence says the wipe was called at ' + T(ci.t) + ' (the end of the pull); it was called at ' + T(ci.callT));
  const pic = String(SITE.wipePic(r, ci) || ''), lab = (/aria-label="([^"]*)"/.exec(pic) || [])[1] || '';
  if (lab && lab.indexOf('(' + T(ci.t) + ')') >= 0) say(where, tag, 'the wipe picture\'s hover puts the wipe call at ' + T(ci.t) + ' (the end of the pull); it was called at ' + T(ci.callT));
};
if (require.main === module) { const P = []; module.exports(require('./site-helpers.js'), (p, k, m) => P.push(p + ' [' + k + '] ' + m), process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs'); for (const x of P) console.log(x); console.log(P.length ? P.length + ' problem(s)' : 'played-on wording: OK'); process.exit(P.length ? 1 : 0); }
