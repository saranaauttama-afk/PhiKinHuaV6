// src/core/cards/mechanics.ts — กลไกการ์ดที่ตัวเลขอย่างเดียวทำแทนไม่ได้
//
// คลังการ์ด 97 ใบที่มีอยู่ตอนนี้เป็นการจับของที่เอนจินทำได้อยู่แล้ว (dmg, block,
// heal, draw, energyGain, statusEffect, summonMinion) มาผสมกันทั้งหมด — ต่อให้
// เพิ่มอีกร้อยใบก็ยังเป็นชุดเดิมที่ตัวเลขต่างกัน
//
// สี่อย่างในไฟล์นี้เปลี่ยน **วิธีที่การ์ดทำงาน** ไม่ใช่แค่ค่าที่มันให้:
//
//   หลายหมัด   — ดาเมจก้อนเดียวกับดาเมจซอยเป็นหลายครั้งคิดคนละแบบเมื่อเจอ
//                block / strength / vulnerable ตัวเดียวนี้เปลี่ยนคุณค่าของ
//                ทั้งสามอย่างพร้อมกัน
//   เงื่อนไข   — การ์ดอ่านสภาพสนามแล้วแรงไม่เท่ากัน ทำให้ "เล่นใบไหนก่อน"
//                กลายเป็นคำถาม
//   ค้างมือ    — ถือไว้ไม่เล่นก็มีผล ทำให้การไม่เล่นการ์ดเป็นทางเลือกจริง
//   ค่าร่ายลื่น — ยิ่งร่ายไปเยอะยิ่งถูก ทำให้ลำดับการเล่นในเทิร์นมีความหมาย

import type { CardData, GameState } from '../types';
import type { StatusEffectType } from '../combat/status-effects/types';
import { hasStatusEffect } from '../combat/status-effects';

// ===== 1. หลายหมัด =====

/**
 * การ์ดใบนี้ตีกี่ครั้ง
 *
 * ตีทีละครั้งผ่าน `dealDamage` แยกกัน ไม่ใช่คูณแล้วตีทีเดียว —
 * นั่นคือทั้งหมดของกลไกนี้:
 *   - block ดูดทีละหมัด (Block 10 กิน 3×5 ได้แค่สองหมัดแรก)
 *   - strength บวกทุกหมัด (แข็งแกร่ง 2 กับ 3 หมัด = +6 ไม่ใช่ +2)
 *   - vulnerable คูณทุกหมัด
 */
export function hitsOf(card: CardData): number {
  const n = Math.floor(card.hits ?? 1);
  return n > 1 ? n : 1;
}

// ===== 2. เงื่อนไข =====

export type CardCondition =
  /** เลือดเราเหลือไม่ถึง value% */
  | { kind: 'player_hp_below'; value: number }
  /** เรามี Block อย่างน้อย value */
  | { kind: 'player_block_at_least'; value: number }
  /** ศัตรูติดสถานะนี้อยู่ */
  | { kind: 'enemy_has_status'; statusId: string }
  /** ไม่มีการ์ดอื่นเหลือในมือแล้ว */
  | { kind: 'hand_empty' }
  /** สำรับ (ทั้งกอง) เหลือไม่เกิน value ใบ */
  | { kind: 'deck_at_most'; value: number };

/** ของแถมที่ได้เมื่อเงื่อนไขเป็นจริง — บวกทับค่าบนการ์ด */
export type ConditionalBonus = {
  dmg?: number;
  block?: number;
  heal?: number;
  draw?: number;
  energyGain?: number;
  /** ตีเพิ่มอีกกี่หมัด */
  hits?: number;
};

export type CardConditional = {
  when: CardCondition;
  bonus: ConditionalBonus;
};

export function conditionMet(s: GameState, cond: CardCondition, self?: CardData): boolean {
  switch (cond.kind) {
    case 'player_hp_below':
      return s.player.hp * 100 < s.player.maxHp * cond.value;
    case 'player_block_at_least':
      return (s.player.block ?? 0) >= cond.value;
    case 'enemy_has_status':
      return !!s.enemy && hasStatusEffect('enemy', s, cond.statusId as StatusEffectType);
    case 'hand_empty':
      // "มือว่าง" หมายถึงไม่มีใบอื่นเหลือ — ใบที่กำลังเล่นอยู่ยังนับอยู่ในมือ
      return s.piles.hand.filter(c => c !== self).length === 0;
    case 'deck_at_most':
      return (s.masterDeck?.length ?? 0) <= cond.value;
  }
}

/**
 * คืนการ์ดที่บวกของแถมเข้าไปแล้ว ถ้าเงื่อนไขเป็นจริง
 *
 * ไม่แตะการ์ดต้นฉบับ — ใบในสำรับต้องไม่โตขึ้นถาวรเพราะเคยเล่นตอนเลือดน้อย
 */
export function withConditional(s: GameState, card: CardData): CardData {
  const c = card.conditional;
  if (!c || !conditionMet(s, c.when, card)) return card;

  const b = c.bonus;
  const out: CardData = { ...card };
  const add = (k: 'dmg' | 'block' | 'heal' | 'draw' | 'energyGain') => {
    if (b[k] == null) return;
    out[k] = (card[k] ?? 0) + b[k]!;
  };
  add('dmg'); add('block'); add('heal'); add('draw'); add('energyGain');
  if (b.hits != null) out.hits = hitsOf(card) + b.hits;
  return out;
}

// ===== 3. ค้างมือแล้วมีผล =====

/** ผลที่เกิดท้ายเทิร์นถ้าการ์ดใบนี้ยังอยู่ในมือ */
export type HeldEffect = {
  block?: number;
  heal?: number;
  /** ใส่สถานะให้ตัวเอง */
  status?: { effect: string; duration: number; value: number };
};

// ===== 4. ค่าร่ายที่ลดลงตามจำนวนการ์ดที่เล่นไปแล้วในเทิร์นนี้ =====

export type CostRule = {
  kind: 'per_card_played';
  /** ลดลงกี่แต้มต่อการ์ดหนึ่งใบที่เล่นไปแล้วเทิร์นนี้ */
  step: number;
  /** ต่ำสุดเท่าไหร่ */
  min: number;
};

/** เล่นการ์ดไปแล้วกี่ใบในเทิร์นนี้ */
export function cardsPlayedThisTurn(s: GameState): number {
  return s.turnFlags?.cardsPlayed ?? 0;
}

/**
 * ค่าร่ายจริงของการ์ดใบนี้ ณ ตอนนี้
 *
 * ต้องเป็นฟังก์ชันเดียวที่ทั้งเอนจินและหน้าจอเรียก — ถ้าตัวเลขบนการ์ดกับ
 * ตัวเลขที่หักจริงมาคนละที่ ผู้เล่นจะวางแผนจากเลขที่โกหก
 */
export function effectiveCost(s: GameState, card: CardData): number {
  return costWithRule(card, cardsPlayedThisTurn(s));
}

/**
 * เวอร์ชันที่ไม่ต้องมี `GameState` ทั้งก้อน — หน้าจอเรียกตัวนี้
 *
 * แยกออกมาเพื่อให้เลขบนการ์ดกับเลขที่หักจริง **มาจากสูตรเดียวกัน**
 * ไม่ใช่ให้ UI คำนวณเองอีกชุดแล้วค่อยหวังว่าจะตรงกัน
 */
export function costWithRule(card: CardData, cardsPlayed: number): number {
  const base = Math.max(0, Math.floor(card.cost ?? 0));
  const rule = card.costRule;
  if (!rule) return base;
  return Math.max(rule.min, base - rule.step * cardsPlayed);
}

/** นับการ์ดที่เล่นไปแล้ว — เรียกหลังจ่ายค่าร่ายของใบนั้นเรียบร้อย */
export function countCardPlayed(s: GameState): void {
  s.turnFlags = s.turnFlags ?? ({ blessingOnce: {} } as GameState['turnFlags']);
  s.turnFlags.cardsPlayed = (s.turnFlags.cardsPlayed ?? 0) + 1;
}

/** ต้นเทิร์นผู้เล่น — เริ่มนับใหม่ */
export function resetCardsPlayed(s: GameState): void {
  s.turnFlags = s.turnFlags ?? ({ blessingOnce: {} } as GameState['turnFlags']);
  s.turnFlags.cardsPlayed = 0;
}

/**
 * ท้ายเทิร์นผู้เล่น — การ์ดที่ยังค้างอยู่ในมือทำงาน
 *
 * ทำงาน **ก่อน** ทิ้งมือ (ถ้ามี) และก่อนเทิร์นศัตรู เพราะทั้งหมดของกลไกนี้คือ
 * "ถือไว้แล้วมันกันให้" — ถ้าไปทำงานหลังศัตรูตีแล้วก็ไม่มีความหมาย
 *
 * นับทีละใบ ถือสองใบได้ผลสองเท่า — ไม่งั้นการถือใบที่สองไม่มีเหตุผล
 */
export function applyHeldEffects(s: GameState): void {
  const held = s.piles.hand.filter(c => c.whileHeld);
  if (held.length === 0) return;

  const { gainBlock, heal } = require('../combat/damage');
  const { applyStatusEffect } = require('../combat/status-effects');

  for (const card of held) {
    const e = card.whileHeld!;
    if (e.block) {
      gainBlock(s, 'player', e.block);
      s.log.push(`${card.name} ค้างอยู่ในมือ — Block +${e.block}`);
    }
    if (e.heal) {
      const got = heal(s, 'player', e.heal);
      if (got > 0) s.log.push(`${card.name} ค้างอยู่ในมือ — ฟื้น ${got}`);
    }
    if (e.status) {
      applyStatusEffect('player', s, e.status.effect as StatusEffectType, e.status.duration, e.status.value);
      s.log.push(`${card.name} ค้างอยู่ในมือ — ${e.status.effect} ${e.status.value}`);
    }
  }
}

/** เขียนเงื่อนไขเป็นภาษาคน — ใช้ทั้งบนการ์ดในสำรับและในมือ */
export function conditionLabel(c: CardConditional): string {
  const b = c.bonus;
  const gain: string[] = [];
  if (b.dmg)        gain.push(`โจมตี +${b.dmg}`);
  if (b.hits)       gain.push(`ตีเพิ่ม ${b.hits} หมัด`);
  if (b.block)      gain.push(`กัน +${b.block}`);
  if (b.heal)       gain.push(`ฟื้น +${b.heal}`);
  if (b.draw)       gain.push(`จั่ว +${b.draw}`);
  if (b.energyGain) gain.push(`พลังงาน +${b.energyGain}`);

  const when = (() => {
    switch (c.when.kind) {
      case 'player_hp_below':       return `ถ้าเลือดเราเหลือไม่ถึง ${c.when.value}%`;
      case 'player_block_at_least': return `ถ้าเรามี Block ตั้งแต่ ${c.when.value}`;
      case 'enemy_has_status':      return `ถ้าศัตรูติด ${c.when.statusId}`;
      case 'hand_empty':            return 'ถ้าไม่มีการ์ดอื่นเหลือในมือ';
      case 'deck_at_most':          return `ถ้าสำรับเหลือไม่เกิน ${c.when.value} ใบ`;
    }
  })();

  return `${when} → ${gain.join(' · ')}`;
}
