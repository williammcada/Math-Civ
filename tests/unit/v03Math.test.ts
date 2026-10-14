import {describe,it,expect} from 'vitest';
import {math,template} from '../../src/content/registry';
import {answerPolicy,solve,literal,validAnswer,equivalent,generate} from '../../src/core/mathEngine';
import {createState,reduce} from '../../src/core/reducer';
import {rationSchedule,battleQuota} from '../../src/core/logistics';
import {forecast} from '../../src/core/economy';
import type {State,Command,Answer} from '../../src/core/types';
function step(s:State,c:Command){const r=reduce(s,c);expect(r.events[0]?.type,JSON.stringify(r.events)).not.toBe('RULE_VIOLATION');return r.state;}
function independent(id:string,o:Record<string,any>):Answer{const t=template(id),f=t.answerFields;let n:any;
 switch(t.workedMethod){
 case 'ratio_share':return Object.fromEntries(f.map((key,i)=>[key,o.total/o.ratio.reduce((a:number,b:number)=>a+b,0)*o.ratio[i]]));
 case 'percent_and_remainder':return {[f[0]]:o.total/100*o.firstPercent,[f[1]]:o.total/100*(100-o.firstPercent)};
 case 'percent_of':n=o.whole/100*o.percent;break;
 case 'area_then_unit_rate':n=o.length*o.width/o.coveragePerBundle;break;
 case 'area_times_rate':n=o.length*o.width*o.materialsPerSquare;break;
 case 'rectangle_perimeter':n=o.length+o.width+o.length+o.width;break;
 case 'distance_rate_time':n=o.distance/o.distancePerDay;break;
 case 'purchase_lots':n=o.budget/o.lotCost*o.ricePerLot;break;
 case 'issued_supply':n=o.issuedRations.reduce((a:number,b:number)=>a+b,0)*(o.rounds??o.travelPeriods);break;
 case 'formation_supply':n=o.troops.map((x:number)=>Math.trunc(x/o.troopsPerRice)+(x%o.troopsPerRice?1:0)).reduce((a:number,b:number)=>a+b,0)*o.rounds;break;
 case 'ledger_balance':n=o.opening+o.inflow-o.outflow;break;
 case 'purchase_remainder':n=o.opening-o.itemCount*o.itemCost;break;
 case 'affordable_unit_rate_compare':{const best=o.options.filter((x:any)=>x.cost<=o.budget).sort((a:any,b:any)=>b.cohesion/b.cost-a.cohesion/a.cost)[0];if(f[1])return {[f[0]]:best.id,[f[1]]:Math.round(best.cohesion/best.cost*1000)/100};n=best.id;break;}
 // v0.5 methods, solved a second way (repeated addition / per-unit steps) to cross-check the engine
 case 'fraction_remainder':{const part=o.total/o.denominator;let v=0;for(let i=0;i<o.numerator;i++)v+=part;return {[f[0]]:v,[f[1]]:o.total-v};}
 case 'decimal_purchase':{let money=o.budget*4,bales=0;const price=o.price*4;while(money>=price-1e-9){money-=price;bales++;}n=Math.round(bales*o.ricePerBale*100)/100;break;}
 case 'mean_of_readings':n=Math.round(o.readings.reduce((a:number,b:number)=>a+b,0)/o.readings.length*1000)/1000;break;
 case 'volume_times_rate':n=o.materialsPerCube*o.depth*o.width*o.length;break;
 case 'scale_then_rate':n=o.mapCm/o.kmPerDay*o.kmPerCm;break;
 case 'compare_routes':n=o.slowKm/o.slowKmPerDay-o.fastKm/o.fastKmPerDay;break;
 case 'ledger_lines':{const bal=o.entries.map((_:any,i:number)=>o.opening+o.entries.slice(0,i+1).reduce((a:number,e:any)=>a+e.amount,0));return {[f[0]]:Math.min(o.opening,...bal),[f[1]]:bal.at(-1)};}
 case 'percent_product_compare':n=o.options.sort((a:any,b:any)=>b.rainPercent/100*b.reliabilityPercent/100-a.rainPercent/100*a.reliabilityPercent/100)[0].id;break;
 default:throw Error(t.workedMethod);
 }return {[f[0]]:n};}
describe('v0.3 mathematical fairness',()=>{
 for(const t of math.templates)for(const v of t.variants)it(t.id+' '+v.id+' independent exact key',()=>{expect(answerPolicy(t.id)).toBe(t.id==='math_battle_provision'?'rounding_up':'exact');const key=independent(t.id,structuredClone(v.operands));expect(solve(t.id,v.operands)).toEqual(key);expect(key).toEqual(v.answer);});
 it('exact equivalent notation; no malformed grouping or executable expressions',()=>{for(const value of ['321','321.0','642/2','3,210/10','+321'])expect(equivalent(value,321)).toBe(true);for(const value of ['3,21','31,0','1/0','1e2','2+2','NaN','Infinity',''])expect(literal(value)).toBeNull();expect(equivalent('317.7',321)).toBe(false);expect(equivalent('.5','1/2')).toBe(true);});
 it('capacity boundaries for every residue at 100 and 300',()=>{for(const cap of [100,300])for(let x=cap-1;x<=cap*3+1;x++){const expected=Math.trunc(x/cap)+(x%cap>0?1:0);expect(rationSchedule([x],cap)).toEqual([expected]);}expect(rationSchedule([3550,3750,3290],100)).toEqual([36,38,33]);expect(rationSchedule([3550,3750,3290],300)).toEqual([12,13,11]);});
 it('live operands preserve 107 campaign rations, 36 battle rations; wages stay pooled',()=>{const s=createState();s.playerArmy.formations.forEach((f,i)=>f.troops=[3550,3750,3290][i]);s.resources.food=9999;const a=generate(s,'math_c2_provisions','order','c2_march_provisions');expect(a.operands.issuedRations).toEqual([36,38,33]);const g=generate(s,'math_c4_granaries','order','c4_forward_granaries');expect(g.operands.issuedRations).toEqual([12,13,11]);expect(forecast(s)).toMatchObject({baseField:107,wages:106});s.prep.rounds=12;expect(generate(s,'math_battle_provision','provision','provision').answer.rice).toBe(432);});
 it('bad notation costs nothing; valid wrong decimal/negative/large values cost only one Seal',()=>{for(const value of ['317.7','-99','999999999999']){let s=createState();s.resources.food=9999;s.chapterIndex=4;s.phase='orders';s=step(s,{type:'OPEN_ORDER',id:'c4_forward_granaries'});const before=structuredClone(s);expect(reduce(s,{type:'ANSWER',answer:{rice:'3,21'}}).state).toBe(s);s=step(s,{type:'ANSWER',answer:{rice:value}});expect(s.commandSeals).toBe(before.commandSeals-1);expect(s.resources).toEqual(before.resources);expect(s.activeOrder!.attempts).toBe(1);}});
 for(const failures of [0,1,2,3])it('full funded 12 rounds and diminishing dividend '+failures,()=>{let s=createState();s.phase='battle_provision';s.resources.food=1000;s.playerArmy.protectedBattleRice=200;s.playerArmy.formations.forEach((f,i)=>f.troops=[3550,3750,3290][i]);s=step(s,{type:'PREP_PROVISION',rounds:12});for(let i=0;i<failures;i++)s=step(s,{type:'ANSWER',answer:{rice:'1'}});if(failures===3){s=step(s,{type:'ADVISER'});s=step(s,{type:'COMPLETE',path:'adviser'});}else s=step(s,{type:'ANSWER',answer:{rice:'864/2'}});expect(s.prep.supply).toBe(12);expect(s.resources.food).toBe(1000-232+[43,22,9,0][failures]);expect(s.playerArmy.protectedBattleRice).toBe(0);expect(s.challengeRecords[0].masteryPoints).toBe([100,75,50,25][failures]);expect(reduce(s,{type:'COMPLETE',path:'adviser'}).state).toBe(s);});
 it('explicit unchecked whole spend buys only complete packs, no dividend',()=>{let s=createState();s.phase='battle_provision';s=step(s,{type:'PREP_PROVISION',rounds:5});s=step(s,{type:'ANSWER',answer:{rice:'317.7'}});expect(reduce(s,{type:'COMPLETE',path:'proceedEstimate'}).state).toBe(s);const before=s.resources.food,q=battleQuota(s.playerArmy.formations.map(f=>f.troops));s=step(s,{type:'COMPLETE',path:'proceedEstimate',answer:{rice:'100'}});expect(s.prep.supply).toBe(Math.floor(100/q));expect(s.resources.food).toBe(before-Math.floor(100/q)*q);expect(s.challengeRecords[0].masteryPoints).toBe(0);expect(s.eventLog.some(e=>e.type==='PLANNING_DIVIDEND')).toBe(false);});
 it('exact road and lot guards reject future fractional content',()=>{for(const t of math.templates){if(!['area_then_unit_rate','purchase_lots','distance_rate_time'].includes(t.workedMethod))continue;const op:any=structuredClone(t.variants[0].operands);if(t.workedMethod==='area_then_unit_rate')op.coveragePerBundle=op.length*op.width+1;if(t.workedMethod==='purchase_lots')op.budget++;if(t.workedMethod==='distance_rate_time')op.distance++;expect(()=>solve(t.id,op)).toThrow('divisible');}});
});
