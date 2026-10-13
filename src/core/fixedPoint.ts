// All outcome multipliers are integer per-thousand; casualty fractions use basis points.
export const floor = (v:number,n=1,d=1)=>Math.floor(v*n/d);
export const ceil = (v:number,n=1,d=1)=>Math.ceil(v*n/d);
export const round = (v:number,n=1,d=1)=> v*n < 0 ? -Math.floor((-v*n+d/2)/d) : Math.floor((v*n+d/2)/d);
export const clamp=(v:number,min=0,max=100)=>Math.min(max,Math.max(min,Math.trunc(v)));
export const nearest10=(v:number)=>round(v,1,10)*10;
export const sum=(v:number[])=>v.reduce((a,b)=>a+b,0);
