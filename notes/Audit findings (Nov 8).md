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
