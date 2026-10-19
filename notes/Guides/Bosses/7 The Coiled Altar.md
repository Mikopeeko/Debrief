# The Coiled Altar (Venomous Abyss boss 7) — Zul'jan and Hex Lord Malacrass

Read Oct 19 2026: Wowhead cheat sheet + journal, Icy Veins, Mythic Trap, Tactyks Mythic video (xmUS__fk9Ow, first kill, 100+ pulls). The app's Fight audit MODULES were built for this fight (see engine.js). Encounter ID 3429.
Fight style: P1 single target (Zul'jan), P2 single target (Malacrass), intermission, P3 two targets stacked. **Lust: the intermission** (Zul'jan takes +100%; Wowhead says "Phase 3", which starts with it).

## Phase 1 — Zul'jan (Serpent's Bargain)
- **Fangs of the Coiled Altar#1282487**: raid pulses; the Altar's mouths spew **Noxious Ground** (big puddles at the sides, grow each cast, slowly fade); Zul'jan's next melee hits get Twinfang Toxin (tank damage).
- **Toxic Deluge → Coalesced Venom#1282403 orbs**: circles land (dodge), leaving green orbs that pulse raid damage. Step on one to carry it 5 s (Volatile Venom, 5 yd damage around you), then it drops. Carry orbs into a cluster in front of the boss.
  Destroying an orb = **Venom Rupture** raid damage (Heroic+: a stacking DoT) → destroy ~5-6 at a time (7 max, Tactyks); orbs left when Zul'jan dies all explode.
- **Sever#1299680** (tank frontal): huge hit + Sever vulnerability → **aim it through the orb cluster** (destroys them). Taunt swap every cast (Tactyks: the off-tank taunts just before the frontal).
- **Guillotine#1283594**: axe on a player; split damage within 9 yd, needs **≥5 players** (else Execution raid hit); then **Widow's Kiss** explodes within 40 yd → soak, then run out (Gateway / Stampeding Roar). Heroic+: **Guillotined** (+500% to the next) → **two alternating soak groups**.
  (Tactyks says Normal/Heroic only need 3; the journal says 5 on all difficulties.) Gate **into** the soak, never out (orbs spawn on the path).
- **Axegrinder#1283832**: axes roam the arena for 3 min (knockback) — common killer of melee; prefer a puddle over an axe. Mythic: they never despawn.
- **Venomfang#1282287**: dispellable poison DoT (Poison Cleansing Totem automates it).

## Phase 2 — Hex Lord Malacrass (Usurper's Reprisal)
- **Dreadmarch#1285643**: several players are mind-controlled with a big absorb and walk off the edge → stack them at a set spot (Tactyks: square marker), CC them (Ring of Peace, Leg Sweep, Shockwave, Ursol's, Mass Grip, Chaos Nova) and break the shield. Targets press a **cancel-aura macro** (movement speeds, Power Word: Shield, Void Shield…) so they don't run off.
- **Manifestation of Dread#1285911**: 2 ghosts per freed player, each fixates someone and moves only while you're **not looking at it** (like Boos). Freed players stand still until the ghosts spawn (so they cluster). Look at your ghost to freeze it; guide it into a cluster. Heroic+: a ghost reaching you re-applies Dreadmarch.
- **Soul Sever#1286620** (tank frontal): destroys ghosts; hit players get **Gravebound** → must pick up their **Soul Fragments** (3) or die. Swap after each (Tactyks: their Blood DK took all P2 frontals, defensive on odd casts, defensive + 2 externals on even).
- **Gloombomb#1310882**: marked players explode (15 yd) → run out; hit players get Gravebound → collect fragments.
- **Eternal Nightfall#1286918**: Veil of Twilight shield + a wipe cast → **break the shield** (pool damage, assign cooldowns to each shield) to interrupt; dodge the purple circles; stacking heal absorb.
- Heroic+: **Spiritcackle#1286441** → Spiteful Soulcoiler adds: interrupt **Wail of Terror** (raid fear; it teleports after each kick), kill before 100 energy (then kick-immune). Ranged mostly.
- Before Malacrass dies, clear ghosts and step away from the edge (knockback).

## Intermission — Soulbinding
Zul'jan returns with **Ghastly Regeneration** (heals 2%/s for 35 s, **takes +100%**) → **Lust, potions, everything**. **Fragments of Malacrass#1287722** run to Zul'jan (each heals ~10%) → intercept them, but each step = **Spirit Erasure** raid hit → stagger soaks. One reaching him is nearly a wipe; some spawn on the inner ring.

## Phase 3 — Coiled Union
Both bosses; all P1 and P2 mechanics at once (Defilement replaces Fangs: heal-absorb ground, Corrupted Toxin tank DoT → tank swaps; Grim Guillotine is shadow; **Blighted Sever** hits orbs and ghosts and gives Gravebound). **Soulbound**: when one dies the other gets +500% → kill together.

## Mythic
- **Virulent Mutation#1310544** (purple orb): if its purple ring touches any other orb (green or purple, on the ground or carried) → ~20 Venom Ruptures = wipe. You *can* run a green orb past a carried purple. Purple orbs left at the next Deluge also wipe. **Purples are hard-assigned** (Tactyks: the off-tank, Mages, Warlocks with gateways; mobile healers in a pinch); everyone else clears green orbs out of their way.
  P1 layout: purple carriers per corner, a triangle/pyramid in front of the boss up to marker lines; the entrance side frontal first. P3: one frontal takes all purples in a **diamond** formation; greens go to one side (missed greens are survivable).
- **Tainted Blood** after carrying an orb (+200% Volatile Venom for 10 s) → rotate carriers. **Guillotined is permanent**.
- P2/P3 ghosts are **only visible to their target**; two ghosts touching (Malevolent Resonance) kills both targets. Interrupting Wail of Terror briefly shows all ghosts.
- Spiteful Soulcoilers have **Spirit Shield** (99% DR) → must be hit by **2 Gloombombs**: 2 ranged and 2 melee get Gloombomb each time → ranged bombs go to the "ranged" add, melee bombs to the "melee" add (kick it as soon as Gloombomb is cast so it stands still). Second kick on the melee add must be a melee player.
- Intermission: each Fragment soak gives the raid +20% Spirit Erasure damage for 2 s → soak 3-5 at a time, let it drop, then 7-10 under stacked cooldowns.
- Tactyks' plan: **5 healers**, boss-holding tank (Blood DK / Guardian / Prot Warrior) + mobile off-tank (Prot Paladin best; Guardian, Vengeance, Brewmaster fine). Two Evokers (Time Spiral for orb runners), two Hunters (immunities, Hunter's Mark), Warlocks (Curse of Tongues on adds).
  Guillotine immunity plan (Mythic needs 5): immune classes soak the first so they can't be targeted by the next; the next is soaked by 5 incl. Turtles, BoP on the target (P1 physical), Spellwarding/Bubble/Cloak in P3 (magic). Gate into soaks.
  NSRT: interrupt assignments, orb deadline, shield HP pace, damage-pace comparison (they held damage at the ends of P1/P2: hit 2-3 orbs with the second-to-last frontal, **zero** with the last; kill Zul'jan around the pools).
  P1→P2 transition at 9-11 Venom Rupture stacks: stack cooldowns (Darkness, AMZ, Spirit Link). P3: kill Zul'jan before the next pool cast (~1 min) — they over-damaged Malacrass and nearly wiped.

## What a log can check (the existing module covers much of this)
Orbs per Sever and orbs left at the transition; Venom Rupture stacks; purple orb collisions; Guillotine soaker counts and Executions; Widow's Kiss hits; Axegrinder hits; Dreadmarch shield breaks/deaths off the edge; ghosts reaching players; Gravebound deaths; Eternal Nightfall shield break time; Wail of Terror interrupts; Fragments reaching Zul'jan; boss HP gap in P3.
