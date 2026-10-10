import {simulateNight} from './night-pilot';
const log=console.log;console.log=()=>{};const rows=[];
for(const cls of ['warrior','shaman','nun','medium'] as const)for(const difficulty of [1,2,3,4,5] as const)for(const tactical of [false,true]){
 const runs=Array.from({length:Number(process.env.RUN_PILOT_RUNS??6)},(_,i)=>simulateNight(`three-night-balance-${cls}-${i}`,cls,difficulty,tactical,undefined,true));
 const fights=runs.flatMap(r=>r.fightDetails);
 rows.push({class:cls,difficulty,policy:tactical?'public-board':'random-affordable',runs:runs.length,wins:runs.filter(r=>r.won).length,stalled:runs.filter(r=>r.stalled).length,meanFights:+(runs.reduce((n,r)=>n+r.fights,0)/runs.length).toFixed(1),meanTurns:+(runs.reduce((n,r)=>n+r.turns,0)/runs.length).toFixed(1),meanDeck:+(runs.reduce((n,r)=>n+r.deck,0)/runs.length).toFixed(1),meanCombos:+(runs.reduce((n,r)=>n+r.combos,0)/runs.length).toFixed(1),cardsPerEnemyTurn:+(runs.reduce((n,r)=>n+r.enemyCards,0)/Math.max(1,runs.reduce((n,r)=>n+r.enemyTurns,0))).toFixed(2),fightTurns:Object.fromEntries(['normal','elite','boss'].map(kind=>{const list=fights.filter(f=>f.kind===kind);return [kind,{count:list.length,mean:list.length?+(list.reduce((n,f)=>n+f.turns,0)/list.length).toFixed(2):null}]}))});
}
log(JSON.stringify(rows,null,2));
