import {describe,it,expect} from 'vitest';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {ALL_CLASS_IDS,type ClassId} from '../src/core/classes';
import type {Command,GameState} from '../src/core/types';
import {campaignBoss,routeFightQuota,runEliteQuota,runFightTotal,type Difficulty} from '../src/core/campaign/threeNight';
import {validAdventure,isCriticalOffer,startAdventure} from '../src/core/map/adventure';
import {fromSave,toSave,isPlayableSave,summarize} from '../src/core/save';
import {emptyJournal,recordRun,parseJournal,unlockedDifficulty,claimUnlock} from '../src/core/campaign/journal';
import {makeRunRecord} from '../src/core/campaign/metrics';
import {ULTIMATE_BOSS} from '../src/core/campaign/bosses';
import {awakenNightBoss} from '../src/core/campaign/nights';
import {archiveProgress,emptyArchive,mergeDiscovery,parseArchive} from '../src/core/archive/progress';
import {mapSceneStage} from '../app/scenePresentation';
function driver(difficulty:Difficulty=1,classId:ClassId='warrior',seed=`three-${difficulty}-${classId}`){
 let s=baseNewState(seed),r=makeRng(seed);
 const go=(c:Command)=>{({state:s,rng:r}=applyCommand(s,c,r));};
 const restore=()=>{const saved=toSave(s,r);s=fromSave(saved);r=saved.battleRng??saved.mapRng!;};
 go({type:'NewRun',seed,classId,difficulty});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});
 return {go,restore,get s(){return s},get r(){return r}};
}
function step(d:ReturnType<typeof driver>){
 if(d.s.chapter)d.go({type:'SkipChapter'});
 else if(d.s.phase==='map'){
  const offers=d.s.pages!.current!.offers,ix=offers.findIndex(o=>o&&isCriticalOffer(o));
  d.go(ix<0?{type:'Proceed'}:{type:'ChooseOffer',index:ix});
 }else if(d.s.phase==='combat'){
  d.s.piles.hand=[{id:'structural-test',name:'test',type:'attack',cost:0,dmg:99999}];d.go({type:'PlayCard',index:0});
 }else if(d.s.phase==='event'){d.go({type:'ChooseEventOption',index:0});d.go({type:'CompleteNode'});}
 else if(d.s.phase==='reward')d.go({type:'SkipCardReward'});
 else if(d.s.phase==='levelup')d.go({type:'SkipLevelUp'});
 else if(d.s.phase==='victory')d.go({type:'CompleteNode'});
 else throw Error('Unexpected phase '+d.s.phase);
}
function finish(d:ReturnType<typeof driver>){for(let i=0;i<700&&!d.s.runSummary;i++)step(d);expect(d.s.runSummary?.won).toBe(true);return d.s;}
describe('three-night continuous runs',()=>{
 for(const cls of ALL_CLASS_IDS)for(const level of [1,2,3,4,5] as const)it(`${cls} difficulty ${level}: three chapters, exact 30/31 fights, stable save/RNG every screen`,()=>{
  const d=driver(level,cls),bosses:string[]=[],stages:number[]=[],quotas:number[]=[];let chapter=0;
  for(let i=0;i<700&&!d.s.runSummary;i++){
   expect(validAdventure(d.s)).toBe(true);const before=JSON.parse(JSON.stringify(d.s));d.restore();expect(d.s).toEqual({...before,pendingEvents:[],deckOpen:false});
   stages.push(mapSceneStage(d.s));
   if(chapter!==d.s.campaign!.night){chapter=d.s.campaign!.night;quotas.push(routeFightQuota(d.s));expect(d.s.campaign!.completedNights).toBe(chapter-1);expect(d.s.runSummary).toBeUndefined();}
   if(d.s.phase==='map'&&!d.s.chapter){const ix=d.s.pages!.current!.offers.findIndex(o=>o?.kind==='boss');if(ix>=0){const a=d.s.pages!.adventure!;expect(a.storyDone).toBe(true);expect(a.fightsWon).toBe(routeFightQuota(d.s));bosses.push((d.s.pages!.current!.offers[ix] as any).enemyId);}}
   step(d);
  }
  expect(d.s.runSummary?.won).toBe(true);expect(d.s.fightCount).toBe(runFightTotal(level));expect(d.s.campaign!.night).toBe(3);expect(d.s.campaign!.completedNights).toBe(3);expect(quotas).toEqual([7,10,10]);expect(bosses).toHaveLength(level===5?4:3);expect(bosses.includes(ULTIMATE_BOSS.id)).toBe(level===5);expect(d.s.runSummary!.beatSecretBoss).toBe(level===5);expect(stages.every((n,i)=>i===0||n>=stages[i-1])).toBe(true);expect(isPlayableSave(toSave(d.s,d.r))).toBe(false);
 });
 it('services total eight, mandatory story three, guaranteed opening card shop and chapter elite quotas across seeds',()=>{
  for(const difficulty of [1,2,3,4,5] as const)for(let seed=0;seed<40;seed++){
   const d=driver(difficulty,'warrior','quota-'+seed);let services=0,stories=0;
   for(const night of [1,2,3] as const){d.s.campaign!.night=night;d.s.campaign!.completedNights=night-1;startAdventure(d.s,d.r);
    const deck=d.s.pages!.adventure!.deck,monsters=deck.filter(e=>e.offer.kind==='monster');expect(monsters).toHaveLength(night===1?7:10);expect(new Set(monsters.map(e=>(e.offer as any).enemyId)).size).toBe(monsters.length);expect(monsters.filter(e=>(e.offer as any).tier==='elite')).toHaveLength(runEliteQuota(night,difficulty));expect(deck.filter(e=>e.offer.kind==='story_event')).toHaveLength(1);stories++;
    const optional=deck.filter(e=>e.offer.kind!=='monster'&&e.offer.kind!=='story_event');services+=optional.length;expect(optional.filter(e=>['shop_card','shop_equipment'].includes(e.offer.kind))).toHaveLength(1);expect(optional.filter(e=>['well','healing_shrine'].includes(e.offer.kind))).toHaveLength(1);if(night===1)expect(optional.some(e=>e.offer.kind==='shop_card')).toBe(true);
    for(let i=1;i<deck.length;i++)if(deck[i].offer.kind!=='monster')expect(deck[i-1].offer.kind).toBe('monster');expect(validAdventure(d.s)).toBe(true);
   }expect(services).toBe(8);expect(stories).toBe(3);
  }
 });
 it('chapter completion retains deck upgrades, blessings, equipment, level, XP, money and cumulative metrics; heals only 12%',()=>{
  const d=driver();for(let guard=0;guard<500&&!(d.s.phase==='victory'&&d.s.enemy?.id===campaignBoss(d.s).id);guard++)step(d);expect(d.s.phase).toBe('victory');
  d.s.masterDeck[0]={...d.s.masterDeck[0],upgradeLevel:2};d.s.player.hp=9;d.s.player.gold=777;d.s.equipped!.push({id:'test-charm',name:'test',rarity:'Common',slotCost:1} as any);
  const before=structuredClone(d.s);d.go({type:'CompleteNode'});
  expect(d.s.campaign!.night).toBe(2);expect(d.s.chapter!.id).toBe('run_night_2_open');expect(d.s.runSummary).toBeUndefined();expect(d.s.masterDeck).toEqual(before.masterDeck);expect(d.s.blessings).toEqual(before.blessings);expect(d.s.equipped).toEqual(before.equipped);expect(d.s.player.gold).toBe(777);expect(d.s.player.level).toBe(before.player.level);expect(d.s.player.exp).toBe(before.player.exp);expect(d.s.player.hp).toBe(9+Math.ceil(before.player.maxHp*.12));expect(d.s.runMetrics).toEqual(before.runMetrics);expect(d.s.fightCount).toBe(8);expect(summarize(toSave(d.s,d.r))).toMatchObject({night:2,difficulty:1,totalFights:30,fight:9});
  d.restore();expect(d.s.chapter!.id).toBe('run_night_2_open');const stable=structuredClone(d.s);d.go({type:'CompleteNode'});expect(d.s).toEqual(stable);
 });
 it('does not promote partial, failed or locked runs; unlocks each class sequentially and credits a result once',()=>{
  let j=emptyJournal();const final=finish(driver()),r=makeRunRecord(final,'2026-10-10')!;
  j=recordRun(j,{...r,id:'partial',completedNights:1,fights:8});j=recordRun(j,{...r,id:'loss',won:false});j=recordRun(j,{...r,id:'locked',difficulty:3});expect(unlockedDifficulty(j,'warrior')).toBe(1);
  j=recordRun(j,r);expect(unlockedDifficulty(j,'warrior')).toBe(2);expect(unlockedDifficulty(j,'shaman')).toBe(1);expect(recordRun(j,r)).toBe(j);
  for(const difficulty of [2,3,4,5] as const)j=recordRun(j,makeRunRecord(finish(driver(difficulty)),'2026-10-10')!);
  expect(j.classes.warrior.highestDifficulty).toBe(5);expect(j.classes.warrior.difficultyFiveWins).toBe(1);j=claimUnlock(j,'warrior','card');expect(j.classes.warrior.unlocks).toEqual(['card']);expect(claimUnlock(j,'warrior','blessing')).toBe(j);expect(parseJournal(JSON.stringify(j))).toEqual(j);
 });
 it('old progress is retained without interpreting one-night victories as three-night clears',()=>{
  const j=emptyJournal();j.classes.warrior.highestCleared=5;j.classes.warrior.nightFiveWins=2;j.classes.warrior.unlocks=['card','blessing'];const old:any=structuredClone(j);for(const p of Object.values(old.classes) as any[]){delete p.highestDifficulty;delete p.difficultyFiveWins;delete p.difficultyBest;}const migrated=parseJournal(JSON.stringify(old));expect(migrated.classes.warrior.unlocks).toEqual(['card','blessing']);expect(unlockedDifficulty(migrated,'warrior')).toBe(1);
 });
 it('low tiers never awaken bosses; tiers 3–5 swap live cards once, tier 5 adds energy and persists it',()=>{
  for(const difficulty of [1,2,3,4,5] as const){const d=driver(difficulty);for(let guard=0;guard<500&&d.s.pages!.adventure!.boss!=='night';guard++)step(d);expect(d.s.pages!.adventure!.boss).toBe('night');d.go({type:'ChooseOffer',index:d.s.pages!.current!.offers.findIndex(o=>o?.kind==='boss')});if(d.s.chapter)d.go({type:'SkipChapter'});d.s.enemy!.hp=Math.floor(d.s.enemy!.maxHp/2);const energy=d.s.enemy!.maxEnergy;awakenNightBoss(d.s);expect(!!d.s.campaign!.bossAwakened).toBe(difficulty>=3);expect(d.s.enemy!.maxEnergy).toBe(energy!+Number(difficulty===5));const expected=structuredClone(d.s.enemy);awakenNightBoss(d.s);expect(d.s.enemy).toEqual(expected);d.restore();expect(d.s.enemy).toEqual(expected);}
 });
 it('archive counts a three-night run once and retains actual reveal night across cold loads',()=>{
  const d=driver(5);finish(d);const run=d.s.discovery!,profile=mergeDiscovery(emptyArchive(),run);expect(mergeDiscovery(profile,run)).toBe(profile);expect(parseArchive(JSON.stringify(profile))).toEqual(profile);const all=archiveProgress(profile);expect(all.ghosts[ULTIMATE_BOSS.id]).toMatchObject({seen:1,won:1,firstNight:3,lastNight:3});expect(Object.keys(all.ghosts).length).toBeGreaterThan(10);
 });
 it('fresh runs reset resources while malformed chapters/difficulty/counters cannot load',()=>{
  const d=driver();const initial=structuredClone(d.s.masterDeck);finish(d);d.go({type:'NewRun',seed:'fresh',classId:'warrior',difficulty:1});expect(d.s.campaign).toMatchObject({night:1,difficulty:1,completedNights:0});expect(d.s.masterDeck).toEqual(initial);expect(d.s.runSummary).toBeUndefined();expect(d.s.fightCount??0).toBe(0);
  const good=toSave(driver().s,driver().r);for(const change of [((s:GameState)=>s.campaign!.night=4),((s:GameState)=>s.campaign!.difficulty=6 as any),((s:GameState)=>s.campaign!.completedNights=2)]){const bad=structuredClone(good);change(bad.state as GameState);expect(isPlayableSave(bad)).toBe(false);expect(()=>fromSave(bad)).toThrow();}
 });
});
