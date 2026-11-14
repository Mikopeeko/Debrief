# Why we wiped — how it works (Oct 21, test version)

Your ask: build the top idea from the raiding research and show a test version, not live.
Practice link: https://whywiped-debrief.james-m-nemecek.workers.dev/?night=PLRbTkpI_S3vOfdSwJrDZw (tonight's Coiled Altar).

## What you see (after your wording notes, Oct 21–22: "sound like a raid lead", "human", "root cause, briefer, at a glance")
- **One pull (Debriefing):** one line above "Next pull" with the first domino: "**Lost to Dreadmarch at 3:07** · Boltzzx, Volkovod
  and Earthday didn't pick up their soul fragments" + a "Third time tonight" tag when it repeats. Click "more" for the raid
  lead's take: "Dreadmarch again, that's the third time tonight. Boltzzx, Volkovod and Earthday, you didn't pick up your soul
  fragments and Gravebound got you at 3:07. Losing three at once is too much to come back from."
- **All pulls:** "**What wiped us:** Dreadmarch ×4 · Slow deaths, Healthstone unused ×3 · Axegrinder ×3 · Spiritcackle ×2 ·
  Sever ×2 · Venom Rupture raid damage ×2 · +3 others". "more" opens "Okay, tonight mostly came down to three things…".
- **Pull cards:** a dot next to "Pull 16": red = a mistake, orange = not enough damage, purple = too much damage taken,
  grey = not clear. Shows once the pull has been read.

## The four verdicts
- **A mistake**: a mechanic went wrong where the pull fell apart (the raid's, or the player's own: their mistake, a red mechanic
  row on their death like Gravebound, something avoidable, a cast that should have been kicked, or a slow death with a defensive,
  Healthstone or potion still ready).
- **Not enough damage**: an enrage, a berserk, a shield not broken in time, a boss still too high.
- **Too much damage taken**: many died within seconds with no mistake found, a slow death with little healing, or a tank going
  down to melee.
- **Not clear**: the log can't tell. It never guesses.

## Rules
- It looks at where the pull **fell apart**: the first death after which deaths kept coming (never a minute without one).
  An early death the raid played through for minutes isn't blamed.
- A raid mistake up to 20 s before that moment, or logged up to 8 s after it (like an orb exploding), counts.
- Kills and resets (under 15 s, or the boss never moved) get no verdict.
- Recap voice: "we", a name for one player, short.

## Tested
Tonight's 19 Coiled Altar Mythic pulls (shared night): 17 mistakes (Dreadmarch 4, Spiritcackle 2, Sever, Guillotine,
Axegrinder, slow deaths with kit ready), 2 too much damage taken (the P1 Venom Rupture wipes, where the log found no mistake).

## Code
`src/ui.js`: `whyWiped`, `whySay`, `whyLine`, `whyNight`, `whyDot` (before the report card grades); used in `dbfPull` and
`dbfNight` (top and slim boxes) and the pull card. `src/shell.html`: `.dbr-why`, `.why-t`, `.why-bad/dmg/heal/na`, `.fc-why`, `.why-bar`.
Patch kept in the shared notes folder (`why-wiped.patch`) until it goes live.

## Nov 12: the mechanic the wipe was called on
Flex, on Nov 11 pull 8: "this section is still wildly innacurate and needs serious fine tuning", "in terms of what caused the wipe at least".
The root cause (`rootCause` in src/engine.js, The Coiled Altar) used to read only the deaths before the wipe call. When the call came from a
wipe mechanic (`wipeMech` in ui.js: a short Guillotine soak, orbs touching, Eternal Nightfall finishing), the deaths it caused came a few
seconds after the call, so the few earlier deaths won and it said "Too many individual mistakes". Now:
- A wipe called on a mechanic was lost at that mechanic, with its deaths in the next 12 s. An earlier wave the raid lived through
  (Spirit Erasure 68 s before) goes to what added up, not the root.
- A Guillotine soak that landed while an unkicked Wail of Terror still had players feared (counted from the fear on each player) is the
  missed kick's wipe: "An unkicked Wail of Terror feared 15 players through the Guillotine soak, so it was short and Execution hit the raid."
- A tank killed by Blighted Sever because the other tank didn't taunt names the taunt: "Tyralien didn't taunt before Blighted Sever:
  Vandagos took it on stack 4 and died."
- The wipe-call row says "Ended by <the call's mechanic>", not the last serious row (pull 8 read "Ended by Gloombomb").

Nov 11 (19 wipes), before → after: pull 2 Too many individual mistakes → Schooty's purple orb (Venom Rupture killed 17); pull 6 Spirit
Erasure → Eternal Nightfall's shield (killed 15); pull 8 Too many individual mistakes → Guillotine soak 3 of 5 (Grim Execution killed 6);
pull 13 Too many individual mistakes → the unkicked Wail (15 feared, soak 1 of 5); pull 1 "The tank frontal hit players" → Tyralien's
missed taunt. The other 14 kept their cause. Left as it is: pull 5 (the call at 3:37 on 4 separate deaths, then Soul Sever killed 5 at
3:38, after the call). Check: tests/contradictions.js (a wipe called on a mechanic has that mechanic, or the missed kick, in its story).

## Nov 12, round 3
Flex: "The root cause aka the reason for wipes needs further fine tuning its still very off in a lot of cases", "the summary section is arguably
the most important part of my site". Read every saved Coiled Altar wipe (Oct 21: 35, Oct 22: 19, Nov 11: 19) with the site's own wipe call:
tests/wipe-read.js (real cutInfo + E.rootCause next to the log's deaths and raid mistakes around the call).
- A wipe called on the orbs keeps the orb wave a few seconds later as its own; it was read as "Reset on purpose" (Oct 21 pulls 15 and 28).
- Oct 21 pulls 27 and 33 had no root cause at all: the sentence code used `fam` outside the block that defines it (a crash, fixed).
- (Re-applied after Flex: "Yes, name it", see Nov 12 round 5 below.) Tried and undone, waiting on Flex: naming the mechanic behind half or more of a worn-down pull's deaths as the root ("Gravebound killed 3
  of the 4 who died") instead of "Too many individual mistakes". Flex's Nov 5 rule (272c2ac3) keeps "Too many individual mistakes" with
  "Most were Dreadmarch (5 of 8 deaths)" for separate personal deaths, and the contradiction check guards it. With the change, 22 of 54 saved
  October wipes would have dropped to 10.
Still open: wipes worn down by a long phase 2 (Dreadful Presence); the other nine bosses (rootCauseGen), not re-read this round.

## Nov 12, round 4: every boss
Flex: "oh lord this only applies to one boss?!". The other nine bosses share `rootCauseGen` (src/engine.js); read all 40 saved wipes of them
(night folders and saved WCL pulls; scratchpad wr/read2.js, a copy in the shared notes folder under wipe-read/).
- The wave just after the call (one hit killing 4 or more within 15 s after a call on separate deaths, none before) is the collapse for
  every boss, the Coiled Altar too; it was Ula'tek only (`waveAfterCall`). A call on a mechanic keeps that mechanic. Nymrissa pull 3: the call
  at 3:48 on 3 whirlpool deaths, then "2 murlocs from set 4 reached the bubble ... → Pulsing Tides killed 9 at once". Twin Fangs pull 16: five
  unkicked Visceral Bursts. Coiled Altar: Oct 21 pull 5 (unkicked Wail, the tank feared into the axes), Oct 21 pull 19 and Oct 22 pull 11
  (an orb 3 s after the call), Nov 11 pull 5 ("Soul Sever (the tank frontal) killed 5").
- A raid line that says what went wrong is the sentence ("A Caustic Globule nobody soaked exploded on the raid"), not "Most of the deaths
  were Caustic Globule (3 of 3)"; a raid line that only counts the dead gives way to the line just before it that says why.
- Many players each failing the same thing: "9 players took Extinguish without a Light's Embrace mote, and died. Each of them missed it on
  their own", never "each player dodges it".
- A High Pace line in the last 30 s is in what added up as "Not enough damage" (Vashnik at 8% at the 6th Imbibe).
The Ula'tek wipes reviewed on Nov 10 read the same as before.

## Nov 12: How it went reads clean
Flex ("clean?") on "Shockabunga died to Frost Burst because 1 player died to Frost Burst while Abyssal Rain was ticking":
- A death row never explains a death with the raid line that counts it: it keeps only that line's why ("... while Abyssal Rain was ticking"),
  or "hit by Retaliatory Malice while set 5's adds were alive" when the line names another hit (deathBrief's fp, src/ui.js).
- A raid line that only counts the dead goes when 80% of the deaths it counts are in death rows beside it (wipeChain).
- A player's own row goes when the group death row beside it names them for the same hit.
- A row's first sentence ends at . ! or ? before a capital or the end: "at Pop! 2." no longer reads "at Pop!.".

## Nov 12, round 5: the main mechanic of a worn-down pull (Flex: "Yes, name it")
Over the Nov 5 rule: one mechanic behind half or more of a worn-down pull's deaths (a tank counts 2), and more than any other (a tie goes to
the one that killed more people), is the root, worded by the hits that killed them: "Gravebound killed 3 of the 4 who died, and too few were
left to reach the intermission". Dreadmarch keeps its own sentence ("Ghosts touching killed too many to reach the intermission"). No one
player is named for it (several people). "Too many individual mistakes" is left for pulls where nothing stood out: 7 of 58 saved Coiled
Altar wipes now (22 of 54 October wipes this morning), none on Nov 11. The contradiction check now allows a personal mechanic as the one
cause of a worn-down pull only with that majority (rootCause returns worn: true).

## Nov 12, pass 2 (Flex: "do another pass", "until its perfect, on all bosses")
Read the box as shown (headline, tip, every How it went row) for all 19 Nov 11 wipes on a practice link (`window.wipeChain` is exposed).
- Sever / Soul Sever / Blighted Sever deaths are each player's own ("Why does it like to blame soul sever individual deaths for wipes"): never a
  worn-down root, an after-call burst that is 60% Sever isn't the collapse, a Sever-led wave is named by its next cause; a missed taunt still is.
- "N deaths by the call" (it counts every death, rezzed players' earlier ones too); a missed taunt's own tip; the orb root's one carrier is
  never "killed by orbs someone else set off"; a Phase 2 push is a raid mistake (never "Short on damage" or the damage-check tip).
- How it went: a death right after the player's own mistake on the same hit ends that row; a count row names the single deaths beside it;
  the root's own moment always has a row and survives the 9-row cap; a row "fits" the root only on a real match (Melee "fit" everything,
  so the tag landed on "died to Melee").
- A missed kick says what the fear did; Also hurt reads "A, B and C's ghosts touched each other".

## Nov 13, pass 3: the other bosses' boxes as shown (Flex: "Yes, keep going")
Read every wipe's box on the all-bosses night (xH3J: Ula'tek 9, Kith'ix 4, Sentinels, Sszorak, Twin Fangs) and the Oct 14 Twin Fangs night
(9DRW, 29 wipes) on a practice link (`__wla.select` loop over `S.index.bosses`, then the `.dbt-why` rows; start from a single pull, not All pulls).
- A player's line that starts with a spell reads "Bryon's Abyssal Grasp stayed on ..."; other lines keep "Name verb ...".
- "died to Caustic Waves while stunned by an unkicked Anguished Cry", never "because stunned by".
- The root's own moment gets a row on the other nine bosses too (not when its line is about deaths: those have death rows); a row "fits"
  the root only on a real match (a spell with no family "fit" every root); when a row names the cause, the Root cause tag goes to it
  (never "died to Toxic Fumes" beside the Visceral Burst row); a reset tags no row.
- A player's own miss that hit the raid (a tank's missed Stone Breaker circle): the line explaining a wave counts up to the wave's last death,
  the first miss wins over a later one; it is the cause when its hit (the site's one killing hit, d.kill) killed half or more of the wave
  ("Ironvan missed Stone Breaker circle 1, and it killed 13 players", was "Caustic Globule"), or, with no wave, when it killed at least as many
  as anything else in the last 15 s; "and it killed N" counts the miss's own hit, never the wave's first death.
Tried and left out: naming every root death by d.kill (it moved 8 Coiled Altar roots, several for the worse: needs its own review).

## Nov 13, Main's three calls from the answer key (Nov 11 pulls 1, 3 and 5)
Each was judged from the raw log by hand (tests/answer-key/roots.js) and ruled by Main. The fixes are rules, not pull patches; reading all 79 saved Coiled Altar wipes
before and after moved four: these three and Oct 22 pull 6 (the same bomb pattern, 19 feared, now the missed kick).
- **What follows from a missed kick, past the fear.** A death is "via the kick" within 12 s of the Wail, as before, and now also up to 20 s after the cast when the fear set
  it up: soul fragments (Gravebound, or a Gloombomb hit) when the Gravebound on them began during the fear; a Gloombomb's blast itself while the fear was on, whoever it hit,
  when that Wail really feared the raid (3 or more players: on the Oct 21 night many casts "got off" with nobody feared, and those set nothing up);
  Malevolent Resonance when their ghost touched during the fear; and the Guillotine's eruption (Widow's Kiss, Death's Embrace) on a player still feared.
  Only players the Wail feared, and only in a log that records the fear on players; without it the 12 s window stands.
- **A call that lands in the fear.** A wipe call within 10 s of an unkicked Wail, with no wave of its own before it, is lost at that kick when the deaths it caused (4 or
  more) are half or more of everyone who died in the 20 s after the cast. Nov 11 pull 3: the Wail at 3:26 feared 18 with Gloombombs out, the bombs went off in the raid
  1.5 s later (7 extra players hit), ghosts touched; it read "Phase 2 push" from the four deaths before the call. The line says what the fear set up: "Gloombombs went
  off in the raid (7 extra players hit) and ghosts touched".
- **The frontal's own moment.** A wave whose missed-taunt frontal lands within 2 s of its first death begins at that frontal: the deaths just before it are their own, and
  the moment the pull was lost is the Sever. A frontal later in a wave didn't start it (Oct 22 pull 3: 4 s in, unchanged). Nov 11 pull 5: Raiyvenz died 1.1 s
  before the 3:38 Soul Sever, so the taunt row fell outside the window ("Too many individual mistakes"). Now: "Tyralien didn't taunt before Soul Sever: Vandagos took it
  on stack 2 and died. Soul Sever also killed 4 who stood in it." With 3 or more others dead in it, no one player is named as the cause (a dodge that killed 3 or more is
  no one person's); the tip says both (taunt, and stay out). Without a missed taunt, Sever deaths are still each player's own, never the root (Flex, Nov 12).
- **A tank left alone.** A tank who dies to the frontal on stack 3 or more with no other tank alive took every one alone: the wave goes back to what killed the other
  tank. Nov 11 pull 1: the unkicked Wail at 7:33 feared Tyralien into Death's Embrace; he was never brought back; Vandagos died to his fourth Blighted Sever at 8:54. The
  root is the missed kick, with the frontal in its line. When the other tank didn't die to a missed kick, the cause stays the frontal, with nobody named.
- **Never name a dead or mind-controlled player** (engine `tankOut`, every boss's taunt rows): a tank is out while dead (the last death has no battle res after it; it
  used to count for 60 s only), mind controlled or feared. With the other tank out, the taker's third stack is marked someone else's (m.others): not counted against them,
  never death proof ("Took Blighted Sever on stack 3: the other tank, Tyralien, was dead, so nobody could taunt.").
Checks: tests/wipe-causes.js (the four pulls by name, read with the page's real wipe call; and pull 5 again with its taunt row taken out, which must not read Sever),
with --all; the answer key holds the same three causes in every build; every pull read by the contradiction check fails if a taunt row names a tank who was dead;
each rule's own line is pinned in the page-code list.

## Nov 13, later: three follow-ups from Main
- **Biggest first, then what added up** (Flex's standing rule). A worn-down pull where no one cause clears a bar ("Too many individual mistakes") leads with its biggest group of
  deaths when that group is 2 or more: "Gloombomb killed 3 of the 8 who died, then Dreadmarch 2 and Coalesced Venom 1, and too few were left for the intermission." A tie says
  "Axegrinder and Dreadmarch each killed 2 of the 4 who died". Next time follows the biggest group. Oct 21 pull 16 (read past its early call since the played-on rule) is the pull
  it came from; four Oct 22 pulls read the same way now. Every group of one still reads "Deaths from different mistakes added up".
- **Feared off the edge.** A death with no killing hit, more than 50 yards from the middle of the room (`d.noKill`, `d.far`, RC_EDGE), on a player still feared, follows from the
  missed kick whatever ticked on them last, and the line says "3 feared off the edge". Nov 11 pull 16, checked against the raw log: the Wail at 4:59 feared 16; Kargaryen, Urgdragon
  and Hobbz died at 5:01.0 with no killing hit, 59 to 76 yards out. It read "2 died while feared (Deadly Venom)": Deadly Venom is a raider's own poison, the last thing that ticked
  on two of them, and the third was labelled Dreadful Presence and not counted. (The death list still names that last tick: that is the killing-hit item, next.)
- **How it went keeps the deaths the root names.** The root cause returns `named` (the deaths its line names one by one: today the two tanks of a tank left alone); How it went
  gives each a row even when it is before the collapse it lists, and the 9-row cap cuts the least important other rows instead. Nov 11 pull 1: 7:33 Wail, 7:38 Tyralien, 8:54 Vandagos.
Checks: tests/wipe-causes.js names Oct 21 pull 16, Nov 11 pull 16 and Nov 11 pull 1's How it went rows (with --all); each rule's line is pinned in the page-code list (every build).

## Nov 13: a dropped purple orb (Flex: "He died as he was carrying it, and i ran into it right as he died")
With no purple carried at a burst, the module looks for a purple whose carrier died in the 3 s before it (the carry ends at the death): it dropped where they fell (`r.orbDrop`).
From the log's positions it names the one green carrier within ring range (7.5 yards) of that spot at the burst, when every other green carrier is clear of it (8.5 or more);
with no such green, the carrier alone. Why we wiped: "Komo died carrying a purple orb, and it dropped where they fell. Flëxørçïst's green orb ran into it and set off Venom
Rupture." Both are named (orbBy, and All pulls' one rule orbBurstBy); never "one of". Nov 12 pull 3, 7:58 is the pull; tests/wipe-causes.js names it.

## The Root cause header needs no mechanic row (Nov 13)
Summary's header rewrite (shell.html) only ran when How it went had a row tagged with a mechanic or a death row that says "died to X". Nov 11 pull 2 has neither: its rows are
"Schooty walked off the edge" and the wipe call. So on main the header stayed "It started at 1:23: Schooty walked off the edge" and the cause the page had already worked out
("Schooty's purple orb touched other orbs and set off Venom Rupture") sat under It added up with. The live site, before the edge rows of Nov 13, read "Root cause: Coalesced Venom
(Orb Pops)". Now a pull with no such row takes the root cause's own name for the header, and the rest of the rewrite runs as for any other pull. The same would have hit a pull that
opens with "fell off the edge" or "died with no killing hit". Seen on the practice link next to a build of main without it. Check: the shell's line is pinned
(tests/contradictions.js); the shell's page code has no Node test, so look at Nov 11 pull 2 on a practice link after touching that rewrite.
