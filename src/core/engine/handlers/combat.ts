// src/core/engine/handlers/combat.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { pickEnemy } from '../../pack';
import { buildAndShuffleDeck, drawUpTo, applyCardEffect, endEnemyTurn, isVictory, isDefeat, startPlayerTurn, startCombat } from '../../commands';
import { resetBlessingTurnFlags, runBlessingsTurnHook, getCardPlayedFns } from '../../blessingRuntime';
import { START_ENERGY } from '../../balance/core';
import { grantExpAndQueueLevelUp } from '../shared';
import { runEquipmentCardPlayed, runEquipmentTurnHook } from '../../equipmentRuntime';
import { getEquipmentById } from '../../pack';

export function play(s: GameState, cmd: Extract<Command, { type: 'PlayCard' }>, r: RNG) {
  if (s.phase !== 'combat' || s.combatVictoryLock) return { state: s, rng: r };
  const idx = cmd.index;
  if (idx < 0 || idx >= s.piles.hand.length) return { state: s, rng: r };
  const played = s.piles.hand[idx];

  // Handle equipment cards - install temporarily
  if (played.type === 'equipment' && played.equipmentId) {
    s.log.push(`DEBUG: Attempting to play equipment card: ${played.name} (ID: ${played.id})`);
    s.log.push(`DEBUG: Equipment ID to install: ${played.equipmentId}`);
    
    const equipmentData = getEquipmentById(played.equipmentId);
    let equipmentInstalled = false;
    
    if (!equipmentData) {
      s.log.push(`DEBUG: Equipment data not found for ID: ${played.equipmentId}`);
    } else {
      s.log.push(`DEBUG: Equipment data found: ${equipmentData.name} (ID: ${equipmentData.id})`);
      
      // Check if already equipped (either permanently or temporarily)
      const alreadyEquipped = (s.equipped || []).some(eq => eq.id === equipmentData.id);
      s.log.push(`DEBUG: Already equipped? ${alreadyEquipped}`);
      s.log.push(`DEBUG: Current equipped: [${(s.equipped || []).map(eq => `${eq.name}(${eq.id})`).join(', ')}]`);
      
      if (!alreadyEquipped) {
        // Calculate slot usage - during combat, we have additional temporary slots
        const currentSlotUsage = (s.equipped || []).reduce((sum, eq) => sum + (eq.slotCost || 1), 0);
        const baseSlots = s.equipmentSlotsMax || 1;
        const tempSlots = s.equipmentTempSlots || 5; // Default 5 temp slots during combat
        const maxSlots = baseSlots + tempSlots;
        const cardSlotCost = played.slotCost || equipmentData.slotCost || 1;
        
        s.log.push(`DEBUG: Slot check - Current: ${currentSlotUsage}, Base: ${baseSlots}, Temp: ${tempSlots}, Total: ${maxSlots}, Need: ${cardSlotCost}`);
        
        if (currentSlotUsage + cardSlotCost <= maxSlots) {
          // Install temporarily
          s.equipped = s.equipped || [];
          s.equipped.push({
            id: equipmentData.id,
            name: equipmentData.name,
            rarity: equipmentData.rarity,
            slotCost: equipmentData.slotCost,
            desc: equipmentData.desc,
            tags: equipmentData.tags,
            temporary: true // Mark as temporary
          } as any);
          
          equipmentInstalled = true;
          s.log.push(`Temporarily equipped: ${equipmentData.name || equipmentData.id}`);
          s.log.push(`DEBUG: Equipment count now ${s.equipped.length}, temp count: ${s.equipped.filter(eq => eq.temporary).length}`);
        } else {
          s.log.push(`DEBUG: Not enough equipment slots for ${equipmentData.name || equipmentData.id}`);
          s.log.push(`Not enough equipment slots for ${equipmentData.name || equipmentData.id}`);
        }
      } else {
        s.log.push(`DEBUG: ${equipmentData.name || equipmentData.id} is already equipped`);
        s.log.push(`${equipmentData.name || equipmentData.id} is already equipped`);
      }
    }
    
    // Equipment cards are removed from hand
    const [c] = s.piles.hand.splice(idx, 1);
    
    // If equipment was installed, remove the card completely (don't put in discard)
    // If equipment couldn't be installed, put in discard as normal
    if (!equipmentInstalled) {
      s.piles.discard.push(c);
    }
    
    s.log.push(`Played ${played.name}${equipmentInstalled ? ' (consumed)' : ' (failed)'}`);
    s.log.push(`DEBUG: Card ${equipmentInstalled ? 'REMOVED from game' : 'went to discard'}`);
    return { state: s, rng: r };
  }

  // energy paywall (basic=0, special>=1) - only for non-equipment cards
  const base = typeof (played as any).cost === 'number' ? (played as any).cost : 0;
  const cost = Math.max(0, Math.floor(base));
  if (cost > 0) {
    const cur = s.player.energy ?? 0;
    if (cur < cost) {
      s.log.push(`Not enough energy (need ${cost}).`);
      return { state: s, rng: r };
    }
    s.player.energy = cur - cost;
  }

  // effect
  console.log(`🔥 About to call applyCardEffect for card: ${played.name} (${played.id})`);
  applyCardEffect(s, idx);
  console.log(`🔥 Finished applyCardEffect for card: ${played.name}`);
// ★ แจ้งอุปกรณ์ว่า “ผู้เล่นเล่นการ์ด”
runEquipmentCardPlayed(s, played, 'player');
  // blessings on_card_played
  try {
    for (const b of (s.blessings ?? [])) {
      const fns = getCardPlayedFns(b, played);
      const tc = { state: s };
      for (const f of fns) f(tc as any, played);
    }
  } catch (e: any) {
    s.log.push(`Blessing error: ${e?.message ?? String(e)}`);
  }

  // move to discard or exhaust
  const [c] = s.piles.hand.splice(idx, 1);
  if ((played as any).exhaust) {
    s.piles.exhaust.push(c);
    s.log.push(`Played ${played.name} (Exhausted)`);
  } else {
    s.piles.discard.push(c);
    s.log.push(`Played ${played.name}`);
  }

  // on-play draw
  if ((played as any).draw && (played as any).draw > 0) {
    const target = s.piles.hand.length + (played as any).draw;
    ({ state: s, rng: r } = drawUpTo(s, r, target));
  }

  if (isVictory(s)) {
    r = grantExpAndQueueLevelUp(s, r);
    s.combatVictoryLock = true;
    
    // Clear minions on victory
    const { clearAllMinions } = require('../../minionRuntime');
    clearAllMinions(s);
    
    // Check if level up is pending - go to levelup phase first
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

export function endTurn(s: GameState, _cmd: Extract<Command, { type: 'EndTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };

  // Import status effects system
  const { processStatusEffectsOnTurnEnd } = require('../../statusEffectsRuntime');

  // Process status effects at end of player turn
  processStatusEffectsOnTurnEnd('player', s);

  // Process minions at end of turn (duration countdown, etc.)
  const { processMinionsEndTurn } = require('../../minionRuntime');
  processMinionsEndTurn(s);

  // ★ ปลายเทิร์นผู้เล่น → ยิงอุปกรณ์ก่อนสลับฝั่ง
  runEquipmentTurnHook(s, 'on_turn_end', 'player');

  // Enhanced enemy turn with sequential card playing
  const enemyHandlers = require('./enemy');
  if (s.enemy && s.enemyPiles) {
    console.log(`🎬 Starting enhanced enemy turn for ${s.enemy.id}`);

    // Reset enemy energy
    const maxEnergy = (s as any).enemyMaxEnergy || s.enemy.maxEnergy || 2;
    s.enemyEnergy = maxEnergy;
    console.log(`🔋 EndTurn: Setting enemy energy to ${maxEnergy}`);

    // Enemy draws up to hand size only if hand is empty
    if (s.enemyPiles.hand.length === 0) {
      enemyHandlers.enemyDrawUpToHand(s);
      console.log(`🎴 EndTurn: Enemy hand after draw:`, s.enemyPiles.hand);
    } else {
      console.log(`🎴 EndTurn: Enemy already has cards, skipping draw`);
    }

    // For specific monsters, use sequential turn instead of bulk AI
    const useSequentialTurn = ['phi-krasue'].includes(s.enemy.id);

    if (useSequentialTurn && s.enemyPiles.hand.length > 0) {
      console.log(`🎬 Using sequential turn for ${s.enemy.id}`);
      // Set monster turn state for sequential play
      (s as any).monsterSequentialTurn = {
        active: true,
        queue: [...s.enemyPiles.hand], // Copy all cards to queue
        currentIndex: 0,
        timer: Date.now()
      };

      // Don't run bulk endEnemyTurn - let UI handle sequential play
      return { state: s, rng: r };
    } else {
      console.log(`🤖 Using bulk AI turn for ${s.enemy.id}`);
      // Run standard enemy turn (bulk play all cards)
      endEnemyTurn(s);
    }
  } else {
    // Fallback if no enemy/piles
    endEnemyTurn(s);
  }
  
  // Check for victory after enemy turn
  if (isVictory(s)) {
    r = grantExpAndQueueLevelUp(s, r);
    s.combatVictoryLock = true;
    
    // Clear minions on victory
    const { clearAllMinions } = require('../../minionRuntime');
    clearAllMinions(s);
    
    // Check if level up is pending - go to levelup phase first
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
    s.phase = 'defeat';
    s.log.push('Defeat..');
    
    // Clear minions on defeat
    const { clearAllMinions } = require('../../minionRuntime');
    clearAllMinions(s);
    
    // Clear temporary equipment slots
    s.equipmentTempSlots = 0;
    
    // Remove temporary equipment on defeat
    if (s.equipped) {
      const permanentEquipment = s.equipped.filter(eq => !eq.temporary);
      const removedCount = s.equipped.length - permanentEquipment.length;
      s.equipped = permanentEquipment;
      if (removedCount > 0) {
        s.log.push(`Removed ${removedCount} temporary equipment`);
      }
    }
    
    return { state: s, rng: r };
  }
  runBlessingsTurnHook(s, 'on_turn_end');
  s.turn = 1;
  ({ state: s, rng: r } = startPlayerTurn(s, r));
  resetBlessingTurnFlags(s);
  runBlessingsTurnHook(s, 'on_turn_start');
  return { state: s, rng: r };
}

export function start(s: GameState, cmd: Extract<Command, { type: 'StartCombat' }>, r: RNG) {
  startCombat(s, cmd.monsterId, r);

  // Start first player turn
  return startPlayerTurn(s, r);
}

export function enemyPlayCard(s: GameState, cmd: Extract<Command, { type: 'EnemyPlayCard' }>, r: RNG) {
  console.log(`🎮 EnemyPlayCard called - cardIndex: ${cmd.cardIndex}`);
  console.log(`🎮 Current enemyPiles.hand:`, s.enemyPiles?.hand);
  console.log(`🎮 Enemy energy:`, (s as any).enemyEnergy);

  // TEMP FIX: Force set energy for testing
  if ((s as any).enemyEnergy === 0 || (s as any).enemyEnergy === undefined) {
    console.log(`🔧 TEMP FIX: Setting enemy energy to 5 for testing`);
    (s as any).enemyEnergy = 5;
  }

  if (s.phase !== 'combat' || !s.enemy || !s.enemyPiles) {
    console.log(`🎮 Early exit - phase: ${s.phase}, enemy: ${!!s.enemy}, enemyPiles: ${!!s.enemyPiles}`);
    return { state: s, rng: r };
  }

  const cardIndex = cmd.cardIndex;
  const enemyHand = s.enemyPiles.hand;

  if (cardIndex < 0 || cardIndex >= enemyHand.length) {
    console.log(`Invalid enemy card index: ${cardIndex}, hand size: ${enemyHand.length}`);
    return { state: s, rng: r };
  }

  const enemyHandlers = require('./enemy');
  const success = enemyHandlers.enemyPlayCardId(s, cardIndex);

  if (success) {
    console.log(`Enemy successfully played card at index ${cardIndex}`);
  } else {
    console.log(`Enemy failed to play card at index ${cardIndex}`);
  }

  // Check if sequential turn is complete
  const sequentialTurn = (s as any).monsterSequentialTurn;
  if (sequentialTurn) {
    const remainingCards = s.enemyPiles.hand.length;
    console.log(`🎯 Sequential turn progress: ${sequentialTurn.queue.length - remainingCards}/${sequentialTurn.queue.length} cards played`);

    if (remainingCards === 0) {
      console.log(`🏮 Monster Sequential Turn complete`);
      (s as any).monsterSequentialTurn = null;
      ({ state: s, rng: r } = startPlayerTurn(s, r));
    }
  }

  return { state: s, rng: r };
}

// MonsterPlayCard removed - using EnemyPlayCard with cardIndex instead

export function startPlayerTurnHandler(s: GameState, _cmd: Extract<Command, { type: 'StartPlayerTurn' }>, r: RNG) {
  if (s.phase !== 'combat') return { state: s, rng: r };

  console.log(`🎯 StartPlayerTurn: Starting player turn`);
  return startPlayerTurn(s, r);
}

export function startMonsterTurn(s: GameState, _cmd: Extract<Command, { type: 'StartMonsterTurn' }>, r: RNG) {
  if (s.phase !== 'combat' || !s.enemy || !s.enemyPiles) return { state: s, rng: r };

  console.log('🎮 StartMonsterTurn: Beginning sequential monster card execution');

  // Set monster turn state
  (s as any).monsterTurnActive = true;
  (s as any).monsterCardQueue = [...s.enemyPiles.hand]; // Copy all cards to queue
  (s as any).monsterTurnTimer = Date.now(); // Start timer

  console.log(`🎮 Monster turn started with ${s.enemyPiles.hand.length} cards in queue`);

  return { state: s, rng: r };
}
