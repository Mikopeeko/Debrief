// node pstack.js <pull> : the raid's middle (median of players) at the phase 1 end (first Dreadful Presence) and each mind-controlled player's spot ~4 s after Dreadmarch
const { ev, pos, where, nm } = require('./ppos.js');
const pl = [...pos.keys()].filter((g) => /^Player/.test(g)), med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const mid = (t) => { const w = pl.map((g) => where(g, t)).filter(Boolean); return w.length ? [med(w.map((q) => q[0])), med(w.map((q) => q[1])), w.length] : null; };
const dp = ev.find((x) => x.spell === 'Dreadful Presence'); if (dp) console.log('P2 start', dp.t.toFixed(0), 'raid middle', JSON.stringify(mid(dp.t - 3)), JSON.stringify(mid(dp.t + 2)));
const mc = ev.filter((x) => /AURA_APPLIED$/.test(x.e) && x.spell === 'Dreadmarch' && /^Player/.test(x.dg));
for (const x of mc) console.log('MC', x.t.toFixed(0), nm(x.dg), 'at', JSON.stringify(where(x.dg, x.t)), '+4s', JSON.stringify(where(x.dg, x.t + 4)), '+7s', JSON.stringify(where(x.dg, x.t + 7)), 'raid', JSON.stringify(mid(x.t + 4)));
