# Estimated parse - how it works

Built Nov 12 (Main's job "the real parse table"; Flex: "im still not understanding how report card is factoring in dps/hps when these are the
estimated parses from warcraftlogs"; the method is Main's call, Flex: "yea that works", "healing should work similarly").

## The asks
1. Keep Warcraft Logs' 0-100 parse scale and its ranking population (each spec's best kill on the boss and difficulty).
2. Don't copy Warcraft Logs' own wipe estimate one to one: it rewards short wipes (all opener and Bloodlust) and punishes pulls that end in an intermission.
3. Phase-matched: each phase a player played (up to the wipe call, only while alive) over that spec's phase factor from top kills. Fewer than 8 samples: the role's, then the raid's.
4. Phases and pulls combined by time alive (a 7-minute pull counts 7 times a 1-minute one). Time dead doesn't lower it (Staying alive grades deaths).
5. Kills keep the real Warcraft Logs parse. Healers the same with healing (the number Warcraft Logs ranks them on).
6. Graphs first (a Parse column on the damage and healing tables), the Report card reads that number: "37 parse (estimated)", counted as 37.
7. No rankings for a spec or boss yet: say so, keep the row out of the grade.
8. Flex's Warcraft Logs numbers for Nov 11 are a sanity check, not a target; gaps over 10 explained by the pulls behind them.

## Where it lives
- `src/ui.js`: `PARSE_PCT`, `PARSE_TAB` (the rankings), `PHASE_FAC` (the phase factors), `parseAt`, `specKeyOf`, `phFacOf`, `estPull` (one pull's
  pieces), `estCombine` (the estimate), `estParses`. Graphs: `gbPrs` in `graphsBoard` (a kill: `parsesFor`; a wipe or All pulls: `estParses`).
  Report card: the "round 377" block in the checklist (all kills: the real parses averaged; any wipe: the estimate; none: "no estimate yet", not graded).
- `src/wcl.js` + Worker routes: `/api/specpct` (one page of a spec's ranked amounts, light), `/api/killpct` (kills spread through a boss's speed
  list, each player's amount and parse, with `cmp=Parses` to compare), `/api/srctab` (Warcraft Logs' own damage or healing table for some pulls, with
  `w` = wipe cutoff, for checks).
- Log library `tools/parses/`: `pcttab.js` (the rankings, resumable, the library's pacing rules), `phasefac.js` (the phase factors: the real engine on
  30 saved top kills a boss and difficulty, no downloads), `pastetab.js` (puts `pcttab.txt` and `phasefac.txt` into `src/ui.js`).
- Test: `tests/parse-estimate.js` with `tests/fixtures/agt6_ca_estpull.json` (each Nov 11 pull's pieces, read off the practice page).

## How the table is made
Warcraft Logs' parse = 100 x (ranked - rank) / ranked (checked: Arcane Mage rank ~1261 of 5,736 = 78). Its ranking list stops at 2,000 players
(page 20), so a spec ranked more than that (Arcane Mage 5,737 on Coiled Altar Mythic) takes its lower percentiles from real kill parses: about 100
kills spread through the boss's speed list (pages 1 to 40), every player's amount and the parse Warcraft Logs gave it, made monotone. Each spec's
ranked count comes from those kills (`totalParses`). The table keeps the amount at 24 percentiles (`PARSE_PCT`). Costs: a ranking page about 2 points,
a 10-kill sample about 45; the whole tier (40 specs x 10 bosses x 2 difficulties) takes about 5 hours at the library's pace.

## What we learned (Nov 12)
- Warcraft Logs' report rankings return nothing for wipes; its estimate isn't in the API.
- Its multi-pull Parse % isn't whole-night DPS on the kill rankings: Boltzzx's 213K over all 19 pulls is a 16 there (real kill parses agree:
  213K:16), Warcraft Logs showed 46. Its short pulls lift it: pulls 2, 7, 9 and 12 (about 1 to 2 minutes) parse 70-100 for most raiders.
- Not the cause: item level brackets (Wolfthorn is ilvl 333-335, where ilvl % is within about 10 of Parse %), the "Parses" comparison (within 1),
  older partitions (one partition for this boss), the 3-death wipe cutoff (helps a little), dead time.
- Coiled Altar Mythic phase factors (30 kills): P1 Zul'jan 0.83, P2 Malacrass 0.63, Intermission 3.07 (a burst on adds), P3 Coiled Union 0.99.
- The healers' numbers in Warcraft Logs' damage table are their damage parses, not healing.

## Nov 11 side by side (ours / Warcraft Logs)
Fourinches 51/61, Komo 65/60, Zaffia 19/50, Hobbz 35/54, Shockabunga 36/59, Dragooned 56/56, Kargaryen 11/27, Raiyvenz 27/37, Volkovod 59/53,
Larryg 15/36, Boltzzx 18/46, Dashtoswirly 17/31, Schooty 43/37, Jangokin 15/35, Vandagos 54/57, Tyralien 71/73. Healers (ours): Flëxørçïst 87,
Huservoker 58, Optt 38, Urgdragon 6. Every gap over 10 is the short-wipe lift (the test names it per raider).

## Keeping it fresh
Warcraft Logs' percentiles drift as more guilds kill each boss. Rerun `pcttab.js` (delete `pct/` first for fresh numbers) and `phasefac.js`, then
`pastetab.js`, build, check a practice link, push. Until `/api/specpct` and `/api/killpct` are live, `pcttab.js` reads them from the practice link
(`BASE`); after Flex pushes, set `BASE=https://debriefme.io`.

## One set of pulls (Nov 12, Main's re-test)
Graphs read 16 of the 19 pulls (pulls 3, 5 and 16 weren't downloaded yet, and Graphs didn't say so) while the Report card reads the whole night,
so Komo read 59 on Graphs and 65 on the card. Graphs' All pulls now reads the whole night too (`bossReps(..., true)` in `graphsAll`), and
`tests/parse-estimate.js` checks that Graphs and the card read the same pulls and give every raider the same number in both tables.
Main thought Graphs left out early resets on purpose; it didn't (there's no such rule on this board). Time-weighting already gives the
1-2 minute pulls their small share (5-6% of the night here).

## Why two Preservation Evokers sit at 58 and 6
Huservoker healed 448K a second while alive, Urgdragon 348K (0.78 of it). Preservation's kill rankings on Coiled Altar Mythic are tight
(50th percentile 437K, 10th 362K, 5th 341K), so 22% less healing is the difference between the middle and the bottom. Most of it is P2
(313K vs 458K) and P3 (353K vs 521K); healers' phase factors are near 1, so phase matching barely moves either.

## Nov 13: measured again after damage began counting shields
Damage done counts what an enemy's own shield absorbed since d2cdcf5b (as Warcraft Logs counts it). PARSE_TAB is Warcraft Logs' own rankings and did not need measuring again;
PHASE_FAC is ours (the engine on the log library's top kills) and was measured again the same day on the same 600 kills (20 boss lists of 30). The raid's factors moved a little:
The Coiled Altar Mythic P1 0.828 to 0.785, P2 0.634 to 0.665, Intermission 3.071 to 2.927, P3 0.994 to 1.026; Ula'tek Mythic Intermission 0.349 to 0.449, P3 0.763 to 0.728.
To measure again: copy tools/parses/phasefac.js to an empty folder (or delete its phasefac_kills cache: it keeps one result a kill and would reuse the old count), run it, paste.

On a kill the count now matches Warcraft Logs: Nov 12 The Coiled Altar kill, every raider's damage a second within 1.2% of Warcraft Logs' (4% to 11% low before), and the
estimate for the whole kill within 2 points of the real parse for the raiders who lived (Schooty 45 and 45, Komo 65 and 65, Fourinches 91 and 90; before: 23, 47, 79).
On wipes the estimates rose a lot. Nov 11 The Coiled Altar, 19 wipes, before and after: Schooty 43 to 79, Komo 64 to 83, Fourinches 51 to 72, Volkovod 59 to 86, Dragooned 55 to 80,
Zaffia 19 to 39, Boltzzx 18 to 43, Larryg 15 to 33. Next to Warcraft Logs' own Nov 11 Parse % (Flex's table): 11 of 16 raiders are now within 11 points (most within 4; they
read 10 to 30 low before), and five read well above it: Schooty +42, Volkovod +33, Dragooned +24, Komo +23, Fourinches +11. Why: the extra damage is real (all of it went into
Hex Lord Malacrass's shield), but it lands in phase 2 and 3, and those raiders gained far more there than top players of their spec did (Schooty's phase 2 rate +29%, the
Beast Mastery factor for phase 2 +5%); and the estimate counts time alive while Warcraft Logs counts the whole pull. Open with Main: whether that is acceptable.
Checks: tests/parse-kill.js (the kill's damage a second against Warcraft Logs', and the estimate against the real parse; with --all); tests/parse-estimate.js's saved pieces
(tests/fixtures/agt6_ca_estpull.json) were rebuilt with the new count: run by hand it now names those five raiders as unexplained gaps.
