import {createState} from './reducer';
import {createBattle,beginBattle} from './battle';
import {invariants} from './invariants';
export interface BattleLabOptions {preset:'deployment'|'clash'|'volley'|'ally';gifu:boolean;supply:number;enemySupply:number;ammo:number;enemyAmmo:number;authority:number;equipment:number;morale:number;fieldworks:number;ally:number;automaticEnemy:boolean}
export const defaultLab:BattleLabOptions={preset:'deployment',gifu:true,supply:10,enemySupply:10,ammo:8,enemyAmmo:8,authority:70,equipment:1,morale:80,fieldworks:1,ally:80,automaticEnemy:false};
export function createBattleLab(options:BattleLabOptions){
 const o=options;for(const [v,min,max] of [[o.supply,0,12],[o.enemySupply,0,12],[o.ammo,0,12],[o.enemyAmmo,0,12],[o.authority,0,100],[o.equipment,0,2],[o.morale,0,100],[o.fieldworks,0,2],[o.ally,0,100]])if(!Number.isInteger(v)||v<min||v>max)throw Error('Choose values within the displayed limits.');
 if(!['deployment','clash','volley','ally'].includes(o.preset))throw Error('Choose a battle exercise.');
 const s=createState(16001021);s.chapterIndex=4;s.flags.battle_lab=true;s.flags.gifu_controlled=o.gifu;s.playerArmy.routeState=o.gifu?'prepared':'unprepared';s.flags.weather_scouted=true;s.resources={food:1000,currency:500,materials:300,authority:o.authority};s.diplomacy.kobayakawaCommitment=o.ally;s.playerArmy.active=true;s.playerArmy.locationId='sekigahara';s.playerArmy.fieldworkTier=o.fieldworks;s.prep={rounds:o.supply,supply:o.supply,equipment:[o.equipment,o.equipment,o.equipment],ammo:o.ammo};createBattle(s);
 const b=s.battle!;b.supply.west=o.enemySupply;b.ammo.west=o.enemyAmmo;b.formations.forEach(f=>f.morale=o.morale);
 if(o.preset==='deployment')s.phase='battle_deployment';else{
  const positions=o.preset==='volley'?{east_kuroda:{x:3,y:1},west_ukita:{x:5,y:1}}:o.preset==='clash'?{east_ii:{x:3,y:3},east_fukushima:{x:3,y:4},east_kuroda:{x:2,y:3},west_ukita:{x:4,y:3},west_ishida:{x:6,y:3},west_otani:{x:7,y:4}}:{};
  for(const [id,p] of Object.entries(positions))Object.assign(b.formations.find(f=>f.id===id)!,p);
  if(o.preset==='ally')b.round=5;beginBattle(s);
  if(s.phase==='battle_round'&&o.preset!=='ally'){const first=o.preset==='volley'?'east_kuroda':'east_ii';b.queue=[first,...b.queue.filter(id=>id!==first)];b.activeIndex=0;b.formations.forEach(f=>f.ap=f.id===first?2:0);}
 }
 invariants(s);return s;
}
