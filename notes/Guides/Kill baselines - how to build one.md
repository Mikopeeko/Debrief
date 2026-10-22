# Kill baselines — how to build one (first done Oct 22, 2026: The Coiled Altar, Mythic)

The idea (from how Wipefest scores): judge each mechanic against what the fastest kills actually do, not only against a
fixed rule. A mechanic the kills nearly always get right matters most when we miss it; one even the best kills slip on
matters less. The coach then says "Even the fastest kills slip here: only 2 of 20 got it fully right. A typical kill gets
about 13% of it wrong; we got 25%."

## Checklist (one boss, one difficulty)
1. **Find the encounter id.** `curl https://debriefme.io/api/report?code=<any report with the boss>`: fights[].encounterID
   (Coiled Altar 3429, Ula'tek 3492, Vashnik 3455, Sszorak 3420, Twin Fangs 3421).
2. **Get the fastest kills.** `https://debriefme.io/api/topkills?e=<id>&d=5&p=1` (d=5 Mythic, d=4 Heroic): 20 kills per page,
   each with `code` and `fight`. Use 20.
3. **Open a practice copy** with the test hook (`window.__wla` is on for `*-debrief.*.workers.dev` hosts: S, pullSections,
   coachSummary). Upload with `npx wrangler versions upload --preview-alias <fresh name>`.
4. **Read each kill through Debrief itself** in the Browser pane: navigate to `<practice>/?report=<code>&fight=<n>&tab=audit`,
   wait until `__wla.S.rep.item.kill` and `.wcl.code === code`, then for each `[id, x]` of `__wla.pullSections(rep)` record
   `st` and the rows: `n`, `b` (rows with a bad cell), `w` (warn, no bad). Save into the page's localStorage (`kb`), one key per
   kill, because every navigation reloads the page. Do 4–5 kills per browser_batch (navigate + the read script each).
5. **Sum it up per mechanic line:** kills read `k`, `ok` (st === 'ok'), and `med` = the median of (b + w) / n in percent.
   Leave out lines seen in fewer than 10 kills and `st === 'na'` (info only).
6. **Add the numbers** to `KILL_BASE` in src/ui.js: `KILL_BASE[boss][diffId].sec[id] = { k, ok, med }`, with `from:` saying
   which kills and the date.
7. **Check on a real night** (the shared night ?night=PLRbTkpI_S3vOfdSwJrDZw for Coiled Altar): the coach's full coaching
   shows "Against kills: …", the tags say "kills get this right" or "even kills slip here", and the order makes sense.
8. **Sanity checks before going live:** no kill should have a *failed* mechanic (they killed it); if a line is clean in under
   3 of 20 kills, ask whether our check is too strict before trusting it (Guillotine soaks: 3 of 20, a typical kill gets 50%
   of the soak rows flagged. That looks like our soak rule, not the kills).

## How the coach uses it
- `kbImp(item, sectionId)`: 2 = kills get it right 70%+, 1 = 40–70%, 0 = under 40%. The raid's list and a player's mechanic
  misses sort failed first, then by kbImp, then by how often. What wiped us stays first.
- Tags: "kills get this right" (gold) or "even kills slip here" (grey). Full coaching: "Against kills: …".

## Coiled Altar Mythic, Oct 22 (20 fastest kills, 489–514 s)
Done right in: shield 17/20, interrupts 16/20, adds 12/20, Dreadmarch 11/20, phase push 9/20, Guillotine soaks 3/20,
Venomfang 3/20, orbs 2/20, Gloombombs 2/20, tank frontals 2/20, avoidable damage 0/20. No kill failed any mechanic.

## Next
The other 9 bosses, Mythic then Heroic, one at a time with this checklist. Re-run a boss after a hotfix or when the
check itself changes.
