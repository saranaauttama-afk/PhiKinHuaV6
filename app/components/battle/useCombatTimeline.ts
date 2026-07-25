import React from 'react';
import type { CombatEvent } from '../../../src/core/types';

/**
 * เล่นคิว CombatEvent ที่ engine คายออกมา ตามจังหวะของฝั่ง view เอง
 *
 * จุดสำคัญ: ตอนที่ hook นี้ทำงาน **state ของเกมถูกคำนวณจนจบไปแล้ว**
 * ค่าเวลาในนี้จึงคุมแค่ภาพ ไม่มีผลต่อกฎเกม
 * จะเร่ง จะข้าม หรือ unmount กลางคัน ก็ไม่ทำให้ state เพี้ยน
 *
 * (เดิมเวลาพวกนี้ถูก export ออกไปให้ battle.tsx ใช้ตั้ง setTimeout ยิง dispatch
 *  ทำให้จูนอนิเมชั่นแล้วจังหวะดาเมจเลื่อนตาม — ตอนนี้ตัดขาดกันแล้ว)
 */

/** เวลาที่ใช้แสดงผลของ event แต่ละชนิด (ms) — ปรับได้อิสระ ไม่กระทบกฎเกม */
const DURATION: Record<CombatEvent['t'], number> = {
  EnemyCardRevealed: 750,
  Damage: 450,
  BlockGained: 350,
  Healed: 350,
  StatusApplied: 350,
  Died: 500,
  TurnEnded: 150,
};

export type TimelineState = {
  /** event ที่กำลังแสดงอยู่ (null = ว่าง) */
  current: CombatEvent | null;
  /** ทุก event ที่เล่นไปแล้วรวมถึงตัวปัจจุบัน — ใช้วาดสิ่งที่ต้องค้างบนจอ */
  played: CombatEvent[];
  isPlaying: boolean;
};

export function useCombatTimeline(opts?: { speed?: number }) {
  const speed = opts?.speed ?? 1;

  const [state, setState] = React.useState<TimelineState>({
    current: null,
    played: [],
    isPlaying: false,
  });

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = React.useRef<(() => void) | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  React.useEffect(() => clearTimer, []);

  const finish = React.useCallback(() => {
    clearTimer();
    setState(s => ({ ...s, current: null, isPlaying: false }));
    const cb = doneRef.current;
    doneRef.current = null;
    cb?.();
  }, []);

  const play = React.useCallback(
    (events: CombatEvent[], onDone?: () => void) => {
      clearTimer();
      doneRef.current = onDone ?? null;

      if (events.length === 0) {
        setState({ current: null, played: [], isPlaying: false });
        doneRef.current = null;
        onDone?.();
        return;
      }

      setState({ current: null, played: [], isPlaying: true });

      let i = 0;
      const step = () => {
        if (i >= events.length) {
          finish();
          return;
        }
        const ev = events[i++];
        setState(s => ({ current: ev, played: [...s.played, ev], isPlaying: true }));
        timerRef.current = setTimeout(step, DURATION[ev.t] / speed);
      };
      step();
    },
    [speed, finish]
  );

  /**
   * ข้ามอนิเมชั่นที่เหลือทันที — ปลอดภัยเสมอเพราะ state ถูกคำนวณจบไปแล้ว
   * สิ่งเดียวที่ถูกข้ามคือภาพ
   */
  const skip = React.useCallback(() => finish(), [finish]);

  return { ...state, play, skip };
}
