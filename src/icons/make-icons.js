// Draw icon.svg into canvases at each size in headless Edge, save the PNGs, and pack favicon.ico (16 + 32 + 48 PNGs).
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const DIR = __dirname, PORT = 9343;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const prof = path.join(DIR, 'profile-icons'); fs.rmSync(prof, { recursive: true, force: true });
const edge = spawn(EDGE, ['--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + prof, '--allow-file-access-from-files', '--no-first-run', 'about:blank']);
(async () => {
  let tgt; for (let i = 0; i < 40 && !tgt; i++) { await sleep(400); try { tgt = (await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json()).find((t) => t.type === 'page'); } catch {} }
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const wait = new Map();
  ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await cmd('Page.enable');
  const svg = fs.readFileSync(path.join(DIR, 'icon.svg'), 'utf8'), svgM = fs.readFileSync(path.join(DIR, 'icon-mask.svg'), 'utf8');
  await cmd('Page.navigate', { url: 'about:blank' }); await sleep(500);
  const sizes = [16, 32, 48, 180, 192, 512];
  const expr = `(async () => { const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(${JSON.stringify(svg)});
    const img = new Image(); img.src = url; await img.decode(); const out = {};
    for (const n of ${JSON.stringify(sizes)}) { const c = document.createElement('canvas'); c.width = n; c.height = n; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, n, n); out[n] = c.toDataURL('image/png'); }
    const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(${JSON.stringify(svgM)}); await im.decode(); const c = document.createElement('canvas'); c.width = 512; c.height = 512; c.getContext('2d').drawImage(im, 0, 0, 512, 512); out.mask = c.toDataURL('image/png'); return out; })()`;
  const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  const out = r.result.result.value;
  const buf = {};
  for (const n of sizes) { buf[n] = Buffer.from(out[n].split(',')[1], 'base64'); }
  fs.writeFileSync(path.join(DIR, 'apple-touch-icon.png'), buf[180]);
  fs.writeFileSync(path.join(DIR, 'icon-192.png'), buf[192]);
  fs.writeFileSync(path.join(DIR, 'icon-512.png'), buf[512]);
  fs.writeFileSync(path.join(DIR, 'icon-32.png'), buf[32]); fs.writeFileSync(path.join(DIR, 'icon-maskable-512.png'), Buffer.from(out.mask.split(',')[1], 'base64'));
  // favicon.ico holding PNG images (supported by every current browser)
  const imgs = [16, 32, 48].map((n) => ({ n, b: buf[n] }));
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(imgs.length, 4);
  let off = 6 + 16 * imgs.length; const dir = [];
  for (const { n, b } of imgs) { const e = Buffer.alloc(16); e.writeUInt8(n, 0); e.writeUInt8(n, 1); e.writeUInt8(0, 2); e.writeUInt8(0, 3); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6); e.writeUInt32LE(b.length, 8); e.writeUInt32LE(off, 12); dir.push(e); off += b.length; }
  fs.writeFileSync(path.join(DIR, 'favicon.ico'), Buffer.concat([head, ...dir, ...imgs.map((i) => i.b)]));
  for (const f of ['icon-maskable-512.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-32.png', 'favicon.ico']) console.log(f, fs.statSync(path.join(DIR, f)).size);
  ws.close(); edge.kill();
})().catch((e) => { console.log('ERR', e); edge.kill(); });
