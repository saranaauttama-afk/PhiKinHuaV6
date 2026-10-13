import type {GameState} from '../types';
import {CARD_RULES,DIFFICULTY} from '../balance/notfm';
import {ruleModifier} from './passives';
/** Opening bonus card (CARD_RULES.openingBonus), except from DIFFICULTY.noOpeningBonusFrom. */
export function openingBonus(s:GameState):number{
 return (s.campaign?.difficulty??1)>=DIFFICULTY.noOpeningBonusFrom?0:CARD_RULES.openingBonus;
}
export function openingHandSize(s:GameState):number{
 return Math.min(s.player.handMax,Math.max(1,(s.player.retain??CARD_RULES.retain)+openingBonus(s)+ruleModifier(s,'openingDraw')));
}
