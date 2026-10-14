// v0.4 (§3.2): geographic campaign map, drawn as SVG over real coastline data.
// Used by the Map tab and by the map beats of the scene player.
import geoData from '../content/geo-map.v1.json';
import {campaign} from '../content/registry';
import type {State} from '../core/types';
import {reportedStrength,intelLevel} from '../core/intel';
import {battle as battleData} from '../content/registry';
import {rules} from '../core/logistics';
import {esc} from './helpers';
import {kobaBandText} from './playerCopy';

type Pt=[number,number];
const geo=geoData as unknown as {W:number;H:number;land:string[];biwa:string;places:Record<string,Pt>;paths:Record<string,Pt[]>;roads:Record<string,string[]>;labels:{text:string;kind:string;at:Pt}[];inset:{x:number;y:number;w:number;h:number}};
export type MapSide='east'|'west'|'ochre'|'neutral';
export interface MapToken{id:string;side:MapSide;label:string;place:string;portrait?:string;strength?:string;status:string;offset?:Pt}
export const sideColor:Record<MapSide,string>={east:'#5d8fc4',west:'#c2513a',ochre:'#d0a23a',neutral:'#a99c80'};
export const placeNames:Record<string,string>={edo:'Edo',oyama:'Oyama',aizu:'Aizu',kiyosu:'Kiyosu',gifu:'Gifu',ogaki:'Ōgaki',sekigahara:'Sekigahara',matsuo:'Matsuo hill',fushimi:'Fushimi',osaka:'Osaka',ueda:'Ueda',momokubari:'Ieyasu’s camp'};
/** Full-map and Mino close-up view boxes (x, y, width, height). */
export const views={minoWide:[262,498,132,70] as const,all:[56,70,860,656] as const,mino:[geo.inset.x-30,geo.inset.y-8,geo.inset.w+50,(geo.inset.w+50)*0.8] as const};
/** Label placement around each place marker, chosen so the Mino cluster does not overprint. */
const labelAt:Record<string,{dx:number;dy:number;anchor:string;mino?:boolean}>={edo:{dx:10,dy:16,anchor:'start'},oyama:{dx:10,dy:4,anchor:'start'},aizu:{dx:-10,dy:4,anchor:'end'},kiyosu:{dx:8,dy:14,anchor:'start'},gifu:{dx:8,dy:-6,anchor:'start'},ogaki:{dx:4,dy:14,anchor:'start'},sekigahara:{dx:-8,dy:-6,anchor:'end'},matsuo:{dx:-4,dy:8,anchor:'end',mino:true},fushimi:{dx:10,dy:4,anchor:'start'},osaka:{dx:-10,dy:4,anchor:'end'},ueda:{dx:8,dy:4,anchor:'start'},momokubari:{dx:-2,dy:14,anchor:'end',mino:true}};

export function point(place:string):Pt{const p=geo.places[place];if(!p)throw Error('Unknown map place '+place);return p;}
/** Road polyline between two adjacent places (either direction). */
export function road(a:string,b:string):Pt[]{const f=geo.paths[a+'-'+b];if(f)return f;const r=geo.paths[b+'-'+a];if(r)return [...r].reverse();return [point(a),point(b)];}
/** Road polyline through a chain of places, e.g. ['oyama','edo','kiyosu']. */
export function route(chain:string[]):Pt[]{const out:Pt[]=[];for(let i=1;i<chain.length;i++){const seg=road(chain[i-1],chain[i]);out.push(...(i===1?seg:seg.slice(1)));}return out.length?out:[point(chain[0])];}
const poly=(pts:Pt[])=>pts.map(p=>p.join(',')).join(' ');
/** Days of march shown on routes (game-scaled approximations of 1600 travel times). */
export const marchDays:Record<string,number>={'edo-oyama':3,'oyama-aizu':5,'edo-kiyosu':10,'kiyosu-gifu':1,'gifu-ogaki':1,'gifu-sekigahara':2,'ogaki-sekigahara':1,'sekigahara-fushimi':3,'fushimi-osaka':1};
export const daysBetween=(a:string,b:string)=>marchDays[a+'-'+b]??marchDays[b+'-'+a]??null;

const leftLabel=new Set(['osaka','fushimi','aizu','sekigahara','matsuo']);
function tokenMarkup(t:MapToken){const [x,y]=point(t.place),[ox,oy]=t.offset??[0,0],c=sideColor[t.side];
 return `<g class="geo-token side-${t.side}" data-token="${esc(t.id)}" transform="translate(${x+ox} ${y+oy})"><g class="tk-scale"><rect x="-1.5" y="-26" width="2.5" height="22" fill="#eadfc4"/><rect x="1" y="-26" width="13" height="9" fill="${c}"/><circle r="6.5" fill="${c}" stroke="#13110e" stroke-width="2"/>${leftLabel.has(t.place)?`<text class="token-label" x="-5" y="-18" text-anchor="end">${esc(t.label)}</text>`:`<text class="token-label" x="16" y="-18">${esc(t.label)}</text>`}</g></g>`;}

export interface MapOptions{tokens:MapToken[];view?:'all'|'mino'|'minoWide';selected?:string;pins?:Record<string,number>;highlight?:string[];plannedRoute?:string[];caption?:string;interactive?:boolean;flipped?:string[]}
/** Pure SVG markup; the scene player and Map tab add behaviour on top. */
export function mapSvg(o:MapOptions):string{
 const v=views[o.view??'all'];
 const roads=Object.entries(geo.roads).map(([name,segs])=>`<g class="geo-road road-${name}">${segs.map(id=>`<polyline points="${poly(geo.paths[id])}"/>`).join('')}</g>`).join('');
 const planned=o.plannedRoute&&o.plannedRoute.length>1?`<g class="geo-planned"><polyline points="${poly(route(o.plannedRoute))}"/>${o.plannedRoute.slice(1).map((b,i)=>{const a=o.plannedRoute![i],d=daysBetween(a,b),pa=point(a),pb=point(b);return d?`<text x="${(pa[0]+pb[0])/2}" y="${(pa[1]+pb[1])/2-6}" class="days">≈ ${d} day${d===1?'':'s'}</text>`:'';}).join('')}</g>`:'';
 const labels=geo.labels.map(l=>`<text class="geo-label ${l.kind}" x="${l.at[0]}" y="${l.at[1]}">${esc(l.text)}</text>`).join('');
 const places=Object.keys(geo.places).filter(id=>id!=='momokubari'||o.tokens.some(t=>t.place===id)).map(id=>{const [x,y]=geo.places[id],L=labelAt[id],hl=o.highlight?.includes(id),sel=o.selected===id,flip=o.flipped?.includes(id),pins=o.pins?.[id]??0;
  return `<g class="geo-place${L.mino?' mino-only':''}${hl?' highlight':''}${sel?' selected':''}${flip?' flipped':''}" data-place="${id}" ${o.interactive?`tabindex="0" role="button" aria-label="${esc(placeNames[id])}"`:''}><g transform="translate(${x} ${y})"><g class="pl-scale"><circle class="pulse" r="9"/><circle class="hit" r="13"/><rect class="mark" x="-4" y="-4" width="8" height="8" transform="rotate(45)"/><text class="place-label" x="${L.dx}" y="${L.dy}" text-anchor="${L.anchor}">${esc(placeNames[id])}</text>${pins?`<g class="pin-badge"><circle cx="9" cy="-9" r="6"/><text x="9" y="-6.5" text-anchor="middle">${pins}</text></g>`:''}</g></g></g>`;}).join('');
 return `<svg class="geo-map view-${(o.view??'all')==='all'?'all':'mino'}" viewBox="${v.join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of central Honshu">${o.caption?`<title>${esc(o.caption)}</title>`:''}<rect x="-500" y="-500" width="2000" height="1800" class="geo-sea"/><g class="geo-land">${geo.land.map(d=>`<path d="${d}"/>`).join('')}</g><path class="geo-lake" d="${geo.biwa}"/>${labels}${roads}<g class="geo-trails"></g>${planned}<g class="geo-places">${places}</g><g class="geo-tokens">${o.tokens.map(tokenMarkup).join('')}</g><rect class="inset-frame" x="${geo.inset.x}" y="${geo.inset.y}" width="${geo.inset.w}" height="${geo.inset.h}"/></svg>`;
}

/** Plain-language status of each place for the current campaign state. */
export function placeStatus(s:State,id:string):string{
 const st=s.map[id];
 switch(id){
  case 'edo':return 'Your capital and supply base. Rice, Treasury and Materials come from here.';
  case 'oyama':return s.chapterIndex>=3?'Where the allied lords agreed to turn west against Ishida.':'A post town on the road north to Aizu.';
  case 'aizu':return `Uesugi Kagekatsu’s domain. His army threatens your rear (pressure ${s.threats.uesugiPressure}/100).`;
  case 'kiyosu':return 'Fukushima Masanori’s castle. Your staging point before entering Mino.';
  case 'gifu':return st==='player_military_control'?'Taken by your vanguard. The road into Mino is open and its garrison cannot join Ishida.':`Held for the West by Oda Hidenobu. Take it to deploy farther forward and to keep its garrison (about ${rules.gifu.garrisonTroops} troops) out of the battle.`;
  case 'ogaki':return `Ishida Mitsunari’s headquarters. The Western army gathers here${s.westernState.ogakiDefense>0?' behind new defenses':''}.`;
  case 'sekigahara':return 'A narrow valley where the Nakasendō and the roads to Ōmi meet. The decisive battle will be fought here.';
  case 'matsuo':return `Kobayakawa Hideaki’s camp on Matsuo hill, above the battlefield. At ${s.diplomacy.kobayakawaCommitment}/100 he ${kobaBandText(s.diplomacy.kobayakawaCommitment)}.`;
  case 'fushimi':return st==='western'?'Fallen to the West after Torii Mototada’s garrison held out to buy you time.':'Your garrison under Torii Mototada holds the castle near Kyoto.';
  case 'osaka':return 'Seat of Hideyoshi’s young heir, Toyotomi Hideyori. Ishida’s coalition acts in his name.';
  case 'momokubari':return 'Momokubari hill, east of the valley, where Ieyasu sets his headquarters before the battle.';
  case 'ueda':return 'Sanada Masayuki’s castle on the Nakasendō. An army that stops to besiege it may arrive late.';
 }
 return '';
}
/** Orders (by id) whose effects concern each place, for map pins and the info card. */
export const orderPlaces:Record<string,string>={c1_labor_ledger:'edo',c1_tax_register:'edo',c1_repair_tokaido:'kiyosu',c1_court_letters:'osaka',c2_march_provisions:'oyama',c2_reinforce_edo:'edo',c2_muster_bands:'edo',c2_secure_allies:'oyama',c3_oyama_march:'oyama',c3_kiyosu_stores:'kiyosu',c3_secure_gifu:'gifu',c3_home_relief:'edo',c4_kobayakawa:'matsuo',c4_forward_granaries:'kiyosu',c4_fieldworks:'sekigahara',c4_weather_scouts:'sekigahara',kobayakawa_letter:'matsuo',audit_stores:'edo'};

const westTroops=(s:State)=>{const momentum=Math.max(0,Math.min(rules.westernMomentum.maxTroops,(s.threats.westernMomentum-rules.westernMomentum.neutral)*rules.westernMomentum.troopsPerPoint));return battleData.formations.filter(f=>f.side==='west').reduce((t,f)=>t+f.baseTroops,0)+rules.westernMomentum.baseTroops+s.westernState.troopGain+momentum;};
/** Tokens for both sides as they stand in the current chapter. */
export function stateTokens(s:State):MapToken[]{
 const east=s.playerArmy.formations.reduce((t,f)=>t+f.troops,0),ch=s.chapterIndex,west=reportedStrength(s,westTroops(s));
 const tokens:MapToken[]=[{id:'ieyasu',side:'east',label:'Ieyasu',place:s.playerArmy.locationId==='sekigahara'?'momokubari':s.playerArmy.locationId,portrait:'PORTRAIT_IEYASU',strength:east.toLocaleString('en-US'),status:'Your field army.'}];
 if(ch<=2)tokens.push({id:'uesugi',side:'west',label:'Uesugi',place:'aizu',portrait:'PORTRAIT_UESUGI',status:'Fortifying Aizu.'});
 else tokens.push({id:'uesugi',side:'west',label:'Uesugi',place:'aizu',portrait:'PORTRAIT_UESUGI',status:'Held in the north by your allies.'});
 tokens.push(ch>=3?{id:'ishida',side:'west',label:'Ishida',place:'ogaki',portrait:'PORTRAIT_ISHIDA',strength:west,status:'The main Western army.'}:{id:'ishida',side:'west',label:'Ishida',place:'osaka',portrait:'PORTRAIT_ISHIDA',status:'Gathering allies in the heir’s name.'});
 if(ch>=3)tokens.push({id:'mori',side:'west',label:'Mōri',place:'osaka',status:'Mōri Terumoto holds Osaka castle as the Western commander-in-chief.'});
 if(ch>=3)tokens.push({id:'ukita',side:'west',label:'Ukita',place:'sekigahara',portrait:'PORTRAIT_UKITA',status:'Western vanguard.',offset:[-1,4]});
 if(ch>=4){const koba=s.diplomacy.kobayakawaCommitment;tokens.push({id:'kobayakawa',side:koba>=60?'east':koba<45?'west':'ochre',label:'Kobayakawa',place:'matsuo',portrait:'PORTRAIT_KOBAYAKAWA',status:kobaBandText(koba)});}
 if(ch>=3&&s.flags.hidetada_delay_risk)tokens.push({id:'hidetada',side:'east',label:'Hidetada',place:'ueda',portrait:'PORTRAIT_HONDA',status:'Marching by the Nakasendō; may arrive late.'});
 if(ch<=2)tokens.push({id:'torii',side:'east',label:'Torii',place:'fushimi',portrait:'PORTRAIT_TORII',status:'Holding Fushimi castle.'});
 return tokens;
}
export const strengthNote=(s:State)=>intelLevel(s)==='precise'?'Western numbers are exact.':intelLevel(s)==='broad'?'Western numbers are scout estimates.':'Your scouts cannot count the Western army.';
export const nodeIds=()=>campaign.map.nodes.map(n=>n.id);

/** Animated view-box zoom between the whole map and the Mino close-up. */
export function zoomTo(svg:SVGSVGElement,view:'all'|'mino'|'minoWide',ms=1800,reduced=false){const to=views[view],from=(svg.getAttribute('viewBox')??'').split(' ').map(Number);svg.classList.toggle('view-mino',view!=='all');svg.classList.toggle('view-all',view==='all');
 if(reduced||from.length!==4){svg.setAttribute('viewBox',to.join(' '));return Promise.resolve();}
 return new Promise<void>(res=>{const t0=performance.now();const step=(now:number)=>{const f=Math.min(1,(now-t0)/ms),e=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;svg.setAttribute('viewBox',from.map((a,i)=>a+(to[i]-a)*e).join(' '));if(f<1&&svg.isConnected)requestAnimationFrame(step);else{svg.setAttribute('viewBox',to.join(' '));res();}};requestAnimationFrame(step);});}

/** Moves a token along a road chain, optionally leaving a dashed trail. */
export function march(svg:SVGSVGElement,tokenId:string,chain:string[],ms=3000,reduced=false,trail=true):Promise<void>{
 const g=svg.querySelector<SVGGElement>(`[data-token="${tokenId}"]`);if(!g)return Promise.resolve();const path=route(chain),side=[...g.classList].find(c=>c.startsWith('side-'))?.slice(5) as MapSide|undefined,NS='http://www.w3.org/2000/svg';
 let line:SVGPolylineElement|null=null;if(trail){line=document.createElementNS(NS,'polyline');line.setAttribute('class','geo-trail');line.setAttribute('stroke',sideColor[side??'neutral']);svg.querySelector('.geo-trails')!.append(line);}
 const seg:number[]=[];let total=0;for(let i=1;i<path.length;i++){const d=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]);seg.push(d);total+=d;}
 const at=(f:number):[number,number,number]=>{let d=f*total,k=0;while(k<seg.length-1&&d>seg[k]){d-=seg[k];k++;}const t=seg[k]?Math.min(1,d/seg[k]):1,a=path[k],b=path[k+1]??a;return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,k];};
 const finish=()=>{const p=path.at(-1)!;g.setAttribute('transform',`translate(${p[0]} ${p[1]})`);line?.setAttribute('points',poly(path));};
 if(reduced||total===0){finish();return Promise.resolve();}
 return new Promise(res=>{const t0=performance.now();const step=(now:number)=>{const f=Math.min(1,(now-t0)/ms),[x,y,k]=at(f);g.setAttribute('transform',`translate(${x} ${y})`);line?.setAttribute('points',poly([...path.slice(0,k+1),[x,y]]));if(f<1&&svg.isConnected)requestAnimationFrame(step);else{finish();res();}};requestAnimationFrame(step);});
}
