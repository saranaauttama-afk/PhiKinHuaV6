// test/notfm-classes.test.ts — class passives and the 12 class skills.
import { describe, it, expect } from 'vitest';
import type { CardData, GameState } from '../src/core/types';
import type { ClassId } from '../src/core/classes';
import { makeCombatState, attackCard, runEnemyCards } from './helpers';
import { makeRng } from '../src/core/rng';
import { applyCommand } from '../src/core/reducer';
import { beginPlayerFight } from '../src/core/commands';
import { playCard, resolvePrayers } from '../src/core/cards/play';
import { cardCost } from '../src/core/cards/model';
import { SKILLS, skillBlock, skillsFor, initSkills, skillParam } from '../src/core/skills';
import { CLASS_PASSIVES } from '../src/core/balance/notfm';
import { CHARACTER_CLASSES, ALL_CLASS_IDS } from '../src/core/classes';
import { cardById } from '../src/core/pack';
import { describeCard } from '../src/core/cards/describe';

const rng = makeRng('cls');
const HIT6 = 'pisaj_fai_v29_signature';

/** A fight as `classId`, skills ready, on turn 1. */
function fight(classId: ClassId, hand: CardData[] = [], over: Parameters<typeof makeCombatState>[0] = {}): GameState {
  const { state: s } = makeCombatState({ hand, enemyHp: 200, playerHp: 40, ...over });
  s.classId = classId;
  s.player.maxHp = 60;
  initSkills(s);
  s.fight = { hpLost: 0, ghostTurns: 0 };
  s.turn = 1;
  return s;
}
const use = (s: GameState, id: string, index?: number) => applyCommand(s, { type: 'UseSkill', id, index }, rng).state;

describe('ข้อมูลสกิล', () => {
  it('ทุกอาชีพมีสกิลครบช่อง A B C', () => {
    for (const id of ALL_CLASS_IDS) expect(skillsFor(id).map(d => d.slot)).toEqual(['A', 'B', 'C']);
    expect(SKILLS).toHaveLength(12);
  });

  it('ทุกสกิลมีชื่อ คำอธิบาย และพักอย่างน้อย 1 ไฟต์', () => {
    for (const d of SKILLS) {
      expect(d.name.length, d.id).toBeGreaterThan(0);
      expect(d.text.length, d.id).toBeGreaterThan(0);
      expect(d.cd, d.id).toBeGreaterThanOrEqual(1);
    }
  });

  it('คำอธิบาย passive สร้างจากตัวเลข ไม่มี undefined', () => {
    for (const id of ALL_CLASS_IDS) expect(CHARACTER_CLASSES[id].passiveDesc, id).toMatch(/\S/);
    for (const id of ALL_CLASS_IDS) expect(CHARACTER_CLASSES[id].passiveDesc, id).not.toMatch(/undefined|NaN/);
  });
});

describe('กฎพักสกิล', () => {
  it('ใช้แล้วพักตามจำนวนไฟต์ นับลดทุกไฟต์ที่เข้า และพร้อมแล้วไม่สะสม', () => {
    let s = fight('nun');
    s = use(s, 'metta');
    expect(s.skills!.metta).toBe(skillsFor('nun')[1].cd);
    s.masterDeck = [attackCard(1)];
    beginPlayerFight(s, rng);
    expect(s.skills!.metta).toBe(skillsFor('nun')[1].cd - 1);
    for (let i = 0; i < 5; i++) beginPlayerFight(s, rng);
    expect(s.skills!.metta).toBe(0);
  });

  it('สกิล B/C ใช้ได้เทิร์นละหนึ่ง', () => {
    let s = fight('shaman');
    s = use(s, 'composure');
    expect(skillBlock(s, 'consecrate')).toBe('ใช้สกิลแล้วเทิร์นนี้');
    s.turn = 2;
    expect(skillBlock(s, 'consecrate')).toBeNull();
  });

  it('สกิล A ใช้บนแผนที่เท่านั้น · สกิล B/C ใช้ในไฟต์เท่านั้น', () => {
    const s = fight('shaman');
    expect(skillBlock(s, 'bargain')).toBe('ใช้บนแผนที่');
    s.phase = 'map';
    expect(skillBlock(s, 'bargain')).toBeNull();
    expect(skillBlock(s, 'composure')).toBe('ใช้ในไฟต์');
  });

  it('อาชีพอื่นใช้สกิลที่ไม่ใช่ของตัวเองไม่ได้', () => {
    expect(skillBlock(fight('warrior'), 'metta')).toBe('ไม่มีสกิลนี้');
  });
});

describe('passive ประจำอาชีพ', () => {
  it('นักมวยคาดเชือก: passive จังหวะ (รายละเอียดใน test/nak-muay.test.ts)', () => {
    expect(CLASS_PASSIVES.warrior.rhythm).toBe(true);
  });

  it('หมอผี: คาถาใบแรกของเทิร์นลดมานา ใบที่สองราคาเต็ม', () => {
    const spell: CardData = { id: 'sp', name: 'sp', type: 'spell', mana: 3, fx: { dmg: 4 } };
    const s = fight('shaman', [spell, { ...spell, instanceId: 'b' }], { playerMana: 10 });
    expect(cardCost(s, s.piles.hand[0]).mana).toBe(3 - CLASS_PASSIVES.shaman.spellDiscount!);
    playCard(s, 0, rng);
    expect(s.player.mana).toBe(10 - 2);
    expect(cardCost(s, s.piles.hand[0]).mana).toBe(3);
  });

  it('แม่ชี: บทสวดสำเร็จแล้วฟื้นเลือด', () => {
    const s = fight('nun', [{ ...cardById('candle_vigil')!, instanceId: 'p' }], { playerHp: 30 });
    playCard(s, 0, rng, 1);
    resolvePrayers(s, rng);
    expect(s.player.hp).toBe(30 + CLASS_PASSIVES.nun.triggers[0].fx.heal!);
  });

  it('คนทรง: การ์ดผีใบแรกที่เปิดในไฟต์ได้สำเนาเข้ามือ ครั้งเดียว', () => {
    const s = fight('medium', [], { playerHp: 60 });
    const a = runEnemyCards(s, [HIT6, HIT6]);
    const copies = a.piles.hand.filter(c => c.borrowed);
    expect(copies).toHaveLength(1);
    expect(copies[0].exhaust).toBe(true);
    const b = runEnemyCards(a, [HIT6]);
    expect(b.piles.hand.filter(c => c.borrowed)).toHaveLength(1);
  });

  it('passive เก่าหายไปแล้ว: ไม่มีเกราะฟรีตอนเริ่มไฟต์', () => {
    for (const id of ['warrior', 'medium'] as ClassId[]) {
      const s = fight(id);
      s.masterDeck = [attackCard(1)];
      s.player.block = 0;
      beginPlayerFight(s, rng);
      expect(s.player.block, id).toBe(0);
    }
  });
});

describe('สกิลนักรบ', () => {
  it('ลงยันต์อาวุธ: การ์ดที่เลือกได้ดาวเพิ่ม', () => {
    const s = fight('warrior');
    s.phase = 'map'; s.masterDeck = [attackCard(6), attackCard(6, { id: 'b' })];
    const out = use(s, 'rune_weapon', 1);
    expect(out.masterDeck[1].star).toBe(2);
    expect(out.masterDeck[0].star).toBeUndefined();
  });

  it('ครูสอนมวย: การ์ดใบถัดไปได้สำเนา สำเนาใช้แล้วนำออกและไม่ถูกคัดลอกซ้ำ', () => {
    let s = fight('warrior', [attackCard(5)]);
    s = use(s, 'muay_teacher');
    s = applyCommand(s, { type: 'PlayCard', index: 0 }, rng).state;
    const copy = s.piles.hand.find(c => c.copied)!;
    expect(copy).toBeDefined();
    expect(copy.exhaust).toBe(true);
    s = applyCommand(s, { type: 'PlayCard', index: s.piles.hand.indexOf(copy) }, rng).state;
    expect(s.piles.hand.some(c => c.copied)).toBe(false);
    expect(s.piles.exhaust.some(c => c.copied)).toBe(true);
  });

  it('ใจเพชร: ได้เกราะเท่าเลือดที่เสียไปในไฟต์', () => {
    let s = fight('warrior', [], { playerHp: 50 });
    s = runEnemyCards(s, [HIT6]);
    const lost = s.fight!.hpLost;
    expect(lost).toBe(6);
    s.turn = 2; s.player.block = 0;
    s = use(s, 'diamond_heart');
    expect(s.player.block).toBe(lost);
  });
});

describe('สกิลหมอผี', () => {
  it('ต่อรองเจ้าที่: ของชิ้นถัดไปในร้านลดราคา แล้วกลับเป็นราคาเต็ม', () => {
    let s = fight('shaman');
    s.phase = 'map';
    s = use(s, 'bargain');
    expect(s.shopPricePct).toBe(skillParam('bargain', 'pricePct'));
    s.phase = 'shop'; s.shopKind = 'card'; s.player.gold = 100;
    s.shopStock = [{ card: attackCard(5), price: 60 } as any, { card: attackCard(5), price: 60 } as any];
    s = applyCommand(s, { type: 'TakeShop', index: 0 }, rng).state;
    expect(s.player.gold).toBe(70);
    s = applyCommand(s, { type: 'TakeShop', index: 0 }, rng).state;
    expect(s.player.gold).toBe(10);
  });

  it('สำรวมจิต: คาถาครึ่งราคาเทิร์นนี้ และรับดาเมจผีครึ่งเดียว', () => {
    const spell: CardData = { id: 'sp', name: 'sp', type: 'spell', mana: 4, fx: { dmg: 4 } };
    let s = fight('shaman', [spell, { ...spell, instanceId: 'b' }], { playerMana: 10, playerHp: 50 });
    s = use(s, 'composure');
    s = applyCommand(s, { type: 'PlayCard', index: 0 }, rng).state;
    expect(s.player.mana).toBe(10 - 2);
    expect(cardCost(s, s.piles.hand[0]).mana).toBe(2);
    s = runEnemyCards(s, [HIT6]);
    expect(s.player.hp).toBe(50 - 3);
  });

  it('ปลุกเสก: จั่ว 2 และคาถาใบถัดไปได้ผลสองเท่า', () => {
    const spell: CardData = { id: 'sp', name: 'sp', type: 'spell', mana: 1, fx: { dmg: 5 } };
    let s = fight('shaman', [spell], { playerMana: 5 });
    s.piles.draw = [attackCard(1), attackCard(1), attackCard(1)];
    s = use(s, 'consecrate');
    expect(s.piles.hand).toHaveLength(3);
    s = applyCommand(s, { type: 'PlayCard', index: 0 }, rng).state;
    expect(s.enemy!.hp).toBe(200 - 10);
    expect(s.fight!.nextSpellMult).toBeUndefined();
  });
});

describe('สกิลแม่ชี', () => {
  it('อธิษฐาน: การ์ดที่เลือกกลายเป็นการ์ดแม่ชี', () => {
    const s = fight('nun');
    s.phase = 'map'; s.masterDeck = [attackCard(1, { id: 'junk', name: 'ขยะ' }), attackCard(1)];
    const out = use(s, 'pray_change', 0);
    expect(out.masterDeck[0].class).toBe('nun');
    expect(out.masterDeck).toHaveLength(2);
  });

  it('แผ่เมตตา: ฟื้นเลือดครึ่งหนึ่งของดาเมจที่ทำ', () => {
    let s = fight('nun', [attackCard(10)], { playerHp: 30 });
    s = use(s, 'metta');
    s = applyCommand(s, { type: 'PlayCard', index: 0 }, rng).state;
    expect(s.player.hp).toBe(35);
  });

  it('เข้าสมาธิ: บทสวดนับรอบทันที และได้เทิร์นเพิ่มที่ผีไม่เล่น · โกรธไม่เพิ่ม', () => {
    let s = fight('nun', [{ ...cardById('karma_returns')!, instanceId: 'k' }], { playerHp: 50 });
    s.campaign = { night: 2, difficulty: 1, completedNights: 1, unlocks: [] };
    s = applyCommand(s, { type: 'PlayCard', index: 0, wait: 1 }, rng).state;
    s = use(s, 'samadhi');
    expect(s.enemy!.hp).toBe(200 - 7);
    s.enemyPiles = { draw: [], hand: [HIT6], discard: [] };
    s.enemyHandAges = [0];
    s = applyCommand(s, { type: 'ResolveEnemyTurn' }, rng).state;
    expect(s.player.hp).toBe(50 + 3 + CLASS_PASSIVES.nun.triggers[0].fx.heal!); // prayer heal + nun passive, no ghost hit
    expect(s.fight!.ghostTurns).toBe(0);
    expect(s.enemy!.statusEffects?.some(e => e.id === 'rage') ?? false).toBe(false);
  });
});

describe('สกิลคนทรง', () => {
  it('ถามบรรพบุรุษ: เลือกชีวิตสูงสุดหรือมานาเริ่มไฟต์ถาวร', () => {
    const s = fight('medium');
    s.phase = 'map';
    const hp = use(s, 'ask_ancestors', 0);
    expect(hp.player.maxHp).toBe(s.player.maxHp + skillParam('ask_ancestors', 'maxHp'));
    const mana = use(s, 'ask_ancestors', 1);
    expect(mana.player.startMana).toBe(s.player.startMana + skillParam('ask_ancestors', 'startMana'));
  });

  it('ยืมแรงผี: เสียเลือด 2 จั่ว 2 · เลือดไม่พอใช้ไม่ได้', () => {
    let s = fight('medium', [], { playerHp: 30 });
    s.piles.draw = [attackCard(1), attackCard(1)];
    s = use(s, 'ghost_strength');
    expect(s.player.hp).toBe(28);
    expect(s.piles.hand).toHaveLength(2);
    const low = fight('medium', [], { playerHp: 2 });
    expect(skillBlock(low, 'ghost_strength')).toBe('เลือดไม่พอ');
  });

  it('ประทับทรง: เล่นสำเนาการ์ดผีจากประวัติฟรี แล้วพิษบนผีทำงานทันที', () => {
    let s = fight('medium');
    s.cardHistory = []; s.enemyLastPlayed = [HIT6];
    s.enemy!.statusEffects = [{ id: 'poison', name: 'พิษ', description: '', duration: 3, stacks: 3 }];
    s = use(s, 'possession', 0);
    expect(s.enemy!.hp).toBe(200 - 6 - 3);
    expect(describeCard(cardById('borrow_breath')!)).toContain('ยืม');
  });
});
