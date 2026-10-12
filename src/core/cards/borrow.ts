// src/core/cards/borrow.ts — the medium copies what the ghost just did.
import type { CardData, GameState } from '../types';
import type { EnemyCardDef } from '../pack_enemy_cards';
import { enemyCardById } from '../pack_enemy_cards';
import { lastEnemyCards } from './model';

/**
 * An enemy card as a player card. Damage and block keep their numbers; a status the
 * ghost put on us lands on the ghost, and a buff it gave itself becomes ours.
 */
export function cardFromEnemy(def: EnemyCardDef, borrowed = false): CardData {
  const status = def.statusEffect
    ? [{ id: def.statusEffect.effect, stacks: def.statusEffect.value, turns: def.statusEffect.duration,
        to: (def.statusEffect.target === 'player' ? 'enemy' : 'self') as 'enemy' | 'self' }]
    : undefined;
  return {
    id: def.id, name: def.name ?? def.id,
    type: def.dmg ? 'attack' : 'action', ap: 0,
    fx: { dmg: def.dmg || undefined, hits: def.hits, block: def.block || undefined, heal: def.heal || undefined, status },
    ...(borrowed ? { borrowed: true, exhaust: true } : {}),
    flavor: def.desc,
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
