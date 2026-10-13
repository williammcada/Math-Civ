import rules from '../content/rules-v03.json';
import {balance} from '../content/registry';
import type {Path,Resource,State} from './types';
import {round,sum} from './fixedPoint';
import {delta,event} from './effects';
export {rules};
export function rationSchedule(troops:number[],capacity=rules.battle.rationCapacity){
 if(!Number.isSafeInteger(capacity)||capacity<1||troops.some(t=>!Number.isSafeInteger(t)||t<0))throw Error('Invalid ration schedule');
 return troops.map(t=>Math.floor((t+capacity-1)/capacity));
}
export const battleQuota=(troops:number[])=>sum(rationSchedule(troops));
export const campaignQuota=(troops:number[])=>sum(rationSchedule(troops,balance.economy.troopsPerRice));
export function planningDividend(s:State,id:string,path:Path,resource:Resource,base:number){
 if(path==='proceedEstimate'||path==='abandon')return 0;
 const key='dividend:'+id;if(s.flags[key])return 0;
 const amount=round(base,rules.dividendPerThousand[path],1000),before=s.resources[resource];
 if(amount)delta(s,'resources.'+resource,amount,'planning.dividend');
 s.flags[key]=true;const credited=s.resources[resource]-before;
 event(s,'PLANNING_DIVIDEND',id,{resource,base,rate:rules.dividendPerThousand[path],earned:amount,credited,overflow:amount-credited});
 if(path==='attempt1'&&amount)event(s,'PRECISION_AWARDED','planning.dividend',{resource,amount:credited});
 return credited;
}
export const purchasedTemplate=(id:string)=>['math_c2_provisions','math_c4_granaries','math_battle_provision','math_battle_warchest'].includes(id);
