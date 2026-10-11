// src/core/combat/traps.ts — การ์ดดัก
//
// ชนิดการ์ดที่หายไปจากเกมนี้ทั้งที่เป็นแกนหนึ่งของ Night of the Full Moon:
// เล่นแล้ว **ไม่เกิดอะไรขึ้นทันที** — มันไปนอนรออยู่ จนกว่าศัตรูจะทำสิ่งที่ตรง
// เงื่อนไข แล้วค่อยเด้งกลับ
//
// ทำไมถึงสำคัญ: ตอนนี้เทิร์นผู้เล่นมีทางเลือกอยู่สองแบบ — ตีให้หนักที่สุด หรือ
// ตั้งการ์ดกันไว้ ทั้งสองอย่างตัดสินจาก "ตอนนี้" อย่างเดียว การ์ดดักเพิ่มทางที่สาม
// ที่ตัดสินจาก **สิ่งที่คิดว่าศัตรูจะทำ** ซึ่งเป็นการตัดสินใจคนละแบบ
// และเข้ากับผีไทยพอดี: ยันต์ดัก ด้ายสายสิญจน์ กับดักหนามไผ่ ล้วนเป็นของที่ "วางไว้"
//
// **ดักแล้วเห็น** — ผู้เล่นเห็นว่าตัวเองวางอะไรไว้ตลอด (ดู `TrapRow`)
// การซ่อนกับดักจากผู้เล่นเองไม่ได้เพิ่มความลึก มันแค่ทำให้ลืม

import type { CardData, GameState } from '../types';
import type { StatusEffectType } from './status-effects/types';
import { applyStatusEffect } from '../statusEffectsRuntime';
import { dealDamage, gainBlock } from './damage';

/** ดักอะไร */
export type TrapTrigger =
  /** ศัตรูเล่นการ์ดโจมตี */
  | 'enemy_attack'
  /** ศัตรูเล่นการ์ดกัน/เสริม */
  | 'enemy_skill'
  /** ศัตรูเล่นการ์ดอะไรก็ได้ */
  | 'enemy_any';

/** เด้งกลับยังไง */
export type TrapEffect = {
  type: 'damage' | 'block' | 'status' | 'negate' | 'energy';
  value: number;
  /** สำหรับ status */
  statusId?: string;
  desc: string;
};

/** ข้อมูลกับดักที่อยู่บนการ์ด */
export type TrapSpec = {
  trigger: TrapTrigger;
  effects: TrapEffect[];
  /** ตั้งค้างได้กี่เทิร์นก่อนสลาย — ไม่ใส่ = อยู่จนจบไฟต์ */
  duration?: number;
};

/** กับดักที่ตั้งอยู่จริงในไฟต์ */
export type ArmedTrap = {
  /** id ของการ์ดที่ตั้งไว้ */
  cardId: string;
  name: string;
  trigger: TrapTrigger;
  effects: TrapEffect[];
  /** เหลืออีกกี่เทิร์น — `undefined` = อยู่จนจบไฟต์ */
  turnsLeft?: number;
};

export function trapOf(card: CardData): TrapSpec | undefined {
  return (card as any).trap;
}

export function isTrapCard(card: CardData): boolean {
  return card.type === 'trap' && !!trapOf(card);
}

function armed(s: GameState): ArmedTrap[] {
  return (s.traps ??= []);
}

/** เริ่มไฟต์ = ไม่มีกับดักตกค้าง */
export function resetTraps(s: GameState): void {
  s.traps = [];
}

/** ตั้งกับดัก — เรียกตอนเล่นการ์ดชนิด trap */
export function armTrap(s: GameState, card: CardData): boolean {
  const spec = trapOf(card);
  if (!spec) return false;

  armed(s).push({
    cardId: card.id,
    name: card.name,
    trigger: spec.trigger,
    effects: spec.effects,
    turnsLeft: spec.duration,
  });
  s.log.push(`ตั้ง ${card.name} ไว้แล้ว`);
  return true;
}

/** การ์ดของศัตรูใบนี้ไปโดนกับดักอันไหนบ้าง */
function matches(trap: ArmedTrap, enemyCardType: 'attack' | 'skill'): boolean {
  if (trap.trigger === 'enemy_any') return true;
  if (trap.trigger === 'enemy_attack') return enemyCardType === 'attack';
  return enemyCardType === 'skill';
}

export type TrapResult = {
  /** การ์ดของศัตรูใบนี้ถูกยกเลิกไหม */
  negated: boolean;
  /** ชื่อกับดักที่ทำงาน */
  sprung: string[];
};

/**
 * ศัตรูกำลังจะเล่นการ์ดใบหนึ่ง — เช็คกับดักก่อน
 *
 * กับดักที่ทำงานแล้วหายไป (ใบเดียวใช้ครั้งเดียว) เพื่อให้การตั้งดักเป็นการ
 * ลงทุนที่มีต้นทุน ไม่ใช่ของถาวรที่ตั้งครั้งเดียวแล้วชนะทั้งไฟต์
 */
export function springTraps(
  s: GameState,
  enemyCardType: 'attack' | 'skill'
): TrapResult {
  const list = armed(s);
  const hit = list.filter(t => matches(t, enemyCardType));
  if (hit.length === 0) return { negated: false, sprung: [] };

  let negated = false;
  const sprung: string[] = [];

  for (const trap of hit) {
    sprung.push(trap.name);
    s.log.push(`${trap.name} ทำงาน!`);

    for (const e of trap.effects) {
      switch (e.type) {
        case 'damage':
          if (s.enemy) {
            dealDamage(s, {
              from: 'player', to: 'enemy', raw: e.value,
              source: { kind: 'card', cardId: trap.cardId },
            });
          }
          break;
        case 'block':
          gainBlock(s, 'player', e.value);
          break;
        case 'status':
          if (e.statusId) {
            applyStatusEffect('enemy', s, e.statusId as StatusEffectType, undefined, e.value);
          }
          break;
        case 'energy':
          s.player.energy += e.value;
          break;
        case 'negate':
          negated = true;
          break;
      }
      s.log.push(`  ${e.desc}`);
    }
  }

  // ใช้แล้วหาย
  s.traps = list.filter(t => !hit.includes(t));

  return { negated, sprung };
}

/** ท้ายเทิร์นผู้เล่น — กับดักที่มีอายุจำกัดนับถอยหลัง */
export function tickTraps(s: GameState): void {
  const list = armed(s);
  const kept: ArmedTrap[] = [];

  for (const t of list) {
    if (t.turnsLeft == null) { kept.push(t); continue; }
    const left = t.turnsLeft - 1;
    if (left <= 0) {
      s.log.push(`${t.name} สลายไปโดยไม่ได้ทำงาน`);
      continue;
    }
    kept.push({ ...t, turnsLeft: left });
  }

  s.traps = kept;
}
