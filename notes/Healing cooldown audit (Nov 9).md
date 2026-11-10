# Healing cooldown audit (Nov 9)

Flex: "I think healing cooldown auto assignments needs to be heavily audited and fixed. I see a lot of flaws in how they are placed." and
"its not JUST the top guilds timings, its also efficiency of maximizing usage as well as placing them during the parts of the fights that need them
the most." and "don't forget about lorrgs".

So every placement is judged on three things together:
1. **Uses.** Does each cooldown get every press the fight allows?
2. **Need.** Do the heaviest parts of the fight get the cover, before the lighter ones?
3. **Top raids.** Where do the best raids really press it? This is the check on 1 and 2, not the rule.

## How it was measured

- **The site's own planner** (`ndzCdPlan` in src/ui.js, the one behind "Plan them for me"), run on all ten bosses, Mythic and Heroic, for two rosters:
  Wolfthorn's, and the comp of the fastest saved kill of each boss. 40 plans, 1,046 presses, 348 big hits.
- **160 top Mythic kills** from the log library (16 a boss, all since Oct 6): every raid cooldown press, the raid's damage each second, the mechanic
  behind each second, and each kill's phases.
- **lorrgs, pulled fresh today**: top 50 players per spec, 19 specs, every boss, Mythic and Heroic (380 files, about 950 logs a boss).
- Scripts: shared notes folder `rotation-audit-nov9/hcd/` (`plan.js`, `agg.js`, `show.js`, `top.js`, `topsum.js`, `hits.js`, `who.js`, `lruse.js`,
  `cmptop.js`).

## The short version

| | Mythic (20 plans) | Heroic (20 plans) |
|---|---|---|
| Big hits the planner knows | 222 | 126 |
| Marked ✕, nothing on it | 5 | 10 |
| Marked short with only a healer's own cooldown on it | 19 | 1 |
| Not covered or short while a raid cooldown was free | 4 | 3 |
| Lighter-half hits with 3 or more raid cooldowns | 4 | 12 |
| Uses of what the fight allows | 72% | 75% |
| One player, two cooldowns within 5 s | 26 | 16 |
| Presses with no big hit near | 62 | 36 |
| Pressed before it was back | 0 | 0 |

## Part 1: What is wrong on every boss

### S1. The planner knows about half of the big hits (the root of most of the rest)
The hit list (`NDZ_CDSTART.pk`) was made from the 3 fastest kills of each boss. Hits that come back at the same time in most of 16 top kills:

| Boss | Hits the planner knows | Hits that recur in top kills | Not in the planner |
|---|---|---|---|
| The Coiled Altar | 19 | 43 | 17 |
| Ula'tek | 18 | 41 | 17 |
| The Twin Fangs | 12 | 25 | 13 |
| Sszorak | 10 | 24 | 11 |
| The Lost Explorers | 9 | 20 | 10 |
| Kith'ix | 10 | 20 | 10 |
| Entombed Sentinels | 10 | 17 | 7 |
| Nymrissa Wavecaller | 8 | 15 | 6 |
| Nek'zali the Soulcoiler | 8 | 14 | 5 |
| Vashnik the Malignant | 9 | 13 | 4 |

What it causes: cooldowns pile onto the few hits it knows, spare presses have nowhere to go (S5), whole mechanics get nothing (boss lists below), and
62 Mythic presses sit "near no big hit" because the hit they are for isn't on the list.
Each hit added will be checked against the boss guide first (raid-wide and unavoidable, not a soak or a slip).

### S2. The plan ends when the fastest kill ends
The timeline is as long as the fastest kills. Nymrissa's plan stops at 4:10; the 16 newer top kills run 4:32 to 5:10 with Abyssal Rain at 4:24, Frost
Burst at 4:37 and Abyssal Rain at 5:08 in 82 to 100% of them. Twin Fangs' plan stops at 5:32; Wolfthorn's kill took 6:44, so the last 72 seconds had
nothing planned. Coiled Altar's stops at 8:14; Wolfthorn's longest pull ran 8:44. The end of a long pull is where a raid is weakest.

### S3. "Needs 2" is decided by rank, not by size
The top third of hits need 2 raid cooldowns and the rest 1, whatever they hit for. Nymrissa Mythic: Abyssal Rain at 0:46 hits for 2,610K and "needs 1";
Frost Burst at 1:42 hits for 2,650K and "needs 2". Coiled Altar Heroic: Spirit Erasure hits twice as hard as anything else (3,122K against 1,833K) and
needs the same 2 as the next one down. The planner and the coverage strip share this rule, so the marks repeat it.
**Fixed in the first push:** a hit only counts as lighter when it is more than 5% lighter, so hits of the same size share a class (one rule for the
planner, the strip, the Big hits table and the Defensives calls). Nymrissa's five 2.6M to 3.1M hits all need 2 now.

### S2b. A longer phase stretches the hits instead of adding more (found while fixing)
When your phase runs longer than the fastest kills', the chart multiplies every hit's time by the difference (Nov 6). Boss abilities run on fixed
timers: a phase 20% longer has more casts, at the same times as before, not the same casts 20% later. A hit at 2:00 is drawn at 2:24.

### S4. Tranquility is counted as a healer's burst, not a raid cooldown
The strip counts "raid cooldowns" toward a hit's need. Apotheosis, Avenging Wrath, Yu'lon, Celestial Conduit, Evangelism, Convoke and **Tranquility**
don't count: a hit with only one of those reads "1 short" in amber (19 Mythic hits). That is fair for a healer's own burst. It is not for Tranquility:
every top Restoration Druid presses it, at 90% of possible, and it measures 3.6M a press, the same as Rewind. It is a raid cooldown.
(Corrected Nov 9: the first version of this list said those 19 hits read ✕. They read "short"; 5 Mythic hits read ✕.)
**Fixed in the first push:** Tranquility is planned and counted as a raid cooldown.

### S5. Uses are left on the table
Mythic plans use 72% of the presses the fight allows (Heroic 75%). The "nothing unused" step stops at one more than a hit's need, and with half the
hits missing (S1) that cap is reached fast. Against lorrgs' top players, per cooldown (our plans / top players, Mythic):

| Cooldown | Our plans | Top players (lorrgs) |
|---|---|---|
| Ascendance | 62% | 86% |
| Restoral or Revival | 62% | 80% |
| Divine Hymn | 63% | 71% |
| Rewind | 68% | 74% |
| Aura Mastery | 68% | 79% |
| Spirit Link Totem | 77% | 70% |
| Avenging Wrath | 80% | 90% |
| Tranquility | 80% | 90% |
| Apotheosis | 81% | 91% |
| Rallying Cry | 67% | 54% |
| Darkness | 67% | 42 to 49% |
| Anti-Magic Zone | 73% | 45 to 52% |
| Zephyr | 63% | 37 to 47% |

Healers' own cooldowns are planned less often than top healers press them. Your rule is every press the fight allows; the top players set the floor.

### S6. The heaviest hit can stay bare while a lighter one gets extras
Nek'zali Mythic: Grasping Depths at P2 1:38 is the heaviest hit of the fight (3,590K) and gets nothing, with Rallying Cry, Rewind and Divine Hymn
free; the one 26 seconds earlier (2,332K) gets 3. Coiled Altar Heroic: Venom Rupture at P1 1:22 gets nothing; the one at P2 0:02, the second
lightest hit of the fight, gets 4. Kith'ix Mythic: Digestive Juices at P2 0:24 is the heaviest (4,632K) and gets 2; the first one (4,362K) gets 3.

### S7. Stacks follow where top raids stack, even when the hit doesn't call for it
Nymrissa Mythic at 0:46: six buttons (Apotheosis, Avenging Wrath, Anti-Magic Zone, two Zephyrs, Rallying Cry) on a hit the same size as the Frost
Burst at 2:42, which gets one Zephyr. Coiled Altar Mythic: Spirit Erasure gets 5 raid cooldowns for Wolfthorn and 7 for the top roster; top kills
put 1.8 on it. Top kills across the tier put 0.3 to 1.5 raid cooldowns on a heavy moment, and half of heavy moments get none.

### S8. One player is given two cooldowns at once
26 times on Mythic, 16 on Heroic: Restoral with Yu'lon, Divine Hymn with Apotheosis on a hit that someone else could cover.

### S9. Cooldowns a raider may not have
Darkness, Anti-Magic Zone and Zephyr are given to every Demon Hunter, Death Knight and Evoker. lorrgs' top players who press them at all, Mythic:
Darkness 35 to 59%, Anti-Magic Zone 44 to 54%, Zephyr 43 to 57%, Rallying Cry 68 to 81%. Heroic: Darkness 17%, Anti-Magic Zone 24%, Rallying Cry 42%.
Healers' own are pressed by 97 to 100%. A plan built on a Darkness nobody talented leaves that hit bare on the night.

### S10. lorrgs has moved since Oct 24
The site's top-raid moments are 16 days old. Fresh pull against them: 651 moments the same, 12 strong ones gone, 26 new, 25 where the share moved 20
points or more. Most change: Ula'tek Mythic (9 new, mainly Evangelism) and Coiled Altar Mythic (Spirit Link moved from P2 0:01, 98%, to P1 2:23,
86%). lorrgs also changed its address; the fetch script is updated.

### What is right (checked, nothing to change)
- No cooldown is pressed before it is back: 0 of 1,046 presses.
- Cooldown lengths match the shortest gap top players leave: Aura Mastery, Spirit Link, Darkness, Anti-Magic Zone, Rallying Cry, Rewind, Restoral 180 s;
  Zephyr, Vampiric Embrace, Apotheosis, Avenging Wrath, Yu'lon 120 s; Evangelism and Celestial Conduit 90 s; Convoke 60 s; Ultimate Penitence 240 s.
- No healer-only cooldown goes to the wrong spec. The talent defaults match top players: Ascendance over Healing Tide (3%), Ultimate Penitence over
  Barrier (0%), Restoral 58% and Revival 40%.
- The same non-stacking cooldown from two players never overlaps.

## Part 2: Boss by boss, Mythic

**1. Nymrissa Wavecaller** (plan 4:10, uses 61% Wolfthorn / 70% top roster)
- 1.1 Six buttons on Abyssal Rain at 0:46; one Zephyr on the same-size Frost Burst at 2:42 (S7).
- 1.2 Pop! at 3:50 gets 3 raid cooldowns. Top kills put 0.4 on Pop! and none on 74% of them.
- 1.3 Not in the plan: Frost Burst 0:53 (88% of top kills), Abyssal Rain 1:28 (75%) and 3:18 (88%), and everything after 4:10 (S2).
- 1.4 Rewind, Aura Mastery and Restoral are each pressed once of 2; Kargaryen's Zephyr once of 3.

**2. Nek'zali the Soulcoiler** (plan 4:17, uses 59% / 67%)
- 2.1 The heaviest hit, Grasping Depths at P2 1:38, is bare with three cooldowns free (S6).
- 2.2 Not in the plan: Soulcoil Rite at P1 1:28 and 1:36 (100% of top kills, 9.2M and 7.1M in 4 s, the heaviest stretch of phase 1), P1 0:04 and
  0:49, Grasping Depths at P2 1:02.
- 2.3 Top kills put the most on Possession Barrage (1.4 raid cooldowns); ours 2.5, fine.

**3. Entombed Sentinels** (plan 4:35, uses 76%)
- 3.1 Not in the plan: Contaminate at 1:31 (81%), 2:10 (100%) and 3:14 (88%); Unstable Miasma 2:03; Mark of Blood 2:40.
- 3.2 Top roster: 2 hits bare. In the plan but not seen in top kills: Mark of Acid at 0:48 and 3:00.
- 3.3 Noxious Blast is the heaviest moment in top kills when it happens (10.6M, 1.1 raid cooldowns) and isn't in the plan. Check the guide: it may
  be a slip, not a planned hit.

**4. The Lost Explorers** (plan 3:55, uses 79%)
- 4.1 All nine hits are "Splinters". Top kills put 0.3 raid cooldowns on Splinters and none on 79% of them.
- 4.2 Not in the plan at all: **Blink Nova**, five times a fight in 100% of top kills (P1 0:17 and 0:46, P2 1:16 and 1:45, P3 1:14), 0.8 raid
  cooldowns each; **Mighty Thud** at P3 0:14 and 0:46, 0.8 each. The Heroic plan does have Blink Nova.

**5. Vashnik the Malignant** (plan 4:37, uses 67% / 70%)
- 5.1 Caustic Surge at 2:08 (2,354K) gets 1; Malignant Catalyst at 4:02 (1,817K) gets 2.
- 5.2 Gloom Expulsion sits at 4:36 of a 4:37 plan and gets 3.
- 5.3 Not in the plan: Malignant Catalyst 1:57 and 3:21 (81%, 88%), Caustic Explosion 2:15 and 3:01. Malignance (11.7M, 1.2 raid cooldowns in top
  kills) isn't a hit; check the guide.

**6. Sszorak** (plan 4:56, uses 76% / 81%)
- 6.1 Viscous Cyst at 1:51 is bare (top roster: 3 bare).
- 6.2 Venomous Surge gets 2; top kills put 0.1 on it and none on 87%. Virulence gets 2 to 2.5; top kills 1.0.
- 6.3 Not in the plan: 11 hits, among them Venomous Surge 1:28, 3:35, 4:55 and 5:42, Viscous Cyst 2:00, 2:08 and 3:58, Virulence 5:28.

**7. The Twin Fangs** (plan 5:32, uses 86%)
- 7.1 Not in the plan at all: **Ravenous Feast**, four times in 100% of top kills (1:01, 2:02, 3:36, 6:11), 0.7 raid cooldowns each; Rouse the
  Brood five times (check the guide: add damage).
- 7.2 Caustic Globule gets 1.6 raid cooldowns a time; top kills 0.2, none on 79%.
- 7.3 Stir the Depths at 0:48 (2,531K) gets 1; Caustic Globule at 0:16 (1,453K) gets 2.
- 7.4 The plan ends at 5:32. Top kills have hits at 5:35, 5:46, 5:57 and 6:11; Wolfthorn's kill ran to 6:44 (S2).

**8. The Coiled Altar** (plan 8:14, uses 69% / 71%)
- 8.1 Spirit Erasure gets 5 raid cooldowns (7 for the top roster); the heaviest hit, Venom Rupture at P1 2:15 (3,801K), gets 2. Top kills: 1.8 on
  Spirit Erasure.
- 8.2 Fangs of the Coiled Altar at 1:32 and Dreadful Presence at P2 1:30 get only Apotheosis and read "1 short". Top roster: 5 hits short or bare.
- 8.3 Not in the plan: Venom Rupture at P1 1:56 and 2:29 (100% of top kills; 2:29 is their heaviest at 15.4M), six Dreadful Presences late in
  phase 2, Spirit Erasure at Int 0:14, Death's Whisper in phase 3.
- 8.4 Dreadful Presence gets 0.8 a time; top kills 0.2 and none on 80%. Those presses are better spent on the Venom Ruptures.
- 8.5 Restoral and Yu'lon from the same Mistweaver at 6:14 (S8).

**9. Ula'tek** (plan 9:43, uses 73% / 71%)
- 9.1 Necrotic Vapors at P2 0:24 and 1:12 are bare; Blight Vein at P2 0:42 gets 4.
- 9.2 Mephitic Thrash gets 3 each time; top kills 0.9. Spectral Coils gets 3; top kills 1.2.
- 9.3 Not in the plan: **Spectral Coils at P1 2:14** (100%, 12.7M) **and at Int 0:16** (100%, 14.3M, their second heaviest), Mephitic Thrash
  P1 0:57, Rage of the Shackled P1 2:35, Necrotic Vapors P2 0:53 and five in phase 3.
- 9.4 Necrotic Vapors at P3 3:18 is bare with Rewind free.

**10. Kith'ix** (plan 4:39, uses 64% / 68%)
- 10.1 The heaviest hit, Digestive Juices at P2 0:24 (4,632K), gets 2; the first one (4,362K) gets 3 (S6).
- 10.2 Suffocating Darkness 10 s into the second intermission is bare; a cooldown pressed just before the phase change isn't counted across it.
- 10.3 Not in the plan: **Eightfold Eclipse three times in phase 4** (0:08, 0:34, 0:43, all 100%; the plan has one), Digestive Juices at P2 0:35,
  Voidswarm at P1 0:07 and P2 0:14. Extinguish shows three times at 10M; check the guide (it may be a soak).

## Part 3: Heroic

Heroic plans read better on uses (75%, up to 95% on short fights) because the fights are short. The same rules misfire:
- **H1. Stacks on light hits.** 12 lighter-half hits carry 3 or more raid cooldowns. Entombed Sentinels: Toxic Droplets (1,580K) gets 5 while the
  heaviest, Unstable Miasma at 2:04 (1,716K), gets 3. Coiled Altar: the second lightest hit gets 4 (S6).
- **H2. Bare hits with cooldowns free.** Ula'tek: Necrotic Vapors at P3 1:08 (2,809K, the third heaviest) with two Zephyrs and Anti-Magic Zone free.
  Sszorak: Venomous Surge at 3:02, the heaviest hit, sits on the plan's last second and gets nothing. Kith'ix: Voidswarm. Lost Explorers: Malevolent
  Presence at P1 1:03.
- **H3. Short lists.** Heroic lists have 4 to 10 hits (Nek'zali 4, Vashnik 4, Kith'ix 4). The same rebuild as S1 is needed, from Heroic kills.
- **H4. Utility is rarer on Heroic** (S9): Darkness is pressed by 17% of top Havocs, Anti-Magic Zone by 24% of Unholy, Rallying Cry by 42% of Arms.
- **H5. Mythic-only mechanics.** None found in the Heroic lists; every Heroic hit name is a Heroic mechanic.

## Part 4: The fixes, in order

Each is a small push, tested before and after on Wolfthorn's roster and a top-guild roster for every boss.

1. **Marks and need** (S3, S4): need by size against the fight's usual hit; a healer's big cooldown and Tranquility count as cover.
2. **Heaviest first** (S6, S7, S8): no extra on a lighter hit while a heavier one is short; stacks capped by size; one player, one cooldown at a time.
3. **The hit lists** (S1, H3): every boss rebuilt from 16 top kills, each mechanic checked against its guide. Mythic first, then Heroic.
4. **Longer fights and every use** (S2, S5): the last phase's pattern carries on to your own phase times, and spare presses go to the next hit.
5. **Cooldowns a raider may not have** (S9): Darkness, Anti-Magic Zone and Zephyr only when the raider has pressed one in their logs, or marked "if talented".
6. **lorrgs refresh** (S10).

## Part 5: What was fixed (Nov 9, saved to main, not live until the next build)

All numbers are the same 40 plans, as the coverage strip marks them.

| Push | What | Result |
|---|---|---|
| 241a0af4 | Hits of the same size share a class; Tranquility is a raid cooldown (S3, S4) | Nymrissa's five 2.6M to 3.1M hits all need 2 |
| d5763a38 | Heaviest hits first; stacks capped; no doubling up a player on a spare press; end-of-phase hits (S6, S7, S8) | Mythic covered 188 to 216 of 222, doubled up 10 to 0. Heroic covered 104 to 116 of 122, bare 10 to 2 |
| 64e6b23b | Fuller hit lists on every boss; each cooldown timed over the whole fight (S1, S5) | Mythic hits known 222 to 320, covered 268. Heroic 122 to 162, covered 144. Presses near no listed hit 63 to 29 |
| edd40382 | With your own longer phase times, the planner uses the chart's hit times (S2b) | With every phase 22% longer: hits with a cooldown on them 160 to 239 of 241 |
| (this push) | Top-raid moments from today's lorrgs (S10) | 26 new strong moments, 12 gone. It moves a handful of the lightest hits either way; the totals stay level |

Start to end, Mythic: hits known 222 to 320; hits with their full need 188 to 272; hits with more than they need 10 to 8; presses near no listed
hit 63 to 21; one player given two cooldowns at once 26 to 11; pressed before it is back 0 throughout.

**Still open, and why**
- **Uses are 74% (were 72%).** Every press now lands on a listed hit, and no hit takes more than one over its need, so some presses have no place
  left. Going higher means stacking more on hits that are already covered. Top healers on lorrgs sit at 70 to 90% by the same count.
- **A longer phase has more hits, not later ones (S2).** Boss abilities run on timers. The chart stretches the fastest kills' hits along a longer
  phase (Flex's call for the damage line, Oct 24, extended Nov 6), and the planner now follows the chart so the two agree. Drawing the extra hits
  instead needs the chart changed too, and the hits past the fastest kill's end are already measured (`hits.js`). Flex's call.
- **Darkness, Anti-Magic Zone, Zephyr (S9).** The planner can't see who has talented them: it gets the roster, not logs. Options: leave it (the
  raider removes it), a per-raider "has it" switch on the roster, or only after it shows in that raider's logs. Flex's call.
- **About 40 lighter Mythic hits stay short or bare.** The raid has fewer cooldowns than Ula'tek has hits (29). Those are where a Defensives call goes.
- **The chart was not opened in a browser by the audit** (Plan needs a sign-in). The planner was tested by running the site's own code.
- Mechanics seen in top kills and left out on purpose, to check against the guides: Noxious Blast (Sentinels), Malignance (Vashnik), Extinguish
  (Kith'ix), Rouse the Brood (Twin Fangs), Circling Prey (Ula'tek).
