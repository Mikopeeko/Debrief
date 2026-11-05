# Contradiction check: how it works (Nov 5, 2026)

Step 1 of the analysis upgrade (Flex: "the whole site could use an upgrade on its analysis of issues"). Before Debrief can find the
real cause of a wipe, it must never contradict itself. This check catches that automatically, on every build.

## What it checks
`tests/contradictions.js` runs the real engine on saved pulls and fails when the site contradicts itself:
- **Colour matches the facts.** A green line lists no misses. A red line has at least one row that failed.
- **Counts add up.** "5 players without a mote" lists 5 players. "8 hits on 4 players" adds up from the rows. A hit count is never
  higher than the separate hits in the log (damage ticks aren't hits). Nobody's death is counted twice.
- **One health number.** For every wipe, the pull picker, the banner, the coach line and the Companion's Result read the same
  whole-fight number, said one way: "boss at 33%". The page code is also checked, so nobody brings back a second number.
- **Clean text.** No doubled words ("died died"), no "1 player their ghost", no "undefined", "NaN" or "null", in every row, every
  row's line on Debriefing (the coach and Also hurt use them), every mistake and its fix.
- **Titles.** Every mechanic is "Name (Nickname)" with the nickname from the site's one table (`NKG` in src/ui.js, or `NK346` for a
  title two bosses share), 1-2 words, never an order like Kill, Swap or Pop.
- **How it went names the right mechanic.** A row's title is a mechanic its own sentence names, or one of that mechanic's family
  (a ghost touch can be Manifestation of Dread, Dreadmarch or Malevolent Resonance; never Wail of Terror just because the kick was
  the nearest mistake in time). The rule is `chainTitleFits` in src/ui.js, and the check makes sure How it went and Also hurt
  still use it (Nov 5, Flex's screenshot). Also hurt never repeats a How it went moment (same mechanic or players within 2 s).

The site's small helpers (pullPct, pullShort, rowText, nkWord283 and the rest) are read straight out of src/ui.js by
`tests/site-helpers.js`, so the check reads exactly what the page shows.

## When it runs
- **Every build:** `src/build.ps1` runs the quick set (5 pulls, about 15 s) after the design check. It never stops the build, but a
  failure prints in red with one line per problem: fix it before you push. The build's last line says "contradiction check: ...".
  Skip it once with `$env:DEBRIEF_SKIP_CHECK = '1'`.
- **By hand:** `node --max-old-space-size=8192 tests/contradictions.js --all` checks every saved pull of the test nights (about 30
  pulls, 2 minutes). `--dir <folder>` adds any folder of `<code>_<fight>.json` + `rep_<code>.json` files.

## The test pulls
From the log library (`C:\Users\james\DebriefLogs`): Wolfthorn's Oct 21 Coiled Altar night (HWFBkCyc6JNazQrK, 19 Mythic wipes),
Wolfthorn's Oct 14 night (9DRWhKnZbHtQgf4a: Kith'ix Heroic kill, Twin Fangs Mythic), and the all-bosses Mythic night
(xH3JNdbQ74wBDPAv). Older library copies leave out which spell a kick stopped, so "Spell undefined" there is skipped (the site
always has it).

## What it found on its first run (all fixed Nov 5)
- Kith'ix Extinguish green with 11 players without a mote; Venomfang green with slow dispels listed; Avoidable damage green with
  flagged hits; Coalesced Venom green after a Deluge put 20 orbs in one frontal; the tank frontals red with no failing row left.
- Three health numbers for one pull (the banner said the phase boss's 73%, the pull picker the whole fight's 33%).

## When it fails
Read the line: it names the pull, the mechanic and what doesn't match. Fix the engine or the page, never the check, unless the check
itself is wrong (then say why in the commit).
