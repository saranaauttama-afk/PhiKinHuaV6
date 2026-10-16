// src/core/classes.ts — คลาสตัวละคร
//
// Night of the Full Moon สร้างคุณค่าของการเล่นซ้ำจากคลาส: หนูน้อยหมวกแดง/แม่ชี/
// แม่มด/มนุษย์หมาป่า แต่ละคนเด็คคนละแบบ กลไกเฉพาะตัวคนละอย่าง เปลี่ยนคลาสแล้ว
// เกมเปลี่ยนไปทั้งเกม
//
// เดิมเกมนี้มีผู้เล่นแบบเดียว เด็คตั้งต้นชุดเดียว (การ์ดทั้ง 29 ใบติดแท็ก shaman)
// เล่นรอบสองจึงได้ประสบการณ์เกือบเหมือนเดิม
//
// แต่ละคลาสต่างกันสี่อย่าง: ค่าสถานะตั้งต้น, เด็คตั้งต้น, passive หนึ่งอย่าง
// (balance/notfm.ts → CLASS_PASSIVES) และสกิลสามช่อง (data/packs/base/skills.json)

import type { CardData } from './types';
import { CLASS_PASSIVES, CLASS_RESOURCES } from './balance/notfm';

export type ClassId = 'shaman' | 'warrior' | 'nun' | 'medium';

export type CharacterClass = {
  id: ClassId;
  name: string;
  title: string;
  desc: string;
  startHp: number;
  /** Mana at the start of each fight. */
  startMana: number;
  passiveName: string;
  /** Generated from `CLASS_PASSIVES`, so the text always matches the numbers. */
  passiveDesc: string;
};

/** Rules text for a class passive. */
export function classPassiveText(id: ClassId): string {
  const p = CLASS_PASSIVES[id];
  const lines = require('./cards/describe').passiveText(p) as string[];
  if (p.spellDiscount) lines.push(`คาถาใบแรกของแต่ละเทิร์นใช้มานาน้อยลง ${p.spellDiscount}`);
  if (p.water) {
    const W = require('./balance/notfm').WATER_RULES;
    lines.splice(0, lines.length, `ต้นเทิร์น (ตั้งแต่เทิร์น 2) น้ำมนต์ +${W.perTurn} · ขันจุ ${W.bowlMax} น้ำที่ล้นขันกลายเป็นเกราะ ${W.overflowBlock} ต่อ 1 · ยันต์บนผีครบ ${W.sealAt} ผนึกการ์ดที่ผีถือไว้`);
  }
  if (p.copyFirstGhostCard) lines.push('การ์ดผีใบแรกที่เปิดในแต่ละไฟต์ ได้สำเนาเข้ามือ (ฟรี · นำออก)');
  if (p.rhythm) {
    const R = require('./balance/notfm').FIGHTER_RULES;
    lines.push(`ออกท่าไม่ซ้ำกับท่าก่อนหน้า จังหวะ +${R.perNewMove} · จังหวะ 1 = การ์ดโจมตี +${R.dmgPerStack} ดาเมจ (สูงสุด ${R.rhythmMax}) · จบเทิร์นโดยไม่ได้ตี จังหวะหายหมด`);
  }
  return lines.join(' · ').replace('เมื่อสวม: ', 'สวมเครื่องรางแต่ละชิ้น: ');
}

const make = (id: ClassId, name: string, title: string, desc: string): CharacterClass => ({
  id, name, title, desc,
  startHp: CLASS_RESOURCES[id].hp,
  startMana: CLASS_RESOURCES[id].startMana,
  passiveName: CLASS_PASSIVES[id].name,
  get passiveDesc() { return classPassiveText(id); },
});

export const CHARACTER_CLASSES: Record<ClassId, CharacterClass> = {
  shaman: make('shaman', 'หมอผี', 'ผู้ถือขันน้ำมนต์', 'ปลุกเสกน้ำมนต์จนเต็มขันแล้วสาดทีเดียว ลงยันต์ผนึกการ์ดที่ผีถือไว้ ล้อมสายสิญจน์ล้างแรงชาร์จ หรือยอมจ่ายเลือดเลี้ยงของต่ำ'),
  // Was นักรบวัด until 14 Oct 2026 (no such role exists; owner chose นักมวยคาดเชือก). Id stays 'warrior' for saves.
  warrior: make('warrior', 'นักมวยคาดเชือก', 'ผู้ต่อแม่ไม้', 'ต่อท่าหมัด เตะ เข่า ศอก ไม่ซ้ำให้จังหวะติด ทุบให้ผีช้ำแล้วปิดด้วยท่าหนัก ตั้งการ์ดรอสวน และเรียกศิษย์ค่ายมาช่วย'),
  nun: make('nun', 'แม่ชี', 'ผู้ถือศีล', 'บทสวดที่ยิ่งรอยิ่งแรง เลือกว่าจะรอกี่เทิร์น ตั้งเกราะแล้วหมุนธรรมจักร'),
  medium: make('medium', 'คนทรง', 'ผู้เชิญวิญญาณ', 'ยืมท่าที่ผีเพิ่งใช้มาเป็นของตัวเอง วางพิษแล้วซ้ำแผล'),
};

export const ALL_CLASS_IDS = Object.keys(CHARACTER_CLASSES) as ClassId[];

/**
 * Store launch (owner, 15 Oct 2026): only นักมวยคาดเชือก has the full NOTFM-level card set, so it
 * opens the book and is the only class a player can start. The others stay in the book, locked,
 * until their own card sets are done (one class at a time). Engine, sims and old saves still use
 * every class — this gate is for starting a new run only.
 * หมอผี opened 15 Oct 2026 with its น้ำมนต์ card set (docs/mor-phi/DESIGN.md).
 */
export const CLASS_BOOK_ORDER: ClassId[] = ['warrior', 'shaman', 'nun', 'medium'];
export const PLAYABLE_CLASSES: readonly ClassId[] = ['warrior', 'shaman'];
export function classPlayable(id: ClassId): boolean { return PLAYABLE_CLASSES.includes(id); }

export function getClass(id?: ClassId): CharacterClass {
  return CHARACTER_CLASSES[id ?? 'shaman'] ?? CHARACTER_CLASSES.shaman;
}

/** Starter deck: every card of the class pool with a `starter` count in the card data. */
export function buildStarterDeck(cls: CharacterClass, allCards: (CardData & { starter?: number })[]): CardData[] {
  const deck: CardData[] = [];
  for (const card of allCards) {
    if (card.class !== cls.id || !card.starter) continue;
    const { starter, ...rest } = card;
    for (let i = 0; i < starter; i++) deck.push(JSON.parse(JSON.stringify(rest)));
  }
  return deck;
}
