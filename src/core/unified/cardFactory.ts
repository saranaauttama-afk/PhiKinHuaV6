/**
 * Card Factory and Conversion Utilities
 * Creates and manages unified card instances
 */

import {
  UnifiedCard,
  CardEffects,
  CardFactoryConfig,
  CardModifier
} from './types';
import { CardData, EnemyCard } from '../types';
import { cardById } from '../pack';
import { enemyCardById } from '../pack_enemy_cards';

let cardInstanceCounter = 0;

/**
 * Generate a unique instance ID for a card
 */
function generateInstanceId(cardId: string, owner: string): string {
  const timestamp = Date.now();
  const counter = ++cardInstanceCounter;
  return `${owner}_${cardId}_${timestamp}_${counter}`;
}

/**
 * Create a unified card instance
 */
export function createUnifiedCard(config: CardFactoryConfig): UnifiedCard {
  const { cardId, owner, upgraded = false, modifiers = [] } = config;

  // Get base card data based on owner type
  const baseCard = owner === 'player'
    ? getPlayerCardBase(cardId, upgraded)
    : getEnemyCardBase(cardId, owner);

  // Apply modifiers
  const modifiedCard = applyModifiers(baseCard, modifiers);

  return {
    ...modifiedCard,
    instanceId: generateInstanceId(cardId, owner),
    owner
  };
}

/**
 * Get base card data for player cards
 */
function getPlayerCardBase(cardId: string, upgraded: boolean): Omit<UnifiedCard, 'instanceId' | 'owner'> {
  const playerCard = cardById(cardId);
  if (!playerCard) {
    throw new Error(`Player card not found: ${cardId}`);
  }

  // Convert player card to unified format
  const effects: CardEffects = {
    damage: playerCard.dmg,
    block: playerCard.block,
    draw: playerCard.draw,
    energyGain: playerCard.energyGain,
    heal: playerCard.heal,
    vulnerable: playerCard.vulnerable,
    weak: playerCard.weak,
    poison: playerCard.poison,
    strength: playerCard.strength,
    dexterity: playerCard.dexterity
  };

  // Handle custom effects from tags
  const customEffects = [];
  if (playerCard.tags?.includes('retain')) {
    customEffects.push({ type: 'retain', value: true });
  }
  if (playerCard.tags?.includes('innate')) {
    customEffects.push({ type: 'innate', value: true });
  }
  if (playerCard.exhaust) {
    customEffects.push({ type: 'exhaust', value: true });
  }

  if (customEffects.length > 0) {
    effects.custom = customEffects;
  }

  return {
    cardId: playerCard.id,
    name: playerCard.name,
    cost: playerCard.cost,
    type: mapPlayerCardType(playerCard.type),
    effects,
    rarity: playerCard.rarity,
    tags: playerCard.tags,
    description: playerCard.desc,
    upgraded,
    exhausts: playerCard.exhaust,
    ethereal: playerCard.tags?.includes('ethereal')
  };
}

/**
 * Get base card data for enemy cards
 */
function getEnemyCardBase(cardId: string, enemyType: string): Omit<UnifiedCard, 'instanceId' | 'owner'> {
  const enemyCard = enemyCardById(cardId);
  if (!enemyCard) {
    throw new Error(`Enemy card not found: ${cardId}`);
  }

  // Convert enemy card to unified format
  const effects: CardEffects = {
    damage: enemyCard.dmg,
    block: enemyCard.block
  };

  // Parse additional effects from enemy card
  if (enemyCard.effect) {
    const customEffect = parseEnemyEffect(enemyCard.effect);
    if (customEffect) {
      effects.custom = [customEffect];
    }
  }

  return {
    cardId: enemyCard.id,
    name: enemyCard.name || cardId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    cost: enemyCard.energy || 0,
    type: determineEnemyCardType(enemyCard),
    effects,
    description: generateEnemyCardDescription(enemyCard),
    tags: generateEnemyCardTags(enemyCard, enemyType)
  };
}

/**
 * Map player card type to unified type
 */
function mapPlayerCardType(type: string): UnifiedCard['type'] {
  switch (type) {
    case 'attack': return 'attack';
    case 'skill': return 'skill';
    case 'power': return 'power';
    case 'curse': return 'curse';
    case 'status': return 'status';
    default: return 'skill';
  }
}

/**
 * Determine enemy card type based on effects
 */
function determineEnemyCardType(card: EnemyCard): UnifiedCard['type'] {
  if (card.dmg && card.dmg > 0) return 'attack';
  if (card.block && card.block > 0) return 'skill';
  return 'skill';
}

/**
 * Parse enemy card effect string into custom effect
 */
function parseEnemyEffect(effect: string): any {
  // Parse effects like "draw:2", "vulnerable:1", etc.
  const [type, value] = effect.split(':');
  if (type && value) {
    return {
      type,
      value: isNaN(Number(value)) ? value : Number(value)
    };
  }
  return null;
}

/**
 * Generate description for enemy cards
 */
function generateEnemyCardDescription(card: EnemyCard): string {
  const parts = [];

  if (card.dmg) {
    parts.push(`Deal ${card.dmg} damage`);
  }

  if (card.block) {
    parts.push(`Gain ${card.block} block`);
  }

  if (card.effect) {
    parts.push(card.effect);
  }

  return parts.join('. ') || 'No effect';
}

/**
 * Generate tags for enemy cards
 */
function generateEnemyCardTags(card: EnemyCard, enemyType: string): string[] {
  const tags = [];

  if (card.dmg && card.dmg > 0) {
    tags.push('damage');
  }

  if (card.block && card.block > 0) {
    tags.push('block');
  }

  tags.push(`enemy:${enemyType}`);

  return tags;
}

/**
 * Apply modifiers to a card
 */
function applyModifiers(
  card: Omit<UnifiedCard, 'instanceId' | 'owner'>,
  modifiers: CardModifier[]
): Omit<UnifiedCard, 'instanceId' | 'owner'> {
  let modifiedCard = { ...card };

  for (const modifier of modifiers) {
    switch (modifier.type) {
      case 'cost':
        modifiedCard.cost = applyModifierOperation(
          modifiedCard.cost,
          modifier.operation,
          modifier.value as number
        );
        break;

      case 'damage':
        if (modifiedCard.effects.damage) {
          modifiedCard.effects.damage = applyModifierOperation(
            modifiedCard.effects.damage,
            modifier.operation,
            modifier.value as number
          );
        }
        break;

      case 'block':
        if (modifiedCard.effects.block) {
          modifiedCard.effects.block = applyModifierOperation(
            modifiedCard.effects.block,
            modifier.operation,
            modifier.value as number
          );
        }
        break;

      case 'effect':
        // Add custom effect
        if (!modifiedCard.effects.custom) {
          modifiedCard.effects.custom = [];
        }
        modifiedCard.effects.custom.push(modifier.value);
        break;
    }
  }

  return modifiedCard;
}

/**
 * Apply a modifier operation to a value
 */
function applyModifierOperation(
  current: number,
  operation: 'add' | 'multiply' | 'set',
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
 * Convert existing player cards to unified cards
 */
export function convertPlayerCards(cards: CardData[]): UnifiedCard[] {
  return cards.map(card => createUnifiedCard({
    cardId: card.id,
    owner: 'player',
    upgraded: card.upgraded || false
  }));
}

/**
 * Convert enemy card IDs to unified cards
 */
export function convertEnemyCards(cardIds: string[], enemyType: string): UnifiedCard[] {
  return cardIds.map(cardId => createUnifiedCard({
    cardId,
    owner: enemyType
  }));
}

/**
 * Create a deck of unified cards for a monster
 */
export function createMonsterDeck(
  cardPool: string[],
  enemyType: string,
  count?: number
): UnifiedCard[] {
  const deck: UnifiedCard[] = [];
  const actualCount = count || cardPool.length;

  for (let i = 0; i < actualCount; i++) {
    const cardId = cardPool[i % cardPool.length];
    deck.push(createUnifiedCard({
      cardId,
      owner: enemyType
    }));
  }

  return deck;
}

/**
 * Clone a unified card with a new instance ID
 */
export function cloneCard(card: UnifiedCard): UnifiedCard {
  return {
    ...card,
    instanceId: generateInstanceId(card.cardId, card.owner),
    effects: { ...card.effects },
    tags: card.tags ? [...card.tags] : undefined
  };
}

/**
 * Check if a card matches certain criteria
 */
export function cardMatches(card: UnifiedCard, criteria: Partial<UnifiedCard>): boolean {
  for (const [key, value] of Object.entries(criteria)) {
    if (key === 'effects') {
      // Special handling for effects
      const effects = value as CardEffects;
      for (const [effectKey, effectValue] of Object.entries(effects)) {
        if (card.effects[effectKey as keyof CardEffects] !== effectValue) {
          return false;
        }
      }
    } else if (key === 'tags') {
      // Check if card has all specified tags
      const tags = value as string[];
      if (!card.tags || !tags.every(tag => card.tags!.includes(tag))) {
        return false;
      }
    } else {
      // Direct comparison for other fields
      if ((card as any)[key] !== value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Find cards in a pile that match criteria
 */
export function findCards(
  cards: UnifiedCard[],
  criteria: Partial<UnifiedCard>
): UnifiedCard[] {
  return cards.filter(card => cardMatches(card, criteria));
}

/**
 * Calculate the total cost of cards in hand
 */
export function calculateHandCost(hand: UnifiedCard[]): number {
  return hand.reduce((total, card) => total + card.cost, 0);
}

/**
 * Check if a card can be played with available energy
 */
export function canPlayCard(card: UnifiedCard, availableEnergy: number): boolean {
  return card.cost <= availableEnergy;
}

/**
 * Get playable cards from hand
 */
export function getPlayableCards(hand: UnifiedCard[], availableEnergy: number): UnifiedCard[] {
  return hand.filter(card => canPlayCard(card, availableEnergy));
}

/**
 * Sort cards by various criteria
 */
export function sortCards(
  cards: UnifiedCard[],
  criteria: 'cost' | 'name' | 'type' | 'damage' | 'block'
): UnifiedCard[] {
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

    default:
      return sorted;
  }
}