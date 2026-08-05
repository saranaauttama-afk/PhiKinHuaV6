// src/core/map/journey.ts — แผนที่แบบเส้นทาง แทนถาดหมุน 3 ช่อง
//
// เดิมแผนที่เป็นช่อง 3 ช่องที่สุ่มตัวเองใหม่ทุกครั้งที่เคลียร์ (Dynamic Refresh)
// ผู้เล่นไม่เคยเห็นว่าข้างหน้ามีอะไร ไม่รู้ว่าเดินมาไกลแค่ไหน เหมือนหยิบของ
// จากถาดหมุนมากกว่าการเดินทาง
//
// ตอนนี้เป็นกราฟแบบชั้น (row) ที่มองเห็นล่วงหน้าได้ทั้งเส้น เลือกทางแยกเองได้
// และบอสอยู่ตรงจุดที่มองเห็นแต่ไกล
//
// **สิ่งที่จงใจไม่เปลี่ยน**: `ChooseOffer` / `CompleteNode` และ handler ของ
// ร้าน/event ยังทำงานเหมือนเดิมทุกอย่าง โดยให้ `pages.current.offers` กลายเป็น
// "โหนดที่เดินไปได้ตอนนี้" แทน "ของในถาด" — เปลี่ยนที่มาของตัวเลือก ไม่ใช่กลไก

import type { RNG } from '../rng';
import { int, next } from '../rng';
import type { PageOffer } from './pages';
import {
  MID_BOSS_FIGHT, FINAL_BOSS_FIGHT, SECRET_BOSS_FIGHT,
} from './pages';
import {
  getTierForFight, getRandomMonsterFromTier, eliteChanceForFight,
  eliteSubPoolForFight, THAI_GHOST_POOLS,
} from '../monsters/thai-ghosts';
import { STORY_EVENTS } from '../events/story';

export type JourneyNode = {
  id: string;
  row: number;
  col: number;
  offer: PageOffer;
  /** โหนดในชั้นถัดไปที่เดินต่อจากตรงนี้ได้ */
  next: string[];
  visited?: boolean;
};

/** ชั้นหนึ่งเป็นชั้นสู้ ชั้นบอส หรือชั้นพัก */
export type RowPlan =
  | { kind: 'fight'; fightIndex: number }
  | { kind: 'boss'; fightIndex: number; bossType: 'mid' | 'final' | 'secret' }
  | { kind: 'rest' };

export type JourneyMap = {
  nodes: Record<string, JourneyNode>;
  /** id ของโหนดเรียงตามชั้น — ใช้วาดแผนที่ */
  rows: string[][];
  /** ผังของแต่ละชั้น เก็บไว้เพื่อวาดแผนที่และต่อชั้นทีหลังได้ */
  plans: RowPlan[];
  /** โหนดที่ยืนอยู่ (undefined = ยังไม่ออกเดินทาง) */
  currentId?: string;
  /** ชั้นที่กำลังจะเลือก */
  rowIndex: number;
};

/** จำผีที่เพิ่งวางไปกี่ตัว เพื่อไม่ให้เจอตัวเดิมซ้ำใกล้ๆ กัน (เงื่อนไขแบบผ่อนได้) */
const RECENT_MEMORY = 6;

/**
 * ชั้นสู้กว้าง 2 เสมอ
 *
 * ไม่ใช่แค่เรื่องหน้าจอ — pool ของผีบาง tier มีแค่ 3 ตน ถ้าชั้นสู้กว้าง 3
 * ชั้นถัดไปจะมีโหนดที่ทุกทางเข้ามาจากผีครบทั้ง pool จนเลี่ยงการเจอตัวเดิม
 * สองไฟต์ติดกันไม่ได้ กว้าง 2 ทำให้เหลือตัวเลือกที่ไม่ซ้ำเสมอ
 */
const FIGHT_ROW_WIDTH = 2;

/**
 * ผังของเส้นทางทั้งรัน
 *
 * ยังคงโครง 15 ไฟต์ตาม gameSpec ไว้เป๊ะ (บอสกลางที่ 7, บอสสุดท้ายที่ 15)
 * แต่แทรกชั้นพักคั่นเพื่อให้รู้สึกเป็นการเดินทาง ไม่ใช่ไฟต์ติดกันรวด
 * และมีชั้นพักก่อนบอสเสมอ เพื่อให้เตรียมตัวได้
 */
export function planRows(secretUnlocked = false): RowPlan[] {
  const plan: RowPlan[] = [];
  let sinceRest = 0;

  /** แทรกชั้นพัก — ไม่ซ้อนสองชั้นติดกัน */
  const pushRest = () => {
    if (plan[plan.length - 1]?.kind !== 'rest') plan.push({ kind: 'rest' });
    sinceRest = 0;
  };

  const lastFight = secretUnlocked ? SECRET_BOSS_FIGHT : FINAL_BOSS_FIGHT;

  for (let fight = 1; fight <= lastFight; fight++) {
    const bossType =
      fight === MID_BOSS_FIGHT ? 'mid'
      : fight === FINAL_BOSS_FIGHT ? 'final'
      : fight === SECRET_BOSS_FIGHT ? 'secret'
      : null;

    if (bossType) {
      pushRest();                           // พักก่อนบอสเสมอ
      plan.push({ kind: 'boss', fightIndex: fight, bossType });
      // บอสนับเป็นไฟต์ในสายด้วย ไม่งั้นจะได้ บอส → สู้ → สู้ ติดกันสามชั้น
      sinceRest = 1;
      continue;
    }

    plan.push({ kind: 'fight', fightIndex: fight });
    sinceRest++;
    if (sinceRest >= 2) pushRest();
  }

  return plan;
}

/** ผังของศึกลับที่ต่อท้ายเมื่อปลดล็อคได้ — พักหนึ่งชั้นแล้วเจอพระยามัจจุราช */
export function planSecretRows(): RowPlan[] {
  return [
    { kind: 'rest' },
    { kind: 'boss', fightIndex: SECRET_BOSS_FIGHT, bossType: 'secret' },
  ];
}

/**
 * ชนิดของโหนดพัก พร้อมน้ำหนัก
 *
 * เหตุการณ์เล่าเรื่องได้น้ำหนักสูงสุด เพราะเป็นสิ่งที่ทำให้ชั้นพักรู้สึกเป็น
 * "เรื่องที่เกิดขึ้นระหว่างทาง" ไม่ใช่แค่แถวปุ่มฟังก์ชันให้กดก่อนไปสู้ต่อ
 */
const REST_WEIGHTS: Array<[PageOffer['kind'], number]> = [
  ['story_event', 8],
  ['shop_card', 3],
  ['healing_shrine', 3],
  ['fusion_altar', 3],
  // ปลุกเสก/สละการ์ด — สองอย่างนี้มีระบบครบมาตั้งแต่ต้น (handler, ราคาที่แพงขึ้น
  // ตามจำนวนครั้ง, หน้าร้าน, ช่องรูป) แต่ตอนย้ายจากถาดหมุนมาเป็นแผนที่เดินทาง
  // มันตกจากตารางนี้ไป กลายเป็นโค้ดที่เดินไปไม่ถึงมาตลอด
  //
  // วัดแล้วสำรับโตจาก ~11 ใบเป็น ~13-17 ใบต่อรัน ซึ่งไม่ได้บวม สองร้านนี้จึงไม่ได้
  // มีไว้แก้สำรับล้น แต่มีไว้ให้เลือกได้ว่าสำรับจะคมขึ้นทางไหน
  // สละได้น้ำหนักน้อยกว่า เพราะถอนใบเสียออกให้ผลแรงกว่าปลุกเสกใบดีขึ้นหนึ่งขั้น
  ['shop_upgrade', 3],
  ['shop_remove', 2],
  ['treasure', 2],
  ['shop_equipment', 2],
  ['well', 2],
  ['treasure_single', 2],
];

/**
 * สุ่มชนิดโหนดพักหนึ่งชนิด
 *
 * @param allow กรองชนิดที่ยังเหลือโควตา — ตอนสร้างแผนที่ไม่กรอง (ยังไม่รู้ว่า
 *              ผู้เล่นจะเดินทางไหน) ตอนเติมช่องบนชั้นพักถึงจะกรองตามโควตาที่เหลือ
 *              คืน `undefined` เมื่อไม่มีชนิดไหนเหลือแล้ว
 */
export function pickRestKind(
  r: RNG,
  allow?: (kind: PageOffer['kind']) => boolean
): { kind: PageOffer['kind'] | undefined; rng: RNG } {
  const pool = allow ? REST_WEIGHTS.filter(([k]) => allow(k)) : REST_WEIGHTS;
  if (pool.length === 0) return { kind: undefined, rng: r };

  const total = pool.reduce((a, [, w]) => a + w, 0);
  const roll = int(r, 1, total);
  let acc = 0;
  for (const [kind, w] of pool) {
    acc += w;
    if (roll.value <= acc) return { kind, rng: roll.rng };
  }
  return { kind: pool[0][0], rng: roll.rng };
}

/** ชนิดโหนดพักทั้งหมดที่มีในตาราง — ใช้ผูกกับตัวนับโควตา */
export function restKinds(): PageOffer['kind'][] {
  return REST_WEIGHTS.map(([k]) => k);
}

/**
 * เหตุการณ์เล่าเรื่องที่ยังไม่เคยเจอในรันนี้ — เจอเรื่องเดิมสองรอบแล้วมนตร์ขลังหายหมด
 * ถ้าเจอครบทุกเรื่องแล้วค่อยยอมให้ซ้ำ
 */
export function pickStoryEventId(r: RNG, usedEvents: string[]): { eventId: string; rng: RNG } {
  const fresh = STORY_EVENTS.filter(e => !usedEvents.includes(e.id));
  const pool = fresh.length > 0 ? fresh : STORY_EVENTS;
  const pick = int(r, 0, pool.length - 1);
  return { eventId: pool[pick.value].id, rng: pick.rng };
}

/**
 * @param act ภาคที่ 1 (ก่อนบอสกลาง) หรือ 2 — ร้านปลุกเสก/สละต้องรู้
 *            เพราะโครงสร้าง offer ของสองชนิดนี้มีฟิลด์ `phase` ติดมาแต่เดิม
 */
export function makeRestOffer(
  kind: PageOffer['kind'], id: string, eventId = '', act: 1 | 2 = 1
): PageOffer {
  switch (kind) {
    case 'shop_card':       return { kind, shopId: `${id}_shop_card` };
    case 'shop_equipment':  return { kind, shopId: `${id}_shop_equip` };
    case 'shop_remove':     return { kind, shopId: `${id}_remove`,  phase: act };
    case 'shop_upgrade':    return { kind, shopId: `${id}_upgrade`, phase: act };
    case 'healing_shrine':  return { kind, shopId: `${id}_shrine` };
    case 'well':            return { kind, shopId: `${id}_well` };
    case 'treasure':        return { kind, shopId: `${id}_treasure` };
    case 'treasure_single': return { kind, shopId: `${id}_treasure1` };
    case 'fusion_altar':    return { kind, shopId: `${id}_fusion` };
    case 'story_event':     return { kind, shopId: `${id}_event`, eventId };
    default:                return { kind: 'shop_card', shopId: `${id}_shop_card` };
  }
}

function isFightOffer(o: PageOffer): o is Extract<PageOffer, { kind: 'monster' | 'boss' }> {
  return o.kind === 'monster' || o.kind === 'boss';
}

function widthFor(plan: RowPlan, r: RNG): { width: number; rng: RNG } {
  if (plan.kind === 'boss') return { width: 1, rng: r };
  if (plan.kind === 'fight') return { width: FIGHT_ROW_WIDTH, rng: r };
  const roll = int(r, 2, 3);
  return { width: roll.value, rng: roll.rng };
}

/**
 * เชื่อมชั้นหนึ่งเข้ากับชั้นถัดไป
 * แบบเดียวกับแผนที่ roguelike ทั่วไป — ทางแยกมีจริง แต่ไม่มีโหนดที่ไปไม่ถึง
 */
function linkRow(edges: Record<string, string[]>, cur: string[], nxt: string[]): void {
  for (let c = 0; c < cur.length; c++) {
    // แม็ปตำแหน่งตามสัดส่วน แล้วต่อไปยังตัวเองกับเพื่อนบ้าน
    const center = nxt.length === 1 ? 0 : Math.round((c / Math.max(1, cur.length - 1)) * (nxt.length - 1));
    const targets = new Set<number>([center]);
    if (center - 1 >= 0) targets.add(center - 1);
    if (center + 1 < nxt.length) targets.add(center + 1);
    edges[cur[c]] = [...targets].sort((a, b) => a - b).map(t => nxt[t]);
  }

  // กันโหนดกำพร้า: ทุกโหนดในชั้นถัดไปต้องมีทางเข้าอย่างน้อยหนึ่งทาง
  for (let t = 0; t < nxt.length; t++) {
    const hasIncoming = cur.some(cid => (edges[cid] ?? []).includes(nxt[t]));
    if (!hasIncoming) {
      const nearest = Math.min(cur.length - 1, Math.round((t / Math.max(1, nxt.length - 1)) * (cur.length - 1)));
      (edges[cur[nearest]] ??= []).push(nxt[t]);
    }
  }
}

/**
 * ผีตัวสุดท้ายที่เจอได้ก่อนถึงโหนดนี้ (รวมทุกทางที่เดินมาได้)
 *
 * ต้องรู้ทั้งชุด ไม่ใช่แค่ตัวเดียว เพราะโหนดหนึ่งมีทางเข้าได้หลายทาง
 * ผู้เล่นที่เดินมาคนละทางจะเพิ่งสู้กับผีคนละตน
 */
function precedingEnemiesOf(
  nodeId: string,
  preds: Record<string, string[]>,
  nodes: Record<string, JourneyNode>,
  memo: Record<string, string[]>
): string[] {
  const out = new Set<string>();
  for (const p of preds[nodeId] ?? []) {
    const node = nodes[p];
    if (!node) continue;
    if (isFightOffer(node.offer)) out.add(node.offer.enemyId);
    else for (const e of memo[p] ?? []) out.add(e);
  }
  return [...out];
}

/** เลือกผีให้โหนดสู้หนึ่งโหนด */
function pickMonster(
  fightIndex: number,
  r: RNG,
  banned: string[],
  inRow: string[],
  recent: string[]
): { offer: PageOffer; rng: RNG } {
  const eliteRoll = next(r); r = eliteRoll.rng;
  const isElite = eliteRoll.value < eliteChanceForFight(fightIndex);

  let ghostTier: keyof typeof THAI_GHOST_POOLS;
  if (isElite) {
    ghostTier = 'Elite';
  } else {
    const tr = getTierForFight(fightIndex, r); r = tr.rng;
    ghostTier = tr.tier;
    if (ghostTier === 'Elite' || ghostTier.includes('Boss')) {
      const f = fightIndex;
      ghostTier = f <= 2 ? 'T1' : f <= 4 ? 'T2' : f <= 6 ? 'T3' : f <= 9 ? 'T4' : 'T5';
    }
  }

  // Elite ยังไล่ระดับตามช่วงไฟต์ ไม่ใช่สุ่มจากทั้ง pool
  const poolFor = (t: keyof typeof THAI_GHOST_POOLS) =>
    t === 'Elite' ? eliteSubPoolForFight(fightIndex) : THAI_GHOST_POOLS[t];

  /**
   * เงื่อนไขแข็งสองข้อ ผ่อนไม่ได้ทั้งคู่:
   *   `banned` — ผีที่ผู้เล่นอาจเพิ่งสู้มาเมื่อกี้ (ห้ามเจอตัวเดิมสองไฟต์ติด)
   *   `inRow`  — ผีที่อยู่อีกทางของแถวเดียวกัน (ทางแยกที่สองทางเหมือนกันไม่ใช่ทางแยก)
   *
   * เดิม `inRow` ถูกผ่อนทิ้งเป็นขั้นสุดท้ายเวลาตัวเลือกเหลือน้อย ผลคือบางแถว
   * มีผีตัวเดียวกันทั้งสองฝั่ง — วัดได้จริง 1-2 แถวต่อรัน
   */
  const hardOk = (id: string) => !banned.includes(id) && !inRow.includes(id);

  // pool ของบาง tier มีแค่ 3 ตน ถ้าชนเงื่อนไขจนหมดให้ขยับ tier แทนที่จะยอมซ้ำ
  // ไล่ขึ้นก่อนเพราะเจอผีแรงกว่านิดหน่อยดีกว่าเจอตัวเดิมซ้ำ
  const ORDER: (keyof typeof THAI_GHOST_POOLS)[] = ['T1', 'T2', 'T3', 'T4', 'T5', 'Elite'];
  const startAt = ORDER.indexOf(ghostTier);
  const tierTry: (keyof typeof THAI_GHOST_POOLS)[] = [
    ghostTier,
    ...ORDER.slice(startAt + 1),
    ...ORDER.slice(0, Math.max(0, startAt)).reverse(),
  ];

  let chosenTier = ghostTier;
  let choices = poolFor(ghostTier).filter(m => hardOk(m.id));

  for (const t of tierTry) {
    const ok = poolFor(t).filter(m => hardOk(m.id));
    if (ok.length > 0) { chosenTier = t; choices = ok; break; }
  }

  // ทุก tier ชนหมดจริงๆ (ไม่ควรเกิด แต่ต้องไม่ crash) — ยอมผ่อน inRow เป็นอันสุดท้าย
  if (choices.length === 0) {
    choices = poolFor(ghostTier).filter(m => !banned.includes(m.id));
    if (choices.length === 0) choices = poolFor(ghostTier);
  }

  // `recent` เป็นเงื่อนไขอ่อน — ใช้เพื่อความหลากหลาย ผ่อนได้ถ้าชนกับเงื่อนไขแข็ง
  const fresh = choices.filter(m => !recent.includes(m.id));
  const finalChoices = fresh.length > 0 ? fresh : choices;

  const pick = int(r, 0, finalChoices.length - 1); r = pick.rng;
  const monster = finalChoices[pick.value];

  return {
    offer: {
      kind: 'monster',
      tier: chosenTier === 'Elite' ? 'elite' : 'normal',
      enemyId: monster.id,
    },
    rng: r,
  };
}

/**
 * สร้างชั้นใหม่ต่อท้ายแผนที่ที่มีอยู่
 *
 * ทำสองรอบ: วางโครง + เชื่อมเส้นก่อน แล้วค่อยเติมเนื้อหา เพราะการเลือกผี
 * ต้องรู้ก่อนว่าโหนดนี้เดินมาจากไหนได้บ้าง ถึงจะกันการเจอผีตัวเดิมสองไฟต์ติดกันได้
 */
function growJourney(j: JourneyMap, plan: RowPlan[], r: RNG): RNG {
  if (plan.length === 0) return r;

  const startIdx = j.rows.length;
  const prevLast = j.rows[j.rows.length - 1];

  // ── รอบที่ 1: โครงและเส้นเชื่อม
  const edges: Record<string, string[]> = {};
  for (const id of Object.keys(j.nodes)) edges[id] = [...j.nodes[id].next];

  const added: string[][] = [];
  plan.forEach((rowPlan, i) => {
    const w = widthFor(rowPlan, r); r = w.rng;
    const ids: string[] = [];
    for (let col = 0; col < w.width; col++) ids.push(`n${startIdx + i}_${col}`);
    added.push(ids);
  });

  if (prevLast) linkRow(edges, prevLast, added[0]);
  for (let i = 0; i < added.length - 1; i++) linkRow(edges, added[i], added[i + 1]);

  // เส้นเชื่อมของชั้นเก่าอาจเปลี่ยน (ชั้นสุดท้ายเดิมเพิ่งมีทางออก)
  for (const id of Object.keys(j.nodes)) j.nodes[id].next = edges[id] ?? [];

  // ── รอบที่ 2: เติมเนื้อหา
  const preds: Record<string, string[]> = {};
  for (const [from, tos] of Object.entries(edges)) {
    for (const to of tos) (preds[to] ??= []).push(from);
  }

  // ผีที่เจอได้ก่อนถึงโหนดนั้น ของชั้นเดิมที่เติมไว้แล้ว
  const memo: Record<string, string[]> = {};
  for (const row of j.rows) {
    for (const id of row) memo[id] = precedingEnemiesOf(id, preds, j.nodes, memo);
  }

  const usedMonsters = j.rows
    .flat()
    .map(id => (j.nodes[id].offer as any).enemyId as string | undefined)
    .filter((x): x is string => !!x);

  const usedEvents = j.rows
    .flat()
    .map(id => (j.nodes[id].offer as any).eventId as string | undefined)
    .filter((x): x is string => !!x);

  /** ผ่านบอสกลางมาแล้วหรือยัง ณ ชั้นที่กำลังเติม — ร้านปลุกเสก/สละใช้แยกภาค */
  const fightsBefore = (upto: number) =>
    j.plans.filter(p => p.kind !== 'rest').length
    + plan.slice(0, upto).filter(p => p.kind !== 'rest').length;

  added.forEach((ids, i) => {
    const rowPlan = plan[i];
    const rowIdx = startIdx + i;
    const inRow: string[] = [];
    const act: 1 | 2 = fightsBefore(i) >= MID_BOSS_FIGHT ? 2 : 1;

    ids.forEach((id, col) => {
      // โหนดยังไม่มี offer — ใส่ placeholder ไว้ก่อนเพื่อให้ precedingEnemiesOf อ่านได้
      j.nodes[id] = { id, row: rowIdx, col, offer: { kind: 'next_event' }, next: edges[id] ?? [] };

      const banned = precedingEnemiesOf(id, preds, j.nodes, memo);

      if (rowPlan.kind === 'boss') {
        const tier: keyof typeof THAI_GHOST_POOLS =
          rowPlan.bossType === 'mid' ? 'BossMid'
          : rowPlan.bossType === 'final' ? 'BossFinal'
          : 'SecretBoss';
        const picked = getRandomMonsterFromTier(tier, r); r = picked.rng;
        j.nodes[id].offer = { kind: 'boss', bossType: rowPlan.bossType, enemyId: picked.monster.id };
        inRow.push(picked.monster.id);
        usedMonsters.push(picked.monster.id);
        memo[id] = [picked.monster.id];

      } else if (rowPlan.kind === 'fight') {
        const out = pickMonster(
          rowPlan.fightIndex, r, banned, inRow, usedMonsters.slice(-RECENT_MEMORY)
        );
        r = out.rng;
        j.nodes[id].offer = out.offer;
        const eid = (out.offer as any).enemyId as string;
        inRow.push(eid);
        usedMonsters.push(eid);
        memo[id] = [eid];

      } else {
        const kRoll = pickRestKind(r); r = kRoll.rng;
        const kind = kRoll.kind ?? 'shop_card';

        let eventId = '';
        if (kind === 'story_event') {
          const ev = pickStoryEventId(r, usedEvents); r = ev.rng;
          eventId = ev.eventId;
          usedEvents.push(eventId);
        }

        j.nodes[id].offer = makeRestOffer(kind, id, eventId, act);
        memo[id] = banned;
      }
    });
  });

  j.rows.push(...added);
  j.plans.push(...plan);
  return r;
}

/** สร้างเส้นทางทั้งรันไว้ล่วงหน้า เพื่อให้ผู้เล่นมองเห็นได้ทั้งเส้น */
export function buildJourney(r: RNG, secretUnlocked = false): { journey: JourneyMap; rng: RNG } {
  const journey: JourneyMap = { nodes: {}, rows: [], plans: [], rowIndex: 0 };
  const rng = growJourney(journey, planRows(secretUnlocked), r);
  return { journey, rng };
}

/**
 * ต่อชั้นใหม่ท้ายเส้นทางที่เดินอยู่
 *
 * ใช้ตอนปลดล็อคศึกลับ — ถ้าสร้างศึกลับไว้ตั้งแต่ต้นรัน ผู้เล่นจะเห็นมันรออยู่
 * บนแผนที่ทั้งที่ยังไม่รู้ว่าจะได้สู้หรือเปล่า เสียความหมายของคำว่า "ลับ"
 */
export function appendRows(j: JourneyMap, plan: RowPlan[], r: RNG): RNG {
  return growJourney(j, plan, r);
}

/** โหนดที่เดินไปได้ตอนนี้ */
export function reachableNodes(j: JourneyMap): JourneyNode[] {
  if (!j.currentId) {
    return (j.rows[0] ?? []).map(id => j.nodes[id]).filter(Boolean);
  }
  const cur = j.nodes[j.currentId];
  if (!cur) return [];
  return cur.next.map(id => j.nodes[id]).filter(Boolean);
}

/** ย้ายไปยืนที่โหนดนั้น */
export function moveTo(j: JourneyMap, nodeId: string): void {
  const node = j.nodes[nodeId];
  if (!node) return;
  node.visited = true;
  j.currentId = nodeId;
  j.rowIndex = node.row;
}

/** เดินจนจบเส้นทางแล้วหรือยัง */
export function isJourneyComplete(j: JourneyMap): boolean {
  if (!j.currentId) return false;
  return j.nodes[j.currentId]?.next.length === 0;
}

/** ชั้นนี้เป็นชั้นสู้ไหม (ใช้วาดแผนที่) */
export function rowIsFight(j: JourneyMap, rowIdx: number): boolean {
  const p = j.plans[rowIdx];
  return !!p && p.kind !== 'rest';
}

/** ชั้นนี้เป็นชั้นพักไหม — ชั้นพักเคลียร์ได้ทุกช่อง ชั้นสู้เลือกได้ทางเดียว */
export function rowIsRest(j: JourneyMap, rowIdx: number): boolean {
  return j.plans[rowIdx]?.kind === 'rest';
}

/** จำนวนชั้นสู้ทั้งเส้นทาง (ใช้แสดงความคืบหน้า) */
export function totalFightRows(j: JourneyMap): number {
  return j.plans.filter(p => p.kind !== 'rest').length;
}
