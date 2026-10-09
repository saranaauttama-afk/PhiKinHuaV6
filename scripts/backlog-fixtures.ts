import fs from 'node:fs';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {ALL_CARDS,BLESSINGS_BY_RARITY} from '../src/core/pack';
import {onCardPlayed} from '../src/core/combat/combos';
import {applyStatusEffect} from '../src/core/statusEffectsRuntime';
import {summonMinion} from '../src/core/minionRuntime';
import {toBattleSave} from '../src/core/save';
import {onRestRow} from '../src/core/map/restPage';
import {reachableNodes} from '../src/core/map/journey';
import type {GameState} from '../src/core/types';
const rng=makeRng('backlog-qa');let s=applyCommand({seed:'backlog-qa',turn:0,phase:'start'} as GameState,{type:'NewRun',seed:'backlog-qa',classId:'warrior'},rng).state;
s.chapter=undefined;s=applyCommand(s,{type:'ChooseStarterBlessing',index:0},rng).state;s=applyCommand(s,{type:'ChooseOffer',index:0},rng).state;
s.player.gold=1000;s.masterDeck[0]={...s.masterDeck[0],unremovable:true};s.masterDeck[2]={...s.masterDeck[2],upgradeLevel:3,upgraded:true};
s.blessings=Object.values(BLESSINGS_BY_RARITY).flat().slice(0,8);applyStatusEffect('player',s,'poison',3,2);applyStatusEffect('player',s,'strength',3,2);applyStatusEffect('enemy',s,'weakness',3,2);
summonMinion(s,'kuman_spirit','player',1);if(s.minions?.[0])s.minions[0].statusEffects=[s.player.statusEffects![0]];
onCardPlayed(s,ALL_CARDS.find(c=>c.id==='muay_stance')!,'warrior');
const fixtures:Record<string,{state:GameState;rng:typeof rng}>={};const keep=(name:string,base:GameState)=>fixtures[name]={state:structuredClone(base),rng};
keep('status',s);keep('blessing-seals',s);keep('combo-book',s);keep('enemy-card',s);keep('enemy-card-multi',s);keep('battle',s);
for(const kind of ['card','remove','upgrade'] as const){const a=structuredClone(s);a.phase='shop';a.shopKind=kind;a.currentShopId='qa-'+kind;a.shopStock=[{card:ALL_CARDS[0],price:70},{card:ALL_CARDS[1],price:90}];a.runCounters={removed:0,removeShopCount:1,upgradeShopCount:1};keep('shop-'+kind,a);a.player.gold=0;keep('shop-'+kind+'-poor',a);}
const level=structuredClone(s);level.phase='levelup';level.levelUp={choice:{optionA:'max_hp',optionB:'max_energy',gold:30},consumed:false} as any;keep('levelup',level);
// Navigate the real reducer to a rest row; route QA never fabricates its return state.
let rest=applyCommand({seed:'backlog-route',turn:0,phase:'start'} as GameState,{type:'NewRun',seed:'backlog-route',classId:'warrior'},rng).state;
const step=(cmd:any)=>{rest=applyCommand(rest,cmd,rng).state;};rest.chapter=undefined;step({type:'ChooseStarterBlessing',index:0});
for(let guard=0;guard<60&&!(rest.phase==='map'&&onRestRow(rest));guard++){
 if(rest.chapter)step({type:'SkipChapter'});
 else if(rest.phase==='map')step({type:'ChooseOffer',index:rest.pages!.current!.offers.findIndex(o=>o.kind==='monster'||o.kind==='boss')});
 else if(rest.phase==='combat'){rest.piles.hand=[{id:'test',name:'test',type:'attack',cost:0,dmg:9999}];step({type:'PlayCard',index:0});}
 else if(rest.phase==='levelup')step({type:'SkipLevelUp'});
 else if(rest.phase==='reward')step({type:'SkipCardReward'});
 else step({type:'CompleteNode'});
}
if(rest.phase!=='map'||!onRestRow(rest))throw Error('QA failed to reach a real rest row');
rest.campaign={night:2,unlocks:[]};
for(const kind of ['shop_card','shop_equipment','shop_remove','shop_upgrade','well','healing_shrine','treasure','treasure_single','fusion_altar','story_event']){
 const a=structuredClone(rest);const offer={kind,nodeId:'qa-rest',shopId:'qa-rest',eventId:'episode_lantern'} as any;
 a.pages!.current!.offers[0]=offer;reachableNodes(a.journey!)[0].offer=offer;keep('rest-'+kind,a);
 if(kind==='story_event')keep('event',applyCommand(a,{type:'ChooseOffer',index:0},rng).state);
}
for(const kind of ['shop_equipment','treasure','treasure_single'] as const){
 const a=structuredClone(fixtures['rest-'+kind].state);const result=applyCommand(a,{type:'ChooseOffer',index:0},rng);result.state.player.gold=1000;keep('confirm-'+kind,result.state);
 const poor=structuredClone(result.state);poor.player.gold=0;keep('confirm-'+kind+'-poor',poor);
}
keep('rest-cards',rest);
const bless=structuredClone(level);bless.levelUp={choice:{optionA:'blessing',optionB:'max_hp',gold:30},blessingChoices:Object.values(BLESSINGS_BY_RARITY).flat().slice(0,2),consumed:false} as any;keep('levelup-blessing',bless);
keep('hand',s);
for(const night of [1,2,3,4,5] as const){let a=applyCommand({seed:'adventure-ui-'+night,turn:0,phase:'start'} as GameState,{type:'NewRun',seed:'adventure-ui-'+night,classId:'warrior',night},rng).state;a.chapter=undefined;a=applyCommand(a,{type:'ChooseStarterBlessing',index:0},rng).state;keep('adventure-'+night,a);}

fs.mkdirSync('/tmp/phikinhua-backlog-web',{recursive:true});fs.writeFileSync('/tmp/phikinhua-backlog-web/ui-review-fixtures.json',JSON.stringify({fixtures}));
fs.writeFileSync('/tmp/phikinhua-backlog-battle.json',JSON.stringify(toBattleSave(s,rng)));
console.log('Backlog QA fixtures generated:',Object.keys(fixtures).join(', '));
