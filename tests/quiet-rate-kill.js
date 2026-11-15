// Rate tiles: each raid's own scale never ran (the quiet-bug hunt, Nov 15; checked on Wolfthorn Thu Nov 12 Ula'tek pull 13, report Gax3AkbyFRXmdrgQ fight 23).
// On Oct 31 (1e31979c, "Each raid's own scale for the rate tiles") the page started asking Warcraft Logs for a pull's own numbers (WCL.rateKill,
// /api/ratek) so the "kills like yours" comparisons on the rate tiles and Boss damage use this raid's scale, phase by phase. Both pieces were
// added only to the built files; the next build from source (Nov 1, db4d3c1b) dropped them. ui.js's cal381 checks "!WCL.rateKill" first, so it
// quietly returned nothing and the built-in scale stayed on every pull, and debriefme.io answered /api/ratek with the page itself.
// This loads src/wcl.js as the hosted page does and fails if: the page uses a WCL.<name> that src/wcl.js doesn't make; WCL.rateKill is missing or
// doesn't ask /api/ratek; ui.js's own cal381 doesn't ask for the pull's numbers; or src/worker_template.js has no /api/ratek route behind it.
// It also checks the Worker keeps each pull's answer once for everyone (Main's ruling, Nov 15), so a pull costs Warcraft Logs one request.
// quiet-bugs.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function quietRateKill(say, H) {
  const bad = (m) => say("Wolfthorn Thu Nov 12 Ula'tek pull 13", 'rate tiles scale', m);
  const SRC = path.join(__dirname, '..', 'src'), rd = (f) => { try { return fs.readFileSync(path.join(SRC, f), 'utf8'); } catch (e) { return null; } };
  const wclSrc = rd('wcl.js'), wt = rd('worker_template.js');
  if (!wclSrc || !wt) { bad('could not read src/wcl.js or src/worker_template.js'); return; }
  if (!H) { try { H = require('./site-helpers.js'); } catch (e) { bad('could not load tests/site-helpers.js: ' + e.message); return; } }
  /* (src/wcl.js as debriefme.io runs it, with a stand-in fetch that writes down what it asks and answers like rateOfKill) */
  const asked = [], win = { WLA_HOSTED: true, dispatchEvent: () => true };
  const fetch = (u) => { asked.push(String(u)); return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ kill: true, ph: [{ s: 0, e: 120, dps: 2e6, hps: 5e5, dtps: 3.3e5 }] }) }); };
  const ctx = vm.createContext({ window: win, location: { hostname: 'debriefme.io', search: '' }, fetch, setTimeout, clearTimeout, console, Event: function Event(t) { this.type = t; } });
  try { vm.runInContext(wclSrc, ctx, { filename: 'wcl.js' }); } catch (e) { bad('src/wcl.js would not load: ' + e.message); return; }
  const W = win.WCL;
  if (!W) { bad('src/wcl.js made no window.WCL'); return; }
  /* (1) every WCL.<name> the page's code uses is something src/wcl.js makes (ui.js and the files the build splices into it) */
  const used = new Map();
  for (const f of ['ui.js', 'guides.js', 'mptab.js', 'sidenav.js']) { const s = rd(f); if (s) s.split('\n').forEach((l, i) => { for (const m of l.matchAll(/\bWCL\.([A-Za-z_$][\w$]*)/g)) if (!used.has(m[1])) used.set(m[1], f + ':' + (i + 1)); }); }
  for (const [n, at] of used) if (!(n in W)) bad('the page uses WCL.' + n + ' (src/' + at + ') but src/wcl.js has no ' + n + ', so that code quietly never runs');
  /* (2) WCL.rateKill asks the site for one pull's numbers */
  if (typeof W.rateKill !== 'function') bad('src/wcl.js has no rateKill in window.WCL, so the rate tiles never get each raid\'s own scale (lost in the Nov 1 rebuild db4d3c1b)');
  /* (3) ui.js's own cal381, with that WCL, asks for the pull's numbers the first time a pull is drawn (fetch is called at once, before any await) */
  let code; try { code = H.grab('RATE_CAL') + '\n' + H.grab('cal381') + '\n({ cal381 })'; } catch (e) { bad('could not read RATE_CAL or cal381 out of src/ui.js: ' + e.message); return; }
  const CAL381 = new Map(); let redraws = 0;
  let P; try { P = vm.runInContext(code, vm.createContext({ CAL381, S: { tab: 'audit' }, liveRedraw: () => { redraws++; }, WCL: W })); } catch (e) { bad('cal381 would not load: ' + e.message); return; }
  const n = 120, r = { item: { boss: "Ula'tek", diffId: 16, wcl: { code: 'Gax3AkbyFRXmdrgQ', fight: 23 } }, dmgS: new Array(n).fill(2e6), healS: new Array(n).fill(5e5), takenS: new Array(n).fill(3e5) };
  asked.length = 0;
  try { P.cal381(r); } catch (e) { bad('cal381 threw: ' + e.message); return; }
  if (!asked.some((u) => /^\/api\/ratek\?c=Gax3AkbyFRXmdrgQ&f=23$/.test(u))) bad('drawing a pull never asks /api/ratek for its own numbers (asked: ' + JSON.stringify(asked) + '), so the built-in scale stays on every pull');
  /* (4) the Worker answers /api/ratek: a route that checks the code and fight, runs rateOfKill, and keeps the answer once for everyone, per
     report and fight, so each pull costs the site's Warcraft Logs key once (Main's ruling, Nov 15: no Warcraft Logs request on every page view) */
  const a4 = wt.indexOf("ROUTES['/api/ratek']"), b4 = a4 < 0 ? -1 : wt.indexOf('\nROUTES[', a4 + 10);
  if (a4 < 0 || b4 < 0) bad('src/worker_template.js has no /api/ratek route, so debriefme.io answers it with the page itself and the scale never arrives');
  else {
    const routeSrc = wt.slice(a4, b4);
    const helper = (nm) => { const i = wt.indexOf('async function ' + nm + '('); if (i < 0) return null; const j = wt.indexOf('\n', i); return wt.slice(i, j < 0 ? wt.length : j); };
    const kg = helper('rateKGet'), kp = helper('rateKPut');
    if (!/rateOfKill\(\s*env\s*,\s*v\.c\s*,\s*v\.f\s*\)/.test(routeSrc)) bad('the /api/ratek route does not run rateOfKill(env, v.c, v.f)');
    if (!kg || !kp) bad('the /api/ratek route has no keeper (rateKGet / rateKPut), so every pull opened asks Warcraft Logs again');
    else {
      let calls = 0; const R2 = new Map(), KV = new Map();
      const env = { DEBRIEF_KV: { get: async (k, t) => (KV.has(k) ? (t === 'json' ? JSON.parse(KV.get(k)) : KV.get(k)) : null), put: async (k, v) => { KV.set(k, v); } } };
      let route = null;
      try {
        const ROUTES = {};
        vm.runInNewContext(kg + '\n' + kp + '\n' + routeSrc, { ROUTES, r2Get: async () => null, rateOfKill: async (e, c, f) => { calls++; return { code: c, fight: f, kill: true, ph: [{ s: 0, e: 120, dps: 2e6, hps: 5e5, dtps: 3e5 }] }; }, JSON, Array, Response, Blob, CompressionStream, console });
        route = ROUTES['/api/ratek'];
      } catch (e) { bad('the /api/ratek route would not load: ' + e.message); }
      const q = (s) => { const u = new URLSearchParams(s); return { get: (k) => u.get(k) }; };
      if (route) {
        if (!route.v(q('c=Gax3AkbyFRXmdrgQ&f=23')) || route.v(q('c=x&f=0')) || route.v(q('c=Gax3AkbyFRXmdrgQ&f=abc'))) bad('the /api/ratek route checks its report code and fight the wrong way');
        const v = route.v(q('c=Gax3AkbyFRXmdrgQ&f=23'));
        const kept = v ? route.run(env, v).then(() => route.run(env, v)).then((o2) => {
          if (calls !== 1) bad('the same pull asked Warcraft Logs ' + calls + ' times; it should be kept after the first answer (one gatherer rule)');
          if (!o2 || !Array.isArray(o2.ph) || !o2.ph.length) bad('the kept answer for a pull came back empty');
        }).catch((e) => bad('the /api/ratek route threw: ' + e.message)) : null;
        var keptP = kept;
      }
    }
  }
  /* (5) and once the answer lands, the pull has its own scale (late, so a problem here is reported after the others) */
  return Promise.all([typeof keptP !== 'undefined' ? keptP : null, new Promise((res) => setTimeout(res, 20))]).then(() => {
    const F = P.cal381(r);
    if (typeof W.rateKill === 'function' && (!F || !(F.dps > 0.75 && F.dps < 1.33) || Math.abs(F.dps - 1) < 1e-6)) bad('the pull\'s own numbers arrived but cal381 gave no scale (' + JSON.stringify(F) + ')');
    else if (typeof W.rateKill === 'function' && redraws !== 1) bad('the scale arrived but the page was redrawn ' + redraws + ' times (once expected)');
  });
};
