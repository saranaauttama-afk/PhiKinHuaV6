import {describe,it,expect} from 'vitest';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import type {GameState,Command} from '../src/core/types';
import {isCriticalOffer,skippableSlots,validAdventure,ADVENTURE_GHOSTS,FIGHTS_PER_NIGHT,ENCOUNTERS_PER_NIGHT,adventureFightTotal} from '../src/core/map/adventure';
import {fromSave,toSave,isPlayableSave} from '../src/core/save';
import {adventureSceneId,ADVENTURE_GEOGRAPHY,battleSceneStage,mapSceneStage} from '../app/scenePresentation';
import {nightFinalBoss,ULTIMATE_BOSS} from '../src/core/campaign/bosses';
function driver(night:1|2|3|4|5=1,seed=`adventure-${night}`){let s=baseNewState(seed),r=makeRng(seed);
 const go=(cmd:Command)=>{({state:s,rng:r}=applyCommand(s,cmd,r));};
 go({type:'NewRun',seed,classId:'warrior',night});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});
 return {go,get s(){return s},get r(){return r},restore(){const data=toSave(s,r);s=fromSave(data);r=data.mapRng??data.battleRng!;}};
}
function win(d:ReturnType<typeof driver>,ix:number){
 d.go({type:'ChooseOffer',index:ix});d.s.piles.hand=[{id:'structure-only',name:'test',type:'attack',cost:0,dmg:9999}];d.go({type:'PlayCard',index:0});
 if(d.s.phase==='levelup')d.go({type:'SkipLevelUp'});if(d.s.phase==='reward')d.go({type:'SkipCardReward'});d.go({type:'CompleteNode'});
}
describe('B17 independent pages and bounded resources',()=>{
 it('rejects missing/corrupt B17 RNG instead of silently reseeding the restored adventure',()=>{
  const d=driver();expect(()=>toSave(d.s)).toThrow(/RNG/);
  for(const rng of [undefined,{s:NaN},{s:1.5}]){
   const data=toSave(d.s,d.r);data.mapRng=rng;expect(isPlayableSave(data)).toBe(false);expect(()=>fromSave(data)).toThrow(/RNG/);
  }
  d.go({type:'ChooseOffer',index:0});const data=toSave(d.s,d.r);data.battleRng=undefined;expect(isPlayableSave(data)).toBe(false);expect(()=>fromSave(data)).toThrow(/RNG/);
 });
 it('rejects old short-run saves and corrupt deferred queues recoverably',()=>{
  const d=driver();d.go({type:'Proceed'});const save=toSave(d.s,d.r);
  for(const mutate of [(a:any)=>a.version=1,(a:any)=>a.pendingIds.push(a.pendingIds[0]),(a:any)=>a.pendingIds.push('missing'),(a:any)=>a.pendingIds=[]]){
   const bad=structuredClone(save);mutate(bad.state.pages!.adventure!);expect(isPlayableSave(bad)).toBe(false);expect(()=>fromSave(bad)).toThrow(/ข้อมูลทางแยก/);
  }
 });
 it('replaces only the defeated page; preserves postponed shop/well IDs and never rerolls them',()=>{
  const d=driver(),before=structuredClone(d.s.pages!.current!),ids=[...d.s.pages!.adventure!.slotIds];
  d.go({type:'ChooseOffer',index:1});expect(d.s.phase).toBe('shop');const stock=structuredClone(d.s.shopStock);
  d.go({type:'CompleteNode'});expect(d.s.pages!.adventure!.resolvedIds).toHaveLength(0);
  win(d,0);expect(d.s.pages!.current!.offers.slice(1)).toEqual(before.offers.slice(1));expect(d.s.pages!.adventure!.slotIds.slice(1)).toEqual(ids.slice(1));
  d.go({type:'ChooseOffer',index:1});expect(d.s.shopStock).toEqual(stock);
  d.go({type:'CompleteNode'});d.go({type:'OpenPage'});expect(d.s.pages!.current!.offers[1]).toEqual(before.offers[1]);
 });
 it('Next Intersection queues visible ghosts, discards visible services and never skips replacements',()=>{
  const d=driver(),dBefore=structuredClone(d.s.pages!.current!.offers),a=structuredClone(d.s.pages!.adventure!),combat=structuredClone(d.s.pages!.current!.offers[0]);
  expect(skippableSlots(d.s)).toEqual([0,1,2]);d.go({type:'Proceed'});
  expect(d.s.pages!.adventure!.skippedIds).toEqual(a.slotIds.filter((id,i)=>!isCriticalOffer(dBefore[i])));expect(d.s.pages!.adventure!.pendingIds).toEqual(a.slotIds.filter((id,i)=>dBefore[i].kind==='monster'));expect(d.s.pages!.adventure!.cursor).toBe(6);
  expect(d.s.pages!.adventure!.fightsWon).toBe(0);expect(validAdventure(d.s)).toBe(true);d.restore();expect(d.s.pages!.adventure!.pendingIds).toEqual(a.slotIds.filter((id,i)=>dBefore[i].kind==='monster'));
  const ix=d.s.pages!.current!.offers.findIndex(o=>o?.kind==='monster'),offer=structuredClone(d.s.pages!.current!.offers[ix]);
  d.go({type:'DismissOffer',index:ix});expect(d.s.pages!.current!.offers[ix]).toEqual(offer);
  d.go({type:'ChooseOffer',index:ix});const page=structuredClone(d.s.pages);d.go({type:'Proceed'});d.go({type:'ChooseOffer',index:1});expect(d.s.phase).toBe('combat');expect(d.s.pages).toEqual(page);
  expect(a.deck[0].offer).toEqual(combat);
 });
 it('every night samples ten distinct existing ghosts',()=>{
  for(const n of [1,2,3,4,5] as const){const d=driver(n),ids=d.s.pages!.adventure!.deck.flatMap(e=>e.offer.kind==='monster'?[e.offer.enemyId]:[]);expect(ids.every(id=>ADVENTURE_GHOSTS.some(m=>m.id===id))).toBe(true);expect(new Set(ids).size).toBe(FIGHTS_PER_NIGHT);}
 });
 it('postponing all possible fights accumulates a finite late combat queue without healing or a boss bypass',()=>{
  const d=driver();let stages:number[]=[];
  for(let guard=0;guard<100&&d.s.pages!.adventure!.cursor<ENCOUNTERS_PER_NIGHT;guard++){
   stages.push(mapSceneStage(d.s));
   const story=d.s.pages!.current!.offers.findIndex(o=>o?.kind==='story_event');
   if(story>=0){d.go({type:'ChooseOffer',index:story});d.go({type:'ChooseEventOption',index:0});d.go({type:'CompleteNode'});}
   else d.go({type:'Proceed'});
   expect(validAdventure(d.s)).toBe(true);d.restore();
  }
  expect(d.s.pages!.adventure!.pendingIds.length).toBeGreaterThanOrEqual(7);expect(d.s.pages!.adventure!.fightsWon).toBe(0);expect(d.s.pages!.adventure!.boss).toBe('locked');
  expect(d.s.pages!.current!.offers.filter(Boolean).every(o=>o.kind==='monster')).toBe(true);
  d.s.player.hp=9;const defeated:string[]=[];
  for(let guard=0;guard<100&&d.s.pages!.adventure!.boss==='locked';guard++){
   const ix=d.s.pages!.current!.offers.findIndex(o=>o?.kind==='monster');expect(ix).toBeGreaterThanOrEqual(0);defeated.push((d.s.pages!.current!.offers[ix] as any).enemyId);win(d,ix);expect(validAdventure(d.s)).toBe(true);d.restore();
  }
  expect(new Set(defeated).size).toBe(FIGHTS_PER_NIGHT);expect(d.s.player.hp).toBe(9);expect(d.s.pages!.adventure!.boss).toBe('night');expect(d.s.pages!.adventure!.pendingIds).toEqual([]);
  expect(stages.every((v,i)=>i===0||v>=stages[i-1])).toBe(true);
 });
 it('ordinary victories give XP/money without cards; elites and bosses offer optional card rewards',()=>{
  const d=driver(),before=d.s.masterDeck.length,gold=d.s.player.gold;
  d.go({type:'ChooseOffer',index:0});d.s.piles.hand=[{id:'test',name:'test',type:'attack',cost:0,dmg:9999}];d.go({type:'PlayCard',index:0});
  expect(d.s.cardReward).toBeUndefined();expect(d.s.masterDeck).toHaveLength(before);expect(d.s.player.gold).toBeGreaterThan(gold);expect(d.s.lastReward!.exp).toBeGreaterThan(0);
 });
 it('treasure resolves only its own slot and cannot resurrect or grant a second card after save/load',()=>{
  const d=Array.from({length:30},(_,i)=>driver(1,`treasure-v29-${i}`)).find(d=>d.s.pages!.adventure!.deck.some(e=>e.offer.kind==='treasure'))!;expect(d).toBeDefined();
  for(let guard=0;guard<30&&!d.s.pages!.current!.offers.some(o=>o?.kind==='treasure');guard++){
   const ix=d.s.pages!.current!.offers.findIndex(o=>o?.kind==='monster');
   if(ix>=0)win(d,ix);else d.go({type:'Proceed'});
  }
  const ix=d.s.pages!.current!.offers.findIndex(o=>o?.kind==='treasure'),id=d.s.pages!.adventure!.slotIds[ix];
  const neighbours=d.s.pages!.current!.offers.map((o,i)=>i===ix?null:structuredClone(o)),count=d.s.masterDeck.length;
  d.go({type:'ChooseOffer',index:ix});d.go({type:'TakeTreasureCard',index:0});
  expect(d.s.masterDeck).toHaveLength(count+1);expect(d.s.pages!.adventure!.resolvedIds).toContain(id);expect(d.s.pages!.current!.offers.map((o,i)=>i===ix?null:o)).toEqual(neighbours);
  d.restore();d.go({type:'TakeTreasureCard',index:0});expect(d.s.masterDeck).toHaveLength(count+1);
 });
 it('event result, stock, progress and next RNG are exact after save/load; invalid decks fail recoverably',()=>{
  const d=driver();d.go({type:'ChooseOffer',index:1});d.go({type:'TakeShop',index:0});const data=toSave(d.s,d.r);expect(isPlayableSave(data)).toBe(true);
  expect(fromSave(data)).toEqual({...d.s,pendingEvents:[],deckOpen:false});expect(data.mapRng).toEqual(d.r);
  const bad=structuredClone(data);bad.state.pages!.adventure!.slotIds[0]=bad.state.pages!.adventure!.slotIds[1];expect(isPlayableSave(bad)).toBe(false);expect(()=>fromSave(bad)).toThrow(/ข้อมูลทางแยก/);
 });
 for(const night of [1,2,3,4,5] as const)it(`night ${night}: finite deck, mandatory story, exact restore at every screen and correct final gate`,()=>{
  const d=driver(night),seenBosses:string[]=[],seenZones:string[]=[];
  for(let guard=0;guard<500&&!d.s.runSummary;guard++){
   expect(validAdventure(d.s)).toBe(true);d.restore();
   const scene=adventureSceneId(d.s);if(seenZones.at(-1)!==scene)seenZones.push(scene);
   expect(mapSceneStage(d.s)).toEqual(battleSceneStage(d.s));
   if(d.s.chapter)d.go({type:'SkipChapter'});
   else if(d.s.phase==='map'){
    const ix=d.s.pages!.current!.offers.findIndex(o=>o&&isCriticalOffer(o));
    if(ix<0){d.go({type:'Proceed'});continue;}
    const o=d.s.pages!.current!.offers[ix];
    if(o.kind==='boss'){expect(d.s.pages!.adventure!.storyDone).toBe(true);expect(d.s.pages!.adventure!.fightsWon).toBe(FIGHTS_PER_NIGHT);seenBosses.push(o.enemyId);}
    d.go({type:'ChooseOffer',index:ix});
   }else if(d.s.phase==='combat'){d.s.piles.hand=[{id:'test',name:'test',type:'attack',cost:0,dmg:9999}];d.go({type:'PlayCard',index:0});}
   else if(d.s.phase==='event'){
    if(d.s.story?.result==null){const before=d.s.player.gold;d.go({type:'CompleteNode'});expect(d.s.phase).toBe('event');d.go({type:'ChooseEventOption',index:0});const after=d.s.player.gold;expect(after).toBe(before+20);d.restore();d.go({type:'ChooseEventOption',index:0});expect(d.s.player.gold).toBe(after);}
    else d.go({type:'CompleteNode'});
   }else if(d.s.phase==='levelup')d.go({type:'SkipLevelUp'});
   else if(d.s.phase==='reward')d.go({type:'SkipCardReward'});
   else if(d.s.phase==='victory')d.go({type:'CompleteNode'});
  }
  expect(d.s.runSummary?.won).toBe(true);expect(d.s.fightCount).toBe(adventureFightTotal(night));
  expect(seenBosses).toEqual(night===5?[nightFinalBoss(night).id,ULTIMATE_BOSS.id]:[nightFinalBoss(night).id]);
  const a=d.s.pages!.adventure!;expect(a.resolvedIds.length+a.skippedIds.length).toBe(ENCOUNTERS_PER_NIGHT);expect(new Set([...a.resolvedIds,...a.skippedIds]).size).toBe(ENCOUNTERS_PER_NIGHT);
  expect(seenZones.every((z,i)=>i===0||z==='16-secret-throne'||ADVENTURE_GEOGRAPHY.indexOf(z as never)>=ADVENTURE_GEOGRAPHY.indexOf(seenZones[i-1] as never))).toBe(true);
 });
});
