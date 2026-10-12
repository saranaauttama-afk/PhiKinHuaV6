import type {GameState} from '../types';
import {NIGHT_BOSSES,ULTIMATE_BOSS} from './bosses';

export type Difficulty=1|2|3|4|5;
export type RunNight=1|2|3;
export const DIFFICULTY_RULES=[
 {level:1,name:'เงาแรก',desc:'สามคืนต่อเนื่อง · เรียนรู้วิชาและจัดสำรับ · ตั้งแต่คืนที่ 2 ผีโกรธขึ้นทุกเทิร์นที่ไฟต์ยืด'},
 {level:2,name:'วิญญาณตื่น',desc:'ผีชั้นสูงมากขึ้น · ผีชั้นสูงและบอสโจมตีแรงขึ้น 1 · เลือดผีเพิ่ม 5%'},
 {level:3,name:'คืนอาถรรพ์',desc:'ผีโจมตีแรงขึ้น 1 และโกรธตั้งแต่คืนแรก · บอสเปลี่ยนท่าเมื่อเลือดครึ่งหนึ่ง · เลือดผีเพิ่ม 10%'},
 {level:4,name:'คำสาปลึก',desc:'ผีชั้นสูงกับบอสเริ่มด้วยเกราะ 6 · บอสตื่นแล้วแข็งแกร่งขึ้น · เลือดผีเพิ่ม 15%'},
 {level:5,name:'ผีกินหัว',desc:'บอสตื่นแล้วใช้พลังงานเพิ่ม 1 · เลือดผีเพิ่ม 20% · คืนสุดท้ายต้องปราบผีกินหัวตัวจริงเพื่อคืนหัวทั้งหมด'},
] as const;
/** Every run is the three-night campaign; kept as a guard for states before NewRun. */
export function isThreeNight(s:Partial<GameState>):boolean{return !!s.campaign;}
export function difficultyOf(s:Partial<GameState>):Difficulty{return s.campaign?.difficulty??1;}
export function routeFightQuota(s:Partial<GameState>):number{return s.campaign?.night===1?7:10;}
/** Fights + shop + healing + story + next_event (+ special after night 1). */
export function nightEncounterCount(s:Partial<GameState>):number{return routeFightQuota(s)+(s.campaign?.night===1?3:4)+1;}
export function runFightTotal(difficulty:number):number{return difficulty===5?31:30;}
export function campaignFightTotal(s:Partial<GameState>):number{return runFightTotal(difficultyOf(s));}
export function runEliteQuota(night:number,difficulty:number):number{
 return (difficulty===1?[0,1,2]:difficulty===2?[1,2,2]:difficulty===3?[1,2,3]:difficulty===4?[1,3,3]:[2,3,3])[night-1];
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
