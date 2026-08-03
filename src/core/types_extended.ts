// src/core/types_extended.ts — Extended mechanics for Thai Enemy System

// ===== สถานะผล =====
//
// **ไทป์สถานะมีชุดเดียว อยู่ที่ `combat/status-effects/types.ts`**
//
// เดิมไฟล์นี้ประกาศ `StatusEffectType` ของตัวเองไว้ 26 ชนิด (sleep, bleed, doom,
// charm, nightmare, …) ขณะที่ทะเบียนจริงมี 13 — อีก 13 ชนิดไม่มีนิยาม ไม่มีชื่อ
// ไม่มีคำอธิบาย และไม่มีโค้ดไหนทำอะไรกับมัน แต่ TS ยอมให้เขียนลงไปได้
// สองชุดยังไม่ตรงกันเองด้วย ('vulnerability' ที่นี่ vs 'vulnerable' ที่โน่น)
// เขียนถูกตามไทป์หนึ่งแล้วพังกับอีกไทป์หนึ่งโดยไม่มีอะไรเตือน
//
// ตรวจแล้วว่า 13 ชนิดที่เกินมาไม่มีใครใช้เลยสักที่ จึงยุบทิ้งได้ตรงๆ
import type {
  StatusEffect, StatusEffectType, StatusEffectDefinition,
} from './combat/status-effects/types';

export type { StatusEffect, StatusEffectType, StatusEffectDefinition };

// ===== Dynamic Enemy Behaviors =====
export type BehaviorCondition = 
  | 'always'
  | 'hp_below_50'
  | 'hp_below_25' 
  | 'hp_below_75'   // เพิ่ม - ใช้ในศัตรูใหม่
  | 'hp_below_30'   // เพิ่ม - ใช้ในศัตรูใหม่  
  | 'hp_below_40'   // เพิ่ม - ใช้ในบอส
  | 'player_has_curse'
  | 'player_hp_below_50'
  | 'player_hp_below_60'  // เพิ่ม
  | 'player_hp_above_75'  // เพิ่ม
  | 'player_attack_count_3'  // เพิ่ม - นับการโจมตีของผู้เล่น
  | 'player_damage_above_15'  // เพิ่ม - ความเสียหายที่ผู้เล่นทำ
  | 'turn_2_or_later'  // เพิ่ม
  | 'turn_3_or_later'
  | 'turn_4_or_later'  // เพิ่ม - ใช้ในบอส
  | 'turn_even'
  | 'turn_odd'
  | 'has_status_effect'
  | 'enemy_damaged_last_turn'
  | 'phase_2'; // After HP threshold

export type BehaviorAction =
  | 'play_signature_card'
  | 'double_attack'
  | 'triple_attack'        // เพิ่ม - โจมตี 3 ครั้ง (ใช้ในบอส)
  | 'heal_self'
  | 'apply_status_to_player'
  | 'apply_status_to_self'
  | 'force_draw_cards'
  | 'gain_extra_energy'
  | 'change_ai_pattern'
  // (change_environment removed - environment system discontinued)
  | 'summon_minion'
  | 'enter_phase_2';

export type EnemyBehavior = {
  id: string;
  condition: BehaviorCondition;
  conditionValue?: any; // For conditions that need parameters
  action: BehaviorAction;
  actionValue?: any; // For actions that need parameters
  priority: number; // Higher priority behaviors trigger first
  oncePerCombat?: boolean;
  triggered?: boolean; // Runtime flag
};

// ===== Multi-Turn Effects =====
export type DelayedEffect = {
  id: string;
  name: string;
  description: string;
  triggerTurn: number; // Absolute turn number when this triggers
  effect: DelayedEffectType;
  value: number;
  target: 'player' | 'enemy' | 'both';
  source: string; // Which enemy/card created this
};

export type DelayedEffectType =
  | 'damage_target'
  | 'heal_target'
  | 'apply_status'
  | 'summon_minion'
  | 'force_discard'
  | 'destroy_equipment'
  | 'double_next_attack';


// ===== Environmental Effects ===== (REMOVED - Environment system discontinued)

// ===== Minion System =====
export type MinionAbility = {
  type: 'attack' | 'heal' | 'energy' | 'draw' | 'block' | 'status' 
       | 'damage_over_time' | 'modify_damage' | 'block_cards' | 'cleanse'; // Extended for status effects
  trigger: 'turn_start' | 'turn_end' | 'on_summon' | 'on_death';
  target: 'owner' | 'enemy' | 'all_allies' | 'all_enemies';
  value: number;
  effect?: string; // For status type
  duration?: number; // For status type
  ignores_block?: boolean; // For attack type - some minions can bypass block
  modifyType?: 'multiply' | 'add' | 'reduce'; // For modify_damage type
  cardTypes?: string[]; // For block_cards type - which card types to block
  description: string;
};

export type MinionData = {
  id: string;
  name: string;
  duration: number; // Required - how many turns it lasts
  owner: 'player' | 'enemy';
  abilities: MinionAbility[];
  statusEffects?: StatusEffect[]; // Runtime effects on the minion
  isStatusEffect?: boolean; // True if this minion represents a status effect
  invisible?: boolean; // True if this shouldn't show in minion UI (for status effects)
  stacks?: number; // For stackable status effects
};

// ===== Enhanced Enemy Definition =====
export type EnhancedEnemyData = {
  // Base enemy properties
  id: string;
  name: string;
  tier: 'normal' | 'elite' | 'boss';
  hp: number;
  maxHp: number;
  dmg?: number; // Optional - for backward compatibility only
  block: number;
  
  // Enhanced mechanics
  behaviors: EnemyBehavior[];
  phaseChangeHP?: number; // HP threshold for phase 2
  phase2Behaviors?: EnemyBehavior[]; // Additional behaviors in phase 2
  
  // Status effects and immunities
  statusImmunities?: StatusEffectType[];
  startingStatusEffects?: StatusEffect[];
  
  // (Environment system removed)
  
  // Minion summoning
  summonableMinions?: string[];
  maxMinions?: number;
  
  // Signature cards (in addition to base deck)
  signatureCards: string[];
  
  // AI enhancements
  aiPersonality: 'aggressive' | 'defensive' | 'tactical' | 'chaotic' | 'adaptive';
  aiModifiers?: {
    behaviorTriggerChance: number; // 0-100, chance to trigger behaviors
    adaptationRate: number; // How quickly AI adapts to player strategy
  };
  
  // Scaling per act
  scaling: {
    dmgPerAct: number;
    blockPerAct: number;
    hpPerAct?: number;
    newAbilitiesPerAct?: string[];
  };
  
  // Loot and rewards
  specialLoot?: {
    cardRewards?: string[];
    equipmentRewards?: string[];
    blessingRewards?: string[];
    goldBonus?: number;
  };
};

// ===== Runtime State Extensions =====
export type CombatState = {
  turn: number;
  phase: 'player' | 'enemy'; // (environment phase removed)
  delayedEffects: DelayedEffect[];
  activeMinions: MinionData[];
  behaviorHistory: string[]; // Track which behaviors have been triggered
  adaptationState?: { // For adaptive AI
    playerPreferences: { [cardType: string]: number };
    countersUsed: string[];
    difficultyModifier: number;
  };
};
