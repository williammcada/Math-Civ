// Random-walk parity fuzzer. Build both engines first (see README.md), then: node tools/parity/fuzz.cjs <runs> <maxSteps>
// Random-walk fuzzer: picks commands that are legal on the shipped 0.3.1 engine and replays them on the source engine.
const M=require(process.env.SHIPPED||'../../.parity/shipped-engine.cjs');
const S=require(process.env.SOURCE||'../../.parity/source-engine.cjs');
const strip=s=>{const c=JSON.parse(JSON.stringify(s));delete c.buildVersion;return c;};
function deepDiff(a,b,p='',out=[]){if(out.length>12)return out;if(typeof a!==typeof b||Array.isArray(a)!==Array.isArray(b)){out.push(p+': '+String(JSON.stringify(a)).slice(0,90)+' vs '+String(JSON.stringify(b)).slice(0,90));return out;}
 if(a&&typeof a==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))deepDiff(a[k],b[k],p+'.'+k,out);}else if(a!==b)out.push(p+': '+JSON.stringify(a)+' vs '+JSON.stringify(b));return out;}
let r=1;const rnd=()=>{r=(r*1103515245+12345)&0x7fffffff;return r/0x7fffffff;};const pick=a=>a[Math.floor(rnd()*a.length)];
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
const N=+process.argv[2]||20, maxSteps=+process.argv[3]||3000;const kinds={};let total=0,legal=0,ended=0;
const START=+process.env.START||1;for(let seed=START;seed<START+N;seed++){
 r=seed*7777;let a=M.qt(seed*13,pick(['campaign','guided','scholar'])),b=S.createState(seed*13,a.mode);
 let d=deepDiff(strip(a),strip(b));if(d.length){console.log('create diff',d);break;}
 for(let i=0;i<maxSteps&&a.phase!=='campaign_report';i++){
  const cs=candidates(a);let cmd,ra;for(let t=0;t<12;t++){cmd=pick(cs);ra=M.nn(a,cmd);if(ra.events[0]?.type!=='RULE_VIOLATION')break;}
  const rb=S.reduce(b,cmd);total++;if(ra.events[0]?.type!=='RULE_VIOLATION')legal++;
  const va=ra.events[0]?.type==='RULE_VIOLATION'?ra.events[0].key:null, vb=rb.events[0]?.type==='RULE_VIOLATION'?rb.events[0].key:null;
  if(va!==vb){const k='VIOLATION '+cmd.type+(cmd.action?':'+cmd.action.kind:'')+' | '+va+' vs '+vb;kinds[k]=kinds[k]||{n:0,seed,i};kinds[k].n++;}
  a=ra.state;b=rb.state;
  const dd=deepDiff(strip(a),strip(b));
  if(dd.length){for(const x of dd){const k=cmd.type+(cmd.action?':'+cmd.action.kind:'')+' | '+x.replace(/\.\d+/g,'.N').replace(/: .*/,'');if(!kinds[k])kinds[k]={n:0,ex:x.slice(0,200),seed,i,phase:a.phase};kinds[k].n++;}b=JSON.parse(JSON.stringify(a));}
 }
 if(a.phase==='campaign_report')ended++;
}
console.log(JSON.stringify({total,legal,ended,runs:N},null,0));
for(const [k,v] of Object.entries(kinds).sort((x,y)=>y[1].n-x[1].n).slice(0,40))console.log(v.n,k,'||',v.ex??'',v.seed,v.i,v.phase??'');
