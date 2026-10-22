# Site audit against the raiding research (Oct 21, 2026)

Does Debrief judge raiders the way raid leads do? Read from the code (`src/ui.js`, `src/engine.js`) and the live home page,
against `Raiding - what matters.md` (tolerance table, section 4) and `Raider checklist.md`. Coverage is in `Debrief gap list.md`;
this note is about **how** things are judged.

## Matches the research (keep)
- **Deaths judged fairly.** ≤2 s deaths aren't on the player; a Healthstone/potion only counts if they had time (≤35% for 2+ s);
  one-shots never count; deaths in a mass wipe don't count against defensives. Exactly how raid leads talk about deaths.
- **Wipe filter.** "Once a pull is lost, stop counting" is how leads review; the explanation on the site is clear.
- **Three flags, half-or-more = red, deaths red at 3+.** Matches "forgive once, a pattern is a problem".
- **Potion rules.** Holding a potion for Bloodlust is fine; short wipes don't expect one; pre-pot counts. Smart and fair.
- **Soak tolerance, harmless dispels never red, danger weights (Dreadmarch vs Venomfang).** Matches "weigh by what kills pulls".
- **Overhealing never judged; proc-driven rotation lines ungraded; Power Infusion rules.** Matches the healer and DPS research.
- **Recap voice.** Cause in one sentence, one "Next pull" fix, no blame: the between-pull routine raid leads recommend, word for word.
- **Talk to = mechanics and staying alive only.** Raid leads talk to raiders about those, not rotation.
- **"Needs a word" wording on Report card.** Same idea as the tolerance table's "a word".
- **Homework says "in 3 of 5 pulls" with a trend.** Partly covers "same mistake twice".
- **Home page promise** ("Every pull, explained… what to fix before the next pull") matches what raid leads want most.

## Worth a look (my take, best first)
1. **Why we wiped was missing.** Now built as a test version (not live): one verdict per wipe, a night tally, dots on the
   pull cards. Rating: amazing.
2. **Report card's boss grade leaves out the NSRT assignments.** Mechanics 30, Avoidable 30, Survival 25, Kicks 15; assignment
   misses are "on the Assignments tab". Raid leads rank "did your job in the plan" second only to deaths. Suggest: count note
   assignments inside Mechanics when a note is loaded. Rating: solid.
3. **Avoidable damage weighs as much as Mechanics (30 each), more than Survival (25).** Research order: deaths, then mechanics and
   jobs, then avoidable. Suggest Survival 30, Mechanics 30, Avoidable 25, Kicks 15. Small change, but check grades on two
   real nights first. Rating: solid.
4. **MVPs ignore throughput entirely** (execution 40, survival 30, ready 30). Raid leads want dependable mechanics *plus*
   above-average output; a grey-parse DPS who stays alive can be MVP today. Options: a small output share against the role
   median (10–20%, capped), or rename to "Most reliable". Rating: solid (the user's call: Graphs stays raw numbers).
5. **"Ready" is 30% of the MVP score**, but nearly everyone is flasked, so it barely tells players apart. A gate (lose points
   when missing) rather than a share would be fairer. Rating: lackluster on its own, worth doing with 4.
6. **No "second time tonight" wording.** Homework counts pulls, but Talk to and Report card don't say "again". Rating: amazing
   (it's the Repeat flags idea from the gap list).
7. **Wipe filter default is 2 deaths.** On Mythic 20 with battle resses, raids often play on after two deaths. Two keeps reviews
   clean but hides later mistakes. Worth testing 3 on real nights before changing; the user may have picked 2 on purpose. Rating: check first.
8. **Tank big-cooldown use (80% of possible = full marks).** Tanks often hold cooldowns for planned busters, so "as often as
   possible" can mark good play down. Low risk today (it's only part of Survival). Rating: lackluster.

## Not checked
- Grading on a second night (Warcraft Logs was down; tonight's shared Coiled Altar night was the only full night tested).
- Every boss module's thresholds: those were checked against top kills when each module was built (boss guide cross-checks).
