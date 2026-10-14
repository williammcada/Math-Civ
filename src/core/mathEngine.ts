import {campaign,template,text} from '../content/registry';
import type {Answer,Challenge,State} from './types';
import {sum,round} from './fixedPoint';
import {roll} from './rng';
import {rationSchedule,rules} from './logistics';
export type Rational={n:bigint;d:bigint};
// Literal values only: no executable expression input or tolerance guess.
export function literal(value:unknown):Rational|null{
 const raw=String(value??'').trim();if(!raw||raw.length>64)return null;
 const integer='(?:\\d+|\\d{1,3}(?:,\\d{3})+)';
 const fraction=new RegExp('^([+-]?'+integer+')\\/('+integer+')$').exec(raw);
 if(fraction){const a=fraction[1].replaceAll(',',''),b=fraction[2].replaceAll(',','');if(a.replace(/^[+-]/,'').length>18||b.length>18)return null;const d=BigInt(b);return d>0n?{n:BigInt(a),d}:null;}
 if(!new RegExp('^[+-]?(?:'+integer+'(?:\\.\\d*)?|\\.\\d+)$').test(raw))return null;
 const clean=raw.replaceAll(',',''),negative=clean.startsWith('-'),unsigned=clean.replace(/^[+-]/,''),[a,b='']=unsigned.split('.');
 if((a+b).length>18)return null;return {n:BigInt((a||'0')+b)*(negative?-1n:1n),d:10n**BigInt(b.length)};
}
export function normalize(value:unknown):number|null{const r=literal(value);if(!r)return null;const v=Number(r.n)/Number(r.d);return Number.isFinite(v)&&Math.abs(v)<=Number.MAX_SAFE_INTEGER?v:null;}
export function exactWhole(value:unknown):number|null{const r=literal(value);if(!r||r.n%r.d!==0n)return null;const n=Number(r.n/r.d);return Number.isSafeInteger(n)?n:null;}
export function equivalent(a:unknown,b:unknown){const x=literal(a),y=literal(b);return !!x&&!!y&&x.n*y.d===y.n*x.d;}
export function validAnswer(c:Challenge,a:Answer){return c.fields.every(k=>typeof c.answer[k]==='string'?a[k]===c.answer[k]:equivalent(a[k],c.answer[k]));}
function divide(a:number,b:number){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b<=0||a%b!==0)throw Error('Content error: this exact task requires divisible operands. No attempt was spent.');return a/b;}
export function answerPolicy(id:string){if(rules.exactTemplates.includes(id))return 'exact';if(id===rules.roundingPolicy.templateId)return 'rounding_up';throw Error('Missing answer policy: '+id);}
export function solve(id:string,op:Record<string,unknown>):Answer{
 const t=template(id),f=t.answerFields,n=(k:string)=>Number(op[k]);let value:number|string=0;answerPolicy(id);
 switch(t.workedMethod){
 case 'ratio_share':{const r=op.ratio as number[];if(r.length!==f.length||r.some(x=>!Number.isSafeInteger(x)||x<=0))throw Error('Invalid ratio');return Object.fromEntries(f.map((k,i)=>[k,divide(n('total')*r[i],sum(r))]));}
 case 'percent_and_remainder':{const a=divide(n('total')*n('firstPercent'),100);return {[f[0]]:a,[f[1]]:n('total')-a};}
 case 'percent_of':value=divide(n('whole')*n('percent'),100);break;
 case 'area_then_unit_rate':value=divide(n('length')*n('width'),n('coveragePerBundle'));break;
 case 'area_times_rate':value=n('length')*n('width')*n('materialsPerSquare');break;
 case 'rectangle_perimeter':value=2*(n('length')+n('width'));break;
 case 'issued_supply':{const issued=op.issuedRations as number[];if(!issued?.length||issued.some(x=>!Number.isSafeInteger(x)||x<0))throw Error('Missing issued rations');value=sum(issued)*Number(op.rounds??op.travelPeriods);break;}
 case 'formation_supply':if(answerPolicy(id)!=='rounding_up'||!t.skillTags.includes('rounding_up'))throw Error('Undeclared rounding');value=sum(rationSchedule(op.troops as number[],Number(op.troopsPerRice??op.ricePerTroops)))*Number(op.rounds??op.travelPeriods);break;
 case 'distance_rate_time':value=divide(n('distance'),n('distancePerDay'));break;
 case 'purchase_lots':value=divide(n('budget'),n('lotCost'))*n('ricePerLot');break;
 case 'ledger_balance':value=n('opening')+n('inflow')-n('outflow');break;
 case 'purchase_remainder':value=n('opening')-n('itemCount')*n('itemCost');break;
 // v0.5 M5: fractions, decimal prices, mean, volume, map scale, comparing rates, an itemized ledger.
 case 'fraction_remainder':{const a1=divide(n('total')*n('numerator'),n('denominator'));return {[f[0]]:a1,[f[1]]:n('total')-a1};}
 case 'decimal_purchase':{const c=(x:number)=>Math.round(x*100),bales=divide(c(n('budget')),c(n('price'))),rice=bales*c(n('ricePerBale'));value=divide(rice,100);break;}
 case 'mean_of_readings':{const r=op.readings as number[];value=divide(r.reduce((t,x)=>t+Math.round(x*10),0),r.length*10);break;}
 case 'volume_times_rate':value=n('length')*n('width')*n('depth')*n('materialsPerCube');break;
 case 'scale_then_rate':value=divide(n('mapCm')*n('kmPerCm'),n('kmPerDay'));break;
 case 'compare_routes':{const a1=divide(n('slowKm'),n('slowKmPerDay')),b1=divide(n('fastKm'),n('fastKmPerDay'));if(a1<=b1)throw Error('Content error: the faster route must arrive first');value=a1-b1;break;}
 case 'ledger_lines':{const e=op.entries as Array<{label:string;amount:number}>;let bal=n('opening'),low=bal;for(const x of e){bal+=x.amount;low=Math.min(low,bal);}return {[f[0]]:low,[f[1]]:bal};}
 case 'affordable_unit_rate_compare':{const opts=(op.options as Array<{id:string;cost:number;cohesion:number}>).filter(o=>o.cost<=n('budget'));opts.sort((a,b)=>b.cohesion*a.cost-a.cohesion*b.cost||a.id.localeCompare(b.id));if(!opts.length||opts[1]&&opts[0].cohesion*opts[1].cost===opts[1].cohesion*opts[0].cost)throw Error('Comparison needs a unique answer');value=opts[0].id;if(f.length>1){const r=opts[0].cohesion*10/opts[0].cost;if(Math.round(r*100)!==r*100)throw Error('Content error: support per 10 Treasury must have at most two decimals');return {[f[0]]:value,[f[1]]:r};}break;}
 case 'percent_product_compare':{const opts=[...(op.options as Array<{id:string;reliabilityPercent:number;rainPercent:number}>)];opts.sort((a,b)=>b.reliabilityPercent*b.rainPercent-a.reliabilityPercent*a.rainPercent||a.id.localeCompare(b.id));if(!opts.length||opts[1]&&opts[0].reliabilityPercent*opts[0].rainPercent===opts[1].reliabilityPercent*opts[1].rainPercent)throw Error('Comparison needs a unique answer');value=opts[0].id;break;}
 default:throw Error('Unsupported math method '+t.workedMethod);
 }
 if(typeof value==='number'&&(!Number.isSafeInteger(value)||value<0))throw Error('Content error: invalid exact quantity');return {[f[0]]:value};
}
/** v0.5 M1: the audit uses last chapter's real Rice ledger, grouped into at most six lines in the order they happened.
 *  Returns null (use a written version) in Chapter 1, or when the ledger is too short or does not balance. */
export function auditLedger(s:State):{opening:number;entries:{label:string;amount:number}[]}|null{
 const ch=s.chapterIndex-1;if(ch<1)return null;
 const end=s.reportSnapshots.find(p=>p.chapter===ch)?.resources.food,opening=s.reportSnapshots.find(p=>p.chapter===ch-1)?.resources.food??campaign.startingState.resources.food;if(end===undefined)return null;
 const name=(k:string,d:number)=>k.startsWith('production')?'Harvest':k==='upkeep.civilians'?'Households fed':k==='upkeep.garrison'?'Garrison fed':k.startsWith('upkeep')?'Army on the march':k.startsWith('audit')?'Audit recovery':k.startsWith('convoy')?'Convoy':k.startsWith('crisis')?'Crisis relief':/^ai|raid|depot/.test(k)?'Western raid':k.startsWith('policy')?'Council policy':d<0?'Orders paid':'Orders delivered';
 const lines:{label:string;amount:number}[]=[];
 for(const e of s.eventLog)if(e.chapter===ch&&e.type==='RESOURCE_CHANGED'&&e.detail?.path==='resources.food'&&e.delta){const label=name(e.key,e.delta);const last=lines.find(l=>l.label===label&&Math.sign(l.amount)===Math.sign(e.delta!));if(last)last.amount+=e.delta;else lines.push({label,amount:e.delta});}
 while(lines.length>6){const a=lines.pop()!;lines[lines.length-1].label='Other';lines[lines.length-1].amount+=a.amount;}
 if(lines.length<3||lines.some(l=>!l.amount)||opening+lines.reduce((t,l)=>t+l.amount,0)!==end)return null;
 return {opening,entries:lines};
}
// v0.4 (M8): the audit uses this chapter's real Rice ledger.
export function riceLedger(s:State){const prior=s.reportSnapshots.find(p=>p.chapter===s.chapterIndex-1)?.resources.food??campaign.startingState.resources.food;let inflow=0,outflow=0;for(const e of s.eventLog.slice(s.chapterStart))if(e.type==='RESOURCE_CHANGED'&&e.detail?.path==='resources.food'&&e.delta){if(e.delta>0)inflow+=e.delta;else outflow-=e.delta;}return {opening:prior,inflow,outflow};}
function bind(s:State,id:string,original:Record<string,unknown>,context:Challenge['context']){
 const t=template(id),op=structuredClone(original);
 if(id==='math_audit_stores'){const l=auditLedger(s);if(l)Object.assign(op,l);}
 if(t.stateBindings?.some(b=>b.includes('formations')))op.troops=s.playerArmy.formations.map(f=>f.troops);
 if(id==='math_c2_provisions'||id==='math_c4_granaries')op.issuedRations=rationSchedule(op.troops as number[],id==='math_c2_provisions'?100:rules.battle.rationCapacity);
 if(context==='provision'){op.rounds=s.prep.rounds;op.troopsPerRice=rules.battle.rationCapacity;}
 if(context==='warchest'){op.opening=s.resources.currency;op.itemCount=sum(s.prep.equipment);op.itemCost=rules.battle.equipmentCost;}
 return op;
}
export function supplyOrderAffordable(s:State,id:string){return template(id).variants.some(v=>Number(solve(id,bind(s,id,v.operands,'order')).rice)<=s.resources.food);}
export function generate(s:State,id:string,context:Challenge['context'],orderId:string,now=0,preferredVariant?:string):Challenge{
 const key=s.chapterIndex+':'+orderId,old=s.variants[key],t=template(id);
 if(old&&(old.attempts>0||old.resolved))return structuredClone(old);
 let variants:Array<{id:string;operands:Record<string,unknown>;answer:Answer}>=t.variants;
 if(id==='math_c2_provisions'||id==='math_c4_granaries')variants=variants.filter(v=>Number(solve(id,bind(s,id,v.operands,context)).rice)<=s.resources.food);
 if(!variants.length)throw Error('Not enough Rice for a full issued-ration plan. Restore stores before issuing it.');
 const v=variants.find(v=>v.id===old?.variantId)??variants.find(v=>v.id===preferredVariant)??variants[roll(s,0,variants.length-1)],op=bind(s,id,v.operands,context);
 const c:Challenge={answerPolicy:answerPolicy(id),id:key,templateId:id,variantId:v.id,operands:op,answer:solve(id,op),fields:t.answerFields,attempts:0,floor:old?.floor??1,submitted:[],hints:old?.hints??0,adviserShown:false,paid:{},context,orderId,resolved:false,openedAt:now,firstSubmittedAt:null};
 s.variants[key]=structuredClone(c);return c;
}
export function prompt(c:Challenge){const op={...c.operands};(op.ratio as number[]|undefined)?.forEach((v,i)=>op['ratio'+i]=v);if(op.troops)op.troopList=(op.troops as number[]).join(', ');if(op.issuedRations)op.rationList=(op.issuedRations as number[]).join(', ');return text(template(c.templateId).promptStringId).replace(/\{(\w+)\}/g,(_,k)=>String(op[k]??'?'));}
const fmt=(n:number)=>n.toLocaleString('en-US');
// v0.4 (M2, M3): worked solutions use the student's own numbers. `label` turns field keys into words.
/** A problem saved by an older version may not fit today's worked method: fall back to the hints instead of failing. */
export function worked(c:Challenge,label:(k:string)=>string=k=>k):string[]{try{const w=workedSteps(c,label);if(w.some(x=>/undefined|NaN/.test(x)))throw Error('stale');return w;}catch{const t=template(c.templateId);return t.hintStringIds.map(h=>text(h));}}
function workedSteps(c:Challenge,label:(k:string)=>string=k=>k):string[]{
 const op=c.operands,a=c.answer,n=(k:string)=>Number(op[k]),t=template(c.templateId),field=t.answerFields[0],unit=text(t.unitStringId);
 switch(t.workedMethod){
 case 'ratio_share':{const r=op.ratio as number[],parts=sum(r),share=n('total')/parts;return [`Add the ratio parts: ${r.join(' + ')} = ${parts} equal shares.`,`One share: ${fmt(n('total'))} ÷ ${parts} = ${fmt(share)}.`,...t.answerFields.map((k,i)=>`${label(k)}: ${r[i]} × ${fmt(share)} = ${fmt(Number(a[k]))}.`),`Check: ${t.answerFields.map(k=>fmt(Number(a[k]))).join(' + ')} = ${fmt(n('total'))}.`];}
 case 'percent_and_remainder':{const [f1,f2]=t.answerFields;return [`${n('firstPercent')}% of ${fmt(n('total'))} = ${fmt(n('total'))} × ${n('firstPercent')} ÷ 100 = ${fmt(Number(a[f1]))}.`,`${label(f2)}: ${fmt(n('total'))} − ${fmt(Number(a[f1]))} = ${fmt(Number(a[f2]))}.`];}
 case 'percent_of':return [`${n('percent')}% means ${n('percent')} out of every 100.`,`${fmt(n('whole'))} × ${n('percent')} = ${fmt(n('whole')*n('percent'))}.`,`${fmt(n('whole')*n('percent'))} ÷ 100 = ${fmt(Number(a[field]))} ${unit}.`];
 case 'area_then_unit_rate':return [`Area: ${n('length')} × ${n('width')} = ${n('length')*n('width')} square sections.`,`Bundles: ${n('length')*n('width')} ÷ ${n('coveragePerBundle')} = ${fmt(Number(a[field]))}.`];
 case 'area_times_rate':return [`Area: ${n('length')} × ${n('width')} = ${n('length')*n('width')} square sections.`,`${n('length')*n('width')} × ${n('materialsPerSquare')} = ${fmt(Number(a[field]))} ${unit}.`];
 case 'rectangle_perimeter':return [`Add one length and one width: ${n('length')} + ${n('width')} = ${n('length')+n('width')}.`,`Double it for all four sides: 2 × ${n('length')+n('width')} = ${fmt(Number(a[field]))}.`];
 case 'issued_supply':{const issued=op.issuedRations as number[],per=sum(issued),periods=Number(op.rounds??op.travelPeriods);return [`Rice issued each ${op.rounds!==undefined?'round':'period'}: ${issued.join(' + ')} = ${per}.`,`${per} × ${periods} = ${fmt(Number(a.rice))} Rice.`];}
 case 'formation_supply':{const troops=op.troops as number[],cap=Number(op.troopsPerRice),packs=rationSchedule(troops,cap);return [...troops.map((tr,i)=>{const exact=tr/cap;return `Formation ${i+1}: ${fmt(tr)} ÷ ${cap} = ${Number.isInteger(exact)?exact+' (exact, unchanged)':exact.toFixed(2)+' → round up to '+packs[i]}.`;}),`Add the formations: ${packs.join(' + ')} = ${sum(packs)} Rice per round.`,`${sum(packs)} × ${op.rounds} rounds = ${fmt(Number(a.rice))} Rice.`];}
 case 'distance_rate_time':return [`Days = distance ÷ distance per day.`,`${fmt(n('distance'))} ÷ ${n('distancePerDay')} = ${fmt(Number(a[field]))} days.`];
 case 'purchase_lots':{const lots=n('budget')/n('lotCost');return [`Complete lots: ${n('budget')} ÷ ${n('lotCost')} = ${lots}.`,`Rice: ${lots} × ${n('ricePerLot')} = ${fmt(Number(a[field]))}.`];}
 case 'ledger_balance':return [`Start with the opening balance and add what came in: ${fmt(n('opening'))} + ${fmt(n('inflow'))} = ${fmt(n('opening')+n('inflow'))}.`,`Subtract what went out: ${fmt(n('opening')+n('inflow'))} − ${fmt(n('outflow'))} = ${fmt(Number(a[field]))}.`];
 case 'purchase_remainder':return [`Equipment cost: ${n('itemCount')} × ${n('itemCost')} = ${fmt(n('itemCount')*n('itemCost'))} Treasury.`,`Remaining: ${fmt(n('opening'))} − ${fmt(n('itemCount')*n('itemCost'))} = ${fmt(Number(a[field]))}.`];
 case 'affordable_unit_rate_compare':{const opts=op.options as Array<{id:string;cost:number;cohesion:number}>;return [...opts.map(o=>o.cost>n('budget')?`${label(o.id)} costs ${o.cost}, more than the ${n('budget')} budget: not affordable.`:`${label(o.id)}: ${o.cohesion} ÷ ${o.cost} = ${(o.cohesion/o.cost).toFixed(3)} Cohesion per Treasury.`),`The best affordable plan is ${label(String(a[field]))}.`,...(t.answerFields[1]?[`Support per 10 Treasury: ${(op.options as Array<{id:string;cost:number;cohesion:number}>).find(o=>o.id===a[field])!.cohesion} × 10 ÷ ${(op.options as Array<{id:string;cost:number;cohesion:number}>).find(o=>o.id===a[field])!.cost} = ${a[t.answerFields[1]]}.`]:[])];}
 case 'fraction_remainder':{const [f1,f2]=t.answerFields;return [`${n('numerator')}/${n('denominator')} of ${fmt(n('total'))}: ${fmt(n('total'))} ÷ ${n('denominator')} = ${fmt(n('total')/n('denominator'))}, then × ${n('numerator')} = ${fmt(Number(a[f1]))}.`,`${label(f2)}: ${fmt(n('total'))} − ${fmt(Number(a[f1]))} = ${fmt(Number(a[f2]))}.`];}
 case 'decimal_purchase':{const bales=n('budget')/n('price');return [`Bales you can buy: ${fmt(n('budget'))} ÷ ${n('price')} = ${fmt(bales)}.`,`Rice: ${fmt(bales)} × ${n('ricePerBale')} = ${fmt(Number(a[field]))}.`];}
 case 'mean_of_readings':{const r=op.readings as number[],total=r.reduce((x,y)=>x+y,0);return [`Add the readings: ${r.join(' + ')} = ${Number(total.toFixed(1))}.`,`Divide by how many there are: ${Number(total.toFixed(1))} ÷ ${r.length} = ${fmt(Number(a[field]))}.`];}
 case 'volume_times_rate':{const v=n('length')*n('width')*n('depth');return [`Volume: ${n('length')} × ${n('width')} × ${n('depth')} = ${v} cubic sections.`,`${v} × ${n('materialsPerCube')} = ${fmt(Number(a[field]))} ${unit}.`];}
 case 'scale_then_rate':{const km=n('mapCm')*n('kmPerCm');return [`Real distance: ${n('mapCm')} cm × ${n('kmPerCm')} km per cm = ${fmt(km)} km.`,`Days: ${fmt(km)} ÷ ${n('kmPerDay')} = ${fmt(Number(a[field]))}.`];}
 case 'compare_routes':{const s1=n('slowKm')/n('slowKmPerDay'),f1=n('fastKm')/n('fastKmPerDay');return [`Nakasendō: ${fmt(n('slowKm'))} ÷ ${n('slowKmPerDay')} = ${s1} days.`,`Tōkaidō: ${fmt(n('fastKm'))} ÷ ${n('fastKmPerDay')} = ${f1} days.`,`Difference: ${s1} − ${f1} = ${fmt(Number(a[field]))} days sooner.`];}
 case 'ledger_lines':{const e=op.entries as Array<{label:string;amount:number}>;let bal=n('opening');const lines=[`Start: ${fmt(bal)}.`];for(const x of e){const before=bal;bal+=x.amount;lines.push(`${x.label}: ${fmt(before)} ${x.amount<0?'−':'+'} ${fmt(Math.abs(x.amount))} = ${fmt(bal)}.`);}const [lo,cl]=t.answerFields;return [...lines,`${label(lo)}: the smallest of these balances, ${fmt(Number(a[lo]))}. ${label(cl)}: ${fmt(Number(a[cl]))}.`];}
 case 'percent_product_compare':{const opts=op.options as Array<{id:string;reliabilityPercent:number;rainPercent:number}>;return [...opts.map(o=>`${label(o.id)}: ${o.reliabilityPercent} × ${o.rainPercent} = ${fmt(o.reliabilityPercent*o.rainPercent)}.`),`The greatest product is ${label(String(a[field]))}.`];}
 default:return [text(t.hintStringIds[0]),text(t.hintStringIds[1])];
 }
}
export function estimateQuality(c:Challenge){if(typeof c.answer[c.fields[0]]==='string')return 250;let accuracy=0;for(const k of c.fields){const correct=Number(c.answer[k]),entered=normalize(c.submitted.at(-1)?.[k])??0;accuracy+=Math.max(0,1000-Math.floor(Math.abs(entered-correct)*1000/Math.max(Math.abs(correct),1)));}return 250+round(accuracy,300,1000*c.fields.length);}
