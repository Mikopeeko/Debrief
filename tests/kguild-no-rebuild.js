// The top kill's guild name no longer rebuilds the whole page (raid-night rehearsal, Nov 14, on Wolfthorn Thu Nov 12 Ula'tek pull 13,
// report Gax3AkbyFRXmdrgQ fight 23). Opening that pull drew Summary, then rebuilt all of it three more times as the comparison lists came in.
// The last rebuild came only from the two guild-name answers (/api/kguild): a 1-5 s freeze, often after the page was already showing, just to add
// "Hokoreu" to the Raid DPS chart's key. Now the name is written into the key in place (data-kg on the key's span) and liveRedraw isn't called.
// This runs the page's own curveRef and rateArea from src/ui.js with a stand-in Warcraft Logs and page, and fails if the guild name's
// arrival asks for a redraw, or if the name doesn't reach the chart key. contradictions.js runs it on every build.
'use strict';
module.exports = async function kguildNoRebuild(H, say, src) {
  const bad = (m) => say("Wolfthorn Thu Nov 12 Ula'tek pull 13", 'whole-page rebuild', m);
  const vm = require('vm');
  let code; try { code = ['curveRef', 'rateArea'].map((n) => H.grab(n, src)).join('\n') + '\n({ curveRef, rateArea })'; } catch (e) { bad('could not read curveRef or rateArea out of src/ui.js: ' + e.message); return; }
  const key = "Ula'tek|16", n = 120, phases = [{ start: 0, end: n, name: 'P1' }];
  /* (five top kills; the middle one by damage is kill "MID") */
  const recs = [1, 2, 3, 4, 5].map((v) => ({ c: v === 3 ? 'MIDKILLCODE00003' : 'KILLCODE0000000' + v, h: 4, ph: [[0, n]], step: 1000, dps: new Array(n).fill(v * 1e6), hps: new Array(n).fill(v * 1e5), dtps: new Array(n).fill(v * 1e5) }));
  let redraws = 0, asked = [], els = [];
  const document = { querySelectorAll: (sel) => (/data-kg/.test(sel) ? els : []), querySelector: () => null };
  const ctx = vm.createContext({
    CURVE_LIVE: new Map([[key, recs]]), KGUILD: new Map(), RATE_CAL: {}, RATE_CAL_DEF: [1, 1, 1], healersOf: () => 4,
    WCL: { curveRecs: () => Promise.resolve({ recs }), killGuild: (c) => { asked.push(c); return Promise.resolve({ name: 'Hokoreu' }); } },
    S: { tab: 'audit', item: { boss: "Ula'tek" } }, liveRedraw: () => { redraws++; }, liveSave: () => {}, document, window: {},
    C: (v) => String(Math.round(v)), T: (s) => String(s), esc: (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
  });
  let P; try { P = vm.runInContext(code, ctx); } catch (e) { bad('curveRef or rateArea would not load: ' + e.message); return; }
  const r = { item: { boss: "Ula'tek", diffId: 16, id: 3492 }, players: new Map(), module: { phases } };
  let refA; try { refA = P.curveRef(r, 'dps', phases, n); } catch (e) { bad('curveRef threw: ' + e.message); return; }
  if (!refA || !refA.one || asked[0] !== 'MIDKILLCODE00003') { bad('the stand-in pull did not pick the middle kill (' + JSON.stringify(asked) + ')'); return; }
  /* (the chart as the page draws it before the name is in, and its key's span as the page would hold it) */
  let html; try { html = P.rateArea(new Array(n).fill(2e6), n, '#e6b450', 'Damage done', null, 'dmgS', [{ s: 0, e: n, name: 'P1', v: 3e6 }], true, refA); } catch (e) { bad('rateArea threw: ' + e.message); return; }
  const m = /<span data-kg="([^"]+)"><i class="rta-k2"><\/i>([^<]*)<\/span>/.exec(html);
  if (m) els = [{ dataset: { kg: m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&') }, lastChild: { nodeType: 3, nodeValue: m[2] } }];
  const before = redraws; await new Promise((res) => setTimeout(res, 20)); /* (the guild name's answer lands) */
  if (redraws > before) bad('the top kill\'s guild name arriving rebuilds the whole page again (liveRedraw), only to add a name to the chart key');
  if (!m) bad('the Raid DPS chart key has no data-kg span, so the guild name can\'t be written in place');
  else if (!/top guilds: Hokoreu$/.test(els[0].lastChild.nodeValue)) bad('the guild name did not reach the chart key in place (it reads "' + els[0].lastChild.nodeValue + '")');
};
