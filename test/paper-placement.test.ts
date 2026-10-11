import {describe,it,expect} from 'vitest';
import {paperPlacement,VILLAGE_PLACEMENT as SHIFTED} from '../src/visual/paperPlacement';
const VILLAGE_PLACEMENT={...SHIFTED,presentationShiftY:0};
const referencePlacement=(w:number,h:number)=>paperPlacement(w,h,0,0,VILLAGE_PLACEMENT);
describe('village ground anchors',()=>{
 for(const [w,h] of [[360,640],[393,852],[432,960]])it(`anchors floating and grounded cutouts at ${w}x${h}`,()=>{
  const float=referencePlacement(w,h),ground=paperPlacement(w,h,0,0,{...VILLAGE_PLACEMENT,placementMode:'grounded'});
  expect(float.footY).toBeLessThan(float.groundY);expect(ground.footY).toBe(ground.groundY);
  for(const p of [float,ground]){expect(p.actor.top+p.actor.height).toBeCloseTo(p.footY,10);expect(p.shadow.top+3).toBe(p.groundY);expect(p.actor.left+p.actor.width/2).toBe(p.groundX);}
 });
 it('preserves approved short and reference ghost framing',()=>{
  expect(referencePlacement(360,640).footY).toBeCloseTo(222.32);expect(referencePlacement(393,852).footY).toBeCloseTo(399.776);
  expect(referencePlacement(432,960).footY).toBeCloseTo(506.48);
 });
 it('supports per-character scale, anchor and floating height without HUD data',()=>{
  const a=referencePlacement(393,852),b=paperPlacement(393,852,0,0,{...VILLAGE_PLACEMENT,groundAnchorX:.6,characterScale:.7,characterOffsetY:-.03,shadowScale:.6});
  expect(b.groundX).toBe(393*.6);expect(b.actor.width/a.actor.width).toBeCloseTo(.7);expect(b.footY).toBeCloseTo(b.groundY-852*.03);expect(b.actor.top+b.actor.height).toBeCloseTo(b.footY);
 });
 it('keeps the approved reference framing and avoids a discontinuity at compact height',()=>{
  expect(referencePlacement(393,852).groundY).toBeCloseTo(410);expect(referencePlacement(360,640).groundY).toBeCloseTo(230);
  expect(Math.abs(referencePlacement(360,641).footY-referencePlacement(360,640).footY)).toBeLessThan(1);
 });
});
