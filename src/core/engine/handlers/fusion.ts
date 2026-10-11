// src/core/engine/handlers/fusion.ts — คำสั่งผสานการ์ดที่แท่นผสาน

import type { Command, GameState } from '../../types';
import type { RNG } from '../../rng';
import { canFuse, fuseCards } from '../../cards/fusion';

/** ผสานได้กี่ครั้งต่อแท่นหนึ่ง — ครั้งเดียว เพื่อให้การเลือกมีน้ำหนัก */
export const FUSIONS_PER_ALTAR = 1;

export function fuseCardsCmd(
  s: GameState,
  cmd: Extract<Command, { type: 'FuseCards' }>,
  r: RNG
) {
  if (s.shopKind !== 'fusion') {
    s.log.push('ผสานการ์ดได้เฉพาะที่แท่นผสาน');
    return { state: s, rng: r };
  }

  const used = s.fusionAltar?.timesUsed ?? 0;
  if (used >= FUSIONS_PER_ALTAR) {
    s.log.push('แท่นนี้ใช้ไปแล้ว');
    return { state: s, rng: r };
  }

  const deck = s.masterDeck ?? [];
  const a = deck[cmd.indexA];
  const b = deck[cmd.indexB];

  // ต้องเป็นคนละตำแหน่งในสำรับ ไม่ใช่ใบเดียวกันเลือกซ้ำสองครั้ง
  if (cmd.indexA === cmd.indexB) {
    s.log.push('ต้องเลือกการ์ดคนละใบ');
    return { state: s, rng: r };
  }

  const check = canFuse(a, b);
  if (!check.ok) {
    s.log.push(`ผสานไม่ได้: ${check.reason}`);
    return { state: s, rng: r };
  }

  const fused = fuseCards(a, b);

  // ถอดสองใบเดิมออกก่อน แล้วค่อยใส่ใบใหม่ — ไล่จากตำแหน่งท้ายก่อน
  // ไม่งั้นการลบใบแรกจะทำให้ index ของใบที่สองเลื่อน
  const [hi, lo] = cmd.indexA > cmd.indexB
    ? [cmd.indexA, cmd.indexB]
    : [cmd.indexB, cmd.indexA];
  deck.splice(hi, 1);
  deck.splice(lo, 1);
  deck.push(fused);

  s.masterDeck = deck;
  s.fusionAltar = { timesUsed: used + 1 };
  s.log.push(`ผสาน ${a.name} + ${b.name} → ${fused.name}`);

  return { state: s, rng: r };
}
