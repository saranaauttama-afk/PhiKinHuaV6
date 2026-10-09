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
    parts.push(`${e.target==='player'?'ตนเอง':'ผี'}: ${STATUS_EFFECTS_REGISTRY[e.effect]?.name ?? e.effect} ${e.value}${e.duration < 99 ? ` · ${e.duration} เทิร์น` : ''}`);
  }
  if(card.trap){parts.push(card.trap.trigger==='enemy_attack'?'เมื่อผีโจมตี':card.trap.trigger==='enemy_skill'?'เมื่อผีใช้วิชา':'เมื่อผีเล่นการ์ด');parts.push(card.trap.effects.map(e=>e.type==='negate'?'ยกเลิกการ์ดผี':e.type==='status'?`${STATUS_EFFECTS_REGISTRY[e.statusId as keyof typeof STATUS_EFFECTS_REGISTRY]?.name??e.statusId} ${e.value}`:`${e.type==='damage'?'โจมตีกลับ':e.type==='block'?'ป้องกัน':'พลังงาน'} ${e.value}`).join(' · '));}
  if(card.cleanseDebuffs)parts.push('ล้างสถานะลบ');
  if(card.whileHeld){if(card.whileHeld.block)parts.push(`ค้างมือ: ป้องกัน ${card.whileHeld.block}`);if(card.whileHeld.heal)parts.push(`ค้างมือ: ฟื้น ${card.whileHeld.heal}`);}
  if(card.whileHeld?.status){const e=card.whileHeld.status;parts.push(`ค้างมือ: ${STATUS_EFFECTS_REGISTRY[e.effect as keyof typeof STATUS_EFFECTS_REGISTRY]?.name??e.effect} ${e.value} · ${e.duration} เทิร์น`);}
  if(card.costRule)parts.push(`ลดค่าร่าย ${card.costRule.step} ต่อการ์ดที่เล่นแล้ว · ต่ำสุด ${card.costRule.min}`);
  if(card.conditional){const c=card.conditional,w=c.when;
   const when=w.kind==='player_hp_below'?`เมื่อชีวิตต่ำกว่า ${w.value}%`:w.kind==='player_block_at_least'?`เมื่อมีเกราะ ${w.value} ขึ้นไป`:w.kind==='enemy_has_status'?`เมื่อผีมี ${STATUS_EFFECTS_REGISTRY[w.statusId as keyof typeof STATUS_EFFECTS_REGISTRY]?.name??w.statusId}`:w.kind==='hand_empty'?'เมื่อมือไม่เหลือใบอื่น':w.kind==='player_minions_at_least'?`เมื่อมีวิญญาณช่วย ${w.value} ตนขึ้นไป`:`เมื่อสำรับไม่เกิน ${w.value} ใบ`;
   const names={dmg:'โจมตี',block:'ป้องกัน',heal:'ฟื้น',draw:'จั่ว',energyGain:'พลังงาน',hits:'จำนวนครั้งโจมตี'};
   parts.push(`${when}: ${Object.entries(c.bonus).map(([k,v])=>`${names[k as keyof typeof names]} +${v}`).join(' · ')}`);
  }
  return parts.join(' · ') || (card.type === 'curse' ? 'คำสาป · เล่นไม่ได้' : card.type === 'trap' ? 'ตั้งดัก' : card.type === 'equipment' ? 'เครื่องรางติดตัว' : 'วิชาและผลพิเศษ');
}
