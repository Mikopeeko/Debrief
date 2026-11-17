// Also hurt, the wording (Nov 17, Flex, of Oct 22 pull 31's Also hurt: "Some weird wording that could be fixed and cleaned up"). It fails if:
// a merged line puts every name its sentence mentions in front again ("Huservoker, Ashdknight, Flëxørçïst and Kargaryen took 4.4 s to dispel it",
// when Huservoker alone dispelled it); a moment with no sentence glues its lines under everyone's names with "(+1 more)" again (Dragooned's and
// Vandagos's deaths at 3:35 and 3:53 read as one); "2 times." comes back in front of a line; "Set 2 ·" or "Dreadmarch #1 ·" labels show again; a
// sentence that starts with a verb gets "Name's" again ("Vandagos's Took Sever", HWFB pull 16); or the Venomfang, Gloombomb clip and ghost sentences
// go back to their old words. contradictions.js runs it on every build. Each part fails on e7d1072f.
'use strict';
const fs = require('fs'), path = require('path');
module.exports = function alsoHurtWords(say) {
  const bad = (m) => say('Summary', 'Also hurt wording, Nov 17', m);
  let s, en, sh; try { const rd = (f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8'); s = rd('ui.js'); en = rd('engine.js'); sh = rd('shell.html'); } catch (e) { bad('could not read src: ' + e.message); return; }
  const has = (t, why, src) => { if ((src || s).indexOf(t) < 0) bad(why); };
  has("var pre = whoL.length && !whoL.some(function (n) { return wy.indexOf(n) >= 0; }) ? names(m) : '';", 'a merged line puts every name its sentence mentions in front again (Oct 22 pull 31, Venomfang)', sh);
  if (/who = \(M\[i\]\.who && M\[i\]\.who\.length \? M\[i\]\.who : inText\(M\[i\]\)\)/.test(sh)) bad('the merged lines take their names from the sentence again', sh);
  has("var wy = wy0 || ls.join('. ') ||", 'a moment with no sentence glues its lines under everyone\'s names again (Oct 22 pull 31, 3:46 Dragooned and Vandagos)', sh);
  has(String.raw`.replace(/\s*\(\+\d+ more\)/g, '')`, 'a merged line can end in "(+1 more)" again', sh);
  has("return '<span class=\"ahg-ln\">' + mm(m.t) + ': ' +", 'a merged line\'s time reads differently from every other row again', sh);
  if (/e\.n > 1 \? e\.n \+ ' times\. '/.test(s)) bad('"2 times." is back in front of an Also hurt line (Oct 22 pull 31 and HWFB pull 16)');
  has('return m.why && /^[^:.]{1,40}: [^.]{0,30}$/.test(l0) ? m.why : l0', 'a single row shows a bare label like "Sever: Stack 3" over its sentence again (HWFB pull 16)', sh);
  has(String.raw`String(m.lines[0]).replace(/^(?:Set|Dreadmarch|Deluge|Wave|Wind|Intermission) #?\d+\s*·\s*/i, '')`,'a single Also hurt row shows its "Set 4 ·" or "Dreadmarch #2 ·" label again', sh);
  has("&& !/^(?:They|Was|Were|Had|Took|Got|", 'a sentence that starts with a verb gets "Name\'s" again ("Vandagos\'s Took Sever")');
  has("'Venomfang stayed on ' + took + ' before ' + nm0(x.by) + ' dispelled it.'", 'Venomfang reads "X took N s to dispel it" again', en);
  has("free[0] + ': dispel the next Venomfang as soon as it lands.'", 'Venomfang\'s next step reads "X takes the next Venomfang" again', en);
  has("' and had to pick up soul fragments too.'", 'the Gloombomb clip reads "so they also had to collect souls" again', en);
  has("'Their ghost caught up with them, and they were mind controlled.'", 'a ghost that caught its player says "again" or "reached them" again (Dreadmarch is the mind control, Manifestation of Dread the ghosts)', en);
  has("'\\'s ghost caught up with them at ' + h.fmtT(x.t) + ', and they were mind controlled.'", 'the ghost panel says "again" or "reached them at" again', en);
  has('/^(?:Got|Was) clipped by/.test(q.detail', 'the wipe reader stopped counting the bombs that went off in a feared raid (with the new clip words, bcA9 fight 10 and agt6 fight 4 lost their bombs)', en);
  let ak = ''; try { ak = fs.readFileSync(path.join(__dirname, 'answer-key.js'), 'utf8'); } catch (e) { ak = ''; } if (ak && (ak.match(/ghost caught up with them, and they were mind controlled/g) || []).length < 2) bad('the answer key no longer reads the new ghost words, so it finds no ghost that caught its player (57 mismatches on Nov 17)');
  if (sh.indexOf('.dbt-why .dbt-add .ah-ln .ahg-ln:not(:has(> .ahg-ln))::before') < 0) bad('Also hurt lost its bullets: each time on its own line (Nov 17, Flex: "format this with bullets so you can see each line clearly")', sh);
  if (en.indexOf("(free.length === 1 ? ' had a dispel ready' : ' had dispels ready')") < 0) bad('the Venomfang sentence lost "had dispels ready", which the answer key reads to count the dispellers');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Also hurt wording, Nov 17: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
