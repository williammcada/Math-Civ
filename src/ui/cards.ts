// v0.5 less-text treatment for campaign screens (spec §2.2): icons, chips and compact cards
// instead of paragraphs. Battle screen uses the same visual language (battleBoard.ts).
import {esc,num,labelResource} from './helpers';

const paths:Record<string,string>={
 food:'M4 12h16a8 8 0 0 1-16 0zM8 9c0-2 1-3 2-4M12 9c0-2 1-3 2-4',
 currency:'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM10 10h4v4h-4z',
 materials:'M4 9l8-4 8 4-8 4zM4 9v6l8 4 8-4V9M12 13v6',
 authority:'M6 4h12v4l-3 3v9H9v-9L6 8z',
 govern:'M12 4v16M5 8h14M5 8l-2 6h6zM19 8l-2 6h6zM8 20h8',
 develop:'M14 6l4 4-9 9-4 1 1-4zM12 8l4 4',
 diplomacy:'M4 6h16v12H4zM4 6l8 7 8-7',
 march:'M6 20V4M6 4h11l-3 4 3 4H6',
 seal:'M12 3l3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1z',
 home:'M4 11l8-7 8 7M6 10v10h12V10',
 field:'M4 20l6-14 4 8 2-4 4 10z',
 koba:'M5 19c3-6 11-6 14 0M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
 check:'M5 12l5 5 9-10',
 cross:'M6 6l12 12M18 6L6 18',
 clock:'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8v4l3 2',
};
export const icon=(k:string,cls='ico')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[k]??paths.seal}"/></svg>`;
const short:Record<string,string>={food:'Rice',currency:'Treasury',materials:'Materials',authority:'Authority'};
/** A single resource chip, e.g. "−60 Rice". */
export const resChip=(k:string,v:number,sign:''|'+'|'−'='')=>`<span class="chip c-${esc(k)}">${icon(k)}${sign}${num(Math.abs(v))} ${esc(short[k]??labelResource(k))}</span>`;
export function costChips(cost:object,calculatedRice=false){
 if(calculatedRice)return `<span class="chips">${`<span class="chip c-food">${icon('food')}Rice: you calculate</span>`}</span>`;
 const e=Object.entries(cost).filter(([,v])=>typeof v==='number'&&v!==0) as [string,number][];
 return `<span class="chips">${e.length?e.map(([k,v])=>resChip(k,v,'−')).join(''):'<span class="chip c-free">Free</span>'}</span>`;
}
/** Turns a "A · B · C" effect summary into gain/loss chips. */
export function effectChips(summary:string){
 const parts=summary.split(' · ').filter(Boolean);
 return parts.length?`<span class="chips">${parts.map(p=>`<span class="chip ${/(^|\s)[-−]\d|weakens|\brises\b/.test(p)?'c-loss':/Divide|Keep/.test(p)?'':'c-gain'}">${esc(p)}</span>`).join('')}</span>`:'';
}
export const firstSentence=(t:string)=>{const m=t.match(/^.*?[.!?](\s|$)/);return (m?m[0]:t).trim();};
export const familyIcon=(f:string)=>`<span class="fam fam-${esc(f)}" title="${esc(f)}">${icon(f)}</span>`;
/** Small labelled meter: label, value text, bar. */
export const miniMeter=(label:string,value:string,pct:number,tone='')=>`<div class="mm ${tone}"><span>${esc(label)}</span><b>${esc(value)}</b><i><em style="width:${Math.max(0,Math.min(100,pct))}%"></em></i></div>`;
/** A yes/no fact tile used on the pre-battle review. */
export const factTile=(ok:boolean,title:string,detail:string)=>`<div class="fact ${ok?'ok':'no'}">${icon(ok?'check':'cross')}<div><b>${esc(title)}</b><small>${esc(detail)}</small></div></div>`;
/** Kobayakawa in a few words for meters: "Joins you · round 7 · part". */
export function kobaShort(bands:{min:number;max:number;side:string;entryRound:number;troopsPerThousand:number}[],c:number){
 const b=bands.find(b=>c>=b.min&&c<=b.max)??bands.at(-1)!;
 return b.side==='inactive'?'Stays on his hill':(b.side==='east'?'Joins you':'Attacks you')+` · round ${b.entryRound}`+(b.troopsPerThousand<1000?' · part of his army':' · in force');
}
/** "At Sekigahara" and "At home" tag rows for an order. */
export function tagRows(t:{field:string[];home:string[]}){
 const row=(k:string,label:string,list:string[])=>list.length?`<span class="tagrow tag-${k}">${icon(k)}<b>${label}</b>${list.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</span>`:'';
 return row('field','At Sekigahara',t.field)+row('home','At home',t.home);
}
