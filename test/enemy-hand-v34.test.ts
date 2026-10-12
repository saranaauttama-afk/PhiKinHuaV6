import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import {makeCombatState} from './helpers';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {drawEnemyHand,consumeEnemyCard,finishEnemyHand,initializeEnemyHand} from '../src/core/combat/enemyHand';
import {chooseEnemyCards,chooseEnemyCardIndexes} from '../src/core/combat/enemyPlan';
import {resolveEnemyCard} from '../src/core/combat/enemyCardEffects';
import {enemyCardById} from '../src/core/pack_enemy_cards';
import {toBattleSave,fromSave} from '../src/core/save';
import {applyStatusEffect} from '../src/core/statusEffectsRuntime';
import {NIGHT_ENEMY_DECKS} from '../src/core/campaign/enemyDecks';
import {getAllMonsterIds} from '../src/core/monsters/thai-ghosts';
import type {GameState} from '../src/core/types';
const heal='phi_pop_v29_signature_support',multi='krahang_v29_signature',strength='krahang_v29_setup';
function fixture(hand:string[],draw:string[]=[],discard:string[]=[]){
 const {state:s}=makeCombatState({playerHp:500,enemyHp:80});s.enemy!.maxHp=80;s.enemy!.maxEnergy=2;
 s.enemy!.statusEffects=[];s.enemyPiles={hand:[...hand],draw:[...draw],discard:[...discard]};s.enemyHandSize=4;s.enemyDrawPerTurn=2;s.enemyMaxRetained=2;s.enemyHandAges=hand.map(()=>0);s.enemyEnergy=2;
 return s;
}
const turn=(s:GameState)=>applyCommand(s,{type:'ResolveEnemyTurn'},makeRng('v34')).state;
const inventory=(s:GameState)=>[...s.enemyPiles!.hand,...s.enemyPiles!.draw,...s.enemyPiles!.discard].sort();
describe('v34 physical hand and retention',()=>{
 it('retains an unused heal in the actual hand across turns and later spends it',()=>{
  const s=fixture(['claw','guard',heal],['claw','guard']);
  // A recovery shield can wait until its healing is useful.
  const healOnly='winyan_rerorn_v29_recover';
  expect(enemyCardById(healOnly)?.heal).toBeGreaterThan(0);
  s.enemyPiles!.hand[2]=healOnly;
  const a=turn(s);expect(a.enemyPiles!.hand).toContain(healOnly);expect(a.enemyPiles!.discard).not.toContain(healOnly);
  a.enemy!.hp=10;const b=turn(a);expect(b.enemyLastPlayed).toContain(healOnly);expect(b.enemyPiles!.discard).toContain(healOnly);
 });
 it('retained copies consume hand slots and fixed draw never fills beyond capacity',()=>{
  const s=fixture(['claw','claw','guard'],['swipe','maul','guard']);drawEnemyHand(s);
  expect(s.enemyPiles!.hand).toHaveLength(4);expect(s.enemyPiles!.draw).toEqual(['maul','guard']);expect(s.enemyHandAges).toEqual([0,0,0,0]);
  drawEnemyHand(s);expect(s.enemyPiles!.hand).toHaveLength(4);
 });
 it('two retained cards plus two draws are four cards, not four new draws',()=>{
  const s=fixture(['guard','guard'],['claw','swipe','maul']);s.enemyHandAges=[1,1];drawEnemyHand(s);
  expect(s.enemyPiles!.hand).toEqual(['guard','guard','claw','swipe']);expect(s.enemyPiles!.draw).toEqual(['maul']);
 });
 it('playing deducts energy and moves exactly one duplicated copy with its age',()=>{
  const s=fixture(['claw','claw']);s.enemyHandAges=[0,2];expect(consumeEnemyCard(s,1)).toBe(true);
  expect(s.enemyEnergy).toBe(1);expect(s.enemyPiles!.hand).toEqual(['claw']);expect(s.enemyPiles!.discard).toEqual(['claw']);expect(s.enemyHandAges).toEqual([0]);
  expect(consumeEnemyCard(s,3)).toBe(false);expect(inventory(s)).toEqual(['claw','claw']);
 });
 it('recycles only the discard, never the held copy; multiset stays identical over 20 turns',()=>{
  let s=fixture(['guard'],[],['claw','claw','swipe','guard','maul']);const cards=inventory(s);
  for(let i=0;i<20;i++){s=turn(s);expect(inventory(s)).toEqual(cards);expect(s.enemyPiles!.hand.length).toBeLessThanOrEqual(2);expect(s.enemyPiles!.hand.length).toBe(s.enemyHandAges!.length);}
 });
 it('resets energy each turn and never overspends',()=>{
  const s=fixture([],['claw','claw','claw','claw']);s.enemyEnergy=0;
  const a=turn(s);expect(a.enemyLastPlayed).toEqual(['claw','claw']);expect(a.enemyEnergy).toBe(0);
  const b=turn(a);expect(b.enemyLastPlayed).toEqual(['claw','claw']);expect(b.enemyEnergy).toBe(0);
 });
 it('limits retention and releases a card after bounded waiting',()=>{
  const s=fixture(['claw','swipe','maul','guard']);s.enemyHandAges=[2,0,0,0];finishEnemyHand(s,0);
  expect(s.enemyPiles!.hand).toHaveLength(2);expect(s.enemyPiles!.hand).not.toContain('claw');expect(inventory(s)).toEqual(['claw','guard','maul','swipe']);
 });
 it('keeps duplicate-copy decisions aligned with physical indexes',()=>{
  const s=fixture([multi,multi,strength]);s.enemyHandAges=[0,2,0];const indexes=chooseEnemyCardIndexes(s,s.enemyPiles!.hand,2);
  expect(indexes).toContain(1);expect(indexes).not.toContain(0);
  s.enemyDrawPerTurn=0;const a=turn(s);expect(a.enemyPiles!.hand).toContain(multi);expect(a.enemyHandAges?.[a.enemyPiles!.hand.indexOf(multi)]).toBe(1);
 });
});
describe('v34 decisions and ordinary interactions',()=>{
 it('saves a fresh multi-hit when a held Strength setup is more useful; plays it next turn',()=>{
  const s=fixture([multi,strength]);s.enemyDrawPerTurn=0;const a=turn(s);
  expect(a.enemyLastPlayed).toEqual([strength]);expect(a.enemyPiles!.hand).toEqual([multi]);
  const b=turn(a);expect(b.enemyLastPlayed).toEqual([multi]);
  const hits=b.pendingEvents!.filter(e=>e.t==='Damage'&&e.target==='player');expect(hits).toHaveLength(3);expect(hits.every(e=>(e as any).modified===3)).toBe(true);
 });
 it('orders poison before an affordable poison payoff; each hit resolves once',()=>{
  const poison='phi_krasue_v29_signature_support',payoff='phi_krasue_v34_payoff';
  const s=fixture([payoff,poison]);s.enemy!.maxEnergy=3;s.enemyEnergy=3;s.enemyDrawPerTurn=0;
  const a=turn(s);expect(a.enemyLastPlayed).toEqual([poison,payoff]);
  const reveals=a.pendingEvents!.filter(e=>e.t==='EnemyCardRevealed');expect(reveals).toHaveLength(2);
  expect(a.pendingEvents!.filter(e=>e.t==='Damage'&&e.target==='player').some(e=>(e as any).raw===7)).toBe(true);
 });
 it('block then Mae Nak multi-hit gains its normal board payoff',()=>{
  const s=fixture([]);resolveEnemyCard(s,enemyCardById('mae_nak_v29_ward')!);const before=s.player.hp;
  resolveEnemyCard(s,enemyCardById('mae_nak_v34_payoff')!);expect(before-s.player.hp).toBe(9);
 });
 it('takes useful defense at low HP and avoids a redundant heal at full HP',()=>{
  const s=fixture(['guard','claw']);s.enemy!.hp=2;expect(chooseEnemyCards(s,s.enemyPiles!.hand,1)).toEqual(['guard']);
  const full=fixture(['winyan_rerorn_v29_recover']);expect(chooseEnemyCards(full,full.enemyPiles!.hand,2)).toEqual([]);
 });
 it('uses visible enemy buffs and player statuses without inspecting hidden cards',()=>{
  const s=fixture(['claw','guard']);const a=chooseEnemyCards(s,s.enemyPiles!.hand,1);
  Object.defineProperty(s,'piles',{get(){throw Error('hidden player piles accessed');}});
  expect(chooseEnemyCards(s,s.enemyPiles!.hand,1)).toEqual(a);
  applyStatusEffect('enemy',s,'strength',3,4);expect(chooseEnemyCards(s,s.enemyPiles!.hand,1)).toEqual(['claw']);
 });
 it('does not defer an affordable meaningful attack indefinitely',()=>{
  let s=fixture([multi,strength],['claw','guard','claw','guard']);const acted=[];
  for(let i=0;i<12;i++){s=turn(s);acted.push((s.enemyLastPlayed?.length??0)>0);expect(s.enemyIdleTurns??0).toBeLessThanOrEqual(1);}
  expect(acted.some(Boolean)).toBe(true);
 });
 it('live presentation reveals one card followed by its effects before the next reveal',()=>{
  const s=fixture(['claw','claw','guard']);s.enemy!.maxEnergy=3;s.enemyDrawPerTurn=0;
  const a=turn(s),ev=a.pendingEvents!,reveal=ev.flatMap((e,i)=>e.t==='EnemyCardRevealed'?[i]:[]);
  expect(reveal).toHaveLength(3);
  for(let i=0;i<reveal.length;i++){const interval=ev.slice(reveal[i]+1,reveal[i+1]??ev.length);expect(interval.some(e=>e.t==='Damage'||e.t==='BlockGained')).toBe(true);}
  expect(a.enemyLastPlayed).toEqual(ev.filter(e=>e.t==='EnemyCardRevealed').map(e=>(e as any).cardId));
 });
 it('retained cards are not revealed or included in a future intent during player turns',()=>{
  const s=fixture(['claw','winyan_rerorn_v29_recover']);s.enemyDrawPerTurn=0;const a=turn(s);
  expect(a.enemyPiles!.hand).toEqual(['winyan_rerorn_v29_recover']);expect(a.enemyLastPlayed).toEqual(['claw']);expect(a.enemyIntent).toBeUndefined();
  a.campaign={night:1,difficulty:1,completedNights:0,unlocks:[]};const b=applyCommand(a,{type:'StartPlayerTurn'},makeRng('v34')).state;
  expect(b.enemyIntent).toBeUndefined();expect(b.enemyPiles).toEqual(a.enemyPiles);
 });
});
describe('v34 migration and scope',()=>{
 it('save/load preserves held cards, per-copy age and subsequent decisions',()=>{
  const s=fixture(['claw','guard']);s.enemyHandAges=[1,2];s.enemyIdleTurns=1;
  const loaded=fromSave(toBattleSave(s,makeRng('v34')));expect(loaded.enemyPiles).toEqual(s.enemyPiles);expect(loaded.enemyHandAges).toEqual([1,2]);expect(loaded.enemyIdleTurns).toBe(1);
  expect(turn(loaded).enemyLastPlayed).toEqual(turn(s).enemyLastPlayed);
 });
 it('v33 snapshots gain missing retention fields without losing player progression or pile copies',()=>{
  const s=fixture(['claw','claw'],['guard'],['maul']);delete s.enemyDrawPerTurn;delete s.enemyMaxRetained;delete s.enemyHandAges;delete s.enemyIdleTurns;
  s.player.gold=789;const loaded=fromSave(toBattleSave(s,makeRng('old')));
  expect(loaded.enemyPiles).toEqual(s.enemyPiles);expect(loaded.enemyHandAges).toEqual([0,0]);expect(loaded.enemyMaxRetained).toBe(2);expect(loaded.player).toEqual(s.player);
 });
 it('legacy partial/overfull piles normalize without deleting copies',()=>{
  const s=fixture(['claw','claw','claw','claw','guard']);initializeEnemyHand(s);
  expect(s.enemyPiles!.hand).toHaveLength(4);expect(s.enemyPiles!.discard).toEqual(['guard']);expect(inventory(s)).toHaveLength(5);
 });
 it('all 34 ghosts have valid owned decks with meaningful mixed effects',()=>{
  for(const id of getAllMonsterIds()){
   const deck=NIGHT_ENEMY_DECKS[id];expect(deck,id).toBeDefined();expect([10,12,15]).toContain(deck.length);
   for(const cardId of deck){const c=enemyCardById(cardId)!;expect(c,cardId).toBeDefined();expect(c.owner).toBe(id);expect(c.dmg||c.block||c.heal||c.statusEffect||c.curseCard).toBeTruthy();}
  }
 });
 it('new runtime has no sequence tracking, meters or explicit combo handlers',()=>{
  for(const file of ['enemyHand.ts','enemyPlan.ts','enemyCardEffects.ts'])expect(fs.readFileSync('src/core/combat/'+file,'utf8')).not.toMatch(/comboProgress|completedCombos|cardComboSystem|activeComboProgress/);
 });
});

for(const card of Object.values(NIGHT_ENEMY_DECKS).flat().filter((id,i,all)=>id.includes('_v34_')&&all.indexOf(id)===i)){
 it(card+' has a useful resolved effect with approved existing art identity',()=>{
  const s=fixture([]);s.enemy!.hp=20;s.enemy!.block=2;
  applyStatusEffect('player',s,'poison',3,1);applyStatusEffect('player',s,'vulnerable',2,1);
  const before=JSON.stringify({player:s.player,enemy:s.enemy,discard:s.piles.discard});
  resolveEnemyCard(s,enemyCardById(card)!);
  expect(JSON.stringify({player:s.player,enemy:s.enemy,discard:s.piles.discard})).not.toBe(before);
 });
}

it('boss awakening between reveals uses the transformed physical card and matching cost/effect',()=>{
 const s=fixture(['night_head_collector_v29_setup','night_head_collector_v29_double']);
 s.enemy!.id='night-head-collector';s.enemy!.maxHp=100;s.enemy!.hp=51;s.enemy!.maxEnergy=3;s.enemyDrawPerTurn=0;
 s.campaign={night:1,difficulty:3,completedNights:0,unlocks:[],bossAwakened:false};
 s.traps=[{cardId:'v34-skill-trap',name:'test',trigger:'enemy_skill',fx:{dmg:2}}];
 const a=turn(s);expect(a.campaign?.bossAwakened).toBe(true);
 expect(a.enemyLastPlayed).toEqual(['night_head_collector_v29_setup','night_head_collector_v29_awakened_strike']);
 const raw=a.pendingEvents!.filter(e=>e.t==='Damage'&&e.target==='player').map(e=>(e as any).raw);
 expect(raw).toEqual([5,5]);expect(a.enemyEnergy).toBe(0);
});
it('lethal reflected damage stops a multi-hit and prevents post-death healing',()=>{
 const s=fixture([]);s.enemy!.hp=1;applyStatusEffect('player',s,'thorns',2,3);
 resolveEnemyCard(s,{id:'v34-counter-check',owner:'test',type:'attack',energyCost:2,dmg:2,hits:3,heal:5});
 expect(s.enemy!.hp).toBe(0);
 expect(s.pendingEvents!.filter(e=>e.t==='Damage'&&e.target==='player')).toHaveLength(1);
});
