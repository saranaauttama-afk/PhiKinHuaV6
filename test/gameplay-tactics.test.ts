import {describe,it,expect} from 'vitest';
import {makeCombatState,attackCard} from './helpers';
import {applyCommand} from '../src/core/reducer';
import {cardById} from '../src/core/pack';
import {enemyCardById} from '../src/core/pack_enemy_cards';
import {chooseEnemyCards} from '../src/core/combat/enemyPlan';
import {applyStatusEffect} from '../src/core/statusEffectsRuntime';
import {effectiveCost} from '../src/core/cards/mechanics';
import {rollLevelUpChoice} from '../src/core/level';
import {makeRng} from '../src/core/rng';

describe('live tactical rules',()=>{
 it('enemy searches past an unaffordable early card and spends the real budget',()=>{
  const {state}=makeCombatState();
  const ids=['pong_fury','dancer_steps','pop_feast'];
  const plan=chooseEnemyCards(state,ids,2);
  expect(plan.length).toBeGreaterThan(0);
  expect(plan.reduce((n,id)=>n+enemyCardById(id)!.energyCost,0)).toBeLessThanOrEqual(2);
  const reordered=chooseEnemyCards(state,[...ids].reverse(),2);
  expect([...plan].sort()).toEqual([...reordered].sort());
 });
 it('entangle rejects attacks before charging or moving the card',()=>{
  const {state,rng}=makeCombatState({hand:[attackCard(3,{cost:1})]});
  applyStatusEffect('player',state,'entangle',2);
  const out=applyCommand(state,{type:'PlayCard',index:0},rng).state;
  expect(out.player.energy).toBe(state.player.energy);expect(out.piles.hand).toHaveLength(1);
 });
 it('corruption raises the charged cost as well as the displayed cost',()=>{
  const {state,rng}=makeCombatState({hand:[attackCard(3,{cost:1})],playerEnergy:3});
  applyStatusEffect('player',state,'corruption',2,1);
  expect(effectiveCost(state,state.piles.hand[0])).toBe(2);
  const out=applyCommand(state,{type:'PlayCard',index:0},rng).state;
  expect(out.player.energy).toBe(1);
 });
 it('dispel cleanses debuffs while retaining a positive strength effect',()=>{
  const {state,rng}=makeCombatState({hand:[cardById('dispel_ill')!]});
  applyStatusEffect('player',state,'poison',2,2);
  applyStatusEffect('player',state,'weakness',2);
  applyStatusEffect('player',state,'strength',2,2);
  const out=applyCommand(state,{type:'PlayCard',index:0},rng).state;
  expect(out.player.statusEffects?.map(e=>e.id)).toEqual(['strength']);
 });
 it('conditional draw really draws through the live play handler',()=>{
  const card=attackCard(1,{cost:1,conditional:{when:{kind:'player_block_at_least',value:5},bonus:{draw:2}}});
  const {state,rng}=makeCombatState({hand:[card],playerBlock:5});
  state.piles.draw=[attackCard(1,{id:'a'}),attackCard(1,{id:'b'})];
  const out=applyCommand(state,{type:'PlayCard',index:0},rng).state;
  expect(out.piles.hand.map(c=>c.id)).toEqual(['a','b']);
 });
 it('enemy poison ticks, weakness expires and escalation appears after attacks',()=>{
  const {state,rng}=makeCombatState({enemyHp:100,playerBlock:100});
  state.runMode='episode';state.turn=3;state.enemyIntent={cardIds:[],damage:0,block:0} as any;
  applyStatusEffect('enemy',state,'poison',2,3);applyStatusEffect('enemy',state,'weakness',1);
  const out=applyCommand(state,{type:'ResolveEnemyTurn'},rng).state;
  expect(out.enemy!.hp).toBe(state.enemy!.hp-3);
  expect(out.enemy!.statusEffects?.some(e=>e.id==='weakness')).toBe(false);
  expect(out.enemy!.statusEffects?.find(e=>e.id==='strength')?.stacks).toBe(2);
  expect(out.enemy!.statusEffects?.find(e=>e.id==='strength')?.duration).toBe(99);
  expect(out.enemyLastPlayed).toEqual([]);
 });
 it('episode never offers a fifth energy point',()=>{
  const {state}=makeCombatState();state.runMode='episode';state.player.maxEnergy=4;
  for(let n=0;n<50;n++){
   const {choice}=rollLevelUpChoice(makeRng(`energy-cap-${n}`),state);
   expect([choice.optionA,choice.optionB]).not.toContain('max_energy');
  }
 });
});
