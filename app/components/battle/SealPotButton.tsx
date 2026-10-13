import React from 'react';
import {Pressable,Text,View} from 'react-native';
import {font,palette} from '../../theme';
import RitualSurface from '../RitualSurface';
import StatIcon from '../StatIcon';
/** Ring the bell to finish a turn; existing enable/dispatch behavior is unchanged. */
export default function SealPotButton({disabled,onPress}:{disabled?:boolean;onPress:()=>void}) {
 return <Pressable accessibilityRole="button" accessibilityLabel={disabled?'ตาของผี…':'จบเทิร์น'} accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>({width:72,minHeight:50,opacity:disabled?.5:pressed?.75:1,transform:[{translateY:pressed?2:0}]})}>
  <RitualSurface kind="wood" style={{minHeight:50,padding:4,alignItems:'center',justifyContent:'center',gap:2}}>
   <StatIcon name="bell" size={22}/><Text style={{fontFamily:font.heading,fontSize:10,lineHeight:15,color:palette.text,textAlign:'center'}}>{disabled?'ตาของผี…':'จบเทิร์น'}</Text>
  </RitualSurface>
 </Pressable>;
}
