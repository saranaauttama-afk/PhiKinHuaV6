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
/**
 * Whether the class has any way to spend mana: it starts with mana or owns mana-cost cards.
 * Why: shared mana cards (เสียงระฆัง, ดูดวิญญาณ, จุดเทียนบูชา) were offered to classes that
 * start at 0 mana and have no use for it, so the shop sold cards that could never be played.
 */
export function classUsesMana(classId?: ClassId): boolean {
  if (!classId) return true;
  const { CLASS_RESOURCES } = require('./balance/notfm');
  return (CLASS_RESOURCES[classId]?.startMana ?? 0) > 0 || ALL_CARDS.some(c => c.class === classId && (c.mana ?? 0) > 0);
}
/** Shared cards that only make sense with mana: cost mana, or give mana and nothing else. */
export function needsMana(c: CardData): boolean {
  if ((c.mana ?? 0) > 0) return true;
  const keys = Object.keys(c.fx ?? {}).filter(k => (c.fx as any)[k] != null);
  return keys.length > 0 && keys.every(k => k === 'mana');
}
/** Card fits the class: own or shared, and not a mana card for a class without mana. */
export function fitsClass(c: CardData, classId?: ClassId): boolean {
  if (c.class && c.class !== classId) return false;
  return !!c.class || !needsMana(c) || classUsesMana(classId);
}
/**
 * Whether a blessing can do anything for the class. A class without mana gets no blessing that only
 * gives mana (พลังวิญญาณ, พลังหายนะ) or only fires on card types it never owns (โล่พิธีกรรม: spells).
 * Why (14 Oct 2026 playtest): นักมวย was offered mana blessings and a mana level-up it could never use.
 */
export function blessingFitsClass(b: BlessingDef, classId?: ClassId): boolean {
  if (!classId || classUsesMana(classId)) return true;
  const ownTypes = new Set(poolFor(classId).map(c => c.type));
  const useful = (b.triggers ?? []).some(t => {
    if (t.type && !ownTypes.has(t.type)) return false;
    return Object.keys(t.fx ?? {}).some(k => k !== 'mana' && (t.fx as any)[k] != null);
  });
  const gain = Object.keys(b.onGain ?? {}).some(k => k !== 'startMana' && k !== 'maxHp' && k !== 'hp');
  const passive = !!((b as any).armor || (b as any).attackBonus || b.rules);
  const hasAny = (b.triggers?.length ?? 0) > 0 || !!b.onGain || passive;
  return !hasAny || useful || gain || passive || !!(b.onGain?.maxHp && b.onGain.maxHp > 0);
}
export function poolFor(classId?: ClassId,milestoneLevel=0): CardData[] {
  return ALL_CARDS.filter(c => !c.locked && (c.unlockAt??0)<=milestoneLevel && fitsClass(c, classId));
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
