// src/core/shop.ts — shop stock from the class's card pool
import type { CardData, Rarity, ShopItem } from './types';
import type { ClassId } from './classes';
import type { RNG } from './rng';
import { int, shuffle } from './rng';
import { poolFor } from './pack';
import { CARD_PRICES } from './balance/notfm';

export function priceForCard(c: CardData, _act = 1): number {
  return CARD_PRICES[c.rarity ?? 'Common'];
}

/**
 * Stock without repeats, weighted by rarity. `only` narrows the pool (e.g. equipment shops).
 */
export function rollShopStock(
  rng: RNG, count = 6, act = 1, classId?: ClassId, only?: (c: CardData) => boolean,
): { rng: RNG; items: ShopItem[] } {
  let r = rng;
  const weights: Record<Rarity, number> = { Common: 55, Uncommon: 30, Rare: 13, Legendary: 2 };
  const total = weights.Common + weights.Uncommon + weights.Rare + weights.Legendary;
  const pool = poolFor(classId).filter(c => c.type !== 'curse' && (!only || only(c)));
  const taken = new Set<string>();
  const out: ShopItem[] = [];
  const pick = (rar: Rarity): CardData | undefined => {
    const list = pool.filter(c => (c.rarity ?? 'Common') === rar && !taken.has(c.id));
    if (!list.length) return undefined;
    const roll = int(r, 0, list.length - 1); r = roll.rng;
    return list[roll.value];
  };
  for (let i = 0; i < count; i++) {
    const roll = int(r, 1, total); r = roll.rng;
    let v = roll.value;
    const rar: Rarity = (v -= weights.Common) <= 0 ? 'Common' : (v -= weights.Uncommon) <= 0 ? 'Uncommon' : (v -= weights.Rare) <= 0 ? 'Rare' : 'Legendary';
    const card = pick(rar) ?? pick('Uncommon') ?? pick('Common') ?? pick('Rare') ?? pick('Legendary');
    if (!card) break;
    taken.add(card.id);
    out.push({ card: JSON.parse(JSON.stringify(card)), price: priceForCard(card, act) });
  }
  const sh = shuffle(r, out);
  return { rng: sh.rng, items: sh.array };
}
