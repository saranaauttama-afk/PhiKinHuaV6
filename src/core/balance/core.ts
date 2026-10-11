// ค่าพื้นฐานเริ่มเกม + เด็คเริ่มต้น
import type { CardData } from '../types';
import { START_DECK as START_DECK_FROM_PACK } from '../pack';

export const V33_HAND_BALANCE = {energy:2,openingDraw:2,drawPerTurn:2,retainedHand:2} as const;

export const START_HP = 50;
export const START_ENERGY = 3;
/** Legacy hand default; v33 three-night runs use independent draw and retention rules. */
export const HAND_SIZE = 5;
export const START_GOLD = 80;

export const START_DECK: CardData[] = START_DECK_FROM_PACK;

// พลังงาน/ขนาดมือ/ขนาดเด็คศัตรู
export const ENEMY_HAND_SIZE = 3; // เพิ่มเป็น 3 ใบ
export const ENEMY_DECK_SIZE = 15; // เพิ่มขนาดเด็ค

export const ENEMY_MAX_ENERGY_NORMAL = 2;
export const ENEMY_MAX_ENERGY_ELITE  = 3;
export const ENEMY_MAX_ENERGY_BOSS   = 3;