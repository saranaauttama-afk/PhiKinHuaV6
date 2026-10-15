// test/notfm-data.test.ts — the card, equipment and blessing data obeys the NOTFM card rules.
import { describe, it, expect } from 'vitest';
import type { CardData, Fx } from '../src/core/types';
import { ALL_CARDS, CARD_LIST_WITH_STARTERS, CURSE_CARDS, BLESSING_POOL, CLASS_BLESSINGS, poolFor } from '../src/core/pack';
import { ALL_CLASS_IDS } from '../src/core/classes';
import { FREE_TYPES, starFx } from '../src/core/cards/model';
import { describeCard, describeBlessing } from '../src/core/cards/describe';
import { upgradeCard } from '../src/core/engine/shared';
import { STATUS_EFFECTS_REGISTRY } from '../src/core/combat/status-effects/registry';

const statusIds = new Set(Object.keys(STATUS_EFFECTS_REGISTRY));
const TRIGGER_ON = ['battleStart', 'equip', 'turnStart', 'turnEnd', 'play', 'prayerDone', 'rhythm', 'roundEnd', 'seal'];

function fxStatuses(fx?: Fx): string[] {
  return (fx?.status ?? []).map(e => e.id);
}
function allFx(c: CardData): Fx[] {
  return [c.fx, c.conditional?.bonus, ...(c.stars ?? []), ...(c.equip?.triggers.map(t => t.fx) ?? [])].filter(Boolean) as Fx[];
}
const draws = (c: CardData) => allFx(c).some(f => (f.draw ?? 0) > 0);

describe('ข้อมูลการ์ด', () => {
  it('id ไม่ซ้ำข้ามทุกไฟล์', () => {
    const ids = [...ALL_CARDS, ...CURSE_CARDS].map(c => c.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  it('ชื่อการ์ดไม่ซ้ำกัน', () => {
    const names = [...ALL_CARDS, ...CURSE_CARDS].map(c => c.name);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it('ค่าร่ายตรงกับชนิด: ฟรี / แต้ม / มานา', () => {
    for (const c of ALL_CARDS) {
      if (FREE_TYPES.includes(c.type)) {
        expect(c.ap ?? 0, c.id).toBe(0);
        expect(c.mana ?? 0, c.id).toBe(0);
      } else if (c.type === 'spell') {
        // หมอผี สาด spends the whole bowl instead of a fixed price (docs/mor-phi/DESIGN.md).
        if (!c.splash) expect(c.mana ?? 0, c.id).toBeGreaterThan(0);
        expect(c.ap ?? 0, c.id).toBe(0);
      } else {
        expect(['action', 'prayer'], c.id).toContain(c.type);
        expect(c.ap ?? 0, c.id).toBeGreaterThan(0);
        expect(c.mana ?? 0, c.id).toBe(0);
      }
    }
  });

  it('การ์ดฟรีที่จั่วได้ต้องจำกัดเทิร์นละครั้งหรือนำออก', () => {
    for (const c of ALL_CARDS.filter(c => FREE_TYPES.includes(c.type) && draws(c))) {
      expect(c.limit === 'turn' || c.exhaust, c.id).toBeTruthy();
    }
  });

  it('ไม่มีการ์ดคืนแต้มเท่ากับหรือมากกว่าที่จ่าย', () => {
    for (const c of ALL_CARDS) for (const f of allFx(c)) {
      if (f.ap) expect(f.ap, c.id).toBeLessThan(c.ap ?? 0);
    }
  });

  it('สถานะทุกตัวมีอยู่จริง', () => {
    for (const c of ALL_CARDS) for (const f of allFx(c)) for (const id of fxStatuses(f)) {
      expect(statusIds.has(id), `${c.id} → ${id}`).toBe(true);
    }
  });

  it('อุปกรณ์มีผลติดตัว การ์ดตอบโต้มีเงื่อนไข', () => {
    for (const c of ALL_CARDS) {
      if (c.type === 'equipment') {
        expect(c.equip, c.id).toBeDefined();
        const e = c.equip!;
        // นักมวย equipment may work only through passive fields (move bonus, charges, riposte).
        const flags = Object.values(e.moveBonus ?? {}).length + Object.values(e.moveBruise ?? {}).length + (e.heavyPerBruise ?? 0) + (e.riposteBonus ?? 0) + (e.damageCap ? 1 : 0) + (e.deathSave ? 1 : 0)
          // หมอผี: ขัน / น้ำล้นขัน
          + (e.bowlBonus ?? 0) + (e.overflowDmg ?? 0);
        expect(e.triggers.length + (e.armor ?? 0) + (e.attackBonus ?? 0) + flags, c.id).toBeGreaterThan(0);
        for (const t of c.equip!.triggers) expect(TRIGGER_ON, c.id).toContain(t.on);
      }
      if (c.type === 'counter') expect(c.counter?.trigger, c.id).toBeDefined();
    }
  });

  it('คำอธิบายทุกดาวอ่านได้ ไม่มี undefined/NaN', () => {
    for (const c of [...ALL_CARDS, ...CURSE_CARDS]) {
      let card = c;
      for (let star = 1; star <= 3; star++) {
        const text = describeCard(card);
        expect(text.length, c.id).toBeGreaterThan(0);
        expect(text, c.id).not.toMatch(/undefined|NaN/);
        const fx = starFx(card);
        for (const k of ['dmg', 'block', 'heal'] as const) if (fx[k] != null) expect(Number.isFinite(fx[k]), c.id).toBe(true);
        card = upgradeCard(card);
      }
    }
  });
});

describe('คลังของแต่ละอาชีพ', () => {
  for (const id of ALL_CLASS_IDS) {
    it(`${id}: เด็คตั้งต้น 10 ใบ และคลังครบทุกระดับ`, () => {
      const starters = CARD_LIST_WITH_STARTERS.filter(c => c.class === id).reduce((n, c) => n + (c.starter ?? 0), 0);
      expect(starters).toBe(10);
      const pool = poolFor(id).filter(c => c.class === id);
      for (const r of ['Common', 'Uncommon', 'Rare'] as const) expect(pool.some(c => c.rarity === r), r).toBe(true);
      expect(pool.length).toBeGreaterThanOrEqual(15);
    });
  }

  it('การ์ดล็อกและคำสาปไม่อยู่ในรางวัลหรือร้าน', () => {
    for (const id of ALL_CLASS_IDS) {
      const pool = poolFor(id);
      expect(pool.some(c => c.locked)).toBe(false);
      expect(pool.some(c => c.type === 'curse')).toBe(false);
    }
  });

  it('ทุกการ์ดอาชีพที่ปลดล็อกได้มีอยู่จริง หนึ่งใบต่ออาชีพ', () => {
    const locked = ALL_CARDS.filter(c => c.locked);
    expect(locked.map(c => c.class).sort()).toEqual([...ALL_CLASS_IDS].sort());
  });
});

describe('ข้อมูลพร', () => {
  it('ทุกพรมีผล และ trigger ถูกชนิด', () => {
    for (const b of [...BLESSING_POOL, ...CLASS_BLESSINGS]) {
      expect(b.triggers.length + (b.armor ?? 0) + (b.attackBonus ?? 0), b.id).toBeGreaterThan(0);
      for (const t of b.triggers) {
        expect(TRIGGER_ON, b.id).toContain(t.on);
        for (const id of fxStatuses(t.fx)) expect(statusIds.has(id), `${b.id} → ${id}`).toBe(true);
      }
      expect(describeBlessing(b), b.id).not.toMatch(/undefined|NaN/);
    }
  });

  it('พรประจำอาชีพมีครบสี่อาชีพ', () => {
    expect(CLASS_BLESSINGS.map(b => b.class).sort()).toEqual([...ALL_CLASS_IDS].sort());
  });
});
