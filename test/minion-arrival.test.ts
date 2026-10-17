// test/minion-arrival.test.ts — ลูกสมุนผีลงสนามแล้วทำทันที (owner decision 16 Oct 2026).
// Before: a 5–10 HP taunt acted only at the end of the ghost turn, so one player hit erased it
// before it mattered. Now every ghost minion has a one-time `arrive` effect; no countdown.
import { describe, it, expect } from 'vitest';
import type { GameState } from '../src/core/types';
import { makeCombatState } from './helpers';
import { MINION_DEFS, minionDef, summonMinion } from '../src/core/combat/minions';
import { enemySummonValue } from '../src/core/combat/enemyPlan';
import { resetCardsPlayed } from '../src/core/cards/mechanics';

function fight(): GameState {
  const { state: s } = makeCombatState({ enemyHp: 200, playerHp: 60 });
  s.player.maxHp = 60;
  s.classId = 'warrior';
  s.fight = { hpLost: 0, ghostTurns: 0, rhythm: 0 };
  s.turn = 1;
  s.turnFlags = { blessingOnce: {} };
  resetCardsPlayed(s);
  s.enemy!.statusEffects = [];
  s.player.statusEffects = [];
  s.enemyMinions = [];
  return s;
}

describe('ลูกสมุนผีลงสนามแล้วทำทันที', () => {
  it('ลูกสมุนผีทุกตัวมีผลตอนลงสนาม และคำอธิบายบอกไว้', () => {
    const ghosts = MINION_DEFS.filter(m => m.side === 'enemy');
    expect(ghosts.length).toBeGreaterThan(0);
    for (const m of ghosts) {
      expect(m.arrive, m.id).toBeTruthy();
      expect(m.desc, m.id).toMatch(/^ลงสนามปุ๊บ/);
      expect(m.turns, m.id).toBeUndefined(); // no countdown
    }
  });

  it('ตีทันทีตอนเรียก ไม่ต้องรอท้ายเทิร์นผี', () => {
    const s = fight();
    summonMinion(s, 'enemy', 'suea_saming');
    expect(s.player.hp).toBe(55);
  });

  it('ให้เกราะผีทันที', () => {
    const s = fight();
    s.enemy!.block = 0;
    summonMinion(s, 'enemy', 'forest_shade');
    expect(s.enemy!.block).toBe(5);
  });

  it('ฮีลผีทันที (ไม่เกินเลือดสูงสุด)', () => {
    const s = fight();
    s.enemy!.maxHp = 200; s.enemy!.hp = 190;
    summonMinion(s, 'enemy', 'luk_daeng');
    expect(s.enemy!.hp).toBe(194);
  });

  it('ติดพิษทันที', () => {
    const s = fight();
    summonMinion(s, 'enemy', 'phrai_nam');
    expect(s.player.statusEffects!.find(e => e.id === 'poison')?.stacks).toBe(2);
  });

  it('ปัดเกราะเราออก แต่ไม่ทำลายเกินที่มี', () => {
    const s = fight();
    s.player.block = 3;
    summonMinion(s, 'enemy', 'pong_monkey');
    expect(s.player.block).toBe(0);
    s.player.block = 10;
    summonMinion(s, 'enemy', 'pong_monkey');
    expect(s.player.block).toBe(6);
  });

  it('เรียกตอนช่องเต็ม: ตัวเก่าสุดถอยออก และตัวใหม่ยังมีผลตอนลง', () => {
    const s = fight();
    for (let i = 0; i < 3; i++) summonMinion(s, 'enemy', 'ash_bones');
    const hp = s.player.hp;
    summonMinion(s, 'enemy', 'ash_bones');
    expect(s.enemyMinions!.length).toBe(3);
    expect(hp - s.player.hp).toBe(3);
  });

  it('ศิษย์ค่ายของเราไม่มีผลตอนลงสนามแบบนี้', () => {
    for (const m of MINION_DEFS.filter(d => d.side === 'player')) expect(m.arrive, m.id).toBeUndefined();
  });

  it('AI ผีให้ค่าการเรียกสูงขึ้นจากผลตอนลง', () => {
    const s = fight();
    const def = minionDef('suea_saming')!;
    const withArrive = enemySummonValue(s, 'suea_saming');
    const saved = def.arrive;
    try { delete (def as any).arrive; expect(enemySummonValue(s, 'suea_saming')).toBeLessThan(withArrive); }
    finally { (def as any).arrive = saved; }
  });

  it('ปัดเกราะไม่มีค่าเมื่อเราไม่มีเกราะ', () => {
    const s = fight();
    s.player.block = 0;
    const none = enemySummonValue(s, 'pong_monkey');
    s.player.block = 8;
    expect(enemySummonValue(s, 'pong_monkey')).toBeGreaterThan(none);
  });
});

import { combatFrame } from '../src/core/combat/damage';
describe('ภาพเล่นซ้ำเทิร์นผี', () => {
  it('เฟรมเก็บแถวสมุน: สมุนโผล่ตอนการ์ดเรียกถูกเล่น ไม่ใช่ตั้งแต่ต้นเทิร์นผี', () => {
    const s = fight();
    const before = combatFrame(s);
    summonMinion(s, 'enemy', 'pong_monkey');
    const after = combatFrame(s);
    expect(before.enemyMinions).toEqual([]);
    expect(after.enemyMinions!.map((m: any) => m.id)).toEqual(['pong_monkey']);
    // the frame is a copy: later changes do not leak into an earlier beat
    s.enemyMinions![0].hp = 1;
    expect(after.enemyMinions![0].hp).toBe(6);
  });
});
