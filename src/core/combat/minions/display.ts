// src/core/combat/minions/display.ts — กติกาการแสดงผลผีที่เรียกมา
//
// อยู่ใน core เพราะเป็นกฎที่เทสต์ได้ และอิงกับทะเบียนผีจริง ไม่ใช่ลิสต์ที่ก๊อปไว้

import { THAI_MINIONS } from './thai-minions';
import type { MinionData } from '../../types_extended';

/**
 * id ของแม่แบบ จากตัวที่เรียกมาจริง
 *
 * `summonMinion` ต่อท้าย id ให้ไม่ซ้ำ (`kuman_spirit` → `kuman_spirit_abc_1`)
 * ช่องรูปกับข้อมูลอ้างจากแม่แบบ จึงต้องตัดส่วนที่ต่อท้ายออกก่อน
 * เทียบกับทะเบียนจริงแทนการเดาจากขีดล่าง เพราะ id แม่แบบเองก็มีขีดล่างอยู่แล้ว
 * (`ancient_warrior_spirit` มีสามท่อน)
 */
export function minionTemplateId(id: string): string {
  const parts = id.split('_');
  for (let cut = parts.length; cut >= 1; cut--) {
    const candidate = parts.slice(0, cut).join('_');
    if (candidate in THAI_MINIONS) return candidate;
  }
  return id;
}

/** ตัวที่ติดธง invisible เคยเป็น "สถานะปลอม" ไม่ใช่ผี — ไม่ควรขึ้นแถวผี */
export function visibleMinions(list?: MinionData[]): MinionData[] {
  return (list ?? []).filter(m => !m.invisible);
}

/** สรุปว่าผีตัวนี้ทำอะไรให้ แบบบรรทัดเดียว */
export function minionSummary(m: MinionData): string {
  return m.abilities.map(a => a.description).join(' · ');
}
