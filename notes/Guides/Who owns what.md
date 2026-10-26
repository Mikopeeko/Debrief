# Who owns what (chats and shared pieces)

Oct 22, from the user: "Make sure each chat is screening for changes that may affect them."
Every chat reads this before it starts a job and before it ships. Keep it current: when your area changes, edit your row.

## Chats and their areas
| Chat (session id) | Owns |
|---|---|
| Main chat (local_85f3abe9…) | Routing, relaying, sidebar tidy-up. Builds nothing. |
| Debriefing (local_b26a730c…) | The Debriefing tab; the **shared coach brain (coachSummary)**; Why we wiped; mechanic checks and titles; Debriefing maps; timing checks; kill messages; the NSRT healing-cooldown check; the **spell-name lookup** |
| Deaths (local_5c605dff…) | The **shared death verdict** (ui.js deathVerdict, deathOwn, deathFast, deathFix, deathTag, deathBox, and survivalOf's death part); the engine's death reading (engine.js explainDeaths: d.fast, d.t50, d.hitPct, d.mass, prevent/story; survivability's "still ready" list); the death chips and cards in the coach box; the one chip shape shared with Avoidable damage (shell.html, after the .cch2 .ach rules); the guides notes/Guides/Deaths - how to judge them.md and Deaths - checklists.md |
| Avoidable damage (local_a10708d1…) | Avoidable-damage rules and per-boss lists: engine.js AVOID_BASE / AVOID_BASE_H (kill lines, Mythic and Heroic), AV_SECS, avLim, avoidPanel (every boss's avoid sources), avoidMistakes, the avoid part of explainDeaths' ruleFor; ui.js avLimAt, coachAvoid, avTag/avBox (the chip cards), the single-pull hiding of the Avoidable damage row (wholeV), and the avoid line of KILL_BASE. Guide: Avoidable damage - how to judge it.md |
| Rotation (local_51aa9dea…; its Browser pane is local_bbb0619c…) | The Rotation tab and every spec's checks (specPage, genRun, GEN_SPECS); the Rotation coach (spcCoach); Gear and extras, including the **stat-item table (STAT_GEAR) and the engine's stat-buff record (p.statB)**; the Saves tile; Stasis research |
| Report card (local_b78a0848…) | The Report card, including the to-do list (Homework folded in) |
| Plan (local_94e40bb2…) | The Plan tab; NSRT notes and rosters; the cooldown planner and auto-picks; **team import** |
| Graphs (local_9f42adbe…) / Compare (local_4bd9a5ed…) | The Graphs tab / the Compare tab |
| Home (local_1c789a3d…) | Home (team page, You card with AOTC/CE, first-import loading card), switching characters (meSwitch), the character page ("See your summary"); places the "Your to-do list" card, whose contents are the Report card's |
| Live logging (local_04cfec25…) | Following live logs, the LIVE badge, the "Next pull" card, the live cutoff |
| Boss guides (local_8aeab157…) | src/guides.js: the Boss guides page (?guides) for all ten bosses, Heroic and Mythic: every card's text, map and Show a mistake map, the whole-fight videos on real kill clocks (sim, simSkip "Same again" cards), facts rows, Your job, What wipes us; the guide map kit (gdzKit, GDZ_SEG, GDZ_FLOOR stone masks, GDZ_GROW, label clamp in ui.js bindZoom); notes/Guides/Boss guides - how to build one.md, notes/Guides/Bosses/*.md, the guide audits. Uses the design system and the mechanic titles rule; Debriefing links into guide cards. Also **the Plan page's picture plan** (Oct 26, owner-only: the "Picture plan" block at the end of guides.js: the 🖼 Pictures button beside Plan's Copy for Discord, GDZ_PP, the raid lead's marker spots, the 1200×675 pictures) and the Worker's /api/art route. It reads Plan's notes through ndzDcNote and its helpers, so Plan tells this chat if it renames them |
| Boss coverage (local_6b12740b…) | Per-boss tuning for all 10 bosses, **kill baselines (KILL_BASE)**, the **Pace cards** (paceCard in engine.js, id 'pace', 8 bosses), the kill-checked rule fixes in each boss builder, notes/Guides/Boss coverage.md |
| Wipefest ideas (local_0a0cbd92…) | Inside the Debriefing chat's coach: the **top guilds tag** (KILL_DIST, kbRank, kbChip, .kbrank); **week to week** (weekOf, weekSave, weekPrev, wkCmp, weekLine, localStorage wla-weeks, .cch-wk2, x.wk/x.wkLine); the **two-tag rule** in coachTag; the "boom" rule in whyWiped; the All pulls countdown. Guides: Wipefest vs Debriefing - Oct 22.md, Week to week - how it works.md. Tells the Debriefing and In-game addon chats after each change |
| Coiled Altar strategy (local_5aee93b4…) | The strategy review (notes only so far) |
| In-game addon (local_e84455bd…) / Debrief Glow (local_b05d5a64…) | The Companion app (it **bundles a copy of the site's code**), the WoW addon and recap card, the Addon page / the glow addon |
| Design studio (local_8dfa830c…, the new chat since Oct 26; the first one, local_888b1822…, filled up) | **The ONE chat for graphics, design and layout** (since Oct 25): how every page looks and is laid out (spacing, type, colour, cards, tiles, bars, charts' visual style, icons, phone layout), on the site, the Companion app pop-up and the in-game card; **the design system** (notes/Guides/Design system.md), its shared style layer at the end of shell.html (--ds-* tokens, ds- classes), the shared ⓘ tip (.ds-i) and site-wide styles; **the design check** (src/design-check.ps1 + design-baseline.txt, run by build.ps1); before/after pictures and mockups; promo and Discord images when asked. **Other chats: send look, layout and graphics requests here, and tell it about anything new you build (the user, Oct 26: every new thing gets a design audit).** For a look change inside your area it changes markup and CSS only and tells you in one line |
| Front page and look (local_7ceb305c…) | The front page's content (with the Discord button and box); the boss header's logic (pull bars, wipe filter button, Change boss); the empty Plan page (Night and Rosters empty boxes, handed over by Plan on Oct 22); the "Warcraft Logs is down" bar. Its look comes from the Design studio |
| Discord (local_8db9c3e7…) / Bug fixes (local_0834854d…) | The Discord bot, bug and idea review, the patch-notes posts / fixes from bug reports |

## Shared pieces: change one, tell everyone who uses it
- **coachSummary (Debriefing):** used by Debriefing, Rotation, Report card, Copy for Discord and the in-game card.
- **deathVerdict (Deaths)** and the **avoidable rules (Avoidable damage):** used by the coach, Report card, Debriefing, Graphs and the in-game card.
- **KILL_BASE (Boss coverage):** used by the coach, mechanic checks and the avoidable rules; KILL_DIST (Wipefest ideas) must match its k/ok.
- **coachTag and the week-to-week summary (Wipefest ideas):** coachTag shows two tags on the coach box (full=true in the full coaching), and the addon export reads it; the wla-weeks summary reads pullSections and whyWiped, so a change to a section's id or its row flags changes what "last raid" compares.
- **paceCard / the 'pace' card (Boss coverage):** read by the coach (kbImp(pace) = 0, mechanic 'Pace'), FPB_MECH titles, IMPORTANCE.
- **The design system (Design studio):** every page. Its build-time **design check** warns every chat about off-palette flag colours and new text under 12px.
- **The boss header (Front page and look):** every tab with a night open (Debriefing, Rotation, Graphs, Report card, Compare, Live logging's next-pull bar).
- **Rotation's spec pages (rotOf → specPage, Rotation):** coachSummary calls them for the Report card and Debriefing, and spcCoach calls coachSummary back. The SPC_DRAW guard stops that loop, so keep it when you touch either side.
- **The spell-name lookup and the map drawing (Debriefing):** every tab that shows spells or maps.
- **Team import (Plan):** Home, Live logging, the Teams page and Plan.
- **The Plan block in ui.js (Plan):** everything from `// ---- Same player, another character` to `function assign(only, capture)`,
  including Debriefing's "Open the plan" and swap pop-up handlers and the NSRT paste window (Add NSRT note), is rebuilt from the
  Plan chat's own copy on every Plan ship.
  If you change a line in there, tell the Plan chat in one line so it copies it in (Oct 24: bc7dbe1's "open that note itself"
  was dropped by a Plan ship for a few minutes, then restored in c170da8).
- **PATCH_NOTES (everyone):** add your own line only.
- **The Companion app** carries a copy of the site's code. When the coach, death or avoidable wording changes, tell the In-game addon chat so it ships an app update.

## The screening routine (every chat)
1. **Before starting a job:** fetch origin/main and read the commits since your last ship (`git log --since=… --stat`). Look for changes to your files, your features or any shared piece above.
2. **If something touched your area:** re-test your feature on the test log (HWFBkCyc6JNazQrK, Coiled Altar Oct 21) before building on it. Fix what broke (a bug fix), or tell its owner.
3. **Before shipping:** build from a fresh clone of the newest origin/main. Re-check your feature and anything of yours that leans on a shared piece.
4. **After shipping a change to a shared piece:** message each chat that uses it, in one line, with what changed and what to re-check.
5. **When the Main chat relays "X shipped Y":** check whether Y touches you. If it does, re-test. If it doesn't, no reply is needed.
