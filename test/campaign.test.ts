import {describe,it,expect} from 'vitest';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {ALL_CLASS_IDS,type ClassId} from '../src/core/classes';
import {onRestRow,restBudgetLeft} from '../src/core/map/restPage';
import {emptyJournal,recordRun,claimUnlock,unlockedNight,parseJournal} from '../src/core/campaign/journal';
import {makeRunRecord,type RunRecord} from '../src/core/campaign/metrics';
import {NIGHT_ENEMY_DECKS} from '../src/core/campaign/enemyDecks';
import {SPECIAL_CARD_IDS,SPECIAL_BLESSINGS,type Night} from '../src/core/campaign/nights';
import {rollNightCards} from '../src/core/campaign/rewards';
import {cardById,BY_RARITY} from '../src/core/pack';
import {enemyCardById} from '../src/core/pack_enemy_cards';
import {NIGHT_BOSSES,nightFightTotal,ULTIMATE_BOSS} from '../src/core/campaign/bosses';
import {awakenNightBoss} from '../src/core/campaign/nights';
import {resolveEnemyCard} from '../src/core/combat/enemyCardEffects';
import {applyStatusEffect} from '../src/core/statusEffectsRuntime';
import {toBattleSave,fromSave} from '../src/core/save';
import type {GameState,Command} from '../src/core/types';
import {isCriticalOffer,skippableSlots} from '../src/core/map/adventure';
import {screenForState} from '../app/screenRouter';
function driver(cls:ClassId='warrior',night:Night=1,unlocks:Array<'card'|'blessing'>=[]){
 const seed=`campaign-${cls}-${night}`;let state=baseNewState(seed),rng=makeRng(seed);
 const go=(cmd:Command)=>{const o=applyCommand(state,cmd,rng);state=o.state;rng=o.rng;return state;};
 go({type:'NewRun',seed,classId:cls,night,unlocks});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});
 return {go,get state(){return state;},get rng(){return rng;}};
}
function finish(d:ReturnType<typeof driver>){
 for(let guard=0;guard<250&&!d.state.runSummary;guard++){
  if(d.state.chapter){d.go({type:'SkipChapter'});continue;}
  if(d.state.phase==='map'){
   const offers=d.state.pages!.current!.offers;
   const critical=offers.findIndex(o=>o&&isCriticalOffer(o));
   if(critical>=0)d.go({type:'ChooseOffer',index:critical});else d.go({type:'Proceed'});
  }else if(d.state.phase==='combat'){
   if(d.state.campaign?.night===5&&d.state.fightCount===5)d.state.player.hp=1;
   if(d.state.campaign?.night===5&&d.state.fightCount===6){expect(d.state.runSummary).toBeUndefined();expect(d.state.enemy?.id).toBe(ULTIMATE_BOSS.id);}
   d.state.piles.hand=[{id:'structural-test',name:'test',type:'attack',cost:0,dmg:9999}];d.go({type:'PlayCard',index:0});
  }else if(d.state.phase==='event'){d.go({type:'ChooseEventOption',index:0});d.go({type:'CompleteNode'});}
  else if(d.state.phase==='levelup')d.go({type:'SkipLevelUp'});
  else if(d.state.phase==='reward')d.go({type:'SkipCardReward'});
  else if(d.state.phase==='victory')d.go({type:'CompleteNode'});
  else throw Error(d.state.phase);
 }
 return d.state;
}
describe('five-night campaign',()=>{
 it('a completed first night can return to the cover without losing credited progress',()=>{
  const d=driver();const finished=finish(d);
  const record=makeRunRecord(finished,'2026-10-09')!;
  const journal=recordRun(emptyJournal(),record);
  const out=applyCommand(finished,{type:'EnterMenu'},d.rng);
  expect(screenForState(out.state,{pickingClass:false})).toBe('start');
  expect(out.state.runSummary).toEqual(finished.runSummary);
  expect(out.rng).toEqual(d.rng);
  expect(unlockedNight(journal,'warrior')).toBe(2);
  expect(recordRun(journal,makeRunRecord(out.state,'2026-10-09')!)).toEqual(journal);
  expect(screenForState(out.state,{pickingClass:true})).toBe('class-select');
 });
 for(const cls of ALL_CLASS_IDS)for(const night of [1,2,3,4,5] as const)it(`${cls} night ${night}: 12 finite encounters and a credited ending`,()=>{
  const d=driver(cls,night);expect(d.state.pages!.adventure!.deck).toHaveLength(12);expect(d.state.journey).toBeUndefined();
  const s=finish(d);expect(s.runSummary?.won).toBe(true);expect(s.runSummary?.fights).toBe((night===5?7:6));expect(!!s.secretBossUnlocked).toBe(night===5);expect(s.runSummary?.metrics?.cardsPlayed).toBe((night===5?7:6));expect(s.runMetrics?.turns).toBe((night===5?7:6));if(night===5)expect(s.runSummary?.beatSecretBoss).toBe(true);
 });
 it('each night fixes a distinct final boss and night five ends only after the ultimate boss',()=>{
  expect(new Set(NIGHT_BOSSES.map(b=>b.id)).size).toBe(5);
  for(const night of [1,2,3,4,5] as const){const d=driver('warrior',night);const s=finish(d);expect(s.defeatedEnemyIds).toContain(NIGHT_BOSSES[night-1].id);if(night===5){expect(s.defeatedEnemyIds).toContain(ULTIMATE_BOSS.id);expect(s.fightCount).toBe(7);}}

 });
 it('higher nights increase health/strength without shortening the route',()=>{
  const values=[1,2,3,4,5].map(n=>{const d=driver('warrior',n as Night);d.state.pages!.current!.offers[0]={kind:'monster',enemyId:'phi-pop'} as any;d.go({type:'ChooseOffer',index:0});return {hp:d.state.enemy!.maxHp,strength:d.state.enemy!.statusEffects?.find(e=>e.id==='strength')?.stacks??0};});
  expect(values.map(v=>v.hp)).toEqual([28,31,34,36,39]);expect(values.map(v=>v.strength)).toEqual([0,1,1,1,1]);
 });
 it('boss awakening triggers once and new energy starts on the next hand',()=>{
  const d=driver('warrior',5);d.state.pages!.current!.offers[0]={kind:'boss',bossType:'final',enemyId:'phaya-nak'} as any;d.go({type:'ChooseOffer',index:0});const s=d.state;s.enemy!.hp=Math.floor(s.enemy!.maxHp/2);
  const budget=s.enemy!.maxEnergy!;awakenNightBoss(s);const strength=s.enemy!.statusEffects!.find(e=>e.id==='strength')!.stacks;expect(s.enemy!.block).toBe(14);expect(s.enemy!.maxEnergy).toBe(budget+1);awakenNightBoss(s);expect(s.enemy!.statusEffects!.find(e=>e.id==='strength')!.stacks).toBe(strength);
 });
 it('all new ghosts have resolvable, distinct, mixed full decks',()=>{
  for(const [owner,ids] of Object.entries(NIGHT_ENEMY_DECKS)){expect(ids).toHaveLength(15);const cards=ids.map(id=>enemyCardById(id)!);expect(cards.every(c=>c&&c.owner===owner)).toBe(true);expect(cards.some(c=>c.type==='skill')).toBe(true);expect(cards.some(c=>c.id.endsWith('_signature'))).toBe(true);}
 });
 it('entangle denies enemy attacks, while curses are fight-only and summons visible',()=>{
  const d=driver();d.go({type:'ChooseOffer',index:0});const s=d.state;const hp=s.player.hp;applyStatusEffect('enemy',s,'entangle',2,1);resolveEnemyCard(s,enemyCardById('thep_aksorn_signature')!);expect(s.player.hp).toBe(hp);expect(s.piles.discard.some(c=>c.type==='curse')).toBe(false);
  s.enemy!.statusEffects=[];resolveEnemyCard(s,enemyCardById('thep_aksorn_signature')!);expect(s.piles.discard.some(c=>c.type==='curse')).toBe(true);expect(s.masterDeck.some(c=>c.type==='curse')).toBe(false);resolveEnemyCard(s,enemyCardById('jao_por_pa_signature')!);expect(s.minions?.some(m=>m.owner==='enemy')).toBe(true);
 });
 it('invalid plays do not inflate statistics and combat saves preserve night/metrics/RNG',()=>{
  const d=driver();d.go({type:'ChooseOffer',index:0});d.go({type:'PlayCard',index:99});expect(d.state.runMetrics!.cardsPlayed).toBe(0);
  const saved=toBattleSave(d.state,d.rng);const restored=fromSave(saved);expect(restored?.campaign).toEqual(d.state.campaign);expect(restored?.runMetrics).toEqual(d.state.runMetrics);
 });
 for(const cls of ALL_CLASS_IDS)it(`${cls}: reward unlock stays in that class and starter blessing is offered only when unlocked`,()=>{
  const locked=driver(cls),open=driver(cls,1,['card','blessing']);expect(locked.state.blessings?.some(b=>b.id===SPECIAL_BLESSINGS[cls].id)).toBe(false);
  let s=baseNewState('unlock');s=applyCommand(s,{type:'NewRun',seed:'unlock',classId:cls,night:1,unlocks:['blessing']},makeRng('unlock')).state;
  expect(s.starter?.choices.some(b=>b.id===SPECIAL_BLESSINGS[cls].id)).toBe(true);
  expect(Object.values(BY_RARITY).flat().some(c=>c.id===SPECIAL_CARD_IDS[cls])).toBe(false);
  let found=false;for(let i=0;i<120;i++){const cards=rollNightCards(open.state,makeRng(`unlock-${i}`)).list;for(const c of cards)expect(c.tags).toContain(cls);found ||= cards.some(c=>c.id===SPECIAL_CARD_IDS[cls]);expect(rollNightCards(locked.state,makeRng(`unlock-${i}`)).list.some(c=>c.id===SPECIAL_CARD_IDS[cls])).toBe(false);}
  expect(found).toBe(true);expect(open.state.masterDeck.some(c=>c.id===SPECIAL_CARD_IDS[cls])).toBe(false);expect(cardById(SPECIAL_CARD_IDS[cls])).toBeDefined();
 });
});
function record(night:number,id:string,over:Partial<RunRecord>={}):RunRecord{
 const s=finish(driver());return {...makeRunRecord(s,'2026-10-08')!,night,id,fights:night===5?7:6,...over};
}
describe('persistent class journal',()=>{
 it('unlocks sequentially, records defeats without promotion, and is idempotent',()=>{
  let j=emptyJournal();j=recordRun(j,record(3,'locked'));expect(j.classes.warrior.highestCleared).toBe(0);j=recordRun(j,record(1,'loss',{won:false}));expect(unlockedNight(j,'warrior')).toBe(1);
  const r=record(1,'win');j=recordRun(j,r);expect(unlockedNight(j,'warrior')).toBe(2);expect(j.classes.shaman.highestCleared).toBe(0);expect(recordRun(j,r)).toBe(j);
 });
 it('two fifth-night clears grant two different choices; restarting or replaying a result grants nothing extra',()=>{
  let j=emptyJournal();for(let n=1;n<=5;n++)j=recordRun(j,record(n,'win-'+n));j=claimUnlock(j,'warrior','card');expect(j.classes.warrior.unlocks).toEqual(['card']);expect(claimUnlock(j,'warrior','blessing')).toBe(j);j=recordRun(j,record(5,'win-again'));j=claimUnlock(j,'warrior','blessing');expect(j.classes.warrior.unlocks).toEqual(['card','blessing']);expect(claimUnlock(j,'warrior','card')).toBe(j);expect(parseJournal(JSON.stringify(j))).toEqual(j);
 });
 it('independent personal bests retain deck and blessings without rewarding failed small decks',()=>{
  let j=emptyJournal();const r=record(1,'a');r.deck=r.deck.slice(0,8);r.metrics.cardsPlayed=100;r.metrics.turns=80;j=recordRun(j,r);const r2=record(1,'b');r2.metrics.cardsPlayed=80;r2.metrics.turns=90;j=recordRun(j,r2);
  expect(j.classes.warrior.best[1]).toEqual({smallestDeck:8,fewestCards:80,fewestTurns:80,wins:2});expect(j.classes.warrior.achievements).toContain('lean_deck');expect(j.history[0].blessings).toEqual(r2.blessings);expect(()=>parseJournal('{"version":1}')).toThrow();
 });
});
