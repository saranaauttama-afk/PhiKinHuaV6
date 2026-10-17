// test/notfm-backlog.test.ts — playtest backlog of 13 Oct: board refill, แพนโดรา blessings,
// EXP rhythm, retain limit with end-of-turn discard.
import { describe, it, expect } from 'vitest';
import { baseNewState } from '../src/core/commands';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { Command } from '../src/core/types';
import { validAdventure } from '../src/core/map/adventure';
import { CARD_RULES, ECONOMY, NIGHT_EXP } from '../src/core/balance/notfm';
import { nextExpForLevel } from '../src/core/balance/progression';
import { PANDORA_BLESSINGS } from '../src/core/pack';
import { rollTwoBlessings } from '../src/core/level';
import { grantBlessing } from '../src/core/engine/shared';
import { turnEndExcess } from '../src/core/engine/handlers/combat';
import { makeCombatState, attackCard } from './helpers';

function run(seed = 'backlog', tier = 0) {
  let s = baseNewState(seed), r = makeRng(seed);
  const go = (c: Command) => { ({ state: s, rng: r } = applyCommand(s, c, r)); };
  go({ type: 'NewRun', seed, classId: 'warrior', difficulty: 1, blessingTier: tier }); go({ type: 'SkipChapter' }); go({ type: 'ChooseStarterBlessing', index: 0 });
  return { go, get s() { return s; } };
}
/** Put the night's stop of `kind` on slot 0 as if it had been dealt there. */
function dealStop(d: ReturnType<typeof run>, kind: string) {
  const s = d.s, a = s.pages!.adventure!, p = s.pages!.current!;
  const e = a.deck.find(x => x.offer.kind === kind)!, k = a.deck.indexOf(e);
  // Swap it into the first board so the board stays valid.
  [a.deck[0], a.deck[k]] = [a.deck[k], a.deck[0]];
  a.slotIds[0] = e.id; p.offers[0] = { ...e.offer, availableAfterWins: 0 }; p.resolved[0] = false;
  return 0;
}

describe('กระดานเพจ: จุดพักค้างจนหมดหรือปิดเอง', () => {
  it('ปลุกเสกใช้แล้วยังค้างบนกระดาน ปิดเองแล้วแจกใบใหม่', () => {
    const d = run(); const ix = dealStop(d, 'shop_upgrade');
    const id = d.s.pages!.adventure!.slotIds[ix];
    d.go({ type: 'ChooseOffer', index: ix }); d.go({ type: 'ShopUpgradeBuy', index: 0 }); d.go({ type: 'CompleteNode' });
    expect(d.s.pages!.adventure!.slotIds[ix]).toBe(id);
    expect(d.s.pages!.current!.resolved[ix]).toBe(false);
    d.go({ type: 'DeleteShopFromMap', index: ix });
    expect(d.s.pages!.adventure!.slotIds[ix]).not.toBe(id);
    expect(d.s.pages!.current!.resolved[ix]).toBe(false);
  });

  it('บ่อน้ำค้างจนตักครบแล้วหายไป', () => {
    const d = run(); const ix = dealStop(d, 'shop_card');
    // Replace with a well to keep the test independent of the healing roll.
    const a = d.s.pages!.adventure!, e = a.deck[0];
    e.offer = { kind: 'well', shopId: e.id }; d.s.pages!.current!.offers[ix] = e.offer;
    d.s.player.hp = 5;
    d.go({ type: 'ChooseOffer', index: ix }); d.go({ type: 'UseWell' }); d.go({ type: 'CompleteNode' });
    expect(d.s.pages!.adventure!.slotIds[ix]).toBe(e.id);
    for (let i = 1; i < ECONOMY.well.uses; i++) { d.go({ type: 'ChooseOffer', index: ix }); d.go({ type: 'UseWell' }); d.go({ type: 'CompleteNode' }); }
    expect(d.s.pages!.adventure!.slotIds[ix]).not.toBe(e.id);
  });

  it('ศาลพรรับแล้วจบ แจกใบใหม่แทน', () => {
    const d = run(); const ix = dealStop(d, 'blessing');
    const id = d.s.pages!.adventure!.slotIds[ix];
    d.go({ type: 'ChooseOffer', index: ix }); d.go({ type: 'TakeShopBlessing', index: 0 }); d.go({ type: 'CompleteNode' });
    expect(d.s.pages!.adventure!.slotIds[ix]).not.toBe(id);
    expect(d.s.pages!.adventure!.resolvedIds).toContain(id);
  });
});

describe('พรแพนโดรา', () => {
  it('ทุกพรมีทั้งของที่ได้และราคาที่ต้องจ่าย', () => {
    expect(PANDORA_BLESSINGS.length).toBeGreaterThanOrEqual(6);
    for (const b of PANDORA_BLESSINGS) {
      const g = b.onGain??{};
      const gains = (['gold', 'ap', 'draw', 'retain', 'startMana', 'slot'] as const).some(k => (g[k] ?? 0) > 0) || (g.maxHp ?? 0) > 0;
      const costs = (g.maxHp ?? 0) < 0 || (g.hp ?? 0) < 0;
      const ongoingGain=!!(b.triggers.length||(b.rules?.prayerMult??0)>0||(b.rules?.borrowBonus??0)>0);
      const ongoingCost=!!((b.rules?.openingDraw??0)<0||(b.rules?.retain??0)<0||(b.rules?.prayerAp??0)>0||(b.rules?.borrowHpCost??0)>0);
      expect((gains||ongoingGain)&&(costs||ongoingCost), b.id).toBe(true);
      expect(b.desc, b.id).toBeTruthy();
    }
  });

  it('ปลดล็อกตามจำนวนคืนที่ผ่าน (journal)', () => {
    const seen = (tier: number) => {
      const ids = new Set<string>();
      for (let i = 0; i < 60; i++) for (const b of rollTwoBlessings(makeRng('p' + i), [], 3, tier).list) ids.add(b.id);
      return ids;
    };
    const locked = PANDORA_BLESSINGS.filter(b => (b.unlock ?? 0) > 0).map(b => b.id);
    expect(locked.some(id => seen(0).has(id))).toBe(false);
    expect(locked.every(id => seen(99).has(id))).toBe(true);
    // Without a tier (old callers) no แพนโดรา at all.
    const none = new Set<string>();
    for (let i = 0; i < 40; i++) for (const b of rollTwoBlessings(makeRng('n' + i), [], 3).list) none.add(b.id);
    expect(PANDORA_BLESSINGS.some(b => none.has(b.id))).toBe(false);
  });

  it('รับพรแล้วผลถาวรเกิดทันที', () => {
    const d = run('gain');
    const p = d.s.player, before = { maxHp: p.maxHp, ap: p.maxAp, draw: p.drawPerTurn, gold: p.gold };
    grantBlessing(d.s, JSON.parse(JSON.stringify(PANDORA_BLESSINGS.find(b => b.id === 'pandora_phrai_pact'))));
    grantBlessing(d.s, JSON.parse(JSON.stringify(PANDORA_BLESSINGS.find(b => b.id === 'pandora_heavy_bag'))));
    grantBlessing(d.s, JSON.parse(JSON.stringify(PANDORA_BLESSINGS.find(b => b.id === 'pandora_gambler_purse'))));
    expect(d.s.player.maxAp).toBe(before.ap + 1);
    expect(d.s.player.drawPerTurn).toBe(before.draw + 1);
    expect(d.s.player.gold).toBe(before.gold + 100);
    expect(d.s.player.maxHp).toBe(before.maxHp - 12 - 8 - 10);
    expect(d.s.player.hp).toBeLessThanOrEqual(d.s.player.maxHp);
    // Granting twice does nothing.
    grantBlessing(d.s, JSON.parse(JSON.stringify(PANDORA_BLESSINGS.find(b => b.id === 'pandora_phrai_pact'))));
    expect(d.s.player.maxAp).toBe(before.ap + 1);
  });
});

describe('จังหวะ EXP', () => {
  it('เลเวลอัปห่างกันไม่เกิน 5 ไฟต์ และคืนที่ 3 ยังได้ขึ้นอย่างน้อย 2 ครั้ง', () => {
    const fights: Array<{ night: number; kind: 'normal' | 'elite' | 'boss' }> = [];
    for (const [night, n, elites] of [[1, 7, 0], [2, 10, 1], [3, 10, 2]] as const) {
      for (let i = 0; i < n; i++) fights.push({ night, kind: i >= n - elites ? 'elite' : 'normal' });
      fights.push({ night, kind: 'boss' });
    }
    let lv = 1, exp = 0; const ups: number[] = [];
    fights.forEach((f, i) => {
      exp += NIGHT_EXP[f.kind][f.night - 1];
      while (exp >= nextExpForLevel(lv)) { exp -= nextExpForLevel(lv); lv++; ups.push(i + 1); }
    });
    const gaps = ups.map((u, i) => u - (ups[i - 1] ?? 0));
    expect(Math.max(...gaps)).toBeLessThanOrEqual(5);
    expect(ups.filter(u => u > 19).length).toBeGreaterThanOrEqual(2);
    expect(ups.filter(u => u <= 8).length).toBeLessThanOrEqual(2);
  });
});

describe('เก็บการ์ดข้ามเทิร์น', () => {
  it('ระหว่างเทิร์นถือเกินได้ ตอนจบเทิร์นต้องทิ้งให้เหลือตามขีด', () => {
    const { state: s, rng } = makeCombatState({ hand: Array.from({ length: 6 }, (_, i) => attackCard(1, { id: `h${i}` })) });
    s.player.retain = CARD_RULES.retain;
    expect(turnEndExcess(s)).toBe(6 - CARD_RULES.retain);
    // Wrong count is refused.
    let out = applyCommand(s, { type: 'DiscardForTurnEnd', indices: [0] }, rng).state;
    expect(out.piles.hand).toHaveLength(6);
    out = applyCommand(out, { type: 'DiscardForTurnEnd', indices: [0, 2, 4, 5] }, rng).state;
    expect(out.piles.hand.map(c => c.id)).toEqual(['h1', 'h3']);
    expect(turnEndExcess(out)).toBe(0);
  });

  it('ถ้าไม่ได้เลือก จบเทิร์นแล้วทิ้งใบใหม่สุดเอง', () => {
    const { state: s, rng } = makeCombatState({ hand: Array.from({ length: 5 }, (_, i) => attackCard(1, { id: `h${i}` })) });
    s.player.retain = 2;
    s.enemy!.hp = 999;
    const out = applyCommand(s, { type: 'ResolveEnemyTurn' }, rng).state;
    expect(out.piles.discard.map(c => c.id)).toEqual(expect.arrayContaining(['h2', 'h3', 'h4']));
  });
});

it('save ยังถูกต้องหลังกระดานแจกใบใหม่', () => {
  const d = run('save-ok');
  expect(validAdventure(d.s)).toBe(true);
});
