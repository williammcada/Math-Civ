import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const mime={webp:'image/webp',png:'image/png',woff2:'font/woff2',wav:'audio/wav'};
async function walk(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const map={};for(const p of await walk('public')){const ext=p.split('.').at(-1);if(mime[ext])map['./'+p.slice(7)]='data:'+mime[ext]+';base64,'+(await readFile(p)).toString('base64');}
let css=await readFile('dist-local/sekigahara-prototype.css','utf8');css=css.replace(/url\(([^)]+)\)/g,(all,raw)=>{const path=raw.replaceAll(/["']/g,'');const data=map[path]??map['./'+path.replace(/^\//,'')];return data?'url('+data+')':all;});
const rawJs='globalThis.SEKIGAHARA_ASSETS='+JSON.stringify(map)+';\n'+await readFile('dist-local/game.js','utf8');
const js=rawJs.replaceAll('</script','<\\/script');
const hash=createHash('sha256').update(js).digest('base64');
await mkdir('release',{recursive:true});
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'"><title>The Road to Sekigahara</title><style>${css}</style><main id="viewport"><div id="game"></div></main><div id="announcer" class="sr-only" aria-live="polite"></div><div id="rotate">Turn your device to landscape.</div><script>${js}</script></html>`;
await writeFile('release/PLAY-SEKIGAHARA.html',html);console.log('Standalone local edition:',(Buffer.byteLength(html)/1048576).toFixed(2),'MiB; network disabled by CSP');
