import {describe,it,expect} from 'vitest';
import {baseNewState,startPlayerTurn} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {fromSave,toSave} from '../src/core/save';
import {validAdventure,useIntersectionPage,startAdventure} from '../src/core/map/adventure';
import {getStoryEvent} from '../src/core/events/story';
import {getCardPlayedFns,resetBlessingTurnFlags} from '../src/core/blessingRuntime';
import {cardById} from '../src/core/pack';
import {captureRewardReceipt} from '../src/core/rewardReceipt';
import {battleGeometry,handGeometry} from '../app/battleGeometry';
import type {Command,GameState} from '../src/core/types';
function driver(seed='v32-shop'){
 let s=baseNewState(seed),r=makeRng(seed);const go=(c:Command)=>{({state:s,rng:r}=applyCommand(s,c,r));return s;};
 go({type:'NewRun',seed,classId:'warrior',difficulty:1});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});
 return {go,get s(){return s},get r(){return r}};
}
describe('v32 reported regressions',()=>{
 it('returning from a purchased shop preserves the exact stock, receipt, board and cold save; only its X destroys it',()=>{
  const d=driver(),p=d.s.pages!.current!,ix=p.offers.findIndex(o=>o.kind==='shop_card');expect(ix).toBeGreaterThanOrEqual(0);
  const board=structuredClone(d.s.pages!.adventure!.slotIds);d.s.player.gold=1000;d.go({type:'ChooseOffer',index:ix});
  const beforeGold=d.s.player.gold;d.go({type:'TakeShop',index:0});const stock=structuredClone(d.s.shopStock),receipt=structuredClone(d.s.rewardReceipt);expect(receipt!.cards).toHaveLength(1);expect(d.s.player.gold).toBeLessThan(beforeGold);
  d.go({type:'CompleteNode'});expect(d.s.pages!.adventure!.slotIds).toEqual(board);expect(d.s.pages!.current!.resolved[ix]).toBe(false);
  const saved=fromSave(toSave(d.s,d.r));expect(validAdventure(saved)).toBe(true);
  d.go({type:'ChooseOffer',index:ix});expect(d.s.shopStock).toEqual(stock);expect(d.s.rewardReceipt).toEqual(receipt);d.go({type:'CompleteNode'});
  d.go({type:'DeleteShopFromMap',index:ix});expect(d.s.pages!.current!.resolved[ix]).toBe(true);expect(d.s.pages!.adventure!.slotIds).toEqual(board);expect(validAdventure(d.s)).toBe(true);
 });
 it('completing a ghost keeps its slot terminal until all three pages finish, and cannot delete another ghost',()=>{
  const d=driver(),a=d.s.pages!.adventure!,before=structuredClone(a.slotIds),cursor=a.cursor;d.go({type:'ChooseOffer',index:0});d.s.piles.hand=[{id:'test',name:'test',type:'attack',cost:0,dmg:9999}];d.go({type:'PlayCard',index:0});
  while(d.s.phase!=='map'){d.go(d.s.phase==='levelup'?{type:'SkipLevelUp'}:d.s.phase==='reward'?{type:'SkipCardReward'}:{type:'CompleteNode'});}
  expect(d.s.pages!.current!.resolved[0]).toBe(true);expect(d.s.pages!.adventure!.slotIds).toEqual(before);expect(d.s.pages!.adventure!.cursor).toBe(cursor);
  const other=d.s.pages!.current!.offers.findIndex((o,i)=>o?.kind==='monster'&&!d.s.pages!.current!.resolved[i]);d.go({type:'DeleteShopFromMap',index:other});expect(d.s.pages!.adventure!.slotIds).toEqual(before);expect(validAdventure(d.s)).toBe(true);
 });
 it('an actual intersection retains service pages and defers ghosts without reducing the fight quota',()=>{
  const d=driver(),a=d.s.pages!.adventure!,p=d.s.pages!.current!;const skip=a.deck.find(e=>e.offer.kind==='next_event')!,shop=a.deck.find(e=>e.offer.kind==='shop_card')!,ghost=a.deck.find(e=>e.offer.kind==='monster')!;
  a.cursor=a.deck.indexOf(skip)+1;const drawn=a.deck.slice(0,a.cursor);a.resolvedIds=drawn.filter(e=>![skip.id,shop.id,ghost.id].includes(e.id)).map(e=>e.id);a.fightsWon=drawn.filter(e=>a.resolvedIds.includes(e.id)&&e.offer.kind==='monster').length;a.storyDone=drawn.some(e=>a.resolvedIds.includes(e.id)&&e.offer.kind==='story_event');
  a.slotIds=[ghost.id,shop.id,skip.id];p.offers=[ghost.offer,shop.offer,skip.offer];p.resolved=[false,false,false];expect(validAdventure(d.s)).toBe(true);
  useIntersectionPage(d.s,2);expect(a.slotIds[1]).toBe(shop.id);expect(a.pendingIds).toContain(ghost.id);expect(a.skippedIds).not.toContain(ghost.id);expect(validAdventure(d.s)).toBe(true);expect(fromSave(toSave(d.s,d.r)).pages!.adventure).toEqual(a);
 });
 it('a claimed chest survives returning and cold reentry without granting or rolling a second reward',()=>{
  let found:ReturnType<typeof driver>|undefined;
  for(let i=0;i<30&&!found;i++){const d=driver('v32-chest-'+i);d.s.campaign!.night=2;d.s.campaign!.completedNights=1;startAdventure(d.s,d.r);if(d.s.pages!.adventure!.deck.some(e=>e.offer.kind==='treasure'||e.offer.kind==='treasure_single'))found=d;}
  expect(found).toBeDefined();const d=found!;
  for(let i=0;i<200;i++){
   const p=d.s.pages!.current!;const ix=p.offers.findIndex((o,i)=>!p.resolved[i]&&(o?.kind==='treasure'||o?.kind==='treasure_single'));if(ix>=0){d.go({type:'ChooseOffer',index:ix});const n=d.s.masterDeck.length;const command=d.s.shopKind==='treasure'?{type:'TakeTreasureCard' as const,index:0}:{type:'TakeSingleTreasureCard' as const,index:0};d.go(command);expect(d.s.masterDeck).toHaveLength(n+1);expect(d.s.phase).toBe('shop');const receipt=structuredClone(d.s.rewardReceipt);d.go(command);expect(d.s.masterDeck).toHaveLength(n+1);d.go({type:'CompleteNode'});expect(fromSave(toSave(d.s,d.r)).pages!.current!.resolved[ix]).toBe(false);d.go({type:'ChooseOffer',index:ix});expect(d.s.shopStock).toHaveLength(0);expect(d.s.rewardReceipt).toEqual(receipt);const gold=d.s.player.gold;d.go({type:'RandomizeSingleTreasure'});d.go(command);expect(d.s.player.gold).toBe(gold);expect(d.s.masterDeck).toHaveLength(n+1);return;}
   if(d.s.chapter)d.go({type:'SkipChapter'});else if(d.s.phase==='map'){const critical=p.offers.findIndex((o,i)=>!p.resolved[i]&&(o?.kind==='monster'||o?.kind==='story_event'));const other=p.offers.findIndex((o,i)=>o&&!p.resolved[i]);d.go(critical>=0?{type:'ChooseOffer',index:critical}:p.offers[other]?.kind==='next_event'?{type:'ChooseOffer',index:other}:{type:'DeleteShopFromMap',index:other});}else if(d.s.phase==='combat'){d.s.piles.hand=[{id:'test',name:'test',type:'attack',cost:0,dmg:99999}];d.go({type:'PlayCard',index:0});}else if(d.s.phase==='event'){d.go({type:'ChooseEventOption',index:0});d.go({type:'CompleteNode'});}else d.go(d.s.phase==='levelup'?{type:'SkipLevelUp'}:d.s.phase==='reward'?{type:'SkipCardReward'}:{type:'CompleteNode'});
  }throw Error('Chest was never reached');
 });
 it('opening draw is independent from energy and cap; turn draw only adds the requested amount',()=>{
  const d=driver();d.s.player.maxEnergy=8;d.go({type:'ChooseOffer',index:0});expect(d.s.piles.hand).toHaveLength(2);expect(d.s.player.maxHandSize).toBe(2);
  d.s.piles.hand=[];d.s.piles.draw=d.s.masterDeck.map(c=>({...c}));startPlayerTurn(d.s,d.r);expect(d.s.piles.hand).toHaveLength(2);
 });
 it('receipts use actual granted copies, preserve upgrades/losses and never mutate inventory',()=>{
  const granted={id:'receipt_test_blessing',name:'พรทดสอบ',rarity:'Common' as const,desc:'test'};
  const before=driver().s,after=structuredClone(before),card={...before.masterDeck[0],upgradeLevel:2};after.masterDeck.push(card);after.blessings.push(granted);after.masterDeck.shift();const inventory=structuredClone(after.masterDeck);
  captureRewardReceipt(before,after,{type:'ChooseEventOption',index:0});expect(after.rewardReceipt!.cards).toEqual([card]);expect(after.rewardReceipt!.blessings).toEqual([granted]);expect(after.rewardReceipt!.lostCards).toHaveLength(1);expect(after.masterDeck).toEqual(inventory);expect(fromSave(toSave(after,makeRng(after.seed))).rewardReceipt).toEqual(after.rewardReceipt);
 });
 for(const [w,h] of [[360,640],[393,852]])it(`${w}x${h}: six cards, full-body stage and reserved notice do not collide`,()=>{const g=battleGeometry(w,h,24,24),hand=handGeometry(w,6);expect(hand.overflow).toBe(false);expect(hand.span+hand.padding*2).toBeLessThanOrEqual(w);expect(g.monsterTop+g.monsterSize).toBeLessThan(g.hudTop);expect(g.noticeTop).toBeGreaterThanOrEqual(g.hudTop+g.enemyHudHeight+g.enemyExtrasHeight);expect(g.noticeTop+g.noticeHeight).toBeLessThan(g.handTop);});
});
