import {balance} from '../content/registry';
import {campaignQuota} from './logistics';
import type {State} from './types';
import {floor,ceil,round,nearest10,sum} from './fixedPoint';
import {delta,event} from './effects';
export function forecast(s:State){const e=s.edo,ef=(n:number)=>floor(n,300+e.publicOrder,400);const labor={farms:ef(e.laborAllocation.farms),workshops:ef(e.laborAllocation.workshops),works:ef(e.laborAllocation.works)};const troops=sum(s.playerArmy.formations.map(f=>f.troops));const route=s.playerArmy.routeState==='prepared'?1000:s.playerArmy.routeState==='damaged'?1500:1250;const base=campaignQuota(s.playerArmy.formations.map(f=>f.troops));const factor=s.chapterIndex===3?Number(s.flags.chapter2_route_supply_multiplier_per_thousand??1000):1000;
 return {labor,rice:floor(labor.farms,1,100)*balance.economy.farmRicePer100EffectiveLabor,materials:floor(labor.workshops,1,100)*balance.economy.workshopMaterialsPer100EffectiveLabor,progress:floor(labor.works,1,100)*2,infrastructure:Math.min(2,floor(labor.works,1,800)),taxable:floor(e.estimatedHouseholds,300+e.prosperity,400),treasury:round(floor(e.estimatedHouseholds,300+e.prosperity,400),e.taxRatePercent,200),civilian:ceil(e.estimatedHouseholds*5,1,100),garrison:ceil(e.garrisonTroops,1,100),field:s.playerArmy.active?ceil(base,route*factor,1000000):0,baseField:base,wages:ceil(troops,1,100)};}
export function mandatoryRice(s:State){const f=forecast(s);return f.civilian+f.garrison+f.field;}
export function administer(s:State){const f=forecast(s),q=Number(s.flags.labor_quality??1000);delta(s,'resources.food',round(f.rice,q,1000),'production.rice');delta(s,'resources.materials',round(f.materials,q,1000),'production.materials');delta(s,'resources.currency',f.treasury,'production.tax');if(s.projects.length)s.projects[0].progress+=round(f.progress,q,1000);else delta(s,'edo.infrastructure',round(f.infrastructure,q,1000),'maintenance');s.flags.labor_quality=1000;
 if(s.chapterIndex>=3&&s.diplomacy.coalitionCohesion>=40){delta(s,'resources.food',90,'kiyosu.contribution');delta(s,'resources.currency',40,'kiyosu.contribution');}
 if(s.flags.gifu_controlled&&!s.flags.gifu_stores_received){delta(s,'resources.materials',50,'gifu.stores');s.flags.gifu_stores_received=true;}
 s.flags.civilian_underfed=false;s.flags.unpaid_wages=false;
 // v0.4: fewer than 40% of workers on farms means a poor harvest, which raises the famine weight.
 {const total=sum(Object.values(s.edo.laborAllocation));s.flags.poor_harvest=total>0&&s.edo.laborAllocation.farms*10<total*4;}
 const feed=(need:number,key:string)=>{const paid=Math.min(need,s.resources.food);delta(s,'resources.food',-paid,key);return paid;};
 const civilian=feed(f.civilian,'upkeep.civilians');if(civilian<f.civilian){delta(s,'edo.publicOrder',-8,'shortage.civilians');delta(s,'edo.prosperity',-5,'shortage.civilians');s.flags.civilian_underfed=true;if(civilian*2<f.civilian)delta(s,'edo.publicOrder',-8,'shortage.severe');}
 if(feed(f.garrison,'upkeep.garrison')<f.garrison)delta(s,'edo.defense',-6,'shortage.garrison');
 const covered=s.playerArmy.active?Math.min(s.playerArmy.campaignSupplyReserveRice,f.baseField):0;s.playerArmy.campaignSupplyReserveRice-=covered;const field=feed(f.field-covered,'upkeep.field')+covered;
 if(field<f.field){delta(s,'playerArmy.readiness',-10,'shortage.field');if(field*2<f.field){delta(s,'playerArmy.readiness',-10,'shortage.severe');s.playerArmy.formations.forEach(u=>u.troops=nearest10(round(u.troops,9700,10000)));}}
 const paid=Math.min(s.resources.currency,f.wages);delta(s,'resources.currency',-paid,'upkeep.wages');if(paid<f.wages){delta(s,'playerArmy.readiness',-8,'unpaid.wages');delta(s,'resources.authority',-5,'unpaid.wages');s.flags.unpaid_wages=true;}
 const tax=({15:4,20:0,25:-4,30:-9} as Record<number,number>)[s.edo.taxRatePercent];delta(s,'edo.publicOrder',tax,'tax.order');event(s,'PRODUCTION_RESOLVED','administration',{...f});
}
