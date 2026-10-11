// src/core/engine/handlers/chapter.ts — คำสั่งของบทคั่นเล่าเรื่อง

import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { getChapter } from '../../story/chapters';

/** แตะเปิดย่อหน้าถัดไป — ย่อหน้าสุดท้ายแล้วคือปิดบท */
export function advanceChapter(
  s: GameState,
  _cmd: Extract<Command, { type: 'AdvanceChapter' }>,
  r: RNG
) {
  if (!s.chapter) return { state: s, rng: r };

  const ch = getChapter(s.chapter.id);
  // บทหายไปจากไฟล์ข้อมูล (แก้ id แล้วเซฟเก่ายังอ้างของเดิม) — ปิดทิ้ง
  // ปล่อยไว้จะกลายเป็นจอที่แตะเท่าไหร่ก็ไม่ไปไหน
  if (!ch) {
    s.chapter = undefined;
    return { state: s, rng: r };
  }

  const next = s.chapter.paragraph + 1;
  if (next >= ch.text.length) s.chapter = undefined;
  else s.chapter = { id: s.chapter.id, paragraph: next };

  return { state: s, rng: r };
}

/**
 * ข้ามทั้งบท
 *
 * ต้องมีเสมอ — คนที่เล่นซ้ำรอบที่สิบไม่ควรถูกบังคับให้แตะผ่านบทเปิดเรื่องเดิม
 * บทถูกบันทึกลง `chaptersSeen` ตั้งแต่ตอนเปิด การข้ามจึงไม่ทำให้มันกลับมาอีก
 */
export function skipChapter(
  s: GameState,
  _cmd: Extract<Command, { type: 'SkipChapter' }>,
  r: RNG
) {
  s.chapter = undefined;
  return { state: s, rng: r };
}
