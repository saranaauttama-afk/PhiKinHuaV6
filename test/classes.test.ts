import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import {
  ALL_CLASS_IDS, CHARACTER_CLASSES, buildStarterDeck, getClass, type ClassId,
} from '../src/core/classes';
import { ALL_CARDS } from '../src/core/pack';
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
  s.pages.current.offers[0] = {
    kind: 'monster', tier: 'normal', enemyId: 'phi-krasue',
  } as PageOffer;
  go({ type: 'ChooseOffer', index: 0 });
  return s;
}

describe('นิยามคลาส', () => {
  it('ทุกคลาสมีการ์ดตั้งต้นครบ ไม่มีใบไหนหาไม่เจอ', () => {
    for (const id of ALL_CLASS_IDS) {
      const cls = CHARACTER_CLASSES[id];
      const known = new Set(ALL_CARDS.map(c => c.id));
      const missing = Object.keys(cls.starterDeck).filter(cid => !known.has(cid));
      expect(missing, `คลาส ${cls.name}`).toEqual([]);
    }
  });

  it('เด็คตั้งต้นของทุกคลาสมีจำนวนใบพอเล่น', () => {
    for (const id of ALL_CLASS_IDS) {
      const deck = buildStarterDeck(CHARACTER_CLASSES[id], ALL_CARDS);
      expect(deck.length, `คลาส ${id}`).toBeGreaterThanOrEqual(8);
    }
  });

  it('แต่ละคลาสมีเด็คต่างกันจริง', () => {
    const signatures = ALL_CLASS_IDS.map(id =>
      buildStarterDeck(CHARACTER_CLASSES[id], ALL_CARDS)
        .map(c => c.id).sort().join(',')
    );
    expect(new Set(signatures).size).toBe(ALL_CLASS_IDS.length);
  });

  it('ทุกคลาสมีทั้งการ์ดโจมตีและการ์ดป้องกัน/ฟื้นฟู', () => {
    for (const id of ALL_CLASS_IDS) {
      const deck = buildStarterDeck(CHARACTER_CLASSES[id], ALL_CARDS);
      expect(deck.some(c => (c.dmg ?? 0) > 0), `คลาส ${id} ไม่มีการ์ดโจมตี`).toBe(true);
      expect(
        deck.some(c => (c.block ?? 0) > 0 || (c.heal ?? 0) > 0),
        `คลาส ${id} ไม่มีการ์ดป้องกันหรือฟื้นฟู`
      ).toBe(true);
    }
  });

  it('การ์ดของคลาสติดแท็กของคลาสตัวเอง', () => {
    for (const id of ALL_CLASS_IDS) {
      const cls = CHARACTER_CLASSES[id];
      for (const c of buildStarterDeck(cls, ALL_CARDS)) {
        expect(c.tags ?? [], `${c.id} ในเด็ค ${id}`).toContain(cls.cardTag);
      }
    }
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
      expect(s.player.maxEnergy).toBe(cls.startEnergy);
      expect(s.player.maxHandSize).toBe(cls.startHandSize);
    }
  });

  it('masterDeck เป็นเด็คของคลาสนั้น', () => {
    for (const id of ALL_CLASS_IDS) {
      const s = startRun(id);
      const expected = buildStarterDeck(CHARACTER_CLASSES[id], ALL_CARDS);
      expect(s.masterDeck.map(c => c.id).sort()).toEqual(expected.map(c => c.id).sort());
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

describe('พรติดตัวของคลาส', () => {
  it('นักรบเริ่มไฟต์ด้วยการ์ดป้องกัน', () => {
    const s = enterFight('warrior');
    expect(s.player.block).toBeGreaterThan(0);
  });

  it('หมอผีเริ่มไฟต์ด้วยพลังงานมากกว่าค่าปกติของตัวเอง', () => {
    const s = enterFight('shaman');
    expect(s.player.energy).toBeGreaterThan(getClass('shaman').startEnergy);
  });

  it('คนทรงเริ่มไฟต์พร้อมผีคู่กาย', () => {
    const s = enterFight('medium');
    const minions = (s as any).playerMinions ?? [];
    expect(minions.length).toBeGreaterThan(0);
  });

  it('แม่ชีฟื้นเลือดเมื่อชนะไฟต์', () => {
    let s: any = enterFight('nun');
    s.player.hp = Math.max(1, s.player.maxHp - 20);
    const before = s.player.hp;

    s.piles.hand = [{ id: 'k', name: 'k', type: 'attack', cost: 0, dmg: 9999, instanceId: 'k1' }];
    const after = applyCommand(s, { type: 'PlayCard', index: 0 }, makeRng('nun')).state;

    expect(after.player.hp).toBeGreaterThan(before);
  });

  it('คลาสอื่นไม่ได้ฟื้นเลือดตอนชนะ', () => {
    let s: any = enterFight('warrior');
    s.player.hp = Math.max(1, s.player.maxHp - 20);
    const before = s.player.hp;

    s.piles.hand = [{ id: 'k', name: 'k', type: 'attack', cost: 0, dmg: 9999, instanceId: 'k1' }];
    const after = applyCommand(s, { type: 'PlayCard', index: 0 }, makeRng('war')).state;

    expect(after.player.hp).toBe(before);
  });
});

describe('การ์ดฟื้นพลังชีวิตทำงานจริง', () => {
  it('เล่นการ์ดที่มี heal แล้วเลือดเพิ่ม', () => {
    let s: any = enterFight('nun');
    s.player.hp = Math.max(1, s.player.maxHp - 20);
    const before = s.player.hp;

    s.piles.hand = [
      { id: 'holy_water', name: 'น้ำมนต์', type: 'skill', cost: 0, heal: 7, instanceId: 'h1' },
    ];
    const after = applyCommand(s, { type: 'PlayCard', index: 0 }, makeRng('heal')).state;

    expect(after.player.hp).toBe(before + 7);
  });

  it('ฟื้นไม่เกินเลือดสูงสุด', () => {
    let s: any = enterFight('nun');
    s.player.hp = s.player.maxHp - 2;

    s.piles.hand = [
      { id: 'holy_water', name: 'น้ำมนต์', type: 'skill', cost: 0, heal: 99, instanceId: 'h1' },
    ];
    const after = applyCommand(s, { type: 'PlayCard', index: 0 }, makeRng('heal')).state;

    expect(after.player.hp).toBe(after.player.maxHp);
  });
});

describe('รางวัลและร้านค้าจำกัดตามคลาส', () => {
  it('การ์ดรางวัลตอนเลเวลอัปเป็นของคลาสที่เล่นอยู่', () => {
    for (const id of ALL_CLASS_IDS) {
      const tag = CHARACTER_CLASSES[id].cardTag;
      const { list } = rollThreeCards(makeRng(`rw-${id}`), 9, tag);
      for (const c of list) {
        expect(c.tags ?? [], `${c.id} ไม่ใช่การ์ดของ ${id}`).toContain(tag);
      }
    }
  });

  it('ร้านขายเฉพาะการ์ดของคลาสที่เล่นอยู่', () => {
    for (const id of ALL_CLASS_IDS) {
      const tag = CHARACTER_CLASSES[id].cardTag;
      const { items } = rollShopStock(makeRng(`sh-${id}`), 6, 1, tag);
      for (const it of items) {
        if (!('card' in it)) continue;
        expect(it.card.tags ?? [], `${it.card.id} ไม่ใช่การ์ดของ ${id}`).toContain(tag);
      }
    }
  });
});
