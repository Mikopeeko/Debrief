import random
random.seed(4)
def ts(s): return f"10/14/2026 21:{int(s//60):02d}:{s%60:06.3f}-4  "
def unit(g,n,fl="0x512",rf="0x0"): return f'{g},"{n}",{fl},{rf}'
def adv(info,hp,mx,x=0,y=0): return f"{info},0000000000000000,{hp},{mx},1000,1000,500,0,0,0,0,100,100,0,{x},{y},2000,0.5,290"
P=[("Tankone",73),("Tanktwo",66),("Healy",65),("Mendy",264),("Fixer",257),("Leafy",105),("Glow",1468)]+[(f"Dps{i}",[72,64,62,254,259,265,577,262,251,103,1467,253,71][i]) for i in range(13)]
G={n:f"Player-1-{i:03d}" for i,(n,_) in enumerate(P)}
Z="Creature-0-1-2-3-500000-0001"; ZN="Zul'jan"; MZ="Creature-0-1-2-3-500001-0002"; MN="Hex Lord Malacrass"
L=[]; add=lambda t,s: L.append(ts(t)+s)
add(0,'ENCOUNTER_START,3600,"The Coiled Altar",16,20,2900')
for n,s in P: add(0.01,"COMBATANT_INFO,"+G[n]+","+",".join(["1"]*23)+f",{s},[(1,2,1)],(0,0,0),[],[]")
def cast(t,src,sn,sid,name,ev="SPELL_CAST_SUCCESS"): add(t,f"{ev},{unit(src,sn,'0xa48')},0000000000000000,nil,0x80000000,0x80000000,{sid},\"{name}\",0x8,{adv(src,1,1)}")
def dmg(t,src,sn,p,sid,name,amt): add(t,f"SPELL_DAMAGE,{unit(src,sn,'0xa48')},{unit(G[p],p+'-Realm')},{sid},\"{name}\",0x8,{adv(G[p],500000,1000000)},{amt},{amt},-1,8,0,0,0,nil,nil,nil,AOE")
def aura(t,p,sid,name,ev="SPELL_AURA_APPLIED",stacks=None,src=Z,sn=ZN):
    add(t,f"{ev},{unit(src,sn,'0xa48')},{unit(G[p],p+'-Realm')},{sid},\"{name}\",0x8,DEBUFF"+(f",{stacks}" if stacks is not None else ""))
for t in range(1,200,2):
    for n,_ in P: add(t+0.1,f"SPELL_DAMAGE,{unit(G[n],n+'-Realm')},{unit(Z,ZN,'0xa48')},1,\"Hit\",0x1,{adv(Z,int(1e9*(1-t/400)),1000000000)},40000,40000,-1,1,0,0,0,nil,nil,nil,ST")
# P1
cast(10,Z,ZN,1299960,"Toxic Deluge"); cast(70,Z,ZN,1299960,"Toxic Deluge")
aura(15,"Dps3",1310498,"Mutagenic Venom"); dmg(16,Z,ZN,"Dps3",1310498,"Mutagenic Venom",80000); dmg(17,Z,ZN,"Dps5",1310498,"Mutagenic Venom",90000); aura(20,"Dps3",1310498,"Mutagenic Venom","SPELL_AURA_REMOVED")
aura(40,"Dps8",1310498,"Mutagenic Venom"); aura(45,"Dps8",1310498,"Mutagenic Venom","SPELL_AURA_REMOVED")
for n,_ in P[:10]:
    aura(22,n,1299838,"Venom Rupture"); aura(24,n,1299838,"Venom Rupture","SPELL_AURA_APPLIED_DOSE",2)
    aura(25.2,n,1299838,"Venom Rupture","SPELL_AURA_APPLIED_DOSE",12)
for n,_ in P[10:]: aura(22,n,1299838,"Venom Rupture"); aura(60,n,1299838,"Venom Rupture","SPELL_AURA_APPLIED_DOSE",5)
cast(30,Z,ZN,1299680,"Sever"); dmg(30.5,Z,ZN,"Tankone",1299680,"Sever",900000); dmg(30.5,Z,ZN,"Dps1",1299680,"Sever",700000)
cast(40,Z,ZN,1283489,"Guillotine")
for n in ["Dps0","Dps2","Dps4","Tanktwo"]: dmg(42,Z,ZN,n,1283489,"Guillotine",300000)
add(42.5,f"UNIT_DIED,0000000000000000,nil,0x80000000,0x80000000,{unit(G['Dps2'],'Dps2-Realm')},0")
for n,_ in P[:12]: dmg(71,Z,ZN,n,1310544,"Virulent Mutation",400000)
cast(90,Z,ZN,1282487,"Fangs of the Coiled Altar")
# P2
cast(100,MZ,MN,1285643,"Dreadmarch"); cast(105,MZ,MN,1286441,"Spiritcackle")
A1="Creature-0-1-2-3-500009-0011"; A2="Creature-0-1-2-3-500009-0012"; AN="Spiteful Soulcoiler"
for t in range(106,140,3):
    for g in (A1,A2):
        if g==A1 and t>130: continue
        cast(t,g,AN,7,"Shadow Lash")
add(130,f"UNIT_DIED,0000000000000000,nil,0x80000000,0x80000000,{unit(A1,AN,'0xa48')},0")
cast(112,A2,AN,1286399,"Wail of Terror"); add(113,f"SPELL_INTERRUPT,{unit(G['Tanktwo'],'Tanktwo-Realm')},{unit(A1,AN,'0xa48')},96231,\"Rebuke\",0x1,1286399,\"Wail of Terror\",0x20")
aura(110,"Dps6",1310882,"Gloombomb"); aura(110,"Dps7",1310882,"Gloombomb")
for n in ["Dps6","Dps7","Dps9"]: dmg(113,MZ,MN,n,1310882,"Gloombomb",500000)
dmg(120,MZ,MN,"Dps10",1310732,"Malevolent Resonance",300000); dmg(120.2,MZ,MN,"Dps11",1310732,"Malevolent Resonance",300000)
cast(125,MZ,MN,1286620,"Soul Sever"); dmg(125.5,MZ,MN,"Tanktwo",1286620,"Soul Sever",800000); dmg(125.5,MZ,MN,"Fixer",1286620,"Soul Sever",600000)
cast(140,MZ,MN,1285643,"Dreadmarch")
# intermission
cast(150,MZ,MN,1304032,"Soulbinding")
for k in range(1,7): aura(150+k,"Dps12",1287722,"Spirit Erasure","SPELL_AURA_APPLIED" if k==1 else "SPELL_AURA_APPLIED_DOSE", None if k==1 else k, src=MZ, sn=MN)
for k in range(1,4): aura(152+k,"Dps4",1287722,"Spirit Erasure","SPELL_AURA_APPLIED" if k==1 else "SPELL_AURA_APPLIED_DOSE", None if k==1 else k, src=MZ, sn=MN)
F="Creature-0-1-2-3-500010-0099"
add(160,f"SPELL_HEAL,{unit(F,'Fragment of Malacrass','0xa48')},{unit(Z,ZN,'0xa48')},1287718,\"Reclaim Essence\",0x20,{adv(Z,1,1)},0,100000000,100000000,0,0,nil")
# P3
cast(180,Z,ZN,1299267,"Grim Guillotine")
for n in ["Dps0","Dps1","Dps3","Dps5","Tankone","Tanktwo"]: dmg(182,Z,ZN,n,1299267,"Grim Guillotine",250000)
aura(185,"Dps1",0,"Venomfang"); aura(192,"Dps1",0,"Venomfang","SPELL_AURA_REMOVED")
aura(186,"Dps3",0,"Venomfang"); add(187,f"SPELL_DISPEL,{unit(G['Healy'],'Healy-Realm')},{unit(G['Dps3'],'Dps3-Realm')},4987,\"Cleanse\",0x2,0,\"Venomfang\",0x8,DEBUFF"); aura(187,"Dps3",0,"Venomfang","SPELL_AURA_REMOVED")

import math
for t in range(1,200,2):
    for i,(n,_) in enumerate(P):
        a=i/len(P)*6.28; x=1000+18*math.cos(a+t/50); y=-500+18*math.sin(a+t/50)
        add(t+0.3,f"SPELL_CAST_SUCCESS,{unit(G[n],n+'-Realm')},0000000000000000,nil,0x80000000,0x80000000,1,\"Hit\",0x1,{G[n]},0000000000000000,100,100,1000,1000,500,0,0,0,0,100,100,0,{x:.2f},{y:.2f},2000,0.5,290")
add(98,f"SPELL_DAMAGE,{unit(G['Dps0'],'Dps0-Realm')},{unit(Z,ZN,'0xa48')},1,\"Hit\",0x1,{adv(Z,0,1000000000)},40000,40000,-1,1,0,0,0,nil,nil,nil,ST")
add(149,f"SPELL_DAMAGE,{unit(G['Dps0'],'Dps0-Realm')},{unit(MZ,MN,'0xa48')},1,\"Hit\",0x1,{adv(MZ,0,1000000000)},40000,40000,-1,1,0,0,0,nil,nil,nil,ST")
add(97,f"SPELL_CAST_SUCCESS,{unit(G['Dps6'],'Dps6-Realm')},0000000000000000,nil,0x80000000,0x80000000,196718,\"Darkness\",0x20,{adv(G['Dps6'],1,1)}")
add(153,f"SPELL_CAST_SUCCESS,{unit(G['Mendy'],'Mendy-Realm')},0000000000000000,nil,0x80000000,0x80000000,2825,\"Bloodlust\",0x8,{adv(G['Mendy'],1,1)}")
cast(55,Z,ZN,1299680,"Sever")
for n,_ in P[:10]: aura(57,n,1299838,"Venom Rupture","SPELL_AURA_APPLIED_DOSE",17)
aura(38,"Dps4",1283489,"Guillotine")
add(39,f"SPELL_AURA_APPLIED,{unit(G['Healy'],'Healy-Realm')},{unit(G['Dps4'],'Dps4-Realm')},1022,\"Blessing of Protection\",0x2,BUFF")
add(45,f"SPELL_AURA_REMOVED,{unit(G['Healy'],'Healy-Realm')},{unit(G['Dps4'],'Dps4-Realm')},1022,\"Blessing of Protection\",0x2,BUFF")
add(106,f"SPELL_AURA_APPLIED,{unit(A1,AN,'0xa48')},{unit(A1,AN,'0xa48')},1309105,\"Spirit Shield\",0x20,BUFF")
add(118,f"SPELL_AURA_REMOVED,{unit(A1,AN,'0xa48')},{unit(A1,AN,'0xa48')},1309105,\"Spirit Shield\",0x20,BUFF")
add(107,f"SPELL_INTERRUPT,{unit(G['Tankone'],'Tankone-Realm')},{unit(A1,AN,'0xa48')},6552,\"Pummel\",0x1,1286399,\"Wail of Terror\",0x20")
add(134,f"ENVIRONMENTAL_DAMAGE,0000000000000000,nil,0x80000000,0x80000000,{unit(G['Dps8'],'Dps8-Realm')},{adv(G['Dps8'],0,1000000)},Falling,900000,900000,0,1,0,0,0,nil,nil,nil")
add(134.2,f"UNIT_DIED,0000000000000000,nil,0x80000000,0x80000000,{unit(G['Dps8'],'Dps8-Realm')},0")

add(200,'ENCOUNTER_END,3600,"The Coiled Altar",16,20,0,200000')
L.sort(key=lambda x:x[:23])
open('ca2.log','w',newline='\r\n').write('\n'.join(L)+'\n')
