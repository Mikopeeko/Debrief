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

## Conventions
- Never bundle Blizzard art; icons load at runtime (Wowhead/Blizzard) with built-in SVG fallbacks.
- Mechanic rules are only as good as their spell names/IDs: unverified ones are flagged. The Fight audit "Data check" panel shows which tracked spells a real pull contained.
- Midnight: healers have no interrupts except Restoration Shaman (Wind Shear 30s).
- Wording in the UI: plain, short, player-facing; "sets" (not waves) for add groups.
