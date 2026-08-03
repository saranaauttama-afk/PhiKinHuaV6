import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { baseNewState, buildAndShuffleDeck, drawUpTo } from '../src/core/commands';
import type { CardData, GameState } from '../src/core/types';
import { groupCards } from '../src/core/cards/group';
import { makeCombatState, attackCard } from './helpers';

import cardsJson from '../src/data/packs/base/cards.json';

const CARDS = cardsJson as CardData[];

/**
 * "ตอนนี้เรามีการ์ดอะไรอยู่บ้าง"
 *
 * ระบบทั้งหมดนี้มีข้อมูลครบมาตลอด แต่ไม่เคยมีจอไหนแสดง:
 *   - `masterDeck` มีสำรับเต็ม แต่ `OpenDeck` ไม่มีปุ่มไหนสั่ง
 *   - `piles.exhaust` มีใบที่ใช้แล้วหาย แต่ในไฟต์ไม่มีที่ดู
 *   - เลขข้างไอคอนสำรับบวก `masterDeck` กับ `piles.draw` เข้าด้วยกัน ทั้งที่
 *     `draw` เป็นสำเนาของ `masterDeck` — เลขที่โชว์จึงเป็นสองเท่าของจริง
 */

describe('รวมใบซ้ำเป็นแถวเดียว', () => {
  const card = (id: string, name: string): CardData =>
    ({ id, name, type: 'attack', cost: 1, dmg: 5 });

  it('ใบเดียวกันสี่ใบ = หนึ่งแถว นับได้สี่', () => {
    const rows = groupCards([
      card('slash', 'ฟันดาบ'), card('slash', 'ฟันดาบ'),
      card('slash', 'ฟันดาบ'), card('slash', 'ฟันดาบ'),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(4);
  });

  it('จำนวนรวมทุกแถวเท่ากับจำนวนใบที่ใส่เข้าไป', () => {
    const input = [
      card('a', 'ก'), card('b', 'ข'), card('a', 'ก'), card('c', 'ค'), card('b', 'ข'),
    ];
    const rows = groupCards(input);
    expect(rows.reduce((n, r) => n + r.count, 0)).toBe(input.length);
  });

  it('เรียงตามชื่อ ไม่ใช่ตามลำดับที่ใส่มา — กองจั่วห้ามเปิดเผยลำดับจริง', () => {
    const rows = groupCards([card('c', 'ฮ'), card('a', 'ก'), card('b', 'ม')]);
    expect(rows.map(r => r.card.name)).toEqual(['ก', 'ม', 'ฮ']);
  });

  it('กองว่างได้ผลลัพธ์ว่าง ไม่พัง', () => {
    expect(groupCards([])).toEqual([]);
  });
});

describe('เลขกองจั่วในหน้าต่อสู้', () => {
  /**
   * ข้อนี้อธิบายว่าทำไมสูตรเดิมผิด: `buildAndShuffleDeck` **ก๊อป** `masterDeck`
   * ลง `piles.draw` ไม่ได้ย้าย ทั้งสองกองจึงมีของชุดเดียวกัน
   * บวกกันเมื่อไหร่ก็ได้เลขสองเท่าเมื่อนั้น
   */
  it('ตอนเริ่มไฟต์ กองจั่วมีเท่ากับสำรับ — บวกกันคือนับซ้ำ', () => {
    const s = baseNewState('draw-count');
    s.masterDeck = [
      attackCard(5, { id: 'a', name: 'ก' }),
      attackCard(5, { id: 'b', name: 'ข' }),
      attackCard(5, { id: 'c', name: 'ค' }),
    ];
    buildAndShuffleDeck(s, makeRng('draw-count'));

    expect(s.piles.draw).toHaveLength(s.masterDeck.length);
    expect(s.masterDeck.length + s.piles.draw.length).toBe(s.masterDeck.length * 2);
  });

  it('จั่วขึ้นมือแล้วกองจั่วลดลง แต่สำรับถาวรไม่ขยับ', () => {
    const s = baseNewState('draw-move');
    s.masterDeck = [
      attackCard(5, { id: 'a', name: 'ก' }),
      attackCard(5, { id: 'b', name: 'ข' }),
      attackCard(5, { id: 'c', name: 'ค' }),
    ];
    let r = makeRng('draw-move');
    ({ rng: r } = buildAndShuffleDeck(s, r));

    const before = s.piles.draw.length;
    drawUpTo(s, r, 2);

    expect(s.piles.draw.length).toBe(before - 2);
    expect(s.piles.hand).toHaveLength(2);
    expect(s.masterDeck, 'สำรับถาวรไม่เกี่ยวกับการจั่ว').toHaveLength(3);
  });
});

describe('การ์ดใช้แล้วหาย', () => {
  /**
   * ข้อความเดิมเขียนว่า "(ใช้ได้ครั้งเดียว)" ซึ่งอ่านได้ว่าครั้งเดียวตลอดรัน
   * แต่กองเผาถูกสร้างใหม่ทุกไฟต์จาก `masterDeck` — ใบนั้นกลับมาในไฟต์ถัดไป
   */
  it('ไฟล์ข้อมูลมีใบแบบนี้จริง และบอกขอบเขตให้ตรง (หายจากไฟต์นี้ ไม่ใช่หายตลอดรัน)', () => {
    const exhausters = CARDS.filter(c => c.exhaust);
    expect(exhausters.length, 'ไม่มีใบ exhaust เลย = ข้อนี้ไม่มีความหมาย')
      .toBeGreaterThan(0);
    for (const c of exhausters) {
      expect(c.desc ?? '', `${c.id} ไม่ได้บอกว่าใช้แล้วหาย`).toContain('หายไปจากไฟต์นี้');
    }
  });

  it('ใบที่เผาแล้วกลับมาในไฟต์ถัดไป — ข้อความจึงต้องไม่บอกว่าหายตลอดรัน', () => {
    const s = baseNewState('fresh-fight');
    s.masterDeck = [
      { id: 'one_shot', name: 'ใบครั้งเดียว', type: 'skill', cost: 0, exhaust: true },
      attackCard(5, { id: 'plain', name: 'ธรรมดา' }),
    ];
    // ไฟต์ใหม่สร้างกองจั่วจาก masterDeck ใหม่ทั้งกอง กองเผาของไฟต์ก่อนไม่เกี่ยว
    buildAndShuffleDeck(s, makeRng('fresh-fight'));
    expect(s.piles.draw.map(c => c.id)).toContain('one_shot');
    expect(s.piles.exhaust).toEqual([]);
  });

  it('เล่นแล้วเข้ากองเผา ไม่ใช่กองทิ้ง', () => {
    const { state, rng } = makeCombatState({
      hand: [attackCard(4, { id: 'one_shot', name: 'ใบครั้งเดียว', exhaust: true })],
      playerEnergy: 3,
    });

    const out = applyCommand(state, { type: 'PlayCard', index: 0 }, rng).state;

    expect(out.piles.exhaust.map(c => c.id)).toEqual(['one_shot']);
    expect(out.piles.discard.map(c => c.id)).not.toContain('one_shot');
  });

  it('ใบธรรมดาเล่นแล้วเข้ากองทิ้ง กองเผายังว่าง', () => {
    const { state, rng } = makeCombatState({
      hand: [attackCard(4, { id: 'plain', name: 'ใบธรรมดา' })],
      playerEnergy: 3,
    });

    const out = applyCommand(state, { type: 'PlayCard', index: 0 }, rng).state;

    expect(out.piles.discard.map(c => c.id)).toEqual(['plain']);
    expect(out.piles.exhaust).toEqual([]);
  });

  it('ใบที่เผาแล้วไม่กลับมาในกองจั่วตอนสับกองทิ้งใหม่', () => {
    const { state, rng } = makeCombatState({
      hand: [
        attackCard(4, { id: 'one_shot', name: 'ใบครั้งเดียว', exhaust: true }),
        attackCard(4, { id: 'plain', name: 'ใบธรรมดา' }),
      ],
      playerEnergy: 3,
    });

    let s: GameState = applyCommand(state, { type: 'PlayCard', index: 0 }, rng).state;
    s = applyCommand(s, { type: 'PlayCard', index: 0 }, rng).state;

    // กองจั่วหมด → จั่วอีกครั้งจะสับกองทิ้งกลับมา
    s.piles.draw = [];
    drawUpTo(s, makeRng('reshuffle'), 5);

    const everywhere = [...s.piles.draw, ...s.piles.hand, ...s.piles.discard];
    expect(everywhere.map(c => c.id), 'ใบที่เผาแล้วโผล่กลับมา').not.toContain('one_shot');
    expect(s.piles.exhaust.map(c => c.id)).toEqual(['one_shot']);
  });
});
