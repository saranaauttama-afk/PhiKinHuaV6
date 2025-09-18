/**
 * Unified Game Manager
 * Central manager for the unified card game system
 */

import {
  UnifiedCard,
  CardPiles,
  EnergyState,
  MonsterBehavior,
  AnimationQueue,
  AnimationEvent,
  CardPlayResult,
  CardTarget,
  UnifiedGameState
} from './types';

import {
  createUnifiedCard,
  convertPlayerCards,
  convertEnemyCards,
  createMonsterDeck,
  canPlayCard,
  getPlayableCards
} from './cardFactory';

import {
  createEmptyPiles,
  moveCard,
  drawCards,
  drawUpToHandSize,
  discardCard,
  exhaustCard,
  discardHand,
  setupDeck,
  applyEthereal,
  discardNonRetainedCards
} from './pileManager';

import {
  createEnergyState,
  resetEnergy,
  regenerateEnergy,
  spendEnergy,
  gainEnergy,
  hasEnergy,
  startTurnEnergy,
  endTurnEnergy
} from './energyManager';

import { GameState } from '../types';
import { RNG } from '../rng';

/**
 * Main game manager class
 */
export class UnifiedGameManager {
  private state: UnifiedGameState;
  private rng: RNG;
  private animationHandlers: Map<string, (event: AnimationEvent) => Promise<void>>;

  constructor(rng: RNG) {
    this.rng = rng;
    this.animationHandlers = new Map();
    this.state = this.createInitialState();
  }

  /**
   * Create initial game state
   */
  private createInitialState(): UnifiedGameState {
    return {
      piles: {
        player: createEmptyPiles()
      },
      energy: {
        player: createEnergyState(3, 3)
      },
      behaviors: {},
      animations: new AnimationQueue(),
      currentTurn: 'player',
      turnNumber: 0
    };
  }

  /**
   * Initialize combat with player and enemies
   */
  initializeCombat(
    playerDeck: UnifiedCard[],
    enemies: Array<{ id: string; behavior: MonsterBehavior }>
  ): void {
    // Setup player
    setupDeck(this.state.piles.player, playerDeck, this.rng);
    resetEnergy(this.state.energy.player);

    // Setup enemies
    for (const enemy of enemies) {
      // Create piles for enemy
      this.state.piles[enemy.id] = createEmptyPiles();

      // Create energy state for enemy
      const energyPerTurn = enemy.behavior.deck?.energyPerTurn || 3;
      this.state.energy[enemy.id] = createEnergyState(energyPerTurn, energyPerTurn);

      // Store behavior
      this.state.behaviors[enemy.id] = enemy.behavior;

      // Setup enemy deck if deck-based
      if (enemy.behavior.type === 'deck' && enemy.behavior.deck) {
        const deck = createMonsterDeck(
          enemy.behavior.deck.cards,
          enemy.id
        );
        setupDeck(this.state.piles[enemy.id], deck, this.rng);
      }
    }

    // Reset turn counter
    this.state.turnNumber = 0;

    // Draw initial hands
    this.drawInitialHands();
  }

  /**
   * Draw initial hands for all entities
   */
  private drawInitialHands(): void {
    // Player draws 5 cards
    drawCards(this.state.piles.player, 5, this.rng);

    // Enemies draw based on their behavior
    for (const enemyId of this.getEnemyIds()) {
      const behavior = this.state.behaviors[enemyId];
      if (behavior.deck) {
        drawCards(
          this.state.piles[enemyId],
          behavior.deck.handSize,
          this.rng
        );
      }
    }
  }

  /**
   * Start a new turn
   */
  startTurn(entity: 'player' | string): void {
    this.state.currentTurn = entity;

    if (entity === 'player') {
      this.startPlayerTurn();
    } else {
      this.startEnemyTurn(entity);
    }
  }

  /**
   * Start player turn
   */
  private startPlayerTurn(): void {
    this.state.turnNumber++;

    // Regenerate energy
    startTurnEnergy(this.state.energy.player);

    // Draw card
    drawCards(this.state.piles.player, 1, this.rng);

    // Queue animation
    this.state.animations.add({
      id: `turn_start_${this.state.turnNumber}`,
      type: 'buff',
      source: 'player',
      data: { message: 'Player Turn' },
      duration: 500
    });
  }

  /**
   * Start enemy turn
   */
  private startEnemyTurn(enemyId: string): void {
    const behavior = this.state.behaviors[enemyId];
    const energy = this.state.energy[enemyId];
    const piles = this.state.piles[enemyId];

    // Regenerate energy
    startTurnEnergy(energy);

    // Draw cards based on behavior
    if (behavior.deck) {
      drawUpToHandSize(piles, behavior.deck.handSize, this.rng);
    }

    // Queue animation
    this.state.animations.add({
      id: `enemy_turn_${enemyId}`,
      type: 'buff',
      source: enemyId,
      data: { message: `${enemyId} Turn` },
      duration: 500
    });
  }

  /**
   * End current turn
   */
  endTurn(): void {
    const entity = this.state.currentTurn;

    if (entity === 'player') {
      this.endPlayerTurn();
    } else {
      this.endEnemyTurn(entity);
    }

    // Switch to next entity's turn
    this.switchToNextTurn();
  }

  /**
   * End player turn
   */
  private endPlayerTurn(): void {
    const piles = this.state.piles.player;
    const energy = this.state.energy.player;

    // Apply ethereal cards
    applyEthereal(piles);

    // Discard non-retained cards
    discardNonRetainedCards(piles);

    // End turn energy effects
    endTurnEnergy(energy);
  }

  /**
   * End enemy turn
   */
  private endEnemyTurn(enemyId: string): void {
    const piles = this.state.piles[enemyId];
    const energy = this.state.energy[enemyId];

    // Discard hand
    discardHand(piles);

    // End turn energy effects
    endTurnEnergy(energy);
  }

  /**
   * Switch to next turn
   */
  private switchToNextTurn(): void {
    if (this.state.currentTurn === 'player') {
      // Switch to first enemy
      const enemies = this.getEnemyIds();
      if (enemies.length > 0) {
        this.startTurn(enemies[0]);
      }
    } else {
      // Check if there are more enemies
      const enemies = this.getEnemyIds();
      const currentIndex = enemies.indexOf(this.state.currentTurn);

      if (currentIndex < enemies.length - 1) {
        // Next enemy
        this.startTurn(enemies[currentIndex + 1]);
      } else {
        // Back to player
        this.startTurn('player');
      }
    }
  }

  /**
   * Play a card
   */
  async playCard(
    card: UnifiedCard,
    target?: CardTarget
  ): Promise<CardPlayResult> {
    const owner = card.owner;
    const energy = this.state.energy[owner];
    const piles = this.state.piles[owner];

    // Check if card can be played
    if (!canPlayCard(card, energy.current)) {
      return {
        success: false,
        card,
        energySpent: 0,
        effectsApplied: [],
        animations: [],
        errors: ['Not enough energy']
      };
    }

    // Spend energy
    spendEnergy(energy, card.cost);

    // Apply card effects
    const effectsApplied = await this.applyCardEffects(card, target);

    // Move card to appropriate pile
    if (card.exhausts) {
      exhaustCard(piles, card);
    } else {
      discardCard(piles, card);
    }

    // Create animations
    const animations: AnimationEvent[] = [
      {
        id: `play_${card.instanceId}`,
        type: 'card_play',
        source: owner,
        target: target?.id,
        data: { card },
        duration: 800,
        priority: 10
      }
    ];

    // Add effect animations
    if (card.effects.damage) {
      animations.push({
        id: `damage_${card.instanceId}`,
        type: 'damage',
        source: owner,
        target: target?.id || 'enemy',
        data: { damage: card.effects.damage },
        duration: 500,
        priority: 5
      });
    }

    // Queue animations
    for (const anim of animations) {
      this.state.animations.add(anim);
    }

    return {
      success: true,
      card,
      energySpent: card.cost,
      effectsApplied,
      animations
    };
  }

  /**
   * Apply card effects
   */
  private async applyCardEffects(
    card: UnifiedCard,
    target?: CardTarget
  ): Promise<string[]> {
    const applied: string[] = [];

    // Apply damage
    if (card.effects.damage) {
      // TODO: Apply damage to target
      applied.push(`damage:${card.effects.damage}`);
    }

    // Apply block
    if (card.effects.block) {
      // TODO: Apply block to owner
      applied.push(`block:${card.effects.block}`);
    }

    // Apply draw
    if (card.effects.draw) {
      drawCards(
        this.state.piles[card.owner],
        card.effects.draw,
        this.rng
      );
      applied.push(`draw:${card.effects.draw}`);
    }

    // Apply energy gain
    if (card.effects.energyGain) {
      gainEnergy(
        this.state.energy[card.owner],
        card.effects.energyGain
      );
      applied.push(`energy:${card.effects.energyGain}`);
    }

    // Apply custom effects
    if (card.effects.custom) {
      for (const effect of card.effects.custom) {
        // TODO: Apply custom effects
        applied.push(`custom:${effect.type}`);
      }
    }

    return applied;
  }

  /**
   * Get enemy IDs
   */
  private getEnemyIds(): string[] {
    return Object.keys(this.state.piles).filter(id => id !== 'player');
  }

  /**
   * Register animation handler
   */
  registerAnimationHandler(
    type: string,
    handler: (event: AnimationEvent) => Promise<void>
  ): void {
    this.animationHandlers.set(type, handler);
  }

  /**
   * Play all pending animations
   */
  async playAnimations(): Promise<void> {
    await this.state.animations.playAll(async (event) => {
      const handler = this.animationHandlers.get(event.type);
      if (handler) {
        await handler(event);
      }
    });
  }

  /**
   * Get current game state
   */
  getState(): UnifiedGameState {
    return this.state;
  }

  /**
   * Get entity's hand
   */
  getHand(entity: 'player' | string): UnifiedCard[] {
    return this.state.piles[entity]?.hand || [];
  }

  /**
   * Get entity's energy
   */
  getEnergy(entity: 'player' | string): EnergyState {
    return this.state.energy[entity];
  }

  /**
   * Get playable cards for entity
   */
  getPlayableCards(entity: 'player' | string): UnifiedCard[] {
    const hand = this.getHand(entity);
    const energy = this.getEnergy(entity);
    return getPlayableCards(hand, energy.current);
  }

  /**
   * Execute enemy AI turn
   */
  async executeEnemyTurn(enemyId: string): Promise<void> {
    const behavior = this.state.behaviors[enemyId];
    const hand = this.getHand(enemyId);
    const energy = this.getEnergy(enemyId);

    if (behavior.type === 'deck') {
      // Play cards based on available energy
      const playable = getPlayableCards(hand, energy.current);

      for (const card of playable) {
        // Simple AI: play all playable cards
        await this.playCard(card, { type: 'self' });

        // Check if we still have energy
        if (energy.current < 1) break;
      }
    } else if (behavior.type === 'pattern' && behavior.pattern) {
      // Play cards from pattern
      const pattern = behavior.pattern.cycle[behavior.pattern.currentIndex];

      for (const cardId of pattern.cards) {
        // Create and play card from pattern
        const card = createUnifiedCard({
          cardId,
          owner: enemyId
        });

        if (canPlayCard(card, energy.current)) {
          await this.playCard(card, { type: 'enemy', id: 'player' });
        }
      }

      // Advance pattern
      behavior.pattern.currentIndex =
        (behavior.pattern.currentIndex + 1) % behavior.pattern.cycle.length;
    }

    // Play animations
    await this.playAnimations();

    // End enemy turn
    this.endTurn();
  }

  /**
   * Check if combat is over
   */
  isCombatOver(): boolean {
    // TODO: Check player and enemy health
    return false;
  }

  /**
   * Reset game state
   */
  reset(): void {
    this.state = this.createInitialState();
  }
}