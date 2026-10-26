// node ppread_test.js : run the picture plan's note reader on the user's real note (engine's parseNote + the reader cut from pp_mod.js)
const fs = require('fs'), E = require('./ckpt_ca/src/engine.js');
const src = fs.readFileSync('pp_mod.js', 'utf8'), a = src.indexOf('function ppReadCA'), b = src.indexOf('\n}\n', a) + 2;
const PP_MKS = ['star', 'circle', 'diamond', 'triangle', 'moon', 'square', 'cross', 'skull'];
const ppReadCA = new Function('PP_MKS', src.slice(a, b) + '\nreturn ppReadCA;')(PP_MKS);
const note = fs.readFileSync(process.argv[2], 'utf8'), J0 = require(process.argv[3]);
const P = new Map(J0.players.map((p) => [p.name.toLowerCase(), { name: p.name, role: p.role }]));
const J = ppReadCA(E.parseNote(note), P);
console.log(JSON.stringify(J, null, 0).replace(/\],"/g, '],\n"'));
