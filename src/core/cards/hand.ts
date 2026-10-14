import type {GameState} from '../types';
import {CARD_RULES,DIFFICULTY} from '../balance/notfm';
import {ruleModifier} from './passives';
/** Opening bonus card (CARD_RULES.openingBonus), except from DIFFICULTY.noOpeningBonusFrom. */
export function openingBonus(s:GameState):number{
 return (s.campaign?.difficulty??1)>=DIFFICULTY.noOpeningBonusFrom?0:CARD_RULES.openingBonus;
}
export function openingHandSize(s:GameState):number{
 // Uses the max hand after bargain costs (review 14 Oct 2026: ธูปหลุดมือ cut the hand to 0 but the opening stayed 3).
 return Math.min(s.player.handMax,Math.max(1,require('../engine/handlers/combat').retainLimit(s)+openingBonus(s)+ruleModifier(s,'openingDraw')));
}
