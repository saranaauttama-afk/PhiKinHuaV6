import type {GameState,CardData} from '../types';
import type {RNG} from '../rng';
import {int} from '../rng';
import {BY_RARITY,cardById} from '../pack';
import {getClass} from '../classes';
import {SPECIAL_CARD_IDS} from './nights';
/** Distinct lanes let players compare damage, survival and an engine piece. */
export function rollNightCards(s:GameState,rng:RNG):{list:CardData[];rng:RNG}{
 const cls=getClass(s.classId);let r=rng;
 const fight=s.fightCount??0;
 const rarities: Array<keyof typeof BY_RARITY>=fight<3?['Common','Uncommon']:fight<7?['Common','Uncommon','Rare']:['Uncommon','Rare','Legendary'];
 const pool=rarities.flatMap(k=>BY_RARITY[k]).filter(c=>c.tags?.includes(cls.cardTag));
 if(s.campaign?.unlocks.includes('card')){const special=cardById(SPECIAL_CARD_IDS[cls.id]);if(special)pool.push(special);}
 const predicates=[(c:CardData)=>c.type==='attack',(c:CardData)=>!!(c.block||c.heal||c.tags?.includes('cleanse')),(c:CardData)=>!!(c.draw||c.energyGain||c.summonMinion||c.statusEffect||c.type==='equipment')];
 const list:CardData[]=[];
 for(const pred of predicates){let lane=pool.filter(c=>pred(c)&&!list.some(x=>x.id===c.id));if(!lane.length)lane=pool.filter(c=>!list.some(x=>x.id===c.id));if(!lane.length)continue;const roll=int(r,0,lane.length-1);r=roll.rng;list.push(JSON.parse(JSON.stringify(lane[roll.value])));}
 return {list,rng:r};
}
