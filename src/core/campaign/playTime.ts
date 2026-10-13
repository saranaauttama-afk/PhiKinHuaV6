import type {GameState} from '../types';
export type TimeBucket='combat'|'travel'|'reward';
export type PlayTime=Record<TimeBucket,number>;
export function timeBucket(s:GameState):TimeBucket|undefined{
 if(!s.campaign||s.runSummary||s.phase==='menu'||s.phase==='start')return;
 if(s.phase==='combat')return 'combat';
 if(['victory','talk','levelup','reward','starter'].includes(s.phase))return 'reward';
 return 'travel';
}
export function addPlayTime(s:GameState,bucket:TimeBucket|undefined,ms:number):GameState{
 if(!bucket||!s.runMetrics||s.runSummary||!Number.isFinite(ms)||ms<=0)return s;
 const time={combat:0,travel:0,reward:0,...s.runMetrics.activeMs};time[bucket]+=ms;
 return {...s,runMetrics:{...s.runMetrics,activeMs:time}};
}
/** Pausing/background calls flush BEFORE changing the flag; resuming resets the anchor. */
export class PlayClock {
 private last:number|undefined;
 private foreground=true;
 private paused=false;
 flush(s:GameState,now:number):GameState{
  const dt=this.last==null?0:Math.max(0,now-this.last);this.last=now;
  return addPlayTime(s,this.foreground&&!this.paused?timeBucket(s):undefined,dt);
 }
 setForeground(s:GameState,active:boolean,now:number):GameState{const out=this.flush(s,now);this.foreground=active;return out;}
 setPaused(s:GameState,paused:boolean,now:number):GameState{const out=this.flush(s,now);this.paused=paused;return out;}
 reset(now:number){this.last=now;}
}
export const minutes=(ms:number)=>`${(ms/60000).toFixed(1)} นาที`;
export function timeSummary(t?:PlayTime):string{
 return t?`ต่อสู้ ${minutes(t.combat)} · เดินทาง ${minutes(t.travel)} · รางวัล ${minutes(t.reward)} · รวม ${minutes(t.combat+t.travel+t.reward)}`:'ยังไม่มีข้อมูลเวลา';
}
