import {pulpColors} from '../theme';
import React from 'react';
import {Animated,View,ImageSourcePropType,StyleSheet} from 'react-native';
import {useGameSettings} from './Settings';
/** Visual transition only. Never dispatch commands or change rewards in an animation callback. */
export default function SceneArrival({source,sceneKey,children}:{source:ImageSourcePropType;sceneKey:string;children:React.ReactNode}){
 const {reducedMotion}=useGameSettings();const progress=React.useRef(new Animated.Value(0)).current;const fade=React.useRef(new Animated.Value(0)).current;const [ready,setReady]=React.useState(false);
 React.useEffect(()=>{setReady(false);progress.setValue(0);fade.setValue(0);const duration=reducedMotion?0:2500;const a=Animated.sequence([Animated.timing(progress,{toValue:1,duration,useNativeDriver:true}),Animated.timing(fade,{toValue:1,duration:reducedMotion?0:450,useNativeDriver:true})]);a.start(({finished})=>{if(finished)setReady(true)});return ()=>a.stop();},[sceneKey,reducedMotion]);
 return <View style={{flex:1,backgroundColor:pulpColors.sceneInk}}><Animated.Image source={source} resizeMode="cover" style={[StyleSheet.absoluteFill,{width:'100%',height:'100%',transform:[{scale:progress.interpolate({inputRange:[0,1],outputRange:[1.02,reducedMotion?1.02:1.1]})},{translateY:progress.interpolate({inputRange:[0,.16,.32,.48,.64,.8,1],outputRange:[0,3,-2,3,-2,2,0]})}]}]}/><Animated.View pointerEvents={ready?'auto':'none'} accessibilityElementsHidden={!ready} importantForAccessibility={ready?'auto':'no-hide-descendants'} style={{flex:1,opacity:fade}}>{children}</Animated.View></View>;
}
