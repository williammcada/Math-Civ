"""Original compact synthesized pentatonic scores; no external samples."""
import math,wave,os,random
from array import array
os.makedirs('public/audio',exist_ok=True)
rate=16000
def score(name,root,bpm,seconds,seed):
 rng=random.Random(seed); notes=[0,2,5,7,9,12]; data=array('h',[0])*(rate*seconds);beat=60/bpm
 for n in range(int(seconds/beat)):
  tone=root+notes[(n//4+n%3)%6]; freq=440*2**((tone-69)/12); start=int(n*beat*rate)
  for j in range(min(int(beat*.92*rate),len(data)-start)):
   t=j/rate;env=min(1,t/.008)*math.exp(-t*5);v=(math.sin(2*math.pi*freq*t)+.18*math.sin(6*math.pi*freq*t))*env*.13
   if n%4==0:v+=math.sin(2*math.pi*freq/4*t)*math.exp(-t*2)*.12
   if name=='battle' and n%2==0:v+=(rng.random()*2-1)*math.exp(-t*35)*.07
   data[start+j]=max(-32767,min(32767,int(v*32767)))
 with wave.open('public/audio/'+name+'.wav','wb') as f:f.setparams((1,2,rate,0,'NONE','not compressed'));f.writeframes(data.tobytes())
for i,(name,root,bpm) in enumerate([('title',57,80),('council',50,80),('map',55,80),('battle',45,120)]):score(name,root,bpm,48,i)
for i,name in enumerate(['ending_good','ending_normal','ending_bad']):score(name,60-i*5,80,9,i)
for i,name in enumerate(['click','confirm','error','precision','battle-hit']):score(name,72-i*3,240,1,i)
