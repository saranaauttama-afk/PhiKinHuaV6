// src/core/cards/borrow.ts — the medium copies what the ghost just did.
import type { CardData, GameState } from '../types';
import type { EnemyCardDef } from '../pack_enemy_cards';
import { enemyCardById } from '../pack_enemy_cards';
import { lastEnemyCards } from './model';

/**
 * A ghost card as a player card. Ghost cards are already written from the owner's side,
 * so effects and conditions carry over as they are; only the curse a ghost puts into
 * our pile is left out.
 */
export function cardFromEnemy(def: EnemyCardDef, borrowed = false): CardData {
  return {
    id: def.id, name: def.name, type: def.type, ap: 0,
    fx: JSON.parse(JSON.stringify(def.fx)),
    ...(def.conditional ? { conditional: JSON.parse(JSON.stringify(def.conditional)) } : {}),
    ...(borrowed ? { borrowed: true, exhaust: true } : {}),
  };
}

let serial = 0;
/** Copies of the last `n` enemy cards go to hand. They are free and leave the fight once used. */
export function borrowEnemyCards(s: GameState, n: number): number {
  let added = 0;
  for (const id of lastEnemyCards(s, n)) {
    const def = enemyCardById(id);
    if (!def || s.piles.hand.length >= s.player.handMax) continue;
    const card = cardFromEnemy(def, true);
    card.name = 'ยืม·' + card.name;
    card.instanceId = `borrow__${id}__${(s.cardHistorySeq ?? 0)}_${++serial}`;
    s.piles.hand.push(card);
    added++;
  }
  if (added) s.log.push(`ยืมท่าผี ${added} ใบ`);
  return added;
}
