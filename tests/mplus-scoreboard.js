// Mythic+ Summary: the group at a glance under the run, and the tab's name (Nov 16, Flex with a picture of an end-of-key scoreboard: "lets build the idea i
// sent and then evaluate", then "rename the tab summary again i think that makes the most sense"; later the same night, on the table: "Looks like a 5 year
// old designed it", "its just the player chart that looks like doggy doo doo", then, of three looks: "go with C, but make the banner more interesting... visually its lacking flavor", so a banner a player). This runs mpxBoard on a made-up
// group and fails if: the group stops being a banner a player, a player's banner loses a number (DPS, HPS,
// damage done, healing done, deaths, damage taken, avoidable damage, kicks, dispels) or their item level, a banner stops opening their Report card, the
// banners leave role order, the key's result leaves the top of the group, the group leaves the Summary, or the tab is no longer called Summary.
// contradictions.js runs it on every build. Each part fails on the page before it.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusScoreboard(say) {
  const bad = (m) => say('Mythic+ Summary', 'the group at a glance', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const fn = (n) => { const a = s.indexOf('\nfunction ' + n + '('); if (a < 0) throw new Error('src/mptab.js has no function ' + n); let i = s.indexOf('{', a), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(a, i + 1); };
  let B; try { B = vm.runInNewContext('const MPC_ON = false, esc = (x) => String(x), mpT1 = (h) => " data-tt=\\"x\\"", mpGF = (v) => String(Math.round(v)), plural = (n, w) => n + " " + w + (n === 1 ? "" : "s"), mpCC = () => "#fff", mpxResult = (R, F) => "<i class=\\"RES\\">" + (F ? "fast" : "") + "</i>", mpxWhoIc = () => "<img src=\\"ic.jpg\\">", E = { CLASSES: { MAGE: ["Mage"], DRUID: ["Druid"] } }, mpByRole = (a, b) => ({ tank: 0, healer: 1, dps: 2 }[a.role] - { tank: 0, healer: 1, dps: 2 }[b.role]);\n' + fn('mpxBoard') + '\nmpxBoard'); } catch (e) { bad('the scoreboard no longer runs by itself: ' + String(e.message).slice(0, 140)); return; }
  const R = { people: [{ name: 'Dps', role: 'dps', cls: 'MAGE', spec: 'Fire', dps: 300, hps: 0, kicks: 7, deaths: 1, avoidDmg: 5000, avoid: 2, dispels: 0, purges: 1 }, { name: 'Tank', role: 'tank', cls: 'DRUID', spec: 'Guardian', dps: 100, hps: 10, kicks: 3, deaths: 0, avoidDmg: 0, avoid: 0, dispels: 0, purges: 0 }],
    pulls: [{ dur: 10, dmg: { Dps: 400, Tank: 120 }, heal: { Dps: 0, Tank: 20 } }], ptk: { Dps: [5, 5, 10], Tank: [100, 200] } };
  const M = { L: [{ name: 'Dps', rows: { prep: [{ l: 'Flask', v: 'on' }, { l: 'Item level', v: '331 (group 330)' }], mech: [], alive: [], perf: [] } }] };
  let h = ''; try { h = B(R, M); } catch (e) { bad('the scoreboard crashed on a made-up group: ' + String(e.message).slice(0, 120)); return; }
  // (banners, one a player: the column titles once, then a banner a player with every number)
  const heads = ((h.split('<div class="mpbn-r mpbn-h">')[1] || '').split('</div>')[0].match(/<span>[^<]+<\/span>/g) || []).map((x) => x.replace(/<[^>]+>/g, '')).join(', ');
  if (heads !== 'Player, DPS, HPS, Deaths, Damage taken, Avoidable, Kicks, Dispels') bad('the group\'s column titles read "' + heads + '", not Player to Dispels (Flex, Nov 16: "go with C")');
  const rows = h.split('<div class="mpbn-r mpbn-b" ').slice(1);
  if (rows.length !== 2 || rows[0].indexOf('>Tank</b>') < 0) bad('the group is not one banner a player in role order (tank first): ' + rows.length + ' banners');
  else { const d = rows[1];
    if (d.indexOf('data-mpxv="mis" data-mpxp="Dps"') < 0) bad('a player\'s banner no longer opens their Report card');
    if (d.indexOf('<img src="ic.jpg">') < 0 || d.indexOf('Fire Mage') < 0 || d.indexOf('· 331</em>') < 0) bad('a player\'s banner lost its portrait, spec or item level');
    const want = '<span class="mpbn-n mpbn-top">300<small>4000</small></span><span class="mpbn-n">0<small>0</small></span><span class="mpbn-n mpbn-bad">1</span><span class="mpbn-n">20</span><span class="mpbn-n mpbn-bad" tabindex="0" data-tt="x">5000</span><span class="mpbn-n mpbn-top">7</span><span class="mpbn-n mpbn-top">1</span></div>';
    if (d.indexOf(want) < 0) bad('a player\'s numbers are no longer DPS (with damage done), HPS (with healing done), deaths, damage taken, avoidable damage, kicks and dispels, with the group\'s best marked: ' + d.slice(d.indexOf('<span class="mpbn-n'), d.indexOf('<span class="mpbn-n') + 160));
    if (rows[0].indexOf('<span class="mpbn-n mpbn-top">10<small>200</small></span>') < 0) bad('the tank\'s banner lost its healing done or HPS'); }
  const ri = h.indexOf('<i class="RES">'); if (ri < 0 || ri > h.indexOf('mpbn-h')) bad('the key\'s result is no longer on top of the group (Flex, Nov 16: "should be in the group section")');
  if (s.indexOf("id=\"mptCD\">' + gl + bd + top + '</div>' : '';") < 0 || s.indexOf("bd = mpxBoard(R, M, F); }") < 0) bad('the scoreboard is no longer on the Summary, under the run');
  if (s.indexOf("const MPX_TABS = [['map', 'Summary'], ['rep', 'Players'], ['gra', 'Graphs']]") < 0 || s.indexOf("const MPX_VIEWS = [['map', 'Summary'],") < 0) bad('the main tab is no longer called Summary ("rename the tab summary again i think that makes the most sense")');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ scoreboard: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
