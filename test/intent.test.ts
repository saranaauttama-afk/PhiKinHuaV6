import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { applyStatusEffect } from '../src/core/combat/status-effects';
import { planEnemyIntent } from '../src/core/combat/intent';
import { enemyCardById } from '../src/core/pack_enemy_cards';

/**
 * ระบบ intent — ผู้เล่นต้องเห็นว่าศัตรูจะทำอะไรเทิร์นหน้า
 *
 * เดิมศัตรูจั่วการ์ดตอนถึงเทิร์นตัวเองแล้วเปิดคว่ำทีละใบ ผู้เล่นจึงเดาไม่ได้ว่า
 * ควรตีหรือควรตั้งการ์ด — เกมกลายเป็นการเดาแทนการวางแผน
 *
 * เงื่อนไขที่สำคัญที่สุดคือ **สิ่งที่โชว์ต้องตรงกับสิ่งที่เกิดขึ้นจริง**
 */

function startFight(seed = 'intent', monsterId = 'phi-krasue'): GameState {
  let s: any = { seed, phase: 'start', turn: 0 };
  let r = makeRng(seed);
  const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

  go({ type: 'NewRun', seed });
  go({ type: 'ChooseStarterBlessing', index: 0 });
  s.pages.current.offers[0] = { kind: 'monster', tier: 'normal', enemyId: monsterId } as PageOffer;
  go({ type: 'ChooseOffer', index: 0 });
  return s;
}

const step = (s: GameState, c: Command, seed = 'intent') =>
  applyCommand(s, c, makeRng(seed)).state;

describe('ประกาศเจตนาล่วงหน้า', () => {
  it('มี intent ตั้งแต่เทิร์นแรก ก่อนผู้เล่นลงมือ', () => {
    const s = startFight();
    expect(s.enemyIntent).toBeDefined();
    expect(s.enemyIntent!.cardIds.length).toBeGreaterThan(0);
  });

  it('intent บอกชนิดของการกระทำ', () => {
    const s = startFight();
    expect(['attack', 'defend', 'mixed', 'wait']).toContain(s.enemyIntent!.kind);
  });

  it('ตัวเลขบน intent ไม่ติดลบ', () => {
    const s = startFight();
    expect(s.enemyIntent!.damage).toBeGreaterThanOrEqual(0);
    expect(s.enemyIntent!.block).toBeGreaterThanOrEqual(0);
  });
});

describe('สิ่งที่โชว์ตรงกับสิ่งที่เกิดขึ้นจริง', () => {
  it('ศัตรูเล่นเฉพาะใบที่ประกาศไว้ ตามลำดับเดิม', () => {
    const s = startFight();
    const declared = [...s.enemyIntent!.cardIds];

    const after = step(s, { type: 'ResolveEnemyTurn' });
    const revealed = (after.pendingEvents ?? [])
      .filter(e => e.t === 'EnemyCardRevealed')
      .map(e => (e as any).cardId);

    expect(revealed).toEqual(declared);
  });

  it('ดาเมจที่โดนจริงเท่ากับตัวเลขที่ประกาศไว้ (ตอนไม่มี block)', () => {
    const s = startFight();
    s.player.block = 0;
    const declaredDamage = s.enemyIntent!.damage;
    const hpBefore = s.player.hp;

    const after = step(s, { type: 'ResolveEnemyTurn' });
    expect(hpBefore - after.player.hp).toBe(declaredDamage);
  });

  it('block ที่ศัตรูได้เท่ากับที่ประกาศไว้', () => {
    const s = startFight();
    const declaredBlock = s.enemyIntent!.block;
    if (declaredBlock === 0) return;

    const after = step(s, { type: 'ResolveEnemyTurn' });
    expect(after.enemy!.block).toBe(declaredBlock);
  });

  it('block ของผู้เล่นกันดาเมจได้ตามที่คำนวณจาก intent', () => {
    const s = startFight();
    const declaredDamage = s.enemyIntent!.damage;
    if (declaredDamage === 0) return;

    s.player.block = declaredDamage; // กันไว้พอดี
    const hpBefore = s.player.hp;

    const after = step(s, { type: 'ResolveEnemyTurn' });
    expect(after.player.hp).toBe(hpBefore);
  });
});

describe('intent สะท้อน status effect ที่มีผลจริง', () => {
  it('ศัตรูติด strength → ตัวเลขบน intent สูงขึ้นตาม', () => {
    const weak = startFight('str-a');
    const baseline = weak.enemyIntent!.damage;
    if (baseline === 0) return;

    const strong = startFight('str-a');
    applyStatusEffect('enemy', strong, 'strength' as any, 5, 4);
    planEnemyIntent(strong); // คำนวณ intent ใหม่หลังติดสถานะ

    expect(strong.enemyIntent!.damage).toBeGreaterThan(baseline);
  });

  it('ตัวเลขที่โชว์ยังตรงกับดาเมจจริงแม้ติดสถานะ', () => {
    const s = startFight('str-b');
    applyStatusEffect('enemy', s, 'strength' as any, 5, 3);
    planEnemyIntent(s);

    s.player.block = 0;
    const declared = s.enemyIntent!.damage;
    const hpBefore = s.player.hp;

    const after = step(s, { type: 'ResolveEnemyTurn' });
    expect(hpBefore - after.player.hp).toBe(declared);
  });
});

describe('intent ถูกประกาศใหม่ทุกเทิร์น', () => {
  it('หลังจบเทิร์นศัตรู มี intent ของเทิร์นถัดไปรออยู่แล้ว', () => {
    const s = startFight();
    const after = step(s, { type: 'ResolveEnemyTurn' });

    if (after.phase !== 'combat') return; // ผู้เล่นตายก็ไม่ต้องมี
    expect(after.enemyIntent).toBeDefined();
    expect(after.enemyIntent!.cardIds.length).toBeGreaterThan(0);
  });

  it('ศัตรูไม่เล่นเกินพลังงานที่มี', () => {
    const s = startFight();
    const totalCost = s.enemyIntent!.cardIds
      .map((id: string) => enemyCardById(id)?.energyCost ?? 1)
      .reduce((a: number, b: number) => a + b, 0);

    expect(totalCost).toBeLessThanOrEqual(s.enemy!.maxEnergy ?? 2);
  });
});
