// Campaign and battle bot used by the v0.3.1 audit and v0.4 balance checks.
const E=require('../../.parity/sim-engine.cjs');
// Adapter: the v0.3.1 audit bot used minified names; map them to the source engine.
const M={nn:E.reduce,qt:E.createState,y:E.chapter,Xt:E.legalOrders,q:E.battleQuota,Ye:E.activeUnit,et:E.reachable,kt:E.combatPreview,Ke:E.terrain,We:E.alive,d:E.battleData,ct:E.createBattle,rules:E.rules};
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function step(s,cmd){const r=M.nn(s,cmd); if(r.events[0]?.type==='RULE_VIOLATION'){const e=new Error('RV '+r.events[0].key+' '+JSON.stringify(cmd));e.state=s;throw e;} return r.state;}
// ---------- East battle policy (mirror of the West AI's scoring, aimed at the West camp) ----------
function eastChoose(s,u,opts){
  const b=s.battle, camp=M.d.objectives.westCamp, own=M.d.objectives.eastCamp, cands=[];
  const enemies=b.formations.filter(e=>e.side!=='east'&&M.We(e));
  for(const n of enemies) for(const k of ['charge','attack','volley','suppress']){
    if(k==='charge'&&!opts.charge) continue;
    let legal=false; try{legal=M.nn(s,{type:'BATTLE',id:u.id,action:{kind:k,target:n.id}}).events[0]?.type!=='RULE_VIOLATION'}catch{}
    if(!legal) continue;
    const c=M.kt(s,u,n,k);
    cands.push({a:{kind:k,target:n.id},sc:22+Math.round(c.defenderLoss*40/Math.max(1,n.troops))-Math.round(c.attackerLoss*30/Math.max(1,u.troops))+(n.routed?15:0)+(dist(n,camp)<=1?30:0)+(dist(n,own)<=1?80:0)});
  }
  for(const p of M.et(s,u)){
    let sc=(dist(u,camp)-dist(p,camp))*opts.push;
    if(p.x===camp.x&&p.y===camp.y) sc+=100;
    if((M.d.terrainDefinitions[M.Ke(s,p)]?.defensePerThousand??1000)>=1250) sc+=5;
    for(const n of enemies){ if(u.ap>=2&&dist(p,n)<=(u.archetype==='arquebus'?2:1)) sc+=18; }
    cands.push({a:{kind:'move',point:{x:p.x,y:p.y}},sc});
  }
  // rally
  const low=b.formations.filter(e=>e.side==='east'&&M.We(e)&&e.morale<45).sort((a,b)=>a.morale-b.morale)[0];
  if(low&&opts.rally) cands.push({a:{kind:'rally',target:low.id},sc:low.routed?100:45});
  if(!u.defended) cands.push({a:{kind:'defend'},sc:u.morale<45?26:1});
  cands.push({a:{kind:'end'},sc:0});
  cands.sort((a,b)=>b.sc-a.sc);
  for(const c of cands){ const r=M.nn(s,{type:'BATTLE',id:u.id,action:c.a}); if(r.events[0]?.type!=='RULE_VIOLATION') return r.state; }
  return step(s,{type:'BATTLE',id:u.id,action:{kind:'end'}});
}
function playBattle(s,opts={}){
  opts={push:4,charge:true,rally:true,council:'continue',maxRounds:40,...opts};
  let guard=0;
  while(s.phase==='battle_round'&&guard++<5000){
    const b=s.battle;
    if(b.dispatchPending){s=step(s,{type:'ADVANCE'});continue}
    if(b.councilPending){ if(opts.council==='accept'||b.round>=opts.maxRounds){ s=step(s,{type:'BATTLE_COUNCIL',choice:'accept'});} else s=step(s,{type:'BATTLE_COUNCIL',choice:'continue'}); continue}
    if(b.round>opts.maxRounds){ s=step(s,{type:'BATTLE_COUNCIL',choice:'open'}); s=step(s,{type:'BATTLE_COUNCIL',choice:'accept'}); continue}
    const u=M.Ye(s);
    if(!u){ throw new Error('no active unit')}
    if(u.side==='west') s=step(s,{type:'AI_TURN'}); else s=eastChoose(s,u,opts);
  }
  return s;
}
// ---------- campaign bot ----------
function campaign(seed,cfg={}){
  cfg={acc:1.0,policy:[0,0,0,0],priority:null,convoy:false,equip:[1,1,1],ammo:6,plan:'auto',battle:{},...cfg};
  let rng=seed*9301+49297; const rnd=()=>((rng=(rng*233280+49297)%2147483647)/2147483647);
  let s=M.qt(seed,'campaign');
  const pri=cfg.priority??{1:['c1_court_letters','c1_repair_tokaido','c1_tax_register','c1_labor_ledger','audit_stores'],2:['c2_secure_allies','c2_march_provisions','c2_muster_bands','c2_reinforce_edo','audit_stores'],3:['c3_secure_gifu','c3_kiyosu_stores','c3_oyama_march','c3_home_relief','audit_stores'],4:['c4_kobayakawa','c4_forward_granaries','c4_weather_scouts','c4_fieldworks','audit_stores']};
  const answerOrder=()=>{ // answer current active order
    let tries=0;
    while(s.activeOrder&&!s.activeOrder.resolved){
      const o=s.activeOrder;
      if(o.attempts>=3){ s=step(s,{type:'ADVISER'}); s=step(s,{type:'COMPLETE',path:'adviser',now:0}); break;}
      const good=rnd()<cfg.acc;
      const ans={}; for(const f of o.fields){ const v=o.answer[f]; ans[f]= good?String(v): (typeof v==='string'? (o.operands.options.find(x=>x.id!==v).id): String(v+10)); }
      s=step(s,{type:'ANSWER',answer:ans,now:0});
      if(++tries>5) throw new Error('loop');
    }
    if(s.pendingReward!==null) s=step(s,{type:'AUDIT_REWARD',resource:cfg.auditRes??'food'});
  };
  let guard=0;
  while(!['battle_provision'].includes(s.phase)&&guard++<500){
    switch(s.phase){
      case 'prologue':case 'chronicle':case 'council':case 'administration':case 'world':case 'chapter_report':case 'battle_review':case 'convoy_result': s=step(s,{type:'ADVANCE'});break;
      case 'policy':{const ch=M.y(s.chapterIndex).policyChoices; let i=cfg.policy[s.chapterIndex-1]; let r=M.nn(s,{type:'POLICY',id:ch[i].id}); if(r.events[0]?.type==='RULE_VIOLATION') r=M.nn(s,{type:'POLICY',id:ch[2].id}); s=r.state;break;}
      case 'convoy_briefing': s=step(s,{type:'CONVOY',start:false}); break;
      case 'orders':{
        if(s.commandSeals===0){s=step(s,{type:'END_CHAPTER'});break}
        const legal=M.Xt(s); if(!legal.length){s=step(s,{type:'FORFEIT_SEALS'});break}
        const pick=pri[s.chapterIndex].find(x=>legal.includes(x))??legal[0];
        s=step(s,{type:'OPEN_ORDER',id:pick,now:0}); answerOrder(); break;}
      case 'crisis':{
        let done=false; for(const resp of ['full','partial','accept']){ const r=M.nn(s,{type:'CRISIS_RESPONSE',response:resp,now:0}); if(r.events[0]?.type!=='RULE_VIOLATION'){s=r.state;done=true;break} }
        answerOrder(); break;}
      default: throw new Error('phase '+s.phase);
    }
  }
  const pre={food:s.resources.food,cur:s.resources.currency,mat:s.resources.materials,auth:s.resources.authority,prot:s.playerArmy.protectedBattleRice,troops:s.playerArmy.formations.map(f=>f.troops),koba:s.diplomacy.kobayakawaCommitment,coh:s.diplomacy.coalitionCohesion,gifu:!!s.flags.gifu_controlled,road:s.playerArmy.routeState,fw:s.playerArmy.fieldworkTier,westTroopGain:s.westernState.troopGain,westRes:{...s.westernState.resources},westOgaki:s.westernState.ogakiDefense,westGifuDef:s.westernState.gifuDefense,crises:s.crises.map(c=>c.id+c.severity+':'+c.response)};
  if(cfg.noBattle){pre.quota=M.q(s.playerArmy.formations.map(f=>f.troops));pre.maxRounds=Math.floor((s.resources.food+s.playerArmy.protectedBattleRice)/pre.quota);pre.mastery=s.challengeRecords.length?Math.round(s.challengeRecords.reduce((a,c)=>a+c.masteryPoints,0)/s.challengeRecords.length):0;pre.seals=s.challengeRecords.length;return {pre,state:s};}
  // provision: max rounds affordable (cap cfg.rounds)
  const quota=M.q(s.playerArmy.formations.map(f=>f.troops));
  const maxR=Math.min(cfg.rounds??12,Math.floor((s.resources.food+s.playerArmy.protectedBattleRice)/quota));
  if(maxR>=1){ s=step(s,{type:'PREP_PROVISION',rounds:maxR,now:0}); answerOrder(); } else s=step(s,{type:'SKIP_PROVISION'});
  // warchest
  let eq=[...cfg.equip]; while(eq.reduce((a,b)=>a+b)*M.rules.battle.equipmentCost>s.resources.currency) {const i=eq.lastIndexOf(Math.max(...eq)); eq[i]--;}
  let ammo=Math.min(cfg.ammo,Math.floor(s.resources.materials/M.rules.battle.ammoCost));
  s=step(s,{type:'PREP_WARCHEST',equipment:eq,ammo,now:0}); answerOrder();
  // plan
  if(cfg.plan!=='standard'){ for(const p of (cfg.plan==='auto'?['fire_discipline','flanking','engineer']:[cfg.plan])){ const r=M.nn(s,{type:'PLAN',plan:p,reserve:'east_fukushima',entry:'north'}); if(r.events[0]?.type!=='RULE_VIOLATION'){s=r.state;break} } }
  pre.plan=s.battle.plans.east; pre.westPlan=s.battle.plans.west; pre.rounds=maxR; pre.eq=eq; pre.ammo=ammo; pre.westSupply=s.battle.supply.west; pre.westAmmo=s.battle.ammo.west;
  pre.westTroops=s.battle.formations.filter(f=>f.side==='west').map(f=>f.troops);
  pre.eastMorale=s.battle.formations.filter(f=>f.side==='east').map(f=>f.morale);
  s=step(s,{type:'BEGIN_BATTLE'});
  s=playBattle(s,cfg.battle);
  const b=s.battle;
  const out={seed,result:b.result,reason:b.outcomeReason,round:b.round,aux:b.auxSide,east:b.formations.filter(f=>f.side==='east'&&!f.auxiliary).map(f=>f.troops+'/'+f.startTroops+(f.routed?'R':'')+(f.shattered?'S':'')),west:b.formations.filter(f=>f.side==='west').map(f=>f.troops+'/'+f.startTroops+(f.routed?'R':'')+(f.shattered?'S':'')),mastery:s.challengeRecords.length?Math.round(s.challengeRecords.reduce((a,c)=>a+c.masteryPoints,0)/s.challengeRecords.length):0};
  if(s.phase==='battle_result'){ s=step(s,{type:'ADVANCE'}); out.ending=s.ending.tier; out.realm=s.ending.realm; out.components=s.ending.components;}
  return {pre,out,state:s};
}
module.exports={campaign,playBattle,step,eastChoose,M};
