// test/mor-phi.test.ts — หมอผี (docs/mor-phi/DESIGN.md): น้ำมนต์, ขัน/น้ำล้นขัน, สาด, ยันต์/ผนึก,
// ปลุกยันต์, สายสิญจน์, ของต่ำ (เลือดแทนน้ำ), ของเลี้ยง, ข้อมูลการ์ด และข้อความ.
import { describe, it, expect } from 'vitest';
import type { CardData, GameState } from '../src/core/types';
import { makeCombatState } from './helpers';
import { makeRng } from '../src/core/rng';
import { applyCommand } from '../src/core/reducer';
import { playCard } from '../src/core/cards/play';
import { playBlock } from '../src/core/cards/model';
import { cardById, ALL_CARDS, CARD_LIST_WITH_STARTERS } from '../src/core/pack';
import { describeCard, costLabel } from '../src/core/cards/describe';
import { CLASS_PASSIVES, CLASS_RESOURCES, WATER_RULES } from '../src/core/balance/notfm';
import { CHARACTER_CLASSES, buildStarterDeck, classPlayable } from '../src/core/classes';
import { resetCardsPlayed } from '../src/core/cards/mechanics';
import { applyFx } from '../src/core/cards/fx';
import { bowlMax, gainWater, resourceName, sealTarget, yantOn } from '../src/core/cards/water';
import { beginPlayerFight, startPlayerTurn } from '../src/core/commands';
import { minionDef } from '../src/core/combat/minions';
import { enemyHandCharges } from '../src/core/combat/ghostMechanics';

const rng = makeRng('morphi');
const c = (id: string, star = 1): CardData => ({ ...cardById(id)!, star });
const GAPE = 'phi_pop_n1_gape';   // ชาร์จ
const STRIKE = 'phi_krasue_v29_strike'; // ไม่ชาร์จ

function fight(opts: { hand?: CardData[]; water?: number; hp?: number; ghost?: string[]; ages?: number[] } = {}): GameState {
  const { state: s } = makeCombatState({ hand: opts.hand, enemyHp: 200, playerHp: opts.hp ?? 50, playerMana: opts.water ?? 0 });
  s.player.maxHp = 60;
  s.classId = 'shaman';
  s.fight = { hpLost: 0, ghostTurns: 0, rhythm: 0 };
  s.turn = 1;
  s.turnFlags = { blessingOnce: {} };
  resetCardsPlayed(s);
  s.enemy!.statusEffects = [];
  s.enemyPiles = { draw: [], hand: [...(opts.ghost ?? [])], discard: [] };
  s.enemyHandAges = opts.ages ?? (opts.ghost ?? []).map(() => 0);
  return s;
}
const play = (s: GameState, i = 0) => playCard(s, i, rng).played;
const yant = (n: number) => ({ id: 'yant' as const, stacks: n, turns: 99, to: 'enemy' as const });

describe('อาชีพหมอผี', () => {
  it('เปิดให้เล่น ใช้ชื่อน้ำมนต์ passive ขันน้ำมนต์ประจำตัว', () => {
    expect(classPlayable('shaman')).toBe(true);
    expect(CLASS_PASSIVES.shaman.water).toBe(true);
    expect(CHARACTER_CLASSES.shaman.passiveName).toBe('ขันน้ำมนต์ประจำตัว');
    expect(CHARACTER_CLASSES.shaman.passiveDesc).toContain('น้ำมนต์');
    expect(resourceName('shaman')).toBe('น้ำมนต์');
    expect(resourceName('medium')).toBe('มานา');
  });

  it('เด็คเริ่มต้น 10 ใบ มีสาดน้ำมนต์และนั่งสมาธิปลุกเสก', () => {
    const deck = buildStarterDeck(CHARACTER_CLASSES.shaman, CARD_LIST_WITH_STARTERS);
    expect(deck).toHaveLength(10);
    expect(deck.some(x => x.id === 'holy_water_splash')).toBe(true);
    expect(deck.filter(x => x.id === 'meditation')).toHaveLength(2);
  });

  it('เริ่มไฟต์ด้วยน้ำมนต์ตั้งต้น และต้นเทิร์นถัดไปได้เพิ่ม', () => {
    const s = fight();
    s.player.startMana = CLASS_RESOURCES.shaman.startMana;
    s.piles.draw = [c('bamboo_dart'), c('bamboo_dart'), c('bamboo_dart'), c('bamboo_dart'), c('bamboo_dart')];
    s.masterDeck = s.piles.draw;
    beginPlayerFight(s, rng);
    expect(s.player.mana).toBe(CLASS_RESOURCES.shaman.startMana);
    s.turn = 2;
    const t = startPlayerTurn(s, rng).state;
    expect(t.player.mana).toBe(CLASS_RESOURCES.shaman.startMana + WATER_RULES.perTurn);
  });
});

describe('ขันและน้ำล้นขัน', () => {
  it('เก็บได้ไม่เกินขัน ส่วนที่ล้นเป็นเกราะ', () => {
    const s = fight({ water: WATER_RULES.bowlMax - 2 });
    gainWater(s, 5);
    expect(s.player.mana).toBe(WATER_RULES.bowlMax);
    expect(s.player.block).toBe(3 * WATER_RULES.overflowBlock);
  });

  it('อาชีพที่ไม่ใช้น้ำมนต์ ไม่มีขีดจำกัดขัน', () => {
    const s = fight({ water: 8 });
    s.classId = 'medium';
    gainWater(s, 5);
    expect(s.player.mana).toBe(13);
    expect(s.player.block).toBe(0);
  });

  it('ขันสำริดจุเพิ่ม 5 · รางน้ำมนต์ทำให้น้ำล้นตีผีด้วย', () => {
    const s = fight({ hand: [c('bronze_bowl')], water: 0 });
    play(s);
    expect(bowlMax(s)).toBe(WATER_RULES.bowlMax + 5);
    expect(s.player.mana).toBe(2);
    const t = fight({ hand: [c('overflow_trough')], water: WATER_RULES.bowlMax });
    play(t);
    const hp = t.enemy!.hp;
    gainWater(t, 2);
    expect(t.enemy!.hp).toBe(hp - 6);
    expect(t.player.block).toBe(2 * WATER_RULES.overflowBlock);
  });

  it('นั่งสมาธิปลุกเสกเป็นการ์ดฟรี ได้น้ำมนต์ 3', () => {
    const s = fight({ hand: [c('meditation')], water: 2 });
    expect(play(s)).toBe(true);
    expect(s.player.mana).toBe(5);
  });
});

describe('สาด', () => {
  it('สาดน้ำมนต์ใช้น้ำทั้งขัน ตีตามจำนวนน้ำ', () => {
    const s = fight({ hand: [c('holy_water_splash')], water: 6 });
    const hp = s.enemy!.hp;
    expect(play(s)).toBe(true);
    expect(s.player.mana).toBe(0);
    expect(hp - s.enemy!.hp).toBe(6 * c('holy_water_splash').splash!.dmg!);
  });

  it('ไม่มีน้ำ สาดไม่ได้', () => {
    const s = fight({ hand: [c('holy_water_splash')], water: 0 });
    expect(playBlock(s, s.piles.hand[0])).toBe('ไม่มีน้ำมนต์ให้สาด');
  });

  it('ม่านน้ำมนต์ได้เกราะต่อน้ำมนต์ · ปลุกเสก (สกิล) คูณสาดสองเท่า', () => {
    const s = fight({ hand: [c('water_curtain')], water: 4 });
    play(s);
    expect(s.player.block).toBe(12);
    const t = fight({ hand: [c('holy_water_splash')], water: 4 });
    t.fight!.nextSpellMult = 2;
    const hp = t.enemy!.hp;
    play(t);
    expect(hp - t.enemy!.hp).toBe(2 * 4 * c('holy_water_splash').splash!.dmg!);
  });

  it('ข้อความบอกว่าสาดทั้งขัน', () => {
    expect(describeCard(c('holy_water_splash'))).toContain('สาดน้ำมนต์ทั้งขัน');
    expect(costLabel(c('holy_water_splash'))).toBe('สาดทั้งขัน');
    expect(costLabel(c('flowing_chant'))).toBe('4 น้ำมนต์');
  });
});

describe('ยันต์และผนึก', () => {
  it('ยันต์ครบ 5 ผนึกการ์ดที่ผีถือ ใบที่ชาร์จมากที่สุด แล้วได้น้ำมนต์ 2', () => {
    const s = fight({ ghost: [STRIKE, GAPE], ages: [0, 2] });
    expect(sealTarget(s)).toBe(1);
    applyFx(s, { status: [yant(5)] }, { sourceId: 't' }, rng);
    expect(s.enemyPiles!.hand).toEqual([STRIKE]);
    expect(s.enemyPiles!.discard).toContain(GAPE);
    expect(yantOn(s)).toBe(0);
    expect(s.player.mana).toBe(WATER_RULES.sealWater);
  });

  it('ผีไม่ได้ถือการ์ด ผนึกแล้วผีมึนแทน', () => {
    const s = fight({ ghost: [] });
    applyFx(s, { status: [yant(5)] }, { sourceId: 't' }, rng);
    expect(s.enemy!.statusEffects!.some(e => e.id === 'stun')).toBe(true);
  });

  it('ยันต์ 4 ยังไม่ผนึก · เข็มปักใบถัดไปทำให้ครบ', () => {
    const s = fight({ hand: [c('cursed_needle')], ghost: [STRIKE] });
    applyFx(s, { status: [yant(4)] }, { sourceId: 't' }, rng);
    expect(s.enemyPiles!.hand).toHaveLength(1);
    play(s);
    expect(s.enemyPiles!.hand).toHaveLength(0);
  });

  it('ปลุกยันต์ลุกไฟกินยันต์ทั้งหมด ตีต่อชั้น', () => {
    const s = fight({ hand: [c('yant_burst')], water: 2 });
    applyFx(s, { status: [yant(3)] }, { sourceId: 't' }, rng);
    const hp = s.enemy!.hp;
    play(s);
    expect(hp - s.enemy!.hp).toBe(3 * c('yant_burst').wakeYant!.dmg!);
    expect(yantOn(s)).toBe(0);
  });

  it('กะโหลกนางตานีทำงานทุกครั้งที่ผนึก', () => {
    const s = fight({ hand: [c('equipment_nang_tani_skull')], ghost: [STRIKE] });
    play(s);
    const hp = s.enemy!.hp;
    applyFx(s, { status: [yant(5)] }, { sourceId: 't' }, rng);
    expect(hp - s.enemy!.hp).toBe(8);
  });

  it('หม้อดินกักผีผนึกทันที', () => {
    const s = fight({ hand: [c('seal_jar')], water: 4, ghost: [STRIKE, GAPE], ages: [0, 1] });
    play(s);
    expect(s.enemyPiles!.hand).toEqual([STRIKE]);
  });
});

describe('สายสิญจน์', () => {
  it('ล้อมสายสิญจน์ ชาร์จการ์ดผีกลับเป็น 0', () => {
    const s = fight({ hand: [c('sai_sin')], ghost: [GAPE], ages: [2] });
    expect(enemyHandCharges(s)).toEqual([2]);
    play(s);
    expect(enemyHandCharges(s)).toEqual([0]);
    expect(s.player.block).toBe(5);
  });

  it('สายสิญจน์มัดมือ แปะยันต์เพิ่มถ้าผีกำลังชาร์จ', () => {
    const s = fight({ hand: [c('sai_sin_bind')], water: 2, ghost: [GAPE], ages: [1] });
    play(s);
    expect(yantOn(s)).toBe(3);
    const t = fight({ hand: [c('sai_sin_bind')], water: 2, ghost: [STRIKE] });
    play(t);
    expect(yantOn(t)).toBe(1);
  });
});

describe('ของต่ำ (เลือดแทนน้ำ)', () => {
  it('น้ำไม่พอ จ่ายเลือด 2 ต่อ 1 ที่ขาด', () => {
    const s = fight({ hand: [c('phi_tai_hong')], water: 1, hp: 50 });
    expect(play(s)).toBe(true);
    expect(s.player.mana).toBe(0);
    expect(s.player.hp).toBe(50 - 3 * WATER_RULES.bloodPerWater);
  });

  it('เลือดไม่พอจ่าย เล่นไม่ได้ · คาถาที่ไม่ใช่ของต่ำต้องมีน้ำพอ', () => {
    const s = fight({ hand: [c('black_magic')], water: 0, hp: 12 });
    expect(playBlock(s, s.piles.hand[0])).toBe('เลือดไม่พอจ่าย');
    const t = fight({ hand: [c('flowing_chant')], water: 1 });
    expect(playBlock(t, t.piles.hand[0])).toBe('น้ำมนต์ไม่พอ');
  });

  it('กรีดเลือดเซ่น เสียเลือด 3 ได้น้ำมนต์ 4 (ไม่ผ่านเกราะ)', () => {
    const s = fight({ hand: [c('blood_offering')], water: 0, hp: 30 });
    s.player.block = 10;
    play(s);
    expect(s.player.hp).toBe(27);
    expect(s.player.block).toBe(10);
    expect(s.player.mana).toBe(4);
  });
});

describe('ของเลี้ยง', () => {
  it('หุ่นพยนต์รับหมัดแทน · กุมารทองให้น้ำต้นเทิร์น · รักยมทำงานกับคาถาใบแรก', () => {
    expect(minionDef('hun_payon')!.passive!.guard).toBe(true);
    const s = fight({ hand: [c('rak_yom_call'), c('sprinkle'), c('sprinkle')], water: 5 });
    play(s);
    expect(s.minions!.map(m => m.id)).toEqual(['rak_yom']);
    const hp = s.enemy!.hp;
    play(s); play(s);
    expect(hp - s.enemy!.hp).toBe(3);
  });

  it('ข้าวปลาเลี้ยงผี ฟื้นของเลี้ยง', () => {
    const s = fight({ hand: [c('hun_payon_call'), c('spirit_feast')], playerAp: 2 } as any);
    s.player.ap = 2;
    play(s);
    s.minions![0].hp = 3;
    play(s);
    expect(s.minions![0].hp).toBe(9);
  });
});

describe('ข้อมูลการ์ดหมอผี', () => {
  const own = ALL_CARDS.filter(x => x.class === 'shaman' && !x.locked);
  it('การ์ดอาชีพครบ 52 ใบ (+1 ปลดล็อกจากสมุดบันทึก) ครอบคลุมทุกชนิด', () => {
    expect(own).toHaveLength(52);
    for (const t of ['attack', 'action', 'spell', 'mana', 'counter', 'equipment', 'prayer']) expect(own.some(x => x.type === t), t).toBe(true);
  });
  it('ทุกใบมีข้อความผล และคำว่ามานาไม่โผล่ในการ์ดหมอผี', () => {
    for (const x of ALL_CARDS.filter(x => x.class === 'shaman')) {
      const text = describeCard(x) + costLabel(x);
      expect(text.length, x.id).toBeGreaterThan(3);
      expect(text, x.id).not.toContain('มานา');
    }
  });
  it('ของเลี้ยงทุกตัวที่การ์ดเรียกมีอยู่จริง', () => {
    for (const x of ALL_CARDS.filter(x => x.class === 'shaman' && x.fx.summon)) expect(minionDef(x.fx.summon!), x.id).toBeDefined();
  });
});
