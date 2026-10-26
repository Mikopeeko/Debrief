// node ppzip_test.js : the picture plan's zip writer makes a zip the system can read
const fs = require('fs'), src = fs.readFileSync('pp_mod.js', 'utf8');
const a = src.indexOf('const PP_CRC'), b = src.indexOf('\n}\n', src.indexOf('function ppZip')) + 2;
const ppZip = new Function(src.slice(a, b) + '\nreturn ppZip;')();
(async () => { const z = ppZip([{ name: '01 Toxic Deluge (Purples).png', data: new Uint8Array([1, 2, 3, 4, 5]) }, { name: '02 Guillotine 1 · Flëxørçïst.png', data: new TextEncoder().encode('hello zip') }]);
  fs.writeFileSync('pptest.zip', Buffer.from(await z.arrayBuffer())); console.log('wrote', z.size); })();
