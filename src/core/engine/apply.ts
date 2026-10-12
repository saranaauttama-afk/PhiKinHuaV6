// src/core/engine/apply.ts
import type { Command, GameState } from '../types';
import type { RNG } from '../rng';
import {trackRun} from '../campaign/metrics';
import {trackDiscovery} from '../archive/progress';
import { cloneForReducer } from './shared';
import {cardCost} from '../cards/model';
import {recordCardHistory, historySnapshot} from '../combat/cardHistory';
import {captureRewardReceipt} from '../rewardReceipt';

import * as run from './handlers/run';
import * as combat from './handlers/combat';
import * as mappages from './handlers/map_pages';
import * as lvl from './handlers/level';
import * as se from './handlers/shops_events';
import * as ui from './handlers/ui';
import * as story from './handlers/story';
import * as chapter from './handlers/chapter';
import * as cardReward from './handlers/cardReward';
import * as skills from './handlers/skills';
import * as talk from './handlers/talk';

type Handler<T extends Command['type']> =
  (s: GameState, cmd: Extract<Command, { type: T }>, r: RNG) => { state: GameState; rng: RNG };

// Pages-only: บังคับใช้ handler ฝั่ง pages เสมอ
const H: { [K in Command['type']]?: Handler<K> } = {
  // Run lifecycle
  EnterMenu: (s, cmd, r) => ({ state: { ...s, phase: 'menu' }, rng: r }),
  NewRun: run.newRun,
  ChooseStarterBlessing: run.chooseStarter,

  // Combat
  StartCombat: combat.start,
  PlayCard: combat.play,
  EnemyPlayCard: combat.enemyPlayCard,
  StartMonsterTurn: combat.startMonsterTurn,
  EndTurn: combat.endTurn,
  ResolveEnemyTurn: combat.resolveEnemyTurn,
  StartPlayerTurn: combat.startPlayerTurnHandler,


  // Node completion (victory/levelup/shop/event) → pages handler
  CompleteNode: mappages.completeNode,

  // Level up
  ChooseLevelUpOption: lvl.chooseLevelUpOption,
  SkipLevelUp: lvl.skipLevelUp,

  // Class skills
  UseSkill: skills.useSkill,

  // ความกล้า / บุญ
  AnswerGhostTalk: talk.answer,

  // การ์ดรางวัลหลังชนะไฟต์
  ChooseCardReward: cardReward.chooseCardReward,
  SkipCardReward: cardReward.skipCardReward,

  // UI
  OpenDeck: ui.openDeck,
  CloseDeck: ui.closeDeck,

  // Shops & Events
  // TakeReward: se.takeReward, // (เลิกใช้: reward-on-victory ถูกตัด)
  TakeShop: se.takeShop,
  ShopReroll: se.shopReroll,
  DoBonfireHeal: se.doBonfireHeal,
  EventChooseBlessing: se.eventChooseBlessing,
  EventRemoveCard: se.eventRemoveCard,
  EventGambleRoll: se.eventGambleRoll,
  EventTreasureOpen: se.eventTreasureOpen,
  ShopRemoveBuy: se.shopRemoveBuy,
  ShopUpgradeBuy: se.shopUpgradeBuy,
  ChooseEventOption: story.chooseEventOption,
  AdvanceChapter: chapter.advanceChapter,
  SkipChapter: chapter.skipChapter,
  DoWellUse: se.doWellUse,
  DoWellDismiss: se.doWellDismiss,
  UseWell: se.useWell,
  TakeTreasureCard: se.takeTreasureCard,
  TakeSingleTreasureCard: se.takeSingleTreasureCard,
  RandomizeSingleTreasure: se.randomizeSingleTreasure,
  DoHealingShrineUse: se.doHealingShrineUse,
  DoHealingShrineDismiss: se.doHealingShrineDismiss,
  UseHealingShrine: se.useHealingShrine,

  // Pages mode
  ChooseOffer: mappages.choose,
  DismissOffer: mappages.dismiss,
  
  // Shop Management
  DeleteShop: mappages.deleteShop,
  DeleteShopFromMap: mappages.deleteShopFromMap,

};

export function applyCommand(state: GameState, cmd: Command, rng: RNG) {
  const s = cloneForReducer(state);
  s.blessings = s.blessings ?? [];
  s.turnFlags = s.turnFlags ?? { blessingOnce: {} };
  // event เป็นผลของ "คำสั่งนี้" เท่านั้น — เคลียร์ของคำสั่งก่อนหน้าทิ้งทุกครั้ง
  // view ที่ยังเล่นคิวเก่าค้างอยู่จะถือ array เดิมไว้เอง ไม่ถูกกระทบ
  s.pendingEvents = [];

  const historyBefore = cmd.type==='PlayCard'&&state.phase==='combat'&&state.piles?.hand[cmd.index]?historySnapshot(state):undefined;
  const historyCost = cmd.type==='PlayCard'&&state.phase==='combat'&&state.piles?.hand[cmd.index]?cardCost(state,state.piles.hand[cmd.index]):{ap:0,mana:0};
  const h = H[cmd.type] as Handler<typeof cmd.type> | undefined;
  if (h) {const out=h(s,cmd as any,rng);
    if(cmd.type==='PlayCard' && historyBefore && (out.state.turnFlags?.cardsPlayed??0)>(state.turnFlags?.cardsPlayed??0)){
      recordCardHistory(out.state,'player',state.piles.hand[cmd.index],historyBefore,0,undefined,historyCost);
    }
    captureRewardReceipt(state,out.state,cmd);trackRun(state,out.state,cmd);trackDiscovery(state,out.state,cmd);return out;}
  return { state: s, rng };
}
