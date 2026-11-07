# AGENTS.md: rules for any AI coding tool working on Debrief

Read this first, then CLAUDE.md (build steps) and notes/Design rules.md (look and layout).
Debrief (https://debriefme.io) reads World of Warcraft raid logs and explains every pull.
The owner, Flex, is not a programmer. Write anything he reads in plain, short, friendly words.

## Hard rules (never break these)
- Work on your OWN branch (e.g. `chatgpt/<topic>`). Never commit to or push `main`.
- Never deploy: no `wrangler deploy`, no `wrangler versions deploy`, no Cloudflare changes.
  The Main chat (Claude) tests your branch on a practice link and Flex decides what goes live.
- Never read, print, ask for or change secrets (WCL_CLIENT_SECRET, BNET_CLIENT_SECRET, any key or token).
- Never touch sign-in, sessions, Battle.net linking or guild-rank access (src/worker_template.js auth,
  /api/whoami, /api/teamplan, /api/gnote). Those are being reworked; leave them alone.
- Never remove a feature unless Flex asked for that exact removal.
- Don't edit the built files by hand (WoW-Log-Analyzer.html, online/worker.js); edit src/ and rebuild.

## How to build and check
- Edit files in `src/` only. Build: `src/build.ps1` (PowerShell) from the project root.
- Run the checks: `node tests/contradictions.js`. It must pass. Never weaken or delete a check to make it pass.
- Say in your commit message what changed and why, quoting Flex's request.

## Game rules the site follows (Midnight, patch 12.1.5, The Venomous Abyss raid)
- Only use 12.1.5 data. Talent ids come from Raidbots' live talents.json. Don't guess spell ids.
- Healers have no interrupts, except Restoration Shaman (Wind Shear, 30 s).
- Wipe call: with "Wipe call: on", every count stops at the pull's wipe call. Deaths at the call use the
  shared `deadAtCall()`. Never write a second way to count deaths.
- Death blame: deaths after the wipe call, deaths in the mass wipe, and deaths caused by someone
  else's mistake (feared by an unkicked Wail, killed by another player's orbs or Gloombomb, a Guillotine
  dropped on the raid by its target, a Guillotine soak with fewer than 5) are NOT the player's fault.
  Use `deathVerdict()`.
- Graphs › Deaths shows only deaths that were the player's own mistake. No "+N during the wipe".
- Debriefing (Why we wiped / How it went / Also hurt) shows mechanics only. Rotation and cooldown checks
  (Power Infusion, Divine Hymn, potions, big cooldowns) belong on the Rotation tab, the Report card and
  the side panel's Raid checks.
- A wipe's root cause can be "Too many individual mistakes" only when 3 or more separate deaths add up.
- Progression is shown as boss health LEFT ("boss at 44%"), everywhere.
- Wolfthorn (the main team, inside the guild Adequate) raids Wednesday and Thursday. Raid days come from
  `raidDaysRule()` plus the lead's "Raid days" setting.
- Numbers shown in two places must always agree (a header and its list, a tile and its section).
  If you add a number, add a check for it to tests/contradictions.js.

## Wording on the site
- Plain, short sentences for WoW players. One fact per sentence.
- Never write "went wrong". Use "sets" (not waves) for add groups.
- Mechanic titles look like "Name (Nickname)", e.g. "Dreadmarch (Mind Control)".
- Never link out to other sites (except WoW news on Home). Never bundle Blizzard art.

## Design
- One look across all tabs (notes/Design rules.md). Every new thing must work at phone width (375 px)
  with nothing wider than the screen.
- Type sizes: 11 / 12.5 / 13 / 13.5 / 18 / 22 px; weights 400 / 600 / 700.

## When you're done
- Push your branch and write a short plain summary for Flex: what changed, how you checked it,
  and anything you couldn't check. Claude's Main chat will test it before anything goes live.
