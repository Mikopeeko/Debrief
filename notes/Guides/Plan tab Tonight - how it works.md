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

## Heavy audit (Oct 24)
Every boss on Mythic and Heroic end to end (make, open, every section, Review, Done, the note checked: boss line, names on the
team, blocks closed), every Tonight control with page reloads, odd rosters (18, 30, no class, bench, 3, none), Back and Forward
with real clicks, 1280 / 768 / 390 px, wording and speed: no page errors. Fixed:
- **One note per players and difficulty** (notesSave and noteSaveText in ui.js, patched by apply-alt.js): a Heroic plan or
  pasted note for the same players replaced the Mythic one (Nymrissa and Kith'ix, 25 on both).
- Make it for me reuses a saved plan only for the same difficulty; its message says "these players" with Open on Tonight;
  new Heroic plans are "… Heroic plan". Other plans lists only this difficulty's plans as matches.
- **Each team keeps its own Who plays** (night.teams[rid]: lineups, own swaps, who's out), restored when you switch back.
- Make the missing plans skips bosses with the wrong number playing; an empty team says so with the add row.
- The roster editor's "Start from" row wraps on phones.

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

## Specs and fair lineups (Oct 25, the user: "they should be spec based assignments, and tank/healer/melee/ranged sections")
- **Specs from the team import:** a team brought in on Home now keeps each raider's spec (Warcraft Logs' player icon, like
  Paladin-Holy; the spec they played most nights). A team brought in before this reads its 3 newest raid nights again once, players
  only, when Plan opens (`planSpecBackfill`), and a roster made from it takes those specs (`planRosterSpecs`). So the table's Tanks /
  Healers / Melee / Ranged sections fill, and jobs and cooldowns go by spec. Code: apply-spec.js (wcl.js night query + teamImportRun),
  ndzBSp's `memOf`.
- **Pick a spec** (the user: "specs should be automatically imported, with the option to swap if needed for the roster"): + Add a
  raider shows the picked class's specs (role follows the spec). On the table (no ✎ Edit team needed) a raider's spec icon is a
  button: each tap moves them to their class's next spec (tank, healer, damage order) and says so; tapping the name still marks them
  out. The full roster editor (📋 Paste a list or get them from Warcraft Logs) has the same spec button on each raider and a Spec
  choice in Add a raider; a spec picked there wins over a log's when saved (spSet).
- **The first lineup brings every buff:** `pnPick` puts in anyone who brings a missing raid buff, debuff, Bloodlust or battle rez,
  in place of whoever in the same role has the least claim (bench first, then fewest sits), never another buff's only bringer.
  A fresh night has nothing to Swap in, and Pick who plays for me says "brings Power Word: Fortitude, and nobody else playing does".
- **Fair sits by role:** the ⚠ on Sits and the "sits N bosses" line compare a raider with their own role (tanks, healers, melee,
  ranged) when that role sits more than the raid: a Priest and a Monk healer who bring buffs play every boss, so the other healers
  rotate the healer sits, and top kills bring fewer melee than ranged (`pnFairOf`).
Test-run list (Oct 25) still open: Ready over half-filled jobs (Vashnik grips), big hits with no cooldown on some bosses, jobless
raiders on 25-player bosses (and tanks counted as jobless), a new team landing on the old Who plays page, Esc on the paste window.

## Out for everyone (Oct 26, the user: "Put all tabs live on my website")
- `ASG_OFF = () => false` (the old owner-only rule is in its comment). Everything that branched on it now shows for everyone:
  the Plan tab and menu item, ?plan, Debriefing's "Open the plan" / note bar, the shared-plan link.
- A visitor starts empty (no team, no notes; the sample notes button only exists on practice links and localhost).
- **No team yet:** the gold button is "Add my Warcraft Logs team →" (the Start now setup); "type the names instead" opens the roster
  editor, and Save comes back to Tonight. With a team, it's "Make my roster →" as before (the roster makes itself from the team).
- **Set classes:** pasted names have no class, so things to fix leads with "N raiders have no class yet" and **Set classes**; when
  half or more have none, the buff and role rows wait (they'd all be guesses). It walks one raider at a time: class swatches, then
  that class's specs, then the next; Skip and Done. A raider's "?" icon on the table opens it on them.
- Checked as a brand-new visitor (empty storage, practice link): no other team's names, the setup opens, 20 typed names → Set
  classes → 10 Ready plans, a box tap, a boss page, 390 px with nothing past the edge; and the owner's full checks (all bosses H+M,
  drag, specs) with no page errors.

## Raid nights and fixes on the rows (Oct 26, the user: "Build B, the two-week strip, and bake the fixes into the raider and boss rows")
Mockups by the Design studio (A a month calendar 6/10, B the strip 8–9/10, C the fixes on the rows); the user picked B + C.
- **Each night keeps its own setup** (team, Mythic/Heroic, who's out, who sits each boss, which bosses). The night on screen lives in
  `wla-night` as before, so every Who plays control works unchanged; the others wait in `wla-nights` ({ sel, d: { date: night } }),
  with that night's skipped bosses. Boss plans stay saved by who's in them: two nights with the same players share a plan.
- **The strip** (`pnWeekH`): this week and next, 14 days, ‹ › for other weeks. Raid nights are lit from the weekdays the team raids
  in its saved pulls (2+ nights on a weekday, `pnRaidDays`); set-up nights show "N of M ready" (green all, gold some, grey none),
  raid nights not set up are dashed "not set up". Tap any day = plan it: a new night starts from the last one on the same weekday (else
  the night on screen), with nobody out and short bosses refilled (`pnFresh` + `pnRefill`). **+ Add a night** (any date) and **Set up
  next week** (this week's set-up nights, plus raid weekdays, copied 7 days on; who's out clear). **Remove this night** in the top row.
- **Opens on** tonight if it's set up or a raid weekday, else the next one in two weeks (`pnNightOpen`, once a visit; the setup from
  before nights becomes that night). The title is the night ("Tonight" or "Tuesday, Oct 27"), and "Who plays on Tuesday".
- **Fixes on the rows (no yellow box on Tonight):** a raider with no class gets "⚠ no class yet · Set class" on their row and the
  count in Who plays' header (Set classes); a missing buff is a tag on its boss row ("⚠ no Fortitude · Swap in Optt", a button), or
  once over the bosses when it's every boss ("⚠ Nobody brings X"); ✨ Fill the open spots and ✨ Swap all in sit there too. Sits stay
  flagged in the Sits column; tank/healer/size problems stay the row's status.
- **One button a boss:** Plan it › (opens ✨ Make it for me / ✎ Build it myself in place), Open › when ready; Copy for the game lives
  on the boss page.
Checked on the practice link: switching nights (who's out per night), next week, add/remove a night, Plan it, a Swap in tag, the
no-class tags, all bosses Mythic and Heroic Ready, a new visitor, specs, phone (two rows of seven, short badges): no page errors.
- **Change spec (Oct 26, the user: "the way you change their spec isnt clear… 'swap spec'", then "put the spec picker by the down
  arrow not at the top"):** every name block has a ▾ (`.tn-spv`); it (or the spec icon) opens a small pop-up right under it
  (`tnSpecPop`, fixed, flips above near the bottom) with the class's specs and their role, the current one lit; a pick saves and moves
  them to their section; Escape, a tap elsewhere or a scroll closes it. The hint line starts "Tap the ▾ on a name to change their spec".
