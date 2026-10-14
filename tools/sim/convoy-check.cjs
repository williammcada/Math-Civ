// v0.5 (F3) convoy check: who acts first, and outcomes when the escort blocks the road west of the bridge.
// Usage: node tools/sim/convoy-check.cjs [N]   (NAIVE=1: the escort never moves to block)
const E=require('../../.parity/sim-engine.cjs');const N=+process.argv[2]||200;
const step=(s,c)=>{const r=E.reduce(s,c);return r.events[0]?.type==='RULE_VIOLATION'?null:r.state;};
for(const road of ['unprepared','prepared']){const first={east:0,west:0},out={intact:0,damaged:0,lost:0};
 for(let seed=1;seed<=N;seed++){let s=E.createState(seed);s.phase='convoy_briefing';s.playerArmy.routeState=road;s=E.reduce(s,{type:'CONVOY',start:true}).state;
  let b=s.battle;first[b.formations.find(f=>f.id===b.queue[b.activeIndex]).side]++;
  for(let i=0;i<400&&s.phase==='battle_round';i++){const u=E.activeUnit(s);if(!u)break;
   if(u.side==='west'){s=E.reduce(s,{type:'AI_TURN'}).state;continue;}
   let n=null;const block={x:3,y:2},enemies=s.battle.formations.filter(f=>f.side==='west'&&E.alive(f));
   for(const k of (u.archetype==='arquebus'?['volley','attack']:['attack']))for(const t of enemies){n=n??step(s,{type:'BATTLE',id:u.id,action:{kind:k,target:t.id}});}
   if(!n&&!process.env.NAIVE&&u.id==='convoy_spears'&&!(u.x===block.x&&u.y===block.y)){const r=E.reachable(s,u).sort((a,b)=>Math.abs(a.x-block.x)+Math.abs(a.y-block.y)-Math.abs(b.x-block.x)-Math.abs(b.y-block.y))[0];if(r)n=step(s,{type:'BATTLE',id:u.id,action:{kind:'move',point:r}});}
   s=n??step(s,{type:'BATTLE',id:u.id,action:{kind:'defend'}})??step(s,{type:'BATTLE',id:u.id,action:{kind:'end'}})??s;}
  out[String(s.flags.convoy_status)]=(out[String(s.flags.convoy_status)]??0)+1;}
 console.log('road',road,'first to act',JSON.stringify(first),'outcome',JSON.stringify(out));}
