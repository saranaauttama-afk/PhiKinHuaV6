// Commands — pure helpers used by reducer
// baseNewState, buildAndShuffleDeck, drawUpTo, startPlayerTurn, applyCardEffect,
// isVictory/isDefeat, endEnemyTurn
import type { CardData, GameState } from './types';
import { HAND_SIZE, START_ENERGY, START_DECK, START_GOLD, START_HP, nextExpForLevel } from './balance';
import { shuffle, type RNG } from './rng';
import { resetBlessingTurnFlags } from './blessingRuntime';
import { enemyCardById } from './pack_enemy_cards';
import type { EnemyCard } from './types';
import { resetEquipmentTurnFlags, runEquipmentTurnHook } from './equipmentRuntime';
import { THAI_GHOST_POOLS, type ThaiGhostData } from './monsters/thai-ghosts';

let _instanceCounter = 0;

// NOTE: We keep state updates pure by working on shallow copies of containers.
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function baseNewState(seed: string): GameState {
  return {
    seed,
    phase: 'start',
    turn: 0,
    player: {
      hp: START_HP, maxHp: START_HP, block: 0,
      energy: START_ENERGY, gold: START_GOLD,
      level: 1, exp: 0, expToNext: nextExpForLevel(1),
      maxEnergy: START_ENERGY, maxHandSize: HAND_SIZE,
    },
    enemy: undefined,
    fightCount: 0, // Track fights for boss encounters
    piles: { draw: [], hand: [], discard: [], exhaust: [] },
    log: [],
    // ✅ ฟิลด์ที่เพิ่มใน M2
    blessings: [],
    turnFlags: { blessingOnce: {} },
    runCounters: { removed: 0 },
    // rewardOptions: undefined,
    // map: undefined,
    shopStock: undefined,
    event: undefined,
    combatVictoryLock: false,    
    masterDeck: [],               // ✅ ใส่ค่าเริ่มต้นว่างไว้ เดี๋ยว NewRun จะตั้งจริง
    deckOpen: false,
    shopRegistry: [],
  };
}

function moveCard(from: CardData[], to: CardData[], idx: number) {
  const [c] = from.splice(idx, 1);
  to.push(c);
}

function maybeRefillDraw(state: GameState, rng: RNG): { state: GameState; rng: RNG } {
  if (state.piles.draw.length === 0 && state.piles.discard.length > 0) {
    const out = shuffle(rng, state.piles.discard);
    state.piles.draw = out.array;
    state.piles.discard = [];
    return { state, rng: out.rng };
  }
  return { state, rng };
}

// จั่ว 1 ใบแบบปลอดภัย (ไม่มีไพ่ให้จั่ว -> คืน drew=false)
function drawOne(s: GameState, rng: RNG): { state: GameState; rng: RNG; drew: boolean } {
  let r = rng;
  if (s.piles.draw.length === 0) {
    if (s.piles.discard.length === 0) {
      return { state: s, rng: r, drew: false };
    }
    const sh = shuffle(r, s.piles.discard);
    r = sh.rng;
    s.piles.draw = sh.array;
    s.piles.discard = [];
  }
  const c = s.piles.draw.shift();
  if (!c) return { state: s, rng: r, drew: false };
  s.piles.hand.push(c);
  return { state: s, rng: r, drew: true };
}

export function drawUpTo(s: GameState, rng: RNG, targetHandSize = HAND_SIZE): { state: GameState; rng: RNG } {
  let r = rng;
  let guard = 0;              // ฝากันลูปผิดพลาด
  const GUARD_MAX = 200;
  const startHand = s.piles.hand.length;
  while (s.piles.hand.length < targetHandSize && guard++ < GUARD_MAX) {
    const res = drawOne(s, r);
    r = res.rng;
    if (!res.drew) break;     // ไม่มีไพ่ให้จั่ว -> ออกทันที
  }
  const endHand = s.piles.hand.length;
  if (targetHandSize > 3) { // Only log when trying to draw more than default
    s.log.push(`Drew ${endHand - startHand} cards (${startHand}→${endHand}, target:${targetHandSize})`);
  }
  return { state: s, rng: r };
}

export function buildAndShuffleDeck(_state: GameState, _rng: RNG): { state: GameState; rng: RNG } {
  let state = _state;
  let rng = _rng;
  const source = state.masterDeck?.length ? state.masterDeck : START_DECK;
  const out = shuffle(rng, source);
  _instanceCounter = 0;
  state.piles = {
    draw: out.array.map(c => ({ ...c, instanceId: `${c.id}__${++_instanceCounter}` })),
    hand: [], discard: [], exhaust: [],
  };
  rng = out.rng;
  return { state, rng };
}

export function startPlayerTurn(state: GameState, rng: RNG): { state: GameState; rng: RNG } {
  // resetEquipmentTurnFlags(state);
  // state.player.energy = state.player.maxEnergy ?? START_ENERGY;
  // state.player.block = 0;
  // resetBlessingTurnFlags(state); // ✅ ให้พรแบบ once-per-turn ยิงได้ใหม่
  // return drawUpTo(state,rng ,state.player.maxHandSize ?? HAND_SIZE);
  // Import systems
  const { processStatusEffectsOnTurnStart } = require('./statusEffectsRuntime');
  const { processPlayerTurnMinions } = require('./minionRuntime');

  // ★ รีเซ็ต once-per-turn ของอุปกรณ์สำหรับเทิร์นใหม่นี้
  resetEquipmentTurnFlags(state);

  // ขั้นตอนพื้นฐาน
  state.player.energy = state.player.maxEnergy ?? START_ENERGY;
  state.player.block = 0;

  // Process status effects at start of turn
  processStatusEffectsOnTurnStart('player', state);

  const out = drawUpTo(state, rng, state.player.maxHandSize ?? HAND_SIZE);
  state = out.state; rng = out.rng;

  // ★ ยิง on_turn_start (ฝั่งผู้เล่น)
  runEquipmentTurnHook(state, 'on_turn_start', 'player');

  // Process player minions actions
  processPlayerTurnMinions(state);

  // เดิม: ให้พร reset ที่อื่นด้วย แต่ถ้าจะคงไว้ตรงนี้ก็ได้
  resetBlessingTurnFlags(state);

  return { state, rng };  
}

export function applyCardEffect(state: GameState, idxInHand: number) {
  const card = state.piles.hand[idxInHand];
  if (!card) return;
  
  console.log(`🔥 Playing card: ${card.id} (${card.name})`);
  console.log('🔥 Card object:', JSON.stringify(card, null, 2));
  state.log.push(`🎴 Playing ${card.name} (${card.id})`);
  
  // Import all advanced systems
  const { modifyCardCostForStatusEffects, modifyDamageForStatusEffects, canPlayAttackCards } = require('./statusEffectsRuntime');
  const { onPlayerCardPlayed, getAdaptiveDamageMultiplier } = require('./adaptiveAI');
  const { applyComboCardModifiers, onCardPlayedForCombos } = require('./cardComboSystem');
  
  // Check if attack cards can be played (entangle check)
  if (card.type === 'attack' && !canPlayAttackCards(state)) {
    state.log.push(`Cannot play attack cards while entangled`);
    return;
  }
  
  // ★ Apply combo system modifiers first
  const modifiedCard = applyComboCardModifiers(state, card);
  console.log('🔥 Modified card object:', JSON.stringify(modifiedCard, null, 2));
  
  // Note: Energy is already paid by combat handler
  console.log(`🔥 Energy already paid by combat handler`);

  // Effect - Damage with status effect modifications
  if (modifiedCard.dmg && state.enemy) {
    console.log(`🔥 Original card damage: ${modifiedCard.dmg}`);
    let modifiedDamage = modifyDamageForStatusEffects(state, modifiedCard.dmg, true); // true = player attack
    console.log(`🔥 After status effects: ${modifiedDamage}`);
    
    // Safety check for NaN
    if (isNaN(modifiedDamage)) {
      console.error('🔥 ERROR: modifiedDamage is NaN, using original damage');
      modifiedDamage = modifiedCard.dmg;
    }
    
    // Apply adaptive AI damage multiplier with safety check
    const adaptiveMult = getAdaptiveDamageMultiplier();
    let finalDamage;
    
    if (isNaN(adaptiveMult) || adaptiveMult === 0) {
      console.error('🔥 ERROR: adaptiveMult is invalid:', adaptiveMult);
      finalDamage = Math.round(modifiedDamage);
    } else {
      finalDamage = Math.round(modifiedDamage * (1 / adaptiveMult)); // Inverse for player damage
      
      // Final safety check
      if (isNaN(finalDamage)) {
        console.error('🔥 ERROR: finalDamage is NaN, using modifiedDamage directly');
        finalDamage = Math.round(modifiedDamage);
      }
    }
    
    // Apply damage through block system
    const blockBefore = state.enemy.block || 0;
    const blockAfter = Math.max(0, blockBefore - finalDamage);
    const hpLoss = Math.max(0, finalDamage - blockBefore);
    state.enemy.block = blockAfter;
    state.enemy.hp = Math.max(0, state.enemy.hp - hpLoss);
    
    if (blockBefore > 0) {
      state.log.push(`💥 ${finalDamage} damage vs ${blockBefore} block → ${hpLoss} HP lost, ${blockAfter} block remaining`);
    } else {
      state.log.push(`💥 ${finalDamage} damage dealt → ${hpLoss} HP lost`);
    }
    
    if (finalDamage !== card.dmg) {
      state.log.push(`Damage modified: ${card.dmg} → ${finalDamage}`);
    }
  }
  
  // Block effect
  if (modifiedCard.block) {
    state.player.block += modifiedCard.block;
  }
  
  // ✅ รองรับการ์ดที่ให้พลังงาน (เช่น Focus: energyGain = 1)
  if (modifiedCard.energyGain && modifiedCard.energyGain > 0) {
    state.player.energy += modifiedCard.energyGain;
    state.log.push(`Gained +${modifiedCard.energyGain} energy`);
  }
  
  console.log(`🔥 About to check summonMinion property...`);
  
  try {
    // ✅ รองรับการเรียก minion
    console.log(`🔥 Checking summonMinion property:`, modifiedCard.summonMinion);
    if (modifiedCard.summonMinion) {
      console.log(`🔥 Card ${card.id} has summonMinion:`, modifiedCard.summonMinion);
      const { summonMinion } = require('./minionRuntime');
      
      // ตรวจสอบ minionTarget สำหรับ status effects
      const minionTarget = (modifiedCard as any).minionTarget;
      let owner = 'player'; // Default owner
      
      if (minionTarget === 'enemy') {
        // สำหรับ status effects ที่กระทบศัตรู - minion จะมี owner เป็น 'enemy'
        owner = 'enemy';
      }
      
      summonMinion(state, modifiedCard.summonMinion, owner as 'player' | 'enemy', 1);
    } else {
      console.log(`🔥 Card ${card.id} does NOT have summonMinion property`);
    }
    
    // ✅ Special minion effects for specific cards
    if (card.id === 'hell_gate') {
      console.log('🔥 Hell gate special effect triggered');
      const { summonMinion } = require('./minionRuntime');
      summonMinion(state, 'demon_minion', 'player', 2);
    }
  } catch (error) {
    console.log(`🔥 ERROR in minion summoning:`, error);
    state.log.push(`Error in minion summoning: ${error}`);
  }
  
  // ✅ Status Effect cards (direct application)
  if ((modifiedCard as any).statusEffect) {
    const statusConfig = (modifiedCard as any).statusEffect;
    console.log(`🔥 Card ${card.id} applying status:`, statusConfig);
    
    try {
      const { applyStatusEffect } = require('./statusEffectsRuntime');
      const targetType = statusConfig.target; // 'enemy' or 'player'
      
      applyStatusEffect(
        targetType,
        state, 
        statusConfig.effect,    // e.g., 'poison'
        statusConfig.duration,  // e.g., 4
        statusConfig.value      // e.g., 3 stacks
      );
      
      state.log.push(`✨ ${card.name} applies ${statusConfig.effect} (${statusConfig.value} stacks) to ${targetType}`);
    } catch (error) {
      console.log(`🔥 ERROR applying status effect:`, error);
      state.log.push(`Error applying status effect: ${error}`);
    }
  }
  
  // ★ Trigger combo system after card effects
  onCardPlayedForCombos(state, modifiedCard);
  
  // ★ AI learning from player card usage
  onPlayerCardPlayed(state, modifiedCard);
  
  // draw will be handled by reducer after moving the card
}

export function isVictory(state: GameState): boolean {
  return !!state.enemy && state.enemy.hp <= 0;
}

export function isDefeat(state: GameState): boolean {
  return state.player.hp <= 0;
}

function playEnemyCard(s: GameState) {
  if (!s.enemy || !s.enemy.intentCardId) return;
  const card: EnemyCard | undefined = enemyCardById(s.enemy.intentCardId);
  if (!card) { s.log.push(`Enemy tries unknown card: ${s.enemy.intentCardId}`); return; }

  if (card.type === 'attack' && (card.dmg ?? 0) > 0) {
    const atk = Math.max(0, card.dmg!);
    const blockAfter = Math.max(0, s.player.block - atk);
    const hpLoss = Math.max(0, atk - s.player.block);
    s.player.block = blockAfter;
    s.player.hp = Math.max(0, s.player.hp - hpLoss);
    s.log.push(`Enemy plays ${card.name ?? card.id}: Attack ${atk} (${hpLoss} dmg).`);
  } else if (card.type === 'skill' && (card.block ?? 0) > 0) {
    s.enemy.block = (s.enemy.block ?? 0) + (card.block ?? 0);
    s.log.push(`Enemy plays ${card.name ?? card.id}: Block +${card.block}.`);
  } else {
    s.log.push(`Enemy plays ${card.name ?? card.id}.`);
  }
}

// helper เดิน pointer ไปไพ่ถัดไป
function stepNextEnemyCard(s: GameState) {
  const ai = s.enemy?.ai;
  if (!s.enemy || !ai || ai.cycle.length === 0) return;
  ai.index = (ai.index + 1) % ai.cycle.length;
  s.enemy.intentCardId = ai.cycle[ai.index];
}

export function endPlayerTurn(state: GameState) {
  // Process status effects at end of player turn (poison, regeneration, etc.)
  const { processStatusEffectsOnTurnEnd } = require('./statusEffectsRuntime');
  processStatusEffectsOnTurnEnd('player', state);
  processStatusEffectsOnTurnEnd('enemy', state);
}

export function endEnemyTurn(state: GameState) {
  // ★ Process all advanced systems before enemy turn
  const { processEnemyTurnBehaviors } = require('./enemyBehaviorRuntime');  
  const { onTurnEndForCombos } = require('./cardComboSystem');
  const { onPlayerTurnEnd } = require('./adaptiveAI');
  
  // Process combos and AI learning
  onTurnEndForCombos(state);
  onPlayerTurnEnd(state, { energyUsed: 0, blockGained: state.player.block });
  
  // (Environment system removed)
  
  // Process enemy minions and behaviors (check if function exists)
  try {
    const { processEnemyTurnMinions } = require('./minionRuntime');
    if (typeof processEnemyTurnMinions === 'function') {
      processEnemyTurnMinions(state);
    }
    processEnemyTurnBehaviors(state);
  } catch (e) {
    // Minion/behavior system not available, skip
  }
  
  // Run standard enemy turn
  const { runEnemyTurn } = require('./engine/handlers/enemy');
  runEnemyTurn(state);
}

// ===== START COMBAT =====
export function startCombat(state: GameState, monsterId: string, rng?: RNG) {
  // Find monster from Thai ghost pools
  const allMonsters = [
    ...THAI_GHOST_POOLS.T1,
    ...THAI_GHOST_POOLS.T2,
    ...THAI_GHOST_POOLS.T3,
    ...THAI_GHOST_POOLS.T4,
    ...THAI_GHOST_POOLS.T5,
    ...THAI_GHOST_POOLS.Elite,
    ...THAI_GHOST_POOLS.BossMid,
    ...THAI_GHOST_POOLS.BossFinal,
    ...THAI_GHOST_POOLS.SecretBoss
  ];

  const monsterData = allMonsters.find(m => m.id === monsterId);
  if (!monsterData) {
    console.error(`Monster not found: ${monsterId}`);
    return;
  }

  // Map monster to card deck owner
  function getCardOwnerForMonster(monsterId: string): string[] {
    // Map specific monsters to their card deck owners
    const monsterDeckMap: Record<string, string[]> = {
      'phi-krasue': ['global', 'phi-krasue'],
      'phi-pop': ['global', 'phi_pop'],
      'nang-tanee': ['global', 'spirit'],
      'phi-nang-ram': ['global', 'spirit'],
      'phi-pong-kang': ['global', 'spirit'],
      // Add more monster-deck mappings as needed
    };

    // Return specific deck or fallback to global
    return monsterDeckMap[monsterId] || ['global'];
  }

  // Initialize combat state
  state.phase = 'combat';
  state.enemy = {
    id: monsterData.id,
    name: monsterData.name,
    hp: monsterData.hp,
    maxHp: monsterData.hp,
    dmg: 5, // Default damage
    block: 0,
    ai: {
      cycle: ['attack', 'defend'],
      index: 0,
      // Add deck configuration for monster-specific cards
      deck: monsterId === 'phi-krasue'
        ? {
            // For phi-krasue: Use specific list to avoid duplicate IDs
            lists: [{
              id: 'phi-krasue-deck',
              weight: 1,
              cards: ['krasue_claw', 'krasue_guard', 'krasue_swipe'] // Only 3 unique cards
            }],
            handSize: 3,
            maxEnergy: 3
          }
        : {
            // For other monsters: Use pool system
            pool: {
              allowOwners: getCardOwnerForMonster(monsterId),
              minAttack: 1,
              minBlock: 1
            },
            handSize: 2,
            maxEnergy: 2
          }
    },
    intentCardId: null,
    maxEnergy: 3,
    handSize: 0,
    equipped: [],
    statusEffects: []
  };

  // Initialize enemy deck and hand
  state.enemyPiles = { draw: [], hand: [], discard: [] };
  state.enemyEnergy = 0;

  // Build player deck (only if RNG provided)
  if (rng) {
    buildAndShuffleDeck(state, rng);
    // Build enemy deck but DON'T draw initial hand yet (let EndTurn handle it)
    const enemyHandlers = require('./engine/handlers/enemy');
    const result = enemyHandlers.buildAndShuffleEnemyDeck(state, rng);
    rng = result.rng;
    console.log(`🎯 Enemy deck built, hand will be drawn on first EndTurn`);
  }

  console.log(`Combat started against ${monsterData.name} (HP: ${monsterData.hp})`);
}
