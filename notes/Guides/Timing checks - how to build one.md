# Timing checks — how to build one (first done Oct 22, 2026: The Coiled Altar, Mythic)

The ask (Oct 22): "Make sure mechanics that have strats involving specific timings for phases/pushing bosses etc. are included
in the Debriefing tab." The Coiled Altar is the model; the other bosses follow the same steps.

## What counts as a timing strat
Pushing a phase before a cast or by a time, skipping a mechanic by pushing, "% by m:ss" targets, intermission damage, boss
health balance, adds dead before the next set, Berserk, Lust or cooldowns tied to a phase.

## Steps (one boss, one difficulty)
1. **Read the boss file** in notes/Guides/Bosses and list every timing the plan relies on (the "Mythic plan in detail" part).
2. **Mark what Debriefing already checks** (the boss's "Phase changes (Push on time)" line or similar) and what it misses.
3. **Read the 20 fastest kills** (`/api/topkills?e=<encounter>&d=5`) through Debrief on a practice copy: per kill, the phase
   start/end times (`S.rep.module.phases`), the casts per phase (the module's `_dm`, `_shields`, `_addSets`, `pools`), and the
   boss health at each phase change (`S.rep.hpUnits`). Save into the page's localStorage per kill; 5 kills per browser_batch.
   Warcraft Logs rate-limits after ~12 kills: wait a few minutes and carry on.
4. **Read the user's own pulls** the same way (the shared night, every pull in `__wla.CACHE`).
5. **Show the user a short table** before building: each moment, the plan, what the kills do, the user's best pull, and
   whether Debriefing checks it. Plain words, times as m:ss, no code names.
6. **Build the checks** on the boss's phase-change line: each row says "P2 took 3:33 (kills: about 2:30, never past 2:56)".
   - Green inside what every kill did; amber where a few kills still went (Coiled Altar: a second Malacrass shield, 4 of 20);
     red past anything a kill did (a 5th Dreadmarch, P2 over 3:00, Zul'jan back over 40%).
   - Date each mistake to the moment it went late (the second shield's cast, the 5th Dreadmarch), not the end of the phase,
     and date the row the same way: the wipe filter cuts everything after its death, and a row or mistake timed later is
     dropped even when the lateness started before the cut.
   - A pull that wipes in the middle of the phase gets its own row ("P2 (wiped)").
   - Mistakes on the line use mechanic 'Phase changes' (the line's short name) so the coach's fix and "what" find them.
   - A health or damage shortfall says "was still at N%" so Why we wiped counts it as not enough damage.
   - Mythic only until a difficulty has its own kill numbers.
7. **Re-read the 20 kills** on the new copy: no kill should be red; update `KILL_BASE[boss][diff].sec.push` (Coiled Altar
   went from 9 of 20 clean to 16 of 20 once the too-strict "before the next Dreadmarch" rule was replaced).
8. **Test on the user's night**, also with the wipe filter raised (localStorage `wla-death-cut2` on the practice origin), and
   check the coach lists it with its fix.

## The Coiled Altar Mythic, Oct 22 (20 fastest kills, 489–514 s)
- P1 (Zul'jan) ends 2:14–2:37, always after exactly two Noxious Ground pools. Red: a third pools; amber: past 2:40.
- P2 (Malacrass) takes 2:25–2:38 on 16 kills, ~2:56 on 4 (they let a second Eternal Nightfall start). Every kill: 4 Dreadmarch
  casts. Amber: a second shield or past 2:43; red: a 5th Dreadmarch or past 3:00.
- Intermission is fixed (~38 s). Zul'jan comes back at 22–33%. Amber over 35%, red over 40%.
- P3 takes 2:27–2:59, always 2 Defilement casts; Zul'jan dies first with Malacrass low (already checked).
- Our night (Oct 21): P1 on time every pull; pull 19's P2 took 3:33 (second shield, 5th Dreadmarch) and Zul'jan came back at 48%,
  but that all came after the 2nd death, so with the wipe filter at 2 it isn't counted.
