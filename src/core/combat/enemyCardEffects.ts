import type { GameState } from '../types';
import type { EnemyCardDef } from '../pack_enemy_cards';
import { dealDamage, gainBlock, heal } from './damage';
import {hasStatusEffect} from '../combat/status-effects';
import {summonMinion} from '../minionRuntime';
import {curseById} from '../pack';
import { applyStatusEffect } from '../statusEffectsRuntime';

/** Both enemy entry points resolve the same real effects, including each hit. */
export function resolveEnemyCard(s: GameState, card: EnemyCardDef): void {
  if (!s.enemy || s.player.hp <= 0) return;
  if(card.type==='attack'&&hasStatusEffect('enemy',s,'entangle')){s.log.push(`${card.name} ถูกพันธนาการ`);return;}
  for (let hit = 0; hit < Math.max(1, card.hits ?? 1) && s.player.hp > 0; hit++) {
    if (card.dmg) dealDamage(s, { from: 'enemy', to: 'player', raw: card.dmg, source: { kind: 'card', cardId: card.id } });
  }
  if(card.summonMinion)summonMinion(s,card.summonMinion,'enemy');
  if(card.curseCard){const c=curseById(card.curseCard);if(c)s.piles.discard.push(JSON.parse(JSON.stringify(c)));}
  if (card.block) gainBlock(s, 'enemy', card.block);
  if (card.heal) heal(s, 'enemy', card.heal);
  if (card.statusEffect && s.player.hp > 0) {
    const effect = card.statusEffect;
    applyStatusEffect(effect.target, s, effect.effect, effect.duration, effect.value, undefined, card.id);
  }
  s.log.push(`${s.enemy.name}: ${card.name ?? card.id} · ${card.desc ?? ''}`);
}
