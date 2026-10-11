import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { CardData, Command, GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import {
  canFuse, fuseCards, findRecipe, isFused,
  FUSION_MAX_TOTAL_COST, FUSED_TAG,
} from '../src/core/cards/fusion';
import { FUSIONS_PER_ALTAR } from '../src/core/engine/handlers/fusion';
import { ALL_CARDS } from '../src/core/pack';
import { buildJourney } from '../src/core/map/journey';
import FUSION_RECIPES from '../src/data/packs/base/fusion_recipes.json';

/**
 * ผสานการ์ด — เด็คดีขึ้นเพราะเล็กลงและแน่นขึ้น ไม่ใช่เพราะใหญ่ขึ้น
 *
 * ต่างจาก "ปลุกเสก" (shop_upgrade) ที่ทำให้ใบเดิมแรงขึ้นเฉยๆ
 * การผสานลดจำนวนใบในสำรับลงหนึ่ง แลกกับการเสียความยืดหยุ่นในการเลือกเล่นทีละใบ
 */

const card = (over: Partial<CardData> = {}): CardData => ({
  id: 'c', name: 'การ์ด', type: 'skill', cost: 0, ...over,
});

describe('เงื่อนไขการผสาน', () => {
  it('การ์ดปกติสองใบที่ค่าร่ายรวมไม่เกินเพดาน ผสานได้', () => {
    const out = canFuse(card({ id: 'a', cost: 1 }), card({ id: 'b', cost: 1 }));
    expect(out.ok).toBe(true);
  });

  it('ค่าร่ายรวมเกินเพดาน ผสานไม่ได้', () => {
    const out = canFuse(
      card({ id: 'a', cost: FUSION_MAX_TOTAL_COST }),
      card({ id: 'b', cost: 1 })
    );
    expect(out.ok).toBe(false);
  });

  it('เครื่องรางผสานไม่ได้ — ไม่ได้อยู่ในสำรับตอนสู้', () => {
    expect(canFuse(card({ id: 'a', type: 'equipment' }), card({ id: 'b' })).ok).toBe(false);
  });

  it('การ์ดใบเดียวกันผสานกับตัวเองไม่ได้', () => {
    const c = card({ id: 'a', instanceId: 'x1' });
    expect(canFuse(c, c).ok).toBe(false);
  });

  it('การ์ดคนละใบที่ id เหมือนกัน ผสานกันได้ (สองใบในสำรับ)', () => {
    const a = card({ id: 'same', instanceId: 'x1' });
    const b = card({ id: 'same', instanceId: 'x2' });
    expect(canFuse(a, b).ok).toBe(true);
  });

  it('การ์ดที่ผสานแล้ว ผสานซ้ำไม่ได้ — กันสโนว์บอล', () => {
    const fused = fuseCards(card({ id: 'a', cost: 0 }), card({ id: 'b', cost: 0 }));
    expect(isFused(fused)).toBe(true);
    expect(canFuse(fused, card({ id: 'c' })).ok).toBe(false);
  });

  it('การ์ดเรียกผีสองใบผสานกันไม่ได้ — runtime เรียกได้ใบละตัว', () => {
    const a = { ...card({ id: 'a' }), summonMinion: 'ghost_ally' } as CardData;
    const b = { ...card({ id: 'b' }), summonMinion: 'kuman' } as CardData;
    expect(canFuse(a, b).ok).toBe(false);
  });
});

describe('ผลของการผสาน', () => {
  it('ค่าที่บวกกันได้ถูกบวกจริง', () => {
    const out = fuseCards(
      card({ id: 'a', type: 'attack', cost: 1, dmg: 5, draw: 1 }),
      card({ id: 'b', type: 'skill', cost: 1, block: 4, heal: 2, energyGain: 1 })
    );
    expect(out.dmg).toBe(5);
    expect(out.block).toBe(4);
    expect(out.heal).toBe(2);
    expect(out.draw).toBe(1);
    expect(out.energyGain).toBe(1);
  });

  it('ค่าร่ายเอาใบที่แพงกว่า ไม่ใช่บวกกัน — นี่คือกำไรของการผสาน', () => {
    const out = fuseCards(card({ id: 'a', cost: 2 }), card({ id: 'b', cost: 1 }));
    expect(out.cost).toBe(2);
  });

  it('ข้อเสียไม่หายไปกับการผสาน — ใบไหน exhaust ผลลัพธ์ก็ exhaust', () => {
    const a = { ...card({ id: 'a' }), exhaust: true } as CardData;
    const out = fuseCards(a, card({ id: 'b' }));
    expect((out as any).exhaust).toBe(true);
  });

  it('การ์ดเรียกผีใบเดียว ผลลัพธ์ยังเรียกผีได้เหมือนเดิม', () => {
    const a = {
      ...card({ id: 'a' }), summonMinion: 'poison_status', minionTarget: 'enemy',
    } as CardData;
    const out = fuseCards(a, card({ id: 'b', block: 3 }));
    expect((out as any).summonMinion).toBe('poison_status');
    expect((out as any).minionTarget).toBe('enemy');
    expect(out.block).toBe(3);
  });

  it('ติดแท็ก fused และเก็บแท็กเดิมของทั้งสองใบไว้', () => {
    const out = fuseCards(
      card({ id: 'a', tags: ['thai', 'shaman'] }),
      card({ id: 'b', tags: ['shaman', 'block'] })
    );
    expect(out.tags).toContain(FUSED_TAG);
    expect(out.tags).toContain('thai');
    expect(out.tags).toContain('block');
    // แท็กซ้ำถูกยุบ
    expect(out.tags!.filter(t => t === 'shaman')).toHaveLength(1);
  });

  it('ความหายากเอาใบที่สูงกว่า', () => {
    const out = fuseCards(
      card({ id: 'a', rarity: 'Common' }),
      card({ id: 'b', rarity: 'Rare' })
    );
    expect(out.rarity).toBe('Rare');
  });

  it('ชนิดการ์ดต่างกัน → ถ้ามีดาเมจถือเป็นการ์ดโจมตี', () => {
    const out = fuseCards(
      card({ id: 'a', type: 'attack', dmg: 4 }),
      card({ id: 'b', type: 'skill', block: 4 })
    );
    expect(out.type).toBe('attack');
  });

  it('ผลลัพธ์ไม่ขึ้นกับลำดับที่เลือก', () => {
    const a = card({ id: 'a', type: 'attack', cost: 1, dmg: 5 });
    const b = card({ id: 'b', type: 'skill', cost: 0, block: 4 });
    const ab = fuseCards(a, b);
    const ba = fuseCards(b, a);

    expect(ab.cost).toBe(ba.cost);
    expect(ab.dmg).toBe(ba.dmg);
    expect(ab.block).toBe(ba.block);
    expect(new Set(ab.tags)).toEqual(new Set(ba.tags));
  });
});

describe('สูตรผสานที่ออกแบบไว้', () => {
  it('คู่ที่มีสูตร ได้ชื่อและคำอธิบายที่เขียนไว้ ไม่ใช่ชื่อที่ต่อกันอัตโนมัติ', () => {
    const dart = ALL_CARDS.find(c => c.id === 'bamboo_dart')!;
    const cloth = ALL_CARDS.find(c => c.id === 'cooling_cloth')!;
    expect(dart, 'ไม่พบการ์ด bamboo_dart').toBeDefined();

    const recipe = findRecipe(dart, cloth);
    expect(recipe, 'ไม่พบสูตร ปาไผ่ + ผ้าเย็น').toBeDefined();

    const out = fuseCards({ ...dart, instanceId: '1' }, { ...cloth, instanceId: '2' });
    expect(out.id).toBe(recipe!.id);
    expect(out.name).toBe(recipe!.name);
  });

  it('สูตรใช้ได้ไม่ว่าจะเลือกใบไหนก่อน', () => {
    const dart = ALL_CARDS.find(c => c.id === 'bamboo_dart')!;
    const cloth = ALL_CARDS.find(c => c.id === 'cooling_cloth')!;
    expect(findRecipe(cloth, dart)?.id).toBe(findRecipe(dart, cloth)?.id);
  });

  it('ทุกสูตรอ้างการ์ดที่มีอยู่จริง และผสานกันได้ตามกติกา', () => {
    const recipes = FUSION_RECIPES;
    const known = new Map(ALL_CARDS.map(c => [c.id, c]));

    for (const r of recipes) {
      const a = known.get(r.pair[0]);
      const b = known.get(r.pair[1]);
      expect(a, `สูตร ${r.name} อ้างการ์ด ${r.pair[0]} ที่ไม่มีอยู่`).toBeDefined();
      expect(b, `สูตร ${r.name} อ้างการ์ด ${r.pair[1]} ที่ไม่มีอยู่`).toBeDefined();

      // สูตรที่ผสานไม่ได้จริงคือสูตรที่ผู้เล่นไม่มีวันได้เห็น
      const out = canFuse({ ...a!, instanceId: '1' }, { ...b!, instanceId: '2' });
      expect(out.ok, `สูตร ${r.name} ผสานไม่ได้: ${(out as any).reason}`).toBe(true);
    }

    expect(recipes.length).toBeGreaterThan(5);
  });

  it('ไม่มีสูตรไหน id ซ้ำกัน', () => {
    const ids = FUSION_RECIPES.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── ลูปจริงผ่าน engine ────────────────────────────────────────────────────

/** ยืนอยู่ที่แท่นผสาน พร้อมให้สั่งคำสั่งต่อ */
class Altar {
  state: any;
  private rng: ReturnType<typeof makeRng>;

  constructor(seed = 'fuse') {
    this.state = { seed, phase: 'start', turn: 0 };
    this.rng = makeRng(seed);

    this.go({ type: 'NewRun', seed });
    this.go({ type: 'ChooseStarterBlessing', index: 0 });

    this.state.pages.current.offers[0] = {
      kind: 'fusion_altar', shopId: 'test_altar',
    } as PageOffer;
    this.go({ type: 'ChooseOffer', index: 0 });
  }

  go(c: Command) {
    const out = applyCommand(this.state, c, this.rng);
    this.state = out.state;
    this.rng = out.rng;
  }
}

const atAltar = (seed = 'fuse') => new Altar(seed);

/** ตำแหน่งของการ์ดสองใบแรกในสำรับที่ผสานกันได้ */
function firstFusablePair(s: GameState): [number, number] {
  const deck = s.masterDeck ?? [];
  for (let i = 0; i < deck.length; i++) {
    for (let j = i + 1; j < deck.length; j++) {
      if (canFuse(deck[i], deck[j]).ok) return [i, j];
    }
  }
  throw new Error('ไม่มีคู่ไหนในสำรับตั้งต้นที่ผสานกันได้');
}

describe('แท่นผสานบนเส้นทาง', () => {
  it('เข้าแท่นแล้วอยู่ในโหมดผสาน และตัวนับเริ่มที่ศูนย์', () => {
    const t = atAltar();
    expect(t.state.phase).toBe('shop');
    expect(t.state.shopKind).toBe('fusion');
    expect(t.state.fusionAltar?.timesUsed).toBe(0);
  });

  it('ผสานแล้วสำรับลดลงหนึ่งใบ และมีการ์ดผสานอยู่จริง', () => {
    const t = atAltar();
    const before = t.state.masterDeck.length;
    const [i, j] = firstFusablePair(t.state);
    const nameA = t.state.masterDeck[i].name;
    const nameB = t.state.masterDeck[j].name;

    t.go({ type: 'FuseCards', indexA: i, indexB: j });

    expect(t.state.masterDeck).toHaveLength(before - 1);
    expect(t.state.masterDeck.filter(isFused)).toHaveLength(1);
    expect(t.state.log.join('\n')).toContain(`${nameA} + ${nameB}`);
  });

  /**
   * นับจำนวนการ์ดแต่ละ id ในสำรับ
   * ต้องนับแบบนี้เพราะคู่ที่ผสานอาจเป็นการ์ด id เดียวกันสองใบ (เด็คตั้งต้นมีใบซ้ำ)
   * ถ้าเช็คทีละ id จะอ่านผลผิดทันทีเมื่อ idA เท่ากับ idB
   */
  const countById = (deck: CardData[]) => {
    const m = new Map<string, number>();
    for (const c of deck) m.set(c.id, (m.get(c.id) ?? 0) + 1);
    return m;
  };

  /** สำรับหลังผสาน ต้องเท่ากับสำรับเดิมที่ถอดสองใบนั้นออก แล้วเติมใบผสานเข้าไป */
  function expectExactSwap(before: CardData[], after: CardData[], i: number, j: number) {
    const want = countById(before);
    for (const ix of [i, j]) {
      const id = before[ix].id;
      want.set(id, want.get(id)! - 1);
      if (want.get(id) === 0) want.delete(id);
    }

    const got = countById(after);
    const fusedCards = after.filter(isFused);
    expect(fusedCards, 'ต้องได้การ์ดผสานมาหนึ่งใบ').toHaveLength(1);
    got.delete(fusedCards[0].id);

    expect(Object.fromEntries(got)).toEqual(Object.fromEntries(want));
  }

  it('ถอดถูกใบ — สองใบที่เลือกหายไปจริง ไม่ใช่ใบข้างเคียง', () => {
    const t = atAltar();
    const [i, j] = firstFusablePair(t.state);
    const before = [...t.state.masterDeck];

    t.go({ type: 'FuseCards', indexA: i, indexB: j });

    expectExactSwap(before, t.state.masterDeck, i, j);
  });

  /**
   * สำรับที่การ์ดทุกใบ id ไม่ซ้ำกัน
   *
   * ต้องคุมเองแบบนี้ ไม่งั้นทดสอบไม่ได้จริง — เด็คตั้งต้นมีการ์ดซ้ำกันหลายใบ
   * ถ้าถอดผิดใบแต่ไปถอดใบที่ id เหมือนกัน ผลลัพธ์จะดูเหมือนถูกต้องทุกประการ
   */
  const distinctDeck = (): CardData[] => [
    card({ id: 'k0', name: 'ศูนย์', cost: 0, dmg: 1 }),
    card({ id: 'k1', name: 'หนึ่ง', cost: 0, dmg: 2 }),
    card({ id: 'k2', name: 'สอง',  cost: 0, dmg: 3 }),
    card({ id: 'k3', name: 'สาม',  cost: 0, dmg: 4 }),
    card({ id: 'k4', name: 'สี่',   cost: 0, dmg: 5 }),
  ];

  it('ถอดถูกใบเป๊ะ แม้สองใบจะอยู่คนละตำแหน่งห่างกัน', () => {
    const t = atAltar();
    t.state.masterDeck = distinctDeck();

    t.go({ type: 'FuseCards', indexA: 1, indexB: 3 });

    const ids = t.state.masterDeck.filter((c: CardData) => !isFused(c)).map((c: CardData) => c.id);
    expect(ids.sort()).toEqual(['k0', 'k2', 'k4']);
  });

  it('ถอดถูกใบแม้จะส่งใบท้ายมาเป็นใบแรก (index ไม่เลื่อนผิด)', () => {
    const t = atAltar();
    t.state.masterDeck = distinctDeck();

    // สลับลำดับ: ส่งใบท้ายมาเป็น indexA
    t.go({ type: 'FuseCards', indexA: 3, indexB: 1 });

    const ids = t.state.masterDeck.filter((c: CardData) => !isFused(c)).map((c: CardData) => c.id);
    expect(ids.sort()).toEqual(['k0', 'k2', 'k4']);
  });

  it('ใบที่ผสานมาจากสองใบที่เลือกจริง', () => {
    const t = atAltar();
    t.state.masterDeck = distinctDeck();

    t.go({ type: 'FuseCards', indexA: 1, indexB: 3 });

    const fused = t.state.masterDeck.find(isFused)!;
    // หนึ่ง(dmg 2) + สาม(dmg 4) = 6 ถ้าถอดผิดใบ ตัวเลขนี้จะไม่ตรง
    expect(fused.dmg).toBe(6);
  });

  it('ผสานได้ครั้งเดียวต่อแท่น', () => {
    const t = atAltar();
    const [i, j] = firstFusablePair(t.state);
    t.go({ type: 'FuseCards', indexA: i, indexB: j });
    const afterFirst = t.state.masterDeck.length;
    expect(t.state.fusionAltar?.timesUsed).toBe(FUSIONS_PER_ALTAR);

    const [k, l] = firstFusablePair(t.state);
    t.go({ type: 'FuseCards', indexA: k, indexB: l });

    expect(t.state.masterDeck).toHaveLength(afterFirst);
  });

  it('ผสานนอกแท่นไม่ได้', () => {
    let s: any = { seed: 'nofuse', phase: 'start', turn: 0 };
    let r = makeRng('nofuse');
    const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };
    go({ type: 'NewRun', seed: 'nofuse' });
    go({ type: 'ChooseStarterBlessing', index: 0 });

    const before = s.masterDeck.length;
    go({ type: 'FuseCards', indexA: 0, indexB: 1 });
    expect(s.masterDeck).toHaveLength(before);
  });

  it('เลือกใบเดียวกันสองครั้ง ไม่ทำให้สำรับเพี้ยน', () => {
    const t = atAltar();
    const before = t.state.masterDeck.length;
    t.go({ type: 'FuseCards', indexA: 1, indexB: 1 });
    expect(t.state.masterDeck).toHaveLength(before);
    expect(t.state.fusionAltar?.timesUsed).toBe(0);
  });

  it('index ที่ไม่มีอยู่จริง ไม่ทำให้พัง', () => {
    const t = atAltar();
    const before = t.state.masterDeck.length;
    t.go({ type: 'FuseCards', indexA: 0, indexB: 999 });
    expect(t.state.masterDeck).toHaveLength(before);
  });

  it('ออกจากแท่นแล้วเดินทางต่อได้ตามปกติ', () => {
    const t = atAltar();
    const stoodAt = t.state.journey!.currentId!;
    t.go({ type: 'CompleteNode' });

    expect(t.state.phase).toBe('map');
    expect(t.state.pages!.current!.offers).toEqual(
      t.state.journey!.nodes[stoodAt].next.map((id: string) => t.state.journey!.nodes[id].offer)
    );
  });
});

describe('แท่นผสานโผล่บนเส้นทางจริง', () => {
  it('เดินหลาย seed แล้วเจอแท่นผสานอย่างน้อยหนึ่งครั้ง', () => {
    let found = 0;
    for (const seed of ['fa-1', 'fa-2', 'fa-3', 'fa-4', 'fa-5', 'fa-6']) {
      const { journey } = buildJourney(makeRng(seed));
      found += Object.values(journey.nodes)
        .filter((n: any) => n.offer.kind === 'fusion_altar').length;
    }
    expect(found).toBeGreaterThan(0);
  });
});
