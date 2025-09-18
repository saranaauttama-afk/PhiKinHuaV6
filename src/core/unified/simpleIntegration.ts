/**
 * Simple Integration for Unified System
 * A working integration that doesn't modify existing types
 */

import { GameState } from '../types';
import { RNG } from '../rng';

/**
 * Check if unified system should be used for current combat
 */
export function shouldUseUnifiedSystem(gameState: GameState): boolean {
  // Enable for phi-krasue specifically
  if (gameState.enemy?.id === 'phi-krasue') {
    return true;
  }

  // Enable for other specific monsters
  const unifiedMonsters = ['phi-pop', 'phi-krahang'];
  if (gameState.enemy?.id && unifiedMonsters.includes(gameState.enemy.id)) {
    return true;
  }

  return false;
}

/**
 * Get enemy data for unified system
 */
export function getEnemyForUnified(gameState: GameState): { id: string; behavior: any } | null {
  if (!gameState.enemy) return null;

  const enemyId = gameState.enemy.id;

  // Create behavior config based on enemy type
  let behavior: any;

  switch (enemyId) {
    case 'phi-krasue':
      behavior = {
        id: enemyId,
        type: 'deck',
        deck: {
          cards: ['krasue_claw', 'krasue_guard', 'krasue_swipe'],
          handSize: 3,
          energyPerTurn: 3,
          drawPerTurn: 3,
          shuffleOnEmpty: true
        }
      };
      break;

    case 'phi-pop':
      behavior = {
        id: enemyId,
        type: 'deck',
        deck: {
          cards: ['pop_strike', 'pop_defend'],
          handSize: 2,
          energyPerTurn: 2,
          drawPerTurn: 2,
          shuffleOnEmpty: true
        }
      };
      break;

    default:
      return null;
  }

  return { id: enemyId, behavior };
}

/**
 * Simple logging for debugging
 */
export function logUnifiedState(message: string, data?: any): void {
  console.log(`[Unified] ${message}`, data || '');
}