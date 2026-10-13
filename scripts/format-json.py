#!/usr/bin/env python3
"""Format content JSON in the repository's house style: 2-space indent, short arrays and
objects on one line (like the hand-written v0.3 content files). Usage: format-json.py FILE..."""
import json,sys
def one(v):return json.dumps(v,ensure_ascii=False,separators=(', ',': ')).replace('{"','{ "').replace('"}','" }').replace('{','{ ',0)
def inline(v):
    if isinstance(v,dict):return '{ '+', '.join(json.dumps(k,ensure_ascii=False)+': '+inline(x) for k,x in v.items())+' }' if v else '{}'
    if isinstance(v,list):return '['+', '.join(inline(x) for x in v)+']'
    return json.dumps(v,ensure_ascii=False)
def fmt(v,ind=0,key=None):
    pad='  '*ind; s=inline(v)
    simple=isinstance(v,list) and all(not isinstance(x,(dict,list)) for x in v)
    if not isinstance(v,(dict,list)) or (len(s)+len(pad)+(len(key)+4 if key else 0)<=175 and (simple or ind>=3 or isinstance(v,dict) and all(not isinstance(x,(dict,list)) or len(inline(x))<60 for x in v.values()))):
        return s
    if isinstance(v,dict):
        return '{\n'+',\n'.join(pad+'  '+json.dumps(k,ensure_ascii=False)+': '+fmt(x,ind+1,k) for k,x in v.items())+'\n'+pad+'}'
    return '[\n'+',\n'.join(pad+'  '+fmt(x,ind+1) for x in v)+'\n'+pad+']'
for p in sys.argv[1:]:
    d=json.load(open(p,encoding='utf8')); open(p,'w',encoding='utf8').write(fmt(d)+'\n')
