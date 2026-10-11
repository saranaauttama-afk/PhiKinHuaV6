// src/core/cards/group.ts — รวมใบซ้ำเป็นแถวเดียว
//
// สำรับ 14 ใบที่มีใบเดียวกัน 4 ใบ ควรอ่านว่า "ฟันดาบ ×4" ไม่ใช่สี่บรรทัดที่
// เหมือนกันเป๊ะ — ใช้ทั้งหน้าสำรับและหน้ากองการ์ดในไฟต์

import type { CardData } from '../types';

export type CardGroup = { card: CardData; count: number };

/** รวมตาม id แล้วเรียงตามชื่อ (ไม่ใช่ตามลำดับในกอง — ดูหมายเหตุใน PileView) */
export function groupCards(cards: CardData[]): CardGroup[] {
  const m = new Map<string, CardGroup>();
  for (const c of cards) {
    const rec = m.get(c.id) ?? { card: c, count: 0 };
    rec.count += 1;
    m.set(c.id, rec);
  }
  return [...m.values()].sort((a, b) =>
    (a.card.name ?? a.card.id).localeCompare(b.card.name ?? b.card.id)
  );
}
