// test/tuning-before-store.test.ts — tuning round 13 Oct 2026 (docs/tuning-2026-10-13/HANDOFF.md)
import {describe,it,expect} from 'vitest';
import {baseNewState,beginPlayerFight,startPlayerTurn} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {openingHandSize} from '../src/core/cards/hand';
import {applyFx,fxDrawAllowance} from '../src/core/cards/fx';
import {rollShopStock} from '../src/core/shop';
import {applyBlessingGain} from '../src/core/engine/shared';
import {CARD_RULES,ECONOMY,LEVEL_UP} from '../src/core/balance/notfm';
import type {Command,GameState} from '../src/core/types';

function run(difficulty=1){
 let s=baseNewState('tune'),r=makeRng('tune');
 const go=(c:Command)=>{({state:s,rng:r}=applyCommand(s,c,r));};
 go({type:'NewRun',seed:'tune',classId:'warrior',difficulty} as any);
 while(s.chapter)go({type:'SkipChapter'});
 go({type:'ChooseStarterBlessing',index:0});s.blessings=[];
 return {go,get s(){return s},get r(){return r}};
}
const attack=(id:string)=>({id,name:id,type:'attack' as const,fx:{dmg:1}});

describe('tuning before store',()=>{
 it('T2/T4: fights open with max hand + 1, except at difficulty 5',()=>{
  const d=run(1);expect(d.s.campaign!.difficulty).toBe(1);
  expect(openingHandSize(d.s)).toBe(CARD_RULES.retain+1);
  d.s.campaign!.difficulty=5;expect(openingHandSize(d.s)).toBe(CARD_RULES.retain);
 });

 it('T3: hand and draw growth stop at 4 and 3',()=>{
  expect(LEVEL_UP.caps.retain).toBe(4);expect(LEVEL_UP.caps.draw).toBe(3);
  const s=run().s;s.player.drawPerTurn=3;applyBlessingGain(s,{id:'x',name:'x',triggers:[],onGain:{draw:1}} as any);
  expect(s.player.drawPerTurn).toBe(3);
 });

 it('T5/T6: shops sell 3 items and no Rare or Legendary on night 1',()=>{
  expect(ECONOMY.shopStock.cards+ECONOMY.shopStock.equipment).toBe(3);
  for(let i=0;i<60;i++){
   const out=rollShopStock(makeRng('shop'+i),3,1,'warrior',c=>c.type!=='equipment');
   for(const it of out.items)expect(['Common','Uncommon']).toContain((it as any).card.rarity??'Common');
  }
  const late=new Set<string>();
  for(let i=0;i<200;i++)for(const it of rollShopStock(makeRng('late'+i),3,3,'warrior').items)late.add((it as any).card.rarity??'Common');
  expect(late.has('Rare')).toBe(true);
 });

 it('progression: the night-1 shop offers four cards, none Rare or Legendary',()=>{
  {
   const d=run();const s=d.s,a=s.pages!.adventure!,entry=a.deck.find(e=>e.offer.kind==='shop_card')!;
   s.pages!.current!.offers[0]={...entry.offer,availableAfterWins:0};s.pages!.current!.resolved[0]=false;a.slotIds[0]=entry.id;
   d.go({type:'ChooseOffer',index:0});
   expect(d.s.phase).toBe('shop');
   expect(d.s.shopStock).toHaveLength(4);
   for(const it of d.s.shopStock!)expect(['Common','Uncommon']).toContain((it as any).card.rarity??'Common');
  }
 });

 it('T7: card and blessing effects draw at most 2 per turn; the turn draw is not counted',()=>{
  const d=run();d.s.phase='combat';
  d.s.enemy={id:'phi-krasue',name:'ผี',hp:999,maxHp:999,block:0} as any;
  d.s.masterDeck=Array.from({length:20},(_,i)=>attack('a'+i));
  let r=beginPlayerFight(d.s,d.r);
  const opening=d.s.piles.hand.length;
  r=applyFx(d.s,{draw:3},{sourceId:'test'},r);
  expect(d.s.piles.hand.length).toBe(opening+CARD_RULES.fxDrawPerTurn);
  r=applyFx(d.s,{draw:1},{sourceId:'test'},r);
  expect(d.s.piles.hand.length).toBe(opening+CARD_RULES.fxDrawPerTurn);
  d.s.turn=(d.s.turn??1)+1;
  const before=d.s.piles.hand.length;
  r=startPlayerTurn(d.s,r).rng;
  expect(d.s.piles.hand.length).toBe(before+d.s.player.drawPerTurn);
  r=applyFx(d.s,{draw:1},{sourceId:'test'},r);
  expect(d.s.piles.hand.length).toBe(before+d.s.player.drawPerTurn+1);
 });

 it('T7: outside a fight effect draws are not limited',()=>{
  const s={fight:undefined} as unknown as GameState;
  expect(fxDrawAllowance(s,5)).toBe(5);
 });
});
