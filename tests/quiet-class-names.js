// Debriefing: class-coloured names, and the Raid checks column kept to single pulls (quiet-bug hunt, Nov 15, overnight).
// The bug: two of src/shell.html's small scripts read the page through window.__wla, which src/ui.js only makes on localhost and on
// practice links (hostnames like *-debrief.*). On debriefme.io it doesn't exist, so:
//   - round 423 (commit fe3f9e56, Oct 31: every player's name in the page's sentences in their class colour) returned on its first line,
//     and names were never class-coloured on the real site while every practice link showed them coloured;
//   - round 236's "single pulls only" guard (commit 72f14261, Oct 29, the user: "keep the all pulls page as is") never saw the All pulls
//     scope, so the Raid checks column also showed on All pulls with one pull picked (seen live on Nov 12's Ula'tek pull 13).
// Found in the overnight hunt for code that quietly did nothing on the live host. Both now read the page through window.dbtMapKit(),
// which every host has. This check:
//   (a) finds no inline script in src/shell.html that reads window.__wla (the window.__wlaUp reload flag is a different thing);
//   (b) runs shell.html's own r423run on a stand-in page as debriefme.io sees it (no window.__wla, only window.dbtMapKit) and expects
//       the names in a sentence to come back as class-coloured spans;
//   (c) runs round 236's own guard with the scope 'all' and expects it to stop (and to go on for a single pull).
// tests/quiet-bugs.js runs it on every build.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

// (per character of a script: 0 code, 1 string / template / regex, 2 comment)
function lex(s) {
  const k = new Uint8Array(s.length); let prev = '';
  const isRe = () => /[(,=:[!&|?{};+\-*%<>~^]$/.test(prev) || /\b(return|typeof|case|in|of|void|delete|throw|new)$/.test(prev) || prev === '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1], a = i;
    if (c === '/' && n === '/') { let j = s.indexOf('\n', i); if (j < 0) j = s.length; k.fill(2, a, j); i = j - 1; continue; }
    if (c === '/' && n === '*') { let j = s.indexOf('*/', i + 2); j = j < 0 ? s.length : j + 2; k.fill(2, a, j); i = j - 1; continue; }
    if (c === '"' || c === "'") { for (i++; i < s.length && s[i] !== c && s[i] !== '\n'; i++) if (s[i] === '\\') i++; k.fill(1, a, i + 1); prev = 'x'; continue; }
    if (c === '`') { let d = 0; for (i++; i < s.length; i++) { if (s[i] === '\\') { i++; continue; } if (!d && s[i] === '`') break; if (s[i] === '$' && s[i + 1] === '{') { d++; i++; continue; } if (d && s[i] === '}') d--; } k.fill(1, a, i + 1); prev = 'x'; continue; }
    if (c === '/' && isRe()) { let cls = false; for (i++; i < s.length && s[i] !== '\n'; i++) { if (s[i] === '\\') { i++; continue; } if (s[i] === '[') cls = true; else if (s[i] === ']') cls = false; else if (s[i] === '/' && !cls) break; } while (/[a-z]/i.test(s[i + 1] || '')) i++; k.fill(1, a, i + 1); prev = 'x'; continue; }
    if (!/\s/.test(c)) prev = /[\w$]/.test(c) ? (/[\w$]/.test(prev.slice(-1)) ? prev + c : c) : c;
  }
  return k;
}
// (the matching close of the bracket at i, counting only code)
function closeOf(s, k, i) { let d = 0; for (let j = i; j < s.length; j++) { if (k[j]) continue; if ('([{'.includes(s[j])) d++; else if (')]}'.includes(s[j]) && --d === 0) return j; } return -1; }

module.exports = function quietClassNames(say, H) {
  const bad = (kind, m) => say('Debriefing', kind, m);
  let SH; try { SH = fs.readFileSync(path.join(__dirname, '..', 'src', 'shell.html'), 'utf8'); } catch (e) { bad('class-coloured names', 'could not read src/shell.html'); return; }
  let grab; try { grab = (H && H.grab) || require(path.join(__dirname, 'site-helpers.js')).grab; } catch (e) { bad('class-coloured names', 'could not load tests/site-helpers.js: ' + e.message); return; }

  // (a) no inline script reads window.__wla (practice links and localhost only); window.__wlaUp is the reload flag, not the page
  const hits = [], tag = /<script\b[^>]*>([\s\S]*?)<\/script>/gi; let m;
  while ((m = tag.exec(SH))) {
    const js = m[1], at = m.index + m[0].indexOf(js), k = lex(js), re = /__wla(?![\w$])/g; let h;
    while ((h = re.exec(js))) if (k[h.index] !== 2) hits.push(SH.slice(0, at + h.index).split('\n').length);
  }
  if (hits.length) bad('class-coloured names', 'src/shell.html reads window.__wla on line ' + [...new Set(hits)].join(', ') + '. Only practice links have it, so this does nothing on debriefme.io. Read the page through window.dbtMapKit() instead.');

  // (b) round 423 on debriefme.io: names in a sentence come back in their class colours
  let src423; try { src423 = grab('R423', SH) + '\n' + grab('r423run', SH); } catch (e) { bad('class-coloured names', 'could not find round 423 (R423, r423run) in src/shell.html: ' + e.message); }
  if (src423) {
    const made = [], text = (v) => ({ nodeType: 3, nodeValue: v, parentElement: { closest: () => null, style: {} }, parentNode: { replaceChild(fr) { made.push(...fr.kids); } } });
    const nodes = [text('Jangokin stood in the pool at 1:23, and Flëxørçïst dispelled him.'), text('Nobody named here.')];
    const document = {
      getElementById: (id) => (id === 'view' ? { id } : null),
      createTreeWalker(root, what, f) { const L = nodes.filter((x) => f.acceptNode(x) === 1); let i = -1; return { nextNode: () => L[++i] || null }; },
      createDocumentFragment: () => ({ kids: [], appendChild(c) { this.kids.push(c); } }),
      createElement: (t) => ({ tagName: t, style: {}, className: '', textContent: '' }),
      createTextNode: (v) => ({ nodeType: 3, nodeValue: v }),
    };
    const players = new Map([['Player-1', { name: 'Jangokin-Wolfthorn', color: '#c41e3a' }], ['Player-2', { name: 'Flëxørçïst-Wolfthorn', color: '#f48cba' }]]);
    const S = { rep: { item: { id: 'r1', pull: 3 }, players } };
    const window = { location: { hostname: 'debriefme.io' }, dbtMapKit: () => ({ S }) }; /* (no window.__wla: the live site) */
    let ran = true; try { vm.runInNewContext(src423 + '\nr423run();', { window, document, location: window.location, NodeFilter: { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 } }, { timeout: 2000 }); } catch (e) { ran = false; bad('class-coloured names', 'round 423 crashed: ' + e.message); }
    const got = made.filter((x) => x && x.className === 'r423').map((x) => x.textContent + ' ' + x.style.color).sort().join(', ');
    if (ran && got !== 'Flëxørçïst #f48cba, Jangokin #c41e3a') bad('class-coloured names', 'On debriefme.io, Jangokin and Flëxørçïst in a Debriefing sentence aren\'t in their class colours (got: ' + (got || 'none') + '). Round 423 has to read the report through window.dbtMapKit().');
  }

  // (c) round 236's guard on debriefme.io: stops on All pulls, goes on for a single pull
  const i236 = SH.indexOf('/* round 236 raid checks */'), a = i236 < 0 ? -1 : SH.indexOf('var add = ', i236);
  let guard = null;
  if (a > 0 && a - i236 < 400) {
    const s = SH.slice(a, a + 6000), k = lex(s); let e = -1, d = 0;
    for (let j = 0; j < s.length; j++) { if (k[j]) continue; if ('([{'.includes(s[j])) d++; else if (')]}'.includes(s[j])) d--; else if (s[j] === ';' && !d) { e = j; break; } }
    const f = e < 0 ? -1 : s.indexOf('if (', e), g = f < 0 ? -1 : closeOf(s, k, f + 3);
    if (e > 0 && f > 0 && g > 0 && /^\s*$/.test(s.slice(e + 1, f)) && /^\s*return;/.test(s.slice(g + 1))) guard = { add: s.slice(10, e), cond: s.slice(f + 4, g) };
  }
  if (!guard) { bad('Raid checks on All pulls', 'could not find round 236\'s guard ("var add = ...; if (...) return;") in src/shell.html'); return; }
  const stops = (scope) => {
    const window = { location: { hostname: 'debriefme.io' }, dbtMapKit: () => ({ S: { scope } }) }; /* (no window.__wla: the live site) */
    const document = { querySelector: (q) => (/dbt-add/.test(q) ? {} : null) }; /* (the timeline's "It added up with" box, no night coach box) */
    return vm.runInNewContext('(function () { var add = ' + guard.add + '; return !!(' + guard.cond + '); })()', { window, document, location: window.location }, { timeout: 2000 });
  };
  let all, one; try { all = stops('all'); one = stops('pull'); } catch (e) { bad('Raid checks on All pulls', 'round 236\'s guard crashed: ' + e.message); return; }
  if (!all) bad('Raid checks on All pulls', 'On debriefme.io, All pulls still gets the Raid checks column. Round 236 has to read the scope through window.dbtMapKit(), not window.__wla.');
  if (one) bad('Raid checks on All pulls', 'Round 236 now stops on a single pull too, so the Raid checks column is gone from the single pull page.');
};
if (require.main === module) { const P = []; module.exports((a, b, c) => P.push(a + ' [' + b + '] ' + c), (() => { try { return require('./site-helpers.js'); } catch (e) { return null; } })()); console.log(P.length ? P.join('\n') : 'quiet-class-names: pass'); process.exitCode = P.length ? 1 : 0; }
