// How it went: a single player's death row borrowed another player's mistake just because it was close in time
// (Wolfthorn Thu Nov 12 Ula'tek pull 13, report Gax3AkbyFRXmdrgQ fight 23). Urgdragon (2:05) and Komo (2:07) both died to Caustic Waves,
// both "their own mistake" by the death rule. Urgdragon's row read "Death · Moderate"; Komo's read "Caustic Waves · Serious", because the
// Caustic Waves card's only red moment was Jangokin's 2:09 row ("hit by a Caustic Wave, and died to it", data-sev 5), 1.4 s from Komo's death
// and 3.1 s from Urgdragon's, and the row-to-moment link (dLink in ui.js) took any moment of the spell within 3 s, whoever it named.
// Komo's row took Jangokin's severity and clicked through to Jangokin's moment. A one-player death row now only takes a moment that names
// that player, or names no one (a raid line); Jangokin's own row still takes his moment. contradictions.js runs it on every build.
'use strict';
const vm = require('vm');
module.exports = function howItWentDeathLink(H, say) {
  const bad = (m) => say("Wolfthorn Thu Nov 12 Ula'tek pull 13", 'How it went', m);
  let src; try { src = H.grab('dLink'); } catch (e) { bad('could not read dLink out of src/ui.js: ' + e.message); return; }
  // (the page's moments at that time, as the log has them: the Caustic Waves card's rows at 2:03 (Optt) and 2:04 (Urgdragon) are not marked
  //  (no bad or warn), Jangokin's at 2:09 is red with "died" (data-sev 5); and the Deaths list's deaths at 2:05, 2:07 and 2:16)
  const waves = { t: 129, st: 'r', id: 'waves', m: 'Caustic Waves', sn: 'Caustic Waves', lab: 'Caustic Waves (Dodge the waves)', why: 'Jangokin was hit by a Caustic Wave, and died to it.', lines: ['Jangokin: died'], who: [{ n: 'Jangokin' }], sev: 5 };
  const okW = { t: 123, st: 'ok', id: 'waves', m: 'Caustic Waves', sn: 'Caustic Waves', lab: 'Caustic Waves (Dodge the waves)', lines: ['Optt', 'Urgdragon'], who: [{ n: 'Optt' }, { n: 'Urgdragon' }] };
  const dth = (t, n) => ({ t, st: 'r', death: 1, m: 'Death', who: [{ n, c: '' }], lines: [n + ' died to Caustic Waves.'] });
  const M = [okW, dth(125, 'Urgdragon'), dth(127, 'Komo'), waves, dth(136, 'Jangokin')];
  const ctx = vm.createContext({ M, mm: (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), nz: (x) => String(x || '').toLowerCase().replace(/\s+/g, ' ').trim(), wOf: () => null, DAL: { 'Venom Rupture': 'Coalesced Venom' } });
  let dLink; try { dLink = vm.runInContext(src + '\ndLink', ctx); } catch (e) { bad('dLink did not run: ' + e.message); return; }
  const near = { m: waves, i: 3, d: 1.4 }; /* (what the nearest-moment pass (mAt) hands it for Komo: the red Caustic Waves moment 1.4 s away) */
  const kind = (k) => (k && k.b && k.b.m ? (k.b.m.death ? 'Death' : k.b.m.m + ' (' + k.b.m.who.map((x) => x.n).join(', ') + ')') : 'nothing');
  const rows = [[127.6, 'Komo died to Caustic Waves, from 57% health in 2.0 s: their own mistake', near], [127.6, 'Komo died to Caustic Waves, their own mistake', null], [125.9, 'Urgdragon died to Caustic Waves, from 67% health in 2.0 s: their own mistake', null]];
  for (const [t, txt, b] of rows) { const k = dLink({ t, txt, mech: 'Death', sev: 'Death' }, b, null); if (!k || !k.b || !k.b.m || !k.b.m.death) bad('"' + txt + '" is shown under ' + kind(k) + ', another player\'s moment, not as a Death row of its own (it took that moment\'s Serious and its click)'); }
  const j = dLink({ t: 137.0, txt: 'Jangokin died to Caustic Waves', mech: 'Death', sev: 'Death' }, null, null);
  if (!j || !j.b || j.b.m !== waves) bad('"Jangokin died to Caustic Waves" no longer shows his own Caustic Waves moment (2:09, "hit by a Caustic Wave, and died to it"); it shows ' + kind(j));
  // (a moment that names other players still counts when it came first: Wolfthorn Thu Oct 22 The Coiled Altar pull 33 (bcA9kw3mxHKzr4fR fight 37). The tank Vandagos
  //  took Soul Sever at 3:38 and died to it 0.04 s later; that moment's names are the ghosts it missed (Zaffia, Fourinches, Jangokin), not his. His row keeps Soul Sever)
  const sever = { t: 218, st: 'r', id: 'soulsever', m: 'Soul Sever', sn: 'Soul Sever', lab: 'Soul Sever (Hit the ghosts)', why: "Soul Sever missed 3 ghosts (Zaffia's, Fourinches's and Jangokin's).", lines: ['Soul Sever missed 3 ghosts (Zaffia\'s, Fourinches\'s and Jangokin\'s)'], who: [{ n: 'Zaffia' }, { n: 'Fourinches' }, { n: 'Jangokin' }], sev: 5 };
  ctx.M = [sever, { t: 218, st: 'r', death: 1, m: 'Death', who: [{ n: 'Vandagos', c: '' }], lines: ['Vandagos died to Soul Sever.'] }];
  const v = dLink({ t: 218.478, txt: 'Vandagos died to Soul Sever', mech: 'Death', sev: 'Death' }, { m: sever, i: 0, d: 0.478 }, null);
  if (!v || !v.b || v.b.m !== sever) say("Wolfthorn Thu Oct 22 The Coiled Altar pull 33", 'How it went', '"Vandagos died to Soul Sever" (3:38) lost his own Soul Sever moment, because it names the ghosts it missed; it shows ' + kind(v));
};
