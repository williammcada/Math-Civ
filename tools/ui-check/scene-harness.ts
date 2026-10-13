// Test harness: opens one scene of the v0.4 scene player on a prepared state, for screenshots.
// URL hash: #<scene>&gifu=1&koba=70&side=east&result=victory&reason=core_rout&phone=1
import '../../src/styles/shell.css';
import {createState} from '../../src/core/reducer';
import {ScenePlayer,scenes,endingScene} from '../../src/ui/scenePlayer';
import type {Battle} from '../../src/core/types';
const q=new URLSearchParams(location.hash.slice(1).replace(/^([^&=]+)(&|$)/,'scene=$1$2'));
const root=document.querySelector<HTMLElement>('#game')!,phone=q.get('phone')==='1';
document.body.classList.toggle('phone-layout',phone);
if(!phone)root.style.setProperty('--scale',String(Math.min(innerWidth/640,innerHeight/480)));
const s=createState(7),name=q.get('scene')??'ch1';
s.chapterIndex=Number(q.get('chapter')??(name.startsWith('ch')?name.slice(2):4));
s.flags.gifu_controlled=q.get('gifu')==='1';s.diplomacy.kobayakawaCommitment=Number(q.get('koba')??67);
s.playerArmy.locationId=s.chapterIndex>=4?'kiyosu':s.chapterIndex===3?'oyama':'edo';
if(['ending','koba_east','koba_west','koba_hold'].includes(name))s.battle={auxSide:(q.get('side')??'east'),result:q.get('result')??'victory',outcomeReason:q.get('reason')??'core_rout'} as unknown as Battle;
if(name==='ending'){s.flags.convoy_status='intact';s.ending={tier:(q.get('tier')??'good') as 'good'} as never;}
const scene=name==='ending'?endingScene(s,'The Realm Pacified'):scenes[name];
(window as unknown as {player:ScenePlayer}).player=new ScenePlayer(root,s,scene,{reduced:q.get('reduced')==='1'});
