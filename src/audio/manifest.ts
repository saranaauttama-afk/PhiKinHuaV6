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
  | 'bossIntroHeadCollector'
  // ชุด 2 (15 ต.ค. 2026): นักมวยและการต่อสู้ — ElevenLabs flow "ผีกินหัว SFX ชุด 2"
  | 'playerHit'
  | 'heavyHit'
  | 'block'
  | 'riposte'
  | 'rhythmUp'
  | 'roundBell'
  | 'minionSummon'
  | 'stun'
  | 'ghostDeath'
  | 'playerDeath'
  | 'heal'
  | 'debuff'
  | 'turnStart'
  | 'uiTap';

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
  // ชุด 2 (assets/audio/sfx/) — ตัดเงียบ, mono 96k, ปรับดัง ~−18 LUFS แล้ว; volume ด้านล่างคุมความดังเทียบกัน
  playerHit: { files: [require('../../assets/audio/sfx/player-hit-1.mp3')], volume: 0.75 },
  heavyHit: { files: [require('../../assets/audio/sfx/heavy-hit-1.mp3')], volume: 0.9 },
  block: { files: [require('../../assets/audio/sfx/block-1.mp3')], volume: 0.55 },
  riposte: { files: [require('../../assets/audio/sfx/riposte-1.mp3')], volume: 0.8 },
  rhythmUp: { files: [require('../../assets/audio/sfx/rhythm-up-1.mp3')], volume: 0.5 },
  roundBell: { files: [require('../../assets/audio/sfx/round-bell-1.mp3')], volume: 0.7 },
  minionSummon: { files: [require('../../assets/audio/sfx/minion-summon-1.mp3')], volume: 0.6 },
  stun: { files: [require('../../assets/audio/sfx/stun-1.mp3')], volume: 0.7 },
  ghostDeath: { files: [require('../../assets/audio/sfx/ghost-death-1.mp3')], volume: 0.85 },
  playerDeath: { files: [require('../../assets/audio/sfx/player-death-1.mp3')], volume: 0.9 },
  heal: { files: [require('../../assets/audio/sfx/heal-1.mp3')], volume: 0.55 },
  debuff: { files: [require('../../assets/audio/sfx/debuff-1.mp3')], volume: 0.6 },
  turnStart: { files: [require('../../assets/audio/sfx/turn-start-1.mp3')], volume: 0.4 },
  uiTap: { files: [require('../../assets/audio/sfx/ui-tap-1.mp3')], volume: 0.35 },
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
