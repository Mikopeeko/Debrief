// A Plan save that fails must wait before it's sent again (Nov 13, the look review on a practice link: opening Plan kept POSTing /api/teamplan
// about once a second after a failed save, 142 tries in one visit; on the live site a failing Worker would get the same, forever).
// This runs the page's own tpTick and tpWait with a fake clock and a save that always fails, for one minute of ticks (one every 1.5 s, as the
// page's timer), and fails when it's sent more than 8 times. The old code sent it 38 times. contradictions.js runs it on every build.
'use strict';
const vm = require('vm');
module.exports = function planSaveRetry(H, say) {
  const bad = (m) => say('the page code', 'Plan saves', m);
  let src;
  try { src = 'async ' + H.grab('tpTick', H.UI.replace(/async function tpTick\b/, 'function tpTick')) + '\n' + (/function tpWait\b/.test(H.UI) ? H.grab('tpWait') : ''); }
  catch (e) { bad('could not read tpTick or tpWait out of ui.js: ' + e.message); return Promise.resolve(); }
  const run = async (fail) => {
    let now = 1e6, sent = 0;
    const TP = { id: 'team:1', base: {}, doc: { exists: true, you: { can: true } }, busy: false, sig: '', since: 0, chg: [] };
    const here = { 'wla-rosters': '{"a":1}' }, tpDirty = () => { const d = {}; for (const k of Object.keys(here)) if (TP.base[k] !== here[k]) d[k] = here[k]; return d; };
    const ctx = vm.createContext({ TP, Date: { now: () => now }, Math, Object, encodeURIComponent, tpDirty, tpSum: () => 'changed the roster',
      tpWho: () => 'Test', tpChip: () => {}, tpApi: async () => { sent++; if (fail === 'throw') throw new Error('offline'); return fail === '500' ? { _st: 500 } : { ok: true, ver: 2 }; } });
    vm.runInContext(src + '\nthis.tpTick = tpTick;', ctx);
    for (let t = 0; t <= 60e3; t += 1500) { now = 1e6 + t; await ctx.tpTick(); }
    return { sent, TP };
  };
  return (async () => {
    for (const kind of ['throw', '500']) {
      const { sent } = await run(kind);
      if (sent > 8) bad('a save that keeps failing (' + (kind === 'throw' ? 'no connection' : 'server error 500') + ') was sent ' + sent + ' times in one minute; it must wait longer after each failure (5 s, 10, 20, 40, a minute)');
      if (sent < 1) bad('a changed plan was never sent (' + kind + ')');
    }
    const ok = await run('ok');
    if (ok.sent !== 1 || ok.TP.base['wla-rosters'] !== '{"a":1}') bad('a save that goes through should be sent once and then count as saved (sent ' + ok.sent + ' times)');
  })().catch((e) => bad('the Plan save check crashed: ' + e.message));
};
