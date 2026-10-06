import React from 'react';
import {Pressable,Text,View,ScrollView} from 'react-native';
import Animated,{FadeInUp,FadeOutDown,useSharedValue,useAnimatedStyle,withSequence,withTiming} from 'react-native-reanimated';
import type {MinionData} from '../../../src/core/types_extended';
import {visibleMinions,minionSummary,minionTemplateId} from '../../../src/core/combat/minions/display';
import Art from '../Art';
import {font,palette,surface,tint} from '../../theme';
type Props={minions?:MinionData[];activeId?:string};
export default function MinionRow({minions,activeId}:Props){
 const [open,setOpen]=React.useState<string|null>(null);const all=visibleMinions(minions);const selected=all.find(m=>m.id===open);
 return <View pointerEvents="box-none" style={{paddingHorizontal:10,gap:3}}>
 <View style={{flexDirection:'row',justifyContent:'space-between',gap:8}}>{(['player','enemy'] as const).map(owner=><View key={owner} style={{maxWidth:'48%'}}><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:3}}>{all.filter(m=>m.owner===owner).map(m=><Spirit key={m.id} m={m} active={m.id===activeId} onPress={()=>setOpen(open===m.id?null:m.id)}/>)}</ScrollView></View>)}</View>
 {selected&&<Pressable onPress={()=>setOpen(null)} style={{backgroundColor:surface.panelDeep,padding:8,borderRadius:5}}><Text style={{fontFamily:font.ui,color:palette.moon,fontSize:12}}>{selected.name} · เหลือ {selected.duration} เทิร์น</Text><Text style={{fontFamily:font.body,color:palette.text,fontSize:18}}>{minionSummary(selected)}</Text></Pressable>}
 </View>;
}
function Spirit({m,active,onPress}:{m:MinionData;active:boolean;onPress:()=>void}){
 const x=useSharedValue(0);React.useEffect(()=>{if(active)x.value=withSequence(withTiming(m.owner==='player'?14:-14,{duration:160}),withTiming(0,{duration:280}))},[active]);const anim=useAnimatedStyle(()=>({transform:[{translateX:x.value}]}));
 return <Animated.View entering={FadeInUp.duration(500)} exiting={FadeOutDown.duration(450)} style={anim}><Pressable accessibilityRole="button" accessibilityLabel={`${m.name} เหลือ ${m.duration} เทิร์น`} onPress={onPress} style={{width:58,alignItems:'center'}}><Art slot={`minion/${minionTemplateId(m.id)}`} width={58} height={68}/><View style={{backgroundColor:active?tint.bloodLine:surface.glassDim,paddingHorizontal:3,borderRadius:3}}><Text numberOfLines={1} style={{fontFamily:font.heading,fontSize:9,color:palette.moon}}>{m.name}</Text><Text style={{fontFamily:font.ui,fontSize:9,color:palette.text,textAlign:'center'}}>{m.duration} เทิร์น</Text></View></Pressable></Animated.View>;
}
