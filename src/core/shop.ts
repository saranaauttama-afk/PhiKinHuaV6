// src/core/shop.ts
import type { CardData, Rarity, ShopItem } from './types';
import type { RNG } from './rng';
import { int, shuffle } from './rng';

// โหลดพูลการ์ดจากแพ็ค base (ให้ Metro bundle ได้)
// ต้องรวมการ์ดของคลาสอื่นด้วย ไม่งั้นร้านจะมีแต่การ์ดหมอผีสำหรับทุกคลาส
const cardsBase: CardData[] = [
  ...require('../data/packs/base/cards.json'),
  ...require('../data/packs/base/class_cards.json'),
];

// จัดกลุ่มตาม Rarity จาก cards.json (อนุญาตเฉพาะใบที่ขายได้)
function buildPools() {
  const by: Record<Rarity, CardData[]> = {
    Common: [],
    Uncommon: [],
    Rare: [],
    Legendary: [],
  };
  const pool = (Array.isArray(cardsBase) ? cardsBase : []).filter(
    (c: any) => c && (c.inShop === true || typeof c.cost === 'number')
  );
  for (const c of pool) {
    const rar: Rarity = (c.rarity as Rarity) ?? 'Common';
    by[rar].push(c);
  }
  return by;
}

// ประเมินราคาแบบง่าย + สเกลตาม act (คง deterministic)
function priceForCard(c: CardData, act = 1): number {
  let price =
    10 +
    (c.cost ?? 0) * 20 +
    (c.dmg ?? 0) * 2 +
    (c.block ?? 0) * 2 +
    (c.draw ?? 0) * 10 +
    (c.energyGain ?? 0) * 25;

  if (c.rarity === 'Uncommon') price += 20;
  if (c.rarity === 'Rare') price += 50;
  if (c.rarity === 'Legendary') price += 120;

  // ปรับขึ้นเล็กน้อยตาม act
  price = Math.round(price * (1 + 0.05 * (act - 1)));
  return Math.max(10, price);
}

// สุ่มสต็อกร้านแบบ no-replacement ด้วยน้ำหนักตาม Rarity
export function rollShopStock(
  rng: RNG,
  count = 6,
  act = 1,
  /** แท็กคลาสของผู้เล่น — ร้านจะขายเฉพาะการ์ดของคลาสนั้น */
  classTag?: string
): { rng: RNG; items: ShopItem[] } {
  let r = rng;
  const out: ShopItem[] = [];
  const taken = new Set<string>();

  // น้ำหนักเลือก Rarity
  const weights: Record<Rarity, number> = { Common: 55, Uncommon: 30, Rare: 13, Legendary: 2 };
  const total = weights.Common + weights.Uncommon + weights.Rare + weights.Legendary;

  // พูลตาม rarity (อัปเดตครั้งเดียวตอนเรียก)
  const ALL_POOLS = buildPools();

  // ร้านขายเฉพาะการ์ดของคลาสที่เล่นอยู่ ไม่งั้นตัวตนของคลาสจะจางหมด
  //
  // กรองเข้มทุก rarity — rarity ไหนไม่มีการ์ดของคลาสนี้ก็ปล่อยว่างไว้
  // แล้วให้ pickFromRarity ไล่ไปหยิบจาก rarity อื่นเอง (รองรับพูลว่างอยู่แล้ว)
  // ถอยไปใช้พูลรวมเฉพาะกรณีที่คลาสนั้นไม่มีการ์ดเลยสักใบ
  const byClass = (list: CardData[]) =>
    list.filter(c => (c.tags ?? []).includes(classTag!));

  const filteredPools: typeof ALL_POOLS = classTag
    ? {
        Common:    byClass(ALL_POOLS.Common),
        Uncommon:  byClass(ALL_POOLS.Uncommon),
        Rare:      byClass(ALL_POOLS.Rare),
        Legendary: byClass(ALL_POOLS.Legendary),
      }
    : ALL_POOLS;

  const hasAnyClassCard = Object.values(filteredPools).some(list => list.length > 0);
  const BY_RARITY = hasAnyClassCard ? filteredPools : ALL_POOLS;

  // helper: หยิบการ์ดใบหนึ่งจากพูลตาม rarity ถ้ายังเหลือ
  const pickFromRarity = (rar: Rarity): CardData | undefined => {
    const pool = BY_RARITY[rar].filter((c) => !taken.has(c.id));
    if (pool.length === 0) return undefined;
    const pick = int(r, 0, pool.length - 1);
    r = pick.rng;
    return pool[pick.value];
  };

  for (let i = 0; i < count; i++) {
    // เลือก rarity ตามน้ำหนัก
    const roll = int(r, 1, total); r = roll.rng;
    let v = roll.value;
    let rar: Rarity = 'Common';
    if ((v -= weights.Common) <= 0) rar = 'Common';
    else if ((v -= weights.Uncommon) <= 0) rar = 'Uncommon';
    else if ((v -= weights.Rare) <= 0) rar = 'Rare';
    else rar = 'Legendary';

    // พยายามหยิบจาก rarity ที่สุ่มได้ก่อน
    let card = pickFromRarity(rar);

    // ถ้าหมวดนั้นหมด ลอง fallback ไปหมวดอื่นที่ยังเหลือ
    if (!card) {
      card = pickFromRarity('Uncommon') ?? pickFromRarity('Common') ?? pickFromRarity('Rare') ?? pickFromRarity('Legendary');
    }
    if (!card) break; // การ์ดหมดจริง ๆ

    taken.add(card.id);
    out.push({ card, price: priceForCard(card, act) });
  }

  // สุ่มเรียงรายการออก (deterministic ผ่าน RNG)
  const sh = shuffle(r, out);
  r = sh.rng;

  return { rng: r, items: sh.array };
}
