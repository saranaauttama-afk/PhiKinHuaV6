// src/core/combat/minions.ts — minions on both sides (ศิษย์ค่ายของนักมวย / ลูกสมุนของผี).
//
// Brought back 14 Oct 2026 (owner decision, docs/nak-muay/DESIGN.md §6): Night of the Full
// Moon uses summons on both sides, and the นักมวยคาดเชือก camp build needs them.
// One rule set for both sides so a player who learns ศิษย์ค่าย can read a ghost's ลูกสมุน.
//
// - Player minions are passive sources (cards/passives.ts `sources`): their triggers fire
//   with blessings and equipment. Flags (guard, echo, keepsRhythm) are read where they apply.
// - Ghost minions act at the end of each ghost turn with `act`; `taunt` ones take the
//   player's single-target hits first.
// - Minions live for one fight only; a dead one is gone until the card is played again.
import type { Fx, GameState, MinionState, Passive } from '../types';
import minionsJson from '../../data/packs/base/minions.json';
import { emit } from './damage';

export type MinionDef = {
  id: string; name: string; side: 'player' | 'enemy'; hp: number;
  passive?: Passive; act?: Fx; taunt?: boolean; turns?: number; desc?: string;
  /** Ghost minion: while it stands, the ghost's held ชาร์จ cards gain this many extra steps per turn. */
  chargeBoost?: number;
  /**
   * Ghost minion: resolves once, the moment it is summoned (ลงสนามแล้วทำทันที).
   * Owner decision 16 Oct 2026: a 5–10 HP taunt that only acted at the end of the ghost turn
   * was killed by the player's next single hit before it mattered. No countdown was added —
   * the arrival effect is the summon's payoff; it still dies to one hit.
   */
  arrive?: Fx;
};

export const MINION_DEFS: MinionDef[] = minionsJson as any;
export function minionDef(id: string): MinionDef | undefined {
  return MINION_DEFS.find(m => m.id === id);
}

export function minionsOf(s: GameState, side: 'player' | 'enemy'): MinionState[] {
  return (side === 'player' ? s.minions : s.enemyMinions) ?? [];
}

/** New fight: nobody from the last fight is still standing. */
export function resetMinions(s: GameState): void {
  s.minions = [];
  s.enemyMinions = [];
}

/** Put a minion into play for `side`. When the side is full the oldest one leaves. */
export function summonMinion(s: GameState, side: 'player' | 'enemy', id: string): MinionState | undefined {
  const def = minionDef(id);
  if (!def) { s.log.push(`ไม่พบ ${id}`); return; }
  const { MINION_RULES } = require('../balance/notfm');
  const list = side === 'player' ? (s.minions ??= []) : (s.enemyMinions ??= []);
  const max = side === 'player' ? MINION_RULES.playerSlots : MINION_RULES.enemySlots;
  while (list.length >= max) {
    const old = list.shift()!;
    s.log.push(`${old.name} ถอยออกไป`);
  }
  s.minionSeq = (s.minionSeq ?? 0) + 1;
  const m: MinionState = {
    uid: `${id}#${s.minionSeq}`, id, name: def.name, hp: def.hp, maxHp: def.hp, side,
    passive: JSON.parse(JSON.stringify(def.passive ?? { triggers: [] })),
    act: def.act, taunt: def.taunt, turnsLeft: def.turns, chargeBoost: def.chargeBoost,
  };
  list.push(m);
  s.log.push(side === 'player' ? `เรียก ${def.name} เข้าข้างเวที` : `ผีเรียก ${def.name}`);
  emit(s, { t: 'MinionSummoned', side, uid: m.uid, id });
  if (side === 'enemy' && def.arrive && s.phase === 'combat' && s.player.hp > 0) {
    const { applyEnemyFx } = require('./enemyCardEffects');
    s.log.push(`${def.name} ลงสนาม`);
    emit(s, { t: 'MinionActed', side: 'enemy', uid: m.uid });
    applyEnemyFx(s, def.arrive, 'minion:' + id);
  }
  return m;
}

/** Damage a minion directly (no block). Dead minions leave play. Returns HP lost. */
export function damageMinion(s: GameState, m: MinionState, amount: number): number {
  if (amount <= 0 || m.hp <= 0) return 0;
  const lost = Math.min(m.hp, Math.round(amount));
  m.hp -= lost;
  emit(s, { t: 'MinionDamaged', side: m.side, uid: m.uid, amount: lost });
  if (m.hp <= 0) {
    s.log.push(`${m.name} ล้มลง`);
    if (m.side === 'player') s.minions = (s.minions ?? []).filter(x => x !== m);
    else s.enemyMinions = (s.enemyMinions ?? []).filter(x => x !== m);
  }
  return lost;
}

/** The ghost's taunting minion that soaks the player's single-target hits, if any. */
export function tauntTarget(s: GameState): MinionState | undefined {
  return (s.enemyMinions ?? []).find(m => m.taunt && m.hp > 0);
}

/** A player minion with `guard` that has not guarded yet this ghost turn. */
export function guardFor(s: GameState): MinionState | undefined {
  const turn = s.fight?.ghostTurns ?? 0;
  if (s.fight?.guardTurn === turn) return;
  return (s.minions ?? []).find(m => m.passive.guard && m.hp > 0);
}

/** End of a ghost turn: ghost minions act, then timed minions on that side count down. */
export function ghostMinionsAct(s: GameState): void {
  const { applyEnemyFx } = require('./enemyCardEffects');
  for (const m of [...(s.enemyMinions ?? [])]) {
    if (s.phase !== 'combat' || s.player.hp <= 0) break;
    if (m.act) { s.log.push(`${m.name} ลงมือ`); emit(s, { t: 'MinionActed', side: 'enemy', uid: m.uid }); applyEnemyFx(s, m.act, 'minion:' + m.id); }
  }
  tick(s, 'enemy');
}

/** End of a player turn: timed player minions count down (their triggers already fired). */
export function tickPlayerMinions(s: GameState): void { tick(s, 'player'); }

function tick(s: GameState, side: 'player' | 'enemy'): void {
  const list = minionsOf(s, side);
  const kept = list.filter(m => {
    if (m.turnsLeft == null) return true;
    m.turnsLeft -= 1;
    if (m.turnsLeft > 0) return true;
    s.log.push(`${m.name} หายไป`);
    return false;
  });
  if (side === 'player') s.minions = kept; else s.enemyMinions = kept;
}

/** Rules text for a minion card / archive. */
export function minionText(id: string): string {
  const d = minionDef(id);
  return d ? `เลือด ${d.hp} · ${d.desc ?? ''}` : '';
}
