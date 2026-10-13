// src/core/combat/enemyCardEffects.ts — a ghost card's effect, read from the ghost's side.
import type { Fx, GameState } from '../types';
import type { EnemyCardDef } from '../pack_enemy_cards';
import { dealDamage, gainBlock, heal } from './damage';
import { hasStatusEffect } from './status-effects';
import { curseById } from '../pack';
import { applyStatusEffect, clearAllStatusEffects } from '../statusEffectsRuntime';
import { addFx, conditionMet, hitsOf } from '../cards/mechanics';

/** Card numbers plus the conditional bonus when it applies to the ghost now. */
export function cardFx(s: GameState, card: EnemyCardDef): Fx {
  const c = card.conditional;
  return c && conditionMet(s, c.when, card, 'enemy') ? addFx(card.fx, c.bonus) : card.fx;
}

/** Apply effects owned by the ghost: `to: 'self'` lands on the ghost, `to: 'enemy'` on the player. */
export function applyEnemyFx(s: GameState, fx: Fx, sourceId: string): void {
  if (!s.enemy) return;
  if (fx.dmg) {
    for (let h = 0; h < hitsOf(fx) && s.player.hp > 0 && s.enemy.hp > 0; h++) {
      dealDamage(s, { from: 'enemy', to: 'player', raw: fx.dmg, source: { kind: 'card', cardId: sourceId } });
    }
  }
  if (s.enemy.hp <= 0 || s.player.hp <= 0) return;
  if (fx.block) gainBlock(s, 'enemy', fx.block);
  if (fx.heal) heal(s, 'enemy', fx.heal);
  if (fx.cleanse) clearAllStatusEffects('enemy', s, 'debuff');
  for (const e of fx.status ?? []) {
    applyStatusEffect(e.to === 'self' ? 'enemy' : 'player', s, e.id as any, e.turns, e.stacks, undefined, sourceId);
  }
}

/** Resolve one ghost card. An entangled ghost's attack does nothing. */
export function resolveEnemyCard(s: GameState, card: EnemyCardDef): void {
  if (!s.enemy || s.enemy.hp <= 0 || s.player.hp <= 0) return;
  if (card.type === 'attack' && hasStatusEffect('enemy', s, 'entangle')) {
    s.log.push(`${card.name} ถูกพันธนาการ`);
    return;
  }
  applyEnemyFx(s, cardFx(s, card), card.id);
  if (s.enemy.hp <= 0 || s.player.hp <= 0) return;
  if (card.curseCard) {
    const c = curseById(card.curseCard);
    if (c) s.piles.discard.push(JSON.parse(JSON.stringify(c)));
  }
  s.log.push(`${s.enemy.name}: ${card.name}`);
}
