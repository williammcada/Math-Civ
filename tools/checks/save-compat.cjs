// v0.4 save compatibility: states saved by the shipped v0.3.1 engine must load (migrate + structure + invariants)
// and keep playing under the v0.4 engine. Usage: node tools/checks/save-compat.cjs [runs] (needs the extracted v0.3.1 engine; see tools/parity/README.md)
const OLD=require(process.env.OLD_ENGINE||'/home/claude/work/engine.js');
const NEW=require('../../.parity/sim-engine.cjs');
const mk=E=>({nn:E.nn??E.reduce,qt:E.qt??E.createState,y:E.y??E.chapter,Ye:E.Ye??E.activeUnit,et:E.et??E.reachable,d:E.d??E.battleData});
let r=1;const rnd=()=>{r=(r*1103515245+12345)&0x7fffffff;return r/0x7fffffff;};const pick=a=>a[Math.floor(rnd()*a.length)];
let M;
function candidates(s){
 const c=[];const o=s.activeOrder;
 if(o){const good={};for(const f of o.fields)good[f]=String(o.answer[f]);const bad={};for(const f of o.fields)bad[f]=typeof o.answer[f]==='string'?o.operands.options.find(x=>x.id!==o.answer[f]).id:String(Number(o.answer[f])+7);
  const frac={};for(const f of o.fields)frac[f]=typeof o.answer[f]==='string'?o.answer[f]:(o.answer[f]*2)+'/2';
  c.push({type:'ANSWER',answer:good,now:5},{type:'ANSWER',answer:bad,now:6},{type:'ANSWER',answer:frac,now:7},{type:'HINT'},{type:'ADVISER'},{type:'COMPLETE',path:'adviser',now:9},{type:'COMPLETE',path:'proceedEstimate',answer:good,now:9},{type:'COMPLETE',path:'proceedEstimate',answer:bad,now:9},{type:'COMPLETE',path:'abandon',now:9},{type:'CLOSE_ORDER'});
  return c;}
 if(s.pendingReward!==null)return [{type:'AUDIT_REWARD',resource:pick(['food','currency','materials'])}];
 c.push({type:'ADVANCE'});
 switch(s.phase){
  case 'policy':for(const p of M.y(s.chapterIndex).policyChoices)c.push({type:'POLICY',id:p.id});break;
  case 'orders':for(const id of M.y(s.chapterIndex).orderIds)c.push({type:'OPEN_ORDER',id,now:1});c.push({type:'END_CHAPTER'},{type:'FORFEIT_SEALS'});break;
  case 'crisis':for(const resp of ['full','partial','accept'])c.push({type:'CRISIS_RESPONSE',response:resp,now:1});for(const e of ['currency','materials'])c.push({type:'CRISIS_RESPONSE',response:'full',emergency:e,now:1});break;
  case 'convoy_briefing':c.push({type:'CONVOY',start:true},{type:'CONVOY',start:rnd()<.3});break;
  case 'battle_provision':for(let k=1;k<=12;k++)c.push({type:'PREP_PROVISION',rounds:k,now:1});c.push({type:'SKIP_PROVISION'});break;
  case 'battle_warchest':for(let k=0;k<6;k++)c.push({type:'PREP_WARCHEST',equipment:[k%3,(k+1)%3,k%2],ammo:pick([0,2,6,12]),now:1});break;
  case 'battle_deployment':for(const p of ['standard','flanking','engineer','fire_discipline'])c.push({type:'PLAN',plan:p,reserve:pick(['east_ii','east_fukushima','east_kuroda']),entry:pick(['north','south'])});
   for(const f of s.battle.formations.filter(f=>f.side==='east'))for(const t of M.d.deploymentZones.east)c.push({type:'DEPLOY',id:f.id,point:t});c.push({type:'BEGIN_BATTLE'},{type:'BEGIN_BATTLE'},{type:'BEGIN_BATTLE'});break;
  case 'battle_round':{const b=s.battle;c.push({type:'BATTLE_COUNCIL',choice:pick(['open','continue','accept'])});if(rnd()<.02)c.push({type:'WITHDRAW'});
   const u=M.Ye(s);if(u&&u.side==='west'){c.length=0;c.push({type:'AI_TURN'});break;}
   if(u&&u.side==='east'){for(const p of M.et(s,u))c.push({type:'BATTLE',id:u.id,action:{kind:'move',point:{x:p.x,y:p.y}}});
    for(const t of b.formations)for(const k of ['attack','charge','volley','suppress'])c.push({type:'BATTLE',id:u.id,action:{kind:k,target:t.id}},{type:'BATTLE',id:u.id,action:{kind:k,target:t.id}});
    for(const k of ['defend','brace','forced_step','end'])c.push({type:'BATTLE',id:u.id,action:{kind:k}});
    for(const t of b.formations)c.push({type:'BATTLE',id:u.id,action:{kind:'rally',target:t.id}});
    for(let n=1;n<=4;n++)c.push({type:'BATTLE',id:u.id,action:{kind:'resupply',rounds:n}});
    for(const p of [{x:5,y:4},{x:5,y:5}])c.push({type:'BATTLE',id:u.id,action:{kind:'pontoon',point:p}});}
   break;}
 }
 return c;
}

function walk(E,s,steps){M=mk(E);for(let i=0;i<steps&&s.phase!=='campaign_report';i++){const cs=candidates(s);let ra;for(let t=0;t<12;t++){ra=M.nn(s,pick(cs));if(ra.events[0]?.type!=='RULE_VIOLATION')break;}if(ra.events[0]?.type!=='RULE_VIOLATION')s=ra.state;}return s;}
const runs=+process.argv[2]||6;let loaded=0,continued=0,errors=[];const phases={};
for(let seed=1;seed<=runs;seed++){r=seed*4241;M=mk(OLD);let s=M.qt(seed*17,'campaign');const seen=new Set();
 for(let i=0;i<3000&&s.phase!=='campaign_report';i++){M=mk(OLD);const cs=candidates(s);let ra;for(let t=0;t<12;t++){ra=M.nn(s,pick(cs));if(ra.events[0]?.type!=='RULE_VIOLATION')break;}if(ra.events[0]?.type!=='RULE_VIOLATION')s=ra.state;
  const key=s.phase+':'+s.chapterIndex;if(seen.has(key))continue;seen.add(key);
  try{const m=NEW.migrateState(JSON.parse(JSON.stringify(s)));NEW.saveStructure(m);NEW.invariants(m);loaded++;phases[s.phase]=(phases[s.phase]??0)+1;const after=walk(NEW,m,250);NEW.invariants(after);continued++;}catch(e){errors.push(key+': '+e.message);}
 }
}
console.log(JSON.stringify({savesLoaded:loaded,continued250Commands:continued,phases,errors:errors.slice(0,10)}));
