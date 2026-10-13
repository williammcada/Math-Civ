import Phaser from 'phaser';
import type {State,Point} from '../core/types';
import {campaign} from '../content/registry';
import {activeUnit,alive,reachable} from '../core/battle';
import {assetURL} from '../ui/assets';
export class WorldView {
 game:Phaser.Game;
 constructor(container:HTMLElement,s:State,selected:string,cursor:Point,mode:string){
 const tactical=!!s.battle&&['battle_deployment','battle_round'].includes(s.phase);
 class Board extends Phaser.Scene {
 preload(){if(tactical)this.load.spritesheet('terrain',assetURL('./art/TILE_TERRAIN.png'),{frameWidth:32,frameHeight:32});}
 create(){const g=this.add.graphics();const label=(x:number,y:number,t:string,size=11,color='#e4d2a8')=>this.add.text(x,y,t,{fontFamily:'monospace',fontSize:size,color,backgroundColor:'#151311aa'});
 if(tactical){const frames:Record<string,number>={plain:0,forest:1,hill:2,road:3,stream:4,bridge:5,east_camp:6,west_camp:6,fieldworks:7};const has=this.textures.exists('terrain');s.battle!.terrain.forEach((row,y)=>row.forEach((t,x)=>{if(has)this.add.image(12+x*32,62+y*32,'terrain',frames[t]??0).setOrigin(0).setDepth(-1);else g.fillStyle(t==='stream'?0x426375:0x536342).fillRect(12+x*32,62+y*32,31,31);}));
 const u=activeUnit(s);if(u&&mode==='move')for(const p of reachable(s,u))g.lineStyle(2,0xe5b85c,.8).strokeRect(14+p.x*32,64+p.y*32,27,27);
 for(const f of s.battle!.formations.filter(alive)){const x=12+f.x*32,y=62+f.y*32;if(has)this.add.image(x,y,'terrain',(f.side==='east'?8:12)+(f.archetype==='cavalry'?0:f.archetype==='spears'?1:2)).setOrigin(0).setDepth(-.5);else label(x+10,y+8,f.archetype==='cavalry'?'C':f.archetype==='spears'?'S':'A',12);g.lineStyle(f.id===u?.id?2:1,f.id===u?.id?0xffd370:f.side==='east'?0x7caddc:0xff8d70).strokeRect(x+1,y+1,30,30);g.fillStyle(0x151311).fillRect(x+4,y+28,24,3);g.fillStyle(0xc49a4a).fillRect(x+4,y+28,24*f.troops/f.startTroops,3);}
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
