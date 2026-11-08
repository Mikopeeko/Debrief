# Big audit: every logic module (Sun Nov 8, on Fable)

Flex's goal (Nov 7): "a big pass across the website to ensure that wipes deaths mechanics and rotations are consistently solid across the board".
He then widened it: "i basically want the audit to fine tune all the logic driven modules inside my website, that could even include healing assignments, or anything automated" and "I just want it as acurate and polished as possible".
So the scope is EVERY piece of logic that decides something for raiders. That means areas 1-4 below, plus area 5, the automated planning tools.

## How this audit works
- **Fable plans, Opus fixes.** This chat (Fable) READS the rules and the test logs and WRITES a fix list. It does not build, restyle or deploy.
  The helpers fix the list on Opus. Main tests each fix on the practice link and puts it live only on Flex's "push it" in the Main chat.
- **One area per sitting**, in this order: 1 Wipes, 2 Deaths, 3 Mechanics, 4 Rotations, 5 Automated planning (Plan tab and anything else that fills itself in).
  Rotations and Plan are the biggest. Flex can stop after any area.
- **The bar is "as accurate and polished as possible".** Flag anything a top raid lead would call wrong, misleading, unclear or inconsistent, not just bugs.
- **Keep it cheap** (Fable cost about $15 in 5 minutes on Oct 27):
  - Read the source with grep and line ranges, not whole files.
  - Use the browser only to confirm a suspected bug, with one screenshot at 0.6 scale.
  - Don't re-check one-line fixes.
- **Output:** append findings to `notes/Audit findings (Nov 8).md` under the area's heading. Number each finding and write it as:
  - **What's wrong:** one plain sentence.
  - **Where:** the pull, e.g. "report 2r1KzqygWAFHkZT3 fight=32".
  - **Rule now → rule it should be.**
  - **File / function**, if known.
  - **Size:** S, M or L.
  - **Owner:** the "Analysis step 1" chat for wipes, deaths and mechanics; the Rotation helper for rotations.
- Never guess a rule. Strategy comes from `notes/Guides/` (it is the gospel), not from the logs alone. Logs are raw data.

## Test logs (all 12.1.5, Venomous Abyss)
| Log | What it is good for |
|---|---|
| `2r1KzqygWAFHkZT3` | Thursday, Nov 5. Coiled Altar Mythic, 22 pulls, game NSRT note loaded. Wipe calls, orb carriers, note cooldowns. |
| shared night `zZEe97dQPwLRjEiy8v4ZUw` | Monday, Nov 2. Coiled Altar, 20 raiders; the Rotation sweep base (all 20 on pull 1). |
| `bcA9kw3mxHKzr4fR` | Oct 22. Coiled Altar; fights 18 and 37. |
| `xH3JNdbQ74wBDPAv` | All 10 bosses in one log. Cross-boss consistency. |
| `9DRWhKnZbHtQgf4a` | Twin Fangs kill + wipes (Stone Breaker, Bulwark, Globule). |
| Ula'tek logs | See memory `ulatek-test-logs`. |

Practice link: https://next-debrief.james-m-nemecek.workers.dev (Main builds it). Your own preview: `npx wrangler versions upload --preview-alias <name>`.

## Rules already decided (don't relitigate; check the code follows them)
Memory files hold the detail; the index is in MEMORY.md.
- **Wipes** (`wipe-logic-nov6`, `wipes-have-several-causes`, `wipe-rules`):
  - "How it went" covers the collapse only.
  - Root cause first, then what added up.
  - Name who caused it when the log shows it: one name if certain, "one of A, B or C" if not, and a plain reason when no one can be named (dropped orb, the raid's damage). Never a guessed name.
  - Deaths after the wipe call (call + 0.5 s) don't count against anyone.
- **Deaths** (`death-judging-rules`, `deaths-audit-recipe`, `defensives-kit-rules`, `healthstone-fail-rules`, `externals-by-need`):
  - "Own fault" vs "not their fault" is decided the same way on every boss.
  - Graphs deaths count own-mistake deaths before the wipe only.
- **Mechanics** (`avoidable-damage-rules`, `mechanics-judging-vs-top`, `soak-check-tolerance`, `all-ten-bosses-rule`, `spell-data-first`):
  - Colours are judged against top raids, but the top numbers are never shown.
  - One slip is light.
  - Every tracked spell ID must actually appear in a real 12.1.5 pull (the Fight audit Data check shows this).
- **Rotations** (`rotation-not-spec-checks`, `rotation-check-importance`, `talents-change-what-to-count`, `proc-reliant-not-major`, `class-guide-audit-oct25`):
  - Checks follow the class guides in `notes/Guides/Classes`.
  - One button = one row.
  - Talents change what is counted.
  - Grey (ungraded) rows are honest about why.
- **Debriefing shows mechanics only.** Rotation issues stay on the Rotation tab.
- **Wording:**
  - Plain, short, one fact a sentence.
  - Never "went wrong".
  - Every mistake says what happened and what to do next time.
  - Mechanic titles read "Name (Nickname)".
- **Never remove a feature** without Flex's OK. Midnight healers have no interrupt except Resto Shaman.

## What to check, per area
### 1. Wipes
- For every wipe pull in `2r1KzqygWAFHkZT3` and `xH3JNdbQ74wBDPAv`, is the root cause the real first domino? Compare the log timeline against the guide.
- Does "Caused by" name the right person, and only with evidence?
- Do Why we wiped, the Report card, the Timeline read-out, How it went and Graphs all tell the same story?
- Is the wipe call time right? Are deaths after it excluded everywhere?
- Do all 10 bosses have root-cause logic, or do some fall back to a generic line?

### 2. Deaths
- Sample about 30 deaths across bosses. Is each verdict right (own fault, unlucky, tank, healer gap)? Is the "what to do" line true?
- Defensives, Healthstones, externals: are they judged by need, and the same on every boss?
- Do the Graphs death count, the Debriefing deaths tile and the Report card agree?

### 3. Mechanics
- Per boss: list every tracked mechanic, its spell IDs, and whether a real pull contains it (Data check).
- Flag unverified IDs, wrong tolerances (soaks, stacks) and Heroic vs Mythic mix-ups.
- Do "Mechanics we failed" (Also hurt), the Report card tiles and the Timeline marks count the same events?

### 4. Rotations
- Every raid spec in GEN_SPECS against its class guide: missing key checks, wrong counts, checks that should be ungraded, and duplicate rows.
- Sweep all 20 raiders on the Nov 2 night, plus a few more specs from the 10-boss log.
- Do the What to fix costs only appear when honest (at least 1% and 20K)?

### 5. Automated planning, and anything else that decides for raiders
Memory: `cooldown-planner`, `cooldown-planning-rules`, `healing-cd-logic`, `healing-cd-power-research`, `auto-buttons-explain-swaps`, `nsrt-notes`, `draft-note-from-pulls`, `note-cooldown-audit`, `class-unique-utility`, `effortless-setup`, `team-plan-online`.
- **Healing cooldowns** ("Plan them for me", big hits, covered / amber / red):
  - Are big hits the real dangerous moments, by Mythic timings from top kills?
  - Is each cooldown's power, length and recharge right for 12.1.5?
  - Are the cooldowns stacked or spread sensibly?
  - Do the cooldown-back rules match between the chart and My note?
- **Assignments and jobs** ("Make the whole plan", auto job fills, kicks, soaks, grips, raid markers):
  - Do they follow the guides?
  - Do they pick the right classes and specs?
  - Does a job button explain its swaps?
  - Are they never impossible (one player in two places at once, a healer given a kick)?
- **Roster tools:**
  - "Pick who plays for me" and the bench logic.
  - The Ready strip: Raid kit essentials, "Could swap" suggestions, kick counts, healer talents.
  - The gear check: real 12.1.5 enchant slots, item level, raiders taken off the team.
- **Notes:**
  - NSRT import and export, and drafting a note from pulls.
  - Note cooldowns in Raid checks.
  - My note lines (are they in the NSRT format the raid notes use?).
- **Everything else that fills itself in:**
  - The Report card grades and tiles; the pace and kill estimate ("Kill ≈ pull N"); the Graphs filters.
  - Rotation What to fix costs and Power Infusion picks.
  - Raid-day detection (Wolfthorn = Wed + Thu).
  - The Mythic+ run recap; the Companion pop-up card data.
- For each one, ask:
  - Would a top Mythic raid lead accept its choice?
  - Does it say why it chose that?
  - Does it ever contradict another tab?

## When an area is done
Message Main ("Main chat") with: "Audit <area> done: N findings in notes/Audit findings (Nov 8).md". Main hands the fixes to the helpers. No deploys from this chat.

## Same day
Sunday Nov 8 is also the **Battle.net-only sign-in** change. Do it first, or on Monday, and test it in Flex's Chrome. Don't run both at once. Avoid raid nights (Wolfthorn raids Wed + Thu).
