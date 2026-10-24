# Plan tab: Tonight and the boss page - how it works

Since Oct 24 (the user's call, "B" from `notes/One page plan - Oct 24/Plan doors - mockup.html`): fewer doors. The Plan tab opens
on **Tonight**; a boss opens its **boss page**; ← Tonight comes back. Owner: the Plan chat. Plan is still only visible to the
owner on the website (greyed for everyone else).

## Tonight (the home page)
- Top: "Tonight", Mythic / Heroic, the roster picker with ✎ Edit, **Who plays, boss by boss** (the big grid) and
  **📋 Paste a note** (one for every boss: the note's first line, EncounterID, says which boss it's for).
- "N of 10 ready", how many need a plan and how many things to fix, and **✨ Make the N missing plans**: each boss with no plan
  gets one for the players in Who plays; the box on top says which bosses it made and which have something to look at.
- Who plays' **things to fix** (missing buffs, Swap in, Swap all in), the same box as on the grid.
- One row per boss in raid order: picture and name (click = open), the plan's name, "20 play · sitting: …", a status
  (✓ Ready / ⚠ the most important problem, like "⚠ Power Word: Fortitude" or "19 of 20 playing" / No plan), and buttons:
  - no plan: **✨ Make it for me** and **✎ Build it myself** (the one-page build page for that boss);
  - ready: **Open** and **🎮 Copy**; with a missing buff someone can bring: **Fix** (swaps them in and says who and why).
- A Fix or a swap changes who plays that boss, so its plan no longer matches and the row goes back to No plan
  (a plan only loads with its own players). Make it for me again, or open it and use the plan's players.

## The boss page
- ← Tonight, the banner: the plan's name and **⇄ Other plans** (this boss's saved plans: open, delete, make a new one).
- The ready check (ring, ticks) and the four buttons, the same names everywhere:
  **✎ Edit plan** (the build page) · **✨ Make it for me** (redo for the same raiders, says what changed, Undo) ·
  **📋 Paste a note** · **🎮 Copy for the game**; ? Show me how stays.
- **Who plays**: one line (how many, who sits) with ✎ Change (the grid).
- Raid buffs (full width) and the cooldown chart, as before.
- **Jobs**: the same cards as the build page's summary ("Your plan"), read only, each with ✎ Change, which opens the build
  page right at that section. One editor: no × or + on the boss page.
- A boss with no plan shows the three start choices (Make it for me, Build it step by step, Paste a note).

## Gone (on Plan only)
The Who plays › Boss plans › Into the game bar and its Next button, the boss picture strip, "or make the missing plans for me",
the links at the bottom (All notes · Load a note you already have; All notes still opens from Manage rosters), the banner's
✏️ Edit and 🗑 (Edit is in the main row, delete in Other plans), "Copy for" + "🎮 Game" (now 🎮 Copy for the game), the jobs'
By mechanic / In fight order switch and their × / + (the build page does the editing). Who plays' own button is now
**✨ Pick who plays for me** (it picks who sits; "Suggest for me" is a plan's).

## Paste a note (fixed Oct 24)
The paste window used to pick its boss before anything was pasted, so a note pasted from Tonight or "Load a note you already
have" (or Debriefing's Add NSRT note, for another boss) was saved under the boss that was open. Now the note's EncounterID line
decides, unless you pick a boss in the window or pasted from a boss's own button.

## Where it lives (code)
`ndz-tonight.js` (planTonightH, the data-tnmiss handler, planWhoLineH, planJobCardsH, data-plbgo), with hooks in
ndz-plantab.js (planV0 default 'tonight', planPage, planAssign's headB, planBuildHead, the banner), ndz-dash.js (the four
buttons, Who plays line, jobs), ndz-night.js (Pick who plays for me), ndz-builder.js (S.plbGoTo), ndz-new.js (the paste
window's boss) and the "plan tonight" CSS step in apply-alt.js.

## Checked (Oct 24)
Headless Edge on the practice link with the test roster, all 10 bosses on Mythic and Heroic: Make the missing plans, each boss
page (cards, four buttons, Who plays line), ✎ Change landing on its section, Review, Done back on the boss page, ← Tonight;
no page errors. Fix on a row, Who plays and back, Build it myself, a pasted Ula'tek note landing on Ula'tek; 390 px phone.
