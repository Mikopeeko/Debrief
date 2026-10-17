const E=require('./engine.js'); const W=require('./wcl.js');
const actors=new Map([[1,{id:1,name:'Aria',type:'Player',subType:'Paladin',server:'Realm'}],[2,{id:2,name:'Kesh',type:'Player',subType:'Mage',server:'Realm'}],
 [3,{id:3,name:'Tyr',type:'Player',subType:'Paladin',server:'Realm'}],[10,{id:10,name:"Zul'jan",type:'NPC',subType:'Boss',gameID:500000}],
 [11,{id:11,name:'Spiteful Soulcoiler',type:'NPC',subType:'NPC',gameID:500009}],[20,{id:20,name:'Water Elemental',type:'Pet',petOwner:2,gameID:78116}]]);
const abilities=new Map([[1,{gameID:1,name:'Melee',type:1}],[116,{gameID:116,name:'Frostbolt',type:16}],[20473,{gameID:20473,name:'Holy Shock',type:2}],
 [1299680,{gameID:1299680,name:'Sever',type:1}],[1286399,{gameID:1286399,name:'Wail of Terror',type:32}],[96231,{gameID:96231,name:'Rebuke',type:1}],[31850,{gameID:31850,name:'Ardent Defender',type:2}],[1310882,{gameID:1310882,name:'Gloombomb',type:32}]]);
const item={kind:'boss',id:3600,boss:'The Coiled Altar',diffId:16,diff:'Mythic',size:20,startMs:W.BASE+1000,kill:false,result:'Wipe',duration:60,pull:1,run:null,
 wcl:{code:'abc',fight:1,start:1000,end:61000,actors,abilities,encounterID:3600,rawDiff:16}};
const ev=[
 {timestamp:1001,type:'combatantinfo',sourceID:1,specID:65},{timestamp:1001,type:'combatantinfo',sourceID:2,specID:64},{timestamp:1001,type:'combatantinfo',sourceID:3,specID:66},
 {timestamp:2000,type:'damage',sourceID:2,targetID:10,abilityGameID:116,hitType:2,amount:100000,absorbed:0,resourceActor:2,hitPoints:900000000,maxHitPoints:1000000000,x:100000,y:-50000},
 {timestamp:2500,type:'damage',sourceID:20,targetID:10,abilityGameID:1,hitType:1,amount:20000,resourceActor:1,hitPoints:100,maxHitPoints:100,x:100100,y:-50000},
 {timestamp:3000,type:'cast',sourceID:1,targetID:2,abilityGameID:20473,resourceActor:1,hitPoints:100,maxHitPoints:100,x:100500,y:-49800},
 {timestamp:3100,type:'heal',sourceID:1,targetID:2,abilityGameID:20473,amount:30000,overheal:10000,hitType:1},
 {timestamp:5000,type:'damage',sourceID:10,targetID:2,abilityGameID:1299680,amount:700000,resourceActor:2,hitPoints:300000,maxHitPoints:1000000,x:100200,y:-50100},
 {timestamp:6000,type:'absorbed',sourceID:3,targetID:3,attackerID:10,abilityGameID:31850,extraAbilityGameID:1,amount:5000},
 {timestamp:10000,type:'begincast',sourceID:11,sourceInstance:2,targetID:-1,abilityGameID:1286399,sourceMarker:8},
 {timestamp:10500,type:'interrupt',sourceID:3,targetID:11,targetInstance:2,targetMarker:8,abilityGameID:96231,extraAbilityGameID:1286399},
 {timestamp:20000,type:'cast',sourceID:11,sourceInstance:2,targetID:-1,abilityGameID:1286399,sourceMarker:8,resourceActor:1,hitPoints:50,maxHitPoints:100,x:101000,y:-50500},
 {timestamp:21000,type:'applydebuff',sourceID:10,targetID:1,abilityGameID:1310882},
 {timestamp:30000,type:'death',sourceID:10,targetID:2},
];
const text=W.translate(item,ev);
console.log(text.split('\n').slice(0,6).join('\n'));
const r=E.analyze(item,text,{});
for(const p of r.players.values()) console.log(p.name,p.specName,'dmg',p.damage,'heal',p.healing,'oh',p.overheal,'abs',p.absorbs,'taken',p.taken,'kicks',p.interrupts);
console.log('deaths',r.deaths.map(d=>[d.player,d.killer,d.ability]));
console.log('mistakes',r.mistakes.map(m=>[m.player,m.mechanic,m.detail]));
console.log('kicks',r.kicks.map(k=>[k.name,k.kicked,k.missed]), 'marker of missed:', (r.missedKicks||[]).map(m=>[m.label,m.marker]));
console.log('bossPct',r.bossPct,'positions',r.positions.size, 'module', r.module && r.module.title);
