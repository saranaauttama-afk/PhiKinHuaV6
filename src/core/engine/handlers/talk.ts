// src/core/engine/handlers/talk.ts — answering a ghost after a win (ความกล้า / บุญ).
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { answerGhostTalk } from '../../campaign/alignment';
import { advanceAfterVictory } from '../shared';

export function answer(s: GameState, cmd: Extract<Command, { type: 'AnswerGhostTalk' }>, r: RNG) {
  if (s.phase !== 'talk' || !answerGhostTalk(s, cmd.choice)) return { state: s, rng: r };
  advanceAfterVictory(s);
  return { state: s, rng: r };
}
