import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {THAI_GHOST_POOLS} from '../src/core/monsters/thai-ghosts';
import {GHOST_FOLKLORE} from '../src/core/monsters/folklore';
import {SPECIAL_BLESSINGS} from '../src/core/campaign/nights';
import {fusedArtParents} from '../app/cardArtIdentity';
const root=path.resolve(__dirname,'..');
const read=(file:string)=>fs.readFileSync(path.join(root,file),'utf8');
const sources=(file:string)=>new Map([...read(file).matchAll(/'([^']+)':\s*require\('([^']+)'\)/g)].map(m=>[m[1],m[2]]));

describe('complete researched Thai ghost roster',()=>{
 it('every normal ghost and boss has provenance, matching name and a separate game story',()=>{
  for(const ghost of Object.values(THAI_GHOST_POOLS).flat()){
   const lore=GHOST_FOLKLORE[ghost.id];
   expect(lore,ghost.id).toBeDefined();
   expect(lore.name,ghost.id).toBe(ghost.name);
   expect(lore.origin.length,ghost.id).toBeGreaterThan(30);
   expect(lore.story.length,ghost.id).toBeGreaterThan(20);
   expect(lore.visual.length,ghost.id).toBeGreaterThan(30);
   if(!lore.original)expect(lore.source,ghost.id).toMatch(/^https:\/\//);
  }
  expect(Object.values(GHOST_FOLKLORE).filter(l=>l.original).map(l=>l.name)).toEqual(['ผีกินหัว']);
 });
 it('sacred figures are no longer presented as hostile ghosts',()=>{
  const names=Object.values(THAI_GHOST_POOLS).flat().map(g=>g.name).join(' ');
  for(const name of ['พระอุปคุต','พญานาค','พระยามัจจุราช','เทพอักษร','ยักษ์วัดแจ้ง'])expect(names).not.toContain(name);
 });
 it('map and battle use the same revised ghost artwork',()=>{
  const art=sources('app/components/Art.tsx');
  for(const ghost of Object.values(THAI_GHOST_POOLS).flat())expect(art.get('monster/'+ghost.id)).toContain('monsters/thai-v24/'+ghost.id+'.webp');
  expect(read('app/components/SceneGhostChoices.tsx')).not.toContain('map-pop.png');
  expect(read('app/components/SceneGhostChoices.tsx')).toContain('<GhostLoreButton');
  expect(read('app/components/battle/MonsterArea.tsx')).not.toContain('<GhostLoreButton');expect(read('app/components/battle/MonsterArea.tsx')).toContain('<GhostArt');
 });
});

describe('player card and blessing art coverage',()=>{
 it('every required artwork exists and player cards and blessings have distinct file content',()=>{
  const hashes=new Map<string,string>();const playerIds=new Set(['cards','class_cards','trap_cards','curse_cards','fusion_recipes'].flatMap(f=>JSON.parse(read(`src/data/packs/base/${f}.json`))).map(c=>c.id));playerIds.add('qa_phra_prathan');
  for(const file of ['app/cardArt.ts','app/blessingArt.ts'])for(const [id,asset] of sources(file)){
   const location=path.resolve(root,path.dirname(file),asset);expect(fs.existsSync(location),id+' missing '+asset).toBe(true);
   if(file==='app/blessingArt.ts'||playerIds.has(id)){const hash=createHash('sha256').update(fs.readFileSync(location)).digest('hex');expect(hashes.get(hash),id+' duplicates '+hashes.get(hash)).toBeUndefined();hashes.set(hash,id);}
  }
  for(const [id,asset] of sources('app/components/Art.tsx'))expect(fs.existsSync(path.resolve(root,'app/components',asset)),id+' missing '+asset).toBe(true);
 });

 it('every player card has an individual wired image, including traps and curses',()=>{
  const art=sources('app/cardArt.ts');
  const cards=['cards','class_cards','trap_cards','curse_cards','fusion_recipes'].flatMap(f=>JSON.parse(read(`src/data/packs/base/${f}.json`)));
  const used=new Map<string,string>();
  for(const card of cards){
   const file=art.get(card.id);
   expect(file,card.id).toBeDefined();
   expect(used.get(file!),`${card.id} duplicates ${used.get(file!)}`).toBeUndefined();
   used.set(file!,card.id);
  }
  expect(art.get('thunder_clap')).toContain('/thunder_clap.webp');
  expect(art.get('qa_phra_prathan')).toContain('/qa_phra_prathan.webp');
 });
 it('procedural fusions retain both recognizable parent illustrations',()=>{
  expect(fusedArtParents('fused_temple_blade__holy_water')).toEqual(['temple_blade','holy_water']);
  expect(fusedArtParents('fused_bamboo_volley')).toEqual([]);
  expect(fusedArtParents('temple_blade')).toEqual([]);
 });
 it('base blessings and all four campaign blessings have separate artwork everywhere',()=>{
  const blessings=[...JSON.parse(read('src/data/packs/base/blessings.json')),...Object.values(SPECIAL_BLESSINGS)];
  const objects=sources('app/blessingArt.ts'),slots=sources('app/components/Art.tsx');
  expect(new Set(blessings.map(b=>objects.get(b.id))).size).toBe(blessings.length);
  for(const b of blessings){expect(objects.get(b.id),b.id).toBeDefined();expect(slots.get('blessing/'+b.id),b.id).toContain(b.id+'.webp');}
  expect(read('app/components/BlessingView.tsx')).toContain('BLESSING_ART_SOURCES[b.id]');
 });
});
