import {describe,it,expect} from 'vitest';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import type {GameState,Command} from '../src/core/types';
import {isCriticalOffer,skippableSlots,validAdventure} from '../src/core/map/adventure';
import {fromSave,toSave,isPlayableSave} from '../src/core/save';
import {adventureSceneId,ADVENTURE_GEOGRAPHY,battleSceneStage,mapSceneStage} from '../app/scenePresentation';
import {nightFinalBoss,ULTIMATE_BOSS} from '../src/core/campaign/bosses';
function driver(night:1|2|3|4|5=1){
 const seed=`adventure-${night}`;let s=baseNewState(seed),r=makeRng(seed);
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
 it('replaces only the defeated page; preserves postponed shop/well IDs and never rerolls them',()=>{
  const d=driver(),before=structuredClone(d.s.pages!.current!),ids=[...d.s.pages!.adventure!.slotIds];
  d.go({type:'ChooseOffer',index:1});expect(d.s.phase).toBe('shop');const stock=structuredClone(d.s.shopStock);
  d.go({type:'CompleteNode'});expect(d.s.pages!.adventure!.resolvedIds).toHaveLength(0);
  win(d,0);expect(d.s.pages!.current!.offers.slice(1)).toEqual(before.offers.slice(1));expect(d.s.pages!.adventure!.slotIds.slice(1)).toEqual(ids.slice(1));
  d.go({type:'ChooseOffer',index:1});expect(d.s.shopStock).toEqual(stock);
  d.go({type:'CompleteNode'});d.go({type:'OpenPage'});expect(d.s.pages!.current!.offers[1]).toEqual(before.offers[1]);
 });
 it('Next Intersection discards only the visible optional slots, never the new replacements or mandatory pages',()=>{
  const d=driver(),a=d.s.pages!.adventure!,combat=structuredClone(d.s.pages!.current!.offers[0]);
  expect(skippableSlots(d.s)).toEqual([1,2]);d.go({type:'Proceed'});
  expect(d.s.pages!.adventure!.skippedIds).toEqual(a.slotIds.slice(1));expect(d.s.pages!.current!.offers[0]).toEqual(combat);expect(d.s.pages!.adventure!.cursor).toBe(5);
  d.go({type:'DismissOffer',index:0});expect(d.s.pages!.current!.offers[0]).toEqual(combat);
  d.go({type:'ChooseOffer',index:0});const page=structuredClone(d.s.pages);d.go({type:'Proceed'});d.go({type:'ChooseOffer',index:1});expect(d.s.phase).toBe('combat');expect(d.s.pages).toEqual(page);
 });
 it('ordinary victories give XP/money without cards; elites and bosses offer optional card rewards',()=>{
  const d=driver(),before=d.s.masterDeck.length,gold=d.s.player.gold;
  d.go({type:'ChooseOffer',index:0});d.s.piles.hand=[{id:'test',name:'test',type:'attack',cost:0,dmg:9999}];d.go({type:'PlayCard',index:0});
  expect(d.s.cardReward).toBeUndefined();expect(d.s.masterDeck).toHaveLength(before);expect(d.s.player.gold).toBeGreaterThan(gold);expect(d.s.lastReward!.exp).toBeGreaterThan(0);
 });
 it('treasure resolves only its own slot and cannot resurrect or grant a second card after save/load',()=>{
  const d=driver();
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
  for(let guard=0;guard<200&&!d.s.runSummary;guard++){
   expect(validAdventure(d.s)).toBe(true);d.restore();
   const scene=adventureSceneId(d.s);if(seenZones.at(-1)!==scene)seenZones.push(scene);
   expect(mapSceneStage(d.s)).toEqual(battleSceneStage(d.s));
   if(d.s.chapter)d.go({type:'SkipChapter'});
   else if(d.s.phase==='map'){
    const ix=d.s.pages!.current!.offers.findIndex(o=>o&&isCriticalOffer(o));
    if(ix<0){d.go({type:'Proceed'});continue;}
    const o=d.s.pages!.current!.offers[ix];
    if(o.kind==='boss'){expect(d.s.pages!.adventure!.storyDone).toBe(true);expect(d.s.pages!.adventure!.fightsWon).toBe(5);seenBosses.push(o.enemyId);}
    d.go({type:'ChooseOffer',index:ix});
   }else if(d.s.phase==='combat'){d.s.piles.hand=[{id:'test',name:'test',type:'attack',cost:0,dmg:9999}];d.go({type:'PlayCard',index:0});}
   else if(d.s.phase==='event'){
    if(d.s.story?.result==null){const before=d.s.player.gold;d.go({type:'CompleteNode'});expect(d.s.phase).toBe('event');d.go({type:'ChooseEventOption',index:0});const after=d.s.player.gold;expect(after).toBe(before+20);d.restore();d.go({type:'ChooseEventOption',index:0});expect(d.s.player.gold).toBe(after);}
    else d.go({type:'CompleteNode'});
   }else if(d.s.phase==='levelup')d.go({type:'SkipLevelUp'});
   else if(d.s.phase==='reward')d.go({type:'SkipCardReward'});
   else if(d.s.phase==='victory')d.go({type:'CompleteNode'});
  }
  expect(d.s.runSummary?.won).toBe(true);expect(d.s.fightCount).toBe(night===5?7:6);
  expect(seenBosses).toEqual(night===5?[nightFinalBoss(night).id,ULTIMATE_BOSS.id]:[nightFinalBoss(night).id]);
  const a=d.s.pages!.adventure!;expect(a.resolvedIds.length+a.skippedIds.length).toBe(12);expect(new Set([...a.resolvedIds,...a.skippedIds]).size).toBe(12);
  expect(seenZones.every((z,i)=>i===0||z==='16-secret-throne'||ADVENTURE_GEOGRAPHY[night-1].indexOf(z as never)>=ADVENTURE_GEOGRAPHY[night-1].indexOf(seenZones[i-1] as never))).toBe(true);
 });
});
