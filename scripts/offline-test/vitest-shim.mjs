// Minimal stand-in for the vitest API, used only when the vitest package cannot be installed.
import {isDeepStrictEqual,inspect} from 'node:util';
const tests=[];let prefix=[];const hooks={before:[],after:[]};
export function describe(name,fn){prefix.push(name);fn();prefix.pop();}
export function it(name,fn){tests.push({name:[...prefix,name].join(' › '),fn,before:[...hooks.before],after:[...hooks.after]});}
export const test=it;
export function beforeEach(fn){hooks.before.push(fn);}
export function afterEach(fn){hooks.after.push(fn);}
const fail=m=>{throw new Error(m);};
const show=v=>inspect(v,{depth:4,breakLength:120});
function matchObject(a,b){if(b===null||typeof b!=='object')return isDeepStrictEqual(a,b);if(a===null||typeof a!=='object')return false;return Object.keys(b).every(k=>matchObject(a[k],b[k]));}
function matchers(v,neg=false){const ok=(c,m)=>{if(neg?c:!c)fail((neg?'not ':'')+m);};
 const m={toBe:x=>ok(Object.is(v,x),`expected ${show(v)} to be ${show(x)}`),toEqual:x=>ok(isDeepStrictEqual(JSON.parse(JSON.stringify(v??null)),JSON.parse(JSON.stringify(x??null))),`expected ${show(v)} to equal ${show(x)}`),
  toBeNull:()=>ok(v===null,`expected ${show(v)} to be null`),toBeUndefined:()=>ok(v===undefined,`expected ${show(v)} undefined`),
  toContain:x=>ok(typeof v==='string'?v.includes(x):Array.isArray(v)&&v.some(y=>isDeepStrictEqual(y,x)),`expected ${show(v)} to contain ${show(x)}`),
  toMatch:x=>ok(typeof x==='string'?String(v).includes(x):x.test(String(v)),`expected ${show(v)} to match ${x}`),
  toMatchObject:x=>ok(matchObject(v,x),`expected ${show(v)} to match object ${show(x)}`),toHaveLength:n=>ok(v?.length===n,`expected length ${v?.length} to be ${n}`),
  toBeGreaterThan:n=>ok(v>n,`expected ${v} > ${n}`),toBeGreaterThanOrEqual:n=>ok(v>=n,`expected ${v} >= ${n}`),toBeLessThan:n=>ok(v<n,`expected ${v} < ${n}`),toBeLessThanOrEqual:n=>ok(v<=n,`expected ${v} <= ${n}`),
  toThrow:x=>{let threw=false,err;try{v();}catch(e){threw=true;err=e;}ok(threw&&(x===undefined||(typeof x==='string'?String(err?.message).includes(x):x instanceof RegExp?x.test(String(err?.message)):true)),`expected function to throw ${x??''} (got ${err?.message})`);},
  toHaveBeenCalledWith:(...args)=>ok(v.calls?.some(c=>isDeepStrictEqual(c,args)),`expected call with ${show(args)}`)};return m;}
export function expect(v){const m=matchers(v);m.not=matchers(v,true);
 m.rejects={toThrow:async x=>{try{await v;}catch(e){if(x&&!String(e?.message).includes(x)&&!(x instanceof RegExp&&x.test(e?.message)))fail('rejected with '+e?.message);return;}fail('expected rejection');}};return m;}
export const vi={fn:(impl=()=>{})=>{const f=(...a)=>{f.calls.push(a);return impl(...a);};f.calls=[];return f;},mock:()=>{}};
export async function run(file){let pass=0,failed=0;const out=[];for(const t of tests){try{for(const h of t.before)await h();await t.fn();for(const h of t.after)await h();pass++;}catch(e){failed++;out.push(`  ✘ ${t.name}\n      ${String(e?.message).split('\n')[0]}`);}}
 console.log(`${failed?'FAIL':'PASS'} ${file}: ${pass} passed, ${failed} failed`);if(out.length)console.log(out.join('\n'));return {pass,failed};}
