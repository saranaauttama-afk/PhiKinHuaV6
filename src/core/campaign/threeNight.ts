import type {GameState} from '../types';
import {NIGHT_BOSSES} from './bosses';
import type {Night} from './nights';

export type Difficulty=1|2|3|4|5;
export type RunNight=1|2|3;
export const DIFFICULTY_RULES=[
 {level:1,name:'เงาแรก',desc:'สามคืนต่อเนื่อง · เรียนรู้วิชาและจัดสำรับ · ผีสะสมแรงทุก 4 เทิร์น'},
 {level:2,name:'วิญญาณตื่น',desc:'ผีชั้นสูงมากขึ้น · ผีชั้นสูงและบอสโจมตีแรงขึ้น 1 · เลือดผีเพิ่ม 5%'},
 {level:3,name:'คืนอาถรรพ์',desc:'ผีโจมตีแรงขึ้น 1 และสะสมแรงทุก 3 เทิร์น · บอสเปลี่ยนท่าเมื่อเลือดครึ่งหนึ่ง · เลือดผีเพิ่ม 10%'},
 {level:4,name:'คำสาปลึก',desc:'ผีชั้นสูงกับบอสเริ่มด้วยเกราะ 6 · บอสตื่นแล้วแข็งแกร่งขึ้น · เลือดผีเพิ่ม 15%'},
 {level:5,name:'ผีกินหัว',desc:'บอสตื่นแล้วใช้พลังงานเพิ่ม 1 · เลือดผีเพิ่ม 20% · คืนสุดท้ายต้องปราบผีกินหัวตัวจริงเพื่อคืนหัวทั้งหมด'},
] as const;
export function isThreeNight(s:Partial<GameState>):boolean{return s.campaign?.difficulty!==undefined;}
export function difficultyOf(s:Partial<GameState>):Night{return s.campaign?.difficulty??s.campaign?.night??1;}
export function routeFightQuota(s:Partial<GameState>):number{return isThreeNight(s)&&s.campaign?.night===1?7:10;}
export function nightEncounterCount(s:Partial<GameState>):number{return routeFightQuota(s)+(isThreeNight(s)&&s.campaign?.night===1?3:4);}
export function runFightTotal(difficulty:number):number{return difficulty===5?31:30;}
export function campaignFightTotal(s:Partial<GameState>):number{return isThreeNight(s)?runFightTotal(difficultyOf(s)):10+(s.campaign?.night===5?2:1);}
export function runEliteQuota(night:number,difficulty:number):number{
 return (difficulty===1?[0,1,2]:difficulty===2?[1,2,2]:difficulty===3?[1,2,3]:difficulty===4?[1,3,3]:[2,3,3])[night-1];
}
/** Two local guardians, then the sorcerer; higher tiers rotate existing art/decks. */
export function campaignBoss(s:Partial<GameState>){
 const n=s.campaign?.night??1,d=difficultyOf(s);
 const index=isThreeNight(s)?(n===1?0:n===2?(d>=3?2:1):(d>=4?3:4)):n-1;
 return NIGHT_BOSSES[index];
}
export function ultimateRequired(s:Partial<GameState>):boolean{return isThreeNight(s)?s.campaign?.night===3&&difficultyOf(s)===5:s.campaign?.night===5;}
