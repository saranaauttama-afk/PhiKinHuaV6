// src/core/engine/handlers/story.ts — คำสั่งของเหตุการณ์เล่าเรื่อง

import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { getStoryEvent, choiceLocked, applyChoice } from '../../events/story';

export function chooseEventOption(
  s: GameState,
  cmd: Extract<Command, { type: 'ChooseEventOption' }>,
  r: RNG
) {
  if (!s.story) return { state: s, rng: r };

  // เลือกได้ครั้งเดียวต่อเหตุการณ์ — กดซ้ำแล้วได้ผลอีกรอบคือช่องโหว่ที่หาเจอง่ายมาก
  if (s.story.result != null) return { state: s, rng: r };

  const ev = getStoryEvent(s.story.eventId);
  if (!ev) {
    s.log.push(`ไม่พบเหตุการณ์ ${s.story.eventId}`);
    return { state: s, rng: r };
  }

  const choice = ev.choices[cmd.index];
  if (!choice) return { state: s, rng: r };

  const locked = choiceLocked(s, choice);
  if (locked) {
    s.log.push(`เลือกทางนี้ไม่ได้: ${locked}`);
    return { state: s, rng: r };
  }

  s.log.push(`${ev.title} → ${choice.label}`);
  const out = applyChoice(s, choice, r);

  s.story = { eventId: s.story.eventId, chosenIndex: cmd.index, result: out.text };
  return { state: s, rng: out.rng };
}
