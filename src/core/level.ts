// Level/XP — level-up reward choices (interim until the phase-4 redesign)
import type { RNG } from './rng';
import { int, next, shuffle } from './rng';
import type { GameState, CardData, BlessingDef } from './types';
import { BY_RARITY, BLESSINGS_BY_RARITY } from './pack';

export type LevelBucket = 'max_hp' | 'blessing' | 'remove' | 'upgrade' | 'gold' | 'equipment_slot' | 'gold_skip';

export type LevelChoice = { optionA: LevelBucket; optionB: LevelBucket; contextDescription?: string };

/** Energy and hand-size choices are gone: draw and Action points are bought in shops. */
const CHOICE_PAIRS: Array<[LevelBucket, LevelBucket]> = [
  ['max_hp', 'upgrade'], ['blessing', 'gold_skip'], ['remove', 'upgrade'],
  ['max_hp', 'equipment_slot'], ['upgrade', 'gold_skip'], ['blessing', 'max_hp'],
];

export function rollLevelUpChoice(rng: RNG, _s: GameState): { rng: RNG; choice: LevelChoice } {
  const roll = int(rng, 0, CHOICE_PAIRS.length - 1), order = int(roll.rng, 0, 1);
  const [a, b] = CHOICE_PAIRS[roll.value];
  return { rng: order.rng, choice: { optionA: order.value ? a : b, optionB: order.value ? b : a } };
}

/**
 * สุ่มการ์ดรางวัล 3 ใบ — กรองเฉพาะการ์ดของคลาสที่เล่นอยู่
 * ถ้าไม่กรอง นักรบจะได้การ์ดหมอผีเป็นรางวัล ซึ่งทำให้ตัวตนของคลาสจางหมด
 */
export function rollThreeCards(rng: RNG, playerLevel = 1, classId?: import('./classes').ClassId) {
  let r = rng;
  
  // ปรับน้ำหนักตาม level
  let commonWeight = 100;
  let uncommonWeight = 0;
  let rareWeight = 0;
  let legendaryWeight = 0;
  
  if (playerLevel >= 1 && playerLevel <= 3) {
    // Level 1-3: Common only
    commonWeight = 100;
  } else if (playerLevel >= 4 && playerLevel <= 6) {
    // Level 4-6: 70% Common, 30% Uncommon
    commonWeight = 70;
    uncommonWeight = 30;
  } else {
    // Level 7+: 50% Common, 40% Uncommon, 10% Rare, 0.5% Legendary
    commonWeight = 50;
    uncommonWeight = 40;
    rareWeight = 10;
    legendaryWeight = 0.5;
  }
  
  const cards: CardData[] = [];
  
  for (let i = 0; i < 3; i++) {
    // ใช้ rng ที่ร้อยเข้ามาอยู่แล้ว ไม่ใช่ Math.random —
    // การ์ดรางวัลตอนเลเวลอัปต้องซ้ำได้เมื่อใช้ seed เดิม
    const rarityRoll = next(r);
    r = rarityRoll.rng;
    const roll = rarityRoll.value * 100;
    const forClass = (list: CardData[]) => list.filter(c => !c.class || c.class === classId);
    const POOL = {
      Common:    forClass(BY_RARITY.Common),
      Uncommon:  forClass(BY_RARITY.Uncommon),
      Rare:      forClass(BY_RARITY.Rare),
      Legendary: forClass(BY_RARITY.Legendary),
    };

    let selectedPool: CardData[] = POOL.Common;
    
    if (roll < legendaryWeight && POOL.Legendary.length > 0) {
      selectedPool = POOL.Legendary;
    } else if (roll < legendaryWeight + rareWeight && POOL.Rare.length > 0) {
      selectedPool = POOL.Rare;
    } else if (roll < legendaryWeight + rareWeight + uncommonWeight && POOL.Uncommon.length > 0) {
      selectedPool = POOL.Uncommon;
    }
    
    if (selectedPool.length > 0) {
      const cardRoll = int(r, 0, selectedPool.length - 1);
      r = cardRoll.rng;
      cards.push({ ...selectedPool[cardRoll.value] });
    }
  }
  
  return { rng: r, list: cards };
}

/**
 * สุ่มพรให้เลือกสองอย่าง — **ไม่เสนอพรที่ถืออยู่แล้ว**
 *
 * เดิมสุ่มจากคลังทั้ง 12 อย่างโดยไม่สนว่าถืออะไรอยู่ ผลคือรันหนึ่งได้พรซ้ำเป็น
 * เรื่องปกติ (วัดจริง 5 รัน เกือบทุกรันมีอย่างน้อยหนึ่งคู่) และ **พรซ้ำผลซ้อนกัน**
 * เพราะ blessingRuntime วนทำงานทีละรายการในลิสต์ — "ผีป้องกัน" สองใบได้ Block 4
 * ต่อการ์ดโจมตี ซึ่งไม่มีใครออกแบบไว้ มันแค่หลุดมา
 *
 * ที่แก้ตรงนี้เพราะรางวัลที่ได้มาแล้วไม่มีผลคือรางวัลที่หายไปเฉยๆ —
 * กันตอนแจกดีกว่ากันตอนใช้
 *
 * @param owned id ของพรที่ถืออยู่แล้ว
 */
export function rollTwoBlessings(rng: RNG, owned: string[] = []) {
  let r = rng;
  const pool: BlessingDef[] = [
    ...BLESSINGS_BY_RARITY.Common, ...BLESSINGS_BY_RARITY.Uncommon,
    ...BLESSINGS_BY_RARITY.Rare, ...BLESSINGS_BY_RARITY.Legendary,
  ].filter(b => !owned.includes(b.id));

  const sh = shuffle(r, pool); r = sh.rng;
  return { rng: r, list: sh.array.slice(0, Math.min(2, sh.array.length)).map(b => ({ ...b })) };
}

// ===== Choice Description System =====
export function getBucketDisplayInfo(bucket: LevelBucket): { name: string; description: string; icon: string } {
  switch (bucket) {
    case 'max_hp': return { name: 'ชีวิตสูงสุด +8', description: 'อยู่รอดได้นานขึ้น', icon: '❤️' };
    case 'blessing': return { name: 'เลือกพร', description: 'พลังติดตัวถาวร', icon: '✨' };
    case 'remove': return { name: 'สละการ์ด', description: 'ลบการ์ดหนึ่งใบฟรี', icon: '🗑️' };
    case 'upgrade': return { name: 'ปลุกเสกการ์ด', description: 'เพิ่มดาวการ์ดหนึ่งใบฟรี', icon: '⬆️' };
    case 'equipment_slot': return { name: 'ช่องอุปกรณ์ +1', description: 'ใส่อุปกรณ์พร้อมกันได้มากขึ้น', icon: '⚔️' };
    case 'gold_skip': return { name: 'รับ 50 เบี้ย', description: 'เก็บไว้ซื้อของ', icon: '💰' };
    case 'gold': return { name: 'รับ 25 เบี้ย', description: 'เก็บไว้ซื้อของ', icon: '🪙' };
  }
}
