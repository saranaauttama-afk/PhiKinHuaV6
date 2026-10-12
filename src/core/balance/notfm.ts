// src/core/balance/notfm.ts — the numbers behind the Night-of-the-Full-Moon card rules.
// Every tuning value for cards, resources and classes lives here. Phase 2 starting points;
// change them here and re-run `npm run balance`.
import type { ClassId } from '../classes';

export const CARD_RULES = {
  /** Cards drawn when a fight starts. */
  openingDraw: 4,
  /** Cards drawn at the start of each later player turn. */
  drawPerTurn: 2,
  /** Draws stop while the hand holds this many cards. */
  handMax: 7,
  /** Action points restored each player turn. */
  apPerTurn: 2,
  /** Equipment cards that can be in play at once; a new one replaces the oldest. */
  equipmentSlots: 1,
} as const;

/** Star 1–3. Numbers scale by `mult`; status stacks gain `statusBonus`. Card data may override. */
export const STAR_RULES = {
  mult: [1, 1.5, 2],
  statusBonus: [0, 1, 2],
  maxStar: 3,
} as const;

/** A prayer waits 1–3 player turns, then resolves with its numbers multiplied. */
export const PRAYER_MULT = [1, 2, 3] as const;

/** Class starting resources (passives and skills are separate). */
export const CLASS_RESOURCES: Record<ClassId, { hp: number; startMana: number }> = {
  warrior: { hp: 60, startMana: 0 },
  shaman: { hp: 54, startMana: 3 },
  nun: { hp: 52, startMana: 0 },
  medium: { hp: 58, startMana: 4 },
};

/** Shop card prices by rarity (equipment cards included). */
export const CARD_PRICES = { Common: 30, Uncommon: 55, Rare: 90, Legendary: 140 } as const;
