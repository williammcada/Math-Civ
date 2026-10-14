// v0.5 Field Guide (spec §2.1): one infographic guide with six tabs, opened from the title screen,
// the bottom bar on every screen, and the battle's More menu. Every number is read from the rules
// and content files so the guide cannot drift from the game.
import {rules} from '../core/logistics';
import {campaign,balance,battle as battleData,chapter,text} from '../content/registry';
import {orderTags} from './playerCopy';
import {frame,pos,icons} from './battleBoard';
import {icon} from './cards';
import {assetURL} from './assets';
import {esc,num} from './helpers';

export type GuideTab='road'|'resources'|'allies'|'battle'|'terrain'|'march';
export const guideTabs:[GuideTab,string][]=[['road','The road'],['resources','Resources'],['allies','Allies & enemies'],['battle','Battle'],['terrain','Terrain'],['march','Before you march']];
/** The tab that fits where the player is. */
export function guideTabFor(phase:string|undefined):GuideTab{
 if(!phase)return 'road';
 if(['battle_deployment','battle_round','battle_result','convoy_briefing','convoy_result'].includes(phase))return 'battle';
 if(['battle_review','battle_provision','battle_warchest'].includes(phase))return 'march';
 return 'road';
}
const svg=(d:string)=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
const pct=(perThousand:number)=>{const d=Math.round(perThousand/10)-100;return (d>0?'+':d<0?'−':'±')+Math.abs(d)+'%';};
const tile=(t:string)=>`<span class="gd-tile${t==='mud'?' gd-mud':''}" style="background-position:${pos(frame[t]??0)}"></span>`;
const unitTile=(side:'east'|'west',i:number)=>`<span class="gd-tile" style="background-position:${pos((side==='east'?8:12)+i)}"></span>`;

function road(){
 const chapters=campaign.chapters.map((c,i)=>{
  const ids=chapter(i+1).orderIds.filter(id=>id!=='audit_stores');
  const lines=ids.map(id=>{const t=orderTags(id);return t.field.length?`<li><b>${esc(text('order.'+id+'.title'))}</b> → ${esc(t.field[0])}</li>`:'';}).join('');
  return `<div class="gd-step"><div class="gd-num">${i+1}</div><h4>${esc(text(c.titleStringId))}</h4><small>3 orders from ${ids.length+1}</small><ul>${lines}</ul></div>`;}).join('<div class="gd-arrow">→</div>');
 return `<p class="gd-lead">Four chapters of decisions, then one battle you command yourself. What you build in each chapter shows up on the battlefield.</p>
 <div class="gd-flow">${chapters}<div class="gd-arrow">→</div><div class="gd-step gd-gold"><div class="gd-num">${icon('field')}</div><h4>Prepare</h4><small>Pack rations, buy equipment and ammunition</small></div><div class="gd-arrow">→</div><div class="gd-step gd-red"><div class="gd-num">⚔</div><h4>Sekigahara</h4><small>Your three units against the Western army</small></div><div class="gd-arrow">→</div><div class="gd-step"><div class="gd-num">★</div><h4>Ending</h4><small>Good, Normal or Bad: math, realm and battle together</small></div></div>
 <p class="gd-note">Each chapter: pick one council policy (free), then issue three orders. Each order is a math problem; a correct first answer gives the strongest result. Order cards show what each order does <b>At Sekigahara</b> and <b>At home</b>.</p>`;
}

function resources(){
 const e=balance.economy,b=rules.battle;
 const card=(k:string,name:string,from:string,spend:string,battle:string)=>`<div class="gd-res">${icon(k,'ico gd-big')}<h4>${name}</h4><dl><dt>Comes from</dt><dd>${from}</dd><dt>Spent on</dt><dd>${spend}</dd><dt class="gd-field">At the battle</dt><dd class="gd-field">${battle}</dd></dl></div>`;
 return `<p class="gd-lead">Four resources carry your campaign into battle. Whatever is left at the end also counts toward your ending.</p><div class="gd-res-grid">
 ${card('food','Rice','Harvest: '+e.farmRicePer100EffectiveLabor+' Rice per 100 farm workers each chapter. Buying stores, audits, the convoy.','Feeding households and soldiers every chapter. Supplying the march.',`Rations: each unit needs 1 Rice per ${b.rationCapacity} soldiers each round, up to ${b.provisionMax} rounds. Without rations a unit fights at ${b.unsuppliedFactor/10}% strength and loses ${b.unsuppliedMoraleLoss} morale a round.`)}
 ${card('currency','Treasury','Taxes from households each chapter. The tax register.','Soldiers’ wages, letters and gifts, buying stores.',`Equipment: ${b.equipmentCost} Treasury per point, up to 2 per unit. Each point gives +5% attack and defense.`)}
 ${card('materials','Materials','Workshops: '+e.workshopMaterialsPer100EffectiveLabor+' Materials per 100 workshop workers each chapter.','Roads, walls and fieldworks.',`Ammunition: ${b.ammoCost} Materials per Volley charge, up to ${b.ammoMax}. Gunners cannot fire at range without it.`)}
 ${card('authority','Authority','Successful orders, the convoy, some policies.','Diplomacy and some orders.',`Rally: 10 Authority restores 15 morale to a shaken unit, up to ${b.rallyUses} times. High Authority also raises starting morale.`)}
 </div>`;
}

function allies(){
 const k=rules.kobayakawa,h=rules.hidetada,w=rules.edoWatch;
 const bands=k.bands.map(b=>`<tr class="gd-${b.side}"><td>${b.min}–${b.max}</td><td>${b.side==='east'?'Joins you':b.side==='west'?'Attacks you':'Stays on his hill'}</td><td>${b.side==='inactive'?'—':'Round '+b.entryRound}</td><td>${b.side==='inactive'?'—':b.troopsPerThousand>=1000?'Whole army':Math.round(b.troopsPerThousand/10)+'% of his army'}</td></tr>`).join('');
 return `<p class="gd-lead">Battles were won before they were fought. These lords and places change the army you face.</p>
 <div class="gd-two"><div class="gd-box"><h4>${icon('koba')}Kobayakawa Hideaki</h4><p>His army waits on Matsuo hill. His support (0–100) decides what he does in round ${rules.battle.auxiliaryRound}:</p><table class="gd-table"><tr><th>Support</th><th>He</th><th>When</th><th>With</th></tr>${bands}</table><p>From Chapter ${k.ishidaLettersFromChapter}, Ishida’s letters lower his support by ${-k.ishidaLetterPerChapter} every chapter. Raise it with Court Letters, Secure Eastern Allies, the Kobayakawa Overture and Write to Kobayakawa. His meter is in the realm panel.</p></div>
 <div class="gd-box"><h4>${icon('march')}Gifu</h4><p>Take Gifu in Chapter 3 and you may deploy in columns 1 and 2, and its ${num(rules.gifu.garrisonTroops)}-soldier garrison stays out of the battle. Leave it and you deploy only in column 1, and the garrison joins Ishida.</p>
 <h4>${icon('home')}Edo and Uesugi</h4><p>Uesugi stays armed in Aizu. If Edo’s defense is below ${w.threshold} when you march, ${w.troopsPerPoint} soldiers per missing point stay home to watch him (at most ${num(w.maxTroops)}). Reinforce Edo prevents it.</p>
 <h4>${icon('field')}Hidetada</h4><p>Ieyasu’s son can bring ${num(h.troops)} soldiers by the Nakasendō, arriving in round ${h.entryRound} with ${h.arrivalPerThousand/10}% of them, or ${h.arrivalWithRoadPerThousand/10}% if your road is repaired.</p>
 <h4>${icon('seal')}The Western council</h4><p>After each chapter Ishida’s council takes two different actions: buying grain, fortifying Gifu or Ōgaki, raising troops, raiding your stores, pressuring your route. The dispatch tells you what they did.</p></div></div>`;
}

function battle(){
 const a=battleData.archetypes as Record<string,{attackPerThousand:number;defensePerThousand:number}>,b=rules.battle;
 const units=([['cavalry','Cavalry','Fast and hard-hitting; Charge'],['spears','Spears','Strong in defense; Brace stops Charges'],['arquebus','Gunners','Volley at 2 squares with ammunition']] as const).map(([id,n,note],i)=>`<div class="gd-unit">${unitTile('east',i)}<b>${n}</b><small>Attack ${pct(a[id].attackPerThousand)} · Defense ${pct(a[id].defensePerThousand)}</small><small>${note}</small></div>`).join('');
 const cmd=(k:string,n:string,d:string)=>`<li>${svg(icons[k]??'')}<span><b>${n}</b> ${d}</span></li>`;
 return `<p class="gd-lead">Turn by turn, not real time. The game waits for you on your turn and plays the enemy’s turn by itself.</p>
 <div class="gd-turn"><div class="gd-chip gd-blue">YOUR UNIT<br><small>${battleData.actionPointsPerActivation} actions</small></div><div class="gd-arrow">→</div><div class="gd-chip gd-red">ENEMY UNIT<br><small>plays by itself</small></div><div class="gd-arrow">→</div><div class="gd-chip gd-blue">YOUR NEXT UNIT</div><div class="gd-arrow">→</div><div class="gd-chip">ROUND ENDS<br><small>rations, camp check</small></div></div>
 <div class="gd-two"><div class="gd-box"><h4>On your turn</h4><ul class="gd-cmds">${cmd('move','Tap green','to move there.')}${cmd('attack','Tap red','to attack. The red number is how many soldiers they should lose.')}${cmd('defend','Tap your gold unit','for more orders: Defend, Brace, Rally, Volley, Charge, End.')}</ul><div class="gd-units">${units}</div></div>
 <div class="gd-box"><h4>Morale and routs</h4><p>Losses lower morale. A unit with no morale left breaks and flees; Rally (10 Authority, +15 morale) can bring it back. Rations, equipment, readiness and Kobayakawa all change morale.</p>
 <h4>Two ways to win</h4><p>${icon('march')}<b>Take the camp:</b> hold the Western camp (column 10, row 4) with no enemy beside you at the end of ${b.captureChecks} rounds in a row.</p><p>${icon('field')}<b>Break the army:</b> make all three main Western units flee.</p><p class="gd-note">After round ${b.reviewRound} a council lets you keep fighting, settle by score, or withdraw.</p></div></div>`;
}

function terrain(){
 const d=battleData.terrainDefinitions as Record<string,{moveCost?:number;defensePerThousand?:number;passable?:boolean;blocksVolleyLine?:boolean;cavalryAttackPerThousand?:number;rangedAttackPerThousand?:number;initiativeBonus?:number;singleOccupant?:boolean}>;
 const order:[string,string][]=[['plain','Open ground'],['road','Road'],['forest','Forest'],['hill','Hill'],['stream','Stream'],['bridge','Bridge'],['west_camp','Camp'],['fieldworks','Fieldworks'],['mud','Mud']];
 const rows=order.map(([id,name])=>{const t=d[id];if(!t)return '';const notes:string[]=[];
  if(t.passable===false)notes.push('Cannot be crossed except at a bridge');
  else{notes.push(`Move cost ${t.moveCost}`);if(t.defensePerThousand&&t.defensePerThousand!==1000)notes.push(`Defense ${pct(t.defensePerThousand)}`);}
  if(t.blocksVolleyLine)notes.push('Blocks Volley lines');if(t.cavalryAttackPerThousand)notes.push(`Cavalry attack ${pct(t.cavalryAttackPerThousand)}`);if(t.rangedAttackPerThousand)notes.push(`Volleys from here ${pct(t.rangedAttackPerThousand)}`);if(t.initiativeBonus)notes.push('Helps you act earlier');if(t.singleOccupant)notes.push('One unit at a time');
  if(id==='west_camp')notes.push('Hold the enemy camp to win');if(id==='fieldworks')notes.push('Your side only; built by the Fieldworks order');if(id==='mud')notes.push('Rain turns some ground to mud');
  return `<div class="gd-ter">${tile(id)}<div><b>${name}</b><small>${notes.map(esc).join(' · ')}</small></div></div>`;}).join('');
 return `<p class="gd-lead">Ground matters. Hills and forests protect; the stream can be crossed only at its bridges.</p><div class="gd-ter-grid">${rows}</div>`;
}

function march(){
 const b=rules.battle,items:[string,string,string][]=[
  ['food','Feed the army',`Pack enough rations for every round you expect to fight; ${b.provisionMax} is the most. Hungry units fight at ${b.unsuppliedFactor/10}% strength and lose morale each round.`],
  ['materials','Buy ammunition','Without Volley charges your gunners can only fight hand to hand.'],
  ['koba','Win Kobayakawa',`At ${rules.kobayakawa.bands[1].min} support or more he joins you; below ${rules.kobayakawa.bands[2].min} he attacks you. This can decide the battle.`],
  ['currency','Equip your units',`Each equipment point (${b.equipmentCost} Treasury) adds 5% attack and defense.`],
  ['march','Take Gifu','More room to deploy, and its garrison stays out of the fight.'],
  ['home','Guard Edo','A strong Edo lets every soldier march with you.'],
  ['authority','Keep 10 Authority','Enough for at least one Rally when a unit wavers.'],
 ];
 return `<p class="gd-lead">Most important first.</p><ol class="gd-check">${items.map(([k,t,d],i)=>`<li><span class="gd-rank">${i+1}</span>${icon(k,'ico gd-big')}<div><b>${t}</b><small>${esc(d)}</small></div></li>`).join('')}</ol>`;
}

export function guideMarkup(tab:GuideTab){
 const body={road,resources,allies,battle,terrain,march}[tab]();
 return `<div class="gd" style="--sprite:url(${assetURL('./art/TILE_TERRAIN.png')})"><div class="tabs gd-tabs" role="tablist">${guideTabs.map(([id,n])=>`<button type="button" role="tab" class="small" data-action="guide:${id}" aria-selected="${id===tab}">${esc(n)}</button>`).join('')}</div><div class="gd-body">${body}</div><div class="row gd-foot"><button type="button" data-action="close" class="primary">Close guide</button></div></div>`;
}

/** v0.5 R6: the convoy board as a picture: road, the single bridge, wagon start, the finish flag, and both sides' units. */
export function convoyDiagram(){const c=rules.convoy,cells:string[]=[];
 for(let y=0;y<c.rows;y++)for(let x=0;x<c.columns;x++){const t=x===c.streamColumn?(y===c.roadRow?'bridge':'stream'):y===c.roadRow?'road':'plain';
  const unit=(x===1&&y===1)?unitTile('east',1):(x===1&&y===3)?unitTile('east',2):(x===5&&(y===1||y===3))?unitTile('west',1):'';
  const wagon=x===c.wagonStart.x&&y===c.wagonStart.y?'<span class="cd-mark cd-wagon">▣</span>':'',flag=x===c.wagonExit.x&&y===c.wagonExit.y?'<span class="cd-mark cd-flag">⚑</span>':'';
  cells.push(`<span class="cd-cell" style="background-position:${pos(frame[t]??0)}">${unit}${wagon}${flag}</span>`);}
 return `<div class="cd" style="--sprite:url(${assetURL('./art/TILE_TERRAIN.png')});--cols:${c.columns}"><div class="cd-grid">${cells.join('')}</div><div class="cd-key"><span><i class="cd-blue"></i>Your escort</span><span><i class="cd-red"></i>Raiders</span><span>▣ Wagon</span><span>⚑ Finish</span><span>The stream can only be crossed at the bridge.</span></div></div>`;}
