import {campaignFightTotal,isThreeNight} from './threeNight';
import type {CardData,Command,GameState} from '../types';
import {cardsPlayedThisTurn} from '../cards/mechanics';

export type RunMetrics={
 initialDeck:number; smallestDeck:number; cardsPlayed:number; turns:number; combos:number;
 added:number; removed:number; upgraded:number; damageTaken:number; playedByCard:Record<string,number>;
};
export type RunRecord={
 id:string; classId:import('../classes').ClassId; night:number; difficulty?:number;completedNights?:number; won:boolean; fights:number;
 route?:'adventure'; totalFights?:number; level:number; hp:number; savedAt:string; metrics:RunMetrics; deck:CardData[];
 blessings:Array<{id:string;name:string;desc?:string}>;
};
export function trackRun(before:GameState,after:GameState,cmd:Command):void{
 if(cmd.type==='NewRun'){
  const n=after.masterDeck.length;
  after.runMetrics={initialDeck:n,smallestDeck:n,cardsPlayed:0,turns:0,combos:0,added:0,removed:0,upgraded:0,damageTaken:0,playedByCard:{}};
  return;
 }
 if(!after.runMetrics||before.runSummary)return;
 const m=after.runMetrics;
 if(cmd.type==='PlayCard'&&before.phase==='combat'&&cardsPlayedThisTurn(after)>cardsPlayedThisTurn(before)){
  const id=before.piles.hand[cmd.index]?.id;
  if(id){m.cardsPlayed++;m.playedByCard[id]=(m.playedByCard[id]??0)+1;}
 }
 if((before.phase!=='combat'&&after.phase==='combat')||(cmd.type==='StartPlayerTurn'&&after.phase==='combat'&&after.turn>before.turn))m.turns++;
 m.combos+=Math.max(0,(after.combo?.done.length??0)-(before.combo?.done.length??0));
 const delta=after.masterDeck.length-before.masterDeck.length;
 if(cmd.type==='FuseCards'&&delta===-1){m.added++;m.removed+=2;}
 else {if(cmd.type!=='UnequipToDeck')m.added+=Math.max(0,delta);if(cmd.type!=='EquipFromDeck')m.removed+=Math.max(0,-delta);}
 m.smallestDeck=Math.min(m.smallestDeck,after.masterDeck.length);
 if(['ShopUpgradeBuy','ChooseLevelUpOption','ChooseLevelUp'].includes(cmd.type)){
  const count=(s:GameState)=>s.masterDeck.reduce((n,c)=>n+(c.upgradeLevel??(c.upgraded?1:0)),0);
  m.upgraded+=Math.max(0,count(after)-count(before));
 }
 m.damageTaken+=(after.pendingEvents??[]).reduce((n,e)=>n+(e.t==='Damage'&&e.target==='player'?e.hpLoss:0),0);
 if(after.runSummary)after.runSummary.metrics=JSON.parse(JSON.stringify(m));
}
export function makeRunRecord(s:GameState,savedAt:string):RunRecord|undefined{
 if(!s.campaign||!s.runSummary||!s.runMetrics||!s.classId)return;
 return {id:`${s.classId}:${isThreeNight(s)?'difficulty-'+s.campaign.difficulty:s.campaign.night}:${s.seed}`,classId:s.classId,night:s.campaign.night,difficulty:s.campaign.difficulty,completedNights:s.campaign.completedNights,
  won:s.runSummary.won,fights:s.runSummary.fights,route:s.pages?.adventure?'adventure':undefined,totalFights:s.pages?.adventure?campaignFightTotal(s):undefined,level:s.player.level,hp:s.player.hp,savedAt,
  metrics:JSON.parse(JSON.stringify(s.runMetrics)),deck:JSON.parse(JSON.stringify(s.masterDeck)),
  blessings:(s.blessings??[]).map(({id,name,desc})=>({id,name,desc}))};
}
