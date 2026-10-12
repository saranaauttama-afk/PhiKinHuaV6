import fs from 'node:fs';
import {simulateNight} from './night-pilot';
const log=console.log;console.log=()=>{};
const runsPerCell=Number(process.env.V34_RUNS??8),rows=[];
for(const cls of ['warrior','shaman','nun','medium'] as const)for(const difficulty of [1,2,3,4,5] as const){
 let damage=0,peak=0,retained=0,idle=0,enemyTurns=0,cardCount=0,bossTurns=0,bossDamage=0,bossPeak=0,bossActions=0;
 const spikes:any[]=[];let earlyPeak=0;
 const fights:Array<{kind:string;turns:number;won:boolean}>=[];
 const runs=Array.from({length:runsPerCell},(_,i)=>{
  let lastPhase='',lastEnemy='',lastTurn=0;
  const result=simulateNight(`v34-paired-${cls}-${i}`,cls,difficulty,true,s=>{
   const events=s.pendingEvents??[];
   // Each reducer transition is observed once; only the enemy turn command has both TurnEnded events.
   if(events.some(e=>e.t==='TurnEnded'&&e.who==='enemy')){
    const loss=events.filter(e=>e.t==='Damage'&&e.target==='player').reduce((n,e)=>n+(e as any).hpLoss,0);
    const cards=events.filter(e=>e.t==='EnemyCardRevealed').length;
    damage+=loss;peak=Math.max(peak,loss);if(s.campaign?.night===1&&s.turn<=3)earlyPeak=Math.max(earlyPeak,loss);
    if(loss>=15){spikes.push({enemy:s.enemy?.id,night:s.campaign?.night,turn:s.turn,loss,playerMaxHp:s.player.maxHp,cards:s.enemyLastPlayed,strength:s.enemy?.statusEffects?.find(e=>e.id==='strength')?.stacks??0});spikes.sort((a,b)=>b.loss-a.loss);spikes.length=Math.min(spikes.length,3);}
    retained+=s.enemyPiles?.hand.length??0;idle+=Number(cards===0);enemyTurns++;cardCount+=cards;
    const ix=s.pages?._activeOfferIndex; if(ix!=null&&s.pages?.current?.offers[ix]?.kind==='boss'){bossActions++;bossDamage+=loss;bossPeak=Math.max(bossPeak,loss);}
   }
   if(lastPhase==='combat'&&s.phase!=='combat'&&lastEnemy){const ix=s.pages?._activeOfferIndex;const offer=ix!=null?s.pages?.current?.offers[ix]:undefined;const kind=offer?.kind==='boss'?'boss':offer?.kind==='monster'?offer.tier:'normal';fights.push({kind,turns:s.turn||lastTurn,won:s.player.hp>0});if(kind==='boss')bossTurns+=s.turn;}
   lastPhase=s.phase;lastEnemy=s.enemy?.id??'';lastTurn=s.turn;
  },true);
  return result;
 });
 const round=(n:number)=>+n.toFixed(2);
 rows.push({class:cls,difficulty,runs:runs.length,wins:runs.filter(r=>r.won).length,winRate:round(runs.filter(r=>r.won).length/runs.length),stalled:runs.filter(r=>r.stalled).length,meanFights:round(runs.reduce((n,r)=>n+r.fights,0)/runs.length),meanRunTurns:round(runs.reduce((n,r)=>n+r.turns,0)/runs.length),enemyTurns,cardsPerTurn:round(cardCount/Math.max(1,enemyTurns)),retainedPerTurn:round(retained/Math.max(1,enemyTurns)),idleTurns:idle,meanDamagePerEnemyTurn:round(damage/Math.max(1,enemyTurns)),peakDamagePerEnemyTurn:peak,earlyPeakDamage:earlyPeak,largestSpikes:spikes,meanDamagePerRun:round(damage/runs.length),boss:{encounters:fights.filter(f=>f.kind==='boss').length,wins:fights.filter(f=>f.kind==='boss'&&f.won).length,meanTurns:round(bossTurns/Math.max(1,fights.filter(f=>f.kind==='boss').length)),meanDamagePerEnemyTurn:round(bossDamage/Math.max(1,bossActions)),peakDamage:bossPeak},combat:Object.fromEntries(['normal','elite','boss'].map(kind=>{const list=fights.filter(f=>f.kind===kind);return [kind,{count:list.length,meanTurns:round(list.reduce((n,f)=>n+f.turns,0)/Math.max(1,list.length))}]}))});
 process.stderr.write(`${cls} difficulty ${difficulty} complete\n`);
}
const report={runsPerCell,seedPattern:'v34-paired-{class}-{index}',policy:'existing public-board pilot; real full three-night progression; no QA card',limitations:'Automated policy is not a human win-rate estimate. Duration is measured in turns, not wall-clock minutes. Damage excludes heals, includes player-turn end damage in enemy-turn event batch.',rows};
if(process.env.V34_REPORT)fs.writeFileSync(process.env.V34_REPORT,JSON.stringify(report,null,2)+'\n');else log(JSON.stringify(report,null,2));
