// src/core/engine/handlers/shops_events.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { rollShopStock } from '../../shop';
import { getClass } from '../../classes';
import { applyRemoveCard, rollGamble, rollTreasure } from '../../events';
import { START_ENERGY } from '../../balance/core';
import { removeCostForCount, upgradeCostForCount } from '../../balance/economy';
import { SHOP_REROLL_COST } from '../../balance/economy';
import { SHOP_STOCK_SIZE, SHOP_POWER_BIAS } from '../../balance/weights';
import { upgradeCard, canUpgrade, grantBlessing } from '../shared';
import { replaceSingleOffer } from './map_pages';
import { consumeToken } from '../../map/pages';
import { loseRun } from './runEnd';
// ===== Fallback stock (ใช้เมื่อ rollShopStock พัง/ยังไม่พร้อม) =====
import { int } from '../../rng';
const cardsBase = require('../../../data/packs/base/cards.json'); // top-level ให้ Metro bundle
function fallbackShopStock(r: RNG, size: number) {
  const arr: any[] = Array.isArray(cardsBase) ? cardsBase : [];
  const pool = arr.filter((c) => c && (c.inShop === true || typeof c.cost === 'number'));
  const items: { card: any; price: number }[] = [];
  let rr = r;
  const bag = pool.slice();
  for (let k = 0; k < size && bag.length > 0; k++) {
    const ro = int(rr, 0, bag.length - 1);
    rr = ro.rng;
    const pick = bag.splice(ro.value, 1)[0];
    const price = Math.max(
      10,
      (pick.cost ?? 0) * 20 +
        (pick.dmg ?? 0) * 2 +
        (pick.block ?? 0) * 2 +
        (pick.draw ?? 0) * 10 +
        (pick.energyGain ?? 0) * 25
    );
    items.push({ card: pick, price });
  }
  return { rng: rr, items };
}

export function shopReroll(s: GameState, _cmd: Extract<Command, { type: 'ShopReroll' }>, r: RNG) {
  if (s.phase !== 'shop') return { state: s, rng: r };
  if ((s.player.gold ?? 0) < SHOP_REROLL_COST) {
    s.log.push('Shop: Not enough gold to reroll');
    return { state: s, rng: r };
  }
  s.player.gold -= SHOP_REROLL_COST;
  try {
    const { rollShopStock } = require('../../shop');
    const out = rollShopStock(r, SHOP_STOCK_SIZE, SHOP_POWER_BIAS, getClass(s.classId).cardTag);
    r = out.rng;
    s.shopStock = out.items;
  } catch {
    const fb = fallbackShopStock(r, SHOP_STOCK_SIZE);
    r = fb.rng;
    s.shopStock = fb.items;
    s.log.push('Shop: reroll fallback stock.');
  }
  s.log.push(`Shop: rerolled (-${SHOP_REROLL_COST}g)`);
  return { state: s, rng: r };
}

export function qaOpenShopHere(s: GameState, _cmd: Extract<Command, { type: 'QA_OpenShopHere' }>, r: RNG) {
  try {
    const { rollShopStock } = require('../../shop');
    const out = rollShopStock(r, SHOP_STOCK_SIZE, SHOP_POWER_BIAS, getClass(s.classId).cardTag);
    r = out.rng;
    s.shopStock = out.items;
  } catch {
    const fb = fallbackShopStock(r, SHOP_STOCK_SIZE);
    r = fb.rng;
    s.shopStock = fb.items;
    s.log.push('QA: fallback shop stock.');
  }
  s.phase = 'shop';
  s.shopKind = 'card';
  return { state: s, rng: r };
}

// export function takeReward(s: GameState, cmd: Extract<Command, { type: 'TakeReward' }>, r: RNG) {
//   if (s.phase !== 'reward' || !s.rewardOptions) return { state: s, rng: r };
//   const idx = cmd.index;
//   const chosen = s.rewardOptions[idx];
//   if (!chosen) return { state: s, rng: r };
//   s.masterDeck.push(JSON.parse(JSON.stringify(chosen)));
//   s.log.push(`Took reward: ${chosen.name}`);
//   s.rewardOptions = undefined;
//   return { state: s, rng: r };
// }

export function takeShop(s: GameState, cmd: Extract<Command, { type: 'TakeShop' }>, r: RNG) {
  if (s.phase !== 'shop' || !s.shopStock) return { state: s, rng: r };
  const i = cmd.index;
  const item = s.shopStock[i];
  if (!item) return { state: s, rng: r };
  if (!('card' in item)) return { state: s, rng: r }; // Only handle card items
  if (s.player.gold < item.price) {
    s.log.push('Shop: Not enough gold');
    return { state: s, rng: r };
  }
  s.player.gold -= item.price;
  s.masterDeck.push(JSON.parse(JSON.stringify(item.card)));
  
  // Track bought item for shop persistence
  s.shopBoughtItems = s.shopBoughtItems || [];
  s.shopBoughtItems.push(JSON.parse(JSON.stringify(item)));
  
  s.shopStock.splice(i, 1);
  s.log.push(`Shop: bought ${item.card.name} for ${item.price}g`);
  // โหมด pages: ถือว่า "ใช้ร้าน" แล้ว (จะ resolve ตอนปิดร้าน)
  if (s.mapMode === 'pages' && s.pages) {
    s.pages._shopUsed = true;
  }  
  return { state: s, rng: r };
}

export function shopRemoveBuy(s: GameState, cmd: Extract<Command, { type: 'ShopRemoveBuy' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'remove') return { state: s, rng: r };
  const count = (s.runCounters?.removeShopCount ?? 0);
  const price = removeCostForCount(count);
  if ((s.player.gold ?? 0) < price) {
    s.log.push(`Remove shop: Not enough gold (${price}g).`);
    return { state: s, rng: r };
  }
  const i = cmd.index;
  if (i < 0 || i >= (s.masterDeck?.length ?? 0)) return { state: s, rng: r };
  s.player.gold -= price;
  s.masterDeck.splice(i, 1);
  s.runCounters = s.runCounters || ({} as any);
  (s.runCounters as any).removeShopCount = count + 1;
  s.log.push(`Remove shop: removed card #${i} (-${price}g).`);
  if (s.mapMode === 'pages' && s.pages) s.pages._shopUsed = true;
  return { state: s, rng: r };
}

export function doWellUse(s: GameState, _cmd: Extract<Command, { type: 'DoWellUse' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || (s.event as any).type !== 'well') return { state: s, rng: r };
  if (!(s.event as any).used) {
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + 10);
    (s.event as any).used = true;
    (s.event as any).dismissed = false;
    s.log.push('Well: used (+10 HP).');
  }
  return { state: s, rng: r };
}

export function doWellDismiss(s: GameState, _cmd: Extract<Command, { type: 'DoWellDismiss' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || (s.event as any).type !== 'well') return { state: s, rng: r };
  (s.event as any).dismissed = true;
  (s.event as any).used = false;
  s.log.push('Well: dismissed.');
  return { state: s, rng: r };
}

export function shopUpgradeBuy(s: GameState, cmd: Extract<Command, { type: 'ShopUpgradeBuy' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'upgrade') return { state: s, rng: r };
  const count = (s.runCounters?.upgradeShopCount ?? 0);
  const price = upgradeCostForCount(count);
  if ((s.player.gold ?? 0) < price) {
    s.log.push(`Upgrade shop: Not enough gold (${price}g).`);
    return { state: s, rng: r };
  }
  const i = cmd.index;
  if (i < 0 || i >= (s.masterDeck?.length ?? 0)) return { state: s, rng: r };

  // ใบที่ปลุกเสกไปแล้วปลุกซ้ำไม่ได้ — กันไว้ที่นี่ด้วย ไม่ใช่แค่ซ่อนปุ่มใน UI
  // ไม่งั้นเสียทองฟรีโดยไม่มีอะไรเปลี่ยน
  if (!canUpgrade(s.masterDeck[i])) {
    s.log.push('การ์ดใบนี้ปลุกเสกไปแล้ว');
    return { state: s, rng: r };
  }

  s.player.gold -= price;
  s.masterDeck[i] = upgradeCard(s.masterDeck[i]);
  s.runCounters = s.runCounters || ({} as any);
  (s.runCounters as any).upgradeShopCount = count + 1;
  s.log.push(`Upgrade shop: upgraded card #${i} (-${price}g).`);
  if (s.mapMode === 'pages' && s.pages) s.pages._shopUsed = true;
  return { state: s, rng: r };
}

export function doBonfireHeal(s: GameState, _cmd: Extract<Command, { type: 'DoBonfireHeal' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'bonfire') return { state: s, rng: r };
  if (!s.event.healed) {
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + 10);
    s.event.healed = true;
    s.log.push('Bonfire: healed +10');
  }
  return { state: s, rng: r };
}

export function eventChooseBlessing(s: GameState, cmd: Extract<Command, { type: 'EventChooseBlessing' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'shrine') return { state: s, rng: r };
  const idx = cmd.index;
  const pick = s.event.options[idx];
  if (!pick) return { state: s, rng: r };
  if (grantBlessing(s, pick)) {
    s.event.chosenId = pick.id;
    s.log.push(`Shrine: took ${pick.name}`);
  } else {
    s.log.push('Shrine: already owned');
  }
  return { state: s, rng: r };
}

export function eventRemoveCard(s: GameState, cmd: Extract<Command, { type: 'EventRemoveCard' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'remove') return { state: s, rng: r };
  const ok = applyRemoveCard(s, cmd.pile, cmd.index);
  if (!ok) s.log.push('Remove: failed or cap reached');
  return { state: s, rng: r };
}

export function eventGambleRoll(s: GameState, _cmd: Extract<Command, { type: 'EventGambleRoll' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'gamble') return { state: s, rng: r };
  if (!s.event.resolved) {
    const g = rollGamble(r); r = g.rng;
    s.event.resolved = g.resolved;
    if (g.resolved.outcome === 'win') {
      s.player.gold += g.resolved.gold ?? 0;
      s.log.push(`Gamble: WIN +${g.resolved.gold}g`);
    } else {
      s.player.hp = Math.max(0, s.player.hp - (g.resolved.hpLoss ?? 0));
      s.log.push(`Gamble: LOSE -${g.resolved.hpLoss} HP`);
      if (s.player.hp === 0) { loseRun(s); }
    }
  }
  return { state: s, rng: r };
}

export function eventTreasureOpen(s: GameState, _cmd: Extract<Command, { type: 'EventTreasureOpen' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || s.event.type !== 'treasure') return { state: s, rng: r };
  if (s.event.amount == null) {
    const t = rollTreasure(r); r = t.rng;
    s.event.amount = t.amount;
    s.player.gold += t.amount;
    s.log.push(`Treasure: +${t.amount}g`);
  }
  return { state: s, rng: r };
}

// === Openers used by map_pages ==============================================
export function openShopCard(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  try {
    const { rollShopStock } = require('../../shop');
    const out = rollShopStock(r, 3, SHOP_POWER_BIAS, getClass(s.classId).cardTag); // Limit to 3 cards
    r = out.rng;
    s.shopStock = out.items;
  } catch {
    const fb = fallbackShopStock(r, 3); // Limit to 3 cards
    r = fb.rng;
    s.shopStock = fb.items;
    s.log.push('Shop(card): fallback stock.');
  }
  s.shopKind = 'card';
  s.shopBoughtItems = []; // Reset bought items tracker
  s.phase = 'shop';
  s.log.push(`Shop(card): ${s.shopStock?.length ?? 0} items`);
  return { state: s, rng: r };
}

export function openShopRemove(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  s.shopKind = 'remove';
  s.shopBoughtItems = []; // Reset bought items tracker
  s.phase = 'shop';
  // ไม่จำเป็นต้องคำนวณราคา ณ จุดเปิดร้าน เพราะ UI อาจอ่านจาก removeCostForCount ตอนกดซื้อ
  s.log.push(`Shop(remove): cost now = ${removeCostForCount(s.runCounters?.removeShopCount ?? 0)}g`);
  return { state: s, rng: r };
}

export function openShopUpgrade(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  s.shopKind = 'upgrade';
  s.shopBoughtItems = []; // Reset bought items tracker
  s.phase = 'shop';
  s.log.push(`Shop(upgrade): cost now = ${upgradeCostForCount(s.runCounters?.upgradeShopCount ?? 0)}g`);
  return { state: s, rng: r };
}

export function openShopEquipment(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  // สร้าง equipment shop stock (limit to 3 items)
  const equipmentBase = require('../../../data/packs/base/equipment.json');
  const arr: any[] = Array.isArray(equipmentBase) ? equipmentBase : [];
  const pool = arr.filter((e) => e && e.slotCost >= 0);
  
  const items: { equipment: any; price: number }[] = [];
  let rr = r;
  const bag = pool.slice();
  
  for (let k = 0; k < Math.min(3, bag.length); k++) {
    const ro = int(rr, 0, bag.length - 1);
    rr = ro.rng;
    const pick = bag.splice(ro.value, 1)[0];
    
    // ราคาตาม rarity
    const rarityPrice: { [key: string]: number } = {
      'Common': 80,
      'Uncommon': 120,
      'Rare': 180,
      'Legendary': 250
    };
    const price = rarityPrice[pick.rarity] || 100;
    items.push({ equipment: pick, price });
  }
  
  s.shopStock = items as any;
  s.shopKind = 'equipment';
  s.shopBoughtItems = []; // Reset bought items tracker
  s.phase = 'shop';
  s.log.push(`Shop(equipment): ${items.length} items`);
  return { state: s, rng: rr };
}

export function doHealingShrineUse(s: GameState, _cmd: Extract<Command, { type: 'DoHealingShrineUse' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || (s.event as any).type !== 'healing_shrine') return { state: s, rng: r };
  if (!(s.event as any).used) {
    const healAmount = 15; // ฟื้นฟูมากกว่า well
    s.player.hp = Math.min(s.player.maxHp, s.player.hp + healAmount);
    (s.event as any).used = true;
    (s.event as any).dismissed = false;
    s.log.push(`Healing Shrine: used (+${healAmount} HP).`);
  }
  return { state: s, rng: r };
}

export function doHealingShrineDismiss(s: GameState, _cmd: Extract<Command, { type: 'DoHealingShrineDismiss' }>, r: RNG) {
  if (s.phase !== 'event' || !s.event || (s.event as any).type !== 'healing_shrine') return { state: s, rng: r };
  (s.event as any).dismissed = true;
  (s.event as any).used = false;
  s.log.push('Healing Shrine: dismissed.');
  return { state: s, rng: r };
}

export function useHealingShrine(s: GameState, _cmd: Extract<Command, { type: 'UseHealingShrine' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'healing') return { state: s, rng: r };
  
  const healCount = (s as any).healingShrine?.timesUsed ?? 0;
  const healCost = 25 + (healCount * 10);
  const maxUses = 3;
  
  // Check if can use
  if (healCount >= maxUses) {
    s.log.push('Healing Shrine: already used maximum times');
    return { state: s, rng: r };
  }
  
  if (s.player.gold < healCost) {
    s.log.push('Healing Shrine: not enough gold');
    return { state: s, rng: r };
  }
  
  if (s.player.hp >= s.player.maxHp) {
    s.log.push('Healing Shrine: already at full health');
    return { state: s, rng: r };
  }
  
  // Use healing shrine
  s.player.gold -= healCost;
  const healAmount = s.player.maxHp - s.player.hp; // Full heal
  s.player.hp = s.player.maxHp;
  
  // Track usage
  if (!(s as any).healingShrine) {
    (s as any).healingShrine = { timesUsed: 0 };
  }
  (s as any).healingShrine.timesUsed += 1;
  
  // Track as bought item for registry
  if (!s.shopBoughtItems) s.shopBoughtItems = [];
  s.shopBoughtItems.push({ card: { id: 'healing', name: 'Full Heal' } as any, price: healCost });
  
  s.log.push(`Healing Shrine: used (+${healAmount} HP, -${healCost}g). Uses: ${(s as any).healingShrine.timesUsed}/${maxUses}`);
  return { state: s, rng: r };
}

export function useWell(s: GameState, _cmd: Extract<Command, { type: 'UseWell' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'well') return { state: s, rng: r };
  
  const wellCount = (s as any).mysticalWell?.timesUsed ?? 0;
  const maxUses = 2; // Free uses only
  const healAmount = 10; // Fixed heal amount
  
  // Check if can use
  if (wellCount >= maxUses) {
    s.log.push('Mystical Well: has dried up');
    return { state: s, rng: r };
  }
  
  if (s.player.hp >= s.player.maxHp) {
    s.log.push('Mystical Well: already at full health');
    return { state: s, rng: r };
  }
  
  // Use well for FREE
  const actualHeal = Math.min(healAmount, s.player.maxHp - s.player.hp);
  s.player.hp += actualHeal;
  
  // Track usage
  if (!(s as any).mysticalWell) {
    (s as any).mysticalWell = { timesUsed: 0 };
  }
  (s as any).mysticalWell.timesUsed += 1;
  
  // Track as bought item for registry (price = 0 for free)
  if (!s.shopBoughtItems) s.shopBoughtItems = [];
  s.shopBoughtItems.push({ card: { id: 'well_drink', name: 'Free Heal' } as any, price: 0 });
  
  const remaining = maxUses - (s as any).mysticalWell.timesUsed;
  s.log.push(`Mystical Well: used (+${actualHeal} HP) FREE. Remaining: ${remaining}/${maxUses}`);
  return { state: s, rng: r };
}

export function openTreasureChest(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  // Generate 2 random cards for treasure chest
  try {
    const { rollShopStock } = require('../../shop');
    const out = rollShopStock(r, 2, 1.3, getClass(s.classId).cardTag); // 2 cards with slight power bias
    r = out.rng;
    s.shopStock = out.items.map((item: any) => ({ ...item, price: 0 })); // Set price to 0 (free)
    s.shopKind = 'treasure';
    s.phase = 'shop';
  } catch {
    // Fallback if rollShopStock fails
    const fb = fallbackShopStock(r, 2);
    r = fb.rng;
    s.shopStock = fb.items.map(item => ({ ...item, price: 0 })); // Set price to 0 (free)
    s.shopKind = 'treasure';
    s.phase = 'shop';
  }
  s.log.push('Event: treasure chest opened');
  return { state: s, rng: r };
}

export function openSingleTreasure(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  // Generate 1 random card for single treasure
  try {
    const { rollShopStock } = require('../../shop');
    const out = rollShopStock(r, 1, 1.3, getClass(s.classId).cardTag); // 1 card with slight power bias
    r = out.rng;
    s.shopStock = out.items.map((item: any) => ({ ...item, price: 0 })); // Set price to 0 (free)
    s.shopKind = 'treasure_single';
    s.phase = 'shop';
  } catch {
    // Fallback if rollShopStock fails
    const fb = fallbackShopStock(r, 1);
    r = fb.rng;
    s.shopStock = fb.items.map(item => ({ ...item, price: 0 })); // Set price to 0 (free)
    s.shopKind = 'treasure_single';
    s.phase = 'shop';
  }
  s.log.push('Event: single treasure opened');
  return { state: s, rng: r };
}

export function takeTreasureCard(s: GameState, cmd: Extract<Command, { type: 'TakeTreasureCard' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'treasure' || !s.shopStock) return { state: s, rng: r };
  
  const i = cmd.index;
  if (i < 0 || i >= s.shopStock.length) {
    s.log.push('Treasure: invalid card selection');
    return { state: s, rng: r };
  }
  
  const item = s.shopStock[i];
  if (!('card' in item) || !item.card) {
    s.log.push('Treasure: invalid card');
    return { state: s, rng: r };
  }
  
  // Add card to master deck
  if (!s.masterDeck) s.masterDeck = [];
  s.masterDeck.push({ ...item.card });
  
  // No need to track global usage - each treasure is independent
  
  // Track as bought item for registry
  if (!s.shopBoughtItems) s.shopBoughtItems = [];
  s.shopBoughtItems.push({ card: item.card, price: 0 });
  
  // Clear treasure stock (chest is now empty)
  s.shopStock = [];
  
  // Auto-delete treasure from map after taking card
  const treasureId = s.currentShopId; // Save before clearing
  
  s.phase = 'map';
  s.shopKind = undefined;
  s.currentShopId = undefined;
  
  // Remove treasure from registry (it's consumed)
  if (s.shopRegistry && treasureId) {
    s.shopRegistry = s.shopRegistry.filter(shop => shop.id !== treasureId);
  }
  
  // Mark treasure as used and trigger map refresh
  if (s.pages && s.pages.current && s.pages._activeOfferIndex !== undefined) {
    const mp = s.pages;
    const ix = mp._activeOfferIndex!;
    const offer = mp.current!.offers[ix];

    // Consume treasure token and mark slot as resolved
    consumeToken(mp, offer);
    mp.current!.resolved[ix] = true;

    // Replace treasure slot with new encounter
    try {
      const out = replaceSingleOffer(mp, r, s, ix);
      r = out.rng;
      s.log.push(`Treasure slot ${ix} refreshed with new encounter`);
    } catch (e) {
      s.log.push(`Auto-refresh treasure slot failed: ${e}`);
    }

    // Clear active offer index
    mp._activeOfferIndex = undefined;
    mp._shopUsed = false;
  }
  
  s.log.push(`Treasure: took ${item.card.name} (FREE)`);
  return { state: s, rng: r };
}

export function takeSingleTreasureCard(s: GameState, cmd: Extract<Command, { type: 'TakeSingleTreasureCard' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'treasure_single' || !s.shopStock) return { state: s, rng: r };
  
  const i = cmd.index;
  if (i < 0 || i >= s.shopStock.length) {
    s.log.push('Single Treasure: invalid card selection');
    return { state: s, rng: r };
  }
  
  const item = s.shopStock[i];
  if (!('card' in item) || !item.card) {
    s.log.push('Single Treasure: invalid card');
    return { state: s, rng: r };
  }
  
  // Add card to master deck
  if (!s.masterDeck) s.masterDeck = [];
  s.masterDeck.push({ ...item.card });
  
  // No need to track global usage - each treasure is independent
  
  // Track as bought item for registry
  if (!s.shopBoughtItems) s.shopBoughtItems = [];
  s.shopBoughtItems.push({ card: item.card, price: 0 });
  
  // Clear treasure stock (chest is now empty)
  s.shopStock = [];
  
  // Auto-delete treasure from map after taking card
  const treasureId = s.currentShopId; // Save before clearing
  
  s.phase = 'map';
  s.shopKind = undefined;
  s.currentShopId = undefined;
  
  // Remove treasure from registry (it's consumed)
  if (s.shopRegistry && treasureId) {
    s.shopRegistry = s.shopRegistry.filter(shop => shop.id !== treasureId);
  }
  
  // Mark treasure as used and trigger map refresh
  if (s.pages && s.pages.current && s.pages._activeOfferIndex !== undefined) {
    const mp = s.pages;
    const ix = mp._activeOfferIndex!;
    const offer = mp.current!.offers[ix];

    // Consume treasure token and mark slot as resolved
    consumeToken(mp, offer);
    mp.current!.resolved[ix] = true;

    // Replace treasure slot with new encounter
    try {
      const out = replaceSingleOffer(mp, r, s, ix);
      r = out.rng;
      s.log.push(`Single treasure slot ${ix} refreshed with new encounter`);
    } catch (e) {
      s.log.push(`Auto-refresh single treasure slot failed: ${e}`);
    }
    
    // Clear active offer index
    mp._activeOfferIndex = undefined;
    mp._shopUsed = false;
  }
  
  s.log.push(`Single Treasure: took ${item.card.name} (FREE)`);
  return { state: s, rng: r };
}

export function randomizeSingleTreasure(s: GameState, _cmd: Extract<Command, { type: 'RandomizeSingleTreasure' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'treasure_single' || !s.shopStock) return { state: s, rng: r };
  
  // Check if already used randomize (limit once per treasure)
  if ((s as any)._singleTreasureRandomized) {
    s.log.push('Single Treasure: random already used');
    return { state: s, rng: r };
  }
  
  // Generate new card
  try {
    const { rollShopStock } = require('../../shop');
    const out = rollShopStock(r, 1, 1.3, getClass(s.classId).cardTag); // 1 card with slight power bias
    r = out.rng;
    s.shopStock = out.items.map((item: any) => ({ ...item, price: 0 })); // Set price to 0 (free)
  } catch {
    // Fallback if rollShopStock fails
    const fb = fallbackShopStock(r, 1);
    r = fb.rng;
    s.shopStock = fb.items.map(item => ({ ...item, price: 0 })); // Set price to 0 (free)
  }
  
  // Mark as randomized (can only use once)
  (s as any)._singleTreasureRandomized = true;
  
  // Update registry with new card for persistence
  if (s.shopRegistry && s.currentShopId) {
    const existingShop = s.shopRegistry.find(shop => shop.id === s.currentShopId);
    if (existingShop) {
      existingShop.inventory = (s.shopStock || []).map(item => ({
        card: ('card' in item ? item.card : undefined) as any,
        price: item.price || 0
      }));
    }
  }
  
  s.log.push('Single Treasure: randomized new card');
  return { state: s, rng: r };
}

export function takeShopEquipment(s: GameState, cmd: Extract<Command, { type: 'TakeShopEquipment' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'equipment' || !s.shopStock) return { state: s, rng: r };
  const i = cmd.index;
  const item = s.shopStock[i];
  if (!item) return { state: s, rng: r };
  if (!('equipment' in item)) return { state: s, rng: r }; // Only handle equipment items
  if (s.player.gold < item.price) {
    s.log.push('Equipment Shop: Not enough gold');
    return { state: s, rng: r };
  }
  
  // เพิ่ม equipment เข้า inventory (ยังไม่ equip)
  s.player.gold -= item.price;
  s.equipment = s.equipment || [];
  s.equipment.push(JSON.parse(JSON.stringify(item.equipment)));
  
  // Track bought item for shop persistence
  s.shopBoughtItems = s.shopBoughtItems || [];
  s.shopBoughtItems.push(JSON.parse(JSON.stringify(item)));
  
  s.shopStock.splice(i, 1);
  s.log.push(`Equipment Shop: bought ${item.equipment.name} for ${item.price}g`);
  
  if (s.mapMode === 'pages' && s.pages) {
    s.pages._shopUsed = true;
  }
  return { state: s, rng: r };
}
// ============================================================================
