# Rotation audit, round 1 (Oct 23)

The user: "do a deep audit on the rotation tab and make sure the information for each class/spec is truly accurate and there's not useless
information displayed". Round 1 ran every spec's checks on the Wolfthorn night (PLRbTkpI…, Coiled Altar, 18 specs, 5 pulls) in the
browser (window.__wla.specRun) and read every row. Practice link: rotation-audit. Script: scratchpad audit1.js.

## Fixed on every spec (one filter in specPage, SPC_CUT)
| Row | Verdict | Fix |
|---|---|---|
| Opener DPS | Useless: always higher than the pull's average, so it reads as good whatever you did | Cut |
| Procs wasted in <burst window> | Repeats the proc's own row | Cut |
| Mana from others (healers) | Not the player's doing | Cut |
| Casting pace during Avenging Wrath (Holy Paladin) | No target; "Casting in Avenging Wrath" says it better | Cut |
| Past the falloff point, when it only says "that's fine" | No "so what" | Cut (kept when it's a real warning) |
| Opener sentence "the guide opener for Farseer on one boss (both guides)" | Clunky | "the Farseer opener" |

## Wrong numbers fixed
| Spec | Row | Was | Fix |
|---|---|---|---|
| Holy Priest | Divine Hymn uses | 12 of 13 (every channel tick counted as a press) | One press per channel (chan: 8): now 2 of 3 |

## Checked and fine
- No blank, NaN or "undefined" values on any of the 18 specs.
- Guide names in raw text are rewritten to "both guides" / "a guide" when the page draws.
- Talent-gated checks (Stasis, Dream Flight, Inner Flame…) only show with the talent; Stasis's 90 s cooldown matches 12.1.5.
- Wasted-proc rows are never red (capped at yellow within twice the top players').

## Holy Paladin (model spec), every row
| Row | Verdict |
|---|---|
| Weapon oil or rite | OK |
| Always be casting, Rotation priority, Holy Shock, Judgment while Holy Shock full | OK, targets from top kills |
| Infusion of Light, Flash of Light without an Infusion, Infused Flash of Light on a Beacon | OK |
| Holy Power wasted, Eternal Flame over Light of Dawn, Divine Purpose | OK |
| Beacon of Virtue, its windows, Divine Toll inside it, Divine Toll / Avenging Wrath uses | OK |
| Casting in Avenging Wrath, Cooldowns into the big hits | OK |
| Casting pace during Avenging Wrath, Procs wasted in Avenging Wrath, Mana from others | Cut (above) |
| Stats rows | OK (falloff row only when it's a warning) |

## Patch check (the user: "make sure it's using information from 12.1.5 just like everything else")
- Round 1's fixes use no patch numbers: they cut rows and fix a count.
- The top-player bars come from kills on or after Oct 14, after the last tuning on Oct 13 (memory patch-notes-vs-kill-data), so they're 12.1.5.
- Cooldown lengths are read live from the spell data (cdInfo), so they're 12.1.5 too. A list's fixed `cd:` is only a fallback.
- Round 2 rule: use only guide pages with a 12.1.5 tag or date (skip older ones), spell tooltips at 12.1.5, and the SimC APL from the current
  branch. Mark any rule whose number came from an older patch, and update it.

## Left for round 2 (weekly limit; resumes after Oct 25 noon Central)
- Read each spec's guides again (every dropdown, 12.1.5) against every rule and cooldown length, spec by spec, starting with the specs
  that have no top-player numbers at all (Protection Warrior, Demonology: their rows are graded on default thresholds).
- Wasted-proc rows with no top-player number (Overcharge!, Revenge!, Spiritfont, Strength of the Black Ox) are yellow on guesses: decide
  with top kills whether to grade them.
- Tanks' "Always be casting" without a top number (Protection Warrior 63% yellow) may not mean much for a tank.
- Specs nobody played on this night (about 12) still need a top kill run through specRun.
