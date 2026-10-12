// src/core/campaign/bossRules.ts — each boss's special rule, held by a relic (อุปกรณ์บอส).
//
// The rule works while the relic stands. Every player hit that lands on the boss chips one
// point of durability; at zero the relic breaks and the rule stops (cards it stole come back).
// Rules, relic names and numbers live in data/packs/base/boss_rules.json.
import type { GameState } from '../types';
import rulesJson from '../../data/packs/base/boss_rules.json';
import { applyStatusEffect } from '../statusEffectsRuntime';
import { curseById } from '../pack';
import { heal } from '../combat/damage';

export type BossRuleKind = 'weaken' | 'curse' | 'grow' | 'regrow' | 'revive' | 'steal';
export type BossRule = {
  relic: string; kind: BossRuleKind; durability: number;
  params: Record<string, number>; curse?: string; text: string; flavor: string;
};
const RULES: Record<string, BossRule> = rulesJson as any;

export function bossRule(id?: string): BossRule | undefined { return id ? RULES[id] : undefined; }
export function bossRuleIds(): string[] { return Object.keys(RULES); }

/** Fight start: a boss with a rule brings its relic. */
export function initBossRelic(s: GameState): void {
  const rule = bossRule(s.enemy?.id);
  if (!s.fight) return;
  s.fight.relic = rule ? { bossId: s.enemy!.id, durability: rule.durability, broken: false, stolen: [] } : undefined;
}

function liveRule(s: GameState): BossRule | undefined {
  const relic = s.fight?.relic;
  return relic && !relic.broken && relic.bossId === s.enemy?.id ? RULES[relic.bossId] : undefined;
}

/** Start of each ghost turn. */
export function applyBossRule(s: GameState): void {
  const rule = liveRule(s);
  if (!rule || !s.enemy || s.enemy.hp <= 0) return;
  const turn = s.fight!.ghostTurns, p = rule.params;
  switch (rule.kind) {
    case 'weaken':
      applyStatusEffect('player', s, 'weakness', p.turns, p.stacks);
      break;
    case 'curse': {
      const card = curseById(rule.curse!);
      if (!card || turn % (p.every ?? 1) !== 0) return;
      // A fixed spread through the draw pile, so the same fight plays the same way.
      const at = (turn * 7) % (s.piles.draw.length + 1);
      s.piles.draw.splice(at, 0, { ...JSON.parse(JSON.stringify(card)), instanceId: `${card.id}__relic${turn}` });
      break;
    }
    case 'grow':
      if (turn % p.every === 0) applyStatusEffect('enemy', s, 'strength', 99, p.stacks);
      break;
    case 'regrow':
      heal(s, 'enemy', Math.floor(s.enemy.maxHp * p.pct / 100));
      break;
    case 'steal': {
      if (!s.piles.hand.length) break;
      const [card] = s.piles.hand.splice((turn * 5) % s.piles.hand.length, 1);
      s.fight!.relic!.stolen.push(card);
      s.log.push(`${rule.relic}: ขโมย ${card.name}`);
      return;
    }
    case 'revive':
      return;
  }
  s.log.push(`${rule.relic}: ${rule.text}`);
}

/** A player hit landed on the boss: the relic loses a point and may break. */
export function chipBossRelic(s: GameState): void {
  const relic = s.fight?.relic;
  if (!relic || relic.broken || relic.bossId !== s.enemy?.id) return;
  relic.durability -= 1;
  if (relic.durability > 0) return;
  relic.broken = true;
  const rule = RULES[relic.bossId];
  s.log.push(`${rule.relic} แตกแล้ว: ${rule.text} หยุดทำงาน`);
  for (const card of relic.stolen.splice(0)) (s.piles.hand.length < s.player.handMax ? s.piles.hand : s.piles.discard).push(card);
}

/** หม้อคาถา: the boss's first death is undone while the relic stands. Returns true if it revived. */
export function tryBossRevive(s: GameState): boolean {
  const rule = liveRule(s);
  if (!rule || rule.kind !== 'revive' || !s.enemy || s.enemy.hp > 0 || s.fight!.relic!.reviveUsed) return false;
  s.fight!.relic!.reviveUsed = true;
  s.enemy.hp = Math.ceil(s.enemy.maxHp * rule.params.pct / 100);
  s.enemy.statusEffects = (s.enemy.statusEffects ?? []).filter(e => e.id !== 'poison');
  s.log.push(`${rule.relic}: ${s.enemy.name} คืนชีพด้วยเลือด ${s.enemy.hp}`);
  return true;
}
