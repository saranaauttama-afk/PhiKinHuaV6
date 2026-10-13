import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import {
  STORY_EVENTS, getStoryEvent, choiceLocked, applyChoice, applyEffect,
  type EventEffect, type StoryEvent,
} from '../src/core/events/story';
import { ALL_CARDS } from '../src/core/pack';
import { ALL_CLASS_IDS } from '../src/core/classes';

/**
 * เหตุการณ์ระหว่างทาง — ส่วนที่ทำให้ชั้นพักเป็น "เรื่องที่เกิดขึ้น"
 * ไม่ใช่แถวปุ่มฟังก์ชันให้กดก่อนไปสู้ต่อ
 */

// ── ตรวจเนื้อหา ──────────────────────────────────────────────────────────

describe('ข้อมูลเหตุการณ์', () => {
  it('id ไม่ซ้ำ', () => {
    const ids = STORY_EVENTS.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ทุกเหตุการณ์มีเรื่องและทางเลือกอย่างน้อยสองทาง', () => {
    for (const e of STORY_EVENTS) {
      expect(e.title.trim(), e.id).not.toBe('');
      expect(e.text.trim().length, e.id).toBeGreaterThan(40);
      expect(e.choices.length, e.id).toBeGreaterThanOrEqual(2);
    }
    expect(STORY_EVENTS.length).toBeGreaterThanOrEqual(8);
  });

  /**
   * ข้อนี้สำคัญที่สุดในไฟล์
   * ถ้าเหตุการณ์ไหนล็อกทุกทาง ผู้เล่นที่ไม่ผ่านเงื่อนไขจะติดค้างอยู่ตรงนั้นถาวร
   * เพราะปิดโหนดไม่ได้ถ้ายังไม่ได้เลือก
   */
  it('ทุกเหตุการณ์มีทางที่เลือกได้เสมออย่างน้อยหนึ่งทาง', () => {
    for (const e of STORY_EVENTS) {
      const free = e.choices.filter(c => (c.requires ?? []).length === 0);
      expect(free.length, `${e.id} ล็อกทุกทาง ผู้เล่นจะติดค้าง`).toBeGreaterThan(0);
    }
  });

  it('ทุกทางเลือกมีผลลัพธ์ที่เขียนไว้ ไม่ว่าจะเป็นแบบตายตัวหรือแบบเสี่ยง', () => {
    for (const e of STORY_EVENTS) {
      for (const c of e.choices) {
        expect(c.label.trim(), `${e.id}`).not.toBe('');
        if (c.branches) {
          expect(c.branches.length, `${e.id} / ${c.label}`).toBeGreaterThan(1);
          for (const b of c.branches) {
            expect(b.weight, `${e.id} / ${c.label}`).toBeGreaterThan(0);
            expect(b.text.trim().length, `${e.id} / ${c.label}`).toBeGreaterThan(10);
          }
        } else {
          expect(c.text?.trim().length ?? 0, `${e.id} / ${c.label}`).toBeGreaterThan(10);
        }
      }
    }
  });

  it('ทางเลือกที่อ้าง cardId ต้องเป็นการ์ดที่มีอยู่จริง', () => {
    const known = new Set(ALL_CARDS.map(c => c.id));
    const effectsOf = (e: StoryEvent): EventEffect[] =>
      e.choices.flatMap(c => [...(c.effects ?? []), ...(c.branches ?? []).flatMap(b => b.effects)]);

    for (const e of STORY_EVENTS) {
      for (const eff of effectsOf(e)) {
        if (eff.kind === 'card') {
          expect(known.has(eff.cardId), `${e.id} อ้างการ์ด ${eff.cardId} ที่ไม่มีอยู่`).toBe(true);
        }
      }
    }
  });

  it('เงื่อนไขคลาสอ้างคลาสที่มีอยู่จริง', () => {
    for (const e of STORY_EVENTS) {
      for (const c of e.choices) {
        for (const req of c.requires ?? []) {
          if (req.kind === 'class') {
            expect(ALL_CLASS_IDS, `${e.id} อ้างคลาส ${req.classId}`).toContain(req.classId);
          }
        }
      }
    }
  });

  it('ทุกคลาสมีจังหวะเฉพาะตัวอย่างน้อยหนึ่งเหตุการณ์', () => {
    const gated = new Set<string>();
    for (const e of STORY_EVENTS) {
      for (const c of e.choices) {
        for (const req of c.requires ?? []) {
          if (req.kind === 'class') gated.add(req.classId);
        }
      }
    }
    for (const id of ALL_CLASS_IDS) {
      expect(gated, `คลาส ${id} ไม่มีทางเลือกเฉพาะตัวเลยสักเหตุการณ์`).toContain(id);
    }
  });
});

// ── ตรวจกติกา ────────────────────────────────────────────────────────────

function baseState(over: Partial<GameState['player']> = {}): GameState {
  return {
    classId: 'shaman',
    player: { hp: 40, maxHp: 50, gold: 50, level: 3, ...over },
    masterDeck: [{ id: 'a', name: 'ก', type: 'action', ap: 0, fx: {} }],
    blessings: [],
    log: [],
  } as unknown as GameState;
}

describe('เงื่อนไขของทางเลือก', () => {
  it('ทองไม่พอ → ล็อกพร้อมบอกเหตุผล', () => {
    const s = baseState({ gold: 10 });
    const locked = choiceLocked(s, { label: 'x', requires: [{ kind: 'gold', min: 30 }] });
    expect(locked).toContain('30');
  });

  it('ทองพอ → เลือกได้', () => {
    const s = baseState({ gold: 30 });
    expect(choiceLocked(s, { label: 'x', requires: [{ kind: 'gold', min: 30 }] })).toBeNull();
  });

  it('คลาสไม่ตรง → ล็อก', () => {
    const s = baseState();
    expect(choiceLocked(s, { label: 'x', requires: [{ kind: 'class', classId: 'nun' }] })).not.toBeNull();
    expect(choiceLocked(s, { label: 'x', requires: [{ kind: 'class', classId: 'shaman' }] })).toBeNull();
  });

  it('เลือดไม่ถึงสัดส่วน → ล็อก', () => {
    const low = baseState({ hp: 10, maxHp: 50 });
    const high = baseState({ hp: 40, maxHp: 50 });
    const req = { label: 'x', requires: [{ kind: 'hpRatio' as const, min: 0.5 }] };
    expect(choiceLocked(low, req)).not.toBeNull();
    expect(choiceLocked(high, req)).toBeNull();
  });
});

describe('ผลของทางเลือก', () => {
  it('เลือดเพิ่มไม่เกินเลือดสูงสุด', () => {
    const s = baseState({ hp: 45, maxHp: 50 });
    applyEffect(s, { kind: 'hp', amount: 999 }, makeRng('x'));
    expect(s.player.hp).toBe(50);
  });

  it('เลือดลดไม่ต่ำกว่าศูนย์', () => {
    const s = baseState({ hp: 5 });
    applyEffect(s, { kind: 'hp', amount: -99 }, makeRng('x'));
    expect(s.player.hp).toBe(0);
  });

  it('ลดเลือดสูงสุดแล้วเลือดตอนนี้ต้องไม่ค้างเกินเพดานใหม่', () => {
    const s = baseState({ hp: 50, maxHp: 50 });
    applyEffect(s, { kind: 'maxHp', amount: -10 }, makeRng('x'));
    expect(s.player.maxHp).toBe(40);
    expect(s.player.hp).toBe(40);
  });

  it('ทองไม่ติดลบ', () => {
    const s = baseState({ gold: 5 });
    applyEffect(s, { kind: 'gold', amount: -99 }, makeRng('x'));
    expect(s.player.gold).toBe(0);
  });

  it('ถอดการ์ดออกจากสำรับว่างแล้วไม่พัง', () => {
    const s = baseState();
    s.masterDeck = [];
    applyEffect(s, { kind: 'removeRandomCard' }, makeRng('x'));
    expect(s.masterDeck).toEqual([]);
  });

  it('ทางที่เสี่ยงดวงเลือกกิ่งตามน้ำหนัก และเดิน rng ไปข้างหน้าเสมอ', () => {
    const s = baseState();
    const start = makeRng('branch');
    const out = applyChoice(s, {
      label: 'x',
      branches: [
        { weight: 1, text: 'ดี',  effects: [{ kind: 'gold', amount: 10 }] },
        { weight: 1, text: 'ร้าย', effects: [{ kind: 'hp', amount: -5 }] },
      ],
    }, start);

    expect(['ดี', 'ร้าย']).toContain(out.text);
    expect(out.rng).not.toEqual(start);
  });

  it('rng เดียวกัน → กิ่งเดียวกันเสมอ (รันซ้ำได้ตาม seed)', () => {
    const run = () => {
      const s = baseState();
      return applyChoice(s, {
        label: 'x',
        branches: [
          { weight: 3, text: 'ก', effects: [] },
          { weight: 3, text: 'ข', effects: [] },
          { weight: 3, text: 'ค', effects: [] },
        ],
      }, makeRng('same')).text;
    };
    expect(run()).toBe(run());
  });

  it('กิ่งที่น้ำหนักมากกว่าออกบ่อยกว่าจริง', () => {
    const counts: Record<string, number> = { บ่อย: 0, นาน: 0 };
    for (let i = 0; i < 200; i++) {
      const s = baseState();
      const out = applyChoice(s, {
        label: 'x',
        branches: [
          { weight: 9, text: 'บ่อย', effects: [] },
          { weight: 1, text: 'นาน', effects: [] },
        ],
      }, makeRng(`seed-${i}`));
      counts[out.text]++;
    }
    expect(counts['บ่อย']).toBeGreaterThan(counts['นาน'] * 3);
  });
});

// ── ลูปจริงผ่าน engine ────────────────────────────────────────────────────

/** ยืนอยู่ในเหตุการณ์ที่ระบุ */
class AtEvent {
  state: any;
  private rng: ReturnType<typeof makeRng>;

  constructor(eventId: string, seed = 'ev') {
    this.state = { seed, phase: 'start', turn: 0 };
    this.rng = makeRng(seed);

    this.go({ type: 'NewRun', seed });
    this.go({ type: 'ChooseStarterBlessing', index: 0 });

    this.state.pages.current.offers[0] = {
      kind: 'story_event', shopId: 'test_event', eventId,
    } as PageOffer;
    this.go({ type: 'ChooseOffer', index: 0 });
  }

  go(c: Command) {
    const out = applyCommand(this.state, c, this.rng);
    this.state = out.state;
    this.rng = out.rng;
  }
}

const firstEventId = STORY_EVENTS[0].id;

