import {describe,it,expect,beforeEach,vi} from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {GHOST_CATALOG,CARD_CATALOG,CORE_CARD_IDS,archiveCards} from '../src/core/archive/catalog';
import {emptyArchive,mergeDiscovery,archiveProgress,parseArchive,trackDiscovery} from '../src/core/archive/progress';
import {useArchive} from '../src/store/archiveStore';
import {applyCommand} from '../src/core/reducer';
import {baseNewState} from '../src/core/commands';
import {makeRng} from '../src/core/rng';
import {toSave,fromSave} from '../src/core/save';
import {ALL_CARDS} from '../src/core/pack';
import type {Command} from '../src/core/types';
function run(id='archive-a',difficulty:1|2|3|4|5=1){
 let rng=makeRng(id),s=baseNewState(id);
 const step=(cmd:Command)=>{const r=applyCommand(s,cmd,rng);s=r.state;rng=r.rng;return s;};
 step({type:'NewRun',seed:id,discoveryId:id,classId:'warrior',difficulty});while(s.chapter)step({type:'SkipChapter'});step({type:'ChooseStarterBlessing',index:0});
 return {get s(){return s;},get rng(){return rng;},step};
}
describe('archive catalog and real discoveries',()=>{
 it('lists all 34 unique ghosts in staged groups and every offered card plus 4 curses (no test card, no retired cards)',()=>{
  expect(GHOST_CATALOG).toHaveLength(34);expect(new Set(GHOST_CATALOG.map(g=>g.id)).size).toBe(34);const offered=ALL_CARDS.filter(c=>!c.retired);expect(CORE_CARD_IDS.size).toBe(offered.length);
  expect(CARD_CATALOG).toHaveLength(offered.length+4);expect(new Set(CARD_CATALOG.map(x=>x.card.id)).size).toBe(offered.length+4);expect(CARD_CATALOG.some(x=>x.card.id==='qa_phra_prathan'||x.card.retired)).toBe(false);
  expect(GHOST_CATALOG.filter(g=>g.group==='บอสแต่ละคืน').map(g=>g.night)).toEqual([1,2,3,4,5]);
  expect(GHOST_CATALOG.at(-1)?.id).toBe('phi-kin-hua');
 });
 it('records only map ghosts revealed to the player, not the ten prebuilt future fights',()=>{
  const r=run();const visible=r.s.pages!.current!.offers.filter(o=>o?.kind==='monster');expect(Object.keys(r.s.discovery!.ghosts)).toHaveLength(visible.length);
  expect(Object.keys(r.s.discovery!.cards).length).toBeGreaterThan(0);
  const id=Object.keys(r.s.discovery!.ghosts)[0],p=mergeDiscovery(emptyArchive(),r.s.discovery!);
  const fight=r.s.pages!.current!.offers.findIndex(o=>o?.kind==='monster');r.step({type:'ChooseOffer',index:fight});r.s.enemy!.statusEffects=[];r.s.piles.hand=[{id:'k',name:'k',type:'attack',fx:{dmg:9999}} as any];r.step({type:'PlayCard',index:0});for(let g=0;g<20&&r.s.phase!=='map';g++)r.step(r.s.phase==='talk'?{type:'AnswerGhostTalk',choice:'leave'}:r.s.phase==='levelup'?({type:'SkipLevelUp'}):r.s.phase==='reward'?{type:'SkipCardReward'}:{type:'CompleteNode'});const next=mergeDiscovery(p,r.s.discovery!);
  expect(archiveProgress(next).ghosts[id].seen).toBe(1);expect(Object.keys(r.s.discovery!.ghosts).length).toBeGreaterThan(1);
 });
 it('viewing or leaving a shop does not discover its stock; buying records only the acquired card',()=>{
  const r=run();const a=r.s.pages!.adventure!,shop=a.deck.find(e=>e.offer.kind==='shop_card')!;r.s.pages!.current!.offers[1]=shop.offer;r.s.pages!.current!.resolved[1]=false;a.slotIds[1]=shop.id;r.step({type:'ChooseOffer',index:1});const stock=r.s.shopStock!;
  const unowned=stock.find(x=>'card' in x&&!r.s.discovery!.cards[x.card.id]);
  if(!unowned||!('card' in unowned))throw Error('Fixture needs unowned stock');
  expect(r.s.discovery!.cards[unowned.card.id]).toBeUndefined();r.s.player.gold=999;
  r.step({type:'TakeShop',index:stock.indexOf(unowned)});
  expect(r.s.discovery!.cards[unowned.card.id]?.id).toBe(unowned.card.id);
 });
 it('credits an actual win once even after resume and terminal commands; losing grants no win',()=>{
  const r=run();r.step({type:'ChooseOffer',index:0});const id=r.s.enemy!.id;
  const before=structuredClone(r.s);r.s.player.hp=0;r.step({type:'EndTurn'});expect(r.s.discovery!.ghosts[id].won).toBe(false);
  const won=structuredClone(before);won.fightCount=(before.fightCount??0)+1;trackDiscovery(before,won);
  const p=mergeDiscovery(emptyArchive(),won.discovery!);expect(archiveProgress(p).ghosts[id].won).toBe(1);
  expect(mergeDiscovery(p,won.discovery!)).toBe(p);
 });
 it('checkpoint serialization retains discoveries and merging an older checkpoint cannot remove newer ones',()=>{
  const r=run(),saved=toSave(r.s,r.rng);r.step({type:'ChooseOffer',index:r.s.pages!.current!.offers.findIndex(o=>o?.kind==='monster')});const p=mergeDiscovery(emptyArchive(),r.s.discovery!);
  const loaded=fromSave(saved);expect(loaded.discovery?.id).toBe('archive-a');expect(mergeDiscovery(p,loaded.discovery!)).toBe(p);
 });
 it('new runs accumulate independently while seed, card upgrades and copies do not create extra identities',()=>{
  const a=run('a',1),b=run('b',2);let p=mergeDiscovery(emptyArchive(),a.s.discovery!);p=mergeDiscovery(p,b.s.discovery!);
  const card=a.s.masterDeck[0];expect(archiveProgress(p).cards[card.id].seen).toBe(2);
  const count=Object.keys(a.s.discovery!.cards).length;a.s.masterDeck.push({...card,star:3});trackDiscovery(a.s,a.s);
  expect(Object.keys(a.s.discovery!.cards)).toHaveLength(count);
 });
 it('rejects corrupt progress rather than granting discoveries',()=>{
  expect(()=>parseArchive('{"version":1}')).toThrow();
  const r=run();const p=mergeDiscovery(emptyArchive(),r.s.discovery!);expect(parseArchive(JSON.stringify(p))).toEqual(p);
  r.s.discovery!.ghosts.fake={seen:true,won:true};expect(()=>parseArchive(JSON.stringify({version:1,runs:{[r.s.discovery!.id]:r.s.discovery}}))).toThrow();
 });
});
beforeEach(async()=>{await AsyncStorage.clear();useArchive.setState({profile:emptyArchive(),ready:false,saving:false,error:''});vi.restoreAllMocks();});
describe('durable archive store',()=>{
 it('hydrates concurrent early observations and serializes their writes without losing either run',async()=>{
  const a=run('persist-a'),b=run('persist-b',2);
  await Promise.all([useArchive.getState().observe(a.s),useArchive.getState().observe(b.s)]);
  const raw=(await AsyncStorage.getItem('phikinhua_archive_v1'))!;expect(Object.keys(parseArchive(raw).runs)).toHaveLength(2);
  useArchive.setState({profile:emptyArchive(),ready:false});await useArchive.getState().hydrate();expect(Object.keys(useArchive.getState().profile.runs)).toHaveLength(2);
 });
 it('retains failed writes in memory, retries without duplicate credit, and survives clearing the run save',async()=>{
  await useArchive.getState().hydrate();vi.spyOn(AsyncStorage,'setItem').mockRejectedValueOnce(Error('disk'));
  const r=run('retry');await expect(useArchive.getState().observe(r.s)).rejects.toThrow();expect(useArchive.getState().error).toBeTruthy();
  await useArchive.getState().retry();await useArchive.getState().observe(r.s);await AsyncStorage.removeItem('phikinhua_autosave');
  expect(Object.keys(parseArchive((await AsyncStorage.getItem('phikinhua_archive_v1'))!).runs)).toHaveLength(1);
 });
 it('does not overwrite corrupt storage during a queued observation',async()=>{
  await AsyncStorage.setItem('phikinhua_archive_v1','{"version":1}');await expect(useArchive.getState().observe(run('corrupt').s)).rejects.toThrow();
  expect(await AsyncStorage.getItem('phikinhua_archive_v1')).toBe('{"version":1}');
 });
});
