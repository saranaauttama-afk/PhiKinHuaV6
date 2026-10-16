import React from 'react';
import {Image,Modal,Pressable,Text,View} from 'react-native';
import Animated,{useAnimatedStyle,useReducedMotion,useSharedValue,withSequence,withSpring,withTiming} from 'react-native-reanimated';
import {useGameSettings} from '../Settings';
import {combatUiColors} from '../../theme';
import type {MinionState} from '../../../src/core/types';
import {minionDef} from '../../../src/core/combat/minions';
import {STATUS_ART} from './StatusArt';
import DetailPanel from '../DetailPanel';
import {QuietButton} from '../QuietChrome';
import {useBattleLayout} from './battleLayout';
import {fighterColors,font,layer,palette} from '../../theme';

/**
 * ศิษย์ค่าย standing at the ringside: left of the ghost, just above its HUD (the space beside the
 * ghost art is empty on every phone size; above the hand is the ghost's status row).
 * Why figures instead of status badges: a minion is a body that can be hit and fall, and the
 * owner asked for NOTFM-style minions; a badge in the status row read as a buff (nak-muay HANDOFF).
 * `side="enemy"`: the ghost's ลูกสมุน stand on the other side of the ghost (right), same rules
 * (docs/ghosts/NIGHT1-DESIGN.md: one minion rule for both sides, readable at a glance).
 */
/**
 * `inline` (owner playtest 16 Oct 2026: our minions beside the ghost read as the ghost's side):
 * our ศิษย์ค่าย stand small in our own badge row just above the player HUD instead.
 */
export default function MinionRow({minions,size=60,side='player',inline=false,acted}:{minions:MinionState[];size?:number;side?:'player'|'enemy';inline?:boolean;
 /** The minion that just acted (MinionActed): it lunges toward its target and shakes. */acted?:{uid:string;key:string}|null}){
 const {hudTop}=useBattleLayout();
 const [open,setOpen]=React.useState<string|null>(null);
 const sel=minions.find(m=>m.uid===open);
 React.useEffect(()=>{if(open&&!sel)setOpen(null)},[open,sel]);
 if(!minions.length)return null;
 const enemy=side==='enemy';
 const body=enemy?'ลูกสมุนของผี':'ศิษย์ค่าย';
 return <View testID={enemy?'enemy-minion-row':'minion-row'} pointerEvents="box-none" style={inline?{flexDirection:'row',gap:4,alignItems:'center',height:36}:{position:'absolute',...(enemy?{right:6,flexDirection:'row-reverse'}:{left:6,flexDirection:'row'}),top:hudTop-size-22,gap:2,zIndex:layer.control}}>
  {minions.map(m=><Figure key={m.uid} m={m} size={inline?32:size} compact={inline} enemy={enemy} actKey={acted?.uid===m.uid?acted.key:undefined} onPress={()=>setOpen(m.uid)}/>)}
  <Modal visible={!!sel} transparent animationType="fade" onRequestClose={()=>setOpen(null)}>
   <View style={{flex:1,backgroundColor:palette.scrimHeavy,justifyContent:'center',padding:24}}>
    <Pressable accessibilityLabel="ปิด" onPress={()=>setOpen(null)} style={{position:'absolute',top:0,bottom:0,left:0,right:0}}/>
    {sel&&<DetailPanel testID="minion-detail" title={sel.name} art={<Image source={minionArt(sel.id,enemy)} style={{width:72,height:72}} resizeMode="contain"/>}
     description={`${body} · เลือด ${sel.hp}/${sel.maxHp}${sel.turnsLeft!=null?` · อยู่อีก ${sel.turnsLeft} เทิร์น`:''}\n${minionDef(sel.id)?.desc??''}\nล้มแล้วหายไปจนจบไฟต์นี้`}
     actions={<QuietButton label="ปิด" onPress={()=>setOpen(null)}/>}/>}
   </View>
  </Modal>
 </View>;
}

/** Minion art; a ghost minion without its own picture yet uses the ghost-trail silhouette. */
function minionArt(id:string,enemy:boolean){
 return STATUS_ART[id]??(enemy?require('../../../assets/ui/trail-ghost.png'):undefined);
}

function Figure({m,size,onPress,enemy=false,compact=false,actKey}:{m:MinionState;size:number;onPress:()=>void;enemy?:boolean;compact?:boolean;actKey?:string}){
 const systemReduce=useReducedMotion();
 const reduce=useGameSettings(s=>s.reducedMotion)||systemReduce;
 const hit=useSharedValue(0);
 const hitStyle=useAnimatedStyle(()=>({opacity:hit.value}));
 const scale=useSharedValue(reduce?1:.3),shake=useSharedValue(0),lastHp=React.useRef(m.hp);
 const lunge=useSharedValue(0);
 // Acting: a quick lunge toward the other side (ours up toward the ghost, the ghost's down-left) plus a shake.
 React.useEffect(()=>{
  if(!actKey)return;
  if(reduce){scale.value=withSequence(withTiming(1.15,{duration:120}),withTiming(1,{duration:160}));return;}
  lunge.value=withSequence(withTiming(-10,{duration:110}),withTiming(0,{duration:180}));
  shake.value=withSequence(withTiming(-4,{duration:50}),withTiming(4,{duration:60}),withTiming(-2,{duration:50}),withTiming(0,{duration:50}));
 },[actKey]);
 React.useEffect(()=>{if(!reduce)scale.value=withSpring(1,{damping:9,stiffness:160});},[]);
 React.useEffect(()=>{
  if(m.hp<lastHp.current&&!reduce){hit.value=withSequence(withTiming(.85,{duration:40}),withTiming(0,{duration:180}));shake.value=withSequence(withTiming(-5,{duration:50}),withTiming(5,{duration:60}),withTiming(-3,{duration:50}),withTiming(0,{duration:50}));}
  lastHp.current=m.hp;
 },[m.hp]);
 const style=useAnimatedStyle(()=>({transform:[{translateX:shake.value+(enemy?lunge.value:0)},{translateY:enemy?-lunge.value*.4:lunge.value},{scale:scale.value}]}));
 const low=m.hp<=Math.ceil(m.maxHp/3);
 return <Pressable testID={`${enemy?'enemy-':''}minion-${m.id}`} accessibilityRole="button" accessibilityLabel={`${enemy?'ลูกสมุนของผี ':''}${m.name} เลือด ${m.hp}/${m.maxHp}${m.taunt?' รับหมัดแทนผี':''}`} onPress={onPress} hitSlop={4}>
  <Animated.View style={[{width:size,alignItems:'center'},style]}>
   {minionArt(m.id,enemy)?<Image source={minionArt(m.id,enemy)} style={{width:size,height:size}} resizeMode="contain"/>:<View style={{width:size,height:size}}/>}
   {minionArt(m.id,enemy)&&<Animated.View pointerEvents="none" style={[{position:'absolute',top:0,left:0},hitStyle]}><Image source={minionArt(m.id,enemy)} style={{width:size,height:size,tintColor:combatUiColors.hitFlash}} resizeMode="contain"/></Animated.View>}
   <View style={compact?{position:'absolute',bottom:-4,paddingHorizontal:4,borderRadius:7,backgroundColor:fighterColors.plate,borderWidth:1,borderColor:low?fighterColors.plateLow:fighterColors.plateLine}:{marginTop:-8,paddingHorizontal:6,borderRadius:8,backgroundColor:fighterColors.plate,borderWidth:1,borderColor:low?fighterColors.plateLow:fighterColors.plateLine}}>
    <Text style={{fontFamily:font.heading,fontSize:compact?9:12,lineHeight:compact?12:undefined,color:low?fighterColors.hpLow:fighterColors.hpText}}>{m.hp}/{m.maxHp}{m.turnsLeft!=null?` · ${m.turnsLeft}`:''}</Text>
   </View>
  </Animated.View>
 </Pressable>;
}
