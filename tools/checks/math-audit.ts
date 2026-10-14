// v0.5 math audit: open every order in every chapter across many campaigns (DEV fast-forward, normal engine)
// and record the numbers each problem actually shows. Flags trivial problems. Usage: bundle with esbuild, run with node.
import {devStart,defaultDev} from '../../src/core/devPlaytest';
import {reduce,legalOrder} from '../../src/core/reducer';
import {chapter,template} from '../../src/content/registry';
import {prompt} from '../../src/core/mathEngine';
import type {State} from '../../src/core/types';
const rows:Record<string,{n:number;samples:string[];flags:Record<string,number>}>={};
const note=(key:string,text:string,flags:string[])=>{const r=rows[key]??={n:0,samples:[],flags:{}};r.n++;if(r.samples.length<3&&!r.samples.includes(text))r.samples.push(text);for(const f of flags)r.flags[f]=(r.flags[f]??0)+1;};
function flagsFor(op:Record<string,unknown>,ans:Record<string,unknown>){const f:string[]=[];const nums=Object.entries(op).filter(([,v])=>typeof v==='number') as [string,number][];
 if(nums.some(([,v])=>v===0))f.push('zero operand');const a=Object.values(ans).filter(v=>typeof v==='number') as number[];
 if(a.some(x=>nums.some(([,v])=>v===x)))f.push('answer equals a given number');if(a.some(x=>x===0))f.push('answer 0');return f;}
const step=(s:State,c:any)=>{const r=reduce(s,c);if(r.events[0]?.type==='RULE_VIOLATION')throw Error(JSON.stringify(c)+' '+JSON.stringify(r.events[0]));return r.state;};
for(let seed=1;seed<=40;seed++)for(const start of ['ch1','ch2','ch3','ch4'] as const){
 let s=devStart({...defaultDev,start,scenes:false,ampleStores:seed%2===0},seed);
 while(s.phase!=='orders'){if(s.phase==='policy')s=step(s,{type:'POLICY',id:chapter(s.chapterIndex).policyChoices[seed%3].id});else s=step(s,{type:'ADVANCE'});}
 // spend one order so later ones see a mid-chapter ledger, then sample every order
 for(const pass of [0,1]){for(const id of chapter(s.chapterIndex).orderIds){if(!legalOrder(s,id))continue;const t=structuredClone(s);try{const r=reduce(t,{type:'OPEN_ORDER',id,now:0});const c=r.state.activeOrder;if(!c)continue;
   note(c.templateId+(pass?' (after one order)':''),prompt(c)+' → '+JSON.stringify(c.answer),flagsFor(c.operands as any,c.answer as any));}catch{}}
  if(pass===0){const id=chapter(s.chapterIndex).orderIds.find(i=>i!=='audit_stores'&&legalOrder(s,i));if(!id)break;s=step(s,{type:'OPEN_ORDER',id,now:0});s=step(s,{type:'ANSWER',answer:Object.fromEntries(Object.entries(s.activeOrder!.answer).map(([k,v])=>[k,String(v)])),now:0});if(s.pendingReward!==null)s=step(s,{type:'AUDIT_REWARD',resource:'food'});}}
}
for(const [k,r] of Object.entries(rows).sort())console.log(JSON.stringify({template:k,skills:template(k.split(' ')[0]).skillTags,opened:r.n,flags:r.flags,samples:r.samples}));
