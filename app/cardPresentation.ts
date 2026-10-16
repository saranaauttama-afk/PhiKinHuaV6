import type { CardData } from '../src/core/types';
import { describeCard } from '../src/core/cards/describe';

export type CardGlyph = 'clap' | 'sword' | 'stance' | 'parry' | 'breath' | 'trap' | 'equipment' | 'curse';
/** A symbol for every card, from its type and main effect. */
export function cardGlyph(card: CardData): CardGlyph {
  const explicit: Record<string, CardGlyph> = { muay_stance: 'stance' };
  if (explicit[card.id]) return explicit[card.id];
  if (card.type === 'counter') return 'trap';
  if (card.type === 'equipment' || card.type === 'curse') return card.type;
  if (card.type === 'attack') return 'sword';
  if (card.fx?.block) return 'stance';
  return 'breath';
}
export const cardSummary = (card: CardData): string => describeCard(card);
/** Short keyword text for card faces (hand, deck grid, shops); detail panels keep cardSummary. */
export const cardFace = (card: CardData): string => require('../src/core/cards/describe').cardFaceText(card);
