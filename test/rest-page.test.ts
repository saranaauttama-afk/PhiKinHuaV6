// test/rest-page.test.ts — ชั้นพักแบบเคลียร์ได้ทั้งหน้า
//
// ปัญหาที่ระบบนี้แก้ วัดจาก 200 รันก่อนแก้: ผู้เล่นได้เข้าร้านปลุกเสก 0.71
// ครั้งต่อรัน ร้านสละ 0.45 ครั้ง — เกินครึ่งของรันไม่เจอร้านสละเลยสักครั้ง
// ทั้งที่ตารางราคาออกแบบมาให้ใช้ 5-6 ครั้ง และแผนที่สร้างโหนดทิ้งไปครึ่งหนึ่ง

import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { isRestOfferKind } from '../src/core/map/pages';
import { buildJourney, reachableNodes, rowIsRest } from '../src/core/map/journey';
import { onRestRow, restBudgetLeft } from '../src/core/map/restPage';
import { nextRowPreview } from '../src/core/map/journeySync';
import { resolveStoryIfAny } from './helpers';

/** ตัวขับรันที่รู้จักชั้นพักแบบใหม่ */
function driver(seed: string) {
  let s: any = { seed, phase: 'start', turn: 0 };
  let r = makeRng(seed);
  const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };
  const get = () => s as GameState;

  const skipChapters = () => { let g = 0; while (s.chapter && g++ < 30) go({ type: 'SkipChapter' } as Command); };
  const clearVictory = () => {
    let g = 0;
    while (g++ < 10) {
      if (s.phase === 'levelup') { go({ type: 'SkipLevelUp' }); continue; }
      if (s.phase === 'reward') { go({ type: 'ChooseCardReward', index: 0 }); continue; }
      break;
    }
  };

  go({ type: 'NewRun', seed } as Command);
  skipChapters();
  go({ type: 'ChooseStarterBlessing', index: 0 });
  skipChapters();

  /** ช่องแรกที่ยังเคลียร์ได้บนชั้นนี้ */
  const openSlot = (): number => {
    const cur = s.pages?.current;
    if (!cur) return -1;
    return (cur.offers as (PageOffer | undefined)[])
      .findIndex((o, i) => !!o && !cur.resolved[i]);
  };

  const clearSlot = (ix: number): PageOffer => {
    const offer = s.pages.current.offers[ix] as PageOffer;
    go({ type: 'ChooseOffer', index: ix });
    resolveStoryIfAny(s, go);
    go({ type: 'CompleteNode' });
    return offer;
  };

  const fightHere = () => {
    const offers = (s.pages?.current?.offers ?? []).filter(Boolean);
    const i = offers.findIndex((o: any) => o.kind === 'monster' || o.kind === 'boss');
    if (i < 0) return false;
    go({ type: 'ChooseOffer', index: i });
    if (s.phase !== 'combat') return false;
    s.piles.hand = [{ id: 'k', name: 'k', type: 'attack', cost: 0, dmg: 9999, instanceId: 'k1' }];
    go({ type: 'PlayCard', index: 0 });
    clearVictory();
    go({ type: 'CompleteNode' });
    clearVictory();
    return true;
  };

  return { get, go, openSlot, clearSlot, fightHere, skipChapters };
}

/** เดินไปจนยืนอยู่บนชั้นพักชั้นแรก */
function reachRestRow(seed = 'rest-1') {
  const d = driver(seed);
  let guard = 0;
  while (guard++ < 60 && !onRestRow(d.get())) {
    if (d.get().chapter) { d.skipChapters(); continue; }
    if (!d.fightHere()) break;
  }
  return d;
}

describe('ชั้นพัก — เคลียร์ได้ทั้งหน้า', () => {
  it('เคลียร์ช่องหนึ่งแล้วช่องข้างๆ ยังอยู่ครบ', () => {
    // ของเดิม: เคลียร์ช่องหนึ่ง = เดินต่อทันที ช่องที่เหลือหายไปตลอดกาล
    // นี่คือหัวใจของทั้งงาน — ที่เหลือเป็นผลพลอยได้
    const d = reachRestRow();
    expect(onRestRow(d.get()), 'ไม่ได้ยืนบนชั้นพัก').toBe(true);

    const rowBefore = d.get().journey!.rowIndex;
    const slots = d.get().pages!.current!.offers.length;
    expect(slots, 'ชั้นพักควรมีมากกว่าหนึ่งช่อง').toBeGreaterThan(1);

    const cleared = d.openSlot();
    const sibling = d.get().pages!.current!.offers[cleared === 0 ? 1 : 0] as PageOffer;
    d.clearSlot(cleared);

    const after = d.get();
    expect(after.journey!.rowIndex).toBe(rowBefore);
    expect(onRestRow(after)).toBe(true);
    // ช่องข้างๆ ต้องเป็นใบเดิม และยังกดได้อยู่
    expect(after.pages!.current!.offers[cleared === 0 ? 1 : 0]).toEqual(sibling);
    expect(after.pages!.current!.resolved[cleared === 0 ? 1 : 0]).toBe(false);
  });

  it('ช่องที่เคลียร์แล้วมีของใหม่ขึ้นแทน', () => {
    const d = reachRestRow('rest-2');
    const ix = d.openSlot();
    const before = d.get().pages!.current!.offers[ix] as PageOffer;

    d.clearSlot(ix);

    const after = d.get().pages!.current!.offers[ix] as PageOffer | undefined;
    // โควตายังเหลือแน่ๆ ที่ชั้นพักชั้นแรก
    expect(after, 'ช่องว่างทั้งที่โควตายังเหลือ').toBeTruthy();
    expect(d.get().pages!.current!.resolved[ix]).toBe(false);
    expect((after as any).shopId ?? (after as any).kind)
      .not.toBe((before as any).shopId ?? (before as any).kind);
  });

  it('ของที่เติมเข้ามาเป็นโหนดพัก ไม่ใช่ผี', () => {
    const d = reachRestRow('rest-3');
    for (let i = 0; i < 6; i++) {
      const ix = d.openSlot();
      if (ix < 0) break;
      const offer = d.get().pages!.current!.offers[ix] as PageOffer;
      expect(isRestOfferKind(offer.kind), `เจอ ${offer.kind} บนชั้นพัก`).toBe(true);
      d.clearSlot(ix);
    }
  });

  it('แผนที่ที่วาดกับตัวเลือกที่กดได้ตรงกันเสมอ', () => {
    // offer เก็บอยู่สองที่ (`pages.current.offers` กับตัวโหนดบนเส้นทาง)
    // ถ้าเติมช่องแล้วเขียนที่เดียว แผนที่จะโชว์ของเก่าที่กดไม่ได้แล้ว
    const d = reachRestRow('rest-4');
    for (let i = 0; i < 5; i++) {
      const ix = d.openSlot();
      if (ix < 0) break;
      d.clearSlot(ix);

      const s = d.get();
      const nodes = reachableNodes(s.journey!);
      s.pages!.current!.offers.forEach((o, k) => {
        if (!o) return;
        expect(nodes[k]?.offer, `ช่อง ${k} ไม่ตรงกับโหนดบนแผนที่`).toEqual(o);
      });
    }
  });

  it('เคลียร์จนโควตาหมดแล้วช่องหายไป ไม่ค้างวนไม่รู้จบ', () => {
    const d = reachRestRow('rest-5');
    let guard = 0;
    while (guard++ < 80) {
      const ix = d.openSlot();
      if (ix < 0) break;
      d.clearSlot(ix);
    }
    expect(guard, 'เคลียร์ไม่จบสักที').toBeLessThan(80);
    expect(restBudgetLeft(d.get())).toBe(0);
  });
});

describe('ชั้นพัก — ปุ่มเดินต่อ', () => {
  it('กดเดินต่อแล้วขยับไปชั้นถัดไป', () => {
    const d = reachRestRow('rest-6');
    const before = d.get().journey!.rowIndex;

    d.go({ type: 'Proceed' });

    expect(d.get().journey!.rowIndex).toBeGreaterThan(before);
    expect(onRestRow(d.get())).toBe(false);
  });

  it('เดินต่อได้โดยไม่ต้องแตะอะไรเลย', () => {
    const d = reachRestRow('rest-7');
    const gold = d.get().player.gold;
    const hp = d.get().player.hp;

    d.go({ type: 'Proceed' });

    expect(d.get().player.gold).toBe(gold);
    expect(d.get().player.hp).toBe(hp);
  });

  it('บอกล่วงหน้าว่าข้างหน้าเป็นอะไร', () => {
    const d = reachRestRow('rest-8');
    const ahead = nextRowPreview(d.get());
    expect(ahead).toBeDefined();
    expect(['fight', 'boss']).toContain(ahead!.kind);
    expect(ahead!.label.length).toBeGreaterThan(0);
  });

  it('ชั้นสู้ไม่มีปุ่มเดินต่อ — เลือกทางแยกคือการเดินต่อในตัวเอง', () => {
    const d = driver('rest-9');
    // ชั้นแรกเป็นชั้นสู้เสมอตามผัง
    expect(onRestRow(d.get())).toBe(false);
  });
});

describe('ชั้นพัก — โครงกราฟที่ leaveRestRow พึ่งพา', () => {
  it('ทุกโหนดของชั้นพักเดินไปถึงทุกโหนดของชั้นถัดไป', () => {
    // `leaveRestRow` ย้ายไปยืนโหนดแรกของชั้นพักโดยถือว่าไม่เสียตัวเลือกอะไร
    // ถ้าโครงกราฟเปลี่ยนจนไม่จริง การกดเดินต่อจะแอบตัดทางเลือกทิ้งเงียบๆ
    for (let i = 0; i < 50; i++) {
      const { journey } = buildJourney(makeRng('g' + i));
      journey.rows.forEach((row, rowIdx) => {
        if (!rowIsRest(journey, rowIdx)) return;
        const sets = row.map(id => [...journey.nodes[id].next].sort().join(','));
        expect(new Set(sets).size, `ชั้น ${rowIdx} ของ seed g${i} มีทางออกไม่เท่ากัน`).toBe(1);
      });
    }
  });

  it('ไม่มีชั้นพักสองชั้นติดกัน', () => {
    // ถ้ามี ปุ่มเดินต่อจะพาไปเจอปุ่มเดินต่ออีกอัน ซึ่งอ่านเป็นความผิดพลาด
    for (let i = 0; i < 50; i++) {
      const { journey } = buildJourney(makeRng('h' + i));
      for (let k = 1; k < journey.plans.length; k++) {
        expect(
          journey.plans[k].kind === 'rest' && journey.plans[k - 1].kind === 'rest',
          `seed h${i} ชั้น ${k - 1}-${k} เป็นชั้นพักติดกัน`
        ).toBe(false);
      }
    }
  });
});

describe('ชั้นพัก — โควตาคุมของที่เติม', () => {
  it('เติมของแล้วโควตาลด', () => {
    const d = reachRestRow('rest-10');
    const before = restBudgetLeft(d.get());
    d.clearSlot(d.openSlot());
    expect(restBudgetLeft(d.get())).toBeLessThan(before);
  });

  it('ของฟรีไม่มีโควตาเติม — ได้เท่าที่วางไว้บนแผนที่', () => {
    // ตั้งใจให้เป็น 0 เพราะร้านที่คิดเงินคุมตัวเองได้ด้วยกระเป๋า
    // แต่ศาลรักษา/บ่อน้ำ/สมบัติไม่มีอะไรคุมเลย
    const d = driver('rest-11');
    const pools = d.get().pages!.pools;
    expect(pools.wells).toBe(0);
    expect(pools.healingShrine).toBe(0);
    expect(pools.treasureSingle).toBe(0);
  });
});
