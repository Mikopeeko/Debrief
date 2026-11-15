// Mythic+ Rotation judged as a key (Nov 14, Flex: "Yes, build it" on the key Rotation plan). The study behind it: 13 fast timed +20 runs and Flex's own
// +19 Kings' Rest (report dtMfgnRvDwBLPCKZ, fight 2), read row by row. What they showed, and what each check here guards:
//  1. "Big cooldowns: press them as soon as they're back" marked fast +20 players on 31 to 75% of their pulls, and single-target rows fired on packs
//     (a fast +20 Unholy Death Knight read 83, the same as Flex's): a key pull's own rules (keyRows) take them out of the grade.
//  2. A +20 Mistweaver read 67 for "Full mana at the pull"; Restoration Shamans read 67 to 87 for cancelling casts: off for a healer in a key.
//  3. Casters lost about 8 points of casting time on trash against bosses: the trash bar is 8 points lower (abcSt).
//  4. Nothing judged a healer's damage: every press is sorted by its target and the group's health (keyHealSplit), added up over the key (mpkHeal).
//  5. Cooldowns are judged over the whole key (mpkCd): only a wait inside a big pull counts, and never a hold for Lust. Flex's group's 59 s and 87 s
//     waits (Avatar on pull 9, Army of the Dead on King Dazar) both went out with Heroism; a first cut of the rule called them mistakes.
//  6. The website's Rotation tab stayed blank for a key with no dungeon id (mpTopFor without lv).
//  7. A raid pull must never change: every rule is tried on a raid pull too, and the lines that gate them on a key are pinned.
// It fails on the code before this round (705f64fa and older: none of these functions exist) and whenever a rule moves. contradictions.js runs it.
// The independent review of Nov 14 broke each rule in turn on a copy of the code; the cases marked (review) are the ones it found unguarded.
'use strict';
const path = require('path'), fs = require('fs'), vm = require('vm');
module.exports = function keyRotationCheck(H, say) {
  const bad = (m) => say('Mythic+ Rotation', 'key rotation', m), SRC = path.join(__dirname, '..', 'src'), MPS = fs.readFileSync(path.join(SRC, 'mptab.js'), 'utf8'), UIS = H.UI;
  const eq = (got, want, what) => { if (JSON.stringify(got) !== JSON.stringify(want)) bad(what + ': the page gives ' + JSON.stringify(got) + ', the rule says ' + JSON.stringify(want)); };
  // ---- the checks' own key rules (src/ui.js) ----
  let U = null;
  try { U = vm.runInNewContext(['EOP_N', 'KEY_ABC_TRASH', 'KEY_ALL_NA', 'KEY_ROWS', 'KEY_NOHOLD', 'KEY_HEAL_THRU', 'keyHealSplit', 'keyHealRows', 'keyRows', 'keyHealAdd'].map((n) => H.grab(n)).join('\n') + '\n({ keyTrash, abcSt, KEY_ROWS, KEY_NOHOLD, KEY_HEAL_THRU, keyHealSplit, keyRows, keyHealAdd })', {}); }
  catch (e) { bad('the key rules are missing from the page code (' + e.message + ')'); return; }
  const trash = { item: { dungeon: true, diffId: 8, kind: 'pull', boss: 'Pull 3' } }, boss = { item: { dungeon: true, diffId: 8, kind: 'pull', boss: 'King Dazar' } }, raid = { item: { boss: 'Ula\'tek', diffId: 16 } };
  const page = (r, role, spec, rows) => { const o = { per: [{ r, p: null, end: 30 }], P0: { role, specName: spec }, groups: [{ t: 'Rotation', l: rows.map(([k, st]) => ({ k, st, sub: '', how: '' })) }] }; U.keyHealAdd(o); U.keyRows(o); const m = {}; for (const g of o.groups) for (const c of g.l) m[c.k] = c.st; return m; };
  const UH = [['bigcd', 'bad'], ['p:Sudden Doom', 'bad'], ['up:Festering Scythe', 'warn'], ['pr:blight', 'bad'], ['apl', 'bad'], ['cc', 'bad'], ['abc', 'warn'], ['p:Runic Corruption', 'bad'], ['win', 'ok'], ['pre:mark', 'bad']];
  eq(page(trash, 'dps', 'Unholy Death Knight', UH), { bigcd: 'na', 'p:Sudden Doom': 'na', 'up:Festering Scythe': 'na', 'pr:blight': 'warn', apl: 'bad', cc: 'warn', abc: 'warn', 'p:Runic Corruption': 'warn', win: 'ok', 'pre:mark': 'na' }, 'an Unholy Death Knight on a key\'s trash pack');
  eq(page(boss, 'dps', 'Unholy Death Knight', UH), { bigcd: 'na', 'p:Sudden Doom': 'bad', 'up:Festering Scythe': 'na', 'pr:blight': 'warn', apl: 'bad', cc: 'warn', abc: 'warn', 'p:Runic Corruption': 'bad', win: 'ok', 'pre:mark': 'na' }, 'an Unholy Death Knight on a key\'s boss');
  eq(page(raid, 'dps', 'Unholy Death Knight', UH), Object.fromEntries(UH), 'a raid pull (the key rules must never touch it)');
  eq(page(raid, 'healer', 'Restoration Shaman', [['cc', 'bad'], ['pre:mana', 'bad'], ['pi', 'warn']]), { cc: 'bad', 'pre:mana': 'bad', pi: 'warn' }, 'a healer\'s raid pull (the key rules must never touch it)');
  { const m = page(trash, 'healer', 'Restoration Shaman', [['cc', 'bad'], ['pre:mana', 'bad'], ['apl', 'warn'], ['abc', 'ok'], ['pi', 'warn']]); eq([m.cc, m['pre:mana'], m.apl, m.abc, m.pi], ['na', 'na', 'warn', 'ok', 'na'], 'a healer on a key pull (cancelled casts, full mana and Power Infusion are not graded; priority and casting time are)'); }
  eq([page(trash, 'dps', 'Assassination Rogue', [['apl', 'bad']]).apl, page(boss, 'dps', 'Assassination Rogue', [['apl', 'bad']]).apl], ['warn', 'bad'], '(review) a priority row listed as amber at most on trash: amber on a pack, as it was on a boss');
  // (0.68 against a 75% bar: fine on a key's trash only when the allowance is the full 8 points)
  eq([U.abcSt(0.68, 0.75, 0.6, [{ r: trash }]), U.abcSt(0.68, 0.75, 0.6, [{ r: boss }]), U.abcSt(0.68, 0.75, 0.6, [{ r: raid }]), U.abcSt(0.5, 0.75, 0.6, [{ r: trash }]), U.abcSt(0.68, 0.75, 0.6, [{ r: trash }, { r: trash }])], ['ok', 'warn', 'warn', 'bad', 'warn'], 'casting time at 68% against a 75% bar (8 points lower on one key trash pull only)');
  if (!(U.KEY_NOHOLD['Outlaw Rogue'] || []).includes('Between the Eyes')) bad('Outlaw\'s Between the Eyes is held like a big cooldown on a key\'s trash again');
  if (!U.KEY_HEAL_THRU.includes('Discipline Priest') || !U.KEY_HEAL_THRU.includes('Mistweaver Monk')) bad('(review) Discipline or Mistweaver no longer counts as healing by dealing damage');
  // (a healer's presses: by target and by the group's health; one press a 0.7 s; swings, utility and casts the player didn't press never count)
  { const E1 = 'Creature-0-1-1-1-1-0000000001', A2 = 'Player-1-0000000B', A3 = 'Player-1-0000000C', mk = (l) => new Map(l.map((n) => [n, { name: n, total: 1 }]));
    const p = { dmgAb: mk(['Judgment', 'Holy Shock', 'Shield of the Righteous', 'Melee', 'Divine Toll']), healAb: mk(['Holy Shock', 'Flash of Light', 'Word of Glory', 'Divine Toll', 'Tranquility']), fakeT: new Map([['holy shock', [16]], ['tranquility', [18]]]),
      castTg: [[1, 'Judgment', E1], [2, 'Holy Shock', A2], [2.3, 'Holy Shock', E1], [5, 'Shield of the Righteous', 0], [6, 'Blessing of Freedom', A2], [7, 'Melee', E1], [8, 'Divine Toll', 0], [11, 'Flash of Light', A2], [11.9, 'Judgment', E1], [16, 'Holy Shock', E1], [18, 'Tranquility', 0], [20, 'Word of Glory', A2], [24.5, 'Judgment', E1], [40, 'Judgment', E1]] };
    const r = { duration: 30, item: trash.item, php: new Map([[A2, [[0, 1], [10, 0.4], [13, 1], [24, 0.65], [27, 1]]], [A3, [[0, 1], [24, 0.6], [27, 1]]]]) };
    eq(U.keyHealSplit([{ p, r, end: 30 }]), { qD: 2, qH: 2, nD: 2, nH: 1 }, 'a healer\'s presses (2 damage and 2 heals while healthy; 1 heal and 1 damage with someone under 50%, 1 more damage with two players under 70%; a press with no target of a spell that does both, a line marked not pressed and a Tranquility tick are no presses)');
    const mkPage = (spec) => { const o = { per: [{ r, p, end: 30 }], P0: { role: 'healer', specName: spec }, LAYOUT: [['Rotation', [['Casting', ['abc']]]]], groups: [{ t: 'Casting', l: [{ k: 'abc', st: 'ok', sub: '', how: '' }] }] }; U.keyHealAdd(o); U.keyRows(o); return o; };
    const o = mkPage('Holy Paladin'), rows = o.groups.flatMap((g) => g.l).filter((c) => c.k !== 'abc');
    eq(rows.map((c) => [c.k, c.st, c.v]), [['kdmg', 'na', '2/4'], ['kheal', 'na', '1/3']], 'a healer\'s two key rows (shown on a pull, never graded there)');
    eq(o.LAYOUT[0][1][0][1], ['abc', 'kdmg', 'kheal'], '(review) a healer\'s key rows are named in the Rotation chapter\'s Casting block before the page is laid out (they sat in a stray "More" chapter)');
    U.keyHealAdd(o); eq(o.LAYOUT[0][1][0][1], ['abc', 'kdmg', 'kheal'], 'the same page drawn again does not list the rows twice');
    eq(mkPage('Mistweaver Monk').groups.flatMap((g) => g.l).map((c) => c.k), ['abc', 'kdmg'], 'a Mistweaver heals by dealing damage: no "heals when someone needs one" row');
    { const o3 = { per: [{ r: { ...r, item: raid.item }, p, end: 30 }], P0: { role: 'healer', specName: 'Holy Paladin' }, groups: [{ t: 'Casting', l: [] }] }; U.keyHealAdd(o3); eq(o3.groups.flatMap((g) => g.l).length, 0, 'a healer\'s raid pull gets no key rows'); } }
  // ---- the key's own checks and the score (src/mptab.js) ----
  let M = null;
  try { M = vm.runInNewContext(['mpAfter', 'MPK_CD_MIN', 'mpkWaitPts', 'MPK_HDMG', 'MPK_THRU', 'MPK_MIN_PRESSES', 'mpkBig', 'mpkCd', 'mpkHeal', 'mpkPart', 'mpkPn', 'mpkWaitSay', 'mpkRow'].map((n) => H.grab(n, MPS)).join('\n') + '\n({ mpkBig, mpkCd, mpkHeal, mpkPart, mpkRow, mpkWaitPts, MPK_WAIT, MPK_HDMG })',
    { mpSpN: (per) => per.sp, mpLc: (s) => String(s || '').toLowerCase(), mpPlain: (s) => String(s || ''), esc: (s) => String(s), plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), mpNo: (R, n) => n, GEN_SPECS: { 'Arms Warrior': { cds: [{ n: 'Colossus Smash', cd: 45 }, { n: 'Avatar', cd: 90 }] }, 'Holy Paladin': { cds: [{ n: 'Avenging Wrath', cd: 120 }] } } }); }
  catch (e) { bad('the key\'s own checks are missing from the Mythic+ page code (' + e.message + ')'); return; }
  const key = (cds, lust, deaths) => ({ people: [{ name: 'A', role: 'dps', sp: 'Arms Warrior' }, { name: 'H', role: 'healer', sp: 'Holy Paladin' }, { name: 'S', role: 'healer', sp: 'Restoration Shaman' }, { name: 'D', role: 'healer', sp: 'Restoration Druid' }, { name: 'N', role: 'dps', sp: 'Arms Warrior' }],
    pulls: [{ n: 1, s: 0, e: 100, dur: 100, dmg: { A: 50 } }, { n: 2, boss: 'King Dazar', s: 120, e: 320, dur: 200, dmg: { A: 50 } }, { n: 3, s: 340, e: 400, dur: 60, dmg: { A: 40 } }, { n: 4, s: 410, e: 450, dur: 40, dmg: { A: 30 } }, { n: 5, s: 460, e: 520, dur: 60, dmg: { A: 1 } }, { n: 6, s: 530, e: 555, dur: 25, dmg: { A: 900 } }],
    cds: { A: cds.map((t) => ({ t, spell: 'Avatar', pull: 0 })).concat([{ t: 3, spell: 'Colossus Smash', pull: 0 }]), H: [{ t: 5, spell: 'Avenging Wrath', pull: 0 }] }, lust: lust || [], deathPos: deaths || [], pc: { A: [1, 2, 3, 200, 260] } });
  eq(M.mpkBig(key([5])), [0, 1, 2, 3], 'the big pulls (every boss and the 3 trash pulls of 30 s or more with the most group damage: a 25 s pull is never one, however hard it was hit)');
  { const c = M.mpkCd(key([5, 215, 345]), 'A'); eq([c.rows.map((r) => r.nm), c.st, c.worst && Math.round(c.worst.s), c.worst && c.worst.i, c.part], [['Avatar'], 'bad', 95, 1, 40], 'Avatar ready at the boss\'s start and pressed 95 s in (a 45 s cooldown is never judged)');
    const row = M.mpkRow(key([5, 215, 345]), 'A'); eq([row && row.st, row && row.label, row && row.v], ['bad', 'Cooldowns on the big pulls', 'waited 95 s'], '(review) the key\'s own row for the fixes list'); }
  { const c = M.mpkCd(key([5, 215, 345], [{ t: 214, spell: 'Heroism' }]), 'A'); eq([c.st, c.part, c.lust], ['ok', 100, 1], 'the same wait, pressed with Heroism (a hold for Lust is never a mistake: Flex\'s group on King Dazar and pull 9)'); }
  { const c = M.mpkCd(key([5, 331], [{ t: 330, spell: 'Heroism' }]), 'A'); eq([c.st, c.lust], ['ok', 1], '(review) Avatar held to the end of the boss and pressed with Heroism right after it (a hold for Lust across the end of a pull)'); }
  { const c = M.mpkCd(key([5, 331]), 'A'); eq([c.st, Math.round(c.worst.s), c.worst.to], ['bad', 185, null], 'the same hold with no Lust (ready for the rest of the boss and never pressed)'); }
  { const c = M.mpkCd(key([5, 125, 216, 345]), 'A'); eq([c.st, c.part, c.rows[0].waits.filter((w) => w.i === 1).map((w) => Math.round(w.s))], ['ok', 100, [5, 1]], '(review) ready again 14 s before the boss dies and on the small last pull, not pressed (a pull\'s last 15 s and a small pull never count)'); }
  { const c = M.mpkCd(key([5, 185, 345]), 'A'); eq([c.st, Math.round(c.worst.s), c.part], ['warn', 65, 87], 'a 65 s wait on a boss (amber, and it costs 13 of the 100 points)'); }
  { const c = M.mpkCd(key([5, 215, 345], [], [{ who: 'A', t: 125 }]), 'A'); eq([c.st, Math.round(c.worst.s)], ['ok', 20], 'dead for most of the wait (time dead is never waiting: alive again at 200)'); }
  eq([M.mpkCd(key([5]), 'H').rows.length, M.mpkCd(key([5]), 'H').part], [0, null], '(review) a healer\'s cooldowns (pressed, on the spec\'s list, and still never judged for waiting)');
  { const c = M.mpkCd(key([5]), 'N'); eq([c.rows.length, c.listed, c.part], [0, true, null], 'a spec with a listed big cooldown that was never pressed (said as "none was pressed", never as "none to judge")'); }
  { const R = key([5, 125, 215, 345]); R._rw = { done: true, all: { 1: { H: [{ k: 'kdmg', v: '30/40' }, { k: 'kheal', v: '5/10' }], S: [{ k: 'kdmg', v: '12/40' }], D: [{ k: 'kdmg', v: '10/40' }], N: [{ k: 'kdmg', v: '9/9' }] }, 2: { H: [{ k: 'kdmg', v: '20/40' }, { k: 'abc', v: '80%' }], S: [{ k: 'kdmg', v: '12/40' }], D: [{ k: 'kdmg', v: '10/40' }] } } };
    const h = M.mpkHeal(R, 'H'), s = M.mpkHeal(R, 'S'), d = M.mpkHeal(R, 'D');
    eq([h.qD, h.qT, h.nH, h.nT, h.st, h.part], [50, 80, 5, 10, 'ok', 100], 'a Holy Paladin with 50 of 80 healthy presses on damage (62% is the bar)');
    eq([s.st, s.part], ['warn', 70], 'a Restoration Shaman at 30% (amber under 34%, red under 25%: five fast +20 shamans read 39 to 45%)'); eq([d.st, d.part, Math.round(100 * d.sh)], [null, null, 25], 'a Restoration Druid (one fast player read: shown, never graded)');
    eq([M.mpkPart(R, 'H'), M.mpkPart(R, 'D'), M.mpkPart(R, 'A')], [100, null, 100], 'the key\'s part of the score by role');
    const R2 = key([5]); R2._rw = { done: true, all: { 1: { H: [{ k: 'kdmg', v: '39/39' }] } } }; const R3 = key([5]); R3._rw = { done: true, all: { 1: { H: [{ k: 'kdmg', v: '40/40' }] } } };
    eq([M.mpkHeal(R2, 'H').st, M.mpkHeal(R3, 'H').st], [null, 'ok'], '(review) a healer is graded from 40 healthy presses, never on fewer'); }
  // ---- the page code itself: where the rules are used, and the lines that keep them off a raid pull ----
  const pin = (src, text, what) => { if (!src.includes(text)) bad(what); };
  pin(MPS, "pct = pct0 != null && kp != null ? Math.round(0.7 * pct0 + 0.3 * kp) : pct0", 'the key\'s Rotation score is no longer 70% the pulls and 30% the key\'s own check');
  pin(MPS, "if (!it || !it.id || !it.level || !WCL.mpFast) return { st: 'none', runs: [], lv: [] };", 'mpTopFor can return no lv again: the website\'s Rotation tab throws and stays blank for a key with no dungeon id');
  pin(MPS, "(wide && pi == null ? mpkHealCard(R, name) + mpkStrip(R, name) : '')", '(review) the healer card and the cooldowns on the big pulls are no longer drawn on the website\'s whole-key view only (the Companion\'s card must not get them)');
  pin(MPS, "const tiles = wide && pi == null ? '<div class=\"mpv-tiles mpk-t3\">' + mpkTile(R, name) + ", '(review) the key\'s own tile is no longer the first of three on the website only');
  pin(MPS, "if (kr && kr.st !== 'ok') rows.unshift(", '(review) the key\'s own check no longer leads the fixes when it isn\'t fine');
  pin(MPS, "else if (kr) good.unshift(kr.label);", '(review) the key\'s own check no longer shows in Done right when it is fine');
  pin(UIS, "try { keyHealAdd(o); } catch (e) { console.error(e); }", 'specPage no longer adds a healer\'s key rows before its layout pass');
  pin(UIS, "try { keyRows(o); } catch (e) { console.error(e); }", 'specPage no longer runs a key\'s own rules');
  pin(UIS, "const keyBoss = !!(r.item && r.item.diffId === 8 && r.item.dungeon === true && !mpHold)", '(review) the key-boss rule of the priority row is no longer limited to a key\'s pull: a raid boss would lose its 45 s+ cooldown steps');
  pin(UIS, "firstAt.set(q.s, l.length ? l[0] : Infinity)", '(review) the key-boss rule no longer reads the step\'s first press in the pull');
  pin(UIS, "if (keyBoss && (q.cd || 0) >= 45 && lc(q.s) !== n && tj < firstOf(q)) continue;", 'on a key\'s boss the priority row wants a 45 s+ cooldown from the first second again (it was just pressed on the pack before)');
  pin(UIS, "dmgAll = !!(A.dmgAlways && r.item && r.item.dungeon === true && k.tal(A.dmgAlways))", '(review) a healer read on the damage list all the time is no longer limited to a key and to the talent');
  pin(UIS, "const dpsNow = dmgL.length > 0 && (dmgAll || quiet(castStart(n, t))),", 'a Chi-Ji Mistweaver in a key is read on the raid heal list again');
  pin(UIS, "if (mpHold && (q.cd || 0) >= 45 && !(k.noHold && k.noHold.includes(q.s))) continue;", '(review) Outlaw\'s Between the Eyes and Roll the Bones are skipped on a key\'s trash again');
  pin(UIS, "genAplRun(x, s, D.apl, { noHold: KEY_NOHOLD[spec], hasteF,", '(review) the priority row no longer gets the spec\'s never-held cooldowns');
  pin(UIS, '{"s":"Chain Lightning","alt":["Lava Burst","Flame Shock","Lightning Bolt","Frost Shock","Voltaic Blaze"],"if":{"en":2,"mp":true}', 'a Restoration Shaman\'s Chain Lightning on a pack is a slip again (or Frost Shock and Voltaic Blaze became slips there: the review\'s catch)');
  pin(UIS, "okC = (WIN.castOk || K.abc[0]) - (per.length === 1 && keyTrash(per[0].r) ? KEY_ABC_TRASH : 0)", '(review) casting inside a burst window no longer has the lower bar on a key\'s trash');
  if (UIS.includes("f >= K.abc[0] ? 'ok' : f >= K.abc[1] ? 'warn' : 'bad', D.ic, mel ?") || (UIS.match(/abcSt\(f, /g) || []).length !== 5) bad('(review) one of the five casting-time rows no longer uses the key\'s trash bar (abcSt)');
};
