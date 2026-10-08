import fs from 'node:fs';
import {simulateNight} from './night-pilot';
import {applyCommand} from '../src/core/reducer';
import {onRestRow} from '../src/core/map/restPage';
import {toSave} from '../src/core/save';
import {emptyJournal,recordRun} from '../src/core/campaign/journal';
import {makeRunRecord} from '../src/core/campaign/metrics';
import type {GameState} from '../src/core/types';
import type {RNG} from '../src/core/rng';
const fixtures:Record<string,{state:GameState;rng:RNG}>={};let journal=emptyJournal();
const keep=(id:string,s:GameState,r:RNG)=>{if(!fixtures[id])fixtures[id]=structuredClone({state:s,rng:r});};
const originalLog=console.log;console.log=()=>{};
for(let n=0;n<20;n++){
 const result=simulateNight('night-balance-warrior-'+n,'warrior',1,true,(s,r)=>{
  if(s.chapter)keep('chapter',s,r);
  if(s.phase==='defeat')keep('defeat',s,r);
  if(s.runSummary&&!s.runSummary.won)keep('summary-defeat',s,r);
  if(s.phase==='levelup')keep('levelup',s,r);
  if(s.phase==='reward')keep('reward',s,r);
  if(s.phase==='event')keep(s.story?.result?'event-result':'event',s,r);
  if(s.phase==='map'&&onRestRow(s)){
   keep('rest',s,r);
   s.pages!.current!.offers.forEach((offer,index)=>{
    if(s.pages!.current!.resolved[index])return;
    const out=applyCommand(s,{type:'ChooseOffer',index},{...r});
    if(out.state.phase==='shop')keep('shop-'+out.state.shopKind,out.state,out.rng);
    if(out.state.phase==='event')keep('event',out.state,out.rng);
   });
  }
 });
 if(result.won){keep('summary',result.state,{s:0});const record=makeRunRecord(result.state,'2026-10-08T12:30:00Z');if(record)journal=recordRun(journal,record);}
 if(fixtures.summary&&['rest','event','levelup','reward','shop-card','shop-equipment','shop-healing','shop-upgrade','shop-remove','shop-fusion'].every(k=>fixtures[k]))break;
}
for(let n=0;n<8&&!fixtures['summary-defeat'];n++){const result=simulateNight('quiet-lose-'+n,'warrior',5,false,(s,r)=>{if(s.phase==='defeat')keep('defeat',s,r);if(s.runSummary&&!s.runSummary.won)keep('summary-defeat',s,r);});if(!result.won&&result.state.runSummary)keep('summary-defeat',result.state,{s:0});}
console.log=originalLog;
if(!fixtures.summary||!fixtures.rest)throw Error('Missing real campaign fixtures');
fixtures.deck=fixtures.rest;fixtures.blessings=fixtures.rest;fixtures.defeat=fixtures['summary-defeat'];
fs.writeFileSync('/tmp/quiet-review-fixtures.json',JSON.stringify({fixtures,journal,restSave:toSave(fixtures.rest.state)}));
console.log('Legal review fixtures:',Object.keys(fixtures).join(', '));
