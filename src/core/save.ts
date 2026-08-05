// src/core/save.ts — เซฟ/โหลดแบบไม่ทำ IO (ชั้นนอกค่อยเขียนลง storage)
//
// **เขียนใหม่ทั้งไฟล์ — ของเดิมทำข้อมูลหายเงียบๆ**
//
// SaveV1 เลือกเก็บทีละฟิลด์ (whitelist) ซึ่งเขียนไว้ตั้งแต่ก่อนมีระบบเส้นทาง คลาส
// ผสานการ์ด และเหตุการณ์เล่าเรื่อง ผลคือทุกอย่างที่เพิ่มมาทีหลัง **ไม่ถูกเก็บเลย**:
// `journey`, `classId`, `fightCount`, `secretBossUnlocked`, `shopRegistry`,
// `defeatedEnemyIds` — โหลดกลับมาแล้วรันพัง
//
// ที่ร้ายที่สุดคือสำรับ: เก็บเป็น id แล้ว rehydrate จาก `cards.json` อย่างเดียว
// การ์ดคลาส (อยู่ใน `class_cards.json`) กับการ์ดที่ผสานแล้ว (`fused_*` ซึ่งไม่มีใน
// ไฟล์ข้อมูลใดๆ เพราะสร้างตอนเล่น) จะ **หายไปจากสำรับโดยไม่มีข้อความอะไรบอก**
//
// V2 กลับด้าน: เก็บ `GameState` ทั้งก้อน แล้ว **ตัดเฉพาะสิ่งที่ตั้งใจไม่เก็บ**
// (สเตตของคอมแบต) ทุกอย่างเป็นข้อมูล primitive อยู่แล้ว การ์ดก็เก็บทั้งใบไม่ใช่ id
// เพิ่มฟิลด์ใหม่ใน GameState ทีหลังแล้วเซฟจะตามไปเอง ไม่พังซ้ำรอยเดิม

import type { GameState } from './types';

export const SAVE_VERSION = 2;

/**
 * คำสั่งที่ควรเซฟอัตโนมัติหลังทำ — จุดที่ "ความคืบหน้าเปลี่ยนจริง"
 *
 * อยู่ตรงนี้ไม่ใช่ใน store เพราะมันเป็น **นโยบายการเซฟ** ไม่ใช่เรื่องของ UI
 * และเทสต์ต้องอ่านมันได้โดยไม่ต้องลาก zustand กับ AsyncStorage มาด้วย
 *
 * **เงื่อนไขที่ต้องรักษา**: คำสั่งในรายการนี้ต้องไม่ยิงตอนที่ผลของไฟต์ยัง
 * ไม่ปิดบัญชี — ตอนชนะแล้วแต่ยังไม่กด `CompleteNode` นั้น exp/ทอง/การ์ดรางวัล
 * เข้ากระเป๋าไปแล้ว แต่โหนดบนแผนที่ยัง `resolved: false` เซฟตรงนั้นแล้วโหลดกลับ
 * = สู้โหนดเดิมซ้ำได้ไม่จำกัด (วัดจริง: รอบสองได้ทอง +35 การ์ดอีกใบ EXP อีกก้อน)
 *
 * เดิม `ChooseLevelUp` / `ChooseLevelUpOption` / `SkipLevelUp` อยู่ในรายการนี้
 * ด้วยเหตุผลที่ถูก (ปิดแอปกลางหน้าเลเวลอัปแล้วไม่อยากให้ผลหาย) แต่มันคือ
 * ช่วงเวลานั้นพอดี — `CompleteNode` ตามมาติดๆ อยู่แล้ว เสียแค่การกดหนึ่งครั้ง
 */
export const AUTO_SAVE_COMMANDS = [
  'CompleteNode', 'ChooseOffer', 'Proceed',
  'ChooseStarterBlessing',
  'TakeShop', 'TakeShopEquipment', 'ShopRemoveBuy', 'ShopUpgradeBuy',
  'TakeTreasureCard', 'TakeSingleTreasureCard',
  'UseWell', 'UseHealingShrine',
  'EventChooseBlessing',
  'ChooseEventOption', 'FuseCards',
] as const;

/**
 * ฟิลด์ที่ตั้งใจไม่เก็บ — เป็นของชั่วคราวระหว่างคอมแบตหรือของ view
 * โหลดกลับมาผู้เล่นจะยืนอยู่บนแผนที่เสมอ ไม่ใช่กลางไฟต์
 */
const DROP_ON_SAVE = [
  'enemy', 'enemyIntent', 'enemyPiles', 'playerPiles', 'enemyIntentCardId', 'minions', 'traps', 'combo',
  'piles', 'pendingEvents', 'turnFlags', 'levelUp', 'cardReward', 'starter',
  'shopKind', 'shopStock', 'shopBoughtItems', 'currentShopId',
  'event', 'deckOpen', 'combatVictoryLock', 'equipmentTempSlots',
  // บทที่ค้างอ่านอยู่เป็นของหน้าจอ ไม่ใช่ความคืบหน้า — `chaptersSeen` ต่างหากที่เก็บ
  'chapter',
] as const;

export type SaveV2 = {
  version: 2;
  /** สถานะทั้งก้อนที่ตัดสเตตคอมแบตออกแล้ว */
  state: Partial<GameState> & { seed: string };
};

/** ข้อมูลย่อสำหรับโชว์บนปุ่ม "เดินทางต่อ" โดยไม่ต้องโหลดทั้งเซฟ */
export type SaveSummary = {
  classId?: string;
  fight: number;
  totalFights: number;
  hp: number;
  maxHp: number;
  gold: number;
  level: number;
};

export function toSave(s: GameState): SaveV2 {
  const copy: any = JSON.parse(JSON.stringify(s));
  for (const k of DROP_ON_SAVE) delete copy[k];

  // ยืนอยู่บนแผนที่เสมอตอนโหลด — ถ้าเซฟตอนอยู่ในร้าน/เหตุการณ์
  // ก็ให้กลับมาที่แผนที่ ไม่ใช่กลับเข้าไปกลางหน้าที่ไม่มีข้อมูลรองรับแล้ว
  copy.phase = 'map';

  return { version: SAVE_VERSION, state: copy };
}

export function fromSave(data: SaveV2): GameState {
  if (data.version !== SAVE_VERSION) {
    throw new Error(`เซฟเวอร์ชัน ${data.version} ใช้กับเกมเวอร์ชันนี้ไม่ได้`);
  }

  const s = data.state as GameState;

  // เติมสเตตที่ตัดออกตอนเซฟกลับมาเป็นค่าเริ่มต้น
  return {
    ...s,
    phase: 'map',
    turn: 0,
    enemy: undefined,
    enemyIntent: undefined,
    minions: [],
    traps: [],
    combo: undefined,
    pendingEvents: [],
    piles: { draw: [], hand: [], discard: [], exhaust: [] },
    turnFlags: { blessingOnce: {}, equipmentOnce: {} },
    levelUp: null,
    starter: null,
    shopKind: undefined,
    shopStock: undefined,
    shopBoughtItems: undefined,
    currentShopId: undefined,
    event: undefined,
    story: undefined,
    chapter: undefined,
    deckOpen: false,
    combatVictoryLock: false,
    player: { ...s.player, block: 0, energy: s.player.maxEnergy },
    log: [...(s.log ?? []), 'โหลดการเดินทางที่ค้างไว้'],
  };
}

/**
 * เซฟนี้ยังเล่นต่อได้ไหม
 *
 * เช็คตรงนี้แทนที่จะให้ผู้เล่นกดแล้วไปเจอจอเปล่า — เซฟจากก่อนมีระบบเส้นทาง
 * จะไม่มี `journey` และเล่นต่อไม่ได้
 */
export function isPlayableSave(data: unknown): data is SaveV2 {
  if (!data || typeof data !== 'object') return false;
  const d = data as any;
  if (d.version !== SAVE_VERSION) return false;
  if (!d.state || typeof d.state !== 'object') return false;
  if (!d.state.journey || !d.state.journey.rows?.length) return false;
  if (d.state.phase === 'run_complete') return false;   // รันนี้จบไปแล้ว
  // `toSave` บังคับ phase เป็น 'map' เสมอ เช็ค phase อย่างเดียวจึงไม่พอ:
  // เซฟที่เขียนตอนจบรัน (ชนะหรือแพ้) จะดูเหมือนเซฟกลางทาง แล้วปุ่ม "เดินทางต่อ"
  // จะพาผู้เล่นกลับเข้ารันที่จบไปแล้ว — ตายแล้วเดินต่อได้ไม่รู้จบ
  if (d.state.runSummary) return false;
  return true;
}

export function summarize(data: SaveV2): SaveSummary {
  const s = data.state;
  const plans = s.journey?.plans ?? [];
  return {
    classId: s.classId,
    fight: Math.min((s.fightCount ?? 0) + 1, plans.filter(p => p.kind !== 'rest').length || 15),
    totalFights: plans.filter(p => p.kind !== 'rest').length || 15,
    hp: s.player?.hp ?? 0,
    maxHp: s.player?.maxHp ?? 0,
    gold: s.player?.gold ?? 0,
    level: s.player?.level ?? 1,
  };
}
