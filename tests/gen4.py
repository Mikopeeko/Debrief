def ts(s): return f"10/14/2026 22:{int(s//60):02d}:{s%60:06.3f}-4  "
def unit(g,n,fl="0x512"): return f'{g},"{n}",{fl},0x0'
def adv(info,hp,mx): return f"{info},0000000000000000,{hp},{mx},1000,1000,500,0,0,0,0,100,100,0,1.0,2.0,2000,0.5,290"
V="Creature-0-1-2-3-400000-0001"; VN="Vexhul"; S="Creature-0-1-2-3-400002-0009"; SN="Spawn of Vexhul"
P=[("Aria",65),("Brannoc",72),("Kesh",64),("Ondra",250)]
G={n:f"Player-1-0{i}" for i,(n,_) in enumerate(P)}
L=[]; add=lambda t,s: L.append(ts(t)+s)
add(0,'ENCOUNTER_START,3500,"The Twin Fangs",15,20,2900')
for n,s in P: add(0.01,"COMBATANT_INFO,"+G[n]+","+",".join(["1"]*23)+f",{s},[(1,2,1)],(0,0,0),[],[]")
st={n:0 for n,_ in P}
def stack(t,n,src,sid):
    add(t,f"SPELL_DAMAGE,{unit(V,VN,'0xa48')},{unit(G[n],n+'-Realm')},{sid},\"{src}\",0x8,{adv(G[n],600000,1000000)},90000,90000,-1,8,0,0,0,nil,nil,nil,AOE")
    st[n]+=1
    ev="SPELL_AURA_APPLIED" if st[n]==1 else "SPELL_AURA_APPLIED_DOSE"
    add(t+0.01,f"{ev},{unit(V,VN,'0xa48')},{unit(G[n],n+'-Realm')},9990100,\"Eternal Venom\",0x8,DEBUFF"+("" if st[n]==1 else f",{st[n]}"))
for n,_ in P: stack(10,n,"Venomous Emergence",9990101)
stack(30,"Brannoc","Stir the Depths",9990102); stack(32,"Brannoc","Stir the Depths",9990102); stack(33,"Kesh","Stir the Depths",9990102)
stack(45,"Aria","Caustic Globule",9990103)
for n,_ in P: stack(70,n,"Venomous Emergence",9990101)
# feast clears one stack from Brannoc
st["Brannoc"]-=1; add(80,f"SPELL_AURA_REMOVED_DOSE,{unit(V,VN,'0xa48')},{unit(G['Brannoc'],'Brannoc-Realm')},9990100,\"Eternal Venom\",0x8,DEBUFF,{st['Brannoc']}")
# kicks: Spawn casts Venom Spit 3x, 2 kicked
add(50,f"SPELL_CAST_SUCCESS,{unit(S,SN,'0xa48')},0000000000000000,nil,0x80000000,0x80000000,9990110,\"Venom Bolt Volley\",0x8,{adv(S,1,1)}")
add(55,f"SPELL_INTERRUPT,{unit(G['Kesh'],'Kesh-Realm')},{unit(S,SN,'0xa48')},2139,\"Counterspell\",0x40,9990110,\"Venom Bolt Volley\",0x8")
add(60,f"SPELL_INTERRUPT,{unit(G['Brannoc'],'Brannoc-Realm')},{unit(S,SN,'0xa48')},6552,\"Pummel\",0x1,9990110,\"Venom Bolt Volley\",0x8")
add(90,f'ENCOUNTER_END,3500,"The Twin Fangs",15,20,1,90000')
open("tf.log","w",newline="\r\n").write("\n".join(L)+"\n")
