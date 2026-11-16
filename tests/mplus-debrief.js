// Mythic+, the key in four tabs (Nov 15, Flex: "I just dont like the mythic + tab a lot right now", then "alright do whatever you want then make it good").
// Six tabs built in pieces read as a data dump; now Debrief (opens first: The key, in short, Next key, the key pull by pull, every mistake), Players (Report
// card and Rotation in a row; Survival came off it the same day), Route (with where the time went under the map) and Graphs.
// This runs the page's own code on a made-up key and fails if: the tab row is not those four, Players loses one of its two parts, a view has no tab, the
// pull-by-pull list loses a pull, puts a boss wipe in the wrong part, gets a part's time or its gap to the fast run wrong, drops what happened in a pull
// (a death and what killed it, close calls by spell, missed kicks, cooldowns, debuffs, avoidable hits, Lust), shows a clean pull as anything but "clean",
// or shows on the Companion's card; or if the page's look stops showing Debrief, where the time went on Route, or the players against top players on the
// Report card. contradictions.js runs it on every build. Each part fails on the page as it was at 3dd30969.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusDebrief(say) {
  const bad = (m) => say('Mythic+ Debrief', 'the key in four tabs', m);
  let s, ui, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src/mptab.js, src/ui.js or src/shell.html'); return; }
  const line = (src, n) => { const m = src.match(new RegExp('\\n(?:const|function) ' + n + '\\b')); if (!m) throw new Error('src has no ' + n); const L = src.slice(m.index + 1).split('\n'), out = [];
    for (const l of L) { out.push(l); if (/;\s*(?:\/\*.*\*\/)?\s*$/.test(l)) break; } return '\n' + out.join('\n'); };
  const fn = (n) => { const a = s.indexOf('\nfunction ' + n + '('); if (a < 0) throw new Error('src/mptab.js has no function ' + n); let i = s.indexOf('{', a), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(a, i + 1); };
  // 1. the tabs: four, Debrief first; Players is Report card and Rotation; every view a tab or a part of Players; old links land on a view that is there
  let T; try { T = vm.runInNewContext(line(s, 'MPX_VIEWS') + line(s, 'MPX_OLD') + line(s, 'MPX_TABS') + '\n({ MPX_VIEWS, MPX_OLD, MPX_TABS, MPX_SUB })'); } catch (e) { bad('the four tabs are gone (MPX_TABS, MPX_SUB): ' + String(e.message).slice(0, 120)); return; }
  if (T.MPX_TABS.map((x) => x[1]).join(' | ') !== 'Debrief | Players | Route | Graphs') bad('the tab row is "' + T.MPX_TABS.map((x) => x[1]).join(' | ') + '", not Debrief | Players | Route | Graphs (Flex, Nov 15: "alright do whatever you want then make it good")');
  if (T.MPX_SUB.map((x) => x[1]).join(' | ') !== 'Report card | Rotation' || (T.MPX_TABS.find((x) => x[1] === 'Players') || [])[0] !== T.MPX_SUB[0][0]) bad('Players is not Report card and Rotation, opening on the Report card (Survival came off it, Nov 15)');
  for (const [v] of T.MPX_VIEWS) if (!T.MPX_TABS.some((x) => x[0] === v) && !T.MPX_SUB.some((x) => x[0] === v)) bad('the view "' + v + '" has no tab and is not a part of Players, so nothing can open it');
  for (const [v, to] of Object.entries(T.MPX_OLD)) if (!T.MPX_VIEWS.some((x) => x[0] === to)) bad('an old link with &mpv=' + v + ' opens "' + to + '", which is not a view any more');
  if (T.MPX_OLD.cmp !== 'map') bad('an old link to Compare (&mpv=cmp) does not open Route, where the time went is now');
  // 2. the key pull by pull, on a made-up key: two trash pulls, a wipe on the first boss and its kill, a trash pull, the second boss, a pull after it
  const run = (card) => vm.runInNewContext('const MPC_ON = ' + (card ? 'true' : 'false') + ', mpCC = () => "#fff";' +
    'const esc = (x) => String(x == null ? "" : x).replace(/[&<>"\']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", \'"\': "&quot;", "\'": "&#39;" }[c]));' +
    'let DATA = null; const mpxData = () => DATA;' + line(ui, 'plural') + line(s, 'mpMM') + line(s, 'mpCap') + line(s, 'mpT1') + line(s, 'mpWho') + line(s, 'mpxTo') + line(s, 'MP_PCOL') + line(s, 'mpNo') + line(s, 'mpPullName') +
    '\n' + fn('mpClock') + '\n' + fn('mpChains') + line(s, 'mpChainN') + line(s, 'MP_FRAG_S') + line(s, 'mpFrag') + '\n' + fn('mpStretches') + '\n' + fn('mpxPbpData') + '\n' + fn('mpxPbp') + '\n({ mpxPbpData, mpxPbp, set: (d) => { DATA = d; } })');
  let X; try { X = run(false); } catch (e) { bad('the key pull by pull no longer runs by itself (mpxPbpData, mpxPbp): ' + String(e.message).slice(0, 140)); return; }
  const pull = (n, s0, e0, o) => Object.assign({ n, s: s0, e: e0, dur: e0 - s0, deaths: [], boss: '' }, o || {});
  const key = () => ({ run: { end: 750, clock: { time: 745, deathCost: 5 } }, people: [{ name: 'Flex', cls: 'Paladin' }, { name: 'Leafeon', cls: 'Death Knight' }],
    pulls: [pull(1, 20, 80), pull(2, 100, 150, { deaths: [{ t: 120, who: 'Flex', to: 'Shadow Bolt' }] }), pull(3, 200, 300, { boss: 'Boss A', kill: false }), pull(4, 400, 500, { boss: 'Boss A', kill: true }), pull(5, 520, 560), pull(6, 600, 700, { boss: 'Boss B', kill: true }), pull(7, 720, 750)],
    route: { ok: true, full: 100, pulls: [{ add: 12.5 }, { add: 10 }, { add: 0 }, { add: 0 }, { add: 20 }, { add: 0 }, { add: 0 }] }, lust: [{ t: 410, pull: 3, spell: 'Heroism' }] });
  const fast = () => ({ run: { end: 630, clock: { time: 620, deathCost: 0 } }, pulls: [pull(1, 15, 70), pull(2, 300, 410, { boss: 'Boss A', kill: true }), pull(3, 500, 630, { boss: 'Boss B', kill: true })] });
  const data = () => ({ death: [{ i: 1, who: 'Flex', d: { t: 120, who: 'Flex', to: 'Shadow Bolt' } }, { i: 1, who: 'Leafeon', d: { t: 152, who: 'Leafeon', to: 'Unknown', gap: true } }], close: [{ i: 0, spell: 'Crush', who: 'Flex' }, { i: 0, spell: 'Crush', who: 'Leafeon' }, { i: 5, spell: 'Slam', who: 'Flex' }, { i: 5, spell: 'Slam', who: 'Flex' }], kick: [{ i: 4 }], cd: [{ i: 1, names: ['Flex'] }], disp: [{ i: 4, n: 1 }], avoid: [{ i: 5, n: 3 }], cc: [{ i: 4, spell: 'Enrage' }], minor: [] });
  X.set(data()); const R = key(), F = fast(), G = X.mpxPbpData(R, F);
  if (G.map((g) => g.name).join(' | ') !== 'Start → Boss A | Boss A → Boss B | After Boss B') bad('the key\'s parts are "' + G.map((g) => g.name).join(' | ') + '", not Start → Boss A | Boss A → Boss B | After Boss B');
  else {
    if (G[0].rows.map((r) => r.k).join(',') !== '0,1,2,3' || G[1].rows.map((r) => r.k).join(',') !== '4,5' || G[2].rows.map((r) => r.k).join(',') !== '6') bad('a pull is missing or in the wrong part (a wipe on a boss belongs to the part that ends with its kill): ' + G.map((g) => g.rows.map((r) => r.k).join(',')).join(' / '));
    if (G[0].you !== 495 || G[0].fast !== 400 || G[1].you !== 200 || G[1].fast !== 220 || G[2].you != null) bad('a part\'s time is not Route\'s (from the boss before to this boss, deaths\' time on the timer included) or the fast run\'s same part: ' + G.map((g) => g.you + '/' + g.fast).join(' '));
    const r1 = G[0].rows[1], r0 = G[0].rows[0]; if (r1.at !== 90 || G[1].rows[0].at !== 515 || r0.add !== 12.5 || r1.deaths.length !== 2 || r0.close.join() !== 'Crush,2,2' || !G[0].rows[3].lust || r1.cd.join() !== 'Flex' || G[1].rows[0].cc !== 1) bad('a pull lost when it started on the timer, its count, a death, its close calls by spell, a cast that needed a stop, its cooldowns or Lust');
  }
  const h = X.mpxPbp(R, F);
  if (h.indexOf('<section class="mpdb-sec" id="mpxPbp">') !== 0 || h.indexOf('<h3 class="mpdb-h3">The key, pull by pull</h3>') < 0) bad('Debrief lost "The key, pull by pull"');
  if ((h.match(/<button type="button" class="mpdb-r[ "]/g) || []).length !== 7) bad('the key pull by pull does not have one line a pull (' + (h.match(/<button type="button" class="mpdb-r[ "]/g) || []).length + ' of 7)');
  if (h.indexOf('<b class="mpdb-pg mpdb-bad"') < 0 || h.indexOf('>+1:35</b>') < 0 || h.indexOf('<b class="mpdb-pg mpdb-ok"') < 0 || h.indexOf('>−0:20</b>') < 0) bad('a part lost its gap to the fast run (+1:35 in red where it was slower, −0:20 in green where it was faster)');
  if (h.indexOf('<b class="mpt-nm" style="color:#fff">Flex</b> died to <b class="mpdb-sp">Shadow Bolt</b>') < 0) bad('a death lost who died or what killed them');
  if (h.indexOf('<b class="mpdb-sp">Crush</b> left 2 players under 15%</span>') < 0) bad('two close calls from one spell in one pull are not one line ("Crush left 2 players under 15%")');
  if (h.indexOf('<b class="mpdb-sp">Slam</b> left one player under 15%, 2 times</span>') < 0) bad('one player left under 15% twice by one spell reads as two players (the review, Nov 15: it counted hits, not players)');
  if (h.indexOf('1 cast needed a stop and got none') < 0) bad('a pull whose cast needed a stop and got none says "clean" while every mistake under it lists that cast (the review, Nov 15)');
  if (h.indexOf('<b class="mpt-nm" style="color:#fff">Leafeon</b> died after the pull ended</span>') < 0) bad('a death after a pull ended reads as a death in the pull, or an unknown killer is named "Unknown" (the review, Nov 15)');
  if (h.indexOf('1 cast went off with a kick ready') < 0 || h.indexOf('pressed no big cooldown') < 0 || h.indexOf('1 debuff left on') < 0 || h.indexOf('3 avoidable hits') < 0 || h.indexOf('<i class="mpdb-ei" aria-hidden="true">⚡</i>Lust') < 0) bad('a pull lost its missed kicks, cooldowns, debuffs, avoidable hits or Lust');
  if ((h.match(/<span class="mpdb-clean">clean<\/span>/g) || []).length !== 2) bad('a pull with nothing in it is not "clean" (2 expected: the wipe on Boss A and the last pull)');
  if (h.indexOf('data-mpxpull="6"') < 0 || h.indexOf('<i class="mpdb-star" aria-hidden="true">★</i>Boss A') < 0 || h.indexOf('>Pull 3</span>') < 0) bad('a pull does not open on Route, a boss lost its star, or the trash pulls are not counted as Route counts them');
  if (h.indexOf('+12.5%') < 0) bad('a pull lost the count it gave');
  { const h2 = X.mpxPbp(R, null); if (/mpdb-pg|fast run/.test(h2)) bad('with no fast run the key pull by pull still talks about the fast run'); }
  { const R3 = key(); R3.run.clock = null; let h3 = ''; try { h3 = X.mpxPbp(R3, null); } catch (e) { h3 = ''; } if ((h3.match(/<button type="button" class="mpdb-r[ "]/g) || []).length !== 7) bad('a key with no timer (left early) loses its pull-by-pull list');
    if (h3.indexOf('<span class="mpdb-ps"> · ') >= 0 || h3.indexOf('<span class="mpdb-ps">2 pulls</span>') < 0) bad('a part with no time starts its line with a stray " · " (the review, Nov 15)'); }
  try { const Y = run(true); Y.set(data()); if (Y.mpxPbp(key(), fast()) !== '') bad('the key pull by pull shows on the Companion\'s card (its layout stays as it was)'); } catch (e) { bad('the key pull by pull crashes on the Companion: ' + String(e.message).slice(0, 100)); }
  // 3. the page: Debrief shows its parts; where the time went is on Route; against top players on the Report card; the Players row shows on its two parts
  if (!/\[data-mpv="deb"\] body #view#view#view #mptBody > \*:not\(#mptC1\):not\(#mptCD\):not\(#mptCA\) \{ display: none !important; \}/.test(css)) bad('the Debrief view no longer shows Debrief and every mistake (and only them)');
  if (!/\[data-mpv="map"\][^{]*:not\(#mptCM\):not\(#mptC5\):not\(#mptCC\),/.test(css) || !/\[data-mpv="rep"\][^{]*:not\(#mptC1\):not\(#mptCP\):not\(#mptCCv\),/.test(css)) bad('where the time went is not on Route, or the players against top players are not on the Report card');
  if (!/:is\(\[data-mpv="rep"\], \[data-mpv="rot"\]\) body #view#view#view #mptBody#mptBody#mptBody > \.mpx-sub:not\(#mptC1\):not\(#mptCS\) \{ display: flex !important; \}/.test(css)) bad('the Players row (Report card, Rotation) no longer shows on its two parts');
  if (s.indexOf("c4.insertAdjacentHTML('beforebegin', mpxDeb(R0, ") < 0 || s.indexOf("mpxView(MP.cv || 'deb'); }") < 0) bad('the key no longer draws Debrief or no longer opens on it');
};
