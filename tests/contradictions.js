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
// (Nov 12: and Wolfthorn's Oct 22 Coiled Altar night, where Summary and the Report card disagreed about one player's mechanics)
// (Nov 13: and Wolfthorn's Nov 12 Ula'tek Mythic night, 13 wipes in phase 1 read against the raw log (tests/ulatek-check.js))
const NIGHTS = ['HWFBkCyc6JNazQrK', '9DRWhKnZbHtQgf4a', 'xH3JNdbQ74wBDPAv', 'bcA9kw3mxHKzr4fR', 'agt6jMTyZBYvVzAP', 'Gax3AkbyFRXmdrgQ'];
/* (Nov 13: the whole Nov 11 and Nov 12 nights are in the library now; --all kept every saved pull in memory and ran out at 8 GB. A night listed here gives --all only these fights;
   the named guards (the death proof rule's deaths, Soul Sever's root) read their own pulls alone) */
const ONLY = { agt6jMTyZBYvVzAP: [15, 16, 18, 20], Gax3AkbyFRXmdrgQ: [7, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23] }; /* (Nov 12: the proof rule's Coiled Altar pull and the 13 Ula'tek wipes) */
// (Nov 11's Coiled Altar: only its three disputed orb pulls are saved (fights 15, 16, 20 = pulls 14, 15, 19), checked with --all, whose carrier
// the raw log shows at the burst (Flex, Nov 12: "yep it was shock that i know for sure was missing"))
const ORB_WANT = { 'agt6jMTyZBYvVzAP:15': 'Kargaryen', 'agt6jMTyZBYvVzAP:16': 'Shockabunga', 'agt6jMTyZBYvVzAP:18': '', 'agt6jMTyZBYvVzAP:20': 'Volkovod' }; /* (fight 18 = pull 17: feared onto the orbs by an unkicked Wail of Terror, nobody's orb, the missed kick's wipe (Flex, Nov 12)) */
const QUICK = ['HWFBkCyc6JNazQrK:10', 'HWFBkCyc6JNazQrK:14', '9DRWhKnZbHtQgf4a:43', '9DRWhKnZbHtQgf4a:36', '9DRWhKnZbHtQgf4a:37', 'xH3JNdbQ74wBDPAv:53', 'bcA9kw3mxHKzr4fR:28', 'Gax3AkbyFRXmdrgQ:7', 'Gax3AkbyFRXmdrgQ:11', 'Gax3AkbyFRXmdrgQ:17', 'Gax3AkbyFRXmdrgQ:22']; /* (Nov 13: Ula'tek pulls 1, 7 and 12: the beam taken by damage dealers, the Wretch held by the tail, five Vipers from carriers touching) */ /* (Nov 13: the proof rule's deaths, in every build: Flex's fragments in an axe here; Raiyvenz low with defensives ready is read by deaths-check.js itself) */

const E = require(path.join(SRC, 'engine.js')), W = require(path.join(SRC, 'wcl.js'));

// ---- the site's own helpers, taken out of ui.js by name (so the check reads exactly what the page shows) ----
const H = require('./site-helpers.js'), UI = H.UI;
// (the All pulls card's line about a pull, from shell.html)
const SHELL = require('vm').runInNewContext(H.grab('phN', H.SH) + '\n' + H.grab('story', H.SH) + '\n' + H.grab('nsmFocusOf', H.SH) + '\n({ story, nsmFocusOf })');
const RCX = require('vm').runInNewContext(H.grab('RC_FIX') + '\n' + H.grab('RC_NEXT') + '\n' + H.grab('RC_FIRST') + '\n' + H.grab('rcFirstLine') + '\n({ RC_FIX, RC_NEXT, RC_FIRST, rcFirstLine })');
const NIGHT_R = new Map(); const NIGHT_RC = new Map(); /* (each test night's Coiled Altar root causes, for the All pulls focus band check) */
/* (the Whole tier (Nov 5): its own numbers for a night, read with the page's code; the cut at the wipe call and the killing-blow verdict stand
   in as "none" on both sides, so the tier and All pulls are compared on the same causes) */
const TSITE = H.site(['deathHit', 'deathHitId', 'esc', 'plural', 'NKG', 'NK346', 'NK283', 'nkWord283', 'PROGRESS', 'phSize', 'phShare', 'encLeft', 'shortBoss', 'bossAtV', 'progressOf', 'wclProg', 'pullProg', 'pullPct', 'cHtml', 'aphOf', 'nightOf', 'tierDay', 'TIER_CC', 'tierModel', 'lc0', 'whyKey', 'dbfCap', 'dbfReset', 'wipeRoot', 'pullCauseOf', 'tierVer', 'tierSumOf'], { cutInfo: () => null, WROOT: new WeakMap(), whyWiped: () => null, mech: (m) => m, RD: null });
const TIER_T = new Map(); /* (each test night's pulls of a boss: the tier's line, All pulls' cause and health) */
/* (How it went's titles (Nov 5): the page's own rule and wipe chain; the cut at the wipe call stands in as "none") */
const WMS = H.site(['WIPE_MECH', 'wipeMech']); /* (the page's own wipe-mechanic call, for the Why we wiped check) */
const CHT = H.site(['deathHit', 'deathHitId', 'MECH_FAM', 'mechFams', 'chainTitleFits', 'deathBrief', 'collapseFrom', 'wipeChain'], { deathVerdict: () => null, cutInfo: () => null, cutT: () => Infinity, keptMistakes: (r) => r.mistakes || [], keptDeaths: (r) => r.deaths || [] });
const SITE = H.site(['deathHit', 'deathHitId', 'esc', 'lpAnd', 'andList', 'plural', 'NKG', 'NK346', 'NK283', 'nkWord283', 'PROGRESS', 'phSize', 'phShare', 'encLeft', 'shortBoss', 'bossAtV', 'progressOf', 'wclProg', 'pullProg', 'pullPct', 'pullLabel', 'pullShort', 'dbfAt', 'dbfPre', 'cellTxt', 'rowSay', 'rowText', 'cHtml', 'aphOf']);

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
  const add = (dir, any) => { if (!fs.existsSync(dir)) return; for (const f of fs.readdirSync(dir)) { const m = /^([A-Za-z0-9]{16})_(\d+)\.json$/.exec(f); if (m && (any || (NIGHTS.includes(m[1]) && (!ONLY[m[1]] || ONLY[m[1]].includes(+m[2]))))) keys.push(m[1] + ':' + m[2]); } };
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
  const r = E.analyze(it, txt, {}); if (!r.item) r.item = it; SITE.CACHE.set(it, r); { const l = NIGHT_R.get(code) || []; l.push(r); NIGHT_R.set(code, l); } /* (Nov 12: a night's pulls, for the one-player checks (9 to 13)) */
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
      /* (Nov 12: the carriers are read at the burst (r.orbWaves), not at the first death, and the root cause may name just the one whose ring touched:
         it must name someone who held a purple then, and nobody who didn't) */
      if (o.cat === 'orbs' && o.chain[0] && o.chain[0].cat === 'orbs') { const fv = vr(r.deaths.slice().sort((a, b) => a.t - b.t)), wv = fv ? ((r.orbWaves || []).filter((x) => x <= fv.t + 0.2 && fv.t - x <= 6).sort((a, b) => b - a)[0]) : null, tc = wv != null ? wv : fv ? fv.t : null, held = tc != null ? at(tc) : [];
        if (held.length && !held.some((n) => o.short.includes(n) && o.line.includes(n))) say(pull, 'root', 'the orb root cause names none of the purple carriers at the burst (' + held.join(', ') + '): "' + o.short + '"');
        for (const n of o.orbBy || []) if (!held.includes(n)) say(pull, 'root', 'the orb root cause names ' + n + ', who held no purple at the burst (' + E.fmtT(tc || 0) + ')'); }
      if (o.reset && !Array.isArray(o.reset.who)) say(pull, 'root', 'the reset doesn\'t say whose orb it was');
      /* (Nov 5, Flex: individual mistakes never point at one person; a single personal mistake is the cause only when it hit the raid at once) */
      if (o.cat === 'dead') { if ((o.marks || []).some((m) => m.k === 'root')) say(pull, 'root', 'Too many individual mistakes tags one death as the root cause');
        const nD = (r.deaths || []).filter((d) => d.t <= o.t + 0.5).length, nM = (o.most || []).reduce((s, m) => s + m.n, 0); if (nM > nD) say(pull, 'count', 'what added up counts ' + nM + ' deaths, but only ' + nD + ' died by ' + E.fmtT(o.t)); }
      /* (Nov 12, Flex: "Yes, name it": a worn-down pull names the mechanic behind half or more of its deaths; never one without that majority) */
      if (/^(axes|pools|frontal|ghosts|mc|bombs|orbs)$/.test(o.cat) && !/^(a wave|mass mind control)$/.test(o.why) && !o.early) { const fm = (c) => (c === 'ghosts' ? 'mc' : c), pre = (r.deaths || []).filter((d) => d.t <= o.t + 0.5), mine = pre.filter((d) => fm(E.rcCat(d.ability || d.killer)) === fm(o.cat)).length;
        if (!o.worn || mine * 2 < pre.length - 1) say(pull, 'root', o.name + ' is the one cause of a pull worn down by separate deaths (' + o.why + ')' + (o.worn ? ', but only ' + mine + ' of ' + pre.length + ' deaths were it' : '')); }
      if (o.cat === 'adds' && (o.bombBy || []).some((n) => !o.short.includes(n))) say(pull, 'root', 'the add wipe doesn\'t name whose Gloombomb missed');
      /* (Main, Nov 5: All pulls' "Carried the orb that burst" lists the root cause's own carriers, the same rule as the sentence) */
      if (o.cat === 'orbs') { const ob = o.orbBy || [], want = o.orbAt != null ? E.orbBurstBy(r, o.orbAt - 0.01, o.orbAt + 6.5) : []; /* (Nov 12: orbAt is the burst; its first Venom Rupture death can come a few seconds later) */
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
  /* (Nov 6, Flex: "its saying the wipe happened across p1, p2 and p3": How it went is the collapse; "its also not listing a shield not being
     broken as a wipe reason?": a shield that held in the collapse is one of its steps) */
  { const ch3 = !it.kill ? CHT.wipeChain(r) : null; if (ch3 && ch3.items) { const endT = r.duration || 0;
      for (const x of ch3.items) if (x.t < ch3.from - 0.5 || x.t < endT - 240) say(pull, 'collapse', 'How it went has a step at ' + E.fmtT(x.t) + ', before the collapse (' + E.fmtT(ch3.from) + ')');
      for (const q of r.mistakes || []) if (/^Eternal Nightfall finished casting/.test(q.detail || '') && q.t - 17 >= ch3.from && q.t - 17 <= endT + 0.05 && !ch3.items.some((x) => /eternal nightfall/i.test(x.mech + ' ' + x.txt))) say(pull, 'collapse', 'Eternal Nightfall finished casting at ' + E.fmtT(q.t) + ' in the collapse, but How it went leaves it out'); } }
  /* (Nov 6, Flex picked "Other bosses' wipe logic": every boss's wipe gets a root cause, never one named Melee) */
  if (E.rootCause && it.boss !== 'The Coiled Altar' && !it.kill && (r.deaths || []).length >= 4) { const og = E.rootCause(r); if (!og || !og.line) say(pull, 'root', 'no root cause for this wipe'); else if (/^(melee|something)$/i.test(og.name || '')) say(pull, 'root', 'the root cause is named ' + og.name);
    /* (Nov 6, Main: "Root cause: Caustic Globule" over "Most of the deaths were Eternal Venom (2 of 4)": the line under a root explains that root) */ else { const mw = /^Most of the deaths were (.+?) \(/.exec(og.short || ''); if (mw && mw[1].toLowerCase() !== String(og.name).toLowerCase()) say(pull, 'root', 'the root cause is ' + og.name + ', but the line under it says most deaths were ' + mw[1]); } }
  /* (Nov 6, Flex: an axe dropped on the raid is its target's mistake, and nobody else's hit or death from it counts) */
  for (const a of r.axeOnRaid || []) { if (!(r.mistakes || []).some((m) => String(m.player).split('-')[0] === a.by && /on the raid/.test(m.detail || ''))) say(pull, 'guillotine', a.by + ' dropped the ' + a.sp + ' on the raid, but has no mistake for it');
    const lose = (r.mistakes || []).filter((m) => m.player !== 'Raid' && String(m.player).split('-')[0] !== a.by && m.t >= a.t - 0.5 && m.t <= a.end && /^(widow's kiss|death's embrace)$/i.test(m.mechanic) && !m.others); if (lose.length) say(pull, 'guillotine', lose.length + ' players are blamed for the eruption of an axe ' + a.by + ' dropped on the raid'); }
  /* (Nov 6 read-through: Spirit Erasure is its own cause, never "Too many individual mistakes") */
  /* (Nov 13, pass 3: a tank's missed Stone Breaker circles: the first miss whose hit killed the wave is named with its own count (Twin Fangs pull 27: circle 2 killed 7; a wider window read circle 1, which killed none)) */
  /* (Nov 13, Main, after his death audit: a non-tank in the tank's Caustic Deluge beam had no row at all. Wolfthorn's Twin Fangs kill: Flex took 749k and Shockabunga 625k.
     One hit is never coloured: even top kills' non-tanks take it about twice a kill) */
  if (key === '9DRWhKnZbHtQgf4a:37') { const g = ((((r.module && r.module.sections) || []).find((x) => x.id === 'avoid') || {}).groups || []).find((x) => /^Caustic Deluge/.test(x.title || '')), rows = (g && g.rows) || [];
    const who = (n) => rows.find((x) => String((x[0] || {}).p || '').split('-')[0] === n);
    if (!g || !who('Flëxørçïst') || !who('Shockabunga')) say(pull, 'avoid', 'the tank beam (Caustic Deluge) row for non-tanks is gone: Flex and Shockabunga each stood in it once on this kill');
    else if (rows.some((x) => /^1 hit/.test((x[1] || {}).txt || '') && (x[1].bad || x[1].warn))) say(pull, 'avoid', 'one Caustic Deluge hit is coloured: one hit is never amber or red'); }
  if (key === '9DRWhKnZbHtQgf4a:34' && E.rootCause) { const o9 = E.rootCause(r, { cut: 350, why: 'half' }); if (!o9 || !/Tyralien missed Stone Breaker circle 2, and it killed 7 players/.test(o9.short || '')) say(pull, 'root', 'Twin Fangs pull 27 no longer reads "Tyralien missed Stone Breaker circle 2, and it killed 7 players": "' + (o9 && o9.short) + '"'); }
  /* (Nov 12, Flex: "this section is still wildly innacurate ... in terms of what caused the wipe at least": a wipe called on a mechanic no kill survived (the
     page's own wipeMech) has that mechanic in Why we wiped, or the missed kick behind it; Nov 11 pull 8 read "Too many individual mistakes" for a short soak) */
  if (E.rootCause && it.boss === 'The Coiled Altar' && !it.kill) { const wm = WMS.wipeMech(r), mc = wm ? (/guillotine/i.test(wm.n) ? 'guil' : /coalesced venom/i.test(wm.n) ? 'orbs' : /eternal nightfall/i.test(wm.n) ? 'shield' : null) : null;
    if (mc && (r.deaths || []).filter((d) => d.t < wm.t - 10).length < 3 /* (3 or more dead well before it: the pull may have been called first, on the deaths) */) { const o7 = E.rootCause(r, { cut: wm.end, why: 'mech', at: wm.t, mn: wm.n, ms: wm.s }); if (o7 && !o7.early && o7.cat !== 'reset' && o7.cat !== 'kick' && (o7.cat === 'dead' || (!(o7.chain || []).some((c) => c.cat === mc) && !(o7.also || []).some((a) => a.cat === mc)))) say(pull, 'root', 'a wipe called on ' + wm.n + ' at ' + E.fmtT(wm.t) + ' reads "' + o7.name + '" in Why we wiped, with no ' + wm.n + ' in its story'); } }
  if (E.rootCause && it.boss === 'The Coiled Altar' && !it.kill) { const o6 = E.rootCause(r), se = (r.deaths || []).filter((d) => /^spirit erasure$/i.test(d.ability || '')).length; if (o6 && o6.cat === 'dead' && se >= 3 && se >= (r.deaths || []).length / 2) say(pull, 'root', 'most deaths were Spirit Erasure, but the root cause says too many individual mistakes'); }
  /* (Nov 5, Flex: a mind-controlled fall says it fell; an orb collision says whose orbs) */
  { const ch2 = !it.kill ? CHT.wipeChain(r) : null; for (const x of (ch2 && ch2.items) || []) { const d = x.mech === 'Death' && (r.deaths || []).find((y) => Math.abs(y.t - x.t) < 0.05 && x.txt.startsWith(String(y.player).split('-')[0])); if (d && d.fell && !/ was mind controlled off the edge(:| with)/.test(x.txt)) say(pull, 'text', 'How it went says "' + x.txt + '", but they fell off the platform while mind controlled'); }
    for (const s of (m && m.sections) || []) for (const row of rowsOf(s)) for (const c of row) if (c && c.txt === 'orbs collided' && !/purple orb/.test(c.say || '')) say(pull, 'text', s.title + ': an orb collision doesn\'t say whose orbs'); }
  for (const q of r.mistakes || []) { clean(pull, 'mistake ' + q.mechanic, q.detail); clean(pull, 'mistake ' + q.mechanic + ' fix', q.fix); }
  for (const q of r.insights || []) clean(pull, 'insight', q.text);
  // 3. deaths: each counted once
  const seen = new Set(); for (const d of r.deaths || []) { const k = d.player + '@' + Math.round(d.t); if (seen.has(k)) say(pull, 'count', d.player + ' died twice at ' + E.fmtT(d.t) + ' (a death counted twice)'); seen.add(k); }
  // whose purple orb burst: the one carrier the raw log shows at the burst (ORB_WANT)
  if (ORB_WANT[key] != null && E.orbBurstBy) { const by = E.orbBurstBy(r, 0, 1e9).map((n) => String(n).split('-')[0]); if (!ORB_WANT[key] ? by.length : (by.length !== 1 || by[0] !== ORB_WANT[key])) say(pull, 'wipes', 'whose purple orb burst: the site says ' + (by.join(' or ') || 'nobody') + ', the log shows ' + (ORB_WANT[key] || 'nobody (feared by an unkicked Wail of Terror)') + ' (Flex, Nov 12)'); if (!ORB_WANT[key]) { const rc = E.rootCause(r); if (!rc || rc.cat !== 'kick') say(pull, 'wipes', 'a raid feared onto the orbs by an unkicked Wail of Terror reads as ' + (rc ? rc.cat : 'no cause') + ', not the missed kick (Flex, Nov 12)'); } }
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
/* (Nov 5, Flex: the Report card's deaths are judged as Debriefing judges them: no mass wipe deaths, nothing after the call, their own mistakes first) */
/* (Nov 12 and 13, Why we wiped passes 2 and 3: each rule's own line, named for the pull it came from) */
{ const ENG = require('fs').readFileSync(require('path').join(SRC, 'engine.js'), 'utf8');
  for (const [where, s0, what] of [[ENG, "if (kF && nF >= Math.max(2, 5 - sk.n)) { cat = 'kick'", 'a Guillotine soak under an unkicked Wail of Terror\'s fear is no longer the missed kick\'s wipe (Nov 11 pull 13)'],
    [ENG, "/didn't taunt/i.test(q.detail || '') && q.t >= t0f - 3", 'a tank killed by Blighted Sever after a missed taunt no longer names the taunt (Nov 11 pull 1)'],
    [ENG, "(m.get('frontal') || 0) / n < 0.6", 'a burst of Sever deaths after the call is the collapse again (Nov 11 pull 5)'], [ENG, "top[0] !== 'frontal' /* (Sever deaths are each player's own", 'Sever deaths can be a worn-down pull\'s root again'],
    [ENG, "wAft = opts.why === 'mech' ? null : waveAfterCall(r, opts.cut);", 'the wave just after the call is Ula\'tek-only again (Nymrissa pull 3: the murlocs that reached the bubble)'],
    [ENG, "const hrWin = !!(hr && nH >= 1 && nH >= (top[1] || 0)", 'a player\'s own miss that hit the raid no longer beats a tied "Most of the deaths were X" (Twin Fangs pull 17)'],
    [ENG, "if (hw && hw !== causeM && !(causeM && causeM.player && causeM.player !== 'Raid' && causeM.mechanic === hw.mechanic))", 'a missed Stone Breaker circle whose hit killed the wave is no longer the cause (Twin Fangs pull 4 read Caustic Globule)'],
    [UI, "if (c === 'frontal' && o && /didn't taunt before ([^:]+):/i.test(o.short || '')) return 'Tanks: taunt before every '", 'a missed taunt gets "stay out of Sever" as its tip again (Nov 11 pull 1)'],
    [UI, "the root cause's own moment always has a row in How it went", 'How it went can lose the root cause\'s own moment again (Nov 11 pull 1: the missed taunt at 8:54)'],
    [UI, "const rFit = (k, s) => {", 'a row "fits" the root cause without a real match again (the tag landed on "died to Melee")'],
    [UI, "if ((m = /^(stunned|mind controlled|knocked back|rooted|silenced) by (.+)$/i.exec(s))) return ' while ' + m[1] + ' by ' + m[2];", 'a death row reads "because stunned by" again (Ula\'tek)'],
    [UI, "if (got >= Math.max(1, Math.ceil(n * 0.8))) { items.splice(i, 1); continue; }", 'a raid line that only counts the dead stays beside its death rows again ("because 1 player died to Frost Burst")'],
    [H.SH, "dW + ' by the call'", 'the header says "dead at the call" for every death up to the call again (Nov 11 pull 1 read "20 dead" on a half-the-raid call)'],
    [H.SH, "if (/^reset on purpose$/i.test(String(RT.name || ''))) return;", 'a reset tags a row Root cause again (Entombed Sentinels)'],
    [H.SH, "(strict ? named(r) : fits(key(r), rootTxt)", 'the Root cause tag can land on a row that doesn\'t name the cause again (Twin Fangs: "died to Toxic Fumes")']])
    if (!where.includes(s0)) say('the page code', 'root', what + ' (expected "' + s0.slice(0, 70) + '")'); }
for (const s of ["if (!v.counts || v.why === 'mass') continue; dAll++; if (v.on) deaths++;", "let late = false;", "P1c = after && !nearCall ? null : deathProof(r, d, { cc, axe: !!axD });", 'rcbDeathTip(x.deaths, x.dAll)']) if (!UI.includes(s)) say('the page code', 'deaths', 'the Report card counts deaths its own way again (expected "' + s + '" in src/ui.js)');
for (const s of ['the header counts every death up to the wipe call', 'if (Wk && Wk.deadAtCall && rep) nD = Wk.deadAtCall(rep', 'deadAtCall: deadAtCall,']) if (!UI.includes(s)) say('the page code', 'deaths', 'the replay header counts deaths its own way again (expected "' + s + '" in src/ui.js)'); /* (Nov 6, Main: "☠ 0 deaths" while 4 died) */ if (!H.SH.includes('if (rpD && Kd.deadAtCall) dn = Kd.deadAtCall(rpD);')) say('the page code', 'deaths', 'Why we wiped counts the dead at the call its own way again (expected deadAtCall in src/shell.html)'); /* (Nov 6, Main: the header and Why we wiped disagreed: one count, deadAtCall) */
/* (Nov 5, Flex: "wildly innaccurate in how its assessing the individual": someone else's mistake (m.others) never counts on the Report card's Mechanics rows; red is for a death or a habit) */
for (const s of ['if (m.others) { mo.set(m.mechanic', "J = mechJudge(t, q, nB, dd, !!(o && o.big)), st = J.st;", "for (const y of rcMechRows(a.per, p)) rows.mech.push", "if (k === 'mech') return rqcMechSec(l, t, row, a.n, o.secSc && o.secSc.mech);", 'mNight = n >= 4 ? mechNight(a.per, a.p)', "(d.fell ? ' ' + (d.fellWhy ||", "box._jumpTo(null, t, 2)", "' data-rqct=\"' + (+y.pt[n]).toFixed(1)"]) if (!UI.includes(s)) say('the page code', 'mechanics', 'the Report card\'s Mechanics rows judge players their own way again (expected "' + s + '" in src/ui.js)');
/* (Nov 6, the studio + Flex: "just want it considered when assessing mechanics": a Mechanics row is never red on one or two slips, nor when the best raids
   slip on it within 5 points as often, unless the player died to it; every mechanic of every boss with top numbers, 1 to 40 pulls) */
{ const MJ = H.site(['deathHit', 'deathHitId', 'TOP_MECH', 'topMechOf', 'mechJudge']); let nBad = 0;
  for (const [b, ds] of Object.entries(MJ.TOP_MECH)) for (const [d, v] of Object.entries(ds)) for (const k of Object.keys(v.m)) for (const role of ['tank', 'healer', 'dps']) { const t = MJ.topMechOf({ boss: b, diffId: +d }, k, role);
    for (let n = 1; n <= 40; n++) for (let q = 1; q <= n; q++) for (const big of [true, false]) { const J = MJ.mechJudge(t, q, n, 0, big); if (J.st === 'bad' && (q < 3 || 100 * q / n - t.f < 5) && nBad++ < 3) say('the page code', 'mechanics', b + ' ' + k + ' (' + role + '): red at ' + q + ' of ' + n + ' pulls, though the best raids slip on it ' + t.f + '% of the time'); } }
  if (MJ.mechJudge(null, 3, 10, 0, true).st !== 'n' || MJ.mechJudge(null, 2, 10, 1, true).st === 'bad' || MJ.mechJudge({ f: 30, d: 0 }, 3, 10, 0, true).st === 'bad' || MJ.mechJudge({ f: 0, d: 0 }, 2, 22, 1, true).st !== MJ.mechJudge({ f: 0, d: 0 }, 2, 22, 0, true).st) say('the page code', 'mechanics', 'mechJudge: red at the best raids\' level, or a death changes the mark (Nov 12, Main\'s death plan: a death costs once, in Staying alive)'); }
/* (Nov 6, Main: the checklist's Mechanics tile read "0 of 0" under "1 TO FIX · 15 CHECKED": the tile and the section count the same rows) */
{ const MS = H.site(['deathHit', 'deathHitId', 'rqcMechSec'], { esc: (x) => String(x) }), l = [{ s: 'bad', l: 'A' }, { s: 'w', l: 'B' }, { s: 'n', l: 'C' }, { s: 'ok', l: 'D' }, { s: 'ok', l: 'E', xo: 1 }, { s: 'na', l: 'F' }], h = MS.rqcMechSec(l, 'Mechanics', () => '', 5);
  if (!/data-ok="3" data-n="5"/.test(h) || !/>1 to fix · 1 a little behind · 5 checked</.test(h)) say('the page code', 'mechanics', 'the Mechanics section\'s counts don\'t match its rows: ' + (h.match(/data-ok="\d+" data-n="\d+"|\d+ to fix · \d+ checked/g) || []).join(' / '));
  if (!UI.includes('s.dataset.n != null ? [0, s.dataset.ok, s.dataset.n]')) say('the page code', 'mechanics', 'the checklist\'s Mechanics tile parses the header again, not the section\'s own counts'); }
/* (Nov 6, Main's screen of live: the checklist's tiles hold the same rows as their lists (Your toolkit moves into Performance first); a reset or
   short pull isn't compared with whole kills and says it was a reset) */
for (const s of ['try { rqcToolkitIn(g); }', "short0 = !it.kill && (dbfReset(it) || endT < 45)", "const tile = (k, lab, hiGood) => short0 ? num(lab, '<b>—</b>', 'Too short to compare')", "dbfReset(it) ? 'This pull was reset ' + ((it.duration || 0) < 10 ? 'right away'"]) if (!UI.includes(s)) say('the page code', 'numbers', 'a tile and its list, or a reset\'s comparison, disagree again (expected "' + s + '" in src/ui.js)');
/* (Nov 6, Main: Debriefing's Deaths tile read "0" next to "12 dead at the call": the tile's big number is every death up to the call, their own mistakes under it) */
{ const DS = H.site(['deathHit', 'deathHitId', 'fmtHalf', 'earlyEnd493', 'lastRaid493', 'trend493', 'deathList', 'deathsTile'], { oaBase: (n) => String(n || '').split('-')[0], RATE_BASE: {}, HIST: { mem: new Map() }, collapseFrom: () => 10, esc: (x) => String(x), plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), cutT: () => 10, deadAtCall: (r) => r.deaths.filter((d) => d.t <= 10.5).length, deathVerdict: (r, d) => ({ counts: d.t <= 10.5, on: !!d.own && d.t <= 10.5, w: d.own && d.t <= 10.5 ? 1 : 0 }), parseOf: () => null, parseCls: () => '' });
  const tr = { item: { boss: 'X', diffId: 16 }, duration: 30, deaths: [{ t: 1, own: 1, player: 'A' }, { t: 5, player: 'B' }, { t: 20, own: 1, player: 'C' }] }, h = DS.deathsTile((k, v, s) => k + '|' + v + '|' + s, [tr]);
  if (h !== 'Deaths|<b data-own="1">2</b>|1 on players') say('the page code', 'deaths', 'Debriefing\'s Deaths tile doesn\'t lead with the early deaths (before the collapse; Flex, Nov 9) (it reads "' + h + '", expected 2 with "1 on players")'); }
/* (Nov 6, Flex: someone dropping the Guillotine on the raid gets the blame, not the players it caught) */
if (!UI.includes("axD ? axD.by + ' dropped the ' + axD.sp + ' on the raid: not them'")) say('the page code', 'guillotine', 'deaths from an axe dropped on the raid are blamed on the players it caught again');
/* (Nov 6, Main: a "dropped the Guillotine on the raid" root's Next time tells the target where to take it) */
{ const NX = require('vm').runInNewContext(H.grab('RC_NEXT') + '\n' + H.grab('RC_NEXT_MC') + '\n' + H.grab('rcNextOf') + '\n({ rcNextOf })', { S: {}, gdzNextFor: () => '' });
  if (!/^Guillotine target: run the axe away from the raid/.test(NX.rcNextOf('guil', { line: 'Turkhan dropped the Guillotine on the raid → Widow\'s Kiss killed 6 (0:54).' }))) say('the page code', 'guillotine', 'a drop-on-the-raid root\'s Next time doesn\'t tell the target where to take the axe'); }
/* (Nov 6, Flex: "Wipe filter should also apply to all of the graphs tab": Graphs counts deaths up to the call + 0.5 s, like "N dead at the call") */
/* (and only deaths the one death rule counts: never the mass wipe at the end (Flex, Nov 6)) */ for (const s of ['d.guid === p.guid && d.t <= it.end + 0.5 && gbDeathOk(it.r, d))', 'd.t <= W1 + (PH ? 0.05 : 0.5) && gbDeathOk(r, d)))', 'const dl = (it.r.deaths || []).filter((d) => d.t <= it.end + 0.5 && gbDeathOk(it.r, d))', "return !!(v && v.on); } catch (e) { return false; } }"]) if (!UI.includes(s)) say('the page code', 'graphs', 'Graphs counts deaths its own way again, not as "dead at the call" (expected "' + s + '" in src/ui.js)');
/* (Nov 7, Flex: Debriefing's Why we wiped / How it went / Also hurt show only mechanics: no rotation or cooldown-use items, no raid-check rows) */
if (!UI.includes("(x.sev === 'bad' || x.sev === 'warn') && x.kind !== 'rot'; }), kill = !!cs.kill;") || UI.includes('<span class="dbt-rctag">Raid check</span>')) say('the page code', 'mechanics', 'Debriefing\'s mechanic sections show rotation or raid-check rows again');
if (!UI.includes("var M = moments(v, cs, cut).filter(function (m) { return !NOTMECH.test(") || !UI.includes("var NOTMECH = typeof DBT_NOTMECH !== 'undefined' ? DBT_NOTMECH : /^(power infusion|") ||!/power infusion/.test(String(require('vm').runInNewContext(H.grab('DBT_NOTMECH') + '; DBT_NOTMECH').source))) say('the page code', 'mechanics', 'Debriefing\'s moments let rotation or cooldown rows (Power Infusion) back in');
/* (Nov 7, Flex: healing a heal absorb ate counts as the healer's, like Warcraft Logs) */
if (!require('fs').readFileSync(require('path').join(SRC, 'engine.js'), 'utf8').includes('effH = eff + Math.max(0, num(f[s0 + 3]))')) say('the page code', 'healing', 'healing eaten by heal absorbs is left out of healers\' numbers again');
/* (Nov 7, Flex: Graphs' Buffs and Debuffs filters, and Deaths by mechanic) */
for (const s of ["auOk('b', x.name)", "auTool('d', DBKS)", "k === 'death' ? dthBy :"]) if (!UI.includes(s)) say('the page code', 'graphs', 'a Graphs filter is gone (expected "' + s + '" in src/ui.js)');
try { const AK = H.site(['deathHit', 'deathHitId', 'EXT_N', 'RAID_CD_N', 'LUST_BUFFS', 'AU_KINDS', 'AU_SETS', 'auraKind'], { PERF_CDS: { 'Holy Paladin': [['Avenging Wrath', 120]] } }); const want = { Barkskin: 'def', Ironbark: 'ext', Tranquility: 'raid', 'Tempered Potion': 'cons', 'Avenging Wrath': 'cds', 'Mark of the Wild': 'other' };
  for (const [n, k] of Object.entries(want)) if (AK.auraKind(n) !== k) say('the page code', 'graphs', 'Buffs files ' + n + ' under ' + AK.auraKind(n) + ', not ' + k); } catch (e) { say('the page code', 'graphs', 'the Buffs kind filter crashed: ' + e.message); }
/* (Nov 7, Flex: the Rotation checklist says each thing once: Mana groups are Resources, Gear and extras doesn't repeat checklist rows, one button is one row) */
for (const s of ["if (RES.test(sec) || ks.some(function (k) { return k === 'mana'; })) return 'res';", "var SUF = / (uses|on yourself|ramp|with your cooldowns|with big cooldowns|on big damage|into big damage|into heavy damage|after big damage|in bloodlust|in lust|in heroism|set up|timing|windows)$/i", "m0 = l.match(/^(.+?) (?:in|inside|on|into|after|with|during|spent|at|that|before) .+$/)"]) if (!H.SH.includes(s)) say('the page code', 'rotation', 'the Rotation checklist repeats itself again (expected "' + s + '" in src/shell.html)');
if (!UI.includes("&& /^saves/.test(String(c.k))); /* (Nov 7")) say('the page code', 'rotation', 'Gear and extras repeats checklist rows again');
/* (Nov 7, Main: a Rotation chapter's "N of M done right" names its grey rows, so it adds up to the rows shown) */ if (!H.SH.includes("(l.length > g.length ? ' · ' + (l.length - g.length) + ' not graded' : '')")) say('the page code', 'rotation', 'the count of a Rotation chapter no longer adds up to its rows');
/* (Nov 7, Flex: Power Infusion is said once on Rotation: its panel opens inside its row) */ if (!H.SH.includes('window.__piFold = 1')) say('the page code', 'rotation', 'Rotation shows Power Infusion twice again');
/* (Nov 7, Flex: Holy Priest's fuller checklist) */ for (const s of ["{ n: 'Guardian Spirit', tal: 'Guardian Spirit', cd: 180,", "k: 'pomrn', n: 'Prayer of Mending', buf: 'Renew', via: true", "keyMin: 5, dur: 20,", "{ n: 'Surge of Light', use: ['Flash Heal', 'Prayer of Healing', 'Benediction'], max: 2,", "{ n: 'Epiphany', tal: 'Epiphany'", "{ n: 'Divinity', tal: 'Divinity'", "k: 'pohor', a: 'Prayer of Healing', hero: 'Oracle'", "k: 'gstank', n: 'Guardian Spirit', want: 'tank'"]) if (!UI.includes(s)) say('the page code', 'rotation', 'Holy Priest lost a check again (expected "' + s + '" in src/ui.js)');
if (!UI.includes("w === 'chan' ? u.t >= sp.a - 5 && u.t <= sp.b")) say('the page code', 'rotation', 'a healing channel started just before heavy damage counts as quiet again');
if (!H.SH.includes("if (/^win(:|$)/.test(String(c.k)) && winB[c.sec]) return winB[c.sec];")) say('the page code', 'rotation', 'a big cooldown shows on several rows again (Mistweaver Yu\'lon)');
if (!UI.includes('cds = (D.cds || []).filter((q) => live(q) || (on(q) && haveCd(q))).filter(')) say('the page code', 'rotation', 'a big cooldown never pressed hides its row again');
if (!UI.includes("{ n: 'Art of War', use: ['Blade of Justice', 'Hammer of Wrath', 'Divine Toll'], max: 2,")) say('the page code', 'rotation', 'Art of War counts Hammer of Wrath and Divine Toll as waste again');
if (!UI.includes("'p:Shining Light': { info: true }") || !UI.includes("' was on what you were tanking '")) say('the page code', 'rotation', 'Shining Light or tank damage over time reads the old way again');
if (!UI.includes("max: 2, bulk: true, /* (Nov 7: one Obliterate") || !UI.includes("{ n: 'Mind Blast', cd: 9, h: true, noSeen: true,")) say('the page code', 'rotation', 'Killing Machine or Mind Blast counts the old way again');
if (!UI.includes("'Retribution Paladin': { abc: [0.7, 0.62], res: [0.28, 0.36],") || !UI.includes("'p:Killing Machine': { okW: 0.22, warnW: 0.3 }") || !UI.includes("'cd:mind blast': { ok: 0.62, warn: 0.5 }")) say('the page code', 'rotation', 'a check set from top guilds lost its bar again');
if (!UI.includes("data-cost=\"' + esc(costT) + '\"") || !H.SH.includes('rpx-cost')) say('the page code', 'rotation', 'What to fix lost its costs again');
if (!UI.includes("data-cost=\"' + esc(costT) + '\"") || !H.SH.includes('rpx-cost')) say('the page code', 'rotation', 'What to fix lost its costs again');
if (!H.SH.includes('wrt-by')) say('the page code', 'debriefing', 'the root-cause row lost who caused it');
if (!H.SH.includes('window.__ahGroup = function')) say('the page code', 'debriefing', 'Also hurt lost its groups');
if (!UI.includes("filter((x) => !(x.kind === 'note' && x.label === 'Note cooldowns'))")) say('the page code', 'debriefing', 'Note cooldowns shows up among the mistakes again');
if (!UI.includes("nd.className = 'cch-ab cch-abx cch-ab-note'") || !H.SH.includes("var ncd = pick(/^note cooldowns/i)")) say('the page code', 'debriefing', 'Raid checks lost the Note cooldowns row');
{ const ES = require('fs').readFileSync(require('path').join(SRC, 'engine.js'), 'utf8'); if (!ES.includes("avSet('Caustic Deluge (Tank beam)'") || !ES.includes("'tainted burst', 'caustic deluge'") || !ES.includes("if (h.role(e.dst) === 'tank' || !(e.amt > 0)) continue; const a = A(e.dst); if (e.t - a.beamL > 1.5)")) say('the page code', 'avoid', 'The Twin Fangs: the tank beam (Caustic Deluge) row for non-tanks is gone from Avoidable damage (Main, Nov 13)'); }
if (!UI.includes('if (!(w && w.auto)) return w; const p = playedOn(r, w);') || !UI.includes('if (p === w && isFinite(w.t)) { const g = (r.deaths || []).filter((d) => d.t > w.t + 0.5 && d.t <= w.t + 1.25 && (d.mass || 0) >= 3);')) say('the page code', 'wipes', 'the cut no longer follows a pull the raid played on (audit W1)');
/* (audit P1, Nov 8: one cooldown table: Plan, the Report card and the Deaths rules read each raid cooldown's length from CD_REAL) */
{ const m = /const CD_REAL = (\{[^}]*\})/.exec(UI), CR = m ? require('vm').runInNewContext('(' + m[1] + ')') : null;
  if (!CR || CR['Divine Hymn'] !== 120 || CR.Rewind !== 180 || CR.Darkness !== 180 || CR['Anti-Magic Zone'] !== 180) say('the page code', 'cooldowns', 'CD_REAL is missing or has the wrong lengths (Divine Hymn 2:00, Rewind 3:00, Darkness 3:00, Anti-Magic Zone 3:00 from the logs)');
  for (const t of ['NDZ_CDK', 'NDZ_CDRECH', 'NDZ_CDPOW', 'RCD_CD']) if (!UI.includes('cdReal(' + t + ',')) say('the page code', 'cooldowns', t + ' no longer reads its lengths from CD_REAL: the same cooldown would have two lengths on two tabs'); }
/* (audit J1, Nov 8: Ula'tek's Serpent's Bite is planned as the Guides tab says since Oct 6: three sets with a backup each, never "target plus 4") */
{ const GJ = fs.readFileSync(path.join(SRC, 'guides.js'), 'utf8');
  if (/target plus 4/i.test(UI)) say('the page code', 'jobs', 'the Plan still says "target plus 4" for Serpent\'s Bite; the Guides tab says three soakers, stacked, since Oct 6');
  for (const l of ['Group Soak 1', 'Group Soak 1 backup', 'Group Soak 3', 'Group Soak 3 backup']) if (!UI.includes("label: '" + l + "'")) say('the page code', 'jobs', 'the Serpent\'s Bite card has no "' + l + '" slot (the sets as the team plan names them, Nov 11)');
  if (!GJ.includes('bite\\s*([123])')) say('the page code', 'jobs', 'the Guides tab\'s picture plan does not read the "Bite 1/2/3" lines the Plan writes');
  if (!UI.includes("'Bite Melee', want: 'all', heroic: true")) say('the page code', 'jobs', 'Heroic\'s Serpent\'s Bite groups are not whole-raid groups (want all, Heroic only)'); }
/* (audit J2/J4/J7, Nov 8: Freedom only from spells that remove the slow; each egg zone its own pool; shield breakers and Freedom never topped up with a filler) */
{ const m = /const NDZF_FREEDOM = (\{[^}]*\})/.exec(UI), FR = m ? m[1] : '';
  if (!FR || /Rescue|Stampeding|Wind Rush/.test(FR) || !/Blessing of Freedom/.test(FR)) say('the page code', 'jobs', 'NDZF_FREEDOM lists a spell that does not remove the slow (Rescue, Stampeding Roar, Wind Rush Totem), or lost Blessing of Freedom');
  for (const z of ['Egg Melee', 'Egg Far', 'Egg (Left|Right)', 'Egg Backup', 'Egg Shields']) if (!UI.includes('[/^' + z + '/,')) say('the page code', 'jobs', 'the egg card has no fit rule of its own for ' + z + ': one shared pool scrambles the zones (J2)');
  if (!UI.includes("['freedom'], 'strict']") || !UI.includes("['shield'], 'explain strict']")) say('the page code', 'jobs', 'Freedom and Egg Shields are not strict jobs: a 0-fit filler could be topped up into them (J4/J7)'); }
/* (audit J3/J5/J8, Nov 8: Ula'tek's P2 card has the tether breakers, the Doomscale Egg and the gateway, shows on Heroic with the egg card, and the planner plans each ledge in P2) */
{ for (const l of ['P2 Left Breakers', 'P2 Left Doomscale Egg', 'P2 Right Doomscale Egg', 'P2 Left Far Big Egg', 'P2 Right Big Egg', 'P2 Gateway']) if (!UI.includes("label: '" + l + "'")) say('the page code', 'jobs', 'the Ula\'tek P2 card has no "' + l + '" slot (J3)');
  if (UI.includes("{ key: 'side', mythic: true") || UI.includes("{ key: 'eggs', mythic: true") || UI.includes("{ key: 'sideeggs', mythic: true")) say('the page code', 'jobs', 'Ula\'tek\'s P2 or egg card is Mythic-only again: Heroic has eggs and two ledges too (J5)');
  if (!UI.includes('const sidesOf = (x) => (x.split ?') || !UI.includes("side|P2 Left Side'] || {}).n || [], r = (B.sel['side|P2 Right Side']")) say('the page code', 'cooldowns', 'ndzCdPlan no longer plans Ula\'tek\'s phase 2 per ledge (J8)'); }
/* (audit J6, Nov 8: the Ula'tek soak teams follow the guide's placement and an even split never says "1 more needed" on an odd roster) */
{ if (!UI.includes("{ label: '{star} Group', want: 6, block: 'trans' }, { label: '{diamond} Group', want: 6, block: 'trans' }, { label: '{square} Group', want: 6, block: 'trans' }")) say('the page code', 'jobs', 'the intermission groups no longer ask for six each (Flex, Nov 10: "this also needs 6 people in each group"; was uneven by design, J6)');
  if (!UI.includes("wantN = (typeof sl.want === 'number' ? sl.want : 0) - (sl.approx ? 1 : 0)")) say('the page code', 'jobs', 'the Plan row flags an even split that is one short (19 raiders can\'t split 10/10, J6)');
  if (!UI.includes('The coil that appears first is theirs (facing the tail, the right-hand one)')) /* (Nov 13: the coil that appears first, Flex's rule, with where it has landed in every log) */ say('the page code', 'jobs', 'the Spectral Coils teams lost the guide\'s placement sentence (J6)'); }
/* (Nov 11, Flex: "check how it labels the assignemnts so our assignments match", "especially if theres markers assigned": Ula'tek's Mythic Plan has the team plan's sections and rows, the kicks by marker) */
{ for (const l of ['Moon', 'Moon backup 2', 'Diamond backup 2', 'Right Soak #1 Eggs', 'Left Soak #2 Filler', 'Fester Burst Spreads', 'P2 Left Far Big Egg', 'Jump 4', 'Group Soak 2 backup']) if (!UI.includes("label: '" + l + "'")) say('the page code', 'jobs', 'Ula\'tek\'s Mythic Plan has no "' + l + '" row: it no longer matches the team\'s wowutils plan');
  for (const t of ['Pick up Egg', 'Egg Clear', 'Fester Burst Egg Spread', 'Sides', 'Side Egg Pickups', 'Weakened Doomscale Interrupts', 'Jump side help', 'Intermission Positions', "Serpent\\'s Bite Leech"]) if (!UI.includes("title: '" + t + "'")) say('the page code', 'jobs', 'Ula\'tek\'s Plan has no "' + t + '" card (a section of the team\'s wowutils plan)');
  if (!UI.includes("{ label: 'Moon', want: 1, block: 'int', rep: 3, mythic: true }")) say('the page code', 'jobs', 'Ula\'tek\'s main kickers are no longer written three times in the kick block, as the team plan writes them'); }
/* (Main, Nov 8: one difficulty on the Plan page: the night strip reads the live Who plays difficulty, the one the planner builds with) */
if (!UI.includes("dif = (o && o.diff) || (k && N0.d && N0.d[k] && N0.d[k].diff) || 'Mythic'")) say('the page code', 'plan', 'the Plan night strip reads a saved copy of the difficulty, not the live one the planner uses: the two can disagree');
/* (audit K1/K13/K2, Nov 8: the Twin Fangs kick card is the guide's ten spots and never topped up; the top-up fills only groups, teams and sides; the Feast order is right, left, front) */
{ for (const l of ['Front Left', 'Front Right', 'Left close', 'Left far', 'Right close', 'Right far']) if (!UI.includes("label: '" + l + "', order: true")) say('the page code', 'jobs', 'the Twin Fangs kick card has no "' + l + '" spot (K1)');
  if (!UI.includes("key: 'kicks', mythic: true, nofill: true, title: 'Broodling kicks'")) say('the page code', 'jobs', 'the Twin Fangs kick card can be topped up with non-kickers again (K1/K13)');
  if (!UI.includes('const PG_FILLOK = (pg, sl) =>') || !UI.includes('if (room() && (rule || PG_FILLOK(pg, sl)))')) say('the page code', 'jobs', 'the card top-up fills any slot from the free pool again (K13)');
  if (!UI.includes("'Knocked right: soaks the first orb.'")) say('the page code', 'jobs', 'the Twin Fangs Feast order is not the guide\'s (right first, left second, front last; K2)'); }
/* (audit K5/K6, Nov 8: Sentinels' Miasma is the whole Blood side; Vashnik's shadow-add grips come only from gathering spells, with a Far Add CC on Mythic) */
{ if (!UI.includes("const mi = G.Blood.slice()")) say('the page code', 'jobs', 'Miasma no longer takes the whole Blood side (K5)');
  if (/\['Ring of Peace', 3\]|\['Thunderstorm', 2\]/.test(UI)) say('the page code', 'jobs', 'Ring of Peace or Thunderstorm count as a mass grip again: they scatter adds (K6)');
  if (!UI.includes("label: 'Far Add CC', want: 1, mythic: true") || !UI.includes("[/^Shadow Add Grips/, (p) => true, ['massgrip'], 'strict']")) say('the page code', 'jobs', 'Vashnik lost the Far Add CC slot or the strict gatherers-only rule (K6)'); }
/* (audit K3/K4/K9/K10/K12, Nov 8: Nymrissa's immune orb soakers and squads, Sszorak's Fury Stack and pingers, Kith'ix's Circle Scar; knockbacks are no grip) */
{ for (const l of ["label: 'Orb Soak ' + i, want: 1, mythic: true", "label: 'Orb Soaks', want: 1, heroic: true", "label: 'Left Squad', want: 3, mythic: true", "label: 'Frostscale Grip', want: 1, mythic: true", "label: 'Fury Stack', want: 14", "label: 'Crosswinds Pingers', want: 0, show: true", "label: 'Circle Scar', want: 2"]) if (!UI.includes(l)) say('the page code', 'jobs', 'a batch-3 slot is missing: ' + l);
  if (/Ring of Peace', 1\]|Thunderstorm', 1\]|Wing Buffet', 1\]/.test(UI) || /MONK: 'Ring of Peace' \}/.test(UI)) say('the page code', 'jobs', 'a knockback counts as a grip again (Ring of Peace, Thunderstorm, Wing Buffet)');
  if (!UI.includes("slw = cls === 'DEMONHUNTER' && sid !== 581 ? null : NDZF_SLOWS[cls]")) say('the page code', 'jobs', 'a Havoc Demon Hunter gets Sigil of Chains as a slow again'); }
/* (audit K7/K8/K11, Nov 8: Vashnik's far soakers first and the dispel pairs; the crate pairs stand as picked; grip rows strict) */
{ if (!UI.includes("slots: [{ label: 'Max Range Flame', want: 2 }, { label: 'Max Range Shadow', want: 2 }, { label: 'Bile', want: 6 }]")) say('the page code', 'jobs', 'Vashnik\'s Bile crowd is picked before the far soakers again (K7)');
  if (!UI.includes("label: 'Dispel Pair 1', want: 2, mythic: true") || !fs.readFileSync(path.join(SRC, 'guides.js'), 'utf8').includes('dispel\\s*pair\\s*(\\d)')) say('the page code', 'jobs', 'Vashnik\'s Mythic dispel pairs are missing, or the Guides tab does not read them (K7)');
  if (!UI.includes("[/^Crates/, (p) => ndzIsT(p) || ndzIsR(p), ['tank', 'move', 'ranged'], 'explain']")) say('the page code', 'jobs', 'the fit pass re-ranks the crate pairs again: both tanks can land on Crates 1 (K8)');
  if ((UI.match(/\['grip'\], 'strict'\]/g) || []).length < 4) say('the page code', 'jobs', 'a grip row is not strict: a non-gripper can fill it'); }
/* (Plan review 1, Nov 8: a strict job never asks for more players than the roster can give it, so a fresh plan is not left with a job nobody can fill) */
/* (Nov 8: the page tips never spotlight an empty or loading card) */
if (!UI.includes('const tipVis = (sel) => { for (const e of document.querySelectorAll(sel)) { const b = e.getBoundingClientRect(); if (b.width > 4 && b.height > 4 && tipFilled(e)) return e; } return null; };')) say('the page code', 'tips', 'the page tips no longer check that a target shows something: an empty card can be spotlighted');
if (!UI.includes("if (typeof ndzStrictCap === 'function') ndzStrictCap(B, [...pr.players.values()]);")) say('the page code', 'jobs', 'the build no longer caps strict jobs: a grip row with no gripper left says "1 more needed" forever');
if (!UI.includes('audit W11: the root cause the Debriefing card shows answers here too')) say('the page code', 'wipes', 'why we wiped has two rule sets again (audit W11)');
if (typeof (H.E && H.E.rcJobBy) !== 'function' || !UI.includes('E.rcJobBy && E.rcJobBy(r, rc.cat, t0)')) say('the page code', 'wipes', 'who missed a job has two rules again (audit W2)');
if (!H.SH.includes("audit W4: the row carrying the Root cause tag is always Serious")) say('the page code', 'wipes', 'the root-cause row can read Moderate again (audit W4)');
if (!H.SH.includes('var inPh = function (p)')) say('the page code', 'wipes', '"in Both" is back in the wipe header (audit W15)');
if (!UI.includes('|| dbfReset(r.item)) return null; /* (Nov 8, audit W14')) say('the page code', 'wipes', 'a reset pull gets a root cause again (audit W14)');
if (!UI.includes("'Sszorak|M': [{ ids: [1285999], k: 3, n: 'Mutilate'")) say('the page code', 'wipes', 'Sszorak Mythic has no wipe-mechanic rule again (audit W12)');
if (!UI.includes('const deathHit = (d) =>') || !UI.includes('const deathRaidSay = (l, short) =>')) say('the page code', 'deaths', 'the killing-hit helper or the raid-miss line is gone (audit D2/D4)');
if (typeof E.deathLinkOk !== 'function' || E.deathLinkOk({ mechanic: 'Eternal Venom', detail: 'Reached 7 stacks of Eternal Venom.' }, 'Stone Breaker') || !E.deathLinkOk({ mechanic: 'Soul Sever', detail: 'Stood in a Soul Sever.' }, 'Gravebound')) say('the page code', 'deaths', 'a death is owned by an unrelated mistake again (audit D3)');
if (!UI.includes("v.why === 'forced' ? capS(v.word) + '.'") || !UI.includes("if (v.why === 'forced') { const f = String(v.word || '')")) say('the page code', 'deaths', 'a forced death reads "After the pull was lost" again (audit D1)');
if (!UI.includes('onStr: fmtHalf(whole + half / 2)') || !UI.includes("return r.deaths.filter((d) => d.t <= t + 0.5); }")) say('the page code', 'deaths', 'the one death count or the one cut is gone (audit D7)');
if (!UI.includes('mc, idle: idleAll, rgaps };') || !UI.includes('- cut(mcw) - idleAl)')) say('the page code', 'rotation', 'raid-wide casting gaps count against everyone again (audit R1)');
if (!require('fs').readFileSync(require('path').join(SRC, 'engine.js'), 'utf8').includes('const otherTank = (r, g, t, debOn) =>') || !UI.includes("tk = (r.mistakes || []).filter((m) => m.taker && b0(m.taker) === b0(d.player)")) say('the page code', 'mechanics', 'a missed tank swap blames the tank who took the hit again (audit D6/M6; Nov 13, the proof rule: a hit logged as another player\'s miss is never proof against the one who took it)');
{ const ES = require('fs').readFileSync(require('path').join(SRC, 'engine.js'), 'utf8'); for (const n of ['greater invisibility', 'touch of karma', 'evasion', 'vampiric blood', 'fiery brand', 'renewing blaze', 'alter time', 'last stand']) if (!ES.includes("'" + n + "'") && !ES.includes(n + ':')) say('the page code', 'deaths', n + ' has no save model again (audit D8)'); if (!UI.includes("(!massD && sum(hs) > over && sum(hs) >= 0.1 * (mx || 1e9))")) say('the page code', 'deaths', 'a mass death to the wipe mechanic can count against a player for a small hit again (audit D10; Nov 13, the proof rule: in a mass death only the killing hit itself is proof)'); }
if (/tgtL|soakFull|Half on them/.test(H.grab('deathVerdict'))) say('the page code', 'deaths', 'the Guillotine target or soaker is a special case in the death rule again (audit D5; Nov 13, the proof rule: no halves, a death counts once, with its proof)');
if (!UI.includes("f < warnF && miss >= 2 && f <= okF - 0.1 ? 'bad' : 'warn'")) say('the page code', 'rotation', 'one missed cooldown out of three is red again (audit R2)');
if (!UI.includes('|| lowSoon(g, t)) : ally });')) say('the page code', 'rotation', 'Guardian Spirit is judged by who got it again (audit R3)');
if (!UI.includes('const NOTOP = !TB0 && !GEN_TUNE[spec];') || !UI.includes("'<small class=\"rck-na\">' + esc(ckNaWhy(c))") || !UI.includes("f >= warnF || tkg ? 'warn' : 'bad' /* (Nov 8, audit R7")) say('the page code', 'rotation', 'rotation rows hide what they know again (audit R5/R6/R7)');
{ const ES = require('fs').readFileSync(require('path').join(SRC, 'engine.js'), 'utf8'); if (!ES.includes("mechanic: m.spell || 'Missed interrupt', kick: true") || !ES.includes('held back by Time Dilation') || !ES.includes('missed.length >= 3)')) say('the page code', 'mechanics', 'a wording rule slipped (audit D11/M3/M7)'); if (!UI.includes('first = (v.defs.length ? v.defs : v.kit)[0]')) say('the page code', 'deaths', '"ready" names one button and the fix another again (audit D9)'); }
if (!UI.includes('if (recovered(t)) continue; call = {')) say('the page code', 'wipes', 'the kill line calls a wipe the raid recovered from again (W1 leftover)');
if (!UI.includes("'Eternal Nightfall cast started (' + shieldN + '). The raid wiped before it finished'")) say('the page code', 'wipes', 'a running Eternal Nightfall cast reads as the wipe cause again (Flex, Nov 8)');
{ const ES = require('fs').readFileSync(require('path').join(SRC, 'engine.js'), 'utf8'); if (!ES.includes("perDm(ssItems, 'no Soul Sever in this Dreadmarch', p3)") || !UI.includes('phIco(q.sp || q.x.s)')) say('the page code', 'mechanics', 'the Coiled Altar phase 3 list shows Soul Sever or the wrong frontal icon again (Flex, Nov 8)'); }
{ const ES = require('fs').readFileSync(require('path').join(SRC, 'engine.js'), 'utf8'), SH = require('fs').readFileSync(require('path').join(SRC, 'shell.html'), 'utf8'); if (!ES.includes('const sec = gSec || tSec;') || !ES.includes("txt: 'Ghost missed the frontal'") || !SH.includes('class="ahg-ln"') || !SH.includes('/^lost to\\b/i.test(st)')) say('the page code', 'wipes', 'Also hurt repeats the root cause, runs lines together or files a soul-fragment or ghost miss under the frontal again (Flex, Nov 8)'); }
{ const WT = require('fs').readFileSync(require('path').join(SRC, 'worker_template.js'), 'utf8'); if (!WT.includes("const uid = 'b:' + bid") || !WT.includes('sess = userTok(sess0) ? sess0 : null') || !UI.includes('const meSave = (v) =>') || UI.includes('store.set(ME_KEY, JSON.stringify({')) say('the page code', 'sign-in', 'Battle.net is no longer the one sign-in, a team list needs a personal Warcraft Logs pass, or something writes you over the Battle.net main again (Flex, Nov 8)'); }
{ const SV = require('fs').readFileSync(require('path').join(SRC, 'sidenav.js'), 'utf8'); if (!SV.includes("const nm = out ? 'Not signed in'") || !UI.includes('async function signOutNow()') || !UI.includes("w = w0 || null; o.hidden = false")) say('the page code', 'sign-in', 'the side menu looks signed in after Sign out, or an old sign-in has no Sign out again (Flex, Nov 8)'); }
if (!UI.includes('try { outForget(); }') || !UI.includes("const FRESH_V = '2026-11-08'") || !UI.includes('async function teamsFromServer()') || !UI.includes('const guestLock = () =>')) say('the page code', 'sign-in', 'Sign out leaves the raider on this browser, the one-time fresh start is gone, the teams list no longer comes from the account, or signed out is no longer a guest (Flex, Nov 8)');
{ const WT2 = require('fs').readFileSync(require('path').join(SRC, 'worker_template.js'), 'utf8'); if (!WT2.includes("if (!who) return json({ exists: true, locked: true, signin: true") || !WT2.includes("if (!who) return { acc: 'none', why: 'signin' };")) say('the page code', 'sign-in', 'a team plan opens without a Battle.net sign-in again (Flex, Nov 8)'); }
if (!UI.includes("if (method === 'POST') { const mn = whoMain(); A.busy = false; close();")) say('the page code', 'sign-in', 'Save in Your characters no longer says Saved and closes (Flex, Nov 8)');
{ const EN2 = require('fs').readFileSync(require('path').join(SRC, 'engine.js'), 'utf8'); if (!EN2.includes('orbAt = fv ? orbWaveAt(r, fv.t) : t0; orbBy = orbRefine(r, orbAt, carriersAt(orbAt));') || !EN2.includes('const RING = 7.5, CLEAR = RING + 1') || !EN2.includes('const gnd = objs(tc, ph0)') || !EN2.includes('r.orbWaves = ') || !EN2.includes('const tc = orbWaveAt(r, d.t), who = orbRefine(r, tc, orbCarriers(r, tc)); return orbFearedAt(r, who, tc) ? [] : who;') || !EN2.includes('if (kk && orbFearedAt(r, orbBy, orbAt))')) say('the page code', 'wipes', 'an orb wipe no longer names the carrier by position at the burst, forgets orbs left from an earlier Deluge, or misses a collision late in a wipe, or blames a carrier an unkicked Wail of Terror feared onto the orb (Flex, Nov 8 and Nov 12)'); }
if (!UI.includes('var names = (who || []).concat(ROS)')) say('the page code', 'wipes', 'How it went colours only a row\'s own names again (Flex, Nov 8)');
{ const SH2 = require('fs').readFileSync(require('path').join(SRC, 'shell.html'), 'utf8'); if (!SH2.includes("var colours = function () { var C = {}; /* (Nov 8, Main: the pull's roster first")) say('the page code', 'wipes', 'Raid checks names lose their class colour again (Main, Nov 8)'); }
{ const SH3 = require('fs').readFileSync(require('path').join(SRC, 'shell.html'), 'utf8'); if (!SH3.includes('@layer defaultTheme { html:not([data-theme]) body.refine .op-pick select#opP')) say('the page code', 'looks', 'the Everyone chip\'s dropdown draws its own border again (Flex, Nov 8)'); }
{ const SH4 = require('fs').readFileSync(require('path').join(SRC, 'shell.html'), 'utf8'); if (!UI.includes('function unit492(') || !SH4.includes('.cgl-dt .p469-g')) say('the page code', 'looks', 'Summary\'s number boxes lost the number-first layout (Flex, Nov 9)'); if (/damage a second to the boss|' a second on the kill|' a second' \+ \(med/.test(UI)) say('the page code', 'wording', 'a Summary hover says "a second" again (Flex, Nov 9: per second, DPS, HPS, DTPS)'); }
/* (Flex, Nov 9: a rate is "per second" or its unit (DPS, HPS, DTPS, rDPS), never "a second". Every string the page shows, in ui.js
   (the patch notes left alone), guides.js and mptab.js; comments and regular expressions don't count) */
{
  const lits = (js) => { const out = []; let i = 0; const n = js.length;
    const isRe = () => { let k = i - 1; while (k >= 0 && /\s/.test(js[k])) k--; if (k < 0) return true; const c = js[k]; if ('(,=:[!&|?{};+-*%<>~^'.includes(c)) return true; if (')]}'.includes(c)) return false;
      const w = /[A-Za-z_$][\w$]*$/.exec(js.slice(Math.max(0, k - 12), k + 1)); return !!w && /^(return|typeof|case|do|else|in|void|delete|instanceof|new|throw)$/.test(w[0]); };
    while (i < n) { const c = js[i], d = js[i + 1];
      if (c === '/' && d === '/') { while (i < n && js[i] !== '\n') i++; continue; }
      if (c === '/' && d === '*') { const j = js.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
      if (c === '"' || c === "'") { const s0 = i + 1; for (i++; i < n && js[i] !== c; i++) if (js[i] === '\\') i++; out.push([s0, i]); i++; continue; }
      if (c === '`') { let s0 = i + 1, depth = 0; for (i++; i < n; i++) { if (js[i] === '\\') { i++; continue; } if (!depth && js[i] === '`') break;
          if (!depth && js[i] === '$' && js[i + 1] === '{') { out.push([s0, i]); depth = 1; i++; continue; } if (depth && js[i] === '{') depth++; if (depth && js[i] === '}') { depth--; if (!depth) s0 = i + 1; } }
        out.push([s0, i]); i++; continue; }
      if (c === '/' && isRe()) { let cls = false; for (i++; i < n; i++) { if (js[i] === '\\') { i++; continue; } if (js[i] === '[') cls = true; else if (js[i] === ']') cls = false; else if ((js[i] === '/' && !cls) || js[i] === '\n') break; } i++; while (/[a-z]/i.test(js[i] || '')) i++; continue; }
      i++; }
    return out; };
  const RATE = /(^ ?a second\b(?=\s*$|\s*[<),.;:(]|\s(?:of|while|this|by|with|more|lately|between|over|against|from|in|here|than|for)\b))|((?:\b(?:damage|healing|Damage|Healing|Output|output|one|the same)|\d[\d.,]*\s?[KMk%]?) a second\b)|((?:<\/b>|<small>|<span>) ?a second\b)/;
  for (const f of ['ui.js', 'guides.js', 'mptab.js']) {
    const js = fs.readFileSync(path.join(SRC, f), 'utf8'); const a = f === 'ui.js' ? js.indexOf('const PATCH_NOTES = [') : -1, b = a < 0 ? -1 : js.indexOf('\n];', a) + 3;
    for (const [s0, e0] of lits(js)) { if (a >= 0 && s0 >= a && s0 < b) continue; const lit = js.slice(s0, e0);
      if (lit.includes('a second') && RATE.test(lit)) say('the page code', 'wording', f + ' line ' + js.slice(0, s0).split('\n').length + ' says "a second" for a rate (it is "per second" or the unit: DPS, HPS, DTPS, rDPS): ' + lit.slice(Math.max(0, lit.indexOf('a second') - 50), lit.indexOf('a second') + 20).replace(/\n/g, ' ')); }
  }
}
{ const SH5 = require('fs').readFileSync(require('path').join(SRC, 'shell.html'), 'utf8'); if (!UI.includes('function earlyEnd493(') || !UI.includes('rates: rates493(r)') || !SH5.includes('.r493-vd')) say('the page code', 'deaths', 'Summary lost the early-deaths count, the saved rates or the verdict line (Flex, Nov 9)'); }
if (UI.includes('deaths += s.deaths;')) say('the page code', 'deaths', 'the Report card adds up every death up to the call again (mass wipe deaths and not-their-fault ones included)');
for (const s of ['if (it && !chainTitleFits(m.m, it.txt)) return;', 'if (b && !chainTitleFits(b.m.m, it.txt)) b = null;']) if (!UI.includes(s)) say('the page code', 'title', 'How it went no longer checks its titles (expected "' + s + '" in src/ui.js)');
for (const s of ["KR = [].map.call(w.querySelectorAll('.dbt-chn > .dbt-chr:not(.end)'), function (r) { return pk(r, '.dbt-cht'); })", "function (w) { window.__ahDedupe(w); if (window.__ahGroup) window.__ahGroup(w); }", "rows = function () { return [].slice.call(w.querySelectorAll('.dbt-chn > .dbt-chr:not(.end)')); }"]) if (!H.SH.includes(s)) say('the page code', 'repeat', 'Also hurt can repeat How it went again (expected "' + s + '" in src/shell.html)');
for (const s of ["'Wipe in ' + pg.label", "% of the fight done'"]) if (UI.includes(s)) say('the page code', 'health', 'src/ui.js still shows a second health number: `' + s + '`');
/* (Nov 6, Flex: "Anytime we look at progression, it needs to be based on boss health not fight progression": no "% of the fight" or "% done"
   progress anywhere, and Home's pulls carry the pull picker's whole-fight boss health, so every best-pull % equals the picker's) */
for (const s of ["% of the fight</span>", "+ '% of the fight'", "<small class=\"pn-dn\">done</small>", "of the encounter done", "Math.floor(100 - n.nb.left)", "Math.floor(100 - v.left)", "Math.floor(100 - b.left)", "Math.floor(100 - bv.left)", "Math.floor(100 - bp.left)"]) if (UI.includes(s)) say('the page code', 'progress', 'src/ui.js shows progression as fight done again, not boss health left: `' + s + '`');
for (const s of ["left: it.kill ? 0 : pg ? pg.left :", "left: p.kill ? 0 : pg ? pg.left :", "const pctOf = (b) => (b && b.left != null ? (b.kill || b.left <= 0 ? 0 : Math.max(1, Math.round(b.left))) : null);"]) if (!UI.includes(s)) say('the page code', 'progress', 'Home\'s best pull no longer takes the pull picker\'s whole-fight boss health (expected "' + s + '" in src/ui.js)');

const t0 = Date.now(); let n = 0;
/* (Nov 6: every PATCH_NOTES day needs a valid date; a stray line showed "Invalid Date" on the Patch notes page and feeds the daily Discord post) */
{ const src = fs.readFileSync(path.join(SRC, 'ui.js'), 'utf8'), i = src.indexOf('const PATCH_NOTES = ['), j = src.indexOf('\n];', i); let PN = null; try { PN = require('vm').runInNewContext(src.slice(i + 'const PATCH_NOTES = '.length, j + 3)); } catch (e) { console.log('Contradiction: PATCH_NOTES could not be read (' + e.message + ')'); process.exit(1); }
  const bad = PN.filter((x) => !x || typeof x !== 'object' || !/^\d{4}-\d\d-\d\d$/.test(x.d || '') || isNaN(Date.parse(x.d)));
  if (bad.length) { console.log('Contradiction: ' + bad.length + ' PATCH_NOTES day(s) without a valid date, e.g. ' + JSON.stringify(bad[0]).slice(0, 100)); process.exit(1); } }
if (!fs.existsSync(LIB) && !DIRS.length) { console.log('Contradiction check: skipped (no log library at ' + LIB + ')'); process.exit(0); }
for (const k of keys) { try { if (checkPull(k)) n++; } catch (e) { say(k, 'crash', 'the check crashed: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); } }
// 9 to 13. one player's mechanics: Summary and the Report card read the same facts, every line is whole, trend words agree, What wiped us most (Nov 12)
try { require('./rc-sources.js')(H, say); } catch (e) { say('report card', 'crash', 'the sources check crashed: ' + e.message); } /* (Nov 12: every card row reads its home tab) */
try { require('./summary-scores.js')(H, say); } catch (e) { say('summary scores', 'crash', 'the Summary scores check crashed: ' + e.message); } /* (Nov 13: Summary's five scores are the Report card's) */
/* (Nov 12, Flex: "Why does it like to blame soul sever individual deaths for wipes": Nov 11 pull 5, called at 3:37 on four separate deaths, then Soul Sever killed 5 a second later: never the root.
   Read alone, with --all) */
if (ALL) { try { const rep6 = report('agt6jMTyZBYvVzAP'), ef6 = findFile('agt6jMTyZBYvVzAP_6.json'), it6 = rep6 && rep6.items.get(6); if (it6 && ef6 && E.rootCause) { let ev6 = readJ(ef6); if (!Array.isArray(ev6)) ev6 = ev6.events; const r6 = E.analyze(it6, W.translate(it6, ev6), {}); ev6 = null; if (!r6.item) r6.item = it6;
    const o8 = E.rootCause(r6, { cut: 217.4, why: 'line' }); if (!o8 || o8.cat === 'frontal' || /soul sever/i.test(o8.short || '')) say('The Coiled Altar Mythic pull 5 (agt6jMTyZBYvVzAP:6)', 'root', 'Soul Sever deaths after the call are the wipe\'s root cause again: "' + (o8 && o8.short) + '"'); } } catch (e) { say('Soul Sever guard', 'crash', e.message); } }
try { require('./deaths-check.js')(NIGHT_R, H, say); } catch (e) { say('deaths', 'crash', 'the death check crashed: ' + (e.stack || e.message).split(String.fromCharCode(10)).slice(0, 3).join(' | ')); } /* (Nov 12: Main's death plan) */
try { require('./ulatek-check.js')(NIGHT_R, H, say); } catch (e) { say('ulatek', 'crash', "the Ula'tek check crashed: " + (e.stack || e.message).split(String.fromCharCode(10)).slice(0, 3).join(' | ')); } /* (Nov 13: Ula'tek's wipe causes, checks A to G) */
try { require('./one-player.js')(NIGHT_R, H, say); } catch (e) { say('one player', 'crash', 'the one-player check crashed: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); }
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
// 7. one tier count (Nov 6, Flex: the PULLS tile said 157 where the Whole tier said 162): the PULLS tile (and the Pace chart, Compare, Home's
//    goal card) counts with guildProgOf, the Whole tier with tierPullsOf; fed the same Warcraft Logs answers they agree, with the second
//    half of the night in a report filed under Mythic+ (the zone's list doesn't have it) and its first pull logged twice; then the same night
//    again the next morning (a minute after 06:00 UTC): on the first night the tile counts that night only, on the second the Whole tier's total
const tierCount = async () => { for (const [gk, l] of TIER_T) { const it0 = l[0].it, rows = l.slice().sort((a, b) => a.row[2] - b.row[2]).map((x) => x.row), night = 'night ' + gk.split('|')[0] + ', ' + it0.boss + ' ' + it0.diff + ' (one tier count)';
    const h = Math.ceil(rows.length / 2), fight = (x) => ({ id: x[1], kill: !!x[3], startTime: x[2], endTime: x[2] + (x[8] || 60) * 1000, fightPercentage: x[4], bossPercentage: x[5], lastPhase: x[6], lastPhaseIsIntermission: !!x[7] });
    const A = { code: 'raidZone1', startTime: 0, fights: rows.slice(0, h).map(fight) }, B = { code: 'mplusZn1', startTime: 0, fights: rows.slice(h).map(fight) }, C = { code: 'twoLogd1', startTime: 0, fights: rows.slice(0, 1).map((x) => ({ ...fight(x), id: 900 + x[1], startTime: x[2] + 3000 })) };
    const r0 = rows.findIndex((x) => x[3]) >= 0 ? rows.slice(0, rows.findIndex((x) => x[3])) : rows; /* (night two follows a night without its kill) */
    const sh = (Math.floor((rows[0][2] - 216e5) / 864e5) + 1) * 864e5 + 216e5 + 60000 - rows[0][2], N2 = { code: 'nightTwo', startTime: 0, fights: r0.map((x) => ({ ...fight(x), id: 500 + x[1], startTime: x[2] + sh, endTime: x[2] + sh + (x[8] || 60) * 1000 })) };
    const run2 = async (q, v) => /zone\{id\}/.test(q) ? { worldData: { encounter: { zone: { id: 1 } } } } : { reportData: { reports: { has_more_pages: false, data: v.z === 1 ? [{ ...A, fights: r0.slice(0, h).map(fight) }, N2] : [{ ...A, fights: r0.slice(0, h).map(fight) }, { ...B, fights: r0.slice(h).map(fight) }, N2] } } };
    if (r0.length) { let t1 = null, t2 = null, tT = null; try { const L2 = await W.tierPullsOf(run2, { g: 1, e: it0.id, d: 5 }); tT = TSITE.tierModel({ pulls: L2, causes: {} }, it0, new Map()).P.length;
        t1 = (await W.guildProgOf(run2, { g: 1, e: it0.id, d: 5, t: r0[r0.length - 1][2] })).pulls; t2 = (await W.guildProgOf(run2, { g: 1, e: it0.id, d: 5, t: r0[r0.length - 1][2] + sh })).pulls; } catch (e) { say(night, 'tier', 'the two-night tier count crashed: ' + e.message); }
      if (t1 !== r0.length) say(night, 'tier', 'on the first of two nights the PULLS tile counts ' + t1 + ' pulls, the night has ' + r0.length);
      if (t2 !== tT || tT !== 2 * r0.length) say(night, 'tier', 'on the second of two nights the PULLS tile counts ' + t2 + ', the Whole tier ' + tT + ', the two nights have ' + 2 * r0.length); }
    const run = async (q, v) => /zone\{id\}/.test(q) ? { worldData: { encounter: { zone: { id: 1 } } } } : { reportData: { reports: { has_more_pages: false, data: v.z === 1 ? [A, C] : [A, B, C] } } };
    const v = { g: 1, e: it0.id, d: 5 }; let tier = null, tile = null; try { tier = TSITE.tierModel({ pulls: await W.tierPullsOf(run, v), causes: {} }, it0, new Map()).P.length; tile = (await W.guildProgOf(run, { ...v, t: rows[rows.length - 1][2] })).pulls; } catch (e) { say(night, 'tier', 'the tier count crashed: ' + e.message); continue; }
    const want = rows.findIndex((x) => x[3]) >= 0 ? rows.findIndex((x) => x[3]) + 1 : rows.length;
    if (tile !== tier || tier !== want) say(night, 'tier', 'the PULLS tile counts ' + tile + ' pulls, the Whole tier ' + tier + ', the night has ' + want); } };
// 8. raid days (Nov 6, Flex: Home said "Friday's raid", Plan marked Thu and Fri, Wolfthorn raids only Wed and Thu): one rule for Home and Plan
{ const RD = H.site(['deathHit', 'deathHitId', 'RD_ORDER', 'raidDaysRule', 'raidDaysSet', 'raidDaysOf', 'hdRaidDays'], { store: { get: () => null } }), now = Date.UTC(2026, 10, 7, 2), day = 864e5;
  const at = (daysAgo, h) => now - daysAgo * day + (h || 0) * 3600e3; /* (Nov 6 is a Friday: 2 days ago = Wed, 1 = Thu) */
  const ats = []; for (let w = 0; w < 4; w++) ats.push(at(2 + 7 * w), at(1 + 7 * w)); ats.push(at(0.2), at(3), at(10), at(4)); /* (one Friday, a Tuesday twice, a Monday once) */
  const PL = ats.map((x) => ({ at: x, diffId: 16 })).concat([3, 10, 17, 24].map((d) => ({ at: at(d), diffId: 15 }))); /* (and an alt's Heroic every Tuesday) */
  if (String(RD.raidDaysRule(PL, now)) !== '3,4') say('raid days', 'days', 'a Heroic night every Tuesday makes Tuesday a raid day: ' + RD.raidDaysRule(PL, now));
  const want = '3,4', got = String(RD.raidDaysRule(ats, now)), home = String(RD.hdRaidDays(ats.map((x) => ({ at: x }))));
  if (got !== want) say('raid days', 'days', 'Wed + Thu every week with a few odd nights should be raid days ' + want + ', the rule says ' + got);
  if (home !== String(RD.raidDaysOf(ats))) say('raid days', 'days', 'Home\'s raid days (' + home + ') and Plan\'s (' + RD.raidDaysOf(ats) + ') disagree');
  if (String(RD.raidDaysOf(ats, [4, 3])) !== '3,4' || String(RD.raidDaysOf(ats, [5])) !== '5') say('raid days', 'days', 'the lead\'s Raid days don\'t win over the rule'); }
tierCount().then(() => {
const by = new Map(); for (const x of P) { const a = by.get(x.pull) || []; a.push(x); by.set(x.pull, a); }
// (the same problem on many pulls prints once per pull, at most 12 lines a pull)
for (const [pull, l] of by) { console.log('\n' + pull + ':'); const u = [...new Set(l.map((x) => '  [' + x.kind + '] ' + x.msg))]; u.slice(0, 12).forEach((x) => console.log(x)); if (u.length > 12) console.log('  ... and ' + (u.length - 12) + ' more'); }
const total = new Set(P.map((x) => x.pull + x.msg)).size;
console.log('\nContradiction check: ' + n + ' pull(s) in ' + Math.round((Date.now() - t0) / 1000) + ' s (' + TIER_T.size + ' night(s) of a boss on the Whole tier), ' + (total ? total + ' problem(s)' : 'no contradictions'));
process.exit(total ? 1 : 0); });
