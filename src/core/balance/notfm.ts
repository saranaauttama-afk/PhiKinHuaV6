// src/core/balance/notfm.ts — the numbers behind the Night-of-the-Full-Moon card rules.
// Every tuning value for cards, resources and classes lives here. Phase 2 starting points;
// change them here and re-run `npm run balance`.
import type { ClassId } from '../classes';

export const CARD_RULES = {
  /** Cards drawn when a fight starts. */
  openingDraw: 2,
  /** Cards drawn at the start of each later player turn. */
  drawPerTurn: 2,
  /** Hard cap on cards held during a turn; draws past it stay in the draw pile. */
  handMax: 10,
  /** Cards kept past the end of a turn; above it the player picks cards to discard (NOTFM). */
  retain: 2,
  /** Action points restored each player turn. */
  apPerTurn: 2,
  /** Equipment cards that can be in play at once; a new one replaces the oldest. */
  equipmentSlots: 1,
  /**
   * Extra cards on the first turn of every fight: opening hand = max hand (`retain`) + this.
   * Why: with 2 AP and only 2 cards, turn 1 often had no real choice and night 1 became the
   * main wall in simulation. Only the opening is eased; later turns stay at hand 2 / draw 2.
   * Removed at difficulty `DIFFICULTY.noOpeningBonusFrom`.
   */
  openingBonus: 1,
  /**
   * Cards drawn by card, blessing and equipment effects per player turn (turn draw, opening
   * draw and class skills are not counted). Why: "do X + draw 1" and free draw cards let a
   * player bypass the small NOTFM hand; one global limit also covers future cards.
   */
  fxDrawPerTurn: 2,
} as const;

/**
 * นักมวยคาดเชือก (14 Oct 2026, docs/nak-muay/DESIGN.md). จังหวะ: an attack card whose move
 * differs from the previous attack card gains `perNewMove`; every stack adds `dmgPerStack`
 * to each hit of attack cards, up to `max`. It is lost at the end of a turn with no attack.
 * ท่าหนัก consumes every ช้ำ for `heavyPerBruise` damage each. A round (ยก) is `roundTurns`
 * player turns; `roundEnd` triggers fire at the end of its last turn.
 */
export const FIGHTER_RULES = {
  rhythmMax: 8,
  perNewMove: 1,
  dmgPerStack: 1,
  heavyPerBruise: 2,
  roundTurns: 3,
  /** ครูมวยเฒ่า and other echoes never echo an echo. */
} as const;

/**
 * หมอผี — น้ำมนต์ (docs/mor-phi/DESIGN.md, 15 Oct 2026). Stored in `player.mana` so level-ups,
 * skills, blessings and saves keep working; shown as น้ำมนต์ for the shaman only.
 */
export const WATER_RULES = {
  /** ขันน้ำมนต์ประจำตัว (passive): น้ำมนต์ at the start of every player turn after the first. */
  perTurn: 3,
  /** ขัน: most น้ำมนต์ held at once (equipment `bowlBonus` adds to it). */
  bowlMax: 12,
  /** น้ำล้นขัน: block per point of น้ำมนต์ gained past the bowl. */
  overflowBlock: 2,
  /** ยันต์ stacks on a ghost that trigger ผนึก. */
  sealAt: 5,
  /** น้ำมนต์ gained by every ผนึก. */
  sealWater: 2,
  /** ของต่ำ: HP paid for each missing น้ำมนต์ on a `blood` spell. */
  bloodPerWater: 2,
} as const;

/** Minions in play at once; a new one replaces the oldest. */
export const MINION_RULES = { playerSlots: 2, enemySlots: 3 } as const;

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

/** Late elites/bosses draw one extra card every third actual ghost turn; slots/AP stay fixed. */
export const ENEMY_DRAW_CADENCE = { fromNight: 2, extra: 1, every: 3 } as const;

/**
 * Night-1 ghost mechanics (15 Oct 2026, docs/ghosts/NIGHT1-DESIGN.md — owner agreed).
 * ชาร์จ: a card with `charge` grows by that effect for every ghost turn it waits in the ghost's
 * hand, up to `chargeMaxTurns`; the player sees the count on the card back (owner's choice 2).
 * A held charge card is never thrown away for age while it is still growing.
 * มึน on the player: the next player turn starts with `stunApLoss` fewer AP (owner's choice 3).
 */
export const GHOST_MECHANICS = {
  chargeMaxTurns: 3,
  stunApLoss: 1,
} as const;

/** Ghost HP before night and difficulty scaling. Normal ghosts add `perTier` per tier (T1–T5). */
export const ENEMY_HP = {
  normal: 28, perTier: 2, elite: 42, boss: 72, ultimateBoss: 105,
  /** Multiplier for nights 1–3. */
  /** Re-centred 15 Oct 2026 for ENEMY_DEPTH: a night's average fight stays near the old flat value. */
  night: [0.75, 1.1, 1.8],
  /**
   * Night bosses use their own multipliers: the night-1 boss is the first wall, kept short.
   * Tuning 13 Oct 2026 (was night 1/1.8/2.6, boss .85/2/2.9): hand/draw growth now comes only
   * after the night-2 boss, shops are smaller and effect draws are capped, so the player is
   * weaker in nights 1–2; HP was lowered most there. See docs/tuning-2026-10-13/HANDOFF.md.
   */
  // 15 Oct 2026: night-2 boss 1.6 → 1.4. The rebuilt เปรตวัดร้าง (curses + บริวาร + phase 2 charge)
  // became the level-1 wall in simulation (21 of 24 level-1 losses on night 2); see docs/ghosts/HANDOFF.md.
  bossNight: [0.75, 1.4, 2.7],
} as const;

/**
 * Depth (ความลึก) inside a night (15 Oct 2026, owner playtest: late ghosts felt easy because HP
 * followed folklore tier only and the player grows all night). The n-th fight of a night is always
 * harder than the one before, whichever page the player picks, so skipping a page cannot dodge it.
 * `depth` = monster fights already won this night (0 for the first). Bosses use their own numbers.
 */
export const ENEMY_DEPTH = {
  /** HP +this % per fight already won this night. */
  hpPct: 8,
  /** Ghost strength +1 at each of these depths (permanent for the fight). */
  strengthAt: [3, 6, 9],
  /** From this depth ghosts get +1 AP (more setup and defence per turn). */
  apFrom: 5,
  /**
   * Folklore tier the route aims for at the start and end of each night (1–5); the ghosts in
   * between climb evenly, so the faces you meet also show you are going deeper.
   */
  tierSpan: [[1, 3], [2, 4], [3, 5]] as ReadonlyArray<readonly [number, number]>,
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
  /** นักมวย: จังหวะ (FIGHTER_RULES). */
  rhythm?: boolean;
  /** หมอผี: mana is น้ำมนต์ in a bowl (WATER_RULES). */
  water?: boolean;
}> = {
  // Was นักรบวัด 'ยืนเฝ้าประตู' (block 3 on equip) until 14 Oct 2026.
  warrior: { name: 'แม่ไม้มวยไทย', triggers: [], rhythm: true },
  // Was 'ครูพักลักจำ' (first spell each turn −1 mana) until 15 Oct 2026: น้ำมนต์ rebuild.
  shaman: { name: 'ขันน้ำมนต์ประจำตัว', triggers: [{ on: 'turnStart', fx: { mana: WATER_RULES.perTurn } }], water: true },
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
  /**
   * Heal on level-up: the new max-HP points plus this % of max HP (was a full heal until
   * 15 Oct 2026). Owner playtest: early cards plus a full heal every few fights made damage
   * meaningless and class skills unnecessary.
   */
  healPct: 30,
  weights: { card: 3, upgrade: 3, remove: 2, slot: 1, retain: 0, ap:1, mana:2, draw:0 },
  /** Draw stops at 3: with 2–3 AP a turn, a 4th card a turn is rarely playable and removes choices. */
  caps: { slot: 3, retain: 4, ap:3, mana:10, draw:3 },
  /** Only this night's boss offers +1 hand or +1 draw instead of a card (growth is rare and mid-run). */
  growthNight: 2,
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
  shopStock: { cards: 2, equipment: 1 },
  /**
   * Shop rarity weights per night (1–3). Night 1 sells no Rare/Legendary, Legendary only on
   * night 3, so a strong card can't be bought early and carry the whole run.
   */
  shopRarity: [
    { Common: 65, Uncommon: 35, Rare: 0, Legendary: 0 },
    { Common: 50, Uncommon: 35, Rare: 15, Legendary: 0 },
    { Common: 40, Uncommon: 35, Rare: 20, Legendary: 5 },
  ],
  /**
   * Card reward (elites and night bosses) rarity weights per night. The pick inside a lane is
   * by rarity first, so a lane with many Commons does not drown its single Legendary or the reverse.
   * Night 1 has no Legendary; night 2 has a small chance; night 3 opens up.
   */
  rewardRarity: [
    { Common: 45, Uncommon: 40, Rare: 15, Legendary: 0 },
    { Common: 20, Uncommon: 45, Rare: 28, Legendary: 7 },
    { Common: 0, Uncommon: 40, Rare: 42, Legendary: 18 },
  ],
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
  hpFrom: 2, hpPct: 15,
  /** From this level gold prices rise by `markupPct` and healing stops heal half. */
  priceFrom: 4, markupPct: 25,
  /**
   * From this level rage starts `rageEarlyBy` ghost turns sooner (RAGE.startTurn 3 → 2).
   * Why: the old level-4 rule (prices/healing) barely changed fights, so level 4 played easier
   * than level 3 in simulation. Rage pressure punishes slow, stalling turns rather than adding HP.
   */
  rageEarlyFrom: 4, rageEarlyBy: 1,
  /**
   * From this level fights open without CARD_RULES.openingBonus. Replaces the old level-5
   * "night 3 draws −1", which no longer did anything once draw starts at its floor of 2.
   */
  noOpeningBonusFrom: 5,
} as const;

/**
 * Total limits on bargain rules (`BlessingDef.rules`) however many bargains are owned.
 * Offers already refuse a bargain that touches a rule the player has (bargainConflicts);
 * these clamps protect older saves. prayerAp is capped at +1 so a prayer (base 1 AP)
 * never costs more than the 2 AP a turn gives.
 */
export const BARGAIN_RULE_LIMITS = {
  prayerAp: [0, 1], prayerMult: [0, 1], openingDraw: [-1, 0], retain: [-3, 2], borrowBonus: [0, 1], borrowHpCost: [0, 2],
} as const;
