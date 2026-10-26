# Adequate Audits — WoW Log Analyzer

Browser app that analyzes retail WoW combat logs (local WoWCombatLog.txt or Warcraft Logs reports)
in the style of Warcraft Logs + WoWAnalyzer + Wipefest. Built for Mythic raid progression (Midnight, patch 12.1).

## Layout
- src/shell.html — HTML/CSS shell with /*ENGINE*/, /*WCL*/, /*UI*/ placeholders.
- src/engine.js — parser + analysis (no DOM). Retail log format V22 (19-field advanced block; position = block end - 5).
  Rule packs (PACKS) for all 8 Venomous Abyss bosses; fight-audit MODULES (The Coiled Altar Mythic);
  NSRT note import (parseNote / checkAssignments); interrupts, stacks, survivability, coaching.
- src/wcl.js — Warcraft Logs API client + translator (WCL events -> V22 log lines). Local mode uses server.ps1; hosted mode uses the Worker.
- src/ui.js — all rendering (tabs: Overview, Fight audit, Assignments, Progression, Mistakes, meters, Survivability, Interrupts, Deaths, Player).
- src/worker_template.js — Cloudflare Worker (serves app with window.WLA_HOSTED, holds WCL key, caches).
- src/build.py — run from src/: writes ../WoW-Log-Analyzer.html and ../online/worker.js.
- companion/ — Debrief in game (test): the PC app (Debrief Companion.bat + companion.ps1 on port 8772, companion.html, recap.js) that reads the
  combat log after each boss pull and copies a recap code, and the WoW addon (companion/addon/Debrief) that shows it and shares it with the raid.
  See notes/Guides/Debrief in game - how it works.md. Rebuild the download zip after changes (zips are git-ignored).
- server.ps1 + start.bat — local helper at http://localhost:8765 (serves the HTML, proxies /wcl/token and /wcl/graphql).
- tests/ — synthetic log generators (gen*.py), node tests (test.js, test_wcl.js) and Playwright screenshot scripts (shot*.py).
  They were written in a Linux sandbox; adjust paths before running on Windows.

## Workflow
Edit files in src/, run `python build.py` inside src/, refresh the browser tab opened by start.bat.

## The hosted site
- Live at https://debriefme.io (Cloudflare Worker "debrief"; the user's Cloudflare account; domain bought on Cloudflare Oct 20, custom
  domains in wrangler.toml). www.debriefme.io and the old https://debrief.james-m-nemecek.workers.dev send visitors there
  (the old one carries each browser's saved data over once: moveHome/moveIn in the Worker). Practice links stay on workers.dev.
- Sign in with Warcraft Logs: the WCL client "Debrief sign-in" must list https://debriefme.io/auth/wcl/callback as a redirect URL.
- Build with `src/build.ps1` (PowerShell, no Python or Node needed; writes the app and `online/worker.js`), then upload with
  `npx wrangler deploy` from the project root (Node is at `C:\Program Files\nodejs`; Wrangler is signed in). `wrangler.toml` has `keep_vars = true`.
- The Discord bot is its own Worker, "debrief-discord" (wrangler.bot.toml; src/build.ps1 also writes online/bot.js). It holds the
  @Claudette listener (a Durable Object), the one-minute tag check and bug sync, and the reminders. Bot-only changes go out with
  `npx wrangler deploy -c wrangler.bot.toml` from a clean copy of main (the user OK'd bot-only deploys on Oct 26). The website
  Worker keeps patch notes, feature drafts and the pace jobs, and hands the bot its keys (BotKeys). No Durable Object in the site
  Worker, ever: it kills practice links.
- The Warcraft Logs key lives only in Cloudflare: WCL_CLIENT_ID (a variable) and WCL_CLIENT_SECRET (a secret), set by the user on the
  Worker's settings page. Never ask for, type or repeat the secret.
- ONE BUILD, THE USER PUSHES IT (the user, Oct 26: "moving forward i want all changes compiled into one build, and then i decide when
  you push that build"). Every chat: build, run the checks, commit, and push to GitHub, then STOP. Never `wrangler deploy`, never
  `wrangler versions deploy`, never release a Companion or addon build, and never ask the user to put a single change live ("deploy
  just this?"), including Worker-only or bot changes. Show your own work on a practice link (`npx wrangler versions upload
  --preview-alias <name>`). Only the Main chat makes and pushes the build:
  1. On the user's "make the build", it builds the newest main once from a fresh clone, uploads it as one Worker version with
     `--preview-alias next`, tests every tab on desktop and phone, and gives the user that link plus a plain list of what's in it
     (commits since the live one).
  2. On the user's "push it" in the Main chat, it publishes that exact tested version: `npx wrangler versions deploy <version-id>@100% -y`.
     No rebuild. If the app or addon changed, the In-game addon chat releases them from the same commit.
  A bug that breaks the live site is the only exception, and it needs the user's OK first.
  RHYTHM SINCE OCT 26 EVENING (the user: "pushing live as they finish each task", "i need everything constantly pushed as its
  completed"): after EACH finished task, check it on your practice link, push to GitHub, then send the Main chat one line,
  "Done, pushed <commit>: <what>". The Main chat builds and publishes it right away. Chats still never deploy themselves.
- Patch notes live only on the site (the menu's Patch notes page; no Discord posts written by hand). With each round a raider
  would notice, add to `PATCH_NOTES` in src/ui.js under today's date (or a new date at the top): a big new thing raiders will
  love goes in h as a New features card ({ t: short title, d: one or two sentences }); smaller changes are a plain line in
  n (Improvements) or f (Bug fixes). Every morning at 10 (Central) the day before posts itself to the Discord's
  #patch-notes in full (the feature titles, how many improvements and fixes, a link); @everyone only when it has a New feature.

## Version control
- Private GitHub repo: https://github.com/Mikopeeko/Debrief (branch `main`). Git is at `C:\Program Files\Git\cmd\git.exe`.
- After each round of work (each FEEDBACK.md entry), commit the source and the built HTML as a checkpoint with a short message, then push.
  The push uses the Windows-saved GitHub sign-in (Git Credential Manager); set `GCM_INTERACTIVE=never` so it never waits on a prompt.
- `.gitignore` keeps installers, `backups/`, `*.raid-backup.*`, `.claude/` and raw combat logs off GitHub. The Warcraft Logs login is stored outside the project (LOCALAPPDATA), never in the repo.

## Conventions
- Never bundle Blizzard art; icons load at runtime (Wowhead/Blizzard) with built-in SVG fallbacks.
- Mechanic rules are only as good as their spell names/IDs: unverified ones are flagged. The Fight audit "Data check" panel shows which tracked spells a real pull contained.
- Midnight: healers have no interrupts except Restoration Shaman (Wind Shear 30s).
- Wording in the UI: plain, short, player-facing; "sets" (not waves) for add groups.
- Look: follow notes/Guides/Design system.md (one look on every page). The build ends with "design check: OK" or warnings about off-palette flag colours or new text under 12px; fix them, or run src/design-check.ps1 -update when a small label is on purpose.
