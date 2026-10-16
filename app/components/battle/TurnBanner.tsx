import React from 'react';
import {Text} from 'react-native';
import Animated,{cancelAnimation,useAnimatedStyle,useSharedValue,withDelay,withSequence,withTiming} from 'react-native-reanimated';
import RitualSurface from '../RitualSurface';
import {useGameSettings} from '../Settings';
import {font,layer,paper,combatUiColors} from '../../theme';
export default function TurnBanner({side,turn,top,suppressed}:{side:'player'|'enemy';turn:number;top:number;suppressed:boolean}){
 const reduced=useGameSettings(s=>s.reducedMotion);
 const [visible,setVisible]=React.useState(true);
 const p=useSharedValue(0),opacity=useSharedValue(1);
 React.useEffect(()=>{
  setVisible(true);p.value=0;opacity.value=1;
  p.value=reduced?1:withTiming(1,{duration:180});
  opacity.value=withDelay(reduced?700:880,withTiming(0,{duration:160}));
  const t=setTimeout(()=>setVisible(false),reduced?860:1040);
  return ()=>{clearTimeout(t);cancelAnimation(p);cancelAnimation(opacity);};
 },[side,turn,reduced]);
 const style=useAnimatedStyle(()=>({opacity:opacity.value,transform:[{translateY:reduced?0:-24*(1-p.value)}]}));
 if(!visible||suppressed)return null;
 return <Animated.View testID="turn-banner" pointerEvents="none" style={[{position:'absolute',top,left:24,right:24,alignItems:'center',zIndex:layer.popup},style]}>
  <RitualSurface kind="hudPaper" style={{paddingHorizontal:24,paddingVertical:10}}><Text style={{fontFamily:font.heading,fontSize:16,color:side==='enemy'?combatUiColors.hitFlash:paper.ink}}>{side==='player'?'ตาเรา':'ตาผี'}</Text></RitualSurface>
 </Animated.View>;
}
