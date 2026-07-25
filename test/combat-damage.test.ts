import { describe, it, expect } from 'vitest';
import { applyCardEffect, isVictory, isDefeat } from '../src/core/commands';
import { resolveEnemyCard } from '../src/core/engine/handlers/combat';
import { applyStatusEffect } from '../src/core/combat/status-effects';
import { makeCombatState, attackCard, blockCard } from './helpers';

/**
 * Characterization tests — ล็อกพฤติกรรม *ปัจจุบัน* ของระบบดาเมจไว้ก่อนรีแฟกเตอร์
 *
 * เทสต์บางข้อในไฟล์นี้บันทึกพฤติกรรมที่ "ผิด" อยู่จริง และถูกทำเครื่องหมายไว้ว่า [บั๊ก]
 * → Phase 1 จะแก้โค้ดแล้วมาแก้ค่าคาดหวังของเทสต์เหล่านั้นอย่างจงใจ
 */

describe('ผู้เล่นโจมตีศัตรู', () => {
  it('ศัตรูไม่มี block → HP ลดเต็มจำนวน', () => {
    const { state } = makeCombatState({ hand: [attackCard(8)], enemyHp: 30, enemyBlock: 0 });
    applyCardEffect(state, 0);
    expect(state.enemy!.hp).toBe(22);
    expect(state.enemy!.block).toBe(0);
  });

  it('ศัตรูมี block น้อยกว่าดาเมจ → block หมด ส่วนเกินลง HP', () => {
    const { state } = makeCombatState({ hand: [attackCard(8)], enemyHp: 30, enemyBlock: 5 });
    applyCardEffect(state, 0);
    expect(state.enemy!.block).toBe(0);
    expect(state.enemy!.hp).toBe(27); // 8 - 5 = 3
  });

  it('ศัตรูมี block มากกว่าดาเมจ → HP ไม่ลด block เหลือส่วนต่าง', () => {
    const { state } = makeCombatState({ hand: [attackCard(4)], enemyHp: 30, enemyBlock: 10 });
    applyCardEffect(state, 0);
    expect(state.enemy!.hp).toBe(30);
    expect(state.enemy!.block).toBe(6);
  });

  it('HP ไม่ติดลบ', () => {
    const { state } = makeCombatState({ hand: [attackCard(999)], enemyHp: 10 });
    applyCardEffect(state, 0);
    expect(state.enemy!.hp).toBe(0);
    expect(isVictory(state)).toBe(true);
  });

  it('การ์ด block เพิ่ม block ให้ผู้เล่น', () => {
    const { state } = makeCombatState({ hand: [blockCard(6)], playerBlock: 2 });
    applyCardEffect(state, 0);
    expect(state.player.block).toBe(8);
  });
});

describe('ศัตรูโจมตีผู้เล่น (resolveEnemyCard)', () => {
  const resolve = (state: any, cardId: string) =>
    resolveEnemyCard(state, { type: 'ResolveEnemyCard', cardId } as any, {} as any);

  it('ผู้เล่นไม่มี block → HP ลดเต็มจำนวน', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    resolve(state, 'claw'); // dmg 6
    expect(state.player.hp).toBe(44);
  });

  it('ผู้เล่นมี block น้อยกว่าดาเมจ → block หมด ส่วนเกินลง HP', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 4 });
    resolve(state, 'claw'); // dmg 6
    expect(state.player.block).toBe(0);
    expect(state.player.hp).toBe(48); // 6 - 4 = 2
  });

  it('ผู้เล่นมี block มากกว่าดาเมจ → HP ไม่ลด', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 10 });
    resolve(state, 'claw'); // dmg 6
    expect(state.player.hp).toBe(50);
    expect(state.player.block).toBe(4);
  });

  it('การ์ด skill ของศัตรูเพิ่ม block ให้ศัตรู', () => {
    const { state } = makeCombatState({ enemyBlock: 0 });
    resolve(state, 'guard'); // block 7
    expect(state.enemy!.block).toBe(7);
  });

  it('HP ผู้เล่นถึง 0 → phase เป็น defeat', () => {
    const { state } = makeCombatState({ playerHp: 5, playerBlock: 0 });
    resolve(state, 'maul'); // dmg 13
    expect(state.player.hp).toBe(0);
    expect(isDefeat(state)).toBe(true);
    expect(state.phase).toBe('defeat');
  });
});

describe('status effect กับดาเมจ', () => {
  it('strength ของผู้เล่นเพิ่มดาเมจที่ผู้เล่นตี', () => {
    const { state } = makeCombatState({ hand: [attackCard(8)], enemyHp: 30 });
    applyStatusEffect('player', state, 'strength' as any, 3, 2);
    applyCardEffect(state, 0);
    // 8 + 2 stacks = 10
    expect(state.enemy!.hp).toBe(20);
  });

  it('weakness ของผู้เล่นลดดาเมจที่ผู้เล่นตี 25%', () => {
    const { state } = makeCombatState({ hand: [attackCard(8)], enemyHp: 30 });
    applyStatusEffect('player', state, 'weakness' as any, 3, 1);
    applyCardEffect(state, 0);
    // floor(8 * 0.75) = 6
    expect(state.enemy!.hp).toBe(24);
  });

  it('[บั๊ก] strength ของศัตรู *ไม่* เพิ่มดาเมจที่ศัตรูตี — resolveEnemyCard ข้าม status effect', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    applyStatusEffect('enemy', state, 'strength' as any, 3, 5);
    resolveEnemyCard(state, { type: 'ResolveEnemyCard', cardId: 'claw' } as any, {} as any);
    // ถูกต้องควรเป็น 6 + 5 = 11 → hp 39
    // ปัจจุบันได้ 6 เฉยๆ เพราะไม่เคยเรียก modifyDamageForStatusEffects ฝั่งศัตรู
    expect(state.player.hp).toBe(44);
  });

  it('[บั๊ก] weakness ของศัตรู *ไม่* ลดดาเมจที่ศัตรูตี', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    applyStatusEffect('enemy', state, 'weakness' as any, 3, 1);
    resolveEnemyCard(state, { type: 'ResolveEnemyCard', cardId: 'claw' } as any, {} as any);
    // ถูกต้องควรเป็น floor(6 * 0.75) = 4 → hp 46
    expect(state.player.hp).toBe(44);
  });

  it('[บั๊ก] vulnerable ไม่มีผลต่อดาเมจเลยทั้งสองฝั่ง (ประกาศไว้แต่ไม่ได้ต่อสาย)', () => {
    const { state } = makeCombatState({ hand: [attackCard(8)], enemyHp: 30 });
    applyStatusEffect('enemy', state, 'vulnerable' as any, 3, 1);
    applyCardEffect(state, 0);
    // ปกติ vulnerable ควรทำให้เป้าหมายรับดาเมจเพิ่ม แต่ตอนนี้ได้ 8 เท่าเดิม
    expect(state.enemy!.hp).toBe(22);
  });
});

describe('[บั๊ก] resolveEnemyCard ไม่หยุดเมื่อผู้เล่นตายแล้ว', () => {
  it('ยังคำนวณดาเมจต่อได้แม้ phase เป็น defeat แล้ว', () => {
    const { state } = makeCombatState({ playerHp: 5, playerBlock: 0 });
    const cmd = { type: 'ResolveEnemyCard', cardId: 'claw' } as any;

    resolveEnemyCard(state, cmd, {} as any);
    expect(state.phase).toBe('defeat');
    expect(state.player.hp).toBe(0);

    // ใบถัดไปที่ battle.tsx ตั้ง setTimeout ไว้ล่วงหน้ายังยิงเข้ามาได้
    // ฟังก์ชันเช็คแค่ !s.enemy ไม่ได้เช็ค phase → resolve ต่อโดยไม่บ่น
    const before = state.log.length;
    resolveEnemyCard(state, cmd, {} as any);
    expect(state.log.length).toBeGreaterThan(before);
  });
});
