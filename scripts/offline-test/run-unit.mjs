// Runs tests/unit/*.test.ts with esbuild and the vitest shim (no npm registry needed).
// Integration tests (tests/integration) need happy-dom and fake-indexeddb and are not run here.
import {createRequire} from 'node:module';import {readdir,mkdir} from 'node:fs/promises';import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
const require=createRequire(import.meta.url);let esbuild;for(const t of [process.env.ESBUILD_PATH,'esbuild','/opt/npm-tools/node_modules/esbuild'].filter(Boolean)){try{esbuild=require(t);break;}catch{}}
const shimUrl=pathToFileURL(resolve('scripts/offline-test/vitest-shim.mjs')).href;
const plugin={name:'vitest-shim',setup(b){b.onResolve({filter:/^vitest$/},()=>({path:shimUrl,external:true}));}};
const files=(await readdir('tests/unit')).filter(f=>f.endsWith('.test.ts')).sort();await mkdir('.test-out',{recursive:true});
for(const f of files){const out=`.test-out/${f}.mjs`;await esbuild.build({entryPoints:['tests/unit/'+f],bundle:true,platform:'node',format:'esm',outfile:out,plugins:[plugin],alias:{phaser:'./vendor/phaser/phaser.min.cjs'},logLevel:'error'});await import(pathToFileURL(resolve(out)).href);}
const shim=await import(shimUrl);const r=await shim.run('tests/unit ('+files.length+' files)');process.exitCode=r.failed?1:0;
