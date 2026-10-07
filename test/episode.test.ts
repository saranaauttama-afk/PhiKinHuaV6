import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { baseNewState } from '../src/core/commands';
import { makeRng } from '../src/core/rng';
import type { Command, GameState } from '../src/core/types';
import { effectiveCost, withConditional } from '../src/core/cards/mechanics';
import { ALL_CLASS_IDS, type ClassId } from '../src/core/classes';
import { toSave, fromSave, isPlayableSave } from '../src/core/save';
import { EPISODE } from '../src/core/balance/episode';
import { restBudgetLeft } from '../src/core/map/restPage';
import { enemyCardById } from '../src/core/pack_enemy_cards';
import { readFileSync } from 'node:fs';

function driver(seed = 'episode-test', classId: ClassId = 'shaman') {
  let state = baseNewState(seed), rng = makeRng(seed);
  const go = (cmd: Command) => { const out = applyCommand(state, cmd, rng); state = out.state; rng = out.rng; return state; };
  go({ type: 'NewRun', seed, classId, runMode: 'episode' });
  go({ type: 'SkipChapter' });
  go({ type: 'ChooseStarterBlessing', index: 0 });
  return { get state() { return state; }, go };
}

/** No synthetic damage/HP: play affordable real cards with a simple tactical policy. */
function playFight(d: ReturnType<typeof driver>): number {
  let turns = 0;
  while (d.state.phase === 'combat' && turns < 30) {
    let plays = 0;
    while (d.state.phase === 'combat' && plays++ < 30) {
      const s = d.state;
      const choices = s.piles.hand.map((card, index) => {
        if (effectiveCost(s, card) > s.player.energy) return { index, score: -Infinity };
        const needBlock = Math.max(0, (s.enemyIntent?.damage ?? 0) - s.player.block);
        const c = withConditional(s, card);
        const score = (c.dmg ?? 0) * (c.hits ?? 1)
          + Math.min(c.block ?? 0, needBlock) * (s.classId === 'warrior' ? 0.8 : 1.3)
          + (c.heal ?? 0) * (s.player.hp < s.player.maxHp ? 1 : 0)
          + (c.energyGain ?? 0) * 9 + (c.draw ?? 0) * 3
          + (c.summonMinion ? 8 : 0)
          + (c.statusEffect?.effect === 'poison' ? 8 : 0)
          + (c.statusEffect?.effect === 'strength' ? 6 : 0);
        return { index, score };
      }).sort((a, b) => b.score - a.score);
      if (!choices.length || !Number.isFinite(choices[0].score)) break;
      d.go({ type: 'PlayCard', index: choices[0].index });
    }
    if (d.state.phase !== 'combat') break;
    // Mirror the UI's mandatory discard before ending an oversized hand.
    while (d.state.piles.hand.length > d.state.player.maxHandSize) {
      d.go({ type: 'DiscardCard', index: d.state.piles.hand.length - 1 });
    }
    d.go({ type: 'ResolveEnemyTurn' });
    if (d.state.phase === 'combat') d.go({ type: 'StartPlayerTurn' });
    turns++;
  }
  if (d.state.phase === 'levelup') d.go({ type: 'SkipLevelUp' });
  if (d.state.phase === 'reward') d.go({ type: 'ChooseCardReward', index: 0 });
  return turns;
}

describe('first chapter', () => {
  it('opens the authored story and has three fights with bounded pauses', () => {
    const d = driver();
    expect(d.state.journey!.plans.map(p => p.kind)).toEqual(['fight', 'rest', 'fight', 'rest', 'fight']);
    expect(restBudgetLeft(d.state)).toBe(0);
    expect(d.state.pages!.current!.offers.map((o: any) => o.enemyId)).toEqual(['phi-pop', 'nang-tanee']);
  });

  it('shows a committed enemy hand and resolves those same cards', () => {
    const d = driver(); d.go({ type: 'ChooseOffer', index: 0 });
    const cards = [...d.state.enemyIntent!.cardIds];
    expect(cards.length).toBeGreaterThan(0);
    // Play a block card before handing over the turn: the plan must remain fixed.
    const ix = d.state.piles.hand.findIndex(c => (c.block ?? 0) > 0);
    if (ix >= 0) d.go({ type: 'PlayCard', index: ix });
    expect(d.state.enemyIntent!.cardIds).toEqual(cards);
    d.go({ type: 'ResolveEnemyTurn' });
    const shown = d.state.pendingEvents!.filter(e => e.t === 'EnemyCardRevealed').map((e: any) => e.cardId);
    expect(shown).toEqual(cards);
    expect(shown.every(id => !!enemyCardById(id))).toBe(true);
  });

  it('persists episode mode and authored path through save/load', () => {
    const d = driver(); const saved = toSave(d.state);
    expect(isPlayableSave(saved)).toBe(true);
    const loaded = fromSave(saved);
    expect(loaded.runMode).toBe('episode');
    expect(loaded.journey).toEqual(d.state.journey);
  });

  for (const classId of ALL_CLASS_IDS) {
    it(`${classId}: real cards can finish all three fights and receive rewards`, () => {
      const results = [];
      for (let seed = 0; seed < 8; seed++) {
        const d = driver(`episode-${classId}-${seed}`, classId);
        const turns: number[] = [];
        for (let fight = 0; fight < 3; fight++) {
          d.go({ type: 'ChooseOffer', index: seed % (fight === 2 ? 1 : 2) });
          if (fight === 2) expect(d.state.enemy!.maxHp).toBe(EPISODE.finaleHp);
          turns.push(playFight(d));
          if (d.state.phase !== 'victory') break;
          expect(d.state.lastReward!.gold).toBeGreaterThan(0);
          d.go({ type: 'CompleteNode' });
          if (fight === 0) {
            d.go({ type: 'ChooseOffer', index: 0 });
            d.go({ type: 'ChooseEventOption', index: 0 });
            d.go({ type: 'CompleteNode' });
          } else if (fight === 1) {
            d.go({ type: 'ChooseOffer', index: 0 });
            d.go({ type: 'UseHealingShrine' });
            d.go({ type: 'CompleteNode' });
          }
        }
        results.push({ seed, won: d.state.runSummary?.won ?? false, hp: d.state.player.hp, fights: d.state.fightCount, turns });
        if (d.state.runSummary?.won) {
          expect(d.state.runSummary.fights).toBe(3);
          expect(d.state.chapter?.id).toBe('episode_end');
          expect(isPlayableSave(toSave(d.state))).toBe(false);
          expect(d.state.secretBossUnlocked).not.toBe(true);
        }
      }
      console.log('EPISODE_SIM', classId, JSON.stringify(results));
      expect(results.filter(x => x.won).length).toBeGreaterThanOrEqual(6);
    });
  }

  it('all ghosts on the short route have wired images', () => {
    const src = readFileSync('app/components/Art.tsx', 'utf8');
    for (const row of Object.values(driver().state.journey!.nodes)) {
      if (row.offer.kind === 'monster') expect(src).toContain(`'monster/${row.offer.enemyId}'`);
    }
  });
});
