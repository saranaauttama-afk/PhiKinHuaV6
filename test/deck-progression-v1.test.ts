import {describe,it,expect} from 'vitest';
import {makeCombatState} from './helpers';
import {makeRng} from '../src/core/rng';
import {playCard} from '../src/core/cards/play';
import {cardById,CARD_LIST_WITH_STARTERS} from '../src/core/pack';
import {CHARACTER_CLASSES,buildStarterDeck} from '../src/core/classes';
import {canUpgrade} from '../src/core/engine/shared';
import {describeCard} from '../src/core/cards/describe';
import {rollProgressionShop} from '../src/core/shop';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {fromSave,toSave} from '../src/core/save';
import {priceForCard} from '../src/core/shop';
import {removePrice,upgradePrice} from '../src/core/engine/handlers/shops_events';
import type {Command} from '../src/core/types';

const card=(id:string,star=1)=>({...cardById(id)!,star});

describe('deck progression v1',()=>{
 it('keeps each playable starter at ten owned cards and gives paid stars a real effect',()=>{
  for(const cls of ['warrior','shaman'] as const){
   const deck=buildStarterDeck(CHARACTER_CLASSES[cls],CARD_LIST_WITH_STARTERS);
   expect(deck).toHaveLength(10);
   for(const c of deck){
    expect(canUpgrade(c),c.id).toBe(true);
    expect(canUpgrade({...c,star:2}),c.id).toBe(true);
   }
  }
  expect(canUpgrade(card('bronze_bowl'))).toBe(false); // Equipment has no star scaling.
 });
 it('caps only the starter rhythm bonus, keeping the stronger bought attack uncapped',()=>{
  const hit=(id:string)=>{
   const {state:s}=makeCombatState({hand:[card(id)],enemyHp:200});
   s.classId='warrior';s.fight={hpLost:0,ghostTurns:0,rhythm:8};
   s.turnFlags={blessingOnce:{}};s.enemy!.statusEffects=[];
   const before=s.enemy!.hp;
   expect(playCard(s,0,makeRng('cap')).played).toBe(true);
   return before-s.enemy!.hp;
  };
  expect(hit('jab')).toBe(5); // 3 printed damage + at most 2 rhythm.
  expect(hit('straight_punch')).toBeGreaterThan(8); // The bought punch gets full rhythm.
 });
 it('applies the starter cap to the repeated hit as well',()=>{
  const {state:s}=makeCombatState({hand:[card('jab')],enemyHp:200});
  s.classId='warrior';s.fight={hpLost:0,ghostTurns:0,rhythm:8};
  s.turnFlags={blessingOnce:{},doubleNext:true};s.enemy!.statusEffects=[];
  expect(playCard(s,0,makeRng('repeat-cap')).played).toBe(true);
  expect(s.enemy!.hp).toBe(190); // Two hits of 3+2, never 3+8.
 });
 it('spends two bruise stacks on the starter elbow, leaving the rest for a later finisher',()=>{
  const {state:s}=makeCombatState({hand:[card('slant_elbow')],enemyHp:200});
  s.classId='warrior';s.fight={hpLost:0,ghostTurns:0,rhythm:0};s.turnFlags={blessingOnce:{}};
  s.enemy!.statusEffects=[{id:'bruise',name:'ช้ำ',stacks:5,duration:99} as any];
  expect(playCard(s,0,makeRng('bruise')).played).toBe(true);
  expect(s.enemy!.statusEffects?.find(e=>e.id==='bruise')?.stacks).toBe(3);
  expect(s.enemy!.hp).toBe(192); // Four printed damage + 2x2 bruise.
 });
 it('starter splash leaves extra water in the bowl, and displays its limit',()=>{
  const {state:s}=makeCombatState({hand:[card('holy_water_splash',3)],enemyHp:200,playerMana:8});
  s.classId='shaman';s.turnFlags={blessingOnce:{}};
  expect(playCard(s,0,makeRng('water')).played).toBe(true);
  expect(s.player.mana).toBe(5);
  expect(s.enemy!.hp).toBe(187); // 3 water x 3 + star-three flat 4.
  expect(describeCard(card('holy_water_splash'))).toContain('สูงสุด 3');
 });
 it('build offers stay legal, distinct and reproducible across the first 100 seeds',()=>{
  for(const cls of ['warrior','shaman'] as const)for(let i=0;i<100;i++){
   const state=baseNewState('stock'+i);state.classId=cls;
   state.masterDeck=buildStarterDeck(CHARACTER_CLASSES[cls],CARD_LIST_WITH_STARTERS);
   state.campaign={night:1,difficulty:1,completedNights:0,unlocks:[]};
   const x=rollProgressionShop(state,makeRng('stock'+i));
   const y=rollProgressionShop(state,makeRng('stock'+i));
   expect(x.items.map(it=>'card' in it?it.card.id:'' )).toEqual(y.items.map(it=>'card' in it?it.card.id:''));
   expect(x.items).toHaveLength(4);
   const cards=x.items.flatMap(it=>'card' in it?[it.card]:[]);
   expect(new Set(cards.map(c=>c.id)).size).toBe(4);
   expect(cards.every(c=>!c.progressionRole&&!c.locked&&!c.unlockAt)).toBe(true);
   expect(cards.slice(0,2).every(c=>['Common','Uncommon'].includes(c.rarity??'Common'))).toBe(true);
  }
 });
 it('opens the first shop only after a win, then retains sold roles and a single reroll through a save',()=>{
  let s=baseNewState('shop-flow'),r=makeRng('shop-flow');
  const go=(cmd:Command)=>{({state:s,rng:r}=applyCommand(s,cmd,r));};
  go({type:'NewRun',seed:'shop-flow',classId:'warrior',difficulty:1});
  while(s.chapter)go({type:'SkipChapter'});
  go({type:'ChooseStarterBlessing',index:0});
  const ix=s.pages!.current!.offers.findIndex(o=>o.kind==='shop_card');
  expect(ix).toBeGreaterThanOrEqual(0);
  go({type:'ChooseOffer',index:ix});
  expect(s.phase).toBe('map');
  expect(s.shopStock).toBeUndefined();
  go({type:'ChooseOffer',index:s.pages!.current!.offers.findIndex(o=>o.kind==='monster')});
  s.piles.hand=[{id:'test_finish',name:'จบไฟต์',type:'attack',fx:{dmg:9999,hits:3}}];
  go({type:'PlayCard',index:0});
  for(let n=0;n<15&&s.phase!=='map';n++)go(s.phase==='talk'?{type:'AnswerGhostTalk',choice:'leave'}:s.phase==='levelup'?{type:'SkipLevelUp'}:s.phase==='reward'?{type:'SkipCardReward'}:{type:'CompleteNode'});
  expect(s.pages!.adventure!.fightsWon).toBe(1);
  go({type:'ChooseOffer',index:ix});
  expect(s.phase).toBe('shop');
  expect(s.shopStock).toHaveLength(4);
  const focus=s.shopFocus,first=s.shopStock![0];
  s.player.gold=999;
  go({type:'TakeShop',index:0});
  const afterBuy=s.player.gold;
  go({type:'ShopReroll'});
  expect(s.player.gold).toBe(afterBuy-10);
  expect(s.shopFocus).toBe(focus);
  expect(s.shopStock).toHaveLength(3);
  expect(s.shopStock!.some(it=>'card' in it&&it.card.id===('card' in first?first.card.id:''))).toBe(false);
  expect(s.shopStock!.map(it=>'card' in it?it.role:'')).toEqual(['engine','payoff','support']);
  const refreshed=structuredClone(s.shopStock);
  go({type:'ShopReroll'});
  expect(s.player.gold).toBe(afterBuy-10);
  expect(s.shopStock).toEqual(refreshed);
  go({type:'CompleteNode'});
  const loaded=fromSave(toSave(s,r))!;
  expect(loaded.pages!.adventure!.fightsWon).toBe(1);
  ({state:s,rng:r}=applyCommand(loaded,{type:'ChooseOffer',index:ix},r));
  expect(s.shopStock).toEqual(refreshed);
  expect(s.shopRerollUsed).toBe(true);
 });
 it('keeps old prices and stop limits for other classes',()=>{
  const s=baseNewState('legacy');s.classId='nun';
  s.shopBoughtItems=[{card:card('bamboo_dart'),price:0},{card:card('bamboo_dart'),price:40},{card:card('bamboo_dart'),price:40}];
  expect(priceForCard(card('straight_punch'))).toBe(30);
  expect(removePrice(s)).toBe(40);
  expect(upgradePrice(s)).toBe(40);
 });
});
