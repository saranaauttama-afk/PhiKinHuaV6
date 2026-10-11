// src/core/rngState.ts — RNG สำหรับจุดที่ยังร้อย RNG ผ่าน signature ไม่ได้
//
// เกมนี้ตั้งใจให้ deterministic ตาม seed (ดู gameSpec.txt) และ rng.ts เขียนไว้เอง
// ว่า "no Math.random" แต่ยังมีบางจุดที่อยู่ลึกในระบบย่อย (minion, behavior)
// ซึ่งฟังก์ชันครอบไม่ได้รับ RNG มาด้วย
//
// แทนที่จะรื้อ signature ทั้งสาย ใช้วิธี derive RNG จาก seed ของรัน + ตัวนับที่เก็บใน
// state เอง ผลลัพธ์จึงยังคงซ้ำได้ 100% เมื่อใช้ seed เดิม และไม่พึ่งเวลาหรือ Math.random

import type { GameState } from './types';
import { makeRng, int, type RNG } from './rng';

/**
 * ขอ RNG ตัวถัดไปจาก state — เดินตัวนับไปหนึ่งขั้นทุกครั้งที่เรียก
 * ค่าที่ได้ขึ้นกับ (seed, ลำดับการเรียก) เท่านั้น
 */
export function nextStateRng(state: GameState): RNG {
  const cursor = (state.rngCursor ?? 0) + 1;
  state.rngCursor = cursor;
  return makeRng(`${state.seed}#${cursor}`);
}

/** สุ่มสมาชิกหนึ่งตัวจาก array แบบ deterministic */
export function pickFrom<T>(state: GameState, items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  const roll = int(nextStateRng(state), 0, items.length - 1);
  return items[roll.value];
}

/** สร้าง id ที่ไม่ซ้ำและซ้ำได้ตาม seed — แทนการใช้ Date.now() + Math.random() */
export function makeDeterministicId(state: GameState, prefix: string): string {
  const cursor = (state.idCursor ?? 0) + 1;
  state.idCursor = cursor;
  return `${prefix}_${state.seed}_${cursor}`;
}
