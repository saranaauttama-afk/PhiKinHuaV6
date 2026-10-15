import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {makeCombatState} from './helpers';
import {allEnemyCards,enemyCardCost,type EnemyCardDef} from '../src/core/pack_enemy_cards';
import {chooseEnemyCardIndexes,enemySummonValue} from '../src/core/combat/enemyPlan';
import {drawEnemyHand,enemyDrawCadence,finishEnemyHand} from '../src/core/combat/enemyHand';
import {resolveEnemyCard} from '../src/core/combat/enemyCardEffects';
import {summonMinion} from '../src/core/combat/minions';
import {cardById} from '../src/core/pack';
import {MINION_RULES} from '../src/core/balance/notfm';
import type {GameState} from '../src/core/types';

// Isolate planner contracts from tuning of real cards. Restore all physical definitions after each test.
const cards=allEnemyCards().slice(0,5),original=cards.map(c=>JSON.parse(JSON.stringify(c)));
beforeEach(()=>cards.forEach((c,i)=>{
 for(const k of Object.keys(c))delete (c as any)[k];
 Object.assign(c,{id:original[i].id,name:'test',owner:'test',type:'action',ap:1,fx:{}});
}));
afterEach(()=>cards.forEach((c,i)=>{for(const k of Object.keys(c))delete (c as any)[k];Object.assign(c,original[i]);}));
function state(n=2):GameState{
 const {state:s}=makeCombatState({playerHp:80,enemyHp:60});
 s.enemy!.maxHp=60;s.enemy!.statusEffects=[];s.player.statusEffects=[];s.player.block=0;
 s.minions=[];s.enemyMinions=[];s.equipped=[];s.blessings=[];s.fight={hpLost:0,ghostTurns:1} as GameState['fight'];
 s.enemyPiles={hand:cards.slice(0,n).map(c=>c.id),draw:[],discard:[]};s.enemyHandAges=Array(n).fill(0);
 s.enemyHandSize=5;s.enemyDrawPerTurn=2;s.enemyMaxRetained=2;return s;
}
const plan=(s:GameState,ap=1)=>chooseEnemyCardIndexes(s,s.enemyPiles!.hand,ap);
const set=(i:number,c:Partial<EnemyCardDef>)=>Object.assign(cards[i],c);

describe('expanded ghost decks: public board tactics',()=>{
 it('plays block before its self-block payoff and resolves the advertised bonus',()=>{
  set(0,{type:'attack',fx:{dmg:2},conditional:{when:{kind:'player_block_at_least',value:4},bonus:{dmg:5}}});
  set(1,{fx:{block:4}});const s=state();expect(plan(s)).toEqual([1,0]);
  for(const i of plan(s))resolveEnemyCard(s,cards[i]);expect(s.player.hp).toBe(73);
 });
 it('spends the small hit on the visible guard before the large hit',()=>{
  set(0,{type:'attack',fx:{dmg:10}});set(1,{type:'attack',fx:{dmg:2}});
  const s=state();summonMinion(s,'player','senior_boxer');expect(plan(s)).toEqual([1,0]);
  for(const i of plan(s))resolveEnemyCard(s,cards[i]);expect(s.player.hp).toBe(70);expect(s.minions![0].hp).toBe(12);
 });
 it('does not mistake damage into a guard for a lethal charge exception',()=>{
  set(0,{type:'attack',fx:{dmg:10},charge:{dmg:3}});const s=state(1);s.player.hp=5;
  summonMinion(s,'player','senior_boxer');expect(plan(s)).toEqual([]);
  s.minions=[];expect(plan(s)).toEqual([0]);
 });
 it('does not mistake a dodged hit for a lethal charge exception',()=>{
  set(0,{type:'attack',fx:{dmg:10},charge:{dmg:3}});const s=state(1);s.player.hp=5;
  s.player.statusEffects=[{id:'dodge',name:'',description:'',duration:1,stacks:1}];expect(plan(s)).toEqual([]);
 });
 it('holds an unfinished charge that visible damage-cap equipment prevents from killing',()=>{
  set(0,{type:'attack',fx:{dmg:6},charge:{dmg:3}});const s=state(1);s.player.hp=5;s.enemyHandAges=[1];
  s.equipped=[JSON.parse(JSON.stringify(cardById('arm_prajiad')!))];s.equipped[0].chargesLeft=3;
  const before=JSON.stringify(s);expect(plan(s)).toEqual([]);expect(JSON.stringify(s)).toBe(before);
  resolveEnemyCard(s,cards[0],1);expect(s.player.hp).toBe(1);expect(s.equipped[0].chargesLeft).toBe(2);
 });
 it('holds an unfinished charge that visible death-save equipment prevents from killing',()=>{
  set(0,{type:'attack',fx:{dmg:6},charge:{dmg:3}});const s=state(1);s.player.hp=5;s.enemyHandAges=[1];
  s.equipped=[JSON.parse(JSON.stringify(cardById('takrut')!))];
  expect(plan(s)).toEqual([]);resolveEnemyCard(s,cards[0],1);
  expect(s.player.hp).toBe(1);expect(s.player.block).toBe(10);expect(s.equipped).toEqual([]);
 });
 it('continues a lethal line after consuming a death save and its granted block',()=>{
  set(0,{type:'attack',fx:{dmg:9}});set(1,{type:'attack',fx:{dmg:11}});const s=state();s.player.hp=5;
  s.equipped=[JSON.parse(JSON.stringify(cardById('takrut')!))];expect(plan(s)).toEqual([0,1]);
  for(const i of plan(s))resolveEnemyCard(s,cards[i]);expect(s.player.hp).toBe(0);
 });
 it('carries equipment exhaustion across cards before testing a charge lethal exception',()=>{
  set(0,{type:'attack',fx:{dmg:9}});set(1,{type:'attack',fx:{dmg:6},charge:{dmg:3}});
  const s=state();s.player.hp=10;s.enemyHandAges=[0,1];
  s.equipped=[{...JSON.parse(JSON.stringify(cardById('arm_prajiad')!)),chargesLeft:1}];
  expect(plan(s)).toEqual([0,1]);resolveEnemyCard(s,cards[0]);expect(s.player.hp).toBe(6);expect(s.equipped).toEqual([]);
  resolveEnemyCard(s,cards[1],1);expect(s.player.hp).toBe(0);
 });
 it('consumes caps per hit, before dodge, while leaving sweep damage uncapped',()=>{
  set(0,{type:'attack',fx:{dmg:6,hits:3,sweep:true},charge:{dmg:3}});const s=state(1);s.player.hp=10;s.enemyHandAges=[1];
  s.equipped=[{...JSON.parse(JSON.stringify(cardById('arm_prajiad')!)),chargesLeft:1}];
  s.player.statusEffects=[{id:'dodge',name:'',description:'',duration:1,stacks:1}];
  summonMinion(s,'player','corner_man')!.hp=9;
  expect(plan(s)).toEqual([0]);resolveEnemyCard(s,cards[0],1);
  expect(s.player.hp).toBe(0);expect(s.equipped).toEqual([]);expect(s.minions).toEqual([]);
 });
 it('values drain when wounded, but not when a guard absorbs all its damage',()=>{
  set(0,{fx:{dmg:4,drain:true}});set(1,{fx:{dmg:7}});const s=state();s.enemy!.hp=10;
  expect(plan(s)).toEqual([0]);summonMinion(s,'player','senior_boxer');expect(plan(s)).toEqual([1]);
 });
 it('chooses sweep to remove visible support minions and ordinary damage on an empty board',()=>{
  set(0,{fx:{dmg:3,sweep:true}});set(1,{fx:{dmg:6}});const s=state();
  expect(plan(s)).toEqual([1]);summonMinion(s,'player','camp_pupil')!.hp=3;summonMinion(s,'player','corner_man')!.hp=3;
  expect(plan(s)).toEqual([0]);resolveEnemyCard(s,cards[0]);expect(s.minions).toEqual([]);
 });
 it('does not play an entangled attack for its cancelled heal or status',()=>{
  set(0,{type:'attack',fx:{dmg:5,heal:10,status:[{id:'strength',to:'self',stacks:2,turns:2}]}});
  const s=state(1);s.enemy!.hp=10;s.enemy!.statusEffects=[{id:'entangle',name:'',description:'',duration:1}];
  expect(plan(s)).toEqual([]);
 });
 it('does not replace a healthy identical summon; can replace a wounded oldest copy',()=>{
  set(0,{fx:{summon:'pong_monkey'}});const s=state(1);
  for(let i=0;i<MINION_RULES.enemySlots;i++)summonMinion(s,'enemy','pong_monkey');
  expect(enemySummonValue(s,'pong_monkey')).toBe(0);expect(plan(s)).toEqual([]);
  s.enemyMinions![0].hp=1;expect(plan(s)).toEqual([0]);
 });
 it('tracks summon capacity across the chosen sequence instead of valuing more vacant slots than exist',()=>{
  for(let i=0;i<4;i++)set(i,{fx:{summon:'pong_monkey'}});const s=state(4);
  expect(plan(s,4)).toEqual([0,1,2]);
 });
 it('retains both setup and payoff when competing with unpaired raw damage',()=>{
  set(0,{fx:{status:[{id:'poison',to:'enemy',stacks:1,turns:2}]}});
  set(1,{type:'attack',fx:{dmg:2},perFoeStatus:{statusId:'poison',dmg:3}});
  set(2,{type:'attack',fx:{dmg:8}});const s=state(3);finishEnemyHand(s,0);
  expect(s.enemyPiles!.hand).toEqual([cards[0].id,cards[1].id]);expect(s.enemyHandAges).toEqual([1,1]);
 });
 it('retains a useful summon instead of treating it as an empty-effect card',()=>{
  set(0,{fx:{summon:'pong_monkey'}});set(1,{fx:{block:2}});const s=state();s.enemyMaxRetained=1;
  finishEnemyHand(s,0);expect(s.enemyPiles!.hand).toEqual([cards[0].id]);
 });
 it('is deterministic, leaves input untouched, ignores hidden information, and never overspends at hand five',()=>{
  set(0,{fx:{block:4}});set(1,{fx:{dmg:4,drain:true}});set(2,{fx:{summon:'pong_monkey'}});
  set(3,{type:'attack',fx:{dmg:3}});set(4,{fx:{status:[{id:'strength',to:'self',stacks:1,turns:2}]}});
  const s=state(5),before=JSON.stringify(s),expected=plan(s,2);
  expect(JSON.stringify(s)).toBe(before);
  for(const key of ['piles','masterDeck','rng','counters'])Object.defineProperty(s,key,{get(){throw Error('hidden '+key);},configurable:true});
  const start=performance.now();for(let i=0;i<100;i++)expect(plan(s,2)).toEqual(expected);
  expect(performance.now()-start).toBeLessThan(3000);
  expect(expected.reduce((n,i)=>n+enemyCardCost(cards[i]),0)).toBeLessThanOrEqual(2);
 });
});


describe('late elite/boss draw cadence',()=>{
 it.each([1,2,3])('night %i: gates actual ghost turns and respects free hand slots',night=>{
  for(const kind of ['normal','elite','boss'])for(const turn of [0,1,2,3,4,5,6,7,8,9])for(const held of [0,3,4,5]){
   const s=state(0);s.campaign={night} as GameState['campaign'];s.fight!.ghostTurns=turn;
   s.pages={_activeOfferIndex:0,current:{offers:[kind==='boss'?{kind:'boss'}:{kind:'monster',tier:kind==='elite'?'elite':'T1'}]}} as any;
   s.enemyHandAges=Array(held).fill(0);s.enemy!.ap=2;
   s.enemyPiles={hand:Array(held).fill(cards[0].id),draw:Array(5).fill(cards[0].id),discard:[]};
   const eligible=night>=2&&kind!=='normal';
   expect(enemyDrawCadence(s)).toEqual(eligible?{extra:1,every:3}:undefined);
   drawEnemyHand(s);const extra=eligible&&turn>0&&turn%3===0?1:0;
   expect(s.enemyPiles.hand.length).toBe(Math.min(5,held+2+extra));expect(s.enemy!.ap).toBe(2);expect(s.enemyDrawPerTurn).toBe(2);
   expect(s.enemyHandAges).toHaveLength(s.enemyPiles.hand.length);
  }
 });
 it('adds to a saved custom base draw without overwriting it and survives a JSON round-trip',()=>{
  const s=state(0);s.campaign={night:2} as GameState['campaign'];s.fight!.ghostTurns=3;
  s.pages={_activeOfferIndex:0,current:{offers:[{kind:'boss'}]}} as any;
  s.enemyDrawPerTurn=1;s.enemyPiles!.draw=Array(5).fill(cards[0].id);
  const loaded=JSON.parse(JSON.stringify(s)) as GameState;drawEnemyHand(s);drawEnemyHand(loaded);
  expect(s.enemyPiles!.hand).toHaveLength(2);expect(s.enemyDrawPerTurn).toBe(1);expect(loaded.enemyPiles).toEqual(s.enemyPiles);
 });
});
