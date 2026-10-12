import type { GameState } from '../types';
import type { EnemyCardDef } from '../pack_enemy_cards';
import { dealDamage, gainBlock, heal } from './damage';
import {hasStatusEffect} from '../combat/status-effects';
import {summonMinion} from '../minionRuntime';
import {curseById} from '../pack';
import { applyStatusEffect } from '../statusEffectsRuntime';

export function enemyConditionalDamage(s:GameState,card:EnemyCardDef):number {
 const c=card.conditional;if(!c)return 0;
 const active=c.kind==='player_poison'?hasStatusEffect('player',s,'poison'):
  c.kind==='player_vulnerable'?hasStatusEffect('player',s,'vulnerable'):
  c.kind==='enemy_block'?(s.enemy?.block??0)>0:(s.minions??[]).some(m=>m.owner==='enemy');
 return active?c.bonusDamage:0;
}

/** Both enemy entry points resolve the same real effects, including each hit. */
export function resolveEnemyCard(s: GameState, card: EnemyCardDef): void {
  if (!s.enemy || s.enemy.hp<=0 || s.player.hp <= 0) return;
  if(card.type==='attack'&&hasStatusEffect('enemy',s,'entangle')){s.log.push(`${card.name} ถูกพันธนาการ`);return;}
  const raw=(card.dmg??0)+enemyConditionalDamage(s,card);
  for (let hit = 0; hit < Math.max(1, card.hits ?? 1) && s.player.hp > 0 && s.enemy.hp>0; hit++) {
    if (raw) dealDamage(s, { from: 'enemy', to: 'player', raw, source: { kind: 'card', cardId: card.id } });
  }
  if(s.enemy.hp<=0||s.player.hp<=0)return;
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
