# Deaths — checklists (Oct 22, 2026)

Three checklists for judging deaths the same way every time. The research and the why behind each line:
`Deaths - how to judge them.md`. The code that does it: `deathVerdict(r, d)` in src/ui.js (owned by the Deaths chat).

---

## A. Judging one death (in this order; the first line that fits wins)

1. **After the wipe filter?** (later than the Nth death, default 2) → *wipe*, not graded.
   Exception: their own avoidable death while fewer than a quarter of the raid is dead (5 of 20) → still counts.
2. **Last 20 s of a kill?** → info only (unless it's their own mistake).
3. **Mass death?** 3+ of us dead within 1.5 s to the same hit → *the raid's event*, weight 0.
   Exception: the player whose own mistake *was that hit* (stood in that Sever, their ghost touched another).
4. **Mind-controlled off the edge** (Dreadmarch aura on, fell or no damage) → *shared*, half.
5. **Their own mistake?** One of these, about the hit that killed them:
   - a mechanic mistake of theirs in the last 10 s (a soak they missed, Gravebound fragments, ghost collision, Sever cone);
   - dodgeable damage did 50%+ of their last 15 s;
   - the avoid panel judged their last hit avoidable **and** dodgeable damage did 25%+ of their last 15 s.
   → *own*, weight 1. A tiny dodgeable tick at the end is not enough.
6. **Too fast?** From 50%+ health to dead in 2 s or less (tanks: from 90%+) → not on them, weight 0.
7. **The raid's mistake** linked within 4 s (adds alive too long, missed soak, Eternal Nightfall cast)?
   → weight 0; but if they also sat at or under 35% for 2+ s with kit ready → *shared*, half.
8. **Something still ready that would have helped?**
   - a personal defensive (section C) that was off cooldown → *ready*, weight 1;
   - a Healthstone or health potion **and** 2+ s at or under 35% first → *ready*, weight 1;
   - a hit bigger than 1.5× their health: only an immunity counts as "would have helped".
9. Otherwise → *nothing left to press*, half.

## B. What the death line says (coaching follows the verdict)

| Verdict | Say | Never say |
|---|---|---|
| own | the fix for the mistake that killed them ("walk over every soul fragment", "only the tank in front") | "press a defensive" |
| ready | what was ready and how long they had ("98% to dead over 14 s with Unending Resolve ready") | — |
| fast | "Too fast to react: X took you from 91% to dead in 0.4 s." | any button advice |
| mass | "Not on you: X killed 14 of us at once." + what caused it, if known | "press Ice Block" |
| shared | both halves, one sentence each | — |
| nothing / raid | what hit them; the raid's fix | blame |

Voice: raid lead, "you"/"we", short, fix first. One name per mechanic. No guide or site names.

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
