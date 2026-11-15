// Mythic+ Big hits, sorted by part of the key (Nov 15, Flex: "the abilities need to be organized better, by bosses/trash packs/pull numbers or something",
// then "the big hits section needs to be sorted better"; seen on his +19 Kings' Rest of Sep 25, report dtMfgnRvDwBLPCKZ fight 2, where eight spells were one
// list by lowest health, trash and bosses mixed, each spell under the place of its first cast only). This runs the chapter's own code (mpBigHtml) on a made-up
// key and fails if, on the website: the spells are not grouped by part of the key in the key's order (the trash before each boss with its pull numbers, then
// the boss), a part's spells are not in the order they first went off, a spell cast in two parts is not in both with that part's casts and its own lowest,
// or a boss part is not marked as one; and if the Companion's card does not keep its one list, the worst first. contradictions.js runs it on every build.
// Each part fails on the page as it was at 78fa4907.
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
module.exports = function bigHitsOrder(H, say) {
  const bad = (m) => say('Mythic+ Big hits', 'sorted by part of the key', m);
  const MPT = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8');
  const names = ['mpMM', 'mpCC', 'mpWho', 'mpT1', 'mpAnd', 'mpChap', 'mpBhWhere', 'mpBhT', 'mpBhIc', 'mpBhRdy', 'mpBigChap', 'mpBigHtml'];
  const run = (card) => vm.runInNewContext('const MPC_ON = ' + (card ? 'true' : 'false') + ';\n' + names.map((n) => H.grab(n, MPT)).join('\n') + '\n({ mpBigHtml })', {
    E: { CLASSES: {} }, esc: (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'), plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), spellIcon: () => '', mpClock: () => null, mpNo: (r, n) => n, mpByRole: () => 0 });
  const w = (name, left, died) => ({ name, pct: 70, left, died: !!died, def: [] });
  // the key: pulls 1 and 2 of trash, The Golden Serpent, pull 4 of trash, Mchimba. The reader lists the spells worst first: Boss Slam, then Shadow Whirlwind
  // (cast in pull 1 and again in pull 4), then Purification Strike (pull 2), then Late Bolt (pull 4, before Shadow Whirlwind's second cast there)
  const R = { pulls: [{ n: 1 }, { n: 2 }, { n: 3, boss: 'The Golden Serpent' }, { n: 4 }, { n: 5, boss: 'Mchimba' }], people: [{ name: 'Ann', role: 'dps' }, { name: 'Bo', role: 'healer' }],
    big: { tanks: [], close: [], per: { Ann: { n: 4, d: 0, died: 1, low: 0, lowAt: 'Boss Slam', lowT: 200 }, Bo: { n: 4, d: 0, low: 9, lowAt: 'Shadow Whirlwind', lowT: 15 } }, hits: [
      { spell: 'Boss Slam', id: 0, src: 'The Golden Serpent', size: 90, low: 0, lowWho: 'Ann', died: 1, casts: [{ t: 200, pull: 2, who: [w('Ann', 0, true), w('Bo', 30)] }] },
      { spell: 'Shadow Whirlwind', id: 0, src: 'Shadow-Borne Champion', size: 80, low: 3, lowWho: 'Ann', died: 0, casts: [{ t: 15, pull: 0, who: [w('Ann', 3), w('Bo', 9)] }, { t: 330, pull: 3, who: [w('Ann', 50), w('Bo', 40)] }] },
      { spell: 'Purification Strike', id: 0, src: 'Purification Construct', size: 75, low: 6, lowWho: 'Bo', died: 0, casts: [{ t: 90, pull: 1, who: [w('Ann', 60), w('Bo', 6)] }] },
      { spell: 'Late Bolt', id: 0, src: 'Risen Hexer', size: 70, low: 45, lowWho: 'Ann', died: 0, casts: [{ t: 310, pull: 3, who: [w('Ann', 45), w('Bo', 70)] }] }] } };
  let X, Y; try { X = run(false); Y = run(true); } catch (e) { bad('the Big hits chapter no longer runs by itself: ' + String(e.message).slice(0, 140)); return; }
  let h = ''; try { h = X.mpBigHtml(R); } catch (e) { bad('the Big hits chapter crashed on a key with bosses and trash: ' + String(e.message).slice(0, 140)); return; }
  const parts = [...h.matchAll(/<p class="bh-gh2"><b class="bh-gt( bh-gtb)?">([^<]*)<\/b><span class="bh-gs">([^<]*)<\/span><\/p>/g)].map((m) => (m[1] ? '★' : '') + m[2] + ' (' + m[3] + ')');
  const want = ['Trash before The Golden Serpent (pulls 1 and 2 · 2 big hits)', '★The Golden Serpent (1 big hit)', 'Trash before Mchimba (pull 4 · 2 big hits)'];
  if (parts.join(' | ') !== want.join(' | ')) bad('the big hits are not grouped by part of the key in its order: "' + parts.join(' | ') + '" (it must be "' + want.join(' | ') + '")');
  const order = h.split('<div class="bh-grp">').slice(1).map((g) => [...g.matchAll(/<b class="bh-sp">([^<]*)<\/b>/g)].map((m) => m[1]).join(', '));
  if (order.join(' | ') !== 'Shadow Whirlwind, Purification Strike | Boss Slam | Late Bolt, Shadow Whirlwind') bad('a part\'s spells are not in the order they first went off there, or a spell cast in two parts is not in both: "' + order.join(' | ') + '"');
  const last = h.split('<div class="bh-grp">')[3] || '', sw = last.slice(last.indexOf('Shadow Whirlwind'));
  if (!/<b>1<\/b> cast/.test(sw) || !/lowest <b class="">40%<\/b>/.test(sw.replace(/<b class="bh-warn">/g, '<b class="">'))) bad('Shadow Whirlwind under the trash before Mchimba does not have just that part\'s cast and its own lowest (1 cast, lowest 40%)');
  if (!/Shadow-Borne Champion · pull 1</.test(h)) bad('a spell in a part of several trash pulls does not say which pull it was cast in');
  if (/Trash before The Golden Serpent<\/span>/.test(h)) bad('a row still repeats where it was cast after its part says it');
  // the Companion's card: one list, the worst first, no parts
  let y = ''; try { y = Y.mpBigHtml(R); } catch (e) { bad('the Big hits chapter crashed on the Companion\'s card: ' + String(e.message).slice(0, 120)); return; }
  const yo = [...y.matchAll(/<b class="bh-sp">([^<]*)<\/b><span>([^<]*)<\/span>/g)].map((m) => m[1]).join(', ');
  if (/bh-grp/.test(y) || yo !== 'Boss Slam, Shadow Whirlwind, Purification Strike, Late Bolt') bad('the Companion\'s card no longer keeps its one list of big hits, the worst first: "' + yo + '"');
};
if (require.main === module) { const H = require('./site-helpers.js'); let n = 0; module.exports(H, (a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ Big hits order: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
