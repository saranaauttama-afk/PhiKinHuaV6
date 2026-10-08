import {describe,it,expect} from 'vitest';
import {baseNewState} from '../src/core/commands';
import {runBlessingsTurnHook,getCardPlayedFns,resetBlessingTurnFlags} from '../src/core/blessingRuntime';
import {materializeBlessing} from '../src/core/pack';
import {computeModifiedDamage} from '../src/core/combat/damage';
import type {CardData} from '../src/core/types';
const attack:CardData={id:'test',name:'test',type:'attack',cost:1,dmg:5};const skill:CardData={...attack,type:'skill'};
function setup(id:string){const s=baseNewState('blessing');s.blessings=[JSON.parse(JSON.stringify(materializeBlessing(id)))];s.player.hp=20;s.player.energy=3;s.player.block=0;return s;}
function played(s:ReturnType<typeof setup>,c:CardData){for(const f of getCardPlayedFns(s.blessings![0],c))f({state:s},c);}
describe('Thai blessing metadata survives JSON and executes the promised effect',()=>{
 it.each([['spirit_energy',attack],['herbal_wisdom',skill],['bamboo_dart_power',attack]] as const)('%s gives first matching card energy once each turn',(id,c)=>{const s=setup(id);played(s,c);played(s,c);expect(s.player.energy).toBe(4);resetBlessingTurnFlags(s);played(s,c);expect(s.player.energy).toBe(5);});
 it('free-card blessing does not spend its gate on an earlier paid card',()=>{const s=setup('free_card_energy');played(s,attack);expect(s.player.energy).toBe(3);played(s,{...attack,cost:0});played(s,{...attack,cost:0});expect(s.player.energy).toBe(4);});
 it.each([['ancestral_blessing','on_turn_end','hp',21],['meditation_peace','on_turn_start','block',3],['sacred_cloth','on_turn_end','block',1]] as const)('%s fires its turn hook',(id,hook,key,value)=>{const s=setup(id);runBlessingsTurnHook(s,hook);expect(s.player[key]).toBe(value);});
 it.each([['ghost_protection',attack,'block',2],['life_steal_spirit',attack,'hp',21],['ritual_shield',skill,'block',1]] as const)('%s applies on a matching card',(id,c,key,value)=>{const s=setup(id);played(s,c);expect(s.player[key]).toBe(value);});
 it('protection reduces actual incoming card damage but leaves poison damage alone',()=>{const s=setup('luang_pu_protection');expect(computeModifiedDamage(s,{from:'enemy',to:'player',raw:6,source:{kind:'card',cardId:'test'}})).toBe(5);expect(computeModifiedDamage(s,{from:'enemy',to:'player',raw:3,source:{kind:'status',effectId:'poison'}})).toBe(3);});
 it('naga draws one actual card and grants energy',()=>{const s=setup('naga_blessing');s.piles.draw=[attack];s.piles.hand=[];runBlessingsTurnHook(s,'on_turn_start');expect(s.piles.hand).toHaveLength(1);expect(s.player.energy).toBe(4);});
});
