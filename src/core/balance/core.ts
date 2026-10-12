// ค่าพื้นฐานเริ่มเกม + เด็คเริ่มต้น
import type { CardData } from '../types';
import { START_DECK as START_DECK_FROM_PACK } from '../pack';

export const START_HP = 50;
export const START_GOLD = 80;

export const START_DECK: CardData[] = START_DECK_FROM_PACK;

// Ghost hands, HP and rage live in balance/notfm.ts.
