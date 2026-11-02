# Mythic+ Season 2 master guide (Midnight, patch 12.1.5)

This guide covers Midnight Season 2 Mythic+ and is meant for anyone working on Debrief. It was researched Nov 1–2, 2026 for Flex, who asked: "Go learn as much about the current m+ as you can… Only find reliable sources… make a list or guide or checklist".

**Sources** (only these):
- Blizzard's own posts
- Wowhead's season and dungeon guides
- Icy Veins' patch and hotfix reports
- Raider.IO's live data and affix guide
- Flex's own combat logs

When two sources disagree, the newer, live one wins: Raider.IO's live data and Blizzard's live tuning beat a guide written from the PTR. Each fact says where it came from. The must-kick lists live in `Mythic+ must-kick lists.md`; this guide repeats only the short version.

---

## 1. The season at a glance
- **Started:** the week of Aug 18, 2026 (Raider.IO: `season-mn-2`, starts 2026-08-18). Patch 12.1.5 went live Oct 13.
- **Dungeons (8):**
  - One new three-boss dungeon: **Altar of Fangs**.
  - The four Midnight dungeons that weren't in Season 1: **Murder Row**, **Den of Nalorakk**, **The Blinding Vale** and **Voidscar Arena**.
  - Three older dungeons: **Kings' Rest** and **Temple of Sethraliss** (Battle for Azeroth), and **Ruby Life Pools** (Dragonflight).
- **What Blizzard changed for the season** (Wowhead overview):
  - Enemies have more health, so the season leans on target priority and damage checks and takes pressure off tanks and healers.
  - Cones and lines have new warning visuals.
  - Each dungeon's worst pain points were fixed: faster roleplay, reworked boss mechanics.
  - An enemy's tooltip shows how much it counts toward Enemy Forces.

### Timers (Raider.IO live data, matches Flex's logs)
| Dungeon | Timer | +2 at (80%) | +3 at (60%) | Bosses |
|---|---|---|---|---|
| Altar of Fangs | 30:00 | 24:00 | 18:00 | 3 |
| Murder Row | 34:00 | 27:12 | 20:24 | 4 |
| Den of Nalorakk | 32:00 | 25:36 | 19:12 | 3 |
| The Blinding Vale | 30:00 | 24:00 | 18:00 | 4 |
| Voidscar Arena | 30:00 | 24:00 | 18:00 | 3 |
| Kings' Rest | 33:00 | 26:24 | 19:48 | 4 |
| Temple of Sethraliss | 32:00 | 25:36 | 19:12 | 4 |
| Ruby Life Pools | 28:00 | 22:24 | 16:48 | 3 |

Some pages still show older timers:
- Wowhead's overview shows Blinding Vale 31 and Temple 33. It says those came from the PTR.
- Wowhead's Altar page says 29.
- The last PTR tuning cut Blinding Vale to 30 and Temple to 32, and Raider.IO's live data agrees (Icy Veins, "Final(?) Mythic+ Tuning on the 12.1 PTR").

---

## 2. Affixes by key level
| Level | What changes |
|---|---|
| +2 | **Lindormi's Guidance:** marked enemies have 5% less health and damage, and **deaths cost no time**. |
| +5 | **Xal'atath's Bargain:** one of four, rotating weekly. |
| +5 or +6 | Lindormi's Guidance ends. Raider.IO says after +4; Wowhead says it's removed at +6. A tank can still ask Lindormi for **Lindormi's Glow**, which only highlights enemies. |
| +7 | **Fortified** or **Tyrannical**, alternating weekly. |
| +10 | **Both** Fortified and Tyrannical. |
| +12 | **Xal'atath's Guile** replaces the Bargain: **each death costs 15 seconds** (until the last minute). |

- **Fortified:** non-boss enemies have 20% more health and do 20% more damage.
- **Tyrannical:** bosses have 25% more health and do 15% more damage (their minions too).
- **Gear stops getting better at +12.** Above it, players push for rating, Resilient Keystones and achievements (Wowhead).

### The four Bargains (+5 to +11 only)
Each one buffs your group if you handle it, or the enemies (more damage, less damage taken, stacking) if you don't.
| Bargain | What to do | Your reward |
|---|---|---|
| **Ascendant** | About every minute, 10 Orbs of Ascendance spawn in waves of 3, 3 and 4, casting Cosmic Ascension. Stop each cast with a kick, CC, knockback or purge. They have a big shield, so you can't just kill them. | +2% haste and movement speed per orb stopped, 30 s |
| **Voidbound** | A Void Emissary empowers nearby enemies with Dark Prayer. Swap to it, stop its casts, and kill it. | 20% versatility and 30% cooldown rate, 30 s |
| **Pulsar** | Orbs circle each player for 15 s. Walk into someone else's orb; stand close to your group to make it easy. | Mastery and leech, 30 s, stacking |
| **Devour** | A healing absorb on every player for 15 s. Heal through it, or dispel it: any dispel works, including Cloak of Shadows and Stoneform. | Crit and max health, 30 s, stacking |
Sources: Raider.IO "Mythic+ Affixes (Season 2)" and the Wowhead overview. In Flex's logs, the affix IDs on the key start line were 158 (Voidbound) on Oct 25 and 160 (Devour) on Oct 31.

---

## 3. How a key works (checked on Flex's runs)
- **Time it:** finish inside the timer for +1. At **80%** of the timer or less you get **+2**, and at **60%** or less **+3**.
  - Checked on Raider.IO run data: a +12 at 80.3% got +1, one at 69% got +2, and ones at 59.5% to 59.7% got +3.
- **Deaths:**
  - **+12 and up: 15 seconds each.** Measured on Flex's Altar of Fangs +12 (Oct 25): 2 deaths added 31.6 s.
  - **+2 to +4 or +5:** no penalty (Lindormi's Guidance).
  - **+6 to +11:** there's still a penalty, but no source states the number for Midnight, and the +10 keys in Flex's logs had no deaths to measure. Don't state a number.
- **Over time:** the key still counts as a run, but your keystone drops a level.
  - **Resilient Keystone N:** time all 8 dungeons at level N (12 or higher) and your keystone never drops below N for the rest of the season. Flex has timed all 8 at +19, so his key shouldn't drop below 19.
  - You can lower a key on purpose by talking to Lindormi in Silvermoon.
- **Enemy Forces:** kill enough enemies to reach 100% before the last boss dies.
  - Fast runs finish a little over 100%: the typical fast Voidscar +19 ended at 105.7%, and Flex's at 101.9%.
  - Use Mythic Dungeon Tools (MDT) for routes. Raider.IO's top runs show routes too.
- **The log records each key's score:** `CHALLENGE_MODE_END,<map>,<success>,<level>,<time ms>,<points for this run>,<new rating>`.
  - Example: `CHALLENGE_MODE_END,2993,1,12,1161257,378.307159,2599.370850`.
  - This could go on Debrief's Mythic+ tab later.

---

## 4. Rating (score), worked out from Raider.IO's own numbers
- **Your rating is the sum of your best run in each of the 8 dungeons.** A failed or lower run never lowers it (Raider.IO support).
- **From +12 up, each key level is worth 15 points.** A just-timed key is about 365 + 15 × (level − 12):
  | Level | Just timed | At 60% or faster (max) |
  |---|---|---|
  | +12 | ~365 | 380 |
  | +15 | ~410 | 425 |
  | +19 | ~470 | 485 |
  | +20 | ~485 | 500 |
  | +22 | ~515 | 530 |
  | +24 | ~545 | 560 |
- **Speed bonus:** finishing faster adds up to 15 points, rising evenly from 100% of the timer to 60%. That's about 0.375 points per 1% faster.
  - Flex's +19s: 99% of the timer gave 470.5, and 94% gave 472.1.
- **Below +12, the steps are uneven** (affix breakpoints). From Trëèflêx's runs, a +10 at 60% or faster was worth 335.
- **US cutoffs** (Raider.IO, Nov 2, 2026):
  | Mark | Rating |
  |---|---|
  | Keystone Conqueror | 1,500 |
  | Keystone Master | 2,000 |
  | Keystone Hero | 2,500 |
  | Keystone Legend | 3,000 |
  | Keystone Myth (new in 12.1.5) | 3,600 (top ~3%) |
  | Top 10% | 3,280 |
  | Top 1% | 3,774 |
  | Top 0.1% | 4,030 |
- **Flex (Flëxørçïst, Holy Paladin):** 3,770.5, all 8 dungeons timed at +19.
  - He's 4 points from the top 1%: one +20 timed (about +15) gets there.
  - All 8 at +20 would be about 3,880–3,900.
  - Trëèflêx (Resto Druid): 2,950.5.

---

## 5. The meta (Raider.IO, top 100 runs of the season, all +24)
- **Tanks:** Blood Death Knight 81, Guardian Druid 17, Protection Warrior 2.
- **Healers:** Holy Paladin 92, Restoration Shaman 8.
- **DPS:** Subtlety Rogue 97, Arms Warrior 92, Elemental Shaman 90. Then Retribution Paladin 6, Arcane Mage 5, Frost Death Knight 3, Havoc Demon Hunter 2.
- **Group setups:**
  - **Blood DK / Holy Paladin / Arms Warrior / Elemental Shaman / Subtlety Rogue:** 70 of 100.
  - The same with a Guardian Druid tank: 12.
- **Flex's group:** Blood DK / Holy Paladin / Subtlety Rogue / Arms Warrior / Arcane Mage. That's the top setup with Arcane in place of Elemental.
- **Tier lists:** Icy Veins and Murlok agree on Blood DK and Holy Paladin. Their DPS lists move around from week to week; the top-run counts above are the firmer evidence.

---

## 6. Dungeon by dungeon
Boss plans come from each dungeon's Wowhead overview: "Boss Quick Strategy" and "Tips and Tricks". Those guides were updated Aug 27, and Blinding Vale's on Oct 2. Kicks, dispels and dodges are the short form of the must-kick lists, which were checked on Flex's keys. "Oct 13" marks Blizzard's live 12.1.5 tuning.

### Altar of Fangs (30:00)
- **Rav'i:** tank the boss away from the Fresh Meat it drops (Ravenous Stomp).
  - Spread for Triple Shot.
  - Dodge Regurgitate's cone.
  - Soak during Ssscavenging.
- **The Writhing Coil:** kick Toxic Atrophy (three casts in a row).
  - Dodge Burrowing Charge.
  - **Death Rattle: everyone runs away**, or the group wipes.
  - Uncoil splits it into 5 bosses that all take damage: AoE them.
- **Zul'jan:** soak all four beams (Ritual of the Fang).
  - Ritual Venom kills on expiry: soak a line. One Boneslicer soak clears all Ritual Venom stacks.
  - Dodge Axegrinder's glaives.
  - Assign start spots for the soak lines before the pull.
- **Trash:**
  - Click every totem in the first area.
  - Ravenous Descendant's fast attacks are deadly to tanks: a short stun or kite resets them.
  - **CC Evolve** (High Evolutionist).
  - Kill the Empowered High Evolutionist's shield fast.
  - The Ascendant Serpent after boss 2 must die.
- **Kick:** Piercing Hiss, Toxic Atrophy, Mass Envenom.
- **Dispel:** Paralyzing Shots, Regurgitate, Envenom.
- **Purge or soothe:** Ravenous Claws.
- **Oct 13:** many nerfs. Piercing Hiss 25% less damage. Living Venom 25% less health. Ascendant Serpent 21% less health.

### Murder Row (34:00)
- **Kystia Manaheart:** kill the add (Felshield gives the boss damage reduction while it lives).
  - Dispel Corroding Spittle.
  - CC the Mirror Images.
  - Burst during Destabilized: 15% more damage taken.
- **Zaen Bladesorrow:** Killing Spree needs big healing. Spread for Fire Bomb.
  - Use the **first** Fire Bombs to blow up the first Fel Barrel. **Save the second barrel to hide behind** for Murder in a Row.
- **Xanthuux the Annihilator:** kite the boss around the edge (Demonic Rage puddles).
  - Legion Strike is a tank cone.
  - Put the Axe Toss axe in melee.
- **Lithiel Cinderfury:** kite the Infernal (it fixates the tank).
  - Kill the Vilefiend before the ring.
  - Stack close for Fingers of Gul'dan.
  - Take the Gateway through Malefic Wave's ring.
- **Trash:**
  - Fel Crystals in the first area can be handed in for buffs.
  - **Kick Fel Rage**: big damage reduction.
- **Kick:** Fel Missiles, Seduction, Felstorm, Fel Rage, Health Funnel, Chaos Bolt.
- **Dispel:** Corroding Spittle, Heartstop Poison, Curse of Doom. Murder in a Row is a bleed, so normal dispels don't work.
- **Purge or soothe:** Back to Work!

### Den of Nalorakk (32:00)
- **The Hoardmonger:** soak the mushrooms (Spoiled Supplies). Dodge Earthshatter Slam. Mind the Ravenous Bellow knockback.
- **Sentinel of Winter:** stand in the eye of the storm (Frozen Tempest).
  - Dispel Glacial Torment.
  - Kill the adds, then soak where they die (Rimeshatter).
  - Tank it on an add's corpse to stop the push.
- **Nalorakk:** place Echoing Maul at the edge.
  - **Hide behind Zul'jarra's shield** for Overwhelming Onslaught.
  - The tank soaks Forceful Slam.
  - Soak the bears for Fury of the War God.
- **Trash:** pull Spirit of Hunger one at a time. The second area has small lieutenants that are good for count.
- **Kick:** Scavenge, Healing Breeze, Frigid Roar, Winter's Shroud, Arc Lightning.
- **Dispel:** Insatiable Hunger, Toxic Spores, Cryo Surge, Glacial Torment.
- **Purge or soothe:** Mother's Wrath, Bestial Wrath.

### The Blinding Vale (30:00)
- **Lightblossom Trinity:** soak the Lightblossoms by stepping **into** the flower, not in front of it.
  - Spread for Thornblade.
  - Avoid Fan of Thorns.
  - Dodge Lightsower Dash.
- **Ikuzz the Light Hunter:** watch for the Verdant Stomp knockback.
  - Bloodthorn Roots roots everyone: kill the add to free them.
  - **Run** from Bloodthirsty Gaze.
- **Lightwarden Ruia:** spread for Lightfire.
  - Heal Grievous Thrash to full to remove it.
  - Pulverizing Strikes locks onto 3 players: **stand still**, you can't dodge it.
- **Ziekket:** soak the orbs (Lightbloom's Essence). They give a damage buff, but watch the damage you take.
  - Kill the Lightbloom adds.
  - Aim Concentrated Lightbeam at their corpses.
- **Trash:**
  - You can go **left or right**.
  - Break Lightgorged Lashers' shields, because they heal while it's up.
  - Sporeblight Belchers are dangerous.
- **Kick:** Light Bolt Volley (Radiant Spellsower), Light Bolt (Kezkitt), Disorienting Screech, Warden's Wrath, Lightspore Shot.
  - Lightspore Shot comes from about 30 Lashers on Ziekket, about 65 casts a key, so it's mostly spam.
- **Dispel:** Bloodthorn Roots.
- **Oct 13:** Lashers have 10% less health and Lightspore Shot does 16% less damage. Sporeblight Belcher has 11% less health.

### Voidscar Arena (30:00)
- **Taz'Rah:** dodge the other players' Nether Dash lines and the Dark Bloom orbs.
- **Atroxus:** kill the add (Monstrous Roar). Dodge Poison Splash.
- **Charonus:** kite the Gravitic Orbs into a singularity, using pings to pick which one.
  - Dodge Cosmic Crash.
  - Run around the boss for Void Cascade.
- **Trash:**
  - Your first path gives a buff for the whole key: **left = Versatility, right = Mastery**, 3% (permanent since the 12.1 PTR tuning).
  - Tank Brutok facing a wall.
  - Burst the Protective Turtle when its shield drops.
  - Kill whatever a Devouring Brutalizer is trying to devour.
- **Kick:** Demoralizing Shout, Shadowbolt Volley, Violent Sand, Mad Shriek, **Mending Void**.
- **Dispel:** Melt Armor, Corrosive Essence.
- **Purge or soothe:** Bolster.

### Ruby Life Pools (28:00, the shortest timer)
- **Melidrussa Chillworn:** dodge Hailburst's bombs.
  - Stay out of the center for Chillstorm, and don't get knocked into the bombs.
  - Kick Frigid Shard.
  - Break Frost Overload's shield.
- **Kokia Blazehoof:** kill the Ritual of Blazebinding add and kick its Blaze Volley.
  - Dodge Molten Boulder.
  - The tank uses a defensive for Searing Blows.
  - Kite slowly to keep room.
- **Kyrakka and Erkhart Stormvein:** kill the dragon first.
  - Dodge Roaring Firebreath.
  - Stop casting before Interrupting Cloudburst.
  - Drop Inferno Spit at the end.
  - Stormslam: tank defensive, and it's dispellable.
- **Trash:**
  - Most groups pull a lot before the first boss.
  - Defier Draghar must die (27% less health since Oct 13).
  - Primalist Cinderweaver's Living Bomb can now be dispelled (Oct 13).
- **Kick:** Ice Shield, Frigid Shard, Fiery Blast, Blaze Volley.
- **Dispel:** Cold Claws, Rolling Thunder, Stormslam.
- **Purge or soothe:** Blaze of Glory, Stormcloud Barrier.

### Kings' Rest (33:00)
- **The Golden Serpent:** don't let the adds reach the boss (Lucre's Call).
  - Stack the Spit Gold puddles away.
  - Big healing for Serpentine Gust.
  - Tank defensive for Tail Thrash.
- **Mchimba the Embalmer:** free trapped players fast by clicking the right coffin (Entomb).
  - Place Burn Corruption away.
  - Heal the Drain Fluids target.
  - Kick the adds from Awakening Slam.
- **The Council of Tribes:** kill the Explosive Totem fast.
  - Stack for Barrel Through.
  - Kite Debilitating Backhand.
  - Kick **Poison Nova**.
- **Dazar, the First King:** kick Deathly Roar (an AoE fear).
  - Tank defensive for Blade Combo.
  - Avoid the front during Gilded Destruction, when spears drop where you stand.
  - Spread for Quaking Leap.
- **Trash:**
  - You need **every** mob for count.
  - Minion of Zul dies instantly to a purge or a broken shield.
  - The second boss room can be two pulls, one per side.
  - Kill Healing Tide Totems fast in the hallway to boss 3.
  - Shadow of Zul: stay in the soaks.
- **Kick:** Hex Volley, Bind Soul, Unholy Mending, Wretched Discharge, Hex, Poison Nova, Deathly Roar.
- **Dispel:** Lingering Fluid, Putrid Seekers, Savage Maul.
- **Purge or soothe:** Bound by Shadow, Ancestral Fury, Bestial Berserk, Captain's Bulwark, Unholy Mending.

### Temple of Sethraliss (32:00)
- **Adderis and Aspix:** don't get pushed too far by Gale Force.
  - **Watch your knockback, because a group soak follows** (Thunder and Lightning: stack, then run out).
  - Swap targets when Storm Blessed is up.
  - Drop Tempest Winds away.
- **Merektha:** break A Knot of Snakes with CC. A blue arrow shows who gets stunned, so group up for AoE CC.
  - Keep moving during Thunder Spit.
  - Kill the hatchlings.
  - Dodge Burrow, which now has an arrow.
- **Galvazzt:** soak the Lightning Spire beams. Move the boss out of Induction.
- **Avatar of Sethraliss:** **DPS** soak the purple Corrupted Lifeforce zones within 4.5 s, because the debuff lowers healing.
  - Drop Latent Hex away (it prefers the healer).
  - Don't heal the boss (Defiling Taint).
  - The faster you AoE the adds in the healing phase, the more spawn.
- **Trash:**
  - You need a fair amount of extra trash for count.
  - Sand-Sworn Riders are deadly.
  - CC Temple Disruptors so the Eye of Sethraliss orb follows you.
- **Kick:** Poisoned Cheap Shot, Addle Mind, Poison Spit, Essence Disruption, Flame Shock.
- **Dispel:** Cytotoxin, Imbued Conduction.
- **Purge or soothe:** Accumulate Charge.

---

## 7. Checklists

### Before the key
- [ ] **Check the affixes.** At +5 to +11, which Bargain is up this week, and who handles it: kickers for Ascendant, dispels for Devour, swaps for Voidbound, stacking for Pulsar. At +7 to +9, is it Fortified or Tyrannical? From +10 it's both.
- [ ] **Load the route** in MDT. Aim to finish 100% with a little to spare: fast runs end at 101–106%.
- [ ] **Assign kicks** for each must-kick in this dungeon. Healers have no kick except Restoration Shaman. Plan CC for casts you can't kick, like Evolve and A Knot of Snakes.
- [ ] **Plan Lust:**
  - Your biggest pulls, or the hardest boss on Tyrannical.
  - Raider.IO's Mythic+ Heatmaps show where top groups Lust.
- [ ] **Plan defensives** for the known big hits: Killing Spree, Serpentine Gust, Overwhelming Onslaught, Death Rattle.
- [ ] **Consumables:** flask, food, potions, Healthstones and weapon buffs.
- [ ] **Path choices:** Voidscar left (Versatility) or right (Mastery). Blinding Vale left or right.

### During the key
- [ ] **Don't die.** From +12, every death is 15 seconds.
- [ ] **Kick the list**, then CC and stuns.
- [ ] **Stand less between pulls.** On the Voidscar +19, Flex's group stood 1:48 between pulls and the typical fast run 1:05.
- [ ] **Pull bigger where it's safe.** Fewer, bigger pulls are where fast runs save the most time.
- [ ] **Lust the big pulls**, not a small one.
- [ ] **Handle the Bargain every time** it shows up (+5 to +11).

### After the key (Debrief's Mythic+ tab)
- [ ] Read **"Where your time went"** or **"What gets you +N"**.
- [ ] Look at the stretch with the biggest gap: more pulls, longer trash, a slow boss, or standing.
- [ ] Check **casts that went off with a kick ready**, and whose kick it was.
- [ ] Check deaths: what killed each player, and whether they used a defensive.

---

## 8. What Flex's own +19s say (Debrief's Mythic+ tab)
| Key | Behind a typical fast run | Biggest piece |
|---|---|---|
| Voidscar Arena +19 | 5:28 | Trash between Atroxus and Charonus (+2:39; 4 pulls there against their 1) |
| Den of Nalorakk +19 | 7:26 | Trash between The Hoardmonger and Sentinel of Winter (+3:06) |
| Blinding Vale +19 | 6:30 | Trash between Lightwarden Ruia and Ziekket (+2:39) and Ziekket (+0:51) |

- In every key, most of the gap is **trash pace** (fighting time), not deaths.
- **Next rating step:** a +20 timed in any dungeon. Flex is 4 points from the top 1%.

---

## Sources (read Nov 1–2, 2026)
- Wowhead: Mythic+ Overview, Midnight Season 2 (updated Sep 29): https://www.wowhead.com/guide/midnight/mythic-plus-season-overview
- Wowhead dungeon overviews (Boss Quick Strategy and Tips), one per dungeon, linked from the overview.
- Icy Veins: Final(?) Mythic+ Tuning on the 12.1 PTR, All 8 Dungeons: https://www.icy-veins.com/wow/news/timer-reductions-and-more-final-mythic-tuning-on-the-12-1-ptr-all-8-dungeons/
- Blizzard: Dungeon and Raid Tuning, October 13: https://us.forums.blizzard.com/en/wow/t/dungeon-and-raid-tuning-october-13/2380514
- Icy Veins: Midnight 12.1.5 Weekly Hotfix Summary, October 20–26 (Mistcrests uncapped): https://www.icy-veins.com/wow/news/the-uncapping-many-labyrinth-improvements-item-changes-midnight-12-1-5-weekly-hotfix-summary-october-20-26/
- Blizzard: 12.1.5 Content Update Notes: https://news.blizzard.com/en-us/article/24304162/12-1-5-content-update-notes
- Raider.IO: Mythic+ Affixes (Season 2): https://raider.io/news/740-midnight-mythic-plus-affixes
- Raider.IO API (live): season static data, top runs, season cutoffs, character profiles.
- Raider.IO support: "Will my character's Mythic+ score go down…": https://support.raider.io/kb/frequently-asked-questions/will-my-characters-mythic-plus-score-go-down-if-i-fail-a-timer-or-run-a-lower-key
- Icy Veins tier lists (healer, tank) and Murlok: used only as a cross-check of the Raider.IO counts.
- Flex's logs: `RaiderIOLogsArchive/WoWCombatLog-102526_113513.txt` (Altar of Fangs +10 and +12, Oct 25) and `-103126_172918.txt` (Blinding Vale +10, Oct 31).
