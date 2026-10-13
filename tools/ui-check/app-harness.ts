// Test harness: the real game UI, started from a campaign state played by the simulation bot.
// URL hash: #seed=3&phase=battle  (stops at battle provisioning)  or  #seed=3&phase=world&chapter=2
import '../../src/styles/shell.css';
import {App} from '../../src/ui/app';
import type {State} from '../../src/core/types';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bot=require('../sim/bot.cjs') as {campaign:(seed:number,cfg:Record<string,unknown>)=>{state:State}};
const q=new URLSearchParams(location.hash.slice(1));
const root=document.querySelector<HTMLElement>('#game')!;
const phone=innerWidth<=900;document.body.classList.toggle('phone-layout',phone);if(!phone)root.style.setProperty('--scale',String(Math.min(innerWidth/640,innerHeight/480)));
const app=new App(root);
(window as unknown as {app:App}).app=app;
void app.start().then(()=>{if(q.get('fresh')){app.view='title';app.render();return;}const {state}=bot.campaign(Number(q.get('seed')??3),{noBattle:true,acc:1});app.state=state;app.view='play';app.render();(window as unknown as {app:App}).app=app;});
