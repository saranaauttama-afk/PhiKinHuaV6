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
  | { kind: 'deck_at_most'; value: number }
  /** นักมวย: จังหวะตั้งแต่ value */
  | { kind: 'rhythm_at_least'; value: number }
  /** นักมวย: จังหวะไม่เกิน value */
  | { kind: 'rhythm_at_most'; value: number }
  /** ศัตรูติดสถานะนี้อย่างน้อย value ชั้น (เช่น ช้ำ ≥ 3) */
  | { kind: 'enemy_status_at_least'; statusId: string; value: number }
  /** เทิร์นนี้ออกท่าต่างกันแล้วอย่างน้อย value ท่า */
  | { kind: 'moves_this_turn_at_least'; value: number }
  /** เทิร์นสุดท้ายของยก (ก่อนพักยก) */
  | { kind: 'round_last_turn' }
  /** เทิร์นนี้ออกท่านี้ไปแล้ว */
  | { kind: 'played_move'; move: import('../types').Move }
  /** อีกฝ่ายเลือดเหลือไม่ถึง value% (ผีปอบหิว: เราเลือดต่ำกว่าครึ่ง) */
  | { kind: 'foe_hp_below'; value: number }
  /** อีกฝ่ายมีเกราะอย่างน้อย value (นางตานีโอบรัด) */
  | { kind: 'foe_block_at_least'; value: number }
  /** ผี: เทิร์นที่แล้วเราทำให้มันเสียเลือด (ผีตายโหง แค้นฝังใจ) */
  | { kind: 'hurt_last_turn' }
  /** หมอผี: น้ำมนต์ในขันตั้งแต่ value (ตอนเล่น ก่อนจ่ายค่าการ์ด) */
  | { kind: 'water_at_least'; value: number }
  /** หมอผี: ผีถือการ์ดที่กำลังชาร์จอยู่ */
  | { kind: 'ghost_charging' }
  /** มีมินเนียนของเรายืนอยู่อย่างน้อย value ตัว */
  | { kind: 'minions_at_least'; value: number };

/** Added on top of the card's numbers while the condition holds. */
export type CardConditional = { when: CardCondition; bonus: Fx };

/** ผลท้ายเทิร์นถ้าการ์ดใบนี้ยังอยู่ในมือ */
export type HeldEffect = { block?: number; heal?: number };

/**
 * Conditions are written from the card owner's side. `side` is who owns the card:
 * for a ghost card, "player_*" reads the ghost and "enemy_has_status" reads the player.
 */
export function conditionMet(s: GameState, cond: CardCondition, self?: CardData, side: 'player' | 'enemy' = 'player'): boolean {
  const own = side === 'player' ? s.player : s.enemy;
  const other: 'player' | 'enemy' = side === 'player' ? 'enemy' : 'player';
  if (!own) return false;
  switch (cond.kind) {
    case 'player_hp_below':
      return own.hp * 100 < own.maxHp * cond.value;
    case 'player_block_at_least':
      return (own.block ?? 0) >= cond.value;
    case 'enemy_has_status':
      return (other === 'player' || !!s.enemy) && hasStatusEffect(other, s, cond.statusId as StatusEffectType);
    case 'hand_empty':
      return side === 'player' ? s.piles.hand.filter(c => c !== self).length === 0 : !s.enemyPiles?.hand.length;
    case 'deck_at_most':
      return side === 'player' && (s.masterDeck?.length ?? 0) <= cond.value;
    case 'rhythm_at_least':
      return side === 'player' && (s.fight?.rhythm ?? 0) >= cond.value;
    case 'rhythm_at_most':
      return side === 'player' && (s.fight?.rhythm ?? 0) <= cond.value;
    case 'enemy_status_at_least': {
      const t = side === 'player' ? s.enemy : s.player;
      return (t?.statusEffects?.find(e => e.id === cond.statusId)?.stacks ?? 0) >= cond.value;
    }
    case 'moves_this_turn_at_least':
      return side === 'player' && (s.turnFlags?.moves?.length ?? 0) >= cond.value;
    case 'round_last_turn':
      return require('./fighter').isRoundLastTurn(s);
    case 'played_move':
      return side === 'player' && !!s.turnFlags?.moves?.includes(cond.move);
    case 'foe_hp_below': {
      const foe = side === 'player' ? s.enemy : s.player;
      return !!foe && foe.hp * 100 < foe.maxHp * cond.value;
    }
    case 'foe_block_at_least':
      return ((side === 'player' ? s.enemy : s.player)?.block ?? 0) >= cond.value;
    case 'hurt_last_turn':
      return side === 'enemy' && s.fight?.enemyHurtTurn != null && s.fight.enemyHurtTurn === (s.turn ?? 1);
    case 'water_at_least':
      return side === 'player' && s.player.mana >= cond.value;
    case 'ghost_charging':
      return side === 'player' && require('./water').ghostCharging(s);
    case 'minions_at_least':
      return side === 'player' && (s.minions ?? []).filter(m => m.hp > 0).length >= cond.value;
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
  if (card?.type === 'spell') s.turnFlags.spellsCast = (s.turnFlags.spellsCast ?? 0) + 1;
}

/** ต้นเทิร์นผู้เล่น — เริ่มนับใหม่ */
export function resetCardsPlayed(s: GameState): void {
  s.turnFlags = s.turnFlags ?? ({ blessingOnce: {} } as GameState['turnFlags']);
  s.turnFlags.cardsPlayed = 0;
  s.turnFlags.limited = [];
  s.turnFlags.triggerOnce = [];
  s.turnFlags.spellsCast = 0;
  s.turnFlags.lastMove = null;
  s.turnFlags.moves = [];
  s.turnFlags.attacks = 0;
  s.turnFlags.keepRhythm = false;
  s.turnFlags.doubleNext = false;
  s.turnFlags.echoed = false;
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

export function conditionText(c: CardCondition, side: 'player' | 'enemy' = 'player'): string {
  const me = side === 'player' ? 'เรา' : 'ผี', them = side === 'player' ? 'ผี' : 'เรา';
  switch (c.kind) {
    case 'player_hp_below': return `ถ้า${side === 'player' ? '' : 'ผี'}เลือดเหลือไม่ถึง ${c.value}%`;
    case 'player_block_at_least': return c.value <= 1 && side === 'enemy' ? 'ถ้าผีมีเกราะ' : `ถ้า${side === 'player' ? '' : me}มีเกราะตั้งแต่ ${c.value}`;
    case 'enemy_has_status': return `ถ้า${them}ติด${require('../combat/status-effects/registry').STATUS_EFFECTS_REGISTRY[c.statusId]?.name ?? c.statusId}`;
    case 'hand_empty': return 'ถ้าไม่มีการ์ดอื่นในมือ';
    case 'deck_at_most': return `ถ้าสำรับเหลือไม่เกิน ${c.value} ใบ`;
    case 'rhythm_at_least': return `ถ้าจังหวะตั้งแต่ ${c.value}`;
    case 'rhythm_at_most': return c.value === 0 ? 'ถ้าไม่มีจังหวะ' : `ถ้าจังหวะไม่เกิน ${c.value}`;
    case 'enemy_status_at_least': return `ถ้า${them}ติด${require('../combat/status-effects/registry').STATUS_EFFECTS_REGISTRY[c.statusId]?.name ?? c.statusId}ตั้งแต่ ${c.value}`;
    case 'moves_this_turn_at_least': return `ถ้าเทิร์นนี้ออกท่าต่างกันครบ ${c.value} ท่า`;
    case 'round_last_turn': return 'ถ้าเป็นเทิร์นสุดท้ายของยก';
    case 'played_move': return `ถ้าเทิร์นนี้ออก${require('./fighter').MOVE_NAMES[c.move]}แล้ว`;
    case 'foe_hp_below': return `ถ้า${them}เลือดเหลือไม่ถึง ${c.value}%`;
    case 'foe_block_at_least': return c.value <= 1 ? `ถ้า${them}มีเกราะ` : `ถ้า${them}มีเกราะตั้งแต่ ${c.value}`;
    case 'hurt_last_turn': return side === 'enemy' ? 'ถ้าเทิร์นที่แล้วเราตีผีเข้าเนื้อ' : 'ถ้าเทิร์นที่แล้วผีตีเราเข้าเนื้อ';
    case 'water_at_least': return `ถ้าน้ำมนต์ตั้งแต่ ${c.value}`;
    case 'ghost_charging': return 'ถ้าผีกำลังชาร์จการ์ด';
    case 'minions_at_least': return c.value <= 1 ? 'ถ้ามีของเลี้ยงอยู่' : `ถ้ามีของเลี้ยง ${c.value} ตัว`;
  }
}
