// v0.5 policy audit (§2.5): for each chapter, try each of its three policies with the other chapters on policy 0,
// using the default order picks, and compare battle and ending results. Usage: node policy-audit.cjs [N]
const {campaign}=require('./bot.cjs');
const base={1:['c1_court_letters','c1_repair_tokaido','c1_tax_register','c1_labor_ledger','audit_stores'],2:['c2_secure_allies','c2_march_provisions','c2_muster_bands','c2_reinforce_edo','kobayakawa_letter','audit_stores'],3:['c3_secure_gifu','c3_kiyosu_stores','c3_oyama_march','c3_home_relief','kobayakawa_letter','audit_stores'],4:['c4_kobayakawa','c4_forward_granaries','c4_fieldworks','c4_weather_scouts','kobayakawa_letter','audit_stores']};
const N=+process.argv[2]||30;
function run(policy,label){const rows=[];for(let seed=1;seed<=N;seed++){try{rows.push(campaign(seed,{priority:base,policy,acc:0.8,equip:[2,2,2],ammo:12,rounds:12}))}catch(e){}}
 const n=rows.length,avg=f=>rows.reduce((a,r)=>a+f(r),0)/n;
 return {label,n,win:avg(r=>r.out.result==='victory'?100:0).toFixed(0),realm:avg(r=>r.out.realm??0).toFixed(0),good:avg(r=>r.out.ending==='good'?100:0).toFixed(0),bad:avg(r=>r.out.ending==='bad'?100:0).toFixed(0),crises:avg(r=>r.state.crises.length).toFixed(2),koba:avg(r=>r.pre.koba).toFixed(0),troops:avg(r=>r.pre.troops.reduce((a,b)=>a+b,0)).toFixed(0),morale:avg(r=>r.pre.eastMorale.reduce((a,b)=>a+b,0)/3).toFixed(0),order:avg(r=>r.state.edo.publicOrder).toFixed(0)};}
const out=[];for(const ch of [0,1,2,3])for(const i of [0,1,2]){if(ch>0&&i===0)continue;const p=[0,0,0,0];p[ch]=i;out.push(run(p,`ch${ch+1} policy ${i}`));}
for(const r of out)console.log(JSON.stringify(r));
