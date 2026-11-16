// Mythic+ Summary: Know this dungeon marked from the key's own log, second on the Summary and open (Nov 16, Flex with a picture of it: "I really think this
// section should be more highlighted, its so good at looking at what went well/wrong at a glance. I think the page needs some color coding again").
// This runs mpxKnow on a made-up key and fails if: a must-kick that went off stops being a red ✗ (with how many times) or one that never went off stops
// being a green ✓; a plan line stops naming who was hit, killed or left low by its spell; a line the log can't judge gets a colour (proof only: grey dot);
// a low-danger kick counts as a miss; a boss card stops saying its fight against the fast run's (or its deaths), or a boss in the plan stops finding the
// run's boss of another name ("Dazar, the First King" is "King Dazar"); trash stops saying its deaths; a debuff left on too long stops being red, or one that
// never landed gets a mark; the count on top counts a spell twice; the website stops using it, or the Companion card and the pop-up before a key stop
// keeping the plain list; it is folded again or leaves second place on the Summary; or its colours go grey again.
// contradictions.js runs it on every build. Each part fails on c0b2de10.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
module.exports = function mplusKnowMarks(say) {
  const bad = (m) => say('Mythic+ Summary', 'Know this dungeon, marked', m);
  let s, css; try { s = fs.readFileSync(path.join(__dirname, '..', 'src', 'mptab.js'), 'utf8'); css = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('could not read src: ' + e.message); return; }
  if (s.indexOf('\nfunction mpxKnow(') < 0) { bad('Know this dungeon is not marked from the key\'s log (Flex, Nov 16: "its so good at looking at what went well/wrong at a glance. I think the page needs some color coding again")'); return; }
  const fn = (n) => { const a = s.indexOf('\nfunction ' + n + '('); let i = s.indexOf('{', a), d = 0; for (; i < s.length; i++) { const c = s[i]; if (c === '{') d++; else if (c === '}' && --d === 0) break; } return s.slice(a, i + 1); };
  const one = (re, what) => { const m = s.match(re); if (!m) throw new Error('src/mptab.js has no ' + what); return m[0]; };
  let K; try {
    const src = [one(/\nconst MPK_W = [^\n]*/, 'MPK_W'), one(/\nconst mpKm = [^\n]*/, 'mpKm'), one(/\nconst mpAnd = [^\n]*/, 'mpAnd'), one(/\nconst mpxTo = [^\n]*/, 'mpxTo'), fn('mpxKnow')].join('\n');
    K = vm.runInNewContext('const esc = (x) => String(x), mpLc = (x) => String(x || "").toLowerCase(), plural = (n, w) => n + " " + w + (n === 1 ? "" : "s"), mpMM = (v) => Math.floor(v / 60) + ":" + String(Math.round(v % 60)).padStart(2, "0"), mpWho = (R, n) => "<b class=\\"mpt-nm\\">" + n + "</b>";\n' +
      'let DATA = null, DISP = []; const mpxData = () => DATA, mpDisp = () => ({ list: DISP });\n' + src + '\n({ run: (R, KN, F, data, disp) => { DATA = data; DISP = disp; return mpxKnow(R, KN, F); } })', {});
  } catch (e) { bad('Know this dungeon\'s marks no longer read by themselves: ' + String(e.message).slice(0, 140)); return; }
  const KN = { b: [['The Golden Serpent', ['Drop the [[Spit Gold]] puddles away.', 'Don\'t let the adds reach the boss.']], ['Dazar, the First King', ['Kick [[Deathly Roar]].', 'Spread for [[Quaking Leap]].']]],
    t: ['You need every mob for count.', 'Kill the **Healing Tide Totems** fast.'], k: ['Deathly Roar', 'Hex', 'Bind Soul'], d: ['Lingering Fluid', 'Savage Maul', 'Putrid Seekers'], p: ['Bound by Shadow'] };
  const R = { pulls: [{ s: 0, e: 100, dur: 100, through: [{ spell: 'Hex' }, { spell: 'Hex' }], deaths: [{ who: 'Dps', to: 'Shadow Bolt' }] }, { s: 110, e: 300, dur: 190, boss: 'The Golden Serpent' },
    { s: 310, e: 400, dur: 90, boss: 'King Dazar', kill: false }, { s: 420, e: 600, dur: 180, boss: 'King Dazar', deaths: [{ who: 'Heal', to: 'Quaking Leap' }] }], tiers: { 'bind soul': 'low' }, spam: [{ spell: 'Bind Soul', kicked: 3, casts: 5 }] };
  const F = { pulls: [{ boss: 'The Golden Serpent', dur: 160 }, { boss: 'King Dazar', dur: 175 }] };
  const D = { avoid: [{ spell: 'Spit Gold', who: 'Tank', n: 2 }, { spell: 'Spit Gold', who: 'Dps', n: 1 }], death: [{ who: 'Dps', d: { to: 'Shadow Bolt' } }, { who: 'Heal', d: { to: 'Quaking Leap' } }], close: [], disp: [] };
  const DI = [{ n: 'Lingering Fluid', who: 'Tank', long: true }, { n: 'Savage Maul', who: 'Dps' }, { n: 'Savage Maul', who: 'Heal' }];
  let J; try { J = K.run(R, KN, F, D, DI); } catch (e) { bad('Know this dungeon\'s marks crashed on a made-up key: ' + String(e.message).slice(0, 140)); return; }
  const h = J.body, cards = h.split('<div class="mpt-kb2').slice(1), li = (t) => (h.split('<li class="mpk-l ').find((x) => x.indexOf(t) >= 0) || '');
  // the kicks
  const hex = li('<b class="mpt-ab">Hex</b>'); if (hex.indexOf('mpk-n">') !== 0 || hex.indexOf('went off 2 times with a kick ready') < 0) bad('a must-kick that went off twice is not a red ✗ saying so in the Kick list');
  const dr = li('<b class="mpt-ab">Deathly Roar</b></span>') || li('<b class="mpt-ab">Deathly Roar</b> <em'); if (dr.indexOf('mpk-y">') !== 0 || dr.indexOf('never went off') < 0) bad('a must-kick that never went off is not a green ✓ "never went off"');
  const bs = li('<b class="mpt-ab">Bind Soul</b>'); if (bs.indexOf('mpk-q">') !== 0 || bs.indexOf('low danger: kicked 3 of 5') < 0) bad('a low-danger kick is marked as a result (it is grey, with how many were kicked)');
  // the plan's lines
  const sg = li('Spit Gold'); if (sg.indexOf('mpk-n">') !== 0 || sg.indexOf('hit <b class="mpt-nm">Tank</b> and <b class="mpt-nm">Dps</b> (3 hits)') < 0) bad('a plan line no longer names who its spell hit, in red: ' + sg.slice(0, 160));
  const ql = li('Quaking Leap'); if (ql.indexOf('mpk-n">') !== 0 || ql.indexOf('killed <b class="mpt-nm">Heal</b>') < 0) bad('a plan line no longer names who its spell killed, in red');
  const kd = li('Kick <b class="mpt-ab">Deathly Roar</b>'); if (kd.indexOf('mpk-y">') !== 0) bad('the boss\'s "Kick Deathly Roar" line is not green when it never went off');
  for (const t of ['Don\'t let the adds reach the boss.', 'You need every mob for count.', 'Healing Tide Totems']) if (li(t).indexOf('mpk-u">') !== 0) bad('a line the log can\'t judge has a colour (only proof gets one, a grey dot otherwise): ' + t);
  // the cards
  const gs = cards.find((c) => c.indexOf('<h4>The Golden Serpent</h4>') >= 0) || '', kz = cards.find((c) => c.indexOf('<h4>Dazar, the First King</h4>') >= 0) || '', tr = cards.find((c) => c.indexOf('<h4>Trash</h4>') >= 0) || '';
  if (gs.indexOf('<b>3:10</b> fight') < 0 || gs.indexOf('mpk-t mpk-s">0:30 slower than the fast run') < 0 || gs.indexOf(' mpk-c mpk-en"') !== 0) bad('a boss card no longer says its fight against the fast run\'s (amber when a bit slower), or its edge is not its worst colour (red: a line was hit)');
  if (kz.indexOf('<b>3:00</b> fight') < 0 || kz.indexOf('1 wipe') < 0 || kz.indexOf('1 death') < 0) bad('"Dazar, the First King" no longer finds the run\'s "King Dazar", or its card stops saying its wipe and death');
  if (tr.indexOf('mpk-t mpk-n">1 death') < 0) bad('Trash no longer says its deaths');
  // the dispels
  if (li('<b class="mpt-ab">Lingering Fluid</b>').indexOf('mpk-n">') !== 0 || li('<b class="mpt-ab">Lingering Fluid</b>').indexOf('left on too long once') < 0) bad('a debuff left on too long is not red');
  if (li('<b class="mpt-ab">Savage Maul</b>').indexOf('mpk-y">') !== 0) bad('a debuff that landed and was never left on too long is not green');
  if (li('<b class="mpt-ab">Putrid Seekers</b>').indexOf('mpk-u">') !== 0) bad('a debuff that never landed got a mark (nothing to judge)');
  // the count: Deathly Roar (plan line and Kick list), Savage Maul ✓; Hex, Spit Gold, Quaking Leap, Lingering Fluid ✗; Bind Soul low danger, not counted
  if (!J.c || J.c.y !== 2 || J.c.n !== 4 || J.c.s !== 0 || J.intro.indexOf('2 went to plan') < 0 || J.intro.indexOf('4 didn\'t') < 0) bad('the count on top no longer counts each spell once: ' + JSON.stringify(J.c));
  if (J.intro.indexOf('2 deaths</b>') < 0 || J.intro.indexOf('1 wipe</b>') < 0 || J.intro.indexOf('1 slow boss fight</b>') < 0) bad('the line on top no longer counts the deaths, wipes and slow boss fights the cards show: ' + J.intro.replace(/<[^>]+>/g, ' '));
  if (kz.indexOf('mpk-t mpk-y">only 0:05 slower than the fast run') < 0) bad('a boss fight close to the fast run\'s is not a green "only M:SS slower" or "as quick": ' + kz.slice(0, 200));
  // the website wiring: the website uses it, the Companion card and the pop-up keep the plain list; open, second on the Summary; the colours
  if (s.indexOf("const J = !MPC_ON && !R._prep && (R.pulls || []).length ? mpxKnow(R, K, fx && fx.R ? fx.R : null) : null;") < 0 || s.split("mpKnowHtml(R, true, fx))").length !== 4) bad('the website\'s key page stops using the marks, or the Companion card or the pop-up before a key stop keeping the plain list');
  if (s.indexOf("MPC_ON ? 'for your next key' : 'each boss\\'s plan, and how this key went'") < 0) bad('Know this dungeon\'s line under its title no longer says it is about this key too');
  if (/#mptC5:not\(\.mpx-open\)/.test(css) || s.indexOf('mpxKnowOpen(') >= 0) bad('Know this dungeon is folded again (Flex, Nov 16: "I really think this section should be more highlighted")');
  if (s.indexOf("if (cm && c5 && cm.nextElementSibling !== c5) cm.after(c5); if (ca && cc && ca.nextElementSibling !== cc) ca.after(cc);") < 0) bad('Know this dungeon is no longer second on the Summary, under The key');
  const V = 'html:not(.mpcard) body #view#view#view #mptBody#mptBody #mptC5 ';
  for (const [sel, decl, why] of [['.mpk-c.mpk-en', 'border-top-color: var(--bad) !important;', 'a card with a miss lost its red edge'], ['.mpk-c.mpk-ey', 'border-top-color: var(--good) !important;', 'a clean card lost its green edge'], ['li.mpk-y > i.mpk-m', 'color: var(--good) !important;', 'a ✓ is not green'], ['li.mpk-n em.mpk-r', 'color: #ff8f87 !important;', 'what the log says of a miss is not red'], ['li.mpk-y em.mpk-r', 'color: var(--good) !important;', 'what the log says of a done line is not green']]) {
    const i = css.indexOf(V + sel + ' {'); if (i < 0 || css.indexOf(decl, i) < 0 || css.indexOf(decl, i) > css.indexOf('}', i)) bad('Know this dungeon\'s colours: ' + why + ' (Flex, Nov 16: "the page needs some color coding again")'); }
  if (css.indexOf('#mptC5 span.mpt-g { color: var(--muted) !important; }') >= 0) bad('"never went off" is grey again in Know this dungeon');
};
if (require.main === module) { let n = 0; module.exports((a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ Know this dungeon, marked: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
