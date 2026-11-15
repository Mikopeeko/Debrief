// Ula'tek after phase 1 (Nov 13, Main for Flex: "Yes, start it"): phase 2, the intermission and phase 3, Mythic and Heroic, before Wolfthorn gets there.
// Wolfthorn has only seen phase 1, so these checks read other guilds' pulls: the log library's 240 kills (116 Mythic, 124 Heroic) were compared with the raw log row by row,
// and 34 wipes that ended in phase 2, the intermission or phase 3 were each judged by hand against the raw log (the Ula'tek chat's notes: ulatek-later-phases-nov13.md).
// Each pull below is a small real-log copy (tests/fixtures/ula-later, made by tests/ula-later-make.js) with the one thing it guards; every one fails on the code before Nov 13.
// They run in every build (tests/ulatek-check.js calls this), about a second each.
//   AG. Two Spectral Coil circles that land under a second apart are two circles. (GzjMwgnCWQ7TVbyL fight 18, a top Mythic kill's intermission: the 6th and 7th circles landed
//       0.95 s apart and read as one circle with "13 soakers".)
//   AH. In the intermission three groups take turns: a circle with 5 soakers isn't flagged there (116 top Mythic kills: 5 soakers in 13% of 928 circles; "under 6" flagged 80 kills).
//   AI. A Purge soaker who died earlier in the pull and was rezzed keeps their row and their defensive check. (713cYPKDXfApbkqT fight 24: Fisko's Purge killed him at 8:04, no row.)
//   AJ. A cast bar that ends in a channel, kicked during the channel, was kicked. (djBRFJQa1Xr6tWYD fight 19: Malice kicked 0.9 s after its bar read "got off" and "kicked".)
//   AK. A Viper from a Blightscale Clutch nobody killed says so, and is amber. (1FvZBrQWV3n9jfGT fight 38, a top Heroic kill: "an egg on the ground, nobody picked it up", red.)
//   AL. A death to a Spectral Coil short of soakers is never the player's own. (fFj6mQvpg2cKhkBL fight 21: Chainhealinc, a 4-soaker circle, "You: 3 Spectral Coils hits".)
//   AM. Damage nobody can dodge is never what wiped us. (Y91DhrV7MtTFAKzQ fight 16: six dead one by one, two healers; it read "Rage of the Shackled killed 3 at once".)
//   AN. Mother's Wrath on the raid names the tank and the bites he missed. (ytmBHw1F9T2JvNK7 fight 19: 7 of 9 bites taken, the last two killed 17; "17 died to Mother's Wrath".)
//   AO. Blight Vein deaths name the tether break behind them. (WTf2MYZGzR4PvNkb fight 8, Heroic: three more broke 6 s after the first three; "3 died to Blight Vein".)
//   AP. The wipe is the last unbroken run of deaths. (kwxdG81zgD2yapTN fight 20, Heroic: it read a phase 1 burst the raid survived by 4.5 minutes; two unsoaked coils wiped it.)
//   AQ. A later burst after a 15 s lull that killed twice as many, with under a third of the raid dead, is the cause. (GMjPHq6CckLrAf4W fight 24, Heroic: the stone killed 16.)
//   AR. ...and with more of the raid dead it isn't. (FQHBqjP4TnmC37VN fight 10, Heroic: Volatile Purge killed 6 of 20, 9 dead by 8:04; the stone only finished it.)
//   AS. A tether break that kills is the cause, and the Vipers from the carriers it killed are what followed. (2BXZYz3DyPdq6Lf8 fight 4, Mythic phase 2: five tethers broke together
//       at 3:35, Blight Vein killed 3, two of them carrying eggs; it read "7 Blightscale Vipers were up (6 from carriers who died)".)
//   AT. An Anguished Cry from a Doomscale with Revenge says so. (Frwn49zWfdxHQAJG fight 40, Mythic: the last Doomscale's Cry came out in 1.4 s at double damage and killed 5.)
//   AU. In a raid of 16 or fewer, three deaths within 5 s are a burst. (BPdmX6tfjwrC3DAT fight 43, Heroic, 15 players: Blight Vein killed 3; it read two late Deadly Venom deaths.)
//   AV. Mother's Wrath on the raid after its tank died is the raid's line, never the tank's miss. (Wolfthorn's Nov 12 pull 5, fight 15: Tyralious died at 1:39 after 7 of 9 bites.)
//   AW. A collapse that starts up to 30 s after an early call, with two thirds of the raid alive, is what wiped it. (27yzC6Kv8wXFB3t1 fight 24, Mythic phase 2: the call at 3:29
//       on a tethered death, 18 alive, nobody died for 20 s, then the carriers died under the Rawlings' Acidic Expulsion; it read "Coffeecleave died to Blight Vein at 3:29".)
//   AX. On Mythic the bite soakers' Volatile Purge sends Caustic Waves out: a hit within 4 s of the burst, before Ula'tek's own waves could arrive, is theirs, and never the
//       mistake of whoever it hit. (82mnXac4DT1fNBAK fight 59, phase 3: 6 hit at 7:01, 5 died; they read "Ula'tek's waves" and "You", the wipe "4 died to Caustic Waves".)
//   AY. A Dread Roar wipe names the big egg that hatched. (4GCQd1tvqBPn2JAp fight 13, Mythic phase 2, Nov 9: an egg still out when Hatching Doom's 90 s ran out; "15 died to Dread Roar".)
//   AZ. A stone wipe names the first player who turned to stone, and how. (2mWMajqCxPYbZLt9 fight 47, Mythic phase 3: Raidlogger died to Fester Burst as the bite landed; it read
//       "Serpent's Bite on Alexdr and Saadxp wasn't cleared", the two his stone killed half a second into their own bites.)
//   BA. Phase 3 starts when her Call of the Serpent lands, as Warcraft Logs has it. (4Qq6JkafyTVC7vdg fight 11, a wipe 6:17 long: "reached phase 3"; Warcraft Logs: the intermission.)
//       And the drop as the platform shatters is a killing hit: three died to Falling (380k) at 6:09 on that pull, and read "No killing hit".
//   BB. A wave that lands on a player stunned by Anguished Cry, or within 1.5 s of the stun ending, isn't theirs. (Bvryf2VWpGJ6PAk3 fight 28, Mythic phase 2, Nov 4: the Cry at
//       4:47 stunned 9 for 6 s; her waves hit Theduv and Rjæ 0.4 and 0.6 s after it ended and killed them. Both read "You: 2 Caustic Waves hits right before you died".)
//   Avoidable damage on Wolfthorn's own night (Nov 13, Main: the Report card chat's "count hits up to the wipe call" brought 14 new lines on Nov 12; 6 of them weren't right):
//   BD. Mephitic Thrash's first hit lands on every living player; only the slam's second hit is avoidable, also when few are alive. (Gax3AkbyFRXmdrgQ fight 14, pull 4: at 1:45
//       three players were alive, nobody in the slam; Huservoker read "hit by Mephitic Thrash once and died to it". Raid-wide was half of 20, not half of those alive.)
//   BE. Two egg carriers touching is one mistake for each, not two. (Fight 19, pull 9, 0:41: Schooty and Boltzzx each had "Viper hatched … (Noxious Splash, within 3 yards
//       of …)" and "Hit by Noxious Splash", both High. The same at 1:45 on that pull for the Thrash with 3 alive: Raiyvenz.)
//   BF. …also when the carrier died to the splash a few seconds later. (Fight 23, pull 13: Volkovod touched Schooty at 2:12.5, his row is at 2:14, he died to it at 2:17.
//       With the lines counted up to that death, the line timed at the death sat 3.2 s from the row and counted again.)
//   BC. A wipe to her enrage says so. (VMjPrYtNaRwHhWJ7 fight 42, Mythic, a 3% wipe, Nov 1: Fury Unleashed at 10:08 with 13 dead; it read "… died to Fury Unleashed at once".)
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const DIR = path.join(__dirname, 'fixtures', 'ula-later');
const T = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'), nm = (p) => String(p || '').split('-')[0];
const txt = (c) => (c == null ? '' : typeof c === 'string' ? c : c.txt != null ? String(c.txt) : c.p ? nm(c.p) : '');
const rowsOf = (s) => (s ? (s.rows || []).concat(...(s.groups || []).map((g) => g.rows || [])) : []);
const rootIs = (R, name, re) => (!R.root ? ['no root cause'] : R.root.name !== name ? ['the root cause is "' + R.root.name + '" ("' + R.root.short + '"), not ' + name] : re && !re.test(R.root.short) ? ['the root cause reads "' + R.root.short + '"'] : []);
const PULLS = [
  { key: 'GzjMwgnCWQ7TVbyL:18', name: 'AG, AH: a top Mythic kill\'s intermission circles', win: [[318, 362]], test: (R) => { const g = (R.sec('coils') || { groups: [] }).groups.find((x) => /Intermission/.test(x.title || '')), rows = g ? g.rows.filter((r) => /^Circle/.test(txt(r[0]))) : [], n = rows.map((r) => +txt(r[2]));
    return (n.join('/') !== '8/7/5/7/7/6/7/7' ? ['the intermission\'s circles read ' + n.join('/') + ' soakers; the log has 8/7/5/7/7/6/7/7 (check AG)'] : []).concat(rows.some((r) => +txt(r[2]) === 5 && r[2].warn) ? ['a 5-soaker circle is flagged in the intermission (check AH)'] : []); } },
  { key: '713cYPKDXfApbkqT:24', name: 'AI: a rezzed Purge soaker', win: [[455, 492]], test: (R) => (R.mistakes.some((m) => m.p === 'Fisko' && m.mech === 'Volatile Purge' && /Took the Volatile Purge at 8:04 with no defensive/.test(m.detail)) && rowsOf(R.sec('bite')).some((r) => r[1] && nm(r[1].p) === 'Fisko' && /^Volatile Purge/.test(txt(r[2]))) ? [] : ['Fisko, rezzed after dying at 2:34, has no row for the Purge that killed him at 8:04 (check AI)']) },
  { key: 'djBRFJQa1Xr6tWYD:19', name: 'AJ: Malice kicked in its channel', win: [[170, 200]], test: (R) => { const rows = rowsOf(R.sec('kicks')).filter((r) => txt(r[1]) === 'Malice'); return rows.some((r) => /got off/.test(txt(r[3]))) || rows.filter((r) => /kicked/.test(txt(r[3]))).length !== 2 ? ['Malice reads ' + rows.map((r) => txt(r[3])).join(', ') + '; both Wardens\' casts were kicked, the first 0.9 s into its channel with nobody hit (check AJ)'] : []; } },
  { key: '1FvZBrQWV3n9jfGT:38', name: 'AK: Heroic phase 3, Vipers from Clutches', win: [[352, 432]], test: (R) => { const v = R.mistakes.filter((m) => m.mech === 'Viper hatched' && m.t > 360);
    return (v.length !== 2 || !v.every((m) => /from a Blightscale Clutch that wasn't killed within 20 seconds/.test(m.detail) && m.sev === 'Medium') ? ['the phase 3 Vipers read: ' + v.map((m) => '[' + m.sev + '] ' + m.detail).join(' / ') + ' (check AK)'] : []).concat((R.sec('eggs') || {}).verdict === 'bad' ? ['the Eggs card is red for two Clutch Vipers nobody died to (check AK)'] : []); } },
  { key: 'fFj6mQvpg2cKhkBL:21', name: 'AL: a death to a thin circle', tail: 170, test: (R) => { const d = R.deaths.find((x) => x.p === 'Chainhealinc' && Math.abs(x.t - 354.3) < 2);
    return (!d || d.bucket !== 'none' || !/short of soakers/.test(d.say) ? ['Chainhealinc\'s death at 5:54 to a 4-soaker circle reads "' + (d && d.say) + '" (check AL)'] : []).concat(rootIs(R, 'Unchecked Rage', /^Baldk \(a tank\) died at 6:09/)); } },
  { key: 'Y91DhrV7MtTFAKzQ:16', name: 'AM: bled out, then the heart burn', tail: 170, test: (R) => rootIs(R, 'Too many individual mistakes', /^4 died one by one from 4:26 .*, and 5 more died to raid-wide damage nobody can dodge \(Necrotic Vapors and Rage of the Shackled\), with 2 healers dead\.$/).concat(R.root && !R.root.next ? ['no Next time (check AM)'] : []) },
  { key: 'ytmBHw1F9T2JvNK7:19', name: 'AN: Mother\'s Wrath on the raid', tail: 170, test: (R) => rootIs(R, "Mother's Wrath", /^Grümpydk missed 2 of Mother's Wrath's 9 bites at 6:29, and it killed 17 players\.$/).concat((R.root && (R.root.by || []).join() !== 'Grümpydk') ? ['it isn\'t put on Grümpydk (check AN)'] : [], rowsOf(R.sec('tank')).some((r) => r[4] && r[4].bad && /hit 20 players/.test(txt(r[4]))) ? [] : ['the Tanks card doesn\'t show the Mother\'s Wrath that hit 20 (check AN)']) },
  { key: 'WTf2MYZGzR4PvNkb:8', name: 'AO: Blight Vein and its break', tail: 170, test: (R) => rootIs(R, 'Blight Vein', /^Blight Vein killed 3 at 3:25: 3 tethers broke at 3:21, 2\.3 s apart, 6 s after the break before \(up to 3 stacks on the whole raid/) },
  { key: 'kwxdG81zgD2yapTN:20', name: 'AP: the last run of deaths', tail: 170, test: (R) => rootIs(R, 'Spectral Coils', /^Nobody soaked the Spectral Coil at 5:26\.$/) },
  { key: 'GMjPHq6CckLrAf4W:24', name: 'AQ: the bigger burst after a lull', tail: 170, test: (R) => rootIs(R, "Serpent's Bite", /^With 7 already dead, Serpent's Bite on Flëxørçïst wasn't cleared: they turned to stone \(Calcified Corpse\), and 18 died\.$/) },
  { key: '2BXZYz3DyPdq6Lf8:4', name: 'AS: the tether break, then its Vipers', tail: 170, test: (R) => rootIs(R, 'Blight Vein', /^Blight Vein killed 3 at 3:37 \(2 carrying eggs, which hatched\): 5 tethers broke at 3:35, 8 s after the break before \(up to 5 stacks on the whole raid/) },
  { key: 'Frwn49zWfdxHQAJG:40', name: 'AT: the Revenge Cry', tail: 170, test: (R) => rootIs(R, 'Anguished Cry', /^Nobody interrupted the Anguished Cry of a Weakened Doomscale with Revenge at 5:16 \(the other Doomscales died first, so it cast twice as fast and hit twice as hard\), and it killed 5\.$/) },
  { key: 'BPdmX6tfjwrC3DAT:43', name: 'AU: three deaths in a raid of 15', tail: 170, test: (R) => rootIs(R, 'Blight Vein', /^Blight Vein killed 3 at 3:30/) },
  { key: 'Gax3AkbyFRXmdrgQ:15', name: 'AV: Wolfthorn pull 5, the tank died in Mother\'s Wrath', test: (R) => { const m = R.mistakes.filter((x) => x.mech === "Mother's Wrath" && x.t > 95);
    return (m.length === 1 && m[0].p === 'Raid' && /^Tyralious died at 1:39 after 7 of Mother's Wrath's 9 bites, and the rest landed on the whole raid: 10 players hit for/.test(m[0].detail) ? [] : ['Mother\'s Wrath at 1:39 reads: ' + (m.map((x) => x.p + ': ' + x.detail).join(' / ') || 'nothing') + ' (check AV)']).concat(rootIs(R, 'Rattler Slam', /^Vandagos was 17 yards from the tail/)); } },
  { key: '27yzC6Kv8wXFB3t1:24', name: 'AW: the collapse 25 s after an early call', tail: 170, test: (R) => rootIs(R, 'Acidic Expulsion', /^Blightscale Rawlings weren't killed within 25 seconds: their Acidic Expulsion killed 6\./) },
  { key: '82mnXac4DT1fNBAK:59', name: 'AX: the bite soakers\' waves', tail: 170, test: (R) => { const d = R.deaths.find((x) => x.p === 'Meowkick' && Math.abs(x.t - 427) < 2), w = rowsOf(R.sec('waves')).filter((r) => r[0] && r[0].t > 420.5 && r[0].t < 424.8);
    return rootIs(R, 'Volatile Purge', /^The Serpent's Bite soakers \(Jeopardized, Lubelia, Kungmilkies and Unbanvkapls\) sent their Volatile Purge's Caustic Waves through the raid at 7:00: 6 players hit, and 5 died\.$/)
      .concat(!d || d.bucket !== 'none' || !/soakers' Volatile Purge waves/.test(d.say) ? ['Meowkick\'s death at 7:07 to the soakers\' waves reads "' + (d && d.say) + '" (check AX)'] : [], w.length < 6 || w.some((r) => !/bite soakers' waves/.test(txt(r[2]))) ? ['the waves at 7:01 to 7:03 read: ' + [...new Set(w.map((r) => txt(r[2])))].join(' / ') + ' (check AX)'] : []); } },
  { key: '4GCQd1tvqBPn2JAp:13', name: 'AY: the big egg that hatched', tail: 170, test: (R) => rootIs(R, 'Ravenous Doomscale', /^A Doomscale Egg hatched into a Ravenous Doomscale at 4:24: it was still out when Hatching Doom's 90 seconds ran out, and its Dread Roar killed 15\.$/) },
  { key: '2mWMajqCxPYbZLt9:47', name: 'AZ: the first stone', tail: 170, test: (R) => rootIs(R, "Serpent's Bite", /^With 6 already dead, Raidlogger died at 7:45 as Serpent's Bite landed on them \(to Fester Burst\) and turned to stone \(Calcified Corpse\), and 13 died\.$/)
    .concat(R.mistakes.some((m) => /^(Alexdr|Saadxp)$/.test(m.p) && m.mech === "Serpent's Bite" && m.sev === 'High') ? ['Alexdr or Saadxp, killed by Raidlogger\'s stone, still carry the bite as their own mistake (check AZ)'] : []) },
  { key: '4Qq6JkafyTVC7vdg:11', name: 'BA: a wipe that ended in the intermission', tail: 170, test: (R) => (R.phases.some((p) => /^P3 /.test(p)) ? ['the pull reads as having reached phase 3 (' + R.phases.join(', ') + '); Warcraft Logs ends it in the intermission (check BA)'] : []).concat(rootIs(R, 'Spectral Coils', /^Spectral Coils killed 5: the circles had 4 soakers at 5:53 and 2 at 5:55\./))
    .concat(['Goudacris', 'Muffinate', 'Jackpls'].filter((p) => !R.deaths.some((d) => d.p === p && Math.abs(d.t - 369.5) < 1.5 && /died to Falling/.test(d.say) && !/no killing hit/i.test(d.say))).map((p) => p + '\'s death at 6:09, to the fall as the platform shattered (Falling, 380k), doesn\'t read "died to Falling" (check BA)')) },
  { key: 'Bvryf2VWpGJ6PAk3:28', name: 'BB: a wave right after the stun', tail: 170, test: (R) => rootIs(R, 'Anguished Cry', /^Nobody interrupted the Weakened Doomscale's Anguished Cry at 4:55: it stunned the raid, and 4 died while stunned/)
    .concat(['Theduv', 'Rjæ'].filter((p) => !R.deaths.some((d) => d.p === p && Math.abs(d.t - 294.8) < 1.5 && /^Not counted: stunned by Anguished Cry/.test(d.say))).map((p) => p + '\'s death at 4:54, to a wave that hit half a second after a 6-second stun ended, isn\'t "Not counted: stunned by Anguished Cry" (check BB)')) },
  { key: 'VMjPrYtNaRwHhWJ7:42', name: 'BC: her enrage', tail: 170, test: (R) => rootIs(R, 'Fury Unleashed', /^Ula'tek reached her enrage at 10:08 with 3% health left \(Fury Unleashed\): 13 players were dead by then, 9 of them in the last 30 seconds\.$/) },
  { key: 'Gax3AkbyFRXmdrgQ:14', name: 'BD: Wolfthorn pull 4, Mephitic Thrash with 3 alive', test: (R) => { const g = ((R.sec('avoid') || {}).groups || []).find((x) => x.label === 'Mephitic Thrash'), jd = (g && g.judge) || [];
    const late = jd.filter((j) => j.ts.some((t) => t > 100)).map((j) => nm(j.p)), slam = jd.some((j) => nm(j.p) === 'Dashtoswirly' && j.ts.some((t) => t > 45 && t < 52));
    return (late.length ? ['Mephitic Thrash at 1:45, with 3 players alive and nobody in the slam, is still an avoidable hit for ' + late.join(', ') + ' (check BD)'] : []).concat(slam ? [] : ['Dashtoswirly\'s slam hit at 0:48 is gone from Avoidable damage (check BD)']); } },
  { key: 'Gax3AkbyFRXmdrgQ:19', name: 'BE: Wolfthorn pull 9, an egg touch is one mistake', test: (R) => { const gs = (R.sec('avoid') || {}).groups || [], sp = gs.find((x) => x.label === 'Noxious Splash'), th = gs.find((x) => x.label === 'Mephitic Thrash');
    return ['Schooty', 'Boltzzx'].flatMap((p) => { const m = R.mistakes.filter((x) => x.p === p && x.sev === 'High' && x.t >= 39 && x.t <= 44); return m.length === 1 && m[0].mech === 'Viper hatched' ? [] : [p + '\'s egg touch at 0:41 is ' + m.length + ' High mistakes (' + m.map((x) => x.mech).join(', ') + '): one event, one mistake (check BE)']; })
      .concat(sp && ['Schooty', 'Boltzzx'].every((p) => (sp.judge || []).some((j) => nm(j.p) === p)) ? [] : ['the Avoidable damage table no longer lists Schooty and Boltzzx under Noxious Splash (check BE)'])
      .concat(th && (th.judge || []).some((j) => j.ts.some((t) => t > 100)) ? ['Mephitic Thrash at 1:45, with 3 players alive, is still an avoidable hit on pull 9 (check BE)'] : []); } },
  { key: 'Gax3AkbyFRXmdrgQ:23', name: 'BF: Wolfthorn pull 13, a touch the carrier died to later', test: (R) => { const r = R.r, vd = r.deaths.find((d) => nm(d.player) === 'Volkovod' && Math.abs(d.t - 137.2) < 2.5); if (!vd) return ['no death of Volkovod at 2:17 on pull 13 (check BF)'];
    if (typeof R.E.avoidMistakes !== 'function') return ['the engine no longer shares avoidMistakes with the checks (check BF)'];
    /* (the same pull with the lines counted up to his death, as "up to the wipe call" does on a pull that was played on) */
    const r2 = Object.assign({}, r, { deaths: r.deaths.filter((d) => d.t >= vd.t - 0.05), mistakes: r.mistakes.filter((m) => !m.avoidRule) }); R.E.avoidMistakes(r2);
    const mine = r2.mistakes.filter((m) => nm(m.player) === 'Volkovod' && m.severity === 'High' && m.mechanic !== 'Death' && m.t >= 131 && m.t <= vd.t + 1.5);
    return mine.length === 1 && mine[0].mechanic === 'Viper hatched' ? [] : ['Volkovod\'s egg touch at 2:12 is ' + mine.length + ' High mistakes with the lines counted up to his death at 2:17 (' + mine.map((m) => m.mechanic).join(', ') + '): one event, one mistake (check BF)']; } },
  { key: 'FQHBqjP4TnmC37VN:10', name: 'AR: ...not when a third of the raid is already dead', tail: 170, test: (R) => rootIs(R, 'Volatile Purge', /died to Volatile Purge at once\.$/) },
];
function load(file) { return JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')); }
let X = null;
const site = (H) => X || (X = H.site(['raidSizeOf', 'playedOn', 'deathCutN', 'WIPE_LINE', 'wipeLine', 'WIPE_OPEN', 'wipeCharges', 'wipeWeights', 'wipeLim', 'WIPE_MECH', 'wipeMech', 'WIPE_LAST', 'wipeAt', 'cutInfo', 'cutT', 'deathHit', 'deathHitId', 'deathFast', 'DEATH_KIT', 'DEATH_IMM', 'deathShare', 'deathRaidSay', 'DEATH_BUCKET', 'quarterDead', 'deathOwn', 'andList', 'capS', 'DEATH_JOB', 'DEATH_FAR', 'DEATH_KNOCK', 'DEATH_WIN', 'deathProof', 'deathVerdict', 'deathList', 'deathsOf', 'gbDeathOk', 'deathFix'],
  { dbfReset: (it) => !!it && !it.kill && ((it.endPct != null && it.endPct >= 99.95) || (it.duration != null && it.duration < 15)), store: { get: () => null, set: () => {} }, noteForRep: () => null, strictOn: () => {}, oaRowWhy: () => null, deathSecs: (x) => String(x), deathHealerOf: () => null, dbfTip1: (x) => x, whyReason: (x) => x, oaFlip: (x) => x, oaBase: (n) => String(n || '').split('-')[0],
    plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), esc: (x) => String(x), S: {}, RC_NEXT: {} }));
// one pull read as the page reads it: phases, the wipe call, the root cause, every death's verdict, the mistakes and the fight's cards
function read(H, W, fx) {
  const E = H.E, S = site(H), code = fx.key.split(':')[0], fight = +fx.key.split(':')[1], it = H.pullItems(code, fx.report, W).get(fight); it.pull = fx.pull || it.pull;
  const r = E.analyze(it, W.translate(it, fx.events), {}); if (!r.item) r.item = it;
  const ci = it.kill ? null : S.cutInfo(r), c0 = ci && ci.call ? ci.call : ci, cut = c0 && c0.auto ? c0.t : null, rc = it.kill ? null : E.rootCause(r, c0 && c0.auto ? { cut, why: c0.why, at: c0.at, mn: c0.mn, ms: c0.ms } : { cut });
  const mod = r.module || {}, secs = mod.sections || [];
  return { key: fx.key, r, E, kill: it.kill, phases: (mod.phases || []).map((p) => p.name.split(' ')[0] + ' ' + Math.round(p.start)), call: c0 && c0.auto ? [Math.round(c0.t), c0.why] : null,
    root: rc ? { name: rc.name, short: rc.short, line: rc.line, by: rc.by, next: rc.next } : null, sec: (id) => secs.find((s) => s.id === id) || null,
    deaths: r.deaths.map((d) => { let v = {}; try { v = S.deathVerdict(r, d); } catch (e) { v = { bucket: 'ERR', say: e.message }; } return { t: d.t, p: nm(d.player), bucket: v.bucket, say: v.say }; }),
    mistakes: (r.mistakes || []).filter((m) => m.mechanic !== 'Death').map((m) => ({ t: m.t, p: m.player === 'Raid' ? 'Raid' : nm(m.player), sev: m.severity, mech: m.mechanic, detail: String(m.detail || '') })) };
}
const check = (P, R) => { try { return P.test(R) || []; } catch (e) { return ['its check crashed: ' + e.message]; } };
module.exports = function ulaLater(H, say) {
  const W = require(path.join(__dirname, '..', 'src', 'wcl.js')); let n = 0, t0 = Date.now();
  for (const P of PULLS) { const f = path.join(DIR, P.key.replace(':', '_') + '.json.gz'); if (!fs.existsSync(f)) { say('Ula\'tek ' + P.key, 'ulatek', 'its small log copy is missing (tests/fixtures/ula-later; make it with tests/ula-later-make.js)'); continue; }
    let R; try { R = read(H, W, load(f)); } catch (e) { say('Ula\'tek ' + P.key, 'ulatek', 'could not be read: ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')); continue; } n++;
    for (const p of check(P, R)) say('Ula\'tek after phase 1, ' + P.key + ' (' + P.name + ')', 'ulatek', p); }
  console.log('  Ula\'tek after phase 1: ' + n + ' of ' + PULLS.length + ' pulls read in ' + Math.round((Date.now() - t0) / 1000) + ' s');
};
module.exports.PULLS = PULLS; module.exports.load = load; module.exports.read = read; module.exports.check = check;
