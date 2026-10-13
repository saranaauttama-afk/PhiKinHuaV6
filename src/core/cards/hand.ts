import type {GameState} from '../types';
import {CARD_RULES} from '../balance/notfm';
import {ruleModifier} from './passives';
export function openingHandSize(s:GameState):number{
 return Math.min(s.player.handMax,Math.max(1,(s.player.retain??CARD_RULES.retain)+ruleModifier(s,'openingDraw')));
}
