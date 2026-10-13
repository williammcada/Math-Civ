#!/usr/bin/env python3
"""Extract the pure rules engine from a shipped single-file build (e.g. PLAY-SEKIGAHARA-0.3.1.html)
into a Node module, so it can be compared with the engine built from src/. Usage:
  python3 tools/parity/extract-shipped-engine.py PLAY-SEKIGAHARA-0.3.1.html .parity/shipped-engine.cjs"""
import re,sys,json,os
html,out=sys.argv[1],sys.argv[2]
s=open(html,encoding='utf8').read()
js=[m.group(1) for m in re.finditer(r'<script>(.*?)</script>',s,re.S)][-1]
i=js.find('{',js.find('globalThis.SEKIGAHARA_ASSETS='));_,end=json.JSONDecoder().raw_decode(js,i);js=js[end+1:]
body=js[js.find('(function(){')+len('(function(){'):js.find('var rn=new Uint32Array')]
exports='globalThis.MC={qt,nn,y,d,f,Ye,et,Xt};'  # createState, reduce, chapter, battle data, templates, activeUnit, reachable, legalOrders (v0.3.1 minified names)
os.makedirs(os.path.dirname(out) or '.',exist_ok=True)
open(out,'w').write('(function(){'+body+exports+'})();\nmodule.exports=globalThis.MC;\n')
print('wrote',out)
