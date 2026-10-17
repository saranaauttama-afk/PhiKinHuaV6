// src/core/cards/water.ts — หมอผี: น้ำมนต์, ขัน, สาด, ยันต์/ผนึก, สายสิญจน์, ของต่ำ.
//
// Design and reasons: docs/mor-phi/DESIGN.md. Numbers: WATER_RULES (balance/notfm.ts).
//
// - น้ำมนต์ is the shaman's mana (`player.mana`, so level-ups, skills, blessings and saves keep
//   working); only the shaman's bowl has a cap. Water past the cap overflows into block.
// - สาด (splash): a spell that spends all water; the effect is per point spent.
// - ยันต์ (yant) sits on the ghost and never fades. At WATER_RULES.sealAt stacks it seals (ผนึก)
//   the card the ghost holds with the most charge — the ghost never gets to play it.
// - ปลุกยันต์ (wakeYant): eat every ยันต์ for an effect per stack instead of waiting for the seal.
// - สายสิญจน์ (unCharge): the ghost's held cards go back to charge 0.
// - ของต่ำ (blood): a spell that may be paid with HP for the water it lacks.
import type { CardData, Fx, GameState, PerStackFx } from '../types';
import type { ClassId } from '../classes';
import type { RNG } from '../rng';
import { CLASS_PASSIVES, WATER_RULES } from '../balance/notfm';

/** This class keeps its mana as น้ำมนต์ in a bowl (the shaman passive). */
export function usesWater(s: Partial<GameState>): boolean {
  return !!(s.classId && CLASS_PASSIVES[s.classId]?.water);
}

/** Word for the mana resource: น้ำมนต์ for the shaman, มานา for anyone else. */
export function resourceName(classId?: ClassId | string): string {
  return classId && (CLASS_PASSIVES as Record<string, { water?: boolean }>)[classId]?.water ? 'น้ำมนต์' : 'มานา';
}

/** Word for a card's cost (cards carry their class; class-less cards read มานา). */
export function cardResourceName(card: Pick<CardData, 'class'>): string {
  return resourceName(card.class);
}

function passives(s: GameState) {
  return (require('./passives').passiveSources(s) as Array<{ passive: import('../types').Passive }>).map(x => x.passive);
}

/** ขัน: most น้ำมนต์ held at once. */
export function bowlMax(s: GameState): number {
  return WATER_RULES.bowlMax + passives(s).reduce((n, p) => n + (p.bowlBonus ?? 0), 0);
}

/**
 * Gain mana. For the shaman it fills the bowl; what does not fit overflows (น้ำล้นขัน) into
 * block, and into damage with รางน้ำมนต์.
 */
export function gainWater(s: GameState, n: number): void {
  if (n <= 0) return;
  if (!usesWater(s)) { s.player.mana += n; return; }
  const cap = bowlMax(s);
  const before = s.player.mana;
  const kept = Math.max(0, Math.min(n, cap - before));
  s.player.mana = Math.max(before, Math.min(cap, before + n));
  const over = n - kept;
  if (kept) require('../combat/damage').emit(s, { t: 'WaterChanged', value: s.player.mana });
  if (over <= 0) return;
  s.log.push(`น้ำล้นขัน ${over}`);
  require('../combat/damage').emit(s, { t: 'WaterOverflow', amount: over });
  require('../combat/damage').gainBlock(s, 'player', over * WATER_RULES.overflowBlock);
  const dmg = over * passives(s).reduce((t, p) => t + (p.overflowDmg ?? 0), 0);
  if (dmg && s.enemy && s.enemy.hp > 0) {
    require('../combat/damage').dealDamage(s, { from: 'player', to: 'enemy', raw: dmg, source: { kind: 'equipment', equipmentId: 'overflow' } });
  }
}

/** สาด: spend all น้ำมนต์; returns how much. */
export function spendAllWater(s: GameState, cap = Infinity): number {
  const n = Math.min(Math.max(0, s.player.mana), cap);
  s.player.mana -= n;
  if (n) {
    s.log.push(`สาดน้ำมนต์ ${n}`);
    require('../combat/damage').emit(s, { t: 'WaterChanged', value: s.player.mana });
  }
  return n;
}

/** ของต่ำ: HP this card would cost now (missing water × bloodPerWater). 0 for other cards. */
export function bloodCost(s: GameState, card: CardData, water: number): number {
  if (!card.blood) return 0;
  return Math.max(0, water - s.player.mana) * WATER_RULES.bloodPerWater;
}

/** Per-stack effect × n as a plain effect. */
export function perStack(per: PerStackFx, n: number): Fx {
  const out: Fx = {};
  for (const k of ['dmg', 'block', 'heal', 'mana'] as const) if (per[k]) out[k] = per[k]! * n;
  if (per.sweep) out.sweep = true;
  return out;
}

export function yantOn(s: Partial<GameState>): number {
  return s.enemy?.statusEffects?.find(e => e.id === 'yant')?.stacks ?? 0;
}

/** ปลุกยันต์: remove every ยันต์ from the ghost; returns how many. */
export function consumeYant(s: GameState): number {
  const n = yantOn(s);
  if (!n || !s.enemy) return 0;
  s.enemy.statusEffects = (s.enemy.statusEffects ?? []).filter(e => e.id !== 'yant');
  s.log.push(`ปลุกยันต์ ${n}`);
  return n;
}

/**
 * The effect a shaman spell resolves with right now: สาด spends the bowl, ปลุกยันต์ eats the
 * ghost's ยันต์. Call once per play.
 */
export function waterFx(s: GameState, card: CardData, base: Fx): Fx {
  let fx: Fx = { ...base };
  const add = require('./mechanics').addFx;
  if (card.splash) {
    const n = spendAllWater(s, card.splashWaterCap ?? Infinity);
    fx = add(fx, perStack(card.splash, n));
    if (card.splash.sweep) fx.sweep = true;
  }
  if (card.wakeYant) {
    const n = consumeYant(s);
    fx = add(fx, perStack(card.wakeYant, n));
    if (card.wakeYant.sweep) fx.sweep = true;
  }
  return fx;
}

/** ยันต์ that reached the seal mark become ผนึก (after statuses are applied). */
export function checkSeal(s: GameState, rng: RNG): RNG {
  if (!s.enemy || s.enemy.hp <= 0) return rng;
  let guard = 0;
  while (yantOn(s) >= WATER_RULES.sealAt && guard++ < 3) {
    const e = s.enemy.statusEffects!.find(x => x.id === 'yant')!;
    e.stacks = (e.stacks ?? 0) - WATER_RULES.sealAt;
    if (e.stacks <= 0) s.enemy.statusEffects = s.enemy.statusEffects!.filter(x => x !== e);
    rng = sealGhost(s, rng);
  }
  return rng;
}

/** Index of the card ผนึก takes: the held card with the most charge, else the first. -1 if none. */
export function sealTarget(s: Partial<GameState>): number {
  const hand = s.enemyPiles?.hand ?? [];
  if (!hand.length) return -1;
  const GM = require('../combat/ghostMechanics');
  let best = 0, bestCharge = -1;
  hand.forEach((_, i) => { const c = GM.heldCharge(s, i); if (c > bestCharge) { best = i; bestCharge = c; } });
  return best;
}

/**
 * ผนึก: the ghost loses a held card without playing it (or is stunned when it holds none).
 * The shaman gains water and `seal` triggers fire.
 */
export function sealGhost(s: GameState, rng: RNG): RNG {
  if (!s.enemy || s.enemy.hp <= 0) return rng;
  const { emit } = require('../combat/damage');
  const i = sealTarget(s);
  if (i >= 0 && s.enemyPiles) {
    const id = s.enemyPiles.hand.splice(i, 1)[0];
    s.enemyHandAges?.splice(i, 1);
    s.enemyPiles.discard.push(id);
    const name = require('../pack_enemy_cards').enemyCardById(id)?.name ?? 'การ์ดผี';
    s.log.push(`ผนึก! ${name}`);
    emit(s, { t: 'GhostSealed', name });
    require('../combat/ghostMechanics').syncHandCharges(s);
    if (s.enemy) s.enemy.handCount = s.enemyPiles.hand.length;
  } else {
    s.log.push('ผนึก! ผีไม่ได้ถือการ์ด จึงมึนแทน');
    emit(s, { t: 'GhostSealed', name: 'มึน' });
    require('../statusEffectsRuntime').applyStatusEffect('enemy', s, 'stun', 2, 1);
  }
  gainWater(s, WATER_RULES.sealWater);
  return require('./passives').runTriggers(s, 'seal', rng);
}

/** สายสิญจน์: every card the ghost holds goes back to charge 0. */
export function unChargeGhost(s: GameState): void {
  if (!s.enemyHandAges?.length) return;
  const had = require('../combat/ghostMechanics').enemyHandCharges(s).some((n: number | null) => (n ?? 0) > 0);
  s.enemyHandAges = s.enemyHandAges.map(() => 0);
  require('../combat/ghostMechanics').syncHandCharges(s);
  if (had) { s.log.push('สายสิญจน์: แรงชาร์จของผีหายหมด'); require('../combat/damage').emit(s, { t: 'GhostUnCharged' }); }
}

/** The ghost holds a card that is charging (ชาร์จอย่างน้อย 1). */
export function ghostCharging(s: Partial<GameState>): boolean {
  return (require('../combat/ghostMechanics').enemyHandCharges(s) as Array<number | null>).some(n => (n ?? 0) > 0);
}
