// src/core/monsters/monster-decks.ts — เด็คประจำตัวของผีแต่ละตน
//
// ก่อนหน้านี้ทุกตัวถูก hardcode เป็น `ai.cycle = ['claw','guard']` ตอนสร้างศัตรู
// ใน ChooseOffer ทำให้ผี 31 ตนเล่นเหมือนกันหมด ต่างกันแค่ HP
// ทั้งที่ enemy_cards.json มีการ์ดตามธีมอยู่แล้ว 35 ใบใน 10 กลุ่ม
//
// ไฟล์นี้จับคู่ผีแต่ละตนกับกลุ่มการ์ดที่เข้ากับตำนานของมัน
// และกำหนดพลังงาน/ขนาดมือตาม tier

import type { ThaiGhostData } from './thai-ghosts';

export type EnemyDeckConfig = {
  pool: { allowOwners: string[] };
  handSize: number;
  maxEnergy: number;
};

/**
 * กลุ่มการ์ดของผีแต่ละตน — เลือกให้เข้ากับตำนาน
 *
 * krasue        เลือด/ล่ากลางคืน      phi_pop       เข้าสิง/ล่องหน
 * spirit        อาฆาต/คำสาป           kinnaree      ร่ายรำ/สะกด
 * phi_krahang   บู๊ตรงๆ/พุ่งชน        phi_tai_hong  สิงร่าง/ดูดวิญญาณ
 * naga_minor    งู/พิษ                global        พื้นฐาน
 */
const OWNERS_BY_MONSTER: Record<string, string[]> = {
  // ── T1
  'phi-krasue':    ['krasue', 'phi-krasue'],
  'phi-pop':       ['phi_pop'],
  'nang-tanee':    ['spirit'],

  // ── T2
  'phi-nang-ram':  ['kinnaree'],
  'phi-pong-kang': ['phi_krahang', 'global'],
  'ngu-phi-sang':  ['naga_minor'],

  // ── T3
  'phi-pret':      ['spirit'],
  'krahang':       ['phi_krahang'],
  'kuman-thong':   ['spirit', 'phi_pop'],
  'phi-tai-hong':  ['phi_tai_hong'],
  'phi-pa':        ['phi_krahang', 'global'],

  // ── T4
  'mae-nak':       ['phi_tai_hong', 'spirit'],   // แม่นาคตายทั้งกลม
  'pop-yai':       ['phi_pop'],
  'phi-ha-ratri':  ['krasue', 'spirit'],

  // ── T5
  'asuragaya':     ['phi_krahang', 'global'],
  'yak-wat-jaeng': ['phi_krahang', 'global'],
  'phi-phrai':     ['naga_minor', 'spirit'],     // พรายน้ำ

  // ── Elite
  'winyan-rerorn': ['spirit'],
  'pisaj-fai':     ['spirit', 'phi_krahang'],
  'jao-por-pa':    ['phi_krahang', 'spirit'],
  'phi-nang-yai':  ['kinnaree', 'spirit'],
  'winyan-dek':    ['spirit', 'phi_pop'],
  'yak-dam':       ['phi_krahang', 'global'],

  // ── Boss
  'phi-mae-mai':   ['spirit', 'phi_tai_hong'],
  'phra-upakut':   ['spirit', 'kinnaree'],
  'phaya-nak':     ['naga_minor', 'spirit'],
  'thep-aksorn':   ['kinnaree', 'spirit'],

  // ── Secret
  'phraya-maccurat': ['spirit', 'phi_tai_hong', 'naga_minor'],
};

/** พลังงานและขนาดมือตาม tier — ยิ่ง tier สูงยิ่งเล่นได้หลายใบต่อเทิร์น */
const BY_TIER: Record<ThaiGhostData['tier'], { handSize: number; maxEnergy: number }> = {
  T1:         { handSize: 2, maxEnergy: 2 },
  T2:         { handSize: 2, maxEnergy: 2 },
  T3:         { handSize: 2, maxEnergy: 3 },
  T4:         { handSize: 3, maxEnergy: 3 },
  T5:         { handSize: 3, maxEnergy: 4 },
  Elite:      { handSize: 3, maxEnergy: 4 },
  BossMid:    { handSize: 3, maxEnergy: 4 },
  BossFinal:  { handSize: 4, maxEnergy: 5 },
  SecretBoss: { handSize: 4, maxEnergy: 6 },
};

/** เด็คประจำตัวของผีตนนี้ — ถ้าไม่ได้จับคู่ไว้ จะได้เด็คพื้นฐานแทน */
export function deckForMonster(monster: ThaiGhostData): EnemyDeckConfig {
  const tier = BY_TIER[monster.tier] ?? BY_TIER.T1;
  const owners = OWNERS_BY_MONSTER[monster.id] ?? ['global'];
  return {
    pool: { allowOwners: owners },
    handSize: tier.handSize,
    maxEnergy: tier.maxEnergy,
  };
}

/** ใช้ในเทสต์: ผีทุกตนต้องถูกจับคู่เด็คไว้ครบ */
export function monstersWithoutDeck(all: ThaiGhostData[]): string[] {
  return all.filter(m => !OWNERS_BY_MONSTER[m.id]).map(m => m.id);
}
