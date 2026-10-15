// src/core/cards/fx.ts — resolve an effect set for the player.
// Cards, counters, prayers, blessings and equipment all go through this one function.
import type { CardData, CardType, Fx, GameState, Move } from '../types';
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
  /** นักมวย: move of the attack card (move bonuses). */
  move?: Move;
  /** Extra damage on the first hit only (ท่าหนัก). */
  firstHitBonus?: number;
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
  if (eff.breakBlock && s.enemy && s.enemy.block > 0) {
    const gone = Math.min(s.enemy.block, eff.breakBlock);
    s.enemy.block -= gone;
    s.log.push(`ทำลายเกราะผี ${gone}`);
  }
  if (eff.dmg && s.enemy) {
    const ghostHp = s.enemy.hp;
    const bonus = ctx.type === 'attack' ? require('./passives').attackBonus(s) + require('./fighter').fighterAttackBonus(s, ctx.move) : 0;
    const minions = require('../combat/minions');
    for (let h = 0; h < hitsOf(eff); h++) {
      if (!s.enemy || s.enemy.hp <= 0) break;
      const raw = eff.dmg + bonus + (h === 0 ? ctx.firstHitBonus ?? 0 : 0);
      // A taunting ghost minion takes single-target hits first; a sweep hits everyone.
      const taunt = eff.sweep ? undefined : minions.tauntTarget(s);
      if (taunt) minions.damageMinion(s, taunt, raw);
      else dealDamage(s, { from: 'player', to: 'enemy', raw, source: { kind: 'card', cardId: ctx.sourceId } });
      if (eff.sweep) for (const m of [...(s.enemyMinions ?? [])]) minions.damageMinion(s, m, raw);
    }
    // ดูดเลือด (a borrowed ghost card): heal by what got through the ghost's block.
    if (eff.drain && s.enemy && ghostHp > s.enemy.hp) heal(s, 'player', ghostHp - s.enemy.hp);
  }
  if (eff.block) gainBlock(s, 'player', eff.block);
  if (eff.heal) heal(s, 'player', eff.heal);
  if (eff.mana) s.player.mana += eff.mana;
  if (eff.ap) s.player.ap += eff.ap;
  if (eff.cleanse) clearAllStatusEffects('player', s, 'debuff');
  if (eff.cleanseOne) cleanseOneDebuff(s);
  for (const e of eff.status ?? []) {
    const target = e.to === 'self' ? 'player' : 'enemy';
    if (target === 'enemy' && !s.enemy) continue;
    applyStatusEffect(target, s, e.id, e.turns, e.stacks);
  }
  if (eff.borrow) require('./borrow').borrowEnemyCards(s, eff.borrow);
  if (eff.draw) rng = drawCards(s, rng, fxDrawAllowance(s, eff.draw));
  // นักมวยคาดเชือก (cards/fighter.ts).
  if (eff.keepRhythm) s.turnFlags.keepRhythm = true;
  if (eff.lockRhythm && s.fight) s.fight.rhythmLocked = true;
  if (eff.doubleNext) s.turnFlags.doubleNext = true;
  if (eff.rhythm) rng = require('./fighter').gainRhythm(s, eff.rhythm, rng);
  if (eff.summon && s.phase === 'combat') require('../combat/minions').summonMinion(s, 'player', eff.summon);
  return rng;
}

/** Remove the newest debuff on the player (พี่เลี้ยงมุมเวที). */
export function cleanseOneDebuff(s: GameState): void {
  const { STATUS_EFFECTS_REGISTRY } = require('../combat/status-effects/registry');
  const list = s.player.statusEffects ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    if (STATUS_EFFECTS_REGISTRY[list[i].id]?.tags?.includes('debuff')) {
      s.log.push(`ล้าง${list[i].name}`);
      s.player.statusEffects = list.filter((_, j) => j !== i);
      return;
    }
  }
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
