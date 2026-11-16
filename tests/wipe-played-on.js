// Played-on wipe: one wipe call, one "Pull ended" (Nov 14 raid-night rehearsal; Wolfthorn Thu Nov 12 Ula'tek pull 13, report Gax3AkbyFRXmdrgQ fight 23).
// The raid played on past the wipe call at 1:49 and wiped at 2:46. Summary's header said "Wiped at 2:46 (the raid played on past the wipe call) ... (3 by the call, 1:49)",
// but How it went's last row said "2:46 Wipe called", its sentence said "The wipe was called at 2:46", and the wipe picture's hover said "The wipe is called ... (2:46)":
// two different times for the one wipe call. Now the end of such a pull is "Pull ended" everywhere (the last row, the header and the wipe button; Main, Nov 14:
// never "Wipe called" at the end), and the call keeps its own time.
// Nov 16 (Flex: the 1:49 call "is very off", "the raid lived on for another minute"): a pull the raid played on past is now called where the raid fell apart (pull 13 at 2:05,
// tests/wipe-call-again.js), so pull 13 has one call at 2:05 and every tab says "Wipe called" there. "Pull ended" is left for a pull nothing later calls: the Coiled Altar pull
// wP76kacqypXbRhNM:4 (the damage check was missed at 4:44, nobody died after it, the pull ended at 6:01). Both are read here.
// Run by contradictions.js on every build; it reads the pulls from the log library itself and skips (passes) without them.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function wipePlayedOn(H, say, LIB) {
  const E = H.E, W = require(path.join(__dirname, '..', 'src', 'wcl.js')), T = E.fmtT, where = "Wolfthorn Thu Nov 12 Ula'tek pull 13 (Gax3AkbyFRXmdrgQ:23)", tag = 'played on';
  // 1. How it went's end row takes its title from the chain's call: "Wiped" on a played-on pull, "Wipe called" otherwise (no log needed)
  if (!/<b>' \+ \(CH\.call\.on \? 'Pull ended' : 'Wipe called'\) \+ '<\/b>/.test(H.UI)) say(where, tag, 'How it went\'s last row always says "Wipe called", also on a pull the raid played on past the call (it should say "Pull ended" at the end of the pull)');
  if (!/var isWipe = function \(x\) \{ return \/\^\(wipe called\|pull ended\)\$\/i/.test(H.SH)) say(where, tag, 'the Why we wiped headline doesn\'t know the "Pull ended" end row (shell.html isWipe)');
  if (/'Wiped at '/.test(H.UI) || /'Wiped at ' \+ et/.test(H.SH)) say(where, tag, 'a played-on pull\'s end still reads "Wiped at" on the wipe button or the header; it is "Pull ended at" on every tab (Main, Nov 14)');
  // 2. the real pulls
  const SITE = H.site(['esc', 'raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT', 'wipePic'], { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} });
  const rootOf = (x) => { const c = SITE.cutInfo(x), c0 = c && c.call ? c.call : c, cut = c0 && c0.auto ? c0.t : null; return E.rootCause(x, c0 && c0.auto ? { cut, why: c0.why, at: c0.at, mn: c0.mn, ms: c0.ms } : { cut }); };
  const CH = H.site(['deathHit', 'deathHitId', 'MECH_FAM', 'mechFams', 'chainTitleFits', 'deathBrief', 'collapseFrom', 'wipeChain'], { deathVerdict: () => null, cutInfo: (x) => SITE.cutInfo(x), cutT: (x) => SITE.cutT(x), wipeRoot: rootOf,
    keptMistakes: (x) => { const c = SITE.cutT(x); return (x.mistakes || []).filter((m) => m.t <= c + 0.5); }, keptDeaths: (x) => { const c = SITE.cutT(x); return (x.deaths || []).filter((d) => d.t <= c + 0.5); } });
  const read = (code, fight) => { const rf = path.join(LIB, 'reports', 'rep_' + code + '.json'), ef = path.join(LIB, 'events', code + '_' + fight + '.json'); if (!fs.existsSync(rf) || !fs.existsSync(ef)) return null;
    let rep = JSON.parse(fs.readFileSync(rf, 'utf8')); rep = rep.data || (rep.reportData ? rep.reportData.report : rep); const it = H.pullItems(code, rep, W).get(fight); if (!it) return null;
    let ev = JSON.parse(fs.readFileSync(ef, 'utf8')); if (!Array.isArray(ev)) ev = ev.events; const r = E.analyze(it, W.translate(it, ev), {}); if (!r.item) r.item = it; return r; };
  // (a) a pull nothing later calls: the whole pull counts and its end is "Pull ended"; the first call keeps its own time
  { const w0 = 'Coiled Altar wP76kacqypXbRhNM:4 (played on to the end)', r = read('wP76kacqypXbRhNM', 4);
    if (!r) console.log('  (no saved copy of wP76kacqypXbRhNM:4, the played-on wording check skipped)');
    else { const ci = SITE.cutInfo(r);
      if (!(ci && ci.why === 'played on' && Math.abs(ci.callT - 284.1) <= 1.5)) say(w0, tag, 'the pull should read as played on past the wipe call at 4:44 to its end (nothing later calls it); it reads ' + (ci ? ci.why + ' at ' + T(ci.t) : 'no call'));
      else { const ch = CH.wipeChain(r), call = ch && ch.call;
        if (!call) say(w0, tag, 'How it went has no end row');
        else { if (!call.on) say(w0, tag, 'How it went\'s end row at ' + T(call.t) + ' reads "Wipe called", but the wipe was called at ' + T(ci.callT) + ' and the raid played on (the header says "Pull ended at ' + T(ci.t) + '")');
          if (call.on && Math.abs(call.at - ci.callT) > 0.5) say(w0, tag, 'How it went keeps the wipe call at ' + T(call.at) + ', the header at ' + T(ci.callT));
          if (new RegExp('wipe was called at ' + T(ci.t).replace(/[.]/g, '\.')).test(ch.txt || '')) say(w0, tag, 'How it went\'s sentence says the wipe was called at ' + T(ci.t) + ' (the end of the pull); it was called at ' + T(ci.callT)); }
        const lab = (/aria-label="([^"]*)"/.exec(String(SITE.wipePic(r, ci) || '')) || [])[1] || '';
        if (lab && lab.indexOf('(' + T(ci.t) + ')') >= 0) say(w0, tag, 'the wipe picture\'s hover puts the wipe call at ' + T(ci.t) + ' (the end of the pull); it was called at ' + T(ci.callT)); } } }
  // (b) pull 13 since Nov 16: one call, at 2:05 where the raid fell apart, said the same way by How it went and the picture
  { const r = read('Gax3AkbyFRXmdrgQ', 23);
    if (!r) console.log('  (no saved copy of Gax3AkbyFRXmdrgQ:23, the pull 13 wording check skipped)');
    else { const ci = SITE.cutInfo(r);
      if (!(ci && ci.why === 'line' && Math.abs(ci.t - 125.9) <= 1 && ci.past && Math.abs(ci.past[0] - 109.8) <= 1)) say(where, tag, 'pull 13 should be called at 2:05, where the raid fell apart after fighting on past 1:49 (tests/wipe-call-again.js); it reads ' + (ci ? ci.why + ' at ' + T(ci.t) : 'no call'));
      else { const ch = CH.wipeChain(r), call = ch && ch.call;
        if (!call) say(where, tag, 'How it went has no end row');
        else { if (call.on) say(where, tag, 'How it went\'s end row reads "Pull ended" at ' + T(call.t) + ', but the wipe was called at 2:05 (where the raid fell apart)');
          if (Math.abs(call.t - ci.t) > 0.5) say(where, tag, 'How it went ends at ' + T(call.t) + ', the wipe call is at ' + T(ci.t));
          if (!/The wipe was called at 2:05: more were dead than any kill survived\. The raid kept fighting after 1:49\./.test(ch.txt || '')) say(where, tag, 'How it went\'s sentence should say "The wipe was called at 2:05: more were dead than any kill survived. The raid kept fighting after 1:49."; it says "' + String(ch.txt || '').split('. ').slice(-3).join('. ') + '"'); }
        const lab = (/aria-label="([^"]*)"/.exec(String(SITE.wipePic(r, ci) || '')) || [])[1] || '';
        if (lab && !/is called where white goes over blue \(2:05\)/.test(lab)) say(where, tag, 'the wipe picture\'s hover should put the wipe call at 2:05; it says "' + lab + '"'); } } }
};
if (require.main === module) { const P = []; module.exports(require('./site-helpers.js'), (p, k, m) => P.push(p + ' [' + k + '] ' + m), process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs'); for (const x of P) console.log(x); console.log(P.length ? P.length + ' problem(s)' : 'played-on wording: OK'); process.exit(P.length ? 1 : 0); }
