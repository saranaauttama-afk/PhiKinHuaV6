import { describe, it, expect } from 'vitest';
import { applyCommand } from '../src/core/reducer';
import { makeRng } from '../src/core/rng';
import { baseNewState } from '../src/core/commands';
import type { Command, GameState } from '../src/core/types';
import { screenForState, mapIsReady } from '../app/screenRouter';

/**
 * เปิดแอปมาแล้วเห็นหน้าไหน
 *
 * บั๊กที่ทำให้ต้องมีไฟล์นี้: state ตั้งต้นของ store ใช้ `phase: 'menu'`
 * แต่โค้ดใน `index.tsx` เช็คว่า `phase === 'start'` ถึงจะโชว์หน้าเริ่มเกม
 * 'menu' จึงร่วงผ่านทุกเงื่อนไขไปตกที่หน้าแผนที่ ซึ่งตอนนั้นยังไม่มีเส้นทาง
 * และไม่มีตัวเลือก — **เปิดเกมมาแล้วค้างอยู่หน้าเปล่า กดอะไรไม่ได้เลย**
 *
 * เทสต์ 239 ตัวที่มีอยู่ก่อนหน้านี้ผ่านหมด เพราะทุกตัวยิงเข้า engine ตรงๆ
 * ไม่มีตัวไหนถามว่า "แล้ว UI จะเลือกแสดงหน้าไหน"
 */

const NO_CLASS_PICK = { pickingClass: false };

function run(cmds: Command[], seed = 'router'): GameState {
  let s = baseNewState(seed);
  let r = makeRng(seed);
  for (const c of cmds) {
    const out = applyCommand(s, c, r);
    s = out.state; r = out.rng;
  }
  return s;
}

describe('หน้าแรกที่ผู้เล่นเห็นตอนเปิดแอป', () => {
  it('state ตั้งต้นต้องพาไปหน้าเริ่มเกม ไม่ใช่หน้าแผนที่', () => {
    expect(screenForState(baseNewState(''), NO_CLASS_PICK)).toBe('start');
  });

  it("phase 'menu' ก็ต้องไปหน้าเริ่มเกมเหมือนกัน — ทั้งสองแปลว่ายังไม่ได้อยู่ในรัน", () => {
    const s = { ...baseNewState(''), phase: 'menu' as const };
    expect(screenForState(s, NO_CLASS_PICK)).toBe('start');
  });

  it('ไม่มี phase ไหนที่ยังไม่ได้เริ่มรัน แล้วหลุดไปหน้าแผนที่', () => {
    for (const phase of ['start', 'menu'] as const) {
      const s = { ...baseNewState(''), phase };
      expect(screenForState(s, NO_CLASS_PICK), `phase ${phase}`).not.toBe('map');
    }
  });
});

describe('ลำดับหน้าตลอดการเริ่มรัน', () => {
  it('กดเริ่มเกม → หน้าเลือกผู้เดินทาง', () => {
    expect(screenForState(baseNewState(''), { pickingClass: true })).toBe('class-select');
  });

  it('เลือกคลาสแล้ว → หน้าเลือกพรตั้งต้น', () => {
    const s = run([{ type: 'NewRun', seed: 'router', classId: 'shaman' }]);
    expect(screenForState(s, NO_CLASS_PICK)).toBe('starter-blessing');
  });

  it('เลือกพรแล้ว → หน้าแผนที่ และแผนที่พร้อมใช้จริง', () => {
    const s = run([
      { type: 'NewRun', seed: 'router', classId: 'shaman' },
      { type: 'ChooseStarterBlessing', index: 0 },
    ]);
    expect(screenForState(s, NO_CLASS_PICK)).toBe('map');
    expect(mapIsReady(s), 'ถึงหน้าแผนที่แล้วต้องมีเส้นทางและตัวเลือกจริง').toBe(true);
  });

  it('จบรัน → หน้าสรุป ไม่ใช่แผนที่ที่ไม่เหลืออะไร', () => {
    const s = { ...baseNewState(''), phase: 'run_complete' as const };
    expect(screenForState(s, NO_CLASS_PICK)).toBe('run-complete');
  });
});

describe('หน้าแผนที่พร้อมแสดงจริงไหม', () => {
  it('ไม่มีเส้นทาง = ยังไม่พร้อม', () => {
    expect(mapIsReady(baseNewState(''))).toBe(false);
  });

  it('มีเส้นทางแต่ไม่มีตัวเลือก = ยังไม่พร้อม', () => {
    const s: any = run([
      { type: 'NewRun', seed: 'router', classId: 'shaman' },
      { type: 'ChooseStarterBlessing', index: 0 },
    ]);
    s.pages.current.offers = [];
    expect(mapIsReady(s)).toBe(false);
  });

  it('ระหว่างเดินทางจริง แผนที่พร้อมตลอด', () => {
    let s: any = run([
      { type: 'NewRun', seed: 'router', classId: 'shaman' },
      { type: 'ChooseStarterBlessing', index: 0 },
    ]);
    let r = makeRng('router');
    const go = (c: Command) => { const o = applyCommand(s, c, r); s = o.state; r = o.rng; };

    // แวะโหนดพักแล้วเดินต่อ ตรวจว่าแผนที่ยังพร้อมทุกครั้งที่กลับมา
    for (let i = 0; i < 3 && screenForState(s, NO_CLASS_PICK) === 'map'; i++) {
      expect(mapIsReady(s), `ชั้นที่ ${i}`).toBe(true);
      const offers = s.pages.current.offers;
      const restIx = offers.findIndex((o: any) => o.kind !== 'monster' && o.kind !== 'boss');
      if (restIx < 0) break;

      go({ type: 'ChooseOffer', index: restIx });
      if (s.phase === 'event' && s.story) go({ type: 'ChooseEventOption', index: 0 });
      go({ type: 'CompleteNode' });
    }
  });
});

describe('state ตั้งต้นของ store ตรงกับของ engine', () => {
  it('ใช้ baseNewState ตัวเดียวกัน ไม่ได้เขียนขึ้นมาเอง', () => {
    // เดิม store ประกอบ state เองรวมถึงก๊อปข้อมูลการ์ดมาแปะไว้ ซึ่งเก่ากว่า
    // cards.json ไปแล้ว และตั้ง phase ไม่ตรงกับที่ UI ใช้เช็ค
    const s = baseNewState('');
    expect(s.phase).toBe('start');
    expect(s.masterDeck).toEqual([]);
    expect(s.journey).toBeUndefined();
  });
});

describe('สถานะจริงของ store ตอนแอปเพิ่งเปิด', () => {
  /**
   * ข้อนี้ต่างจากข้ออื่นตรงที่ **อ่านจาก store จริง** ไม่ใช่ `baseNewState`
   *
   * บั๊กเดิมเกิดจาก store ประกอบ state เองแล้วตั้ง phase ไม่ตรงกับที่ UI เช็ค
   * ถ้าเทสต์ดูแต่ `baseNewState` ก็จะจับไม่ได้อีกถ้าใครแยกมันออกจากกันในอนาคต
   */
  it('state แรกของ store พาไปหน้าเริ่มเกม', async () => {
    const { useGame } = await import('../src/store/gameStore');
    const s = useGame.getState().state;

    expect(s.phase, 'phase ตั้งต้นของ store ต้องตรงกับที่ screenRouter เช็ค').toBe('start');
    expect(screenForState(s, NO_CLASS_PICK)).toBe('start');
  });
});
