# Nek'zali the Soulcoiler (Mythic): research notes

Sources: the Method Mythic and Heroic guides, the Mythic Trap page, and Icy Veins (outline only).
These notes may name sources; the app's text stays neutral.

## Fight shape
- **P1:** Soulcoil Ignition about every 73 s. Possession Barrage on the tank, Hollowing Strikes (swap), Essence Rend, and Restless Amani sets
  walking to the Soulcoil Well.
- **Intermission at 50%** (Ritual of Awakening, about 2:30): two Echoes of Jawae protect her. It brings Soul Transfer (a line blast after a
  15 s channel), the Hungering Pyre soak, Slithering Flame on the non-soakers, and corpses coming back.
- **P2:** Uncoiling (raid damage every second for the rest of the fight), Invoke, and a damage race to 100 energy. Lust here.
- **Energy:** Ignition gives +25 (five Rites, +5 each), and each Amani in the well +5. 100 is Uncoiled Rage, the enrage. The fourth Ignition
  fills her, so reach 50% first.
- **Mythic:**
  - Grasping Depths, twice a phase: a Drowned Echo in the well. Teams of about 3 DPS and a healer go in, and two teams alternate.
    Kick every Soulcoiler's Curse. Soul Exhaustion (300% more from the well) goes on anyone who leaves.
  - Every corpse left is repossessed in the intermission; more than one at once hits very hard.
  - Invoke interrupts and silences casters for 3 s.

## What the log shows (Wolfthorn Mythic: kill N1PK29BXAf7g6rYL #19, wipe #18 at 40%; kill 2D3Hv8PgxBazL6Ab #13)
- Ignition: cast start 1293664 (at 0:00, 1:13, 2:25), channel 1285681. Anguished Echoes 1294846 land up to ~17 s after the start.
- Soulcoil Rite 1288772, applied to the raid in batches:
  - Ignition gives five batches, 1 s apart, starting ~3 s in.
  - Invoke gives one batch.
  - An Amani in the well gives one batch on its own (kill: 1:11.7, which also left 15 players with Ritual Burn 1297624 going into
    Ignition 2).
- Energy is on her casts (pw, max 100): 0, then 25 after Ignition 1; 30 with the Amani; 55 after Ignition 2; 65 at the intermission.
  On the kill it was back near 0 early in P2 (3 at 5:09), climbing about 0.4 a second plus Invoke, and 66 at the kill.
- Restless Amani:
  - They spawn with Gravebound Advance 1287533 (cast plus aura on themselves), in sets of 4 to 6. Sets go with the Ritual Drummers'
    drumming (0:52, 2:01, 3:23, 4:30, 5:30, 6:10).
  - An Amani that reaches the water drops its shield and is never seen dying (kill: set 1 Amani 6, shield off at 1:12.0, Rite at 1:11.7).
- **Warcraft Logs reuses an add's instance number after it dies.** The translator now gives each life its own GUID: a new life starts
  with the first event more than 1 s after the death. A revived corpse is a different actor (434, same NPC id 261509) that spawns the
  same moment its corpse's Vessel of Awakening 1297631 starts.
- Corpses:
  - Kill: 2 back at 3:21 (1.2 s apart) and 2 at 5:01. The raid lived.
  - Wipe: 5 back within 0.6 s at 3:26. Vessel of Awakening 1297630 then killed 11 players in 1 s.
- Hungering Pyre 1289855: the cast starts 7.5 s before the hit; the hit is split.
  - Kill: 8, 6, 6 and 7 soakers.
  - Wipe: Pyre 2 had 1 soaker, who died.
- Slithering Flame 1294933 lands on about 10 non-soakers per Pyre, by design (the old rule called it a mistake; removed).
- Grasping Depths 1293212 (an aura on the Soulcoil Well while the Echo lives). Immortal Coil 1308227 hits only the players in the well.
  - Two teams of 5 alternated: Hobbz, Flëxørçïst, Zaffia, Dragooned, Larryg / Volkovod, Kargaryen, Huservoker, Jangokin, Boltzzx.
  - Every Soulcoiler's Curse 1300238 was kicked on the kills.
  - Swirling Spirit 1300239 touches a few of the team even on kills. The wipe's team died to it after the corpse wipe.
- Invoke 1299673: a 5 s cast. Debuff 1299722 on the players it interrupted: 7, 8 and 2 on the kill.
- Essence Rend 1287434: dispelled after 0.3 to 8.6 s; puddles landed 43 to 54 yd from the well's centre on the kill.
  Latent Cultist 1288554 hits come mostly in P2, after Invoke moves them.
- Possession Barrage 1284103, raid hit 1292034. The tank stood 30 to 41 yd from her; each player took about 200 to 350k.
- Hollowing Strikes is 1284109 (the rule had 1284110).

## Thresholds that are my call (not from a guide)
- Essence Rend puddle amber under 25 yd from the well's centre (the kill's were all 43+).
- Possession Barrage amber with the tank under 25 yd (the guides say 30+).
- Hungering Pyre amber under 4 soakers.
- Corpses: amber for 2 back at once, red for 3+ or deaths.
- Swirling Spirit: one touch is shown, not judged; 2+ in one Echo is amber.
- Invoke interrupts: Low.
- The last Drowned Echo of a kill with nobody in it isn't judged (the burn).

## Not checked yet
- NSRT note teams for Grasping Depths (Wolfthorn's note may name them): not wired.
- Soul Transfer damage ID: nobody was hit on these pulls (matched by name).
