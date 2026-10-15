// src/core/cards/fighter.ts — นักมวยคาดเชือก: ท่า, จังหวะ, ต่อจาก, ช้ำ/ท่าหนัก, สวน, ยก.
//
// Design and reasons: docs/nak-muay/DESIGN.md. Numbers: FIGHTER_RULES (balance/notfm.ts).
//
// - ท่า (move): every นักมวย attack card is one of หมัด/เตะ/เข่า/ศอก.
// - จังหวะ (rhythm): an attack whose move differs from the previous attack card (this turn or
//   an earlier one) gains rhythm; each stack adds damage to every hit of attack cards.
//   A turn that ends with no attack card loses it all, unless something keeps it.
// - ต่อจาก[ท่า]: a bonus when the card played just before, this turn, was that move.
// - ช้ำ (bruise) sits on the ghost and never fades; ท่าหนัก (heavy) eats all of it.
// - สวน (riposte): armed by a card, fires when the ghost's next attack card leaves our HP whole.
// - ยก (round): 3 player turns; `roundEnd` triggers fire at the end of the last one.
import type { CardData, Fx, GameState, Move, Passive } from '../types';
import type { RNG } from '../rng';
import { CLASS_PASSIVES, FIGHTER_RULES } from '../balance/notfm';

export const MOVE_NAMES: Record<Move, string> = { punch: 'หมัด', kick: 'เตะ', knee: 'เข่า', elbow: 'ศอก' };

/** Whether this class builds rhythm (the นักมวย passive). */
export function usesRhythm(s: Partial<GameState>): boolean {
  return !!(s.classId && CLASS_PASSIVES[s.classId]?.rhythm);
}

export function rhythmOf(s: Partial<GameState>): number {
  return s.fight?.rhythm ?? 0;
}

/** Passives currently in play: class, blessings, equipment, our minions. */
function passives(s: GameState): Passive[] {
  return require('./passives').passiveSources(s).map((x: { passive: Passive }) => x.passive);
}

/** Sum of a numeric passive field over everything in play. */
function sumOf(s: GameState, pick: (p: Passive) => number | undefined): number {
  return passives(s).reduce((n, p) => n + (pick(p) ?? 0), 0);
}

/** Gain rhythm (capped). Fires `rhythm` triggers once per gain that actually raised it. */
export function gainRhythm(s: GameState, n: number, rng: RNG): RNG {
  if (!s.fight || n <= 0) return rng;
  const before = s.fight.rhythm ?? 0;
  const after = Math.min(FIGHTER_RULES.rhythmMax, before + n);
  if (after === before) return rng;
  s.fight.rhythm = after;
  s.log.push(`จังหวะ ${after}`);
  require('../combat/damage').emit(s, { t: 'RhythmChanged', value: after });
  return require('./passives').runTriggers(s, 'rhythm', rng);
}

/** Spend every stack of rhythm; returns how many were spent. */
export function spendAllRhythm(s: GameState): number {
  const n = rhythmOf(s);
  if (s.fight) s.fight.rhythm = 0;
  if (n) s.log.push(`ใช้จังหวะ ${n}`);
  return n;
}

/** Flat damage added to each hit of an attack card from rhythm and move bonuses. */
export function fighterAttackBonus(s: GameState, move?: Move): number {
  const rhythm = rhythmOf(s) * FIGHTER_RULES.dmgPerStack;
  const byMove = move ? sumOf(s, p => p.moveBonus?.[move]) : 0;
  return rhythm + byMove;
}

/** Damage per ช้ำ when a heavy move consumes it (best source wins). */
export function heavyPerBruise(s: GameState): number {
  return Math.max(FIGHTER_RULES.heavyPerBruise, ...passives(s).map(p => p.heavyPerBruise ?? 0));
}

export function bruiseOn(s: GameState): number {
  return s.enemy?.statusEffects?.find(e => e.id === 'bruise')?.stacks ?? 0;
}

/** ท่าหนัก: remove every ช้ำ and return the damage it adds to the first hit. */
export function consumeBruise(s: GameState): number {
  const n = bruiseOn(s);
  if (!n || !s.enemy) return 0;
  s.enemy.statusEffects = (s.enemy.statusEffects ?? []).filter(e => e.id !== 'bruise');
  const dmg = n * heavyPerBruise(s);
  s.log.push(`ท่าหนัก: ช้ำ ${n} → +${dmg}`);
  require('../combat/damage').emit(s, { t: 'HeavyHit', bonus: dmg });
  return dmg;
}

/**
 * The effect an attack card resolves with right now: ต่อจาก bonus and rhythm spending.
 * Call once per play (it spends rhythm). Rhythm gained by this card is applied first.
 */
export function attackFx(s: GameState, card: CardData, base: Fx): Fx {
  let fx: Fx = { ...base };
  if (card.after && s.turnFlags?.lastMove === card.after.move) {
    fx = require('./mechanics').addFx(fx, card.after.bonus);
    s.log.push(`ต่อจาก${MOVE_NAMES[card.after.move]}`);
  }
  if (card.spendRhythm) {
    const n = spendAllRhythm(s);
    if (card.spendRhythm.mode === 'hits') fx.hits = Math.max(1, n);
    else fx.dmg = (fx.dmg ?? 0) + n * (card.spendRhythm.perStack ?? 0);
  }
  return fx;
}

/**
 * Before an attack card resolves: a new move gains rhythm. Updates the move bookkeeping
 * that the end-of-turn rule and conditions read.
 */
export function onAttackStart(s: GameState, card: CardData, rng: RNG): RNG {
  const f = s.turnFlags;
  f.attacks = (f.attacks ?? 0) + 1;
  if (card.move && !(f.moves ?? []).includes(card.move)) f.moves = [...(f.moves ?? []), card.move];
  if (!s.fight || !card.move) return rng;
  const prev = s.fight.lastAttackMove;
  s.fight.lastAttackMove = card.move;
  if (usesRhythm(s) && prev && prev !== card.move) rng = gainRhythm(s, FIGHTER_RULES.perNewMove, rng);
  return rng;
}

/** After an attack card resolved: equipment that marks the ghost per move (เชือกคาดเศษแก้ว). */
export function onAttackEnd(s: GameState, card: CardData): void {
  if (!card.move || !s.enemy || s.enemy.hp <= 0) return;
  const extra = sumOf(s, p => p.moveBruise?.[card.move!]);
  if (extra > 0) require('../statusEffectsRuntime').applyStatusEffect('enemy', s, 'bruise', 99, extra);
}

/** Every card played: remember its move for ต่อจาก (cards without a move break the chain). */
export function rememberMove(s: GameState, card: CardData): void {
  s.turnFlags.lastMove = card.move ?? null;
}

/** ครูมวยเฒ่า: fraction of the first attack each turn that resolves again, or 0. */
export function echoFraction(s: GameState): number {
  if (s.turnFlags.echoed) return 0;
  return Math.max(0, ...(s.minions ?? []).filter(m => m.hp > 0).map(m => m.passive.echoFirstAttack ?? 0));
}

/** End of the player turn: lose rhythm on a turn with no attack, unless it is kept. */
export function endTurnRhythm(s: GameState): void {
  if (!s.fight?.rhythm) return;
  const kept = (s.turnFlags.attacks ?? 0) > 0 || s.turnFlags.keepRhythm || s.fight.rhythmLocked
    || (s.minions ?? []).some(m => m.hp > 0 && m.passive.keepsRhythm);
  if (kept) return;
  s.log.push(`ไม่ได้ออกอาวุธ จังหวะ ${s.fight.rhythm} หายหมด`);
  s.fight.rhythm = 0;
  require('../combat/damage').emit(s, { t: 'RhythmChanged', value: 0 });
}

/** Round (ยก) of a player turn number, starting at 1. */
export function roundOf(turn: number): number {
  return Math.max(1, Math.ceil(Math.max(1, turn) / FIGHTER_RULES.roundTurns));
}

/** This player turn is the last one of its round (พักยก comes after it). */
export function isRoundLastTurn(s: Partial<GameState>): boolean {
  return (s.turn ?? 1) % FIGHTER_RULES.roundTurns === 0;
}

/** สวน: arm a riposte until the ghost's next attack card. */
export function armRiposte(s: GameState, fx: Fx): void {
  if (!s.fight) return;
  (s.fight.ripostes ??= []).push(fx);
  s.log.push('ตั้งการ์ดรอสวน');
}

/**
 * After a ghost attack card resolved. Armed ripostes fire if the player lost no HP to it,
 * and are used up either way (they wait for one card only).
 */
export function resolveRipostes(s: GameState, hpBefore: number, hadDamage: boolean, rng: RNG): RNG {
  const list = s.fight?.ripostes ?? [];
  if (!list.length || !s.fight) return rng;
  s.fight.ripostes = [];
  if (!hadDamage || s.player.hp < hpBefore || !s.enemy || s.enemy.hp <= 0) {
    if (hadDamage) s.log.push('สวนไม่ทัน');
    return rng;
  }
  const bonus = sumOf(s, p => p.riposteBonus);
  const { applyFx } = require('./fx');
  for (const fx of list) {
    if (!s.enemy || s.enemy.hp <= 0) break;
    s.log.push('สวน!');
    require('../combat/damage').emit(s, { t: 'Riposte' });
    rng = applyFx(s, fx.dmg ? { ...fx, dmg: fx.dmg + bonus } : fx, { sourceId: 'riposte' }, rng);
  }
  return rng;
}

/** Equipment with charges: use one; a worn-out piece leaves play (เสื่อม). */
export function useCharge(s: GameState, card: CardData): void {
  card.chargesLeft = (card.chargesLeft ?? card.charges ?? 1) - 1;
  if (card.chargesLeft > 0) return;
  s.equipped = (s.equipped ?? []).filter(c => c !== card);
  s.piles.exhaust.push(card);
  s.log.push(`${card.name} เสื่อมแล้ว`);
}

/** Equipped card whose passive has `key` and still has a charge. */
export function chargedEquipment(s: GameState, key: 'damageCap' | 'deathSave'): CardData | undefined {
  return (s.equipped ?? []).find(c => c.equip?.[key] && (c.chargesLeft ?? c.charges ?? 1) > 0);
}

/** ติดมือ: move innate cards to the top of the draw pile before the opening draw. */
export function liftInnate(s: GameState): void {
  const innate = s.piles.draw.filter(c => c.innate);
  if (!innate.length) return;
  s.piles.draw = [...innate, ...s.piles.draw.filter(c => !c.innate)];
}

/**
 * Hand hint for one card, read by the card face (MoveMark): `rhythm` — playing it now is a new
 * move and gains จังหวะ; `after` — its ต่อจาก bonus is live right now. Pure; spends nothing.
 */
export function moveHint(s: Partial<GameState>, card: CardData): { rhythm: boolean; after: boolean; round?: boolean; stack?: number } {
  const last = s.fight?.lastAttackMove;
  const rhythm = !!(card.move && usesRhythm(s) && last && last !== card.move && rhythmOf(s) < FIGHTER_RULES.rhythmMax);
  const after = !!(card.after && s.turnFlags?.lastMove === card.after.move);
  // ยก: the card's bonus is live on the last turn of a round (owner playtest: say when ยก matters).
  const round = roundCard(card) ? isRoundLastTurn(s) : undefined;
  // หมอผี: สาด / ปลุกยันต์ show how many points they would use right now (×N on the card).
  const stack = card.splash ? Math.max(0, (s.player?.mana ?? 0) - (card.mana ?? 0)) : card.wakeYant ? require('./water').yantOn(s) : undefined;
  return { rhythm, after, ...(round != null ? { round } : {}), ...(stack != null ? { stack } : {}) };
}

/** The card has a bonus on the last turn of a ยก (เทิร์นสุดท้ายของยก). */
export function roundCard(card: Partial<CardData>): boolean {
  const uses = (c?: { kind: string }) => c?.kind === 'round_last_turn';
  return uses(card.conditional?.when) || uses(card.repeatIf as { kind: string } | undefined);
}

/**
 * What ยก does for this player right now (round badge text): which cards in the deck and which
 * ศิษย์ค่าย get something on the last turn of a round / at พักยก. Owner playtest 15 Oct 2026:
 * "ยก — I don't know what it is for".
 */
export function roundBeneficiaries(s: GameState): string[] {
  const deck = [...(s.piles?.draw ?? []), ...(s.piles?.hand ?? []), ...(s.piles?.discard ?? [])];
  const names = [...new Set(deck.filter(roundCard).map(c => c.name))];
  const minions = (s.minions ?? []).filter(m => m.hp > 0 && m.passive.triggers.some(t => t.on === 'roundEnd')).map(m => `${m.name} (พักยก)`);
  const passives = (require('./passives').passiveSources(s) as Array<{ name?: string; passive: Passive }>)
    .filter(x => x.passive.triggers?.some(t => t.on === 'roundEnd') && !(s.minions ?? []).some(m => m.passive === x.passive))
    .map(x => `${x.name ?? 'พร'} (พักยก)`);
  return [...names, ...minions, ...passives];
}
