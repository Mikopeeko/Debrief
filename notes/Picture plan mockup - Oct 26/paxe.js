// node paxe.js <pull> : where each Guillotine was soaked (players getting the soak debuff 1307425/1307652 at the same moment) and the boss spot
const { ev, pos, where, nm } = require('./ppos.js');
const g = ev.filter((x) => /AURA_APPLIED$/.test(x.e) && (x.id === 1307425 || x.id === 1307652 || /Guillotine/.test(x.spell)) && /^Player/.test(x.dg));
const by = []; for (const x of g) { let b = by.find((q) => Math.abs(q.t - x.t) < 2 && q.id === x.id); if (!b) by.push(b = { t: x.t, id: x.id, spell: x.spell, p: [] }); const w = where(x.dg, x.t); if (w) b.p.push([nm(x.dg), w]); }
for (const b of by) { const c = b.p.length ? [Math.round(b.p.reduce((a, q) => a + q[1][0], 0) / b.p.length), Math.round(b.p.reduce((a, q) => a + q[1][1], 0) / b.p.length)] : null; console.log(b.t.toFixed(0), b.id, b.spell, b.p.length, 'centre', JSON.stringify(c), b.p.map((q) => q[0]).join(',')); }
