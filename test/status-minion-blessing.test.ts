import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { StatusEffect } from '../src/core/types_extended';
import type { CardData } from '../src/core/types';
import type { BlessingDef } from '../src/core/types';
import { THAI_MINIONS } from '../src/core/combat/minions/thai-minions';
import { STATUS_EFFECTS_REGISTRY } from '../src/core/combat/status-effects/registry';
import { sortForDisplay, isDebuff } from '../src/core/combat/statusDisplay';
import { minionTemplateId, visibleMinions, minionSummary } from '../src/core/combat/minions/display';
import { groupBlessings } from '../src/core/blessing/group';
import { applyStatusEffect } from '../src/core/statusEffectsRuntime';
import { makeCombatState } from './helpers';
import cardsJson from '../src/data/packs/base/cards.json';
import classCardsJson from '../src/data/packs/base/class_cards.json';

const ALL_CARDS = [...cardsJson, ...classCardsJson] as any[];

/**
 * สามอย่างที่ผู้เล่นมองไม่เห็นมาตลอด: ผีที่เรียกมา สถานะที่ติดตัว และพรติดตัว
 *
 * ข้อมูลพร้อมใช้ทั้งหมด — สถานะเก็บครบใน `player.statusEffects` พร้อมชื่อไทย
 * ผีที่เรียกมาถูกก๊อปลง `state.playerMinions` ทุกครั้งที่เปลี่ยน พรอยู่ใน
 * `state.blessings` — ไม่มีอันไหนเคยขึ้นจอเลย
 */

const eff = (id: string, over: Partial<StatusEffect> = {}): StatusEffect => ({
  id, name: id, description: '', duration: 3, ...over,
});

describe('เรียงสถานะให้อ่านออก', () => {
  /**
   * ตั้งใจให้บัฟชนะดีบัฟทั้งตามอายุและตามตัวอักษร — ถ้าไม่ได้แยกกลุ่มก่อนจริง
   * บัฟจะขึ้นก่อน ข้อนี้จึงล้มเมื่อกฎ "ดีบัฟมาก่อน" หายไป
   * (ครั้งแรกที่เขียน ใช้ข้อมูลที่เรียงตามตัวอักษรแล้วบังเอิญได้ผลเดียวกัน
   *  เทสต์เลยผ่านทั้งที่ลบกฎออก)
   */
  it('ดีบัฟขึ้นก่อนบัฟเสมอ — สิ่งที่ทำร้ายเราสำคัญกว่าสิ่งที่ช่วยเรา', () => {
    const out = sortForDisplay([
      eff('block_next', { duration: 1 }),   // บัฟ อายุสั้นกว่า ชื่อมาก่อน
      eff('poison', { duration: 9 }),       // ดีบัฟ อายุยาวกว่า ชื่อมาทีหลัง
    ]);
    expect(out.map(e => e.id)).toEqual(['poison', 'block_next']);
    expect(out.map(e => (isDebuff(e) ? 'debuff' : 'buff'))).toEqual(['debuff', 'buff']);
  });

  it('ในกลุ่มเดียวกัน ตัวที่ใกล้หมดอายุขึ้นก่อน', () => {
    const out = sortForDisplay([
      eff('poison', { duration: 5 }),
      eff('curse', { duration: 1 }),
      eff('fear', { duration: 3 }),
    ]);
    expect(out.map(e => e.duration)).toEqual([1, 3, 5]);
  });

  it('อ่านบัฟ/ดีบัฟจากแท็กในทะเบียน ไม่ใช่เดาจากชื่อ', () => {
    expect(isDebuff(eff('poison'))).toBe(true);
    expect(isDebuff(eff('curse'))).toBe(true);
    expect(isDebuff(eff('strength'))).toBe(false);
    expect(isDebuff(eff('regeneration'))).toBe(false);
  });

  /**
   * มี `StatusEffectType` สองชุดที่ไม่ตรงกัน — ชุดเก่าประกาศ 26 ชนิด
   * (sleep, bleed, doom, …) แต่ทะเบียนจริงมี 13 สถานะที่หาไม่เจอจึงเป็นไปได้
   */
  it('สถานะที่ไม่มีในทะเบียน ถือเป็นผลลบไว้ก่อน ไม่ใช่พังหรือหายไป', () => {
    expect(isDebuff(eff('สถานะที่ไม่รู้จัก'))).toBe(true);
    expect(sortForDisplay([eff('ไม่รู้จัก')])).toHaveLength(1);
  });

  it('ทุกสถานะในทะเบียนบอกได้ว่าเป็นบัฟหรือดีบัฟ และมีชื่อ/คำอธิบายไทย', () => {
    for (const def of Object.values(STATUS_EFFECTS_REGISTRY)) {
      expect(def.name.trim().length, def.id).toBeGreaterThan(0);
      expect(def.description.trim().length, def.id).toBeGreaterThan(0);
      const tagged = def.tags?.includes('buff') || def.tags?.includes('debuff');
      expect(tagged, `${def.id} ไม่มีแท็ก buff/debuff`).toBe(true);
    }
  });
});

describe('สถานะที่ติดตัวจริงตอนสู้', () => {
  it('ใส่สถานะแล้วมันไปโผล่ในที่ที่ UI อ่าน', () => {
    const { state } = makeCombatState({ hand: [] });
    applyStatusEffect('player', state, 'poison', 4, 3);
    applyStatusEffect('enemy', state, 'curse', 5, 1);

    expect(state.player.statusEffects?.map(e => e.id)).toContain('poison');
    expect(state.enemy?.statusEffects?.map(e => e.id)).toContain('curse');
  });
});

describe('ยุบระบบสถานะสองชุดให้เหลือชุดเดียว', () => {
  /**
   * เดิมมี minion ที่ติดธง `invisible` ทำหน้าที่เป็นสถานะ ซ้อนกับ `statusEffects`
   * ตัวจริง — การ์ด "เสกพิษตรง" เรียก minion พิษ ส่วน "น้ำมันพราย" ใช้สถานะพิษ
   * ทั้งที่ตัวเลขเหมือนกันเป๊ะ แถบสถานะจะเห็นแค่อันหลัง
   */
  it('ไม่มี minion ที่เป็นสถานะปลอมเหลืออยู่แล้ว', () => {
    for (const m of Object.values(THAI_MINIONS)) {
      expect(m.isStatusEffect, `${m.id} ยังเป็นสถานะปลอม`).toBeFalsy();
      expect(m.invisible, `${m.id} ยังซ่อนตัว`).toBeFalsy();
    }
  });

  it('ไม่มีการ์ดใบไหนอ้าง minion ที่ไม่มีอยู่จริง', () => {
    for (const c of ALL_CARDS) {
      if (!c.summonMinion) continue;
      expect(THAI_MINIONS[c.summonMinion], `${c.id} เรียก ${c.summonMinion} ที่ไม่มีในทะเบียน`)
        .toBeDefined();
    }
  });

  it('เสกพิษตรงใส่สถานะพิษจริงให้ศัตรู — แถบสถานะจึงเห็นมัน', () => {
    const card = ALL_CARDS.find(c => c.id === 'direct_poison_spell');
    expect(card.summonMinion, 'ยังเรียก minion พิษปลอมอยู่').toBeUndefined();

    const { state, rng } = makeCombatState({
      hand: [{ ...card, instanceId: 'p1' } as CardData],
      playerEnergy: 3,
    });
    const out = applyCommand(state, { type: 'PlayCard', index: 0 }, rng).state;

    expect(out.enemy?.statusEffects?.map(e => e.id)).toContain('poison');
  });
});

describe('ผีที่เรียกมา', () => {
  it('เล่นการ์ดแล้วผีไปโผล่ในที่ที่ UI อ่านได้', () => {
    const card = ALL_CARDS.find(c => c.id === 'create_kuman');
    const { state, rng } = makeCombatState({
      hand: [{ ...card, cost: 0, instanceId: 'k1' } as CardData],
      playerEnergy: 3,
    });

    const out = applyCommand(state, { type: 'PlayCard', index: 0 }, rng).state;
    const mine = visibleMinions(out.playerMinions);

    expect(mine.length, 'เสกแล้วไม่มีผีโผล่มาเลย').toBeGreaterThan(0);
    expect(mine[0].name).toBe('กุมารทอง');
    expect(mine[0].duration).toBeGreaterThan(0);
    expect(minionSummary(mine[0]).length).toBeGreaterThan(0);
  });

  it('ตัดชื่อแม่แบบออกจาก id ที่ต่อท้ายให้ไม่ซ้ำได้', () => {
    expect(minionTemplateId('kuman_spirit_abc_1')).toBe('kuman_spirit');
    expect(minionTemplateId('ghost_ally_x_2')).toBe('ghost_ally');
    // แม่แบบที่ชื่อมีสามท่อน — ตัดด้วยขีดล่างเฉยๆ จะได้ผลผิด
    expect(minionTemplateId('ancient_warrior_spirit_q_1')).toBe('ancient_warrior_spirit');
  });

  it('ทุกแม่แบบมีชื่อ อายุ และบอกได้ว่าทำอะไร', () => {
    for (const m of Object.values(THAI_MINIONS)) {
      expect(m.name.trim().length, m.id).toBeGreaterThan(0);
      expect(m.duration, `${m.id} ไม่มีอายุ`).toBeGreaterThan(0);
      expect(minionSummary(m).trim().length, `${m.id} ไม่บอกว่าทำอะไร`).toBeGreaterThan(0);
    }
  });

  /**
   * `MinionData` ไม่มีฟิลด์ `hp` — ผีที่เรียกมาคือออร่าที่มีอายุ ไม่ใช่ตัวที่ยืนสู้
   * แต่คำอธิบายการ์ดเคยเขียนว่ากุมารมี "8 HP, โจมตี 2" ซึ่งไม่จริงทั้งคู่
   */
  it('การ์ดที่เรียกผีไม่สัญญาเลือดที่ระบบไม่มี', () => {
    for (const c of ALL_CARDS) {
      if (!c.summonMinion) continue;
      expect(c.desc ?? '', `${c.id} ยังโฆษณา HP ของผีที่ไม่มีเลือด`).not.toMatch(/\d+\s*HP/);
    }
  });

  it('การ์ดที่เรียกผีบอกอายุจริงของผีตัวนั้น', () => {
    for (const c of ALL_CARDS) {
      if (!c.summonMinion) continue;
      const m = THAI_MINIONS[c.summonMinion];
      expect(c.desc ?? '', `${c.id} ไม่ได้บอกว่าผีอยู่กี่เทิร์น`)
        .toContain(`${m.duration} เทิร์น`);
    }
  });
});

describe('รวมพรซ้ำ', () => {
  const b = (id: string, name: string): BlessingDef => ({ id, name } as BlessingDef);

  it('พรเดิมสองใบ = หนึ่งแถว นับได้สอง', () => {
    const rows = groupBlessings([b('a', 'ผีป้องกัน'), b('a', 'ผีป้องกัน')]);
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(2);
  });

  it('จำนวนรวมทุกแถวเท่ากับพรที่ถืออยู่จริง', () => {
    const list = [b('a', 'ก'), b('b', 'ข'), b('a', 'ก'), b('c', 'ค')];
    const rows = groupBlessings(list);
    expect(rows.reduce((n, r) => n + r.count, 0)).toBe(list.length);
  });

  it('ไม่มีพรก็ไม่พัง', () => {
    expect(groupBlessings([])).toEqual([]);
  });
});
