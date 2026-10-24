# Plan tab: Tonight and the boss page - how it works

Since Oct 24 (the user's call, "B" from `notes/One page plan - Oct 24/Plan doors - mockup.html`): fewer doors. The Plan tab opens
on **Tonight**; a boss opens its **boss page**; ← Tonight comes back. Owner: the Plan chat. Plan is still only visible to the
owner on the website (greyed for everyone else).

## Tonight (the home page)
- Top: "Tonight", Mythic / Heroic, your teams as chips (tap one to plan with it; **+ New team**), and **📋 Paste a note**
  (one for every boss: the note's first line, EncounterID, says which boss it's for).
- **1 · Who plays tonight**, one table (the user's call, Oct 24: "make it perfect", then compact):
  - the summary (raiders by role, the sizes), **✨ Pick who plays for me**, **+ Add a raider**, **✎ Edit team**, and
    **Hide the table / Show the table** (remembered in this browser; hidden, one line says who's out and who sits more than most);
  - **things to fix** on top as a strip, side by side (missing buffs with Swap in, Swap all in, short of players with Fill);
  - the table: the names column is the team in class colours, by role (tap a **name** = out tonight; tap again = back), each
    boss a column (its picture, a plan dot, untick to skip it this week, how many play: 20/20, or just the number on Nymrissa and
    Kith'ix), tap a **box** = sit or play them on that boss, drag a box onto another to swap; **Sits** flags anyone sitting one
    more boss than most (⚠ 3); the names stay put when the table slides on a phone; it fills the width (rows stay short);
  - ✎ Edit team: tap a name = bench or back, × = off the team (Undo in the message), the team's name, and an add row (name,
    class colours, Tank / Healer / DPS); 📋 Paste a list or get them from Warcraft Logs opens the full roster editor.
- **2 · Bosses**: one row per boss in raid order: picture and name (click = open), the plan's name, "20 play · sitting: …"
  in words, a status (✓ Ready / ⚠ the most important problem, like "⚠ Power Word: Fortitude" or "⚠ 19 playing" / No plan), and:
  - no plan: **✨ Make it for me** and **✎ Build it myself**; ready: **Open** and **🎮 Copy**; a missing buff someone can bring:
    **Fix**; the wrong number playing: no button until it's a size the boss takes (fix it in the table);
  - **✨ Make the N missing plans** on the section's header says which bosses it made and which have something to look at.

## Raid sizes (the user's rule, Oct 24)
Every Mythic boss is exactly 20, except **Nymrissa and Kith'ix: 15 to 25** on Mythic too. Heroic flexes **10 to 30** (the game's
range; the user's 15 to 25 always fits). One rule (`pnRange` in ndz-night.js) for picking (flexible bosses take everyone in, up to
the top), counts, Fill, Tonight's warnings, carrying plans and the build page's roster check. A plan counts only for its own
difficulty (its first line), so the 25 on Nymrissa get separate Mythic and Heroic plans.

## Swaps keep the plan (Oct 24)
When who plays a boss changes (Fix, Swap in, the table, Pick who plays for me, someone out and Fill), its plan follows: whoever came
in takes the jobs of whoever sits (same role first), saved as a plan for the new players and used straight away; "Plans kept up
to date" says who took what (and any cooldown the newcomer can't press). A 20-player boss waits until it has 20 again, so a swap
done in two taps loses nothing. A flexible boss carries from the original plan each time. One carried copy per original.

## After the full pass (Oct 24, the user's "do 1 to 5")
- **Tanks and healers:** each boss needs the tanks the fastest kills bring (usually 2) and at most one healer fewer than they
  bring (`pnRoles` in ndz-night.js). Short shows on Tonight's row ("⚠ only 1 tank") and in things to fix ("Short of tanks on …").
  A tank who sits hands their jobs only to a tank; otherwise the jobs stay empty and "Plans kept up to date" says so.
- **Show me how** on a boss page runs Plan's own six tips (`PLAN_TIPS` in ndz-tonight.js): the old ones only ran with a log open,
  so nothing happened on Plan, and they described buttons that are gone.
- **Paste a note:** a note whose first line names its boss, with nothing to flag, goes straight to Ready to save.
- **Someone out** (or taken off the team): the message has **✨ Fill them** (fills every boss that's now short).
- **✨ Make it for me** with nothing to change says "Already up to date" (no Undo); **Cancel / Save on + New team** comes back to
  Tonight.
- Checked the ?plan link: it does open Plan on the practice link and for you on the site.

## The boss page
- ← Tonight, the banner: the plan's name and **⇄ Other plans** (this boss's saved plans: open, delete, make a new one).
- The ready check (ring, ticks) and the four buttons, the same names everywhere:
  **✎ Edit plan** (the build page) · **✨ Make it for me** (redo for the same raiders, says what changed, Undo) ·
  **📋 Paste a note** · **🎮 Copy for the game**; ? Show me how stays.
- **Who plays**: one line (how many, who sits) with ✎ Change (the separate Who plays page, with "Changes save as you go" and
  **✓ Done** back to Tonight).
- Raid buffs (full width) and the cooldown chart, as before.
- **Jobs**: the same cards as the build page's summary ("Your plan"), read only, each with ✎ Change, which opens the build
  page right at that section. One editor: no × or + on the boss page.
- A boss with no plan shows the three start choices (Make it for me, Build it step by step, Paste a note).

## Gone (on Plan only)
The Who plays › Boss plans › Into the game bar and its Next button, the boss picture strip, "or make the missing plans for me",
the links at the bottom (All notes · Load a note you already have; All notes still opens from Manage rosters), the banner's
✏️ Edit and 🗑 (Edit is in the main row, delete in Other plans), "Copy for" + "🎮 Game" (now 🎮 Copy for the game), the jobs'
By mechanic / In fight order switch and their × / + (the build page does the editing), the roster dropdown on Tonight (chips),
and the separate "1 · Your team" section (the table's names column is the team). Who plays' own button is
**✨ Pick who plays for me** (it picks who sits; "Suggest for me" is a plan's).

## Paste a note (fixed Oct 24)
The paste window used to pick its boss before anything was pasted, so a note pasted from Tonight or "Load a note you already
have" (or Debriefing's Add NSRT note, for another boss) was saved under the boss that was open. Now the note's EncounterID line
decides, unless you pick a boss in the window or pasted from a boss's own button.

## Where it lives (code)
`ndz-tonight.js` (planTonightH, planTeamCellH, the team clicks, data-tnmiss, data-tnfold, planCarry, planWhoLineH,
planJobCardsH, data-plbgo), with hooks in ndz-night.js (pnRange / pnFits / pnSize, pnNoteDiff, pnH('grid'), the grid's name cell
and counts, pnSet → planCarry), ndz-plantab.js (planV0 default 'tonight', planPage, planAssign's headB, planBuildHead, the banner),
ndz-dash.js (the four buttons, Who plays line, jobs), ndz-builder.js (S.plbGoTo, ndzSize), ndz-new.js (the paste window's boss) and
the CSS steps "plan tonight", "plan tonight team", "plan one table", "plan one table compact", "plan one table top", "plan carry
box" and "plan who plays done" in apply-alt.js.

## Checked (Oct 24)
Headless Edge on the practice link with the test roster, all 10 bosses on Mythic and Heroic: Make the missing plans, each boss
page (cards, four buttons, Who plays line), ✎ Change landing on its section, Review, Done back on the boss page, ← Tonight;
the table (out and back, a box, bench, × and Undo, add, rename, Done, hide / show remembered), Fix keeping the plan, a two-tap
swap carrying the jobs, sizes (25 on Nymrissa and Kith'ix, 20 elsewhere, Heroic everyone), no page errors; 1702, 1280, 1024 and
390 px.
