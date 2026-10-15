// src/core/combat/ghostMechanics.ts — night-1 ghost mechanics (docs/ghosts/NIGHT1-DESIGN.md).
//
// Owner agreed 15 Oct 2026: ghosts use the player's mechanics, simplified, so a player who learned
// สวน / ลูกสมุน / มึน from นักมวย reads a ghost at once (and the other way round).
//
// - ชาร์จ (charge): a ghost card with `charge` grows for every ghost turn it waits in hand, up to
//   GHOST_MECHANICS.chargeMaxTurns. The count is public (shown on the card back); when it lands is not.
// - สวนของผี: a ghost card with `riposte` arms it. If the player's next attack card leaves the
//   ghost's HP untouched (block or หลบ ate it), the ghost hits back. Used up either way; gone at the
//   start of the ghost's next turn. Mirror of fighter.ts resolveRipostes.
// - มึนฝั่งเรา: stun on the player costs AP at the start of the next player turn.
// - Phase 2: a ghost rule with `phase2` swaps the deck once HP drops to `belowPct`.
import type { Fx, GameState } from '../types';
import type { RNG } from '../rng';
import { enemyCardById, type EnemyCardDef } from '../pack_enemy_cards';
import { GHOST_MECHANICS } from '../balance/notfm';
import { emit } from './damage';

// ── ชาร์จ ─────────────────────────────────────────────────────────────

/** Charge steps of a held card: ghost turns waited, capped. 0 for a card without `charge`. */
export function chargeSteps(card: EnemyCardDef | undefined, age: number | undefined): number {
  if (!card?.charge) return 0;
  return Math.max(0, Math.min(GHOST_MECHANICS.chargeMaxTurns, Math.floor(age ?? 0)));
}

/** Charge steps of the card at `index` in the ghost's hand. */
export function heldCharge(s: GameState, index: number): number {
  const id = s.enemyPiles?.hand[index];
  return chargeSteps(id ? enemyCardById(id) : undefined, s.enemyHandAges?.[index]);
}

/** A charge card at full charge. */
export function chargeFull(card: EnemyCardDef | undefined, age: number | undefined): boolean {
  return !!card?.charge && chargeSteps(card, age) >= GHOST_MECHANICS.chargeMaxTurns;
}

/** `charge` × steps, as an effect to add on top of the card. */
export function chargeFx(card: EnemyCardDef, steps: number): Fx {
  const c = card.charge;
  if (!c || steps <= 0) return {};
  const out: Fx = {};
  for (const k of ['dmg', 'block', 'heal'] as const) if (c[k]) out[k] = c[k]! * steps;
  return out;
}

/**
 * Face-down slots of the ghost's hand for the UI: the charge count of each held charge card,
 * or null. The player sees that something is charging and how far, not what it is.
 */
export function enemyHandCharges(s: Partial<GameState>): Array<number | null> {
  const hand = s.enemyPiles?.hand ?? [];
  return hand.map((id, i) => {
    const c = enemyCardById(id);
    return c?.charge ? chargeSteps(c, s.enemyHandAges?.[i]) : null;
  });
}

/**
 * Keep `enemy.handCharges` in step with the hand. It lives on the ghost's state (not only in the
 * piles) so every animation frame of the ghost turn carries it: reading the final state instead
 * made the numbers vanish while cards were drawn and played (owner playtest, 15 Oct 2026).
 */
export function syncHandCharges(s: Partial<GameState>): void {
  if (!s.enemy) return;
  const c = enemyHandCharges(s);
  s.enemy.handCharges = c.some(x => x != null) ? c : undefined;
}

/** Turns until a held charge card is full (0 = full: it can land any time). */
export function chargeCountdown(steps: number): number {
  return Math.max(0, GHOST_MECHANICS.chargeMaxTurns - steps);
}

// ── สวนของผี ─────────────────────────────────────────────────────────

/** A ghost card with `riposte` arms it until the player's next attack card. */
export function armGhostRiposte(s: GameState, fx: Fx): void {
  if (!s.fight) return;
  (s.fight.enemyRipostes ??= []).push(fx);
  s.log.push(`${s.enemy?.name ?? 'ผี'} ตั้งการ์ดรอสวน`);
  emit(s, { t: 'GhostGuard' });
}

export function ghostRiposteArmed(s: Partial<GameState>): boolean {
  return !!s.fight?.enemyRipostes?.length;
}

/**
 * HP of the ghost's whole side (ghost + ลูกสมุน). The ghost's สวน only answers a card its own
 * block or หลบ swallowed: a hit a ลูกสมุน took for it still hurt the ghost's side.
 */
export function ghostSideHp(s: Partial<GameState>): number {
  return (s.enemy?.hp ?? 0) + (s.enemyMinions ?? []).reduce((n, m) => n + Math.max(0, m.hp), 0);
}

/** Start of the ghost's turn: an unanswered riposte waited one player turn and is gone. */
export function clearGhostRipostes(s: GameState): void {
  if (s.fight) s.fight.enemyRipostes = [];
}

/**
 * After the player's attack card resolved. The ghost's armed ripostes fire if the ghost's side
 * lost no HP to the card (`sideHpBefore` from ghostSideHp), and are used up either way.
 */
export function resolveGhostRipostes(s: GameState, sideHpBefore: number): void {
  const list = s.fight?.enemyRipostes ?? [];
  if (!list.length || !s.fight || !s.enemy) return;
  s.fight.enemyRipostes = [];
  if (s.enemy.hp <= 0 || s.player.hp <= 0) return;
  if (ghostSideHp(s) < sideHpBefore) { s.log.push('ผีสวนไม่ทัน'); return; }
  const { applyEnemyFx } = require('./enemyCardEffects');
  for (const fx of list) {
    if (s.enemy.hp <= 0 || s.player.hp <= 0) break;
    s.log.push(`${s.enemy.name} สวน!`);
    emit(s, { t: 'GhostRiposte' });
    applyEnemyFx(s, fx, 'riposte:' + s.enemy.id);
  }
}

// ── มึนฝั่งเรา ─────────────────────────────────────────────────────────

/** Start of a player turn, after AP refills: stun costs AP once, then it is gone. */
export function applyPlayerStun(s: GameState): void {
  const list = s.player.statusEffects ?? [];
  if (!list.some(e => e.id === 'stun')) return;
  s.player.statusEffects = list.filter(e => e.id !== 'stun');
  const lost = Math.min(s.player.ap, GHOST_MECHANICS.stunApLoss);
  s.player.ap -= lost;
  s.log.push(`มึน: แต้มเทิร์นนี้ −${lost}`);
  emit(s, { t: 'PlayerStunned', apLost: lost });
}

// ── ช่วง 2 ของบอส ────────────────────────────────────────────────────

/**
 * Start of a ghost turn: a ghost whose rule has `phase2` and whose HP is at or below
 * `belowPct` swaps to its second deck once. The hand and piles are rebuilt from the new deck
 * (no RNG: the order is the data order rotated by the turn, so a fight replays the same way).
 */
export function checkGhostPhase(s: GameState, _rng: RNG): void {
  if (!s.enemy || !s.fight || s.fight.ghostPhase2 || s.enemy.hp <= 0) return;
  const rule = require('../campaign/enemyRules').ghostRule(s.enemy.id);
  const p2 = rule?.phase2 as { belowPct: number; deck: string[]; text: string; breakRelic?: boolean } | undefined;
  if (!p2 || s.enemy.hp * 100 > s.enemy.maxHp * p2.belowPct) return;
  s.fight.ghostPhase2 = true;
  s.enemy.deck = [...p2.deck];
  const turn = s.fight.ghostTurns ?? 0, n = p2.deck.length;
  const draw = p2.deck.map((_, i) => p2.deck[(i + turn) % n]);
  s.enemyPiles = { draw, hand: [], discard: [] };
  s.enemyHandAges = [];
  s.enemy.handCount = 0;
  s.enemy.handCharges = undefined;
  if (p2.breakRelic && s.fight.relic && !s.fight.relic.broken) {
    const { chipBossRelic } = require('../campaign/bossRules');
    s.fight.relic.durability = 1;
    chipBossRelic(s);
  }
  s.log.push(`${s.enemy.name}: ${p2.text}`);
  emit(s, { t: 'GhostPhase', text: p2.text });
}
