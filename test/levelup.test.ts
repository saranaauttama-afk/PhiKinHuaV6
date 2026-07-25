import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';

/**
 * ลูปเลเวลอัป — engine เตรียม state.levelUp ไว้อยู่แล้ว แต่เดิมไม่มี UI
 * (phase 'levelup' ถูก VictoryOverlay กลืน) เทสต์ชุดนี้ยืนยันว่า command
 * ที่หน้าจอใหม่เรียกใช้ทำงานถูกต้องจริง
 */

function step(s: GameState, cmd: Command, seed = 'lvl'): GameState {
  return applyCommand(s, cmd, makeRng(seed)).state;
}

/** พาไปถึง phase 'levelup' โดยให้ EXP พอดีขึ้นเลเวล */
function reachLevelUp(seed = 'lvl'): GameState {
  let s = applyCommand(
    { seed, phase: 'start', turn: 0 } as unknown as GameState,
    { type: 'NewRun', seed },
    makeRng(seed)
  ).state;
  s = step(s, { type: 'ChooseStarterBlessing', index: 0 }, seed);

  const idx = (s.pages!.current!.offers as any[]).findIndex(
    o => o.kind === 'monster' || o.kind === 'boss'
  );
  if (idx < 0) return s;

  s = step(s, { type: 'ChooseOffer', index: idx }, seed);

  // ดัน EXP ให้ใกล้ขึ้นเลเวล แล้วฆ่าศัตรูด้วยการ์ด
  s.player.exp = s.player.expToNext - 1;
  s.enemy!.hp = 1;
  s.piles.hand = [
    { id: 'k', name: 'k', type: 'attack', cost: 0, dmg: 99, instanceId: 'k1' },
  ];
  return step(s, { type: 'PlayCard', index: 0 }, seed);
}

describe('เข้าสู่หน้าเลเวลอัป', () => {
  it('ชนะแล้วขึ้นเลเวล → phase เป็น levelup พร้อมคู่ตัวเลือก', () => {
    const s = reachLevelUp();
    expect(s.phase).toBe('levelup');
    expect(s.levelUp?.choice).toBeDefined();
    expect(s.levelUp!.choice!.optionA).toBeTruthy();
    expect(s.levelUp!.choice!.optionB).toBeTruthy();
    expect(s.levelUp!.consumed).toBe(false);
    expect(s.player.level).toBeGreaterThan(1);
  });

  it('ตัวเลือกสองข้างไม่ซ้ำกัน', () => {
    const s = reachLevelUp();
    expect(s.levelUp!.choice!.optionA).not.toBe(s.levelUp!.choice!.optionB);
  });
});

describe('เลือกรางวัล', () => {
  it('เลือกแล้ว consumed และกลับไป phase victory', () => {
    let s = reachLevelUp();
    s = step(s, { type: 'ChooseLevelUpOption', option: 'A', index: 0 });

    expect(s.levelUp!.consumed).toBe(true);
    expect(s.phase).toBe('victory');
    expect(s.levelUp!.choice!.selectedOption).toBe('A');
  });

  it('เลือกซ้ำอีกครั้งไม่มีผล (กันกดรัว)', () => {
    let s = reachLevelUp();
    s = step(s, { type: 'ChooseLevelUpOption', option: 'A', index: 0 });
    const snapshot = JSON.stringify(s.player);

    s = step(s, { type: 'ChooseLevelUpOption', option: 'B', index: 0 });
    expect(JSON.stringify(s.player)).toBe(snapshot);
  });

  it('ตัวเลือกที่ให้การ์ดใส่การ์ดเข้าสำรับจริง', () => {
    let s = reachLevelUp();
    const choice = s.levelUp!.choice!;
    const opt: 'A' | 'B' | null =
      choice.optionA === 'cards' ? 'A' : choice.optionB === 'cards' ? 'B' : null;
    if (!opt) return; // seed นี้ไม่ได้ให้ตัวเลือกการ์ด

    const before = s.masterDeck.length;
    const picked = s.levelUp!.cardChoices![0];
    s = step(s, { type: 'ChooseLevelUpOption', option: opt, index: 0 });

    expect(s.masterDeck.length).toBe(before + 1);
    expect(s.masterDeck.some(c => c.id === picked.id)).toBe(true);
  });

  it('ตัวเลือกที่เพิ่มค่าสถานะมีผลกับผู้เล่นจริง', () => {
    let s = reachLevelUp();
    const choice = s.levelUp!.choice!;

    const statBuckets = ['max_hp', 'max_energy', 'max_hand', 'equipment_slot'];
    const opt: 'A' | 'B' | null =
      statBuckets.includes(choice.optionA) ? 'A'
      : statBuckets.includes(choice.optionB) ? 'B'
      : null;
    if (!opt) return;

    const bucket = opt === 'A' ? choice.optionA : choice.optionB;
    const before = { ...s.player };
    s = step(s, { type: 'ChooseLevelUpOption', option: opt, index: 0 });

    if (bucket === 'max_hp')          expect(s.player.maxHp).toBeGreaterThan(before.maxHp);
    if (bucket === 'max_energy')      expect(s.player.maxEnergy).toBeGreaterThan(before.maxEnergy!);
    if (bucket === 'max_hand')        expect(s.player.maxHandSize).toBeGreaterThan(before.maxHandSize!);
    if (bucket === 'equipment_slot')  expect(s.equipmentSlotsMax).toBeGreaterThan(0);
  });
});

describe('ข้ามเลเวลอัป', () => {
  it('SkipLevelUp ปิดหน้าโดยไม่ค้าง phase', () => {
    let s = reachLevelUp();
    s = step(s, { type: 'SkipLevelUp' });

    expect(s.phase).not.toBe('levelup');
    expect(s.levelUp?.consumed ?? true).toBe(true);
  });
});
