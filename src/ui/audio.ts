import {assetURL} from './assets';
export class LocalAudio {
 private track:HTMLAudioElement|null=null;private current='';private unlocked=false;private effects=new Set<HTMLAudioElement>();private music=0;private level=0;private muted=false;
 constructor(){document.addEventListener('pointerdown',()=>{this.unlocked=true;this.apply();},{once:true});document.addEventListener('keydown',()=>{this.unlocked=true;this.apply();},{once:true});document.addEventListener('visibilitychange',()=>this.apply());}
 update(scene:string,music:number,effects:number,muted:boolean){this.music=music/100;this.level=effects/100;this.muted=muted;if(this.current!==scene){this.track?.pause();this.current=scene;this.track=new Audio(assetURL('./audio/'+scene+'.mp3'));this.track.loop=!scene.startsWith('ending');}this.apply();}
 private apply(){if(!this.track)return;this.track.volume=this.muted?0:this.music;if(!this.unlocked||document.hidden||this.muted)this.track.pause();else void this.track.play().catch(()=>{});}
 cue(id:string){if(!this.unlocked||this.muted||document.hidden)return;const a=new Audio(assetURL('./audio/'+id+'.wav'));a.volume=this.level;this.effects.add(a);a.onended=()=>this.effects.delete(a);void a.play().catch(()=>this.effects.delete(a));}
}
