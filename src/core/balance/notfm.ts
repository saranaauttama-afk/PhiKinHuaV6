// src/core/balance/notfm.ts — the numbers behind the Night-of-the-Full-Moon card rules.
// Every tuning value for cards, resources and classes lives here. Phase 2 starting points;
// change them here and re-run `npm run balance`.
import type { ClassId } from '../classes';

export const CARD_RULES = {
  /** Cards drawn when a fight starts. */
  openingDraw: 4,
  /** Cards drawn at the start of each later player turn. */
  drawPerTurn: 2,
  /** Hard cap on cards held during a turn; draws past it stay in the draw pile. */
  handMax: 10,
  /** Cards kept past the end of a turn; above it the player picks cards to discard (NOTFM). */
  retain: 3,
  /** Action points restored each player turn. */
  apPerTurn: 2,
  /** Equipment cards that can be in play at once; a new one replaces the oldest. */
  equipmentSlots: 1,
} as const;

/** Star 1–3. Numbers scale by `mult`; status stacks gain `statusBonus`. Card data may override. */
export const STAR_RULES = {
  mult: [1, 1.5, 2],
  statusBonus: [0, 1, 2],
  maxStar: 3,
} as const;

/** A prayer waits 1–3 player turns, then resolves with its numbers multiplied. */
export const PRAYER_MULT = [1, 2, 3] as const;

/** Class starting resources (passives and skills are separate). */
export const CLASS_RESOURCES: Record<ClassId, { hp: number; startMana: number }> = {
  warrior: { hp: 60, startMana: 0 },
  shaman: { hp: 60, startMana: 4 },
  nun: { hp: 56, startMana: 0 },
  medium: { hp: 60, startMana: 6 },
};

/** Shop card prices by rarity (equipment cards included). */
export const CARD_PRICES = { Common: 30, Uncommon: 55, Rare: 90, Legendary: 140 } as const;

export type EnemyKind = 'normal' | 'elite' | 'boss';

/**
 * Ghost hands. Attacks are free and actions cost AP, as for the player, so the AP budget
 * limits setup and defence while the draw count limits how many attacks come each turn.
 */
export const ENEMY_RULES: Record<EnemyKind, { handSize: number; drawPerTurn: number; maxRetained: number; ap: number }> = {
  normal: { handSize: 4, drawPerTurn: 2, maxRetained: 2, ap: 2 },
  elite: { handSize: 5, drawPerTurn: 2, maxRetained: 3, ap: 3 },
  boss: { handSize: 5, drawPerTurn: 2, maxRetained: 3, ap: 3 },
};

/** Ghost HP before night and difficulty scaling. Normal ghosts add `perTier` per tier (T1–T5). */
export const ENEMY_HP = {
  normal: 28, perTier: 2, elite: 48, boss: 72, ultimateBoss: 105,
  /** Multiplier for nights 1–3. */
  night: [1, 1.8, 2.6],
  /** Night bosses use their own multipliers: the night-1 boss is the first wall, kept short. */
  bossNight: [0.85, 2, 2.9],
} as const;

/**
 * Rage (โกรธ): from `startTurn`, each ghost hit deals `perTurn` more for every turn the fight
 * has lasted. It starts on night `fromNight(difficulty)`, so long fights cost more.
 */
export const RAGE = {
  startTurn: 3,
  perTurn: 1,
  fromNight: (difficulty: number) => (difficulty >= 3 ? 1 : 2), // DIFFICULTY.rageNight1From
  /** Before rage starts for the night, it still starts at this turn, so no fight is endless. */
  backstopTurn: 10,
} as const;

/**
 * Class passives. `triggers`/`armor`/`attackBonus` work like a blessing; the extra fields are
 * class-only rules. Text on screen is generated from these numbers.
 */
export const CLASS_PASSIVES: Record<ClassId, import('../types').Passive & {
  name: string;
  /** The first spell each turn costs this much less mana. */
  spellDiscount?: number;
  /** The first ghost card revealed each fight is copied into hand (free, removed after use). */
  copyFirstGhostCard?: boolean;
}> = {
  warrior: { name: 'ยืนเฝ้าประตู', triggers: [{ on: 'equip', fx: { block: 3 } }] },
  shaman: { name: 'ครูพักลักจำ', triggers: [], spellDiscount: 1 },
  nun: { name: 'อานิสงส์', triggers: [{ on: 'prayerDone', fx: { heal: 3 } }] },
  medium: { name: 'ผีติดตาม', triggers: [], copyFirstGhostCard: true },
};

/**
 * EXP per win on the three-night route, by night (1–3). Later ghosts give more, so level-ups
 * keep coming about every 3–4 fights (see NEXT_EXP_TABLE in balance/progression.ts).
 */
export const NIGHT_EXP = { normal: [12, 18, 24], elite: [20, 30, 40], boss: [30, 45, 60] } as const;

/**
 * Level-up: full heal, more max HP, then pick one of two rewards rolled from `weights`
 * (NOTFM). 'upgrade' upgrades `upgrades` cards; 'slot' and 'retain' stop at their caps.
 */
export const LEVEL_UP = {
  maxHp: 8, skipGold: 25, offers: 2, upgrades: 2,
  weights: { card: 3, upgrade: 3, remove: 2, slot: 1, retain: 2, ap:1, mana:2, draw:1 },
  caps: { slot: 3, retain: 6, ap:3, mana:10, draw:4 },
} as const;

/**
 * ความกล้า / บุญ. Dialogues after some wins move one of them by 1 (capped at `max`).
 * Reaching `threshold` grants that side's blessing once. At the end of night 3 they pick
 * the final boss; both at `threshold` on a veteran run reveals the secret boss.
 */
export const ALIGNMENT = {
  max: 6,
  threshold: 4,
  /** Dialogues per night at most (elites, the night's boss, and the first win over each ghost). */
  talksPerNight: 4,
  courageGold: 10,
  meritHeal: 5,
} as const;

/**
 * Economy. Every night guarantees one each of: shop, blacksmith (upgrade), ศาลาลืมเลือน
 * (remove), blessing, story and healing, plus a chest with `chestChance`. The first upgrade
 * or removal at each stop is free; later ones cost the flat price.
 */
export const ECONOMY = {
  startGold: 50,
  /** Gold per win. Normal ghosts get GOLD_BY_TIER (balance/progression.ts) × `normalPct`%. */
  gold: { normalPct: 50, elite: 25, boss: 40 },
  removePrice: 40,
  upgradePrice: 40,
  /** Free upgrades / removals at each blacksmith / ศาลาลืมเลือน. */
  freePerStop: 1,
  rerollPrice: 20,
  /** Card shop stock: `cards` from the class pool plus `equipment` equipment cards. */
  shopStock: { cards: 4, equipment: 1 },
  blessingChoices: 3,
  chestChance: 0.5,
  well: { heal: 10, uses: 2 },
  shrine: { price: 25, step: 10, uses: 3 },
} as const;

/** Difficulty 1–5: each level adds one rule on top of the ones below it. */
export const DIFFICULTY = {
  /** From this level rage starts on night 1 (below it, night 2). */
  rageNight1From: 3,
  /** From this level ghosts have `hpPct` more HP. */
  hpFrom: 2, hpPct: 20,
  /** From this level gold prices rise by `markupPct` and healing stops heal half. */
  priceFrom: 4, markupPct: 25,
  /** From this level the player draws one card fewer per turn on night 3. */
  drawCutFrom: 5,
} as const;
