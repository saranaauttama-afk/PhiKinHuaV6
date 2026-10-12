import type { EnemyIntent, GameState } from '../types';
import { enemyCardById } from '../pack_enemy_cards';
import { computeModifiedDamage } from './damage';
import {chooseEnemyCardIndexes} from './enemyPlan';

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

  let energy = s.enemyEnergy ?? s.enemy.maxEnergy ?? 2;
  const cardIds: string[] = [];
  let damage = 0;
  let block = 0;

  const handIndexes=chooseEnemyCardIndexes(s,piles.hand,s.enemyEnergy??energy);
  const chosen=handIndexes.map(i=>piles.hand[i]);
  for (const id of chosen) {
    const def = enemyCardById(id);
    if (!def) continue;

    const cost = typeof def.energyCost === 'number' ? def.energyCost : 1;
    if (cost > energy) continue;
    energy -= cost;
    cardIds.push(id);

    if (def.type === 'attack' && (def.dmg ?? 0) > 0) {
      // ใช้สูตรเดียวกับดาเมจจริง ไม่งั้นเลขที่โชว์จะไม่ตรงกับที่โดน
      damage += (def.hits ?? 1) * computeModifiedDamage(s, {
        from: 'enemy',
        to: 'player',
        raw: def.dmg!,
        source: { kind: 'card', cardId: def.id },
      });
    }
    if ((def.block ?? 0) > 0) block += def.block!;
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
    return sum + (c?.type === 'attack' && c.dmg ? (c.hits ?? 1) * computeModifiedDamage(s, {
      from: 'enemy', to: 'player', raw: c.dmg, source: { kind: 'card', cardId: id },
    }) : 0);
  }, 0);
}
