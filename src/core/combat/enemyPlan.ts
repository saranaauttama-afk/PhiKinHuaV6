import type {GameState} from '../types';
import {enemyCardById} from '../pack_enemy_cards';
import {computeModifiedDamage} from './damage';

/** Small-hand exhaustive selection. Spend the real budget; never read player hand/draw. */
export function chooseEnemyCards(s:GameState,hand:string[],budget:number):string[]{
 const enemy=s.enemy!;
 const round=s.turn??1;
 const preparing=round%3===1;
 const value=(ids:string[])=>{
  let attack=0,defense=0,special=0;
  for(const id of ids){const c=enemyCardById(id)!;
   if(c.dmg)attack+=(c.hits??1)*computeModifiedDamage(s,{from:'enemy',to:'player',raw:c.dmg??0,source:{kind:'card',cardId:id}});
   defense+=c.block??0;
   if(c.summonMinion)special+=(s.minions??[]).filter(m=>m.owner==='enemy').length>=3?1:6;
   if(c.curseCard)special+=4;
   special+=Math.min(c.heal??0,enemy.maxHp-enemy.hp)*.8;
   if(c.statusEffect){const e=c.statusEffect,who=e.target==='enemy'?enemy:s.player;
    const existing=who.statusEffects?.find(x=>x.id===e.effect);
    special+=e.effect==='strength'?(preparing?7:3):e.effect==='poison'?4:e.effect==='dodge'?(preparing?6:3):3;
    if(existing&&(existing.stacks??1)>=4)special-=3;
   }
  }
  // A shield survives into the next player turn. Extra guards have diminishing value.
  const defenseValue=Math.min(defense,enemy.hp<enemy.maxHp*.4?14:8)*(preparing?1:.55);
  return attack+defenseValue+special+ids.length*.5;
 };
 let best:string[]=[],score=-Infinity,spent=-1;
 const walk=(i:number,ids:string[],cost:number)=>{
  if(i===hand.length){const v=value(ids);if(v>score||(v===score&&cost>spent)){best=[...ids];score=v;spent=cost}return;}
  walk(i+1,ids,cost);
  const c=enemyCardById(hand[i]);if(c&&cost+c.energyCost<=budget)walk(i+1,[...ids,c.id],cost+c.energyCost);
 };
 walk(0,[],0);
 // Apply defensive/status setup before attacks, but strength is telegraphed after attacks
 // and remains visible for the next round rather than a surprise mid-turn burst.
 return best.map((id,i)=>({id,i,rank:enemyCardById(id)?.statusEffect?.effect==='strength'?2:enemyCardById(id)?.type==='skill'?0:1})).sort((a,b)=>a.rank-b.rank||a.i-b.i).map(x=>x.id);
}
