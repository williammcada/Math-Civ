// v0.5 F5 check: the Western council never takes the same action twice in one chapter. Usage: node west-repeat.cjs [seeds]
const {campaign}=require('./bot.cjs');const N=+process.argv[2]||40;let chapters=0,repeats=0,actions=0;
for(let seed=1;seed<=N;seed++){const {state}=campaign(seed,{noBattle:true,acc:0.8});const by={};
 for(const e of state.eventLog.filter(e=>e.type==='AI_ACTION_TAKEN')){(by[e.chapter]??=[]).push(e.key);actions++;}
 for(const list of Object.values(by)){chapters++;if(new Set(list).size<list.length)repeats++;}}
console.log(JSON.stringify({campaigns:N,chapters,actions,chaptersWithRepeat:repeats}));
