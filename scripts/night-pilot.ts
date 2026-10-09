import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng,int,type RNG} from '../src/core/rng';
import {cardsPlayedThisTurn,effectiveCost} from '../src/core/cards/mechanics';
import {choosePilotCard} from './gameplay-pilot';
import {skippableSlots,isCriticalOffer} from '../src/core/map/adventure';
import {upgradeCostForCount} from '../src/core/balance/economy';
import {onRestRow} from '../src/core/map/restPage';
import type {ClassId} from '../src/core/classes';
import type {Night} from '../src/core/campaign/nights';
import type {Command,CardData,GameState} from '../src/core/types';
/** Public-board combat policy, real preparation and identical choices for both policies. */
export function simulateNight(seed:string,cls:ClassId,night:Night,tactical:boolean,observe?:(state:GameState,rng:RNG)=>void){
 let s=baseNewState(seed),r=makeRng(seed),steps=0,enemyCards=0,enemyTurns=0,stalled=false;
 const go=(cmd:Command)=>{const out=applyCommand(s,cmd,r);s=out.state;r=out.rng;steps++;observe?.(s,r);};
 const cardValue=(c:CardData)=>((c.dmg??0)*(c.hits??1)+(c.block??0)*.6+(c.draw??0)*4+(c.energyGain??0)*5+(c.heal??0)*.6+(c.summonMinion?9:0)+(c.statusEffect?6:0)+(c.conditional?7:0))/Math.max(1,c.cost);
 go({type:'NewRun',seed,classId:cls,runMode:'full',night});
 while(!s.runSummary&&steps<2200){
  if(s.chapter){go({type:'SkipChapter'});continue;}
  if(s.phase==='starter'){const i=s.starter!.choices.findIndex(b=>b.id==='spirit_energy'||b.id==='herbal_wisdom'||b.id==='bamboo_dart_power');go({type:'ChooseStarterBlessing',index:Math.max(0,i)});continue;}
  if(s.phase==='combat'){
   for(let plays=0;s.phase==='combat'&&plays<32;plays++){
    const i=choosePilotCard(s,tactical,`${seed}:decision:${steps}`);if(i<0)break;
    const before=cardsPlayedThisTurn(s);go({type:'PlayCard',index:i});
    if(s.phase==='combat'&&cardsPlayedThisTurn(s)===before){stalled=true;break;}
   }
   if(s.phase!=='combat')continue;
   while(s.piles.hand.length>s.player.maxHandSize){const rank=s.piles.hand.map((c,i)=>({i,v:cardValue(c)})).sort((a,b)=>a.v-b.v);go({type:'DiscardCard',index:rank[0].i});}
   go({type:'ResolveEnemyTurn'});enemyTurns++;enemyCards+=(s.pendingEvents??[]).filter(e=>e.t==='EnemyCardRevealed').length;
   if(s.phase==='combat')go({type:'StartPlayerTurn'});
   if(s.turn>45){stalled=true;break;}
   continue;
  }
  if(s.phase==='levelup'){
   const choice=s.levelUp?.choice;
   if(!choice){go({type:'SkipLevelUp'});continue;}
   const priority=(k:string)=>k==='max_energy'?12:k==='max_hand'?9:k==='upgrade'?8:k==='blessing'?7:k==='max_hp'?6:k==='remove'?5:1;
   const option=priority(choice.optionA)>=priority(choice.optionB)?'A':'B';const kind=option==='A'?choice.optionA:choice.optionB;
   const ranked=s.masterDeck.map((c,i)=>({i,v:cardValue(c),u:c.upgradeLevel??0})).sort((a,b)=>kind==='remove'?a.v-b.v:b.v-a.v);
   const index=kind==='blessing'?0:ranked.find(x=>kind!=='upgrade'||x.u<3)?.i??0;
   go({type:'ChooseLevelUpOption',option,index});continue;
  }
  if(s.phase==='reward'){
   const choices=s.cardReward?.choices??[];
   const ranked=choices.map((c,i)=>({i,c,v:cardValue(c)})).sort((a,b)=>b.v-a.v);
   const best=ranked[0];const pick=best&&(s.masterDeck.length<14||best.v>=15)&&!s.masterDeck.some(c=>c.id===best.c.id);
   go(pick?{type:'ChooseCardReward',index:best.i}:{type:'SkipCardReward'});continue;
  }
  if(s.phase==='victory'){go({type:'CompleteNode'});continue;}
  if(s.pages?.adventure&&s.phase==='map'){
   const offers=s.pages.current!.offers;
   const prep=offers.findIndex(o=>o&&(o.kind==='treasure'||o.kind==='story_event'||o.kind==='well'&&s.player.hp<s.player.maxHp-5||o.kind==='healing_shrine'&&s.player.hp<s.player.maxHp*.75&&s.player.gold>=25+((s as any).healingShrine?.timesUsed??0)*10||o.kind==='shop_upgrade'&&s.player.gold>=upgradeCostForCount(s.runCounters?.upgradeShopCount??0)||o.kind==='shop_card'&&s.player.gold>=80&&s.masterDeck.length<14));
   const ix=prep>=0?prep:offers.findIndex(o=>o&&isCriticalOffer(o));
   go(ix>=0?{type:'ChooseOffer',index:ix}:{type:'Proceed'});continue;
  }
  if(s.pages?.adventure&&s.phase==='shop'){
   if(s.shopKind==='well')go({type:'UseWell'});
   if(s.shopKind==='healing')go({type:'UseHealingShrine'});
   if(s.shopKind==='treasure'){go({type:'TakeTreasureCard',index:0});continue;}
   if(s.shopKind==='upgrade'){const rank=s.masterDeck.map((c,i)=>({i,v:cardValue(c),u:c.upgradeLevel??0})).filter(x=>x.u<3).sort((a,b)=>b.v-a.v);if(rank[0])go({type:'ShopUpgradeBuy',index:rank[0].i});}
   if(s.shopKind==='card'){const rank=(s.shopStock??[]).flatMap((it,i)=>'card' in it&&it.card&&it.price<=s.player.gold?[{i,v:cardValue(it.card)}]:[]).sort((a,b)=>b.v-a.v);if(rank[0])go({type:'TakeShop',index:rank[0].i});}
   const used=s.pages._shopUsed;go({type:'CompleteNode'});if(!used&&!s.runSummary)go({type:'Proceed'});continue;
  }
  if(s.pages?.adventure&&s.phase==='event'){go({type:'ChooseEventOption',index:0});go({type:'CompleteNode'});continue;}
  if(s.phase==='map'){
   if(onRestRow(s)){
    const offers=s.pages!.current!.offers;
    for(let i=0;i<offers.length&&!s.runSummary;i++){
     const offer=offers[i];if(s.pages!.current!.resolved[i])continue;
     if(!['healing_shrine','shop_upgrade','shop_remove','story_event'].includes(offer.kind))continue;
     go({type:'ChooseOffer',index:i});
     if(offer.kind==='healing_shrine')go({type:'UseHealingShrine'});
     if(offer.kind==='shop_upgrade'){const rank=s.masterDeck.map((c,i)=>({i,v:cardValue(c),u:c.upgradeLevel??0})).filter(x=>x.u<3).sort((a,b)=>b.v-a.v);if(rank[0])go({type:'ShopUpgradeBuy',index:rank[0].i});}
     if(offer.kind==='shop_remove'&&s.masterDeck.length>8){const rank=s.masterDeck.map((c,i)=>({i,v:cardValue(c)})).sort((a,b)=>a.v-b.v);go({type:'ShopRemoveBuy',index:rank[0].i});}
     if(offer.kind==='story_event')go({type:'ChooseEventOption',index:0});
     go({type:'CompleteNode'});
    }
    if(!s.runSummary)go({type:'Proceed'});
   }else{const n=s.pages!.current!.offers.length;go({type:'ChooseOffer',index:int(makeRng(seed+':route:'+s.fightCount),0,n-1).value});}
   continue;
  }
  stalled=true;break;
 }
 return {won:!!s.runSummary?.won,fights:s.fightCount??0,hp:s.player.hp,turns:s.runMetrics?.turns??0,combos:s.runMetrics?.combos??0,plays:s.runMetrics?.cardsPlayed??0,deck:s.masterDeck.length,enemyCards,enemyTurns,stalled,phase:s.phase,state:s};
}
if(process.argv.includes('--night-report')){
 const log=console.log;console.log=()=>{};const rows=[];
 for(const cls of ['warrior','shaman','nun','medium'] as const)for(const night of ([1,2,3,4,5] as const).filter(n=>!process.env.NIGHT_PILOT_NIGHTS||process.env.NIGHT_PILOT_NIGHTS.split(',').includes(String(n))))for(const tactical of [false,true]){
  const runs=Array.from({length:Number(process.env.NIGHT_PILOT_RUNS??8)},(_,i)=>simulateNight(`night-balance-${cls}-${i}`,cls,night,tactical));
  rows.push({class:cls,night,policy:tactical?'public-board':'random-affordable',runs:runs.length,wins:runs.filter(r=>r.won).length,meanFights:+(runs.reduce((n,r)=>n+r.fights,0)/runs.length).toFixed(1),meanTurns:+(runs.reduce((n,r)=>n+r.turns,0)/runs.length).toFixed(1),meanCombos:+(runs.reduce((n,r)=>n+r.combos,0)/runs.length).toFixed(1),cardsPerEnemyTurn:+(runs.reduce((n,r)=>n+r.enemyCards,0)/Math.max(1,runs.reduce((n,r)=>n+r.enemyTurns,0))).toFixed(2),stalled:runs.filter(r=>r.stalled).length});
 }
 log(JSON.stringify(rows,null,2));
}
