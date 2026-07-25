// src/core/engine/handlers/map_pages.ts
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import * as ShopEv from './shops_events';

import {
  initPageMap,
  rollPageOffers,
  consumeToken,
  type MapStatePages,
  type PageOffer,
} from '../../map/pages';

import { pickEnemy } from '../../pack';
import { buildAndShuffleDeck, drawUpTo, startPlayerTurn } from '../../commands';
import { PAGE_FORCE_SPLIT_AT, PAGE_MIN_BEFORE_SPLIT, SECRET_BOSS_HP_RATIO } from '../../balance/weights';
import { resetBlessingTurnFlags, runBlessingsTurnHook } from '../../blessingRuntime';
import { START_ENERGY } from '../../balance/core';
import { buildAndShuffleEnemyDeck } from './enemy';
import { runEquipmentOnEquip } from '../../equipmentRuntime';
import { deckForMonster } from '../../monsters/monster-decks';
import { planEnemyIntent } from '../../combat/intent';
import { applyClassCombatStart } from '../../classes';
import { getEquipmentById } from '../../pack';
import {
  usesJourney, enterNode, advanceJourney, unlockSecretBossRows,
} from '../../map/journeySync';

// Helper: refresh single slot with a new offer (respect pools/duplicates)
export function replaceSingleOffer(mp: MapStatePages, rng: RNG, s: GameState, slotIndex: number) {
  const ro = rollPageOffers(mp, rng, s); rng = ro.rng;
  const current = (mp.current?.offers ?? []) as PageOffer[];
  const otherKinds = current.map((o, i) => i !== slotIndex ? (o && (o as any).kind) : undefined);
  let pick: PageOffer | undefined;
  for (const o of ro.offers) {
    if (!otherKinds.includes((o as any).kind)) { pick = o; break; }
  }
  if (!pick) pick = ro.offers[0];
  if (mp.current) {
    (mp.current.offers as any[])[slotIndex] = pick as any;
    (mp.current.resolved as any[])[slotIndex] = false;
  }
  return { rng };
}



type ShopOpenFn = (s: GameState, r: RNG) => { state: GameState; rng: RNG };

// Remove temporary equipment after combat
function removeTemporaryEquipment(s: GameState) {
  if (!s.equipped) return;
  
  const permanentEquipment = s.equipped.filter(eq => !eq.temporary);
  const removedCount = s.equipped.length - permanentEquipment.length;
  
  s.equipped = permanentEquipment;
  
  if (removedCount > 0) {
    s.log.push(`Removed ${removedCount} temporary equipment`);
  }
}

function resolveShops(): {
  openShopCard?: ShopOpenFn;
  openShopRemove?: ShopOpenFn;
  openShopUpgrade?: ShopOpenFn;
  openWell?: ShopOpenFn;
} {
  const mod = require('./shops_events') || {};
  return {
    // พยายามรองรับหลายชื่อที่ทีมอาจใช้
    openShopCard: mod.openShopCard ?? mod.openCardShop ?? mod.openShopCards ?? mod.openShop,
    openShopRemove: mod.openShopRemove ?? mod.openRemoveShop ?? mod.openShopRemoveFn,
    openShopUpgrade: mod.openShopUpgrade ?? mod.openUpgradeShop ?? mod.openShopUpgradeFn,
    openWell: mod.openWell ?? mod.openEventWell ?? mod.openWellEvent,
  };
}

function callOrLog(
  fn: ShopOpenFn | undefined,
  name: string,
  s: GameState,
  r: RNG
): { state: GameState; rng: RNG } {
  if (!fn) {
    s.log.push(`Shop/Event resolver: "${name}" undefined (check exports in shops_events.ts)`);
    return { state: s, rng: r };
  }
  return fn(s, r);
}

// -------------------------------------------------
// Helpers
// -------------------------------------------------
function ensurePages(s: GameState, r: RNG): { rng: RNG; mp: MapStatePages } {
  if (!s.pages) {
    const out = initPageMap(r);
    s.mapMode = 'pages';
    s.pages = out.map;
    return { rng: out.rng, mp: s.pages };
  }
  
  // Ensure deletedShops exists for existing saves
  if (!s.pages.deletedShops) {
    s.pages.deletedShops = [];
  }
  
  return { rng: r, mp: s.pages };
}

/**
 * ล้างสเตตที่เหลือจากคอมแบตก่อนกลับสู่หน้าแผนที่
 * ใช้ร่วมกันทั้งคอมแบตปกติและบอส — เดิมทางบอสไม่ได้ล้าง ทำให้ศัตรูที่ตายแล้ว
 * ติดไปกับ state ต่อ
 */
function clearCombatState(s: GameState) {
  s.enemy = undefined;
  (s as any).enemyPiles = undefined;
  (s as any).playerPiles = undefined;
  (s as any).enemyIntentCardId = null;
  s.player.block = 0;
  s.player.energy = s.player.maxEnergy ?? START_ENERGY;
}

function formatOffer(o: PageOffer): string {
  return o.kind === 'monster' ? `monster:${o.tier}` : o.kind;
}

function openPageInternal(s: GameState, mp: MapStatePages, r: RNG) {
  const out = rollPageOffers(mp, r, s);
  r = out.rng;
  const offers: PageOffer[] = out.offers as PageOffer[];
  mp.current = { offers, resolved: offers.map(() => false) };
  mp._activeOfferIndex = undefined;
  mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
  s.phase = 'map';
  (s as any).nodePhase = 'map_ready';
  s.log.push(
    `Page ${mp.pageIndex + 1}/${mp.totalPages}: ${offers
      .map((o: PageOffer) => formatOffer(o))
      .join(', ')}`
  );
  return { state: s, rng: r };
}

// -------------------------------------------------
// Commands
// -------------------------------------------------
export function qaInitPages(s: GameState, _cmd: Extract<Command, { type: 'QA_InitPages' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;
  mp.pageIndex = 0;
  return openPageInternal(s, mp, rng);
}

export function open(s: GameState, _cmd: Extract<Command, { type: 'OpenPage' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;
  // ถ้ายังเคลียร์หน้าเดิมไม่ครบ อย่า roll ใหม่
  if (mp.current && !mp.current.resolved.every(Boolean)) {
    return { state: s, rng };
  }
  return openPageInternal(s, mp, rng);
}

export function qaPrintPage(s: GameState, _cmd: Extract<Command, { type: 'QA_PrintPage' }>, r: RNG) {
  const got = ensurePages(s, r);
  const { rng, mp } = got;
  if (!mp.current) return { state: s, rng };
  const offers: PageOffer[] = mp.current.offers as PageOffer[];
  const { resolved } = mp.current;
  s.log.push(
    offers
      .map((o: PageOffer, i: number) => `${i}:${formatOffer(o)}${resolved[i] ? '✓' : ''}`)
      .join(' | ')
  );
  return { state: s, rng };
}

export function choose(s: GameState, cmd: Extract<Command, { type: 'ChooseOffer' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;

  if (!mp.current) return { state: s, rng };
  const ix = cmd.index;
  const offers: PageOffer[] = mp.current.offers as PageOffer[];
  const offer: PageOffer | undefined = offers[ix];
  if (!offer || mp.current.resolved[ix]) return { state: s, rng };

  // แผนที่แบบเดินทาง: เลือกช่องไหน = เดินไปยืนที่โหนดนั้น เดินแล้วเดินกลับไม่ได้
  if (usesJourney(s)) enterNode(s, ix);

  switch (offer.kind) {
    case 'monster': {
      // เริ่มคอมแบต (normal/elite)
      s.phase = 'combat';
      (s as any).nodePhase = 'in_combat';
      s.turn = 1;
      // PATCH: กัน PlayCard ไม่ทำงานเพราะ lock ค้างจากไฟต์ก่อน
      s.combatVictoryLock = false;
      // เคลียร์สเตตคอมแบตก่อนทุกครั้ง (ป้องกันหลงเหลือจากไฟต์ก่อน)
      (s as any).enemyPiles = undefined;
      (s as any).playerPiles = undefined;
      (s as any).enemyIntentCardId = null;
      s.player.block = 0;
      s.player.energy = s.player.maxEnergy ?? START_ENERGY;
      
      // Set temporary equipment slots during combat  
      s.equipmentTempSlots = 5; // Allow 5 additional equipment during combat

      // ใช้ศัตรูที่กำหนดไว้ใน offer แทนการ random
      const { getMonsterById } = require('../../monsters/thai-ghosts');
      const thaiMonster = getMonsterById(offer.enemyId);
      if (!thaiMonster) {
        s.log.push(`❌ Monster ${offer.enemyId} not found`);
        return { state: s, rng };
      }
      
      // สร้าง EnemyState จาก Thai monster data
      // เด็คมาจาก monster-decks.ts — เดิม hardcode ['claw','guard'] ให้ทุกตัว
      // ทำให้ผี 31 ตนเล่นเหมือนกันหมด ต่างกันแค่ HP
      const deck = deckForMonster(thaiMonster);
      s.enemy = {
        id: thaiMonster.id,
        name: thaiMonster.name,
        hp: thaiMonster.hp,
        maxHp: thaiMonster.hp,
        dmg: Math.floor(thaiMonster.hp / 5),
        block: 0,
        ai: { cycle: ['claw', 'guard'], index: 0, deck },
        maxEnergy: deck.maxEnergy,
        handSize: deck.handSize,
        intentCardId: null,
      };
      ({ state: s, rng } = buildAndShuffleEnemyDeck(s, rng));
      // ประกาศแผนของศัตรูตั้งแต่เทิร์นแรก ผู้เล่นจะได้วางแผนตั้งแต่ไพ่ใบแรก
      planEnemyIntent(s);
      // พรติดตัวของคลาสที่ทำงานตอนเริ่มไฟต์
      applyClassCombatStart(s);
      
      // Initialize enemy behaviors and minions
      const { initializeEnemyBehaviors } = require('../../enemyBehaviorRuntime');
      const { syncMinionsToState } = require('../../minionRuntime');
      
      initializeEnemyBehaviors(s);
      // Don't clear minions on combat start - let them persist from previous summons
      syncMinionsToState(s);
      
      // ตั้ง intent แสดงล่วงหน้า (ไพ่บนสุดของ draw)
      (s as any).enemyIntentCardId = (s as any).enemyPiles?.draw?.[0] ?? null;

      // สร้างเด็คผู้เล่น + จั่วมือแรก
      ({ state: s, rng } = buildAndShuffleDeck(s, rng));
      ({ state: s, rng } = drawUpTo(s, rng, s.player.maxHandSize));

      // ★ Equipment: battle-start hook (NOTM-style)
      runEquipmentOnEquip(s); // Player equipment
      runEquipmentOnEquip(s, 'enemy'); // Enemy equipment

      // start-of-turn blessing hooks
      resetBlessingTurnFlags(s);
      runBlessingsTurnHook(s, 'on_turn_start');

      mp._activeOfferIndex = ix;
      mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push(`ChooseOffer → combat (${offer.tier}) vs ${s.enemy?.id ?? s.enemy?.name ?? 'Enemy'}`);
      return { state: s, rng };
    }

    case 'boss': {
      s.phase = 'combat';
      (s as any).nodePhase = 'in_combat';
      s.turn = 1;
      // PATCH: กัน PlayCard ไม่ทำงานเพราะ lock ค้างจากไฟต์ก่อน
      s.combatVictoryLock = false;
      (s as any).enemyPiles = undefined;
      (s as any).playerPiles = undefined;
      (s as any).enemyIntentCardId = null;
      s.player.block = 0;
      s.player.energy = s.player.maxEnergy ?? START_ENERGY;
      
      // Set temporary equipment slots during combat  
      s.equipmentTempSlots = 5; // Allow 5 additional equipment during combat

      // ใช้บอสที่กำหนดไว้ใน offer แทนการ random
      const { getMonsterById } = require('../../monsters/thai-ghosts');
      const thaiBoss = getMonsterById(offer.enemyId);
      if (!thaiBoss) {
        s.log.push(`❌ Boss ${offer.enemyId} not found`);
        return { state: s, rng };
      }
      
      // สร้าง EnemyState จาก Thai boss data — เด็คตามตัวเช่นเดียวกับผีทั่วไป
      const bossDeck = deckForMonster(thaiBoss);
      s.enemy = {
        id: thaiBoss.id,
        name: thaiBoss.name,
        hp: thaiBoss.hp,
        maxHp: thaiBoss.hp,
        dmg: Math.floor(thaiBoss.hp / 4), // บอสแรงกว่า
        block: 0,
        ai: { cycle: ['claw', 'guard', 'spell'], index: 0, deck: bossDeck },
        maxEnergy: bossDeck.maxEnergy,
        handSize: bossDeck.handSize,
        intentCardId: null,
      };
      ({ state: s, rng } = buildAndShuffleEnemyDeck(s, rng));
      // ประกาศแผนของศัตรูตั้งแต่เทิร์นแรก ผู้เล่นจะได้วางแผนตั้งแต่ไพ่ใบแรก
      planEnemyIntent(s);
      // พรติดตัวของคลาสที่ทำงานตอนเริ่มไฟต์
      applyClassCombatStart(s);
      
      // Initialize boss behaviors and minions
      const { initializeEnemyBehaviors } = require('../../enemyBehaviorRuntime');
      const { syncMinionsToState } = require('../../minionRuntime');
      
      initializeEnemyBehaviors(s);
      // Don't clear minions on combat start - let them persist from previous summons
      syncMinionsToState(s);
      
      (s as any).enemyIntentCardId = (s as any).enemyPiles?.draw?.[0] ?? null;

      ({ state: s, rng } = buildAndShuffleDeck(s, rng));
      ({ state: s, rng } = drawUpTo(s, rng, s.player.maxHandSize));

      // ★ Equipment: battle-start hook (NOTM-style)
      runEquipmentOnEquip(s); // Player equipment
      runEquipmentOnEquip(s, 'enemy'); // Enemy equipment      

      resetBlessingTurnFlags(s);
      runBlessingsTurnHook(s, 'on_turn_start');

      mp._activeOfferIndex = ix;
      mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push('ChooseOffer → combat (boss)');
      return { state: s, rng };
    }

    case 'shop_card': {
      console.log('🛒 Shop_card handler debug:', {
        shopId: offer.shopId,
        registryLength: s.shopRegistry?.length || 0,
        registryShops: s.shopRegistry?.map(sh => `${sh.id}(${sh.inventory.length} items)`)
      });
      
      // Check if shop exists in registry (persistent shop)
      const existingShop = s.shopRegistry?.find(shop => shop.id === offer.shopId);
      console.log('🛒 Found existing shop:', existingShop ? 'YES' : 'NO', existingShop?.inventory.length);
      
      if (existingShop) {
        console.log('🛒 Loading existing inventory:', existingShop.inventory.map(item => ('card' in item ? (item.card as any)?.name : undefined)));
      }
      
      if (existingShop) {
        // Use existing shop inventory
        s.shopStock = existingShop.inventory.map(item => ({ card: ('card' in item ? item.card : undefined) as any, price: item.price }));
        s.shopKind = 'card';
        s.shopBoughtItems = []; // Reset bought items tracker
        s.currentShopId = offer.shopId; // Set current shop ID for saving
        s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
        s.log.push(`ChooseOffer → existing shop_card (${existingShop.inventory.length} items)`);
        return { state: s, rng };
      }
      
      // Create new shop
      if (typeof ShopEv.openShopCard !== 'function') {
        s.log.push('openShopCard missing export in shops_events.ts');
        return { state: s, rng };
      }
      const out = ShopEv.openShopCard(s, rng);
      s = out.state; rng = out.rng;
      s.currentShopId = offer.shopId; // Track current shop ID
      mp._activeOfferIndex = ix; mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push(`ChooseOffer → new shop_card (${offer.shopId})`);
      return { state: s, rng };
    }

    case 'shop_remove': {
      // Check if shop exists in registry (persistent shop)
      const existingShop = s.shopRegistry?.find(shop => shop.id === offer.shopId);
      
      if (existingShop) {
        // Use existing shop
        s.shopKind = 'remove';
        s.shopBoughtItems = []; // Reset bought items tracker
        s.currentShopId = offer.shopId; // Track current shop ID
        s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
        s.log.push(`ChooseOffer → existing shop_remove (${offer.shopId})`);
        return { state: s, rng };
      }
      
      // Create new shop
      if (typeof ShopEv.openShopRemove !== 'function') {
        s.log.push('openShopRemove missing export in shops_events.ts');
        return { state: s, rng };
      }
      const out = ShopEv.openShopRemove(s, rng);
      s = out.state; rng = out.rng;
      s.currentShopId = offer.shopId; // Track current shop ID
      mp._activeOfferIndex = ix; mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push(`ChooseOffer → new shop_remove (${offer.shopId})`);
      return { state: s, rng };
    }

    case 'shop_upgrade': {
      // Check if shop exists in registry (persistent shop)
      const existingShop = s.shopRegistry?.find(shop => shop.id === offer.shopId);
      
      if (existingShop) {
        // Use existing shop
        s.shopKind = 'upgrade';
        s.shopBoughtItems = []; // Reset bought items tracker
        s.currentShopId = offer.shopId; // Track current shop ID
        s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
        s.log.push(`ChooseOffer → existing shop_upgrade (${offer.shopId})`);
        return { state: s, rng };
      }
      
      // Create new shop
      if (typeof ShopEv.openShopUpgrade !== 'function') {
        s.log.push('openShopUpgrade missing export in shops_events.ts');
        return { state: s, rng };
      }
      const out = ShopEv.openShopUpgrade(s, rng);
      s = out.state; rng = out.rng;
      s.currentShopId = offer.shopId; // Track current shop ID
      mp._activeOfferIndex = ix; mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push(`ChooseOffer → new shop_upgrade (${offer.shopId})`);
      return { state: s, rng };
    }

    case 'shop_equipment': {
      // Check if shop exists in registry (persistent shop)
      const existingShop = s.shopRegistry?.find(shop => shop.id === offer.shopId);
      
      if (existingShop) {
        // Use existing shop inventory for equipment
        s.shopStock = existingShop.inventory.map(item => ({ equipment: ('equipment' in item ? item.equipment : undefined) as any, price: item.price }));
        s.shopKind = 'equipment';
        s.shopBoughtItems = []; // Reset bought items tracker
        s.currentShopId = offer.shopId; // Track current shop ID
        s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
        s.log.push(`ChooseOffer → existing shop_equipment (${existingShop.inventory.length} items)`);
        return { state: s, rng };
      }
      
      // Create new shop
      if (typeof ShopEv.openShopEquipment !== 'function') {
        s.log.push('openShopEquipment missing export in shops_events.ts');
        return { state: s, rng };
      }
      const out = ShopEv.openShopEquipment(s, rng);
      s = out.state; rng = out.rng;
      s.currentShopId = offer.shopId; // Track current shop ID
      mp._activeOfferIndex = ix; mp._shopUsed = false;
  (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push(`ChooseOffer → new shop_equipment (${offer.shopId})`);
  return { state: s, rng };
    }

    case 'well': {
      // Check if well exists in registry (persistent well)
      const existingWell = s.shopRegistry?.find(shop => shop.id === offer.shopId);
      
      if (existingWell) {
        // Use existing well
        s.shopKind = 'well';
        s.shopBoughtItems = []; // Reset bought items tracker
        s.currentShopId = offer.shopId; // Track current well ID
        s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
        (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
        s.log.push(`ChooseOffer → existing well (${offer.shopId})`);
        return { state: s, rng };
      }
      
      // Create new well
      s.shopKind = 'well';
      s.shopBoughtItems = []; // Reset bought items tracker
      s.currentShopId = offer.shopId; // Track current well ID
      s.phase = 'shop';
      mp._activeOfferIndex = ix; mp._shopUsed = false;
      (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push(`ChooseOffer → new well (${offer.shopId})`);
      return { state: s, rng };
    }

    case 'healing_shrine': {
      // Check if shrine exists in registry (persistent shrine)
      const existingShrine = s.shopRegistry?.find(shop => shop.id === offer.shopId);
      
      if (existingShrine) {
        // Use existing shrine
        s.shopKind = 'healing';
        s.shopBoughtItems = []; // Reset bought items tracker
        s.currentShopId = offer.shopId; // Track current shrine ID
        s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
        (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
        s.log.push(`ChooseOffer → existing healing_shrine (${offer.shopId})`);
        return { state: s, rng };
      }
      
      // Create new shrine
      s.shopKind = 'healing';
      s.shopBoughtItems = []; // Reset bought items tracker
      s.currentShopId = offer.shopId; // Track current shrine ID
      s.phase = 'shop';
      mp._activeOfferIndex = ix; mp._shopUsed = false;
      (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push(`ChooseOffer → new healing_shrine (${offer.shopId})`);
      return { state: s, rng };
    }

    case 'treasure': {
      // Check if treasure chest exists in registry (persistent treasure)
      const existingTreasure = s.shopRegistry?.find(shop => shop.id === offer.shopId);
      
      if (existingTreasure) {
        // Use existing treasure chest
        s.shopKind = 'treasure';
        s.shopStock = existingTreasure.inventory.map(item => ({ card: ('card' in item ? item.card : undefined) as any, price: item.price }));
        s.shopBoughtItems = []; // Reset bought items tracker
        s.currentShopId = offer.shopId; // Track current treasure ID
        s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
        (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
        s.log.push(`ChooseOffer → existing treasure (${offer.shopId})`);
        return { state: s, rng };
      }
      
      // Create new treasure chest with 2 random cards
      const out = ShopEv.openTreasureChest(s, rng);
      s = out.state; rng = out.rng;
      s.currentShopId = offer.shopId; // Track current treasure ID
      
      // Save treasure to registry for persistence
      if (!s.shopRegistry) s.shopRegistry = [];
      const treasureInventory = (s.shopStock || []).map(item => ({
        card: ('card' in item ? item.card : undefined) as any,
        price: item.price || 0
      }));
      s.shopRegistry.push({
        id: offer.shopId,
        kind: 'treasure',
        inventory: treasureInventory,
        boughtItems: [],
        timesEncountered: 1,
        itemsBought: 0,
      });
      
      mp._activeOfferIndex = ix; mp._shopUsed = false;
      (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push(`ChooseOffer → new treasure chest (${offer.shopId})`);
      return { state: s, rng };
    }

    case 'treasure_single': {
      // Check if single treasure exists in registry (persistent treasure)
      const existingSingleTreasure = s.shopRegistry?.find(shop => shop.id === offer.shopId);
      
      if (existingSingleTreasure) {
        // Use existing single treasure
        s.shopKind = 'treasure_single';
        s.shopStock = existingSingleTreasure.inventory.map(item => ({ card: ('card' in item ? item.card : undefined) as any, price: item.price }));
        s.shopBoughtItems = []; // Reset bought items tracker
        s.currentShopId = offer.shopId; // Track current treasure ID
        s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
        (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
        s.log.push(`ChooseOffer → existing single treasure (${offer.shopId})`);
        return { state: s, rng };
      }
      
      // Create new single treasure with 1 random card
      const out = ShopEv.openSingleTreasure(s, rng);
      s = out.state; rng = out.rng;
      s.currentShopId = offer.shopId; // Track current treasure ID
      
      // Save single treasure to registry for persistence
      if (!s.shopRegistry) s.shopRegistry = [];
      const singleTreasureInventory = (s.shopStock || []).map(item => ({
        card: ('card' in item ? item.card : undefined) as any,
        price: item.price || 0
      }));
      s.shopRegistry.push({
        id: offer.shopId,
        kind: 'treasure_single',
        inventory: singleTreasureInventory,
        boughtItems: [],
        timesEncountered: 1,
        itemsBought: 0,
      });
      
      mp._activeOfferIndex = ix; mp._shopUsed = false;
      (s.pages as any)._resolvesOnPage = 0; // reset page resolves counter
      s.log.push(`ChooseOffer → new single treasure (${offer.shopId})`);
      return { state: s, rng };
    }

    case 'next_event': {
      // ใช้ token แล้วข้ามหน้าเลย
      consumeToken(mp, offer);
      mp.current.resolved[ix] = true;
      s.log.push('ChooseOffer → next_event (proceed)');
      return proceed(s, { type: 'Proceed' } as any, rng);
    }

    default:
      return { state: s, rng };
  }
}

export function dismiss(s: GameState, cmd: Extract<Command, { type: 'DismissOffer' }>, r: RNG) {
  const got = ensurePages(s, r);
  const { rng, mp } = got;
  if (!mp.current) return { state: s, rng };

  // บนเส้นทางไม่มีการ "ปัดทิ้ง" — ต้องเลือกทางใดทางหนึ่งเสมอ
  if (usesJourney(s)) return { state: s, rng };

  const ix = cmd.index;
  const offer: PageOffer | undefined = (mp.current.offers as PageOffer[])[ix];
  if (!offer || mp.current.resolved[ix]) return { state: s, rng };

  mp.current.resolved[ix] = true;
  consumeToken(mp, offer);
  s.log.push(`DismissOffer: ${formatOffer(offer)}`);
  return { state: s, rng };
}

export function proceed(s: GameState, _cmd: Extract<Command, { type: 'Proceed' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;

  // บนเส้นทางไม่มีปุ่ม "ไปหน้าถัดไป" — ชั้นถัดไปเปิดเองเมื่อจบโหนดปัจจุบัน
  if (usesJourney(s)) {
    s.phase = 'map';
    (s as any).nodePhase = 'map_ready';
    advanceJourney(s);
    return { state: s, rng };
  }

  if (mp.pageIndex + 1 >= mp.totalPages) {
    s.log.push('Proceed: already at last page');
    return { state: s, rng };
  }
  mp.pageIndex += 1;
  mp.current = undefined;
  return open(s, { type: 'OpenPage' } as any, rng);
}

export function completeNode(s: GameState, _cmd: Extract<Command, { type: 'CompleteNode' }>, r: RNG) {
  const got = ensurePages(s, r);
  let { rng, mp } = got;

  if (!mp.current) return { state: s, rng };
  const ix = mp._activeOfferIndex;
  const onJourney = usesJourney(s);

  if (ix != null && (mp.current.offers as PageOffer[])[ix]) {
    const offer: PageOffer = (mp.current.offers as PageOffer[])[ix] as PageOffer;

    if (s.phase === 'victory') {
      // จบคอมแบต → resolve + consume token
      mp.current.resolved[ix] = true;
      consumeToken(mp, offer);

      if (offer.kind === 'boss') {
        s.equipmentTempSlots = 0;
        removeTemporaryEquipment(s);
        mp._activeOfferIndex = undefined;
        mp._shopUsed = false;
        clearCombatState(s);

        // บอสกลาง — จบภาคแรก แล้วเดินทางต่อ ไม่ใช่จบรัน
        if (offer.bossType === 'mid') {
          s.log.push('ชนะบอสกลาง เดินทางต่อสู่ภาคสอง');
          return proceed(s, { type: 'Proceed' } as any, rng);
        }

        // บอสสุดท้าย — ถ้าเลือดเหลือมากพอ ปลดล็อคศึกลับต่อท้าย
        if (offer.bossType === 'final') {
          const hpRatio = s.player.hp / Math.max(1, s.player.maxHp);
          if (hpRatio >= SECRET_BOSS_HP_RATIO) {
            s.secretBossUnlocked = true;
            s.log.push('เลือดยังเหลือเฟือ… มีบางอย่างรออยู่ข้างหน้า');
            // เส้นทางถูกวางไว้ล่วงหน้าถึงบอสสุดท้ายเท่านั้น — ต่อชั้นศึกลับตอนนี้
            // เพื่อไม่ให้ผู้เล่นเห็นมันรออยู่บนแผนที่ตั้งแต่ยังไม่ปลดล็อค
            if (onJourney) rng = unlockSecretBossRows(s, rng);
            return proceed(s, { type: 'Proceed' } as any, rng);
          }
        }

        // จบรัน (บอสสุดท้ายโดยไม่ปลดล็อคศึกลับ หรือชนะศึกลับแล้ว)
        s.phase = 'run_complete';
        s.runSummary = {
          won: true,
          fights: s.fightCount ?? 0,
          level: s.player.level,
          gold: s.player.gold ?? 0,
          beatSecretBoss: offer.bossType === 'secret',
        };
        s.log.push('จบการเดินทาง');
        return { state: s, rng };
      }

      // คอมแบตธรรมดา → กลับหน้า map
      s.phase = 'map';
      (s as any).nodePhase = 'map_ready';
      clearCombatState(s);

      // Clear temporary equipment slots
      s.equipmentTempSlots = 0;

      // Remove temporary equipment after combat
      removeTemporaryEquipment(s);
    }
    else if (s.phase === 'shop') {
      // Leave Shop - save to registry for persistence using static shop ID
      console.log('🛒 Leave shop debug:', {
        currentShopId: s.currentShopId,
        shopUsed: mp._shopUsed,
        shopKind: s.shopKind,
        stockCount: s.shopStock?.length || 0,
        boughtCount: s.shopBoughtItems?.length || 0
      });
      
      if (s.currentShopId && s.shopKind) {
        const existingShop = s.shopRegistry?.find(shop => shop.id === s.currentShopId);
        const { addShopToRegistry, updateShopInRegistry } = require('../../shopRegistry');
        const boughtItems = s.shopBoughtItems || [];
        
        if (existingShop) {
          // Update existing shop (always save existing shops, even if not used this visit)
          if (s.shopKind === 'card' || s.shopKind === 'equipment') {
            console.log('🛒 Before update - Registry inventory:', existingShop.inventory.map(item => ('card' in item ? (item.card as any)?.name : undefined)));
            console.log('🛒 Before update - Current stock:', s.shopStock?.map(item => ('card' in item ? (item.card as any)?.name : undefined)));
            updateShopInRegistry(s, s.currentShopId, s.shopStock, boughtItems);
            console.log('🛒 After update - Registry inventory:', existingShop.inventory.map(item => ('card' in item ? (item.card as any)?.name : undefined)));
          } else if (s.shopKind === 'treasure') {
            // Treasure chest: save current stock to registry (for persistence)
            updateShopInRegistry(s, s.currentShopId, s.shopStock, boughtItems);
            console.log('🛒 Updated treasure chest in registry');
          } else if (s.shopKind === 'treasure_single') {
            // Single treasure: save current stock to registry (for persistence)
            updateShopInRegistry(s, s.currentShopId, s.shopStock, boughtItems);
            console.log('🛒 Updated single treasure in registry');
          } else {
            // Remove/Upgrade/Healing/Well shops: just update usage counters
            updateShopInRegistry(s, s.currentShopId, [], boughtItems);
            console.log(`🛒 Updated ${s.shopKind} shop counters in registry`);
          }
          console.log('🛒 Updated existing shop in registry');
        } else {
          // Add new shop to registry (always save new shops for persistence)
          const stockToSave = (s.shopKind === 'card' || s.shopKind === 'equipment' || s.shopKind === 'treasure' || s.shopKind === 'treasure_single') ? s.shopStock : [];
          addShopToRegistry(s, s.shopKind as any, stockToSave, boughtItems, s.currentShopId);
          console.log(`🛒 Added new ${s.shopKind} shop to registry`);
        }
      } else {
        console.log('🛒 Shop not saved to registry (missing data)');
      }
      
      // Check if shop stock exhausted - if so, mark as resolved and refresh slot
      const stockExhausted = (() => {
        if (s.shopKind === 'card' || s.shopKind === 'equipment') {
          // Card/Equipment shops: exhausted when no stock left
          return !s.shopStock || s.shopStock.length === 0;
        } else if (s.shopKind === 'remove') {
          // Remove shop: exhausted when no cards to remove
          return !s.masterDeck || s.masterDeck.length === 0;
        } else if (s.shopKind === 'upgrade') {
          // Upgrade shop: exhausted when no cards to upgrade
          return !s.masterDeck || s.masterDeck.length === 0;
        } else if (s.shopKind === 'healing') {
          // Healing shrine: exhausted when max uses reached or player at full HP permanently
          const healCount = (s as any).healingShrine?.timesUsed ?? 0;
          const maxUses = 3;
          return healCount >= maxUses;
        } else if (s.shopKind === 'well') {
          // Mystical well: exhausted when max uses reached
          const wellCount = (s as any).mysticalWell?.timesUsed ?? 0;
          const maxUses = 2;
          return wellCount >= maxUses;
        } else if (s.shopKind === 'treasure') {
          // Treasure chest: exhausted when no cards left
          return !s.shopStock || s.shopStock.length === 0;
        } else if (s.shopKind === 'treasure_single') {
          // Single treasure: exhausted when no cards left
          return !s.shopStock || s.shopStock.length === 0;
        }
        return false; // Unknown shop kind - don't refresh
      })();
      
      // บนเส้นทาง หนึ่งโหนดคือหนึ่งครั้งที่แวะ — ออกจากร้านแล้วเดินต่อเสมอ
      // (ถาดเดิมปล่อยให้ร้านค้างไว้จนของหมด เพราะช่องถูกสุ่มใหม่ได้เรื่อยๆ)
      if (onJourney || stockExhausted) {
        mp.current.resolved[ix] = true;
        consumeToken(mp, offer);
      }
      
      s.shopStock = undefined;
      s.shopKind = undefined;
      s.shopBoughtItems = undefined; // Clear bought items tracker
      s.currentShopId = undefined; // Clear current shop ID
      s.phase = 'map';
    }
    else if (s.phase === 'event') {
      // well: ต้องใช้หรือกดปิดให้ถูก flag ถึง resolve; event ชนิดอื่น resolve ได้ตรง ๆ
      const ok =
        onJourney ||
        (s.event?.type === 'well' && ((s.event.used ?? false) || (s.event.dismissed ?? false))) ||
        (s.event?.type && s.event.type !== 'well');

      if (ok) {
        mp.current.resolved[ix] = true;
        consumeToken(mp, offer);
      }
      s.event = undefined;
      s.phase = 'map';
    }

    // === Page flow enhancement ===
    // เมื่อจบ encounter ที่ไม่ใช่ boss/next_event → รีเฟรชช่องทันที (เฉพาะที่ resolved จริงๆ)
    // บนเส้นทางไม่มีการรีเฟรช — จบโหนดแล้วเปิดชั้นถัดไปแทน
    if (onJourney) {
      if (ix != null && mp.current?.resolved[ix]) {
        mp._activeOfferIndex = undefined;
        mp._shopUsed = false;
        advanceJourney(s);
      }
      return { state: s, rng };
    }

    if (ix != null && mp.current && (mp.current.offers as PageOffer[])[ix] && mp.current.resolved[ix]) {
      const offer: PageOffer = (mp.current.offers as PageOffer[])[ix] as PageOffer;
      if (offer.kind !== 'boss' && offer.kind !== 'next_event') {
        // Don't refresh persistent shop slots that exist in registry
        const isRegistryShop = 'shopId' in offer && s.shopRegistry?.some(shop => shop.id === offer.shopId);
        if (isRegistryShop) {
          console.log(`🛒 Skipping refresh for persistent shop: ${offer.shopId}`);
        } else {
          (s.pages as any)._resolvesOnPage = ((s.pages as any)._resolvesOnPage ?? 0) + 1;
          if (((s.pages as any)._resolvesOnPage ?? 0) < PAGE_FORCE_SPLIT_AT) {
            const rep = replaceSingleOffer(mp, rng, s, ix);
            rng = rep.rng;
            s.log.push(`↻ Slot #${ix} refreshed (resolvesOnPage=${(s.pages as any)._resolvesOnPage})`);
          } else {
            (mp.current.offers as any[])[ix] = { kind: 'next_event' } as any;
            (mp.current.resolved as any[])[ix] = false;
            (s.pages as any)._resolvesOnPage = 0;
            s.log.push('⚑ Forced next_event (PAGE_FORCE_SPLIT_AT reached)');
          }
        }
      }
    }

    // reset flags
    mp._activeOfferIndex = undefined;
    mp._shopUsed = false;
  }
// เคลียร์ครบ 3 ช่อง → ไปหน้าถัดไป auto
  if (onJourney) return { state: s, rng };
  if (s.pages?.current?.resolved.every(Boolean)) {
    return proceed(s, { type: 'Proceed' } as any, rng);
  }
  return { state: s, rng };
}

export function deleteShopFromMap(s: GameState, cmd: Extract<Command, { type: 'DeleteShopFromMap' }>, rng: RNG) {
  if (s.mapMode !== 'pages' || !s.pages) {
    return { state: s, rng };
  }

  const mp = s.pages;
  const ix = cmd.index;
  
  if (ix === undefined || !mp.current?.offers[ix]) {
    return { state: s, rng };
  }

  const offer = mp.current.offers[ix] as PageOffer;

  // Only allow deleting shops, healing shrines, wells, and treasures from map
  if (!offer.kind.startsWith('shop_') && offer.kind !== 'healing_shrine' && offer.kind !== 'well' && offer.kind !== 'treasure') {
    return { state: s, rng };
  }

  // Track deleted shop for sequential logic
  if ('shopId' in offer && offer.shopId) {
    // Ensure deletedShops exists (fallback for existing saves)
    if (!mp.deletedShops) {
      mp.deletedShops = [];
    }
    if (!mp.deletedShops.includes(offer.shopId)) {
      mp.deletedShops.push(offer.shopId);
    }
    console.log('🗑️ Added shop to deleted list from map:', offer.shopId);
    
    // Remove from registry if exists
    if (s.shopRegistry) {
      const shopIndex = s.shopRegistry.findIndex(shop => shop.id === offer.shopId);
      if (shopIndex >= 0) {
        s.shopRegistry.splice(shopIndex, 1);
        console.log('🗑️ Removed shop from registry (map):', offer.shopId);
      }
    }
  }

  // Delete shop from map - resolve + refresh slot
  mp.current.resolved[ix] = true;
  consumeToken(mp, offer);
  s.log.push('🗑️ Shop deleted from map');

  // บนเส้นทางไม่มีการรีเฟรชช่อง — ลบร้านคือเลือกที่จะข้ามโหนดนั้นแล้วเดินต่อ
  if (usesJourney(s)) {
    enterNode(s, ix);
    mp._activeOfferIndex = undefined;
    mp._shopUsed = false;
    advanceJourney(s);
    return { state: s, rng };
  }

  // Refresh slot with new encounter (same as monster completion)
  const refreshResult = replaceSingleOffer(mp, rng, s, ix);
  rng = refreshResult.rng;
  
  s.log.push(`🆕 Slot #${ix} refreshed after map shop deletion`);
  console.log('🔄 Refreshed slot after map shop deletion:', mp.current?.offers[ix]);

  return { state: s, rng };
}

export function deleteShop(s: GameState, _cmd: Extract<Command, { type: 'DeleteShop' }>, rng: RNG) {
  if (s.phase !== 'shop' || s.mapMode !== 'pages' || !s.pages) {
    return { state: s, rng };
  }

  const mp = s.pages;
  const ix = mp._activeOfferIndex;
  
  if (ix === undefined || !mp.current?.offers[ix]) {
    return { state: s, rng };
  }

  const offer = mp.current.offers[ix] as PageOffer;

  // Track deleted shop for sequential logic
  if ('shopId' in offer && offer.shopId) {
    // Ensure deletedShops exists (fallback for existing saves)
    if (!mp.deletedShops) {
      mp.deletedShops = [];
    }
    if (!mp.deletedShops.includes(offer.shopId)) {
      mp.deletedShops.push(offer.shopId);
    }
    console.log('🗑️ Added shop to deleted list:', offer.shopId);
    
    // Remove from registry if exists
    if (s.shopRegistry) {
      const shopIndex = s.shopRegistry.findIndex(shop => shop.id === offer.shopId);
      if (shopIndex >= 0) {
        s.shopRegistry.splice(shopIndex, 1);
        console.log('🗑️ Removed shop from registry:', offer.shopId);
      }
    }
  }

  // Delete shop - resolve ทันที
  mp.current.resolved[ix] = true;
  consumeToken(mp, offer);
  
  s.shopStock = undefined;
  s.shopKind = undefined;
  s.currentShopId = undefined;
  s.shopBoughtItems = undefined;
  s.phase = 'map';
  s.log.push('🗑️ Shop deleted permanently');

  // reset flags
  mp._activeOfferIndex = undefined;
  mp._shopUsed = false;

  // บนเส้นทาง: ลบร้านแล้วเดินต่อ ไม่มีช่องให้รีเฟรช
  if (usesJourney(s)) {
    advanceJourney(s);
    return { state: s, rng };
  }

  // ตาม game rule: ลบร้านแล้ว → Refresh slot ทันที (เหมือนตอนสู้มอนสเตอร์จบ)
  const refreshResult = replaceSingleOffer(mp, rng, s, ix);
  rng = refreshResult.rng;
  
  s.log.push(`🆕 Slot #${ix} refreshed after shop deletion`);
  console.log('🔄 Refreshed slot after shop deletion:', mp.current?.offers[ix]);

  return { state: s, rng };
}

/**
 * ตรวจสอบว่าสามารถไปหน้าถัดไปได้หรือไม่
 * เงื่อนไข:
 * 1. Combat ต้องเสร็จ (resolved = true)  
 * 2. Shop/Event ไม่บังคับ แต่ถ้ายังไม่ resolved ก็ยังไปไม่ได้
 */
function canProceedToNextMap(s: GameState): boolean {
  if (s.mapMode !== 'pages' || !s.pages?.current) return false;
  
  const mp = s.pages;
  const offers = mp.current!.offers;
  const resolved = mp.current!.resolved;
  
  let hasCombat = false;
  let combatCompleted = false;
  
  for (let i = 0; i < offers.length; i++) {
    const offer = offers[i];
    const isResolved = resolved[i];
    
    if (offer.kind === 'monster') {
      hasCombat = true;
      if (isResolved) {
        combatCompleted = true;
      }
    }
  }
  
  // Must have combat and complete it
  if (hasCombat && !combatCompleted) {
    return false;
  }
  
  // Combat completed - check if we can proceed
  // All resolved = proceed (traditional way)
  // OR Combat done + no mandatory unresolved slots = proceed 
  return resolved.every(Boolean);
}
