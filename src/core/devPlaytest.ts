// Owner DEV playtest mode (handbook U-13, approved 13 Oct 2026).
// Runs the normal game engine. The only difference is that every math step is answered
// correctly on the owner's behalf, and the campaign can start at any chapter or at the battle.
import {createState,reduce,legalOrders} from './reducer';
import {chapter} from '../content/registry';
import {invariants} from './invariants';
import {battleQuota} from './logistics';
import type {State,Command,Event} from './types';

export type DevStart='ch1'|'ch2'|'ch3'|'ch4'|'battle_prep'|'battle';
export type KobaBand='east_full'|'east_late'|'holds'|'west_late'|'west_full';
export interface DevOptions{start:DevStart;scenes:boolean;gifu:boolean;road:boolean;weatherScouts:boolean;fieldworks:0|1|2;kobayakawa:KobaBand;scouts:'exact'|'estimates'|'none';hidetada:boolean;ampleStores:boolean;fullySupplied:boolean}
export const defaultDev:DevOptions={start:'ch1',scenes:true,gifu:true,road:true,weatherScouts:true,fieldworks:1,kobayakawa:'east_late',scouts:'estimates',hidetada:false,ampleStores:true,fullySupplied:true};
export const devStartNames:Record<DevStart,string>={ch1:'Chapter 1 · The Balance of Regents',ch2:'Chapter 2 · The Aizu Question',ch3:'Chapter 3 · The Western Army Rises',ch4:'Chapter 4 · Roads to Mino',battle_prep:'Battle preparation (rations and war chest)',battle:'Sekigahara (deploy and fight)'};
export const kobaValues:Record<KobaBand,number>={east_full:85,east_late:67,holds:52,west_late:37,west_full:20};
export const kobaNames:Record<KobaBand,string>={east_full:'Joins you in force (85)',east_late:'Joins you late (67)',holds:'Stays on the hill (52)',west_late:'Turns against you late (37)',west_full:'Attacks you in force (20)'};

const priority=['c1_court_letters','c1_repair_tokaido','c1_tax_register','c1_labor_ledger','c2_secure_allies','c2_march_provisions','c2_muster_bands','c2_reinforce_edo','c3_secure_gifu','c3_kiyosu_stores','c3_oyama_march','c3_home_relief','c4_kobayakawa','c4_forward_granaries','c4_fieldworks','c4_weather_scouts','audit_stores'];
let sink:Event[]|null=null;
function step(s:State,c:Command):State|null{const r=reduce(s,c);if(r.events[0]?.type==='RULE_VIOLATION')return null;sink?.push(...r.events);return r.state;}
/** Answers any open math step correctly and collects audit rewards: the DEV "no gates" rule. Returns the events produced. */
export function clearGatesWithEvents(s:State):{state:State;events:Event[]}{const events:Event[]=[],prior=sink;sink=events;try{return {state:clearGates(s),events};}finally{sink=prior;}}
export function clearGates(s:State):State{
 for(let guard=0;guard<6;guard++){
  if(s.pendingReward!==null){s=step(s,{type:'AUDIT_REWARD',resource:'food'})??s;continue;}
  const o=s.activeOrder;if(!o||o.resolved)break;
  const answer=Object.fromEntries(o.fields.map(f=>[f,String(o.answer[f])]));const next=step(s,{type:'ANSWER',answer,now:0});
  if(!next){const fallback=step(s,{type:'ADVISER'});s=fallback?step(fallback,{type:'COMPLETE',path:'adviser',now:0})??fallback:s;break;}s=next;
 }
 return s;
}
/** Plays the campaign forward with sensible choices until the chosen starting point. */
function fastForward(s:State,start:DevStart,o:DevOptions):State{
 const target=start.startsWith('ch')?Number(start.slice(2)):5;
 for(let guard=0;guard<600;guard++){
  if(target<=4&&s.chapterIndex===target&&s.phase==='chronicle')return s;
  if(target===5&&s.phase==='battle_provision')return s;
  let next:State|null=null;
  switch(s.phase){
   case 'policy':for(const p of chapter(s.chapterIndex).policyChoices){next=step(s,{type:'POLICY',id:p.id});if(next)break;}break;
   case 'orders':{if(s.commandSeals===0){next=step(s,{type:'END_CHAPTER'});break;}const legal=legalOrders(s);if(!legal.length){next=step(s,{type:'FORFEIT_SEALS'});break;}
    const id=priority.find(p=>legal.includes(p))??legal[0];next=step(s,{type:'OPEN_ORDER',id,now:0});if(next)next=clearGates(next);break;}
   case 'crisis':for(const response of ['full','partial','accept'] as const){next=step(s,{type:'CRISIS_RESPONSE',response,now:0});if(next){next=clearGates(next);break;}}break;
   case 'convoy_briefing':next=step(s,{type:'CONVOY',start:false});break;
   default:next=step(s,{type:'ADVANCE'});
  }
  if(!next)throw Error('DEV fast-forward stopped at '+s.phase+' (chapter '+s.chapterIndex+').');
  s=clearGates(next);
 }
 throw Error('DEV fast-forward did not reach the starting point.');
}
/** Applies the owner's chosen preparations on top of the fast-forwarded campaign. */
export function applyDevOptions(s:State,o:DevOptions){
 s.flags.gifu_controlled=o.gifu;s.map.gifu=o.gifu?'player_military_control':'western';
 s.playerArmy.routeState=o.road?'prepared':'unprepared';s.flags.weather_scouted=o.weatherScouts;s.playerArmy.fieldworkTier=o.fieldworks;
 s.diplomacy.kobayakawaCommitment=kobaValues[o.kobayakawa];s.diplomacy.intelligence=o.scouts==='exact'?70:o.scouts==='estimates'?45:20;
 s.flags.hidetada_delay_risk=o.hidetada;
 if(o.ampleStores)s.resources={food:Math.max(s.resources.food,1500),currency:Math.max(s.resources.currency,1200),materials:Math.max(s.resources.materials,900),authority:Math.max(s.resources.authority,75)};
}
export function devStart(o:DevOptions,seed:number):State{
 let s=createState(seed,'campaign');s.flags.dev_playtest=true;
 if(o.start!=='ch1')s=fastForward(s,o.start,o);
 applyDevOptions(s,o);
 if(o.start==='battle'){
  const quota=battleQuota(s.playerArmy.formations.map(f=>f.troops)),affordable=Math.floor((s.resources.food+s.playerArmy.protectedBattleRice)/quota);
  const rounds=Math.max(1,Math.min(o.fullySupplied?12:6,affordable));
  s=clearGates(step(s,{type:'PREP_PROVISION',rounds,now:0})??s);
  const eq=o.fullySupplied?[2,2,2]:[1,1,1],ammo=o.fullySupplied?12:6;
  s=clearGates(step(s,{type:'PREP_WARCHEST',equipment:eq,ammo,now:0})??step(s,{type:'PREP_WARCHEST',equipment:[0,0,0],ammo:0,now:0})??s);
 }
 s.flags.dev_playtest=true;invariants(s);return s;
}
