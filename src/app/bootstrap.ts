import '../styles/shell.css';
import {validateContent} from '../content/loader';
import {App} from '../ui/app';
const root=document.querySelector<HTMLElement>('#game')!;
function fit(){const scale=Math.min(innerWidth/650,innerHeight/490);root.style.setProperty('--scale',String(scale));document.body.classList.toggle('portrait',innerWidth<innerHeight&&matchMedia('(pointer: coarse)').matches);}
window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);fit();
try{validateContent();void new App(root).start().catch(error=>{root.textContent='Could not open local campaign storage: '+String(error);});}catch(error){root.textContent='Cannot start this campaign. Local content check failed: '+String(error);}
