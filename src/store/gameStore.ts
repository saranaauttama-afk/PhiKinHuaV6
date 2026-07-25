// app/store/gameStore.ts - Shared game store
import { create } from 'zustand';
import type { Command, GameState } from '../../src/core/types';
import type { ClassId } from '../core/classes';
import { applyCommand } from '../../src/core/reducer';
import { saveGame, loadGame, getSaveSlots, autoSave, type SaveSlotInfo } from '../../src/core/storage';
import { HAND_SIZE, START_ENERGY, START_HP } from '../../src/core/balance/core';
import { nextExpForLevel } from '../../src/core/balance/progression';
import { makeRng, seedFromString, type RNG } from '../../src/core/rng';
import { START_GOLD } from '../../src/core/balance';

// Commands that should trigger auto-save
function shouldAutoSave(cmdType: Command['type']): boolean {
  const autoSaveCommands: Command['type'][] = [
    'CompleteNode', 'ChooseLevelUp', 'TakeShop', 'EventChooseBlessing',
    'ChooseOffer', 'Proceed', 'ShopRemoveBuy', 'ShopUpgradeBuy'
  ];
  return autoSaveCommands.includes(cmdType);
}

type Store = {
  state: GameState;
  rng: RNG;
  dispatch: (cmd: Command) => void;
  newRun: (seed: string, classId?: ClassId) => void;
  saveToSlot: (slot: number) => Promise<void>;
  loadFromSlot: (slot: number) => Promise<void>;
  getSaveSlots: () => Promise<SaveSlotInfo[]>;
  autoSaveEnabled: boolean;
};

const makeEmptyState = (): GameState => {
  // Real card data from the game
  const realCards = [
    {
      id: "bamboo_dart",
      name: "ปาไผ่เผา",
      type: "attack" as const,
      cost: 0,
      dmg: 5,
      rarity: "Common" as const,
      tags: ["attack", "thai", "shaman", "burn"],
      desc: "ปาไผ่เผาใส่ศัตรู สร้างความเสียหาย 5 และเผาไหม้ 2 ดาเมจต่อเทิร์น เป็นเวลา 2 เทิร์น"
    },
    {
      id: "holy_powder",
      name: "ผงเจ้าพ่อ",
      type: "skill" as const,
      cost: 0,
      block: 4,
      rarity: "Common" as const,
      tags: ["block", "thai", "shaman", "curse"],
      desc: "โรยผงเจ้าพ่อป้องกัน Block 4 หากศัตรูโจมตี ศัตรูจะได้รับคำสาป"
    },
    {
      id: "cooling_cloth",
      name: "ผ้าเย็น",
      type: "skill" as const,
      cost: 0,
      block: 5,
      rarity: "Common" as const,
      tags: ["block", "thai", "shaman", "cleanse"],
      desc: "ใช้ผ้าเย็นปิดหน้า Block 5 และล้างสถานะลบทั้งหมด"
    },
    {
      id: "bell_sound",
      name: "เสียงระฆัง",
      type: "skill" as const,
      cost: 1,
      block: 6,
      rarity: "Common" as const,
      tags: ["block", "thai", "shaman", "weaken"],
      desc: "ส่งเสียงระฆังผีป่าย Block 6 และทำให้ศัตรู Weak 1 เทิร์น"
    },
    {
      id: "cursed_needle",
      name: "เสกเข็มปัก",
      type: "attack" as const,
      cost: 1,
      dmg: 7,
      rarity: "Common" as const,
      tags: ["attack", "thai", "shaman", "conditional"],
      desc: "เสกเข็มปักผี 7 ดาเมจ หากศัตรูมีสถานะลบ +4 ดาเมจ"
    },
    {
      id: "meditation",
      name: "นั่งสมาธิ",
      type: "skill" as const,
      cost: 0,
      draw: 1,
      energyGain: 1,
      rarity: "Common" as const,
      tags: ["thai", "shaman", "draw", "energy"],
      desc: "นั่งสมาธิสงบจิต จั่วการ์ด 1 ใบ และได้ Energy +1"
    }
  ];

  return {
    seed: '',
    phase: 'menu',
    turn: 0,
    player: {
      hp: START_HP, maxHp: START_HP, block: 0,
      energy: START_ENERGY, gold: START_GOLD,
      level: 1, exp: 0, expToNext: nextExpForLevel(1),
      maxEnergy: START_ENERGY, maxHandSize: HAND_SIZE,
    },
    enemy: undefined,
    fightCount: 0,
    piles: { draw: realCards.slice(0, 3), hand: realCards.slice(3, 6), discard: [], exhaust: [] },
    log: [],
    blessings: [],
    turnFlags: { blessingOnce: {} },
    runCounters: { removed: 0 },
    masterDeck: realCards,
    deckOpen: false,
    shopRegistry: [],
  };
};

export const useGame = create<Store>((set, get) => ({
  state: makeEmptyState(),
  rng: makeRng('demo-001'),
  autoSaveEnabled: true,

  dispatch: (cmd: Command) => {
    const { state, rng } = get();
    const result = applyCommand(state, cmd, rng);
    set({ state: result.state, rng: result.rng });

    if (get().autoSaveEnabled && shouldAutoSave(cmd.type)) {
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

  getSaveSlots: async () => {
    return await getSaveSlots();
  }
}));