// Campaign strategy x math-accuracy sweep (state at the battle).
const {campaign}=require('./bot.cjs');
const P={
 diplomacy:null,
 economy:{1:['c1_labor_ledger','c1_tax_register','audit_stores','c1_repair_tokaido','c1_court_letters'],2:['c2_muster_bands','c2_march_provisions','audit_stores','c2_reinforce_edo','c2_secure_allies'],3:['c3_kiyosu_stores','c3_home_relief','audit_stores','c3_oyama_march','c3_secure_gifu'],4:['c4_forward_granaries','c4_fieldworks','audit_stores','c4_weather_scouts','c4_kobayakawa']},
 military:{1:['c1_repair_tokaido','c1_tax_register','c1_labor_ledger','audit_stores','c1_court_letters'],2:['c2_muster_bands','c2_march_provisions','c2_reinforce_edo','audit_stores','c2_secure_allies'],3:['c3_secure_gifu','c3_oyama_march','c3_kiyosu_stores','audit_stores','c3_home_relief'],4:['c4_fieldworks','c4_forward_granaries','c4_weather_scouts','audit_stores','c4_kobayakawa']},
 audit_spam_first:{1:['audit_stores','c1_court_letters','c1_tax_register','c1_labor_ledger','c1_repair_tokaido'],2:['audit_stores','c2_secure_allies','c2_march_provisions','c2_muster_bands','c2_reinforce_edo'],3:['audit_stores','c3_kiyosu_stores','c3_secure_gifu','c3_oyama_march','c3_home_relief'],4:['audit_stores','c4_kobayakawa','c4_forward_granaries','c4_weather_scouts','c4_fieldworks']},
};
for(const [name,pri] of Object.entries(P)) for(const acc of [1,0.6,0.3]){
  const rows=[]; for(let seed=1;seed<=60;seed++){ try{rows.push(campaign(seed,{priority:pri,acc,noBattle:true}).pre)}catch(e){console.log('ERR',e.message)} }
  const avg=k=>Math.round(rows.reduce((a,r)=>a+r[k],0)/rows.length);
  const band=r=>r.koba>=70?'E':r.koba>=40?'I':'W';
  const bands={E:0,I:0,W:0}; rows.forEach(r=>bands[band(r)]++);
  console.log(name.padEnd(17),'acc',acc,'| koba avg',avg('koba'),'bands',JSON.stringify(bands),'| coh',avg('coh'),'| gifu',rows.filter(r=>r.gifu).length+'/'+rows.length,'| road prepared',rows.filter(r=>r.road==='prepared').length,'| food',avg('food'),'prot',avg('prot'),'cur',avg('cur'),'mat',avg('mat'),'auth',avg('auth'),'| supply rounds avail',avg('maxRounds'),'| crises',rows.filter(r=>r.crises.length).length,'| mastery',avg('mastery'));
}
