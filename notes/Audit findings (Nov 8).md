# Audit findings (Nov 8)

Flex: "fine tune all the logic driven modules ... as accurate and polished as possible". Brief: `notes/Audit brief - every logic module (Nov 8).md`.
Each finding: what's wrong, where (a real pull), the rule now → the rule it should be, file/function, size (S/M/L), owner.
Live build when checked: cc769a15 (Nov 7). Logs: Thursday Nov 5 `2r1KzqygWAFHkZT3` (22 Coiled Altar wipes), 10 bosses `xH3JNdbQ74wBDPAv`.

## 1. Wipes

How the site decides a wipe today (so the fixes land in the right place):
- `engine.js rootCause()` (Coiled Altar, line ~7794) and `rootCauseGen()` (every other boss, ~7960) pick the root cause, the names ("Caused by"), the chain and "what else added up". `ui.js wipeRoot()` (~11700) calls them at the site's wipe call.
- `ui.js wipeAt()` (~11629) is the automatic wipe call: more dead than any kill survived (tanks count 2, battle rezzes cover), half the raid dead, the damage check, or a wipe mechanic from `WIPE_MECH` (~11600). `cutInfo()`/`cutT()` give every tab the cut.
- `ui.js whyWiped()` (~14239) is the OLD Oct 21 verdict (first domino: mistake / not enough damage / too much damage / unclear). Still used by the pull-card dots and tooltips in the boss header (~643), the "What wiped us" night summary `whyNight()` (~14401), the "Nth time tonight" counts and the coach cards.
- `ui.js wipeChain()` (~15591) builds How it went from the collapse's mistakes and deaths; the Timeline card (shell.html ~15558) titles itself from `window.wipeRoot()`.
- Debriefing's card ("Why we wiped" → How it went → Also hurt → Raid checks) is one renderer in shell.html's Timeline script, so the Overview and Timeline layouts agree with each other. The disagreements below are between that card and the other tabs.

### W1. When the raid played on past the wipe call, only Why we wiped moves; every other tab still cuts at the old call (M, analysis chat)
- What's wrong: the root cause decides "the raid played on past the call" (`early`) and reads to the real end, and the header says "Wiped at 4:04 (the raid played on past the wipe call)". But `cutT()` is unchanged, so the Deaths tile says "3 dead at the call", Graphs greys out everything after 2:18, Mistakes and the Report card stop at 2:18 too. The pull's real wipe (1:46 later) is invisible on every tab but one.
- Where: 10-boss log, Ula'tek Mythic pull 7: call 2:18 (3 dead), wiped 4:04. Worse: 10-boss log fight=28 (Nek'zali): called at 2:32 with 5 dead, the raid played on to 5:11 and the boss to 2%, so Graphs and Mistakes hide the 2:39 that mattered most. Thursday pulls 2, 10, 12 (call 5:16/5:21/5:54, wiped 5:41/5:59/6:33).
- Rule now: `wipeAt()` fixes the cut; `rootCause` quietly ignores it when early. → Rule it should be: when `rootCause` says early, the pull's cut moves to the real collapse (`cutInfo` returns the late cut with `why: 'played on'`), so Deaths, Graphs, Mistakes, Report card and Why we wiped count the same window. Also tighten the kill-line call so this happens less: a call with battle rezzes still up, or when the raid keeps playing clean for 60 s, should not fire.
- File: `ui.js cutInfo()/wipeAt()`, `engine.js rootCause()/rootCauseGen()` (`early`).

### W2. A missed Wail of Terror never names the kicker, though All pulls can (M, analysis chat)
- What's wrong: for a `kick` root cause, `rcBy()` looks for mistakes whose mechanic is "Wail of Terror" with failure wording. The note's kick misses are logged as mechanic "Kick assignment" (engine ~5797, Medium, `player: g.want`), so they never match: "An unkicked Wail of Terror feared players." has no "Caused by". All pulls' `whoOf()` (~15654) DOES read "Kick assignment" and shows "Missed the kick: Name". Two rules for the same question.
- Where: Thursday pulls 3 (4:55) and 13 (3:33).
- Rule it should be: one shared "who missed this job" lookup (kick, Guillotine soak, orb carrier, Gloombomb) used by `rcBy`, `whoOf` and the Companion card. For a kick: the "Kick assignment" miss within 20 s before to 3 s after the Wail; one name when one, "one of A or B" when two, nothing when the note has no kick order.
- File: `engine.js rcBy()`, `ui.js whoOf()`.

### W3. "Most were X (1 of 3 deaths)" and "(2 of 4 deaths)" (S, analysis chat)
- What's wrong: "Most were" is decided by weight (a tank counts 2) at 40%, so 1 of 3 deaths reads as "most".
- Where: 10-boss log, Coiled Altar pull 1: "Most were Sever (1 of 3 deaths)". Thursday pull 5: "Most were Coalesced Venom (2 of 4 deaths)".
- Rule it should be: "Most were X" only when X is a majority by count (at least 2 and more than half). Otherwise "Including a tank death to Sever" (when the weight is the tank) or just "Deaths from different mistakes added up".
- File: `engine.js rootCause()` (`nextCat`, `mostL`, the `dead` short line).

### W4. The root cause's own row in How it went can read "Moderate" (S, analysis chat)
- What's wrong: the wipe's root cause (the Wail that got off) is tagged MODERATE while a player's Sever hit next to it is SERIOUS. The interrupt rule is High (engine line 245) but the row shows the re-graded Medium.
- Where: Thursday pull 13 (3:33 "Spiteful Soulcoiler got Wail of Terror off." · MODERATE), pull 3 (4:55).
- Rule it should be: the row carrying the Root cause tag is always Serious; a missed Wail kick that deaths follow (`via`) is High at every strictness.
- File: shell.html Timeline card (`row` level), `engine.js` interrupt severity / `strictView`.

### W5. Feared players are forgiven in the deaths but blamed in the mistakes (M, analysis chat)
- What's wrong: Kargaryen's axe death reads "feared by an unkicked Wail of Terror: the missed kick, not them" and the Deaths tile says 0 their fault, but Komo's "stood in the tank frontal (Soul Sever) and took 678,998 damage" 5 s after the same Wail is a SERIOUS personal mistake, and counts on the Report card.
- Where: Thursday pull 13, 3:33 Wail, 3:38 Sever.
- Rule it should be: the fear check the deaths use (the Wail of Terror debuff on the player, `fearOk`) also applies to avoidable-damage and position mistakes: while feared, a hit is "feared, not them" on every tab (Mistakes, Report card, Also hurt, the Companion card).
- File: `engine.js` avoidable rules (`avoidRule`), `rootCause` `fearOk`.

### W6. "feared players into axes" when most died to the tank's Sever (S, analysis chat)
- What's wrong: the `into` list only knows axes, orbs and pools; frontal (Soul Sever) deaths while feared are dropped from the sentence.
- Where: Thursday pull 13: 3 died to Soul Sever, 1 to Axegrinder → "An unkicked Wail of Terror feared players into axes."
- Rule it should be: `into` includes `frontal` ("into the tank's Sever") and names the biggest first: "feared players into the tank's Sever and the axes."
- File: `engine.js rootCause()` (`into`, `kickLine`'s `ran`).

### W7. A push wipe says "It came down to the raid's damage" (S, analysis chat)
- What's wrong: `push` (Dreadful Presence, an unready push into phase 2) shares the no-name reason with `shield` and `dps`. A bad push is about stacks and cooldowns, not damage.
- Where: Thursday pull 7.
- Rule it should be: push → "It came down to how the raid pushed (stacks and cooldowns), not one player."
- File: `engine.js` `noBy` (RC_RAID_DMG vs RC_RAID_STK).

### W8. "no kill of this boss had anyone dead this early" next to "3 dead at the call" (S, analysis chat)
- What's wrong: the other-boss sentence counts only the collapse window (`pre`, deaths in the last 45 s), while the header counts every death up to the call.
- Where: 10-boss log, Ula'tek pull 8: "Chazh died to Caustic Waves at 2:13, and no kill of this boss had anyone dead this early." · 3 dead at the call.
- Rule it should be: the "this early" sentence uses the dead at the call ("3 dead by 2:13, more than any kill had this early").
- File: `engine.js rootCauseGen()` (the `pre.length < 3` branch).

### W9. A player's own mistake as the root reads like a fragment (S, analysis chat)
- What's wrong: the sentence is the mistake's detail verbatim plus "Caused by": "Hit by Caustic Waves twice (3.9M), more than 9 in 10 raiders in the fastest kills by then, and died to it. Caused by Zorthar."
- Where: 10-boss log, Ula'tek pull 1.
- Rule it should be: when the cause is one player's own mistake, lead with the name: "Zorthar was hit by Caustic Waves twice and died to it." (no "Caused by" needed, no comparison numbers in the headline).
- File: `engine.js rootCauseGen()` (`short` when `causeM.player` is a person).

### W10. Next time is a description, not an instruction (S, analysis chat)
- What's wrong: "NEXT TIME: Nobody was in melee of Ula'tek, so she hit the raid." is the cause, not the fix.
- Where: 10-boss log, Ula'tek pull 3 (Unchecked Rage).
- Rule it should be: every `fix` is an instruction ("Keep a tank in Ula'tek's reach at all times; if both tanks are away, a melee steps in."). Sweep every pack's `fix`/`tip` for sentences that describe instead of instruct.
- File: `engine.js` PACKS (Ula'tek Unchecked Rage), `rcNextOf`.

### W11. Three rule sets still answer "why did we wipe" (M, analysis chat)
- What's wrong: `rootCause` drives the card and All pulls; the old `whyWiped` still drives the pull-card dots and tooltips in the boss header, "What wiped us" over the night (`whyNight`), the "Nth time tonight" counts and the coach cards; `wipeChain` drives How it went's first row. They can name different causes for the same pull (whyWiped stops at the call even when rootCause reads past it; whyWiped's first domino can be an early death rootCause ignores).
- Rule it should be: one source. `whyWiped` becomes a thin wrapper over `rootCause` (its `k` colour from `cat`: dps/shield → damage, dead/kit → mistakes, etc.), so dots, tooltips, night summary and "again" counts agree with the card.
- File: `ui.js whyWiped()`, `whyNight()`, `whyLine()`, `whyKey()`.

### W12. Sszorak Mythic has no wipe-mechanic rule (S, analysis chat)
- What's wrong: `WIPE_MECH` covers Sszorak Heroic (Viscous Cyst) but not Mythic, so a Mythic Sszorak wipe is called only by the death line. Mutilate soaks and Crosswinds wipes are the Mythic killers (notes/Sszorak research.md).
- Rule it should be: add `Sszorak|M` entries from the guide (a Mutilate soaked by the wrong group or too few; a missed Crosswinds), checked against the 10-boss log's Sszorak pulls.
- File: `ui.js WIPE_MECH`.

### W13. One player blamed for a mechanic 13 people died to on their own (M, analysis chat)
- What's wrong: on other bosses, `byL` names the player of the earliest Medium/High mistake that fits the killing ability (`causeM.player !== 'Raid'`). Nullify (Nek'zali's gate shards) is dodged by each player; 13 of 22 died to it, and the card says "Caused by Ninjaristic" because theirs was the first flagged dodge.
- Where: 10-boss log, fight=28 (Nullify, "Most of the deaths were Nullify (13 of 22). Caused by Ninjaristic.").
- Rule it should be: a person is "the cause" only when the mechanic is a job (a soak, a kick, a carry, a pop, an interrupt, a position the note gave them) or when the deaths to it are theirs. For a dodge mechanic that killed many, no name: "13 died to Nullify: the shards from the gates weren't dodged."
- File: `engine.js rootCauseGen()` (`byL`), `rcBy()`.

### W14. A 5-second reset gets a full root cause (S, analysis chat)
- What's wrong: `dbfReset()` (ui ~31641: boss at 100% or under 15 s) stops the coach headline and All pulls, but the Timeline card still runs `wipeRoot()` and prints "Root cause: Too many individual mistakes · not sure · Deaths from different mistakes added up, and too few were left to finish the boss." for a 0:05 pull with 3 deaths at 100%.
- Where: 10-boss log, Sszorak fight=51 (0:05, boss 100%).
- Rule it should be: a reset pull shows one line, "Reset after 5 seconds (3 died on the pull)", and no root cause, no Next time, no Also hurt.
- File: shell.html Timeline card (RT) and `ui.js wipeRoot()` (return null when `dbfReset`).

### W15. "Wipe called at 2:11 in Both" (S, analysis chat)
- What's wrong: the phase name is pasted after "in": Twin Fangs' phase is called "Both" (both bosses up), so the header reads "in Both".
- Where: 10-boss log, Twin Fangs fight=57.
- Rule it should be: only P1/P2/P3/the intermission get "in …"; other phase names read in plain words ("with both bosses up") or are left out.
- File: shell.html Timeline card header (`facts`, ~15609).

### W16. The 10-boss and Thursday sweeps, for the record (no fix)
- Every wipe pull on both logs gets a root cause with no errors or "undefined" (22 Thursday pulls, 20 pulls over 7 bosses on the 10-boss log). Names appear where the log can name (orb carriers, Guillotine drops, a Howling Maelstrom with no cyst popped: "No Viscous Cyst was popped for wind 1 of intermission 1: 15 players died."). The Overview and Timeline layouts always show the same cause (one renderer).

### Order to fix (my call)
1. W1 (the wipe filter follows the real wipe) — it changes every tab's numbers on "played on" pulls, 5 of 42 pulls checked.
2. W11 (one source for why we wiped) — removes the two old rule sets.
3. W2 + W13 (who caused it: name the job owner, never a dodger) — Flex's "who caused the wipe" ask.
4. W5 (feared players forgiven everywhere) and W4 (root row always Serious).
5. The wording set: W3, W6, W7, W8, W9, W10, W15; and W14, W12.

## 2. Deaths

How the site judges a death today: `engine.js explainDeaths()` (~7563) reads each death's last 15 s (recap, `d.ability` = the LAST damaging hit, `d.big` = the biggest hit of the last 4 s when it is 1.5× the last, `d.links` = their own mistakes in the 10 s before and Raid mistakes within 4 s, `d.ownAvoid`, `d.fast`, `d.mass`), `survivability()` (~7395) what was ready (`d.available`, `d.reactable`), `deathSaves()` whether it would have saved them, `deathHealGaps()` the healing gaps. `ui.js deathVerdict()` (~29764) is the one verdict (wipe / end / mass / shared / forced / own / fast / raid / noheal / heal / ready / nosave / nothing), `deathFix()` the coaching line, `deathTag()` (~13084) the Debriefing line, `deathCount()` / `deathsOf()` / `deadAtCall()` the numbers, `survivalOf0()` (~29870) the Report card's Staying alive grade, `rcnPlayer()` (~30600) the player page, `gbDeathOk()` (~18633) Graphs.
Sweep: every death on Thursday Nov 5 `2r1KzqygWAFHkZT3` (22 pulls, 429 deaths, 232 before the call), the 10-boss log `xH3JNdbQ74wBDPAv` (30 pulls, 422 deaths, 119 before the call) and Twin Fangs `9DRWhKnZbHtQgf4a` (8 pulls, 144 deaths, 84 before the call), run through the real engine and the real `deathVerdict` in node (the recipe in memory `deaths-audit-recipe`; the script is `audit2.js` in the shared notes folder, deaths-audit/). Verdicts before the call: Thursday mass 153, forced 34, own 26, shared 6, fast 5, ready 4, raid 2, heal 1, nothing 1; 10 bosses own 40, mass 39, fast 27, raid 5, shared 2, forced 2, nothing 2, ready 1, nosave 1; Twin Fangs mass 53, own 15, fast 12, ready 2, heal 1, nosave 1.

### D1. A death someone else forced reads "Not on them: After the pull was lost" on Debriefing (S, analysis chat)
- What's wrong: `deathTag()` has no line for the `forced` verdict (feared by an unkicked Wail, a short Guillotine soak, someone else's Gloombomb, orbs someone else set off, an axe dropped on the raid), so it falls through to the last branch, "After the pull was lost." The verdict itself is right ("not them"); the sentence is wrong. 34 of Thursday's 232 counted deaths are `forced`.
- Where: Thursday pull 12 at 4:57 (Schooty, Hobbz: feared into Gloombomb), pull 20 at 0:54 (6 players: "Turkhan dropped the Guillotine on the raid"), pull 24 at 7:00-7:06 (6 players: orbs someone else set off).
- Rule now: `deathTag` h → the final else. → Rule it should be: `forced` gets its own line, the verdict's own words with a capital: "Feared by an unkicked Wail of Terror: the missed kick, not them." Same gap in `rcnPlayer`'s `dTag` fallback, which prints the word plus ": not on you" → "…the missed kick, not them: not on you" (say it once). `deathFix` returns '' for `forced`; give it the raid's fix ("Kick every Wail of Terror", "Send 5 to every Guillotine").
- File: `ui.js deathTag()`, `rcnPlayer()` dTag, `deathFix()`.

### D2. The verdict judges the last tick, not the hit that killed them (M, analysis chat)
- What's wrong: `d.ability` is the last damaging event before UNIT_DIED. When a 500k-900k hit lands and a 20k tick follows a moment later, every rule (own / forced / mass grouping / "Killed by" / the fix) reads the tick. The engine already finds the real hit (`d.big`) but only the Deaths panel uses it.
- Where: Thursday pull 32 at 7:04 Komo: Venom Rupture 527k 0.1 s before, read as "Mutagenic Venom: their own mistake · Stay out of Mutagenic Venom: it's dodgeable". Pull 13 at 2:13 Dashtoswirly: Execution 754k (the short Guillotine soak), read as "killed by orbs someone else set off (Venom Rupture)". Pull 23 at 7:29 Schooty: Venom Rupture 809k 1.4 s before, read as Gravebound "picked up the last soul fragment". Pull 24 at 7:02 Shockabunga: Venom Rupture 827k, read as Coalesced Venom. 10-boss log Coiled Altar fight 14 at 2:13 Blueprínt: Guillotine 909k, read as Venom Rupture. Twin Fangs pull 29 at 1:16 Flëxørçïst: Caustic Deluge 753k, read as "Caustic Globule: their own mistake". Pull 34 at 5:38 Ashdknight / Ironvan: Stone Breaker 590k / 552k, read as Deadly Venom / Toxic Fumes.
- Rule it should be: the killing hit is `d.big` when it exists (the biggest hit of the last 4 s, 1.5× the last tick), else the last hit. `ab`, `ownSame`, `mass` grouping (`abOf`), `forced`, `deathOwn`'s avoidable check, "Killed by", `coachDeaths`' and `deathNightItems`' grouping all use it. Keep Flex's Gravebound rule (Nov 1) only when the Gravebound hit itself is the big one.
- File: `engine.js explainDeaths()` (`d.big`, the mass loop's `abOf`), `ui.js deathVerdict()`, `deathOwn()`, `deathTag()`, `coachDeaths()`.

### D3. Any mistake of theirs in the 10 s before makes a death "their own", related or not (M, analysis chat)
- What's wrong: `d.links` keeps every own mistake from the last 10 s and `deathVerdict` says `own` when `ownM.length > 0`; `deathOwn` also takes any mistake within 1.5 s. A "Reached 7 stacks" note or a Low "Hit by Volatile Venom 3 times" then owns a death to something else, and the fix talks about the note, not the death.
- Where: Twin Fangs pull 29 at 4:18 Tyralien (tank): killed by Stone Breaker (69% of his damage), read as "right after a mistake on Eternal Venom · Dodge mechanics to avoid extra venom stacks". Pull 14 at 5:37 Badbunny: Melee death, link "Eternal Venom reached 7 stacks" → own. Pull 9 at 2:56 Earthday: killed by an unsoaked Caustic Globule (a Raid mistake), own because of "Reached 7 stacks" at the same second. Thursday pull 26 at 1:39 Dragooned: Axegrinder death, fix "Give green orb carriers 5 yards of room" (the Low Volatile Venom link 4 s earlier).
- Rule it should be (the checklist's step 5 already says "about the hit that killed them"): an own link counts only when its mechanic is the killing hit, or a known chain to it (Soul Sever → Gravebound, ghost touch → Malevolent Resonance, Caustic Waves → a hatched Viper, a soak they stood in, Extinguish without a mote, Suffocating Darkness → Suffocation). Stack-count and "more than 9 in 10 raiders" notes never own a death. `deathOwn`'s "any mistake within 1.5 s" fallback goes the same way.
- File: `engine.js explainDeaths()` (`mine`, `d.links`), `ui.js deathVerdict()` (`ownM`), `deathOwn()`.

### D4. A raid-wide failure that IS the killing hit still reads "their own mistake" or "too fast, nothing to fix" (M, analysis chat)
- What's wrong: the avoidable list is checked before the Raid mistake. An unsoaked Caustic Globule exploding on 19 players (a Raid High mistake) kills two → "their own mistake", because Caustic Globule is on the avoidable list. Stone Breaker is a tank mechanic (the guide: the tank stands in each slam; missed = raid damage), so 17 raiders hit read "Too fast to react: nothing to fix on your side" while the tank's "Missed Stone Breaker circle 1: it hit 17 players" is logged separately.
- Where: Twin Fangs pull 9 at 2:56 Volkovod and Earthday (own), pull 16 at 4:03 Hobbz and Dragooned ("Stone Breaker was too fast to react to"), pull 14 at 5:37 (6 Stone Breaker deaths, tank Ironvan's missed slam). Thursday pull 32 at 7:04 Komo (the orb collapse, D2).
- Rule it should be: when a Raid mistake (or another player's High mistake) names the killing hit within 4 s before, the death is `raid` / `forced` with that player's name, before the avoidable list and before `fast`: "Not on you: nobody soaked the Caustic Globule." / "Not on you: Ironvan missed Stone Breaker slam 1." One shared "who missed this job" lookup with W2 / W13.
- File: `ui.js deathVerdict()` (the order of `forced` / `own` / `raid`), `engine.js` Twin Fangs module (Stone Breaker: the tank's miss as the raid's cause).

### D5. The Guillotine target who dies with no external is "their own mistake" twice (S, analysis chat)
- What's wrong: the target of a full 5-soak gets two High mistakes at once ("Died in the Guillotine soak." and "Was the Guillotine target with no external or immunity and died."), and the death is `own` in full with the fix "Soakers need a personal defensive or an immunity, and the target needs an external." The guide says the target gets BoP / Spellwarding / an immunity plan (the raid's job); the soakers' defensive is theirs.
- Where: Thursday pull 11 at 2:13 Komo, pull 21 at 2:13 Dashtoswirly, pull 29 at 7:32 Larryg (all a first Guillotine, dead in 0.5 s to a 64-98% hit).
- Rule it should be: one mistake per death. A target with no external: `shared` (half: they could immune or press a defensive) and the external's owner named from the note when there is one; a soaker who dies in a full soak with a defensive ready: `own`, fix "Press a defensive for the soak"; with nothing ready: `nothing`.
- File: `engine.js` Coiled Altar soaks (~3867-3872), `ui.js deathVerdict()`.

### D6. The tank who takes the second frontal is blamed; the guide says the other tank taunts (M, analysis chat)
- What's wrong: a tank dying on stack 2-3 of Sever / Soul Sever / Blighted Sever reads "their own mistake · On the second stack, use a big defensive and get an external, or swap." The Coiled Altar guide: "the off-tank taunts just before the frontal" and "2 stacks survivable only with 2 externals". The same pattern on every boss: Twin Fangs "Took a second Ravage with the first one's debuff still up", Kith'ix "Took Dark Devastation with Devastated still on", Twin Fangs "Took a second Dripping Fangs", Nymrissa's Water Jet are all logged on the tank who took the hit, never on the tank who didn't taunt.
- Where: Thursday pull 29 at 8:22 Vandagos (Blighted Sever stack 3, 44% → dead in 0.4 s, no defensive left: own), pull 18 at 6:43 Tyralien (stack 2, Divine Shield and Lay on Hands ready: own is fair there).
- Rule it should be: a second-stack frontal names the tank who should have taunted (the other tank, alive, without the debuff) as the mistake; the tank who died is `shared` when a defensive or external was ready and `raid` (the swap's) when not. Deaths and the Mechanics rows use the same rule (see area 3).
- File: `engine.js` tank-swap checks (Coiled Altar `tankfront`, Twin Fangs Ravage ~1858, Kith'ix ~2438, Dripping Fangs ~2985, Nymrissa ~2260), `ui.js deathVerdict()`.

### D7. Three death counts for the same pull (M, analysis chat)
- What's wrong: the Debriefing Deaths tile shows every death up to the call (`deadAtCall`, ≤ call + 0.5 s), the Report card banner shows `deathCount().n` (counted deaths minus mass deaths), Graphs shows `v.counts && v.on` (on the player, halves included), the Report card's execution score counts `own` and `ready` only, the player page's "N on them" counts halves, and the coach's night line counts `kept.length` (mass included). `deathVerdict` cuts at call + 0.05 s while `deadAtCall` cuts at + 0.5 s.
- Where: Thursday pull 23: tile 19, Report card 6 (with "13 in mass wipes"), Graphs 3. Over the night: coach "232 deaths before the wipe filter", Report card 79.
- Rule it should be: one count set, written once (`deathCount`) and read everywhere: dead at the call (the big number), on the player (the second number: `own` + `ready` whole, halves as "½"), mass deaths and after-the-call as the small print. One cut: call + 0.5 s (the brief's rule) in `deathVerdict`, `keptDeaths`, `keptMistakes` and `deadAtCall`.
- File: `ui.js deathsTile()`, `deathCount()`, `coachDeaths()`, `gbDeathOk()`, the Report card (~17586, ~17615), `rcnPlayer()`.

### D8. Sixteen defensives have no "would it have saved them" model, so they never count as ready (M, analysis chat)
- What's wrong: `deathSaves` marks a defensive `unknown` (never ok) when it is in neither `SAVE_HEAL` nor `PERS_DR`: Renewing Blaze, Alter Time, Greater Invisibility, Mirror Image, Touch of Karma, Evasion, Vampiric Blood, Dancing Rune Weapon, Last Stand, Eye of Tyr, Shield of Vengeance, Fortitude of the Bear, Lichborne, Fiery Brand, Metamorphosis (Vengeance), Fireblood. A player who sat low with one of those ready reads "nothing they had would have saved them" or "nothing left to press" (half) instead of `ready`. Evokers' only self-heal and Windwalkers' main defensive are among them.
- Where: Thursday pull 16 at 5:13 Phartsy (Touch of Karma "no?"; `ready` only because of the Healthstone), pull 16 at 5:09 and pull 12 at 5:00 Dragooned (Alter Time "no?"), Twin Fangs pull 16 at 4:08 Badbunny (Evasion "no?").
- Rule it should be: every `DEFENSIVES` entry has a save model from the spell's own data (the helper looks each up the way PERS_DR was built: a heal share, a damage share, an absorb, or an immunity; Evasion counts against melee only); `unknown` goes away, so no button is quietly dropped.
- File: `engine.js SAVE_HEAL / PERS_DR / deathSaves()`.

### D9. "Ready" names one button, the fix another (S, analysis chat)
- What's wrong: the verdict word lists defensives first ("Crimson Vial and Cloak of Shadows still ready"), `deathFix` takes the Healthstone first ("Use your Healthstone when you drop under half…").
- Where: Twin Fangs pull 16 at 4:08 Badbunny; Thursday pull 16 at 5:13 Phartsy.
- Rule it should be: one order, the cheapest save that works first (the engine's heals-first sort, `svH`), used by the word, the Debriefing line and the fix.
- File: `ui.js deathVerdict()` (`items`), `deathFix()`.

### D10. A death to the pull's wipe mechanic is half on the player (S, analysis chat)
- What's wrong: Eternal Nightfall (the unbroken shield, the pull's root cause and wipe call) killed two before the call; both read "the raid's mistake (Phase changes), but Ice Block / Crimson Vial was ready" (shared, half).
- Where: Thursday pull 31 at 5:23 Dragooned and Zaffia.
- Rule it should be: a death to the mechanic `wipeMech()` / `rootCause` names is `raid` (weight 0): Why we wiped already blames the raid for it.
- File: `ui.js deathVerdict()` (the `raid` branch), `wipeMech()`.

### D11. Odd killers: "Killed by Time Dilation", "by " and a melee one-shot at 0:01 that "nothing would have saved" (S, analysis chat)
- What's wrong: Time Dilation (an Evoker external) logs the damage it held back as its own, so a tank reads "Killed by Time Dilation". A death with no hit in the recap reads "by " (empty). A 105% melee hit at 0:01 with no health history reads `nosave` instead of `fast`.
- Where: Thursday pull 16 at 5:15 Vandagos (Time Dilation); 10-boss log Sszorak fight 51 at 0:01 Jordodk (empty); Twin Fangs pull 12 at 0:01 Kargaryen (nosave).
- Rule it should be: Time Dilation damage is read as the hit it held back ("Soul Sever, held back by Time Dilation"); no hit logged → "died with no hit logged" and no verdict word; a hit of 100%+ with no health history is `fast`.
- File: `engine.js explainDeaths()` (`d.ability`, `d.fast`), `ui.js deathVerdict()`.

### D12. The Deaths checklist (the gospel) no longer matches the code (S, docs, analysis chat)
- What's wrong: `notes/Guides/Deaths - checklists.md` step 1 still has "their own avoidable death after the wipe filter still counts while fewer than a quarter are dead" (removed Nov 5, `late = false`), and step 5 says "a tiny dodgeable tick at the end is not enough" while the Oct 31 rule makes any avoidable killing blow their own (`deathOwn`, "round 425"). The `forced`, `noheal` and `nosave` verdicts aren't in section B's table.
- Rule it should be: the checklist is updated with the decided rules (and with D2-D4 once built), so the next audit has one truth.
- File: `notes/Guides/Deaths - checklists.md`.

### D13. For the record (no fix)
- 995 deaths over 60 pulls and 10 bosses: no errors, no "undefined". Mass deaths (3+ in 1.5 s to the same hit) read as one raid event everywhere, with the cause ("because a purple orb exploded into other orbs"). Mind-controlled deaths read "shared with the CC team", and the guide confirms the cancel macro is the player's part. Healthstone and potion are "ready" only after 2+ s at or under 35%; Dreadful Presence slides are flagged with the stone ready (pull 16 at 5:13); a 10 s slide with Lay on Hands ready is a healing gap "with Lay on Hands ready" (pull 24 at 5:21). Kills: the last 20 s don't count (Kith'ix kill fight 31: 8 Nullify deaths at 4:17-4:32, info only); earlier kill deaths are judged like a wipe's. Caustic Waves, Noxious Ground, Toxic Deluge, Twisted Appendage, Whirlpool and Extinguish-without-a-mote deaths read as their own with the right fix.

### Order to fix (my call)
1. D2 + D3 + D4 together (what killed them, which mistake counts, the raid's failure first): they change most verdicts and must land as one rule.
2. D1 (the wrong sentence on 34 deaths a night) and D7 (one death count).
3. D6 (the taunting tank) with area 3's tank-swap rows.
4. D8 (save models for every button), D5, D10.
5. The wording set: D9, D11; then D12 (the checklist).

## 3. Mechanics

How the site judges mechanics today: `engine.js PACKS` (~182-290, the generic rules per boss: avoidable / debuff / interrupt / bossBuff / stacks / raidFail, matched by spell ID or by name) and `MODULES` (~694-780, one `build*()` per boss with its sections, maps, Pace card and a `diag` Data check). Every mistake goes through `M()` into `r.mistakes`; `strictView()` (~3640) regrades by strictness; `ui.js keptMistakes()` cuts at the wipe call; the Report card judges each mechanic against `TOP_MECH` (~30988, `mechJudge` / `mechTally` / `mechNight`), the avoidable panel against `AVOID_BASE` (kill bars by time), the Deaths and kit tiles against `RATE_BASE`, the wipe call against `WIPE_LINE` / `WIPE_MECH`.
Sweep: the same 60 pulls (Thursday Coiled Altar ×22, the 10-boss log ×30 with 9 kills, Twin Fangs ×8 with 1 kill) through the real engine (scratch `audit3.js` → mistakes, sections, Data check per pull; in the shared notes folder, deaths-audit/). No module errors on any pull; every boss builds its sections.

### M1. Every soaked Catalytic Bile on Vashnik is logged as a miss (S, analysis chat)
- What's wrong: the pack rule `raidFail 1282616` ("landed with nobody under it and hit the whole raid") also matches by NAME, and the soaked bile's splash (1282602, the players within 6 yards) is called Catalytic Bile too. So every soak logs "Catalytic Bile went off and hit 5 players for 760K" (Low), while the module's own Catalytic Bile section on the same pull says every impact was covered (verdict good). The Data check shows 1282616 appeared 0 times on the kill; `STRICT_NOTE` already lists this row as one "more than half the top-100 kills have too".
- Where: 10-boss log, Vashnik kill fight 43: 6 of them (0:42, 1:21, 2:06, 2:45, 3:30, 4:09), one per Malignant Catalyst.
- Rule it should be: a rule with spell IDs matches by ID only (`ruleFor`'s name fallback is for rules without IDs); the module's Catalytic Bile section is the one judge. Same hazard for every pack rule whose IDs are the hit but whose name is also the cast (Final Ascension 1292780 vs 1292779, Frost Burst, Noxious Blast).
- File: `engine.js` PACKS Vashnik, `ruleFor` / the pack matcher (~6220).

### M2. The same event is logged twice (M, analysis chat)
- What's wrong: several events produce two mistakes, so Also hurt (before its DOM dedupe), the Report card's Mechanics rows, "Nth time tonight" and the Debriefing counts all double them. Final Ascension: the pack's raidFail and the module's row (Lost Explorers kill fight 48, 3:06 ×2 High). Frost Burst: the module logs "1 player died to Frost Burst…" twice at 2:45 (Nymrissa kill fight 62). Revenge: "A Weakened Doomscale gained Revenge at 5:10" twice (Ula'tek kill fight 25). Malevolent Resonance: two High rows per player for one collision ("Their ghost touched another ghost" + "Hit by Malevolent Resonance (1.2M), and died"; Thursday pull 24 at 4:34/4:39 Phartsy, pull 29 at 8:32 ×2 players). Guillotine target: two High rows (D5).
- Rule it should be: one event, one mistake. `M()` drops a mistake with the same mechanic, player and moment (within 2 s) as one already logged; pack raidFail rules a module also covers are removed from the pack (Final Ascension, Catalytic Bile, Noxious Blast, Shatter, Pulsing Tides, Unending Tides, Malignant Burst) and the module's row keeps the pack's tip.
- File: `engine.js M()`, PACKS, `buildNymrissa` (~2186), `buildUlatek` (~5297), `buildLostExplorers` (~3104), Coiled Altar ghosts (~3936).

### M3. One mechanic, three names (S, analysis chat)
- What's wrong: a missed Visceral Burst kick on Twin Fangs is the mechanic "Missed interrupt" (the generic `r.kicks` path, ~7326), while the Coiled Altar's is "Wail of Terror" and Nek'zali's "Soulcoiler's Curse" (pack interrupt rules). A whirlpool death at Pop! on Nymrissa is "Wild Bite" for one player and "Swirling Whirlpools" for the next, same second, same detail ("Died to Swirling Whirlpools at Pop! 1"). Nek'zali's "Soul Transfer High: Got hit once." has no amount (the hit was absorbed) next to "Got hit once, for 954,587 avoidable damage".
- Where: 10-boss log Twin Fangs kill fight 58 at 4:24; Nymrissa kill fight 62 at 1:57 (Drizzypink) and 1:58 (Ninjaristic); Nek'zali kill fight 5 at 1:48.
- Rule it should be: the mechanic is always the boss spell ("Visceral Burst", with "(Kick)" in the card title), so W2's shared "who missed this job" lookup and the Report card rows work the same on every boss; one name per event; an absorbed hit reads "Got hit once (absorbed)".
- File: `engine.js` ~7326 (`'Missed interrupt'`), `buildNymrissa` Pop! rows, the avoidable detail builder.

### M4. Eternal Venom's "Reached 7 stacks" marks half the raid Medium at the end of every kill (M, analysis chat)
- What's wrong: the stacks rule's threshold is 6, so at the end of both kills 10-11 of 20 raiders carry a Medium "Reached 7 stacks (aim to stay at or under 6)". The guide says stacks are lethal at 10 on Mythic (11 Normal) and are cleared at Ravenous Feast; the top-kill table itself says 38-47% of top raiders get this row. 106 of these over 10 Twin Fangs pulls, the most of any mechanic on the site. And they own deaths they have nothing to do with (D3).
- Where: 10-boss log Twin Fangs kill fight 58 at 4:12-4:35 (10 players); Twin Fangs kill pull 37 at 5:46-6:01 (11 players).
- Rule it should be: judge stacks by time like the avoidable bars (the 20 fastest kills' stacks at each minute, `AVOID_BASE` style): amber above the bar, red at 10 or a death to the venom; the first 6-7 stacks in the last minute of a kill are nothing. Flex's hold list (`mechanics-fix-queue` item 12, "Eternal Venom 8-9 yellow") is the same ask.
- File: `engine.js` PACKS Twin Fangs (`stacks`, threshold 6), the stacks rule (~6289), `TOP_MECH`.

### M5. Four bosses (and every Heroic) are judged without the top-kill tables (M/L, analysis chat)
- What's wrong: `TOP_MECH` has Mythic tables for six bosses only (Nymrissa, Twin Fangs, Coiled Altar, Nek'zali, Ula'tek, Kith'ix). Sszorak, Vashnik, Entombed Sentinels and The Lost Explorers, and every Heroic pull, fall back to `mechJudge`'s stricter rule (red for a death or a quarter of the pulls, amber for anything else), so a Sszorak kill with 12 Tempest Medium rows marks 12 raiders amber with no "most raids get clipped by this too". `RATE_BASE` (the Deaths tile's and the kit tiles' top-kill parses) exists for The Coiled Altar Mythic only. `AVOID_BASE` is Mythic only, so Heroic raiders are judged against Mythic kill bars (the Boss coverage table's ❌ column). Flex's rule (`all-ten-bosses-rule`): nothing boss-specific is done until all 10 have it.
- Where: 10-boss log Sszorak kill fight 53 (Tempest ×12 Medium, Virulence ×6), Vashnik kill fight 43 (29 Low rows), Entombed Sentinels kill fight 40 (39 rows).
- Rule it should be: build the three tables for all 10 bosses on Heroic and Mythic with the recipes already written (`tm/topmech.js` + `gen_top.js`, `kit/kitbase.js`, `av/genbase.js`, memory `mechanics-judging-vs-top`, `kill-baselines`); until a boss has them, its Mechanics rows say "not judged against top raids yet" instead of amber.
- File: `ui.js TOP_MECH / RATE_BASE / mechJudge`, `engine.js AVOID_BASE`, `notes/Guides/Boss coverage.md`.

### M6. Tank-swap rows blame the tank who took the hit, on every boss (M, analysis chat; same fix as D6)
- What's wrong: "Took a second Ravage with the first one's debuff still up" (Twin Fangs ~1858), "Took Dark Devastation with Devastated still on" (Kith'ix ~2438), "Took a second Dripping Fangs" (Vashnik ~2985), Water Jet "right after Water Jet" (Nymrissa ~2260), "Died to Blighted Sever on stack 3" (Coiled Altar) all land on the tank holding the boss. The guides say the other tank taunts before the hit (Coiled Altar: "the off-tank taunts just before the frontal"; Twin Fangs: "Swap after each set"; Kith'ix: "Devastation swaps").
- Rule it should be: the row names the tank who should have taunted (the other tank, alive and without the debuff), with the fix "Taunt before the next <spell>"; the tank who took it is named only when no other tank was alive. Deaths read the same (D6).
- File: the five tank-swap checks above, `ui.js deathVerdict()`.

### M7. Four ghosts missing one Soul Sever is four player mistakes (S, analysis chat; check against the guide)
- What's wrong: "Their ghost wasn't in Soul Sever at 5:04, so it stayed alive" is logged Medium for every player whose ghost the frontal missed; when 3-4 ghosts miss the same cast at once it is the frontal's aim, not four players. 55 such rows on Thursday (the most common Medium of the night).
- Where: Thursday pull 12 at 5:04 (Dragooned, Volkovod, Trëèflêx, Phartsy at once), pull 11 at 3:05 / 3:36.
- Rule it should be: one or two ghosts missed → the players' rows as now; three or more in one cast → one row for the cast ("Soul Sever at 5:04 missed 4 ghosts: aim it through the cluster") on the tank who aimed it, and the players' rows become notes. The guide's "aim it through the cluster" line is about Sever's orbs; confirm with Flex how Wolfthorn aims Soul Sever before building.
- File: `engine.js` Coiled Altar `soulsever` section.

### M8. Tracked spells never seen in a real pull (S, analysis chat)
- What's wrong: the brief's rule is that every tracked spell ID appears in a real 12.1.5 pull. Across the 60 pulls these never did: Ula'tek Malignant Shell 1295360, Mother's Boon 1299764, Calcified Corpse 1306119 (10 pulls and a kill; the wipe rule uses a different ID for the same thing, `WIPE_MECH` "Serpent's Bite" 1318329); Vashnik Catalytic Bile (unsoaked) 1282616; The Lost Explorers Relic Rupture 1310028, Explosive Surprise 1297625, Bounce 1299854; Sszorak Unbound Ferocity 1296898; Nymrissa Shatter 1313456, Pulsing Tides 1258894 / 1271380; Entombed Sentinels Cultivated Burst 1284941; Nek'zali Swirling Spirit 1300239, Uncoiled Rage 1284034. Most are fail-only spells a kill never shows, so this is "unconfirmed", not "wrong".
- Rule it should be: confirm each against a wipe in the log library (the saved `*/ev` folders hold hundreds of pulls) and mark the ones no pull ever contained as unverified in the Data check and in the guide's research note; settle Calcified Corpse on one ID.
- File: `engine.js` module ID tables (UL_IDS, VS_IDS, LE_IDS, SZ_IDS, NY_IDS, ES_IDS, NZ_IDS), `ui.js WIPE_MECH`.

### M9. The Guillotine target's two rows and the soaker's "own" (see D5) and the venom stacks owning deaths (see D3) (cross-reference, no new fix)

### M10. For the record (no fix)
- 60 pulls, 10 bosses, no module errors or "undefined"; every boss has a Data check, maps, a Pace or push check on 8 bosses, and the soak tolerances follow the agreed rule (Unstable Miasma "6 had 5 soakers, Mythic needs 8" is Medium, not red). Kith'ix: Extinguish without a mote is Low when they lived and High when they died, Light's Embrace motes are counted. Stone Breaker's tank row ("Missed Stone Breaker circle 1: it hit 17 players", fix "Tank: stand in each of the three circles in order") is right; its victims' deaths are D4. Also hurt, the Report card rows and the Timeline marks all read the same `keptMistakes` at the same strictness, so they agree except where M2 doubles an event (Also hurt hides the double in the DOM; the others don't).

### Order to fix (my call)
1. M1 + M2 (false and doubled mistakes): small, and they change counts on every tab.
2. M5 (the tables for all 10 bosses, Heroic too): the biggest fairness gap.
3. M4 (Eternal Venom by time) and M6 (the taunting tank, with D6).
4. M3 (one name per mechanic, needed by W2's lookup), M7 (after Flex confirms), M8 (confirm the IDs).

## 4. Rotations

How the Rotation tab judges today: `ui.js GEN_SPECS` (~26465, one entry per spec: pre-pull, opener, priority list, cooldowns, DoTs, procs, windows) run by `genRun()` (~25594) and graded against `SPEC_TOP` (~21288, the top players' middle per boss) and `GEN_TUNE` (~27577); four specs are hand-written (`hpalChecks`, `rdruChecks`, `pevkChecks`, `pdemChecks`). All 40 raid specs have a check set and all 40 have a guide in `notes/Guides/Classes`. The coach (`spcCoach`) orders fixes red → real cost (20K and 1% of output) → weight, as the Oct 22 importance pass set.
Sweep: the Nov 2 night `zZEe97dQPwLRjEiy8v4ZUw` pull 1 (8:04 Coiled Altar Mythic wipe), all 20 raiders through the real `__wla.specRun` in node (the `tops/uiload.js` recipe, memory `rotation-checks-offline`; the scratch script is `audit4.js` in the shared notes, deaths-audit/). The saved night has no combatant info, so hero trees come from `heroBy` guesses and the unknown-cooldown `wait` flag is on; the row logic is the same as on the site. 20 specs covered: Affliction ×2, Arcane, Arms, Augmentation, Balance ×2, Blood, Devourer, Elemental, Holy Paladin, Holy Priest, Marksmanship, Mistweaver, Preservation, Protection Paladin, Restoration Shaman, Retribution, Subtlety, Unholy.

### R1. A forced raid-wide gap counts against everyone's "Always be casting" (M, Rotation helper)
- What's wrong: 13 of 20 raiders carry a warn or red Always be casting / pressing row whose longest gap is the same moment, 2:01-2:23 "while moving" (the second Guillotine's run-out before the phase change at 2:29). Movement the fight forces on the whole raid is read as 13 personal gaps; Stepxo's row is red (60% vs 75%) on it. The priority list already excuses "the boss out of reach" (nobody in the raid hitting the boss for 6 s, Oct 22); the casting check doesn't.
- Where: Nov 2 pull 1: Najbolji 9 s at 2:06, Stepxo 9 s at 2:10, Avoka 17 s at 2:14, Contagis 13 s at 2:17, Lthi 13 s at 2:19, Belitemare 11 s at 2:23, Ameriö 4 s at 2:01, and six more.
- Rule it should be: a gap is excused when half the raid or more also stopped for 4 s+ in the same window (the raid was moving or the boss was away), the way `rcIdle` / "boss out of reach" already excuse the priority list; the row then names the next-longest gap that was theirs alone ("Your longest gap alone was…" exists as `gy` for the "stay on the boss" tip and should drive the grade too).
- File: `ui.js genRun0` abc (~25900), `activityIn()`, `rcIdle()`.

### R2. One missed cooldown out of three is red (S, Rotation helper)
- What's wrong: `cd:` rows grade uses / possible against the top players' rate with the usual bars, so 2 of 3 Summon Darkglare (67% vs top 80%) and 4 of 6 Arcane Surge are red while the pull ended in a wipe at 8:04 (the "possible" count assumes the pull's full length). One missed press on a 2-3 minute cooldown is normal in a wipe. The importance pass already said small samples are never red for healers' "cooldowns into the big hits" (under 3); the same honesty is missing here.
- Where: Nov 2 pull 1: Ataxophobia Summon Darkglare 2/3 and Malevolence 4/6 (red), Simione Arcane Surge 4/6 (red), Najbolji Summon Darkglare 3/4 (warn).
- Rule it should be: with 4 or fewer possible uses, one miss is amber at most; red needs 2+ misses and 10+ points behind the top players (the `proc-reliant-not-major` rule's "never red within 10 points"). On a wipe, the last window that opened under 20 s before the end isn't a possible use.
- File: `ui.js genRun0` cooldown rows (~25890, `poss`).

### R3. "Guardian Spirit on a tank" is red when both went on raiders (S, Rotation helper)
- What's wrong: Holy Priest's `tgt` check `gstank` wants 50% of Guardian Spirits on a tank and is red at 0 of 2. The guide says "best on a tank before big damage; coordinate", not "only on tanks", and the site's externals rule (Oct 22-23, `externals-by-need`) is that an external is judged on the moments someone was in danger, never by who got it. A Guardian Spirit that saved a raider at 20% is right play and reads red.
- Where: Nov 2 pull 1, Adelyne: 0/2, red; score 89.
- Rule it should be: judge each Guardian Spirit on need (the target was under 35% or took a 50%+ hit within 3 s, or a tank before a tank hit) like the Report card's externals; the "on a tank" share becomes a note ("2 on raiders, 0 on tanks"), never red.
- File: `ui.js GEN_SPECS['Holy Priest'].tgt` (~27342).

### R4. A healer's wasted procs are red on Preservation Evoker (S, Rotation helper; decide)
- What's wrong: the importance pass set "healers' wasted procs are never red (Holy Paladin's Infusion of Light is the exception)" and the shared engine follows it (`D.unitN === 'healing'` → warn at most). The hand-written Preservation page marks Essence Burst red (19 of 111 wasted, 6.64M, 4% of healing). The Preservation guide does say "never waste Essence or Essence Burst", so this may be a second exception; today the two healers' pages follow different rules without saying so.
- Where: Nov 2 pull 1, Speedlord: `p:Essence Burst` red; Bordrin (Mistweaver) Spiritfont 8 of 35 wasted: warn.
- Rule it should be: one rule, written in the importance guide: either Preservation joins Holy Paladin as a named exception (and the row's "how" says why), or it follows the healer rule (amber).
- File: `ui.js pevkChecks`, `notes/Guides/Rotation check importance - all specs.md`.

### R5. Five specs still have no top-player numbers, and their rows don't say so (M, Rotation helper)
- What's wrong: `SPEC_TOP` has only the score key for Fire Mage, Fury Warrior, Feral Druid, Survival Hunter and Outlaw Rogue (6-7 bosses, 1 key), so every one of their rows is graded on default bars (the Oct 25 audit's Group 1, unchanged since); Destruction and Enhancement have 7 bosses, Guardian / Unholy / Vengeance 8. A row graded on a default bar looks exactly like one graded against the top players.
- Rule it should be: run the marks recipe (`rotation-marks-from-library`: specscan.js → marks2.js → patch_top.js, ~5 min a spec) for the five, then the thin ones; until then a row with no top value says "no top-player number yet" in its line and is never red (the checklist bar line is already missing for them; make the words match).
- File: `ui.js SPEC_TOP`, `genRun0` (the `top` line).

### R6. Grey rows carry their reason only in the opened detail (S, Rotation helper)
- What's wrong: ungraded rows say why they're ungraded in their `how` text ("Not graded: the top tanks let most of it go when they are healthy", "It is not graded…"), which shows only when the row is opened; the collapsed line reads like a judged row with no colour: "Aura Mastery uses 2/3 · top 100%", "Divine Hymn uses 3/4 · top 80%", "Life Cocoon uses 9/10", "Spirit Link Totem uses 2/3", "Shining Light 18 of 34 wasted", Balance's "Refreshed too early 28/37, throwing away about 204 seconds of damage over time" (ungraded through `clipInfo`, while Elemental's same row is red at 10/14).
- Where: Nov 2 pull 1: Ameriö, Adelyne, Bordrin, Zips, Dernsblade, Shudidruid.
- Rule it should be: the brief's "grey rows are honest about why": the collapsed line ends with the reason in five words or fewer ("· judged on the big hits", "· not graded: top tanks let it go", "· Eclipse refreshes are planned"), and a raid cooldown's row says it is judged in "Cooldowns into the big hits" instead.
- File: `ui.js genRun0` (`add(..., 'na', ...)` rows, ~25890-26070), the checklist renderer `rck-r`.

### R7. Tank active-mitigation bars are still defaults (S, Rotation helper)
- What's wrong: Protection Paladin's "Shield of the Righteous uptime 70% of the time you were tanking" is red with no top value on the row; the Oct 25 audit moved mitigation to tanking time but left `GEN_TUNE`'s bars from whole-fight top numbers ("re-measure while tanking when top kills are next gathered"). Not re-measured since.
- Where: Nov 2 pull 1, Dernsblade: `up:Shield of the Righteous` red, no top.
- Rule it should be: measure the six tanks' mitigation uptime while tanking on the saved top kills (`probe.js` with `tank: true` ups) and set the bars from them; until then amber at most.
- File: `ui.js GEN_TUNE`, `GEN_SPECS` tank `ups`.

### R8. For the record (no fix)
- 20 of 20 raiders get a page with a score, no errors or NaN; one card per spell holds (the four Incarnation rows merge in `spcGroupTiles`); costs read "(under 1% of yours)" when small and never lead the order; Power Infusion rows follow the PI rules (3 casts on the Affliction Warlock, each "with Summon Darkglare"); Innervate / Source of Magic are never red; the Protection Paladin opener's Hand of Reckoning step matches the guide; Mana at the end is ungraded on a wipe and says so; Augmentation's support damage rows are facts, not grades. The Oct 25 class-guide audit's open items (14 yellow, the remaining missing checks) stand as written there and aren't repeated here.

### Order to fix (my call)
1. R1 (forced raid-wide gaps): it touches 13 of 20 raiders on one pull.
2. R5 (top numbers for the five specs) and R7 (tank bars): honest grades on the thin specs.
3. R2, R3, R6; then R4 once Flex decides.

## 5. Automated planning (a shorter sitting: code and rules, no browser sweep)

What was read: the Plan tab's healing-cooldown planner (`ui.js ndzCdPlan` / `ndzCdPlanV1`, data `NDZ_CDSTART` big hits, `NDZ_TLDMG` damage profiles, `NDZ_CDHAB` top-raid habits, `NDZ_CDPOW` power, `NDZ_CDK` kinds and lengths, `NDZ_CDRECH`, `ndzCdBack`), the job picks (`ndzKickOf`, `NDZ_KICK_PLUS`, the Twin Fangs / Coiled Altar pickers), the gear check (`GEAR_ENCH`), the Report card's raid-cooldown and externals tables (`RCD_CD`, `RCD_SPEC`, `HEAL_CD_BY`), the raid-day rule (`raidDaysRule`, fixed Nov 6), and the kill-estimate pace chart (`pcx`, ~16140-16250).

### P1. The same cooldown has three lengths on three tabs (S, website builder + analysis chat)
- What's wrong: the Plan tab plans with `NDZ_CDK` / `NDZ_CDPOW` (Divine Hymn 120 s, Rewind 180, Darkness 180, Anti-Magic Zone 180), the Report card counts "uses of possible" and "ready" externals with `RCD_CD` (Divine Hymn 180, Rewind 240, Darkness 300, Anti-Magic Zone 120), and the Deaths rules' `DEFENSIVES` has Darkness at 300. Memory `healing-cd-logic` already notes the real gaps from logs are Divine Hymn 2:00 and Rewind 3:00 and that "RCD_CD elsewhere is wrong". So a Holy Priest's "Divine Hymn uses 3/4" on the Report card and the Plan's four planned Hymns in an 8-minute pull can't both be right.
- Where: every pull with those spells; Nov 2 pull 1 Adelyne "Divine Hymn uses 3/4 · top 80%" (8:04 pull: 4 fits 120 s, 3 fits 180 s).
- Rule it should be: one cooldown table (the engine's `CD_NAMES` / `cdName`, which both tabs already import), each length taken from the spell's tooltip or the shortest real gap in the log library and written once; `RCD_CD`, `NDZ_CDK[..][2]`, `NDZ_CDPOW[..].cd` and `DEFENSIVES` read from it. The helper verifies the four spells above first.
- File: `ui.js RCD_CD` (~29450), `NDZ_CDK` (~5707), `NDZ_CDPOW` (~5828), `ndzCdBack()` (~5636), `engine.js DEFENSIVES` (Darkness), `CD_NAMES`.

### P2. The Companion app's raid reminder still guesses its own raid days (S, In-game addon chat)
- What's wrong: Home and Plan share `raidDaysRule` plus the lead's override since Nov 6 (Wolfthorn: Wed + Thu); the Companion reminder keeps its own guess (memory `wolfthorn-raid-days`), so one place can still say Tue or Fri.
- Rule it should be: the Companion reads the team's raid days from the site (the override first, then `raidDaysRule`) and never guesses alone; one rule, three places.
- File: Companion reminder code; `/api/teamplan` or a small `/api/raiddays`.

### P3. The Deaths and Mechanics fixes change what the Plan automation reads (cross-reference, no new fix)
- "Draft a note from your pulls", the auto job picks' "in 9 of 11 pulls" counts, the Report card's Mechanics and Deaths tiles and the Companion card all read `keptMistakes` / `deathVerdict`. D2-D4, D7, M1-M3 and M6 change those inputs: a doubled Final Ascension or a "Missed interrupt" row named differently from "Wail of Terror" (M3) is what the note drafter counts. Land areas 2-3 first, then re-run the draft-note tests (`draft-note/` in the shared notes).

### P4. For the record (no fix)
- Kicks: healers are never given a kick except a Restoration Shaman (`ndzKickOf`, spec 264), and Protection Paladin / Warrior get their extra kick utility named (`NDZ_KICK_PLUS`). The planner's big hits, damage profiles and top-raid habits cover all 10 bosses on Heroic and Mythic (`NDZ_CDSTART` 7-19 big hits a boss, phases per boss). The gear check's enchant slots were verified on Nov 6 against 16 top US Mythic raiders (`GEAR_ENCH`: head, shoulders, chest, legs, feet, both rings, main hand; the off hand is left out on purpose). Raid days: one rule for Home and Plan since Nov 6.

### P5. Not audited in this sitting (say so, don't guess)
- The planner's placement quality on real nights (cover / amber / red per big hit, stacking vs spreading), "Make the whole plan" and the job picks against each guide, "Pick who plays for me" and the bench, the Ready strip ("Could swap", kick counts, healer talents), NSRT import / export round trips, the My note lines' format, the Report card's letter grades and the kill-estimate curve, the Mythic+ run recap, and the Companion pop-up card's numbers. Each needs a browser pass on the practice link with a real roster and note (recipe: `plan-tab-round-recipe`, `plan-test-as-built`); about one sitting on its own. The brief's three questions for each (would a top Mythic raid lead accept the pick, does it say why, does it contradict another tab) still stand.

### Order to fix (my call)
1. P1 (one cooldown table): small, and it fixes a tab-to-tab contradiction raiders can see tonight.
2. P2 with the next Companion release.
3. P3 is the order of work, not a fix; P5 is the next audit sitting.

## Done so far (Nov 8)
Areas 1-5 written: W1-W16 (wipes, Main on Fable, morning), D1-D13 (deaths), M1-M10 (mechanics), R1-R8 (rotations), P1-P5 (planning, short). Sweeps: 60 pulls / 995 deaths on the three test logs through the real engine in node (scripts in the shared notes folder, deaths-audit/: audit2.js deaths, audit3.js mechanics, audit4.js rotations, sum.js / msum.js to read them). No browser screenshots were needed: every finding has a pull and a time to open on the site.

## 5b. Automated planning, the browser sitting (Flex: "make it happen i need this perfect")

Done on the practice link (next-debrief) with Wolfthorn's 20 raiders from Thursday's log, Mythic, "✨ Make the whole plan" on Nymrissa and The Coiled Altar, then the Healing cooldowns (chart + Big hits), Assignments and My note panels read in full; the live site's Plan tab was read with the Wolfthorn team imported through "Add my Warcraft Logs team" (Schooty, Sargeras). The guide for every call below is `notes/Guides/Bosses/7 The Coiled Altar.md`.

### P6. The Coiled Altar soak groups break the fight's own rules (L, website builder)
- What's wrong: the auto Guillotine groups put the same five raiders (Volkovod, Schooty, Larryg, Zaffia, Fourinches) on P1 Guillotine 1, P3 Guillotine 1 and P3 Guillotine 3, and Volkovod and Schooty on P1 Guillotine 2 as well. The guide: Guillotined (+500% to the next) is permanent on Mythic, so a raider soaks once unless an immunity covers them; immune classes soak the first so they can't be targeted by the next; Mythic needs at least 5 in every soak. Larryg (Arms, no immunity) is sent to three axes, Fourinches (Unholy, Anti-Magic Shell is magic only) to three, Zaffia (Cloak, magic only) to a P1 physical axe. P1 Guillotine 2 has only 4 soakers (Vandagos, Tyralien, Volkovod, Schooty), and two of them are the tanks, who hold the boss and take Sever at that time. P1 Guillotine 1 has 7. The site's own Mechanics rule would call Guillotine 2 "soaked by only 4: Execution".
- Where: practice link, The Coiled Altar Mythic, Assignments 2 (Guillotine soaks) and 3 (P3 Grim Guillotines), from "Make the whole plan" with Thursday's roster.
- Rule it should be: one soak per raider for the whole fight unless they can immune it (Divine Shield, Ice Block, Turtle, Netherwalk for any; Cloak / Anti-Magic Shell / Spellwarding only for the P3 shadow axes); five distinct groups across the 5 axes (2 in P1, 3 in P3) with 5-6 each, immunities on the first so they aren't targeted next, tanks never in a soak, the target's external and Zephyr from players not in that soak; when the roster can't fill five groups, the plan says so ("5 axes need 25 soaks; you have 20 raiders and 6 immunities: short by N") instead of reusing people. The planner's "What changed and why" box explains each pick (memory `auto-buttons-explain-swaps`).
- File: `ui.js` Coiled Altar job picks (`ndz-flow` / the `soakq` job, ~6374 area), `NDZ_*` Coiled Altar block.

### P7. Seven "Defensives" calls in four minutes (M, website builder)
- What's wrong: on Nymrissa Mythic the planner adds a raid-wide "Defensive · a call for everyone" at 0:10, 0:44, 1:03, 1:40, 2:40, 3:25 and 3:48, and on The Coiled Altar at 0:06 (a Medium hit, 6 s into the pull), 1:06, 1:52, 2:15, 2:29, 3:33, 4:17, 4:47, 5:25, 6:16, 6:54 and 8:04. Personal defensives come back every 1.5-3 minutes, so a call every 20-60 s can't be followed and teaches raiders to ignore the calls. The memory rule says raid calls are Defensives and Healthstones for everyone; it doesn't say every hit.
- Where: practice link, Nymrissa and The Coiled Altar Healing cooldowns → Big hits.
- Rule it should be: a Defensives call only on Very heavy hits (or a Heavy one with no raid cooldown on it), never two within 90 s, never in the first 15 s, at most about one per 2 minutes of fight; the Healthstone call once a pull on the worst bare moment (today it is once, at 3:29 / 2:15: right).
- File: `ui.js ndzCdPlan` (the `Defensive` / `Healthstone` call rows).

### P8. The heaviest hit gets the fewest cooldowns (M, website builder)
- What's wrong: Nymrissa Mythic: the Medium hit at 0:12 (2.0M/s) gets Zephyr, Rewind, Convoke and a Defensives call; the Very heavy hit at 2:02 (3.8M/s, the fight's worst) gets one Anti-Magic Zone; the Very heavy 1:30 and 3:39 get a Convoke each. On The Coiled Altar the Very heavy Venom Rupture at 1:52 gets one cooldown and the Medium Coalesced Venom at 0:06 gets one plus a Defensives call. The Oct 23 rule was "more uses first, then score", and the "spread" rule keeps a hit from hoarding; together they let early Medium hits take 3-minute cooldowns that a Very heavy hit two minutes later needed.
- Where: practice link, Nymrissa Healing cooldowns → Big hits (0:12 vs 2:02), The Coiled Altar (0:06 vs 1:52).
- Rule it should be: fill the Very heavy hits first (two or more cooldowns each, as the top raids do: 4.3 on the last P1 Venom Rupture, memory `healing-cd-power-research`), then Heavy, then Medium with what is left or already back; a 3-minute cooldown is never spent on a Medium hit when a Very heavy hit is inside its recharge; "more uses first" keeps holding, so the total stays the same.
- File: `ui.js ndzCdPlan` (the DP score: weight by the hit's class).

### P9. "Make the whole plan" plans one boss (S, website builder)
- What's wrong: the button on each boss page says "Make the whole plan" and the night strip calls it the whole night, but it builds only the open boss: after running it on Nymrissa, The Coiled Altar still said "No plan yet · 0 saved", and running it there saved "1".
- Rule it should be: either the night page's button plans every boss checked for the week (one "What changed" box per boss) and the boss page's button says "Plan this boss", or the name changes to match what it does.
- File: `ui.js` Plan night/boss buttons (`ndzBuildStart`, the "✨ Make the whole plan" label).

### P10. The orb carriers don't follow the guide's fourth carrier (S, website builder; check with Flex)
- What's wrong: the guide's Mythic plan says "Orb carriers: both Mages, off-tank, Evoker healer"; the auto picks give Boltzzx, Dragooned (the Mages), Tyralien (off-tank) and Komo (Affliction), with both Preservation Evokers as "Orb Helpers". Either the pick is right for Wolfthorn (then the guide line is stale) or the picker ignores the guide's class order.
- Where: practice link, The Coiled Altar Assignments 4 and 5.
- Rule it should be: the picker follows the guide's class list in order and says why when it can't ("no Evoker healer on tonight's roster: Komo carries"); the "What changed and why" box shows it.
- File: `ui.js` Coiled Altar orb picks (`NDZ_*` orbs), `notes/Guides/Bosses/7 The Coiled Altar.md` line 78.

### P11. Small things seen on the way (S)
- "Between hits" appears as a big hit ("2:22 Between hits · Very heavy", "3:49 Between hits · Medium") in the Big hits table: a filler window named like a mechanic. Name it "sustained damage" or fold it into the hit before it.
- The live Plan's Raid kit "Could swap" lists the same raider twice as two specs ("Optt (Disc) · Optt", "Fourinches · Raiyvenz · Fourinches (Blood)"): one line per raider, "Fourinches as Blood".
- The practice copy's plan night defaulted to "Sun 8" (today) with the Wolfthorn roster loaded; the live site shows "Wed 11". The night should be the next raid day as soon as the team's days are known (the raid-day rule exists; the practice copy didn't have the team's override).
- Planned cooldowns read "back after 1:00" for Convoke the Spirits and "back after 3:00" for Anti-Magic Zone; both go through P1's one-table fix and a tooltip check (Convoke is 2:00 unless talented, Anti-Magic Zone 2:00 baseline).
- "Pick who you are on Home first" blocks My note on a fresh copy: fine, but the line could offer the Home link.

### P12. For the record (no fix)
- The team import works in three steps with no typing beyond a character name; the roster groups by role and marks the alt (Trëèflêx as Flëxørçïst's, "guessed", honest). Kicks: 4 kickers per Spiteful Soulcoiler, no healers; Dreadmarch CC order is the guide's classes (Windwalker, Druid, Warrior ×2); raid markers match the guide (Phase 3 axe 1 at Star, 2 and 3 at Square, Dreadmarch at Square); Fragments soakers and curses are filled; Healthstone call once a pull; Spirit Erasure gets 5 cooldowns, as the top raids stack it. Nymrissa's planned hits are the real ones (Abyssal Rain, Frost Burst, Pop!) with plain tooltips.

### Order to fix (my call)
1. P6 (the soak groups): a plan that kills the raid is worse than no plan.
2. P7 + P8 (calls and the heaviest hits first) in one pass through `ndzCdPlan`.
3. P9, P10, P11.

## 6. Jobs: Ula'tek (Flex: "have it finish ulatek then")

Done on the practice copy (next-debrief, the Main roster of 20: Vandagos Prot Warrior, Tyralien Prot Paladin; Optt Holy Priest, Huservoker and Urgdragon Preservation, Trëèflêx Resto Druid; Fourinches Unholy, Raiyvenz Frost DK, Larryg Arms, Hobbz Ret, Dashtoswirly Havoc, Zaffia Sub, Phartsy Windwalker; Dragooned Frost Mage, Boltzzx Arcane, Shockabunga Ele, Kargaryen Aug, Komo Affliction, Volkovod and Schooty BM). "Plan this boss" on Ula'tek Mythic, then Heroic (the Who plays Mythic/Heroic switch), every job box and every pick's reason read from the saved plan. The live Wolfthorn plan on debriefme.io is locked to officers in this browser, so the picks were made on the practice copy with the same picker (`ui.js` Ula'tek picker 6423-6452, the fit pass 6497-6498 / 6526, the Heroic notes 6720-6724 at 49b75676). The guide is `notes/Guides/Bosses/8 Ula'tek.md`; the Guides tab's own Ula'tek page (`guides.js` 1906-1908) is quoted where the Plan contradicts it.

### J1. Serpent's Bite: the Plan says "target plus 4" and sends 12 fixed soakers; the Guides tab says three soakers, stacked, in sets (L, website builder)
- What's wrong: the Plan card's tip reads "On Mythic the minimum soak is the target plus 4, with a big defensive" and fills Bite Melee / Bite Ranged / Bite Healers with 4 each (Fourinches, Larryg, Hobbz, Dashtoswirly / Dragooned, Shockabunga, Kargaryen, Komo / Optt, Huservoker, Urgdragon, Trëèflêx): the same 12 people soak every one of the three Bites (6:37, 7:41, 9:25), each time taking the ~2 million hit and the 18 s DoT again. The site's own guide page says the opposite: "Serpent's Bite (Three soakers, stacked): the three targets stack, and three assigned soakers (one backup) stand on all three circles at once… Since Oct 6 three soakers clear a set. Sets: two Mages and a Hunter; a Rogue and both tanks; a healer and both tanks; one backup each." (`guides.js` 1906-1908; the guide note's Oct 26 audit: "Serpent's Bite needs at most 3 soakers since Oct 6… Tactyks' 'target + 4' is from before that"). Both tanks soak in the guide's sets 2 and 3; the Plan never puts a tank in a Bite. Twelve soakers on three circles also means the raid can't make the wave holes the soakers' waves need ("their waves go away from the raid").
- Where: practice copy, Ula'tek Mythic, Assignments 6 (Serpent's Bite soaks); the same three lists on Heroic.
- Rule it should be (Mythic): three sets, one card each ("Bite 1 / Bite 2 / Bite 3"), three soakers plus one backup a set, in the guide's class order (set 1: two Mages + a Hunter; set 2: a Rogue + both tanks; set 3: a healer + both tanks; Mages as backups), each soaker in at most two sets; the card says "The three targets stack; the soakers stand in all three circles; big defensive as it ends, then personals for 18 s"; the tip loses "target plus 4". The Deaths/Mechanics rules already count Serpent's Bite soaks per cast (`engine.js` Ula'tek module), so the Report card can check the set that soaked.
- File: `ui.js` Ula'tek `bite` slots (6312-6313) and picks (6445-6446), `NDZ_SAFE`.

### J2. Egg zones are scrambled: a Mage carries "by the boss" and the far spots get no Mage (M, website builder)
- What's wrong: the picker builds the zones from the guide (melee by the boss, Mages far "over the waves: Blink", the rest left/right), then the fit pass re-ranks every "Egg (Melee|Left|Right|Far|Backup)" slot by one score (move + wall) with the same pool (anyone but a tank), so the best scorer lands in the first slot whatever the zone: Egg Melee = Boltzzx (Arcane Mage) + Dashtoswirly, "The eggs by the boss, melee who are there anyway"; Egg Far = Kargaryen (Augmentation) + Phartsy (Windwalker); Egg Right = Dragooned (Mage) + Huservoker (a healer); Egg Left = Schooty + Volkovod (Hunters). The guide: "Arcane x2 (outer, bad spots: Blink over waves)… mages always far left / far right", melee take the boss eggs, "8 egg carriers" all DPS (a Preservation Evoker carrying a Noxious Shell egg in P1 is nobody's plan). Every zone's reason is the same sentence ("Carried eggs put a DoT on the carrier… Picked: X (fast: Blink, Shimmer…)"), so the reader can't see why Boltzzx is a melee.
- Where: practice copy, Ula'tek Mythic, Assignments 1 (Egg carriers).
- Rule it should be: the fit pass keeps the picker's zone pools (Egg Melee: melee only; Egg Far: Mages first, then other blinkers; Left/Right: Hunters and the rest; healers never carry while a DPS is free) and ranks inside each pool; the reason line says the zone's why ("far spots: Blink over the waves") before the speed and defensive. Egg Backup stays one mobile ranged.
- File: `ui.js NDZF_FIT["Ula'tek"].eggs` (6498: one regex for five zones), `ndzFitPass` (6526), the zone picker (6434-6436).

### J3. Jobs the guide has and the Plan lacks: tether breakers, the Doomscale Egg carriers, the Warlock gate (M, website builder)
- What's wrong: on both difficulties the Plan has no Grasping Fangs job. The guide: Heroic "6 players, 3 a side; snap two at a time"; Mythic "one solo break (a mobile ranged: Mage, Hunter, Balance), then a 5-break under stacked raid cooldowns (AMZ + Rally each side, Spirit Link one side, Darkness the other)". No Doomscale Egg carrier: "a healer from each side fetches the far Doomscale Egg… dunk on a countdown, both sides synced" and "the big Doomscale Egg goes LAST" (Heroic: touching it early starts Mass Gestation; too late = Dread Roar, a wipe). No gateway job: "One Warlock gates both sides (Soulburn)" is the way back, and Komo is the roster's only Warlock, sitting on the Left side with nothing said. The P2 card's tip mentions a "Warlock gateway for the way back" generically.
- Where: practice copy, Ula'tek Mythic Assignments 3 (P2 sides) and 4 (Doomscale kick teams); Heroic has no P2 card at all (J5).
- Rule it should be: the P2 card gains "Tether Breakers" (Heroic: 3 a side; Mythic: 1 solo breaker a side, a mobile ranged, then the 5 named), "Doomscale Egg" (one a side, a healer first, "last, on the countdown"), and "Gateway" (the Warlock; "No Warlock: everyone walks back through the venom" when none), with the side's raid cooldowns for the 5-break named in the reason (see J8).
- File: `ui.js` Ula'tek `side` slots (6310-6311) and picks (6438-6443).

### J4. "Rescue clears the slow": Freedom given to an Evoker, who would pull the tank out of the pool (S, website builder; verify the spell texts)
- What's wrong: Freedom on Mythic is Hobbz (Blessing of Freedom) and Huservoker, with the reason "Rescue clears the slow". Rescue flies the target to the Evoker; it removes nothing, and Mother's Wrath wants the tank running back INTO the red pool, not pulled across the platform. `NDZF_FREEDOM` also lists Shaman "Wind Rush Totem" (a speed boost) and Druid "Stampeding Roar (frees from slows)"; the guide names only Blessing of Freedom "etc.". The Freedom reason on both difficulties also says "clutches are gripped into the cleave" (the card's shared sentence), and Heroic has no clutches.
- Where: practice copy, Ula'tek Mythic Assignments 7 (Tank Jobs → Freedom); Heroic's Freedom reason.
- Rule it should be: Freedom = spells whose tooltip removes movement-impairing effects (Blessing of Freedom; Tiger's Lust if its text says so; check Stampeding Roar's and Wind Rush Totem's texts in the game data before keeping them, and drop Rescue); the reason for Freedom is its own sentence ("Mother's Wrath leaves Hobbled, a 55% slow: X clears it"); with only one Paladin, the second slot is "the tank walks it off" rather than a wrong spell.
- File: `ui.js NDZF_FREEDOM` (6473), `NDZF_FIT["Ula'tek"].tanks` (6497: one `m` sentence for Freedom and the grips).

### J5. Heroic: the Bite groups leave 6 raiders out, and Heroic has no P2, egg or intermission jobs (M, website builder)
- What's wrong: Heroic plans only kicks, Spectral Coils, Serpent's Bite (4/4/4) and Freedom. The Heroic guide's Serpent's Bite is the whole raid in three groups ("melee on her platform, healers at the near edge of the next platform, ranged on its far side, a few DPS in the healer group to even the numbers"), so Vandagos, Tyralien, Zaffia, Raiyvenz, Phartsy, Boltzzx, Volkovod and Schooty have no group. The Heroic note "No waves when the circle ends, and a smaller hit, so more players can soak" is right and the card still shows 4. Heroic also has eggs to pick up in P1 (the eggs card is `mythic: true`), two equal P2 groups with their pickers and the Doomscale Egg (the P2 card is `mythic: true`), and an intermission with two alternating groups ("Team 1 soaks 1/3/5, Team 2 soaks 2/4/6") that the Coils teams could be, but nothing says so.
- Where: practice copy, Ula'tek Heroic (the Who plays switch), Assignments "4 of 4 filled".
- Rule it should be: on Heroic the Bite card is three groups of the whole raid (targets join their role's group; tanks with the melee); the eggs card shows (without shields, zones by role), the P2 card shows (sides, pickers, Doomscale Egg, tether breakers 3 a side), and the Coils card's Heroic note adds "In the intermission the same two teams alternate: Team 1 soaks 1, 3, 5; Team 2 soaks 2, 4, 6."
- File: `ui.js` Ula'tek slots (`mythic: true` on `eggs` 6308 and `side` 6310), the Heroic notes (6720-6724), the Bite picks (6445).

### J6. The soak teams don't follow the guide's class placement, and odd rosters show "1 more needed" (S, website builder)
- What's wrong: Spectral Coils Team 1 (the first/right soak) has both Mages (Boltzzx, Dragooned); the guide: "the right-hand one always goes first. Balance always in the right soak, Mages in the left" (so the shield breakers soak first, the Mages second). The Mythic transition groups are dealt evenly by role (7/7/6); the guide's three are "melee + a tank, misc ranged + a tank, egg-damage specs (only two soaks)", so the egg breakers take the fewest soaks and keep breaking shields. Team 2 (9 of 19) and Soak Group 3 (6 of 20) are flagged "1 more needed" because `want: 'half'`/`'third'` rounds up: 19 can't split 10/10 and 20 can't split 7/7/7, so the flag is wrong on every odd roster.
- Where: practice copy, Ula'tek Mythic, Assignments 2 (Spectral Coils teams) and 5 (Transition soak groups).
- Rule it should be: Coils Team 1 = the shield breakers and the melee, Team 2 = the Mages and the rest, with the guide's sentence in the reason; transition groups = melee + tank / ranged + tank / shield breakers (+ whoever is left), the third reason saying it soaks twice; 'half' and 'third' never flag a team that is within one of the others.
- File: `ui.js` Ula'tek picks (6428-6431), the `want: 'half'|'third'` check (~5251 `wantN`).

### J7. Egg Shields adds a second name nobody picked (S, website builder)
- What's wrong: Egg Shields shows Komo and Fourinches, the reason only "Break egg shields instead of carrying: Komo." Fourinches (Unholy) is a filler for `want: 2`: the roster has no Balance Druid or Shadow Priest, the picker fell back to the Warlock, and the slot was topped up with the next free DPS. The guide's shield breakers are "Balance, Shadow; 2 is enough"; the picker's own fallback line ("No Balance Druid or Shadow Priest: cleave the shields") never shows when a Warlock exists.
- Rule it should be: the fallback names what it did ("No Balance Druid or Shadow Priest: Komo (Affliction) breaks shields, everyone cleaves the rest"), fills one name, and no slot gets a filler without a reason line that names them.
- File: `ui.js` Ula'tek `sh2` (6432, 6444), the generic slot filler.

### J8. The P2 raid cooldowns don't know the sides (M, website builder; with P7/P8)
- What's wrong: the P2 sides happen to give each ledge an Anti-Magic Zone and a Rallying Cry (Left: Fourinches + Vandagos; Right: Raiyvenz + Larryg), but the healing-cooldown plan's P2 call at 0:40 ("Defensive (Blight Vein)") stacks Fourinches' AMZ (Left) with Larryg's Rally (Right) and Huservoker's Zephyr (Right): one side gets two cooldowns, the other one. The guide: "a 5-break under stacked raid cooldowns (AMZ + Rally each side, Spirit Link one side, Darkness the other)". The cooldown planner plans one raid; in P2 there are two.
- Where: practice copy, Ula'tek Mythic, Healing cooldowns P2 0:40 and 2:15, Assignments 3.
- Rule it should be: in Ula'tek P2 (2:53-5:15) the planner plans each side with its own players, and the side split (J3) places the raid cooldowns evenly first (one AMZ, one Rally a side when the roster has two), the same way the kick teams already set the sides.
- File: `ui.js ndzCdPlan` (phase 2 of Ula'tek), the side picker (6438-6439).

### J9. Small things seen on the way (S)
- Kick teams: "the fastest kicks" takes two ranged kickers regardless, so Kargaryen (Quell, 20 s) is on the Right team ahead of Zaffia (Kick, 15 s), Raiyvenz (Mind Freeze, 15 s) and Phartsy (Spear Hand Strike, 15 s). Fine for a team of 4; the sentence should say "a ranged kicker on each side for the far add" or pick by cooldown.
- After the Who plays switch to Heroic, the boss header reads "Heroic · The Venomous Abyss" and the plan saves as "Main roster Heroic plan" while the night strip still says "Sun 8 · Mythic": two difficulty labels on one screen.
- Incubation Beam is "the off-tank" (Tyralien); on P3 platform 2 the guide gives the beam to "the tank without the debuff", which changes pull to pull: the reason could say "in P1; in P3 whichever tank has no debuff".
- Clutch Grips: Fourinches and Raiyvenz (two Death Grips) match the guide's "needs two Death Knights"; the reason could add "no Blood Death Knight: no Gorefiend's Grasp for the stragglers".

### J10. For the record (no fix)
- Kick teams have no healer; each side's tank leads its team; the two Preservation Evokers are split one a side with Rescue as the crossing helper; the sides are even (1 tank, 2 healers, 3-4 melee, 3-4 ranged each); the boss tank is the only one left out of Spectral Coils; the transition groups match the NSRT block the note reads; the raid markers (first intermission coil "the spot shown", end on Diamond) follow the guide; "Plan this boss" now plans one boss (P9 fixed).

### Order to fix (my call)
1. J1 (Serpent's Bite sets): the Plan contradicts the Guides tab on the fight's one wipe mechanic in P3.
2. J2 + J7 (the egg card) and J4 (Rescue) together: the fit pass is the shared cause.
3. J3 + J5 + J8 (P2 and Heroic coverage) in one pass through the Ula'tek slots.
4. J6, J9.

## 7. Jobs: the other 8 bosses (Flex: "Yes, on Fable")

Done on the practice copy (next-debrief) with the same Main roster of 20 as section 6 (Vandagos Prot Warrior, Tyralien Prot Paladin; Optt Holy Priest, Huservoker and Urgdragon Preservation, Trëèflêx Resto Druid; Fourinches Unholy, Raiyvenz Frost DK, Larryg Arms, Hobbz Ret, Dashtoswirly Havoc, Zaffia Sub, Phartsy Windwalker; Dragooned Frost Mage, Boltzzx Arcane, Shockabunga Ele, Kargaryen Aug, Komo Affliction, Volkovod and Schooty BM). For each boss the saved plans were cleared, "Plan this boss" pressed with Who plays on Mythic, then on Heroic, and every card read by script from the saved plan (names and each pick's reason), with the plan's own `Difficulty:` line as the truth (the builder is right: the night strip said "Sun 8 · Mythic" while the Who plays switch made Heroic plans). Guides: `notes/Guides/Bosses/<boss>.md`; code at 49b75676: slots `ui.js` 6249-6324 (Twin Fangs 4922-4927), pickers 6329-6463 (Twin Fangs 5660-5720), the fit pass 6483-6530, Heroic notes 6690-6731.

### K1. Twin Fangs: a Holy Priest and five melee are Broodling kickers, and the spot names read as roles (L, website builder)
- What's wrong: the Mythic Broodling card gives Right Range to "Volkovod, Komo, Optt" (Optt is a Holy Priest: healers have no kick in Midnight except a Restoration Shaman), Left Range to "Boltzzx, Schooty, Fourinches", Left Melee to "Vandagos, Kargaryen, Larryg, Hobbz" and Right Melee to "Shockabunga, Dragooned, Dashtoswirly, Zaffia", and Backup Kicker is Raiyvenz while its reason says "Nobody left with a kick." The picker's own rule (5690-5697) is both tanks and the ranged with the shortest kicks, "melee stay on the bosses", a Resto Shaman as the spare; the lists then get topped up to each slot's `want` with whoever is unassigned (five melee, a healer, a backup with no reason). "Left Melee / Right Melee" are the close spots and "Left Range / Right Range" the far spots, so a reader sees an Augmentation Evoker under "Melee" and an Unholy Death Knight under "Range". The guide: ten slots (L1-L4, R1-R4, front-left/right, L0/R0), the tank on each side takes the front and the first kick, spare kickers per side.
- Where: practice copy, The Twin Fangs Mythic, Assignments "Broodling Kicks - Area Assign".
- Rule it should be: only players with a kick are ever in a kick slot (no top-up for kick cards; a short slot says "short by N: top raids use 10"); both tanks in the front slots (Front Left / Front Right), ranged by kick cooldown on the side spots, melee only when the ranged run out and the reason says so; the labels become "Left close / Left far / Right close / Right far"; the Backup reason is written after the top-up or the top-up is dropped.
- File: `ui.js` Twin Fangs kicks (5690-5704, slots 4924-4925), the slot top-up that fills `want` with unassigned raiders.

### K2. Twin Fangs: the soak order is the guide's backwards (M, website builder)
- What's wrong: Left "Takes the first hit", Right "the second", Center "the third". The guide (Tactyks, Mythic): "the group knocked right soaks first, the group knocked left second, the front group last, always that order (the orbs spawn starting at the back; on platform 2 they come reversed, but keep the same order)". Groups are 6/6/8 with a tank in Left and Right (right), and the Heroic card still carries "Tainted Blood" in its head although Tainted Blood is Mythic-only.
- Where: practice copy, The Twin Fangs Mythic and Heroic, "Ravenous Feast and Tainted Blood Groups".
- Rule it should be: Right first, Left second, Center last, with the guide's sentence in the reason; the Heroic head reads "Ravenous Feast groups".
- File: `ui.js` 5687-5689 (`['Takes the first hit.', ...]` order), 4922 (head).

### K3. Nymrissa: five soakers a set, a healer and the off-tank every time, and no Paladin (M, website builder)
- What's wrong: all 8 Orb Soak sets are "Tyralien (the off-tank) and Huservoker (healer) every set, with three of Dragooned (Ice Cold), Boltzzx (Ice Cold), Zaffia (Cloak of Shadows), Volkovod (Aspect of the Turtle)". The guide (Mythic): "4 immunity players (Hunter Turtle, Paladin Bubble, Rogue Cloak...) take turns on the 7 Frost Orb sets (3 is enough: tanks cover the middle set)… the immunity player stagger-soaks… stops the moment the immunity ends; 2-3 left is fine: tanks take them, 2 each at most (stacking DoT)". So: one immune soaker a set in rotation, the tanks for what is left, nobody else (every soak is a Frost Burst on the raid). The plan sends five, a Preservation Evoker eight times, and the off-tank to all eight sets. Hobbz (Divine Shield, the guide's "Paladin Bubble") is never picked because the pool is Mage, Rogue, Hunter, Death Knight, Druid (6386); Schooty (a second Turtle) is left out for two Mages, and Ice Cold is not an immunity (it is the Ice Block talent that trades the immunity for damage reduction: verify the spell text before listing it under `NDZ_SAFE`). The Heroic plan is a byte-for-byte copy of the Mythic one, with "every soak hits the raid on Mythic" in each reason, while the Heroic note on the card says "anyone can soak, quickly" and the Heroic guide has the arrowed players pick up their own orbs and the off-tank the rest.
- Where: practice copy, Nymrissa Wavecaller Mythic and Heroic, Frost Orb soaks.
- Rule it should be (Mythic): one immune soaker a set in turn (Paladin, Hunter, Hunter, Rogue, then round again), "the tanks take what is left, two each at most" in the reason, no healer; a roster with fewer than three immunities says so. Heroic: one card, "Droppers pick up their own orbs; the off-tank (X) takes the rest; all within 30 s", no eight-set list.
- File: `ui.js` Nymrissa picker (6385-6389), `NDZ_SAFE` MAGE (6234), the Heroic note (6706).

### K4. Nymrissa: the two ranged hit squads are missing (M, website builder)
- What's wrong: the guide's Mythic plan has "two ranged hit squads (3-4 each, with CC: Druids, Evokers, Hunters) peel off: left squad hits the left pack then rotates round the back, right squad the right pack then the back; the Blood DK CCs the pack straight across; the boss-side DK grips the Frostscale away and it dies first". The plan has Grips (Fourinches, Raiyvenz) and Slows (Boltzzx, Dragooned) only; nobody is told which pack is theirs.
- Rule it should be: a "Murlocs" card with Left Squad / Right Squad (3-4 ranged each, CC classes first), Frostscale Grip (one Death Knight on the boss side), and the existing Grips and Slows; Heroic keeps Slows and Grips only ("most of the raid on the biggest pack").
- File: `ui.js` Nymrissa slots (6277-6281) and picker (6390-6393).

### K5. Entombed Sentinels: a Breath healer soaks the Blood side's Miasma, and the Blood tank doesn't (M, website builder)
- What's wrong: Miasma lists the nine non-tanks of the Blood side plus Huservoker, a Breath (green) healer: the picker takes "the Blood side first, then the others" to reach `want: 10` (6404), and the fit pass picks the extra by defensives. A Breath player can't be at the Blood stack (the bosses are 40+ yards apart and each marks everyone within 40). The guide: "at least 8 (it hurts a lot); stack defensives (Anti-Magic Zone, Spirit Link); the tank goes deepest", so Vandagos (the Blood tank, Rallying Cry) belongs in it and nobody from Breath does. The Heroic card keeps 10 names under a note that says Heroic needs fewer than Mythic's 8.
- Where: practice copy, Entombed Sentinels Mythic and Heroic, Miasma Soaks.
- Rule it should be: Miasma = the whole Blood side including its tank (10 here); never a Breath player; the reason names the raid cooldowns in the group (Anti-Magic Zone from Raiyvenz, Rallying Cry from Vandagos) as the guide stacks them; Heroic: "the Blood side soaks; fewer are fine".
- File: `ui.js` 6404-6405, `NDZF_FIT['Entombed Sentinels'].miasma` (6493).

### K6. Vashnik: "pulls the pack together" with Ring of Peace and Thunderstorm, which push adds apart (M, website builder; verify)
- What's wrong: Shadow Add Grips = "Phartsy (Ring of Peace pulls the pack together) | Shockabunga (Thunderstorm pulls the pack together)". Both are knockbacks that scatter what they hit. The picker meant Gorefiend's Grasp / Ursol's Vortex or Typhoon / Sigil of Chains (6374-6376) and found no Blood Death Knight, Vengeance or DPS Druid; the fit pass's `massgrip` table (6515) scores Ring of Peace 3 and Thunderstorm 2 and writes "pulls the pack together" for them. Trëèflêx (Restoration Druid: Ursol's Vortex, Typhoon, the guide's own tool for the even sets) is excluded because the slot's pool is "not a healer". Also: the guide wants both a Banish and "a light crowd control (Paralysis, Freezing Trap) early on the far one; at 4-5 infusion stacks it must stay controlled"; the plan gives Banish to Komo and offers a light CC only when there is no Warlock (6371-6373).
- Where: practice copy, Vashnik Mythic and Heroic, Adds.
- Rule it should be: Shadow Add Grips only from spells that gather (Gorefiend's Grasp, Ursol's Vortex, Sigil of Chains; Typhoon as "pushes them together from behind"), healers allowed for Ursol's (a Resto Druid casting one vortex a set is the guide's plan); with none, "Nobody can gather them: cleave them where they are"; a "Far Add CC" slot (Hunter trap, Monk Paralysis, Mage Polymorph) alongside the Banish on Mythic.
- File: `ui.js` 6374-6376, `NDZF_GRIPS` (6474), `NDZF_FIT['Vashnik the Malignant'].adds` (6489), the Banish/light-CC pick (6371-6373).

### K7. Vashnik: the Bile card lists two people twice and leaves the Flame side short (S, website builder)
- What's wrong: Bile = Boltzzx, Shockabunga, Dragooned, Kargaryen, Schooty, Volkovod; Max Range Shadow = Schooty, Dragooned (both also in Bile, on an `exclusive` card); Max Range Flame = Komo alone (want 2), who is also the Banisher, with the generic bile sentence as his reason. The picker keeps the far soakers out of Bile (6382) but the fit pass re-ranks the Bile slot without that exclusion. Dispels: Optt, Huservoker + backup Urgdragon, while the guide's Mythic setup is "four healers assigned to Exploding Infection in two pairs" (sets of four): with four healers, all four should be named in two pairs.
- Rule it should be: one name per card (the fit pass honours `exclusive`), two Max Range soakers a side, the Banisher not a far soaker, "Dispel pair 1 / pair 2" on Mythic.
- File: `ui.js` 6380-6383, `ndzFitPass` (6526: the one-job-a-card rule for re-ranked slots), 6377-6379.

### K8. The Lost Explorers: both tanks break the first crates (S, website builder)
- What's wrong: Crates 1 = Tyralien + Vandagos ("a tank, with a defensive ready" twice); the picker meant the off-tank plus one mobile ranged (6417), the fit pass's `tank` +5 (6511) put both tanks in. The guide: "one assigned ranged or tank does most breaks (not all); break in pairs"; the tanks hold Nama and Iku, swap on Shredding Shards and bait Shell Spin; sending both to the crates leaves nobody on the pair.
- Rule it should be: at most one tank on the crate card; Crates 1 = the off-tank + a mobile ranged, Crates 2 = two mobile ranged (as now: Kargaryen, Schooty).
- File: `ui.js` 6416-6419, `NDZF_FIT['The Lost Explorers'].crates` (6496).

### K9. Sszorak: no card says who stacks for Serpent's Fury, and a tank spreads "outside" (S, website builder)
- What's wrong: the Fury card has the bait (Volkovod, a Hunter: right) and a backup, but not who stacks: the guide needs 14 within 8 yards, "all DPS, the inactive tank and the mobile healers (Preservation, Holy Paladin); they left a Resto Shaman and a Holy Priest out; keep the stack near melee range". Virulence Inside/Outside puts Tyralien (a tank) and two healers outside; the card's own tip says melee and healers inside, ranged outside, and the tanks must be at the boss. Crosswinds: "Priests and Paladins can't cancel → self-ping macro so a partner lines up with them" has no card (Optt, Hobbz, Tyralien here).
- Rule it should be: "Fury Stack" = everyone but the active tank and the named non-mobile healers (Holy Priest, Resto Shaman), with the count ("18 of 20: enough for 14"); both tanks inside for Virulence; a "Crosswinds pingers" line naming the Priests and Paladins.
- File: `ui.js` Sszorak slots (6249-6257) and picker (6329-6350).

### K10. Kith'ix: the tank sweep of the stacked Voidscars is missing (S, website builder)
- What's wrong: Voidscars are "two ranged take turns per scar" (Scar 1 Schooty + Volkovod, Scar 2 Dragooned + Boltzzx, backups), which is the guide's moon/triangle soak. The guide also has the tank job: "the tank without the debuff soaks at circle (two back to back, then the other tank one, then two more)", Heroic "tanks do most: drop 2-4 Voidscars overlapping so one tank can sweep them". No tank appears on the card. The Fear dispel markers (Optt skull first, Huservoker star, Urgdragon X) and the beetle grips/slows match the guide.
- Rule it should be: a "Circle Scar (tank sweep)" slot: the tank without Devastated, named as "whichever tank has no debuff: Vandagos / Tyralien", on both difficulties; the ranged pairs stay for moon and triangle on Mythic.
- File: `ui.js` Kith'ix slots (6317-6323) and picker (6453-6461).

### K11. Nek'zali: for the record, with two small things (S)
- Well groups (4 physical DPS + 1 healer, two melee kickers named first), Pyre soak (15) / Don't Soak (the five burn-class ranged), Essence Rend dispels and the two Death Grips all follow the guide. Small: all four healers soak the Pyre while the guide says "all melee soak, dead centre" and ranged clean up (healers unsaid: fine either way, but the Well healers Urgdragon and Trëèflêx should be the ones not in the Pyre if the Pyre lands while a squad is down); the Heroic plan hides the Well card (right) and keeps the rest.

### K12. Every boss: Heroic plans are Mythic plans with Mythic words (M, website builder)
- What's wrong: on Nymrissa, Entombed Sentinels, The Lost Explorers, Vashnik and Kith'ix the Heroic plan is the Mythic plan minus the `mythic: true` cards, name for name, and the reasons keep Mythic sentences ("every soak hits the raid on Mythic", "Mythic needs 8+", "on Mythic on the whole raid"). The Heroic note on each card is right but sits apart from the picks. Section 6's J5 is the same for Ula'tek.
- Rule it should be: the picker gets the difficulty (it already gets `my` for Mythic on some bosses) and writes the Heroic reason, and a card whose Heroic plan differs in kind (Nymrissa's orbs, Ula'tek's Bite) builds a different list, not a copy.
- File: `ui.js` pickers (6329-6463), the Heroic notes table (6690-6731).

### K13. Every boss: the slot top-up and the fit pass add names nobody chose (M, website builder; the shared cause behind K1, K5, K7, K8 and J2, J7)
- What's wrong: two late passes change the pickers' lists: the top-up fills a short slot to its `want` with any unassigned raider (Optt into a kick slot, Raiyvenz as a backup kicker with "Nobody left with a kick", Fourinches into Egg Shields), and the fit pass re-ranks a slot by one score for all its labels (a Mage into "Egg Melee", both tanks into Crates 1, a Breath healer into the Blood soak). Neither knows the card's own rules (role pools, sides, `exclusive`), and the reason text is written before they run.
- Rule it should be: the top-up only fills slots whose pool is "anyone" (soak groups), never kick, dispel, grip, CC or side-bound slots; the fit pass ranks inside the picker's pool for that label and respects `exclusive`; both write their own reason ("added to reach 6: Zaffia") so no name is unexplained.
- File: `ui.js ndzFitPass` (6526), the slot top-up after the pickers.

### K14. For the record (no fix)
- Sszorak Mutilate groups (a tank and two healers each, 10/10), the Hunter bait and backup, the Exit Cyst on a Mage; Nek'zali's Well teams; Entombed Sentinels' sides (melee lean to Breath, the one multi-dotter on Breath, tanks and healers split), Droplets (both tanks, Hobbz's Bubble, Zaffia's Cloak: check that Toxic Droplets is magic), Blighted Blood dispelled by the Blood-side healers; Lost Explorers' Fish (a Mage, not a crate breaker) and three Iku kickers; Vashnik's two Death Knights on the fire adds and the Warlock Banish; Twin Fangs' Orb CC sets spread over four quadrants with named spells (Tail Swipe for the Evokers is a knockback, not a stun: verify it breaks Barbed Bulwark); Kith'ix's grips, Tar Trap slows and Fear markers. Every card had a reason line; no plan errored; the Who plays switch planned the right difficulty every time once the plan's own `Difficulty:` was read.

### Order to fix (my call)
1. K1 (Twin Fangs kickers) and K13 (the top-up and fit pass): a healer with no kick on a kick card is the kind of pick that loses a raid's trust in the whole Plan tab, and the fix to K13 removes most of the rest.
2. K2 (Twin Fangs soak order), K5 (Sentinels Miasma), K6 (Vashnik "pulls together"): wrong plays a raid would follow.
3. K3 + K4 (Nymrissa), K12 (Heroic words), K9 (Sszorak stack), K10 (Kith'ix tank sweep).
4. K7, K8, K11.

### Re-check on the rebuilt practice copy (e5e394bf, same as live plus Ula'tek J6 + J9)
Main asked for a re-run on the fresh build (reloaded with a new query, saved plans cleared, Who plays on Mythic then Heroic, every card read by script). All eight bosses came out name for name and reason for reason the same as above, so K1-K14 stand and nothing in them is already fixed. Ula'tek on the same run shows the section 6 fixes in place (three Bite sets with backups, egg zones by role with the Mages far, P2 solo breakers / Doomscale Egg carriers / Gateway, Freedom from Blessing of Freedom and Tiger's Lust, the coils and transition groups in the guide's shape).
