// Mythic+ Summary: the group at a glance under the run, and the tab's name (Nov 16, Flex with a picture of an end-of-key scoreboard: "lets build the idea i
// sent and then evaluate", then "rename the tab summary again i think that makes the most sense"). This runs mpxBoard on a made-up group and fails if a
// player's row loses a number (deaths, damage taken, avoidable, damage, DPS, healing, HPS, kicks, dispels), stops opening their Report card, the rows
// leave role order, the scoreboard leaves the Summary, or the tab is no longer called Summary. contradictions.js runs it on every build. Each part fails
// on the page before it.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusScoreboard(say) {
  const bad = (m) => say('Mythic+ Summary', 'the group at a glance', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const fn = (n) => { const a = s.indexOf('\nfunction ' + n + '('); if (a < 0) throw new Error('src/mptab.js has no function ' + n); let i = s.indexOf('{', a), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(a, i + 1); };
  let B; try { B = vm.runInNewContext('const MPC_ON = false, esc = (x) => String(x), mpT1 = (h) => " data-tt=\\"x\\"", mpGF = (v) => String(Math.round(v)), plural = (n, w) => n + " " + w + (n === 1 ? "" : "s"), mpCC = () => "#fff", mpxWhoIc = () => "", mpByRole = (a, b) => ({ tank: 0, healer: 1, dps: 2 }[a.role] - { tank: 0, healer: 1, dps: 2 }[b.role]);\n' + fn('mpxBoard') + '\nmpxBoard'); } catch (e) { bad('the scoreboard no longer runs by itself: ' + String(e.message).slice(0, 140)); return; }
  const R = { people: [{ name: 'Dps', role: 'dps', cls: 'MAGE', dps: 300, hps: 0, kicks: 7, deaths: 1, avoidDmg: 5000, avoid: 2, dispels: 0, purges: 1 }, { name: 'Tank', role: 'tank', cls: 'DRUID', dps: 100, hps: 10, kicks: 3, deaths: 0, avoidDmg: 0, avoid: 0, dispels: 0, purges: 0 }],
    pulls: [{ dur: 10, dmg: { Dps: 400, Tank: 120 }, heal: { Dps: 0, Tank: 20 } }], ptk: { Dps: [5, 5, 10], Tank: [100, 200] } };
  const M = { L: [{ name: 'Dps', rows: { prep: [{ l: 'Flask', v: 'on' }, { l: 'Item level', v: '331 (group 330)' }], mech: [], alive: [], perf: [] } }] };
  let h = ''; try { h = B(R, M); } catch (e) { bad('the scoreboard crashed on a made-up group: ' + String(e.message).slice(0, 120)); return; }
  const rows = h.split('<div class="mpsb-r" ').slice(1);
  if (rows.length !== 2 || rows[0].indexOf('>Tank</b>') < 0) bad('the scoreboard\'s rows are not one a player in role order (tank first)');
  else { const d = rows[1];
    for (const [w, what] of [['data-mpxv="mis" data-mpxp="Dps"', 'opens the player\'s Report card'], ['331 item level', 'item level'], ['<b class="mpsb-bad">1</b>', 'deaths'], ['<span>20</span>', 'damage taken'], ['>5000</b>', 'avoidable damage'], ['<span>4000</span>', 'damage'], ['<b>300</b>', 'DPS'], ['<span>7</span>', 'kicks']]) if (d.indexOf(w) < 0) bad('a player\'s row lost its ' + what);
    if (rows[0].indexOf('<span>200</span>') < 0 || rows[0].indexOf('<b>10</b>') < 0) bad('the tank\'s row lost its healing or HPS'); }
  if (s.indexOf("id=\"mptCD\">' + gl + bd + top + '</div>' : '';") < 0 || s.indexOf("bd = mpxBoard(R, M); }") < 0) bad('the scoreboard is no longer on the Summary, under the run');
  if (s.indexOf("const MPX_TABS = [['map', 'Summary'], ['rep', 'Players'], ['gra', 'Graphs']]") < 0 || s.indexOf("const MPX_VIEWS = [['map', 'Summary'],") < 0) bad('the main tab is no longer called Summary ("rename the tab summary again i think that makes the most sense")');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ scoreboard: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
