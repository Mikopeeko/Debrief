// A pull's grade never depends on which other pulls of the night happen to be loaded (Main's ruling, Nov 15, on Wolfthorn Thu Nov 12 Ula'tek pull 11,
// report Gax3AkbyFRXmdrgQ fight 21, found by the night open speed work). Summary's Pull score read 65 on one copy of the site and 66 on another:
// Big cooldowns counts a cooldown only if the player pressed it in some loaded pull of that boss (Huservoker pressed Rewind in pulls 8, 10 and 13, not
// in 11), and the grade caches (PL_MEMO, GEN_MEMO, CDN_C, SUM5_D) kept whatever was worked out first. A page that graded pull 11 before the rest of the
// night had loaded kept "1 of 1" and Dragooned's Rotation 81 for good: 65.53, so 66. The whole-night answer is 65, "1 of 2", 77.
// This opens the BUILT app in a headless Edge with that night as a combat log (no network, no sign-in; spell cooldowns from
// tests/grade-order-cooldowns.json, as the site reads them from the spells' tooltips), and inside the page's own code grades pull 11 with the night
// loaded in three orders (pull 11 first, the rest first, half and half), grading at every step as the page would. The final grades must be identical,
// with Pull score 65, Huservoker's Big cooldowns "1 of 2 possible uses" and Dragooned's Rotation 77. Then the page itself: pull 11 open on Summary
// with only itself loaded, the rest of the night arriving: Summary's scores must change to 65 in place, with no full redraw of the page.
//   node tests/grade-order.mjs [--html <file>]     (about a minute; src/build.ps1 runs it after the page check)
// It needs the log library (C:\Users\james\DebriefLogs, or DEBRIEF_LOGS) and Edge or Chrome; without them it says so and passes.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(here, '..');
const args = process.argv.slice(2), hi = args.indexOf('--html'), HTML = path.resolve(hi >= 0 ? args[hi + 1] : path.join(ROOT, 'WoW-Log-Analyzer.html'));
const LIB = process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs', T0 = Date.now(), CODE = 'Gax3AkbyFRXmdrgQ', WHERE = "Wolfthorn Thu Nov 12 Ula'tek pull 11 (" + CODE + ' fight 21)';
const done = (line, code) => { console.log('Grade order: ' + line); process.exit(code || 0); };
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find((f) => fs.existsSync(f));
if (!fs.existsSync(path.join(LIB, 'events', CODE + '_21.json'))) done('skipped (no log library at ' + LIB + ')');
if (!EDGE) done('skipped (no Edge or Chrome on this PC)');
if (!fs.existsSync(HTML)) done('skipped (no built app at ' + HTML + ')');
const H = require('./site-helpers.js'), W = require('../src/wcl.js');
/* (the night as one combat log: Ula'tek Mythic's 13 pulls, fights 11 to 23, the translator's own lines in order) */
let rr = JSON.parse(fs.readFileSync(path.join(LIB, 'reports', 'rep_' + CODE + '.json'), 'utf8')); rr = rr.data || (rr.reportData ? rr.reportData.report : rr);
const items = H.pullItems(CODE, rr, W), fights = [...items.keys()].filter((f) => f >= 11 && f <= 23 && items.get(f).boss === "Ula'tek").sort((a, b) => a - b);
if (fights.length !== 13) done('skipped (the library has ' + fights.length + " of the night's 13 Ula'tek pulls)");
const TMP = path.join(os.tmpdir(), 'debrief-grade-order-' + process.pid); fs.mkdirSync(TMP, { recursive: true });
const LOG = path.join(TMP, 'WoWCombatLog.txt');
fs.writeFileSync(LOG, fights.map((f) => { let ev = JSON.parse(fs.readFileSync(path.join(LIB, 'events', CODE + '_' + f + '.json'), 'utf8')); if (!Array.isArray(ev)) ev = ev.events; return W.translate(items.get(f), ev); }).join('\n'));
const CDS = JSON.parse(fs.readFileSync(path.join(here, 'grade-order-cooldowns.json'), 'utf8'));
/* (the browser) */
const prof = path.join(TMP, 'prof'), port = 9300 + Math.floor(Math.random() * 500);
const ed = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--user-data-dir=' + prof, '--remote-debugging-port=' + port, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bye = async (line, code) => { try { ed.kill(); } catch (e) { /* (gone) */ } await sleep(800); try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* (the browser may still hold it) */ } done(line, code); };
let ver = null; for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); } catch (e) { await sleep(300); } }
if (!ver) await bye('skipped (the browser did not start)');
const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json(), page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0, paused = null; const waits = new Map(), errs = [];
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.method === 'Debugger.paused') paused = d.params; if (d.method === 'Runtime.exceptionThrown') errs.push(String((d.params.exceptionDetails.exception || {}).description || d.params.exceptionDetails.text).slice(0, 200));
  if (d.id && waits.has(d.id)) { waits.get(d.id)(d); waits.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); return r.result && r.result.result ? r.result.result.value : null; };
/* (runs code inside the page's own scripts (where CACHE, plData and the grade caches live), by pausing in one of its functions; the code puts its answer on window.__go) */
const inPage = async (code) => { paused = null; const fn = await send('Runtime.evaluate', { expression: 'window.refreshPullSel' }); const oid = fn.result && fn.result.result && fn.result.result.objectId; if (!oid) return 'no hook';
  await send('Debugger.enable'); const bp = await send('Debugger.setBreakpointOnFunctionCall', { objectId: oid }); send('Runtime.evaluate', { expression: 'window.refreshPullSel()' });
  for (let i = 0; i < 100 && !paused; i++) await sleep(50); if (!paused) return 'did not pause';
  const r = await send('Debugger.evaluateOnCallFrame', { callFrameId: paused.callFrames[0].callFrameId, expression: code, returnByValue: true });
  if (bp.result && bp.result.breakpointId) await send('Debugger.removeBreakpoint', { breakpointId: bp.result.breakpointId }); await send('Debugger.resume'); await send('Debugger.disable');
  return r.result && r.result.exceptionDetails ? 'threw: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300) : 'ok'; };
const result = async (secs) => { for (let i = 0; i < secs * 2; i++) { await sleep(500); const v = await ev('window.__go || null'); if (v) return JSON.parse(v); } return null; };
try {
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false }); await send('Page.enable'); await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{localStorage.setItem("wla-tour-done","1");var C=' + JSON.stringify(CDS) + ';for(var k in C)localStorage.setItem(k,C[k]);}catch(e){}' });
  await send('Page.navigate', { url: pathToFileURL(HTML).href });
  let ready = false; for (let i = 0; i < 80 && !ready; i++) { await sleep(250); ready = !!(await ev('!!(document.getElementById("fileIn") && document.getElementById("fileIn").onchange && window.refreshPullSel)')); }
  if (!ready) await bye('FAILED: the app did not start in the browser', 1);
  const given = await ev('new Promise(function (res) { var x = new XMLHttpRequest(); x.open("GET", ' + JSON.stringify(pathToFileURL(LOG).href) + '); x.onload = function () { try { document.getElementById("fileIn").onchange({ target: { files: [new File([x.responseText], "WoWCombatLog.txt", { type: "text/plain" })] } }); res("ok"); } catch (e) { res("ERR " + e); } }; x.onerror = function () { res("the log file could not be read by the page"); }; x.send(); })');
  if (given !== 'ok') await bye('FAILED: ' + given, 1);
  let n = 0; for (let i = 0; i < 240; i++) { await sleep(500); n = await ev('(document.querySelectorAll("select.r300-pull option").length || 0)'); if (n >= 13 && !(await ev('/Reading the (log|night|pull)/.test(document.body.innerText)'))) break; }
  /* (1) the grade in three load orders, grading at every step as the page would (each order starts from a fresh page: no grade kept) */
  const SCEN = `(async () => { try {
    const items = ((S.index && S.index.bosses) || []).filter((b) => b.boss === "Ula'tek" && b.diffId === 16).sort((a, b) => a.pull - b.pull);
    if (items.length !== 13) { window.__go = JSON.stringify({ err: 'the page has ' + items.length + " Ula'tek Mythic pulls" }); return; }
    const reps = new Map(); for (const it of items) reps.set(it.pull, await getRep(it));
    const r11 = reps.get(11), others = items.map((b) => b.pull).filter((p) => p !== 11);
    const fresh = () => { PL_MEMO.length = 0; GEN_MEMO.clear(); CDN_C.clear(); SEEN_CD.clear(); SUM5_D.clear(); try { SUM5_LAST.clear(); SUM5_NS.clear(); } catch (e) { /* (an older page) */ } };
    const setLoaded = (L) => { for (const it of items) CACHE.delete(it); for (const p of L) CACHE.set(items[p - 1], reps.get(p)); };
    const grade = async () => { const data = await plData([r11], () => true), c = { reps: [r11], data }, N = raidCardNums(c), F = N.F;
      const row = (nm, l) => { const a = data.find((x) => x.p.name === nm), y = a && rqcOf(c, F, a).rows.perf.find((q) => q.l === l); return y ? String(y.v) : null; };
      return { night: N.night, perf: N.perf, mech: N.mech, alive: N.alive, prep: N.prep, hus: row('Huservoker', 'Big cooldowns'), dra: row('Dragooned', 'Rotation'), wait: data.some((a) => a.wait) }; };
    const ORD = { 'pull 11 first': [[11], others], 'the rest first': [others, [11]], 'half and half': [[11].concat(others.slice(0, 6)), others.slice(6)] }, out = {};
    for (const [nm, steps] of Object.entries(ORD)) { fresh(); const L = []; for (const st of steps) { L.push(...st); setLoaded(L); if (L.includes(11)) await grade(); } out[nm] = await grade(); }
    setLoaded(items.map((b) => b.pull)); fresh(); const ref = await grade(); fresh(); /* (the whole-night answer: the whole night loaded on a fresh page, graded once) */
    /* (Main's review, Nov 15: right after the Rotation tab showed All pulls (SPC_REPS = the whole night), pull 11 graded for Summary is the same grade) */
    let spc = null; try { SPC_REPS = items.map((b) => reps.get(b.pull)); spc = await grade(); } finally { SPC_REPS = []; fresh(); }
    window.__go = JSON.stringify({ ref, out, spc }); } catch (e) { window.__go = JSON.stringify({ err: String(e && e.stack || e).slice(0, 300) }); } })()`;
  const s1 = await inPage(SCEN); if (s1 !== 'ok') await bye('FAILED: could not run the grades inside the page (' + s1 + ')', 1);
  const G = await result(240); if (!G || G.err) await bye('FAILED: ' + (G ? G.err : 'the grades did not finish'), 1);
  const problems = [], fmt = (o) => 'Pull score ' + o.night.toFixed(3) + ' (shows ' + Math.round(o.night) + '), Huservoker\'s Big cooldowns "' + o.hus + '", Dragooned\'s Rotation ' + o.dra;
  /* (every order must end on the whole-night answer, field for field. Offline the page has no Warcraft Logs or Wowhead (top players' casts, gear
     names), so its Pull score and Dragooned's Rotation read lower than the site's 65 and 77 (64 and 69); Huservoker's Big cooldowns, the row of the bug,
     is the site's "1 of 2" here too. The site's own numbers were checked on the practice link the day it was fixed) */
  const { ref, out, spc } = G, REF = Math.round(ref.night), names = Object.keys(out);
  if (!spc || ['night', 'perf', 'mech', 'alive', 'prep', 'hus', 'dra'].some((k) => spc[k] !== ref[k])) problems.push('graded right after the Rotation tab showed All pulls, pull 11 is ' + (spc ? fmt(spc) : 'nothing') + ', but on its own it is ' + fmt(ref) + ' (Potions and Big cooldowns counted over the pulls Rotation drew)');
  if (ref.hus !== '1 of 2 possible uses') problems.push('the whole night loaded, Huservoker\'s Big cooldowns reads "' + ref.hus + '"; he pressed Rewind in pulls 8, 10 and 13, so it is "1 of 2 possible uses"');
  for (const nm of names) { const o = out[nm];
    if (o.wait) problems.push(nm + ': a spell cooldown was still being looked up (tests/grade-order-cooldowns.json is missing one)');
    if (['night', 'perf', 'mech', 'alive', 'prep', 'hus', 'dra'].some((k) => o[k] !== ref[k])) problems.push('loaded "' + nm + '" the grade ends at ' + fmt(o) + ', but the whole night graded once is ' + fmt(ref)); }
  /* (2) the page itself: pull 11 open on Summary with only itself loaded, then the rest of the night arrives: the scores change in place, no full redraw */
  const PAGE = `(async () => { try { window.__go = null; const REF = '${REF}', REFN = ${ref.night};
    const items = ((S.index && S.index.bosses) || []).filter((b) => b.boss === "Ula'tek" && b.diffId === 16).sort((a, b) => a.pull - b.pull), reps = new Map();
    for (const it of items) reps.set(it.pull, CACHE.get(it) || await getRep(it));
    PL_MEMO.length = 0; GEN_MEMO.clear(); CDN_C.clear(); SEEN_CD.clear(); SUM5_D.clear(); try { SUM5_LAST.clear(); SUM5_NS.clear(); } catch (e) { /* (an older page) */ }
    for (const it of items) if (it.pull !== 11) CACHE.delete(it);
    S.tab = 'audit'; S.scope = 'pull'; await select(items[10]);
    const score = () => { const b = document.querySelector('#main:not(.dbr-snap) #view .sc5 .sc5-n[data-k="night"] .sc5-v') || document.querySelector('#main:not(.dbr-snap) #view .sc5 .sc5-v'); return b ? b.textContent.trim() : ''; };
    for (let i = 0; i < 120 && !/^\\d+$/.test(score()); i++) await new Promise((r) => setTimeout(r, 250));
    const before = score(), v0 = document.querySelector('#main:not(.dbr-snap) #view'); let draws = 0;
    const mo = new MutationObserver((ms) => { for (const m of ms) for (const x of m.addedNodes) if (x.id === 'view') draws++; }); mo.observe(document.getElementById('main'), { childList: true });
    for (const it of items) if (it.pull !== 11) CACHE.set(it, reps.get(it.pull));
    /* (the exact score Summary holds for pull 11 with the whole night loaded: worked out again in place, it equals the whole night graded once) */
    const held = () => { const it0 = S.rep.item; let dk0 = 'p|' + it0.id + ':' + it0.diffId + ':' + it0.pull + ':' + (it0.startMs || '') + '|' + deathCutN(); try { dk0 = sum5Key0(it0, true); } catch (e) { /* (an older page: no report in the key) */ } let D = null; try { D = SUM5_D.get(dk0 + '|' + bossLoaded(it0.boss)); } catch (e) { D = SUM5_D.get(dk0); } return D && D.N ? D.N.night : null; };
    let after = before, full = null; for (let i = 0; i < 200; i++) { await new Promise((r) => setTimeout(r, 250)); after = score(); full = held(); if (full != null && Math.abs(full - REFN) < 1e-9 && after === REF) break; }
    mo.disconnect();
    /* (and coming back: leave pull 11 while a pull of the night is missing, come back: the last scores show at once, then the whole-night grade once it's in) */
    const same0 = document.querySelector('#main:not(.dbr-snap) #view') === v0;
    CACHE.delete(items[0]); await select(items[11]); await new Promise((r) => setTimeout(r, 1500)); await select(items[10]); let back = ''; for (let i = 0; i < 20 && !/^\\d+$/.test(back); i++) { await new Promise((r) => setTimeout(r, 150)); back = score(); }
    CACHE.set(items[0], reps.get(1)); let back2 = null; for (let i = 0; i < 200; i++) { await new Promise((r) => setTimeout(r, 250)); back2 = held(); if (back2 != null && Math.abs(back2 - REFN) < 1e-9 && score() === REF) break; }
    const box = document.querySelector('#main:not(.dbr-snap) #view .sc5'); window.__go = JSON.stringify({ before, after, full, back, back2, backShown: score(), draws, same: same0, why: [...SUM5_D].map(([k, d]) => k.slice(0, 40) + '…' + (d.busy ? ' busy' : d.N ? ' ' + Math.round(d.N.night) : d.err ? ' err' : ' ?')).join(' | ') + ' · box ' + (box ? box.textContent.replace(/s+/g, ' ').slice(0, 80) : 'none') + ' · tab ' + S.tab + ' · rep ' + (S.rep && S.rep.item && S.rep.item.pull) });
  } catch (e) { window.__go = JSON.stringify({ err: String(e && e.stack || e).slice(0, 300) }); } })()`;
  const s2 = await inPage(PAGE); let P = null;
  if (s2 !== 'ok') problems.push('could not open pull 11 inside the page (' + s2 + ')');
  else { P = await result(150);
    if (!P || P.err) problems.push('the page part: ' + (P ? P.err : 'did not finish'));
    else { if (P.full == null || Math.abs(P.full - ref.night) > 1e-9) problems.push('Summary on pull 11, opened before the rest of the night, holds Pull score ' + (P.full == null ? 'none' : P.full.toFixed(3)) + ' once the night has arrived; the whole night graded once is ' + ref.night.toFixed(3) + ' (it was not worked out again)');
      if (P.after !== String(REF)) problems.push('Summary on pull 11 opened before the rest of the night showed Pull score ' + P.before + ', and ' + P.after + ' once the night arrived; the whole night says ' + REF + ' (' + P.why + ')');
      if (!/^\d+$/.test(P.back || '')) problems.push('coming back to pull 11 while a pull of the night was still missing, Summary showed "' + (P.back || 'nothing') + '" instead of the last scores');
      if (P.back2 == null || Math.abs(P.back2 - ref.night) > 1e-9 || P.backShown !== String(REF)) problems.push('coming back to pull 11, Summary ended on Pull score ' + (P.back2 == null ? 'none' : P.back2.toFixed(3)) + ' (shows ' + P.backShown + ') once the night was in; the whole night graded once is ' + ref.night.toFixed(3));
      if (P.draws || !P.same) problems.push('the rest of the night arriving redrew the whole page (' + P.draws + ' time(s)); only the scores should change'); } }
  if (errs.length) problems.push('page errors: ' + errs.slice(0, 3).join(' | '));
  if (problems.length) { problems.forEach((p) => console.log('  ' + WHERE + ': ' + p)); await bye(problems.length + ' problem(s)', 1); }
  await bye('pull 11 graded in 3 load orders in ' + Math.round((Date.now() - T0) / 1000) + ' s: ' + fmt(ref) + ' every time, and the same right after the Rotation tab showed All pulls; Summary worked it out again in place as the night arrived (' + P.before + ' -> ' + P.after + ', ' + P.full.toFixed(3) + '), no full redraw, and coming back to the pull showed the last scores at once', 0);
} catch (e) { await bye('FAILED: the check crashed: ' + (e.stack || e.message).split('\n')[0], 1); }
