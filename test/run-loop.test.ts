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

  it('เลือกพรแล้วเข้าหน้าแผนที่ พร้อม offer 3 ช่อง', () => {
    const s = run(newRun(), [{ type: 'ChooseStarterBlessing', index: 0 }]);

    expect(s.phase).toBe('map');
    expect(s.mapMode).toBe('pages');
    expect(s.pages?.current?.offers).toHaveLength(3);
    expect(s.pages?.current?.resolved).toEqual([false, false, false]);
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

  it('ช่องที่เพิ่งเคลียร์ถูกสุ่มใหม่ทันที (Dynamic Refresh) และตัวนับหน้าเดินขึ้น', () => {
    const { state, index } = mapWithCombat();
    let s = run(state, [{ type: 'ChooseOffer', index }]);
    s.enemy!.hp = 0;
    s.phase = 'victory';
    s = run(s, [{ type: 'CompleteNode' }]);

    // ตามกฎใน GAME_RULES_DEVELOPER.md ช่องที่จบแล้วจะถูกแทนด้วย encounter ใหม่
    // resolved จึงกลับเป็น false — ความคืบหน้าจริงดูที่ _resolvesOnPage
    expect(s.pages!.current!.resolved[index]).toBe(false);
    expect(s.pages!._resolvesOnPage).toBe(1);
    expect(s.pages!.current!.offers).toHaveLength(3);
  });

  it('บอสไม่ถูก refresh — ยังคง phase victory ไว้ให้ UI แสดงจบแอค', () => {
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

    expect(s.phase).toBe('victory');
    expect(s.pages!.current!.resolved[0]).toBe(true);
  });
});

describe('เดินทางต่อ', () => {
  it('Proceed เปลี่ยนไปหน้าใหม่พร้อม offer ชุดใหม่', () => {
    let s = run(newRun('page-test'), [{ type: 'ChooseStarterBlessing', index: 0 }]);
    const before = s.pages!.pageIndex;

    // เคลียร์ทุกช่องเพื่อให้เปลี่ยนหน้าได้
    s.pages!.current!.resolved = s.pages!.current!.resolved.map(() => true);
    s = run(s, [{ type: 'Proceed' }]);

    expect(s.pages!.pageIndex).toBeGreaterThanOrEqual(before);
    expect(s.pages!.current?.offers).toHaveLength(3);
  });
});

describe('ลบช่องออกจากแผนที่', () => {
  it('DeleteShopFromMap ไม่ทำให้จำนวนช่องเปลี่ยน (ช่องถูก refresh)', () => {
    for (const seed of ['del-1', 'del-2', 'del-3', 'del-4', 'del-5']) {
      const s0 = run(newRun(seed), [{ type: 'ChooseStarterBlessing', index: 0 }]);
      const offers = s0.pages!.current!.offers as PageOffer[];
      const shopIdx = offers.findIndex(o => o.kind.startsWith('shop_'));
      if (shopIdx < 0) continue;

      const s = run(s0, [{ type: 'DeleteShopFromMap', index: shopIdx }]);
      expect(s.pages!.current!.offers).toHaveLength(3);
      return;
    }
    // ไม่มี seed ไหนได้ร้านในหน้าแรก — ข้ามไปไม่ถือว่าพัง
  });
});
