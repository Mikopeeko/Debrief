// Mythic+ Summary, option A2 (Nov 14, Flex: "Yes, build A2", on the mock "The story, easier to read"; judged on his +19 Kings' Rest of Sep 25, report
// dtMfgnRvDwBLPCKZ fight 2). The tab tells the key as a story: a headline sentence, the moments that decided it numbered on the strip and told one fact a
// row, the rest one line, Fix first as a card. This runs Summary's own code (mpxStory, mpxMoments, mpxMomList, mpxMarks, mpxGlance, mpxFix) on made-up keys
// and fails if: the sentence says the wrong thing for a key, the moments are not the ones that decided it (deaths and near-wipes before cooldowns), a wipe
// is told five times, the numbers sit on each other or off the strip, a moment's number is not where it happened, the rest of the mistakes are not counted,
// Fix first loses its card, or any of it shows on the Companion's card or on a key with no timer. contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function summaryStrip(say) {
  const bad = (m) => say('Mythic+ Summary', 'the story and its moments', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const a = s.indexOf('// (Summary, option A2'), z = s.indexOf('// (a player\'s part, two ways.');
  if (a < 0 || z < a) { bad('Summary\'s story code is gone from src/mptab.js (mpxStory, mpxMoments, mpxMomList, mpxMarks, mpxGlance, mpxFix)'); return; }
  const line = (n) => { const m = s.match(new RegExp('\\nconst ' + n + ' = [^\\n]*')); if (!m) throw new Error('src/mptab.js has no ' + n); return m[0]; };
  const run = (card) => vm.runInNewContext(
    'const MPC_ON = ' + (card ? 'true' : 'false') + ', document = { addEventListener: () => {} };' +
    'const esc = (x) => String(x == null ? "" : x).replace(/[&<>"\']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", \'"\': "&quot;", "\'": "&#39;" }[c]));' +
    'const mpT1 = (h) => " data-tt=\\"" + esc(h) + "\\"", mpShim = () => "<span class=\\"mpt-shim\\"></span>", mpGF = (v) => String(v), mpWho = (R, n) => "<b class=\\"mpt-nm\\">" + n + "</b>";' +
    'const mpPullName = (R, k) => (R.pulls[k] && R.pulls[k].boss ? R.pulls[k].boss : "pull " + (k + 1)), mpPNs = (R, ns) => "pulls " + ns.join(", "), mpClock = (R) => R._C || null, mpxData = (R) => R._D;' +
    'const mpxPull = (R, i) => "<button type=\\"button\\" class=\\"mpx-p\\" data-mpxpull=\\"" + i + "\\">P" + (i + 1) + "</button>";' +
    line('mpMM') + line('mpAnd') + line('mpCap') + line('mpxTo') + line('mpDTo') + line('MPX_KIND') + '\n' + s.slice(a, z) + '\n({ mpxStory, mpxMoments, mpxMomList, mpxMarks, mpxGlance, mpxFix, MPX_KIND })');
  let X; try { X = run(false); } catch (e) { bad('Summary\'s own code no longer runs by itself: ' + String(e.message).slice(0, 140)); return; }
  // a made-up key: 15 pulls of 20 s from 10 s, a 600 s timer, 15 s a death; tv is the plain clock
  const P = Array.from({ length: 15 }, (_, i) => ({ s: 10 + i * 20, e: 30 + i * 20, n: i + 1 }));
  const C = { ck: { par: 600, time: 300 }, pen: 15, T0: 0, tv: (t) => t }, W0 = 600 * 1.03;
  const D0 = () => ({ kick: [], cc: [], minor: [], death: [], close: [], disp: [], avoid: [], cd: [] });
  const dth = (t, i, who, to, gap, ready) => ({ t, at: '0:' + t, i, who, d: { to: to || 'unknown', gap: !!gap }, r: ready ? { ready, hits: [], used: [] } : null });
  const cl = (t, i, who, spell, left, ready) => ({ t, at: '0:' + t, i, who, left, spell, id: 0, ready: ready || [] });
  // 1. the headline's sentence
  { const S = X.mpxStory;
    const t1 = S({ lv: 1, risky: true, deaths: 2, near: 'in pull 1' }); if (t1 !== 'A near-wipe in pull 1 and two deaths nearly cost it.') bad('the headline\'s sentence for his Kings\' Rest reads "' + t1 + '" (it must read "A near-wipe in pull 1 and two deaths nearly cost it.")');
    if (!/^A clean key/.test(S({ lv: 2, deaths: 0 }))) bad('a clean timed key is not told as a clean key');
    const t3 = S({ lv: 1, risky: false, deaths: 1 }); if (t3 !== 'One death was the mistake, and there was still time to spare.') bad('one death in a key with time to spare reads "' + t3 + '"');
    const t4 = S({ lv: 0, cost: true, deaths: 6 }); if (t4 !== 'Six deaths cost it: without the deaths it was in time.') bad('an over-time key the deaths cost reads "' + t4 + '"');
    const t5 = S({ lv: 0, deaths: 6, wipe: 'in pull 3', wipeN: 5 }); if (t5 !== 'A wipe in pull 3 and one more death were the mistakes, and the rest of the time was in the pace.') bad('a wipe and one more death read "' + t5 + '"');
    const t6 = S({ lv: 1, risky: false, kicks: 3 }); if (t6 !== 'Three casts that went off with a kick ready were the mistakes, and there was still time to spare.') bad('three missed kicks read "' + t6 + '"'); }
  // 2. his Kings' Rest in small: two deaths (one after a pull), a cast that left four under 15%, one close call, three pulls with a cooldown not pressed
  const DK = D0(); DK.death.push(dth(118, 5, 'Sornarjr', 'unknown', true, ['Survival Instincts']), dth(172, 7, 'Flex', 'Putrid Seekers', false, ['Divine Shield', 'Divine Protection']));
  DK.close.push(cl(15, 0, 'Rage', 'Shadow Whirlwind', 3), cl(15, 0, 'Leaf', 'Shadow Whirlwind', 11), cl(15.4, 0, 'Sham', 'Shadow Whirlwind', 8), cl(15.6, 0, 'Flex', 'Shadow Whirlwind', 9, ['Divine Protection']), cl(152, 6, 'Flex', 'Purification Strike', 6, ['Divine Protection']));
  DK.cd.push({ t: 90, at: '1:30', i: 4, names: ['Leaf', 'Sham', 'Flex', 'Sornarjr'], dur: 55 }, { t: 110, at: '1:50', i: 5, names: ['Leaf', 'Sham', 'Rage', 'Sornarjr'], dur: 68 }, { t: 270, at: '4:30', i: 13, names: ['Leaf', 'Sornarjr'], dur: 90 });
  const RK = { pulls: P, people: [1, 2, 3, 4, 5], big: { close: [] }, cdWho: ['x'], _C: C, _D: DK };
  const MK = X.mpxMoments(RK, {});
  { const k = MK.top.map((m) => m.k + m.n).join(' ');
    if (k !== 'close1 death2 close3 death4') bad('the four moments of his Kings\' Rest are not the near-wipe, the two deaths and the close call, in the order they happened (got: ' + k + '); a pull with a big cooldown not pressed must never push out a death');
    if (MK.near !== 'in pull 1') bad('the near-wipe (one cast leaving four under 15%) is not found');
    const w1 = MK.top[0] && MK.top[0].w; if (!w1 || w1.indexOf('Shadow Whirlwind</b> left four of you under 15%.') < 0) bad('the near-wipe\'s row reads "' + w1 + '"');
    if (!MK.top[1] || MK.top[1].w.indexOf(' died after the pull.') < 0 || MK.top[1].w.indexOf('unknown') >= 0 || MK.top[1].g !== 'Survival Instincts was ready.') bad('a death after a pull with no named hit is not told plainly ("Sornarjr died after the pull. Survival Instincts was ready.")');
    if (!MK.top[3] || MK.top[3].g !== 'Divine Shield and Divine Protection were ready.' || MK.top[3].e !== '+15 s') bad('a death no longer says what was ready and what it cost on the timer');
    const r = MK.rest.find((x) => x.k === 'cd'); if (!r || r.n !== 3 || r.more || r.ps.join() !== '4,5,13') bad('the pulls with a big cooldown not pressed are not counted in the line under the moments');
    if (MK.clean.indexOf('no avoidable hits') < 0 || MK.clean.indexOf('nothing went off with a kick ready') < 0) bad('what was clean is not said');
    const L = X.mpxMomList(RK, MK);
    if ((L.match(/class="mpx-mor mpx-g-/g) || []).length !== 4 || L.indexOf('data-mpxk="cd">3 pulls with a big cooldown not pressed</button> <span class="mpx-mog">(pulls 5, 6, 14)</span>') < 0 || L.indexOf('data-mpxv="mis" data-mpxk="">Every mistake, kind by kind ›</button>') < 0) bad('the moments\' list lost a row, the "Also" line or the link to every mistake');
    if (L.indexOf('data-mpxv="sur"') >= 0 || L.indexOf('See the hit ›') >= 0) bad('a close call\'s row in the moments links to the Survival tab, which is gone (Nov 15, Flex, Nov 15: \"I feel like the survival section needs to just be removed. Its clutter at this point\")');
    if (L.indexOf('<span class="mpx-mon mpx-moh">1</span>') < 0 || L.indexOf('<span class="mpx-mon">2</span>') < 0) bad('a close call\'s number is no longer hollow, or a death\'s solid (two kinds share red)'); }
  // 3. a wipe is one moment, and more deaths than the list holds are counted
  { const D = D0(); D.death.push(dth(52, 2, 'A', 'Slam'), dth(55, 2, 'B'), dth(58, 2, 'C'), dth(61, 2, 'D'), dth(200, 9, 'E'));
    const M = X.mpxMoments({ pulls: P, people: [1, 2, 3, 4, 5], _C: C, _D: D }, {});
    if (M.top.length !== 2 || M.top[0].w !== 'Wipe: four died in 9 s.' || M.top[0].g !== 'First <b class="mpt-nm">A</b>, to Slam.' || M.wipe !== 'in pull 3' || M.wipeN !== 4) bad('a wipe is not one moment ("Wipe: four died in 9 s. First A, to Slam.")');
    const D2 = D0(); for (let k = 0; k < 7; k++) D2.death.push(dth(20 + k * 40, k * 2, 'P' + k));
    const M2 = X.mpxMoments({ pulls: P, people: [1, 2, 3, 4, 5], _C: C, _D: D2 }, {});
    if (M2.top.length !== 4 || !M2.rest[0] || M2.rest[0].k !== 'death' || M2.rest[0].n !== 3 || !M2.rest[0].more || X.mpxMomList({ pulls: P }, M2).indexOf('>3 more deaths</button>') < 0) bad('more deaths than the list holds are not counted as "3 more deaths"'); }
  // 4. the numbers on the strip: where it happened, apart, inside the strip, opening the pull; the bracket for Fix first
  { const h = X.mpxMarks(RK, null, [{ t: 'Trash before the boss', s: 90, ps: [2, 3, 4], c: 'trash' }, 1], MK), xs = [...h.matchAll(/class="mpx-mo[^"]*" style="left:([\d.]+)%" data-mpxpull="(\d+)"/g)].map((m) => [+m[1], +m[2]]);
    if (xs.length !== 4 || xs.map((x) => x[1]).join() !== '0,5,6,7') bad('the strip\'s numbers do not open their pulls (data-mpxpull)');
    else if (Math.abs(xs[1][0] - 100 * (118 + 7.5) / W0) > 0.02) bad('a death\'s number is no longer over the middle of its red block on the lane (its moment plus half its penalty, on the strip\'s scale)');
    if (h.indexOf('<em class="mpx-mfl">Fix first: 1:30 lost here</em>') < 0 || (h.match(/class="mpx-mfs"/g) || []).length !== 1) bad('the Fix first bracket over its pulls is gone');
    const D = D0(); for (let k = 0; k < 4; k++) D.death.push(dth(612 + k, 14, 'Z' + k, 'Slam', true)); /* (after the last pull, so not one wipe: four numbers at the very end) */
    const M = X.mpxMoments({ pulls: P, people: [], _C: { ck: { par: 600, time: 640 }, pen: 15, T0: 0, tv: (t) => t }, _D: D }, null);
    const L3 = [...X.mpxMarks({ pulls: P, _C: { ck: { par: 600, time: 640 }, pen: 15, T0: 0, tv: (t) => t } }, null, null, M).matchAll(/style="left:([\d.]+)%"/g)].map((m) => +m[1]);
    if (L3.length !== 4 || L3.some((x, j) => j && x - L3[j - 1] < 2.59) || L3.some((x) => x > 99.01)) bad('at the end of a key that went over time the numbers on the strip sit on each other or run off its end (' + L3.join(', ') + ')');
    if (X.mpxMarks({ pulls: P, _C: null, _D: DK }, null, null, MK) !== '') bad('a key with no timer gets numbers over a strip it does not have'); }
  // 5. the strip with its moments
  { const tl = '<div class="mpt-tl"><div class="mpt-lanes"><div class="mpt-ln"><span>You</span></div></div></div>', g = X.mpxGlance(tl, RK, {}, null);
    if (g.indexOf('<div class="mpt-lanes"><div class="mpt-ln mpx-ml">') < 0 || g.indexOf('</div></div><div class="mpt-ln"><span>You</span>') < 0) bad('the numbered moments no longer go in front of the strip\'s first lane');
    if (g.indexOf('The numbers match the list below.') < 0 || g.indexOf('class="mpx-mor') < 0) bad('the strip lost its list of moments, or no longer says the numbers match it');
    const g0 = X.mpxGlance(tl, { pulls: P, people: [], big: {}, cdWho: [], _C: C, _D: D0() }, {}, null);
    if (g0.indexOf('No mistakes decided this key.') < 0 || /mpx-glm/.test(g0) || g0.indexOf('Every mistake') >= 0) bad('a key with no mistakes is not said plainly, or shows numbers or a link to an empty list'); }
  // 6. Fix first, a card
  { const f = X.mpxFix([{ t: 'Trash before the boss', s: 90, c: 'trash' }, 1], false, true, { nt: '<p class="mpt-nt"><b>Next time</b> Pull bigger.</p>', go: '<button>map</button>', gap: 335 });
    if (!/^<div class="mpx-fix mpx-fx3 mpx-fx-trash"><p class="mpx-fxh"><span class="mpx-fk">Fix first<\/span><span class="mpx-fxs"><b class="mpx-vr">1:30<\/b><span class="mpx-fxsl">of your 5:35 behind<\/span><\/span><\/p><p class="mpx-fxt">Trash before the boss<\/p><div class="mpx-fxn"><p class="mpt-nt">/.test(f) || f.indexOf('Where your 5:35 went ›') < 0) bad('Fix first is no longer a card with its label, what it cost, its title, its Next time line and the link to Compare');
    if (X.mpxFix([{ t: 'One death', s: 15, c: 'death' }, 0], false, true, null).indexOf('<b class="mpx-vg">0:15</b><span class="mpx-fxsl">back on the timer</span>') < 0) bad('a fix that gives time back no longer says how much');
    if (X.mpxFix([{ t: 'Kick Bolt', s: 0, n: 7, c: 'kick' }, 0], false, true, null).indexOf('<b class="mpx-vk">7</b><span class="mpx-fxsl">casts went off</span>') < 0) bad('a fix counted in casts no longer says "7 casts went off"');
    if (X.mpxFix(null, true, true, null).indexOf('mpt-shim') < 0 || X.mpxFix(null, false, true, null) !== '') bad('Fix first has no placeholder while the fast run loads, or shows an empty card'); }
  // 7. the Companion's card keeps its layout
  { const Y = run(true); if (Y.mpxMarks(RK, null, null, MK) !== '' || Y.mpxGlance('<div class="mpt-ln">', RK, null, null) !== '' || Y.mpxMomList(RK, MK) !== '') bad('the Companion\'s card gets the website\'s story pieces'); }
};
