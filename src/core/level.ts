// Level/XP — the card offers for a level-up and the blessing roller used by events.
import type { RNG } from './rng';
import { int, next, shuffle } from './rng';
import type { GameState, CardData, BlessingDef } from './types';
import { BY_RARITY, BLESSINGS_BY_RARITY } from './pack';

/**
 * สุ่มการ์ดรางวัล 3 ใบ — กรองเฉพาะการ์ดของคลาสที่เล่นอยู่
 * ถ้าไม่กรอง นักรบจะได้การ์ดหมอผีเป็นรางวัล ซึ่งทำให้ตัวตนของคลาสจางหมด
 */
export function rollThreeCards(rng: RNG, playerLevel = 1, classId?: import('./classes').ClassId,milestoneLevel=0) {
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
    const forClass = (list: CardData[]) => list.filter(c => (c.unlockAt??0)<=milestoneLevel&&require('./pack').fitsClass(c, classId));
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
/**
 * `tier` = nights cleared across all runs; แพนโดรา blessings with `unlock` <= tier join the pool
 * (undefined: none, e.g. tests and old callers).
 */
export function rollTwoBlessings(rng: RNG, owned: string[] = [], count = 2, tier?: number) {
  let r = rng;
  const pool: BlessingDef[] = [
    ...BLESSINGS_BY_RARITY.Common, ...BLESSINGS_BY_RARITY.Uncommon,
    ...BLESSINGS_BY_RARITY.Rare, ...BLESSINGS_BY_RARITY.Legendary,
    ...(tier == null ? [] : require('./pack').PANDORA_BLESSINGS.filter((b: BlessingDef) => (b.unlock ?? 0) <= tier)),
  ].filter(b => !owned.includes(b.id));
  // A bargain is not offered if an owned bargain already changes the same rule (no stacking).
  const ownedDefs = owned.map(id => require('./pack').blessingById(id) ?? require('./events/story').EVENT_PACTS[id]).filter(Boolean);
  const offerable = pool.filter(b => !require('./cards/passives').bargainConflicts(ownedDefs, b));

  const sh = shuffle(r, offerable); r = sh.rng;
  return { rng: r, list: sh.array.slice(0, Math.min(count, sh.array.length)).map(b => ({ ...b })) };
}
