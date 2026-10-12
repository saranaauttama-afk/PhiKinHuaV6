// test/notfm-play.test.ts — playing cards under the NOTFM rules: costs, draws, prayers,
// counters, equipment, borrowing, passives, and a guard against endless turns.
import { describe, it, expect } from 'vitest';
import type { CardData, GameState } from '../src/core/types';
import { makeCombatState, attackCard } from './helpers';
import { makeRng } from '../src/core/rng';
import { applyCommand } from '../src/core/reducer';
import { beginPlayerFight, startPlayerTurn } from '../src/core/commands';
import { playCard, resolvePrayers, clearFightCards } from '../src/core/cards/play';
import { cardCost, playBlock, starFx } from '../src/core/cards/model';
import { applyHeldEffects } from '../src/core/cards/mechanics';
import { runTriggers } from '../src/core/cards/passives';
import { springTraps, tickTraps } from '../src/core/combat/traps';
import { dealDamage } from '../src/core/combat/damage';
import { applyStatusEffect } from '../src/core/statusEffectsRuntime';
import { ALL_CARDS, BLESSING_POOL, CURSE_CARDS, cardById } from '../src/core/pack';
import { CARD_RULES, PRAYER_MULT } from '../src/core/balance/notfm';

const rng = makeRng('notfm');
const card = (id: string, n = 0): CardData => ({ ...cardById(id)!, instanceId: `${id}#${n}` });
const play = (s: GameState, i = 0, wait = 1) => playCard(s, i, rng, wait).played;
const fight = (hand: CardData[], over: Parameters<typeof makeCombatState>[0] = {}) =>
  makeCombatState({ hand, enemyHp: 200, playerHp: 40, ...over }).state;

describe('ค่าร่าย', () => {
  it('การ์ดโจมตีฟรี ไม่ใช้แต้ม', () => {
    const s = fight([attackCard(6)], { playerAp: 0 });
    expect(play(s)).toBe(true);
    expect(s.enemy!.hp).toBe(194);
  });

  it('การ์ด action ใช้แต้ม แต้มไม่พอเล่นไม่ได้และไม่เสียอะไร', () => {
    const c: CardData = { id: 'act', name: 'act', type: 'action', ap: 2, fx: { block: 5 } };
    const s = fight([c, { ...c, instanceId: 'b' }], { playerAp: 3 });
    expect(play(s)).toBe(true);
    expect(s.player.ap).toBe(1);
    expect(playBlock(s, s.piles.hand[0])).toBe('แต้มไม่พอ');
    expect(play(s)).toBe(false);
    expect(s.piles.hand).toHaveLength(1);
    expect(s.player.block).toBe(5);
  });

  it('คาถาใช้มานา การ์ดมานาเติมมานา', () => {
    const spell: CardData = { id: 'sp', name: 'sp', type: 'spell', mana: 3, fx: { dmg: 10 } };
    const mana: CardData = { id: 'mn', name: 'mn', type: 'mana', fx: { mana: 3 } };
    const s = fight([spell, mana], { playerMana: 0 });
    expect(playBlock(s, s.piles.hand[0])).toBe('มานาไม่พอ');
    expect(play(s, 1)).toBe(true);
    expect(s.player.mana).toBe(3);
    expect(play(s, 0)).toBe(true);
    expect(s.player.mana).toBe(0);
    expect(s.enemy!.hp).toBe(190);
  });

  it('มานาสะสมข้ามเทิร์นในไฟต์ และกลับเป็นค่าตั้งต้นเมื่อเริ่มไฟต์ใหม่', () => {
    const s = fight([], { playerMana: 5 });
    s.classId = 'warrior';
    s.piles.draw = [attackCard(1), attackCard(1)];
    startPlayerTurn(s, rng);
    expect(s.player.mana).toBe(5);
    expect(s.player.ap).toBe(s.player.maxAp);
    s.player.startMana = 2;
    s.masterDeck = [attackCard(1)];
    beginPlayerFight(s, rng);
    expect(s.player.mana).toBe(2);
  });

  it('คำสาป (corruption) เพิ่มค่าร่ายของการ์ดที่มีราคา ไม่แตะการ์ดฟรี', () => {
    const s = fight([]);
    applyStatusEffect('player', s, 'corruption', 2, 1);
    expect(cardCost(s, { id: 'a', name: 'a', type: 'action', ap: 1, fx: {} })).toEqual({ ap: 2, mana: 0 });
    expect(cardCost(s, { id: 's', name: 's', type: 'spell', mana: 2, fx: {} })).toEqual({ ap: 0, mana: 3 });
    expect(cardCost(s, attackCard(3))).toEqual({ ap: 0, mana: 0 });
  });

  it('การ์ดคำสาปเล่นไม่ได้', () => {
    const s = fight([{ ...CURSE_CARDS[0], instanceId: 'c' }]);
    expect(play(s)).toBe(false);
    expect(s.piles.hand).toHaveLength(1);
  });
});

describe('การจั่ว', () => {
  it('เริ่มไฟต์จั่ว 4 แต่ละเทิร์นจั่ว 2', () => {
    const s = fight([]);
    s.masterDeck = Array.from({ length: 12 }, (_, i) => attackCard(1, { id: `a${i}` }));
    beginPlayerFight(s, rng);
    expect(s.piles.hand).toHaveLength(CARD_RULES.openingDraw);
    startPlayerTurn(s, rng);
    expect(s.piles.hand).toHaveLength(CARD_RULES.openingDraw + CARD_RULES.drawPerTurn);
  });

  it('มือเต็ม 7 แล้วหยุดจั่ว ไพ่ยังอยู่ในกองจั่ว', () => {
    const s = fight(Array.from({ length: 6 }, (_, i) => attackCard(1, { id: `h${i}` })));
    s.piles.draw = Array.from({ length: 5 }, (_, i) => attackCard(1, { id: `d${i}` }));
    startPlayerTurn(s, rng);
    expect(s.piles.hand).toHaveLength(CARD_RULES.handMax);
    expect(s.piles.draw).toHaveLength(4);
  });

  it('การ์ดเทิร์นละครั้งเล่นใบที่สองไม่ได้จนเทิร์นหน้า', () => {
    const s = fight([card('spirit_whisper', 1), card('spirit_whisper', 2)]);
    s.piles.draw = [attackCard(1), attackCard(1), attackCard(1)];
    expect(play(s)).toBe(true);
    expect(playBlock(s, s.piles.hand[0])).toBe('ใช้แล้วเทิร์นนี้');
    startPlayerTurn(s, rng);
    expect(playBlock(s, s.piles.hand[0])).toBeNull();
  });
});

describe('บทสวด', () => {
  it('รอ 1 เทิร์น ผล ×1 ตอนต้นเทิร์นถัดไป', () => {
    const s = fight([card('karma_returns')], { playerHp: 20 });
    expect(play(s, 0, 1)).toBe(true);
    expect(s.enemy!.hp).toBe(200);
    expect(s.prayers).toHaveLength(1);
    resolvePrayers(s, rng);
    expect(s.enemy!.hp).toBe(193);
    expect(s.player.hp).toBe(23);
    expect(s.prayers).toHaveLength(0);
    expect(s.piles.discard.map(c => c.id)).toContain('karma_returns');
  });

  it('รอ 3 เทิร์น ผล ×3 และยังไม่ทำงานก่อนครบ', () => {
    const s = fight([card('karma_returns')]);
    play(s, 0, 3);
    resolvePrayers(s, rng);
    resolvePrayers(s, rng);
    expect(s.enemy!.hp).toBe(200);
    resolvePrayers(s, rng);
    expect(s.enemy!.hp).toBe(200 - 7 * PRAYER_MULT[2]);
  });

  it('เลือกรอเกิน 3 ถูกปัดเป็น 3', () => {
    const s = fight([card('candle_vigil')]);
    play(s, 0, 9);
    expect(s.prayers![0].turnsLeft).toBe(3);
    expect(s.prayers![0].mult).toBe(3);
  });

  it('ทำงานผ่าน startPlayerTurn จริง', () => {
    const s = fight([card('candle_vigil')]);
    play(s, 0, 1);
    startPlayerTurn(s, rng);
    expect(s.player.block).toBe(5);
  });
});

describe('การ์ดตอบโต้', () => {
  it('วางแล้วไม่เกิดผลทันที ทำงานเมื่อผีโจมตี แล้วหายไป', () => {
    const s = fight([card('mirror_ward')]);
    play(s);
    expect(s.enemy!.hp).toBe(200);
    expect(s.traps).toHaveLength(1);
    expect(s.piles.discard).toHaveLength(0);
    expect(springTraps(s, 'skill').sprung).toEqual([]);
    const out = springTraps(s, 'attack');
    expect(out.negated).toBe(true);
    expect(s.enemy!.hp).toBe(192);
    expect(s.traps).toHaveLength(0);
  });

  it('ตอบโต้ที่มีอายุสลายเองเมื่อหมดเวลา', () => {
    const s = fight([card('sacred_thread')]);
    play(s);
    tickTraps(s);
    expect(s.traps).toHaveLength(1);
    tickTraps(s);
    expect(s.traps).toHaveLength(0);
  });
});

describe('อุปกรณ์', () => {
  it('สวมแล้วผลติดตัวทำงาน ใส่ชิ้นใหม่ชิ้นเก่าถอดลงกองทิ้ง', () => {
    const s = fight([card('equipment_prayer_beads'), card('equipment_iron_bracer'), attackCard(5)]);
    play(s, 0);
    expect(s.equipped!.map(c => c.id)).toEqual(['equipment_prayer_beads']);
    play(s, 1);
    expect(s.enemy!.hp).toBe(194);
    play(s, 0);
    expect(s.equipped!.map(c => c.id)).toEqual(['equipment_iron_bracer']);
    expect(s.piles.discard.map(c => c.id)).toContain('equipment_prayer_beads');
    runTriggers(s, 'turnStart', rng);
    expect(s.player.block).toBe(3);
  });

  it('เมื่อสวมทำงานครั้งเดียวตอนสวม', () => {
    const s = fight([card('equipment_war_drum')]);
    play(s);
    expect(s.player.statusEffects?.find(e => e.id === 'strength')?.stacks).toBe(2);
  });

  it('เกราะลดดาเมจผีต่อครั้ง', () => {
    const s = fight([card('equipment_luang_pu_amulet')]);
    play(s);
    const hp = s.player.hp;
    dealDamage(s, { from: 'enemy', to: 'player', raw: 5, source: { kind: 'card', cardId: 'claw' } } as any);
    expect(s.player.hp).toBe(hp - 4);
  });

  it('ช่องอุปกรณ์เพิ่มได้ จบไฟต์ล้างหมด', () => {
    const s = fight([card('equipment_prayer_beads'), card('equipment_iron_bracer')]);
    s.equipmentSlotsMax = 2;
    play(s); play(s);
    expect(s.equipped).toHaveLength(2);
    clearFightCards(s);
    expect(s.equipped).toEqual([]);
  });
});

describe('ยืมการ์ดผี', () => {
  it('ผียังไม่เล่นอะไร ยืมไม่ได้', () => {
    const s = fight([card('borrow_breath')]);
    s.cardHistory = []; s.enemyLastPlayed = [];
    expect(playBlock(s, s.piles.hand[0])).toBe('ผียังไม่ได้เล่นการ์ด');
  });

  it('ได้สำเนาฟรีเข้ามือ ใช้แล้วนำออก ไม่เข้าสำรับ', () => {
    const s = fight([card('borrow_breath')]);
    s.cardHistory = []; s.enemyLastPlayed = ['claw'];
    const deck = s.masterDeck.length;
    expect(play(s)).toBe(true);
    const borrowed = s.piles.hand.find(c => c.borrowed)!;
    expect(borrowed).toBeDefined();
    expect(cardCost(s, borrowed)).toEqual({ ap: 0, mana: 0 });
    const hp = s.enemy!.hp;
    expect(play(s, s.piles.hand.indexOf(borrowed))).toBe(true);
    expect(s.enemy!.hp).toBeLessThan(hp);
    expect(s.piles.exhaust.some(c => c.borrowed)).toBe(true);
    expect(s.masterDeck.length).toBe(deck);
  });
});

describe('เงื่อนไข ค้างมือ และหลายหมัด', () => {
  it('เงื่อนไขเข้าได้ของแถม ไม่เข้าได้ค่าพื้นฐาน', () => {
    const a = fight([card('ward_riposte')]);
    play(a);
    expect(a.enemy!.hp).toBe(195);
    const b = fight([card('ward_riposte')], { playerBlock: 6 });
    play(b);
    expect(b.enemy!.hp).toBe(188);
  });

  it('ค้างมือท้ายเทิร์นได้เกราะ', () => {
    const s = fight([card('yantra_in_hand'), card('yantra_in_hand', 2)]);
    applyHeldEffects(s);
    expect(s.player.block).toBe(6);
  });

  it('หลายหมัดกินเกราะทีละหมัด', () => {
    const s = fight([attackCard(4, { fx: { dmg: 4, hits: 3 } })], { enemyBlock: 5 });
    play(s);
    expect(s.enemy!.block).toBe(0);
    expect(s.enemy!.hp).toBe(200 - 7);
  });
});

describe('พร', () => {
  it('พรต้นเทิร์นและพรตอนเล่นการ์ดทำงาน', () => {
    const s = fight([attackCard(3)]);
    s.blessings = [BLESSING_POOL.find(b => b.id === 'meditation_peace')!, BLESSING_POOL.find(b => b.id === 'ghost_protection')!];
    play(s);
    expect(s.player.block).toBe(1);
    startPlayerTurn(s, rng);
    expect(s.player.block).toBe(3);
  });

  it('พร once:turn ทำงานครั้งเดียวต่อเทิร์น', () => {
    const s = fight([attackCard(1), attackCard(1)], { playerHp: 20 });
    s.blessings = [BLESSING_POOL.find(b => b.id === 'life_steal_spirit')!];
    play(s); play(s);
    expect(s.player.hp).toBe(22);
  });
});

describe('กันเทิร์นไม่รู้จบ', () => {
  const engines = ALL_CARDS.filter(c => {
    const f = starFx(c), b = c.conditional?.bonus ?? {};
    return [f.draw, f.mana, f.ap, f.borrow, b.draw, b.mana, b.ap].some(n => (n ?? 0) > 0);
  });

  it('มีการ์ดเครื่องยนต์ให้ทดสอบ', () => expect(engines.length).toBeGreaterThan(5));

  it('การ์ดเครื่องยนต์ทุกคู่ (ดาว 3) เล่นจนหมดแล้วเทิร์นจบเอง', () => {
    for (let i = 0; i < engines.length; i++) for (let j = i; j < engines.length; j++) {
      const pair = [engines[i], engines[j]].map(c => ({ ...c, star: 3 }));
      const deck = Array.from({ length: 12 }, (_, k) => ({ ...pair[k % 2], instanceId: `e${k}` }));
      const s = fight(deck.slice(0, 4), { playerMana: 0, playerAp: CARD_RULES.apPerTurn, enemyHp: 100000 });
      s.piles.draw = deck.slice(4);
      s.cardHistory = []; s.enemyLastPlayed = ['claw'];
      let plays = 0;
      for (;;) {
        const idx = s.piles.hand.findIndex(c => !playBlock(s, c));
        if (idx < 0) break;
        playCard(s, idx, rng, 1);
        if (++plays > 60) break;
      }
      expect(plays, `${pair[0].id} + ${pair[1].id}`).toBeLessThanOrEqual(60);
    }
  });

  it('ไฟต์จริงผ่าน reducer จบตาได้', () => {
    const s = fight([attackCard(3)]);
    const out = applyCommand(s, { type: 'EndTurn' }, rng).state;
    expect(out.phase).toBe('combat');
  });
});
