// test/notfm-economy.test.ts — service budget, blessing stop, difficulty 1–5.
import { describe, it, expect } from 'vitest';
import { baseNewState } from '../src/core/commands';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import type { Difficulty } from '../src/core/campaign/threeNight';
import { DIFFICULTY_RULES, campaignBoss } from '../src/core/campaign/threeNight';
import { DIFFICULTY, ECONOMY, ENEMY_HP } from '../src/core/balance/notfm';
import {PROGRESSION_SERVICES} from '../src/core/balance/deckProgression';
import { START_GOLD } from '../src/core/balance';
import { configureNightEnemy, rageActive } from '../src/core/campaign/nights';
import { markedUp, removePrice, upgradePrice, wellHeal, shrineCost, healAmount } from '../src/core/engine/handlers/shops_events';

function run(difficulty: Difficulty = 1, seed = 'eco') {
  let s = baseNewState(seed), r = makeRng(seed);
  const go = (c: Command) => { ({ state: s, rng: r } = applyCommand(s, c, r)); };
  go({ type: 'NewRun', seed, classId: 'warrior', difficulty }); go({ type: 'SkipChapter' }); go({ type: 'ChooseStarterBlessing', index: Math.max(0,s.starter!.choices.findIndex(b=>!b.onGain)) });
  return { go, get s() { return s; } };
}
/** Position a later service for an isolated shop transaction test. */
function openStop(d: ReturnType<typeof run>, kind: string) {
  const s = d.s, a = s.pages!.adventure!, entry = a.deck.find(e => e.offer.kind === kind)!;
  // These tests isolate the shop; the real board gate is covered separately.
  s.pages!.current!.offers[0] = { ...entry.offer, availableAfterWins: 0 }; s.pages!.current!.resolved[0] = false; a.slotIds[0] = entry.id;
  d.go({ type: 'ChooseOffer', index: 0 });
  expect(d.s.phase).toBe('shop');
}

describe('เศรษฐกิจ', () => {
  it('ทองเริ่ม 50', () => {
    expect(START_GOLD).toBe(ECONOMY.startGold);
    expect(run().s.player.gold).toBe(ECONOMY.startGold);
  });

  it('ร้านมีสี่ช่องพัฒนาสายและไม่ขาย starter', () => {
    const d = run(); openStop(d, 'shop_card');
    const stock = d.s.shopStock!.map(i => ('card' in i ? i.card : undefined)!);
    expect(stock).toHaveLength(4);
    expect(stock.every(c => !c.progressionRole)).toBe(true);
  });

  it('ร้านไม่ขายพลังถาวรแล้ว (ย้ายไปเป็นรางวัลเลเวลอัปและพรแพนโดรา)', () => {
    const d = run(); openStop(d, 'shop_card');
    expect(d.s.shopStock!.every(i => 'card' in i)).toBe(true);
  });

  it('ปลุกเสกกับสละการ์ด: ใบแรกฟรี ราคาต่อไป 30 และ 20', () => {
    const d = run(); openStop(d, 'shop_upgrade');
    expect(upgradePrice(d.s)).toBe(0);
    d.go({ type: 'ShopUpgradeBuy', index: 0 });
    expect(upgradePrice(d.s)).toBe(PROGRESSION_SERVICES.upgrade[1]);
    const e = run(); openStop(e, 'shop_remove');
    expect(removePrice(e.s)).toBe(0);
    e.go({ type: 'ShopRemoveBuy', index: 0 });
    expect(removePrice(e.s)).toBe(PROGRESSION_SERVICES.remove[1]);
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
    const price = d.s.shopStock![0].price;
    d.go({ type: 'TakeShop', index: 0 });
    expect(d.s.player.gold).toBe(999 - Math.ceil(price * 1.25));
  });

  it('จั่วต่อเทิร์นไม่ถูกลดตอนเข้าคืนที่ 3 (กฎระดับ 5 เปลี่ยนเป็นไม่มีโบนัสเปิดศึก)', () => {
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
      expect(d.s.player.drawPerTurn).toBe(draw);
    }
  });
});
