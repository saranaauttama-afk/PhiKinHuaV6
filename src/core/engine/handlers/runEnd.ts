// src/core/engine/handlers/runEnd.ts — รันจบยังไง (ชนะหรือแพ้) อยู่ที่เดียวกัน
//
// การแพ้เคยเป็นทางตัน: `s.phase = 'defeat'` ถูกเซ็ตจากสามที่ (จบเทิร์นผู้เล่น
// จบเทิร์นศัตรู และเสียเลือดจากการพนัน) แต่ไม่มีที่ไหนสรุปผลรัน — กดกลับจาก
// จอแพ้แล้วเด้งไปหน้าแผนที่ของรันที่ผู้เล่นเพิ่งตายไป ยังเดินต่อได้เหมือนไม่มีอะไรเกิดขึ้น
//
// รวมไว้ที่นี่เพื่อให้ "จบรัน" แปลว่ามี `runSummary` เสมอ ไม่ว่าจบทางไหน
// จอสรุปกับตัวเช็คเซฟจึงถามคำถามเดียวก็พอ

import type { GameState } from '../../types';
import { fireChapter } from '../../story/chapters';

/** แพ้แล้ว — สรุปผลรันและเปิดบทปิดเรื่องฝั่งแพ้ */
export function loseRun(s: GameState): void {
  s.phase = 'defeat';
  s.runSummary = {
    won: false,
    fights: s.fightCount ?? 0,
    level: s.player.level,
    gold: s.player.gold ?? 0,
    beatSecretBoss: false,
  };
  fireChapter(s, { kind: 'ending', won: false });
}

/** ชนะแล้ว — `beatSecretBoss` แยกบทปิดเรื่องคนละบท */
export function winRun(s: GameState, beatSecretBoss: boolean): void {
  s.phase = 'run_complete';
  s.runSummary = {
    won: true,
    fights: s.fightCount ?? 0,
    level: s.player.level,
    gold: s.player.gold ?? 0,
    beatSecretBoss,
  };
  fireChapter(s, { kind: 'ending', won: true, beatSecretBoss });
}
