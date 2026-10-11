import {describe,expect,it} from 'vitest';
import fs from 'node:fs';
import {PAPER_ENVIRONMENTS,characterPlacement,environmentPlane,registeredStructurePlane,contourPath} from '../src/visual/paperEnvironments';
import {paperPlacement} from '../src/visual/paperPlacement';
import {battleGeometry} from '../app/battleGeometry';
import {JOURNEY_LOCATIONS} from '../app/journeyLocations';
import folklore from '../src/core/monsters/folklore.json';

describe('production paper environments',()=>{
 it('covers all 24 source scenes including secret and every rest location',()=>{
  const files=fs.readdirSync('assets/scence/journey/thai-v24').filter(f=>f.endsWith('.jpg')).map(f=>f.replace('.jpg','')).sort();
  expect(PAPER_ENVIRONMENTS.map(e=>e.id).sort()).toEqual(files);
  expect(JOURNEY_LOCATIONS.every(l=>files.includes(l.id))).toBe(true);
  expect(new Set(PAPER_ENVIRONMENTS.map(e=>JSON.stringify(e.far)+JSON.stringify(e.structures))).size).toBe(24);
 });
 for(const env of PAPER_ENVIRONMENTS)it(env.id+' preserves coverage, sharp source proportions and independent character contact',()=>{
  expect(contourPath(env.structures)).toMatch(/^M .* Z$/);
  for(const [w,h] of [[360,640],[360,720],[393,852],[412,915],[432,960]])for(const [top,bottom] of [[0,0],[24,24],[32,48]]){
   const layout=battleGeometry(w,h,top,bottom);
   const contact=paperPlacement(w,h,top,bottom,env.placement,layout.hudTop-8),p=environmentPlane(w,h,contact.groundY,env.sourceGroundY);
   expect(p.width/p.height).toBeCloseTo(2/3,10);
   expect(p.left).toBeLessThanOrEqual(-24);expect(p.left+p.width).toBeGreaterThanOrEqual(w+24);
   expect(p.top).toBeLessThanOrEqual(-24+1e-8);expect(p.top+p.height).toBeGreaterThanOrEqual(h+24-1e-8);
   expect(p.height).toBeLessThanOrEqual(Math.max(h+48,(w+48)*1.5)+1);
   const structure=registeredStructurePlane(p,contact.groundY,env.sourceGroundY);
   expect(structure.top+structure.height*env.sourceGroundY).toBeCloseTo(contact.groundY);
   for(const id of Object.keys(folklore)){
    const config=characterPlacement(env.id,id),a=paperPlacement(w,h,top,bottom,config,layout.hudTop-8);
    expect(a.actor.top).toBeGreaterThanOrEqual(top+35);
    expect(a.actor.top+a.actor.height).toBeCloseTo(a.footY);
    expect(a.footY).toBeLessThan(layout.hudTop);
    if(config.placementMode==='grounded')expect(a.footY).toBe(a.groundY);else expect(a.footY).toBeLessThan(a.groundY);
   }
  }
 });
 it('retains the approved floating prototype, while human-body ghosts have contact shadows',()=>{
  expect(characterPlacement('01-village','phi-nang-yai').presentationShiftY).toBe(.04);
  expect(characterPlacement('13-cave-river','phi-krasue').placementMode).toBe('floating');
  expect(characterPlacement('04-temple-court','phi-pop').placementMode).toBe('grounded');
  expect(new Set(PAPER_ENVIRONMENTS.map(e=>e.sourceGroundY)).size).toBeGreaterThan(6);
 });
});
