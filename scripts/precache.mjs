import {readdir,readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function walk(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const files=(await walk('dist')).filter(p=>!p.endsWith('/sw.js'));
const hash=createHash('sha256');for(const p of files)hash.update(await readFile(p));
const version='sekigahara-'+hash.digest('hex').slice(0,16),paths=files.map(p=>'./'+p.slice(5));
await writeFile('dist/sw.js',`const VERSION=${JSON.stringify(version)},FILES=${JSON.stringify(paths)};
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(VERSION);try{await cache.addAll(FILES);}catch(e){await caches.delete(VERSION);throw e;}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('sekigahara-')&&key!==VERSION)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==self.location.origin){event.respondWith(Promise.resolve(Response.error()));return;}event.respondWith((async()=>{const cache=await caches.open(VERSION);const response=await cache.match(event.request,{ignoreSearch:true});if(response)return response;if(event.request.mode==='navigate')return await cache.match('./index.html');return Response.error();})());});
`);
await writeFile('dist/build-info.json',JSON.stringify({version,files:files.length,bytes:(await Promise.all(files.map(async f=>(await stat(f)).size))).reduce((a,b)=>a+b,0)},null,2));
console.log('Atomic offline cache prepared:',files.length,'files');
