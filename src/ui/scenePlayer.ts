// v0.4 (§3.1): one shared, data-driven scene player for chapter, battle and ending scenes.
// Story captions only; the player's next task is shown in a separate "Your task" block (U-11).
import scenesData from '../content/scenes.v1.json';
import type {State} from '../core/types';
import {assetURL} from './assets';
import {esc} from './helpers';
import {mapSvg,stateTokens,zoomTo,march,placeStatus,placeNames,type MapToken} from './campaignMap';

export interface MapStep{wait?:number;highlight?:string[];road?:string;march?:string;via?:string[];ms?:number;zoom?:'all'|'mino';flip?:string;show?:MapToken;when?:string}
export interface Beat{art?:string;pan?:string;caption:string;speaker?:{name:string;portrait:string};when?:string;tint?:string;map?:{view?:'all'|'mino'|'minoWide';tokens:MapToken[]|'state';steps:MapStep[]};cue?:string}
export interface Scene{title:string;task:string;beats:Beat[]}
export const scenes=(scenesData as unknown as {scenes:Record<string,Scene>}).scenes;

/** Conditions used by branching beats. */
export function condition(s:State,when?:string):boolean{if(!when)return true;const neg=when.startsWith('!'),key=neg?when.slice(1):when;
 const v=key==='gifu'?!!s.flags.gifu_controlled:key==='hidetada'?!!s.flags.hidetada_delay_risk:key.startsWith('koba_')?kobaSide(s)===key.slice(5):!!s.flags[key];return neg?!v:v;}
export const kobaSide=(s:State)=>s.battle?.auxSide??(s.diplomacy.kobayakawaCommitment>=60?'east':s.diplomacy.kobayakawaCommitment<45?'west':'inactive');
export const artURL=(id:string)=>assetURL(/^(EVENT_|ENDING_|BG_|PORTRAIT_)/.test(id)?`./art/${id}.webp`:`./art/scenes/${id}.webp`);

export interface PlayOptions{reduced:boolean;onCue?:(id:string)=>void;onClose?:()=>void}
export class ScenePlayer{
 private el:HTMLElement;private i=0;private beats:Beat[];private run=0;private keyHandler:(e:KeyboardEvent)=>void;private previousFocus:Element|null;
 constructor(private host:HTMLElement,private s:State,private scene:Scene,private o:PlayOptions){
  this.beats=scene.beats.filter(b=>condition(s,b.when));this.previousFocus=document.activeElement;
  this.el=document.createElement('section');this.el.className='scene-player'+(o.reduced?' reduced':'');this.el.setAttribute('role','dialog');this.el.setAttribute('aria-modal','true');this.el.setAttribute('aria-label',scene.title);
  this.el.innerHTML=`<div class="scene-stage"><div class="scene-frames"></div><div class="scene-card" hidden></div><div class="scene-title">${esc(scene.title)}</div></div><div class="scene-strip"><img class="scene-who" alt="" hidden><div class="scene-text"><div class="scene-label">Story</div><p class="scene-caption" aria-live="polite"></p></div></div><div class="scene-task" hidden><div class="scene-label">Your task</div><p>${esc(scene.task)}</p></div><div class="scene-controls"><button type="button" data-scene="back">Back</button><button type="button" class="primary" data-scene="next">Next</button><button type="button" data-scene="skip">Skip scene</button><span class="scene-dots" aria-hidden="true">${this.beats.map(()=>'<i></i>').join('')}</span></div>`;
  this.el.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-scene]');if(b){const a=b.dataset.scene;if(a==='next')this.next();else if(a==='back')this.go(this.i-1);else if(a==='skip')this.close();return;}
   const place=(e.target as Element).closest?.('[data-place]') as HTMLElement|null;if(place)this.card(place.dataset.place!);else if((e.target as HTMLElement).closest('.scene-card'))this.el.querySelector<HTMLElement>('.scene-card')!.hidden=true;});
  this.keyHandler=e=>{if(!this.el.isConnected)return;if(e.key==='Escape'){e.preventDefault();this.close();}else if(e.key==='ArrowRight'){e.preventDefault();this.next();}else if(e.key==='ArrowLeft'){e.preventDefault();this.go(this.i-1);}else if((e.key===' '||e.key==='Enter')&&!(e.target as HTMLElement).closest?.('button,[data-place]')){e.preventDefault();this.next();}};
  document.addEventListener('keydown',this.keyHandler);
  host.append(this.el);this.go(0);this.el.querySelector<HTMLElement>('[data-scene="next"]')?.focus();
 }
 private next(){if(this.i<this.beats.length-1)this.go(this.i+1);else this.close();}
 get element(){return this.el;}
 close(){this.run++;document.removeEventListener('keydown',this.keyHandler);this.el.remove();(this.previousFocus as HTMLElement|null)?.focus?.();this.o.onClose?.();}
 private card(id:string){const c=this.el.querySelector<HTMLElement>('.scene-card')!;c.innerHTML=`<h3>${esc(placeNames[id]??id)}</h3><p>${esc(placeStatus(this.s,id))}</p><p class="muted">Tap to close</p>`;c.hidden=false;}
 private go(n:number){
  if(n<0||n>=this.beats.length)return;this.i=n;const run=++this.run,b=this.beats[n],frames=this.el.querySelector('.scene-frames')!,last=n===this.beats.length-1;
  this.el.querySelector<HTMLElement>('.scene-card')!.hidden=true;
  const frame=document.createElement('div');frame.className='scene-frame';
  if(b.map){const tokens=b.map.tokens==='state'?stateTokens(this.s):b.map.tokens;frame.classList.add('map-frame');frame.innerHTML=mapSvg({tokens,view:b.map.view??'all',interactive:true,caption:b.caption});}
  else{const tint=b.tint==='koba'?' tint-'+kobaSide(this.s):'';frame.innerHTML=`<img class="scene-art pan-${b.pan??'in'}${tint}" src="${artURL(b.art!)}" alt="">`;}
  frames.append(frame);requestAnimationFrame(()=>frame.classList.add('on'));
  const old=[...frames.children].filter(f=>f!==frame);setTimeout(()=>old.forEach(f=>f.remove()),this.o.reduced?0:900);
  const who=this.el.querySelector<HTMLImageElement>('.scene-who')!,strip=this.el.querySelector('.scene-strip')!;
  if(b.speaker){who.src=assetURL(`./art/${b.speaker.portrait}.webp`);who.alt=b.speaker.name;who.hidden=false;}else who.hidden=true;strip.classList.toggle('no-portrait',!b.speaker);
  const quote=b.caption.startsWith('“');this.el.querySelector('.scene-label')!.textContent=b.speaker&&!quote?'Story · '+b.speaker.name:'Story';this.el.querySelector('.scene-caption')!.innerHTML=(b.speaker&&quote?`<span class="scene-speaker">${esc(b.speaker.name)}:</span> `:'')+esc(b.caption);
  this.el.querySelectorAll('.scene-dots i').forEach((d,k)=>d.classList.toggle('on',k<=n));
  this.el.querySelector<HTMLButtonElement>('[data-scene="back"]')!.disabled=n===0;
  this.el.querySelector('[data-scene="next"]')!.textContent=last?'Done':'Next';
  this.el.querySelector<HTMLElement>('.scene-task')!.hidden=!last;
  if(b.cue)this.o.onCue?.(b.cue);
  if(b.map)void this.playMap(frame.querySelector('svg')!,b.map.steps,run);
 }
 private async playMap(svg:SVGSVGElement,steps:MapStep[],run:number){
  const reduced=this.o.reduced,wait=(ms:number)=>new Promise(r=>setTimeout(r,reduced?0:ms));
  for(const st of steps){if(run!==this.run||!svg.isConnected)return;if(!condition(this.s,st.when))continue;
   if(st.wait)await wait(st.wait);
   if(st.highlight)for(const id of st.highlight)svg.querySelector(`[data-place="${id}"]`)?.classList.add('highlight','pulse-on');
   if(st.flip){svg.querySelector(`[data-place="${st.flip}"]`)?.classList.add('flipped');await wait(600);}
   if(st.road){svg.querySelector(`.road-${st.road}`)?.classList.add('road-drawn');await wait(1400);}
   if(st.zoom)await zoomTo(svg,st.zoom==='mino'?'minoWide':st.zoom,1800,reduced);
   if(st.march&&st.via){this.o.onCue?.('march');await march(svg,st.march,st.via,st.ms??3000,reduced);}
  }
 }
}

/** Builds the ending montage from the campaign record (§3.1). */
export function endingScene(s:State,title:string):Scene{
 const b=s.battle!,beats:Beat[]=[],convoy=String(s.flags.convoy_status??'skipped'),side=b.auxSide??'inactive';
 if(convoy!=='skipped')beats.push({art:'EVENT_CONVOY',pan:'left',caption:convoy==='intact'?'On the Tōkaidō, your escort brought the grain wagon through intact.':convoy==='damaged'?'On the Tōkaidō, the grain wagon arrived damaged but delivered.':'On the Tōkaidō, raiders took the grain wagon.'});
 beats.push(side==='east'?{art:'BAT-KOBA2',pan:'left',caption:'At the decisive hour, Kobayakawa came down Matsuo hill on your side.'}:side==='west'?{art:'BAT-KOBA2',pan:'right',caption:'At the decisive hour, Kobayakawa came down Matsuo hill against you.'}:{art:'BAT-KOBA1',pan:'in',caption:'Kobayakawa never left Matsuo hill.'});
 const won=b.result==='victory';
 beats.push(b.outcomeReason==='camp_held'?{art:'BAT-CAMP',pan:'in',caption:won?'Your banner stood over the Western camp.':'A Western banner stood over your camp.'}:won?{art:'BAT-ROUT',pan:'out',caption:'The Western formations broke, and their banners fell in the mud.'}:b.result?.includes('withdrawal')?{art:'BAT-DAWN1',pan:'out',caption:'You drew the army back into the fog before it broke.'}:{art:'BAT-ROUT',pan:'out',caption:'Your formations broke, and the Eastern banners fell in the mud.'});
 beats.push({art:'ENDING_'+(s.ending?.tier??'normal').toUpperCase(),pan:'in',caption:title});
 return {title:'Your campaign',task:'Read your ending, then open the campaign report.',beats};
}
