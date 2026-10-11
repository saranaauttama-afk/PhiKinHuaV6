import { describe, it, expect } from 'vitest';
import { baseNewState } from '../src/core/commands';
import { makeRng, next, seedFromString } from '../src/core/rng';

// เทสต์ตัวแรก — ยืนยันว่า toolchain (vite plugin แปลง require + alias) ทำงานจริง
describe('toolchain', () => {
  it('โหลด src/core ได้และสร้าง state เริ่มต้นได้', () => {
    const s = baseNewState('test-seed');
    expect(s.seed).toBe('test-seed');
    expect(s.player.hp).toBeGreaterThan(0);
    expect(s.phase).toBe('start');
  });

  it('seeded RNG ให้ผลเดิมทุกครั้ง', () => {
    const roll3 = (seed: string) => {
      let r = makeRng(seedFromString(seed));
      return [0, 0, 0].map(() => {
        const out = next(r);
        r = out.rng;
        return out.value;
      });
    };
    expect(roll3('abc')).toEqual(roll3('abc'));
    expect(roll3('abc')).not.toEqual(roll3('xyz'));
  });
});
