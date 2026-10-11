import {describe,it,expect} from 'vitest';
import {PAPER_ASSEMBLY_MS,PAPER_LAYERS,paperProjection,paperHudOpacity,assemblyProgress} from '../src/visual/paperDiorama';
import {readDioramaSettings} from '../src/visual/dioramaSettings';
describe('paper assembly timeline',()=>{
 it('keeps sky opaque and stationary from first frame through ambient parallax',()=>{
  for(const t of [-1,0,400,1500,2500,3000,9000])expect(paperProjection('sky',t,1,1)).toEqual({opacity:1,scale:1,translateX:0,translateY:0});
 });
 it('overlaps independent scenery, ghost, foliage and fixed HUD across three seconds',()=>{
  expect(PAPER_ASSEMBLY_MS).toBe(3000);
  for(const id of ['forest','village','ghost','foliage'] as const){const l=PAPER_LAYERS[id];expect(paperProjection(id,l.start).opacity).toBe(0);expect(paperProjection(id,l.end).opacity).toBe(1);}
  expect(paperProjection('forest',1300).opacity).toBeGreaterThan(0);expect(paperProjection('ghost',1300).opacity).toBeGreaterThan(0);
  expect(paperProjection('ghost',2000).opacity).toBeLessThan(1);expect(paperProjection('foliage',2000).opacity).toBeGreaterThan(0);
  expect(paperHudOpacity(2500)).toBe(0);expect(paperHudOpacity(3000)).toBe(1);
 });
 it('eases at both ends, rises without zoom and suppresses ambient movement during entry',()=>{
  expect(assemblyProgress(1,0,1000)).toBeLessThan(.00001);expect(1-assemblyProgress(999,0,1000)).toBeLessThan(.00001);
  expect(paperProjection('ghost',1200).translateY).toBe(42);expect(paperProjection('ghost',2300).translateY).toBe(0);
  expect(paperProjection('ghost',2000,1,1)).toEqual(paperProjection('ghost',2000));
  for(const t of [-1,0,1300,2500,3000,9000])for(const id of Object.keys(PAPER_LAYERS) as (keyof typeof PAPER_LAYERS)[])expect(paperProjection(id,t).scale).toBe(1);
 });
 it('defaults old settings to ON and preserves reduced motion',()=>{
  expect(readDioramaSettings(undefined)).toEqual({reducedMotion:false,dioramaAnimation:true});
  expect(readDioramaSettings({reducedMotion:true})).toEqual({reducedMotion:true,dioramaAnimation:true});
  expect(readDioramaSettings({reducedMotion:false,dioramaAnimation:false})).toEqual({reducedMotion:false,dioramaAnimation:false});
 });
});
