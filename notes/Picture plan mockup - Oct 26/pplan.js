// TEST ONLY (the picture-plan mockup's practice link, never in main): hand the guide's map pieces to the mockup page, only on ?pictureplan.
// PPV=1 also puts the mockup page itself inside (for a practice link, where extra scripts can't be added to the page)
const fs = require('fs'), path = require('path'), dir = process.argv[2];
const f = path.join(dir, 'guides.js'); let s = fs.readFileSync(f, 'utf8'); if (s.includes('\r')) throw new Error('CR');
if (!s.endsWith('\ngdzUnlock();\n')) throw new Error('end anchor');
s += 'if (/[?&]pictureplan\\b/.test(location.search + (((performance.getEntriesByType && performance.getEntriesByType(\'navigation\')[0]) || {}).name || \'\'))) window.__ppK = { GDZ_CA_M, GDZ_CA_AXES, GDZ_RAID, miniMap, E, esc, NDZ_SPECIC, gdzKit };\n';
if (process.env.PPV) s += fs.readFileSync(path.join(__dirname, 'pplan_view.js'), 'utf8').replace(/\r/g, '');
fs.writeFileSync(f, s); console.log('pplan ok');
