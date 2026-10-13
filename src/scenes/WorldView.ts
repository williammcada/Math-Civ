import Phaser from 'phaser';
import type {State,Point,Event} from '../core/types';
import {campaign} from '../content/registry';
import {activeUnit,alive,reachable,suppressed} from '../core/battle';
import {assetURL} from '../ui/assets';
import {intelLevel} from '../core/intel';
export class WorldView {
 game:Phaser.Game;
 constructor(container:HTMLElement,s:State,selected:string,cursor:Point,mode:string,events:Event[]=[],animate=true,fast=false){
 const tactical=!!s.battle&&['battle_deployment','battle_round'].includes(s.phase);
 class Board extends Phaser.Scene {
 preload(){if(tactical)this.load.spritesheet('terrain',assetURL('./art/TILE_TERRAIN.png'),{frameWidth:32,frameHeight:32});}
 create(){const g=this.add.graphics();const label=(x:number,y:number,t:string,size=11,color='#e4d2a8')=>this.add.text(x,y,t,{fontFamily:'monospace',fontSize:size,color,backgroundColor:'#151311aa'});
 if(tactical){const frames:Record<string,number>={plain:0,forest:1,hill:2,road:3,stream:4,bridge:5,east_camp:6,west_camp:6,fieldworks:7};const has=this.textures.exists('terrain');s.battle!.terrain.forEach((row,y)=>row.forEach((t,x)=>{if(has)this.add.image(12+x*32,62+y*32,'terrain',frames[t]??0).setOrigin(0).setDepth(-1);else g.fillStyle(t==='stream'?0x426375:0x536342).fillRect(12+x*32,62+y*32,31,31);}));
 const u=activeUnit(s);if(u&&mode==='move')for(const p of reachable(s,u))g.lineStyle(2,0xe5b85c,.8).strokeRect(14+p.x*32,64+p.y*32,27,27);
 for(const f of s.battle!.formations.filter(alive)){const x=12+f.x*32,y=62+f.y*32;if(has)this.add.image(x,y,'terrain',(f.side==='east'?8:12)+(f.archetype==='cavalry'?0:f.archetype==='spears'?1:2)).setOrigin(0).setDepth(-.5);else label(x+10,y+8,f.archetype==='cavalry'?'C':f.archetype==='spears'?'S':'A',12);g.lineStyle(f.id===u?.id?2:1,f.id===u?.id?0xffd370:f.side==='east'?0x7caddc:0xff8d70).strokeRect(x+1,y+1,30,30);g.fillStyle(0x151311).fillRect(x+4,y+28,24,3);g.fillStyle(0xc49a4a).fillRect(x+4,y+28,24*f.troops/f.startTroops,3);}
 for(const f of s.battle!.formations.filter(alive)){const x=12+f.x*32,y=62+f.y*32;label(x+1,y+1,f.archetype==='cavalry'?'C':f.archetype==='spears'?'S':'G',10,f.side==='east'?'#b1d6f2':'#ffb098');if(f.engineer)label(x+23,y+1,'E',7);if(suppressed(f))label(x+23,y+10,'!',10,'#ffc36a');if(f.routed)label(x+10,y+10,'R',11,'#ffb098');if(f.side==='west'&&!f.routed&&(intelLevel(s)!=='none'||s.flags.weather_scouted)){const intent=s.battle!.intents[f.id];if(intent)label(x+23,y+1,intent.action.kind==='move'?'>':intent.action.kind==='defend'?'D':'!',7,'#ffb098');}}
 const w=s.battle!.wagon;if(w&&!w.delivered){const x=12+w.x*32,y=62+w.y*32;g.fillStyle(0x10100e).fillRect(x+3,y+9,25,18);g.fillStyle(0x846836).fillRect(x+5,y+11,21,11);g.lineStyle(2,0xc49a4a).strokeRect(x+5,y+11,21,11);g.fillStyle(0xe4d2a8).fillRect(x+7,y+7,8,8).fillRect(x+16,y+7,8,8);g.fillStyle(0x151311).fillCircle(x+8,y+25,4).fillCircle(x+24,y+25,4);g.fillStyle(0x7caddc).fillRect(x+3,y+1,8,5);g.lineStyle(1,0xe4d2a8).lineBetween(x+3,y+1,x+3,y+20);if(w.integrity<3){g.lineStyle(2,0xa34232).lineBetween(x+12,y+10,x+18,y+20);if(w.integrity===1)g.lineStyle(2,0xa34232).lineBetween(x+18,y+10,x+10,y+21);}label(x+14,y+15,String(w.integrity),8);}
 if(s.battle!.scenarioId==='convoy')label(236,126,'EXIT',7,'#f4d698');
 if(animate)for(const e of events){const f=s.battle!.formations.find(u=>u.id===((e.detail?.defenderId as string|undefined)??e.key)),ms=fast?150:300;
  if(e.type==='FORMATION_MOVED'&&f){const ghost=this.add.image(12+Number(e.detail?.fromX??f.x)*32,62+Number(e.detail?.fromY??f.y)*32,'terrain',(f.side==='east'?8:12)+(f.archetype==='cavalry'?0:f.archetype==='spears'?1:2)).setOrigin(0).setAlpha(.75);this.tweens.add({targets:ghost,x:12+f.x*32,y:62+f.y*32,alpha:0,duration:ms,onComplete:()=>ghost.destroy()});}
  else if(e.type==='COMBAT_RESOLVED'&&f){// v0.4 (B5): about one second: the attacker lunges, the hit lands, the losses rise.
   const att=s.battle!.formations.find(u=>u.id===e.detail?.attackerId),cx=28+f.x*32,cy=75+f.y*32,lunge=fast?0:450,show=fast?150:900;
   if(att&&lunge&&!['volley','suppress'].includes(e.key)){const ghost=this.add.image(12+att.x*32,62+att.y*32,'terrain',(att.side==='east'?8:12)+(att.archetype==='cavalry'?0:att.archetype==='spears'?1:2)).setOrigin(0);this.tweens.add({targets:ghost,x:12+(att.x+(f.x-att.x)*.45)*32,y:62+(att.y+(f.y-att.y)*.45)*32,duration:lunge/2,yoyo:true,onComplete:()=>ghost.destroy()});}
   else if(att&&lunge){const shot=this.add.graphics();shot.lineStyle(2,0xf4d698,.9).lineBetween(28+att.x*32,78+att.y*32,cx,cy);this.tweens.add({targets:shot,alpha:0,duration:lunge,onComplete:()=>shot.destroy()});}
   this.time.delayedCall(lunge/2,()=>{const flash=this.add.graphics();flash.fillStyle(e.key==='volley'||e.key==='suppress'?0xe4d2a8:0xc49a4a,.85).fillRect(cx-8,cy-2,16,4).fillRect(cx-2,cy-8,4,16);const loss=label(cx-14,cy-16,'−'+e.detail!.defenderLoss,11,'#fff3d0');this.tweens.add({targets:[flash,loss],alpha:0,y:'-=12',duration:show,onComplete:()=>{flash.destroy();loss.destroy();}});});}
  else if(['RESERVE_ENTERED','FORMATION_ROUTED','AUXILIARY_RESOLVED'].includes(e.type)){const note=label(60,45,e.type==='FORMATION_ROUTED'?'RETREAT!':e.type==='RESERVE_ENTERED'?'RESERVE ARRIVES':'COALITION DISPATCH',10);this.tweens.add({targets:note,alpha:0,duration:400,onComplete:()=>note.destroy()});}
 }
 g.lineStyle(2,0xffffff).strokeRect(13+cursor.x*32,63+cursor.y*32,30,30);
 }else{g.fillStyle(0x26362e).fillRect(0,0,432,336);const pos=(n:{x:number;y:number})=>({x:25+(n.x-142)*.98,y:34+(n.y-82)*.85});for(const r of campaign.map.routes){const a=pos(campaign.map.nodes.find(n=>n.id===r.a)!),b=pos(campaign.map.nodes.find(n=>n.id===r.b)!);g.lineStyle(2,0x9d895b).lineBetween(a.x,a.y,b.x,b.y);label((a.x+b.x)/2,(a.y+b.y)/2,String(r.travelPoints),10);}
 for(const n of campaign.map.nodes){const p=pos(n);g.fillStyle(n.id===selected?0xe5b85c:s.map[n.id]?.includes('west')?0xa34232:0xc49a4a).fillRect(p.x-4,p.y-4,9,9);label(p.x-15,p.y+8,n.id.toUpperCase(),10);if(n.id===s.playerArmy.locationId)label(p.x+8,p.y-12,'⚑',16);}
 label(10,8,'CAMPAIGN ROUTES · SCHEMATIC',12);}
 }
 }
 this.game=new Phaser.Game({type:Phaser.CANVAS,parent:container,width:tactical?640:432,height:tactical?480:336,transparent:true,pixelArt:true,antialias:false,audio:{noAudio:true},banner:false,scene:Board, input:{mouse:false,touch:false,keyboard:false}});
 }
 destroy(){this.game.destroy(true);}
}
