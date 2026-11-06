// Contradiction check (analysis step 1, Nov 5): runs the engine on saved test pulls and fails loudly when the site contradicts itself.
// The guide: notes/Guides/Contradiction check - how it works.md. build.ps1 runs the quick set on every build.
//   node tests/contradictions.js              the quick set (5 pulls, about 20 s)
//   node tests/contradictions.js --all        every saved pull of the test nights
//   node tests/contradictions.js --dir <dir>  also every pull in <dir> (<code>_<fight>.json events + rep_<code>.json reports)
// It needs the log library (C:\Users\james\DebriefLogs, or DEBRIEF_LOGS); without it, it says so and passes.
// Exit code 1 when anything contradicts itself, with one line per problem.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src');
const LIB = process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs';
const args = process.argv.slice(2), ALL = args.includes('--all'), DIRS = [];
for (let i = 0; i < args.length; i++) if (args[i] === '--dir' && args[i + 1]) DIRS.push(args[++i]);
// the test nights: Wolfthorn's Oct 21 Coiled Altar (Mythic wipes), Wolfthorn's Oct 14 night (Kith'ix Heroic kill, Twin Fangs Mythic), and another
// guild's all-bosses Mythic night (Oct 25)
const NIGHTS = ['HWFBkCyc6JNazQrK', '9DRWhKnZbHtQgf4a', 'xH3JNdbQ74wBDPAv'];
const QUICK = ['HWFBkCyc6JNazQrK:10', 'HWFBkCyc6JNazQrK:14', '9DRWhKnZbHtQgf4a:43', '9DRWhKnZbHtQgf4a:36', 'xH3JNdbQ74wBDPAv:53'];

const E = require(path.join(SRC, 'engine.js')), W = require(path.join(SRC, 'wcl.js'));

// ---- the site's own helpers, taken out of ui.js by name (so the check reads exactly what the page shows) ----
const H = require('./site-helpers.js'), UI = H.UI;
// (the All pulls card's line about a pull, from shell.html)
const SHELL = require('vm').runInNewContext(H.grab('phN', H.SH) + '\n' + H.grab('story', H.SH) + '\n' + H.grab('nsmFocusOf', H.SH) + '\n({ story, nsmFocusOf })');
const RCX = require('vm').runInNewContext(H.grab('RC_FIX') + '\n' + H.grab('RC_NEXT') + '\n' + H.grab('RC_FIRST') + '\n' + H.grab('rcFirstLine') + '\n({ RC_FIX, RC_NEXT, RC_FIRST, rcFirstLine })');
const NIGHT_RC = new Map(); /* (each test night's Coiled Altar root causes, for the All pulls focus band check) */
/* (the Whole tier (Nov 5): its own numbers for a night, read with the page's code; the cut at the wipe call and the killing-blow verdict stand
   in as "none" on both sides, so the tier and All pulls are compared on the same causes) */
const TSITE = H.site(['esc', 'plural', 'NKG', 'NK346', 'NK283', 'nkWord283', 'PROGRESS', 'phSize', 'phShare', 'encLeft', 'shortBoss', 'bossAtV', 'progressOf', 'wclProg', 'pullProg', 'pullPct', 'cHtml', 'aphOf', 'nightOf', 'tierDay', 'TIER_CC', 'tierModel', 'lc0', 'whyKey', 'dbfCap', 'dbfReset', 'wipeRoot', 'pullCauseOf', 'tierVer', 'tierSumOf'], { cutInfo: () => null, WROOT: new WeakMap(), whyWiped: () => null, mech: (m) => m, RD: null });
const TIER_T = new Map(); /* (each test night's pulls of a boss: the tier's line, All pulls' cause and health) */
/* (How it went's titles (Nov 5): the page's own rule and wipe chain; the cut at the wipe call stands in as "none") */
const CHT = H.site(['MECH_FAM', 'mechFams', 'chainTitleFits', 'wipeChain'], { cutInfo: () => null, cutT: () => Infinity, keptMistakes: (r) => r.mistakes || [], keptDeaths: (r) => r.deaths || [] });
const SITE = H.site(['esc', 'lpAnd', 'andList', 'plural', 'NKG', 'NK346', 'NK283', 'nkWord283', 'PROGRESS', 'phSize', 'phShare', 'encLeft', 'shortBoss', 'bossAtV', 'progressOf', 'wclProg', 'pullProg', 'pullPct', 'pullLabel', 'pullShort', 'dbfAt', 'dbfPre', 'cellTxt', 'rowSay', 'rowText', 'cHtml', 'aphOf']);

// ---- the pulls ----
const readJ = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const findFile = (n) => [path.join(LIB, 'events', n), path.join(LIB, 'reports', n)].concat(DIRS.map((d) => path.join(d, n)), DIRS.map((d) => path.join(d, 'ev', n))).find((f) => fs.existsSync(f));
const reports = new Map();
function report(code) {
  if (reports.has(code)) return reports.get(code);
  const f = findFile('rep_' + code + '.json'); if (!f) return null;
  let r = readJ(f); r = r.data || (r.reportData ? r.reportData.report : r);
  const items = H.pullItems(code, r, W);
  const o = { r, items }; reports.set(code, o); return o;
}
let keys = QUICK.slice();
if (ALL || DIRS.length) {
  keys = [];
  const add = (dir, any) => { if (!fs.existsSync(dir)) return; for (const f of fs.readdirSync(dir)) { const m = /^([A-Za-z0-9]{16})_(\d+)\.json$/.exec(f); if (m && (any || NIGHTS.includes(m[1]))) keys.push(m[1] + ':' + m[2]); } };
  if (ALL) add(path.join(LIB, 'events'));
  for (const d of DIRS) { add(d, true); add(path.join(d, 'ev'), true); }
  keys = [...new Set(keys)];
}

// ---- the checks ----
const P = [], say = (pull, kind, msg) => P.push({ pull, kind, msg });
const VERBS = /^(kill|pop|run|jump|aim|clear|drain|stop|swap|drop|hit|stare|push|grab|break|step|stay|keep|get|go|heal|save|feed|find|catch)$/i;
const PLAIN = /^(avoidable damage|phase changes|interrupts|deaths|pace|raid checks)\b/i;
const BADTXT = [[/\bundefined\b/, '"undefined"'], [/\bNaN\b/, '"NaN"'], [/\bnull\b/, '"null"'], [/\[object /, '"[object"'], [/\b(\d+ )?players? their\b/i, '"player their" (a broken possessive)'],
  [/\b([A-Za-z]{3,})\s+\1\b/i, 'a doubled word'], [/\bat at\b/i, '"at at"'], [/boss at \d+%.*boss at \d+%/i, 'the boss health said twice']];
const OKDOUBLE = /\b(that that|had had)\b/i;
function clean(pull, where, t) {
  const s = String(t == null ? '' : t); if (!s) return;
  for (const [re, what] of BADTXT) { const m = re.exec(s); if (m && !(what === 'a doubled word' && OKDOUBLE.test(m[0]))) say(pull, 'text', where + ': ' + what + ' in "' + s.slice(Math.max(0, m.index - 40), m.index + 60) + '"'); }
}
const cellBad = (c) => c && (c.bad || c.warn);
const rowsOf = (s) => (s.rows || []).concat(...(s.groups || []).map((g) => g.rows || []));
const pctN = (s) => (String(s).match(/\d+(?:\.\d+)?%/g) || []).length;
// (the hits a player really took from one spell: separate moments at least 1.5 s apart, from the log itself)
function hitMoments(txt) {
  const out = new Map(), re = /^\S+ (\d+):(\d+):(\d+\.\d+)\S*\s+(?:SPELL_DAMAGE|RANGE_DAMAGE|SPELL_PERIODIC_DAMAGE),[^,]*,"[^"]*",[^,]*,[^,]*,[^,]*,"([^"]*)",[^,]*,[^,]*,(\d+),"([^"]*)"/gm;
  let m; while ((m = re.exec(txt))) { const t = +m[1] * 3600 + +m[2] * 60 + +m[3], k = m[4].split('-')[0] + '|' + m[5]; let a = out.get(k); if (!a) out.set(k, (a = [])); a.push(t); }
  return (who, ids) => { let ts = []; for (const id of ids) ts = ts.concat(out.get(who + '|' + id) || []); ts.sort((a, b) => a - b); let n = 0, last = -9; for (const t of ts) { if (t - last > 1.5) n++; last = t; } return n; };
}

function checkPull(key) {
  const [code, fight] = key.split(':'), rep = report(code), ef = findFile(code + '_' + fight + '.json');
  if (!rep || !ef || !rep.items.get(+fight)) { console.log('  (no saved copy of ' + key + ', skipped)'); return false; }
  const it = rep.items.get(+fight), pull = it.boss + ' ' + it.diff + ' pull ' + it.pull + ' (' + key + ')';
  let ev = readJ(ef); if (!Array.isArray(ev)) ev = ev.events;
  /* (some older saved copies left out which spell a kick stopped; the site always has it, so "Spell undefined" there isn't the site's) */
  const oldCopy = ev.some((e) => e.type === 'interrupt' && e.extraAbilityGameID == null);
  const txt = W.translate(it, ev); ev = null;
  const P0 = P.length;
  const r = E.analyze(it, txt, {}); if (!r.item) r.item = it; SITE.CACHE.set(it, r);
  const hits = hitMoments(txt);
  // 1. one health number: the pull picker, the banner, the coach and the Companion read one whole-fight number, "boss at N%"
  if (!it.kill) {
    const v = SITE.pullPct(it), want = SITE.bossAtV(v), pg = SITE.progressOf(r);
    const shown = { 'pull label': SITE.pullLabel(it), 'short result': SITE.pullShort(it), 'progress label (Companion, Debriefing)': pg && pg.label };
    if (v != null) for (const [k, s] of Object.entries(shown)) {
      if (s == null) continue;
      if (!String(s).includes(want)) say(pull, 'health', k + ' says "' + s + '" but the pull picker says "' + want + '"');
      if (pctN(s) > 1) say(pull, 'health', k + ' shows two health numbers: "' + s + '"');
    }
    if (pg && v != null && pg.left != null && Math.abs(pg.left - v) > 0.5) say(pull, 'health', 'the banner reads ' + pg.left.toFixed(1) + '% but the pull picker ' + v.toFixed(1) + '%');
    const a = SITE.dbfAt(SITE.pullShort(it)), line = 'We wiped ' + SITE.dbfPre(a) + a + '.';
    { const q = SITE.aphOf([r]).p[0], st = q ? SHELL.story(q) : ''; clean(pull, 'All pulls card', 'Best pull: ' + it.pull + ' · ' + want + (st ? ' ' + st : '')); }
    if (/\b(at|in) (the )?boss at\b|\bat P\d|\bat Int/.test(line)) say(pull, 'text', 'the coach line reads "' + line + '"');
    clean(pull, 'coach line', line);
  }
  // 2. each mechanic: the verdict matches its rows, the counts add up, the text is clean, the title is "Name (Nickname)"
  const m = r.module && !r.module.error ? r.module : null;
  for (const s of (m && m.sections) || []) {
    const where = s.title, rows = rowsOf(s), groups = s.groups || [];
    const flagged = rows.filter((row) => row.some(cellBad)), red = rows.filter((row) => row.some((c) => c && c.bad));
    const gFlag = groups.filter((g) => g.bad || g.warn);
    if (s.verdict === 'good' && (flagged.length || gFlag.length)) say(pull, 'verdict', where + ' is green, but it lists ' + (flagged.length ? flagged.length + ' flagged row(s)' : gFlag.length + ' flagged set(s)') + ' (first: "' + SITE.cHtml(flagged.length ? SITE.rowText(s, flagged[0]) : gFlag[0].title + ': ' + (gFlag[0].sub || '')) + '")');
    if (s.verdict === 'bad' && rows.length && !red.length && !groups.some((g) => g.bad)) say(pull, 'verdict', where + ' is red, but none of its ' + rows.length + ' rows is a failure');
    for (const g of groups) {
      const n = (/^(\d+) players? [^,;.]*$/.exec(g.sub || '') || [])[1]; /* (one claim about the rows below: "5 players without a mote") */
      if (n != null && +n !== new Set((g.rows || []).map((row) => (row.find((c) => c && c.p) || {}).p).filter(Boolean)).size) say(pull, 'count', where + ' · ' + g.title + ' says "' + g.sub + '" but lists ' + (g.rows || []).length + ' row(s)');
      const hm = /(\d+) hits on (\d+) players?/.exec(g.sub || '');
      if (hm && !g.secs) { const sum = (g.rows || []).reduce((a, row) => a + (+((/^(\d+) hits?/.exec((row[1] && row[1].txt) || '') || [])[1] || 0)), 0), ppl = (g.rows || []).length;
        if (sum !== +hm[1] || ppl !== +hm[2]) say(pull, 'count', where + ' · ' + g.title + ' says ' + hm[0] + ' but its rows add up to ' + sum + ' hits on ' + ppl + ' players'); }
      if (s.id === 'avoid' && !g.secs && g.spell) for (const row of g.rows || []) { const p = (row[0] || {}).p, h = +((/^(\d+) hits?/.exec((row[1] && row[1].txt) || '') || [])[1] || 0);
        if (!p || !h || /damage ticks/.test((row[1] && row[1].sub) || '')) continue; const real = hits(p, [g.spell[0]]); if (real && h > real) say(pull, 'count', where + ' · ' + g.title + ': ' + p + ' has ' + h + ' hits, but the log has only ' + real + ' separate hits (damage ticks counted as hits)'); }
      clean(pull, where + ' · ' + g.title, g.title); clean(pull, where + ' · ' + g.title, g.sub);
    }
    for (const t of [s.summary, s.title]) clean(pull, where, t);
    for (const row of rows) { for (const c of row) if (c) { clean(pull, where, c.txt); clean(pull, where, c.sub); clean(pull, where, c.say); } }
    for (const row of flagged) { const g = groups.find((q) => (q.rows || []).includes(row)); clean(pull, where + ' (its line on Debriefing)', SITE.rowSay(row) || (g ? g.title + ', ' : '') + SITE.rowText(s, row)); }
    const ofs = String(s.summary || '').match(/(\d+) of (\d+)/g) || []; for (const x of ofs) { const [a, b] = x.split(' of ').map(Number); if (a > b) say(pull, 'count', where + ' says "' + x + '"'); }
    // the title: "Name (Nickname)", a noun from the site's one nickname table
    if (!PLAIN.test(s.title)) {
      const base = s.title.replace(/\s*\(.*$/, '').trim(), p0 = (s.title.match(/\(([^)]*)\)\s*$/) || [])[1] || '', nk = SITE.nkWord283(p0, s.title), lc = base.toLowerCase();
      const fromTable = Object.prototype.hasOwnProperty.call(SITE.NKG, lc) || Object.prototype.hasOwnProperty.call(SITE.NK346, s.title.toLowerCase());
      if (!fromTable) say(pull, 'title', '"' + s.title + '" has no noun nickname in NKG (it shows "' + base + (nk ? ' (' + nk + ')' : '') + '")');
      else if (nk && (VERBS.test(nk) || nk.toLowerCase() === lc || nk.split(/\s+/).length > 2)) say(pull, 'title', '"' + base + ' (' + nk + ')" is not a 1-2 word noun nickname');
    }
  }
  if (E.rootCause && it.boss === 'The Coiled Altar' && !it.kill) { const o = E.rootCause(r); if (o && o.cat !== 'reset') { const l = NIGHT_RC.get(code) || []; l.push(o); NIGHT_RC.set(code, l); } if (!o || !o.line) say(pull, 'root', 'no root cause for this wipe'); else if (JSON.stringify(o.sp || null) !== JSON.stringify(E.RC_CAT[o.cat].sp || null)) say(pull, 'icon', 'the root cause ' + o.name + ' carries another icon'); else { clean(pull, 'root cause', o.line); clean(pull, 'root cause, short', o.short); if (!o.short) say(pull, 'root', 'no short why sentence for ' + o.cat); for (const a of o.also) for (const x of a.txt) clean(pull, 'also added up', x); if (o.also.some((a) => a.cat === o.cat)) say(pull, 'root', 'the root cause (' + o.name + ') is also listed under Also added up'); } }
  /* (Nov 5: the root cause's first moment is never after the moment the pull was lost; and How it went's row at the root cause's moment can take
     its tag (a Death row is judged by what killed them: "Too many dead" tags the first death it names)) */
  if (E.rootCause && it.boss === 'The Coiled Altar' && !it.kill) { const o = E.rootCause(r); if (o && o.line) { /* (Nov 5: an orb root cause names everyone who carried a purple orb when the orbs went off; a reset says who) */
      const oc = (r.module.sections || []).find((s) => s.id === 'orbs' && s.carry), at = (t) => (oc ? [...new Set(oc.carry.filter(([, s, e]) => t >= s - 0.2 && t <= e + 0.3).map(([n]) => n))] : []);
      const vr = (deaths) => deaths.find((d) => /^venom rupture$/i.test(d.ability || '') && d.t >= o.chain[0].t - 0.5);
      if (o.cat === 'orbs' && o.chain[0] && o.chain[0].cat === 'orbs') { const fv = vr(r.deaths.slice().sort((a, b) => a.t - b.t)), want = fv ? at(fv.t) : []; if (want.length && !want.every((n) => o.short.includes(n) && o.line.includes(n))) say(pull, 'root', 'the orb root cause doesn\'t name its carrier (' + want.join(', ') + '): "' + o.short + '"'); }
      if (o.reset && !Array.isArray(o.reset.who)) say(pull, 'root', 'the reset doesn\'t say whose orb it was');
      /* (Nov 5, Flex: individual mistakes never point at one person; a single personal mistake is the cause only when it hit the raid at once) */
      if (o.cat === 'dead') { if ((o.marks || []).some((m) => m.k === 'root')) say(pull, 'root', 'Too many individual mistakes tags one death as the root cause');
        const nD = (r.deaths || []).filter((d) => d.t <= o.t + 0.5).length, nM = (o.most || []).reduce((s, m) => s + m.n, 0); if (nM > nD) say(pull, 'count', 'what added up counts ' + nM + ' deaths, but only ' + nD + ' died by ' + E.fmtT(o.t)); }
      if (/^(axes|pools|frontal|ghosts|mc|bombs|orbs)$/.test(o.cat) && !/^(a wave|mass mind control)$/.test(o.why) && !o.early) say(pull, 'root', o.name + ' is the one cause of a pull worn down by separate deaths (' + o.why + ')');
      if (o.cat === 'adds' && (o.bombBy || []).some((n) => !o.short.includes(n))) say(pull, 'root', 'the add wipe doesn\'t name whose Gloombomb missed');
      /* (Main, Nov 5: All pulls' "Carried the orb that burst" lists the root cause's own carriers, the same rule as the sentence) */
      if (o.cat === 'orbs') { const ob = o.orbBy || [], want = o.orbAt != null ? E.orbBurstBy(r, o.orbAt - 0.01, o.orbAt + 0.01) : [];
        if (JSON.stringify(ob) !== JSON.stringify(want)) say(pull, 'root', 'the orb root cause names ' + (ob.join(', ') || 'no one') + ', but the one rule at ' + E.fmtT(o.orbAt || 0) + ' gives ' + (want.join(', ') || 'no one'));
        if (!ob.every((n) => o.line.includes(n))) say(pull, 'root', 'the orb root cause\'s carriers (' + ob.join(', ') + ') aren\'t in its line'); }
      if (!o.early && o.chain && o.chain[0] && o.chain[0].t > o.t + 0.5) say(pull, 'root', 'the root cause (' + o.name + ', ' + E.fmtT(o.chain[0].t) + ') comes after the moment the pull was lost (' + E.fmtT(o.t) + ', ' + o.why + ')');
      const rm = (o.marks || []).find((m) => m.k === 'root'), ch = CHT.wipeChain(r), items = (ch && ch.items) || [], key = (x) => (x.mech === 'Death' ? x.txt : x.mech);
      const named = (x) => { const m = /^(\S+) died to /.exec(x.txt || ''); return m ? o.line.includes(m[1]) : !!x.mech && o.line.toLowerCase().includes(String(x.mech).toLowerCase()); }, near = rm ? items.filter((x) => Math.abs(Math.floor(x.t) - Math.floor(rm.t)) <= 3 && named(x)) : [];
      if (near.length && !near.some((x) => CHT.chainTitleFits(key(x), o.name))) say(pull, 'root', 'How it went has ' + near.map((x) => '"' + x.txt + '"').join(', ') + ' at the root cause\'s moment, but none can take its tag (' + o.name + ')'); } }
  { const f0 = rep.r.fights.find((x) => x.id === +fight); if (f0) { try { const gk = code + '|' + it.id + '|' + it.diffId, l = TIER_T.get(gk) || [], q = SITE.aphOf([r]).p[0], pc = TSITE.pullCauseOf(r);
      l.push({ it, hp: q ? q[1] : null, ak: pc ? pc.k : '', sum: TSITE.tierSumOf(r), row: [code, f0.id, rep.r.startTime + f0.startTime, f0.kill ? 1 : 0, f0.fightPercentage != null ? f0.fightPercentage : null, f0.bossPercentage != null ? f0.bossPercentage : null, f0.lastPhase || 0, f0.lastPhaseIsIntermission ? 1 : 0, Math.round((f0.endTime - f0.startTime) / 1000)] }); TIER_T.set(gk, l); }
    catch (e) { say(pull, 'tier', 'the Whole tier\'s line crashed: ' + e.message); } } }
  // 2b. How it went: a row's title is a mechanic its own sentence names (or one of its family), never just the nearest mistake in time
  if (!it.kill) { let ch = null; try { ch = CHT.wipeChain(r); } catch (e) { say(pull, 'title', 'the wipe chain crashed: ' + e.message); }
    const near = (r.mistakes || []).filter((q) => q.mechanic !== 'Death');
    for (const x of (ch && ch.items) || []) { if (x.mech === 'Death') continue; clean(pull, 'How it went', x.txt);
      const pick = near.filter((q) => Math.abs((q.from != null ? q.from : q.t) - x.t) <= 3 && CHT.chainTitleFits(q.mechanic, x.txt)).sort((a, b) => Math.abs(a.t - x.t) - Math.abs(b.t - x.t))[0], ttl = pick ? pick.mechanic : x.mech;
      if (!CHT.chainTitleFits(ttl, x.txt)) say(pull, 'title', 'How it went at ' + E.fmtT(x.t) + ' is titled "' + ttl + '" but its sentence says "' + x.txt + '"'); } }
  for (const q of r.mistakes || []) { clean(pull, 'mistake ' + q.mechanic, q.detail); clean(pull, 'mistake ' + q.mechanic + ' fix', q.fix); }
  for (const q of r.insights || []) clean(pull, 'insight', q.text);
  // 3. deaths: each counted once
  const seen = new Set(); for (const d of r.deaths || []) { const k = d.player + '@' + Math.round(d.t); if (seen.has(k)) say(pull, 'count', d.player + ' died twice at ' + E.fmtT(d.t) + ' (a death counted twice)'); seen.add(k); }
  if (oldCopy) for (let i = P.length - 1; i >= P0; i--) if (/Spell undefined/.test(P[i].msg)) P.splice(i, 1);
  return true;
}

// 4. the page's own code reads one number (the banner, the pull picker, the coach and Debriefing's lines)
const MUST = [['the Why we wiped facts line (the phase at the wipe call, from the timeline)', "(end && T(end.querySelector('.dbt-chp'))) || '') || phw", 'SH'], ['the banner', "bossAtV(nowV)"], ['the pull picker', "'Wipe, ' + bossAtV(pc)"], ['the coach line', "'We wiped ' + dbfPre(at0) + at0"], ["Debriefing's raid lead line", 'dbfPre(dbfAt(nowLab))']];
for (const [k, s, f] of MUST) if (!(f === 'SH' ? H.SH : UI).includes(s)) say('the page code', 'health', k + ' no longer uses the one health number (expected `' + s + '` in src/ui.js)');
// (Why we wiped's icon and Next time (Nov 5, Flex: "wrong icons"): each root cause's icon is its own mechanic's spell, and its Next time is its own;
//  the page puts them on the heading, and the All pulls card never lends another row's icon)
for (const [k, o] of Object.entries(E.RC_CAT)) { const fam = (s) => CHT.mechFams(s); if (o.sp) { const a = fam(o.sp[1]), b = fam(o.nm), same = [...a].some((x) => b.has(x));
    if (!a.size || !b.size || !same) say('the page code', 'icon', o.nm + "'s icon is " + o.sp[1] + ' (' + o.sp[0] + '), not its own mechanic'); } else if (!/^(dps|dead|reset)$/.test(k)) say('the page code', 'icon', o.nm + ' has no icon spell of its own');
  if (k !== 'reset') { const nx = RCX.RC_NEXT[k]; if (!nx) say('the page code', 'next', o.nm + ' has no Next time'); else { clean('the page code', 'Next time for ' + o.nm, nx); if (o.sp && !CHT.chainTitleFits(o.sp[1], nx) && !CHT.chainTitleFits(o.nm, nx)) say('the page code', 'next', 'Next time for ' + o.nm + ' is about something else: "' + nx + '"'); } } }
for (const s of ["window.spellIcon(RT.sp ? RT.sp[0] : 0", "var nxt = window.rcNext ? window.rcNext(RT.cat, RT) : ''", 'only lends its nickname']) if (!H.SH.includes(s)) say('the page code', 'icon', 'Why we wiped or the All pulls card borrows icons again (expected "' + s + '" in src/shell.html)');
// (How it went: the title rule itself, on Flex's Nov 5 screenshot and the cases it must keep; and the page uses it)
for (const [t, s, ok] of [['Fourinches died to Dreadmarch', 'Too many dead', true], ['Schooty died to Axegrinder', 'Wail of Terror (Kick)', false], ['Wail of Terror', "Flëxørçïst's ghost touched Schooty's ghost, causing Malevolent Resonance", false], ['Manifestation of Dread', "Flëxørçïst's ghost touched Schooty's ghost, causing Malevolent Resonance", true],
  ['Soul Sever', 'Flëxørçïst died to Malevolent Resonance: ghosts touched each other', false], ['Death', 'Schooty died to Axegrinder', true], ['Coalesced Venom', 'Komo died to Venom Rupture: too many orb stacks at once', true],
  ['Spiteful Soulcoiler', 'Larryg died to Retaliatory Malice: adds were left alive', true], ['Wail of Terror', "Wail of Terror wasn't kicked, and feared players lost sight of their ghosts", true]])
  if (CHT.chainTitleFits(t, s) !== ok) say('the page code', 'title', 'the title rule says "' + t + '" ' + (ok ? 'doesn\'t fit' : 'fits') + ' "' + s + '"');
for (const s of ["else if (isO) (rc.orbBy || []).forEach((v) => add('Carried the orb that burst', r, v));", "if (isOrb && E.orbBurstBy) E.orbBurstBy(r, o.t - 3, o.t + 10)"]) if (!UI.includes(s)) say('the page code', 'orb', 'All pulls\' Carried the orb that burst no longer uses the one carrier rule (expected "' + s + '" in src/ui.js)');
if (UI.includes("w[1].split(', ').forEach((v) => add('Carried the orb that burst'")) say('the page code', 'orb', 'All pulls reads the Venom Rupture mistake\'s own carriers again');
for (const s of ['if (it && !chainTitleFits(m.m, it.txt)) return;', 'if (b && !chainTitleFits(b.m.m, it.txt)) b = null;']) if (!UI.includes(s)) say('the page code', 'title', 'How it went no longer checks its titles (expected "' + s + '" in src/ui.js)');
for (const s of ["KR = [].map.call(w.querySelectorAll('.dbt-chn > .dbt-chr:not(.end)'), function (r) { return pk(r, '.dbt-cht'); })", "function (w) { window.__ahDedupe(w); }", "rows = function () { return [].slice.call(w.querySelectorAll('.dbt-chn > .dbt-chr:not(.end)')); }"]) if (!H.SH.includes(s)) say('the page code', 'repeat', 'Also hurt can repeat How it went again (expected "' + s + '" in src/shell.html)');
for (const s of ["'Wipe in ' + pg.label", "% of the fight done'"]) if (UI.includes(s)) say('the page code', 'health', 'src/ui.js still shows a second health number: `' + s + '`');

const t0 = Date.now(); let n = 0;
if (!fs.existsSync(LIB) && !DIRS.length) { console.log('Contradiction check: skipped (no log library at ' + LIB + ')'); process.exit(0); }
for (const k of keys) { try { if (checkPull(k)) n++; } catch (e) { say(k, 'crash', 'the check crashed: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); } }
// 5. the All pulls focus band names row #1 of What wiped us most (by root cause), or its one sentence says what came first, true to the chains
for (const [code, rcs] of NIGHT_RC) { const g = new Map(); for (const o of rcs) { const l = g.get(o.cat) || []; l.push(o); g.set(o.cat, l); }
  const rows = [...g].sort((a, b) => b[1].length - a[1].length).map(([c, l]) => ({ nm: E.RC_CAT[c].nm, w: l.length, rc: c, fix: RCX.RC_FIX[c] || '', first: RCX.rcFirstLine(l), l })), f = SHELL.nsmFocusOf(rows), night = 'night ' + code + ' (All pulls)';
  if (!rows.length) continue; if (!f || f.nm !== rows[0].nm.replace(/ \([^)]*\)$/, '')) say(night, 'focus', 'the focus band names ' + (f ? f.nm : 'nothing') + ', but What wiped us most has ' + rows[0].nm + ' first');
  if (!f || !f.fix) say(night, 'focus', rows[0].nm + ' has no fix to focus on');
  if (f && f.first) { const m = /^In (\d+) of them, (.+) came first\.$/.exec(f.first), cat = m && Object.keys(RCX.RC_FIRST).find((k) => RCX.RC_FIRST[k] === m[2]); const n = cat ? rows[0].l.filter((o) => o.chain && o.chain[0] && o.chain[0].cat === cat).length : -1;
    if (!m || n !== +m[1]) say(night, 'focus', '"' + f.first + '" doesn\'t match the chains (' + n + ' start with it)'); }
  clean(night, 'focus band', (f ? f.fix + ' ' + f.nm + ' wiped us most. ' + f.first : '')); }
// 6. the Whole tier reads each night as its All pulls card does: one night, the same best boss health, and the same count for every cause
for (const [gk, l] of TIER_T) { const it0 = l[0].it, rows = l.slice().sort((a, b) => a.row[2] - b.row[2]), seen = new Map(rows.map((x) => [x.row[0] + ':' + x.row[1], x.sum])), night = 'night ' + gk.split('|')[0] + ', ' + it0.boss + ' ' + it0.diff + ' (Whole tier)';
  let M = null; try { M = TSITE.tierModel({ pulls: rows.map((x) => x.row), causes: {} }, it0, seen); } catch (e) { say(night, 'tier', 'the Whole tier crashed: ' + e.message); continue; }
  if (M.N.length !== 1) { say(night, 'tier', 'the Whole tier splits this one night into ' + M.N.length + ' nights'); continue; }
  const W = rows.filter((x) => !x.it.kill && x.hp != null), b0 = W.length ? Math.min(...W.map((x) => x.hp)) : null, b1 = M.N[0].best ? M.N[0].best.hp : null;
  if (b0 !== b1) say(night, 'tier', 'the Whole tier says the night\'s best was ' + b1 + '%, All pulls says ' + b0 + '%');
  const want = new Map(); for (const x of rows) if (!x.it.kill && x.ak) want.set(x.ak, (want.get(x.ak) || 0) + 1);
  const got = new Map(M.CR.map((c) => [c.k, c.per[0]]));
  for (const [k, n] of want) if (got.get(k) !== n) say(night, 'tier', k + ': All pulls counts ' + n + ' wipes, the Whole tier ' + (got.get(k) || 0));
  for (const [k, n] of got) if (!want.has(k)) say(night, 'tier', k + ': the Whole tier counts ' + n + ' wipes that All pulls doesn\'t');
  for (const c of M.CR) clean(night, 'What wiped us most', c.nm); }
const by = new Map(); for (const x of P) { const a = by.get(x.pull) || []; a.push(x); by.set(x.pull, a); }
// (the same problem on many pulls prints once per pull, at most 12 lines a pull)
for (const [pull, l] of by) { console.log('\n' + pull + ':'); const u = [...new Set(l.map((x) => '  [' + x.kind + '] ' + x.msg))]; u.slice(0, 12).forEach((x) => console.log(x)); if (u.length > 12) console.log('  ... and ' + (u.length - 12) + ' more'); }
const total = new Set(P.map((x) => x.pull + x.msg)).size;
console.log('\nContradiction check: ' + n + ' pull(s) in ' + Math.round((Date.now() - t0) / 1000) + ' s (' + TIER_T.size + ' night(s) of a boss on the Whole tier), ' + (total ? total + ' problem(s)' : 'no contradictions'));
process.exit(total ? 1 : 0);
