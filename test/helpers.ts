import type { CardData, GameState } from '../src/core/types';
import { baseNewState, startCombat } from '../src/core/commands';
import { makeRng, type RNG } from '../src/core/rng';
import { resetAILearning } from '../src/core/adaptiveAI';

/**
 * สร้าง state ที่อยู่ในคอมแบตแล้ว พร้อมคุมค่าทุกอย่างได้จากเทสต์
 * ไม่พึ่ง RNG ในการแจกไพ่ — ใส่มือให้ตรงๆ เพื่อให้เทสต์ deterministic
 */
/**
 * adaptiveAI เก็บสถานะไว้ที่ระดับโมดูล (นอก GameState) ซึ่งค้างข้ามเทสต์ได้
 * รีเซ็ตทุกครั้งที่สร้าง state ใหม่เพื่อให้เทสต์ไม่ขึ้นกับลำดับการรัน
 */
function resetGlobalAIState() {
  resetAILearning();
}

export function makeCombatState(opts: {
  hand?: CardData[];
  playerHp?: number;
  playerBlock?: number;
  playerEnergy?: number;
  enemyHp?: number;
  enemyBlock?: number;
  monsterId?: string;
} = {}): { state: GameState; rng: RNG } {
  resetGlobalAIState();

  const state = baseNewState('test');
  const rng = makeRng('test');

  startCombat(state, opts.monsterId ?? 'phi-krasue');

  state.player.hp = opts.playerHp ?? 50;
  state.player.maxHp = Math.max(state.player.maxHp, state.player.hp);
  state.player.block = opts.playerBlock ?? 0;
  state.player.energy = opts.playerEnergy ?? 3;

  if (state.enemy) {
    state.enemy.hp = opts.enemyHp ?? 30;
    state.enemy.maxHp = Math.max(state.enemy.maxHp, state.enemy.hp);
    state.enemy.block = opts.enemyBlock ?? 0;
  }

  state.piles = {
    draw: [],
    hand: (opts.hand ?? []).map((c, i) => ({ ...c, instanceId: `${c.id}__t${i}` })),
    discard: [],
    exhaust: [],
  };

  return { state, rng };
}

export function attackCard(dmg: number, over: Partial<CardData> = {}): CardData {
  return { id: 'test_attack', name: 'Test Attack', type: 'attack', cost: 0, dmg, ...over };
}

export function blockCard(block: number, over: Partial<CardData> = {}): CardData {
  return { id: 'test_block', name: 'Test Block', type: 'skill', cost: 0, block, ...over };
}
