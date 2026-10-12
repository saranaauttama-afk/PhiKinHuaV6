import type {GameState} from '../types';
import {enemyCardById,type EnemyCardDef} from '../pack_enemy_cards';
import {computeModifiedDamage} from './damage';
import {enemyConditionalDamage} from './enemyCardEffects';

/** Small ordered search over the real hand. The scratch board deliberately excludes player cards,
 * future draws, traps, RNG and progression. Ordinary visible statuses drive all interactions. */
export function chooseEnemyCardIndexes(s:GameState,hand:string[],budget:number):number[]{
 if(!s.enemy)return [];
 const publicBoard=JSON.parse(JSON.stringify({player:s.player,enemy:s.enemy,minions:s.minions??[],blessings:s.blessings??[]})) as GameState;
 const stacks=(b:GameState,who:'player'|'enemy',id:string)=>(who==='enemy'?b.enemy:b.player)?.statusEffects?.find(e=>e.id===id)?.stacks??0;
 const update=(b:GameState,c:EnemyCardDef)=>{
  const e=c.statusEffect;if(!e)return;
  const target=e.target==='enemy'?b.enemy!:b.player;
  const list=target.statusEffects??=[];
  const old=list.find(x=>x.id===e.effect);
  if(old){old.stacks=Math.min(6,(old.stacks??0)+e.value);old.duration=Math.max(old.duration,e.duration);}
  else list.push({id:e.effect,name:'',description:'',duration:e.duration,stacks:e.value});
 };
 const step=(b:GameState,c:EnemyCardDef,index:number,remaining:number)=>{
  let value=0;
  if(c.heal&&!c.dmg&&!c.summonMinion&&!c.curseCard&&!c.statusEffect&&b.enemy!.hp===b.enemy!.maxHp&&(s.enemyHandAges?.[index]??0)<2&&(s.enemyIdleTurns??0)===0)return 0;
  const raw=(c.dmg??0)+enemyConditionalDamage(b,c);
  if(raw&&!(c.type==='attack'&&stacks(b,'enemy','entangle'))){
   const dmg=computeModifiedDamage(b,{from:'enemy',to:'player',raw,source:{kind:'card',cardId:c.id}})*(c.hits??1);
   const blocked=Math.min(b.player.block,dmg),loss=Math.min(b.player.hp,dmg-blocked);
   value+=loss+blocked*.35;if(loss>=b.player.hp)value+=20;
   b.player.block-=blocked;b.player.hp-=loss;
   // A fresh multi-hit can wait briefly for a buff already held. Age/idle pressure prevents a loop.
   const setup=hand.map(enemyCardById).find(x=>x?.statusEffect?.target==='enemy'&&x.statusEffect.effect==='strength');
   if((c.hits??1)>1&&!stacks(b,'enemy','strength')&&setup&&c.energyCost+setup.energyCost>remaining&&
      (s.enemyHandAges?.[index]??0)<2&&(s.enemyIdleTurns??0)===0)value*=.4;
  }
  const missing=Math.max(0,b.enemy!.maxHp-b.enemy!.hp),healed=Math.min(missing,c.heal??0);
  value+=healed*(b.enemy!.hp<b.enemy!.maxHp*.4?2:.75);b.enemy!.hp+=healed;
  if(c.block){const danger=6+stacks(b,'player','strength')*2+(b.minions??[]).filter(m=>m.owner==='player').length*2;
   value+=Math.max(0,Math.min(c.block,danger-b.enemy!.block))*(b.enemy!.hp<b.enemy!.maxHp*.4?1:.65);b.enemy!.block+=c.block;}
  if(c.summonMinion){value+=(b.minions??[]).filter(m=>m.owner==='enemy').length>=2?0:4;b.minions!.push({owner:'enemy'} as any);}
  if(c.curseCard)value+=2;
  if(c.statusEffect){
   const e=c.statusEffect,existing=stacks(b,e.target,e.effect);
   const attackHits=hand.reduce((n,id)=>n+(enemyCardById(id)?.dmg?(enemyCardById(id)?.hits??1):0),0);
   const base=e.effect==='strength'?2+Math.min(3,attackHits*.4):e.effect==='poison'?e.value*1.5:
    e.effect==='regeneration'?Math.min(missing,e.value*2)*.6:e.effect==='dodge'?3:e.effect==='vulnerable'?2:
    e.effect==='weakness'||e.effect==='draw_reduction'||e.effect==='entangle'?3:2;
   value+=base/(1+existing);update(b,c);
  }
  return value;
 };
 let best:number[]=[],score=0;
 const search=(board:GameState,chosen:number[],spent:number,total:number)=>{
  if(total>score+.001){score=total;best=[...chosen];}
  for(let i=0;i<hand.length;i++){
   if(chosen.includes(i))continue;
   const c=enemyCardById(hand[i]);if(!c||c.energyCost+spent>budget)continue;
   const next=JSON.parse(JSON.stringify(board)) as GameState;
   const utility=step(next,c,i,budget-spent);
   // Full-health heals with no other benefit are saved; attacks blocked by entangle are not wasted.
   if(utility<=0)continue;
   search(next,[...chosen,i],spent+c.energyCost,total+utility);
  }
 };
 search(publicBoard,[],0,0);
 return best;
}

export function chooseEnemyCards(s:GameState,hand:string[],budget:number):string[]{
 return chooseEnemyCardIndexes(s,hand,budget).map(i=>hand[i]);
}
