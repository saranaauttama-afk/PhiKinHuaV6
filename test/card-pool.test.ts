// test/card-pool.test.ts — ความถูกต้องของ "คลังการ์ด" ทั้งก้อน
//
// คลังการ์ดคือไฟล์ JSON สี่ไฟล์ที่ไม่มี TypeScript คุมอยู่เลย (pack.ts cast เป็น
// `any` ทั้งหมด) พิมพ์ id ผิด ใส่ชื่อสถานะที่ไม่มีจริง หรืออ้างผีที่ไม่มีอยู่
// จะไม่พังตอน build — มันพังเงียบๆ ตอนผู้เล่นกดการ์ดใบนั้น
//
// เทสต์ชุดนี้แทนที่ type checker สำหรับไฟล์ข้อมูล

import { describe, it, expect } from 'vitest';

import cardsJson from '../src/data/packs/base/cards.json';
import classCardsJson from '../src/data/packs/base/class_cards.json';
import trapCardsJson from '../src/data/packs/base/trap_cards.json';
import curseCardsJson from '../src/data/packs/base/curse_cards.json';
import equipmentJson from '../src/data/packs/base/equipment.json';

import { THAI_MINIONS } from '../src/core/combat/minions/thai-minions';
import { STATUS_EFFECTS_REGISTRY } from '../src/core/combat/status-effects/registry';
import { equipmentBehaviorIds } from '../src/core/equipmentRuntime';
import { CHARACTER_CLASSES } from '../src/core/classes';
import { BY_RARITY } from '../src/core/pack';

type AnyCard = Record<string, any>;

const PLAYABLE: AnyCard[] = [
  ...(cardsJson as AnyCard[]),
  ...(classCardsJson as AnyCard[]),
  ...(trapCardsJson as AnyCard[]),
];
const ALL: AnyCard[] = [...PLAYABLE, ...(curseCardsJson as AnyCard[])];

const KNOWN_STATUS = new Set(Object.keys(STATUS_EFFECTS_REGISTRY));
const CLASS_TAGS = Object.keys(CHARACTER_CLASSES);
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Legendary'] as const;

describe('คลังการ์ด — ความถูกต้องของข้อมูล', () => {
  it('id ไม่ซ้ำกันข้ามไฟล์', () => {
    // เคยชนกันจริง: `salt_circle` เป็นทั้งการ์ดสกิลของหมอผีและการ์ดดักของแม่ชี
    // `cardById` คืนใบแรกที่เจอ อีกใบจึงกลายเป็นการ์ดที่หยิบขึ้นมาไม่ได้
    const seen = new Map<string, number>();
    for (const c of ALL) seen.set(c.id, (seen.get(c.id) ?? 0) + 1);
    const dup = [...seen].filter(([, n]) => n > 1).map(([id]) => id);
    expect(dup, `id ซ้ำ: ${dup.join(', ')}`).toEqual([]);
  });

  it('ทุกใบมีแท็กคลาสเดียว', () => {
    for (const c of PLAYABLE) {
      const mine = (c.tags ?? []).filter((t: string) => CLASS_TAGS.includes(t));
      expect(mine.length, `${c.id} มีแท็กคลาส ${mine.length} อัน (${mine.join(',')})`).toBe(1);
    }
  });

  it('statusEffect อ้างชื่อสถานะที่มีอยู่จริง', () => {
    for (const c of ALL) {
      const se = c.statusEffect;
      if (!se) continue;
      expect(KNOWN_STATUS.has(se.effect), `${c.id} อ้างสถานะ "${se.effect}" ที่ไม่มีในระบบ`)
        .toBe(true);
      expect(['player', 'enemy'], `${c.id} statusEffect.target ผิด`).toContain(se.target);
    }
  });

  it('กับดักอ้างชื่อสถานะที่มีอยู่จริง', () => {
    for (const c of trapCardsJson as AnyCard[]) {
      for (const e of c.trap?.effects ?? []) {
        if (e.type !== 'status') continue;
        expect(KNOWN_STATUS.has(e.statusId), `${c.id} อ้างสถานะ "${e.statusId}" ที่ไม่มีในระบบ`)
          .toBe(true);
      }
    }
  });

  it('summonMinion อ้างผีที่มีอยู่จริง', () => {
    for (const c of PLAYABLE) {
      if (!c.summonMinion) continue;
      expect(THAI_MINIONS[c.summonMinion], `${c.id} เรียกผี "${c.summonMinion}" ที่ไม่มีในคลัง`)
        .toBeDefined();
    }
  });

  it('การ์ดติดตั้งอ้างของประจำกายที่มีอยู่จริง', () => {
    const ids = new Set((equipmentJson as AnyCard[]).map(e => e.id));
    for (const c of PLAYABLE) {
      if (c.type !== 'equipment') continue;
      expect(c.equipmentId, `${c.id} เป็นการ์ดติดตั้งแต่ไม่ได้ระบุ equipmentId`).toBeTruthy();
      expect(ids.has(c.equipmentId), `${c.id} อ้างของ "${c.equipmentId}" ที่ไม่มีในไฟล์ข้อมูล`)
        .toBe(true);
    }
  });

  it('ของประจำกายทุกชิ้นทำอะไรได้จริง', () => {
    // `nang_tani_skull` เคยอยู่ใน registry แต่ตัว behavior เป็นอ็อบเจ็กต์ว่าง —
    // ของ Rare ที่ผู้เล่นซื้อมาแล้วไม่มีอะไรเกิดขึ้นเลย
    const withBehavior = new Set(equipmentBehaviorIds());
    const dead = (equipmentJson as AnyCard[])
      .map(e => e.id)
      .filter(id => !withBehavior.has(id));
    expect(dead, `ของที่ไม่มี behavior: ${dead.join(', ')}`).toEqual([]);
  });

  it('คำสาปอยู่นอกคลังปกติ — ซื้อไม่ได้ ได้เป็นรางวัลไม่ได้', () => {
    const curseIds = new Set((curseCardsJson as AnyCard[]).map(c => c.id));
    const inPool = RARITIES.flatMap(r => BY_RARITY[r]).filter(c => curseIds.has(c.id));
    expect(inPool.map(c => c.id)).toEqual([]);
  });
});

describe('คลังการ์ด — ทุกคลาสมีของให้เจอจริง', () => {
  // รางวัลและร้านกรองตามแท็กคลาส (ดู `rollThreeCards`) ถ้าคลาสไหนไม่มีการ์ด
  // ระดับนั้นเลย การสุ่มจะ fall through ลงไป Common ทุกครั้ง — ผู้เล่นเลเวล 7+
  // ที่เล่นคลาสนั้นจะไม่มีวันเห็นการ์ดหายาก และไม่มีอะไรบอกว่าเกิดอะไรขึ้น
  for (const tag of CLASS_TAGS) {
    for (const rarity of RARITIES) {
      it(`${tag} มีการ์ดระดับ ${rarity} อย่างน้อยหนึ่งใบ`, () => {
        const n = PLAYABLE.filter(
          c => c.rarity === rarity && (c.tags ?? []).includes(tag)
        ).length;
        expect(n, `${tag} ไม่มีการ์ด ${rarity} เลย`).toBeGreaterThan(0);
      });
    }

    it(`${tag} มีของประจำกายของตัวเอง`, () => {
      const n = (equipmentJson as AnyCard[]).filter(e => (e.tags ?? []).includes(tag)).length;
      expect(n, `${tag} ไม่มี equipment เลย`).toBeGreaterThan(0);
    });

    it(`${tag} มีคลังการ์ดกว้างพอให้เด็คสองรันไม่เหมือนกัน`, () => {
      const n = PLAYABLE.filter(c => (c.tags ?? []).includes(tag)).length;
      expect(n, `${tag} มีแค่ ${n} ใบ`).toBeGreaterThanOrEqual(18);
    });
  }
});
