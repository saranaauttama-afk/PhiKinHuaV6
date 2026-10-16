import type {GameState} from '../src/core/types';
/** Rewards are already rolled by the engine. This gate only orders their presentation. */
export function needsVictoryIntro(phase:GameState['phase'],fight:number,celebratedFight:number):boolean {
 // The ghost talk comes first, on the battle scene (owner 16 Oct 2026); the summary follows it.
 return ['levelup','reward','victory'].includes(phase)&&fight!==celebratedFight;
}
