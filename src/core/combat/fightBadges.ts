import type {GameState} from '../types';
import {scaleFx} from '../cards/fx';
import {starFx} from '../cards/model';
import {fxText,describeCard} from '../cards/describe';
/** Compact current-state badges; countdown and multiplier survive battle resume. */
export function fightBadges(s:GameState){
 const equipped=s.equipped??[];
 return [
  ...Array.from({length:s.equipmentSlotsMax??1},(_,i)=>{
   const c=equipped[i];return {id:`equip:${i}`,name:c?`เครื่องราง ${c.name}`:`ช่องเครื่องราง ${i+1} ว่าง`,symbol:'equipment',cardId:c?.id,neutral:true,count:`${i+1}`,detail:c?describeCard(c):'ยังไม่ได้สวมเครื่องรางในช่องนี้'};
  }),
  ...(s.prayers??[]).map((p,i)=>({id:`prayer:${p.card.instanceId??p.card.id}:${i}`,name:`บทสวด ${p.card.name}`,symbol:'spell_charging',cardId:p.card.id,count:`${p.turnsLeft}`,neutral:true,detail:`เหลือ ${p.turnsLeft} เทิร์น · เมื่อสำเร็จผล ×${p.mult}\n${fxText(scaleFx(starFx(p.card),p.mult)).join(' · ')}`})),
 ];
}
