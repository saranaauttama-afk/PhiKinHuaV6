import type {GameState} from '../types';
import {NIGHT_BOSSES,ULTIMATE_BOSS} from './bosses';

export type Difficulty=1|2|3|4|5;
export type RunNight=1|2|3;
/** Each level adds one rule to the ones below (numbers in DIFFICULTY, balance/notfm.ts). */
export const DIFFICULTY_RULES=[
 {level:1,name:'เงาแรก',desc:'สามคืนต่อเนื่อง · ตั้งแต่คืนที่ 2 ผีโกรธขึ้นทุกเทิร์นที่ไฟต์ยืด'},
 {level:2,name:'วิญญาณตื่น',desc:'+ เลือดผีเพิ่ม 20%'},
 {level:3,name:'คืนอาถรรพ์',desc:'+ ผีโกรธตั้งแต่คืนแรก'},
 {level:4,name:'คำสาปลึก',desc:'+ ผีโกรธเร็วขึ้น 1 เทิร์น · ของในร้านแพงขึ้น 25% · บ่อน้ำและศาลฟื้นเลือดครึ่งเดียว'},
 {level:5,name:'ผีกินหัว',desc:'+ คืนที่ 3 จั่วต่อเทิร์นน้อยลง 1 · คืนสุดท้ายต้องปราบผีกินหัวตัวจริง'},
] as const;
/** Every run is the three-night campaign; kept as a guard for states before NewRun. */
export function isThreeNight(s:Partial<GameState>):boolean{return !!s.campaign;}
export function difficultyOf(s:Partial<GameState>):Difficulty{return s.campaign?.difficulty??1;}
export function routeFightQuota(s:Partial<GameState>):number{return s.campaign?.night===1?7:10;}
/** Fights + the guaranteed stops (shop, blessing, story, upgrade, healing, remove) + next_event. A chest may add one. */
export function nightEncounterCount(s:Partial<GameState>):number{return routeFightQuota(s)+6+1;}
export function runFightTotal(difficulty:number):number{return difficulty===5?31:30;}
export function campaignFightTotal(s:Partial<GameState>):number{return runFightTotal(difficultyOf(s));}
export function runEliteQuota(night:number,difficulty:number):number{
 // Difficulty no longer adds elites: each level changes one rule (DIFFICULTY in balance/notfm.ts).
 void difficulty;
 return [0,1,2][night-1];
}
/** Nights 1 and 2 have fixed bosses; night 3's comes from ความกล้า / บุญ and is fixed once its slot appears. */
export function campaignBoss(s:Partial<GameState>){
 const n=s.campaign?.night??1;
 if(n===1)return NIGHT_BOSSES[0];
 if(n===2)return NIGHT_BOSSES[1];
 const fixed=s.campaign?.finalBossId;
 if(fixed)return [...NIGHT_BOSSES,ULTIMATE_BOSS].find(b=>b.id===fixed)!;
 // At difficulty 5 the secret boss already follows the night-3 boss.
 return require('./alignment').alignmentBoss(s,difficultyOf(s)!==5);
}
export function ultimateRequired(s:Partial<GameState>):boolean{return s.campaign?.night===3&&difficultyOf(s)===5;}
