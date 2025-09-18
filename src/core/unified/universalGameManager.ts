/**
 * Universal Game Manager
 * Complete game manager that handles all entities and cards
 */

import {
  UnifiedGameState,
  GameEntity,
  UniversalCard,
  UniversalPiles,
  EnergySystem,
  EntityBehavior,
  AnimationQueue,
  CardPlayResult,
  GameRules,
  EffectTarget,
  AppliedEffect,
  StateChange,
  AnimationEvent
} from './completeTypes';

import {
  createUniversalCard,
  convertPlayerCardsToUniversal,
  convertEnemyCardsToUniversal,
  cloneUniversalCard,
  canPlayCard,
  getPlayableCards
} from './universalCardFactory';

import {
  createEmptyPiles,
  moveCard,
  drawCards,
  drawUpToHandSize,
  discardCard,
  discardCardByIndex,
  exhaustCard,
  exhaustCardByIndex,
  discardHand,
  setupDeck,
  shuffleCards
} from './pileManager';

import {
  createEnergyState,
  spendEnergy,
  gainEnergy,
  resetEnergy,
  startTurnEnergy,
  endTurnEnergy
} from './energyManager';

import { RNG, next, shuffle } from '../rng';
import { HAND_SIZE } from '../balance/core';
import { GameState, CardData } from '../types';

/**
 * Main Universal Game Manager
 */
export class UniversalGameManager {
  private state: UnifiedGameState;
  private rng: RNG;
  private animationHandlers: Map<string, (event: AnimationEvent) => Promise<void>>;

  constructor(rng: RNG) {
    this.rng = rng;
    this.animationHandlers = new Map();
    this.state = this.createInitialState();
  }

  /**
   * Create initial unified game state
   */
  private createInitialState(): UnifiedGameState {
    return {
      entities: {},
      turnOrder: [],
      currentTurnIndex: 0,
      turnNumber: 0,
      roundNumber: 0,
      phase: 'setup',
      animations: new AnimationQueue(),
      pendingEffects: [],
      rules: this.createDefaultRules()
    };
  }

  /**
   * Create default game rules
   */
  private createDefaultRules(): GameRules {
    return {
      maxHandSize: HAND_SIZE,
      maxEnergyPerTurn: 10,
      drawPerTurn: 1,
      energyCarryOver: false,
      blockDecaysPerTurn: true,
      statusEffectDecay: 'start_of_turn',
      customRules: {}
    };
  }

  /**
   * Initialize combat with player and enemies
   */
  initializeCombat(
    playerDeck: CardData[],
    enemies: Array<{ id: string; name: string; hp: number; maxHp: number; behavior: EntityBehavior }>
  ): void {
    console.log('[UniversalGM] Initializing combat');

    // Reset state
    this.state.entities = {};
    this.state.turnOrder = [];
    this.state.currentTurnIndex = 0;
    this.state.turnNumber = 0;
    this.state.roundNumber = 1;
    this.state.phase = 'combat';

    // Create player entity
    this.createPlayerEntity(playerDeck);

    // Create enemy entities
    for (const enemyData of enemies) {
      this.createEnemyEntity(enemyData);
    }

    // Setup turn order
    this.state.turnOrder = ['player', ...enemies.map(e => e.id)];

    // Draw initial hands
    this.drawInitialHands();

    console.log('[UniversalGM] Combat initialized', {
      entities: Object.keys(this.state.entities),
      turnOrder: this.state.turnOrder
    });
  }

  /**
   * Create player entity
   */
  private createPlayerEntity(deck: CardData[]): void {
    const universalCards = convertPlayerCardsToUniversal(deck);
    const piles = createEmptyPiles();
    setupDeck(piles, universalCards, this.rng);

    const player: GameEntity = {
      id: 'player',
      type: 'player',
      name: 'Player',
      hp: 100, // TODO: Get from game state
      maxHp: 100,
      block: 0,
      statusEffects: [],
      piles,
      energy: createEnergyState(3, 3),
      isActive: true,
      isTargetable: false,
      isVisible: true,
      data: {}
    };

    this.state.entities.player = player;
  }

  /**
   * Create enemy entity
   */
  private createEnemyEntity(enemyData: {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    behavior: EntityBehavior;
  }): void {
    const piles = createEmptyPiles();
    const energy = createEnergyState(3, 3);

    // Setup deck based on behavior
    if (enemyData.behavior.deckAI || enemyData.behavior.type === 'deck_ai') {
      const cardPool = this.getEnemyCardPool(enemyData.id);
      const deck = convertEnemyCardsToUniversal(cardPool, enemyData.id);
      setupDeck(piles, deck, this.rng);
    }

    const enemy: GameEntity = {
      id: enemyData.id,
      type: 'monster',
      name: enemyData.name,
      hp: enemyData.hp,
      maxHp: enemyData.maxHp,
      block: 0,
      statusEffects: [],
      piles,
      energy,
      behavior: enemyData.behavior,
      isActive: true,
      isTargetable: true,
      isVisible: true,
      data: {}
    };

    this.state.entities[enemyData.id] = enemy;
  }

  /**
   * Get enemy card pool based on enemy ID
   */
  private getEnemyCardPool(enemyId: string): string[] {
    // Default card pools for different enemies
    switch (enemyId) {
      case 'phi-krasue':
        return ['krasue_claw', 'krasue_guard', 'krasue_swipe'];
      case 'phi-pop':
        return ['pop_strike', 'pop_defend'];
      default:
        return ['strike', 'defend']; // Fallback
    }
  }

  /**
   * Draw initial hands for all entities
   */
  private drawInitialHands(): void {
    for (const entity of Object.values(this.state.entities)) {
      const handSize = this.getInitialHandSize(entity);
      drawCards(entity.piles, handSize, this.rng);
    }
  }

  /**
   * Get initial hand size for an entity
   */
  private getInitialHandSize(entity: GameEntity): number {
    if (entity.type === 'player') {
      return this.state.gameRules.maxHandSize;
    } else if (entity.behavior?.deckAI) {
      return 3; // Default for deck-based enemies
    }
    return 0;
  }

  /**
   * Start next turn
   */
  startNextTurn(): void {
    // End current entity's turn
    this.endCurrentTurn();

    // Move to next entity
    this.state.currentTurnIndex = (this.state.currentTurnIndex + 1) % this.state.turnOrder.length;

    // If back to first entity, increment turn/round
    if (this.state.currentTurnIndex === 0) {
      this.state.turnNumber++;
      this.state.roundNumber = Math.floor(this.state.turnNumber / this.state.turnOrder.length) + 1;
    }

    // Start new entity's turn
    this.startCurrentTurn();
  }

  /**
   * Start current entity's turn
   */
  private startCurrentTurn(): void {
    const entityId = this.getCurrentEntityId();
    const entity = this.state.entities[entityId];

    if (!entity) return;

    console.log(`[UniversalGM] Starting turn for ${entityId}`);

    // Regenerate energy
    startTurnEnergy(entity.energy);

    // Draw cards - only draw for player when returning from monster turn
    if (entity.type === 'player') {
      // Check if this is player's first turn or returning from monster turn
      const isReturningFromMonster = this.state.turnNumber > 0 && this.state.currentTurnIndex === 0;
      const isInitialTurn = this.state.turnNumber === 0;

      if (isInitialTurn || isReturningFromMonster) {
        drawUpToHandSize(entity.piles, this.state.gameRules.maxHandSize, this.rng);
        console.log('[UniversalGM] Drew cards for player (returning to turn)');
      } else {
        console.log('[UniversalGM] Skipped drawing cards for player (same turn)');
      }
    } else if (entity.behavior?.deckAI) {
      const handSize = entity.behavior.deckAI.energyUsage === 'conservative' ? 2 : 3;
      drawUpToHandSize(entity.piles, handSize, this.rng);
    }

    // Process turn start effects
    this.processTurnStartEffects(entity);

    // Execute AI turn if not player
    if (entity.type !== 'player') {
      setTimeout(() => this.executeAITurn(entityId), 500);
    }
  }

  /**
   * End current entity's turn
   */
  private endCurrentTurn(): void {
    const entityId = this.getCurrentEntityId();
    const entity = this.state.entities[entityId];

    if (!entity) return;

    console.log(`[UniversalGM] Ending turn for ${entityId}`);

    // Process turn end effects
    this.processTurnEndEffects(entity);

    // Reset block if rules say so
    if (this.state.rules.blockDecaysPerTurn) {
      entity.block = 0;
    }

    // Discard hand if not player (or if rules require it)
    if (entity.type !== 'player') {
      discardHand(entity.piles);
    }

    // End turn energy effects
    endTurnEnergy(entity.energy);
  }

  /**
   * Get current entity ID
   */
  private getCurrentEntityId(): string {
    return this.state.turnOrder[this.state.currentTurnIndex];
  }

  /**
   * Execute AI turn
   */
  private async executeAITurn(entityId: string): Promise<void> {
    const entity = this.state.entities[entityId];
    if (!entity || !entity.behavior) return;

    console.log(`[UniversalGM] Executing AI turn for ${entityId}`);

    switch (entity.behavior.type) {
      case 'deck_ai':
        await this.executeDeckAI(entity);
        break;
      case 'pattern_ai':
        await this.executePatternAI(entity);
        break;
      // Add other AI types as needed
    }

    // Play animations
    await this.state.animations.playAll(async (event) => {
      const handler = this.animationHandlers.get(event.type);
      if (handler) {
        await handler(event);
      }
    });

    // End turn automatically
    setTimeout(() => this.startNextTurn(), 1000);
  }

  /**
   * Execute deck-based AI
   */
  private async executeDeckAI(entity: GameEntity): Promise<void> {
    const playableCards = getPlayableCards(entity.piles.hand, entity.energy.current);

    // Simple AI: play all playable cards
    for (const card of playableCards) {
      if (entity.energy.current < card.cost) break;

      const target = this.selectTarget(card, entity);
      await this.playCard(card.instanceId, entity.id, target);

      // Small delay between cards
      await new Promise(resolve => setTimeout(resolve, 800));
    }
  }

  /**
   * Execute pattern-based AI
   */
  private async executePatternAI(entity: GameEntity): Promise<void> {
    // TODO: Implement pattern-based AI
    console.log(`[UniversalGM] Pattern AI not yet implemented for ${entity.id}`);
  }

  /**
   * Select target for AI card play
   */
  private selectTarget(card: UniversalCard, source: GameEntity): string {
    // Simple target selection: attack player, buff self
    if (card.effects.damage && card.effects.damage > 0) {
      return 'player'; // Attack player
    }
    return source.id; // Target self for buffs/blocks
  }

  /**
   * Play a card synchronously (for migration layer)
   */
  playCardSync(
    cardInstanceId: string,
    sourceEntityId: string,
    targetEntityId?: string
  ): CardPlayResult {
    const sourceEntity = this.state.entities[sourceEntityId];
    if (!sourceEntity) {
      return this.createFailedResult('Source entity not found', cardInstanceId);
    }

    // Find card in hand
    const cardIndex = sourceEntity.piles.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (cardIndex === -1) {
      return this.createFailedResult('Card not found in hand', cardInstanceId);
    }

    const card = sourceEntity.piles.hand[cardIndex];

    // Check if card can be played
    if (!canPlayCard(card, sourceEntity.energy.current)) {
      return this.createFailedResult('Not enough energy', cardInstanceId);
    }

    console.log(`[UniversalGM] ${sourceEntityId} plays ${card.name} (sync) - index ${cardIndex}`);
    console.log(`[UniversalGM] BEFORE REMOVAL - Universal hand:`, sourceEntity.piles.hand.map((c, i) => `${i}: ${c.name}(${c.instanceId})`));

    // Spend energy
    const energySpent = card.cost;
    spendEnergy(sourceEntity.energy, energySpent);

    // Apply card effects synchronously BEFORE moving card
    const effectsApplied = this.applyCardEffectsSync(card, sourceEntity, targetEntityId);

    // Move card to appropriate pile using index (this also removes from hand)
    if (card.exhausts) {
      const exhaustedCard = exhaustCardByIndex(sourceEntity.piles, cardIndex);
      console.log(`[UniversalGM] Exhausted card:`, exhaustedCard?.name);
    } else {
      const discardedCard = discardCardByIndex(sourceEntity.piles, cardIndex);
      console.log(`[UniversalGM] Discarded card:`, discardedCard?.name);
    }

    console.log(`[UniversalGM] AFTER DISCARD/EXHAUST - Universal hand:`, sourceEntity.piles.hand.map((c, i) => `${i}: ${c.name}(${c.instanceId})`));

    // Create animations (but don't queue them for sync version)
    const animations: AnimationEvent[] = [
      {
        id: `play_${card.instanceId}`,
        type: 'card_play',
        source: sourceEntityId,
        target: targetEntityId,
        data: { card },
        duration: 800,
        priority: 10
      }
    ];

    return {
      success: true,
      card,
      source: sourceEntityId,
      target: targetEntityId,
      energySpent,
      cardsDrawn: 0,
      effectsApplied,
      stateChanges: [],
      animations,
      issues: []
    };
  }

  /**
   * Play a card
   */
  async playCard(
    cardInstanceId: string,
    sourceEntityId: string,
    targetEntityId?: string
  ): Promise<CardPlayResult> {
    const sourceEntity = this.state.entities[sourceEntityId];
    if (!sourceEntity) {
      return this.createFailedResult('Source entity not found', cardInstanceId);
    }

    // Find card in hand
    const cardIndex = sourceEntity.piles.hand.findIndex(c => c.instanceId === cardInstanceId);
    if (cardIndex === -1) {
      return this.createFailedResult('Card not found in hand', cardInstanceId);
    }

    const card = sourceEntity.piles.hand[cardIndex];

    // Check if card can be played
    if (!canPlayCard(card, sourceEntity.energy.current)) {
      return this.createFailedResult('Not enough energy', cardInstanceId);
    }

    console.log(`[UniversalGM] ${sourceEntityId} plays ${card.name}`);

    // Spend energy
    const energySpent = card.cost;
    spendEnergy(sourceEntity.energy, energySpent);

    // Apply card effects
    const effectsApplied = await this.applyCardEffects(card, sourceEntity, targetEntityId);

    // Move card to appropriate pile using index (this also removes from hand)
    if (card.exhausts) {
      const exhaustedCard = exhaustCardByIndex(sourceEntity.piles, cardIndex);
      console.log(`[UniversalGM] Exhausted card:`, exhaustedCard?.name);
    } else {
      const discardedCard = discardCardByIndex(sourceEntity.piles, cardIndex);
      console.log(`[UniversalGM] Discarded card:`, discardedCard?.name);
    }

    // Create animations
    const animations: AnimationEvent[] = [
      {
        id: `play_${card.instanceId}`,
        type: 'card_play',
        source: sourceEntityId,
        target: targetEntityId,
        data: { card },
        duration: 800,
        priority: 10
      }
    ];

    // Queue animations
    for (const anim of animations) {
      this.state.animations.add(anim);
    }

    return {
      success: true,
      card,
      source: sourceEntityId,
      target: targetEntityId,
      energySpent,
      cardsDrawn: 0,
      effectsApplied,
      stateChanges: [],
      animations,
      issues: []
    };
  }

  /**
   * Apply card effects synchronously (for migration layer)
   */
  private applyCardEffectsSync(
    card: UniversalCard,
    source: GameEntity,
    targetId?: string
  ): AppliedEffect[] {
    const applied: AppliedEffect[] = [];

    // Determine target
    const target = targetId ? this.state.entities[targetId] : source;

    if (!target) {
      console.warn(`[UniversalGM] Target ${targetId} not found`);
      return applied;
    }

    // Apply damage
    if (card.effects.damage) {
      const damage = card.effects.damage;
      const actualDamage = this.applyDamage(target, damage);
      applied.push({
        type: 'damage',
        value: damage,
        actualValue: actualDamage,
        source: source.id,
        target: target.id,
        success: actualDamage > 0
      });
    }

    // Apply block
    if (card.effects.block) {
      const block = card.effects.block;
      source.block += block;
      applied.push({
        type: 'block',
        value: block,
        actualValue: block,
        source: source.id,
        target: source.id,
        success: true
      });
    }

    // Apply heal
    if (card.effects.heal) {
      const heal = card.effects.heal;
      const actualHeal = this.applyHeal(source, heal);
      applied.push({
        type: 'heal',
        value: heal,
        actualValue: actualHeal,
        source: source.id,
        target: source.id,
        success: actualHeal > 0
      });
    }

    // Apply draw
    if (card.effects.draw) {
      const drawn = drawCards(source.piles, card.effects.draw, this.rng);
      applied.push({
        type: 'draw',
        value: card.effects.draw,
        actualValue: drawn.length,
        source: source.id,
        target: source.id,
        success: drawn.length > 0
      });
    }

    // Apply energy gain
    if (card.effects.energyGain) {
      const gained = gainEnergy(source.energy, card.effects.energyGain);
      applied.push({
        type: 'energy',
        value: card.effects.energyGain,
        actualValue: gained,
        source: source.id,
        target: source.id,
        success: gained > 0
      });
    }

    return applied;
  }

  /**
   * Apply card effects
   */
  private async applyCardEffects(
    card: UniversalCard,
    source: GameEntity,
    targetId?: string
  ): Promise<AppliedEffect[]> {
    const applied: AppliedEffect[] = [];

    // Determine target
    const target = targetId ? this.state.entities[targetId] : source;

    if (!target) {
      console.warn(`[UniversalGM] Target ${targetId} not found`);
      return applied;
    }

    // Apply damage
    if (card.effects.damage) {
      const damage = card.effects.damage;
      const actualDamage = this.applyDamage(target, damage);
      applied.push({
        type: 'damage',
        value: damage,
        actualValue: actualDamage,
        source: source.id,
        target: target.id,
        success: actualDamage > 0
      });

      // Queue damage animation
      this.state.animations.add({
        id: `damage_${card.instanceId}`,
        type: 'damage',
        source: source.id,
        target: target.id,
        data: { damage: actualDamage },
        duration: 500,
        priority: 8
      });
    }

    // Apply block
    if (card.effects.block) {
      const block = card.effects.block;
      source.block += block;
      applied.push({
        type: 'block',
        value: block,
        actualValue: block,
        source: source.id,
        target: source.id,
        success: true
      });
    }

    // Apply heal
    if (card.effects.heal) {
      const heal = card.effects.heal;
      const actualHeal = this.applyHeal(source, heal);
      applied.push({
        type: 'heal',
        value: heal,
        actualValue: actualHeal,
        source: source.id,
        target: source.id,
        success: actualHeal > 0
      });
    }

    // Apply draw
    if (card.effects.draw) {
      const drawn = drawCards(source.piles, card.effects.draw, this.rng);
      applied.push({
        type: 'draw',
        value: card.effects.draw,
        actualValue: drawn.length,
        source: source.id,
        target: source.id,
        success: drawn.length > 0
      });
    }

    // Apply energy gain
    if (card.effects.energyGain) {
      const gained = gainEnergy(source.energy, card.effects.energyGain);
      applied.push({
        type: 'energy',
        value: card.effects.energyGain,
        actualValue: gained,
        source: source.id,
        target: source.id,
        success: gained > 0
      });
    }

    return applied;
  }

  /**
   * Apply damage to target
   */
  private applyDamage(target: GameEntity, damage: number): number {
    // Apply block first
    const blocked = Math.min(damage, target.block);
    target.block -= blocked;
    const actualDamage = damage - blocked;

    // Apply remaining damage to HP
    target.hp = Math.max(0, target.hp - actualDamage);

    console.log(`[UniversalGM] ${target.name} takes ${actualDamage} damage (${blocked} blocked)`);

    return actualDamage;
  }

  /**
   * Apply heal to target
   */
  private applyHeal(target: GameEntity, heal: number): number {
    const oldHp = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + heal);
    const actualHeal = target.hp - oldHp;

    console.log(`[UniversalGM] ${target.name} heals ${actualHeal} HP`);

    return actualHeal;
  }

  /**
   * Process turn start effects
   */
  private processTurnStartEffects(entity: GameEntity): void {
    // Process status effects
    // TODO: Implement status effect processing
    console.log(`[UniversalGM] Processing turn start effects for ${entity.id}`);
  }

  /**
   * Process turn end effects
   */
  private processTurnEndEffects(entity: GameEntity): void {
    // Process status effects
    // TODO: Implement status effect processing
    console.log(`[UniversalGM] Processing turn end effects for ${entity.id}`);
  }

  /**
   * Create failed result
   */
  private createFailedResult(error: string, cardInstanceId: string): CardPlayResult {
    return {
      success: false,
      card: {} as UniversalCard,
      source: '',
      energySpent: 0,
      cardsDrawn: 0,
      effectsApplied: [],
      stateChanges: [],
      animations: [],
      issues: [error]
    };
  }

  /**
   * Check if combat is over
   */
  isCombatOver(): { over: boolean; winner?: string } {
    const player = this.state.entities.player;
    if (!player || player.hp <= 0) {
      return { over: true, winner: 'enemy' };
    }

    const aliveEnemies = Object.values(this.state.entities)
      .filter(e => e.type === 'monster' && e.hp > 0);

    if (aliveEnemies.length === 0) {
      return { over: true, winner: 'player' };
    }

    return { over: false };
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
   * Get current game state
   */
  getState(): UnifiedGameState {
    return this.state;
  }

  /**
   * Get entity by ID
   */
  getEntity(id: string): GameEntity | undefined {
    return this.state.entities[id];
  }

  /**
   * Get current turn entity
   */
  getCurrentTurnEntity(): GameEntity | undefined {
    const entityId = this.getCurrentEntityId();
    return this.state.entities[entityId];
  }

  /**
   * Update game rules
   */
  updateGameRules(newRules: Partial<GameRules>): void {
    this.state.gameRules = { ...this.state.gameRules, ...newRules };
    console.log('[UniversalGM] Game rules updated:', newRules);
  }

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type: GameEntity['type']): GameEntity[] {
    return Object.values(this.state.entities).filter(e => e.type === type);
  }

  /**
   * Reset the game manager
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Convert from old game state format
   */
  static fromLegacyGameState(legacyState: GameState, rng: RNG): UniversalGameManager {
    const manager = new UniversalGameManager(rng);

    // Convert player data
    const playerDeck = legacyState.piles.hand.concat(
      legacyState.piles.draw,
      legacyState.piles.discard
    );

    // Convert enemy data
    const enemies = [];
    if (legacyState.enemy) {
      enemies.push({
        id: legacyState.enemy.id,
        name: legacyState.enemy.name,
        hp: legacyState.enemy.hp,
        maxHp: legacyState.enemy.maxHp,
        behavior: {
          id: legacyState.enemy.id,
          type: 'deck_ai' as const,
          deckAI: {
            cardSelection: 'random' as const,
            energyUsage: 'all' as const,
            targetPriority: [],
          }
        }
      });
    }

    if (enemies.length > 0) {
      manager.initializeCombat(playerDeck, enemies);
    }

    return manager;
  }
}