// src/core/combat/traps.ts — counter cards (การ์ดตอบโต้)
//
// Played free, a counter waits face-up until the ghost plays a matching card, then fires
// once. A counter that negates cancels the ghost's card before its damage lands.
import type { CardData, Fx, GameState } from '../types';
import { starFx } from '../cards/model';
import { applyFx } from '../cards/fx';
import { nextStateRng } from '../rngState';

/** ดักอะไร */
export type TrapTrigger =
  /** ผีเล่นการ์ดโจมตี */
  | 'enemy_attack'
  /** ผีเล่นการ์ดกัน/เสริม */
  | 'enemy_skill'
  /** ผีเล่นการ์ดอะไรก็ได้ */
  | 'enemy_any';

/** A counter waiting in play. */
export type ArmedTrap = {
  cardId: string;
  name: string;
  trigger: TrapTrigger;
  fx: Fx;
  negate?: boolean;
  /** Player turns before it fades; undefined = until the fight ends. */
  turnsLeft?: number;
};

export function isTrapCard(card: CardData): boolean {
  return card.type === 'counter' && !!card.counter;
}

/** เริ่มไฟต์ = ไม่มีการ์ดตอบโต้ตกค้าง */
export function resetTraps(s: GameState): void {
  s.traps = [];
}

export function armTrap(s: GameState, card: CardData): boolean {
  if (!card.counter) return false;
  (s.traps ??= []).push({
    cardId: card.id, name: card.name, trigger: card.counter.trigger, fx: starFx(card),
    negate: card.counter.negate, turnsLeft: card.counter.turns,
  });
  s.log.push(`วาง ${card.name} ไว้แล้ว`);
  return true;
}

function matches(trap: ArmedTrap, enemyCardType: 'attack' | 'skill'): boolean {
  if (trap.trigger === 'enemy_any') return true;
  if (trap.trigger === 'enemy_attack') return enemyCardType === 'attack';
  return enemyCardType === 'skill';
}

export type TrapResult = { negated: boolean; sprung: string[] };

/** The ghost is about to play a card: matching counters fire and are used up. */
export function springTraps(s: GameState, enemyCardType: 'attack' | 'skill'): TrapResult {
  const list = s.traps ?? [];
  const hit = list.filter(t => matches(t, enemyCardType));
  if (!hit.length) return { negated: false, sprung: [] };
  let negated = false;
  for (const trap of hit) {
    s.log.push(`${trap.name} ทำงาน!`);
    applyFx(s, trap.fx, { sourceId: trap.cardId }, nextStateRng(s));
    if (trap.negate) negated = true;
  }
  s.traps = list.filter(t => !hit.includes(t));
  return { negated, sprung: hit.map(t => t.name) };
}

/** End of the player turn: timed counters count down. */
export function tickTraps(s: GameState): void {
  const kept: ArmedTrap[] = [];
  for (const t of s.traps ?? []) {
    if (t.turnsLeft == null) { kept.push(t); continue; }
    const left = t.turnsLeft - 1;
    if (left <= 0) { s.log.push(`${t.name} สลายไปโดยไม่ได้ทำงาน`); continue; }
    kept.push({ ...t, turnsLeft: left });
  }
  s.traps = kept;
}
