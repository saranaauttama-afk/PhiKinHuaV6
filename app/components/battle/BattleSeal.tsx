import React from 'react';
import {Pressable,Text,View} from 'react-native';
import Animated,{useAnimatedStyle,useReducedMotion,useSharedValue,withSequence,withTiming} from 'react-native-reanimated';
import {badgeColors,font} from '../../theme';

export const BATTLE_SEAL_SIZE=30;
export const BATTLE_SEAL_ART_SIZE=26;
type Props={children:React.ReactNode;label:string;hint?:string;onPress:()=>void;testID?:string;tone?:'positive'|'negative'|'neutral';count?:string|number;muted?:boolean;hitSize?:number;
 /** Changes when this badge just changed a hit (StatusStrip pulse): the seal gives a small shake. */
 shakeKey?:string};
/** One illustrated ink circle for statuses, skills and blessings. */
export default function BattleSeal({children,label,hint,onPress,testID,tone='positive',count,muted=false,hitSize=44,shakeKey}:Props){
 const reduce=useReducedMotion(),x=useSharedValue(0),sc=useSharedValue(1);
 React.useEffect(()=>{
  if(!shakeKey)return;
  // Reduced motion: a short swell instead of a shake, so the link is still visible.
  if(reduce){sc.value=withSequence(withTiming(1.15,{duration:120}),withTiming(1,{duration:180}));return;}
  x.value=withSequence(withTiming(-3,{duration:45}),withTiming(3,{duration:60}),withTiming(-2,{duration:50}),withTiming(0,{duration:45}));
  sc.value=withSequence(withTiming(1.12,{duration:90}),withTiming(1,{duration:160}));
 },[shakeKey]);
 const anim=useAnimatedStyle(()=>({transform:[{translateX:x.value},{scale:sc.value}]}));
 const edge=tone==='negative'?badgeColors.negativeLine:tone==='neutral'?badgeColors.neutralLine:badgeColors.positiveLine;
 const fill=tone==='negative'?badgeColors.negative:tone==='neutral'?badgeColors.neutral:badgeColors.positive;
 return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} onPress={onPress} style={({pressed})=>({width:hitSize,height:hitSize,alignItems:'center',justifyContent:'center',opacity:pressed?.75:1})}>
  <Animated.View style={[anim,{width:BATTLE_SEAL_SIZE,height:BATTLE_SEAL_SIZE,borderRadius:BATTLE_SEAL_SIZE/2,borderWidth:1,borderColor:edge,backgroundColor:fill,alignItems:'center',justifyContent:'center'}]}>
   <View style={{width:BATTLE_SEAL_ART_SIZE,height:BATTLE_SEAL_ART_SIZE,alignItems:'center',justifyContent:'center',opacity:muted?.5:1}}>{children}</View>
   {count!=null&&count!==''&&<View style={{position:'absolute',bottom:-3,right:-3,minWidth:16,height:16,borderRadius:8,backgroundColor:badgeColors.counter,borderWidth:1,borderColor:edge,paddingHorizontal:2,alignItems:'center',justifyContent:'center'}}><Text style={{fontFamily:font.heading,fontSize:10,lineHeight:14,minWidth:10,height:14,flexShrink:0,textAlign:'center',color:badgeColors.ink}}>{count}</Text></View>}
  </Animated.View>
 </Pressable>;
}
