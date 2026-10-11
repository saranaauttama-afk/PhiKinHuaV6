import {runFightTotal} from './threeNight';
import {adventureFightTotal} from '../map/adventure';
import {ALL_CLASS_IDS,type ClassId} from '../classes';
import type {RunRecord} from './metrics';

export type NightBest={smallestDeck:number;fewestCards:number;fewestTurns:number;wins:number};
export type ClassProgress={highestCleared:number;nightFiveWins:number;highestDifficulty:number;difficultyFiveWins:number;difficultyBest:Record<string,NightBest>;unlocks:Array<'card'|'blessing'>;best:Record<string,NightBest>;achievements:string[]};
export type Journal={version:1;classes:Record<ClassId,ClassProgress>;history:RunRecord[];recordedIds:string[]};
export const ACHIEVEMENTS=[
 {id:'first_dawn',name:'เห็นแสงแรก',desc:'ผ่านครบสามคืนในหนึ่งรอบ'},
 {id:'fifth_dawn',name:'พ้นอาถรรพ์',desc:'ชนะผีกินหัวในระดับอาถรรพ์ 5'},
 {id:'lean_deck',name:'วิชาน้อย แต่ถึงเช้า',desc:'ชนะด้วยสำรับตอนจบไม่เกิน 8 ใบ'},
 {id:'combo_keeper',name:'ผู้รู้จังหวะ',desc:'ทำคอมโบสำเร็จอย่างน้อย 15 ครั้งในรันที่ชนะ'},
 {id:'untouched',name:'ไร้รอยแผล',desc:'ชนะโดยไม่เสียพลังชีวิตจากความเสียหายในการต่อสู้'},
 {id:'wide_arsenal',name:'ครบเครื่อง',desc:'ชนะด้วยสำรับตอนจบอย่างน้อย 20 ใบ'},
] as const;
const emptyClass=():ClassProgress=>({highestCleared:0,nightFiveWins:0,highestDifficulty:0,difficultyFiveWins:0,difficultyBest:{},unlocks:[],best:{},achievements:[]});
export function emptyJournal():Journal{return {version:1,classes:Object.fromEntries(ALL_CLASS_IDS.map(id=>[id,emptyClass()])) as Journal['classes'],history:[],recordedIds:[]};}
export function unlockedNight(j:Journal,id:ClassId):number{return Math.min(5,j.classes[id].highestCleared+1);}
export function unlockedDifficulty(j:Journal,id:ClassId):number{return Math.min(5,j.classes[id].highestDifficulty+1);}
/** A run is credited once even if terminal commands or storage hydration repeat. */
export function recordRun(j:Journal,r:RunRecord):Journal{
 if(j.recordedIds.includes(r.id))return j;
 const out=JSON.parse(JSON.stringify(j)) as Journal;
 out.recordedIds.push(r.id);out.history=[r,...out.history].slice(0,60);
 if(r.difficulty!==undefined){
  const d=r.difficulty,p=out.classes[r.classId];
  if(!r.won||r.completedNights!==3||r.fights!==runFightTotal(d)||d<1||d>unlockedDifficulty(j,r.classId))return out;
  p.highestDifficulty=Math.max(p.highestDifficulty,d);
  if(d===5){p.difficultyFiveWins++;p.nightFiveWins++;}
  const old=p.difficultyBest[d];p.difficultyBest[d]={smallestDeck:Math.min(old?.smallestDeck??Infinity,r.deck.length),fewestCards:Math.min(old?.fewestCards??Infinity,r.metrics.cardsPlayed),fewestTurns:Math.min(old?.fewestTurns??Infinity,r.metrics.turns),wins:(old?.wins??0)+1};
  const earned=['first_dawn',d===5?'fifth_dawn':'',r.deck.length<=8?'lean_deck':'',r.metrics.combos>=15?'combo_keeper':'',r.metrics.damageTaken===0?'untouched':'',r.deck.length>=20?'wide_arsenal':''].filter(Boolean);p.achievements=[...new Set([...p.achievements,...earned])];
  return out;
 }
 if(!r.won||r.fights<(r.route==='adventure'?adventureFightTotal(r.night):15))return out;
 const p=out.classes[r.classId];
 // A skipped/locked tier never grants progression.
 if(r.night<1||r.night>unlockedNight(j,r.classId))return out;
 p.highestCleared=Math.max(p.highestCleared,r.night);
 if(r.night===5)p.nightFiveWins++;
 const old=p.best[r.night];
 p.best[r.night]={smallestDeck:Math.min(old?.smallestDeck??Infinity,r.deck.length),fewestCards:Math.min(old?.fewestCards??Infinity,r.metrics.cardsPlayed),fewestTurns:Math.min(old?.fewestTurns??Infinity,r.metrics.turns),wins:(old?.wins??0)+1};
 const earned=[r.night>=1?'first_dawn':'',r.night===5?'fifth_dawn':'',r.deck.length<=8?'lean_deck':'',r.metrics.combos>=15?'combo_keeper':'',r.metrics.damageTaken===0?'untouched':'',r.deck.length>=20?'wide_arsenal':''].filter(Boolean);
 p.achievements=[...new Set([...p.achievements,...earned])];
 return out;
}
export function claimUnlock(j:Journal,id:ClassId,kind:'card'|'blessing'):Journal{
 const p=j.classes[id];if(Math.max(p.highestCleared,p.highestDifficulty)<5||p.unlocks.includes(kind)||p.nightFiveWins<=p.unlocks.length)return j;
 const out=JSON.parse(JSON.stringify(j)) as Journal;out.classes[id].unlocks.push(kind);return out;
}
/** Corrupt profile data must never erase a good in-memory journal. */
export function parseJournal(raw:string):Journal{
 const d=JSON.parse(raw);if(d?.version!==1||!Array.isArray(d.history)||!Array.isArray(d.recordedIds))throw Error('Invalid journal');
 for(const id of ALL_CLASS_IDS){const p=d.classes?.[id];if(!p||!Number.isInteger(p.highestCleared)||p.highestCleared<0||p.highestCleared>5||!Number.isInteger(p.nightFiveWins)||p.nightFiveWins<0||!Array.isArray(p.unlocks)||p.unlocks.some((x:string)=>!['card','blessing'].includes(x))||!p.best||!Array.isArray(p.achievements))throw Error('Invalid class progress');}
 // Older single-night records remain readable but never promote three-night tiers.
 for(const id of ALL_CLASS_IDS){const p=d.classes[id];p.highestDifficulty??=0;p.difficultyFiveWins??=0;p.difficultyBest??={};if(!Number.isInteger(p.highestDifficulty)||p.highestDifficulty<0||p.highestDifficulty>5||!Number.isInteger(p.difficultyFiveWins)||p.difficultyFiveWins<0||!p.difficultyBest||typeof p.difficultyBest!=='object')throw Error('Invalid difficulty progress');}
 for(const r of d.history){if(!ALL_CLASS_IDS.includes(r?.classId)||!Number.isInteger(r.night)||r.night<1||r.night>5||!Array.isArray(r.deck)||!Array.isArray(r.blessings)||!r.metrics||typeof r.id!=='string')throw Error('Invalid run history');}
 for(const r of d.history)if(r.difficulty!==undefined&&(!Number.isInteger(r.difficulty)||r.difficulty<1||r.difficulty>5||!Number.isInteger(r.completedNights)||r.completedNights<0||r.completedNights>3))throw Error('Invalid three-night history');
 if(d.recordedIds.some((x:unknown)=>typeof x!=='string'))throw Error('Invalid credited runs');
 return d;
}
