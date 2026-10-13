// v0.4 checks for M1 (crisis math equals the cost charged) and M2/M3 (worked solutions for every template and variant).
// Build and run: esbuild tools/checks/math-check.ts --bundle --platform=node --outfile=.parity/math-check.cjs && node .parity/math-check.cjs
import {createState} from '../../src/core/reducer';
import {generate,worked,prompt,validAnswer} from '../../src/core/mathEngine';
import {crisisCost,crisisType} from '../../src/core/crisis';
import crises from '../../src/content/crises.v1.json';
import math from '../../src/content/math-templates.v1.json';
import type {Crisis} from '../../src/core/types';
let fail=0;const bad=(m:string)=>{fail++;console.log('FAIL',m);};
// M1
for(const t of (crises as unknown as {crises:{id:string}[]}).crises)for(const severity of [1,2,3]){
 const s=createState(11);s.resources={food:5000,currency:5000,materials:5000,authority:80};
 const cr={id:t.id,severity} as unknown as Crisis,type=crisisType(t.id),cost=crisisCost(cr,'full'),primary=type.fullResponse.primaryCost as keyof typeof cost;
 const c=generate(s,type.fullResponse.challengeTemplateId,'crisis','crisis.'+t.id,0,'s'+severity);
 const nums=c.fields.map(f=>Number(c.answer[f])),total=nums.reduce((a,b)=>a+b,0),last=nums.at(-1)!;
 const ok=total===cost[primary]||last===cost[primary]||nums.includes(Number(cost[primary]));
 console.log(`${t.id} s${severity}: charged ${JSON.stringify(cost)} · variant ${c.variantId} · answer ${JSON.stringify(c.answer)} → ${ok?'matches':'MISMATCH'}`);if(!ok)bad(t.id+' s'+severity);
}
// M2/M3
let n=0;for(const t of (math as unknown as {templates:{id:string;variants:{id:string}[]}[]}).templates)for(const v of t.variants){
 const s=createState(13);s.chapterIndex=4;s.resources={food:5000,currency:5000,materials:5000,authority:80};
 let c;try{c=generate(s,t.id,t.id.includes('crisis')?'crisis':t.id.includes('battle_provision')?'provision':t.id.includes('warchest')?'warchest':'order','check.'+t.id,0,v.id);}catch(e){bad(t.id+'/'+v.id+' generate: '+String(e));continue;}
 const steps=worked(c,k=>k),text=steps.join(' | ')+' '+prompt(c);n++;
 if(!steps.length)bad(t.id+'/'+v.id+' no worked steps');
 if(/undefined|NaN|\[object/.test(text))bad(t.id+'/'+v.id+' text: '+text.slice(0,200));
 if(!validAnswer(c,Object.fromEntries(c.fields.map(f=>[f,String(c.answer[f])]))))bad(t.id+'/'+v.id+' own answer rejected');
}
console.log(`worked solutions checked: ${n} variants · failures: ${fail}`);process.exitCode=fail?1:0;
