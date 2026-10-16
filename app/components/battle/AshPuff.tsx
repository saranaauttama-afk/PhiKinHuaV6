import React from 'react';
import {View} from 'react-native';
import Animated,{cancelAnimation,useAnimatedStyle,useSharedValue,withTiming,Easing} from 'react-native-reanimated';
import {useGameSettings} from '../Settings';
import {layer} from '../../theme';
import {FxSprite,useParticleSlots} from './fxArt';
/** View-only, finite sprite burst. Never dispatches or holds an input. */
export default function AshPuff({size=180,duration=1000,smoke=3,ash=8}:{size?:number;duration?:number;smoke?:number;ash?:number}){
 const reduced=useGameSettings(s=>s.reducedMotion);
 const [active,setActive]=React.useState(true);
 React.useEffect(()=>{const t=setTimeout(()=>setActive(false),duration);return ()=>clearTimeout(t);},[duration]);
 const slots=useParticleSlots(smoke+ash,active&&!reduced);
 if(reduced||!active)return null;
 return <View pointerEvents="none" testID="ash-puff" style={{position:'absolute',width:size,height:size,left:0,bottom:0,zIndex:layer.decor}}>
  {Array.from({length:slots},(_,i)=><Wisp key={i} index={i} smoke={i<smoke} size={size} duration={duration}/>)}
 </View>;
}
function Wisp({index,smoke,size,duration}:{index:number;smoke:boolean;size:number;duration:number}){
 const p=useSharedValue(0);
 React.useEffect(()=>{p.value=withTiming(1,{duration,easing:Easing.out(Easing.quad)});return ()=>cancelAnimation(p);},[]);
 const style=useAnimatedStyle(()=>({opacity:Math.sin(p.value*Math.PI)*(smoke?.45:.8),transform:[{translateY:-p.value*size*.65},{translateX:(index%2?1:-1)*p.value*(10+index*3)},{scale:smoke?.6+p.value*.8:1}]}));
 const d=smoke?size*.65:Math.max(5,size*.045);
 return <Animated.View pointerEvents="none" style={[{position:'absolute',bottom:size*.1,left:size*(.15+(index*.137)% .55),width:d,height:d},style]}><FxSprite id={smoke?'incense_smoke':'ash_fleck'} style={{width:'100%',height:'100%'}}/></Animated.View>;
}
