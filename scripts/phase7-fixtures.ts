// Synthetic UI fixtures: not balance or human playtest evidence. Engine commands build every checkpoint.
import fs from 'node:fs';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {cardById,CURSE_CARDS,BLESSING_POOL,PANDORA_BLESSINGS} from '../src/core/pack';
import {toSave,toBattleSave} from '../src/core/save';
import {ALL_CLASS_IDS} from '../src/core/classes';
import type {Command} from '../src/core/types';
const dir=process.env.PHIKINHUA_WEB_DIR||'/tmp/phikinhua-phase7-web';fs.mkdirSync(dir,{recursive:true});
function fresh(cls:typeof ALL_CLASS_IDS[number]){
 let state=baseNewState('phase7-'+cls),rng=makeRng(state.seed);
 const go=(cmd:Command)=>{({state,rng}=applyCommand(state,cmd,rng));};
 go({type:'NewRun',seed:state.seed,classId:cls});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});state.blessings=[];
 return {go,get state(){return state},get rng(){return rng}};
}
for(const cls of ALL_CLASS_IDS){const f=fresh(cls);fs.writeFileSync(`${dir}/phase7-${cls}.json`,JSON.stringify(toSave(f.state,f.rng)));}
const f=fresh('nun'),s=f.state;
s.masterDeck=['temple_blade','muay_stance','curse_chant','equipment_iron_bracer','meditation','karma_returns','sacred_thread'].map(id=>structuredClone(cardById(id)!));s.masterDeck.push(structuredClone(CURSE_CARDS[0]));s.player.hp=s.player.maxHp=500;s.player.retain=10;s.blessings=[...BLESSING_POOL.filter(b=>['meditation_peace','lifesteal'].includes(b.id)),PANDORA_BLESSINGS.find(b=>b.id==='pandora_open_palm')!].filter(Boolean);
fs.writeFileSync(`${dir}/phase7-all-types.json`,JSON.stringify(toSave(s,f.rng)));
f.go({type:'ChooseOffer',index:0,equipmentIndices:[3]});f.state.enemy!.hp=f.state.enemy!.maxHp=999;
const prayer=f.state.piles.hand.findIndex(c=>c.type==='prayer');if(prayer<0){const ix=f.state.piles.draw.findIndex(c=>c.type==='prayer');f.state.piles.hand.push(f.state.piles.draw.splice(ix,1)[0]);}
f.go({type:'PlayCard',index:f.state.piles.hand.findIndex(c=>c.type==='prayer'),wait:3});
fs.writeFileSync(`${dir}/phase7-prayer.json`,JSON.stringify(toBattleSave(f.state,f.rng)));

// Return-to-board checkpoint: one real owned attack, low enemy HP, no queued talk/level.
const back=fresh('warrior');back.go({type:'ChooseOffer',index:0});
back.state.enemy!.hp=1;back.state.enemy!.block=0;back.state.enemy!.statusEffects=[];
back.state.player.exp=0;back.state.player.expToNext=999;back.state.campaign!.talksThisNight=99;
if(!back.state.piles.hand.some(c=>c.type==='attack')){
 const at=back.state.piles.draw.findIndex(c=>c.type==='attack');
 const card=back.state.piles.draw.splice(at,1)[0];back.state.piles.draw.push(back.state.piles.hand.pop()!);back.state.piles.hand.push(card);
}
fs.writeFileSync(`${dir}/phase7-return.json`,JSON.stringify({...toBattleSave(back.state,back.rng),feedbackAnimation:true}));
