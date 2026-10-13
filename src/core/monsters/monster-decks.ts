// src/core/monsters/monster-decks.ts — each ghost's own deck.
// Decks live in campaign/enemyDecks.ts; card data in data/packs/base/enemy_cards.json.
import type { ThaiGhostData } from './thai-ghosts';
import { NIGHT_ENEMY_DECKS } from '../campaign/enemyDecks';

/** Card ids in this ghost's deck. */
export function deckForMonster(monster: ThaiGhostData): string[] {
  return [...(NIGHT_ENEMY_DECKS[monster.id] ?? [])];
}

/** Ghosts that have no deck (should be none). */
export function monstersWithoutDeck(all: ThaiGhostData[]): string[] {
  return all.filter(m => !NIGHT_ENEMY_DECKS[m.id]?.length).map(m => m.id);
}
