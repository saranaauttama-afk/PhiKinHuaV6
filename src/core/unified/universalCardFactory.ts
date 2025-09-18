/**
 * Universal Card Factory
 * Creates and manages cards for all entities in the game
 */

import {
  UniversalCard,
  CardEffects,
  CustomCardEffect,
  ConditionalEffect,
  MultiTargetEffect
} from './completeTypes';
import { CardData, EnemyCard, Rarity } from '../types';
// Avoid import cycles - use dynamic imports
// import { cardById } from '../pack';
// import { enemyCardById } from '../pack_enemy_cards';

let cardInstanceCounter = 0;
let lastTimestamp = 0;

/**
 * Generate a unique instance ID for any card
 */
function generateInstanceId(owner: string, cardId: string): string {
  const timestamp = Date.now();

  // Ensure unique timestamp even for rapid creation
  if (timestamp <= lastTimestamp) {
    lastTimestamp += 1;
  } else {
    lastTimestamp = timestamp;
  }

  const counter = ++cardInstanceCounter;
  return `${owner}_${cardId}_${lastTimestamp}_${String(counter).padStart(3, '0')}`;
}

/**
 * Universal card creation configuration
 */
export interface UniversalCardConfig {
  cardId: string;
  owner: string;
  upgraded?: boolean;
  modifiers?: CardModifier[];
  sourceEvent?: string;
}

/**
 * Card modifier for temporary or permanent changes
 */
export interface CardModifier {
  type: 'cost' | 'damage' | 'block' | 'effect' | 'property';
  property?: string;
  operation: 'add' | 'multiply' | 'set' | 'append';
  value: any;
  source: string;
  permanent?: boolean;
}

/**
 * Create a universal card instance
 */
export function createUniversalCard(config: UniversalCardConfig): UniversalCard {
  const { cardId, owner, upgraded = false, modifiers = [], sourceEvent } = config;

  let baseCard: Omit<UniversalCard, 'instanceId' | 'owner' | 'createdAt' | 'sourceEvent'>;

  if (owner === 'player') {
    baseCard = createPlayerCardBase(cardId, upgraded);
  } else {
    baseCard = createMonsterCardBase(cardId, owner);
  }

  // Apply modifiers
  const modifiedCard = applyModifiers(baseCard, modifiers);

  return {
    ...modifiedCard,
    instanceId: generateInstanceId(owner, cardId),
    owner,
    createdAt: Date.now(),
    sourceEvent
  };
}

/**
 * Create base player card
 */
function createPlayerCardBase(cardId: string, upgraded: boolean): Omit<UniversalCard, 'instanceId' | 'owner' | 'createdAt' | 'sourceEvent'> {
  const { cardById } = require('../pack');
  const playerCard = cardById(cardId);
  if (!playerCard) {
    throw new Error(`Player card not found: ${cardId}`);
  }

  // Convert player card effects
  const effects: CardEffects = {
    damage: playerCard.dmg,
    block: playerCard.block,
    draw: playerCard.draw,
    energyGain: playerCard.energyGain
  };

  // Add status effects
  if (playerCard.vulnerable) effects.vulnerable = playerCard.vulnerable;
  if (playerCard.weak) effects.weak = playerCard.weak;
  if (playerCard.poison) effects.poison = playerCard.poison;
  if (playerCard.strength) effects.strength = playerCard.strength;
  if (playerCard.dexterity) effects.dexterity = playerCard.dexterity;
  if (playerCard.heal) effects.heal = playerCard.heal;

  // Handle card-specific effects
  const customEffects: CustomCardEffect[] = [];

  // Parse tags for special effects
  if (playerCard.tags) {
    for (const tag of playerCard.tags) {
      switch (tag) {
        case 'retain':
          customEffects.push({ type: 'retain', value: true });
          break;
        case 'innate':
          customEffects.push({ type: 'innate', value: true });
          break;
        case 'ethereal':
          customEffects.push({ type: 'ethereal', value: true });
          break;
        case 'exhaust':
          customEffects.push({ type: 'exhaust', value: true });
          break;
      }
    }
  }

  // Add exhaust flag directly from card data
  if (playerCard.exhaust) {
    customEffects.push({ type: 'exhaust', value: true });
  }

  if (customEffects.length > 0) {
    effects.customEffects = customEffects;
  }

  return {
    cardId: playerCard.id,
    name: playerCard.name,
    cost: playerCard.cost,
    type: mapPlayerCardType(playerCard.type as string),
    effects,
    rarity: playerCard.rarity,
    tags: playerCard.tags ? [...playerCard.tags] : [],
    description: playerCard.desc,
    upgraded,
    exhausts: playerCard.exhaust,
    ethereal: playerCard.tags?.includes('ethereal'),
    innate: playerCard.tags?.includes('innate'),
    retain: playerCard.tags?.includes('retain'),
    equipmentId: playerCard.equipmentId,
    slotCost: playerCard.slotCost
  };
}

/**
 * Create base monster card
 */
function createMonsterCardBase(cardId: string, owner: string): Omit<UniversalCard, 'instanceId' | 'owner' | 'createdAt' | 'sourceEvent'> {
  const { enemyCardById } = require('../pack_enemy_cards');
  const enemyCard = enemyCardById(cardId);
  if (!enemyCard) {
    throw new Error(`Enemy card not found: ${cardId}`);
  }

  // Convert enemy card effects
  const effects: CardEffects = {
    damage: enemyCard.dmg,
    block: enemyCard.block
  };

  // Add energy cost from enemy card
  const cost = enemyCard.energyCost || 1;

  return {
    cardId: enemyCard.id,
    name: enemyCard.name || generateCardName(cardId),
    cost,
    type: mapEnemyCardType(enemyCard.type),
    effects,
    tags: enemyCard.tags ? [...enemyCard.tags] : [`enemy:${owner}`],
    description: generateEnemyCardDescription(enemyCard)
  };
}

/**
 * Map player card type to universal type
 */
function mapPlayerCardType(type: string): UniversalCard['type'] {
  switch (type) {
    case 'attack': return 'attack';
    case 'skill': return 'skill';
    case 'power': return 'power';
    case 'equipment': return 'equipment';
    case 'curse': return 'curse';
    case 'status': return 'status';
    default: return 'skill';
  }
}

/**
 * Map enemy card type to universal type
 */
function mapEnemyCardType(type: string): UniversalCard['type'] {
  switch (type) {
    case 'attack': return 'attack';
    case 'skill': return 'skill';
    default: return type === 'attack' ? 'attack' : 'skill';
  }
}

/**
 * Generate card name from ID
 */
function generateCardName(cardId: string): string {
  return cardId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

/**
 * Generate description for enemy cards
 */
function generateEnemyCardDescription(card: EnemyCard): string {
  const parts = [];

  if (card.dmg && card.dmg > 0) {
    parts.push(`Deal ${card.dmg} damage`);
  }

  if (card.block && card.block > 0) {
    parts.push(`Gain ${card.block} block`);
  }

  return parts.join('. ') || 'Special ability';
}

/**
 * Apply modifiers to a card
 */
function applyModifiers(
  card: Omit<UniversalCard, 'instanceId' | 'owner' | 'createdAt' | 'sourceEvent'>,
  modifiers: CardModifier[]
): Omit<UniversalCard, 'instanceId' | 'owner' | 'createdAt' | 'sourceEvent'> {
  let modifiedCard = { ...card, effects: { ...card.effects } };

  for (const modifier of modifiers) {
    switch (modifier.type) {
      case 'cost':
        modifiedCard.cost = applyModifierOperation(
          modifiedCard.cost,
          modifier.operation,
          modifier.value
        );
        break;

      case 'damage':
        if (modifiedCard.effects.damage !== undefined) {
          modifiedCard.effects.damage = applyModifierOperation(
            modifiedCard.effects.damage,
            modifier.operation,
            modifier.value
          );
        }
        break;

      case 'block':
        if (modifiedCard.effects.block !== undefined) {
          modifiedCard.effects.block = applyModifierOperation(
            modifiedCard.effects.block,
            modifier.operation,
            modifier.value
          );
        }
        break;

      case 'effect':
        if (!modifiedCard.effects.customEffects) {
          modifiedCard.effects.customEffects = [];
        }
        modifiedCard.effects.customEffects.push(modifier.value);
        break;

      case 'property':
        if (modifier.property && modifier.property in modifiedCard) {
          const currentValue = (modifiedCard as any)[modifier.property];
          (modifiedCard as any)[modifier.property] = applyModifierOperation(
            currentValue,
            modifier.operation,
            modifier.value
          );
        }
        break;
    }
  }

  return modifiedCard;
}

/**
 * Apply a modifier operation to a numeric value
 */
function applyModifierOperation(
  current: number,
  operation: CardModifier['operation'],
  value: number
): number {
  switch (operation) {
    case 'add':
      return current + value;
    case 'multiply':
      return Math.floor(current * value);
    case 'set':
      return value;
    default:
      return current;
  }
}

/**
 * Convert existing player cards to universal cards
 */
export function convertPlayerCardsToUniversal(cards: CardData[]): UniversalCard[] {
  return cards.map(card => createUniversalCard({
    cardId: card.id,
    owner: 'player',
    upgraded: (card as any).upgraded || false,
    sourceEvent: 'conversion'
  }));
}

/**
 * Convert enemy card IDs to universal cards
 */
export function convertEnemyCardsToUniversal(cardIds: string[], owner: string): UniversalCard[] {
  return cardIds.map(cardId => createUniversalCard({
    cardId,
    owner,
    sourceEvent: 'enemy_deck_generation'
  }));
}

/**
 * Create a deck of universal cards
 */
export function createUniversalDeck(cardPool: string[], owner: string, count?: number): UniversalCard[] {
  const deck: UniversalCard[] = [];
  const actualCount = count || cardPool.length;

  for (let i = 0; i < actualCount; i++) {
    const cardId = cardPool[i % cardPool.length];
    deck.push(createUniversalCard({
      cardId,
      owner,
      sourceEvent: 'deck_creation'
    }));
  }

  return deck;
}

/**
 * Clone a universal card with a new instance ID
 */
export function cloneUniversalCard(card: UniversalCard, newOwner?: string): UniversalCard {
  return {
    ...card,
    instanceId: generateInstanceId(newOwner || card.owner, card.cardId),
    owner: newOwner || card.owner,
    createdAt: Date.now(),
    sourceEvent: 'cloned',
    effects: { ...card.effects },
    tags: card.tags ? [...card.tags] : []
  };
}

/**
 * Check if two cards have the same base ID
 */
export function haveSameCardId(card1: UniversalCard, card2: UniversalCard): boolean {
  return card1.cardId === card2.cardId;
}

/**
 * Check if a card matches certain criteria
 */
export function cardMatches(card: UniversalCard, criteria: Partial<UniversalCard>): boolean {
  for (const [key, value] of Object.entries(criteria)) {
    if (key === 'effects') {
      const effects = value as CardEffects;
      for (const [effectKey, effectValue] of Object.entries(effects)) {
        if (card.effects[effectKey as keyof CardEffects] !== effectValue) {
          return false;
        }
      }
    } else if (key === 'tags') {
      const tags = value as string[];
      if (!card.tags || !tags.every(tag => card.tags!.includes(tag))) {
        return false;
      }
    } else {
      if ((card as any)[key] !== value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Find cards matching criteria
 */
export function findCards(cards: UniversalCard[], criteria: Partial<UniversalCard>): UniversalCard[] {
  return cards.filter(card => cardMatches(card, criteria));
}

/**
 * Calculate total cost of cards
 */
export function calculateTotalCost(cards: UniversalCard[]): number {
  return cards.reduce((total, card) => total + card.cost, 0);
}

/**
 * Check if a card can be played with available energy
 */
export function canPlayCard(card: UniversalCard, availableEnergy: number): boolean {
  return card.cost <= availableEnergy;
}

/**
 * Get playable cards from a list
 */
export function getPlayableCards(cards: UniversalCard[], availableEnergy: number): UniversalCard[] {
  return cards.filter(card => canPlayCard(card, availableEnergy));
}

/**
 * Sort cards by various criteria
 */
export function sortCards(
  cards: UniversalCard[],
  criteria: 'cost' | 'name' | 'type' | 'damage' | 'block' | 'creation_time'
): UniversalCard[] {
  const sorted = [...cards];

  switch (criteria) {
    case 'cost':
      return sorted.sort((a, b) => a.cost - b.cost);

    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'type':
      return sorted.sort((a, b) => a.type.localeCompare(b.type));

    case 'damage':
      return sorted.sort((a, b) => (b.effects.damage || 0) - (a.effects.damage || 0));

    case 'block':
      return sorted.sort((a, b) => (b.effects.block || 0) - (a.effects.block || 0));

    case 'creation_time':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);

    default:
      return sorted;
  }
}

/**
 * Upgrade a card (create upgraded version)
 */
export function upgradeCard(card: UniversalCard): UniversalCard {
  if (card.upgraded) {
    return card; // Already upgraded
  }

  // Create upgraded version based on original card data
  const upgradedCard = cloneUniversalCard(card);
  upgradedCard.upgraded = true;
  upgradedCard.name += '+';

  // Apply upgrade effects (basic implementation)
  if (upgradedCard.effects.damage) {
    upgradedCard.effects.damage += Math.ceil(upgradedCard.effects.damage * 0.3);
  }

  if (upgradedCard.effects.block) {
    upgradedCard.effects.block += Math.ceil(upgradedCard.effects.block * 0.3);
  }

  if (upgradedCard.cost > 0) {
    upgradedCard.cost = Math.max(0, upgradedCard.cost - 1);
  }

  return upgradedCard;
}

/**
 * Get card display information for UI
 */
export function getCardDisplayInfo(card: UniversalCard): {
  name: string;
  cost: number;
  type: string;
  description: string;
  effects: string[];
  tags: string[];
  rarity?: string;
} {
  const effects = [];

  if (card.effects.damage) effects.push(`⚔ ${card.effects.damage}`);
  if (card.effects.block) effects.push(`🛡 ${card.effects.block}`);
  if (card.effects.heal) effects.push(`❤ ${card.effects.heal}`);
  if (card.effects.draw) effects.push(`📄 ${card.effects.draw}`);
  if (card.effects.energyGain) effects.push(`⚡ ${card.effects.energyGain}`);

  return {
    name: card.name,
    cost: card.cost,
    type: card.type,
    description: card.description || 'No description',
    effects,
    tags: card.tags || [],
    rarity: card.rarity
  };
}