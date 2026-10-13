import type {State} from '../core/types';
import {invariants,saveStructure} from '../core/invariants';
import {validateSaveEnvelope} from '../content/loader';
import {sha256} from './sha256';
import {migrateState} from './migration';
export type Slot='autosave'|'manual-1'|'manual-2'|'manual-3';
export interface Envelope {format:'math-civilization-save';schemaVersion:1|2;buildVersion:string;savedAt:string;slotLabel:string;checksum:string;state:State}
export const safeSave=(s:State)=>s.pendingReward===null&&(!s.activeOrder||s.activeOrder.attempts===0&&s.activeOrder.context==='order')&&['council','orders','chapter_report','convoy_briefing','convoy_result','battle_review','battle_provision','battle_warchest','battle_deployment','battle_round','battle_result','ending','campaign_report'].includes(s.phase);
export function canonical(v:unknown):string {if(v===null||typeof v!=='object')return JSON.stringify(v);if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';}
export async function checksum(s:State){const bytes=new TextEncoder().encode(canonical(s));if(!globalThis.crypto?.subtle)return sha256(bytes);const digest=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');}
export async function envelope(s:State,label='Campaign'):Promise<Envelope>{invariants(s);return {format:'math-civilization-save',schemaVersion:s.schemaVersion,buildVersion:s.buildVersion,savedAt:new Date().toISOString(),slotLabel:Array.from(label.replace(/[<>\u0000-\u001f]/g,'')).slice(0,40).join(''),checksum:await checksum(s),state:structuredClone(s)};}
export async function verify(raw:unknown):Promise<Envelope>{validateSaveEnvelope(raw);const e=raw as Envelope;if(e.schemaVersion!==e.state.schemaVersion)throw Error('Save header and state versions disagree.');if(await checksum(e.state)!==e.checksum)throw Error('Save checksum does not match. Existing saves have been preserved.');saveStructure(e.state);invariants(e.state);return e;}
function db():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{let settled=false;const timer=setTimeout(()=>{settled=true;reject(Error('Save storage did not respond.'));},1500);
 try{const r=indexedDB.open('math-civilization',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('saves'))r.result.createObjectStore('saves');if(!r.result.objectStoreNames.contains('settings'))r.result.createObjectStore('settings');};
  r.onsuccess=()=>{clearTimeout(timer);if(settled)r.result.close();else{settled=true;resolve(r.result);}};
  r.onerror=r.onblocked=()=>{clearTimeout(timer);if(!settled){settled=true;reject(r.error??Error('Save storage is blocked.'));}};}
 catch(error){clearTimeout(timer);settled=true;reject(error);}});}
async function idbWrite(slot:Slot,value:Envelope){
 await verify(value);const migrated=value.schemaVersion===1?await envelope(migrateState(value.state),value.slotLabel):value;await verify(migrated);const d=await db();
 try{await new Promise<void>((resolve,reject)=>{const t=d.transaction(['saves','settings'],'readwrite'),saves=t.objectStore('saves'),backups=t.objectStore('settings'),old=saves.get(slot);
  old.onsuccess=()=>{const prior=old.result as Envelope|undefined;if(prior?.schemaVersion===1)backups.put(prior,'legacy-save:'+slot+':'+prior.checksum);if(value.schemaVersion===1)backups.put(value,'legacy-save:'+slot+':'+value.checksum);saves.put(migrated,slot);};
  t.oncomplete=()=>resolve();t.onabort=t.onerror=()=>reject(t.error??Error('Save interrupted; the previous committed save remains.'));});}finally{d.close();}
}
async function idbRead(slot:Slot):Promise<Envelope|undefined>{const d=await db();try{return await new Promise((resolve,reject)=>{const r=d.transaction('saves').objectStore('saves').get(slot);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{d.close();}}
async function idbBackups():Promise<Envelope[]>{const d=await db();try{return await new Promise((resolve,reject)=>{const out:Envelope[]=[],r=d.transaction('settings').objectStore('settings').openCursor();r.onsuccess=()=>{const c=r.result;if(!c){resolve(out);return;}if(String(c.key).startsWith('legacy-save:'))out.push(c.value);c.continue();};r.onerror=()=>reject(r.error);});}finally{d.close();}}
async function idbDelete(slot:Slot){const d=await db();try{await new Promise<void>((resolve,reject)=>{const t=d.transaction('saves','readwrite');t.objectStore('saves').delete(slot);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}finally{d.close();}}

// Some iPhone/iPad HTML viewers block IndexedDB. Fall back to localStorage, then to session memory,
// and tell the player which one is in use so they can export backups.
type Fallback={version:1;saves:Partial<Record<Slot,Envelope>>;backups:Record<string,Envelope>};
const fallbackKey='mc-save-fallback-v1';
let mode:'indexeddb'|'local'|'session'|null=null,probe:Promise<'indexeddb'|'local'|'session'>|null=null,fallback:Fallback={version:1,saves:{},backups:{}};
export function storageNotice(){return mode==='session'?'SESSION-ONLY SAVES: this viewer does not allow persistent storage. Export or copy your campaign before closing. Existing browser saves have not been deleted.':mode==='local'?'Compatibility saves use local storage in this viewer. Export backups; files moved to another app may use different storage. Existing IndexedDB saves remain untouched.':'';}
export function savedMessage(){return mode==='session'?'Saved for this session only. Export before closing.':'Campaign saved. Keep an exported backup.';}
export async function storageMode(){return probe??=(async()=>{try{(await db()).close();mode='indexeddb';}catch{try{const raw=localStorage.getItem(fallbackKey);if(raw){const parsed=JSON.parse(raw) as Fallback;if(parsed.version!==1||!parsed.saves||!parsed.backups||Array.isArray(parsed.saves)||Array.isArray(parsed.backups))throw Error('Invalid fallback');fallback=parsed;}localStorage.setItem('mc-storage-probe','1');localStorage.removeItem('mc-storage-probe');mode='local';}catch{mode='session';}}return mode!;})();}
function persist(next:Fallback){if(mode==='local')localStorage.setItem(fallbackKey,JSON.stringify(next));fallback=next;}
export async function rawSlot(slot:Slot):Promise<Envelope|undefined>{return await storageMode()==='indexeddb'?idbRead(slot):fallback.saves[slot]?structuredClone(fallback.saves[slot]):undefined;}
export async function writeSlot(slot:Slot,value:Envelope){if(await storageMode()==='indexeddb')return idbWrite(slot,value);
 await verify(value);const migrated=value.schemaVersion===1?await envelope(migrateState(value.state),value.slotLabel):value;await verify(migrated);
 const next=structuredClone(fallback),prior=next.saves[slot];for(const e of [prior,value])if(e?.schemaVersion===1)next.backups[slot+':'+e.checksum]=structuredClone(e);next.saves[slot]=structuredClone(migrated);persist(next);}
export async function loadSlot(slot:Slot){let e=await rawSlot(slot);if(!e)throw Error('This slot is empty.');await verify(e);if(e.schemaVersion===1){await writeSlot(slot,e);e=(await rawSlot(slot))!;}return (await verify(e)).state;}
export async function legacyBackups():Promise<Envelope[]>{return await storageMode()==='indexeddb'?idbBackups():structuredClone(Object.values(fallback.backups));}
export async function deleteSlot(slot:Slot){if(await storageMode()==='indexeddb')return idbDelete(slot);const next=structuredClone(fallback);delete next.saves[slot];persist(next);}
// Viewers that cannot download files can still share the file or copy the text.
export function download(name:string,value:unknown,type='application/json'){
 const text=typeof value==='string'?value:JSON.stringify(value,null,2),blob=new Blob([text],{type}),d=document.createElement('dialog');d.className='export-dialog';
 const h=document.createElement('h2');h.textContent='Export '+name;const p=document.createElement('p');p.textContent='Save/share the file, or select and copy all text below. If this viewer cannot download files, paste the text into a saved note. Import pasted save text from Save / Load.';
 const area=document.createElement('textarea');area.readOnly=true;area.value=text;area.setAttribute('aria-label','Export text');area.rows=8;
 const share=document.createElement('button');share.textContent='Save / Share file';share.onclick=async()=>{try{const file=new File([blob],name,{type});if(navigator.canShare?.({files:[file]})&&navigator.share){await navigator.share({files:[file]});return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);p.textContent='If no file appeared, use Select all text below and copy it manually.';}catch{p.textContent='Sharing was cancelled or unavailable. You can still copy the text below.';}};
 const select=document.createElement('button');select.textContent='Select all text';select.onclick=()=>{area.focus();area.select();area.setSelectionRange(0,area.value.length);};
 const close=document.createElement('button');close.textContent='Close';close.onclick=()=>d.remove();d.addEventListener('cancel',()=>d.remove());
 d.append(h,p,share,select,area,close);(document.querySelector('#game')??document.body).append(d);d.showModal();
}
