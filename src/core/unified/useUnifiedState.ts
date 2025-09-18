/**
 * React Hook for Unified State
 * Provides access to unified game state in UI components
 */

import { useState, useEffect, useCallback } from 'react';
import { UnifiedCard, EnergyState } from './types';
import { getUnifiedState, isUnifiedActive } from './simpleCombat';
import { enemyCardById } from '../pack_enemy_cards';

/**
 * Hook to access unified state
 */
export function useUnifiedState(enemyId?: string) {
  const [unifiedCards, setUnifiedCards] = useState<UnifiedCard[]>([]);
  const [unifiedEnergy, setUnifiedEnergy] = useState<EnergyState | null>(null);

  const updateState = useCallback(() => {
    const state = getUnifiedState();

    if (state && enemyId) {
      // Get enemy hand from unified state
      const hand = state.piles?.[enemyId]?.hand || [];
      setUnifiedCards(hand);

      // Get enemy energy from unified state
      const energy = state.energy?.[enemyId] || null;
      setUnifiedEnergy(energy);
    } else if (state && !enemyId) {
      // Get player hand
      const hand = state.piles?.player?.hand || [];
      setUnifiedCards(hand);

      // Get player energy
      const energy = state.energy?.player || null;
      setUnifiedEnergy(energy);
    }
  }, [enemyId]);

  // Update on mount and when enemy changes
  useEffect(() => {
    updateState();
  }, [updateState]);

  // Return public API
  return {
    cards: unifiedCards,
    energy: unifiedEnergy,
    refresh: updateState
  };
}

/**
 * Convert unified cards to display format
 */
export function convertUnifiedCardsForDisplay(cards: UnifiedCard[]): any[] {
  return cards.map(card => ({
    instanceId: card.instanceId,
    id: card.cardId,
    name: card.name,
    cost: card.cost,
    type: card.type,
    damage: card.effects.damage,
    block: card.effects.block,
    description: card.description || generateDescription(card),
    tags: card.tags,
    exhausts: card.exhausts,
    ethereal: card.ethereal
  }));
}

/**
 * Generate description from card effects
 */
function generateDescription(card: UnifiedCard): string {
  const parts: string[] = [];

  if (card.effects.damage) {
    parts.push(`Deal ${card.effects.damage} damage`);
  }

  if (card.effects.block) {
    parts.push(`Gain ${card.effects.block} block`);
  }

  if (card.effects.draw) {
    parts.push(`Draw ${card.effects.draw} card${card.effects.draw > 1 ? 's' : ''}`);
  }

  if (card.effects.energyGain) {
    parts.push(`Gain ${card.effects.energyGain} energy`);
  }

  if (card.effects.heal) {
    parts.push(`Heal ${card.effects.heal} HP`);
  }

  if (card.effects.vulnerable) {
    parts.push(`Apply ${card.effects.vulnerable} vulnerable`);
  }

  if (card.effects.weak) {
    parts.push(`Apply ${card.effects.weak} weak`);
  }

  if (card.effects.poison) {
    parts.push(`Apply ${card.effects.poison} poison`);
  }

  if (card.effects.strength) {
    parts.push(`Gain ${card.effects.strength} strength`);
  }

  if (card.effects.dexterity) {
    parts.push(`Gain ${card.effects.dexterity} dexterity`);
  }

  if (card.exhausts) {
    parts.push('Exhaust');
  }

  if (card.ethereal) {
    parts.push('Ethereal');
  }

  return parts.join('. ') || 'No effect';
}

/**
 * Check if unified system is active
 */
export function isUnifiedSystemActive(): boolean {
  return isUnifiedActive();
}

/**
 * Get unified card data by ID
 */
export function getUnifiedCardData(cardId: string, owner: string): any {
  // For enemy cards, use enemy card data
  if (owner !== 'player') {
    const enemyCard = enemyCardById(cardId);
    if (enemyCard) {
      return {
        id: cardId,
        name: enemyCard.name || cardId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        cost: enemyCard.energy || 0,
        damage: enemyCard.dmg,
        block: enemyCard.block,
        description: `${enemyCard.dmg ? `Deal ${enemyCard.dmg} damage. ` : ''}${enemyCard.block ? `Gain ${enemyCard.block} block.` : ''}`.trim()
      };
    }
  }

  // Fallback
  return {
    id: cardId,
    name: cardId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    cost: 0,
    description: 'Unknown card'
  };
}