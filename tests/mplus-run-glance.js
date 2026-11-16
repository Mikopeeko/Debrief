// Mythic+ Route, the run at a glance on top of the summary (Nov 16, Flex with a picture of an end-of-key panel: "What if the summary section had that or
// something like that at the top?"). This runs mpxRunGlance on a made-up key (a trash pull, a boss, a wipe on the next boss, then its kill; two deaths; some
// kicks; finished in time) and fails if: a pull's block is missing or the wrong kind, a block or a death stops picking its pull, a killed boss loses its
// label or the wipe counts as a kill, the deaths aren't numbered in order, the time to spare or the +3/+2/+1 marks go, or Route's summary stops
// showing it on top. contradictions.js runs it on every build. Each part fails on the page before it.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusRunGlance(say) {
  const bad = (m) => say('Mythic+ Route', 'the run at a glance', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const fn = (n) => { const a = s.indexOf('\nfunction ' + n + '('); if (a < 0) throw new Error('src/mptab.js has no function ' + n); let i = s.indexOf('{', a), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(a, i + 1); };
  let G; try { G = vm.runInNewContext('const MPC_ON = false, esc = (x) => String(x), mpT1 = (h) => " data-tt=\\"" + String(h).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") + "\\"", mpMM = (t) => Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0"), mpCap = (x) => x[0].toUpperCase() + x.slice(1), mpPullName = (R, i) => R.pulls[i].boss || "pull " + (i + 1), mpBossPic = (n) => "pic-" + n, mpNpcPic = () => "", mpxTo = (x) => x, plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");\n' + fn('mpClock') + '\n' + fn('mpxRunGlance') + '\nmpxRunGlance'); } catch (e) { bad('the run at a glance no longer runs by itself: ' + String(e.message).slice(0, 140)); return; }
  const R = { run: { end: 1500, clock: { par: 1980, time: 1490, deathCost: 30 } }, pulls: [
    { s: 10, e: 100, dur: 90, deaths: [{ t: 60, who: 'Sornarjr', to: 'Bite' }], kicks: [{ t: 20 }, { t: 25 }, { t: 70 }] },
    { s: 200, e: 400, dur: 200, boss: 'The Golden Serpent', kill: true, deaths: [], kicks: [{ t: 210 }] },
    { s: 600, e: 700, dur: 100, boss: 'Mchimba the Embalmer', kill: false, deaths: [{ t: 650, who: 'Flex', to: 'Putrid Seekers' }], kicks: [] },
    { s: 800, e: 1000, dur: 200, boss: 'Mchimba the Embalmer', kill: true, deaths: [], kicks: [] }] };
  let h = ''; try { h = G(R, null); } catch (e) { bad('the run at a glance crashed on a made-up key: ' + String(e.message).slice(0, 120)); return; }
  const kinds = (h.match(/class="mpgl-b mpgl-(\w+)"/g) || []).map((x) => x.slice(19, -1)).join(',');
  if (kinds !== 'trash,boss,wipe,boss') bad('the pulls\' blocks read "' + kinds + '", not trash, boss, wipe, boss');
  if ((h.match(/class="mpgl-b mpgl-\w+" style="[^"]*" data-mpxpull="\d+"/g) || []).length !== 4) bad('a pull\'s block no longer picks its pull on the map');
  const bosses = (h.match(/<b>([^<]+)<\/b><small>Down at [^<]+<\/small>/g) || []).length; if (bosses !== 2) bad('the killed bosses\' labels are ' + bosses + ', not 2 (a wipe must not count as a kill)');
  if (!/Down at [^<]* after 1 wipe/.test(h)) bad('a boss killed after a wipe no longer says so');
  const deaths = (h.match(/class="mpgl-d" data-mpxpull="(\d+)"[^>]*>(\d+)<\/i>/g) || []).map((x) => x.replace(/.*data-mpxpull="(\d+)".*>(\d+)<\/i>/, '$1:$2')).join(','); if (deaths !== '0:1,2:2') bad('the deaths read "' + deaths + '", not numbered 1 and 2 on their pulls');
  if (h.indexOf(' spare</span>') < 0 || !/class="mpgl-fin" style="left:[\d.]+%"><b>24:/.test(h)) bad('the finish or the time to spare is gone');
  for (const l of ['+3', '+2', '+1']) if (h.indexOf('<b>' + l + '</b> ') < 0) bad('the ' + l + ' mark is gone from the axis');
  if (s.indexOf("const gl = mpxRunGlance(R, F); return top || gl ? '<div class=\"mpdb mpx-whole\" role=\"region\" aria-label=\"The whole key\" id=\"mptCD\">' + gl + bd + top + '</div>' : '';") < 0) bad('Route\'s summary no longer shows the run at a glance on top ("What if the summary section had that or something like that at the top?")');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ run at a glance: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
