// Teacher lock for Battle Practice in the classroom file (v0.4, owner decision 14 Oct 2026).
// Modelled on Chrono Circuit's adult lock: default password admin123, stored only as a salted
// PBKDF2 hash on this device, changeable, unlocked for 5 minutes, 30-second pause after 3 misses.
// This keeps casual students out; it is not strong security, because the default is in the file.
const KEY='sekigahara-teacher-lock-v1',DEFAULT='admin123';
const hex=(b:ArrayBuffer|Uint8Array)=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
interface Credential{salt:string;hash:string;plain?:boolean}
async function verifier(password:string,salt:string):Promise<string>{
 const subtle=globalThis.crypto?.subtle;
 if(!subtle)return 'plain:'+salt+':'+password; // viewers without Web Crypto: same behaviour, weaker storage
 const key=await subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 return hex(await subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:150000,hash:'SHA-256'},key,256));
}
async function createCredential(password:string):Promise<Credential>{const c=globalThis.crypto as Crypto|undefined,salt=hex(typeof c?.getRandomValues==='function'?c.getRandomValues(new Uint8Array(16)):new Uint8Array(16).map(()=>Math.floor(Math.random()*256)));return {salt,hash:await verifier(password,salt)};}
function read():Credential|null{try{return JSON.parse(localStorage.getItem(KEY)??'null');}catch{return null;}}
function write(c:Credential){try{localStorage.setItem(KEY,JSON.stringify(c));}catch{/* without storage the default password stays in force */}}
export class TeacherLock{
 private until=0;private failures=0;private blockedUntil=0;
 get unlocked(){return Date.now()<this.until;}
 lock(){this.until=0;}
 /** Returns null on success, or a message to show. */
 async unlock(password:string):Promise<string|null>{
  if(Date.now()<this.blockedUntil)return 'Too many attempts. Wait 30 seconds and try again.';
  let c=read();if(!c){c=await createCredential(DEFAULT);write(c);}
  if(await verifier(password,c.salt)===c.hash){this.failures=0;this.until=Date.now()+300000;return null;}
  if(++this.failures>=3){this.blockedUntil=Date.now()+30000;this.failures=0;}
  return 'Incorrect teacher password.';
 }
 async change(password:string){if(!this.unlocked)throw Error('Unlock with the teacher password first.');if(password.length<6)throw Error('Use at least six characters.');write(await createCredential(password));}
}
