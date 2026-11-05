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
const SITE = H.site(['esc', 'lpAnd', 'andList', 'plural', 'NKG', 'NK346', 'NK283', 'nkWord283', 'PROGRESS', 'phSize', 'phShare', 'encLeft', 'shortBoss', 'bossAtV', 'progressOf', 'wclProg', 'pullProg', 'pullPct', 'pullLabel', 'pullShort', 'dbfAt', 'dbfPre', 'cellTxt', 'rowSay', 'rowText', 'cHtml']);

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
  [/\b([A-Za-z]{3,})\s+\1\b/i, 'a doubled word']];
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
  for (const q of r.mistakes || []) { clean(pull, 'mistake ' + q.mechanic, q.detail); clean(pull, 'mistake ' + q.mechanic + ' fix', q.fix); }
  for (const q of r.insights || []) clean(pull, 'insight', q.text);
  // 3. deaths: each counted once
  const seen = new Set(); for (const d of r.deaths || []) { const k = d.player + '@' + Math.round(d.t); if (seen.has(k)) say(pull, 'count', d.player + ' died twice at ' + E.fmtT(d.t) + ' (a death counted twice)'); seen.add(k); }
  if (oldCopy) for (let i = P.length - 1; i >= P0; i--) if (/Spell undefined/.test(P[i].msg)) P.splice(i, 1);
  return true;
}

// 4. the page's own code reads one number (the banner, the pull picker, the coach and Debriefing's lines)
const MUST = [['the banner', "bossAtV(nowV)"], ['the pull picker', "'Wipe, ' + bossAtV(pc)"], ['the coach line', "'We wiped ' + dbfPre(at0) + at0"], ["Debriefing's raid lead line", 'dbfPre(dbfAt(nowLab))']];
for (const [k, s] of MUST) if (!UI.includes(s)) say('the page code', 'health', k + ' no longer uses the one health number (expected `' + s + '` in src/ui.js)');
for (const s of ["'Wipe in ' + pg.label", "% of the fight done'"]) if (UI.includes(s)) say('the page code', 'health', 'src/ui.js still shows a second health number: `' + s + '`');

const t0 = Date.now(); let n = 0;
if (!fs.existsSync(LIB) && !DIRS.length) { console.log('Contradiction check: skipped (no log library at ' + LIB + ')'); process.exit(0); }
for (const k of keys) { try { if (checkPull(k)) n++; } catch (e) { say(k, 'crash', 'the check crashed: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); } }
const by = new Map(); for (const x of P) { const a = by.get(x.pull) || []; a.push(x); by.set(x.pull, a); }
// (the same problem on many pulls prints once per pull, at most 12 lines a pull)
for (const [pull, l] of by) { console.log('\n' + pull + ':'); const u = [...new Set(l.map((x) => '  [' + x.kind + '] ' + x.msg))]; u.slice(0, 12).forEach((x) => console.log(x)); if (u.length > 12) console.log('  ... and ' + (u.length - 12) + ' more'); }
const total = new Set(P.map((x) => x.pull + x.msg)).size;
console.log('\nContradiction check: ' + n + ' pull(s) in ' + Math.round((Date.now() - t0) / 1000) + ' s, ' + (total ? total + ' problem(s)' : 'no contradictions'));
process.exit(total ? 1 : 0);
