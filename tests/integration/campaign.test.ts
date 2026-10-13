import {describe,it,expect} from 'vitest';
import {createState,reduce,legalOrders} from '../../src/core/reducer';
import {chapter,order} from '../../src/content/registry';
import {createBattle,beginBattle,activeUnit,reachable,canAttack,combatPreview,entryTile,setPlan} from '../../src/core/battle';
import {pressure,currentCrisis,crisisCost,emergencyCost} from '../../src/core/crisis';
import {canPay} from '../../src/core/effects';
import {invariants} from '../../src/core/invariants';
import {envelope,verify} from '../../src/persistence/saveRepository';
import type {State,Command} from '../../src/core/types';
function step(s:State,c:Command){const r=reduce(s,c);expect(r.events[0]?.type,JSON.stringify({phase:s.phase,c,events:r.events})).not.toBe('RULE_VIOLATION');invariants(r.state);return r.state;}
function play(seed:number){let s=createState(seed),count=0;while(s.phase!=='campaign_report'&&count++<600){let c:Command={type:'ADVANCE'};
 if(s.activeOrder){c={type:'ANSWER',answer:s.activeOrder.answer};const rice=Number(s.activeOrder.answer.rice??0);if(rice>s.resources.food+s.playerArmy.protectedBattleRice+(s.activeOrder.paid.food??0)){if(s.activeOrder.attempts)c={type:'COMPLETE',path:'abandon'};else c={type:'ANSWER',answer:Object.fromEntries(s.activeOrder.fields.map(k=>[k,0]))};}}
 else if(s.pendingReward!==null)c={type:'AUDIT_REWARD',resource:'food'};
 else if(s.phase==='policy'){const p=chapter(s.chapterIndex).policyChoices.find(p=>canPay(s,p.cost))!;c={type:'POLICY',id:p.id};}
 else if(s.phase==='orders'){if(!s.commandSeals)c={type:'END_CHAPTER'};else {const legal=legalOrders(s);c=legal.length?{type:'OPEN_ORDER',id:legal[seed%legal.length]}:{type:'FORFEIT_SEALS'};}}
 else if(s.phase==='crisis')c={type:'CRISIS_RESPONSE',response:'accept'};
 else if(s.phase==='convoy_briefing')c={type:'CONVOY',start:s.resources.food>=30&&s.resources.materials>=20};
 else if(s.phase==='battle_provision')c=s.resources.food+s.playerArmy.protectedBattleRice<s.playerArmy.formations.reduce((a,f)=>a+Math.ceil(f.troops/300),0)?{type:'SKIP_PROVISION'}:{type:'PREP_PROVISION',rounds:1};
 else if(s.phase==='battle_warchest')c={type:'PREP_WARCHEST',equipment:[0,0,0],ammo:Math.min(3,Math.floor(s.resources.materials/10))};
 else if(s.phase==='battle_deployment')c={type:'BEGIN_BATTLE'};
 else if(s.phase==='battle_round'&&s.battle!.councilPending)c={type:'BATTLE_COUNCIL',choice:'accept'};
 else if(s.phase==='battle_round'&&!s.battle!.dispatchPending){const u=activeUnit(s)!;if(u.side==='west')c={type:'AI_TURN'};else {const kind=u.archetype==='arquebus'?'volley':'attack',target=s.battle!.formations.find(t=>canAttack(s,u,t,kind));const p=reachable(s,u).sort((a,b)=>(Math.abs((s.battle!.scenarioId==='convoy'?4:9)-a.x)+Math.abs((s.battle!.scenarioId==='convoy'?2:3)-a.y))-(Math.abs((s.battle!.scenarioId==='convoy'?4:9)-b.x)+Math.abs((s.battle!.scenarioId==='convoy'?2:3)-b.y)))[0];c={type:'BATTLE',id:u.id,action:target?{kind,target:target.id}:p?{kind:'move',point:p}:{kind:'end'}};}}
 s=step(s,c);
 }expect(s.phase).toBe('campaign_report');return {s,count};}
describe('Simulation integration',()=>{
 it('10,000+ legal transitions with invariants and complete endings',()=>{let n=0;for(let seed=1;n<10000;seed++){const r=play(seed);n+=r.count;}expect(n).toBeGreaterThanOrEqual(10000);},30000);
 it('same seed and command policy produce the same full campaign',()=>{expect(play(16001021).s).toEqual(play(16001021).s);});
 it('occupied auxiliary entry chooses deterministic nearest free tile',()=>{const s=createState();createBattle(s);s.battle!.formations[0].x=4;s.battle!.formations[0].y=7;expect(entryTile(s,{x:4,y:7})).toEqual({x:4,y:6});});
 it('Western equipment and supply spend actual resources',()=>{const s=createState();s.westernState.resources.food=100;s.westernState.resources.materials=65;createBattle(s);expect(s.battle!.supply.west).toBe(3);expect(s.westernState.resources.food).toBe(7);expect(s.battle!.ammo.west).toBe(6);expect(s.westernState.resources.materials).toBe(5);});
 it('baseline combat matches P0-052',()=>{const s=createState();createBattle(s);setPlan(s,'west','standard');const a=s.battle!.formations[0],d=s.battle!.formations[3];a.morale=82;d.morale=76;a.x=3;a.y=1;d.x=4;d.y=1;s.battle!.supply.east=5;const p=combatPreview(s,a,d);expect(p).toMatchObject({defenderLoss:260,attackerLoss:330,defenderMoraleLoss:9,attackerMoraleLoss:6});});
 it('pressure caps at 100 and emergency cannot create Rice',()=>{const s=createState();s.resources={food:0,currency:0,materials:0,authority:15};s.edo.publicOrder=35;s.edo.infrastructure=30;s.threats.westernMomentum=90;expect(pressure(s).total).toBe(100);expect(()=>emergencyCost(s,{food:60},'food')).toThrow();});
 it('save checksum and future schema protection',async()=>{const e=await envelope(createState(),'Test');expect((await verify(e)).state.seed).toBe(16001021);e.state.resources.food++;await expect(verify(e)).rejects.toThrow();await expect(verify({...e,schemaVersion:3})).rejects.toThrow();});
 it('cannot complete a resolved order twice',()=>{let s=createState();s.phase='orders';s=step(s,{type:'OPEN_ORDER',id:'c1_tax_register'});s=step(s,{type:'ANSWER',answer:s.activeOrder!.answer});expect(reduce(s,{type:'COMPLETE',path:'adviser'}).state).toBe(s);});
});
