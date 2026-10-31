# Cooldown timing on a boss: how the rules are made (Oct 31, 2026)

Flex's ask: for each player, were their big cooldowns pressed at the right moment on that boss (Trueshot for the intermission, and so on).
The rules live in `CDT_RULES` (src/ui.js), one per spec and cooldown, keyed `boss|difficulty`. Rotation shows a "<spell> timing" row
(in Cooldowns, "Cooldown timing on this boss"), the Rotation timeline marks each moment down the side of the spell's column (green pressed,
amber missed), and Debriefing's one-player list says a miss in one line ("Summon Darkglare wasn't ready for P2 start").

## How a rule is made
1. Read every saved Mythic kill of the boss from the log library (C:\Users\james\DebriefLogs): `dump.js` keeps each player's spec, the casts of
   rare spells, the phase starts (same markers as the engine's fight module) and Bloodlust (from casts; Augmentation's short Fury of the
   Aspects buffs are not Bloodlust). Scripts: shared notes folder `cooldown-timing/`.
2. `spec.js "<spec>" "<spell>"` prints each top player's presses as phase-relative times. Look for the moments nearly all of them share.
3. Write the rule (moments with a window around each, or `oncd` for specs that press it on cooldown) and run `verify2.js`: the rule must
   pass for nearly all top players (95%+), on the 20 fastest kills and on the slower ranked ones. If it doesn't, the rule is wrong.
4. Never grade what a raid's plan decides (Aura Mastery and other raid cooldowns): those belong to Plan / the NSRT note.

## The Coiled Altar, Mythic (31 fastest kills, Oct 15 to 22)
| Spec | Cooldown | Moments | Top players who did it |
|---|---|---|---|
| Marksmanship Hunter | Trueshot | pull, P2 start, intermission | 43 of 43 (90 of 93 in all ranked kills) |
| Affliction Warlock | Summon Darkglare | pull, P2 start, intermission | 46 of 46 (99 of 102) |
| Arcane Mage | Arcane Surge | pull (or before it), intermission | 48 of 49 |
| Arms Warrior | Avatar | pull, intermission | 35 of 35 (73 of 73) |
| Balance Druid | Incarnation | pull, intermission | 35 of 36 |
| Holy Paladin | Avenging Wrath | on cooldown from the pull (not held for the intermission) | 14 of 21 perfect, 90% of presses; never red |
P2 start is only judged when the cooldown was back by then (a P1 longer than ~2:45 gets an extra press, as slower top kills do).
Progression note: the intermission (Ghastly Regeneration, +100% damage) is a real damage check, so holding for it is right on progression too.
