// The wipe call when the raid fights on past it (Flex, Nov 16, with a screenshot of Wolfthorn's Thu Nov 12 Ula'tek pull 13, report Gax3AkbyFRXmdrgQ fight 23):
// "Pull ended at 2:46: the raid played on past the wipe call at 1:49 (2 dead, and no kill of this boss survived more than 1 at this point)", "I think the wipe call is acting
// buggy... the raid lived on for another minute". The kill line was crossed at 1:49 (two dead, the one battle rez already spent at 1:06), nobody died for 16 s, so the site said the
// raid played on and counted the WHOLE pull to 2:46, through the collapse (12 died from 2:05 to 2:20). Now a call the raid played on past is followed by a second look, by the same
// rules, from that call's own deaths on: the wipe is called where the raid fell apart (2:05.9, a healer's death that started an unbroken run of deaths). Only when nothing later
// calls it does the whole pull count, as before. The root cause still reads from the first call (Flex: "this shouldnt touch the 'reason for the wipe' or anything").
// Measured on the 101 wipes the answer key judged by hand: 63 calls on time (within 3 s before to 5 s after the judged moment) before, 70 now; 24 of 156 saved wipes counted the
// whole pull before, 3 now. On 55 more wipes judged blind: 31 on time before, 36 now (shared notes, wipe-call-audit-nov16.md).
// Fails on the old code: the shapes of pulls 13 and 9 read "played on" to the end of the pull. Runs on every build (contradictions.js); `node tests/wipe-call-again.js --all`
// also reads every wipe the answer key judged and counts how many calls land on time.
'use strict';
const fs = require('fs'), path = require('path');
const NAMES = ['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT', 'esc', 'wipePic', 'wipeSay', 'WIPE_WHY', 'cutLbl', 'ordinal'];
module.exports = function wipeCallAgain(H, say, LIB, all) {
  const E = H.E, T = E.fmtT, where = "Wolfthorn Thu Nov 12 Ula'tek pull 13 (Gax3AkbyFRXmdrgQ:23)", tag = 'wipe call';
  let SITE; try { SITE = H.site(NAMES, { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} }); } catch (e) { say(where, tag, 'the wipe call could not be read from the page code: ' + e.message); return; }
  const near = (a, b, d) => a != null && b != null && Math.abs(a - b) <= (d || 0.3);
  // 1. the shapes of real pulls (no log needed): Ula'tek Mythic, 20 players, the boss far from 10%
  const rep = (deaths, dur, rez) => { const players = new Map(); const roles = {}; for (const [, role, g] of deaths) roles[g] = role; for (let i = 0; i < 20; i++) { const g = 'P' + i; players.set(g, { guid: g, name: 'N' + i, cls: 'x', role: roles[g] || 'dps' }); }
    return { item: { kind: 'boss', boss: "Ula'tek", diff: 'Mythic', diffId: 16, kill: false }, players, deaths: deaths.map(([t, , g]) => ({ t, guid: g, player: players.get(g).name, massShown: 0, mass: 0 })), rezzes: (rez || []).map(([t, g]) => ({ t, guid: g })), bossS: new Array(Math.ceil(dur) + 1).fill(94), duration: dur, mistakes: [], module: null }; };
  const seq = (ts) => { let k = 0; return ts.map(([t, role, g]) => [t, role || 'dps', g || 'P' + (k++)]); };
  // pull 13: Raiyvenz died at 1:04 and was rezzed at 1:06; two died at 1:47 and 1:49 (the old call); nobody until 2:05; then an unbroken run to the end
  const p13 = rep(seq([[64.1, 'dps', 'P0'], [107.2], [109.8], [125.9, 'healer'], [127.6], [132.6], [135.2], [135.3], [135.6], [137.0], [137.6], [137.8], [139.0], [140.9, 'tank'], [148.7], [149.4, 'healer'], [149.4], [149.4, 'healer'], [157.7, 'dps', 'P0'], [162.2, 'tank']]), 166.9, [[66.5, 'P0']]);
  // pull 9: one at 0:41, three at 1:00 (the old call), 35 s with nobody dying, then Rattler Slam at 1:35
  const p9 = rep(seq([[41.3], [60.0, 'healer'], [60.06], [60.3], [95.3], [95.3], [95.3, 'healer'], [97.5, 'tank'], [98.9], [99.1], [99.1], [99.1], [99.1], [99.1, 'healer'], [99.1], [99.1], [100.6], [107.2, 'tank'], [108.9]]), 109.9);
  // a raid that fought on and never fell apart again (nothing later calls it): the whole pull counts, as before
  const quiet = rep(seq([[50], [51], [52]]), 100); /* (100 s: a pull that ran 60 s clean past the deaths would be no call at all, the kill line's own rule) */
  // a raid that kept dying: the call stands where it was
  const kept = rep(seq([[40], [42], [44.3], [44.6], [45], [47]]), 74.7);
  const show = (c) => (c ? c.why + ' at ' + T(c.t) + (c.past ? ' (fought on past ' + c.past.map(T).join(', ') + ')' : '') : 'no call');
  for (const [r, what, want] of [[p13, 'the shape of pull 13', { why: 'line', t: 125.9, past: 109.8 }], [p9, 'the shape of pull 9', { why: 'line', t: 95.3, past: 60.06 }], [quiet, 'a raid that fought on and never fell apart again', { why: 'played on', t: 100 }], [kept, 'a raid that kept dying', { why: 'line', t: 44.3 }]]) {
    let c = null; try { c = SITE.cutInfo(r); } catch (e) { say(where, tag, 'the wipe call crashed on ' + what + ': ' + e.message); continue; }
    const ok = c && c.why === want.why && near(c.t, want.t) && (want.past == null ? !(c.past && c.past.length) : !!(c.past && near(c.past[0], want.past)));
    if (!ok) say(where, tag, 'on ' + what + ' the wipe should be ' + (want.why === 'played on' ? 'the whole pull (nothing later calls it)' : 'called at ' + T(want.t) + (want.past != null ? ', where the raid fell apart after fighting on past ' + T(want.past) : '')) + '; the page reads ' + show(c));
    if (c && want.past != null && !(c.call && near(c.call.t, want.past))) say(where, tag, 'on ' + what + ' the root cause should still read from the first call (' + T(want.past) + '), as before (Flex: "just the timing of the wipe call"); it gets ' + (c.call ? T(c.call.t) : 'the new call'));
  }
  // 2. the words for a call made where the raid fell apart
  { const c = SITE.cutInfo(p13); if (c && c.past) { const s = SITE.wipeSay(c); if (!/\(the raid kept fighting after 1:49\)$/.test(s)) say(where, tag, 'the wipe call\'s reason should end "(the raid kept fighting after 1:49)"; it reads "' + s + '"');
      if (/played on/.test(s)) say(where, tag, 'a call made where the raid fell apart still says "played on": "' + s + '"');
      const lab = (/aria-label="([^"]*)"/.exec(String(SITE.wipePic(p13, c) || '')) || [])[1] || ''; if (lab && !/White went over blue at 1:49 too, but the raid kept fighting/.test(lab)) say(where, tag, 'the wipe picture\'s hover should say white went over blue at 1:49 too, but the raid kept fighting; it says "' + lab + '"'); } }
  if (!/var cIx = null;[\s\S]{0,600}RT && RT\.early && !\(cIx && cIx\.past && cIx\.past\.length\) \? 'Pull ended at '/.test(H.SH)) say(where, tag, 'the Why we wiped header would say "Pull ended at" on a call made where the raid fell apart (the root cause still reads past the first call): shell.html must check cutInfo\'s past');
  if (!/ci = cutInfo\(r\), early = !!\(rcE && rcE\.early && isFinite\(ct0\)\) && !\(ci && ci\.past\)/.test(H.UI)) say(where, tag, 'How it went would run to the end of the pull on a call made where the raid fell apart (wipeChain must end at the new call)');
  // 3. the real pulls, from the log library (skipped without it)
  const W = require(path.join(__dirname, '..', 'src', 'wcl.js')), read = (code, fight) => { const rf = path.join(LIB, 'reports', 'rep_' + code + '.json'), ef = path.join(LIB, 'events', code + '_' + fight + '.json'); if (!fs.existsSync(rf) || !fs.existsSync(ef)) return null;
    let rr = JSON.parse(fs.readFileSync(rf, 'utf8')); rr = rr.data || (rr.reportData ? rr.reportData.report : rr); const it = H.pullItems(code, rr, W).get(fight); if (!it) return null; let ev = JSON.parse(fs.readFileSync(ef, 'utf8')); if (!Array.isArray(ev)) ev = ev.events; const r = E.analyze(it, W.translate(it, ev), {}); if (!r.item) r.item = it; return r; };
  const REAL = [['Gax3AkbyFRXmdrgQ', 23, where, { why: 'line', t: 125.9, past: 109.8 }], ['bcA9kw3mxHKzr4fR', 28, 'Wolfthorn Oct 22 Coiled Altar pull 24 (bcA9kw3mxHKzr4fR:28)', { why: 'check', t: 310.3, past: 235.6 }], ['wP76kacqypXbRhNM', 4, 'Coiled Altar wP76kacqypXbRhNM:4 (a pull that ended quietly)', { why: 'played on', t: 361.2 }]];
  let had = 0; for (const [code, fight, w0, want] of REAL) { let r = null; try { r = read(code, fight); } catch (e) { say(w0, tag, 'the pull could not be read: ' + e.message); continue; } if (!r) continue; had++;
    const c = SITE.cutInfo(r), ok = c && c.why === want.why && near(c.t, want.t, 1) && (want.past == null ? !(c.past && c.past.length) : !!(c.past && near(c.past[0], want.past, 1)));
    if (!ok) say(w0, tag, 'the wipe should be ' + (want.why === 'played on' ? 'the whole pull (nothing later calls it)' : 'called at ' + T(want.t) + ' after the raid fought on past ' + T(want.past)) + '; the page reads ' + show(c)); }
  if (!had) console.log('  (no saved copies of the wipe-call pulls: the real-pull part of tests/wipe-call-again.js skipped)');
  // 4. --all: every wipe the answer key judged by hand, how many calls land on time
  if (all) { const R = require(path.join(__dirname, 'answer-key', 'roots.js')); const S = { early: 0, ok: 0, late: 0 }; let whole = 0, n = 0;
    for (const [code, o] of Object.entries(R)) { if (!/^[A-Za-z0-9]{16}$/.test(code)) continue; for (const [f, k] of Object.entries(o)) { if (!k || k.t == null) continue; let r = null; try { r = read(code, +f); } catch (e) { r = null; } if (!r) continue; n++;
      const c = SITE.cutInfo(r), x = c ? c.t : r.duration; if (c && c.why === 'played on') whole++; S[x < k.t - 3 ? 'early' : x > k.t + 5 ? 'late' : 'ok']++; } }
    console.log('  answer key wipes read: ' + n + ', calls on time ' + S.ok + ', early ' + S.early + ', late ' + S.late + ', whole pull counted ' + whole);
    if (n >= 90 && (S.ok < 68 || whole > 4)) say('the answer key', tag, 'only ' + S.ok + ' of ' + n + ' wipe calls land on time (70 on Nov 16), and ' + whole + ' count the whole pull (3 on Nov 16)'); }
};
if (require.main === module) { const P = []; module.exports(require('./site-helpers.js'), (p, k, m) => P.push(p + ' [' + k + '] ' + m), process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs', process.argv.includes('--all')); for (const x of P) console.log(x); console.log(P.length ? P.length + ' problem(s)' : 'wipe call after fighting on: OK'); process.exit(P.length ? 1 : 0); }
