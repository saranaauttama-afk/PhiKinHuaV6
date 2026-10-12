import {difficultyOf} from './threeNight';
import type {ClassId} from '../classes';
import type {BlessingDef,GameState} from '../types';
import {NIGHT_ENEMY_DECKS,NIGHT_AWAKENED_DECKS } from './enemyDecks';
import {applyStatusEffect} from '../statusEffectsRuntime';
import {applyEnemyBattleRule} from './enemyRules';

export type Night=import('./threeNight').RunNight;
export type CampaignRun={night:Night;difficulty:import('./threeNight').Difficulty;completedNights:number;unlocks:Array<'card'|'blessing'>;bossAwakened?:boolean};
export const SPECIAL_CARD_IDS:Record<ClassId,string>={warrior:'night_guardian_cut',shaman:'night_hex_knot',nun:'night_lotus_wheel',medium:'night_ancestor_pact'};
export const SPECIAL_BLESSINGS:Record<ClassId,BlessingDef>={
 warrior:{id:'night_warrior_blessing',name:'ครูลานวัด',rarity:'Rare',desc:'สกิลใบแรกแต่ละเทิร์นได้ป้องกันเพิ่ม 3'},
 shaman:{id:'night_shaman_blessing',name:'ครูคุ้มคาถา',rarity:'Rare',desc:'การ์ดใส่สถานะใบแรกแต่ละเทิร์นได้ป้องกันเพิ่ม 3'},
 nun:{id:'night_nun_blessing',name:'แสงบุญ',rarity:'Rare',desc:'ต้นเทิร์น: เลือดต่ำกว่าครึ่งฟื้น 2 มิฉะนั้นได้ป้องกัน 2'},
 medium:{id:'night_medium_blessing',name:'หิ้งบรรพบุรุษ',rarity:'Rare',desc:'ต้นเทิร์นได้ป้องกัน 2'},
};
export function configureNightEnemy(s:GameState):void{
 if(!s.campaign||!s.enemy)return;
 const d=difficultyOf(s);
 const monster=require('../monsters/thai-ghosts').getMonsterById(s.enemy.id);
 const offer=s.pages?.current?.offers[s.pages?._activeOfferIndex??-1];
 const boss=offer?.kind==='boss';
 const elite=offer?.kind==='monster'&&offer.tier==='elite';
 const baseHp=boss?(s.enemy.id==='phi-kin-hua'?125:78):elite?48:28+Math.max(0,Math.min(5,Number(monster?.tier.slice(1))||1))*2;
 const chapterScale=[1,1.28,1.58][s.campaign.night-1];
 s.enemy.hp=s.enemy.maxHp=Math.round(baseHp*chapterScale*(1+(d-1)*.05));
 const budget=boss||elite?3:2;
 const handSize=boss?7:elite?6:4;
 s.enemy.maxEnergy=budget;s.enemy.handSize=handSize;
 if(NIGHT_ENEMY_DECKS[s.enemy.id])s.enemy.ai!.deck={lists:[{id:s.enemy.id,weight:1,cards:NIGHT_ENEMY_DECKS[s.enemy.id]}]};
 const deck=s.enemy.ai!.deck!;deck.maxEnergy=budget;deck.handSize=handSize;
 s.campaign.bossAwakened=false;
 if(d>=3||(d>=2&&(elite||boss)))applyStatusEffect('enemy',s,'strength',99,1);
 if(d>=4&&(boss||elite))s.enemy.block=6;
 applyEnemyBattleRule(s);
}
export function awakenNightBoss(s:GameState):void{
 if(!s.campaign||s.campaign.bossAwakened||!s.enemy||s.enemy.hp<=0||s.enemy.hp>s.enemy.maxHp*.5)return;
 const monster=require('../monsters/thai-ghosts').getMonsterById(s.enemy.id);
 if(!monster?.tier.includes('Boss')||adventureRoute(s)||difficultyOf(s)<3)return;
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
