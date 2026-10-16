import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {createRequire} from 'node:module';
import {URL} from 'node:url';
import {readFileSync} from 'node:fs';
import {useGameSettings} from '../src/ui/gameSettings';
import {hitFeedback} from '../app/components/battle/hitFeedback';
import {schedulePageChoice} from '../app/components/battle/pageChoice';
import type {CombatEvent} from '../src/core/types';

// Small host-free hook renderer: time is real fake-timer time, animation values stay pending.
// This tests the production component's handlers/props without loading native Hermes modules.
const hooks=vi.hoisted(()=>({values:[] as any[],cursor:0,pending:[] as (()=>void)[],animations:[] as any[]}));
vi.mock('react',async load=>{
 const actual:any=await load();
 const api={
  useState(initial:any){const i=hooks.cursor++;if(!(i in hooks.values))hooks.values[i]=typeof initial==='function'?initial():initial;return [hooks.values[i],(next:any)=>{hooks.values[i]=typeof next==='function'?next(hooks.values[i]):next;}];},
  useRef(initial:any){const i=hooks.cursor++;if(!(i in hooks.values))hooks.values[i]={current:initial};return hooks.values[i];},
  useEffect(fn:()=>void|(()=>void),deps?:any[]){const i=hooks.cursor++,old=hooks.values[i];if(!old||!deps||deps.some((v,k)=>!Object.is(v,old.deps?.[k]))){hooks.pending.push(()=>{old?.cleanup?.();hooks.values[i]={deps,cleanup:fn()};});}},
  useCallback:(fn:any)=>fn,useContext:()=>true,
 };
 return {...actual,...api,default:{...actual.default,...api}};
});
vi.mock('react-native',()=>({View:'View',Text:'Text',Image:'Image',Pressable:'Pressable',ScrollView:'ScrollView',useWindowDimensions:()=>({width:390,height:844})}));
vi.mock('react-native-reanimated',()=>({
 default:{View:'Animated.View'},
 useSharedValue:(v:any)=>{const i=hooks.cursor++;if(!(i in hooks.values))hooks.values[i]={value:v};return hooks.values[i];},
 useAnimatedStyle:(fn:any)=>fn(),cancelAnimation:vi.fn(),
 withTiming:(target:any,config:any)=>{const a={target,config};hooks.animations.push(a);return a;},
 withDelay:(delay:any,animation:any)=>({delay,animation}),
}));
vi.mock('../app/components/Settings',()=>({useGameSettings:(select:any)=>select(useGameSettings.getState())}));
vi.mock('../app/components/battle/PageBurn',()=>({default:'PageBurn'}));
vi.mock('../app/components/EncounterPortrait',()=>({default:'EncounterPortrait'}));
vi.mock('../app/components/encounterClue',()=>({encounterClue:()=>''}));
vi.mock('../app/components/offerDisplay',()=>({describeOffer:()=>({name:'ร้าน'}),ghostTierLabel:()=>null}));
vi.mock('../app/components/InkIcon',()=>({default:'InkIcon'}));
vi.mock('../app/components/RitualSurface',()=>({default:'RitualSurface'}));
vi.mock('../app/components/QuietChrome',()=>({QuietButton:'QuietButton'}));
vi.mock('../app/components/CloseSeal',()=>({default:'CloseSeal'}));
vi.mock('../app/components/SceneArrival',()=>({SceneContentVisible:{}}));
const require=createRequire(import.meta.url);
require.extensions['.webp']=(module,filename)=>{module.exports=filename;};

import HealthBar from '../app/components/HealthBar';
const {default:AdventureChoices}=await import('../app/components/AdventureChoices');
import {useCombatTimeline} from '../app/components/battle/useCombatTimeline';

function render<T>(fn:()=>T):T{hooks.cursor=0;const tree=fn();const effects=hooks.pending.splice(0);effects.forEach(fn=>fn());return tree;}
function find(tree:any,test:(e:any)=>boolean):any{
 if(!tree||typeof tree!=='object')return;
 if(test(tree))return tree;
 for(const child of [tree.props?.children].flat(Infinity)){const match=find(child,test);if(match)return match;}
}
function dispose(){hooks.values.forEach(v=>v?.cleanup?.());hooks.values=[];hooks.pending=[];hooks.animations=[];hooks.cursor=0;}
beforeEach(()=>{vi.useFakeTimers();dispose();useGameSettings.setState({reducedMotion:false,enemySpeed:1});});
afterEach(()=>{dispose();vi.useRealTimers();});
const wound=(target:'player'|'enemy',hpLoss:number)=>({t:'Damage',target,hpLoss,raw:10,modified:10,blocked:10-hpLoss,died:false,sourceKind:'card'} as const);

describe('battle juice production presentation',()=>{
 it.each(['player','enemy'] as const)('J1/J9 armour-only hits on %s produce no wound feedback',target=>{
  expect(hitFeedback(wound(target,0),40,true)).toEqual({enemy:false,player:false,heavy:false});
  expect(hitFeedback(wound(target,1),40)[target]).toBe(true);
 });
 it('heavy screen feedback requires player flesh damage',()=>{
  expect(hitFeedback(wound('player',10),40).heavy).toBe(true);
  expect(hitFeedback(wound('enemy',10),40,true).heavy).toBe(false);
  expect(hitFeedback(wound('player',1),40,true).heavy).toBe(true);
 });
 it('J2 exposes current HP immediately while the 350+400ms chip is pending',()=>{
  let hp=40;const draw=()=>HealthBar({hp,maxHp:40,compact:true});render(draw);
  hp=23;const tree=render(draw);
  const bar=find(tree,e=>e.props?.accessibilityRole==='progressbar');
  expect(bar.props.accessibilityValue).toEqual({min:0,max:40,now:23});
  expect(hooks.values.some(v=>v?.value?.delay===350&&v.value.animation.config.duration===400)).toBe(true);
  hp=29;expect(find(render(draw),e=>e.props?.accessibilityRole==='progressbar').props.accessibilityValue.now).toBe(29);
 });
 it('J2 reduced motion sets both fractions without scheduling width animation',()=>{
  useGameSettings.setState({reducedMotion:true});const tree=render(()=>HealthBar({hp:7,maxHp:40}));
  expect(find(tree,e=>e.props?.accessibilityRole==='progressbar').props.accessibilityValue.now).toBe(7);
  expect(hooks.animations).toHaveLength(0);
 });
 it('J8 actual reduced-motion Enter handler runs synchronously with no 600ms timer',()=>{
  useGameSettings.setState({reducedMotion:true});const onEnter=vi.fn();
  const props:any={offers:[{kind:'shop_card'}],resolved:[false],slotIds:['page-1'],onEnter};
  let tree=render(()=>AdventureChoices(props));
  find(tree,e=>e.props?.testID==='adventure-slot-0').props.onPress();
  tree=render(()=>AdventureChoices(props));
  const timers=vi.getTimerCount();find(tree,e=>e.props?.testID==='adventure-enter-0').props.onPress();
  expect(onEnter).toHaveBeenCalledWith(props.offers[0],0);expect(vi.getTimerCount()).toBe(timers);
 });
 it('J8 reduced-motion Destroy also runs immediately',()=>{
  useGameSettings.setState({reducedMotion:true});const onDestroy=vi.fn();
  const props:any={offers:[{kind:'shop_card'}],resolved:[false],slotIds:['destroy-page'],onEnter:vi.fn(),onDestroy};
  let tree=render(()=>AdventureChoices(props));find(tree,e=>e.props?.testID==='adventure-slot-0').props.onPress();tree=render(()=>AdventureChoices(props));
  find(tree,e=>e.props?.testID==='adventure-destroy-0').props.onPress();expect(onDestroy).toHaveBeenCalledWith(0);expect(vi.getTimerCount()).toBe(0);
 });
 it('J8 replacing a page cancels its pending choice',()=>{
  const onEnter=vi.fn();const props:any={offers:[{kind:'shop_card'}],resolved:[false],slotIds:['old-page'],onEnter};
  let tree=render(()=>AdventureChoices(props));find(tree,e=>e.props?.testID==='adventure-slot-0').props.onPress();tree=render(()=>AdventureChoices(props));find(tree,e=>e.props?.testID==='adventure-enter-0').props.onPress();
  props.slotIds=['new-page'];render(()=>AdventureChoices(props));vi.advanceTimersByTime(600);expect(onEnter).not.toHaveBeenCalled();
 });
 it('J8 normal choice waits exactly 600ms, accepts once, and cancels on unmount',()=>{
  const onEnter=vi.fn();const props:any={offers:[{kind:'shop_card'}],resolved:[false],slotIds:['page-2'],onEnter};
  let tree=render(()=>AdventureChoices(props));find(tree,e=>e.props?.testID==='adventure-slot-0').props.onPress();tree=render(()=>AdventureChoices(props));
  const enter=find(tree,e=>e.props?.testID==='adventure-enter-0').props.onPress;enter();enter();
  vi.advanceTimersByTime(599);expect(onEnter).not.toHaveBeenCalled();vi.advanceTimersByTime(1);expect(onEnter).toHaveBeenCalledTimes(1);
  enter();dispose();vi.advanceTimersByTime(600);expect(onEnter).toHaveBeenCalledTimes(1);
 });
 it('J8 changing reduced motion during the burn completes once immediately',()=>{
  const onEnter=vi.fn();const props:any={offers:[{kind:'shop_card'}],resolved:[false],slotIds:['page-3'],onEnter};
  let tree=render(()=>AdventureChoices(props));find(tree,e=>e.props?.testID==='adventure-slot-0').props.onPress();tree=render(()=>AdventureChoices(props));find(tree,e=>e.props?.testID==='adventure-enter-0').props.onPress();
  vi.advanceTimersByTime(120);useGameSettings.setState({reducedMotion:true});render(()=>AdventureChoices(props));
  expect(onEnter).toHaveBeenCalledTimes(1);vi.advanceTimersByTime(600);expect(onEnter).toHaveBeenCalledTimes(1);
 });
 it('cancelled page choices never dispatch',()=>{
  const action=vi.fn();const cancel=schedulePageChoice(false,action);cancel();vi.advanceTimersByTime(600);expect(action).not.toHaveBeenCalled();
 });
 it.each([1,1.5,2] as const)('J10 production hook plays using persisted setting %s× (DURATION / speed)',speed=>{
  useGameSettings.getState().setEnemySpeed(speed);
  const draw=()=>useCombatTimeline({speed:useGameSettings.getState().enemySpeed});
  let t=render(draw);const done=vi.fn();const reveal:CombatEvent={t:'EnemyCardRevealed',cardId:'test',name:'test',dmg:0,block:0};
  t.play([reveal,wound('player',3)],done);t=render(draw);expect(t.current?.t).toBe('EnemyCardRevealed');expect(t.speed).toBe(speed);
  vi.advanceTimersByTime(2100/speed-1);expect(render(draw).current?.t).toBe('EnemyCardRevealed');
  vi.advanceTimersByTime(1);expect(render(draw).current?.t).toBe('Damage');
  vi.advanceTimersByTime(450/speed);expect(render(draw).isPlaying).toBe(false);expect(done).toHaveBeenCalledOnce();
 });
 it('J10 speed changes apply next batch; skip completes once and clears its timer',()=>{
  let speed=1;const draw=()=>useCombatTimeline({speed});let t=render(draw);const done=vi.fn();t.play([wound('player',1)],done);
  speed=2;t=render(draw);expect(t.speed).toBe(1);t.skip();vi.runAllTimers();expect(done).toHaveBeenCalledOnce();
  t=render(draw);t.play([wound('player',2)]);expect(render(draw).speed).toBe(2);
 });
 it('J10 store persists both controls and validates stored speed on hydration',async()=>{
  const storage=(await import('@react-native-async-storage/async-storage')).default;
  useGameSettings.getState().setReducedMotion(true);useGameSettings.getState().setEnemySpeed(1.5);
  expect(JSON.parse((await storage.getItem('phi-ui-settings'))!)).toEqual({reducedMotion:true,enemySpeed:1.5});
  useGameSettings.setState({reducedMotion:false,enemySpeed:1});await useGameSettings.getState().hydrate();expect(useGameSettings.getState().enemySpeed).toBe(1.5);expect(useGameSettings.getState().reducedMotion).toBe(true);
  await storage.setItem('phi-ui-settings',JSON.stringify({enemySpeed:99}));await useGameSettings.getState().hydrate();expect(useGameSettings.getState().enemySpeed).toBe(1);
 });
 it('battle passes the setting to the hook and uses the same batch speed for enemy cards',()=>{
  const source=readFileSync(new URL('../app/battle.tsx',import.meta.url),'utf8');
  expect(source).toContain('useCombatTimeline({speed:enemySpeed})');expect(source).toContain('<EnemyHandCard speed={timeline.speed}');
  expect(source).not.toContain('onAttackPeak={() => flashRef.current?.flash()}');
 });
});
