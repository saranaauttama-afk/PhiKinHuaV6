// src/core/pack.ts — card and blessing data from the base pack.
import type { CardData, Rarity, BlessingDef } from './types';
import type { ClassId } from './classes';

import cardsJson from '../data/packs/base/cards.json';
import classCardsJson from '../data/packs/base/class_cards.json';
import curseCardsJson from '../data/packs/base/curse_cards.json';
import blessingsJson from '../data/packs/base/blessings.json';
import classBlessingsJson from '../data/packs/base/class_blessings.json';
import pandoraBlessingsJson from '../data/packs/base/pandora_blessings.json';

type CardJson = CardData & { starter?: number };

/** Neutral pool + class pools, with starter counts (only class starters build decks). */
export const CARD_LIST_WITH_STARTERS: CardJson[] = [...(cardsJson as any), ...(classCardsJson as any)];

/** การ์ดคำสาป: เข้าสำรับได้ทางเดียวคือถูกยัดเข้ามา ไม่อยู่ในร้านหรือรางวัล */
export const CURSE_CARDS: CardData[] = curseCardsJson as any;
export function curseById(id: string): CardData | undefined {
  return CURSE_CARDS.find(c => c.id === id);
}

export const ALL_CARDS: CardData[] = CARD_LIST_WITH_STARTERS.map(({ starter, ...c }) => c);

export function cardById(id: string): CardData | undefined {
  return ALL_CARDS.find(card => card.id === id);
}

/** Cards a class can find in rewards and shops: the neutral pool plus its own pool. */
export function poolFor(classId?: ClassId): CardData[] {
  return ALL_CARDS.filter(c => !c.locked && (!c.class || c.class === classId));
}

const OFFERED = ALL_CARDS.filter(c => !c.locked);
export const BY_RARITY: Record<Rarity, CardData[]> = {
  Common: OFFERED.filter(c => c.rarity === 'Common'),
  Uncommon: OFFERED.filter(c => c.rarity === 'Uncommon'),
  Rare: OFFERED.filter(c => c.rarity === 'Rare'),
  Legendary: OFFERED.filter(c => c.rarity === 'Legendary'),
};

/** Fallback deck when a class has no starter cards (should never happen). */
export const START_DECK: CardData[] = [];

export const BLESSING_POOL: BlessingDef[] = blessingsJson as any;
export const CLASS_BLESSINGS: BlessingDef[] = classBlessingsJson as any;
/** แพนโดรา blessings: gain with a cost, unlocked by nights cleared across runs. */
export const PANDORA_BLESSINGS: BlessingDef[] = pandoraBlessingsJson as any;
export function classBlessing(id: ClassId): BlessingDef {
  return JSON.parse(JSON.stringify(CLASS_BLESSINGS.find(b => b.class === id)!));
}
export function blessingById(id: string): BlessingDef | undefined {
  return [...BLESSING_POOL, ...CLASS_BLESSINGS, ...PANDORA_BLESSINGS].find(b => b.id === id);
}

export const BLESSINGS_BY_RARITY: Record<Rarity, BlessingDef[]> = {
  Common: BLESSING_POOL.filter(b => b.rarity === 'Common'),
  Uncommon: BLESSING_POOL.filter(b => b.rarity === 'Uncommon'),
  Rare: BLESSING_POOL.filter(b => b.rarity === 'Rare'),
  Legendary: BLESSING_POOL.filter(b => b.rarity === 'Legendary'),
};
