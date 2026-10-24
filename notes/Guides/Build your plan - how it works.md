# Build your plan (one page) - how it works

Plan's guided setup ("Build it step by step" on a boss's card). Since Oct 24 it is one page instead of nine Back / Next pages.
Owner: the Plan chat. Pictures: `notes/One page plan - Oct 24/`.

## What the raid lead sees
- A banner: the boss, "Build your plan · saves as you go", Close.
- A chip bar that sticks to the top while you scroll: one chip per section (spell icon + name), then Raid cooldowns,
  Defensives and Review. Tap a chip to jump to it. The chip you're reading is gold; a section with picks gets a green ✓.
  On the right: "N of M filled".
- One section per mechanic, numbered ("1 · Spiteful Soulcoiler kicks"): the explanation, the tip, its own
  ✨ Suggest for me (one click, then "Suggest again" with Why these picks) and Clear, then the job blocks.
- Raid cooldowns: starts empty. Under every big hit there's one "+ Add a cooldown" picker. Cutting damage first, then healing;
  each sorted by how often top raids press it there ("62% of top raids"). It leaves out a cooldown that isn't back yet
  and a second copy of one that doesn't stack. Pick as many as you like; × or Remove takes one off.
  ✨ Suggest for me fills them the top-raids-first way (see `Healing cooldowns - how Debrief assigns them.md`).
  The line under the title says where they came from ("You picked these yourself", "Placed the way top raids do it", or
  "These start from your last note").
- Defensives: the personal defensives, Healthstone and potion, with ✨ Suggest for me.
- Review (the last section): the plan written out, what's still open grouped by section ("Guillotine soaks: 6 to look at", tap
  to jump), the note as it will be saved, Copy for Discord.
- A bar along the bottom: a gold progress line, "Saved ✓", 📋 Copy for the game, Done.

## Saving
- Nothing is saved until the first pick. Then it saves itself about a second after each change.
- The first save makes a new plan for that boss with its own name (it never merges into another plan), saved with the
  players in Who plays, and makes it the plan in use. Later saves update that same plan.
- Done saves and opens the plan page. Edit on the plan page opens this page again with the picks (only the plan's own picks;
  the empty slots stay empty, no suggestions slip in).
- Close works like Done: it saves what's there and leaves (with nothing picked, nothing is saved). Refreshing the page
  asks first only if a change hasn't saved yet.

## Rules kept from the step pages
- Pages start empty; nothing is picked for you unless you press Suggest.
- Any Suggest that changes picks you made says what changed (in / out per job).
- Healers can't kick except a Restoration Shaman.

## Where it lives (code)
- The scratchpad pieces joined by `apply-alt.js`: `ndz-builder.js` (ndzBuildView's one-page mode `ONE`, plbOneHead,
  plbOneFoot, plbIssGroup, plbSaveNow / plbAutoSave, plbSpy; the per-hit picker ndzFreeH) and CSS steps marked
  "plan one page builder / sections / polish / tick".
- Off the Plan page (anywhere else the builder opens) it's still the old one-step-at-a-time view.

## Checked (Oct 24)
Headless Edge on the practice link with the test roster: Suggest fills a section and ticks its chip, a cooldown pick saves a
new plan, Done opens the plan (23 job names, the cooldown), Edit reopens the one page with the same picks; 390 px phone with
no sideways scrolling.
