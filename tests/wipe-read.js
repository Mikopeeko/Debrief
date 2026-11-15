// Read every saved Coiled Altar wipe like the site does: the real wipe call (cutInfo) and the real root cause (E.rootCause with the call's reason),
// next to the log's own timeline around the call, so a person can judge each one.
// node tests/wipe-read.js <repoDir or .> [codes...] [--boss "The Coiled Altar"] [--json out.json]
const fs = require('fs'), path = require('path');
const REPO = path.resolve(process.argv[2]); const args = process.argv.slice(3);
const H = require(path.join(REPO, 'tests', 'site-helpers.js')), E = H.E, W = require(path.join(REPO, 'src', 'wcl.js'));
const LIB = 'C:/Users/james/DebriefLogs', T = E.fmtT, nm = (p) => String(p || '').split('-')[0];
const bi = args.indexOf('--boss'), BOSS = bi >= 0 ? args[bi + 1] : 'The Coiled Altar';
const ji = args.indexOf('--json'), JOUT = ji >= 0 ? args[ji + 1] : null;
const codes = args.filter((a, i) => !a.startsWith('--') && (i === 0 || !['--boss', '--json'].includes(args[i - 1])));
const findFile = (n) => [path.join(LIB, 'events', n), path.join(LIB, 'reports', n)].find((f) => fs.existsSync(f));
const readJ = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const NAMES = ['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT'];
const SITE = H.site(NAMES, { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} });
const out = [];
for (const code of codes) {
  const rf = findFile('rep_' + code + '.json'); if (!rf) { console.log('no report ' + code); continue; }
  let rr = readJ(rf); rr = rr.data || (rr.reportData ? rr.reportData.report : rr);
  const items = H.pullItems(code, rr, W);
  for (const [fight, it] of [...items].sort((a, b) => a[0] - b[0])) {
    if (it.boss !== BOSS || it.kill) continue; const ef = findFile(code + '_' + fight + '.json'); if (!ef) continue;
    let ev = readJ(ef); if (!Array.isArray(ev)) ev = ev.events; const txt = W.translate(it, ev); ev = null;
    const r = E.analyze(it, txt, {}); if (!r.item) r.item = it;
    let ci = null; try { ci = SITE.cutInfo(r); } catch (e) { ci = { err: e.message }; console.log('cutInfo error: ' + e.message); }
    const c0 = ci && ci.call ? ci.call : ci, cut = c0 && c0.auto ? c0.t : null;
    let rc = null; try { rc = E.rootCause(r, c0 && c0.auto ? { cut, why: c0.why, at: c0.at, mn: c0.mn, ms: c0.ms } : { cut }); } catch (e) { rc = { name: 'ERR ' + e.message }; }
    const ct = cut != null ? cut : r.duration, a = ct - 50, b = ct + 15;
    const role = (g) => ((r.players && r.players.get(g)) || {}).role || '';
    const phs = ((r.module && r.module.phases) || []).slice().sort((x, y) => x.start - y.start), phaseAt = (t) => { let k = phs[0]; for (const p of phs) if (p.start <= t + 0.5) k = p; return k ? k.name.split(' ')[0] : ''; };
    const tl = [];
    for (const d of r.deaths) if (d.t >= a && d.t <= b) tl.push([d.t, (d.t > ct + 0.5 ? '  after ' : '') + 'DIED ' + nm(d.player) + (role(d.guid) === 'tank' ? ' (tank)' : role(d.guid) === 'healer' ? ' (healer)' : '') + ' <- ' + (d.ability || d.killer) + (d.kill && d.kill !== d.ability ? ' [hit ' + d.kill + ']' : '')]);
    for (const m of r.mistakes || []) if (m.t >= a && m.t <= b && m.mechanic !== 'Death' && (m.player === 'Raid' ? /High|Medium/.test(m.severity) : m.severity === 'High')) tl.push([m.t, (m.t > ct + 0.5 ? '  after ' : '') + (m.player === 'Raid' ? 'RAID ' : nm(m.player) + ' ') + m.severity + ' ' + m.mechanic + ': ' + String(m.detail || '').slice(0, 150)]);
    for (const x of r.rezzes || []) if (x.t >= a && x.t <= b) tl.push([x.t, 'rez']);
    tl.sort((x, y) => x[0] - y[0]);
    const o = { key: code + ':' + fight, pull: it.pull, dur: T(r.duration), end: it.endPct, ph: phaseAt(ct), call: c0 && c0.auto ? T(c0.t) + ' ' + c0.why + (c0.mn ? ' (' + c0.mn + ')' : '') : 'none', deathsAll: r.deaths.length,
      root: rc ? rc.name : null, cat: rc ? rc.cat : null, short: rc ? rc.short : null, line: rc ? rc.line : null, by: rc ? rc.by : null, also: rc && rc.also ? rc.also.map((x) => x.short) : [], early: rc ? rc.early : null,
      tl: tl.map(([t, s]) => T(t) + ' ' + s) };
    out.push(o);
    console.log('\n[' + o.key + '] pull ' + o.pull + ' · ' + o.dur + ' long · boss ' + o.end + '% · call ' + o.call + ' in ' + o.ph + (o.early ? ' · EARLY (played on)' : ''));
    console.log('  SITE: ' + o.root + ' — ' + o.short); console.log('  LINE: ' + o.line + (o.by && o.by.length ? ' · by ' + o.by.join('/') : '') + (o.also.length ? ' · also ' + o.also.join(', ') : ''));
    for (const s of o.tl) console.log('    ' + s);
  }
}
if (JOUT) fs.writeFileSync(JOUT, JSON.stringify(out, null, 1));
