// src/core/combat/minions/index.ts — ระบบสหายและลูกน้องแบบครบครัน

/**
 * ไฟล์หลักสำหรับระบบสหายและลูกน้อง (Minion System)
 * 
 * ระบบนี้จัดการ:
 * - สหายที่ช่วยผู้เล่น (Player Minions)
 * - ลูกน้องของศัตรู (Enemy Minions)
 * - ความสามารถและการทำงานของแต่ละตัว
 * - การสร้าง instance สำหรับใช้ในเกม
 */

// ===== Export Types =====
export type { MinionData } from '../../types_extended';

// ===== Export Thai Minions =====
export {
  THAI_MINIONS,
  getMinionById,
  getAllMinions,
  getPlayerMinions,
  getEnemyMinions,
  getMinionsByAbilityType,
  getDurableMinions,
  createMinionInstance,
  MINION_CATEGORIES,
  MINION_USAGE_TIPS
} from './thai-minions';

// ===== Backward Compatibility =====
// Re-export เป็นชื่อเดิมสำหรับไฟล์ที่ยังใช้ import เก่า
export { THAI_MINIONS as MINIONS_REGISTRY } from './thai-minions';

/**
 * ฟังก์ชันช่วยสำหรับระบบ Minion
 */

// นำเข้าข้อมูลพื้นฐาน
import { THAI_MINIONS, createMinionInstance } from './thai-minions';
import type { MinionData } from '../../types_extended';

// createRandomPlayerMinion / createRandomEnemyMinion / createMinionByAbility
// ถูกลบออกแล้ว — ไม่มีใครเรียกเลย และทั้งสามใช้ Math.random ซึ่งขัดกับ
// ข้อกำหนดเรื่อง seed determinism ถ้าต้องใช้อีก ให้เขียนใหม่โดยรับ RNG เข้ามา

// ตรวจสอบว่า Minion มีความสามารถเฉพาะหรือไม่
export function minionHasAbility(
  minionId: string, 
  abilityType: 'attack' | 'heal' | 'energy' | 'status' | 'block'
): boolean {
  const minion = THAI_MINIONS[minionId];
  if (!minion) return false;
  
  return minion.abilities.some(ability => ability.type === abilityType);
}

// ดึงความสามารถทั้งหมดของ Minion
export function getMinionAbilities(minionId: string): string[] {
  const minion = THAI_MINIONS[minionId];
  if (!minion) return [];
  
  return minion.abilities.map(ability => 
    `${ability.type}: ${ability.description}`
  );
}

/**
 * ระบบการแนะนำ Minion สำหรับผู้เล่น
 * ตามสถานการณ์การต่อสู้
 */
export function recommendMinionsForSituation(situation: {
  enemyType?: 'high_hp' | 'high_damage' | 'many_minions' | 'boss';
  playerNeed?: 'damage' | 'healing' | 'energy' | 'protection' | 'debuff';
  turnCount?: number;
}): string[] {
  const recommendations: string[] = [];
  
  // แนะนำตาม enemy type
  if (situation.enemyType === 'high_hp') {
    recommendations.push('poison_spirit'); // DoT damage
  } else if (situation.enemyType === 'high_damage') {
    recommendations.push('ancient_warrior_spirit'); // มีทั้งโจมตีและป้องกัน
  } else if (situation.enemyType === 'many_minions') {
    recommendations.push('ghost_ally'); // ทะลุ block, เหมาะจัดการ minions
  } else if (situation.enemyType === 'boss') {
    recommendations.push('kuman_spirit'); // healing ต่อเนื่อง
  }
  
  // แนะนำตาม player need
  if (situation.playerNeed === 'damage') {
    recommendations.push('demon_minion', 'ancient_warrior_spirit');
  } else if (situation.playerNeed === 'healing') {
    recommendations.push('kuman_spirit');
  } else if (situation.playerNeed === 'energy') {
    recommendations.push('spirit_snail');
  } else if (situation.playerNeed === 'debuff') {
    recommendations.push('poison_spirit');
  }
  
  // กรองเฉพาะ player minions และลบซ้ำ
  const playerMinions = Object.keys(THAI_MINIONS).filter(id => 
    THAI_MINIONS[id].owner === 'player'
  );
  
  return Array.from(new Set(recommendations)).filter(id => 
    playerMinions.includes(id)
  );
}

/**
 * สถิติระบบ Minion
 */
export const MINION_SYSTEM_STATS = {
  TOTAL_MINIONS: Object.keys(THAI_MINIONS).length,
  PLAYER_MINIONS: Object.values(THAI_MINIONS).filter(m => m.owner === 'player').length,
  ENEMY_MINIONS: Object.values(THAI_MINIONS).filter(m => m.owner === 'enemy').length,
  
  ABILITY_DISTRIBUTION: {
    ATTACK: Object.values(THAI_MINIONS).filter(m => 
      m.abilities.some(a => a.type === 'attack')
    ).length,
    HEAL: Object.values(THAI_MINIONS).filter(m => 
      m.abilities.some(a => a.type === 'heal')
    ).length,
    SUPPORT: Object.values(THAI_MINIONS).filter(m => 
      m.abilities.some(a => a.type === 'energy' || a.type === 'block')
    ).length,
    DEBUFF: Object.values(THAI_MINIONS).filter(m => 
      m.abilities.some(a => a.type === 'status')
    ).length
  },
  
  AVERAGE_DURATION: Math.round(
    Object.values(THAI_MINIONS).reduce((sum, m) => sum + m.duration, 0) / 
    Object.values(THAI_MINIONS).length
  )
} as const;

/**
 * คำแนะนำการใช้งาน:
 * 
 * // สร้าง minion สำหรับผู้เล่น
 * const playerMinion = createMinionInstance('ghost_ally', 'player');
 * 
 * // แนะนำ minion ตามสถานการณ์
 * const recommendations = recommendMinionsForSituation({
 *   enemyType: 'boss',
 *   playerNeed: 'healing'
 * });
 * 
 * // ตรวจสอบความสามารถ
 * const canHeal = minionHasAbility('kuman_spirit', 'heal');
 */