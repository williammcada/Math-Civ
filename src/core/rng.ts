import type {State} from './types';
// Stateless-indexed Mulberry32. Cosmetic rendering never calls this function.
export function rng32(seed:number,step:number){let t=(seed+Math.imul(step+1,0x6D2B79F5))>>>0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return (t^(t>>>14))>>>0;}
export function roll(s:State,min:number,max:number){const v=rng32(s.seed,s.rngStep++);return min+Math.floor(v*(max-min+1)/4294967296);}
export function seedText(seed:number){return seed.toString(32).toUpperCase().padStart(8,'0');}
