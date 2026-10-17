def ts(s): return f"10/14/2026 21:{int(s//60):02d}:{s%60:06.3f}-4  "
def unit(g,n,fl="0x512"): return f'{g},"{n}",{fl},0x0'
def adv(info,hp,mx): return f"{info},0000000000000000,{hp},{mx},1000,1000,500,0,0,0,0,100,100,0,1.0,2.0,2000,0.5,290"
U="Creature-0-1-2-3-300000-0001"; UN="Ula'tek"; W="Creature-0-1-2-3-300001-0002"; WN="Venom Warden"; D="Creature-0-1-2-3-300002-0003"; DN="Weakened Doomscale"
A=("Player-1-0A","Aria-Realm"); R=("Player-1-0B","Brannoc-Realm"); K=("Player-1-0C","Kesh-Realm")
L=[]; add=lambda t,s: L.append(ts(t)+s)
add(0,f'ENCOUNTER_START,3400,"{UN}",16,20,2900')
for g,s in ((A[0],65),(R[0],72),(K[0],64)): add(0.01,"COMBATANT_INFO,"+g+","+",".join(["1"]*23)+f",{s},[(1,2,1)],(0,0,0),[],[]")
def dmg(t,src,sname,dst,dname,sid,spell,amt): add(t,f"SPELL_DAMAGE,{unit(src,sname,'0xa48')},{unit(dst,dname)},{sid},\"{spell}\",0x8,{adv(dst,500000,1000000)},{amt},{amt},-1,8,0,0,0,nil,nil,nil,AOE")
dmg(5,U,UN,R[0],R[1],9990001,"Caustic Wave",120000)
dmg(6,U,UN,R[0],R[1],9990001,"Caustic Wave",80000)
dmg(10,U,UN,A[0],A[1],9990002,"Rattler Slam",200000); dmg(10.3,U,UN,R[0],R[1],9990002,"Rattler Slam",200000); dmg(10.4,U,UN,K[0],K[1],9990002,"Rattler Slam",200000)
dmg(40,U,UN,A[0],A[1],9990002,"Rattler Slam",200000)
# Malice channel not kicked, damage lands
add(20,f"SPELL_CAST_SUCCESS,{unit(W,WN,'0xa48')},0000000000000000,nil,0x80000000,0x80000000,9990003,\"Malice\",0x20,{adv(W,1,1)}")
dmg(21,W,WN,K[0],K[1],9990003,"Malice",300000)
# Anguished Cry kicked mid-channel (cast success then interrupt)
add(30,f"SPELL_CAST_SUCCESS,{unit(D,DN,'0xa48')},0000000000000000,nil,0x80000000,0x80000000,9990004,\"Anguished Cry\",0x20,{adv(D,1,1)}")
add(31,f"SPELL_INTERRUPT,{unit(*K)},{unit(D,DN,'0xa48')},2139,\"Counterspell\",0x40,9990004,\"Anguished Cry\",0x20")
# second Anguished Cry not kicked
add(50,f"SPELL_CAST_SUCCESS,{unit(D,DN,'0xa48')},0000000000000000,nil,0x80000000,0x80000000,9990004,\"Anguished Cry\",0x20,{adv(D,1,1)}")
add(60,f'ENCOUNTER_END,3400,"{UN}",16,20,0,60000')
open("ula.log","w",newline="\r\n").write("\n".join(L)+"\n")
