// src/core/combat/enemyHand.ts — the ghost's real hand: draw, pay, retain.
import type {GameState} from '../types';
import {enemyCardById,enemyCardCost} from '../pack_enemy_cards';
import {getMonsterById} from '../monsters/thai-ghosts';
import {ENEMY_RULES,GHOST_MECHANICS,type EnemyKind} from '../balance/notfm';
import {cardFx} from './enemyCardEffects';
import {syncHandCharges} from './ghostMechanics';

export type {EnemyKind};
/** A held card is discarded after waiting this many turns, so the hand keeps moving. */
export const MAX_ENEMY_CARD_WAIT=3;

export function enemyKind(s:GameState):EnemyKind{
 const ix=s.pages?._activeOfferIndex,offer=ix==null?undefined:s.pages?.current?.offers[ix];
 if(offer?.kind==='boss')return 'boss';
 if(offer?.kind==='monster')return offer.tier==='elite'?'elite':'normal';
 const tier=getMonsterById(s.enemy?.id??'')?.tier;
 return tier?.includes('Boss')?'boss':tier==='Elite'?'elite':'normal';
}

/** Fill missing hand fields with the tier's rules; snapshots keep their piles. */
export function initializeEnemyHand(s:GameState):void{
 if(!s.enemy)return;
 const rules=ENEMY_RULES[enemyKind(s)];
 const valid=(n:unknown,fallback:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=0?Math.floor(n):fallback;
 s.enemyHandSize=valid(s.enemyHandSize,rules.handSize);
 s.enemyDrawPerTurn=valid(s.enemyDrawPerTurn,rules.drawPerTurn);
 s.enemyMaxRetained=valid(s.enemyMaxRetained,rules.maxRetained);
 s.enemyIdleTurns=valid(s.enemyIdleTurns,0);
 if(s.enemyPiles){
  for(const key of ['draw','hand','discard'] as const)s.enemyPiles[key]=Array.isArray(s.enemyPiles[key])?s.enemyPiles[key]:[];
  s.enemyPiles.discard.push(...s.enemyPiles.hand.splice(s.enemyHandSize));
  s.enemyHandAges=s.enemyPiles.hand.map((_,i)=>valid(s.enemyHandAges?.[i],0));
  s.enemy.handCount=s.enemyPiles.hand.length;syncHandCharges(s);
 }
}

/** Draw a fixed count into free slots; retained cards are already in hand. */
export function drawEnemyHand(s:GameState):void{
 initializeEnemyHand(s);const p=s.enemyPiles;if(!p)return;
 const count=Math.min(s.enemyDrawPerTurn!,Math.max(0,s.enemyHandSize!-p.hand.length));
 for(let i=0;i<count;i++){
  if(!p.draw.length){p.draw=[...p.discard].reverse();p.discard=[];}
  const id=p.draw.shift();if(id===undefined)break;
  p.hand.push(id);s.enemyHandAges!.push(0);
 }
 if(s.enemy)s.enemy.handCount=p.hand.length;
 syncHandCharges(s);
}

/** Pay for and discard one copy before counters and effects; a cancelled card is still paid. */
export function consumeEnemyCard(s:GameState,index:number):boolean{
 const p=s.enemyPiles,c=p&&enemyCardById(p.hand[index]);
 if(!p||!c||!s.enemy||index<0||index>=p.hand.length)return false;
 const cost=enemyCardCost(c);
 if((s.enemy.ap??0)<cost)return false;
 s.enemy.ap=(s.enemy.ap??0)-cost;
 p.discard.push(p.hand.splice(index,1)[0]);s.enemyHandAges?.splice(index,1);
 s.enemy.handCount=p.hand.length;syncHandCharges(s);
 return true;
}

/**
 * Keep the most useful held cards up to the retain limit; old cards leave.
 * A ชาร์จ card still growing is kept first and is not thrown away for age until one turn after
 * it is full; a payoff whose setup is also held is kept next (enemyPlan.ts rules 1 and 3).
 */
export function finishEnemyHand(s:GameState,played:number):void{
 initializeEnemyHand(s);const p=s.enemyPiles;if(!p)return;
 const missing=s.enemy?s.enemy.maxHp-s.enemy.hp:0;
 const {payoffStatus}=require('./enemyPlan');
 const held=p.hand.map(id=>enemyCardById(id));
 const rank=p.hand.map((id,i)=>{
  const c=held[i],age=(s.enemyHandAges?.[i]??0)+1;
  const f=c?cardFx(s,c):{};
  const useful=Math.min(f.heal??0,missing)+(f.dmg??0)*(f.hits??1)+(f.block??0)*.5+(f.status?.length?3:0);
  const want=c&&payoffStatus(c);
  const paired=!!want&&held.some((o,j)=>j!==i&&!!o?.fx.status?.some(e=>e.to==='enemy'&&e.id===want));
  return {i,age,charge:!!c?.charge,score:useful+(f.heal&&missing===0?4:0)+(c?.charge?30:0)+(paired?8:0)};
 }).filter(x=>x.age<MAX_ENEMY_CARD_WAIT||(x.charge&&x.age<=GHOST_MECHANICS.chargeMaxTurns+1)).sort((a,b)=>b.score-a.score||a.i-b.i);
 const keep=new Set(rank.slice(0,s.enemyMaxRetained).map(x=>x.i));
 const hand:string[]=[],ages:number[]=[];
 p.hand.forEach((id,i)=>{if(keep.has(i)){hand.push(id);ages.push((s.enemyHandAges?.[i]??0)+1);}else p.discard.push(id);});
 p.hand=hand;s.enemyHandAges=ages;s.enemyIdleTurns=played?0:(s.enemyIdleTurns??0)+1;
 if(s.enemy)s.enemy.handCount=hand.length;
 syncHandCharges(s);
}
