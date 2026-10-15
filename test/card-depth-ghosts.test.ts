import { describe, expect, it } from 'vitest';
import { NIGHT_ENEMY_DECKS, ENEMY_ARCHETYPES } from '../src/core/campaign/enemyDecks';
import { allEnemyCards, enemyCardById, enemyCardCost, type EnemyCardDef } from '../src/core/pack_enemy_cards';
import { ghostRule } from '../src/core/campaign/enemyRules';
import { chooseEnemyCards } from '../src/core/combat/enemyPlan';
import { drawEnemyHand, finishEnemyHand, consumeEnemyCard } from '../src/core/combat/enemyHand';
import { cardFx, resolveEnemyCard } from '../src/core/combat/enemyCardEffects';
import { makeCombatState } from './helpers';
import { makeRng, shuffle } from '../src/core/rng';
import { checkGhostPhase } from '../src/core/combat/ghostMechanics';
import type { GameState } from '../src/core/types';

const cards = allEnemyCards();
const fresh = cards.filter(c => c.id.includes('_depth_'));
const defs = (ids: string[]) => ids.map(id => enemyCardById(id)!);
const allDecks = Object.entries(NIGHT_ENEMY_DECKS).flatMap(([owner, deck]) => {
  const phase = ghostRule(owner)?.phase2?.deck;
  return [{ owner, label: owner, deck }, ...(phase ? [{ owner, label: `${owner}:phase2`, deck: phase }] : [])];
});
function board(owner: string): GameState {
  const { state: s } = makeCombatState({ monsterId: owner, enemyHp: 200, playerHp: 100 });
  s.enemy!.maxHp = 200; s.enemy!.hp = 80; s.enemy!.block = 0; s.enemy!.statusEffects = [];
  s.player.maxHp = 100; s.player.block = 0; s.player.statusEffects = [];
  s.fight = { hpLost: 0, ghostTurns: 0, rhythm: 0 };
  s.enemyMinions = []; s.minions = []; s.blessings = [];
  s.enemyPiles = { hand: [], draw: [], discard: [] }; s.enemyHandAges = [];
  return s;
}
// Probability of at least one thematic card in a uniformly shuffled first pass.
function exposure(n: number, k: number, d: number): number {
  let miss = 1;
  for (let i = 0; i < d; i++) miss *= Math.max(0, n - k - i) / (n - i);
  return 1 - miss;
}
const roles = (c: EnemyCardDef) => {
  const f = c.fx;
  return [f.dmg && 'attack', f.block && 'guard', f.heal && 'heal', f.drain && 'drain',
    f.breakBlock && 'armorPressure', f.sweep && 'sweep', f.summon && 'summon', f.steal && 'steal',
    f.status?.length && 'status', c.charge && 'charge', c.riposte && 'riposte',
    (c.conditional || c.perFoeStatus) && 'payoff', c.curseCard && 'curse'].filter(Boolean);
};

describe('ghost card depth: all 34 identities', () => {
  it('grows unique choices with encounter strength, with no orphan or cross-owner definitions', () => {
    expect(Object.keys(NIGHT_ENEMY_DECKS)).toHaveLength(34);
    expect(new Set(cards.map(c => c.id)).size).toBe(cards.length);
    const used = new Set(allDecks.flatMap(x => x.deck));
    for (const c of fresh) {
      expect(used.has(c.id), c.id).toBe(true);
      expect(c.name).toMatch(/[ก-๙]/);
      expect(c.flavor).toMatch(/[ก-๙]/);
    }
    for (const [owner, deck] of Object.entries(NIGHT_ENEMY_DECKS)) {
      expect(ENEMY_ARCHETYPES[owner], owner).toBeTruthy();
      expect(deck.length, owner).toBeGreaterThanOrEqual(11);
      expect(deck.length, owner).toBeLessThanOrEqual(20);
      expect(new Set(deck).size, owner).toBeGreaterThanOrEqual(9);
      expect(new Set(deck.filter(id => id.includes('_depth_'))).size, owner).toBeGreaterThanOrEqual(3);
      if (ghostRule(owner)?.phase2) expect(deck.length, owner).toBeGreaterThanOrEqual(18);
      const distinctions = new Set(defs(deck).flatMap(roles));
      expect(distinctions.size, owner).toBeGreaterThanOrEqual(4);
    }
    for (const { owner, deck } of allDecks) for (const id of deck) {
      expect(enemyCardById(id)?.owner, id).toBe(owner);
    }
  });

  it('adds mechanically distinct definitions rather than renaming an existing owned card', () => {
    const fingerprint = (c: EnemyCardDef): string => {
      const stable = (v: unknown): unknown => Array.isArray(v) ? v.map(stable) : v && typeof v === 'object'
        ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, stable(x)])) : v;
      return JSON.stringify(stable(Object.fromEntries(Object.entries(c).filter(([key]) => !['id', 'owner', 'name', 'flavor'].includes(key)))));
    };
    for (const c of fresh) expect(cards.filter(other => other.owner === c.owner && fingerprint(other) === fingerprint(c)), c.id).toHaveLength(1);
  });

  it('preserves theme exposure and viable immediate plays instead of filling hands with gated cards', () => {
    for (const { label, deck } of allDecks) {
      const themed = deck.filter(id => !/_v29_(strike|double|pierce|ward)$/.test(id));
      expect(exposure(deck.length, themed.length, 6), label).toBeGreaterThan(.98);
      const immediate = defs(deck).filter(c => !c.charge && (c.fx.dmg || c.fx.block || c.fx.status?.length));
      expect(immediate.length / deck.length, label).toBeGreaterThanOrEqual(.5);
      expect(defs(deck).filter(c => c.charge).length, label).toBeLessThanOrEqual(3);
      for (const c of defs(deck)) expect(enemyCardCost(c), c.id).toBeLessThanOrEqual(2);
    }
  });

  it('keeps summons and denial finite and does not introduce new disruptive sources', () => {
    for (const c of fresh) {
      expect(c.fx.summon, c.id).toBeUndefined();
      expect(c.fx.steal, c.id).toBeUndefined();
      expect(c.curseCard, c.id).toBeUndefined();
      expect(c.fx.status?.some(e => ['stun', 'draw_reduction', 'entangle', 'fear'].includes(e.id)), c.id).not.toBe(true);
      expect(c.fx.status?.some(e => e.to === 'self' && e.id === 'strength'), c.id).not.toBe(true);
    }
    for (const { label, deck } of allDecks) {
      const ds = defs(deck);
      expect(ds.filter(c => c.fx.summon).length, label).toBeLessThanOrEqual(3);
      expect(ds.filter(c => c.fx.steal).length, label).toBeLessThanOrEqual(1);
      expect(ds.filter(c => c.fx.status?.some(e => e.id === 'stun')).length, label).toBeLessThanOrEqual(1);
      expect(ds.filter(c => c.curseCard).length, label).toBeLessThanOrEqual(2);
      for (const id of new Set(deck)) expect(deck.filter(x => x === id).length, id).toBeLessThanOrEqual(3);
    }
  });

  it('keeps new follow-ups reachable from the same deck or its opening rule', () => {
    for (const { owner, label, deck } of allDecks) for (const c of defs(deck).filter(c => c.id.includes('_depth_'))) {
      const w = c.conditional?.when;
      if (w?.kind === 'enemy_has_status') {
        const sources = [...defs(deck).flatMap(x => [...(x.fx.status ?? []), ...(x.riposte?.status ?? [])]), ...(ghostRule(owner)?.fx.status ?? [])];
        expect(sources.some(e => e.to === 'enemy' && e.id === w.statusId), `${label}: ${c.id}`).toBe(true);
      }
      if (w?.kind === 'player_block_at_least') expect(defs(deck).some(x => (x.fx.block ?? 0) >= w.value), c.id).toBe(true);
      expect(Object.keys(c.fx).length, c.id).toBeGreaterThan(0);
    }
  });

  it('phase two inherits support but retains exclusive centrepieces and bounded draw cycles', () => {
    for (const [owner, first] of Object.entries(NIGHT_ENEMY_DECKS)) {
      const p = ghostRule(owner)?.phase2; if (!p?.deck) continue;
      const second = p.deck;
      expect(second.length, owner).toBeGreaterThanOrEqual(14);
      expect(second.length, owner).toBeLessThanOrEqual(16);
      expect(new Set(second.filter(id => first.includes(id))).size, owner).toBeGreaterThanOrEqual(5);
      const exclusive = second.filter(id => !first.includes(id));
      expect(exclusive.length, owner).toBeGreaterThanOrEqual(3);
      // Phase two is an actual rotation, not a uniform shuffle. Check every possible entry.
      const attacks = new Set(exclusive.filter(id => enemyCardById(id)!.type === 'attack' && enemyCardById(id)!.fx.dmg));
      const attackBound = Math.ceil(second.length / second.filter(id => attacks.has(id)).length);
      for (let offset = 0; offset < second.length; offset++) {
        const s = board(owner);
        s.enemy!.hp = 1; s.fight!.ghostTurns = offset;
        if (p.afterRevive) s.fight!.relic = { reviveUsed: true } as NonNullable<NonNullable<GameState['fight']>['relic']>;
        s.enemyHandSize = 5; s.enemyDrawPerTurn = 2; s.enemyMaxRetained = 3;
        checkGhostPhase(s, makeRng(`phase-depth:${owner}:${offset}`));
        expect(s.fight!.ghostPhase2, `${owner}:${offset}`).toBe(true);
        expect(s.enemyPiles!.draw).toEqual(second.map((_, i) => second[(i + offset) % second.length]));
        const drawn: string[] = [];
        // Empty the hand after each draw to inspect the real draw stream, not combat outcomes.
        // Hand5/retain3 guarantees at least two free draw slots in an ongoing normal turn.
        while (drawn.length < Math.max(6, attackBound)) {
          drawEnemyHand(s);
          drawn.push(...s.enemyPiles!.hand);
          s.enemyPiles!.discard.push(...s.enemyPiles!.hand.splice(0)); s.enemyHandAges = [];
        }
        expect(drawn.slice(0, 6).some(id => exclusive.includes(id)), `${owner}:${offset}:exclusive`).toBe(true);
        // Collector has only 2 exclusive attacks in 14: seven, not six, is the optimal bound.
        expect(drawn.slice(0, attackBound).some(id => attacks.has(id)), `${owner}:${offset}:attack`).toBe(true);
      }
      expect(!!p.afterRevive || (p.belowPct! >= 40 && p.belowPct! <= 50), owner).toBe(true);
    }
  });
});

describe('new ghost cards through the real planner and resolver', () => {
  it('กระหัง adds a real second hit against player armor rather than restating the default one hit', () => {
    const c = enemyCardById('krahang_depth_2')!;
    const s = board(c.owner);
    expect(cardFx(s, c).hits ?? 1).toBe(1);
    s.player.block = 1;
    expect(cardFx(s, c).hits).toBe(2);
    resolveEnemyCard(s, c);
    expect(s.player.hp).toBe(95);
  });
  it('every new card has a useful affordable play from an ordinary public board', () => {
    for (const c of fresh) {
      const s = board(c.owner);
      s.enemyPiles!.hand = [c.id]; s.enemyHandAges = [3];
      expect(chooseEnemyCards(s, [c.id], 2), c.id).toContain(c.id);
      resolveEnemyCard(s, c, c.charge ? 3 : 0);
      expect(Number.isFinite(s.player.hp) && Number.isFinite(s.enemy!.hp), c.id).toBe(true);
    }
  });

  it('conditional attack bonuses change with the relevant public state', () => {
    for (const c of fresh.filter(c => c.conditional)) {
      const s = board(c.owner), w = c.conditional!.when;
      s.enemy!.hp = s.enemy!.maxHp;
      const before = cardFx(s, c);
      if (w.kind === 'enemy_has_status') s.player.statusEffects = [{ id: w.statusId, name: '', description: '', duration: 2, stacks: 1 }];
      else if (w.kind === 'player_block_at_least') s.enemy!.block = w.value;
      else if (w.kind === 'foe_block_at_least') s.player.block = w.value;
      else if (w.kind === 'player_hp_below') s.enemy!.hp = 1;
      else if (w.kind === 'foe_hp_below') s.player.hp = 1;
      else if (w.kind === 'hurt_last_turn') s.fight!.enemyHurtTurn = s.turn ?? 1;
      else throw new Error(`Unexercised ghost condition: ${w.kind}`);
      expect(cardFx(s, c), c.id).not.toEqual(before);
    }
  });

  it('larger draw/retain cycles remain deterministic, conserve cards and play matured charge', () => {
    for (const { owner, label, deck } of allDecks) {
      const run = () => {
        const s = board(owner); const rng = makeRng(`depth:${label}`);
        s.enemyPiles = { draw: shuffle(rng, deck).array, hand: [], discard: [] };
        s.enemyHandSize = 5; s.enemyDrawPerTurn = 2; s.enemyMaxRetained = 3;
        const played: string[] = [];
        for (let turn = 0; turn < deck.length * 2; turn++) {
          drawEnemyHand(s); s.enemy!.ap = 3;
          const chosen = chooseEnemyCards(s, s.enemyPiles.hand, 3);
          for (const id of chosen) { const ix = s.enemyPiles.hand.indexOf(id); expect(consumeEnemyCard(s, ix), id).toBe(true); played.push(id); }
          finishEnemyHand(s, chosen.length);
          const piles = [...s.enemyPiles.draw, ...s.enemyPiles.hand, ...s.enemyPiles.discard];
          expect(piles.sort(), label).toEqual([...deck].sort());
          expect(s.enemyHandAges).toHaveLength(s.enemyPiles.hand.length);
        }
        for (const id of new Set(deck.filter(id => enemyCardById(id)?.charge))) expect(played, `${label}: ${id}`).toContain(id);
        expect(played.length, label).toBeGreaterThan(deck.length);
        return played;
      };
      expect(run(), label).toEqual(run());
    }
  });
});
