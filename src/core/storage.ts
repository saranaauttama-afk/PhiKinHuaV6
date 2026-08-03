// src/core/storage.ts
// React Native storage utilities for save/load game state

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState } from './types';
import {
  toSave, fromSave, isPlayableSave, summarize,
  type SaveV2, type SaveSummary,
} from './save';

// Storage keys
const SAVE_SLOT_PREFIX = 'phikinhua_save_';
const AUTO_SAVE_KEY = 'phikinhua_autosave';
const SETTINGS_KEY = 'phikinhua_settings';

// Settings type
export type GameSettings = {
  autoSaveEnabled: boolean;
  maxSaveSlots: number;
  lastPlayedSlot?: number;
  /**
   * บทคั่นที่เคยอ่านจบแล้ว — จำข้ามรัน
   *
   * อยู่ใน settings ไม่ใช่ในเซฟของรัน เพราะเป็นเรื่องของคนเล่น ไม่ใช่ของรัน
   * รอบที่สิบไม่ควรถูกบังคับให้แตะผ่านบทเปิดเรื่องเดิมทีละย่อหน้าอีก
   */
  seenChapters?: string[];
};

export const DEFAULT_SETTINGS: GameSettings = {
  autoSaveEnabled: true,
  maxSaveSlots: 3,
  seenChapters: [],
};

// === Save/Load Functions ===

export async function saveGame(state: GameState, slot: number = 0): Promise<void> {
  try {
    const saveData = toSave(state);
    const key = slot === -1 ? AUTO_SAVE_KEY : `${SAVE_SLOT_PREFIX}${slot}`;
    
    // Add metadata
    const enrichedSave = {
      ...saveData,
      savedAt: new Date().toISOString(),
      slot: slot === -1 ? 'auto' : slot,
    };

    await AsyncStorage.setItem(key, JSON.stringify(enrichedSave));
    
    // Update last played slot if it's not auto-save
    if (slot !== -1) {
      const settings = await loadSettings();
      await saveSettings({ ...settings, lastPlayedSlot: slot });
    }
  } catch (error) {
    console.error('Failed to save game:', error);
    throw new Error(`Failed to save game: ${error}`);
  }
}

export async function loadGame(slot: number = 0): Promise<GameState> {
  try {
    const key = slot === -1 ? AUTO_SAVE_KEY : `${SAVE_SLOT_PREFIX}${slot}`;
    const saved = await AsyncStorage.getItem(key);
    
    if (!saved) {
      throw new Error(`No save found in slot ${slot === -1 ? 'auto' : slot}`);
    }

    const saveData = JSON.parse(saved) as SaveV2 & { savedAt?: string; slot?: string | number };
    return fromSave(saveData);
  } catch (error) {
    console.error('Failed to load game:', error);
    throw new Error(`Failed to load game: ${error}`);
  }
}

export async function deleteSave(slot: number): Promise<void> {
  try {
    const key = slot === -1 ? AUTO_SAVE_KEY : `${SAVE_SLOT_PREFIX}${slot}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to delete save:', error);
    throw new Error(`Failed to delete save: ${error}`);
  }
}

// === Save Slot Management ===

export type SaveSlotInfo = {
  slot: number;
  exists: boolean;
  /** เซฟเวอร์ชันเก่าหรือเสียหาย — มีอยู่แต่เล่นต่อไม่ได้ */
  playable?: boolean;
  savedAt?: string;
  playerLevel?: number;
  gold?: number;
  currentPage?: number;
  totalPages?: number;
};

export async function getSaveSlots(maxSlots: number = 3): Promise<SaveSlotInfo[]> {
  const slots: SaveSlotInfo[] = [];

  for (let i = 0; i < maxSlots; i++) {
    const key = `${SAVE_SLOT_PREFIX}${i}`;
    try {
      const saved = await AsyncStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved) as SaveV2 & { savedAt?: string };
        const ok = isPlayableSave(data);
        const sum = ok ? summarize(data) : undefined;
        slots.push({
          slot: i,
          exists: true,
          playable: ok,
          savedAt: data.savedAt,
          playerLevel: sum?.level,
          gold: sum?.gold,
          currentPage: sum?.fight,
          totalPages: sum?.totalFights,
        });
      } else {
        slots.push({ slot: i, exists: false });
      }
    } catch (error) {
      console.error(`Failed to read save slot ${i}:`, error);
      slots.push({ slot: i, exists: false });
    }
  }

  return slots;
}

/**
 * มีการเดินทางที่ค้างไว้และเล่นต่อได้จริงไหม
 *
 * เดิมตอบแค่ว่ามีไฟล์อยู่ไหม — เซฟเวอร์ชันเก่าที่ไม่มีเส้นทางก็ตอบ true
 * แล้วผู้เล่นจะกดเล่นต่อไปเจอจอเปล่า
 */
export async function loadAutoSaveSummary(): Promise<SaveSummary | null> {
  try {
    const saved = await AsyncStorage.getItem(AUTO_SAVE_KEY);
    if (!saved) return null;
    const data = JSON.parse(saved);
    if (!isPlayableSave(data)) return null;
    return summarize(data);
  } catch {
    return null;
  }
}

export async function hasAutoSave(): Promise<boolean> {
  return (await loadAutoSaveSummary()) !== null;
}

export async function clearAutoSave(): Promise<void> {
  try { await AsyncStorage.removeItem(AUTO_SAVE_KEY); } catch {}
}

// === Settings ===

export async function saveSettings(settings: GameSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export async function loadSettings(): Promise<GameSettings> {
  try {
    const saved = await AsyncStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/** บทที่เคยอ่านจบแล้วข้ามรัน — ใช้ตัดสินว่าจะเปิดทีละย่อหน้าหรือกางทั้งบทเลย */
export async function loadSeenChapters(): Promise<string[]> {
  const settings = await loadSettings();
  return settings.seenChapters ?? [];
}

export async function markChapterSeen(id: string): Promise<void> {
  const settings = await loadSettings();
  const seen = settings.seenChapters ?? [];
  if (seen.includes(id)) return;
  await saveSettings({ ...settings, seenChapters: [...seen, id] });
}

// === Auto Save ===

export async function autoSave(state: GameState): Promise<void> {
  const settings = await loadSettings();
  if (settings.autoSaveEnabled) {
    await saveGame(state, -1); // -1 = auto save slot
  }
}

// === Utility Functions ===

export function formatSaveDate(dateString: string | undefined): string {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  } catch {
    return 'Invalid date';
  }
}

export async function clearAllSaves(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const saveKeys = keys.filter(key => 
      key.startsWith(SAVE_SLOT_PREFIX) || 
      key === AUTO_SAVE_KEY
    );
    await AsyncStorage.multiRemove(saveKeys);
  } catch (error) {
    console.error('Failed to clear saves:', error);
    throw new Error(`Failed to clear saves: ${error}`);
  }
}