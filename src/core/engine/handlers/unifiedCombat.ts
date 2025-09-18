/**
 * Unified Combat Handler
 * Handles combat using the unified card system
 */

import { GameState, Command } from '../../types';
import { RNG } from '../../rng';
import {
  UnifiedCard,
  UnifiedGameState,
  MonsterBehavior,
  AnimationEvent
} from '../../unified/types';
import {
  createUnifiedCard,
  convertPlayerCards,
  convertEnemyCards,
  createMonsterDeck,
  canPlayCard,
  getPlayableCards
} from '../../unified/cardFactory';
import {
  createEmptyPiles,
  setupDeck,
  drawCards,
  drawUpToHandSize,
  discardCard,
  exhaustCard,
  discardHand,
  discardNonRetainedCards,
  applyEthereal
} from '../../unified/pileManager';
import {
  createEnergyState,
  resetEnergy,
  regenerateEnergy,
  spendEnergy,
  gainEnergy,
  startTurnEnergy,
  endTurnEnergy
} from '../../unified/energyManager';
import {
  convertToUnifiedState,
  syncUnifiedToGameState,
  shouldUseUnifiedSystem
} from '../../unified/integration';

// Store unified state separately from main game state
let unifiedState: Partial<UnifiedGameState> | null = null;

/**
 * Initialize unified combat
 */
export function initializeUnifiedCombat(s: GameState, r: RNG): void {
  if (!shouldUseUnifiedSystem(s)) {
    return;
  }

  console.log('[Unified] Initializing unified combat system');

  // Convert existing state to unified format
  unifiedState = convertToUnifiedState(s, r);

  // Setup initial decks and hands
  if (unifiedState.piles && unifiedState.behaviors) {
    // Player initial draw
    if (unifiedState.piles.player) {
      drawCards(unifiedState.piles.player, 5, r);
    }

    // Enemy initial draws
    for (const enemyId of Object.keys(unifiedState.behaviors)) {
      const behavior = unifiedState.behaviors[enemyId];
      const piles = unifiedState.piles[enemyId];

      if (behavior.deck && piles) {
        // Setup deck if not already setup
        if (piles.draw.length === 0 && piles.hand.length === 0) {
          const deck = createMonsterDeck(
            behavior.deck.cards,
            enemyId
          );
          setupDeck(piles, deck, r);
        }

        // Draw initial hand
        drawUpToHandSize(piles, behavior.deck.handSize, r);
      }
    }
  }

  // Sync back to game state
  syncUnifiedToGameState(unifiedState, s);

  console.log('[Unified] Combat initialized with unified system');
}

/**
 * Handle unified player turn start
 */
export function unifiedStartPlayerTurn(s: GameState, r: RNG): void {
  if (!unifiedState || !shouldUseUnifiedSystem(s)) {
    return;
  }

  console.log('[Unified] Starting player turn');

  // Update turn counter
  unifiedState.turnNumber = (unifiedState.turnNumber || 0) + 1;
  unifiedState.currentTurn = 'player';

  // Regenerate player energy
  if (unifiedState.energy?.player) {
    startTurnEnergy(unifiedState.energy.player);
  }

  // Draw a card
  if (unifiedState.piles?.player) {
    drawCards(unifiedState.piles.player, 1, r);
  }

  // Sync to game state
  syncUnifiedToGameState(unifiedState, s);
}

/**
 * Handle unified player turn end
 */
export function unifiedEndPlayerTurn(s: GameState, r: RNG): void {
  if (!unifiedState || !shouldUseUnifiedSystem(s)) {
    return;
  }

  console.log('[Unified] Ending player turn');

  if (unifiedState.piles?.player) {
    // Apply ethereal
    applyEthereal(unifiedState.piles.player);

    // Discard non-retained cards
    discardNonRetainedCards(unifiedState.piles.player);
  }

  // Update energy modifiers
  if (unifiedState.energy?.player) {
    endTurnEnergy(unifiedState.energy.player);
  }

  // Sync to game state
  syncUnifiedToGameState(unifiedState, s);
}

/**
 * Handle unified enemy turn
 */
export function unifiedEnemyTurn(s: GameState, enemyId: string, r: RNG): void {
  if (!unifiedState || !shouldUseUnifiedSystem(s)) {
    return;
  }

  console.log(`[Unified] Processing ${enemyId} turn`);

  const behavior = unifiedState.behaviors![enemyId];
  const piles = unifiedState.piles![enemyId];
  const energy = unifiedState.energy![enemyId];

  if (!behavior || !piles || !energy) {
    console.error(`[Unified] Missing data for ${enemyId}`);
    return;
  }

  // Start enemy turn
  unifiedState.currentTurn = enemyId;
  startTurnEnergy(energy);

  // Draw cards up to hand size
  if (behavior.deck) {
    drawUpToHandSize(piles, behavior.deck.handSize, r);
  }

  // Play cards based on behavior type
  if (behavior.type === 'deck') {
    playEnemyDeckCards(s, enemyId, piles, energy, r);
  } else if (behavior.type === 'pattern') {
    playEnemyPatternCards(s, enemyId, behavior, energy, r);
  }

  // End enemy turn
  discardHand(piles);
  endTurnEnergy(energy);

  // Sync to game state
  syncUnifiedToGameState(unifiedState, s);
}

/**
 * Play enemy cards from deck
 */
function playEnemyDeckCards(
  s: GameState,
  enemyId: string,
  piles: any,
  energy: any,
  r: RNG
): void {
  const hand = piles.hand as UnifiedCard[];
  const playable = getPlayableCards(hand, energy.current);

  console.log(`[Unified] ${enemyId} has ${playable.length} playable cards`);

  // Simple AI: Play cards in order until out of energy
  for (const card of playable) {
    if (!canPlayCard(card, energy.current)) {
      break;
    }

    console.log(`[Unified] ${enemyId} plays ${card.name} (cost: ${card.cost})`);

    // Spend energy
    spendEnergy(energy, card.cost);

    // Apply card effects
    applyUnifiedCardEffects(s, card, enemyId);

    // Move to discard
    if (card.exhausts) {
      exhaustCard(piles, card);
    } else {
      discardCard(piles, card);
    }
  }
}

/**
 * Play enemy cards from pattern
 */
function playEnemyPatternCards(
  s: GameState,
  enemyId: string,
  behavior: MonsterBehavior,
  energy: any,
  r: RNG
): void {
  if (!behavior.pattern) return;

  const pattern = behavior.pattern.cycle[behavior.pattern.currentIndex];

  for (const cardId of pattern.cards) {
    // Create card instance
    const card = createUnifiedCard({
      cardId,
      owner: enemyId
    });

    if (canPlayCard(card, energy.current)) {
      console.log(`[Unified] ${enemyId} plays ${card.name} from pattern`);

      // Spend energy
      spendEnergy(energy, card.cost);

      // Apply effects
      applyUnifiedCardEffects(s, card, enemyId);
    }
  }

  // Advance pattern
  behavior.pattern.currentIndex =
    (behavior.pattern.currentIndex + 1) % behavior.pattern.cycle.length;
}

/**
 * Apply unified card effects to game state
 */
function applyUnifiedCardEffects(
  s: GameState,
  card: UnifiedCard,
  owner: string
): void {
  const isPlayer = owner === 'player';
  const enemy = s.enemies?.find(e => e.id === owner);

  // Apply damage
  if (card.effects.damage) {
    const target = isPlayer ? s.enemies?.[0] : s.player;
    if (target) {
      const damage = card.effects.damage;
      const blocked = Math.min(damage, target.block || 0);
      target.block = Math.max(0, (target.block || 0) - blocked);
      target.hp -= (damage - blocked);

      console.log(`[Unified] ${card.name} deals ${damage} damage (${blocked} blocked)`);
    }
  }

  // Apply block
  if (card.effects.block) {
    if (isPlayer) {
      s.player.block = (s.player.block || 0) + card.effects.block;
    } else if (enemy) {
      enemy.block = (enemy.block || 0) + card.effects.block;
    }
    console.log(`[Unified] ${card.name} gives ${card.effects.block} block`);
  }

  // Apply draw
  if (card.effects.draw && unifiedState) {
    const piles = unifiedState.piles![owner];
    if (piles) {
      const drawn = drawCards(piles, card.effects.draw);
      console.log(`[Unified] ${card.name} draws ${drawn.length} cards`);
    }
  }

  // Apply energy gain
  if (card.effects.energyGain && unifiedState) {
    const energy = unifiedState.energy![owner];
    if (energy) {
      const gained = gainEnergy(energy, card.effects.energyGain);
      console.log(`[Unified] ${card.name} gains ${gained} energy`);
    }
  }

  // Apply status effects
  if (card.effects.vulnerable) {
    const target = isPlayer ? s.enemies?.[0] : s.player;
    if (target) {
      target.vulnerable = (target.vulnerable || 0) + card.effects.vulnerable;
      console.log(`[Unified] ${card.name} applies ${card.effects.vulnerable} vulnerable`);
    }
  }

  if (card.effects.weak) {
    const target = isPlayer ? s.enemies?.[0] : s.player;
    if (target) {
      target.weak = (target.weak || 0) + card.effects.weak;
      console.log(`[Unified] ${card.name} applies ${card.effects.weak} weak`);
    }
  }

  if (card.effects.poison) {
    const target = isPlayer ? s.enemies?.[0] : s.player;
    if (target) {
      target.poison = (target.poison || 0) + card.effects.poison;
      console.log(`[Unified] ${card.name} applies ${card.effects.poison} poison`);
    }
  }

  // Apply buffs
  if (card.effects.strength) {
    if (isPlayer) {
      s.player.strength = (s.player.strength || 0) + card.effects.strength;
    } else if (enemy) {
      enemy.strength = (enemy.strength || 0) + card.effects.strength;
    }
    console.log(`[Unified] ${card.name} gives ${card.effects.strength} strength`);
  }

  if (card.effects.dexterity) {
    if (isPlayer) {
      s.player.dexterity = (s.player.dexterity || 0) + card.effects.dexterity;
    } else if (enemy) {
      enemy.dexterity = (enemy.dexterity || 0) + card.effects.dexterity;
    }
    console.log(`[Unified] ${card.name} gives ${card.effects.dexterity} dexterity`);
  }

  // Apply healing
  if (card.effects.heal) {
    if (isPlayer) {
      s.player.hp = Math.min(s.player.hp + card.effects.heal, s.player.maxHp);
    } else if (enemy) {
      enemy.hp = Math.min(enemy.hp + card.effects.heal, enemy.maxHp);
    }
    console.log(`[Unified] ${card.name} heals ${card.effects.heal}`);
  }
}

/**
 * Handle unified card play command
 */
export function unifiedPlayCard(
  s: GameState,
  cmd: { entityId: string; cardIndex: number; targetId?: string },
  r: RNG
): void {
  if (!unifiedState || !shouldUseUnifiedSystem(s)) {
    return;
  }

  const { entityId, cardIndex, targetId } = cmd;
  const piles = unifiedState.piles![entityId];
  const energy = unifiedState.energy![entityId];

  if (!piles || !energy) {
    console.error(`[Unified] No piles/energy for ${entityId}`);
    return;
  }

  const card = piles.hand[cardIndex];
  if (!card) {
    console.error(`[Unified] No card at index ${cardIndex}`);
    return;
  }

  if (!canPlayCard(card, energy.current)) {
    console.error(`[Unified] Not enough energy for ${card.name}`);
    return;
  }

  console.log(`[Unified] ${entityId} plays ${card.name}`);

  // Spend energy
  spendEnergy(energy, card.cost);

  // Apply effects
  applyUnifiedCardEffects(s, card, entityId);

  // Move card
  if (card.exhausts) {
    exhaustCard(piles, card);
  } else {
    discardCard(piles, card);
  }

  // Sync to game state
  syncUnifiedToGameState(unifiedState, s);
}

/**
 * Get unified state for UI
 */
export function getUnifiedState(): Partial<UnifiedGameState> | null {
  return unifiedState;
}

/**
 * Reset unified state
 */
export function resetUnifiedState(): void {
  unifiedState = null;
}