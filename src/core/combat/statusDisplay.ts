// src/core/combat/statusDisplay.ts — กติกาการจัดเรียงสถานะสำหรับแสดงผล
//
// อยู่ใน core ไม่ใช่ในคอมโพเนนต์ เพราะเป็นกฎที่เทสต์ได้และใช้ร่วมกันสองฝั่ง
// (แถบของผู้เล่นกับของศัตรูต้องเรียงเหมือนกัน ไม่งั้นต้องเรียนรู้สองแบบ)

import type { StatusEffect } from '../types_extended';
import type { StatusEffectType } from './status-effects/types';
import { getStatusEffectDefinition } from './status-effects/registry';

/**
 * สถานะนี้เป็นผลลบไหม — อ่านจากแท็กในทะเบียน ไม่ใช่เดาจากชื่อ
 *
 * หมายเหตุ: มี `StatusEffectType` อยู่สองชุดในโปรเจกต์ที่ไม่ตรงกัน — ชุดเก่าใน
 * `types_extended.ts` ประกาศไว้ 26 ชนิด (sleep, bleed, doom, …) แต่ทะเบียนจริง
 * มี 13 ชนิด สถานะที่หาไม่เจอจึงเป็นไปได้ ตรงนี้เลยต้องมีทางออกเสมอ
 */
export function isDebuff(e: StatusEffect): boolean {
  const def = getStatusEffectDefinition(e.id as StatusEffectType);
  // ไม่รู้จัก = ถือว่าเป็นผลลบไว้ก่อน เตือนเกินดีกว่าปล่อยให้โดนโดยไม่รู้ตัว
  if (!def) return true;
  if (def.tags?.includes('debuff')) return true;
  if (def.tags?.includes('buff')) return false;
  return true;
}

/**
 * ดีบัฟก่อน แล้วค่อยบัฟ ในกลุ่มเดียวกันเรียงตามเทิร์นที่เหลือน้อยไปมาก
 *
 * เหตุผล: สิ่งที่กำลังทำร้ายเราสำคัญกว่าสิ่งที่ช่วยเรา และของที่ใกล้หมดอายุ
 * คือของที่ต้องตัดสินใจเรื่องมันเทิร์นนี้
 */
export function sortForDisplay(effects: StatusEffect[]): StatusEffect[] {
  return [...effects].sort((a, b) => {
    const ad = isDebuff(a) ? 0 : 1;
    const bd = isDebuff(b) ? 0 : 1;
    if (ad !== bd) return ad - bd;
    if (a.duration !== b.duration) return a.duration - b.duration;
    return (a.name ?? a.id).localeCompare(b.name ?? b.id);
  });
}
