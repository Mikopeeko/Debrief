def ts(s): return f"10/14/2026 23:{int(s//60):02d}:{s%60:06.3f}-4  "
def unit(g,n,fl="0x512"): return f'{g},"{n}",{fl},0x0'
def adv(info,hp,mx): return f"{info},0000000000000000,{hp},{mx},1000,1000,500,0,0,0,0,100,100,0,1.0,2.0,2000,0.5,290"
V="Creature-0-1-2-3-400000-0001"; I="Creature-0-1-2-3-400001-0002"; A="Creature-0-1-2-3-400009-0003"
P="Player-1-01"; L=[]; add=lambda t,s:L.append(ts(t)+s)
for pull,(vh,ih) in enumerate([(0.8,0.9),(0.4,0.5),(0.1,0.2)]):
    t0=pull*100
    add(t0,'ENCOUNTER_START,3500,"The Twin Fangs",16,20,2900')
    for k in range(1,11):
        f=k/10
        add(t0+k,f"SPELL_DAMAGE,{unit(P,'Ironvan-Realm')},{unit(V,'Vexhul','0xa48')},1,\"Hit\",0x1,{adv(V,int(1e9*(1-(1-vh)*f)),1000000000)},1,1,-1,1,0,0,0,nil,nil,nil,ST")
        add(t0+k+0.1,f"SPELL_DAMAGE,{unit(P,'Ironvan-Realm')},{unit(I,'Ithraz','0xa48')},1,\"Hit\",0x1,{adv(I,int(9e8*(1-(1-ih)*f)),900000000)},1,1,-1,1,0,0,0,nil,nil,nil,ST")
        add(t0+k+0.2,f"SPELL_DAMAGE,{unit(P,'Ironvan-Realm')},{unit(A,'Broodling of Ithraz','0xa48')},1,\"Hit\",0x1,{adv(A,1000,5000000)},1,1,-1,1,0,0,0,nil,nil,nil,ST")
    add(t0+12,f'ENCOUNTER_END,3500,"The Twin Fangs",16,20,0,12000')
open('council.log','w',newline='\r\n').write('\n'.join(L)+'\n')
