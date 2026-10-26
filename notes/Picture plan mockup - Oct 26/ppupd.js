// Picture plan: swap the module in guides.js (from its heading to the end of the file, where it sits) for the newest pp_mod.js
const fs = require('fs'), path = require('path'), dir = process.argv[2];
const f = path.join(dir, 'guides.js'); let s = fs.readFileSync(f, 'utf8'); if (s.includes('\r')) throw new Error('CR');
const i = s.indexOf('// ---- Picture plan (Oct 26'); if (i < 0 || s.indexOf('// ---- Picture plan (Oct 26', i + 1) > 0) throw new Error('heading');
const tail = s.slice(i); if (!/\n\}\n$/.test(tail) || !tail.includes("document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#ppWin'))")) throw new Error('not at the end of the file');
s = s.slice(0, i) + fs.readFileSync(path.join(__dirname, 'pp_mod.js'), 'utf8').replace(/\r/g, '').replace(/^\n+/, '');
fs.writeFileSync(f, s); console.log('ppupd ok');
