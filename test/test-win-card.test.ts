import { afterEach, describe, expect, it, vi } from 'vitest';
import { baseNewState, startPlayerTurn } from '../src/core/commands';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { ALL_CLASS_IDS } from '../src/core/classes';
import { TEST_WIN_CARD_ID, dealTestWinCard } from '../src/core/cards/testWin';
import { onRestRow } from '../src/core/map/restPage';
import { ULTIMATE_BOSS, nightFightTotal } from '../src/core/campaign/bosses';
import { toBattleSave, fromSave } from '../src/core/save';
import {isCriticalOffer} from '../src/core/map/adventure';
import type { Command } from '../src/core/types';
afterEach(() => vi.unstubAllEnvs());
describe('พระประธาน test APK card', () => {
  for (const cls of ALL_CLASS_IDS) for (const night of [1, 2, 3, 4, 5] as const) {
    it(`${cls}, night ${night}: first hand in every fight and normal credited ending`, () => {
      vi.stubEnv('EXPO_PUBLIC_TEST_WIN_CARD', '1');
      const seed = `test-card-${cls}-${night}`;
      let s = baseNewState(seed), r = makeRng(seed);
      const go = (cmd: Command) => { const out = applyCommand(s, cmd, r); s = out.state; r = out.rng; };
      go({ type: 'NewRun', seed, classId: cls, night });
      go({ type: 'SkipChapter' }); go({ type: 'ChooseStarterBlessing', index: 0 });
      let wins = 0;
      for (let guard = 0; guard < 250 && !s.runSummary; guard++) {
        if (s.chapter) go({ type: 'SkipChapter' });
        else if (s.phase === 'map') {const ix=s.pages!.current!.offers.findIndex(o=>o&&isCriticalOffer(o));go(ix>=0?{type:'ChooseOffer',index:ix}:{type:'Proceed'});}
        else if(s.phase==='event'){go({type:'ChooseEventOption',index:0});go({type:'CompleteNode'});}
        else if (s.phase === 'combat') {
          expect(s.piles.hand.filter(c => c.id === TEST_WIN_CARD_ID)).toHaveLength(1);
          expect(s.piles.hand[0].id).toBe(TEST_WIN_CARD_ID);
          expect(s.masterDeck.some(c => c.id === TEST_WIN_CARD_ID)).toBe(false);
          dealTestWinCard(s);
          expect(s.piles.hand.filter(c => c.id === TEST_WIN_CARD_ID)).toHaveLength(1);
          const restored = fromSave(toBattleSave(s, r));
          expect(restored?.piles.hand[0].id).toBe(TEST_WIN_CARD_ID);
          s.player.energy = 0; s.enemy!.block = 99999;
          const hp = s.player.hp;
          go({ type: 'PlayCard', index: 0 }); wins++;
          expect(s.enemy!.hp).toBe(0); expect(s.player.hp).toBe(hp);
          expect(s.combatVictoryLock).toBe(true);
        } else if (s.phase === 'levelup') go({ type: 'SkipLevelUp' });
        else if (s.phase === 'reward') go({ type: 'SkipCardReward' });
        else if (s.phase === 'victory') go({ type: 'CompleteNode' });
        else throw new Error(s.phase);
      }
      expect(wins).toBe((night===5?7:6));
      expect(s.runSummary?.won).toBe(true);
      expect(s.runSummary?.metrics?.cardsPlayed).toBe(wins);
      if (night === 5) expect(s.defeatedEnemyIds).toContain(ULTIMATE_BOSS.id);
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
