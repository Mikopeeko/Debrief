# Avoidable damage — checklist (new boss, new source, or after a hotfix)

Full research and rules: `Avoidable damage - how to judge it.md`.

1. **List the sources** from the encounter journal and the boss guide (notes/Guides/Bosses): what positioning can avoid.
   Leave out raid-wide pulses, the target's own hit, soaks and anything a job puts you in. Mark Dangerous only what kills
   or cripples (frontals on non-tanks, ghosts, debris).
2. **Pick the measure:** ground and pools = seconds standing in it (add the name to `AV_SECS` in engine.js); everything
   else = hits. Carriers and targets: add a `skip` so they aren't judged on their own circle.
3. **Run the engine on the fastest kills** (10–20, Mythic): `wclaudit.js <out> top:<encounterId>:5:<n>` in the shared
   notes' `av` scripts, one download at a time (Warcraft Logs rate-limits the site if you fetch three at once).
4. **Make the bars:** `node genbase.js > base.json`, paste the boss into `AVOID_BASE` (engine.js).
5. **Sanity check:** `node bars.js <kills>`: in the kills, amber only (no red) should be the usual, and red only for deaths
   and Dangerous hits. If a source is red or amber for a quarter of kill raiders, the source is wrong (raid-wide, a job), not
   the raiders. Then `node bars.js <kills> <our night> -p` and read the "in fixes" list like a raid lead would.
6. **Re-run Kill baselines** for the boss (`Kill baselines - how to build one.md`): the avoid line's ok/med changes.
7. **Tell the Deaths chat** if the list changed: their ownAvoid reads the same list.
