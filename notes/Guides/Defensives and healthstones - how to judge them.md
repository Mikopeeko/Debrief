# Defensives, Healthstones and health potions — how to judge them (Oct 22, 2026)

The user: "Find a way to review defensive and healthpot / healthstone usage for more fair/realistic grading. Research the true
importance, and see how much top guilds are doing."

## 1. What we measured

- **Top guilds:** the 20 fastest Mythic Coiled Altar kills (`/api/topkills?e=3429&d=5`; 19 loaded, 380 player-pulls).
  Measured over the whole kill (about 8 min) and, to compare fairly with our wipes, over the first 3 minutes only.
- **Us:** Wolfthorn's Oct 21 night (shared night PLRbTkpI_S3vOfdSwJrDZw = test log HWFBkCyc6JNazQrK), 19 pulls, 360
  player-pulls, each up to the wipe filter (about 2.5 min).
- Real engine on both (`E.analyze`); personal defensives from `DEFENSIVES` (raid cooldowns and self-heals apart), Healthstone and
  health potion uses, close calls (under 30% for 1 s+ or under 15%), "judged" close calls (the user's Oct 19 rule: 5 s+ under 30%,
  or sitting low then hit again), each player's 6 biggest hits, and the raid's top-10% damage seconds. Each aim number has a random
  baseline: the same presses dropped at random times.
  Scripts: shared notes `deaths-audit/defstats.js`, `defsum.js`, `fetchkills.sh`.

## 2. What top guilds do (first 3 minutes, so it matches our pulls)

| | Top guilds (DPS / healers / tanks) | Us (DPS / healers / tanks) |
|---|---|---|
| Personal defensives pressed, per 5 min | 2.8 / 1.6 / 7.6 | 3.1 / 1.9 / 4.5 |
| Pulls with no defensive at all | 17% / 38% / 0% | 23% / 49% / 8% |
| A Healthstone used in the pull | 8% / 8% / 0% (51% over a whole 8-min kill) | 24% / 6% / 8% |
| A health potion used | 8% / 14% / 3% (60% over a whole kill) | 15% / 3% / 11% |
| Health when they drink it (median) | stone 38%, potion 31% | stone 48%, potion 55% |
| Dropping under 30%, per 5 min | 0.2 | 0.63 (three times as often) |
| Of those, answered with a defensive, stone or potion | 70% (healers 60%) | 66% (healers 23%) |
| Long or repeated lows with nothing pressed (today's flag), per 5 min | about 0.0 | healers 0.19, DPS 0, tanks 0 |
| Their own 6 biggest hits with a defensive up | 19% (random: 8%) | 13% (random: 9%) |
| Presses near the raid's damage spikes | 53% (random: 38%) | 49% (random: 41%) |

What it says:
1. **Count means nothing.** Top players press personals at the same rate we do, and only about half the presses they could. Grading
   by "used X of Y possible" punishes normal, good play.
2. **Even the best don't cover every big hit.** Top players have a defensive up on about 1 in 5 of their biggest hits (twice
   random). "No defensive on a big hit" can only be soft advice, except on a planned job (a soak in the NSRT note).
3. **Healthstones and potions are for when you're low,** not a box to tick: top players drink at about 31-38% health and mostly
   late in the fight (8% of pulls in the first 3 minutes, half over a whole kill). A pull where you never got low needs none.
4. **Our real gap is getting low, not pressing buttons.** We drop under 30% three times as often as top guilds. That's damage taken
   and healing, a raid problem, not something to blame on each player.
5. **Healers are the one clear individual gap:** our healers answered 23% of their lows (top: 60%) and sat low with nothing pressed
   0.19 times per 5 min (top: about 0). Today's flag catches exactly this.

## 3. Rules (proposed), rated

| # | Rule | Rating | Why |
|---|---|---|---|
| 1 | **Never grade personal defensives by count or "uses of possible".** Only by need: a death with one ready (deathVerdict), or a long/repeated low with nothing pressed. | Amazing | Top players use about half their possible presses; count-grading marks good play down. |
| 2 | **Healthstone and potion only when it mattered** (the user's Oct 19 rule, unchanged): 5 s+ under 30%, or low then hit again, with one unused. No stone needed = full marks. | Solid | Matches what top players do (they drink at ~35% health, when it's needed). |
| 3 | **A healer's own heals on themselves count as answering a low** (today only a defensive, stone or potion does). | Solid | Top healers "answer" 60% with buttons; the rest they heal through. Today a healer who healed themselves back up still gets flagged. |
| 4 | **Tanks' big cooldowns: full marks at 65% of possible uses, not 80%.** | Solid | Top tanks average 78% over a whole kill, so an 80% bar marks down half of the best tanks. |
| 5 | **"No defensive on a big hit" stays soft advice,** red only for a planned job (the note's soak with a personal). | Solid | Top players cover 1 in 5 of their own big hits. |
| 6 | **Show "we drop low 3× as often as top guilds" as a raid line** (healing and damage taken), not on each player. | Solid | It's the biggest difference we found, and it isn't one person's fault. |
| 7 | Grade combat potions the same way as health potions. | Bad (skip) | Different job: combat potions are about damage windows and already have their own rule. |

## 4. Checklist (judging one player-pull)

1. Did they die? → deathVerdict decides; a death with a defensive/kit ready and time to use it is on them.
2. Did they drop under 30% for 5 s+, or sit low then get hit again? If not → nothing to judge, full marks.
3. If yes: was it answered (a personal defensive in the 8 s before to 3 s after, a Healthstone or potion within 2 s before to 5 s
   after, or for a healer their own heals on themselves)? If yes → fine.
4. If not answered and a Healthstone or potion was still unused → one miss (yellow). Two or more in a night → red.
5. Tanks: big cooldowns used at 65%+ of possible uses → full marks; below that, scaled.
6. Never count presses. Never flag overhealing or a stone not used when they never got low.

## 5. Built (test copy, Oct 22; user: "Yes, build the fairer defensive and healthstone rules and the two new panels")

- Engine: each close call gets `self` (a healer's own heals on themselves while low came to 20%+ of their health). On the
  Oct 21 night that answered 8 of 14 healer long lows (Flëxørçïst's only one; Optt keeps 3 real misses).
  Survivability's Good/Okay/Poor no longer uses "uses of possible" (now: died → Okay; a long low with nothing pressed → Okay).
- ui.js survivalOf0 (the grade): `!c.self` joins the quiet filter; tanks' big cooldowns full marks at 65%.
- Coach box: a second row under Deaths and Avoidable damage (`coachKit` / `coachKitHtml`, CSS `ckt-*`, panels
  `cch-ab-hs` and `cch-ab-df`): Healthstones and potions (bar = uses; amber/red = long lows with one unused) and Defensives
  (bar = long lows, green answered, red nothing pressed); each name opens when, how low, the hit, what they pressed or had
  ready, Next time. The raid line "We drop under 30% about X times per 5 minutes each; top guilds 0.2" shows when X ≥ 0.3.
- Scripts: shared notes `deaths-audit/kit-rules.js` (+ kit-fn.txt, kit-css.txt), test `kit-test.js <src> <nightDir> <out.html>`.
- LIVE version (user, Oct 22: "I just want to make sure people are using them"; defensives "maybe including how much damage they
  mitigated"): the panels are usage first. One bar per raider (×N on a pull, "N of M pulls" on All pulls); never used one = amber,
  listed first; red only by the fair rule above (2+ long lows left unanswered). Defensives show the damage each press took off:
  engine `r.defMit` (PERS_DR table: a % reduction is estimated from what got through while the buff was up, prevented = taken ×
  r / (1 − r); shields' soaks are exact; immunities have no number), marked "about". Script `kit-mit.js`.

## Sources
- The 20 fastest Mythic Coiled Altar kills (Oct 2026), through debriefme.io's /api/topkills and /api/fightlog.
- Wolfthorn's Oct 21 night (HWFBkCyc6JNazQrK).
- notes/Guides/Raiding - what matters.md §2.7 and the Raider checklist (C1, C2); the user's rules (healthstone-fail-rules, cooldown-planning-rules).
