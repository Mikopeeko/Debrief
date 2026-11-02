# Mythic+ must-kick lists (Season 2, patch 12.1.5)

From each dungeon's Wowhead overview: the "Important interrupts and dispels" table and the boss quick strategy. All guides were by iMX3,
updated Aug 27 (Blinding Vale Oct 2). Read Nov 1 for the run recap (companion/mplus.js `MPLUS_LISTS`).
T# means trash before boss #, B# means boss #, and * means dispel only after a failed mechanic.
"Seen" means the spell shows up in your keys (Oct 4 to 31).

## What the check on your keys found (Nov 1)
- **Keys checked:**
  - Kings' Rest +12
  - Altar of Fangs +10 and +12
  - Ruby Life Pools +12
  - Den of Nalorakk +20 (left after 4 pulls)
  - Temple of Sethraliss +12 and +20 (left after 1 pull)
  - Murder Row +12 (Oct 4 and 8), The Blinding Vale +12 and +10 (Oct 24 and 31), Voidscar Arena +12 (Oct 24): found by date on
    Raider.IO and read from those days' logs.
- **The last three dungeons (checked later on Nov 1):**
  - Every must-kick, dispel and purge name is in the logs.
  - Fel Missiles, Felstorm (Murder Row) and Mending Void (Voidscar Arena) are channels.
  - Light Bolt counts only from Kezkitt, the guide's boss. The Radiant Spellsower trash casts a Light Bolt of the same name three times as often; the trash kick there is Light Bolt Volley.
  - Murder in a Row is a bleed, which ordinary dispels can't remove (41 on players over two keys, none removed), so it's off the dispel list.
  - Cosmic Crash, Dark Bloom and Demonic Rage hit every player on each cast, about 5 direct hits a cast, like Hailburst. They're left out of avoidable damage.
  - Nether Dash counts only its direct hits (about 1 a cast); its 230 damage-over-time ticks don't count.
  - Nether Dash aims a line at every player (Wowhead: "Dodge Other Lines. Targets each player with a line attack."), so each player's first hit in a cast is their own line and isn't avoidable. Only a second hit within 8 seconds (someone else's line) counts (Nov 1, Flex: "its being marked as avoidable").
- **Fair count (Nov 1, the Design studio's scan of 33 of Flex's keys; Flex: "yes send that"):** a must-kick that went off is charged to one ready kick (the one that sat ready longest), which then counts as used for its cooldown, so a burst can't blame more casts than there were kicks. A **kick when you can** tier (8 or more enemies, or 6 or more casts within 10 seconds) is built but switched off (SPAM_ON in mplus.js): it would have filed Kings' Rest's Wretched Discharge, 3.0m damage to the group a cast, as optional. A danger level per spell from the Design studio replaces it. Essence Disruption is listed but unconfirmed (never seen cast in 9 Temple keys), so it isn't counted.
- **Must-kicks:** every one is in the logs except:
  - Den of Nalorakk's Scavenge, Frigid Roar, Winter's Shroud and Arc Lightning (that key ended after the first boss)
  - Temple's Essence Disruption
- **Envenom** (High Evolutionist) is a dispel, not a kick. The first version counted it as "got through" 17 times on the +10.
- **Evolve** shows only as cast. When nobody stops it, the High Evolutionist gains **Evolved**, so the recap counts Evolved. It got through 4 of 17 times across both Altar keys.
- **Channels** show only when they start: Ice Shield, Health Funnel and Essence Disruption. A kick or CC within a few seconds counts as stopped.
- **Left out after checking:**
  - **Hailburst** hits everyone on each cast (18 hits from 4 casts with 5 players).
  - **Spit Gold** is a damage-over-time, not something to dodge.
  - **Gilded Destruction** counts only its direct hits: 128 of its 137 hits were the damage-over-time it leaves.
- **Tanks:** avoidable damage never counts against a tank (they may stand in a frontal on purpose).
- **Leaving a key:** the recap stops when the group leaves the dungeon. A +20 left early had run on into an hour of other dungeons.

## Altar of Fangs
- **Kick:**
  - Piercing Hiss (Primal Serpent, T1)
  - Toxic Atrophy (The Writhing Coil, B2: three in a row)
  - Mass Envenom (Ula'tek's Chosen, T3)
- **Stop with CC:** Evolve (High Evolutionist)
- **Dispel:**
  - Paralyzing Shots (Twinfang Harrower)
  - Regurgitate (Rav'i)
  - Envenom (High Evolutionist): dispel it, not a kick
  - Mass Envenom* (Ula'tek's Chosen)
- **Purge or soothe:** Ravenous Claws (Ravenous Descendant)
- **Dodge:**
  - Regurgitate (Rav'i's cone)
  - Burrowing Charge (The Writhing Coil)
  - Axegrinder (Zul'jan)

## Murder Row
- **Kick:**
  - Fel Missiles (Felonious Mage)
  - Seduction (Seductive Sayaad)
  - Felstorm (Kystia Manaheart)
  - Fel Rage (Wrathguard Flayer: big damage reduction)
  - Health Funnel (Fel Invoker)
  - Chaos Bolt (Lithiel Cinderfury)
- **Dispel:**
  - Seduction*
  - Corroding Spittle (Massive Felwyrm, Kystia)
  - Heartstop Poison (Zaen)
  - Murder in a Row (Zaen)
  - Curse of Doom (Corrupted Warlock)
- **Purge or soothe:**
  - Back to Work! (Keen Taskmaster)
  - Fel Rage* (Wrathguard Flayer)
- **Dodge:** Legion Strike (tank cone), Demonic Rage puddles

## Den of Nalorakk
- **Kick:**
  - Scavenge (Keen-Eyed Striker)
  - Healing Breeze (Earthwhisper Tender)
  - Frigid Roar (Frigid Mauler)
  - Winter's Shroud (Sentinel of Winter)
  - Arc Lightning (Stormbound Mystic)
- **Dispel:**
  - Insatiable Hunger (Spirit of Hunger)
  - Toxic Spores (The Hoardmonger)
  - Cryo Surge (Glacial Revenant)
  - Glacial Torment (Sentinel of Winter)
- **Purge or soothe:**
  - Healing Breeze*
  - Mother's Wrath (Territorial Matriarch)
  - Bestial Wrath (Bonded Beasttamer)
- **Dodge:** Earthshatter Slam (The Hoardmonger's cone)

## The Blinding Vale
- **Kick:**
  - Light Bolt Volley (Radiant Spellsower)
  - Light Bolt (Kezkitt)
  - Disorienting Screech (Lightfeather Petalwing)
  - Warden's Wrath (Lightwarden Ruia)
  - Lightspore Shot (Ziekket)
- **Dispel:** Bloodthorn Roots (Ikuzz the Light Hunter)
- **Dodge:** Lightsower Dash, Fan of Thorns

## Voidscar Arena
- **Kick:**
  - Demoralizing Shout (Dominated Brawler)
  - Shadowbolt Volley (Voidtouched Magi)
  - Violent Sand (Angry Krolusk)
  - Mad Shriek (Killvore Screamer)
  - Mending Void (Voidminder)
- **Dispel:**
  - Melt Armor (Sycophantic Tarasek)
  - Corrosive Essence (Agitated Voidscythe)
  - Mind-Numbing Poison* (Atroxus)
- **Purge or soothe:** Bolster (Longtooth Tuskarr)
- **Dodge:**
  - Nether Dash, Dark Bloom (Taz'Rah)
  - Poison Splash (Atroxus)
  - Unstable Singularity, Cosmic Crash (Charonus)

## Ruby Life Pools
- **Kick:**
  - Ice Shield (Flashfrost Chillweaver)
  - Frigid Shard (Melidrussa Chillworn)
  - Fiery Blast (Blazebound Destroyer)
  - Blaze Volley (Kokia Blazehoof's add)
- **Dispel:**
  - Cold Claws (Infused Whelp)
  - Rolling Thunder (Thunderhead)
  - Stormslam (Erkhart Stormvein)
- **Purge or soothe:**
  - Blaze of Glory (Ashseer Flamelasher)
  - Stormcloud Barrier (Primal Thundercloud)
- **Dodge:**
  - Hailburst (Melidrussa): left out, it hits everyone
  - Molten Boulder (Kokia)
  - Roaring Firebreath (Kyrakka)

## Kings' Rest
- **Kick:**
  - Hex Volley (Risen Hexer)
  - Bind Soul (Queen Wasi)
  - Unholy Mending (Seneschal M'bara)
  - Wretched Discharge (Half-Finished Mummy)
  - Hex (Phantom Hex Priest)
  - Poison Nova (Zanazal the Wise)
  - Deathly Roar (Dazar, the First King's Reban: AoE fear)
- **Dispel:**
  - Pit of Despair* (Minion of Zul)
  - Lingering Fluid, Putrid Seekers (Embalming Fluid)
  - Hex* (Phantom Hex Priest)
  - Savage Maul (T'zala)
- **Purge or soothe:**
  - Bound by Shadow (Minion of Zul: a purge kills it)
  - Ancestral Fury (Shadow-Borne Champion)
  - Bestial Berserk (Queen Patlaa)
  - Captain's Bulwark (Guard Captain Atu)
  - Unholy Mending (Seneschal M'bara)
- **Dodge:** Gilded Destruction (Dazar's frontal), Spit Gold puddles

## Temple of Sethraliss
- **Kick:**
  - Poisoned Cheap Shot (Shrouded Fang)
  - Addle Mind (Faithless Subjugator)
  - Poison Spit (Merektha)
  - Essence Disruption (Temple Disruptor; CC also works)
  - Flame Shock (Twisted Hexxer)
- **Dispel:**
  - Poisoned Cheap Shot*
  - Cytotoxin (Poisonous Viper)
  - Addle Mind*
  - Poison Spit*
  - Imbued Conduction (Imbued Stormcaller)
- **Purge or soothe:** Accumulate Charge (Agitated Nimbus)
- **Dodge:** Burrow (Merektha)

## Trash you can dodge (Nov 1)
The guides list boss mechanics only, so trash came from your keys. I looked for enemy spells that hit only some of the group, weren't aimed at a player, and weren't mostly on the tank, then read each spell's Wowhead text.

**Counted:**
- Suppression Slam (Kings' Rest, Animated Guardian): a frontal cone that stuns.
- Septic Spatter (Altar of Fangs, Venom Leech): the pools left when the leech pops.
- Flame Breath (Ruby Life Pools, Flamegullet): a frontal cone.
- Rotten Ground (Den of Nalorakk, Thornclaw Gatherer): a puddle. One hit each time someone steps in and it ticks on them; stepping out within a second doesn't count.

**Left out:**
- **Aimed at a player:** Laced Edge (teleports behind a player), Arrow Barrage, Slither Strike, Serrated Charge, Lightning Torrent, the bolts.
- **Hits everyone:** Rattle, Toxic Surge, Venom Burst, Thunderous Stomp, Caustic Stomp, Release Charge.
- **On the tank:** Ravenous Claws, Duostrike.
- **Unclear who could have moved:** Spark Step, Stormcloud Detonation, Dark Revelation, Infest. The chosen player is hit either way.

**Murder Row, The Blinding Vale and Voidscar Arena trash (Nov 1, the same way):**
- **Counted:**
  - Lightmaw Beams (Vale, light beamed at a spot)
  - Belch Spores (Vale, spores where they land)
  - Lightwarden's Blight (Vale, the beetle explodes when it dies)
  - Void Beam (Voidscar, a beam at a spot)
- **Left out:**
  - Searing Magma (the totem hits everyone: kill it)
  - Dimensional Shred and Glaive Toss (aimed at a player)
  - Sky Strike (shared damage)
  - Spiny Shield (it hurts whoever attacks the beetle)
  - Burning Fel (everyone)
- **Murder Row:** nothing new to dodge on trash.

**One hit per stay (Nov 1):** beams, breaths and pools that hit every second while you stand in them count as one hit until you've been out of them for 1.6 seconds; the damage still adds up. Lightmaw Beams went from 33 to 56 "hits" a key down to 10, Flame Breath from 4 to 1.
