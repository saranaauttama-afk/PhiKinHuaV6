// src/core/engine/handlers/combat.ts — Legacy only (unified system removed)
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { pickEnemy } from '../../pack';
import { buildAndShuffleDeck, drawUpTo, applyCardEffect, endEnemyTurn, isVictory, isDefeat, startPlayerTurn, startCombat } from '../../commands';
import { resetBlessingTurnFlags, runBlessingsTurnHook, getCardPlayedFns } from '../../blessingRuntime';
import { planEnemyIntent } from '../../combat/intent';
import { START_ENERGY } from '../../balance/core';
import { grantExpAndQueueLevelUp } from '../shared';
import { runEquipmentCardPlayed, runEquipmentTurnHook } from '../../equipmentRuntime';
import { getEquipmentById } from '../../pack';
import { dealDamage, gainBlock, emit } from '../../combat/damage';
import { loseRun } from './runEnd';

export function play(s: GameState, cmd: Extract<Command, { type: 'PlayCard' }>, r: RNG) {
  if (s.phase !== 'combat' || s.combatVictoryLock) return { state: s, rng: r };

  const idx = cmd.index;
  if (idx < 0 || idx >= s.piles.hand.length) return { state: s, rng: r };
  const played = s.piles.hand[idx];

  // Equipment cards
  if (played.type === 'equipment' && played.equipmentId) {
    const equipmentData = getEquipmentById(played.equipmentId);
    let equipmentInstalled = false;

    if (equipmentData) {
      const alreadyEquipped = (s.equipped || []).some(eq => eq.id === equipmentData.id);
      if (!alreadyEquipped) {
        const currentSlotUsage = (s.equipped || []).reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
        const maxSlots = (s.equipmentSlotsMax || 1) + (s.equipmentTempSlots || 5);
        const cardSlotCost = played.slotCost || equipmentData.slotCost || 1;
        if (currentSlotUsage + cardSlotCost <= maxSlots) {
          s.equipped = s.equipped || [];
          s.equipped.push({ ...equipmentData, temporary: true } as any);
          equipmentInstalled = true;
          s.log.push(`Equipped: ${equipmentData.name}`);
        }
      }
    }

    const [c] = s.piles.hand.splice(idx, 1);
    if (!equipmentInstalled) s.piles.discard.push(c);
    s.log.push(`Played ${played.name}${equipmentInstalled ? ' (equipped)' : ' (failed)'}`);
    return { state: s, rng: r };
  }

  // Energy check
  const cost = Math.max(0, Math.floor(typeof (played as any).cost === 'number' ? (played as any).cost : 0));
  if (cost > 0) {
    const cur = s.player.energy ?? 0;
    if (cur < cost) {
      s.log.push(`Not enough energy (need ${cost}).`);
      return { state: s, rng: r };
    }
    s.player.energy = cur - cost;
  }

  applyCardEffect(s, idx);
  runEquipmentCardPlayed(s, played, 'player');

  try {
    for (const b of (s.blessings ?? [])) {
      const fns = getCardPlayedFns(b, played);
      const tc = { state: s };
      for (const f of fns) f(tc as any, played);
    }
  } catch (e: any) {
    s.log.push(`Blessing error: ${e?.message ?? String(e)}`);
  }

  const [c] = s.piles.hand.splice(idx, 1);
  if ((played as any).exhaust) {
    s.piles.exhaust.push(c);
    s.log.push(`Played ${played.name} (Exhausted)`);
  } else {
    s.piles.discard.push(c);
    s.log.push(`Played ${played.name}`);
  }

  if ((played as any).draw && (played as any).draw > 0) {
    const target = s.piles.hand.length + (played as any).draw;
    ({ state: s, rng: r } = drawUpTo(s, r, target));
  }

  if (isVictory(s)) {
    r = grantExpAndQueueLevelUp(s, r);
    s.combatVictoryLock = true;
    const { clearAllMinions } = require('../../minionRuntime');
    clearAllMinions(s);
    if (s.levelUp && !s.levelUp.consumed) {
      s.phase = 'levelup';
      s.log.push('Level Up!');
    } else {
      s.phase = 'victory';
      s.log.push('Victory!');
    }
  }
  return { state: s, rng: r };
}

export function endTurn(s: GameState, cmd: Extract<Command, { type: 'EndTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };

  const { processStatusEffectsOnTurnEnd } = require('../../statusEffectsRuntime');
  const { processMinionsEndTurn } = require('../../minionRuntime');

  processStatusEffectsOnTurnEnd('player', s);
  processMinionsEndTurn(s);
  runEquipmentTurnHook(s, 'on_turn_end', 'player');

  const enemyHandlers = require('./enemy');
  if (s.enemy && s.enemyPiles) {
    s.enemyEnergy = s.enemy.maxEnergy || 2;

    if (s.enemyPiles.hand.length === 0) {
      enemyHandlers.enemyDrawUpToHand(s);
    }
    s.enemyLastPlayed = [...s.enemyPiles.hand];

    endEnemyTurn(s);
  } else {
    endEnemyTurn(s);
  }

  if (isVictory(s)) {
    r = grantExpAndQueueLevelUp(s, r);
    s.combatVictoryLock = true;
    const { clearAllMinions } = require('../../minionRuntime');
    clearAllMinions(s);
    if (s.levelUp && !s.levelUp.consumed) {
      s.phase = 'levelup';
      s.log.push('Level Up!');
    } else {
      s.phase = 'victory';
      s.log.push('Victory!');
    }
    return { state: s, rng: r };
  }

  if (isDefeat(s)) {
    loseRun(s);
    s.log.push('Defeat..');
    const { clearAllMinions } = require('../../minionRuntime');
    clearAllMinions(s);
    s.equipmentTempSlots = 0;
    if (s.equipped) {
      s.equipped = s.equipped.filter(eq => !eq.temporary);
    }
    return { state: s, rng: r };
  }

  runBlessingsTurnHook(s, 'on_turn_end');
  s.turn = 1;

  return { state: s, rng: r };
}

export function startPlayerTurnHandler(s: GameState, _cmd: Extract<Command, { type: 'StartPlayerTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };
  ({ state: s, rng: r } = startPlayerTurn(s, r));
  resetBlessingTurnFlags(s);
  runBlessingsTurnHook(s, 'on_turn_start');
  return { state: s, rng: r };
}

export function start(s: GameState, cmd: Extract<Command, { type: 'StartCombat' }>, r: RNG) {
  startCombat(s, cmd.monsterId, r);

  ({ state: s, rng: r } = startPlayerTurn(s, r));

  return { state: s, rng: r };
}

// Kept for apply.ts compatibility — legacy endTurn handles all enemy card playing
export function enemyPlayCard(s: GameState, _cmd: Extract<Command, { type: 'EnemyPlayCard' }>, r: RNG) {
  return { state: s, rng: r };
}

export function startMonsterTurn(s: GameState, _cmd: Extract<Command, { type: 'StartMonsterTurn' }>, r: RNG) {
  return { state: s, rng: r };
}

/**
 * ทำเทิร์นศัตรูทั้งเทิร์นจบในทีเดียว แล้วคายผลออกมาทาง s.pendingEvents
 *
 * เดิมงานนี้ถูกแยกเป็น PrepareEnemyTurn + ResolveEnemyCard ทีละใบ โดยให้ view
 * ตั้ง setTimeout ยิง dispatch ตามจังหวะอนิเมชั่น ทำให้กฎเกมผูกกับเวลาของอนิเมชั่น
 * (จูนอนิเมชั่นแล้วดาเมจเลื่อนตาม, JS thread ดีเลย์แล้วภาพกับ state หลุดกัน)
 *
 * ตอนนี้ state ถูกคำนวณจนจบทันที ส่วน view เอา event ไปเล่นตามจังหวะของตัวเอง
 * จะเร่ง จะข้าม หรือออกจากจอกลางคัน ก็ไม่กระทบความถูกต้องของ state
 */
export function resolveEnemyTurn(s: GameState, _cmd: Extract<Command, { type: 'ResolveEnemyTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };

  const { processStatusEffectsOnTurnEnd } = require('../../statusEffectsRuntime');
  const { processMinionsEndTurn }         = require('../../minionRuntime');
  const { processEnemyTurnBehaviors }     = require('../../enemyBehaviorRuntime');
  const { expireCombos }                  = require('../../combat/combos');
  const { onPlayerTurnEnd }              = require('../../adaptiveAI');
  const { enemyDrawUpToHand, enemyDiscardHand } = require('./enemy');

  // จบเทิร์น player
  processStatusEffectsOnTurnEnd('player', s);
  processMinionsEndTurn(s);
  runEquipmentTurnHook(s, 'on_turn_end', 'player');
  runBlessingsTurnHook(s, 'on_turn_end');
  resetBlessingTurnFlags(s);
  expireCombos(s);
  onPlayerTurnEnd(s, { energyUsed: 0, blockGained: s.player.block });
  s.turn = 1;

  emit(s, { t: 'TurnEnded', who: 'player' });

  // ── เทิร์นศัตรู
  if (s.enemy && (s as any).enemyPiles) {
    (s as any).enemyEnergy = s.enemy.maxEnergy || 2;
    s.enemy.block = 0;

    // ศัตรูตัดสินใจ ณ ตอนที่ถึงตาจริง ไม่ใช่ตั้งแต่ท้ายเทิร์นก่อน
    //
    // เดิมต้องเลือกไว้ล่วงหน้าเพราะต้องเอาไปโชว์บนป้าย intent พอเลิกโชว์แล้ว
    // การเลื่อนมาตัดสินใจตรงนี้ดีกว่าในเชิงกฎเกม — ศัตรูเห็นกระดานจริงตอนนั้น
    // ทั้งการ์ดที่ผู้เล่นเพิ่งตั้งและเลือดที่เพิ่งเสีย ไม่ใช่ภาพเมื่อเทิร์นที่แล้ว
    planEnemyIntent(s);
    const toPlay: string[] = [...(s.enemyIntent?.cardIds ?? [])];

    s.enemyLastPlayed = toPlay;
    enemyDiscardHand(s);

    const { enemyCardById } = require('../../pack_enemy_cards');

    for (const cardId of toPlay) {
      // ผู้เล่นตายกลางคัน → หยุดทันที ใบที่เหลือไม่ถูกเล่น
      if (s.phase !== 'combat') break;

      const def = enemyCardById(cardId);
      if (!def) continue;

      emit(s, {
        t: 'EnemyCardRevealed',
        cardId,
        name: def.name ?? def.id,
        dmg: def.dmg ?? 0,
        block: def.block ?? 0,
      });

      if (def.type === 'attack' && (def.dmg ?? 0) > 0) {
        const result = dealDamage(s, {
          from: 'enemy',
          to: 'player',
          raw: def.dmg!,
          source: { kind: 'card', cardId: def.id },
        });
        s.log.push(`Enemy plays ${def.name ?? def.id}: -${result.hpLoss} HP`);
      } else if ((def.block ?? 0) > 0) {
        gainBlock(s, 'enemy', def.block ?? 0);
        s.log.push(`Enemy plays ${def.name ?? def.id}: +${def.block} block`);
      } else {
        s.log.push(`Enemy plays ${def.name ?? def.id}`);
      }

      if (isDefeat(s)) {
        loseRun(s);
        const { clearAllMinions } = require('../../minionRuntime');
        clearAllMinions(s);
      }
    }
  }

  emit(s, { t: 'TurnEnded', who: 'enemy' });

  // ไม่ประกาศแผนล่วงหน้าอีกแล้ว — ล้างทิ้งเพื่อไม่ให้ค้างเป็นข้อมูลเก่า
  s.enemyIntent = undefined;

  return { state: s, rng: r };
}
