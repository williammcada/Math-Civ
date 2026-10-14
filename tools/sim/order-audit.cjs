// v0.5 order audit: for each order, either drop it from the default three picks (replaced by the next order)
// or swap it in for the default's third pick, and compare battle and ending results with the default campaign. Usage: node order-audit.cjs [N]
const {campaign}=require('./bot.cjs');
const base={1:['c1_court_letters','c1_repair_tokaido','c1_tax_register','c1_labor_ledger','audit_stores'],2:['c2_secure_allies','c2_march_provisions','c2_muster_bands','c2_reinforce_edo','audit_stores'],3:['c3_secure_gifu','c3_kiyosu_stores','c3_oyama_march','c3_home_relief','audit_stores'],4:['c4_kobayakawa','c4_forward_granaries','c4_fieldworks','c4_weather_scouts','audit_stores']};
const N=+process.argv[2]||30;
function run(pri,label,skip){const rows=[];for(let seed=1;seed<=N;seed++){try{rows.push(campaign(seed,{priority:pri,acc:0.8,equip:[2,2,2],ammo:12,rounds:12}))}catch(e){}}
 const n=rows.length,avg=f=>rows.reduce((a,r)=>a+f(r),0)/n,win=avg(r=>r.out.result==='victory'?100:0);
 return {label,win:win.toFixed(0),realm:avg(r=>r.out.realm??0).toFixed(0),good:avg(r=>r.out.ending==='good'?100:0).toFixed(0),bad:avg(r=>r.out.ending==='bad'?100:0).toFixed(0),crises:avg(r=>r.state.crises.length).toFixed(2),koba:avg(r=>r.pre.koba).toFixed(0),troops:avg(r=>r.pre.troops.reduce((a,b)=>a+b,0)).toFixed(0),morale:avg(r=>r.pre.eastMorale.reduce((a,b)=>a+b,0)/3).toFixed(0),order:avg(r=>r.state.edo.publicOrder).toFixed(0)};}
const out=[run(base,'DEFAULT (diplomacy first)')];
for(const ch of [1,2,3,4])for(const id of base[ch]){if(id==='audit_stores'&&ch>1)continue;const pri=JSON.parse(JSON.stringify(base));pri[ch]=[id,...base[ch].filter(x=>x!==id)];
 // the forced order takes the place of the default's third pick, keeping the first two
 const third=base[ch][2],picks=base[ch].slice(0,3);if(picks.includes(id)){pri[ch]=[...picks.filter(x=>x!==id),...base[ch].slice(3)];out.push(run(pri,`ch${ch} WITHOUT ${id}`));}
 else{pri[ch]=[base[ch][0],base[ch][1],id,...base[ch].filter(x=>![base[ch][0],base[ch][1],id].includes(x))];out.push(run(pri,`ch${ch} ${id} instead of ${third}`));}}
for(const r of out)console.log(JSON.stringify(r));
