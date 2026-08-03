import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { applyStatusEffect } from '../src/core/combat/status-effects';
import { enemyCardById } from '../src/core/pack_enemy_cards';

/**
 * เทิร์นศัตรู — ตัดสินใจตอนถึงตาจริง ไม่ประกาศล่วงหน้า
 *
 * เดิมศัตรูเลือกไพ่ไว้ตั้งแต่ท้ายเทิร์นก่อนหน้า เพราะต้องเอาไปโชว์บนป้าย intent
 * ตอนนี้ไม่โชว์แล้ว การตัดสินใจจึงเลื่อนมาอยู่ที่ `ResolveEnemyTurn`
 *
 * ที่สำคัญกว่าการ "เอาป้ายออก" คือ **ศัตรูเห็นกระดานจริงตอนที่ตัดสินใจ** —
 * เห็นการ์ดที่ผู้เล่นเพิ่งตั้งและเลือดที่เพิ่งเสีย ไม่ใช่ภาพเมื่อเทิร์นที่แล้ว
 */

function startFight(seed = 'enemy-turn', monsterId = 'phi-krasue'): GameState {
  let s: any = { seed, phase: 'start', turn: 0 };
  let r = makeRng(seed);
  const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

  go({ type: 'NewRun', seed });
  go({ type: 'ChooseStarterBlessing', index: 0 });
  s.pages.current.offers[0] = { kind: 'monster', tier: 'normal', enemyId: monsterId } as PageOffer;
  go({ type: 'ChooseOffer', index: 0 });
  return s;
}

const step = (s: GameState, c: Command, seed = 'enemy-turn') =>
  applyCommand(s, c, makeRng(seed)).state;

describe('ไม่มีการประกาศท่าล่วงหน้า', () => {
  it('เข้าไฟต์แล้วยังไม่มีแผนของศัตรูค้างอยู่', () => {
    const s = startFight();
    expect(s.enemyIntent, 'ไม่ควรมีแผนล่วงหน้าตั้งแต่ยังไม่ถึงตาศัตรู').toBeUndefined();
  });

  it('จบเทิร์นศัตรูแล้วก็ไม่ทิ้งแผนของเทิร์นหน้าไว้', () => {
    const s = step(startFight(), { type: 'ResolveEnemyTurn' });
    expect(s.enemyIntent).toBeUndefined();
  });
});

describe('ศัตรูลงมือจริงเมื่อถึงตา', () => {
  it('เล่นการ์ดออกมาจริง และ event ที่ได้ตรงกับการ์ดที่เล่น', () => {
    const s = step(startFight(), { type: 'ResolveEnemyTurn' });

    const revealed = (s.pendingEvents ?? []).filter(e => e.t === 'EnemyCardRevealed');
    expect(revealed.length, 'ศัตรูต้องลงมืออะไรสักอย่าง').toBeGreaterThan(0);
    expect(s.enemyLastPlayed).toEqual(revealed.map(e => (e as any).cardId));
  });

  it('ไม่เล่นเกินพลังงานที่มี', () => {
    for (const seed of ['e1', 'e2', 'e3', 'e4', 'e5']) {
      const before = startFight(seed);
      const budget = before.enemy!.maxEnergy ?? 2;
      const s = step(before, { type: 'ResolveEnemyTurn' }, seed);

      const used = (s.enemyLastPlayed ?? [])
        .reduce((sum, id) => sum + (enemyCardById(id)?.energyCost ?? 1), 0);

      expect(used, `seed ${seed}`).toBeLessThanOrEqual(budget);
    }
  });

  it('ดาเมจที่โดนจริงเท่ากับผลรวมของการ์ดที่เล่น (ตอนไม่มี block)', () => {
    let s: any = startFight();
    s.player.block = 0;
    const hpBefore = s.player.hp;

    s = step(s, { type: 'ResolveEnemyTurn' });

    const dealt = (s.pendingEvents ?? [])
      .filter((e: any) => e.t === 'Damage' && e.target === 'player')
      .reduce((sum: number, e: any) => sum + e.hpLoss, 0);

    expect(hpBefore - s.player.hp).toBe(dealt);
  });

  it('block ของผู้เล่นกันดาเมจได้จริง', () => {
    const seed = 'blocked';
    const plain = step(startFight(seed), { type: 'ResolveEnemyTurn' }, seed);
    const lostPlain = plain.player.maxHp - plain.player.hp;

    if (lostPlain === 0) return; // ศัตรูตั้งการ์ดอย่างเดียวรอบนี้

    let guarded: any = startFight(seed);
    guarded.player.block = 99;
    guarded = step(guarded, { type: 'ResolveEnemyTurn' }, seed);

    expect(guarded.player.hp).toBe(guarded.player.maxHp);
  });
});

describe('ศัตรูตัดสินใจจากกระดานตอนนั้น', () => {
  /**
   * ข้อนี้คือเหตุผลที่ย้ายการตัดสินใจมาไว้ตอนถึงตา ไม่ใช่แค่ซ่อนป้าย
   * ศัตรูที่ติด strength ตอนกลางเทิร์นผู้เล่น ต้องตีแรงขึ้นในเทิร์นเดียวกันนั้น
   * ถ้ายังเลือกไพ่ไว้ล่วงหน้า ผลของสถานะที่เพิ่งติดจะไปมีผลช้าไปหนึ่งเทิร์น
   */
  it('สถานะที่เพิ่งติดกลางเทิร์นผู้เล่น มีผลกับเทิร์นศัตรูรอบนั้นเลย', () => {
    const seed = 'str';
    const base = step(startFight(seed), { type: 'ResolveEnemyTurn' }, seed);
    const plainDmg = (base.pendingEvents ?? [])
      .filter((e: any) => e.t === 'Damage' && e.target === 'player')
      .reduce((sum: number, e: any) => sum + e.modified, 0);

    if (plainDmg === 0) return; // รอบนี้ศัตรูไม่ตี

    let buffed: any = startFight(seed);
    applyStatusEffect('enemy', buffed, 'strength' as any, 5, 4);
    buffed = step(buffed, { type: 'ResolveEnemyTurn' }, seed);

    const buffedDmg = (buffed.pendingEvents ?? [])
      .filter((e: any) => e.t === 'Damage' && e.target === 'player')
      .reduce((sum: number, e: any) => sum + e.modified, 0);

    expect(buffedDmg).toBeGreaterThan(plainDmg);
  });
});

describe('ยังซ้ำได้ตาม seed', () => {
  it('seed เดิม → ศัตรูเล่นชุดเดิม', () => {
    for (const seed of ['rep-1', 'rep-2', 'rep-3']) {
      const a = step(startFight(seed), { type: 'ResolveEnemyTurn' }, seed);
      const b = step(startFight(seed), { type: 'ResolveEnemyTurn' }, seed);
      expect(a.enemyLastPlayed, `seed ${seed}`).toEqual(b.enemyLastPlayed);
    }
  });
});
