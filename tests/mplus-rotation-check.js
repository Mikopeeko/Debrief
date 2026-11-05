// Mythic+ Rotation tab contradiction check (Nov 5, the studio's list): opens the website's Mythic+ Rotation tab in a headless browser and fails
// when it contradicts itself. contradictions.js runs the engine in Node on raid pulls; this tab's numbers only exist in the page, so it's checked there.
//   node tests/mplus-rotation-check.js <the page's address with &tab=mplus&mpv=rot>
// Checks: 1. each pull's chip says as many "to fix" as that pull's card lists ("Clean" = none); 2. the Trash pulls and Bosses tiles say as many
// "to fix" as the rows they show when tapped; 3. no check in What to fix is green in "Every check across the key", and none is in "Done right";
// 4. on a pull's own page, each group's "N/M" in the summary agrees with its panel's "N of M done right". Exit code 1 with one line per problem.
'use strict';
const { spawn } = require('child_process'), path = require('path'), os = require('os'), fs = require('fs');
const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const URL0 = process.argv[2], PORT = 9371, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (!URL0 || !EDGE) { console.log(!EDGE ? 'Mythic+ Rotation check: skipped (no Edge on this PC)' : 'Usage: node tests/mplus-rotation-check.js <address>'); process.exit(0); }
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'mprc-')), ed = spawn(EDGE, ['--headless=new', '--disable-gpu', '--user-data-dir=' + prof, '--remote-debugging-port=' + PORT, 'about:blank']);
  let tgt; for (let i = 0; i < 50 && !tgt; i++) { await sleep(300); try { tgt = (await (await fetch('http://127.0.0.1:' + PORT + '/json')).json()).find((t) => t.type === 'page'); } catch (e) { /* not up yet */ } }
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const wait = {}; ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && wait[d.id]) { wait[d.id](d); delete wait[d.id]; } });
  const cmd = (method, params) => new Promise((r) => { const i = ++id; wait[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const ev = async (e) => { const r = await cmd('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); return r.result && r.result.result ? r.result.result.value : null; };
  const until = async (e, n) => { for (let i = 0; i < (n || 60); i++) { await sleep(1000); if (await ev(e).catch(() => false)) return true; } return false; };
  const click = (sel) => ev('(() => { const b = document.querySelector(' + JSON.stringify(sel) + '); if (b) b.click(); return !!b; })()');
  await cmd('Page.enable'); await cmd('Runtime.enable'); await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cmd('Page.navigate', { url: new URL(URL0).origin + '/robots.txt' }); await sleep(1200); await ev("localStorage.setItem('wla-tour-done','1');1");
  await cmd('Page.navigate', { url: URL0 }); const bad = [], seen = { fix: 0, all: 0, tile: 0, chip: 0, grp: 0 };
  if (!(await until('!!document.querySelector("#mpcRot .mpc-pk") && !/Checking/.test(document.getElementById("mpcRot").innerText)', 300))) { console.log('Mythic+ Rotation check: the tab never finished loading'); process.exit(1); }
  // (the card's fix count: its rows and its "Show N more")
  const rowsN = '(() => { const c = document.getElementById("mpcRot"), r = [...c.querySelectorAll(".mpc-rr")].filter((x) => !x.closest("#mpvDet, .mpv-all")).length, m = [...c.querySelectorAll("[data-mpcm]")].map((b) => +((b.innerText.match(/Show (\\d+) more/) || [])[1] || 0)).reduce((a, b) => a + b, 0); return r + m; })()';
  // 3. the whole key
  const w = await ev('(() => { const c = document.getElementById("mpcRot"), fx = [...c.querySelectorAll(".mpc-rr .krt b")].map((b) => b.innerText.trim()), done = ((c.innerText.match(/Done right: ([^\\n]*)/) || [])[1] || "").replace(/[.]$/, "").split(/, /), all = Object.fromEntries([...c.querySelectorAll(".mpv-ar")].map((r) => [r.querySelector(".mpv-al").firstChild.textContent.trim(), getComputedStyle(r.querySelector(".kd")).backgroundColor])); return { fx, done, all }; })()');
  seen.fix = w.fx.length; seen.all = Object.keys(w.all).length; for (const lb of w.fx) { if (w.all[lb] === 'rgb(69, 193, 92)') bad.push('Whole key: "' + lb + '" is in What to fix but green in Every check across the key.'); if (w.done.includes(lb)) bad.push('Whole key: "' + lb + '" is in both What to fix and Done right.'); }
  // 2. the tiles
  for (const k of ['trash', 'boss']) { const said = await ev('(() => { const t = document.querySelector("[data-mpcf=' + k + '] b"); return t ? t.innerText : ""; })()'); if (!said) continue;
    await click('[data-mpcf=' + k + ']'); await sleep(800); const n = await ev(rowsN), m = said.match(/^(\d+) to fix/), want = m ? +m[1] : 0;
    seen.tile++; if (/None/.test(said)) { /* (no pulls of that kind) */ } else if (n !== want) bad.push('Tile ' + k + ': says "' + said + '" but shows ' + n + ' rows.'); await click('[data-mpcf=' + k + ']'); await sleep(500); }
  // 1. and 4. each pull
  const chips = await ev('[...document.querySelectorAll("#mpcRot .mpc-pk [data-mpcp]")].filter((b) => b.dataset.mpcp !== "").map((b) => [b.dataset.mpcp, b.title])');
  for (const [i, title] of chips) { if (/too short|not judged/.test(title)) continue; await click('#mpcRot [data-mpcp="' + i + '"]'); await sleep(700);
    const n = await ev(rowsN), m = title.match(/(\d+) to fix/), want = m ? +m[1] : /Clean$/.test(title) ? 0 : null;
    if (want != null) seen.chip++; if (want != null && n !== want) bad.push('Pull chip ' + title.split(' · ')[0] + ': says ' + (m ? want + ' to fix' : 'Clean') + ' but its card lists ' + n + '.');
    if (await until('(() => { const d = document.getElementById("mpvDet"); return d && !/Reading/.test(d.innerText); })()', 90)) {
      const g = await ev('(() => { const d = document.getElementById("mpvDet"), out = []; d.querySelectorAll(".rcx-ph").forEach((t) => { const k = t.dataset.go, v = (t.querySelector("b") || {}).innerText || "", sec = d.querySelector(".rcx-sec[data-ph=\\"" + k + "\\"] .rcx-sh em"); out.push([k, v.replace(/\\s+/g, ""), sec ? sec.innerText : null]); }); return out; })()');
      for (const [k, v, em] of g || []) { const a = v.match(/^(\d+)\/(\d+)$/); if (!a || em == null) continue; seen.grp++; const b = em.match(/^(\d+) of (\d+) done right/); if (!b || a[1] !== b[1] || a[2] !== b[2]) bad.push('Pull ' + title.split(' · ')[0] + ', ' + k + ': the summary says ' + a[1] + '/' + a[2] + ' but its panel says "' + em + '".'); } } }
  await click('#mpcRot [data-mpcp=""]');
  console.log(bad.length ? 'Mythic+ Rotation check: ' + bad.length + ' contradiction(s)\n  ' + bad.join('\n  ') : 'Mythic+ Rotation check: all agree (' + seen.chip + ' pull chips, ' + seen.grp + ' group panels, ' + seen.tile + ' tiles, ' + seen.fix + ' fixes against ' + seen.all + ' whole-key checks)');
  ws.close(); ed.kill(); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) { /* (Edge may hold it a moment) */ } process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
