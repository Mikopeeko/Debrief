// Mythic+, one time base for damage a second (Nov 15, the fresh reviewers on Flex's +19 Kings' Rest of Sep 25, report dtMfgnRvDwBLPCKZ fight 2; Flex:
// "Yes, fix them"). The Report card's ranked group listed each player's DPS over the whole key, walking included (250k + 247k + 256k + 117k + 51k, about
// 920k) with "Your group, while in a pull, 1.02m" right under them. Graphs read "The whole key · 28:07 of fighting" over a table whose DPS was divided by
// about 31:03; its chart said 919.6K/s and the table's total 919.8K; By pull's total row put the whole key's DPS beside the 28:07 of its pulls.
// This runs the page's own code (mprGroupFacts, mpxGraphs) on a made-up key with walking between pulls and fails if: the group row is not the players
// above it added up; its vs spec is not the players against the middle player of each spec; the Group damage line loses its in-pull number or reads the
// whole-key one from anywhere but the group's own sum; the chart's average, the table's head and its total are not one number (whole key, a boss pull,
// the trash; damage, healing, damage taken); the scope or the table head does not say the DPS counts the whole key, walking included; or By pull's
// total over its length is not its DPS. contradictions.js runs it on every build. Every part fails on the page as it was before this fix.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusDpsBase(say) {
  const bad = (m) => say('Mythic+ DPS', 'one time base', m), NL = String.fromCharCode(10);
  let s, ui; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); ui = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8'); } catch (e) { bad('could not read src/mptab.js or src/ui.js'); return; }
  /* (a top-level statement of mptab.js, from its first line to the next line that starts another) */
  const decl = (n) => { let a = s.indexOf(NL + 'const ' + n + ' = '); if (a < 0) a = s.indexOf(NL + 'function ' + n + '('); if (a < 0) throw new Error('src/mptab.js has no ' + n); let e = a + 1; for (;;) { e = s.indexOf(NL, e + 1); if (e < 0 || ['const ', 'let ', 'function ', '//', '/*', 'document.', 'if ('].some((k) => s.startsWith(k, e + 1))) break; } return s.slice(a + 1, e < 0 ? undefined : e); };
  const at = ui.indexOf(NL + 'const plural = '), plural = ui.slice(at, ui.indexOf(NL, at + 1));
  const pre = 'const mpCdSay = () => "", MPC_ON = false, esc = (x) => String(x == null ? "" : x), MP = { item: {}, fastOf: null }, E = {};' + plural + NL +
    'const mpK = () => "k", mpNo = (R, n) => n, mpSpecId = () => 0, whIcon = () => "", mpCC = () => "#fff", mpT1 = () => "", spellIcon = () => "", mpVs = () => "", mpChap = (id, t, sub, h) => h, mpCCcasts = () => [], mpByRole = () => 0, mpClock = () => null, mpWho = (R, n) => n, mpCdN = () => null;' + NL;
  let X; try { X = vm.runInNewContext(pre + ['mpMM', 'mpNorm', 'mpAnd', 'mpCap', 'mpGF', 'mpGd', 'mpGrp', 'mpDone', 'MPX_GM', 'mpgN', 'mpSpecVs', 'mprGroupFacts', 'mpxGdata', 'mpgChart', 'mpxGraphs'].map(decl).join(NL) + NL + '({ mprGroupFacts, mpxGraphs, MP })'); }
  catch (e) { bad('the group facts or Graphs no longer run by themselves (mprGroupFacts, mpxGraphs): ' + String(e.message).slice(0, 140)); return; }
  // a made-up key: three pulls (the second a boss), 350 s of them in a 420 s key; the reader keeps a pull's damage a second (q.dmg x q.dur is the amount)
  const pulls = [{ n: 1, s: 10, e: 110, dur: 100 }, { n: 2, s: 140, e: 340, dur: 200, boss: 'King' }, { n: 3, s: 360, e: 410, dur: 50 }], end = 420;
  const people = [['Rage', 'Warrior', 'Arms', 'dps', 300], ['Fox', 'Shaman', 'Enhancement', 'dps', 290], ['Leaf', 'Death Knight', 'Unholy', 'dps', 280], ['Sor', 'Druid', 'Guardian', 'tank', 140], ['Flex', 'Paladin', 'Holy', 'healer', 60]]
    .map(([name, cls, spec, role, k]) => ({ name, cls, spec, role, k: k * 1000, kicks: 0, stops: 0, dispels: 0, defs: 0, avoid: 0 }));
  for (const q of pulls) { q.dmg = {}; q.heal = { Flex: 120000 }; q.deaths = []; q.through = []; for (const p of people) q.dmg[p.name] = p.k; }
  for (const p of people) p.dps = Math.round(pulls.reduce((a, q) => a + q.dmg[p.name] * q.dur, 0) / end);
  // (the page's own damage a second, as the chart reads it: the pulls, and a dot still ticking on the walk after pull 1)
  const pd = {}, phl = { Flex: [] }, ptk = { Sor: [] }; for (const p of people) pd[p.name] = [];
  for (const q of pulls) for (let t = q.s; t < q.e; t++) { for (const p of people) pd[p.name][t] = p.k; phl.Flex[t] = 120000; ptk.Sor[t] = 20000; }
  for (let t = 115; t < 135; t++) pd.Rage[t] = 50000;
  const R = { run: { timeMs: 1, left: false, end }, people, pulls, cdWho: [], cds: {}, ccEv: [], pd, phl, ptk, lust: [] }, rows = people.reduce((a, p) => a + p.dps, 0);
  const runs = [{ ppl: [{ s: 'Arms', c: 'Warrior', r: 'dps', a: 330000 }, { s: 'Enhancement', c: 'Shaman', r: 'dps', a: 300000 }, { s: 'Guardian', c: 'Druid', r: 'tank', a: 150000 }, { s: 'Holy', c: 'Paladin', r: 'healer', a: 90000, d: 70000 }] }];
  // 1. the ranked group's own row is the players above it added up, and its vs spec is on their base
  const G = X.mprGroupFacts(R, { R: null, list: { runs } });
  if (G.wk !== rows) bad('the group row is not the players above it added up: ' + G.wk + ' against ' + rows + " (the Kings' Rest key showed 1.02m under rows adding to 920k)");
  const four = people.filter((p) => p.name !== 'Leaf').reduce((a, p) => a + p.dps, 0), want = Math.round(100 * (four / 850000 - 1));
  if (!G.gv || G.gv.pct !== want || G.gv.out.join() !== 'Leaf') bad("the group row's vs spec is not the players against the middle player of each spec, on the base of their rows: " + JSON.stringify(G.gv) + ' (want ' + want + '%, with Leaf left out)');
  const a = s.indexOf('<div class="rcb-tr mpr-tot">'), row = a < 0 ? '' : s.slice(a, s.indexOf("'</section>'", a));
  if (row.indexOf("'>' + mpGF(G.wk) + '</b></span>") < 0 || row.indexOf("'>' + mpGF(G.yG.r) + '</b></span>") >= 0) bad("the ranked group's own row shows the in-pull number under rows that count the whole key");
  if (row.indexOf('mpVs(G.gv.pct)') < 0 || row.indexOf('mpT1(G.vsTip)') >= 0) bad("the ranked group's own row puts the fast-run comparison under vs spec");
  if (s.indexOf("' · ' + mpGF(G.wk) + ' over the whole key, walking included'") < 0 || s.indexOf(`<b class="mpr-gfk">Group damage</b> ' + mpGF(G.yG.r) + ' DPS '`) < 0) bad('the Group damage line lost its in-pull number, or reads the whole-key number from somewhere other than the group row (G.wk)');
  // 2. Graphs: one number for the chart and the table, and the base said
  const cut = (h, x, y, from) => { const i = h.indexOf(x, from || 0); return i < 0 ? '' : h.slice(i + x.length, h.indexOf(y, i + x.length)); };
  const num = (t) => parseFloat(t) * ({ K: 1e3, M: 1e6, B: 1e9 }[String(t).slice(-1)] || 1);
  const view = (m, w, by) => { Object.assign(X.MP, { gm: m, gk: 'k', gw: w, gby: by, gopen: '' }); const h = X.mpxGraphs(R), i = h.indexOf('/s average'), t = h.indexOf('pf-bars'), k = h.indexOf('r263-tot');
    return { chart: i < 0 ? '' : h.slice(h.lastIndexOf(' · ', i) + 3, i), head: cut(h, '<span class="gb-big">', '<small>'), sub: cut(h, '<span class="gb-hs">', '</span>', t), rail: cut(h, '<span class="gb-cnt">', '</span>'), tot: cut(h, '<b class="cb-v">', '</b>', k), dps: cut(h, '<span class="cb-s">', '</span>', k), len: cut(h, '<span class="r263-x">', '</span>', k) }; };
  for (const [m, w] of [['dmg', 'all'], ['dmg', 1], ['dmg', 'trash'], ['heal', 'all'], ['taken', 'all']]) { const v = view(m, w, 'p');
    if (!v.chart || v.chart !== v.head || v.head !== v.dps) bad('Graphs, ' + m + ' on ' + w + ': the chart says ' + v.chart + '/s, the table ' + v.head + ' and its total ' + v.dps + " (one number; the Kings' Rest key read 919.6K against 919.8K)"); }
  { const v = view('dmg', 'all', 'p'); if (v.rail.indexOf('walking included') < 0) bad('Graphs scope reads "' + v.rail + '" over DPS that counts the whole key, walking included');
    if (v.sub.indexOf('over the whole key, walking included') < 0) bad('the Graphs table head does not say its DPS counts the whole key, walking included: "' + v.sub + '"'); }
  { const v = view('dmg', 'all', 'u'), [mm, ss] = v.len.split(':').map(Number); if (!(Math.abs(num(v.tot) / (mm * 60 + ss) / num(v.dps) - 1) < 0.01)) bad('Graphs By pull: the total row reads ' + [v.tot, v.dps, v.len].join(' · ') + ', and the total over the length is not the DPS'); }
};
