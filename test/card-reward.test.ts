// test/card-reward.test.ts — การ์ดรางวัลหลังชนะไฟต์
//
// เหตุผลที่ระบบนี้มี: การ์ดใหม่เคยมาจากตัวเลือก `cards` ตอนเลเวลอัปทางเดียว
// ซึ่งเป็น 2 ใน 10 คู่ของตาราง วัดจริงได้สำรับโต 11.0 → 12.6 ใบ **ตลอดทั้งรัน**
// คลัง 97 ใบจึงเป็นคลังที่ผู้เล่นแตะไม่ถึง

import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import { FINAL_BOSS_FIGHT } from '../src/core/map/pages';
import { CHARACTER_CLASSES } from '../src/core/classes';
import { takeCardReward } from '../src/core/cards/reward';
import { resolveStoryIfAny } from './helpers';

/** เดินรันจนจบ เลือกการ์ดรางวัลใบแรกทุกครั้ง (`take`) หรือกดข้ามทุกครั้ง */
function playRun(seed: string, classId: string, take: boolean) {
  let s: any = { seed, phase: 'start', turn: 0 };
  let r = makeRng(seed);
  const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

  const skipChapters = () => {
    let g = 0;
    while (s.chapter && g++ < 30) go({ type: 'SkipChapter' } as Command);
  };
  /** ชนะไฟต์แล้วอาจมีเลเวลอัปและ/หรือการ์ดรางวัลค้างอยู่ */
  const clearRewards = () => {
    let g = 0;
    while (g++ < 10) {
      if (s.phase === 'levelup') { go({ type: 'SkipLevelUp' }); continue; }
      if (s.phase === 'reward') {
        go(take ? { type: 'ChooseCardReward', index: 0 } : { type: 'SkipCardReward' });
        continue;
      }
      break;
    }
  };

  go({ type: 'NewRun', seed, classId } as Command);
  skipChapters();
  go({ type: 'ChooseStarterBlessing', index: 0 });
  skipChapters();

  const startDeck = s.masterDeck.length;
  let rewardsOffered = 0;
  let guard = 0;

  while (guard++ < 400 && s.phase !== 'run_complete') {
    if (s.chapter) { skipChapters(); continue; }

    const offers = s.pages?.current?.offers ?? [];
    if (!offers.length) break;

    const i = offers.findIndex((o: any) => o.kind === 'monster' || o.kind === 'boss');
    if (i < 0) {
      go({ type: 'ChooseOffer', index: 0 });
      resolveStoryIfAny(s, go);
      go({ type: 'CompleteNode' });
      continue;
    }

    go({ type: 'ChooseOffer', index: i });
    if (s.phase !== 'combat') break;

    // ฆ่าให้จบในทีเดียว — เทสต์นี้วัดรางวัล ไม่ได้วัดการต่อสู้
    s.piles.hand = [
      { id: 'k', name: 'k', type: 'attack', cost: 0, dmg: 9999, instanceId: 'k1' },
    ];
    go({ type: 'PlayCard', index: 0 });

    if (s.cardReward) rewardsOffered += 1;
    clearRewards();
    go({ type: 'CompleteNode' });
    clearRewards();
  }

  return {
    state: s as GameState,
    startDeck,
    endDeck: s.masterDeck.length,
    rewardsOffered,
    fights: s.fightCount ?? 0,
  };
}

const SEEDS = ['r-a', 'r-b', 'r-c', 'r-d', 'r-e'];

describe('การ์ดรางวัล — สำรับโตจริง', () => {
  for (const classId of Object.keys(CHARACTER_CLASSES)) {
    it(`${classId}: หยิบทุกใบแล้วสำรับแตะ 20 ใบขึ้นไป`, () => {
      for (const seed of SEEDS) {
        const out = playRun(seed, classId, true);
        expect(out.state.phase, `${seed} รันไม่จบ`).toBe('run_complete');
        expect(out.endDeck, `${seed} สำรับจบที่ ${out.endDeck} ใบ`)
          .toBeGreaterThanOrEqual(20);
      }
    });

    it(`${classId}: กดข้ามทุกใบแล้วสำรับแทบไม่โต`, () => {
      // "ไม่เอาสักใบ" ต้องเป็นทางเลือกจริง ไม่ใช่ปุ่มที่แอบยัดการ์ดให้อยู่ดี
      //
      // ไม่ยืนยันว่า "เท่าเดิมเป๊ะ" เพราะเหตุการณ์เล่าเรื่องยังยัดของเข้าสำรับได้
      // (ทางเลือกที่โลภแจกคำสาป) — ที่ต้องยืนยันคือรางวัลชนะไฟต์ไม่แอบเข้ามา
      for (const seed of SEEDS) {
        const skipped = playRun(seed, classId, false);
        const taken = playRun(seed, classId, true);
        expect(skipped.endDeck - skipped.startDeck, `${seed} โตไปถึง ${skipped.endDeck}`)
          .toBeLessThanOrEqual(3);
        expect(taken.endDeck, seed).toBeGreaterThan(skipped.endDeck + 8);
      }
    });
  }

  it('ได้เลือกทุกไฟต์ ยกเว้นบอสสุดท้าย (และศึกลับที่ตามมา)', () => {
    const out = playRun('r-a', 'shaman', true);
    expect(out.fights).toBeGreaterThanOrEqual(FINAL_BOSS_FIGHT);
    // ไฟต์ 1..14 ได้เลือกครบ ไฟต์ 15 (บอสสุดท้าย) เป็นต้นไปไม่มี
    expect(out.rewardsOffered).toBe(FINAL_BOSS_FIGHT - 1);
  });

  it('ชนะบอสสุดท้ายแล้วไม่มีการ์ดมาคั่นก่อนจอสรุป', () => {
    const out = playRun('r-b', 'nun', true);
    expect(out.state.cardReward).toBeUndefined();
  });
});

describe('การ์ดรางวัล — การ์ดที่ได้ตรงคลาส', () => {
  for (const classId of Object.keys(CHARACTER_CLASSES)) {
    it(`${classId} ไม่ได้การ์ดของคลาสอื่นติดมา`, () => {
      const tag = CHARACTER_CLASSES[classId as keyof typeof CHARACTER_CLASSES].cardTag;
      const otherTags = Object.values(CHARACTER_CLASSES)
        .map(c => c.cardTag)
        .filter(t => t !== tag);

      const out = playRun('r-c', classId, true);
      const foreign = out.state.masterDeck.filter(
        c => otherTags.some(t => (c.tags ?? []).includes(t))
      );
      expect(foreign.map(c => c.id)).toEqual([]);
    });
  }
});

describe('การ์ดรางวัล — พฤติกรรมของ handler', () => {
  /** พาไปยืนที่ phase 'reward' หลังชนะไฟต์แรก */
  function reachReward(seed = 'h-1') {
    let s: any = { seed, phase: 'start', turn: 0 };
    let r = makeRng(seed);
    const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };
    let g = 0;
    go({ type: 'NewRun', seed });
    while (s.chapter && g++ < 30) go({ type: 'SkipChapter' } as Command);
    go({ type: 'ChooseStarterBlessing', index: 0 });
    while (s.chapter && g++ < 30) go({ type: 'SkipChapter' } as Command);

    const offers = s.pages?.current?.offers ?? [];
    const i = offers.findIndex((o: any) => o.kind === 'monster' || o.kind === 'boss');
    go({ type: 'ChooseOffer', index: i });
    s.piles.hand = [{ id: 'k', name: 'k', type: 'attack', cost: 0, dmg: 9999, instanceId: 'k1' }];
    go({ type: 'PlayCard', index: 0 });
    if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
    // คืนฟังก์ชันอ่านค่า ไม่ใช่ตัว state — `applyCommand` โคลนก้อนใหม่ทุกครั้ง
    // ถ้าคืนตัวมันไป เทสต์จะถือ snapshot เก่าและผ่านโดยไม่ได้ตรวจอะไรเลย
    return { get: () => s as GameState, go };
  }

  it('ชนะไฟต์แล้วมีสามใบให้เลือก', () => {
    const { get } = reachReward();
    expect(get().phase).toBe('reward');
    expect(get().cardReward!.choices.length).toBe(3);
  });

  it('เลือกแล้วการ์ดใบนั้นเข้าสำรับ และไปหน้าชนะ', () => {
    const { get, go } = reachReward();
    const before = get().masterDeck.length;
    const picked = get().cardReward!.choices[1];

    go({ type: 'ChooseCardReward', index: 1 });

    expect(get().masterDeck.length).toBe(before + 1);
    expect(get().masterDeck[get().masterDeck.length - 1].id).toBe(picked.id);
    expect(get().cardReward).toBeUndefined();
    expect(get().phase).toBe('victory');
  });

  it('กดข้ามแล้วสำรับเท่าเดิม และไปหน้าชนะ', () => {
    const { get, go } = reachReward();
    const before = get().masterDeck.length;

    go({ type: 'SkipCardReward' });

    expect(get().masterDeck.length).toBe(before);
    expect(get().cardReward).toBeUndefined();
    expect(get().phase).toBe('victory');
  });

  it('กดรัวไม่ได้การ์ดสองใบ', () => {
    const { get, go } = reachReward();
    const before = get().masterDeck.length;
    go({ type: 'ChooseCardReward', index: 0 });
    go({ type: 'ChooseCardReward', index: 0 });
    expect(get().masterDeck.length).toBe(before + 1);
  });

  it('ชี้ index นอกช่วงไม่ทำอะไร และยังเลือกใหม่ได้', () => {
    // กดพลาดไม่ควรกินรางวัลทิ้ง — ยังยืนอยู่หน้าเดิมและเลือกใหม่ได้
    const { get, go } = reachReward();
    const before = get().masterDeck.length;

    go({ type: 'ChooseCardReward', index: 99 });
    expect(get().masterDeck.length).toBe(before);
    expect(get().phase).toBe('reward');

    go({ type: 'ChooseCardReward', index: 0 });
    expect(get().masterDeck.length).toBe(before + 1);
  });
});

describe('takeCardReward — โคลนก่อนใส่สำรับ', () => {
  // ยิงเข้าฟังก์ชันตรงๆ ไม่ผ่าน `applyCommand` — reducer โคลน state ทั้งก้อน
  // ทุกคำสั่งอยู่แล้ว เทสต์ที่ยิงผ่าน reducer จึงผ่านได้แม้จะยัดตัวจริงเข้าไป
  // (ลองแล้ว: เปลี่ยนเป็น `push(card)` ตรงๆ เทสต์ยังเขียว) — ไม่ตรวจอะไรเลย
  function stateWithReward() {
    return {
      masterDeck: [] as any[],
      log: [] as string[],
      cardReward: {
        choices: [{
          id: 'trapper', name: 'กับดัก', type: 'trap', cost: 1,
          trap: { trigger: 'enemy_attack', effects: [{ type: 'damage', value: 9, desc: 'x' }] },
        }],
      },
    } as any;
  }

  it('ใบที่เข้าสำรับไม่ใช่อ็อบเจ็กต์ตัวเดียวกับใบที่เสนอ', () => {
    const s = stateWithReward();
    const offered = s.cardReward.choices[0];
    expect(takeCardReward(s, 0)).toBe(true);
    expect(s.masterDeck[0]).not.toBe(offered);
  });

  it('ของซ้อนข้างในก็ไม่แชร์ — แก้ใบในสำรับไม่กระทบต้นฉบับ', () => {
    // การ์ดดักเก็บสเปคเป็นอ็อบเจ็กต์ซ้อน ถ้าโคลนแค่ชั้นเดียว การปลุกเสก
    // (ซึ่งบวกค่าตัวเลขใน `trap.effects`) จะไปแก้ให้ทุกใบในเกมพร้อมกัน
    const s = stateWithReward();
    const offered = s.cardReward.choices[0];
    takeCardReward(s, 0);
    s.masterDeck[0].trap.effects[0].value = 99;
    expect(offered.trap.effects[0].value).toBe(9);
  });

  it('index ที่ไม่มีอยู่คืน false และไม่แตะสำรับ', () => {
    const s = stateWithReward();
    expect(takeCardReward(s, 5)).toBe(false);
    expect(s.masterDeck.length).toBe(0);
    expect(s.cardReward).toBeDefined();
  });
});
