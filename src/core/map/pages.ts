// src/core/map/pages.ts
import type { RNG } from '../rng';
import { int } from '../rng';
import { PAGES_TOTAL, POOL_DEFAULT, WEIGHTS } from '../balance/weights';
import type { GameState } from '../types';
import { getTierForFight, getRandomMonsterFromTier, THAI_GHOST_POOLS } from '../monsters/thai-ghosts';

export type PageOffer =
  | { kind: 'monster', tier: 'normal' | 'elite', enemyId: string }
  | { kind: 'shop_card'; shopId: string }
  | { kind: 'shop_equipment'; shopId: string }
  | { kind: 'shop_remove'; shopId: string; phase: 1 | 2 }
  | { kind: 'shop_upgrade'; shopId: string; phase: 1 | 2 }
  | { kind: 'well'; shopId: string }
  | { kind: 'healing_shrine'; shopId: string }
  | { kind: 'treasure'; shopId: string }
  | { kind: 'treasure_single'; shopId: string }
  | { kind: 'next_event' } // ไปหน้าถัดไปแบบเหตุการณ์พิเศษ
  | { kind: 'boss', bossType: 'mid' | 'final' | 'secret', enemyId: string };

export type MapStatePages = {
  totalPages: number;
  pageIndex: number; // 0-based
  pools: {
    normal: number; elite: number;
    shopCard: number; shopEquipment: number; 
    shopRemove1: number; shopRemove2: number;
    shopUpgrade1: number; shopUpgrade2: number;
    wells: number; healingShrine: number; 
    treasure: number; treasureSingle: number; nextEvent: number;
  };
  // Track deleted shops for sequential logic
  deletedShops: string[];
  current?: { offers: PageOffer[]; resolved: boolean[] };
  _closeAfterCombat?: boolean;
  _advanceAfterLevelup?: boolean;
  _activeOfferIndex?: number;  // index ของช่องที่เปิดร้านอยู่
  _resolvesOnPage?: number; // นับจำนวน encounter ที่ resolve ในหน้านี้ (engine ใช้)
  _shopUsed?: boolean;         // ซื้อของอย่างน้อย 1 ครั้งในร้านนี้แล้ว
};

export function initPageMap(r: RNG) {
  const map: MapStatePages = {
    totalPages: PAGES_TOTAL,
    pageIndex: 0,
    pools: { ...POOL_DEFAULT },
    deletedShops: [],
  };
  return { map, rng: r };
}

export function pagesLeft(mp: MapStatePages) { return Math.max(0, mp.totalPages - mp.pageIndex); }
export function monstersLeft(mp: MapStatePages) { return Math.max(0, mp.pools.normal + mp.pools.elite); }

export function consumeToken(mp: MapStatePages, offer: PageOffer) {
  switch (offer.kind) {
    case 'monster':
      if (offer.tier === 'normal' && mp.pools.normal > 0) mp.pools.normal--;
      if (offer.tier === 'elite' && mp.pools.elite > 0) mp.pools.elite--;
      break;
    case 'shop_card':       if (mp.pools.shopCard      > 0) mp.pools.shopCard--;      break;
    case 'shop_equipment':  if (mp.pools.shopEquipment > 0) mp.pools.shopEquipment--; break;
    case 'shop_remove':     
      if (offer.phase === 1 && mp.pools.shopRemove1 > 0) mp.pools.shopRemove1--;
      if (offer.phase === 2 && mp.pools.shopRemove2 > 0) mp.pools.shopRemove2--;
      break;
    case 'shop_upgrade':    
      if (offer.phase === 1 && mp.pools.shopUpgrade1 > 0) mp.pools.shopUpgrade1--;
      if (offer.phase === 2 && mp.pools.shopUpgrade2 > 0) mp.pools.shopUpgrade2--;
      break;
    case 'well':            if (mp.pools.wells          > 0) mp.pools.wells--;          break;
    case 'healing_shrine':  if (mp.pools.healingShrine > 0) mp.pools.healingShrine--;  break;
    case 'treasure':        if (mp.pools.treasure      > 0) mp.pools.treasure--;       break;
    case 'treasure_single': if (mp.pools.treasureSingle > 0) mp.pools.treasureSingle--; break;
    case 'next_event':      if (mp.pools.nextEvent     > 0) mp.pools.nextEvent--;      break;
    case 'boss':            break;
  }
}

// Generate shop offers with static IDs and sequential logic
export function rollPageOffers(mp: MapStatePages, r: RNG, s: GameState): { offers: PageOffer[]; rng: RNG } {
  const offers: PageOffer[] = [];
  const cand: Array<{ offer: PageOffer; w: number }> = [];

  const monsLeft = monstersLeft(mp);
  const pLeft    = pagesLeft(mp);
  const allowElite = (mp.pools.normal <= 0) && (mp.pools.elite > 0);
  const allowNext  = (mp.pools.nextEvent > 0) && (pLeft > monsLeft + 1);

  // inject boss เมื่อไม่มีมอนเหลือ
  if (monsLeft <= 0) {
    // Determine boss type based on progress (simplified logic)
    const fightIndex = Math.max(1, Math.min(15, mp.pageIndex + 1));
    let bossType: 'mid' | 'final' | 'secret' = 'final';
    let ghostTier: keyof typeof THAI_GHOST_POOLS = 'BossFinal';
    
    if (fightIndex === 7) {
      bossType = 'mid';
      ghostTier = 'BossMid';
    } else if (fightIndex === 15) {
      bossType = 'final';
      ghostTier = 'BossFinal';
    } else if (fightIndex > 15) {
      bossType = 'secret';
      ghostTier = 'SecretBoss';
    }
    
    const picked = getRandomMonsterFromTier(ghostTier, r);
    r = picked.rng;
    offers.push({ kind: 'boss', bossType, enemyId: picked.monster.id });
  }

  // Track used monsters to avoid duplicates in same page
  const usedMonsterIds = new Set<string>();
  
  // Helper function to create monster offer with specific enemy (avoiding duplicates)
  const createMonsterOffer = (tier: 'normal' | 'elite', rngRef: { rng: RNG }): PageOffer => {
    // Calculate fight index based on current progress (simplified - would be more complex in real system)
    const fightIndex = Math.max(1, Math.min(15, mp.pageIndex + 1));
    
    let ghostTier: keyof typeof THAI_GHOST_POOLS;
    if (tier === 'elite') {
      ghostTier = 'Elite';
    } else {
      const tierRoll = getTierForFight(fightIndex, rngRef.rng);
      rngRef.rng = tierRoll.rng;
      ghostTier = tierRoll.tier;
      // If getTierForFight returns Elite or Boss, fallback to appropriate normal tier
      if (ghostTier === 'Elite' || ghostTier.includes('Boss') || ghostTier === 'SecretBoss') {
        ghostTier = fightIndex <= 2 ? 'T1' : fightIndex <= 4 ? 'T2' : fightIndex <= 6 ? 'T3' : fightIndex <= 9 ? 'T4' : 'T5';
      }
    }
    
    // Get available monsters (excluding already used ones)
    const availableMonsters = THAI_GHOST_POOLS[ghostTier].filter(m => !usedMonsterIds.has(m.id));
    
    // If no available monsters, reset and use all
    const monstersToChoose = availableMonsters.length > 0 ? availableMonsters : THAI_GHOST_POOLS[ghostTier];
    
    // Use deterministic RNG to pick monster
    const roll = int(rngRef.rng, 0, monstersToChoose.length - 1);
    rngRef.rng = roll.rng;
    const monster = monstersToChoose[roll.value];
    
    // Mark this monster as used
    usedMonsterIds.add(monster.id);
    
    return { kind: 'monster', tier, enemyId: monster.id };
  };

  // Create RNG reference for sharing between calls
  const rngRef = { rng: r };
  
  // บังคับมีมอนอย่างน้อย 1 ถ้ายังมีมอน
  if (monsLeft > 0) {
    if (mp.pools.normal > 0) offers.push(createMonsterOffer('normal', rngRef));
    else if (allowElite)     offers.push(createMonsterOffer('elite', rngRef));
  }

  // Ensure deletedShops exists (fallback for existing saves) - MUST BE FIRST
  if (!mp.deletedShops) {
    mp.deletedShops = [];
  }

  // Helper function to generate static IDs based on page and slot
  const generateShopId = (type: string, slotIndex: number) => {
    const part = (s as any).gamePhase === 'part2' ? 'p2' : 'p1';
    const pageNum = String(mp.pageIndex + 1).padStart(3, '0');
    const slot = `s${slotIndex + 1}`;
    return `${part}_${pageNum}_${slot}_${type}`;
  };

  // สร้าง candidate ตาม pool+weight with specific monsters
  if (mp.pools.normal > 0)        cand.push({ offer: createMonsterOffer('normal', rngRef), w: WEIGHTS.monsterNormal });
  if (allowElite)                 cand.push({ offer: createMonsterOffer('elite', rngRef), w: WEIGHTS.monsterElite });
  
  // Try to respawn persistent shops from registry (carry-over) with higher priority
  try {
    const reg = (s as any)?.shopRegistry as any[] | undefined;
    if (Array.isArray(reg) && reg.length > 0) {
      // Give registry shops higher weight to prefer existing shops
      for (const sh of reg) {
        if (sh.kind === 'card') {
          cand.push({ offer: { kind: 'shop_card', shopId: sh.id }, w: WEIGHTS.shopCard * 2 });
        } else if (sh.kind === 'equipment') {
          cand.push({ offer: { kind: 'shop_equipment', shopId: sh.id }, w: WEIGHTS.shopEquipment * 2 });
        } else if (sh.kind === 'remove') {
          cand.push({ offer: { kind: 'shop_remove', shopId: sh.id, phase: 1 as const }, w: WEIGHTS.shopRemove1 * 2 });
        } else if (sh.kind === 'upgrade') {
          cand.push({ offer: { kind: 'shop_upgrade', shopId: sh.id, phase: 1 as const }, w: WEIGHTS.shopUpgrade1 * 2 });
        } else if (sh.kind === 'treasure') {
          cand.push({ offer: { kind: 'treasure', shopId: sh.id }, w: WEIGHTS.treasure * 2 });
        }
      }
    }
  } catch {}

  // Shop candidates with static IDs (lower priority than registry shops)
  if (mp.pools.shopCard > 0) {
    cand.push({ offer: { kind: 'shop_card', shopId: 'temp_card' }, w: WEIGHTS.shopCard });
  }
  if (mp.pools.shopEquipment > 0) {
    cand.push({ offer: { kind: 'shop_equipment', shopId: 'temp_equipment' }, w: WEIGHTS.shopEquipment });
  }

  // Sequential remove shops
  if (mp.pools.shopRemove1 > 0 && !mp.deletedShops.includes('remove_1')) {
    cand.push({ offer: { kind: 'shop_remove', shopId: 'remove_1', phase: 1 }, w: WEIGHTS.shopRemove1 });
  }
  if (mp.pools.shopRemove2 > 0 && mp.deletedShops.includes('remove_1') && !mp.deletedShops.includes('remove_2')) {
    cand.push({ offer: { kind: 'shop_remove', shopId: 'remove_2', phase: 2 }, w: WEIGHTS.shopRemove2 });
  }
  
  // Sequential upgrade shops
  if (mp.pools.shopUpgrade1 > 0 && !mp.deletedShops.includes('upgrade_1')) {
    cand.push({ offer: { kind: 'shop_upgrade', shopId: 'upgrade_1', phase: 1 }, w: WEIGHTS.shopUpgrade1 });
  }
  if (mp.pools.shopUpgrade2 > 0 && mp.deletedShops.includes('upgrade_1') && !mp.deletedShops.includes('upgrade_2')) {
    cand.push({ offer: { kind: 'shop_upgrade', shopId: 'upgrade_2', phase: 2 }, w: WEIGHTS.shopUpgrade2 });
  }
  
  if (mp.pools.wells > 0)         cand.push({ offer: { kind: 'well', shopId: 'temp_well' },                       w: WEIGHTS.well });
  if (mp.pools.healingShrine > 0) cand.push({ offer: { kind: 'healing_shrine', shopId: 'temp_healing_shrine' }, w: WEIGHTS.healingShrine });
  if (mp.pools.treasure > 0)      cand.push({ offer: { kind: 'treasure', shopId: 'temp_treasure' }, w: WEIGHTS.treasure });
  if (mp.pools.treasureSingle > 0) cand.push({ offer: { kind: 'treasure_single', shopId: 'temp_treasure_single' }, w: WEIGHTS.treasureSingle });
  if (allowNext)                  cand.push({ offer: { kind: 'next_event' },              w: WEIGHTS.nextEvent });

  // เติมจนได้ 3 (no replacement โดยกันชนิดซ้ำ ยกเว้น monster ต่าง tier ถือว่าคนละชนิด)
  while (offers.length < 3 && cand.length > 0) {
    const total = cand.reduce((a, c) => a + c.w, 0);
    const rollOut = int(r, 0, Math.max(0, total - 1));
    r = rollOut.rng;
    const roll = rollOut.value;
    let acc = 0, idx = 0;
    for (let i = 0; i < cand.length; i++) { acc += cand[i].w; if (roll < acc) { idx = i; break; } }
    const pick = cand.splice(idx, 1)[0].offer;

    const dup = offers.some(o => {
      if (o.kind !== pick.kind) return false;
      if (o.kind === 'monster') return (o as any).tier === (pick as any).tier; // ซ้ำ tier = ไม่เอา
      if (o.kind === 'shop_remove' || o.kind === 'shop_upgrade') {
        return (o as any).shopId === (pick as any).shopId; // ซ้ำ shopId = ไม่เอา
      }
      if (o.kind === 'shop_card' || o.kind === 'shop_equipment') {
        return (o as any).shopId === (pick as any).shopId; // ซ้ำ shopId = ไม่เอา
      }
      return o.kind === pick.kind; // ชนิดเดียวกันถือว่าซ้ำ (สำหรับ events)
    });
    if (!dup) offers.push(pick);
  }

  // กันหน้าโล่ง (เชิงปฏิบัติ ถ้า candidate ไม่พอ)
  while (offers.length < 3) {
    if (mp.pools.wells > 0) offers.push({ kind: 'well', shopId: 'temp_well' });
    else offers.push({ kind: 'shop_card', shopId: 'temp_card' });
  }

  // Assign static IDs to temp shops based on their slot position
  offers.forEach((offer, slotIndex) => {
    if ('shopId' in offer) {
      if (offer.shopId === 'temp_card') {
        (offer as any).shopId = generateShopId('card', slotIndex);
      } else if (offer.shopId === 'temp_equipment') {
        (offer as any).shopId = generateShopId('equipment', slotIndex);
      } else if (offer.shopId === 'temp_treasure') {
        (offer as any).shopId = generateShopId('treasure', slotIndex);
      } else if (offer.shopId === 'temp_treasure_single') {
        (offer as any).shopId = generateShopId('treasure_single', slotIndex);
      } else if (offer.shopId === 'temp_well') {
        (offer as any).shopId = generateShopId('well', slotIndex);
      } else if (offer.shopId === 'temp_healing_shrine') {
        (offer as any).shopId = generateShopId('healing_shrine', slotIndex);
      }
      // Registry shops keep their existing IDs
    }
  });

  // Update RNG from reference
  r = rngRef.rng;
  
  return { offers, rng: r };
}
