import type {GameState,CardData} from '../types';
import type {RNG} from '../rng';
import {int} from '../rng';
import {BY_RARITY,cardById,poolFor} from '../pack';
import {getClass} from '../classes';
import {SPECIAL_CARD_IDS} from './nights';
/** Distinct lanes let players compare damage, survival and an engine piece. */
export function rollNightCards(s:GameState,rng:RNG):{list:CardData[];rng:RNG}{
 const cls=getClass(s.classId);let r=rng;
 const fight=s.fightCount??0;
 const rarities: Array<keyof typeof BY_RARITY>=fight<3?['Common','Uncommon']:fight<7?['Common','Uncommon','Rare']:['Uncommon','Rare','Legendary'];
 const allowed=new Set(poolFor(cls.id).map(c=>c.id));
 const pool=rarities.flatMap(k=>BY_RARITY[k]).filter(c=>allowed.has(c.id));
 if(s.campaign?.unlocks.includes('card')){const special=cardById(SPECIAL_CARD_IDS[cls.id]);if(special)pool.push(special);}
 // Lanes: damage, survival, engine (draw, mana, statuses, equipment, counters).
 const predicates=[(c:CardData)=>!!c.fx.dmg,(c:CardData)=>!c.fx.dmg&&!!(c.fx.block||c.fx.heal||c.fx.cleanse),(c:CardData)=>!c.fx.dmg&&!c.fx.block&&!c.fx.heal];
 const list:CardData[]=[];
 for(const pred of predicates){let lane=pool.filter(c=>pred(c)&&!list.some(x=>x.id===c.id));if(!lane.length)lane=pool.filter(c=>!list.some(x=>x.id===c.id));if(!lane.length)continue;const roll=int(r,0,lane.length-1);r=roll.rng;list.push(JSON.parse(JSON.stringify(lane[roll.value])));}
 return {list,rng:r};
}
