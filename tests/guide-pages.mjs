// The boss guides as pages search engines can read (Oct 27, the user: "lets get my page some traffic", then "Do whatever gets me the
// most traffic"): opens every boss guide, Heroic and Mythic, in a fresh headless Edge, reads the text the page shows (phases, card
// titles, what each mechanic does, the steps, each role's job) and writes it into src/worker_template.js between the GUIDE_PAGES
// markers. The Worker serves it at /guide/<boss>/<heroic|mythic> inside the app's page, so visitors get the real guide and crawlers
// get the words even before the app runs.
// node tests/guide-pages.mjs [base url]   (default https://debriefme.io; re-run after the guides' words change, then build)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const base = (process.argv[2] || 'https://debriefme.io').replace(/\/$/, '');
const TPL = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../src/worker_template.js');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const prof = path.resolve('_gp_prof_' + Date.now()), port = 9300 + Math.floor(Math.random() * 400);
const ed = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--user-data-dir=' + prof, '--remote-debugging-port=' + port, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver = null; for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); } catch (e) { await sleep(500); } }
if (!ver) { console.error('edge did not start'); ed.kill(); process.exit(1); }
const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const waits = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && waits.has(d.id)) { waits.get(d.id)(d); waits.delete(d.id); } });
const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const evalIn = async (sid, expr) => ((await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sid)).result.result || {}).value;
const SEED = "try{localStorage.setItem('wla-tour-done','1')}catch(e){}";
const slug = (n) => n.toLowerCase().replace(/['\u2019]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// (in the page: the guide's words in order; the boss list, timeline rows, map captions and buttons are left out)
const READ = `(() => { const m = document.querySelector('#main'); if (!m) return null; const out = [], seen = new Set();
  const skip = 'nav, button, svg, .ov, .gdz-fto, .gdz-foot, .gdz-src, [aria-hidden="true"]';
  m.querySelectorAll('h3, h4, p, li').forEach((e) => { if (e.closest(skip)) return; if (e.tagName === 'LI' && e.querySelector('p, li')) return;
    /* (a short title glued to its text, "A purple touches a green The purple ring...", reads "Title: text"; a doubled first word goes) */
    const ln = (e.innerText || e.textContent).split(/\\n+/).map((x) => x.replace(/\\s+/g, ' ').trim()).filter(Boolean), f = e.firstElementChild;
    const ft = f && /^(B|STRONG|EM|SPAN|DIV)$/.test(f.tagName) ? f.textContent.replace(/\\s+/g, ' ').trim() : '';
    let t = ln.length > 1 && ln[0].length < 80 && !/[:.!?]$/.test(ln[0]) ? ln[0] + ': ' + ln.slice(1).join(' ') : ln.join(' ');
    if (ft && ft.length < 80 && !/[:.!?]$/.test(ft) && t.startsWith(ft) && /^[A-Z]/.test(t.slice(ft.length).trim())) t = ft + ': ' + t.slice(ft.length).trim();
    t = t.replace(/^(\\S+(?: \\S+)?) \\1\\b/, '$1').replace(/^([^:]{1,30}): \\1:/, '$1:');
    if (e.tagName === 'H4' && /^Your job/.test(t)) t = 'Your job';
    if (!t || t.length < 3 || seen.has(t) || /^How each fight works/.test(t)) return; /* (the page's own subtitle is the same on every guide) */ seen.add(t); out.push([e.tagName.toLowerCase(), t]); });
  return out; })()`;
const t0 = await send('Target.createTarget', { url: 'about:blank' }), sid0 = (await send('Target.attachToTarget', { targetId: t0.result.targetId, flatten: true })).result.sessionId;
await send('Page.enable', {}, sid0); await send('Runtime.enable', {}, sid0); await send('Page.addScriptToEvaluateOnNewDocument', { source: SEED }, sid0);
const pages = {};
/* (the boss list, read from src/guides.js: the guides' own order) */
const GJS = fs.readFileSync(TPL.replace(/worker_template\.js$/, 'guides.js'), 'utf8'), om = /const GDZ_ORDER = (\[[^\]]*\]);/.exec(GJS);
let order = om ? Function('return ' + om[1])() : null;
if (!order) { console.error('no guides found'); process.exit(1); }
for (const boss of order) for (const [d, D] of [['h', 'Heroic'], ['m', 'Mythic']]) {
  await send('Page.navigate', { url: base + '/?guides&boss=' + encodeURIComponent(boss) + '&d=' + d }, sid0);
  let rows = null; for (let i = 0; i < 40; i++) { await sleep(1000); const ok = await evalIn(sid0, "!!document.querySelector('.gdz-upd') && (document.querySelector('#main h2') || {}).textContent === " + JSON.stringify(boss)); if (ok) { await sleep(1500); rows = await evalIn(sid0, READ); break; } }
  if (!rows || rows.length < 5) { console.log('skip ' + boss + ' ' + D + ' (no guide text)'); continue; }
  const intro = (rows.find(([t]) => t === 'p') || [, ''])[1];
  let html = '<h1>' + esc(boss) + ' ' + D + ' guide</h1>', inList = false;
  for (const [t, x] of rows) {
    if (t === 'li') { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + esc(x) + '</li>'; continue; }
    if (inList) { html += '</ul>'; inList = false; }
    html += t === 'h3' ? '<h2>' + esc(x) + '</h2>' : t === 'h4' ? '<h3>' + esc(x) + '</h3>' : '<p>' + esc(x) + '</p>';
  }
  if (inList) html += '</ul>';
  const desc = (boss + ' ' + D + ' guide: ' + intro).replace(/\s+/g, ' ');
  pages[slug(boss) + '/' + D.toLowerCase()] = { boss, d, title: boss + ' ' + D + ' guide: mechanics, positions and every job · Debrief', desc: desc.length > 158 ? desc.slice(0, 155).replace(/\s\S*$/, '') + '…' : desc, html };
  console.log('ok   ' + boss + ' ' + D + ' (' + rows.length + ' lines)');
}
ws.close(); ed.kill(); await sleep(1500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { /* edge may still hold it */ }
const A = '/* GUIDE_PAGES:start (made by tests/guide-pages.mjs; do not edit by hand) */', B = '/* GUIDE_PAGES:end */';
let src = fs.readFileSync(TPL, 'utf8'); const block = A + '\nconst GUIDE_PAGES = ' + JSON.stringify(pages) + ';\n' + B;
if (src.includes(A)) src = src.slice(0, src.indexOf(A)) + block + src.slice(src.indexOf(B) + B.length);
else { const at = src.indexOf('const SEO_PRIVATE'); if (at < 0) { console.error('worker anchor not found'); process.exit(1); } src = src.slice(0, at) + block + '\n' + src.slice(at); }
fs.writeFileSync(TPL, src); console.log(Object.keys(pages).length + ' guide pages written into ' + TPL);
