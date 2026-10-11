import type {GameState} from '../types';
import {applyStatusEffect} from '../statusEffectsRuntime';
const rules:Record<string,{name:string;detail:string;symbol:string;effect:string;stacks:number;duration:number}>={
 'nang-tanee':{name:'ใบกล้วยบาดมือ',detail:'เริ่มศึกด้วยหนาม 1 ตลอดไฟต์ · การโจมตีหลายครั้งเสี่ยงรับผลสวนหลายครั้ง',symbol:'thorns',effect:'thorns',stacks:1,duration:99},
 'phi-pop':{name:'ปอบกระหาย',detail:'ฟื้นชีวิต 1 ทุกตา · ปล่อยศึกยืดจะเสียจังหวะปิดไฟต์',symbol:'regeneration',effect:'regeneration',stacks:1,duration:99},
 'phi-krasue':{name:'เงากระสือ',detail:'เริ่มด้วยหลบ 1 ครั้ง · การโจมตีหลายครั้งช่วยเปิดทางให้หมัดถัดไป',symbol:'dodge',effect:'dodge',stacks:1,duration:99},
 'krahang':{name:'ปีกลม',detail:'เริ่มด้วยหลบ 1 ครั้ง · วางพิษหรือใช้บริวารเป็นทางเลือก',symbol:'dodge',effect:'dodge',stacks:1,duration:99},
 'phi-pret':{name:'แขนยาว',detail:'เริ่มด้วยแข็งแกร่ง 1 ตลอดศึก · ต้องเผื่อเกราะรับการโจมตีหลายครั้ง',symbol:'strength',effect:'strength',stacks:1,duration:99},
 'phi-phrai':{name:'พรายคืนร่าง',detail:'ฟื้นชีวิต 1 ทุกตา · พิษสะสมช่วยกดการฟื้น',symbol:'regeneration',effect:'regeneration',stacks:1,duration:99},
};
export const enemyBattleRule=(id:string)=>rules[id];
export function applyEnemyBattleRule(s:GameState):void {
 if(s.pages?.adventure?.version!==5||!s.enemy)return;
 const r=rules[s.enemy.id];if(r)applyStatusEffect('enemy',s,r.effect as any,r.duration,r.stacks);
}
