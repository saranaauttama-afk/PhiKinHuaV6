import { describe, it, expect } from 'vitest';
import { applyCardEffect, isVictory, isDefeat } from '../src/core/commands';
import { applyStatusEffect } from '../src/core/combat/status-effects';
import { makeCombatState, runEnemyCards, attackCard, blockCard } from './helpers';

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

describe('ศัตรูโจมตีผู้เล่น', () => {
  it('ผู้เล่นไม่มี block → HP ลดเต็มจำนวน', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    const out = runEnemyCards(state, ['claw']); // dmg 6
    expect(out.player.hp).toBe(44);
  });

  it('ผู้เล่นมี block น้อยกว่าดาเมจ → block หมด ส่วนเกินลง HP', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 4 });
    const out = runEnemyCards(state, ['claw']); // dmg 6
    expect(out.player.block).toBe(0);
    expect(out.player.hp).toBe(48); // 6 - 4 = 2
  });

  it('ผู้เล่นมี block มากกว่าดาเมจ → HP ไม่ลด', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 10 });
    const out = runEnemyCards(state, ['claw']); // dmg 6
    expect(out.player.hp).toBe(50);
    expect(out.player.block).toBe(4);
  });

  it('การ์ด skill ของศัตรูเพิ่ม block ให้ศัตรู', () => {
    const { state } = makeCombatState({ enemyBlock: 0 });
    const out = runEnemyCards(state, ['guard']); // block 7
    expect(out.enemy!.block).toBe(7);
  });

  it('HP ผู้เล่นถึง 0 → phase เป็น defeat', () => {
    const { state } = makeCombatState({ playerHp: 5, playerBlock: 0 });
    const out = runEnemyCards(state, ['maul']); // dmg 13
    expect(out.player.hp).toBe(0);
    expect(isDefeat(out)).toBe(true);
    expect(out.phase).toBe('defeat');
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

  it('strength ของศัตรูเพิ่มดาเมจที่ศัตรูตี', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    applyStatusEffect('enemy', state, 'strength' as any, 3, 5);
    const out = runEnemyCards(state, ['claw']);
    // 6 + 5 stacks = 11
    expect(out.player.hp).toBe(39);
  });

  it('weakness ของศัตรูลดดาเมจที่ศัตรูตี 25%', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    applyStatusEffect('enemy', state, 'weakness' as any, 3, 1);
    const out = runEnemyCards(state, ['claw']);
    // floor(6 * 0.75) = 4
    expect(out.player.hp).toBe(46);
  });

  it('vulnerable ทำให้ผู้รับกินดาเมจเพิ่ม 50% (ฝั่งศัตรูเป็นผู้รับ)', () => {
    const { state } = makeCombatState({ hand: [attackCard(8)], enemyHp: 30 });
    applyStatusEffect('enemy', state, 'vulnerable' as any, 3, 1);
    applyCardEffect(state, 0);
    // 8 * 1.5 = 12
    expect(state.enemy!.hp).toBe(18);
  });

  it('vulnerable ทำงานฝั่งผู้เล่นเป็นผู้รับด้วย', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 0 });
    applyStatusEffect('player', state, 'vulnerable' as any, 3, 1);
    const out = runEnemyCards(state, ['claw']);
    // 6 * 1.5 = 9
    expect(out.player.hp).toBe(41);
  });
});

describe('เทิร์นศัตรูหยุดเมื่อคอมแบตจบแล้ว', () => {
  it('ใบที่เหลือไม่ถูกเล่นต่อหลังผู้เล่นตาย', () => {
    const { state } = makeCombatState({ playerHp: 7, playerBlock: 0 });
    // claw = 6 → ใบที่สองฆ่าพอดี ใบที่สามต้องไม่ถูกแตะ
    const out = runEnemyCards(state, ['claw', 'claw', 'claw']);

    expect(out.phase).toBe('defeat');
    expect(out.player.hp).toBe(0);

    const revealed = (out.pendingEvents ?? []).filter(e => e.t === 'EnemyCardRevealed');
    expect(revealed).toHaveLength(2);
  });

  it('สั่ง ResolveEnemyTurn ซ้ำหลังแพ้แล้วไม่ทำอะไรเพิ่ม', () => {
    const { state } = makeCombatState({ playerHp: 5, playerBlock: 0 });
    const dead = runEnemyCards(state, ['maul']);
    expect(dead.phase).toBe('defeat');

    const again = runEnemyCards(dead, ['maul']);
    expect(again.player.hp).toBe(0);
    expect(again.pendingEvents ?? []).toHaveLength(0);
  });
});
