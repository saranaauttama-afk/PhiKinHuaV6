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
  | 'uiTap'
  // ชุด 3 (16 ต.ค. 2026): เสียงแทรกตามโซน — สุ่มเล่นบนแผนที่ (src/audio/zones.ts)
  | 'villageDogHowl'
  | 'villageDoorCreak'
  | 'villageRooster'
  | 'templeWindChime'
  | 'templeBellFar'
  | 'templeChant'
  | 'templeBroom'
  | 'cremationOwl'
  | 'cremationEmber'
  | 'cremationDogNear'
  | 'cremationCrow'
  | 'forestBranchSnap'
  | 'forestNightBird'
  | 'forestRustle'
  | 'waterFishSplash'
  | 'waterWading'
  | 'waterFrogsStop'
  | 'mountainFlagFlap'
  | 'mountainShrineBell'
  | 'mountainRockfall'
  | 'caveBats'
  | 'caveRockEcho'
  | 'caveBreath'
  | 'otherworldWhispers'
  | 'otherworldReverseGong';

export type BedId =
  | 'music'
  | 'ambienceNight1'
  // ชุด 3: เสียงพื้นตามโซน + กลองตอนสู้ (src/audio/zones.ts)
  | 'villageBed'
  | 'villageBattleBed'
  | 'templeBed'
  | 'templeBattleBed'
  | 'cremationBed'
  | 'cremationBattleBed'
  | 'forestBed'
  | 'forestBattleBed'
  | 'waterBed'
  | 'waterBattleBed'
  | 'mountainBed'
  | 'mountainBattleBed'
  | 'caveBed'
  | 'caveBattleBed'
  | 'otherworldBed'
  | 'otherworldBattleBed'
  | 'battleDrumNormal'
  | 'battleDrumElite'
  | 'battleDrumBoss';

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
  // ชุด 3 — เสียงแทรกบรรยากาศ ดังตามสวิตช์ "เพลง/เสียงพื้น" ไม่ใช่สวิตช์เสียงเอฟเฟกต์ (เป็นส่วนของฉาก)
  villageDogHowl: { files: [require('../../assets/audio/sfx/village-dog-howl-1.mp3')], volume: 0.4 },
  villageDoorCreak: { files: [require('../../assets/audio/sfx/village-door-creak-1.mp3')], volume: 0.4 },
  villageRooster: { files: [require('../../assets/audio/sfx/village-rooster-1.mp3')], volume: 0.4 },
  templeWindChime: { files: [require('../../assets/audio/sfx/temple-wind-chime-1.mp3')], volume: 0.4 },
  templeBellFar: { files: [require('../../assets/audio/sfx/temple-bell-far-1.mp3')], volume: 0.4 },
  templeChant: { files: [require('../../assets/audio/sfx/temple-chant-1.mp3')], volume: 0.4 },
  templeBroom: { files: [require('../../assets/audio/sfx/temple-broom-1.mp3')], volume: 0.4 },
  cremationOwl: { files: [require('../../assets/audio/sfx/cremation-owl-1.mp3')], volume: 0.4 },
  cremationEmber: { files: [require('../../assets/audio/sfx/cremation-ember-1.mp3')], volume: 0.4 },
  cremationDogNear: { files: [require('../../assets/audio/sfx/cremation-dog-near-1.mp3')], volume: 0.4 },
  cremationCrow: { files: [require('../../assets/audio/sfx/cremation-crow-1.mp3')], volume: 0.4 },
  forestBranchSnap: { files: [require('../../assets/audio/sfx/forest-branch-snap-1.mp3')], volume: 0.4 },
  forestNightBird: { files: [require('../../assets/audio/sfx/forest-night-bird-1.mp3')], volume: 0.4 },
  forestRustle: { files: [require('../../assets/audio/sfx/forest-rustle-1.mp3')], volume: 0.4 },
  waterFishSplash: { files: [require('../../assets/audio/sfx/water-fish-splash-1.mp3')], volume: 0.4 },
  waterWading: { files: [require('../../assets/audio/sfx/water-wading-1.mp3')], volume: 0.4 },
  waterFrogsStop: { files: [require('../../assets/audio/sfx/water-frogs-stop-1.mp3')], volume: 0.4 },
  mountainFlagFlap: { files: [require('../../assets/audio/sfx/mountain-flag-flap-1.mp3')], volume: 0.4 },
  mountainShrineBell: { files: [require('../../assets/audio/sfx/mountain-shrine-bell-1.mp3')], volume: 0.4 },
  mountainRockfall: { files: [require('../../assets/audio/sfx/mountain-rockfall-1.mp3')], volume: 0.4 },
  caveBats: { files: [require('../../assets/audio/sfx/cave-bats-1.mp3')], volume: 0.4 },
  caveRockEcho: { files: [require('../../assets/audio/sfx/cave-rock-echo-1.mp3')], volume: 0.4 },
  caveBreath: { files: [require('../../assets/audio/sfx/cave-breath-1.mp3')], volume: 0.4 },
  otherworldWhispers: { files: [require('../../assets/audio/sfx/otherworld-whispers-1.mp3')], volume: 0.4 },
  otherworldReverseGong: { files: [require('../../assets/audio/sfx/otherworld-reverse-gong-1.mp3')], volume: 0.4 },
};

/** เสียงพื้นที่เล่นวนยาว ๆ — ตั้งให้เบากว่าเสียงเอฟเฟกต์มาก */
export const BEDS: Record<BedId, { file: Source | null; volume: number }> = {
  // เพลงชั่วคราวจาก AI — จะเปลี่ยนเป็นเพลงไทยจากเครื่องดนตรีจริงทีหลัง
  music: { file: require('../../assets/audio/music-thai-temp.mp3'), volume: 0.35 },
  // เลิกใช้ในฉากสู้แล้ว (ชุด 3 ใช้เสียงตามโซนแทน) — เก็บไฟล์ไว้เผื่อใช้กับโซนที่ยังไม่มีเสียง
  ambienceNight1: { file: require('../../assets/audio/ambience-night-1.mp3'), volume: 0.22 },
  // ชุด 3 (assets/audio/ambience/) — ElevenLabs SFX v2 ลูป, ตัดความถี่เกิน 10 kHz (ลดซ่า), ~−21 ถึง −24 LUFS
  villageBed: { file: require('../../assets/audio/ambience/village-bed.mp3'), volume: 0.45 },
  villageBattleBed: { file: require('../../assets/audio/ambience/village-battle-bed.mp3'), volume: 0.4 },
  // ชุด 3 โซนอื่น (scripts/zone-audio.py, ~−21 ถึง −24 LUFS) — ค่า volume เท่าหมู่บ้าน
  templeBed: { file: require('../../assets/audio/ambience/temple-bed.mp3'), volume: 0.45 },
  templeBattleBed: { file: require('../../assets/audio/ambience/temple-battle-bed.mp3'), volume: 0.4 },
  cremationBed: { file: require('../../assets/audio/ambience/cremation-bed.mp3'), volume: 0.45 },
  cremationBattleBed: { file: require('../../assets/audio/ambience/cremation-battle-bed.mp3'), volume: 0.4 },
  forestBed: { file: require('../../assets/audio/ambience/forest-bed.mp3'), volume: 0.45 },
  forestBattleBed: { file: require('../../assets/audio/ambience/forest-battle-bed.mp3'), volume: 0.4 },
  waterBed: { file: require('../../assets/audio/ambience/water-bed.mp3'), volume: 0.45 },
  waterBattleBed: { file: require('../../assets/audio/ambience/water-battle-bed.mp3'), volume: 0.4 },
  mountainBed: { file: require('../../assets/audio/ambience/mountain-bed.mp3'), volume: 0.45 },
  mountainBattleBed: { file: require('../../assets/audio/ambience/mountain-battle-bed.mp3'), volume: 0.4 },
  caveBed: { file: require('../../assets/audio/ambience/cave-bed.mp3'), volume: 0.45 },
  caveBattleBed: { file: require('../../assets/audio/ambience/cave-battle-bed.mp3'), volume: 0.4 },
  otherworldBed: { file: require('../../assets/audio/ambience/otherworld-bed.mp3'), volume: 0.45 },
  otherworldBattleBed: { file: require('../../assets/audio/ambience/otherworld-battle-bed.mp3'), volume: 0.4 },
  battleDrumNormal: { file: require('../../assets/audio/ambience/battle-drum-normal.mp3'), volume: 0.55 },
  battleDrumElite: { file: require('../../assets/audio/ambience/battle-drum-elite.mp3'), volume: 0.55 },
  battleDrumBoss: { file: require('../../assets/audio/ambience/battle-drum-boss.mp3'), volume: 0.6 },
};

/** บอสที่มีเสียงเปิดตัวแล้ว (monsterId → SfxId) */
export const BOSS_INTRO: Partial<Record<string, SfxId>> = {
  'night-head-collector': 'bossIntroHeadCollector',
};
