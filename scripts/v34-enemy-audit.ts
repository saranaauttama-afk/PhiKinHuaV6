import fs from 'node:fs';
import {getAllMonsterIds,getMonsterById} from '../src/core/monsters/thai-ghosts';
import {NIGHT_ENEMY_DECKS,NIGHT_AWAKENED_DECKS,ENEMY_ARCHETYPES} from '../src/core/campaign/enemyDecks';
import {allEnemyCards,enemyCardById} from '../src/core/pack_enemy_cards';
import {baseNewState} from '../src/core/commands';
import {configureNightEnemy} from '../src/core/campaign/nights';
import {buildAndShuffleEnemyDeck} from '../src/core/engine/handlers/enemy';
import {makeRng} from '../src/core/rng';
import {getAllMinionTypes} from '../src/core/minionRuntime';
import {curseById} from '../src/core/pack';
const statuses=['fear','poison','curse','corruption','entangle','weakness','vulnerable','draw_reduction','regeneration','strength','block_next','thorns','dodge','energy_boost','spell_charging'];
const rows=getAllMonsterIds().map(id=>{
 const m=getMonsterById(id)!,ids=NIGHT_ENEMY_DECKS[id]??[],cards=[...new Set(ids)].map(id=>enemyCardById(id));
 const kind=m.tier.includes('Boss')?'boss':m.tier==='Elite'?'elite':'normal';
 const s=baseNewState('audit');s.campaign={night:1,difficulty:1,unlocks:[]};s.pages={current:{offers:[kind==='boss'?{kind:'boss',enemyId:id,bossType:'final'}:{kind:'monster',enemyId:id,tier:kind}],resolved:[false]},_activeOfferIndex:0,adventure:{version:5}} as any;
 s.enemy={id,name:m.name,hp:m.hp,maxHp:m.hp,dmg:0,block:0,ai:{cycle:[],index:0}};configureNightEnemy(s);buildAndShuffleEnemyDeck(s,makeRng('audit'));
 const invalid=cards.flatMap((c,i)=>!c?[`missing ${[...new Set(ids)][i]}`]:[
  ...(!Number.isFinite(c.energyCost)||c.energyCost<0?[`${c.id}: invalid cost`]:[]),
  ...(!c.dmg&&!c.block&&!c.heal&&!c.summonMinion&&!c.curseCard&&!c.statusEffect?[`${c.id}: no effect`]:[]),
  ...(c.summonMinion&&!getAllMinionTypes()[c.summonMinion]?[`${c.id}: invalid minion`]:[]),
  ...(c.curseCard&&!curseById(c.curseCard)?[`${c.id}: invalid curse`]:[]),
  ...(c.statusEffect&&!statuses.includes(c.statusEffect.effect)?[`${c.id}: invalid status`]:[]),
 ]);
 const detail=cards.filter(Boolean).map(c=>({id:c!.id,name:c!.name,copies:ids.filter(id=>id===c!.id).length,owner:c!.owner,cost:c!.energyCost,type:c!.type,damage:c!.dmg??0,hits:c!.hits??1,block:c!.block??0,heal:c!.heal??0,status:c!.statusEffect,summon:c!.summonMinion,curse:c!.curseCard,...((c as any)?.conditional?{conditional:(c as any).conditional}:{})}));
 return {id,name:m.name,classification:kind,tier:m.tier,archetype:ENEMY_ARCHETYPES[id],definitions:allEnemyCards().filter(c=>c.owner===id).length,deckCopies:ids.length,uniqueCards:cards.length,handSize:s.enemy.handSize,drawPerTurn:(s as any).enemyDrawPerTurn??null,maxRetained:(s as any).enemyMaxRetained??0,energy:s.enemy.maxEnergy,sharedCards:cards.filter(c=>c&&c.owner!==id).map(c=>c!.id),invalid,awakenedUnique:new Set(NIGHT_AWAKENED_DECKS[id]??[]).size,cards:detail};
});
const output=process.env.V34_AUDIT??'docs/v34-enemy-audit.json';fs.writeFileSync(output,JSON.stringify({definitions:allEnemyCards().length,rows},null,2)+'\n');console.log(`${rows.length} ghosts, ${rows.flatMap(r=>r.invalid).length} invalid deck effects`);
