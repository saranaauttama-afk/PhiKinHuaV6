// src/core/cards/curse.ts — การ์ดคำสาป
//
// ใบที่ **เล่นไม่ได้** และมีไว้เพื่อถ่วงอย่างเดียว — จั่วมาแล้วกินที่ในมือ
// ทิ้งเองท้ายเทิร์น แต่ยังอยู่ในสำรับ ไฟต์หน้าก็เจออีก
//
// ทำไมเกมนี้ต้องการมัน: ร้านสละการ์ดมีอยู่แล้วแต่แทบไม่มีใครอยากใช้ เพราะสำรับ
// มีแต่การ์ดที่ใช้ได้ทั้งนั้น การ์ดคำสาปทำให้ "การถอนการ์ดออก" กลายเป็นการ
// ตัดสินใจจริง และทำให้ศัตรู/เหตุการณ์ทำร้ายผู้เล่นได้ในแบบที่เลือดไม่ได้หาย
//
// **คำสาปไม่ถูกนับเป็นรางวัล** — มันเข้าสำรับจากเหตุการณ์หรือศัตรูเท่านั้น
// ไม่มีทางไปโผล่ในร้านหรือในตัวเลือกตอนเลเวลอัป

import type { CardData, GameState } from '../types';

export const CURSE_TAG = 'curse';

export function isCurseCard(c: CardData): boolean {
  return c.type === 'curse';
}

/** ยัดคำสาปเข้าสำรับถาวรของรัน */
export function addCurse(s: GameState, curse: CardData): void {
  s.masterDeck = [...(s.masterDeck ?? []), { ...curse }];
  s.log.push(`${curse.name} เข้าไปอยู่ในสำรับ`);
}

/**
 * ทิ้งคำสาปที่ค้างอยู่ในมือ — เรียกท้ายเทิร์นผู้เล่น
 *
 * ถ้าไม่ทิ้งให้ มือจะตันด้วยใบที่เล่นไม่ได้ และผู้เล่นต้องเสียการทิ้งการ์ด
 * ของตัวเองไปกับมัน ซึ่งเป็นการลงโทษสองชั้นสำหรับความผิดเดียว
 */
export function discardCurses(s: GameState): number {
  const curses = s.piles.hand.filter(isCurseCard);
  if (curses.length === 0) return 0;

  s.piles.hand = s.piles.hand.filter(c => !isCurseCard(c));
  s.piles.discard.push(...curses);
  s.log.push(`คำสาป ${curses.length} ใบสลายไปท้ายเทิร์น`);
  return curses.length;
}

/** จำนวนคำสาปในสำรับถาวร — ใช้บอกผู้เล่นว่าสำรับสกปรกแค่ไหน */
export function curseCount(s: GameState): number {
  return (s.masterDeck ?? []).filter(isCurseCard).length;
}
