// test/notfm-enemy.test.ts — ghost cards follow the player card rules; rage; opening rules.
import { describe, it, expect } from 'vitest';
import type { GameState } from '../src/core/types';
import type { PageOffer } from '../src/core/map/pages';
import { makeCombatState, runEnemyCards } from './helpers';
import { makeRng } from '../src/core/rng';
import { applyCommand } from '../src/core/reducer';
import { allEnemyCards, enemyCardById, enemyCardCost } from '../src/core/pack_enemy_cards';
import { consumeEnemyCard } from '../src/core/combat/enemyHand';
import { CURSE_CARDS } from '../src/core/pack';
import { describeCard } from '../src/core/cards/describe';
import { playCard } from '../src/core/cards/play';
import { STATUS_EFFECTS_REGISTRY } from '../src/core/combat/status-effects/registry';
import { THAI_GHOST_POOLS } from '../src/core/monsters/thai-ghosts';
import { ghostRule, ghostRuleIds } from '../src/core/campaign/enemyRules';
import { applyRage, rageActive, rageStacks } from '../src/core/campaign/nights';
import { RAGE, ENEMY_RULES } from '../src/core/balance/notfm';
import { NIGHT_ENEMY_DECKS, NIGHT_AWAKENED_DECKS } from '../src/core/campaign/enemyDecks';
import { ghostTierLabel } from '../app/components/offerDisplay';

const statusIds = new Set(Object.keys(STATUS_EFFECTS_REGISTRY));
const ALL_GHOSTS = Object.values(THAI_GHOST_POOLS).flat();
const HIT6 = 'pisaj_fai_v29_signature', WARD4 = 'phi_krasue_v29_ward';

describe('ข้อมูลการ์ดผี', () => {
  const cards = allEnemyCards();

  it('ทุกใบในเด็คผีมีอยู่จริง และไม่มีใบที่ไม่ได้ใช้ค้างอยู่', () => {
    const used = new Set([...Object.values(NIGHT_ENEMY_DECKS), ...Object.values(NIGHT_AWAKENED_DECKS)].flat());
    for (const id of used) expect(enemyCardById(id), id).toBeDefined();
    expect(cards.filter(c => !used.has(c.id)).map(c => c.id)).toEqual([]);
  });

  it('โจมตีฟรี · Action ใช้แต้ม 1–3', () => {
    for (const c of cards) {
      expect(['attack', 'action'], c.id).toContain(c.type);
      if (c.type === 'attack') { expect(c.ap ?? 0, c.id).toBe(0); expect(c.fx.dmg, c.id).toBeGreaterThan(0); }
      else { expect(c.ap, c.id).toBeGreaterThanOrEqual(1); expect(c.ap, c.id).toBeLessThanOrEqual(3); }
    }
  });

  it('ผีไม่มีผลที่เป็นของผู้เล่นเท่านั้น (จั่ว มานา แต้ม ยืม)', () => {
    for (const c of cards) for (const k of ['draw', 'mana', 'ap', 'borrow'] as const) expect(c.fx[k], `${c.id}.${k}`).toBeUndefined();
  });

  it('สถานะและคำสาปที่อ้างถึงมีอยู่จริง', () => {
    const curses = new Set(CURSE_CARDS.map(c => c.id));
    for (const c of cards) {
      for (const e of [...(c.fx.status ?? []), ...(c.conditional?.bonus.status ?? [])]) expect(statusIds.has(e.id), `${c.id} → ${e.id}`).toBe(true);
      if (c.curseCard) expect(curses.has(c.curseCard), c.id).toBe(true);
    }
  });

  it('ข้อความการ์ดผีอ่านจากฝั่งผี ไม่มี undefined', () => {
    for (const c of cards) expect(describeCard(c, 'enemy'), c.id).not.toMatch(/undefined|NaN/);
    expect(describeCard(enemyCardById('phi_krasue_v29_signature')!, 'enemy')).toContain('เราติดพิษ');
    expect(describeCard(enemyCardById('phi_krasue_v29_defense')!, 'enemy')).toContain('ผีติดหลบ');
  });
});

describe('ผีเล่นตามกติกาเดียวกับผู้เล่น', () => {
  it('ผีหมดแต้มก็ยังโจมตีได้ แต่ Action เล่นไม่ได้', () => {
    const { state: s } = makeCombatState({ enemyHp: 80 });
    s.enemyPiles = { draw: [], hand: [HIT6, WARD4], discard: [] };
    s.enemyHandAges = [0, 0];
    s.enemy!.ap = 0;
    expect(enemyCardCost(enemyCardById(HIT6)!)).toBe(0);
    expect(consumeEnemyCard(s, 1)).toBe(false);
    expect(consumeEnemyCard(s, 0)).toBe(true);
  });

  it('งบแต้มตามชนิดผี: ธรรมดา 2 · ชั้นสูง 3 · บอส 3', () => {
    expect([ENEMY_RULES.normal.ap, ENEMY_RULES.elite.ap, ENEMY_RULES.boss.ap]).toEqual([2, 3, 3]);
  });

  it('ยืมการ์ดผีแล้วผลกลับทิศถูก: พิษที่ผีใส่เรา กลายเป็นพิษที่เราใส่ผี', () => {
    const { state: s } = makeCombatState({ enemyHp: 80, hand: [] });
    s.cardHistory = []; s.enemyLastPlayed = ['phi_krasue_v29_signature'];
    s.piles.hand = [{ ...cardFromBorrowCard(), instanceId: 'b1' }];
    playCard(s, 0, makeRng('b'));
    const borrowed = s.piles.hand.find(c => c.borrowed)!;
    playCard(s, s.piles.hand.indexOf(borrowed), makeRng('b'));
    expect(s.enemy!.statusEffects?.some(e => e.id === 'poison')).toBe(true);
    expect(s.player.statusEffects?.some(e => e.id === 'poison') ?? false).toBe(false);
  });
});

function cardFromBorrowCard() {
  return { id: 'borrow_breath', name: 'ยืมลมผี', type: 'action' as const, ap: 0, fx: { borrow: 1 } };
}

describe('โกรธ', () => {
  const at = (night: 1 | 2 | 3, difficulty: 1 | 2 | 3 | 4 | 5, turn: number) =>
    ({ campaign: { night, difficulty, completedNights: night - 1, unlocks: [] }, turn }) as Partial<GameState>;

  it('ระดับ 1–2 เริ่มคืนที่ 2 · ระดับ 3 ขึ้นไปเริ่มคืนแรก', () => {
    expect(rageActive(at(1, 1, 3))).toBe(false);
    expect(rageActive(at(1, 2, 3))).toBe(false);
    expect(rageActive(at(2, 1, 3))).toBe(true);
    expect(rageActive(at(1, 3, 3))).toBe(true);
  });

  it('เริ่มเทิร์น 2 และเพิ่ม 1 ทุกเทิร์น', () => {
    expect(rageStacks(at(2, 1, 1))).toBe(0);
    expect(rageStacks(at(2, 1, RAGE.startTurn))).toBe(1);
    expect(rageStacks(at(2, 1, 4))).toBe(3);
  });

  it('ทุกหมัดของผีแรงขึ้นตามชั้นโกรธ ผ่านเทิร์นผีจริง', () => {
    const { state: s } = makeCombatState({ playerHp: 50, enemyHp: 80 });
    s.campaign = { night: 2, difficulty: 1, completedNights: 1, unlocks: [] };
    s.turn = 3;
    const out = runEnemyCards(s, [HIT6]);
    expect(out.enemy!.statusEffects?.find(e => e.id === 'rage')?.stacks).toBe(2);
    expect(out.player.hp).toBe(50 - 6 - 2);
  });

  it('คืนแรกระดับ 1 ไม่มีโกรธ', () => {
    const { state: s } = makeCombatState({ playerHp: 50, enemyHp: 80 });
    s.campaign = { night: 1, difficulty: 1, completedNights: 0, unlocks: [] };
    s.turn = 5;
    applyRage(s);
    expect(s.enemy!.statusEffects?.some(e => e.id === 'rage') ?? false).toBe(false);
  });
});

describe('กฎเปิดไฟต์', () => {
  it('ผีทุกตนมีกฎหนึ่งข้อ และสถานะที่อ้างมีอยู่จริง', () => {
    expect(ghostRuleIds().sort()).toEqual(ALL_GHOSTS.map(g => g.id).sort());
    for (const id of ghostRuleIds()) {
      const r = ghostRule(id)!;
      expect(r.name.length, id).toBeGreaterThan(0);
      expect(r.fx.dmg, id).toBeUndefined();
      for (const e of r.fx.status ?? []) expect(statusIds.has(e.id), `${id} → ${e.id}`).toBe(true);
      expect((r.fx.block ?? 0) + (r.fx.status?.length ?? 0), id).toBeGreaterThan(0);
    }
  });

  it('กฎทำงานจริงตอนเข้าไฟต์', () => {
    let s: any = { seed: 'rule', phase: 'start', turn: 0 };
    let r = makeRng('rule');
    const go = (c: any) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };
    go({ type: 'NewRun', seed: 'rule', classId: 'warrior', difficulty: 1 });
    while (s.chapter) go({ type: 'SkipChapter' });
    go({ type: 'ChooseStarterBlessing', index: 0 });
    s.pages.current.offers[0] = { kind: 'monster', tier: 'normal', enemyId: 'phi-pop' } as PageOffer;
    go({ type: 'ChooseOffer', index: 0 });
    expect(s.phase).toBe('combat');
    expect(s.enemy.statusEffects.some((e: any) => e.id === 'regeneration')).toBe(true);
  });
});

describe('หน้าผีบอกระดับ', () => {
  it('ผีธรรมดาบอกระดับ ผีชั้นสูงและบอสบอกชนิด', () => {
    expect(ghostTierLabel({ kind: 'monster', tier: 'normal', enemyId: 'phi-krasue' } as PageOffer)).toBe('ผีระดับ 1');
    expect(ghostTierLabel({ kind: 'monster', tier: 'elite', enemyId: 'yak-dam' } as PageOffer)).toBe('ผีชั้นสูง');
    expect(ghostTierLabel({ kind: 'boss', bossType: 'final', enemyId: 'night-head-collector' } as PageOffer)).toBe('บอสประจำคืน');
    expect(ghostTierLabel({ kind: 'well' } as PageOffer)).toBeUndefined();
  });
});
