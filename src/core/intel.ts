import type {State} from './types';
import {rules} from './logistics';
export type IntelLevel='precise'|'broad'|'none';
// v0.4 (§3.5): Scout information decides how much of the Western army the player can see.
export function intelLevel(s:State):IntelLevel{const v=s.diplomacy.intelligence;return v>=rules.intelligence.precise?'precise':v>=rules.intelligence.broad?'broad':'none';}
export function committedActionVisible(s:State){return !!s.flags.weather_scouted||intelLevel(s)==='precise';}
/** Strength as the player's scouts report it: exact, a range rounded to hundreds, or unknown. */
export function reportedStrength(s:State,troops:number):string{const level=intelLevel(s);if(level==='precise')return troops.toLocaleString('en-US');if(level==='broad'){const lo=Math.floor(troops*0.8/100)*100,hi=Math.ceil(troops*1.2/100)*100;return lo.toLocaleString('en-US')+'–'+hi.toLocaleString('en-US');}return 'unknown';}
export const intelNote=(s:State)=>`Scout information ${s.diplomacy.intelligence}/100: ${intelLevel(s)==='precise'?'exact numbers and committed plans':intelLevel(s)==='broad'?'estimated numbers and broad intentions':'Western numbers and plans unknown'} (exact from ${rules.intelligence.precise}, estimates from ${rules.intelligence.broad}).`;
