// src/core/adaptiveAI.ts — Advanced Adaptive AI System

import type { GameState } from './types';
import type { StatusEffectType } from './types_extended';

// ===== Player Pattern Analysis =====

export interface PlayerPattern {
  // Card Usage Patterns
  cardTypePreference: { [cardType: string]: number }; // attack, skill, equipment
  costDistribution: { [cost: number]: number }; // 0, 1, 2, 3+
  playStyle: 'aggressive' | 'defensive' | 'balanced' | 'combo';
  
  // Strategic Patterns
  blockingFrequency: number; // 0-1, how often player prioritizes defense
  energyEfficiency: number; // average energy used per turn
  cardDrawPreference: number; // preference for card draw effects
  
  // Status Effect Patterns
  statusUsage: { [statusId: string]: number };
  statusCountering: { [statusId: string]: number };
  
  // Combat Timing
  earlyGameStrategy: 'rush' | 'setup' | 'reactive';
  midGameStrategy: 'pressure' | 'control' | 'combo';
  lateGameStrategy: 'burst' | 'sustain' | 'desperation';
  
  // Weaknesses Identified
  weakToStatusTypes: StatusEffectType[];
  vulnerableToRush: boolean;
  overReliantOnBlock: boolean;
  lowHealthPanic: boolean;
}

export interface AIAdaptation {
  // Counter Strategies
  priorityBehaviors: string[]; // Behavior IDs to prioritize
  prioritySpells: string[]; // Spell IDs to prioritize
  statusFocus: StatusEffectType[]; // Status effects to emphasize
  
  // Tactical Adjustments
  aggressionLevel: number; // 0-100, how aggressive to be
  spellCastingPreference: number; // 0-100, preference for spells vs cards
  minionUsage: number; // 0-100, how often to summon minions
  
  // Difficulty Modifiers
  damageMultiplier: number; // 0.8-1.5
  healthMultiplier: number; // 0.8-1.3
  energyBonus: number; // 0-2 extra energy per turn
  spellChargeReduction: number; // 0-2 turns off spell casting time
  
  // Pattern Counters
  antiRushTactics: boolean;
  antiComboDisruption: boolean;
  blockCounters: boolean;
  statusCleansing: boolean;
}

// ===== AI State (เก็บใน GameState ไม่ใช่ระดับโมดูล) =====
//
// เดิม playerPatterns/currentAdaptation เป็น const ระดับโมดูล ทำให้:
//   - ไม่ถูก save (โหลดเกมกลับมาแล้ว AI ลืมทุกอย่าง)
//   - ไม่ผูกกับ seed (รันเดิมได้ผลต่างกัน)
//   - ค้างข้ามรันใน session เดียวกัน
// ตอนนี้ย้ายเข้า state.ai แล้ว โดยยังเข้าถึงผ่าน accessor เพื่อไม่ต้องแก้ทุกจุดที่ใช้

export type AIState = { patterns: PlayerPattern; adaptation: AIAdaptation };

const makePlayerPatterns = (): PlayerPattern => ({
  cardTypePreference: { attack: 0, skill: 0, equipment: 0 },
  costDistribution: { 0: 0, 1: 0, 2: 0, 3: 0 },
  playStyle: 'balanced',
  blockingFrequency: 0,
  energyEfficiency: 0,
  cardDrawPreference: 0,
  statusUsage: {},
  statusCountering: {},
  earlyGameStrategy: 'reactive',
  midGameStrategy: 'control',
  lateGameStrategy: 'sustain',
  weakToStatusTypes: [],
  vulnerableToRush: false,
  overReliantOnBlock: false,
  lowHealthPanic: false
});

const makeAdaptation = (): AIAdaptation => ({
  priorityBehaviors: [],
  prioritySpells: [],
  statusFocus: [],
  aggressionLevel: 50,
  spellCastingPreference: 50,
  minionUsage: 30,
  damageMultiplier: 1.0,
  healthMultiplier: 1.0,
  energyBonus: 0,
  spellChargeReduction: 0,
  antiRushTactics: false,
  antiComboDisruption: false,
  blockCounters: false,
  statusCleansing: false
});

export function createAIState(): AIState {
  return { patterns: makePlayerPatterns(), adaptation: makeAdaptation() };
}

function aiState(state: GameState): AIState {
  if (!state.ai) state.ai = createAIState();
  return state.ai;
}

const patternsOf   = (state: GameState) => aiState(state).patterns;
const adaptationOf = (state: GameState) => aiState(state).adaptation;

// ===== Player Pattern Learning =====

export function learnFromPlayerAction(
  state: GameState,
  actionType: 'card_played' | 'turn_end' | 'status_applied' | 'damage_taken',
  actionData: any
): void {
  const turnPhase = getTurnPhase(state);
  
  switch (actionType) {
    case 'card_played':
      learnCardUsagePattern(state, actionData.card, turnPhase);
      break;
      
    case 'turn_end':
      learnTurnPattern(state, actionData);
      break;
      
    case 'status_applied':
      learnStatusPattern(state, actionData.statusId, actionData.target);
      break;
      
    case 'damage_taken':
      learnDefensivePattern(state, actionData.damage, actionData.blocked);
      break;
  }
  
  // Update play style based on patterns
  updatePlayStyleClassification(state);
  
  // Adapt AI based on learned patterns
  adaptAIStrategy(state);
}

function getTurnPhase(state: GameState): 'early' | 'mid' | 'late' {
  const turn = state.turn;
  if (turn <= 3) return 'early';
  if (turn <= 8) return 'mid';
  return 'late';
}

function learnCardUsagePattern(state: GameState, card: any, phase: 'early' | 'mid' | 'late'): void {
  // Track card type preferences
  const cardType = card.type as string;
  patternsOf(state).cardTypePreference[cardType] = (patternsOf(state).cardTypePreference[cardType] || 0) + 1;
  
  // Track cost distribution
  const cost = Math.min(card.cost || 0, 3);
  patternsOf(state).costDistribution[cost] = (patternsOf(state).costDistribution[cost] || 0) + 1;
  
  // Learn phase-specific strategies
  if (phase === 'early' && card.type === 'attack' && card.cost <= 1) {
    // Player prefers early aggression
    if (patternsOf(state).earlyGameStrategy !== 'rush') {
      patternsOf(state).earlyGameStrategy = 'rush';
    }
  }
  
  if (card.draw && card.draw > 0) {
    patternsOf(state).cardDrawPreference += 1;
  }
}

function learnTurnPattern(state: GameState, turnData: any): void {
  // Calculate energy efficiency
  const energyUsed = turnData.energyUsed || 0;
  const maxEnergy = state.player.maxEnergy || 3;
  const efficiency = energyUsed / maxEnergy;
  
  patternsOf(state).energyEfficiency = (patternsOf(state).energyEfficiency + efficiency) / 2;
  
  // Learn defensive patterns
  const blockGained = turnData.blockGained || 0;
  if (blockGained > 0) {
    patternsOf(state).blockingFrequency += 0.1;
  }
  
  // Detect panic patterns
  if (state.player.hp < state.player.maxHp * 0.25 && blockGained > 6) {
    patternsOf(state).lowHealthPanic = true;
  }
}

function learnStatusPattern(state: GameState, statusId: string, target: 'player' | 'enemy'): void {
  if (target === 'enemy') {
    patternsOf(state).statusUsage[statusId] = (patternsOf(state).statusUsage[statusId] || 0) + 1;
  } else {
    patternsOf(state).statusCountering[statusId] = (patternsOf(state).statusCountering[statusId] || 0) + 1;
  }
}

function learnDefensivePattern(state: GameState, damage: number, blocked: number): void {
  const blockRatio = blocked / (damage + blocked);
  patternsOf(state).blockingFrequency = (patternsOf(state).blockingFrequency + blockRatio) / 2;
  
  // Detect over-reliance on block
  if (blockRatio > 0.7 && damage < 3) {
    patternsOf(state).overReliantOnBlock = true;
  }
}

function updatePlayStyleClassification(state: GameState): void {
  const attackPreference = (patternsOf(state).cardTypePreference as any).attack || 0;
  const skillPreference = (patternsOf(state).cardTypePreference as any).skill || 0;
  const totalCards = attackPreference + skillPreference + ((patternsOf(state).cardTypePreference as any).equipment || 0);
  
  if (totalCards === 0) return;
  
  const attackRatio = attackPreference / totalCards;
  const blockFreq = patternsOf(state).blockingFrequency;
  
  if (attackRatio > 0.6 && blockFreq < 0.3) {
    patternsOf(state).playStyle = 'aggressive';
  } else if (attackRatio < 0.4 && blockFreq > 0.6) {
    patternsOf(state).playStyle = 'defensive';
  } else if (patternsOf(state).cardDrawPreference > 5) {
    patternsOf(state).playStyle = 'combo';
  } else {
    patternsOf(state).playStyle = 'balanced';
  }
}

// ===== AI Adaptation Logic =====

function adaptAIStrategy(state: GameState): void {
  // Reset adaptation
  resetAdaptation(state);
  
  // Counter player's play style
  counterPlayStyle(state);
  
  // Counter specific patterns
  counterPlayerWeaknesses(state);
  
  // Adjust difficulty based on player performance
  adjustDifficulty(state);
  
  // Apply adaptations to current enemy
  applyAdaptationsToEnemy(state);
}

/**
 * รีเซ็ตค่า adaptation ทั้งหมดกลับเป็นค่าเริ่มต้น
 *
 * ถูกเรียกทุกครั้งที่ต้นทาง adaptAIStrategy() เพื่อให้คำนวณใหม่จากสถานะปัจจุบัน
 *
 * เดิมรีเซ็ตแค่ 5 จาก 14 ฟิลด์ ทำให้ตัวคูณความยาก (damageMultiplier ฯลฯ)
 * ที่ adjustDifficulty ตั้งไว้ค้างถาวร เพราะ adjustDifficulty เองก็ไม่มี else
 * กลับเป็น 1.0 → ผู้เล่น HP ตกต่ำกว่า 30% ครั้งเดียว ดาเมจก็แรงขึ้นตลอดรัน
 * (และข้ามรันด้วย เพราะตัวแปรอยู่ระดับโมดูล)
 */
function resetAdaptation(state: GameState): void {
  adaptationOf(state).priorityBehaviors = [];
  adaptationOf(state).prioritySpells = [];
  adaptationOf(state).statusFocus = [];
  adaptationOf(state).aggressionLevel = 50;
  adaptationOf(state).spellCastingPreference = 50;
  adaptationOf(state).minionUsage = 30;
  adaptationOf(state).damageMultiplier = 1.0;
  adaptationOf(state).healthMultiplier = 1.0;
  adaptationOf(state).energyBonus = 0;
  adaptationOf(state).spellChargeReduction = 0;
  adaptationOf(state).antiRushTactics = false;
  adaptationOf(state).antiComboDisruption = false;
  adaptationOf(state).blockCounters = false;
  adaptationOf(state).statusCleansing = false;
}

function counterPlayStyle(state: GameState): void {
  switch (patternsOf(state).playStyle) {
    case 'aggressive':
      // Counter aggression with defense and punishment
      adaptationOf(state).aggressionLevel = 30;
      adaptationOf(state).statusFocus.push('weakness', 'vulnerable');
      adaptationOf(state).priorityBehaviors.push('defensive_stance', 'counter_attack');
      break;
      
    case 'defensive':
      // Counter defense with pressure and inevitability
      adaptationOf(state).aggressionLevel = 80;
      adaptationOf(state).minionUsage = 60;
      adaptationOf(state).statusFocus.push('poison', 'curse');
      adaptationOf(state).prioritySpells.push('long_term_damage');
      break;
      
    case 'combo':
      // Disrupt combos with forced actions and card destruction
      adaptationOf(state).antiComboDisruption = true;
      adaptationOf(state).statusFocus.push('corruption', 'entangle');
      adaptationOf(state).priorityBehaviors.push('disrupt_hand', 'force_discard');
      break;
      
    case 'balanced':
      // Vary tactics to keep player guessing
      adaptationOf(state).aggressionLevel = 40 + Math.random() * 40;
      adaptationOf(state).spellCastingPreference = 60;
      break;
  }
}

function counterPlayerWeaknesses(state: GameState): void {
  // Counter over-reliance on block
  if (patternsOf(state).overReliantOnBlock) {
    adaptationOf(state).blockCounters = true;
    adaptationOf(state).statusFocus.push('vulnerable');
    adaptationOf(state).priorityBehaviors.push('unblockable_attack', 'block_destruction');
  }
  
  // Exploit low health panic
  if (patternsOf(state).lowHealthPanic) {
    adaptationOf(state).priorityBehaviors.push('pressure_when_low', 'false_security');
  }
  
  // Counter rush vulnerability
  if (patternsOf(state).vulnerableToRush) {
    adaptationOf(state).aggressionLevel = 90;
    adaptationOf(state).priorityBehaviors.push('early_aggression', 'overwhelming_start');
  }
  
  // Apply status counters
  for (const statusType of patternsOf(state).weakToStatusTypes) {
    adaptationOf(state).statusFocus.push(statusType);
  }
}

function adjustDifficulty(state: GameState): void {
  // Calculate player performance
  const playerHpRatio = state.player.hp / state.player.maxHp;
  const turnNumber = state.turn;
  const enemyHpRatio = state.enemy ? (state.enemy.hp / state.enemy.maxHp) : 1;
  
  // Dynamic difficulty scaling
  if (playerHpRatio > 0.8 && turnNumber > 5) {
    // Player is doing well, increase difficulty
    adaptationOf(state).damageMultiplier = 1.2;
    adaptationOf(state).healthMultiplier = 1.1;
    adaptationOf(state).energyBonus = 1;
    adaptationOf(state).spellChargeReduction = 1;
  } else if (playerHpRatio < 0.3 && enemyHpRatio > 0.7) {
    // Player is struggling, decrease difficulty slightly
    adaptationOf(state).damageMultiplier = 0.9;
    adaptationOf(state).healthMultiplier = 0.95;
  }
}

function applyAdaptationsToEnemy(state: GameState): void {
  if (!state.enemy) return;
  
  // Apply damage and health modifiers
  if (adaptationOf(state).damageMultiplier !== 1.0) {
    // This would be applied to enemy attacks
    state.log.push(`🤖 AI adapts: damage ${adaptationOf(state).damageMultiplier > 1 ? 'increased' : 'decreased'}`);
  }
  
  if (adaptationOf(state).energyBonus > 0) {
    const currentEnergy = (state as any).enemyEnergy || 0;
    (state as any).enemyEnergy = currentEnergy + adaptationOf(state).energyBonus;
    state.log.push(`🤖 AI adapts: gains ${adaptationOf(state).energyBonus} extra energy`);
  }
  
  // Log adaptation summary
  state.log.push(`🧠 AI analyzing... play style: ${patternsOf(state).playStyle}, aggression: ${adaptationOf(state).aggressionLevel}`);
}

// ===== Advanced Behavior Modifications =====

export function getAdaptiveBehaviorPriority(state: GameState, behaviorId: string): number {
  const basePriority = 5; // Default priority
  
  if (adaptationOf(state).priorityBehaviors.includes(behaviorId)) {
    return basePriority + 3; // Higher priority
  }
  
  // Contextual priority adjustments
  switch (behaviorId) {
    case 'aggressive_rush':
      return adaptationOf(state).aggressionLevel > 70 ? basePriority + 2 : basePriority - 1;
      
    case 'defensive_stance':
      return adaptationOf(state).aggressionLevel < 40 ? basePriority + 2 : basePriority - 1;
      
    case 'spell_focus':
      return adaptationOf(state).spellCastingPreference > 60 ? basePriority + 1 : basePriority;
      
    case 'summon_minions':
      return adaptationOf(state).minionUsage > 50 ? basePriority + 1 : basePriority;
      
    default:
      return basePriority;
  }
}

export function getAdaptiveSpellPriority(state: GameState, spellId: string): number {
  const basePriority = 5;
  
  if (adaptationOf(state).prioritySpells.includes(spellId)) {
    return basePriority + 3;
  }
  
  return basePriority;
}

export function shouldApplyAdaptiveStatusFocus(state: GameState, statusId: StatusEffectType): boolean {
  return adaptationOf(state).statusFocus.includes(statusId);
}

export function getAdaptiveDamageMultiplier(state: GameState): number {
  return adaptationOf(state).damageMultiplier;
}

export function getAdaptiveSpellChargeReduction(state: GameState): number {
  return adaptationOf(state).spellChargeReduction;
}

// ===== Combat Integration Hooks =====

export function onPlayerCardPlayed(state: GameState, card: any): void {
  learnFromPlayerAction(state, 'card_played', { card });
}

export function onPlayerTurnEnd(state: GameState, turnData: any): void {
  learnFromPlayerAction(state, 'turn_end', turnData);
}

export function onStatusEffectApplied(state: GameState, statusId: string, target: 'player' | 'enemy'): void {
  learnFromPlayerAction(state, 'status_applied', { statusId, target });
}

export function onDamageTaken(state: GameState, damage: number, blocked: number): void {
  learnFromPlayerAction(state, 'damage_taken', { damage, blocked });
}

// ===== Utility Functions =====

export function getPlayerPattern(state: GameState): PlayerPattern {
  return { ...patternsOf(state) };
}

export function getCurrentAdaptation(state: GameState): AIAdaptation {
  return { ...adaptationOf(state) };
}

/** ล้างสิ่งที่ AI เรียนรู้ทั้งหมด — สร้าง AIState ใหม่ทับไปเลย
 *  (เดิมรีเซ็ตทีละฟิลด์แล้วตกหล่นตัวคูณความยาก ทำให้ค่าค้างข้ามรัน) */
export function resetAILearning(state: GameState): void {
  state.ai = createAIState();
}

export function debugAdaptiveAI(state: GameState): void {
  console.log('=== ADAPTIVE AI DEBUG ===');
  console.log('Player Pattern:', patternsOf(state));
  console.log('Current Adaptation:', adaptationOf(state));
  console.log('Turn:', state.turn);
  if (state.enemy) {
    console.log('Enemy HP:', `${state.enemy.hp}/${state.enemy.maxHp}`);
  }
  console.log('Player HP:', `${state.player.hp}/${state.player.maxHp}`);
}