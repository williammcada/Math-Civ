// Order priorities used by the campaign sweeps. null = the bot's default (diplomacy first).
module.exports={
 diplomacy:null,
 economy:{1:['c1_labor_ledger','c1_tax_register','audit_stores','c1_repair_tokaido','c1_court_letters'],2:['c2_muster_bands','c2_march_provisions','audit_stores','c2_reinforce_edo','c2_secure_allies'],3:['c3_kiyosu_stores','c3_home_relief','audit_stores','c3_oyama_march','c3_secure_gifu'],4:['c4_forward_granaries','c4_fieldworks','audit_stores','c4_weather_scouts','c4_kobayakawa']},
 military:{1:['c1_repair_tokaido','c1_tax_register','c1_labor_ledger','audit_stores','c1_court_letters'],2:['c2_muster_bands','c2_march_provisions','c2_reinforce_edo','audit_stores','c2_secure_allies'],3:['c3_secure_gifu','c3_oyama_march','c3_kiyosu_stores','audit_stores','c3_home_relief'],4:['c4_fieldworks','c4_forward_granaries','c4_weather_scouts','audit_stores','c4_kobayakawa']},
 audit_spam_first:{1:['audit_stores','c1_court_letters','c1_tax_register','c1_labor_ledger','c1_repair_tokaido'],2:['audit_stores','c2_secure_allies','c2_march_provisions','c2_muster_bands','c2_reinforce_edo'],3:['audit_stores','c3_kiyosu_stores','c3_secure_gifu','c3_oyama_march','c3_home_relief'],4:['audit_stores','c4_kobayakawa','c4_forward_granaries','c4_weather_scouts','c4_fieldworks']},
};
