import {describe,it,expect} from 'vitest';
import {battleGeometry} from '../app/battleGeometry';
import {paperPlacement} from '../src/visual/paperPlacement';
import {paperViewport,PAPER_BLEED} from '../src/visual/paperViewport';
const screens=[[360,640],[360,700],[360,720],[360,800],[393,852],[412,915],[432,960],[480,800]];
describe('paper portrait coverage and safe areas',()=>{
 it('keeps world character clear of fixed HUD throughout portrait height changes',()=>{
  for(let h=640;h<=960;h+=4)for(const [top,bottom] of [[0,0],[24,24],[32,48]]){
   const world=paperPlacement(360,h,top,bottom,undefined,battleGeometry(360,h,top,bottom).hudTop-8),hud=battleGeometry(360,h,top,bottom);
   expect(world.footY).toBeLessThan(hud.hudTop);
   expect(Math.abs(paperPlacement(360,h+1,top,bottom,undefined,battleGeometry(360,h+1,top,bottom).hudTop-8).footY-world.footY)).toBeLessThan(1.1);
  }
 });
 for(const [w,h] of screens)for(const [top,bottom] of [[0,0],[24,24],[32,48]])it(`${w}x${h} insets ${top}/${bottom}`,()=>{
  const layout=battleGeometry(w,h,top,bottom),placement=paperPlacement(w,h,top,bottom,undefined,layout.hudTop-8),p=paperViewport(layout,placement.groundY);
  for(const plane of Object.values(p))expect(plane.width/plane.height).toBeCloseTo(1024/1536,12);
  for(const plane of [p.sky,p.forest,p.village]){
   expect(plane.left).toBeLessThanOrEqual(-PAPER_BLEED+1e-9);expect(plane.left+plane.width).toBeGreaterThanOrEqual(w+PAPER_BLEED-1e-9);
   expect(plane.top).toBeLessThanOrEqual(-PAPER_BLEED+1e-9);expect(plane.top+plane.height).toBeGreaterThanOrEqual(h+PAPER_BLEED-1e-9);
  }
  expect(p.village.top+p.village.height*.57).toBeCloseTo(placement.groundY,10);
  expect(p.foliage.top+p.foliage.height).toBeCloseTo(h+PAPER_BLEED,10);
  expect(p.canopy.top).toBeLessThan(0);
  expect(placement.actor.top+placement.actor.height).toBeLessThan(layout.hudTop);
  expect(layout.hudTop+layout.enemyHudHeight+layout.enemyExtrasHeight).toBeLessThan(layout.handTop);
  expect(layout.handTop+layout.handHeight).toBeLessThan(h-layout.playerHudBottom-layout.playerHudHeight);
  expect(layout.playerHudBottom).toBeGreaterThan(bottom);
 });
});
