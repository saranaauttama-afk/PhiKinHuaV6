import {afterEach,describe,expect,it,vi} from 'vitest';
import {makeCombatState} from './helpers';
import {applyCommand} from '../src/core/reducer';
import {fromSave,toBattleSave} from '../src/core/save';
import {startCombat} from '../src/core/commands';
import {applyStatusEffect} from '../src/core/statusEffectsRuntime';
import {cardCost} from '../src/core/cards/model';
import {armTrap} from '../src/core/combat/traps';
import type {CardData} from '../src/core/types';
import {battleGeometry,enemyHandGeometry} from '../app/battleGeometry';
const attack:CardData={id:'test-hit',name:'ทดสอบตี',type:'attack',fx:{dmg:8}};
afterEach(()=>vi.unstubAllEnvs());
describe('six-card combined combat history',()=>{
 it('records actual HP loss after block; keeps duplicate physical plays and only the last six',()=>{
  let {state:s,rng:r}=makeCombatState({hand:Array.from({length:8},()=>attack),enemyHp:200,enemyBlock:5});
  for(let i=0;i<8;i++){({state:s,rng:r}=applyCommand(s,{type:'PlayCard',index:0},r));if(i===0)expect(s.cardHistory![0].results).toContain('ผีเสีย HP 3');}
  expect(s.cardHistory!.map(e=>e.seq)).toEqual([3,4,5,6,7,8]);expect(s.cardHistory!.every(e=>e.side==='player')).toBe(true);
  expect(s.cardHistory![0].card.instanceId).not.toBe(s.cardHistory![1].card.instanceId);
 });
 it('never records failed, unaffordable or cursed plays',()=>{
  const {state:s,rng:r}=makeCombatState({hand:[{...attack,type:'action',ap:4}],playerAp:0});
  for(const index of [-1,0,99])expect(applyCommand(s,{type:'PlayCard',index},r).state.cardHistory).toEqual([]);
 });
 it('records draw, AP paid and mana gained separately, then survives exact combat resume',()=>{
  let {state:s,rng:r}=makeCombatState({hand:[{id:'resources',name:'ทรัพยากร',type:'action',ap:1,fx:{draw:2,mana:2}}]});
  s.piles.draw=[{...attack,instanceId:'d1'},{...attack,instanceId:'d2'}];
  ({state:s,rng:r}=applyCommand(s,{type:'PlayCard',index:0},r));
  expect(s.cardHistory![0].results).toEqual(expect.arrayContaining(['ใช้แต้ม 1','เราได้มานา 2','เราได้ไพ่ 2 ใบ']));
  const loaded=fromSave(toBattleSave(s,r));expect(loaded.cardHistory).toEqual(s.cardHistory);expect(loaded.cardHistorySeq).toBe(1);
  startCombat(loaded,'phi-krasue');expect(loaded.cardHistory).toEqual([]);expect(loaded.cardHistorySeq).toBe(0);
 });
 it('records overkill as actual HP lost and includes the authorized test win card',()=>{
  vi.stubEnv('EXPO_PUBLIC_TEST_WIN_CARD','1');
  const {state:s,rng:r}=makeCombatState({hand:[{id:'qa_phra_prathan',name:'พระประธาน',type:'action',ap:0,fx:{}}],enemyHp:5,enemyBlock:999,playerAp:0});
  applyStatusEffect('player',s,'corruption',3,2);expect(cardCost(s,s.piles.hand[0])).toEqual({ap:0,mana:0});
  const out=applyCommand(s,{type:'PlayCard',index:0},r).state;expect(out.cardHistory![0].results).toContain('ผีเสีย HP 5');expect(out.combatVictoryLock).toBe(true);expect(out.cardHistory![0].results).not.toContain('ใช้แต้ม 2');
  const f=makeCombatState({hand:[{...attack,fx:{dmg:100}}],enemyHp:5});expect(applyCommand(f.state,{type:'PlayCard',index:0},f.rng).state.cardHistory![0].results).toContain('ผีเสีย HP 5');
 });
 it('interleaves both sides in actual play order and preserves an unplayed recovery card',()=>{
  let {state:s,rng:r}=makeCombatState({hand:[attack],enemyHp:200,playerHp:500});s.enemy!.maxHp=200;s.enemy!.maxEnergy=2;
  s.enemyPiles={hand:['winyan_rerorn_v29_recover'],draw:['claw','claw'],discard:[]};s.enemyHandAges=[1];
  ({state:s,rng:r}=applyCommand(s,{type:'PlayCard',index:0},r));s.enemy!.hp=200;
  ({state:s,rng:r}=applyCommand(s,{type:'ResolveEnemyTurn'},r));
  expect(s.cardHistory!.map(e=>e.side)).toEqual(['player','enemy','enemy']);expect(s.enemyPiles!.hand).toEqual(['winyan_rerorn_v29_recover']);
  const draw=s.pendingEvents!.find(e=>e.t==='EnemyHandChanged')!;expect(draw.frame!.enemy!.handCount).toBe(3);expect(draw).not.toHaveProperty('cardIds');
  const reveals=s.pendingEvents!.filter(e=>e.t==='EnemyCardRevealed');expect(reveals.map(e=>e.frame!.enemy!.handCount)).toEqual([2,1]);
  expect(s.cardHistory!.slice(1).every(e=>e.results.some(r=>r.startsWith('เราเสีย HP')))).toBe(true);
 });
 it('records an interrupted enemy card once without inventing damage',()=>{
  const {state:s,rng:r}=makeCombatState({enemyHp:80,playerHp:500});s.enemy!.maxEnergy=1;s.enemyPiles={hand:['claw'],draw:[],discard:[]};s.enemyDrawPerTurn=0;s.enemyHandAges=[0];
  armTrap(s,{id:'stop',name:'หยุด',type:'counter',fx:{},counter:{trigger:'enemy_attack',negate:true}});
  const out=applyCommand(s,{type:'ResolveEnemyTurn'},r).state;expect(out.cardHistory).toHaveLength(1);expect(out.cardHistory![0].results).toContain('ถูกขัดจังหวะ');expect(out.cardHistory![0].results).not.toContain('เราเสีย HP 5');expect(out.player.hp).toBe(500);
 });
 for(const [w,h] of [[320,568],[360,640],[393,852],[412,915]])it(`${w}x${h}: history, art, held cards and HUD have reserved space`,()=>{
  const g=battleGeometry(w,h,24,24);
  const a=enemyHandGeometry(g,7,0,2),b=enemyHandGeometry(g,7,1,2);
  expect(a.cardW*7+4*6).toBeLessThanOrEqual(a.width+.01);expect(a.left+a.width).toBeLessThanOrEqual(b.left);
  expect(g.monsterTop).toBeGreaterThanOrEqual(24+42);expect(g.monsterTop+g.monsterSize).toBeLessThan(g.enemyHandCenterY-17);expect(g.enemyHandCenterY+17).toBeLessThan(g.hudTop);
 });
});
