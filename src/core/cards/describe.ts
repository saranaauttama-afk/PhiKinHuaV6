// src/core/cards/describe.ts — card rules text in Thai, generated from the data.
// Shown on cards, in the deck, the shop and the archive, so every star level stays accurate.
import type { BlessingDef, CardData, CardType, Fx, Passive, Trigger } from '../types';
import { STATUS_EFFECTS_REGISTRY } from '../combat/status-effects/registry';
import { conditionText } from './mechanics';
import { starFx } from './model';

export {CARD_TYPE_LABELS as TYPE_LABEL} from './typesRegistry';
import {CARD_TYPE_LABELS as TYPE_LABEL} from './typesRegistry';

const statusName = (id: string) => STATUS_EFFECTS_REGISTRY[id as keyof typeof STATUS_EFFECTS_REGISTRY]?.name ?? id;

/** Effect text. `side` is who owns the effect: 'enemy' words it from the ghost's side. */
export function fxText(fx: Fx, side: 'player' | 'enemy' = 'player'): string[] {
  const self = side === 'player' ? 'เรา' : 'ผี', other = side === 'player' ? 'ผี' : 'เรา';
  const out: string[] = [];
  if (fx.dmg) out.push(`โจมตี ${fx.dmg}${(fx.hits ?? 1) > 1 ? ` ×${fx.hits}` : ''}`);
  else if (fx.hits) out.push(`ตีเพิ่ม ${fx.hits} ครั้ง`);
  if (fx.block) out.push(`เกราะ ${fx.block}`);
  if (fx.heal) out.push(`ฟื้น ${fx.heal}`);
  if (fx.mana) out.push(`มานา +${fx.mana}`);
  if (fx.ap) out.push(`แต้ม +${fx.ap}`);
  for (const e of fx.status ?? []) {
    out.push(`${e.to === 'self' ? self : other}ติด${statusName(e.id)} ${e.stacks}${e.turns < 99 ? ` (${e.turns} เทิร์น)` : ''}`);
  }
  if (fx.cleanse) out.push('ล้างสถานะลบ');
  if (fx.borrow) out.push(fx.borrow === 1 ? 'ยืมการ์ดล่าสุดของผี' : `ยืมการ์ด ${fx.borrow} ใบล่าสุดของผี`);
  if (fx.draw) out.push(`จั่ว ${fx.draw}`);
  if (fx.breakBlock) out.push(`ทำลายเกราะ${other} ${fx.breakBlock}`);
  if (fx.sweep) out.push(`โดน${side === 'player' ? 'ลูกสมุนของผี' : 'ศิษย์ค่ายของเรา'}ทุกตัวด้วย`);
  if (fx.cleanseOne) out.push('ล้างสถานะลบ 1 อย่าง');
  if (fx.rhythm) out.push(`จังหวะ +${fx.rhythm}`);
  if (fx.keepRhythm) out.push('จังหวะไม่หายเทิร์นนี้');
  if (fx.lockRhythm) out.push('จังหวะไม่หายจนจบไฟต์');
  if (fx.doubleNext) out.push('การ์ดโจมตีใบถัดไปเทิร์นนี้ทำงาน 2 ครั้ง');
  if (fx.drain) out.push(`${self}ฟื้นเท่าที่ทะลุเกราะ${other}`);
  if (fx.steal) out.push(`ขโมยการ์ดใบล่าสุดในมือ${other} ${fx.steal} ใบ (ตีเข้าเนื้อ 1 ครั้ง คืน 1 ใบ)`);
  if (fx.summon) {
    const m = require('../combat/minions');
    out.push(side === 'player' ? `เรียก${m.minionDef(fx.summon)?.name ?? fx.summon} (${m.minionText(fx.summon)})` : `เรียก${m.minionDef(fx.summon)?.name ?? fx.summon}`);
  }
  return out;
}

const COUNTER_WHEN = { enemy_attack: 'เมื่อผีโจมตี', enemy_skill: 'เมื่อผีใช้วิชา', enemy_any: 'เมื่อผีเล่นการ์ด' } as const;
const TRIGGER_WHEN: Record<Trigger['on'], string> = {
  battleStart: 'เริ่มไฟต์', equip: 'เมื่อสวม', turnStart: 'ต้นเทิร์น', turnEnd: 'ท้ายเทิร์น',
  discard:'เมื่อทิ้งท้ายเทิร์น', play: 'เมื่อเล่น', prayerDone: 'เมื่อบทสวดสำเร็จ',
  rhythm: 'ทุกครั้งที่ได้จังหวะ', roundEnd: 'พักยก',
};

export function passiveText(p: Passive): string[] {
  const out = p.triggers.map(t => {
    const when = t.on === 'play' ? `เมื่อเล่นการ์ด${t.type ? TYPE_LABEL[t.type] : ''}${t.once ? 'ใบแรกของเทิร์น' : ''}` : TRIGGER_WHEN[t.on];
    const cond = t.when ? ` ${conditionText(t.when)}` : '';
    return `${when}${cond}${t.once && t.on !== 'play' ? ' (เทิร์นละครั้ง)' : ''}: ${fxText(t.fx).join(' · ')}`;
  });
  if (p.armor) out.push(`รับดาเมจจากผีลดลง ${p.armor} ต่อครั้ง`);
  if (p.attackBonus) out.push(`การ์ดโจมตีแรงขึ้น ${p.attackBonus} ต่อครั้ง`);
  const MOVE = require('./fighter').MOVE_NAMES;
  for (const [m, n] of Object.entries(p.moveBonus ?? {})) out.push(`${MOVE[m]}ทุกใบ +${n} ดาเมจ`);
  for (const [m, n] of Object.entries(p.moveBruise ?? {})) out.push(`${MOVE[m]}ทุกใบ ช้ำ +${n}`);
  if (p.heavyPerBruise) out.push(`ท่าหนักกินช้ำได้ +${p.heavyPerBruise} ต่อชั้น`);
  if (p.riposteBonus) out.push(`สวนทุกครั้ง +${p.riposteBonus} ดาเมจ`);
  if (p.damageCap) out.push(`โดนตีเกิน ${p.damageCap.over} ในครั้งเดียว ลดเหลือ ${p.damageCap.to}`);
  if (p.deathSave) out.push(`ถ้าจะตาย เหลือเลือด ${p.deathSave.hp} และเกราะ ${p.deathSave.block}`);
  return out;
}

/** Keyword line for a นักมวย card: move, heavy, ติดมือ. */
function fighterLead(card: CardData): string {
  const MOVE = require('./fighter').MOVE_NAMES;
  const tags: string[] = [];
  if (card.move) tags.push(MOVE[card.move]);
  if (card.heavy) tags.push('ท่าหนัก');
  if (card.innate) tags.push('ติดมือ');
  return tags.length ? tags.join(' · ') + ': ' : '';
}

/** Full rules text for a card at its current star. */
export function describeCard(card: CardData, side: 'player' | 'enemy' = 'player'): string {
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
  lead = fighterLead(card) + lead;
  if (card.type === 'equipment' && card.equip) parts.push(...passiveText(card.equip));
  if (card.charges) parts.push(`ใช้ได้ ${card.charges} ครั้ง`);
  if (card.spendRhythm) parts.push(card.spendRhythm.mode === 'hits'
    ? 'ใช้จังหวะทั้งหมด: ตีครั้งละ ' + (fx.dmg ?? 0) + ' เท่าจำนวนจังหวะ'
    : `ใช้จังหวะทั้งหมด: +${card.spendRhythm.perStack} ดาเมจต่อจังหวะ`);
  const shown = card.spendRhythm?.mode === 'hits' ? { ...fx, dmg: undefined } : fx;
  parts.push(...fxText(shown, side));
  if (card.after) parts.push(`ต่อจาก${require('./fighter').MOVE_NAMES[card.after.move]}: ${fxText(card.after.bonus, side).map(t => t.replace(/^โจมตี /, '+')).join(' · ')}`);
  const ghost = card as { charge?: Fx; perFoeStatus?: { statusId: string; dmg: number } };
  if (ghost.perFoeStatus) {
    const p = ghost.perFoeStatus, who = side === 'player' ? 'ผี' : 'เรา';
    const stacks = STATUS_EFFECTS_REGISTRY[p.statusId as keyof typeof STATUS_EFFECTS_REGISTRY]?.stackable;
    parts.push(stacks ? `+${p.dmg} ต่อชั้น${statusName(p.statusId)}ของ${who}` : `ถ้า${who}ติด${statusName(p.statusId)} +${p.dmg}`);
  }
  if (ghost.charge) {
    const max = require('../balance/notfm').GHOST_MECHANICS.chargeMaxTurns;
    parts.push(`ชาร์จ: ${fxText(ghost.charge, side).map(t => t.replace(/^(โจมตี|เกราะ|ฟื้น) /, '$1 +')).join(' · ')} ต่อเทิร์นที่ถือไว้ (สูงสุด ${max})`);
  }
  if (card.riposte) parts.push(`สวน: ${fxText(card.riposte, side).join(' · ')}`);
  if (card.repeatIf) parts.push(`${conditionText(card.repeatIf, side)}: ทำซ้ำอีกครั้ง`);
  if (card.conditional) parts.push(`${conditionText(card.conditional.when, side)} +${fxText(card.conditional.bonus, side).join(' · ')}`);
  const curse = (card as { curseCard?: string }).curseCard;
  if (curse) parts.push(`ใส่${require('../pack').curseById(curse)?.name ?? 'คำสาป'}ในกองทิ้งของเรา`);
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
