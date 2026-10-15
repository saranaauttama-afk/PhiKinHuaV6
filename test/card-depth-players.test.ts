import { describe, it, expect } from 'vitest';
import { makeCombatState } from './helpers';
import { cardById, poolFor } from '../src/core/pack';
import { playCard } from '../src/core/cards/play';
import { makeRng } from '../src/core/rng';
import { resetCardsPlayed } from '../src/core/cards/mechanics';
import { summonMinion } from '../src/core/combat/minions';
import { endTurnRhythm, resolveRipostes } from '../src/core/cards/fighter';
import { yantOn } from '../src/core/cards/water';
import type { GameState } from '../src/core/types';
const rng = makeRng('card-depth');
function fight(ids: string[], classId: 'warrior' | 'shaman' = 'warrior') {
 const { state: s } = makeCombatState({ hand: ids.map(id => ({ ...cardById(id)!, star: 1 })), enemyHp: 200, playerAp: 3 });
 s.classId = classId; s.player.maxHp = 60; s.player.statusEffects = []; s.enemy!.statusEffects = [];
 s.fight = { hpLost: 0, ghostTurns: 0, rhythm: 0 }; s.turn = 1; s.turnFlags = { blessingOnce: {} }; resetCardsPlayed(s);
 s.enemyPiles = { draw: [], hand: [], discard: [] }; s.enemyHandAges = [];
 return s;
}
function play(s: GameState) { expect(playCard(s, 0, rng).played).toBe(true); }
describe('player build bridges', () => {
 it('punch into defensive elbow keeps move rhythm while earning meaningful guard', () => {
  const s = fight(['jab','guarding_elbow']); play(s); play(s);
  expect(s.player.block).toBe(6); expect(s.fight!.rhythm).toBe(1);
  endTurnRhythm(s); expect(s.fight!.rhythm).toBe(1);
 });
 it('kick into checking knee creates a bruise without consuming the heavy setup', () => {
  const s = fight(['low_kick','checking_knee','slant_elbow']); play(s); play(s);
  expect(s.player.block).toBe(4); expect(s.enemy!.statusEffects!.find(e => e.id === 'bruise')?.stacks).toBe(1);
  const before=s.enemy!.hp; play(s); expect(before-s.enemy!.hp).toBeGreaterThan(6);
  expect(s.enemy!.statusEffects!.some(e => e.id === 'bruise')).toBe(false);
 });
 it('camp care heals survivors and adds round-end protection, without healing the player', () => {
  const s=fight(['corner_towel']); const m=summonMinion(s,'player','camp_pupil')!; m.hp=1; s.turn=3;
  const hp=s.player.hp; play(s); expect(m.hp).toBe(5); expect(s.player.block).toBe(8); expect(s.player.hp).toBe(hp); expect(s.player.ap).toBe(2);
 });
 it('bruise guard bridges stored marks into a successful riposte', () => {
  const s=fight(['stare_down','bruise_guard']); play(s); play(s);
  expect(s.player.block).toBe(12); const hp=s.enemy!.hp;
  resolveRipostes(s,s.player.hp,true,rng); expect(s.enemy!.hp).toBe(hp-5); expect(s.fight!.ripostes).toEqual([]);
 });
 it('breathing draws only with rhythm and spends AP; holding posture preserves rhythm', () => {
  for (const rhythm of [0,3]) { const s=fight(['measured_breath']); s.fight!.rhythm=rhythm; s.piles.draw=[cardById('jab')!]; play(s);
   expect(s.piles.hand.length).toBe(rhythm ? 1 : 0); expect(s.player.ap).toBe(2); endTurnRhythm(s); expect(s.fight!.rhythm).toBe(rhythm);
  }
 });
 it('ladle plus full-bowl yant turns conserved water into a seal, without spending the bowl', () => {
  const s=fight(['yant_ladle','brimming_yant'],'shaman'); s.player.mana=6;
  s.enemy!.statusEffects=[{id:'yant',stacks:1,duration:99,name:'ยันต์',description:'test setup'}]; s.enemyPiles!.hand=['phi_pop_n1_gape']; s.enemyHandAges=[2];
  play(s); expect(s.player.mana).toBe(8); play(s);
  expect(s.enemyPiles!.hand).toHaveLength(0); expect(yantOn(s)).toBe(0); expect(s.player.mana).toBe(10);
 });
 it('charged ghosts enable threaded needle; uncharged hands do not', () => {
  for(const age of [0,2]) { const s=fight(['threaded_needle'],'shaman'); s.enemyPiles!.hand=['phi_pop_n1_gape']; s.enemyHandAges=[age]; play(s); expect(yantOn(s)).toBe(age ? 2 : 0); }
 });
 it('familiar ward gives fallback guard, but a living familiar unlocks the stronger defense', () => {
  for(const alive of [false,true]) { const s=fight(['familiar_ward'],'shaman'); s.player.mana=1;
   if(alive) { const m=summonMinion(s,'player','hun_payon')!; m.hp=4; }
   play(s); expect(s.player.block).toBe(alive?9:5); expect(s.player.mana).toBe(0); if(alive) expect(s.minions![0].hp).toBe(7);
  }
 });
 it('blood thread can be paid in HP but never returns water, HP, AP or cards', () => {
  const s=fight(['blood_thread'],'shaman'); s.player.hp=25; play(s);
  expect(s.player.hp).toBe(21); expect(s.player.mana).toBe(0); expect(s.player.block).toBe(9); expect(yantOn(s)).toBe(2); expect(s.piles.hand).toHaveLength(0);
 });
 it('late bowl rite needs stored water and two AP to turn an existing mark into seal', () => {
  for(const water of [7,8]) { const s=fight(['sealed_bowl_rite'],'shaman'); s.player.mana=water; s.enemy!.statusEffects=[{id:'yant',stacks:1,duration:99,name:'ยันต์',description:'test setup'}]; s.enemyPiles!.hand=['phi_pop_n1_gape']; s.enemyHandAges=[2]; play(s);
   expect(s.enemyPiles!.hand.length).toBe(water===8?0:1); expect(s.player.mana).toBe(water===8?10:7); expect(s.player.ap).toBe(1);
  }
 });
 it('camp and familiar sweeps hurt every hostile minion while preserving allies', () => {
  for(const [id,classId] of [['temple_ring_sweep','warrior'],['spirit_rice_scatter','shaman']] as const) {
   const s=fight([id],classId); s.player.mana=2;
   const ally=summonMinion(s,'player',classId==='warrior'?'camp_pupil':'hun_payon')!; ally.hp=2;
   const foes=[summonMinion(s,'enemy','camp_pupil')!,summonMinion(s,'enemy','corner_man')!];
   const before=foes.map(m=>m.hp); play(s);
   for(let i=0;i<foes.length;i++) expect(foes[i].hp).toBeLessThan(before[i]);
   expect(ally.hp).toBe(classId==='warrior'?2:5);
  }
 });
 it('last bell elbow cashes bruises on any turn but only gives guard at round end', () => {
  for(const turn of [2,3]) { const s=fight(['last_bell_elbow']); s.turn=turn;
   s.enemy!.statusEffects=[{id:'bruise',stacks:3,duration:99,name:'ช้ำ',description:'test setup'}]; play(s);
   expect(s.enemy!.statusEffects!.some(e=>e.id==='bruise')).toBe(false);
   expect(s.enemy!.hp).toBeLessThan(193); expect(s.player.block).toBe(turn===3?10:0);
  }
 });
 it('early bridge packages are obtainable at milestone zero and cannot leak into the other class', () => {
  const early={warrior:['guarding_elbow','checking_knee','corner_towel','bruise_guard'],shaman:['yant_ladle','threaded_needle','familiar_ward','brimming_yant']};
  for(const classId of ['warrior','shaman'] as const) for(const id of early[classId]) {
   expect(poolFor(classId).some(c=>c.id===id)).toBe(true);
   expect(poolFor(classId==='warrior'?'shaman':'warrior').some(c=>c.id===id)).toBe(false);
  }
 });
});
