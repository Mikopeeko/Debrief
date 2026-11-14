// Mythic+ Big hits (Nov 14, Flex: "Yes, start it" on the research's top idea, defensive checks on the big hits; the Design studio's settled look).
// A small made-up key, read by the key reader (companion/mplus.js) and drawn by the page's Big hits chapter (src/mptab.js). It fails on the code before
// Big hits (89d66867 and older: no R.big) and whenever a rule moves: a big hit is a direct enemy hit taking two thirds of a health bar or more from the
// non-tanks; a close call is one that left someone under 15% with no defensive up and no death; "ready" only when the cooldown was over; tanks aren't judged.
// contradictions.js runs it on every build.
'use strict';
const path = require('path'), fs = require('fs');
module.exports = function bigHitsCheck(H, say) {
  const bad = (m) => say('Mythic+ Big hits', 'big hits', m), SRC = path.join(__dirname, '..', 'src');
  const E = require(path.join(SRC, 'engine.js')), build = require(path.join(__dirname, '..', 'companion', 'mplus.js'));
  // ---- the key: a Blood DK tank, a Holy Paladin and an Elemental Shaman; "Purification Strike" hits all three three times ----
  const T = 'Player-1-0000000A', HL = 'Player-1-0000000B', D = 'Player-1-0000000C', M = 'Creature-0-1-1762-1-133935-0000000001';
  const nm = { [T]: '"Tanky-Realm-US"', [HL]: '"Healy-Realm-US"', [D]: '"Shammy-Realm-US"', [M]: '"Purification Construct"' };
  const L = [], at = (t) => { const s = 13 * 3600 + 55 * 60 + 29 + t, h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60; return '11/5/2026 ' + h + ':' + String(m).padStart(2, '0') + ':' + sec.toFixed(3).padStart(6, '0') + '-6  '; };
  const who = (g) => g + ',' + nm[g] + ',' + (g.startsWith('Player') ? '0x512,0x80000000' : '0xa48,0x80000000');
  const adv = (g, cur, max) => g + ',0000000000000000,' + cur + ',' + max + ',0,0,0,0,0,0,0,0,0,0,-1000.00,2600.00,1004,0.0000,90';
  const ci = (g, spec) => L.push(at(0) + 'COMBATANT_INFO,' + g + ',1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,' + spec + ',0,[]');
  const hit = (t, g, id, sp, amt, absorbed, cur, max, periodic) => L.push(at(t) + (periodic ? 'SPELL_PERIODIC_DAMAGE,' : 'SPELL_DAMAGE,') + who(M) + ',' + who(g) + ',' + id + ',"' + sp + '",0x1,' + adv(g, cur, max) + ',' + amt + ',' + amt + ',-1,1,0,0,' + absorbed + ',nil,nil,nil,AOE');
  const dmg = (t, g) => L.push(at(t) + 'SPELL_DAMAGE,' + who(g) + ',' + who(M) + ',1,"Hit",0x1,' + adv(M, 5000000, 9000000) + ',1000,1000,-1,1,0,0,0,nil,nil,nil,ST');
  const aura = (t, g, on, id, sp) => L.push(at(t) + (on ? 'SPELL_AURA_APPLIED,' : 'SPELL_AURA_REMOVED,') + who(g) + ',' + who(g) + ',' + id + ',"' + sp + '",0x2,BUFF');
  L.push(at(0) + 'CHALLENGE_MODE_START,"Kings\' Rest",1762,249,20,[9,10,147]'); ci(T, 250); ci(HL, 65); ci(D, 262);
  for (let t = 15; t <= 165; t += 5) { dmg(t, T); dmg(t + 0.5, D); if (t < 160) dmg(t + 0.7, HL); } /* (everyone fights: the reader learns names from what players do) */
  const max = 1000000, big = (t, g, left) => hit(t, g, 1310755, 'Purification Strike', 800000, 0, left, max);
  big(20, T, 600000); big(20.2, HL, 200000); big(20.3, D, 100000); /* (cast 1: the healer at 20% (amber), the shaman at 10% with no Astral Shift ready yet (key time 20 s, cooldown 120 s)) */
  aura(149, HL, true, 498, 'Divine Protection');
  big(150, T, 600000); big(150.2, HL, 300000); big(150.3, D, 120000); /* (cast 2: the healer behind Divine Protection; the shaman at 12% with Astral Shift ready (never pressed, 150 s in)) */
  aura(158, HL, false, 498, 'Divine Protection');
  big(160, T, 600000); big(160.2, HL, 0); big(160.3, D, 500000); L.push(at(161) + 'UNIT_DIED,0000000000000000,nil,0x80000000,0x80000000,' + who(HL) + ',0'); /* (cast 3: the healer dies: a death, not a close call) */
  hit(30, D, 999, 'Tickle', 200000, 0, 800000, max); hit(31, D, 998, 'Rot', 900000, 0, 100000, max, true); /* (a small hit, and a big damage-over-time tick: neither is a big hit) */
  L.push(at(170) + 'CHALLENGE_MODE_END,1762,1,20,1783326,488.724884,3787.405762');
  const R = build(L.join('\n'), E), B = R && R.big;
  if (!B) { bad('the key reader finds no big hits (R.big) in a key where Purification Strike takes 80% of a health bar three times'); return; }
  const h = B.hits[0];
  if (B.hits.length !== 1 || !h || h.spell !== 'Purification Strike') bad('big hits should be only Purification Strike (not a small hit, not a damage-over-time tick): ' + B.hits.map((x) => x.spell).join(', '));
  if (h && (h.casts.length !== 3 || h.size !== 80)) bad('Purification Strike should be 3 casts at 80% of a health bar: ' + (h && h.casts.length) + ' casts, ' + (h && h.size) + '%');
  if (h && h.casts.some((c) => c.who.some((w) => w.name === 'Tanky'))) bad('the tank is judged on big hits; a tank\'s big hits are their own check');
  const cl = B.close.map((c) => c.name + ' ' + c.left + '% ' + (c.ready[0] || 'none')).join(' | ');
  if (cl !== 'Shammy 10% none | Shammy 12% Astral Shift') bad('the close calls should be "Shammy 10% none | Shammy 12% Astral Shift" (no death, no defensive, Astral Shift ready only once its 120 s were up): "' + cl + '"');
  const P = B.per.Healy || {};
  if (P.n !== 3 || P.d !== 1 || P.died !== 1 || P.low !== 0) bad('the healer should be 3 big hits, a defensive up for 1, 1 death, lowest 0%: ' + JSON.stringify(P));
  if (B.per.Tanky || String(B.tanks) !== 'Tanky') bad('the tank should be listed as not judged, with no By player row: ' + JSON.stringify(B.tanks));
  // ---- the page: the chapter as the studio drew it, the jump bar, Your part and the pull card ----
  const MPT = fs.readFileSync(path.join(SRC, 'mptab.js'), 'utf8');
  if (!MPT.includes("R.big ? ['mptCH', 'Big hits'] : null")) bad('the jump bar lost Big hits');
  if ((MPT.match(/mpBigChap\(R\) \+/g) || []).length < 3) bad('the Big hits chapter is no longer on the key page right after the summary (all three layouts)');
  if (!/row\('!', '#ff8f87', 'Close calls'/.test(MPT)) bad('Your part lost its Close calls row (right after Deaths)');
  if (MPT.indexOf("'Close calls'") < MPT.indexOf("row('☠', '#ff8f87', 'Deaths'")) bad('Your part\'s Close calls row is no longer right after Deaths');
  if (!MPT.includes('died + mpBhCard(RR, i, fold)')) bad('a pull card no longer lists its close calls right after how each player died');
  let html = '';
  try { const names = ['mpMM', 'mpCC', 'mpWho', 'mpT1', 'mpAnd', 'mpChap', 'mpBhWhere', 'mpBhT', 'mpBhIc', 'mpBhRdy', 'mpBigChap', 'mpBigHtml'];
    const ctx = { E, esc: (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'), plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), spellIcon: () => '', mpClock: () => null, mpNo: (r, n) => n, mpByRole: () => 0 };
    const X = require('vm').runInNewContext(names.map((n) => H.grab(n, MPT)).join('\n') + '\n({ ' + names.join(', ') + ' })', ctx); html = X.mpBigChap(R); }
  catch (e) { bad('the Big hits chapter crashed: ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')); return; }
  const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (!/id="mptCH"/.test(html)) bad('the chapter has no id mptCH, so the jump bar and Your part can\'t reach it');
  if (!/2 close calls in this key/.test(txt)) bad('the headline should say "2 close calls in this key": ' + txt.slice(0, 120));
  if (!/Astral Shift was ready/.test(txt) || !/No defensive up/.test(txt)) bad('a close call should say what was ready ("Astral Shift was ready"), or "No defensive up" when nothing was');
  if (!/Next time Have a defensive up for Purification Strike/.test(txt) || !/every close call came from it/.test(txt)) bad('the close calls lost their Next time line');
  if (!/the count is not a grade/.test(txt)) bad('By player lost its line that the count is not a grade');
  if (!/Tanky \(tank\) isn't judged here/.test(txt)) bad('the footnote no longer says the tank isn\'t judged');
  if (/went wrong/i.test(txt)) bad('the chapter says "went wrong" (Flex\'s rule: never)');
  const cells = html.split('<span class="bh-c').slice(1); /* (each grid cell: its class, its hover, then what it shows) */
  if (!cells.some((c) => c.startsWith(' bh-bad"') && c.includes('><b>died</b>'))) bad('a death to a big hit no longer shows as "died" in red in the grid');
  if (!cells.some((c) => c.startsWith(' bh-def"') && c.includes('><b>30%</b><small>Divine Protection</small>'))) bad('a cell with a defensive up no longer names it with a green edge');
};
if (require.main === module) { const H = require('./site-helpers.js'); let n = 0; module.exports(H, (a, b, m) => { n++; console.log('[' + b + '] ' + m); }); console.log('Mythic+ Big hits: ' + (n ? n + ' problem(s)' : 'OK')); process.exit(n ? 1 : 0); }
