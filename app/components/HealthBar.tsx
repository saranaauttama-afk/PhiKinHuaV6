import React from 'react';
import {View,Text} from 'react-native';
import Animated,{cancelAnimation,useAnimatedStyle,useSharedValue,withDelay,withTiming} from 'react-native-reanimated';
import {useGameSettings} from './Settings';
import {font,healthBarColors,palette,paper} from '../theme';
/** Same ink-framed blood strip on both sides; the empty part stays dark. */
export default function HealthBar({hp,maxHp,label,dark,compact=false}:{hp:number;maxHp:number;label?:string;dark?:boolean;compact?:boolean}) {
 const fraction=Math.max(0,Math.min(1,hp/Math.max(1,maxHp)));
 const reduced=useGameSettings(s=>s.reducedMotion);
 const fill=useSharedValue(fraction),chip=useSharedValue(fraction),width=useSharedValue(0);
 const previous=React.useRef(fraction);
 React.useEffect(()=>{
  cancelAnimation(fill);cancelAnimation(chip);
  const loss=fraction<previous.current;
  fill.value=reduced?fraction:withTiming(fraction,{duration:150});
  chip.value=reduced?fraction:loss?withDelay(350,withTiming(fraction,{duration:400})):withTiming(fraction,{duration:150});
  previous.current=fraction;
  return ()=>{cancelAnimation(fill);cancelAnimation(chip);};
 },[fraction,reduced]);
 const fillStyle=useAnimatedStyle(()=>({width:Math.max(0,width.value-2)*fill.value}));
 const chipStyle=useAnimatedStyle(()=>({width:Math.max(0,width.value-2)*chip.value}));
 return <View style={{gap:4}}>
  {!compact&&<Text style={{fontFamily:font.ui,fontSize:12,color:dark?palette.text:paper.ink}}>{label??'พลังชีวิต'}</Text>}
  <View onLayout={e=>{width.value=e.nativeEvent.layout.width;}} accessible accessibilityRole="progressbar" accessibilityLabel={label??'พลังชีวิต'} accessibilityValue={{min:0,max:maxHp,now:hp}} style={{height:compact?19:23,backgroundColor:healthBarColors.track,overflow:'hidden',borderWidth:1,borderColor:palette.moonDim,borderTopLeftRadius:3,borderBottomRightRadius:3}}>
   <Animated.View pointerEvents="none" style={[{position:'absolute',top:1,bottom:1,left:1,backgroundColor:healthBarColors.chip},chipStyle]}/>
   <Animated.View pointerEvents="none" style={[{position:'absolute',top:1,bottom:1,left:1,backgroundColor:paper.red,borderTopWidth:1,borderTopColor:healthBarColors.fillTop,borderBottomWidth:1,borderBottomColor:healthBarColors.fillBottom},fillStyle]}/>
   <Text style={{fontFamily:font.heading,color:palette.text,fontSize:compact?12:14,textAlign:'center',lineHeight:compact?17:21}}>{hp}/{maxHp}</Text>
  </View>
 </View>;
}
