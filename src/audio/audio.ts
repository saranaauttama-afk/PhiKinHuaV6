import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { SFX, BEDS, type SfxId, type BedId } from './manifest';
import { bedsFor, oneShotsFor, stepGain, ONE_SHOT_GAP_MS, type AudioMode, type GhostKind } from './zones';

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

/** On web, play() before the first tap is refused by the browser; that is expected, not an error. */
function quiet(r: unknown) {
  (r as Promise<unknown> | undefined)?.catch?.(() => {});
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  // expo-audio's web player does not hand back the play() promise, so its autoplay refusal
  // ("user didn't interact with the document first") would surface as an uncaught rejection.
  window.addEventListener('unhandledrejection', e => {
    const r = (e as PromiseRejectionEvent).reason;
    if (r?.name === 'NotAllowedError' || /user didn't interact/.test(String(r?.message ?? r))) e.preventDefault();
  });
}

/** เล่นเสียงเอฟเฟกต์ — ถ้ามีหลายไฟล์จะสุ่ม และไม่เล่นไฟล์เดิมซ้ำติดกัน */
export function playSfx(id: SfxId) {
  if (!useAudioSettings.getState().sfxOn || !foreground) return;
  playPlayer(id);
}

function playPlayer(id: SfxId) {
  const players = sfxPlayers.get(id);
  if (!players || players.length === 0) return;
  let i = Math.floor(Math.random() * players.length);
  if (players.length > 1 && i === lastVariant.get(id)) i = (i + 1) % players.length;
  lastVariant.set(id, i);
  try {
    const p = players[i];
    void p.seekTo(0);
    quiet(p.play());
  } catch {}
}

/** หน้าจอบอกว่าต้องการเสียงพื้นอะไรบ้าง เช่น ['music'] หรือ ['villageBed'] — เปลี่ยนแบบเฟดข้าม */
export function setBeds(ids: BedId[]) {
  wantedBeds = new Set(ids);
  syncBeds();
}

/**
 * เสียงตามโซน (ชุด 3): หน้าจอบอกแค่ "อยู่ฉากไหน ทำอะไร" แล้วชั้นนี้เลือกเสียงพื้น + เสียงแทรกเอง
 * ดู src/audio/zones.ts
 */
export function setSceneAudio(sceneId: string | undefined, mode: AudioMode, kind: GhostKind = 'normal') {
  setBeds(bedsFor(sceneId, mode, kind));
  setOneShots(oneShotsFor(sceneId, mode));
}

/** เรียกจาก AppState — แอปไปเบื้องหลังต้องเงียบ */
export function setAudioForeground(active: boolean) {
  foreground = active;
  syncBeds();
  scheduleOneShot();
}

// ---- เฟดข้ามเสียงพื้น ----
/** เวลาเฟดข้าม: ราวเท่ากล้องเดินเข้าฉาก (SceneArrival) และพอให้ไม่รู้สึกว่าเสียงถูกตัด */
const FADE_MS = 1500;
const FADE_TICK_MS = 50;
/** เกนปัจจุบันของแต่ละเสียงพื้น 0..1 (คูณกับ volume ใน manifest) */
const bedGain = new Map<BedId, number>();
let fadeTimer: ReturnType<typeof setInterval> | null = null;

function bedTarget(id: BedId) {
  return useAudioSettings.getState().musicOn && foreground && wantedBeds.has(id) ? 1 : 0;
}

function applyGain(id: BedId, p: AudioPlayer, g: number) {
  try {
    p.volume = BEDS[id].volume * g;
    if (g > 0 && !p.playing) quiet(p.play());
    else if (g <= 0 && p.playing) p.pause();
  } catch {}
}

function syncBeds() {
  // ไปเบื้องหลัง / ปิดเพลง: เงียบทันที ไม่ค่อย ๆ เฟด (ผู้เล่นสั่งให้เงียบ)
  const instant = !foreground || !useAudioSettings.getState().musicOn;
  for (const [id, p] of bedPlayers) {
    if (instant) { bedGain.set(id, 0); applyGain(id, p, 0); }
  }
  if (instant) { if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; } return; }
  if (fadeTimer) return;
  fadeTimer = setInterval(() => {
    let moving = false;
    for (const [id, p] of bedPlayers) {
      const cur = bedGain.get(id) ?? 0, target = bedTarget(id);
      if (cur === target) { if (target > 0 && !p.playing) applyGain(id, p, cur); continue; }
      const next = stepGain(cur, target, FADE_TICK_MS, FADE_MS);
      bedGain.set(id, next);
      applyGain(id, p, next);
      moving = moving || next !== target;
    }
    if (!moving && fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
  }, FADE_TICK_MS);
}

// ---- เสียงแทรกนาน ๆ ที (หมาหอน ฯลฯ) ----
let oneShotIds: SfxId[] = [];
let oneShotTimer: ReturnType<typeof setTimeout> | null = null;
let lastOneShot: SfxId | null = null;

function setOneShots(ids: SfxId[]) {
  const same = ids.length === oneShotIds.length && ids.every((id, i) => id === oneShotIds[i]);
  oneShotIds = ids;
  if (!same) { if (oneShotTimer) { clearTimeout(oneShotTimer); oneShotTimer = null; } }
  scheduleOneShot();
}

function scheduleOneShot() {
  if (oneShotTimer || !oneShotIds.length || !foreground) return;
  const [min, max] = ONE_SHOT_GAP_MS;
  oneShotTimer = setTimeout(() => {
    oneShotTimer = null;
    // เป็นส่วนของฉาก จึงดังตามสวิตช์เพลง/เสียงพื้น ไม่ใช่สวิตช์เสียงเอฟเฟกต์
    if (foreground && useAudioSettings.getState().musicOn && oneShotIds.length) {
      const pool = oneShotIds.length > 1 ? oneShotIds.filter(id => id !== lastOneShot) : oneShotIds;
      const id = pool[Math.floor(Math.random() * pool.length)];
      lastOneShot = id;
      playPlayer(id);
    }
    scheduleOneShot();
  }, min + Math.random() * (max - min));
}

/** หน้าเมนู/เลือกอาชีพ/บทจบ: เพลงอย่างเดียว ไม่มีเสียงโซน */
export function setMenuAudio() {
  setBeds(['music']);
  setOneShots([]);
}
