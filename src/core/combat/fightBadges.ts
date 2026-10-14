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
  ...fighterBadges(s),
  ...(s.prayers??[]).map((p,i)=>({id:`prayer:${p.card.instanceId??p.card.id}:${i}`,name:`บทสวด ${p.card.name}`,symbol:'spell_charging',cardId:p.card.id,count:`${p.turnsLeft}`,neutral:true,detail:`เหลือ ${p.turnsLeft} เทิร์น · เมื่อสำเร็จผล ×${p.mult}\n${fxText(scaleFx(starFx(p.card),p.mult)).join(' · ')}`})),
 ];
}

/**
 * นักมวยคาดเชือก state on the player's status row: จังหวะ, ยก, สวนที่ตั้งไว้, คาดเชือกใหม่, ศิษย์ค่าย.
 * Rhythm and round show only for a class with rhythm; minions show for anyone who has them.
 */
export function fighterBadges(s:GameState){
 const F=require('../cards/fighter'),{FIGHTER_RULES}=require('../balance/notfm');
 const out:Array<{id:string;name:string;symbol:string;detail:string;count?:string;neutral?:boolean;bad?:boolean}>=[];
 if(F.usesRhythm(s)){
  const r=F.rhythmOf(s);
  out.push({id:'fighter:rhythm',name:'จังหวะ',symbol:'rhythm',neutral:true,count:`${r}`,detail:`จังหวะ ${r}/${FIGHTER_RULES.rhythmMax} · การ์ดโจมตี +${r*FIGHTER_RULES.dmgPerStack} ดาเมจต่อครั้ง\nออกท่าไม่ซ้ำกับท่าก่อนหน้าได้ +${FIGHTER_RULES.perNewMove} · จบเทิร์นโดยไม่ได้ตี จังหวะหายหมด${s.fight?.rhythmLocked?'\nใจนักมวย: จังหวะไม่หายจนจบไฟต์':''}${s.fight?.lastAttackMove?`\nท่าล่าสุด: ${F.MOVE_NAMES[s.fight.lastAttackMove]}`:''}`});
  const turn=s.turn??1,round=F.roundOf(turn),left=FIGHTER_RULES.roundTurns-((turn-1)%FIGHTER_RULES.roundTurns);
  out.push({id:'fighter:round',name:`ยก ${round}`,symbol:'round',neutral:true,count:`${round}`,detail:`ยกละ ${FIGHTER_RULES.roundTurns} เทิร์น · ${left===1?'เทิร์นนี้เป็นเทิร์นสุดท้ายของยก พักยกหลังจบเทิร์น':`อีก ${left} เทิร์นถึงพักยก`}`});
 }
 for(const [i,fx] of (s.fight?.ripostes??[]).entries())out.push({id:`fighter:riposte:${i}`,name:'สวน',symbol:'trap',neutral:true,detail:`ถ้าการ์ดโจมตีใบถัดไปของผีทำให้เราไม่เสียเลือด: ${fxText(fx).join(' · ')}`});
 if(s.turnFlags?.doubleNext)out.push({id:'fighter:double',name:'คาดเชือกใหม่',symbol:'check',neutral:true,detail:'การ์ดโจมตีใบถัดไปเทิร์นนี้ทำงาน 2 ครั้ง'});
 for(const m of s.minions??[])out.push({id:`minion:${m.uid}`,name:m.name,symbol:'minion',neutral:true,count:`${m.hp}`,detail:`ศิษย์ค่าย · เลือด ${m.hp}/${m.maxHp}\n${require('./minions').minionDef(m.id)?.desc??''}`});
 return out;
}

/** The ghost's ลูกสมุน for the enemy status row. */
export function enemyMinionBadges(s:GameState){
 return (s.enemyMinions??[]).map(m=>({id:`minion:${m.uid}`,name:m.name,symbol:'minion',bad:true,count:`${m.hp}`,detail:`ลูกสมุนของผี · เลือด ${m.hp}/${m.maxHp}${m.taunt?' · รับหมัดแทนผี':''}${m.turnsLeft!=null?` · อยู่อีก ${m.turnsLeft} เทิร์น`:''}\n${require('./minions').minionDef(m.id)?.desc??''}`}));
}

/** ความลึก of the current ghost (ENEMY_DEPTH): how much tougher it is than the night's first fight. */
export function enemyDepthBadges(s:GameState){
 const depth=s.enemy?.depth??0;if(!depth)return [];
 const {ENEMY_DEPTH}=require('../balance/notfm');
 const str=(ENEMY_DEPTH.strengthAt as number[]).filter(a=>depth>=a).length,ap=depth>=ENEMY_DEPTH.apFrom;
 return [{id:'ghost-depth',name:`ไฟต์ที่ ${depth+1} ของคืน`,symbol:'strength',bad:true,count:`${depth+1}`,detail:`ยิ่งเดินลึก ผียิ่งแกร่ง · เลือด +${depth*ENEMY_DEPTH.hpPct}%${str?` · แรง +${str}`:''}${ap?' · แต้มผี +1':''}\nนับจากผีที่ชนะไปแล้วในคืนนี้ ไม่ว่าจะเลือกเพจไหนก่อน`}];
}
