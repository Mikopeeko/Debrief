import random
def ts(s):
    m=int(s//60); sec=s%60
    return f"10/14/2026 20:{15+m:02d}:{sec:06.3f}-4  "
B="Creature-0-1-2-3-200000-0001"; BN="Nek'zali the Soulcoiler"
A=("Player-1-0A","Aria-Realm"); R=("Player-1-0B","Brannoc-Realm")
def unit(g,n,fl="0x512"): return f'{g},"{n}",{fl},0x0'
def adv(info,hp,mx): return f"{info},0000000000000000,{hp},{mx},1000,1000,500,0,0,0,0,100,100,0,1.0,2.0,2000,0.5,290"
L=[]
def add(t,s): L.append(ts(t)+s)
add(0,"COMBAT_LOG_VERSION,22,ADVANCED_LOG_ENABLED,1,BUILD_VERSION,12.1.0,PROJECT_ID,1")
for k,(t0) in enumerate([0,200]):
    add(t0+0,f'ENCOUNTER_START,3200,"{BN}",15,20,2900')
    for g,spec in ((A[0],65),(R[0],72)):
        add(t0+0.01,"COMBATANT_INFO,"+g+","+",".join(["1"]*23)+f",{spec},[(1,2,1)],(0,0,0),[(1,290,(),(),())],[]")
    add(t0+1,f"SPELL_CAST_SUCCESS,{unit(*A)},0000000000000000,nil,0x80000000,0x80000000,31884,\"Avenging Wrath\",0x2,{adv(A[0],100,100)}")
    add(t0+1.5,f"SPELL_DAMAGE,{unit(*R)},{unit(B,BN,'0xa48')},85288,\"Raging Blow\",0x1,{adv(B,9000000,10000000)},100000,120000,-1,1,0,0,0,1,nil,nil,ST")
    add(t0+2,f"SPELL_DAMAGE,{unit(B,BN,'0xa48')},{unit(*R)},1294846,\"Anguished Echoes\",0x20,{adv(R[0],800000,1000000)},50000,60000,-1,32,0,0,0,nil,nil,nil,AOE")
    add(t0+3,f"SPELL_HEAL,{unit(*A)},{unit(*R)},20473,\"Holy Shock\",0x2,{adv(R[0],850000,1000000)},30000,40000,10000,0,nil")
    add(t0+4,f"SPELL_ABSORBED,{unit(B,BN,'0xa48')},{unit(*R)},1284103,\"Possession Barrage\",0x20,{unit(*A)},432459,\"Holy Bulwark\",0x2,20000,25000,nil")
    add(t0+4.5,f"SPELL_ABSORBED,{unit(B,BN,'0xa48')},{unit(*R)},{unit(*R)},184364,\"Enraged Regeneration\",0x1,5000,6000,nil")
    add(t0+5,f"SPELL_AURA_APPLIED,{unit(B,BN,'0xa48')},{unit(*R)},1294933,\"Slithering Flame\",0x4,DEBUFF")
    add(t0+6,f"SPELL_CAST_SUCCESS,{unit(*R)},0000000000000000,nil,0x80000000,0x80000000,431932,\"Tempered Potion\",0x1,{adv(R[0],100,100)}")
    add(t0+7,f"SPELL_AURA_APPLIED_DOSE,{unit(B,BN,'0xa48')},{unit(*A)},1284110,\"Hollowing Strikes\",0x20,DEBUFF,8")
    add(t0+8,f"SPELL_CAST_SUCCESS,{unit(B,BN,'0xa48')},0000000000000000,nil,0x80000000,0x80000000,1300238,\"Soulcoiler's Curse\",0x20,{adv(B,1,1)}")
    add(t0+9,f"SPELL_AURA_APPLIED,{unit(B,BN,'0xa48')},{unit(B,BN,'0xa48')},1284034,\"Uncoiled Rage\",0x20,BUFF")
    add(t0+10,f"SPELL_DAMAGE,{unit(B,BN,'0xa48')},{unit(*R)},1284033,\"Soulcoil Rite\",0x20,{adv(R[0],0,1000000)},900000,950000,100000,32,0,0,0,nil,nil,nil,AOE")
    add(t0+10.1,f"UNIT_DIED,0000000000000000,nil,0x80000000,0x80000000,{unit(*R)},0")
    add(t0+11,f"SPELL_INTERRUPT,{unit(*A)},{unit(B,BN,'0xa48')},96231,\"Rebuke\",0x1,1300238,\"Soulcoiler's Curse\",0x20")
    add(t0+60,f'ENCOUNTER_END,3200,"{BN}",15,20,0,60000')
add(400,'CHALLENGE_MODE_START,"Altar of Fangs",2901,600,12,[9,10,147]')
add(401,'ENCOUNTER_START,3300,"Fang Warden",8,5,2901')
add(402,f"SPELL_DAMAGE,{unit(*R)},{unit(B,'Fang Warden','0xa48')},85288,\"Raging Blow\",0x1,{adv(B,5,10)},5000,5000,-1,1,0,0,0,nil,nil,nil,ST")
add(450,'ENCOUNTER_END,3300,"Fang Warden",8,5,1,49000')
add(900,'CHALLENGE_MODE_END,2901,1,12,1800000,0,0')
open("test.log","w",newline="\r\n").write("\n".join(L)+"\n")
print(len(L))
