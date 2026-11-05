// The site's own small helpers, taken out of src/ui.js by name and run in Node, so a test reads exactly what the page shows
// (used by contradictions.js and wipecheck-stories.js). site(['pullPct', 'pullShort']) -> { pullPct, pullShort, CACHE }; extra: more of the page's globals (stand-ins)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src');
const E = require(path.join(SRC, 'engine.js'));
const UI0 = fs.readFileSync(path.join(SRC, 'ui.js'), 'utf8'), UI = UI0, SH = fs.readFileSync(path.join(SRC, 'shell.html'), 'utf8');
// (one declaration, from its keyword to its end: strings, template literals, comments and regex literals are skipped over)
function grab(name, src) {
  const UI = src || UI0; /* (src/ui.js, or another file's text: shell.html's small scripts) */
  const m = new RegExp('(?:^|\\n)([ \\t]*(?:\\/\\*[^\\n]*?\\*\\/\\s*)*)(const|let|var|function)\\s+' + name.replace(/\$/g, '\\$') + '\\b').exec(UI);
  if (!m) throw new Error('ui.js has no ' + name);
  const start = m.index + m[0].length - (m[2].length + 1 + name.length), fn = m[2] === 'function';
  let i = start, depth = 0, prev = '', seenBody = false;
  const isRe = () => /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|in|of)$/.test(prev) || prev === '';
  for (; i < UI.length; i++) {
    const c = UI[i], n = UI[i + 1];
    if (c === '/' && n === '/') { i = UI.indexOf('\n', i); if (i < 0) i = UI.length; continue; }
    if (c === '/' && n === '*') { i = UI.indexOf('*/', i + 2) + 1; continue; }
    if (c === '"' || c === "'") { for (i++; i < UI.length && UI[i] !== c; i++) if (UI[i] === '\\') i++; prev = 'x'; continue; }
    if (c === '`') { let d = 0; for (i++; i < UI.length; i++) { if (UI[i] === '\\') { i++; continue; } if (!d && UI[i] === '`') break; if (UI[i] === '$' && UI[i + 1] === '{') { d++; i++; continue; } if (d && UI[i] === '}') d--; } prev = 'x'; continue; }
    if (c === '/' && isRe()) { let cls = false; for (i++; i < UI.length; i++) { if (UI[i] === '\\') { i++; continue; } if (UI[i] === '[') cls = true; else if (UI[i] === ']') cls = false; else if (UI[i] === '/' && !cls) break; } while (/[a-z]/i.test(UI[i + 1])) i++; prev = 'x'; continue; }
    if ('([{'.includes(c)) { depth++; if (c === '{') seenBody = true; }
    else if (')]}'.includes(c)) { depth--; if (fn && c === '}' && depth === 0 && seenBody) return UI.slice(start, i + 1); }
    else if (c === ';' && depth === 0 && !fn) return UI.slice(start, i + 1);
    if (!/\s/.test(c)) prev = /[\w$]/.test(c) ? (/[\w$]/.test(prev.slice(-1)) ? prev + c : c) : c;
  }
  throw new Error('could not read ' + name + ' out of ui.js');
}
function site(names, extra) {
  const code = names.map((n) => grab(n)).join('\n') + '\n({ ' + names.join(', ') + ' })';
  const ctx = vm.createContext({ E, C: E.compact, T: E.fmtT, CACHE: new Map(), S: { index: { bosses: [] } }, window: {}, ...(extra || {}) });
  const o = vm.runInContext(code, ctx); o.CACHE = ctx.CACHE; return o;
}
// (a Warcraft Logs report's boss pulls as wcl.js makes them: each boss and difficulty's pulls numbered in order of the night)
function pullItems(code, r, W) {
  const cnt = {}, items = new Map(), actors = new Map(r.masterData.actors.map((a) => [a.id, a])), abilities = new Map(r.masterData.abilities.map((a) => [a.gameID, a]));
  for (const f0 of r.fights.filter((x) => x.encounterID > 0 && !x.keystoneLevel && !(x.size > 0 && x.size <= 5))) {
    const diffId = W.WCL_DIFF[f0.difficulty] || f0.difficulty, k = f0.encounterID + ':' + diffId; cnt[k] = (cnt[k] || 0) + 1;
    items.set(f0.id, { kind: 'boss', id: f0.encounterID, boss: f0.name, diffId, diff: { 14: 'Normal', 15: 'Heroic', 16: 'Mythic' }[diffId] || 'Difficulty ' + diffId, size: f0.size || 20, startMs: W.BASE + f0.startTime,
      kill: !!f0.kill, endPct: f0.kill ? 0 : f0.fightPercentage != null ? f0.fightPercentage : null, result: f0.kill ? 'Kill' : 'Wipe', duration: (f0.endTime - f0.startTime) / 1000,
      endPhase: f0.kill || !f0.lastPhase ? null : f0.lastPhaseIsIntermission ? 'Intermission' : 'P' + f0.lastPhase, endBoss: f0.kill ? 0 : f0.bossPercentage != null ? f0.bossPercentage : null,
      pull: cnt[k], run: null, wallMs: r.startTime + f0.startTime, wcl: { code, fight: f0.id, start: f0.startTime, end: f0.endTime, actors, abilities, encounterID: f0.encounterID, rawDiff: diffId } });
  }
  return items;
}
module.exports = { grab, site, pullItems, UI, SH, E };
