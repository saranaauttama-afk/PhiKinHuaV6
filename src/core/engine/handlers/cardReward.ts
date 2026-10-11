// src/core/engine/handlers/cardReward.ts — เลือกการ์ดรางวัลหลังชนะไฟต์

import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { takeCardReward, skipCardReward as clearReward } from '../../cards/reward';
import { advanceAfterVictory } from '../shared';

export function chooseCardReward(
  s: GameState,
  cmd: Extract<Command, { type: 'ChooseCardReward' }>,
  r: RNG
) {
  if (s.phase !== 'reward' || !s.cardReward) return { state: s, rng: r };

  takeCardReward(s, cmd.index);
  advanceAfterVictory(s);
  return { state: s, rng: r };
}

export function skipCardReward(
  s: GameState,
  _cmd: Extract<Command, { type: 'SkipCardReward' }>,
  r: RNG
) {
  if (s.phase !== 'reward' || !s.cardReward) return { state: s, rng: r };

  clearReward(s);
  advanceAfterVictory(s);
  return { state: s, rng: r };
}
