import {describe,it,expect} from 'vitest';
import {playRun} from '../scripts/pilot';
import {ALL_CLASS_IDS} from '../src/core/classes';

// The balance CLI is only useful if every run reaches a real ending and every fight is recorded.
describe('balance pilot',()=>{
 for(const cls of ALL_CLASS_IDS)it(`${cls}: a full run ends without stalling and records the final fight`,()=>{
  const run=playRun(`pilot-${cls}`,cls,1);
  expect(run.stalled).toBe(false);
  expect(run.fights.length).toBeGreaterThan(0);
  const last=run.fights.at(-1)!;
  if(run.won)expect(last.kind).toBe('boss');else expect(last.won).toBe(false);
  expect(run.fights.slice(0,-1).every(f=>f.won)).toBe(true);
 });
});
