// src/core/types.ts — CLEAN (Pages-first, no StartCombat, no reward)

// Import status effects from extended system
import type { StatusEffect } from './types_extended';

export type BlessingFn = (tc: TurnCtx, card?: CardData, target?: any) => void;
export type BlessingCardHookConfig = { tag?: string; once_per_turn?: boolean; effects: BlessingFn[] };
export type BlessingDef = {
  id: string; name: string; rarity?: Rarity; desc?: string; oncePerTurn?: boolean;
  on_turn_start?: BlessingFn;
  on_turn_end?: BlessingFn;
  on_card_played?: BlessingFn | BlessingCardHookConfig;
};

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
/**
 * ชนิดการ์ด
 *
 * `trap`  — ตั้งไว้แล้วรอศัตรูทำสิ่งที่ตรงเงื่อนไข (ดู `combat/traps.ts`)
 * `curse` — เล่นไม่ได้ ยัดเข้าสำรับเพื่อถ่วง ทิ้งเองท้ายเทิร์น
 */
export type CardType = 'attack' | 'skill' | 'equipment' | 'trap' | 'curse';

export type CardData = {
  id: string;
  instanceId?: string;  // unique per card instance in play — assigned on deck build
  name: string;
  type: CardType;
  cost: number;
  dmg?: number;
  block?: number;
  draw?: number;
  energyGain?: number;
  /** ฟื้นพลังชีวิตให้ผู้เล่น */
  heal?: number;
  /**
   * เล่นแล้วออกจากไฟต์ไปเลย (เข้ากองเผา ไม่กลับมาในกองจั่วอีก)
   *
   * มีในไฟล์ข้อมูลและ `combat.ts` อ่านใช้มาตลอด แต่ไม่เคยอยู่ในไทป์
   * ทุกที่ที่ใช้จึงต้อง cast เป็น any — และ UI ก็เลยไม่เคยแสดงมันเลย
   */
  exhaust?: boolean;
  /** ปลุกเสกไปแล้วกี่ขั้น (ดู `upgradeCard`) */
  upgraded?: boolean;
  upgradeLevel?: number;
  /** เฉพาะการ์ดชนิด `trap` — ดักอะไรและเด้งกลับยังไง */
  trap?: import('./combat/traps').TrapSpec;

  // ── กลไกที่ตัวเลขอย่างเดียวทำแทนไม่ได้ (ดู `cards/mechanics.ts`) ──
  /** ตีกี่ครั้ง — แต่ละครั้งเจอ block/strength/vulnerable แยกกัน */
  hits?: number;
  /** อ่านสภาพสนามแล้วแรงไม่เท่ากัน */
  conditional?: import('./cards/mechanics').CardConditional;
  /** ถือไว้ไม่เล่นก็มีผลท้ายเทิร์น */
  whileHeld?: import('./cards/mechanics').HeldEffect;
  /** ค่าร่ายที่เปลี่ยนตามสถานการณ์ — ต้องอ่านผ่าน `effectiveCost` เสมอ */
  costRule?: import('./cards/mechanics').CostRule;
  tags?: string[];
  rarity?: Rarity;
  equipmentId?: string;
  slotCost?: number;
  desc?: string;
};

// Enemy
export type EnemyCard = {
  id: string;
  name?: string;
  type: 'attack' | 'skill';
  dmg?: number;
  block?: number;
  energyCost?: number; // ถ้าไม่ใส่ จะ default = 1
  owner?: string | 'global';
  tags?: string[];
};

export type EnemyState = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  dmg: number;
  block: number;
  // ↓ เพิ่มใหม่ (E1)
  ai?: {
    cycle: string[];
    index: number;
    deck?: {
      lists?: Array<{ id: string; weight: number; cards: string[] }>;
      pool?: { allowOwners: string[]; include?: Array<{ id: string; w: number }>; minAttack?: number; minBlock?: number };
      handSize?: number;
      maxEnergy?: number;
    };
  }; // อ้างถึง enemy card id
  intentCardId?: string | null;             // ใบที่จะเล่น "เทิร์นนี้"
  maxEnergy?: number;  // ค่าพลังงานสูงสุดของศัตรู (ต่อเทิร์น)
  handSize?: number;   // จำนวนการ์ดที่จั่วตอนเริ่มเทิร์นศัตรู
  equipped?: EquipmentData[];  // ศัตรูก็มี equipment ได้เหมือนกัน
  // Status Effects System
  statusEffects?: StatusEffect[];
};

export type DeckPiles = {
  draw: CardData[];
  hand: CardData[];
  discard: CardData[];
  exhaust: CardData[];
};

export type EquipmentData = {
  id: string;
  name?: string;
  rarity?: Rarity;
  desc?: string;
  slotCost?: number; // default 1
  tags?: string[];
  temporary?: boolean; // For equipment installed temporarily during combat
  sourceCardId?: string; // ID of the equipment card that was consumed
  sourceCard?: CardData; // Full card data of the consumed card
};

export type Phase =
  | 'start' | 'menu' | 'map' | 'combat' | 'victory' | 'defeat'
  | 'event' | 'shop' | 'levelup' | 'starter'
  /** ชนะไฟต์แล้ว กำลังเลือกการ์ดรางวัล (ดู `cards/reward.ts`) */
  | 'reward'
  | 'run_complete'; // จบรันแล้ว (ชนะบอสสุดท้าย) — แสดงจอสรุป

// หมายเหตุ: เคยมี 'cards' อยู่ในนี้ — การ์ดใหม่ย้ายไปเป็นรางวัลชนะไฟต์แล้ว
// (ดู `cards/reward.ts`) เลเวลอัปเหลือแต่ของที่ไม่ใช่การ์ด
export type Bucket =
  | 'max_hp' | 'max_energy' | 'max_hand'
  | 'blessing' | 'remove' | 'upgrade' | 'gold'
  | 'equipment_slot' | 'gold_skip';

export type PlayerState = {
  hp: number; maxHp: number; block: number; energy: number; gold: number;
  level: number; exp: number; expToNext: number;
  maxEnergy: number; maxHandSize: number;
  // Status Effects System
  statusEffects?: StatusEffect[];
};

export type RunCounters = {
  removed: number;
  removeShopCount?: number;
  upgradeShopCount?: number;
};

// ===== Events =====
export type EventState =
  | { type: 'bonfire'; healed?: boolean }
  | { type: 'shrine'; options: BlessingDef[]; chosenId?: string }
  | { type: 'remove'; capPerRun: number }
  | { type: 'gamble'; resolved?: { outcome: 'win' | 'lose'; gold?: number; hpLoss?: number } }
  | { type: 'treasure'; amount?: number }
  | { type: 'well'; used: boolean; dismissed: boolean }
  | { type: 'healing_shrine'; used: boolean; dismissed: boolean };

// ===== Shop / Pages =====
export type ShopItem = 
  | { card: CardData; price: number }
  | { equipment: any; price: number };
export type ShopKind = 'card' | 'remove' | 'upgrade' | 'equipment' | 'healing' | 'well' | 'treasure' | 'treasure_single' | 'fusion';

export type ShopState = 'unused' | 'visited' | 'completed';

export type PersistentShop = {
  id: string;
  kind: ShopKind;
  inventory: ShopItem[];
  boughtItems: ShopItem[];
  timesEncountered: number;
  itemsBought: number;
};

export type MapMode = 'pages';
export type MapStatePages = import('./map/pages').MapStatePages;

// Equipment
export type TurnSide = 'player' | 'enemy';

export type EquipmentHookEvent =
  | { type: 'battle_start' }
  | { type: 'turn_start'; side: TurnSide }
  | { type: 'turn_end'; side: TurnSide }
  | { type: 'card_played'; side: TurnSide; cardId: string; amount?: number }
  | { type: 'damage_dealt'; side: TurnSide; amount: number; target: 'player' | 'enemy' };

export interface EquipmentInstance {
  id: string; // unique per run
  modifierId: string; // refers to effect/behavior id (data-driven)
  oncePerTurn?: boolean; // simple gate; advanced rates can extend
}

export interface EquipmentRuntimeState {
  items: EquipmentInstance[];
  turnStamp: number; // increases every turn (player + enemy turns)
  onceGate: Record<string, number>; // equipment.id -> lastTurnStampUsed
}
// ── Combat events ────────────────────────────────────────────────────────────
// engine คำนวณจนจบแล้วคายเหตุการณ์ออกมาเป็นลิสต์ — view เอาไปเล่นเป็นอนิเมชั่น
// ตามจังหวะของตัวเอง ไม่มี setTimeout ตัวไหนได้แตะ game state อีก
//
// ค่าที่อยู่ใน event คือค่าที่เกิดขึ้นจริง (เช่น hpLoss หลังหัก block แล้ว)
// UI ต้องแสดงจากตรงนี้ ไม่ใช่จากตัวเลขบนการ์ด

export type CombatEventTarget = 'player' | 'enemy';

export type CombatEvent =
  /** ศัตรูเปิดการ์ดใบหนึ่ง — view ใช้จังหวะนี้พลิกการ์ด */
  | { t: 'EnemyCardRevealed'; cardId: string; name: string; dmg: number; block: number }
  | {
      t: 'Damage';
      target: CombatEventTarget;
      /** ตัวเลขดิบก่อนปรับ (ค่าบนการ์ด) */
      raw: number;
      /** หลังปรับด้วย status effect แล้ว */
      modified: number;
      blocked: number;
      hpLoss: number;
      died: boolean;
      sourceKind: 'card' | 'combo' | 'status' | 'minion' | 'equipment' | 'event';
    }
  | { t: 'BlockGained'; target: CombatEventTarget; amount: number }
  | { t: 'Healed'; target: CombatEventTarget; amount: number }
  | { t: 'StatusApplied'; target: CombatEventTarget; effectId: string; stacks: number }
  | { t: 'Died'; who: CombatEventTarget }
  | { t: 'TurnEnded'; who: CombatEventTarget };

/**
 * สิ่งที่ศัตรูตั้งใจจะทำ "เทิร์นหน้า" — ตัดสินใจไว้ล่วงหน้าตั้งแต่จบเทิร์นก่อน
 * แล้วแสดงให้ผู้เล่นเห็นระหว่างเทิร์นตัวเอง
 *
 * นี่คือแกนของเกมการ์ดแนวนี้: ผู้เล่นต้องรู้ว่ากำลังจะโดนอะไร ถึงจะเลือกได้ว่า
 * เทิร์นนี้ควรตีหรือควรตั้งการ์ด ถ้าไม่เห็น เกมจะกลายเป็นการเดา
 */
export type EnemyIntent = {
  /** ใบที่ศัตรูจะเล่นเทิร์นหน้า ตามลำดับ */
  cardIds: string[];
  /** ดาเมจรวมที่จะเข้าถ้าผู้เล่นไม่ตั้งการ์ด (ผ่านสูตรเดียวกับดาเมจจริง) */
  damage: number;
  /** block ที่ศัตรูจะได้ */
  block: number;
  kind: 'attack' | 'defend' | 'mixed' | 'wait';
};

export type GameState = {
  seed: string;
  phase: Phase;
  turn: number;

  /** คลาสที่ผู้เล่นเลือกไว้ตอนเริ่มรัน — กำหนดเด็ค ค่าสถานะ และพรติดตัว */
  classId?: import('./classes').ClassId;

  /** ศัตรูจะทำอะไรเทิร์นหน้า — UI แสดงระหว่างเทิร์นผู้เล่น */
  enemyIntent?: EnemyIntent;

  /**
   * เหตุการณ์ที่เกิดจากคำสั่งล่าสุด — view อ่านแล้วเคลียร์ทิ้ง
   * ไม่ใช่ส่วนหนึ่งของ "สถานะเกม" จริงๆ จึงไม่ต้อง save
   * (ตอน loadGame จะถูกตั้งเป็น [] เสมอ)
   */
  pendingEvents?: CombatEvent[];

  /** รางวัลจากชัยชนะครั้งล่าสุด — UI อ่านจากที่นี่ ไม่ใช่จากข้อความใน log */
  lastReward?: { exp: number; gold: number };

  /**
   * ตัวนับสำหรับ derive RNG ในจุดที่ร้อย RNG ผ่าน signature ไม่ได้ (ดู rngState.ts)
   * เก็บใน state เพื่อให้ผลลัพธ์ยังซ้ำได้ตาม seed
   */
  rngCursor?: number;
  /** ตัวนับสำหรับสร้าง id ที่ไม่ซ้ำแบบ deterministic (แทน Date.now + Math.random) */
  idCursor?: number;

  /**
   * สถานะการเรียนรู้ของ AI — เดิมเก็บเป็นตัวแปรระดับโมดูลใน adaptiveAI.ts
   * ทำให้ไม่ถูก save ไม่ผูกกับ seed และค้างข้ามรัน
   */
  ai?: import('./adaptiveAI').AIState;

  player: PlayerState;
  enemy?: EnemyState;
  
  // Fight tracking for boss encounters
  fightCount?: number; // Total fights completed (for boss timing)

  /** ปลดล็อคศึกลับกับพระยามัจจุราชแล้วหรือยัง (ดู SECRET_BOSS_HP_RATIO) */
  secretBossUnlocked?: boolean;
  /** สรุปผลตอนจบรัน — UI อ่านจากที่นี่ */
  runSummary?: {
    won: boolean;
    fights: number;
    level: number;
    gold: number;
    beatSecretBoss: boolean;
  };
  enemyPiles?: {
    draw: string[];
    hand: string[];
    discard: string[];
  };
  /**
   * ผีที่ถูกเรียกมาช่วยในไฟต์นี้ ทั้งสองฝั่ง (แยกด้วย `owner`)
   *
   * เคยเป็นอาร์เรย์ระดับโมดูลใน `minionRuntime.ts` — ไม่ถูกเซฟ ไม่ถูกโคลนตอน
   * `applyCommand` และเป็นของกลางที่ทุก state ใช้ร่วมกัน (บั๊กชนิดเดียวกับที่
   * adaptiveAI เคยเป็นก่อน Phase 5)
   *
   * เป็นสเตตของคอมแบต จึงไม่ถูกเก็บลงเซฟ เหมือน `piles`
   */
  minions?: import('./types_extended').MinionData[];

  /**
   * สถานะคอมโบของไฟต์นี้ — ความคืบหน้า คอมโบที่ติดไปแล้ว และผลที่ยังค้างอยู่
   *
   * เดิมกระจายอยู่สองที่ที่แย่พอกัน: อาร์เรย์ระดับโมดูลใน `cardComboSystem.ts`
   * กับฟิลด์ที่แปะบน `(state as any)` อีกสามตัว — ไม่มีไทป์ ไม่ถูกเซฟ
   * และค้างข้ามไฟต์
   */
  combo?: import('./combat/combos').ComboState;

  /** กับดักที่ตั้งไว้และยังไม่ทำงาน — เป็นสเตตของไฟต์ ไม่ถูกเก็บลงเซฟ */
  traps?: import('./combat/traps').ArmedTrap[];

  enemyEnergy?: number;
  enemyLastPlayed?: string[];  // card IDs played last enemy turn, for UI animation

  piles: DeckPiles;
  masterDeck: CardData[];
  deckOpen?: boolean;

  blessings: BlessingDef[];
  log: string[];

  // Pages mode only
  mapMode?: MapMode;
  pages?: MapStatePages;

  /**
   * เส้นทางของรัน — กราฟแบบชั้นที่มองเห็นล่วงหน้าได้ทั้งเส้น
   * `pages.current.offers` ถูกสร้างจากโหนดที่เดินไปได้ตอนนี้ เพื่อให้ handler
   * ของคอมแบต/ร้าน/event ที่มีอยู่ทำงานต่อได้โดยไม่ต้องแก้
   */
  journey?: import('./map/journey').JourneyMap;

  // Shop / Events
  shopKind?: ShopKind;
  shopStock?: ShopItem[];
  shopBoughtItems?: ShopItem[]; // Track items bought in current shop session
  currentShopId?: string; // Track current shop ID for persistence
  event?: EventState;

  /** แท่นผสานการ์ด — ผสานได้ครั้งเดียวต่อแท่น การเลือกจึงมีน้ำหนัก */
  fusionAltar?: { timesUsed: number };

  /**
   * ผีที่ปราบไปแล้วในรันนี้ — จะไม่โผล่บนแผนที่อีก
   *
   * เส้นทางถูกสร้างล่วงหน้าทั้งเส้น และมีโหนดสู้ 28 โหนดจากผีที่ไม่ใช่บอส 24 ตน
   * สร้างแบบไม่ซ้ำเลยตั้งแต่ต้นจึงเป็นไปไม่ได้ แต่ผู้เล่นสู้จริงแค่ 13 ไฟต์
   * จึงเปลี่ยนตัวตอนแสดงผลแทน (ดู `syncOffersFromJourney`)
   */
  defeatedEnemyIds?: string[];

  /**
   * บทคั่นที่กำลังอ่านอยู่ — มีค่าแปลว่าเกมหยุดรอให้อ่านจบก่อน
   * `paragraph` คือย่อหน้าที่เปิดถึงแล้ว (แตะเพื่อเปิดย่อหน้าถัดไป)
   */
  chapter?: { id: string; paragraph: number };

  /**
   * บทที่ขึ้นไปแล้วในรันนี้ — กันไม่ให้บทเดิมขึ้นซ้ำเมื่อจุดยิงถูกเรียกซ้ำ
   * (คนละเรื่องกับ "เคยอ่านข้ามรัน" ซึ่งเก็บใน settings ไม่ใช่ในเซฟของรัน)
   */
  chaptersSeen?: string[];

  /** เหตุการณ์เล่าเรื่องที่กำลังอยู่ — `result` มีค่าแปลว่าเลือกไปแล้ว */
  story?: {
    eventId: string;
    chosenIndex?: number;
    result?: string;
  };

  // flags & counters
  turnFlags: {
    blessingOnce: Record<string, boolean>;
    equipmentOnce?: Record<string, boolean>;
    /** เล่นการ์ดไปแล้วกี่ใบในเทิร์นนี้ — การ์ดค่าร่ายลื่นอ่านค่านี้ */
    cardsPlayed?: number;
  };
  runCounters?: RunCounters;
  combatVictoryLock?: boolean;

  equipmentSlotsMax?: number;
  equipmentTempSlots?: number; // Additional slots available during combat
  equipped?: EquipmentData[];
  backpack?: EquipmentData[];
  equipment?: any[]; // Equipment inventory (unequipped items from shops)
  // Level up
  levelUp?: {
    bucket?: Bucket; // Legacy single bucket system
    choice?: {
      optionA: Bucket;
      optionB: Bucket;
      contextDescription?: string;
      selectedOption?: 'A' | 'B';
    };
    blessingChoices?: BlessingDef[];
    consumed?: boolean;
  } | null;

  /** การ์ดรางวัลที่รอให้เลือกหลังชนะไฟต์ — ดู `cards/reward.ts` */
  cardReward?: import('./cards/reward').CardReward;

  // Starter
  starter?: { choices: BlessingDef[]; consumed?: boolean } | null;

  runtime?: {
    equipment?: EquipmentRuntimeState;
  };

  // Shop Registry System
  shopRegistry?: PersistentShop[];
};

// ===== Commands =====
export type Command =
  // Run / Flow
  | { type: 'EnterMenu' }
  | { type: 'NewRun'; seed: string; classId?: import('./classes').ClassId }
  | { type: 'ChooseStarterBlessing'; index: number }
  | { type: 'CompleteNode' }

  // Combat
  | { type: 'StartCombat'; monsterId: string }
  | { type: 'PlayCard'; index: number }
  | { type: 'EnemyPlayCard'; cardIndex: number }
  | { type: 'StartMonsterTurn' }
  | { type: 'EndTurn' }
  /** ทำเทิร์นศัตรูจบในทีเดียว แล้วคายผลออกมาทาง state.pendingEvents */
  | { type: 'ResolveEnemyTurn' }
  | { type: 'StartPlayerTurn' }
  | { type: 'DiscardCard'; index: number }

  // Level Up
  | { type: 'ChooseLevelUp'; index?: number }
  | { type: 'ChooseLevelUpOption'; option: 'A' | 'B'; index?: number }
  | { type: 'CancelLevelUpChoice' }
  | { type: 'SkipLevelUp' }

  // การ์ดรางวัลหลังชนะไฟต์
  | { type: 'ChooseCardReward'; index: number }
  | { type: 'SkipCardReward' }

  // UI
  | { type: 'OpenDeck' }
  | { type: 'CloseDeck' }

  // Shop (card)
  | { type: 'TakeShop'; index: number }
  | { type: 'ShopReroll' }

  // Shop (remove/upgrade)
  | { type: 'ShopRemoveBuy'; index: number }
  | { type: 'ShopUpgradeBuy'; index: number }

  // ผสานการ์ด — index อ้างตำแหน่งใน masterDeck
  | { type: 'FuseCards'; indexA: number; indexB: number }

  // เหตุการณ์เล่าเรื่อง
  | { type: 'ChooseEventOption'; index: number }

  // บทคั่นเล่าเรื่อง — แตะเปิดย่อหน้าถัดไป หรือข้ามทั้งบท
  | { type: 'AdvanceChapter' }
  | { type: 'SkipChapter' }

  // Events
  | { type: 'DoBonfireHeal' }
  | { type: 'EventChooseBlessing'; index: number }
  | { type: 'EventRemoveCard'; pile: keyof DeckPiles; index: number }
  | { type: 'EventGambleRoll' }
  | { type: 'EventTreasureOpen' }
  | { type: 'DoWellUse' }
  | { type: 'DoWellDismiss' }
  | { type: 'UseWell' }
  | { type: 'TakeTreasureCard'; index: number }
  | { type: 'TakeSingleTreasureCard'; index: number }
  | { type: 'RandomizeSingleTreasure' }
  | { type: 'DoHealingShrineUse' }
  | { type: 'DoHealingShrineDismiss' }
  | { type: 'UseHealingShrine' }
  | { type: 'TakeShopEquipment'; index: number }

  // Pages
  | { type: 'OpenPage' }
  | { type: 'ChooseOffer'; index: number }
  | { type: 'DismissOffer'; index: number }
  | { type: 'Proceed' }
  
  // Shop Management
  | { type: 'DeleteShop' }
  | { type: 'DeleteShopFromMap'; index: number }

  // Equipment Management
  | { type: 'EquipFromDeck'; cardId: string }
  | { type: 'UnequipToDeck'; equipmentId: string }

  // QA / Debug
  | { type: 'QA_KillEnemy' }
  | { type: 'QA_Draw'; count: number }
  | { type: 'QA_SetEnergy'; value: number }
  | { type: 'QA_AddBlessingDemo' }
  | { type: 'QA_AddEquipmentDemo' }
  | { type: 'QA_OpenShopHere' }
  | { type: 'QA_OpenShrine' }
  | { type: 'QA_OpenRemove' }
  | { type: 'QA_OpenGamble' }
  | { type: 'QA_OpenTreasure' }
  | { type: 'QA_InitPages' }
  | { type: 'QA_PrintPage' }
  | { type: 'QA_SpawnEquippedEnemy'; enemyId?: string }
  // Status Effects Debug Commands
  | { type: 'QA_ApplyStatusToPlayer'; statusId: string; stacks?: number; duration?: number }
  | { type: 'QA_ApplyStatusToEnemy'; statusId: string; stacks?: number; duration?: number }
  | { type: 'QA_ClearPlayerStatus' }
  | { type: 'QA_ClearEnemyStatus' }
  // Enemy Behavior Debug Commands
  | { type: 'QA_TriggerEnemyBehavior' }
  | { type: 'QA_ForcePhase2' }
  // Minion Debug Commands
  | { type: 'QA_SetEnvironment' }
  | { type: 'QA_SummonPlayerMinion'; minionId: string }
  | { type: 'QA_SummonEnemyMinion'; minionId: string }
  | { type: 'QA_ClearAllMinions' }
  // Phase 4 Debug Commands - Adaptive AI & Combos
  | { type: 'QA_DebugAdaptiveAI' }
  | { type: 'QA_ResetAILearning' }
  | { type: 'QA_DebugCombos' }
  | { type: 'QA_TriggerCombo'; comboId: string }
  | { type: 'QA_ClearCombos' }
  | { type: 'QA_LevelUp' };

export type TurnCtx = { state: GameState };
