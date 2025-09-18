/**
 * Unified Energy Management System
 * Manages energy for all entities in the game
 */

import { EnergyState, EnergyModifier } from './types';

/**
 * Create a new energy state
 */
export function createEnergyState(
  maximum: number = 3,
  regenPerTurn: number = -1
): EnergyState {
  return {
    current: maximum,
    maximum,
    baseMaximum: maximum,
    regenPerTurn: regenPerTurn === -1 ? maximum : regenPerTurn,
    modifiers: []
  };
}

/**
 * Reset energy to maximum
 */
export function resetEnergy(energy: EnergyState): void {
  energy.current = calculateMaxEnergy(energy);
}

/**
 * Regenerate energy (typically at start of turn)
 */
export function regenerateEnergy(energy: EnergyState): number {
  const maxEnergy = calculateMaxEnergy(energy);
  const regenAmount = energy.regenPerTurn === -1 ? maxEnergy : energy.regenPerTurn;
  const previousEnergy = energy.current;

  energy.current = Math.min(energy.current + regenAmount, maxEnergy);

  return energy.current - previousEnergy; // Return amount regenerated
}

/**
 * Spend energy
 */
export function spendEnergy(energy: EnergyState, amount: number): boolean {
  if (amount > energy.current) {
    return false; // Not enough energy
  }

  energy.current -= amount;
  return true;
}

/**
 * Gain energy
 */
export function gainEnergy(energy: EnergyState, amount: number): number {
  const maxEnergy = calculateMaxEnergy(energy);
  const previousEnergy = energy.current;

  energy.current = Math.min(energy.current + amount, maxEnergy);

  return energy.current - previousEnergy; // Return amount gained
}

/**
 * Set energy to a specific value
 */
export function setEnergy(energy: EnergyState, amount: number): void {
  const maxEnergy = calculateMaxEnergy(energy);
  energy.current = Math.max(0, Math.min(amount, maxEnergy));
}

/**
 * Check if there's enough energy
 */
export function hasEnergy(energy: EnergyState, amount: number): boolean {
  return energy.current >= amount;
}

/**
 * Add an energy modifier
 */
export function addEnergyModifier(
  energy: EnergyState,
  modifier: EnergyModifier
): void {
  energy.modifiers.push(modifier);
}

/**
 * Remove an energy modifier by source
 */
export function removeEnergyModifier(
  energy: EnergyState,
  source: string
): boolean {
  const index = energy.modifiers.findIndex(m => m.source === source);
  if (index !== -1) {
    energy.modifiers.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Update modifier durations (call at end of turn)
 */
export function updateModifierDurations(energy: EnergyState): void {
  energy.modifiers = energy.modifiers.filter(modifier => {
    if (modifier.duration === undefined || modifier.duration === -1) {
      return true; // Permanent modifier
    }

    modifier.duration--;
    return modifier.duration > 0;
  });
}

/**
 * Calculate maximum energy with modifiers
 */
export function calculateMaxEnergy(energy: EnergyState): number {
  let maxEnergy = energy.baseMaximum;

  for (const modifier of energy.modifiers) {
    switch (modifier.type) {
      case 'add':
        maxEnergy += modifier.value;
        break;
      case 'multiply':
        maxEnergy = Math.floor(maxEnergy * modifier.value);
        break;
      case 'set':
        maxEnergy = modifier.value;
        break;
    }
  }

  return Math.max(0, maxEnergy);
}

/**
 * Get energy display information
 */
export function getEnergyDisplay(energy: EnergyState): {
  current: number;
  maximum: number;
  percentage: number;
  hasModifiers: boolean;
} {
  const maximum = calculateMaxEnergy(energy);
  return {
    current: energy.current,
    maximum,
    percentage: maximum > 0 ? (energy.current / maximum) * 100 : 0,
    hasModifiers: energy.modifiers.length > 0
  };
}

/**
 * Clear all temporary modifiers
 */
export function clearTemporaryModifiers(energy: EnergyState): void {
  energy.modifiers = energy.modifiers.filter(
    m => m.duration === undefined || m.duration === -1
  );
}

/**
 * Clear all modifiers
 */
export function clearAllModifiers(energy: EnergyState): void {
  energy.modifiers = [];
}

/**
 * Apply energy cost reduction
 */
export function applyEnergyDiscount(
  cost: number,
  discount: number,
  minimum: number = 0
): number {
  return Math.max(minimum, cost - discount);
}

/**
 * Apply energy cost multiplier
 */
export function applyEnergyCostMultiplier(
  cost: number,
  multiplier: number,
  minimum: number = 0
): number {
  return Math.max(minimum, Math.floor(cost * multiplier));
}

/**
 * Clone energy state
 */
export function cloneEnergyState(energy: EnergyState): EnergyState {
  return {
    current: energy.current,
    maximum: energy.maximum,
    baseMaximum: energy.baseMaximum,
    regenPerTurn: energy.regenPerTurn,
    modifiers: energy.modifiers.map(m => ({ ...m }))
  };
}

/**
 * Reset energy state to initial values
 */
export function resetEnergyState(energy: EnergyState): void {
  energy.current = energy.baseMaximum;
  energy.maximum = energy.baseMaximum;
  energy.modifiers = [];
}

/**
 * Energy state for start of combat
 */
export function initializeCombatEnergy(energy: EnergyState): void {
  clearTemporaryModifiers(energy);
  resetEnergy(energy);
}

/**
 * Energy state for start of turn
 */
export function startTurnEnergy(energy: EnergyState): void {
  regenerateEnergy(energy);
}

/**
 * Energy state for end of turn
 */
export function endTurnEnergy(energy: EnergyState): void {
  updateModifierDurations(energy);
}

/**
 * Check if entity has infinite energy (for special cases)
 */
export function hasInfiniteEnergy(energy: EnergyState): boolean {
  return energy.modifiers.some(
    m => m.type === 'set' && m.value === Number.MAX_SAFE_INTEGER
  );
}

/**
 * Grant temporary energy boost
 */
export function grantTemporaryEnergy(
  energy: EnergyState,
  amount: number,
  duration: number = 1
): void {
  addEnergyModifier(energy, {
    type: 'add',
    value: amount,
    source: 'temporary_boost',
    duration
  });

  // Also add the energy immediately
  gainEnergy(energy, amount);
}

/**
 * Apply energy drain effect
 */
export function drainEnergy(
  energy: EnergyState,
  amount: number,
  duration: number = 1
): void {
  addEnergyModifier(energy, {
    type: 'add',
    value: -amount,
    source: 'energy_drain',
    duration
  });

  // Also remove energy immediately
  energy.current = Math.max(0, energy.current - amount);
}

/**
 * Get total energy spent this combat
 */
export function getEnergySpentThisCombat(
  initialEnergy: number,
  currentEnergy: number,
  energyGained: number
): number {
  return initialEnergy + energyGained - currentEnergy;
}

/**
 * Format energy display string
 */
export function formatEnergyDisplay(energy: EnergyState): string {
  const display = getEnergyDisplay(energy);
  return `${display.current}/${display.maximum}`;
}