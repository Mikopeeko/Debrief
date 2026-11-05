// Debrief Companion's first-time walkthrough (Nov 3, the studio's walkthrough-brief.md; Flex: "a new user walkthrough", "the walk through should take
// them through the settings, and where to find everything", "Yes, send it"). One look in every window: the window dimmed, one rounded hole with a gold
// edge around the thing explained, and a 350 px card beside it. The Companion window, the pop-up and Settings share where the tour is in this app's
// own storage ('dbf-tour'), and each draws the steps that are its own. Each page says which window it is (window.DBF_WIN: 'main', 'pop' or 'set')
// before it loads this file; the pop-up's preview inside Settings says none, so it never draws one.
(function () {
  'use strict';
  const WIN = window.DBF_WIN || ''; if (!WIN) return;
  const KEY = 'dbf-tour', DONE = 'dbf-tour-done';
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const save = (v) => { try { if (v) localStorage.setItem(KEY, JSON.stringify(v)); else localStorage.removeItem(KEY); } catch (e) { /* (this window only) */ } };
  const msg = (m) => { try { if (window.chrome && window.chrome.webview) window.chrome.webview.postMessage(m); } catch (e) { /* (not in the app) */ } };
  const POST = (u) => fetch(u, { method: 'POST' }).catch(() => {});
  // (the steps: where, what to light up (one or more elements, the hole goes round them all; none: a card in the middle), and the words)
  const STEPS = (st) => [
    { id: 'season', w: 'main', t: ['.cs-tiles', '.cs-boss'], h: 'This is your season', p: ['Your item level, Raider.IO score, Mythic progress and your best parse on every boss, at a glance.', 'It <b>follows the character you play</b>: log in on an alt and it switches by itself.'] },
    { id: 'watch', w: 'main', t: ['#stat'], h: 'Keep Debrief running while you play', p: ['It reads your combat log after every boss pull and every key. The small Debrief addon keeps logging on for you, so there\'s nothing to type.', '<b>Green</b> means it\'s watching. Close it to the tray, not with Quit.'] },
    { id: 'key', w: 'main', t: ['.tg.hk'], h: 'Your recap pops up by itself', p: ['A few seconds after every boss pull and at the end of a key, your recap appears over WoW.', 'Press <b>' + esc(st.key || 'Ctrl + R') + '</b> in WoW to show or hide it any time you\'re out of combat. Click the key to change it.'], x: 'try' },
    { id: 'fs', w: 'main', t: [], only: !!st.fs, h: 'Let your recap show over WoW', p: ['Your WoW is set to <b>Fullscreen</b>, so nothing can show on top of it, not even your recap.', 'Switch it to <b>Windowed (Fullscreen)</b>? It looks the same, and your recap can pop up over the game.'], x: 'fs' },
    { id: 'tabs', w: 'pop', t: ['.top', '.kpulls', '.ktabs'], h: 'Your recap', p: ['<b>Raid</b> or <b>Mythic+</b> at the top. <b>Me</b> for your own part, <b>Raid view</b> for the whole raid.', 'Click any pull to look at it again.'] },
    { id: 'edge', w: 'pop', t: ['.top'], h: 'Make it yours', p: ['Drag the top bar to move it and the edges to resize it. It fits each pull by itself.', 'The <b>gear</b> opens your settings.'] },
    { id: 'card', w: 'set', page: 'card', t: ['.pre', '.fold'], h: 'How much your recap shows', p: ['Pick a start: <b>Simple</b> for a quick look, <b>Standard</b> for most raiders, <b>Detailed</b> for everything. The preview on the right changes as you pick.', 'Want something exact? <b>Customize what shows</b>, under it, lets you hide any row or change how many lines it lists.'] },
    { id: 'popup', w: 'set', page: 'pop', t: ['[data-tour="pop"]'], h: 'When it pops up', p: ['Turn the pop-up off, change your key, or put it on your second screen.', 'The <b>raid reminder</b> tells you 30 minutes before your team\'s raid.'] },
    { id: 'look', w: 'set', page: 'look', t: ['[data-tour="look"]'], h: 'Your colours', p: ['It takes your <b>class colour</b> by default and follows the character you\'re on.', 'Make the text bigger or smaller here.'] },
    { id: 'setup', w: 'set', page: 'setup', t: ['[data-tour="setup"]'], h: 'Everything\'s checked', p: ['Debrief checks your WoW folder, the combat log and your display mode by itself. <b>Green</b> means you\'re set.', 'You can replay this walkthrough here any time.'] },
    { id: 'end', w: 'set', t: [], h: 'You\'re set', p: ['Raid as normal: your first recap pops up after your first boss pull.'], x: 'end' },
  ].filter((s) => s.only !== false);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // (opening the window a step lives in: the sample pop-up, Settings, or the Companion window)
  function open(w) {
    if (w === WIN) return;
    if (w === 'pop') POST('/setup/sample');
    else if (w === 'set') { if (WIN === 'pop') msg('settings'); else POST('/setup/open'); }
    else if (w === 'main') msg(WIN === 'pop' ? 'open' : 'setup');
  }
  function go(st, id) { const S = STEPS(st), s = S.find((x) => x.id === id); if (!s) return end(); const n = Object.assign({}, st, { step: id, at: Date.now() }); save(n); open(s.w); draw(); }
  function end() { save(null); try { localStorage.setItem(DONE, '1'); } catch (e) { /* (this window only) */ } draw(); }
  const DBF_TOUR = window.DBF_TOUR = {
    // (start from the first step: opts.fs for a true-Fullscreen player, opts.old for players who had Debrief before ("New: a quick tour of what's where"), opts.key the recap key's name)
    start(opts) { const o = opts || {}; const st = { step: 'season', fs: !!o.fs, old: !!o.old, key: o.key || 'Ctrl + R', at: Date.now() }; save(st); open('main'); draw(); },
    on() { const st = get(); return !!(st && st.step); },
    // (a real recap arrived: the tour waits behind it, and goes on once the pop-up closes)
    pause() { const st = get(); if (st && st.step && !st.paused) { save(Object.assign({}, st, { paused: true })); draw(); } },
    resume() { const st = get(); if (st && st.paused) { save(Object.assign({}, st, { paused: false, at: Date.now() })); draw(); } },
    // (this window is closing: a real recap closed goes back to the tour; closing the window a step is in ends it, as Skip does)
    closed() { const st = get(); if (!st || !st.step) return; if (st.paused) { DBF_TOUR.resume(); return; } const s = STEPS(st).find((x) => x.id === st.step); if (s && s.w === WIN) end(); },
    end, draw: () => draw(),
  };

  // ---------- the look ----------
  const css = document.createElement('style'); css.textContent =
    '.dbt{position:fixed;inset:0;z-index:2147483000;pointer-events:none}' +
    '.dbt-hole{position:fixed;border-radius:6px;box-shadow:0 0 0 9999px rgba(5,6,9,.72),0 0 0 2px rgba(230,180,80,.85);transition:all .2s}' +
    '.dbt-dim{position:fixed;inset:0;background:rgba(5,6,9,.72)}' +
    '.dbt-bub{position:fixed;width:350px;max-width:calc(100vw - 16px);background:#171a22;border:1px solid #353b49;border-radius:6px;padding:14px 16px 12px;box-shadow:0 14px 36px rgba(0,0,0,.6);pointer-events:auto;color:#e8eaed;font-family:"Barlow Condensed","Segoe UI",system-ui,sans-serif;text-align:left;box-sizing:border-box}' +
    '.dbt-bub.mid{width:440px}' +
    '.dbt-bub .k{font:600 11.5px "Barlow Condensed",sans-serif;text-transform:uppercase;letter-spacing:.04em;color:#e6b450}' +
    '.dbt-bub h3{margin:4px 0 6px;font:700 18px "Barlow Condensed",sans-serif;color:#e8eaed}' +
    '.dbt-bub p{margin:0 0 6px;color:#cfd4da;font:500 14px/1.38 "Barlow Condensed",sans-serif}' +
    '.dbt-bub p b{color:#fff;font-weight:600}' +
    '.dbt-bub .dots{display:flex;gap:5px;margin:8px 0 0}' +
    '.dbt-bub .dots i{width:6px;height:6px;border-radius:50%;background:#353b49}.dbt-bub .dots i.was{background:rgba(230,180,80,.45)}.dbt-bub .dots i.on{background:#e6b450}' +
    '.dbt-bub .bt{display:flex;align-items:center;gap:8px;margin-top:10px}' +
    '.dbt-bub button{font-family:inherit;cursor:pointer}' +
    '.dbt-bub .sk{color:#6b737c;font:500 13px "Barlow Condensed",sans-serif;margin-right:auto;background:none;border:0;padding:0}.dbt-bub .sk:hover{color:#9aa3ac}' +
    '.dbt-bub .b2{height:30px;padding:0 12px;display:inline-flex;align-items:center;border:1px solid #353b49;border-radius:4px;font:600 13.5px "Barlow Condensed",sans-serif;color:#e8eaed;background:transparent}.dbt-bub .b2:hover{border-color:#4a505a;background:#1e222c}' +
    '.dbt-bub .b1{height:30px;padding:0 14px;display:inline-flex;align-items:center;border:0;border-radius:4px;background:#e6b450;color:#121418;font:700 13.5px "Barlow Condensed",sans-serif}.dbt-bub .b1:hover{background:#f0c25e}' +
    '.dbt-bub::before{content:"";position:absolute;width:12px;height:12px;background:#171a22;border-left:1px solid #353b49;border-top:1px solid #353b49;transform:rotate(45deg)}' +
    '.dbt-bub.up::before{top:-7px;left:var(--ax,40px)}.dbt-bub.down::before{bottom:-7px;left:var(--ax,40px);transform:rotate(225deg)}.dbt-bub.mid::before{display:none}' +
    '.dbt-mode{display:flex;align-items:center;gap:10px;margin:10px 0 8px;font:600 14px "Barlow Condensed",sans-serif;flex-wrap:wrap}' +
    '.dbt-mode span{display:flex;align-items:center;gap:7px;height:34px;padding:0 12px;border:1px solid #353b49;border-radius:4px;color:#9aa3ac}' +
    '.dbt-mode span em{font-style:normal;color:#6b737c;font-weight:500;margin-left:4px}' +
    '.dbt-mode span.on{border-color:rgba(126,224,143,.6);color:#e8eaed;background:rgba(126,224,143,.06)}' +
    '.dbt-mode .ar{border:0;padding:0;color:#6b737c}' +
    '.dbt-mode i{width:16px;height:11px;border:1.5px solid currentColor;border-radius:2px;box-sizing:border-box}.dbt-mode i.y{border-color:#7ee08f;box-shadow:inset 0 2px 0 #7ee08f}' +
    '.dbt-note{color:#9aa3ac;font:500 13px/1.35 "Barlow Condensed",sans-serif;margin:2px 0 4px}.dbt-note.ok{color:#7ee08f}.dbt-note.am{color:#f2c46b}';
  document.head.appendChild(css);

  let box = null, busy = false, tries = 0, timer = 0, FS = { wow: false, state: '', msg: '' };
  const clear = () => { if (box) { box.remove(); box = null; } };
  const rectOf = (sels) => { let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity, n = 0;
    for (const s of sels) for (const el of document.querySelectorAll(s)) { const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; n++; L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); }
    return n ? { L, T, R, B } : null; };
  function draw() {
    if (busy) return; busy = true;
    try {
      clearTimeout(timer); const st = get(); clear();
      if (!st || !st.step || st.paused) { tries = 0; return; }
      const S = STEPS(st), i = S.findIndex((x) => x.id === st.step); if (i < 0) return; const s = S[i];
      if (s.w !== WIN) { tries = 0; return; }
      if (s.page && window.DBF_TOURPAGE) window.DBF_TOURPAGE(s.page); // (Settings turns to the step's page)
      const r = s.t.length ? rectOf(s.t) : null;
      if (s.t.length && !r && tries < 20) { tries++; timer = setTimeout(draw, 150); return; } // (still drawing: try again for about 3 s, then a card in the middle)
      tries = 0;
      const steps = S.filter((x) => x.id !== 'end'), k = steps.findIndex((x) => x.id === s.id), N = steps.length;
      const kick = s.id === 'end' ? '' : (st.old && k === 0 ? 'New: a quick tour of what\'s where · ' : k === 0 ? 'Welcome · ' : s.w === 'set' ? 'Settings · ' : '') + (k + 1) + ' of ' + N;
      let extra = '', btn = '';
      if (s.x === 'fs') {
        const done = FS.state === 'done', q = FS.state === 'queued', bad = FS.state === 'error';
        extra = '<div class="dbt-mode"><span' + (done ? '' : ' class="now"') + '><i></i>Fullscreen<em>' + (done ? '' : 'now') + '</em></span><span class="ar">→</span><span class="on"><i class="y"></i>Windowed (Fullscreen)</span></div>' +
          (FS.msg ? '<p class="dbt-note ' + (done ? 'ok' : bad ? 'am' : '') + '">' + esc(FS.msg) + '</p>' : FS.wow ? '<p class="dbt-note">WoW is open right now: Debrief switches it the moment you close WoW, and it\'s ready next time.</p>' : '');
        btn = done || q || bad ? '<button type="button" class="b1" data-t="next">Next</button>' : '<button type="button" class="b2" data-t="next">Not now</button><button type="button" class="b1" data-t="fs">Yes, switch it</button>';
      } else if (s.x === 'end') btn = '<button type="button" class="b1" data-t="end">Done</button>';
      else btn = (s.x === 'try' ? '<button type="button" class="b2" data-t="try">Try it</button>' : '') + (k > 0 ? '<button type="button" class="b2" data-t="back">Back</button>' : '') + '<button type="button" class="b1" data-t="next">Next</button>';
      box = document.createElement('div'); box.className = 'dbt';
      box.innerHTML = (r ? '<div class="dbt-hole"></div>' : '<div class="dbt-dim"></div>') +
        '<div class="dbt-bub' + (r ? '' : ' mid') + '" role="dialog" aria-label="' + esc(s.h) + '">' + (kick ? '<div class="k">' + kick + '</div>' : '') + '<h3>' + esc(s.h) + '</h3>' + s.p.map((x) => '<p>' + x + '</p>').join('') + extra +
        (s.id === 'end' ? '' : '<div class="dots">' + steps.map((x, j) => '<i class="' + (j === k ? 'on' : j < k ? 'was' : '') + '"></i>').join('') + '</div>') +
        '<div class="bt">' + (s.id === 'end' ? '<span style="margin-right:auto"></span>' : '<button type="button" class="sk" data-t="skip">Skip the tour</button>') + btn + '</div></div>';
      document.body.appendChild(box);
      const bub = box.querySelector('.dbt-bub'), W = innerWidth, H = innerHeight, bw = bub.offsetWidth, bh = bub.offsetHeight;
      if (!r) { bub.style.left = Math.max(8, (W - bw) / 2) + 'px'; bub.style.top = Math.max(8, (H - bh) / 2) + 'px'; }
      else {
        const pad = 6, hL = Math.max(2, r.L - pad), hT = Math.max(2, r.T - pad), hR = Math.min(W - 2, r.R + pad), hB = Math.min(H - 2, r.B + pad), hole = box.querySelector('.dbt-hole');
        Object.assign(hole.style, { left: hL + 'px', top: hT + 'px', width: (hR - hL) + 'px', height: (hB - hT) + 'px' });
        // (below the hole if it fits, else above; the card never covers the hole and stays inside the window)
        const below = H - hB - 12 >= bh + 8, above = hT - 12 >= bh + 8;
        let top = below ? hB + 12 : above ? hT - 12 - bh : Math.max(8, Math.min(H - bh - 8, hB + 12)), cls = below ? 'up' : above ? 'down' : 'mid';
        const cx = (hL + hR) / 2, left = Math.max(8, Math.min(W - bw - 8, cx - bw / 2));
        bub.classList.add(cls); bub.style.left = left + 'px'; bub.style.top = top + 'px'; bub.style.setProperty('--ax', Math.max(14, Math.min(bw - 26, cx - left - 6)) + 'px');
      }
      const nx = bub.querySelector('.b1'); if (nx) try { nx.focus({ preventScroll: true }); } catch (e) { /* (no focus) */ }
    } finally { busy = false; }
  }

  // ---------- the buttons ----------
  document.addEventListener('click', async (e) => {
    const b = e.target.closest && e.target.closest('.dbt-bub [data-t]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const st = get(); if (!st) return clear(); const S = STEPS(st), i = S.findIndex((x) => x.id === st.step), t = b.dataset.t;
    if (t === 'skip' || t === 'end') return end();
    if (t === 'try') { POST('/setup/sample'); return; } // (the sample recap pops up beside this window)
    if (t === 'back') return go(st, (S[i - 1] || S[0]).id);
    if (t === 'next') return go(st, (S[i + 1] || { id: 'end' }).id);
    if (t === 'fs') { b.disabled = true; try { const r = await fetch('/setup/winmode', { method: 'POST' }); FS = Object.assign(FS, await r.json()); } catch (x) { FS.state = 'error'; FS.msg = 'Couldn\'t change it: in WoW, Options › Graphics › Display Mode › Windowed (Fullscreen).'; } draw(); }
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && box) { e.preventDefault(); e.stopPropagation(); end(); } }, true);
  window.addEventListener('storage', (e) => { if (e.key === KEY) { const st = get(); if (WIN === 'main' && st && !st.paused && e.oldValue && /"paused":true/.test(e.oldValue)) { const s = STEPS(st).find((x) => x.id === st.step); if (s && s.w === 'pop') POST('/setup/sample'); } draw(); } }); // (back from a real recap on a pop-up step: the sample opens again)
  let rz = 0; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(draw, 80); });
  if (WIN === 'main') { (async () => { try { const r = await fetch('/setup/winmode'); FS = Object.assign(FS, await r.json()); } catch (e) { /* (an older app) */ } })(); }
  setTimeout(draw, 300);
})();
