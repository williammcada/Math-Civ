export const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const num=(v:number)=>v.toLocaleString('en-US');
export const nice=(s:string)=>s.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_.]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export const btn=(label:string,id:string,disabled=false,cls='')=>`<button type="button" data-action="${esc(id)}" ${disabled?'disabled':''} class="${esc(cls)}">${esc(label)}</button>`;
export const meter=(v:number,max=100)=>`<div class="meter" aria-hidden="true"><i style="width:${Math.max(0,Math.min(100,v/max*100))}%"></i></div>`;
export const labelResource=(r:string)=>({food:'Rice',currency:'Treasury',materials:'Materials',authority:'Authority'}[r]??nice(r));
export function costLine(cost:object){const entries=Object.entries(cost).filter(([,v])=>typeof v==='number'&&v!==0);return entries.length?entries.map(([k,v])=>`${num(v)} ${labelResource(k)}`).join(' · '):'No resource cost';}
