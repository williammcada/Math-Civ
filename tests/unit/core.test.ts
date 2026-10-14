import {describe,it,expect} from 'vitest';
import {createState,reduce,legalOrders} from '../../src/core/reducer';
import {forecast,mandatoryRice} from '../../src/core/economy';
import {pressure,chance} from '../../src/core/crisis';
import {floor,ceil,round} from '../../src/core/fixedPoint';
import {solve,normalize} from '../../src/core/mathEngine';
import {math} from '../../src/content/registry';
import {validateContent} from '../../src/content/loader';
import {devStart,defaultDev} from '../../src/core/devPlaytest';
import {edoWatchTroops} from '../../src/core/reducer';
import {tierFor} from '../../src/core/scoring';
import {rng32} from '../../src/core/rng';
import type {State,Command} from '../../src/core/types';
function go(s:State,c:Command){const r=reduce(s,c);expect(r.events.some(e=>e.type==='RULE_VIOLATION'),JSON.stringify(r.events)).toBe(false);return r.state;}
function orders(){let s=createState();s.phase='orders';return s;}
describe('Foundation checkpoint',()=>{
 it('adviser answer cannot be resubmitted for a higher reward',()=>{let s=go(orders(),{type:'OPEN_ORDER',id:'c1_tax_register'});s=go(s,{type:'ANSWER',answer:{households:0}});s=go(s,{type:'ADVISER'});expect(reduce(s,{type:'ANSWER',answer:s.activeOrder!.answer}).state).toBe(s);s=go(s,{type:'COMPLETE',path:'adviser'});expect(s.challengeRecords[0].masteryPoints).toBe(25);});
 it('formatted numeric input remains a valid actual allocation when proceeding',()=>{let s=go(orders(),{type:'OPEN_ORDER',id:'c1_labor_ledger'});s=go(s,{type:'ANSWER',answer:{farms:'2,000',workshops:'1,000',works:'500'}});s=go(s,{type:'COMPLETE',path:'proceedEstimate'});expect(s.edo.laborAllocation).toEqual({farms:2000,workshops:1000,works:500});expect(s.challengeRecords[0].masteryPoints).toBe(0);});
 it('fixed point and negative half-up',()=>{expect(floor(5,1,2)).toBe(2);expect(ceil(5,1,2)).toBe(3);expect(round(5,1,2)).toBe(3);expect(round(-5,1,2)).toBe(-3);expect([1100,850,650,500].map(q=>round(120,q,1000))).toEqual([132,102,78,60]);});
 it('all content passes the same schema check the game runs at start-up (v0.5)',()=>{expect(()=>validateContent()).not.toThrow();});
 it('Edo watch: weak Edo keeps up to 400 soldiers home; DEV option covers both cases (v0.5)',()=>{const s=createState();expect(edoWatchTroops(s)).toBe(400);s.edo.defense=74;expect(edoWatchTroops(s)).toBe(0);s.edo.defense=62;expect(edoWatchTroops(s)).toBe(200);
  const sum=(st:ReturnType<typeof createState>)=>st.playerArmy.formations.reduce((n,f)=>n+f.troops,0);
  const guarded=devStart({...defaultDev,start:'battle_prep',edoGuarded:true},7),open=devStart({...defaultDev,start:'battle_prep',edoGuarded:false},7);
  expect(guarded.eventLog.some(e=>e.type==='EDO_WATCH')).toBe(false);expect(open.eventLog.find(e=>e.type==='EDO_WATCH')?.detail?.troops).toBe(400);expect(sum(guarded)-sum(open)).toBe(400);});
 it('starting economy matches P0-011',()=>{expect(forecast(createState())).toMatchObject({labor:{farms:2244,workshops:1346,works:897},rice:176,materials:52 /* v0.5 §2.5: workshop output 6→4 per 100 labor (was 78) */,progress:16,infrastructure:1,taxable:2148,treasury:215,civilian:120,garrison:8,wages:96});});
 it('route supplies match P0-012',()=>{const s=createState();s.playerArmy.active=true;for(const [route,need] of [['prepared',96],['unprepared',120],['damaged',144]] as const){s.playerArmy.routeState=route;expect(forecast(s).field).toBe(need);}});
 it('pressure and thresholds',()=>{expect(mandatoryRice(createState())).toBe(128);expect(pressure(createState()).total).toBe(8);expect([24,25,35,50,70,75,100].map(chance)).toEqual([500,1500,1500,3000,3000,5000,5000]);});
 for(const t of math.templates)it('recomputes both variants: '+t.id,()=>{for(const v of t.variants)expect(solve(t.id,v.operands)).toEqual(v.answer);});
 it('input normalization',()=>{for(const x of ['3,000',' 3000 ','+3000'])expect(normalize(x)).toBe(3000);for(const x of ['3e3','NaN','Infinity',''])expect(normalize(x)).toBeNull();});
 for(const [failures,gain,mastery] of [[0,132,100],[1,102,75],[2,78,50]])it('tax order attempt '+(failures+1),()=>{let s=go(orders(),{type:'OPEN_ORDER',id:'c1_tax_register'});for(let i=0;i<failures;i++)s=go(s,{type:'ANSWER',answer:{households:0}});const answer=s.activeOrder!.answer;s=go(s,{type:'ANSWER',answer});expect(s.resources.currency).toBe(520+gain);expect(s.commandSeals).toBe(2);expect(s.challengeRecords[0].masteryPoints).toBe(mastery);expect(s.eventLog.some(e=>e.type==='PRECISION_AWARDED')).toBe(failures===0);});
 it('adviser requires worked solution confirmation',()=>{let s=go(orders(),{type:'OPEN_ORDER',id:'c1_tax_register'});s=go(s,{type:'ANSWER',answer:{households:0}});expect(reduce(s,{type:'COMPLETE',path:'adviser'}).events[0].type).toBe('RULE_VIOLATION');s=go(s,{type:'ADVISER'});s=go(s,{type:'COMPLETE',path:'adviser'});expect(s.resources.currency).toBe(580);expect(s.challengeRecords[0].masteryPoints).toBe(25);});
 it('guided method caps reward',()=>{let s=orders();s.mode='guided';s=go(s,{type:'OPEN_ORDER',id:'c1_tax_register'});s=go(s,{type:'HINT'});s=go(s,{type:'ANSWER',answer:s.activeOrder!.answer});expect(s.resources.currency).toBe(622);});
 for(const mode of ['guided','campaign','scholar'] as const)it(mode+' permits exactly three tries with diminishing rewards',()=>{let s=orders();s.mode=mode;s=go(s,{type:'OPEN_ORDER',id:'c1_tax_register'});s=go(s,{type:'ANSWER',answer:{households:0}});s=go(s,{type:'ANSWER',answer:{households:0}});s=go(s,{type:'ANSWER',answer:s.activeOrder!.answer});expect(s.challengeRecords[0]).toMatchObject({attempts:3,path:'attempt3',masteryPoints:50,effectPerThousand:650});expect(s.resources.currency).toBe(598);expect(s.commandSeals).toBe(2);let failed=orders();failed.mode=mode;failed=go(failed,{type:'OPEN_ORDER',id:'c1_tax_register'});for(let n=0;n<3;n++)failed=go(failed,{type:'ANSWER',answer:{households:0}});expect(reduce(failed,{type:'ANSWER',answer:failed.activeOrder!.answer}).state).toBe(failed);});
 it('approved forfeit has no reward and only applies to blocked Orders',()=>{let s=orders();s.chapterIndex=3;s.resources={food:0,currency:0,materials:0,authority:5};expect(legalOrders(s)).toEqual(['audit_stores']);expect(reduce(s,{type:'FORFEIT_SEALS'}).state).toEqual(s);s=go(s,{type:'OPEN_ORDER',id:'audit_stores'});s=go(s,{type:'ANSWER',answer:s.activeOrder!.answer});s=go(s,{type:'AUDIT_REWARD',resource:'food'});expect(s.resources.food).toBe(55);expect(legalOrders(s)).toEqual([]);const before=structuredClone(s);s=go(s,{type:'FORFEIT_SEALS'});expect(s.commandSeals).toBe(0);expect(s.resources).toEqual(before.resources);expect(s.challengeRecords).toEqual(before.challengeRecords);s=go(s,{type:'END_CHAPTER'});expect(s.phase).toBe('administration');});
 it('ordinary legal order blocks forfeiture',()=>{const s=orders();expect(reduce(s,{type:'FORFEIT_SEALS'}).state).toEqual(s);});
 it('ending boundaries use both axes',()=>{expect(tierFor(74,90,'victory',false,0,70)).toBe('normal');expect(tierFor(100,69,'victory',false,0,70)).toBe('normal');expect(tierFor(75,70,'victory',false,1,70)).toBe('good');expect(tierFor(100,90,'victory',true,0,70)).toBe('bad');});
 it('seed sequence repeatable',()=>{expect(Array.from({length:100},(_,i)=>rng32(16001021,i))).toEqual(Array.from({length:100},(_,i)=>rng32(16001021,i)));});
 it('illegal command preserves exact state and RNG',()=>{const s=createState();const result=reduce(s,{type:'END_CHAPTER'});expect(result.state).toBe(s);expect(result.events[0].type).toBe('RULE_VIOLATION');});
});
