import {difficultyOf,isThreeNight} from './threeNight';
import type {ClassId} from '../classes';
import type {BlessingDef,GameState} from '../types';
import {NIGHT_ENEMY_DECKS,NIGHT_AWAKENED_DECKS,ENEMY_ARCHETYPES} from './enemyDecks';
import {applyStatusEffect} from '../statusEffectsRuntime';

export type Night=1|2|3|4|5;
export type CampaignRun={night:Night;difficulty?:import('./threeNight').Difficulty;completedNights?:number;unlocks:Array<'card'|'blessing'>;bossAwakened?:boolean};
export const NIGHT_RULES=[
 {night:1,name:'คืนแรก',desc:'สามหน้า · ผี 10 ตัวกับบอสประจำคืน · ผีสะสมแรงทุก 4 เทิร์น'},
 {night:2,name:'คืนเสียงเรียก',desc:'ผีเลือดเพิ่ม 7% · การโจมตีแต่ละหมัดแรงขึ้น 1'},
 {night:3,name:'คืนอาถรรพ์',desc:'ผีเลือดเพิ่ม 14% · แรงขึ้น 1 · สะสมแรงทุก 3 เทิร์น'},
 {night:4,name:'คืนล้อมบ้าน',desc:'ผีเลือดเพิ่ม 21% · ผีชั้นสูงและบอสเริ่มด้วยเกราะ 6 · บอสตื่นเมื่อเลือดครึ่งหนึ่ง'},
 {night:5,name:'คืนผีกินหัว',desc:'ผีเลือดเพิ่ม 28% · แรงขึ้น 1 · บอสตื่นแล้วเล่นได้เพิ่ม 1 พลังงาน · หลังปราบบอสประจำคืน ต้องปราบผีกินหัวตัวจริง'},
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
 const n=difficultyOf(s),f=(s.fightCount??0)+1;
 const monster=require('../monsters/thai-ghosts').getMonsterById(s.enemy.id);
 const boss=monster?.tier.includes('Boss')&&!(adventureRoute(s));
 const adventure=!!s.pages?.adventure;
 const elite=monster?.tier==='Elite'||adventureRoute(s)&&!monster?.tier.startsWith('T');
 const baseHp=adventure?(boss?(s.enemy.id==='phi-kin-hua'?165:isThreeNight(s)?110:110+(n-1)*8):elite?70:48+Math.max(0,Number(monster?.tier.slice(1))||1)*3):Math.max(s.enemy.maxHp,f<=2?34:0);
 const chapterScale=isThreeNight(s)?[1,1.28,1.58][s.campaign.night-1]:1;
 s.enemy.hp=s.enemy.maxHp=Math.round(baseHp*chapterScale*(1+(n-1)*(isThreeNight(s)?.05:adventure?.07:.1)));
 const archetype=ENEMY_ARCHETYPES[s.enemy.id];
 const budget=adventure?(boss?4:elite?3:archetype==='rush'?3:2):boss?4:3;
 const handSize=boss?(n>=3?6:5):elite?5:4;
 s.enemy.maxEnergy=budget;s.enemy.handSize=handSize;
 if(NIGHT_ENEMY_DECKS[s.enemy.id])s.enemy.ai!.deck={lists:[{id:s.enemy.id,weight:1,cards:NIGHT_ENEMY_DECKS[s.enemy.id]}]};
 const deck=s.enemy.ai!.deck!;deck.maxEnergy=budget;deck.handSize=handSize;
 s.campaign.bossAwakened=false;
 if(n>=2&&(!isThreeNight(s)||n>=3||elite||boss))applyStatusEffect('enemy',s,'strength',99,n>=4&&!adventure?2:1);
 if(n>=4&&(boss||elite))s.enemy.block=6;
}
export function awakenNightBoss(s:GameState):void{
 if(!s.campaign||s.campaign.bossAwakened||!s.enemy||s.enemy.hp<=0||s.enemy.hp>s.enemy.maxHp*.5)return;
 const monster=require('../monsters/thai-ghosts').getMonsterById(s.enemy.id);
 if(!monster?.tier.includes('Boss')||adventureRoute(s)||isThreeNight(s)&&difficultyOf(s)<3)return;
 s.campaign.bossAwakened=true;
 if(difficultyOf(s)>=4)applyStatusEffect('enemy',s,'strength',99,1);
 const phaseDeck=NIGHT_AWAKENED_DECKS[s.enemy.id];
 if(phaseDeck){
  const regular=NIGHT_ENEMY_DECKS[s.enemy.id],swaps=new Map(regular.map((id,i)=>[id,phaseDeck[i]]));
  const piles=(s as any).enemyPiles;
  if(piles)for(const key of ['draw','hand','discard'])piles[key]=piles[key].map((id:string)=>swaps.get(id)??id);
  s.enemy.ai!.deck!.lists=[{id:s.enemy.id+'-awakened',weight:1,cards:phaseDeck}];
 }
 require('../combat/damage').gainBlock(s,'enemy',8);
 if(difficultyOf(s)===5){s.enemy.maxEnergy=(s.enemy.maxEnergy??5)+1;const deck=s.enemy.ai!.deck!;deck.maxEnergy=s.enemy.maxEnergy;(s as any).enemyMaxEnergy=s.enemy.maxEnergy;}
 s.log.push('บอสตื่น: เปลี่ยนท่า เกราะ +8'+(difficultyOf(s)>=4?' แข็งแกร่ง +1':'')+(difficultyOf(s)===5?' พลังงาน +1':''));
}
export function nightEscalation(s:GameState):{every:number;strength:number}|undefined{
 if(!s.campaign)return;
 return {every:difficultyOf(s)>=3?3:4,strength:1};
}

function adventureRoute(s:GameState){const ix=s.pages?._activeOfferIndex;return ix!=null&&s.pages?.adventure&&s.pages.current?.offers[ix]?.kind==='monster';}
