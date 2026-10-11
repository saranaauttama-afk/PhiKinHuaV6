import type {GameState} from '../src/core/types';
/** Rewards are already rolled by the engine. This gate only orders their presentation. */
export function needsVictoryIntro(phase:GameState['phase'],fight:number,celebratedFight:number):boolean {
 return ['levelup','reward','victory'].includes(phase)&&fight!==celebratedFight;
}
