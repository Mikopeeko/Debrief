// What ended each pull, judged by hand from the raw log (Nov 13). One entry per fight id. make-key.js copies these into the key files.
//   cat   the kind of cause, in the site's own short names (guil, orbs, kick, shield, frontal, reset) so the two can be compared
//   t     the second the pull was lost
//   by    for an orb burst: who carried the purple that burst ([] = nobody's mistake to name: feared, or left on the floor)
//   line  the cause in plain words;  proof: the log events that show it (times are m:ss from the pull's start)
//   notBy a player the cause must not blame, with why (notByWhy)
//   sure  false = the log leaves room for another reading (or: the other cat, byOr: the other carrier); these never fail a build
'use strict';
module.exports = {
  agt6jMTyZBYvVzAP: {
    2: { cat: 'kick', sure: true, notBy: ['Tyralien'], notByWhy: 'dead since 7:38.9 and never brought back, so there was no taunt to miss', t: 534.3, line: 'Wail of Terror was not kicked at 7:34 and feared 15 players in the axe\'s eruption. It killed Tyralien, a tank, so Vandagos took every Blighted Sever alone and died to his fourth at 8:54. The raid fell apart in the next 25 s.',
      also: 'the frontal: Vandagos took four Blighted Severs in a row',
      proof: ['Spiteful Soulcoiler 1 finished Wail of Terror at 7:33.7 (15 feared) as the Grim Guillotine from 7:27.9 erupted; Death\'s Embrace caught 7 players', 'Tyralien died at 7:38.9 to Death\'s Embrace, feared, and was never brought back', 'Blighted Sever hit Vandagos at 7:13.1, 7:46.5, 8:23.1 and 8:54.3 (1.88M, dead)', '6 more died in the 10 s after 8:54.3 (two to the boss\'s melee)', 'Main, Nov 13: the root is the missed kick, with the frontal as what added up'] },
    3: { cat: 'orbs', by: ['Schooty'], kind: 'left at the Deluge', sure: true, t: 87.1, line: 'One purple orb was left after the 1:17 Sever. Schooty picked it up and died carrying it at 1:23, and it was still on the floor when Toxic Deluge came at 1:27. Venom Rupture killed 10 at once.',
      proof: ['the Severs at 1:00.0 and 1:17.0 popped 4 and 3 orbs of the 0:45 Deluge', 'Schooty\'s purple carry ran 1:19.43 to 1:23.42, ending at his death', 'Toxic Deluge cast at 1:27.04; Venom Rupture hit 19 players for up to 911k at 1:27.08, with no Sever before it', '18 dead within 15 s'] },
    4: { cat: 'kick', sure: true, t: 206.3, line: 'Wail of Terror was not kicked at 3:26 and feared 18 players with Gloombombs out. The bombs went off in the raid 1.5 s later.',
      proof: ['Spiteful Soulcoiler 2 finished Wail of Terror at 3:26.3 (18 feared)', 'Gloombomb (cast 3:22.8) went off at 3:27.8 and hit 7 players besides its 4 targets', '11 players had Gravebound; 15 died between 3:29.8 and 3:41.9'] },
    5: { cat: 'guil', sure: true, t: 448.4, line: 'Grim Guillotine on Komo had 1 soaker (5 needed). Grim Execution killed 12.',
      proof: ['Grim Guillotine landed on Komo at 7:23.4; its hit split on 1 player', 'Grim Execution hit 19 players at 7:28.4; 12 died at 7:28.6'] },
    6: { cat: 'frontal', sure: true, t: 218.4, line: 'Soul Sever at 3:38 hit 6 players besides the tank. It killed 4 of them and the tank, Vandagos, who took his second in a row.',
      proof: ['Soul Sever hit Vandagos at 3:07.4 and again at 3:38.4 (4.23M)', 'the 3:38.4 cast also hit Kargaryen, Zaffia, Larryg, Huservoker, Dragooned and Jangokin', 'Jangokin, Dragooned, Larryg, Huservoker and Vandagos died at 3:38.5', 'Eternal Nightfall finished at 3:56.4 with 15 already dead'] },
    7: { cat: 'shield', sure: true, t: 420.4, line: 'Eternal Nightfall finished at 7:00. Its shield broke after 17.2 s, just too late for the 17 s cast. It killed 14.',
      proof: ['Veil of Twilight went up at 6:43.4 and came off 17.2 s later', 'Eternal Nightfall cast finished at 7:00.4; 14 died at 7:00.6', 'Komo, Dragooned, Volkovod and Hobbz had died to Spirit Erasure at 5:52.2'] },
    8: { cat: 'orbs', by: ['Schooty'], sure: true, t: 93.2, line: 'Schooty picked up a purple orb while carrying a green one. It burst 0.2 s later and Venom Rupture killed 15.',
      proof: ['Schooty carried a green from 1:31.1; his purple carry started at 1:33.03 and ended at 1:33.20', 'Venom Rupture first hit at 1:33.20 (up to 1.26M); no Sever in the 3.5 s before', '15 died to Venom Rupture by 1:39.1'] },
    9: { cat: 'guil', sure: true, t: 449.4, line: 'Grim Guillotine on Jangokin had 3 soakers (5 needed). Grim Execution killed 7.',
      proof: ['Grim Guillotine landed on Jangokin at 7:24.4; its hit split on 3 players', 'Grim Execution hit 16 players at 7:29.4; 7 died at 7:29.5', 'Boltzzx, Volkovod, Komo and Dragooned had died between 7:11.7 and 7:24.8'] },
    10: { cat: 'orbs', by: ['Komo'], sure: true, t: 54.8, line: 'Komo carried a purple orb to within 6 yd of a green one on the floor, ten seconds after the Deluge. It burst at 0:54.8 and Venom Rupture killed 14.',
      proof: ['Tyralien\'s 5 s purple carry ran out at 0:54.40; Venom Rupture first hit at 0:54.82', 'Komo carried a purple (0:50.2 to 0:55.2), 8.7 yd from Tyralien and 6.1 yd from a green on the floor', 'no Sever in the 3.5 s before; 14 died to Venom Rupture'] },
    11: { cat: 'orbs', by: ['Tyralien'], sure: true, t: 423.5, line: 'A purple orb burst at 7:03.5. Tyralien carried one 5.3 yd from a green on the floor. Venom Rupture killed 14.',
      proof: ['Venom Rupture first hit at 7:03.51 (up to 986k); no Blighted Sever in the 3.5 s before', 'Tyralien carried a purple from 7:01.9 to 7:06.9, 5.3 yd from a green Hobbz dropped at 6:58.7 (every other burst of these nights happened 5.0 to 5.4 yd from an orb)', 'Boltzzx\'s own 5 s carry ran out at 7:03.62, 0.1 s after the burst, 11.5 yd from the nearest orb'] },
    12: { cat: 'orbs', by: ['Volkovod'], sure: true, t: 476.5, line: 'Volkovod picked up a purple orb next to a green one. It burst 1.3 s later and Venom Rupture killed 13.',
      proof: ['Volkovod\'s purple carry ran 7:55.25 to 7:56.50; he was 0.6 yd from a green on the floor at the burst', 'no Blighted Sever in the 3.5 s before; 13 died to Venom Rupture'] },
    13: { cat: 'orbs', by: ['Schooty'], sure: true, t: 116.8, line: 'Schooty picked up a purple orb while carrying a green one. It burst at once and Venom Rupture killed 14.',
      proof: ['Schooty carried a green from 1:55.3; his purple carry started at 1:56.69', 'Venom Rupture hit for up to 2.5M at 1:56.8; no Sever in the 3.5 s before', '14 died to Venom Rupture'] },
    14: { cat: 'kick', sure: true, t: 437.8, line: 'Wail of Terror was not kicked at 7:18 and feared 19 players as the Grim Guillotine landed. It got 1 soaker (5 needed) and Grim Execution killed 8.',
      proof: ['Spiteful Soulcoiler 1 finished Wail of Terror at 7:17.8 (19 feared, 5 s)', 'Grim Guillotine landed on Shockabunga at 7:22.2; its hit split on 1 player', 'Grim Execution hit 16 players at 7:27.2; 8 died at 7:27.4'] },
    15: { cat: 'guil', sure: true, t: 450.8, line: 'Grim Guillotine on Optt had 4 soakers (5 needed). Grim Execution killed 9. Five seconds later Kargaryen\'s purple orb burst and killed 6 more.',
      proof: ['Grim Guillotine landed on Optt at 7:25.8; its hit split on 4 players', 'Grim Execution hit all 20 at 7:30.8; 9 died at 7:30.9', 'Venom Rupture burst at 7:35.7 with Kargaryen carrying the only purple, 5.3 yd from a green'] },
    16: { cat: 'orbs', by: ['Shockabunga'], sure: true, t: 481.1, line: 'Shockabunga picked up a purple orb 5 yd from a green one. It burst 0.6 s later and Venom Rupture killed 16.',
      proof: ['Shockabunga\'s purple carry started at 8:00.44; Venom Rupture first hit at 8:01.05', 'he was 5.2 yd from a green on the floor; Volkovod and Tyralien carried purples 11.7 and 10.2 yd from any orb', 'Flex, Nov 12: "yep it was shock that i know for sure"'] },
    17: { cat: 'kick', sure: true, t: 299.1, line: 'Wail of Terror was not kicked at 4:59 and feared 16 players. Three ran off the platform in the next 2 s and the raid fell apart.',
      proof: ['Spiteful Soulcoiler 4 finished Wail of Terror at 4:59.1 (16 feared)', 'Kargaryen, Urgdragon and Hobbz died at 5:01.0, feared, with no killing hit, 59 to 76 yd from the room\'s middle (the edge is about 46 yd out)', 'Tyralien, who had kicked every Wail before, died at 4:49.7 to Gravebound (1 of 3 fragments)', '18 died between 4:59.4 and 5:16.2'] },
    18: { cat: 'kick', by: [], feared: ['Flëxørçïst'], sure: true, t: 442.8, line: 'Wail of Terror was not kicked at 7:23 and feared 18 players. Flëxørçïst, feared, ran onto a purple orb and it burst. Venom Rupture killed 17.',
      proof: ['Spiteful Soulcoiler 1 finished Wail of Terror at 7:22.8 (18 feared)', 'Flëxørçïst\'s purple carry ran 7:24.21 to 7:24.76 while feared, 3.8 yd from a purple on the floor', '17 died to Venom Rupture', 'Flex, Nov 12: feared onto the orbs, the missed kick\'s wipe'] },
    19: { cat: 'guil', sure: true, t: 450.8, line: 'Grim Guillotine on Raiyvenz had 2 soakers (5 needed). Grim Execution killed 9.',
      proof: ['Grim Guillotine landed on Raiyvenz at 7:25.9; its hit split on 2 players', 'Grim Execution hit 19 players at 7:30.8; 9 died at 7:31.0'] },
    20: { cat: 'orbs', by: ['Volkovod'], sure: true, t: 372.4, line: 'Volkovod picked up a purple orb 5 yd from a green one, 11 s into phase 3. It burst and Venom Rupture killed 12.',
      proof: ['Volkovod\'s purple carry ran 6:10.45 to 6:12.38; he was 5.1 yd from a green on the floor', 'Venom Rupture first hit at 6:12.38; no Blighted Sever before it', 'Flex, Nov 12: Volkovod'] },
  },
  Gax3AkbyFRXmdrgQ: {
    3: { cat: 'reset', sure: true, t: 10.0, line: 'A 29 s pull with 16 players and the boss still at 100%. Eight died at 0:10 to Unworthy. Not a real attempt.',
      proof: ['16 players in the pull (the other pulls have 20)', 'Zul\'jan at 100% at the end', 'Unworthy hit for up to 13.5M at 0:10.0'] },
    4: { cat: 'kick', by: [], feared: ['Raiyvenz'], sure: true, t: 439.9, line: 'Wail of Terror was not kicked at 7:20 and feared all 20 players. Raiyvenz, feared, ran onto a purple orb and it burst. Venom Rupture killed 17.',
      proof: ['Spiteful Soulcoiler 1 finished Wail of Terror at 7:19.9 (20 feared)', 'Raiyvenz\'s purple carry ran 7:21.29 to 7:22.21 while feared', '17 died to Venom Rupture from 7:22.2'] },
    5: { cat: 'orbs', by: ['Flëxørçïst', 'Komo'], sure: true, t: 478.7, line: 'Komo died carrying a purple orb at 7:57.5 and it dropped where he fell. Flëxørçïst ran into it with a green one a second later, and the purple burst. Venom Rupture killed 14.',
      proof: ['Komo\'s purple carry ended at his death, 7:57.51', 'Flëxørçïst\'s green carry ended at his death, 7:58.61, 5.3 yd from that purple', '14 died to Venom Rupture from 7:58.8; no Blighted Sever in the 3.5 s before', 'Flex, Nov 13: "He died as he was carrying it, and i ran into it right as he died"'] },
    6: { cat: 'orbs', by: ['Huservoker'], sure: true, t: 492.7, line: 'Huservoker picked up a purple orb 5 yd from a green one. It burst 1.8 s later and Venom Rupture killed 11.',
      proof: ['Huservoker\'s purple carry ran 8:10.96 to 8:12.74; he was 5.3 yd from a green on the floor', '11 died to Venom Rupture; no Blighted Sever in the 3.5 s before'] },
    7: { cat: 'orbs', by: [], kind: 'left at the Deluge', sure: true, t: 504.4, line: 'Two of the four purple orbs from the 7:43 Deluge were never picked up, and a purple was still on the floor when the next Toxic Deluge came at 8:24. Venom Rupture killed 13 with the boss at 4.6%.',
      proof: ['the 7:43 Deluge made 4 purple orbs; only two were carried (Boltzzx from 7:58.6, and Komo from 7:58.5, whose orb Shockabunga took on when Komo died at 8:01.1)', 'Tyralien, a tank who carries purples, had died to Gravebound at 7:52.6', 'the Blighted Sever at 8:16.3 popped 3 orbs', 'Toxic Deluge cast at 8:24.36 and Venom Rupture hit 17 players for up to 1.05M in the same second, with no Blighted Sever before it'] },
    8: { cat: 'orbs', by: ['Boltzzx'], sure: true, t: 418.4, line: 'Boltzzx carried a purple orb to within 5 yd of a green one left on the floor. It burst and Venom Rupture killed 11.',
      proof: ['Boltzzx\'s purple carry ran 6:54.83 to 6:59.83; Venom Rupture first hit at 6:58.36', 'he was 5.4 yd from a green on the floor since 6:07.9, and the only purple carrier', '11 died to Venom Rupture; no Blighted Sever in the 3.5 s before'] },
    9: null,
    // ---- Ula'tek Mythic, the same night (fights 11 to 23 = pulls 1 to 13, all wipes in phase 1). A boss without category names: the cause is
    //      compared by the mechanic's name (name, nameOr) and by who it names (names). Source: the Ula'tek chat's proof table (ulatek-accuracy-nov13.md, each pull read against the raw log and 20 top kills); the deaths and killing hits were re-read for the key
    11: { name: 'Toxic Incubation', names: ['Volkovod', 'Shockabunga'], sure: true, t: 19.5, line: 'The venom beam was taken by Volkovod and Shockabunga, two damage dealers, instead of a tank. Its waves killed four more at 0:19.',
      proof: ['Volkovod died at 0:17 (Toxic Burn) and Shockabunga at 0:19 (Toxic Incubation)', 'Komo, Urgdragon, Jangokin and Huservoker died to Caustic Waves at 0:19', 'the beam ran 0:15 to 0:19 and hit Volkovod 3 times and Shockabunga twice (the proof table)'] },
    12: { name: 'Caustic Waves', nameOr: ['Fester Burst'], sure: true, t: 44.5, line: 'The tails\' waves caught the raid during the coil soak at 0:40 to 0:44, with 12 players outside the bubble. Seven died in four seconds.',
      proof: ['seven died between 0:40 and 0:44: Urgdragon, Kargaryen and Boltzzx to Caustic Waves, Schooty and Dragooned to Spectral Coils, Volkovod to Fester Burst, Komo to Necrotic Vapors', '12 were outside the bubble at 0:38.6, and 7 soakers a coil is what top kills have (the proof table)'] },
    13: { name: 'Unchecked Rage', sure: true, t: 84.5, line: 'Nobody was in her melee after the dive at 1:24, and Unchecked Rage killed nine at once.',
      proof: ['nine died to Unchecked Rage at 1:24', 'nobody was in her melee at 1:24.8 (the proof table)'] },
    /* (Nov 13, Main's played-on rule: the page called pull 4 at 1:03 on three deaths, then nobody died for 18 s and the raid fought on 45 s. That stretch is read now: the lost moment is
       Komo's death at 1:24, the fifth, a quarter of the raid. The waves that killed the carriers are the first link, so either name is right) */
    14: { name: 'Blightscale Vipers', nameOr: ['Caustic Waves'], sure: true, t: 84.5, line: 'Caustic Waves killed three by 1:03, two of them egg carriers, and two Vipers hatched. The raid fought on, and the Vipers killed Kargaryen at 1:21 and Komo at 1:24.',
      proof: ['Dragooned died to Caustic Waves at 0:43, Volkovod at 1:01 and Urgdragon at 1:03', 'two of the three carried eggs, and 2 Vipers hatched (the proof table)', 'no death from 1:03.9 to 1:21.9', 'a Blightscale Viper\'s melee hit Kargaryen for 670k at 1:21.6, and a Viper\'s Petrifying Sting killed Komo at 1:24.1'] },
    15: { name: 'Rattler Slam', sure: true, t: 98.5, line: 'Nobody was on the new tail at 1:35, and Rattler Slam killed seven.',
      proof: ['Komo died to Rattler Slam at 1:34 and six more at 1:38', 'nobody was on the new tail at 1:34.9 (the proof table)'] },
    16: { name: 'Rattler Slam', names: ['Vandagos'], sure: true, t: 96.5, line: 'Vandagos (tank) died at 1:32, four seconds before the Rattler Slam, and the slam killed five.',
      proof: ['Vandagos died at 1:32 (Stone Venom, with Toxic Burn ticking)', 'five died to Rattler Slam at 1:36'] },
    17: { festerNotReachable: true /* (the second Wretch was held 12 yd from the new tail, so its bubble sat inside Mephitic Thrash, 2 s before the burst) */, name: 'Fester Burst', sure: true, t: 108.5, line: 'Fester Burst at 1:48 hit 15 players outside the Wretch\'s bubble and killed seven. The Wretch was held 12 yd from the tail.',
      proof: ['seven died to Fester Burst at 1:48', 'the burst hit 15, with the Wretch 12 yd from the tail; top kills hold it 46 to 53 yd away (the proof table)', 'Mephitic Thrash hit all 20 once and nobody was in the slam'] },
    18: { name: 'Fester Burst', sure: true, t: 108.5, line: 'Fester Burst at 1:47 hit six players outside the bubble, and Noxious Splash went off on Schooty and Shockabunga.',
      proof: ['Dragooned died to Fester Burst at 1:47, Phartsy to Mephitic Thrash at 1:47, Schooty to Noxious Splash at 1:48', 'Fester Burst hit 6 (the proof table)'] },
    /* (Nov 13, Main's played-on rule: called at 1:00 with four dead, then nobody died for 35 s and the raid fought on 50 s, through the dive. What ended it is the Rattler Slam at 1:35) */
    19: { name: 'Rattler Slam', names: ['Vandagos'], sure: true, t: 95.5, line: 'Nobody was on the new tail at 1:35: Vandagos was 37 yards from it. Rattler Slam hit 16 players and 11 died. Four were already dead from the egg carriers touching at 0:41 and the waves at 1:00.',
      also: 'the eggs: Boltzzx and Schooty touched at 0:41, two Vipers hatched, and four were dead by 1:00',
      proof: ['Schooty died to Noxious Splash at 0:41; Huservoker (Petrifying Sting), Phartsy and Kargaryen (Caustic Waves) died at 0:59 to 1:00', 'no death from 1:00.3 to 1:35.3', 'Rattler Slam at 1:34.9 hit 16 players for 12.7M; Dragooned, Boltzzx and Flëxørçïst died at 1:35.3 and eight more by 1:39', 'Vandagos was 37 yards from the new tail, with the other tank on Ula\'tek (the proof table, round 2)'] },
    20: { festerNotReachable: true /* (the second Wretch was held 16 yd from the new tail, so its bubble sat inside Mephitic Thrash, 2 s before the burst) */, name: 'Fester Burst', sure: true, t: 108.5, line: 'Fester Burst at 1:47.6 hit 15 players outside the bubble. The Wretch was held 16 yd from the tail.',
      proof: ['eight died between 1:46 and 1:49 (Fester Burst, Mephitic Thrash, Noxious Splash, Putrid Membrane and her melee)', 'the burst hit 15, with the Wretch 16 yd from the tail (the proof table)'] },
    21: { festerNotReachable: true /* (the second Wretch was held 24 yd from the new tail, so its bubble sat inside Mephitic Thrash, 2 s before the burst) */, name: 'Caustic Waves', sure: true, t: 64.5, line: 'Her waves at 0:56 and the tails\' at 0:58 killed three by 1:03.',
      proof: ['Jangokin and Volkovod died to Caustic Waves at 1:00, Komo (Necrotic Vapors) at 1:03 and Larryg (Petrifying Sting) at 1:04'] },
    22: { name: 'Noxious Splash', sure: true, t: 43.5 /* (three died at once at 0:43; Dragooned 0:45 and Komo 0:46 died after the pull was lost, as the page's own wipe call reads them. The coils are never their proof) */, line: 'Egg carriers touched at 0:30 and 0:38 and five Vipers hatched. The raid was dead by 1:04.',
      proof: ['eight died between 0:43 and 0:46', 'carriers touched at 0:30 and 0:38: 5 Vipers (the proof table)'] },
    /* (Nov 13, Main's played-on rule: called at 1:49 on three deaths, then nobody died for 16 s and the raid fought on 57 s, into the second coil set. The lost moment is 2:15, when
       three died within half a second; a quarter of the raid was dead after Komo at 2:07) */
    23: { name: 'Blightscale Vipers', nameOr: ['Noxious Splash'], names: ['Dragooned'], sure: true, t: 135.5, line: 'Dragooned\'s egg went off at 1:47 (Noxious Splash), and the Viper it hatched killed Boltzzx. The raid fought on: waves killed Urgdragon at 2:05 and Komo at 2:07, Schooty\'s egg went off at 2:12, and the raid fell apart at 2:15.',
      proof: ['Dragooned died to Noxious Splash at 1:47', 'Boltzzx died to a melee hit at 1:49', 'no death from 1:49.8 to 2:05.9', 'Caustic Waves hit Urgdragon for 485k at 2:04.5 (dead at 2:05.9) and killed Komo at 2:07.6', 'Schooty died to Noxious Splash at 2:12; Larryg, Zaffia and Phartsy died at 2:15'] },
  },
  // ---- deaths set by hand ("<player>@<second>"): only where a ruling can't be read from the pull's own facts ----
  deaths: { Gax3AkbyFRXmdrgQ: {
    // Ula'tek pull 2: a tail's wave heading west crossed the group soaking coil 2. Not ruled yet (the Ula'tek chat has not measured whether top
    // kills take that wave in the soak), so these never fail a build.
    // Ruled Nov 13 (measured on 18 top kills): the tails' wave at 0:43.5 to 0:44.5 is dodged on every kill (0 soakers hit in 36 soaks), so it is
    // a player's own. Urgdragon (0:42.8, not soaking) is a firm You by the rule itself. The three hit as coil 2 slammed stay unsure: on this
    // pull the wave came 0.2 s after the slam, sooner than on any kill, and Main has been asked whether that is the soak's job.
    12: { 'Dragooned@44': { verdict: 'you', proof: '1 Caustic Waves hit as coil 2 slammed (died to Spectral Coils)', proofOf: ['Caustic Waves'], unsure: 'hit by the wave 0.2 s after the coil slammed: Main to say whether that is the soak\'s job' }, 'Kargaryen@44': { unsure: 'hit by the wave 0.2 s after the coil slammed: Main to say whether that is the soak\'s job' }, 'Boltzzx@44': { unsure: 'hit by the wave 0.2 s after the coil slammed: Main to say whether that is the soak\'s job' } },
  } },
};
