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

export type ClassId = 'shaman' | 'warrior' | 'nun' | 'medium';

export type CharacterClass = {
  id: ClassId;
  name: string;
  title: string;
  desc: string;
  /** แท็กของการ์ดที่คลาสนี้เจอในร้านและรางวัล */
  cardTag: string;
  startHp: number;
  startEnergy: number;
  startHandSize: number;
  /** เด็คตั้งต้น: id ของการ์ด → จำนวนใบ */
  starterDeck: Record<string, number>;
  /** ข้อความอธิบายกลไกเฉพาะตัว */
  passiveName: string;
  passiveDesc: string;
};

export const CHARACTER_CLASSES: Record<ClassId, CharacterClass> = {
  shaman: {
    id: 'shaman',
    name: 'หมอผี',
    title: 'ผู้สาปและผู้แก้สาป',
    desc: 'ใช้คาถา พิษ และของขลัง บั่นทอนศัตรูทีละน้อยจนหมดแรง',
    cardTag: 'shaman',
    startHp: 50,
    startEnergy: 3,
    startHandSize: 5,
    starterDeck: {
      bamboo_dart: 4,
      cooling_cloth: 4,
      meditation: 1,
      direct_poison_spell: 1,
      create_kuman: 1,
    },
    passiveName: 'ครูพักลักจำ',
    passiveDesc: 'เทิร์นแรกของทุกไฟต์ได้พลังงานเพิ่ม 1',
  },

  warrior: {
    id: 'warrior',
    name: 'นักรบวัด',
    title: 'ผู้ยืนหยัด',
    desc: 'เลือดหนา ตั้งการ์ดแน่น สวนกลับหนัก เหมาะกับคนที่ชอบปะทะตรงๆ',
    cardTag: 'warrior',
    startHp: 66,
    startEnergy: 3,
    startHandSize: 5,
    starterDeck: {
      temple_blade: 4,
      muay_stance: 4,
      parry_step: 1,
      thunder_clap: 1,
      fighter_breath: 1,
    },
    passiveName: 'ยืนเฝ้าประตู',
    passiveDesc: 'เริ่มทุกไฟต์ด้วยการ์ดป้องกัน 6',
  },

  nun: {
    id: 'nun',
    name: 'แม่ชี',
    title: 'ผู้ถือศีล',
    desc: 'ดาเมจไม่สูง แต่ยืนระยะยาวได้ดีที่สุด ฟื้นเลือดข้ามไฟต์',
    cardTag: 'nun',
    startHp: 44,
    startEnergy: 3,
    startHandSize: 6,
    starterDeck: {
      chant_sutra: 3,
      dharma_wheel: 3,
      holy_water: 2,
      loving_kindness: 1,
      alms_offering: 1,
      dispel_ill: 1,
    },
    passiveName: 'อานิสงส์',
    passiveDesc: 'ฟื้นพลังชีวิต 4 ทุกครั้งที่ชนะไฟต์',
  },

  medium: {
    id: 'medium',
    name: 'คนทรง',
    title: 'ผู้เชิญวิญญาณ',
    desc: 'สู้ด้วยผีคู่กาย ยิ่งเรียกมาก ยิ่งได้เปรียบ แต่ตัวเองบอบบาง',
    cardTag: 'medium',
    startHp: 46,
    startEnergy: 4,
    startHandSize: 5,
    starterDeck: {
      whisper_ear: 3,
      yantra_cloth: 3,
      invite_spirit: 2,
      set_altar: 1,
      phrai_oil: 1,
    },
    passiveName: 'ผีติดตาม',
    passiveDesc: 'เริ่มทุกไฟต์พร้อมวิญญาณคู่กาย 1 ตน',
  },
};

export const ALL_CLASS_IDS = Object.keys(CHARACTER_CLASSES) as ClassId[];

export function getClass(id?: ClassId): CharacterClass {
  return CHARACTER_CLASSES[id ?? 'shaman'] ?? CHARACTER_CLASSES.shaman;
}

/** สร้างเด็คตั้งต้นของคลาสจากคลังการ์ดทั้งหมด */
export function buildStarterDeck(cls: CharacterClass, allCards: CardData[]): CardData[] {
  const byId = new Map(allCards.map(c => [c.id, c]));
  const deck: CardData[] = [];

  for (const [cardId, count] of Object.entries(cls.starterDeck)) {
    const card = byId.get(cardId);
    if (!card) continue; // การ์ดหาย — ข้ามไปแทนที่จะพังทั้งรัน
    for (let i = 0; i < count; i++) deck.push(JSON.parse(JSON.stringify(card)));
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
      s.player.energy = (s.player.energy ?? 0) + 1;
      break;

    case 'warrior':
      s.player.block = (s.player.block ?? 0) + 6;
      break;

    case 'medium': {
      const { summonMinion } = require('./minionRuntime');
      summonMinion(s, 'ghost_ally', 'player', 1);
      break;
    }

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
  s.player.hp = Math.min(s.player.maxHp, before + 4);
  const healed = s.player.hp - before;
  if (healed > 0) s.log.push(`อานิสงส์: ฟื้นพลังชีวิต ${healed}`);
}
