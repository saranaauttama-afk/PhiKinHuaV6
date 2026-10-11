import type {CardData,GameState} from '../types';
import {TEST_WIN_CARD_ID} from './testWin';
/** The QA victory card occupies no normal retained-hand slot. */
export function normalHandCount(cards:readonly Pick<CardData,'id'>[]):number {
 return cards.filter(c=>c.id!==TEST_WIN_CARD_ID).length;
}
export function requiredDiscards(s:Pick<GameState,'piles'|'player'>):number {
 return Math.max(0,normalHandCount(s.piles.hand)-s.player.maxHandSize);
}
