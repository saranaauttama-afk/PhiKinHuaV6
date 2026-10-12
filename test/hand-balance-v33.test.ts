import {describe,it,expect,afterEach} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {baseNewState,startPlayerTurn} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {ALL_CLASS_IDS} from '../src/core/classes';
import {cardById,ALL_CARDS} from '../src/core/pack';
import {fromSave,toSave,toBattleSave} from '../src/core/save';
import {normalHandCount,requiredDiscards} from '../src/core/cards/hand';
import {TEST_WIN_CARD_ID} from '../src/core/cards/testWin';
import {effectiveCost} from '../src/core/cards/mechanics';
import {applyStatusEffect} from '../src/core/statusEffectsRuntime';
import {getCardPlayedFns,runBlessingsTurnHook} from '../src/core/blessingRuntime';
import {emptyJournal,parseJournal,ACHIEVEMENTS} from '../src/core/campaign/journal';
import {advanceAfterVictory} from '../src/core/engine/shared';
import {rollLevelUpChoice} from '../src/core/level';
import {runEquipmentTurnHook} from '../src/core/equipmentRuntime';
import {getEquipmentById} from '../src/core/pack';
import {makeCombatState,attackCard} from './helpers';
import formerCards from '../docs/v33-former-chain-cards.json';
import type {GameState,Command} from '../src/core/types';
function driver(cls:typeof ALL_CLASS_IDS[number]='warrior'){
 let s=baseNewState('v33-'+cls),r=makeRng(s.seed);
 const go=(c:Command)=>{({state:s,rng:r}=applyCommand(s,c,r));return s;};
 go({type:'NewRun',seed:s.seed,classId:cls,difficulty:1});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});
 return {go,get s(){return s},get r(){return r}};
}
afterEach(()=>delete process.env.EXPO_PUBLIC_TEST_WIN_CARD);
describe('v33 independent draw and retention',()=>{
 for(const cls of ALL_CLASS_IDS)it(cls+' opens with two ordinary cards, two energy and two retention slots',()=>{
  const d=driver(cls);d.go({type:'ChooseOffer',index:0});expect(d.s.phase).toBe('combat');
  expect(d.s.player).toMatchObject({openingDraw:2,drawPerTurn:2,maxHandSize:2,maxEnergy:2,handBalanceVersion:33});expect(normalHandCount(d.s.piles.hand)).toBe(2);
  d.s.piles.draw=d.s.masterDeck.map(c=>({...c}));const before=normalHandCount(d.s.piles.hand);startPlayerTurn(d.s,d.r);expect(normalHandCount(d.s.piles.hand)).toBe(before+2);
 });
 for(const cmd of ['EndTurn','ResolveEnemyTurn'] as const)it(cmd+' cannot advance seven-card hand until all five excess cards are discarded',()=>{
  const {state,rng}=makeCombatState({hand:Array.from({length:7},()=>attackCard(1))});state.player.handBalanceVersion=33;state.player.maxHandSize=2;
  let s=applyCommand(state,{type:cmd},rng).state;expect(s.player).toEqual(state.player);expect(s.enemy).toEqual(state.enemy);expect(s.piles).toEqual(state.piles);expect(s.pendingEvents).toEqual([]);expect(requiredDiscards(s)).toBe(5);
  for(let i=0;i<5;i++)s=applyCommand(s,{type:'DiscardCard',index:0},rng).state;
  expect(s.piles.hand).toHaveLength(2);expect(s.piles.discard).toHaveLength(5);
  expect(applyCommand(s,{type:cmd},rng).state.pendingEvents?.some(e=>e.t==='TurnEnded')).toBe(true);
 });
 it('QA card neither increases cap nor counts toward overflow and cannot be discarded',()=>{
  process.env.EXPO_PUBLIC_TEST_WIN_CARD='1';const d=driver();d.go({type:'ChooseOffer',index:0});expect(d.s.piles.hand).toHaveLength(3);expect(requiredDiscards(d.s)).toBe(0);expect(d.s.player.maxHandSize).toBe(2);
  const i=d.s.piles.hand.findIndex(c=>c.id===TEST_WIN_CARD_ID);d.go({type:'DiscardCard',index:i});expect(d.s.piles.hand).toHaveLength(3);
 });
 it('temporary card draw can exceed retention but does not raise either base stat',()=>{
  const {state,rng}=makeCombatState({hand:[cardById('fighter_breath')!]});state.player.handBalanceVersion=33;state.player.drawPerTurn=2;state.player.maxHandSize=2;state.piles.draw=Array.from({length:6},()=>attackCard(1));
  const s=applyCommand(state,{type:'PlayCard',index:0},rng).state;expect(s.piles.hand).toHaveLength(1);expect(s.player.drawPerTurn).toBe(2);expect(s.player.maxHandSize).toBe(2);expect(s.player.energy).toBe(state.player.energy+1);
 });
 for(const option of ['A','B'] as const)it('mandatory first-boss choice '+option+' changes only the chosen stat and survives a save',()=>{
  const d=driver();
  for(let i=0;i<250&&!(d.s as GameState).levelUp?.dawnHandChoice;i++){
    if(d.s.chapter)d.go({type:'SkipChapter'});
    else if(d.s.phase==='map'){
      const p=d.s.pages!.current!,ix=p.offers.findIndex((o,i)=>o&&!p.resolved[i]&&['monster','boss','story_event'].includes(o.kind));
      const other=p.offers.findIndex((o,i)=>o&&!p.resolved[i]);
      d.go(ix>=0?{type:'ChooseOffer',index:ix}:p.offers[other]?.kind==='next_event'?{type:'ChooseOffer',index:other}:{type:'DeleteShopFromMap',index:other});
    }else if(d.s.phase==='combat'){d.s.piles.hand=[attackCard(99999)];d.go({type:'PlayCard',index:0});}
    else if(d.s.phase==='levelup')d.go({type:'SkipLevelUp'});
    else if(d.s.phase==='reward')d.go({type:'SkipCardReward'});
    else if(d.s.phase==='event'){d.go({type:'ChooseEventOption',index:0});d.go({type:'CompleteNode'});}
    else d.go({type:'CompleteNode'});
  }
  expect((d.s as GameState).levelUp?.dawnHandChoice).toBe(true);expect((d.s as GameState).levelUp?.choice).toMatchObject({optionA:'draw_per_turn',optionB:'max_hand'});
  const saved=fromSave(toSave(d.s,d.r));expect(saved.levelUp?.dawnHandChoice).toBe(true);
  d.go({type:'SkipLevelUp'});expect(d.s.phase).toBe('levelup');d.go({type:'ChooseLevelUpOption',option});
  expect(d.s.player.drawPerTurn).toBe(option==='A'?3:2);expect(d.s.player.openingDraw).toBe(option==='A'?3:2);expect(d.s.player.maxHandSize).toBe(option==='B'?3:2);
  const before=structuredClone(d.s.player);d.go({type:'ChooseLevelUpOption',option});expect(d.s.player).toEqual(before);
 });
 it('night-one levels never raise draw/retention; later levels offer the missing side independently',()=>{
  const d=driver();for(let i=0;i<60;i++){const c=rollLevelUpChoice(makeRng('first-'+i),d.s).choice;expect([c.optionA,c.optionB]).not.toContain('draw_per_turn');expect([c.optionA,c.optionB]).not.toContain('max_hand');}
  d.s.campaign!.night=2;d.s.player.drawPerTurn=3;let found=false;for(let i=0;i<60;i++){const c=rollLevelUpChoice(makeRng('later-'+i),d.s).choice;expect([c.optionA,c.optionB]).not.toContain('draw_per_turn');found||=[c.optionA,c.optionB].includes('max_hand');}expect(found).toBe(true);
 });
});
describe('explicit combo removal with ordinary synergy preserved',()=>{
 it('no combo UI, imports, icons, book, handlers or notifications remain',()=>{
  const walk=(dir:string):string[]=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
  for(const p of [...walk('app'),...walk('src/core/engine')])if(/\.tsx?$/.test(p))expect(fs.readFileSync(p,'utf8'),p).not.toMatch(/combo|คอมโบ/i);
  expect(fs.existsSync('src/core/combat/combos.ts')).toBe(false);expect(fs.existsSync('src/data/packs/base/combos.json')).toBe(false);expect(ACHIEVEMENTS.some(a=>a.id==='combo_keeper' as any)).toBe(false);
 });
 const pairs=[['warrior','muay_stance','ward_riposte',14],['shaman','curse_chant','cursed_needle',13],['nun','chant_sutra','dharma_wheel',12],['medium','phrai_oil','poison_echo',6]] as const;
 for(const [cls,setup,follow,damage] of pairs)it(cls+' normal setup/followup works with no sequence reward',()=>{
  const {state,rng}=makeCombatState({hand:[cardById(setup)!,cardById(follow)!],playerEnergy:20,enemyHp:500});state.classId=cls;
  let s=applyCommand(state,{type:'PlayCard',index:0},rng).state;const hp=s.enemy!.hp,block=s.player.block;s=applyCommand(s,{type:'PlayCard',index:0},rng).state;
  expect(hp-s.enemy!.hp).toBe(damage);expect((s as any).combo).toBeUndefined();expect((s.runMetrics as any)?.combos).toBeUndefined();expect(s.log.join(' ')).not.toMatch(/combo|คอมโบ/i);
  if(cls==='warrior'||cls==='nun')expect(s.player.block).toBe(block); // no old bonus block
 });
 for(const id of (formerCards as string[]).filter(id=>cardById(id)))it(id+' retains an independently playable effect',()=>{
  const c=cardById(id)!;expect(c).toBeDefined();expect(!!(c.dmg||c.block||c.heal||c.draw||c.energyGain||c.statusEffect||c.cleanseDebuffs||c.trap)).toBe(true);
  const {state,rng}=makeCombatState({hand:[c],playerEnergy:30,enemyHp:1000,playerHp:20});state.player.maxHp=80;state.classId=(c.tags?.find(t=>ALL_CLASS_IDS.includes(t as any))??'shaman') as any;state.piles.draw=ALL_CARDS.slice(0,10);
  const out=applyCommand(state,{type:'PlayCard',index:0},rng).state;expect(out.piles.hand.some(x=>x.instanceId===state.piles.hand[0].instanceId)).toBe(false);expect(out.log.join(' ')).not.toMatch(/error/i);expect((out as any).combo).toBeUndefined();
 });

 it('equipment draw exceeds retention without modifying base draw or hand cap',()=>{
  const {state}=makeCombatState({hand:[attackCard(1),attackCard(1)]});state.player.maxHandSize=2;state.player.drawPerTurn=2;state.piles.draw=ALL_CARDS.slice(0,8);state.equipmentSlotsMax=3;state.equipped=[getEquipmentById('nang_tani_skull')!];
  runEquipmentTurnHook(state,'on_turn_start','player');expect(state.piles.hand).toHaveLength(3);
  expect(requiredDiscards(state)).toBe(1);expect(state.player.drawPerTurn).toBe(2);expect(state.player.maxHandSize).toBe(2);
 });
 it('old free-card/immunity flags are ignored, not interpreted as effects',()=>{
  const {state,rng}=makeCombatState({hand:[attackCard(8,{cost:2})],playerEnergy:0});(state as any).combo={freeCards:99,debuffImmunity:true,damageBoost:99};expect(effectiveCost(state,state.piles.hand[0])).toBe(2);const s=applyCommand(state,{type:'PlayCard',index:0},rng).state;expect(s.enemy!.hp).toBe(state.enemy!.hp);expect(applyStatusEffect('player',s,'poison',2,1).success).toBe(true);
 });
 it('normal blessing draw adds cards without increasing the hand limit',()=>{
  const {state}=makeCombatState();state.player.maxHandSize=2;state.blessings=[{id:'naga_blessing',name:'test'}];state.piles.draw=ALL_CARDS.slice(0,5);runBlessingsTurnHook(state,'on_turn_start');expect(state.piles.hand).toHaveLength(1);expect(state.player.maxHandSize).toBe(2);
 });
});
