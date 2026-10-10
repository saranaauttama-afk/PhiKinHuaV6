import {describe,it,expect} from 'vitest';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {mainNightRoster,nightEliteCount,ADVENTURE_GHOSTS,validAdventure} from '../src/core/map/adventure';
import {NIGHT_ENEMY_DECKS,NIGHT_AWAKENED_DECKS} from '../src/core/campaign/enemyDecks';
import {nightFinalBoss,ULTIMATE_BOSS} from '../src/core/campaign/bosses';
import {awakenNightBoss,type Night} from '../src/core/campaign/nights';
import {enemyCardById} from '../src/core/pack_enemy_cards';
import {resolveEnemyCard} from '../src/core/combat/enemyCardEffects';
import {dealDamage} from '../src/core/combat/damage';
import {applyStatusEffect,processStatusEffectsEndTurn} from '../src/core/statusEffectsRuntime';
import {fromSave,toSave} from '../src/core/save';
import type {Command} from '../src/core/types';
function driver(night:Night,seed='v29-'+night){let s=baseNewState(seed),r=makeRng(seed);const go=(c:Command)=>{({state:s,rng:r}=applyCommand(s,c,r));};go({type:'NewRun',seed,classId:'warrior',night});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});return {go,get s(){return s},get r(){return r}};}

function reachBoss(d:ReturnType<typeof driver>){for(let guard=0;guard<100&&d.s.pages!.adventure!.boss==='locked';guard++){
   const offers=d.s.pages!.current!.offers,ix=offers.findIndex(o=>o?.kind==='monster'||o?.kind==='story_event');
   if(ix<0){d.go({type:'DismissOffer',index:offers.findIndex(Boolean)});continue;}
   d.go({type:'ChooseOffer',index:ix});if(d.s.phase==='combat'){d.s.piles.hand=[{id:'structural-test',name:'test',type:'attack',cost:0,dmg:99999}];d.go({type:'PlayCard',index:0});if((d.s as import('../src/core/types').GameState).phase==='levelup')d.go({type:'SkipLevelUp'});if((d.s as import('../src/core/types').GameState).phase==='reward')d.go({type:'SkipCardReward'});}else d.go({type:'ChooseEventOption',index:0});d.go({type:'CompleteNode'});
  }
}
describe('final tuning v29',()=>{
 for(const night of [1,2,3,4,5] as const)it(`night ${night}: sampled roster, introductions, elite quota and sparse cadence across 50 seeds`,()=>{
  expect(mainNightRoster(night)).toHaveLength(10+night*2);
  const fresh=mainNightRoster(night).filter(m=>!mainNightRoster(night-1).some(x=>x.id===m.id));
  for(let seed=0;seed<50;seed++){
   const d=driver(night,`v29-roster-${seed}`),deck=d.s.pages!.adventure!.deck;
   const fights=deck.flatMap(e=>e.offer.kind==='monster'?[e.offer]:[]);
   expect(fights).toHaveLength(10);expect(new Set(fights.map(f=>f.enemyId)).size).toBe(10);
   expect(fights.filter(f=>f.tier==='elite')).toHaveLength(nightEliteCount(night));
   expect(fights.some(f=>f.enemyId===nightFinalBoss(night).id)).toBe(false);
   if(night>1)for(const m of fresh)expect(fights.map(f=>f.enemyId)).toContain(m.id);
   const services=deck.filter(e=>e.offer.kind!=='monster');expect(services).toHaveLength(4);
   expect(services.filter(e=>['shop_card','shop_equipment'].includes(e.offer.kind))).toHaveLength(1);
   expect(services.filter(e=>['well','healing_shrine'].includes(e.offer.kind))).toHaveLength(1);
   expect(services.filter(e=>e.offer.kind==='story_event')).toHaveLength(1);
   let count=0,previous='';
   for(const e of deck){if(e.offer.kind==='monster')count++;else {expect(previous).toBe('monster');if(e.offer.kind.startsWith('shop_')&&e!==services.at(-1))expect(count).toBeGreaterThanOrEqual(1);if(['well','healing_shrine'].includes(e.offer.kind))expect(count).toBeGreaterThanOrEqual(6);if(e===services.at(-1))expect(count).toBeGreaterThanOrEqual(8);}previous=e.offer.kind;}
   expect(validAdventure(d.s)).toBe(true);
  }
 });
 it('all 28 route identities remain discoverable across replays',()=>{
  const seen=new Set<string>();for(const night of [1,2,3,4,5] as const)for(let i=0;i<200;i++)for(const e of driver(night,`v29-replay-${i}`).s.pages!.adventure!.deck)if(e.offer.kind==='monster')seen.add(e.offer.enemyId);
  expect([...seen].sort()).toEqual(ADVENTURE_GHOSTS.map(m=>m.id).sort());
 });
 it('boss opens with optional services still visible, and those services survive save/load',()=>{
  const d=driver(1);reachBoss(d);
  const a=d.s.pages!.adventure!;expect(a.boss).toBe('night');expect(a.fightsWon).toBe(10);expect(a.storyDone).toBe(true);
  const optional=d.s.pages!.current!.offers.findIndex(o=>o&&o.kind!=='boss');expect(optional).toBeGreaterThanOrEqual(0);
  const before=structuredClone(d.s.pages);expect(fromSave(toSave(d.s,d.r)).pages).toEqual(before);
  d.go({type:'DismissOffer',index:optional});expect(d.s.pages!.current!.offers.some(o=>o?.kind==='boss')).toBe(true);expect(validAdventure(d.s)).toBe(true);
 });
 for(const [owner,ids] of Object.entries(NIGHT_ENEMY_DECKS))it(`${owner}: all curated cards retained by the live engine; mechanically distinct moves`,()=>{
  const d=driver(3);const final=Object.hasOwn(NIGHT_AWAKENED_DECKS,owner);
  d.s.pages!.current!.offers[0]=final?{kind:'boss',bossType:owner===ULTIMATE_BOSS.id?'secret':'final',enemyId:owner}:{kind:'monster',tier:ids.length===22?'elite':'normal',enemyId:owner};d.go({type:'ChooseOffer',index:0});
  const piles=(d.s as any).enemyPiles;expect(piles.draw.length+piles.hand.length+piles.discard.length).toBe(ids.length);expect(d.s.enemy!.handSize).toBe(final?6:ids.length===22?5:4);
  const mechanics=new Set([...new Set(ids)].map(id=>{const {id:_,name,desc,owner,...effect}=enemyCardById(id)!;return JSON.stringify(effect)}));expect(mechanics.size).toBe(new Set(ids).size);
 });
 it('boss replaces two moves at half HP, restores exactly and awakens once',()=>{
  const d=driver(5),owner=nightFinalBoss(5).id;reachBoss(d);d.go({type:'ChooseOffer',index:d.s.pages!.current!.offers.findIndex(o=>o?.kind==='boss')});d.s.enemy!.hp=Math.floor(d.s.enemy!.maxHp/2);awakenNightBoss(d.s);
  const piles=(d.s as any).enemyPiles,all=[...piles.draw,...piles.hand,...piles.discard];expect(all.every(id=>NIGHT_AWAKENED_DECKS[owner].includes(id))).toBe(true);expect(all.some(id=>id.includes('awakened'))).toBe(true);
  const energy=d.s.enemy!.maxEnergy;awakenNightBoss(d.s);expect(d.s.enemy!.maxEnergy).toBe(energy);expect(fromSave(toSave(d.s,d.r)).enemy).toEqual(d.s.enemy);
 });
 it('krasue dodge consumes one attack but cannot dodge poison; tanee counter reflects without recursion',()=>{
  const d=driver(1);d.go({type:'ChooseOffer',index:0});const s=d.s;s.enemy!.block=0;s.enemy!.statusEffects=[];resolveEnemyCard(s,enemyCardById('phi_krasue_v29_defense')!);processStatusEffectsEndTurn('enemy',s);expect(s.enemy!.statusEffects.some(e=>e.id==='dodge')).toBe(true);
  const hp=s.enemy!.hp;dealDamage(s,{from:'player',to:'enemy',raw:8,source:{kind:'status',effectId:'poison'}});expect(s.enemy!.hp).toBe(hp-8);
  const first=dealDamage(s,{from:'player',to:'enemy',raw:8,source:{kind:'card',cardId:'test'}});expect(first.hpLoss).toBe(0);expect(s.enemy!.statusEffects.some(e=>e.id==='dodge')).toBe(false);
  applyStatusEffect('enemy',s,'thorns',2,3);const player=s.player.hp;dealDamage(s,{from:'player',to:'enemy',raw:8,source:{kind:'card',cardId:'test'}});expect(s.player.hp).toBe(player-3);
  resolveEnemyCard(s,enemyCardById('phi_pop_v29_signature')!);expect(s.log.some(line=>line.includes('กินของคาว'))).toBe(true);
 });
});
