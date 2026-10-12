import {difficultyOf} from './threeNight';
import type {ClassId} from '../classes';
import type {BlessingDef,GameState} from '../types';
import {NIGHT_ENEMY_DECKS,NIGHT_AWAKENED_DECKS } from './enemyDecks';
import {applyStatusEffect} from '../statusEffectsRuntime';
import {applyEnemyBattleRule} from './enemyRules';
import {ENEMY_HP,ENEMY_RULES,RAGE} from '../balance/notfm';

export type Night=import('./threeNight').RunNight;
export type CampaignRun={night:Night;difficulty:import('./threeNight').Difficulty;completedNights:number;unlocks:Array<'card'|'blessing'>;bossAwakened?:boolean};
export const SPECIAL_CARD_IDS:Record<ClassId,string>={warrior:'night_guardian_cut',shaman:'night_hex_knot',nun:'night_lotus_wheel',medium:'night_ancestor_pact'};
/** The class blessing a fifth-night clear can unlock. */
export const SPECIAL_BLESSINGS:Record<ClassId,BlessingDef>=Object.fromEntries((['warrior','shaman','nun','medium'] as ClassId[]).map(id=>[id,require('../pack').classBlessing(id)])) as Record<ClassId,BlessingDef>;
export function configureNightEnemy(s:GameState):void{
 if(!s.campaign||!s.enemy)return;
 const d=difficultyOf(s);
 const monster=require('../monsters/thai-ghosts').getMonsterById(s.enemy.id);
 const offer=s.pages?.current?.offers[s.pages?._activeOfferIndex??-1];
 const boss=offer?.kind==='boss';
 const elite=offer?.kind==='monster'&&offer.tier==='elite';
 const tier=Math.max(1,Math.min(5,Number(monster?.tier.slice(1))||1));
 const baseHp=boss?(s.enemy.id==='phi-kin-hua'?ENEMY_HP.ultimateBoss:ENEMY_HP.boss):elite?ENEMY_HP.elite:ENEMY_HP.normal+tier*ENEMY_HP.perTier;
 s.enemy.hp=s.enemy.maxHp=Math.round(baseHp*ENEMY_HP.night[s.campaign.night-1]*(1+(d-1)*ENEMY_HP.perDifficulty));
 const rules=ENEMY_RULES[boss?'boss':elite?'elite':'normal'];
 s.enemy.maxAp=rules.ap;s.enemy.handSize=rules.handSize;
 if(NIGHT_ENEMY_DECKS[s.enemy.id])s.enemy.deck=[...NIGHT_ENEMY_DECKS[s.enemy.id]];
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
  const piles=s.enemyPiles;
  if(piles)for(const key of ['draw','hand','discard'] as const)piles[key]=piles[key].map(id=>swaps.get(id)??id);
  s.enemy.deck=[...phaseDeck];
 }
 require('../combat/damage').gainBlock(s,'enemy',8);
 if(difficultyOf(s)===5)s.enemy.maxAp=(s.enemy.maxAp??ENEMY_RULES.boss.ap)+1;
 s.log.push('บอสตื่น: เปลี่ยนท่า เกราะ +8'+(difficultyOf(s)>=4?' แข็งแกร่ง +1':'')+(difficultyOf(s)===5?' แต้ม +1':''));
}

/** Whether rage is on for this fight: from night `RAGE.fromNight(difficulty)`. */
export function rageActive(s:Partial<GameState>):boolean{
 return !!s.campaign&&s.campaign.night>=RAGE.fromNight(difficultyOf(s));
}
/** Rage stacks for the current turn (0 before `RAGE.startTurn`). */
export function rageStacks(s:Partial<GameState>):number{
 if(!rageActive(s))return 0;
 return Math.max(0,((s.turn??1)-RAGE.startTurn+1)*RAGE.perTurn);
}
/** Start of the ghost's turn: rage rises to match how long the fight has lasted. */
export function applyRage(s:GameState):void{
 if(!s.enemy)return;
 const n=rageStacks(s);if(!n)return;
 const list=s.enemy.statusEffects??=[];
 const old=list.find(e=>e.id==='rage');
 if(old){if((old.stacks??0)>=n)return;old.stacks=n;old.duration=99;}
 else applyStatusEffect('enemy',s,'rage',99,n);
 s.log.push(`ผีโกรธ ${n}: ทุกหมัดแรงขึ้น ${n}`);
}

function adventureRoute(s:GameState){const ix=s.pages?._activeOfferIndex;return ix!=null&&s.pages?.adventure&&s.pages.current?.offers[ix]?.kind==='monster';}
