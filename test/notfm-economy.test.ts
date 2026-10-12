// test/notfm-economy.test.ts — phase 6: shop boons, flat service prices, blessing stop, difficulty 1–5.
import { describe, it, expect } from 'vitest';
import { baseNewState } from '../src/core/commands';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { Difficulty } from '../src/core/campaign/threeNight';
import { DIFFICULTY_RULES, campaignBoss } from '../src/core/campaign/threeNight';
import { BOONS, DIFFICULTY, ECONOMY, ENEMY_HP } from '../src/core/balance/notfm';
import { START_GOLD } from '../src/core/balance';
import { configureNightEnemy, rageActive } from '../src/core/campaign/nights';
import { boonBlock, markedUp, removePrice, upgradePrice, wellHeal, shrineCost, healAmount } from '../src/core/engine/handlers/shops_events';

function run(difficulty: Difficulty = 1, seed = 'eco') {
  let s = baseNewState(seed), r = makeRng(seed);
  const go = (c: Command) => { ({ state: s, rng: r } = applyCommand(s, c, r)); };
  go({ type: 'NewRun', seed, classId: 'warrior', difficulty }); go({ type: 'SkipChapter' }); go({ type: 'ChooseStarterBlessing', index: 0 });
  return { go, get s() { return s; } };
}
/** Open the night's stop of `kind` straight from the adventure deck. */
function openStop(d: ReturnType<typeof run>, kind: string) {
  const s = d.s, a = s.pages!.adventure!, entry = a.deck.find(e => e.offer.kind === kind)!;
  s.pages!.current!.offers[0] = entry.offer; s.pages!.current!.resolved[0] = false; a.slotIds[0] = entry.id;
  d.go({ type: 'ChooseOffer', index: 0 });
  expect(d.s.phase).toBe('shop');
}

describe('เศรษฐกิจ', () => {
  it('ทองเริ่ม 50', () => {
    expect(START_GOLD).toBe(ECONOMY.startGold);
    expect(run().s.player.gold).toBe(ECONOMY.startGold);
  });

  it('ร้านขายการ์ด 4 ใบกับอุปกรณ์ 1 ชิ้น', () => {
    const d = run(); openStop(d, 'shop_card');
    const stock = d.s.shopStock!.map(i => ('card' in i ? i.card : undefined)!);
    expect(stock.filter(c => c.type === 'equipment')).toHaveLength(ECONOMY.shopStock.equipment);
    expect(stock).toHaveLength(ECONOMY.shopStock.cards + ECONOMY.shopStock.equipment);
  });

  it('พลังถาวรได้ผลตามที่เขียน', () => {
    const d = run(); openStop(d, 'shop_card');
    d.s.player.gold = 999;
    const { maxHp, maxAp, drawPerTurn } = d.s.player, slots = d.s.equipmentSlotsMax!;
    for (const id of ['maxHp', 'ap', 'slot', 'draw'] as const) d.go({ type: 'ShopBuyBoon', id });
    expect(d.s.player.maxHp).toBe(maxHp + 10);
    expect(d.s.player.maxAp).toBe(maxAp + 1);
    expect(d.s.equipmentSlotsMax).toBe(slots + 1);
    expect(d.s.player.drawPerTurn).toBe(drawPerTurn + 1);
    expect(d.s.player.gold).toBe(999 - Object.values(BOONS).reduce((n, b) => n + b.price, 0));
  });

  it('ชีวิตกับช่องอุปกรณ์ซื้อได้คืนละครั้ง แต้มกับจั่วซื้อได้ครั้งเดียวทั้งรอบ', () => {
    const d = run(); openStop(d, 'shop_card');
    d.s.player.gold = 999;
    for (const id of ['maxHp', 'ap', 'slot', 'draw'] as const) d.go({ type: 'ShopBuyBoon', id });
    const gold = d.s.player.gold, ap = d.s.player.maxAp;
    d.go({ type: 'ShopBuyBoon', id: 'ap' });
    expect(d.s.player.maxAp).toBe(ap);
    expect(d.s.player.gold).toBe(gold);
    expect(boonBlock(d.s, 'slot')).toBe('คืนนี้ซื้อแล้ว');
    expect(boonBlock(d.s, 'maxHp')).toBe('คืนนี้ซื้อแล้ว');
    d.s.campaign!.night = 2;
    expect(boonBlock(d.s, 'slot')).toBeUndefined();
    expect(boonBlock(d.s, 'maxHp')).toBeUndefined();
    expect(boonBlock(d.s, 'ap')).toBe('ซื้อไปแล้ว');
    expect(boonBlock(d.s, 'draw')).toBe('ซื้อไปแล้ว');
  });

  it('ซื้อพลังถาวรได้แค่ในร้านค้า', () => {
    const d = run(); openStop(d, 'shop_upgrade');
    d.s.player.gold = 999;
    d.go({ type: 'ShopBuyBoon', id: 'ap' });
    expect(d.s.player.gold).toBe(999);
  });

  it('ปลุกเสกกับสละการ์ด: ใบแรกที่แต่ละจุดฟรี ใบต่อไป 40', () => {
    const d = run(); openStop(d, 'shop_upgrade');
    expect(upgradePrice(d.s)).toBe(0);
    d.go({ type: 'ShopUpgradeBuy', index: 0 });
    expect(upgradePrice(d.s)).toBe(ECONOMY.upgradePrice);
    const e = run(); openStop(e, 'shop_remove');
    expect(removePrice(e.s)).toBe(0);
    e.go({ type: 'ShopRemoveBuy', index: 0 });
    expect(removePrice(e.s)).toBe(ECONOMY.removePrice);
  });

  it('ศาลพร: เลือก 1 จาก 3 แล้วหมด', () => {
    const d = run(); openStop(d, 'blessing');
    expect(d.s.blessingStock).toHaveLength(ECONOMY.blessingChoices);
    const pick = d.s.blessingStock![1], before = d.s.blessings.length;
    d.go({ type: 'TakeShopBlessing', index: 1 });
    expect(d.s.blessings.map(b => b.id)).toContain(pick.id);
    expect(d.s.blessings).toHaveLength(before + 1);
    expect(d.s.blessingStock).toEqual([]);
    d.go({ type: 'TakeShopBlessing', index: 0 });
    expect(d.s.blessings).toHaveLength(before + 1);
  });

  it('ทองจากผีชั้นสูงและบอสตามตาราง', () => {
    expect(ECONOMY.gold.elite).toBeGreaterThan(0);
    expect(ECONOMY.gold.boss).toBeGreaterThan(ECONOMY.gold.elite);
  });
});

describe('ระดับความยาก', () => {
  const enemyHp = (difficulty: Difficulty) => {
    const s = run(difficulty).s as GameState;
    s.enemy = { id: 'phi-krasue', name: 'x', hp: 1, maxHp: 1, block: 0 } as any;
    configureNightEnemy(s);
    return s.enemy!.hp;
  };

  it('มี 5 ระดับ แต่ละระดับมีคำอธิบาย', () => {
    expect(DIFFICULTY_RULES.map(r => r.level)).toEqual([1, 2, 3, 4, 5]);
  });

  it('ระดับ 2 ขึ้นไป เลือดผี +10% และไม่มีแข็งแกร่งหรือเกราะเพิ่ม', () => {
    expect(enemyHp(2)).toBe(Math.round(enemyHp(1) * (1 + DIFFICULTY.hpPct / 100)));
    expect(enemyHp(5)).toBe(enemyHp(2));
    const s = run(5).s as GameState;
    s.enemy = { id: 'phi-krasue', name: 'x', hp: 1, maxHp: 1, block: 0 } as any;
    configureNightEnemy(s);
    expect(s.enemy!.block).toBe(0);
    expect((s.enemy!.statusEffects ?? []).some(e => e.id === 'strength')).toBe(false);
    expect(ENEMY_HP).not.toHaveProperty('perDifficulty');
  });

  it('ระดับ 3 ขึ้นไป ผีโกรธตั้งแต่คืนแรก', () => {
    expect(rageActive(run(2).s)).toBe(false);
    expect(rageActive(run(3).s)).toBe(true);
  });

  it('ระดับ 4 ขึ้นไป ของแพงขึ้น 25% และบ่อน้ำกับศาลฟื้นครึ่งเดียว', () => {
    const low = run(3).s, high = run(4).s;
    expect(markedUp(low, 40)).toBe(40);
    expect(markedUp(high, 40)).toBe(50);
    expect(wellHeal(low)).toBe(ECONOMY.well.heal);
    expect(wellHeal(high)).toBe(Math.ceil(ECONOMY.well.heal / 2));
    expect(healAmount(high, 30)).toBe(15);
    expect(shrineCost(high)).toBe(Math.ceil(ECONOMY.shrine.price * 1.25));
    const d = run(4); openStop(d, 'shop_card'); d.s.player.gold = 999;
    d.go({ type: 'ShopBuyBoon', id: 'ap' });
    expect(d.s.player.gold).toBe(999 - Math.ceil(BOONS.ap.price * 1.25));
  });

  it('ระดับ 5 คืนที่ 3 จั่วต่อเทิร์นน้อยลง 1', () => {
    for (const difficulty of [4, 5] as const) {
      const d = run(difficulty, 'draw-cut-' + difficulty);
      const draw = d.s.player.drawPerTurn;
      // Clear nights 1 and 2 by forcing each night's boss.
      for (let night = 1; night <= 2; night++) {
        const s = d.s, a = s.pages!.adventure!;
        a.boss = 'night';
        s.pages!.current!.offers[0] = { kind: 'boss', bossType: 'final', enemyId: campaignBoss(s).id };
        s.pages!.current!.resolved[0] = false; a.slotIds[0] = 'night-boss';
        d.go({ type: 'ChooseOffer', index: 0 });
        if (d.s.chapter) d.go({ type: 'SkipChapter' });
        d.s.enemy!.hp = 0;
        d.go({ type: 'EndTurn' } as any);
        for (let i = 0; i < 6 && d.s.phase !== 'victory'; i++) {
          if (d.s.phase === 'talk') d.go({ type: 'AnswerGhostTalk', choice: 'leave' });
          else if (d.s.phase === 'levelup') d.go({ type: 'SkipLevelUp' });
          else if (d.s.phase === 'reward') d.go({ type: 'SkipCardReward' });
        }
        d.go({ type: 'CompleteNode' });
        if (d.s.chapter) d.go({ type: 'SkipChapter' });
      }
      expect(d.s.campaign!.night).toBe(3);
      expect(d.s.player.drawPerTurn).toBe(difficulty >= DIFFICULTY.drawCutFrom ? draw - 1 : draw);
    }
  });
});
