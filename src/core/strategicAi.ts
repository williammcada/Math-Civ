import {campaign} from '../content/registry';
import type {State,Resource} from './types';
import {delta,event} from './effects';
import {clamp,round} from './fixedPoint';
import {roll} from './rng';
import {rules} from './logistics';
export function strategicAi(s:State){const w=s.westernState;
 // v0.4 (B1): Ishida courts Kobayakawa every chapter, so his loyalty must be maintained.
 if(s.chapterIndex>=rules.kobayakawa.ishidaLettersFromChapter){delta(s,'diplomacy.kobayakawaCommitment',rules.kobayakawa.ishidaLetterPerChapter,'ishida.letters');event(s,'ISHIDA_LETTERS','kobayakawa',{change:rules.kobayakawa.ishidaLetterPerChapter});}const signalsBefore=[...w.signals];for(let i=0;i<2;i++){
 const candidates=campaign.strategicAiActions.filter(a=>Object.entries(a.cost).every(([r,v])=>w.resources[r as Resource]>=(v??0))&&(!a.oncePerCampaign||!w.used.includes(a.id))&&(!a.requiresPriorSignal||signalsBefore.includes(a.requiresPriorSignal))&&(a.id!=='ai_fortify_gifu'||!s.flags.gifu_controlled)&&(a.id!=='ai_repair_route'||w.routeDamaged));
 const scored=candidates.sort((a,b)=>a.id.localeCompare(b.id)).map(a=>{const urgency=a.priority==='supply'?(w.resources.food<300?95:25):a.priority==='coalition'?(s.diplomacy.kobayakawaCommitment>=55?90:55):a.priority==='fortification'?55:a.priority==='force'?60:a.priority==='pressure'?65:20;const leader=a.priority==='coalition'?90:a.priority==='fortification'?80:50;const objective=s.chapterIndex>=3&&a.priority==='pressure'?90:60;const response=s.flags.gifu_controlled&&a.priority==='fortification'?85:50;return {a,score:round(urgency*40+leader*25+objective*20+response*15,1,100)+roll(s,-5,5)};}).sort((a,b)=>b.score-a.score||a.a.id.localeCompare(b.a.id));
 const a=scored[0].a,q=850+roll(s,-5,5)*10;Object.entries(a.cost).forEach(([r,v])=>w.resources[r as Resource]-=v??0);w.used.push(a.id);
 for(const [k,v] of Object.entries(a.effects)){if(v===undefined)continue;if(k==='signal'){if(!w.signals.includes(String(v)))w.signals.push(String(v));continue;}const amount=round(Number(v),q,1000);if(['food','currency','materials','authority'].includes(k))w.resources[k as Resource]=clamp(w.resources[k as Resource]+amount,0,k==='authority'?100:9999);else if(k==='kobayakawaCommitment')delta(s,'diplomacy.kobayakawaCommitment',amount,a.id);else if(k==='westernMomentum'){delta(s,'threats.westernMomentum',amount,a.id);w.momentum=clamp(w.momentum+amount);}else if(k==='playerFood')delta(s,'resources.food',amount,a.id);else if(k==='playerReadiness')delta(s,'playerArmy.readiness',amount,a.id);else if(k==='troops')w.troopGain+=amount;else if(k==='gifuDefense')w.gifuDefense+=amount;else if(k==='ogakiDefense')w.ogakiDefense+=amount;else if(k==='routeRepair')w.routeDamaged=false;}
 event(s,'AI_ACTION_TAKEN',a.id,{cost:a.cost,quality:q,candidates:scored.map(c=>({id:c.a.id,utility:c.score}))});
}}
