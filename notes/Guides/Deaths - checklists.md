# Deaths — checklists (Oct 22, 2026)

Three checklists for judging deaths the same way every time. The research and the why behind each line:
`Deaths - how to judge them.md`. The code that does it: `deathVerdict(r, d)` in src/ui.js (owned by the Deaths chat).

---

## A. Judging one death (in this order; the first line that fits wins) — the Nov 8 audit's rules

0. **The hit that killed them** is the biggest hit of their last 4 seconds when it was well over the finishing tick (1.5 times it and a tenth of
   their health), else the last hit. Every rule below reads that hit (D2). Time Dilation's held-back damage reads as the hit it held back (D11).
1. **After the wipe call?** (later than the call + 0.5 s, the same cut as the Deaths tile and the mistakes) → *wipe*, not graded. No exceptions (Nov 5).
2. **Last 20 s of a kill?** → info only (unless it's their own mistake).
3. **Mass death?** 3+ of us dead within 1.5 s to the same killing hit → *the raid's event*, weight 0, and the line names the cause when it is
   known ("Soul Sever killed 3 of us at once (Tyralien didn't taunt before Soul Sever)").
   Exception: the player whose own mistake *was that hit* (stood in that Sever, their ghost touched another), unless a raid miss on that very hit is
   logged too (nobody soaked the Globule): then it is the raid's.
4. **Mind-controlled off the edge** (Dreadmarch aura on, fell or no damage) → *shared*, half; the card says how (edge, our damage, a boss hit).
5. **Forced by someone else or by the raid?** → *forced*, not on them, in the verdict's own words, and the fix is the raid's (D1, D4, D6):
   feared by an unkicked Wail of Terror (the missed kick); a short Guillotine soak (the missing soakers); clipped by someone else's Gloombomb;
   orbs someone else set off; an axe dropped on the raid (the target); a raid miss or another player's Serious miss that IS the killing hit within
   4 s ("Ironvan missed Stone Breaker circle 2", "a Caustic Globule nobody soaked exploded on the raid"); a tank swap that didn't happen (the
   tank who should have taunted is named; the tank who took it is *shared* when a defensive or external was ready, otherwise *forced*).
5a. **The pull's wipe mechanic?** A death to the mechanic Why we wiped names (the unbroken shield's Eternal Nightfall) → *raid*, weight 0, unless
   their own mistake was that very mechanic (no mote for Extinguish stays theirs) (D10).
6. **Their own mistake?** Only a mistake of theirs *about the hit that killed them*, or a known chain to it (Soul Sever → Gravebound, a ghost
   touch → Malevolent Resonance, an egg → a Viper, a soak or axe they stood in, no mote → Extinguish, Suffocating Darkness → Suffocation);
   or dodgeable damage did 50%+ of their last 15 s; or the avoid panel judged the killing hit avoidable. A stack-count note ("reached 7 stacks")
   or an unrelated mistake in the last 10 s never owns a death (D3). → *own*, weight 1.
   The Guillotine target with no external → *shared* (an immunity or a big defensive was theirs to press; the external is the raid's plan); a
   soaker who died in a full soak → *own* with a defensive or Healthstone ready, else *nothing left to press* (D5).
7. **Too fast?** From 50%+ health to dead in 2 s or less (tanks: from 90%+), or a hit bigger than their health with no health history → not
   on them, weight 0.
8. **The raid's mistake** linked within 4 s (adds alive too long, a missed soak)? → weight 0; *shared*, half, if something of theirs was ready.
8a. **Not enough healing?** (Oct 26) no avoidable damage, nothing of theirs left unused, 4 s or more under 40% with under 10% of their health
   healed by others over each 3 s, half the healers alive and one in range → *noheal*, the healing team's (or the healer a note line puts on them).
8b. **A healing gap?** (Oct 22) 5 s or more under half health with little healing from others, healers alive and in range, no raid-wide damage →
   *heal*: half on them if something was still ready, otherwise not on them.
9. **Something still ready that would have saved them?** Every defensive has a save model (D8): a heal share, a damage share, an absorb or an
   immunity, read against the damage that followed; a hit bigger than 1.5× their health needs an immunity. → *ready*, weight 1; the words and
   the fix name the same button, the cheapest save that works first (D9).
10. Otherwise → *nothing left to press* (half), or *nothing they had would have saved them* (not on them).

One count everywhere (D7): dead at the call (the big number), on the player (own + ready whole, halves as ½), mass deaths and deaths after the call
as the small print; one cut, the call + 0.5 s, for deaths and mistakes alike.

## B. What the death line says (coaching follows the verdict)

| Verdict | Say | Never say |
|---|---|---|
| own | the fix for the mistake that killed them ("walk over every soul fragment", "only the tank in front") | "press a defensive" |
| ready | what was ready and how long they had ("98% to dead over 14 s with Unending Resolve ready"); the same button in the words and the fix | — |
| fast | "Too fast to react: X took you from 91% to dead in 0.4 s." | any button advice |
| mass | "Not on you: X killed 14 of us at once (what set it off, when known)." | "press Ice Block" |
| forced | the verdict's own words ("Feared by an unkicked Wail of Terror: the missed kick, not them.") and the raid's fix (kick every Wail, 5 into every soak, the tank's circles, taunt before the next Sever) | "after the pull was lost" |
| shared | both halves, one sentence each ("the raid's mistake (Tyralien's Soul Sever), but Divine Shield was ready") | — |
| raid / nothing / noheal / nosave | what hit them; the raid's fix ("Not on you: the raid's fault (Eternal Nightfall): the pull was already lost to it") | blame |
| no hit logged | "died with no logged hit" and no verdict word | a killer's name |

## C. Kit per class (what can count as "ready")

From the engine's `DEFENSIVES` table (Midnight, checked on raid logs Oct 2026). Rules:
- **Talent** lines count only once the player is seen pressing them that pull (never blame an untalented button).
- **Not personal**: raid cooldowns are on the plan, never "your defensive ready".
- **Immunities** are the only thing that can save a hit bigger than 1.5× their health.
- Racials (Gift of the Naaru, Stoneform, Fireblood) count only once seen.
- **Healthstone**: once a pull; Warlocks' Demonic Healthstone comes back after about 60 s (Arsyn used 2–3 a pull).
- **Health potion**: its own 5-minute cooldown, separate from combat potions (50 cases in one night of both within 5 min).
- Not checked yet (keep out of verdicts until checked in game): which buttons work while stunned; a player under mind
  control or a stun can't press anything, so nothing is "ready" while one is on them.

| Class | Immunity / cheat-death | Damage reduction | Self-heal | Not personal (raid plan) |
|---|---|---|---|---|
| Warrior | — | Die by the Sword (120 s, Arms only), Shield Wall (180 s, Protection only), Last Stand (180 s, Protection only, talent) | Enraged Regeneration (120 s, Fury only), Bitter Immunity (180 s, talent) | Rallying Cry (180 s, talent) |
| Paladin | Divine Shield (300 s) | Divine Protection (60 s, Holy/Retribution only), Shield of Vengeance (90 s, Retribution only, talent), Ardent Defender (90 s, Protection only), Guardian of Ancient Kings (180 s, Protection only, talent), Eye of Tyr (60 s, Protection only, talent) | Lay on Hands (600 s) | — |
| Hunter | Aspect of the Turtle (180 s) | Survival of the Fittest (90 s, talent), Fortitude of the Bear (120 s, talent) | Exhilaration (120 s) | — |
| Rogue | Cloak of Shadows (120 s) | Evasion (120 s) | Crimson Vial (30 s) | — |
| Priest | Dispersion (120 s, Shadow only) | — | Desperate Prayer (90 s) | — |
| Death Knight | — | Icebound Fortitude (120 s), Anti-Magic Shell (60 s), Lichborne (120 s, talent), Vampiric Blood (90 s, Blood only), Dancing Rune Weapon (120 s, Blood only, talent) | Death Pact (120 s, talent) | — |
| Shaman | — | Astral Shift (120 s), Stone Bulwark Totem (180 s, talent) | — | — |
| Mage | Ice Block (240 s), Alter Time (60 s, talent) | Ice Cold (240 s, talent), Greater Invisibility (120 s, talent), Mirror Image (120 s, talent) | — | — |
| Warlock | — | Unending Resolve (180 s), Dark Pact (60 s, talent) | Mortal Coil (45 s, talent) | — |
| Monk | — | Fortifying Brew (360 s), Diffuse Magic (90 s, talent), Dampen Harm (120 s, talent), Zen Meditation (300 s, Brewmaster only, talent), Touch of Karma (90 s, Windwalker only, talent) | — | — |
| Druid | — | Barkskin (60 s), Survival Instincts (180 s, Feral/Guardian only, talent), Rage of the Sleeper (60 s, Guardian only, talent) | Frenzied Regeneration (36 s, Balance/Feral/Restoration only, talent), Renewal (90 s, talent) | — |
| Demon Hunter | Netherwalk (180 s, Havoc only, talent) | Blur (60 s, Havoc/Devourer only), Fiery Brand (60 s, Vengeance only, talent), Metamorphosis (120 s, Vengeance only) | — | Darkness (300 s, talent) |
| Evoker | — | Obsidian Scales (90 s) | Renewing Blaze (90 s, talent) | — |
## D. Auditing a night (repeat when rules change)

1. Get the night: shared night → `/api/night?id=` + `/api/night/part?id=&n=&m=`; Warcraft Logs fights → `wclnight.js`.
2. Run `audit.js <src> <night> <out.json>` on a clean copy of origin/main's src (real engine, real `deathVerdict`).
3. Read every **counted** death: the killing hit as % of max health, health 15/10/5/2 s before, who died within 1.5 s,
   auras (mind control, cheat-death), casts in the last 6 s, today's verdict and first coaching line.
4. Write down the fair call for each (section A) and whether today is fair / too harsh / too soft; count by type.
5. Run `propose.js` with the rule change; check per-player totals move the right way and nothing fair changed.
6. Check the coaching lines too: no "press a defensive" on own, fast or mass deaths; Gravebound says fragments.
7. Repeat on one Warcraft Logs night of another boss and one top kill (kills: last 20 s rule; median deaths ~2).
8. Put the table in `Deaths - how to judge them.md` §7 (or a new dated section).
Scripts: shared notes folder `deaths-audit/` (audit.js, propose.js, wclnight.js, mist.js).
