# Mechanic titles — the rule (Oct 22, 2026)

The user, Oct 22: "the nicknames to boss mechanics has gotten weird again". It had drifted twice on Oct 20: a mechanics review
mixed nicknames ("Venom orbs", "Tank frontals") with in-game names, and a new-raider pass put glossary underlines inside titles.

## The rule
- **"Name (Short instruction)"**: the name players see in game (the ability, the add, the debuff), then a short, clear
  instruction in brackets. Nothing after the bracket.
  - Good: "Guillotine (Soak with 5)", "Coalesced Venom (Pop the orbs with the frontals)", "Grasping Fangs (Tether breaks)".
  - Not: a nickname as the name ("Venom orbs", "Tank frontals", "Soulcoiler adds"); a label instead of an instruction
    ("(Beam)", "(Bubble)", "(Adds)", "(Raid hits)").
  - A plain word players use is fine when there's no single in-game name: "Eggs", "Tail", "Boss balance", "Intermission".
- **No glossary underlines inside a title.** secHead writes the title plainly; the words are explained in the text under it.
- **One name everywhere.** The section title is what Debriefing, the coach, Homework, the Report card, Copy for Discord and
  the in-game recap all use. Don't write a second name for the same mechanic.
- Shared sections keep their plain names: Deaths, Avoidable damage, Interrupts, Phase changes (Push on time).

## How to change a title
- Change it in the boss's check in src/engine.js, or add it to `TITLE_FIX` (top of engine.js), which renames as each boss's
  checks finish and keeps the old title in `place` so the section stays in its phase.
- Update the front page preview list (`FPB_MECH` in src/ui.js) to the same name.
- Check the "How to do it" guide link still shows (gdzTarget matches by section id first).

## Oct 22 changes
The Coiled Altar: Venom orbs (Into the frontals) → Coalesced Venom (Pop the orbs with the frontals); Tank frontals (Defensives
on stack 2) → Sever (Defensive on the second stack); Soulcoiler adds (Kick and kill) → Spiteful Soulcoiler (Kick and kill);
Gloombombs (Drop them on the adds) → Gloombomb (Drop it on the adds).
Ula'tek: Eggs (No Vipers) → Eggs (Don't let them hatch); Spectral Coils (Soak circles) → (Soak the circles); Caustic Waves
(Dodge waves) → (Dodge the waves); Tanks (Tail tanking) → Tail (Always a tank on it); Toxic Incubation (Beam) → (Off-tank soaks
the beam); Blightscale Wretch (Bubble) → (Stand in its bubble); Rage of the Shackled (Damage windows) → (Burst the heart);
Wardens and Doomscales (Big adds) → (Kick and kill); Serpent's Bite (Soak) → (Soak with 3); Shriekers and Rawlings (Adds) →
(Kill the adds). The other eight bosses already followed the rule.
