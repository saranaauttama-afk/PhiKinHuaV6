// src/core/cards/model.ts — what a card costs and does right now.
// Engine, pilot and UI all read cards through these functions so the numbers agree.
import type { CardData, CardType, Fx, GameState } from '../types';
import { STAR_RULES } from '../balance/notfm';
import { addFx, conditionMet } from './mechanics';

/** Card types that cost nothing to play. */
export const FREE_TYPES: readonly CardType[] = ['attack', 'equipment', 'mana', 'counter'];

export function starOf(card: Pick<CardData, 'star'>): number {
  return Math.max(1, Math.min(STAR_RULES.maxStar, Math.floor(card.star ?? 1)));
}

/** Numbers scale with stars unless the card spells out its own star values. */
export function starFx(card: CardData): Fx {
  const star = starOf(card);
  const base = card.fx ?? {};
  const override = star > 1 ? card.stars?.[star - 2] : undefined;
  if (override) return { ...base, ...override };
  if (star === 1) return base;
  const m = STAR_RULES.mult[star - 1], bonus = STAR_RULES.statusBonus[star - 1];
  const scale = (n?: number) => (n == null ? n : Math.round(n * m));
  return {
    ...base,
    dmg: scale(base.dmg), block: scale(base.block), heal: scale(base.heal),
    status: base.status?.map(e => ({ ...e, stacks: e.stacks + bonus })),
  };
}

/** Star-scaled effect plus any conditional bonus that currently applies. */
export function cardFx(s: GameState, card: CardData): Fx {
  const fx = starFx(card);
  const c = card.conditional;
  if (!c || !conditionMet(s, c.when, card)) return fx;
  return addFx(fx, c.bonus);
}

/** Corruption raises the price of cards that cost something. */
export function cardCost(s: GameState, card: CardData): { ap: number; mana: number } {
  const effect = s.player?.statusEffects?.find(e => e.id === 'corruption');
  const corruption = effect ? (effect.stacks ?? 1) : 0;
  const ap = card.ap ? card.ap + corruption : 0;
  const mana = card.mana ? card.mana + corruption : 0;
  return { ap, mana };
}

/** Why a card cannot be played now, or null when it can. */
export function playBlock(s: GameState, card: CardData): string | null {
  if (card.type === 'curse') return 'เล่นไม่ได้';
  if (card.limit === 'turn' && s.turnFlags?.limited?.includes(card.id)) return 'ใช้แล้วเทิร์นนี้';
  if (card.type === 'attack' && s.player.statusEffects?.some(e => e.id === 'entangle')) return 'ถูกพันธนาการ';
  const cost = cardCost(s, card);
  if (cost.ap > s.player.ap) return 'แต้มไม่พอ';
  if (cost.mana > s.player.mana) return 'มานาไม่พอ';
  if (starFx(card).borrow && !lastEnemyCards(s, 1).length) return 'ผียังไม่ได้เล่นการ์ด';
  return null;
}

/** Most recent enemy card ids this fight, newest first. */
export function lastEnemyCards(s: GameState, n: number): string[] {
  const ids = (s.cardHistory ?? []).filter(e => e.side === 'enemy').map(e => e.card.id).reverse();
  const fallback = [...(s.enemyLastPlayed ?? [])].reverse();
  return (ids.length ? ids : fallback).slice(0, n);
}
