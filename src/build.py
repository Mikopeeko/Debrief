import json, subprocess
s=open('shell.html', encoding='utf-8').read()
html=s.replace('/*ENGINE*/',open('engine.js', encoding='utf-8').read()).replace('/*MPLUS*/',open('../companion/mplus.js', encoding='utf-8').read()).replace('/*RECAP*/',open('../companion/recap.js', encoding='utf-8').read()).replace('/*WCL*/',open('wcl.js', encoding='utf-8').read()).replace('/*UI*/',open('ui.js', encoding='utf-8').read().replace('/*GUIDES*/',open('guides.js', encoding='utf-8').read()).replace('/*MPTAB*/',open('mptab.js', encoding='utf-8').read()))
open('../WoW-Log-Analyzer.html','w', encoding='utf-8').write(html)
hosted=html.replace('<head>','<head>\n<script>window.WLA_HOSTED = true;</script>',1)
names=['REPORT_Q','EVENTS_Q','RANK_Q','TEAM_INFO_Q','TEAM_REPORTS_Q','NIGHT_Q','DEATHS_Q','CHAR_INFO_Q','CHAR_REPORTS_Q','TEAM_LATEST_Q','CHAR_LATEST_Q','CHAR_RANK_Q','TEAM_RANK_Q','CHAR_LOOK_Q','TOPRANK_Q','TOPAB_Q']
q=subprocess.run(['node','-e',"const W=require('./wcl.js');console.log(JSON.stringify(Object.fromEntries("+json.dumps(names)+".map(n=>[n,W[n]]))))"],capture_output=True,text=True).stdout
qq=json.loads(q)
w=open('worker_template.js', encoding='utf-8').read()
for n in names: w=w.replace('__'+n+'__',json.dumps(qq[n]))
import re
w=w.replace('/*TOPSPEC*/',re.search(r'// <topspec>[\s\S]*?// </topspec>',open('wcl.js', encoding='utf-8').read()).group(0))
import base64, os
IT={'.png':'image/png','.ico':'image/x-icon','.webmanifest':'application/manifest+json'}
icons=json.dumps({'/'+f:[IT[os.path.splitext(f)[1]],base64.b64encode(open('icons/'+f,'rb').read()).decode()] for f in sorted(os.listdir('icons')) if os.path.splitext(f)[1] in IT},separators=(',',':'))
site=re.sub(r'/\*@GATEWAY-START\*/[\s\S]*?/\*@GATEWAY-END\*/','',w.replace('__ROLE__','site').replace('__HTML__',json.dumps(hosted)).replace('__ICONS__',icons))
bot=re.sub(r'/\*@KEYS-START\*/[\s\S]*?/\*@KEYS-END\*/','',w.replace('__ROLE__','bot').replace('__HTML__','""').replace('__ICONS__','{}'))
import os; os.makedirs('../online', exist_ok=True); open('../online/worker.js','w', encoding='utf-8').write(site); open('../online/bot.js','w', encoding='utf-8').write(bot)
print(len(html), len(site), len(bot))
