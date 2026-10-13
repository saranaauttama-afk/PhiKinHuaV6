import {describe,it,expect} from 'vitest';
import {baseNewState,beginPlayerFight,startPlayerTurn} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {cardById,BLESSING_POOL} from '../src/core/pack';
import {loadoutIndices,normalizeLoadout} from '../src/core/cards/equipment';
import {groupCards} from '../src/core/cards/group';
import {openingHandSize} from '../src/core/cards/hand';
import {describeBlessing} from '../src/core/cards/describe';
import {rollLevelOffers,upgradeCard,grantBlessing} from '../src/core/engine/shared';
import {toSave,fromSave} from '../src/core/save';
import {rollCardReward} from '../src/core/cards/reward';
import type {Command,GameState} from '../src/core/types';
function run(){let s=baseNewState('feedback'),r=makeRng('feedback');const go=(c:Command)=>{({state:s,rng:r}=applyCommand(s,c,r));};go({type:'NewRun',seed:'feedback',classId:'warrior'});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});s.blessings=[];return {go,get s(){return s},get r(){return r}};}
const eq=()=>structuredClone(cardById('equipment_iron_bracer')!);
describe('playtest feedback: ownership, hand and descriptions',()=>{
 it('starter blessings without desc still describe real effects',()=>{const b=BLESSING_POOL.find(b=>b.id==='meditation_peace')!;expect(b).toBeDefined();expect(describeBlessing(b)).not.toBe('');expect(describeBlessing(b)).toMatch(/ต้นเทิร์น|เกราะ|ฟื้น|มานา/);});
 it('a saved loadout follows the exact owned copy through upgrade and another card removal',()=>{const d=run();d.s.masterDeck.push(eq(),eq());d.go({type:'SetEquipmentLoadout',indices:[11]});const id=d.s.equipmentLoadout![0];expect(id).toBe(d.s.masterDeck[11].ownedId);d.s.masterDeck[11]=upgradeCard(d.s.masterDeck[11]);d.s.masterDeck.splice(0,1);normalizeLoadout(d.s);expect(loadoutIndices(d.s)).toEqual([10]);const restored=fromSave(toSave(d.s,d.r))!;expect(restored.equipmentLoadout).toEqual([id]);d.go({type:'ChooseOffer',index:0});expect(d.s.equipped?.[0].ownedId).toBe(id);expect(d.s.equipped?.[0].star).toBe(2);expect(Object.values(d.s.piles).flat().some(c=>c.ownedId===id)).toBe(false);const before=d.s.equipmentLoadout;d.go({type:'SetEquipmentLoadout',indices:[]});expect(d.s.equipmentLoadout).toEqual(before);});
 it('removed equipment loses only its own slot; duplicate selection is rejected',()=>{const d=run();d.s.equipmentSlotsMax=2;d.s.masterDeck.push(eq(),eq());d.go({type:'SetEquipmentLoadout',indices:[10,11]});const survivor=d.s.equipmentLoadout![1];d.go({type:'SetEquipmentLoadout',indices:[10,10]});expect(d.s.equipmentLoadout).toHaveLength(2);d.s.masterDeck.splice(10,1);normalizeLoadout(d.s);expect(d.s.equipmentLoadout).toEqual([survivor]);expect(loadoutIndices(d.s)).toEqual([10]);});
 it('legacy identities never overwrite a later owned id',()=>{const s=run().s;s.masterDeck=[eq(),{...eq(),ownedId:'owned-1'}];normalizeLoadout(s);expect(s.masterDeck[1].ownedId).toBe('owned-1');expect(new Set(s.masterDeck.map(c=>c.ownedId)).size).toBe(2);});
 it('groups exact duplicates but separates stars and differing effects',()=>{const c=eq();expect(groupCards([{...c,ownedId:'a'},{...c,ownedId:'b'}])).toHaveLength(1);expect(groupCards([c,{...c,star:2},{...c,equip:{triggers:[],armor:5}}])).toHaveLength(3);});
 it('opening follows developed hand, preserves opening penalties, later draws remain separate',()=>{const d=run();expect(openingHandSize(d.s)).toBe(2);d.s.player.retain=3;d.s.phase='combat';let r=beginPlayerFight(d.s,d.r);expect(d.s.piles.hand).toHaveLength(3);r=startPlayerTurn(d.s,r).rng;expect(d.s.piles.hand).toHaveLength(5);grantBlessing(d.s,{id:'penalty',name:'penalty',rules:{openingDraw:-1},triggers:[]});expect(openingHandSize(d.s)).toBe(2);});
 it('ordinary levels cannot offer hand or draw growth',()=>{const s=run().s;for(let i=0;i<100;i++){const offers=rollLevelOffers(s,makeRng('growth'+i)).list;expect(offers).not.toContain('retain');expect(offers).not.toContain('draw');expect(offers).toHaveLength(2);}});
 it('boss growth is an alternative consumed once, never a normal-fight reward',()=>{const d=run();const page=d.s.pages!.current!;page.offers[0]={kind:'boss',bossType:'night',night:1} as any;d.s.pages!._activeOfferIndex=0;rollCardReward(d.s,d.r);expect(d.s.cardReward!.growth).toEqual(['retain','draw']);d.s.phase='reward';d.go({type:'ChooseHandReward',option:'retain'});expect(d.s.player.retain).toBe(3);expect(d.s.cardReward).toBeUndefined();d.go({type:'ChooseHandReward',option:'retain'});expect(d.s.player.retain).toBe(3);});
});
