// Who may edit a team's plan (Nov 9): rank 0-1 set the rank panel, the lead is matched by name AND realm, and only a guild's rank 0-1
// (or the site admin) sets up its "guild:N" team. Runs the Worker's own code against a fake storage and Blizzard roster, on this PC only.
//   node tests/team-access.mjs [path to a team-772787.json backup] [path to its owner's bnet link backup]
// With the two backups (backups/bnet-move-nov8/), it also dry-runs Wolfthorn's real records: Flex stays the lead. Nothing is written anywhere.
import fs from 'fs'; import path from 'path'; import os from 'os'; import { pathToFileURL, fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)), SRC = path.join(here, '..', 'src', 'worker_template.js');
let code = fs.readFileSync(SRC, 'utf8').replace("import { WorkerEntrypoint } from 'cloudflare:workers';", 'class WorkerEntrypoint {}').replace(/\b__[A-Z_]+__\b/g, '""'); /* (the build's placeholders) */
code += '\nexport { teamAccess, teamClaim, rankBoss, leadMatch, ownerRealm, leadByChar, guildRankOf };\n';
const tmp = path.join(os.tmpdir(), 'debrief-team-access-' + process.pid + '.mjs'); fs.writeFileSync(tmp, code);
// (the edge cache: a Map; a guild's roster is put in it the way guildRoster keeps it)
const C = new Map(); globalThis.caches = { default: { match: async (r) => (C.has(r.url) ? new Response(C.get(r.url)) : undefined), put: async (r, res) => { C.set(r.url, await res.text()); } } };
globalThis.fetch = async () => { throw new Error('no network in this test'); };
const W = await import(pathToFileURL(tmp).href); fs.unlinkSync(tmp);
let bad = 0; const ok = (c, msg) => { console.log((c ? '  ok   ' : '  FAIL ') + msg); if (!c) bad++; };
const store = new Map(), env = { debrief_nights: { get: async (k) => (store.has(k) ? { json: async () => JSON.parse(store.get(k)) } : null) } };
const url = new URL('https://debriefme.io/api/teamplan');
const link = (uid, chars, main) => store.set('bnet/' + uid.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json', JSON.stringify({ region: 'us', chars, main: main || (chars[0].n.toLowerCase() + '-' + chars[0].slug) }));
const roster = (g, list) => C.set('https://debrief.cache/guild-roster/us/' + g.realm + '/' + encodeURIComponent(g.name.toLowerCase()), JSON.stringify({ at: Date.now(), members: list.map(([n, slug, rank]) => ({ k: n.toLowerCase() + '-' + slug, n, rank })) }));
const ch = (n, slug, g, gs) => ({ n, slug, realm: slug, g: g || '', gs: gs || '' });

// ---- a made-up guild and its ranks
const G = { region: 'us', realm: 'zuljin', name: 'Testguild' };
roster(G, [['Gmone', 'zuljin', 0], ['Offone', 'zuljin', 1], ['Raidone', 'zuljin', 2], ['Leadchar', 'illidan', 2]]);
const people = { gm: [ch('Gmone', 'zuljin', 'Testguild', 'zuljin')], off: [ch('Offone', 'zuljin', 'Testguild', 'zuljin')], raid: [ch('Raidone', 'zuljin', 'Testguild', 'zuljin')], out: [ch('Stranger', 'zuljin', 'Otherguild', 'zuljin')],
  lead: [ch('Leadchar', 'illidan', 'Testguild', 'zuljin')], twin: [ch('Leadchar', 'stormrage', '', '')] };
const who = {}; for (const [k, cs] of Object.entries(people)) { who[k] = { uid: 'b:' + k, ids: ['b:' + k], bid: k, name: cs[0].n }; link('b:' + k, cs); }
const team = { id: 'team:1', owner: { uid: 'w:someoneelse', char: 'Leadchar', realm: 'illidan' }, officers: [], ranks: { guild: G, acc: { 0: 'edit', 1: 'edit', 2: 'see', 3: 'see' }, v2: 1 } };

console.log('1. Who can change "Who can edit, who can see"');
for (const [k, want] of [['gm', true], ['off', true], ['raid', false], ['out', false]]) { const A = await W.teamAccess(env, url, team, who[k]); ok(W.rankBoss(A) === want, k + ' (' + (A.rank != null ? 'rank ' + A.rank : A.why) + ') ' + (want ? 'can' : "can't")); }
ok(W.rankBoss({ why: 'lead' }) && W.rankBoss({ why: 'admin' }), 'the lead and the site admin can');
{ const A = await W.teamAccess(env, url, { ...team, ranks: { ...team.ranks, acc: { 0: 'none', 1: 'none' } } }, who.off); ok(W.rankBoss(A), 'rank 1 still can when its own access is set to None (like rank 0 before)'); }

console.log('2. The lead, by name and realm');
ok((await W.teamAccess(env, url, team, who.lead)).why === 'lead', 'Leadchar-illidan is the lead');
ok(!(await W.leadByChar(env, url, team, who.twin)), 'Leadchar-stormrage (same name, other realm) is not');
const old = { ...team, owner: { uid: 'w:1', char: 'Leadchar' } };
ok(await W.leadByChar(env, url, old, who.lead), 'old team (no realm, guild ranks set): Leadchar in the guild is the lead');
ok(!(await W.leadByChar(env, url, old, who.twin)), 'old team: the same-named character outside the guild is not');
ok(W.ownerRealm(old, people.lead) === 'illidan', 'the realm is filled in from the lead\'s own character');
ok(!(await W.leadByChar(env, url, { ...team, owner: { ...team.owner, uid: 'b:someoneelse' } }, who.lead)), 'once the plan has moved to a Battle.net account, only that account leads (no character match)');
ok((await W.teamAccess(env, url, { ...team, owner: { ...team.owner, uid: 'b:lead' } }, who.lead)).why === 'lead', '... and that account is still the lead');

console.log('3. Setting up a guild\'s team (guild:N)');
// (Warcraft Logs guild 555 = Testguild: the id the Worker keeps at the edge)
C.set('https://debrief.cache/wcl-guild/us/zuljin/testguild', '555'); C.set('https://debrief.cache/wcl-guild/us/zuljin/otherguild', '777');
for (const [k, want] of [['gm', ''], ['off', ''], ['raid', 'no'], ['out', 'no']]) { const r = await W.teamClaim(env, url, 'guild:555', who[k]); ok(!!r === !!want, k + ': ' + (r || 'may set it up')); }
ok((await W.teamClaim(env, url, 'team:9', who.out)) !== '', 'a Warcraft Logs team page can\'t be claimed by just anyone any more (Nov 9: same rule as a guild\'s; tests/team-setup.mjs section 12 has the rest)');
ok((await W.teamClaim(env, url, 'guild:555', { uid: 'w:9', name: 'x' })) !== '', 'no Battle.net sign-in: can\'t');

// ---- Wolfthorn, from copies of the real records (dry run)
const [tf, lf] = process.argv.slice(2);
if (tf && lf) { console.log('4. Dry run: Wolfthorn (copies of the real records)');
  const t = JSON.parse(fs.readFileSync(tf, 'utf8')), d = t.doc || t, L = JSON.parse(fs.readFileSync(lf, 'utf8'));
  store.set('bnet/b-flex.json', JSON.stringify(L)); const flex = { uid: 'b:flex', ids: ['b:flex'], bid: 'flex', name: 'Flëxørçïst' };
  console.log('     owner saved: ' + JSON.stringify(d.owner) + ', guild ' + JSON.stringify(d.ranks && d.ranks.guild));
  ok(await W.leadByChar(env, url, d, flex), 'Flex\'s Battle.net account (with Trëèflêx-illidan in Adequate) is the lead');
  const rl = W.ownerRealm(d, L.chars); ok(rl === 'illidan', 'the realm the first open fills in: ' + rl);
  const d2 = { ...d, owner: { ...d.owner, uid: 'b:flex', realm: rl } }; ok((await W.teamAccess(env, url, d2, flex)).why === 'lead', 'after that, Flex is still the lead');
  const twin = { uid: 'b:twin', ids: ['b:twin'], bid: 'twin', name: 'Trëèflêx' }; link('b:twin', [ch('Trëèflêx', 'stormrage', 'Adequate', 'stormrage')]);
  ok(!(await W.leadByChar(env, url, d, twin)) && !(await W.leadByChar(env, url, d2, twin)), 'a Trëèflêx on another realm is not the lead, before or after');
  ok(JSON.stringify(d.ranks.acc) === JSON.stringify((JSON.parse(fs.readFileSync(tf, 'utf8')).doc || {}).ranks?.acc || d.ranks.acc), 'Wolfthorn\'s rank picks are untouched'); }
console.log(bad ? bad + ' failed' : 'all passed'); process.exit(bad ? 1 : 0);
