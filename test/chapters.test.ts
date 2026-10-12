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
import { resolveStoryIfAny, resolveRewardIfAny, stepService, nextFight } from './helpers';

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

    const i = nextFight(s);
    if (i < 0) {
      stepService(() => s, go);
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
      s.player.block=0;s.player.statusEffects=[];s.blessings=[];s.equipped=[];s.minions=[];
      s.enemy.hp = 9999;
      s.piles.hand = [];
      s.enemyPiles={draw:[],hand:['claw'],discard:[]};
      s.enemyIntent=undefined;
      go({ type: 'EndTurn' });
      go({ type: 'ResolveEnemyTurn' });
      closeChapter();
      break;
    }

    if (offer.bossType === 'final' && opts.hpRatioAtFinal != null) {
      s.player.hp = Math.max(1, Math.round(s.player.maxHp * opts.hpRatioAtFinal));
    }

    if (s.enemy) s.enemy.statusEffects = [];
    s.piles.hand = [
      { id: 'kill', name: 'kill', type: 'attack', fx: { dmg: 9999 }, instanceId: 'kill1' },
    ];
    go({ type: 'PlayCard', index: 0 });
    if (s.phase === 'levelup') go((s.levelUp?.dawnHandChoice ? { type: 'ChooseLevelUpOption', option: 'A' } : { type: 'SkipLevelUp' }) as any);
    resolveRewardIfAny(s, go);
    go({ type: 'CompleteNode' });
    if (s.phase === 'levelup') go((s.levelUp?.dawnHandChoice ? { type: 'ChooseLevelUpOption', option: 'A' } : { type: 'SkipLevelUp' }) as any);
    resolveRewardIfAny(s, go);
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





  it('รันที่จบไปแล้วเล่นต่อไม่ได้ ทั้งชนะและแพ้', () => {
    // `toSave` บังคับ phase เป็น 'map' เสมอ เช็ค phase อย่างเดียวจึงไม่พอ
    for (const won of [true, false]) {
      const s: any = runState();
      s.runSummary = { won, fights: 3, level: 2, gold: 10, beatSecretBoss: false };
      expect(isPlayableSave(toSave(s, makeRng("save-test"))), `won=${won}`).toBe(false);
    }
  });

  it('รันที่ยังไม่จบยังเล่นต่อได้', () => {
    expect(isPlayableSave(toSave(runState(), makeRng("save-test")))).toBe(true);
  });
});
