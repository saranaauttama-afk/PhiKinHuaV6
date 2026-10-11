import {describe,it,expect} from 'vitest';
import {battleGeometry} from '../app/battleGeometry';
import {paperViewport,PAPER_BLEED} from '../src/visual/paperViewport';
const screens=[[360,640],[360,800],[393,852],[412,915],[432,960],[480,800]];
describe('paper portrait coverage and safe areas',()=>{
 for(const [w,h] of screens)for(const [top,bottom] of [[0,0],[24,24],[32,48]])it(`${w}x${h} insets ${top}/${bottom}`,()=>{
  const layout=battleGeometry(w,h,top,bottom),p=paperViewport(layout);
  for(const plane of Object.values(p))expect(plane.width/plane.height).toBeCloseTo(1024/1536,12);
  for(const plane of [p.sky,p.forest,p.village]){
   expect(plane.left).toBeLessThanOrEqual(-PAPER_BLEED+1e-9);expect(plane.left+plane.width).toBeGreaterThanOrEqual(w+PAPER_BLEED-1e-9);
   expect(plane.top).toBeLessThanOrEqual(-PAPER_BLEED+1e-9);expect(plane.top+plane.height).toBeGreaterThanOrEqual(h+PAPER_BLEED-1e-9);
  }
  expect(p.village.top+p.village.height*.57).toBeCloseTo(layout.hudTop-12,10);
  expect(p.foliage.top+p.foliage.height).toBeCloseTo(h+PAPER_BLEED,10);
  expect(p.canopy.top).toBeLessThan(0);
  expect(layout.monsterTop+layout.monsterSize).toBeLessThan(layout.hudTop);
  expect(layout.hudTop+layout.enemyHudHeight+layout.enemyExtrasHeight).toBeLessThan(layout.handTop);
  expect(layout.handTop+layout.handHeight).toBeLessThan(h-layout.playerHudBottom-layout.playerHudHeight);
  expect(layout.playerHudBottom).toBeGreaterThan(bottom);
 });
});
