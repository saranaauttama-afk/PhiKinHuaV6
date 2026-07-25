// EXP และฟังก์ชันเลเวลอัป
//
// เป้าหมายจาก gameSpec.txt: ผู้เล่นควรถึง **เลเวล 10 ตอนเข้าบอสสุดท้าย (ไฟต์ 15)**
//
// ของเดิมใช้เส้นโค้งแบน `10 + (level-1)*4` (10, 14, 18, 22, …) และให้ EXP
// ก้อนเดียวต่อกลุ่มกว้างๆ (normal/elite/boss) วัดจริงแล้วผู้เล่นถึง **เลเวล 14**
// ตอนเข้าบอสสุดท้าย เกินเป้า 4 เลเวล เพราะเลเวลปลายมาถึงเร็วพอๆ กับเลเวลต้น
//
// ตอนนี้:
//   - เส้นโค้งชันขึ้นเรื่อยๆ ตามที่สเปคร่างไว้ (20, 30, 45, 65, …)
//   - EXP คิดตาม tier ของผีจริง (T1…T5/Elite/Boss) ไม่ใช่ก้อนเดียวใช้กับทุกตัว
//     ตรงกับ TODO ในสเปคที่เขียนว่า "Different Rewards per Monster"

import type { ThaiGhostData } from '../monsters/thai-ghosts';

/** EXP ที่ต้องใช้เพื่อขึ้นจากเลเวลนี้ไปเลเวลถัดไป (รวม 1→10 = 960) */
const NEXT_EXP_TABLE: Record<number, number> = {
  1: 20, 2: 30, 3: 45, 4: 65, 5: 90,
  6: 120, 7: 155, 8: 195, 9: 240,
};

/** เลเวล 10 ขึ้นไปยังเล่นต่อได้ (ศึกลับ) — โตต่อแบบชัน */
const LATE_LEVEL_STEP = 60;

export function nextExpForLevel(level: number) {
  const known = NEXT_EXP_TABLE[level];
  if (known != null) return known;
  return NEXT_EXP_TABLE[9] + (level - 9) * LATE_LEVEL_STEP;
}

/**
 * EXP ต่อการฆ่าผีหนึ่งตน แยกตาม tier
 * ตั้งให้ผลรวมของ 13 ไฟต์ปกติ + บอสกลาง ≈ 960 (EXP ที่ต้องใช้ถึงเลเวล 10)
 */
export const EXP_BY_TIER: Record<ThaiGhostData['tier'], number> = {
  T1: 28,
  T2: 38,
  T3: 55,
  T4: 75,
  T5: 95,
  Elite: 120,
  BossMid: 120,
  BossFinal: 160,
  SecretBoss: 200,
};

// ค่าเดิมยังถูก import อยู่บางที่ — คงไว้เป็น fallback กว้างๆ
export const EXP_KILL_NORMAL = EXP_BY_TIER.T2;
export const EXP_KILL_ELITE  = EXP_BY_TIER.Elite;
export const EXP_KILL_BOSS   = EXP_BY_TIER.BossMid;

/** EXP ที่ได้จากผีตนนี้ — ถ้าไม่รู้จัก tier ใช้ค่ากลาง */
export function expForMonster(tier?: ThaiGhostData['tier']): number {
  if (!tier) return EXP_KILL_NORMAL;
  return EXP_BY_TIER[tier] ?? EXP_KILL_NORMAL;
}

/** ทองที่ได้จากผีตนนี้ แยกตาม tier เช่นเดียวกัน */
export const GOLD_BY_TIER: Record<ThaiGhostData['tier'], number> = {
  T1: 10,
  T2: 12,
  T3: 16,
  T4: 20,
  T5: 25,
  Elite: 35,
  BossMid: 60,
  BossFinal: 100,
  SecretBoss: 140,
};

export function goldForMonster(tier?: ThaiGhostData['tier']): number {
  if (!tier) return GOLD_BY_TIER.T2;
  return GOLD_BY_TIER[tier] ?? GOLD_BY_TIER.T2;
}
