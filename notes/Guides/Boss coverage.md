# Boss coverage (started Oct 22, 2026)

**The rule:** nothing boss-specific is done until all 10 bosses have it, on Heroic and Mythic, or this table says "not needed".
When a chat adds a boss-specific feature, it adds a column here. When it finishes a cell, it updates the cell.

Marks: ✅ done · 🟡 partly · ❌ missing · ➖ not needed · ⏳ another chat is building it · 🧪 on a practice link, not live yet

## What each column means
- **Kill baselines:** `KILL_BASE` in src/ui.js (how the fastest kills did each mechanic). Recipe: `Kill baselines - how to build one.md`
  (the node way, below, is the fast one).
- **Kill-checked:** every Mechanics check run on the fastest kills; any check that marked a kill **failed** was fixed, or confirmed
  as a real mistake (a death mid-fight). The Coiled Altar's Dreadmarch vs Venomfang call is the model.
- **Danger weights:** `IMPORTANCE` + `TIERS` in src/ui.js (what wipes first, from the guides).
- **Timing checks:** phase push / "reach X% by m:ss" checks. The Coiled Altar's `push` section is the model (Debriefing chat).
- **Titles:** Mechanics cards read "Name (Short instruction)".
- **Maps:** cards on the Mechanics tab with a floor map.
- **Add sets:** a card that says whether each set of adds died in time.
- **Avoidable list:** the boss's avoidable-damage sources (`avoidPanel` in src/engine.js).
- **Avoidable bars:** `AVOID_BASE` (kill bars by time). Owned by the Avoidable damage chat.
- **Death rules:** `deathVerdict` (src/ui.js). Owned by the Deaths chat. Shared by every boss; boss-specific parts noted.

## Mythic
| Boss | Kill baselines | Kill-checked | Danger weights | Timing checks | Titles | Maps | Add sets | Avoidable list | Avoidable bars | Death rules |
|---|---|---|---|---|---|---|---|---|---|---|
| Nymrissa Wavecaller | 🧪 20 kills | ✅ (whirlpool deaths at the 2nd Pop are real) | ✅ | 🧪 Pace: before the 3rd Pop | ✅ | ✅ | ✅ nyadds, nyscale | ✅ | ✅ live (a989819) | ✅ shared |
| Nek'zali the Soulcoiler | 🧪 20 kills | 🧪 Invoke, tank circles fixed | ✅ | ➖ lenient DPS check | ✅ | ✅ | ✅ amani | ✅ | ✅ live | ✅ shared |
| Entombed Sentinels | 🧪 20 kills | 🧪 Miasma 6–7 soakers fixed | ✅ | 🧪 Pace: health at each intermission | ✅ | ✅ | ✅ coag | ✅ | ✅ live | ✅ shared |
| The Lost Explorers | 🧪 20 kills | 🧪 United Defense, Blast Wave fixed | ✅ | 🧪 Pace: two turns | ✅ | ✅ | ➖ no adds | ✅ | ✅ live | ✅ shared |
| Vashnik the Malignant | 🧪 20 kills | ✅ nothing failed | ✅ | 🧪 Pace: before Imbibe 5 | ✅ | 🟡 one card | 🟡 venoms (one at a time, not "before the middle") | ✅ | ✅ live | ✅ shared |
| Sszorak | 🧪 20 kills | ✅ nothing failed | ✅ | 🧪 Pace: before the enrage | ✅ | ✅ | ➖ no adds | ✅ | ✅ live | ✅ shared |
| The Twin Fangs | 🧪 19 kills | 🧪 Feast repeat soaks fixed | ✅ | 🧪 Pace: health at 4:12 | ✅ | ✅ | 🟡 kicks + spit, no set timer | ✅ (own list) | ❌ not in the Avoidable chat's set | ✅ shared |
| The Coiled Altar | 🧪 20 kills (re-read with today's code) | ✅ | ✅ | ✅ push (5f527f7) | 🟡 "Sever orb counts" | ✅ | ✅ addsets | ✅ | ✅ live | ✅ + Dreadmarch |
| Ula'tek | 🧪 19 kills | 🧪 Shriekers, end-of-kill waves fixed; ❓ wave deaths at ~8:05 in 5 of 14 kills | ✅ | 🧪 Pace: after each damage window | 🟡 "Interrupts" | ✅ | ✅ shriek, doomscale | ✅ | ✅ live | ✅ shared |
| Kith'ix | 🧪 19 kills | 🧪 Null Gates in the last 30 s fixed | 🧪 added | 🧪 Pace: 25% before the 3rd intermission | ✅ | ❌ none | ✅ kxadds | ✅ | ✅ live | ✅ shared |

## Heroic
| Boss | Kill baselines | Kill-checked | Danger weights | Timing checks | Titles | Maps | Add sets | Avoidable list | Avoidable bars | Death rules |
|---|---|---|---|---|---|---|---|---|---|---|
| Nymrissa Wavecaller | 🧪 20 kills | ✅ nothing failed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ Mythic only | ✅ shared |
| Nek'zali the Soulcoiler | 🧪 20 kills | ✅ nothing failed | ✅ | ➖ | ✅ | ✅ | ✅ | ✅ | ❌ Mythic only | ✅ shared |
| Entombed Sentinels | 🧪 20 kills | ✅ nothing failed | ✅ | 🟡 Pace shown, not judged | ✅ | ✅ | ✅ | ✅ | ❌ Mythic only | ✅ shared |
| The Lost Explorers | 🧪 20 kills | 🧪 Final Ascension below Mythic fixed (Blast Wave death is real) | ✅ | 🟡 Pace shown, not judged | ✅ | ✅ | ➖ | ✅ | ❌ Mythic only | ✅ shared |
| Vashnik the Malignant | 🧪 20 kills | 🧪 unsoaked bile below Mythic fixed; avoidable fails 4 kills (told the Avoidable chat) | ✅ | 🟡 Pace shown, not judged | ✅ | 🟡 | 🟡 | ✅ | ❌ Mythic only | ✅ shared |
| Sszorak | 🧪 20 kills | ✅ nothing failed | ✅ | 🟡 Pace shown, not judged | ✅ | ✅ | ➖ | ✅ | ❌ Mythic only | ✅ shared |
| The Twin Fangs | 🧪 20 kills | 🧪 Feast with few soakers below Mythic fixed | ✅ | 🟡 Pace shown, not judged | ✅ | ✅ | 🟡 | ✅ | ❌ Mythic only | ✅ shared |
| The Coiled Altar | 🧪 20 kills | ✅ frontal on a non-tank is yellow below Mythic unless it killed (3158c80); Gravebound deaths stay (real) | ✅ | 🟡 push shown | ✅ | ✅ | ✅ | ✅ | ❌ Mythic only | ✅ shared |
| Ula'tek | 🧪 20 kills | ✅ nothing failed | ✅ | 🟡 Pace shown, not judged | ✅ | ✅ | ✅ | ✅ | ❌ Mythic only | ✅ shared |
| Kith'ix | 🧪 20 kills | ✅ nothing failed | ✅ | 🟡 Pace shown, not judged | ✅ | ❌ | ✅ | ✅ | ❌ Mythic only | ✅ shared |

## Timing checks plan, Mythic (user OK Oct 22: "build the timing checks as planned"; built as the Pace card, paceCard in engine.js)
From the 20 fastest kills (phase times, boss health every 2 s) and the boss guides. Health pace is never red for being
slower than the world's best: red only where the plan breaks (a skipped phase comes, the enrage, a set number of casts).
| Boss | The timing | Fastest kills | Green / yellow / red |
|---|---|---|---|
| Kith'ix | Push to Last Light (25%) before the 3rd intermission | P2 at 3:46–4:11 | by 4:11 / to 4:25 / 3rd intermission starts |
| Ula'tek | Ula'tek's health after each damage window | 60–66% after the 1st, 32–40% after the 2nd | inside kills / to the guide pace (67%, 45%) / 10+ past it |
| The Twin Fangs | Both Fangs' health at the last platform | ~25% Vexhul, ~32% Ithraz at 4:00 | inside kills / to the guide pace (25%, 40%) / 10+ past it |
| Entombed Sentinels | Both bosses' health at each intermission | ≤76%, ≤44%, ≤14% | inside kills / above / a 5th cycle (enrage) |
| Vashnik | Dead before Imbibe 5 | Imbibe 3–4 | ≤4 / 5 / 6 (guide: burn before Imbibe 6) |
| The Lost Explorers | Done in two turns | 16 of 20 skip the 3rd turn | 2 turns / 3 turns / never red |
| Nymrissa | Dead before the 3rd Pop (~5:40) | 3:49–4:35 | before / after / enrage (~7:15, already red) |
| Sszorak | Dead before the enrage (~6:20) | 4:43–5:01 | on pace / behind kills at 3:00 (34–39%) / enrage |
| Nek'zali | ➖ not needed: the DPS check is lenient, Amani in the well already checked | P1 1:14–1:42 | — |

## Still open (next rounds)
- Heroic: kill baselines + kill-check for all 10 (downloads queued after Mythic).
- Timing checks for the other 9: waiting on the Debriefing chat's Coiled Altar model.
- Kith'ix maps (no map on any card); Vashnik has one map card.
- Twin Fangs avoidable bars (the Avoidable damage chat's set has no Twin Fangs).
- Lines even the fastest kills nearly never get clean (worth a look, amber only): Sentinels droplets/blighted/marks, Sszorak
  tempest/crosswinds/virulence, Vashnik froth/infect, Twin Fangs venom/soaks/bulwark/spit, Ula'tek doomscale/bite, Kith'ix motes.
- Ula'tek: 5 of 14 top kills lose players to waves at about 8:05 (planned? ask the user / the guide chat).

## How the node baseline works (Oct 22)
Scratch scripts (this chat's scratchpad `kb/`, copy kept in the shared notes folder `boss-coverage/`):
`kb.js <encounter> <5|4> [20]` runs the real engine (a git archive of origin/main plus patches) on the top kills, reading events
the Avoidable damage chat already saved, downloading the rest one at a time; `sum.js` prints each line's k/ok/med and any line a
kill **failed**; `rows.js <enc> <d> <section> [n] [flaggedOnly]` prints a card's rows (D=1 adds the deaths); `gen_kb.js` +
`mk_kbpair.js` write the KILL_BASE replacement; `ap.js` applies exact find/replace pairs (p_*.json, one per boss).
The node numbers matched the browser-read Coiled Altar baseline to within 1 point on 9 of 11 lines (the other two changed with newer code).

## Pace in the coach
Pace is left out of KILL_BASE and kbImp(pace) = 0, so being slower than the world's best never tops the coach (on the guild's
Twin Fangs kill it was the Focus before). In IMPORTANCE it sits just before Avoidable damage.

## Work log
- Oct 22: table made from origin/main 38ad7cc. Mythic baselines for all 10 bosses; fixed the checks that failed top kills on Kith'ix,
  Lost Explorers, Nek'zali, Ula'tek and Twin Fangs; Kith'ix added to IMPORTANCE/TIERS. Practice link bosscov1.
- Oct 22 later: Pace card (paceCard) on 8 bosses, user OK; Heroic baselines + kill-check for all 10; practice link bosscov4 (all of it).
