// src/core/pack_enemy_cards.ts — ghost cards, in the same shape as player cards.
// Statuses are written from the ghost's side: `to: 'self'` is the ghost, `to: 'enemy'` is the player.
// Attacks are free; actions cost the ghost's AP.
import type { CardData } from './types';
import enemyCardsJson from '../data/packs/base/enemy_cards.json';

export type EnemyCardDef = CardData & {
  type: 'attack' | 'action';
  /** The ghost (or deck theme) the card belongs to. */
  owner: string;
  /** A curse card put into the player's discard pile. */
  curseCard?: string;
};

const ALL: EnemyCardDef[] = enemyCardsJson as any;
const BY_ID = new Map(ALL.map(c => [c.id, c]));

export function enemyCardById(id: string): EnemyCardDef | undefined {
  return BY_ID.get(id);
}

export function allEnemyCards(): EnemyCardDef[] {
  return ALL.slice();
}

/** AP the ghost pays for a card: attacks are free. */
export function enemyCardCost(c: EnemyCardDef): number {
  return c.type === 'attack' ? 0 : c.ap ?? 1;
}
