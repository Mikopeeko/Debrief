# Entombed Sentinels (Mythic): research notes

Sources: the YouTube Mythic guide (AhTTglo8T2E, transcript), the Method Mythic and Heroic guides, and the Mythic Trap Mythic page.
These notes may name sources; the app's text stays neutral.

## Fight shape
- Council: Breath of Ula'tek (green / acid) and Blood of Ula'tek (red / blood). Raid split into two equal groups, one per boss (spread cleavers split across both).
- Bosses must be 40+ yd apart or they take 99% less damage.
- Each boss puts its own stacking 40 s DoT on everyone within 40 yd (Mark of Acid / Mark of Blood). Be in range of only one boss. Multi-dot cleavers should out-range one boss while still hitting both; keep that greed short.
- Vitriolic Stasis at 100 energy: both run to the middle, 99% damage reduction for ~30 s, and the weaker one heals up to match the other. Balance their health by swapping players around, not by stopping damage.
- After every intermission, tanks and groups swap sides so the old stacks drop.
- Lust on pull. 4 intermissions; after the 4th, don't hit the new green add: the enrage is near.
- The first cycle is shorter than the rest.

## Green boss (Breath of Ula'tek)
- **Venom Coagulation**: an add baited near random players. Spawn it ahead of the group so it doesn't land in blood. It pulses raid damage (Contaminate) while alive. The 1st add of a cycle is cleaved; the **2nd must die before the intermission** (it spawns right before it). Red-side ranged can help.
- **Toxic Droplets**: orbs to step on before they explode (raid-wide). Each pickup hits hard and leaves a DoT. On Mythic, **two at once can kill** you if you're not at full health; tanks take a lot of them. On the hard sets (just before the intermission, or droplets in a Blood Venom puddle) use **mobile immunities** (Turtle, Divine Shield, Cloak). After the soak, "daggers"/frontal lines fire back into the boss: **dodge them** (on Mythic they kill outright).
- **Living Venom**: lines that go out and return to the boss; dodge both ways.
- **Empowering Slam**: tank hit that ramps on the same target; resets via the intermission tank swap.

## Red boss (Blood of Ula'tek)
- **Blighted Blood**: dispellable DoT. Dispel as soon as possible (it hurts). If it expires, it drops a Blood Venom puddle.
- **Unstable Miasma**: a soak on a random player. On Mythic at least **8 players** soak; fewer means more stacks each and bigger puddles, and too few kills. Place it far back in a corner. Soakers get Blood Venom stacks and then line up on the back wall, spanning half the room, to drop their puddles, and move out.
- **Blood Venom**: puddles; keep them on the edges / a set pattern. A messy floor turns other mistakes into wipes. Ideally most of the room is still free after the 2nd intermission.
- **Bloodvenom Injection**: tank hit plus a stacking DoT. After each intermission the tank who leaves red has a short debuff that drops a big puddle on expiry: drop it in old blood. Meanwhile the green group baits the add forward.
- The red side also gets some of the green soaks from the other side.

## Mythic only
- **Shifting Protovenom**: 8 players get an orange circle. Circle touching circle clears harmlessly. Circle touching a non-circle player triggers **Protovenom Eruption** (damage and a big knockback for both, possibly a wipe), and you still have to clear after. Everyone, tanks and melee included, **pre-spreads** before it. You may need to cross to the other group to find a partner.

## Intermission: Helical Toxins
- Everyone gets 4 orbs (red and green); debuff stacks = green orbs. Pair with exactly one player so the greens add up to 4 (1+3, 2+2). 30 s to solve.
- On Mythic, the counts are hidden after a few seconds. Systems differ between guides (both are fine; pairs are 1+3 and 2+2):
  - Video: 1 green = ping and jump; 2 = go under the boss; 3 = find a pinging, jumping player.
  - Method: 3 green = stand still and ping yourself; 1 = hunt the pingers; 2 = meet between the bosses.
- Wrong pairing: **Cultivated Burst** (massive damage, a big DoT and a huge red puddle). Send failed players to a far corner, and don't keep bumping (bumping grows the pool). An immunity survives it.
- The bosses heal during the game: don't rush, but slow solving costs DPS.

## What the log shows (Wolfthorn Mythic pulls: kill rdFvKLXyRPtBHDhn #35, wipes ZPtnCrND6chxLAmJ)
- Bosses: Breath of Ula'tek 258557 (green), Blood of Ula'tek 258558 (red); add Venom Coagulation 260766.
- Marks: Mark of Acid 1284500 (debuff, stacks) from Breath, Mark of Blood 1284506 from Blood (boss auras 1284494 / 1284503).
- Green: Toxic Droplets cast 1284434, pickup hit 1284451 · Venom Coagulation cast 1284251, add pulses Contaminate 1284258 · Living Venom hits 1284209 (the "daggers") · Empowering Slam 1284458.
- Red: Blighted Blood cast 1284483, debuff/DoT 1284471 · Unstable Miasma cast 1288232, target debuff 1288260, soak hit 1288282 · Blood Venom 1284210 (debuff, then a puddle) · Bloodvenom Injection cast 1284487, debuff 1284491, DoT 1310126 · Clinging Murk 1288297 / 1303097 (a debuff and damage: probably standing in a puddle, to confirm).
- Mythic: Shifting Protovenom cast 1296878 (by an NPC named Vashnik), circle debuff 1296880 on 8 players (two batches of 4), pulse 1296882 every 2 s on each circle player until cleared (150–190k). Two circles touching remove both debuffs at the same moment. Protovenom Eruption 1296962 = a circle touching a non-circle player.
- Intermission: Vitriolic Stasis 1284588 / 1284606 (boss buffs), heal 1284635 (the weaker boss healed). Helical Toxins 1284590 on everyone: **the starting orb count isn't in the log**. A right pair: both debuffs come off at the same moment. A wrong bump: both players' stacks change to the sum (e.g. "st3" on both). The debuff ticks 1284813 while unsolved. At the end (~28 s), anyone still holding it takes Cultivated Burst 1284941 (hit), then 1284947 (debuff; dies when it ends), and 1284948 (the pool's damage).

## Sizes
- Protovenom Eruption: 10 yd blast (published). Unstable Miasma soak: 7.5 yd (published).
- Shifting Protovenom circle: **not published** (area trigger 43109; the spell's "Mod Size 25%" only scales the player model). Measured on 30 Mythic pulls:
  - two circles clear when their players are about 6 yd apart (482 clears; p90 5.2–6.2 at any time since it landed, so it doesn't grow or shrink);
  - a circle erupts on a player without one at about the same distance (the nearest such player just before the blast: median 7.0, mostly 5–8.5 yd).
  - So the circle is **about 6 yd around its player**, and touching means another player stepping inside it. Protovenom Eruption's published 10 yd is the blast, not the circle. (Drawn at 3 yd first, assuming two small circles meeting; briefly 10 yd; the user settled on 6.)
  - It does nothing for about the first 1.5 s: players already next to each other still clear at about 1.6 s.
- Clinging Murk is **not** a pool: it lands on every Unstable Miasma soaker at the soak. The pool's own damage is Blood Venom 1284208.

## Thresholds that are my call (not from a guide)
- Shifting Protovenom: amber when a circle took over 6 s to clear (3 pulses).
- Toxic Droplets: "two at once" = two damaging pickups within 0.5 s.
- Blighted Blood: amber when on over 5 s ("as soon as possible" in the guides).
- Marks: amber at 3+ stacks of the other boss's Mark in a cycle, red at 6+ (counted from 8 s after each intermission).
- Boss balance: amber at a 5+ point gap going into an intermission; red when within 40 yd for 3+ s outside the intermissions.

## Sequence (video)
- Pull: red soaks and drops the first blood line on the back wall; green kills the add in lust.
- Then green soaks on both sides (dodge the daggers), then Shifting Protovenom (pre-spread, bump circles), then spread for the math game.
- End of each later cycle: Protovenom, then high-damage soaks, then straight into the math game. Immunities on those soaks.
