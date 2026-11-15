// The Nov 13 look review's fixes stay in (Flex, Nov 13: "no its fine just make the changes", on the fresh-eyes review's top 10; reviewed on main
// bd6632f7). Each line names the fix it guards and fails if the page code loses it. contradictions.js runs it on every build.
'use strict';
module.exports = function lookReview(H, say) {
  const bad = (m) => say('the page code', 'look review', m), SH = H.SH;
  const css = (SH.match(/<style id="look-nov13">([\s\S]*?)<\/style>/) || [])[1] || '';
  if (!css) { bad('the look review\'s styles (style#look-nov13) are gone from shell.html'); return; }
  const at = SH.indexOf('<style id="look-nov13">'), lastStyle = SH.lastIndexOf('<style');
  if (at < lastStyle) bad('style#look-nov13 is no longer the last style on the page, so older rules in the same layer can win again');
  // fix 1: the Menu button shows its lines and the word Menu (it was a blank square: the icon squeezed to 6px)
  const mb = (SH.match(/<button[^>]*id="tbMenu"[^>]*>[\s\S]*?<\/button>/) || [])[0] || '';
  if (!/<span class="tbm-w">Menu<\/span>/.test(mb)) bad('fix 1: the Menu button lost its word "Menu"');
  if (/Open a log or a report/.test(mb)) bad('fix 1: the Menu button\'s label says "Open a log or a report" again');
  if (!/#tbMenu\.tbm-b > svg \{ flex: none !important; width: 16px/.test(css)) bad('fix 1: the Menu button\'s three lines can be squeezed again');
  // fix 2: an answer is never smaller than its own detail line (Summary's Next time sentence was 11px under a 15px story)
  if (!/\.dbt-why \.dbt-ln > span:not\(:first-child\) \{ font-size: 13\.5px/.test(css)) bad('fix 2: Summary\'s "Next time" sentence can be 11px again');
  if (!/em\.ahg-nx[^{]*\{ font-size: 13\.5px/.test(css)) bad('fix 2: Also hurt\'s Next time lines can be smaller than their detail line again');
  // fix 4: one pick-one switch look (slim tabs, gold underline) for .seg, "Compared with", Plan's Mythic/Heroic and Mythic+'s switch
  if (!/:is\(\.seg, \.r378-seg, \.ndz-seg, \.mpf-s3sw\) > button:is\(\.on/.test(css) || !/border-bottom-color: #d4b77d/.test(css)) bad('fix 4: the pick-one switches are no longer one look');
  // fix 5: one gold button a screen
  if (!/:is\(\.plc-acts, \.dbn-add, \.th-box\) \.btn\.primary/.test(css)) bad('fix 5: Plans\' Import buttons, Summary\'s Import NSRT note or Mythic+\'s Open are gold again');
  // fix 6: themes only recolour
  if (!/\.r437-t > b \{ font-size: 18px !important/.test(css) || !/p\.rpc-lead > b \{ font-size: 13\.5px/.test(css)) bad('fix 6: the Report card tile scores or Rotation\'s lead line can shrink with a theme on again');
  // fix 7: sitting out is a quiet grey dash, not a red X
  const sit = (css.match(/\.nt-tk\.sit::after[^{]*\{([^}]*)\}/) || [])[1] || '';
  if (!/content: '\\2013'/.test(sit) || /255,\s*143|229,\s*83|239,\s*107/.test(sit)) bad('fix 7: a raider sitting out shows a red X on the roster again');
  // fix 8: one face
  if (!/#view \.nsm, html body #view \.nsm \* \{ font-family: 'Barlow Condensed'/.test(css)) bad('fix 8: Summary All pulls\' night chart is back in plain Barlow');
  // fix 9 + 10: Home and Mythic+ on the type scale; Home's panels fit what they hold
  if (!/\.hd-ph > h3, \.hd-kr \.hd-kl\) \{ font-size: 18px/.test(css)) bad('fix 9: Home\'s panel titles are off the type scale again');
  if (!/\.hd-r2, [^{]*\.hd-r3 \{ align-items: start/.test(css) || !/\.hd-season \.hd-srs \{ flex: none/.test(css)) bad('fix 10: Home\'s Your season tiles or the ladder panel stretch to twice their content again');
  // (Nov 13, Flex: "yea fine do them" on the review's option A pictures, then "Yes, push all"): Plan › Plans is the raid nights on top and one list
  const UI = H.UI, plc = (() => { try { return H.grab('plcH'); } catch (e) { return ''; } })();
  if (!/plc-w plc-a/.test(plc) || /plc-cal/.test(plc)) bad('Plans: the raid nights on top and one list (option A) is gone, or the month calendar is back');
  if (!/'<button type="button" class="plc-use" ' \+ useA\(r\.x\) \+ '>Use for '/.test(plc) || (plc.match(/class="plc-use"/g) || []).length !== 1) bad('Plans: the one gold "Use for <night>" button on the closest plan is gone or doubled');
  // Compare opens on where you stand
  if (!/const CMP_MODES = \[\['top', /.test(UI)) bad('Compare: it no longer opens on Top raiders of your spec (option A)');
  if (!/if \(S\.cmpTopW == null\) \{ const U = k === 'heal'/.test(UI)) bad('Compare: the start screen (who you are and where you stand, straight away) is gone');
  // the default look one step darker behind the panels ("A step darker"); the themes keep their own
  if (!/html:not\(\[data-theme\]\) body\.refine \{\s*--bg: #0a0b0d !important/.test(SH)) bad('the default look\'s page is no longer the darker #0a0b0d Flex picked');
  if (!/html\[data-theme="aurora"\] body\.refine\{--bg:#060912/.test(SH)) bad('a theme (Aurora) lost its own page colour');
  // (fix 3, Flex Nov 13: "Yes, fix 3": on a first visit, while the team's nights are still coming in (its first import, no g.last yet), Home showed
  // "Not pulled yet" on killed bosses and a guessed raid day for its first seconds; the boss row and the next raid shimmer until the import is in)
  const hd = (() => { try { return H.grab('hdDash'); } catch (e) { return ''; } })();
  if (!/const ld0 = S\.progBusy === g\.gid && !g\.last;/.test(hd) || !/\(ld0 \? shim\('4\.5em'\) : k \? 'Killed'/.test(hd) || !/const hnx = ld0 \?/.test(hd)) bad('fix 3: Home\'s first visit shows "Not pulled yet" on killed bosses or a guessed raid day again while the nights come in');
  // (Nov 14, Flex: "I feel like rotation is kinda weak", "re-design this page top to bottom make it good", "not just showing them what they did wrong, but
  // what they need to do to fix it and maybe show them the correct version", then "Yes, build this" on the two pictures): Rotation is a coach. Work on these
  // shows You next to Better with a Next time line, and Your rotation, part by part opens a part to how it's played and the priority list
  if (!/function picOf\(c, D, T, force\)/.test(UI) || !/<b>Work on these<\/b>/.test(UI) || !/data-rczsec="/.test(UI) || !/function aplList\(c, D\)/.test(UI)) bad('Rotation: the coach page (Work on these with You next to Better, and Your rotation, part by part) is gone');
  if (!/'<span class="rcz-who ' \+ \(k === 'you' \? 'you' : 'bet'\)/.test(UI) || !/<span>Next time<\/span>/.test(UI)) bad('Rotation: a fix no longer shows You next to Better, or lost its Next time line');
  if (!/\.pf-inl\.spc-v\.rcz-on > \.ds-rtop, [^{]*\.rtl-vt \{ display: none !important/.test(css) || !/\.rcz-who\.you \{ color: var\(--warn/.test(css)) bad('Rotation: the coach page\'s styles are gone, so the old top box and checklist show again');
  if (!/function fillJ\(pg, P, box\)/.test(UI) || !/data-rczf', 'gx'/.test(UI)) bad('Rotation: a part\'s How it\'s judged (today\'s full detail of each check) or the Gear and extras fold is gone, so a fact was dropped');
  if (/class="rda-strip"/.test(UI)) bad('Rotation: option A (the strip of cooldown lanes) is back. Flex, Nov 14: "not gonna lie i kinda hate this layout"');
  // (Nov 14, Main: "the cut is the cut": every number that says "counted up to" stops at the wipe call; Rotation's ran to the end of the pull for raiders still alive)
  if (!/const cutEnd = \(r\) =>/.test(UI) || !/outT = per\.reduce\(\(v, x\) => v \+ outCut\(x\.r, x\.p\[outK\]\)/.test(UI) || !/s: one && r0 \? outCut\(r0, /.test(UI) || !/mine = outCut\(r, mineT\)/.test(UI) || !/const cutK = \(x, hl\) =>/.test(UI) || !/const end = cutEnd\(r\), boss = bossNamesOf\(r\)/.test(UI)) bad('Rotation, Compare or Graphs: a number that says "counted up to" no longer asks the one cut (cutEnd / outCut) (Main, Nov 14: "the cut is the cut")');
  // (Nov 14, Flex: "Yes, do it" on the rating's top fix: a cooldown's card showed 12 squares next to 10, not when it sat ready)
  if (!/function readyPic\(c, D, T\)/.test(UI) || UI.indexOf("vs = { kind: 'ready', cd: l[0].cd") < 0 || UI.indexOf('ts: (y.ts || []).slice(), t1: y.t1') < 0) bad('Rotation: a cooldown\'s card no longer shows when it sat ready (the strip of the pull, Nov 14)');
  // (the polish pass, Nov 14, Flex to the design chat: "much better, but i think visually a bit difficult to read/navigate"): the parts are tiles in rows,
  // one line a check, and an "On this page" row follows you down the page
  if (!/function jumpBar\(pg, sec\)/.test(UI) || !/\.rcz-jump\.show \{ display: flex !important/.test(css) || !/\.rcz-book \{ display: grid !important; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important/.test(css)) bad('Rotation: the polish pass is gone (the parts as tiles in three columns, or the "On this page" row)');
  // (Nov 14, Flex: "use the timeline find bugs", and "I dont think two player toggles are needed probably just keep the one at the top")
  if (/rcz-selw/.test(UI)) bad('Rotation: a second Change player is back in the coach band; the site\'s Player picker at the top switches the page (Flex, Nov 14)');
  if (!/function tourKill\(\)/.test(UI) || UI.indexOf("if (!box.offsetParent || document.querySelector('.ptip')") < 0) bad('Rotation: the Timeline\'s first-visit tour can float over the Coach view or another page again (found Nov 14 with the Timeline)');
  if (!/the page's own number, over the whole pull/.test(UI)) bad('Rotation: the Timeline\'s average HPS/DPS is a second number again, not the page\'s own (it read 390K against 381.3K on pull 19, Nov 14)');
  if (!/only checks the page calls off, in What to fix's order/.test(SH)) bad('Rotation: the Timeline\'s What to fix can list checks the page calls fine again (Holy Shock on cooldown 98% on pull 19, Nov 14)');
  // (Main, Nov 14: the coach page's labels were 11px; nothing a raider must read is under 12px (Design system, section 2: Label 12px / 700 UPPERCASE))
  { const small = (css.match(/[^{}]*\.rcz[^{}]*\{[^{}]*\}/g) || []).filter((r) => (r.match(/(?:font-size:\s*|font:[^;]*?\s)(\d+(?:\.\d+)?)px/g) || []).some((x) => parseFloat(x.match(/(\d+(?:\.\d+)?)px/)[1]) < 12)); if (small.length) bad('Rotation: text under 12px on the coach page again: ' + small[0].trim().slice(0, 90)); }
  // (Plan, Nov 14, Flex: "i dont think its super clear what night you are building the roster and plan for yet": the night is the page's title on every
  // Plan tab. Found that day on Wolfthorn's plan: the night was a "Wed 11" chip on the third row, Roster's 22px date had been shrunk to 13.5px by a
  // text-size rule, and "Every boss tonight" was said of a night three days gone)
  { const bar = (() => { try { return H.grab('planBarH'); } catch (e) { return ''; } })(), top = (() => { try { return H.grab('pnTopH'); } catch (e) { return ''; } })();
    if (!/'<div class="pv-nighth" role="group"[^']*>' \+ pnTopH\(\) \+ '<\/div><div class="panel pg-bar"><nav class="pg-bosses"/.test(bar)) bad('Plan: the night is no longer the page\'s title (planBarH must draw the pv-nighth banner first, and the bar must hold the bosses only)');
    if (!/<span class="pnb-k">Planning for<\/span>/.test(top) || !/class="pg-dpb"/.test(top) || !/weekday: 'long'/.test(top) || !/class="pnb-rel /.test(top) || !/data-ntdiff=/.test(top)) bad('Plan: the night banner lost a piece (Planning for, the date as the picker, how far away it is, or Mythic | Heroic)');
    if (!/R\.g < 0 \? pnNextOf\(k\) : null/.test(top) || !/class="btn sm pnb-next" data-pnight=/.test(top)) bad('Plan: a night that is over no longer offers the next raid night');
    if (!/#assignBox > \.pv-nighth \{ display: flex !important;[^}]*order: -6 !important/.test(css)) bad('Plan: the night banner is hidden or out of order again (it shows on every tab, above the tabs)');
    const dpb = (css.match(/\.pv-nighth \.pg-dpb \{([^}]*)\}/) || [])[1] || '', px = +((dpb.match(/font: 700 (\d+(?:\.\d+)?)px/) || [])[1] || 0); if (px < 22) bad('Plan: the night\'s date is under 22px again (it was shrunk to 13.5px small print before Nov 14)');
    if (/Every boss tonight\./.test(UI) || !/Every boss ' \+ pnWhenL\(\) \+ '\./.test(UI)) bad('Plan: Who plays says "Every boss tonight" whatever the night is again'); }
  // (Plan, Healing cooldowns, Nov 14, Flex with a picture of Ula'tek: "Feel like theres a little too much space between the damage coming in and the
  // cooldowns": By mechanic, the graph waited for the icon tray on the left to end, about 200px under the last cooldown)
  if (!/dTop = top0 \+ \(BYM \? Math\.max\(cRows, 2\) : cRowsL\) \* CH \+ \(BYM \? 0 : PRX\)/.test(UI)) bad('Plan, Healing cooldowns: the damage graph waits for the icon tray again, leaving an empty band under the cooldowns (Flex, Nov 14)');
  // (Plan's tabs, Nov 14, Flex with a picture of "Roster 25 playing · Healing cooldowns 1 big hit uncovered · Assignments 0 of 2 filled · My note none
  // yet · Plans 11 saved": "I really dont like the extra text at the top, its clutter. Can we change it to an icon with a tooltip explaining whats wrong?")
  if (!/#assignBox \.pg-tab \.pg-tabn \{ display: none !important; \}/.test(css) || !/\.pg-tab \.pg-tabn:is\(\.warn, \.ok\) \{[^}]*font-size: 0 !important/.test(css)) bad('Plan: the tabs show their text chips again ("25 playing", "1 big hit uncovered"); Flex, Nov 14: "its clutter", an icon with a tooltip instead');
  if (!/const pgTabTip = \(l, b\) =>/.test(UI) || !/\(b && b\[1\] \? ' data-tt="' \+ esc\(pgTabTip\(l, b\)\)/.test(UI) || !/\[C\[2\], C\[1\] \? 'ok' : 'warn', 'Cooldowns'\]/.test(UI)) bad('Plan: a tab\'s icon no longer says what is left when you point at it (Flex, Nov 14: "an icon with a tooltip explaining whats wrong")');
  // (Mythic+, Nov 14, Flex: "I think the mythic+ page needs a complete redesign/new layout", "its hard to read", "i was trying to use it to look at mistakes
  // made throughout the key, like missed interupts and i genuinely couldnt find the information". Found that day on his Voidscar Arena +19: the page said
  // "Missed kicks 6" and nothing more; which spell, which pull and whose kick was ready sat in hovers on fourteen pull cards)
  { const MPT = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'mptab.js'), 'utf8');
    if (!/function mpxData\(R, F\)/.test(MPT) || !/function mpxHtml\(R, F\)/.test(MPT) || MPT.indexOf('mpxKey(ban, scoreH + band) + mpxChap(R, F)') < 0) bad('Mythic+: a key no longer has its Mistakes page (every missed kick, death and debuff left on of the whole key in one list; Flex, Nov 14: "i genuinely couldnt find the information")');
    if (MPT.indexOf('<span class="mpx-l">Kick ready</span>\' + x.ready.map((n2) => mpWho(R, n2))') < 0 || MPT.indexOf('+ mpxPull(R, x.i) +') < 0) bad('Mythic+: a missed kick no longer says its pull and whose kick was ready (Flex, Nov 14: missed interrupts could not be found)');
    if (!/const MPX_VIEWS = \[\['run', 'Summary'\], \['mis', 'Mistakes'\], \['hit', 'Big hits'\], \['map', 'Route'\], \['rot', 'Players'\], \['dun', 'Dungeon'\]\]/.test(MPT) || MPT.indexOf("mpxView(MP.cv || 'run')") < 0) bad('Mythic+: a key is one long page again (its tabs are gone: Summary, Mistakes, Big hits, Route, Players, Dungeon; Flex, Nov 14: "its hard to read")');
    if (MPT.indexOf('fixes + behindH, mpxDigest(R, F))') < 0 || MPT.indexOf('data-mpxv="mis" data-mpxk="kick"') < 0) bad('Mythic+: the Summary lost its Mistakes box, or its Missed kicks number no longer opens the list');
    if (MPT.indexOf("mpxView('map'); mpMapPick('you', ids,") < 0) bad('Mythic+: "Show on the map" lights pulls on a map that sits on another tab (it must open Route first)');
    if (!/const mpxKey = \(ban, sum\) => \(MPC_ON \? mpChap\('mptC1', 'The key', '', ban \+ sum\)/.test(MPT) || !/const mpxChap = \(R, F\) => \(MPC_ON \? ''/.test(MPT) || !/function mpxDigest\(R, F\) \{ if \(MPC_ON\) return '';/.test(MPT)) bad('Mythic+: the Companion\'s card no longer keeps its own layout (the tabs and Mistakes are the website\'s only)');
    if (MPT.indexOf('mpxKickCell(R, p) + num(p.stops) +') < 0) bad('Mythic+: the Players table no longer shows, by the kicks, the casts that went off with that player\'s kick ready');
    if (!/html:not\(\.mpcard\)\[data-mpv="mis"\] body #view#view#view #mptBody > \*:not\(#mptC1\):not\(#mptCX\)/.test(css) || !/\.mpx-r:not\(\.mpx-rd\), html:not\(\.mpcard\) body #view#view#view \.mpx-rd > summary \{ display: grid !important/.test(css)) bad('Mythic+: the key page\'s tab styles or the Mistakes rows\' styles are gone');
    // (the same day, Flex with a picture of the map's pull card, "Pull 1 1:09 · +7.7% · 7.7% total · 1.91m group DPS", "Most mistakes", "! Demoralizing Shout", "Bolster ×6":
    // "this section has a lot in it thats really confusing and unclear")
    if (!/function mpxCard\(o\)/.test(MPT) || MPT.indexOf('if (!MPC_ON) return mpxCard({ q, run, RR, p, i, gd,') < 0 || MPT.indexOf('<p class="mpx-ck">Mistakes</p>') < 0 || MPT.indexOf("fact('Lasted', mpMM(p.dur)") < 0) bad('Mythic+: the map\'s pull card is unlabelled numbers and tags again ("1:09 · +7.7% · 7.7% total", "! Demoralizing Shout", "Bolster ×6"); Flex, Nov 14: "really confusing and unclear"');
    // (the same evening, with a picture of the card's three tables: "This all needs to be re-designed somehow as well", "maybe it should be a chat replay section")
    if (!/function mpxFeed\(o\)/.test(MPT) || MPT.indexOf('mpxFeed(o) +') < 0 || MPT.indexOf('<p class="mpx-ck">Play by play') < 0 || !/\.mpt-mcard \.pp-off \{ opacity: 1 !important; \}/.test(css)) bad('Mythic+: a pull is three tables again, not told in order (the play-by-play is gone), or picking a player greys every other row out again; Flex, Nov 14: "This all needs to be re-designed", "maybe it should be a chat replay section"');
    // (Big hits, the same evening, with pictures of its grids: "I see what this is showing now it just was expanded and the others werent", "Is there a way to compact this a little bit more and have it always expanded")
    if (!/function mpxBh\(\)/.test(MPT) || MPT.indexOf("cx.querySelectorAll('details.bh-hit').forEach((d) => { d.open = true; });") < 0 || !/#mptCH \.bh-c \{ flex-direction: row !important;[^}]*height: 26px !important/.test(css)) bad('Mythic+: Big hits shows one grid open and the rest shut again, or its boxes are two lines tall again (Flex, Nov 14: "compact this a little bit more and have it always expanded")');
    if (!/const mpxDefIc = \(L\) =>/.test(MPT) || MPT.indexOf('s.outerHTML = mpxDefIc(L);') < 0) bad('Mythic+: Big hits types the defensive\'s name in each box again, cut short on a narrow screen (Flex, Nov 14: "instead of typing out the name of the ability use the spell icons")');
    { const small = (css.match(/[^{}]*\.mpx-[^{}]*\{[^{}]*\}/g) || []).filter((r) => (r.match(/(?:font-size:\s*|font:[^;]*?\s)(\d+(?:\.\d+)?)px/g) || []).some((x) => parseFloat(x.match(/(\d+(?:\.\d+)?)px/)[1]) < 12)); if (small.length) bad('Mythic+: text under 12px on the Mistakes page: ' + small[0].trim().slice(0, 90)); } }
  // (Mythic+, Nov 14, round 2, Flex with pictures of pull 8 of his +19 Kings' Rest of Sep 25: "If a cc cast stopped a cast it should be noted", "if a defensive
  // was used during an aoe, or while they had a debuff, or were in danger etc etc it should be noted", "dispels should also be included here"; and of the
  // Players and Rotation tabs: "I think these two sections could be merged together probably")
  { const MPT = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'mptab.js'), 'utf8');
    if (MPT.indexOf("S.length ? '<em class=\"v-s\">stopped</em> ' + [...m].map(") < 0 || MPT.indexOf('for (const x of p.stops || []) if (!usedSt.has(x))') < 0) bad('Mythic+: Play by play no longer leads a CC line with the casts it stopped, or drops a stop it saw no press for (Flex, Nov 14: "If a cc cast stopped a cast it should be noted")');
    if (!/function mpxDefWhy\(RR, p, who, t, name\)/.test(MPT) || MPT.indexOf('<span class="mpx-why">') < 0 || MPT.indexOf('ptk = R.ptk = {}, phm = R.phm = {}, pmx = R.pmx = {}') < 0 || MPT.indexOf('h9[k9] = pc9; pmx[tn2] = mx9;') < 0) bad('Mythic+: a defensive in Play by play no longer says what it was pressed into (their health, the big hit, the debuff, the damage after), or the log pass stopped keeping damage taken and health (Flex, Nov 14: "it should be noted")');
    if (MPT.indexOf("add(y.s, died || y.long ? 'bad' : 'note', y.who, 'got ' + sp(y.n)") < 0 || MPT.indexOf("['stop', 'Kicks, CC and dispels']") < 0) bad('Mythic+: a debuff nobody dispelled is no longer in Play by play, or dispels left the Kicks, CC and dispels list (Flex, Nov 14: "dispels should also be included here")');
    // (the same evening, found on his +19 Kings' Rest (report dtMfgnRvDwBLPCKZ, fight 2) on f3bfea72: bold words in Play by play and Rotation at 22px. The type
    // scale wrote "b:not([class]) { font-size: 22px }" with no container, from a plain <b> under a parent with no class)
    if (/var k2 = \(pk \? pk \+ ' > ' : ''\)/.test(SH) || SH.indexOf("if (!pk) return; /* (Nov 14: a parent with no class gave a rule with no container") < 0) bad('the type scale can write a rule with no container again ("b:not([class]) { font-size: 22px }" made every plain bold word 22px on a Mythic+ key, Nov 14)');
    if (MPT.indexOf('<div class="mpx-top"><h2 class="mpx-h">') < 0 || MPT.indexOf("'<span class=\"mpx-f1\"' + (tip ?") < 0 || MPT.indexOf('</i><div class="mpx-cb"><p>') < 0 || MPT.indexOf('<summary class="mpx-ms">') < 0) bad('Mythic+: a plain <b>, <small>, <i> or <p> sits under a parent with no class again on the key page (the headline, the facts tiles, a mistake row or the Worth a kick fold): that is what made the type scale resize every bold word, Nov 14');
    if (!/\['map', 'Route'\], \['rot', 'Players'\], \['dun', 'Dungeon'\]\]/.test(MPT) || MPT.indexOf("if (v === 'grp') v = 'rot';") < 0 || !/\[data-mpv="rot"\] body #view#view#view #mptBody > #mptC4 \{ display: block !important; \}/.test(css)) bad('Mythic+: Players and Rotation are two tabs again (Flex, Nov 14: "these two sections could be merged together")'); }
  // the key page as the raid review's sibling (Nov 14; Flex: "i dont want it to be a mirror copy of the raid review tab but i want it to be a brother or sister of it in similarity")
  { const MPT = require('fs').readFileSync(require('path').join(__dirname, '..', 'src', 'mptab.js'), 'utf8');
    if (MPT.indexOf("'</div>' + mpxBar(R0));") < 0 || MPT.indexOf('<select id="mptPick" aria-label="Pick a key">') < 0 || MPT.indexOf('data-mpxstep="-1"') < 0 || MPT.indexOf('<select data-mppsel aria-label="Show a player"') < 0) bad('Mythic+: the key and the player are no longer in one bar under the tab row (the raid review\'s frame; Flex, Nov 14: "a brother or sister of it")');
    if (!/#mptBody#mptBody#mptBody > \.mpc-tabs:not\(#mptC1\) \{ display: flex !important;[^}]*position: sticky !important; top: 0 !important;/.test(css) || MPT.indexOf("const ban = b.querySelector(':scope > #mptC1'), it0 = MP.item") < 0) bad('Mythic+: the key page\'s tab row no longer sits under the banner and sticks to the top (it must also outweigh the rules that hide the other tabs\' chapters)');
    if (MPT.indexOf('if (!MPC_ON) return mpxPart({ pick, name, own, p, cn, rows, nt });') < 0 || MPT.indexOf("' mistakes</p>'") < 0 || MPT.indexOf("did well</p>'") < 0 || MPT.indexOf('<div class="mpt-prows mpx-ccn">') < 0) bad('Mythic+: Your part is no longer the coach panel (the one fix, the mistakes beside what went well, the plain numbers under them)');
    if (MPT.indexOf('+ mpxPP(R, fx) + mpxGlance(bh.tl);') < 0 || MPT.indexOf('<b class="mpx-glt">The key at a glance</b>') < 0 || MPT.indexOf("if (gl) mpxView('map');") < 0) bad('Mythic+: The key at a glance left Summary, or a pull clicked in it no longer opens on the Route tab');
    if (!/#mptC1 > \.mpt-ban \.mpt-res \{ position: static !important; inset: auto !important; width: auto !important;/.test(css)) bad('Mythic+: the "Left early" pill is a strip across the banner again (its class, mpt-rl, is also the map\'s route line, which is absolute and full width; seen on The Blinding Vale +21 of Sep 25, report dtMfgnRvDwBLPCKZ fight 4, on Nov 14)');
    if (MPT.indexOf('{ mpxView(t.dataset.mpcv); mpxTop();') < 0 || MPT.indexOf('const y = c1.getBoundingClientRect().bottom; if (y < 0) window.scrollTo') < 0) bad('Mythic+: a tab picked while scrolled down no longer starts at its top (the tab row sticks, so the page must scroll back to just under the banner)');
    if (MPT.indexOf('mpxScore(keyLine, gLine, scoreT,') < 0 || MPT.indexOf('<p class="mpx-fix"><span class="mpx-fk">Fix first</span><span class="mpx-fxt">') < 0) bad('Mythic+: Summary lost its score panel (one sentence, the five numbers, Fix first)');
    if (MPT.indexOf('<p class="mpx-cch1"><span class="mpx-ccw"') < 0 || MPT.indexOf('<p class="mpx-glh"><b class="mpx-glt">') < 0 || MPT.indexOf('<p class="mpx-cchd"><span class="mpx-cck">') < 0) bad('Mythic+: a plain <b> or <span> sits under a parent with no class in the new Summary panels (the type scale resizes those: every bold word was 22px on Nov 14)');
    if (MPT.indexOf("(MPC_ON ? '<div class=\"mpt-bl\">' + mpPartHtml(R, fx, MP.pp) + '</div>' : '')") < 0 || MPT.indexOf("(MPC_ON ? 'Mythic+' + (date ? ' · ' + esc(date) : '')") < 0 || MPT.indexOf('function mpxBar(R) { if (MPC_ON || !R) return \'\';') < 0) bad('Mythic+: the Companion\'s card lost its own layout (Your part in its band, its "Mythic+ · date" line, no website toolbar)'); }
};
