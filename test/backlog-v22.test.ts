import {describe,it,expect} from 'vitest';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import type {GameState,Command} from '../src/core/types';
import {describeOffer} from '../app/components/offerDisplay';
import {encounterAction} from '../app/encounterPresentation';
import {battleGeometry,enemyLane} from '../app/battleGeometry';
import {canRemoveCard,upgradeCard,MAX_UPGRADE_LEVEL} from '../src/core/engine/shared';
import {removeCostForCount,upgradeCostForCount} from '../src/core/balance/economy';
import {onCardPlayed,expireCombos,COMBO_BY_ID} from '../src/core/combat/combos';
import {comboPayoff,comboFeedbackText} from '../app/comboPresentation';
import {onRestRow} from '../src/core/map/restPage';
import {reachableNodes} from '../src/core/map/journey';
import {resolveStoryIfAny} from './helpers';
import {cardSummary} from '../app/cardPresentation';
import {ALL_CARDS} from '../src/core/pack';
function newState():GameState {return applyCommand({seed:'backlog',phase:'start',turn:0} as GameState,{type:'NewRun',seed:'backlog',classId:'warrior',runMode:'full'},makeRng('backlog')).state;}
function step(s:GameState,c:Command){return applyCommand(s,c,makeRng('backlog')).state;}
function shop(kind:'card'|'remove'|'upgrade') {const s=newState();s.phase='shop';s.shopKind=kind;s.player.gold=1000;return s;}
describe('shop confirmation engine and boundaries',()=>{
 it('purchase changes stock, gold and deck exactly once; wrong shop and insufficient funds do nothing',()=>{
  const s=shop('card');s.shopStock=[{card:ALL_CARDS[0],price:60}];const len=s.masterDeck.length;
  const out=step(s,{type:'TakeShop',index:0});expect(s.player.gold).toBe(1000);expect(s.masterDeck).toHaveLength(len);
  expect(out.player.gold).toBe(940);expect(out.masterDeck).toHaveLength(len+1);expect(out.shopStock).toHaveLength(0);
  expect(step(out,{type:'TakeShop',index:0}).player.gold).toBe(940);
  for(const bad of [{...s,shopKind:'remove'},{...s,player:{...s.player,gold:0}}] as GameState[])expect(step(bad,{type:'TakeShop',index:0}).masterDeck).toHaveLength(len);
 });
 it('removal protects locked, QA, last and invalid-index cards without charging; curses may be removed',()=>{
  const s=shop('remove');s.masterDeck[0].unremovable=true;
  for(const index of [0,-1,999,0.5]){const out=step(s,{type:'ShopRemoveBuy',index});expect(out.masterDeck).toEqual(s.masterDeck);expect(out.player.gold).toBe(s.player.gold);}
  const last={...s,masterDeck:[{...s.masterDeck[1]}]};expect(step(last,{type:'ShopRemoveBuy',index:0}).masterDeck).toHaveLength(1);
  expect(canRemoveCard({id:'qa_phra_prathan'} as any,3)).toBe(false);
  expect(canRemoveCard({id:'curse',type:'curse'} as any,3)).toBe(true);
  const out=step(s,{type:'ShopRemoveBuy',index:1});expect(out.masterDeck).toHaveLength(s.masterDeck.length-1);expect(out.player.gold).toBe(1000-removeCostForCount(0));
  const poor={...s,runCounters:{removed:0,...s.runCounters,removeShopCount:1},player:{...s.player,gold:0}};expect(step(poor,{type:'ShopRemoveBuy',index:1}).masterDeck).toEqual(s.masterDeck);
 });
 it('upgrade preview is pure; confirmed upgrade equals preview and charges once; capped/poor cards preserve deck',()=>{
  const s=shop('upgrade'),before=structuredClone(s.masterDeck[0]),preview=upgradeCard(before);
  expect(s.masterDeck[0]).toEqual(before);const out=step(s,{type:'ShopUpgradeBuy',index:0});expect(out.masterDeck[0]).toEqual(preview);expect(out.player.gold).toBe(1000-upgradeCostForCount(0));
  for(const bad of [{...s,masterDeck:[{...before,upgradeLevel:MAX_UPGRADE_LEVEL}]},{...s,runCounters:{...s.runCounters,upgradeShopCount:1},player:{...s.player,gold:0}}]){const out=step(bad as GameState,{type:'ShopUpgradeBuy',index:0});expect(out.masterDeck).toEqual(bad.masterDeck);expect(out.player.gold).toBe(bad.player.gold);}
 });
});
describe('all rest route types and combat labels',()=>{
 const kinds=['shop_card','shop_equipment','shop_remove','shop_upgrade','well','healing_shrine','treasure','treasure_single','fusion_altar','story_event'] as const;
 for(const kind of kinds)it(`${kind} enters correct phase and returns to identical rest row`,()=>{
  let s=newState();s.chapter=undefined;s=step(s,{type:'ChooseStarterBlessing',index:0});
  for(let guard=0;guard<60&&!(s.phase==='map'&&onRestRow(s));guard++){
   if(s.chapter){s=step(s,{type:'SkipChapter'});continue;}
   if(s.phase==='map'){const ix=s.pages!.current!.offers.findIndex(o=>o.kind==='monster'||o.kind==='boss');s=step(s,{type:'ChooseOffer',index:ix});}
   else if(s.phase==='combat'){s.piles.hand=[{id:'test',name:'test',type:'attack',cost:0,dmg:9999}];s=step(s,{type:'PlayCard',index:0});}
   else if(s.phase==='levelup')s=step(s,{type:'SkipLevelUp'});
   else if(s.phase==='reward')s=step(s,{type:'SkipCardReward'});
   else s=step(s,{type:'CompleteNode'});
  }
  expect(onRestRow(s)).toBe(true);expect(s.phase).toBe('map');s.campaign={night:2,unlocks:[]};
  const offer={kind,nodeId:'night2-stage8',shopId:'night2-stage8',eventId:'episode_lantern'} as any;
  const d=describeOffer(offer,0);expect(d.isCombat).toBe(false);expect(encounterAction(d)).not.toContain('เผชิญหน้า');expect(d.type).toBe(kind);
  const row=s.journey!.rowIndex;const nodes=reachableNodes(s.journey!);s.pages!.current!.offers[0]=offer;nodes[0].offer=offer;
  const before=structuredClone(s.pages!.current);const entered=step(s,{type:'ChooseOffer',index:0});expect(entered.phase).toBe(kind==='story_event'?'event':'shop');expect(entered.phase).not.toBe('combat');
  let result=entered;resolveStoryIfAny(result,c=>{result=step(result,c);});const returned=step(result,{type:'CompleteNode'});expect(returned.phase).toBe('map');expect(returned.journey!.rowIndex).toBe(row);expect(returned.pages!.current?.offers).toEqual(before!.offers);
 });
});
describe('actual combo feedback and payoff',()=>{
 it('ordered chain reports progress, reset reason and actual success reward; timeout reports expiry',()=>{
  const s=newState();s.phase='combat';s.player.block=0;s.piles.hand=[];s.piles.draw=[];s.piles.discard=[];s.enemy={hp:999,maxHp:999,block:0} as any;
  const card=(id:string)=>ALL_CARDS.find(c=>c.id===id)!;
  onCardPlayed(s,card('muay_stance'),'warrior');expect(s.combo?.feedback?.some(f=>f.kind==='progress')).toBe(true);
  s.turn+=2;expireCombos(s);expect(s.combo?.feedback?.some(f=>f.kind==='reset'&&f.reason==='expired')).toBe(true);
  onCardPlayed(s,card('muay_stance'),'warrior');onCardPlayed(s,card('muay_stance'),'warrior');expect(s.combo?.feedback?.some(f=>f.reason==='restart')).toBe(true);
  onCardPlayed(s,card('ward_riposte'),'warrior');const f=s.combo!.feedback!.find(f=>f.comboId==='ward_counter_chain'&&f.kind==='success')!;expect(f).toBeDefined();expect(s.player.block).toBe(6);expect(comboFeedbackText(f)).toContain('ป้องกัน +6');
  for(const e of COMBO_BY_ID.ward_counter_chain.effects)expect(comboPayoff(e)).toMatch(/6|1/);
 });
});
describe('portrait card/art/HUD separation, including multiple owners',()=>{
 for(const [w,h] of [[360,640],[393,852],[412,915]])for(const count of [1,2,3])it(`${w}x${h}, ${count} enemies`,()=>{
  const g=battleGeometry(w,h,24,24);
  for(let i=0;i<count;i++){const p=enemyLane(g,i,count);expect(Math.abs(p.cardX-(i+.5)*w/count)).toBeLessThan(w/count*.3);expect(p.cardY+p.cardH/2).toBeLessThan(g.hudTop);expect(p.artX+p.artWidth).toBeLessThanOrEqual(w);expect(p.cardX-p.cardW/2).toBeGreaterThanOrEqual(0);}
  expect(g.hudTop+90).toBeLessThanOrEqual(h-24-118-(h<700?148:178)+10);
 });
});

describe('live enemy HUD and upgrade ability text',()=>{
 it('enemy reveal frames report actual energy spent and queued cards left',()=>{
  let s=newState();s.chapter=undefined;s=step(s,{type:'ChooseStarterBlessing',index:0});s=step(s,{type:'ChooseOffer',index:0});s.player.hp=s.player.maxHp=999;
  s=step(s,{type:'EndTurn'});const reveals=(s.pendingEvents??[]).filter(e=>e.t==='EnemyCardRevealed');expect(reveals.length).toBeGreaterThan(0);
  let energy=s.enemy!.maxEnergy||2;for(const event of reveals){if(event.t!=='EnemyCardRevealed')continue;energy-=event.cost??1;expect(event.frame!.enemy!.energy).toBe(energy);expect(event.frame!.enemy!.handCount).toBeGreaterThanOrEqual(0);}
  expect(s.enemy?.handCount).toBe(0);
 });
 it('trap upgrade preview prints upgraded effect values instead of stale descriptions',()=>{
  const c=ALL_CARDS.find(c=>c.type==='trap'&&c.trap?.effects.some(e=>e.type==='damage'))!;const up=upgradeCard(c);expect(cardSummary(up)).toContain(`โจมตีกลับ ${up.trap!.effects.find(e=>e.type==='damage')!.value}`);expect(up.trap!.effects.find(e=>e.type==='damage')!.value).toBeGreaterThan(c.trap!.effects.find(e=>e.type==='damage')!.value);
 });
});
