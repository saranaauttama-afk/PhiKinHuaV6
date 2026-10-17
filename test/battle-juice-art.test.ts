import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import manifest from '../docs/battle-juice/generated-art.json';
const sizes:Record<string,[number,number]>={incense_smoke:[384,384],ash_fleck:[128,128],victory_rays:[768,768],battle_mist:[1024,256],firefly:[64,64],ink_blood_drop:[128,128],page_burn_edge:[512,256],card_ready_glow:[384,512]};
describe('generated battle effect assets',()=>{
 it('covers the exact eight requested ids once',()=>{expect(manifest.map(a=>a.id).sort()).toEqual(Object.keys(sizes).sort());});
 it.each(manifest)('$id has the recorded hash, real alpha-capable WebP and requested dimensions',asset=>{
  const data=readFileSync(resolve(__dirname,'..',asset.path));
  expect(createHash('sha256').update(data).digest('hex')).toBe(asset.sha256);
  expect(data.toString('ascii',0,4)).toBe('RIFF');expect(data.toString('ascii',8,12)).toBe('WEBP');
  // Lossless VP8L header: width/height are 14 bits, followed by alpha-used bit.
  expect(data.toString('ascii',12,16)).toBe('VP8L');expect(data[20]).toBe(0x2f);
  const bits=data.readUInt32LE(21);
  expect([(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1]).toEqual(sizes[asset.id]);
  expect((bits>>>28)&1).toBe(1);expect(asset.alphaExtrema[0]).toBe(0);
  expect(asset.mode).toBe('built-in image_gen');expect(asset.prompt).toContain('Thai one-baht horror pulp comic effect sprite');
 });
});
