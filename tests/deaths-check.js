// The proof rule's checks (Nov 13, Main's plan, Flex: "yes": a death counts against a player only with proof: a mistake of their own that was part of what killed
// them, or 2 s or more at or under 35% with their own defensive, immunity or Healthstone ready; everything else is Not counted, no guessing at fault).
// Before it, the death plan's checks (Nov 12, Flex: "ok fix it"): every death in one bucket, only deaths before the wipe
// count (the call and a quarter of the raid dead), no halves, each death costs once (never again in Mechanics), and every tab shows the bucket's
// one line. The page's own deathVerdict runs on every saved pull of the test nights (contradictions.js NIGHT_R), with the coaching-only helpers
// stubbed (the fix line, the note's healer, the module row's words); and the tabs are checked to read that one line.
'use strict';
module.exports = function deathsCheck(NIGHT_R, H, say) {
  const U = H.UI, has = (n) => { try { H.grab(n); return true; } catch (e) { return false; } };
  if (!has('DEATH_BUCKET') || !has('quarterDead')) { say('the page code', 'deaths', 'the three death buckets (DEATH_BUCKET, quarterDead) are gone'); return; }
  const X = H.site(['deathHit', 'deathHitId', 'deathFast', 'DEATH_KIT', 'DEATH_IMM', 'deathShare', 'deathRaidSay', 'DEATH_BUCKET', 'quarterDead', 'deathOwn', 'andList', 'capS', 'DEATH_WIN', 'deathProof', 'deathVerdict', 'deathList', 'deathsOf', 'gbDeathOk', 'deathFix'],
    { cutT: () => Infinity, oaRowWhy: () => null, deathSecs: (x) => String(x), deathHealerOf: () => null, dbfTip1: (x) => x, wipeMech: () => null, whyReason: (x) => x, oaFlip: (x) => x, oaBase: (n) => String(n || '').split('-')[0],
      plural: (n, w) => n + ' ' + w + (n === 1 ? '' : 's'), esc: (x) => String(x), S: {}, RC_NEXT: {} });
  let n = 0; const B = { you: 0, none: 0 }, lc = (x) => String(x || '').toLowerCase();
  for (const [code, reps] of NIGHT_R) for (const r of reps) for (const d of r.deaths || []) { let v; try { v = X.deathVerdict(r, d); } catch (e) { say(code, 'deaths', 'deathVerdict crashed on pull ' + (r.item && r.item.pull) + ': ' + e.message); continue; } n++;
    const where = code + ' pull ' + (r.item && r.item.pull) + ' · ' + String(d.player).split('-')[0] + ' at ' + Math.round(d.t) + ' s';
    if (!(v.bucket in B)) { say(where, 'deaths', 'no bucket (' + v.bucket + ')'); continue; } B[v.bucket]++;
    // (no halves: a death costs 1 or nothing)
    if (v.w !== 0 && v.w !== 1) say(where, 'deaths', 'weighs ' + v.w + ', not a whole death');
    // (the bucket, its label and its one line agree; only a You death before the wipe is on them)
    if (v.label !== X.DEATH_BUCKET[v.bucket] || !String(v.say || '').startsWith(v.label + ': ')) say(where, 'deaths', 'its line "' + v.say + '" doesn\'t start with its bucket (' + v.label + ')');
    if (v.on !== (v.w === 1) || (v.on && (!v.counts || v.bucket !== 'you'))) say(where, 'deaths', 'on them (' + v.on + ') but bucket ' + v.bucket + ', counts ' + v.counts);
    // (nothing after a quarter of the raid is dead counts, even an avoidable death)
    if (X.quarterDead(r, d) && (v.counts || v.bucket !== 'none')) say(where, 'deaths', 'died after a quarter of the raid was dead, but it counts (' + v.say + ')');
    // (the proof rule: a You death carries its proof, and the proof is in the log; nothing else is on them)
    if (v.bucket === 'you') { const p = v.proof, win = (d.recap || []).filter((e) => !e.heal && e.t >= d.t - X.DEATH_WIN && e.t <= d.t + 0.1);
      if (!p) say(where, 'deaths', 'counts against them with no proof (' + v.say + ')');
      else if (p.k === 'mistake' && !p.chain && !win.some((e) => lc(e.spell) === lc(p.sp))) say(where, 'deaths', 'the proof names ' + p.sp + ', but no ' + p.sp + ' hit landed in their last ' + X.DEATH_WIN + ' s');
      else if (p.k === 'mistake' && (d.mass || 0) >= 3 && lc(p.sp) !== lc(X.deathHit(d)) && !p.chain) say(where, 'deaths', 'a mass death (' + d.mass + ' at once) counts against them for ' + p.sp + ', which isn\'t the hit that killed them');
      else if (p.k === 'low' && (!((d.lowFor || 0) >= 2) || !(v.defs.length + v.kit.length) || (d.mass || 0) >= 3)) say(where, 'deaths', 'counts as sitting low with something ready, but they were low for ' + (d.lowFor || 0).toFixed(1) + ' s, ' + (v.defs.length + v.kit.length) + ' ready, mass ' + (d.mass || 0)); }
    else if (v.proof) say(where, 'deaths', 'Not counted, but it carries a proof'); }
  /* (Main's named deaths, Nov 13: each fails on the rule before it. Checked when the pull is in the run: Nov 12 pull 5 and Nov 11 pull 5 in every build) */
  const NAMED = [['Gax3AkbyFRXmdrgQ', 5, 'Flëxørçïst', 177, true, /Axegrinder hits? right before you died/, 'Nov 12 pull 5: Flex picked up his soul fragments standing in an axe (Flex: "foolishly picked them up too quickly when my health was low with an axe eating my booty")'],
    ['Gax3AkbyFRXmdrgQ', 4, 'Flëxørçïst', null, false, /^Not counted: /, 'Nov 12 pull 4: Flex died to Spirit Erasure, under 35% for about 0.4 s'],
    ['agt6jMTyZBYvVzAP', 7, 'Flëxørçïst', 60, true, /Sever/, 'Nov 11 pull 7: Flex stood in Sever'], ['agt6jMTyZBYvVzAP', 12, 'Flëxørçïst', 23, true, /Sever/, 'Nov 11 pull 12: Flex stood in Sever'],
    ['agt6jMTyZBYvVzAP', 17, 'Flëxørçïst', 445, false, /^Not counted: /, 'Nov 11 pull 17: Flex was feared onto the orbs by an unkicked Wail of Terror'],
    ['agt6jMTyZBYvVzAP', 5, 'Raiyvenz', 217, true, /s under 35% with .* ready/, 'Nov 11 pull 5: Raiyvenz sat under 35% for 4 s with Icebound Fortitude and Anti-Magic Shell ready'],
    ['agt6jMTyZBYvVzAP', 4, 'Zaffia', 430, false, /^Not counted: /, 'Nov 11 pull 4: Zaffia was mind controlled']];
  /* (Raiyvenz's pull is read here in every build, without the other checks: the build's own set stays the quick one) */
  const fsx = require('fs'), pth = require('path'), LIBD = process.env.DEBRIEF_LOGS || 'C:/Users/james/DebriefLogs';
  const ownLoad = (code, fight) => { try { const rf = pth.join(LIBD, 'reports', 'rep_' + code + '.json'), ef = pth.join(LIBD, 'events', code + '_' + fight + '.json'); if (!fsx.existsSync(rf) || !fsx.existsSync(ef)) return null; const Wc = require(pth.join(__dirname, '..', 'src', 'wcl.js'));
    let rr = JSON.parse(fsx.readFileSync(rf, 'utf8')); rr = rr.data || (rr.reportData ? rr.reportData.report : rr); const it = H.pullItems(code, rr, Wc).get(fight); let ev = JSON.parse(fsx.readFileSync(ef, 'utf8')); if (!Array.isArray(ev)) ev = ev.events;
    const r = H.E.analyze(it, Wc.translate(it, ev), {}); if (!r.item) r.item = it; return r; } catch (e) { return null; } };
  /* (each named death's fight; the first two are read in every build, the rest with --all: the run's own set no longer holds these nights) */
  const FIGHT = { 'Gax3AkbyFRXmdrgQ|5': 7, 'agt6jMTyZBYvVzAP|5': 6, 'Gax3AkbyFRXmdrgQ|4': 6, 'agt6jMTyZBYvVzAP|7': 8, 'agt6jMTyZBYvVzAP|12': 13, 'agt6jMTyZBYvVzAP|17': 18, 'agt6jMTyZBYvVzAP|4': 5 }, EVERY = ['Gax3AkbyFRXmdrgQ|5', 'agt6jMTyZBYvVzAP|5'], ALLRUN = process.argv.includes('--all');
  let named = 0; for (const [code, pull, who, at, want, re, what] of NAMED) { const r = (NIGHT_R.get(code) || []).find((x) => x.item && x.item.pull === pull && /Coiled Altar/.test(x.item.boss)) || (FIGHT[code + '|' + pull] && (ALLRUN || EVERY.includes(code + '|' + pull)) ? ownLoad(code, FIGHT[code + '|' + pull]) : null); if (!r) continue;
    const ds = (r.deaths || []).filter((d) => String(d.player).split('-')[0] === who && (at == null || Math.abs(d.t - at) <= 3)); if (!ds.length) { say(code + ' pull ' + pull, 'deaths', what + ': the death isn\'t in the saved pull'); continue; }
    for (const d of at == null ? ds.slice(0, 1) : ds) { named++; const v = X.deathVerdict(r, d); if (!!v.on !== want || !re.test(v.say || '')) say(code + ' pull ' + pull + ' · ' + who, 'deaths', what + ': expected ' + (want ? 'You' : 'Not counted') + ', the site says "' + v.say + '"');
      if (code === 'Gax3AkbyFRXmdrgQ' && pull === 5 && !/^Step out of the axe first, then pick up your fragments one at a time\. Each one hits for about \d+k, so heal up between them\.$/.test(v.fix || '')) say(code + ' pull 5 · ' + who, 'deaths', 'the fragments tip is gone: "' + v.fix + '"'); } }
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
    ["const P1 = after ? null : deathProof(r, d, { cc, axe: !!axD });", 'proof 1 (a caught mistake that was part of what killed them)'], ["low = !after && !own && !end && !cc && !mass && (d.lowFor || 0) >= 2 && has;", 'proof 2 (2 s low with something ready)'],
    ["const why = after && !late ? 'wipe' : own ? 'own' : end ? 'end' : low ? 'ready' : mass ? 'mass' : noCtrl ? 'shared' : forced ? 'forced' : 'none';", 'the proof-only verdict'],
    ["add('alive', 'na', 'Defensive before dying'", 'Defensive before dying as information']]) if (!U.includes(s)) say('the page code', 'deaths', what + ' no longer reads the one death rule (expected "' + s.slice(0, 60) + '")');
  if (/\+ 40 \* ed\b/.test(U) || /dd \? 'bad'/.test(U)) say('the page code', 'deaths', 'a death lowers the Mechanics score again (a death costs once, in Staying alive)');
  if (/Half on them|Partly the raid/.test(H.grab('deathTag'))) say('the page code', 'deaths', '"Half on them" or "Partly the raid\'s fault" is back');
  if (/deathOwn\(|venomOwn|noheal|soakFull|'nothing'|'fast' :/.test(H.grab('deathVerdict'))) say('the page code', 'deaths', 'a fault special case is back in the death rule (the proof rule decides alone)');
  console.log('  deaths: ' + n + ' read (' + B.you + ' You, ' + B.none + ' Not counted; ' + named + ' named deaths checked); card = Graphs in ' + sets + ' pull sets');
};
