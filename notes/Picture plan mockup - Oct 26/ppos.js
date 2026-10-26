// node ppos.js <pull .gz> [mode] : read one saved pull (V22 lines) for the picture plan: who carried which orb and where they stood.
// Positions are in the room's frame (x east, y north, yards from The Coiled Altar's middle: x = -posY, y = posX - 1158).
const fs = require('fs'), zlib = require('zlib');
const file = process.argv[2], mode = process.argv[3] || 'auras';
const raw = fs.readFileSync(file), txt = (/\.gz$/.test(file) ? zlib.gunzipSync(raw) : raw).toString('utf8').split('\n');
const split = (s) => { const out = []; let cur = '', q = false; for (let i = 0; i < s.length; i++) { const c = s[i]; if (c === '"') q = !q; else if (c === ',' && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out; };
const sec = (ts) => { const m = ts.match(/(\d+):(\d+):(\d+\.\d+)/); return +m[1] * 3600 + +m[2] * 60 + +m[3]; };
let t0 = null; const names = new Map(), pos = new Map(), ev = [];
for (const line of txt) {
  const sp = line.indexOf('  '); if (sp < 0) continue; const ts = sec(line.slice(0, sp)), f = split(line.slice(sp + 2)), e = f[0];
  if (e === 'ENCOUNTER_START') { t0 = ts; continue; } if (t0 == null) continue; const t = +(ts - t0).toFixed(2);
  if (f[1] && f[2]) names.set(f[1], f[2].replace(/"/g, '').split('-')[0]); if (f[5] && f[6]) names.set(f[5], f[6].replace(/"/g, '').split('-')[0]);
  const base = e.startsWith('SWING') ? 9 : /^(SPELL|RANGE)/.test(e) && !/AURA|DISPEL|INTERRUPT|MISSED|STOLEN/.test(e) ? 12 : null;
  if (base && f.length >= base + 19 && /^(Player|Creature|Pet|Vehicle)-/.test(f[base])) { const g = f[base], px = +f[base + 14], py = +f[base + 15];
    if (px || py) { if (!pos.has(g)) pos.set(g, []); pos.get(g).push([t, -py, px - 1158]); } }
  ev.push({ t, e, sg: f[1], sn: (f[2] || '').replace(/"/g, '').split('-')[0], dg: f[5], dn: (f[6] || '').replace(/"/g, '').split('-')[0], id: +f[9], spell: (f[10] || '').replace(/"/g, '') });
}
const where = (g, t) => { const p = pos.get(g); if (!p) return null; let best = null; for (const q of p) if (!best || Math.abs(q[0] - t) < Math.abs(best[0] - t)) best = q; return best && Math.abs(best[0] - t) < 3 ? [Math.round(best[1]), Math.round(best[2])] : null; };
const nm = (g) => names.get(g) || g;
module.exports = { ev, pos, names, where, nm };
if (require.main !== module) return;
if (mode === 'auras') { const c = new Map(); for (const x of ev) if (/AURA_APPLIED$/.test(x.e) && /^Player/.test(x.dg)) { const k = x.id + ' ' + x.spell; c.set(k, (c.get(k) || 0) + 1); }
  console.log([...c].filter(([k]) => /venom|mutag|virul|orb|toxic|deluge|soul|frag|spirit|guill|dread|gloom|grave/i.test(k)).sort((a, b) => b[1] - a[1]).map(([k, n]) => n + '  ' + k).join('\n'));
  const casts = new Map(); for (const x of ev) if (x.e === 'SPELL_CAST_SUCCESS' && /^Creature/.test(x.sg)) { const k = x.sn + ': ' + x.id + ' ' + x.spell; if (!casts.has(k)) casts.set(k, []); casts.get(k).push(x.t); }
  console.log([...casts].map(([k, l]) => k + ' @ ' + l.map((t) => t.toFixed(0)).join(',')).join('\n')); }
