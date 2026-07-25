// src/core/pack.ts
import type { CardData, Rarity, EnemyState, BlessingDef, EquipmentData } from './types';
import type { RNG } from './rng';
import { int } from './rng';

// เปลี่ยนแพ็กโดยแก้ค่าเดียว (อนาคต: อ่านจาก config ก็ได้)
export const ACTIVE_PACK = 'base' as const;

// --- JSON imports (ต้องเปิด resolveJsonModule ใน tsconfig)
import cardsJson from '../data/packs/base/cards.json';
import classCardsJson from '../data/packs/base/class_cards.json';
// import enemiesJson from '../data/packs/base/enemies.json'; // เปลี่ยนใช้ระบบไทยใหม่
import blessingsJson from '../data/packs/base/blessings.json';
import EQUIP_LIST from '../data/packs/base/equipment.json';

// === ใช้ระบบศัตรูไทยใหม่แทน ===
import { THAI_GHOST_POOLS, getMonsterById, getRandomMonsterFromTier } from './monsters/thai-ghosts';
import type { ThaiGhostData } from './monsters/thai-ghosts';

type CardJson = CardData & { starter?: number; inRewards?: boolean; inShop?: boolean };
type EnemyJson = EnemyState & { tier: 'normal' | 'elite' | 'boss' };
type BlessingMeta = { id: string; name: string; rarity: Rarity; desc?: string; oncePerTurn?: boolean };

// การ์ดของคลาสอื่นอยู่คนละไฟล์ แต่รวมเป็นคลังเดียวกัน
// (การ์ดใน cards.json ทั้งหมดติดแท็ก shaman อยู่แล้ว)
const CARD_LIST: CardJson[] = [...(cardsJson as any), ...(classCardsJson as any)];
// const ENEMY_LIST: EnemyJson[] = enemiesJson as any; // ใช้ระบบไทยแทน
const BLESSING_LIST: BlessingMeta[] = blessingsJson as any;

// การ์ดทั้งหมด (ลอกเฉพาะฟิลด์ runtime)
export const ALL_CARDS: CardData[] = CARD_LIST.map(({ starter, inRewards, inShop, ...c }) => c);

// Function to get card by ID
export function cardById(id: string): CardData | undefined {
  return ALL_CARDS.find(card => card.id === id);
}

// เด็คเริ่มจากค่า "starter" ใน JSON (จำนวนซ้ำ)
export const START_DECK: CardData[] = CARD_LIST.flatMap(c =>
  new Array(c.starter ?? 0).fill(0).map(() => {
    const { starter, inRewards, inShop, ...rest } = c;
    return { ...rest } as CardData;
  })
);

// พูลตาม rarity (ใช้ทำ rewards/shop)
export const BY_RARITY: Record<Rarity, CardData[]> = {
  Common: ALL_CARDS.filter(c => c.rarity === 'Common' && (CARD_LIST.find(x => x.id === c.id)?.inRewards ?? true)),
  Uncommon: ALL_CARDS.filter(c => c.rarity === 'Uncommon' && (CARD_LIST.find(x => x.id === c.id)?.inRewards ?? true)),
  Rare: ALL_CARDS.filter(c => c.rarity === 'Rare' && (CARD_LIST.find(x => x.id === c.id)?.inRewards ?? true)),
  Legendary: ALL_CARDS.filter(c => c.rarity === 'Legendary' && (CARD_LIST.find(x => x.id === c.id)?.inRewards ?? true)),
};

// สุ่มศัตรูไทยตาม tier ด้วย RNG (deterministic) - ใช้ระบบใหม่
export function pickEnemy(rng: RNG, tier: 'normal' | 'elite' | 'boss'): { rng: RNG; enemy: EnemyState } {
  let r = rng;
  
  // แปลง tier เป็นรูปแบบใหม่
  let ghostTier: keyof typeof THAI_GHOST_POOLS = 'T1';
  if (tier === 'elite') {
    ghostTier = 'Elite';
  } else if (tier === 'boss') {
    ghostTier = 'BossFinal'; // default boss
  } else {
    ghostTier = 'T1'; // default normal
  }
  
  const pool = THAI_GHOST_POOLS[ghostTier];
  const roll = int(r, 0, pool.length - 1); 
  r = roll.rng;
  const thaiGhost = pool[roll.value];
  
  // สร้าง EnemyState แบบเรียบง่าย
  const enemy: EnemyState = {
    id: thaiGhost.id,
    name: thaiGhost.name,
    hp: thaiGhost.hp,
    maxHp: thaiGhost.hp,
    dmg: Math.floor(thaiGhost.hp / 5), // เรียบง่าย: dmg = hp/5
    block: 0,
    ai: {
      cycle: ['claw', 'guard'], // default AI pattern
      index: 0
    },
    intentCardId: 'claw'
  };
  
  return { rng: r, enemy };
}

// ----- Blessings (metadata จาก JSON + mapping id → behavior ในโค้ด)
export function materializeBlessing(id: string): BlessingDef | undefined {
  const meta = BLESSING_LIST.find(b => b.id === id);
  if (!meta) return undefined;
  switch (id) {
    case 'bl_energy_first':
      return { ...meta, oncePerTurn: true, on_card_played: (tc) => { tc.state.player.energy += 1; } };
    case 'bl_start_block':
      return { ...meta, on_turn_start: (tc) => { tc.state.player.block += 3; } };
    case 'bl_attack_block':
      return { ...meta, on_card_played: { tag: 'attack', once_per_turn: false, effects: [(tc) => { tc.state.player.block += 2; }] } };
    case 'bl_end_heal':
      return { ...meta, on_turn_end: (tc) => { tc.state.player.hp = Math.min(tc.state.player.maxHp, tc.state.player.hp + 1); } };
    case 'bl_big_energy_first':
      return { ...meta, oncePerTurn: true, on_card_played: (tc) => { tc.state.player.energy += 2; } };
    default:
      return { ...meta }; // meta only (ไม่มี behavior)
  }
}

export const BLESSING_POOL: BlessingDef[] =
  BLESSING_LIST.map(b => materializeBlessing(b.id)).filter((x): x is BlessingDef => !!x);

export const BLESSINGS_BY_RARITY: Record<Rarity, BlessingDef[]> = {
  Common: BLESSING_POOL.filter(b => b.rarity === 'Common'),
  Uncommon: BLESSING_POOL.filter(b => b.rarity === 'Uncommon'),
  Rare: BLESSING_POOL.filter(b => b.rarity === 'Rare'),
  Legendary: BLESSING_POOL.filter(b => b.rarity === 'Legendary'),
};

// === Equipment (base pack) ===
// NOTE: path นี้สัมพันธ์กับไฟล์จริงใน repo: src/data/packs/base/equipment.json
// pack.ts อยู่ใต้ src/core → ขึ้นหนึ่งชั้นแล้วค่อยเข้า data
// หากโปรเจกต์คุณตั้ง resolve ต่างไป ให้ปรับ path ให้ตรง
// @ts-ignore

const EQUIPMENT_BY_ID: Record<string, EquipmentData> =
  Object.fromEntries((EQUIP_LIST as EquipmentData[]).map(e => [e.id, e]));

export function getEquipmentById(id: string): EquipmentData | undefined {
  const e = EQUIPMENT_BY_ID[id];
  return e ? JSON.parse(JSON.stringify(e)) : undefined;
}

export function listAllEquipment(): EquipmentData[] {
  return JSON.parse(JSON.stringify(EQUIP_LIST as EquipmentData[]));
}