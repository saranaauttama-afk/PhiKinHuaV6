// src/core/engine/handlers/level.ts — level-up: one of a new card, an upgrade or a removal.
// The full heal and the max HP increase already happened when the level was gained.
import type { Command, GameState, LevelOption } from '../../types';
import type { RNG } from '../../rng';
import { LEVEL_UP } from '../../balance/notfm';
import { canRemoveCard, canUpgrade, upgradeCard, advanceAfterVictory } from '../shared';

/** Whether `option` with `index` can be taken now. */
export function levelOptionValid(s: GameState, option: LevelOption, index: number): boolean {
  if (!s.levelUp || s.levelUp.consumed) return false;
  if (option === 'card') return index >= 0 && index < s.levelUp.cards.length;
  const card = s.masterDeck[index];
  if (!card) return false;
  return option === 'upgrade' ? canUpgrade(card) : canRemoveCard(card, s.masterDeck.length);
}

export function chooseLevelUpOption(s: GameState, cmd: Extract<Command, { type: 'ChooseLevelUpOption' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || !levelOptionValid(s, cmd.option, cmd.index)) return { state: s, rng: r };
  let text = '';
  if (cmd.option === 'card') {
    const card = JSON.parse(JSON.stringify(s.levelUp.cards[cmd.index]));
    s.masterDeck.push(card);
    text = `ได้การ์ด ${card.name}`;
  } else if (cmd.option === 'upgrade') {
    s.masterDeck[cmd.index] = upgradeCard(s.masterDeck[cmd.index]);
    text = `ปลุกเสก ${s.masterDeck[cmd.index].name} เป็น ${s.masterDeck[cmd.index].star} ดาว`;
  } else {
    const [gone] = s.masterDeck.splice(cmd.index, 1);
    s.runCounters = s.runCounters ?? ({ removed: 0 } as any);
    (s.runCounters as any).removed = ((s.runCounters as any).removed ?? 0) + 1;
    text = `สละ ${gone.name} ออกจากสำรับ`;
  }
  s.levelUp.consumed = true;
  s.levelUp.result = { fight: s.fightCount ?? 0, text };
  s.log.push(text);
  advanceAfterVictory(s);
  return { state: s, rng: r };
}

export function skipLevelUp(s: GameState, _cmd: Extract<Command, { type: 'SkipLevelUp' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed) return { state: s, rng: r };
  s.player.gold += LEVEL_UP.skipGold;
  s.levelUp.consumed = true;
  s.levelUp.result = { fight: s.fightCount ?? 0, text: `รับเบี้ย ${LEVEL_UP.skipGold}` };
  advanceAfterVictory(s);
  return { state: s, rng: r };
}
