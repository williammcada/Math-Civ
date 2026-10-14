// v0.5 (§2.2): touch battle screen. Board first, a turn banner, tap the unit then tap the square,
// a ring of orders around the active unit, bars instead of sentences. Approved mockup:
// "Sekigahara Battle Screen Mockup", 14 Oct 2026.
import type {App} from './app';
import type {State,Formation,Point} from '../core/types';
import {activeUnit,alive,occupant,reachable,canAttack,combatRange,deploymentTiles,supplied,suppressed,pontoonTiles,weather,terrain} from '../core/battle';
import {text} from '../content/registry';
import {assetURL} from './assets';
import {esc,num,nice} from './helpers';
import {commandBlocked,portraitFor} from './battleView';

const frame:Record<string,number>={plain:0,mud:0,forest:1,hill:2,road:3,stream:4,bridge:5,east_camp:6,west_camp:6,fieldworks:7};
const pos=(f:number)=>`${(f%4)*100/3}% ${Math.floor(f/4)*100/3}%`;
const archIndex=(f:Formation)=>f.archetype==='cavalry'?0:f.archetype==='spears'?1:2;
export const unitSprite=(f:Formation)=>pos((f.side==='east'?8:12)+archIndex(f));
const name=(id:string)=>text('formation.'+id);

/** The order a tap on an enemy uses when no order was chosen: gunners fire if they can, everyone else strikes. */
export function defaultAttack(s:State,u:Formation,t:Formation):string|null{
 if(u.archetype==='arquebus'&&canAttack(s,u,t,'volley'))return 'volley';
 return canAttack(s,u,t,'attack')?'attack':null;
}
export function attackKind(app:App,u:Formation,t:Formation):string|null{
 const s=app.state!,m=app.battleMode;
 if(['attack','charge','volley','suppress'].includes(m))return canAttack(s,u,t,m)?m:null;
 return m==='inspect'?defaultAttack(s,u,t):null;
}
export const icons:Record<string,string>={move:'M5 12h14M13 6l6 6-6 6',attack:'M4 20l9-9M14 4l6 6-3 3-6-6zM4 16l4 4',volley:'M3 12h4M10 12h4M17 12h4M19 9l2 3-2 3',suppress:'M4 12h12M14 8l4 4-4 4M20 5v14',charge:'M4 18l6-6-6-6M12 18l6-6-6-6',defend:'M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',brace:'M12 3v18M7 8l5-5 5 5',rally:'M6 21V4M6 4h11l-3 4 3 4H6',resupply:'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8',pontoon:'M3 14h18M6 14v-4M12 14v-4M18 14v-4M3 10h18',forced_step:'M5 18l5-6-5-6M13 18l5-6-5-6M3 21h18',end:'M5 12l5 5 9-10'};
const ringLabels:Record<string,string>={move:'Move',attack:'Strike',volley:'Volley',suppress:'Suppress',charge:'Charge',defend:'Defend',brace:'Brace',rally:'Rally',resupply:'Supply',pontoon:'Bridge',forced_step:'Push',end:'End'};
const always=['move','attack','defend','end'];

export function boardMarkup(app:App){
 const s=app.state!,b=s.battle!,u=activeUnit(s),deployment=s.phase==='battle_deployment',cols=b.terrain[0].length,rows=b.terrain.length;
 const myTurn=!!u&&u.side==='east'&&!deployment&&!b.councilPending&&!b.dispatchPending&&s.phase==='battle_round';
 const mode=app.battleMode,ringOpen=myTurn&&app.ringOpen;
 const moves=myTurn&&!ringOpen&&(mode==='inspect'||mode==='move')&&u!.ap>0?reachable(s,u!):myTurn&&mode==='pontoon'?pontoonTiles(s,u!):[];
 const zone=deployment?deploymentTiles(s):[];
 const targets=new Map<string,{kind:string;loss:string}>();
 if(myTurn&&!ringOpen&&u!.ap>0&&!u!.attacked)for(const t of b.formations.filter(f=>alive(f)&&f.side==='west')){const k=attackKind(app,u!,t);if(k){const r=combatRange(s,u!,t,k);targets.set(t.id,{kind:k,loss:'−'+num(Math.round((r.defender[0]+r.defender[1])/2/10)*10)});}}
 const rallyTargets=myTurn&&mode==='rally'?b.formations.filter(f=>f.side==='east'&&alive(f)):[];
 const intents=myTurn||deployment?Object.values(b.intents).map(i=>i.action.kind==='move'?(i.action as {point:Point}).point:null).filter((p):p is Point=>!!p):[];
 const sprite=assetURL('./art/TILE_TERRAIN.png');
 const tiles=b.terrain.flatMap((row,y)=>row.map((t,x)=>{const p={x,y},f=occupant(s,p),wagon=b.wagon&&!b.wagon.delivered&&b.wagon.x===x&&b.wagon.y===y,start=zone.some(z=>z.x===x&&z.y===y),move=moves.some(z=>z.x===x&&z.y===y),tg=f?targets.get(f.id):undefined,rally=f&&rallyTargets.some(r=>r.id===f.id),intent=!f&&intents.some(z=>z.x===x&&z.y===y),sel=x===app.cursor.x&&y===app.cursor.y;
  const cls=['bt',start?'bt-start':'',move?'bt-move':'',tg?'bt-target':'',rally?'bt-rally':'',intent?'bt-intent':'',t==='mud'?'bt-mud':'',sel?'selected':''].filter(Boolean).join(' ');
  const unit=f?`<span class="bu ${f.id===u?.id&&!deployment?'bu-active':'bu-'+f.side}${f.routed?' bu-routed':''}${deployment&&f.id===app.selectedUnit?' bu-active':''}" data-unit="${f.id}" style="background-position:${unitSprite(f)}"><span class="bu-bar"><span style="width:${Math.max(4,Math.round(100*f.troops/Math.max(1,f.startTroops)))}%"></span></span>${f.routed?'<span class="bu-flag">!</span>':''}</span>`:'';
  const camp=t.endsWith('_camp')?`<span class="bt-camp bt-camp-${t.startsWith('east')?'east':'west'}" aria-hidden="true"></span>`:'';
  const wag=wagon?`<span class="bt-wagon" aria-hidden="true"><svg viewBox="0 0 24 24" width="80%" height="80%"><rect x="3" y="7" width="18" height="9" rx="1" fill="#b8955a" stroke="#2a1d10" stroke-width="1.5"/><circle cx="7" cy="18" r="2.5" fill="#2a1d10"/><circle cx="17" cy="18" r="2.5" fill="#2a1d10"/></svg><b>${b.wagon!.integrity}</b></span>`:'';
  return `<button type="button" role="gridcell" class="${cls}" data-action="tile:${x}:${y}" data-x="${x}" data-y="${y}" tabindex="${sel?0:-1}" style="background-position:${pos(frame[t]??0)}" aria-label="Column ${x+1}, row ${y+1}, ${nice(t)}${f?', '+esc(name(f.id))+', '+f.troops+' troops, morale '+f.morale:''}${wagon?', wagon':''}${start?', starting square':''}${move?', you can move here':''}${tg?', target, about '+tg.loss+' troops':''}">${camp}${wag}${unit}${tg?`<span class="bt-badge">${tg.loss}</span>`:''}</button>`;}));
 return `<div class="bv5-board" style="--cols:${cols};--rows:${rows};--sprite:url(${sprite})"><div class="bv5-grid" role="grid" aria-label="${b.scenarioId==='convoy'?'Convoy escort':'Sekigahara'} battlefield">${tiles.join('')}</div>${ringOpen?ringMarkup(app):''}</div>`;
}

function ringMarkup(app:App){
 const s=app.state!,b=s.battle!,u=activeUnit(s)!,cols=b.terrain[0].length,rows=b.terrain.length;
 const kinds=Object.keys(icons).filter(k=>always.includes(k)||!commandBlocked(s,k));
 const cx=Math.min(Math.max(u.x+.5,1.9),cols-1.9),cy=Math.min(Math.max(u.y+.5,1.9),rows-1.9);
 return `<button type="button" class="bv5-ring-close" data-action="ring-close" aria-label="Close orders"></button><div class="bv5-ring" style="--cx:${cx};--cy:${cy}">${kinds.map((k,i)=>{const blocked=commandBlocked(s,k),a=-90+i*360/kinds.length,on=app.battleMode===k;
  return `<button type="button" class="bv5-ring-btn${on?' on':''}${blocked?' blocked':''}" style="--a:${a}deg" data-action="ring:${k}" aria-label="${esc(ringLabels[k])}${blocked?': '+esc(blocked):''}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[k]}"/></svg><span>${ringLabels[k]}</span></button>`;}).join('')}</div>`;
}

export function bannerMarkup(app:App){
 const s=app.state!,b=s.battle!,u=activeUnit(s),deployment=s.phase==='battle_deployment';
 if(deployment)return `<div class="bv5-banner bv5-gold"><strong>DEPLOY YOUR ARMY</strong><span>Tap a unit, then a green square.</span></div>`;
 if(b.councilPending)return `<div class="bv5-banner bv5-gold"><strong>ROUND 12 COUNCIL</strong><span>Choose below.</span></div>`;
 if(b.dispatchPending)return `<div class="bv5-banner bv5-gold"><strong>KOBAYAKAWA DECIDES</strong><span>Read the dispatch below.</span></div>`;
 if(u?.side==='east')return `<div class="bv5-banner bv5-east"><strong>YOUR TURN</strong><span>${esc(name(u.id))}</span><span class="bv5-pips" aria-label="${u.ap} of 2 actions left">${[0,1].map(i=>`<i class="${i<u.ap?'on':''}"></i>`).join('')}</span></div>`;
 return `<div class="bv5-banner bv5-west"><strong>ENEMY TURN</strong><span>${app.enemyPaused?'Paused':esc(u?name(u.id):'The Western army')+' is moving'}</span>${s.flags.battle_lab&&!app.labOptions.automaticEnemy?'':`<button type="button" class="bv5-small" data-action="enemy-pause">${app.enemyPaused?'Resume':'Pause'}</button>`}</div>`;
}

export function statusMarkup(app:App){
 const s=app.state!,b=s.battle!,convoy=b.scenarioId==='convoy';
 const chips=[`ROUND ${b.round}`,nice(weather(s).id),`RATIONS ${b.supply.east}${b.currentSupply.east?'':' · UNFED'}`,`AMMO ${b.ammo.east}`,convoy?`WAGON ${b.wagon!.integrity}/3`:`CAMP CHECKS: YOU ${b.campChecks.east}/2 · THEM ${b.campChecks.west}/2`];
 return `<div class="bv5-status">${chips.map(c=>`<span>${esc(c)}</span>`).join('')}</div>`;
}

export function cardMarkup(app:App){
 const s=app.state!,b=s.battle!,u=activeUnit(s),deployment=s.phase==='battle_deployment';
 const f=(deployment||!u?b.formations.find(x=>x.id===app.selectedUnit):b.formations.find(x=>x.id===app.selectedUnit&&app.inspecting))??u??b.formations[0];
 const color=f.side==='east'?'#5d8fc4':'#c2513a',m=f.morale,mc=m>=60?'#62b36f':m>=35?'#e0b048':'#d4553a';
 const chips=[f.pendingReserve?'Reserve':'',f.routed?'Retreating':'',f.auxiliary?`Own rations ${f.auxiliaryRounds}`:supplied(s,f)?'Fed':'Unfed',suppressed(f)?'Suppressed':'',f.engineer?'Engineer':'',f.equipmentPoints?'★'.repeat(f.equipmentPoints)+' equipped':''].filter(Boolean);
 return `<div class="bv5-card"><img src="./art/PORTRAIT_${portraitFor(f.id)}.webp" alt="" style="border-color:${color}"><div class="bv5-card-body"><div class="bv5-card-head"><strong>${esc(name(f.id))}</strong><span>${nice(f.archetype==='arquebus'?'gunners':f.archetype)}</span></div>
  <div class="bv5-meter"><span>TROOPS</span><i><b style="width:${Math.round(100*f.troops/Math.max(1,f.startTroops))}%;background:${color}"></b></i><em>${num(f.troops)}</em></div>
  <div class="bv5-meter"><span>MORALE</span><i><b style="width:${Math.max(0,Math.min(100,m))}%;background:${mc}"></b></i><em>${m}</em></div>
  <div class="bv5-chips">${chips.map(c=>`<span>${esc(c)}</span>`).join('')}${f.side==='east'&&f.archetype==='arquebus'?`<span>${'●'.repeat(Math.min(12,b.ammo.east))||'no'} ammo</span>`:''}</div></div></div>`;
}

export function hintMarkup(app:App){
 const s=app.state!,b=s.battle!,u=activeUnit(s);
 if(s.phase==='battle_deployment')return 'Tap one of your units, then a green square. Tap Plan to choose a tactic.';
 if(u?.side!=='east'||b.councilPending||b.dispatchPending)return '';
 const m=app.battleMode;
 return m==='move'?'Tap a green square.':m==='rally'?'Tap one of your units to restore its morale.':m==='pontoon'?'Tap the water square to bridge.':['attack','volley','charge','suppress'].includes(m)?'Tap a red enemy.':u.attacked?'Already attacked: move, defend, or end the turn.':'Green: move · Red: attack · Tap your gold unit for more orders.';
}

/** Plays the last action on the board: units slide from their old square, attackers lunge, losses float up (about 1 s). */
export function animateBattle(root:HTMLElement,events:State['eventLog'],reduced:boolean,fast:boolean){
 if(reduced)return;const grid=root.querySelector<HTMLElement>('.bv5-grid');if(!grid)return;
 const tile=grid.querySelector<HTMLElement>('.bt')?.offsetWidth??32,ms=fast?150:450;
 const el=(id:unknown)=>grid.querySelector<HTMLElement>(`[data-unit="${String(id)}"]`);
 for(const e of events){
  if(e.type==='FORMATION_MOVED'){const u=el(e.key),d=e.detail!;if(!u)continue;const dx=(Number(d.fromX)-Number(d.x))*tile,dy=(Number(d.fromY)-Number(d.y))*tile;if(!dx&&!dy)continue;
   u.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:ms,easing:'ease-out'});}
  else if(e.type==='COMBAT_RESOLVED'){const d=e.detail!,att=el(d.attackerId),def=el(d.defenderId);
   if(att&&def){const ra=att.getBoundingClientRect(),rd=def.getBoundingClientRect(),lx=(rd.left-ra.left)*.35,ly=(rd.top-ra.top)*.35;
    if(!['volley','suppress'].includes(e.key))att.animate([{transform:'translate(0,0)'},{transform:`translate(${lx}px,${ly}px)`},{transform:'translate(0,0)'}],{duration:ms,easing:'ease-in-out'});}
   if(def){def.animate([{transform:'translate(0,0)'},{transform:'translate(-3px,0)'},{transform:'translate(3px,0)'},{transform:'translate(0,0)'}],{duration:ms*.6,delay:ms*.45});
    const n=document.createElement('span');n.className='bt-float';n.textContent='−'+num(Number(d.defenderLoss));def.parentElement?.append(n);
    n.animate([{opacity:0,transform:'translateY(0)'},{opacity:1,transform:'translateY(-30%)',offset:.25},{opacity:0,transform:'translateY(-120%)'}],{duration:fast?300:1100,delay:ms*.45,fill:'forwards'});}}
 }
}
