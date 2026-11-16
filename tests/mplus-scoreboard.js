// Mythic+ Summary: the group at a glance under the run, and the tab's name (Nov 16, Flex with a picture of an end-of-key scoreboard: "lets build the idea i
// sent and then evaluate", then "rename the tab summary again i think that makes the most sense"; later the same night, on the table: "Looks like a 5 year
// old designed it", "its just the player chart that looks like doggy doo doo", then, of three looks: "go with C, but make the banner more interesting... visually
// its lacking flavor", so a banner a player; then "I like the design but its unpolished and unrefined" with the game's own end-of-key board: "hoping to get a
// similar quality", and of its column titles: "id like each of these columns in the visual as well"). This runs mpxBoard on a made-up group and fails if:
// the columns stop being Player, Rating, Deaths, Damage taken, Avoidable, Damage, DPS, Healing, HPS, Interrupts, Dispels; a row loses a number, its unit
// or its item level; the DPS and HPS bars or the group's best stop being marked; the player picked at the top stops being framed; the Raider.IO rating stops
// showing in its colour (or a dash when unknown); a row stops opening their Report card; the rows leave role order; the key's result leaves the top of the
// group; the realms stop being read for Raider.IO; the group leaves the Summary, or the tab is no longer called Summary.
// contradictions.js runs it on every build. Each part fails on the page before it.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusScoreboard(say) {
  const bad = (m) => say('Mythic+ Summary', 'the group at a glance', m);
  let s; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js'); return; }
  const fn = (n) => { const a = s.indexOf('\nfunction ' + n + '('); if (a < 0) throw new Error('src/mptab.js has no function ' + n); let i = s.indexOf('{', a), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(a, i + 1); };
  let B; try { B = vm.runInNewContext('const MPC_ON = false, MP = { pp: "Dps" }, esc = (x) => String(x), mpT1 = (h) => " data-tt=\\"x\\"", mpGF = (v) => String(Math.round(v)), plural = (n, w) => n + " " + w + (n === 1 ? "" : "s"), mpCC = () => "#fff", mpxResult = (R, F) => "<i class=\\"RES\\">" + (F ? "fast" : "") + "</i>", mpxWhoIc = () => "<img src=\\"ic.jpg\\">", mpxRio = () => ({ Dps: { score: 3100, col: "#ff8000" } }), mpMine = () => "", E = { CLASSES: { MAGE: ["Mage"], DRUID: ["Druid"] } }, mpByRole = (a, b) => ({ tank: 0, healer: 1, dps: 2 }[a.role] - { tank: 0, healer: 1, dps: 2 }[b.role]);\n' + fn('mpxBoard') + '\nmpxBoard'); } catch (e) { bad('the scoreboard no longer runs by itself: ' + String(e.message).slice(0, 140)); return; }
  const R = { people: [{ name: 'Dps', role: 'dps', cls: 'MAGE', spec: 'Fire', dps: 300, hps: 0, kicks: 7, deaths: 1, avoidDmg: 5000, avoid: 2, dispels: 0, purges: 1 }, { name: 'Tank', role: 'tank', cls: 'DRUID', spec: 'Guardian', dps: 100, hps: 10, kicks: 3, deaths: 0, avoidDmg: 0, avoid: 0, dispels: 0, purges: 0 }],
    pulls: [{ dur: 10, dmg: { Dps: 400, Tank: 120 }, heal: { Dps: 0, Tank: 20 } }], ptk: { Dps: [5, 5, 10], Tank: [100, 200] } };
  const M = { L: [{ name: 'Dps', rows: { prep: [{ l: 'Flask', v: 'on' }, { l: 'Item level', v: '331 (group 330)' }], mech: [], alive: [], perf: [] } }] };
  let h = ''; try { h = B(R, M); } catch (e) { bad('the scoreboard crashed on a made-up group: ' + String(e.message).slice(0, 120)); return; }
  // (the game's board: the column titles once, then a row a player with every number)
  const heads = ((h.split('<div class="mpbn-r mpbn-h">')[1] || '').split('</div>')[0].match(/<span[^>]*>[^<]+<\/span>/g) || []).map((x) => x.replace(/<[^>]+>/g, '')).join(', ');
  if (heads !== 'Player, Rating, Deaths, Damage taken, Avoidable, Damage, DPS, Healing, HPS, Interrupts, Dispels') bad('the group\'s column titles read "' + heads + '", not the game board\'s Rating to Dispels (Flex, Nov 16: "id like each of these columns in the visual as well")');
  const rows = h.split('<div class="mpbn-r mpbn-b').slice(1);
  if (rows.length !== 2 || rows[0].indexOf('>Tank</b>') < 0) bad('the group is not one row a player in role order (tank first): ' + rows.length + ' rows');
  else { const d = rows[1];
    if (d.indexOf('data-mpxv="mis" data-mpxp="Dps"') < 0) bad('a player\'s row no longer opens their Report card');
    if (d.indexOf('<img src="ic.jpg">') < 0 || d.indexOf('<small>331 item level</small>') < 0 || d.indexOf('mpbn-role mpbn-role-dps') < 0) bad('a player\'s row lost its portrait, its role mark or its item level under the name, like the game\'s board');
    if (rows[0].indexOf('<small>Guardian Druid</small>') < 0) bad('a player with no item level no longer shows their spec under the name');
    const want = '<span class="mpbn-n mpbn-rt" style="--rc:#ff8000" data-mprt="Dps" data-tt="x">3,100</span><span class="mpbn-n mpbn-bad">1</span><span class="mpbn-n">20</span><span class="mpbn-n mpbn-warn" tabindex="0" data-tt="x">5.0<i class="mpbn-u">k</i></span><span class="mpbn-n">4.0<i class="mpbn-u">k</i></span><span class="mpbn-n mpbn-bar mpbn-best" style="--w:1.000">300</span><span class="mpbn-n mpbn-z">0</span><span class="mpbn-n mpbn-z">0</span><span class="mpbn-n mpbn-ki mpbn-top">7</span><span class="mpbn-n mpbn-di mpbn-top">1</span></div>';
    if (d.indexOf(want) < 0) bad('a player\'s numbers are no longer Rating (Raider.IO, in its colour), Deaths, Damage taken, Avoidable, Damage, DPS (with its bar), Healing, HPS, Interrupts and Dispels with the unit small and the group\'s best marked: ' + d.slice(d.indexOf('mpbn-rt') - 20, d.indexOf('mpbn-rt') + 520));
    if (rows[0].indexOf('<span class="mpbn-n mpbn-rt mpbn-z" data-mprt="Tank">–</span>') < 0) bad('a player Raider.IO doesn\'t know no longer shows a dash for their rating');
    if (rows[0].indexOf('<span class="mpbn-n mpbn-bar" style="--w:0.333">100</span>') < 0 || rows[0].indexOf('<span class="mpbn-n mpbn-bar mpbn-best" style="--w:1.000">10</span>') < 0) bad('the DPS and HPS bars no longer measure each player against the group\'s best');
    if (!/^ mpbn-me"/.test(d) || /^ mpbn-me"/.test(rows[0])) bad('the player picked at the top is no longer the one framed in gold, like your own row on the game\'s board'); }
  if (s.indexOf('function mpxPPOnly(name) { MP.pp = name; mpxMeMark(name);') < 0 || s.indexOf("MP.pp = name; mpxMeMark(name); box.classList.toggle('pp1', !!name);") < 0 || s.indexOf('if (MP.ppK === k) return MP.pp || \'\'; const v = mpPPGet()[k]; return v != null ? v : mpMine(R); }') < 0) bad('the gold frame no longer follows the player picked at the top (it marked no one on Flex\'s page, Nov 16, before the page had made its pick)');
  const ri = h.indexOf('<i class="RES">'); if (ri < 0 || ri > h.indexOf('mpbn-h')) bad('the key\'s result is no longer on top of the group (Flex, Nov 16: "should be in the group section")');
  if (s.indexOf("srv[want.get(k)] = { s: parts.slice(1).join('-'), r: rg };") < 0 || s.indexOf('WCL.rioTeam(reg, L.map(([n, v]) => [n, mpRealmSlug(v.s)]))') < 0) bad('the players\' realms are no longer read from the log for their Raider.IO rating');
  if (s.indexOf("id=\"mptCD\">' + gl + bd + top + '</div>' : '';") < 0 || s.indexOf("bd = mpxBoard(R, M, F); }") < 0) bad('the scoreboard is no longer on the Summary, under the run');
  if (s.indexOf("const MPX_TABS = [['map', 'Summary'], ['rep', 'Players'], ['gra', 'Graphs']]") < 0 || s.indexOf("const MPX_VIEWS = [['map', 'Summary'],") < 0) bad('the main tab is no longer called Summary ("rename the tab summary again i think that makes the most sense")');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ scoreboard: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
