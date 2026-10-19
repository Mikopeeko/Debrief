# Holy Paladin (healer) — the user's main

Read Oct 19 2026. Wowhead (patch 12.1.5) + Icy Veins (12.1.5). No 12.1.5 class changes.
12.1 tuning (Wowhead): all healing +19%, damage +20%, Eternal Flame/Word of Glory +20.75%, Holy Shock +65%,
Pillars of Light#1232616 +50%, Ringing of the Heavens#1241542 now casts Divine Toll at 200% (was 100%).
The site's deeper Holy Paladin playbook is `SPEC_BOOK` in Compare; this file is the guide summary.

## The spec in one line
Build and spend Holy Power. Never generate at 5. Always be casting. Spend Infusion of Light procs on Flash of Light.
Use Divine Toll and Avenging Wrath as often as possible ("saving them for a rainy day creates a rainy day").

## Hero trees and builds
- **Herald of the Sun for raid** (both guides; Icy Veins: Lightsmith "not competitive in raiding"). Herald buffs Holy Shock and the spenders;
  Word of Glory becomes Eternal Flame#156322 (heals a bit more + small HoT); Dawnlight#431377 HoTs, Sun's Avatar#431425 beams to them.
- Mythic+: Herald by default (better reactive healing). Lightsmith = more damage, fewer guarantees. Delves: Lightsmith (Wowhead).
- **Beacon of Virtue#200025 is the default** (more HPS, burstier) — if you can use it close to on cooldown. Beacon of Faith#156910 = more mana,
  easier, lower output; take it if you can't get value from Virtue. Lightsmith → Faith builds. M+ Faith → swap Pillars of Light for Rising Sunlight#1277651.
- Talent notes (Wowhead):
  - Glistening Radiance#1241805 / Saved by the Light#157047 are "best of the rest"; swap for Divine Favor#1270916 + Protection of Tyr#211210, especially if you get Innervates.
  - Seraphic Barrier#1241714: looks good on meters but cuts spender healing 15% (lost beacon transfer) — only worth it if spenders/beacons overheal 30-35%+. With it, consider Beacon of Faith.
  - Moment of Compassion#387786 with Virtue: cast every Flash of Light on a Beaconed player (Savior or Virtue). With Faith → Resplendent Light#392902.
  - Liberation#461287: pure DPS, no healing. For real damage use Shield of the Righteous instead (same damage + mana back).
  - Unending Light#1271221 + Breaking Dawn#387879: not worth 3 points; Eternal Flame stays better (Light of Dawn transfers to beacons at half rate).
  - Call of the Righteous#1241511 (instead of Rising Sunlight + Truth Prevails#461273): only if damage lines up with a 90 s Wings; generally a loss.
- Apex **Beacon of the Savior#1244878** (3 ranks): an extra beacon that sits on the lowest-health ally (moves when they're healed above 50% or someone
  else drops under 50%); rank 2 = more transfer and +20% healing to that target; rank 3 = shield + damage reduction every 8 s / on move.
  All "Beacon of Light" talents buff it. Healing the Savior target directly is fine (the +20% makes up for lost transfer) — just heal whoever's in danger.
- Omnium Folio (Icy Veins): Unleashed Fire, Self-Mending, Lingering, Masterful Cunning (any secondary is fine), Overload.

## Healing priority (raid, Herald, Virtue) — Wowhead order
1. Beacon of Light#53563 (+ Beacon of Faith) up. Cast **Beacon of Virtue for AoE healing** — Icy Veins: "right as damage hits", keep near cooldown.
2. Spend Holy Power at 5.
3. **Divine Toll#375576 on an ally** (Holy Prism#114165 if taken) — only at 2 or fewer Holy Power. On an enemy it shocks enemies first.
4. (Lightsmith) Holy Bulwark#432459 / Sacred Weapon#432472, only at ≤2 Holy Power.
5. **Spend Infusion of Light#53576 procs** — on Flash of Light#19750 if anyone needs healing; Judgment#20271 only if no good target.
6. Holy Shock#20473 on an ally. (Avenging Crusader: Hammer of Wrath#1241288.)
7. Spend Holy Power: **Eternal Flame / Word of Glory#85673 is the best spender**; Light of Dawn#85222 only if EF would overheal a lot.
   Don't bother spreading the EF HoT. Empyrean Legacy proc → Eternal Flame.
8. Holy Light#82326 as needed and as mana allows (with Virtue you can barely afford it). Season 2 4-piece: **Holy Light always grants Infusion** →
   use it as the fallback when you have no Infusion, Holy Power or Holy Shock charge but still need big healing.
9. Holy Shock (Avenging Crusader: Crusader Strike#35395). During Beacon of Virtue: Flash of Light.
10. Judgment. 11. Flash of Light.
- No healing needed: Shield of the Righteous#53600 (no mana cost, returns 1.8% mana → saves 2.4% vs a healing spender). Holy Shock on enemies returns half its cost.
- Mana is managed by casting more or fewer Holy Lights: as many as possible without running dry before the boss dies. Ask a Druid for Innervate
  (Holy Paladin is one of the best targets after Resto Shaman). Never drop Haste to fix mana (Icy Veins).

## Beacon of Virtue windows (both guides)
- In raid, **Divine Toll and Aura Mastery (with Ringing of the Heavens) go inside Beacon of Virtue**. Never Aura Mastery without Virtue up in raid. (M+: separate them.)
- Cast "good" single-target spells in the window: Holy Shock, Flash of Light (Infused + Moment of Compassion on Virtue targets = best), Eternal Flame, Holy Light.
  Bad in the window: Judgment, Light of Dawn.
- Advanced: spell-queue Beacon of Virtue at the end of a Holy Light cast (on someone else, not yourself) — the whole Holy Light transfers and you get an
  Infusion for the window. Very expensive; not often in raid.

## Avenging Crusader (Icy Veins priority)
Spend at 5 → Judgment on cooldown → Crusader Strike on cooldown → Light of Dawn → Holy Shock.

## Major cooldowns
- **Avenging Wrath#384376** (Wowhead: "not particularly powerful but lasts long", 30 s with Sanctified Wrath#53376; 2 min): use on cooldown when you need a boost,
  as often as possible; Icy Veins: ideally on longer damage windows. Hand of Divinity#1242008: next two (one with Crusader) Holy Lights instant, 20 s to use them.
- **Aura Mastery#31821** (Devotion Aura#465 on always; 12% raid damage reduction): usually assigned. With Ringing of the Heavens it's a strong heal →
  Wowhead: use when people are **already injured** (pre-damage is fine if they're not topped). Overflowing Light#461244 makes overhealing less bad.
- Divine Toll / Holy Prism: near cooldown, unless it would overheal hugely. Herald: each one gives 2 Dawnlights.
- Holy Bulwark: on a squishy who needs it, or on yourself so Solidarity#432802 puts the extra on a tank (most HPS). Sacred Weapon: on yourself
  (extra goes to a random healer). Overwriting either procs Infusion. Tempered in Battle#469701 makes Sacred Weapon a mini spirit link.
- Divine Shield#642 (also immunes Sacrifice damage), Blessing of Protection#1022 (physical immunity, drops threat — not on tanks unless asked; removes bleeds;
  Echoing Blessings#387801 adds 15% magic reduction), Blessing of Sacrifice#6940 (main external, use often; can't kill you — falls off at 20% hp;
  Divine Protection#498 does NOT reduce it). Holy Ritual#199422 makes BoP and Sac heal.

## Pre-pull
Beacon of Light + Faith on squishy ranged (Mage, Shaman, Hunter, Boomkin; Icy Veins: Balance, Shadow, Devastation, Hunters); tanks only if they need it.
Never beacon yourself (Light of the Martyr#447985). Devotion Aura on. Lightsmith: Rite of Sanctification#433568 / Rite of Adjuration#433583.
Avoid healing beaconed players directly (beacons only transfer from others) — except the Savior target.

## Common mistakes (Wowhead)
Wasting Holy Power (generators at 5; Divine Toll at 1-2 is fine). Too much damage focus. **Casting Judgment too much** — Infusions belong on Flash of Light when anyone needs healing.

## Mechanics
- Mastery: Lightbringer#183997: full value within 10 yd of you **or any beacon target** (Beacon of the Lightbringer#197446), linear to 0 at 40 yd.
- Beacon transfer: Light 10% (15% with Commanding Light#387781); Faith build cuts both by 30% → 10.5% each; Virtue 10%/15% per target; Savior 10%/15%
  (25% with the other Apex). Only direct heals transfer; Avenging Crusader, Light of Dawn and Holy Prism-on-enemy also do (LoD and Prism at half).
  Lay on Hands#633, HoTs and trinkets don't transfer.
- Infusion of Light: 10% per Holy Shock (≈19% as Herald with Second Sunrise#431474). On Flash of Light = instant + much bigger; on Judgment = bigger Greater
  Judgment#231644 + 1 extra Holy Power. Greater Judgment absorbs on the first player hit, overflow to next.
- Righteous Judgment#414113: no cap on Consecrations, each independent.

## Tier set (Season 2)
- 2-piece: more Flash of Light healing and bigger Greater Judgment absorb.
- 4-piece: Judgment 20% chance for Infusion; Holy Light always grants Infusion; Holy Light costs more mana.

## Stats
- Wowhead (all builds): Intellect >> Mastery > Haste = Crit > Versatility. Keep Crit and Haste roughly even.
- Icy Veins Herald (raid and M+): ilvl > Mastery > Haste > Crit > Vers. Lightsmith: Mastery > Crit > Haste > Vers (Hammer and Anvil).
- Item level beats stats.

## Consumables and enchants (Wowhead)
Flask of the Magisters#241322 (not Blood Knights). Potion of Recklessness#241288; Lightfused Mana Potion#241300 if you really need mana.
Concentrated Silvermoon Health Potion#271884. Herald: Thalassian Phoenix Oil#243734 / Lightsmith: Rite of Sanctification.
Food: Amani Cornucopia#275264 or Loa's Gathering#275265 feast (secondary-stat feast), Hearty Royal Roast#242747; drink Sanguithorn Tea#242299.
Enchants: Rite of the Hash'ey#273072 weapon, Silvermoon's Mending#244021, Mark of the Magister#244003 chest, Empowered Hex of Leeching#243951,
Arcanoweave Spellthread#240155, Shaladrassil's Roots#243983, Zul'jin's Mastery#243959 rings. Gems: Telluric Eversong Diamond#240969 (mana) —
Indecipherable is a hair more throughput; 1 each Garnet/Lapis/Peridot (Masterful), rest Flawless Quick Amethyst#240900.

## Damage priority (Wowhead)
Consecration#26573 down → SotR at 5 → Divine Toll on enemy → Judgment → Holy Shock on enemy → Judgment → SotR → Flash of Light for Holy Power.
Lightsmith: Avenging Wrath for damage often; Blessing of the Forge#433011 makes SotR hit much harder.

## Disagreements
- Stats: Wowhead Haste = Crit; Icy Veins Haste > Crit (Herald).
- Icy Veins' raid list has "Judgment as much as possible" above spending; Wowhead calls over-Judging a common mistake. Wowhead is more specific → follow it.
- Avenging Wrath: Wowhead "on cooldown when you need healing"; Icy Veins "line up with longer damage windows". Both: as many uses as possible.

## What a log can check
Holy Power wasted (generators at 5, not counting Divine Toll at 1-2); Infusion procs spent on Flash of Light vs Judgment vs expired; Divine Toll and
Avenging Wrath casts vs possible; Aura Mastery and Divine Toll inside Beacon of Virtue; Beacon of Virtue uses vs possible; beacons up pre-pull and not on
yourself; Holy Light count vs mana left at end; spender choice (Eternal Flame vs Light of Dawn). Never flag overhealing (see overheal memory).
