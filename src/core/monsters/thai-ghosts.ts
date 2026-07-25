// src/core/monsters/thai-ghosts.ts - ระบบผีไทยแบบใหม่ตาม Game Spec

import { int, next, type RNG } from '../rng';

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
      description: 'ผีหัวลอยที่เหาะไปมา มักปรากฏตัวในยามค่ำคืน'
    },
    {
      id: 'phi-pop',
      name: 'ผีปอบ',
      tier: 'T1' as const,
      hp: 22,
      description: 'ผีที่เข้าสิงในคนเพื่อกินของสกปรก มีแรงเร้นกินเลือด'
    },
    {
      id: 'nang-tanee',
      name: 'นางตานี',
      tier: 'T1' as const,
      hp: 25,
      description: 'ผีหญิงสวยที่อยู่ในต้นกล้วย มักหลอกลวงคนให้หลงใหล'
    }
  ],

  // Tier 2: Building complexity (Fight 1-2, 3-4, 5-6)
  T2: [
    {
      id: 'phi-nang-ram',
      name: 'ผีนางรำ',
      tier: 'T2' as const,
      hp: 28,
      description: 'วิญญาณนักรำโบราณที่ยังคงเต้นรำในความมืด'
    },
    {
      id: 'phi-pong-kang',
      name: 'ผีโป่งค่าง',
      tier: 'T2' as const,
      hp: 32,
      description: 'ผีที่มีรูปร่างแปลกประหลาด เป็นลูกผสมระหว่างคนและสัตว์'
    },
    {
      id: 'ngu-phi-sang',
      name: 'งูผีสาง',
      tier: 'T2' as const,
      hp: 30,
      description: 'งูยักษ์ที่กลายเป็นผี มีพิษร้ายที่สามารถฆ่าคนได้'
    }
  ],

  // Tier 3: Mid-game variety (Fight 3-4, 5-6, 8-9)
  T3: [
    {
      id: 'phi-pret',
      name: 'ผีเปรต',
      tier: 'T3' as const,
      hp: 35,
      description: 'ผีที่มีปากเล็กท้องใหญ่ อดอยากตลอดกาล'
    },
    {
      id: 'krahang',
      name: 'กะหัง',
      tier: 'T3' as const,
      hp: 38,
      description: 'ผีชายที่บินได้ มักลักพาตัวสาวๆ ในยามค่ำคืน'
    },
    {
      id: 'kuman-thong',
      name: 'กุมารทอง',
      tier: 'T3' as const,
      hp: 40,
      description: 'วิญญาณเด็กที่ถูกเสกให้กลายเป็นเทพารักษ์'
    },
    {
      id: 'phi-tai-hong',
      name: 'ผีตายทั้งกลม',
      tier: 'T3' as const,
      hp: 42,
      description: 'ผีของผู้ที่เสียชีวิตอย่างอนาถ มีความแค้นฝังลึก'
    },
    {
      id: 'phi-pa',
      name: 'ผีป่า',
      tier: 'T3' as const,
      hp: 45,
      description: 'ผีที่อาศัยอยู่ในป่าลึก พ่อมดแม่มดของธรรมชาติ'
    }
  ],

  // Tier 4: Late game challenge (Fight 8-9, 10-12)
  T4: [
    {
      id: 'mae-nak',
      name: 'แม่นาค',
      tier: 'T4' as const,
      hp: 50,
      description: 'ผีหญิงในตำนานที่รักสามีจนไม่ยอมไปเกิด'
    },
    {
      id: 'pop-yai',
      name: 'ปอบใหญ่',
      tier: 'T4' as const,
      hp: 55,
      description: 'ปอบที่มีพลังมากกว่าปกติ กินได้ทั้งของเน่าและเลือดสด'
    },
    {
      id: 'phi-ha-ratri',
      name: 'ผีห่าราตรี',
      tier: 'T4' as const,
      hp: 60,
      description: 'ผีที่ปรากฏในเวลาบ่ายโมง นำความตายมาสู่ผู้พบเห็น'
    }
  ],

  // Tier 5: End game elites (Fight 10-12, 13-14)
  T5: [
    {
      id: 'asuragaya',
      name: 'อสุรกาย',
      tier: 'T5' as const,
      hp: 70,
      description: 'ปีศาจร้ายที่มีพลังแห่งความมืด ศัตรูของสวรรค์'
    },
    {
      id: 'yak-wat-jaeng',
      name: 'ยักษ์วัดแจ้ง',
      tier: 'T5' as const,
      hp: 75,
      description: 'ยักษ์ผู้พิทักษ์วัด แต่กลายเป็นปีศาจเมื่อโกรธ'
    },
    {
      id: 'phi-phrai',
      name: 'ผีพราย',
      tier: 'T5' as const,
      hp: 80,
      description: 'ผีที่ถูกสร้างด้วยเวทมนตร์ร้าย มีพลังที่น่ากลัว'
    }
  ],

  // Elite monsters - can appear across different fights
  Elite: [
    {
      id: 'winyan-rerorn',
      name: 'วิญญาณเร่ร่อน',
      tier: 'Elite' as const,
      hp: 85,
      description: 'วิญญาณที่หลงทางไม่สามารถไปสุคติได้'
    },
    {
      id: 'pisaj-fai',
      name: 'ปีศาจไฟ',
      tier: 'Elite' as const,
      hp: 90,
      description: 'ปีศาจที่ควบคุมไฟได้ เผาผลาญทุกสิ่งในทางของมัน'
    },
    {
      id: 'jao-por-pa',
      name: 'เจ้าพ่อป่า',
      tier: 'Elite' as const,
      hp: 95,
      description: 'เทพารักษ์ป่าที่กลายเป็นปีศาจเมื่อป่าถูกทำลาย'
    },
    {
      id: 'phi-nang-yai',
      name: 'ผีนางใหญ่',
      tier: 'Elite' as const,
      hp: 100,
      description: 'ผีหญิงที่มีอำนาจเหนือผีอื่นๆ นางผีแห่งความมืด'
    },
    {
      id: 'winyan-dek',
      name: 'วิญญาณเด็ก',
      tier: 'Elite' as const,
      hp: 105,
      description: 'วิญญาณเด็กที่เสียชีวิตอย่างน่าสงสาร มีความแค้นฝังลึก'
    },
    {
      id: 'yak-dam',
      name: 'ยักษ์ดำ',
      tier: 'Elite' as const,
      hp: 110,
      description: 'ยักษ์ที่มีผิวดำสนิท มีกำลังมหาศาลและความโกรธเกรี้ยว'
    }
  ],

  // Boss Mid - Fight 7
  BossMid: [
    {
      id: 'phi-mae-mai',
      name: 'ผีแม่ม่าย',
      tier: 'BossMid' as const,
      hp: 120,
      description: 'ผีหญิงที่เสียสามีไป เต็มไปด้วยความเศร้าโศกและความแค้น'
    },
    {
      id: 'phra-upakut',
      name: 'พระอุปคุต',
      tier: 'BossMid' as const,
      hp: 130,
      description: 'เณรที่กลายเป็นปีศาจ ทรงพลังแห่งเวทมนตร์โบราณ'
    }
  ],

  // Boss Final - Fight 15
  BossFinal: [
    {
      id: 'phaya-nak',
      name: 'พญานาค',
      tier: 'BossFinal' as const,
      hp: 180,
      description: 'ราชาแห่งงูทั้งหลาย ผู้ครองน้ำและสายฟ้า'
    },
    {
      id: 'thep-aksorn',
      name: 'เทพอักษร',
      tier: 'BossFinal' as const,
      hp: 200,
      description: 'เทพแห่งภาษาและคำสาป ผู้ควบคุมพลังแห่งคำ'
    }
  ],

  // Secret Boss - Fight 16 (optional)
  SecretBoss: [
    {
      id: 'phraya-maccurat',
      name: 'พระยามัจจุราช',
      tier: 'SecretBoss' as const,
      hp: 250,
      description: 'เทพแห่งความตาย ผู้ปกครองอำนาจแห่งความมืดมิด'
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