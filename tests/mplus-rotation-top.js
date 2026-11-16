// Mythic+ Rotation: a check at or above top players is not "to fix" (Nov 15, the fresh reviewers on Flex's Kings' Rest +19, report dtMfgnRvDwBLPCKZ fight 2:
// Ragemaxxing, Arms Warrior, rotation 99/100; Flex: "Yes, fix them"). The page read "TRASH PULLS 1 to fix" and "BOSSES 2 to fix" in red over rows that said
// "Sudden Death · 7 wasted · top 9 wasted (3 runs) · As good as top players." and "Always be pressing · 82% · top 78% (3 runs) · As good as top players.",
// each with an amber dot. Its window line read "On pull 1, Inside them you did 807.1K DPS, ... than you do outside it."; it said "with a Arms Warrior"; and
// "It came up on 1 of 14 pulls (the amber squares)." sat word for word on every row. This fails on the code before the fix (mpTopSide, mpvCame, mpvWin and
// mpAn don't exist, and mpvSide counts every fix) and whenever the boxes and the rows stop reading one answer. contradictions.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusRotationTop(H, say) {
  const bad = (m) => say('Mythic+ Rotation', 'at or above top players', m), MPS = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8');
  const eq = (got, want, what) => { if (JSON.stringify(got) !== JSON.stringify(want)) bad(what + ': the page gives ' + JSON.stringify(got) + ', it should be ' + JSON.stringify(want)); };
  let M; try { M = vm.runInNewContext(['mpNo', 'mpPullName', 'mpPN', 'mpPNs', 'mpAnd', 'mpTopVal', 'mpTopGap', 'mpTopSide', 'mpAn', 'mpvPB', 'mpvCame', 'mpvWin', 'MP_RW_GUIDE', 'mpRwTxt', 'mpvSide'].map((n) => H.grab(n, MPS)).join('\n') + '\n({ mpTopGap, mpTopSide, mpAn, mpvCame, mpvWin, mpvSide })',
    { plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), mpPlain: (s) => String(s == null ? '' : s).replace(/<[^>]+>/g, '') }); }
  catch (e) { bad('the helpers that keep a check at or above top players off "to fix" are missing from src/mptab.js (' + String(e.message).slice(0, 120) + ')'); return; }
  // (the test key's shape: 11 pulls and 4 bosses in key order; pull 7 lasted 8 s and was judged for nobody)
  const names = ['1', '2', 'The Golden Serpent', '3', '4', '5', '6', '7', '8', 'Mchimba the Embalmer', '9', '10', 'The Council of Tribes', '11', 'King Dazar'];
  const fix = { 0: [['warn', '', 'Colossus Smash windows', '1/2', 'Inside them you did 807.1K DPS, against 287.8K the rest of the pull. In 1 of them you cast slower than you do outside it.', 'Keep casting through Colossus Smash.']],
    12: [['bad', '', 'Sudden Death', '4 wasted', '1 ran out, and 3 were replaced by a new one before you used them.', 'Spend Sudden Death before the next one comes.']], 14: [['warn', '', 'Always be pressing', '82%', 'Your longest gap was 5 seconds, at 3:11, while moving.', 'Press something every global cooldown.']] };
  const R = { pulls: names.map((nm, i) => ({ n: i + 1, boss: /^\d+$/.test(nm) ? undefined : nm, rot: i === 7 ? {} : { Rage: { fix: fix[i] || [], good: [] } } })) };
  const gaps = { 'Sudden Death': M.mpTopGap('Sudden Death', '7 wasted', '9 wasted (3 runs)'), 'Always be pressing': M.mpTopGap('Always be pressing', '82%', '78% (3 runs)') }, gapOf = (lb) => (lb in gaps ? gaps[lb] : null);
  eq([M.mpTopSide(gaps['Sudden Death']), M.mpTopSide(gaps['Always be pressing']), M.mpTopSide(null), M.mpTopSide(0.05), M.mpTopSide(0.3)], ['top', 'top', '', 'near', 'gap'], 'where a check stands against top players (7 wasted against 9, 82% against 78%: as good as top players)');
  const B = M.mpvSide(R, 'Rage', true, gapOf), T = M.mpvSide(R, 'Rage', false, gapOf);
  eq([B.n, B.fx.length, B.top, B.rows.length], [4, 0, ['Sudden Death', 'Always be pressing'], 0], 'the Bosses box on the test key (it read "2 to fix" in red over two rows that said "As good as top players": it must be Clean)');
  eq([T.n, T.fx.map((a) => a.f[2]), T.fx.map((a) => a.st)], [10, ['Colossus Smash windows'], ['warn']], 'the Trash pulls box on the test key (1 to fix: Colossus Smash windows, a real gap with no top number)');
  { const N = M.mpvSide(R, 'Rage', true, (lb) => (lb === 'Sudden Death' ? 0.05 : null)); eq(N.fx.map((a) => [a.f[2], a.st]).sort(), [['Always be pressing', 'warn'], ['Sudden Death', 'warn']], 'a check close to top players (a tenth of the gap or less) is still to fix, amber at most, never red'); }
  eq(M.mpvSide(R, 'Rage', true).fx.length, 2, 'with no top players\' numbers every fix still counts, as graded');
  // (the words)
  eq(M.mpvWin('Inside them you did 807.1K DPS, against 287.8K the rest of the pull. In 1 of them you cast slower than you do outside it.', 'Colossus Smash windows'), 'You did 807.1K DPS inside your Colossus Smash windows, against 287.8K the rest of the pull. In 1 of them you cast slower than outside them.', 'the window line names the windows ("On pull 1, Inside them you did ... outside it." had a capital mid-sentence and "them" and "it" with nothing to point to)');
  eq(M.mpvWin('Your Colossus Smash window missed something. Inside it you did 1.2M DPS, against 300K the rest of the pull.', 'Colossus Smash windows'), 'Your Colossus Smash window missed something. You did 1.2M DPS inside your Colossus Smash window, against 300K the rest of the pull.', 'one window is said as one');
  eq(M.mpvWin('Sudden Death makes your next Execute free and usable at any health.', 'Sudden Death'), 'Sudden Death makes your next Execute free and usable at any health.', 'a line with no window in it is left alone');
  eq([M.mpAn('Arms Warrior'), M.mpAn('Holy Paladin'), M.mpAn('Unholy Death Knight'), M.mpAn('player')], ['an Arms Warrior', 'a Holy Paladin', 'an Unholy Death Knight', 'a player'], '"top is the middle of 3 fast +19 runs of this dungeon with a Arms Warrior"');
  eq([M.mpvCame(R, [0], 'amber'), M.mpvCame(R, [12], ''), M.mpvCame(R, [14], ''), M.mpvCame(R, [0, 3, 12], 'red'), M.mpvCame(R, [3, 14], 'amber')],
    ['It came up on pull 1 only (the amber square).', 'It came up on The Council of Tribes only.', 'It came up on King Dazar only.', 'It came up on 2 pulls and 1 boss (the red squares).', 'It came up on pull 3 and King Dazar (the amber squares).'], 'where a check came up, said for its own row (it read "It came up on 1 of 14 pulls (the amber squares)." on all three)');
  for (const r of B.rows.concat(T.rows)) if (/Inside them|outside it\.|of \d+ pulls \(the/.test(r[7])) bad('a Trash pulls or Bosses row still says "' + r[7] + '"');
  eq(T.rows.map((r) => r[3]), ['1 of 10 pulls'], 'a Trash pulls row counts trash pulls');
  // (the page code: the whole key's rows and the boxes read the same answer)
  const pin = (t, what) => { if (!MPS.includes(t)) bad(what); };
  pin("gap = gapOf(a.f[2]), pl = mpTopSide(gap)", 'the whole key\'s rows no longer weigh a check against top players with gapOf and mpTopSide, as the boxes do');
  pin("gapOf = (lb) => { const t = sm.tot(lb), top = t ? mpTopOf(TOP, lb, mpRwVal(t), myDur) : ''; return top ? mpTopGap(lb, mpRwVal(t), top) : null; };", 'gapOf no longer reads the whole key\'s own totals (mpRwSum\'s tot, the number each row shows)');
  pin("const x = mpvSide(R, name, k === 'boss', gapOf), t0 = x.fx[0];", 'the Trash pulls and Bosses boxes count the checks at or above top players again');
  pin("mpvSide(R, name, MP.cvf === 'boss', gapOf)", 'a tapped box\'s rows list the checks at or above top players as fixes again');
  pin("fine = rows.filter((r) => r[0] === 'ok'); rows = rows.filter((r) => r[0] !== 'ok');", 'a check at or above top players is counted to fix again');
  pin("fine.map((r, i) => rr(r, 'f' + i))", 'the checks at or above top players are no longer listed under Done right');
  pin("'<div class=\"mpc-rr' + (r[0] === 'ok' ? ' mpc-fine' : '')", 'a row at or above top players no longer carries mpc-fine (tests/mplus-rotation-check.js tells them from fixes by it)');
  pin("const fx = new Set(rows.concat(fine).map(", 'a check at or above top players can be listed twice under Done right');
  if (/(with|had) a ' \+ sp\b/.test(MPS)) bad('"with a \' + sp" is back: "with a Arms Warrior"');
  if (/'It came up on ' \+ hit \+ ' of '/.test(MPS)) bad('a Rotation row says "It came up on N of M pulls" again, the same words on every row');
};
if (require.main === module) { const H = require('./site-helpers.js'); let n = 0; module.exports(H, (a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ Rotation, at or above top players: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
