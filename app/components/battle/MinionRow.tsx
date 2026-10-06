import React from 'react';
import {Pressable,Text,View,ScrollView,Modal,Image} from 'react-native';
import Animated,{FadeInUp,FadeOutDown,useSharedValue,useAnimatedStyle,withSequence,withTiming} from 'react-native-reanimated';
import type {MinionData} from '../../../src/core/types_extended';
import {visibleMinions,minionSummary,minionTemplateId} from '../../../src/core/combat/minions/display';
import {artSource} from '../Art';
import RitualSurface from '../RitualSurface';
import {font,palette,surface,tint} from '../../theme';
// Source-space head windows: clip the existing transparent illustrations in the view.
// The source files stay intact and are still available for full-body presentations.
const heads:Record<string,{x:number;y:number;w:number;h:number}>={
 kuman_spirit:{x:82,y:18,w:92,h:96},ghost_ally:{x:84,y:15,w:74,h:79},
 demon_minion:{x:82,y:27,w:103,h:120},poison_spirit:{x:62,y:28,w:63,h:73},
 shadow_clone:{x:143,y:25,w:64,h:62},tree_guardian:{x:83,y:64,w:77,h:78},
 ancient_warrior_spirit:{x:99,y:16,w:55,h:70},spirit_snail:{x:181,y:86,w:70,h:95},
 forest_demon:{x:88,y:18,w:99,h:111},
};
function Head({m,size=42}:{m:MinionData;size?:number}){
 const id=minionTemplateId(m.id),crop=heads[id]??{x:64,y:0,w:128,h:128};const scale=size/crop.w;
 return <View pointerEvents="none" style={{width:size,height:size,overflow:'hidden'}}><Image accessible={false} source={artSource(`minion/${id}`)} resizeMode="stretch" style={{position:'absolute',width:256*scale,height:256*scale,left:-crop.x*scale,top:-crop.y*scale}}/></View>;
}
type Props={minions?:MinionData[];activeId?:string;owner:'player'|'enemy'};
export default function MinionRow({minions,activeId,owner}:Props){
 const [open,setOpen]=React.useState<string|null>(null);const all=visibleMinions(minions).filter(m=>m.owner===owner);const selected=all.find(m=>m.id===open);
 if(!all.length)return null;
 return <View style={{paddingHorizontal:4}}>
 <ScrollView horizontal showsHorizontalScrollIndicator={all.length>5} contentContainerStyle={{gap:10,paddingVertical:3}}>{all.map(m=><Spirit key={m.id} m={m} active={m.id===activeId} selected={m.id===open} onPress={()=>setOpen(m.id)}/>)}</ScrollView>
 <Modal visible={!!selected} transparent animationType="fade" onRequestClose={()=>setOpen(null)}>
  <View style={{flex:1,backgroundColor:palette.scrimHeavy,justifyContent:'center',padding:24}}>
   {selected&&<RitualSurface kind="wood" style={{padding:22,gap:12}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:12}}><Head m={selected} size={64}/><View style={{flex:1}}><Text style={{fontFamily:font.heading,color:palette.moon,fontSize:18}}>{selected.name}</Text><Text style={{fontFamily:font.ui,color:palette.text,fontSize:13}}>เหลือ {selected.duration} เทิร์น</Text></View></View>
    <Text style={{fontFamily:font.body,color:palette.text,fontSize:21}}>{minionSummary(selected)}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="ปิดรายละเอียดมินเนี่ยน" onPress={()=>setOpen(null)} style={{minHeight:48,justifyContent:'center',alignItems:'center'}}><Text style={{fontFamily:font.heading,color:palette.moon}}>ปิด</Text></Pressable>
   </RitualSurface>}
  </View>
 </Modal>
 </View>;
}
function Spirit({m,active,selected,onPress}:{m:MinionData;active:boolean;selected:boolean;onPress:()=>void}){
 const y=useSharedValue(0);React.useEffect(()=>{if(active)y.value=withSequence(withTiming(-6,{duration:160}),withTiming(0,{duration:280}))},[active]);const anim=useAnimatedStyle(()=>({transform:[{translateY:y.value}]}));
 return <Animated.View entering={FadeInUp.duration(300)} exiting={FadeOutDown.duration(250)} style={anim}><Pressable accessibilityRole="button" accessibilityLabel={`${m.name} เหลือ ${m.duration} เทิร์น`} onPress={onPress} style={{width:52,height:48,alignItems:'center',justifyContent:'flex-end',backgroundColor:active||selected?tint.moonSoft:surface.glassDim,borderRadius:8}}><Head m={m}/><View style={{position:'absolute',right:0,bottom:0,minWidth:18,height:18,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:active?tint.bloodLine:surface.panelDeep}}><Text style={{fontFamily:font.heading,fontSize:11,color:palette.moon}}>{m.duration}</Text></View></Pressable></Animated.View>;
}
