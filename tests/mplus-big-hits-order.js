// Mythic+ Survival tab (Nov 15, Flex: "what if we made a new tab, for survivability that highlighted players ability to use their kit to stay alive ... It
// could include the avoidable damage, could include this defensive usage chart you made", then "Yes, build it" on the mock), and its big hits sorted by part
// of the key (Nov 15, Flex: "the big hits section needs to be sorted better"; on his +19 Kings' Rest of Sep 25, report dtMfgnRvDwBLPCKZ fight 2, eight spells
// were one list by lowest health, trash and bosses mixed). This runs the tab's own code (mpxSvGroups, mpxSvNums) on a made-up key and fails if: the big hits
// are not grouped by part of the key in the key's order, a part's spells are not in the order they first went off, a spell cast in two parts is not in both
// with that part's casts, lowest and "up" count, a boss part is not marked as one; the numbers on top are not the mistakes' and the Report card's own (deaths,
// close calls and the one cast that left the most under 15%, defensives left unpressed, Healthstone moments, avoidable hits); or the Companion's Big hits
// chapter loses its one list, the worst first. contradictions.js runs it on every build. Each part fails on the page as it was at 6f03d342.
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
module.exports = function survivalCheck(H, say) {
  const bad = (m) => say('Mythic+ Survival', 'the tab and its big hits', m);
  const MPT = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8');
  const ctx = () => ({ E: { CLASSES: {} }, esc: (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'), plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), spellIcon: () => '', mpClock: () => null, mpNo: (r, n) => n, mpByRole: () => 0 });
  let X; try { X = vm.runInNewContext(['mpAnd', 'mpBhWhere', 'mpxSvGroups', 'mpxSvNums'].map((n) => H.grab(n, MPT)).join('\n') + '\n({ mpxSvGroups, mpxSvNums })', ctx()); }
  catch (e) { bad('the Survival tab\'s own code (mpxSvGroups, mpxSvNums) is gone or no longer runs by itself: ' + String(e.message).slice(0, 140)); return; }
  const w = (name, left, died, def) => ({ name, pct: 70, left, died: !!died, def: def || [] });
  // the key: pulls 1 and 2 of trash, The Golden Serpent, pull 4 of trash, Mchimba. The reader lists the spells worst first: Boss Slam, then Shadow Whirlwind
  // (cast in pull 1 and again in pull 4), then Purification Strike (pull 2), then Late Bolt (pull 4, before Shadow Whirlwind's second cast there)
  const R = { pulls: [{ n: 1 }, { n: 2 }, { n: 3, boss: 'The Golden Serpent' }, { n: 4 }, { n: 5, boss: 'Mchimba' }], people: [{ name: 'Ann', role: 'dps' }, { name: 'Bo', role: 'healer' }],
    big: { tanks: [], close: [], per: {}, hits: [
      { spell: 'Boss Slam', id: 0, src: 'The Golden Serpent', size: 90, low: 0, lowWho: 'Ann', died: 1, casts: [{ t: 200, pull: 2, who: [w('Ann', 0, true), w('Bo', 30, false, ['Divine Protection'])] }] },
      { spell: 'Shadow Whirlwind', id: 0, src: 'Shadow-Borne Champion', size: 80, low: 3, lowWho: 'Ann', died: 0, casts: [{ t: 15, pull: 0, who: [w('Ann', 3), w('Bo', 9)] }, { t: 330, pull: 3, who: [w('Ann', 50, false, ['Astral Shift']), w('Bo', 40)] }] },
      { spell: 'Purification Strike', id: 0, src: 'Purification Construct', size: 75, low: 6, lowWho: 'Bo', died: 0, casts: [{ t: 90, pull: 1, who: [w('Ann', 60), w('Bo', 6)] }] },
      { spell: 'Late Bolt', id: 0, src: 'Risen Hexer', size: 70, low: 45, lowWho: 'Ann', died: 0, casts: [{ t: 310, pull: 3, who: [w('Ann', 45), w('Bo', 70)] }] }] } };
  let G = []; try { G = X.mpxSvGroups(R); } catch (e) { bad('grouping the big hits crashed: ' + String(e.message).slice(0, 140)); return; }
  const parts = G.map((g) => (g.boss ? '★' : '') + g.w + ' (' + g.ps.map((k) => k + 1).join(',') + ')').join(' | ');
  if (parts !== 'Trash before The Golden Serpent (1,2) | ★The Golden Serpent (3) | Trash before Mchimba (4)') bad('the big hits are not grouped by part of the key in its order, bosses marked: "' + parts + '"');
  const order = G.map((g) => g.hits.map((h) => h.spell).join(', ')).join(' | ');
  if (order !== 'Shadow Whirlwind, Purification Strike | Boss Slam | Late Bolt, Shadow Whirlwind') bad('a part\'s spells are not in the order they first went off there, or a spell cast in two parts is not in both: "' + order + '"');
  const sw = ((G[2] || {}).hits || []).find((h) => h.spell === 'Shadow Whirlwind') || {};
  if ((sw.casts || []).length !== 1 || sw.low !== 40 || sw.lowWho !== 'Bo' || sw.up !== 1 || sw.of !== 2 || String(sw.ps) !== '3') bad('Shadow Whirlwind under the trash before Mchimba does not have just that part\'s cast, its own lowest (40%, Bo) and its own "up" count (1 of 2): ' + JSON.stringify({ casts: (sw.casts || []).length, low: sw.low, lowWho: sw.lowWho, up: sw.up, of: sw.of, ps: sw.ps }));
  const bs = ((G[1] || {}).hits || [])[0] || {}; if (bs.died !== 1 || bs.up !== 1 || bs.of !== 2) bad('Boss Slam does not count its death and its one hit with a defensive up: ' + JSON.stringify({ died: bs.died, up: bs.up, of: bs.of }));
  if (X.mpxSvGroups({ pulls: R.pulls }).length !== 0) bad('a key whose big hits were not read gets parts of the key with nothing in them');
  // the numbers on top
  const D = { death: [{ t: 100, i: 1, who: 'Bo' }, { t: 200, i: 2, who: 'Ann' }], close: [{ t: 15, i: 0, who: 'Ann', left: 3, spell: 'Shadow Whirlwind', ready: [] }, { t: 15.4, i: 0, who: 'Bo', left: 9, spell: 'Shadow Whirlwind', ready: ['Divine Protection'] }, { t: 90, i: 1, who: 'Bo', left: 6, spell: 'Purification Strike', ready: ['Divine Protection'] }], avoid: [{ n: 3 }, { n: 1 }] };
  const rows = (miss, ch, ans) => ({ alive: [{ l: 'Defensives on big hits', nMiss: miss }, { l: 'Healthstone or health potion', ch, ans }] });
  let Nn = null; try { Nn = X.mpxSvNums(R, D, [{ name: 'Ann', rows: rows(0, 1, 1) }, { name: 'Bo', rows: rows(3, 3, 0) }]); } catch (e) { bad('the numbers on top crashed: ' + String(e.message).slice(0, 140)); return; }
  if (Nn.dN !== 2 || Nn.cN !== 3 || Nn.aN !== 4) bad('the numbers on top are not the mistakes\' counts (2 deaths, 3 close calls, 4 avoidable hits): ' + JSON.stringify({ dN: Nn.dN, cN: Nn.cN, aN: Nn.aN }));
  if (Nn.miss !== 3 || !Nn.worst || Nn.worst.name !== 'Bo' || Nn.worst.n !== 3) bad('the defensives left unpressed are not the Report card\'s own count (3, all Bo\'s): ' + JSON.stringify({ miss: Nn.miss, worst: Nn.worst }));
  if (Nn.hsCh !== 4 || Nn.hsAns !== 1) bad('the Healthstone or potion moments are not the Report card\'s own (1 of 4): ' + JSON.stringify({ ch: Nn.hsCh, ans: Nn.hsAns }));
  if (!Nn.g0 || Nn.g0.length !== 2 || Nn.g0[0].spell !== 'Shadow Whirlwind') bad('the one cast that left the most under 15% at once is not found (Shadow Whirlwind, two players within 1.5 s)');
  // the Report card's rows carry the counts the tab reads
  if (MPT.indexOf("{ f: cov / (cov + miss), nMiss: miss,") < 0 || MPT.indexOf("f: ans / ch, ch, ans, uses, hsN: hsT.length, potN: potT.length, mis: ML,") < 0 || MPT.indexOf("n: q.spell, sp: q.spell, left: q.left }))") < 0 || MPT.indexOf("n: 'died', to: dTo(q) }))") < 0) bad('the Report card\'s Staying alive rows no longer carry the counts the Survival tab reads (nMiss; ch, ans, uses, Healthstones, potions and each missed moment)');
  // the Companion's Big hits chapter keeps its one list, the worst first
  try { const names = ['mpMM', 'mpCC', 'mpWho', 'mpT1', 'mpAnd', 'mpChap', 'mpBhWhere', 'mpBhT', 'mpBhIc', 'mpBhRdy', 'mpBhNext', 'mpBigChap', 'mpBigHtml'];
    const Y = vm.runInNewContext('const MPC_ON = true;\n' + names.map((n) => H.grab(n, MPT)).join('\n') + '\n({ mpBigHtml })', ctx()); R.big.per = { Ann: { n: 4, d: 1, died: 1, low: 0, lowAt: 'Boss Slam', lowT: 200 }, Bo: { n: 4, d: 1, low: 6, lowAt: 'Purification Strike', lowT: 90 } };
    const y = Y.mpBigHtml(R), yo = [...y.matchAll(/<b class="bh-sp">([^<]*)<\/b><span>([^<]*)<\/span>/g)].map((m) => m[1]).join(', ');
    if (/bh-grp/.test(y) || yo !== 'Boss Slam, Shadow Whirlwind, Purification Strike, Late Bolt') bad('the Companion\'s Big hits chapter no longer keeps its one list, the worst first: "' + yo + '"'); }
  catch (e) { bad('the Companion\'s Big hits chapter crashed: ' + String(e.message).slice(0, 120)); }
};
if (require.main === module) { const H = require('./site-helpers.js'); let n = 0; module.exports(H, (a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ Survival: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
