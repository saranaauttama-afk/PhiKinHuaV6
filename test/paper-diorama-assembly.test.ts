import {describe,it,expect} from 'vitest';
import {PAPER_ASSEMBLY_MS,PAPER_LAYERS,paperProjection,paperHudOpacity} from '../src/visual/paperDiorama';
import {readDioramaSettings} from '../src/visual/dioramaSettings';
describe('paper assembly timeline',()=>{
 it('reveals sky, forest/village, ghost, foliage and fixed HUD in order',()=>{
  expect(PAPER_ASSEMBLY_MS).toBe(1800);
  for(const id of Object.keys(PAPER_LAYERS) as (keyof typeof PAPER_LAYERS)[]){const l=PAPER_LAYERS[id];expect(paperProjection(id,l.start).opacity).toBe(0);expect(paperProjection(id,l.end).opacity).toBe(1);}
  expect(paperProjection('sky',300).opacity).toBe(1);expect(paperProjection('forest',300).opacity).toBe(0);
  expect(paperProjection('village',700).opacity).toBe(1);expect(paperProjection('ghost',700).opacity).toBe(0);
  expect(paperProjection('ghost',1100).opacity).toBe(1);expect(paperProjection('foliage',1100).opacity).toBe(0);
  expect(paperHudOpacity(1500)).toBe(0);expect(paperHudOpacity(1800)).toBe(1);
 });
 it('raises ghost without any zoom and clamps stale/late timeline values',()=>{
  const initial=paperProjection('ghost',700),middle=paperProjection('ghost',900),final=paperProjection('ghost',1800);
  expect(initial.translateY).toBe(54);expect(middle.translateY).toBeLessThan(54);expect(final.translateY).toBe(0);
  for(const t of [-1,0,350,900,1400,1800,9000])for(const id of Object.keys(PAPER_LAYERS) as (keyof typeof PAPER_LAYERS)[])expect(paperProjection(id,t).scale).toBe(1);
  expect(paperProjection('ghost',-10).opacity).toBe(0);expect(paperProjection('ghost',9000).opacity).toBe(1);
 });
 it('uses independent directions and at most one pixel ambient drift',()=>{
  expect(paperProjection('forest',0).translateX).toBeLessThan(0);expect(paperProjection('village',0).translateX).toBeGreaterThan(0);
  for(const id of Object.keys(PAPER_LAYERS) as (keyof typeof PAPER_LAYERS)[])expect(Math.abs(paperProjection(id,1800,1).translateX)).toBeLessThanOrEqual(1);
 });
 it('defaults old settings to ON and preserves the reduced motion value',()=>{
  expect(readDioramaSettings(undefined)).toEqual({reducedMotion:false,dioramaAnimation:true});
  expect(readDioramaSettings({reducedMotion:true})).toEqual({reducedMotion:true,dioramaAnimation:true});
  expect(readDioramaSettings({reducedMotion:false,dioramaAnimation:false})).toEqual({reducedMotion:false,dioramaAnimation:false});
 });
});
