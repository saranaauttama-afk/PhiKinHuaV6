import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

const root=path.resolve(__dirname,'..');
const read=(file:string)=>fs.readFileSync(path.join(root,file),'utf8');
const manifest=JSON.parse(read('docs/nak-muay/generated-art.json'));

describe('นักมวยคาดเชือก production art',()=>{
 it('ships all 56 distinct, transparent 384×384 WebP assets',()=>{
  expect(manifest.assets).toHaveLength(56);
  const hashes=new Set<string>();
  for(const asset of manifest.assets){
   const bytes=fs.readFileSync(path.join(root,asset.path));
   expect(bytes.toString('ascii',0,4),asset.id).toBe('RIFF');
   expect(bytes.toString('ascii',8,12),asset.id).toBe('WEBP');
   expect(bytes.toString('ascii',12,16),asset.id).toBe('VP8X');
   expect(bytes[20]&0x10,asset.id+' needs alpha').toBe(0x10);
   expect(bytes.readUIntLE(24,3)+1,asset.id).toBe(384);
   expect(bytes.readUIntLE(27,3)+1,asset.id).toBe(384);
   const hash=createHash('sha256').update(bytes).digest('hex');
   expect(hashes.has(hash),asset.id+' duplicates another image').toBe(false);
   hashes.add(hash);
  }
 });
 it('uses the new fighter illustrations in active and disabled cards',()=>{
  const [active,disabled]=read('app/cardArt.ts').split('export const GRAY_CARD_ART_SOURCES:');
  const pending=JSON.parse(read('docs/nak-muay/art-prompts.json')).cards;
  expect(pending).toEqual([]);
  for(const a of manifest.assets.filter((a:any)=>a.group==='cards')){
   const reference=`'${a.id}': require('../${a.path}')`;
   expect(active,a.id).toContain(reference);
   expect(disabled,a.id).toContain(reference);
  }
 });
 it('shows each fighter status with its own image in the strip and detail panel',()=>{
  const registry=read('app/components/battle/StatusArt.tsx');
  const strip=read('app/components/battle/StatusStrip.tsx');
  for(const key of ['bruise','stun','rhythm','round','riposte']){
   expect(registry).toContain(`${key}:require('../../../assets/status/status_${key}.webp')`);
   expect(strip).toContain(`${key}:'${key}'`);
  }
  expect(read('src/core/combat/fightBadges.ts')).toContain("name:'สวน',symbol:'riposte'");
 });
});
