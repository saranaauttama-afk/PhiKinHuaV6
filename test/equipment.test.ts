// test/equipment.test.ts — ของประจำกาย
//
// ระบบนี้อยู่ในเกมมานานโดยไม่มีเทสต์เลย และมีของสองชิ้นที่ไม่ทำงานจริง:
// `luang_pu_amulet` มี behavior แต่ hook `on_damage_dealt` ไม่เคยถูกเรียกจากที่ไหน
// ส่วน `nang_tani_skull` อยู่ใน registry แต่ตัว behavior เป็นอ็อบเจ็กต์ว่าง
//
// เทสต์ชุดนี้จับทั้งสองแบบ: ของทำงานถูกไหม และ hook ถูกยิงจริงไหม

import { describe, it, expect } from 'vitest';
import type { EquipmentData, GameState } from '../src/core/types';
import { dealDamage } from '../src/core/combat/damage';
import { getStatusEffectStacks } from '../src/core/combat/status-effects';
import {
  runEquipmentOnBattleStart,
  runEquipmentTurnHook,
  runEquipmentCardPlayed,
} from '../src/core/equipmentRuntime';
import { getEquipmentById } from '../src/core/pack';
import { getPlayerMinions } from '../src/core/minionRuntime';
import { makeCombatState, attackCard } from './helpers';

/** ใส่ของให้ผู้เล่นจริงๆ ผ่านข้อมูลในไฟล์ pack ไม่ใช่ของปลอมที่เขียนในเทสต์ */
function equip(s: GameState, id: string) {
  const data = getEquipmentById(id);
  expect(data, `ไม่มีของชื่อ ${id} ในไฟล์ข้อมูล`).toBeDefined();
  s.equipped = [...(s.equipped ?? []), data as EquipmentData];
  s.equipmentSlotsMax = (s.equipmentSlotsMax ?? 0) + (data!.slotCost ?? 1);
}

describe('กำไลเหล็ก — ยิ่งเลือดน้อยยิ่งยืนแน่น', () => {
  it('เลือดเกินครึ่ง ไม่ทำงาน', () => {
    const { state } = makeCombatState({ playerHp: 50 });
    state.player.maxHp = 60;
    equip(state, 'iron_bracer');
    runEquipmentTurnHook(state, 'on_turn_start', 'player');
    expect(state.player.block).toBe(0);
  });

  it('เลือดไม่ถึงครึ่ง ได้ Block 8', () => {
    const { state } = makeCombatState({ playerHp: 20 });
    state.player.maxHp = 60;
    equip(state, 'iron_bracer');
    runEquipmentTurnHook(state, 'on_turn_start', 'player');
    expect(state.player.block).toBe(8);
  });

  it('ครึ่งพอดีนับว่าเข้าเงื่อนไข', () => {
    const { state } = makeCombatState({ playerHp: 30 });
    state.player.maxHp = 60;
    equip(state, 'iron_bracer');
    runEquipmentTurnHook(state, 'on_turn_start', 'player');
    expect(state.player.block).toBe(8);
  });
});

describe('ของที่ทำงานตอนเริ่มไฟต์', () => {
  it('กลองศึกให้แข็งแกร่ง 2', () => {
    const { state } = makeCombatState();
    equip(state, 'war_drum_gear');
    runEquipmentOnBattleStart(state, 'player');
    expect(getStatusEffectStacks('player', state, 'strength')).toBe(2);
  });

  it('ผ้าขาวให้ฟื้นฟูต่อเนื่อง 3', () => {
    const { state } = makeCombatState();
    equip(state, 'white_robe');
    runEquipmentOnBattleStart(state, 'player');
    expect(getStatusEffectStacks('player', state, 'regeneration')).toBe(3);
  });

  it('ศาลพระภูมิเรียกผีเฝ้าเรือนมาเป็นของผู้เล่น', () => {
    const { state } = makeCombatState();
    equip(state, 'spirit_house');
    runEquipmentOnBattleStart(state, 'player');
    const mine = getPlayerMinions(state);
    expect(mine.length).toBe(1);
    expect(mine[0].name).toContain('ผู้พิทักษ์ต้นไม้');
  });
});

describe('บาตรพระ — ฟื้นเพิ่มจากการ์ดที่ฟื้นเลือด', () => {
  it('การ์ดที่มี heal ได้เพิ่มอีก 2', () => {
    const { state } = makeCombatState({ playerHp: 20 });
    state.player.maxHp = 60;
    equip(state, 'alms_bowl');
    runEquipmentCardPlayed(state, { id: 'x', type: 'skill', heal: 5 }, 'player');
    expect(state.player.hp).toBe(22);
  });

  it('การ์ดที่ไม่ฟื้นเลือดไม่ได้อะไร', () => {
    const { state } = makeCombatState({ playerHp: 20 });
    state.player.maxHp = 60;
    equip(state, 'alms_bowl');
    runEquipmentCardPlayed(state, attackCard(8), 'player');
    expect(state.player.hp).toBe(20);
  });

  it('เลือดเต็มแล้วไม่ล้นเกิน maxHp', () => {
    const { state } = makeCombatState({ playerHp: 60 });
    state.player.maxHp = 60;
    equip(state, 'alms_bowl');
    runEquipmentCardPlayed(state, { id: 'x', type: 'skill', heal: 5 }, 'player');
    expect(state.player.hp).toBe(60);
  });
});

describe('กระจกผี — สะท้อนกลับ', () => {
  it('ศัตรูตีทะลุ block เข้าตัว → สะท้อนกลับ 2', () => {
    const { state } = makeCombatState({ playerHp: 50, enemyHp: 30 });
    equip(state, 'ghost_mirror');
    dealDamage(state, { from: 'enemy', to: 'player', raw: 10, source: { kind: 'card', cardId: 'e' } });
    expect(state.player.hp).toBe(40);
    expect(state.enemy!.hp).toBe(28);
  });

  it('กัน block ไว้หมด → ไม่มีอะไรให้สะท้อน', () => {
    const { state } = makeCombatState({ playerHp: 50, playerBlock: 20, enemyHp: 30 });
    equip(state, 'ghost_mirror');
    dealDamage(state, { from: 'enemy', to: 'player', raw: 10, source: { kind: 'card', cardId: 'e' } });
    expect(state.player.hp).toBe(50);
    expect(state.enemy!.hp).toBe(30);
  });

  it('เราตีศัตรูเอง ไม่สะท้อนใส่ตัวเอง', () => {
    const { state } = makeCombatState({ playerHp: 50, enemyHp: 30 });
    equip(state, 'ghost_mirror');
    dealDamage(state, { from: 'player', to: 'enemy', raw: 10, source: { kind: 'card', cardId: 'c' } });
    expect(state.player.hp).toBe(50);
    expect(state.enemy!.hp).toBe(20);
  });

  it('ดาเมจสะท้อนไม่ยิง hook ซ้ำจนวนไม่รู้จบ', () => {
    // ถ้า `dealDamage` ไม่กันดาเมจที่มาจากของประจำกายไว้ เทสต์นี้จะ stack overflow
    // แทนที่จะ fail สวยๆ — ซึ่งก็ยังเป็นสัญญาณที่ต้องการอยู่ดี
    const { state } = makeCombatState({ playerHp: 50, enemyHp: 30 });
    equip(state, 'ghost_mirror');
    for (let i = 0; i < 5; i++) {
      dealDamage(state, { from: 'enemy', to: 'player', raw: 4, source: { kind: 'card', cardId: 'e' } });
    }
    expect(state.player.hp).toBe(30);
    expect(state.enemy!.hp).toBe(20);
  });
});

describe('เครื่องรางหลวงปู่ — ลดดาเมจที่รับ', () => {
  it('hook ถูกยิงจริงตอนโดนตี (เดิมไม่มีใครเรียกเลย)', () => {
    const { state } = makeCombatState({ playerHp: 50 });
    equip(state, 'luang_pu_amulet');
    dealDamage(state, { from: 'enemy', to: 'player', raw: 10, source: { kind: 'card', cardId: 'e' } });
    expect(state.player.hp).toBe(41);
  });

  it('หมัดที่พาลงถึงศูนย์ไม่ถูกชุบชีวิตกลับมา', () => {
    const { state } = makeCombatState({ playerHp: 6 });
    equip(state, 'luang_pu_amulet');
    dealDamage(state, { from: 'enemy', to: 'player', raw: 20, source: { kind: 'card', cardId: 'e' } });
    expect(state.player.hp).toBe(0);
  });
});

describe('กะโหลกนางตานี — จั่วเพิ่มต้นเทิร์น', () => {
  it('จั่วขึ้นมาหนึ่งใบจากกองจั่ว', () => {
    const { state } = makeCombatState();
    state.piles.draw = [attackCard(5, { id: 'a' }), attackCard(6, { id: 'b' })];
    equip(state, 'nang_tani_skull');
    runEquipmentTurnHook(state, 'on_turn_start', 'player');
    expect(state.piles.hand.length).toBe(1);
    expect(state.piles.draw.length).toBe(1);
  });

  it('ไม่มีอะไรให้จั่วก็ไม่พัง', () => {
    const { state } = makeCombatState();
    state.piles.draw = [];
    state.piles.discard = [];
    equip(state, 'nang_tani_skull');
    expect(() => runEquipmentTurnHook(state, 'on_turn_start', 'player')).not.toThrow();
    expect(state.piles.hand.length).toBe(0);
  });
});

describe('ช่องของประจำกาย', () => {
  it('ของที่เกินช่องไม่ทำงาน', () => {
    const { state } = makeCombatState();
    equip(state, 'war_drum_gear');
    // ใส่ชิ้นที่สองโดยไม่เพิ่มช่อง
    state.equipped = [...state.equipped!, getEquipmentById('white_robe') as EquipmentData];
    runEquipmentOnBattleStart(state, 'player');
    expect(getStatusEffectStacks('player', state, 'strength')).toBe(2);
    expect(getStatusEffectStacks('player', state, 'regeneration')).toBe(0);
  });
});
