// @vitest-environment happy-dom
import {beforeEach,describe,it,expect,vi} from 'vitest';
import 'fake-indexeddb/auto';
import {webcrypto} from 'node:crypto';
vi.mock('../../src/ui/audio',()=>({LocalAudio:class{update(){}cue(){}}}));
vi.mock('../../src/scenes/WorldView',()=>({WorldView:class{destroy(){}}}));
import {App} from '../../src/ui/app';
import {createState} from '../../src/core/reducer';
import {chapter} from '../../src/content/registry';
import {loadSlot,writeSlot,envelope,verify,rawSlot} from '../../src/persistence/saveRepository';
Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});
let app:App;
function click(id:string){const b=document.querySelector<HTMLButtonElement>(`[data-action="${id}"]`)!;expect(b,id).not.toBeNull();expect(b.disabled,id).toBe(false);b.click();}
function fill(correct=true){const c=app.state!.activeOrder!;for(const el of document.querySelectorAll<HTMLInputElement>('[data-answer]'))el.value=String(correct?c.answer[el.dataset.answer!]:0);click('answer');document.querySelector<HTMLButtonElement>('#yes')?.click();}
beforeEach(async()=>{document.body.innerHTML='<main id="game"></main>';app=new App(document.querySelector('#game')!);await app.start();});
describe('Thin checkpoint DOM interactions',()=>{
 it('aborted IndexedDB write preserves the previous committed save',async()=>{const initial=createState(444);await writeSlot('manual-1',await envelope(initial));const database=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('math-civilization',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await new Promise<void>(resolve=>{const tx=database.transaction('saves','readwrite');tx.objectStore('saves').put({broken:true},'manual-1');tx.onabort=()=>resolve();tx.abort();});database.close();expect((await loadSlot('manual-1')).seed).toBe(444);});
 it('invalid campaign phase fails import despite a recomputed checksum',async()=>{const s=createState();s.phase='unsupported' as typeof s.phase;await expect(verify(await envelope(s))).rejects.toThrow('Unrecognized campaign position');});
 it('title, seed setup, council and policy reach orders',()=>{click('new');(document.querySelector('#seed') as HTMLInputElement).value='1';click('start');click('advance');click('advance');click('advance');click('policy:'+chapter(1).policyChoices[0].id);expect(app.state!.phase).toBe('orders');});
 for(const failures of [0,1,2,3])it('labor order attempt path '+failures,()=>{app.state=createState();app.state.phase='orders';app.view='play';app.render();click('detail:c1_labor_ledger');click('open:c1_labor_ledger');for(let n=0;n<failures;n++)fill(false);if(failures===3){click('adviser');expect(document.querySelector('dialog')!.textContent).toContain('Use the adviser’s solution');click('complete:adviser');}else fill(true);expect(app.state.challengeRecords[0].masteryPoints).toBe([100,75,50,25][failures]);expect(app.state.commandSeals).toBe(2);click('close-result');expect(document.querySelector('dialog')).toBeNull();});
 it('Chapter 1 economy/crisis/world and Chapter 2 save/reload',async()=>{app.state=createState(1);app.state.phase='orders';app.view='play';app.render();for(const id of ['c1_labor_ledger','c1_tax_register','audit_stores']){click('detail:'+id);click('open:'+id);fill();if(app.state.pendingReward!==null)click('audit:food');else click('close-result');if(String(app.state.phase)==='convoy_briefing'){click('convoy:skip');document.querySelector<HTMLButtonElement>('#yes')?.click();}}click('end');document.querySelector<HTMLButtonElement>('#yes')?.click();expect(app.state.phase).toBe('administration');click('advance');if(String(app.state.phase)==='crisis')click('crisis:accept');click('advance');expect(app.state.phase).toBe('chapter_report');click('advance');await app.saveChain;const reloaded=await loadSlot('autosave');expect(reloaded.chapterIndex).toBe(2);expect(reloaded.resources).toEqual(app.state.resources);});
 it('closing an unsubmitted dialog returns its order without a Seal',()=>{app.state=createState();app.state.phase='orders';app.view='play';app.render();click('detail:c1_labor_ledger');click('open:c1_labor_ledger');click('close');expect(app.state.activeOrder).toBeNull();expect(app.state.commandSeals).toBe(3);});
});
