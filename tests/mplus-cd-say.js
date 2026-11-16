// Mythic+ Report card, the group's big cooldowns line (Nov 15, the fresh reviewers on Flex's +19 Kings' Rest of Sep 25, report dtMfgnRvDwBLPCKZ
// fight 2; Flex: "Yes, fix them"). The line under the group's grade said "Everyone pressed their big cooldowns." while Debrief's pull by pull said
// pulls 4 and 5 "4 players pressed no big cooldown" and pull 11 "2 players pressed no big cooldown": it only asked whether someone never pressed one
// in the whole key. Now that line, on the Report card and on the Companion's card, comes from the pulls the rows mark (mpCdMiss, through mpCdSay), and
// the checklist's goal says what a long pull is (packs pulled back to back count as one: 12 long pulls in his key, not the 14 rows of 45 s or more).
// A pull counts as a miss only for a player with a big cooldown ready at its start (not pressed yet in the key, or pressed at least its shortest gap
// between two presses ago): pulls 4 and 5 came a minute after pull 3, where the players had pressed theirs.
// This runs mpCdMiss, mpCdSay and the checklist's long pulls on a made-up key shaped like his and fails if: the line says everyone pressed one while a
// row says someone didn't, names other pulls than the rows, loses who never pressed one, the long pulls and the rows' pulls stop being one set, or a
// player whose cooldown was still coming back (or pressed only once, so how long it takes isn't known) is marked as pressing none.
// contradictions.js runs it on every build. It fails on the page before this fix (the line was worked out inline from "never pressed" alone).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusCdSay(say) {
  const bad = (m) => say('Mythic+ Report card', 'the big cooldowns line', m);
  let s, ui; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js or src/ui.js'); return; }
  if (s.indexOf("'Everyone pressed their big cooldowns.'") >= 0) bad('a group line still says "Everyone pressed their big cooldowns." from "never pressed" alone, over pull rows that say "pressed no big cooldown" (his Kings\' Rest: pulls 4, 5 and 11)');
  if ((s.match(/mpCdSay\(R\),/g) || []).length !== 2) bad('the Report card\'s group line and the Companion\'s card no longer both take their big cooldowns line from mpCdSay');
  if (s.indexOf("'one in every long pull when one is ready (45 seconds or more' + (J.some((i) => mpChainOf(R, i).length > 1) ? '; packs pulled back to back count as one' : '') + ')'") < 0) bad('a player\'s Big cooldowns goal no longer says what a long pull is (his Kings\' Rest read "11 of 12 long pulls" over 14 rows of 45 seconds or more: pulls 1 and 2, and 9 and 10, were pulled back to back)');
  const a = s.indexOf('\nconst mpCdReady = '), z = s.indexOf('\nfunction mpPullTags('), j0 = s.indexOf('const J = P.map((q, i) => i).filter('), j1 = s.indexOf('; /* (the long pulls', j0);
  if (a < 0 || z < a || s.slice(a, z).indexOf('\nconst mpCdSay = ') < 0 || s.slice(a, z).indexOf('\nconst mpCdMiss = ') < 0) { bad('mpCdSay is gone from beside mpCdMiss in src/mptab.js (the line and the pull rows must come from one place)'); return; }
  if (j0 < 0 || j1 < j0) { bad('the checklist\'s long pulls (const J = ...) are gone from src/mptab.js'); return; }
  const fn = (n) => { const i0 = s.indexOf('\nfunction ' + n + '('); if (i0 < 0) throw new Error('src/mptab.js has no function ' + n); let i = s.indexOf('{', i0), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(i0, i + 1); };
  const line = (src, n) => { const m = src.match(new RegExp('\\nconst ' + n + ' = [^\\n]*')); if (!m) throw new Error('no ' + n); return m[0]; };
  let X; try { X = vm.runInNewContext('const esc = (x) => String(x), mpWho = (R, n) => n;' + line(ui, 'plural') + line(s, 'mpAnd') + line(s, 'mpNo') + line(s, 'mpPullName') + line(s, 'mpPN') + line(s, 'mpPNs') + '\n' + fn('mpChains') + line(s, 'mpChainOf') + s.slice(a, z) +
    '\nconst longOf = (R) => { const P = R.pulls; ' + s.slice(j0, j1 + 1) + ' return J; };\n({ mpCdMiss, mpCdSay, mpChainOf, longOf })'); } catch (e) { bad('the big cooldowns line no longer runs by itself: ' + String(e.message).slice(0, 140)); return; }
  // his key in small: when each pull started and ended (s), bosses by name; pulls 1 and 2 and pulls 9 and 10 back to back, pull 7 eight seconds long
  const T = [[10, 100], [100, 178], [193, 392, 'The Golden Serpent'], [408, 476], [482, 537], [543, 611], [620, 694], [758, 766], [773, 904], [920, 1103, 'Mchimba the Embalmer'], [1114, 1187], [1190, 1299], [1299, 1549, 'The Council of Tribes'], [1576, 1666], [1675, 1884, 'King Dazar']];
  const WHO = ['Sornarjr', 'Flex', 'Leafeon', 'Shamanfoxx', 'Ragemaxxing'], LONG = [0, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 14];
  const key = (miss, never) => { const pulls = T.map(([s0, e0, b], i) => ({ n: i + 1, s: s0, e: e0, dur: e0 - s0, boss: b || '' })), R = { pulls, cdWho: WHO.slice(), cds: {} };
    for (const w of WHO) R.cds[w] = (never || []).includes(w) ? [] : [{ t: 10, spell: 'Avatar', pull: 0 }, { t: 70, spell: 'Avatar', pull: 0 }].concat(LONG.filter((k) => k > 0 && !(miss[k] || []).includes(w)).map((k) => ({ t: pulls[k].s + 1, spell: 'Avatar', pull: k }))); return R; }; /* (a cooldown back after 60 s, pressed twice in the first pull: ready at every later long pull) */
  const eq = (got, want, what) => { if (got !== want) bad(what + ': the line reads "' + got + '", not "' + want + '"'); };
  // 1. his key: four players with none on pulls 4 and 5, two on pull 11 (the rows' pulls), everyone else pressing one in every long pull
  const KR = key({ 4: WHO.slice(0, 4), 5: WHO.slice(0, 4), 13: ['Shamanfoxx', 'Ragemaxxing'] });
  const rows = KR.pulls.map((q, i) => i).filter((i) => X.mpCdMiss(KR, i).length), J = X.longOf(KR);
  if (rows.join() !== '4,5,13') bad('the rows\' "pressed no big cooldown" pulls are ' + rows.join(', ') + ' (indexes), not pulls 4, 5 and 11 (4, 5, 13)');
  eq(X.mpCdSay(KR), 'On pulls 4, 5 and 11, some players pressed no big cooldown.', 'his Kings\' Rest');
  if (J.length !== 12) bad('his Kings\' Rest has ' + J.length + ' long pulls for the checklist, not 12 (14 rows of 45 s or more, two pairs pulled back to back)');
  if (rows.some((i) => !J.includes(i))) bad('a pull the rows mark is not one of the checklist\'s long pulls: the two count different pulls');
  { const m = J.filter((i) => X.mpCdMiss(KR, i).includes('Ragemaxxing')).length; if (J.length - m !== 11) bad('Ragemaxxing\'s checklist reads ' + (J.length - m) + ' of ' + J.length + ' long pulls, not 11 of 12'); }
  // 2. the other cases
  eq(X.mpCdSay(key({ 13: ['Ragemaxxing'] })), 'On pull 11, Ragemaxxing pressed no big cooldown.', 'one player on one pull');
  eq(X.mpCdSay(key({ 13: ['Ragemaxxing'], 14: ['Flex'] })), 'On pull 11 and King Dazar, some players pressed no big cooldown.', 'a pull and a boss');
  eq(X.mpCdSay(key({ 3: ['Flex'], 4: ['Flex'], 5: ['Flex'], 6: ['Flex'], 8: ['Flex'] })), 'On 5 pulls, Flex pressed no big cooldown.', 'more than four pulls');
  eq(X.mpCdSay(key({}, ['Leafeon'])), 'Leafeon never pressed a big cooldown.', 'one player who never pressed one');
  eq(X.mpCdSay(key({ 13: ['Ragemaxxing'] }, ['Leafeon'])), 'Leafeon never pressed a big cooldown. On pull 11, Ragemaxxing pressed no big cooldown.', 'one who never pressed one and one who missed a pull');
  eq(X.mpCdSay(key({})), 'Everyone pressed a big cooldown in every long pull where one was ready.', 'a clean key');
  // 3. a cooldown still coming back is never a miss (his pulls 4 and 5, a minute after pull 3), nor one pressed only once before
  { const R = key({}), m = (i) => X.mpCdMiss(R, i).includes('Flex');
    R.cds.Flex = [{ t: 10, spell: 'Long', pull: 0 }, { t: 160, spell: 'Long', pull: 2 }, { t: 409, spell: 'Long', pull: 3 }];
    if (m(4) || m(5)) bad('a player whose big cooldown was still coming back (pressed 73 s and 134 s before; it takes 150 s) is marked as pressing none (his Kings\' Rest: pulls 4 and 5 a minute after pull 3)');
    if (!m(6)) bad('a player whose big cooldown was back (pressed 211 s before; it takes 150 s) and went unpressed is not marked');
    R.cds.Flex = [{ t: 409, spell: 'Once', pull: 3 }]; if (m(4) || m(6)) bad('a big cooldown pressed only once before a pull counts as ready: how long it takes is not known, so the pull is marked on a guess');
    if (!m(2)) bad('a big cooldown not pressed yet in the key (every cooldown is ready when a key starts) does not count as ready'); }
  { const R0 = key({}); R0.cdWho = []; eq(X.mpCdSay(R0), '', 'a group with no big cooldowns listed'); }
};
