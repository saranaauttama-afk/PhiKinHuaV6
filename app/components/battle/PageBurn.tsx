import React from 'react';
import {View} from 'react-native';
import Animated,{cancelAnimation,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import AshPuff from './AshPuff';
import {FxSprite} from './fxArt';
import {layer} from '../../theme';
/**
 * Clip the consumed paper upwards. The edge rides the clipping boundary.
 * Reanimated (UI thread), not RN `Animated`: the card sits inside PageFade, which drives its own
 * RN Animated values natively; a JS-driven RN `Animated` height inside it crashed the Android app
 * the moment a page was chosen (native smoke on 1.0.64, bisected to J8, 16 Oct 2026).
 */
export default function PageBurn({active,dim,reduced,width,height,children}:{active:boolean;dim:boolean;reduced:boolean;width:number;height:number;children:React.ReactNode}){
 const burning=active&&!reduced;
 const p=useSharedValue(0);
 React.useEffect(()=>{
  cancelAnimation(p);p.value=0;
  if(burning)p.value=withTiming(1,{duration:600});
  return ()=>cancelAnimation(p);
 },[burning]);
 const clipStyle=useAnimatedStyle(()=>({height:height*(1-p.value)}));
 const edgeStyle=useAnimatedStyle(()=>({bottom:-24+(height)*p.value}));
 return <View style={{width,height,opacity:dim?.65:1}}>
  {burning
   ?<Animated.View style={[{width,overflow:'hidden'},clipStyle]}>{children}</Animated.View>
   :<View style={{width,height}}>{children}</View>}
  {burning&&<>
   <Animated.View pointerEvents="none" style={[{position:'absolute',left:0,width,height:48,zIndex:layer.decor},edgeStyle]}><FxSprite id="page_burn_edge" style={{width:'100%',height:'100%'}}/></Animated.View>
   <AshPuff size={width} duration={600} smoke={0} ash={8}/>
  </>}
 </View>;
}
