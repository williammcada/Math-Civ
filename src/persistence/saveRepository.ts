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
function db():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open('math-civilization',1);r.onupgradeneeded=()=>{r.result.createObjectStore('saves');r.result.createObjectStore('settings');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function writeSlot(slot:Slot,value:Envelope){
 await verify(value);const migrated=value.schemaVersion===1?await envelope(migrateState(value.state),value.slotLabel):value;await verify(migrated);const d=await db();
 try{await new Promise<void>((resolve,reject)=>{const t=d.transaction(['saves','settings'],'readwrite'),saves=t.objectStore('saves'),backups=t.objectStore('settings'),old=saves.get(slot);
  old.onsuccess=()=>{const prior=old.result as Envelope|undefined;if(prior?.schemaVersion===1)backups.put(prior,'legacy-save:'+slot+':'+prior.checksum);if(value.schemaVersion===1)backups.put(value,'legacy-save:'+slot+':'+value.checksum);saves.put(migrated,slot);};
  t.oncomplete=()=>resolve();t.onabort=t.onerror=()=>reject(t.error??Error('Save interrupted; the previous committed save remains.'));});}finally{d.close();}
}
export async function rawSlot(slot:Slot):Promise<Envelope|undefined>{const d=await db();try{return await new Promise((resolve,reject)=>{const r=d.transaction('saves').objectStore('saves').get(slot);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{d.close();}}
export async function loadSlot(slot:Slot){let e=await rawSlot(slot);if(!e)throw Error('This slot is empty.');await verify(e);if(e.schemaVersion===1){await writeSlot(slot,e);e=(await rawSlot(slot))!;}return (await verify(e)).state;}
export async function legacyBackups():Promise<Envelope[]>{const d=await db();try{return await new Promise((resolve,reject)=>{const out:Envelope[]=[],r=d.transaction('settings').objectStore('settings').openCursor();r.onsuccess=()=>{const c=r.result;if(!c){resolve(out);return;}if(String(c.key).startsWith('legacy-save:'))out.push(c.value);c.continue();};r.onerror=()=>reject(r.error);});}finally{d.close();}}
export async function deleteSlot(slot:Slot){const d=await db();try{await new Promise<void>((resolve,reject)=>{const t=d.transaction('saves','readwrite');t.objectStore('saves').delete(slot);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);});}finally{d.close();}}
export function download(name:string,value:unknown,type='application/json'){const blob=new Blob([typeof value==='string'?value:JSON.stringify(value,null,2)],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
