// src/core/combat/damage.ts — ทางเดียวสำหรับการคำนวณและลงดาเมจทั้งเกม
//
// ก่อนหน้านี้มีการคำนวณดาเมจกระจายอยู่ 3 ที่ (commands.ts ฝั่งผู้เล่น,
// engine/handlers/combat.ts และ engine/handlers/enemy.ts ฝั่งศัตรู)
// แต่ละที่คำนวณ block/hp เอง และมีแต่ฝั่งผู้เล่นเท่านั้นที่ผ่านระบบ status effect
// ทำให้ strength/weakness ของศัตรูไม่เคยมีผล และ vulnerable ไม่มีผลทั้งสองฝั่ง
//
// ไฟล์นี้รวมทุกอย่างไว้ที่เดียว และ **คืนผลลัพธ์ที่ละเอียดพอให้ UI เอาไปแสดงได้ตรงจริง**
// (ตัวเลขที่เด้งบนจอต้องมาจาก DamageResult ไม่ใช่จากค่าบนการ์ด)

import type { GameState } from '../types';
import {
  modifyDamageForStatusEffects,
  hasStatusEffect,
} from './status-effects';

export type Side = 'player' | 'enemy';

export type DamageSource =
  | { kind: 'card'; cardId: string }
  | { kind: 'status'; effectId: string }
  | { kind: 'minion'; minionId: string }
  | { kind: 'event' };

export type DamageResult = {
  /** ตัวเลขดิบก่อนปรับ (เช่น ค่า dmg บนการ์ด) */
  raw: number;
  /** หลังผ่าน status effect ทั้งฝั่งผู้ตีและผู้รับ + adaptive AI */
  modified: number;
  /** จำนวนที่ block ดูดซับไป */
  blocked: number;
  /** HP ที่หายไปจริง */
  hpLoss: number;
  /** เป้าหมายตายจากดาเมจครั้งนี้หรือไม่ */
  died: boolean;
};

/** vulnerable: "รับความเสียหายเพิ่ม 50%" ตาม registry */
const VULNERABLE_MULTIPLIER = 1.5;

/**
 * คำนวณดาเมจสุดท้ายและลงผลกับ state
 *
 * ลำดับการคำนวณ:
 *   1. ฝั่งผู้ตี — strength (+stacks) / weakness (×0.75)
 *   2. adaptive AI multiplier (เฉพาะตอนผู้เล่นตี — คงพฤติกรรมเดิมไว้)
 *   3. ฝั่งผู้รับ — vulnerable (×1.5)
 *   4. block ดูดซับ
 *   5. ตัด HP (ไม่ต่ำกว่า 0)
 */
export function dealDamage(
  state: GameState,
  args: { from: Side; to: Side; raw: number; source: DamageSource }
): DamageResult {
  const { from, to, raw } = args;

  if (!Number.isFinite(raw)) {
    throw new Error(
      `dealDamage: raw damage ไม่ใช่ตัวเลขที่ใช้ได้ (${raw}) — source=${JSON.stringify(args.source)}`
    );
  }

  const targetState = to === 'player' ? state.player : state.enemy;
  if (!targetState) {
    return { raw, modified: 0, blocked: 0, hpLoss: 0, died: false };
  }

  // 1) ฝั่งผู้ตี — ฟังก์ชันนี้อ่าน status ของ "ผู้ตี" จาก flag ตัวที่สอง
  //    (ก่อนหน้านี้ถูกเรียกด้วย true เสมอ ทำให้ฝั่งศัตรูไม่เคยถูกคำนวณ)
  let dmg = modifyDamageForStatusEffects(state, raw, from === 'player');

  // 2) adaptive AI — เดิมใช้กับดาเมจผู้เล่นเท่านั้นในรูปแบบ inverse
  //    คงไว้ตามเดิมเพื่อไม่ให้ balance ฝั่งศัตรูขยับเกินจากที่ตั้งใจแก้
  if (from === 'player') {
    const { getAdaptiveDamageMultiplier } = require('../adaptiveAI');
    const mult = getAdaptiveDamageMultiplier();
    if (Number.isFinite(mult) && mult > 0) {
      dmg = dmg * (1 / mult);
    }
  }

  // 3) ฝั่งผู้รับ — vulnerable เคยประกาศไว้ใน registry แต่ไม่เคยถูกต่อสาย
  if (hasStatusEffect(to, state, 'vulnerable' as any)) {
    dmg = dmg * VULNERABLE_MULTIPLIER;
  }

  const modified = Math.max(0, Math.round(dmg));

  // 4) block ดูดซับ
  const blockBefore = targetState.block ?? 0;
  const blocked = Math.min(blockBefore, modified);
  const hpLoss = modified - blocked;

  targetState.block = blockBefore - blocked;

  // 5) ตัด HP
  const hpBefore = targetState.hp;
  targetState.hp = Math.max(0, hpBefore - hpLoss);
  const died = hpBefore > 0 && targetState.hp <= 0;

  return { raw, modified, blocked, hpLoss, died };
}

/** เพิ่ม block ให้ฝ่ายใดฝ่ายหนึ่ง — คู่กับ dealDamage เพื่อให้ UI มีจุดเดียวที่ต้องดู */
export function gainBlock(state: GameState, side: Side, amount: number): number {
  const targetState = side === 'player' ? state.player : state.enemy;
  if (!targetState || amount <= 0) return 0;
  targetState.block = (targetState.block ?? 0) + amount;
  return amount;
}
