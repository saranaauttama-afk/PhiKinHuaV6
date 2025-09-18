/**
 * Unified Card System Types
 * A single, consistent card system for both players and monsters
 */

import { Rarity } from '../types';

/**
 * Unified card structure used by both players and monsters
 */
export interface UnifiedCard {
  // Core identity
  instanceId: string;        // Unique ID for this card instance (for animations/tracking)
  cardId: string;           // Base card type ID (e.g., 'strike', 'krasue_claw')
  owner: 'player' | string; // Owner of the card ('player' or monster type like 'phi-krasue')

  // Card properties
  name: string;
  cost: number;
  type: 'attack' | 'skill' | 'power' | 'curse' | 'status';

  // Effects
  effects: CardEffects;

  // Metadata
  rarity?: Rarity;
  tags?: string[];
  description?: string;
  upgraded?: boolean;
  exhausts?: boolean;
  ethereal?: boolean;
}

/**
 * Card effects structure
 */
export interface CardEffects {
  damage?: number;
  block?: number;
  draw?: number;
  energyGain?: number;
  heal?: number;
  vulnerable?: number;
  weak?: number;
  poison?: number;
  strength?: number;
  dexterity?: number;
  custom?: CustomEffect[];
}

/**
 * Custom effects for complex card behaviors
 */
export interface CustomEffect {
  type: string;
  value: any;
  target?: 'self' | 'enemy' | 'all_enemies' | 'random_enemy';
  condition?: string;
}

/**
 * Card piles structure
 */
export interface CardPiles<T = UnifiedCard> {
  draw: T[];
  hand: T[];
  discard: T[];
  exhaust: T[];
}

/**
 * Energy system structure
 */
export interface EnergyState {
  current: number;
  maximum: number;
  baseMaximum: number;
  regenPerTurn: number;
  modifiers: EnergyModifier[];
}

/**
 * Energy modifiers
 */
export interface EnergyModifier {
  type: 'add' | 'multiply' | 'set';
  value: number;
  source: string;
  duration?: number; // turns, -1 for permanent
}

/**
 * Monster behavior configuration
 */
export interface MonsterBehavior {
  id: string;
  type: 'deck' | 'pattern' | 'hybrid' | 'scripted';

  // Deck-based behavior (like Night of the Full Moon)
  deck?: {
    cards: string[];          // Card pool
    handSize: number;         // Cards to draw per turn
    energyPerTurn: number;    // Energy available per turn
    drawPerTurn: number;      // Cards to draw at turn start
    shuffleOnEmpty?: boolean; // Shuffle discard into draw when empty
  };

  // Pattern-based behavior (for predictable enemies)
  pattern?: {
    cycle: BehaviorPattern[];
    currentIndex: number;
    randomize?: boolean;
  };

  // Hybrid behavior (combines deck and pattern)
  hybrid?: {
    phases: BehaviorPhase[];
    currentPhase: number;
  };

  // Scripted behavior (for complex bosses)
  script?: {
    onTurnStart?: string;   // Script ID
    onTurnEnd?: string;     // Script ID
    onDamaged?: string;     // Script ID
    onHealthThreshold?: {   // Script triggers at health thresholds
      [threshold: number]: string;
    };
  };
}

/**
 * Behavior pattern for pattern-based monsters
 */
export interface BehaviorPattern {
  cards: string[];      // Cards to play this turn
  intent?: Intent;      // Visual intent to show
  energy?: number;      // Override energy for this turn
}

/**
 * Behavior phase for hybrid monsters
 */
export interface BehaviorPhase {
  condition: PhaseCondition;
  behavior: 'deck' | 'pattern';
  config: any; // Deck or Pattern config
}

/**
 * Phase transition condition
 */
export interface PhaseCondition {
  type: 'health' | 'turn' | 'cards_played' | 'damage_taken';
  operator: '<' | '>' | '=' | '<=' | '>=';
  value: number;
}

/**
 * Monster intent display
 */
export interface Intent {
  type: 'attack' | 'defend' | 'buff' | 'debuff' | 'unknown';
  value?: number;
  description?: string;
}

/**
 * Animation event for the animation queue
 */
export interface AnimationEvent {
  id: string;
  type: 'card_play' | 'card_draw' | 'card_discard' | 'damage' | 'heal' | 'buff' | 'debuff';
  source: string;       // Who triggered this animation
  target?: string;      // Target of the animation
  data: any;           // Animation-specific data
  duration: number;    // Animation duration in ms
  priority?: number;   // Higher priority animations play first
}

/**
 * Animation queue for managing sequential animations
 */
export class AnimationQueue {
  private queue: AnimationEvent[] = [];
  private isPlaying = false;
  private onComplete?: () => void;

  /**
   * Add an animation event to the queue
   */
  add(event: AnimationEvent): void {
    this.queue.push(event);
    this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Play all animations in the queue sequentially
   */
  async playAll(onAnimationPlay: (event: AnimationEvent) => Promise<void>): Promise<void> {
    if (this.isPlaying) return;

    this.isPlaying = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift()!;
      await onAnimationPlay(event);
      await this.delay(event.duration);
    }

    this.isPlaying = false;
    this.onComplete?.();
  }

  /**
   * Clear all pending animations
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Check if animations are currently playing
   */
  get playing(): boolean {
    return this.isPlaying;
  }

  /**
   * Get the number of pending animations
   */
  get pending(): number {
    return this.queue.length;
  }

  /**
   * Set callback for when all animations complete
   */
  setOnComplete(callback: () => void): void {
    this.onComplete = callback;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Card instance factory configuration
 */
export interface CardFactoryConfig {
  cardId: string;
  owner: 'player' | string;
  upgraded?: boolean;
  modifiers?: CardModifier[];
}

/**
 * Card modifiers that can be applied to cards
 */
export interface CardModifier {
  type: 'cost' | 'damage' | 'block' | 'effect';
  operation: 'add' | 'multiply' | 'set';
  value: number | any;
  source: string;
}

/**
 * Unified game state extension
 */
export interface UnifiedGameState {
  // Card piles for all entities
  piles: {
    player: CardPiles<UnifiedCard>;
    [enemyId: string]: CardPiles<UnifiedCard>;
  };

  // Energy for all entities
  energy: {
    player: EnergyState;
    [enemyId: string]: EnergyState;
  };

  // Monster behaviors
  behaviors: {
    [enemyId: string]: MonsterBehavior;
  };

  // Animation queue
  animations: AnimationQueue;

  // Current turn owner
  currentTurn: 'player' | string;

  // Turn counter
  turnNumber: number;
}

/**
 * Card play result for handling card effects
 */
export interface CardPlayResult {
  success: boolean;
  card: UnifiedCard;
  energySpent: number;
  effectsApplied: string[];
  animations: AnimationEvent[];
  errors?: string[];
}

/**
 * Target specification for card effects
 */
export interface CardTarget {
  type: 'none' | 'enemy' | 'self' | 'all_enemies' | 'ally' | 'all_allies';
  id?: string; // Specific target ID if applicable
}