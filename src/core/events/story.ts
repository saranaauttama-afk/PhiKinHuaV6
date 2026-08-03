// src/core/events/story.ts — เหตุการณ์ระหว่างทางที่เล่าเป็นเรื่อง ไม่ใช่ปุ่มฟังก์ชัน
//
// ชั้นพักเดิมมีแต่ ร้าน / บ่อน้ำ / หีบ ซึ่งเป็น **ฟังก์ชัน** ทั้งหมด — เดินไปกดใช้
// แล้วเดินต่อ ไม่มีจังหวะไหนที่ผู้เล่นต้องตัดสินใจอะไรที่มีน้ำหนัก
//
// เหตุการณ์แบบเล่าเรื่องคือส่วนที่ทำให้ Night of the Full Moon รู้สึกเป็น "การเดินทาง
// ที่มีเรื่องเกิดขึ้น" ไม่ใช่ลำดับห้องต่อสู้: มาถึงฉากหนึ่ง อ่านสิ่งที่เห็น แล้วเลือก
// ว่าจะทำอะไร โดยแต่ละทางแลกกันคนละอย่าง และบางทางเปิดเฉพาะบางคน

import type { GameState } from '../types';
import type { RNG } from '../rng';
import { int } from '../rng';
import type { ClassId } from '../classes';

export type EventEffect =
  /** เลือดตอนนี้ (ติดลบ = เสีย) */
  | { kind: 'hp'; amount: number }
  /** เลือดสูงสุด */
  | { kind: 'maxHp'; amount: number }
  | { kind: 'gold'; amount: number }
  /** ได้การ์ดใบที่ระบุ */
  | { kind: 'card'; cardId: string }
  /** ได้การ์ดสุ่มที่เหมาะกับคลาสและเลเวลตอนนี้ */
  | { kind: 'randomCard' }
  /** ถอดการ์ดสุ่มออกจากสำรับหนึ่งใบ */
  | { kind: 'removeRandomCard' }
  | { kind: 'blessing' };

export type EventRequirement =
  | { kind: 'gold'; min: number }
  | { kind: 'class'; classId: ClassId }
  /** เลือดต้องเหลืออย่างน้อยกี่ส่วน (0-1) */
  | { kind: 'hpRatio'; min: number };

export type EventChoice = {
  label: string;
  /** เงื่อนไขที่ต้องผ่านถึงจะเลือกได้ — ไม่ผ่านก็ยังเห็น แต่กดไม่ได้ */
  requires?: EventRequirement[];
  /** ข้อความหลังเลือก (ใช้เมื่อไม่มี branches) */
  text?: string;
  effects?: EventEffect[];
  /** ผลแบบเสี่ยงดวง — สุ่มหนึ่งกิ่งตามน้ำหนัก */
  branches?: Array<{ weight: number; text: string; effects: EventEffect[] }>;
};

export type StoryEvent = {
  id: string;
  title: string;
  /** สิ่งที่ผู้เล่นเห็นเมื่อมาถึง */
  text: string;
  choices: EventChoice[];
};

export const STORY_EVENTS: StoryEvent[] = require('../../data/packs/base/story_events.json');

export const STORY_EVENT_BY_ID: Record<string, StoryEvent> = Object.fromEntries(
  STORY_EVENTS.map(e => [e.id, e])
);

export function getStoryEvent(id: string): StoryEvent | undefined {
  return STORY_EVENT_BY_ID[id];
}

/** เลือกทางนี้ได้ไหม — คืนเหตุผลไว้ให้ UI บอกผู้เล่นว่าทำไมยังกดไม่ได้ */
export function choiceLocked(s: GameState, choice: EventChoice): string | null {
  for (const req of choice.requires ?? []) {
    switch (req.kind) {
      case 'gold':
        if ((s.player.gold ?? 0) < req.min) return `ต้องมีทองอย่างน้อย ${req.min}`;
        break;
      case 'class':
        if (s.classId !== req.classId) return 'ไม่ใช่วิชาของเรา';
        break;
      case 'hpRatio': {
        const ratio = s.player.hp / Math.max(1, s.player.maxHp);
        if (ratio < req.min) return 'เลือดไม่พอจะเสี่ยง';
        break;
      }
    }
  }
  return null;
}

/** ใช้ผลหนึ่งอย่าง — คืน rng ตัวใหม่เสมอ เพื่อให้ทั้งรันยังซ้ำได้ตาม seed */
export function applyEffect(s: GameState, eff: EventEffect, r: RNG): RNG {
  switch (eff.kind) {
    case 'hp': {
      const before = s.player.hp;
      s.player.hp = Math.max(0, Math.min(s.player.maxHp, s.player.hp + eff.amount));
      s.log.push(`เลือด ${before} → ${s.player.hp}`);
      return r;
    }

    case 'maxHp': {
      s.player.maxHp = Math.max(1, s.player.maxHp + eff.amount);
      // เลือดสูงสุดลดแล้วเลือดตอนนี้ต้องไม่ค้างเกินเพดานใหม่
      s.player.hp = Math.min(s.player.hp, s.player.maxHp);
      s.log.push(`เลือดสูงสุดเป็น ${s.player.maxHp}`);
      return r;
    }

    case 'gold': {
      s.player.gold = Math.max(0, (s.player.gold ?? 0) + eff.amount);
      s.log.push(`ทอง ${s.player.gold}`);
      return r;
    }

    case 'card': {
      const { ALL_CARDS } = require('../pack');
      const found = ALL_CARDS.find((c: any) => c.id === eff.cardId);
      if (found) {
        s.masterDeck = [...(s.masterDeck ?? []), { ...found }];
        s.log.push(`ได้การ์ด ${found.name}`);
      } else {
        s.log.push(`หาการ์ด ${eff.cardId} ไม่เจอ`);
      }
      return r;
    }

    case 'randomCard': {
      const { rollThreeCards } = require('../level');
      const { getClass } = require('../classes');
      const tag = getClass(s.classId).cardTag;
      const out = rollThreeCards(r, s.player.level ?? 1, tag);
      const pick = out.list[0];
      if (pick) {
        s.masterDeck = [...(s.masterDeck ?? []), { ...pick }];
        s.log.push(`ได้การ์ด ${pick.name}`);
      }
      return out.rng;
    }

    case 'removeRandomCard': {
      const deck = s.masterDeck ?? [];
      if (deck.length === 0) return r;
      const roll = int(r, 0, deck.length - 1);
      const [gone] = deck.splice(roll.value, 1);
      s.masterDeck = deck;
      s.log.push(`${gone.name} หลุดจากสำรับ`);
      return roll.rng;
    }

    case 'blessing': {
      const { rollTwoBlessings } = require('../level');
      const { grantBlessing } = require('../engine/shared');
      const out = rollTwoBlessings(r, (s.blessings ?? []).map(x => x.id));
      const b = out.list[0];
      if (b && grantBlessing(s, b)) {
        s.log.push(`ได้พร ${b.name ?? b.id}`);
      } else {
        // คลังพรหมดแล้ว — ให้ทองแทน ดีกว่าเหตุการณ์ที่กดแล้วไม่มีอะไรเกิดขึ้น
        s.player.gold = (s.player.gold ?? 0) + 40;
        s.log.push('ไม่มีพรใหม่เหลือแล้ว — ได้ทรัพย์ 40 แทน');
      }
      return out.rng;
    }
  }
}

export type ChoiceResult = { text: string; rng: RNG };

/**
 * ลงมือทำตามทางที่เลือก
 *
 * กิ่งแบบสุ่มถูกทอยที่นี่ ไม่ใช่ตอนสร้างแผนที่ — ผู้เล่นถึงจะรู้สึกว่ากำลังเสี่ยงจริง
 * แต่ยังใช้ rng ที่ร้อยมา ทั้งรันจึงยังซ้ำได้ตาม seed
 */
export function applyChoice(s: GameState, choice: EventChoice, r: RNG): ChoiceResult {
  let effects = choice.effects ?? [];
  let text = choice.text ?? '';

  if (choice.branches && choice.branches.length > 0) {
    const total = choice.branches.reduce((a, b) => a + b.weight, 0);
    const roll = int(r, 1, Math.max(1, total));
    r = roll.rng;

    let acc = 0;
    let picked = choice.branches[choice.branches.length - 1];
    for (const br of choice.branches) {
      acc += br.weight;
      if (roll.value <= acc) { picked = br; break; }
    }
    effects = picked.effects;
    text = picked.text;
  }

  for (const eff of effects) r = applyEffect(s, eff, r);

  return { text, rng: r };
}
