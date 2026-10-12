import {NIGHT_ENEMY_DECKS} from '../campaign/enemyDecks';
import {ENEMY_HAND_RULES} from '../combat/enemyHand';
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
  lists?: Array<{ id: string; weight: number; cards: string[] }>;
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
  'night-head-collector':['night-head-collector'],
  'night-bell-keeper':['night-bell-keeper'],
  'night-root-lord':['night-root-lord'],
  'night-cave-mother':['night-cave-mother'],
  'night-headless-king':['night-headless-king'],
  'phi-kin-hua':['phi-kin-hua'],

  // ── T1
  'phi-krasue':    ['krasue', 'phi-krasue'],
  'phi-pop':       ['phi_pop'],
  'nang-tanee':    ['spirit', 'tanee', 'global'],

  // ── T2
  'phi-nang-ram':  ['kinnaree', 'global'],
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

/** เด็คประจำตัวของผีตนนี้ — ถ้าไม่ได้จับคู่ไว้ จะได้เด็คพื้นฐานแทน */
export function deckForMonster(monster: ThaiGhostData): EnemyDeckConfig {
  const kind=monster.tier.includes('Boss')?'boss':monster.tier==='Elite'?'elite':'normal';
  const tier=ENEMY_HAND_RULES[kind];
  const cards=NIGHT_ENEMY_DECKS[monster.id];
  return {
    pool:{allowOwners:cards?[monster.id]:OWNERS_BY_MONSTER[monster.id]??['global']},
    ...(cards?{lists:[{id:monster.id,weight:1,cards:[...cards]}]}:{}),
    handSize:tier.handSize,maxEnergy:tier.maxEnergy,
  };
}

/** ใช้ในเทสต์: ผีทุกตนต้องถูกจับคู่เด็คไว้ครบ */
export function monstersWithoutDeck(all: ThaiGhostData[]): string[] {
  return all.filter(m => !OWNERS_BY_MONSTER[m.id]).map(m => m.id);
}
