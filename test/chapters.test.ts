import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { ALL_CLASS_IDS } from '../src/core/classes';
import {
  STORY_CHAPTERS, getChapter, chapterIdFor, fireChapter,
} from '../src/core/story/chapters';
import { ART_BY_ID } from '../src/art/catalog';
import { screenForState } from '../app/screenRouter';
import { toSave, fromSave, isPlayableSave } from '../src/core/save';
import { resolveStoryIfAny } from './helpers';

/**
 * บทคั่นเล่าเรื่อง
 *
 * เกมมีจุดพลิก 5 จุดที่ผู้เล่นควรรู้ตัว แต่ทั้งหมดเคยสื่อสารผ่าน `s.log.push(...)`
 * ซึ่งไม่มีจอไหนแสดงเลย — ชนะบอสกลางแล้วก็แค่เจอแผนที่หน้าใหม่
 *
 * เทสต์ชุดนี้ถามสองเรื่อง: บทขึ้นถูกจังหวะไหม และ **ปิดได้เสมอไหม**
 * บทที่ปิดไม่ลงคือจอที่แตะแล้วไม่ไปไหน ซึ่งแย่กว่าไม่มีบทเลย
 */

// ─────────────────────────────────────────── ตัวขับ

function newRun(seed: string, classId?: any): GameState {
  const empty = { seed, phase: 'start', turn: 0 } as unknown as GameState;
  return applyCommand(empty, { type: 'NewRun', seed, classId }, makeRng(seed)).state;
}

/** เดินรันจนจบ เก็บลำดับบทที่ขึ้น แล้วปิดทุกบทเหมือนที่ UI ทำ */
function playRun(seed: string, opts: {
  classId?: any;
  hpRatioAtFinal?: number;
  /** ตายกลางทางที่ไฟต์ที่เท่าไหร่ */
  dieAtFight?: number;
} = {}): { state: GameState; chapters: string[] } {
  let s: any = newRun(seed, opts.classId);
  let r = makeRng(seed);
  const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

  const chapters: string[] = [];
  /** UI ปิดบทที่ค้างอยู่ก่อนทำอย่างอื่นเสมอ */
  const closeChapter = () => {
    while (s.chapter) {
      chapters.push(s.chapter.id);
      go({ type: 'SkipChapter' });
    }
  };

  closeChapter();
  go({ type: 'ChooseStarterBlessing', index: 0 });
  closeChapter();

  let guard = 0;
  while (guard++ < 500 && s.phase !== 'run_complete' && s.phase !== 'defeat') {
    const offers: PageOffer[] = s.pages?.current?.offers ?? [];
    if (!offers.length) break;

    const i = offers.findIndex(o => o.kind === 'monster' || o.kind === 'boss');
    if (i < 0) {
      go({ type: 'ChooseOffer', index: 0 });
      resolveStoryIfAny(s, go);
      go({ type: 'CompleteNode' });
      closeChapter();
      continue;
    }

    const offer: any = offers[i];
    go({ type: 'ChooseOffer', index: i });
    if (s.phase !== 'combat') break;

    const fightNo = (s.fightCount ?? 0) + 1;

    if (opts.dieAtFight === fightNo) {
      // ตายจริงผ่านเส้นทางของ engine — ศัตรูตีจนเลือดหมด
      s.player.hp = 1;
      s.enemy.hp = 9999;
      s.piles.hand = [];
      go({ type: 'EndTurn' });
      go({ type: 'ResolveEnemyTurn' });
      closeChapter();
      break;
    }

    if (offer.bossType === 'final' && opts.hpRatioAtFinal != null) {
      s.player.hp = Math.max(1, Math.round(s.player.maxHp * opts.hpRatioAtFinal));
    }

    s.piles.hand = [
      { id: 'kill', name: 'kill', type: 'attack', cost: 0, dmg: 9999, instanceId: 'kill1' },
    ];
    go({ type: 'PlayCard', index: 0 });
    if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
    go({ type: 'CompleteNode' });
    if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
    closeChapter();
  }

  return { state: s, chapters };
}

// ─────────────────────────────────────────── ข้อมูล

describe('ข้อมูลบท', () => {
  it('ทุกบทมีชื่อและมีเนื้อจริง ไม่ใช่ย่อหน้าว่าง', () => {
    for (const c of STORY_CHAPTERS) {
      expect(c.title.trim().length, c.id).toBeGreaterThan(0);
      expect(c.text.length, c.id).toBeGreaterThan(0);
      for (const para of c.text) {
        expect(para.trim().length, `${c.id} มีย่อหน้าว่าง`).toBeGreaterThan(10);
      }
    }
  });

  it('id ไม่ซ้ำกัน — ซ้ำแล้วบทหลังจะกลืนบทหน้าเงียบๆ', () => {
    const ids = STORY_CHAPTERS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ทุกคลาสมีบทเปิดเรื่องของตัวเอง', () => {
    for (const id of ALL_CLASS_IDS) {
      const ch = getChapter(`prologue_${id}`);
      expect(ch, `คลาส ${id} ไม่มีบทเปิดเรื่อง`).toBeDefined();
      expect(ch!.classId).toBe(id);
    }
  });

  it('ทุกจังหวะที่เกมยิงมีบทรองรับ', () => {
    const triggers = [
      ...ALL_CLASS_IDS.map(classId => ({ kind: 'prologue', classId }) as const),
      { kind: 'mid_boss' } as const,
      { kind: 'final_boss' } as const,
      { kind: 'secret' } as const,
      { kind: 'ending', won: true, beatSecretBoss: false } as const,
      { kind: 'ending', won: true, beatSecretBoss: true } as const,
      { kind: 'ending', won: false } as const,
    ];
    for (const t of triggers) {
      const id = chapterIdFor(t);
      expect(id, JSON.stringify(t)).toBeDefined();
      expect(getChapter(id!), `${id} ไม่มีในไฟล์ข้อมูล`).toBeDefined();
    }
  });

  it('ทุกบทมีช่องรูปในทะเบียนอาร์ต', () => {
    for (const c of STORY_CHAPTERS) {
      expect(ART_BY_ID[`chapter/${c.id}`], `บท ${c.id} ไม่มีช่องรูป`).toBeDefined();
    }
  });
});

// ─────────────────────────────────────────── การเปิดบท

describe('เปิดบท', () => {
  const blank = (): GameState => ({ chaptersSeen: [] } as unknown as GameState);

  it('เปิดแล้วเริ่มที่ย่อหน้าแรก', () => {
    const s = blank();
    expect(fireChapter(s, { kind: 'mid_boss' })).toBe(true);
    expect(s.chapter).toEqual({ id: 'after_mid_boss', paragraph: 0 });
  });

  it('บทเดิมไม่ขึ้นซ้ำในรันเดียวกัน', () => {
    const s = blank();
    fireChapter(s, { kind: 'mid_boss' });
    s.chapter = undefined;                       // อ่านจบแล้ว
    expect(fireChapter(s, { kind: 'mid_boss' })).toBe(false);
    expect(s.chapter).toBeUndefined();
  });

  it('ไม่ทับบทที่ยังค้างอ่านอยู่', () => {
    const s = blank();
    fireChapter(s, { kind: 'mid_boss' });
    expect(fireChapter(s, { kind: 'secret' })).toBe(false);
    expect(s.chapter!.id).toBe('after_mid_boss');
  });

  it('บทที่ไม่มีในไฟล์ข้อมูล = เดินต่อเงียบๆ ไม่ค้างจอเปล่า', () => {
    const s = blank();
    expect(fireChapter(s, { kind: 'prologue', classId: 'ไม่มีคลาสนี้' as any })).toBe(false);
    expect(s.chapter).toBeUndefined();
  });
});

// ─────────────────────────────────────────── คำสั่ง

describe('อ่านและข้าม', () => {
  const step = (s: GameState, c: Command) => applyCommand(s, c, makeRng('x')).state;

  it('แตะทีละย่อหน้าจนจบแล้วบทปิดเอง', () => {
    let s: any = { chaptersSeen: [] };
    fireChapter(s, { kind: 'mid_boss' });
    const total = getChapter('after_mid_boss')!.text.length;

    for (let i = 1; i < total; i++) {
      s = step(s, { type: 'AdvanceChapter' });
      expect(s.chapter?.paragraph, `ย่อหน้าที่ ${i}`).toBe(i);
    }
    s = step(s, { type: 'AdvanceChapter' });
    expect(s.chapter, 'อ่านจบแล้วบทต้องปิด').toBeUndefined();
  });

  it('ข้ามได้ตั้งแต่ย่อหน้าแรก — คนเล่นรอบที่สิบไม่ควรถูกจับอ่านซ้ำ', () => {
    let s: any = { chaptersSeen: [] };
    fireChapter(s, { kind: 'secret' });
    s = step(s, { type: 'SkipChapter' });
    expect(s.chapter).toBeUndefined();
  });

  it('ทุกบทข้ามได้', () => {
    for (const c of STORY_CHAPTERS) {
      let s: any = { chaptersSeen: [], chapter: { id: c.id, paragraph: 0 } };
      s = step(s, { type: 'SkipChapter' });
      expect(s.chapter, `บท ${c.id} ข้ามไม่ได้`).toBeUndefined();
    }
  });

  it('ไม่มีบทค้างอยู่ก็สั่งได้โดยไม่พัง', () => {
    const s: any = { chaptersSeen: [] };
    expect(step(s, { type: 'AdvanceChapter' }).chapter).toBeUndefined();
    expect(step(s, { type: 'SkipChapter' }).chapter).toBeUndefined();
  });

  it('บทที่หายไปจากไฟล์ข้อมูลไม่ทำให้ค้าง (เซฟเก่าอ้าง id เดิม)', () => {
    const s: any = { chaptersSeen: [], chapter: { id: 'บทที่ถูกลบไปแล้ว', paragraph: 0 } };
    expect(step(s, { type: 'AdvanceChapter' }).chapter).toBeUndefined();
  });
});

// ─────────────────────────────────────────── จุดที่ยิงจริงในเกม

describe('จุดที่บทขึ้นระหว่างเล่น', () => {
  it('เริ่มรันแล้วได้บทเปิดเรื่องของคลาสที่เลือก — ก่อนหน้าเลือกพร', () => {
    for (const id of ALL_CLASS_IDS) {
      const s = newRun(`pro-${id}`, id);
      expect(s.chapter?.id, `คลาส ${id}`).toBe(`prologue_${id}`);
      expect(s.phase).toBe('starter');
      // หน้าเลือกพรต้องรอบทก่อน
      expect(screenForState(s, { pickingClass: false })).toBe('chapter');
    }
  });

  it('รันที่ชนะครบเจอบทกลางทาง บทก่อนบอสสุดท้าย และบทปิดเรื่อง ตามลำดับ', () => {
    const { state, chapters } = playRun('chapter-win', { hpRatioAtFinal: 0.1 });

    expect(state.phase).toBe('run_complete');
    expect(chapters[0]).toMatch(/^prologue_/);
    expect(chapters).toContain('after_mid_boss');
    expect(chapters).toContain('before_final_boss');
    expect(chapters).toContain('ending_win');

    // เรื่องต้องเดินตามลำดับ ไม่ใช่โผล่มั่ว
    expect(chapters.indexOf('after_mid_boss'))
      .toBeLessThan(chapters.indexOf('before_final_boss'));
    expect(chapters.indexOf('before_final_boss'))
      .toBeLessThan(chapters.indexOf('ending_win'));
  });

  it('บทก่อนบอสสุดท้ายขึ้นตอนยังยืนบนแผนที่ ไม่ใช่ตอนเข้าไฟต์แล้ว', () => {
    // ถ้ายิงตอนกดเข้าโหนดบอส UI จะเด้งไปหน้าต่อสู้ทันที บทจะไม่มีที่ขึ้น
    let s: any = newRun('gate', 'shaman');
    let r = makeRng('gate');
    const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };
    const close = () => { while (s.chapter) go({ type: 'SkipChapter' }); };

    close();
    go({ type: 'ChooseStarterBlessing', index: 0 });
    close();

    let guard = 0;
    while (guard++ < 500) {
      const offers: PageOffer[] = s.pages?.current?.offers ?? [];
      if (!offers.length) break;

      const atGate = offers.some((o: any) => o.kind === 'boss' && o.bossType === 'final');
      if (atGate) {
        expect(s.phase, 'บทต้องขึ้นตอนยังอยู่บนแผนที่').toBe('map');
        expect(s.chaptersSeen).toContain('before_final_boss');
        return;
      }

      const i = offers.findIndex(o => o.kind === 'monster' || o.kind === 'boss');
      if (i < 0) {
        go({ type: 'ChooseOffer', index: 0 });
        resolveStoryIfAny(s, go);
        go({ type: 'CompleteNode' });
        close();
        continue;
      }
      go({ type: 'ChooseOffer', index: i });
      if (s.phase !== 'combat') break;
      s.piles.hand = [{ id: 'k', name: 'k', type: 'attack', cost: 0, dmg: 9999, instanceId: 'k1' }];
      go({ type: 'PlayCard', index: 0 });
      if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
      go({ type: 'CompleteNode' });
      if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
      close();
    }
    throw new Error('เดินไม่ถึงบอสสุดท้าย');
  });

  it('ปลดล็อคศึกลับแล้วได้บทของมัน แล้วจบด้วยบทศึกลับ', () => {
    const { state, chapters } = playRun('chapter-secret', { hpRatioAtFinal: 1 });

    expect(state.secretBossUnlocked).toBe(true);
    expect(chapters).toContain('secret_unlocked');
    expect(chapters).toContain('ending_secret');
    expect(chapters).not.toContain('ending_win');
  });

  it('ตายกลางทางแล้วได้บทปิดเรื่องฝั่งแพ้ พร้อมสรุปผลรัน', () => {
    const { state, chapters } = playRun('chapter-lose', { dieAtFight: 2 });

    expect(state.phase).toBe('defeat');
    expect(state.player.hp).toBe(0);
    expect(chapters).toContain('ending_lose');

    // เดิมแพ้แล้วไม่มีอะไรสรุป — เด้งกลับแผนที่ของรันที่เพิ่งตายแล้วเดินต่อได้
    expect(state.runSummary, 'แพ้แล้วต้องมีสรุปผลรัน').toBeDefined();
    expect(state.runSummary!.won).toBe(false);
    expect(screenForState(state, { pickingClass: false })).toBe('run-complete');
  });
});

// ─────────────────────────────────────────── หน้าจอ

describe('บทมาก่อนหน้าอื่น', () => {
  const withChapter = (over: Partial<GameState>): GameState => ({
    phase: 'map',
    chapter: { id: 'after_mid_boss', paragraph: 0 },
    ...over,
  } as GameState);

  it('บังหน้าแผนที่ หน้าเลือกพร และจอสรุป', () => {
    for (const phase of ['map', 'starter', 'run_complete'] as const) {
      expect(
        screenForState(withChapter({ phase, starter: { choices: [], consumed: false } }), { pickingClass: false }),
        `phase ${phase}`
      ).toBe('chapter');
    }
  });

  it('แต่ไม่บังหน้าเริ่มเกมกับหน้าเลือกคลาส', () => {
    expect(screenForState(withChapter({ phase: 'start' }), { pickingClass: false })).toBe('start');
    expect(screenForState(withChapter({}), { pickingClass: true })).toBe('class-select');
  });
});

// ─────────────────────────────────────────── เซฟ

describe('บทกับเซฟ', () => {
  const runState = (): GameState => {
    let s: any = newRun('save-chapter', 'nun');
    let r = makeRng('save-chapter');
    const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };
    while (s.chapter) go({ type: 'SkipChapter' });
    go({ type: 'ChooseStarterBlessing', index: 0 });
    return s;
  };

  it('บทที่ขึ้นไปแล้วถูกจำไว้ — โหลดกลับมาไม่เจอบทเดิมอีก', () => {
    const s = runState();
    expect(s.chaptersSeen).toContain('prologue_nun');

    const back = fromSave(JSON.parse(JSON.stringify(toSave(s))));
    expect(back.chaptersSeen).toEqual(s.chaptersSeen);
  });

  it('บทที่ค้างอ่านค้างไว้ไม่ถูกเก็บ — โหลดมาแล้วยืนบนแผนที่ ไม่ค้างกลางบท', () => {
    const s: any = runState();
    s.chapter = { id: 'after_mid_boss', paragraph: 1 };

    const back = fromSave(JSON.parse(JSON.stringify(toSave(s))));
    expect(back.chapter).toBeUndefined();
  });

  it('รันที่จบไปแล้วเล่นต่อไม่ได้ ทั้งชนะและแพ้', () => {
    // `toSave` บังคับ phase เป็น 'map' เสมอ เช็ค phase อย่างเดียวจึงไม่พอ
    for (const won of [true, false]) {
      const s: any = runState();
      s.runSummary = { won, fights: 3, level: 2, gold: 10, beatSecretBoss: false };
      expect(isPlayableSave(toSave(s)), `won=${won}`).toBe(false);
    }
  });

  it('รันที่ยังไม่จบยังเล่นต่อได้', () => {
    expect(isPlayableSave(toSave(runState()))).toBe(true);
  });
});
