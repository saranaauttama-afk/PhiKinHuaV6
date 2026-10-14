import * as Fighter from '../src/core/cards/fighter';
import { addFx } from '../src/core/cards/mechanics';
import {choiceLocked,getStoryEvent} from '../src/core/events/story';
// scripts/pilot.ts — automated player for balance runs.
//
// Plays one full three-night run with real commands only (no QA card, no state edits),
// deciding from the public board: visible hand, points, mana, enemy HP/block/statuses.
// Every fight is recorded, including the one that ends the run.
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng,int,type RNG} from '../src/core/rng';
import {cardsPlayedThisTurn,conditionMet} from '../src/core/cards/mechanics';
import {cardCost,cardFx,playBlock,starFx} from '../src/core/cards/model';
import {canUpgrade,canRemoveCard} from '../src/core/engine/shared';
import {skillsFor,skillBlock,possessionCards} from '../src/core/skills';
import {cardFromEnemy} from '../src/core/cards/borrow';
import {enemyCardById} from '../src/core/pack_enemy_cards';
import {shopPrice,upgradePrice,removePrice} from '../src/core/engine/handlers/shops_events';
import {levelOffers} from '../src/core/engine/handlers/level';
import {turnEndExcess} from '../src/core/engine/handlers/combat';
import {isCriticalOffer} from '../src/core/map/adventure';
import type {ClassId} from '../src/core/classes';
import type {Difficulty} from '../src/core/campaign/threeNight';
import type {Command,CardData,Fx,GameState} from '../src/core/types';

export type FightKind='normal'|'elite'|'boss';
export type FightRecord={night:number;index:number;enemyId:string;kind:FightKind;turns:number;hpBefore:number;hpAfter:number;maxHp:number;won:boolean};
export type RunRecord={seed:string;classId:ClassId;difficulty:Difficulty;won:boolean;stalled:boolean;nightReached:number;fights:FightRecord[];deck:number;level:number;gold:number;turns:number;plays:number;
 /** Permanent upgrades bought (boon id → count) and blessings held at the end. */
 blessings?:number;goldEarned?:number;goldSpent?:number};

const fxValue=(fx:Fx)=>(fx.dmg??0)*(fx.hits??1)+(fx.block??0)*.6+(fx.draw??0)*4+(fx.mana??0)*2+(fx.heal??0)*.6+(fx.status??[]).reduce((n,e)=>n+e.stacks*2.5,0)+(fx.borrow??0)*5
 // นักมวยคาดเชือก
 +(fx.rhythm??0)*3+(fx.summon?11:0)+(fx.breakBlock??0)*.4+(fx.keepRhythm?1.5:0)+(fx.lockRhythm?5:0)+(fx.doubleNext?7:0)+(fx.sweep?2:0);
/** Rough worth per resource spent; used for rewards, shop and removal. */
export const cardValue=(c:CardData)=>{
 const fx=starFx(c);let v=fxValue(fx)+(c.conditional?fxValue(c.conditional.bonus)*.5:0)+(c.equip?8:0)+(c.counter?4:0)+(c.type==='prayer'?fxValue(fx)*.6:0)
  +(c.after?fxValue(c.after.bonus)*.5:0)+(c.heavy?4:0)+(c.riposte?fxValue(c.riposte)*.6:0)+(c.spendRhythm?(c.spendRhythm.mode==='hits'?(fx.dmg??0)*3:(c.spendRhythm.perStack??0)*3):0)+(c.repeatIf?(fx.dmg??0)*.4:0)+(c.innate?2:0)+(c.move?1.5:0);
 if(c.exhaust)v*=.8;
 return v/Math.max(1,(c.ap??0)+(c.mana??0)/2.5);
};

/** Next card to play from what a player can see, or -1 to end the turn. */
export function choosePilotCard(s:GameState,tactical:boolean,decisionSeed:string):number{
 const playable=s.piles.hand.map((c,i)=>({c,i})).filter(({c})=>!playBlock(s,c));
 if(!playable.length)return -1;
 if(!tactical)return playable[int(makeRng(decisionSeed),0,playable.length-1).value].i;
 const strength=s.enemy?.statusEffects?.find(e=>e.id==='strength')?.stacks??0;
 const rage=s.enemy?.statusEffects?.find(e=>e.id==='rage')?.stacks??0;
 const threat=((s.enemy?.maxAp??2)+1)*3.5+(strength+rage)*2;
 const guardNeed=Math.max(0,threat-s.player.block);
 const low=s.player.hp<s.player.maxHp*.4;
 const score=(card:CardData)=>{
  // Free resource builders first: mana and equipment pay off for the rest of the fight.
  if(card.type==='mana')return 100;
  if(card.type==='equipment')return 90;
  if(card.type==='counter')return 60;
  let c=cardFx(s,card);
  // นักมวย: what this attack would really do now (ต่อจาก, rhythm gained by a new move, ช้ำ eaten, rhythm spent).
  const F=Fighter;
  const rhythm=F.rhythmOf(s);
  let fighterBonus=0;
  if(card.type==='attack'){
   if(card.after&&s.turnFlags?.lastMove===card.after.move)c=addFx(c,card.after.bonus);
   const gain=F.usesRhythm(s)&&card.move&&s.fight?.lastAttackMove&&s.fight.lastAttackMove!==card.move?1:0;
   let r=Math.min(8,rhythm+gain);
   if(card.spendRhythm){if(card.spendRhythm.mode==='hits')c={...c,hits:Math.max(1,r)};else c={...c,dmg:(c.dmg??0)+r*(card.spendRhythm.perStack??0)};fighterBonus-=r*1.6;r=0;}
   fighterBonus+=r*(c.hits??1)+gain*2.5;
   const bruise=F.bruiseOn(s);
   if(card.heavy){fighterBonus+=bruise*F.heavyPerBruise(s);if(!bruise&&s.piles.hand.some(h=>h!==card&&h.type==='attack'&&!h.heavy))fighterBonus-=4;}
   if(card.spendRhythm&&rhythm<3&&s.piles.hand.length>1)fighterBonus-=6;
   if(card.repeatIf&&conditionMet(s,card.repeatIf,card))fighterBonus+=(c.dmg??0);
   if(s.turnFlags?.doubleNext)fighterBonus+=(c.dmg??0)*(c.hits??1);
  }
  let v=Math.max(0,(c.dmg??0)*(c.hits??1)+fighterBonus-(s.enemy?.block??0)*.45)*1.2;
  if(c.rhythm)v+=c.rhythm*2.5;
  if(c.keepRhythm&&!s.piles.hand.some(h=>h!==card&&h.type==='attack'))v+=rhythm*.6;
  if(c.lockRhythm)v+=3+rhythm*.5;
  if(c.doubleNext)v+=s.piles.hand.some(h=>h!==card&&h.type==='attack')?8:-5;
  if(c.summon)v+=(s.minions?.length??0)>=2?2:10;
  if(c.breakBlock)v+=Math.min(c.breakBlock,s.enemy?.block??0)*.8;
  if(card.riposte)v+=(card.riposte.dmg??0)*.55;
  v+=Math.min(c.block??0,guardNeed)*(low?1.15:.6);
  v+=Math.min(c.heal??0,s.player.maxHp-s.player.hp)*.8;
  v+=(c.draw??0)*1.8+(c.mana??0)+(c.borrow??0)*5;
  for(const e of c.status??[])v+=e.id==='poison'?e.stacks*e.turns*.8:e.id==='strength'?e.stacks*4:e.id==='regeneration'?Math.min(6,s.player.maxHp-s.player.hp)*.7:e.id==='bruise'?e.stacks*1.8:e.id==='stun'?6:3;
  if(c.cleanse)v+=(s.player.statusEffects??[]).filter(e=>e.id==='poison'||e.id==='weakness').length*4;
  if(card.type==='prayer')v*=1.4;
  for(const follow of s.piles.hand){
   const cond=follow.conditional;if(follow===card||!cond||conditionMet(s,cond.when,follow))continue;
   if(cond.when.kind==='player_block_at_least'&&(c.block??0)+s.player.block>=cond.when.value)v+=(cond.bonus.dmg??0)*.9;
   if(cond.when.kind==='enemy_has_status'&&c.status?.some(e=>e.to==='enemy'&&cond.when.kind==='enemy_has_status'&&e.id===cond.when.statusId))v+=((cond.bonus.dmg??0)+(cond.bonus.block??0))*.8;
  }
  const cost=cardCost(s,card);
  // Free cards cost nothing now; paid cards compete for this turn's points and mana.
  return v/Math.max(1,cost.ap*1.5+cost.mana/2);
 };
 return playable.map(({c,i})=>({i,v:score(c)})).sort((a,b)=>b.v-a.v||a.i-b.i)[0].i;
}

/** Level-up: a strong card while the deck is small, else a star on the best card, else trim. */
function chooseLevelUp(s:GameState):Command{
 const offers=levelOffers(s),has=(o:string)=>offers.includes(o as any);
 const cards=(s.levelUp?.cards??[]).map((c,i)=>({i,v:cardValue(c)})).sort((a,b)=>b.v-a.v);
 const up=s.masterDeck.map((c,i)=>({i,v:cardValue(c),ok:canUpgrade(c)})).filter(x=>x.ok).sort((a,b)=>b.v-a.v);
 const low=s.masterDeck.map((c,i)=>({i,v:c.type==='curse'?-99:cardValue(c),ok:canRemoveCard(c,s.masterDeck.length)})).filter(x=>x.ok).sort((a,b)=>a.v-b.v);
 if(s.levelUp?.upgradesLeft!=null)return up[0]?{type:'ChooseLevelUpOption',option:'upgrade',index:up[0].i}:{type:'SkipLevelUp'};
 if(has('draw')&&s.player.drawPerTurn<3)return {type:'ChooseLevelUpOption',option:'draw',index:0};
 if(has('mana')&&s.player.startMana<6&&s.masterDeck.some(c=>c.type==='spell'))return {type:'ChooseLevelUpOption',option:'mana',index:0};
 if(has('ap')&&s.player.maxAp<3)return {type:'ChooseLevelUpOption',option:'ap',index:0};
 if(has('retain')&&(s.player.retain??3)<4)return {type:'ChooseLevelUpOption',option:'retain',index:0};
 if(has('card')&&cards[0]&&(s.masterDeck.length<14||cards[0].v>=12))return {type:'ChooseLevelUpOption',option:'card',index:cards[0].i};
 if(has('remove')&&low[0]&&(low[0].v<0||s.masterDeck.length>16))return {type:'ChooseLevelUpOption',option:'remove',index:low[0].i};
 if(has('upgrade')&&up[0])return {type:'ChooseLevelUpOption',option:'upgrade',index:up[0].i};
 if(has('slot')&&s.masterDeck.filter(c=>c.type==='equipment').length>=2)return {type:'ChooseLevelUpOption',option:'slot',index:0};
 if(has('card')&&cards[0])return {type:'ChooseLevelUpOption',option:'card',index:cards[0].i};
 if(has('retain'))return {type:'ChooseLevelUpOption',option:'retain',index:0};
 if(has('slot'))return {type:'ChooseLevelUpOption',option:'slot',index:0};
 return {type:'SkipLevelUp'};
}

/** Slot A skills on the map, used as soon as they are ready. */
function chooseMapSkill(s:GameState):Command|undefined{
 for(const d of skillsFor(s.classId).filter(d=>d.slot==='A')){
  let index:number|undefined;
  if(d.id==='rune_weapon')index=s.masterDeck.map((c,i)=>({i,v:cardValue(c),ok:canUpgrade(c)})).filter(x=>x.ok).sort((a,b)=>b.v-a.v)[0]?.i;
  if(d.id==='pray_change')index=s.masterDeck.map((c,i)=>({i,v:c.type==='curse'?-99:cardValue(c)})).sort((a,b)=>a.v-b.v)[0]?.i;
  if(d.id==='ask_ancestors')index=s.player.startMana<6?1:0;
  if(!skillBlock(s,d.id,index))return {type:'UseSkill',id:d.id,index};
 }
}

/** Slot B/C skills at the start of a turn, when the board makes them worth it. */
function chooseFightSkill(s:GameState):Command|undefined{
 const hand=s.piles.hand,hp=s.player.hp/s.player.maxHp;
 const want:Record<string,()=>number|boolean|undefined>={
  muay_teacher:()=>hand.some(c=>!playBlock(s,c)&&cardValue(c)>=6),
  diamond_heart:()=>(s.fight?.hpLost??0)>=10,
  composure:()=>hp<.6||hand.some(c=>c.type==='spell'&&(c.mana??0)>=3),
  consecrate:()=>hand.some(c=>c.type==='spell'),
  metta:()=>s.player.hp<s.player.maxHp-8&&hand.some(c=>c.type==='attack'),
  samadhi:()=>(s.prayers?.length??0)>0||hp<.5,
  ghost_strength:()=>s.player.hp>20&&hand.length<=5,
  possession:()=>true,
 };
 for(const d of skillsFor(s.classId).filter(d=>d.slot!=='A').reverse()){
  let index:number|undefined;
  if(d.id==='possession'){const ids=possessionCards(s);index=ids.map((id,i)=>({i,v:cardValue(cardFromEnemy(enemyCardById(id)!))})).sort((a,b)=>b.v-a.v)[0]?.i;}
  if(want[d.id]?.()&&!skillBlock(s,d.id,index))return {type:'UseSkill',id:d.id,index};
 }
}

function activeOffer(s:GameState){const ix=s.pages?._activeOfferIndex;return ix!=null?s.pages?.current?.offers[ix]:undefined;}
function fightKind(s:GameState):FightKind{const o=activeOffer(s);return o?.kind==='boss'?'boss':o?.kind==='monster'&&o.tier==='elite'?'elite':'normal';}

/** How the pilot answers ghost dialogues; 'auto' picks one of the three from the seed. */
export type AlignPolicy='courage'|'merit'|'even'|'auto';
function alignChoice(s:GameState,policy:Exclude<AlignPolicy,'auto'>):'courage'|'merit'{
 if(policy!=='even')return policy;
 return (s.campaign?.courage??0)<=(s.campaign?.merit??0)?'courage':'merit';
}

export function playRun(seed:string,classId:ClassId,difficulty:Difficulty,opts:{tactical?:boolean;observe?:(s:GameState,r:RNG)=>void;align?:AlignPolicy;veteran?:boolean;blessingTier?:number;milestoneLevel?:number}={}):RunRecord{
 const tactical=opts.tactical??true;
 let s=baseNewState(seed),r=makeRng(seed),steps=0,stalled=false,earned=0,spent=0;
 const fights:FightRecord[]=[];let open:FightRecord|undefined;
 const go=(cmd:Command)=>{
  const before=s.phase,goldBefore=s.player.gold??0;
  const out=applyCommand(s,cmd,r);s=out.state;r=out.rng;steps++;
  const delta=(s.player.gold??0)-goldBefore;if(delta>0)earned+=delta;else spent-=delta;
  if(before!=='combat'&&s.phase==='combat'&&s.enemy){
   open={night:s.campaign?.night??1,index:(s.fightCount??0)+1,enemyId:s.enemy.id,kind:fightKind(s),turns:0,hpBefore:s.player.hp,hpAfter:s.player.hp,maxHp:s.player.maxHp,won:false};
  }
  if(open&&before==='combat'&&s.phase!=='combat'){
   open.turns=s.turn;open.hpAfter=s.player.hp;open.won=s.player.hp>0&&s.phase!=='defeat'&&!(s.runSummary&&!s.runSummary.won);
   fights.push(open);open=undefined;
  }
  opts.observe?.(s,r);
 };
 const align=opts.align&&opts.align!=='auto'?opts.align:(['courage','merit','even'] as const)[[...seed].reduce((n,ch)=>n+ch.charCodeAt(0),0)%3];
 go({type:'NewRun',seed,classId,difficulty,veteran:opts.veteran,blessingTier:opts.blessingTier??0,milestoneLevel:opts.milestoneLevel??0});
 while(!s.runSummary&&steps<9000){
  if(s.chapter){go({type:'SkipChapter'});continue;}
  if(s.phase==='starter'){const i=s.starter!.choices.findIndex(b=>b.id==='spirit_energy'||b.id==='herbal_wisdom'||b.id==='bamboo_dart_power');go({type:'ChooseStarterBlessing',index:Math.max(0,i)});continue;}
  if(s.phase==='combat'){
   if(tactical){const sk=chooseFightSkill(s);if(sk)go(sk);}
   for(let plays=0;s.phase==='combat'&&plays<32;plays++){
    const i=choosePilotCard(s,tactical,`${seed}:decision:${steps}`);if(i<0)break;
    const before=cardsPlayedThisTurn(s);go({type:'PlayCard',index:i,wait:s.piles.hand[i]?.type==='prayer'&&(s.enemy?.hp??0)>30&&s.player.hp>s.player.maxHp*.5?2:1});
    if(s.phase==='combat'&&cardsPlayedThisTurn(s)===before){stalled=true;break;}
   }
   if(s.phase!=='combat')continue;
   // Over the retain limit: drop the least valuable cards (spells waiting on mana stay).
   const need=turnEndExcess(s);
   if(need>0){const rank=s.piles.hand.map((c,i)=>({i,v:c.type==='curse'?99:cardValue(c)})).filter(x=>s.piles.hand[x.i].type!=='curse').sort((a,b)=>a.v-b.v);go({type:'DiscardForTurnEnd',indices:rank.slice(0,need).map(x=>x.i)});}
   go({type:'ResolveEnemyTurn'});
   if(s.phase==='combat')go({type:'StartPlayerTurn'});
   if(s.turn>60){stalled=true;break;}
   continue;
  }
  if(s.phase==='talk'){go({type:'AnswerGhostTalk',choice:alignChoice(s,align)});continue;}
  if(s.phase==='levelup'){go(chooseLevelUp(s));continue;}
  if(s.phase==='reward'){
   const growth=s.cardReward?.growth??[];
   if(growth.includes('draw')&&s.player.drawPerTurn<3){go({type:'ChooseHandReward',option:'draw'});continue;}
   if(growth.includes('retain')&&(s.player.retain??2)<3){go({type:'ChooseHandReward',option:'retain'});continue;}
   const ranked=(s.cardReward?.choices??[]).map((c,i)=>({i,c,v:cardValue(c)})).sort((a,b)=>b.v-a.v);
   const best=ranked[0];const pick=best&&(s.masterDeck.length<16||best.v>=12);
   go(pick?{type:'ChooseCardReward',index:best.i}:{type:'SkipCardReward'});continue;
  }
  if(s.phase==='victory'){go({type:'CompleteNode'});continue;}
  if(s.phase==='map'&&s.pages?.adventure){
   if(tactical){const sk=chooseMapSkill(s);if(sk){go(sk);continue;}}
   const p=s.pages.current!,a=s.pages.adventure,offers=p.offers;
   const open=(i:number)=>!!offers[i]&&!p.resolved[i];
   const prep=offers.findIndex((o,i)=>open(i)&&!a.usedIds.includes(a.slotIds[i]!)&&(o.kind==='treasure'||o.kind==='treasure_single'||o.kind==='story_event'||
    o.kind==='well'&&s.player.hp<s.player.maxHp-5||o.kind==='healing_shrine'&&s.player.hp<s.player.maxHp*.75||o.kind==='shop_card'&&s.player.gold>=30||o.kind==='shop_equipment'&&s.player.gold>=40||
    o.kind==='blessing'||o.kind==='shop_upgrade'||o.kind==='shop_remove'&&s.masterDeck.length>8));
   const ix=prep>=0?prep:offers.findIndex((o,i)=>open(i)&&isCriticalOffer(o));
   const other=offers.findIndex((_,i)=>open(i));
   if(ix<0&&other<0){stalled=true;break;}
   const equipmentIndices=s.masterDeck.map((c,i)=>({c,i})).filter(x=>x.c.type==='equipment').sort((a,b)=>cardValue(b.c)-cardValue(a.c)).slice(0,s.equipmentSlotsMax??1).map(x=>x.i);
   go(ix>=0?{type:'ChooseOffer',index:ix,equipmentIndices}:offers[other]?.kind==='next_event'?{type:'ChooseOffer',index:other}:{type:'DeleteShopFromMap',index:other});
   continue;
  }
  if(s.phase==='shop'&&s.pages?.adventure){
   const slot=s.pages._activeOfferIndex,slotId=slot!=null?s.pages.adventure.slotIds[slot]:undefined;
   if(s.shopKind==='well')go({type:'UseWell'});
   if(s.shopKind==='healing')go({type:'UseHealingShrine'});
   if((s.shopKind==='treasure'||s.shopKind==='treasure_single')&&s.shopStock?.length)go({type:s.shopKind==='treasure'?'TakeTreasureCard':'TakeSingleTreasureCard',index:0});
   if(s.shopKind==='blessing'&&s.blessingStock?.length)go({type:'TakeShopBlessing',index:0});
   // Spend down to a small reserve: the first upgrade/removal is free, more cost gold.
   const reserve=60;
   if(s.shopKind==='upgrade')for(let k=0;k<4;k++){const rank=s.masterDeck.map((c,i)=>({i,v:cardValue(c),ok:canUpgrade(c)})).filter(x=>x.ok).sort((a,b)=>b.v-a.v);const price=upgradePrice(s);if(!rank[0]||(price>0&&price>s.player.gold-reserve))break;go({type:'ShopUpgradeBuy',index:rank[0].i});}
   if(s.shopKind==='remove')for(let k=0;k<3&&s.masterDeck.length>(k?12:8);k++){const rank=s.masterDeck.map((c,i)=>({i,v:cardValue(c)})).sort((a,b)=>a.v-b.v);const price=removePrice(s);if(price>0&&price>s.player.gold-reserve)break;go({type:'ShopRemoveBuy',index:rank[0].i});}
   if(s.shopKind==='card'||s.shopKind==='equipment')for(let k=0;k<2;k++){
    // The best affordable card; a second one only while the deck is small and gold stays above the reserve.
    const rank=(s.shopStock??[]).flatMap((it,i)=>'card' in it&&it.card&&shopPrice(s,it.price)<=s.player.gold-(k?reserve:0)?[{i,v:cardValue(it.card)}]:[]).sort((a,b)=>b.v-a.v);
    if(!rank[0]||(k&&s.masterDeck.length>=16))break;go({type:'TakeShop',index:rank[0].i});
   }
   if(s.phase==='shop')go({type:'CompleteNode'});
   // An unused stop stays on the board; the pilot clears it so the night moves on.
   if((s.phase as string)==='map'&&slot!=null&&s.pages.adventure!.slotIds[slot]===slotId&&!s.pages.current!.resolved[slot])go({type:'DeleteShopFromMap',index:slot});
   continue;
  }
  if(s.phase==='event'){const ev=getStoryEvent(s.story!.eventId,s);const index=ev?.choices.findIndex(c=>!choiceLocked(s,c))??-1;if(index<0){stalled=true;break;}go({type:'ChooseEventOption',index});go({type:'CompleteNode'});continue;}
  stalled=true;break;
 }
 if(!s.runSummary)stalled=true;
 return {seed,classId,difficulty,won:!!s.runSummary?.won,stalled,nightReached:s.campaign?.night??1,fights,deck:s.masterDeck.length,level:s.player.level,gold:s.player.gold,turns:s.runMetrics?.turns??0,plays:s.runMetrics?.cardsPlayed??0,
blessings:s.blessings?.length??0,goldEarned:earned,goldSpent:spent};
}
