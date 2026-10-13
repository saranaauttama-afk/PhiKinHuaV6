import {difficultyOf} from './threeNight';
import type {ClassId} from '../classes';
import type {BlessingDef,GameState} from '../types';
import {NIGHT_ENEMY_DECKS} from './enemyDecks';
import {applyStatusEffect} from '../statusEffectsRuntime';
import {applyEnemyBattleRule} from './enemyRules';
import {DIFFICULTY,ENEMY_HP,ENEMY_RULES,RAGE} from '../balance/notfm';

export type Night=import('./threeNight').RunNight;
export type CampaignRun={night:Night;difficulty:import('./threeNight').Difficulty;completedNights:number;unlocks:Array<'card'|'blessing'>;
 /** ความกล้า / บุญ, 0–ALIGNMENT.max. */
 courage?:number;merit?:number;
 /** Blessings already granted for reaching the threshold. */
 alignmentRewards?:Array<'courage'|'merit'>;
 /** Ghosts already talked to this run, and dialogues held this night. */
 talked?:string[];talksThisNight?:number;
 veteran?:boolean;
 /** Nights cleared across all runs when this run began: unlocks แพนโดรา blessings. */
 blessingTier?:number;
 /** The night-3 boss, fixed when its slot appears. */
 finalBossId?:string;milestoneLevel?:number;eventByNight?:Record<string,string>};
export const SPECIAL_CARD_IDS:Record<ClassId,string>={warrior:'night_guardian_cut',shaman:'night_hex_knot',nun:'night_lotus_wheel',medium:'night_ancestor_pact'};
/** The class blessing a fifth-night clear can unlock. */
export const SPECIAL_BLESSINGS:Record<ClassId,BlessingDef>=Object.fromEntries((['warrior','shaman','nun','medium'] as ClassId[]).map(id=>[id,require('../pack').classBlessing(id)])) as Record<ClassId,BlessingDef>;
export function configureNightEnemy(s:GameState):void{
 if(!s.campaign||!s.enemy)return;
 const d=difficultyOf(s);
 const monster=require('../monsters/thai-ghosts').getMonsterById(s.enemy.id);
 const offer=s.pages?.current?.offers[s.pages?._activeOfferIndex??-1];
 const boss=offer?.kind==='boss';
 const elite=offer?.kind==='monster'&&offer.tier==='elite';
 const tier=Math.max(1,Math.min(5,Number(monster?.tier.slice(1))||1));
 const baseHp=boss?(s.enemy.id==='phi-kin-hua'?ENEMY_HP.ultimateBoss:ENEMY_HP.boss):elite?ENEMY_HP.elite:ENEMY_HP.normal+tier*ENEMY_HP.perTier;
 s.enemy.hp=s.enemy.maxHp=Math.round(baseHp*(boss?ENEMY_HP.bossNight:ENEMY_HP.night)[s.campaign.night-1]*(d>=DIFFICULTY.hpFrom?1+DIFFICULTY.hpPct/100:1));
 const rules=ENEMY_RULES[boss?'boss':elite?'elite':'normal'];
 s.enemy.maxAp=rules.ap;s.enemy.handSize=rules.handSize;
 if(NIGHT_ENEMY_DECKS[s.enemy.id])s.enemy.deck=[...NIGHT_ENEMY_DECKS[s.enemy.id]];
 applyEnemyBattleRule(s);
}
/** Whether rage is on for this fight: from night `RAGE.fromNight(difficulty)`. */
export function rageActive(s:Partial<GameState>):boolean{
 return !!s.campaign&&s.campaign.night>=RAGE.fromNight(difficultyOf(s));
}
/** Ghost turn on which rage begins; level 4+ starts it `DIFFICULTY.rageEarlyBy` turn(s) sooner. */
export function rageStartTurn(s:Partial<GameState>):number{
 if(!rageActive(s as GameState))return RAGE.backstopTurn;
 return RAGE.startTurn-(difficultyOf(s)>=DIFFICULTY.rageEarlyFrom?DIFFICULTY.rageEarlyBy:0);
}
/** Rage stacks for the ghost's current turn (0 before `RAGE.startTurn`). Counts ghost turns, not player turns. */
export function rageStacks(s:Partial<GameState>):number{
 const ghostTurn=s.fight?.ghostTurns??s.turn??1;
 const start=rageStartTurn(s);
 return Math.max(0,(ghostTurn-start+1)*RAGE.perTurn);
}
/** Start of the ghost's turn: rage rises to match how long the fight has lasted. */
export function applyRage(s:GameState):void{
 if(!s.enemy)return;
 const n=rageStacks(s);if(!n)return;
 const list=s.enemy.statusEffects??=[];
 const old=list.find(e=>e.id==='rage');
 if(old){if((old.stacks??0)>=n)return;old.stacks=n;old.duration=99;}
 else applyStatusEffect('enemy',s,'rage',99,n);
 s.log.push(`ผีโกรธ ${n}: ทุกหมัดแรงขึ้น ${n}`);
}

function adventureRoute(s:GameState){const ix=s.pages?._activeOfferIndex;return ix!=null&&s.pages?.adventure&&s.pages.current?.offers[ix]?.kind==='monster';}
