// src/core/combat/enemyPlan.ts — which held cards the ghost plays this turn.
//
// The ghost reads only the public board (both sides' HP, block, statuses and the สวน the player
// has visibly armed), never the player's hand, draws, counters or the RNG. Cards are tried in a
// fixed phase order — buffs on itself, debuffs on the player, attacks, then block and healing —
// so a buff lands before the hits it boosts. Block moves ahead of self-block payoffs; a visible
// guard is offered the smaller ordinary hit first. Every affordable subset in that order is scored.
//
// Night-1 AI (15 Oct 2026, docs/ghosts/NIGHT1-DESIGN.md "AI ผี"):
// 1. ชาร์จ cards wait in hand until full, unless they would kill the player now.
// 2. While the player has สวน armed and their block is greater than an attack's damage, that
//    attack is not played (the design's wording: เกราะเรามากกว่าดาเมจ). An exact match still lands.
// 3. A payoff card (bonus from a status on the player) waits while its setup is still in hand
//    and was not played first this turn.
import type {CardData,Fx,GameState,MinionState} from '../types';
import {enemyCardById,enemyCardCost,type EnemyCardDef} from '../pack_enemy_cards';
import {computeModifiedDamage} from './damage';
import {cardFx} from './enemyCardEffects';
import {hitsOf} from '../cards/mechanics';
import {chargeFull,chargeSteps} from './ghostMechanics';
import {guardFor,minionDef} from './minions';
import {chargedEquipment} from '../cards/fighter';
import {MINION_RULES} from '../balance/notfm';

/** Scratch board. `armed`: the player's สวน still waits for the ghost's next attack card. */
type Board=Pick<GameState,'player'|'enemy'|'blessings'|'minions'|'enemyMinions'|'equipped'|'classId'>&{armed?:boolean;fight?:GameState['fight'];turn?:number};

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

// A status that does not stack (เปราะบาง, พันธนาการ) is stored without `stacks`: present = 1.
const stacks=(b:Board,who:'player'|'enemy',id:string)=>{const e=(who==='enemy'?b.enemy:b.player)?.statusEffects?.find(x=>x.id===id);return e?e.stacks??1:0;};

/** A bounded future-board estimate, not a simulation of unknown future draws. */
function minionValue(b:Board,m:Pick<MinionState,'hp'|'taunt'|'act'|'chargeBoost'|'turnsLeft'>,charging:boolean):number{
 const f=m.act??{},remaining=Math.min(2,m.turnsLeft??2);
 const missing=Math.max(0,b.enemy!.maxHp-b.enemy!.hp);
 const act=(f.dmg??0)*hitsOf(f)+(f.block??0)*.65+Math.min(f.heal??0,missing)*.75+
  (f.status?.reduce((n,e)=>n+e.stacks*1.5,0)??0)+(f.steal??0)*3;
 return (m.taunt?m.hp*.35:0)+act*remaining+(charging?(m.chargeBoost??0)*3:0);
}

/**
 * One-time value of a ghost minion's `arrive` effect (16 Oct 2026). Counted only for the
 * incoming minion — a displaced one already arrived. Same weights as `minionValue`'s act;
 * block-strip is worth only the player's current block. Heuristic: the arrival hit is not
 * replayed on the scratch board, so it never by itself justifies a lethal line.
 */
function arrivalValue(b:Board,f?:Fx):number{
 if(!f)return 0;
 const missing=Math.max(0,b.enemy!.maxHp-b.enemy!.hp);
 return (f.dmg??0)*hitsOf(f)+(f.block??0)*.65+Math.min(f.heal??0,missing)*.75+
  (f.status?.reduce((n,e)=>n+e.stacks*1.5,0)??0)+(f.steal??0)*3+Math.min(f.breakBlock??0,b.player.block)*.8;
}

/** Marginal board value: summoning at capacity replaces the oldest minion, not an empty slot. */
export function enemySummonValue(s:GameState,id:string,charging=false):number{
 const def=minionDef(id);if(!def||!s.enemy)return 0;
 const b=s as Board,list=b.enemyMinions??[];
 const incoming={...def,turnsLeft:def.turns};
 return minionValue(b,incoming,charging)+arrivalValue(b,def.arrive)-(list.length>=MINION_RULES.enemySlots?minionValue(b,list[0],charging):0);
}

/** Mirror useCharge on visible equipment only; never read/write the player's exhaust pile. */
function spendEquipmentCharge(b:Board,c:CardData):void{
 c.chargesLeft=(c.chargesLeft??c.charges??1)-1;
 if(c.chargesLeft<=0)b.equipped=(b.equipped??[]).filter(e=>e!==c);
}

/** Apply each hit to visible guard/block/HP. No events or hidden player cards are read. */
function attack(b:Board,c:EnemyCardDef,f:Fx):{value:number;loss:number}{
 const hpBefore=b.player.hp;let value=0;
 const guard=guardFor(b as GameState);
 if(guard&&b.fight)b.fight.guardTurn=b.fight.ghostTurns;
 const hitMinion=(m:MinionState,dmg:number)=>{const loss=Math.min(m.hp,dmg);m.hp-=loss;value+=loss*.65;};
 for(let h=0;h<hitsOf(f)&&b.player.hp>0;h++){
  const dmg=computeModifiedDamage(b as GameState,{from:'enemy',to:'player',raw:f.dmg!,source:{kind:'card',cardId:c.id}});
  if(guard&&guard.hp>0)hitMinion(guard,dmg);
  else{
   // Runtime applies the cap before dodge, then block, then the one-use death save.
   let playerDamage=dmg;
   const cap=chargedEquipment(b as GameState,'damageCap');
   if(cap&&playerDamage>cap.equip!.damageCap!.over){playerDamage=cap.equip!.damageCap!.to;spendEquipmentCharge(b,cap);}
   const dodge=b.player.statusEffects?.find(e=>e.id==='dodge');
   if(playerDamage>0&&dodge){dodge.stacks=(dodge.stacks??1)-1;if(dodge.stacks<=0)b.player.statusEffects=b.player.statusEffects!.filter(e=>e!==dodge);value+=.5;}
   else{const before=b.player.hp,blocked=Math.min(b.player.block,playerDamage);
    b.player.block-=blocked;b.player.hp=Math.max(0,b.player.hp-(playerDamage-blocked));
    if(before>0&&b.player.hp<=0){
     const save=chargedEquipment(b as GameState,'deathSave');
     if(save){b.player.hp=save.equip!.deathSave!.hp;b.player.block+=save.equip!.deathSave!.block;spendEquipmentCharge(b,save);}
    }
    value+=Math.max(0,before-b.player.hp)+blocked*.35;
   }
  }
  if(f.sweep)for(const m of b.minions??[])if(m.hp>0)hitMinion(m,dmg);
  b.minions=(b.minions??[]).filter(m=>m.hp>0);
 }
 if(b.player.hp<=0)value+=20;
 return {value,loss:Math.max(0,hpBefore-b.player.hp)};
}

/** Score one card on a scratch board and apply its effect to that board. */
function step(s:GameState,b:Board,c:EnemyCardDef,index:number,attackHits:number,unplayed:EnemyCardDef[]):number{
 if(c.type==='attack'&&stacks(b,'enemy','entangle'))return 0;
 const age=s.enemyHandAges?.[index];
 const f=cardFx(b as GameState,c,chargeSteps(c,age));let value=0;
 // ทำลายเกราะ lands before the hit, so the hit is scored against what is left.
 if(f.breakBlock){const gone=Math.min(f.breakBlock,b.player.block);value+=gone*.6;b.player.block-=gone;}
 const missing=Math.max(0,b.enemy!.maxHp-b.enemy!.hp);
 // A pure heal at full health waits in hand unless it has been held a while.
 if(f.heal&&!f.dmg&&!f.status&&!c.curseCard&&missing===0&&(s.enemyHandAges?.[index]??0)<2&&(s.enemyIdleTurns??0)===0)return 0;
 const attacks=!!f.dmg;
 const dmg=attacks?computeModifiedDamage(b as GameState,{from:'enemy',to:'player',raw:f.dmg!,source:{kind:'card',cardId:c.id}})*hitsOf(f):0;
 const preview:Board=JSON.parse(JSON.stringify(b));
 const outcome=attacks?attack(preview,c,f):{value:0,loss:0};
 const lethal=attacks&&preview.player.hp<=0;
 // 1. ชาร์จ: wait until full, unless it kills now (or a charged heal is needed badly).
 if(c.charge&&!chargeFull(c,age)&&!lethal&&!(f.heal&&b.enemy!.hp<b.enemy!.maxHp*.35))return 0;
 // 2. Do not feed the player's armed สวน with a hit the block swallows.
 if(attacks&&c.type==='attack'&&b.armed&&dmg<b.player.block&&!lethal)return 0;
 // 3. Hold a payoff while its setup is still in hand and the status is not on the player yet.
 const want=payoffStatus(c);
 if(want&&!lethal&&!stacks(b,'player',want)&&unplayed.some(u=>u!==c&&sets(u,want)))return 0;
 if(attacks){value+=outcome.value;b.player=preview.player;b.minions=preview.minions;b.fight=preview.fight;b.equipped=preview.equipped;}
 // Drain only heals damage that reached the player, never damage absorbed by a guard or block.
 const drained=f.drain?Math.min(missing,outcome.loss):0;
 value+=drained*(b.enemy!.hp<b.enemy!.maxHp*.4?2:.75);b.enemy!.hp+=drained;
 if(c.type==='attack')b.armed=false;
 const healed=Math.min(Math.max(0,b.enemy!.maxHp-b.enemy!.hp),f.heal??0);
 value+=healed*(b.enemy!.hp<b.enemy!.maxHp*.4?2:.75);b.enemy!.hp+=healed;
 if(f.block){
  const danger=6+stacks(b,'player','strength')*2;
  value+=Math.max(0,Math.min(f.block,danger-b.enemy!.block))*(b.enemy!.hp<b.enemy!.maxHp*.4?1:.65);
  b.enemy!.block+=f.block;
 }
 if(c.curseCard)value+=2;
 if(f.steal)value+=3*f.steal;
 // Update scratch slots so two summons cannot both claim the same vacancy.
 if(f.summon){
  value+=enemySummonValue(b as GameState,f.summon,unplayed.some(u=>!!u.charge));
  const def=minionDef(f.summon);
  if(def){const list=b.enemyMinions??=[];if(list.length>=MINION_RULES.enemySlots)list.shift();
   list.push({...def,uid:'plan:'+index,maxHp:def.hp,side:'enemy',passive:def.passive??{triggers:[]},turnsLeft:def.turns});}
 }
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
 const board:Board=JSON.parse(JSON.stringify({player:s.player,enemy:s.enemy,blessings:s.blessings??[],fight:s.fight,turn:s.turn,minions:s.minions,enemyMinions:s.enemyMinions,equipped:s.equipped,classId:s.classId}));
 board.armed=!!s.fight?.ripostes?.length;
 // Inside a phase, cards that set a status go before the payoff cards that read it.
 const blockPayoff=cards.some(x=>x.c.conditional?.when.kind==='player_block_at_least');
 const guarded=!!guardFor(board as GameState);
 const order=cards.map(x=>{const f=cardFx(board as GameState,x.c);
  return {...x,p:(blockPayoff&&f.block&&!f.dmg?1:phase(f))+(payoffStatus(x.c)?.5:0),damage:(f.dmg??0)*hitsOf(f)};
 }).sort((a,b)=>a.p-b.p||(guarded&&a.p===2?a.damage-b.damage:0)||a.i-b.i);
 const attackHits=cards.reduce((n,x)=>n+(x.c.fx.dmg?hitsOf(x.c.fx):0),0);
 let best:number[]=[],score=0;
 const search=(k:number,b:Board,chosen:number[],spent:number,total:number)=>{
  if(total>score+.001){score=total;best=[...chosen];}
  if(b.player.hp<=0)return;
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
