// src/core/combat/damage.ts — ทางเดียวสำหรับการคำนวณและลงดาเมจทั้งเกม
//
// ก่อนหน้านี้มีการคำนวณดาเมจกระจายอยู่ 3 ที่ (commands.ts ฝั่งผู้เล่น,
// engine/handlers/combat.ts และ engine/handlers/enemy.ts ฝั่งศัตรู)
// แต่ละที่คำนวณ block/hp เอง และมีแต่ฝั่งผู้เล่นเท่านั้นที่ผ่านระบบ status effect
// ทำให้ strength/weakness ของศัตรูไม่เคยมีผล และ vulnerable ไม่มีผลทั้งสองฝั่ง
//
// ไฟล์นี้รวมทุกอย่างไว้ที่เดียว และ **คืนผลลัพธ์ที่ละเอียดพอให้ UI เอาไปแสดงได้ตรงจริง**
// (ตัวเลขที่เด้งบนจอต้องมาจาก DamageResult ไม่ใช่จากค่าบนการ์ด)

import type { CombatEvent, GameState } from '../types';
import {
  modifyDamageForStatusEffects,
  hasStatusEffect,
} from './status-effects';

/** ปล่อย event ให้ view เอาไปเล่นเป็นอนิเมชั่น (ดู CombatEvent ใน types.ts) */
export function emit(state: GameState, ev: CombatEvent) {
  (state.pendingEvents ??= []).push(ev);
}

export type Side = 'player' | 'enemy';

export type DamageSource =
  | { kind: 'card'; cardId: string }
  | { kind: 'combo'; comboId: string }
  | { kind: 'status'; effectId: string }
  | { kind: 'minion'; minionId: string; ignoresBlock?: boolean }
  | { kind: 'event' };

/**
 * กฎของดาเมจแต่ละชนิด — ที่มาของดาเมจเป็นตัวกำหนดกฎเอง ไม่ต้องส่ง flag เพิ่ม
 *
 * - card / combo: ดาเมจต่อสู้เต็มรูปแบบ ผ่านทุกอย่าง
 *   (combo เกิดจากการเล่นการ์ดของผู้เล่น = พลังของผู้เล่น จึงคิดเหมือนการ์ด)
 *
 * - status (poison ฯลฯ): ทะลุ block และไม่โดน modifier ใดๆ
 *   block คือการปัดป้องหมัดที่กำลังมา แต่พิษอยู่ในตัวแล้ว — เป็นธรรมเนียมของแนวนี้
 *   และ DoT ที่ stack ได้ต้องคาดเดาได้ ไม่ใช่คูณซ้อนกับ buff จนบานปลาย
 *
 * - minion: โดน block ตามปกติ (เว้นแต่ ability ระบุ ignoresBlock)
 *   ผู้รับที่ติด vulnerable กินเพิ่ม แต่ *ไม่* สืบทอด strength ของผู้เรียก
 *   เพราะ minion เป็นคนละตัวกับผู้เรียก มีพลังของตัวเอง
 *
 * - event: ดาเมจเชิงเนื้อเรื่อง ไม่ใช่การต่อสู้ → ทะลุทุกอย่าง
 */
type DamageRules = {
  useBlock: boolean;
  attackerMods: boolean;
  defenderMods: boolean;
};

function rulesFor(source: DamageSource): DamageRules {
  switch (source.kind) {
    case 'card':
    case 'combo':
      return { useBlock: true, attackerMods: true, defenderMods: true };
    case 'minion':
      return { useBlock: !source.ignoresBlock, attackerMods: false, defenderMods: true };
    case 'status':
    case 'event':
      return { useBlock: false, attackerMods: false, defenderMods: false };
  }
}

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
 * คำนวณดาเมจหลังปรับ **โดยไม่แตะ state** — ใช้ทั้งตอนลงดาเมจจริง
 * และตอนคำนวณตัวเลข intent ที่จะโชว์ให้ผู้เล่นเห็นล่วงหน้า
 *
 * ตัวเลขบน intent ต้องมาจากสูตรเดียวกับดาเมจจริง ไม่งั้นผู้เล่นวางแผนจากเลขที่โกหก
 */
export function computeModifiedDamage(
  state: GameState,
  args: { from: Side; to: Side; raw: number; source: DamageSource }
): number {
  const { from, to, raw } = args;
  const rules = rulesFor(args.source);
  let dmg = raw;

  // 1) ฝั่งผู้ตี — ฟังก์ชันนี้อ่าน status ของ "ผู้ตี" จาก flag ตัวที่สอง
  if (rules.attackerMods) {
    dmg = modifyDamageForStatusEffects(state, dmg, from === 'player');

    // 2) adaptive AI — ใช้กับดาเมจผู้เล่นเท่านั้นในรูปแบบ inverse
    if (from === 'player') {
      const { getAdaptiveDamageMultiplier } = require('../adaptiveAI');
      const mult = getAdaptiveDamageMultiplier(state);
      if (Number.isFinite(mult) && mult > 0) {
        dmg = dmg * (1 / mult);
      }
    }
  }

  // 3) ฝั่งผู้รับ — vulnerable
  if (rules.defenderMods && hasStatusEffect(to, state, 'vulnerable' as any)) {
    dmg = dmg * VULNERABLE_MULTIPLIER;
  }

  return Math.max(0, Math.round(dmg));
}

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
  const sourceKind = args.source.kind;

  const rules = rulesFor(args.source);
  const modified = computeModifiedDamage(state, { from, to, raw, source: args.source });

  // 4) block ดูดซับ (ดาเมจบางชนิดทะลุ block — ดู rulesFor)
  const blockBefore = targetState.block ?? 0;
  const blocked = rules.useBlock ? Math.min(blockBefore, modified) : 0;
  const hpLoss = modified - blocked;

  targetState.block = blockBefore - blocked;

  // 5) ตัด HP
  const hpBefore = targetState.hp;
  targetState.hp = Math.max(0, hpBefore - hpLoss);
  const died = hpBefore > 0 && targetState.hp <= 0;

  emit(state, {
    t: 'Damage',
    target: to,
    raw, modified, blocked, hpLoss, died,
    sourceKind,
  });
  if (died) emit(state, { t: 'Died', who: to });

  return { raw, modified, blocked, hpLoss, died };
}

/** เพิ่ม block ให้ฝ่ายใดฝ่ายหนึ่ง — คู่กับ dealDamage เพื่อให้ UI มีจุดเดียวที่ต้องดู */
export function gainBlock(state: GameState, side: Side, amount: number): number {
  const targetState = side === 'player' ? state.player : state.enemy;
  if (!targetState || amount <= 0) return 0;
  targetState.block = (targetState.block ?? 0) + amount;
  emit(state, { t: 'BlockGained', target: side, amount });
  return amount;
}

/** ฟื้น HP — คืนจำนวนที่ฟื้นได้จริง (ไม่เกิน maxHp) */
export function heal(state: GameState, side: Side, amount: number): number {
  const targetState = side === 'player' ? state.player : state.enemy;
  if (!targetState || amount <= 0) return 0;
  const before = targetState.hp;
  targetState.hp = Math.min(targetState.maxHp, before + amount);
  const healed = targetState.hp - before;
  if (healed > 0) emit(state, { t: 'Healed', target: side, amount: healed });
  return healed;
}
