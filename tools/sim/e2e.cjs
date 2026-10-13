// End-to-end campaigns: strategy x math accuracy, reporting purchases, battle results and endings.
const {campaign,M}=require('./bot.cjs');
const P=require('./strategies.cjs');
const N=+process.argv[2]||40;const only=process.argv[3];
for(const [name,pri] of Object.entries(P)) for(const acc of [1,0.6]){
 if(only&&!name.startsWith(only))continue;
 const rows=[];for(let seed=1;seed<=N;seed++){try{rows.push(campaign(seed,{priority:pri,acc,equip:[2,2,2],ammo:12,rounds:12}))}catch(e){console.log('ERR',e.message)}}
 const c={},end={},rounds=[];let eq=0,am=0,ra=0,koba=0,gifu=0,mom=0;
 for(const {pre,out} of rows){c[out.result]=(c[out.result]??0)+1;end[out.ending]=(end[out.ending]??0)+1;rounds.push(out.round);eq+=pre.eq.reduce((a,b)=>a+b);am+=pre.ammo;ra+=pre.rounds;koba+=pre.koba;gifu+=pre.gifu?1:0;}
 rounds.sort((a,b)=>a-b);const n=rows.length,pc=k=>Math.round(100*(c[k]??0)/n)+'%';
 console.log(name.padEnd(10),'acc',String(acc).padEnd(3),'| win',pc('victory'),'loss',pc('defeat'),'draw',pc('draw'),'| rounds med',rounds[n>>1],'| bought: rations',(ra/n).toFixed(1),'equip',(eq/n).toFixed(1),'ammo',(am/n).toFixed(1),'| koba',Math.round(koba/n),'gifu',gifu+'/'+n,'| endings',JSON.stringify(end));
}
