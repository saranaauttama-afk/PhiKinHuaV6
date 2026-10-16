import type {CombatEvent} from '../../../src/core/types';
/** View-only: armour absorption must never look like a wound. */
export function hitFeedback(event:CombatEvent,maxHp:number){
 const flesh=event.t==='Damage'&&event.hpLoss>0;
 return {enemy:flesh&&event.target==='enemy',player:flesh&&event.target==='player',heavy:flesh&&event.target==='player'&&event.hpLoss>=Math.max(1,maxHp)*.25};
}
