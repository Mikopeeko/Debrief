import random
random.seed(5)
def ts(s): return f"10/14/2026 22:{int(s//60):02d}:{s%60:06.3f}-4  "
def unit(g,n,fl="0x512"): return f'{g},"{n}",{fl},0x0'
def adv(info,hp,mx): return f"{info},0000000000000000,{hp},{mx},1000,1000,500,0,0,0,0,100,100,0,1.0,2.0,2000,0.5,290"
V="Creature-0-1-2-3-400000-0001"; VN="Vexhul"
P=[("Tyralien",65),("Zaffia",259),("Huservoker",1468),("Komo",63),("Larryg",71),("Schooty",254),("Ironvan",70),("Dragooned",62)]
G={n:f"Player-1-0{i}" for i,(n,_) in enumerate(P)}
L=[]; add=lambda t,s: L.append(ts(t)+s)
add(0,'ENCOUNTER_START,3500,"The Twin Fangs",16,20,2900')
for n,s in P: add(0.01,"COMBATANT_INFO,"+G[n]+","+",".join(["1"]*23)+f",{s},[(1,2,1)],(0,0,0),[],[]")
st={n:0 for n,_ in P}
def stack(t,n,src,sid):
    if src: add(t,f"SPELL_DAMAGE,{unit(V,VN,'0xa48')},{unit(G[n],n+'-Realm')},{sid},\"{src}\",0x8,{adv(G[n],600000,1000000)},90000,90000,-1,8,0,0,0,nil,nil,nil,AOE")
    st[n]+=1; ev="SPELL_AURA_APPLIED" if st[n]==1 else "SPELL_AURA_APPLIED_DOSE"
    add(t+0.01,f"{ev},{unit(V,VN,'0xa48')},{unit(G[n],n+'-Realm')},9990100,\"Eternal Venom\",0x8,DEBUFF"+("" if st[n]==1 else f",{st[n]}"))
t=5
for cyc in range(5):
    for n,_ in P: stack(t,n,"Venomous Emergence",9990101)
    t+=10
    for n,_ in random.sample(P,4): stack(t,n,"Caustic Globule",9990103)
    t+=8
    for n,_ in random.sample(P,2): stack(t,n,random.choice(["Corrosive Spit","Toxic Fumes","Rouse the Brood",None]),random.randint(9990120,9990125))
    t+=8
    for n,_ in P:
        if st[n]>1: st[n]-=1; add(t,f"SPELL_AURA_REMOVED_DOSE,{unit(V,VN,'0xa48')},{unit(G[n],n+'-Realm')},9990100,\"Eternal Venom\",0x8,DEBUFF,{st[n]}")
    t+=10
# a player-caused hit at same moment (should be ignored)
add(t,f"SPELL_DAMAGE,{unit(G['Dragooned'],'Dragooned-Realm')},{unit(G['Komo'],'Komo-Realm')},409311,\"Stretch Time\",0x40,{adv(G['Komo'],600000,1000000)},5000,5000,-1,64,0,0,0,nil,nil,nil,ST")
stack(t,"Komo",None,0)
add(t+20,'ENCOUNTER_END,3500,"The Twin Fangs",16,20,0,%d'%((t+20)*1000))
open("tf2.log","w",newline="\r\n").write("\n".join(L)+"\n")
