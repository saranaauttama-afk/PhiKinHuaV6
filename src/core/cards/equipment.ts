import type {GameState} from '../types';
import type {RNG} from '../rng';
import {runEquipTriggers} from './passives';
/** Validate the whole selection before entry: slots, ownership, no repeated instance. */
export function validEquipmentSelection(s:GameState,indices:number[]):boolean{
 return indices.length<=(s.equipmentSlotsMax??1)&&new Set(indices).size===indices.length&&indices.every(i=>Number.isInteger(i)&&s.masterDeck[i]?.type==='equipment');
}
export function prepareEquipment(s:GameState,r:RNG):RNG{
 for(const i of s.preEquipment??[]){
  const at=s.piles.draw.findIndex(c=>c.instanceId===`${s.masterDeck[i]?.id}__${i+1}`);
  if(at<0)continue;
  const [card]=s.piles.draw.splice(at,1);s.equipped!.push(card);
  s.log.push(`สวมก่อนต่อสู้ ${card.name}`);r=runEquipTriggers(s,card.instanceId!,r);
 }
 return r;
}
