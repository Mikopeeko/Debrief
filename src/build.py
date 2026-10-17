import json, subprocess
s=open('shell.html', encoding='utf-8').read()
html=s.replace('/*ENGINE*/',open('engine.js', encoding='utf-8').read()).replace('/*WCL*/',open('wcl.js', encoding='utf-8').read()).replace('/*UI*/',open('ui.js', encoding='utf-8').read())
open('../WoW-Log-Analyzer.html','w', encoding='utf-8').write(html)
hosted=html.replace('<head>','<head>\n<script>window.WLA_HOSTED = true;</script>',1)
q=subprocess.run(['node','-e',"const W=require('./wcl.js');console.log(JSON.stringify({r:W.REPORT_Q,e:W.EVENTS_Q}))"],capture_output=True,text=True).stdout
qq=json.loads(q)
w=open('worker_template.js', encoding='utf-8').read().replace('__REPORT_Q__',json.dumps(qq['r'])).replace('__EVENTS_Q__',json.dumps(qq['e'])).replace('__HTML__',json.dumps(hosted))
import os; os.makedirs('../online', exist_ok=True); open('../online/worker.js','w', encoding='utf-8').write(w)
print(len(html), len(w))
