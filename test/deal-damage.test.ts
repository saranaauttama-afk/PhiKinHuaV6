import { describe, it, expect } from 'vitest';
import { dealDamage, gainBlock } from '../src/core/combat/damage';
import { applyStatusEffect } from '../src/core/combat/status-effects';
import { makeCombatState } from './helpers';

/**
 * Unit test ของ dealDamage — ทางเดียวที่ใช้คำนวณดาเมจทั้งเกม
 * เน้นที่ค่าใน DamageResult เพราะ UI จะเอาค่าพวกนี้ไปแสดงตรงๆ ใน Phase 3
 */

const card = (cardId = 'x') => ({ kind: 'card' as const, cardId });

describe('dealDamage — ค่าที่คืนออกมา', () => {
  it('ไม่มี block → hpLoss เท่ากับ modified, blocked เป็น 0', () => {
    const { state } = makeCombatState({ enemyHp: 30, enemyBlock: 0 });
    const r = dealDamage(state, { from: 'player', to: 'enemy', raw: 8, source: card() });
    expect(r).toEqual({ raw: 8, modified: 8, blocked: 0, hpLoss: 8, died: false });
    expect(state.enemy!.hp).toBe(22);
  });

  it('block ดูดบางส่วน → blocked/hpLoss แยกกันถูกต้อง', () => {
    const { state } = makeCombatState({ enemyHp: 30, enemyBlock: 5 });
    const r = dealDamage(state, { from: 'player', to: 'enemy', raw: 8, source: card() });
    expect(r.blocked).toBe(5);
    expect(r.hpLoss).toBe(3);
    expect(state.enemy!.block).toBe(0);
    expect(state.enemy!.hp).toBe(27);
  });

  it('block ดูดหมด → hpLoss เป็น 0 และ block เหลือส่วนต่าง', () => {
    const { state } = makeCombatState({ enemyHp: 30, enemyBlock: 10 });
    const r = dealDamage(state, { from: 'player', to: 'enemy', raw: 4, source: card() });
    expect(r.blocked).toBe(4);
    expect(r.hpLoss).toBe(0);
    expect(r.died).toBe(false);
    expect(state.enemy!.block).toBe(6);
    expect(state.enemy!.hp).toBe(30);
  });

  it('died เป็น true เฉพาะครั้งที่ทำให้ HP ถึง 0', () => {
    const { state } = makeCombatState({ enemyHp: 5, enemyBlock: 0 });
    const first = dealDamage(state, { from: 'player', to: 'enemy', raw: 5, source: card() });
    expect(first.died).toBe(true);
    // ตีซ้ำตอนตายแล้วต้องไม่รายงานว่าตายอีกรอบ
    const second = dealDamage(state, { from: 'player', to: 'enemy', raw: 5, source: card() });
    expect(second.died).toBe(false);
  });

  it('ดาเมจ 0 ไม่ทำให้ตายและไม่แตะ block', () => {
    const { state } = makeCombatState({ enemyHp: 30, enemyBlock: 5 });
    const r = dealDamage(state, { from: 'player', to: 'enemy', raw: 0, source: card() });
    expect(r).toEqual({ raw: 0, modified: 0, blocked: 0, hpLoss: 0, died: false });
    expect(state.enemy!.block).toBe(5);
  });

  it('โยน error ถ้า raw ไม่ใช่ตัวเลขที่ใช้ได้ แทนที่จะกลืนเงียบ', () => {
    const { state } = makeCombatState({});
    expect(() =>
      dealDamage(state, { from: 'player', to: 'enemy', raw: NaN, source: card() })
    ).toThrow(/raw damage/);
  });

  it('ไม่มีศัตรู → คืนผลว่างโดยไม่พัง', () => {
    const { state } = makeCombatState({});
    state.enemy = undefined;
    const r = dealDamage(state, { from: 'player', to: 'enemy', raw: 8, source: card() });
    expect(r.hpLoss).toBe(0);
    expect(r.died).toBe(false);
  });
});

describe('dealDamage — status effect ทั้งสองฝั่ง', () => {
  it('strength ฝั่งผู้ตี + vulnerable ฝั่งผู้รับ คิดรวมกัน', () => {
    const { state } = makeCombatState({ enemyHp: 60, enemyBlock: 0 });
    applyStatusEffect('player', state, 'strength' as any, 3, 2);
    applyStatusEffect('enemy', state, 'vulnerable' as any, 3, 1);
    const r = dealDamage(state, { from: 'player', to: 'enemy', raw: 8, source: card() });
    // (8 + 2) * 1.5 = 15
    expect(r.modified).toBe(15);
    expect(state.enemy!.hp).toBe(45);
  });

  it('ศัตรูตีก็ผ่าน status effect เหมือนกัน (เดิม path นี้ข้ามทั้งหมด)', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    applyStatusEffect('enemy', state, 'strength' as any, 3, 4);
    const r = dealDamage(state, { from: 'enemy', to: 'player', raw: 6, source: card() });
    expect(r.modified).toBe(10);
    expect(state.player.hp).toBe(40);
  });

  it('ดาเมจไม่ติดลบแม้ weakness ซ้อนกับดาเมจต่ำ', () => {
    const { state } = makeCombatState({ enemyHp: 30 });
    applyStatusEffect('player', state, 'weakness' as any, 3, 1);
    const r = dealDamage(state, { from: 'player', to: 'enemy', raw: 1, source: card() });
    expect(r.modified).toBeGreaterThanOrEqual(0);
    expect(state.enemy!.hp).toBeLessThanOrEqual(30);
  });
});

describe('กฎของดาเมจแต่ละชนิด (source.kind เป็นตัวกำหนด)', () => {
  it('status (พิษ) ทะลุ block', () => {
    const { state } = makeCombatState({ enemyHp: 30, enemyBlock: 10 });
    const r = dealDamage(state, {
      from: 'player', to: 'enemy', raw: 4,
      source: { kind: 'status', effectId: 'poison' },
    });
    expect(r.blocked).toBe(0);
    expect(r.hpLoss).toBe(4);
    expect(state.enemy!.block).toBe(10); // block ไม่ถูกแตะ
    expect(state.enemy!.hp).toBe(26);
  });

  it('status ไม่โดน modifier ใดๆ — พิษเท่าเดิมแม้ผู้รับติด vulnerable', () => {
    const { state } = makeCombatState({ enemyHp: 30, enemyBlock: 0 });
    applyStatusEffect('enemy', state, 'vulnerable' as any, 3, 1);
    applyStatusEffect('player', state, 'strength' as any, 3, 5);
    const r = dealDamage(state, {
      from: 'player', to: 'enemy', raw: 4,
      source: { kind: 'status', effectId: 'poison' },
    });
    expect(r.modified).toBe(4);
  });

  it('minion โดน block ตามปกติ', () => {
    const { state } = makeCombatState({ enemyHp: 30, enemyBlock: 5 });
    const r = dealDamage(state, {
      from: 'player', to: 'enemy', raw: 8,
      source: { kind: 'minion', minionId: 'm1' },
    });
    expect(r.blocked).toBe(5);
    expect(r.hpLoss).toBe(3);
  });

  it('minion ที่ ignoresBlock ทะลุ block', () => {
    const { state } = makeCombatState({ enemyHp: 30, enemyBlock: 5 });
    const r = dealDamage(state, {
      from: 'player', to: 'enemy', raw: 8,
      source: { kind: 'minion', minionId: 'm1', ignoresBlock: true },
    });
    expect(r.blocked).toBe(0);
    expect(r.hpLoss).toBe(8);
    expect(state.enemy!.block).toBe(5);
  });

  it('minion ไม่สืบทอด strength ของผู้เรียก แต่ vulnerable ของผู้รับยังมีผล', () => {
    const { state } = makeCombatState({ enemyHp: 40, enemyBlock: 0 });
    applyStatusEffect('player', state, 'strength' as any, 3, 5);
    applyStatusEffect('enemy', state, 'vulnerable' as any, 3, 1);
    const r = dealDamage(state, {
      from: 'player', to: 'enemy', raw: 8,
      source: { kind: 'minion', minionId: 'm1' },
    });
    // ไม่บวก strength 5 แต่คูณ vulnerable 1.5 → 12 (ไม่ใช่ 19.5)
    expect(r.modified).toBe(12);
  });

  it('combo คิดเต็มระบบเหมือนการ์ด', () => {
    const { state } = makeCombatState({ enemyHp: 40, enemyBlock: 3 });
    applyStatusEffect('player', state, 'strength' as any, 3, 2);
    const r = dealDamage(state, {
      from: 'player', to: 'enemy', raw: 8,
      source: { kind: 'combo', comboId: 'c1' },
    });
    expect(r.modified).toBe(10); // 8 + 2
    expect(r.blocked).toBe(3);
    expect(r.hpLoss).toBe(7);
  });

  it('event ทะลุทุกอย่าง (ดาเมจเชิงเนื้อเรื่อง)', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 20 });
    applyStatusEffect('player', state, 'vulnerable' as any, 3, 1);
    const r = dealDamage(state, {
      from: 'enemy', to: 'player', raw: 6,
      source: { kind: 'event' },
    });
    expect(r.modified).toBe(6);
    expect(r.blocked).toBe(0);
    expect(state.player.block).toBe(20);
    expect(state.player.hp).toBe(44);
  });
});

describe('gainBlock', () => {
  it('บวก block สะสมให้ฝั่งที่ระบุ', () => {
    const { state } = makeCombatState({ playerBlock: 2 });
    expect(gainBlock(state, 'player', 6)).toBe(6);
    expect(state.player.block).toBe(8);
  });

  it('ค่าติดลบหรือศูนย์ไม่ทำอะไร', () => {
    const { state } = makeCombatState({ playerBlock: 3 });
    expect(gainBlock(state, 'player', 0)).toBe(0);
    expect(gainBlock(state, 'player', -5)).toBe(0);
    expect(state.player.block).toBe(3);
  });
});
