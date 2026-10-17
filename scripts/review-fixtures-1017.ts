// Synthetic UI fixtures for the 17 Oct 2026 owner fixes (web ui-review only; not playtest evidence).
// Writes <web dir>/ui-review-fixtures.json with screens: traveler, shop-card, deck, talk.
import fs from 'node:fs';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {cardById} from '../src/core/pack';
import type {Command} from '../src/core/types';
const dir=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-review-web';fs.mkdirSync(dir,{recursive:true});
function fresh(){
 let state=baseNewState('rev1017-warrior'),rng=makeRng(state.seed);
 const go=(cmd:Command)=>{({state,rng}=applyCommand(state,cmd,rng));};
 go({type:'NewRun',seed:state.seed,classId:'warrior'});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});
 return {go,get state(){return state},get rng(){return rng}};
}
const fixtures:Record<string,{state:unknown;rng:unknown}>={};
const map=fresh();map.state.campaign!.courage=4;fixtures.traveler={state:map.state,rng:map.rng};
const shop=fresh();shop.state.player.gold=80;shop.state.pages!.adventure!.fightsWon=1;shop.go({type:'ChooseOffer',index:1});if(shop.state.phase!=='shop')throw Error('shop fixture did not open: '+shop.state.phase);fixtures['shop-card']={state:shop.state,rng:shop.rng};
const deck=fresh();deck.state.masterDeck.push(structuredClone(cardById('oiled_wraps')!));fixtures.deck={state:deck.state,rng:deck.rng};
const talk=fresh();talk.go({type:'ChooseOffer',index:0});talk.state.enemy!.hp=0;talk.state.ghostTalk={ghostId:talk.state.enemy!.id};fixtures.talk={state:talk.state,rng:talk.rng};
fs.writeFileSync(`${dir}/ui-review-fixtures.json`,JSON.stringify({fixtures}));
console.log('fixtures',Object.keys(fixtures).join(','),'enemy',talk.state.enemy!.id);
