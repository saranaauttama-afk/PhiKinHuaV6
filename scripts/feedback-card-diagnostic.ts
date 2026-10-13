// Deterministic engine evidence for the reported early warrior multi-hit damage.
import fs from 'node:fs';
import {makeCombatState} from '../test/helpers';
import {cardById} from '../src/core/pack';
import {applyCommand} from '../src/core/reducer';
const result=[];
for(const star of [1,2,3])for(const useWarCry of [false,true]){
 const knee={...structuredClone(cardById('threefold_strike')!),star};
 const cry=structuredClone(cardById('war_cry')!);
 let {state:s,rng:r}=makeCombatState({hand:useWarCry?[cry,knee]:[knee]});
 s.classId='warrior';s.blessings=[];s.equipped=[];s.player.statusEffects=[];
 s.enemy!.hp=s.enemy!.maxHp=100;s.enemy!.block=0;s.enemy!.statusEffects=[];
 if(useWarCry)({state:s,rng:r}=applyCommand(s,{type:'PlayCard',index:0},r));
 const before=s.enemy!.hp;({state:s,rng:r}=applyCommand(s,{type:'PlayCard',index:0},r));
 result.push({card:knee.id,star,useWarCry,damage:before-s.enemy!.hp});
}
fs.mkdirSync('phase7-audit',{recursive:true});fs.writeFileSync('phase7-audit/warrior-card-diagnostic.json',JSON.stringify({controlledScenario:true,enemyHP:100,enemyArmor:0,blessings:[],result},null,2)+'\n');console.log(JSON.stringify(result));
