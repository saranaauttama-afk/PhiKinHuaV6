/**
 * Integration Layer for Unified System
 * Bridges the new unified system with existing game code
 */

import { GameState, CardData, EnemyCard } from '../types';
import { RNG } from '../rng';
import {
  UnifiedCard,
  CardPiles,
  EnergyState,
  MonsterBehavior,
  UnifiedGameState
} from './types';
import {
  createUnifiedCard,
  convertPlayerCards,
  convertEnemyCards
} from './cardFactory';
import {
  createEmptyPiles,
  setupDeck,
  drawCards,
  moveCard,
  discardCard,
  exhaustCard
} from './pileManager';
import {
  createEnergyState,
  resetEnergy,
  regenerateEnergy,
  spendEnergy
} from './energyManager';

/**
 * Convert existing game state to unified format
 */
export function convertToUnifiedState(
  gameState: GameState,
  rng: RNG
): Partial<UnifiedGameState> {
  const unified: Partial<UnifiedGameState> = {
    piles: { player: createEmptyPiles() },
    energy: { player: createEnergyState(3, 3) },
    behaviors: {},
    currentTurn: gameState.phase === 'enemyTurn' ? 'enemy' : 'player',
    turnNumber: gameState.turn || 0
  };

  // Convert player cards
  if (gameState.piles) {
    const playerPiles = unified.piles!.player;

    // Convert draw pile
    if (gameState.piles.draw) {
      playerPiles.draw = convertPlayerCards(gameState.piles.draw);
    }

    // Convert hand
    if (gameState.piles.hand) {
      playerPiles.hand = convertPlayerCards(gameState.piles.hand);
    }

    // Convert discard
    if (gameState.piles.discard) {
      playerPiles.discard = convertPlayerCards(gameState.piles.discard);
    }

    // Convert exhaust
    if (gameState.piles.exhaust) {
      playerPiles.exhaust = convertPlayerCards(gameState.piles.exhaust);
    }
  }

  // Set player energy
  if (gameState.energy !== undefined) {
    unified.energy!.player.current = gameState.energy;
    unified.energy!.player.maximum = gameState.maxEnergy || 3;
    unified.energy!.player.baseMaximum = gameState.maxEnergy || 3;
  }

  // Convert enemy data
  if (gameState.enemies && gameState.enemies.length > 0) {
    for (const enemy of gameState.enemies) {
      const enemyId = enemy.id;

      // Create enemy piles
      unified.piles![enemyId] = createEmptyPiles();

      // Convert enemy cards if they exist
      if (gameState.enemyPiles) {
        const enemyPiles = unified.piles![enemyId];

        if (gameState.enemyPiles.draw) {
          enemyPiles.draw = convertEnemyCards(
            gameState.enemyPiles.draw,
            enemyId
          );
        }

        if (gameState.enemyPiles.hand) {
          enemyPiles.hand = convertEnemyCards(
            gameState.enemyPiles.hand,
            enemyId
          );
        }

        if (gameState.enemyPiles.discard) {
          enemyPiles.discard = convertEnemyCards(
            gameState.enemyPiles.discard,
            enemyId
          );
        }
      }

      // Create enemy energy
      const enemyEnergy = gameState.enemyEnergy || 3;
      unified.energy![enemyId] = createEnergyState(enemyEnergy, enemyEnergy);
      unified.energy![enemyId].current = enemyEnergy;

      // Create enemy behavior
      unified.behaviors![enemyId] = createMonsterBehavior(enemy);
    }
  }

  return unified;
}

/**
 * Create monster behavior from enemy data
 */
function createMonsterBehavior(enemy: any): MonsterBehavior {
  // Check if enemy has deck configuration
  if (enemy.ai?.deck) {
    const deck = enemy.ai.deck;

    // Handle lists-based deck (like phi-krasue)
    if (deck.lists && deck.lists.length > 0) {
      const cardList = deck.lists[0].cards || [];
      return {
        id: enemy.id,
        type: 'deck',
        deck: {
          cards: cardList,
          handSize: deck.handSize || 3,
          energyPerTurn: deck.maxEnergy || 3,
          drawPerTurn: deck.handSize || 3,
          shuffleOnEmpty: true
        }
      };
    }

    // Handle pool-based deck
    if (deck.pool && deck.pool.length > 0) {
      const cards = [];
      for (const poolItem of deck.pool) {
        for (let i = 0; i < (poolItem.weight || 1); i++) {
          cards.push(poolItem.id);
        }
      }

      return {
        id: enemy.id,
        type: 'deck',
        deck: {
          cards,
          handSize: deck.handSize || 3,
          energyPerTurn: deck.maxEnergy || 3,
          drawPerTurn: deck.handSize || 3,
          shuffleOnEmpty: true
        }
      };
    }
  }

  // Check if enemy has AI cycle (pattern-based)
  if (enemy.ai?.cycle) {
    const patterns = enemy.ai.cycle.map((intent: string) => ({
      cards: parseIntentToCards(intent),
      intent: { type: 'attack' as const, value: 0 }
    }));

    return {
      id: enemy.id,
      type: 'pattern',
      pattern: {
        cycle: patterns,
        currentIndex: 0,
        randomize: false
      }
    };
  }

  // Default to simple pattern
  return {
    id: enemy.id,
    type: 'pattern',
    pattern: {
      cycle: [
        { cards: ['strike'], intent: { type: 'attack', value: 5 } }
      ],
      currentIndex: 0,
      randomize: false
    }
  };
}

/**
 * Parse intent string to card IDs
 */
function parseIntentToCards(intent: string): string[] {
  // Simple mapping of intents to cards
  switch (intent) {
    case 'attack':
      return ['strike'];
    case 'defend':
      return ['defend'];
    case 'buff':
      return ['strengthen'];
    default:
      return ['strike'];
  }
}

/**
 * Sync unified state back to game state
 */
export function syncUnifiedToGameState(
  unified: Partial<UnifiedGameState>,
  gameState: GameState
): void {
  // Sync player piles
  if (unified.piles?.player) {
    const playerPiles = unified.piles.player;

    gameState.piles = {
      draw: playerPiles.draw.map(convertUnifiedToPlayerCard),
      hand: playerPiles.hand.map(convertUnifiedToPlayerCard),
      discard: playerPiles.discard.map(convertUnifiedToPlayerCard),
      exhaust: playerPiles.exhaust.map(convertUnifiedToPlayerCard)
    };
  }

  // Sync player energy
  if (unified.energy?.player) {
    gameState.energy = unified.energy.player.current;
    gameState.maxEnergy = unified.energy.player.maximum;
  }

  // Sync enemy piles (first enemy only for now)
  const enemyIds = Object.keys(unified.piles || {}).filter(id => id !== 'player');
  if (enemyIds.length > 0) {
    const firstEnemyId = enemyIds[0];
    const enemyPiles = unified.piles![firstEnemyId];

    gameState.enemyPiles = {
      draw: enemyPiles.draw.map(c => c.cardId),
      hand: enemyPiles.hand.map(c => c.cardId),
      discard: enemyPiles.discard.map(c => c.cardId)
    };

    // Sync enemy energy
    if (unified.energy![firstEnemyId]) {
      gameState.enemyEnergy = unified.energy![firstEnemyId].current;
    }
  }

  // Sync turn
  gameState.turn = unified.turnNumber || 0;

  // Sync phase
  if (unified.currentTurn === 'player') {
    gameState.phase = 'playerTurn';
  } else {
    gameState.phase = 'enemyTurn';
  }
}

/**
 * Convert unified card back to player card format
 */
function convertUnifiedToPlayerCard(card: UnifiedCard): CardData {
  return {
    id: card.cardId,
    name: card.name,
    type: card.type as any,
    cost: card.cost,
    dmg: card.effects.damage,
    block: card.effects.block,
    draw: card.effects.draw,
    energyGain: card.effects.energyGain,
    rarity: card.rarity,
    tags: card.tags,
    desc: card.description,
    exhaust: card.exhausts,
    upgraded: card.upgraded
  };
}

/**
 * Create a unified card play command
 */
export interface UnifiedPlayCardCommand {
  type: 'UnifiedPlayCard';
  entityId: string;
  cardIndex: number;
  targetId?: string;
}

/**
 * Handle unified card play in existing game state
 */
export function handleUnifiedCardPlay(
  gameState: GameState,
  command: UnifiedPlayCardCommand,
  rng: RNG
): void {
  // Convert to unified state
  const unified = convertToUnifiedState(gameState, rng);

  // Get the card to play
  const entity = command.entityId;
  const hand = unified.piles![entity].hand;
  const card = hand[command.cardIndex];

  if (!card) {
    console.error(`Card not found at index ${command.cardIndex}`);
    return;
  }

  // Check and spend energy
  const energy = unified.energy![entity];
  if (!spendEnergy(energy, card.cost)) {
    console.error(`Not enough energy to play ${card.name}`);
    return;
  }

  // Apply card effects
  applyUnifiedCardEffects(gameState, card, command.targetId);

  // Move card to discard or exhaust
  if (card.exhausts) {
    exhaustCard(unified.piles![entity], card);
  } else {
    discardCard(unified.piles![entity], card);
  }

  // Sync back to game state
  syncUnifiedToGameState(unified, gameState);
}

/**
 * Apply unified card effects to game state
 */
function applyUnifiedCardEffects(
  gameState: GameState,
  card: UnifiedCard,
  targetId?: string
): void {
  // Apply damage
  if (card.effects.damage && targetId) {
    if (targetId === 'player') {
      gameState.player.hp -= card.effects.damage;
    } else {
      const enemy = gameState.enemies?.find(e => e.id === targetId);
      if (enemy) {
        enemy.hp -= card.effects.damage;
      }
    }
  }

  // Apply block
  if (card.effects.block) {
    if (card.owner === 'player') {
      gameState.player.block = (gameState.player.block || 0) + card.effects.block;
    } else {
      const enemy = gameState.enemies?.find(e => e.id === card.owner);
      if (enemy) {
        enemy.block = (enemy.block || 0) + card.effects.block;
      }
    }
  }

  // Apply draw
  if (card.effects.draw) {
    // Draw is handled by pile management
  }

  // Apply energy gain
  if (card.effects.energyGain) {
    if (card.owner === 'player') {
      gameState.energy = Math.min(
        gameState.energy + card.effects.energyGain,
        gameState.maxEnergy || 3
      );
    } else {
      gameState.enemyEnergy = Math.min(
        (gameState.enemyEnergy || 0) + card.effects.energyGain,
        3
      );
    }
  }

  // Apply custom effects
  if (card.effects.custom) {
    for (const effect of card.effects.custom) {
      applyCustomEffect(gameState, effect, card.owner);
    }
  }
}

/**
 * Apply custom effect
 */
function applyCustomEffect(
  gameState: GameState,
  effect: any,
  owner: string
): void {
  // TODO: Implement custom effects
  console.log(`Applying custom effect: ${effect.type}`);
}

/**
 * Check if unified system should be used
 */
export function shouldUseUnifiedSystem(gameState: GameState): boolean {
  // Enable for specific monsters that use the new system
  const unifiedMonsters = ['phi-krasue', 'phi-pop', 'phi-krahang'];

  return gameState.enemies?.some(e =>
    unifiedMonsters.includes(e.id)
  ) || false;
}

/**
 * Initialize unified system for combat
 */
export function initializeUnifiedCombat(
  gameState: GameState,
  rng: RNG
): Partial<UnifiedGameState> {
  const unified = convertToUnifiedState(gameState, rng);

  // Draw initial hands
  if (unified.piles?.player) {
    drawCards(unified.piles.player, 5, rng);
  }

  for (const enemyId of Object.keys(unified.piles || {}).filter(id => id !== 'player')) {
    const behavior = unified.behaviors![enemyId];
    if (behavior.deck) {
      drawCards(
        unified.piles![enemyId],
        behavior.deck.handSize,
        rng
      );
    }
  }

  return unified;
}