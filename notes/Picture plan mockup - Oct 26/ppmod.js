// Picture plan (Oct 26): add the module (pp_mod.js) to the end of guides.js
const fs = require('fs'), path = require('path'), dir = process.argv[2];
const f = path.join(dir, 'guides.js'); let s = fs.readFileSync(f, 'utf8'); if (s.includes('\r')) throw new Error('CR');
if (s.includes('// ---- Picture plan (Oct 26')) throw new Error('already in');
if (!s.endsWith('\ngdzUnlock();\n')) throw new Error('end anchor');
s += fs.readFileSync(path.join(__dirname, 'pp_mod.js'), 'utf8').replace(/\r/g, '').replace(/^\n+/, '');
fs.writeFileSync(f, s); console.log('ppmod ok');
