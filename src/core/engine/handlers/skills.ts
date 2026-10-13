// src/core/engine/handlers/skills.ts — UseSkill command.
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { useSkill as runSkill } from '../../skills';
import { settleCombat } from './combat';

export function useSkill(s: GameState, cmd: Extract<Command, { type: 'UseSkill' }>, r: RNG) {
  const out = runSkill(s, cmd.id, r, cmd.index);
  if (!out.used) return { state: s, rng: r };
  r = out.rng;
  if (s.phase === 'combat') r = settleCombat(s, r);
  return { state: s, rng: r };
}
