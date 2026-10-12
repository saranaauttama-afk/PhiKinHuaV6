// src/core/cards/describe.ts — card rules text in Thai, generated from the data.
// Shown on cards, in the deck, the shop and the archive, so every star level stays accurate.
import type { BlessingDef, CardData, CardType, Fx, Passive, Trigger } from '../types';
import { STATUS_EFFECTS_REGISTRY } from '../combat/status-effects/registry';
import { conditionText } from './mechanics';
import { starFx } from './model';

export const TYPE_LABEL: Record<CardType, string> = {
  attack: 'โจมตี', action: 'Action', spell: 'คาถา', equipment: 'อุปกรณ์',
  mana: 'มานา', prayer: 'สวดภาวนา', counter: 'ตอบโต้', curse: 'คำสาป',
};

const statusName = (id: string) => STATUS_EFFECTS_REGISTRY[id as keyof typeof STATUS_EFFECTS_REGISTRY]?.name ?? id;

export function fxText(fx: Fx): string[] {
  const out: string[] = [];
  if (fx.dmg) out.push(`โจมตี ${fx.dmg}${(fx.hits ?? 1) > 1 ? ` ×${fx.hits}` : ''}`);
  if (fx.block) out.push(`เกราะ ${fx.block}`);
  if (fx.heal) out.push(`ฟื้น ${fx.heal}`);
  if (fx.mana) out.push(`มานา +${fx.mana}`);
  if (fx.ap) out.push(`แต้ม +${fx.ap}`);
  for (const e of fx.status ?? []) {
    out.push(`${e.to === 'self' ? 'เรา' : 'ผี'}ติด${statusName(e.id)} ${e.stacks}${e.turns < 99 ? ` (${e.turns} เทิร์น)` : ''}`);
  }
  if (fx.cleanse) out.push('ล้างสถานะลบ');
  if (fx.borrow) out.push(fx.borrow === 1 ? 'ยืมการ์ดล่าสุดของผี' : `ยืมการ์ด ${fx.borrow} ใบล่าสุดของผี`);
  if (fx.draw) out.push(`จั่ว ${fx.draw}`);
  return out;
}

const COUNTER_WHEN = { enemy_attack: 'เมื่อผีโจมตี', enemy_skill: 'เมื่อผีใช้วิชา', enemy_any: 'เมื่อผีเล่นการ์ด' } as const;
const TRIGGER_WHEN: Record<Trigger['on'], string> = {
  battleStart: 'เริ่มไฟต์', equip: 'เมื่อสวม', turnStart: 'ต้นเทิร์น', turnEnd: 'ท้ายเทิร์น',
  play: 'เมื่อเล่น', prayerDone: 'เมื่อบทสวดสำเร็จ',
};

export function passiveText(p: Passive): string[] {
  const out = p.triggers.map(t => {
    const when = t.on === 'play' ? `เมื่อเล่นการ์ด${t.type ? TYPE_LABEL[t.type] : ''}${t.once ? 'ใบแรกของเทิร์น' : ''}` : TRIGGER_WHEN[t.on];
    const cond = t.when ? ` ${conditionText(t.when)}` : '';
    return `${when}${cond}: ${fxText(t.fx).join(' · ')}`;
  });
  if (p.armor) out.push(`รับดาเมจจากผีลดลง ${p.armor} ต่อครั้ง`);
  if (p.attackBonus) out.push(`การ์ดโจมตีแรงขึ้น ${p.attackBonus} ต่อครั้ง`);
  return out;
}

/** Full rules text for a card at its current star. */
export function describeCard(card: CardData): string {
  if (card.id === 'qa_phra_prathan') return 'ทดสอบ · ชนะผีทันที';
  if (card.type === 'curse') return 'เล่นไม่ได้ · ทิ้งเองท้ายเทิร์น';
  const parts: string[] = [];
  const fx = starFx(card);
  let lead = '';
  if (card.type === 'counter' && card.counter) {
    lead = `${COUNTER_WHEN[card.counter.trigger]}: `;
    if (card.counter.negate) parts.push('ยกเลิกการ์ดนั้น');
  }
  if (card.type === 'prayer') lead = 'รอ 1–3 เทิร์น ผล ×1/×2/×3: ';
  if (card.type === 'equipment' && card.equip) parts.push(...passiveText(card.equip));
  parts.push(...fxText(fx));
  if (card.conditional) parts.push(`${conditionText(card.conditional.when)} +${fxText(card.conditional.bonus).join(' · ')}`);
  if (card.whileHeld) parts.push(`ถือไว้ท้ายเทิร์น: ${fxText(card.whileHeld).join(' · ')}`);
  if (card.counter?.turns) parts.push(`อยู่ ${card.counter.turns} เทิร์น`);
  if (card.limit === 'turn') parts.push('เทิร์นละครั้ง');
  if (card.exhaust) parts.push('นำออก');
  return lead + parts.join(' · ');
}

export function describeBlessing(b: BlessingDef): string {
  return b.desc ?? passiveText(b).join(' · ');
}

/** Cost label: ฟรี, n แต้ม or n มานา. */
export function costLabel(card: CardData, cost?: { ap: number; mana: number }): string {
  const ap = cost?.ap ?? card.ap ?? 0, mana = cost?.mana ?? card.mana ?? 0;
  if (mana) return `${mana} มานา`;
  if (ap) return `${ap} แต้ม`;
  return 'ฟรี';
}
