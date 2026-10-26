// node psever.js <pull> : where both tanks stood as each phase 1 Sever landed (the boss turns to the tank it hits), and Venom Rupture hits right after
const { ev, pos, where, nm } = require('./ppos.js');
const g = (n) => [...pos.keys()].find((q) => nm(q) === n), T = ['Tyralien', 'Vandagos'].map(g);
for (const x of ev.filter((y) => y.e === 'SPELL_CAST_SUCCESS' && y.spell === 'Sever' && y.t < 150)) console.log('Sever', x.t.toFixed(0), T.map((q) => nm(q) + JSON.stringify(where(q, x.t))).join(' '));
