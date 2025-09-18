/**
 * Unified Pile Management System
 * Manages card piles for all entities in the game
 */

import { UnifiedCard, CardPiles } from './types';
import { RNG, next } from '../rng';

/**
 * Shuffle an array of cards using RNG
 */
export function shuffleCards(cards: UnifiedCard[], rng: RNG): { cards: UnifiedCard[], rng: RNG } {
  const shuffled = [...cards];
  let currentRng = rng;
  for (let i = shuffled.length - 1; i > 0; i--) {
    const result = next(currentRng);
    currentRng = result.rng;
    const j = Math.floor(result.value * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { cards: shuffled, rng: currentRng };
}

/**
 * Initialize empty card piles
 */
export function createEmptyPiles(): CardPiles<UnifiedCard> {
  return {
    draw: [],
    hand: [],
    discard: [],
    exhaust: []
  };
}

/**
 * Move a card from one pile to another
 */
export function moveCard(
  piles: CardPiles<UnifiedCard>,
  card: UnifiedCard,
  from: keyof CardPiles,
  to: keyof CardPiles
): boolean {
  const fromPile = piles[from];
  const cardIndex = fromPile.findIndex(c => c.instanceId === card.instanceId);

  if (cardIndex === -1) {
    console.warn(`Card ${card.instanceId} not found in ${from} pile`);
    return false;
  }

  // Remove from source pile
  fromPile.splice(cardIndex, 1);

  // Add to destination pile
  piles[to].push(card);

  return true;
}

/**
 * Move a card by index from one pile to another
 */
export function moveCardByIndex(
  piles: CardPiles<UnifiedCard>,
  index: number,
  from: keyof CardPiles,
  to: keyof CardPiles
): UnifiedCard | null {
  const fromPile = piles[from];

  if (index < 0 || index >= fromPile.length) {
    console.warn(`Invalid index ${index} for ${from} pile`);
    return null;
  }

  // Remove from source pile
  const [card] = fromPile.splice(index, 1);

  // Add to destination pile
  piles[to].push(card);

  return card;
}

/**
 * Draw cards from draw pile to hand
 */
export function drawCards(
  piles: CardPiles<UnifiedCard>,
  count: number,
  rng?: RNG
): UnifiedCard[] {
  const drawn: UnifiedCard[] = [];

  for (let i = 0; i < count; i++) {
    // If draw pile is empty, shuffle discard into draw
    if (piles.draw.length === 0 && piles.discard.length > 0) {
      reshuffleDiscardIntoDraw(piles, rng);
    }

    // Draw a card if available
    if (piles.draw.length > 0) {
      const card = piles.draw.shift()!;
      piles.hand.push(card);
      drawn.push(card);
    }
  }

  return drawn;
}

/**
 * Draw cards up to hand size
 */
export function drawUpToHandSize(
  piles: CardPiles<UnifiedCard>,
  targetHandSize: number,
  rng?: RNG
): UnifiedCard[] {
  const cardsToDraw = Math.max(0, targetHandSize - piles.hand.length);
  return drawCards(piles, cardsToDraw, rng);
}

/**
 * Reshuffle discard pile into draw pile
 */
export function reshuffleDiscardIntoDraw(
  piles: CardPiles<UnifiedCard>,
  rng?: RNG
): void {
  if (piles.discard.length === 0) return;

  // Move all cards from discard to draw
  piles.draw.push(...piles.discard);
  piles.discard = [];

  // Shuffle if RNG provided
  if (rng) {
    const shuffled = shuffleCards(piles.draw, rng);
    piles.draw = shuffled.cards;
    // Note: RNG state is updated in the caller if needed
  }
}

/**
 * Discard a card from hand
 */
export function discardCard(
  piles: CardPiles<UnifiedCard>,
  card: UnifiedCard
): boolean {
  return moveCard(piles, card, 'hand', 'discard');
}

/**
 * Discard a card by index
 */
export function discardCardByIndex(
  piles: CardPiles<UnifiedCard>,
  index: number
): UnifiedCard | null {
  return moveCardByIndex(piles, index, 'hand', 'discard');
}

/**
 * Exhaust a card from hand
 */
export function exhaustCard(
  piles: CardPiles<UnifiedCard>,
  card: UnifiedCard
): boolean {
  return moveCard(piles, card, 'hand', 'exhaust');
}

/**
 * Exhaust a card by index
 */
export function exhaustCardByIndex(
  piles: CardPiles<UnifiedCard>,
  index: number
): UnifiedCard | null {
  return moveCardByIndex(piles, index, 'hand', 'exhaust');
}

/**
 * Discard entire hand
 */
export function discardHand(piles: CardPiles<UnifiedCard>): UnifiedCard[] {
  const discarded = [...piles.hand];
  piles.discard.push(...piles.hand);
  piles.hand = [];
  return discarded;
}

/**
 * Find a card in any pile
 */
export function findCardInPiles(
  piles: CardPiles<UnifiedCard>,
  instanceId: string
): { card: UnifiedCard; pile: keyof CardPiles } | null {
  for (const pileName of ['draw', 'hand', 'discard', 'exhaust'] as const) {
    const pile = piles[pileName];
    const card = pile.find(c => c.instanceId === instanceId);
    if (card) {
      return { card, pile: pileName };
    }
  }
  return null;
}

/**
 * Count total cards across all piles
 */
export function countTotalCards(piles: CardPiles<UnifiedCard>): number {
  return (
    piles.draw.length +
    piles.hand.length +
    piles.discard.length +
    piles.exhaust.length
  );
}

/**
 * Count cards in cycling piles (draw + hand + discard)
 */
export function countCyclingCards(piles: CardPiles<UnifiedCard>): number {
  return piles.draw.length + piles.hand.length + piles.discard.length;
}

/**
 * Get all cards from all piles
 */
export function getAllCards(piles: CardPiles<UnifiedCard>): UnifiedCard[] {
  return [
    ...piles.draw,
    ...piles.hand,
    ...piles.discard,
    ...piles.exhaust
  ];
}

/**
 * Get cards from cycling piles
 */
export function getCyclingCards(piles: CardPiles<UnifiedCard>): UnifiedCard[] {
  return [
    ...piles.draw,
    ...piles.hand,
    ...piles.discard
  ];
}

/**
 * Remove a specific card from piles
 */
export function removeCard(
  piles: CardPiles<UnifiedCard>,
  instanceId: string
): UnifiedCard | null {
  const location = findCardInPiles(piles, instanceId);
  if (!location) return null;

  const pile = piles[location.pile];
  const index = pile.findIndex(c => c.instanceId === instanceId);
  if (index !== -1) {
    const [removed] = pile.splice(index, 1);
    return removed;
  }

  return null;
}

/**
 * Add a card to a specific pile
 */
export function addCardToPile(
  piles: CardPiles<UnifiedCard>,
  card: UnifiedCard,
  pile: keyof CardPiles
): void {
  piles[pile].push(card);
}

/**
 * Clear all piles
 */
export function clearPiles(piles: CardPiles<UnifiedCard>): void {
  piles.draw = [];
  piles.hand = [];
  piles.discard = [];
  piles.exhaust = [];
}

/**
 * Setup initial deck for an entity
 */
export function setupDeck(
  piles: CardPiles<UnifiedCard>,
  deck: UnifiedCard[],
  rng?: RNG
): void {
  clearPiles(piles);
  if (rng) {
    const shuffled = shuffleCards(deck, rng);
    piles.draw = shuffled.cards;
  } else {
    piles.draw = [...deck];
  }
}

/**
 * Check if hand is full
 */
export function isHandFull(
  piles: CardPiles<UnifiedCard>,
  maxHandSize: number
): boolean {
  return piles.hand.length >= maxHandSize;
}

/**
 * Get a random card from hand
 */
export function getRandomCardFromHand(
  piles: CardPiles<UnifiedCard>,
  rng: RNG
): { card: UnifiedCard | null, rng: RNG } {
  if (piles.hand.length === 0) return { card: null, rng };
  const result = next(rng);
  const index = Math.floor(result.value * piles.hand.length);
  return { card: piles.hand[index], rng: result.rng };
}

/**
 * Filter cards in a pile by predicate
 */
export function filterPile(
  pile: UnifiedCard[],
  predicate: (card: UnifiedCard) => boolean
): UnifiedCard[] {
  return pile.filter(predicate);
}

/**
 * Apply ethereal effect (exhaust ethereal cards at end of turn)
 */
export function applyEthereal(piles: CardPiles<UnifiedCard>): UnifiedCard[] {
  const etherealCards = piles.hand.filter(card => card.ethereal);

  for (const card of etherealCards) {
    moveCard(piles, card, 'hand', 'exhaust');
  }

  return etherealCards;
}

/**
 * Apply retain effect (keep retained cards in hand)
 */
export function discardNonRetainedCards(piles: CardPiles<UnifiedCard>): UnifiedCard[] {
  const nonRetained = piles.hand.filter(card =>
    !card.tags?.includes('retain') &&
    !card.effects.custom?.some(e => e.type === 'retain')
  );

  for (const card of nonRetained) {
    moveCard(piles, card, 'hand', 'discard');
  }

  return nonRetained;
}

/**
 * Clone a pile structure
 */
export function clonePiles(piles: CardPiles<UnifiedCard>): CardPiles<UnifiedCard> {
  return {
    draw: [...piles.draw],
    hand: [...piles.hand],
    discard: [...piles.discard],
    exhaust: [...piles.exhaust]
  };
}

/**
 * Merge two pile structures
 */
export function mergePiles(
  target: CardPiles<UnifiedCard>,
  source: CardPiles<UnifiedCard>
): void {
  target.draw.push(...source.draw);
  target.hand.push(...source.hand);
  target.discard.push(...source.discard);
  target.exhaust.push(...source.exhaust);
}