// src/core/combat/enemyCardEffects.ts — a ghost card's effect, read from the ghost's side.
import type { Fx, GameState } from '../types';
import type { EnemyCardDef } from '../pack_enemy_cards';
import { computeModifiedDamage, dealDamage, gainBlock, heal } from './damage';
import { hasStatusEffect } from './status-effects';
import { curseById } from '../pack';
import { applyStatusEffect, clearAllStatusEffects } from '../statusEffectsRuntime';
import { addFx, conditionMet, hitsOf } from '../cards/mechanics';

/**
 * Card numbers right now: the conditional bonus when it applies, ซ้ำแผล per status stack on the
 * player, and `charge` steps for the turns the card has waited in hand (ghostMechanics.ts).
 */
export function cardFx(s: GameState, card: EnemyCardDef, charge = 0): Fx {
  const c = card.conditional;
  let fx = c && conditionMet(s, c.when, card, 'enemy') ? addFx(card.fx, c.bonus) : card.fx;
  const per = card.perFoeStatus;
  if (per) {
    // A status that does not stack (เปราะบาง) counts as one.
    const e = s.player?.statusEffects?.find(x => x.id === per.statusId);
    const n = e ? e.stacks ?? 1 : 0;
    if (n > 0) fx = addFx(fx, { dmg: n * per.dmg });
  }
  if (charge > 0 && card.charge) fx = addFx(fx, require('./ghostMechanics').chargeFx(card, charge));
  return fx;
}

/** Apply effects owned by the ghost: `to: 'self'` lands on the ghost, `to: 'enemy'` on the player. */
export function applyEnemyFx(s: GameState, fx: Fx, sourceId: string): void {
  if (!s.enemy) return;
  if (fx.dmg) {
    const minions = require('./minions');
    // นักมวยรุ่นพี่: takes the ghost's first attack card each ghost turn instead of the player.
    // Not a minion's act and not the ghost's สวน (that lands during the player's own turn).
    const guard = sourceId.startsWith('minion:') || sourceId.startsWith('riposte:') ? undefined : minions.guardFor(s);
    const hpBefore = s.player.hp;
    if (guard && s.fight) { s.fight.guardTurn = s.fight.ghostTurns; s.log.push(`${guard.name} รับแทน`); }
    for (let h = 0; h < hitsOf(fx) && s.player.hp > 0 && s.enemy.hp > 0; h++) {
      if (guard && guard.hp > 0) {
        minions.damageMinion(s, guard, computeModifiedDamage(s, { from: 'enemy', to: 'player', raw: fx.dmg, source: { kind: 'card', cardId: sourceId } }));
      } else dealDamage(s, { from: 'enemy', to: 'player', raw: fx.dmg, source: { kind: 'card', cardId: sourceId } });
      if (fx.sweep) for (const m of [...(s.minions ?? [])]) minions.damageMinion(s, m, computeModifiedDamage(s, { from: 'enemy', to: 'player', raw: fx.dmg, source: { kind: 'card', cardId: sourceId } }));
    }
    // ดูดเลือด: heal by what got through the player's block.
    if (fx.drain && s.enemy.hp > 0 && s.player.hp < hpBefore) heal(s, 'enemy', hpBefore - s.player.hp);
  }
  if (fx.summon && s.enemy.hp > 0) require('./minions').summonMinion(s, 'enemy', fx.summon);
  if (s.enemy.hp <= 0 || s.player.hp <= 0) return;
  if (fx.block) gainBlock(s, 'enemy', fx.block);
  if (fx.heal) heal(s, 'enemy', fx.heal);
  if (fx.cleanse) clearAllStatusEffects('enemy', s, 'debuff');
  for (const e of fx.status ?? []) {
    applyStatusEffect(e.to === 'self' ? 'enemy' : 'player', s, e.id as any, e.turns, e.stacks, undefined, sourceId);
  }
}

/**
 * Resolve one ghost card. An entangled ghost's attack does nothing. `charge` is the number of
 * turns the card waited in hand (read before the card left the hand). A card with `riposte`
 * arms the ghost's สวน after its own effect.
 */
export function resolveEnemyCard(s: GameState, card: EnemyCardDef, charge = 0): void {
  if (!s.enemy || s.enemy.hp <= 0 || s.player.hp <= 0) return;
  if (card.type === 'attack' && hasStatusEffect('enemy', s, 'entangle')) {
    s.log.push(`${card.name} ถูกพันธนาการ`);
    return;
  }
  if (charge > 0) s.log.push(`${card.name}: ชาร์จ ${charge}`);
  applyEnemyFx(s, cardFx(s, card, charge), card.id);
  if (s.enemy.hp <= 0 || s.player.hp <= 0) return;
  if (card.riposte) require('./ghostMechanics').armGhostRiposte(s, card.riposte);
  if (card.curseCard) {
    const c = curseById(card.curseCard);
    if (c) s.piles.discard.push(JSON.parse(JSON.stringify(c)));
  }
  s.log.push(`${s.enemy.name}: ${card.name}`);
}
