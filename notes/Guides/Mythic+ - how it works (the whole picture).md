# Mythic+: how it works (the whole picture)

Midnight Season 2, patch 12.1.5. Researched Nov 14, 2026 for Flex, who asked: "do deep research on mythic+ and how it works. Whats important, whats not. I want you to really understand mythic+ as a whole", and then: "understand all the nuances mythic+ players need to know in order to properly tune the mythic+ page".

This guide is the big picture. The season's dungeons, timers and boss plans are in [Mythic+ Season 2 - master guide.md](Mythic+%20Season%202%20-%20master%20guide.md). The casts to kick are in [Mythic+ must-kick lists.md](Mythic+%20must-kick%20lists.md).

**How to read it:** every fact ends with a tag in square brackets. The tags are explained under Sources at the bottom. "Measured" means it was counted in Flex's own combat logs or in Raider.IO's live data on Nov 14. "General" means the source is an older season's guide whose point doesn't depend on the season. "Unverified" means no reliable source says it, so don't build on it.

---

## In one minute

1. **A key is a race against a clock, and deaths are the biggest thing that loses it.** From +12 every death takes 15 seconds off the clock. The best 100 keys in the world finish with only about 5% of the timer left, which is about six deaths of room. [RIO-API, measured]
2. **The route and the pull plan decide the pace before anyone presses a button.** The tank sets it. In Flex's own +19s, most of the gap to a fast run was trash pace, not deaths. [RIO-TANK, DEBRIEF]
3. **Stopping the dangerous casts and pressing a defensive on the known big hits is the real skill test in high keys.** Raider.IO's own advice for +12 and up is to use defensives and not lean on the healer. [RIO-AFF]
4. **Damage matters as a group number on the slow pulls, not as a personal ranking.** A higher key level is worth 15 points; finishing faster is worth 15 points at the very most. Overhealing, healing per second and parse colours tell you almost nothing in a key. [RIO-API measured, RIO-MIND]
5. **What matters changes with the key level.** +2 to +5 deaths are free, +6 to +11 they cost 5 seconds, +12 and up 15 seconds with both Fortified and Tyrannical. Any judgement has to know which band the key is in. [WH-KS, measured]

---

## 1. The system

### Starting and finishing a key
- The keystone holder puts the key in the Font of Power. A 10-second countdown runs, then the timer starts. [WH-KS]
- After the start, nobody can change talents or gear, except weapons. The group can't swap players. [WH-KS]
- A key is finished when every boss is dead **and** Enemy Forces is at 100%, inside the timer. [WH-KS]
- New this season: an enemy's tooltip shows how much it counts toward Enemy Forces. [WH-OV]
- Whether the count must be full before the last boss, and whether the timer ever pauses: **unverified**. Count past 100% gives nothing, so it's time spent for no reward (our reading; no source says otherwise).

### How the key's level moves
| Result | What the key does |
|---|---|
| Finished with less than 20% of the timer left | +1 level |
| Finished with 20% to 40% left (80% of the timer or less used) | +2 levels |
| Finished with more than 40% left (60% or less used) | +3 levels |
| Over time, or not finished | −1 level |
[WH-KS; the 80% and 60% lines were checked on Raider.IO runs in the master guide]

- **Resilient Keystone:** time all 8 dungeons at one level, +12 or higher, and your key never drops below that level for the rest of the season. There's one achievement per level. [WH-OV, WH-KS]
- **Lowering a key on purpose:** talk to Lindormi in Silvermoon (−1), or start the key, walk out and reset. [WH-KS, WH-OV]

### Leaving a key early
- **/abandon** is a majority vote. It ends the run, sends everyone out, drops the key one level and carries no penalty. [WH-KS]
- Leaving without the vote too often marks you "Keystone Deserter" in Group Finder, where other players can see it. Finishing runs or using the vote clears it. No number of leaves or lockout time is published. [WH-KS]
- In the log, a key that was left has an end line full of zeros, and WoW writes it only when the next key starts. (Seen on every left key in Flex's logs.) [LOGS]
- "The key drops the moment it starts" and "the holder leaving depletes it": **unverified** (forum posts and a support page we couldn't read).

### What changes with the key level
| Level | What's on the key | A death costs |
|---|---|---|
| +2 to +5 | **Lindormi's Guidance:** a marked route that adds up to 100%, marked enemies 5% weaker | nothing |
| +5 to +11 | **Xal'atath's Bargain**, one of four each week (so +5 has both) | 5 seconds from +6 |
| +7 to +9 | **Fortified** or **Tyrannical**, swapping weekly | 5 seconds |
| +10 and +11 | **Both** Fortified and Tyrannical | 5 seconds |
| +12 and up | Both, and **Xal'atath's Guile** replaces the Bargain | **15 seconds** |
[WH-OV, WH-KS, RIO-API]

- **Fortified:** non-boss enemies have 20% more health and do up to 20% more damage. **Tyrannical:** bosses have 25% more health, and bosses and their minions do up to 15% more damage. [RIO-API, the game's tooltip text]
- **Guile:** the game's text is "revoking her bargains while making deaths subtract 15 seconds from time remaining". No source mentions any exception. [RIO-API]
- **Sources disagree on where Lindormi's Guidance ends.** Wowhead's two guides and the wiki say it covers +2 to +5. Icy Veins and Raider.IO's pre-season article say +2 to +4. We go with Wowhead. [WH-OV, WH-KS, IV-S2, RIO-AFF]
- **Raider.IO's pre-season article says Guile adds 90 seconds to the timer. Live keys don't show that.** A +24 Den of Nalorakk has the same 32:00 timer as any other level, and Flex's +12 and +20 scores only fit the plain timers. [RIO-API, LOGS measured]
- **The death penalty, measured on 16 of Flex's keys (Aug 20 to Oct 11):** 12 of them were +8, +10 or +11 keys with deaths. Ten came out at 4.2 to 5.2 seconds a death. The one +12 came out at 15.1 (and the master guide's +12 at 15.8). Two keys didn't fit: a Voidscar Arena +11 read 3.3 seconds (6 deaths), and a Voidscar Arena +10 on Sep 6 logged 9 player deaths with no time lost. We haven't explained those two. [LOGS measured, WH-KS]
- **The four Bargains** (+5 to +11 only): Ascendant (stop the orbs' casts), Voidbound (kill the emissary, kick Dark Prayer), Pulsar (walk into the circling orbs), Devour (dispel or heal through the absorb). Each gives the group a buff when handled and the enemies one when not. Details are in the master guide. [RIO-AFF, IV-S2]
- How much stronger enemies get per level in Midnight isn't published. Blizzard's last statement was for The War Within Season 2 (7% a level to +10, 10% after), so treat it as **unverified** here.

### Battle res and Bloodlust in a key
- **Battle res:** the group shares one pool. It starts with 1 charge and gains 1 every 10 minutes, up to 5. Any class's battle res uses it. [WH-BRES, a 2017 Wowhead article; nothing newer restates it, so it's **partly verified**]
  - Flex's logs fit it: no key used more than 2, and the second never came before 10 minutes. [LOGS]
  - A Holy Paladin's **Intercession** is a battle res. Flex used it in keys on Nov 2 and Nov 3. [LOGS]
- **Bloodlust:** a key gets one about every 10 minutes, because of the 10-minute debuff it leaves. Measured on 4 timed keys: the first Lust always came in the first minute (0:22 to 0:50), and the next never sooner than 10:01 after the one before. Boss pulls in between didn't bring it back. [LOGS measured]
  - So a 30-minute key has **3 Lusts**: one on the first big pull, then two more to place.
- Whether a boss pull resets anything else in a key: **unverified**.

### Rating (score)
- Your rating is the sum of your best run in each of the 8 dungeons. A worse run never lowers it. [RIO-API, WH-KS]
- Fortified week and Tyrannical week no longer count apart: one best run per dungeon. [WH-KS and the wiki]
- **The exact points for a timed key** (measured: it fits all 100 of the world's top runs to within 0.07 points, and every end line we checked in Flex's logs):
  - **125 + 15 for each key level + 15 for each affix step reached (+5, +7, +10, +12) + up to 15 for speed.**
  - Speed is 0.375 points for each 1% of the timer left, and it stops at 15 (40% left).
  | Level | Just timed | Fastest possible |
  |---|---|---|
  | +2 | 155 | 170 |
  | +5 | 215 | 230 |
  | +7 | 260 | 275 |
  | +10 | 320 | 335 |
  | +12 | 365 | 380 |
  | +15 | 410 | 425 |
  | +18 | 455 | 470 |
  | +20 | 485 | 500 |
  | +24 | 545 | 560 |
  [RIO-API: the "all timed at N" marks in the cutoffs data give the base, the top runs give the speed part; LOGS: +10 → 335.0, +12 → 378.3, +20 → 488.7]
- **What that means:** one more level is worth 15 points. Speed is worth 15 at the very most, and only if you finish in 60% of the timer. Reaching +5, +7, +10 or +12 is worth a double step (30).
- What an over-time key scores this season: **unverified**. Wowhead only says a failed key "rarely" raises your rating.
- **Where players are** (US, 731,056 characters with a rating, Nov 14): Keystone Master 2,000 is the top 58%. Keystone Hero 2,500 is the top 48%. Keystone Legend 3,000 is the top 26%. Keystone Myth 3,600 is the top 3.4%. The top 1% starts at 3,794 and the top 0.1% at 4,062. [RIO-API]
  - In key levels: 2,560 is all eight timed at +10, 2,920 is all at +12, 3,640 is all at +18 and 3,880 is all at +20. **Most players live between +8 and +14**, not at +20.

### Rewards
- **Item level stops going up at +10.** End of the run is 311 (Hero) and the Great Vault is 318 (Myth) from +10 up. [WH-OV, IV-S2]
  | Key | End of run | Great Vault |
  |---|---|---|
  | +2, +3 | 295 | 305 |
  | +4 | 298 | 308 |
  | +5 | 302 | 308 |
  | +6 | 305 | 311 |
  | +7 | 305 | 315 |
  | +8, +9 | 308 | 315 |
  | +10 and up | 311 | 318 |
- **Great Vault:** 1, 4 and 8 keys in a week open the three dungeon slots. Each slot's item level comes from your best keys that week. [WH-KS]
- **The end chest** holds 2 items for 2 random players. Over time, the second item is a lower item level. [WH-KS]
- **Crests (Mistcrests):** +2 and +3 give Champion, +4 to +8 Hero, +9 and up Myth. An upgrade costs 20. The weekly cap was lifted the week of Oct 20. [WH-OV, BLZ]
  - How many per key: Method lists 10 Myth crests at +9 rising to 16 at +12 and up. Wowhead says the amounts aren't confirmed, so **unverified**. [METHOD-CREST]
- **Ascendant Venomstones** (new in 12.1.5) drop from +10 and up. Ten of them raise a fully upgraded Hero or Myth item. [BLZ]
- **Dungeon teleport:** time that dungeon at +10 or higher. [IV-S2]
- **Titles and mounts:** 1,500, 2,000, 2,500, 3,000 and 3,600 (Keystone Myth, new in 12.1.5), plus a title for the top 0.1%. [WH-OV, BLZ]
- **So there are three kinds of player.** Up to +10 people play for gear. At +10 to +12 they play for the vault, crests and the teleport. Above +12 the only rewards are rating, the Resilient key and the titles.

---

## 2. What makes a key succeed or fail

### The clock, in real numbers
- **Where a timed +20 spends its time** (Flex's Kings' Rest +20, Nov 5, 29:43 on a 33:00 timer, no deaths): bosses 13:51 (46%), fighting trash 13:37 (46%), not fighting 2:24 (8%). [LOGS measured]
- **At +12 the bosses are about a third:** 34% to 37% of the key on Altar of Fangs, Temple of Sethraliss and Ruby Life Pools. Bosses grow with the level because Tyrannical gives them more health. [LOGS measured]
- **The best keys in the world just make it.** Of today's top 100 runs, 99 are +24 and one is +25. None got a +2. They used 85% to 98% of the timer, and the middle one used 94.8%. On a 32-minute timer that's about 1:40 to spare. [RIO-API measured]
- **Every failed +20 in Flex's recent logs ended on a wipe, not on a slow clock.** Murder Row (Nov 2) and Den of Nalorakk (Oct 31) ended on a first-boss wipe. Kings' Rest (Nov 3) was left after 9 deaths. The Blinding Vale (Nov 9) was started five times in a row and wiped in the first three minutes each time. [LOGS measured]

### Route and pull size
- The tank sets the pace. The job is to balance a big pull that has to be kited against a smaller one the group can stand and fight. [RIO-TANK, general]
- The tank's "biggest impact" is how they set up pulls and path through the dungeon. [RIO-ROLE, general]
- The best teams don't follow one rule. In tournament routes they chose pull by pull: the biggest pull they could survive with Lust at the start, a safer one where the dungeon punished it. [RIO-MDI, general]
- **Enemy Forces:** a good route ends at 100% or a little over. The typical fast Voidscar Arena +19 ended at 105.7%. [DEBRIEF, from the master guide] Being short at the end means walking back for more.
- **Fewer, bigger pulls are where fast groups save time.** On Flex's Voidscar Arena +19, one stretch took him 4 pulls and the fast run 1. [DEBRIEF]
- No source gives a "right" pull size. It depends on the group's damage, stops and defensives.

### Pace: the time between fights
- In Flex's three +19s, most of the gap to a typical fast run was trash pace: more pulls, longer trash fights and standing between pulls. Deaths were the small part. [DEBRIEF, master guide section 8]
- On the Voidscar Arena +19, Flex's group stood 1:48 between pulls and the typical fast run 1:05. [DEBRIEF]
- Healers are told to drink the moment a fight ends, so the tank never waits on mana. [RIO-HEAL, general]
- A split of walking against waiting isn't in any guide. Debrief can measure it from the log (section 6).

### Deaths: what they really cost
- **The clock:** 15 seconds at +12 and up, 5 at +6 to +11, nothing below. [WH-KS, measured]
- **The damage:** "A dead DPS is no DPS!" [RIO-DPS]. One player down "drastically increases the pressure" on the tank and healer. [RIO-ROLE]
- **The chain:** in a group of five, one death often becomes a wipe. A wipe at +12 and up is 75 seconds of penalty, plus the run back, plus pulling the same pack again from full health.
- **Don't reset a bad pull if you can finish it.** It's "better to finish the disaster pull" than to pull it again from 100%. [RIO-MIND, general]
- The run back is different in every dungeon. No source gives a number, so it's **unverified** and worth measuring.
- A battle res gives the player back, but not the 15 seconds. And the pool is small: one at the start and one more at 10, 20 and 30 minutes. [WH-BRES, partly verified]

### Kicks and stops
- Top players have a kick plan for every pull, with a backup. [RIO-MIND, general]
- **Which casts matter most:** enemy heals, big area damage, and casts that take control away from players. In Den of Nalorakk that's Healing Breeze, Frigid Roar and Arc Lightning ("interrupt every cast"). [METHOD-DON, this season]
- Stuns, knockbacks, disorients and roots stop casts too. For casts that can't be kicked they're the only way. [RIO-DPS, general]
- **Healers can't kick in Midnight**, except Restoration Shaman. So kicks belong to the tank and the three DPS. In Flex's Kings' Rest +20, four players made all 57 kicks. [project rule, LOGS measured]
- **The count of kicks means nothing by itself.** What matters is which casts got through.

### Defensives on the big hits
- Raider.IO's advice for +12 and up: use defensives during heavy damage or spells aimed at you, don't rely on the healer, "just don't die!". [RIO-AFF, this season]
- High keys are a set of known damage checks. In Den of Nalorakk: Razor Dive, Primal Echo, Hearty Bellow, and Nalorakk's three big hits in Overwhelming Onslaught. [METHOD-DON, this season]
- Top players press an immunity before a known debuff lands, not after. [IV-TIPS, general]
- Use defensives with the group in mind, and keep a Healthstone. [RIO-DPS, general]

### Cooldowns and Lust
- "Use them based on the route. Hold them for upcoming bosses or big pulls." [RIO-ROLE, general]
- With Fortified on, hard trash can be worth a Lust. Save one for the hardest boss if you can. [RIO-AFF, this season]
- With 3 Lusts in a 30-minute key, the plan is which three moments get one. Every key we measured used the first in the opening minute. [LOGS measured]
- No reliable source gives a Lust plan per dungeon this season. Raider.IO's heatmaps show where top groups press it.

### Mindset
- After a bad key, top players say "we just go next". Tilt after a wipe loses more keys than the wipe did. [RIO-MIND, general]

---

## 3. Each role's real job

### Tank
- Leads the group, picks the route and sets the pace. [RIO-ROLE, RIO-TANK]
- Starts the next pull as the last one dies, so cooldowns and Lust aren't wasted on a walk.
- Mitigation goes up front, at the start of a pull when everything is alive and hitting. [RIO-TANK]
- Knows each boss's tank hit and rotates defensives for it. [RIO-TANK]
- Should need as little healing as possible, so the healer can do damage. [RIO-ROLE]
- Faces cleaves away from the group and moves casters together. [RIO-ROLE]
- **A great tank** makes the key feel fast and calm: same pulls as a fast run, short gaps, no surprise packs.

### Healer
- "Your first priority as the healer in the party is to keep your group alive." [RIO-HEAL]
- Something every global cooldown, but "it won't always be a healing spell!". Too much damage risks a death, too little risks the timer. [RIO-HEAL]
- Owns their own mana, and drinks as soon as a fight ends. [RIO-HEAL]
- Dispels the dungeon's list, and tells the group what they can't dispel. [RIO-HEAL]
- Holds healing cooldowns and externals for the known big hits. [RIO-HEAL]
- **A great healer** has nobody die to damage that could be healed, wastes no time, and adds damage in the quiet seconds. Healing per second and overhealing don't show any of that.

### DPS
- Kill things "as quickly and safely as possible". [RIO-ROLE]
- "Surviving is often more important than eking out the last couple of percent of your DPS potential." [RIO-ROLE]
- Own the kicks, the stops and their own defensives. [RIO-ROLE, RIO-DPS]
- **Priority damage beats padded damage.** Damage on the dangerous enemy or the one that will live longest saves more time than the same damage spread over a pack, and it matters more as keys go up. [RIO-DPS]
- Line up big cooldowns with the big pulls and the bosses. [RIO-ROLE]
- **A great DPS** doesn't die, stops their assigned casts, and has cooldowns ready when the tank pulls big.

### Group setup and utility
- **Today's top 100 runs** (Nov 14, all +24 or +25): Arms Warrior 93, Holy Paladin 88, Subtlety Rogue 88, Elemental Shaman 87, Blood Death Knight 73, Guardian Druid 24, Restoration Shaman 10, Assassination Rogue 8. [RIO-API measured]
  - Blood DK / Holy Paladin / Arms / Elemental / Subtlety is 55 of the 100. The same group with a Guardian Druid tank is 18.
- **Why those classes** (tool lists from a 2021 Raider.IO article, so check today's talents before quoting): [RIO-MELEE, general]
  - Death Knight: a battle res, Death Grip to bunch enemies up, Anti-Magic Zone for the group.
  - Paladin: Blessing of Protection, Blessing of Sacrifice, Divine Shield, a long stun, and a battle res. [LOGS for the battle res]
  - Warrior: Rallying Cry, Battle Shout, Spell Reflection.
  - Rogue: Shroud of Concealment to skip packs, Cloak of Shadows, several stuns.
  - Shaman: Bloodlust, the shortest kick, an area stun, Purge.
- **What a group needs, whoever brings it:** Lust, a battle res, enough kicks and area stops, a way to skip, and the dispels the dungeon asks for. [RIO-MELEE, general]
- **Candid:** the setup decides the last key level or two at the very top. For most players it matters far less than playing the key well. Tier lists move week to week; the top-run counts are the firm part.

### Skips
- Shroud of Concealment, invisibility potions and crowd control on a lone enemy are the tools. [RIO-MELEE, general]
- In Flex's 44 saved Voidscar Arena keys, every key with a Rogue used the same Shroud skip, and so did the fast run. [LOGS, from the pack-skips work of Nov 3]
- How common skips are in each dungeon this season: **unverified** beyond that.

---

## 4. What matters, what doesn't (ranked)

Scores are for keys at +12 and up unless the line says otherwise. The score is how much the thing decides whether a key is timed.

| # | Thing | /10 | Why |
|---|---|---|---|
| 1 | **Not dying** | 10 | 15 seconds each, the damage is gone, and one death often becomes a wipe. Top keys have about six deaths of room. [RIO-API, RIO-AFF] |
| 2 | **Route and pull plan** | 9.5 | It fixes the pace before the key starts. More, smaller pulls was Flex's biggest gap. [RIO-TANK, DEBRIEF] |
| 3 | **Stopping the dangerous casts** | 9 | One heal or volley that goes off can turn a pull into a wipe. Which casts, not how many kicks. [METHOD-DON, RIO-MIND] |
| 4 | **Defensives on the known big hits** | 9 | High keys are damage checks the healer can't cover alone. [RIO-AFF, METHOD-DON] |
| 5 | **Pace between pulls** | 8.5 | Standing and walking add up to minutes. Measured: 1:48 against 1:05 on one key. [DEBRIEF] |
| 6 | **Boss fights** | 8 | Nearly half of a +20 is bosses, and a boss wipe usually ends the key. [LOGS] |
| 7 | **Group damage on the big pulls** | 8 | The timer is a damage check. It's the group's number on the slow pulls that counts. [RIO-DPS] |
| 8 | **Cooldowns lined up with the pulls** | 7.5 | Big pulls die fast only when the cooldowns are there. [RIO-ROLE] |
| 9 | **Lust on the right three moments** | 7.5 | Only 3 in a key. A Lust on a small pull is gone for 10 minutes. [LOGS, RIO-AFF] |
| 10 | **Priority damage** | 7 | Killing the dangerous enemy first shortens the danger and the pull. [RIO-DPS] |
| 11 | **Finishing at 100% count, not short and not far over** | 7 | Short means walking back. Far over is time spent on nothing. [WH-KS, DEBRIEF] |
| 12 | **Dispels and purges on the dungeon's list** | 6.5 | Some kill if left, most only hurt. It depends on the dungeon. [master guide] |
| 13 | **Group setup and utility** | 6.5 | 7 to 8 at +22 and up, where 55 of 100 groups are the same five specs. About 4 below +15. [RIO-API] |
| 14 | **Battle res use** | 6 | It saves the lost damage, and the pool is small. [WH-BRES] |
| 15 | **Healer damage** | 6 | Real time saved in quiet moments, but never at the cost of a death. [RIO-HEAL] |
| 16 | **Staying calm and finishing a bad pull** | 6 | A finished disaster pull beats a reset. [RIO-MIND] |
| 17 | **Handling the weekly Bargain** | 6 at +5 to +11, 0 above | It doesn't exist from +12. [WH-OV] |
| 18 | **Skips** | 5 | Worth a lot in a few places, nothing in others. [LOGS] |
| 19 | **Avoidable damage as a total** | 5 | It matters when it kills or drains the healer. The total by itself doesn't say that. [RIO-ROLE] |
| 20 | **Flask, food, potions, Healthstone** | 5 | Cheap and expected. Rarely the reason a key fails. |
| 21 | **A clean rotation on every trash pull** | 4 | Packs are short fights with cooldowns coming and going. Group damage on the pull is the real question. [RIO-MIND] |
| 22 | **Your place on the overall damage meter** | 4 | "Hyper-fixating on the DPS meters is a dangerous game to play." Pull size and route change everyone's number. [RIO-MIND] |
| 23 | **How many kicks you made** | 3 | A count rewards kicking harmless casts. What got through is the measure. |
| 24 | **Going for +2 or +3 on a push key** | 3 | Speed is worth 15 points at most; the next level is worth 15 for just timing it. [RIO-API] |
| 25 | **Healing per second** | 3 | It goes up when the group stands in things. Nobody dying is the measure. |
| 26 | **Parse colours and percentiles** | 2 | A key's damage per second is divided by the whole run, walking included, and depends on the route. [WCL-HELP, unverified snippet] |
| 27 | **Overhealing** | 1 | Damage in keys comes in bursts and people must be topped up before the next one. No guide treats it as a measure. |

**Where raid habits mislead:** numbers 21, 22, 25, 26 and 27 are how a raid log is usually judged. In a key they sit at the bottom.

---

## 5. How judging a key differs from judging a raid pull

| | Raid pull | Mythic+ key |
|---|---|---|
| The fight | One scripted boss, the same for every guild | A route the tank chose. No two keys are the same fight. |
| Winning | The boss dies | The clock. A key can kill everything and still fail. |
| A death | Usually the pull is lost or weakened | A fixed price on the clock, and the run goes on |
| Comparing damage | Fair: same boss, same length | Unfair across the whole key: pull size and skips change everyone's number |
| Fight length | One long fight | Many short ones in a row. Bosses ran 1:37 to 2:27 at +12 and 3:08 to 4:14 at +20 in Flex's keys; packs are shorter. |
| Cooldowns | Planned to the second on a timeline | Planned around pulls: which pack and which boss gets them |
| Kicks | A few assigned ones | Dozens a key (57 in one +20), owned by four players |
| Healing | Planned cooldowns for known raid damage | Bursts on one or two players; triage, dispels, and damage in between |
| Lust | Once a pull | Three in a key, about 10 minutes apart |
| Battle res | A pool that grows with the fight | One at the start, one more every 10 minutes |
| One player's share | 1 of 20 | 1 of 5. One missed kick or one death moves the whole key. |
| What changes it | The difficulty | The key level band and the affixes |
| Learning | Pull the same boss 50 times | Each key is one try, and the wipe costs time and the key |

**What follows for judging a player:**
1. Judge the group's result first (the clock), then each player's part in it.
2. Compare like with like: the same dungeon, the same level band, the same pull or boss. Never whole-key numbers across different routes.
3. Weigh deaths, casts that got through and missed defensives above damage and healing numbers.
4. A tank is judged on pace and route, a healer on deaths and dispels, a DPS on survival, stops and damage on the big pulls.

---

## 6. What a combat log can and can't show

### It can show
| Thing | How |
|---|---|
| The key, its level and its affixes | `CHALLENGE_MODE_START,"Kings' Rest",1762,249,20,[9,10,147]` (affix IDs: 9 Tyrannical, 10 Fortified, 147 Guile, 148 Ascendant, 158 Voidbound, 160 Devour, 162 Pulsar, 165 Lindormi's Guidance) |
| The result, the official time, the run's points and your new rating | `CHALLENGE_MODE_END,1762,1,20,1783326,488.724884,3787.405762` |
| What the deaths cost | The official time minus the time that really passed. This is how the penalty table in section 1 was measured. |
| Each boss fight, kill or wipe | `ENCOUNTER_START` and `ENCOUNTER_END` |
| Each pull and how long it took | From who is hitting whom. Debrief's reader already does this. |
| Time fighting against time not fighting | The gaps between pulls |
| Every death, what killed them, and what they pressed before | `UNIT_DIED`, with the hits before it (a Feign Death is marked and skipped) |
| Battle res and who got it | `SPELL_RESURRECT` and the res spells |
| Lust, and when it was ready again | The Lust buff and the 10-minute debuff after it |
| Kicks, and which cast each one stopped | `SPELL_INTERRUPT` |
| Stuns and other stops on a casting enemy | The crowd-control debuff landing during the cast |
| Dangerous casts that finished | `SPELL_CAST_SUCCESS` from the enemy, or the buff or damage that follows |
| Damage each player took from a named cast, and whether a defensive was up | The damage lines and the player's buffs |
| Dispels and purges | `SPELL_DISPEL`, `SPELL_STOLEN` |
| Enemy Forces | Each enemy that died, times its value from Raider.IO's list. The log has no count line of its own. |
| Where each pull happened | Positions on the damage lines |
| Each player's spec, talents and item level | `COMBATANT_INFO` at the start |
| Mana, and drinking | The power numbers on a player's own lines, and the Drink buff |
| Skips done with a tool | Shroud, Mass Invisibility, or crowd control on an enemy nobody hit |

### It can't show
- **The plan.** Who was meant to kick what, or which pull the Lust was saved for. The log shows whose kick was ready, never whose job it was.
- **Why the group stood still.** Waiting for cooldowns, a bio break, a roleplay gate, or an argument all look the same. (Mana, a run back and Lust waiting can be told apart; see section 7.)
- **Intent.** A pull that came in by accident and a planned double pull look the same.
- **A skip done by walking around.** With no tool cast, nothing is written.
- **The clock on screen.** The log has the final time only. The time left at any moment has to be worked out.
- **Voice calls, and who led.**
- **Whose key it was.**
- **Line of sight and facing.** Positions are there, walls are not.
- **Why someone left.** A left key is just an end line of zeros.

---

## 7. What this means for Debrief

Ideas only. Nothing here is built. Each has a score for how much it would help a player time their next key.

### What the site and the Companion app already judge well
| What | Why it's right | /10 |
|---|---|---|
| The timer story: "What gets you +N" and "Where your M:SS went" | It starts from the clock, which is the only thing that wins a key | 9.5 |
| Trash, boss, standing and deaths split against a typical fast run | This is exactly where real keys are lost. It found Flex's trash pace. | 9.5 |
| The route on the map and pulls side by side with the fast run | Route and pull count are number 2 on the list | 9 |
| Must-kick casts that went off, with danger levels and a fair "whose kick was ready" | It judges which casts got through, not a kick count | 9 |
| The death penalty measured from the log, not assumed | It's right at every level band (5 and 15 seconds both come out) | 9 |
| Wipes named, with who died first and whether they used a defensive | Wipes end keys | 8.5 |
| Lust and big cooldowns marked on the pulls | The right idea; it can go further (below) | 7 |
| Pack skips | A real part of routes, and stated as facts | 7 |
| Avoidable damage from careful lists, never against the tank | Careful and fair | 6.5 |
| The season page with Raider.IO's own rating and "Push next" | Matches how rating really works | 8 |

### What they judge that doesn't matter much
| What | The problem | /10 for how much to change it |
|---|---|---|
| **Rotation, pull by pull, as a main chapter** | A clean rotation on trash is a 4 out of 10 for timing keys. It's good coaching, but it takes a lot of the page. Keep it, put it last, and lead with deaths, pace, stops and defensives. | 7 |
| **"DPS vs top" and "HPS vs top" tiles** | Whole-key numbers depend on the route and pull size. Healing per second is close to meaningless in a key. Show group damage on the slow pulls, and for a healer show deaths, dispels and damage done. | 7 |
| **"Next level: +2, 4:36 faster gets it" on a push key** | At +12 and up, nobody is trying to +2. The next step is the next level up, timed. Speak in points and levels: "this run 488.7 points; a timed +21 is 500". | 6 |
| **Counts of avoidable hits** | A hit that didn't kill or need a cooldown is a note, not a mistake. Rank by what it cost. | 5 |
| **One page for every key level** | A +8, a +10 and a +20 are different games (section 1). Most players are at +8 to +14. The page should say which band it's judging. | 6 |

### The most valuable things missing
| # | Idea | What it would say | The catch | /10 |
|---|---|---|---|---|
| 1 | **Defensive checks on the known big hits** | For each dungeon, a list of the hits that need a defensive (like the must-kick lists). Per hit: who had one up, who took it bare, who died. Example wording (made up): "Overwhelming Onslaught: 3 of 5 had a defensive. Your Arms Warrior took all three hits with nothing and died." | Needs a checked list per dungeon. Start with what kills in the logs, then the guides. | 9 |
| 2 | **The full price of each death** | The 15 seconds, plus the seconds they were dead, plus the damage the group lost, plus what came next (a battle res, or a wipe). Example wording (made up): "This death cost about 50 seconds: 15 on the clock, 35 of lost damage." | The lost-damage part is an estimate and must say so. | 8.5 |
| 3 | **The Lust plan** | The three Lusts: what each landed on, how long each sat ready, and where the fast run pressed theirs. Example wording (made up): "Your second Lust sat ready 2:34 and went on a trash pack. The fast run pressed it on the next boss." | Holding for a boss is often right, so state facts and the fast run's choice, never "wasted". | 8 |
| 4 | **Why you stood still** | Split the standing time by what the log can prove: running back after deaths, the healer drinking, Lust not ready, and the rest. | The rest stays "unknown". Don't guess. | 7.5 |
| 5 | **A tank page** | Gap between pulls, pull sizes against the fast run, and defensives up at the start of each pull | Needs care not to blame the tank for the group's choices | 7 |
| 6 | **Priority targets** | How long each dangerous enemy lived in a pull, against the fast run | Needs a "kill first" list per dungeon | 7 |
| 7 | **A healer page** | Deaths to damage that could be healed, dispels on the list and how fast, externals on the big hits, damage done, time the group waited on mana | "Could be healed" is hard to prove; start with dispels and externals | 7 |
| 8 | **Battle res ledger** | Charges the group had against charges used, and deaths left on the floor with a charge ready | The charge rule is from a 2017 article. Check it in game first. | 6.5 |
| 9 | **The weekly Bargain at +5 to +11** | Orbs stopped, emissaries killed, absorbs dispelled. Nothing judges this today. | Only matters below +12, but that's where most players are | 6 |
| 10 | **Stops on casts that can't be kicked** | Grow the "stop with CC" lists beyond Evolve | Needs each dungeon's list | 6 |
| 11 | **Your points, from the log** | The end line has the run's points and the new rating. Show both. | Small; mostly a nicer banner | 5 |

### Tuning rules for the page (the nuances)
1. **Know the band.** +2 to +5: deaths are free and the route is marked, so judge kicks and mechanics, not the clock. +6 to +11: 5-second deaths, a Bargain, and from +10 both affixes. +12 and up: 15-second deaths and no Bargain.
2. **Lead with the clock, then deaths, then stops and defensives, then cooldowns and Lust, then rotation.** That's the order of the ranked list.
3. **Never compare whole-key damage across routes.** Compare the same pull type, the same boss or the group's total on a stretch.
4. **A kick count is not a score.** Only casts that got through with a kick ready count, weighted by danger. (Already true.)
5. **Healers can't kick**, except Restoration Shaman. (Already true.)
6. **A tank standing in something on purpose isn't a mistake.** (Already true.)
7. **Holding a cooldown or a Lust for the next big pull or boss is good play.** Flag only what the fast run did differently, as a fact.
8. **Speed past "timed" is worth little.** Don't push a +20 player toward a +2.
9. **Boss time grows with the level.** A third of the key at +12, nearly half at +20. A slow boss matters more the higher the key.
10. **A failed high key is almost always a wipe.** For a key that was left, the most useful thing is the pull that ended it and why.
11. **Say what the log can't know.** No "accidental pull", no "wasted Lust", no guessing whose kick it was.
12. **Never state a number we haven't checked.** The crest counts, the battle res rule and enemy scaling per level are still unverified.

---

## Sources

**Read Nov 14, 2026.** Wowhead and Icy Veins guide pages were read in the browser; Raider.IO's data came from its public API.

| Tag | Source |
|---|---|
| WH-OV | Wowhead, Mythic+ Overview, Midnight Season 2 (updated Sep 29, 2026): https://www.wowhead.com/guide/midnight/mythic-plus-season-overview |
| WH-KS | Wowhead, Everything About Mythic+ Keystones and Dungeons (updated Aug 9, 2026): https://www.wowhead.com/guide/mythic-keystones-and-dungeons |
| WH-BRES | Wowhead, Mythic+ Combat Resurrection Change on the 7.3.5 PTR (Dec 15, 2017): https://www.wowhead.com/news/mythic-combat-resurrection-change-on-the-7-3-5-ptr-278503 |
| IV-S2 | Icy Veins, Midnight Mythic+ Season 2 guide (Aug 5, 2026): https://www.icy-veins.com/wow/midnight-mythic-season-2-guide |
| IV-TIPS | Icy Veins news, top players' Mythic+ tips (Dec 3, 2024, The War Within Season 1; general): https://wp-prod.icy-veins.com/?p=51028 |
| BLZ | Blizzard, 12.1.5 Content Update Notes: https://news.blizzard.com/en-us/article/24304162/12-1-5-content-update-notes |
| RIO-API | Raider.IO public API, season `season-mn-2`: `/api/v1/mythic-plus/static-data`, `/runs` (top 100 world runs), `/season-cutoffs?region=us`, `/affixes` |
| RIO-AFF | Raider.IO, Mythic+ Affixes, Midnight Season 2 (Aug 17, 2026): https://raider.io/news/740-midnight-mythic-plus-affixes |
| RIO-ROLE | Raider.IO, Mythic+ 101: Understanding Your Role (Jul 30, 2023; general): https://raider.io/news/240-mythic-plus-101-understanding-your-role |
| RIO-TANK | Raider.IO, Mythic+ 101: Tanking (Jul 2, 2021; general): https://raider.io/news/247-mythic-plus-101-tanking |
| RIO-DPS | Raider.IO, Mythic+ 101: DPS (Aug 13, 2021; general): https://raider.io/news/263-mythic-101-dps |
| RIO-HEAL | Raider.IO, Mythic+ 101: Healing (Oct 8, 2021; general): https://raider.io/news/286-mythic-plus-101-healing |
| RIO-MELEE | Raider.IO, Mythic+ 101: Know Your Melee DPS (Nov 22, 2021; general, old talent kits): https://raider.io/news/288-mythic-plus-101-know-your-melee-dps |
| RIO-MIND | Raider.IO, The Fifth Affix: Player Mindset (Oct 10, 2022; general): https://raider.io/news/407-the-fifth-affix-player-mindset |
| RIO-MDI | Raider.IO, MDI Route Transcriptions and Analysis (Jul 3, 2022; general): https://raider.io/news/373-mdi-route-transcriptions-and-analysis |
| METHOD-DON | Method, Den of Nalorakk guide (Oct 14, 2026): https://www.method.gg/guides/dungeons/den-of-nalorakk |
| METHOD-CREST | Method, Mistcrests from Mythic+ and raid bosses (Aug 24, 2026): https://www.method.gg/guides/mistcrests-from-mythic-dungeons-and-raid-bosses-in-wow-midnight-season-2 |
| WCL-HELP | Warcraft Logs' help article on rankings and parses (archon.gg). Seen as a search summary only, so treat as unverified. |
| LOGS | Flex's own logs in `RaiderIOLogsArchive`. Time split, Lust and battle res: Kings' Rest +20 (`110526_132422`), Altar of Fangs +12 (`102526_113513`), Temple of Sethraliss +12 (`103026_175902`), Ruby Life Pools +12 (`102726_123018`). Failed +20s: `110226_111618`, `103126_104828`, `110326_121929`, `110926_081401`. Death penalty: 16 keys in `082026_064857`, `082226_004533`, `082426_112120`, `090626_095159`, `091426_111136`, `101126_094922`, `101126_124323`. |
| DEBRIEF | Debrief's own Mythic+ tab, comparing Flex's +19s with a typical fast run (master guide, section 8) |

**How "fighting" was counted in the time split:** any second within 3 seconds of damage between a player and an enemy. Boss time is from each boss's start line to its end line.

**The helpers' full notes** (every claim with its link and date) are in the shared notes folder: `mplus-whole-picture-system.md` and `mplus-whole-picture-play.md`.

**Not found anywhere reliable, so still open:** the death penalty's exact wording for +6 to +11 from Blizzard (we have Wowhead and our own measurement), crest amounts per level, battle res rules restated for Midnight, enemy scaling per level, over-time scoring, a Lust plan per dungeon, and how common skips are this season.
