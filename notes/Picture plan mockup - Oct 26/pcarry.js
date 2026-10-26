// node pcarry.js <pull.gz> : each orb carry (purple 1310498 Mutagenic Venom, green 1282419 Volatile Venom): who, when, where they picked it up and dropped it
const { ev, where, nm } = require('./ppos.js');
const on = new Map();
for (const x of ev) { if (x.id !== 1310498 && x.id !== 1282419) continue; if (!/^Player/.test(x.dg)) continue; const k = x.id + x.dg;
  if (/AURA_APPLIED$/.test(x.e)) on.set(k, x.t);
  if (/AURA_REMOVED$/.test(x.e)) { const a = on.get(k); console.log((x.id === 1310498 ? 'PURPLE' : 'green ') + ' ' + nm(x.dg).padEnd(13) + ' ' + (a != null ? a.toFixed(1) : '?') + '-' + x.t.toFixed(1) + '  from ' + JSON.stringify(a != null ? where(x.dg, a) : null) + ' to ' + JSON.stringify(where(x.dg, x.t))); on.delete(k); } }
for (const x of ev) if (x.e === 'SPELL_CAST_SUCCESS' && /Sever/.test(x.spell)) console.log('SEVER ' + x.t.toFixed(1) + ' boss ' + JSON.stringify(where(x.sg, x.t)) + ' target ' + nm(x.dg) + ' ' + JSON.stringify(where(x.dg, x.t)));
