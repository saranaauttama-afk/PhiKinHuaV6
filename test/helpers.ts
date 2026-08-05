import type { CardData, Command, GameState } from '../src/core/types';
import { getStoryEvent, choiceLocked } from '../src/core/events/story';
import { baseNewState, startCombat } from '../src/core/commands';
import { applyCommand } from '../src/core/reducer';
import { makeRng, type RNG } from '../src/core/rng';

/**
 * สร้าง state ที่อยู่ในคอมแบตแล้ว พร้อมคุมค่าทุกอย่างได้จากเทสต์
 * ไม่พึ่ง RNG ในการแจกไพ่ — ใส่มือให้ตรงๆ เพื่อให้เทสต์ deterministic
 */
export function makeCombatState(opts: {
  hand?: CardData[];
  playerHp?: number;
  playerBlock?: number;
  playerEnergy?: number;
  enemyHp?: number;
  enemyBlock?: number;
  monsterId?: string;
} = {}): { state: GameState; rng: RNG } {

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

/**
 * ให้ศัตรูเล่นการ์ดตามที่ระบุ แล้วคืน state หลังจบเทิร์นศัตรู
 * ใส่มือให้ตรงๆ เพื่อไม่ต้องพึ่ง RNG ในการจั่ว
 */
export function runEnemyCards(state: GameState, cardIds: string[]): GameState {
  (state as any).enemyPiles = { draw: [], hand: [...cardIds], discard: [] };
  return applyCommand(state, { type: 'ResolveEnemyTurn' }, makeRng('test')).state;
}

/**
 * ถ้ากำลังอยู่ในเหตุการณ์เล่าเรื่อง ให้เลือกทางแรกที่เลือกได้
 *
 * เหตุการณ์ต้องเลือกทางก่อนถึงจะปิดโหนดได้ (ไม่งั้นข้ามผลของเหตุการณ์ไปได้ทั้งดุ้น)
 * ตัวขับรันเต็มรันจึงต้องรู้จักตอบเหตุการณ์ด้วย ไม่ใช่แค่กด CompleteNode
 */
export function resolveStoryIfAny(s: GameState, go: (c: Command) => void): void {
  if (s.phase !== 'event' || !s.story) return;

  const ev = getStoryEvent(s.story.eventId);
  if (!ev) return;

  const index = ev.choices.findIndex(c => choiceLocked(s, c) == null);
  go({ type: 'ChooseEventOption', index: index >= 0 ? index : 0 });
}

/**
 * ถ้ามีการ์ดรางวัลค้างอยู่ ให้ตอบก่อน — ไม่งั้นรันจะค้างที่ phase 'reward'
 *
 * ชนะไฟต์แล้วได้เลือกการ์ดทุกครั้ง (ดู `cards/reward.ts`) ตัวขับรันเต็มรัน
 * จึงต้องรู้จักตอบเหมือนที่ต้องรู้จักตอบเหตุการณ์เล่าเรื่อง
 *
 * @param take หยิบใบแรกไหม — `false` คือกดข้าม (ใช้ตอนวัดเรื่องอื่นที่ไม่อยาก
 *             ให้สำรับโตจนไปกวนผลการวัด)
 */
export function resolveRewardIfAny(
  s: GameState,
  go: (c: Command) => void,
  take = false
): void {
  if (s.phase !== 'reward' || !s.cardReward) return;
  go(take ? { type: 'ChooseCardReward', index: 0 } : { type: 'SkipCardReward' });
}

export function attackCard(dmg: number, over: Partial<CardData> = {}): CardData {
  return { id: 'test_attack', name: 'Test Attack', type: 'attack', cost: 0, dmg, ...over };
}

export function blockCard(block: number, over: Partial<CardData> = {}): CardData {
  return { id: 'test_block', name: 'Test Block', type: 'skill', cost: 0, block, ...over };
}
