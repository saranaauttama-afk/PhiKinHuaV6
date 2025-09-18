/**
 * Migration Layer - Gradual transition from old system to unified system
 * Provides backward compatibility while enabling new features
 */

import { GameState, CardData, Command } from '../types';
import { RNG } from '../rng';
import { UniversalGameManager } from './universalGameManager';
import { UniversalCard, GameEntity } from './completeTypes';
import { convertPlayerCardsToUniversal, createUniversalCard } from './universalCardFactory';

// Global unified manager instance
let unifiedManager: UniversalGameManager | null = null;
let isUnifiedModeActive = false;

/**
 * Check if unified mode should be activated
 */
export function shouldActivateUnifiedMode(gameState: GameState): boolean {
  // Universal system is now the primary system for all monsters
  return true;
}

/**
 * Initialize unified mode
 */
export function initializeUnifiedMode(gameState: GameState, rng: RNG): void {
  if (unifiedManager || !shouldActivateUnifiedMode(gameState)) {
    return;
  }

  console.log('[Migration] Initializing unified mode');

  unifiedManager = new UniversalGameManager(rng);
  isUnifiedModeActive = true;

  // Convert current game state
  const playerDeck = [
    ...gameState.piles.draw,
    ...gameState.piles.hand,
    ...gameState.piles.discard,
    ...gameState.piles.exhaust
  ];

  const enemies = [];
  if (gameState.enemy) {
    enemies.push({
      id: gameState.enemy.id,
      name: gameState.enemy.name,
      hp: gameState.enemy.hp,
      maxHp: gameState.enemy.maxHp,
      behavior: createEnemyBehavior(gameState.enemy.id)
    });
  }

  // Update game rules first (before initializeCombat which draws cards)
  unifiedManager.updateGameRules({
    maxHandSize: gameState.player.maxHandSize
  });

  unifiedManager.initializeCombat(playerDeck, enemies);

  // Sync remaining player state
  syncPlayerStateToUnified(gameState);

  console.log('[Migration] Unified mode initialized');
}

/**
 * Create enemy behavior from enemy ID
 */
function createEnemyBehavior(enemyId: string): any {
  switch (enemyId) {
    case 'phi-krasue':
      return {
        id: enemyId,
        type: 'deck_ai',
        deckAI: {
          cardSelection: 'optimal',
          energyUsage: 'all',
          targetPriority: []
        }
      };
    case 'phi-pop':
      return {
        id: enemyId,
        type: 'deck_ai',
        deckAI: {
          cardSelection: 'random',
          energyUsage: 'conservative',
          targetPriority: []
        }
      };
    default:
      return {
        id: enemyId,
        type: 'deck_ai',
        deckAI: {
          cardSelection: 'random',
          energyUsage: 'all',
          targetPriority: []
        }
      };
  }
}

/**
 * Sync player state from old format to unified
 */
function syncPlayerStateToUnified(gameState: GameState): void {
  if (!unifiedManager) return;

  const player = unifiedManager.getEntity('player');
  if (!player) return;

  // Sync HP, block, energy
  player.hp = gameState.player.hp;
  player.maxHp = gameState.player.maxHp;
  player.block = gameState.player.block;
  player.energy.current = gameState.player.energy;
  player.energy.maximum = gameState.player.maxEnergy;

  console.log('[Migration] Player state synced to unified');
}

/**
 * Sync unified state back to old format
 */
function syncUnifiedStateToLegacy(gameState: GameState): void {
  if (!unifiedManager) return;

  const player = unifiedManager.getEntity('player');
  if (!player) return;

  // Sync back to legacy format
  gameState.player.hp = player.hp;
  gameState.player.maxHp = player.maxHp;
  gameState.player.block = player.block;
  gameState.player.energy = player.energy.current;
  gameState.player.maxEnergy = player.energy.maximum;

  // Sync piles
  gameState.piles = {
    draw: convertUniversalToLegacyCards(player.piles.draw),
    hand: convertUniversalToLegacyCards(player.piles.hand),
    discard: convertUniversalToLegacyCards(player.piles.discard),
    exhaust: convertUniversalToLegacyCards(player.piles.exhaust)
  };

  // Sync enemy state
  const enemies = unifiedManager.getEntitiesByType('monster');
  if (enemies.length > 0 && gameState.enemy) {
    const enemy = enemies[0];
    gameState.enemy.hp = enemy.hp;
    gameState.enemy.maxHp = enemy.maxHp;
    gameState.enemy.block = enemy.block || 0;

    // Sync enemy piles if they exist
    if (gameState.enemyPiles) {
      gameState.enemyPiles = {
        draw: enemy.piles.draw.map(c => c.cardId),
        hand: enemy.piles.hand.map(c => c.cardId),
        discard: enemy.piles.discard.map(c => c.cardId)
      };
    }
  }

  console.log('[Migration] Unified state synced back to legacy');
}

/**
 * Convert universal cards back to legacy format
 */
function convertUniversalToLegacyCards(universalCards: UniversalCard[]): CardData[] {
  return universalCards.map(card => ({
    id: card.cardId,
    name: card.name,
    type: card.type as any,
    cost: card.cost,
    dmg: card.effects.damage,
    block: card.effects.block,
    draw: card.effects.draw,
    energyGain: card.effects.energyGain,
    heal: card.effects.heal,
    vulnerable: card.effects.vulnerable,
    weak: card.effects.weak,
    poison: card.effects.poison,
    strength: card.effects.strength,
    dexterity: card.effects.dexterity,
    rarity: card.rarity,
    tags: card.tags,
    desc: card.description,
    exhaust: card.exhausts,
    equipmentId: card.equipmentId,
    slotCost: card.slotCost
  }));
}

/**
 * Intercept player card play command
 */
export function interceptPlayCard(
  gameState: GameState,
  command: Extract<Command, { type: 'PlayCard' }>,
  rng: RNG
): { handled: boolean; state: GameState; rng: RNG } {
  if (!isUnifiedModeActive || !unifiedManager) {
    return { handled: false, state: gameState, rng };
  }

  console.log(`[Migration] Intercepting PlayCard: index ${command.index}`);
  console.log(`[Migration] BEFORE PLAY - Legacy hand:`, gameState.piles.hand.map((c, i) => `${i}: ${c.name}(${c.id})`));

  // Ensure legacy hand is synced from universal first
  const player = unifiedManager.getEntity('player');
  if (!player) {
    return { handled: false, state: gameState, rng };
  }

  // If legacy hand is empty but universal has cards, sync immediately
  if (gameState.piles.hand.length === 0 && player.piles.hand.length > 0) {
    console.log(`[Migration] Legacy hand empty, syncing from universal hand`);
    syncUnifiedStateToLegacy(gameState);
  }

  // Get the card from legacy hand (should be synced now)
  const card = gameState.piles.hand[command.index];
  if (!card) {
    console.warn(`[Migration] Card at index ${command.index} not found in legacy hand after sync`);
    console.warn(`[Migration] Legacy hand size: ${gameState.piles.hand.length}, Universal hand size: ${player.piles.hand.length}`);
    return { handled: false, state: gameState, rng };
  }

  // Find corresponding universal card in unified manager (player already defined above)

  // Match by index and card ID for safety
  const universalCard = player.piles.hand[command.index];
  if (!universalCard || universalCard.cardId !== card.id) {
    console.warn('[Migration] Card mismatch between legacy and unified systems');
    return { handled: false, state: gameState, rng };
  }

  // Play the card through unified system synchronously
  try {
    const result = unifiedManager.playCardSync(universalCard.instanceId, 'player', selectCardTarget(card));

    if (result.success) {
      console.log(`[Migration] Successfully played ${card.name} through unified system (sync)`);
    } else {
      console.warn(`[Migration] Failed to play card: ${result.issues?.join(', ') || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('[Migration] Sync error playing card through unified system:', error);
  }

  // Sync state immediately after playing
  syncUnifiedStateToLegacy(gameState);

  console.log(`[Migration] AFTER SYNC - Legacy hand:`, gameState.piles.hand.map((c, i) => `${i}: ${c.name}(${c.id})`));
  if (player) {
    console.log(`[Migration] AFTER SYNC - Universal hand:`, player.piles.hand.map((c, i) => `${i}: ${c.name}(${c.instanceId})`));
  }

  return { handled: true, state: gameState, rng };
}

/**
 * Select target for legacy card
 */
function selectCardTarget(card: CardData): string | undefined {
  // Simple target selection for compatibility
  if (card.dmg && card.dmg > 0) {
    return 'enemy'; // Attack cards target enemy
  }
  return 'player'; // Other cards target self
}

/**
 * Intercept end turn command
 */
export function interceptEndTurn(
  gameState: GameState,
  command: Extract<Command, { type: 'EndTurn' }>,
  rng: RNG
): { handled: boolean; state: GameState; rng: RNG } {
  if (!isUnifiedModeActive || !unifiedManager) {
    return { handled: false, state: gameState, rng };
  }

  console.log('[Migration] Intercepting EndTurn');

  // Let unified manager handle turn progression
  unifiedManager.startNextTurn();

  // Sync state back immediately
  syncUnifiedStateToLegacy(gameState);

  return { handled: true, state: gameState, rng };
}

/**
 * Get unified manager for external access
 */
export function getUnifiedManager(): UniversalGameManager | null {
  return unifiedManager;
}

/**
 * Check if unified mode is active
 */
export function isUnifiedActive(): boolean {
  return isUnifiedModeActive;
}

/**
 * Force enable unified mode
 */
export function forceEnableUnifiedMode(gameState: GameState, rng: RNG): void {
  (gameState as any).unifiedMode = true;
  initializeUnifiedMode(gameState, rng);
}

/**
 * Disable unified mode
 */
export function disableUnifiedMode(): void {
  console.log('[Migration] Disabling unified mode');
  unifiedManager = null;
  isUnifiedModeActive = false;
}

/**
 * Reset unified system
 */
export function resetUnifiedSystem(): void {
  if (unifiedManager) {
    unifiedManager.reset();
  }
  disableUnifiedMode();
}

/**
 * Get player hand from unified system for UI
 */
export function getUnifiedPlayerHand(): UniversalCard[] {
  if (!unifiedManager) return [];

  const player = unifiedManager.getEntity('player');
  return player?.piles.hand || [];
}

/**
 * Get enemy hand from unified system for UI
 */
export function getUnifiedEnemyHand(enemyId?: string): UniversalCard[] {
  if (!unifiedManager) return [];

  const enemies = unifiedManager.getEntitiesByType('monster');
  const enemy = enemyId
    ? unifiedManager.getEntity(enemyId)
    : enemies[0];

  return enemy?.piles.hand || [];
}

/**
 * Get energy state from unified system
 */
export function getUnifiedEnergyState(entityId: string): any {
  if (!unifiedManager) return null;

  const entity = unifiedManager.getEntity(entityId);
  return entity?.energy || null;
}

/**
 * Debug: Print unified state
 */
export function debugUnifiedState(): void {
  if (!unifiedManager) {
    console.log('[Migration] Unified mode not active');
    return;
  }

  const state = unifiedManager.getState();
  console.log('[Migration] Unified State Debug:', {
    entities: Object.keys(state.entities),
    turnOrder: state.turnOrder,
    currentTurn: state.turnOrder[state.currentTurnIndex],
    turnNumber: state.turnNumber,
    phase: state.phase
  });

  for (const entity of Object.values(state.entities)) {
    console.log(`[Migration] Entity ${entity.id}:`, {
      hp: `${entity.hp}/${entity.maxHp}`,
      block: entity.block,
      energy: `${entity.energy.current}/${entity.energy.maximum}`,
      hand: entity.piles.hand.length,
      draw: entity.piles.draw.length,
      discard: entity.piles.discard.length
    });
  }
}