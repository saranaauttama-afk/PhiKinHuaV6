import type {CardData, CombatEventTarget, GameState} from '../types';
import {emit} from './damage';

/** Presentation receipts only. Never used by AI, costs, rewards or RNG. */
export function historySnapshot(s:GameState) {
  return JSON.parse(JSON.stringify({player:s.player,enemy:s.enemy,hand:s.piles.hand.length,traps:s.traps??[],equipped:s.equipped??[]}));
}
export function recordCardHistory(s:GameState,side:CombatEventTarget,card:CardData,before:ReturnType<typeof historySnapshot>,eventStart:number,note?:string,costPaid:number|{ap:number;mana:number}=0) {
  const results:string[]=[];
  const label=(target:CombatEventTarget)=>target==='player'?'เรา':'ผี';
  const events=(s.pendingEvents??[]).slice(eventStart);
  const totals=new Map<string,number>();
  // Clamp to actual HP lost, including an overkill hit and reflection.
  const hp={player:before.player.hp,enemy:before.enemy?.hp??0};
  for(const e of events){
    let key='',amount=0;
    if(e.t==='Damage'){key=`${label(e.target)}เสีย HP`;amount=Math.min(hp[e.target],e.hpLoss);hp[e.target]-=amount;}
    if(e.t==='BlockGained'){key=`${label(e.target)}ได้เกราะ`;amount=e.amount;}
    if(e.t==='Healed'){key=`${label(e.target)}ฟื้น HP`;amount=e.amount;hp[e.target]+=amount;}
    if(key&&amount>0)totals.set(key,(totals.get(key)??0)+amount);
  }
  for(const [key,amount] of totals)results.push(`${key} ${amount}`);
  for(const target of ['player','enemy'] as const){
    const old=before[target],now=s[target];if(!old||!now)continue;
    // QA victory and older card implementations may update HP without events.
    if(!events.some(e=>(e.t==='Damage'||e.t==='Healed')&&e.target===target)&&old.hp!==now.hp)results.push(`${label(target)}${now.hp<old.hp?'เสีย':'ฟื้น'} HP ${Math.abs(now.hp-old.hp)}`);
    if(!events.some(e=>e.t==='BlockGained'&&e.target===target)&&now.block>old.block)results.push(`${label(target)}ได้เกราะ ${now.block-old.block}`);
    for(const effect of now.statusEffects??[]){
      const prev=old.statusEffects?.find((e:{id:string})=>e.id===effect.id);
      if(!prev||JSON.stringify(prev)!==JSON.stringify(effect))results.push(`${label(target)}: ${effect.name??effect.id} ${effect.stacks??effect.value??1}`);
    }
  }
  const paid=typeof costPaid==='number'?{ap:0,mana:0,energy:Math.max(0,costPaid)}:{...costPaid,energy:0};
  if(paid.energy)results.push(`ใช้พลัง ${paid.energy}`);
  if(paid.ap)results.push(`ใช้แต้ม ${paid.ap}`);
  const word=require('../cards/water').resourceName(s.classId);
  if(paid.mana)results.push(`ใช้${word} ${paid.mana}`);
  const manaGained=s.player.mana-before.player.mana+(side==='player'?paid.mana:0);
  if(manaGained>0)results.push(`เราได้${word} ${manaGained}`);
  const drawn=s.piles.hand.length-before.hand+(side==='player'?1:0);
  if(drawn>0)results.push(`เราได้ไพ่ ${drawn} ใบ`);
  if((s.traps?.length??0)>before.traps.length)results.push('ตั้งกับดัก');
  for(const eq of s.equipped??[])if(!before.equipped.some((old:{instanceId?:string})=>old.instanceId===eq.instanceId))results.push(`สวม ${eq.name}`);
  if(note)results.unshift(note);
  const entry={seq:(s.cardHistorySeq??0)+1,side,turn:s.turn,ownerId:side==='enemy'?before.enemy?.id:undefined,card:JSON.parse(JSON.stringify(card)),results:results.length?results:['ไม่มีผลเพิ่มเติมในตอนนี้']};
  s.cardHistorySeq=entry.seq;s.cardHistory=[...(s.cardHistory??[]),entry].slice(-6);
  emit(s,{t:'CardResolved',entry});
}
