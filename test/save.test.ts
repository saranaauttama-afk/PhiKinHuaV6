import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { baseNewState } from '../src/core/commands';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { AUTO_SAVE_COMMANDS, toSave, fromSave, isPlayableSave, summarize, SAVE_VERSION } from '../src/core/save';
import { resolveStoryIfAny, resolveRewardIfAny, stepService, nextFight } from './helpers';

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
  while (s.chapter) go({ type: 'SkipChapter' } as any);

  for (let i = 0; i < 4; i++) {
    const offers: PageOffer[] = s.pages?.current?.offers ?? [];
    if (!offers.length) break;
    const fightIx = offers.findIndex(o => o.kind === 'monster' || o.kind === 'boss');

    if (fightIx < 0) {
      stepService(() => s, go);
      continue;
    }

    go({ type: 'ChooseOffer', index: fightIx });
    if (s.phase !== 'combat') break;
    if (s.enemy) s.enemy.statusEffects = [];
    s.piles.hand = [{ id: 'k', name: 'k', type: 'attack', fx: { dmg: 9999 }, instanceId: 'k1' }];
    go({ type: 'PlayCard', index: 0 });
    if (s.phase === 'levelup') go(({ type: 'SkipLevelUp' }) as any);
    resolveRewardIfAny(s, go);
    go({ type: 'CompleteNode' });
    if (s.phase === 'levelup') go(({ type: 'SkipLevelUp' }) as any);
    resolveRewardIfAny(s, go);
  }

  return s;
}

const roundTrip = (s: GameState): GameState =>
  fromSave(JSON.parse(JSON.stringify(toSave(s, makeRng("round-trip")))));

describe('เซฟแล้วโหลดกลับได้ครบ', () => {
  it('เส้นทางทั้งเส้นไม่หาย', () => {
    const s = runInProgress();
    const back = roundTrip(s);

    expect(back.pages?.adventure).toBeDefined();
    expect(JSON.stringify(back.pages)).toBe(JSON.stringify(s.pages));
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

  it('ดาวที่ปลุกเสกแล้วไม่หายตอนโหลด', () => {
    const s: any = runInProgress();
    s.masterDeck[0] = { ...s.masterDeck[0], star: 3 };
    const back = roundTrip(s);
    expect(back.masterDeck[0].star).toBe(3);
  });
});

describe('ตรวจว่าเซฟใช้ได้ไหมก่อนให้กดเล่นต่อ', () => {
  it('เซฟที่กำลังเล่นอยู่ = ใช้ได้', () => {
    expect(isPlayableSave(toSave(runInProgress(), makeRng("save-test")))).toBe(true);
  });

  it('เซฟเวอร์ชันเก่า = ใช้ไม่ได้ ไม่ใช่โหลดครึ่งๆ', () => {
    const old = { version: 1, seed: 'x', pages: {}, player: {} };
    expect(isPlayableSave(old)).toBe(false);
    expect(() => fromSave(old as any)).toThrow();
  });

  it('เซฟที่ไม่มีกระดานผจญภัย = ใช้ไม่ได้', () => {
    const s = toSave(runInProgress(), makeRng("save-test"));
    delete (s.state as any).pages.adventure;
    expect(isPlayableSave(s)).toBe(false);
  });

  it('รันที่จบไปแล้ว = ไม่ต้องเสนอให้เล่นต่อ', () => {
    const s: any = runInProgress();
    s.phase = 'run_complete';
    const saved = toSave(s, makeRng("save-test"));
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
    const sum = summarize(toSave(s, makeRng("save-test")));

    expect(sum.classId).toBe('medium');
    expect(sum.totalFights).toBe(30);
    expect(sum.fight).toBeGreaterThanOrEqual(1);
    expect(sum.fight).toBeLessThanOrEqual(30);
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

    const ix = nextFight(back);
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
    expect(back.pages?.adventure?.cursor).toBe(s.pages?.adventure?.cursor);
    expect(back.pages?.adventure?.boardIndex).toBe(s.pages?.adventure?.boardIndex);
  });
});

describe('เซฟอัตโนมัติ — ห้ามเซฟตอนไฟต์ยังไม่ปิดบัญชี', () => {
  // ชนะไฟต์แล้ว exp/ทอง/การ์ดรางวัลเข้ากระเป๋าทันที แต่โหนดบนแผนที่ยัง
  // `resolved: false` จนกว่าจะกด `CompleteNode` — ถ้าเซฟตรงกลางนั้นแล้วโหลดกลับ
  // ผู้เล่นจะสู้โหนดเดิมซ้ำได้ไม่จำกัด วัดจริงตอนที่ยังมีบั๊ก:
  // รอบสองได้ทอง +35 การ์ดอีกใบ และ EXP อีกก้อน จากผีตัวเดิมโหนดเดิม

  /** เดินจนชนะไฟต์แรก แล้วคืนตัวขับที่ยังไม่ได้กด CompleteNode */
  function winFirstFight(seed = 'as-1') {
    let s: any = { seed, phase: 'start', turn: 0 };
    let r = makeRng(seed);
    const done: Command['type'][] = [];
    const go = (c: Command) => {
      const o = applyCommand(s, c, r); s = o.state; r = o.rng; done.push(c.type);
    };
    const sk = () => { let g = 0; while (s.chapter && g++ < 30) go({ type: 'SkipChapter' } as Command); };

    go({ type: 'NewRun', seed } as Command); sk();
    go({ type: 'ChooseStarterBlessing', index: 0 }); sk();

    const offers = s.pages.current.offers;
    const ix = nextFight(s);
    go({ type: 'ChooseOffer', index: ix });
    if (s.enemy) s.enemy.statusEffects = [];
    s.piles.hand = [{ id: 'k', name: 'k', type: 'attack', fx: { dmg: 9999 }, instanceId: 'k1' }];
    go({ type: 'PlayCard', index: 0 });

    return { get: () => s as GameState, go, ix, lastCmd: () => done[done.length - 1] };
  }

  it('ทุกคำสั่งระหว่างชนะกับปิดโหนด ไม่อยู่ในรายการเซฟอัตโนมัติ', () => {
    const auto = new Set<string>(AUTO_SAVE_COMMANDS);
    const t = winFirstFight();

    // ไล่ปิดหน้าที่ค้างอยู่หลังชนะ ทีละคำสั่ง
    let guard = 0;
    while (guard++ < 10) {
      const p = t.get().phase;
      if (p === 'levelup') t.go({ type: 'SkipLevelUp' });
      else if (p === 'reward') t.go({ type: 'ChooseCardReward', index: 0 });
      else break;

      const cmd = t.lastCmd();
      const resolved = t.get().pages!.current!.resolved[t.ix];
      expect(
        auto.has(cmd) && !resolved,
        `${cmd} เซฟอัตโนมัติทั้งที่โหนดยังไม่ปิดบัญชี — โหลดกลับแล้วสู้ซ้ำได้`
      ).toBe(false);
    }

    expect(t.get().phase).toBe('victory');
  });

  it('โหลดเซฟจากจุดที่เซฟได้จริง แล้วสู้โหนดเดิมซ้ำไม่ได้', () => {
    const t = winFirstFight();
    let guard = 0;
    while (guard++ < 10) {
      const p = t.get().phase;
      if (p === 'levelup') t.go({ type: 'SkipLevelUp' });
      else if (p === 'reward') t.go({ type: 'ChooseCardReward', index: 0 });
      else break;
    }
    t.go({ type: 'CompleteNode' });   // ← จุดเซฟจริงจุดแรกหลังชนะ

    const before = t.get();
    const back = fromSave(toSave(before, makeRng("save-test")));

    expect(back.fightCount).toBe(before.fightCount);
    // โหนดที่สู้ไปแล้วต้องไม่กลับมาให้สู้ใหม่
    const offers = back.pages?.current?.offers ?? [];
    expect(offers.filter(Boolean).length).toBeGreaterThan(0);
    expect(back.defeatedEnemyIds?.length).toBe(1);
  });
});
