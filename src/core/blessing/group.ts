// src/core/blessing/group.ts — รวมพรซ้ำเป็นแถวเดียว
//
// พรซ้ำเกิดขึ้นจริงและบ่อย: วัดจาก 5 รันเต็ม ได้พร 4-9 อย่างต่อรัน และเกือบทุกรัน
// มีพรซ้ำอย่างน้อยหนึ่งคู่ (เช่น "ผีป้องกัน" สองใบ) — รายการที่ขึ้นชื่อเดียวกัน
// สองบรรทัดอ่านเหมือนบั๊ก ทั้งที่มันคือของจริงสองชิ้น

import type { BlessingDef } from '../types';

export type BlessingGroup = { blessing: BlessingDef; count: number };

export function groupBlessings(list: BlessingDef[]): BlessingGroup[] {
  const m = new Map<string, BlessingGroup>();
  for (const b of list) {
    const key = b.id ?? b.name ?? '?';
    const rec = m.get(key) ?? { blessing: b, count: 0 };
    rec.count += 1;
    m.set(key, rec);
  }
  return [...m.values()].sort((x, y) =>
    (x.blessing.name ?? x.blessing.id ?? '').localeCompare(y.blessing.name ?? y.blessing.id ?? '')
  );
}
