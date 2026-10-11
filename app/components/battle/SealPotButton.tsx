import {ritualColors} from '../../theme';
import React from 'react';
import {Image,Pressable,Text,View} from 'react-native';
import {font} from '../../theme';
import {chalk} from '../RitualSurface';
export default function SealPotButton({disabled,onPress}:{disabled?:boolean;onPress:()=>void}){
 const [pressed,setPressed]=React.useState(false);
 return <Pressable accessibilityRole="button" accessibilityLabel={disabled?'ตาของผี…':'จบเทิร์น'} accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress} onPressIn={()=>setPressed(true)} onPressOut={()=>setPressed(false)} style={{width:78,minHeight:58,alignItems:'center',opacity:disabled?.55:1}}>
  <View pointerEvents="none" style={{transform:[{translateY:pressed?3:0},{rotate:pressed?'4deg':'0deg'}]}}><Image source={require('../../../assets/ui/ritual-jar.png')} resizeMode="contain" style={{width:64,height:43}}/></View>
  <Text style={{fontFamily:font.heading,fontSize:11,color:chalk,textShadowColor:ritualColors.shadow,textShadowRadius:3,textShadowOffset:{width:0,height:1}}}>{disabled?'ตาของผี…':'จบเทิร์น'}</Text>
 </Pressable>;
}
