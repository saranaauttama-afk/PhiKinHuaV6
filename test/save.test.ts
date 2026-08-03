import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { baseNewState } from '../src/core/commands';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { toSave, fromSave, isPlayableSave, summarize, SAVE_VERSION } from '../src/core/save';
import { isFused } from '../src/core/cards/fusion';
import { resolveStoryIfAny } from './helpers';

/**
 * เซฟ/โหลด
 *
 * รูปแบบเดิม (V1) เลือกเก็บทีละฟิลด์ ซึ่งเขียนไว้ก่อนมีระบบเส้นทาง คลาส ผสานการ์ด
 * และเหตุการณ์ — ของใหม่ทั้งหมดจึงไม่ถูกเก็บ และสำรับถูก rehydrate จาก `cards.json`
 * อย่างเดียว ทำให้ **การ์ดคลาสกับการ์ดที่ผสานแล้วหายไปเงียบๆ ตอนโหลด**
 *
 * V2 เก็บ state ทั้งก้อนแล้วตัดเฉพาะสเตตคอมแบตออก เทสต์ชุดนี้ยืนยันว่าไม่หายอีก
 */

/** เดินรันไปสักพักให้ state มีของครบ (เส้นทาง คลาส ผีที่ปราบแล้ว ทอง เลเวล) */
function runInProgress(seed = 'save', classId: any = 'warrior'): GameState {
  let s: any = baseNewState(seed);
  let r = makeRng(seed);
  const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

  go({ type: 'NewRun', seed, classId });
  go({ type: 'ChooseStarterBlessing', index: 0 });

  for (let i = 0; i < 4; i++) {
    const offers: PageOffer[] = s.pages?.current?.offers ?? [];
    if (!offers.length) break;
    const fightIx = offers.findIndex(o => o.kind === 'monster' || o.kind === 'boss');

    if (fightIx < 0) {
      go({ type: 'ChooseOffer', index: 0 });
      resolveStoryIfAny(s, go);
      go({ type: 'CompleteNode' });
      continue;
    }

    go({ type: 'ChooseOffer', index: fightIx });
    if (s.phase !== 'combat') break;
    s.piles.hand = [{ id: 'k', name: 'k', type: 'attack', cost: 0, dmg: 9999, instanceId: 'k1' }];
    go({ type: 'PlayCard', index: 0 });
    if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
    go({ type: 'CompleteNode' });
    if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
  }

  return s;
}

const roundTrip = (s: GameState): GameState =>
  fromSave(JSON.parse(JSON.stringify(toSave(s))));

describe('เซฟแล้วโหลดกลับได้ครบ', () => {
  it('เส้นทางทั้งเส้นไม่หาย', () => {
    const s = runInProgress();
    const back = roundTrip(s);

    expect(back.journey, 'เซฟ V1 ไม่เก็บ journey เลย').toBeDefined();
    expect(JSON.stringify(back.journey)).toBe(JSON.stringify(s.journey));
  });

  it('คลาสที่เลือกไว้ไม่หาย', () => {
    const s = runInProgress('save-cls', 'nun');
    expect(roundTrip(s).classId).toBe('nun');
  });

  it('ความคืบหน้าของรันไม่หาย', () => {
    const s = runInProgress();
    const back = roundTrip(s);

    expect(back.fightCount).toBe(s.fightCount);
    expect(back.player.level).toBe(s.player.level);
    expect(back.player.exp).toBe(s.player.exp);
    expect(back.player.gold).toBe(s.player.gold);
    expect(back.player.hp).toBe(s.player.hp);
    expect(back.player.maxHp).toBe(s.player.maxHp);
  });

  it('ผีที่ปราบไปแล้วยังถูกจำไว้ — ไม่งั้นโหลดแล้วเจอตัวเดิมอีก', () => {
    const s = runInProgress();
    expect((s.defeatedEnemyIds ?? []).length).toBeGreaterThan(0);
    expect(roundTrip(s).defeatedEnemyIds).toEqual(s.defeatedEnemyIds);
  });

  it('พรติดตัวไม่หาย', () => {
    const s = runInProgress();
    expect(roundTrip(s).blessings.map(b => b.id)).toEqual(s.blessings.map(b => b.id));
  });
});

describe('สำรับไม่ถูกตัดทิ้งตอนโหลด', () => {
  it('การ์ดในสำรับเท่าเดิมทั้งจำนวนและหน้าตา', () => {
    const s = runInProgress();
    const back = roundTrip(s);

    expect(back.masterDeck).toHaveLength(s.masterDeck.length);
    expect(back.masterDeck.map(c => c.id).sort()).toEqual(s.masterDeck.map(c => c.id).sort());
  });

  /**
   * สองข้อนี้คือบั๊กที่ V1 ทำจริง — rehydrate จาก `cards.json` อย่างเดียว
   * การ์ดคลาสอยู่ใน `class_cards.json` จึงหาไม่เจอและถูกทิ้งเงียบๆ
   */
  it('การ์ดของคลาสอื่นไม่หาย (นักรบ/แม่ชี/คนทรง)', () => {
    for (const cls of ['warrior', 'nun', 'medium'] as const) {
      const s = runInProgress(`deck-${cls}`, cls);
      const back = roundTrip(s);
      expect(back.masterDeck.map(c => c.id).sort(), `คลาส ${cls}`)
        .toEqual(s.masterDeck.map(c => c.id).sort());
      expect(back.masterDeck.length, `คลาส ${cls}`).toBeGreaterThan(5);
    }
  });

  it('การ์ดที่ผสานแล้วไม่หาย — มันไม่มีอยู่ในไฟล์ข้อมูลใดๆ', () => {
    const s: any = runInProgress();
    // ใส่การ์ดผสานลงสำรับตรงๆ (ปกติได้จากแท่นผสาน)
    s.masterDeck = [
      ...s.masterDeck,
      {
        id: 'fused_test__pair', name: 'ทดสอบผสาน', type: 'attack', cost: 1,
        dmg: 9, block: 4, tags: ['fused'], desc: 'ผสานจากสองใบ',
      },
    ];

    const back = roundTrip(s);
    const fused = back.masterDeck.filter(isFused);

    expect(fused, 'การ์ดผสานหายตอนโหลด').toHaveLength(1);
    expect(fused[0].dmg).toBe(9);
    expect(fused[0].block).toBe(4);
  });
});

describe('สเตตคอมแบตไม่ถูกเก็บ — โหลดแล้วยืนบนแผนที่เสมอ', () => {
  it('ศัตรูกับกองการ์ดถูกล้าง และ phase เป็นแผนที่', () => {
    const s: any = runInProgress();
    s.phase = 'combat';
    s.enemy = { id: 'x', name: 'x', hp: 5, maxHp: 5, dmg: 1, block: 0 };
    s.piles.hand = [{ id: 'a', name: 'a', type: 'skill', cost: 0 }];

    const back = roundTrip(s);
    expect(back.phase).toBe('map');
    expect(back.enemy).toBeUndefined();
    expect(back.piles.hand).toEqual([]);
    expect(back.player.block).toBe(0);
  });

  it('เซฟค้างกลางเหตุการณ์แล้วโหลด กลับมาที่แผนที่ ไม่ค้างในเหตุการณ์', () => {
    const s: any = runInProgress();
    s.phase = 'event';
    s.story = { eventId: 'roadside_shrine' };

    const back = roundTrip(s);
    expect(back.phase).toBe('map');
    expect(back.story).toBeUndefined();
  });
});

describe('ตรวจว่าเซฟใช้ได้ไหมก่อนให้กดเล่นต่อ', () => {
  it('เซฟที่กำลังเล่นอยู่ = ใช้ได้', () => {
    expect(isPlayableSave(toSave(runInProgress()))).toBe(true);
  });

  it('เซฟเวอร์ชันเก่า = ใช้ไม่ได้ ไม่ใช่โหลดครึ่งๆ', () => {
    const old = { version: 1, seed: 'x', pages: {}, player: {} };
    expect(isPlayableSave(old)).toBe(false);
    expect(() => fromSave(old as any)).toThrow();
  });

  it('เซฟที่ไม่มีเส้นทาง = ใช้ไม่ได้ (เซฟจากก่อนมีระบบแผนที่)', () => {
    const s = toSave(runInProgress());
    delete (s.state as any).journey;
    expect(isPlayableSave(s)).toBe(false);
  });

  it('รันที่จบไปแล้ว = ไม่ต้องเสนอให้เล่นต่อ', () => {
    const s: any = runInProgress();
    s.phase = 'run_complete';
    const saved = toSave(s);
    (saved.state as any).phase = 'run_complete';
    expect(isPlayableSave(saved)).toBe(false);
  });

  it('ของมั่วๆ ไม่ทำให้พัง', () => {
    for (const junk of [null, undefined, 0, 'x', {}, { version: SAVE_VERSION }]) {
      expect(isPlayableSave(junk)).toBe(false);
    }
  });
});

describe('สรุปย่อสำหรับปุ่มเดินทางต่อ', () => {
  it('บอกคลาส ไฟต์ที่เท่าไหร่ เลือด และทอง', () => {
    const s = runInProgress('sum', 'medium');
    const sum = summarize(toSave(s));

    expect(sum.classId).toBe('medium');
    expect(sum.totalFights).toBe(15);
    expect(sum.fight).toBeGreaterThanOrEqual(1);
    expect(sum.fight).toBeLessThanOrEqual(15);
    expect(sum.hp).toBe(s.player.hp);
    expect(sum.gold).toBe(s.player.gold);
  });
});

describe('เล่นต่อได้จริงหลังโหลด', () => {
  it('โหลดแล้วเดินทางต่อจากตรงเดิมได้', () => {
    const s = runInProgress('resume');
    const back: any = roundTrip(s);
    let r = makeRng(back.seed);
    const go = (c: Command) => { const o = applyCommand(back, c, r); Object.assign(back, o.state); r = o.rng; };

    const offers: PageOffer[] = back.pages?.current?.offers ?? [];
    expect(offers.length, 'โหลดแล้วต้องมีทางให้เดินต่อ').toBeGreaterThan(0);

    const ix = offers.findIndex(o => o.kind === 'monster' || o.kind === 'boss');
    if (ix >= 0) {
      go({ type: 'ChooseOffer', index: ix });
      expect(back.phase).toBe('combat');
      expect(back.enemy).toBeDefined();
      expect(back.piles.hand.length, 'จั่วมือแรกให้แล้ว').toBeGreaterThan(0);
    }
  });

  it('ตำแหน่งบนเส้นทางไม่ขยับหลังโหลด', () => {
    const s = runInProgress('pos');
    const back = roundTrip(s);
    expect(back.journey?.currentId).toBe(s.journey?.currentId);
    expect(back.journey?.rowIndex).toBe(s.journey?.rowIndex);
  });
});
