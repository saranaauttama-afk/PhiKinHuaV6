// app/screenRouter.ts — สถานะแบบนี้ต้องแสดงหน้าไหน
//
// เดิมตรรกะนี้เป็น if-chain อยู่กลาง `index.tsx` ปนกับ JSX ทดสอบไม่ได้เลย
// แล้วมันก็พลาดจริง: state ตั้งต้นของ store ใช้ `phase: 'menu'` แต่โค้ดเช็คว่า
// `phase === 'start'` ถึงจะโชว์หน้าเริ่มเกม — 'menu' จึงร่วงผ่านทุกเงื่อนไข
// ไปตกที่หน้าแผนที่ ซึ่งตอนนั้นยังไม่มีเส้นทางและไม่มีตัวเลือก
// **เปิดเกมมาแล้วค้างอยู่หน้าแผนที่เปล่าๆ เล่นอะไรไม่ได้เลย**
//
// เทสต์ทั้งหมดที่มีอยู่ยิงเข้า engine ตรงๆ ไม่มีอันไหนถามว่า "เปิดแอปมาเห็นอะไร"
// แยกออกมาเป็นฟังก์ชันบริสุทธิ์เพื่อให้ถามคำถามนั้นได้

import type { GameState } from '../src/core/types';

export type Screen =
  | 'start'
  | 'class-select'
  | 'run-complete'
  | 'starter-blessing'
  | 'map';

/** phase ที่แปลว่า "ยังไม่ได้อยู่ในรัน" — ต้องไปหน้าเริ่มเกมทั้งหมด */
const OUT_OF_RUN: GameState['phase'][] = ['start', 'menu'];

export function screenForState(
  state: GameState,
  opts: { pickingClass: boolean }
): Screen {
  // เลือกคลาสเป็นสถานะของ UI ไม่ใช่ของ engine จึงมาก่อน
  if (opts.pickingClass) return 'class-select';

  if (OUT_OF_RUN.includes(state.phase)) return 'start';

  if (state.phase === 'run_complete') return 'run-complete';

  if (state.phase === 'starter' && state.starter && !state.starter.consumed) {
    return 'starter-blessing';
  }

  return 'map';
}

/**
 * หน้าแผนที่พร้อมแสดงจริงไหม
 *
 * ถ้าไปถึงหน้าแผนที่โดยที่ยังไม่มีเส้นทาง แปลว่าหลุดมาผิดทาง
 * (เช่นเซฟเก่าที่บันทึกไว้ก่อนมีระบบเส้นทาง) — ไม่ควรโชว์จอเปล่าให้ผู้เล่นงง
 */
export function mapIsReady(state: GameState): boolean {
  return !!state.journey && (state.pages?.current?.offers?.length ?? 0) > 0;
}
