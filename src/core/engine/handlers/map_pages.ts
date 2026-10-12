// src/core/engine/handlers/map_pages.ts — the three-slot adventure board.
import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import * as ShopEv from './shops_events';
import type { PageOffer } from '../../map/pages';
import { beginPlayerFight } from '../../commands';
import { buildAndShuffleEnemyDeck } from './enemy';
import { deckForMonster } from '../../monsters/monster-decks';
import { fireChapter } from '../../story/chapters';
import { planEnemyIntent } from '../../combat/intent';
import { winRun } from './runEnd';
import { ultimateRequired } from '../../campaign/threeNight';
import { startAdventure, settleAdventureSlot, revealUltimate, rememberAdventureService, restoreAdventureService, useIntersectionPage } from '../../map/adventure';


/** ล้างสเตตที่เหลือจากคอมแบตก่อนกลับสู่แผนที่ */
function clearCombatState(s: GameState) {
  s.enemy = undefined;
  (s as any).enemyPiles = undefined;
  (s as any).playerPiles = undefined;
  (s as any).enemyIntentCardId = null;
  s.player.block = 0;
  s.player.statusEffects = [];
  s.player.ap = s.player.maxAp;
  s.equipped = [];
  s.prayers = [];
  s.traps = [];
}

function completeAdventure(s:GameState,r:RNG){
 const mp=s.pages!,a=mp.adventure!,ix=mp._activeOfferIndex;
 if(ix==null||!mp.current||mp.current.resolved[ix]||s.chapter)return {state:s,rng:r};
 const offer=mp.current.offers[ix];if(!offer)return {state:s,rng:r};
 if(s.phase==='victory'&&(offer.kind==='monster'||offer.kind==='boss')){
  s.defeatedEnemyIds=[...(s.defeatedEnemyIds??[]),offer.enemyId];
  clearCombatState(s);
  if(offer.kind==='boss'){
   if(offer.bossType==='final'){
    s.campaign!.completedNights=s.campaign!.night;
    if(s.campaign!.night<3){
     s.campaign!.night=(s.campaign!.night+1) as 2|3;
     const healed=Math.min(s.player.maxHp-s.player.hp,Math.ceil(s.player.maxHp*.12));s.player.hp+=healed;
     s.log.push(`ฟ้าสาง คืนหัวสำเร็จ · พักฟื้น ${healed} · ออกตามรอยคืนที่ ${s.campaign!.night}`);
     s.phase='map';s.levelUp=null;s.cardReward=undefined;s.combatVictoryLock=false;
     s.story=undefined;s.event=undefined;
     r=startAdventure(s,r);fireChapter(s,{kind:'prologue',classId:s.classId});
     return {state:s,rng:r};
    }
   }
   if(offer.bossType==='final'&&ultimateRequired(s)){revealUltimate(s);fireChapter(s,{kind:'secret'});}
   else {a.boss='done';mp.current.resolved[ix]=true;mp._activeOfferIndex=undefined;winRun(s,offer.bossType==='secret');}
   return {state:s,rng:r};
  }
  s.phase='map';settleAdventureSlot(s,ix);return {state:s,rng:r};
 }
 if(s.phase==='shop'){
  rememberAdventureService(s);
  if(s.currentShopId&&s.shopKind){
   const {addShopToRegistry,updateShopInRegistry}=require('../../shopRegistry');
   if(s.shopRegistry?.some(sh=>sh.id===s.currentShopId))updateShopInRegistry(s,s.currentShopId,s.shopStock??[],s.shopBoughtItems??[]);
   else addShopToRegistry(s,s.shopKind,s.shopStock??[],s.shopBoughtItems??[],s.currentShopId);
  }
  s.shopKind=undefined;s.shopStock=undefined;s.currentShopId=undefined;s.shopBoughtItems=undefined;s.phase='map';
  mp._activeOfferIndex=undefined;
  return {state:s,rng:r};
 }
 if(s.phase==='event'&&s.story?.result!=null){s.story=undefined;s.event=undefined;s.phase='map';settleAdventureSlot(s,ix);}
 return {state:s,rng:r};
}

/** One entry point for every fight on the board, normal or boss. */
function startCombat(s:GameState,offer:Extract<PageOffer,{kind:'monster'|'boss'}>,ix:number,rng:RNG){
  const mp=s.pages!;
  const { getMonsterById } = require('../../monsters/thai-ghosts');
  const monster = getMonsterById(offer.enemyId);
  if (!monster) { s.log.push(`❌ Monster ${offer.enemyId} not found`); return { state: s, rng }; }
  mp._activeOfferIndex = ix;
  mp._shopUsed = false;
  s.phase = 'combat';
  (s as any).nodePhase = 'in_combat';
  s.turn = 1;
  s.combatVictoryLock = false;
  (s as any).enemyPiles = undefined;
  (s as any).playerPiles = undefined;
  (s as any).enemyIntentCardId = null;
  s.player.block = 0;
  const deck = deckForMonster(monster);
  s.enemy = {
    id: monster.id, name: monster.name, hp: monster.hp, maxHp: monster.hp,
    dmg: Math.floor(monster.hp / (offer.kind === 'boss' ? 4 : 5)), block: 0,
    ai: { cycle: ['claw', 'guard'], index: 0, deck },
    maxEnergy: deck.maxEnergy, handSize: deck.handSize, intentCardId: null,
  };
  require('../../campaign/nights').configureNightEnemy(s);
  ({ state: s, rng } = buildAndShuffleEnemyDeck(s, rng));
  const { initializeEnemyBehaviors } = require('../../enemyBehaviorRuntime');
  initializeEnemyBehaviors(s);
  (s as any).enemyIntentCardId = (s as any).enemyPiles?.draw?.[0] ?? null;
  rng = beginPlayerFight(s, rng);
  planEnemyIntent(s);
  s.log.push(`ChooseOffer → combat (${offer.kind === 'boss' ? 'boss' : offer.tier}) vs ${s.enemy?.id}`);
  return { state: s, rng };
}

// -------------------------------------------------
// Commands
// -------------------------------------------------
export function choose(s: GameState, cmd: Extract<Command, { type: 'ChooseOffer' }>, r: RNG) {
  const mp = s.pages;
  let rng = r;
  if (!mp?.adventure || !mp.current || s.phase !== 'map' || s.chapter) return { state: s, rng };
  const ix = cmd.index;
  const offer: PageOffer | undefined = mp.current.offers[ix];
  if (!offer || mp.current.resolved[ix]) return { state: s, rng };
  s.rewardReceipt=undefined;
  mp.adventure.enteredBoard=mp.adventure.boardIndex;
  if(restoreAdventureService(s,offer,ix))return {state:s,rng};

  switch (offer.kind) {
    case 'monster':
    case 'boss':
      return startCombat(s, offer, ix, rng);

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
      s.shopStock=s.shopStock?.map(item=>({...item,price:Math.max(30,Math.round(item.price*.65))}));
      s.currentShopId = offer.shopId; // Track current shop ID
        mp._activeOfferIndex = ix; mp._shopUsed = false;
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
              s.log.push(`ChooseOffer → existing well (${offer.shopId})`);
        return { state: s, rng };
      }
      
      // Create new well
      s.shopKind = 'well';
      s.shopBoughtItems = []; // Reset bought items tracker
      s.currentShopId = offer.shopId; // Track current well ID
      s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
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
              s.log.push(`ChooseOffer → existing healing_shrine (${offer.shopId})`);
        return { state: s, rng };
      }
      
      // Create new shrine
      s.shopKind = 'healing';
      s.shopBoughtItems = []; // Reset bought items tracker
      s.currentShopId = offer.shopId; // Track current shrine ID
      s.phase = 'shop';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
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
          s.log.push(`ChooseOffer → new single treasure (${offer.shopId})`);
      return { state: s, rng };
    }

    case 'story_event': {
      // เหตุการณ์ไม่ใช่ร้าน — ไม่มีของขาย ไม่มี shopKind มีแต่เรื่องกับทางเลือก
      s.story = { eventId: offer.eventId };
      s.shopKind = undefined;
      s.shopStock = undefined;
      s.currentShopId = offer.shopId;
      s.phase = 'event';
        mp._activeOfferIndex = ix; mp._shopUsed = false;
      s.log.push(`ChooseOffer → เหตุการณ์ (${offer.eventId})`);
      return { state: s, rng };
    }


    case 'next_event':
      useIntersectionPage(s, ix);
      return { state: s, rng };

    default:
      return { state: s, rng };
  }
}

/** Services can be passed by; ghosts, bosses and the night story cannot. */
export function dismiss(s: GameState, cmd: Extract<Command, { type: 'DismissOffer' }>, r: RNG) {
  if(s.pages?.adventure&&s.phase==='map'&&!s.chapter)settleAdventureSlot(s,cmd.index,true);
  return {state:s,rng:r};
}

export function completeNode(s: GameState, _cmd: Extract<Command, { type: 'CompleteNode' }>, r: RNG) {
  if(!s.pages?.adventure)return {state:s,rng:r};
  return completeAdventure(s,r);
}

export function deleteShopFromMap(s: GameState, cmd: Extract<Command, { type: 'DeleteShopFromMap' }>, rng: RNG) {
  if(s.pages?.adventure&&s.phase==='map'&&!s.chapter&&cmd.index!=null)settleAdventureSlot(s,cmd.index,true);
  return {state:s,rng};
}

export function deleteShop(s: GameState, _cmd: Extract<Command, { type: 'DeleteShop' }>, rng: RNG) {
  const ix=s.pages?._activeOfferIndex;
  if(s.pages?.adventure&&s.phase==='shop'&&ix!=null){s.shopStock=undefined;s.shopKind=undefined;s.currentShopId=undefined;s.shopBoughtItems=undefined;s.phase='map';settleAdventureSlot(s,ix,true);}
  return {state:s,rng};
}
