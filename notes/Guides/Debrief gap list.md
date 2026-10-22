# Debrief gap list (Oct 21, 2026)

Each line of `Raider checklist.md` against what the site does today (read from `src/ui.js` and `src/engine.js`).
✅ covered · ◐ partly covered · ❌ missing. Where it lives is in brackets.

## Coverage by checklist line

| # | Line | Status | Where / what's missing |
|---|---|---|---|
| A1 | Deaths | ✅ | Deaths tab + death "why" and "what would have prevented it" (engine death recap, `insights`); Recap; Report card execution |
| A2 | First death | ✅ | `insights`: "First death: … at 1:12 (x% into the pull)"; Recap "you died first" |
| A3 | Same mechanic twice | ◐ | Report card groups and Homework count repeats; Recap "happened more often later". No explicit "second time tonight" / "again this week" flag per player |
| A4 | Could they have lived | ✅ | Death recap `available` kit, user's ≤2 s rule (`d.react`), Report card survival |
| A5 | Fast deaths not held against | ✅ | Same; one-shots never count |
| A6 | Close calls | ✅ | Survivability `lowTime`, silent kit (user's Healthstone rules) |
| B1 | Assignments in the note | ✅ | Assignments check vs NSRT note (Debriefing), Report card assignment share |
| B2 | Soaks | ✅ | Boss modules (soak groups, user tolerance) |
| B3 | Interrupts on assignment | ✅ | Kick order / kick rota checks; missed kicks in death "why" |
| B4 | Dangerous dispels | ✅ | Dispels tab + modules |
| B5 | Harmless dispels advice only | ✅ | Venomfang rule (amber only) |
| B6 | Avoidable damage | ✅ | Avoidable rules per boss, "what hit whom" in Recap |
| B7 | Positioning | ◐ | Per-module spread/stack/edge checks and Debriefing maps; no general "out of place" check |
| B8 | Baits and frontals | ✅ | Module checks (frontals on non-tanks etc.) |
| B9 | Add priority | ✅ | `addsDamage` priority sets; Report card "% of their damage on adds" vs DPS average |
| B10 | Tank swaps | ✅ | Module tank checks; tank slips in Report card |
| C1 | Defensive on known hits | ◐ | Only judged when they died or dipped low. A defensive skipped on a known big hit they happened to survive isn't seen |
| C2 | Healthstone / health potion | ✅ | Potions and healthstones tab; survival kit score |
| C3 | Combat / mana potion | ✅ | Report card (one per pull, two if 5+ min, pre-pot counts) |
| C4 | Raid cooldowns | ✅ | Assignments check (note times); healer cooldown cards |
| C5 | Burst lined up | ✅ | Rotation burst window cards; Bloodlust; damage-check windows (e.g. Eternal Nightfall) |
| C6 | Power Infusion | ✅ | `piTier` (user rules) |
| C7 | Battle res | ◐ | Listed under Utility, alive time counts it; not graded (and probably shouldn't be beyond "wasted on a lost pull") |
| D1 | Always be casting | ✅ | Rotation ABC / casting time |
| D2 | Rotation priority | ✅ | Rotation checks, every raid spec |
| D3 | Big cooldowns used | ✅ | Cooldowns tab ("time each sat ready") |
| D4 | Throughput vs the job | ◐ | Graphs, pace vs sim (`paceOf`), role medians; no "had a job" adjustment beside the numbers |
| D5 | Consistency (median vs best) | ✅ | Character page: best and median per boss |
| D6 | Healers: mana and cooldowns | ✅ | Resources tab, healer pages, Saves (ungraded) |
| D7 | Overhealing not judged | ✅ | User rule followed |
| E1–E3 | Flask, food, oil | ✅ | Report card "Ready to raid" |
| E4 | Augment rune | ✅ | Shown, not judged (as intended) |
| E5 | Enchants and gems | ✅ | Report card gear |
| E6 | Item level | ✅ | Report card (5+ under the raid) |
| E7 | Talents for the fight | ◐ | Rotation reads talents and checks some; no "this fight's build" comparison |
| E8 | Note loaded | ❌ | Not in the log; shows up indirectly as missed assignments (fine) |
| E9 | Vault / Folio / embellishments | ❌ | Not in the log; Raider.IO / in game already show it |
| F1 | Wipe to wipe | ✅ | Recap "What's improving / getting worse"; later-in-the-night trend |
| F2 | Week to week | ◐ | Boss night-by-night (Progress/Teams), Character page; no one-player "this week vs last week" on mechanics |
| F3 | Late-night focus | ✅ | "Happened more often later in the night" |
| G1 | Attendance | ◐ | Team import knows who was in each night; bench fairness in the note builder. No attendance view |
| G2–G3 | Comms, attitude | — | Can't be logged. Leave to officers |
| G4 | Wipe call / padding | ❌ | Wipe filter drops everything after the pull is lost, but nobody sees who kept going |
| G5 | Prep outside raid | — | Can't be logged (Boss guides help raiders prep) |
| — | **Why we wiped (one line per pull)** | ◐ | Pieces exist (cascade insight, "looks like a raid damage check", pace on some bosses, Recap story) but no single verdict: execution / damage check / healing check / plan |

## What to build, best first

| Rank | Idea | Rating | Why (one line) |
|---|---|---|---|
| 1 | **Why we wiped** — one verdict per wipe (Execution · Damage check · Healing check · Plan) with the moment it was lost and who/what started it, plus a night tally ("8 of 11 wipes were execution, mostly Dreadmarch") | **Amazing** | It's the raid lead's first question after every pull, and no tool answers it; Debrief already has every piece (first death, cascade, pace, wipe filter, mechanic weights) |
| 2 | **Repeat flags** — "second time tonight" and "again this week" on a player's mechanic mistakes and deaths, following the tolerance table (once = info, repeat = yellow, pattern = red) | **Amazing** | "Same mistake twice" is how raid leads actually judge; turns Report card/Homework into the forgive-once, talk-on-repeat habit without new analysis |
| 3 | **Trial review** — one raider across their trial weeks: deaths, mechanics, assignments, prep, median vs best, and whether they got better kill to kill, on one page | **Solid** | Trials and benching are where officers spend review time, and the signals Raider.IO names (median vs best, kill graph, deaths with kit ready) are all in Debrief; mostly reuse of Character page + Report card |
| 4 | **Damage or execution? pace line** — boss % at the fight's key times vs your best pull and a top kill, on every boss (some have it) | **Solid** | Separates "we need more damage" from "we need to stop dying"; feeds rank 1 |
| 5 | **Known-hit defensives** — on planned big hits (tank busters, soaks, raid spikes), who had no defensive up even if they lived | **Solid** | Catches the risk before it becomes a death; needs a per-boss hit list, and must stay soft (yellow at most) so it doesn't nag |
| 6 | **Job-aware numbers** — beside each DPS bar, "had 3 soaks and 6 kicks" so low damage on a heavy job reads right | **Solid** | The #1 reason raid leads distrust parses; small, and the note already says who had which job |
| 7 | **Pull was lost at…** — "we kept going 90 s after the pull was lost" and who kept DPSing after most of the raid was dead | **Lackluster** | Saves time over 300 pulls, but the log can't see the actual wipe call, so naming players risks false blame; keep raid-level only if built |
| 8 | **Attendance page** from the team import | **Lackluster** | Officers want it, but Warcraft Logs already has guild attendance; low value for the effort |
| 9 | **Fight build check** (talents vs the guide's build for this boss) | **Lackluster** | Builds change per boss and per comp; easy to be wrong and preachy |
| 10 | **Vault / Folio / embellishment checks** | **Bad** | Not in the combat log; Raider.IO and in-game already show it |
| 11 | **Auto "bench this player" suggestions** | **Bad** | Logs can't see attitude, comms, or context; officers make that call, and a tool suggesting benches causes drama and kills trust |

## Notes for whoever builds these
- Keep the three flags and user rules: ≤2 s deaths not on them; Healthstone rules; soak tolerance; harmless dispels never
  red; overhealing never judged; proc-reliant lines ungraded; check every threshold against top kills.
- Recap voice stays "we/you", each problem with its fix (`recap-raid-lead-voice`).
- Rank 1 and 2 belong on Debriefing/Recap and Report card; rank 3 on the Character page (My page) or Teams.
