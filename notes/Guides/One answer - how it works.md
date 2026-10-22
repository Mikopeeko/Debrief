# One answer — how it works (Oct 22, test version)

Your ask (through the class guides chat, after the new-raider walkthrough): "at a glance, and feedback on how to fix it",
with one answer everywhere instead of a different "fix this" on every tab.
Practice link: https://oneanswer-debrief.james-m-nemecek.workers.dev/?night=PLRbTkpI_S3vOfdSwJrDZw (not live).

## What you see
- **Debriefing, right under the boss banner** (first thing on a phone), two lines:
  - **Why we wiped**: the first domino of the pull, only from before the wipe filter ("Lost to Spiritcackle at 4:58 ·
    Set 4's adds were still alive"). On All pulls: **What wiped us**, the night's tally.
  - **Our fix** (Everyone) or **<Name>'s fix** (a player picked).
- **See why** under it holds everything Debriefing had (fix cards, maps, Better/Worse, every mechanic). Nothing removed.
  It stays open once opened; a link to a mechanic opens it by itself.
- **Homework #1** is the same fix ("Your one fix"), then the next two.
- **Report card**, Their night, **Next pull** is the same fix.
- The folded **Next pull / Next time** lines on Debriefing say the same fix too.
- **Picking a player is remembered** on Debriefing, Homework, the Report card and Rotation.

## How the fix is picked
- **Everyone:** the cause that wiped us most (on All pulls only if it wiped us twice or more), and its fix. When the cause
  is a player's mistake like "didn't pick up their soul fragments", the fix is that, turned around: "Pick up your soul
  fragments."
- **One player**, in this order:
  1. a death they could have stopped (their own mistake, a flagged mechanic row, something avoidable, or a slow death
     with a defensive, Healthstone or potion still ready);
  2. a serious mechanic miss of their own;
  3. their costliest Rotation slip.
- **Forgive once:** on All pulls a thing has to come up in 2 or more pulls. On one pull, the pull's own biggest item.
- Nothing after the wipe filter ever counts.

## The coach (Oct 22, later the same night; replaces the two lines)
Your ask: "an in-depth summary of what went wrong and what went right as if it is a world first raid leader, coaching them".
Practice link: https://coach-debrief.james-m-nemecek.workers.dev/?night=PLRbTkpI_S3vOfdSwJrDZw
- Top of Debriefing, under the banner: a headline, **What went right** (1–2), **What went wrong** (1–3, biggest first, each
  with its fix), **Focus next pull**, and **Read the full coaching** (why we wiped in the raid lead's words, what to work on
  in order with how, your deaths and whether they count, everything that went right). The rest of the page is unchanged.
- Everyone = the raid lead's view; a player picked = their own coaching.
- Shared brain for every tab: `coachSummary(reps, name)` → `{ headline, right, wrong, focus, full }`, and `coachBox(c, { title, key })`.
  `wrong[0]` is the one answer, the same as Homework #1 and the Report card's Next pull.
- A mechanic's fix comes from the mistakes on its own flagged rows; when two mechanics share a spell name (tank frontals and
  the ghosts' Soul Sever), its own short instruction from the title is used instead.

## Code
`src/ui.js`: `oaRaidFix`, `oaPlayerFix`, `oaFlip`, `oaRowWhy`, `oaFill`, `oaFold` (after `whyDot`); `whyWiped` now stops at the
wipe filter; the box is drawn in the banner block (`#oaTop` in `#bossHead`); `setOneP` also sets `hwSel` and `rcbSel`.
`src/shell.html`: `.oa*`, `details.oa-why`, `.hwk-one`.
