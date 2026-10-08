import type { CardData } from '../src/core/types';
import { THAI_MINIONS } from '../src/core/combat/minions/thai-minions';
import { STATUS_EFFECTS_REGISTRY } from '../src/core/combat/status-effects/registry';

export type CardGlyph = 'clap' | 'sword' | 'stance' | 'parry' | 'breath' | 'trap' | 'equipment' | 'curse';
/** Exact starter moves, then a complete symbolic vocabulary for every card. */
export function cardGlyph(card: CardData): CardGlyph {
  const explicit: Record<string, CardGlyph> = { thunder_clap: 'clap', temple_blade: 'sword', muay_stance: 'stance', parry_step: 'parry', fighter_breath: 'breath' };
  if (explicit[card.id]) return explicit[card.id];
  if (card.type === 'trap' || card.type === 'equipment' || card.type === 'curse') return card.type;
  if (card.type === 'attack') return 'sword';
  if (card.block) return 'stance';
  return 'breath';
}
export function cardSummary(card: CardData): string {
  if (card.id === 'qa_phra_prathan') return 'ทดสอบ · ชนะผีทันที';
  const parts: string[] = [];
  if (card.dmg) parts.push(`โจมตี ${card.dmg}${card.hits && card.hits > 1 ? ` ×${card.hits}` : ''}`);
  if (card.block) parts.push(`กัน ${card.block}`);
  if (card.heal) parts.push(`ฟื้น ${card.heal}`);
  if (card.energyGain) parts.push(`พลังงาน +${card.energyGain}`);
  if (card.draw) parts.push(`จั่ว ${card.draw}`);
  if (card.summonMinion) {
    const minion = THAI_MINIONS[card.summonMinion];
    parts.push(minion ? `${minion.name} ${minion.duration} เทิร์น` : 'เรียกวิญญาณ');
  }
  if (card.statusEffect) {
    const e = card.statusEffect;
    parts.push(`${STATUS_EFFECTS_REGISTRY[e.effect]?.name ?? e.effect} ${e.value}${e.duration < 99 ? ` · ${e.duration} เทิร์น` : ''}`);
  }
  if (card.conditional) parts.push('มีเงื่อนไข');
  return parts.join(' · ') || (card.type === 'curse' ? 'คำสาป · เล่นไม่ได้' : card.type === 'trap' ? 'ตั้งดัก' : card.type === 'equipment' ? 'เครื่องรางติดตัว' : 'วิชาและผลพิเศษ');
}
