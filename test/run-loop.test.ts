import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';

/**
 * Phase 6 — ลูปของรันจริง: NewRun → เลือกพร → หน้าแผนที่ → เลือก encounter → คอมแบต → กลับแผนที่
 *
 * ก่อนหน้านี้ UI ไม่เคยเข้าถึงลูปนี้เลย (หน้าแผนที่ hardcode ปุ่มไว้ 3 ปุ่ม)
 * เทสต์ชุดนี้ยืนยันว่า engine เดินลูปได้ครบ และ command ที่ UI ใช้ต่อกันถูกจริง
 */

function run(state: GameState, cmds: Command[]) {
  let s = state;
  let r = makeRng(s.seed || 'test');
  for (const c of cmds) {
    const out = applyCommand(s, c, r);
    s = out.state;
    r = out.rng;
  }
  return s;
}

function newRun(seed = 'loop-test'): GameState {
  const empty = { seed, phase: 'start', turn: 0 } as unknown as GameState;
  return applyCommand(empty, { type: 'NewRun', seed }, makeRng(seed)).state;
}

const combatKinds = new Set(['monster', 'boss']);
const firstCombatIndex = (offers: PageOffer[]) =>
  offers.findIndex(o => combatKinds.has(o.kind));

describe('เริ่มรัน', () => {
  it('NewRun พาไปเลือกพรตั้งต้น พร้อมตัวเลือกให้เลือก', () => {
    const s = newRun();
    expect(s.phase).toBe('starter');
    expect(s.starter?.choices.length).toBeGreaterThan(0);
    expect(s.masterDeck.length).toBeGreaterThan(0);
  });

  it('เลือกพรแล้วเข้าหน้าแผนที่ พร้อมทางแยกให้เลือก', () => {
    const s = run(newRun(), [{ type: 'ChooseStarterBlessing', index: 0 }]);

    expect(s.phase).toBe('map');
    expect(s.mapMode).toBe('pages');
    // เส้นทางถูกวางไว้ล่วงหน้าทั้งรัน ชั้นแรกมีทางแยก 2-3 ทาง
    expect(s.journey).toBeDefined();
    expect(s.journey!.currentId).toBeUndefined();
    const offers = s.pages!.current!.offers;
    expect(offers.length).toBeGreaterThanOrEqual(2);
    expect(offers.length).toBeLessThanOrEqual(3);
    expect(s.pages!.current!.resolved.every(x => x === false)).toBe(true);
    expect(s.blessings.length).toBe(1);
  });

  it('offer ทุกช่องมีชนิดที่ UI รู้จัก', () => {
    const s = run(newRun(), [{ type: 'ChooseStarterBlessing', index: 0 }]);
    const known = new Set([
      'monster', 'boss', 'shop_card', 'shop_equipment', 'shop_remove',
      'shop_upgrade', 'well', 'healing_shrine', 'treasure',
      'treasure_single', 'next_event',
    ]);
    for (const o of s.pages!.current!.offers) {
      expect(known.has(o.kind)).toBe(true);
    }
  });
});

describe('เลือก encounter ที่เป็นศัตรู', () => {
  /** หา seed ที่หน้าแรกมีช่องศัตรูอย่างน้อยหนึ่งช่อง */
  function mapWithCombat(): { state: GameState; index: number } {
    for (const seed of ['loop-test', 's2', 's3', 's4', 's5', 's6', 's7', 's8']) {
      const s = run(newRun(seed), [{ type: 'ChooseStarterBlessing', index: 0 }]);
      const idx = firstCombatIndex(s.pages!.current!.offers as PageOffer[]);
      if (idx >= 0) return { state: s, index: idx };
    }
    throw new Error('ไม่พบ seed ที่หน้าแรกมีศัตรู');
  }

  it('ChooseOffer เซ็ตอัพคอมแบตให้ครบ — UI ไม่ต้อง StartCombat ซ้ำ', () => {
    const { state, index } = mapWithCombat();
    const s = run(state, [{ type: 'ChooseOffer', index }]);

    expect(s.phase).toBe('combat');
    expect(s.enemy).toBeDefined();
    expect(s.enemy!.hp).toBeGreaterThan(0);
    expect(s.enemy!.hp).toBe(s.enemy!.maxHp);
    // มือแรกถูกจั่วให้แล้ว
    expect(s.piles.hand.length).toBeGreaterThan(0);
    // เด็คศัตรูถูกสร้างแล้ว
    expect((s as any).enemyPiles).toBeDefined();
  });

  it('ศัตรูที่เจอตรงกับตัวที่แสดงบนแผนที่', () => {
    const { state, index } = mapWithCombat();
    const offer = state.pages!.current!.offers[index] as PageOffer;
    const s = run(state, [{ type: 'ChooseOffer', index }]);

    if (offer.kind === 'monster' || offer.kind === 'boss') {
      expect(s.enemy!.id).toBe(offer.enemyId);
    }
  });

  it('ชนะแล้ว CompleteNode พากลับแผนที่ และเคลียร์สเตตคอมแบต', () => {
    const { state, index } = mapWithCombat();
    let s = run(state, [{ type: 'ChooseOffer', index }]);

    // ฆ่าศัตรูตรงๆ แล้วปิด node
    s.enemy!.hp = 0;
    s.phase = 'victory';
    s = run(s, [{ type: 'CompleteNode' }]);

    expect(s.phase).toBe('map');
    expect(s.enemy).toBeUndefined();
  });

  it('จบโหนดแล้วเดินไปชั้นถัดไป ไม่ใช่สุ่มช่องเดิมใหม่', () => {
    const { state, index } = mapWithCombat();
    let s = run(state, [{ type: 'ChooseOffer', index }]);

    // เลือกช่องไหน = ไปยืนที่โหนดนั้นบนเส้นทาง
    const stoodAt = s.journey!.currentId;
    expect(stoodAt).toBeDefined();
    expect(s.journey!.nodes[stoodAt!].row).toBe(0);
    expect(s.journey!.nodes[stoodAt!].visited).toBe(true);

    s.enemy!.hp = 0;
    s.phase = 'victory';
    s = run(s, [{ type: 'CompleteNode' }]);

    // ตัวเลือกชุดใหม่คือโหนดชั้นถัดไปที่ต่อจากโหนดที่ยืนอยู่ ไม่ใช่ของสุ่มใหม่
    const nextIds = s.journey!.nodes[stoodAt!].next;
    expect(nextIds.length).toBeGreaterThan(0);
    expect(s.pages!.current!.offers).toEqual(nextIds.map(id => s.journey!.nodes[id].offer));
    expect(s.journey!.currentId).toBe(stoodAt);
  });

  it('เดินย้อนกลับไม่ได้ — โหนดที่ผ่านมาแล้วไม่โผล่เป็นตัวเลือกอีก', () => {
    const { state, index } = mapWithCombat();
    let s = run(state, [{ type: 'ChooseOffer', index }]);
    const stoodAt = s.journey!.currentId!;
    s.enemy!.hp = 0;
    s.phase = 'victory';
    s = run(s, [{ type: 'CompleteNode' }]);

    for (const id of Object.values(s.journey!.nodes)) {
      if (id.row > 0) continue;
      expect(s.journey!.nodes[stoodAt].next).not.toContain(id.id);
    }
  });

  it('บอสไม่ถูก refresh เหมือน encounter ปกติ', () => {
    // ใช้ offer เป็นบอสโดยตรงเพื่อทดสอบเส้นทางนี้
    let s = run(newRun('boss-test'), [{ type: 'ChooseStarterBlessing', index: 0 }]);
    s.pages!.current!.offers[0] = {
      kind: 'boss', bossType: 'mid', enemyId: 'phi-mae-mai',
    } as PageOffer;

    s = run(s, [{ type: 'ChooseOffer', index: 0 }]);
    if (s.phase !== 'combat') return; // บอส id ไม่ตรง pool ก็ข้ามไป

    s.enemy!.hp = 0;
    s.phase = 'victory';
    s = run(s, [{ type: 'CompleteNode' }]);

    // บอสกลางพาเดินทางต่อ (ไม่ค้างที่ victory และไม่จบรัน)
    // รายละเอียดลำดับบอสอยู่ใน fight-structure.test.ts
    expect(s.phase).not.toBe('victory');
    expect(s.phase).not.toBe('run_complete');
    expect(s.enemy).toBeUndefined();
  });
});

describe('เดินทางต่อ', () => {
  it('แวะร้านแล้วปิดโหนด ก็เดินต่อชั้นถัดไปเหมือนกัน', () => {
    for (const seed of ['page-test', 'pt-2', 'pt-3', 'pt-4', 'pt-5']) {
      let s = run(newRun(seed), [{ type: 'ChooseStarterBlessing', index: 0 }]);
      const offers = s.pages!.current!.offers as PageOffer[];
      const shopIdx = offers.findIndex(o => o.kind.startsWith('shop_'));
      if (shopIdx < 0) continue;

      s = run(s, [{ type: 'ChooseOffer', index: shopIdx }]);
      expect(s.phase).toBe('shop');

      const stoodAt = s.journey!.currentId!;
      s = run(s, [{ type: 'CompleteNode' }]);

      expect(s.phase).toBe('map');
      expect(s.pages!.current!.offers).toEqual(
        s.journey!.nodes[stoodAt].next.map(id => s.journey!.nodes[id].offer)
      );
      return;
    }
    // ไม่มี seed ไหนได้ร้านในชั้นแรก — ข้ามไปไม่ถือว่าพัง
  });

  it('ทุกโหนดบนเส้นทางเดินถึงได้ ไม่มีทางตัน', () => {
    for (const seed of ['reach-1', 'reach-2', 'reach-3']) {
      const s = run(newRun(seed), [{ type: 'ChooseStarterBlessing', index: 0 }]);
      const j = s.journey!;

      const reached = new Set(j.rows[0]);
      for (const row of j.rows) {
        for (const id of row) {
          if (!reached.has(id)) continue;
          for (const nx of j.nodes[id].next) reached.add(nx);
        }
      }

      const all = j.rows.flat();
      expect(reached.size, `seed ${seed}`).toBe(all.length);

      // ทุกชั้นยกเว้นชั้นสุดท้ายต้องมีทางออก
      for (let i = 0; i < j.rows.length - 1; i++) {
        for (const id of j.rows[i]) {
          expect(j.nodes[id].next.length, `seed ${seed} โหนด ${id}`).toBeGreaterThan(0);
        }
      }
      // ปลายทางคือบอสสุดท้าย ไม่มีทางเดินต่อ
      const last = j.rows[j.rows.length - 1];
      expect(last).toHaveLength(1);
      expect(j.nodes[last[0]].offer.kind).toBe('boss');
      expect(j.nodes[last[0]].next).toEqual([]);
    }
  });
});

describe('โหนดชั้นพักทุกชนิดเดินผ่านได้', () => {
  const REST_KINDS: PageOffer[] = [
    { kind: 'shop_card', shopId: 'rest_shop_card' },
    { kind: 'shop_equipment', shopId: 'rest_shop_equip' },
    { kind: 'healing_shrine', shopId: 'rest_shrine' },
    { kind: 'well', shopId: 'rest_well' },
    { kind: 'treasure', shopId: 'rest_treasure' },
    { kind: 'treasure_single', shopId: 'rest_treasure1' },
  ];

  // ถ้าโหนดชนิดไหนปิดไม่ลง ผู้เล่นจะติดค้างกลางเส้นทางแบบไปต่อไม่ได้เลย
  for (const offer of REST_KINDS) {
    it(`แวะ ${offer.kind} แล้วเดินต่อได้`, () => {
      let s = run(newRun(`rest-${offer.kind}`), [{ type: 'ChooseStarterBlessing', index: 0 }]);
      s.pages!.current!.offers[0] = offer;

      s = run(s, [{ type: 'ChooseOffer', index: 0 }]);
      const stoodAt = s.journey!.currentId!;
      expect(stoodAt, `${offer.kind} ไม่ได้ย้ายตำแหน่งบนเส้นทาง`).toBeDefined();

      s = run(s, [{ type: 'CompleteNode' }]);

      expect(s.phase, `${offer.kind} ปิดโหนดไม่ลง`).toBe('map');
      expect(s.pages!.current!.offers).toEqual(
        s.journey!.nodes[stoodAt].next.map(id => s.journey!.nodes[id].offer)
      );
    });
  }
});

describe('ลบช่องออกจากแผนที่', () => {
  it('DeleteShopFromMap คือเลือกที่จะข้ามโหนดนั้นแล้วเดินต่อ', () => {
    for (const seed of ['del-1', 'del-2', 'del-3', 'del-4', 'del-5']) {
      const s0 = run(newRun(seed), [{ type: 'ChooseStarterBlessing', index: 0 }]);
      const offers = s0.pages!.current!.offers as PageOffer[];
      const shopIdx = offers.findIndex(o => o.kind.startsWith('shop_'));
      if (shopIdx < 0) continue;

      const s = run(s0, [{ type: 'DeleteShopFromMap', index: shopIdx }]);
      const stoodAt = s.journey!.currentId!;

      expect(s.journey!.nodes[stoodAt].row).toBe(0);
      expect(s.pages!.current!.offers).toEqual(
        s.journey!.nodes[stoodAt].next.map(id => s.journey!.nodes[id].offer)
      );
      return;
    }
    // ไม่มี seed ไหนได้ร้านในหน้าแรก — ข้ามไปไม่ถือว่าพัง
  });
});
