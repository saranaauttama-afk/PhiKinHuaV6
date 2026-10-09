import type {ClassId} from '../classes';
import type {BlessingDef,GameState} from '../types';
import {NIGHT_ENEMY_DECKS} from './enemyDecks';
import {applyStatusEffect} from '../statusEffectsRuntime';

export type Night=1|2|3|4|5;
export type CampaignRun={night:Night;unlocks:Array<'card'|'blessing'>;bossAwakened?:boolean};
export const NIGHT_RULES=[
 {night:1,name:'คืนแรก',desc:'สามหน้า · ผีครบทุกตัวกับบอสประจำคืน · ผีสะสมแรงทุก 4 เทิร์น'},
 {night:2,name:'คืนเสียงเรียก',desc:'ผีเลือดเพิ่ม 10% · การโจมตีแต่ละหมัดแรงขึ้น 1'},
 {night:3,name:'คืนอาถรรพ์',desc:'ผีเลือดเพิ่ม 20% · แรงขึ้น 1 · สะสมแรงทุก 3 เทิร์น'},
 {night:4,name:'คืนล้อมบ้าน',desc:'ผีเลือดเพิ่ม 30% · ผีชั้นสูงและบอสเริ่มด้วยเกราะ 6 · บอสตื่นเมื่อเลือดครึ่งหนึ่ง'},
 {night:5,name:'คืนผีกินหัว',desc:'ผีเลือดเพิ่ม 40% · แรงขึ้น 1 · บอสตื่นแล้วเล่นได้เพิ่ม 1 พลังงาน · หลังปราบบอสประจำคืน ต้องปราบผีกินหัวตัวจริง'},
] as const;
export const SPECIAL_CARD_IDS:Record<ClassId,string>={warrior:'night_guardian_cut',shaman:'night_hex_knot',nun:'night_lotus_wheel',medium:'night_ancestor_pact'};
export const SPECIAL_BLESSINGS:Record<ClassId,BlessingDef>={
 warrior:{id:'night_warrior_blessing',name:'ครูลานวัด',rarity:'Rare',desc:'สกิลใบแรกแต่ละเทิร์นได้ป้องกันเพิ่ม 3'},
 shaman:{id:'night_shaman_blessing',name:'ครูคุ้มคาถา',rarity:'Rare',desc:'การ์ดใส่สถานะใบแรกแต่ละเทิร์นได้ป้องกันเพิ่ม 3'},
 nun:{id:'night_nun_blessing',name:'แสงบุญ',rarity:'Rare',desc:'ต้นเทิร์น: เลือดต่ำกว่าครึ่งฟื้น 2 มิฉะนั้นได้ป้องกัน 2'},
 medium:{id:'night_medium_blessing',name:'หิ้งบรรพบุรุษ',rarity:'Rare',desc:'ต้นเทิร์นได้ป้องกัน 2 ต่อวิญญาณคู่กายที่ยังอยู่ สูงสุด 4'},
};
export function configureNightEnemy(s:GameState):void{
 if(!s.campaign||!s.enemy)return;
 const n=s.campaign.night,f=(s.fightCount??0)+1;
 const monster=require('../monsters/thai-ghosts').getMonsterById(s.enemy.id);
 const boss=monster?.tier.includes('Boss');
 const adventure=!!s.pages?.adventure;
 const baseHp=adventure?(boss?(s.enemy.id==='phi-kin-hua'?245:s.enemy.maxHp):Math.max(28,s.enemy.maxHp)):Math.max(s.enemy.maxHp,f<=2?34:0);
 s.enemy.hp=s.enemy.maxHp=Math.round(baseHp*(1+(n-1)*.1));
 const budget=adventure?(boss?(n===5?3:4):monster?.tier==='T1'?2:3):boss?(f===7?4:f>=16?6:5):f<=4?3:f<=9?3:4;
 s.enemy.maxEnergy=budget;s.enemy.handSize=budget+1;
 if(NIGHT_ENEMY_DECKS[s.enemy.id])s.enemy.ai!.deck={lists:[{id:s.enemy.id,weight:1,cards:NIGHT_ENEMY_DECKS[s.enemy.id]}]};
 const deck=s.enemy.ai!.deck!;deck.maxEnergy=budget;deck.handSize=budget+1;
 s.campaign.bossAwakened=false;
 if(n>=2)applyStatusEffect('enemy',s,'strength',99,n>=4&&!adventure?2:1);
 if(n>=4&&(boss||monster?.tier==='Elite'))s.enemy.block=6;
}
export function awakenNightBoss(s:GameState):void{
 if(!s.campaign||s.campaign.night<4||s.campaign.bossAwakened||!s.enemy||s.enemy.hp<=0||s.enemy.hp>s.enemy.maxHp*.5)return;
 const monster=require('../monsters/thai-ghosts').getMonsterById(s.enemy.id);
 if(!monster?.tier.includes('Boss'))return;
 s.campaign.bossAwakened=true;
 applyStatusEffect('enemy',s,'strength',99,1);
 require('../combat/damage').gainBlock(s,'enemy',8);
 if(s.campaign.night===5){s.enemy.maxEnergy=(s.enemy.maxEnergy??5)+1;const deck=s.enemy.ai!.deck!;deck.maxEnergy=s.enemy.maxEnergy;(s as any).enemyMaxEnergy=s.enemy.maxEnergy;}
 s.log.push('บอสตื่น: แข็งแกร่ง +1 เกราะ +8'+(s.campaign.night===5?' พลังงาน +1':''));
}
export function nightEscalation(s:GameState):{every:number;strength:number}|undefined{
 if(!s.campaign)return;
 return {every:s.campaign.night>=3?3:4,strength:1};
}
