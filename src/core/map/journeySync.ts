// src/core/map/journeySync.ts — สะพานระหว่างเส้นทางกับระบบ offer เดิม
//
// handler ของคอมแบต ร้านค้า และ event ทั้งหมดทำงานกับ `pages.current.offers`
// และ `pages._activeOfferIndex` อยู่แล้ว ไฟล์นี้ทำให้ทั้งหมดนั้นยังใช้ได้เหมือนเดิม
// โดยเปลี่ยนแค่ "ที่มา" ของตัวเลือก จากถาดที่สุ่มใหม่ เป็นโหนดที่เดินไปได้บนเส้นทาง

import type { GameState } from '../types';
import type { RNG } from '../rng';
import {
  buildJourney, reachableNodes, moveTo, isJourneyComplete,
  appendRows, planSecretRows,
} from './journey';
import type { JourneyNode } from './journey';
import { initPageMap } from './pages';

/** รันนี้ใช้แผนที่แบบเดินทางอยู่หรือเปล่า */
export function usesJourney(s: GameState): boolean {
  return !!s.journey;
}

/** สร้างเส้นทางใหม่ทั้งรัน แล้วตั้งตัวเลือกของชั้นแรก */
export function startJourney(s: GameState, r: RNG): RNG {
  if (!s.pages) {
    const init = initPageMap(r); r = init.rng;
    s.pages = init.map;
  }
  const out = buildJourney(r);
  s.journey = out.journey;
  syncOffersFromJourney(s);
  return out.rng;
}

/**
 * เขียน `pages.current.offers` ให้ตรงกับโหนดที่เดินไปได้ตอนนี้
 * เรียกทุกครั้งที่ตำแหน่งบนเส้นทางเปลี่ยน
 */
export function syncOffersFromJourney(s: GameState): void {
  if (!s.journey || !s.pages) return;

  const offers = reachableNodes(s.journey).map(n => n.offer);

  s.pages.current = { offers, resolved: offers.map(() => false) };
  s.pages._activeOfferIndex = undefined;
  s.pages._shopUsed = false;
  // เดินหน้าเดียว ไม่มีการวนเคลียร์ในหน้าเดิมอีกแล้ว
  s.pages._resolvesOnPage = 0;
  // ให้ตัวนับหน้าเดินตามชั้นบนเส้นทาง เพื่อให้ id ของร้านที่สร้างใหม่ไม่ชนกัน
  s.pages.pageIndex = s.journey.rowIndex;
}

/** โหนดที่ตรงกับ offer ลำดับที่ ix ของชั้นปัจจุบัน */
export function nodeForOfferIndex(s: GameState, ix: number): JourneyNode | undefined {
  if (!s.journey) return undefined;
  return reachableNodes(s.journey)[ix];
}

/** ย้ายไปยืนที่โหนดนั้น (เรียกตอนผู้เล่นเลือก) */
export function enterNode(s: GameState, ix: number): JourneyNode | undefined {
  const node = nodeForOfferIndex(s, ix);
  if (!node || !s.journey) return undefined;
  moveTo(s.journey, node.id);
  if (s.pages) s.pages.pageIndex = s.journey.rowIndex;
  return node;
}

/** จบโหนดปัจจุบันแล้ว — เปิดตัวเลือกของชั้นถัดไป */
export function advanceJourney(s: GameState): void {
  syncOffersFromJourney(s);
}

/** เดินถึงปลายทางแล้วหรือยัง */
export function journeyFinished(s: GameState): boolean {
  return !!s.journey && isJourneyComplete(s.journey);
}

/** ต่อศึกลับท้ายเส้นทาง — เรียกตอนชนะบอสสุดท้ายด้วยเลือดที่ถึงเกณฑ์ */
export function unlockSecretBossRows(s: GameState, r: RNG): RNG {
  if (!s.journey) return r;
  return appendRows(s.journey, planSecretRows(), r);
}
