// src/core/story/chapters.ts — บทคั่นระหว่างทาง
//
// ต่างจาก `events/story.ts` ตรงที่ **ไม่มีให้เลือก** — บทคั่นคือช่วงที่เกมหยุด
// แล้วเล่าให้ฟังว่าตอนนี้เรื่องเดินมาถึงไหน
//
// เกมนี้มีจุดพลิกที่ผู้เล่นควรรู้สึกอยู่ 5 จุด (เริ่มเดินทาง / ผ่านครึ่งทาง /
// ถึงปลายทาง / ปลดล็อคศึกลับ / จบรัน) แต่ก่อนหน้านี้ทุกจุดสื่อสารผ่าน
// `s.log.push(...)` ซึ่ง **ไม่มี UI ไหนแสดงเลย** — ผ่านบอสกลางแล้วก็แค่เจอ
// แผนที่หน้าใหม่ ไม่มีอะไรบอกว่าเพิ่งจบภาคแรกไป
//
// ข้อความเก็บเป็นอาร์เรย์ย่อหน้า เพื่อให้แตะเปิดทีละย่อหน้าแบบ visual novel
// แทนที่จะเทกำแพงข้อความใส่ผู้เล่นทีเดียว

import type { GameState } from '../types';
import type { ClassId } from '../classes';

export type StoryChapter = {
  id: string;
  title: string;
  /** ย่อหน้าที่ผู้เล่นแตะเปิดทีละอัน */
  text: string[];
  /** บทเปิดเรื่องมีของแต่ละคลาส — บทอื่นใช้ร่วมกันทั้งเกม */
  classId?: ClassId;
};

/**
 * จังหวะที่บทหนึ่งควรขึ้น
 *
 * เก็บเป็น union แทนสตริงเปล่า เพื่อให้ลืมส่ง `classId` ของบทเปิดเรื่องไม่ได้
 */
export type ChapterTrigger =
  | { kind: 'prologue'; classId?: ClassId }
  | { kind: 'mid_boss' }
  | { kind: 'final_boss' }
  | { kind: 'secret' }
  | { kind: 'ending'; won: boolean; beatSecretBoss?: boolean };

export const STORY_CHAPTERS: StoryChapter[] =
  require('../../data/packs/base/story_chapters.json');

export const CHAPTER_BY_ID: Record<string, StoryChapter> = Object.fromEntries(
  STORY_CHAPTERS.map(c => [c.id, c])
);

export function getChapter(id: string): StoryChapter | undefined {
  return CHAPTER_BY_ID[id];
}

/** บทไหนควรขึ้นในจังหวะนี้ */
export function chapterIdFor(t: ChapterTrigger): string | undefined {
  switch (t.kind) {
    case 'prologue':  return t.classId ? `prologue_${t.classId}` : undefined;
    case 'mid_boss':  return 'after_mid_boss';
    case 'final_boss': return 'before_final_boss';
    case 'secret':    return 'secret_unlocked';
    case 'ending':
      if (!t.won) return 'ending_lose';
      return t.beatSecretBoss ? 'ending_secret' : 'ending_win';
  }
}

/**
 * เปิดบทนี้ ถ้ายังไม่เคยขึ้นในรันนี้ — คืน true เมื่อเปิดจริง
 *
 * กันซ้ำสองชั้น เพราะจุดยิงบางจุดถูกเรียกซ้ำได้ตามธรรมชาติ (เช็คบอสสุดท้าย
 * ทำทุกครั้งที่เดินถึงชั้นใหม่) และเกมต้องไม่หยุดเล่าเรื่องเดิมซ้ำ:
 *   1. บทที่ขึ้นไปแล้วในรันนี้อยู่ใน `chaptersSeen`
 *   2. ถ้ามีบทค้างอยู่บนจอ ห้ามทับ — ทับแล้วบทเดิมหายทั้งที่ยังไม่ได้อ่าน
 *
 * ข้อความหาย (id ผิด/ไฟล์ข้อมูลไม่มีบทนั้น) = เดินต่อเงียบๆ ไม่ใช่ค้างจอเปล่า
 */
export function fireChapter(s: GameState, t: ChapterTrigger): boolean {
  if (s.chapter) return false;

  const id = chapterIdFor(t);
  if (!id) return false;

  const ch = getChapter(id);
  if (!ch || ch.text.length === 0) return false;

  const seen = s.chaptersSeen ?? [];
  if (seen.includes(id)) return false;

  s.chaptersSeen = [...seen, id];
  s.chapter = { id, paragraph: 0 };
  return true;
}
