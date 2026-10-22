// Full-page pictures of Debrief pages in a fresh headless Edge (Oct 22, the design system round).
// node shoot.mjs <base url> <out folder> [only=name,name] [dev=desktop|phone|both]
// Each page: the first-time tour and page tips are marked done before the page loads, then it waits for the page's own
// marker, settles, and saves a full-page JPEG (desktop 1366 wide, phone 390 wide).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const [base, out, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => a.split('=')));
const only = opt.only ? opt.only.split(',') : null, devs = (opt.dev || 'both') === 'both' ? ['desktop', 'phone'] : [opt.dev];
const TF = '?report=9DRWhKnZbHtQgf4a';
export const PAGES = [
  ['front', '/', '.fpx-badge'],
  ['debrief-pull', TF + '&fight=34&tab=audit', '.cch2'],
  ['debrief-all', TF + '&fight=37&tab=audit&all=1', '.cch2'],
  ['rotation', TF + '&fight=37&tab=rot'+'&p=Fl%C3%ABx%C3%B8r%C3%A7%C3%AFst', '#view .spc-hn'],
  ['graphs', TF + '&fight=37&tab=perf', '#view svg'],
  ['report-card', TF + '&fight=37&tab=player&all=1', '#view .rcb-yp, #view section'],
  ['homework', TF + '&fight=37&tab=hw&all=1'+'&p=Fl%C3%ABx%C3%B8r%C3%A7%C3%AFst', '#view section, #view .panel'],
  ['compare', TF + '&fight=37&tab=cmp', '#view .panel, #view section'],
  ['plan', '?plan', '#main .panel, #main section'],
  ['guides', '?guides&boss=The%20Twin%20Fangs&d=m', '.gdz-upd'],
  ['patch-notes', '?patchnotes', '.pn-day, .pn-card, #main h2'],
  ['addon', '?ingame', '#main .igm-cta, #main section'],
  ['shared-night', '?night=PLRbTkpI_S3vOfdSwJrDZw', '.shr-bar'],
];
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const prof = path.resolve(out, '_prof_' + Date.now()), port = 9300 + Math.floor(Math.random() * 400);
fs.mkdirSync(out, { recursive: true });
const ed = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--user-data-dir=' + prof, '--remote-debugging-port=' + port, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ver = null; for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json(); } catch (e) { await sleep(500); } }
if (!ver) { console.error('edge did not start'); ed.kill(); process.exit(1); }
const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const waits = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && waits.has(d.id)) { waits.get(d.id)(d); waits.delete(d.id); } });
const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; waits.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
const SEED = "try{['wla-tour-done'].forEach(function(k){localStorage.setItem(k,'1')});['me','live','audit','overview','rot','perf','player','hw','cmp','gdz','team','hub','ingame','night','plan','progress','home'].forEach(function(k){[''].concat(['-v1','-v2','-v3','-v4','-v5','-v6']).forEach(function(v){localStorage.setItem('wla-tips-'+k+v,'1')})});localStorage.setItem('wla-death-cut2','2')}catch(e){}";
for (const dev of devs) {
  for (const [name, q, marker] of PAGES) {
    if (only && !only.includes(name)) continue;
    const t = await send('Target.createTarget', { url: 'about:blank' }), tid = t.result.targetId;
    const a = await send('Target.attachToTarget', { targetId: tid, flatten: true }), sid = a.result.sessionId;
    const W = dev === 'phone' ? 390 : 1366, H = dev === 'phone' ? 844 : 900;
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: dev === 'phone' ? 2 : 1, mobile: dev === 'phone' }, sid);
    if (dev === 'phone') await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' }, sid);
    await send('Page.enable', {}, sid); await send('Runtime.enable', {}, sid);
    await send('Page.addScriptToEvaluateOnNewDocument', { source: SEED }, sid);
    await send('Page.navigate', { url: base.replace(/\/$/, '') + (q.startsWith('/') ? q : '/' + q) }, sid);
    let ok = false; for (let i = 0; i < 90 && !ok; i++) { await sleep(1000); const r = await send('Runtime.evaluate', { expression: '!!document.querySelector(' + JSON.stringify(marker) + ')', returnByValue: true }, sid); ok = !!(r.result && r.result.result && r.result.result.value); }
    await sleep(ok ? 4000 : 0);
    await send('Runtime.evaluate', { expression: "document.querySelectorAll('#tour,#ptip,.spc-tt').forEach(function(e){e.remove()});window.scrollTo(0,0)" }, sid);
    const lm = await send('Page.getLayoutMetrics', {}, sid), ch = Math.min(dev === 'phone' ? 5200 : 4200, Math.ceil((lm.result.cssContentSize || lm.result.contentSize).height));
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 78, captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.max(H, ch), scale: dev === 'phone' ? 0.5 : 1 } }, sid);
    const f = path.join(out, name + '-' + dev + '.jpg'); fs.writeFileSync(f, Buffer.from(shot.result.data, 'base64'));
    console.log((ok ? 'ok   ' : 'NOMARK ') + name + ' ' + dev + ' ' + Math.max(H, ch) + 'px');
    await send('Target.closeTarget', { targetId: tid });
  }
}
ws.close(); ed.kill(); await sleep(1500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { /* edge may still hold it */ }
