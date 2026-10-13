import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import {
  ALL_CLASS_IDS, CHARACTER_CLASSES, buildStarterDeck, getClass, type ClassId,
} from '../src/core/classes';
import { ALL_CARDS, CARD_LIST_WITH_STARTERS } from '../src/core/pack';
import { starFx } from '../src/core/cards/model';
import { CARD_RULES } from '../src/core/balance/notfm';
import { rollThreeCards } from '../src/core/level';
import { rollShopStock } from '../src/core/shop';

/**
 * ระบบคลาส — แกนของคุณค่าการเล่นซ้ำแบบ Night of the Full Moon
 *
 * เดิมเกมมีผู้เล่นแบบเดียว เด็คตั้งต้นชุดเดียว (การ์ด 29 ใบติดแท็ก shaman ทั้งหมด)
 * เล่นรอบสองจึงได้ประสบการณ์เกือบเหมือนเดิม
 */

function startRun(classId: ClassId, seed = 'cls'): GameState {
  const empty = { seed, phase: 'start', turn: 0 } as unknown as GameState;
  return applyCommand(empty, { type: 'NewRun', seed, classId }, makeRng(seed)).state;
}

function enterFight(classId: ClassId, seed = 'cls'): GameState {
  let s: any = startRun(classId, seed);
  let r = makeRng(seed);
  const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

  go({ type: 'ChooseStarterBlessing', index: 0 });

  while (s.chapter) go({ type: 'SkipChapter' } as any);
  s.pages.current.offers[0] = {
    kind: 'monster', tier: 'normal', enemyId: 'phi-krasue',
  } as PageOffer;
  go({ type: 'ChooseOffer', index: 0 });
  return s;
}

const starter = (id: ClassId) => buildStarterDeck(CHARACTER_CLASSES[id], CARD_LIST_WITH_STARTERS);

describe('นิยามคลาส', () => {
  it('เด็คตั้งต้นของทุกคลาสมี 10 ใบ', () => {
    for (const id of ALL_CLASS_IDS) expect(starter(id).length, `คลาส ${id}`).toBe(10);
  });

  it('แต่ละคลาสมีเด็คต่างกันจริง', () => {
    const signatures = ALL_CLASS_IDS.map(id => starter(id).map(c => c.id).sort().join(','));
    expect(new Set(signatures).size).toBe(ALL_CLASS_IDS.length);
  });

  it('ทุกคลาสมีทั้งการ์ดโจมตีและการ์ดป้องกัน/ฟื้นฟู', () => {
    for (const id of ALL_CLASS_IDS) {
      const deck = starter(id).map(starFx);
      expect(deck.some(f => (f.dmg ?? 0) > 0), `คลาส ${id} ไม่มีการ์ดโจมตี`).toBe(true);
      expect(deck.some(f => (f.block ?? 0) > 0 || (f.heal ?? 0) > 0), `คลาส ${id} ไม่มีการ์ดป้องกันหรือฟื้นฟู`).toBe(true);
    }
  });

  it('การ์ดตั้งต้นเป็นของคลาสตัวเอง', () => {
    for (const id of ALL_CLASS_IDS) for (const c of starter(id)) expect(c.class, `${c.id} ในเด็ค ${id}`).toBe(id);
  });
});

describe('เริ่มรันด้วยคลาส', () => {
  it('ค่าสถานะตั้งต้นมาจากคลาสที่เลือก', () => {
    for (const id of ALL_CLASS_IDS) {
      const cls = CHARACTER_CLASSES[id];
      const s = startRun(id);
      expect(s.classId).toBe(id);
      expect(s.player.maxHp).toBe(cls.startHp);
      expect(s.player.hp).toBe(cls.startHp);
      expect(s.player.startMana).toBe(cls.startMana);
      expect(s.player.maxAp).toBe(CARD_RULES.apPerTurn);
      expect(s.player.handMax).toBe(CARD_RULES.handMax);
    }
  });

  it('masterDeck เป็นเด็คของคลาสนั้น', () => {
    for (const id of ALL_CLASS_IDS) {
      const s = startRun(id);
      expect(s.masterDeck.map(c => c.id).sort()).toEqual(starter(id).map(c => c.id).sort());
    }
  });

  it('ไม่ระบุคลาส → ได้หมอผีเป็นค่าเริ่มต้น', () => {
    const empty = { seed: 'x', phase: 'start', turn: 0 } as unknown as GameState;
    const s = applyCommand(empty, { type: 'NewRun', seed: 'x' }, makeRng('x')).state;
    expect(s.classId).toBe('shaman');
  });

  it('คลาสต่างกันให้ค่าสถานะต่างกันจริง', () => {
    const hps = ALL_CLASS_IDS.map(id => CHARACTER_CLASSES[id].startHp);
    expect(new Set(hps).size).toBeGreaterThan(1);
  });
});

// Class passives and skills: test/notfm-classes.test.ts

describe('การ์ดฟื้นพลังชีวิตทำงานจริง', () => {
  it('เล่นการ์ดที่มี heal แล้วเลือดเพิ่ม', () => {
    let s: any = enterFight('nun');
    s.player.hp = Math.max(1, s.player.maxHp - 20);
    const before = s.player.hp;

    s.piles.hand = [
      { id: 'holy_water', name: 'น้ำมนต์', type: 'action', ap: 0, fx: { heal: 7 }, instanceId: 'h1' },
    ];
    const after = applyCommand(s, { type: 'PlayCard', index: 0 }, makeRng('heal')).state;

    expect(after.player.hp).toBe(before + 7);
  });

  it('ฟื้นไม่เกินเลือดสูงสุด', () => {
    let s: any = enterFight('nun');
    s.player.hp = s.player.maxHp - 2;

    s.piles.hand = [
      { id: 'holy_water', name: 'น้ำมนต์', type: 'action', ap: 0, fx: { heal: 99 }, instanceId: 'h1' },
    ];
    const after = applyCommand(s, { type: 'PlayCard', index: 0 }, makeRng('heal')).state;

    expect(after.player.hp).toBe(after.player.maxHp);
  });
});

describe('รางวัลและร้านค้าจำกัดตามคลาส', () => {
  it('การ์ดรางวัลตอนเลเวลอัปเป็นของคลาสที่เล่นอยู่หรือกลาง', () => {
    for (const id of ALL_CLASS_IDS) {
      const { list } = rollThreeCards(makeRng(`rw-${id}`), 9, id);
      for (const c of list) expect([undefined, id], `${c.id} ไม่ใช่การ์ดของ ${id}`).toContain(c.class);
    }
  });

  it('ร้านขายเฉพาะการ์ดของคลาสที่เล่นอยู่หรือกลาง', () => {
    for (const id of ALL_CLASS_IDS) {
      const { items } = rollShopStock(makeRng(`sh-${id}`), 6, 1, id);
      for (const it of items) {
        if (!('card' in it)) continue;
        expect([undefined, id], `${it.card.id} ไม่ใช่การ์ดของ ${id}`).toContain(it.card.class);
      }
    }
  });
});
