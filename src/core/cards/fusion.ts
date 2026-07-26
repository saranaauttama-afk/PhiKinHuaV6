// src/core/cards/fusion.ts — ผสานการ์ดสองใบเป็นใบเดียว
//
// ต่างจาก "ปลุกเสก" (shop_upgrade) ที่ทำให้การ์ดใบเดิมแรงขึ้นเฉยๆ
// การผสานคือเอาสองใบมารวมเป็นใบเดียว → **เด็คบางลงหนึ่งใบ** และจ่ายพลังงาน
// ครั้งเดียวได้ผลของทั้งสองใบ
//
// นั่นคือหัวใจของมัน: เด็คที่ดีขึ้นเพราะ "เล็กลงและแน่นขึ้น" ไม่ใช่เพราะใหญ่ขึ้น
// แลกกับความยืดหยุ่นที่หายไป — เดิมเลือกเล่นทีละใบตามสถานการณ์ได้ พอผสานแล้ว
// ต้องเล่นทั้งสองอย่างพร้อมกันเสมอ

import type { CardData, Rarity } from '../types';

/** ค่าร่ายของสองใบรวมกันต้องไม่เกินนี้ ไม่งั้นเอาระเบิดสองลูกมารวมเป็นลูกเดียวได้ */
export const FUSION_MAX_TOTAL_COST = 3;

/** แท็กที่ติดกับการ์ดที่เกิดจากการผสาน — ใช้กันผสานซ้อนชั้น */
export const FUSED_TAG = 'fused';

const RARITY_ORDER: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Legendary'];

/** ฟิลด์ตัวเลขที่บวกกันตรงๆ ได้ */
const ADDITIVE = ['dmg', 'block', 'draw', 'energyGain', 'heal'] as const;

export type FusionRecipe = {
  /** id ของการ์ดสองใบที่เข้าคู่กัน (ไม่สนลำดับ) */
  pair: [string, string];
  id: string;
  name: string;
  desc: string;
};

const RECIPES: FusionRecipe[] = require('../../data/packs/base/fusion_recipes.json');

export function isFused(c: CardData): boolean {
  return (c.tags ?? []).includes(FUSED_TAG);
}

/** สูตรที่ตรงกับคู่นี้ (ไม่สนลำดับ) */
export function findRecipe(a: CardData, b: CardData): FusionRecipe | undefined {
  return RECIPES.find(r =>
    (r.pair[0] === a.id && r.pair[1] === b.id) ||
    (r.pair[0] === b.id && r.pair[1] === a.id)
  );
}

export type FusionCheck = { ok: true } | { ok: false; reason: string };

/**
 * ผสานคู่นี้ได้ไหม
 *
 * เงื่อนไขที่ดูเหมือนจุกจิกแต่ละข้อกันปัญหาคนละอย่าง — ดูคอมเมนต์กำกับ
 */
export function canFuse(a: CardData | undefined, b: CardData | undefined): FusionCheck {
  if (!a || !b) return { ok: false, reason: 'ต้องเลือกการ์ดสองใบ' };

  // ใบเดียวกันเป๊ะ (instance เดียวกัน) ผสานกับตัวเองไม่ได้
  if (a === b || (a.instanceId && a.instanceId === b.instanceId)) {
    return { ok: false, reason: 'ต้องเป็นการ์ดคนละใบ' };
  }

  // เครื่องรางไม่ได้อยู่ในสำรับตอนสู้ ผสานแล้วไม่มีความหมาย
  if (a.type === 'equipment' || b.type === 'equipment') {
    return { ok: false, reason: 'เครื่องรางผสานไม่ได้' };
  }

  // กันสโนว์บอล: ผสานได้ชั้นเดียว ไม่งั้นเอาผลผสานมาผสานต่อไปเรื่อยๆ
  if (isFused(a) || isFused(b)) {
    return { ok: false, reason: 'การ์ดที่ผสานแล้วผสานซ้ำไม่ได้' };
  }

  // runtime เรียกผีได้ใบละตัว ถ้าผสานสองใบที่เรียกผี จะมีใบหนึ่งหายไปเงียบๆ
  if ((a as any).summonMinion && (b as any).summonMinion) {
    return { ok: false, reason: 'การ์ดเรียกผีสองใบผสานกันไม่ได้' };
  }

  const total = (a.cost ?? 0) + (b.cost ?? 0);
  if (total > FUSION_MAX_TOTAL_COST) {
    return { ok: false, reason: `ค่าร่ายรวมกันต้องไม่เกิน ${FUSION_MAX_TOTAL_COST} (ตอนนี้ ${total})` };
  }

  return { ok: true };
}

function higherRarity(a?: Rarity, b?: Rarity): Rarity {
  const ia = RARITY_ORDER.indexOf(a ?? 'Common');
  const ib = RARITY_ORDER.indexOf(b ?? 'Common');
  return RARITY_ORDER[Math.max(ia, ib)];
}

/** สรุปว่าการ์ดใบนี้ทำอะไรบ้าง — ใช้เป็นคำอธิบายของการ์ดที่ผสานเอง */
function describeEffects(c: CardData): string {
  const parts: string[] = [];
  if (c.dmg)        parts.push(`โจมตี ${c.dmg}`);
  if (c.block)      parts.push(`ป้องกัน ${c.block}`);
  if (c.heal)       parts.push(`ฟื้น ${c.heal} HP`);
  if (c.draw)       parts.push(`จั่ว ${c.draw} ใบ`);
  if (c.energyGain) parts.push(`ได้พลังงาน +${c.energyGain}`);
  if ((c as any).summonMinion) parts.push('เรียกผีช่วย');
  return parts.join(' · ') || 'ไม่มีผลโดยตรง';
}

/**
 * ผสานสองใบเป็นใบใหม่
 *
 * ผู้เรียกต้องเช็ค `canFuse` มาก่อน — ที่นี่ไม่เช็คซ้ำ เพื่อให้ฟังก์ชันนี้เป็น
 * การแปลงข้อมูลล้วนๆ ทดสอบง่าย
 */
export function fuseCards(a: CardData, b: CardData): CardData {
  const recipe = findRecipe(a, b);

  const out: CardData = {
    id: recipe?.id ?? `fused_${a.id}__${b.id}`,
    name: recipe?.name ?? `${a.name}·${b.name}`,
    // ค่าร่ายเอาใบที่แพงกว่า ไม่ใช่บวกกัน — นี่คือ "กำไร" ของการผสาน
    cost: Math.max(a.cost ?? 0, b.cost ?? 0),
    type: a.type === b.type ? a.type : (((a.dmg ?? 0) + (b.dmg ?? 0)) > 0 ? 'attack' : 'skill'),
    rarity: higherRarity(a.rarity, b.rarity),
  };

  for (const k of ADDITIVE) {
    const sum = (a[k] ?? 0) + (b[k] ?? 0);
    if (sum > 0) out[k] = sum;
  }

  // ข้อเสียไม่หายไปกับการผสาน — ใบไหน exhaust ผลลัพธ์ก็ exhaust
  if ((a as any).exhaust || (b as any).exhaust) (out as any).exhaust = true;

  // เรียกผีได้ใบเดียวอยู่แล้ว (canFuse กันเคสสองใบไว้)
  const summon = (a as any).summonMinion ?? (b as any).summonMinion;
  if (summon) {
    (out as any).summonMinion = summon;
    const target = (a as any).summonMinion
      ? (a as any).minionTarget
      : (b as any).minionTarget;
    if (target) (out as any).minionTarget = target;
  }

  // แท็กรวมกัน + ติด `fused` ไว้กันผสานซ้อน
  out.tags = [...new Set([...(a.tags ?? []), ...(b.tags ?? []), FUSED_TAG])];

  out.desc = recipe?.desc ?? `ผสานจาก ${a.name} กับ ${b.name} — ${describeEffects(out)}`;

  return out;
}
