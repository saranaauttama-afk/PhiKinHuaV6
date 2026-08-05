// src/core/map/restPage.ts — ชั้นพักแบบ "หน้า" ที่เคลียร์ได้ทั้งหน้า
//
// เดิมชั้นพักทำงานเหมือนชั้นสู้: เห็น 2-3 ทาง เลือกได้ทางเดียว ที่เหลือหายไป
// วัดจริง 200 รัน ผู้เล่นได้เข้าร้านปลุกเสก **0.71 ครั้งต่อรัน** และร้านสละ
// **0.45 ครั้ง** — เกินครึ่งของรันไม่ได้เจอร้านสละเลยสักครั้ง ทั้งที่ตารางราคา
// (0/20/50/90/140/200) ออกแบบมาให้ใช้ 5-6 ครั้ง และแผนที่สร้างโหนดทิ้งไปครึ่งหนึ่ง
// (สร้าง 45.5 เดินผ่านจริง 22)
//
// การเลือกแบบตัดขาดมีค่าที่ชั้นสู้ — เลือกทางแยกแล้วเจอผีคนละตัว นั่นคือการ
// ตัดสินใจจริง แต่ที่ชั้นพัก การเลือกศาลรักษาแล้วอดเจอร้านปลุกเสกที่อยู่ข้างๆ
// ไม่ได้เป็นการตัดสินใจ มันเป็นแค่การสูญเสีย
//
// ตอนนี้ชั้นพักเป็น "หน้า" แบบ Night of the Full Moon: เคลียร์ได้ทุกช่อง
// ช่องที่เคลียร์แล้วมีของใหม่ขึ้นแทน จนกว่าโควตาของรันจะหมด แล้วกดเดินต่อ
// เมื่อไหร่ก็ได้
//
// **ตัวห้ามไม่ให้บานคือโควตาต่อรัน** (`pages.pools`) ซึ่งมีอยู่แล้วตั้งแต่ยุค
// ถาดหมุน 3 ช่อง แต่กลายเป็นตัวนับที่ไม่มีใครหักตั้งแต่ย้ายมาเป็นแผนที่เดินทาง

import type { GameState } from '../types';
import type { RNG } from '../rng';
import type { PageOffer } from './pages';
import type { MapStatePages } from './pages';
import { MID_BOSS_FIGHT } from './pages';
import {
  pickRestKind, makeRestOffer, pickStoryEventId, rowIsRest, reachableNodes,
} from './journey';

type Pools = MapStatePages['pools'];

/**
 * ชนิดโหนดพัก ↔ ตัวนับโควตา
 *
 * ร้านปลุกเสก/สละแยกโควตาเป็นสองภาค (ก่อน/หลังบอสกลาง) เพราะการถอนการ์ด
 * เริ่มต้นที่ไม่เอาออกตั้งแต่ต้นรันให้ผลคนละอย่างกับถอนตอนใกล้จบ
 */
function poolKeyFor(kind: PageOffer['kind'], act: 1 | 2): keyof Pools | undefined {
  switch (kind) {
    case 'shop_card':       return 'shopCard';
    case 'shop_equipment':  return 'shopEquipment';
    case 'shop_remove':     return act === 1 ? 'shopRemove1' : 'shopRemove2';
    case 'shop_upgrade':    return act === 1 ? 'shopUpgrade1' : 'shopUpgrade2';
    case 'well':            return 'wells';
    case 'healing_shrine':  return 'healingShrine';
    case 'treasure':        return 'treasure';
    case 'treasure_single': return 'treasureSingle';
    case 'story_event':     return 'storyEvent';
    case 'fusion_altar':    return 'fusionAltar';
    default:                return undefined;
  }
}

/** ผ่านบอสกลางมาแล้วหรือยัง — ร้านปลุกเสก/สละใช้แยกภาค */
export function actOf(s: GameState): 1 | 2 {
  return (s.fightCount ?? 0) >= MID_BOSS_FIGHT ? 2 : 1;
}

/** ยืนอยู่บนชั้นพักหรือเปล่า */
export function onRestRow(s: GameState): boolean {
  if (!s.journey) return false;
  // `rowIndex` ชี้ชั้นที่ **ยืนอยู่** ส่วนตัวเลือกที่เห็นคือชั้นถัดไป
  const nodes = reachableNodes(s.journey);
  if (nodes.length === 0) return false;
  return rowIsRest(s.journey, nodes[0].row);
}

/** หักโควตาหนึ่งหน่วยตอนโหนดพักถูกเคลียร์ */
export function spendRestToken(s: GameState, offer: PageOffer): void {
  const pools = s.pages?.pools;
  if (!pools) return;
  const key = poolKeyFor(offer.kind, actOf(s));
  if (!key) return;
  if (pools[key] > 0) pools[key] -= 1;
}

/** ยังมีของเหลือให้เติมช่องอีกไหม */
export function restBudgetLeft(s: GameState): number {
  const pools = s.pages?.pools;
  if (!pools) return 0;
  const act = actOf(s);
  let total = 0;
  for (const kind of ALL_REST_KINDS) {
    const key = poolKeyFor(kind, act);
    if (key) total += Math.max(0, pools[key]);
  }
  return total;
}

const ALL_REST_KINDS: PageOffer['kind'][] = [
  'shop_card', 'shop_equipment', 'shop_remove', 'shop_upgrade',
  'well', 'healing_shrine', 'treasure', 'treasure_single',
  'story_event', 'fusion_altar',
];

/**
 * เติมของใหม่ลงช่องที่เพิ่งเคลียร์ไป
 *
 * เขียนทั้งใน `pages.current.offers` **และในตัวโหนดบนเส้นทาง** เพราะแผนที่
 * ที่วาดให้ผู้เล่นดูอ่านจาก `journey.nodes` ถ้าเขียนที่เดียวสองอันจะไม่ตรงกัน
 *
 * โควตาหมด = ช่องว่างไป ไม่ใส่อะไรแทน — ผู้เล่นเห็นชัดว่าชั้นนี้หมดของแล้ว
 * ดีกว่าเอา "เดินต่อ" มาใส่ให้เต็มช่อง เพราะปุ่มเดินต่อมีอยู่ตลอดเวลาอยู่แล้ว
 */
export function refillRestSlot(s: GameState, ix: number, r: RNG): RNG {
  const page = s.pages?.current;
  if (!s.journey || !page) return r;

  const nodes = reachableNodes(s.journey);
  const node = nodes[ix];
  if (!node) return r;

  const pools = s.pages!.pools;
  const act = actOf(s);
  const allow = (kind: PageOffer['kind']) => {
    const key = poolKeyFor(kind, act);
    return !!key && pools[key] > 0;
  };

  const kRoll = pickRestKind(r, allow); r = kRoll.rng;
  if (!kRoll.kind) {
    // ไม่มีของเหลือ — ปล่อยช่องว่างไว้ ผู้เล่นกดเดินต่อได้อยู่แล้ว
    page.offers[ix] = undefined as any;
    page.resolved[ix] = true;
    return r;
  }

  let eventId = '';
  if (kRoll.kind === 'story_event') {
    const used = usedEventIds(s);
    const ev = pickStoryEventId(r, used); r = ev.rng;
    eventId = ev.eventId;
  }

  // id ต้องไม่ซ้ำของเดิม ไม่งั้นร้านที่เคยเข้าไปแล้วจะถูกดึงจาก registry กลับมา
  // พร้อมของที่ซื้อไปแล้ว — ร้านใหม่ต้องเป็นร้านใหม่จริง
  const serial = (s.pages!._restRefills = (s.pages!._restRefills ?? 0) + 1);
  const offer = makeRestOffer(kRoll.kind, `${node.id}_r${serial}`, eventId, act);

  node.offer = offer;
  node.visited = false;
  page.offers[ix] = offer;
  page.resolved[ix] = false;
  return r;
}

/** เหตุการณ์ที่เคยโผล่บนเส้นทางนี้แล้ว — กันเจอเรื่องเดิมซ้ำ */
function usedEventIds(s: GameState): string[] {
  const out: string[] = [];
  for (const n of Object.values(s.journey?.nodes ?? {})) {
    const id = (n.offer as any).eventId;
    if (id) out.push(id);
  }
  return out;
}
