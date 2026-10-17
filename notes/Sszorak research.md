# Sszorak (Mythic): research notes

Sources: the Method Mythic and Heroic guides, the Mythic Trap Mythic page, and the Wowhead guide (spell IDs from its journal links).
These notes may name sources; the app's text stays neutral.

## Fight shape
- One boss on a loop: **Apex Predator** (the tank combo), **Venomous Surge**, **Raging Crosswinds**; twice, then **Dig In** at 100 energy (the intermission). Repeat.
- Apex Predator: five casts in random order: two **Ravage**, two **Mutilate**, one **Tempest**, all aimed at the current tank.
  - Ravage: tank frontal, a huge hit plus a vulnerability debuff (Heroic +400%, Mythic +600%) for 25 s. Tanks taunt between the two of each combo and take them at the edge.
  - Mutilate: soak frontal, split by everyone in it; fewer than 5 is lethal. Mutilated Gash (22 s) makes the next Mutilate hit that player 500% harder, so two groups alternate.
  - Tempest: tornadoes roam out from the boss. Big hit plus a stacking DoT. On Mythic one of the two biggest wipe causes.
- Venomous Surge: two players get a 10 s DoT; when it ends the raid takes a falloff hit and a **Viscous Cyst** drops there. Four cysts before each intermission.
- Caustic Claws: splashes around the boss during the Surge, leaving Caustic Residue puddles. The tank moves the boss to clean ground.
- Raging Crosswinds: marked players get an arrow; after a short delay each is launched that way. Point your arrow at another marked player and collide in the air (right angles work too). Missing means drifting toward the edge. Immunities stop your own launch but can strand your partner.
- Intermission (Dig In, 25 s, the boss takes +30%): three winds blow from the tunnels in order (the orbs above a tunnel show it: 1, 2, 3). The raid stacks in the middle; each wind pushes the stack into the cyst opposite its tunnel, which pops, knocks everyone back and coats them against the wind. After the third, pop the spare together (a mobile player). Cysts pop on their own after 2 minutes.
- Lust on pull.

## Mythic only
- **Serpent's Fury**: one player (the furthest from the boss) gets a big red circle while the boss builds rage. At 100 he enrages (Unbound Ferocity) and the raid dies. 14 players stacking in the circle pop it (To the Slaughter) and reset his rage.
  - Each combo ends with one pop. After the pull or an intermission: right as the tank combo ends (pre-stack if Ravage is last). Before an intermission: a few seconds after the combo. Popping that one even 2 s early makes the first pop after the intermission impossible.
  - It can't pop during Dig In: the marked player stacks once Dig In starts and leaves after the third wind.
  - It doesn't have to be exact before the third intermission (the enrage comes after it anyway).
- **Virulence**: everyone in a pop gets it; it bursts 5 s later in four lines, and anyone clipped takes a big hit and gets it again with longer lines. Spread right away; speed boosts; a personal every other set.
- Raging Crosswinds has four directions on Mythic.
- The two biggest wipe causes: tornado deaths and failed Fury pops.

## What the log shows (Wolfthorn Mythic pulls: kill PJk3Awpzg7HBVaGN #46, wipes PJk3 and GPrb9t4Xn7qKfCdR)
- Casts (success): Ravage 1277002 (also 1277101), Mutilate 1277027 (also 1277031), Tempest 1287072 (a ~3.5 s cast), Venomous Surge 1305959, Raging Crosswinds 1285419, Dig In 1286033 (also the boss's 25 s aura). Each Apex set is 5 casts over ~20 s; Dig In at ~1:40 and ~3:47 on the kill.
- **Rage** is on every boss cast (power type 3, max 100): ~40 at 0:08, climbing ~1.8 to 1.9 a second, back to ~5 after a pop, flat during Dig In. The translator now writes an NPC's power into the advanced block (it wrote zeros before), and the parser keeps it on module cast events (`pw`, `pwMax`).
- Ravage hit 1277101, debuff 1277105 (25 s). Mutilate hit 1285999 (~330k each with 9 to 10 soakers), Mutilated Gash 1277051 (aura) and 1285998 (ticks).
- Tempest 1287083: the touch and its stacking DoT share the ID. Tornadoes come out as the cast starts and roam about 30 s; one pass can log 2 to 3 stacks a moment apart (merged within 2 s).
- Venomous Surge debuff 1305963 (10 s) on two players; ticks 1306120; the raid hit at the end 1312156.
- Viscous Cyst 1287205: the pop's hit (~190k plus two ~35k ticks) and the coat (~5 s) on nearly the whole raid. Someone runs to the cyst to pop it: the popper is within ~5 yd of where the cyst dropped (the Surge player's spot when it ended); the raid's centre can be 40 yd away.
- Winds (Howling Maelstrom) aren't logged; on the kill the pops came at Dig In +3, +11.4 and +20 s. A death with no killing blow during Dig In is a player blown off.
- Raging Crosswinds: four arrow debuffs 1285425, 1285453, 1297096, 1297111 (two players each; it ticks 1312219). After ~8 s the arrow goes and Turbulent Gusts 1285447 lands (the launch). Collided pairs lose Gusts together within ~1 s; a drift keeps it ~5 to 6 s; an immunity means no Gusts. A flying player hitting someone: 1285616 (273k) plus Gusts on them.
- Serpent's Fury 1305621 on the marked player. A pop = the mark coming off with Virulence 1297707 / 1299899 on the soakers (15 on the kill, alternating IDs). When a holder dies the mark passes on in the same instant (not a pop).
- Unbound Ferocity 1296898 (boss aura) = the enrage; Mutilated Gash ticks then kill the raid.
- Virulence burst 1300089 (833k on Mythic): when Virulence ends, 5 s after the pop, or at once if its carrier dies (pull 26: a carrier died 1.2 s after the pop and 10 were clipped). Ticks 1312189.

## Raging Crosswinds directions
- The four arrow debuffs have the same name and tooltip, but each direction is its own spell ID. Measured from drifting players on 6 Mythic pulls (124 launches), in map space (east = 0°, counterclockwise):
  - 1285425: ~73° (north); 1285453: ~253° (south), its opposite;
  - 1297111: ~163° (west); 1297096: ~343° (east), its opposite.
  - The two axes are at right angles, about 17° off the compass (fixed to the room). On the kill, Dashtoswirly drifted 65 yd at 164° on a 163° arrow, and Shockabunga 61 yd at 68° on a 73° arrow. Two drifters moved against their arrow (likely gripped back).
- In `SZ_CW` (engine.js); the map draws each arrow, and the rows say "arrow north".

## Wolfthorn's NSRT note (raw data: what the raid plans, not a strategy source)
- Mutilate Soaks: Left (9) / Right (9). On the kill each Mutilate was soaked by exactly one group, alternating; Huservoker (Left) soaked none of the 6.
- Intermission Orb Popper: Volkovod, Schooty, Urgdragon (reminders at each Dig In).
- Virulence trigger: Volkovod, Schooty; "Trigger Virulence" reminders at 0:25.5, 1:15.5, 2:32.5, 3:22.5, 4:39.5, 5:26.6 = the Fury pop timer. The kill's pops were all within 0.7 s of it. Across the 41 Oct 1 pulls, every pre-intermission pop 2.5 to 3.8 s early ended in an enrage after the intermission (pulls 4, 12, 15, 22, 29), and one 4.7 s late enraged on the spot (pull 3).

## Sizes and timings
- Mutilate needs 5 soakers (guides). Fury needs 14 (guides). Virulence lasts 5 s (tooltip).
- The Fury window is tight. On the kill the pre-intermission pops came +4.3 s and +3.2 s after the combo at ~94 and ~93 rage, 2 to 3 s from the enrage. On wipe 17 one popped +0.2 s after the combo, and the first pop after that intermission was 2.5 s short.

## Thresholds that are my call (not from a guide)
- Tempest: amber on one touch, red on two or more in one Tempest (touches within 2 s are one).
- Raging Crosswinds: drifted = Turbulent Gusts on for more than 2.5 s (amber); a flying player hitting someone (amber).
- Serpent's Fury: amber if popped within 3 s of Dig In ending.
- Caustic Claws: amber on 1 hit, red on 2. Caustic Residue: amber at 5 touches, red at 10 (the rule pack: Low, Medium from 8).
- Virulence: a 0-damage clip is an immunity and isn't flagged.

## Not checked yet
- Cyst placement against the tunnels: the tunnel order isn't in the log, so the module checks the outcome (a cyst per wind, who was coated, who died), not where each was placed.
- Who popped each cyst is the player nearest it as it popped (within ~5 yd on the kill): shown next to the note's poppers, not judged.
- Fury timer thresholds (my call): the pre-intermission pop more than 1.5 s early, or any pop more than 3 s late, is amber.
