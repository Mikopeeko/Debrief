# Quiet-bug hunt, Nov 15 (overnight)

The hunt looked for code on debriefme.io that quietly does nothing: an error nobody sees, or code that never runs.

## How it was checked
- **Nine code readers**, each on one area: the code after ui.js's big closure, the shell scripts, the engine and Warcraft Logs code, the guides and the side menu, the server Worker, swallowed errors, dead wiring, and guards that can never be true.
- **One page tester.** It opened every raid tab on real Wolfthorn nights (Nov 11, Nov 12, Twin Fangs and a shared night) in a hidden browser. It used a copy of the site where every hidden error is reported.
  - Pages: Summary, All pulls, one pull, Report card, Graphs, Rotation, Compare, Plan (signed out), all 10 boss guides, Home, Patch notes and In game.
  - It clicked the controls on each page.
  - Every request that would save something was blocked. 149 tries to save were stopped, and nothing but reads reached the site. It never signed in.
- **Every finding got two checks.** One tried to prove it wasn't a bug. The other judged what a raider would see after the fix.
- 72 reports came down to the bugs below. Not one was disproved.
- Mythic+ was left alone on purpose. No Mythic+ bugs turned up.

**Severity** is out of 10: how much a raider loses, and how often.

## Fix now (clear, proven, no judgment needed)

| # | Sev | Where | What's wrong | What a raider sees after the fix |
|---|---|---|---|---|
| 1 | 7/10 | ui.js:33627 | **The Summary's score strip vanishes on very short pulls.** If someone died in the first 10 seconds, the "Close calls" line reads a player with no data and throws an error. That throws away the whole raid's scores. | The score strip shows on those pulls too (Thu Nov 12 Coiled Altar pull 1: Pull score 96, Performance 29, Staying alive 100, Ready to raid 89). Other pulls stay exactly the same. |
| 2 | 6/10 | shell.html, round 423 | **Player names in Debriefing sentences are never class-coloured on debriefme.io.** The code reads a test-only hook that exists only on practice links, so Flex always saw it working. | About 100 names a pull turn their class colour, the same as on practice links. No numbers change. |
| 3 | 5/10 | ui.js:41978 | **The Timeline replay's "Last casts" still lists casts nobody pressed** (Reclamation, Shattered Souls and the rest). Flex asked for this on Nov 12, but the filter can't see its list, so it never ran. | Only real button presses show there. |
| 4 | 5/10 | ui.js:42121 | **Graphs: opening or closing a Defensives row throws an error** every time, and the row snaps shut on the next redraw. This is the twin of the Buffs-row bug fixed in 5f794474. | Open rows stay open. |
| 5 | 4/10 | ui.js:20586 | **Graphs > Debuffs misses the "avoidable" word.** The code asks for a list that doesn't exist where it runs, so it stops after the first pull. | On All pulls, the boss's avoidable debuffs are marked for every pull (Coiled Altar goes from 0 tags to 9). |
| 6 | 4/10 | ui.js:40368 | **Rotation Timeline: tapping a "!" that covers a stretch** (e.g. "sat ready") redraws the whole chart and closes the note at once. On a phone, that note can't be read at all. | The note stays open, like every other mark. |
| 7 | 3/10 | ui.js:39222 | **Summary timeline: names in sentences that aren't in that row's own list stay grey.** The whole-roster list is always empty. | Those names get their class colour (e.g. "Phartsy died to Putrid Membrane"). |
| 8 | 3/10 | ui.js:1300 | **"Warcraft Logs is down" bar never appears** when a pull download fails inside the background readers (since Oct 25). | The orange bar shows during an outage again. |
| 9 | 3/10 | engine.js:1639 | **Toxic Droplets "with an immunity" never shows on Warcraft Logs reports**, because Warcraft Logs writes an immunity as a 0 hit. | "(N immune)" notes and blue map flashes. The counts, colours and grades stay the same. |
| 10 | 3/10 | shell.html, round 236 | **The "single pulls only" guard reads the practice-link-only hook**, so on the live site it can rewrite rows on All pulls. Flex asked for that page to stay as it is. | All pulls is left alone, as Flex asked on Oct 29. |
| 11 | 2/10 | ui.js:40315 | **The Rotation Timeline's first-visit tour can start behind a pop-up** (the shared "is something open?" check is invisible there). | The tour waits until the pop-up closes. |
| 12 | 2/10 | ui.js:38108 + 38249 | **Two functions named dsHome.** An old Design-studio hook calls the wrong one and throws about 2,000 hidden errors per visit. | Nothing changes on screen, and the errors stop. The old hook is retired, not revived: reviving it would break today's Home. |
| 13 | 1/10 | ui.js tail | **Five more spots after the closure call names they can't see:** maps redraw, icon reload, the "not a mechanic" list, the guides hook and the number formatter. All are harmless today (something else covers each one), but they would drift. | Nothing changes. Each one gets made safe. |
| 14 | 2/10 | ui.js:39229 | **The Debriefing timeline's own "Note cooldowns" row has never built** (Nov 7). The closure already builds the same row, so it isn't missed. Reviving it would add a raid-wide row while one player is picked, which breaks Flex's player filter. | Nothing. The dead copy is removed, and the build's guard now checks the real row. |

**Discord bot (the bot Worker; only Main can publish it):**

| # | Sev | Where | What's wrong |
|---|---|---|---|
| 15 | 4/10 | worker_template.js:1354 | **One failing GitHub call stops every other Discord job:** the kill feed, #questions, reminders, welcome DMs and the digest. A failed reply can also copy the same bug post to GitHub twice. |
| 16 | 4/10 | worker_template.js:1457 | **The 10 am #patch-notes post always says 0 improvements and 0 fixes.** The day lines are now written on one line, and the counter only reads one-per-line. |
| 17 | 3/10 | worker_template.js:1232 | **The kill feed can lose a guild's first kill** when Warcraft Logs hiccups, because it marks the report read before reading it. |
| 18 | 2/10 | worker_template.js:623 | **Queued Discord jobs past the first 20 are deleted unread.** |
| 19 | 2/10 | worker_template.js:589 | **The morning digest is marked sent before it's sent**, so one Discord hiccup means no digest that day. |
| 20 | 2/10 | worker_template.js:398 | **Top-guild curve gathering can stick for good on one unreadable kill.** Nothing is stuck today. *Not fixed:* the guard would have to tell a broken kill from a Warcraft Logs hiccup, and a wrong guess skips a good kill forever. Left for a day with time to test it. |

## Judgment calls (Main ruled Nov 15, overnight)
- **A: restore.** It's back in src/wcl.js and src/worker_template.js. Each pull's answer is kept once for everyone (R2, or KV when R2 isn't there), so a pull costs the site's Warcraft Logs key once. Guarded by tests/quiet-rate-kill.js.
- **B: stop claiming it.** The rule stays, marked `notChecked`. The boss card says "Blood pool not checked yet", and no grade changes. It's in the fix queue in notes/Entombed Sentinels research.md. Guarded by tests/quiet-blood-pool.js.
- **C and D: left as they are, for Flex to decide.** C (Claudette's #questions on Claude) costs money per question and needs a key Flex sets. D (Improvements lines to #new-features) goes against the Oct 20 rule that small changes get no post.

| # | Sev | What | The choice |
|---|---|---|---|
| A | 6/10 | **The rate tiles lost "each raid's own scale"** (Oct 31, Flex: "do what will fix it"). The Oct 31 commit put `WCL.rateKill` and the `/api/ratek` route only in the built files, and the Nov 1 rebuild from source dropped them. Since then the tiles always use the built-in scale, without telling anyone. | Restore both (3 lines). Raid DPS/HPS/DTPS ranks and Boss damage "beats N%" move by a few percent on Warcraft Logs pulls. That's what the feature was approved for. It also adds one cached Warcraft Logs read per pull on the site Worker. **My take: 8/10, restore it.** |
| B | 6/10 | **The Entombed Sentinels "Blood pool" check can never flag anyone.** It's keyed to spell 1284208, which appears in all 262 library pulls only as one aura removal on the boss, never as damage. Boss cards still claim it's checked. | (A) Stop claiming it: remove the rule and the line. Nothing changes, because it never fired. (B) Revive it on Blood Venom 1284210. That needs measuring against top kills first: a rough try marks about 1 in 5 players amber on top Mythic kills. **My take: A now, B later with measuring.** |
| C | 4/10 | **Claudette's #questions answers never use Claude.** The bot Worker has no key and no site facts since the Oct 26 split. Any question that isn't in the FAQ gets "not sure" plus a mod ping. | Turn it on (it costs money per question; the bot would ask the site Worker, so the key stays put), or remove the dead branch. |
| D | 3/10 | **Improvements lines never reach #new-features review.** Only New features cards do. | Fix the reader, but only if that review queue is still wanted. |

## Left alone (dead code, nothing a raider sees; listed for a tidy-up day)
- About 25 retired Plan-page click listeners still run on every click, waiting for buttons that are gone (ui.js 4874 to 11666).
- About 78 helper functions inside the closure are never called. Most of dsGuides is dead, and so are a few guides helpers (gdzHowTo, ppCardsLE, ppCardsVA, ulP, tfSetH, ulBurst).
- Old Graphs "Healing / Overhealing" switch (shell round 242b), round 348 "one map", round 209/212 tag, and old Rotation checklist rows (.rcx-fr): never match anything.
- Side menu: Plan / Raid review badges are built but never shown, and the night-button click branch can't fire.
- `S.nightRep` / `S.realRep` / `r.allPulls` (the old merged night report) are read but never set. `wla-last-report` is saved but never read. `?m=` links are read, but nothing makes them.
- Two Ula'tek TITLE_FIX renames can never apply. The boss-card list FPB_MECH still names the old combined Ula'tek add cards.
- `tankJudged` (engine) is read but never set. Leave it: setting it would change grades.
- `nerfDay` is never called. `WLA_DESKTOP` / `WLA_API` are never set (desktop-app plan only).
- Unknown `/api/` addresses get the whole 14 MB app page instead of an error. No raider hits it.
- Cron failures only go to a console nobody keeps. Turning on Workers observability is a config choice for Main.
- tests/shoot.mjs's Patch-notes marker is stale: Patch notes is now the #pnzBox pop-up.

## Which check guards each fix
Each check fails on last night's code (origin/main 4fd7eb77) and passes on the fixed code. Every build runs them through tests/quiet-bugs.js, which contradictions.js runs.

| Fix | Check |
|---|---|
| 1 Summary score strip | tests/quiet-summary-close-calls.js |
| 2 + 10 Class-coloured names, single-pulls guard | tests/quiet-class-names.js |
| 3 Last casts | tests/quiet-replay-last-casts.js |
| 4 Graphs Defensives row | tests/quiet-graphs-def-row.js |
| 5 Graphs avoidable tag | tests/quiet-graphs-avoidable-tag.js |
| 6 Rotation mark tap | tests/quiet-rotation-mark-tap.js |
| 7 Timeline roster | tests/quiet-dbt-roster.js |
| 8 Warcraft Logs down bar | tests/quiet-wcl-down-worker.js |
| 9 Toxic Droplets immune | tests/quiet-sentinels-droplet-immune.js |
| 11 Rotation tour | tests/quiet-rotation-tour-waits.js |
| 12 dsHome twice | tests/quiet-tail-names-once.js |
| 13 Harmless closure names | tests/closure-names-outside.js |
| 14 Note cooldowns copy | tests/quiet-note-cooldowns-tail.js |
| 15 Discord jobs | tests/quiet-discord-jobs.js |
| 16 Patch-notes post counts | tests/quiet-patch-post-counts.js |
| 17 Kill feed | tests/quiet-killfeed.js |
| 18 Queued jobs past 20 | tests/quiet-dc-ops.js |
| 19 Morning digest | tests/quiet-digest.js |
| A Rate-tile scale | tests/quiet-rate-kill.js |
| B Blood pool | tests/quiet-blood-pool.js |

## New permanent checks
- `tests/closure-names-outside.js` catches the whole class: any code after ui.js's closure, or in a shell script, that uses a name only the closure has. It runs on every build. On the old code it listed 13 names, with no false alarms.
- `tests/quiet-bugs.js` runs every `tests/quiet-*.js` check: one per bug fixed tonight, each failing on the old code.
