import json, subprocess
s=open('shell.html', encoding='utf-8').read()
html=s.replace('/*ENGINE*/',open('engine.js', encoding='utf-8').read()).replace('/*WCL*/',open('wcl.js', encoding='utf-8').read()).replace('/*UI*/',open('ui.js', encoding='utf-8').read())
open('../WoW-Log-Analyzer.html','w', encoding='utf-8').write(html)
hosted=html.replace('<head>','<head>\n<script>window.WLA_HOSTED = true;</script>',1)
names=['REPORT_Q','EVENTS_Q','RANK_Q','TEAM_INFO_Q','TEAM_REPORTS_Q','NIGHT_Q','DEATHS_Q','CHAR_INFO_Q','CHAR_REPORTS_Q','CHAR_RANK_Q']
q=subprocess.run(['node','-e',"const W=require('./wcl.js');console.log(JSON.stringify(Object.fromEntries("+json.dumps(names)+".map(n=>[n,W[n]]))))"],capture_output=True,text=True).stdout
qq=json.loads(q)
w=open('worker_template.js', encoding='utf-8').read()
for n in names: w=w.replace('__'+n+'__',json.dumps(qq[n]))
w=w.replace('__HTML__',json.dumps(hosted))
import os; os.makedirs('../online', exist_ok=True); open('../online/worker.js','w', encoding='utf-8').write(w)
print(len(html), len(w))
