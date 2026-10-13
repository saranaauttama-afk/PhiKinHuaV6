import {describe,it,expect} from 'vitest';
import {baseNewState,beginPlayerFight} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import type {GameState,Command,CardData} from '../src/core/types';
import {CARD_TYPE_ORDER} from '../src/core/cards/typesRegistry';
import {ALL_CLASS_IDS} from '../src/core/classes';
import {ALL_CARDS,cardById,PANDORA_BLESSINGS,poolFor,CURSE_CARDS} from '../src/core/pack';
import {grantBlessing,rollLevelOffers} from '../src/core/engine/shared';
import {validEquipmentSelection} from '../src/core/cards/equipment';
import {fightBadges} from '../src/core/combat/fightBadges';
import {rollNightStory,getStoryEvent,STORY_EVENTS,choiceLocked,applyEffect} from '../src/core/events/story';
import {turnEndExcess} from '../src/core/engine/handlers/combat';
import {playCard,resolvePrayers} from '../src/core/cards/play';
import {cardCost} from '../src/core/cards/model';
import {borrowEnemyCards} from '../src/core/cards/borrow';
import {fromSave,toBattleSave,toSave,isPlayableSave} from '../src/core/save';
import {emptyJournal,parseJournal,recordRun} from '../src/core/campaign/journal';
import {makeRunRecord} from '../src/core/campaign/metrics';
import {PlayClock,timeSummary} from '../src/core/campaign/playTime';
import {rollThreeCards,rollTwoBlessings} from '../src/core/level';
import {rollShopStock} from '../src/core/shop';
import {rollNightCards} from '../src/core/campaign/rewards';
import {makeCombatState,attackCard} from './helpers';
import {rageStartTurn} from '../src/core/campaign/nights';
function run(seed='p7',classId:typeof ALL_CLASS_IDS[number]='warrior',tier=0){
 let s=baseNewState(seed),r=makeRng(seed);
 const go=(cmd:Command)=>{({state:s,rng:r}=applyCommand(s,cmd,r));};
 go({type:'NewRun',seed,classId,blessingTier:tier});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});
 return {go,get s(){return s;},get r(){return r;}};
}
const allFightCards=(s:GameState)=>[...Object.values(s.piles).flat(),...(s.equipped??[]),...(s.prayers??[]).map(p=>p.card)];
const pandora=(id:string)=>structuredClone(PANDORA_BLESSINGS.find(b=>b.id===id)!);
describe('Phase 7 deck and combat visibility',()=>{
 it('registry partitions every class starter and all eight types without hidden cards',()=>{
  expect(CARD_TYPE_ORDER).toHaveLength(8);
  for(const cls of ALL_CLASS_IDS){const s=run('types-'+cls,cls).s;expect(s.masterDeck).toHaveLength(10);expect(CARD_TYPE_ORDER.flatMap(t=>s.masterDeck.filter(c=>c.type===t))).toHaveLength(10);}
  expect(new Set([...ALL_CARDS,...CURSE_CARDS].map(c=>c.type))).toEqual(new Set(CARD_TYPE_ORDER));
 });
 it('pre-equips owned instances, respects slots, and swapping returns the same card once',()=>{
  const d=run();const gear=cardById('equipment_iron_bracer')!;d.s.masterDeck.push(gear,structuredClone(gear));d.s.equipmentSlotsMax=2;
  expect(validEquipmentSelection(d.s,[10,10])).toBe(false);expect(validEquipmentSelection(d.s,[10,11])).toBe(true);
  const index=d.s.pages!.current!.offers.findIndex(o=>o.kind==='monster');
  const refused=applyCommand(d.s,{type:'ChooseOffer',index,equipmentIndices:[10,10]},d.r);expect(refused.state.phase).toBe('map');expect(refused.rng).toEqual(d.r);
  d.go({type:'ChooseOffer',index,equipmentIndices:[10,11]});expect(d.s.equipped).toHaveLength(2);expect(d.s.piles.draw.some(c=>c.type==='equipment')).toBe(false);
  expect(new Set(allFightCards(d.s).map(c=>c.instanceId)).size).toBe(12);expect(allFightCards(d.s)).toHaveLength(12);expect(d.s.masterDeck).toHaveLength(12);
  const old=d.s.equipped![0];const next={...gear,instanceId:'replacement'};d.s.piles.hand.push(next);d.go({type:'PlayCard',index:d.s.piles.hand.length-1});expect(d.s.piles.discard.filter(c=>c.instanceId===old.instanceId)).toHaveLength(1);
  const saved=toBattleSave(d.s,d.r);expect(isPlayableSave(saved)).toBe(true);expect(fromSave(saved).equipped).toEqual(d.s.equipped);
  // A new fight starts from masterDeck, never the cards from the previous fight.
  beginPlayerFight(d.s,d.r);expect(allFightCards(d.s)).toHaveLength(12);
 });
 it('prayer countdown is 3/2/1/resolved and resumes with the same result',()=>{
  const card=cardById('karma_returns')!;let {state:s,rng:r}=makeCombatState({hand:[card],enemyHp:999,playerHp:30});
  ({rng:r}=playCard(s,0,r,3));expect(fightBadges(s).find(b=>b.id.startsWith('prayer:'))?.count).toBe('3');
  for(const left of [2,1]){r=resolvePrayers(s,r);expect(s.prayers![0].turnsLeft).toBe(left);}
  const copy=structuredClone(s);r=resolvePrayers(s,r);resolvePrayers(copy,makeRng('test'));
  expect(s.prayers).toHaveLength(0);expect(s.enemy!.hp).toBe(978);expect(copy.enemy!.hp).toBe(s.enemy!.hp);
  expect(s.piles.discard.filter(c=>c.id===card.id)).toHaveLength(1);
 });
});
describe('Phase 7 events and permanent progress',()=>{
 it('uses all 12 existing independent events, stays night-eligible, deterministic and escapable',()=>{
  const seen=new Set<string>();
  for(let i=0;i<100;i++)for(const cls of ALL_CLASS_IDS){const a=run('event'+i,cls),b=run('event'+i,cls);expect(a.s.campaign!.eventByNight).toEqual(b.s.campaign!.eventByNight);expect(toSave(a.s,a.r)).toEqual(toSave(b.s,b.r));
   const ev=getStoryEvent('run_story_1',a.s)!;seen.add(ev.id);expect(ev.nights).toContain(1);a.s.player.gold=0;a.s.player.hp=1;expect(ev.choices.some(c=>!choiceLocked(a.s,c))).toBe(true);
  }
  for(let i=0;i<100;i++){const d=run('later'+i);d.s.campaign!.night=3;rollNightStory(d.s,d.r);seen.add(getStoryEvent('run_story_3',d.s)!.id);}
  expect([...seen].sort()).toEqual(STORY_EVENTS.filter(e=>e.nights).map(e=>e.id).sort());
 });
 it('event decisions are credited once and their pact affects later fights',()=>{
  const d=run();d.s.campaign!.eventByNight={'1':'roadside_shrine'};d.s.story={eventId:'run_story_1'};d.s.phase='event';
  d.go({type:'ChooseEventOption',index:1});const gold=d.s.player.gold;d.go({type:'ChooseEventOption',index:1});expect(d.s.player.gold).toBe(gold);expect(d.s.blessings.filter(b=>b.id==='event_coin_debt')).toHaveLength(1);
  d.s.phase='combat';d.s.enemy={id:'phi-krasue',name:'ผี',hp:999,maxHp:999,block:0};d.s.blessings=d.s.blessings.filter(b=>b.id==='event_coin_debt');beginPlayerFight(d.s,d.r);
  expect(d.s.piles.hand).toHaveLength(1);expect(d.s.player.block).toBe(3);expect(d.s.eventMemory!.roadside_shrine).toBe(1);
 });
 it('random removal cannot remove the final card or an unremovable card',()=>{const d=run();d.s.masterDeck=[{...attackCard(1),unremovable:true},attackCard(2)];applyEffect(d.s,{kind:'removeRandomCard'},d.r);expect(d.s.masterDeck).toHaveLength(1);applyEffect(d.s,{kind:'removeRandomCard'},d.r);expect(d.s.masterDeck).toHaveLength(1);});
 it('permanent nights do not decline after 60 failed runs, duplicate credit or reload',()=>{
  const d=run();d.s.runSummary={won:false,fights:19,level:4,gold:0,beatSecretBoss:false};d.s.campaign!.completedNights=2;
  const record=makeRunRecord(d.s,'2026-10-13')!;let j=recordRun(emptyJournal(),record);
  j=recordRun(j,{...record,id:'second'});expect(j.totalCompletedNights).toBe(4);
  for(let i=0;i<65;i++)j=recordRun(j,{...record,id:'failed'+i,completedNights:0});
  expect(j.history).toHaveLength(60);expect(j.history.every(r=>r.completedNights===0)).toBe(true);expect(j.totalCompletedNights).toBe(4);
  expect(recordRun(j,record).totalCompletedNights).toBe(4);expect(parseJournal(JSON.stringify(j)).totalCompletedNights).toBe(4);
  const old:any=recordRun(emptyJournal(),record);delete old.totalCompletedNights;expect(parseJournal(JSON.stringify(old)).totalCompletedNights).toBe(2);
 });
});
describe('Phase 7 Pandora rules and resource growth',()=>{
 it('discard pact reduces retention every turn and pays only once without loops',()=>{
  const {state:s,rng}=makeCombatState({hand:[attackCard(1),attackCard(2),attackCard(3),attackCard(4)]});grantBlessing(s,pandora('pandora_scattered_incense'));expect(turnEndExcess(s)).toBe(4);
  let out=applyCommand(s,{type:'DiscardForTurnEnd',indices:[0,1,2,3]},rng).state;expect(out.player.mana).toBe(2);expect(out.player.block).toBe(4);
  out=applyCommand(out,{type:'DiscardForTurnEnd',indices:[]},rng).state;expect(out.player.mana).toBe(2);
 });
 it('equipment pact adds slot but shrinks each opening hand',()=>{const d=run();grantBlessing(d.s,pandora('pandora_iron_shrine'));d.go({type:'ChooseOffer',index:0});expect(d.s.equipmentSlotsMax).toBe(2);expect(d.s.piles.hand).toHaveLength(1);});
 it('prayer pact charges extra AP and increases every queued multiplier',()=>{
  const {state:s,rng}=makeCombatState({hand:[cardById('karma_returns')!],playerAp:1,enemyHp:999});grantBlessing(s,pandora('pandora_long_vow'));expect(cardCost(s,s.piles.hand[0]).ap).toBe(2);expect(playCard(s,0,rng,3).played).toBe(false);s.player.ap=2;playCard(s,0,rng,3);expect(s.prayers![0].mult).toBe(4);expect(s.player.ap).toBe(0);
 });
 it('borrow pact adds a copy only when history exists and charges HP on every copy',()=>{
  const {state:s,rng}=makeCombatState({playerHp:10,enemyHp:999});grantBlessing(s,pandora('pandora_borrowed_breath'));s.enemyLastPlayed=['phi_krasue_v29_strike','phi_krasue_v29_strike'];expect(borrowEnemyCards(s,1)).toBe(2);s.player.block=99;
  let out=applyCommand(s,{type:'PlayCard',index:0},rng);expect(out.state.player.hp).toBe(8);out=applyCommand(out.state,{type:'PlayCard',index:0},out.rng);expect(out.state.player.hp).toBe(6);expect(out.state.masterDeck).toHaveLength(0);
 });
 for(const option of ['ap','mana','draw'] as const)it(`level ${option} is selectable, persists and is capped`,()=>{
  const d=run();d.s.phase='levelup';d.s.levelUp={cards:[],offers:[option]};d.go({type:'ChooseLevelUpOption',option,index:0});expect(d.s.levelUp!.consumed).toBe(true);
  expect(d.s.player[option==='ap'?'maxAp':option==='mana'?'startMana':'drawPerTurn']).toBe(option==='mana'?2:3);
  const s=d.s;s.player.maxAp=3;s.player.startMana=10;s.player.drawPerTurn=4;for(let i=0;i<25;i++)expect(rollLevelOffers(s,makeRng('caps'+i)).list).not.toContain(option);
 });
 it('no existing card is milestone-gated: new players keep the full Phase 6 class pool',()=>{
  // Milestones must add choices, never withhold cards that were already in the game.
  expect(ALL_CARDS.filter(c=>c.unlockAt)).toHaveLength(0);
  for(const cls of ALL_CLASS_IDS)expect(poolFor(cls,0).length).toBe(poolFor(cls,4).length);
 });
 it('level 4+ starts rage one ghost turn sooner; level 3 keeps turn 3',()=>{
  const d=run();d.s.campaign!.night=2;
  d.s.campaign!.difficulty=3;expect(rageStartTurn(d.s)).toBe(3);
  d.s.campaign!.difficulty=4;expect(rageStartTurn(d.s)).toBe(2);
  d.s.campaign!.difficulty=5;expect(rageStartTurn(d.s)).toBe(2);
 });
 it('prayer-cost bargains never stack: offers, event pacts and old saves all stay at +1 AP',()=>{
  const {state:s}=makeCombatState({hand:[cardById('karma_returns')!],playerAp:2,enemyHp:999});
  grantBlessing(s,pandora('pandora_long_vow'));
  const bell=STORY_EVENTS.flatMap(e=>e.choices).find(c=>c.effects?.some(x=>x.kind==='pact'&&x.id==='event_bell_vow'))!;
  expect(choiceLocked(s,bell)).toBeTruthy();
  for(let i=0;i<40;i++)expect(rollTwoBlessings(makeRng('nostack'+i),s.blessings!.map(b=>b.id),30,99).list.some(b=>b.rules?.prayerAp)).toBe(false);
  // A save from before the filter can hold both; the clamp keeps the prayer playable.
  s.blessings!.push({id:'event_bell_vow',name:'x',desc:'',triggers:[],rules:{prayerMult:1,prayerAp:1}} as any);
  expect(cardCost(s,s.piles.hand[0]).ap).toBe(2);
 });
});
describe('Phase 7 active play clock',()=>{
 it('separates combat/travel/reward and excludes pause, background, resume gap and terminal screens',()=>{
  const d=run();const c=new PlayClock();c.reset(0);let s=c.flush(d.s,1000);expect(s.runMetrics!.activeMs!.travel).toBe(1000);
  s.phase='combat';s=c.flush(s,3000);s=c.setPaused(s,true,3000);s=c.flush(s,9000);s=c.setPaused(s,false,12000);s=c.flush(s,14000);expect(s.runMetrics!.activeMs!.combat).toBe(4000);
  s=c.setForeground(s,false,14000);s=c.flush(s,30000);s=c.setForeground(s,true,40000);s.phase='reward';s=c.flush(s,42000);expect(s.runMetrics!.activeMs!.reward).toBe(2000);
  c.reset(100000);s=c.flush(s,101000);expect(s.runMetrics!.activeMs!.reward).toBe(3000);
  s.runSummary={won:false,fights:1,level:1,gold:0,beatSecretBoss:false};s=c.flush(s,200000);expect(s.runMetrics!.activeMs!.combat).toBe(4000);expect(timeSummary(s.runMetrics!.activeMs)).toContain('รวม');
 });
});
