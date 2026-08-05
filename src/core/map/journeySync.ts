// src/core/map/journeySync.ts — สะพานระหว่างเส้นทางกับระบบ offer เดิม
//
// handler ของคอมแบต ร้านค้า และ event ทั้งหมดทำงานกับ `pages.current.offers`
// และ `pages._activeOfferIndex` อยู่แล้ว ไฟล์นี้ทำให้ทั้งหมดนั้นยังใช้ได้เหมือนเดิม
// โดยเปลี่ยนแค่ "ที่มา" ของตัวเลือก จากถาดที่สุ่มใหม่ เป็นโหนดที่เดินไปได้บนเส้นทาง

import type { GameState } from '../types';
import type { RNG } from '../rng';
import {
  buildJourney, reachableNodes, moveTo, isJourneyComplete,
  appendRows, planSecretRows, rowIsRest,
} from './journey';
import type { JourneyNode } from './journey';
import { initPageMap } from './pages';
import { THAI_GHOST_POOLS, getMonsterById } from '../monsters/thai-ghosts';
import { pickFrom } from '../rngState';
import { fireChapter } from '../story/chapters';

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

  const nodes = reachableNodes(s.journey);
  replaceDefeatedMonsters(s, nodes);
  const offers = nodes.map(n => n.offer);

  s.pages.current = { offers, resolved: offers.map(() => false) };
  s.pages._activeOfferIndex = undefined;
  s.pages._shopUsed = false;
  // เดินหน้าเดียว ไม่มีการวนเคลียร์ในหน้าเดิมอีกแล้ว
  s.pages._resolvesOnPage = 0;
  // ให้ตัวนับหน้าเดินตามชั้นบนเส้นทาง เพื่อให้ id ของร้านที่สร้างใหม่ไม่ชนกัน
  s.pages.pageIndex = s.journey.rowIndex;
}

/**
 * ผีที่ปราบไปแล้วต้องไม่โผล่อีก — เปลี่ยนตัวตอนแสดงผล
 *
 * ทำตรงนี้ไม่ใช่ตอนสร้างแผนที่ เพราะเส้นทางถูกวางล่วงหน้าทั้งเส้น มีโหนดสู้ 28 โหนด
 * แต่ผีที่ไม่ใช่บอสมีแค่ 24 ตน — สร้างแบบไม่ซ้ำเลยตั้งแต่ต้นเป็นไปไม่ได้
 * และตอนสร้างเราก็ยังไม่รู้ว่าผู้เล่นจะเดินทางไหน ตัวที่ไม่ได้เดินผ่านก็ไม่ได้ถูกฆ่า
 *
 * ผู้เล่นสู้จริงแค่ 13 ไฟต์ปกติ เลือกจาก 24 ตนจึงพอเสมอ
 *
 * บอสไม่เปลี่ยน — pool มีตัวเดียวสองตัว และบอสไม่โผล่ซ้ำอยู่แล้ว
 */
/** ลำดับ tier ที่ใช้ค้นหาตัวแทน — ไม่รวมบอส */
const TIER_ORDER: (keyof typeof THAI_GHOST_POOLS)[] = ['T1', 'T2', 'T3', 'T4', 'T5', 'Elite'];

/**
 * ผีที่ยังไม่เคยถูกปราบ ไล่จาก tier เดิมออกไปหา tier ใกล้เคียง
 * ขึ้นก่อนแล้วค่อยลง — ถ้าต้องเพี้ยนจากระดับที่ตั้งใจไว้ ให้เพี้ยนไปทางยากกว่า
 */
function freshInNearbyTiers(
  tier: keyof typeof THAI_GHOST_POOLS,
  defeated: string[],
  onRow: Set<string>
) {
  const at = TIER_ORDER.indexOf(tier);
  const order = at < 0
    ? TIER_ORDER
    : [tier, ...TIER_ORDER.slice(at + 1), ...TIER_ORDER.slice(0, at).reverse()];

  for (const t of order) {
    const fresh = THAI_GHOST_POOLS[t].filter(
      m => !defeated.includes(m.id) && !onRow.has(m.id)
    );
    if (fresh.length > 0) return fresh;
  }
  return [];
}

function replaceDefeatedMonsters(s: GameState, nodes: JourneyNode[]): void {
  const defeated = s.defeatedEnemyIds ?? [];
  if (defeated.length === 0) return;

  // ผีที่อยู่บนแถวนี้แล้ว — ห้ามเปลี่ยนไปชนกันเอง
  const onRow = new Set(
    nodes.map(n => (n.offer as any).enemyId as string | undefined).filter(Boolean) as string[]
  );

  for (const node of nodes) {
    if (node.offer.kind !== 'monster') continue;
    if (!defeated.includes(node.offer.enemyId)) continue;

    const tier: keyof typeof THAI_GHOST_POOLS =
      node.offer.tier === 'elite' ? 'Elite' : (getMonsterById(node.offer.enemyId)?.tier ?? 'T1');

    onRow.delete(node.offer.enemyId);

    // ต้องหาข้าม tier ได้ด้วย — pool ของ T5 มีแค่ 3 ตน พอถึงช่วงท้ายรัน
    // มักถูกปราบครบทั้ง tier แล้ว ถ้าจำกัดอยู่ tier เดียวจะไม่เหลือตัวให้เปลี่ยน
    // ไล่ tier ใกล้เคียงโดยขึ้นก่อน — เจอผีแรงกว่านิดหน่อยดีกว่าเจอตัวเดิมซ้ำ
    const picked = pickFrom(s, freshInNearbyTiers(tier, defeated, onRow));

    // ไม่เหลือผีที่ยังไม่เคยปราบเลยจริงๆ ก็ปล่อยไว้ตามเดิม (ไม่ควรเกิดใน 15 ไฟต์)
    if (picked) {
      node.offer = { ...node.offer, enemyId: picked.id };
      s.log.push(`เปลี่ยนผีที่ปราบไปแล้วเป็น ${picked.name}`);
    }

    onRow.add((node.offer as any).enemyId);
  }
}

/** โหนดที่ตรงกับ offer ลำดับที่ ix ของชั้นปัจจุบัน */
export function nodeForOfferIndex(s: GameState, ix: number): JourneyNode | undefined {
  if (!s.journey) return undefined;
  return reachableNodes(s.journey)[ix];
}

/**
 * ย้ายไปยืนที่โหนดนั้น (เรียกตอนผู้เล่นเลือก)
 *
 * **ชั้นพักไม่ย้าย** — ย้ายเมื่อไหร่ ช่องที่เหลือบนชั้นเดียวกันจะกลายเป็นโหนด
 * ที่เดินไปไม่ถึงทันที ซึ่งเป็นสิ่งที่เราเพิ่งเลิกทำ ชั้นพักย้ายตอนกดเดินต่อ
 * (ดู `leaveRestRow`) ระหว่างนั้นแค่ทำเครื่องหมายว่าแวะแล้วเพื่อให้แผนที่วาดถูก
 */
export function enterNode(s: GameState, ix: number): JourneyNode | undefined {
  const node = nodeForOfferIndex(s, ix);
  if (!node || !s.journey) return undefined;

  if (rowIsRest(s.journey, node.row)) {
    node.visited = true;
    return node;
  }

  moveTo(s.journey, node.id);
  if (s.pages) s.pages.pageIndex = s.journey.rowIndex;
  return node;
}

/**
 * กดเดินต่อจากชั้นพัก — ย้ายไปยืนที่โหนดใดโหนดหนึ่งของชั้นนั้น แล้วเปิดชั้นถัดไป
 *
 * ยืนโหนดไหนก็ได้: ชั้นถัดจากชั้นพักเป็นชั้นสู้ (กว้าง 2) หรือชั้นบอส (กว้าง 1)
 * เสมอ และ `linkRow` ต่อทุกโหนดของชั้นพักไปถึงทุกโหนดของชั้นถัดไปครบ
 * (มีเทสต์ยืนยันคุณสมบัตินี้ไว้ — ถ้าโครงกราฟเปลี่ยนจะรู้ทันที)
 */
export function leaveRestRow(s: GameState): void {
  if (!s.journey) return;
  const nodes = reachableNodes(s.journey);
  if (nodes.length === 0 || !rowIsRest(s.journey, nodes[0].row)) return;

  moveTo(s.journey, nodes[0].id);
  if (s.pages) s.pages.pageIndex = s.journey.rowIndex;
  advanceJourney(s);
}

/** จบโหนดปัจจุบันแล้ว — เปิดตัวเลือกของชั้นถัดไป */
export function advanceJourney(s: GameState): void {
  syncOffersFromJourney(s);
  chapterAtFinalBossGate(s);
}

/**
 * บทก่อนบอสสุดท้าย — ยิงตอน "เห็นโหนดบอสรออยู่ตรงหน้า" ไม่ใช่ตอนกดเข้า
 *
 * กดเข้าโหนดบอสแล้ว UI ผลักไปหน้าต่อสู้ทันที บทที่เปิดตอนนั้นจึงไม่มีที่ขึ้น
 * เกาะไว้กับ `advanceJourney` เพราะเป็นจุดเดียวที่แปลว่า "เดินถึงชั้นใหม่แล้ว"
 * ทุกทางที่เดินต่อผ่านตรงนี้หมด ตัวกันขึ้นซ้ำอยู่ใน `fireChapter` แล้ว
 */
function chapterAtFinalBossGate(s: GameState): void {
  const offers = s.pages?.current?.offers ?? [];
  const atGate = offers.some((o: any) => o.kind === 'boss' && o.bossType === 'final');
  if (atGate) fireChapter(s, { kind: 'final_boss' });
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

/**
 * ข้างหน้าเป็นอะไร — ใช้เขียนบนปุ่มเดินต่อ
 *
 * แผนที่แบบเส้นทางมองเห็นล่วงหน้าได้อยู่แล้ว ปุ่มที่เขียนแค่ "เดินต่อ" ลอยๆ
 * คือการทิ้งข้อมูลที่เรามีอยู่ในมือ — ผู้เล่นควรตัดสินใจได้ว่าจะเก็บของต่อ
 * หรือพอแล้ว โดยรู้ว่าอีกก้าวเดียวจะเจอบอส
 */
export type NextRowPreview = {
  kind: 'fight' | 'boss' | 'rest' | 'end';
  /** จำนวนทางเลือกในชั้นถัดไป */
  count: number;
  label: string;
};

export function nextRowPreview(s: GameState): NextRowPreview | undefined {
  if (!s.journey) return undefined;
  const here = reachableNodes(s.journey);
  if (here.length === 0) return undefined;

  const nextIds = new Set<string>();
  for (const n of here) for (const id of n.next) nextIds.add(id);
  const next = [...nextIds].map(id => s.journey!.nodes[id]).filter(Boolean);
  if (next.length === 0) return { kind: 'end', count: 0, label: 'สุดทาง' };

  const boss = next.find(n => n.offer.kind === 'boss');
  if (boss) {
    const bt = (boss.offer as any).bossType;
    const name =
      bt === 'mid' ? 'บอสกลาง'
      : bt === 'final' ? 'บอสสุดท้าย'
      : 'ศึกลับ';
    return { kind: 'boss', count: 1, label: name };
  }

  if (next.some(n => n.offer.kind === 'monster')) {
    return { kind: 'fight', count: next.length, label: `ชั้นสู้ (${next.length} ทาง)` };
  }

  return { kind: 'rest', count: next.length, label: `ชั้นพัก (${next.length} ทาง)` };
}
