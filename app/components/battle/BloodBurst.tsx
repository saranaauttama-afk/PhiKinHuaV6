import React from 'react';
import {View} from 'react-native';
import Animated,{cancelAnimation,useAnimatedStyle,useSharedValue,withTiming,Easing} from 'react-native-reanimated';
import {useGameSettings} from '../Settings';
import {layer} from '../../theme';
import {FxSprite,useParticleSlots} from './fxArt';
export default function BloodBurst(){
 const reduced=useGameSettings(s=>s.reducedMotion),[active,setActive]=React.useState(true);
 React.useEffect(()=>{const t=setTimeout(()=>setActive(false),450);return ()=>clearTimeout(t);},[]);
 const slots=useParticleSlots(5,active&&!reduced);
 if(!active||reduced)return null;
 return <View testID="player-ink-burst" pointerEvents="none" style={{position:'absolute',left:34,top:35,width:1,height:1,zIndex:layer.decor}}>{Array.from({length:slots},(_,i)=><Drop key={i} index={i}/>)}</View>;
}
function Drop({index}:{index:number}){
 const p=useSharedValue(0);
 React.useEffect(()=>{p.value=withTiming(1,{duration:450,easing:Easing.out(Easing.quad)});return ()=>cancelAnimation(p);},[]);
 const angle=(-160+index*65)*Math.PI/180;
 const style=useAnimatedStyle(()=>({opacity:(1-p.value)*.85,transform:[{translateX:Math.cos(angle)*p.value*(28+index*4)},{translateY:Math.sin(angle)*p.value*32+p.value*p.value*18},{scale:.5+p.value*.5}]}));
 return <Animated.View pointerEvents="none" style={[{position:'absolute',width:15,height:15},style]}><FxSprite id="ink_blood_drop" style={{width:15,height:15}}/></Animated.View>;
}
