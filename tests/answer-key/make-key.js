// Builds an answer key file from the raw log: node tests/answer-key/make-key.js <code> [--dir <folder with <code>_<fight>.json>] [--boss "The Coiled Altar"]
// It runs raw-facts.js (no site code) on every saved pull of that boss in the report, adds the hand-judged cause of each pull from roots.js,
// and writes tests/answer-key/<code>.json. Run it again only when the raw reader learns a new fact; then read the diff before committing:
// a key that changes on its own is a mistake in the reader, not in the night.
'use strict';
const fs = require('fs'), path = require('path');
const { rawFacts, DEFS } = require('./raw-facts.js'), ROOTS = require('./roots.js'), { deathVerdicts } = require('./death-rule.js');
const args = process.argv.slice(2), code = args[0], di = args.indexOf('--dir'), bi = args.indexOf('--boss');
const LIB = process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs', DIRS = [path.join(LIB, 'events'), path.join(LIB, 'reports')].concat(di >= 0 ? [args[di + 1]] : []), BOSS = bi >= 0 ? args[bi + 1] : 'The Coiled Altar';
const find = (n) => DIRS.map((d) => path.join(d, n)).find((f) => fs.existsSync(f));
if (!code) { console.log('usage: node make-key.js <report code> [--dir <folder>] [--boss <name>]'); process.exit(1); }
let rep = JSON.parse(fs.readFileSync(find('rep_' + code + '.json'), 'utf8')); rep = rep.data || (rep.reportData ? rep.reportData.report : rep);
const fights = rep.fights.filter((f) => f.encounterID > 0 && f.name === BOSS), pulls = [], raws = [];
fights.forEach((F, i) => { const f = find(code + '_' + F.id + '.json'); if (!f) { console.log('no saved events for fight ' + F.id + ', left out'); return; }
  let P = JSON.parse(fs.readFileSync(f, 'utf8')); if (Array.isArray(P)) P = { events: P }; P.fight = F.id; P.start = F.startTime; P.end = F.endTime;
  const o = rawFacts(rep, P), c = o.ca || {}; raws.push(o);
  const root = (ROOTS[code] || {})[F.id];
  const out = { fight: F.id, pull: i + 1, kill: o.kill, len: o.len, size: o.size, phase: c.phase, phaseStarts: { p2: c.p2, intermission: c.inter, p3: c.p3 }, wcl: { bossPct: o.wclBossPct, fightPct: o.wclFightPct, lastPhase: o.wclLastPhase, intermission: o.wclIntermission }, bossHpEnd: o.bossHpEnd,
    cause: root === undefined ? undefined : root, players: o.players, prep: o.prep, consumables: o.consum,
    deaths: o.deaths.map((d) => ({ t: d.t, player: d.player, killedBy: d.killedBy, mc: d.mc || undefined, feared: d.feared, mass: d.mass > 1 ? d.mass : undefined, deadBefore: d.deadBefore, hp10: d.hp10, lowFor: d.lowFor, overkill: d.overkill || undefined, maxHp: d.maxHp, pos: d.pos, knock3: d.knock3, last4: d.last4, hits: d.hits.slice(-3), used: d.used })), rez: o.rez,
    casts: Object.fromEntries(Object.entries(o.castN).map(([n, c]) => [n, Object.fromEntries(Object.entries(c).filter(([, v]) => v >= 3).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8))])), raidCds: o.raidCds,
    kicks: o.kicks, kicksMissed: o.kicksMissed,
    mechanics: o.ca ? { frontals: c.frontals, dreadmarch: c.dreadmarch, ghostReached: c.ghostReached, ghostsTouched: c.ghostsTouched,
      orbBursts: c.ruptureWaves.filter((w) => !w.frontal).map((w) => ({ t: w.t, phase: w.phase, kind: w.pushP1 ? 'end of phase 1' : w.atDeluge ? 'at a Deluge' : 'burst', killed: w.killed, bigHit: w.bigHit, purpleHeld: w.purpleHeld })), frontalPops: c.ruptureWaves.filter((w) => w.frontal).map((w) => [w.t, w.stacks]),
      purpleCarries: c.purplePickups.reduce((m, x) => { m[x[1]] = (m[x[1]] || 0) + 1; return m; }, {}), deluges: c.deluges,
      gloombombs: c.gloombombs, graveboundMissed: c.gravebound.filter((g) => g.picked < 3 && !g.ended && g.for > 0.5), graveboundN: c.gravebound.length,
      noxious: c.noxious, venomfang: c.venomfang, guillotines: c.guillotines, executions: c.executions, axeCaught: c.axeCaught, axeHits: c.axeHits, shields: c.shields, nightfallFinished: c.nightfallFinished, adds: c.adds, fragmentsReached: c.fragmentsReached } : undefined };
  pulls.push(out); console.log('pull ' + (i + 1) + ' (fight ' + F.id + '): ' + (o.kill ? 'kill' : 'wipe') + ', ' + o.len + ' s, ' + o.deaths.length + ' deaths' + (root ? ', ' + root.cat : '')); });
// the death rule, from the raw facts: what each player is known to press (any defensive or Healthstone they used on this night)
{ const known = { __cd: Object.assign({ Healthstone: 1e9, 'Demonic Healthstone': 1e9 }, DEFS) }; for (const o of raws) for (const d of o.deaths) for (const n of Object.keys(d.used || {})) if (known.__cd[n] != null) { const l = known[d.player] || (known[d.player] = []); if (!l.includes(n)) l.push(n); }
  for (const o of raws) for (const [nm2, c2] of Object.entries(o.consum || {})) for (const x of c2.stone || []) { const l = known[nm2] || (known[nm2] = []); if (!l.includes(x[1])) l.push(x[1]); }
  raws.forEach((o, i) => { if (!o.ca) { const q = Math.ceil((o.size || 20) / 4), lost = pulls[i].cause && pulls[i].cause.t; pulls[i].deaths.forEach((d) => { const prior = pulls[i].deaths.filter((x) => x !== d && x.t < d.t - 0.05).length; d.when = (!o.kill && prior >= q) || (lost != null && d.t > lost + 0.75) ? 'after' : 'before'; delete d.pos; if (d.when === 'after') { delete d.last4; delete d.hits; delete d.used; delete d.hp10; delete d.overkill; delete d.maxHp; delete d.lowFor; } }); return; } const vs = deathVerdicts(o, pulls[i].cause, known), fix = ((ROOTS.deaths || {})[code] || {})[o.fight] || {}; pulls[i].deaths.forEach((d, j) => { const v = vs[j]; delete d.pos; delete d.knock3; if (v.when === 'after') { delete d.last4; delete d.hits; delete d.used; delete d.hp10; delete d.overkill; delete d.maxHp; delete d.lowFor; } const h = fix[d.player + '@' + Math.round(d.t)]; d.when = v.when; d.verdict = v.verdict; if (v.proof) { d.proof = v.proof.say; if (v.proof.names) d.proofOf = v.proof.names; } if (v.fact) d.fact = v.fact; if (!v.sure) d.unsure = v.note || true; if (h) Object.assign(d, h, { byHand: true }); }); }); }
{ const dis = {}; for (const o of raws) for (const v of (o.ca || {}).venomfang || []) if (v.by) (dis[v.by] = dis[v.by] || new Set()).add(v.with);
  raws.forEach((o, i) => { const vf = pulls[i].mechanics && pulls[i].mechanics.venomfang; if (!vf) return; const deadAt = (n, t) => { let dead = false; const evs = o.deaths.filter((d) => d.player === n).map((d) => [d.t, 1]).concat(o.rez.filter((x) => x[1] === n).map((x) => [x[0], 0])).sort((a, b) => a[0] - b[0]); for (const [tt, k] of evs) { if (tt > t) break; dead = !!k; } return dead; };
    for (const v of vf) v.free = Object.keys(dis).filter((n) => o.players[n] && !deadAt(n, v.t) && !(o.ccSpans[n] || []).some(([a, b]) => v.t >= a - 0.2 && v.t <= b) && !o.dispels.some((d) => d[1] === n && d[0] > v.t - 8 && d[0] <= v.t + 0.5)).sort();
    pulls[i].mechanics.poisonDispellers = Object.keys(dis).filter((n) => o.players[n]).sort(); }); }
const head = { code, title: rep.title, boss: BOSS, date: new Date(rep.startTime - 8 * 3600e3).toISOString().slice(0, 10), /* (the raid night, not the UTC day) */ made: 'tests/answer-key/make-key.js (raw-facts.js + roots.js); no site code', pulls: 'PULLS' };
const txt = JSON.stringify(head, null, 1).replace('"PULLS"', '[\n' + pulls.map((p) => JSON.stringify(p)).join(',\n') + '\n]');
const fileName = code + (BOSS === 'The Coiled Altar' ? '' : '-' + BOSS.toLowerCase().replace(/[^a-z]+/g, '')) + '.json';
fs.writeFileSync(path.join(__dirname, fileName), txt + '\n'); console.log('wrote ' + fileName + ', ' + Math.round(txt.length / 1024) + ' KB, ' + pulls.length + ' pulls');
