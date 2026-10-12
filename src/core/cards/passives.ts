// src/core/cards/passives.ts — blessings and equipment cards in play react to fight moments.
import type { CardType, GameState, Passive, Trigger, TriggerOn } from '../types';
import type { RNG } from '../rng';
import { applyFx } from './fx';
import { conditionMet } from './mechanics';

type Source = { key: string; name: string; passive: Passive };

function sources(s: GameState): Source[] {
  const out: Source[] = [];
  for (const b of s.blessings ?? []) if (b.triggers) out.push({ key: 'b:' + b.id, name: b.name, passive: b });
  for (const c of s.equipped ?? []) if (c.equip) out.push({ key: 'e:' + (c.instanceId ?? c.id), name: c.name, passive: c.equip });
  return out;
}

/** Flat damage added to each hit of an attack card. */
export function attackBonus(s: GameState): number {
  return sources(s).reduce((n, x) => n + (x.passive.attackBonus ?? 0), 0);
}

/** Damage removed from each enemy hit before block. */
export function armor(s: GameState): number {
  return sources(s).reduce((n, x) => n + (x.passive.armor ?? 0), 0);
}

function fire(s: GameState, src: Source, t: Trigger, index: number, rng: RNG): RNG {
  const onceKey = `${src.key}#${index}`;
  if (t.once === 'turn') {
    if (s.turnFlags?.triggerOnce?.includes(onceKey)) return rng;
    s.turnFlags.triggerOnce = [...(s.turnFlags.triggerOnce ?? []), onceKey];
  }
  if (t.when && !conditionMet(s, t.when)) return rng;
  s.log.push(`${src.name} ทำงาน`);
  return applyFx(s, t.fx, { sourceId: src.key }, rng);
}

/** Fire every trigger for `on`. `type` filters `play` triggers by the played card's type. */
export function runTriggers(s: GameState, on: TriggerOn, rng: RNG, type?: CardType, only?: Source[]): RNG {
  for (const src of only ?? sources(s)) {
    src.passive.triggers.forEach((t, i) => {
      if (t.on !== on || (t.type && t.type !== type)) return;
      if (s.phase !== 'combat' || !s.enemy || s.enemy.hp <= 0) return;
      rng = fire(s, src, t, i, rng);
    });
  }
  return rng;
}

/** An equipment card entering play fires its own `equip` triggers once. */
export function runEquipTriggers(s: GameState, cardInstance: string, rng: RNG): RNG {
  const src = sources(s).filter(x => x.key === 'e:' + cardInstance);
  return runTriggers(s, 'equip', rng, undefined, src);
}
