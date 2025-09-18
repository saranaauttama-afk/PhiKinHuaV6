/**
 * React Hooks for Universal State
 * Provides access to unified game state in UI components
 */

import { useState, useEffect, useCallback } from 'react';
import { UniversalCard, GameEntity, EnergySystem } from './completeTypes';
import {
  getUnifiedManager,
  isUnifiedActive,
  getUnifiedPlayerHand,
  getUnifiedEnemyHand,
  getUnifiedEnergyState
} from './migrationLayer';

/**
 * Hook to access universal player state
 */
export function useUniversalPlayer() {
  const [playerEntity, setPlayerEntity] = useState<GameEntity | null>(null);
  const [playerHand, setPlayerHand] = useState<UniversalCard[]>([]);
  const [playerEnergy, setPlayerEnergy] = useState<EnergySystem | null>(null);

  const updatePlayerState = useCallback(() => {
    const manager = getUnifiedManager();
    if (!manager || !isUnifiedActive()) {
      setPlayerEntity(null);
      setPlayerHand([]);
      setPlayerEnergy(null);
      return;
    }

    const player = manager.getEntity('player');
    setPlayerEntity(player || null);
    setPlayerHand(getUnifiedPlayerHand());
    setPlayerEnergy(getUnifiedEnergyState('player'));
  }, []);

  // Update when unified system changes
  useEffect(() => {
    updatePlayerState();

    // Set up polling for real-time updates (reduced frequency)
    const interval = setInterval(updatePlayerState, 500);
    return () => clearInterval(interval);
  }, [updatePlayerState]);

  return {
    player: playerEntity,
    hand: playerHand,
    energy: playerEnergy,
    refresh: updatePlayerState,
    isUnified: isUnifiedActive()
  };
}

/**
 * Hook to access universal enemy state
 */
export function useUniversalEnemy(enemyId?: string) {
  const [enemyEntity, setEnemyEntity] = useState<GameEntity | null>(null);
  const [enemyHand, setEnemyHand] = useState<UniversalCard[]>([]);
  const [enemyEnergy, setEnemyEnergy] = useState<EnergySystem | null>(null);

  const updateEnemyState = useCallback(() => {
    const manager = getUnifiedManager();
    if (!manager || !isUnifiedActive()) {
      setEnemyEntity(null);
      setEnemyHand([]);
      setEnemyEnergy(null);
      return;
    }

    // Get first monster if no specific ID provided
    let enemy: GameEntity | undefined;
    if (enemyId) {
      enemy = manager.getEntity(enemyId);
    } else {
      const monsters = manager.getEntitiesByType('monster');
      enemy = monsters[0];
    }

    setEnemyEntity(enemy || null);

    if (enemy) {
      setEnemyHand(getUnifiedEnemyHand(enemy.id));
      setEnemyEnergy(getUnifiedEnergyState(enemy.id));
    } else {
      setEnemyHand([]);
      setEnemyEnergy(null);
    }
  }, [enemyId]);

  // Update when unified system changes
  useEffect(() => {
    updateEnemyState();

    // Set up polling for real-time updates (reduced frequency)
    const interval = setInterval(updateEnemyState, 500);
    return () => clearInterval(interval);
  }, [updateEnemyState]);

  return {
    enemy: enemyEntity,
    hand: enemyHand,
    energy: enemyEnergy,
    refresh: updateEnemyState,
    isUnified: isUnifiedActive()
  };
}

/**
 * Hook to access complete game state
 */
export function useUniversalGameState() {
  const [gameState, setGameState] = useState<any>(null);
  const [currentTurn, setCurrentTurn] = useState<GameEntity | null>(null);
  const [turnInfo, setTurnInfo] = useState<{
    turnNumber: number;
    roundNumber: number;
    currentEntityId: string;
  } | null>(null);

  const updateGameState = useCallback(() => {
    const manager = getUnifiedManager();
    if (!manager || !isUnifiedActive()) {
      setGameState(null);
      setCurrentTurn(null);
      setTurnInfo(null);
      return;
    }

    const state = manager.getState();
    setGameState(state);

    const currentEntity = manager.getCurrentTurnEntity();
    setCurrentTurn(currentEntity || null);

    if (currentEntity) {
      setTurnInfo({
        turnNumber: state.turnNumber,
        roundNumber: state.roundNumber,
        currentEntityId: currentEntity.id
      });
    }
  }, []);

  // Update when unified system changes
  useEffect(() => {
    updateGameState();

    // Set up polling for real-time updates (reduced frequency)
    const interval = setInterval(updateGameState, 500);
    return () => clearInterval(interval);
  }, [updateGameState]);

  return {
    gameState,
    currentTurn,
    turnInfo,
    refresh: updateGameState,
    isUnified: isUnifiedActive()
  };
}

/**
 * Convert universal cards for UI display
 */
export function convertUniversalCardsForUI(cards: UniversalCard[]): any[] {
  return cards.map((card, index) => ({
    // Unique key for React
    key: card.instanceId,

    // Card identification
    instanceId: card.instanceId,
    cardId: card.cardId,

    // Display properties
    id: card.cardId,           // Legacy compatibility
    name: card.name,
    cost: card.cost,
    type: card.type,

    // Effects for display
    damage: card.effects.damage,
    block: card.effects.block,
    heal: card.effects.heal,
    draw: card.effects.draw,
    energyGain: card.effects.energyGain,

    // Status effects
    vulnerable: card.effects.vulnerable,
    weak: card.effects.weak,
    poison: card.effects.poison,
    strength: card.effects.strength,
    dexterity: card.effects.dexterity,

    // Metadata
    desc: card.description || generateCardDescription(card),
    description: card.description || generateCardDescription(card),
    rarity: card.rarity,
    tags: card.tags,

    // State flags
    upgraded: card.upgraded,
    exhausts: card.exhausts,
    ethereal: card.ethereal,
    innate: card.innate,
    retain: card.retain,

    // Equipment
    equipmentId: card.equipmentId,
    slotCost: card.slotCost,

    // Index for legacy compatibility
    index
  }));
}

/**
 * Generate description for card display
 */
function generateCardDescription(card: UniversalCard): string {
  const parts: string[] = [];

  if (card.effects.damage) {
    parts.push(`Deal ${card.effects.damage} damage`);
  }

  if (card.effects.block) {
    parts.push(`Gain ${card.effects.block} block`);
  }

  if (card.effects.heal) {
    parts.push(`Heal ${card.effects.heal} HP`);
  }

  if (card.effects.draw) {
    parts.push(`Draw ${card.effects.draw} card${card.effects.draw > 1 ? 's' : ''}`);
  }

  if (card.effects.energyGain) {
    parts.push(`Gain ${card.effects.energyGain} energy`);
  }

  // Status effects
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

  // Special flags
  if (card.exhausts) {
    parts.push('Exhaust');
  }

  if (card.ethereal) {
    parts.push('Ethereal');
  }

  if (card.retain) {
    parts.push('Retain');
  }

  return parts.join('. ') || card.description || 'No effect';
}

/**
 * Get card display effects for UI
 */
export function getCardDisplayEffects(card: UniversalCard): string[] {
  const effects: string[] = [];

  if (card.effects.damage) effects.push(`⚔ ${card.effects.damage}`);
  if (card.effects.block) effects.push(`🛡 ${card.effects.block}`);
  if (card.effects.heal) effects.push(`❤ ${card.effects.heal}`);
  if (card.effects.draw) effects.push(`📄 ${card.effects.draw}`);
  if (card.effects.energyGain) effects.push(`⚡ ${card.effects.energyGain}`);

  return effects;
}

/**
 * Check if universal system is ready for UI
 */
export function isUniversalSystemReady(): boolean {
  return isUnifiedActive() && getUnifiedManager() !== null;
}

/**
 * Get current turn entity for UI display
 */
export function getCurrentTurnEntity(): GameEntity | null {
  const manager = getUnifiedManager();
  if (!manager || !isUnifiedActive()) {
    return null;
  }

  return manager.getCurrentTurnEntity() || null;
}

/**
 * Helper to play a card through universal system
 */
export function playUniversalCard(instanceId: string): Promise<boolean> {
  const manager = getUnifiedManager();
  if (!manager || !isUnifiedActive()) {
    console.warn('[Universal UI] Cannot play card - unified system not active');
    return Promise.resolve(false);
  }

  return manager.playCard(instanceId, 'player')
    .then(result => {
      console.log('[Universal UI] Card play result:', result.success);
      return result.success;
    })
    .catch(error => {
      console.error('[Universal UI] Error playing card:', error);
      return false;
    });
}

/**
 * Helper to end turn through universal system
 */
export function endUniversalTurn(): void {
  const manager = getUnifiedManager();
  if (!manager || !isUnifiedActive()) {
    console.warn('[Universal UI] Cannot end turn - unified system not active');
    return;
  }

  manager.startNextTurn();
}

/**
 * Get entity stats for display
 */
export function getEntityDisplayStats(entity: GameEntity): {
  name: string;
  hp: string;
  block: number;
  energy: string;
  handSize: number;
  deckSize: number;
} {
  return {
    name: entity.name,
    hp: `${entity.hp}/${entity.maxHp}`,
    block: entity.block,
    energy: `${entity.energy.current}/${entity.energy.maximum}`,
    handSize: entity.piles.hand.length,
    deckSize: entity.piles.draw.length
  };
}