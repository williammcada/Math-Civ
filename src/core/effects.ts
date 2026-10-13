import type {State,Resource,Resources,Event} from './types';
import {clamp,round,nearest10,sum} from './fixedPoint';
export const resources:Resource[]=['food','currency','materials','authority'];
export function event(s:State,type:string,key:string,detail?:Record<string,unknown>){s.eventLog.push({type,key,chapter:s.chapterIndex,detail});}
const numericPaths=new Set(['resources.food','resources.currency','resources.materials','resources.authority','edo.estimatedHouseholds','edo.prosperity','edo.publicOrder','edo.defense','edo.infrastructure','edo.taxRatePercent','edo.laborAllocation.farms','edo.laborAllocation.workshops','edo.laborAllocation.works','diplomacy.coalitionCohesion','diplomacy.kobayakawaCommitment','diplomacy.intelligence','threats.uesugiPressure','threats.westernMomentum','playerArmy.readiness','playerArmy.campaignSupplyReserveRice','playerArmy.protectedBattleRice','playerArmy.fieldworkTier']);
export function get(s:unknown,path:string):unknown{return path.split('.').reduce<unknown>((a,k)=>a&&typeof a==='object'?(a as Record<string,unknown>)[k]:undefined,s);}
function set(s:State,path:string,value:unknown){const parts=path.split('.');const parent=parts.slice(0,-1).reduce<unknown>((a,k)=>(a as Record<string,unknown>)[k],s) as Record<string,unknown>;parent[parts.at(-1)!]=value;}
export function delta(s:State,path:string,value:number,key:string){if(!numericPaths.has(path))throw Error('Unsafe path '+path);const before=Number(get(s,path));let after=before+value;const cap=path==='resources.authority'||/^(diplomacy|threats)\./.test(path)||/edo\.(prosperity|publicOrder|defense|infrastructure)$/.test(path)||path==='playerArmy.readiness'?100:9999;after=clamp(after,0,cap);set(s,path,after);const e:Event={type:'RESOURCE_CHANGED',key,chapter:s.chapterIndex,before,delta:after-before,after,detail:{path,requested:value,overflow:Math.max(0,before+value-after)}};s.eventLog.push(e);}
export function canPay(s:State,cost:Partial<Resources>){return resources.every(r=>Number.isInteger(cost[r]??0)&&(cost[r]??0)>=0&&s.resources[r]>=(cost[r]??0));}
export function pay(s:State,cost:Partial<Resources>,key:string){if(!canPay(s,cost))throw Error('Unaffordable');resources.forEach(r=>{if(cost[r])delta(s,'resources.'+r,-cost[r]!,key);});}
export function effects(s:State,list:unknown[],q=1000,allocation?:Record<string,number|string>,committed=0){
 for(const raw of list){const e=raw as Record<string,unknown>;
  if(typeof e.path==='string'){
   if(typeof e.delta==='number'){delta(s,e.path,e.scalable===true?round(e.delta,q,1000):e.delta,'effect');}
   else if(e.deltaFromCommitted){delta(s,e.path,round(committed,q,1000),'reserve');}
   else if(e.set!==undefined){if(!['playerArmy.locationId','playerArmy.active','playerArmy.routeState'].includes(e.path))throw Error('Unsafe set');set(s,e.path,e.set);}
   else if(e.setAtOrAboveEffectPerThousand){const t=e.setAtOrAboveEffectPerThousand as {value:number;set:unknown};if(q>=t.value)set(s,e.path,t.set);}
  }else if(e.flag){s.flags[String(e.flag)]=e.value as string|number|boolean;}
  else if(e.flagAtEffectPerThousand){const t=e.flagAtEffectPerThousand as {min:number;flag:string;value:boolean};if(q>=t.min)s.flags[t.flag]=t.value;}
  else if(e.nodeId){const t=e.statusAtOrAboveEffectPerThousand as {min:number;status:string}|undefined;if(e.status)s.map[String(e.nodeId)]=String(e.status);else if(t&&q>=t.min)s.map[String(e.nodeId)]=t.status;}
  else if(e.allocationPath&&allocation){s.edo.laborAllocation={farms:Number(allocation.farms),workshops:Number(allocation.workshops),works:Number(allocation.works)};}
  else if(e.formationTroopsTotalDelta){const total=nearest10(round(Number(e.formationTroopsTotalDelta),q,1000));let assigned=0;s.playerArmy.formations.forEach((f,i)=>{const n=i===2?total-assigned:nearest10(round(total,(e.distributionBasisPoints as number[])[i],10000));assigned+=n;const before=f.troops;f.troops+=n;event(s,'FORMATION_STRENGTH_CHANGED',f.id,{before,after:f.troops,added:n});});}
  else if(e.effectAtOrAbovePerThousand!==undefined){if(q>=Number(e.effectAtOrAbovePerThousand)){s.playerArmy.fieldworkTier=Number((e.set as Record<string,number>)['playerArmy.fieldworkTier']);event(s,'FIELDWORKS_PREPARED','fieldworks',{tier:s.playerArmy.fieldworkTier});break;}}
 }
}
export function reconcileLabor(s:State){const a=s.edo.laborAllocation,total=sum(Object.values(a)),available=s.edo.estimatedHouseholds*2;if(total>available){a.farms=Math.floor(a.farms*available/total);a.workshops=Math.floor(a.workshops*available/total);a.works=available-a.farms-a.workshops;}}
