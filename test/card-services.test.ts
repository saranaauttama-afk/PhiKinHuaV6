import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { baseNewState } from '../src/core/commands';
import type { CardData, Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { buildJourney } from '../src/core/map/journey';
import {
  upgradeCard, canUpgrade, upgradeLevelOf, UPGRADE_BONUS, MAX_UPGRADE_LEVEL,
} from '../src/core/engine/shared';
import { upgradeCostForCount, removeCostForCount } from '../src/core/balance/economy';
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
  ({ id: 'atk', name: 'ฟันดาบ', type: 'attack', cost: 1, dmg: 6, ...over });

describe('สูตรปลุกเสก', () => {
  it('ใบโจมตีได้ดาเมจเพิ่ม', () => {
    const up = upgradeCard(attack());
    expect(up.dmg).toBe(6 + UPGRADE_BONUS);
  });

  it('ใบป้องกันได้ค่ากันเพิ่ม', () => {
    const up = upgradeCard({ id: 'blk', name: 'กัน', type: 'skill', cost: 1, block: 5 });
    expect(up.block).toBe(5 + UPGRADE_BONUS);
  });

  it('ใบผลพิเศษที่ไม่มีตัวเลข ได้ลดค่าร่ายแทน', () => {
    const up = upgradeCard({ id: 'sp', name: 'พิเศษ', type: 'skill', cost: 2 });
    expect(up.cost).toBe(1);
  });

  it('ใบผลพิเศษที่ค่าร่ายศูนย์อยู่แล้ว ได้จั่วเพิ่มแทน — ลดต่ำกว่าศูนย์ไม่ได้', () => {
    const up = upgradeCard({ id: 'sp0', name: 'พิเศษฟรี', type: 'skill', cost: 0 });
    expect(up.cost).toBe(0);
    expect(up.draw).toBe(1);
  });

  it('ชื่อมีเครื่องหมายบอกว่าปลุกแล้ว', () => {
    expect(upgradeCard(attack()).name).toContain('+');
  });

  /**
   * เดิมปลุกซ้ำได้ไม่จำกัด ทางที่ดีที่สุดคือทุ่มทองใส่ใบเดียวแล้วถือยาว
   * ("ฟันดาบ + + +") ตอนนี้มีเพดานที่ 3 ขั้น
   */
  it('ปลุกได้ถึงขั้นสูงสุดแล้วหยุด', () => {
    let c = attack();
    for (let lvl = 1; lvl <= MAX_UPGRADE_LEVEL; lvl++) {
      expect(canUpgrade(c), `ขั้น ${lvl - 1} ควรปลุกต่อได้`).toBe(true);
      c = upgradeCard(c);
      expect(upgradeLevelOf(c)).toBe(lvl);
      expect(c.dmg).toBe(6 + UPGRADE_BONUS * lvl);
    }

    expect(canUpgrade(c), 'เต็มขั้นแล้วยังปลุกได้อีก').toBe(false);
    const over = upgradeCard(c);
    expect(over.dmg).toBe(c.dmg);
    expect(over.name).toBe(c.name);
  });

  it('ชื่อบอกขั้นปัจจุบัน ไม่ใช่ต่อ + ไปเรื่อยๆ', () => {
    let c = attack();
    c = upgradeCard(c);
    expect(c.name).toBe('ฟันดาบ +1');
    c = upgradeCard(c);
    expect(c.name, 'ชื่อกลายเป็น "ฟันดาบ +1 +2"').toBe('ฟันดาบ +2');
  });

  it('การ์ดคำสาปปลุกเสกไม่ได้', () => {
    const curse = { id: 'c1', name: 'คำสาป', type: 'curse', cost: 0 } as CardData;
    expect(canUpgrade(curse)).toBe(false);
    expect(upgradeCard(curse)).toEqual(curse);
  });

  /**
   * ตอนแรกตั้งใจให้ปลุกเสกปลดข้อจำกัด "ใช้แล้วหาย" แต่ใบ exhaust ทั้งหมดในเกม
   * ไม่มีตัวเลขให้บวก มันเป็นผลพิเศษล้วน และในนั้นมี "ฟื้นเต็มหลอด" กับ
   * "Max HP +2 ถาวร" — ปลดให้ร่ายซ้ำได้ = เลือดสูงสุดไม่มีเพดานและตายไม่เป็น
   */
  it('ใบใช้แล้วหาย ปลุกแล้วยังหายเหมือนเดิม', () => {
    for (const c of CARDS.filter(c => c.exhaust)) {
      expect(upgradeCard(c).exhaust, `${c.id} ปลุกแล้วเล่นซ้ำได้`).toBe(true);
    }
  });

  it('ใบ exhaust ในเกมไม่มีใบไหนมีตัวเลข — สูตรจึงลดค่าร่ายให้ทุกใบ', () => {
    for (const c of CARDS.filter(c => c.exhaust)) {
      const up = upgradeCard(c);
      expect(up.cost, `${c.id}`).toBe(Math.max(0, c.cost - 1));
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

    expect(out.masterDeck[0].dmg).toBe(6 + UPGRADE_BONUS);
    expect(out.player.gold).toBe(999 - price);
  });

  it('ทองไม่พอ = ไม่เสียทองและการ์ดไม่เปลี่ยน', () => {
    const s = shopState([attack()], 0);
    // ครั้งแรกฟรี จึงต้องดันตัวนับให้ราคาขึ้นก่อน
    (s as any).runCounters = { upgradeShopCount: 3 };

    const out = go(s, { type: 'ShopUpgradeBuy', index: 0 });
    expect(out.masterDeck[0].dmg).toBe(6);
    expect(out.player.gold).toBe(0);
  });

  it('ปลุกใบเดิมได้จนสุดขั้น แล้วกดต่อไม่เสียทองฟรี', () => {
    let s = shopState([attack()], 99999);
    for (let i = 0; i < MAX_UPGRADE_LEVEL; i++) {
      s = go(s, { type: 'ShopUpgradeBuy', index: 0 });
    }
    expect(upgradeLevelOf(s.masterDeck[0])).toBe(MAX_UPGRADE_LEVEL);

    const goldAtCap = s.player.gold;
    const dmgAtCap = s.masterDeck[0].dmg;
    const out = go(s, { type: 'ShopUpgradeBuy', index: 0 });

    expect(out.player.gold, 'เสียทองทั้งที่ไม่มีอะไรเปลี่ยน').toBe(goldAtCap);
    expect(out.masterDeck[0].dmg).toBe(dmgAtCap);
  });

  it('ปลุกขั้นสูงแพงกว่าปลุกขั้นแรก', () => {
    const cheap = shopState([attack()], 99999);
    const first = cheap.player.gold - go(cheap, { type: 'ShopUpgradeBuy', index: 0 }).player.gold;

    let s = shopState([attack()], 99999);
    s = go(s, { type: 'ShopUpgradeBuy', index: 0 });
    const before = s.player.gold;
    const second = before - go(s, { type: 'ShopUpgradeBuy', index: 0 }).player.gold;

    expect(second, 'ปั้นใบเดียวให้สุดควรแพงขึ้นเรื่อยๆ').toBeGreaterThan(first);
  });

  it('ราคาแพงขึ้นทุกครั้งที่ใช้', () => {
    expect(upgradeCostForCount(1)).toBeGreaterThan(upgradeCostForCount(0));
    expect(upgradeCostForCount(2)).toBeGreaterThan(upgradeCostForCount(1));
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

  it('ราคาแพงขึ้นทุกครั้งที่ใช้', () => {
    expect(removeCostForCount(1)).toBeGreaterThan(removeCostForCount(0));
    expect(removeCostForCount(2)).toBeGreaterThan(removeCostForCount(1));
  });
});

describe('สองร้านนี้อยู่บนแผนที่จริง', () => {
  /** นับชนิดโหนดพักที่เส้นทางสร้างได้ จากหลาย seed */
  function restKinds(seeds: string[]): Set<string> {
    const kinds = new Set<string>();
    for (const seed of seeds) {
      const { journey } = buildJourney(makeRng(seed));
      for (const node of Object.values(journey.nodes)) kinds.add(node.offer.kind);
    }
    return kinds;
  }

  const SEEDS = Array.from({ length: 40 }, (_, i) => `svc-${i}`);

  it('ร้านปลุกเสกโผล่บนเส้นทางได้', () => {
    expect(restKinds(SEEDS)).toContain('shop_upgrade');
  });

  it('ร้านสละการ์ดโผล่บนเส้นทางได้', () => {
    expect(restKinds(SEEDS)).toContain('shop_remove');
  });

  it('ทุก offer ของสองชนิดนี้มี shopId และ phase ครบ — ไม่งั้นบัญชี pool พัง', () => {
    for (const seed of SEEDS) {
      const { journey } = buildJourney(makeRng(seed));
      for (const node of Object.values(journey.nodes)) {
        const o = node.offer as any;
        if (o.kind !== 'shop_remove' && o.kind !== 'shop_upgrade') continue;
        expect(o.shopId, `${seed}/${node.id}`).toBeTruthy();
        expect([1, 2], `${seed}/${node.id} phase=${o.phase}`).toContain(o.phase);
      }
    }
  });

  it('เดินเข้าไปแล้วเปิดร้านถูกชนิด และปิดโหนดเดินต่อได้', () => {
    for (const kind of ['shop_remove', 'shop_upgrade'] as const) {
      let s: any = baseNewState(`walk-${kind}`);
      let r = makeRng(`walk-${kind}`);
      const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

      go({ type: 'NewRun', seed: `walk-${kind}` });
      while (s.chapter) go({ type: 'SkipChapter' });
      go({ type: 'ChooseStarterBlessing', index: 0 });
      while (s.chapter) go({ type: 'SkipChapter' });

      s.pages.current.offers[0] = { kind, shopId: `test_${kind}`, phase: 1 } as PageOffer;

      go({ type: 'ChooseOffer', index: 0 });
      expect(s.phase, `${kind} ไม่เปิดหน้าร้าน`).toBe('shop');
      expect(s.shopKind, `${kind} เปิดผิดชนิด`)
        .toBe(kind === 'shop_remove' ? 'remove' : 'upgrade');

      const stoodAt = s.journey.currentId;
      go({ type: 'CompleteNode' });

      expect(s.phase, `${kind} ปิดโหนดไม่ลง`).toBe('map');
      expect(s.pages.current.offers).toEqual(
        s.journey.nodes[stoodAt].next.map((id: string) => s.journey.nodes[id].offer)
      );
    }
  });
});
