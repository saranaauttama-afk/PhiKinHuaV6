// src/core/shop.ts — shop stock from the class's card pool
import type { CardData, GameState, Rarity, ShopItem } from './types';
import type { ClassId } from './classes';
import type { RNG } from './rng';
import { int, shuffle } from './rng';
import { poolFor } from './pack';
import { CARD_PRICES } from './balance/notfm';
import { BUILD_CATALOG, REPLACEMENT_CARDS, focusesFor, PROGRESSION_PRICES, type BuildFocus } from './balance/deckProgression';

export function priceForCard(c: CardData, _act = 1, progression = false): number {
  return (progression ? PROGRESSION_PRICES : CARD_PRICES)[c.rarity ?? 'Common'];
}

/** Four complementary offers. The class catalog supplies roles, never bypasses unlocks. */
export function rollProgressionShop(s: GameState, rng: RNG, keepFocus?: BuildFocus, excluded: string[] = []):
  { rng: RNG; items: ShopItem[]; focus?: BuildFocus } {
  const focuses = focusesFor(s.classId);
  if (!focuses.length) {
    const old = rollShopStock(rng, 3, s.campaign?.night ?? 1, s.classId);
    return { ...old };
  }
  let r = rng;
  let focus = keepFocus;
  if (!focus) {
    const owned = new Set(s.masterDeck.filter(c => !c.progressionRole).map(c => c.id));
    const scores = focuses.map(f => ({ f, n: [...BUILD_CATALOG[f].engine, ...BUILD_CATALOG[f].payoff].filter(id => owned.has(id)).length }));
    const best = Math.max(...scores.map(x => x.n));
    const candidates = best ? scores.filter(x => x.n === best).map(x => x.f)
      : focuses.filter(f => !(s.shopFocusHistory ?? []).includes(f));
    const choices = candidates.length ? candidates : focuses;
    const rolled = int(r, 0, choices.length - 1); r = rolled.rng; focus = choices[rolled.value];
  }
  const catalog = BUILD_CATALOG[focus];
  const night = Math.max(1, Math.min(3, s.campaign?.night ?? 1));
  const pool = poolFor(s.classId, s.campaign?.milestoneLevel ?? 0)
    .filter(c => c.type !== 'curse' && !c.progressionRole && !c.borrowed);
  const picked = new Set(excluded);
  const items: ShopItem[] = [];
  const rarityOpen = (rar: Rarity, role: number) =>
    role < 3 ? (rar === 'Common' || rar === 'Uncommon')
      : night === 1 ? rar === 'Common' || rar === 'Uncommon'
      : night === 2 ? rar !== 'Legendary' : true;
  const select = (role: number, ids: readonly string[], preferCommon: boolean) => {
    const legal = (c: CardData) => !picked.has(c.id) && rarityOpen(c.rarity ?? 'Common', role) && (role !== 0 || c.type !== 'equipment');
    const ordered = [
      pool.filter(c => ids.includes(c.id) && legal(c) && (!preferCommon || c.rarity === 'Common')),
      pool.filter(c => ids.includes(c.id) && legal(c)),
      pool.filter(c => Object.values(BUILD_CATALOG).some(b =>
        (role === 1 ? b.engine : role === 2 ? b.payoff : b.support).includes(c.id)) && legal(c)),
      pool.filter(c => (REPLACEMENT_CARDS[s.classId!] ?? []).includes(c.id) && legal(c)),
      pool.filter(c => legal(c) && (role === 3 || c.type !== 'equipment')),
    ];
    const options = ordered.find(list => list.length) ?? [];
    if (!options.length) { s.log.push(`shop_pool_exhausted:${focus}:${role}`); return; }
    // The last slot opens Rare from night 2, with the other slots intentionally C/U only.
    const weights: Record<Rarity, number> = role === 3
      ? [{Common:65,Uncommon:35,Rare:0,Legendary:0}, {Common:35,Uncommon:45,Rare:20,Legendary:0}, {Common:25,Uncommon:45,Rare:25,Legendary:5}][night-1]
      : role === 2 ? {Common:night===1?60:35,Uncommon:night===1?40:65,Rare:0,Legendary:0}
      : {Common:80,Uncommon:20,Rare:0,Legendary:0};
    const rarities = [...new Set(options.map(c => c.rarity ?? 'Common'))] as Rarity[];
    const total = rarities.reduce((n,rar) => n + weights[rar], 0);
    const draw = int(r, 1, total); r = draw.rng;
    let remaining = draw.value, rarity = rarities[0];
    for (const rar of rarities) { remaining -= weights[rar]; if (remaining <= 0) { rarity = rar; break; } }
    const group = options.filter(c => (c.rarity ?? 'Common') === rarity);
    const roll = int(r, 0, group.length - 1); r = roll.rng;
    const card = group[roll.value]; picked.add(card.id);
    items.push({ card: JSON.parse(JSON.stringify(card)), price: priceForCard(card, night, true), role: (['replacement','engine','payoff','support'] as const)[role] });
  };
  select(1,catalog.engine,true);
  select(2,catalog.payoff,false);
  select(0,REPLACEMENT_CARDS[s.classId!] ?? [],false);
  select(3,catalog.support,false);
  return { rng:r, items:[items[2],items[0],items[1],items[3]].filter((item):item is ShopItem=>!!item), focus };
}

/**
 * Stock without repeats, weighted by rarity. `only` narrows the pool (e.g. equipment shops).
 */
export function rollShopStock(
  rng: RNG, count = 6, act = 1, classId?: ClassId, only?: (c: CardData) => boolean,milestoneLevel=0,
): { rng: RNG; items: ShopItem[] } {
  let r = rng;
  // Rarity opens up by night (ECONOMY.shopRarity): strong cards can't be bought on night 1.
  const byNight = require('./balance/notfm').ECONOMY.shopRarity;
  const weights: Record<Rarity, number> = byNight[Math.min(byNight.length, Math.max(1, act)) - 1];
  const total = weights.Common + weights.Uncommon + weights.Rare + weights.Legendary;
  const pool = poolFor(classId,milestoneLevel).filter(c => c.type !== 'curse' && (!only || only(c)));
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
    const allowed = (['Uncommon', 'Common', 'Rare', 'Legendary'] as Rarity[]).filter(x => weights[x] > 0);
    let card = pick(rar);
    for (const x of allowed) card = card ?? pick(x);
    if (!card) break;
    taken.add(card.id);
    out.push({ card: JSON.parse(JSON.stringify(card)), price: priceForCard(card, act) });
  }
  const sh = shuffle(r, out);
  return { rng: sh.rng, items: sh.array };
}
