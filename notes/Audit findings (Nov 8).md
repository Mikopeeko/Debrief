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
