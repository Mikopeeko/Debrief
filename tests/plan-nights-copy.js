// Plan must never save an old copy of the raid nights over the team's (Nov 14, Main's test on a practice link with every save caught: a fresh
// browser opened Plan, pressed Heroic, then Mythic, and the page sent Wolfthorn's nights with only Nov 18 left, Nov 4 and Nov 11 erased, and
// who plays picked again). The cause: the page kept every write to the nights in memory and read that copy back, so the team's nights coming
// in from the server never reached the page, and its next change saved its own old copy over them.
// This runs the page's own storage wrapper on a stand-in browser storage, and checks:
//  1. after the page writes the nights and the team's copy then arrives in storage, the page reads the team's copy (the old code read its own);
//  2. when the browser's storage is full, a night switch still lasts the visit (what the wrapper was built for, Oct 26), with one warning;
//  3. with a team plan, opening Plan moves the team's night on only when it's over, and only for someone who can edit;
//  4. the chip's save words: Saving… while a change waits or is sent, Not saved yet after a failed save, else Saved for the team.
// contradictions.js runs it on every build.
'use strict';
const vm = require('vm');
module.exports = function planNightsCopy(H, say) {
  const bad = (m) => say('the page code', 'Plan saves', m);
  try {
    // 1 and 2: the storage wrapper
    const line = (H.UI.match(/\n\{ const MEM = \{\}, KS = \['wla-night', 'wla-nights'\][^\n]*/) || [])[0];
    if (!line) bad('could not find the raid nights storage wrapper in ui.js');
    else {
      const make = (full) => { const ls = new Map(); let warned = 0;
        const localStorage = { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => { if (full) throw new Error('QuotaExceededError'); ls.set(k, String(v)); }, removeItem: (k) => ls.delete(k) };
        const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage off */ } } };
        const ctx = vm.createContext({ store, localStorage, S: {}, toast: () => { warned++; }, setTimeout: (f) => f() });
        vm.runInContext(line, ctx); return { store, ls, warned: () => warned }; };
      const a = make(false);
      a.store.set('wla-nights', '{"sel":"2026-11-18","d":{"2026-11-18":{}}}');
      a.ls.set('wla-nights', '{"sel":"2026-11-11","d":{"2026-11-04":{},"2026-11-11":{}}}'); /* (the team's copy, written straight into storage as tpApply does) */
      if (a.store.get('wla-nights') !== '{"sel":"2026-11-11","d":{"2026-11-04":{},"2026-11-11":{}}}') bad('after the team\'s raid nights came in, the page still read its own old copy (' + String(a.store.get('wla-nights')).slice(0, 60) + '), so its next change would save it over the team\'s and erase their nights');
      a.store.set('wla-night', '{"diff":"Heroic"}'); a.ls.set('wla-night', '{"diff":"Mythic"}');
      if (a.store.get('wla-night') !== '{"diff":"Mythic"}') bad('after the team\'s Who plays came in, the page still read its own old copy');
      if (a.warned()) bad('a write that fit still warned that the browser\'s storage is full');
      const f = make(true); f.store.set('wla-nights', '{"sel":"2026-11-18"}');
      if (f.store.get('wla-nights') !== '{"sel":"2026-11-18"}') bad('with the browser\'s storage full, a night switch didn\'t last the visit (the Oct 26 fix)');
      if (f.warned() !== 1) bad('with the browser\'s storage full, the warning came ' + f.warned() + ' times (once expected)');
    }
    // 3: which night Plan opens on, with a team plan
    let may; try { may = vm.runInNewContext(H.grab('pnMayMove') + '\npnMayMove', { TP: null }); } catch (e) { bad('ui.js has no pnMayMove (opening Plan must not move the team\'s night when it isn\'t over): ' + e.message); }
    if (may) {
      const run = (TP, sel, known) => vm.runInNewContext(H.grab('pnMayMove') + '\npnMayMove(N, "2026-11-14", known)', { TP, N: { sel, d: {} }, known: known !== false });
      const team = (can) => ({ base: {}, doc: { exists: true, you: { can } } });
      if (run(team(true), '2026-11-18') !== false) bad('opening Plan moved the team\'s night although it isn\'t over yet (another officer picked it)');
      if (run(team(true), '2026-11-11') !== true) bad('opening Plan didn\'t move the team\'s night on after it was over');
      if (run(team(true), '2026-11-11', false) !== false) bad('opening Plan moved the team\'s night although the team\'s raid days aren\'t set (days guessed from saved logs moved Wolfthorn to a Saturday, then a Thursday, Nov 14)');
      if (run(team(false), '2026-11-11') !== false) bad('opening Plan as someone who can only read moved the team\'s night (it would be put back 20 s later)');
      if (run({ base: null, doc: null }, '2026-11-11') !== true) bad('without a team plan, Plan stopped opening on the next raid night');
    }
    // 4: the chip's save words
    let st; try { st = H.grab('tpSaveState'); } catch (e) { bad('ui.js has no tpSaveState (the chip must say whether changes are saved): ' + e.message); }
    if (st) {
      const s = (TP) => vm.runInNewContext(st + '\ntpSaveState()', { TP });
      const T = (o) => Object.assign({ base: {}, doc: { exists: true }, fails: 0, busy: false, sig: '' }, o);
      if (s(T({})) !== 'saved') bad('with nothing waiting, the chip didn\'t say Saved for the team');
      if (s(T({ sig: 'wla-night:30' })) !== 'saving') bad('with a change waiting to be sent, the chip didn\'t say Saving…');
      if (s(T({ busy: true })) !== 'saving') bad('while a change was being sent, the chip didn\'t say Saving…');
      if (s(T({ fails: 2, sig: 'x' })) !== 'failed') bad('after a save that didn\'t go through, the chip didn\'t say Not saved yet');
      if (!/Not saved yet/.test(H.UI) || !/'Saving…'/.test(H.UI)) bad('the chip\'s words Saving… and Not saved yet are missing from ui.js');
    }
    // 5: the alt clean-up (one character a player per boss) on a team plan acts only on alts Battle.net confirms (Nov 14: a browser guessed
    // Vandagoz was Vandagos's alt and, with nobody clicking, swapped Tyralien in on three bosses and rewrote two plans for the whole team)
    let alt; try { alt = H.grab('pgAltClean'); } catch (e) { bad('could not read pgAltClean out of ui.js: ' + e.message); }
    if (alt) {
      const run = (TP, sure) => { let set = null; const told = [];
        const ctx = vm.createContext({ TP, S: {}, PG_RDY: { clear() {} }, planRoster: () => ({ id: 'r1' }), pgAltsR: () => ({ n: 1, main: new Map([['vandagoz', 'Vandagos']]), alts: new Map([['vandagos', ['Vandagoz']]]), sure: new Set(sure) }),
          pnGet: () => ({ on: { 'Entombed Sentinels': ['Vandagos', 'Vandagoz', 'Komo'] }, away: [] }), pnPeople: () => [{ n: 'Vandagos', kind: 'tank' }, { n: 'Vandagoz', kind: 'tank', alt: true }, { n: 'Tyralien', kind: 'tank' }, { n: 'Komo', kind: 'dps' }],
          planBosses: () => ['Entombed Sentinels'], pnState: () => null, pnNamed: () => false, pgNoteSwap: () => {}, pnSet: (o) => { set = o; }, toastOk: (m) => told.push(m), esc: (x) => String(x) });
        vm.runInContext(alt + '\npgAltClean();', ctx); return { set, told }; };
      const team = (can) => ({ base: {}, doc: { exists: true, you: { can } } });
      if (run(team(true), []).set) bad('on a team plan, a guessed alt (Vandagoz for Vandagos) changed who plays for the whole team with nobody clicking');
      const ok = run(team(true), ['vandagoz']);
      if (!ok.set || !(ok.set.on['Entombed Sentinels'] || []).includes('Tyralien') || (ok.set.on['Entombed Sentinels'] || []).includes('Vandagoz')) bad('on a team plan, an alt Battle.net confirms wasn\'t taken out of a boss that has their main');
      else if (!ok.told.some((m) => /Vandagoz is Vandagos's alt/.test(m) && /saved for the team/.test(m))) bad('the alt clean-up changed the team\'s plan without saying so');
      if (!run({ base: null, doc: null }, []).set) bad('without a team plan, the alt clean-up stopped working (it keeps one character a player per boss)');
      if (run(team(false), ['vandagoz']).set) bad('the alt clean-up changed the plan for someone who can only read it');
    }
  } catch (e) { bad('the raid nights check crashed: ' + e.message); }
  return Promise.resolve();
};
