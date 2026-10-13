// src/core/cards/fx.ts — resolve an effect set for the player.
// Cards, counters, prayers, blessings and equipment all go through this one function.
import type { CardData, CardType, Fx, GameState } from '../types';
import type { RNG } from '../rng';
import { dealDamage, gainBlock, heal } from '../combat/damage';
import { applyStatusEffect, clearAllStatusEffects } from '../statusEffectsRuntime';
import { hitsOf } from './mechanics';

export type FxContext = {
  sourceId: string;
  /** Card type, so attack bonuses apply only to attacks. */
  type?: CardType;
  /** Prayer multiplier. */
  mult?: number;
};

export function scaleFx(fx: Fx, mult: number): Fx {
  if (mult === 1) return fx;
  const m = (n?: number) => (n == null ? n : Math.round(n * mult));
  return { ...fx, dmg: m(fx.dmg), block: m(fx.block), heal: m(fx.heal), draw: m(fx.draw), mana: m(fx.mana),
    status: fx.status?.map(e => ({ ...e, stacks: Math.round(e.stacks * mult) })) };
}

/** Draws from the draw pile (reshuffling the discard), stopping at the hand limit. */
export function drawCards(s: GameState, rng: RNG, n: number): RNG {
  const { shuffle } = require('../rng');
  const cap = s.player.handMax;
  for (let i = 0; i < n && s.piles.hand.length < cap; i++) {
    if (!s.piles.draw.length) {
      if (!s.piles.discard.length) break;
      const out = shuffle(rng, s.piles.discard);
      rng = out.rng; s.piles.draw = out.array; s.piles.discard = [];
    }
    const c = s.piles.draw.shift();
    if (c) s.piles.hand.push(c);
  }
  return rng;
}

/** Apply `fx` from the player. Returns the advanced RNG (draws reshuffle). */
export function applyFx(s: GameState, fx: Fx, ctx: FxContext, rng: RNG): RNG {
  const eff = scaleFx(fx, ctx.mult ?? 1);
  if (eff.dmg && s.enemy) {
    const bonus = ctx.type === 'attack' ? require('./passives').attackBonus(s) : 0;
    for (let h = 0; h < hitsOf(eff); h++) {
      if (!s.enemy || s.enemy.hp <= 0) break;
      dealDamage(s, { from: 'player', to: 'enemy', raw: eff.dmg + bonus, source: { kind: 'card', cardId: ctx.sourceId } });
    }
  }
  if (eff.block) gainBlock(s, 'player', eff.block);
  if (eff.heal) heal(s, 'player', eff.heal);
  if (eff.mana) s.player.mana += eff.mana;
  if (eff.ap) s.player.ap += eff.ap;
  if (eff.cleanse) clearAllStatusEffects('player', s, 'debuff');
  for (const e of eff.status ?? []) {
    const target = e.to === 'self' ? 'player' : 'enemy';
    if (target === 'enemy' && !s.enemy) continue;
    applyStatusEffect(target, s, e.id, e.turns, e.stacks);
  }
  if (eff.borrow) require('./borrow').borrowEnemyCards(s, eff.borrow);
  if (eff.draw) rng = drawCards(s, rng, fxDrawAllowance(s, eff.draw));
  return rng;
}

/**
 * Effect draws left this player turn (CARD_RULES.fxDrawPerTurn). Counts what was asked for,
 * so a draw that finds an empty pile still uses the allowance. Outside a fight: no limit.
 */
export function fxDrawAllowance(s: GameState, want: number): number {
  const f = s.fight;
  if (!f) return want;
  const turn = s.turn ?? 1;
  if (f.fxDrawTurn !== turn) { f.fxDrawTurn = turn; f.fxDrawn = 0; }
  const { CARD_RULES } = require('../balance/notfm');
  const n = Math.max(0, Math.min(want, CARD_RULES.fxDrawPerTurn - (f.fxDrawn ?? 0)));
  f.fxDrawn = (f.fxDrawn ?? 0) + n;
  if (n < want) s.log.push(`จั่วจากการ์ดเต็มแล้วเทิร์นนี้ (สูงสุด ${CARD_RULES.fxDrawPerTurn})`);
  return n;
}
