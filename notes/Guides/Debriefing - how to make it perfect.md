# Debriefing — how to make it perfect (Oct 22, 2026)

Research notes and a plan for the Debriefing tab, after your call on Oct 22: "quick, simple summaries of what went wrong
on each pull and the whole night ... the detailed parts should stay ... not overwhelming people."

Pairs with `Raiding - what matters.md` (what raiders are judged on), `Raider checklist.md` and `Debrief gap list.md`.
This file is about **how to show it**.

---

## 0. The short version

1. **One fix per pull.** Raid leads fix one thing per wipe and test it on the next pull. The page should lead with that
   one thing, big, and at most two more, small.
2. **Answer first, proof underneath.** Three layers: the answer (5 seconds), the checklist (30 seconds), the evidence
   (minutes). Nothing is removed; it moves down a layer.
3. **Write like the raid lead talks.** One sentence per problem: who, what happened, what to do. No log codes
   ("#1, 3:03 ·"), no saying the same thing twice.
4. **Real misses loud, slips quiet.** Show "failed" and "went wrong" first; tuck the small slips and the clean mechanics
   into one line you can open.
5. **Say why we wiped.** One tag per wipe: Execution, Damage check, Healing check or Plan. No tool does this, and it's
   the first question after every pull.

---

## 1. What the research says

### How raid leads debrief
- **Between pulls (60–90 seconds):** say the cause in one sentence without blame, name one change for the next pull, call
  the next pull. Plan problems wait until after raid. ("Raiding - what matters", section 5.1.)
- **"Fix one thing per wipe."** Midnight raid-leading guides say the same thing: stay calm, isolate one problem, give one
  simple response, test it on the next pull; "each pull teaches one clear lesson". [boostroom] [visnalize]
- **After raid (20–30 minutes):** deaths and wipe causes first; are we getting further; same person dying first; which
  phase falls apart; pick one thing to track next week. Feedback to one person is private. ("Raiding - what matters", 5.2.)

### The army's After Action Review (used in sport, hospitals, business)
Four questions, in order: **What was supposed to happen? What actually happened? Why was there a difference? What will we
do next time?** Facts before judgement, no blame, end with specific actions. [AAR-UNICEF] [AAR-baruch]
For us: the plan is the NSRT note or the guide; what happened is how the pull ended; why is the mechanic that broke;
next time is the one fix.

### Designing for a glance
- **Answer first (inverted pyramid).** People scan web pages; put the bottom line first so someone who stops early still
  gets it, and the keen ones scroll for the rest. [sjsu] [usf]
- **Details on demand (progressive disclosure).** Show the summary by default, deeper detail behind a click or an
  expandable row. [wiki-PD] [uxcel]
- **About 4 things at once.** Working memory holds about four chunks, so a summary of three problems plus a verdict
  is the most to show at once. Group the rest. [cowan-arxiv] [density]
- **Headline, then takeaway, then detail.** Whoop's home screen: a score with a colour, one coaching tip, and the
  readout one tap away. [whoop] [whoop-ux]
- **A 5-second test:** show the page for five seconds, then ask what it said. If they can't answer "what killed us and
  what do we fix", the top is wrong. [uxstudio]

### What the other tools do
- **WoWAnalyzer:** a checklist (green ticks, red crosses) plus suggestions sorted Major / Average / Minor, and
  **Minor is hidden by default** behind a switch. Fix Major first. [wowhead-WA] [mein-mmo]
- **Wipefest:** separate views (Mechanics, Players, Timeline, Guide); a 0–100 score per mechanic against other kills;
  some mechanics shown but not scored; a Discord bot that posts a brief summary after every pull. [WF-archon] [WF-faq]
- **Esports review:** review the decision, not the highlight; check later games for the same mistake; end with action
  items per role. [exputer] [tactyx] [kollabe]
- **What they all miss** (from raid leads): who was assigned what, **why the pull was lost in one line**, and patterns
  for one player across pulls and weeks. Debrief already has the first and most of the pieces for the other two.

---

## 2. Where Debriefing stands today (measured on tonight's Coiled Altar pull 1)

| | One pull | All pulls |
|---|---|---|
| Words on the page (open parts) | about 800 | about 480 |
| Things you can click | 198 | 37 |
| Mechanic lines | 14 | 10 |
| Blocks above the first mechanic (live site) | 9: Copy, note bar, 4 tiles, 3 Fix cards, Next pull, wipe filter line, dot timeline, burst windows | 6: 4 tiles, 3 Fix cards, Next time, progress chart, dot chart with counts and score, Deaths |

What gets in the way:
1. **The answer is in four places.** The tiles say the result, the Fix cards say the problems, "Next pull" says the fix,
   and the dot timeline says when. A raider has to put it together.
2. **It repeats.** The first death is in the tiles, the Fix cards, the "Lost to" line and the Deaths line.
3. **Lines read like a log.** "#1, 3:03 · Gravebound death: died to Gravebound: didn't pick up their soul fragments",
   "Axegrinder, Larryg: 9 hits (25 damage ticks)".
4. **Everything shouts the same.** A failed Dreadmarch and a slightly slow Venomfang dispel get the same size card; clean
   mechanics take a full line each.
5. **No "why we wiped".** The pieces are there (first death, raid damage checks, pace) but no verdict.
6. **One page for two people.** The raid lead wants the raid's one fix; a raider wants "what did *I* do". The player
   picker does this, but it's easy to miss.

---

## 3. The design: three layers

### Layer 1 — The answer (5 seconds)
One card at the top. Nothing else above it except the pull picker.

**One pull**
```
Pull 7 · Wipe in P2 at 30%                                    [Execution]   ▲ 6% further than pull 6
Lost at 3:03 — Dashtoswirly didn't pick up their soul fragments and died to Gravebound.

FIX FOR NEXT PULL
  Pick up your soul fragments before Gravebound lands (2 missed it: Dashtoswirly, Komo).

ALSO
  • Venom orbs: the 3rd frontal popped 6 orbs. Aim it at 2 or 3, then at empty ground.
  • Axegrinder: Larryg and Boltzzx walked into the axes 9 times. Ranged, stay out of melee.
```
- The verdict tag: **Execution / Damage check / Healing check / Plan** (gap list idea #1).
- "Further than last pull" (or "same as" / "short of") so every wipe shows if we're moving.
- One fix, big. Two more, small. Each is one sentence: who, what, what to do.
- A clean pull: "Clean pull. Nothing to fix, keep the same plan." On a kill: what went well first.

**All pulls**
```
Tonight · 14 pulls · best P2 at 30% (pull 11)        8 Execution · 4 Damage check · 2 Plan
Getting further: the last 4 pulls all reached P2.

WHAT COST US THE MOST PULLS
  1. Dreadmarch — wrong in 9 of 14, still in the last 4. Stack, then stand still until the ghost spawns.
  2. Venom orbs — wrong in 6 of 14, clean in the last 3. Getting better.
  3. Deaths to Axegrinder — 7 deaths, 4 of them Boltzzx.

NEXT RAID: Dreadmarch first. Practise the stack on pull 1.
```
- Talk privately to the repeat names: a small "Repeats" line for the raid lead (gap list idea #2), never a public
  ranking of blame.

### Layer 2 — The checklist (30 seconds)
- One line per mechanic, as today, but: **failed and went-wrong lines first and full size; clean mechanics folded into
  one line** ("6 mechanics went clean ✓", open to see them).
- **Slips behind a switch**, like WoWAnalyzer's Minor: "Show small slips (4)". A slip never pushes a line to the top.
- Each line keeps its one-sentence fix; the map and table open in place.

### Layer 3 — The evidence (minutes)
Everything that's there today: maps (with the open-big button), tables, the dot timeline, the numbers tiles, burst
windows, Data check, More from this pull. Folded, remembered when opened.

### "Just me"
When a raider picks themselves (or comes from their own link), Layer 1 becomes theirs: "You: 1 thing to fix", their
deaths, their assignments. Same layout, their words ("you").

---

## 4. Writing rules for every line on Debriefing

1. One sentence. Who, what happened, what to do next time.
2. Plain words, the raid lead's voice ("we" for the raid, "you" for one player).
3. No codes or ids: no "#1, 3:03 ·", no "(25 damage ticks)". Times only when they help find it ("at 3:03").
4. Numbers only when they change the action: "6 orbs (aim for 2 or 3)" yes, "1,596,824 avoidable damage" no.
5. Never say the same thing twice on one screen.
6. Deaths in 2 seconds or less from a raid mistake are not on the player (your rule); say whose mistake it was.
7. A repeat is louder than a first time ("second time tonight").
8. Clean is said once, short and warm.

---

## 5. What to build, best first

| # | Change | Rating | Why | Size |
|---|---|---|---|---|
| 1 | **Rewrite the top card's lines** as who/what/fix sentences; no repeats; one big fix + two small | Amazing | It's the whole point of "at a glance", and the data is already there | Small |
| 2 | **Why we wiped tag** per pull and a tally for the night | Amazing | The raid lead's first question; no other tool answers it | Medium |
| 3 | **Further / same / short of last pull** on every pull, and "getting further" for the night | Solid | Momentum in one glance; already have pull % | Small |
| 4 | **Fold clean mechanics into one line; slips behind "Show small slips"** | Solid | Cuts the checklist roughly in half on a good pull | Small |
| 5 | **Move Copy for Discord and the note bar into small links on the card** | Solid | Two blocks gone from above the answer | Small |
| 6 | **Repeat flags** ("2nd time tonight", "again this week") on lines and in the Repeats list | Amazing | How raid leads actually judge; Report card and Homework gain it too | Medium |
| 7 | **"Just me" top card** when a raider picks themselves | Solid | Raiders read their own part; lighter for them | Small |
| 8 | **5-second test with 3 raiders** before going live | Solid | Free, and tells us if the top works | — |
| — | More scores, more charts at the top, removing detail | Bad | The opposite of the goal; detail stays, one layer down | — |

Do 1, 3, 4 and 5 together as the next test version (all small, all on the top card). Then 2, then 6.

## 6. How we'll know it's right
- **5-second test:** after five seconds, a raider can say what lost the pull and what to fix.
- **One screen:** on a laptop, the whole top card and the first mechanic line fit without scrolling.
- **Under 80 words** above the first mechanic line.
- Every line passes the writing rules in section 4.
- Discord: fewer "where do I see…" questions.

---

## Sources
- [boostroom] WoW Midnight raid leading 101: calm calls and clean kills — https://boostroom.com/blog/wow-midnight-raid-leading-101-calm-calls-and-clean-kills
- [visnalize] WoW raid progression mistakes — https://visnalize.com/blog/wow-raid-progression-mistakes
- [guildorder] Raid leadership — https://guildorder.com/games/wow/guides/raid-leadership
- [AAR-UNICEF] After Action Review (UNICEF) — https://clearinghouse.unicef.org/sites/ch/files/ch/teams-DAPM-Knowledge-DocumentLibrary1-After_Action_Review_production-10.0.pdf
- [AAR-baruch] AAR guidelines — https://blogs.baruch.cuny.edu/teaming/files/2022/07/AAR-Guidelines.pdf
- [sjsu] Writing for the web — https://sjsu.edu/digital/standards/writing-for-the-web.php
- [usf] How is writing for the web different — https://etc.usf.edu/techease/win/internet/how-is-writing-for-the-web-different/
- [wiki-PD] Progressive disclosure — https://en.wikipedia.org/wiki/Progressive_disclosure
- [uxcel] Progressive disclosure — https://uxcel.com/glossary/progressive-disclosure
- [uxstudio] Dashboard design (5-second test) — https://www.uxstudioteam.com/ux-blog/dashboard-design
- [cowan-arxiv] The Keyhole Effect (cites Cowan 2001, about four chunks) — https://arxiv.org/pdf/2602.00947
- [density] Density pattern — https://pattern-playground.onrender.com/patterns/density
- [whoop] The all-new Whoop home screen — https://www.whoop.com/us/en/thelocker/the-all-new-whoop-home-screen/
- [whoop-ux] Whoop, or how to gamify training — https://uxdesign.cc/whoop-or-how-to-gamify-training-3-6-billion-product-playbook-2a1380971b88
- [wowhead-WA] How to use WoWAnalyzer — https://cn.tbc.wowhead.com/how-to-use-wowanalyzer
- [mein-mmo] WoWAnalyzer guide — https://mein-mmo.de/en/with-the-wowanalyzer-you-will-become-the-right-top-raider,473112
- [WF-archon] How to improve your raid with Wipefest — https://www.archon.gg/wow/articles/help/how-to-improve-your-raid-with-wipefest
- [WF-faq] Wipefest FAQ — https://www.archon.gg/wow/articles/help/wipefest-frequently-asked-questions
- [exputer] What replay tools are changing about how competitive players improve — https://exputer.com/?p=444365
- [tactyx] Tactyx — https://saasbrowser.com/en/saas/1549853/tactyx
- [kollabe] Counter-Strike match retro template — https://kollabe.com/templates/counter-strike-showdown-league-match-edition
- [jku] What players want: information needs on post-game visualizations (CHI 2021) — https://research.jku.at/en/publications/what-players-want-information-needs-of-players-on-post-game-visua/
