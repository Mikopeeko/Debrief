// The death plan's checks (Nov 12, Main's plan, Flex: "ok fix it"): every death in one bucket (You, The raid, Unlucky), only deaths before the wipe
// count (the call and a quarter of the raid dead), no halves, each death costs once (never again in Mechanics), and every tab shows the bucket's
// one line. The page's own deathVerdict runs on every saved pull of the test nights (contradictions.js NIGHT_R), with the coaching-only helpers
// stubbed (the fix line, the note's healer, the module row's words); and the tabs are checked to read that one line.
'use strict';
module.exports = function deathsCheck(NIGHT_R, H, say) {
  const U = H.UI, has = (n) => { try { H.grab(n); return true; } catch (e) { return false; } };
  if (!has('DEATH_BUCKET') || !has('quarterDead')) { say('the page code', 'deaths', 'the three death buckets (DEATH_BUCKET, quarterDead) are gone'); return; }
  const X = H.site(['deathHit', 'deathHitId', 'deathFast', 'DEATH_KIT', 'DEATH_IMM', 'deathShare', 'deathRaidSay', 'DEATH_BUCKET', 'quarterDead', 'deathOwn', 'andList', 'capS', 'deathVerdict', 'deathList', 'deathsOf', 'gbDeathOk'],
    { cutT: () => Infinity, oaRowWhy: () => null, deathFix: () => '', deathHealerOf: () => null, dbfTip1: (x) => x, wipeMech: () => null, whyReason: (x) => x, oaFlip: (x) => x, oaBase: (n) => String(n || '').split('-')[0],
      plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), esc: (x) => String(x), S: {}, RC_NEXT: {} });
  let n = 0; const B = { you: 0, raid: 0, unlucky: 0 };
  for (const [code, reps] of NIGHT_R) for (const r of reps) for (const d of r.deaths || []) { let v; try { v = X.deathVerdict(r, d); } catch (e) { say(code, 'deaths', 'deathVerdict crashed on pull ' + (r.item && r.item.pull) + ': ' + e.message); continue; } n++;
    const where = code + ' pull ' + (r.item && r.item.pull) + ' · ' + String(d.player).split('-')[0] + ' at ' + Math.round(d.t) + ' s';
    if (!(v.bucket in B)) { say(where, 'deaths', 'no bucket (' + v.bucket + ')'); continue; } B[v.bucket]++;
    // (no halves: a death costs 1 or nothing)
    if (v.w !== 0 && v.w !== 1) say(where, 'deaths', 'weighs ' + v.w + ', not a whole death');
    // (the bucket, its label and its one line agree; only a You death before the wipe is on them)
    if (v.label !== X.DEATH_BUCKET[v.bucket] || !String(v.say || '').startsWith(v.label + ': ')) say(where, 'deaths', 'its line "' + v.say + '" doesn\'t start with its bucket (' + v.label + ')');
    if (v.on !== (v.w === 1) || (v.on && (!v.counts || v.bucket !== 'you'))) say(where, 'deaths', 'on them (' + v.on + ') but bucket ' + v.bucket + ', counts ' + v.counts);
    // (nothing after a quarter of the raid is dead counts, even an avoidable death)
    if (X.quarterDead(r, d) && (v.counts || v.bucket !== 'raid')) say(where, 'deaths', 'died after a quarter of the raid was dead, but it counts (' + v.say + ')');
    // (Unlucky is a one-shot that wasn't their mistake)
    if (v.bucket === 'unlucky' && (v.own || !X.deathFast(d))) say(where, 'deaths', 'Unlucky, but ' + (v.own ? 'it was their own mistake' : 'it wasn\'t a one-shot')); }
  if (!n) say('the test nights', 'deaths', 'no deaths were read');
  // (Flex, Nov 12: "pull deaths from the graphs tab": for every raider and every set of pulls (each night, each pull), the Report card's Deaths on you
  //  (deathsOf's You deaths) is the number of You deaths Graphs lists for them (gbDeathOk, up to each pull's end as Graphs cuts it))
  let sets = 0, bad = 0;
  for (const [code, reps] of NIGHT_R) for (const L of [reps].concat(reps.length > 1 ? reps.map((r) => [r]) : [])) { sets++; const names = new Set(); for (const r of L) for (const p of (r.players && r.players.values()) || []) if (p.name && !/^Player-/.test(p.name)) names.add(p.name);
    for (const nm of names) { const card = X.deathsOf(L, nm).on.length; let gr = 0; for (const r of L) { const p = [...r.players.values()].find((q) => q.name === nm); if (!p) continue; const end = Math.min(r.duration || 0, Infinity); gr += (r.deaths || []).filter((d) => d.guid === p.guid && d.t <= end + 0.5 && X.gbDeathOk(r, d)).length; }
      if (card !== gr && bad++ < 5) say(code + (L.length === 1 ? ' pull ' + L[0].item.pull : ' (night)') + ' · ' + nm.split('-')[0], 'deaths', 'the Report card says ' + card + ' own deaths, Graphs ' + gr); } }
  if (!/function gbDeathOk\(r, d\) \{ try \{ const v = deathVerdict\(r, d\); return !!\(v && v\.on\)/.test(U) || !U.includes('function deathsOf(reps, name) { const all = deathList(reps, name, true);') || !U.includes("own = deathList(L).filter((x) => x.v.on).length")) say('the page code', 'deaths', 'Graphs, the Report card or Summary\'s Deaths tile no longer count own deaths from the one death list (deathList, You)');
  if (!U.includes("'<em class=\"g8-own g8-bk g8-bk-' + dv.bucket") || !U.includes('+ sen + g8BkLine(r, d) +')) say('the page code', 'deaths', 'Graphs\' Deaths view no longer tags each death with its bucket and line');
  // (every tab reads the one line and whole numbers; a death never costs again in Mechanics)
  for (const [s, what] of [["t: v.say || (p + ': ' + h.replace(/\\.$/, ''))", 'the Deaths tab\'s death card'], ["why: { k: v.why, t: v.say || v.word }", 'Debriefing\'s death lines'],
    ["(x.v.say || x.v.word)", 'the Report card\'s Deaths on you hover'], ["esc(x.dTip || rcbDeathTip(x.deaths, x.dAll))", 'the roster\'s Own deaths hover'], ["'<span>Own deaths</span></div>'", 'the roster\'s Own deaths header'],
    ["on + ' of ' + plural(DO.n, 'death')", 'the Report card\'s Deaths on you count'], ["(x.deaths ? String(x.deaths) : '<em>none</em>')", 'the roster\'s count'],
    ["const w = bucket === 'you' ? 1 : 0", 'the one weight'], ["after = (isFinite(ct) && d.t > ct + 0.5) || quarterDead(r, d)", 'the before-the-wipe rule'],
    ["add('alive', 'na', 'Defensive before dying'", 'Defensive before dying as information']]) if (!U.includes(s)) say('the page code', 'deaths', what + ' no longer reads the one death rule (expected "' + s.slice(0, 60) + '")');
  if (/\+ 40 \* ed\b/.test(U) || /dd \? 'bad'/.test(U)) say('the page code', 'deaths', 'a death lowers the Mechanics score again (a death costs once, in Staying alive)');
  if (/Half on them|Partly the raid/.test(H.grab('deathTag'))) say('the page code', 'deaths', '"Half on them" or "Partly the raid\'s fault" is back');
  console.log('  deaths: ' + n + ' read (' + B.you + ' You, ' + B.raid + ' The raid, ' + B.unlucky + ' Unlucky); card = Graphs in ' + sets + ' pull sets');
};
