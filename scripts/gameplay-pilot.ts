/** Same seed/route/preparation for both policies; tactical decisions use public board only. */
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng,int} from '../src/core/rng';
import {effectiveCost,withConditional,conditionMet} from '../src/core/cards/mechanics';
import {canPlayAttackCards} from '../src/core/statusEffectsRuntime';
import {combosForClass} from '../src/core/combat/combos';
import type {ClassId} from '../src/core/classes';
import type {GameState,Command,CardData} from '../src/core/types';

export function choosePilotCard(s:GameState,tactical:boolean,decisionSeed:string):number{
 const playable=s.piles.hand.map((c,i)=>({c,i})).filter(({c})=>c.type!=='curse'&&effectiveCost(s,c)<=s.player.energy&&(c.type!=='attack'||canPlayAttackCards(s)));
 if(!playable.length)return -1;
 if(!tactical)return playable[int(makeRng(decisionSeed),0,playable.length-1).value].i;
 // Expected pressure from the visible budget/strength, never hidden intent/hand/draw.
 const strength=s.enemy?.statusEffects?.find(e=>e.id==='strength')?.stacks??0;
 const threat=(s.enemy?.maxEnergy??2)*4.5+strength*2;
 const guardNeed=Math.max(0,threat-s.player.block);
 const low=s.player.hp<s.player.maxHp*.4;
 const score=(card:CardData)=>{
  const c=withConditional(s,card);
  let v=Math.max(0,(c.dmg??0)*(c.hits??1)-(s.enemy?.block??0)*.45)*1.2;
  v+=Math.min(c.block??0,guardNeed)*(low?1.15:.6);
  v+=Math.min(c.heal??0,s.player.maxHp-s.player.hp)*.8;
  v+=(c.energyGain??0)*5+(c.draw??0)*1.8;
  v+=c.summonMinion?7:0;
  if(c.statusEffect){const e=c.statusEffect;v+=e.effect==='poison'?e.value*2.2:e.effect==='strength'?e.value*4:e.effect==='weakness'?4:e.effect==='regeneration'?Math.min(6,s.player.maxHp-s.player.hp)*.7:3;}
  if(c.cleanseDebuffs)v+=(s.player.statusEffects??[]).filter(e=>e.id==='poison'||e.id==='weakness').length*4;
  // Recognize a setup that unlocks a visible affordable followup.
  for(const follow of s.piles.hand){if(follow===card||effectiveCost(s,follow)+effectiveCost(s,card)>s.player.energy)continue;
   const cond=follow.conditional;
   if(cond&&!conditionMet(s,cond.when,follow)){
    if(cond.when.kind==='player_block_at_least'&&(c.block??0)+s.player.block>=cond.when.value)v+=(cond.bonus.dmg??0)*.9;
    if(cond.when.kind==='enemy_has_status'&&c.statusEffect?.target==='enemy'&&c.statusEffect.effect===cond.when.statusId)v+=((cond.bonus.dmg??0)+(cond.bonus.block??0)+(cond.bonus.draw??0)*2)*.8;
   }
  }
  for(const combo of combosForClass(s.classId??'shaman').filter(x=>x.ordered&&!s.combo?.done.includes(x.id))){
   const p=s.combo?.progress.find(x=>x.comboId===combo.id)?.cardsPlayed??[];
   if(combo.requiredCards?.[p.length]===card.id)v+=p.length?4:1;
  }
  return v/Math.max(1,effectiveCost(s,card));
 };
 return playable.map(({c,i})=>({i,v:score(c)})).sort((a,b)=>b.v-a.v||a.i-b.i)[0].i;
}

export function simulateChapter(seed:string,cls:ClassId,tactical:boolean,prepare=true){
 let state=baseNewState(seed),rng=makeRng(seed),turns=0,enemyCards=0,enemyTurns=0,combos=0;
 const go=(cmd:Command)=>{const result=applyCommand(state,cmd,rng);state=result.state;rng=result.rng;};
 go({type:'NewRun',seed,classId:cls,runMode:'episode'});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});
 const route=int(makeRng(seed),0,3).value;
 for(let fight=0;fight<3;fight++){
  go({type:'ChooseOffer',index:fight===2?0:(route>>fight)&1});
  for(let t=0;state.phase==='combat'&&t<35;t++){
   for(let play=0;state.phase==='combat'&&play<24;play++){
    const i=choosePilotCard(state,tactical,`${seed}:${fight}:${t}:${play}`);if(i<0)break;
    const old=state.combo?.done.length??0;go({type:'PlayCard',index:i});combos+=(state.combo?.done.length??0)-old;
   }
   if(state.phase!=='combat')break;
   while(state.piles.hand.length>state.player.maxHandSize){
    // Both policies use the same discard rule, preserving known setup pieces.
    const ranked=state.piles.hand.map((c,i)=>({i,v:(c.dmg??0)+(c.block??0)+(c.statusEffect?8:0)+(c.conditional?8:0)})).sort((a,b)=>a.v-b.v);
    go({type:'DiscardCard',index:ranked[0].i});
   }
   go({type:'ResolveEnemyTurn'});enemyCards+=(state.pendingEvents??[]).filter(e=>e.t==='EnemyCardRevealed').length;enemyTurns++;turns++;
   if(state.phase==='combat')go({type:'StartPlayerTurn'});
  }
  if(state.phase==='levelup'){
   const choice=state.levelUp?.choice;
   if(prepare&&choice){const priority=(k:string)=>k==='max_energy'?10:k==='upgrade'?8:k==='max_hp'?7:1;const option=priority(choice.optionA)>=priority(choice.optionB)?'A':'B';const i=state.masterDeck.findIndex(c=>c.conditional&&!c.upgraded);go({type:'ChooseLevelUpOption',option,index:Math.max(0,i)});}else go({type:'SkipLevelUp'});
  }
  if(state.phase==='reward')go({type:'ChooseCardReward',index:0});
  if(state.phase!=='victory')break;
  go({type:'CompleteNode'});
  if(fight===0){go({type:'ChooseOffer',index:0});go({type:'ChooseEventOption',index:0});go({type:'CompleteNode'});go({type:'Proceed'});}
  if(fight===1){go({type:'ChooseOffer',index:0});go({type:'UseHealingShrine'});go({type:'CompleteNode'});
   if(prepare){go({type:'ChooseOffer',index:1});const i=state.masterDeck.findIndex(c=>c.conditional&&!c.upgraded);if(i>=0)go({type:'ShopUpgradeBuy',index:i});go({type:'CompleteNode'});go({type:'ChooseOffer',index:2});go({type:'ChooseEventOption',index:0});go({type:'CompleteNode'});}
   go({type:'Proceed'});
  }
 }
 return {won:!!state.runSummary?.won,hp:state.player.hp,turns,enemyCards,enemyTurns,combos,fights:state.fightCount??0};
}
if(process.argv.includes('--report')){
 const savedLog=console.log;console.log=()=>{};
 const rows=[];
 for(const cls of ['warrior','shaman','nun','medium'] as const)for(const tactical of [false,true]){
  const runs=Array.from({length:40},(_,i)=>simulateChapter(`${process.env.PILOT_SEED_PREFIX??'accept'}-${cls}-${i}`,cls,tactical));
  rows.push({class:cls,policy:tactical?'public-board':'random-affordable',wins:runs.filter(r=>r.won).length,runs:runs.length,meanHp:+(runs.reduce((a,r)=>a+r.hp,0)/runs.length).toFixed(1),meanTurns:+(runs.reduce((a,r)=>a+r.turns,0)/runs.length).toFixed(1),cardsPerEnemyTurn:+(runs.reduce((a,r)=>a+r.enemyCards,0)/Math.max(1,runs.reduce((a,r)=>a+r.enemyTurns,0))).toFixed(2),meanCombos:+(runs.reduce((a,r)=>a+r.combos,0)/runs.length).toFixed(2)});
 }
 savedLog(JSON.stringify(rows,null,2));
}
