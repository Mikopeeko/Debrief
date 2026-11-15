# Report card - where each row comes from

Nov 12, Flex: "so really every section in report card is just pulling and compiling data from other parts of the site this way", "Yes, do it"
(Main's plan). Every Report card row reads its number from a tab a raider can check it on, with that tab's own function over the same pulls (the
night's pulls they played), and names it (`y.src`, from `RC_SRC` in src/ui.js). A row with no home got one first; the card is never the only place
that decides a number.

| Row | Home tab | Shared function |
|---|---|---|
| Flask, Food, Weapon oil or stone, Augment rune, Enchants, Gems, Item level | Summary › Ready to raid tile (new) | `prepNight` + `rdyRows` (per-pull gear: `prepOfRep`) |
| Mechanics rows | Summary › Mechanics | `mechListOf` / `rcMechRows` |
| Avoidable damage rows | Summary › Avoidable damage | `keptMistakes` (avoidRule) |
| Deaths on you, Defensive before dying, Not enough healing | Graphs › Deaths | `deathList` / `deathsOf` / `gbDeathOk` |
| Healthstone or health potion | Summary › Healthstones tile | `coachKit` (`kitNight` / `kitFromK`) |
| Close calls answered | Summary › Defensives tile (its "Close calls" line) | `coachKit` |
| Big defensives (tanks) | Summary › Defensives tile, for a tank | `tankDefNight` (survivalOf) |
| Combat potion | Summary › Combat potions tile; Rotation | `potNight` |
| Externals (bonus) | Summary › Externals tile (new, healers) | `extNight` / `extChances` (also the per-pull card) |
| Damage / Healing | Graphs › Damage done / Healing done (Parse column) | `estParses` (a kill: the real parse) |
| Rotation | Rotation | `rotOf` over the night |
| Big cooldowns | Rotation › Big cooldowns tile (new) | `cdNight` (`cdUseRows`) |

All three tabs read the whole night (`bossReps(..., true)`): Graphs and Rotation used to read only the pulls already downloaded.

Checks: tests/rc-sources.js (in the contradiction check: the card and each home call the same function; Rotation and Graphs read the whole night;
the rows name a source) and, for the numbers, `window.__wla.rcSrcCheck()` on a practice link (every raider, every row: a source, and the same words as
the home's own count). Nov 11 Coiled Altar: 20 raiders, 681 rows, every one named, none different.
