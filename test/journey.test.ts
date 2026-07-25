import { describe, it, expect } from 'vitest';
import { makeRng } from '../src/core/rng';
import {
  buildJourney, planRows, planSecretRows, appendRows,
  reachableNodes, moveTo, isJourneyComplete, totalFightRows,
  type JourneyMap, type JourneyNode,
} from '../src/core/map/journey';
import {
  MID_BOSS_FIGHT, FINAL_BOSS_FIGHT, SECRET_BOSS_FIGHT,
} from '../src/core/map/pages';
import { THAI_GHOST_POOLS } from '../src/core/monsters/thai-ghosts';

/**
 * แผนที่แบบเดินทาง — แทนถาดหมุน 3 ช่องแบบเดิม
 *
 * ของเดิมช่องที่เคลียร์แล้วจะถูกสุ่มใหม่ทันที (Dynamic Refresh) ผู้เล่นจึงไม่เคย
 * เห็นว่าข้างหน้ามีอะไร ไม่รู้ว่าเดินมาไกลแค่ไหน และ `pageIndex` ก็ค้างที่ 0 ตลอด
 * เพราะไม่มีการเปลี่ยนหน้าจริง
 *
 * ตอนนี้เส้นทางถูกวางไว้ล่วงหน้าทั้งรัน มองเห็นได้ทั้งเส้น และเลือกทางแยกเองได้
 */

const SEEDS = ['j-1', 'j-2', 'j-3', 'j-4', 'j-5', 'j-6'];

const isFight = (n: JourneyNode) => n.offer.kind === 'monster' || n.offer.kind === 'boss';
const enemyIdOf = (n: JourneyNode) => (n.offer as any).enemyId as string;

/** โหนดทั้งหมดที่เดินเข้ามาที่ `id` ได้ */
function predecessorsOf(j: JourneyMap): Record<string, string[]> {
  const preds: Record<string, string[]> = {};
  for (const id of Object.keys(j.nodes)) {
    for (const nx of j.nodes[id].next) (preds[nx] ??= []).push(id);
  }
  return preds;
}

/**
 * ผีตัวสุดท้ายที่ผู้เล่นอาจเพิ่งสู้ ก่อนมาถึงโหนดนี้ (รวมทุกทางที่เดินมาได้)
 * คำนวณแยกจากโค้ดจริง เพื่อให้เทสต์ตรวจสอบผลลัพธ์ ไม่ใช่ลอกวิธีคิดมา
 */
function precedingEnemies(j: JourneyMap): Record<string, Set<string>> {
  const preds = predecessorsOf(j);
  const memo: Record<string, Set<string>> = {};

  for (const row of j.rows) {
    for (const id of row) {
      const acc = new Set<string>();
      for (const p of preds[id] ?? []) {
        const pn = j.nodes[p];
        if (isFight(pn)) acc.add(enemyIdOf(pn));
        else for (const e of memo[p] ?? []) acc.add(e);
      }
      memo[id] = acc;
    }
  }
  return memo;
}

describe('ผังของเส้นทาง', () => {
  it('ยังเป็น 15 ไฟต์ บอสกลางที่ 7 บอสสุดท้ายที่ 15 ตามสเปคเดิม', () => {
    const plan = planRows();
    const fights = plan.filter(p => p.kind !== 'rest');

    expect(fights).toHaveLength(FINAL_BOSS_FIGHT);
    fights.forEach((p, i) => {
      expect((p as any).fightIndex).toBe(i + 1);
    });

    expect(fights[MID_BOSS_FIGHT - 1]).toMatchObject({ kind: 'boss', bossType: 'mid' });
    expect(fights[FINAL_BOSS_FIGHT - 1]).toMatchObject({ kind: 'boss', bossType: 'final' });
  });

  it('มีชั้นพักก่อนบอสเสมอ', () => {
    const plan = planRows();
    plan.forEach((p, i) => {
      if (p.kind !== 'boss') return;
      expect(plan[i - 1], `บอสที่ไฟต์ ${p.fightIndex}`).toMatchObject({ kind: 'rest' });
    });
  });

  it('ไม่มีไฟต์ติดกันเกินสองครั้งโดยไม่ได้พัก', () => {
    let streak = 0;
    for (const p of planRows()) {
      if (p.kind === 'rest') { streak = 0; continue; }
      streak++;
      expect(streak).toBeLessThanOrEqual(2);
    }
  });
});

describe('โครงสร้างกราฟ', () => {
  it('ทุกโหนดเดินถึงได้จากชั้นแรก', () => {
    for (const seed of SEEDS) {
      const { journey } = buildJourney(makeRng(seed));
      const reached = new Set(journey.rows[0]);
      for (const row of journey.rows) {
        for (const id of row) {
          if (!reached.has(id)) continue;
          for (const nx of journey.nodes[id].next) reached.add(nx);
        }
      }
      expect(reached.size, `seed ${seed}`).toBe(journey.rows.flat().length);
    }
  });

  it('ไม่มีทางตัน — ทุกชั้นยกเว้นชั้นสุดท้ายมีทางออก', () => {
    for (const seed of SEEDS) {
      const { journey } = buildJourney(makeRng(seed));
      for (let i = 0; i < journey.rows.length - 1; i++) {
        for (const id of journey.rows[i]) {
          expect(journey.nodes[id].next.length, `seed ${seed} โหนด ${id}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('เส้นเชื่อมชี้ไปชั้นถัดไปเท่านั้น — เดินย้อนกลับหรือกระโดดข้ามไม่ได้', () => {
    for (const seed of SEEDS) {
      const { journey } = buildJourney(makeRng(seed));
      for (const node of Object.values(journey.nodes)) {
        for (const nx of node.next) {
          expect(journey.nodes[nx].row, `seed ${seed} ${node.id}→${nx}`).toBe(node.row + 1);
        }
      }
    }
  });

  it('ชั้นบอสมีทางเดียว ชั้นสู้มีสองทาง ชั้นพักมีสองถึงสามทาง', () => {
    for (const seed of SEEDS) {
      const { journey } = buildJourney(makeRng(seed));
      journey.rows.forEach((row, i) => {
        const plan = journey.plans[i];
        if (plan.kind === 'boss') expect(row, `seed ${seed} ชั้น ${i}`).toHaveLength(1);
        else if (plan.kind === 'fight') expect(row, `seed ${seed} ชั้น ${i}`).toHaveLength(2);
        else {
          expect(row.length, `seed ${seed} ชั้น ${i}`).toBeGreaterThanOrEqual(2);
          expect(row.length, `seed ${seed} ชั้น ${i}`).toBeLessThanOrEqual(3);
        }
      });
    }
  });

  it('ปลายทางคือบอสสุดท้าย', () => {
    for (const seed of SEEDS) {
      const { journey } = buildJourney(makeRng(seed));
      const last = journey.rows[journey.rows.length - 1];
      expect(last).toHaveLength(1);
      expect(journey.nodes[last[0]].offer).toMatchObject({ kind: 'boss', bossType: 'final' });
      expect(journey.nodes[last[0]].next).toEqual([]);
    }
  });

  it('จำนวนชั้นสู้ตรงกับจำนวนไฟต์ในสเปค', () => {
    const { journey } = buildJourney(makeRng('count'));
    expect(totalFightRows(journey)).toBe(FINAL_BOSS_FIGHT);
  });
});

describe('เนื้อหาบนเส้นทาง', () => {
  it('ไม่ว่าจะเดินทางไหน ก็ไม่เจอผีตัวเดิมสองไฟต์ติดกัน', () => {
    for (const seed of SEEDS) {
      const { journey } = buildJourney(makeRng(seed));
      const before = precedingEnemies(journey);

      for (const node of Object.values(journey.nodes)) {
        if (!isFight(node)) continue;
        expect(
          [...before[node.id]],
          `seed ${seed} โหนด ${node.id} (${enemyIdOf(node)})`
        ).not.toContain(enemyIdOf(node));
      }
    }
  });

  it('บอสมาจาก pool ของบอส และไฟต์ปกติไม่ใช่บอส', () => {
    const bossIds = new Set([
      ...THAI_GHOST_POOLS.BossMid.map(m => m.id),
      ...THAI_GHOST_POOLS.BossFinal.map(m => m.id),
      ...THAI_GHOST_POOLS.SecretBoss.map(m => m.id),
    ]);

    for (const seed of SEEDS) {
      const { journey } = buildJourney(makeRng(seed));
      for (const node of Object.values(journey.nodes)) {
        if (node.offer.kind === 'boss') expect(bossIds).toContain(node.offer.enemyId);
        if (node.offer.kind === 'monster') expect(bossIds.has(node.offer.enemyId)).toBe(false);
      }
    }
  });

  it('โหนดชั้นพักมี shopId ไม่ซ้ำกันทั้งแผนที่', () => {
    for (const seed of SEEDS) {
      const { journey } = buildJourney(makeRng(seed));
      const ids = Object.values(journey.nodes)
        .map(n => (n.offer as any).shopId as string | undefined)
        .filter((x): x is string => !!x);
      expect(new Set(ids).size, `seed ${seed}`).toBe(ids.length);
    }
  });
});

describe('เดินทาง', () => {
  it('ยังไม่ออกเดินทาง → ตัวเลือกคือชั้นแรก', () => {
    const { journey } = buildJourney(makeRng('walk'));
    expect(reachableNodes(journey).map(n => n.id)).toEqual(journey.rows[0]);
    expect(isJourneyComplete(journey)).toBe(false);
  });

  it('ย้ายไปโหนดไหน ตัวเลือกถัดไปคือทางออกของโหนดนั้น', () => {
    const { journey } = buildJourney(makeRng('walk'));
    const first = journey.rows[0][0];
    moveTo(journey, first);

    expect(journey.currentId).toBe(first);
    expect(journey.rowIndex).toBe(0);
    expect(journey.nodes[first].visited).toBe(true);
    expect(reachableNodes(journey).map(n => n.id)).toEqual(journey.nodes[first].next);
  });

  it('เดินถึงปลายทางแล้วถือว่าจบเส้นทาง', () => {
    const { journey } = buildJourney(makeRng('walk'));
    const last = journey.rows[journey.rows.length - 1][0];
    moveTo(journey, last);
    expect(isJourneyComplete(journey)).toBe(true);
    expect(reachableNodes(journey)).toEqual([]);
  });
});

describe('ต่อชั้นศึกลับ', () => {
  it('ก่อนปลดล็อค ศึกลับไม่โผล่บนแผนที่เลย', () => {
    const { journey } = buildJourney(makeRng('secret'));
    const secretIds = THAI_GHOST_POOLS.SecretBoss.map(m => m.id);
    for (const node of Object.values(journey.nodes)) {
      expect(secretIds).not.toContain((node.offer as any).enemyId);
    }
  });

  it('ปลดล็อคแล้วมีชั้นพักและชั้นศึกลับต่อท้าย พร้อมทางเดินไปถึง', () => {
    const { journey, rng } = buildJourney(makeRng('secret'));
    const oldLast = journey.rows[journey.rows.length - 1][0];
    const rowsBefore = journey.rows.length;

    appendRows(journey, planSecretRows(), rng);

    expect(journey.rows).toHaveLength(rowsBefore + 2);
    // บอสสุดท้ายเดิมเคยเป็นปลายทาง ตอนนี้ต้องมีทางเดินต่อ
    expect(journey.nodes[oldLast].next.length).toBeGreaterThan(0);

    const newLast = journey.rows[journey.rows.length - 1];
    expect(newLast).toHaveLength(1);
    expect(journey.nodes[newLast[0]].offer).toMatchObject({ kind: 'boss', bossType: 'secret' });
    expect(journey.plans[journey.plans.length - 1]).toMatchObject({
      kind: 'boss', fightIndex: SECRET_BOSS_FIGHT,
    });

    // ชั้นที่แทรกเข้ามาเป็นชั้นพัก และเดินถึงได้จากบอสสุดท้าย
    const restRow = journey.rows[rowsBefore];
    expect(journey.plans[rowsBefore]).toMatchObject({ kind: 'rest' });
    for (const id of journey.nodes[oldLast].next) expect(restRow).toContain(id);
  });
});

describe('ซ้ำได้ตาม seed', () => {
  it('seed เดียวกัน → เส้นทางเดียวกันเป๊ะ', () => {
    for (const seed of SEEDS) {
      const a = buildJourney(makeRng(seed)).journey;
      const b = buildJourney(makeRng(seed)).journey;
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });

  it('seed ต่างกัน → เส้นทางต่างกัน', () => {
    const shapes = new Set(SEEDS.map(s => JSON.stringify(buildJourney(makeRng(s)).journey)));
    expect(shapes.size).toBe(SEEDS.length);
  });
});
