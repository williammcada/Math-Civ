import '../styles/shell.css';
import {validateContent} from '../content/loader';
import {App} from '../ui/app';
// Older iOS HTML viewers lack structuredClone; the game's state is plain JSON.
if(typeof globalThis.structuredClone!=='function')(globalThis as {structuredClone:unknown}).structuredClone=(v:unknown)=>v===undefined?v:JSON.parse(JSON.stringify(v));
const root=document.querySelector<HTMLElement>('#game')!;
function fit(){const vv=window.visualViewport,width=vv?.width??innerWidth,height=vv?.height??innerHeight,phone=innerWidth<=900||matchMedia('(pointer: coarse)').matches&&innerHeight<=500;
 document.body.classList.toggle('phone-layout',phone);document.body.classList.remove('portrait');root.style.setProperty('--scale',String(phone?1:Math.min(width/640,height/480)));
 document.documentElement.style.setProperty('--visible-height',height+'px');document.documentElement.style.setProperty('--visible-top',(vv?.offsetTop??0)+'px');}
window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);window.visualViewport?.addEventListener('scroll',fit);fit();
try{validateContent();void new App(root).start().catch(error=>{root.textContent='This viewer could not start the game: '+String(error)+'. Open the file in an app that runs JavaScript webpages, rather than a file preview.';});}catch(error){root.textContent='Cannot start the game: '+String(error);}
