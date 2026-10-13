import {it,expect} from 'vitest';
import {createHash,webcrypto} from 'node:crypto';
import {sha256} from '../../src/persistence/sha256';
import {canonical,checksum,envelope,verify} from '../../src/persistence/saveRepository';
import {createState} from '../../src/core/reducer';
it('fallback SHA-256 matches standard vectors and boundary lengths',()=>{for(const value of ['', 'abc', 'a'.repeat(55),'a'.repeat(56),'a'.repeat(63),'a'.repeat(64),'a'.repeat(65),'a'.repeat(1000),'徳川家康 · Naomasa’s Cavalry'])expect(sha256(new TextEncoder().encode(value))).toBe(createHash('sha256').update(value).digest('hex'));});
it('legacy saves keep the same checksum without Web Crypto',async()=>{const state=createState();state.buildVersion='0.1.0';const previous=Object.getOwnPropertyDescriptor(globalThis,'crypto');Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});try{const saved=await envelope(state);Object.defineProperty(globalThis,'crypto',{value:{},configurable:true});expect(await checksum(state)).toBe(createHash('sha256').update(canonical(state)).digest('hex'));expect((await verify(saved)).state).toEqual(state);}finally{if(previous)Object.defineProperty(globalThis,'crypto',previous);else Reflect.deleteProperty(globalThis,'crypto');}});
