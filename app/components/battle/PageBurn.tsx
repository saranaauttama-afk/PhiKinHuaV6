import React from 'react';
import {Animated,View} from 'react-native';
import AshPuff from './AshPuff';
import {FxSprite} from './fxArt';
import {layer} from '../../theme';
/** Clip the consumed paper upwards. The edge rides the clipping boundary. */
export default function PageBurn({active,dim,reduced,width,height,children}:{active:boolean;dim:boolean;reduced:boolean;width:number;height:number;children:React.ReactNode}){
 const p=React.useRef(new Animated.Value(0)).current;
 React.useEffect(()=>{p.stopAnimation();p.setValue(0);if(!active||reduced)return;const a=Animated.timing(p,{toValue:1,duration:600,useNativeDriver:false});a.start();return ()=>a.stop();},[active,reduced]);
 return <View style={{width,height,opacity:dim?.65:1}}>
  <Animated.View style={{width,height:active&&!reduced?p.interpolate({inputRange:[0,1],outputRange:[height,0]}):height,overflow:active&&!reduced?'hidden':'visible'}}>{children}</Animated.View>
  {active&&!reduced&&<>
   <Animated.View pointerEvents="none" style={{position:'absolute',left:0,width,height:48,bottom:p.interpolate({inputRange:[0,1],outputRange:[-24,height-24]}),zIndex:layer.decor}}><FxSprite id="page_burn_edge" style={{width:'100%',height:'100%'}}/></Animated.View>
   <AshPuff size={width} duration={600} smoke={0} ash={8}/>
  </>}
 </View>;
}
