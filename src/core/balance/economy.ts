// src/core/balance/economy.ts — service prices. The numbers live in balance/notfm.ts (ECONOMY).
import { ECONOMY } from './notfm';

/** Shop reroll price before the difficulty markup. */
export const SHOP_REROLL_COST = ECONOMY.rerollPrice;

/** Removal price for the `used`-th removal at this stop (0-based): the first ones are free. */
export function removeCostForCount(used: number): number {
  return used < ECONOMY.freePerStop ? 0 : ECONOMY.removePrice;
}

/** Upgrade price for the `used`-th upgrade at this stop (0-based): the first ones are free. */
export function upgradeCostForCount(used: number): number {
  return used < ECONOMY.freePerStop ? 0 : ECONOMY.upgradePrice;
}
