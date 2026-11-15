// The page check (Nov 13, Main: "a pin isn't enough here. This regression got past every check we have, which is exactly what Flex means by 'they keep coming back'").
// It opens the BUILT app in a headless Edge, gives it a saved pull as a combat log (no network, no sign-in), and reads what the page itself shows:
// Summary's header must name the root cause the page computed (window.wipeRoot), whatever the rows of How it went say.
// The bug it was written for: Nov 11 The Coiled Altar pull 2. Summary's header is written by the page shell, and it only wrote "Root cause: ..." when a row
// of How it went named a mechanic or said "died to X". On af80e9fc the pull's only row became "Schooty walked off the edge", and the header read
// "It started at 1:23: Schooty walked off the edge" with the real cause ("Schooty's purple orb touched other orbs") pushed down under It added up with.
// No Node test could see it: the header is decided in the page's own DOM code. This one runs that code. On that build it fails, naming the pull.
//   node tests/header-page.mjs                  every wipe the build's quick check reads, and Nov 11 pull 2 (about 40 s; src/build.ps1 runs it)
//   node tests/header-page.mjs --all            every saved wipe of the test nights (a sweep, about 8 minutes)
//   node tests/header-page.mjs <code>:<fight>   those pulls only;  --html <file>: another build of the app
// It needs the log library (C:\Users\james\DebriefLogs, or DEBRIEF_LOGS) and Edge or Chrome; without them it says so and passes.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), here = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(here, '..');
const args = process.argv.slice(2), ALL = args.includes('--all'), hi = args.indexOf('--html'), HTML = path.resolve(hi >= 0 ? args[hi + 1] : path.join(ROOT, 'WoW-Log-Analyzer.html'));
const LIB = process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs', T0 = Date.now();
const done = (line, code) => { console.log('Page check: ' + line); process.exit(code || 0); };
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((f) => fs.existsSync(f));
if (!fs.existsSync(path.join(LIB, 'events'))) done('skipped (no log library at ' + LIB + ')');
if (!EDGE) done('skipped (no Edge or Chrome on this PC)');
if (!fs.existsSync(HTML)) done('skipped (no built app at ' + HTML + ')');
const H = require('./site-helpers.js'), W = require('../src/wcl.js');
/* (the pulls: the quick check's own list and nights, read from tests/contradictions.js so the two never drift, and the named pull) */
const CT = fs.readFileSync(path.join(here, 'contradictions.js'), 'utf8'), listOf = (name) => { const m = new RegExp('const ' + name + ' = (\\[[^\\]]*\\]);').exec(CT); if (!m) throw new Error('tests/contradictions.js has no ' + name); return JSON.parse(m[1].replace(/'/g, '"')); };
const NAMED = { 'agt6jMTyZBYvVzAP:3': 'Nov 11 pull 2: the header read "It started at 1:23: Schooty walked off the edge" on af80e9fc, with the orb cause under It added up with' };
let keys = args.filter((a) => /^[A-Za-z0-9]{16}:\d+$/.test(a));
if (!keys.length) { keys = ALL ? [] : listOf('QUICK').concat(Object.keys(NAMED));
  if (ALL) for (const f of fs.readdirSync(path.join(LIB, 'events'))) { const m = /^([A-Za-z0-9]{16})_(\d+)\.json$/.exec(f); if (m && listOf('NIGHTS').includes(m[1])) keys.push(m[1] + ':' + m[2]); } }
keys = [...new Set(keys)];
/* (each pull as a combat log file: the translator's own lines, kept between builds while wcl.js and the saved pull don't change) */
const CACHE = path.join(LIB, 'cache', 'page-check'), TMP = path.join(os.tmpdir(), 'debrief-page-check-' + process.pid), WH = crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, 'src', 'wcl.js'))).digest('hex').slice(0, 8);
fs.mkdirSync(ALL ? TMP : CACHE, { recursive: true });
const reps = new Map(), report = (code) => { if (!reps.has(code)) { const f = path.join(LIB, 'reports', 'rep_' + code + '.json'); let o = null; if (fs.existsSync(f)) { let rr = JSON.parse(fs.readFileSync(f, 'utf8')); rr = rr.data || (rr.reportData ? rr.reportData.report : rr); o = H.pullItems(code, rr, W); } reps.set(code, o); } return reps.get(code); };
const logOf = (code, fight, it) => { const ef = path.join(LIB, 'events', code + '_' + fight + '.json'), st = fs.statSync(ef), tag = code + '_' + fight + '_', name = tag + WH + '-' + st.size + '.txt', dir = ALL ? TMP : CACHE, out = path.join(dir, name);
  if (fs.existsSync(out)) return out; if (!ALL) for (const f of fs.readdirSync(dir)) if (f.startsWith(tag)) fs.rmSync(path.join(dir, f), { force: true }); /* (an older copy of this pull) */
  let ev = JSON.parse(fs.readFileSync(ef, 'utf8')); if (!Array.isArray(ev)) ev = ev.events; fs.writeFileSync(out, W.translate(it, ev)); return out; };
const pulls = []; for (const k of keys) { const [code, f] = k.split(':'), fight = +f, items = report(code), it = items && items.get(fight); if (!it || it.kill || !fs.existsSync(path.join(LIB, 'events', code + '_' + fight + '.json'))) continue; /* (a kill has no wipe cause; a pull not in this library is left out) */ pulls.push({ key: k, code, fight, it }); }
if (!pulls.length) done('skipped (none of the pulls are in this log library)');
/* (the browser) */
const prof = path.join(os.tmpdir(), 'debrief-page-check-prof-' + process.pid), port = 9300 + Math.floor(Math.random() * 500);
const ed = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--remote-debugging-port=' + port, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bye = async (line, code) => { try { ed.kill(); } catch (e) { /* (gone) */ } await sleep(800); for (const d of [prof, TMP]) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* (the browser may still hold it) */ } } done(line, code); };
let ver = null; for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); } catch (e) { await sleep(300); } }
if (!ver) await bye('skipped (the browser did not start)');
const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const waits = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && waits.has(d.id)) { waits.get(d.id)(d); waits.delete(d.id); } });
const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const APP = pathToFileURL(HTML).href;
/* (what the page shows, read in the page: the header, the root cause the page computed for the pull on screen, and a sentence that should never be there) */
const READ = '(function () { var h2 = document.querySelector("#view .dbt-why h2"), wp = document.querySelector("#view .cch-trc"), rt = null, err = ""; try { rt = window.wipeRoot ? window.wipeRoot() : null; } catch (e) { err = String(e); } var t = document.body.innerText, bad = /(died to|[Kk]illed by) (Fell off the edge|No killing hit)/.exec(t);' +
  ' return JSON.stringify({ h2: h2 ? h2.innerText.replace(/\\s+/g, " ").trim() : null, wip: wp ? wp.innerText.replace(/\\s+/g, " ").trim() : null, root: rt && rt.line ? { name: String(rt.name || ""), short: String(rt.short || ""), unsure: !!rt.unsure } : null, err: err, tab: ((document.querySelector(".tab.on") || {}).innerText || "").trim(), view: (document.querySelector("#view") || { innerText: "" }).innerText.length, reset: !!document.querySelector("#view .dbt-why.wrt-reset"), bad: bad ? t.slice(Math.max(0, bad.index - 60), bad.index + 60).replace(/\\s+/g, " ") : "" }); })()';
const one = async (p) => { const file = logOf(p.code, p.fight, p.it), t = await send('Target.createTarget', { url: 'about:blank' }), tid = t.result.targetId, a = await send('Target.attachToTarget', { targetId: tid, flatten: true }), sid = a.result.sessionId;
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sid); return r.result && r.result.result ? r.result.result.value : null; };
  try { await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false }, sid); await send('Page.enable', {}, sid); await send('Runtime.enable', {}, sid);
    await send('Page.addScriptToEvaluateOnNewDocument', { source: "try{localStorage.setItem('wla-tour-done','1')}catch(e){}" }, sid); await send('Page.navigate', { url: APP }, sid);
    let ready = false; for (let i = 0; i < 80 && !ready; i++) { await sleep(250); ready = !!(await ev('!!(document.getElementById("fileIn") && document.getElementById("fileIn").onchange)')); }
    if (!ready) return { p, fail: 'the app did not start in the browser' };
    const given = await ev('new Promise(function (res) { var x = new XMLHttpRequest(); x.open("GET", ' + JSON.stringify(pathToFileURL(file).href) + '); x.onload = function () { try { document.getElementById("fileIn").onchange({ target: { files: [new File([x.responseText], "WoWCombatLog.txt", { type: "text/plain" })] } }); res("ok"); } catch (e) { res("ERR " + e); } }; x.onerror = function () { res("the log file could not be read by the page"); }; x.send(); })');
    if (given !== 'ok') return { p, fail: String(given) };
    /* (wait for Summary, then for the page's own tidy passes: they run on timers for about 3 s after a render) */
    let o = null, seen = 0; for (let i = 0; i < 90; i++) { await sleep(500); o = JSON.parse((await ev(READ)) || 'null'); if (!o) continue; const want = o.root ? 'Root cause: ' + o.root.name : null;
      if (o.h2 != null || o.wip != null || (o.tab && o.view > 400)) seen++; if (o.h2 != null && want && o.h2.indexOf(want) === 0 && seen >= 3) break; if (seen >= 14) break; }
    return { p, o };
  } finally { await send('Target.closeTarget', { targetId: tid }); } };
/* (three pulls at a time) */
const out = [], queue = pulls.slice(); await Promise.all([0, 1, 2].map(async () => { while (queue.length) { const p = queue.shift(); try { out.push(await one(p)); } catch (e) { out.push({ p, fail: 'the page check crashed: ' + e.message }); } } }));
const problems = [], label = (p) => p.it.boss + ' ' + (p.it.diff || '') + ' pull ' + p.it.pull + ' (' + p.key + ')'; let withRoot = 0;
for (const x of out.sort((a, b) => keys.indexOf(a.p.key) - keys.indexOf(b.p.key))) { const p = x.p, o = x.o, nm = NAMED[p.key] ? ' [' + NAMED[p.key] + ']' : '';
  if (x.fail || !o) { problems.push(label(p) + ': ' + (x.fail || 'the page gave no reading') + nm); continue; }
  if (o.err) problems.push(label(p) + ': the page could not compute its root cause: ' + o.err + nm);
  if (o.bad) problems.push(label(p) + ': the page says a player died to a no-killing-hit label: "' + o.bad + '"');
  if (!o.root) continue; withRoot++; /* (no root cause for this wipe, a reset among them: the older headline stands) */
  const want = 'Root cause: ' + o.root.name;
  /* (the other Summary layout, the coach card, has no Why we wiped box: its "What wiped us" line must name the same mechanic) */
  if (o.h2 == null && o.wip != null) { const base = o.root.name.replace(/\s*\(.*$/, '').toLowerCase(); if (o.wip.toLowerCase().indexOf(base) < 0) problems.push(label(p) + ': Summary\'s What wiped us reads "' + o.wip + '", but the root cause the page computed is "' + o.root.name + '"' + nm); continue; }
  if (o.h2 == null) problems.push(label(p) + ': Summary shows no Why we wiped header, and the page computed the root cause "' + o.root.name + '"' + nm);
  else if (o.h2.indexOf(want) !== 0 && !o.reset) problems.push(label(p) + ': Summary\'s header reads "' + o.h2 + '", but the root cause the page computed is "' + o.root.name + '" (' + o.root.short + ')' + nm); }
for (const k of Object.keys(NAMED)) if (!ALL && !args.some((a) => /^[A-Za-z0-9]{16}:\d+$/.test(a)) && !out.some((x) => x.p.key === k)) console.log('  (' + k + ' is not in this log library: ' + NAMED[k].split(':')[0] + ' was not read)');
for (const l of problems) console.log('  ' + l);
await bye(out.length + ' pull(s) in ' + Math.round((Date.now() - T0) / 1000) + ' s (' + withRoot + ' with a root cause), ' + (problems.length ? problems.length + ' problem(s)' : 'the header names the root cause on every one'), problems.length ? 1 : 0);
