import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { SFX, BEDS, type SfxId, type BedId } from './manifest';

/**
 * ระบบเสียงของเกม — ชั้นนี้เป็นภาพ/เสียงล้วน ไม่แตะกฎเกม
 *
 * - เสียงเอฟเฟกต์โหลดไว้ล่วงหน้าทุกไฟล์ (สั้นและเล็ก) เพื่อให้กดแล้วดังทันที
 * - เสียงพื้น (เพลง, บรรยากาศ) เล่นวนตลอด และหยุดเมื่อแอปไปอยู่เบื้องหลัง
 * - ผู้เล่นปิดเพลงกับเสียงเอฟเฟกต์แยกกันได้ในหน้าตั้งค่า
 * - ถ้าเครื่องเล่นเสียงไม่ได้ด้วยเหตุใดก็ตาม เกมต้องเล่นต่อได้ จึงครอบ try/catch ทุกจุด
 */

type AudioSettings = {
  sfxOn: boolean;
  musicOn: boolean;
  setSfxOn: (v: boolean) => void;
  setMusicOn: (v: boolean) => void;
  hydrate: () => Promise<void>;
};

const KEY = 'phi-audio-settings';
const persist = (s: { sfxOn: boolean; musicOn: boolean }) =>
  void AsyncStorage.setItem(KEY, JSON.stringify(s)).catch(() => {});

export const useAudioSettings = create<AudioSettings>((set, get) => ({
  sfxOn: true,
  musicOn: true,
  setSfxOn: v => { set({ sfxOn: v }); persist({ sfxOn: v, musicOn: get().musicOn }); },
  setMusicOn: v => { set({ musicOn: v }); persist({ sfxOn: get().sfxOn, musicOn: v }); syncBeds(); },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        set({ sfxOn: s.sfxOn !== false, musicOn: s.musicOn !== false });
      }
    } catch {}
    syncBeds();
  },
}));

const sfxPlayers = new Map<SfxId, AudioPlayer[]>();
const lastVariant = new Map<SfxId, number>();
const bedPlayers = new Map<BedId, AudioPlayer>();
/** เสียงพื้นที่หน้าจอปัจจุบันต้องการ */
let wantedBeds = new Set<BedId>();
let foreground = true;
let started = false;

export function initAudio() {
  if (started) return;
  started = true;
  void setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false }).catch(() => {});
  for (const id of Object.keys(SFX) as SfxId[]) {
    const { files, volume } = SFX[id];
    sfxPlayers.set(id, files.map(f => {
      const p = createAudioPlayer(f);
      p.volume = volume;
      return p;
    }));
  }
  for (const id of Object.keys(BEDS) as BedId[]) {
    const { file, volume } = BEDS[id];
    if (file == null) continue;
    try {
      const p = createAudioPlayer(file);
      p.loop = true;
      p.volume = volume;
      bedPlayers.set(id, p);
    } catch {}
  }
  void useAudioSettings.getState().hydrate();
}

/** เล่นเสียงเอฟเฟกต์ — ถ้ามีหลายไฟล์จะสุ่ม และไม่เล่นไฟล์เดิมซ้ำติดกัน */
export function playSfx(id: SfxId) {
  if (!useAudioSettings.getState().sfxOn || !foreground) return;
  const players = sfxPlayers.get(id);
  if (!players || players.length === 0) return;
  let i = Math.floor(Math.random() * players.length);
  if (players.length > 1 && i === lastVariant.get(id)) i = (i + 1) % players.length;
  lastVariant.set(id, i);
  try {
    const p = players[i];
    void p.seekTo(0);
    p.play();
  } catch {}
}

/** หน้าจอบอกว่าต้องการเสียงพื้นอะไรบ้าง เช่น ['music'] หรือ ['music','ambienceNight1'] */
export function setBeds(ids: BedId[]) {
  wantedBeds = new Set(ids);
  syncBeds();
}

/** เรียกจาก AppState — แอปไปเบื้องหลังต้องเงียบ */
export function setAudioForeground(active: boolean) {
  foreground = active;
  syncBeds();
}

function syncBeds() {
  const musicOn = useAudioSettings.getState().musicOn;
  for (const [id, p] of bedPlayers) {
    const should = musicOn && foreground && wantedBeds.has(id);
    try {
      if (should && !p.playing) p.play();
      else if (!should && p.playing) p.pause();
    } catch {}
  }
}
