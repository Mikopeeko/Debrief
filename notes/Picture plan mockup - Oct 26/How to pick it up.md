# Picture plan mockup (Coiled Altar Mythic): back on, Oct 26

## Timeline
- Oct 26, paused. The user: "abandon this plan for now, keep it in notes".
- Same day, back on. The user: "it actually looks good, lets continue with it and see what happens. Though, i want to see the whole
  boss arena for this one in each image". Then: "Make sure all the mechanics that are neccesary are accounted for".

## Where it lives (the user, Oct 26)
- On the Plan page only, never on the Boss guides page: "So these wouldnt actually be for the boss strat page, just the plan page".
- The goal: "auto fill based on assignments in the plan tab, and these assignment images be posted directly with the assignments on
  the preview screen". The preview screen is Plan's Copy for Discord window.
- The guide's room maps are only the drawing base. The Boss guides page doesn't change.

## BUILT: version 1 on main (5433161, Oct 26), only the user sees it, not deployed
- The user: "can you begin implimenting that plan for me", then "let the raid lead select which raid marker the mechanics happen on
  when they are used and give the raid lead a way to change the marker positions".
- Where it is: a **🖼 Pictures** button next to every Copy for Discord button in Plan (a MutationObserver in guides.js adds it; Plan's
  code is untouched). It opens #ppWin:
  - A **Markers** panel: drag the 8 raid markers on the room, pick the marker for each mechanic (phase 1 axes, the Venom Rupture
    stack, the Dreadmarch stack, phase 3 axe 1, phase 3 axes 2 and 3), and go back to the raid's spots. Saved in localStorage as
    wla-pp|<boss>|<diff>.
  - Then one **1200×675 picture** per mechanic, with Copy and Download.
- Code: the `// ---- Picture plan (Oct 26` block at the end of src/guides.js (GDZ_PP per boss and difficulty, ppReadCA reads the note,
  ppCardsCA builds the scenes, ppDraw draws the canvas, ppOpen is the window). Plus the Worker route /api/art/<file>, which hands
  over RaidPlan's room render because RaidPlan won't let a page copy it into a canvas.
- Starting spots, from the raid's pulls:
  - moon (-37, 37): phase 1 axes
  - circle (25, -35): Dreadmarch stack and phase 3 axes
  - the Venom Rupture stack: by the boss (5, -11)
  - plus the six orb markers below
- Practice link: https://pictures-debrief.james-m-nemecek.workers.dev (open a note in Plan, then 🖼 Pictures).
- Source files here: pp_mod.js (the module), ppmod.js and ppart.js (the fix scripts that add it), ppread_test.js (the reader test
  in node on the real note), paxe.js and pstack.js (axe soak and stack spots from saved pulls).
- 02dd23a: the 🖼 Pictures button also sits beside "Copy for the game" on a boss's plan page. That header has no Copy for Discord.
- d0805ad: the Design studio's round 57 restyle of #ppWin.
- 7234f60: its four logic fixes.
  - Marker dots follow the map on resize.
  - Picture text is about ×1.35 and steps down only to fit.
  - Download all makes one zip (ppZip).
  - The h2 names the boss.
- **d7af809: pictures inside Plan's Jobs cards** (the Design studio's mock, the user's priority):
  - Small square map crops on the right of each card (div.pj-pics > button.pj-pic), drawn when a card scrolls near and kept per note.
  - A tap opens #ppWin.pp-one: one picture, ‹ previous · next ›, All 12 pictures.
  - Card titles map to pictures in GDZ_PP[...].jobs.
- 2d2e45d: the pictures moved to a row under each card's assignments ("they should be in a horizontal row under the assignments").
- 08cbd9d: **Copy all**, one sheet with every picture, sorted by phase and numbered, under 8 MB for Discord.
- c307dff:
  - Numbered pictures sit beside their own row ("line the image up with the assignment next to it").
  - Markers start at the **guide's strategy** spots; "Use your raid's spots" is one click away.
  - **Right-click** a marker (hold on a phone) to swap its mark.
  - Plan's own div.pj-pics[data-mech] spots are filled by key.
- Updating the module on main: `FIX="ppupd" sh tbca.sh` (it swaps the block at the end of guides.js for pp_mod.js), then ship2.sh.
- **Where the pictures go next (the user, Oct 26):** "the assignment images/raid plans should be posted in this section, small images
  that can be made larger. They should be organized with the corresponding assignments" (this section = Plan's **Jobs** section on a
  boss plan page). Then: "ask design for advice on the layout".
  - Asked the Design studio for a mock first.
  - Suggested picture-to-card fit:
    - kicks: Spiritcackle (it also shows the curses)
    - Guillotine soaks: axes 1 and 2
    - P3 Grim: three pictures
    - Purple orbs: phase 1 orbs and the phase 3 diamond
    - Dreadmarch: Dreadmarch
    - Raid cooldowns: the Venom Rupture stack and the intermission stops
    - Gloombomb has no card yet
  - The Jobs cards are Plan's code: add the thumbnails from guides.js after Plan renders, or Plan calls ppDraw itself.
- Next: the Design studio's layout, then the other 9 bosses (each needs its GDZ_PP entry: marker defaults, uses, read and cards).

## On hold until the reminder (superseded: started the same day; the Discord chat was asked to drop the reminder)
- The user said "not right now, tell discord to remind me later".
- The Discord bot pings them in #moderator-only on Oct 27 at 9:00 AM Central, with the practice link (bot reminders in KV `dc-remind`,
  1f1f470).
- Keep the `pictureplan` practice link alive until then. If it's replaced, tell the Discord chat the new link so it can update the
  saved text.

## Where it stands
- Practice link: https://pictureplan-debrief.james-m-nemecek.workers.dev/?pictureplan (built on 11adf35).
- Not on main, not live.

## What it shows
The page is built from the user's REAL note, "Mythic plan, Oct 22". The Plan chat read it from their browser with their OK; it is
plan-coiled-altar-mythic-assignments.json in the shared notes folder.

Every picture shows the whole arena. It has 11 cards in fight order:

1. **Every mechanic.** A checklist of each mechanic that needs a job or a spot, how it's covered (a picture, or a line when there's
   nothing to draw) and where it comes from (your note, your logs, the guide).
2. **Phase 1 Toxic Deluge.** Purples on the raid's own markers, greens, helpers and tanks. Both frontals are drawn in order: south
   first at Vandagos, then north after Tyralien's taunt.
3. **Guillotine 1 (0:48) and Guillotine 2 (2:13).** Two cards: the note's soakers, External and Zephyr. The target is a grey ?.
4. **Venom Rupture (2:48).** The stack, with the note's cooldowns at 2:48 to 2:51.
5. **Dreadmarch.** The note's crowd-control order, with the phase 2 and phase 3 times. Mind controls are a grey ?. The stack spot is
   the guide's square.
6. **Spiritcackle.** Both kick lines in order, plus the curses on both adds. The line with the melee goes on the unmarked add,
   because the note doesn't say which line takes which.
7. **Gloombomb.** From the guide: 2 random ranged bombs to the marked add, 2 random melee bombs to the unmarked one.
8. **Intermission.** The note's first fragment stops at 0:05, each soaker on their marker, Bloodlust on Zul'jan, and the note's
   intermission cooldowns.
9. **Phase 3 purple diamond.** The guide's shape, with the note's carriers by marker. The Oct 21 phase 3 drops were in the middle,
   like the guide.
10. **Grim Guillotine 1 to 3.** Three small maps, each with its External and Zephyr.

Mechanics shown as a line only: Fangs (stay in the lane), Axegrinder, Venomfang dispels, Eternal Nightfall, Defilement and
Corrupted Toxin, Gloombomb with no adds.

## The raid's marker spots, from their own pulls
The source is the log library, C:\Users\james\DebriefLogs\nights:
- a01281b2_lastnight = Oct 22, 35 pulls (bcA9kw3mxHKzr4fR)
- c6d39614… = Oct 21 (HWFBkCyc6JNazQrK)

Each purple carrier's Mutagenic Venom (1310498) ends where they drop the orb, and it's the same spot every set on both nights.
Positions are in yards from the room's middle, x east and y north:

| Marker | Spot | Who drops there |
|---|---|---|
| Cross | (-5, 30) | Boltzzx |
| Triangle | (5, 29) | Tyralien or Schooty that night |
| Square | (-4, -31) | Arsyn |
| Diamond | (7, -32) | Komo |
| Star | (2, 16) | Schooty, green |
| Skull | (-2, -23) | Volkovod, green |

Tanks at each Sever (psever.js): Vandagos stands south for the first, then Tyralien north for the second.

No saved pull reached the intermission with clear soaks, so the intermission soakers are drawn on these same marker spots.

## The files here
- `pplan.js`: the test-build fix script.
  - It hands the map pieces (GDZ_CA_M, GDZ_CA_AXES, gdzKit, miniMap…) to window.__ppK when the page was opened with ?pictureplan.
    It reads the opening address, because the site tidies the address bar.
  - With `PPV=1` it also puts the page inside guides.js, which the practice link needs.
- `pplan_view.js`: the page itself, with the note's jobs in NOTE and the marker spots in MK.
- `ppos.js`, `pcarry.js`, `psever.js`: node readers for one saved pull (gz or plain log). `node pcarry.js <pull>` lists every orb
  carry with where it was picked up and dropped.

## To rebuild
- Practice link, from the Boss guides scratchpad:
  ```
  PPV=1 FIX="pplan" sh tbca.sh
  cd ckpt_ca
  npx wrangler versions upload --preview-alias pictureplan
  ```
- Local test page: `FIX="testexp pplan" sh tbca.sh`, then append pplan_view.js to srv/WoW-Log-Analyzer.html.

## Design studio audit (Oct 26)
Idea and content 9/10, look 7/10. What takes it to 9 (apply when the real build happens on Plan's Copy for Discord preview):
1. Phone header: under 640 px, the phase chip goes above the title and the title is 18 px. Desktop title 20 to 22 px.
2. Phase chip: the site's quiet pill (dark fill, 1px edge) with a phase-coloured dot (P1 blue, P2 purple, Int gold, P3 red, the
   guides' spine colours) and the times in muted. Not gold-filled, which on the site means a primary button.
3. Checklist source tags ("Your note", "Your logs", "Guide"): 12 px grey pills, because they show where a fact came from, not a
   status. Keep the green "Picture / Line" words.
4. Legend:
   - Marker words become raid-marker icons (markIcon() exists), with the word as a tooltip.
   - Legend boxes use the site's raised panel: var(--raised), 1px rgba(255,255,255,.16), radius 10.
5. Export:
   - "Save picture" renders a fixed 1200×675 frame (16:9 for Discord): title and phase chip top-left, the square map on the left at
     full height, the legend on the right, one footer line, and a small Debrief wordmark bottom-right.
   - The on-page card can stay fluid.
   - Long names in the phone legend wrap to two lines instead of being cut off.
6. Twelve-pixel floor. Sections use the site's card shell (panel background, radius 12, 1px line).
- Next for the Design studio: the per-boss plan page's job cards grow these maps, with names filling in as jobs are assigned. Tell
  it before starting, so it can mock the card first.

## Still to do
- A "Save picture" button: one image per card, for Discord.
- The Design studio's look pass. On a phone the card title squeezes beside the phase chip.
- Plan to own the note-to-spots mapping, so any note works, not just this one.
- The other nine bosses.

- Oct 26, 5ea8583: every window card carries data-legend (JSON of its legend: groups {title,color,sub,items:[{name,color,specIcon,job,any}]}) for the Design studio's "Your jobs" block on the Copy all sheet. Practice link version 9afd5dc3.
- Oct 26, d13e632: OPEN TO EVERYONE (the user: "push this live please"): PP_ON is now always true (put the owner check back there to hide it again); New features card "Plan: a picture for every job" on the Oct 26 patch notes. Handed to the Manager (Main) chat for the live build.
