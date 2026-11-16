// Mythic+ Route and its replay, Flex's notes of Nov 16 while trying Route as the main page:
// - "visual bug? whats happening here" (long tan lines across the replay's map) and "the enemy tracker on this boss is bugged?": a health reading over
//   100% (a log line read at the wrong place gave 600782%) drew a nameplate 600,000 times too wide; such readings are left out and a bar never passes full.
// - "the borders on the players is a bit large", "you can add a zoom in/out button just have the player icons scale with the zoom": smaller icons and
//   rings in yards (they follow the zoom), + and − stepping 75, 100, 130 and 170 yards across, the names one size on screen.
// - "Can you make the boss healthbar like the player healthbars": the boss frames are built like the raid frames, with the boss's cast.
// - "mousing over the mobs in the replay should provide tooltip information on the mob": an enemy's hover (name, kind, health, cast, its casts in the key).
// - "clicking on these could provide a breakdown ... dont expand the box but it can be scrollable": a player picked in the meter gets their breakdown.
// - "this is getting flagged but the parse is higher" (Fix first on a 61 parse with a goal of 50) and "DPS parse goals should be higher in keys, like 75%
//   or higher": Fix first is only a missed goal, and a key's Damage goal is 75 (healers 50).
// - "Giving you creative freedom ... it looks a bit copy pasted/out of place": every mistake beside the map in the panel's own look.
// - "Maybe this could be compacted more, and the tooltips have more details for each player on that pull": the play by play tighter, a player's hover.
// contradictions.js runs it on every build. Each part fails on a92ca5ae.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusReplayNov16(say) {
  const bad = (m) => say('Mythic+ replay', 'Flex\'s notes of Nov 16', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src/mptab.js or src/shell.html'); return; }
  const fn = (n) => { const a = s.indexOf('\nfunction ' + n + '('); if (a < 0) throw new Error('src/mptab.js has no function ' + n); let i = s.indexOf('{', a), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(a, i + 1); };
  // 1. health readings
  if (s.indexOf("if (w && w[3] >= 0 && w[3] <= 100) { hp = w[3];") < 0 || s.indexOf("if (w2 && w2[3] >= 0 && w2[3] <= 100) {") < 0 || s.indexOf("(c._bw * Math.max(0, Math.min(100, hp)) / 100)") < 0) bad('an enemy\'s health reading over 100% is used again, or its nameplate can draw past full: the long lines across the replay come back ("visual bug? whats happening here")');
  // 2. the players' icons and the zoom
  if (s.indexOf("c.setAttribute('r', (2.2 * y).toFixed(2)); c.setAttribute('stroke-width', (0.3 * y).toFixed(2));") < 0) bad('the players\' icons or rings in the replay are big again ("When youre fully zoomed in like this its quite large with the big borders")');
  if (s.indexOf("tx.setAttribute('font-size', (14 * st.px1).toFixed(2));") < 0) bad('a player\'s name in the replay no longer keeps one size on screen at every zoom');
  { const m = /\nconst MRP_ZS = \[MRP_VIEW_YD, ([^\]]*)\];/.exec(s); if (!m || m[1].split(',').length < 2 || s.indexOf('st.vw = Math.min(D.W, (MRP_ZS[MRP.zi | 0] || MRP_VIEW_YD) * st.ppy);') < 0 || s.indexOf('<div class="mrp-zc"><button type="button" data-mrpz="1"') < 0 || s.indexOf('try { mrpZcUi(); } catch (e)') < 0) bad('the replay lost its + and − zoom ("you can add a zoom in/out button")'); }
  // 3. the boss frames
  if (s.indexOf("'<i class=\"mrp-bfh\"></i><span class=\"mrp-bfn\"></span><b class=\"mrp-bfp\"></b><span class=\"mrp-bft\"></span>'") < 0 || s.indexOf("mrpT(m.t, c && c._lab ? c._lab : ''); m.r.classList.toggle('dead', hp <= 0);") < 0 || css.indexOf('.mrp-bff > .mrp-bfh { position: absolute !important;') < 0) bad('the replay\'s boss frames no longer look like the players\' frames ("Can you make the boss healthbar like the player healthbars")');
  // 4. an enemy's hover, run on a made-up caster
  { const a = s.indexOf('const mrpFoeTip = '), b = s.indexOf("\ndocument.addEventListener('mouseover', (e) => { if (MPC_ON) return; const g = e.target", a);
    if (a < 0 || b < 0) bad('an enemy in the replay has no hover ("mousing over the mobs in the replay should provide tooltip information on the mob")');
    else { let F; try { F = vm.runInNewContext('const esc = (x) => String(x), mpLc = (x) => String(x || "").toLowerCase();\n' + s.slice(a, b) + '\nmrpFoeTip'); } catch (e) { bad('the enemy hover no longer runs by itself: ' + String(e.message).slice(0, 120)); }
      if (F) { const t = F({ D: { mk: new Set(['wretched discharge']) }, R: { ncast: { g1: [{ sp: 'Wretched Discharge', r: 'k' }, { sp: 'Wretched Discharge', r: 'd' }, { sp: 'Shadow Bolt', r: '' }] } } }, { u: { g: 'g1' }, n: 'Half-Finished Mummy', ty: 'cast' }, { _hp: 47.4, _lab: 'Wretched Discharge', classList: { contains: () => false } });
        for (const w of ['Half-Finished Mummy', 'Caster', 'Health 47%', 'casting <b>Wretched Discharge</b>', '<b>Wretched Discharge</b> ×2, 1 kicked', '1 went off', '(must kick)', '<b>Shadow Bolt</b> ×1']) if (t.indexOf(w) < 0) bad('an enemy\'s hover no longer says "' + w + '" (it read: ' + t.replace(/<[^>]+>/g, '').slice(0, 160) + ')'); } } }
  if (s.indexOf("closest('.mrp-e'), st = MRP.st;") < 0) bad('the enemy hover is no longer filled when the pointer reaches an enemy');
  // 5. the meter's breakdown
  try { const b = fn('mrpBreak'); if (b.indexOf("data-mrpbx=\"1\">‹ Everyone</button>") < 0 || b.indexOf("R.dsp : mm === 'heal' ? R.hsp : R.tsp") < 0) bad('a player\'s breakdown in the replay\'s meter lost its way back or its spells'); } catch (e) { bad('the replay\'s meter has no player breakdown ("clicking on these could provide a breakdown")'); }
  if (s.indexOf("mt.classList.toggle('bd', on);") < 0 || s.indexOf("if (t.dataset.mrpbx) st.pick = null;") < 0 || css.indexOf('.mrp-mt.bd > .mrp-mtb { display: block !important; box-sizing: content-box !important; padding: 1px !important; overflow-y: auto !important;') < 0) bad('the meter\'s breakdown no longer opens in the same box, scrolls, or closes ("dont expand the box but it can be scrollable")');
  // 6. Fix first and the goal
  if (s.indexOf("if (lost > bv && (x.s === 'w' || x.s === 'bad')) { bv = lost; best = x; }") < 0) bad('Fix first can pick a row that met its goal again (his 61 parse against a goal of 50: "this is getting flagged but the parse is higher")');
  { const m = /\nconst MPR_DPS_GOAL = (\d+);/.exec(s); if (!m || +m[1] < 75 || s.indexOf("const pg = heal ? 50 : MPR_DPS_GOAL; add('perf', pc >= pg ? 'ok' : pc >= pg - 25 ? 'w' : 'bad', 'Damage', 'a parse of ' + pg + ' or more',") < 0) bad('a key\'s Damage goal is under a 75 parse again ("DPS parse goals should be higher in keys, like 75% or higher")'); }
  // 7. the panel beside the map: every mistake's look, the play by play
  { const k = css.lastIndexOf('/* Mythic+ Route, every mistake in the panel beside the map in the panel\'s own look (Nov 16'); const b2 = k < 0 ? '' : css.slice(k);
    if (k < 0 || b2.indexOf('#mptCA .mpx-dr > .mpx-dn { grid-row: 1 / span 2 !important; width: 26px !important;') < 0 || b2.indexOf('#mptCA > .mpx-allm > .mpx-alls > :is(.mpx-alld, i), html:not(.mpcard) body #view#view#view #mptCM .mpt-mcard #mptCA .mpx-dg > .mpt-fxh { display: none !important; }') < 0) bad('every mistake beside the map looks copy-pasted again: big numbers, the long title and its "Click a line" line ("it looks a bit copy pasted/out of place")'); }
  if (css.indexOf('#mptCM .mpt-mside .mpx-fl2 > li { display: block !important; padding: 3px 4px 3px 40px !important;') < 0) bad('the play by play beside the map is in wide columns again ("Maybe this could be compacted more")');
  try { const F2 = vm.runInNewContext('const esc = (x) => String(x), mpCap = (x) => x[0].toUpperCase() + x.slice(1), mpPullName = (R, i) => "pull " + (i + 1), mpGF = (v) => String(Math.round(v)), plural = (n, w) => n + " " + w + (n === 1 ? "" : "s"), mpMM = (t) => Math.floor(t / 60) + ":" + String(Math.round(t % 60)).padStart(2, "0"), mpDTo = (x) => x;\n' + fn('mpxWhoTip') + '\nmpxWhoTip');
    const t = F2({ pulls: [{ s: 100, dmg: { A: 300, B: 100 }, heal: {}, kicks: [{ who: 'A', spell: 'Hex' }, { who: 'A', spell: 'Hex' }, { who: 'B', spell: 'Hex' }], dispels: [], purges: [], deaths: [{ who: 'A', t: 160, to: 'Bolt' }] }], people: [{ name: 'A', role: 'dps' }], cds: { A: [{ pull: 0, spell: 'Avatar' }, { pull: 1, spell: 'Avatar' }] } }, 0, 'A');
    for (const w of ['<b>A</b> · Pull 1', '300 DPS (75% of the group)', '2 kicks: <b>Hex</b> ×2', 'Big cooldowns: <b>Avatar</b>', 'Died</span> 1:00 in, to Bolt']) if (t.indexOf(w) < 0) bad('a player\'s hover in the play by play no longer says "' + w + '" (it read: ' + t.replace(/<[^>]+>/g, '').slice(0, 160) + ')'); }
  catch (e) { bad('a player\'s line in the play by play has no hover with their pull ("the tooltips have more details for each player on that pull"): ' + String(e.message).slice(0, 100)); }
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ replay, Nov 16: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
