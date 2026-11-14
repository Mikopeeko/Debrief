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
  // (Main, Nov 14: the coach page's labels were 11px; nothing a raider must read is under 12px (Design system, section 2: Label 12px / 700 UPPERCASE))
  { const small = (css.match(/[^{}]*\.rcz[^{}]*\{[^{}]*\}/g) || []).filter((r) => (r.match(/(?:font-size:\s*|font:[^;]*?\s)(\d+(?:\.\d+)?)px/g) || []).some((x) => parseFloat(x.match(/(\d+(?:\.\d+)?)px/)[1]) < 12)); if (small.length) bad('Rotation: text under 12px on the coach page again: ' + small[0].trim().slice(0, 90)); }
};
