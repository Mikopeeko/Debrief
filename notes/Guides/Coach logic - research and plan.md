# Coach logic — research and plan (Oct 22, 2026)

Your ask: "Build better logic for mechanical execution, do some deep research on how you can enhance the advice/logic",
and "check out Wipefest to see how they analyze things".

## What the research says

### How Wipefest analyzes a pull
- **Against real kills, not fixed rules.** Each mechanic gets 0–100: how the raid did compared to kills from the last week or
  two ("75 = better than 75% of kills"). Recent kills are put in buckets by their value on that mechanic (hits taken, time,
  orbs popped), and your value lands in a bucket.
- **Importance from the cleanest kills.** Mechanics are ranked as more important when the cleanest kills (top half by score)
  almost always do them right. If even clean kills often mess something up, it matters less. (Our Coiled Altar finding: the
  top kill dispelled Venomfang 1 of 6, so slow dispels are not a wipe cause.)
- **Player score** = "what the raid's score would be if everyone did this mechanic like you", weighted by importance, times
  the share of the fight they were alive for before their first death.
- **Wipes:** events after 3 deaths are ignored (our wipe filter). Some mechanics are shown but never scored (tank swaps).
- **Presentation:** short headings ("Failed to dodge rings from Echoing Screech") that open to who, when and how much; for
  one-shots a snippet of the guide. Its own known weakness: it can't tell when a player was forced into something, so a low
  score still needs a human to find the root cause.

### Coaching and feedback
- **Feed back, then feed forward** (Hattie & Timperley): say what happened (facts: when, how much), then where to next. Feed
  forward is the most powerful part and the one given least. Feedback about the task and the process works; feedback about the
  person ("you're bad at…") doesn't.
- **Error types need different fixes** (Reason): a **slip** (knew the plan, fumbled once) needs a short reminder; a
  **mistake** (doesn't know the plan, same error every pull) needs the plan explained, with the guide; a **lapse** (forgot an
  assigned job) needs a reminder tool (the NSRT reminder). Blame the situation before the person.
- **Raid leads** (Raiding - what matters): one cause per pull, the first domino; forgive once, talk on repeat; deaths caused by
  someone else's mistake aren't on the player.

## What our coach does today
- Picks the #1 well: first domino for the raid; for a player a stoppable death, then a serious miss, then their costliest
  Rotation slip; forgive once; nothing after the wipe filter.
- Gaps: (1) it says only the fix, not what happened; (2) every miss gets the same kind of advice, whether it was once or every
  pull, or a forgotten note job; (3) deaths caused by a raid mistake (orbs popping, Venom Rupture stacking) read as the
  player's own "press a defensive"; (4) no "getting better / still happening"; (5) no comparison with how kills do it.

## Ideas, ranked
| # | Idea | Rating | Size |
|---|---|---|---|
| 1 | **What happened + Next time** on every problem ("6 orbs in the 3rd frontal (aim for 2 or 3) → …") | Amazing | Small |
| 2 | **Advice by error type**: once = short reminder; every pull = explain it + "How to do it ›" guide link; a note job missed = "it was your job in the note, turn on the NSRT reminder" | Amazing | Small |
| 3 | **Root cause for deaths**: a death right after a raid mistake says what caused it, and the raid's line says how many deaths it led to ("led to 3 deaths") | Amazing | Medium |
| 4 | **Getting better / still happening** on night items (clean in your last 3 pulls drops lower) | Solid | Small |
| 5 | **Kill baselines** like Wipefest: "kills pop 2–3 orbs per frontal; we popped 6" and importance learned from clean kills | Amazing | Large (needs top-kill data per boss) |
| 6 | Player score × time alive (Report card) | Solid | Report card's |

Build 1–4 now on a test copy; 5 is the next big step (its own session: gather top-kill numbers per boss mechanic).
