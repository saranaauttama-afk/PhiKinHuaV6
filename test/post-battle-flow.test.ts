import {describe,it,expect} from 'vitest';
import {needsVictoryIntro} from '../app/postBattleFlow';
describe('victory summary before upgrade/card rewards',()=>{
 it.each(['levelup','reward','victory'] as const)('shows summary before %s and only once in a fight',phase=>{
  expect(needsVictoryIntro(phase,1,-1)).toBe(true);
  expect(needsVictoryIntro(phase,1,1)).toBe(false);
  expect(needsVictoryIntro(phase,2,1)).toBe(true);
 });
 it.each(['combat','defeat','map','menu'] as const)('never celebrates %s',phase=>expect(needsVictoryIntro(phase,1,-1)).toBe(false));
});
