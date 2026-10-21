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
- The Warcraft Logs key lives only in Cloudflare: WCL_CLIENT_ID (a variable) and WCL_CLIENT_SECRET (a secret), set by the user on the
  Worker's settings page. Never ask for, type or repeat the secret.
- After each round: build, commit, push, and deploy, so the site always matches GitHub.
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
