// src/core/monsters/thai-ghosts.ts - ระบบผีไทยแบบใหม่ตาม Game Spec

import { int, next, type RNG } from '../rng';
import {NIGHT_BOSSES,ULTIMATE_BOSS} from '../campaign/bosses';

export interface ThaiGhostData {
  id: string;
  name: string;
  tier: 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'Elite' | 'BossMid' | 'BossFinal' | 'SecretBoss';
  hp: number;
  description?: string;
}

// ===== Monster Pools ตาม Game Spec =====

export const THAI_GHOST_POOLS = {
  // Tier 1: Early game (Fight 1-2)
  T1: [
    {
      id: 'phi-krasue',
      name: 'ผีกระสือ',
      tier: 'T1' as const,
      hp: 20,
      description: 'น้ำลายกระสือทำให้ติดพิษ 2 นาน 2 เทิร์น — การตั้งรับกันพิษไม่ได้'
    },
    {
      id: 'phi-pop',
      name: 'ผีปอบ',
      tier: 'T1' as const,
      hp: 22,
      description: 'กัดกินแล้วฟื้นชีวิต 2 — ต้องเร่งโจมตีให้มากกว่าที่มันฟื้น'
    },
    {
      id: 'nang-tanee',
      name: 'นางตานี',
      tier: 'T1' as const,
      hp: 25,
      description: 'รากกล้วยคุ้มกายและทำให้โจมตีเบาลง 25% นาน 2 เทิร์น'
    }
  ],

  // Tier 2: Building complexity (Fight 1-2, 3-4, 5-6)
  T2: [
    {
      id: 'phi-nang-ram',
      name: 'ผีนางรำ',
      tier: 'T2' as const,
      hp: 28,
      description: 'รำสองจังหวะ โจมตีครั้งละ 4 สองครั้ง — อย่าคิดว่าจบในหมัดเดียว'
    },
    {
      id: 'phi-pong-kang',
      name: 'ผีโป่งค่าง',
      tier: 'T2' as const,
      hp: 32,
      description: 'ยิ่งต่อสู้นานยิ่งสะสมแรงโจมตี — ต้องตั้งสำรับให้ปิดไฟต์ได้'
    },
    {
      id: 'ngu-phi-sang',
      name: 'งูผีสาง',
      tier: 'T2' as const,
      hp: 30,
      description: 'โจมตี 5 · พิษ 2 นาน 2 เทิร์น'
    }
  ],

  // Tier 3: Mid-game variety (Fight 3-4, 5-6, 8-9)
  T3: [
    {
      id: 'phi-pret',
      name: 'ผีเปรต',
      tier: 'T3' as const,
      hp: 35,
      description: 'โจมตี 6 ฟื้น 4'
    },
    {
      id: 'krahang',
      name: 'กะหัง',
      tier: 'T3' as const,
      hp: 38,
      description: 'โจมตี 4 ×2'
    },
    {
      id: 'kuman-thong',
      name: 'กุมารทอง',
      tier: 'T3' as const,
      hp: 40,
      description: 'โจมตี 3 · ลดจั่ว 1 นาน 2 เทิร์น'
    },
    {
      id: 'phi-tai-hong',
      name: 'ผีตายทั้งกลม',
      tier: 'T3' as const,
      hp: 42,
      description: 'โจมตี 5 · เปราะบาง 1 นาน 2 เทิร์น'
    },
    {
      id: 'phi-pa',
      name: 'ผีป่า',
      tier: 'T3' as const,
      hp: 45,
      description: 'โจมตี 4 เรียกปีศาจป่าทำให้อ่อนแอ'
    }
  ],

  // Tier 4: Late game challenge (Fight 8-9, 10-12)
  T4: [
    {
      id: 'mae-nak',
      name: 'แม่นาค',
      tier: 'T4' as const,
      hp: 50,
      description: 'โจมตี 4 ×3'
    },
    {
      id: 'pop-yai',
      name: 'ปอบใหญ่',
      tier: 'T4' as const,
      hp: 55,
      description: 'โจมตี 8 ฟื้น 4'
    },
    {
      id: 'phi-ha-ratri',
      name: 'ผีห่าราตรี',
      tier: 'T4' as const,
      hp: 60,
      description: 'โจมตี 5 · พิษ 3 นาน 2 เทิร์น'
    }
  ],

  // Tier 5: End game elites (Fight 10-12, 13-14)
  T5: [
    {
      id: 'asuragaya',
      name: 'อสุรกาย',
      tier: 'T5' as const,
      hp: 70,
      description: 'โจมตี 6 ×2'
    },
    {
      id: 'yak-wat-jaeng',
      name: 'ยักษ์วัดแจ้ง',
      tier: 'T5' as const,
      hp: 75,
      description: 'โจมตี 10 ป้องกัน 8'
    },
    {
      id: 'phi-phrai',
      name: 'ผีพราย',
      tier: 'T5' as const,
      hp: 80,
      description: 'โจมตี 6 · อ่อนแอ 1 นาน 2 เทิร์น'
    }
  ],

  // Elite monsters - can appear across different fights
  Elite: [
    {
      id: 'winyan-rerorn',
      name: 'วิญญาณเร่ร่อน',
      tier: 'Elite' as const,
      hp: 85,
      description: 'โจมตี 7 ใส่เสียงในหู 1 ใบในกองทิ้ง เฉพาะไฟต์นี้'
    },
    {
      id: 'pisaj-fai',
      name: 'ปีศาจไฟ',
      tier: 'Elite' as const,
      hp: 90,
      description: 'โจมตี 7 · พิษ 3 นาน 2 เทิร์น'
    },
    {
      id: 'jao-por-pa',
      name: 'เจ้าพ่อป่า',
      tier: 'Elite' as const,
      hp: 95,
      description: 'โจมตี 6 เรียกปีศาจป่าทำให้อ่อนแอ'
    },
    {
      id: 'phi-nang-yai',
      name: 'ผีนางใหญ่',
      tier: 'Elite' as const,
      hp: 100,
      description: 'โจมตี 7 · เพิ่มค่าร่าย 1 นาน 2 เทิร์น'
    },
    {
      id: 'winyan-dek',
      name: 'วิญญาณเด็ก',
      tier: 'Elite' as const,
      hp: 105,
      description: 'โจมตี 4 ×3'
    },
    {
      id: 'yak-dam',
      name: 'ยักษ์ดำ',
      tier: 'Elite' as const,
      hp: 110,
      description: 'โจมตี 13 · เปราะบาง 1 นาน 2 เทิร์น'
    }
  ],

  // Boss Mid - Fight 7
  BossMid: [
    {
      id: 'phi-mae-mai',
      name: 'ผีแม่ม่าย',
      tier: 'BossMid' as const,
      hp: 120,
      description: 'โจมตี 8 · อ่อนแอ 1 นาน 2 เทิร์น'
    },
    {
      id: 'phra-upakut',
      name: 'พระอุปคุต',
      tier: 'BossMid' as const,
      hp: 130,
      description: 'โจมตี 7 ฟื้น 6'
    }
  ],

  // Boss Final - Fight 15
  BossFinal: [
    ...NIGHT_BOSSES,
    {
      id: 'phaya-nak',
      name: 'พญานาค',
      tier: 'BossFinal' as const,
      hp: 180,
      description: 'โจมตี 6 ×3'
    },
    {
      id: 'thep-aksorn',
      name: 'เทพอักษร',
      tier: 'BossFinal' as const,
      hp: 200,
      description: 'โจมตี 9 ใส่เสียงในหู 1 ใบในกองทิ้ง เฉพาะไฟต์นี้'
    }
  ],

  // Secret Boss - Fight 16 (optional)
  SecretBoss: [
    ULTIMATE_BOSS,
    {
      id: 'phraya-maccurat',
      name: 'พระยามัจจุราช',
      tier: 'SecretBoss' as const,
      hp: 250,
      description: 'โจมตี 7 ×3'
    }
  ]
};

// Helper functions
export function getMonstersByTier(tier: keyof typeof THAI_GHOST_POOLS): ThaiGhostData[] {
  return THAI_GHOST_POOLS[tier];
}

export function getMonsterById(monsterId: string): ThaiGhostData | undefined {
  for (const tierMonsters of Object.values(THAI_GHOST_POOLS)) {
    const found = tierMonsters.find(monster => monster.id === monsterId);
    if (found) return found;
  }
  return undefined;
}

/**
 * สุ่มผีจาก tier ที่กำหนด
 *
 * ใช้ seeded RNG ตามที่ rng.ts ประกาศไว้เอง ("no Math.random") — seed เดียวกัน
 * ต้องได้ผีตัวเดิมทุกครั้ง ไม่งั้น save/reload จะได้รันคนละแบบ
 */
export function getRandomMonsterFromTier(
  tier: keyof typeof THAI_GHOST_POOLS,
  rng: RNG
): { monster: ThaiGhostData; rng: RNG } {
  const monsters = THAI_GHOST_POOLS[tier];
  const roll = int(rng, 0, monsters.length - 1);
  return { monster: monsters[roll.value], rng: roll.rng };
}

export function getAllMonsterIds(): string[] {
  const ids: string[] = [];
  Object.values(THAI_GHOST_POOLS).forEach(tierMonsters => {
    tierMonsters.forEach(monster => ids.push(monster.id));
  });
  return ids;
}

/**
 * โอกาสเจอ Elite ตามช่วงไฟต์ (ตาราง Fight Progression ใน gameSpec.txt)
 *
 * เดิม Elite ถูกปล่อยออกมาต่อเมื่อ pool ของมอนธรรมดาหมดแล้วเท่านั้น
 * ทำให้ Elite ทั้งหมดกระจุกอยู่ท้ายรัน (ไฟต์ 11-14 รวด) แทนที่จะโผล่ประปราย
 */
export function eliteChanceForFight(fightIndex: number): number {
  if (fightIndex <= 2) return 0;
  if (fightIndex <= 4) return 0.05;
  if (fightIndex <= 6) return 0.10;
  if (fightIndex <= 9) return 0.15;
  if (fightIndex <= 12) return 0.25;
  return 0.30;
}

/**
 * Elite ที่เหมาะกับช่วงไฟต์นั้น
 *
 * pool ของ Elite ไล่ตั้งแต่ HP 85 ถึง 110 แต่โอกาสเจอ Elite เปิดตั้งแต่ไฟต์ที่ 3
 * ถ้าไม่แบ่งช่วง ผู้เล่นมีสิทธิ์เจอ Elite 110 HP ตั้งแต่ยังใช้เด็คตั้งต้น
 * ซึ่งเป็นกำแพงที่เจาะไม่ได้ ไม่ใช่ความท้าทาย
 */
export function eliteSubPoolForFight(fightIndex: number): ThaiGhostData[] {
  const byHp = [...THAI_GHOST_POOLS.Elite].sort((a, b) => a.hp - b.hp);
  if (fightIndex <= 6) return byHp.slice(0, 2);
  if (fightIndex <= 9) return byHp.slice(0, 4);
  return byHp;
}

// Fight progression mapping (ตาม Game Spec)
export function getTierForFight(
  fightIndex: number,
  rng: RNG
): { tier: keyof typeof THAI_GHOST_POOLS; rng: RNG } {
  // ทอยครั้งเดียวแล้วส่ง rng ตัวใหม่ต่อ — ทุกการทอยต้องเดินสถานะ rng ไปข้างหน้า
  let r = rng;
  const roll = (): number => {
    const out = next(r);
    r = out.rng;
    return out.value;
  };
  const done = (tier: keyof typeof THAI_GHOST_POOLS) => ({ tier, rng: r });

  // Fight 1-2: T1-T2
  if (fightIndex <= 2) {
    return done(roll() < 0.6 ? 'T1' : 'T2');
  }
  // Fight 3-4: T1-T3 + Elite 5%
  else if (fightIndex <= 4) {
    if (roll() < 0.05) return done('Elite');
    return done(roll() < 0.3 ? 'T1' : roll() < 0.6 ? 'T2' : 'T3');
  }
  // Fight 5-6: T2-T3 + Elite 10%
  else if (fightIndex <= 6) {
    if (roll() < 0.1) return done('Elite');
    return done(roll() < 0.5 ? 'T2' : 'T3');
  }
  // Fight 7: Mid Boss
  else if (fightIndex === 7) {
    return done('BossMid');
  }
  // Fight 8-9: T3-T4 + Elite 15%
  else if (fightIndex <= 9) {
    if (roll() < 0.15) return done('Elite');
    return done(roll() < 0.5 ? 'T3' : 'T4');
  }
  // Fight 10-12: T4-T5 + Elite 20-25%
  else if (fightIndex <= 12) {
    if (roll() < 0.25) return done('Elite');
    return done(roll() < 0.5 ? 'T4' : 'T5');
  }
  // Fight 13-14: T5 + Elite 25-30%
  else if (fightIndex <= 14) {
    if (roll() < 0.3) return done('Elite');
    return done('T5');
  }
  // Fight 15: Final Boss
  else if (fightIndex === 15) {
    return done('BossFinal');
  }
  // Fight 16+: Secret Boss
  else {
    return done('SecretBoss');
  }
}

export const MONSTER_SYSTEM_STATS = {
  TOTAL_MONSTERS: getAllMonsterIds().length,
  T1_COUNT: THAI_GHOST_POOLS.T1.length,
  T2_COUNT: THAI_GHOST_POOLS.T2.length,
  T3_COUNT: THAI_GHOST_POOLS.T3.length,
  T4_COUNT: THAI_GHOST_POOLS.T4.length,
  T5_COUNT: THAI_GHOST_POOLS.T5.length,
  ELITE_COUNT: THAI_GHOST_POOLS.Elite.length,
  BOSS_MID_COUNT: THAI_GHOST_POOLS.BossMid.length,
  BOSS_FINAL_COUNT: THAI_GHOST_POOLS.BossFinal.length,
  SECRET_BOSS_COUNT: THAI_GHOST_POOLS.SecretBoss.length
} as const;