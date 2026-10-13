import {template,text} from '../content/registry';
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
 case 'affordable_unit_rate_compare':{const opts=(op.options as Array<{id:string;cost:number;cohesion:number}>).filter(o=>o.cost<=n('budget'));opts.sort((a,b)=>b.cohesion*a.cost-a.cohesion*b.cost||a.id.localeCompare(b.id));if(!opts.length||opts[1]&&opts[0].cohesion*opts[1].cost===opts[1].cohesion*opts[0].cost)throw Error('Comparison needs a unique answer');value=opts[0].id;break;}
 case 'percent_product_compare':{const opts=[...(op.options as Array<{id:string;reliabilityPercent:number;rainPercent:number}>)];opts.sort((a,b)=>b.reliabilityPercent*b.rainPercent-a.reliabilityPercent*a.rainPercent||a.id.localeCompare(b.id));if(!opts.length||opts[1]&&opts[0].reliabilityPercent*opts[0].rainPercent===opts[1].reliabilityPercent*opts[1].rainPercent)throw Error('Comparison needs a unique answer');value=opts[0].id;break;}
 default:throw Error('Unsupported math method '+t.workedMethod);
 }
 if(typeof value==='number'&&(!Number.isSafeInteger(value)||value<0))throw Error('Content error: invalid exact quantity');return {[f[0]]:value};
}
function bind(s:State,id:string,original:Record<string,unknown>,context:Challenge['context']){
 const t=template(id),op=structuredClone(original);
 if(t.stateBindings?.some(b=>b.includes('formations')))op.troops=s.playerArmy.formations.map(f=>f.troops);
 if(id==='math_c2_provisions'||id==='math_c4_granaries')op.issuedRations=rationSchedule(op.troops as number[],id==='math_c2_provisions'?100:rules.battle.rationCapacity);
 if(context==='provision'){op.rounds=s.prep.rounds;op.troopsPerRice=rules.battle.rationCapacity;}
 if(context==='warchest'){op.opening=s.resources.currency;op.itemCount=sum(s.prep.equipment);op.itemCost=80;}
 return op;
}
export function supplyOrderAffordable(s:State,id:string){return template(id).variants.some(v=>Number(solve(id,bind(s,id,v.operands,'order')).rice)<=s.resources.food);}
export function generate(s:State,id:string,context:Challenge['context'],orderId:string,now=0):Challenge{
 const key=s.chapterIndex+':'+orderId,old=s.variants[key],t=template(id);
 if(old&&(old.attempts>0||old.resolved))return structuredClone(old);
 let variants:Array<{id:string;operands:Record<string,unknown>;answer:Answer}>=t.variants;
 if(id==='math_c2_provisions'||id==='math_c4_granaries')variants=variants.filter(v=>Number(solve(id,bind(s,id,v.operands,context)).rice)<=s.resources.food);
 if(!variants.length)throw Error('Not enough Rice for a full issued-ration plan. Restore stores before issuing it.');
 const v=variants.find(v=>v.id===old?.variantId)??variants[roll(s,0,variants.length-1)],op=bind(s,id,v.operands,context);
 const c:Challenge={answerPolicy:answerPolicy(id),id:key,templateId:id,variantId:v.id,operands:op,answer:solve(id,op),fields:t.answerFields,attempts:0,floor:old?.floor??1,submitted:[],hints:old?.hints??0,adviserShown:false,paid:{},context,orderId,resolved:false,openedAt:now,firstSubmittedAt:null};
 s.variants[key]=structuredClone(c);return c;
}
export function prompt(c:Challenge){const op={...c.operands};(op.ratio as number[]|undefined)?.forEach((v,i)=>op['ratio'+i]=v);if(op.troops)op.troopList=(op.troops as number[]).join(', ');if(op.issuedRations)op.rationList=(op.issuedRations as number[]).join(', ');return text(template(c.templateId).promptStringId).replace(/\{(\w+)\}/g,(_,k)=>String(op[k]??'?'));}
export function worked(c:Challenge):string[]{const op=c.operands,vals=Object.entries(c.answer).map(([k,v])=>`${k}: ${v}`).join(' · ');
 if(op.issuedRations)return [`Issued Rice per period: ${(op.issuedRations as number[]).join(' + ')} = ${sum(op.issuedRations as number[])}.`,`${sum(op.issuedRations as number[])} × ${op.rounds??op.travelPeriods} = ${c.answer.rice} Rice.`,vals];
 if(c.templateId==='math_battle_provision'){const packs=rationSchedule(op.troops as number[],Number(op.troopsPerRice));return [`Complete packs per formation: ${packs.join(' + ')} = ${sum(packs)}.`,`${sum(packs)} × ${op.rounds} = ${c.answer.rice} Rice.`,vals];}
 return [text(template(c.templateId).hintStringIds[0]),text(template(c.templateId).hintStringIds[1]),vals];
}
export function estimateQuality(c:Challenge){if(typeof c.answer[c.fields[0]]==='string')return 250;let accuracy=0;for(const k of c.fields){const correct=Number(c.answer[k]),entered=normalize(c.submitted.at(-1)?.[k])??0;accuracy+=Math.max(0,1000-Math.floor(Math.abs(entered-correct)*1000/Math.max(Math.abs(correct),1)));}return 250+round(accuracy,300,1000*c.fields.length);}
