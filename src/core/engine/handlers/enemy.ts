// src/core/engine/handlers/enemy.ts — the ghost's deck at the start of a fight.
// The ghost's turn itself is `resolveEnemyTurn` in combat.ts.
import type { GameState } from '../../types';
import type { RNG } from '../../rng';
import { int } from '../../rng';
import { NIGHT_ENEMY_DECKS } from '../../campaign/enemyDecks';
import { ENEMY_RULES } from '../../balance/notfm';
import { drawEnemyHand, enemyKind, initializeEnemyHand } from '../../combat/enemyHand';

function shuffleIds(ids: string[], r: RNG) {
  const a = ids.slice();
  let rr = r;
  for (let i = a.length - 1; i > 0; i--) {
    const ro = int(rr, 0, i);
    rr = ro.rng;
    [a[i], a[ro.value]] = [a[ro.value], a[i]];
  }
  return { arr: a, rng: rr };
}

/** Shuffle the ghost's deck and reset its hand. AP refills at the start of each ghost turn. */
export function buildAndShuffleEnemyDeck(s: GameState, r: RNG) {
  if (!s.enemy) return { state: s, rng: r };
  const ids = s.enemy.deck ?? NIGHT_ENEMY_DECKS[s.enemy.id] ?? [];
  s.enemy.deck = ids.slice();
  const sh = shuffleIds(ids, r);
  s.enemyPiles = { draw: sh.arr, hand: [], discard: [] };
  const rules = ENEMY_RULES[enemyKind(s)];
  s.enemy.maxAp = s.enemy.maxAp ?? rules.ap;
  s.enemy.ap = 0;
  s.enemy.handCount = 0;
  s.enemy.handCharges = undefined;
  s.enemyHandSize = rules.handSize;
  s.enemy.handSize = rules.handSize;
  s.enemyDrawPerTurn = undefined; s.enemyMaxRetained = undefined; s.enemyHandAges = []; s.enemyIdleTurns = 0;
  initializeEnemyHand(s);
  return { state: s, rng: sh.rng };
}

export const enemyDrawUpToHand = drawEnemyHand;
