import type { EnemyIntent, GameState } from '../types';
import { enemyCardById } from '../pack_enemy_cards';
import { computeModifiedDamage } from './damage';
import {chooseEnemyCardIndexes} from './enemyPlan';
import { cardFx } from './enemyCardEffects';
import { hitsOf } from '../cards/mechanics';

/** Hidden in-turn decision only. Old preparation calls neither draw nor publish future cards. */
export function planEnemyIntent(s: GameState,duringEnemyTurn=false): void {
  if(!duringEnemyTurn){s.enemyIntent=undefined;return;}
  const piles = (s as any).enemyPiles as
    | { draw: string[]; hand: string[]; discard: string[] }
    | undefined;

  if (!s.enemy || !piles) {
    s.enemyIntent = undefined;
    return;
  }

  // จั่วมือของเทิร์นหน้าไว้เลย เพื่อให้รู้ว่าจะเล่นอะไรได้บ้าง
  const { enemyDrawUpToHand } = require('../engine/handlers/enemy');
  enemyDrawUpToHand(s);

  const cardIds: string[] = [];
  let damage = 0;
  let block = 0;

  const handIndexes = chooseEnemyCardIndexes(s, piles.hand, s.enemy.ap ?? 0);
  for (const id of handIndexes.map(i => piles.hand[i])) {
    const def = enemyCardById(id);
    if (!def) continue;
    cardIds.push(id);
    const f = cardFx(s, def);
    // Same formula as the real hit, so the shown number is what lands.
    if (f.dmg) damage += hitsOf(f) * computeModifiedDamage(s, { from: 'enemy', to: 'player', raw: f.dmg, source: { kind: 'card', cardId: def.id } });
    if (f.block) block += f.block;
  }

  s.enemyIntent = {
    cardIds,
    handIndexes,
    damage,
    block,
    kind:
      cardIds.length === 0 ? 'wait'
      : damage > 0 && block > 0 ? 'mixed'
      : damage > 0 ? 'attack'
      : block > 0 ? 'defend'
      : 'wait',
  };
}

/** Refresh numeric hints after debuffs without changing committed cards. */
export function refreshIntentEstimate(s: GameState): void {
  if (!s.enemyIntent) return;
  s.enemyIntent.damage = s.enemyIntent.cardIds.reduce((sum, id) => {
    const c = enemyCardById(id);
    const f = c ? cardFx(s, c) : {};
    return sum + (f.dmg ? hitsOf(f) * computeModifiedDamage(s, { from: 'enemy', to: 'player', raw: f.dmg, source: { kind: 'card', cardId: id } }) : 0);
  }, 0);
}
