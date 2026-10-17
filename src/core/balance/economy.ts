// src/core/balance/economy.ts — service prices. The numbers live in balance/notfm.ts (ECONOMY).
import { ECONOMY } from './notfm';
import {PROGRESSION_SERVICES} from './deckProgression';

/** Shop reroll price before the difficulty markup. */
export const SHOP_REROLL_COST = PROGRESSION_SERVICES.reroll;

/** Removal price for the `used`-th removal at this stop (0-based): the first ones are free. */
export function removeCostForCount(used: number, progression = true): number {
  return progression ? (PROGRESSION_SERVICES.remove[used] ?? Infinity) : used === 0 ? 0 : ECONOMY.removePrice;
}

/** Upgrade price for the `used`-th upgrade at this stop (0-based): the first ones are free. */
export function upgradeCostForCount(used: number, progression = true): number {
  return progression ? (PROGRESSION_SERVICES.upgrade[used] ?? Infinity) : used === 0 ? 0 : ECONOMY.upgradePrice;
}
