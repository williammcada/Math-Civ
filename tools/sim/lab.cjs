// Battle Monte Carlo from fixed preparations.
const {playBattle,step,M}=require('./bot.cjs');
function lab(seed,o){
  o={gifu:true,supply:10,enemySupply:10,ammo:6,enemyAmmo:7,authority:40,equipment:[1,1,1],ally:71,fieldworks:0,readiness:80,cohesion:85,plan:'standard',troops:null,westGain:0,ogaki:10,gifuDef:20,scouted:true,...o};
  let n=M.qt(seed); n.chapterIndex=4; n.flags.gifu_controlled=o.gifu; n.playerArmy.routeState=o.gifu?'prepared':'unprepared'; n.flags.weather_scouted=o.scouted;
  n.resources={food:1000,currency:500,materials:300,authority:o.authority}; n.diplomacy.kobayakawaCommitment=o.ally; n.diplomacy.coalitionCohesion=o.cohesion; n.playerArmy.readiness=o.readiness;
  n.playerArmy.active=true; n.playerArmy.locationId='sekigahara'; n.playerArmy.fieldworkTier=o.fieldworks;
  if(o.troops) n.playerArmy.formations.forEach((f,i)=>f.troops=o.troops[i]);
  n.westernState.troopGain=o.westGain; if(o.westRouteDamaged)n.westernState.routeDamaged=true; if(o.momentum!==undefined)n.threats.westernMomentum=o.momentum; n.westernState.ogakiDefense=o.ogaki; n.westernState.gifuDefense=o.gifuDef;
  n.westernState.resources={food:9999,currency:0,materials:9999,authority:50};
  n.prep={rounds:o.supply,supply:o.supply,equipment:o.equipment,ammo:o.ammo};
  M.ct(n); n.phase='battle_deployment';
  n.battle.supply.west=o.enemySupply; n.battle.ammo.west=o.enemyAmmo;
  n.westernState.resources.food=o.westFood??460; // what's left for West resupply
  if(o.plan!=='standard'){ const r=M.nn(n,{type:'PLAN',plan:o.plan,reserve:'east_fukushima',entry:'north'}); if(r.events[0]?.type==='RULE_VIOLATION') return null; n=r.state; }
  if(o.deploy==='back'){for(const [id,pt] of [['east_ii',{x:0,y:2}],['east_fukushima',{x:0,y:4}],['east_kuroda',{x:0,y:5}]]){const r=M.nn(n,{type:'DEPLOY',id,point:pt});if(r.events[0]?.type!=='RULE_VIOLATION')n=r.state;}}
  n=step(n,{type:'BEGIN_BATTLE'});
  n=playBattle(n,o.battle??{});
  const b=n.battle;
  return {result:b.result,reason:b.outcomeReason,round:b.round,aux:b.auxSide,eastLeft:b.formations.filter(f=>f.side==='east'&&!f.auxiliary).reduce((a,f)=>a+f.troops,0)};
}
function sweep(label,o,N=200){
  const c={victory:0,draw:0,defeat:0,orderly_withdrawal:0,disordered_withdrawal:0},reasons={},rounds=[];let left=0,cnt=0;
  for(let s=1;s<=N;s++){const r=lab(s*7919,o); if(!r) return console.log(label,'plan illegal'); c[r.result]++;reasons[r.reason]=(reasons[r.reason]??0)+1;rounds.push(r.round);left+=r.eastLeft;cnt++;}
  rounds.sort((a,b)=>a-b);
  console.log(label.padEnd(44),'win',(100*c.victory/N).toFixed(0).padStart(3)+'%','draw',(100*c.draw/N).toFixed(0).padStart(3)+'%','loss',(100*c.defeat/N).toFixed(0).padStart(3)+'%','| median rounds',rounds[N>>1],'p10-p90',rounds[Math.floor(N*.1)]+'-'+rounds[Math.floor(N*.9)],'|',JSON.stringify(reasons),'| east left',Math.round(left/cnt));
}
module.exports={lab,sweep};
if(require.main===module){
  const N=+process.argv[2]||150;
  sweep('BASELINE (good campaign, Koba east)',{},N);
  sweep('Kobayakawa inactive (ally 50)',{ally:50},N);
  sweep('Kobayakawa WEST (ally 30)',{ally:30},N);
  sweep('No supply (0 packs)',{supply:0},N);
  sweep('3 supply packs',{supply:3},N);
  sweep('No equipment',{equipment:[0,0,0]},N);
  sweep('Max equipment (2,2,2)',{equipment:[2,2,2]},N);
  sweep('No ammo',{ammo:0},N);
  sweep('Max ammo 12',{ammo:12},N);
  sweep('Authority 0 (no rally, -10 morale)',{authority:0},N);
  sweep('Authority 90',{authority:90},N);
  sweep('Low readiness 30 + cohesion 30',{readiness:30,cohesion:30},N);
  sweep('No Gifu (col 1 only, W init+5)',{gifu:false},N);
  sweep('Fieldworks tier 2',{fieldworks:2},N);
  sweep('Fire Discipline plan',{plan:'fire_discipline'},N);
  sweep('Flanking plan',{plan:'flanking'},N);
  sweep('Engineer plan (fw1)',{plan:'engineer',fieldworks:1},N);
  sweep('Troops +990 muster (3550/3750/3290)',{troops:[3550,3750,3290]},N);
  sweep('WORST: no supply/eq/ammo, auth0, Koba west',{supply:0,equipment:[0,0,0],ammo:0,authority:0,ally:30,readiness:30,cohesion:30,gifu:false},N);
  sweep('West +2100 troops (ai_raise x3)',{westGain:2100},N);
  sweep('West unsupplied (0 packs, 0 food)',{enemySupply:0,westFood:0},N);
}
