import React from 'react';
import {View} from 'react-native';
import Animated,{cancelAnimation,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import AshPuff from './AshPuff';
import {FxSprite} from './fxArt';
import {layer} from '../../theme';
/**
 * Clip the consumed paper upwards. The edge rides the clipping boundary.
 *
 * Android (Fabric) crashed the app the moment a page was chosen on 1.0.64:
 * `IllegalStateException: addViewAt: failed to insert view into parent at index 1`.
 * Cause: the burn edge/ash were inserted as new siblings into a container Fabric had flattened
 * away (and the first fix also swapped the wrapper's view type). So the tree here never changes
 * shape: every container is `collapsable={false}`, the clip wrapper is always the same
 * Animated.View, and the overlay layer always exists — only its contents mount while burning.
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
 const edgeStyle=useAnimatedStyle(()=>({bottom:-24+height*p.value,opacity:p.value>0&&p.value<1?1:0}));
 return <View collapsable={false} style={{width,height,opacity:dim?.65:1}}>
  <Animated.View collapsable={false} style={[{width,overflow:burning?'hidden':'visible'},clipStyle]}>{children}</Animated.View>
  <View collapsable={false} pointerEvents="none" style={{position:'absolute',left:0,top:0,width,height,zIndex:layer.decor}}>
   <Animated.View collapsable={false} style={[{position:'absolute',left:0,width,height:48},edgeStyle]}><FxSprite id="page_burn_edge" style={{width:'100%',height:'100%'}}/></Animated.View>
   {burning&&<AshPuff size={width} duration={600} smoke={0} ash={8}/>}
  </View>
 </View>;
}
