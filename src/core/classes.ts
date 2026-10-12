// src/core/classes.ts — คลาสตัวละคร
//
// Night of the Full Moon สร้างคุณค่าของการเล่นซ้ำจากคลาส: หนูน้อยหมวกแดง/แม่ชี/
// แม่มด/มนุษย์หมาป่า แต่ละคนเด็คคนละแบบ กลไกเฉพาะตัวคนละอย่าง เปลี่ยนคลาสแล้ว
// เกมเปลี่ยนไปทั้งเกม
//
// เดิมเกมนี้มีผู้เล่นแบบเดียว เด็คตั้งต้นชุดเดียว (การ์ดทั้ง 29 ใบติดแท็ก shaman)
// เล่นรอบสองจึงได้ประสบการณ์เกือบเหมือนเดิม
//
// แต่ละคลาสต่างกันสามอย่าง: ค่าสถานะตั้งต้น, เด็คตั้งต้น, และพรติดตัวหนึ่งอย่าง
// ที่ทำงานทุกไฟต์

import type { CardData, GameState } from './types';
import { CLASS_RESOURCES } from './balance/notfm';

export type ClassId = 'shaman' | 'warrior' | 'nun' | 'medium';

export type CharacterClass = {
  id: ClassId;
  name: string;
  title: string;
  desc: string;
  startHp: number;
  /** Mana at the start of each fight. */
  startMana: number;
  /** ข้อความอธิบายกลไกเฉพาะตัว */
  passiveName: string;
  passiveDesc: string;
};

export const CHARACTER_CLASSES: Record<ClassId, CharacterClass> = {
  shaman: {
    id: 'shaman',
    startHp: CLASS_RESOURCES.shaman.hp,
    startMana: CLASS_RESOURCES.shaman.startMana,
    name: 'หมอผี',
    title: 'ผู้สาปและผู้แก้สาป',
    desc: 'สะสมมานาแล้วร่ายคาถาสาปและพิษ เข็มปักแรงขึ้นเมื่อผีติดคำสาป',
    passiveName: 'ครูพักลักจำ',
    passiveDesc: 'เริ่มทุกไฟต์ได้มานาเพิ่ม 1',
  },

  warrior: {
    id: 'warrior',
    startHp: CLASS_RESOURCES.warrior.hp,
    startMana: CLASS_RESOURCES.warrior.startMana,
    name: 'นักรบวัด',
    title: 'ผู้ยืนหยัด',
    desc: 'การ์ดโจมตีฟรีเยอะที่สุด ตั้งรับแล้วสวน สะสมแรงให้ทุกหมัดหนักขึ้น และใช้อุปกรณ์',
    passiveName: 'ยืนเฝ้าประตู',
    passiveDesc: 'เริ่มทุกไฟต์ด้วยการ์ดป้องกัน 6',
  },

  nun: {
    id: 'nun',
    startHp: CLASS_RESOURCES.nun.hp,
    startMana: CLASS_RESOURCES.nun.startMana,
    name: 'แม่ชี',
    title: 'ผู้ถือศีล',
    desc: 'บทสวดที่ยิ่งรอยิ่งแรง เลือกว่าจะรอกี่เทิร์น ตั้งเกราะแล้วหมุนธรรมจักร',
    passiveName: 'อานิสงส์',
    passiveDesc: 'ฟื้นพลังชีวิต 6 ทุกครั้งที่ชนะไฟต์',
  },

  medium: {
    id: 'medium',
    startHp: CLASS_RESOURCES.medium.hp,
    startMana: CLASS_RESOURCES.medium.startMana,
    name: 'คนทรง',
    title: 'ผู้เชิญวิญญาณ',
    desc: 'ยืมท่าที่ผีเพิ่งใช้มาเป็นของตัวเอง วางพิษแล้วซ้ำแผล',
    passiveName: 'ผีติดตาม',
    passiveDesc: 'เริ่มทุกไฟต์ด้วยการ์ดป้องกัน 4',
  },
};

export const ALL_CLASS_IDS = Object.keys(CHARACTER_CLASSES) as ClassId[];

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

/**
 * พรติดตัวของคลาส ที่ทำงานตอนเริ่มไฟต์
 * (ส่วนที่ทำงานตอนชนะไฟต์อยู่ใน applyClassVictoryPassive)
 */
export function applyClassCombatStart(s: GameState): void {
  const cls = getClass(s.classId);

  switch (cls.id) {
    case 'shaman':
      s.player.mana += 1;
      break;

    case 'warrior':
      s.player.block = (s.player.block ?? 0) + 6;
      break;

    case 'medium':
      // Interim until the borrow-cards redesign: a small opening guard.
      s.player.block = (s.player.block ?? 0) + 6;
      break;

    case 'nun':
      // อานิสงส์ทำงานตอนชนะไฟต์ ไม่ใช่ตอนเริ่ม
      break;
  }
}

/** พรติดตัวที่ทำงานตอนชนะไฟต์ */
export function applyClassVictoryPassive(s: GameState): void {
  const cls = getClass(s.classId);
  if (cls.id !== 'nun') return;

  const before = s.player.hp;
  s.player.hp = Math.min(s.player.maxHp, before + 6);
  const healed = s.player.hp - before;
  if (healed > 0) s.log.push(`อานิสงส์: ฟื้นพลังชีวิต ${healed}`);
}
