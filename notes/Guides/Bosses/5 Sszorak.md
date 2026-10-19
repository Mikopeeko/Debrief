# Sszorak (Venomous Abyss boss 5)

Read Oct 19 2026: Wowhead cheat sheet + journal, Icy Veins, Mythic Trap, Tactyks Mythic video (6W-CujtcHUQ). Older notes (log IDs, rage timings, measured wind directions, Wolfthorn's NSRT): `notes/Sszorak research.md`. Encounter ID 3420.
Fight style: single target. Lust on pull. The platform has wind tunnels; the boss loops tank combo → Venomous Surge → Raging Crosswinds (twice), then the **Dig In** intermission at 100 energy (~1:42, ~3:47); enrage ~6:20 (Tactyks).

## Mechanics and solutions
- **Read the winds on pull** (and after each intermission): the tunnels show 1-3 wind motes = the order the Howling Maelstrom will push the raid. Put raid markers **opposite** each tunnel for the cysts (NSRT has a wind-helper: the raid leader clicks marker macros and players see their drop spot; group must be ≤20 players for the macros).
- **Apex Predator#1277025** (tank combo, 5 casts, random order but Tempest never first/last): 2× **Ravage#1277002** (frontal, huge hit + big Ravage vulnerability → point it **away**, tank alone, defensive), 2× **Mutilate#1277027** (frontal soak split among ≥5; Mutilated Gash +500% to the next Mutilate → point it **at the raid**),
  1× **Tempest#1287072** (tornadoes). Tanks: each takes one Ravage and one Mutilate — taunt after the first Ravage/Mutilate (Icy Veins math: 18 combos, always a Tempest gap to reset taunt). Heroic+: **two Mutilate soak groups** alternate (a Blood DK can solo-soak with Vampiric Blood + AMS).
  **Corroding Venom#1282869**: +3% physical per melee → swap ~6 stacks (lines up with combo swaps). Tactyks: their Blood DK tanked ~90% of the fight; paladin/brewmaster pairs should swap more.
- **Tempest tornadoes** kill non-tanks (sometimes one-shot) — the #1 killer. Call them when they pass through the boss; leave a big pocket for melee; step off rather than greed.
- **Venomous Surge#1305959**: 2 players get a DoT; on expiry a falloff raid hit and a **Viscous Cyst** drops there (lasts 2 min; touching it pops it: knockback + slow "coat" that makes you stick to the ground). Drop each at its assigned marker (one per marker), away from the boss so nobody pops it early.
  Heroic+: **Caustic Claws#1305998** puddles (Caustic Residue: +30% damage taken) → tank toward an edge where the winds will blow them off.
- **Raging Crosswinds#1285419**: marked players get an arrow and are launched that way after ~8 s. Pair with someone whose arrow points **at you** and you cancel in the air. Mythic: four directions (right angles also collide). Immunities/movement cancels (most classes) stop your own launch.
  Priests and Paladins mostly can't cancel → they use the self-ping macro so others line up with them (Dracthyr Priests can). Evoker Rescue helps.
- **Dig In / Howling Maelstrom** (intermission): boss takes **+30% for 25 s**. Stack in the middle; each wind pushes you into the cyst opposite its tunnel → pop → knocked back to center. After the third wind a mobile player pops the 4th cyst (always at the **exit** marker) to fling the raid to the entrance for the next set.
  2-min cooldowns: don't lose a use just to fit the 30% window (Tactyks: many specs use theirs in the back half instead). Two Evokers (Time Spiral) are nice, not required.
- **Ula'tek's Presence#1285961**: constant raid damage.

## Mythic
- **Serpent's Fury#1297367**: marks the **farthest** player from the boss (bait it with one assigned mobile player, e.g. a Hunter) and builds rage; **100 rage = Unbound Ferocity = wipe**. When **14 players** are within 8 yd of the marked player, Sszorak charges them (**To the Slaughter**) and resets rage.
  Tactyks: soak with all DPS + the off-tank + mobile healers (Pres, Holy Paladin) and keep melee close to the stack (if melee stand ahead of the ranged it can fail to trigger). Timing: right after each tank combo, ~1 s before the Surge bombs. In the 2nd and 3rd boss phases the first pop must happen **immediately after the combo** (energy is ~94).
  Don't stack with the marked player just before or after Dig In (auto-trigger). Popping the pre-intermission one even ~2 s early makes the next one impossible (Wolfthorn logs).
- **Virulence#1297707**: everyone in the pop gets short beams that burst after 5 s and spread the debuff to anyone hit → pre-assigned spread spots (half outside, half inside, mirrored as you move), patterns vary.
- End of fight: after the last Dig In **don't touch the 4th cyst** (enrage damage). You can survive ~20 s of enrage by having people taunt-and-die to Mutilates.

## What a log can check (see research note)
Tempest touches; Ravage/Mutilate on the wrong players; Mutilate soaker counts and alternation; Corroding Venom stacks; cyst pops per wind and players blown off (deaths with no killing blow in Dig In); Crosswinds drifts; Fury pop timing vs rage (enrage), Virulence clips; Caustic Residue time.
