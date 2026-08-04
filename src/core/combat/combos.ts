// src/core/combat/combos.ts — คอมโบการ์ด
//
// **เขียนใหม่จาก `cardComboSystem.ts` เดิม** ซึ่งทำงานอยู่จริงทุกครั้งที่เล่นการ์ด
// แต่มีปัญหาสี่อย่างพร้อมกัน:
//
//  1. ความคืบหน้าเก็บใน `const activeComboProgress: ComboProgress[]` ระดับโมดูล
//     — ไม่ถูกเซฟ ไม่ถูกโคลนตอน `applyCommand` และค้างข้ามไฟต์/ข้ามรัน
//     (บั๊กชนิดเดียวกับผีที่เรียกมา และ adaptiveAI ก่อนหน้านั้น)
//  2. ตัวนับอีกสามตัวเกาะอยู่บน `(state as any)` — `completedCombos`,
//     `freeCardsRemaining`, `debuffImmunity` ไม่มีไทป์ ไม่มีใครเห็น
//  3. **ผลลัพธ์ `draw` ไม่ได้จั่วจริง** มันแค่ `log.push('Draw 3 cards!')`
//  4. ชื่อและคำอธิบายเป็นภาษาอังกฤษทั้งหมด และมีแต่คอมโบของหมอผี
//     อีกสามคลาสไม่มีคอมโบเลยสักชุด
//
// ตอนนี้ตัวคอมโบเป็นข้อมูลใน `combos.json` (เพิ่มคอมโบ = แก้ไฟล์ข้อมูล
// ไม่ต้องแตะโค้ด) และสถานะทั้งหมดอยู่ใน `state.combo`

import type { CardData, GameState } from '../types';
import type { StatusEffectType } from './status-effects/types';
import { applyStatusEffect, clearAllStatusEffects } from '../statusEffectsRuntime';
import { summonMinion } from '../minionRuntime';
import { dealDamage, gainBlock } from './damage';

export type ComboEffect = {
  type: 'damage' | 'heal' | 'block' | 'status' | 'energy' | 'draw'
      | 'summon' | 'freeCards' | 'debuffImmunity' | 'cleanse';
  value: number;
  target: 'player' | 'enemy';
  statusId?: string;
  minionId?: string;
  desc: string;
};

export type CardCombo = {
  id: string;
  /** คอมโบนี้เป็นของคลาสไหน — ใช้กรองตอนแสดงผลและตอนตรวจ */
  classTag: string;
  name: string;
  desc: string;
  /** ต้องเล่นการ์ดชุดนี้ให้ครบ */
  requiredCards?: string[];
  /** หรือเล่นการ์ดที่มีแท็กนี้ให้ครบ `requiredCount` ใบไม่ซ้ำ */
  requiredTags?: string[];
  requiredCount?: number;
  /** ติดค้างได้กี่เทิร์นก่อนหลุด */
  maxTurns: number;
  oncePerCombat?: boolean;
  effects: ComboEffect[];
};

export const COMBOS: CardCombo[] = require('../../data/packs/base/combos.json');

export const COMBO_BY_ID: Record<string, CardCombo> = Object.fromEntries(
  COMBOS.map(c => [c.id, c])
);

/** คอมโบที่คลาสนี้ทำได้ */
export function combosForClass(classTag: string): CardCombo[] {
  return COMBOS.filter(c => c.classTag === classTag);
}

/** ต้องเล่นการ์ดกี่ใบถึงจะครบคอมโบนี้ */
export function comboTarget(combo: CardCombo): number {
  if (combo.requiredCards?.length) return combo.requiredCards.length;
  return combo.requiredCount ?? 2;
}

/** สถานะคอมโบของไฟต์ปัจจุบัน */
export type ComboState = {
  /** คอมโบที่กำลังนับอยู่ */
  progress: Array<{ comboId: string; cardsPlayed: string[]; turnStarted: number }>;
  /** คอมโบที่ติดไปแล้วในไฟต์นี้ */
  done: string[];
  /** การ์ดกี่ใบถัดไปที่ไม่เสียพลังงาน */
  freeCards: number;
  /** สถานะลบเข้าไม่ได้ตลอดไฟต์ */
  debuffImmunity: boolean;
};

function comboState(s: GameState): ComboState {
  return (s.combo ??= { progress: [], done: [], freeCards: 0, debuffImmunity: false });
}

/** เริ่มไฟต์ใหม่ = คอมโบเริ่มนับใหม่หมด */
export function resetCombos(s: GameState): void {
  s.combo = { progress: [], done: [], freeCards: 0, debuffImmunity: false };
}

/** การ์ดใบนี้นับเข้าคอมโบนี้ไหม */
function contributes(combo: CardCombo, card: CardData): boolean {
  if (combo.requiredCards?.includes(card.id)) return true;
  if (combo.requiredTags?.length) {
    return !!card.tags?.some(t => combo.requiredTags!.includes(t));
  }
  return false;
}

function isComplete(combo: CardCombo, played: string[]): boolean {
  if (combo.requiredCards?.length) {
    return combo.requiredCards.every(id => played.includes(id));
  }
  return played.length >= comboTarget(combo);
}

/**
 * เรียกทุกครั้งที่ผู้เล่นเล่นการ์ด
 *
 * ตรวจเฉพาะคอมโบของคลาสที่กำลังเล่นอยู่ — เดิมตรวจคอมโบหมอผีให้ทุกคลาส
 * ซึ่งไม่มีทางติดเพราะคลาสอื่นไม่มีการ์ดพวกนั้นในสำรับ
 */
export function onCardPlayed(s: GameState, card: CardData, classTag: string): void {
  const cs = comboState(s);
  const pool = combosForClass(classTag);

  for (const combo of pool) {
    if (cs.done.includes(combo.id)) continue;
    if (!contributes(combo, card)) continue;

    let p = cs.progress.find(x => x.comboId === combo.id);
    if (!p) {
      p = { comboId: combo.id, cardsPlayed: [], turnStarted: s.turn };
      cs.progress.push(p);
    }
    if (p.cardsPlayed.includes(card.id)) continue;

    p.cardsPlayed.push(card.id);

    if (isComplete(combo, p.cardsPlayed)) {
      cs.progress = cs.progress.filter(x => x.comboId !== combo.id);
      cs.done.push(combo.id);
      s.log.push(`คอมโบ ${combo.name}!`);
      applyCombo(s, combo);
    } else {
      s.log.push(`${combo.name} ${p.cardsPlayed.length}/${comboTarget(combo)}`);
    }
  }
}

/** เรียกท้ายเทิร์น — คอมโบที่ค้างนานเกินหลุด */
export function expireCombos(s: GameState): void {
  const cs = comboState(s);
  cs.progress = cs.progress.filter(p => {
    const combo = COMBO_BY_ID[p.comboId];
    if (!combo) return false;
    if (s.turn - p.turnStarted < combo.maxTurns) return true;
    s.log.push(`${combo.name} หลุดคอมโบ`);
    return false;
  });
}

function applyCombo(s: GameState, combo: CardCombo): void {
  const cs = comboState(s);

  for (const e of combo.effects) {
    switch (e.type) {
      case 'damage':
        if (s.enemy) {
          dealDamage(s, {
            from: 'player', to: 'enemy', raw: e.value,
            source: { kind: 'combo', comboId: combo.id },
          });
        }
        break;

      case 'heal':
        s.player.hp = Math.min(s.player.maxHp, s.player.hp + e.value);
        break;

      case 'block':
        gainBlock(s, 'player', e.value);
        break;

      case 'status':
        if (e.statusId) {
          applyStatusEffect(e.target, s, e.statusId as StatusEffectType, undefined, e.value);
        }
        break;

      case 'energy':
        s.player.energy += e.value;
        break;

      case 'draw': {
        // เดิมข้อนี้เป็น log อย่างเดียว — คอมโบที่โฆษณาว่า "จั่ว 5 ใบ"
        // ไม่เคยจั่วให้สักใบตลอดมา
        const { drawUpTo } = require('../commands');
        const { nextStateRng } = require('../rngState');
        const target = s.piles.hand.length + e.value;
        drawUpTo(s, nextStateRng(s), target);
        break;
      }

      case 'summon':
        if (e.minionId) summonMinion(s, e.minionId, e.target, e.value);
        break;

      case 'freeCards':
        cs.freeCards += e.value;
        break;

      case 'debuffImmunity':
        cs.debuffImmunity = true;
        break;

      case 'cleanse':
        clearAllStatusEffects(e.target, s, 'debuff');
        break;
    }
    s.log.push(`  ${e.desc}`);
  }
}

/** ลดค่าร่ายถ้ากำลังมีผล "การ์ดถัดไปฟรี" ค้างอยู่ */
export function applyComboCardModifiers(s: GameState, card: CardData): CardData {
  const cs = comboState(s);
  if (cs.freeCards <= 0) return card;
  cs.freeCards -= 1;
  s.log.push(`${card.name} ร่ายฟรี`);
  return { ...card, cost: 0 };
}

export function shouldBlockDebuff(s: GameState): boolean {
  return !!s.combo?.debuffImmunity;
}
