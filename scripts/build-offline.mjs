// Offline single-file build for Math Civ (Sekigahara).
// Used when Vite and the npm registry are unavailable. It bundles src/app/bootstrap.ts with esbuild,
// embeds public/ assets, and writes release/PLAY-SEKIGAHARA-<version>.html.
// Usage: node scripts/build-offline.mjs   (DEV=1 builds the owner playtest file; ENTRY=... OUT=... build a test harness with the same embedding)
import {createRequire} from 'node:module';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
function loadEsbuild(){
  const tries=[process.env.ESBUILD_PATH,'esbuild','/opt/npm-tools/node_modules/esbuild'].filter(Boolean);
  for(const t of tries){try{return require(t);}catch{}}
  throw new Error('esbuild not found. Set ESBUILD_PATH or run npm install.');
}
const esbuild=loadEsbuild();
const versionSrc=await readFile('src/core/version.ts','utf8');
const version=/BUILD_VERSION='([^']+)'/.exec(versionSrc)[1];
const result=await esbuild.build({
  entryPoints:[process.env.ENTRY??'src/app/bootstrap.ts'],bundle:true,format:'iife',target:'es2020',write:false,outdir:'dist-local',
  minify:true,legalComments:'inline',
  alias:{phaser:'./vendor/phaser/phaser.min.cjs'},
  loader:{'.woff2':'dataurl','.webp':'dataurl','.png':'dataurl','.wav':'dataurl'},
  define:{'import.meta.env.PROD':'true','import.meta.env.DEV':'false',__DEV_BUILD__:process.env.DEV==='1'?'true':'false'},
  logLevel:'error'
});
let js='',css='';
for(const f of result.outputFiles){if(f.path.endsWith('.js'))js=f.text;else if(f.path.endsWith('.css'))css=f.text;}
const mime={webp:'image/webp',png:'image/png',woff2:'font/woff2',wav:'audio/wav',mp3:'audio/mpeg'};
async function walk(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
const map={};
for(const p of (await walk('public')).sort()){const ext=p.split('.').at(-1);if(mime[ext])map['./'+p.slice(7)]='data:'+mime[ext]+';base64,'+(await readFile(p)).toString('base64');}
const boot=(await readFile('src/app/boot-status.js','utf8')).trim();
const game=('globalThis.SEKIGAHARA_ASSETS='+JSON.stringify(map)+';\n'+js).replaceAll('</script','<\\/script');
const h=s=>"'sha256-"+createHash('sha256').update(s).digest('base64')+"'";
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${h(boot)} ${h(game)}; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'"><title>The Road to Sekigahara v${version}${process.env.DEV==='1'?' · DEV PLAYTEST':''}</title><style>${css}</style><div id="boot-status" role="status">Loading Sekigahara ${version}… If this message stays, open the file as a webpage in a JavaScript-enabled HTML app, not a source-code preview. This edition needs iOS 15.4 or newer.</div><noscript>This HTML viewer has JavaScript disabled. The game cannot run in a preview-only app.</noscript><script>${boot}</script><main id="viewport"><div id="game"></div></main><div id="announcer" class="sr-only" aria-live="polite"></div><script>${game}</script></html>`;
await mkdir('release',{recursive:true});
const dev=process.env.DEV==='1',out=process.env.OUT??`release/PLAY-SEKIGAHARA-${version}${dev?'-DEV-PLAYTEST':''}.html`;
await writeFile(out,html);
console.log(out,(Buffer.byteLength(html)/1048576).toFixed(2)+' MiB','sha256',createHash('sha256').update(html).digest('hex'));
