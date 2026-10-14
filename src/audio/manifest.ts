/**
 * รายการไฟล์เสียงทั้งหมดของเกม — **ที่เดียวที่ต้องแก้เวลาเปลี่ยนเสียง**
 *
 * - เปลี่ยนเพลง / เสียง: วางไฟล์ใหม่ใน assets/audio/ แล้วแก้ require() บรรทัดนั้น
 * - เสียงที่ได้ยินบ่อย (จั่วการ์ด, ผีตี) ใส่ได้หลายไฟล์ เกมจะสุ่มเล่น ไม่ให้ซ้ำจนน่ารำคาญ
 * - id ที่ยังไม่มีไฟล์ ให้เว้นเป็น [] ได้ โค้ดฝั่งเกมเรียกได้ปกติ แค่ไม่มีเสียง
 *
 * ที่มาของไฟล์และเหตุผลของแนวเสียง: docs/audio/AUDIO.md
 */

export type SfxId =
  | 'cardDraw'
  | 'ghostAttack'
  | 'bossIntroHeadCollector';

export type BedId = 'music' | 'ambienceNight1';

type Source = number; // ผลของ require() สำหรับไฟล์ asset

export const SFX: Record<SfxId, { files: Source[]; volume: number }> = {
  // เสียงที่ดังบ่อยที่สุดในเกม — ต้องเบา
  cardDraw: { files: [require('../../assets/audio/card-draw-1.mp3'), require('../../assets/audio/card-draw-2.mp3')], volume: 0.45 },
  ghostAttack: {
    files: [
      require('../../assets/audio/ghost-attack-1.mp3'),
      require('../../assets/audio/ghost-attack-2.mp3'),
      require('../../assets/audio/ghost-attack-3.mp3'),
    ],
    volume: 0.8,
  },
  bossIntroHeadCollector: { files: [require('../../assets/audio/boss-intro-head-collector.mp3')], volume: 0.9 },
};

/** เสียงพื้นที่เล่นวนยาว ๆ — ตั้งให้เบากว่าเสียงเอฟเฟกต์มาก */
export const BEDS: Record<BedId, { file: Source | null; volume: number }> = {
  // เพลงชั่วคราวจาก AI — จะเปลี่ยนเป็นเพลงไทยจากเครื่องดนตรีจริงทีหลัง
  music: { file: require('../../assets/audio/music-thai-temp.mp3'), volume: 0.35 },
  ambienceNight1: { file: require('../../assets/audio/ambience-night-1.mp3'), volume: 0.22 },
};

/** บอสที่มีเสียงเปิดตัวแล้ว (monsterId → SfxId) */
export const BOSS_INTRO: Partial<Record<string, SfxId>> = {
  'night-head-collector': 'bossIntroHeadCollector',
};
