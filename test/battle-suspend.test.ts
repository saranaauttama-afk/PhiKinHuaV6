import {describe,it,expect} from 'vitest';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {toBattleSave,fromSave,isPlayableSave} from '../src/core/save';
import type {Command,GameState} from '../src/core/types';
function fight(){
 let state=baseNewState('suspend'),rng=makeRng('suspend');
 const go=(cmd:Command)=>{const result=applyCommand(state,cmd,rng);state=result.state;rng=result.rng;};
 go({type:'NewRun',seed:'suspend',classId:'medium',runMode:'episode'});
 while(state.chapter)go({type:'SkipChapter'});
 go({type:'ChooseStarterBlessing',index:0});
 while(state.chapter)go({type:'SkipChapter'});
 const index=state.pages!.current!.offers.findIndex(o=>o.kind==='monster');
 go({type:'ChooseOffer',index});
 return {get:()=>({state,rng}),go};
}
describe('paused battle resume',()=>{
 it('keeps the actual player turn, piles, helpers and unresolved node after serialization',()=>{
  const f=fight();f.go({type:'PlayCard',index:0});const {state,rng}=f.get();
  const save=JSON.parse(JSON.stringify(toBattleSave(state,rng))),restored=fromSave(save);
  expect(isPlayableSave(save)).toBe(true);
  expect(restored).toEqual({...state,pendingEvents:[],deckOpen:false});
  expect(restored.enemy).toEqual(state.enemy);expect(restored.pages).toEqual(state.pages);
  expect(restored.minions).toEqual(state.minions);expect(restored.piles).toEqual(state.piles);
  // Compare the next real enemy resolution to detect RNG reset or repeated helper effects.
  expect(applyCommand(restored,{type:'ResolveEnemyTurn'},save.battleRng)).toEqual(applyCommand({...state,pendingEvents:[],deckOpen:false},{type:'ResolveEnemyTurn'},rng));
 });
 it('cannot advance or complete an unfinished battle even through a map command',()=>{
  const {state,rng}=fight().get();
  for(const type of ['Proceed','CompleteNode'] as const){
   const result=applyCommand(state,{type},rng);expect(result.state).toEqual(state);expect(result.rng).toEqual(rng);
  }
 });
 it('rejects a victory snapshot so unclaimed rewards cannot turn into a repeated fight',()=>{
  const {state,rng}=fight().get();
  expect(()=>toBattleSave({...state,phase:'victory'},rng)).toThrow();
  expect(()=>toBattleSave({...state,enemy:undefined},rng)).toThrow();
 });
 it('restored state is detached from its save and has no stale presentation events',()=>{
  const {state,rng}=fight().get();const save=toBattleSave(state,rng),restored=fromSave(save);
  restored.player.hp-=1;expect(save.state.player!.hp).toBe(state.player.hp);expect(restored.pendingEvents).toEqual([]);
 });
});
