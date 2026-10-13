import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseNewState, startPlayerTurn } from '../src/core/commands';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { ALL_CLASS_IDS } from '../src/core/classes';
import { TEST_WIN_CARD_ID, dealTestWinCard } from '../src/core/cards/testWin';
import { ULTIMATE_BOSS } from '../src/core/campaign/bosses';
import { runFightTotal } from '../src/core/campaign/threeNight';
import { toBattleSave, fromSave } from '../src/core/save';
import {isCriticalOffer} from '../src/core/map/adventure';
import type { Command } from '../src/core/types';
afterEach(() => vi.unstubAllEnvs());
describe('พระประธาน test APK card', () => {
  for (const cls of ALL_CLASS_IDS) for (const difficulty of [1, 5] as const) {
    it(`${cls}, difficulty ${difficulty}: first hand in every fight and normal credited ending`, () => {
      vi.stubEnv('EXPO_PUBLIC_TEST_WIN_CARD', '1');
      const seed = `test-card-${cls}-${difficulty}`;
      let s = baseNewState(seed), r = makeRng(seed);
      const go = (cmd: Command) => { const out = applyCommand(s, cmd, r); s = out.state; r = out.rng; };
      go({ type: 'NewRun', seed, classId: cls, difficulty });
      go({ type: 'SkipChapter' }); go({ type: 'ChooseStarterBlessing', index: 0 });
      let wins = 0;
      for (let guard = 0; guard < 700 && !s.runSummary; guard++) {
        if (s.chapter) go({ type: 'SkipChapter' });
        else if (s.phase === 'map') {const p=s.pages!.current!;const ix=p.offers.findIndex((o,i)=>o&&!p.resolved[i]&&isCriticalOffer(o));const other=p.offers.findIndex((o,i)=>o&&!p.resolved[i]);go(ix>=0?{type:'ChooseOffer',index:ix}:p.offers[other]?.kind==='next_event'?{type:'ChooseOffer',index:other}:{type:'DeleteShopFromMap',index:other});}
        else if(s.phase==='event'){go({type:'ChooseEventOption',index:0});go({type:'CompleteNode'});}
        else if (s.phase === 'combat') {
          expect(s.piles.hand.filter(c => c.id === TEST_WIN_CARD_ID)).toHaveLength(1);
          expect(s.piles.hand[0].id).toBe(TEST_WIN_CARD_ID);
          expect(s.masterDeck.some(c => c.id === TEST_WIN_CARD_ID)).toBe(false);
          dealTestWinCard(s);
          expect(s.piles.hand.filter(c => c.id === TEST_WIN_CARD_ID)).toHaveLength(1);
          const restored = fromSave(toBattleSave(s, r));
          expect(restored?.piles.hand[0].id).toBe(TEST_WIN_CARD_ID);
          s.player.ap = 0; s.enemy!.block = 99999;
          const hp = s.player.hp;
          go({ type: 'PlayCard', index: 0 }); wins++;
          expect(s.enemy!.hp).toBe(0); expect(s.player.hp).toBeGreaterThanOrEqual(hp); // a level-up may heal
          expect(s.combatVictoryLock).toBe(true);
        } else if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
        else if (s.phase === 'talk') go({ type: 'AnswerGhostTalk', choice: 'leave' });
        else if (s.phase === 'reward') go({ type: 'SkipCardReward' });
        else if (s.phase === 'victory') go({ type: 'CompleteNode' });
        else throw new Error(s.phase);
      }
      expect(wins).toBe(runFightTotal(difficulty));
      expect(s.runSummary?.won).toBe(true);
      expect(s.runSummary?.metrics?.cardsPlayed).toBe(wins);
      if (difficulty === 5) expect(s.defeatedEnemyIds).toContain(ULTIMATE_BOSS.id);
    });
  }
  it('is absent and cannot be used when the test flag is disabled', () => {
    vi.stubEnv('EXPO_PUBLIC_TEST_WIN_CARD', '1');
    let s = baseNewState('off'), r = makeRng('off');
    ({ state: s, rng: r } = applyCommand(s, { type: 'StartCombat', monsterId: 'phi-pop' }, r));
    expect(s.piles.hand[0].id).toBe(TEST_WIN_CARD_ID);
    vi.stubEnv('EXPO_PUBLIC_TEST_WIN_CARD', '0');
    const hp = s.enemy!.hp;
    const out = applyCommand(s, { type: 'PlayCard', index: 0 }, r);
    expect(out.state.enemy!.hp).toBe(hp);
    s.piles.hand = []; s.piles.exhaust = []; s.turn = 1;
    startPlayerTurn(s, r);
    expect(s.piles.hand.some(c => c.id === TEST_WIN_CARD_ID)).toBe(false);
  });
  it('does not deal another copy on later turns', () => {
    vi.stubEnv('EXPO_PUBLIC_TEST_WIN_CARD', '1');
    const s = baseNewState('later'); s.phase = 'combat'; s.turn = 2;
    dealTestWinCard(s); expect(s.piles.hand).toHaveLength(0);
  });
});
