import {battle as data,balance} from '../content/registry';
import type {State,Formation,Point,Side,BattleAction,Result,Battle,TacticalPlan,Intent,ReserveEntry} from './types';
import {floor,round,clamp,nearest10,sum} from './fixedPoint';
import {roll} from './rng';
import {delta,event} from './effects';
import {battleQuota,rules} from './logistics';

const defs=data.terrainDefinitions as Record<string,{moveCost?:number;passable?:boolean;defensePerThousand?:number;cavalryAttackPerThousand?:number;blocksVolleyLine?:boolean;rangedAttackPerThousand?:number}>;
const dirs=[{x:0,y:-1},{x:-1,y:0},{x:1,y:0},{x:0,y:1}];
const sides:Side[]=['east','west'];
const eq=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;
const distance=(a:Point,b:Point)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export const alive=(f:Formation)=>!f.exited&&!f.shattered&&!f.pendingReserve;
const undefeated=(f:Formation)=>!!f.pendingReserve||alive(f)&&!f.routed;
export function kobayakawaBand(commitment:number){return rules.kobayakawa.bands.find(b=>commitment>=b.min&&commitment<=b.max)??rules.kobayakawa.bands.at(-1)!;}
export function terrain(s:State,p:Point){return s.battle?.terrain[p.y]?.[p.x]??'stream';}
export function weather(s:State){return s.battle?.scenarioId==='convoy'?{id:'clear'}:data.weatherByRound[(s.battle?.round??1)-1]??{id:'clear'};}
export function occupant(s:State,p:Point){return s.battle!.formations.find(f=>alive(f)&&eq(f,p));}
export function activeUnit(s:State){const b=s.battle;return b?.formations.find(f=>f.id===b.queue[b.activeIndex]);}
export function supplied(s:State,f:Formation){return f.auxiliary?(f.auxiliaryRounds??0)>0:s.battle!.currentSupply[f.side];}
export function suppressed(f:Formation){return f.suppressionUntilActivation!==undefined&&(f.activations??0)<=f.suppressionUntilActivation;}
const inside=(s:State,p:Point)=>p.y>=0&&p.y<s.battle!.terrain.length&&p.x>=0&&p.x<s.battle!.terrain[0].length;
const vacant=(s:State,p:Point)=>inside(s,p)&&!occupant(s,p)&&!(s.battle!.wagon&&!s.battle!.wagon.delivered&&eq(s.battle!.wagon,p));
export function reachable(s:State,u:Formation,allowance=u.move+(u.forced?1:0)){
 if(suppressed(u))allowance=Math.min(1,allowance);
 const queue=[{x:u.x,y:u.y,cost:0}],result:Array<Point&{cost:number}>=[],seen=new Map<string,number>([[u.x+','+u.y,0]]);
 while(queue.length){queue.sort((a,b)=>a.cost-b.cost||a.y-b.y||a.x-b.x);const p=queue.shift()!;
  if(p.cost>0){result.push(p);if(s.battle!.formations.some(f=>alive(f)&&!f.routed&&f.side!==u.side&&distance(p,f)===1))continue;}
  for(const d of dirs){const q={x:p.x+d.x,y:p.y+d.y},t=defs[terrain(s,q)];if(!vacant(s,q)||!t||t.passable===false)continue;
   const cost=p.cost+(t.moveCost??1),key=q.x+','+q.y;if(cost>allowance||cost>=(seen.get(key)??Infinity))continue;seen.set(key,cost);queue.push({...q,cost});}}
 return result;
}
function reachBlocked(s:State,u:Formation,t:Formation,ranged:boolean):string|null {
 const d=distance(u,t);if(!ranged)return d===1?null:'Strike reaches one adjacent square; no diagonals.';
 if(u.archetype!=='arquebus')return 'Only gunners can fire.';
 if(s.battle!.ammo[u.side]<=0)return 'No ammunition remains.';
 if(d<1||d>u.range)return `Fire reaches up to ${u.range} squares.`;
 if(u.x!==t.x&&u.y!==t.y)return 'Fire needs a straight row or column.';
 for(let n=1;n<d;n++){const p={x:u.x+(t.x-u.x)/d*n,y:u.y+(t.y-u.y)/d*n};if(defs[terrain(s,p)]?.blocksVolleyLine||occupant(s,p)||s.battle!.wagon&&eq(s.battle!.wagon,p))return 'Terrain or a unit blocks the line of fire.';}
 return null;
}
export function attackBlocked(s:State,u:Formation,t:Formation,kind='attack'):string|null {
 if(!alive(u)||u.routed)return 'This unit cannot attack while retreating.';
 if(u.ap<1)return 'No actions remain.';if(u.attacked)return 'One primary attack per activation; move or defend instead.';
 if(!alive(t)||t.side===u.side)return 'Choose an enemy on the field.';
 if(kind==='charge'&&(u.archetype!=='cavalry'||!supplied(s,u)||terrain(s,u)==='forest'||suppressed(u)))return 'Charge needs supplied, unsuppressed cavalry outside a forest.';
 if(kind==='suppress'&&s.battle!.plans[u.side]!=='fire_discipline'&&!(s.battle!.scenarioId==='convoy'&&u.side==='east'))return 'Suppress requires the Fire Discipline plan.';
 return reachBlocked(s,u,t,kind==='volley'||kind==='suppress');
}
export const canAttack=(s:State,u:Formation,t:Formation,kind='attack')=>attackBlocked(s,u,t,kind)===null;
function retaliationEligible(s:State,d:Formation,a:Formation,loss:number,moraleLoss:number,kind:string){
 return kind!=='suppress'&&alive(d)&&!d.routed&&d.troops-loss>=d.startTroops/5&&d.morale-moraleLoss>=25&&d.retaliationRound!==s.battle!.round&&!suppressed(d)&&reachBlocked(s,d,a,d.archetype==='arquebus')===null;
}
export function deploymentTiles(s:State){if(s.battle!.scenarioId==='convoy')return [];return data.deploymentZones.east.filter(p=>!!s.flags.gifu_controlled||p.x===0);}
export function deploymentBlocked(s:State,id:string,p:Point):string|null {
 const u=s.battle!.formations.find(f=>f.id===id);if(!u||u.side!=='east'||u.pendingReserve)return 'Select an on-field Eastern formation.';
 if(!deploymentTiles(s).some(t=>eq(t,p)))return s.flags.gifu_controlled?'Use a marked starting square in columns 1–2.':'Use a marked starting square in column 1; taking Gifu opens column 2.';
 const f=occupant(s,p);return f&&f.id!==id?'That starting square is occupied.':null;
}
function emptyBattle(formations:Formation[],grid:string[][],supply:Record<Side,number>,ammo:Record<Side,number>,scenarioId:Battle['scenarioId']):Battle {
 return {rulesVersion:2,scenarioId,round:1,formations,queue:[],activeIndex:0,supply,quota:{east:battleQuota(formations.filter(f=>f.side==='east').map(f=>f.troops)),west:battleQuota(formations.filter(f=>f.side==='west').map(f=>f.troops))},currentSupply:{east:false,west:false},ammo,initialSupply:supply.east,suppliedRounds:0,terrain:grid,rallyUsed:false,rallies:{east:{uses:0,lastRound:-2},west:{uses:0,lastRound:-2}},resupplied:{east:false,west:false},auxSide:null,dispatchPending:false,result:null,scores:{east:0,west:0},campChecks:{east:0,west:0},councilPending:false,reviewSeen:false,finalized:false,outcomeReason:'',plans:{east:'standard',west:'standard'},reserveEntries:{east:'north',west:'north'},planLocked:false,pontoonUsed:{east:false,west:false},intents:{}};
}
export function createBattle(s:State){
 const a=clamp(floor(s.resources.authority-50,1,5),-10,10),r=clamp(floor(s.playerArmy.readiness-50,1,10),-5,5),coh=balance.battle.cohesionMoraleBands.find(b=>s.diplomacy.coalitionCohesion>=b.min&&s.diplomacy.coalitionCohesion<=b.max)!.morale;
 const momentumTroops=clamp((s.threats.westernMomentum-rules.westernMomentum.neutral)*rules.westernMomentum.troopsPerPoint,0,rules.westernMomentum.maxTroops),gifuGarrison=s.flags.gifu_controlled?0:rules.gifu.garrisonTroops,total=nearest10(rules.westernMomentum.baseTroops+s.westernState.troopGain+momentumTroops+gifuGarrison),recruits=[nearest10(round(total,3400,9000)),nearest10(round(total,3000,9000)),0];recruits[2]=total-recruits[0]-recruits[1];let wi=0;
 const formations:Formation[]=data.formations.filter(f=>f.side!=='conditional').map(f=>{
  const east=f.side==='east',i=s.playerArmy.formations.findIndex(u=>u.id===f.id),p=(data.defaultDeployment as Record<string,Point>)[f.id];
  const troops=nearest10(clamp(east?s.playerArmy.formations[i].troops:f.baseTroops+recruits[wi++],f.baseTroops/2,Math.floor(f.baseTroops*1.25/10)*10));
  return {id:f.id,side:f.side as Side,archetype:f.archetype as Formation['archetype'],baseTroops:f.baseTroops,troops,startTroops:troops,morale:clamp(f.baseMorale+(east?a+r+coh:0)),equipmentPoints:east?s.prep.equipment[i]:0,commanderRating:f.commanderRating,move:f.move,range:f.range,x:east&&!s.flags.gifu_controlled?0:p.x,y:p.y,ap:0,attacked:false,brace:false,forced:false,routed:false,exited:false,shattered:false,auxiliary:false};});
 const grid=structuredClone(data.terrainGrid);for(const p of (data.fieldworkTilesByTier as Record<string,Point[]>)[String(s.playerArmy.fieldworkTier)]??[])grid[p.y][p.x]='fieldworks';
 const west=s.westernState.resources,quota=battleQuota(formations.filter(f=>f.side==='west').map(f=>f.troops)),packs=Math.min(west.food>=quota*16?12:10,Math.floor(west.food/quota)),ammo=Math.min(12,Math.floor(west.materials/10));
 west.food-=packs*quota;west.materials-=ammo*10;
 const gun=formations.find(f=>f.side==='west'&&f.archetype==='arquebus')!;if(west.currency>=rules.battle.equipmentCost){west.currency-=rules.battle.equipmentCost;gun.equipmentPoints=1;}
 s.battle=emptyBattle(formations,grid,{east:s.prep.supply,west:packs},{east:s.prep.ammo,west:ammo},'sekigahara');
 event(s,'WESTERN_PURCHASES','battle.preparation',{rice:packs*quota,materials:ammo*10,equipment:gun.equipmentPoints*rules.battle.equipmentCost,rounds:packs,momentumTroops,levies:rules.westernMomentum.baseTroops,gifuGarrison});
 if(s.flags.hidetada_delay_risk){const chanceBp=s.playerArmy.routeState==='prepared'?rules.hidetada.arrivalWithRoadPerThousand:rules.hidetada.arrivalPerThousand;s.flags.hidetada_arrives=roll(s,0,999)<chanceBp;event(s,'HIDETADA_ROUTE',s.flags.hidetada_arrives?'on_time':'delayed',{chancePerThousand:chanceBp});}
 // Authored, deterministic priorities; every unlock comes from funded campaign preparation.
 const plan:TacticalPlan=s.westernState.ogakiDefense>0?'engineer':!s.westernState.routeDamaged&&!s.flags.gifu_controlled?'flanking':gun.equipmentPoints?'fire_discipline':'standard';
 setPlan(s,'west',plan,formations.find(f=>f.side==='west'&&f.archetype==='spears')!.id);
}
export function planBlocked(s:State,side:Side,plan:TacticalPlan):string|null {
 const b=s.battle!;if(b.scenarioId!=='sekigahara')return 'The convoy uses its trained escort.';
 if(plan==='standard')return null;
 if(plan==='flanking')return side==='east'?((['prepared','restored'].includes(s.playerArmy.routeState)&&s.flags.gifu_controlled)?null:'Repair the road and secure Gifu to send a reserve.'):(!s.westernState.routeDamaged&&!s.flags.gifu_controlled?null:'Western route or Gifu access is lost.');
 if(plan==='engineer')return side==='east'?(s.playerArmy.fieldworkTier>=1?null:'Prepare at least one fieldworks tier first.'):(s.westernState.ogakiDefense>0?null:'The West must fund fortifications.');
 if(plan==='fire_discipline')return b.formations.some(f=>f.side===side&&f.archetype==='arquebus'&&f.equipmentPoints>=1)?null:'Equip your gunners with at least one paid equipment point.';
 return 'Unknown tactical plan.';
}
export function setPlan(s:State,side:Side,plan:TacticalPlan,reserve?:string,entry:ReserveEntry='north'){
 const b=s.battle!;if(b.planLocked)throw Error('Plans are locked after deployment.');const reason=planBlocked(s,side,plan);if(reason)throw Error(reason);
 const units=b.formations.filter(f=>f.side===side&&!f.auxiliary);for(const f of units){if(f.pendingReserve){f.pendingReserve=false;const home=(data.defaultDeployment as Record<string,Point>)[f.id];const p=side==='east'?deploymentTiles(s).find(t=>vacant(s,t))??null:entryTile(s,home);if(!p)throw Error('No place for the returning reserve.');Object.assign(f,p);}f.engineer=false;}
 if(side==='east'){for(const p of Object.values(data.fieldworkTilesByTier).flat())if(b.terrain[p.y][p.x]==='fieldworks')b.terrain[p.y][p.x]=data.terrainGrid[p.y][p.x];if(plan!=='engineer')for(const p of (data.fieldworkTilesByTier as Record<string,Point[]>)[String(s.playerArmy.fieldworkTier)]??[])b.terrain[p.y][p.x]='fieldworks';}
 if(plan==='flanking'){const unit=units.find(f=>f.id===reserve)??units.find(f=>f.archetype==='spears')!;unit.pendingReserve=true;unit.ap=0;}
 if(plan==='engineer')units.find(f=>f.archetype==='spears')!.engineer=true;
 if(!['north','south'].includes(entry))throw Error('Choose north or south for reserve entry.');b.reserveEntries[side]=entry;
 b.plans[side]=plan;event(s,'PLAN_SELECTED',side+'.'+plan,{side,plan,source:plan==='flanking'?'road + Gifu':plan==='engineer'?'funded fieldworks':plan==='fire_discipline'?'paid gunner equipment':'always available'});
}
export function deploy(s:State,id:string,p:Point){const reason=deploymentBlocked(s,id,p);if(reason)throw Error(reason);Object.assign(s.battle!.formations.find(f=>f.id===id)!,p);}
export function entryTile(s:State,origin:Point,bank?:Side):Point|null {
 const queue=[origin],seen=new Set<string>();while(queue.length){const p=queue.shift()!,key=p.x+','+p.y;if(seen.has(key)||!inside(s,p)||bank==='east'&&p.x>4||bank==='west'&&p.x<6)continue;seen.add(key);
  if(defs[terrain(s,p)]?.passable!==false&&terrain(s,p)!==(bank==='east'?'west_camp':'east_camp')&&vacant(s,p))return p;for(const d of dirs)queue.push({x:p.x+d.x,y:p.y+d.y});}return null;
}
function allocateRound(s:State){const b=s.battle!;for(const side of sides){b.currentSupply[side]=b.supply[side]>0;if(b.currentSupply[side])b.supply[side]--;event(s,'ROUND_SUPPLY_ALLOCATED',side,{round:b.round,supplied:b.currentSupply[side],futurePacks:b.supply[side],quota:b.quota[side]});}}
function consumeRound(s:State,endingEarly=false){const b=s.battle!;for(const side of sides){if(side==='east'&&b.currentSupply[side])b.suppliedRounds++;if(!endingEarly)b.formations.filter(f=>f.side===side&&alive(f)&&!supplied(s,f)).forEach(f=>f.morale=clamp(f.morale-rules.battle.unsuppliedMoraleLoss));event(s,'ROUND_SUPPLY_CONSUMED',side,{round:b.round,supplied:b.currentSupply[side]});b.currentSupply[side]=false;}
 for(const f of b.formations)if(f.auxiliary&&f.auxiliaryRounds)f.auxiliaryRounds--;}
function startRound(s:State){const b=s.battle!;
 if(b.scenarioId==='sekigahara'){
  if(b.round>=3)for(const side of sides)for(const f of b.formations.filter(f=>f.side===side&&f.pendingReserve)){const x=side==='east'?3:6,preferred={x,y:b.reserveEntries[side]==='south'?7:0},p=entryTile(s,preferred,side)??entryTile(s,{x,y:7},side);if(p){Object.assign(f,p);f.pendingReserve=false;event(s,'RESERVE_ENTERED',f.id,{round:b.round,side,source:'flanking'});}else event(s,'RESERVE_DELAYED',f.id,{side,entry:b.reserveEntries[side],reason:'No free passable tile on its own bank'});}
  if(b.round===4)event(s,'AUXILIARY_WARNING','kobayakawa.round5',{round:5});
  if(b.round>=5&&(b.auxSide===null||s.flags.auxiliary_delayed||(b.auxEntryRound!==undefined&&b.round>=b.auxEntryRound&&!b.formations.some(u=>u.id==='aux_kobayakawa')&&b.auxSide!=='inactive'))){
   const first=b.auxSide===null,band=kobayakawaBand(s.diplomacy.kobayakawaCommitment),side=b.auxSide??band.side as Side|'inactive';
   if(first){b.auxSide=side;b.auxEntryRound=band.entryRound;b.auxTroopsPerThousand=band.troopsPerThousand;b.dispatchPending=true;}
   const due=side!=='inactive'&&b.round>=(b.auxEntryRound??5);
   if(due){const f=data.formations.find(f=>f.id==='aux_kobayakawa')!,p=entryTile(s,f.entryBySide![side as Side]);s.flags.auxiliary_delayed=!p;const troops=nearest10(round(f.baseTroops,b.auxTroopsPerThousand??1000,1000));if(p&&!b.formations.some(u=>u.id===f.id)){b.formations.push({id:f.id,side:side as Side,archetype:'spears',baseTroops:f.baseTroops,troops,startTroops:troops,morale:f.baseMorale,equipmentPoints:0,commanderRating:f.commanderRating,move:f.move,range:f.range,...p,ap:0,attacked:false,brace:false,forced:false,routed:false,exited:false,shattered:false,auxiliary:true,auxiliaryRounds:12});const shock=rules.kobayakawa.entryMoraleShock;for(const g of b.formations.filter(g=>alive(g)&&g.side!==side))g.morale=clamp(g.morale-shock);event(s,'KOBAYAKAWA_SHOCK',side,{side,morale:shock});if(!first)b.dispatchPending=true;}}
   if(first||due)event(s,'AUXILIARY_RESOLVED','kobayakawa.'+side,{delayed:s.flags.auxiliary_delayed??false,ownRations:12,band:band.id,entryRound:b.auxEntryRound,entered:b.formations.some(u=>u.id==='aux_kobayakawa')});}
  if(s.flags.hidetada_arrives&&b.round>=rules.hidetada.entryRound&&!b.formations.some(u=>u.id==='aux_hidetada')){const p=entryTile(s,rules.hidetada.entry,'east');if(p){const h=rules.hidetada;b.formations.push({id:'aux_hidetada',side:'east',archetype:'spears',baseTroops:h.troops,troops:h.troops,startTroops:h.troops,morale:h.morale,equipmentPoints:0,commanderRating:h.commanderRating,move:2,range:1,...p,ap:0,attacked:false,brace:false,forced:false,routed:false,exited:false,shattered:false,auxiliary:true,auxiliaryRounds:12});event(s,'RESERVE_ENTERED','aux_hidetada',{round:b.round,side:'east',source:'hidetada'});}}
 }
 allocateRound(s);
 // v0.5 (F3): the Gifu bonus applies only at Sekigahara; the convoy escort, warned of the raiders, acts first in round 1.
 const list=b.formations.filter(alive).sort((a,b)=>a.id.localeCompare(b.id)).map(f=>({id:f.id,score:f.commanderRating*50+f.morale+5*((b.round===1?(f.side==='east'?(s.playerArmy.routeState==='prepared'?5:0)+(s.flags.battle_initiative_plus_one?1:0)+(s.flags.main_force_tokaido?3:0):(b.scenarioId==='sekigahara'&&!s.flags.gifu_controlled?5:0)):0)+(terrain(s,f)==='road'?3:0)+roll(s,0,2))+(b.scenarioId==='convoy'&&b.round===1&&f.side==='east'?1000:0)}));
 list.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));b.queue=list.map(f=>f.id);b.activeIndex=0;
 for(const f of b.formations.filter(f=>f.side==='west'&&alive(f)&&!f.routed))b.intents[f.id]=chooseIntent(s,{...f,ap:2,attacked:false,defended:false,brace:false,forced:false});
 activate(s);
}
export function beginBattle(s:State){s.battle!.planLocked=true;s.phase='battle_round';updateRouts(s);if(!allRouted(s))startRound(s);}
function expireActivation(u:Formation){if(u.suppressionUntilActivation!==undefined&&(u.activations??0)>=u.suppressionUntilActivation)delete u.suppressionUntilActivation;}
function next(s:State){const u=activeUnit(s);if(u)expireActivation(u);s.battle!.activeIndex++;activate(s);}
function activate(s:State){const b=s.battle!;while(b.activeIndex<b.queue.length){const u=activeUnit(s);if(!u||!alive(u)){b.activeIndex++;continue;}u.activations=(u.activations??0)+1;u.brace=false;u.forced=false;u.attacked=false;u.defended=false;u.ap=2;if(u.routed){routMove(s,u);expireActivation(u);b.activeIndex++;continue;}return;}endRound(s);}
function routMove(s:State,u:Formation){const edge=u.side==='east'?0:s.battle!.terrain[0].length-1;if(u.x===edge){u.exited=true;event(s,'FORMATION_EXITED',u.id);return;}const moves=reachable(s,u,u.move).sort((a,b)=>Math.abs(a.x-edge)-Math.abs(b.x-edge)||a.cost-b.cost||a.y-b.y);if(moves.length)Object.assign(u,{x:moves[0].x,y:moves[0].y});if(u.x===edge){u.exited=true;event(s,'FORMATION_EXITED',u.id);}}
function finish(s:State,result:Result,reason:string){const b=s.battle!;if(b.finalized)return;b.finalized=true;b.result=result;b.outcomeReason=reason;b.councilPending=false;
 if(b.currentSupply.east||b.currentSupply.west)consumeRound(s,true);
 for(const side of sides){const rice=b.supply[side]*b.quota[side];if(side==='east')delta(s,'resources.food',rice,'unused.rations.return');else if(b.scenarioId==='sekigahara')s.westernState.resources.food=Math.min(9999,s.westernState.resources.food+rice);b.supply[side]=0;event(s,'UNUSED_RATIONS_RETURNED',side,{rice});}
 if(b.scenarioId==='convoy'){
  const delivered=b.wagon!.delivered&&b.wagon!.integrity>0,reward=delivered?(b.wagon!.integrity===3?60:30):0;delta(s,'resources.food',reward,'convoy.cargo');delta(s,'resources.authority',delivered?(b.wagon!.integrity===3?4:2):0,'convoy.cargo');
  s.flags.convoy_status=delivered?(b.wagon!.integrity===3?'intact':'damaged'):'lost';s.flags.convoy_done=true;s.commandSeals=b.convoySnapshot!.commandSeals;s.usedOrders=[...b.convoySnapshot!.usedOrders];s.phase='convoy_result';event(s,'CONVOY_RESOLVED',String(s.flags.convoy_status),{reward,integrity:b.wagon!.integrity,rounds:b.round});
 }else{delta(s,'resources.food',s.playerArmy.protectedBattleRice,'protected.rice.return');s.playerArmy.protectedBattleRice=0;s.phase='battle_result';}
 event(s,'BATTLE_ENDED',result,{scenario:b.scenarioId,reason,round:b.round});
}
function allRouted(s:State){const b=s.battle!;const east=b.formations.filter(f=>f.side==='east'&&!f.auxiliary).every(f=>!undefeated(f)),west=b.formations.filter(f=>f.side==='west'&&!f.auxiliary).every(f=>!undefeated(f));
 if(b.scenarioId==='convoy'){if(b.wagon!.integrity<=0||east){finish(s,'defeat','cargo_lost');return true;}if(west){b.wagon!.delivered=true;Object.assign(b.wagon!,rules.convoy.wagonExit);finish(s,'victory','raiders_routed');return true;}}
 else if(east||west){finish(s,east&&west?'draw':east?'defeat':'victory','core_rout');return true;}return false;
}
export function campHeld(s:State,side:Side){if(s.battle!.scenarioId==='convoy')return false;const p=side==='east'?data.objectives.westCamp:data.objectives.eastCamp,u=occupant(s,p);return !!u&&u.side===side&&!u.routed&&!s.battle!.formations.some(f=>alive(f)&&!f.routed&&f.side!==side&&distance(f,p)===1);}
export function scoreParts(s:State,side:Side){const b=s.battle!,own=b.formations.filter(f=>f.side===side),enemy=b.formations.filter(f=>f.side!==side&&!f.auxiliary);return {camp:campHeld(s,side)?40:0,defeated:15*enemy.filter(f=>!undefeated(f)).length,strength:round(sum(own.filter(f=>alive(f)||f.pendingReserve).map(f=>f.troops)),15,Math.max(1,sum(own.map(f=>f.startTroops))))};}
export function score(s:State,side:Side){return sum(Object.values(scoreParts(s,side)));}
function updateRouts(s:State){const b=s.battle!;let changed=true;while(changed){changed=false;for(const f of b.formations){if(!alive(f))continue;if(f.troops*5<f.startTroops){f.shattered=true;event(s,'FORMATION_SHATTERED',f.id,{cause:'below one fifth of starting troops'});continue;}if(f.morale<25&&!f.routed){f.routed=true;changed=true;event(s,'FORMATION_ROUTED',f.id,{cause:'morale below 25'});b.formations.filter(g=>alive(g)&&g.side===f.side&&g.id!==f.id&&distance(g,f)===1).forEach(g=>g.morale=clamp(g.morale-8));}}}}
function endRound(s:State){const b=s.battle!;consumeRound(s);updateRouts(s);if(allRouted(s))return;
 if(b.scenarioId==='convoy'){
  const w=b.wagon!,destination={x:w.x+1,y:w.y};const blocked=b.formations.some(f=>f.side==='west'&&alive(f)&&!f.routed&&(distance(f,w)===1||distance(f,destination)===1));
  if(!blocked&&vacant(s,destination)&&['road','bridge'].includes(terrain(s,destination))){Object.assign(w,destination);event(s,'WAGON_MOVED','convoy',{...destination,integrity:w.integrity});}
  if(eq(w,rules.convoy.wagonExit)){w.delivered=true;finish(s,'victory','wagon_delivered');return;}
 }else{
  for(const side of sides)b.campChecks[side]=campHeld(s,side)?b.campChecks[side]+1:0;
  if(b.campChecks.east>=2||b.campChecks.west>=2){finish(s,b.campChecks.east>=2&&b.campChecks.west>=2?'draw':b.campChecks.east>=2?'victory':'defeat','camp_held');return;}
  if(b.round===12&&!b.reviewSeen){b.reviewSeen=true;b.councilPending=true;b.scores={east:score(s,'east'),west:score(s,'west')};event(s,'BATTLE_COUNCIL','round12',{...b.scores});return;}
 }
 b.round++;startRound(s);
}
export function battleCouncil(s:State,choice:'open'|'continue'|'accept'){
 const b=s.battle!;if(b.scenarioId!=='sekigahara'||b.result||!b.reviewSeen)throw Error('The optional council is available after Round 12.');
 if(choice==='open'){b.councilPending=true;b.scores={east:score(s,'east'),west:score(s,'west')};return;}
 if(!b.councilPending)throw Error('Open the council first.');b.councilPending=false;
 if(choice==='accept'){b.scores={east:score(s,'east'),west:score(s,'west')};const d=b.scores.east-b.scores.west;finish(s,d>=10?'victory':d<=-10?'defeat':'draw','accepted_score');return;}
 event(s,'COUNCIL_CONTINUED','battle',{round:b.round});if(b.activeIndex>=b.queue.length){b.round++;startRound(s);}
}
export function combatPreview(s:State,a:Formation,d:Formation,kind='attack',dv=0,av=0){
 const b=s.battle!,atk=data.archetypes[a.archetype],def=data.archetypes[d.archetype],ta=defs[terrain(s,a)],td=defs[terrain(s,d)],ranged=kind==='volley'||kind==='suppress';
 const support=b.formations.some(f=>alive(f)&&!f.routed&&f.id!==a.id&&f.side===a.side&&distance(f,d)===1);
 const power=(troops:number,factors:number[])=>{let n=BigInt(troops)*1000000n,den=1n;for(const f of factors){n*=BigInt(f);den*=1000n;}return Number((n+den/2n)/den);};
 const attackPower=power(a.troops,[atk.attackPerThousand,700+a.morale*5,supplied(s,a)?1000:850,900+40*a.commanderRating,1000+50*a.equipmentPoints,a.archetype==='cavalry'?(ta.cavalryAttackPerThousand??1000):1000,ranged?(ta.rangedAttackPerThousand??1000):1000,ranged&&b.scenarioId==='sekigahara'&&b.round===1&&!(a.side==='east'&&s.flags.weather_scouted)?800:1000,ranged&&distance(a,d)===1?800:1000,kind==='charge'?1250:1000,support?1200:1000]);
 const fortification=d.side==='west'&&terrain(s,d)==='west_camp'?1000+10*Math.min(30,(b.plans.west==='engineer'?0:s.westernState.ogakiDefense)+(s.flags.gifu_controlled?0:s.westernState.gifuDefense)):1000;
 const defensePower=power(d.troops,[def.defensePerThousand,700+d.morale*5,supplied(s,d)?1000:850,900+40*d.commanderRating,1000+50*d.equipmentPoints,terrain(s,d)==='fieldworks'&&d.side!=='east'?1000:td.defensePerThousand??1000,fortification,d.brace?1300:1000,d.brace&&kind==='charge'?1200:1000]);
 const ratio=round(attackPower,10000,Math.max(1,defensePower)),defBp=clamp(800+round(ratio-10000,1000,10000)+dv,300,2200);let atkBp=clamp(400+round(600,10000,Math.max(ratio,2500))+av,200,1400);if(kind==='charge')atkBp=round(atkBp,1150,1000);
 const fullLoss=nearest10(round(d.troops,defBp,10000)),defenderLoss=Math.min(d.troops,kind==='suppress'?nearest10(round(fullLoss,1,2)):fullLoss),defenderMoraleLoss=round(rules.battle.moraleHitBase*10000+defBp*rules.battle.moraleHitPerBp,1,10000)+(support?4:0),retaliation=retaliationEligible(s,d,a,defenderLoss,defenderMoraleLoss,kind);
 return {attackPower:round(attackPower,1,1000000),defensePower:round(defensePower,1,1000000),powerRatioMilli:round(ratio,1,10),defenderLoss,attackerLoss:retaliation?Math.min(a.troops,nearest10(round(a.troops,atkBp,10000))):0,defenderMoraleLoss,attackerMoraleLoss:retaliation?round(2*10000+atkBp*40,1,10000):0,support,retaliation};
}
export function combatRange(s:State,a:Formation,d:Formation,kind='attack'){
 // Sample the complete bounded integer-variance space: retaliation can switch off at a rout threshold.
 let dMin=Infinity,dMax=0,aMin=Infinity,aMax=0;for(let dv=-200;dv<=200;dv++){for(const av of [-150,150]){const p=combatPreview(s,a,d,kind,dv,av);dMin=Math.min(dMin,p.defenderLoss);dMax=Math.max(dMax,p.defenderLoss);aMin=Math.min(aMin,p.attackerLoss);aMax=Math.max(aMax,p.attackerLoss);}}
 return {defender:[dMin,dMax],attacker:[aMin,aMax]};
}
export function rallyBlocked(s:State,u:Formation){const b=s.battle!,r=b.rallies[u.side],stores=u.side==='east'?s.resources:s.westernState.resources;
 return b.scenarioId==='convoy'&&u.side==='west'?'The raiders have no rally reserve.':r.uses>=3?'Three Rallies have been used.':b.round-r.lastRound<2?'Rally recovers two rounds after its last use.':stores.authority<10?'Rally costs 10 Authority.':null;}
export function resupplyBlocked(s:State,u:Formation){const b=s.battle!;return b.scenarioId!=='sekigahara'?'No supply camp in this encounter.':b.resupplied[u.side]?'This army has already resupplied.':terrain(s,u)!==u.side+'_camp'?'Stand in your own camp to resupply.':null;}
export function pontoonTiles(s:State,u:Formation){return u.engineer&&!s.battle!.pontoonUsed[u.side]?[{x:5,y:4},{x:5,y:5}].filter(p=>distance(p,u)===1&&terrain(s,p)==='stream'&&vacant(s,p)):[];}
function usePlan(s:State,u:Formation,action:string){event(s,'PLAN_USED',s.battle!.plans[u.side],{side:u.side,unit:u.id,action});}
export function battleAction(s:State,id:string,action:BattleAction){
 const b=s.battle!,u=activeUnit(s);if(!u||u.id!==id||u.routed||!alive(u)||b.dispatchPending||b.councilPending||b.result)throw Error('Not an active command window.');
 if(action.kind==='end'){u.ap=0;next(s);return;}if(u.ap<1)throw Error('No action points.');
 switch(action.kind){
 case 'move':{const p=reachable(s,u).find(p=>eq(p,action.point));if(!p)throw Error('Destination unreachable.');const fromX=u.x,fromY=u.y;u.x=p.x;u.y=p.y;event(s,'FORMATION_MOVED',u.id,{x:u.x,y:u.y,fromX,fromY});break;}
 case 'defend':if(u.defended)throw Error('Defend restores morale once per activation.');u.defended=true;u.morale=clamp(u.morale+4);event(s,'FORMATION_DEFENDED',u.id);break;
 case 'brace':if(u.archetype!=='spears'||u.brace)throw Error('Brace is unavailable.');u.brace=true;break;
 case 'forced_step':if(!supplied(s,u)||u.forced||suppressed(u))throw Error('Forced Step is unavailable.');u.forced=true;u.morale=clamp(u.morale-5);break;
 case 'rally':{const reason=rallyBlocked(s,u);if(reason)throw Error(reason);const target=b.formations.find(f=>f.id===action.target&&f.side===u.side&&alive(f));if(!target)throw Error('Choose an allied formation on the field.');if(u.side==='east')delta(s,'resources.authority',-10,'rally');else s.westernState.resources.authority-=10;target.morale=clamp(target.morale+15);if(target.morale>=25)target.routed=false;b.rallies[u.side].uses++;b.rallies[u.side].lastRound=b.round;b.rallyUsed=b.rallies.east.uses>0;event(s,'FORMATION_RALLIED',target.id,{side:u.side,authority:10,morale:15});break;}
 case 'resupply':{const reason=resupplyBlocked(s,u);if(reason)throw Error(reason);const n=action.rounds,stores=u.side==='east'?s.resources:s.westernState.resources;if(!Number.isInteger(n)||n<1||n>4||stores.food<n*b.quota[u.side])throw Error('Choose 1–4 affordable future ration packs.');if(u.side==='east')delta(s,'resources.food',-n*b.quota[u.side],'resupply');else stores.food-=n*b.quota[u.side];b.supply[u.side]+=n;b.resupplied[u.side]=true;event(s,'BATTLE_RESUPPLIED',u.side,{rounds:n,rice:n*b.quota[u.side],currentRoundUnchanged:true});break;}
 case 'pontoon':if(!pontoonTiles(s,u).some(p=>eq(p,action.point)))throw Error('Build beside one of the two marked empty water squares.');b.terrain[action.point.y][action.point.x]='bridge';b.pontoonUsed[u.side]=true;usePlan(s,u,'pontoon');event(s,'PONTOON_BUILT',u.side,{...action.point});break;
 case 'attack_wagon':if(b.scenarioId!=='convoy'||u.side!=='west'||u.attacked||distance(u,b.wagon!)!==1)throw Error('The wagon is not an adjacent legal target.');u.attacked=true;b.wagon!.integrity--;event(s,'WAGON_DAMAGED','convoy',{integrity:b.wagon!.integrity});break;
 case 'attack':case 'charge':case 'volley':case 'suppress':{
  const target=b.formations.find(f=>f.id===action.target);if(!target)throw Error('Choose an enemy formation.');const reason=attackBlocked(s,u,target,action.kind);if(reason)throw Error(reason);
  if(action.kind==='volley'||action.kind==='suppress')b.ammo[u.side]--;const dv=roll(s,-200,200),av=roll(s,-150,150),packet=combatPreview(s,u,target,action.kind,dv,av);
  target.troops-=packet.defenderLoss;target.morale=clamp(target.morale-packet.defenderMoraleLoss);
  if(action.kind==='suppress'&&target.troops*5>=target.startTroops&&target.morale>=25){target.suppressionUntilActivation=(target.activations??0)+1;usePlan(s,u,'suppress');}
  if(packet.retaliation){target.retaliationRound=b.round;if(target.archetype==='arquebus')b.ammo[target.side]--;u.troops-=packet.attackerLoss;u.morale=clamp(u.morale-packet.attackerMoraleLoss);}
  if(action.kind==='charge')u.morale=clamp(u.morale-6);u.attacked=true;event(s,'COMBAT_RESOLVED',action.kind,{attackerId:u.id,defenderId:target.id,...packet,rolls:{defenderVarianceBp:dv,attackerVarianceBp:av}});break;
 }
 }
 u.ap--;updateRouts(s);for(const side of sides)if(b.campChecks[side]&&!campHeld(s,side))b.campChecks[side]=0;if(allRouted(s))return;if(u.ap===0||u.routed||!alive(u))next(s);
}
function chooseIntent(s:State,a:Formation,reason?:string):Intent {
 const b=s.battle!,camp=b.scenarioId==='convoy'?b.wagon!:data.objectives.eastCamp,own=data.objectives.westCamp,candidates:Array<{action:BattleAction;score:number;id:string;goal:string}>=[];
 if(b.scenarioId==='convoy'&&!a.attacked&&distance(a,b.wagon!)===1)candidates.push({action:{kind:'attack_wagon'},score:120,id:'wagon',goal:'Raid wagon'});
 for(const enemy of b.formations.filter(f=>f.side!==a.side&&alive(f)).sort((x,y)=>x.id.localeCompare(y.id)))for(const kind of ['attack','volley','suppress'] as const){if(!canAttack(s,a,enemy,kind))continue;const p=combatPreview(s,a,enemy,kind);candidates.push({action:{kind,target:enemy.id},score:22+round(p.defenderLoss,40,Math.max(1,enemy.troops))-round(p.attackerLoss,30,Math.max(1,a.troops))+(enemy.routed?15:0)+(b.scenarioId==='sekigahara'&&distance(enemy,own)<=1?80:0)+(kind==='suppress'&&!suppressed(enemy)?10:0),id:kind+enemy.id,goal:kind==='suppress'?'Suppress threat':'Attack formation'});}
 for(const p of reachable(s,a)){let value=(distance(a,camp)-distance(p,camp))*4;if(eq(p,camp))value+=100;if(b.scenarioId==='convoy'&&distance(p,camp)===1)value+=40;if((defs[terrain(s,p)]?.defensePerThousand??1000)>=1250)value+=5;
  for(const enemy of b.formations.filter(f=>f.side!==a.side&&alive(f))){if(a.ap>=2&&canAttack(s,{...a,...p,ap:a.ap-1},enemy,a.archetype==='arquebus'?'volley':'attack'))value+=18;if(b.scenarioId==='sekigahara'&&distance(enemy,own)<=1&&distance(p,own)<=1)value+=80;}
  candidates.push({action:{kind:'move',point:p},score:value,id:'move'+p.x+','+p.y,goal:b.scenarioId==='convoy'?'Intercept wagon':'Advance / defend camp'});}
 if(!rallyBlocked(s,a)){const target=b.formations.filter(f=>f.side===a.side&&alive(f)&&f.morale<55).sort((x,y)=>x.morale-y.morale||x.id.localeCompare(y.id))[0];if(target)candidates.push({action:{kind:'rally',target:target.id},score:target.routed?100:40,id:'rally',goal:'Rally formation'});}
 if(!resupplyBlocked(s,a)&&b.supply[a.side]<2){const rounds=Math.min(4,Math.floor(s.westernState.resources.food/b.quota[a.side]));if(rounds)candidates.push({action:{kind:'resupply',rounds},score:90,id:'resupply',goal:'Secure supplies'});}
 for(const p of pontoonTiles(s,a))candidates.push({action:{kind:'pontoon',point:p},score:35,id:'pontoon',goal:'Bridge stream'});
 if(!a.defended)candidates.push({action:{kind:'defend'},score:a.morale<45?26:1,id:'defend',goal:'Recover morale'});
 if(a.archetype==='spears'&&!a.brace)candidates.push({action:{kind:'brace'},score:2,id:'brace',goal:'Hold position'});
 candidates.push({action:{kind:'end'},score:0,id:'end',goal:'Hold position'});candidates.sort((x,y)=>y.score-x.score||x.id.localeCompare(y.id));const c=candidates[0];return {unitId:a.id,action:c.action,goal:c.goal,round:b.round,reason};
}
function intentLegal(s:State,u:Formation,action:BattleAction){const test=structuredClone(s);try{battleAction(test,u.id,action);return true;}catch{return false;}}
export function tacticalTurn(s:State){const b=s.battle!,u=activeUnit(s);if(!u||u.side!=='west'||b.councilPending||b.dispatchPending)throw Error('No Western activation.');const id=u.id;
 for(let n=0;n<2&&s.phase==='battle_round'&&!b.dispatchPending&&!b.councilPending&&activeUnit(s)?.id===id;n++){
  const a=activeUnit(s)!;let intent=b.intents[id];if(!intent||!intentLegal(s,a,intent.action)){intent=chooseIntent(s,a,intent?'Position or action cost changed':'New activation');b.intents[id]=intent;event(s,'INTENT_REPLANNED',id,{reason:intent.reason,goal:intent.goal});}
  battleAction(s,id,intent.action);if(s.phase==='battle_round'&&activeUnit(s)?.id===id)b.intents[id]=chooseIntent(s,a,'Next action');
 }
}
export function withdraw(s:State){const b=s.battle!,safe=b.formations.filter(f=>f.side==='east'&&!f.auxiliary&&alive(f)&&!f.routed).length>=2&&b.currentSupply.east;finish(s,safe?'orderly_withdrawal':'disordered_withdrawal','withdrawal');}
export function convoyDue(s:State){return s.chapterIndex===1&&s.phase==='orders'&&!s.activeOrder&&s.pendingReward===null&&!s.flags.convoy_done&&!s.flags.convoy_started&&s.challengeRecords.filter(c=>c.chapter===1&&!c.id.startsWith('crisis')).length>=2;}
export function convoy(s:State,start:boolean){
 if(s.phase!=='convoy_briefing')throw Error('The escort is not awaiting orders.');
 if(!start){s.flags.convoy_done=true;s.flags.convoy_status='skipped';s.phase='orders';event(s,'CONVOY_SKIPPED','convoy');return;}
 if(s.resources.food<30||s.resources.materials<20)throw Error('The escort needs 30 Rice and 20 Materials. You may skip without a reward.');
 delta(s,'resources.food',-30,'convoy.rations');delta(s,'resources.materials',-20,'convoy.ammo');s.flags.convoy_started=true;
 const make=(id:string,side:Side,archetype:Formation['archetype'],troops:number,p:Point):Formation=>({id,side,archetype,troops,startTroops:troops,baseTroops:troops,morale:75,equipmentPoints:0,commanderRating:3,move:3,range:archetype==='arquebus'?2:1,...p,ap:0,attacked:false,brace:false,forced:false,routed:false,exited:false,shattered:false,auxiliary:false});
 const formations=[make('convoy_spears','east','spears',400,{x:1,y:1}),make('convoy_gunners','east','arquebus',300,{x:1,y:3}),make('raider_north','west','spears',250,{x:5,y:1}),make('raider_south','west','spears',250,{x:5,y:3})];
 const grid=Array.from({length:6},(_,y)=>Array.from({length:8},(_,x)=>x===4?(y===2?'bridge':'stream'):y===2?'road':'plain'));
 const bonus=s.challengeRecords.filter(c=>c.chapter===1&&c.path==='attempt1')[0];const b=emptyBattle(formations,grid,{east:10,west:10},{east:2+(bonus?1:0),west:0},'convoy');b.wagon={...rules.convoy.wagonStart,integrity:3,delivered:false};b.convoySnapshot={commandSeals:s.commandSeals,usedOrders:[...s.usedOrders]};b.auxSide='inactive';b.paidAmmo=2;s.battle=b;
 if(bonus)event(s,'CONVOY_PRECISION_AMMO',bonus.id,{charges:1,sourceId:bonus.id});beginBattle(s);
}
