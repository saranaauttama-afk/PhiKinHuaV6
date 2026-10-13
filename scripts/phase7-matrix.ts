// Cross-check actual rarity/unlock pools, final-boss alignment and Pandora tiers.
import fs from 'node:fs';
import {playRun} from './pilot';
import {ALL_CLASS_IDS} from '../src/core/classes';
const rows:any[]=[];const log=console.log;console.log=()=>{};
for(const classId of ALL_CLASS_IDS)for(const difficulty of [1,5] as const)for(const tier of [0,6])for(const milestones of [0,4])for(const align of ['courage','merit','even'] as const){
 const r=playRun(`phase7-matrix-${classId}-${difficulty}-${tier}-${milestones}-${align}`,classId,difficulty,{blessingTier:tier,milestoneLevel:milestones,align,veteran:true});
 if(r.stalled)throw Error(`Stalled ${r.seed}`);rows.push({...r,tier,milestones,align});
}
fs.mkdirSync('phase7-audit',{recursive:true});fs.writeFileSync('phase7-audit/matrix.json',JSON.stringify({policy:'tactical',synthetic:true,runs:rows},null,1));log(`PASS ${rows.length} class/difficulty/tier/milestone/alignment runs, zero stalls`);
