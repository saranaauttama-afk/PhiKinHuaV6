// src/core/engine/handlers/combat.ts — Legacy only (unified system removed)
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { pickEnemy } from '../../pack';
import { buildAndShuffleDeck, drawUpTo, applyCardEffect, endEnemyTurn, isVictory, isDefeat, startPlayerTurn, startCombat } from '../../commands';
import { resetBlessingTurnFlags, runBlessingsTurnHook, getCardPlayedFns } from '../../blessingRuntime';
import { planEnemyIntent } from '../../combat/intent';
import { START_ENERGY } from '../../balance/core';
import { grantExpAndQueueLevelUp, advanceAfterVictory } from '../shared';
import { runEquipmentCardPlayed, runEquipmentTurnHook } from '../../equipmentRuntime';
import { getEquipmentById } from '../../pack';
import { dealDamage, gainBlock, emit } from '../../combat/damage';
import { loseRun } from './runEnd';
import { isTrapCard, armTrap, springTraps, tickTraps } from '../../combat/traps';
import { effectiveCost, countCardPlayed, applyHeldEffects } from '../../cards/mechanics';
import { isCurseCard, discardCurses } from '../../cards/curse';
import { TEST_WIN_CARD_ID, testWinCardEnabled } from '../../cards/testWin';

/** Resolve deaths from helper/status/trap effects as well as direct played cards. */
function settleCombat(s: GameState, r: RNG): RNG {
  if (s.phase !== 'combat') return r;
  require('../../campaign/nights').awakenNightBoss(s);
  if (isDefeat(s)) {
    loseRun(s);
    require('../../minionRuntime').clearAllMinions(s);
  } else if (isVictory(s) && !s.combatVictoryLock) {
    r = grantExpAndQueueLevelUp(s, r);
    s.combatVictoryLock = true;
    require('../../minionRuntime').clearAllMinions(s);
    advanceAfterVictory(s);
  }
  return r;
}

export function play(s: GameState, cmd: Extract<Command, { type: 'PlayCard' }>, r: RNG) {
  if (s.phase !== 'combat' || s.combatVictoryLock) return { state: s, rng: r };

  const idx = cmd.index;
  if (idx < 0 || idx >= s.piles.hand.length) return { state: s, rng: r };
  const played = s.piles.hand[idx];
  if (played.id === TEST_WIN_CARD_ID) {
    if (!testWinCardEnabled() || !s.enemy) return { state: s, rng: r };
    countCardPlayed(s);
    s.piles.exhaust.push(s.piles.hand.splice(idx, 1)[0]);
    s.enemy.hp = 0;
    s.log.push('พระประธาน: ชนะการต่อสู้ทันที (ทดสอบ)');
    r = settleCombat(s, r);
    return { state: s, rng: r };
  }
  if(played.type==='attack'&&!require('../../statusEffectsRuntime').canPlayAttackCards(s))return {state:s,rng:r};

  // การ์ดคำสาปเล่นไม่ได้ — มันมีไว้ถ่วงมือ ทิ้งเองท้ายเทิร์น
  if (isCurseCard(played)) {
    s.log.push(`${played.name} เล่นไม่ได้`);
    return { state: s, rng: r };
  }

  // การ์ดดัก: จ่ายพลังงานแล้วไปนอนรอ ไม่เกิดผลทันที
  if (isTrapCard(played)) {
    const cost = effectiveCost(s, played);
    if ((s.player.energy ?? 0) < cost) {
      s.log.push(`พลังงานไม่พอ (ต้องการ ${cost})`);
      return { state: s, rng: r };
    }
    s.player.energy -= cost;
    countCardPlayed(s);
    require('../../combat/combos').applyComboCardModifiers(s,played);
    armTrap(s, played);
    const [tc] = s.piles.hand.splice(idx, 1);
    // การ์ดดักที่ตั้งไปแล้วไม่กลับเข้ากองจั่วในไฟต์นี้ — ไม่งั้นตั้งซ้ำได้ไม่จำกัด
    s.piles.exhaust.push(tc);
    return { state: s, rng: r };
  }

  // Equipment cards
  if (played.type === 'equipment' && played.equipmentId) {
    const cost=effectiveCost(s,played);if(cost>s.player.energy)return {state:s,rng:r};
    s.player.energy-=cost;countCardPlayed(s);
    require('../../combat/combos').applyComboCardModifiers(s,played);
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

  // Energy check — ค่าร่ายอ่านผ่าน `effectiveCost` ที่เดียว เพราะการ์ดบางใบ
  // ค่าร่ายลดลงตามจำนวนการ์ดที่เล่นไปแล้วในเทิร์นนี้ ถ้าตัวเลขบนหน้าจอกับ
  // ตัวเลขที่หักจริงมาคนละที่ ผู้เล่นจะวางแผนจากเลขที่โกหก
  const cost = effectiveCost(s, played);
  if (cost > 0) {
    const cur = s.player.energy ?? 0;
    if (cur < cost) {
      s.log.push(`Not enough energy (need ${cost}).`);
      return { state: s, rng: r };
    }
    s.player.energy = cur - cost;
  }
  // นับหลังจ่ายเรียบร้อย — ไม่งั้นการ์ดใบนี้จะลดค่าร่ายให้ตัวเอง
  countCardPlayed(s);

  const resolved=applyCardEffect(s, idx);
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

  if (resolved?.draw && resolved.draw > 0) {
    const target = s.piles.hand.length + resolved.draw;
    ({ state: s, rng: r } = drawUpTo(s, r, target));
  }

  require('../../campaign/nights').awakenNightBoss(s);
  if ((s.runMode === 'episode'||s.campaign) && s.enemyIntent) {
    require('../../combat/intent').refreshIntentEstimate(s);
  }
  r = settleCombat(s,r);
  return { state: s, rng: r };
}

/**
 * จบเทิร์นผู้เล่น — ส่งต่อให้ `resolveEnemyTurn` ทั้งดุ้น
 *
 * เดิมตรงนี้เป็นสำเนาที่สองของลำดับจบเทิร์นทั้งชุด และมันแตกออกจากกันไปเรื่อยๆ
 * ตามของที่เพิ่มเข้ามาทีหลัง — ไม่มีกับดักนับถอยหลัง ไม่มีการทิ้งคำสาป
 * ไม่มีคอมโบหมดอายุ ไม่มีการ์ดค้างมือ เกมจริงไม่เคยเรียก `EndTurn` เลยสักครั้ง
 * (`battle.tsx` ส่ง `ResolveEnemyTurn` ทางเดียว) มีแต่เทสต์ที่ยังเรียก —
 * ซึ่งแปลว่าเทสต์กำลังตรวจเส้นทางที่เกมไม่ได้ใช้
 */
export function endTurn(s: GameState, _cmd: Extract<Command, { type: 'EndTurn' }>, r: RNG) {
  return resolveEnemyTurn(s, { type: 'ResolveEnemyTurn' }, r);
}

export function startPlayerTurnHandler(s: GameState, _cmd: Extract<Command, { type: 'StartPlayerTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };
  s.turn=(s.turn??1)+1;
  require('../../combat/combos').expireCombos(s);
  ({ state: s, rng: r } = startPlayerTurn(s, r));
  resetBlessingTurnFlags(s);
  runBlessingsTurnHook(s, 'on_turn_start');
  r = settleCombat(s, r);
  if (s.phase === 'combat' && (s.runMode === 'episode'||s.campaign)) planEnemyIntent(s);
  return { state: s, rng: r };
}

export function start(s: GameState, cmd: Extract<Command, { type: 'StartCombat' }>, r: RNG) {
  startCombat(s, cmd.monsterId, r);
  s.turn = 1;

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
  // การ์ดที่ยังค้างอยู่ในมือทำงานก่อนเทิร์นศัตรู — ทั้งหมดของกลไกนี้คือ
  // "ถือไว้แล้วมันกันให้" ถ้าไปทำงานหลังโดนตีแล้วก็ไม่มีความหมาย
  applyHeldEffects(s);
  tickTraps(s);
  discardCurses(s);
  runEquipmentTurnHook(s, 'on_turn_end', 'player');
  runBlessingsTurnHook(s, 'on_turn_end');
  resetBlessingTurnFlags(s);
  expireCombos(s);
  onPlayerTurnEnd(s, { energyUsed: 0, blockGained: s.player.block });


  emit(s, { t: 'TurnEnded', who: 'player' });
  r = settleCombat(s, r);
  if (s.phase !== 'combat') return { state: s, rng: r };

  // ── เทิร์นศัตรู
  if (s.enemy && (s as any).enemyPiles) {
    (s as any).enemyEnergy = s.enemy.maxEnergy || 2;
    s.enemy.energy=(s as any).enemyEnergy;
    s.enemy.block = 0;
    require('../../statusEffectsRuntime').processStatusEffectsOnTurnStart('enemy',s);
    r=settleCombat(s,r);
    if(s.phase!=='combat')return {state:s,rng:r};

    require('../../minionRuntime').processEnemyTurnMinions(s);
    r = settleCombat(s, r);
    if (s.phase !== 'combat') { emit(s, { t: 'TurnEnded', who: 'enemy' }); return { state: s, rng: r }; }

    // ศัตรูตัดสินใจ ณ ตอนที่ถึงตาจริง ไม่ใช่ตั้งแต่ท้ายเทิร์นก่อน
    //
    // เดิมต้องเลือกไว้ล่วงหน้าเพราะต้องเอาไปโชว์บนป้าย intent พอเลิกโชว์แล้ว
    // การเลื่อนมาตัดสินใจตรงนี้ดีกว่าในเชิงกฎเกม — ศัตรูเห็นกระดานจริงตอนนั้น
    // ทั้งการ์ดที่ผู้เล่นเพิ่งตั้งและเลือดที่เพิ่งเสีย ไม่ใช่ภาพเมื่อเทิร์นที่แล้ว
    // The episode commits to the displayed cards. Full runs retain existing AI.
    if ((s.runMode !== 'episode'&&!s.campaign) || !s.enemyIntent) planEnemyIntent(s);
    const toPlay: string[] = [...(s.enemyIntent?.cardIds ?? [])];

    s.enemyLastPlayed = [];
    enemyDiscardHand(s);
    s.enemy.handCount=toPlay.length;

    const { enemyCardById } = require('../../pack_enemy_cards');

    for (const [playIndex,cardId] of toPlay.entries()) {
      // ผู้เล่นตายกลางคัน → หยุดทันที ใบที่เหลือไม่ถูกเล่น
      if (s.phase !== 'combat') break;

      const def = enemyCardById(cardId);
      if (!def) continue;

      const cost=def.energyCost??1;
      if(cost>(s as any).enemyEnergy)continue;
      (s as any).enemyEnergy-=cost;
      s.enemy.energy=(s as any).enemyEnergy;s.enemy.handCount=toPlay.length-playIndex-1;
      s.enemyLastPlayed.push(cardId);
      emit(s, {
        t: 'EnemyCardRevealed',
        ownerId:s.enemy.id,
        cardId,
        name: def.name ?? def.id,
        dmg: def.dmg ?? 0,
        hits: def.hits,
        desc: def.desc,
        block: def.block ?? 0,
        cost: def.energyCost ?? 1,
      });

      // กับดักที่ตั้งไว้ทำงานก่อนการ์ดของศัตรูจะมีผล — ดักที่ยกเลิกได้
      // ต้องยกเลิกก่อนดาเมจเข้า ไม่งั้นมันคือการ "ยกเลิกหลังโดนแล้ว"
      const trapped = springTraps(s, def.type === 'attack' ? 'attack' : 'skill');
      r = settleCombat(s, r);
      if (s.phase !== 'combat') break;
      if (trapped.negated) {
        s.log.push(`${def.name ?? def.id} ถูกขัดจังหวะ`);
        continue;
      }

      require('../../combat/enemyCardEffects').resolveEnemyCard(s, def);

      r = settleCombat(s, r);
    }
  }

  if(s.phase==='combat'){processStatusEffectsOnTurnEnd('enemy',s);r=settleCombat(s,r);}
  // Visible escalation rewards closing the fight rather than healing indefinitely.
  const escalation=require('../../campaign/nights').nightEscalation(s)??(s.runMode==='episode'?{every:3,strength:2}:undefined);
  if(s.phase==='combat' && escalation && s.turn%escalation.every===0){
    require('../../statusEffectsRuntime').applyStatusEffect('enemy',s,'strength',99,escalation.strength);
    s.log.push(`ผีคลุ้มคลั่ง: แข็งแกร่งเพิ่ม ${escalation.strength} จนจบไฟต์`);
  }
  if(s.enemy)s.enemy.handCount=0;
  emit(s, { t: 'TurnEnded', who: 'enemy' });

  // ไม่ประกาศแผนล่วงหน้าอีกแล้ว — ล้างทิ้งเพื่อไม่ให้ค้างเป็นข้อมูลเก่า
  s.enemyIntent = undefined;

  return { state: s, rng: r };
}
