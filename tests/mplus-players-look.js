// Mythic+ Players' makeover (Nov 16, Flex: "Players tab makeover", then of the mock: "Yes, build it"). It fails if:
// - the Report card stops opening with one group banner in The key's style: the group grade's badge, then the four subjects with their icons, small grade
//   chips and the best player;
// - the old banner (its stat boxes) or the group's report-card section come back;
// - the findings stop being tags (green when it went well, amber to fix) in one line under the banner;
// - the ranked rows lose their class colour;
// - vs spec loses its against-top bar, or "Against top players" shows as its own section again;
// - Rotation stops opening with the same banner (its tiles still buttons), or its second Player picker comes back on the website;
// - the banners' look goes.
// contradictions.js runs it on every build. Each part fails on 70b07db1.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusPlayersLook(say) {
  const bad = (m) => say('Mythic+ Players', 'the makeover', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src: ' + e.message); return; }
  // the Report card
  if (s.indexOf("const gban = '<section class=\"mpr-gban\" aria-label=\"The group\"><div class=\"mprs mpx-ban' + (GL ? ' mrs-g' + GL : '') + '\"") < 0 || s.indexOf("+ gban + '<div class=\"rcb-2 ds-rc\">'") < 0) bad('the Report card no longer opens with the group banner in The key\'s style (Flex, Nov 16: "Players tab makeover", "Yes, build it")');
  if (s.indexOf("'<span class=\"mprs-s mpr-gs\" tabindex=\"0\" data-tt=\"' + esc(why) + '\">' + rcbIc(ic) + '<span><small>' + l + '</small><b>' + Math.round(av) + gradeChip(letterOf(av)) + '</b><small class=\"mpr-gsb\">' + (tN === l0.length && tN > 1 ? 'Everyone: '") < 0) bad('a subject in the group banner lost its icon, its number with a grade chip or the best player');
  if (s.indexOf('<section class="rcb-ban') >= 0 && /function mpxRep\(R, fx\)[\s\S]{0,4000}<section class="rcb-ban/.test(s)) bad('the Report card\'s old banner with its stat boxes is back');
  if (/function mpxRep\(R, fx\)[\s\S]{0,6000}<h3>The group\\'s report card<\/h3>/.test(s)) bad('the group\'s report card is a second section again under the banner');
  { const a = s.indexOf('\nfunction mpxRep(R, fx)'), b = a < 0 ? -1 : s.indexOf('\nfunction ', a + 5), f = a < 0 ? '' : s.slice(a, b);
    if (/\bdN\b/.test(f.replace(/const dN = [^;]*;/, '')) && f.indexOf('const dN = ') < 0) bad('the ranked group\'s own row uses the group\'s deaths (dN) with nothing defining it: the whole Report card stops drawing (found while building it, Nov 16)'); }
  if (s.indexOf("G.cos.map((x) => '<span class=\"mpr-co ' + (/^(Everyone|Nothing)\\b/.test(mpPlain(x)) ? 'mpr-co-ok' : 'mpr-co-x') + '\">' + x + '</span>')") < 0) bad('the findings no longer tell a good one (green) from one to fix (amber)');
  // the sorting of the findings, run on the site's own wording
  { const re = /^(Everyone|Nothing)\b/; for (const [t, ok] of [['Nothing on the must-kick list went off with a kick ready.', true], ['Everyone pressed a big cooldown in every long pull.', true], ['Everyone was ahead of the middle player of their spec.', true], ['On pulls 4, 5 and 11, some players pressed no big cooldown.', false], ['Sornarjr was furthest behind their spec (21%).', false], ['Hex went off twice with a kick ready.', false]]) if (re.test(t) !== ok) bad('the findings\' sorting reads "' + t + '" as ' + (ok ? 'to fix' : 'done')); }
  if (s.indexOf("'%;--c:' + col + '\" aria-expanded=\"'") < 0) bad('the ranked rows no longer carry their player\'s class colour');
  if (s.indexOf("(v.best ? '<span class=\"mpr-vsb\" style=\"--c:' + mpCC(x.p.cls) + '\"'") < 0) bad('vs spec lost its against-top bar (filled to the best of the spec, a mark at its middle player)');
  // Rotation
  if (s.indexOf('function mpxRotBan(R, name, sc, spec, me, tiles)') < 0 || s.indexOf('const card = (wide ? mpxRotBan(R, name, sc, spec, me, tiles) : who + tiles) + ') < 0) bad('Rotation no longer opens with the banner on the website (or the Companion card lost its own top)');
  if (/function mpxRotBan[\s\S]{0,2500}mpv-psel/.test(s)) bad('Rotation\'s second Player picker is back on the website (the page bar picks the player)');
  { const m = s.match(/\nfunction mpxRotBan\([\s\S]*?\n(?=\S)/); if (!m) bad('mpxRotBan cannot be read');
    else { let f; try { f = vm.runInNewContext('const letterOf = (v) => v >= 97 ? "S" : v >= 92 ? "A" : "B", MP_ART = { "kings\' rest": "kr" }, mpLc = (x) => String(x).toLowerCase(), whIcon = (n) => n + ".jpg", esc = (x) => String(x), mpT1 = () => " data-tt=\\"x\\"", mpCC = () => "#fff";\n' + m[0] + '\nmpxRotBan', {}); } catch (e) { bad('mpxRotBan does not run by itself: ' + String(e.message).slice(0, 100)); }
      if (f) { const h = f({ run: { dungeon: "Kings' Rest" } }, 'Flex', 97, 'Holy Paladin', { cls: 'PALADIN' }, '<div class="mpv-tiles mpk-t3"><div class="mpv-tile mpk-tile"><small>Damage while the group is healthy</small><b class="ok">78%</b><i>x</i></div><button type="button" class="mpv-tile" data-mpcf="trash"><small>Trash pulls</small><b class="warn">1 to fix</b><i>y</i></button></div>');
        if (h.indexOf('<b class="mrs-gb g-S">S</b>') < 0 || h.indexOf('mrs-gS') < 0 || h.indexOf('kr.jpg') < 0) bad('Rotation\'s banner lost its grade badge (97 is an S) or the dungeon\'s art');
        if (h.indexOf('<img class="mpx-ti" src="ability_warrior_innerrage.jpg"') < 0 || h.indexOf('<img class="mpx-ti" src="achievement_bg_killxenemies_generalsroom.jpg"') < 0 || h.indexOf('data-mpcf="trash"') < 0) bad('Rotation\'s tiles lost their icons in the banner, or stopped being buttons'); } } }
  if (/function mpxRep\(R, fx\)[\s\S]{0,12000}rct-roles/.test(s)) bad('the ranked group has its Everyone / Tank / Healer / DPS filter again (Flex, Nov 16: "remove this")');
  // the look
  const a = css.indexOf("/* Players' makeover (Nov 16"), z = a < 0 ? -1 : css.indexOf('</style>', a), blk = a < 0 || z < 0 ? '' : css.slice(a, z);
  if (!blk) { bad('the Players makeover\'s look is gone'); return; }
  const V = 'html:not(.mpcard) body #view#view#view #mptBody#mptBody ', has = (sel, decl, why) => { const i = blk.indexOf(sel + ' {'); if (i < 0 || blk.indexOf(decl, i) < 0 || blk.indexOf(decl, i) > blk.indexOf('}', i)) bad(why); };
  has(V + '.mpx-ban .mprs-up > b.mrs-gb', 'background: var(--gc) !important;', 'the banners\' grade is no longer a solid badge in its colour');
  has(V + ':is(.mpr-gban, .mpx-banw)', 'container: mpsb / inline-size !important;', 'the banners no longer fold like The key\'s on a narrow screen');
  has(V + '.mpr-gwk span.mpr-co.mpr-co-ok', 'border-color: rgba(69,193,92,.45) !important;', 'a good finding is no longer a green tag');
  has(V + '#mptCP .rcb-tr[data-mprp]', 'border-left: 3px solid var(--c) !important;', 'the ranked rows lost their class-colour edge');
  has(V + '.mpx-ban .mpv-tile > b.warn', 'color: var(--warn) !important;', 'a Rotation tile to fix is no longer amber');
  if (blk.indexOf('#mptBody#mptBody#mptBody#mptBody#mptBody#mptBody#mptBody > #mptCCv { display: none !important; }') < 0) bad('"Against top players" shows as its own section again (it is in the ranked group\'s vs spec)');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ Players makeover: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
