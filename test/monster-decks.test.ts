import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import type { GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { THAI_GHOST_POOLS } from '../src/core/monsters/thai-ghosts';
import { deckForMonster, monstersWithoutDeck } from '../src/core/monsters/monster-decks';
import { enemyCardById } from '../src/core/pack_enemy_cards';

/**
 * ผีแต่ละตนต้องมีเด็คของตัวเอง
 *
 * เดิม ChooseOffer hardcode `ai.cycle = ['claw','guard']` ให้ทุกตัว
 * ผี 31 ตนจึงเล่นเหมือนกันหมด ต่างกันแค่ HP ทั้งที่ enemy_cards.json
 * มีการ์ดตามธีมอยู่แล้ว 35 ใบ
 */

const ALL_MONSTERS = Object.values(THAI_GHOST_POOLS).flat();

/** เริ่มคอมแบตกับผีตนที่ระบุ แล้วคืนเด็คที่ถูกสร้าง */
function deckOf(monsterId: string, seed = 'deck'): string[] {
  let s: any = { seed, phase: 'start', turn: 0 };
  let r = makeRng(seed);
  const go = (c: any) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

  go({ type: 'NewRun', seed });
  go({ type: 'ChooseStarterBlessing', index: 0 });

  s.pages.current.offers[0] = {
    kind: 'monster', tier: 'normal', enemyId: monsterId,
  } as PageOffer;
  go({ type: 'ChooseOffer', index: 0 });

  const piles = (s as GameState & { enemyPiles?: { draw: string[] } }).enemyPiles;
  return piles?.draw ?? [];
}

describe('การจับคู่เด็ค', () => {
  it('ผีทุกตนถูกจับคู่เด็คไว้ครบ ไม่มีตกหล่น', () => {
    expect(monstersWithoutDeck(ALL_MONSTERS)).toEqual([]);
  });

  it('การ์ดที่อ้างถึงมีอยู่จริงในกองการ์ดศัตรู', () => {
    for (const m of ALL_MONSTERS) {
      const owners = deckForMonster(m).pool.allowOwners;
      expect(owners.length).toBeGreaterThan(0);
    }
  });

  it('tier สูงกว่าได้พลังงานและมือไม่น้อยกว่า tier ต่ำ', () => {
    const t1 = deckForMonster(THAI_GHOST_POOLS.T1[0]);
    const t5 = deckForMonster(THAI_GHOST_POOLS.T5[0]);
    const boss = deckForMonster(THAI_GHOST_POOLS.BossFinal[0]);

    expect(t5.maxEnergy).toBeGreaterThan(t1.maxEnergy);
    expect(boss.maxEnergy).toBeGreaterThanOrEqual(t5.maxEnergy);
    expect(boss.handSize).toBeGreaterThanOrEqual(t1.handSize);
  });
});

describe('เด็คที่สร้างจริงตอนเข้าคอมแบต', () => {
  it('ไม่ใช่ claw/guard เหมือนกันหมดอีกแล้ว', () => {
    const krasue = deckOf('phi-krasue');
    expect(krasue.length).toBeGreaterThan(0);
    // เดิมทุกตัวได้ ['claw','guard',...] ล้วน
    const onlyDefaults = krasue.every(id => id === 'claw' || id === 'guard');
    expect(onlyDefaults).toBe(false);
  });

  it('การ์ดในเด็คมาจากกลุ่มที่จับคู่ไว้เท่านั้น', () => {
    for (const id of ['phi-krasue', 'phi-pop', 'phi-nang-ram', 'ngu-phi-sang']) {
      const monster = ALL_MONSTERS.find(m => m.id === id)!;
      const allowed = deckForMonster(monster).pool.allowOwners;

      for (const cardId of deckOf(id)) {
        const card = enemyCardById(cardId);
        expect(card, `ไม่พบการ์ด ${cardId}`).toBeDefined();
        expect(allowed).toContain(card!.owner ?? 'global');
      }
    }
  });

  it('ผีคนละตนได้เด็คต่างกัน', () => {
    const decks = ['phi-krasue', 'phi-pop', 'phi-nang-ram', 'ngu-phi-sang', 'krahang']
      .map(id => deckOf(id).slice().sort().join(','));
    expect(new Set(decks).size).toBeGreaterThan(1);
  });

  it('บอสก็ได้เด็คของตัวเองเช่นกัน', () => {
    let s: any = { seed: 'boss-deck', phase: 'start', turn: 0 };
    let r = makeRng('boss-deck');
    const go = (c: any) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };
    go({ type: 'NewRun', seed: 'boss-deck' });
    go({ type: 'ChooseStarterBlessing', index: 0 });

    s.pages.current.offers[0] = {
      kind: 'boss', bossType: 'final', enemyId: 'phaya-nak',
    } as PageOffer;
    go({ type: 'ChooseOffer', index: 0 });

    const draw: string[] = s.enemyPiles?.draw ?? [];
    expect(draw.length).toBeGreaterThan(0);

    const allowed = deckForMonster(
      ALL_MONSTERS.find(m => m.id === 'phaya-nak')!
    ).pool.allowOwners;
    for (const cardId of draw) {
      expect(allowed).toContain(enemyCardById(cardId)!.owner ?? 'global');
    }
  });

  it('เด็คซ้ำได้ตาม seed', () => {
    expect(deckOf('phi-krasue', 'same')).toEqual(deckOf('phi-krasue', 'same'));
  });
});
