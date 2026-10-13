import type {State,Battle,Side} from '../core/types';
import {BUILD_VERSION} from '../core/version';
import {battleQuota,campaignQuota} from '../core/logistics';
import {event} from '../core/effects';
import {saveStructure,invariants} from '../core/invariants';

// Input is a checksum-verified clone. The repository stores the original envelope
// in a separate backup record in the same atomic transaction as the new save.
export function migrateState(original:State):State {
 if(original.schemaVersion===2)return structuredClone(original);
 if(original.schemaVersion!==1)throw Error('Unsupported save schema. The original is preserved.');
 const s=structuredClone(original);saveStructure(s);invariants(s);
 const complete=!!s.ending||!!s.battle?.result;
 if(!complete){
  const c=s.activeOrder;
  if(c&&['math_c2_provisions','math_c4_granaries'].includes(c.templateId)&&!c.resolved){
   const paid=c.paid.food??0;if(!Number.isSafeInteger(paid)||paid<0||s.resources.food+paid>9999)throw Error('Cannot safely restore this legacy Rice payment. Keep the original save.');
   s.resources.food+=paid;
   if(c.attempts>0){if(s.commandSeals>=3||!s.usedOrders.includes(c.orderId))throw Error('Cannot reconstruct the legacy spent Seal. Keep the original save.');s.commandSeals++;s.usedOrders=s.usedOrders.filter(id=>id!==c.orderId);}
   delete s.variants[c.id];s.activeOrder=null;s.flags['repaired:'+c.id]=true;event(s,'LEGACY_CHALLENGE_REPAIRED',c.id,{refundedRice:paid,sealReturned:c.attempts>0});
  }else if(c&&c.attempts===0){delete s.variants[c.id];s.activeOrder=null;}
  else if(c?.context==='provision')s.flags.legacy_provision_pending=true;
  else if(c?.context==='warchest')s.flags.legacy_ammo_price=30;
  // Completed purchases keep the reserve that was actually delivered, with no retroactive dividend.
  if(s.chapterIndex>1||s.usedOrders.length>=2||s.challengeRecords.filter(c=>c.chapter===1).length>=2){s.flags.convoy_done=true;s.flags.convoy_status='legacy_skipped';}
 }
 const convert=(packs:number,troops:number[],side:Side)=>{
  if(!Number.isSafeInteger(packs)||packs<0||troops.length!==3||troops.some(n=>!Number.isSafeInteger(n)||n<=0))throw Error('This legacy battle lacks its original paid ration quota. Keep the original save.');
  const oldQuota=campaignQuota(troops),quota=battleQuota(troops),rice=packs*oldQuota,newPacks=Math.floor(rice/quota),remainder=rice%quota,stores=side==='east'?s.resources:s.westernState.resources;
  if(stores.food+remainder>9999)throw Error('No safe space for the legacy ration remainder. Keep the original save.');stores.food+=remainder;event(s,'LEGACY_SUPPLY_CONVERTED',side,{rice,oldQuota,quota,packs:newPacks,remainder});return {packs:newPacks,quota};
 };
 if(s.battle){const b=s.battle as Battle;b.rulesVersion=2;b.scenarioId='sekigahara';b.quota={east:1,west:1};b.currentSupply={east:false,west:false};b.rallies={east:{uses:b.rallyUsed?1:0,lastRound:b.rallyUsed?b.round:-2},west:{uses:0,lastRound:-2}};b.resupplied={east:false,west:false};b.campChecks={east:0,west:0};b.councilPending=false;b.reviewSeen=b.round>12;b.finalized=!!b.result;b.outcomeReason=b.result?'legacy_result':'';b.plans={east:'standard',west:'standard'};b.planLocked=s.phase!=='battle_deployment';b.pontoonUsed={east:false,west:false};b.intents={};
  for(const side of ['east','west'] as Side[]){const troops=b.formations.filter(f=>f.side===side&&!f.auxiliary).map(f=>f.startTroops);
   if(complete)b.quota[side]=battleQuota(troops);
   else{const hadCurrent=s.phase==='battle_round'&&b.supply[side]>0,{packs,quota}=convert(b.supply[side],troops,side);b.quota[side]=quota;b.currentSupply[side]=hadCurrent&&packs>0;b.supply[side]=packs-(b.currentSupply[side]?1:0);if(side==='east')b.initialSupply=b.suppliedRounds+packs;}
  }
  for(const f of b.formations){f.pendingReserve=false;f.activations=0;f.defended=false;if(f.auxiliary)f.auxiliaryRounds=Math.max(0,12-Math.max(0,b.round-3));}
  if(!complete&&s.phase==='battle_round'&&b.round<5&&b.auxSide===null)b.dispatchPending=false;
 }else if(!complete&&s.prep.supply>0){const {packs}=convert(s.prep.supply,s.playerArmy.formations.map(f=>f.troops),'east');s.prep.supply=packs;}
 s.schemaVersion=2;s.buildVersion=BUILD_VERSION;s.flags.migrated_from_v02=true;event(s,'SAVE_MIGRATED','schema2',{completedPreserved:complete});saveStructure(s);invariants(s);return s;
}
