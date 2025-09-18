/**
 * Complete Unified Card System - Types for Both Players and Monsters
 * A comprehensive card system that handles all entities in the game
 */

import { Rarity, StatusEffect } from '../types';

/**
 * Universal card instance - used by ALL entities (players and monsters)
 */
export interface UniversalCard {
  // Identity
  instanceId: string;        // Unique ID: "player_strike_1234567890_001"
  cardId: string;           // Base card ID: "strike", "krasue_claw"
  owner: string;            // Owner ID: "player", "phi-krasue", etc.

  // Core properties
  name: string;
  cost: number;
  type: 'attack' | 'skill' | 'power' | 'curse' | 'status' | 'equipment';

  // Effects (unified for all card types)
  effects: CardEffects;

  // Metadata
  rarity?: Rarity;
  tags?: string[];
  description?: string;

  // State flags
  upgraded?: boolean;
  exhausts?: boolean;
  ethereal?: boolean;
  innate?: boolean;
  retain?: boolean;

  // Equipment specific
  equipmentId?: string;
  slotCost?: number;

  // Creation info
  createdAt: number;        // Timestamp for deterministic sorting
  sourceEvent?: string;     // How this card was created
}

/**
 * Enhanced card effects - covers all possible effects in the game
 */
export interface CardEffects {
  // Direct effects
  damage?: number;
  block?: number;
  heal?: number;
  draw?: number;
  energyGain?: number;

  // Status effects to apply to target
  vulnerable?: number;
  weak?: number;
  poison?: number;
  burn?: number;

  // Buffs to apply to self
  strength?: number;
  dexterity?: number;
  regen?: number;

  // Special effects
  customEffects?: CustomCardEffect[];

  // Conditional effects
  conditionalEffects?: ConditionalEffect[];

  // Multi-target effects
  multiTargetEffects?: MultiTargetEffect[];
}

/**
 * Custom card effect for complex behaviors
 */
export interface CustomCardEffect {
  type: string;
  value: any;
  target?: EffectTarget;
  conditions?: EffectCondition[];
  duration?: number;
}

/**
 * Conditional effect (e.g., "If enemy is vulnerable, deal +3 damage")
 */
export interface ConditionalEffect {
  condition: EffectCondition;
  effects: CardEffects;
}

/**
 * Multi-target effect (e.g., "Deal 5 damage to all enemies")
 */
export interface MultiTargetEffect {
  target: 'all_enemies' | 'all_allies' | 'random_enemy' | 'random_ally';
  count?: number;           // For "random" targets
  effects: CardEffects;
}

/**
 * Effect target specification
 */
export type EffectTarget =
  | 'self'
  | 'target'
  | 'all_enemies'
  | 'all_allies'
  | 'random_enemy'
  | 'random_ally'
  | 'all';

/**
 * Effect condition for conditional effects
 */
export interface EffectCondition {
  type: 'entity_has_status' | 'entity_hp_below' | 'entity_hp_above' | 'cards_in_hand' | 'energy_available' | 'turn_number' | 'custom';
  target?: EffectTarget;
  statusId?: string;        // For entity_has_status
  value?: number;           // For numeric comparisons
  operator?: '<' | '>' | '=' | '<=' | '>=';
  customCheck?: string;     // For custom conditions
}

/**
 * Universal card piles - used by all entities
 */
export interface UniversalPiles {
  draw: UniversalCard[];
  hand: UniversalCard[];
  discard: UniversalCard[];
  exhaust: UniversalCard[];
  void?: UniversalCard[];   // For permanently removed cards
}

/**
 * Enhanced energy system with modifiers
 */
export interface EnergySystem {
  current: number;
  maximum: number;
  baseMaximum: number;
  regenPerTurn: number;

  // Energy modifiers
  modifiers: EnergyModifier[];

  // Energy history (for effects that care about energy spent)
  spentThisTurn: number;
  spentThisCombat: number;
  gainedThisTurn: number;
}

/**
 * Energy modifier (temporary or permanent)
 */
export interface EnergyModifier {
  type: 'add_max' | 'multiply_max' | 'add_regen' | 'multiply_regen' | 'add_current';
  value: number;
  source: string;
  duration?: number;        // -1 for permanent
  stacks?: number;
}

/**
 * Entity behavior configuration (for AI)
 */
export interface EntityBehavior {
  id: string;
  type: 'player' | 'deck_ai' | 'pattern_ai' | 'script_ai' | 'hybrid_ai';

  // Deck-based AI (like cards)
  deckAI?: {
    cardSelection: 'random' | 'optimal' | 'weighted' | 'scripted';
    energyUsage: 'all' | 'conservative' | 'burst' | 'adaptive';
    targetPriority: TargetPriority[];
    playPattern?: PlayPattern;
  };

  // Pattern-based AI (predictable)
  patternAI?: {
    patterns: BehaviorPattern[];
    currentIndex: number;
    randomize?: boolean;
    repeatCount?: number;
  };

  // Script-based AI (complex bosses)
  scriptAI?: {
    scriptId: string;
    phases?: ScriptPhase[];
    variables?: { [key: string]: any };
  };

  // Hybrid AI (combines multiple approaches)
  hybridAI?: {
    phases: AIPhase[];
    currentPhase: number;
    transitionConditions: PhaseTransition[];
  };
}

/**
 * Target priority for AI decision making
 */
export interface TargetPriority {
  condition: EffectCondition;
  target: EffectTarget;
  weight: number;
}

/**
 * Play pattern for AI
 */
export interface PlayPattern {
  cardTypes: ('attack' | 'skill' | 'power')[];
  maxCards: number;
  minCards: number;
  energyThreshold: number;
}

/**
 * Behavior pattern for pattern-based AI
 */
export interface BehaviorPattern {
  name: string;
  cards: string[];         // Card IDs to create and play
  intent?: Intent;         // Visual intent to show
  conditions?: EffectCondition[];
  weight: number;          // For weighted selection
}

/**
 * Script phase for complex AI
 */
export interface ScriptPhase {
  id: string;
  name: string;
  startCondition: EffectCondition;
  endCondition: EffectCondition;
  behavior: EntityBehavior;
  onEnter?: string;        // Script to run
  onExit?: string;         // Script to run
}

/**
 * AI phase for hybrid AI
 */
export interface AIPhase {
  id: string;
  behavior: EntityBehavior;
  priority: number;
}

/**
 * Phase transition condition
 */
export interface PhaseTransition {
  fromPhase: string;
  toPhase: string;
  condition: EffectCondition;
  priority: number;
}

/**
 * Intent display for monster actions
 */
export interface Intent {
  type: 'attack' | 'defend' | 'buff' | 'debuff' | 'unknown' | 'special';
  value?: number;
  description?: string;
  icon?: string;
  color?: string;
}

/**
 * Complete game state for unified system
 */
export interface UnifiedGameState {
  // Entity management
  entities: {
    [entityId: string]: GameEntity;
  };

  // Turn management
  turnOrder: string[];
  currentTurnIndex: number;
  turnNumber: number;
  roundNumber: number;

  // Global state
  phase: 'setup' | 'combat' | 'victory' | 'defeat' | 'event';
  combatId?: string;

  // Animation and UI
  animations: AnimationQueue;
  pendingEffects: PendingEffect[];

  // Rules and settings
  rules: GameRules;
}

/**
 * Game entity (player, monster, etc.)
 */
export interface GameEntity {
  id: string;
  type: 'player' | 'monster' | 'npc' | 'environment';
  name: string;

  // Core stats
  hp: number;
  maxHp: number;
  block: number;

  // Status effects
  statusEffects: StatusEffect[];

  // Card system
  piles: UniversalPiles;
  energy: EnergySystem;

  // Behavior (for AI)
  behavior?: EntityBehavior;

  // Entity-specific data
  data: any;

  // State
  isActive: boolean;
  isTargetable: boolean;
  isVisible: boolean;
}

/**
 * Pending effect for delayed execution
 */
export interface PendingEffect {
  id: string;
  effect: CardEffects;
  source: string;
  target: string;
  delay: number;
  conditions?: EffectCondition[];
}

/**
 * Game rules configuration
 */
export interface GameRules {
  maxHandSize: number;
  maxEnergyPerTurn: number;
  drawPerTurn: number;

  // Card play rules
  cardsPerTurn?: number;    // Limit cards per turn (null = unlimited)
  energyCarryOver: boolean; // Can energy carry over between turns?

  // Combat rules
  blockDecaysPerTurn: boolean;
  statusEffectDecay: 'start_of_turn' | 'end_of_turn' | 'never';

  // Special rules
  customRules: { [key: string]: any };
}

/**
 * Animation queue for managing sequential animations
 */
export class AnimationQueue {
  private queue: AnimationEvent[] = [];
  private isPlaying = false;

  add(event: AnimationEvent): void {
    this.queue.push(event);
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  async playAll(handler: (event: AnimationEvent) => Promise<void>): Promise<void> {
    if (this.isPlaying) return;

    this.isPlaying = true;
    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      await handler(event);
      await this.delay(event.duration || 100);
    }
    this.isPlaying = false;
  }

  clear(): void {
    this.queue = [];
  }

  get pending(): number {
    return this.queue.length;
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Animation event
 */
export interface AnimationEvent {
  id: string;
  type: 'card_play' | 'card_draw' | 'damage' | 'heal' | 'status' | 'death' | 'turn_start' | 'turn_end';
  source: string;
  target?: string;
  data: any;
  duration?: number;
  priority?: number;
}

/**
 * Card play result with comprehensive information
 */
export interface CardPlayResult {
  success: boolean;
  card: UniversalCard;
  source: string;
  target?: string;

  // Costs and resources
  energySpent: number;
  cardsDrawn: number;

  // Effects applied
  effectsApplied: AppliedEffect[];

  // State changes
  stateChanges: StateChange[];

  // Animations triggered
  animations: AnimationEvent[];

  // Errors or warnings
  issues: string[];
}

/**
 * Applied effect information
 */
export interface AppliedEffect {
  type: string;
  value: number | any;
  source: string;
  target: string;
  success: boolean;
  actualValue?: number;     // After resistances, etc.
}

/**
 * State change information
 */
export interface StateChange {
  entityId: string;
  property: string;
  oldValue: any;
  newValue: any;
  source: string;
}