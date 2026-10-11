import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {makeCombatState,attackCard} from './helpers';
import {applyCommand} from '../src/core/reducer';
import {cardById} from '../src/core/pack';
import {applyStatusEffect} from '../src/core/statusEffectsRuntime';
import {effectiveCost} from '../src/core/cards/mechanics';
import {toBattleSave,fromSave} from '../src/core/save';
import {emptyJournal,parseJournal} from '../src/core/campaign/journal';
import formerCards from '../docs/v33-former-chain-cards.json';
import migrations from '../src/data/packs/base/card_migrations_v33.json';

const usefulState=(s:any)=>JSON.parse(JSON.stringify({hp:s.player.hp,maxHp:s.player.maxHp,block:s.player.block,
 energy:s.player.energy,status:s.player.statusEffects,enemyHp:s.enemy?.hp,
 enemyStatus:s.enemy?.statusEffects,minions:s.minions,hand:s.piles.hand.map((c:any)=>c.id)}));

describe('v33 independent removal audit',()=>{
 for(const id of formerCards)it(`${id} retains an independently useful effect`,()=>{
  const card=cardById(id)!;expect(card).toBeDefined();
  const {state,rng}=makeCombatState({hand:[card],enemyHp:500,playerHp:20,playerEnergy:20});
  state.player.maxHp=50;state.player.statusEffects=[];
  applyStatusEffect('player',state,'poison',2,1);
  state.piles.draw=Array.from({length:10},(_,i)=>attackCard(1,{id:'draw-'+i}));
  const before=usefulState(state);
  // Ignore ordinary payment and removal of the played card when comparing payoff.
  before.energy-=effectiveCost(state,card);before.hand=[];
  const out=applyCommand(state,{type:'PlayCard',index:0},rng).state;
  expect(usefulState(out)).not.toEqual(before);
  expect(out.log.join('\n')).not.toMatch(/คอมโบ|combo|Error in|Error applying|Blessing error/i);
  expect((out as any).combo).toBeUndefined();
 });
 for(const [classId,setup,followup,damage] of [
  ['warrior','muay_stance','ward_riposte',14],
  ['shaman','curse_chant','cursed_needle',13],
  ['nun','chant_sutra','dharma_wheel',12],
  ['medium','phrai_oil','poison_echo',6],
 ] as const)it(`${classId} preserves natural synergy without sequence rewards`,()=>{
  const {state,rng}=makeCombatState({hand:[cardById(setup)!,cardById(followup)!],enemyHp:500,playerEnergy:10});
  state.classId=classId;state.enemy!.statusEffects=[];
  state.piles.draw=Array.from({length:8},(_,i)=>attackCard(1,{id:'filler-'+i}));
  const first=applyCommand(state,{type:'PlayCard',index:0},rng);
  const second=applyCommand(first.state,{type:'PlayCard',index:0},first.rng).state;
  expect(first.state.enemy!.hp-second.enemy!.hp).toBe(damage);
  expect((second as any).combo).toBeUndefined();
  expect(second.log.join('\n')).not.toMatch(/คอมโบ|combo/i);
  if(classId==='warrior')expect(second.player.block).toBe(8);
  if(classId==='nun')expect(second.player.block).toBe(7);
  if(classId==='medium'){expect(second.player.block).toBe(5);expect(second.piles.hand).toHaveLength(2);}
 });
 it('legacy battle payload cannot grant free cards, immunity or rewards after cold load',()=>{
  const {state,rng}=makeCombatState({hand:[attackCard(3,{cost:1})],enemyHp:500});
  const save:any=toBattleSave(state,rng);
  save.state.combo={progress:[{comboId:'ward_counter_chain',cardsPlayed:['muay_stance'],turnStarted:1}],done:[],freeCards:50,debuffImmunity:true};
  save.state.completedCombos=['divine_intervention'];save.state.nextCardsFree=50;
  save.state.runMetrics={initialDeck:11,smallestDeck:11,cardsPlayed:2,turns:1,combos:40,added:0,removed:0,upgraded:0,damageTaken:0,playedByCard:{}};
  const old=structuredClone(save),loaded=fromSave(save);
  expect(save).toEqual(old);
  expect((loaded as any).combo).toBeUndefined();expect((loaded as any).nextCardsFree).toBeUndefined();
  expect((loaded.runMetrics as any).combos).toBeUndefined();expect(loaded.runMetrics!.cardsPlayed).toBe(2);
  expect(effectiveCost(loaded,loaded.piles.hand[0])).toBe(1);
  expect(applyStatusEffect('player',loaded,'poison',2,2).success).toBe(true);
 });
 it('old journal retains progression and unrelated unlocks but awards no new combo achievements',()=>{
  const old:any=emptyJournal();old.classes.warrior.highestDifficulty=3;
  old.classes.warrior.unlocks=['card'];old.classes.warrior.achievements=['first_dawn','combo_keeper'];
  const loaded=parseJournal(JSON.stringify(old));
  expect(loaded.classes.warrior.highestDifficulty).toBe(3);
  expect(loaded.classes.warrior.unlocks).toEqual(['card']);
  expect(loaded.classes.warrior.achievements).toContain('first_dawn');
 });
 for(const id of ['ancestral_spirits','black_magic','divine_protection','royal_medicine','sacred_ritual'])it(`${id}: old embedded cards gain valid effects once while retaining paid upgrades and identity`,()=>{
  const {state,rng}=makeCombatState({enemyHp:500,playerEnergy:20,playerHp:20});
  const save:any=toBattleSave(state,rng),current=cardById(id)!;
  const old:any={...current,instanceId:'legacy-instance',name:current.name+' +1',upgraded:true,upgradeLevel:1,cost:Math.max(0,current.cost-1)};
  const entry=(migrations as any)[id];
  for(const [key,value] of Object.entries(entry.before)){if(value===null)delete old[key];else old[key]=value;}
  save.state.masterDeck=[old];save.state.piles.hand=[old];save.state.piles.draw=[];
  const original=structuredClone(save),loaded=fromSave(save),card=loaded.masterDeck[0];
  expect(save).toEqual(original);
  expect(card).toMatchObject({id,instanceId:'legacy-instance',name:current.name+' +1',upgraded:true,upgradeLevel:1,cost:old.cost});
  const twice=fromSave(toBattleSave(loaded,rng));expect(twice.masterDeck).toEqual(loaded.masterDeck);
  expect(twice.piles.hand).toEqual(loaded.piles.hand);
  loaded.player.statusEffects=[];applyStatusEffect('player',loaded,'poison',2,1);
  loaded.piles.draw=Array.from({length:10},(_,i)=>attackCard(1,{id:'legacy-draw-'+i}));
  const before=usefulState(loaded);before.energy-=effectiveCost(loaded,card);before.hand=[];
  expect(usefulState(applyCommand(loaded,{type:'PlayCard',index:0},rng).state)).not.toEqual(before);
 });
 it('runtime and battle UI contain no retired tracker, command, book, badge or notice',()=>{
  for(const path of ['src/core/combat/combos.ts','src/data/packs/base/combos.json','app/comboPresentation.ts','app/components/battle/ComboBook.tsx','app/components/battle/ComboStrip.tsx'])expect(existsSync(path)).toBe(false);
  const files=(root:string):string[]=>readdirSync(root,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(root,e.name)):/\.tsx?$/.test(e.name)?[join(root,e.name)]:[]);
  for(const f of [...files('app'),...files('src/core')].filter(f=>f!=='src/core/saveMigration.ts'&&f!=='src/core/save.ts')){
   expect(readFileSync(f,'utf8'),f).not.toMatch(/onCardPlayedForCombos|applyComboCardModifiers|expireCombos|resetCombos|QA_(DebugCombos|TriggerCombo|ClearCombos)|combo-completed-notice|combo:book|ตำราคอมโบ|state\.combo|s\.combo|metrics\.combos/);
  }
 });
});
