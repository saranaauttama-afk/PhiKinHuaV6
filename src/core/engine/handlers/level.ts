// src/core/engine/handlers/level.ts — level-up: pick one of the two rewards rolled for this level
// (new card, upgrades, removal, equipment slot, retain). The full heal and the max HP increase
// already happened when the level was gained.
import type { Command, GameState, LevelOption } from '../../types';
import type { RNG } from '../../rng';
import { CARD_RULES, LEVEL_UP } from '../../balance/notfm';
import { canRemoveCard, canUpgrade, upgradeCard, advanceAfterVictory } from '../shared';

/** Rewards offered this level (old saves without `offers` keep the classic three). */
export function levelOffers(s: GameState): LevelOption[] {
  return s.levelUp?.offers ?? ['card', 'upgrade', 'remove'];
}

/** Whether `option` with `index` can be taken now. */
export function levelOptionValid(s: GameState, option: LevelOption, index: number): boolean {
  if (!s.levelUp || s.levelUp.consumed) return false;
  // Once upgrades started, only more upgrades are allowed.
  if (s.levelUp.upgradesLeft != null && option !== 'upgrade') return false;
  if (!levelOffers(s).includes(option)) return false;
  if (option === 'card') return index >= 0 && index < s.levelUp.cards.length;
  if(option==='ap')return s.player.maxAp<LEVEL_UP.caps.ap;
  if(option==='mana')return s.player.startMana<LEVEL_UP.caps.mana;
  if(option==='draw')return s.player.drawPerTurn<LEVEL_UP.caps.draw;
  if(option==='slot')return (s.equipmentSlotsMax??1)<LEVEL_UP.caps.slot;
  if(option==='retain')return (s.player.retain??3)<LEVEL_UP.caps.retain;
  const card = s.masterDeck[index];
  if (!card) return false;
  return option === 'upgrade' ? canUpgrade(card) : canRemoveCard(card, s.masterDeck.length);
}

function finish(s: GameState, text: string) {
  s.levelUp!.consumed = true;
  s.levelUp!.result = { fight: s.fightCount ?? 0, text };
  s.log.push(text);
  advanceAfterVictory(s);
}

export function chooseLevelUpOption(s: GameState, cmd: Extract<Command, { type: 'ChooseLevelUpOption' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || !levelOptionValid(s, cmd.option, cmd.index)) return { state: s, rng: r };
  const lv = s.levelUp;
  if (cmd.option === 'card') {
    const card = JSON.parse(JSON.stringify(lv.cards[cmd.index]));
    s.masterDeck.push(card);
    finish(s, `ได้การ์ด ${card.name}`);
  } else if (cmd.option === 'upgrade') {
    s.masterDeck[cmd.index] = upgradeCard(s.masterDeck[cmd.index]);
    const text = `ปลุกเสก ${s.masterDeck[cmd.index].name} เป็น ${s.masterDeck[cmd.index].star} ดาว`;
    s.log.push(text);
    const first = lv.upgradesLeft == null;
    lv.upgradesLeft = (lv.upgradesLeft ?? LEVEL_UP.upgrades) - 1;
    lv.result = { fight: s.fightCount ?? 0, text: first || !lv.result ? text : `${lv.result.text} · ${text}` };
    if (lv.upgradesLeft <= 0 || !s.masterDeck.some(canUpgrade)) finish(s, lv.result!.text);
  } else if (cmd.option === 'remove') {
    const [gone] = s.masterDeck.splice(cmd.index, 1);
    s.runCounters = s.runCounters ?? ({ removed: 0 } as any);
    (s.runCounters as any).removed = ((s.runCounters as any).removed ?? 0) + 1;
    finish(s, `สละ ${gone.name} ออกจากสำรับ`);
  } else if(cmd.option==='ap'){s.player.maxAp++;s.player.ap=s.player.maxAp;finish(s,`แต้มต่อเทิร์น +1 (${s.player.maxAp})`);
  } else if(cmd.option==='mana'){s.player.startMana=Math.min(LEVEL_UP.caps.mana,s.player.startMana+2);finish(s,`มานาตั้งต้น +2 (${s.player.startMana})`);
  } else if(cmd.option==='draw'){s.player.drawPerTurn++;finish(s,`จั่วต่อเทิร์น +1 (${s.player.drawPerTurn})`);
  } else if (cmd.option === 'slot') {
    s.equipmentSlotsMax = (s.equipmentSlotsMax ?? CARD_RULES.equipmentSlots) + 1;
    finish(s, `ช่องอุปกรณ์ +1 (${s.equipmentSlotsMax})`);
  } else {
    s.player.retain = (s.player.retain ?? CARD_RULES.retain) + 1;
    finish(s, `เก็บการ์ดข้ามเทิร์น +1 (${s.player.retain})`);
  }
  return { state: s, rng: r };
}

/** Skip: gold instead; after some upgrades were used it just ends the reward. */
export function skipLevelUp(s: GameState, _cmd: Extract<Command, { type: 'SkipLevelUp' }>, r: RNG) {
  if (s.phase !== 'levelup' || !s.levelUp || s.levelUp.consumed) return { state: s, rng: r };
  if (s.levelUp.upgradesLeft != null) { finish(s, s.levelUp.result?.text ?? 'ปลุกเสกแล้ว'); return { state: s, rng: r }; }
  s.player.gold += LEVEL_UP.skipGold;
  finish(s, `รับเบี้ย ${LEVEL_UP.skipGold}`);
  return { state: s, rng: r };
}
