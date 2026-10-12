// src/core/cards/mechanics.ts — card mechanics numbers alone cannot express:
// conditions that read the board, and effects while a card stays in hand.
import type { CardData, Fx, GameState } from '../types';
import type { StatusEffectType } from '../combat/status-effects/types';
import { hasStatusEffect } from '../combat/status-effects';

export type CardCondition =
  /** เลือดเราเหลือไม่ถึง value% */
  | { kind: 'player_hp_below'; value: number }
  /** เรามีเกราะอย่างน้อย value */
  | { kind: 'player_block_at_least'; value: number }
  /** ศัตรูติดสถานะนี้อยู่ */
  | { kind: 'enemy_has_status'; statusId: string }
  /** ไม่มีการ์ดอื่นเหลือในมือแล้ว */
  | { kind: 'hand_empty' }
  /** สำรับ (ทั้งกอง) เหลือไม่เกิน value ใบ */
  | { kind: 'deck_at_most'; value: number };

/** Added on top of the card's numbers while the condition holds. */
export type CardConditional = { when: CardCondition; bonus: Fx };

/** ผลท้ายเทิร์นถ้าการ์ดใบนี้ยังอยู่ในมือ */
export type HeldEffect = { block?: number; heal?: number };

export function conditionMet(s: GameState, cond: CardCondition, self?: CardData): boolean {
  switch (cond.kind) {
    case 'player_hp_below':
      return s.player.hp * 100 < s.player.maxHp * cond.value;
    case 'player_block_at_least':
      return (s.player.block ?? 0) >= cond.value;
    case 'enemy_has_status':
      return !!s.enemy && hasStatusEffect('enemy', s, cond.statusId as StatusEffectType);
    case 'hand_empty':
      return s.piles.hand.filter(c => c !== self).length === 0;
    case 'deck_at_most':
      return (s.masterDeck?.length ?? 0) <= cond.value;
  }
}

/** Sum two effect sets; statuses are appended. */
export function addFx(a: Fx, b: Fx): Fx {
  const out: Fx = { ...a };
  for (const k of ['dmg', 'hits', 'block', 'heal', 'draw', 'mana', 'ap', 'borrow'] as const) {
    if (b[k] != null) out[k] = (a[k] ?? 0) + b[k]!;
  }
  if (b.status?.length) out.status = [...(a.status ?? []), ...b.status];
  if (b.cleanse) out.cleanse = true;
  return out;
}

export function hitsOf(fx: Fx): number {
  const n = Math.floor(fx.hits ?? 1);
  return n > 1 ? n : 1;
}

/** เล่นการ์ดไปแล้วกี่ใบในเทิร์นนี้ */
export function cardsPlayedThisTurn(s: GameState): number {
  return s.turnFlags?.cardsPlayed ?? 0;
}

export function countCardPlayed(s: GameState, card?: CardData): void {
  s.turnFlags = s.turnFlags ?? ({ blessingOnce: {} } as GameState['turnFlags']);
  s.turnFlags.cardsPlayed = (s.turnFlags.cardsPlayed ?? 0) + 1;
  if (card?.limit === 'turn') s.turnFlags.limited = [...(s.turnFlags.limited ?? []), card.id];
}

/** ต้นเทิร์นผู้เล่น — เริ่มนับใหม่ */
export function resetCardsPlayed(s: GameState): void {
  s.turnFlags = s.turnFlags ?? ({ blessingOnce: {} } as GameState['turnFlags']);
  s.turnFlags.cardsPlayed = 0;
  s.turnFlags.limited = [];
  s.turnFlags.triggerOnce = [];
}

/** Held cards act before the enemy turn; two held copies act twice. */
export function applyHeldEffects(s: GameState): void {
  const { gainBlock, heal } = require('../combat/damage');
  for (const card of s.piles.hand) {
    const e = card.whileHeld;
    if (!e) continue;
    if (e.block) gainBlock(s, 'player', e.block);
    if (e.heal) heal(s, 'player', e.heal);
    s.log.push(`${card.name} ค้างอยู่ในมือ`);
  }
}

export function conditionText(c: CardCondition): string {
  switch (c.kind) {
    case 'player_hp_below': return `ถ้าเลือดเหลือไม่ถึง ${c.value}%`;
    case 'player_block_at_least': return `ถ้ามีเกราะตั้งแต่ ${c.value}`;
    case 'enemy_has_status': return `ถ้าผีติด${require('../combat/status-effects/registry').STATUS_EFFECTS_REGISTRY[c.statusId]?.name ?? c.statusId}`;
    case 'hand_empty': return 'ถ้าไม่มีการ์ดอื่นในมือ';
    case 'deck_at_most': return `ถ้าสำรับเหลือไม่เกิน ${c.value} ใบ`;
  }
}
