// The answer key check (Nov 13, Flex: "they keep coming back seems to be my biggest issue"; the guide: notes/Guides/Answer key - how it works.md).
// tests/answer-key/<code>.json holds facts of real raid nights read by hand and by tests/answer-key/raw-facts.js from the raw log, with none of the
// site's code. This check runs the site's own engine on the same saved pulls and compares every fact. A mismatch names the fact, the pull and the
// two values. build.ps1 runs it on every build.
//   node tests/answer-key.js            every pull of every key file (about 1 s when nothing in the engine changed, about 1 min when it did)
//   node tests/answer-key.js --fresh    ignore the saved results and run the engine again
//   node tests/answer-key.js --list     also print every known mismatch (the ones waiting on a fix)
//   node tests/answer-key.js --json f   write every mismatch to f
// Known mismatches live in tests/answer-key/known.json (reported, waiting on the chat that owns the tab). They don't fail a build. A NEW mismatch
// does, and so does a known one that is now right: delete its line so the fix is locked in.
// It needs the log library (C:\Users\james\DebriefLogs, or DEBRIEF_LOGS); without it, it says so and passes.
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), cp = require('child_process'), os = require('os');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src'), KEYS = path.join(__dirname, 'answer-key');
const LIB = process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs';
const args = process.argv.slice(2), FRESH = args.includes('--fresh'), LIST = args.includes('--list'), ONE = args.includes('--one') ? args[args.indexOf('--one') + 1] : null, JOUT = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const T = (t) => (t == null ? '?' : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0'));
const nmP = (s) => String(s || '').split('-')[0];
// the page's own pieces this check reads (by name, out of src/ui.js): the wipe call, and the lists that say what a flask and a rune are
const UI_RESET = ['PROGRESS', 'phSize', 'phShare', 'encLeft', 'shortBoss', 'bossAtV', 'progressOf', 'wclProg', 'pullProg', 'pullPct', 'dbfReset'];
const UI_NAMES = ['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT'], UI_PREP = ['FLASKS', 'AUG_RUNE'];
const findFile = (n) => [path.join(LIB, 'events', n), path.join(LIB, 'reports', n)].find((f) => fs.existsSync(f));

// ---- what the site says about one pull (runs the engine; this is the slow part, so its result is saved by a hash of the code that made it) ----
function siteFacts(code, fight) {
  const H = require('./site-helpers.js'), E = H.E, W = require(path.join(SRC, 'wcl.js'));
  let rep = JSON.parse(fs.readFileSync(findFile('rep_' + code + '.json'), 'utf8')); rep = rep.data || (rep.reportData ? rep.reportData.report : rep);
  const it = H.pullItems(code, rep, W).get(fight); let ev = JSON.parse(fs.readFileSync(findFile(code + '_' + fight + '.json'), 'utf8')); if (!Array.isArray(ev)) ev = ev.events;
  const r = E.analyze(it, W.translate(it, ev), {}); ev = null; if (!r.item) r.item = it;
  const out = { errs: [], kill: !!it.kill, len: r.duration }, m = r.module && !r.module.error ? r.module : null, secs = (m && m.sections) || [], sec = (id) => secs.find((s) => s.id === id);
  const rowsOf = (s) => (s ? (s.rows || []).concat(...(s.groups || []).map((g) => g.rows || [])) : []);
  // the phases and the bosses' last health
  out.reached = m ? String(m.reached || '') : ''; out.phases = ((m && m.phases) || []).map((p) => [p.name, p.start]);
  out.hp = {}; { const best = {}; for (const u of r.hpUnits ? r.hpUnits.values() : []) { if (!(/^(Zul'jan|Hex Lord Malacrass)$/.test(u.name) || u.name === it.boss) || !u.samples || !u.samples.length) continue; const l = u.samples[u.samples.length - 1], v = Math.round(1e4 * l[1]) / 100, b = best[u.name]; /* (a boss with several bodies of one name: the body seen last; if two were seen to the end, the one that was hit) */ if (!b || l[0] > b[0] + 2 || (Math.abs(l[0] - b[0]) <= 2 && v < b[1])) best[u.name] = [l[0], v]; } for (const [k, b] of Object.entries(best)) out.hp[k] = b[1]; }
  // why we wiped, as the page works it out: the wipe call (cutInfo) and then the root cause
  out.cause = null;
  if (!it.kill) { try { const S = H.site(UI_NAMES, { store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {} }); const ci = S.cutInfo(r), c0 = ci && ci.call ? ci.call : ci, cut = c0 && c0.auto ? c0.t : null;
      let isReset = false; try { isReset = !!H.site(UI_RESET).dbfReset(it); } catch (e) { out.errs.push('whether the page reads this pull as a reset could not be read: ' + e.message); }
      const rc = isReset ? { cat: 'reset', name: 'Reset on purpose', short: 'The page reads this pull as a reset.' } : E.rootCause(r, c0 && c0.auto ? { cut, why: c0.why, at: c0.at, mn: c0.mn, ms: c0.ms } : { cut });
      out.cause = rc ? { cat: rc.cat, name: rc.name, by: (rc.orbBy || []).map(nmP), who: (rc.by || []).map(nmP), short: rc.short, call: c0 && c0.auto ? c0.t : null, callWhy: c0 && c0.auto ? c0.why + (c0.mn ? ' (' + c0.mn + ')' : '') : null } : null; }
    catch (e) { out.errs.push('why we wiped could not be read: ' + e.message); } }
  out.orbWaves = (r.orbWaves || []).map((w) => [w, E.orbBurstBy ? E.orbBurstBy(r, w - 0.01, w + 6.5).map(nmP) : []]);
  // players: totals, deaths, consumables
  out.players = {}; for (const p of r.players.values()) out.players[p.name] = { dmg: p.damage, heal: p.healing || 0, deaths: p.deaths, role: p.role,
    stone: ((p.cons || {}).healthstone || []).length, healpot: ((p.cons || {}).healpot || []).length, pot: ((p.cons || {}).combatpot || []).length, manapot: ((p.cons || {}).manapot || []).length };
  out.deaths = (r.deaths || []).map((d) => ({ t: d.t, player: nmP(d.player), ability: d.ability || d.killer || '', kill: d.kill || '', fell: !!d.fell }));
  try { const DN = ['deathHit', 'deathHitId', 'deathFast', 'DEATH_KIT', 'DEATH_IMM', 'deathShare', 'deathRaidSay', 'DEATH_BUCKET', 'quarterDead', 'deathOwn', 'andList', 'capS', 'DEATH_JOB', 'DEATH_FAR', 'DEATH_KNOCK', 'DEATH_WIN', 'deathProof', 'deathVerdict', 'deathFix'];
    const X = H.site(UI_NAMES.concat(DN), { dbfReset: (it) => !!it && !it.kill && ((it.endPct != null && it.endPct >= 99.95) || (it.duration != null && it.duration < 15)), store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {}, oaRowWhy: () => null, deathSecs: (x) => String(x), deathHealerOf: () => null, dbfTip1: (x) => x, whyReason: (x) => x, oaFlip: (x) => x, oaBase: (n) => String(n || '').split('-')[0], plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), esc: (x) => String(x), S: {}, RC_NEXT: {} });
    out.verdicts = (r.deaths || []).map((d) => { const v = X.deathVerdict(r, d); return { t: d.t, player: nmP(d.player), bucket: v.bucket, why: v.why, counts: !!v.counts, k: v.proof ? v.proof.k : null, mech: v.proof && v.proof.mech ? v.proof.mech : null, say: String(v.say || '').slice(0, 150) }; }); }
  catch (e) { out.errs.push('the death verdicts could not be read: ' + e.message); }
  out.casts = {}; for (const p of r.players.values()) { const o = (out.casts[p.name] = {}); for (const c of p.castAb ? p.castAb.values() : []) o[c.name] = (o[c.name] || 0) + c.n; }
  out.cdUse = (r.cdUse || []).map((x) => ({ t: x.t, player: nmP((r.players.get(x.g) || {}).name || x.g), cd: x.cd })).concat((r.extMit || []).map((x) => ({ t: x.t, player: nmP((r.players.get(x.g) || {}).name || x.g), cd: x.name }))); /* (the raid cooldowns, and the ones the site files with externals: Zephyr) */
  out.kicks = (r.interrupts || []).map((k) => ({ t: k.t, player: nmP(k.player), spell: k.spell })); out.kickStats = (r.kicks || []).map((k) => ({ name: k.name, kicked: k.kicked, missed: k.missed }));
  // flask, food, rune: the page's own lists, on the auras each player's record has at the pull's start
  try { const Pp = H.site(UI_PREP), nameOf = (id) => { const a = it.wcl.abilities.get(+id); return a ? a.name : ''; }; out.prep = {};
    for (const c of r.combatantsRaw || []) { const p = r.players.get(c.guid); if (!p) continue; const names = (c.auras || []).map((a) => a.name || nameOf(a.ability));
      out.prep[p.name] = { flask: names.find((n) => Pp.FLASKS.includes(String(n).toLowerCase())) || null, food: names.find((n) => /well fed/i.test(n)) || null, rune: names.find((n) => Pp.AUG_RUNE.test(n)) || null }; } }
  catch (e) { out.errs.push('flask, food and rune could not be read: ' + e.message); }
  // mechanics: the mistakes list, and the rows of each mechanic's own section
  out.mistakes = (r.mistakes || []).filter((q) => q.mechanic !== 'Death').map((q) => ({ t: q.t, player: nmP(q.player), mech: q.mechanic, detail: String(q.detail || '').slice(0, 160), others: !!q.others }));
  out.avoid = {}; for (const g of (sec('avoid') || {}).groups || []) { const o = (out.avoid[g.title] = {}); for (const row of g.rows || []) { const p = (row[0] || {}).p; if (p) o[nmP(p)] = String((row[1] || {}).txt || ''); } }
  const cellP = (c) => (c && c.p ? [nmP(c.p)] : c && c.ps ? c.ps.map(nmP) : []);
  out.vf = rowsOf(sec('vf')).map((row) => ({ t: (row[0] || {}).t, player: cellP(row[1])[0], txt: (row[2] || {}).txt || '', by: cellP(row[3])[0] || (row[3] || {}).txt || '', more: row.map((c) => (c ? [c.say, c.why, c.sub, c.next].filter(Boolean).join(' ') : '')).filter(Boolean).join(' ').slice(0, 400), flag: row.some((c) => c && (c.warn || c.bad)) }));
  out.soaks = rowsOf(sec('soakq')).map((row) => ({ t: (row[0] || {}).t, n: +((row[2] || {}).txt), target: cellP(row[4])[0] }));
  out.shields = rowsOf(sec('shield')).map((row) => ({ t: (row[1] || {}).t, txt: (row[3] || {}).txt || '' }));
  out.fronts = rowsOf(sec('tankfront')).filter((row) => !/non-tank/.test((row[5] || {}).txt || '')).map((row) => ({ t: (row[0] || {}).t, tank: cellP(row[2])[0] }));
  out.adds = rowsOf(sec('addsets')).filter((row) => /^Soulcoiler/.test((row[0] || {}).txt || '')).length;
  out.inter = sec('inter') ? String(sec('inter').summary || '') : ''; out.orbSum = sec('orbs') ? String(sec('orbs').summary || '') : '';
  out.gloomRows = rowsOf(sec('gloom')).map((row) => ({ what: (row[0] || {}).txt || '', t: (row[1] || {}).t, players: cellP(row[2]), txt: (row[3] || {}).txt || '' }));
  out.ghostRows = rowsOf(sec('ghosts')).map((row) => ({ what: (row[0] || {}).txt || '', t: (row[1] || {}).t, players: cellP(row[2]), txt: (row[3] || {}).txt || '' }));
  if (sec('incub') || sec('eggs') || sec('wretch')) { const eg = sec('eggs'), vm = eg && /(\d+) Blightscale Vipers? hatched/.exec(eg.summary || ''), wv = sec('waves'), wm = wv && /(\d+) wave hits? on (\d+) players?/.exec(wv.summary || '');
    out.ula = { vipers: eg ? (vm ? +vm[1] : 0) : null, coils: rowsOf(sec('coils')).filter((row) => /^Circle \d/.test((row[0] || {}).txt || '')).map((row) => ({ t: (row[1] || {}).t, n: +((row[2] || {}).txt), who: cellP(row[3]) })),
      beams: rowsOf(sec('incub')).map((row) => ({ t: (row[0] || {}).t, took: cellP(row[1]) })), wretch: rowsOf(sec('wretch')).map((row) => ({ outside: cellP(row[3]) })), waves: wm ? [+wm[1], +wm[2]] : null }; }
  out.dm = ((sec('dmghost') || {}).groups || []).map((g) => ({ t: g.t, tg: (g.tg || []).map(nmP) }));

  // ---- the same fact in two places of the site (Nov 13: "the same fact must equal itself on every tab") ----
  // Each entry: [fact, place A, value A, place B, value B]; only disagreements are kept. Places are named as raiders see them.
  out.self = []; const dis = (fact, a, va, b, vb) => { if (String(va) !== String(vb)) out.self.push([fact, a, String(va), b, String(vb)]); };
  try { const MIST = 'the mistakes list (Summary, Debriefing, Report card)', AV = 'the Avoidable damage table (Summary, Graphs)', plist = [...r.players.values()], num = (x) => +String(x).replace(/,/g, '');
    dis('deaths in the pull', 'the death list (Debriefing, Graphs)', (r.deaths || []).length, 'each player\'s own death count (Report card, Graphs)', plist.reduce((a, p) => a + (p.deaths || 0), 0));
    dis('deaths in the pull', 'the death list (Debriefing, Graphs)', (r.deaths || []).length, MIST, (r.mistakes || []).filter((q) => q.mechanic === 'Death').length);
    const wk = (r.interrupts || []).filter((k) => k.spell === 'Wail of Terror').length, ks = (r.kicks || []).find((k) => k.name === 'Wail of Terror');
    if (wk || ks) { dis('Wail of Terror kicks', 'the kick list (Graphs Interrupts)', wk, 'the kick totals (Summary)', ks ? ks.kicked : 0); if (sec('kicks')) dis('Wail of Terror kicks', 'the kick list (Graphs Interrupts)', wk, 'the Wail of Terror section (Debriefing)', rowsOf(sec('kicks')).filter((row) => /^kicked/.test((row[3] || {}).txt || '')).length); }
    dis('kicks in the pull, all spells', 'the kick list (Graphs Interrupts)', (r.interrupts || []).length, 'each player\'s own kick count (Report card, Graphs)', plist.reduce((a, p) => a + (p.interrupts || 0), 0));
    // (a player's avoidable hits: the mistake's own count and damage against the table's row)
    for (const q of r.mistakes || []) { if (!q.avoid || q.mechanic === 'Death' || q.player === 'Raid') continue; const g = ((sec('avoid') || {}).groups || []).find((x) => x.title === q.mechanic); if (!g) continue; const row = (g.rows || []).find((x) => (x[0] || {}).p === q.player); const who = nmP(q.player);
      if (!row) { out.self.push([who + '\'s ' + q.mechanic, MIST, String(q.detail).slice(0, 70), AV, 'no row']); continue; }
      const hm = /(\d+) times|for (\d+) s\b/.exec(q.detail || ''), tm = /^(\d+) (?:hits?|s in it)/.exec((row[1] || {}).txt || ''); if (hm && tm) dis(who + '\'s ' + q.mechanic + (hm[2] ? ' seconds' : ' hits'), MIST, hm[1] || hm[2], AV, tm[1]);
      if (q.dmg && (row[2] || {}).n && Math.abs(q.dmg - row[2].n) > 0.01 * row[2].n) dis(who + '\'s ' + q.mechanic + ' damage', MIST, Math.round(q.dmg), AV, Math.round(row[2].n)); }
    // (tank frontals on non-tanks: who stood in one, and for how much)
    { const fm = (r.mistakes || []).filter((q) => /^(Sever|Soul Sever|Blighted Sever)$/.test(q.mechanic) && /^Stood in/.test(q.detail || '')), g = ((sec('avoid') || {}).groups || []).find((x) => /^Tank frontals on non-tanks/.test(x.title));
      const a = [...new Set(fm.map((q) => nmP(q.player)))].sort(), b = g ? [...new Set((g.rows || []).map((x) => nmP((x[0] || {}).p)))].sort() : []; if (a.length || b.length) dis('players a tank frontal hit (not tanks)', MIST, a.join(', ') || 'nobody', AV, b.join(', ') || 'nobody');
      for (const q of fm) { const row = g && (g.rows || []).find((x) => (x[0] || {}).p === q.player), amt = num((/for ([\d,]+)/.exec(q.detail) || [])[1]), n1 = fm.filter((x) => x.player === q.player).length; if (row && n1 === 1 && amt && Math.abs(amt - row[2].n) > 0.01 * amt) dis(nmP(q.player) + '\'s damage from the ' + q.mechanic + ' at ' + T(q.t), MIST, amt, AV, Math.round(row[2].n)); } }
    // (ghosts: reached their player, touched another)
    { const gr = rowsOf(sec('ghosts')), a = (r.mistakes || []).filter((q) => q.mechanic === 'Manifestation of Dread' && /ghost reached them/.test(q.detail || '')).length, b = gr.filter((row) => /^Ghost reached/.test((row[0] || {}).txt || '')).length; if (a || b) dis('ghosts that reached their player', MIST, a, 'the Manifestation of Dread section (Debriefing)', b);
      const ma = [...new Set((r.mistakes || []).filter((q) => q.mechanic === 'Malevolent Resonance' && q.player !== 'Raid').map((q) => nmP(q.player)))].sort(), g = ((sec('avoid') || {}).groups || []).find((x) => x.title === 'Malevolent Resonance'), mb = g ? [...new Set((g.rows || []).map((x) => nmP((x[0] || {}).p)))].sort() : [];
      if (ma.length || mb.length) dis('players hit by Malevolent Resonance (ghosts touched)', MIST, ma.join(', ') || 'nobody', AV, mb.join(', ') || 'nobody'); }
    // (Guillotine: the soak count on the mistake and on the mechanic's own row)
    for (const q of r.mistakes || []) { const mm = /soaked by only (\d+) player/.exec(q.detail || ''); if (!mm || !/Guillotine/.test(q.mechanic)) continue; const row = rowsOf(sec('soakq')).find((x) => Math.abs(((x[0] || {}).t || -99) - q.t) < 8); if (row) dis('soakers of the ' + q.mechanic + ' at ' + T(q.t), MIST, mm[1], 'the Guillotine section (Debriefing)', (row[2] || {}).txt); }
    // (Venomfang: the summary sentence and its rows)
    { const s = sec('vf'), mm = s && /(\d+) Venomfang debuffs?, and (\d+) (?:was|were) dispelled/.exec(s.summary || ''); if (mm) { const rows = rowsOf(s); dis('Venomfang debuffs', 'the Venomfang summary line (Debriefing)', mm[1], 'its rows', rows.length); } }
    // (damage done: a player's total against the sum of what they did to each enemy)
    for (const p of plist) { if (!p.dmgT || !p.damage) continue; const sum = [...p.dmgT.values()].reduce((a, v) => a + v, 0); if (Math.abs(sum - p.damage) > 0.005 * p.damage) dis(nmP(p.name) + '\'s damage done', 'the damage total (Graphs meter, Report card)', Math.round(p.damage), 'the sum of their damage by target (Graphs, by enemy)', Math.round(sum)); }
  } catch (e) { out.errs.push('the same-fact checks crashed: ' + e.message); }
  return out;
}

// ---- the saved results: one small file per pull, named by a hash of everything that can change the site's answer ----
function codeHash() { const h = crypto.createHash('sha1'); for (const f of [path.join(SRC, 'engine.js'), path.join(SRC, 'wcl.js'), __filename, path.join(__dirname, 'site-helpers.js')]) h.update(fs.readFileSync(f));
  try { const H = require('./site-helpers.js'); for (const n of UI_NAMES.concat(UI_PREP, UI_RESET, ['deathProof', 'deathVerdict', 'deathFix', 'quarterDead', 'DEATH_JOB', 'DEATH_FAR', 'DEATH_KNOCK', 'DEATH_WIN'] /* (Nov 13: the death rule too, so a change to it reads the deaths again) */)) { try { h.update(H.grab(n)); } catch (e) { h.update('missing ' + n); } } } catch (e) { h.update('no helpers'); } return h.digest('hex').slice(0, 16); }
const CACHE = (() => { for (const d of [path.join(LIB, 'cache', 'answer-key'), path.join(os.tmpdir(), 'debrief-answer-key')]) { try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return d; } catch (e) {} } return null; })();
if (ONE) { const [code, fight, out] = ONE.split(':').concat(args[args.indexOf('--one') + 2]); let res; try { res = siteFacts(code, +fight); } catch (e) { res = { crash: (e.stack || e.message).split('\n').slice(0, 4).join(' | ') }; } fs.writeFileSync(out, JSON.stringify(res)); process.exit(0); }

// ---- comparing one pull ----
function comparePull(code, K, S, say) {
  const near = (a, b, d) => a != null && b != null && Math.abs(a - b) <= d, who = (o) => Object.keys(o || {});
  if (S.crash) { say('crash', 3, 'the site crashed on this pull', 'a result', S.crash); return; }
  for (const e of S.errs || []) say('read', 3, 'the check could not read the site', 'readable', e);
  let n = 0; const ok = () => n++; const lostT = K.cause && K.cause.t != null ? K.cause.t : null;
  // 0. the same fact in two places of the site
  for (const [fact, a, va, b, vb] of S.self || []) say('tabs:' + fact.replace(/[^A-Za-z0-9]+/g, '-').slice(0, 60), 2, 'two tabs disagree on ' + fact, a + ' says ' + va, b + ' says ' + vb, false, true);
  // 1. the pull itself
  if (K.kill !== S.kill) say('kill', 3, 'kill or wipe', K.kill ? 'kill' : 'wipe', S.kill ? 'kill' : 'wipe'); else ok();
  if (!near(K.len, S.len, 2)) say('len', 1, 'how long the pull lasted', K.len + ' s', Math.round(S.len * 10) / 10 + ' s'); else ok();
  const reach = /^P3|Coiled Union|Phase 3/i.test(S.reached) ? 'P3' : /Interm|Soulbinding/i.test(S.reached) ? 'Intermission' : /^P2/i.test(S.reached) ? 'P2' : /^P1/i.test(S.reached) ? 'P1' : S.reached;
  if (K.phase && reach !== K.phase) say('phase', 3, 'the phase the pull reached', K.phase, S.reached || 'nothing'); else ok();
  const ph = (re) => { const x = (S.phases || []).find((p) => re.test(p[0])); return x ? x[1] : null; };
  for (const [k, re, lab] of [['p2', /^P2/i, 'phase 2'], ['intermission', /Interm|Soulbinding/i, 'the intermission'], ['p3', /^P3/i, 'phase 3']]) { const kv = (K.phaseStarts || {})[k]; if (kv == null) continue; const sv = ph(re); if (!near(kv, sv, 4)) say('phaseStart:' + k, 1, 'when ' + lab + ' started', T(kv), sv == null ? 'no such phase' : T(sv)); else ok(); }
  for (const [b, v] of Object.entries(K.bossHpEnd || {})) { const sv = (S.hp || {})[b]; if (sv == null || Math.abs(sv - v[1]) > 1.5) say('hp:' + b, 2, b + '\'s health at the end', v[1] + '%', sv == null ? 'not shown' : sv + '%'); else ok(); }
  // 2. what ended the pull
  if (K.cause && !K.kill) { const c = K.cause, sc = S.cause, cats = [c.cat].concat(c.or || []);
    const byName = !c.cat && c.name, nameOk = byName && sc && [c.name].concat(c.nameOr || []).some((n) => String(sc.name || '').toLowerCase().includes(n.toLowerCase()));
    if (!sc) say('cause', 3, 'what ended the pull', (c.cat || c.name) + ': ' + c.line, 'no cause given', c.sure === false);
    else if (byName) { if (!nameOk) say('cause', 3, 'what ended the pull', c.name + ': ' + c.line, sc.name + ' — ' + (sc.short || ''), c.sure === false); else ok(); if (c.names) { const miss = c.names.filter((n) => !String(sc.short || '').includes(n) && !(sc.who || []).includes(n)); if (miss.length) say('cause:who', 2, 'who the cause names', c.names.join(', '), (sc.who || []).join(', ') + ' — ' + (sc.short || ''), c.sure === false); else ok(); } }
    else if (!cats.includes(sc.cat)) say('cause', 3, 'what ended the pull', c.cat + ': ' + c.line, sc.cat + ': ' + sc.name + ' — ' + (sc.short || ''), c.sure === false); else ok();
    if (sc && c.by && sc.cat === c.cat) { const got = sc.by.slice().sort().join(', '), want = c.by.slice().sort().join(', '), alt = (c.byOr || []).slice().sort().join(', ');
      const fine = c.byAny ? sc.by.length > 0 && sc.by.every((x) => c.by.includes(x)) : got === want || (c.byOr && got === alt);
      if (!fine) say('cause:by', 3, c.cat === 'orbs' ? 'whose purple orb burst' : 'who the cause names', want || 'nobody (' + (c.feared ? c.feared.join(', ') + ' was feared' : c.kind || 'not one player') + ')', got || 'nobody', c.bySure === false); else ok(); } }
  if (K.cause && !K.kill && S.cause && K.cause.notBy) { const bad = (S.cause.who || []).concat(S.cause.by || []).filter((x) => K.cause.notBy.includes(x)); if (bad.length) say('cause:who', 3, 'who the cause blames', 'not ' + K.cause.notBy.join(', ') + ' (' + K.cause.notByWhy + ')', [...new Set(bad)].join(', ') + ': ' + (S.cause.short || '')); else ok(); }
  if (K.kill && S.cause) say('cause', 2, 'a kill has no wipe cause', 'none', S.cause.cat);
  // 3. each player's totals
  for (const [name, kp] of Object.entries(K.players || {})) { const sp = (S.players || {})[name]; if (!sp) { say('player:' + name, 3, name + ' is in the pull', 'yes', 'missing'); continue; }
    { const full = kp.dmg + (kp.dmgShield || 0), offA = Math.abs(sp.dmg - kp.dmg) / kp.dmg, offB = Math.abs(sp.dmg - full) / full; if (kp.dmg > 2e6 && offA > 0.015 && offB > 0.015) say('dmg:' + name, 2, name + '\'s damage done', kp.dmg + (kp.dmgShield ? ' (' + full + ' with shields)' : ''), sp.dmg); else ok();
      if (kp.dmg > 2e6 && (kp.dmgShield || 0) > 0.015 * kp.dmg) { if (offB > 0.015) say('dmgShield:' + name, 2, name + '\'s damage done, counting what the bosses\' shields absorbed', full + ' (' + kp.dmgShield + ' into shields)', sp.dmg); else ok(); } }
    const kh = kp.heal + kp.absorb, khFull = kh + (kp.absorbCheat || 0); if (kh > 2e6 && Math.abs(sp.heal - kh) / kh > 0.03 && Math.abs(sp.heal - khFull) / khFull > 0.03) say('heal:' + name, 2, name + '\'s healing done (heals and absorbs)', kh, sp.heal); else ok();
    if (kh > 2e6 && (kp.absorbCheat || 0) > 0.03 * kh) { if (Math.abs(sp.heal - khFull) / khFull > 0.03) say('healCheat:' + name, 2, name + '\'s healing done, counting Cheat Death or Purgatory', khFull + ' (' + kp.absorbCheat + ' from that shield)', sp.heal); else ok(); }
    const kd = (K.deaths || []).filter((d) => d.player === name).length; if (kd !== sp.deaths) say('deathN:' + name, 3, 'how many times ' + name + ' died', kd, sp.deaths); else ok();
    const kc = (K.consumables || {})[name] || { pot: [], stone: [], healpot: [], manapot: [] };
    for (const [k, lab] of [['pot', 'combat potions'], ['stone', 'Healthstones'], ['healpot', 'health potions'], ['manapot', 'mana potions']]) { if (kc[k].length !== sp[k]) say(k + ':' + name, 2, name + '\'s ' + lab + ' used', kc[k].length + (kc[k].length ? ' (' + kc[k].map((x) => T(x[0])).join(', ') + ')' : ''), sp[k]); else ok(); }
    const kpr = (K.prep || {})[name], spr = (S.prep || {})[name]; if (kpr && spr) for (const k of ['flask', 'food', 'rune']) { if (!!kpr[k] !== !!spr[k]) say(k + ':' + name, 2, name + '\'s ' + k + ' at the pull', kpr[k] || 'none', spr[k] || 'none'); else ok(); } }
  // 4. deaths: each one, in order, and what killed them
  { const sd = (S.deaths || []).slice(), used = new Set();
    for (const d of K.deaths || []) { const i = sd.findIndex((x, j) => !used.has(j) && x.player === d.player && near(x.t, d.t, 1.5)); if (i < 0) { say('death:' + d.player + '@' + Math.round(d.t), 3, d.player + '\'s death at ' + T(d.t), d.killedBy || 'no killing hit', 'not listed'); continue; } used.add(i);
      const x = sd[i], kb = String(d.killedBy || '').toLowerCase(), sb = String(x.kill || x.ability || '').toLowerCase(), sb2 = String(x.ability || '').toLowerCase();
      if (d.killedBy && kb !== sb && kb !== sb2 && !sb.includes(kb) && !kb.includes(sb)) say('deathBy:' + d.player + '@' + Math.round(d.t), 2, 'what killed ' + d.player + ' at ' + T(d.t), d.killedBy, x.ability || 'nothing');
      else if (!d.killedBy && d.mc && !x.fell && !/dreadmarch/i.test(x.ability || '')) say('deathBy:' + d.player + '@' + Math.round(d.t), 2, 'what killed ' + d.player + ' at ' + T(d.t), 'no killing hit, mind controlled (walked off)', x.ability || 'nothing'); else ok(); }
    sd.forEach((x, j) => { if (!used.has(j)) say('death:' + x.player + '@' + Math.round(x.t), 3, 'a death of ' + x.player + ' at ' + T(x.t), 'no such death in the log', x.ability || 'listed'); }); }
  // 4b. each death's verdict under the proof rule: You (with proof) or not counted
  { const sv = (S.verdicts || []).slice(), usedV = new Set(), fam = (x) => String(x || '').toLowerCase().replace(/\s*\(.*$/, '');
    for (const d of K.deaths || []) { if (!d.verdict) continue; const i = sv.findIndex((x, j) => !usedV.has(j) && x.player === d.player && near(x.t, d.t, 1.5)); if (i < 0) continue; usedV.add(i); const x = sv[i], id = d.player + '@' + Math.round(d.t), ks = d.verdict === 'you', ss = x.bucket === 'you';
      const kSay = (ks ? 'You: ' + d.proof : d.verdict === 'low' ? 'maybe You: ' + d.proof : 'not counted: ' + (d.fact || '')) + (d.when === 'after' ? ' (after the wipe)' : ''), sSay = x.say + (x.counts ? '' : ' (after the wipe)');
      if (d.verdict === 'low') { if (ss && x.k === 'mistake') say('deathVerdict:' + id, 3, d.player + '\'s death at ' + T(d.t), kSay, sSay, true); else if (!ss) say('deathVerdict:' + id, 2, d.player + '\'s death at ' + T(d.t), kSay, sSay, true); else ok(); continue; }
      if (ks !== ss) say('deathVerdict:' + id, 3, d.player + '\'s death at ' + T(d.t), kSay, sSay, !!d.unsure);
      else if (ks && ss && x.k === 'mistake' && d.proof && !(d.proofOf || []).some((nm2) => x.say.toLowerCase().includes(String(nm2).toLowerCase()) || String(x.mech || '').toLowerCase().includes(String(nm2).toLowerCase()))) say('deathProof:' + id, 1, 'the proof on ' + d.player + '\'s death at ' + T(d.t), kSay, sSay, !!d.unsure);
      else ok();
      if (!ks && !ss && d.when === 'before' && !x.counts && x.why !== 'reset' /* (a reset pull: the site counts nothing in it, which is not "after the wipe") */ && lostT != null && d.t < lostT - 2) say('deathWhen:' + id, 2, 'whether ' + d.player + '\'s death at ' + T(d.t) + ' was before the wipe', 'before (' + (d.fact || '') + ')', 'after the wipe: ' + sSay); else ok(); } }
  // 4c. Rotation: each player's casts of their most-used spells (one cast of slack, or 3%)
  for (const [name, cs] of Object.entries(K.casts || {})) { const sc = (S.casts || {})[name] || {}; for (const [ab, n1] of Object.entries(cs)) { const sv = sc[ab] || 0; if (Math.abs(sv - n1) > Math.max(1, 0.03 * n1)) say('casts:' + name + ':' + ab, 2, name + '\'s casts of ' + ab, n1, sv); else ok(); } }
  // 4d. Plan: every raid cooldown used, who and when (both ways: the log's casts are on the site, and the site lists none the log doesn't have)
  if (K.raidCds) { const sv = (S.cdUse || []).slice(), usedC = new Set(), names = new Set(sv.map((x) => x.cd));
    for (const [t, who2, cd] of K.raidCds) { const i = sv.findIndex((x, j) => !usedC.has(j) && x.player === who2 && x.cd === cd && near(x.t, t, 2)); if (i >= 0) { usedC.add(i); ok(); } else if (names.has(cd) || (S.cdUse || []).length) say('raidCd:' + who2 + ':' + cd.replace(/[^A-Za-z]+/g, '') + '@' + Math.round(t), 2, who2 + '\'s ' + cd + ' at ' + T(t), 'cast', 'not listed'); }
    sv.forEach((x, j) => { if (!usedC.has(j) && K.raidCds.some((q) => q[2] === x.cd)) say('raidCd:' + x.player + ':' + x.cd.replace(/[^A-Za-z]+/g, '') + '@' + Math.round(x.t), 2, x.player + '\'s ' + x.cd + ' at ' + T(x.t), 'no such cast in the log', 'listed'); }); }
  // 5. kicks
  { const wk = (K.kicks || []).filter((k) => k.spell === 'Wail of Terror'), sk = (S.kicks || []).filter((k) => k.spell === 'Wail of Terror'), by = (l, f) => l.reduce((m, k) => { m[f(k)] = (m[f(k)] || 0) + 1; return m; }, {});
    const a = by(wk, (k) => k.by), b = by(sk, (k) => k.player); for (const p of new Set(who(a).concat(who(b)))) { if ((a[p] || 0) !== (b[p] || 0)) say('wailKicks:' + p, 2, p + '\'s Wail of Terror kicks', a[p] || 0, b[p] || 0); else ok(); }
    const st = (S.kickStats || []).find((k) => k.name === 'Wail of Terror'), km = (K.kicksMissed || []).length; if (((st && st.missed) || 0) !== km) say('wailOff', 3, 'Wail of Terror casts that got off', km + (km ? ' (' + K.kicksMissed.map((x) => T(x.t)).join(', ') + ')' : ''), (st && st.missed) || 0); else ok();
    if ((K.kicks || []).length !== (S.kicks || []).length) say('kicksAll', 2, 'kicks in the pull, all spells', K.kicks.length, S.kicks.length); else ok(); }
  // 6. The Coiled Altar's mechanics
  const U = K.ulatek, SU = S.ula;
  if (U && SU) { const same = (a, b) => a.slice().sort().join(', ') === b.slice().sort().join(', ');
    if (SU.vipers != null && U.vipers.length !== SU.vipers) say('vipers', 2, 'Blightscale Vipers that hatched', U.vipers.length, SU.vipers); else ok();
    if (U.coils.length !== SU.coils.length) say('coilN', 2, 'Spectral Coils circles', U.coils.length, SU.coils.length); else U.coils.forEach((c, i) => { if (c.soakers.length !== SU.coils[i].n) say('coilSoakers@' + Math.round(c.t), 3, 'soakers of the Spectral Coil at ' + T(c.t), c.soakers.length + ' (' + c.soakers.join(', ') + ')', SU.coils[i].n + ' (' + SU.coils[i].who.join(', ') + ')'); else ok(); });
    if (U.beams.length !== SU.beams.length) say('beamN', 2, 'Toxic Incubation beams', U.beams.length, SU.beams.length); else U.beams.forEach((b, i) => { const kt = b.took.map((x) => x[0]); if (!same(kt, SU.beams[i].took)) say('beamTook@' + Math.round(b.t), 3, 'who took the Toxic Incubation beam at ' + T(b.t), b.took.map((x) => x[0] + ' x' + x[1]).join(', ') || 'nobody', SU.beams[i].took.join(', ') || 'nobody'); else ok(); });
    { const kf = [...new Set(U.festerBursts.flatMap((b) => b.hitNotTanks || []))].sort(), sf = [...new Set(SU.wretch.flatMap((w) => w.outside))].sort(); if (!same(kf, sf)) say('festerOutside', 2, 'who Fester Burst caught outside the bubble (tanks left out)', kf.length + ' (' + kf.join(', ') + ')', sf.length + ' (' + sf.join(', ') + ')'); else ok(); }
    { const kp = [...new Set(U.splashes.map((x) => x.player))], sp2 = Object.keys((S.avoid || {})['Noxious Splash'] || {}); if (!same(kp, sp2)) say('splash', 2, 'egg carriers who touched (Noxious Splash)', kp.sort().join(', ') || 'nobody', sp2.sort().join(', ') || 'nobody'); else ok(); }
  }
  const M = K.mechanics; if (!M) return n;
  const mist = (re, dre) => (S.mistakes || []).filter((q) => re.test(q.mech) && (!dre || dre.test(q.detail)));
  const pairUp = (id, sev, lab, want, got, win) => { const used = new Set(); for (const w of want) { const i = got.findIndex((g, j) => !used.has(j) && g.player === w.player && near(g.t, w.t, win)); if (i < 0) say(id + ':' + w.player + '@' + Math.round(w.t), sev, lab + ': ' + w.player + ' at ' + T(w.t), w.say || 'yes', 'not listed'); else { used.add(i); ok(); } }
    got.forEach((g, j) => { if (!used.has(j)) say(id + ':' + g.player + '@' + Math.round(g.t), sev, lab + ': ' + g.player + ' at ' + T(g.t), 'not in the log', g.say || 'listed'); }); };
  pairUp('frontalHit', 2, 'hit by a tank frontal (not a tank)', M.frontals.flatMap((f) => f.others.map((p) => ({ t: f.t, player: p, say: f.spell }))), mist(/^(Sever|Soul Sever|Blighted Sever)$/, /^Stood in/).map((q) => ({ t: q.t, player: q.player, say: q.detail.slice(0, 60) })), 3);
  pairUp('ghostReached', 2, 'a ghost reached its player', M.ghostReached.map((g) => ({ t: g.t, player: g.player })), mist(/^Manifestation of Dread$/, /ghost reached them/).map((q) => ({ t: q.t, player: q.player })), 3);
  pairUp('ghostsTouched', 2, 'ghosts touched (Malevolent Resonance)', M.ghostsTouched.flatMap((g) => g.players.map((p) => ({ t: g.t, player: p }))), mist(/^Malevolent Resonance$/, /touched/).map((q) => ({ t: q.t, player: q.player })), 4);
  pairUp('bombAlsoHit', 2, 'caught in someone else\'s Gloombomb', M.gloombombs.flatMap((g) => g.alsoHit.map((p) => ({ t: g.t + 5, player: p }))), mist(/^Gloombomb/, /clipped by/).map((q) => ({ t: q.t, player: q.player })), 4);
  // (soul fragments: a player who lived through Gravebound running out with fragments left is on the site's list with the same count; and every
  //  row the site lists is a Gravebound the log has, with that many picked up)
  { const rows = (S.gloomRows || []).filter((x) => /^Soul fragments/i.test(x.what)).flatMap((x) => x.players.map((p) => ({ t: x.t, player: p, n: +(/picked up (\d) of 3/.exec(x.txt) || [])[1], say: x.txt }))), used = new Set();
    for (const g of M.graveboundMissed.filter((x) => x.for >= 12.5 && !x.died)) { const i = rows.findIndex((x, j) => !used.has(j) && x.player === g.player && near(x.t, g.t, 4)); if (i < 0) say('fragments:' + g.player + '@' + Math.round(g.t), 2, 'soul fragments left by ' + g.player + ' at ' + T(g.t), 'picked up ' + g.picked + ' of 3 and took the Gravebound hit', 'not listed'); else { used.add(i); ok(); } }
    rows.forEach((x, j) => { const g = M.graveboundMissed.find((q) => q.player === x.player && near(q.t, x.t, 4)); if (!g) say('fragments:' + x.player + '@' + Math.round(x.t), 2, 'soul fragments left by ' + x.player + ' at ' + T(x.t), 'no Gravebound with fragments left', x.say); else if (!isNaN(x.n) && x.n !== g.picked) say('fragmentsN:' + x.player + '@' + Math.round(x.t), 2, 'soul fragments ' + x.player + ' picked up at ' + T(x.t), g.picked + ' of 3', x.say); else ok(); }); }
  for (const [name, o] of Object.entries(M.noxious || {})) { const txt = ((S.avoid || {})['Noxious Ground'] || {})[name], sv = txt ? +(/^(\d+(?:\.\d+)?) s/.exec(txt) || [])[1] : 0; if (Math.abs(sv - o.ticks) > 2 && Math.abs(sv - o.secs) > 2) say('noxious:' + name, 2, name + '\'s seconds in Noxious Ground', o.ticks + ' damage ticks, ' + o.secs + ' s with the debuff', txt || 'not listed'); else ok(); }
  for (const [name, hits] of Object.entries(M.axeCaught || {})) { const txt = ((S.avoid || {}).Axegrinder || {})[name], sv = txt ? +(/^(\d+) hits?/.exec(txt) || [])[1] : 0; if (Math.abs(sv - hits) > Math.max(2, 0.25 * hits)) say('axe:' + name, 2, 'times an axe caught ' + name, hits, txt || 'not listed'); else ok(); }
  { const vs = (S.vf || []).slice(), used = new Set(); for (const v of M.venomfang || []) { const i = vs.findIndex((x, j) => !used.has(j) && x.player === v.player && (x.t == null || near(x.t, v.t, 3))); if (i < 0) { say('venomfang:' + v.player + '@' + Math.round(v.t), 2, 'Venomfang on ' + v.player + ' at ' + T(v.t), v.by ? 'dispelled by ' + v.by + ' after ' + v.after + ' s' : 'not dispelled (' + v.after + ' s)', 'not listed'); continue; } used.add(i);
      const x = vs[i], secs = +(/(\d+(?:\.\d+)?)\s*s/.exec(x.txt) || [])[1], sby = /^[A-Z]/.test(x.by) && !/expired|not dispelled/i.test(x.by) ? x.by : null;
      if ((v.by || null) !== sby) say('venomfangBy:' + v.player + '@' + Math.round(v.t), 2, 'who dispelled Venomfang on ' + v.player + ' at ' + T(v.t), v.by || 'nobody (it ran out or they died)', sby || 'nobody'); else ok();
      if (x.more && /dispels? ready|no dispel free|had just used/.test(x.more) && v.free) { const want = v.free.filter((n) => n !== v.by), m1 = /^(\S+) had the only dispel ready/.exec(x.more) || /(\S+) had a dispel ready/.exec(x.more), mN = /with (\d+) dispels ready/.exec(x.more), none = /no dispel free|had just used theirs/.test(x.more), got = m1 ? 1 : mN ? +mN[1] : none ? 0 : null;
        if (got != null && got !== want.length) say('venomfangFree:' + v.player + '@' + Math.round(v.t), 2, 'dispels ready when Venomfang landed on ' + v.player + ' at ' + T(v.t), want.length + (want.length ? ' (' + want.join(', ') + ')' : ''), got + ': ' + x.more.slice(0, 140)); else if (m1 && want.length === 1 && want[0] !== m1[1]) say('venomfangFree:' + v.player + '@' + Math.round(v.t), 2, 'who had the dispel ready when Venomfang landed on ' + v.player + ' at ' + T(v.t), want[0], m1[1]); else if (got != null) ok(); }
      if (!near(secs, v.after, 0.7)) say('venomfangFor:' + v.player + '@' + Math.round(v.t), 1, 'how long Venomfang stayed on ' + v.player + ' at ' + T(v.t), v.after + ' s', x.txt); else ok(); }
    vs.forEach((x, j) => { if (!used.has(j)) say('venomfang:' + x.player + '@' + Math.round(x.t || 0), 2, 'a Venomfang on ' + x.player, 'not in the log', x.txt); }); }
  { const ss = (S.soaks || []).slice(), used = new Set(); for (const g of M.guillotines || []) { if (!g.soakers.length && K.len - g.t < 8) continue; const i = ss.findIndex((x, j) => !used.has(j) && near(x.t, g.t, 4)); if (i < 0) { say('soak@' + Math.round(g.t), 2, g.spell + ' at ' + T(g.t), g.soakers.length + ' soakers', 'not listed'); continue; } used.add(i);
      if (ss[i].n !== g.soakers.length) say('soakN@' + Math.round(g.t), 3, 'soakers of the ' + g.spell + ' at ' + T(g.t), g.soakers.length + ' (' + g.soakers.join(', ') + ')', ss[i].n); else ok();
      if (ss[i].target && ss[i].target !== g.target) say('soakTarget@' + Math.round(g.t), 2, 'the ' + g.spell + ' target at ' + T(g.t), g.target, ss[i].target); else ok(); } }
  { const got = mist(/Execution/i).length + (S.mistakes || []).filter((q) => /Guillotine/.test(q.mech) && /soaked by only|Execution/.test(q.detail)).length; if ((M.executions || []).length && !got) say('execution', 3, 'Executions (a soak with too few)', M.executions.map((x) => x.spell + ' at ' + T(x.t) + ' hit ' + x.hit).join('; '), 'none listed'); else ok(); }
  { const sh = S.shields || []; if ((M.shields || []).length !== sh.length) say('shieldN', 2, 'Eternal Nightfall shields', M.shields.length, sh.length); else M.shields.forEach((k, i) => { const x = sh[i], sv = +(/after (\d+(?:\.\d+)?) s/.exec(x.txt) || [])[1], late = /not broken|too late|finished/i.test(x.txt);
      if (k.brokenAfter == null ? !late && !isNaN(sv) && K.len - k.t > 17 : isNaN(sv) ? !(late && k.brokenAfter >= 16.9) : Math.abs(sv - k.brokenAfter) > 1) say('shield@' + Math.round(k.t), 2, 'the shield at ' + T(k.t), k.brokenAfter == null ? 'never broken' : 'broken after ' + k.brokenAfter + ' s', x.txt || 'nothing'); else ok(); });
    const nf = mist(/^Eternal Nightfall/, /finished casting/).length; if (nf !== (M.nightfallFinished || []).length) say('nightfall', 3, 'Eternal Nightfall casts that finished', M.nightfallFinished.length, nf); else ok(); }
  if ((M.adds || []).length !== S.adds) say('adds', 1, 'Spiteful Soulcoilers that spawned', M.adds.length, S.adds); else ok();
  { const sv = +(/(\d+) fragments? reached/.exec(S.inter || '') || [])[1] || 0; if (K.phaseStarts.intermission != null && sv !== (M.fragmentsReached || 0)) say('fragmentsReached', 2, 'fragments that reached Zul\'jan', M.fragmentsReached, S.inter || 'nothing'); else ok(); }
  { const dm = S.dm || []; (M.dreadmarch || []).forEach((k) => { if (!k.targets.length) return; const x = dm.find((g) => near(g.t, k.t, 4)); if (!x) say('dreadmarch@' + Math.round(k.t), 2, 'the Dreadmarch at ' + T(k.t), k.targets.join(', '), 'not listed'); else if (k.targets.slice().sort().join() !== x.tg.slice().sort().join()) say('dreadmarchTargets@' + Math.round(k.t), 2, 'who the Dreadmarch at ' + T(k.t) + ' took', k.targets.slice().sort().join(', '), x.tg.slice().sort().join(', ')); else ok(); }); }
  { const sf = S.fronts || []; for (const f of (M.frontals || []).filter((x) => x.spell !== 'Soul Sever' && x.tanks.length)) { const l = sf.filter((x) => near(x.t, f.t, 2.5)); if (!l.length) say('frontal@' + Math.round(f.t), 2, 'the ' + f.spell + ' at ' + T(f.t), 'on ' + f.tanks.join(', '), 'not listed'); else if (!l.some((x) => f.tanks.includes(x.tank))) say('frontalTank@' + Math.round(f.t), 2, 'who took the ' + f.spell + ' at ' + T(f.t), f.tanks.join(', '), l.map((x) => x.tank || 'nobody').join(', ')); else ok(); } }
  return n;
}

// ---- run ----
(async () => {
  const t0 = Date.now(), keyFiles = fs.existsSync(KEYS) ? fs.readdirSync(KEYS).filter((f) => /^[A-Za-z0-9]{16}(-[a-z]+)?\.json$/.test(f)) : [];
  if (!keyFiles.length) { console.log('Answer key: no key files'); process.exit(1); }
  if (!fs.existsSync(LIB)) { console.log('Answer key: skipped (no log library at ' + LIB + ')'); process.exit(0); }
  const known = (() => { try { return JSON.parse(fs.readFileSync(path.join(KEYS, 'known.json'), 'utf8')); } catch (e) { return {}; } })();
  const hash = codeHash(), jobs = [];
  for (const f of keyFiles) { const K = JSON.parse(fs.readFileSync(path.join(KEYS, f), 'utf8')); for (const p of K.pulls) { const ef = findFile(K.code + '_' + p.fight + '.json'); if (!ef || !findFile('rep_' + K.code + '.json')) { console.log('  (no saved copy of ' + K.code + ':' + p.fight + ', skipped)'); continue; }
      jobs.push({ K, p, cf: CACHE ? path.join(CACHE, K.code + '_' + p.fight + '_' + hash + '_' + fs.statSync(ef).size + '.json') : null }); } }
  const todo = jobs.filter((j) => FRESH || !j.cf || !fs.existsSync(j.cf));
  if (todo.length) { const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dbak-')), N = Math.max(1, Math.min(4, os.cpus().length - 1, Math.floor(os.freemem() / 3e9) || 1)); let i = 0;
    const one = () => new Promise((res) => { const j = todo[i++]; if (!j) return res(); const out = j.cf || path.join(tmp, j.K.code + '_' + j.p.fight + '.json'); j.out = out;
      const c = cp.spawn(process.execPath, ['--max-old-space-size=6144', __filename, '--one', j.K.code + ':' + j.p.fight, out], { stdio: ['ignore', 'ignore', 'pipe'] }); let err = ''; c.stderr.on('data', (d) => { err += d; });
      c.on('close', (code) => { if (!fs.existsSync(out) || code) fs.writeFileSync(out, JSON.stringify({ crash: 'the engine run failed: ' + err.slice(0, 300) })); one().then(res); }); });
    await Promise.all(Array.from({ length: N }, one)); }
  const P = []; let nOk = 0, nPull = 0;
  for (const j of jobs) { const S = JSON.parse(fs.readFileSync(j.out || j.cf, 'utf8')), K = j.K, p = j.p, lab = K.date + ' ' + K.boss + ' pull ' + p.pull;
    nOk += comparePull(K.code, p, S, (fact, sev, what, key, site, unsure, tabs) => P.push({ id: K.code + ':' + p.fight + ':' + fact, pull: lab, fact: what, key: String(key), site: String(site), sev, unsure: !!unsure, tabs: !!tabs })) || 0; nPull++; }
  const pats = Object.keys(known).filter((k) => k.includes('*')).map((k) => [k, new RegExp('^' + k.split('*').map((x) => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$')]), isKnown = (id) => id in known || pats.some(([, re]) => re.test(id));
  const ids = new Set(P.map((x) => x.id)), fresh = P.filter((x) => !isKnown(x.id) && !x.unsure), wait = P.filter((x) => isKnown(x.id)), review = P.filter((x) => x.unsure && !isKnown(x.id)), fixed = Object.keys(known).filter((k) => (k.includes('*') ? !P.some((x) => pats.find((q) => q[0] === k)[1].test(x.id)) : !ids.has(k) && jobs.some((j) => k.startsWith(j.K.code + ':' + j.p.fight + ':'))));
  const show = (l) => { const by = new Map(); for (const x of l.slice().sort((a, b) => b.sev - a.sev)) { const a = by.get(x.pull) || []; a.push(x); by.set(x.pull, a); } for (const [pull, a] of by) { console.log('\n' + pull + ':'); for (const x of a) console.log('  ' + x.fact + ': ' + (x.tabs ? x.key + ', ' + x.site : 'the log says ' + x.key + ', the site says ' + x.site) + '   [' + x.id + ']'); } };
  if (fresh.length) { console.log('NEW mismatches with the answer key (the site changed its answer, or a new fact is wrong):'); show(fresh); }
  if (fixed.length) console.log('\nNow right, so delete these lines from tests/answer-key/known.json (then they can never come back):\n  ' + fixed.join('\n  '));
  if (review.length && LIST) { console.log('\nTo review (the log leaves room for two readings, these never fail a build):'); show(review); }
  if (wait.length && LIST) { console.log('\nKnown, waiting on a fix:'); show(wait); }
  if (JOUT) fs.writeFileSync(JOUT, JSON.stringify(P, null, 1));
  const bad = fresh.length + fixed.length;
  console.log('\nAnswer key: ' + nPull + ' pull(s), ' + (nOk + P.length) + ' facts in ' + Math.round((Date.now() - t0) / 1000) + ' s (' + (todo.length ? todo.length + ' read again' : 'nothing in the engine changed') + '), ' + (bad ? fresh.length + ' new mismatch(es)' + (fixed.length ? ', ' + fixed.length + ' now right' : '') : 'no new mismatches') + (wait.length ? ', ' + wait.length + ' known waiting on a fix' : '') + (review.length ? ', ' + review.length + ' to review' : ''));
  process.exit(bad ? 1 : 0);
})();
