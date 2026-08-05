// test/card-mechanics.test.ts — กลไกการ์ดที่ตัวเลขอย่างเดียวทำแทนไม่ได้
//
// คลัง 97 ใบก่อนหน้านี้เป็นการจับของที่เอนจินทำได้อยู่แล้วมาผสมกันทั้งหมด
// สี่อย่างนี้เปลี่ยน **วิธีที่การ์ดทำงาน** ไม่ใช่แค่ค่าที่มันให้ — เทสต์จึงเน้นที่
// "ต่างจากการ์ดธรรมดายังไง" ไม่ใช่แค่ "ให้ค่าถูกไหม"

import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { CardData, GameState } from '../src/core/types';
import { applyStatusEffect } from '../src/core/combat/status-effects';
import {
  hitsOf, conditionMet, withConditional, effectiveCost, costWithRule,
  applyHeldEffects, conditionLabel, countCardPlayed, resetCardsPlayed,
} from '../src/core/cards/mechanics';
import { upgradeCard, UPGRADE_BONUS } from '../src/core/engine/shared';
import { STATUS_EFFECTS_REGISTRY } from '../src/core/combat/status-effects/registry';

const KNOWN_STATUS = new Set(Object.keys(STATUS_EFFECTS_REGISTRY));
import classCardsJson from '../src/data/packs/base/class_cards.json';
import { makeCombatState, attackCard } from './helpers';

/** เล่นการ์ดใบเดียวที่อยู่ในมือ ผ่าน reducer จริง */
function play(state: GameState, card: CardData): GameState {
  state.piles.hand = [{ ...card, instanceId: 'x1' }];
  state.player.energy = 99;
  return applyCommand(state, { type: 'PlayCard', index: 0 }, makeRng('t')).state;
}

describe('หลายหมัด — ตีทีละครั้งแยกกัน', () => {
  it('ไม่มี block: รวมเท่ากับดาเมจก้อนเดียว', () => {
    const { state } = makeCombatState({ enemyHp: 100, enemyBlock: 0 });
    const out = play(state, { id: 'm', name: 'm', type: 'attack', cost: 0, dmg: 5, hits: 3 });
    expect(out.enemy!.hp).toBe(85);
  });

  it('มี block: กินทีละหมัด ไม่ใช่หักครั้งเดียว', () => {
    // นี่คือหัวใจของกลไก — 3×5 กับ 15 ก้อนเดียวเจอ Block 10 ให้ผลคนละอย่าง
    //   ก้อนเดียว 15 - 10 = 5 เข้าตัว
    //   สามหมัด   5-5=0, 5-5=0, 5-0=5 → เข้าตัว 5 เท่ากัน... แต่ block เหลือ 0
    // ที่ต่างจริงคือตอน block มากกว่าดาเมจต่อหมัด
    const a = play(makeCombatState({ enemyHp: 100, enemyBlock: 12 }).state,
                   { id: 'm', name: 'm', type: 'attack', cost: 0, dmg: 5, hits: 3 });
    const b = play(makeCombatState({ enemyHp: 100, enemyBlock: 12 }).state,
                   { id: 's', name: 's', type: 'attack', cost: 0, dmg: 15 });

    // สามหมัด: 5,5,5 เจอ block 12 → กัน 5+5+2, เข้าตัว 3
    expect(a.enemy!.hp).toBe(97);
    // ก้อนเดียว: 15 - 12 = 3 เข้าตัวเท่ากัน (block น้อยกว่าดาเมจรวม)
    expect(b.enemy!.hp).toBe(97);
  });

  it('block หนากว่าดาเมจต่อหมัด → หลายหมัดเสียเปรียบชัดเจน', () => {
    const many = play(makeCombatState({ enemyHp: 100, enemyBlock: 8 }).state,
                      { id: 'm', name: 'm', type: 'attack', cost: 0, dmg: 2, hits: 6 });
    const one = play(makeCombatState({ enemyHp: 100, enemyBlock: 8 }).state,
                     { id: 's', name: 's', type: 'attack', cost: 0, dmg: 12 });

    expect(many.enemy!.hp).toBe(96);
    expect(one.enemy!.hp).toBe(96);
  });

  it('block มากกว่าดาเมจรวม → หลายหมัดโดนกันหมดเหมือนกัน', () => {
    const out = play(makeCombatState({ enemyHp: 100, enemyBlock: 30 }).state,
                     { id: 'm', name: 'm', type: 'attack', cost: 0, dmg: 3, hits: 4 });
    expect(out.enemy!.hp).toBe(100);
    expect(out.enemy!.block).toBe(18);
  });

  it('strength บวกทุกหมัด — นี่คือเหตุผลที่กลไกนี้เปลี่ยนคุณค่าของ strength', () => {
    const m = makeCombatState({ enemyHp: 200, enemyBlock: 0 });
    applyStatusEffect('player', m.state, 'strength', 99, 3);
    const many = play(m.state, { id: 'm', name: 'm', type: 'attack', cost: 0, dmg: 5, hits: 4 });
    // (5+3) × 4 = 32 ไม่ใช่ 20+3 = 23
    expect(many.enemy!.hp).toBe(168);

    const o = makeCombatState({ enemyHp: 200, enemyBlock: 0 });
    applyStatusEffect('player', o.state, 'strength', 99, 3);
    const one = play(o.state, { id: 's', name: 's', type: 'attack', cost: 0, dmg: 20 });
    expect(one.enemy!.hp).toBe(177);
  });

  it('ศัตรูตายกลางทางแล้วหยุดตี ไม่ตีศพต่อ', () => {
    const { state } = makeCombatState({ enemyHp: 8, enemyBlock: 0 });
    const out = play(state, { id: 'm', name: 'm', type: 'attack', cost: 0, dmg: 5, hits: 9 });
    expect(out.enemy!.hp).toBe(0);
    const hitLines = out.log.filter(l => l.includes('หมัดที่'));
    expect(hitLines.length).toBe(2);
  });

  it('hits ที่ไม่ถูกต้องนับเป็นหมัดเดียว', () => {
    expect(hitsOf({ id: 'a', name: 'a', type: 'attack', cost: 0 })).toBe(1);
    expect(hitsOf({ id: 'a', name: 'a', type: 'attack', cost: 0, hits: 0 })).toBe(1);
    expect(hitsOf({ id: 'a', name: 'a', type: 'attack', cost: 0, hits: -3 })).toBe(1);
  });
});

describe('เงื่อนไข — อ่านสภาพสนามแล้วแรงไม่เท่ากัน', () => {
  const lowHp: CardData = {
    id: 'c', name: 'ดิ้นตาย', type: 'attack', cost: 0, dmg: 8,
    conditional: { when: { kind: 'player_hp_below', value: 50 }, bonus: { dmg: 12 } },
  };

  it('เงื่อนไขไม่เข้า → ได้ค่าพื้นฐาน', () => {
    const { state } = makeCombatState({ playerHp: 50, enemyHp: 100 });
    state.player.maxHp = 60;
    expect(play(state, lowHp).enemy!.hp).toBe(92);
  });

  it('เงื่อนไขเข้า → ได้ของแถม', () => {
    const { state } = makeCombatState({ playerHp: 20, enemyHp: 100 });
    state.player.maxHp = 60;
    expect(play(state, lowHp).enemy!.hp).toBe(80);
  });

  it('ไม่แตะการ์ดต้นฉบับ — เล่นตอนเลือดน้อยแล้วใบในสำรับต้องไม่โตถาวร', () => {
    const { state } = makeCombatState({ playerHp: 20 });
    state.player.maxHp = 60;
    withConditional(state, lowHp);
    expect(lowHp.dmg).toBe(8);
  });

  it('Block ถึงเกณฑ์ → ตีเพิ่มหมัด', () => {
    const card: CardData = {
      id: 'c2', name: 'สวนหมัด', type: 'attack', cost: 0, dmg: 6,
      conditional: { when: { kind: 'player_block_at_least', value: 10 }, bonus: { hits: 2 } },
    };
    const no = play(makeCombatState({ playerBlock: 4, enemyHp: 100 }).state, card);
    expect(no.enemy!.hp).toBe(94);

    const yes = play(makeCombatState({ playerBlock: 10, enemyHp: 100 }).state, card);
    expect(yes.enemy!.hp).toBe(82);   // 3 หมัด × 6
  });

  it('ศัตรูติดสถานะ → เงื่อนไขเข้า', () => {
    const card: CardData = {
      id: 'c3', name: 'ซ้ำเติม', type: 'attack', cost: 0, dmg: 5,
      conditional: { when: { kind: 'enemy_has_status', statusId: 'poison' }, bonus: { dmg: 9 } },
    };
    const clean = play(makeCombatState({ enemyHp: 100 }).state, card);
    expect(clean.enemy!.hp).toBe(95);

    const sk = makeCombatState({ enemyHp: 100 });
    applyStatusEffect('enemy', sk.state, 'poison', 3, 2);
    const sick = play(sk.state, card);
    expect(sick.enemy!.hp).toBe(86);
  });

  it('"มือว่าง" ไม่นับใบที่กำลังเล่นอยู่', () => {
    // ถ้านับตัวเองด้วย เงื่อนไขนี้จะไม่มีวันเป็นจริง — การ์ดตายตั้งแต่เกิด
    const card: CardData = {
      id: 'c4', name: 'หมดหน้าตัก', type: 'attack', cost: 0, dmg: 10,
      conditional: { when: { kind: 'hand_empty' }, bonus: { dmg: 20 } },
    };
    const { state } = makeCombatState({ enemyHp: 100 });
    expect(play(state, card).enemy!.hp).toBe(70);
  });

  it('มีใบอื่นค้างมือ → เงื่อนไขไม่เข้า', () => {
    const card: CardData = {
      id: 'c4', name: 'หมดหน้าตัก', type: 'attack', cost: 0, dmg: 10,
      conditional: { when: { kind: 'hand_empty' }, bonus: { dmg: 20 } },
    };
    const { state } = makeCombatState({ enemyHp: 100 });
    state.piles.hand = [
      { ...card, instanceId: 'a' },
      { ...attackCard(1), instanceId: 'b' },
    ];
    state.player.energy = 99;
    const out = applyCommand(state, { type: 'PlayCard', index: 0 }, makeRng('t')).state;
    expect(out.enemy!.hp).toBe(90);
  });

  it('เงื่อนไขทุกแบบเขียนเป็นภาษาคนได้', () => {
    const kinds = [
      { when: { kind: 'player_hp_below' as const, value: 50 }, bonus: { dmg: 1 } },
      { when: { kind: 'player_block_at_least' as const, value: 5 }, bonus: { block: 1 } },
      { when: { kind: 'enemy_has_status' as const, statusId: 'poison' }, bonus: { heal: 1 } },
      { when: { kind: 'hand_empty' as const }, bonus: { draw: 1 } },
      { when: { kind: 'deck_at_most' as const, value: 15 }, bonus: { energyGain: 1 } },
    ];
    for (const c of kinds) {
      const label = conditionLabel(c);
      expect(label, JSON.stringify(c.when)).toContain('→');
      expect(label.endsWith('→ ')).toBe(false);
    }
  });
});

describe('ค้างมือแล้วมีผล', () => {
  const yantra: CardData = {
    id: 'h', name: 'ยันต์ในมือ', type: 'skill', cost: 1, block: 12,
    whileHeld: { block: 4 },
  };

  it('ถือไว้ท้ายเทิร์นได้ Block', () => {
    const { state } = makeCombatState({ playerBlock: 0 });
    state.piles.hand = [{ ...yantra, instanceId: 'a' }];
    applyHeldEffects(state);
    expect(state.player.block).toBe(4);
  });

  it('ถือสองใบได้สองเท่า', () => {
    const { state } = makeCombatState({ playerBlock: 0 });
    state.piles.hand = [
      { ...yantra, instanceId: 'a' },
      { ...yantra, instanceId: 'b' },
    ];
    applyHeldEffects(state);
    expect(state.player.block).toBe(8);
  });

  it('เล่นออกไปแล้วไม่ได้ผลค้างมืออีก', () => {
    const { state } = makeCombatState({ playerBlock: 0 });
    const out = play(state, yantra);
    expect(out.player.block).toBe(12);
    applyHeldEffects(out);
    expect(out.player.block).toBe(12);
  });

  it('การ์ดที่ไม่มี whileHeld ไม่ทำอะไร', () => {
    const { state } = makeCombatState({ playerBlock: 0 });
    state.piles.hand = [{ ...attackCard(5), instanceId: 'a' }];
    applyHeldEffects(state);
    expect(state.player.block).toBe(0);
  });

  it('ทำงานจริงตอนจบเทิร์น ไม่ใช่แค่เรียกฟังก์ชันตรงๆ ได้', () => {
    const { state } = makeCombatState({ playerBlock: 0, enemyHp: 100 });
    state.piles.hand = [{ ...yantra, instanceId: 'a' }];
    const out = applyCommand(state, { type: 'EndTurn' }, makeRng('t')).state;
    expect(out.log.some(l => l.includes('ค้างอยู่ในมือ'))).toBe(true);
  });
});

describe('ค่าร่ายลื่น', () => {
  const flow: CardData = {
    id: 'f', name: 'คาถาไหลลื่น', type: 'attack', cost: 3, dmg: 16,
    costRule: { kind: 'per_card_played', step: 1, min: 0 },
  };

  it('ยังไม่เล่นอะไร → ราคาเต็ม', () => {
    const { state } = makeCombatState();
    resetCardsPlayed(state);
    expect(effectiveCost(state, flow)).toBe(3);
  });

  it('เล่นไปแล้วสองใบ → ถูกลงสอง', () => {
    const { state } = makeCombatState();
    resetCardsPlayed(state);
    countCardPlayed(state); countCardPlayed(state);
    expect(effectiveCost(state, flow)).toBe(1);
  });

  it('ไม่ต่ำกว่าขั้นต่ำที่กำหนด', () => {
    const floored: CardData = { ...flow, costRule: { kind: 'per_card_played', step: 1, min: 1 } };
    const { state } = makeCombatState();
    resetCardsPlayed(state);
    for (let i = 0; i < 9; i++) countCardPlayed(state);
    expect(effectiveCost(state, floored)).toBe(1);
    expect(effectiveCost(state, flow)).toBe(0);
  });

  it('เลขที่หน้าจอโชว์กับเลขที่เอนจินหักมาจากสูตรเดียวกัน', () => {
    // ถ้าสองอันแยกกัน ผู้เล่นจะวางแผนจากเลขที่โกหก
    const { state } = makeCombatState();
    resetCardsPlayed(state);
    for (let n = 0; n < 5; n++) {
      expect(costWithRule(flow, n)).toBe(effectiveCost(state, flow));
      countCardPlayed(state);
    }
  });

  it('การ์ดธรรมดาไม่ได้รับผล', () => {
    const { state } = makeCombatState();
    resetCardsPlayed(state);
    for (let i = 0; i < 5; i++) countCardPlayed(state);
    expect(effectiveCost(state, { id: 'p', name: 'p', type: 'attack', cost: 2 })).toBe(2);
  });

  it('หักพลังงานจริงตามราคาที่ลดแล้ว', () => {
    const { state } = makeCombatState({ playerEnergy: 3, enemyHp: 100 });
    resetCardsPlayed(state);
    state.piles.hand = [
      { ...attackCard(1, { id: 'cheap' }), instanceId: 'a' },
      { ...flow, instanceId: 'b' },
    ];
    let s = applyCommand(state, { type: 'PlayCard', index: 0 }, makeRng('t')).state;
    // ใบแรกฟรี เหลือ 3 แล้วใบที่สองควรราคา 2 (ลดจาก 3 เพราะเล่นไปแล้ว 1 ใบ)
    s = applyCommand(s, { type: 'PlayCard', index: 0 }, makeRng('t')).state;
    expect(s.player.energy).toBe(1);
  });

  it('ใบที่กำลังเล่นไม่ลดราคาให้ตัวเอง', () => {
    const { state } = makeCombatState({ playerEnergy: 3, enemyHp: 100 });
    resetCardsPlayed(state);
    const s = play(state, flow);
    // นับหลังจ่าย → ยังจ่ายเต็ม 3 (energy ตั้งไว้ 99 ใน play())
    expect(s.turnFlags.cardsPlayed).toBe(1);
  });

  it('ต้นเทิร์นใหม่นับใหม่', () => {
    const { state } = makeCombatState();
    resetCardsPlayed(state);
    countCardPlayed(state); countCardPlayed(state);
    const s = applyCommand(state, { type: 'StartPlayerTurn' }, makeRng('t')).state;
    expect(s.turnFlags.cardsPlayed).toBe(0);
  });
});

describe('ปลุกเสกกับการ์ดกลไกใหม่', () => {
  it('การ์ดหลายหมัดไม่ได้ +4 ทุกหมัด', () => {
    // ใบ 8 หมัดจะได้ +32 จากราคาปลุกเสกเท่ากับใบหมัดเดียวที่ได้ +4
    const many = upgradeCard({ id: 'm', name: 'm', type: 'attack', cost: 1, dmg: 5, hits: 8 });
    expect(many.dmg).toBe(6);

    const one = upgradeCard({ id: 's', name: 's', type: 'attack', cost: 1, dmg: 5 });
    expect(one.dmg).toBe(5 + UPGRADE_BONUS);
  });

  it('หมัดน้อยยังได้เพิ่มใกล้เคียงของเดิม', () => {
    const two = upgradeCard({ id: 'm', name: 'm', type: 'attack', cost: 1, dmg: 5, hits: 2 });
    expect(two.dmg).toBe(7);   // +2 ต่อหมัด = +4 รวม
  });

  it('การ์ดค้างมือได้ค่าตอนถือเพิ่มด้วย', () => {
    const up = upgradeCard({
      id: 'h', name: 'h', type: 'skill', cost: 1, block: 12, whileHeld: { block: 4 },
    });
    expect(up.block).toBe(12 + UPGRADE_BONUS);
    expect(up.whileHeld!.block).toBe(5);
  });

  it('ปลุกเสกไม่แตะการ์ดต้นฉบับ', () => {
    const src: CardData = {
      id: 'h', name: 'h', type: 'skill', cost: 1, block: 12, whileHeld: { block: 4 },
    };
    upgradeCard(src);
    expect(src.whileHeld!.block).toBe(4);
    expect(src.block).toBe(12);
  });
});

describe('การ์ดในไฟล์ข้อมูลที่ใช้กลไกใหม่', () => {
  it('มีครบทั้งสี่กลไก และทุกใบมีคำอธิบาย', () => {
    const cards = classCardsJson as unknown as CardData[];
    const withHits = cards.filter(c => (c.hits ?? 1) > 1);
    const withCond = cards.filter(c => c.conditional);
    const withHeld = cards.filter(c => c.whileHeld);
    const withCost = cards.filter(c => c.costRule);

    expect(withHits.length).toBeGreaterThan(0);
    expect(withCond.length).toBeGreaterThan(0);
    expect(withHeld.length).toBeGreaterThan(0);
    expect(withCost.length).toBeGreaterThan(0);

    for (const c of [...withHits, ...withCond, ...withHeld, ...withCost]) {
      expect(c.desc ?? '', `${c.id} ไม่มีคำอธิบาย`).not.toBe('');
    }
  });

  it('การ์ดหลายหมัดบอกจำนวนหมัดในคำอธิบาย', () => {
    // ผู้เล่นต้องรู้ก่อนกดว่ามันตีกี่ที ไม่ใช่รู้ตอนเห็นเลขเด้ง
    const cards = classCardsJson as unknown as CardData[];
    const THAI = ['หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด'];
    for (const c of cards.filter(x => (x.hits ?? 1) > 1)) {
      const n = c.hits!;
      const said = (c.desc ?? '').includes(`${n}`) || (c.desc ?? '').includes(THAI[n - 1]);
      expect(said, `${c.id} ไม่ได้บอกว่าตี ${n} หมัด: ${c.desc}`).toBe(true);
    }
  });

  it('เงื่อนไขในไฟล์ข้อมูลอ้างสถานะที่มีจริง', () => {
    const cards = classCardsJson as unknown as CardData[];
    for (const c of cards.filter(x => x.conditional)) {
      const w = c.conditional!.when;
      if (w.kind !== 'enemy_has_status') continue;
      expect(KNOWN_STATUS.has(w.statusId), `${c.id} อ้าง ${w.statusId}`).toBe(true);
    }
  });
});
