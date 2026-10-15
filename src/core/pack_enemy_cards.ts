// src/core/pack_enemy_cards.ts — ghost cards, in the same shape as player cards.
// Statuses are written from the ghost's side: `to: 'self'` is the ghost, `to: 'enemy'` is the player.
// Attacks are free; actions cost the ghost's AP.
import type { CardData, Fx } from './types';
import enemyCardsJson from '../data/packs/base/enemy_cards.json';

export type EnemyCardDef = CardData & {
  type: 'attack' | 'action';
  /** The ghost (or deck theme) the card belongs to. */
  owner: string;
  /** A curse card put into the player's discard pile. */
  curseCard?: string;
  /**
   * ชาร์จ: added once per ghost turn the card has waited in hand (GHOST_MECHANICS.chargeMaxTurns).
   * Mirrors the player's ท่าหนัก: something heavy is coming, and the player can see it build.
   */
  charge?: Fx;
  /** ซ้ำแผล: +dmg per stack of this status on the player (ผีเปรต ปากเท่ารูเข็ม). */
  perFoeStatus?: { statusId: string; dmg: number };
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
