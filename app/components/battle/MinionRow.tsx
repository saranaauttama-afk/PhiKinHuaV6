import React from 'react';
import {Image,Modal,Pressable,Text,View} from 'react-native';
import Animated,{useAnimatedStyle,useReducedMotion,useSharedValue,withSequence,withSpring,withTiming} from 'react-native-reanimated';
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
 */
export default function MinionRow({minions,size=60}:{minions:MinionState[];size?:number}){
 const {hudTop}=useBattleLayout();
 const [open,setOpen]=React.useState<string|null>(null);
 const sel=minions.find(m=>m.uid===open);
 React.useEffect(()=>{if(open&&!sel)setOpen(null)},[open,sel]);
 if(!minions.length)return null;
 return <View testID="minion-row" pointerEvents="box-none" style={{position:'absolute',left:6,top:hudTop-size-22,flexDirection:'row',gap:2,zIndex:layer.control}}>
  {minions.map(m=><Figure key={m.uid} m={m} size={size} onPress={()=>setOpen(m.uid)}/>)}
  <Modal visible={!!sel} transparent animationType="fade" onRequestClose={()=>setOpen(null)}>
   <View style={{flex:1,backgroundColor:palette.scrimHeavy,justifyContent:'center',padding:24}}>
    <Pressable accessibilityLabel="ปิด" onPress={()=>setOpen(null)} style={{position:'absolute',top:0,bottom:0,left:0,right:0}}/>
    {sel&&<DetailPanel testID="minion-detail" title={sel.name} art={STATUS_ART[sel.id]?<Image source={STATUS_ART[sel.id]} style={{width:72,height:72}} resizeMode="contain"/>:undefined}
     description={`ศิษย์ค่าย · เลือด ${sel.hp}/${sel.maxHp}${sel.turnsLeft!=null?` · อยู่อีก ${sel.turnsLeft} เทิร์น`:''}\n${minionDef(sel.id)?.desc??''}\nล้มแล้วหายไปจนจบไฟต์นี้`}
     actions={<QuietButton label="ปิด" onPress={()=>setOpen(null)}/>}/>}
   </View>
  </Modal>
 </View>;
}

function Figure({m,size,onPress}:{m:MinionState;size:number;onPress:()=>void}){
 const reduce=useReducedMotion();
 const scale=useSharedValue(reduce?1:.3),shake=useSharedValue(0),lastHp=React.useRef(m.hp);
 React.useEffect(()=>{if(!reduce)scale.value=withSpring(1,{damping:9,stiffness:160});},[]);
 React.useEffect(()=>{
  if(m.hp<lastHp.current&&!reduce)shake.value=withSequence(withTiming(-5,{duration:50}),withTiming(5,{duration:60}),withTiming(-3,{duration:50}),withTiming(0,{duration:50}));
  lastHp.current=m.hp;
 },[m.hp]);
 const style=useAnimatedStyle(()=>({transform:[{translateX:shake.value},{scale:scale.value}]}));
 const low=m.hp<=Math.ceil(m.maxHp/3);
 return <Pressable testID={`minion-${m.id}`} accessibilityRole="button" accessibilityLabel={`${m.name} เลือด ${m.hp}/${m.maxHp}`} onPress={onPress} hitSlop={4}>
  <Animated.View style={[{width:size,alignItems:'center'},style]}>
   {STATUS_ART[m.id]?<Image source={STATUS_ART[m.id]} style={{width:size,height:size}} resizeMode="contain"/>:<View style={{width:size,height:size}}/>}
   <View style={{marginTop:-8,paddingHorizontal:6,borderRadius:8,backgroundColor:fighterColors.plate,borderWidth:1,borderColor:low?fighterColors.plateLow:fighterColors.plateLine}}>
    <Text style={{fontFamily:font.heading,fontSize:12,color:low?fighterColors.hpLow:fighterColors.hpText}}>{m.hp}/{m.maxHp}{m.turnsLeft!=null?` · ${m.turnsLeft}`:''}</Text>
   </View>
  </Animated.View>
 </Pressable>;
}
