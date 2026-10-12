// scripts/pilot.ts — automated player for balance runs.
//
// Plays one full three-night run with real commands only (no QA card, no state edits),
// deciding from the public board: visible hand, energy, enemy HP/block/statuses.
// Every fight is recorded, including the one that ends the run.
import {requiredDiscards} from '../src/core/cards/hand';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng,int,type RNG} from '../src/core/rng';
import {cardsPlayedThisTurn,effectiveCost,withConditional,conditionMet} from '../src/core/cards/mechanics';
import {canPlayAttackCards} from '../src/core/statusEffectsRuntime';
import {isCriticalOffer} from '../src/core/map/adventure';
import type {ClassId} from '../src/core/classes';
import type {Difficulty} from '../src/core/campaign/threeNight';
import type {Command,CardData,GameState} from '../src/core/types';

export type FightKind='normal'|'elite'|'boss';
export type FightRecord={night:number;index:number;enemyId:string;kind:FightKind;turns:number;hpBefore:number;hpAfter:number;maxHp:number;won:boolean};
export type RunRecord={seed:string;classId:ClassId;difficulty:Difficulty;won:boolean;stalled:boolean;nightReached:number;fights:FightRecord[];deck:number;level:number;gold:number;turns:number;plays:number};

/** Rough value per energy, used for rewards, removal and forced discards. */
export const cardValue=(c:CardData)=>((c.dmg??0)*(c.hits??1)+(c.block??0)*.6+(c.draw??0)*4+(c.energyGain??0)*5+(c.heal??0)*.6+(c.statusEffect?6:0)+(c.conditional?7:0))/Math.max(1,c.cost);

/** Highest-scoring affordable card, judged from what a player can see. -1 = end turn. */
export function choosePilotCard(s:GameState,tactical:boolean,decisionSeed:string):number{
 const playable=s.piles.hand.map((c,i)=>({c,i})).filter(({c})=>c.type!=='curse'&&effectiveCost(s,c)<=s.player.energy&&(c.type!=='attack'||canPlayAttackCards(s)));
 if(!playable.length)return -1;
 if(!tactical)return playable[int(makeRng(decisionSeed),0,playable.length-1).value].i;
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
  if(c.statusEffect){const e=c.statusEffect;v+=e.effect==='poison'?e.value*2.2:e.effect==='strength'?e.value*4:e.effect==='weakness'?4:e.effect==='regeneration'?Math.min(6,s.player.maxHp-s.player.hp)*.7:3;}
  if(c.cleanseDebuffs)v+=(s.player.statusEffects??[]).filter(e=>e.id==='poison'||e.id==='weakness').length*4;
  for(const follow of s.piles.hand){
   if(follow===card||effectiveCost(s,follow)+effectiveCost(s,card)>s.player.energy)continue;
   const cond=follow.conditional;
   if(cond&&!conditionMet(s,cond.when,follow)){
    if(cond.when.kind==='player_block_at_least'&&(c.block??0)+s.player.block>=cond.when.value)v+=(cond.bonus.dmg??0)*.9;
    if(cond.when.kind==='enemy_has_status'&&c.statusEffect?.target==='enemy'&&c.statusEffect.effect===cond.when.statusId)v+=((cond.bonus.dmg??0)+(cond.bonus.block??0)+(cond.bonus.draw??0)*2)*.8;
   }
  }
  return v/Math.max(1,effectiveCost(s,card));
 };
 return playable.map(({c,i})=>({i,v:score(c)})).sort((a,b)=>b.v-a.v||a.i-b.i)[0].i;
}

function activeOffer(s:GameState){const ix=s.pages?._activeOfferIndex;return ix!=null?s.pages?.current?.offers[ix]:undefined;}
function fightKind(s:GameState):FightKind{const o=activeOffer(s);return o?.kind==='boss'?'boss':o?.kind==='monster'&&o.tier==='elite'?'elite':'normal';}

export function playRun(seed:string,classId:ClassId,difficulty:Difficulty,opts:{tactical?:boolean;observe?:(s:GameState,r:RNG)=>void}={}):RunRecord{
 const tactical=opts.tactical??true;
 let s=baseNewState(seed),r=makeRng(seed),steps=0,stalled=false;
 const fights:FightRecord[]=[];let open:FightRecord|undefined;
 const go=(cmd:Command)=>{
  const before=s.phase;
  const out=applyCommand(s,cmd,r);s=out.state;r=out.rng;steps++;
  if(before!=='combat'&&s.phase==='combat'&&s.enemy){
   open={night:s.campaign?.night??1,index:(s.fightCount??0)+1,enemyId:s.enemy.id,kind:fightKind(s),turns:0,hpBefore:s.player.hp,hpAfter:s.player.hp,maxHp:s.player.maxHp,won:false};
  }
  if(open&&before==='combat'&&s.phase!=='combat'){
   open.turns=s.turn;open.hpAfter=s.player.hp;open.won=s.player.hp>0&&s.phase!=='defeat'&&!(s.runSummary&&!s.runSummary.won);
   fights.push(open);open=undefined;
  }
  opts.observe?.(s,r);
 };
 go({type:'NewRun',seed,classId,difficulty});
 while(!s.runSummary&&steps<9000){
  if(s.chapter){go({type:'SkipChapter'});continue;}
  if(s.phase==='starter'){const i=s.starter!.choices.findIndex(b=>b.id==='spirit_energy'||b.id==='herbal_wisdom'||b.id==='bamboo_dart_power');go({type:'ChooseStarterBlessing',index:Math.max(0,i)});continue;}
  if(s.phase==='combat'){
   for(let plays=0;s.phase==='combat'&&plays<32;plays++){
    const i=choosePilotCard(s,tactical,`${seed}:decision:${steps}`);if(i<0)break;
    const before=cardsPlayedThisTurn(s);go({type:'PlayCard',index:i});
    if(s.phase==='combat'&&cardsPlayedThisTurn(s)===before){stalled=true;break;}
   }
   if(s.phase!=='combat')continue;
   while(requiredDiscards(s)>0){const rank=s.piles.hand.map((c,i)=>({i,v:cardValue(c)})).sort((a,b)=>a.v-b.v);go({type:'DiscardCard',index:rank[0].i});}
   go({type:'ResolveEnemyTurn'});
   if(s.phase==='combat')go({type:'StartPlayerTurn'});
   if(s.turn>60){stalled=true;break;}
   continue;
  }
  if(s.phase==='levelup'){
   const choice=s.levelUp?.choice;
   if(!choice){go(s.levelUp?.dawnHandChoice?{type:'ChooseLevelUpOption',option:'A'}:{type:'SkipLevelUp'});continue;}
   const priority=(k:string)=>k==='max_energy'?12:k==='draw_per_turn'?10:k==='max_hand'?9:k==='upgrade'?8:k==='blessing'?7:k==='max_hp'?6:k==='remove'?5:1;
   const option=priority(choice.optionA)>=priority(choice.optionB)?'A':'B';const kind=option==='A'?choice.optionA:choice.optionB;
   const ranked=s.masterDeck.map((c,i)=>({i,v:cardValue(c),u:c.upgradeLevel??0})).sort((a,b)=>kind==='remove'?a.v-b.v:b.v-a.v);
   const index=kind==='blessing'?0:ranked.find(x=>kind!=='upgrade'||x.u<3)?.i??0;
   go({type:'ChooseLevelUpOption',option,index});continue;
  }
  if(s.phase==='reward'){
   const ranked=(s.cardReward?.choices??[]).map((c,i)=>({i,c,v:cardValue(c)})).sort((a,b)=>b.v-a.v);
   const best=ranked[0];const pick=best&&(s.masterDeck.length<14||best.v>=15)&&!s.masterDeck.some(c=>c.id===best.c.id);
   go(pick?{type:'ChooseCardReward',index:best.i}:{type:'SkipCardReward'});continue;
  }
  if(s.phase==='victory'){go({type:'CompleteNode'});continue;}
  if(s.phase==='map'&&s.pages?.adventure){
   const p=s.pages.current!,a=s.pages.adventure,offers=p.offers;
   const open=(i:number)=>!!offers[i]&&!p.resolved[i];
   const prep=offers.findIndex((o,i)=>open(i)&&!a.usedIds.includes(a.slotIds[i]!)&&(o.kind==='treasure'||o.kind==='treasure_single'||o.kind==='story_event'||
    o.kind==='well'&&s.player.hp<s.player.maxHp-5||o.kind==='healing_shrine'&&s.player.hp<s.player.maxHp*.75||o.kind==='shop_card'&&s.player.gold>=40||
    o.kind==='shop_upgrade'&&s.player.gold>=40||o.kind==='shop_remove'&&s.masterDeck.length>8&&s.player.gold>=40));
   const ix=prep>=0?prep:offers.findIndex((o,i)=>open(i)&&isCriticalOffer(o));
   const other=offers.findIndex((_,i)=>open(i));
   if(ix<0&&other<0){stalled=true;break;}
   go(ix>=0?{type:'ChooseOffer',index:ix}:offers[other]?.kind==='next_event'?{type:'ChooseOffer',index:other}:{type:'DeleteShopFromMap',index:other});
   continue;
  }
  if(s.phase==='shop'&&s.pages?.adventure){
   const slot=s.pages._activeOfferIndex;
   if(s.shopKind==='well')go({type:'UseWell'});
   if(s.shopKind==='healing')go({type:'UseHealingShrine'});
   if((s.shopKind==='treasure'||s.shopKind==='treasure_single')&&s.shopStock?.length)go({type:s.shopKind==='treasure'?'TakeTreasureCard':'TakeSingleTreasureCard',index:0});
   if(s.shopKind==='upgrade'){const rank=s.masterDeck.map((c,i)=>({i,v:cardValue(c),u:c.upgradeLevel??0})).filter(x=>x.u<3).sort((a,b)=>b.v-a.v);if(rank[0])go({type:'ShopUpgradeBuy',index:rank[0].i});}
   if(s.shopKind==='remove'&&s.masterDeck.length>8){const rank=s.masterDeck.map((c,i)=>({i,v:cardValue(c)})).sort((a,b)=>a.v-b.v);go({type:'ShopRemoveBuy',index:rank[0].i});}
   if(s.shopKind==='card'){const rank=(s.shopStock??[]).flatMap((it,i)=>'card' in it&&it.card&&it.price<=s.player.gold?[{i,v:cardValue(it.card)}]:[]).sort((a,b)=>b.v-a.v);if(rank[0])go({type:'TakeShop',index:rank[0].i});}
   if(s.phase==='shop')go({type:'CompleteNode'});
   if(s.phase==='map'&&slot!=null&&!s.pages.current!.resolved[slot])go({type:'DeleteShopFromMap',index:slot});
   continue;
  }
  if(s.phase==='event'){go({type:'ChooseEventOption',index:0});go({type:'CompleteNode'});continue;}
  stalled=true;break;
 }
 if(!s.runSummary)stalled=true;
 return {seed,classId,difficulty,won:!!s.runSummary?.won,stalled,nightReached:s.campaign?.night??1,fights,deck:s.masterDeck.length,level:s.player.level,gold:s.player.gold,turns:s.runMetrics?.turns??0,plays:s.runMetrics?.cardsPlayed??0};
}
