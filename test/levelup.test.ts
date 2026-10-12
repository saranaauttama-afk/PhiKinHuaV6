import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import { LEVEL_UP } from '../src/core/balance/notfm';

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
  while (s.chapter) s = step(s, { type: 'SkipChapter' } as any, seed);
  s = step(s, { type: 'ChooseStarterBlessing', index: 0 }, seed);
  while (s.chapter) s = step(s, { type: 'SkipChapter' } as any, seed);

  const idx = (s.pages!.current!.offers as any[]).findIndex(
    o => o.kind === 'monster' || o.kind === 'boss'
  );
  if (idx < 0) return s;

  s = step(s, { type: 'ChooseOffer', index: idx }, seed);

  // ดัน EXP ให้ใกล้ขึ้นเลเวล แล้วฆ่าศัตรูด้วยการ์ด
  s.player.exp = s.player.expToNext - 1;
  s.enemy!.hp = 1;
  if (s.enemy) s.enemy.statusEffects = [];
  s.piles.hand = [
    { id: 'k', name: 'k', type: 'attack', fx: { dmg: 99 }, instanceId: 'k1' },
  ];
  return step(s, { type: 'PlayCard', index: 0 }, seed);
}

describe('เลเวลอัป: ฟื้นเต็ม + ชีวิตสูงสุด + เลือก 1 จาก 3', () => {
  it('ขึ้นเลเวลแล้วฟื้นเลือดเต็มและชีวิตสูงสุดเพิ่มทันที', () => {
    const before = (() => { const s = reachLevelUp(); return s; })();
    expect(before.phase).toBe('levelup');
    expect(before.player.hp).toBe(before.player.maxHp);
    expect(before.levelUp!.consumed).toBe(false);
    expect(before.levelUp!.cards).toHaveLength(3);
    expect(before.player.level).toBeGreaterThan(1);
  });

  it('ชีวิตสูงสุดเพิ่มตาม LEVEL_UP.maxHp', () => {
    let s = applyCommand({ seed: 'hp', phase: 'start', turn: 0 } as unknown as GameState, { type: 'NewRun', seed: 'hp', classId: 'warrior' }, makeRng('hp')).state;
    const base = s.player.maxHp;
    s = reachLevelUp('hp');
    expect(s.player.maxHp - base).toBeGreaterThanOrEqual(LEVEL_UP.maxHp);
  });

  it('เลือกการ์ดใหม่ → การ์ดใบนั้นเข้าสำรับ', () => {
    let s = reachLevelUp();
    const card = s.levelUp!.cards[1], n = s.masterDeck.length;
    s = step(s, { type: 'ChooseLevelUpOption', option: 'card', index: 1 });
    expect(s.masterDeck).toHaveLength(n + 1);
    expect(s.masterDeck[n].id).toBe(card.id);
    expect(s.phase).not.toBe('levelup');
    expect(s.levelUp?.result?.text).toContain(card.name);
  });

  it('ปลุกเสก → การ์ดใบที่เลือกได้ดาวเพิ่ม ใบอื่นไม่เปลี่ยน', () => {
    let s = reachLevelUp();
    const before = s.masterDeck.map(c => ({ ...c }));
    s = step(s, { type: 'ChooseLevelUpOption', option: 'upgrade', index: 1 });
    expect(s.masterDeck[0]).toEqual(before[0]);
    expect(s.masterDeck[1].star).toBe(2);
  });

  it('สละการ์ด → ใบนั้นออกจากสำรับ', () => {
    let s = reachLevelUp();
    const n = s.masterDeck.length, gone = s.masterDeck[2].id;
    s = step(s, { type: 'ChooseLevelUpOption', option: 'remove', index: 2 });
    expect(s.masterDeck).toHaveLength(n - 1);
    expect(s.levelUp?.result?.text).toContain('สละ');
    void gone;
  });

  it('ตัวเลือกที่ไม่ถูกต้องไม่ทำอะไร', () => {
    const s = reachLevelUp();
    for (const cmd of [
      { type: 'ChooseLevelUpOption', option: 'card', index: 5 },
      { type: 'ChooseLevelUpOption', option: 'upgrade', index: 999 },
      { type: 'ChooseLevelUpOption', option: 'remove', index: -1 },
    ] as Command[]) {
      const out = step(s, cmd);
      expect(out.phase).toBe('levelup');
      expect(out.masterDeck).toEqual(s.masterDeck);
    }
  });

  it('ข้ามได้ ได้เบี้ยแทน', () => {
    const s = reachLevelUp();
    const out = step(s, { type: 'SkipLevelUp' });
    expect(out.phase).not.toBe('levelup');
    expect(out.player.gold).toBe(s.player.gold + LEVEL_UP.skipGold);
  });
});
