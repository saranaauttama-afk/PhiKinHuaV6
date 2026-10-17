import type {GameState,CardData} from '../types';
import type {RNG} from '../rng';
import {int} from '../rng';
import {BY_RARITY,cardById,poolFor} from '../pack';
import {getClass} from '../classes';
import {SPECIAL_CARD_IDS} from './nights';
/**
 * Distinct lanes let players compare damage, survival and an engine piece.
 * Rarity is rolled per lane from ECONOMY.rewardRarity for the current night (fixed 14 Oct 2026:
 * the old fightCount thresholds (<3, <7) never applied because the first card reward is the
 * night-1 boss at fight 8, so every reward offered Legendary at equal odds — about half of all
 * rewards held one, from the first boss on).
 */
export function rollNightCards(s:GameState,rng:RNG):{list:CardData[];rng:RNG}{
 const cls=getClass(s.classId);let r=rng;
 const {ECONOMY}=require('../balance/notfm');
 const night=Math.max(1,Math.min(3,s.campaign?.night??1));
 const weights:Record<string,number>=ECONOMY.rewardRarity[night-1];
 const rarities=(Object.keys(weights) as Array<keyof typeof BY_RARITY>).filter(k=>weights[k]>0);
 const allowed=new Set(poolFor(cls.id,s.campaign?.milestoneLevel??0).map(c=>c.id));
 const pool=rarities.flatMap(k=>BY_RARITY[k]).filter(c=>allowed.has(c.id)&&!c.progressionRole);
 // Each rarity gets its weight, shared by that rarity's cards in the lane.
 const weighted=(lane:CardData[]):CardData=>{
  const rar=(c:CardData)=>c.rarity??'Common';
  const w=(c:CardData)=>weights[rar(c)]/lane.filter(x=>rar(x)===rar(c)).length;
  const total=lane.reduce((n,c)=>n+w(c),0);
  const roll=int(r,1,1000);r=roll.rng;
  let v=roll.value/1000*total;
  for(const c of lane){v-=w(c);if(v<=0)return c;}
  return lane[lane.length-1];
 };
 if(s.campaign?.unlocks.includes('card')){const special=cardById(SPECIAL_CARD_IDS[cls.id]);if(special)pool.push(special);}
 // Lanes: damage, survival, engine (draw, mana, statuses, equipment, counters).
 const predicates=[(c:CardData)=>!!c.fx.dmg,(c:CardData)=>!c.fx.dmg&&!!(c.fx.block||c.fx.heal||c.fx.cleanse),(c:CardData)=>!c.fx.dmg&&!c.fx.block&&!c.fx.heal];
 const list:CardData[]=[];
 for(const pred of predicates){let lane=pool.filter(c=>pred(c)&&!list.some(x=>x.id===c.id));if(!lane.length)lane=pool.filter(c=>!list.some(x=>x.id===c.id));if(!lane.length)continue;list.push(JSON.parse(JSON.stringify(weighted(lane))));}
 return {list,rng:r};
}
