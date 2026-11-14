// Makes the small real-log copies that tests/ula-later.js reads (tests/fixtures/ula-later/<code>_<fight>.json.gz), from the log library's full downloads.
// A whole pull is 60 to 250 MB; a copy keeps what the fight's checks, the wipe call, the root cause and the death rule read, and is about 1 MB:
//   - everything an enemy or the room did (casts, damage on players, debuffs), deaths, rezzes, kicks, dispels, summons, the players' own casts and gear lines;
//   - one of our hits a second on each enemy (its health), and the players' own buffs that are defensives, immunities, Bloodlust or potions;
//   - not: healing, absorbs, resources, the rest of our damage and of our own buffs.
// A kill can keep only the seconds a check needs (win), with the fight's casts, deaths and kicks kept throughout so its phases still read.
// After writing a copy it reads the pull both ways, whole and trimmed, and prints anything the checks look at that came out different.
//   node tests/ula-later-make.js                 every pull in tests/ula-later.js
//   node tests/ula-later-make.js <code:fight>     one of them
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const LIB = 'C:/Users/james/DebriefLogs', OUT = path.join(__dirname, 'fixtures', 'ula-later');
const L = require('./ula-later.js'), H = require('./site-helpers.js'), E = H.E, W = require(path.join(__dirname, '..', 'src', 'wcl.js'));
const KEEP_AURA = /shield|block|barrier|turtle|cloak|dispersion|fortitude|barkskin|survival instincts|wall|last stand|resolve|dark pact|netherwalk|blur|redemption|feign|potion|bloodlust|heroism|time warp|fury of the aspects|primal rage|harrier|ice cold|zen meditation|dampen|karma|evasion|feint|cheat|purgatory|reincarnation|soulstone|anti-magic|icebound|vampiric blood|rune tap|bear form|ironbark|pain suppression|guardian spirit|life cocoon|sacrifice|protection|spellwarding|time dilation|obsidian scales|renewing blaze|desperate prayer|fade|astral shift|exhilaration|die by the sword|spell reflection|rallying|darkness|aura mastery|spirit link|tranquility|revival|divine hymn|rewind|healthstone|frenzied regeneration/i;
const only = process.argv.slice(2).filter((a) => /^[A-Za-z0-9]{16}:\d+$/.test(a));
fs.mkdirSync(OUT, { recursive: true });
for (const P of L.PULLS) { if (only.length && !only.includes(P.key)) continue;
  const [code, fight] = P.key.split(':'), rf = path.join(LIB, 'reports', 'rep_' + code + '.json'), ef = path.join(LIB, 'events', code + '_' + fight + '.json');
  if (!fs.existsSync(rf) || !fs.existsSync(ef)) { console.log(P.key + ': not in the log library, skipped'); continue; }
  let rep = JSON.parse(fs.readFileSync(rf, 'utf8')); rep = rep.data || (rep.reportData ? rep.reportData.report : rep);
  let ev = JSON.parse(fs.readFileSync(ef, 'utf8')); if (!Array.isArray(ev)) ev = ev.events;
  const actors = new Map(rep.masterData.actors.map((a) => [a.id, a])), abil = new Map(rep.masterData.abilities.map((a) => [a.gameID, a]));
  const f0 = rep.fights.find((f) => f.id === +fight), t0 = f0.startTime, isPl = (id) => { const a = actors.get(id); return !!a && (a.type === 'Player' || a.type === 'Pet'); };
  /* (tail: only the pull's last so many seconds, for a wipe whose check reads its collapse) */
  const WIN = P.win || (P.tail ? [[(f0.endTime - t0) / 1000 - P.tail, (f0.endTime - t0) / 1000 + 1]] : null);
  const inWin = (e) => !WIN || WIN.some(([a, b]) => { const s = (e.timestamp - t0) / 1000; return s >= a && s <= b; });
  const ALWAYS = new Set(['encounterstart', 'encounterend', 'combatantinfo', 'death', 'resurrect', 'interrupt', 'dispel', 'summon', 'create', 'aurabroken', 'instakill']);
  const DROP = new Set(['heal', 'absorbed', 'healabsorbed', 'resourcechange', 'extraattacks', 'empowerstart', 'empowerend']), hpSec = new Set(), keep = [];
  for (const e of ev) { const t = e.type, sp = isPl(e.sourceID), tp = isPl(e.targetID);
    if (ALWAYS.has(t)) { keep.push(e); continue; } if (DROP.has(t)) continue;
    if (t === 'damage') { if (!sp || tp) { if (inWin(e) || !tp) keep.push(e); continue; } const k = e.targetID + ':' + (e.targetInstance || 0) + ':' + Math.floor(e.timestamp / 1000); if (!hpSec.has(k) && e.hitPoints != null) { hpSec.add(k); keep.push(e); } continue; }
    if (t === 'cast' || t === 'begincast') { if (!sp) keep.push(e); else if (t === 'cast' && inWin(e)) keep.push(e); continue; }
    /* (buffs and debuffs) */ if (!sp) { keep.push(e); continue; } if (!tp) continue; const nm = (abil.get(e.abilityGameID) || {}).name || ''; if (KEEP_AURA.test(nm) && inWin(e)) keep.push(e); }
  const usedA = new Set(), usedB = new Set(); for (const e of keep) { for (const k of ['sourceID', 'targetID', 'killerID', 'attackerID', 'healerID']) if (e[k] != null) usedA.add(e[k]); for (const k of ['abilityGameID', 'extraAbilityGameID', 'killingAbilityGameID']) if (e[k] != null) usedB.add(e[k]); }
  for (const a of rep.masterData.actors) if (a.petOwner != null && usedA.has(a.id)) usedA.add(a.petOwner);
  const nth = rep.fights.filter((f) => f.encounterID === f0.encounterID && f.difficulty === f0.difficulty && f.id <= f0.id).length;
  const fx = { v: 1, key: P.key, pull: nth, note: P.name, madeFrom: ev.length, report: { title: rep.title || '', startTime: rep.startTime, endTime: rep.endTime, guild: rep.guild ? { name: rep.guild.name } : null, fights: [f0],
    masterData: { actors: rep.masterData.actors.filter((a) => usedA.has(a.id)), abilities: rep.masterData.abilities.filter((a) => usedB.has(a.gameID)) } }, events: keep };
  const gz = zlib.gzipSync(Buffer.from(JSON.stringify(fx)), { level: 9 }), of = path.join(OUT, code + '_' + fight + '.json.gz'); fs.writeFileSync(of, gz);
  // the pull read whole and trimmed: what the checks look at must come out the same
  const full = L.read(H, W, { report: rep, events: ev, pull: nth, key: P.key }), trim = L.read(H, W, L.load(of)), diff = [];
  const cmp = (k, a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) diff.push(k + ': whole ' + JSON.stringify(a).slice(0, 260) + ' | trimmed ' + JSON.stringify(b).slice(0, 260)); };
  cmp('phases', full.phases, trim.phases); cmp('call', full.call, trim.call); cmp('root', full.root, trim.root); cmp('deaths', full.deaths.length, trim.deaths.length);
  for (const d of full.deaths) { const o = trim.deaths.find((x) => x.p === d.p && Math.abs(x.t - d.t) < 0.3); if (!o) diff.push('death missing: ' + d.p + ' ' + d.t.toFixed(0)); else if (!P.win && o.say !== d.say) diff.push('verdict ' + d.p + ' ' + d.t.toFixed(0) + ': whole "' + d.say + '" | trimmed "' + o.say + '"'); }
  const ms = (x) => x.mistakes.filter((m) => m.sev === 'High' || m.p === 'Raid').map((m) => Math.round(m.t) + ' ' + m.p + ' ' + m.mech + ': ' + m.detail).filter((s) => !/^\d+ Raid Pace/.test(s)); if (!P.win) cmp('High and raid rows', ms(full), ms(trim));
  const problems = L.check(P, trim);
  console.log(P.key + ' ' + (P.name || '') + ': ' + ev.length + ' events -> ' + keep.length + ', ' + (gz.length / 1e6).toFixed(2) + ' MB · ' + (diff.length ? diff.length + ' DIFFERENT from the whole pull' : 'reads the same as the whole pull') + ' · its check: ' + (problems.length ? problems.length + ' PROBLEMS' : 'passes'));
  for (const d of diff.slice(0, 8)) console.log('    ' + d); for (const p of problems) console.log('    check: ' + p);
}
