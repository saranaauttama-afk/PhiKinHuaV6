import {runFightTotal} from './threeNight';
import {ALL_CLASS_IDS,type ClassId} from '../classes';
import type {RunRecord} from './metrics';

export type DifficultyBest={smallestDeck:number;fewestCards:number;fewestTurns:number;wins:number};
export type ClassProgress={highestDifficulty:number;difficultyFiveWins:number;difficultyBest:Record<string,DifficultyBest>;unlocks:Array<'card'|'blessing'>;achievements:string[]};
/** Version 2: three-night runs only. Older journals are discarded, not migrated. */
export type Journal={version:2;classes:Record<ClassId,ClassProgress>;history:RunRecord[];recordedIds:string[];totalCompletedNights:number};
export const ACHIEVEMENTS=[
 {id:'first_dawn',name:'เห็นแสงแรก',desc:'ผ่านครบสามคืนในหนึ่งรอบ'},
 {id:'fifth_dawn',name:'พ้นอาถรรพ์',desc:'ชนะผีกินหัวในระดับอาถรรพ์ 5'},
 {id:'lean_deck',name:'วิชาน้อย แต่ถึงเช้า',desc:'ชนะด้วยสำรับตอนจบไม่เกิน 8 ใบ'},
 {id:'untouched',name:'ไร้รอยแผล',desc:'ชนะโดยไม่เสียพลังชีวิตจากความเสียหายในการต่อสู้'},
 {id:'wide_arsenal',name:'ครบเครื่อง',desc:'ชนะด้วยสำรับตอนจบอย่างน้อย 20 ใบ'},
] as const;
const emptyClass=():ClassProgress=>({highestDifficulty:0,difficultyFiveWins:0,difficultyBest:{},unlocks:[],achievements:[]});
export function emptyJournal():Journal{return {version:2,classes:Object.fromEntries(ALL_CLASS_IDS.map(id=>[id,emptyClass()])) as Journal['classes'],history:[],recordedIds:[],totalCompletedNights:0};}
export function unlockedDifficulty(j:Journal,id:ClassId):number{return Math.min(5,j.classes[id].highestDifficulty+1);}
/** A run is credited once even if terminal commands or storage hydration repeat. */
export function recordRun(j:Journal,r:RunRecord):Journal{
 if(j.recordedIds.includes(r.id))return j;
 const out=JSON.parse(JSON.stringify(j)) as Journal;
 out.totalCompletedNights=(out.totalCompletedNights??j.history.reduce((n,h)=>n+h.completedNights,0))+Math.max(0,Math.min(3,r.completedNights));
 out.recordedIds.push(r.id);out.history=[r,...out.history].slice(0,60);
 const d=r.difficulty,p=out.classes[r.classId];
 if(!r.won||r.completedNights!==3||r.fights!==runFightTotal(d)||d<1||d>unlockedDifficulty(j,r.classId))return out;
 p.highestDifficulty=Math.max(p.highestDifficulty,d);
 if(d===5)p.difficultyFiveWins++;
 const old=p.difficultyBest[d];p.difficultyBest[d]={smallestDeck:Math.min(old?.smallestDeck??Infinity,r.deck.length),fewestCards:Math.min(old?.fewestCards??Infinity,r.metrics.cardsPlayed),fewestTurns:Math.min(old?.fewestTurns??Infinity,r.metrics.turns),wins:(old?.wins??0)+1};
 const earned=['first_dawn',d===5?'fifth_dawn':'',r.deck.length<=8?'lean_deck':'',r.metrics.damageTaken===0?'untouched':'',r.deck.length>=20?'wide_arsenal':''].filter(Boolean);p.achievements=[...new Set([...p.achievements,...earned])];
 return out;
}
export function claimUnlock(j:Journal,id:ClassId,kind:'card'|'blessing'):Journal{
 const p=j.classes[id];if(p.highestDifficulty<5||p.unlocks.includes(kind)||p.difficultyFiveWins<=p.unlocks.length)return j;
 const out=JSON.parse(JSON.stringify(j)) as Journal;out.classes[id].unlocks.push(kind);return out;
}
/** Corrupt profile data must never erase a good in-memory journal; old versions start fresh. */
export function parseJournal(raw:string):Journal{
 const d=JSON.parse(raw);
 if(d?.version===1)return emptyJournal();
 if(d?.version!==2||!Array.isArray(d.history)||!Array.isArray(d.recordedIds))throw Error('Invalid journal');
 for(const id of ALL_CLASS_IDS){const p=d.classes?.[id];if(!p||!Number.isInteger(p.highestDifficulty)||p.highestDifficulty<0||p.highestDifficulty>5||!Number.isInteger(p.difficultyFiveWins)||p.difficultyFiveWins<0||!p.difficultyBest||typeof p.difficultyBest!=='object'||!Array.isArray(p.unlocks)||p.unlocks.some((x:string)=>!['card','blessing'].includes(x))||!Array.isArray(p.achievements))throw Error('Invalid class progress');}
 for(const r of d.history){if(!ALL_CLASS_IDS.includes(r?.classId)||!Number.isInteger(r.night)||r.night<1||r.night>3||!Number.isInteger(r.difficulty)||r.difficulty<1||r.difficulty>5||!Number.isInteger(r.completedNights)||r.completedNights<0||r.completedNights>3||!Array.isArray(r.deck)||!Array.isArray(r.blessings)||!r.metrics||typeof r.id!=='string')throw Error('Invalid run history');}
 if(d.recordedIds.some((x:unknown)=>typeof x!=='string'))throw Error('Invalid credited runs');
 if(d.totalCompletedNights==null)d.totalCompletedNights=d.history.reduce((n:number,h:RunRecord)=>n+h.completedNights,0);
 if(!Number.isSafeInteger(d.totalCompletedNights)||d.totalCompletedNights<0)throw Error('Invalid accumulated nights');
 return d;
}
