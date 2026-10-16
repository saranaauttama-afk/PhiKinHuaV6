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
export function fxText(fx: Fx, side: 'player' | 'enemy' = 'player', water = 'มานา'): string[] {
  const self = side === 'player' ? 'เรา' : 'ผี', other = side === 'player' ? 'ผี' : 'เรา';
  const out: string[] = [];
  if (fx.dmg) out.push(`โจมตี ${fx.dmg}${(fx.hits ?? 1) > 1 ? ` ×${fx.hits}` : ''}`);
  else if (fx.hits) out.push(`ตีเพิ่ม ${fx.hits} ครั้ง`);
  if (fx.block) out.push(`เกราะ ${fx.block}`);
  if (fx.heal) out.push(`ฟื้น ${fx.heal}`);
  if (fx.mana) out.push(`${water} +${fx.mana}`);
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
  if (fx.seal) out.push(fx.seal === 1 ? 'ผนึกการ์ดที่ผีถือ 1 ใบ' : `ผนึกการ์ดที่ผีถือ ${fx.seal} ใบ`);
  if (fx.unCharge) out.push('ล้างแรงชาร์จการ์ดที่ผีถือ');
  if (fx.selfDamage) out.push(`เสียเลือด ${fx.selfDamage}`);
  if (fx.healMinions) out.push(`ของเลี้ยงทุกตัวฟื้น ${fx.healMinions}`);
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
  rhythm: 'ทุกครั้งที่ได้จังหวะ', roundEnd: 'พักยก', seal: 'ทุกครั้งที่ผนึกผี',
};

export function passiveText(p: Passive, water = 'มานา'): string[] {
  const out = p.triggers.map(t => {
    const when = t.on === 'play' ? `เมื่อเล่นการ์ด${t.type ? TYPE_LABEL[t.type] : ''}${t.once ? 'ใบแรกของเทิร์น' : ''}` : TRIGGER_WHEN[t.on];
    const cond = t.when ? ` ${conditionText(t.when)}` : '';
    return `${when}${cond}${t.once && t.on !== 'play' ? ' (เทิร์นละครั้ง)' : ''}: ${fxText(t.fx, 'player', water).join(' · ')}`;
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
  if (p.bowlBonus) out.push(`ขันจุน้ำมนต์ +${p.bowlBonus}`);
  if (p.overflowDmg) out.push(`น้ำล้นขันทุก 1 ตีผี ${p.overflowDmg}`);
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
  const water = require('./water').cardResourceName(card) as string;
  if (card.type === 'equipment' && card.equip) parts.push(...passiveText(card.equip, water));
  if (card.charges) parts.push(`ใช้ได้ ${card.charges} ครั้ง`);
  if (card.spendRhythm) parts.push(card.spendRhythm.mode === 'hits'
    ? 'ใช้จังหวะทั้งหมด: ตีครั้งละ ' + (fx.dmg ?? 0) + ' เท่าจำนวนจังหวะ'
    : `ใช้จังหวะทั้งหมด: +${card.spendRhythm.perStack} ดาเมจต่อจังหวะ`);
  const shown = card.spendRhythm?.mode === 'hits' ? { ...fx, dmg: undefined } : fx;
  // หมอผี (cards/water.ts)
  if (card.blood) parts.push(`ของต่ำ: น้ำมนต์ไม่พอ จ่ายเลือด ${require('../balance/notfm').WATER_RULES.bloodPerWater} ต่อ 1 ที่ขาด`);
  if (card.splash) parts.push(`${card.splashWaterCap == null ? 'สาดน้ำมนต์ทั้งขัน' : `ใช้น้ำมนต์สูงสุด ${card.splashWaterCap}`}: ต่อ 1 น้ำมนต์ ${perText(card.splash, side)}`);
  if (card.rhythmDamageCap != null) parts.push(`จังหวะเพิ่มดาเมจสูงสุด ${card.rhythmDamageCap} ต่อครั้ง`);
  if (card.starterHeavy) parts.push(`ใช้ช้ำสูงสุด ${card.starterHeavy.maxStacks} ชั้น ชั้นละ ${card.starterHeavy.perStack}`);
  if (card.wakeYant) parts.push(`ปลุกยันต์ทั้งหมดบนผี: ต่อ 1 ยันต์ ${perText(card.wakeYant, side)}`);
  parts.push(...fxText(shown, side, water));
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
  if (card.conditional) parts.push(`${conditionText(card.conditional.when, side)} +${fxText(card.conditional.bonus, side, water).join(' · ')}`);
  const curse = (card as { curseCard?: string }).curseCard;
  if (curse) parts.push(`ใส่${require('../pack').curseById(curse)?.name ?? 'คำสาป'}ในกองทิ้งของเรา`);
  if (card.whileHeld) parts.push(`ถือไว้ท้ายเทิร์น: ${fxText(card.whileHeld).join(' · ')}`);
  if (card.counter?.turns) parts.push(`อยู่ ${card.counter.turns} เทิร์น`);
  if (card.limit === 'turn') parts.push('เทิร์นละครั้ง');
  if (card.exhaust) parts.push('นำออก');
  const text = lead + parts.join(' · ');
  return card.class === 'warrior' ? text.replace(/ของเลี้ยง/g, 'ศิษย์ค่าย') : text;
}

/** One point of สาด / ปลุกยันต์ in words. */
function perText(per: import('../types').PerStackFx, side: 'player' | 'enemy'): string {
  const out = fxText({ dmg: per.dmg, block: per.block, heal: per.heal, mana: per.mana }, side, 'น้ำมนต์');
  return out.join(' · ') + (per.sweep ? ' (โดนลูกสมุนของผีทุกตัวด้วย)' : '');
}

export function describeBlessing(b: BlessingDef): string {
  return b.desc ?? passiveText(b).join(' · ');
}

/** Cost label: ฟรี, n แต้ม or n มานา (n น้ำมนต์ for the shaman's cards). */
export function costLabel(card: CardData, cost?: { ap: number; mana: number }): string {
  const ap = cost?.ap ?? card.ap ?? 0, mana = cost?.mana ?? card.mana ?? 0;
  if (mana) return `${mana} ${require('./water').cardResourceName(card)}`;
  if (card.splash) return card.splashWaterCap == null ? 'สาดทั้งขัน' : `ใช้น้ำสูงสุด ${card.splashWaterCap}`;
  if (ap) return `${ap} แต้ม`;
  return 'ฟรี';
}

/**
 * Short face text (owner playtest 16 Oct 2026: card faces were too long to read on a phone).
 * Keywords and numbers only; the move, cost and type are already icons on the card, and the
 * full sentence (describeCard) stays in every detail panel. Never used for rules decisions.
 */
export function cardFaceText(card: CardData, side: 'player' | 'enemy' = 'player'): string {
  if (card.id === 'qa_phra_prathan') return 'ชนะทันที';
  if (card.type === 'curse') return 'เล่นไม่ได้';
  const fx = starFx(card), parts: string[] = [];
  const MOVE = require('./fighter').MOVE_NAMES as Record<string, string>;
  let lead = '';
  if (card.type === 'counter' && card.counter) lead = `${({ enemy_attack: 'ผีตี', enemy_skill: 'ผีใช้วิชา', enemy_any: 'ผีเล่นการ์ด' } as const)[card.counter.trigger]}: ${card.counter.negate ? 'ยกเลิก · ' : ''}`;
  if (card.type === 'prayer') lead = 'สวด ×1–3: ';
  if (card.heavy) parts.push('ท่าหนัก');
  if (card.type === 'equipment' && card.equip) parts.push(...faceTriggers(card.equip));
  if (card.charges) parts.push(`ใช้ได้ ${card.charges}`);
  if (card.spendRhythm) parts.push(card.spendRhythm.mode === 'hits' ? `ตี ${fx.dmg ?? 0} × จังหวะ` : `+${card.spendRhythm.perStack}/จังหวะ`);
  if (card.blood) parts.push('ของต่ำ');
  if (card.splash) parts.push(`${card.splashWaterCap == null ? 'สาดทั้งขัน' : `สาด ≤${card.splashWaterCap} น้ำ`}: ${faceFx(perFx(card.splash)).join(' ')}/น้ำ${card.splash.sweep ? ' กวาด' : ''}`);
  if (card.wakeYant) parts.push(`ปลุกยันต์: ${faceFx(perFx(card.wakeYant)).join(' ')}/ยันต์${card.wakeYant.sweep ? ' กวาด' : ''}`);
  parts.push(...faceFx(card.spendRhythm?.mode === 'hits' ? { ...fx, dmg: undefined } : fx, side));
  // Starter caps (deck progression): the full sentence stays in describeCard.
  if (card.rhythmDamageCap != null) parts.push(`จังหวะ ≤${card.rhythmDamageCap}`);
  if (card.starterHeavy) parts.push(`กินช้ำ ≤${card.starterHeavy.maxStacks}`);
  if (card.after) parts.push(`หลัง${MOVE[card.after.move]}: +${faceFx(card.after.bonus, side).join(' ')}`);
  if (card.riposte) parts.push(`สวน ${faceFx(card.riposte, side).join(' ')}`);
  if (card.repeatIf) parts.push(`${faceCondition(card.repeatIf)}: ซ้ำ`);
  if (card.conditional) parts.push(`${faceCondition(card.conditional.when)}: +${faceFx(card.conditional.bonus, side).join(' ')}`);
  if ((card as { curseCard?: string }).curseCard) parts.push('ใส่คำสาป');
  if (card.whileHeld) parts.push(`ถือไว้: ${faceFx(card.whileHeld).join(' ')}`);
  if (card.counter?.turns) parts.push(`${card.counter.turns} เทิร์น`);
  if (card.limit === 'turn') parts.push('เทิร์นละครั้ง');
  const text = lead + parts.join(' · ');
  return card.class === 'warrior' ? text.replace(/ของเลี้ยง/g, 'ศิษย์ค่าย') : text;
}

const perFx = (p: import('../types').PerStackFx): Fx => ({ dmg: p.dmg, block: p.block, heal: p.heal, mana: p.mana });

/** fxText in a few words. */
function faceFx(fx: Fx, side: 'player' | 'enemy' = 'player'): string[] {
  const out: string[] = [];
  if (fx.dmg) out.push(`ตี ${fx.dmg}${(fx.hits ?? 1) > 1 ? `×${fx.hits}` : ''}`);
  else if (fx.hits) out.push(`+${fx.hits} ครั้ง`);
  if (fx.block) out.push(`เกราะ ${fx.block}`);
  if (fx.heal) out.push(`ฟื้น ${fx.heal}`);
  if (fx.mana) out.push(`น้ำ +${fx.mana}`);
  if (fx.ap) out.push(`แต้ม +${fx.ap}`);
  for (const e of fx.status ?? []) out.push(`${e.to === 'self' ? (side === 'player' ? 'ตัวเอง' : 'ผี') : ''}${statusName(e.id)} ${e.stacks}`);
  if (fx.cleanse) out.push('ล้างสถานะ');
  if (fx.cleanseOne) out.push('ล้างสถานะ 1');
  if (fx.borrow) out.push(`ยืมการ์ดผี ${fx.borrow}`);
  if (fx.draw) out.push(`จั่ว ${fx.draw}`);
  if (fx.breakBlock) out.push(`ทำลายเกราะ ${fx.breakBlock}`);
  if (fx.sweep) out.push('กวาด');
  if (fx.rhythm) out.push(`จังหวะ +${fx.rhythm}`);
  if (fx.keepRhythm) out.push('คงจังหวะ');
  if (fx.lockRhythm) out.push('จังหวะไม่หาย');
  if (fx.doubleNext) out.push('โจมตีใบถัดไป ×2');
  if (fx.drain) out.push('ดูดเลือด');
  if (fx.steal) out.push(`ขโมยการ์ด ${fx.steal}`);
  if (fx.seal) out.push(`ผนึก ${fx.seal}`);
  if (fx.unCharge) out.push('ล้างชาร์จ');
  if (fx.selfDamage) out.push(`เสียเลือด ${fx.selfDamage}`);
  if (fx.healMinions) out.push(`ของเลี้ยงฟื้น ${fx.healMinions}`);
  if (fx.summon) out.push(`เรียก${require('../combat/minions').minionDef(fx.summon)?.name ?? fx.summon}`);
  return out;
}

/** conditionText in a few words. */
function faceCondition(c: import('./mechanics').CardCondition): string {
  const st = (id: string) => statusName(id);
  switch (c.kind) {
    case 'round_last_turn': return 'ท้ายยก';
    case 'rhythm_at_least': return `จังหวะ ≥${c.value}`;
    case 'rhythm_at_most': return c.value === 0 ? 'ไม่มีจังหวะ' : `จังหวะ ≤${c.value}`;
    case 'enemy_status_at_least': return `${st(c.statusId)} ≥${c.value}`;
    case 'enemy_has_status': return `ผีติด${st(c.statusId)}`;
    case 'water_at_least': return `น้ำ ≥${c.value}`;
    case 'minions_at_least': return c.value <= 1 ? 'มีของเลี้ยง' : `ของเลี้ยง ≥${c.value}`;
    case 'ghost_charging': return 'ผีชาร์จ';
    case 'played_move': return `หลัง${require('./fighter').MOVE_NAMES[c.move]}`;
    case 'player_hp_below': return `เลือด <${c.value}%`;
    case 'foe_hp_below': return `ผีเลือด <${c.value}%`;
    case 'player_block_at_least': return `เกราะ ≥${c.value}`;
    case 'foe_block_at_least': return c.value <= 1 ? 'ผีมีเกราะ' : `ผีเกราะ ≥${c.value}`;
    case 'moves_this_turn_at_least': return `ออก ${c.value} ท่า`;
    case 'hand_empty': return 'มือว่าง';
    case 'deck_at_most': return `สำรับ ≤${c.value}`;
    case 'hurt_last_turn': return 'โดนตีเข้าเนื้อ';
    default: return conditionText(c);
  }
}

/** Equipment passives in a few words: when + effect. */
function faceTriggers(p: Passive): string[] {
  const WHEN: Partial<Record<Trigger['on'], string>> = { battleStart: 'เริ่มไฟต์', equip: 'สวม', turnStart: 'ต้นเทิร์น', turnEnd: 'ท้ายเทิร์น', play: 'เล่นการ์ด', roundEnd: 'พักยก', rhythm: 'ได้จังหวะ', seal: 'ผนึก', discard: 'ทิ้ง', prayerDone: 'สวดสำเร็จ' };
  const out = p.triggers.map(t => `${t.on === 'play' && t.type ? `เล่น${TYPE_LABEL[t.type]}` : WHEN[t.on] ?? t.on}${t.when ? ` ${faceCondition(t.when)}` : ''}: ${faceFx(t.fx).join(' ')}`);
  if (p.armor) out.push(`ลดดาเมจ ${p.armor}`);
  if (p.attackBonus) out.push(`โจมตี +${p.attackBonus}`);
  const MOVE = require('./fighter').MOVE_NAMES;
  for (const [m, n] of Object.entries(p.moveBonus ?? {})) out.push(`${MOVE[m]} +${n}`);
  for (const [m, n] of Object.entries(p.moveBruise ?? {})) out.push(`${MOVE[m]} ช้ำ +${n}`);
  if (p.heavyPerBruise) out.push(`ท่าหนัก +${p.heavyPerBruise}/ช้ำ`);
  if (p.riposteBonus) out.push(`สวน +${p.riposteBonus}`);
  if (p.damageCap) out.push(`ดาเมจเกิน ${p.damageCap.over} → ${p.damageCap.to}`);
  if (p.deathSave) out.push(`กันตาย (เลือด ${p.deathSave.hp})`);
  if (p.bowlBonus) out.push(`ขัน +${p.bowlBonus}`);
  if (p.overflowDmg) out.push(`น้ำล้น ตี ${p.overflowDmg}`);
  return out;
}
