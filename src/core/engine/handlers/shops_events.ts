// src/core/engine/handlers/shops_events.ts
import type { Command, GameState } from '../../types';
import {canRemoveCard} from '../shared';
import type { RNG } from '../../rng';
import { rollShopStock } from '../../shop';
import { applyRemoveCard, rollGamble, rollTreasure } from '../../events';
import { removeCostForCount, upgradeCostForCount } from '../../balance/economy';
import { SHOP_REROLL_COST } from '../../balance/economy';
import { DIFFICULTY, ECONOMY } from '../../balance/notfm';
import { rollTwoBlessings } from '../../level';
import { upgradeCard, canUpgrade, upgradeLevelOf, grantBlessing } from '../shared';
import { loseRun } from './runEnd';
/** Shop stock for the player's class. `only` narrows the pool (equipment shops). */
function stockFor(s: GameState, r: RNG, size: number, only?: (c: import('../../types').CardData) => boolean) {
  const out = rollShopStock(r, size, s.campaign?.night ?? 1, s.classId, only,s.campaign?.milestoneLevel??0);
  return { rng: out.rng, items: out.items };
}

/** The night shop: class cards plus equipment (ECONOMY.shopStock). */
function nightShopStock(s: GameState, r: RNG) {
  const cards = stockFor(s, r, ECONOMY.shopStock.cards, c => c.type !== 'equipment'); r = cards.rng;
  const gear = stockFor(s, r, ECONOMY.shopStock.equipment, c => c.type === 'equipment'); r = gear.rng;
  return { rng: r, items: [...cards.items, ...gear.items] };
}

/** Difficulty markup on any gold price (DIFFICULTY.priceFrom). */
export function markedUp(s: Partial<GameState>, price: number): number {
  return (s.campaign?.difficulty ?? 1) >= DIFFICULTY.priceFrom ? Math.ceil(price * (100 + DIFFICULTY.markupPct) / 100) : price;
}

/** Healing stops heal half from DIFFICULTY.priceFrom. */
export function healAmount(s: Partial<GameState>, amount: number): number {
  return (s.campaign?.difficulty ?? 1) >= DIFFICULTY.priceFrom ? Math.ceil(amount / 2) : amount;
}

/** Upgrades or removals already done at the stop that is open now. */
export function stopUses(s: Partial<GameState>): number { return s.shopBoughtItems?.length ?? 0; }
export function removePrice(s: Partial<GameState>): number { return markedUp(s, removeCostForCount(stopUses(s))); }
export function upgradePrice(s: Partial<GameState>): number { return markedUp(s, upgradeCostForCount(stopUses(s))); }

/** The night's blessing stop: pick one of ECONOMY.blessingChoices. */
export function openBlessingStop(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  const out = rollTwoBlessings(r, (s.blessings ?? []).map(b => b.id), ECONOMY.blessingChoices, s.campaign?.blessingTier ?? 0, s.classId); r = out.rng;
  s.blessingStock = out.list;
  s.shopKind = 'blessing';
  s.shopBoughtItems = [];
  s.phase = 'shop';
  return { state: s, rng: r };
}

export function takeShopBlessing(s: GameState, cmd: Extract<Command, { type: 'TakeShopBlessing' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'blessing' || !s.blessingStock?.[cmd.index]) return { state: s, rng: r };
  const pick = s.blessingStock[cmd.index];
  grantBlessing(s, JSON.parse(JSON.stringify(pick)));
  s.blessingStock = [];
  s.log.push(`ศาลพร: รับ ${pick.name}`);
  if (s.pages) { s.pages._shopUsed = true; require('../../map/adventure').rememberAdventureService(s); }
  return { state: s, rng: r };
}

export function shopReroll(s: GameState, _cmd: Extract<Command, { type: 'ShopReroll' }>, r: RNG) {
  if (s.phase !== 'shop') return { state: s, rng: r };
  if (s.shopKind !== 'card' && s.shopKind !== 'equipment') return { state: s, rng: r };
  const cost = markedUp(s, SHOP_REROLL_COST);
  if ((s.player.gold ?? 0) < cost) {
    s.log.push('Shop: Not enough gold to reroll');
    return { state: s, rng: r };
  }
  s.player.gold -= cost;
  { const out = s.shopKind === 'equipment' ? stockFor(s, r, 3, c => c.type === 'equipment') : nightShopStock(s, r); r = out.rng; s.shopStock = out.items; }
  s.log.push(`Shop: rerolled (-${cost}g)`);
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

/** Price after the difficulty markup and ต่อรองเจ้าที่ (the next purchase only). */
export function shopPrice(s: GameState, price: number): number {
  const p = markedUp(s, price);
  return s.shopPricePct != null ? Math.ceil(p * s.shopPricePct / 100) : p;
}

export function takeShop(s: GameState, cmd: Extract<Command, { type: 'TakeShop' }>, r: RNG) {
  if (s.phase !== 'shop' || (s.shopKind !== 'card' && s.shopKind !== 'equipment') || !s.shopStock) return { state: s, rng: r };
  const i = cmd.index;
  const item = s.shopStock[i];
  if (!item) return { state: s, rng: r };
  if (!('card' in item)) return { state: s, rng: r }; // Only handle card items
  const price = shopPrice(s, item.price);
  if (s.player.gold < price) {
    s.log.push('Shop: Not enough gold');
    return { state: s, rng: r };
  }
  s.player.gold -= price;
  s.shopPricePct = undefined;
  s.masterDeck.push(JSON.parse(JSON.stringify(item.card)));
  
  // Track bought item for shop persistence
  s.shopBoughtItems = s.shopBoughtItems || [];
  s.shopBoughtItems.push(JSON.parse(JSON.stringify(item)));
  
  s.shopStock.splice(i, 1);
  s.log.push(`Shop: bought ${item.card.name} for ${item.price}g`);
  // โหมด pages: ถือว่า "ใช้ร้าน" แล้ว (จะ resolve ตอนปิดร้าน)
  if (s.pages) {
    s.pages._shopUsed = true;
  }  
  return { state: s, rng: r };
}

export function shopRemoveBuy(s: GameState, cmd: Extract<Command, { type: 'ShopRemoveBuy' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'remove') return { state: s, rng: r };
  const count = (s.runCounters?.removeShopCount ?? 0);
  const price = removePrice(s);
  if ((s.player.gold ?? 0) < price) {
    s.log.push(`Remove shop: Not enough gold (${price}g).`);
    return { state: s, rng: r };
  }
  const i = cmd.index;
  if (!Number.isInteger(i) || i < 0 || i >= (s.masterDeck?.length ?? 0)) return { state: s, rng: r };
  if (!Number.isInteger(i)||!canRemoveCard(s.masterDeck[i],s.masterDeck.length)) return {state:s,rng:r};
  s.player.gold -= price;
  s.masterDeck.splice(i, 1);
  s.runCounters = s.runCounters || ({} as any);
  (s.runCounters as any).removeShopCount = count + 1;
  s.shopBoughtItems = [...(s.shopBoughtItems ?? []), { card: { id: 'remove', name: 'สละการ์ด' } as any, price }];
  s.log.push(`Remove shop: removed card #${i} (-${price}g).`);
  if (s.pages) s.pages._shopUsed = true;
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
  const i = cmd.index;
  if (!Number.isInteger(i) || i < 0 || i >= (s.masterDeck?.length ?? 0)) return { state: s, rng: r };

  // ใบที่เต็มขั้นแล้วปลุกต่อไม่ได้ — กันไว้ที่นี่ด้วย ไม่ใช่แค่ซ่อนปุ่มใน UI
  // ไม่งั้นเสียเบี้ยฟรีโดยไม่มีอะไรเปลี่ยน
  if (!canUpgrade(s.masterDeck[i])) {
    s.log.push('การ์ดใบนี้ปลุกเสกจนสุดแล้ว');
    return { state: s, rng: r };
  }

  // ราคาคิดจากทั้งจำนวนครั้งที่ใช้ร้าน **และขั้นของใบนั้น** — ปั้นใบเดียวให้สุด
  // จึงแพงกว่าไล่ปลุกหลายใบขั้นละหนึ่ง ซึ่งเป็นการแลกที่ควรรู้สึกได้
  const count = (s.runCounters?.upgradeShopCount ?? 0);
  const price = upgradePrice(s);
  if ((s.player.gold ?? 0) < price) {
    s.log.push(`เบี้ยไม่พอ (ต้องการ ${price})`);
    return { state: s, rng: r };
  }

  s.player.gold -= price;
  s.masterDeck[i] = upgradeCard(s.masterDeck[i]);
  s.runCounters = s.runCounters || ({} as any);
  (s.runCounters as any).upgradeShopCount = count + 1;
  s.shopBoughtItems = [...(s.shopBoughtItems ?? []), { card: { id: 'upgrade', name: 'ปลุกเสก' } as any, price }];
  s.log.push(`Upgrade shop: upgraded card #${i} (-${price}g).`);
  if (s.pages) s.pages._shopUsed = true;
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
  const out = nightShopStock(s, r); r = out.rng;
  s.shopStock = out.items;
  s.shopKind = 'card';
  s.shopBoughtItems = [];
  s.phase = 'shop';
  return { state: s, rng: r };
}

export function openShopRemove(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  s.shopKind = 'remove';
  s.shopBoughtItems = []; // Reset bought items tracker
  s.phase = 'shop';
  // ไม่จำเป็นต้องคำนวณราคา ณ จุดเปิดร้าน เพราะ UI อาจอ่านจาก removeCostForCount ตอนกดซื้อ
  s.log.push(`Shop(remove): cost now = ${removePrice(s)}g`);
  return { state: s, rng: r };
}

export function openShopUpgrade(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  s.shopKind = 'upgrade';
  s.shopBoughtItems = []; // Reset bought items tracker
  s.phase = 'shop';
  s.log.push(`Shop(upgrade): cost now = ${upgradePrice(s)}g`);
  return { state: s, rng: r };
}

/** Equipment shop: equipment cards for the deck. */
export function openShopEquipment(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  const out = stockFor(s, r, 3, c => c.type === 'equipment'); r = out.rng;
  s.shopStock = out.items;
  s.shopKind = 'equipment';
  s.shopBoughtItems = [];
  s.phase = 'shop';
  return { state: s, rng: r };
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
  const healCost = shrineCost(s);
  const maxUses = ECONOMY.shrine.uses;
  
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
  const healed = healAmount(s, s.player.maxHp - s.player.hp); // full heal, half from DIFFICULTY.priceFrom
  s.player.hp += healed;
  
  // Track usage
  if (!(s as any).healingShrine) {
    (s as any).healingShrine = { timesUsed: 0 };
  }
  (s as any).healingShrine.timesUsed += 1;
  if(s.pages)s.pages._shopUsed=true;
  
  // Track as bought item for registry
  if (!s.shopBoughtItems) s.shopBoughtItems = [];
  s.shopBoughtItems.push({ card: { id: 'healing', name: 'Full Heal' } as any, price: healCost });
  
  s.log.push(`Healing Shrine: used (+${healed} HP, -${healCost}g). Uses: ${(s as any).healingShrine.timesUsed}/${maxUses}`);
  return { state: s, rng: r };
}

export function shrineCost(s: Partial<GameState>): number {
  return markedUp(s, ECONOMY.shrine.price + ((s as any).healingShrine?.timesUsed ?? 0) * ECONOMY.shrine.step);
}
export function wellHeal(s: Partial<GameState>): number { return healAmount(s, ECONOMY.well.heal); }

export function useWell(s: GameState, _cmd: Extract<Command, { type: 'UseWell' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'well') return { state: s, rng: r };
  
  const wellCount = (s as any).mysticalWell?.timesUsed ?? 0;
  const maxUses = ECONOMY.well.uses;
  const heal = wellHeal(s);
  
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
  const actualHeal = Math.min(heal, s.player.maxHp - s.player.hp);
  s.player.hp += actualHeal;
  
  // Track usage
  if (!(s as any).mysticalWell) {
    (s as any).mysticalWell = { timesUsed: 0 };
  }
  (s as any).mysticalWell.timesUsed += 1;
  if(s.pages)s.pages._shopUsed=true;
  
  // Track as bought item for registry (price = 0 for free)
  if (!s.shopBoughtItems) s.shopBoughtItems = [];
  s.shopBoughtItems.push({ card: { id: 'well_drink', name: 'Free Heal' } as any, price: 0 });
  
  const remaining = maxUses - (s as any).mysticalWell.timesUsed;
  s.log.push(`Mystical Well: used (+${actualHeal} HP) FREE. Remaining: ${remaining}/${maxUses}`);
  return { state: s, rng: r };
}

export function openTreasureChest(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  // Generate 2 random cards for treasure chest
  { const out = stockFor(s, r, 2); r = out.rng; s.shopStock = out.items.map(item => ({ ...item, price: 0 })); }
  s.shopKind = 'treasure';
  s.phase = 'shop';
  s.log.push('Event: treasure chest opened');
  return { state: s, rng: r };
}

export function openSingleTreasure(s: GameState, r: RNG): { state: GameState; rng: RNG } {
  // Generate 1 random card for single treasure
  { const out = stockFor(s, r, 1); r = out.rng; s.shopStock = out.items.map(item => ({ ...item, price: 0 })); }
  s.shopKind = 'treasure_single';
  s.phase = 'shop';
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
  if(s.pages?.adventure?.version===5){s.pages._shopUsed=true;require('../../map/adventure').rememberAdventureService(s);return {state:s,rng:r};}
  
  // Auto-delete treasure from map after taking card
  const treasureId = s.currentShopId; // Save before clearing
  
  s.phase = 'map';
  s.shopKind = undefined;
  s.currentShopId = undefined;
  
  // Remove treasure from registry (it's consumed)
  if (s.shopRegistry && treasureId) {
    s.shopRegistry = s.shopRegistry.filter(shop => shop.id !== treasureId);
  }
  
  if(s.pages?.adventure&&s.pages._activeOfferIndex!=null)require('../../map/adventure').settleAdventureSlot(s,s.pages._activeOfferIndex);
  
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
  if(s.pages?.adventure?.version===5){s.pages._shopUsed=true;require('../../map/adventure').rememberAdventureService(s);return {state:s,rng:r};}
  
  // Auto-delete treasure from map after taking card
  const treasureId = s.currentShopId; // Save before clearing
  
  s.phase = 'map';
  s.shopKind = undefined;
  s.currentShopId = undefined;
  
  // Remove treasure from registry (it's consumed)
  if (s.shopRegistry && treasureId) {
    s.shopRegistry = s.shopRegistry.filter(shop => shop.id !== treasureId);
  }
  
  if(s.pages?.adventure&&s.pages._activeOfferIndex!=null)require('../../map/adventure').settleAdventureSlot(s,s.pages._activeOfferIndex);
  
  s.log.push(`Single Treasure: took ${item.card.name} (FREE)`);
  return { state: s, rng: r };
}

export function randomizeSingleTreasure(s: GameState, _cmd: Extract<Command, { type: 'RandomizeSingleTreasure' }>, r: RNG) {
  if (s.phase !== 'shop' || s.shopKind !== 'treasure_single' || !s.shopStock) return { state: s, rng: r };
  if(!s.shopStock.length)return {state:s,rng:r};
  
  // Check if already used randomize (limit once per treasure)
  if ((s as any)._singleTreasureRandomized) {
    s.log.push('Single Treasure: random already used');
    return { state: s, rng: r };
  }
  
  // Generate new card
  { const out = stockFor(s, r, 1); r = out.rng; s.shopStock = out.items.map(item => ({ ...item, price: 0 })); }
  
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

// ============================================================================
