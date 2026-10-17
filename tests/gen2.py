import random
random.seed(7)
def ts(s):
    m=int(s//60); sec=s%60
    return f"10/14/2026 20:{15+m:02d}:{sec:06.3f}-4  "
B="Creature-0-1-2-3-200000-0001"; BN="Nek'zali the Soulcoiler"
def unit(g,n,fl="0x512"): return f'{g},"{n}",{fl},0x0'
def adv(info,hp,mx): return f"{info},0000000000000000,{hp},{mx},1000,1000,500,0,0,0,0,100,100,0,1.0,2.0,2000,0.5,290"
P=[("Aria",65,[(20473,"Holy Shock"),(85673,"Word of Glory"),(85222,"Light of Dawn")],'heal'),
   ("Tovin",264,[(1064,"Chain Heal"),(61295,"Riptide"),(77472,"Healing Wave")],'heal'),
   ("Brannoc",72,[(85288,"Raging Blow"),(23881,"Bloodthirst"),(184367,"Rampage")],'dps'),
   ("Kesh",64,[(199786,"Glacial Spike"),(30455,"Ice Lance"),(116,"Frostbolt")],'dps'),
   ("Vael",70,[(85256,"Templar's Verdict"),(184575,"Blade of Justice"),(20271,"Judgment")],'dps'),
   ("Tarn",254,[(19434,"Aimed Shot"),(257044,"Rapid Fire"),(185358,"Arcane Shot")],'dps'),
   ("Mor",265,[(980,"Agony"),(172,"Corruption"),(316099,"Unstable Affliction")],'dps'),
   ("Sil",259,[(1329,"Mutilate"),(32645,"Envenom"),(703,"Garrote")],'dps'),
   ("Ondra",250,[(206930,"Heart Strike"),(49998,"Death Strike"),(50842,"Blood Boil")],'tank'),
   ("Feyra",1467,[(357208,"Fire Breath"),(356995,"Disintegrate"),(361469,"Living Flame")],'dps')]
G={n:f"Player-1-0{i:02d}" for i,(n,*_ ) in enumerate(P)}
L=[]
def add(t,s): L.append(ts(t)+s)
add(0,f'ENCOUNTER_START,3200,"{BN}",15,20,2900')
for n,spec,ab,role in P:
    add(0.01,"COMBATANT_INFO,"+G[n]+","+",".join(["1"]*23)+f",{spec},[(1,2,1)],(0,0,0),[(1,290,(),(),())],[]")
dur=248; hp=1.0
deaths={"Brannoc":231.0,"Kesh":233.5,"Sil":235.2,"Mor":238.0,"Tarn":226.0}
for step in range(int(dur*2)):
    t=step/2+0.3
    for n,spec,ab,role in P:
        if n in deaths and t>deaths[n]: continue
        a=random.choice(ab); crit=random.random()<0.3
        if role=='heal':
            tgt=random.choice(P)[0]; amt=random.randint(60000,140000)*(2 if crit else 1); oh=int(amt*random.uniform(0.2,0.6))
            add(t,f"SPELL_HEAL,{unit(G[n],n+'-Realm')},{unit(G[tgt],tgt+'-Realm')},{a[0]},\"{a[1]}\",0x2,{adv(G[tgt],800000,1000000)},{amt-oh},{amt},{oh},0,{'1' if crit else 'nil'}")
        else:
            mult={'Kesh':1.15,'Brannoc':1.1,'Vael':1.02,'Feyra':1.05}.get(n,0.9)*(0.4 if role=='tank' else 1)
            amt=int(random.randint(140000,260000)*mult*(2 if crit else 1)); hp=max(0.31,hp-amt/90000000)
            add(t,f"SPELL_DAMAGE,{unit(G[n],n+'-Realm')},{unit(B,BN,'0xa48')},{a[0]},\"{a[1]}\",0x1,{adv(B,int(hp*1e9),1000000000)},{amt},{amt},-1,1,0,0,0,{'1' if crit else 'nil'},nil,nil,ST")
        if random.random()<0.05:
            add(t,f"SPELL_CAST_SUCCESS,{unit(G[n],n+'-Realm')},0000000000000000,nil,0x80000000,0x80000000,{a[0]},\"{a[1]}\",0x1,{adv(G[n],100,100)}")
    if step%6==0:
        for n,*_ in P:
            if n in deaths and t>deaths[n]: continue
            amt=random.randint(30000,70000)*(4 if t>222 else 1)
            add(t,f"SPELL_DAMAGE,{unit(B,BN,'0xa48')},{unit(G[n],n+'-Realm')},1284033,\"Soulcoil Rite\",0x20,{adv(G[n],int(1e6*max(0.05,1-(t-222)/14 if t>222 else 0.8)),1000000)},{amt},{amt},-1,32,0,0,0,nil,nil,nil,AOE")
for n,t in [("Brannoc",64),("Brannoc",130),("Kesh",95),("Sil",97),("Mor",150),("Tarn",151),("Feyra",180)]:
    add(t,f"SPELL_DAMAGE,{unit(B,BN,'0xa48')},{unit(G[n],n+'-Realm')},1294846,\"Anguished Echoes\",0x20,{adv(G[n],700000,1000000)},{random.randint(300000,500000)},500000,-1,32,0,0,0,nil,nil,nil,AOE")
for n,t in [("Sil",120),("Mor",121),("Brannoc",160)]:
    add(t,f"SPELL_DAMAGE,{unit(B,BN,'0xa48')},{unit(G[n],n+'-Realm')},1287198,\"Latent Cultist\",0x20,{adv(G[n],700000,1000000)},{random.randint(150000,250000)},250000,-1,32,0,0,0,nil,nil,nil,AOE")
for n,t in [("Brannoc",141),("Tarn",142)]:
    add(t,f"SPELL_AURA_APPLIED,{unit(B,BN,'0xa48')},{unit(G[n],n+'-Realm')},1294933,\"Slithering Flame\",0x4,DEBUFF")
for k in range(1,10): add(10+k*20,f"SPELL_AURA_APPLIED_DOSE,{unit(B,BN,'0xa48')},{unit(G['Ondra'],'Ondra-Realm')},1284110,\"Hollowing Strikes\",0x20,DEBUFF,{k}")
for n,spell,sid,t in [("Aria","Divine Protection",498,70),("Aria","Divine Protection",498,180),("Ondra","Icebound Fortitude",48792,100),("Ondra","Vampiric Blood",55233,60),("Ondra","Vampiric Blood",55233,160),("Kesh","Ice Block",45438,120),("Tovin","Astral Shift",108271,224),("Feyra","Obsidian Scales",363916,225),("Aria","Avenging Wrath",31884,5),("Aria","Avenging Wrath",31884,140),("Aria","Divine Toll",375576,8),("Aria","Divine Toll",375576,75),("Aria","Divine Toll",375576,200),("Aria","Healthstone",6262,226),("Tovin","Healthstone",6262,227),("Brannoc","Tempered Potion",431932,3),("Kesh","Tempered Potion",431932,3),("Vael","Tempered Potion",431932,3),("Tarn","Algari Healing Potion",431416,224)]:
    add(t,f"SPELL_CAST_SUCCESS,{unit(G[n],n+'-Realm')},0000000000000000,nil,0x80000000,0x80000000,{sid},\"{spell}\",0x1,{adv(G[n],100,100)}")
add(221,f"SPELL_AURA_APPLIED,{unit(B,BN,'0xa48')},{unit(B,BN,'0xa48')},1284034,\"Uncoiled Rage\",0x20,BUFF")
for n,t in sorted(deaths.items(),key=lambda x:x[1]):
    add(t-0.05,f"SPELL_DAMAGE,{unit(B,BN,'0xa48')},{unit(G[n],n+'-Realm')},1284033,\"Soulcoil Rite\",0x20,{adv(G[n],0,1000000)},400000,450000,90000,32,0,0,0,nil,nil,nil,AOE")
    add(t,f"UNIT_DIED,0000000000000000,nil,0x80000000,0x80000000,{unit(G[n],n+'-Realm')},0")
add(dur,f'ENCOUNTER_END,3200,"{BN}",15,20,0,{dur*1000}')
L.sort(key=lambda x:x[:23])
open("demo.log","w",newline="\r\n").write("\n".join(L)+"\n")
print(len(L))
