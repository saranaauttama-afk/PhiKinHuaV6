import type {GameState} from '../types';
import {enemyCardById} from '../pack_enemy_cards';
import {getMonsterById} from '../monsters/thai-ghosts';

export type EnemyKind='normal'|'elite'|'boss';
export const ENEMY_HAND_RULES={
 normal:{handSize:4,drawPerTurn:2,maxRetained:2,maxEnergy:2},
 elite:{handSize:6,drawPerTurn:3,maxRetained:3,maxEnergy:3},
 boss:{handSize:7,drawPerTurn:3,maxRetained:4,maxEnergy:3},
} as const;
export const MAX_ENEMY_CARD_WAIT=3;
export function enemyKind(s:GameState):EnemyKind{
 const ix=s.pages?._activeOfferIndex,offer=ix==null?undefined:s.pages?.current?.offers[ix];
 if(offer?.kind==='boss')return 'boss';
 if(offer?.kind==='monster')return offer.tier==='elite'?'elite':'normal';
 const tier=getMonsterById(s.enemy?.id??'')?.tier;
 return tier?.includes('Boss')||/boss/i.test(s.enemy?.id??'')?'boss':tier==='Elite'||/elite/i.test(s.enemy?.id??'')?'elite':'normal';
}
/** Legacy snapshots keep their exact piles and energy. Missing policy fields acquire safe defaults. */
export function initializeEnemyHand(s:GameState):void{
 if(!s.enemy)return;
 const rules=ENEMY_HAND_RULES[enemyKind(s)];
 const valid=(n:unknown,fallback:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=0?Math.floor(n):fallback;
 s.enemyHandSize=valid(s.enemyHandSize,Math.max(rules.handSize,s.enemy.handSize??0));
 s.enemyDrawPerTurn=valid(s.enemyDrawPerTurn,rules.drawPerTurn);
 s.enemyMaxRetained=valid(s.enemyMaxRetained,rules.maxRetained);
 s.enemyIdleTurns=valid(s.enemyIdleTurns,0);
 if(s.enemyPiles){
  for(const key of ['draw','hand','discard'] as const)s.enemyPiles[key]=Array.isArray(s.enemyPiles[key])?s.enemyPiles[key]:[];
  // Old snapshots can have overfull hands. Move overflow, never delete it or recreate a deck.
  s.enemyPiles.discard.push(...s.enemyPiles.hand.splice(s.enemyHandSize));
  s.enemyHandAges=s.enemyPiles.hand.map((_,i)=>valid(s.enemyHandAges?.[i],0));
  s.enemy.handCount=s.enemyPiles.hand.length;
 }
}
/** Draw a fixed count into remaining slots; retained copies are already in the real hand. */
export function drawEnemyHand(s:GameState):void{
 initializeEnemyHand(s);const p=s.enemyPiles;if(!p)return;
 const count=Math.min(s.enemyDrawPerTurn!,Math.max(0,s.enemyHandSize!-p.hand.length));
 for(let i=0;i<count;i++){
  if(!p.draw.length){p.draw=[...p.discard].reverse();p.discard=[];}
  const id=p.draw.shift();if(id===undefined)break;
  p.hand.push(id);s.enemyHandAges!.push(0);
 }
 if(s.enemy)s.enemy.handCount=p.hand.length;
}
/** Consume exactly one physical copy before traps/effects; a cancelled card still paid its cost. */
export function consumeEnemyCard(s:GameState,index:number):boolean{
 const p=s.enemyPiles,c=p&&enemyCardById(p.hand[index]);
 if(!p||!c||index<0||index>=p.hand.length||(s.enemyEnergy??0)<c.energyCost)return false;
 s.enemyEnergy=(s.enemyEnergy??0)-c.energyCost;
 p.discard.push(p.hand.splice(index,1)[0]);s.enemyHandAges?.splice(index,1);
 if(s.enemy){s.enemy.energy=s.enemyEnergy;s.enemy.handCount=p.hand.length;}
 return true;
}
/** Age belongs to a hand position/copy, never to a card definition. Bounded retention frees draw slots. */
export function finishEnemyHand(s:GameState,played:number):void{
 initializeEnemyHand(s);const p=s.enemyPiles;if(!p)return;
 const rank=p.hand.map((id,i)=>{
  const c=enemyCardById(id),age=(s.enemyHandAges?.[i]??0)+1;
  const missing=s.enemy?s.enemy.maxHp-s.enemy.hp:0;
  const useful=c?Math.min(c.heal??0,missing)+(c.dmg??0)*(c.hits??1)+(c.block??0)*.5+(c.statusEffect?3:0)+(c.summonMinion?4:0):0;
  return {i,age,score:useful+(c?.heal&&missing===0?4:0)};
 }).filter(x=>x.age<MAX_ENEMY_CARD_WAIT).sort((a,b)=>b.score-a.score||a.i-b.i);
 const keep=new Set(rank.slice(0,s.enemyMaxRetained).map(x=>x.i));
 const hand:string[]=[],ages:number[]=[];
 p.hand.forEach((id,i)=>{if(keep.has(i)){hand.push(id);ages.push((s.enemyHandAges?.[i]??0)+1);}else p.discard.push(id);});
 p.hand=hand;s.enemyHandAges=ages;s.enemyIdleTurns=played?0:(s.enemyIdleTurns??0)+1;
 if(s.enemy)s.enemy.handCount=hand.length;
}
