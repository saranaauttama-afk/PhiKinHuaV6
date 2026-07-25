// src/core/combat/intent.ts — ศัตรูตัดสินใจล่วงหน้าว่าเทิร์นหน้าจะทำอะไร
//
// เดิมศัตรูจั่วการ์ดตอนถึงเทิร์นตัวเองแล้วเปิดคว่ำทีละใบ ผู้เล่นจึงไม่มีทางรู้ว่า
// กำลังจะโดนอะไร → ตัดสินใจว่า "เทิร์นนี้ควรตีหรือควรตั้งการ์ด" ไม่ได้เลย
// กลายเป็นเกมเดา ไม่ใช่เกมวางแผน
//
// ตอนนี้ศัตรูเลือกไพ่ที่จะเล่นตั้งแต่จบเทิร์นก่อนหน้า เก็บไว้ใน state.enemyIntent
// แล้ว UI เอาไปแสดงระหว่างเทิร์นผู้เล่น พอถึงเทิร์นศัตรูก็เล่นตามนั้นเป๊ะ

import type { EnemyIntent, GameState } from '../types';
import { enemyCardById } from '../pack_enemy_cards';
import { computeModifiedDamage } from './damage';

/**
 * เลือกไพ่ที่ศัตรูจะเล่นเทิร์นหน้า จากมือที่จั่วไว้แล้ว โดยดูพลังงานที่มี
 * ไม่แตะ HP หรือ block ของใครทั้งนั้น — แค่วางแผน
 */
export function planEnemyIntent(s: GameState): void {
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

  let energy = s.enemy.maxEnergy ?? 2;
  const cardIds: string[] = [];
  let damage = 0;
  let block = 0;

  for (const id of piles.hand) {
    const def = enemyCardById(id);
    if (!def) continue;

    const cost = typeof def.energyCost === 'number' ? def.energyCost : 1;
    if (cost > energy) continue;
    energy -= cost;
    cardIds.push(id);

    if (def.type === 'attack' && (def.dmg ?? 0) > 0) {
      // ใช้สูตรเดียวกับดาเมจจริง ไม่งั้นเลขที่โชว์จะไม่ตรงกับที่โดน
      damage += computeModifiedDamage(s, {
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
