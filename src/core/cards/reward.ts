// src/core/cards/reward.ts — การ์ดรางวัลหลังชนะไฟต์
//
// ก่อนหน้านี้การ์ดใหม่มาจากทางเดียว: ตัวเลือก `cards` ตอนเลเวลอัป ซึ่งเป็น
// 2 ใน 10 คู่ของ `CHOICE_PAIRS` — วัดจริง 5 seed × 4 คลาส เดินจนจบรันโดยเลือก
// การ์ดทุกครั้งที่มีให้เลือก ได้ผลว่าสำรับโต **11.0 → 12.6 ใบ** ตลอดทั้งรัน
//
// คลังการ์ดมี 97 ใบ แต่ผู้เล่นแตะได้จริงรันละ ~2 ใบ นั่นไม่ใช่ปัญหาของคลัง
// มันคือปัญหาของช่องทางได้การ์ด
//
// Night of the Full Moon (และ Slay the Spire) แยกการ์ดออกมาเป็นรางวัลของ
// **การชนะไฟต์** ไม่ผูกกับเลเวลอัป ชนะแล้วเลือก 1 ใน 3 หรือไม่เอาก็ได้
// 15 ไฟต์ต่อรัน = สำรับไต่จาก 11 ไปแตะ 20 กว่าใบ ซึ่งเป็นช่วงที่การ "เลือก
// ไม่เอา" เริ่มมีความหมาย — สำรับใหญ่ขึ้นหนึ่งใบคือโอกาสจั่วเจอใบที่ต้องการ
// ลดลงทุกใบ

import type { CardData, GameState } from '../types';
import type { RNG } from '../rng';
import { rollThreeCards } from '../level';
import { getClass } from '../classes';
import { rollNightCards } from '../campaign/rewards';
import { ultimateRequired } from '../campaign/threeNight';

export type CardReward = {
  /** การ์ดที่เสนอให้เลือก */
  choices: CardData[];
  growth?: Array<'retain'|'draw'>;
};

/** จำนวนใบที่เสนอให้เลือกต่อไฟต์ */
export const REWARD_CHOICE_COUNT = 3;

/**
 * ชนะไฟต์แล้ว — เตรียมการ์ดให้เลือก
 *
 * เรียกจากจุดเดียว (`grantExpAndQueueLevelUp`) เพื่อให้ไม่มีทางที่ไฟต์ไหน
 * ชนะแล้วไม่ได้รางวัล ซึ่งเป็นแบบที่พลาดง่ายที่สุดเวลาการตรวจชนะมีหลายที่
 */
export function rollCardReward(s: GameState, r: RNG): RNG {
  // บอสสุดท้ายไม่ต้องมีการ์ดให้เลือก — รันจบตรงนั้น การ์ดที่หยิบมาไม่มีที่ใช้
  // และการเอาหน้าเลือกของมาคั่นก่อนจอสรุปทำให้จังหวะจบเรื่องสะดุด
  // (เดิมเช็ค fightCount >= 15 จากโหมดเก่า ทำให้รันสามคืนไม่ได้การ์ดเลยหลังศึกที่ 15)
  const active = s.pages?.current?.offers[s.pages?._activeOfferIndex ?? -1];
  if (active?.kind === 'boss' && (active.bossType === 'secret' || (s.campaign?.night === 3 && !ultimateRequired(s)))) return r;

  const out = (s.campaign ? rollNightCards(s,r) : undefined) 
    ?? rollThreeCards(r, s.player.level, s.classId,s.campaign?.milestoneLevel??0);
  if (out.list.length > 0) {
    s.cardReward = { choices: out.list };
    if(active?.kind==='boss'&&(s.campaign?.night??3)<3){
      const caps=require('../balance/notfm').LEVEL_UP.caps;
      s.cardReward.growth=[];
      if((s.player.retain??2)<caps.retain)s.cardReward.growth.push('retain');
      if(s.player.drawPerTurn<caps.draw)s.cardReward.growth.push('draw');
    }
  }
  return out.rng;
}

/**
 * หยิบใบที่เลือกเข้าสำรับ — คืนค่าว่าหยิบได้จริงไหม
 *
 * โคลนก่อนใส่ เพราะการ์ดในพูลเป็นอ็อบเจ็กต์ที่ใช้ร่วมกันทั้งเกม
 * ถ้าใส่ตัวเดียวกันเข้าไปแล้วไปปลุกเสกทีหลัง มันจะปลุกเสกให้ทั้งพูล
 */
export function takeCardReward(s: GameState, index: number): boolean {
  const card = s.cardReward?.choices[index];
  if (!card) return false;

  s.masterDeck.push(JSON.parse(JSON.stringify(card)) as CardData);
  s.log.push(`ได้ ${card.name} เข้าสำรับ (${s.masterDeck.length} ใบ)`);
  s.cardReward = undefined;
  return true;
}

/** ไม่เอาสักใบ — สำรับเล็กคือความได้เปรียบอย่างหนึ่ง ไม่ใช่การเสียโอกาส */
export function skipCardReward(s: GameState): void {
  if (!s.cardReward) return;
  s.cardReward = undefined;
  s.log.push(`ไม่หยิบการ์ดใบไหน (สำรับ ${s.masterDeck.length} ใบ)`);
}
