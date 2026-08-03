// src/core/minionRuntime.ts — Minion Combat System

import type { GameState } from './types';
import type { MinionData } from './types_extended';
import { THAI_MINIONS } from './combat/minions/thai-minions';
import { applyStatusEffect } from './statusEffectsRuntime';
import { makeDeterministicId, nextStateRng, pickFrom } from './rngState';

// ===== ผีที่ถูกเรียกมาในไฟต์นี้ =====
//
// **เคยเป็นอาร์เรย์ระดับโมดูล** — บั๊กชนิดเดียวกับที่ adaptiveAI เคยเป็นก่อน
// Phase 5: ไม่ได้อยู่ใน `GameState` จึงไม่ถูกเซฟ ไม่ถูกโคลนตอน `applyCommand`
// และ **ค้างข้ามรัน** (มันถูกล้างตอนเริ่มไฟต์เท่านั้น ระหว่างนั้นเป็นของกลาง
// ที่ทุก state ใช้ร่วมกัน) ตอนนี้อยู่ใน `state.minions` ตัวเดียว
//
// ฟังก์ชันอ่านค่าทุกตัวรับ `state` แล้ว — ไม่มีทางลัดที่อ่านของกลางได้อีก

function pool(state: GameState): MinionData[] {
  return (state.minions ??= []);
}

export function getActiveMinions(state: GameState): MinionData[] {
  return [...pool(state)];
}

export function getPlayerMinions(state: GameState): MinionData[] {
  return pool(state).filter(m => m.owner === 'player');
}

export function getEnemyMinions(state: GameState): MinionData[] {
  return pool(state).filter(m => m.owner === 'enemy');
}

// ===== Minion Summoning =====

export function summonMinion(
  state: GameState,
  minionId: string,
  owner: 'player' | 'enemy',
  count: number = 1
): void {
  const minionTemplate = THAI_MINIONS[minionId];
  if (!minionTemplate) {
    state.log.push(`❌ Unknown minion: ${minionId}`);
    console.log('Available minions:', Object.keys(THAI_MINIONS));
    return;
  }
  
  // Debug: console.log(`🔄 Summoning ${count}x ${minionId} for ${owner}`);
  state.log.push(`🔄 Attempting to summon ${count}x ${minionTemplate.name} for ${owner}`);

  for (let i = 0; i < count; i++) {
    // Create unique minion instance
    const minion: MinionData = {
      ...minionTemplate,
      // id ต้องไม่ซ้ำและซ้ำได้ตาม seed — Date.now() ทำให้รันเดิมได้ id คนละชุด
      id: makeDeterministicId(state, minionId),
      owner,
      statusEffects: []
    };

    pool(state).push(minion);
    
    const ownerName = owner === 'player' ? 'Player' : state.enemy?.name || 'Enemy';
    const abilitySummary = minion.abilities.map(a => a.description).join(', ');
    state.log.push(`✨ ${ownerName} summons ${minion.name}! (${minion.duration} turns, ${abilitySummary})`);
  }

  // Check summoning limits
  const ownerMinions = pool(state).filter(m => m.owner === owner);
  const maxMinions = owner === 'player' ? 3 : (state.enemy ? getEnemyMaxMinions(state) : 2); // Reduced limits
  
  if (ownerMinions.length > maxMinions) {
    // Remove oldest minions if over limit
    const excessCount = ownerMinions.length - maxMinions;
    const toRemove = ownerMinions.slice(0, excessCount);
    
    for (const minion of toRemove) {
      removeMinion(state, minion.id);
      state.log.push(`💀 ${minion.name} is dismissed due to minion limit (${maxMinions} max)`);
    }
  }
  
  // ★ Sync minions to state for UI
}

function getEnemyMaxMinions(state: GameState): number {
  if (!state.enemy) return 3;
  
  // Default max minions for enemies - can be customized later
  return 3;
}

// ===== Minion Management =====

export function removeMinion(state: GameState, minionId: string): boolean {
  const index = pool(state).findIndex(m => m.id === minionId);
  if (index >= 0) {
    const removed = pool(state).splice(index, 1)[0];
    state.log.push(`💀 ${removed.name} is removed from battle`);
    return true;
  }
  return false;
}

export function clearAllMinions(state: GameState, owner?: 'player' | 'enemy'): void {
  const toRemove = owner
    ? pool(state).filter(m => m.owner === owner)
    : [...pool(state)];

  if (toRemove.length > 0) {
    // Clear without individual logging to avoid spam
    state.minions = owner
      ? pool(state).filter(m => m.owner !== owner)
      : [];
    
    const ownerText = owner ? `${owner} ` : '';
    state.log.push(`🧹 All ${ownerText}minions cleared from battle`);
  }
}

// ===== Minion Combat Actions =====

export function processMinionTurn(state: GameState, owner: 'player' | 'enemy'): void {
  const minions = pool(state).filter(m => m.owner === owner);
  if (!minions.length) return;

  const targetOwner = owner === 'player' ? 'enemy' : 'player';
  const target = targetOwner === 'player' ? state.player : state.enemy;
  
  if (!target) return;

  state.log.push(`⚔️ ${owner === 'player' ? 'Player' : 'Enemy'} minions attack!`);

  for (const minion of minions) {
    processMinionAction(state, minion, target, targetOwner);
  }
}

function processMinionAction(
  state: GameState,
  minion: MinionData,
  target: any,
  targetType: 'player' | 'enemy'
): void {
  // Debug: console.log(`🔥 Processing ${minion.name} with ${minion.abilities.length} abilities`);
  
  // Process all minion abilities
  for (const ability of minion.abilities) {
    if (ability.trigger === 'turn_start') {
      processMinionAbility(state, minion, ability, target, targetType);
    }
  }
}

function processMinionAbility(
  state: GameState,
  minion: MinionData,
  ability: any,
  target: any,
  targetType: 'player' | 'enemy'
): void {
  // Debug: console.log(`🔥 Processing ability: ${ability.type} -> ${ability.target} (value: ${ability.value})`);
  
  // Determine actual target based on ability.target and minion.owner
  let actualTarget = target;
  let actualTargetType = targetType;
  
  if (ability.target === 'owner') {
    actualTarget = minion.owner === 'player' ? state.player : state.enemy;
    actualTargetType = minion.owner;
  }
  
  // Safety check - if no target, skip this ability
  if (!actualTarget) {
    state.log.push(`⚠️ ${minion.name} ability skipped - no target available`);
    return;
  }
  
  switch (ability.type) {
    case 'attack':
      dealMinionDamage(
        state, minion, actualTarget, actualTargetType,
        ability.value, !!ability.ignores_block
      );
      break;
      
    case 'heal':
      if (actualTarget.hp !== undefined && actualTarget.maxHp !== undefined) {
        const oldHp = actualTarget.hp;
        actualTarget.hp = Math.min(actualTarget.maxHp, actualTarget.hp + ability.value);
        const healed = actualTarget.hp - oldHp;
        state.log.push(`💚 ${minion.name} ${ability.description} (+${healed} HP)`);
      }
      break;
      
    case 'energy':
      if (actualTargetType === 'player') {
        state.player.energy += ability.value;
        state.log.push(`⚡ ${minion.name} grants ${ability.value} energy`);
      }
      break;
      
    case 'draw':
      if (actualTargetType === 'player') {
        // Draw cards using existing system
        const { drawUpTo } = require('./commands');
        const currentHand = state.piles?.hand?.length || 0;
        const targetHand = Math.min(currentHand + ability.value, state.player.maxHandSize || 7);
        
        if (targetHand > currentHand && state.piles) {
          // เดิมเป็น `{ seed: Math.random() }` ซึ่งผิดรูปแบบของ RNG จริง (`{ s: number }`)
          // ทำให้ rng.s เป็น undefined — การจั่วเลยไม่ได้สุ่มจริงและไม่ผูกกับ seed
          // TS จับไม่ได้เพราะ drawUpTo ถูกดึงผ่าน require() ซึ่งเป็น any
          const result = drawUpTo(state, nextStateRng(state), targetHand);
          Object.assign(state, result.state);
          state.log.push(`🎴 ${minion.name} grants card draw (+${targetHand - currentHand} cards)`);
        } else {
          state.log.push(`🎴 ${minion.name} grants card draw (no piles available)`);
        }
      }
      break;
      
    case 'block':
      if (actualTargetType === 'player') {
        state.player.block += ability.value;
        state.log.push(`🛡️ ${minion.name} grants ${ability.value} block`);
      }
      break;
      
    case 'status':
      if (ability.effect) {
        const { applyStatusEffect } = require('./statusEffectsRuntime');
        applyStatusEffect(actualTargetType, state, ability.effect as any, ability.duration || 1, ability.value || 1);
        state.log.push(`✨ ${minion.name} applies ${ability.effect} to ${actualTargetType}`);
      }
      break;
      
    // New status effect abilities
    case 'damage_over_time':
      const dotDamage = ability.value;
      // Apply damage through block system like normal damage
      dealMinionDamage(state, minion, actualTarget, actualTargetType, dotDamage);
      break;
      
    case 'modify_damage':
      // This would be handled during damage calculation - just log for now
      const modifier = ability.modifyType === 'multiply' ? `x${ability.value}` : 
                     ability.modifyType === 'reduce' ? `-${ability.value}` : `+${ability.value}`;
      state.log.push(`⚡ ${minion.name} modifies damage (${modifier})`);
      break;
      
    case 'block_cards':
      // This would be handled during card play validation - just log for now
      const blockedTypes = ability.cardTypes?.join(', ') || 'cards';
      state.log.push(`🚫 ${minion.name} blocks ${blockedTypes} this turn`);
      break;
      
    case 'cleanse': {
      // เดิมล้าง "minion ที่เป็นสถานะปลอม" — ระบบสถานะชุดที่สองที่ซ้อนอยู่กับ
      // `statusEffects` ตัวจริง สถานะปลอมถูกลบทิ้งแล้ว จึงล้างของจริงแทน
      const { clearAllStatusEffects } = require('./statusEffectsRuntime');
      clearAllStatusEffects(actualTargetType, state, 'debuff');
      break;
    }
  }
}

function dealMinionDamage(
  state: GameState,
  minion: MinionData,
  target: any,
  targetType: 'player' | 'enemy',
  damage: number,
  ignoresBlock = false
): void {
  // minion เป็นคนละตัวกับผู้เรียก → ไม่สืบทอด strength ของผู้เรียก
  // แต่ผู้รับที่ติด vulnerable ยังกินเพิ่มตามปกติ (ดู rulesFor ใน combat/damage.ts)
  const { dealDamage } = require('./combat/damage');
  const result = dealDamage(state, {
    from: targetType === 'player' ? 'enemy' : 'player',
    to: targetType,
    raw: damage,
    source: { kind: 'minion', minionId: minion.id, ignoresBlock },
  });

  if (result.blocked > 0) {
    state.log.push(
      `🛡️ ${targetType} blocks ${result.blocked} damage from ${minion.name} (${target.block} block remaining)`
    );
  }
  if (result.hpLoss > 0) {
    const suffix = ignoresBlock ? ' (ignores block)' : '';
    state.log.push(`⚔️ ${minion.name} deals ${result.hpLoss} damage to ${targetType}!${suffix}`);
  }
}

// ===== Minion Duration & Status Processing =====

export function processMinionsEndTurn(state: GameState): void {
  const remainingMinions: MinionData[] = [];
  
  for (const minion of pool(state)) {
    // Process status effects on minions
    if (minion.statusEffects?.length) {
      // Simplified status processing for minions
      minion.statusEffects = minion.statusEffects.filter(effect => {
        effect.duration -= 1;
        return effect.duration > 0;
      });
    }
    
    // Check duration (all minions now have duration)
    minion.duration -= 1;
    
    if (minion.duration <= 0) {
      state.log.push(`⏰ ${minion.name} duration expires and fades away`);
      continue; // Don't add to remaining minions
    } else if (minion.duration <= 2) {
      state.log.push(`⏰ ${minion.name} will fade in ${minion.duration} turns`);
    }
    
    remainingMinions.push(minion);
  }
  
  state.minions = remainingMinions;
}

// ===== Minion Damage Taking =====
// Note: Minions now use duration instead of HP system

export function damageMinionsByOwner(
  state: GameState,
  owner: 'player' | 'enemy',
  damage: number
): void {
  const minions = pool(state).filter(m => m.owner === owner);
  if (!minions.length) return;
  
  // Reduce duration of random minion instead of HP
  const targetMinion = pickFrom(state, minions)!;
  const durationLoss = Math.min(damage, targetMinion.duration);
  targetMinion.duration = Math.max(0, targetMinion.duration - durationLoss);
  
  state.log.push(`💥 ${targetMinion.name} is disrupted, losing ${durationLoss} turn(s)! (${targetMinion.duration} turns remaining)`);
  
  if (targetMinion.duration <= 0) {
    state.log.push(`💀 ${targetMinion.name} is disrupted and fades away!`);
  }
}

// ===== Integration Helpers =====

export function initializeCombatMinions(state: GameState): void {
  // เริ่มไฟต์ใหม่ = ไม่มีผีตกค้างจากไฟต์ก่อน
  state.minions = [];
  state.log.push('🧹 Combat area cleared of minions');
}

export function processPlayerTurnMinions(state: GameState): void {
  // Debug logs commented out for production
  // console.log(`🔥 processPlayerTurnMinions called`);
  const playerMinions = getPlayerMinions(state);
  // console.log(`🔥 Player minions count: ${playerMinions.length}`);
  // playerMinions.forEach((minion, i) => {
  //   console.log(`🔥 Minion ${i}: ${minion.name} (${minion.id}), Owner: ${minion.owner}`);
  // });
  
  processMinionTurn(state, 'player');
}

export function processEnemyTurnMinions(state: GameState): void {
  processMinionTurn(state, 'enemy');
}

// ===== Utility Functions =====

export function getMinionCount(state: GameState, owner?: 'player' | 'enemy'): number {
  if (owner) return pool(state).filter(m => m.owner === owner).length;
  return pool(state).length;
}

export function getMinionById(state: GameState, minionId: string): MinionData | undefined {
  return pool(state).find(m => m.id === minionId);
}

export function getAllMinionTypes(): Record<string, MinionData> {
  return THAI_MINIONS;
}

export function debugMinions(state: GameState): void {
  // Debug function - uncomment when needed
  // console.log('=== MINIONS DEBUG ===');
  // console.log('Active Minions:', pool(state).length);
  // console.log('Player Minions:', getPlayerMinions(state).map(m => `${m.name}(${m.duration} turns)`));
  // console.log('Enemy Minions:', getEnemyMinions(state).map(m => `${m.name}(${m.duration} turns)`));
}

export function processEnemyMinions(state: GameState): void {
  const enemyMinions = getEnemyMinions(state);
  if (!enemyMinions?.length) return;
  
  // Process enemy minion abilities (both attack and support)
  for (const minion of enemyMinions) {
    processMinionsAbilities(state, minion, 'enemy');
  }
}

export function processPlayerMinions(state: GameState): void {
  const playerMinions = getPlayerMinions(state);
  if (!playerMinions?.length) return;
  
  // Process player minion abilities (both attack and support)
  for (const minion of playerMinions) {
    processMinionsAbilities(state, minion, 'player');
  }
}

function processMinionsAbilities(state: GameState, minion: MinionData, owner: 'player' | 'enemy'): void {
  // Process minion abilities that trigger during turn
  for (const ability of minion.abilities) {
    if (ability.trigger === 'turn_start') {
      switch (ability.type) {
        case 'attack':
          if (ability.target === 'enemy') {
            // Attack the opponent
            const targetEntity = owner === 'player' ? state.enemy : state.player;
            const targetType = owner === 'player' ? 'enemy' : 'player';
            const damage = ability.value;
            
            if (targetEntity) {
              dealMinionDamage(
                state, minion, targetEntity, targetType,
                damage, !!ability.ignores_block
              );
            }
          }
          break;
          
        case 'status':
          if (ability.target === 'enemy' && ability.effect) {
            // Apply status to opponent
            const targetType = owner === 'player' ? 'enemy' : 'player';
            applyStatusEffect(targetType, state, ability.effect as any, ability.duration || 1, ability.value || 1);
            state.log.push(`${owner === 'player' ? '✨' : '👿'} ${minion.name} ${ability.description}`);
          } else if (ability.target === 'owner' && ability.effect) {
            // Apply status to self (owner)
            applyStatusEffect(owner, state, ability.effect as any, ability.duration || 1, ability.value || 1);
            state.log.push(`${owner === 'player' ? '✨' : '👿'} ${minion.name} ${ability.description}`);
          }
          break;
          
        case 'energy':
          if (ability.target === 'owner') {
            if (owner === 'player') {
              state.player.energy += ability.value;
              state.log.push(`✨ ${minion.name} ${ability.description} (+${ability.value} energy)`);
            } else {
              // Enemy AI will benefit from extra energy next turn
              state.log.push(`👿 ${minion.name} ${ability.description} (+${ability.value} energy for enemy)`);
            }
          }
          break;
          
        case 'block':
          if (ability.target === 'owner') {
            if (owner === 'player') {
              state.player.block += ability.value;
              state.log.push(`✨ ${minion.name} ${ability.description} (+${ability.value} block)`);
            } else if (state.enemy) {
              state.enemy.block += ability.value;
              state.log.push(`👿 ${minion.name} ${ability.description} (+${ability.value} block)`);
            }
          }
          break;
          
        case 'heal':
          if (ability.target === 'owner') {
            if (owner === 'player') {
              const healAmount = Math.min(ability.value, state.player.maxHp - state.player.hp);
              state.player.hp += healAmount;
              state.log.push(`✨ ${minion.name} ${ability.description} (+${healAmount} HP)`);
            } else if (state.enemy) {
              const healAmount = Math.min(ability.value, state.enemy.maxHp - state.enemy.hp);
              state.enemy.hp += healAmount;
              state.log.push(`👿 ${minion.name} ${ability.description} (+${healAmount} HP)`);
            }
          }
          break;
      }
    }
  }
}