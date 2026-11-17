// Summary round 2, the reading (Nov 17, Flex: "ok go for it", of the marked mock-up). It fails if: a ghost that missed Soul Sever can be blamed on a
// player who was already dead again (Oct 22 pull 16: Urgdragon died at 3:39 and Zaffia at 3:38, and at 3:40 "their ghosts weren't in Soul Sever"); a
// battle res stops showing in How it went (the same pull read "4 players already dead" under 5 deaths, because Fourinches brought Kargaryen back at
// 3:38); the comparison line goes back to "ahead on damage" with nothing more on a wipe that came down to damage; or a res row is taken out and put back
// on every pass (the page kept redrawing, 380 changes in 4 s). contradictions.js runs it on every build. Each part fails on the round-1 commit.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function summaryReading(say) {
  const bad = (m) => say('Summary', 'the reading, Nov 17', m);
  let s, en, css; try { const rd = (f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'); s = rd('ui.js'); en = rd('engine.js'); css = rd('shell.html'); } catch (e) { bad('could not read src: ' + e.message); return; }
  const has = (t, why, src) => { if ((src || s).indexOf(t) < 0) bad(why); };
  has('const dead447 = (ow, t) =>', 'the ghost check no longer knows who was dead', en);
  has('if (ow && dead447(ow, f.t)) continue; MS(', 'a ghost that missed Soul Sever can be blamed on a player who was already dead again (Oct 22 pull 16, Urgdragon and Zaffia)', en);
  if (!/z\.t > lt && z\.t <= t/.test(en)) bad('a player brought back by a battle res is still treated as dead for their ghost');
  has('function smRes()', 'How it went no longer shows a battle res');
  has("el.className = 'sm-res';", 'How it went no longer shows a battle res');
  if (/sm-res[^\n]{0,40}dbt-chr|className = 'dbt-chr sm-res'/.test(s)) bad('the battle res row is a .dbt-chr, so the counts would read it');
  has("'$1 over the whole pull, but ' + CL[rc.cat] + '$2'", 'the comparison line says "ahead on damage" with nothing more on a damage wipe again (Oct 22 pull 16)');
  has("shield: 'Eternal Nightfall\\'s shield needed it all at once'", 'the comparison line lost what a shield wipe needed');
  has('const liveMiss = missed.filter(', 'the Dreadmarch ghost panel (Summary\'s Also hurt) can name a dead player for a ghost again (Oct 22 pull 16, 3:40)', en);
  has("(liveMiss.length === 1 ? ' wasn", 'the ghost sentence counts dead players again', en);
  has("if (chn.querySelector(':scope > .sm-res[data-k=", 'the battle res rows are taken out and put back on every pass again (the page kept redrawing)');
  if (/chn\.querySelectorAll\(':scope > \.sm-res'\)\.forEach\(\(x\) => x\.remove\(\)\)/.test(s)) bad('the battle res rows are taken out on every pass again (the page kept redrawing)');
  has('.dbt-why .dbt-chn > .sm-res { display: grid;', 'the battle res row has no look', css);
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Summary reading, Nov 17: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
