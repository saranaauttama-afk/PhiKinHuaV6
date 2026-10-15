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

/**
 * What a status does right now, in numbers, from the side that carries it (owner playtest
 * 15 Oct 2026: "statuses everywhere and I can't tell what I gain or lose"). One line of effect,
 * one line of how long it lasts. Unknown ids fall back to the registry text.
 */
export function statusDetail(e: StatusEffect, side: 'player' | 'enemy'): string {
  const n = e.stacks ?? 1, me = side === 'player' ? 'เรา' : 'ผี', foe = side === 'player' ? 'ผี' : 'เรา';
  const G = require('../balance/notfm');
  const what: Record<string, string> = {
    strength: `ทุกหมัดของ${me} +${n}`,
    weakness: `ดาเมจที่${me}ตีออกไป −25% (ปัดลง)`,
    vulnerable: `${me}โดนตี ดาเมจ ×1.5`,
    poison: `ท้ายเทิร์น${me}เสียเลือด ${n} (ทะลุเกราะ)`,
    curse: `${me}โดนดาเมจทุกครั้ง +${n}`,
    rage: `ทุกหมัดของผี +${n} และเพิ่มทุกเทิร์นที่ไฟต์ยืด`,
    dance: `ทุกหมัดของผีเทิร์นนี้ +${n} หมดเมื่อจบเทิร์นผี`,
    dodge: `หลบหมัดถัดไปได้ ${n} ครั้ง (ไม่หลบพิษ)`,
    thorns: `โดนตีแต่ละครั้ง สะท้อนกลับใส่${foe} ${n}`,
    regeneration: `ต้นเทิร์น${me}ฟื้น ${n}`,
    bruise: `ท่าหนักของนักมวยกินช้ำทั้งหมด: +${n} × ${G.FIGHTER_RULES.heavyPerBruise} ดาเมจ`,
    yant: `ยันต์ ${n}/${G.WATER_RULES.sealAt} · ครบแล้วผนึกการ์ดที่ผีถือไว้ 1 ใบ (ไม่มีการ์ด ผีมึนแทน) · ปลุกยันต์กินทั้งหมดได้`,
    stun: side === 'enemy' ? 'การ์ดโจมตีใบแรกของผีเทิร์นหน้าถูกยกเลิก' : `เทิร์นหน้าแต้ม −${G.GHOST_MECHANICS.stunApLoss}`,
    fear: 'ต้นเทิร์นแต้ม −1',
    entangle: `${me}เล่นการ์ดโจมตีไม่ได้`,
    corruption: `การ์ดของ${me}แพงขึ้น ${n} แต้ม/มานา`,
    draw_reduction: `จั่วต้นเทิร์นน้อยลง ${n} ใบ`,
    energy_boost: `ต้นเทิร์นได้แต้ม +${n}`,
  };
  const def = getStatusEffectDefinition(e.id as StatusEffectType);
  const effect = what[e.id] ?? def?.description ?? e.description ?? '';
  const last = e.duration >= 99 ? 'ตลอดไฟต์' : `เหลือ ${e.duration} เทิร์น`;
  return `${effect}\n${last}`;
}
