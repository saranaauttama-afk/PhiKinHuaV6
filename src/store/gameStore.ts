// app/store/gameStore.ts - Shared game store
import { create } from 'zustand';
import type { Command, GameState } from '../../src/core/types';
import type { ClassId } from '../core/classes';
import { applyCommand } from '../../src/core/reducer';
import { baseNewState } from '../../src/core/commands';
import {
  saveGame, loadGame, getSaveSlots, autoSave, clearAutoSave, type SaveSlotInfo,
} from '../../src/core/storage';
import { AUTO_SAVE_COMMANDS } from '../../src/core/save';
import { HAND_SIZE, START_ENERGY, START_HP } from '../../src/core/balance/core';
import { nextExpForLevel } from '../../src/core/balance/progression';
import { makeRng, seedFromString, type RNG } from '../../src/core/rng';
import { START_GOLD } from '../../src/core/balance';

/**
 * คำสั่งที่ควรเซฟหลังทำ — รายการอยู่ใน `core/save.ts` เพราะมันเป็นนโยบาย
 * การเซฟ ไม่ใช่เรื่องของ UI (และเทสต์ต้องอ่านได้โดยไม่ต้องลาก store มาด้วย)
 */
function shouldAutoSave(cmdType: Command['type']): boolean {
  return (AUTO_SAVE_COMMANDS as readonly string[]).includes(cmdType);
}

type Store = {
  state: GameState;
  rng: RNG;
  dispatch: (cmd: Command) => void;
  newRun: (seed: string, classId?: ClassId) => void;
  saveToSlot: (slot: number) => Promise<void>;
  loadFromSlot: (slot: number) => Promise<void>;
  continueRun: () => Promise<boolean>;
  getSaveSlots: () => Promise<SaveSlotInfo[]>;
  autoSaveEnabled: boolean;
};

/**
 * สถานะตอนเปิดแอป
 *
 * ใช้ `baseNewState` ตัวเดียวกับที่ engine ใช้ ไม่ก๊อปมาไว้เอง
 *
 * เดิมฟังก์ชันนี้เขียน state ขึ้นมาเองทั้งก้อน รวมถึงก๊อปข้อมูลการ์ด 6 ใบ
 * มาแปะไว้ตรงๆ (ซึ่งเก่ากว่า `cards.json` ไปแล้ว) และตั้ง `phase: 'menu'`
 * ขณะที่ทั้งเกมใช้ `'start'` เป็น phase ตั้งต้น — ผลคือเปิดแอปมาแล้ว
 * หน้าเริ่มเกมไม่ขึ้น ตกไปที่หน้าแผนที่เปล่าๆ ที่กดอะไรไม่ได้เลย
 */
const makeEmptyState = (): GameState => baseNewState('');

export const useGame = create<Store>((set, get) => ({
  state: makeEmptyState(),
  rng: makeRng('demo-001'),
  autoSaveEnabled: true,

  dispatch: (cmd: Command) => {
    const { state, rng } = get();
    const result = applyCommand(state, cmd, rng);
    set({ state: result.state, rng: result.rng });

    if (!get().autoSaveEnabled) return;

    // รันจบแล้ว (ชนะหรือแพ้) — ลบเซฟค้างทิ้ง
    // ไม่งั้นปุ่ม "เดินทางต่อ" จะพากลับเข้ารันเดิม: ตายแล้วย้อนไปยืนก่อนไฟต์ที่ตาย
    // ซึ่งแปลว่าแพ้ได้ไม่จำกัดครั้ง การตายจึงไม่มีความหมายอะไรเลย
    if (result.state.runSummary) {
      setTimeout(() => { void clearAutoSave(); }, 0);
      return;
    }

    if (shouldAutoSave(cmd.type)) {
      setTimeout(() => autoSave(result.state), 100);
    }
  },

  newRun: (seed: string, classId?: ClassId) => {
    // ต้องผ่านคำสั่ง NewRun จริง ไม่ใช่สร้าง state เปล่าเอง
    // เดิมตั้ง phase เป็น 'menu' ตรงๆ ทำให้ข้ามการเซ็ตอัพรันทั้งหมด
    // (เด็คตั้งต้น, pages, พรตั้งต้น) หน้าเลือกพรจึงไม่มีทางขึ้น
    const newRng = makeRng(seed);
    const result = applyCommand(makeEmptyState(), { type: 'NewRun', seed, classId }, newRng);
    set({ state: result.state, rng: result.rng });
  },

  saveToSlot: async (slot: number) => {
    const { state } = get();
    await saveGame(state, slot);
  },

  loadFromSlot: async (slot: number) => {
    const loaded = await loadGame(slot);
    if (loaded) {
      const newRng = makeRng(loaded.seed || 'demo-fallback');
      set({ state: loaded, rng: newRng });
    }
  },

  /** เล่นต่อจากเซฟอัตโนมัติ — คืน false ถ้าไม่มีหรือเล่นต่อไม่ได้ */
  continueRun: async () => {
    try {
      const loaded = await loadGame(-1);
      if (!loaded?.journey) return false;
      set({ state: loaded, rng: makeRng(loaded.seed || 'demo-fallback') });
      return true;
    } catch {
      return false;
    }
  },

  getSaveSlots: async () => {
    return await getSaveSlots();
  }
}));