// src/core/campaign/enemyRules.ts — every ghost's opening rule (กฎเปิดไฟต์).
// The rules are data (data/packs/base/ghost_rules.json), written from the ghost's side:
// `to: 'self'` lands on the ghost, `to: 'enemy'` on the player.
import type {Fx,GameState} from '../types';
import rulesJson from '../../data/packs/base/ghost_rules.json';
import {applyEnemyFx} from '../combat/enemyCardEffects';
import {fxText} from '../cards/describe';

/**
 * `phase2` (bosses, 15 Oct 2026): at or below `belowPct` HP the ghost swaps to `deck` once
 * (combat/ghostMechanics.ts checkGhostPhase); `breakRelic` also breaks the boss relic.
 */
export type GhostRule={name:string;flavor:string;fx:Fx;phase2?:{belowPct:number;deck:string[];text:string;breakRelic?:boolean}};
const RULES:Record<string,GhostRule>=rulesJson as any;

export function ghostRule(id:string):GhostRule|undefined{return RULES[id];}
export function ghostRuleIds():string[]{return Object.keys(RULES);}

/** Badge data for the ghost's status strip. */
export function enemyBattleRule(id:string):{name:string;detail:string;symbol:string}|undefined{
 const r=RULES[id];if(!r)return;
 const p2=r.phase2?`\nเลือดเหลือ ${r.phase2.belowPct}%: ${r.phase2.text}`:'';
 return {name:r.name,detail:`${r.flavor} · เริ่มไฟต์: ${fxText(r.fx,'enemy').join(' · ')}${p2}`,symbol:r.fx.status?.[0]?.id??(r.fx.summon?'minion':'block')};
}

/** Fight start: the ghost's rule takes effect once. */
export function applyEnemyBattleRule(s:GameState):void{
 if(!s.enemy)return;
 const r=RULES[s.enemy.id];
 if(r)applyEnemyFx(s,r.fx,'rule:'+s.enemy.id);
}
