// src/core/combat/enemyPlan.ts — which held cards the ghost plays this turn.
//
// The ghost reads only the public board (both sides' HP, block, statuses and the สวน the player
// has visibly armed), never the player's hand, draws, counters or the RNG. Cards are tried in a
// fixed phase order — buffs on itself, debuffs on the player, attacks, then block and healing —
// so a buff lands before the hits it boosts. Every affordable subset in that order is scored.
//
// Night-1 AI (15 Oct 2026, docs/ghosts/NIGHT1-DESIGN.md "AI ผี"):
// 1. ชาร์จ cards wait in hand until full, unless they would kill the player now.
// 2. While the player has สวน armed and their block is greater than an attack's damage, that
//    attack is not played (the design's wording: เกราะเรามากกว่าดาเมจ). An exact match still lands.
// 3. A payoff card (bonus from a status on the player) waits while its setup is still in hand
//    and was not played first this turn.
import type {Fx,GameState} from '../types';
import {enemyCardById,enemyCardCost,type EnemyCardDef} from '../pack_enemy_cards';
import {computeModifiedDamage} from './damage';
import {cardFx} from './enemyCardEffects';
import {hitsOf} from '../cards/mechanics';
import {chargeFull,chargeSteps} from './ghostMechanics';

/** Scratch board. `armed`: the player's สวน still waits for the ghost's next attack card. */
type Board=Pick<GameState,'player'|'enemy'|'blessings'>&{armed?:boolean;fight?:GameState['fight'];turn?:number};

function phase(f:Fx):number{
 if(f.dmg)return 2;
 if(f.status?.some(e=>e.to==='self'))return 0;
 if(f.status?.length)return 1;
 return 3;
}

/** The status a payoff card wants on the player, if any. */
export function payoffStatus(c:EnemyCardDef):string|undefined{
 if(c.perFoeStatus)return c.perFoeStatus.statusId;
 const w=c.conditional?.when;
 return w&&(w.kind==='enemy_has_status'||w.kind==='enemy_status_at_least')?w.statusId:undefined;
}
/** The card puts this status on the player. */
const sets=(c:EnemyCardDef,id:string)=>!!c.fx.status?.some(e=>e.to==='enemy'&&e.id===id);

const stacks=(b:Board,who:'player'|'enemy',id:string)=>(who==='enemy'?b.enemy:b.player)?.statusEffects?.find(e=>e.id===id)?.stacks??0;

/** Score one card on a scratch board and apply its effect to that board. */
function step(s:GameState,b:Board,c:EnemyCardDef,index:number,attackHits:number,unplayed:EnemyCardDef[]):number{
 const age=s.enemyHandAges?.[index];
 const f=cardFx(b as GameState,c,chargeSteps(c,age));let value=0;
 const missing=Math.max(0,b.enemy!.maxHp-b.enemy!.hp);
 // A pure heal at full health waits in hand unless it has been held a while.
 if(f.heal&&!f.dmg&&!f.status&&!c.curseCard&&missing===0&&(s.enemyHandAges?.[index]??0)<2&&(s.enemyIdleTurns??0)===0)return 0;
 const attacks=!!f.dmg&&!(c.type==='attack'&&stacks(b,'enemy','entangle'));
 const dmg=attacks?computeModifiedDamage(b as GameState,{from:'enemy',to:'player',raw:f.dmg!,source:{kind:'card',cardId:c.id}})*hitsOf(f):0;
 const lethal=attacks&&dmg-b.player.block>=b.player.hp;
 // 1. ชาร์จ: wait until full, unless it kills now (or a charged heal is needed badly).
 if(c.charge&&!chargeFull(c,age)&&!lethal&&!(f.heal&&b.enemy!.hp<b.enemy!.maxHp*.35))return 0;
 // 2. Do not feed the player's armed สวน with a hit the block swallows.
 if(attacks&&c.type==='attack'&&b.armed&&dmg<b.player.block&&!lethal)return 0;
 // 3. Hold a payoff while its setup is still in hand and the status is not on the player yet.
 const want=payoffStatus(c);
 if(want&&!lethal&&!stacks(b,'player',want)&&unplayed.some(u=>u!==c&&sets(u,want)))return 0;
 if(attacks){
  const blocked=Math.min(b.player.block,dmg),loss=Math.min(b.player.hp,dmg-blocked);
  value+=loss+blocked*.35;if(loss>=b.player.hp)value+=20;
  b.player.block-=blocked;b.player.hp-=loss;
 }
 if(c.type==='attack')b.armed=false;
 const healed=Math.min(missing,f.heal??0);
 value+=healed*(b.enemy!.hp<b.enemy!.maxHp*.4?2:.75);b.enemy!.hp+=healed;
 if(f.block){
  const danger=6+stacks(b,'player','strength')*2;
  value+=Math.max(0,Math.min(f.block,danger-b.enemy!.block))*(b.enemy!.hp<b.enemy!.maxHp*.4?1:.65);
  b.enemy!.block+=f.block;
 }
 if(c.curseCard)value+=2;
 // A minion is worth calling while the ghost's side has room for it.
 if(f.summon)value+=(s.enemyMinions?.length??0)<2?5:1;
 if(c.riposte&&!b.armed)value+=Math.min(4,(c.riposte.dmg??0)*.5);
 for(const e of f.status??[]){
  const who=e.to==='self'?'enemy':'player',existing=stacks(b,who,e.id);
  const base=e.id==='strength'?2+Math.min(3,attackHits*.4):e.id==='poison'?e.stacks*1.5:
   e.id==='regeneration'?Math.min(missing,e.stacks*2)*.6:e.id==='dodge'?3:e.id==='vulnerable'?2:
   e.id==='weakness'||e.id==='draw_reduction'||e.id==='entangle'||e.id==='fear'||e.id==='stun'?3:e.id==='dance'?1+Math.min(3,attackHits*.5):2;
  value+=base/(1+existing);
  const target=who==='enemy'?b.enemy!:b.player,list=target.statusEffects??=[];
  const old=list.find(x=>x.id===e.id);
  if(old){old.stacks=Math.min(6,(old.stacks??1)+e.stacks);old.duration=Math.max(old.duration,e.turns);}
  else list.push({id:e.id,name:'',description:'',duration:e.turns,stacks:e.stacks});
 }
 return value;
}

/** Hand indexes to play, in play order, within `budget` AP. */
export function chooseEnemyCardIndexes(s:GameState,hand:string[],budget:number):number[]{
 if(!s.enemy)return [];
 const cards=hand.map((id,i)=>({i,c:enemyCardById(id)})).filter((x):x is {i:number;c:EnemyCardDef}=>!!x.c);
 const board:Board=JSON.parse(JSON.stringify({player:s.player,enemy:s.enemy,blessings:s.blessings??[],fight:s.fight,turn:s.turn}));
 board.armed=!!s.fight?.ripostes?.length;
 // Inside a phase, cards that set a status go before the payoff cards that read it.
 const order=cards.map(x=>({...x,p:phase(cardFx(board as GameState,x.c))+(payoffStatus(x.c)?.5:0)})).sort((a,b)=>a.p-b.p||a.i-b.i);
 const attackHits=cards.reduce((n,x)=>n+(x.c.fx.dmg?hitsOf(x.c.fx):0),0);
 let best:number[]=[],score=0;
 const search=(k:number,b:Board,chosen:number[],spent:number,total:number)=>{
  if(total>score+.001){score=total;best=[...chosen];}
  for(let j=k;j<order.length;j++){
   const {i,c}=order[j],cost=enemyCardCost(c);
   if(cost+spent>budget)continue;
   const next:Board=JSON.parse(JSON.stringify(b));
   const unplayed=order.filter((o,jj)=>jj>j||(jj<j&&!chosen.includes(o.i))).map(o=>o.c);
   const utility=step(s,next,c,i,attackHits,unplayed);
   if(utility<=0)continue;
   search(j+1,next,[...chosen,i],spent+cost,total+utility);
  }
 };
 search(0,board,[],0,0);
 return best;
}

export function chooseEnemyCards(s:GameState,hand:string[],budget:number):string[]{
 return chooseEnemyCardIndexes(s,hand,budget).map(i=>hand[i]);
}
