import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { getTierForFight, getRandomMonsterFromTier } from '../src/core/monsters/thai-ghosts';
import { rollThreeCards } from '../src/core/level';
import {
  getCurrentAdaptation,
  learnFromPlayerAction,
  resetAILearning,
} from '../src/core/adaptiveAI';

/**
 * Phase 5 — seed เดียวกันต้องได้รันเดียวกันทุกครั้ง
 *
 * `gameSpec.txt` กำหนดไว้ว่ารันต้องซ้ำได้ และ `rng.ts` เขียนหัวไฟล์ว่า "no Math.random"
 * แต่ก่อนหน้านี้มี Math.random อยู่ 22 จุด รวมถึงจุดที่เลือก tier และตัวมอนสเตอร์
 * เทสต์ชุดนี้เป็นตาข่ายกันไม่ให้หลุดกลับไปอีก
 */

function playRun(seed: string, cmds: Command[]): GameState {
  let s = { seed, phase: 'start', turn: 0 } as unknown as GameState;
  let r = makeRng(seed);
  for (const c of cmds) {
    const out = applyCommand(s, c, r);
    s = out.state;
    r = out.rng;
  }
  return s;
}

const START: Command[] = [
  { type: 'NewRun', seed: 'determinism' },
  { type: 'ChooseStarterBlessing', index: 0 },
];

const offerKinds = (s: GameState) =>
  (s.pages?.current?.offers ?? []).map(o => JSON.stringify(o));

describe('การสร้างแผนที่ซ้ำได้ตาม seed', () => {
  it('seed เดียวกัน → offer ชุดเดียวกันเป๊ะ', () => {
    const a = playRun('determinism', START);
    const b = playRun('determinism', START);
    expect(offerKinds(a)).toEqual(offerKinds(b));
  });

  it('seed ต่างกัน → ได้แผนที่ต่างกัน (ไม่ใช่ค่าคงที่ตายตัว)', () => {
    const seen = new Set<string>();
    for (const seed of ['a1', 'b2', 'c3', 'd4', 'e5', 'f6']) {
      const s = playRun(seed, [
        { type: 'NewRun', seed },
        { type: 'ChooseStarterBlessing', index: 0 },
      ]);
      seen.add(offerKinds(s).join('|'));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('รันยาวหลายหน้าแล้วยังตรงกันทุกขั้น', () => {
    const longRun: Command[] = [
      ...START,
      { type: 'DismissOffer', index: 2 },
      { type: 'Proceed' },
      { type: 'Proceed' },
    ];
    const a = playRun('determinism', longRun);
    const b = playRun('determinism', longRun);

    expect(offerKinds(a)).toEqual(offerKinds(b));
    expect(a.pages?.pageIndex).toBe(b.pages?.pageIndex);
    expect(JSON.stringify(a.pages?.pools)).toBe(JSON.stringify(b.pages?.pools));
  });
});

describe('การเลือกมอนสเตอร์ซ้ำได้ตาม seed', () => {
  it('getTierForFight ให้ผลเดิมเมื่อ rng เหมือนกัน', () => {
    for (const fight of [1, 3, 5, 8, 11, 13]) {
      const a = getTierForFight(fight, makeRng('mon'));
      const b = getTierForFight(fight, makeRng('mon'));
      expect(a.tier).toBe(b.tier);
      expect(a.rng).toEqual(b.rng);
    }
  });

  it('getTierForFight เดินสถานะ rng ไปข้างหน้าเสมอ (ไม่คืนตัวเดิม)', () => {
    const start = makeRng('mon');
    const out = getTierForFight(3, start);
    expect(out.rng).not.toEqual(start);
  });

  it('getRandomMonsterFromTier ให้ผีตัวเดิมเมื่อ rng เหมือนกัน', () => {
    const a = getRandomMonsterFromTier('T1', makeRng('ghost'));
    const b = getRandomMonsterFromTier('T1', makeRng('ghost'));
    expect(a.monster.id).toBe(b.monster.id);
  });

  it('rng ต่างกัน → ได้ผีต่างตัวบ้าง', () => {
    const ids = new Set(
      ['s1', 's2', 's3', 's4', 's5', 's6'].map(
        s => getRandomMonsterFromTier('T3', makeRng(s)).monster.id
      )
    );
    expect(ids.size).toBeGreaterThan(1);
  });
});

describe('รางวัลเลเวลอัปซ้ำได้ตาม seed', () => {
  it('rollThreeCards ให้การ์ดชุดเดิมเมื่อ rng เหมือนกัน', () => {
    const a = rollThreeCards(makeRng('lvl'), 8);
    const b = rollThreeCards(makeRng('lvl'), 8);
    expect(a.list.map(c => c.id)).toEqual(b.list.map(c => c.id));
  });
});

describe('สถานะ AI ผูกกับ state ไม่ใช่ตัวแปรระดับโมดูล', () => {
  /** ดันให้ AI ปรับความยากขึ้น: ผู้เล่นเลือดต่ำ + ศัตรูเลือดเต็ม → damageMultiplier 0.9 */
  function makeAIAdapt(s: GameState) {
    s.player.hp = Math.floor(s.player.maxHp * 0.1);
    s.enemy = { id: 'x', name: 'x', hp: 100, maxHp: 100, dmg: 1, block: 0 } as any;
    learnFromPlayerAction(s, 'turn_end', { energyUsed: 0, blockGained: 0 });
    return s;
  }

  it('รันใหม่ไม่รับค่าความยากที่ค้างจากรันก่อน', () => {
    // รันแรก — ดันให้ AI ปรับตัวจนตัวคูณเปลี่ยนไปจากค่าเริ่มต้น
    const first = makeAIAdapt(
      playRun('ai-a', [
        { type: 'NewRun', seed: 'ai-a' },
        { type: 'ChooseStarterBlessing', index: 0 },
      ])
    );
    expect(getCurrentAdaptation(first).damageMultiplier).not.toBe(1.0);

    // รันใหม่ต้องเริ่มที่ค่าเริ่มต้นเสมอ
    // (เดิมตัวแปรอยู่ระดับโมดูล ค่านี้จะค้างข้ามรันใน session เดียวกัน)
    const second = playRun('ai-b', [
      { type: 'NewRun', seed: 'ai-b' },
      { type: 'ChooseStarterBlessing', index: 0 },
    ]);
    expect(getCurrentAdaptation(second).damageMultiplier).toBe(1.0);
  });

  it('สองรันที่เล่นพร้อมกันไม่กวนสถานะ AI ของกันและกัน', () => {
    const a = makeAIAdapt(
      playRun('par-a', [
        { type: 'NewRun', seed: 'par-a' },
        { type: 'ChooseStarterBlessing', index: 0 },
      ])
    );
    const b = playRun('par-b', [
      { type: 'NewRun', seed: 'par-b' },
      { type: 'ChooseStarterBlessing', index: 0 },
    ]);

    expect(getCurrentAdaptation(a).damageMultiplier).not.toBe(1.0);
    expect(getCurrentAdaptation(b).damageMultiplier).toBe(1.0);
  });

  it('resetAILearning ล้างตัวคูณความยากกลับเป็นค่าเริ่มต้นจริง', () => {
    const s = makeAIAdapt(
      playRun('reset', [
        { type: 'NewRun', seed: 'reset' },
        { type: 'ChooseStarterBlessing', index: 0 },
      ])
    );
    expect(getCurrentAdaptation(s).damageMultiplier).not.toBe(1.0);

    resetAILearning(s);
    expect(getCurrentAdaptation(s).damageMultiplier).toBe(1.0);
  });
});

describe('การต่อสู้ซ้ำได้ตาม seed', () => {
  function fightOnce(seed: string) {
    let s = playRun(seed, [
      { type: 'NewRun', seed },
      { type: 'ChooseStarterBlessing', index: 0 },
    ]);
    const idx = (s.pages!.current!.offers as PageOffer[]).findIndex(
      o => o.kind === 'monster' || o.kind === 'boss'
    );
    if (idx < 0) return null;

    let r = makeRng(seed);
    ({ state: s, rng: r } = applyCommand(s, { type: 'ChooseOffer', index: idx }, r));
    ({ state: s, rng: r } = applyCommand(s, { type: 'ResolveEnemyTurn' }, r));
    return s;
  }

  it('เทิร์นศัตรูให้ผลเดิมทุกครั้งด้วย seed เดิม', () => {
    for (const seed of ['fight-1', 'fight-2', 'fight-3']) {
      const a = fightOnce(seed);
      const b = fightOnce(seed);
      if (!a || !b) continue;

      expect(a.player.hp).toBe(b.player.hp);
      expect(a.player.block).toBe(b.player.block);
      expect(a.enemy?.id).toBe(b.enemy?.id);
      expect(JSON.stringify(a.pendingEvents)).toBe(JSON.stringify(b.pendingEvents));
      return;
    }
  });
});
