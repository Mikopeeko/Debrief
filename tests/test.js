const E=require('./engine.js'); const fs=require('fs');
(async()=>{
 const buf=fs.readFileSync('test.log'); let pos=0; const CH=777;
 const ix=await E.indexChunks(async()=>{ if(pos>=buf.length) return {done:true}; const v=new Uint8Array(buf.subarray(pos,pos+CH)); pos+=CH; return {done:false,value:v}; }, buf.length);
 console.log('bosses',ix.bosses.map(b=>[b.boss,b.diff,b.pull,b.result,b.duration,b.startByte,b.endByte]));
 console.log('runs',ix.runs.map(r=>[r.zone,r.level,r.result,r.duration,r.bosses.length]));
 const b=ix.bosses[0]; const text=buf.subarray(b.startByte,b.endByte).toString('utf8');
 console.log('first line:',text.split('\n')[0].slice(0,60));
 const r=E.analyze(b,text,{});
 for(const p of r.players.values()) console.log(p.name,p.specName,p.role,'dmg',p.damage,'heal',p.healing,'oh',p.overheal,'abs',p.absorbs,'taken',p.taken,'avoid',p.avoidable,'cons',JSON.stringify(p.cons),'defs',p.defs.map(d=>d.name+':'+d.uses.length+'/'+d.possible).join(' '),p.survVerdict);
 console.log('deaths',r.deaths.map(d=>[d.player,d.killer,d.ability,d.available]));
 console.log('mistakes');for(const m of r.mistakes) console.log(' ',E.fmtT(m.t),m.player,m.mechanic,m.severity,'|',m.detail);
 console.log('insights',r.insights.map(i=>i.text));
 console.log('bossPct',r.bossPct,'interrupts',r.interrupts.length);
 for(const p of r.players.values()) console.log(p.name, E.checklist(p,r).map(c=>c.check+':'+c.status).join(', '));
 const run=ix.runs[0]; const rt=buf.subarray(run.startByte,run.endByte).toString('utf8');
 const rr=E.analyze(run,rt,{}); console.log('run players',[...rr.players.values()].map(p=>p.name+' '+p.damage));
})();
