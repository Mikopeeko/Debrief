# Mythic+ tab: how it works (Nov 1, 2026)

The website's Mythic+ tab reads a Mythic+ key from a Warcraft Logs report and shows it top to bottom, as in the Design studio's round 3 that Flex approved ("Looks good").
Steps 1 and 2 of the plan: the key top to bottom, and where the time went against a fast run. Routes on a map (step 3) come later.

## Where it shows
- Paste a Warcraft Logs report that has keys. A report of only keys opens on the Mythic+ tab, on the key in the link or else the newest.
- A raid report that also has keys opens the raid as usual, with a **Mythic+** tab at the end of the tabs. The raid's tabs take you back.
- With several keys in the report, a drop-down at the top picks one.
- Address: `?report=<code>&fight=<n>&tab=mplus`. Reload, Back and Forward work.
- Not yet: keys from a log on your PC or from a shared night (the site's own log reading skips keys). Those are a follow-up.

## The pipeline
1. `src/wcl.js` `loadReport` lists each key as `runs` (the page keeps them as `S.index.keys`). Warcraft Logs keeps a whole key as one fight, with:
   - the level and the time on the key's timer (deaths included), and how many levels it went up (0 means over time)
   - its bosses, in `dungeonPulls`, in English
   - a key left early has no time
   - a minute or less is a key started and reset, so it's skipped
   `REPORT_Q` asks for `keystoneTime keystoneBonus keystoneAffixes dungeonPulls{encounterID name}`.
2. The key's events download like a raid pull's (`loadEvents`, saved on the PC and in R2). A 12-minute key is 16 pages (about 150,000 events); a 24-minute key loads in about 10 s.
3. `translateSteps` writes them the way WoW writes a key: `CHALLENGE_MODE_START`, each boss's `ENCOUNTER_START/END` (the events say `dungeonencounterstart/end`), and `CHALLENGE_MODE_END` with the time from Warcraft Logs. On a key only, a purge (`isBuff`) is written as a BUFF, so it counts as a purge.
4. The PC app's own reader, `companion/mplus.js` (`DBF_MPLUS`), reads it: the run, pulls, mobs, deaths, kicks, casts that went off, and the timer. The build puts that file in the site (`/*MPLUS*/` in shell.html), so a change there changes the site too.
5. `src/mptab.js` draws the tab. The build puts it inside ui.js (`/*MPTAB*/`).

## The fast run
- `/api/mpfast?e=<dungeon>&l=<level>` (the Worker, kept a day): Warcraft Logs' speed rankings for that dungeon and level. Three requests in all.
- Warcraft Logs' bracket is the level less one: bracket 11 is +12 (checked on Voidscar Arena).
- It returns the 10 fastest with a public log, each with who played what and their damage or healing a second (from the run's own rankings, 5 runs a request).
- The page reads the fastest one that isn't your own key with the same reader, so both sides are counted the same way.
- Until it's in, the tiles say "finding a fast run" and the fast lane waits. With none, the tab shows without it. It never makes up numbers.
- Players: each player's damage or healing a second against the same spec in those 10 runs (spec and class must match). With none of that spec: "no X in the fast runs".
- Warcraft Logs encounter IDs for Midnight Season 2 (zone 55): Altar of Fangs 12993, Den of Nalorakk 12825, Kings' Rest 61762, Murder Row 12813, Ruby Life Pools 112521, Temple of Sethraliss 61877, The Blinding Vale 12859, Voidscar Arena 12923.

## How it decides
- **The timer:** each death's penalty is measured, not assumed: what the deaths cost on the timer divided by the deaths (15 s at +12). The timeline puts each death where it happened. The countdown is the gap between the log's end and the official time.
- **What gets you +N:** the next level is +2 at 80% of the timer and +3 at 60%. Over time, it's "What gets you in time". The seconds needed are as the timer shows them (24:06 against 24:00 is 6 s). The fixes are ranked by seconds:
  1. A **wipe** is the whole group dead within 45 s. Its deaths, plus the run back. It names who died first, their role and whether they used a defensive.
  2. **Kick X**: a must-kick cast that went off with a kick ready, and deaths to that same spell from the same enemy in a pull where it went off.
  3. **N deaths to X**: two or more deaths to one cause.
  Then come must-kick casts that went off without killing anyone ("fewer casts"), and last the other deaths as one line. Three are shown.
- **The verdict:**
  - "Either of the first two would have done it" and the like when they're enough.
  - "Even with no deaths, you'd be N seconds short. The rest is pace" when even no deaths isn't enough.
- **Stretches:** from the start to each boss **kill** (a boss you wiped on or reset belongs to the stretch). In each row, only the worst difference against the fast run is coloured, and only when it's over 20 s.
- **Pulls:** the reader's own pulls. Tags:
  - Wipe or N deaths
  - Not killed, for a boss that wasn't killed
  - N casts went off
  - an enemy buff from the dungeon's list with its count, e.g. Bolster ×6, from the log and never explained
  A pull with something in it opens.

## Rules Flex set
- Dungeon facts from 12.1 to 12.1.5 only. Timers and lists live in `companion/mplus.js`.
- No made-up tactics: the fixes are what the log shows (wipes, kicks from the must-kick lists, deaths).
- Healers have no kick in Midnight, except Restoration Shamans (said under "Who stopped casts").
- Plain, short sentences. It works on desktop and phone (stacked rows, labels on the stretch numbers).

## Tests that worked
- Offline: `scratchpad/mpx/readkey.js` (a saved key → translator → `DBF_MPLUS`). Also `harness.js`, which draws the tab's HTML in node from saved keys, for every sample in the mplus-preview notes.
- Practice links (`versions upload --preview-alias mptN`):
  - Flex's report `L7fRqbmPr2WdhaTG`: fight 1 is the Voidscar Arena +12 from the design, fight 20 is over time, fights 18 and 19 were left early.
  - `4GdvhM71B8zrCJjH` is a raid night with 2 keys (the tab beside the raid).
