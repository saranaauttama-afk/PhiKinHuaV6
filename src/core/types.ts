// src/core/types.ts — CLEAN (Pages-first, no StartCombat, no reward)

// Import status effects from extended system
import type { StatusEffect } from './types_extended';

/** A passive (blessing or equipped card) reacts to these moments of a fight. */
export type TriggerOn='battleStart'|'equip'|'turnStart'|'turnEnd'|'play'|'prayerDone'|'discard'
  /** นักมวย: whenever rhythm (จังหวะ) is gained. */
  |'rhythm'
  /** End of the last player turn of a round (ยก = 3 player turns). */
  |'roundEnd';
export type Trigger={on:TriggerOn;type?:CardType;once?:'turn';when?:import('./cards/mechanics').CardCondition;fx:Fx};
/** Always-on modifiers plus triggers, shared by blessings and equipment cards. */
export type Passive={triggers:Trigger[];armor?:number;attackBonus?:number;
  /** Extra damage per hit for attack cards of a move (เชือกคาด). */
  moveBonus?:Partial<Record<Move,number>>;
  /** Extra ช้ำ put on the ghost by attack cards of a move. */
  moveBruise?:Partial<Record<Move,number>>;
  /** Damage per ช้ำ stack when a heavy move (ท่าหนัก) consumes it; the highest source wins. */
  heavyPerBruise?:number;
  /** Extra damage on every สวน. */
  riposteBonus?:number;
  /** One ghost hit above `over` becomes `to`; uses a charge. */
  damageCap?:{over:number;to:number};
  /** Survive a lethal hit with `hp` HP and `block` block; uses a charge. */
  deathSave?:{hp:number;block:number};
  /** Minion: rhythm is not lost at turn end while it stands (คนเป่าปี่ชวา). */
  keepsRhythm?:boolean;
  /** Minion: the first attack card each turn resolves again at this fraction (ครูมวยเฒ่า). */
  echoFirstAttack?:number;
  /** Minion: takes the first ghost attack card each ghost turn instead of the player. */
  guard?:boolean;
};
/** นักมวยคาดเชือก: the four weapons of Muay Boran. */
export type Move='punch'|'kick'|'knee'|'elbow';
/** One-time changes when a blessing is gained (แพนโดรา: a gain paid for with a cost). */
export type BlessingGain = { hp?: number; maxHp?: number; gold?: number; ap?: number; draw?: number; retain?: number; startMana?: number; slot?: number };
export type BlessingDef = Passive & {
  id: string; name: string; rarity?: Rarity; desc?: string; class?: import('./classes').ClassId;
  /** แพนโดรา: strong, with a price. */
  pandora?: boolean;
  /** Nights cleared across all runs (journal) before it can be offered. */
  unlock?: number;
  onGain?: BlessingGain;
  rules?: {openingDraw?:number;retain?:number;prayerAp?:number;prayerMult?:number;borrowBonus?:number;borrowHpCost?:number};
  flavor?: string;
};

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
/**
 * ชนิดการ์ด (แบบ Night of the Full Moon)
 *
 * attack / equipment / mana / counter เล่นฟรี · action / prayer ใช้แต้ม Action ·
 * spell ใช้มานาที่สะสมข้ามเทิร์น · curse เล่นไม่ได้ ทิ้งเองท้ายเทิร์น
 */
export type CardType = 'attack' | 'action' | 'spell' | 'equipment' | 'mana' | 'prayer' | 'counter' | 'curse';

export type StatusFx = { id: import('./combat/status-effects/types').StatusEffectType; stacks: number; turns: number; to: 'enemy' | 'self' };
/** Everything a card, counter, prayer or passive can do, resolved in this order. */
export type Fx = {
  dmg?: number; hits?: number; block?: number; heal?: number; draw?: number;
  mana?: number; ap?: number; status?: StatusFx[]; cleanse?: boolean;
  /** Copy the last N enemy cards into hand (free, removed after use). */
  borrow?: number;
  /** Gain จังหวะ (rhythm). */
  rhythm?: number;
  /** Rhythm is not lost at the end of this turn even without an attack. */
  keepRhythm?: boolean;
  /** Rhythm is never lost by an empty turn for the rest of the fight. */
  lockRhythm?: boolean;
  /** Remove up to N block from the target before damage. */
  breakBlock?: number;
  /** The next attack card this turn resolves twice. */
  doubleNext?: boolean;
  /** Put a minion (ศิษย์ค่าย / ลูกสมุน) into play by id (data/packs/base/minions.json). */
  summon?: string;
  /** Damage also hits every minion on the other side. */
  sweep?: boolean;
  /** Remove one debuff (the newest). */
  cleanseOne?: boolean;
  /** Ghost: heal by the HP the player actually lost to this effect (ดูดเลือด). */
  drain?: boolean;
};
export type CounterSpec = { trigger: import('./combat/traps').TrapTrigger; negate?: boolean; turns?: number };

export type CardData = {
  id: string;
  instanceId?: string;
  /** Stable owned copy; survives upgrades and deck reorder/removal. */
  ownedId?: string;
  name: string;
  type: CardType;
  rarity?: Rarity;
  class?: import('./classes').ClassId;
  /** Action points; only action and prayer cards. */
  ap?: number;
  /** Mana; only spell cards. */
  mana?: number;
  fx: Fx;
  /** Star 1–3 (upgrades). Missing = 1. */
  star?: number;
  /** Optional explicit star-2/3 values; otherwise `STAR_RULES` scale the base. */
  stars?: Partial<Fx>[];
  /** นำออก: removed from this fight after use. */
  exhaust?: boolean;
  /** Playable once per turn. Required on free cards that draw. */
  limit?: 'turn';
  conditional?: import('./cards/mechanics').CardConditional;
  whileHeld?: import('./cards/mechanics').HeldEffect;
  counter?: CounterSpec;
  equip?: Passive;
  /** Copied from an enemy card; never enters the deck. */
  borrowed?: boolean;
  /** A copy made in this fight (ครูสอนมวย); never copied again, removed after use. */
  copied?: boolean;
  /** Only offered after the class unlocks it in the journal. */
  locked?: boolean;
  unlockAt?: number;
  unremovable?: boolean;
  flavor?: string;
  tags?: string[];
  /** นักมวย: the move of an attack card (หมัด/เตะ/เข่า/ศอก). */
  move?: Move;
  /** ต่อจาก[ท่า]: bonus when the previous card played this turn was this move. */
  after?: { move: Move; bonus: Fx };
  /** ท่าหนัก: consumes all ช้ำ on the ghost for extra damage on the first hit. */
  heavy?: boolean;
  /** ติดมือ: always in the opening hand. */
  innate?: boolean;
  /**
   * Spend all rhythm. 'add': dmg += perStack × rhythm. 'hits': hits = rhythm (min 1).
   */
  spendRhythm?: { mode: 'add' | 'hits'; perStack?: number };
  /** สวน: if the ghost's next attack card leaves the player's HP untouched, this fires. */
  riposte?: Fx;
  /** Resolve the card again when this holds after it resolved (จระเข้ฟาดหาง). */
  repeatIf?: import('./cards/mechanics').CardCondition;
  /** Equipment uses before it wears out; `chargesLeft` counts down in a fight. */
  charges?: number;
  chargesLeft?: number;
};

// Enemy
export type EnemyState = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  block: number;
  /** AP left this turn and AP per turn. Ghost attacks are free; actions cost AP. */
  ap?: number;
  maxAp?: number;
  handCount?: number;
  handSize?: number;
  /** ชาร์จ steps of each held card (null = not a charge card); public, set by ghostMechanics.syncHandCharges. */
  handCharges?: Array<number | null>;
  /** Card ids the ghost's deck is built from (swapped when a boss awakens). */
  deck?: string[];
  /** ความลึก: fights won this night before this one (balance/notfm.ts ENEMY_DEPTH). */
  depth?: number;
  statusEffects?: StatusEffect[];
};

export type DeckPiles = {
  draw: CardData[];
  hand: CardData[];
  discard: CardData[];
  exhaust: CardData[];
};

export type Phase =
  | 'start' | 'menu' | 'map' | 'combat' | 'victory' | 'defeat'
  | 'event' | 'shop' | 'levelup' | 'starter'
  /** After-fight dialogue (ความกล้า / บุญ). */
  | 'talk'
  /** ชนะไฟต์แล้ว กำลังเลือกการ์ดรางวัล (ดู `cards/reward.ts`) */
  | 'reward'
  | 'run_complete'; // จบรันแล้ว (ชนะบอสสุดท้าย) — แสดงจอสรุป

/** Level-up rewards: a new card, a star on a deck card, or removing a deck card. */
export type LevelOption = 'card' | 'upgrade' | 'remove' | 'slot' | 'retain' | 'ap' | 'mana' | 'draw';

/** Per-fight state for skills and passives; reset when a fight starts. */
export type FightState = {
  /** HP the player lost this fight (ใจเพชร). */
  hpLost: number;
  /** Ghost turns taken this fight; rage counts these, so an extra player turn does not raise it. */
  ghostTurns: number;
  /** Turn a B/C skill was used (one per turn). */
  skillTurn?: number;
  /** ครูสอนมวย: copy the next card played. */
  copyNext?: boolean;
  /** ปลุกเสก: the next spell's effect is multiplied. */
  nextSpellMult?: number;
  /** สำรวมจิต: spells cost less on this turn, and ghost hits are reduced until the next player turn. */
  halfSpellTurn?: number;
  halfDamage?: boolean;
  /** แผ่เมตตา: lifesteal through this turn number. */
  lifestealUntil?: number;
  /** เข้าสมาธิ: skip the next ghost turn. */
  extraTurn?: boolean;
  /** Medium passive already copied a ghost card this fight. */
  mimicUsed?: boolean;
  /** The boss's relic: its rule works until enough hits break it. */
  relic?: BossRelicState;
  /** Effect draws used on turn `fxDrawTurn` (CARD_RULES.fxDrawPerTurn). */
  fxDrawTurn?: number;
  fxDrawn?: number;
  /** นักมวย: จังหวะ this fight and the move of the last attack card (any turn). */
  rhythm?: number;
  lastAttackMove?: Move;
  rhythmLocked?: boolean;
  /** สวน waiting for the ghost's next attack card. */
  ripostes?: Fx[];
  /** Ghost turn number the guard minion already took a card on. */
  guardTurn?: number;
  /** The ghost's สวน, waiting for the player's next attack card (cleared at the ghost's turn). */
  enemyRipostes?: Fx[];
  /** Player turn on which the player last made the ghost lose HP (ผีตายโหง แค้นฝังใจ). */
  enemyHurtTurn?: number;
  /** The boss has crossed into its second phase (ghost_rules.json `phase2`). */
  ghostPhase2?: boolean;
};

/** A minion in play (ศิษย์ค่ายของเรา / ลูกสมุนของผี). */
export type MinionState = {
  uid: string;
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  side: 'player' | 'enemy';
  passive: Passive;
  /** Ghost minion: what it does at the end of each ghost turn. */
  act?: Fx;
  /** Ghost minion: player attacks hit it before the ghost. */
  taunt?: boolean;
  /** Ghost minion: extra ชาร์จ steps per ghost turn for the ghost's held charge cards (หัวในกระด้ง). */
  chargeBoost?: number;
  /** Leaves after this many turns of its side (undefined = until it dies or the fight ends). */
  turnsLeft?: number;
};

export type BossRelicState = {
  bossId: string;
  durability: number;
  broken: boolean;
  reviveUsed?: boolean;
  /** Cards the relic took from hand; they return when it breaks or the fight ends. */
  stolen: CardData[];
};

export type AlignmentChoice = 'courage' | 'merit' | 'leave';

export type PlayerState = {
  hp: number; maxHp: number; block: number; gold: number;
  level: number; exp: number; expToNext: number;
  /** Action points this turn / per turn. */
  ap: number; maxAp: number;
  /** Mana carries over between turns of a fight; reset to `startMana` each fight. */
  mana: number; startMana: number;
  openingDraw: number; drawPerTurn: number; handMax: number;
  /** Cards kept in hand past the end of a turn; the rest are discarded by the player's choice. */
  retain?: number;
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
export type ShopKind = 'card' | 'remove' | 'upgrade' | 'equipment' | 'healing' | 'well' | 'treasure' | 'treasure_single' | 'blessing';

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

export type TurnSide = 'player' | 'enemy';

// ── Combat events ────────────────────────────────────────────────────────────
// engine คำนวณจนจบแล้วคายเหตุการณ์ออกมาเป็นลิสต์ — view เอาไปเล่นเป็นอนิเมชั่น
// ตามจังหวะของตัวเอง ไม่มี setTimeout ตัวไหนได้แตะ game state อีก
//
// ค่าที่อยู่ใน event คือค่าที่เกิดขึ้นจริง (เช่น hpLoss หลังหัก block แล้ว)
// UI ต้องแสดงจากตรงนี้ ไม่ใช่จากตัวเลขบนการ์ด

export type CombatEventTarget = 'player' | 'enemy';

export type CardHistoryEntry = {
  seq: number; side: CombatEventTarget; turn: number; ownerId?: string; card: CardData; results: string[];
};

export type CombatFrame = {
  player: GameState["player"]; enemy: GameState["enemy"]; historySeq?: number;
};

export type CombatEvent = (
  /** ศัตรูเปิดการ์ดใบหนึ่ง — view ใช้จังหวะนี้พลิกการ์ด */
  | { t: 'EnemyCardRevealed'; ownerId?:string; handIndex?:number; cardId: string; name: string; dmg: number; block: number; cost?: number; hits?: number; desc?: string; charge?: number }
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
      sourceKind: 'card' | 'status' | 'equipment' | 'event' | 'blessing';
      /** What changed this hit (combat/damage.ts damageParts); the HUD shows it and shakes the badges. */
      parts?: import('./combat/damage').DamagePart[];
    }
  | { t: 'EnemyHandChanged'; drawn: number }
  | { t: 'CardResolved'; entry: CardHistoryEntry }
  | { t: 'BlockGained'; target: CombatEventTarget; amount: number }
  | { t: 'Healed'; target: CombatEventTarget; amount: number }
  | { t: 'StatusApplied'; target: CombatEventTarget; effectId: string; stacks: number }
  | { t: 'Died'; who: CombatEventTarget }
  | { t: 'TurnEnded'; who: CombatEventTarget }
  /** นักมวย: จังหวะ changed (value after). */
  | { t: 'RhythmChanged'; value: number }
  /** ท่าหนัก ate ช้ำ for `bonus` damage. */
  | { t: 'HeavyHit'; bonus: number }
  /** สวน fired after a fully blocked ghost attack. */
  | { t: 'Riposte' }
  /** พักยก: the end of round `round`. */
  | { t: 'RoundEnd'; round: number }
  | { t: 'MinionSummoned'; side: CombatEventTarget; uid: string; id: string }
  | { t: 'MinionDamaged'; side: CombatEventTarget; uid: string; amount: number }
  /** The ghost armed สวน (waits for the player's next attack card). */
  | { t: 'GhostGuard' }
  /** The ghost's สวน fired after the player's attack card did not hurt it. */
  | { t: 'GhostRiposte' }
  /** มึน on the player cost AP at the start of the turn. */
  | { t: 'PlayerStunned'; apLost: number }
  /** A ghost crossed into its second phase. */
  | { t: 'GhostPhase'; text: string }
) & { frame?: CombatFrame };

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
  /** Physical positions in the in-turn hand, including duplicate definitions. */
  handIndexes?: number[];
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
  campaign?: import('./campaign/nights').CampaignRun;
  /** Owned deck positions selected before this fight; never copies. */
  preEquipment?:number[];
  equipmentLoadout?: string[];
  ownedCardSeq?: number;
  eventMemory?:Record<string,number>;
  runMetrics?: import('./campaign/metrics').RunMetrics;
  discovery?: import('./archive/progress').DiscoveryRun;

  /** ศัตรูจะทำอะไรเทิร์นหน้า — UI แสดงระหว่างเทิร์นผู้เล่น */
  enemyIntent?: EnemyIntent;

  /**
   * เหตุการณ์ที่เกิดจากคำสั่งล่าสุด — view อ่านแล้วเคลียร์ทิ้ง
   * ไม่ใช่ส่วนหนึ่งของ "สถานะเกม" จริงๆ จึงไม่ต้อง save
   * (ตอน loadGame จะถูกตั้งเป็น [] เสมอ)
   */
  pendingEvents?: CombatEvent[];
  cardHistory?: CardHistoryEntry[];
  cardHistorySeq?: number;

  /** รางวัลจากชัยชนะครั้งล่าสุด — UI อ่านจากที่นี่ ไม่ใช่จากข้อความใน log */
  lastReward?: { exp: number; gold: number };

  /**
   * ตัวนับสำหรับ derive RNG ในจุดที่ร้อย RNG ผ่าน signature ไม่ได้ (ดู rngState.ts)
   * เก็บใน state เพื่อให้ผลลัพธ์ยังซ้ำได้ตาม seed
   */
  rngCursor?: number;
  /** ตัวนับสำหรับสร้าง id ที่ไม่ซ้ำแบบ deterministic (แทน Date.now + Math.random) */
  idCursor?: number;

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
    metrics?: import('./campaign/metrics').RunMetrics;
  };
  enemyPiles?: {
    draw: string[];
    hand: string[];
    discard: string[];
  };


  /** กับดักที่ตั้งไว้และยังไม่ทำงาน — เป็นสเตตของไฟต์ ไม่ถูกเก็บลงเซฟ */
  traps?: import('./combat/traps').ArmedTrap[];
  /** ศิษย์ค่าย in play (นักมวย) and the ghost's ลูกสมุน; both emptied when a fight starts. */
  minions?: MinionState[];
  enemyMinions?: MinionState[];
  minionSeq?: number;

  enemyHandSize?: number;
  enemyDrawPerTurn?: number;
  enemyMaxRetained?: number;
  enemyHandAges?: number[];
  enemyIdleTurns?: number;
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

  // Shop / Events
  shopKind?: ShopKind;
  shopStock?: ShopItem[];
  shopBoughtItems?: ShopItem[]; // Track items bought in current shop session
  currentShopId?: string; // Track current shop ID for persistence
  event?: EventState;

  /** แท่นผสานการ์ด — ผสานได้ครั้งเดียวต่อแท่น การเลือกจึงมีน้ำหนัก */

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
  /** Frozen actual grant, shown on the result screen and preserved on resume. */
  rewardReceipt?: {cards:CardData[];blessings:BlessingDef[];lostCards:CardData[];hp:number;gold:number};

  // flags & counters
  turnFlags: {
    blessingOnce: Record<string, boolean>;
    equipmentOnce?: Record<string, boolean>;
    /** เล่นการ์ดไปแล้วกี่ใบในเทิร์นนี้ */
    cardsPlayed?: number;
    /** Card ids with `limit: 'turn'` already played this turn. */
    limited?: string[];
    /** Passive triggers with `once: 'turn'` already fired this turn. */
    triggerOnce?: string[];
    /** Spells played this turn (shaman passive). */
    spellsCast?: number;
    /** นักมวย: move of the last card played this turn (null after a card with no move). */
    lastMove?: Move | null;
    /** Distinct moves of attack cards played this turn. */
    moves?: Move[];
    /** Attack cards played this turn (rhythm is lost on a turn with none). */
    attacks?: number;
    keepRhythm?: boolean;
    /** คาดเชือกใหม่: the next attack card resolves twice. */
    doubleNext?: boolean;
    /** ครูมวยเฒ่า already echoed an attack this turn. */
    echoed?: boolean;
  };
  runCounters?: RunCounters;
  combatVictoryLock?: boolean;

  equipmentSlotsMax?: number;
  /** Equipment cards in play this fight (oldest first); emptied after each fight. */
  equipped?: CardData[];
  /** Prayers waiting to resolve at the start of a later player turn. */
  prayers?: Array<{ card: CardData; turnsLeft: number; mult: number }>;
  // Level up
  levelUp?: {
    /** Three card offers for the 'card' option. */
    cards: CardData[];
    /** The two rewards offered this level (NOTFM: pick one of two). Missing on old saves: all three classic ones. */
    offers?: LevelOption[];
    /** 'upgrade' grants this many upgrades; the reward ends when they are used or nothing can be upgraded. */
    upgradesLeft?: number;
    consumed?: boolean;
    result?: { fight: number; text: string };
  } | null;

  /** Skill id → fights left before it is ready (0 = ready). */
  skills?: Record<string, number>;
  /** ต่อรองเจ้าที่: percent of the price paid for the next shop purchase. */
  shopPricePct?: number;
  /** A dialogue waiting after a win. */
  ghostTalk?: { ghostId: string };
  /** Blessings offered at the night's blessing stop; emptied once one is taken. */
  blessingStock?: BlessingDef[];
  fight?: FightState;

  /** การ์ดรางวัลที่รอให้เลือกหลังชนะไฟต์ — ดู `cards/reward.ts` */
  cardReward?: import('./cards/reward').CardReward;

  // Starter
  starter?: { choices: BlessingDef[]; consumed?: boolean } | null;

  // Shop Registry System
  shopRegistry?: PersistentShop[];
};

// ===== Commands =====
export type Command =
  // Run / Flow
  | { type: 'EnterMenu' }
  | { type: 'NewRun'; seed: string; discoveryId?:string; classId?: import('./classes').ClassId; difficulty?:import('./campaign/threeNight').Difficulty; unlocks?: Array<'card'|'blessing'>; blessingTier?: number; milestoneLevel?:number;
      /** Has beaten a final boss before (journal); needed for the secret boss. */
      veteran?: boolean }
  | { type: 'AnswerGhostTalk'; choice: AlignmentChoice }
  | { type: 'ChooseStarterBlessing'; index: number }
  | { type: 'CompleteNode' }

  // Combat
  | { type: 'StartCombat'; monsterId: string }
  /** `wait` (1–3) is chosen for prayer cards; longer waits multiply the effect. */
  | { type: 'PlayCard'; index: number; wait?: number }
  | { type: 'EnemyPlayCard'; cardIndex: number }
  | { type: 'StartMonsterTurn' }
  | { type: 'EndTurn' }
  | { type: 'DiscardForTurnEnd'; indices: number[] }
  /** ทำเทิร์นศัตรูจบในทีเดียว แล้วคายผลออกมาทาง state.pendingEvents */
  | { type: 'ResolveEnemyTurn' }
  | { type: 'StartPlayerTurn' }

  // Level Up
  | { type: 'ChooseLevelUpOption'; option: LevelOption; index: number }
  | { type: 'SkipLevelUp' }

  // Class skills; `index` picks a deck card, an option or a ghost card where the skill needs one
  | { type: 'UseSkill'; id: string; index?: number }

  // การ์ดรางวัลหลังชนะไฟต์
  | { type: 'ChooseCardReward'; index: number }
  | { type: 'SkipCardReward' }

  // UI
  | { type: 'SetEquipmentLoadout'; indices: number[] }
  | { type: 'ChooseHandReward'; option: 'retain' | 'draw' }
  | { type: 'OpenDeck' }
  | { type: 'CloseDeck' }

  // Shop (card)
  | { type: 'TakeShop'; index: number }
  | { type: 'ShopReroll' }
  | { type: 'TakeShopBlessing'; index: number }

  // Shop (remove/upgrade)
  | { type: 'ShopRemoveBuy'; index: number }
  | { type: 'ShopUpgradeBuy'; index: number }

  // ผสานการ์ด — index อ้างตำแหน่งใน masterDeck

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

  // Pages
  | { type: 'ChooseOffer'; index: number; equipmentIndices?:number[] }
  | { type: 'DismissOffer'; index: number }
  
  // Shop Management
  | { type: 'DeleteShop' }
  | { type: 'DeleteShopFromMap'; index: number };


export type TurnCtx = { state: GameState };
