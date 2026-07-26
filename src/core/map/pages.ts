// src/core/map/pages.ts
import type { RNG } from '../rng';
import { int, next } from '../rng';
import { PAGES_TOTAL, POOL_DEFAULT, WEIGHTS } from '../balance/weights';
import type { GameState } from '../types';
import { getTierForFight, getRandomMonsterFromTier, eliteChanceForFight, THAI_GHOST_POOLS } from '../monsters/thai-ghosts';

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
  | { kind: 'fusion_altar'; shopId: string }
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
  /**
   * ผีที่เพิ่งถูกเสนอไปไม่กี่ตัวหลังสุด — ใช้เลี่ยงเจอตัวเดิมซ้ำติดกัน
   * ของเดิมกันซ้ำเฉพาะภายในหน้าเดียว แต่ช่องถูก refresh ทีละช่องตลอดเวลา
   * จึงไม่มีความจำข้ามการ refresh และเจอผีตัวเดิมซ้ำได้บ่อย
   */
  recentMonsterIds?: string[];
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

/**
 * โหนดชนิดพัก — เดินผ่านได้โดยไม่ต้องสู้ และข้ามไปเลยก็ได้
 *
 * เดิมเงื่อนไขนี้ถูกเขียนซ้ำคนละแบบใน `isShopLike` (UI) กับ `deleteShopFromMap`
 * (engine) จน `treasure_single` เป็น "ข้ามได้" ฝั่ง UI แต่ engine ปฏิเสธ
 * ปุ่มข้ามจึงกดแล้วเงียบ
 */
export function isRestOfferKind(kind: PageOffer['kind']): boolean {
  return (
    kind.startsWith('shop_') ||
    kind === 'well' ||
    kind === 'healing_shrine' ||
    kind === 'treasure' ||
    kind === 'treasure_single' ||
    kind === 'fusion_altar'
  );
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
    // แท่นผสานมีเฉพาะบนแผนที่แบบเส้นทาง ซึ่งไม่ใช้ระบบ pool
    case 'fusion_altar':    break;
    case 'boss':            break;
  }
}

// Generate shop offers with static IDs and sequential logic
// ── โครงสร้างรันตาม gameSpec.txt ────────────────────────────────────────────
// 15 ไฟต์ต่อรัน: ไฟต์ 1-6 ปกติ, 7 = Mid Boss, 8-14 ปกติ, 15 = Final Boss
// ไฟต์ 16 = Secret Boss (ต่อท้าย เฉพาะเมื่อปลดล็อคได้)
/** จำผีที่เพิ่งเสนอไปกี่ตัว เพื่อไม่ให้เจอตัวเดิมซ้ำติดๆ กัน */
const RECENT_MONSTER_MEMORY = 6;

export const MID_BOSS_FIGHT    = 7;
export const FINAL_BOSS_FIGHT  = 15;
export const SECRET_BOSS_FIGHT = 16;

/** ไฟต์ถัดไปที่ผู้เล่นกำลังจะเจอ (1-based) */
export function nextFightIndex(s: GameState): number {
  return (s.fightCount ?? 0) + 1;
}

/** ไฟต์นี้เป็นบอสไหม — คืน null ถ้าเป็นไฟต์ปกติ */
export function bossTypeForFight(
  fightIndex: number,
  s: GameState
): 'mid' | 'final' | 'secret' | null {
  if (fightIndex === MID_BOSS_FIGHT) return 'mid';
  if (fightIndex === FINAL_BOSS_FIGHT) return 'final';
  if (fightIndex === SECRET_BOSS_FIGHT && s.secretBossUnlocked) return 'secret';
  return null;
}

export function rollPageOffers(mp: MapStatePages, r: RNG, s: GameState): { offers: PageOffer[]; rng: RNG } {
  const offers: PageOffer[] = [];
  const cand: Array<{ offer: PageOffer; w: number }> = [];

  const monsLeft = monstersLeft(mp);
  const pLeft    = pagesLeft(mp);

  // Elite โผล่ตามโอกาสของช่วงไฟต์ (ตาราง Fight Progression ในสเปค)
  // เดิมเปิดต่อเมื่อ pool ของมอนธรรมดาหมด → Elite ทั้งหมดกระจุกท้ายรันเสมอ
  // ยังคงเงื่อนไข "normal หมดแล้วใช้ elite แทน" ไว้เพื่อให้ครบ 13 ไฟต์
  const eliteRoll = next(r);
  r = eliteRoll.rng;
  const allowElite =
    mp.pools.elite > 0 &&
    (mp.pools.normal <= 0 || eliteRoll.value < eliteChanceForFight(nextFightIndex(s)));

  const allowNext  = (mp.pools.nextEvent > 0) && (pLeft > monsLeft + 1);

  // ── บอสถูกล็อกที่ลำดับไฟต์ ไม่ใช่ตอน pool หมด ──────────────────────────
  //
  // เดิมบอสโผล่เมื่อมอนหมด pool (ไฟต์ที่ 13) และเลือกประเภทจาก `pageIndex + 1`
  // ซึ่งค้างที่ 0 ตลอดรัน (เพราะช่องถูก refresh แทนที่จะเปลี่ยนหน้า)
  // → ไม่เคยเท่ากับ 7 หรือ 15 เลย บอสจึงเป็น 'final' เสมอ และ BossMid/SecretBoss
  //   เข้าไม่ถึงตลอดกาล ทั้งที่ gameSpec ระบุว่า fight 7 = Mid, fight 15 = Final
  //
  // ตอนนี้ใช้ `fightCount` (จำนวนไฟต์ที่ชนะแล้ว) เป็นตัวตัดสิน
  const bossType = bossTypeForFight(nextFightIndex(s), s);
  if (bossType) {
    const tier: keyof typeof THAI_GHOST_POOLS =
      bossType === 'mid' ? 'BossMid' : bossType === 'final' ? 'BossFinal' : 'SecretBoss';

    const picked = getRandomMonsterFromTier(tier, r);
    r = picked.rng;
    // หน้าบอสมีช่องเดียว — เลี่ยงไม่ได้ ตามที่สเปคเขียนว่าบอส "ถูกล็อก" ที่ไฟต์นั้น
    return { offers: [{ kind: 'boss', bossType, enemyId: picked.monster.id }], rng: r };
  }

  // Track used monsters to avoid duplicates in same page
  const usedMonsterIds = new Set<string>();
  
  // Helper function to create monster offer with specific enemy (avoiding duplicates)
  const createMonsterOffer = (tier: 'normal' | 'elite', rngRef: { rng: RNG }): PageOffer => {
    // ใช้ลำดับไฟต์จริง ไม่ใช่ pageIndex — pageIndex ค้างที่ 0 ตลอดรันเพราะช่องถูก
    // refresh แทนที่จะเปลี่ยนหน้า ทำให้เดิมเรียก getTierForFight(1) เสมอ
    // ผู้เล่นจึงเจอผี T1-T2 ไปจนจบเกม tier progression ในสเปคไม่เคยถูกใช้
    const fightIndex = Math.max(1, Math.min(FINAL_BOSS_FIGHT, nextFightIndex(s)));
    
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
    
    // เลี่ยงตัวที่อยู่ในหน้านี้แล้ว และตัวที่เพิ่งเจอไปไม่กี่ไฟต์ก่อน
    const recent = mp.recentMonsterIds ?? [];
    const pool = THAI_GHOST_POOLS[ghostTier];

    const justBefore = recent[recent.length - 1];

    // ตัวที่วางอยู่บนกระดานตอนนี้ก็นับเป็นซ้ำ — ไม่งั้นผู้เล่นสู้ช่องหนึ่งเสร็จ
    // แล้วไปเจอผีตัวเดิมที่นั่งรออยู่อีกช่องทันที
    const onBoard = new Set(
      (mp.current?.offers ?? [])
        .filter((o): o is Extract<PageOffer, { kind: 'monster' }> => o.kind === 'monster')
        .map(o => o.enemyId)
    );

    const taken = (id: string) => usedMonsterIds.has(id) || onBoard.has(id);

    const fresh     = pool.filter(m => !taken(m.id) && !recent.includes(m.id));
    const notOnPage = pool.filter(m => !taken(m.id) && m.id !== justBefore);
    const notLast   = pool.filter(m => m.id !== justBefore);

    // ผ่อนเงื่อนไขทีละขั้น (pool ของ T1/T2 มีแค่ 3 ตัว เลี่ยงครบทุกข้อไม่ได้เสมอ)
    // แต่ขั้นสุดท้ายยังกันไม่ให้ซ้ำกับตัวที่เพิ่งเจอทันที
    const monstersToChoose = fresh.length > 0 ? fresh
      : notOnPage.length > 0 ? notOnPage
      : notLast.length > 0 ? notLast
      : pool;

    // Use deterministic RNG to pick monster
    const roll = int(rngRef.rng, 0, monstersToChoose.length - 1);
    rngRef.rng = roll.rng;
    const monster = monstersToChoose[roll.value];

    usedMonsterIds.add(monster.id);
    mp.recentMonsterIds = [...recent, monster.id].slice(-RECENT_MONSTER_MEMORY);

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
