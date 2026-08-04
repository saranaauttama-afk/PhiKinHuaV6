import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { CardData, GameState } from '../src/core/types';
import {
  COMBOS, COMBO_BY_ID, combosForClass, comboTarget,
  onCardPlayed, expireCombos, resetCombos, applyComboCardModifiers, shouldBlockDebuff,
} from '../src/core/combat/combos';
import { ALL_CLASS_IDS, CHARACTER_CLASSES } from '../src/core/classes';
import { THAI_MINIONS } from '../src/core/combat/minions/thai-minions';
import { STATUS_EFFECTS_REGISTRY } from '../src/core/combat/status-effects/registry';
import { applyStatusEffect } from '../src/core/statusEffectsRuntime';
import { makeCombatState, attackCard } from './helpers';
import cardsJson from '../src/data/packs/base/cards.json';
import classCardsJson from '../src/data/packs/base/class_cards.json';

const ALL_CARDS = [...cardsJson, ...classCardsJson] as any[];
const CARD_BY_ID: Record<string, any> = Object.fromEntries(ALL_CARDS.map(c => [c.id, c]));

/**
 * คอมโบการ์ด
 *
 * ระบบนี้ทำงานอยู่จริงทุกครั้งที่เล่นการ์ดมาตลอด แต่เก็บสถานะไว้ในอาร์เรย์ระดับ
 * โมดูลกับฟิลด์ที่แปะบน `(state as any)` ไม่มีจอไหนแสดง ผลลัพธ์ `draw` ไม่ได้จั่วจริง
 * และมีแต่คอมโบของหมอผี — อีกสามคลาสเล่นทั้งรันโดยไม่มีคอมโบให้ติดเลย
 */

const play = (s: GameState, id: string, classTag: string, tags: string[] = []) =>
  onCardPlayed(s, { id, name: id, type: 'skill', cost: 0, tags } as CardData, classTag);

describe('ข้อมูลคอมโบ', () => {
  it('id ไม่ซ้ำ', () => {
    const ids = COMBOS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ทุกคอมโบมีชื่อและคำอธิบายไทย', () => {
    for (const c of COMBOS) {
      expect(c.name.trim().length, c.id).toBeGreaterThan(0);
      expect(c.desc.trim().length, c.id).toBeGreaterThan(0);
      // ตัวเดิมชื่อเป็นอังกฤษหมด ("Shaman's Focus", "Hell Gate Ritual")
      expect(c.name, `${c.id} ยังเป็นภาษาอังกฤษ`).toMatch(/[ก-๙]/);
    }
  });

  it('ทุกคลาสมีคอมโบของตัวเอง — ไม่ใช่หมอผีคลาสเดียว', () => {
    for (const id of ALL_CLASS_IDS) {
      const tag = CHARACTER_CLASSES[id].cardTag;
      expect(combosForClass(tag).length, `คลาส ${id} ไม่มีคอมโบเลย`).toBeGreaterThan(0);
    }
  });

  /** คอมโบที่อ้างการ์ดผีคือคอมโบที่ติดไม่ได้ตลอดกาล และไม่มีอะไรเตือน */
  it('ทุกคอมโบอ้างการ์ดที่มีอยู่จริง และเป็นการ์ดของคลาสตัวเอง', () => {
    for (const c of COMBOS) {
      for (const cardId of c.requiredCards ?? []) {
        const card = CARD_BY_ID[cardId];
        expect(card, `${c.id} อ้าง ${cardId} ที่ไม่มีในเกม`).toBeDefined();
        expect(card.tags ?? [], `${c.id} อ้าง ${cardId} ซึ่งไม่ใช่การ์ดของ ${c.classTag}`)
          .toContain(c.classTag);
      }
    }
  });

  it('ทุกผลลัพธ์อ้างสถานะ/ผีที่มีอยู่จริง', () => {
    for (const c of COMBOS) {
      for (const e of c.effects) {
        if (e.statusId) {
          expect((STATUS_EFFECTS_REGISTRY as any)[e.statusId], `${c.id} → ${e.statusId}`)
            .toBeDefined();
        }
        if (e.minionId) {
          expect(THAI_MINIONS[e.minionId], `${c.id} → ${e.minionId}`).toBeDefined();
        }
        expect(e.desc.trim().length, `${c.id} มีผลลัพธ์ที่ไม่มีคำอธิบาย`).toBeGreaterThan(0);
      }
    }
  });
});

describe('การนับคอมโบ', () => {
  it('เล่นครบชุดแล้วติด และย้ายไปอยู่ในรายการที่ติดแล้ว', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);

    play(state, 'muay_stance', 'warrior');
    expect(state.combo!.progress[0].cardsPlayed).toEqual(['muay_stance']);
    expect(state.combo!.done).toEqual([]);

    play(state, 'flying_knee', 'warrior');
    expect(state.combo!.done).toContain('muay_combination');
    expect(state.combo!.progress.find(p => p.comboId === 'muay_combination')).toBeUndefined();
  });

  it('เล่นใบเดิมซ้ำไม่นับเพิ่ม', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);

    play(state, 'muay_stance', 'warrior');
    play(state, 'muay_stance', 'warrior');

    expect(state.combo!.progress[0].cardsPlayed).toHaveLength(1);
    expect(state.combo!.done).toEqual([]);
  });

  /**
   * เดิมตรวจคอมโบหมอผีให้ทุกคลาส ซึ่งติดไม่ได้อยู่แล้วเพราะคลาสอื่นไม่มีการ์ดพวกนั้น
   * แต่ก็แปลว่าถ้าวันหนึ่งมีการ์ด id ซ้ำข้ามคลาส คอมโบจะรั่วข้ามคลาสทันที
   */
  it('คอมโบของคลาสอื่นไม่ถูกนับ', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);

    play(state, 'muay_stance', 'nun');
    play(state, 'flying_knee', 'nun');

    expect(state.combo!.done).toEqual([]);
    expect(state.combo!.progress).toEqual([]);
  });

  it('คอมโบแบบนับแท็กต้องได้การ์ดไม่ซ้ำครบจำนวน', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);
    const combo = COMBO_BY_ID['ultimate_thai_mastery'];
    const need = comboTarget(combo);

    for (let i = 0; i < need - 1; i++) play(state, `thai_${i}`, 'shaman', ['thai']);
    expect(state.combo!.done).not.toContain('ultimate_thai_mastery');

    play(state, `thai_${need - 1}`, 'shaman', ['thai']);
    expect(state.combo!.done).toContain('ultimate_thai_mastery');
  });

  it('ค้างนานเกิน maxTurns แล้วหลุด', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);
    state.turn = 1;

    play(state, 'muay_stance', 'warrior');
    expect(state.combo!.progress).toHaveLength(1);

    state.turn = 1 + COMBO_BY_ID['muay_combination'].maxTurns;
    expireCombos(state);
    expect(state.combo!.progress, 'คอมโบค้างข้ามเทิร์นไม่มีวันหลุด').toHaveLength(0);
  });

  it('คอมโบ oncePerCombat ติดซ้ำในไฟต์เดียวไม่ได้', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);

    play(state, 'temple_blade', 'warrior');
    play(state, 'parry_step', 'warrior');
    play(state, 'stand_firm', 'warrior');
    expect(state.combo!.done).toContain('temple_discipline');

    const before = state.combo!.done.filter(x => x === 'temple_discipline').length;
    play(state, 'temple_blade', 'warrior');
    play(state, 'parry_step', 'warrior');
    play(state, 'stand_firm', 'warrior');
    expect(state.combo!.done.filter(x => x === 'temple_discipline').length).toBe(before);
  });
});

describe('ผลของคอมโบเกิดขึ้นจริง', () => {
  it('ดาเมจเข้าศัตรูจริง', () => {
    const { state } = makeCombatState({ hand: [], enemyHp: 200 });
    resetCombos(state);
    const before = state.enemy!.hp;

    play(state, 'muay_stance', 'warrior');
    play(state, 'flying_knee', 'warrior');

    expect(state.enemy!.hp).toBeLessThan(before);
  });

  it('block เข้าจริง', () => {
    const { state } = makeCombatState({ hand: [], playerBlock: 0 });
    resetCombos(state);

    play(state, 'chant_sutra', 'nun');
    play(state, 'loving_kindness', 'nun');

    expect(state.player.block).toBeGreaterThan(0);
  });

  /**
   * ผลลัพธ์ `draw` เดิมเป็น `log.push('Draw 3 cards!')` เฉยๆ — คอมโบที่โฆษณาว่า
   * จั่วให้ไม่เคยจั่วให้สักใบ
   */
  it('จั่วการ์ดจริง ไม่ใช่แค่เขียนลง log', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);
    state.piles.draw = Array.from({ length: 10 }, (_, i) =>
      attackCard(3, { id: `d${i}`, name: `d${i}`, instanceId: `d${i}` })
    );
    const before = state.piles.hand.length;

    play(state, 'fighter_breath', 'warrior');
    play(state, 'iron_will', 'warrior');

    expect(state.piles.hand.length, 'คอมโบบอกว่าจั่ว 2 ใบแต่ไม่ได้จั่ว')
      .toBeGreaterThan(before);
  });

  it('พลังงานเพิ่มจริง', () => {
    const { state } = makeCombatState({ hand: [], playerEnergy: 1 });
    resetCombos(state);

    play(state, 'fighter_breath', 'warrior');
    play(state, 'iron_will', 'warrior');

    expect(state.player.energy).toBeGreaterThan(1);
  });

  it('ใส่สถานะให้ศัตรูจริง', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);

    play(state, 'call_phrai', 'medium');
    play(state, 'phrai_oil', 'medium');
    play(state, 'whisper_ear', 'medium');

    expect(state.enemy!.statusEffects?.map(e => e.id)).toContain('poison');
  });

  it('เรียกผีมาช่วยจริง', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);

    play(state, 'set_altar', 'medium');
    play(state, 'yantra_cloth', 'medium');

    expect((state.minions ?? []).length).toBeGreaterThan(0);
  });

  it('ล้างสถานะลบจริง', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);
    applyStatusEffect('player', state, 'poison', 4, 3);
    expect(state.player.statusEffects?.map(e => e.id)).toContain('poison');

    play(state, 'holy_water', 'nun');
    play(state, 'dispel_ill', 'nun');
    play(state, 'five_precepts', 'nun');

    expect(state.player.statusEffects?.map(e => e.id)).not.toContain('poison');
  });
});

describe('ผลที่ค้างอยู่หลังติดคอมโบ', () => {
  it('การ์ดถัดไปร่ายฟรี แล้วหมดโควตา', () => {
    const s: any = { combo: { progress: [], done: [], freeCards: 2, debuffImmunity: false }, log: [] };
    const card = attackCard(5, { id: 'x', name: 'x', cost: 3 });

    expect(applyComboCardModifiers(s, card).cost).toBe(0);
    expect(applyComboCardModifiers(s, card).cost).toBe(0);
    expect(applyComboCardModifiers(s, card).cost, 'ฟรีเกินโควตา').toBe(3);
  });

  /**
   * `shouldBlockDebuff` มีมาตลอดแต่ **ไม่มีใครเรียก** — ภูมิคุ้มกันจากคอมโบ
   * "เทพเจ้าลงมา" จึงไม่เคยกันสถานะลบได้เลยสักครั้ง
   */
  it('ภูมิคุ้มกันกันสถานะลบได้จริง แต่ไม่กันสถานะบวก', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);
    state.combo!.debuffImmunity = true;
    expect(shouldBlockDebuff(state)).toBe(true);

    applyStatusEffect('player', state, 'poison', 4, 3);
    expect(state.player.statusEffects?.map(e => e.id) ?? []).not.toContain('poison');

    applyStatusEffect('player', state, 'strength', 4, 2);
    expect(state.player.statusEffects?.map(e => e.id) ?? []).toContain('strength');
  });

  it('ภูมิคุ้มกันของศัตรูไม่ถูกกันตาม (ธงนี้เป็นของผู้เล่น)', () => {
    const { state } = makeCombatState({ hand: [] });
    resetCombos(state);
    state.combo!.debuffImmunity = true;

    applyStatusEffect('enemy', state, 'poison', 4, 3);
    expect(state.enemy!.statusEffects?.map(e => e.id)).toContain('poison');
  });
});

describe('คอมโบไม่ค้างข้ามไฟต์', () => {
  it('เริ่มไฟต์ใหม่แล้วความคืบหน้าและรายการที่ติดแล้วถูกล้าง', () => {
    let s: any = { seed: 'combo-run', phase: 'start', turn: 0 };
    let r = makeRng('combo-run');
    const go = (c: any) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

    go({ type: 'NewRun', seed: 'combo-run', classId: 'warrior' });
    while (s.chapter) go({ type: 'SkipChapter' });
    go({ type: 'ChooseStarterBlessing', index: 0 });
    while (s.chapter) go({ type: 'SkipChapter' });

    s.combo = { progress: [{ comboId: 'muay_combination', cardsPlayed: ['muay_stance'], turnStarted: 0 }], done: ['temple_discipline'], freeCards: 5, debuffImmunity: true };

    s.pages.current.offers[0] = { kind: 'monster', tier: 'normal', enemyId: 'phi-krasue' };
    go({ type: 'ChooseOffer', index: 0 });

    expect(s.combo.progress, 'ความคืบหน้าคอมโบข้ามไฟต์มา').toEqual([]);
    expect(s.combo.done, 'คอมโบที่ติดไปแล้วข้ามไฟต์มา').toEqual([]);
    expect(s.combo.freeCards).toBe(0);
    expect(s.combo.debuffImmunity).toBe(false);
  });

  it('คอมโบอยู่ใน state ของตัวเอง ไม่ใช่ของกลาง', () => {
    const a = makeCombatState({ hand: [] }).state;
    const b = makeCombatState({ hand: [] }).state;
    resetCombos(a);
    resetCombos(b);

    play(a, 'muay_stance', 'warrior');

    expect(a.combo!.progress).toHaveLength(1);
    expect(b.combo!.progress, 'คอมโบข้ามไปโผล่ใน state อื่น').toHaveLength(0);
  });
});
