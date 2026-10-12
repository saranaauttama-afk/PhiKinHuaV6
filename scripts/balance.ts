// scripts/balance.ts — one command for a full balance pass.
//
//   npm run balance                         # 20 runs × 4 classes × difficulty 1,3,5
//   npm run balance -- --runs 50 --difficulty 1 --classes nun,medium
//   npm run balance -- --out reports/balance.json --policy random
//
// Prints a summary table and (with --out) writes every run and fight as JSON.
// Losing fights are recorded too, so "who kills the player, where" is visible.
// The pilot reads only the public board; treat win rates as relative, not human.
import fs from 'node:fs';
import path from 'node:path';
import {playRun,type RunRecord,type FightKind} from './pilot';
import {ALL_CLASS_IDS,type ClassId} from '../src/core/classes';
import type {Difficulty} from '../src/core/campaign/threeNight';

function arg(name:string,fallback:string):string{
 const i=process.argv.indexOf('--'+name);
 return i>=0&&process.argv[i+1]&&!process.argv[i+1].startsWith('--')?process.argv[i+1]:fallback;
}
const runs=Math.max(1,Number(arg('runs','20')));
const classes=(arg('classes','all')==='all'?ALL_CLASS_IDS:arg('classes','').split(',')) as ClassId[];
const difficulties=arg('difficulty','1,3,5').split(',').map(Number) as Difficulty[];
const tactical=arg('policy','tactical')!=='random';
const out=arg('out','');
const seedPrefix=arg('seed','balance');

const pct=(n:number,d:number)=>d?Math.round(n/d*100)+'%':'-';
const mean=(xs:number[])=>xs.length?+(xs.reduce((a,b)=>a+b,0)/xs.length).toFixed(1):0;
const pad=(v:unknown,w:number)=>String(v).padEnd(w);

// The engine logs freely to console; keep the report readable.
const log=console.log;console.log=()=>{};
const all:RunRecord[]=[];
const rows:Array<Record<string,unknown>>=[];
const started=Date.now();
for(const cls of classes)for(const difficulty of difficulties){
 const batch=Array.from({length:runs},(_,i)=>playRun(`${seedPrefix}-${cls}-${difficulty}-${i}`,cls,difficulty,{tactical}));
 all.push(...batch);
 const fights=batch.flatMap(r=>r.fights);
 const byKind=(k:FightKind)=>fights.filter(f=>f.kind===k);
 const losses=batch.filter(r=>!r.won&&!r.stalled).map(r=>r.fights.at(-1)).filter(Boolean);
 const killers=Object.entries(losses.reduce<Record<string,number>>((m,f)=>{m[f!.enemyId]=(m[f!.enemyId]??0)+1;return m;},{})).sort((a,b)=>b[1]-a[1]).slice(0,3);
 rows.push({
  class:cls,difficulty,runs,
  win:pct(batch.filter(r=>r.won).length,runs),
  stalled:batch.filter(r=>r.stalled).length,
  deathNight:[1,2,3].map(n=>losses.filter(f=>f!.night===n).length).join('/'),
  deathKind:(['normal','elite','boss'] as const).map(k=>losses.filter(f=>f!.kind===k).length).join('/'),
  turns:(['normal','elite','boss'] as const).map(k=>mean(byKind(k).map(f=>f.turns))).join('/'),
  hpLoss:(['normal','elite','boss'] as const).map(k=>mean(byKind(k).map(f=>f.hpBefore-f.hpAfter))).join('/'),
  fights:mean(batch.map(r=>r.fights.filter(f=>f.won).length)),
  deck:mean(batch.map(r=>r.deck)),
  killers:killers.map(([id,n])=>`${id}×${n}`).join(' '),
 });
 process.stderr.write(`${cls} d${difficulty} done\n`);
}
const cols:[string,number][]=[['class',8],['difficulty',4],['win',5],['stalled',4],['deathNight',8],['deathKind',8],['turns',14],['hpLoss',16],['fights',7],['deck',6],['killers',40]];
log(`balance · ${runs} runs/cell · policy ${tactical?'tactical':'random'} · ${((Date.now()-started)/1000).toFixed(1)}s`);
log('columns: deathNight = losses on night 1/2/3 · deathKind & turns & hpLoss = normal/elite/boss');
log(cols.map(([k,w])=>pad(k==='difficulty'?'d':k,w)).join(' '));
for(const row of rows)log(cols.map(([k,w])=>pad(row[k],w)).join(' '));
if(out){
 fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
 fs.writeFileSync(out,JSON.stringify({runsPerCell:runs,policy:tactical?'tactical':'random',seedPrefix,rows,runs:all},null,1)+'\n');
 log('wrote '+out);
}
