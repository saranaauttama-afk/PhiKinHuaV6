import type { CardData } from '../src/core/types';

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
  const parts: string[] = [];
  if (card.dmg) parts.push(`โจมตี ${card.dmg}${card.hits && card.hits > 1 ? ` ×${card.hits}` : ''}`);
  if (card.block) parts.push(`กัน ${card.block}`);
  if (card.heal) parts.push(`ฟื้น ${card.heal}`);
  if (card.energyGain) parts.push(`พลังงาน +${card.energyGain}`);
  if (card.draw) parts.push(`จั่ว ${card.draw}`);
  return parts.join(' · ') || (card.type === 'curse' ? 'คำสาป · เล่นไม่ได้' : card.type === 'trap' ? 'ตั้งดัก' : card.type === 'equipment' ? 'เครื่องรางติดตัว' : 'วิชาและผลพิเศษ');
}
