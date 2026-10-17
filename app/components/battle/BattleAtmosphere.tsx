import React from 'react';
import {View,useWindowDimensions} from 'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useSharedValue,withRepeat,withTiming} from 'react-native-reanimated';
import {useGameSettings} from '../Settings';
import {useBattleLayout} from './battleLayout';
import {FxSprite,useBurstActive} from './fxArt';
// Fixed decor seed, completely independent of the combat RNG.
const MOTES=[.08,.73,.32,.91,.48,.19,.62,.85];
export default function BattleAtmosphere(){
 const reduced=useGameSettings(s=>s.reducedMotion),burst=useBurstActive();
 const {width}=useWindowDimensions(),layout=useBattleLayout();
 return <View pointerEvents="none" testID="battle-atmosphere" style={{position:'absolute',inset:0}}>
  <Mist width={width} top={layout.monsterTop+(layout.hudTop-layout.monsterTop)*.5} duration={70000} opacity={.18} reduced={reduced}/>
  <Mist width={width} top={layout.monsterTop+(layout.hudTop-layout.monsterTop)*.68} duration={40000} opacity={.28} reduced={reduced}/>
  {!reduced&&!burst&&MOTES.map((x,i)=><Mote key={i} x={x*width} y={layout.hudTop-10-i*11} index={i}/>)}
 </View>;
}
function Mist({width,top,duration,opacity,reduced}:{width:number;top:number;duration:number;opacity:number;reduced:boolean}){
 const x=useSharedValue(0);
 React.useEffect(()=>{cancelAnimation(x);x.value=0;if(!reduced)x.value=withRepeat(withTiming(-width*2,{duration,easing:Easing.linear}),-1,false);return ()=>cancelAnimation(x);},[width,duration,reduced]);
 const style=useAnimatedStyle(()=>({transform:[{translateX:x.value}]}));
 return <Animated.View pointerEvents="none" style={[{position:'absolute',left:0,top,width:width*3,height:width/4,opacity,flexDirection:'row'},style]}>
  <FxSprite id="battle_mist" style={{width,height:width/4}}/><FxSprite id="battle_mist" style={{width,height:width/4,transform:[{scaleX:-1}]}}/><FxSprite id="battle_mist" style={{width,height:width/4}}/>
 </Animated.View>;
}
function Mote({x,y,index}:{x:number;y:number;index:number}){
 const p=useSharedValue(0);
 React.useEffect(()=>{p.value=withRepeat(withTiming(1,{duration:6500+index*730,easing:Easing.linear}),-1,false);return ()=>cancelAnimation(p);},[]);
 const style=useAnimatedStyle(()=>({opacity:Math.sin(p.value*Math.PI)*(.25+index%3*.1),transform:[{translateY:-p.value*(65+index*8)},{translateX:Math.sin(p.value*Math.PI*2)*(8+index*2)}]}));
 return <Animated.View pointerEvents="none" style={[{position:'absolute',left:x,top:y,width:9,height:9},style]}><FxSprite id="firefly" style={{width:9,height:9}}/></Animated.View>;
}
