import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { baseNewState } from '../src/core/commands';
import type { CardData, Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import {
  upgradeCard, canUpgrade, upgradeLevelOf, MAX_UPGRADE_LEVEL,
} from '../src/core/engine/shared';
import { starFx, starOf } from '../src/core/cards/model';
import { upgradeCostForCount, removeCostForCount } from '../src/core/balance/economy';
import { ECONOMY } from '../src/core/balance/notfm';
import cardsJson from '../src/data/packs/base/cards.json';

const CARDS = cardsJson as CardData[];

/**
 * ร้านปลุกเสกกับร้านสละการ์ด
 *
 * ทั้งสองร้านมีของครบมาตั้งแต่ต้น — handler, ราคาที่ขึ้นตามจำนวนครั้ง, หน้าร้าน,
 * ช่องรูป — แต่ **ไม่เคยโผล่บนแผนที่เลย** เพราะตอนย้ายจากถาดหมุนมาเป็นแผนที่
 * เดินทาง สองชนิดนี้ตกจากตารางโหนดพัก เป็นโค้ดที่เดินไปไม่ถึงมาตลอด
 */

const attack = (over: Partial<CardData> = {}): CardData =>
  ({ id: 'atk', name: 'ฟันดาบ', type: 'attack', fx: { dmg: 6 }, ...over });
const dmgOf = (c: CardData) => starFx(c).dmg;

describe('ปลุกเสก = เพิ่มดาว', () => {
  it('ดาว 2 คูณ 1.5 ดาว 3 คูณ 2', () => {
    const two = upgradeCard(attack());
    expect(starOf(two)).toBe(2);
    expect(dmgOf(two)).toBe(9);
    expect(dmgOf(upgradeCard(two))).toBe(12);
  });

  it('สถานะได้ซ้อนเพิ่มตามดาว', () => {
    const c: CardData = { id: 's', name: 'สาป', type: 'spell', mana: 1, fx: { status: [{ id: 'poison', stacks: 2, turns: 3, to: 'enemy' }] } };
    expect(starFx(upgradeCard(c)).status![0].stacks).toBe(3);
    expect(starFx(upgradeCard(upgradeCard(c))).status![0].stacks).toBe(4);
  });

  it('การ์ดกำหนดค่าดาวเองได้', () => {
    const c = attack({ stars: [{ dmg: 10 }, { dmg: 20 }] });
    expect(dmgOf(upgradeCard(c))).toBe(10);
    expect(dmgOf(upgradeCard(upgradeCard(c)))).toBe(20);
  });

  it('ปลุกได้ถึงดาวสูงสุดแล้วหยุด', () => {
    let c = attack();
    for (let lvl = 1; lvl <= MAX_UPGRADE_LEVEL; lvl++) {
      expect(canUpgrade(c)).toBe(true);
      c = upgradeCard(c);
      expect(upgradeLevelOf(c)).toBe(lvl);
    }
    expect(canUpgrade(c)).toBe(false);
    expect(upgradeCard(c)).toEqual(c);
  });

  it('คำสาปและการ์ดยืมปลุกไม่ได้', () => {
    const curse = { id: 'c1', name: 'คำสาป', type: 'curse', fx: {} } as CardData;
    expect(canUpgrade(curse)).toBe(false);
    expect(canUpgrade(attack({ borrowed: true }))).toBe(false);
  });

  it('ใบนำออกยังนำออกหลังปลุก และตัวเลขขึ้น', () => {
    for (const c of CARDS.filter(c => c.exhaust)) {
      const up = upgradeCard(c);
      expect(up.exhaust, c.id).toBe(true);
      const f = starFx(c), u = starFx(up);
      if (f.dmg) expect(u.dmg!, c.id).toBeGreaterThan(f.dmg);
      if (f.block) expect(u.block!, c.id).toBeGreaterThan(f.block);
    }
  });
});

describe('ร้านปลุกเสก', () => {
  const shopState = (deck: CardData[], gold = 999): GameState => {
    const s: any = baseNewState('upgrade-shop');
    s.phase = 'shop';
    s.shopKind = 'upgrade';
    s.masterDeck = deck;
    s.player.gold = gold;
    return s;
  };

  const go = (s: GameState, c: Command) => applyCommand(s, c, makeRng('x')).state;

  it('จ่ายทองแล้วการ์ดในสำรับแรงขึ้นจริง', () => {
    const s = shopState([attack()]);
    const price = upgradeCostForCount(0);
    const out = go(s, { type: 'ShopUpgradeBuy', index: 0 });

    expect(dmgOf(out.masterDeck[0])).toBe(9);
    expect(out.player.gold).toBe(999 - price);
  });

  it('ทองไม่พอ = ไม่เสียทองและการ์ดไม่เปลี่ยน', () => {
    const s = shopState([attack()], 0);
    // ครั้งแรกที่จุดนี้ฟรี จึงต้องใช้ไปแล้วหนึ่งครั้งก่อน
    (s as any).shopBoughtItems = [{ card: { id: 'upgrade' }, price: 0 }];

    const out = go(s, { type: 'ShopUpgradeBuy', index: 0 });
    expect(dmgOf(out.masterDeck[0])).toBe(6);
    expect(out.player.gold).toBe(0);
  });

  it('ปลุกใบเดิมได้จนสุดขั้น แล้วกดต่อไม่เสียทองฟรี', () => {
    let s = shopState([attack()], 99999);
    for (let i = 0; i < MAX_UPGRADE_LEVEL; i++) {
      s = go(s, { type: 'ShopUpgradeBuy', index: 0 });
    }
    expect(upgradeLevelOf(s.masterDeck[0])).toBe(MAX_UPGRADE_LEVEL);

    const goldAtCap = s.player.gold;
    const dmgAtCap = dmgOf(s.masterDeck[0]);
    const out = go(s, { type: 'ShopUpgradeBuy', index: 0 });

    expect(out.player.gold, 'เสียทองทั้งที่ไม่มีอะไรเปลี่ยน').toBe(goldAtCap);
    expect(dmgOf(out.masterDeck[0])).toBe(dmgAtCap);
  });

  it('ใบแรกที่จุดนี้ฟรี ใบต่อไปราคาคงที่', () => {
    let s = shopState([attack(), attack({ id: 'b' })], 999);
    s = go(s, { type: 'ShopUpgradeBuy', index: 0 });
    expect(s.player.gold).toBe(999);
    s = go(s, { type: 'ShopUpgradeBuy', index: 1 });
    expect(s.player.gold).toBe(999 - ECONOMY.upgradePrice);
    s = go(s, { type: 'ShopUpgradeBuy', index: 0 });
    expect(s.player.gold).toBe(999 - 2 * ECONOMY.upgradePrice);
  });

  it('ราคาไม่ไต่ขั้น', () => {
    expect(upgradeCostForCount(0)).toBe(0);
    expect(upgradeCostForCount(1)).toBe(ECONOMY.upgradePrice);
    expect(upgradeCostForCount(5)).toBe(ECONOMY.upgradePrice);
  });
});

describe('ร้านสละการ์ด', () => {
  const shopState = (deck: CardData[], gold = 999): GameState => {
    const s: any = baseNewState('remove-shop');
    s.phase = 'shop';
    s.shopKind = 'remove';
    s.masterDeck = deck;
    s.player.gold = gold;
    return s;
  };

  const go = (s: GameState, c: Command) => applyCommand(s, c, makeRng('x')).state;

  it('ถอดใบที่เลือกออกจากสำรับ ใบอื่นอยู่ครบ', () => {
    const s = shopState([
      attack({ id: 'a', name: 'ก' }),
      attack({ id: 'b', name: 'ข' }),
      attack({ id: 'c', name: 'ค' }),
    ]);

    const out = go(s, { type: 'ShopRemoveBuy', index: 1 });
    expect(out.masterDeck.map(c => c.id)).toEqual(['a', 'c']);
  });

  it('ใบแรกที่จุดนี้ฟรี ใบต่อไปราคาคงที่', () => {
    let s = shopState([attack({ id: 'a' }), attack({ id: 'b' }), attack({ id: 'c' })], 999);
    s = go(s, { type: 'ShopRemoveBuy', index: 0 });
    expect(s.player.gold).toBe(999);
    s = go(s, { type: 'ShopRemoveBuy', index: 0 });
    expect(s.player.gold).toBe(999 - ECONOMY.removePrice);
    expect(removeCostForCount(4)).toBe(ECONOMY.removePrice);
  });
});

