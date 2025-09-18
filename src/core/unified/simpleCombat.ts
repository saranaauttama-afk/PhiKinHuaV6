/**
 * Simple Unified Combat Handler
 * A working implementation without complex type dependencies
 */

import { GameState } from '../types';
import { RNG, next, shuffle } from '../rng';
import { shouldUseUnifiedSystem, getEnemyForUnified, logUnifiedState } from './simpleIntegration';
import { UnifiedCard } from './types';
import { createUnifiedCard, createMonsterDeck } from './cardFactory';
import { createEmptyPiles, setupDeck, drawCards, drawUpToHandSize, discardCard, exhaustCard } from './pileManager';
import { createEnergyState, spendEnergy, startTurnEnergy } from './energyManager';

// Store unified state in memory (separate from main game state)
let unifiedCombatState: {
  active: boolean;
  enemyId?: string;
  enemyHand: UnifiedCard[];
  enemyDraw: UnifiedCard[];
  enemyDiscard: UnifiedCard[];
  enemyEnergy: { current: number; maximum: number };
} = {
  active: false,
  enemyHand: [],
  enemyDraw: [],
  enemyDiscard: [],
  enemyEnergy: { current: 3, maximum: 3 }
};

/**
 * Initialize unified combat for specific enemy
 */
export function initializeUnifiedCombat(s: GameState, r: RNG): void {
  if (!shouldUseUnifiedSystem(s)) {
    return;
  }

  const enemyData = getEnemyForUnified(s);
  if (!enemyData) {
    return;
  }

  logUnifiedState('Initializing unified combat', enemyData.id);

  // Reset state
  unifiedCombatState = {
    active: true,
    enemyId: enemyData.id,
    enemyHand: [],
    enemyDraw: [],
    enemyDiscard: [],
    enemyEnergy: { current: 3, maximum: 3 }
  };

  // Create enemy deck
  if (enemyData.behavior.deck) {
    const deck = createMonsterDeck(
      enemyData.behavior.deck.cards,
      enemyData.id
    );

    // Setup draw pile
    unifiedCombatState.enemyDraw = deck.slice();

    // Shuffle draw pile using RNG
    const shuffled = shuffle(r, unifiedCombatState.enemyDraw);
    unifiedCombatState.enemyDraw = shuffled.array;

    // Draw initial hand
    const handSize = enemyData.behavior.deck.handSize;
    for (let i = 0; i < handSize && unifiedCombatState.enemyDraw.length > 0; i++) {
      const card = unifiedCombatState.enemyDraw.shift()!;
      unifiedCombatState.enemyHand.push(card);
    }

    // Set energy
    unifiedCombatState.enemyEnergy = {
      current: enemyData.behavior.deck.energyPerTurn,
      maximum: enemyData.behavior.deck.energyPerTurn
    };
  }

  logUnifiedState('Unified combat initialized', {
    hand: unifiedCombatState.enemyHand.length,
    draw: unifiedCombatState.enemyDraw.length,
    energy: unifiedCombatState.enemyEnergy
  });
}

/**
 * Start enemy turn with unified system
 */
export function unifiedEnemyTurn(s: GameState, enemyId: string, r: RNG): void {
  if (!unifiedCombatState.active || unifiedCombatState.enemyId !== enemyId) {
    return;
  }

  logUnifiedState('Starting unified enemy turn', enemyId);

  const enemyData = getEnemyForUnified(s);
  if (!enemyData) return;

  // Reset energy
  if (enemyData.behavior.deck) {
    unifiedCombatState.enemyEnergy.current = enemyData.behavior.deck.energyPerTurn;
  }

  // Draw up to hand size
  if (enemyData.behavior.deck) {
    const handSize = enemyData.behavior.deck.handSize;
    while (unifiedCombatState.enemyHand.length < handSize && unifiedCombatState.enemyDraw.length > 0) {
      const card = unifiedCombatState.enemyDraw.shift()!;
      unifiedCombatState.enemyHand.push(card);
    }
  }

  // Play cards automatically (simple AI)
  const playableCards = unifiedCombatState.enemyHand.filter(card =>
    card.cost <= unifiedCombatState.enemyEnergy.current
  );

  for (const card of playableCards) {
    if (unifiedCombatState.enemyEnergy.current < card.cost) break;

    logUnifiedState(`Playing card: ${card.name}`, {
      cost: card.cost,
      energyBefore: unifiedCombatState.enemyEnergy.current
    });

    // Spend energy
    unifiedCombatState.enemyEnergy.current -= card.cost;

    // Apply card effects
    applyUnifiedCardEffects(s, card, enemyId);

    // Remove from hand and add to discard
    const cardIndex = unifiedCombatState.enemyHand.indexOf(card);
    if (cardIndex !== -1) {
      unifiedCombatState.enemyHand.splice(cardIndex, 1);
      if (!card.exhausts) {
        unifiedCombatState.enemyDiscard.push(card);
      }
    }
  }

  // Discard remaining hand
  unifiedCombatState.enemyDiscard.push(...unifiedCombatState.enemyHand);
  unifiedCombatState.enemyHand = [];
}

/**
 * Play a specific unified card
 */
export function unifiedPlayCard(
  s: GameState,
  cmd: { entityId: string; cardIndex: number; targetId?: string },
  r: RNG
): void {
  if (!unifiedCombatState.active || unifiedCombatState.enemyId !== cmd.entityId) {
    return;
  }

  const card = unifiedCombatState.enemyHand[cmd.cardIndex];
  if (!card) {
    logUnifiedState(`No card at index ${cmd.cardIndex}`);
    return;
  }

  if (unifiedCombatState.enemyEnergy.current < card.cost) {
    logUnifiedState(`Not enough energy for ${card.name}`);
    return;
  }

  logUnifiedState(`Playing card by index: ${card.name}`, cmd.cardIndex);

  // Spend energy
  unifiedCombatState.enemyEnergy.current -= card.cost;

  // Apply effects
  applyUnifiedCardEffects(s, card, cmd.entityId);

  // Remove from hand
  unifiedCombatState.enemyHand.splice(cmd.cardIndex, 1);

  // Add to discard unless it exhausts
  if (!card.exhausts) {
    unifiedCombatState.enemyDiscard.push(card);
  }
}

/**
 * Apply unified card effects to game state
 */
function applyUnifiedCardEffects(s: GameState, card: UnifiedCard, owner: string): void {
  logUnifiedState(`Applying effects for ${card.name}`, card.effects);

  // Apply damage to player
  if (card.effects.damage) {
    const damage = card.effects.damage;
    const blocked = Math.min(damage, s.player.block || 0);
    s.player.block = Math.max(0, (s.player.block || 0) - blocked);
    s.player.hp -= (damage - blocked);

    logUnifiedState(`Dealt ${damage} damage (${blocked} blocked)`);
  }

  // Apply block to enemy
  if (card.effects.block && s.enemy) {
    s.enemy.block = (s.enemy.block || 0) + card.effects.block;
    logUnifiedState(`Enemy gained ${card.effects.block} block`);
  }

  // Apply status effects
  if (card.effects.vulnerable) {
    // Add vulnerable status effect
    if (!s.player.statusEffects) {
      s.player.statusEffects = [];
    }

    // Find existing vulnerable effect or create new one
    const existing = s.player.statusEffects.find(e => e.id === 'vulnerable');
    if (existing) {
      existing.stacks = (existing.stacks || 0) + card.effects.vulnerable;
    } else {
      s.player.statusEffects.push({
        id: 'vulnerable',
        name: 'Vulnerable',
        description: 'Take 50% more damage',
        stacks: card.effects.vulnerable,
        duration: -1
      });
    }
    logUnifiedState(`Player got ${card.effects.vulnerable} vulnerable`);
  }

  if (card.effects.weak) {
    // Add weak status effect
    if (!s.player.statusEffects) {
      s.player.statusEffects = [];
    }

    // Find existing weak effect or create new one
    const existing = s.player.statusEffects.find(e => e.id === 'weak');
    if (existing) {
      existing.stacks = (existing.stacks || 0) + card.effects.weak;
    } else {
      s.player.statusEffects.push({
        id: 'weak',
        name: 'Weak',
        description: 'Deal 25% less damage',
        stacks: card.effects.weak,
        duration: -1
      });
    }
    logUnifiedState(`Player got ${card.effects.weak} weak`);
  }
}

/**
 * Get unified state for UI
 */
export function getUnifiedState(): any {
  if (!unifiedCombatState.active) {
    return null;
  }

  return {
    piles: {
      [unifiedCombatState.enemyId || 'enemy']: {
        hand: unifiedCombatState.enemyHand,
        draw: unifiedCombatState.enemyDraw,
        discard: unifiedCombatState.enemyDiscard
      }
    },
    energy: {
      [unifiedCombatState.enemyId || 'enemy']: unifiedCombatState.enemyEnergy
    }
  };
}

/**
 * Check if unified system is active
 */
export function isUnifiedActive(): boolean {
  return unifiedCombatState.active;
}

/**
 * Reset unified state
 */
export function resetUnifiedState(): void {
  unifiedCombatState = {
    active: false,
    enemyHand: [],
    enemyDraw: [],
    enemyDiscard: [],
    enemyEnergy: { current: 3, maximum: 3 }
  };
}