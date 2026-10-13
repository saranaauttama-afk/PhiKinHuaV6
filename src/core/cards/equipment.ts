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

/** Assign identities once; never use deck positions as persistent ownership. */
export function normalizeLoadout(s:GameState):void{
 s.masterDeck=s.masterDeck??[];
 s.ownedCardSeq=Math.max(0,s.ownedCardSeq??0);
 const reserved=new Set(s.masterDeck.map(c=>c.ownedId).filter(Boolean));
 const seen=new Set<string>();
 for(const c of s.masterDeck){
  if(!c.ownedId||seen.has(c.ownedId)){do{c.ownedId=`owned-${++s.ownedCardSeq!}`;}while(reserved.has(c.ownedId)||seen.has(c.ownedId));}
  seen.add(c.ownedId);
 }
 const valid=new Set(s.masterDeck.filter(c=>c.type==='equipment').map(c=>c.ownedId!));
 s.equipmentLoadout=[...new Set(s.equipmentLoadout??[])].filter(id=>valid.has(id)).slice(0,s.equipmentSlotsMax??1);
}
export function loadoutIndices(s:GameState):number[]{
 return (s.equipmentLoadout??[]).map(id=>s.masterDeck.findIndex(c=>c.ownedId===id&&c.type==='equipment')).filter(i=>i>=0).slice(0,s.equipmentSlotsMax??1);
}
