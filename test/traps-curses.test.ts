import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { baseNewState } from '../src/core/commands';
import type { CardData, GameState } from '../src/core/types';
import {
  armTrap, springTraps, tickTraps, resetTraps, isTrapCard, trapOf,
} from '../src/core/combat/traps';
import { isCurseCard, addCurse, discardCurses, curseCount } from '../src/core/cards/curse';
import { CURSE_CARDS, ALL_CARDS } from '../src/core/pack';
import { STATUS_EFFECTS_REGISTRY } from '../src/core/combat/status-effects/registry';
import { upgradeCard } from '../src/core/engine/shared';
import { makeCombatState, attackCard } from './helpers';
import trapCardsJson from '../src/data/packs/base/trap_cards.json';
import storyEventsJson from '../src/data/packs/base/story_events.json';

const TRAPS = trapCardsJson as unknown as CardData[];
const EVENTS = storyEventsJson as any[];

/**
 * การ์ดดักกับการ์ดคำสาป — ชนิดการ์ดสองอย่างที่เกมนี้ไม่มีมาก่อน
 *
 * ดัก: เล่นแล้วไม่เกิดอะไรทันที ไปนอนรอจนศัตรูทำสิ่งที่ตรงเงื่อนไข
 *      เป็นทางเลือกที่สามนอกจาก "ตีให้หนัก" กับ "ตั้งการ์ดกัน" และเป็นทางเดียว
 *      ที่ตัดสินจากสิ่งที่คิดว่าศัตรูจะทำ
 * คำสาป: เล่นไม่ได้ ถ่วงมือ ทำให้ร้านสละการ์ดมีเป้าหมายจริง
 */

describe('ข้อมูลการ์ดดัก', () => {
  it('ทุกใบเป็นชนิด trap และมีข้อมูลกับดักครบ', () => {
    for (const c of TRAPS) {
      expect(c.type, c.id).toBe('trap');
      expect(isTrapCard(c), c.id).toBe(true);
      expect(trapOf(c)!.effects.length, `${c.id} ไม่มีผลอะไรเลย`).toBeGreaterThan(0);
    }
  });

  it('ทุกใบอ้างสถานะที่มีอยู่จริง', () => {
    for (const c of TRAPS) {
      for (const e of trapOf(c)!.effects) {
        if (e.statusId) {
          expect((STATUS_EFFECTS_REGISTRY as any)[e.statusId], `${c.id} → ${e.statusId}`)
            .toBeDefined();
        }
        expect(e.desc.trim().length, `${c.id} มีผลที่ไม่มีคำอธิบาย`).toBeGreaterThan(0);
      }
    }
  });

  it('การ์ดดักอยู่ในคลังการ์ดจริง ซื้อได้และได้เป็นรางวัลได้', () => {
    for (const c of TRAPS) {
      expect(ALL_CARDS.find(x => x.id === c.id), `${c.id} ไม่ได้อยู่ในคลัง`).toBeDefined();
    }
  });

  it('มีการ์ดดักให้ทุกคลาส', () => {
    for (const tag of ['shaman', 'warrior', 'nun', 'medium']) {
      const mine = TRAPS.filter(c => c.tags?.includes(tag));
      expect(mine.length, `คลาส ${tag} ไม่มีการ์ดดัก`).toBeGreaterThan(0);
    }
  });
});

describe('ตั้งดักแล้วรอ', () => {
  const trapCard = (over: Partial<CardData> = {}): CardData => ({
    id: 'test_trap', name: 'ดักทดสอบ', type: 'trap', cost: 1,
    trap: { trigger: 'enemy_attack', effects: [{ type: 'damage', value: 10, desc: 'ดักโดน' }] },
    ...over,
  } as CardData);

  it('เล่นการ์ดดักแล้วไม่เกิดผลทันที — มันไปรออยู่', () => {
    const { state, rng } = makeCombatState({ hand: [trapCard()], playerEnergy: 3, enemyHp: 50 });
    const before = state.enemy!.hp;

    const out = applyCommand(state, { type: 'PlayCard', index: 0 }, rng).state;

    expect(out.enemy!.hp, 'ดักทำงานทันทีทั้งที่ศัตรูยังไม่ทำอะไร').toBe(before);
    expect(out.traps).toHaveLength(1);
    expect(out.piles.hand).toHaveLength(0);
  });

  it('ตั้งดักแล้วการ์ดไม่กลับเข้ากองจั่วในไฟต์นี้', () => {
    const { state, rng } = makeCombatState({ hand: [trapCard()], playerEnergy: 3 });
    const out = applyCommand(state, { type: 'PlayCard', index: 0 }, rng).state;
    expect(out.piles.exhaust.map(c => c.id)).toContain('test_trap');
    expect(out.piles.discard.map(c => c.id)).not.toContain('test_trap');
  });

  it('พลังงานไม่พอ = ตั้งไม่ได้', () => {
    const { state, rng } = makeCombatState({
      hand: [trapCard({ cost: 3 })], playerEnergy: 1,
    });
    const out = applyCommand(state, { type: 'PlayCard', index: 0 }, rng).state;

    expect(out.traps ?? []).toHaveLength(0);
    expect(out.piles.hand).toHaveLength(1);
  });

  it('ศัตรูโจมตีแล้วดักทำงาน แล้วดักหายไป', () => {
    const s = makeCombatState({ hand: [], enemyHp: 50 }).state;
    resetTraps(s);
    armTrap(s, trapCard());
    const before = s.enemy!.hp;

    const res = springTraps(s, 'attack');

    expect(res.sprung).toEqual(['ดักทดสอบ']);
    expect(s.enemy!.hp).toBeLessThan(before);
    expect(s.traps, 'ดักใบเดียวทำงานได้ไม่จำกัดครั้ง').toHaveLength(0);
  });

  it('ท่าที่ไม่ตรงเงื่อนไขไม่ทำให้ดักทำงาน', () => {
    const s = makeCombatState({ hand: [], enemyHp: 50 }).state;
    resetTraps(s);
    armTrap(s, trapCard());   // ดักเฉพาะท่าโจมตี
    const before = s.enemy!.hp;

    const res = springTraps(s, 'skill');

    expect(res.sprung).toEqual([]);
    expect(s.enemy!.hp).toBe(before);
    expect(s.traps, 'ดักหายไปทั้งที่ไม่ได้ทำงาน').toHaveLength(1);
  });

  it('ดักแบบ "ทุกท่า" ทำงานกับทั้งสองชนิด', () => {
    for (const kind of ['attack', 'skill'] as const) {
      const s = makeCombatState({ hand: [], enemyHp: 50 }).state;
      resetTraps(s);
      armTrap(s, trapCard({ trap: { trigger: 'enemy_any', effects: [{ type: 'damage', value: 5, desc: 'โดน' }] } } as any));
      expect(springTraps(s, kind).sprung, `ท่า ${kind}`).toHaveLength(1);
    }
  });

  it('ดักที่ยกเลิกได้ทำให้การ์ดศัตรูไม่มีผล', () => {
    const s = makeCombatState({ hand: [] }).state;
    resetTraps(s);
    armTrap(s, trapCard({
      trap: { trigger: 'enemy_attack', effects: [{ type: 'negate', value: 1, desc: 'ยกเลิก' }] },
    } as any));

    expect(springTraps(s, 'attack').negated).toBe(true);
  });

  it('ดักที่มีอายุจำกัดสลายเองเมื่อครบ', () => {
    const s = makeCombatState({ hand: [] }).state;
    resetTraps(s);
    armTrap(s, trapCard({
      trap: { trigger: 'enemy_attack', duration: 2, effects: [{ type: 'damage', value: 5, desc: 'โดน' }] },
    } as any));

    tickTraps(s);
    expect(s.traps).toHaveLength(1);
    tickTraps(s);
    expect(s.traps, 'ดักที่มีอายุจำกัดอยู่ตลอดกาล').toHaveLength(0);
  });

  it('ดักที่ไม่มีอายุอยู่จนจบไฟต์', () => {
    const s = makeCombatState({ hand: [] }).state;
    resetTraps(s);
    armTrap(s, trapCard());
    for (let i = 0; i < 20; i++) tickTraps(s);
    expect(s.traps).toHaveLength(1);
  });

  it('ปลุกเสกการ์ดดักแล้วผลของกับดักแรงขึ้น แต่ "ยกเลิก" ไม่ถูกบวกเลข', () => {
    const c = trapCard({
      trap: {
        trigger: 'enemy_attack',
        effects: [
          { type: 'damage', value: 10, desc: 'โดน' },
          { type: 'negate', value: 1, desc: 'ยกเลิก' },
        ],
      },
    } as any);

    const up = upgradeCard(c);
    expect(up.trap!.effects[0].value).toBeGreaterThan(10);
    expect(up.trap!.effects[1].value, 'ยกเลิกไม่ควรมีระดับความแรง').toBe(1);
  });
});

describe('ดักทำงานจริงในเทิร์นศัตรู', () => {
  it('ศัตรูตีแล้วโดนดักสวนกลับ', () => {
    const s: any = makeCombatState({ hand: [], enemyHp: 200, playerHp: 60 }).state;
    resetTraps(s);
    armTrap(s, {
      id: 'counter', name: 'สวนกลับ', type: 'trap', cost: 0,
      trap: { trigger: 'enemy_attack', effects: [{ type: 'damage', value: 20, desc: 'สวน' }] },
    } as CardData);

    const enemyHpBefore = s.enemy.hp;
    s.enemyPiles = { draw: [], hand: ['claw'], discard: [] };
    const out = applyCommand(s, { type: 'ResolveEnemyTurn' }, makeRng('t')).state;

    expect(out.enemy!.hp, 'ศัตรูตีแล้วไม่โดนดักเลย').toBeLessThan(enemyHpBefore);
    expect(out.traps ?? []).toHaveLength(0);
  });
});

describe('การ์ดคำสาป', () => {
  it('มีอยู่จริงและเป็นชนิด curse', () => {
    expect(CURSE_CARDS.length).toBeGreaterThan(0);
    for (const c of CURSE_CARDS) {
      expect(isCurseCard(c), c.id).toBe(true);
      expect(c.cost).toBe(0);
    }
  });

  /**
   * คำสาปต้องเข้าสำรับได้ทางเดียวคือถูกยัดเข้ามา ถ้ามันปนอยู่ในคลังปกติ
   * มันจะไปโผล่ในร้านและในตัวเลือกตอนเลเวลอัป ซึ่งไม่มีใครเลือกอยู่แล้ว
   */
  it('ไม่ปนอยู่ในคลังการ์ดปกติ — ซื้อไม่ได้ ได้เป็นรางวัลไม่ได้', () => {
    for (const c of CURSE_CARDS) {
      expect(ALL_CARDS.find(x => x.id === c.id), `${c.id} หลุดเข้าคลังปกติ`).toBeUndefined();
    }
  });

  it('เล่นไม่ได้ — กดแล้วยังอยู่ในมือและไม่เสียพลังงาน', () => {
    const { state, rng } = makeCombatState({
      hand: [CURSE_CARDS[0]], playerEnergy: 3,
    });
    const out = applyCommand(state, { type: 'PlayCard', index: 0 }, rng).state;

    expect(out.piles.hand, 'คำสาปถูกเล่นออกไปได้').toHaveLength(1);
    expect(out.player.energy).toBe(3);
  });

  it('ทิ้งเองท้ายเทิร์น — ไม่กินโควตาการทิ้งของผู้เล่น', () => {
    const s = makeCombatState({
      hand: [CURSE_CARDS[0], attackCard(5, { id: 'ok', name: 'ปกติ' })],
    }).state;

    const removed = discardCurses(s);

    expect(removed).toBe(1);
    expect(s.piles.hand.map(c => c.id)).toEqual(['ok']);
    expect(s.piles.discard.map(c => c.id)).toContain(CURSE_CARDS[0].id);
  });

  it('ยัดเข้าสำรับแล้วอยู่ถาวรจนกว่าจะถอนออก', () => {
    const s = baseNewState('curse');
    s.masterDeck = [attackCard(5, { id: 'a', name: 'ก' })];

    addCurse(s, CURSE_CARDS[0]);
    addCurse(s, CURSE_CARDS[1]);

    expect(curseCount(s)).toBe(2);
    expect(s.masterDeck).toHaveLength(3);
  });

  it('ถอนออกที่ร้านสละการ์ดได้', () => {
    const s: any = baseNewState('curse-remove');
    s.phase = 'shop';
    s.shopKind = 'remove';
    s.player.gold = 999;
    s.masterDeck = [attackCard(5, { id: 'a', name: 'ก' }), { ...CURSE_CARDS[0] }];

    const out = applyCommand(s, { type: 'ShopRemoveBuy', index: 1 }, makeRng('x')).state;
    expect(curseCount(out)).toBe(0);
  });

  it('เหตุการณ์บางทางแถมคำสาปมาด้วยจริง', () => {
    let count = 0;
    for (const ev of EVENTS) {
      for (const ch of ev.choices) {
        count += (ch.effects ?? []).filter((e: any) => e.kind === 'curse').length;
        for (const b of ch.branches ?? []) {
          count += b.effects.filter((e: any) => e.kind === 'curse').length;
        }
      }
    }
    expect(count, 'ไม่มีทางไหนให้คำสาปเลย = ร้านสละการ์ดยังไม่มีเป้าหมาย')
      .toBeGreaterThan(0);
  });
});

describe('ดักและคำสาปไม่ค้างข้ามไฟต์', () => {
  it('เริ่มไฟต์ใหม่แล้วไม่มีดักตกค้าง', () => {
    let s: any = { seed: 'trap-run', phase: 'start', turn: 0 };
    let r = makeRng('trap-run');
    const go = (c: any) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

    go({ type: 'NewRun', seed: 'trap-run', classId: 'warrior' });
    while (s.chapter) go({ type: 'SkipChapter' });
    go({ type: 'ChooseStarterBlessing', index: 0 });
    while (s.chapter) go({ type: 'SkipChapter' });

    s.traps = [{ cardId: 'x', name: 'ดักเก่า', trigger: 'enemy_any', effects: [] }];
    s.pages.current.offers[0] = { kind: 'monster', tier: 'normal', enemyId: 'phi-krasue' };
    go({ type: 'ChooseOffer', index: 0 });

    expect(s.traps, 'ดักของไฟต์ก่อนตามมา').toEqual([]);
  });

  it('ดักอยู่ใน state ของตัวเอง ไม่ใช่ของกลาง', () => {
    const a = makeCombatState({ hand: [] }).state;
    const b = makeCombatState({ hand: [] }).state;
    resetTraps(a);
    resetTraps(b);

    armTrap(a, {
      id: 't', name: 'ดัก', type: 'trap', cost: 0,
      trap: { trigger: 'enemy_any', effects: [{ type: 'block', value: 1, desc: 'กัน' }] },
    } as CardData);

    expect(a.traps).toHaveLength(1);
    expect(b.traps ?? [], 'ดักข้ามไปโผล่ใน state อื่น').toHaveLength(0);
  });
});
