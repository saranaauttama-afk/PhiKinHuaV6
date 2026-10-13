// src/core/skills.ts — class skills (สกิลอาชีพ), three per class.
//
// Slot A is used on the map; slots B and C in a fight, one skill per player turn.
// Cooldowns count fights entered, won or not, and a ready skill does not stack.
// Names, cooldowns, numbers and text live in data/packs/base/skills.json.
import type { CardData, GameState } from './types';
import type { RNG } from './rng';
import type { ClassId } from './classes';
import { int } from './rng';
import skillsJson from '../data/packs/base/skills.json';
import { canRemoveCard, canUpgrade, upgradeCard } from './engine/shared';
import { drawCards, applyFx } from './cards/fx';
import { lastEnemyCards } from './cards/model';
import { resolvePrayers } from './cards/play';
import { cardFromEnemy } from './cards/borrow';
import { enemyCardById } from './pack_enemy_cards';
import { gainBlock, dealDamage } from './combat/damage';
import { poolFor } from './pack';

export type SkillSlot = 'A' | 'B' | 'C';
export type SkillDef = {
  id: string; class: ClassId; slot: SkillSlot; name: string;
  /** Fights before the skill is ready again. */
  cd: number;
  params: Record<string, number>;
  text: string;
};
/** What the player must pick before the skill resolves. */
export type SkillChoice = 'deck-upgrade' | 'deck-card' | 'option' | 'ghost-card';

export const SKILLS: SkillDef[] = skillsJson as any;
const BY_ID = new Map(SKILLS.map(d => [d.id, d]));

export function skillById(id: string): SkillDef | undefined { return BY_ID.get(id); }
export function skillParam(id: string, key: string): number { return BY_ID.get(id)?.params[key] ?? 0; }
export function skillsFor(cls?: ClassId): SkillDef[] {
  return SKILLS.filter(d => d.class === cls).sort((a, b) => a.slot.localeCompare(b.slot));
}

/** New run: all of the class's skills start ready. */
export function initSkills(s: GameState): void {
  s.skills = Object.fromEntries(skillsFor(s.classId).map(d => [d.id, 0]));
}
/** Entering a fight counts one fight off every cooldown. */
export function tickSkillCooldowns(s: GameState): void {
  for (const id of Object.keys(s.skills ?? {})) s.skills![id] = Math.max(0, s.skills![id] - 1);
}

export function skillChoice(id: string): SkillChoice | undefined {
  switch (id) {
    case 'rune_weapon': return 'deck-upgrade';
    case 'pray_change': return 'deck-card';
    case 'ask_ancestors': return 'option';
    case 'possession': return 'ghost-card';
  }
}

/** Labels for an 'option' skill. */
export function skillOptions(id: string): string[] {
  if (id === 'ask_ancestors') return [`ชีวิตสูงสุด +${skillParam(id, 'maxHp')}`, `มานาเริ่มไฟต์ +${skillParam(id, 'startMana')}`];
  return [];
}

/** Ghost cards ประทับทรง can copy, newest first. */
export function possessionCards(s: GameState): string[] {
  return lastEnemyCards(s, skillParam('possession', 'history')).filter(id => enemyCardById(id));
}

/** Why the skill cannot be used now (Thai), or null. `index` is checked when given. */
export function skillBlock(s: GameState, id: string, index?: number): string | null {
  const def = BY_ID.get(id);
  if (!def || def.class !== s.classId || s.skills?.[id] == null) return 'ไม่มีสกิลนี้';
  if (s.skills[id] > 0) return `อีก ${s.skills[id]} ไฟต์`;
  if (def.slot === 'A') {
    if (s.phase !== 'map') return 'ใช้บนแผนที่';
  } else {
    if (s.phase !== 'combat' || !s.enemy || s.combatVictoryLock) return 'ใช้ในไฟต์';
    if (s.fight?.skillTurn === s.turn) return 'ใช้สกิลแล้วเทิร์นนี้';
  }
  switch (id) {
    case 'rune_weapon': if (!s.masterDeck.some(canUpgrade)) return 'ไม่มีการ์ดที่ปลุกเสกได้'; break;
    case 'pray_change': if (!s.masterDeck.some(c => canRemoveCard(c, s.masterDeck.length + 1))) return 'ไม่มีการ์ดที่เปลี่ยนได้'; break;
    case 'bargain': if (s.shopPricePct != null) return 'ต่อรองไว้แล้ว'; break;
    case 'ghost_strength': if (s.player.hp <= skillParam(id, 'hpCost')) return 'เลือดไม่พอ'; break;
    case 'possession': if (!possessionCards(s).length) return 'ผียังไม่ได้เล่นการ์ด'; break;
  }
  if (index != null) {
    const choice = skillChoice(id);
    if (choice === 'deck-upgrade' && !(s.masterDeck[index] && canUpgrade(s.masterDeck[index]))) return 'เลือกการ์ดนี้ไม่ได้';
    if (choice === 'deck-card' && !(s.masterDeck[index] && canRemoveCard(s.masterDeck[index], s.masterDeck.length + 1))) return 'เลือกการ์ดนี้ไม่ได้';
    if (choice === 'option' && (index < 0 || index >= skillOptions(id).length)) return 'เลือกไม่ได้';
    if (choice === 'ghost-card' && (index < 0 || index >= possessionCards(s).length)) return 'เลือกไม่ได้';
  } else if (skillChoice(id)) return 'ต้องเลือกก่อน';
  return null;
}

/** Use a skill. Returns `used: false` (state untouched) when it cannot be used. */
export function useSkill(s: GameState, id: string, rng: RNG, index?: number): { rng: RNG; used: boolean } {
  if (skillBlock(s, id, index)) return { rng, used: false };
  const def = BY_ID.get(id)!;
  const p = def.params;
  const fight = s.fight;
  switch (id) {
    // ── warrior
    case 'rune_weapon':
      s.masterDeck[index!] = upgradeCard(s.masterDeck[index!]);
      s.log.push(`ลงยันต์อาวุธ: ${s.masterDeck[index!].name} ${s.masterDeck[index!].star} ดาว`);
      break;
    case 'muay_teacher':
      fight!.copyNext = true;
      break;
    case 'diamond_heart':
      gainBlock(s, 'player', fight!.hpLost);
      break;
    // ── shaman
    case 'bargain':
      s.shopPricePct = p.pricePct;
      break;
    case 'composure':
      fight!.halfSpellTurn = s.turn;
      fight!.halfDamage = true;
      break;
    case 'consecrate':
      rng = drawCards(s, rng, p.draw);
      fight!.nextSpellMult = p.mult;
      break;
    // ── nun
    case 'pray_change': {
      const pool = poolFor('nun').filter(c => c.class === 'nun' && c.id !== s.masterDeck[index!].id);
      const roll = int(rng, 0, pool.length - 1); rng = roll.rng;
      const old = s.masterDeck[index!];
      s.masterDeck[index!] = JSON.parse(JSON.stringify(pool[roll.value])) as CardData;
      s.log.push(`อธิษฐาน: ${old.name} → ${s.masterDeck[index!].name}`);
      break;
    }
    case 'metta':
      fight!.lifestealUntil = (s.turn ?? 1) + p.turns - 1;
      break;
    case 'samadhi':
      fight!.extraTurn = true;
      rng = resolvePrayers(s, rng);
      break;
    // ── medium
    case 'ask_ancestors':
      if (index === 0) { s.player.maxHp += p.maxHp; s.player.hp += p.maxHp; }
      else s.player.startMana += p.startMana;
      break;
    case 'ghost_strength':
      s.player.hp -= p.hpCost;
      rng = drawCards(s, rng, p.draw);
      break;
    case 'possession': {
      const card = cardFromEnemy(enemyCardById(possessionCards(s)[index!])!);
      rng = applyFx(s, card.fx, { sourceId: card.id, type: card.type }, rng);
      const poison = s.enemy?.statusEffects?.find(e => e.id === 'poison');
      if (poison && s.enemy && s.enemy.hp > 0) dealDamage(s, { from: 'player', to: 'enemy', raw: poison.stacks ?? 1, source: { kind: 'status', effectId: 'poison' } });
      s.log.push(`ประทับทรง: ${card.name}`);
      break;
    }
  }
  s.skills![id] = def.cd;
  if (def.slot !== 'A' && fight) fight.skillTurn = s.turn;
  s.log.push(`ใช้สกิล ${def.name}`);
  return { rng, used: true };
}
