import fs from 'node:fs';
import {baseNewState} from '../src/core/commands';
import {applyCommand} from '../src/core/reducer';
import {makeRng} from '../src/core/rng';
import {toBattleSave} from '../src/core/save';
import {choosePilotCard} from './gameplay-pilot';
import {cardsPlayedThisTurn} from '../src/core/cards/mechanics';
import type {Command} from '../src/core/types';
// Browser QA checkpoint reached with real card commands, never synthetic damage.
for(let n=0;n<24;n++){
 const seed=`quiet-preview-${n}`;let s=baseNewState(seed),r=makeRng(seed);
 const go=(c:Command)=>{const o=applyCommand(s,c,r);s=o.state;r=o.rng;};
 go({type:'NewRun',seed,classId:'warrior',night:1,runMode:'full'});go({type:'SkipChapter'});go({type:'ChooseStarterBlessing',index:0});go({type:'ChooseOffer',index:0});
 for(let turns=0;s.phase==='combat'&&turns<20;turns++){
  for(let plays=0;s.phase==='combat'&&plays<20;plays++){
   const i=choosePilotCard(s,true,seed+turns+':'+plays);if(i<0)break;
   const before=structuredClone(s),beforeR={...r};const count=cardsPlayedThisTurn(s);go({type:'PlayCard',index:i});
   if(s.phase!=='combat'&&s.phase!=='defeat'){
    fs.writeFileSync('/tmp/quiet-near-win.json',JSON.stringify({save:toBattleSave(before,beforeR),index:i}));console.log('Near-win legal checkpoint',seed,turns,i);process.exit(0);
   }
   if(cardsPlayedThisTurn(s)===count)break;
  }
  if(s.phase==='combat'){while(s.piles.hand.length>s.player.maxHandSize)go({type:'DiscardCard',index:s.piles.hand.length-1});go({type:'ResolveEnemyTurn'});if(s.phase==='combat')go({type:'StartPlayerTurn'});}
 }
}
throw Error('No legal near-win checkpoint');
