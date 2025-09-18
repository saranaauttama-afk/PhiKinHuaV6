/**
 * Unified Card System - Main Export
 */

// Types
export * from './types';

// Card Factory
export {
  createUnifiedCard,
  convertPlayerCards,
  convertEnemyCards,
  createMonsterDeck,
  cloneCard,
  cardMatches,
  findCards,
  calculateHandCost,
  canPlayCard,
  getPlayableCards,
  sortCards
} from './cardFactory';

// Pile Manager
export {
  shuffleCards,
  createEmptyPiles,
  moveCard,
  moveCardByIndex,
  drawCards,
  drawUpToHandSize,
  reshuffleDiscardIntoDraw,
  discardCard,
  discardCardByIndex,
  exhaustCard,
  exhaustCardByIndex,
  discardHand,
  findCardInPiles,
  countTotalCards,
  countCyclingCards,
  getAllCards,
  getCyclingCards,
  removeCard,
  addCardToPile,
  clearPiles,
  setupDeck,
  isHandFull,
  getRandomCardFromHand,
  filterPile,
  applyEthereal,
  discardNonRetainedCards,
  clonePiles,
  mergePiles
} from './pileManager';

// Energy Manager
export {
  createEnergyState,
  resetEnergy,
  regenerateEnergy,
  spendEnergy,
  gainEnergy,
  setEnergy,
  hasEnergy,
  addEnergyModifier,
  removeEnergyModifier,
  updateModifierDurations,
  calculateMaxEnergy,
  getEnergyDisplay,
  clearTemporaryModifiers,
  clearAllModifiers,
  applyEnergyDiscount,
  applyEnergyCostMultiplier,
  cloneEnergyState,
  resetEnergyState,
  initializeCombatEnergy,
  startTurnEnergy,
  endTurnEnergy,
  hasInfiniteEnergy,
  grantTemporaryEnergy,
  drainEnergy,
  getEnergySpentThisCombat,
  formatEnergyDisplay
} from './energyManager';

// Game Manager
export { UnifiedGameManager } from './gameManager';