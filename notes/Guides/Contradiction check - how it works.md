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

- **One player's mechanics (Nov 12).** Flex: "in a perfect world, report card would just be pulling the information from summary."
  For every saved night, boss and player (the code is in tests/one-player.js):
  - Summary, one player picked: a mechanic's pulls with mistakes are the pulls whose lines name that player. A line that names nobody
    ("Not one person"), names someone else, or only lists who the mechanic killed doesn't count against them. Its words ("Failed · 2 of 4")
    match those pulls.
  - The Report card's Mechanics say the same as Summary: the same mechanics, the same words, the same pulls, and flags that match
    (Failed is ✕, Some mistakes is ! or •, Done right is ✓). Avoidable damage has its own small group there, and only avoidable hits go in it.
  - No line with an empty slot, in the raid's Mistakes list or a player's: "Someone's and one ghosts touched at", "at ,", "for damage",
    "a player's or a player's", a doubled word.
  - Trend words agree with the pulls: never "Getting worse" when the last pulls had no mistakes or fewer than before, never "Getting better"
    when they had more.
  - What wiped us most with a player picked: no "0 wipes" rows and no "The other N wipes had no single cause." line (a check of the page's
    code, because that list is drawn from the coach box on the page).
  Run against the code from before Nov 12, it flags all five: Guillotine counted against five players whose lines didn't name them,
  rows on one page and not the other, "one of someone's or someone's purple orbs", "Getting worse: 0 of the last 5 pulls had mistakes",
  and the "0 wipes" rows.

The site's small helpers (pullPct, pullShort, rowText, nkWord283 and the rest) are read straight out of src/ui.js by
`tests/site-helpers.js`, so the check reads exactly what the page shows.

## When it runs
- **Every build:** `src/build.ps1` runs the quick set (6 pulls, about 15 s) after the design check. It never stops the build, but a
  failure prints in red with one line per problem: fix it before you push. The build's last line says "contradiction check: ...".
  Skip it once with `$env:DEBRIEF_SKIP_CHECK = '1'`.
- **By hand:** `node --max-old-space-size=8192 tests/contradictions.js --all` checks every saved pull of the test nights (about 30
  pulls, 2 minutes). `--dir <folder>` adds any folder of `<code>_<fight>.json` + `rep_<code>.json` files.

## The test pulls
From the log library (`C:\Users\james\DebriefLogs`): Wolfthorn's Oct 21 Coiled Altar night (HWFBkCyc6JNazQrK, 19 Mythic wipes),
Wolfthorn's Oct 14 night (9DRWhKnZbHtQgf4a: Kith'ix Heroic kill, Twin Fangs Mythic), the all-bosses Mythic night
(xH3JNdbQ74wBDPAv), and Wolfthorn's Oct 22 Coiled Altar night (bcA9kw3mxHKzr4fR, 35 Mythic wipes, added Nov 12; its pull 24 is in
the quick set). Older library copies leave out which spell a kick stopped, so "Spell undefined" there is skipped (the site
always has it).

## What it found on its first run (all fixed Nov 5)
- Kith'ix Extinguish green with 11 players without a mote; Venomfang green with slow dispels listed; Avoidable damage green with
  flagged hits; Coalesced Venom green after a Deluge put 20 orbs in one frontal; the tank frontals red with no failing row left.
- Three health numbers for one pull (the banner said the phase boss's 73%, the pull picker the whole fight's 33%).

## When it fails
Read the line: it names the pull, the mechanic and what doesn't match. Fix the engine or the page, never the check, unless the check
itself is wrong (then say why in the commit).
